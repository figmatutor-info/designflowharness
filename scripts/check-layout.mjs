#!/usr/bin/env node
/**
 * check-layout.mjs
 *
 * "컨테이너가 내부 콘텐츠를 감싸는가"를 판정한다.
 *
 * 왜 필요한가:
 *   figma-builder 지시문에는 예전부터 "모든 컴포넌트 오토레이아웃"이라고 적혀 있었다.
 *   그런데도 카드 컨테이너가 고정 높이로 만들어져 제목 아래 텍스트가 카드 밖으로
 *   삐져나오는 산출물이 나왔다. 적힌 규칙은 지켜지지 않고, 검사되는 규칙만 지켜진다.
 *
 *   특히 Figma Plugin API 는 오토레이아웃 프레임에 `resize(w, h)` 를 호출하면
 *   sizing mode 를 FIXED 로 바꾼다. HUG 로 만들어 놓고 크기를 맞추려고 resize 를
 *   부르는 순간 조용히 풀린다. 사람 눈으로는 스크린샷을 봐야만 보인다.
 *
 * 두 가지를 본다:
 *   1) 고정 높이 컨테이너 — layout.vSizing === "FIXED" 인 오토레이아웃 컨테이너
 *   2) 콘텐츠 넘침       — 자식의 아래/오른쪽 끝이 부모 밖으로 나감
 *   (2)는 (1)의 결과로 실제 사고가 났다는 증거다.
 *
 *   ⚠️ 둘 다 schema_version 3 이 필요하다. (1)은 node.layout, (2)는 node.parentId 를 쓴다.
 *      v2 스냅샷에는 두 필드가 없어서 "위반 0건"이 아니라 "검사 불가"다.
 *      조용히 통과시키면 게이트가 있으나 마나이므로, v2 면 FAIL 시키고 재추출을 요구한다.
 *
 * 예외(의도적 고정 높이)는 design-rules.md 가 선언한다:
 *   컴포넌트 규칙의 각 `### 컴포넌트명` 아래에 `- Height: hug` 또는
 *   `- Height: fixed(app-bar-height)` 를 적는다. fixed 로 적힌 것만 (1)에서 면제된다.
 *   → 규범은 하네스가, 예외는 규칙 SSOT 가 갖는다.
 *
 * 사용법:
 *   node scripts/check-layout.mjs                    # 컴포넌트·화면 페이지 전부
 *   node scripts/check-layout.mjs --page "02 Components"
 *   node scripts/check-layout.mjs --warn-only        # FAIL 대신 경고만 (exit 0)
 *   node scripts/check-layout.mjs --json
 *
 * exit code:
 *   0: PASS (또는 --warn-only)
 *   1: FAIL
 */

import { readFileSync, existsSync } from "node:fs";
import { getArg, hasFlag, createLog } from "./lib/cli.mjs";
import {
  BUILTIN_EXEMPT,
  CONTAINER_TYPES,
  TOLERANCE,
  LAYOUT_MIN_SCHEMA,
  parseHeightDecl,
  componentNameOf,
  overflowOf,
  isScrollViewport,
  describeOverflow,
} from "./lib/layout-rules.mjs";

const isJson = hasFlag("--json");
const warnOnly = hasFlag("--warn-only");

const snapshotPath = getArg(
  "--snapshot",
  "design/04-screens/figma-snapshot.json",
);
const rulesPath = getArg("--rules", "design/03-design-rules/design-rules.md");
const onlyPage = getArg("--page", null);

// 토큰 문서 페이지는 제품 UI 가 아니다 (문서 카드는 고정 크기가 규격이다)
const SKIP_PAGES = new Set(["01 Tokens"]);

// 컴포넌트 세트 직속 variant 면제를 적용하는 페이지. 스냅샷 프레임에는 type 이 없어서
// "프레임 직속(parentId 없음)" 만으로는 세트인지 화면인지 구분할 수 없다 — 화면 페이지에서
// 이 면제가 켜지면 DeviceFrame 직속 노드 전체가 새어 나간다.
const COMPONENT_SET_PAGES = new Set(["02 Components"]);

// TOLERANCE · BUILTIN_EXEMPT · CONTAINER_TYPES 는 figma-audit.mjs 와 공유 (scripts/lib/layout-rules.mjs)

const log = createLog(isJson);

// ==================== 로드 ====================

if (!existsSync(snapshotPath)) {
  log(`파일 없음: ${snapshotPath}`, "red");
  process.exit(1);
}

let snap;
try {
  snap = JSON.parse(readFileSync(snapshotPath, "utf-8"));
} catch (err) {
  log(`JSON 파싱 실패: ${err.message}`, "red");
  process.exit(1);
}

const schemaVersion = snap.schema_version ?? 0;
// layout(고정 높이)도 parentId(넘침)도 v3 부터 들어온다. v2 면 아무것도 판정할 수 없다.
const canCheck = schemaVersion >= LAYOUT_MIN_SCHEMA;

// ==================== design-rules 의 예외 선언 파싱 ====================

// { 컴포넌트명: "hug" | "fixed" } — 파서는 figma-audit.mjs 와 공유한다
const heightDecl = parseHeightDecl(
  existsSync(rulesPath) ? readFileSync(rulesPath, "utf-8") : "",
);

function isExempt(node, frame, pageName) {
  if (isScrollViewport(node)) return true;
  const name = String(node.name || "");
  if (BUILTIN_EXEMPT.test(name)) return "하네스 기본 면제";
  if (heightDecl.get(componentNameOf(node)) === "fixed")
    return "design-rules 가 fixed 로 선언";
  // 컴포넌트 세트 안의 variant 는 이름이 "Variant=primary, Size=sm, …" 라 컴포넌트명이 안 나온다.
  // 세트 직속(parentId 없음)이면 세트(프레임) 이름으로 선언을 찾는다.
  // 컴포넌트 페이지에서만 — 화면 페이지의 프레임 직속 노드에도 parentId 가 없기 때문.
  if (
    frame &&
    COMPONENT_SET_PAGES.has(pageName) &&
    node.parentId == null &&
    heightDecl.get(componentNameOf(frame)) === "fixed"
  )
    return "design-rules 가 fixed 로 선언 (컴포넌트 세트)";
  return null;
}

// ==================== 검사 ====================

const findings = [];
const pagesChecked = [];
let nodesScanned = 0;
let truncatedFrames = 0;

for (const page of snap.pages || []) {
  if (!page || SKIP_PAGES.has(page.name)) continue;
  if (onlyPage && page.name !== onlyPage) continue;
  // v4 docs 프로필은 layout/parentId 가 없다. 조용히 0건 PASS 가 되지 않도록 대상에서 뺀다.
  if (page.profile === "docs") {
    log(
      `  ⚠ "${page.name}" 은 docs 프로필 — 레이아웃 검사 대상 아님 (건너뜀)`,
      "yellow",
    );
    continue;
  }
  pagesChecked.push(page.name);

  for (const frame of page.frames || []) {
    if (frame.truncated) truncatedFrames++;
    const nodes = frame.nodes || [];
    const byId = new Map(nodes.map((n) => [n.id, n]));

    for (const node of nodes) {
      nodesScanned++;

      if (!canCheck) continue;

      // ── 1) 고정 높이 컨테이너 ─────────────────────────────────────────
      if (
        CONTAINER_TYPES.has(node.type) &&
        node.layout &&
        node.layout.layoutMode &&
        node.layout.layoutMode !== "NONE" &&
        node.layout.vSizing === "FIXED"
      ) {
        const exempt = isExempt(node, frame, page.name);
        if (!exempt) {
          findings.push({
            rule: "fixed-height",
            page: page.name,
            frame: frame.name,
            node: node.name,
            id: node.id,
            detail: `오토레이아웃(${node.layout.layoutMode}) 컨테이너인데 세로가 FIXED (높이 ${node.size?.height}). HUG 여야 한다`,
          });
        }
      }

      // 오토레이아웃이 아예 없는 컨테이너도 잡는다. 자식이 있는데 레이아웃이 없으면
      // 내용이 늘어날 때 감쌀 방법 자체가 없다.
      if (
        CONTAINER_TYPES.has(node.type) &&
        node.layout &&
        node.layout.layoutMode === "NONE" &&
        nodes.some((n) => n.parentId === node.id) &&
        !isExempt(node, frame, page.name)
      ) {
        findings.push({
          rule: "no-auto-layout",
          page: page.name,
          frame: frame.name,
          node: node.name,
          id: node.id,
          detail: "자식이 있는 컨테이너인데 오토레이아웃이 없다",
        });
      }

      // ── 2) 콘텐츠 넘침 ────────────────────────────────────────────────
      if (!node.parentId) continue;
      const parent = byId.get(node.parentId);
      const over = overflowOf(node, parent);
      if (over && over.exceeded) {
        findings.push({
          rule: "content-overflow",
          page: page.name,
          frame: frame.name,
          node: node.name,
          id: node.id,
          detail: `"${parent.name}"(${parent.size.width}×${parent.size.height}) 밖으로 ${describeOverflow(over)} 넘침`,
        });
      }
    }
  }
}

// ==================== 출력 ====================

const byRule = (r) => findings.filter((f) => f.rule === r);
const passed = findings.length === 0;

if (isJson) {
  console.log(
    JSON.stringify(
      {
        snapshot: snapshotPath,
        schema_version: schemaVersion,
        sizing_checked: canCheck,
        checked_at: new Date().toISOString(),
        pages: pagesChecked,
        nodes_scanned: nodesScanned,
        findings,
        passed,
      },
      null,
      2,
    ),
  );
  process.exit(passed || warnOnly ? 0 : 1);
}

log("");
log("📐 레이아웃 거동 검증 (컨테이너가 내용을 감싸는가)", "cyan");
log("─".repeat(50));
log(
  `  대상: ${pagesChecked.join(", ") || "(없음)"} · 노드 ${nodesScanned}개`,
  "dim",
);

if (!canCheck) {
  log("");
  log(
    `  ✗ schema_version ${schemaVersion} — 레이아웃을 판정할 수 없다 (v3 필요).`,
    "red",
  );
  log(
    "    node.layout / node.parentId 가 없어서 고정 높이도 넘침도 못 본다.",
    "red",
  );
  log(
    "    scripts/figma-snapshot.js (v3) 로 해당 페이지를 다시 추출할 것.",
    "yellow",
  );
  log("");
  process.exit(warnOnly ? 0 : 1);
}
if (truncatedFrames > 0) {
  log("");
  log(
    `  ⚠ 노드가 잘린 프레임 ${truncatedFrames}개 — 그 안쪽은 판정 못 했다.`,
    "yellow",
  );
}

const RULE_LABEL = {
  "fixed-height": "고정 높이 컨테이너",
  "no-auto-layout": "오토레이아웃 없는 컨테이너",
  "content-overflow": "콘텐츠 넘침",
};

for (const rule of Object.keys(RULE_LABEL)) {
  const list = byRule(rule);
  log("");
  log(
    `${list.length === 0 ? "  ✓" : "  ✗"} ${RULE_LABEL[rule]} — ${list.length}건`,
    list.length === 0 ? "green" : "red",
  );
  for (const f of list.slice(0, 12)) {
    log(`    · [${f.frame}] ${f.node}`, "reset");
    log(`      ${f.detail}`, "dim");
  }
  if (list.length > 12) log(`    … 외 ${list.length - 12}건`, "dim");
}

log("");
log(
  passed ? "  통과" : `  위반 ${findings.length}건`,
  passed ? "green" : warnOnly ? "yellow" : "red",
);
log("");

if (!passed) {
  log("→ 고치는 법 (figma-builder):", "yellow");
  log('  · 컨테이너: frame.layoutSizingVertical = "HUG"', "yellow");
  log(
    "  · 오토레이아웃 프레임에 resize(w, h) 를 부르지 말 것 — sizing 이 FIXED 로 풀린다",
    "yellow",
  );
  log(
    '  · 폭만 정하려면 resize 대신 layoutSizingHorizontal = "FILL" 또는 width 만 조정',
    "yellow",
  );
  log(
    "  · 의도적 고정이면 design-rules.md 컴포넌트 항목에 `- Height: fixed(토큰)` 을 선언",
    "yellow",
  );
  log("");
}

process.exit(passed || warnOnly ? 0 : 1);
