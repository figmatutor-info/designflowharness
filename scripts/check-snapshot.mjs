#!/usr/bin/env node
/**
 * check-snapshot.mjs
 *
 * figma-snapshot.json 이 figma-audit.mjs 의 입력 계약을 만족하는지 선검증.
 *
 * 왜 필요한가:
 *   figma-audit.mjs 는 필드가 없어도 예외를 던지지 않는다. 조용히 "위반 0건"으로
 *   통과시키거나, 반대로 화면마다 FAIL 을 쏟는다. 어느 쪽이든 audit 결과를 믿을 수 없다.
 *   audit 을 돌리기 전에 "스냅샷 자체가 쓸 만한가"를 먼저 판정한다.
 *
 * 사용법:
 *   node scripts/check-snapshot.mjs
 *   node scripts/check-snapshot.mjs --stage tokens
 *   node scripts/check-snapshot.mjs --json
 *
 * 옵션:
 *   --snapshot <path>  기본: design/04-screens/figma-snapshot.json
 *   --file-key <path>  기본: design/04-screens/figma-file-key.txt
 *   --stage <name>     tokens | components | screens (기본: screens)
 *   --min-frames <n>   screens 스테이지 최소 화면 수 (기본: 5)
 *   --json             JSON 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync } from "node:fs";

// ==================== 설정 ====================

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const args = process.argv.slice(2);
const isJson = args.includes("--json");
// --name 의 값을 읽는다.
// ⚠️ `args[args.indexOf(name) + 1] || fallback` 패턴을 쓰지 말 것.
//    플래그가 없으면 indexOf 가 -1 이고 -1+1=0 이라 args[0] 이 값으로 잡힌다.
//    그래서 `--json` / `--strict` / `--stage` 같은 첫 플래그가 파일 경로로 읽혀
//    "파일 없음" 으로 죽거나(심하면 --json 이라 로그까지 막혀 무음 실패) 한다.
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
const fileKeyPath = getArg(
  "--file-key",
  "design/04-screens/figma-file-key.txt",
);
const stage = getArg("--stage", "screens");
const minFrames = parseInt(getArg("--min-frames", "5"), 10);

// 최신 계약. 3 부터 레이아웃 거동(node.layout / parentId), 4 부터 프로필(docs/full)과
// 빈 값 키 생략(fills/strokes 가 비면 키 없음)이 들어있다.
const SCHEMA_VERSION = 4;
// 2 도 통과시킨다 (기존 산출물 보호). 단 레이아웃 검사는 못 돌린다고 경고한다.
const MIN_SCHEMA_VERSION = 2;

// figma-audit.mjs 가 각 노드에서 반드시 읽는 필드.
// fills/strokes 는 v4 부터 비어 있으면 키가 없으므로 필수에서 뺐다 (audit 은 `|| []` 로 읽는다).
const REQUIRED_NODE_FIELDS = ["id", "name", "type", "size", "position"];

// 프로필별 허용 stage. docs 는 토큰 문서 페이지에서만 허용된다 —
// 컴포넌트·화면을 docs 로 뽑으면 색·레이아웃·탭타겟이 전부 빠져 audit 이 허위 PASS 한다.
const DOCS_ALLOWED_STAGES = new Set(["tokens"]);

const STAGE_PAGE = {
  tokens: "01 Tokens",
  components: "02 Components",
  screens: "03 Screens",
};

const results = [];

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function add(name, pass, detail) {
  results.push({ name, pass, detail });
}

function fail(msg) {
  add("스냅샷 로드", false, msg);
  report();
  process.exit(1);
}

// ==================== 로드 ====================

function loadSnapshot() {
  if (!existsSync(snapshotPath)) {
    fail(
      `파일 없음: ${snapshotPath} (figma-builder가 STAGE 완료 시 Write 해야 함)`,
    );
  }
  try {
    return JSON.parse(readFileSync(snapshotPath, "utf-8"));
  } catch (err) {
    fail(`JSON 파싱 실패: ${err.message}`);
  }
}

// ==================== 검사 ====================

function checkMeta(snap) {
  const v = snap.schema_version;
  add(
    "schema_version 허용 범위",
    typeof v === "number" && v >= MIN_SCHEMA_VERSION && v <= SCHEMA_VERSION,
    `현재 ${v ?? "없음"} (허용 ${MIN_SCHEMA_VERSION}~${SCHEMA_VERSION}) — figma-snapshot.js 로 생성했는지 확인`,
  );

  // v2 스냅샷은 layout / parentId 가 없어 고정 높이를 판정할 수 없다.
  // 통과는 시키되, 검사에 구멍이 있다는 사실은 반드시 눈에 보이게 남긴다.
  if (v === 2) {
    log(
      "  ⚠ schema_version 2 — 레이아웃 거동 필드 없음. check-layout.mjs 를 돌리려면",
      "yellow",
    );
    log("    figma-snapshot.js(v3)로 스냅샷을 다시 추출해야 한다.", "yellow");
  }

  const hasKey = typeof snap.file_key === "string" && snap.file_key.length > 0;
  const placeholder = snap.file_key === "__FILE_KEY__";
  add(
    "file_key 존재",
    hasKey && !placeholder,
    placeholder ? "__FILE_KEY__ 치환 안 됨" : hasKey ? snap.file_key : "없음",
  );

  // 사용자가 지정한 파일에 작업했는지 대조
  if (existsSync(fileKeyPath) && hasKey && !placeholder) {
    const expected = readFileSync(fileKeyPath, "utf-8").trim();
    add(
      "file_key 가 figma-file-key.txt 와 일치",
      expected === snap.file_key,
      expected === snap.file_key
        ? "일치"
        : `txt=${expected} / snapshot=${snap.file_key} — 다른 파일에 작업함`,
    );
  }

  const dateOk =
    typeof snap.snapshot_date === "string" &&
    !isNaN(Date.parse(snap.snapshot_date));
  add(
    "snapshot_date 유효",
    dateOk,
    dateOk ? snap.snapshot_date : "없음 또는 형식 오류",
  );
}

function checkPages(snap) {
  const pages = snap.pages;
  if (!Array.isArray(pages)) {
    add(
      "pages 배열 존재",
      false,
      "pages 없음 — figma-snapshot.js 는 page 하나를 반환한다. figma-builder가 pages 배열로 병합해야 함",
    );
    return null;
  }
  add("pages 배열 존재", true, `${pages.length}개 페이지`);

  const targetName = STAGE_PAGE[stage] || STAGE_PAGE.screens;
  const page = pages.find((p) => p?.name === targetName);
  add(
    `"${targetName}" 페이지 존재`,
    Boolean(page),
    page
      ? "있음"
      : `없음 (수집된 페이지: ${pages.map((p) => p?.name).join(", ") || "없음"})`,
  );

  // v4 프로필. docs 는 tokens 페이지에서만. v3 이하는 profile 이 없고 전부 full 로 간주한다.
  if (page) {
    const profile = page.profile ?? "full";
    const ok = profile === "full" || DOCS_ALLOWED_STAGES.has(stage);
    add(
      "페이지 프로필 허용",
      ok,
      ok
        ? `profile=${profile}`
        : `profile=${profile} — stage=${stage} 는 full 로 뽑아야 한다 (__PROFILE__ → "full" 로 재추출)`,
    );
  }

  return page || null;
}

function checkFrames(page) {
  if (!page) return [];

  const frames = Array.isArray(page.frames) ? page.frames : [];

  if (stage === "screens") {
    add(
      "화면 프레임 개수",
      frames.length >= minFrames,
      `${frames.length}개 (최소 ${minFrames}개)`,
    );
  } else {
    add("프레임 존재", frames.length > 0, `${frames.length}개`);
  }

  const badShape = frames.filter(
    (f) =>
      !f?.name || typeof f.width !== "number" || typeof f.height !== "number",
  );
  add(
    "프레임 필수 필드 (name/width/height)",
    badShape.length === 0,
    badShape.length === 0 ? "모두 정상" : `${badShape.length}개 프레임 누락`,
  );

  const emptyFrames = frames.filter(
    (f) => !Array.isArray(f?.nodes) || f.nodes.length === 0,
  );
  add(
    "프레임마다 nodes 배열 존재",
    emptyFrames.length === 0,
    emptyFrames.length === 0
      ? "모두 정상"
      : `비어있음: ${emptyFrames.map((f) => f?.name ?? "?").join(", ")}`,
  );

  const truncated = frames.filter((f) => f?.truncated);
  add(
    "노드 수집 완결성",
    truncated.length === 0,
    truncated.length === 0
      ? "잘림 없음"
      : `MAX_NODES 초과로 잘림: ${truncated.map((f) => f.name).join(", ")}`,
  );

  return frames;
}

function checkNodeFields(frames) {
  const missing = [];
  let total = 0;

  frames.forEach((frame) => {
    (frame?.nodes || []).forEach((node) => {
      total++;
      const lack = REQUIRED_NODE_FIELDS.filter(
        (f) => node[f] === undefined || node[f] === null,
      );
      if (lack.length > 0) {
        missing.push(`${frame.name} > ${node.name ?? "?"}: ${lack.join(",")}`);
      }
    });
  });

  add(
    `노드 필수 필드 (${REQUIRED_NODE_FIELDS.join("/")})`,
    missing.length === 0,
    missing.length === 0
      ? `${total}개 노드 정상`
      : `${missing.length}/${total}개 누락 · 예: ${missing.slice(0, 3).join(" | ")}`,
  );

  // 평탄화 확인: nodes 안에 children 이 남아있으면 재귀 추출을 안 한 것
  const nested = [];
  frames.forEach((frame) => {
    (frame?.nodes || []).forEach((node) => {
      if (Array.isArray(node.children))
        nested.push(`${frame.name} > ${node.name}`);
    });
  });
  add(
    "노드 배열 평탄화",
    nested.length === 0,
    nested.length === 0
      ? "평탄화됨"
      : `children 중첩 ${nested.length}건 — figma-audit 는 재귀하지 않아 검사에서 누락됨`,
  );

  // 좌표계 확인: 모든 y 가 동일하거나 전부 0이면 프레임 기준 좌표가 아닐 가능성
  const ys = frames
    .flatMap((f) => (f?.nodes || []).map((n) => n.position?.y))
    .filter((y) => typeof y === "number");
  const allZero = ys.length > 0 && ys.every((y) => y === 0);
  add(
    "position 좌표계",
    !allZero,
    allZero
      ? "모든 y=0 — 프레임 기준 절대좌표가 아님 (safe-area 검사 무의미)"
      : `y 값 ${ys.length}개 수집`,
  );

  return total;
}

function checkAuditSignals(frames) {
  // audit 의 판정을 좌우하는 플래그가 실제로 채워졌는지 확인
  const tapCount = frames.reduce(
    (acc, f) => acc + (f?.nodes || []).filter((n) => n.isTapTarget).length,
    0,
  );
  // 비율이 비정상적으로 높으면 이름 휴리스틱이 과매칭된 것.
  // (과거 /row/ 가 Arrow·Browse 에, /tab/ 이 Table 에 매칭돼 전 노드가 탭타겟이 된 적 있음)
  const totalNodes = frames.reduce(
    (acc, f) => acc + (f?.nodes || []).length,
    0,
  );
  const tapRatio =
    totalNodes > 0 ? Math.round((tapCount / totalNodes) * 100) : 0;
  add(
    "isTapTarget 과매칭 아님",
    tapRatio <= 50,
    tapRatio <= 50
      ? `전체 노드의 ${tapRatio}%`
      : `전체 노드의 ${tapRatio}% 가 탭타겟 — 이름 휴리스틱 과매칭 의심 (figma-snapshot.js 의 TAP 정규식 확인)`,
  );

  add(
    "isTapTarget 플래그 수집",
    tapCount > 0,
    tapCount > 0
      ? `${tapCount}개`
      : "0개 — 탭 영역 검사가 전부 건너뛰어짐 (허위 PASS 위험)",
  );

  const framesWithoutPrimary = frames.filter(
    (f) => (f?.nodes || []).filter((n) => n.isPrimary).length !== 1,
  );
  add(
    "화면당 isPrimary 1개",
    framesWithoutPrimary.length === 0,
    framesWithoutPrimary.length === 0
      ? "모든 화면 1개"
      : `${framesWithoutPrimary.map((f) => `${f.name}(${(f.nodes || []).filter((n) => n.isPrimary).length}개)`).join(", ")}`,
  );

  const instanceCount = frames.reduce(
    (acc, f) => acc + (f?.nodes || []).filter((n) => n.isInstance).length,
    0,
  );
  add(
    "isInstance 플래그 수집",
    instanceCount > 0,
    instanceCount > 0
      ? `${instanceCount}개`
      : "0개 — 컴포넌트 재사용률 0% FAIL 확정",
  );

  // boundVariableCollection 이 수집되지 않으면 figma-audit 의 토큰 계층 검사가
  // 전부 "미바인딩"으로 떨어진다. 스냅샷 단계에서 먼저 잡는다.
  const paintsAll = frames.flatMap((f) =>
    (f?.nodes || []).flatMap((n) => [...(n.fills || []), ...(n.strokes || [])]),
  );
  const bound = paintsAll.filter((p) => p && p.boundVariable);
  const missingCollection = bound.filter(
    (p) => p.boundVariableCollection === undefined,
  );
  add(
    "boundVariableCollection 수집",
    bound.length === 0 || missingCollection.length === 0,
    bound.length === 0
      ? "바인딩된 paint 없음"
      : missingCollection.length === 0
        ? `${bound.length}개 paint 에 컬렉션 기록됨`
        : `${missingCollection.length}/${bound.length}개 누락 — 구버전 figma-snapshot.js 로 뽑았다`,
  );
}

// 토큰 2계층 검증.
// variables 는 {컬렉션: [{name, type, aliasOf}]} 형태여야 한다 (schema_version 2).
// primitives = 값을 가진 계층(aliasOf 없음), semantic = 전부 alias.
function checkTokens(snap) {
  const vars =
    snap.variables && typeof snap.variables === "object" ? snap.variables : {};
  const collections = Object.keys(vars);

  add(
    "변수 컬렉션 수집",
    collections.length > 0,
    collections.length > 0 ? collections.join(", ") : "없음",
  );

  // v1 형태({컬렉션: [문자열]})로 뽑힌 스냅샷을 조기에 잡는다.
  // 이 상태면 aliasOf 를 읽을 수 없어 2계층 검사가 통째로 무의미해진다.
  const legacyShape = collections.filter(
    (c) => Array.isArray(vars[c]) && vars[c].some((v) => typeof v === "string"),
  );
  add(
    "변수 항목 형태 (v2 객체)",
    legacyShape.length === 0,
    legacyShape.length === 0
      ? "정상"
      : `문자열 배열로 수집됨: ${legacyShape.join(", ")} — 구버전 figma-snapshot.js. 다시 추출할 것`,
  );

  const required = ["primitives", "semantic"];
  const lack = required.filter((c) => !collections.includes(c));
  add(
    "토큰 컬렉션 2개 (primitives/semantic)",
    lack.length === 0,
    lack.length === 0
      ? "모두 존재"
      : `누락: ${lack.join(", ")} — 컬렉션을 계층으로 나눠야 한다 (color/space/radius/size 로 쪼개지 말 것)`,
  );

  const primitives = Array.isArray(vars.primitives) ? vars.primitives : [];
  const semantic = Array.isArray(vars.semantic) ? vars.semantic : [];

  add(
    "primitives 비어있지 않음",
    primitives.length > 0,
    primitives.length > 0
      ? `${primitives.length}개`
      : "0개 — semantic 이 참조할 원본이 없다",
  );

  // semantic 은 자체 값을 갖지 않는다. 하나라도 값 직결이면 1계층이다.
  const notAliased = semantic.filter((v) => v && !v.aliasOf).map((v) => v.name);
  add(
    "semantic 전부 primitive 참조",
    semantic.length > 0 && notAliased.length === 0,
    semantic.length === 0
      ? "semantic 컬렉션 비어있음"
      : notAliased.length === 0
        ? `${semantic.length}개 전부 alias`
        : `값 직결 ${notAliased.length}개: ${notAliased.slice(0, 5).join(", ")}${notAliased.length > 5 ? " …" : ""}`,
  );

  // alias 대상이 실제로 primitives 안에 있는지 (semantic → semantic 참조 방지)
  const primNames = new Set(primitives.map((v) => v && v.name));
  const danglingRefs = semantic
    .filter((v) => v && v.aliasOf && !primNames.has(v.aliasOf))
    .map((v) => `${v.name}→${v.aliasOf}`);
  add(
    "alias 대상이 primitives 안에 존재",
    danglingRefs.length === 0,
    danglingRefs.length === 0
      ? "모두 정상"
      : `primitives 밖을 참조: ${danglingRefs.slice(0, 5).join(", ")}`,
  );

  // primitive 가 또 다른 변수를 가리키면 계층이 3단이 된다
  const chained = primitives.filter((v) => v && v.aliasOf).map((v) => v.name);
  add(
    "primitives 는 값 직결 (중첩 alias 없음)",
    chained.length === 0,
    chained.length === 0
      ? "정상"
      : `alias 로 만들어진 primitive: ${chained.slice(0, 5).join(", ")}`,
  );

  if (stage === "tokens") {
    add(
      "텍스트 스타일 존재",
      Array.isArray(snap.textStyles) && snap.textStyles.length > 0,
      `${snap.textStyles?.length ?? 0}개`,
    );
    add(
      "이펙트 스타일 존재",
      Array.isArray(snap.effectStyles) && snap.effectStyles.length > 0,
      `${snap.effectStyles?.length ?? 0}개`,
    );
  }
}

// ==================== 출력 ====================

function report() {
  const passed = results.every((r) => r.pass);

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          snapshot: snapshotPath,
          stage,
          checked_at: new Date().toISOString(),
          checks: results,
          passed,
        },
        null,
        2,
      ),
    );
    return passed;
  }

  log("");
  log(`🔎 snapshot 스키마 검증 · stage=${stage}`, "cyan");
  log("─".repeat(50));

  results.forEach((r) => {
    log(`${r.pass ? "  ✓" : "  ✗"} ${r.name}`, r.pass ? "green" : "red");
    if (r.detail) log(`    ${r.detail}`);
  });

  log("");
  const ok = results.filter((r) => r.pass).length;
  log(`  ${ok}/${results.length} 통과`, passed ? "green" : "yellow");
  log("");

  if (!passed) {
    log("→ scripts/figma-snapshot.js 로 스냅샷을 다시 추출하세요.", "yellow");
    log(
      "  (figma-builder: Read → CONFIG 치환 → use_figma → 반환값 Write)",
      "yellow",
    );
    log("");
  }

  return passed;
}

// ==================== 메인 ====================

const snap = loadSnapshot();

checkMeta(snap);
const page = checkPages(snap);
const frames = checkFrames(page);

if (stage === "screens") {
  checkNodeFields(frames);
  checkAuditSignals(frames);
}

checkTokens(snap);

process.exit(report() ? 0 : 1);
