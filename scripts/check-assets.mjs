#!/usr/bin/env node
/**
 * check-assets.mjs
 *
 * design-rules.md §I 의 "화면별 슬롯 계획" 표가 이미지 라이브러리와 맞는지 선검증한다.
 * STAGE=screens 는 이 표를 그대로 읽어 `파일` 열의 이미지를 슬롯에 주입한다.
 *
 * 왜 필요한가:
 *   figma-builder 는 screens STAGE 에서 §I 표의 파일 경로를 그대로 읽어
 *   upload_assets 로 Figma 노드 fill 에 밀어넣는다. 이때
 *     · 파일이 없으면        → 업로드가 조용히 스킵되고 회색 박스가 남는다
 *     · 10MB 를 넘으면       → upload_assets 가 거부한다 (도구 제한)
 *     · 비율이 비면          → 슬롯 크기를 정할 수 없다
 *   전부 "화면은 만들어졌는데 이미지만 빈" 상태로 끝나고, audit 의 팔레트 검사는
 *   IMAGE fill 을 보지 않으므로 이 실패를 잡아주지 못한다.
 *   그래서 screens 진입 전에 여기서 막는다.
 *
 * 계약 (design-rules.md §I):
 *   image-slots: used | none          ← none 이면 이 스크립트는 "해당 없음"으로 통과
 *   image-library: design/assets/characters   ← 생략 시 기본값
 *   ### 화면별 슬롯 계획
 *   | 슬롯 key | 화면 | role | 비율 | 파일 | 담을 내용 |
 *
 * 사용법:
 *   node scripts/check-assets.mjs
 *   node scripts/check-assets.mjs --json
 *
 * 옵션:
 *   --rules <path>       기본: design/03-design-rules/design-rules.md
 *   --library <path>     §I 의 image-library 선언을 덮어쓴다
 *   --max-per-screen <n> 화면당 슬롯 상한 (기본: 6 · default-tokens.md §I 슬롯 수 상한과 같다)
 *   --json               JSON 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { getArg, hasFlag, createLog } from "./lib/cli.mjs";
import { parseImageSlots } from "./lib/layout-rules.mjs";
import { resolve, extname, basename } from "node:path";

// ==================== 설정 ====================

const isJson = hasFlag("--json");

const rulesPath = getArg("--rules", "design/03-design-rules/design-rules.md");
const libraryOverride = getArg("--library", null);
const maxPerScreen = parseInt(getArg("--max-per-screen", "6"), 10);

// upload_assets 제한 (도구 스키마: Max 10MB per asset, PNG/JPG/GIF/WebP/SVG)
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_FILE_BYTES = 1024; // 1KB 미만이면 깨진 파일로 본다
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".webp"];

// 모바일 화면 슬롯에서 쓰는 비율만 허용 — default-tokens.md §I "슬롯 역할별 비율" 표와 같은 집합.
// (hero 16:9 · card 4:3 · thumb/avatar 1:1 · full-bleed 3:4) 표를 바꾸면 여기도 바꾼다.
const ALLOWED_RATIOS = ["1:1", "4:3", "3:4", "16:9"];

const SLOT_TABLE_HEADING = "화면별 슬롯 계획";

const results = [];

const log = createLog(isJson);

function add(name, pass, detail) {
  results.push({ name, pass, detail });
}

function fail(name, msg) {
  add(name, false, msg);
  report();
  process.exit(1);
}

// ==================== 로드 ====================

function loadRules() {
  if (!existsSync(rulesPath)) {
    fail("design-rules.md 로드", `파일 없음: ${rulesPath}`);
  }
  return readFileSync(rulesPath, "utf-8");
}

// §I 의 `image-slots:` 선언. none 이면 이미지를 쓰지 않는 프로젝트다.
// (파서·기본 경로는 check-phase.mjs 와 공유 — scripts/lib/layout-rules.mjs)
function readImagePolicy(content) {
  return parseImageSlots(content).policy;
}

// §I 의 `image-library:` 선언. 없으면 기본 라이브러리 경로.
function readLibraryPath(content) {
  if (libraryOverride) return libraryOverride;
  return parseImageSlots(content).library;
}

// "### 화면별 슬롯 계획" 아래 첫 마크다운 표를 행 객체 배열로 읽는다.
// 헤더 열 이름으로 매핑하므로 열 순서가 바뀌어도 동작한다.
function parseSlotTable(content) {
  const lines = content.split("\n");
  const start = lines.findIndex(
    (l) => /^#{2,4}\s/.test(l) && l.includes(SLOT_TABLE_HEADING),
  );
  if (start === -1) return null;

  const rows = [];
  let header = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,4}\s/.test(line)) break; // 다음 섹션
    if (!line.trim().startsWith("|")) {
      if (header && rows.length > 0) break; // 표가 끝났다
      continue;
    }
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim().replace(/`/g, ""));

    if (!header) {
      header = cells;
      continue;
    }
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // 구분선
    const row = {};
    header.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return { header: header ?? [], rows };
}

function col(row, ...names) {
  for (const n of names) {
    const k = Object.keys(row).find((h) => h.replace(/\s/g, "") === n);
    if (k !== undefined) return row[k];
  }
  return "";
}

// ==================== 검사 ====================

function checkLibrary(libraryPath) {
  const abs = resolve(libraryPath);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    add(
      "이미지 라이브러리 존재",
      false,
      `${libraryPath} 폴더 없음 — Figma 공식 에셋을 PNG 로 내려받아 이 폴더에 넣어야 한다`,
    );
    return [];
  }
  const files = readdirSync(abs).filter((f) =>
    ALLOWED_EXT.includes(extname(f).toLowerCase()),
  );
  add(
    "이미지 라이브러리 존재",
    files.length > 0,
    files.length > 0
      ? `${libraryPath} · 이미지 ${files.length}개`
      : `${libraryPath} 에 이미지 파일이 없다`,
  );
  return files;
}

function checkSlots(table, libraryPath, libraryFiles) {
  if (!table) {
    add(
      `슬롯 계획 표 (### ${SLOT_TABLE_HEADING})`,
      false,
      "§I 에 해당 제목의 표가 없다 — design-rules-generator 를 다시 실행",
    );
    return;
  }
  const { header, rows } = table;
  const norm = header.map((h) => h.replace(/\s/g, ""));
  const need = ["슬롯key", "화면", "비율", "파일"];
  const missingCols = need.filter((n) => !norm.includes(n));
  add(
    "슬롯 표 필수 열 (슬롯 key · 화면 · 비율 · 파일)",
    missingCols.length === 0,
    missingCols.length === 0
      ? `열 ${header.length}개`
      : `없는 열: ${missingCols.join(", ")}`,
  );
  if (missingCols.length > 0) return;

  const slots = rows
    .map((r) => ({
      key: col(r, "슬롯key"),
      screen: col(r, "화면"),
      role: col(r, "role", "역할"),
      ratio: col(r, "비율", "aspect_ratio"),
      file: col(r, "파일", "file"),
    }))
    .filter((s) => s.key && !/^\.{3}$/.test(s.key)); // 템플릿의 "..." 행 제외

  add("슬롯 1개 이상", slots.length > 0, `${slots.length}개 슬롯`);
  if (slots.length === 0) return;

  // key 중복
  const keys = slots.map((s) => s.key);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  add(
    "key 중복 없음",
    dupes.length === 0,
    dupes.length === 0
      ? "중복 없음"
      : `중복: ${[...new Set(dupes)].join(", ")}`,
  );

  // 화면당 상한
  const perScreen = new Map();
  slots.forEach((s) => {
    const k = s.screen || "(화면 없음)";
    perScreen.set(k, (perScreen.get(k) || 0) + 1);
  });
  const over = [...perScreen.entries()].filter(([, n]) => n > maxPerScreen);
  add(
    `화면당 슬롯 상한 (≤ ${maxPerScreen})`,
    over.length === 0,
    over.length === 0
      ? `화면 ${perScreen.size}개`
      : over.map(([k, n]) => `${k}: ${n}개`).join(", "),
  );

  const bad = { field: [], ratio: [], file: [] };
  const libSet = new Set(libraryFiles);
  const absLib = resolve(libraryPath);

  slots.forEach((s) => {
    if (!s.screen) bad.field.push(`${s.key}: 화면 없음`);

    if (!ALLOWED_RATIOS.includes(s.ratio)) {
      bad.ratio.push(`${s.key}: ${s.ratio || "없음"}`);
    }

    if (!s.file) {
      bad.file.push(`${s.key}: 파일 없음`);
      return;
    }
    // 표에는 파일명만 적는다 (라이브러리 상대). 경로가 섞여 와도 basename 으로 본다.
    const name = basename(s.file);
    const ext = extname(name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      bad.file.push(
        `${s.key}: 확장자 ${ext || "없음"} (허용: ${ALLOWED_EXT.join(", ")})`,
      );
      return;
    }
    if (!libSet.has(name)) {
      bad.file.push(`${s.key}: ${name} 이 ${libraryPath} 에 없다`);
      return;
    }
    const bytes = statSync(resolve(absLib, name)).size;
    if (bytes < MIN_FILE_BYTES) {
      bad.file.push(`${s.key}: ${name} ${bytes}B — 깨진 파일로 보인다`);
    } else if (bytes > MAX_FILE_BYTES) {
      bad.file.push(
        `${s.key}: ${name} ${(bytes / 1024 / 1024).toFixed(1)}MB — upload_assets 상한 10MB 초과`,
      );
    }
  });

  const rep = (name, list, ok) =>
    add(name, list.length === 0, list.length === 0 ? ok : list.join(" / "));

  rep("필수 필드 (화면)", bad.field, "전부 존재");
  rep("비율 허용값", bad.ratio, "전부 허용값");
  rep("라이브러리 파일 존재·크기", bad.file, `${slots.length}개 확인`);
}

// ==================== 출력 ====================

function report() {
  const passed = results.every((r) => r.pass);

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          rules: rulesPath,
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
  log("🖼  이미지 슬롯 · 라이브러리 검증", "cyan");
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
    log(
      "→ design-rules.md §I 의 슬롯 표를 고치거나 라이브러리 파일을 채우세요.",
      "yellow",
    );
    log(
      "  (파일은 design/assets/characters/ 에 있는 것만 쓸 수 있다)",
      "yellow",
    );
    log("");
  }

  return passed;
}

// ==================== 메인 ====================

const content = loadRules();

if (readImagePolicy(content) === "none") {
  add(
    "이미지 미사용 선언",
    true,
    "design-rules §I image-slots: none — 이미지 검사 해당 없음",
  );
  process.exit(report() ? 0 : 1);
}

const libraryPath = readLibraryPath(content);
const libraryFiles = checkLibrary(libraryPath);
checkSlots(parseSlotTable(content), libraryPath, libraryFiles);

process.exit(report() ? 0 : 1);
