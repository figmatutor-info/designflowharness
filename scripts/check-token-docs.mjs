#!/usr/bin/env node
/**
 * check-token-docs.mjs
 *
 * `01 Tokens` 페이지의 토큰 문서 프레임이 docs/token-docs-spec.md 계약을 지켰는지 판정한다.
 *
 * 왜 필요한가:
 *   문서는 "그려졌는지"가 아니라 "규격대로 그려졌는지"가 중요하다.
 *   한 줄 띠로 그려도, 토큰 절반을 빠뜨려도 Figma 는 아무 말도 하지 않는다.
 *   변수 목록과 카드 목록을 대조해 누락·유령을 잡는 것이 이 스크립트의 핵심이다.
 *
 * 입력: design/04-screens/figma-snapshot.json
 *   → 문서를 그린 뒤 scripts/figma-snapshot.js 로 스냅샷을 다시 뽑고 실행해야 한다.
 *
 * 사용법:
 *   node scripts/check-token-docs.mjs
 *   node scripts/check-token-docs.mjs --json
 *
 * 옵션:
 *   --snapshot <path>  기본: design/04-screens/figma-snapshot.json
 *   --json             JSON 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync } from "node:fs";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const args = process.argv.slice(2);
const isJson = args.includes("--json");

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

const PAGE = "01 Tokens";
const PREFIX = "Token Documentation — ";
const LEGACY = "Token Swatch";

const DOC_W = 1280;
const CARD_W = 214;
const CARD_H = 136;
const SWATCH_W = 190;

// 문서명 → 그 문서가 덮어야 하는 항목 목록을 스냅샷에서 뽑는 함수
const DOCS = {
  "Color Primitives": (s) => varNames(s, "primitives", "COLOR"),
  "Color Semantic": (s) => varNames(s, "semantic", "COLOR"),
  "Scale Primitives": (s) => varNames(s, "primitives", "FLOAT"),
  "Scale Semantic": (s) => varNames(s, "semantic", "FLOAT"),
  Typography: (s) => (s.textStyles || []).slice(),
  Shadow: (s) => (s.effectStyles || []).slice(),
};

function varNames(snap, collection, type) {
  const list = (snap.variables && snap.variables[collection]) || [];
  return list.filter((v) => v && v.type === type).map((v) => v.name);
}

const results = [];

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function add(name, pass, detail) {
  results.push({ name, pass, detail });
}

function bail(msg) {
  add("스냅샷 로드", false, msg);
  report();
  process.exit(1);
}

// ==================== 로드 ====================

if (!existsSync(snapshotPath)) {
  bail(`파일 없음: ${snapshotPath} (figma-snapshot.js 로 먼저 추출해야 한다)`);
}

let snap;
try {
  snap = JSON.parse(readFileSync(snapshotPath, "utf-8"));
} catch (err) {
  bail(`JSON 파싱 실패: ${err.message}`);
}

const page = (snap.pages || []).find((p) => p && p.name === PAGE);
if (!page) {
  bail(
    `스냅샷에 "${PAGE}" 페이지 없음 (있는 페이지: ${(snap.pages || []).map((p) => p.name).join(", ") || "없음"})`,
  );
}

const frames = page.frames || [];

// ==================== 검사 ====================

// 1) 레거시 프레임
const legacy = frames.filter((f) => f.name === LEGACY);
add(
  "레거시 Token Swatch 없음",
  legacy.length === 0,
  legacy.length === 0
    ? "정상"
    : `${legacy.length}개 남아있음 — figma-token-docs.js 를 실행하면 자동으로 지워진다`,
);

// 2) 문서 프레임 6개
const docFrames = new Map();
for (const f of frames) {
  if (f.name && f.name.startsWith(PREFIX)) {
    docFrames.set(f.name.slice(PREFIX.length), f);
  }
}
const expectedDocs = Object.keys(DOCS);
const missingDocs = expectedDocs.filter((d) => !docFrames.has(d));
add(
  "문서 프레임 6종 존재",
  missingDocs.length === 0,
  missingDocs.length === 0
    ? `${docFrames.size}개 확인`
    : `없음: ${missingDocs.join(", ")}`,
);

// 3) 문서별 상세
for (const docName of expectedDocs) {
  const f = docFrames.get(docName);
  if (!f) continue;

  const nodes = f.nodes || [];

  // 폭
  add(
    `${docName} · 폭 ${DOC_W}`,
    f.width === DOC_W,
    f.width === DOC_W ? "정상" : `${f.width} (spec: ${DOC_W})`,
  );

  // 잘린 스냅샷이면 아래 대조가 거짓말이 된다
  if (f.truncated) {
    add(
      `${docName} · 스냅샷 완전성`,
      false,
      "노드가 잘린 스냅샷(truncated). 범위를 나눠 재추출해야 판정할 수 있다",
    );
    continue;
  }

  // 카드 = Swatch · {name} 의 name 집합
  const cards = nodes
    .filter((n) => n.name && n.name.startsWith("Swatch · "))
    .map((n) => ({ name: n.name.slice("Swatch · ".length), node: n }));

  const expected = DOCS[docName](snap);
  const cardNames = new Set(cards.map((c) => c.name));
  const missing = expected.filter((n) => !cardNames.has(n));
  const extra = Array.from(cardNames).filter((n) => expected.indexOf(n) === -1);
  const dup = cards.length - cardNames.size;

  add(
    `${docName} · 카드 = 토큰 목록 (${expected.length}개)`,
    missing.length === 0 && extra.length === 0 && dup === 0,
    [
      missing.length
        ? `누락 ${missing.length}: ${missing.slice(0, 5).join(", ")}`
        : null,
      extra.length
        ? `유령 ${extra.length}: ${extra.slice(0, 5).join(", ")}`
        : null,
      dup ? `중복 ${dup}개` : null,
    ]
      .filter(Boolean)
      .join(" / ") || `${cards.length}개 일치`,
  );

  // 그리드 존재
  const grids = nodes.filter((n) => n.name === "Token Grid");
  add(
    `${docName} · Token Grid 존재`,
    grids.length > 0,
    grids.length > 0
      ? `${grids.length}개 섹션`
      : "없음 — 한 줄 띠로 그렸을 가능성",
  );

  // 카드 크기 (카드 프레임 = Swatch 의 이름과 같은 FRAME)
  const badCards = nodes
    .filter(
      (n) =>
        n.type === "FRAME" &&
        cardNames.has(n.name) &&
        n.size &&
        (n.size.width !== CARD_W || n.size.height !== CARD_H),
    )
    .map((n) => `${n.name}(${n.size.width}×${n.size.height})`);
  add(
    `${docName} · 카드 ${CARD_W}×${CARD_H}`,
    badCards.length === 0,
    badCards.length === 0
      ? "정상"
      : `어긋남: ${badCards.slice(0, 3).join(", ")}`,
  );

  // Swatch 폭
  const badSwatch = cards
    .filter((c) => c.node.size && c.node.size.width !== SWATCH_W)
    .map((c) => `${c.name}(${c.node.size.width})`);
  add(
    `${docName} · Swatch 폭 ${SWATCH_W}`,
    badSwatch.length === 0,
    badSwatch.length === 0
      ? "정상"
      : `어긋남: ${badSwatch.slice(0, 3).join(", ")}`,
  );
}

// ==================== 출력 ====================

function report() {
  const passed = results.every((r) => r.pass);

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          snapshot: snapshotPath,
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
  log("🎨 토큰 문서 규격 검증 (docs/token-docs-spec.md)", "cyan");
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
    log("→ scripts/figma-token-docs.js 를 다시 실행한 뒤", "yellow");
    log(
      "  figma-snapshot.js 로 스냅샷을 재추출하세요. (손으로 고치지 말 것)",
      "yellow",
    );
    log("");
  }

  return passed;
}

process.exit(report() ? 0 : 1);
