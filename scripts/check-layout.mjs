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

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

const args = process.argv.slice(2);
const isJson = args.includes("--json");
const warnOnly = args.includes("--warn-only");

// --name 의 값을 읽는다. (check-snapshot.mjs 와 같은 이유로 indexOf+1 관용구를 쓰지 않는다)
function getArg(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) return fallback;
  return v;
}

const snapshotPath = getArg(
  "--snapshot",
  "design/04-screens/figma-snapshot.json",
);
const rulesPath = getArg("--rules", "design/03-design-rules/design-rules.md");
const onlyPage = getArg("--page", null);

// 토큰 문서 페이지는 제품 UI 가 아니다 (문서 카드는 고정 크기가 규격이다)
const SKIP_PAGES = new Set(["01 Tokens"]);

// 넘침 허용 오차(px). 1px 반올림과 스트로크 때문에 0 으로 두면 오탐이 난다.
const TOLERANCE = 1;

// 하네스가 늘 면제하는 것들. 프로젝트별 예외는 여기 말고 design-rules.md 에 적는다.
//   · DeviceFrame/상태바/홈 인디케이터: 기기 물리 치수
//   · Img/ 슬롯: 이미지 비율이 곧 높이
//   · Icon/: 아이콘은 정사각 고정
//   · Divider/Spacer/Track: 선·여백·바 자체가 높이다
const BUILTIN_EXEMPT =
  /^(DeviceFrame|Status ?Bar|Home ?Indicator|Safe ?Area|Divider|Spacer|Track|Img\/|Icon\/)/i;

// 컨테이너로 볼 타입 (고정 높이 검사 대상)
const CONTAINER_TYPES = new Set(["FRAME", "COMPONENT", "COMPONENT_SET"]);

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

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
const canCheck = schemaVersion >= 3;

// ==================== design-rules 의 예외 선언 파싱 ====================

// { 컴포넌트명: "hug" | "fixed" }
function parseHeightDeclarations(path) {
  const map = new Map();
  if (!existsSync(path)) return map;

  let current = null;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const heading = line.match(/^###\s+(.+?)\s*(?:\(|$)/);
    if (heading) {
      // "SearchBar / FilterChip / Tab" 처럼 한 헤딩에 여러 개를 적는 경우가 있다
      current = heading[1]
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }
    if (!current) continue;

    const m = line.match(/^[-*]\s*Height\s*:\s*(hug|fixed)/i);
    if (m) {
      for (const name of current) map.set(name, m[1].toLowerCase());
    }
  }
  return map;
}

const heightDecl = parseHeightDeclarations(rulesPath);

// 노드 이름에서 컴포넌트 이름을 뽑는다.
//   "MarketCard"                  → MarketCard
//   "Button/Variant=primary"      → Button
//   "MissionCard · 제목"          → MissionCard
function componentNameOf(node) {
  const base = String(node.mainComponent || node.name || "");
  return base.split(/[/·,]/)[0].trim();
}

function isExempt(node) {
  const name = String(node.name || "");
  if (BUILTIN_EXEMPT.test(name)) return "하네스 기본 면제";
  const decl = heightDecl.get(componentNameOf(node));
  if (decl === "fixed") return "design-rules 가 fixed 로 선언";
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
        const exempt = isExempt(node);
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
        !isExempt(node)
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
      if (!node.parentId || !node.position || !node.size) continue;
      const parent = byId.get(node.parentId);
      if (!parent || !parent.position || !parent.size) continue;

      const pad = parent.padding || { bottom: 0, right: 0 };
      const childBottom = node.position.y + node.size.height;
      const parentBottom =
        parent.position.y + parent.size.height - (pad.bottom || 0);
      const childRight = node.position.x + node.size.width;
      const parentRight =
        parent.position.x + parent.size.width - (pad.right || 0);

      const overBottom = Math.round(childBottom - parentBottom);
      const overRight = Math.round(childRight - parentRight);

      if (overBottom > TOLERANCE || overRight > TOLERANCE) {
        const parts = [];
        if (overBottom > TOLERANCE) parts.push(`아래로 ${overBottom}px`);
        if (overRight > TOLERANCE) parts.push(`오른쪽으로 ${overRight}px`);
        findings.push({
          rule: "content-overflow",
          page: page.name,
          frame: frame.name,
          node: node.name,
          id: node.id,
          detail: `"${parent.name}"(${parent.size.width}×${parent.size.height}) 밖으로 ${parts.join(" / ")} 넘침`,
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
