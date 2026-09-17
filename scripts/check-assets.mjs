#!/usr/bin/env node
/**
 * check-assets.mjs
 *
 * STAGE=assets 의 산출물(assets-manifest.json)이 STAGE=screens 의 입력 계약을
 * 만족하는지 선검증한다.
 *
 * 왜 필요한가:
 *   figma-builder 는 screens STAGE 에서 매니페스트의 file 경로를 그대로 읽어
 *   upload_assets 로 Figma 노드 fill 에 밀어넣는다. 이때
 *     · 파일이 없으면        → 업로드가 조용히 스킵되고 회색 박스가 남는다
 *     · 10MB 를 넘으면       → upload_assets 가 거부한다 (도구 제한)
 *     · layer 이름이 어긋나면 → 어느 노드에 넣을지 모른다
 *   전부 "화면은 만들어졌는데 이미지만 빈" 상태로 끝나고, audit 의 팔레트 검사는
 *   IMAGE fill 을 보지 않으므로 이 실패를 잡아주지 못한다.
 *   그래서 screens 진입 전에 여기서 막는다.
 *
 * 사용법:
 *   node scripts/check-assets.mjs
 *   node scripts/check-assets.mjs --json
 *
 * 옵션:
 *   --manifest <path>   기본: design/04-screens/assets/assets-manifest.json
 *   --max-slots <n>     생성 슬롯 전체 상한 (기본: 12 = generate_image_batch 1회분)
 *   --max-per-screen <n> 화면당 슬롯 상한 (기본: 4)
 *   --json              JSON 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
// ⚠️ `args[args.indexOf(name) + 1] || fallback` 패턴 금지 (check-snapshot.mjs 와 동일 이유).
//    플래그가 없으면 indexOf 가 -1 → -1+1=0 이라 args[0] 이 값으로 잡힌다.
function getArg(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) return fallback;
  return v;
}

const manifestPath = getArg(
  "--manifest",
  "design/04-screens/assets/assets-manifest.json",
);
const maxSlots = parseInt(getArg("--max-slots", "12"), 10);
const maxPerScreen = parseInt(getArg("--max-per-screen", "4"), 10);

const SCHEMA_VERSION = 1;

// upload_assets 제한 (도구 스키마: Max 10MB per asset, PNG/JPG/GIF/WebP/SVG)
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_FILE_BYTES = 1024; // 1KB 미만이면 생성 실패한 빈 파일로 본다
const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".webp"];

// gpt_image_2_5 가 지원하는 비율 중 모바일 화면에서 쓰는 것만 허용
const ALLOWED_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"];

const VALID_STATUS = ["done", "reuse"];

// 프롬프트가 채워지지 않은 채 넘어오는 흔한 형태.
// ⚠️ 부분 매칭을 쓰지 말 것. "음식 사진 클로즈업", "이미지 상단 여백" 같은 정상 프롬프트가
//    '사진' / '이미지' 한 단어 때문에 전부 플레이스홀더로 잡힌다.
//    프롬프트 "전체"가 이 말뿐일 때만 미작성으로 본다.
const PLACEHOLDER_RE =
  /^(todo|tbd|placeholder|dummy|xxx|이미지|사진|더미|자리표시)[\s.·:\-]*$/i;
const MIN_PROMPT_LENGTH = 20;

const results = [];

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function add(name, pass, detail) {
  results.push({ name, pass, detail });
}

function fail(msg) {
  add("매니페스트 로드", false, msg);
  report();
  process.exit(1);
}

// ==================== 로드 ====================

function loadManifest() {
  if (!existsSync(manifestPath)) {
    fail(
      `파일 없음: ${manifestPath} (figma-builder 가 STAGE=assets 완료 시 Write 해야 함)`,
    );
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (err) {
    fail(`JSON 파싱 실패: ${err.message}`);
  }
}

// ==================== 검사 ====================

function checkMeta(m) {
  add(
    "schema_version",
    m.schema_version === SCHEMA_VERSION,
    `기대 ${SCHEMA_VERSION} / 실제 ${m.schema_version ?? "없음"}`,
  );

  add(
    "model 명시",
    typeof m.model === "string" && m.model.length > 0,
    m.model || "없음 — 어떤 모델로 뽑았는지 기록되어야 재현된다",
  );

  const ad = typeof m.art_direction === "string" ? m.art_direction.trim() : "";
  add(
    "art_direction 기록",
    ad.length >= MIN_PROMPT_LENGTH,
    ad.length >= MIN_PROMPT_LENGTH
      ? `${ad.length}자`
      : "design-rules.md §I 의 아트 디렉션을 그대로 복사해야 한다",
  );
}

function checkSlotList(m) {
  const slots = Array.isArray(m.slots) ? m.slots : null;

  if (!slots) {
    add("slots 배열", false, "slots 가 배열이 아니다");
    return [];
  }

  add("slots 배열", slots.length > 0, `${slots.length}개 슬롯`);

  // 생성 슬롯(= 실제로 크레딧을 쓴 것)만 상한에 센다. reuse 는 세지 않는다.
  const generated = slots.filter((s) => s?.status === "done");
  add(
    `생성 슬롯 상한 (≤ ${maxSlots})`,
    generated.length <= maxSlots,
    `${generated.length}개 생성 · reuse ${slots.length - generated.length}개`,
  );

  // 화면당 상한
  const perScreen = new Map();
  slots.forEach((s) => {
    const key = s?.screen || "(screen 없음)";
    perScreen.set(key, (perScreen.get(key) || 0) + 1);
  });
  const over = [...perScreen.entries()].filter(([, n]) => n > maxPerScreen);
  add(
    `화면당 슬롯 상한 (≤ ${maxPerScreen})`,
    over.length === 0,
    over.length === 0
      ? `화면 ${perScreen.size}개`
      : over.map(([k, n]) => `${k}: ${n}개`).join(", "),
  );

  // key 중복
  const keys = slots.map((s) => s?.key).filter(Boolean);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  add(
    "key 중복 없음",
    dupes.length === 0,
    dupes.length === 0
      ? "중복 없음"
      : `중복: ${[...new Set(dupes)].join(", ")}`,
  );

  return slots;
}

function checkSlots(slots) {
  const baseDir = dirname(resolve(manifestPath));
  const doneKeys = new Set(
    slots.filter((s) => s?.status === "done").map((s) => s.key),
  );

  const bad = {
    field: [],
    layer: [],
    ratio: [],
    prompt: [],
    status: [],
    file: [],
    reuse: [],
  };

  slots.forEach((s, i) => {
    const label = s?.key || `#${i}`;

    if (!s || typeof s.key !== "string" || !s.key) {
      bad.field.push(`#${i}: key 없음`);
      return;
    }
    if (typeof s.screen !== "string" || !s.screen) {
      bad.field.push(`${label}: screen 없음`);
    }

    // layer 는 Figma 레이어 이름과 1:1 이어야 주입 대상을 찾는다
    if (s.layer !== `Img/${s.key}`) {
      bad.layer.push(`${label}: layer="${s.layer}" (기대 "Img/${s.key}")`);
    }

    if (!ALLOWED_RATIOS.includes(s.aspect_ratio)) {
      bad.ratio.push(`${label}: ${s.aspect_ratio ?? "없음"}`);
    }

    const prompt = typeof s.prompt === "string" ? s.prompt.trim() : "";
    if (prompt.length < MIN_PROMPT_LENGTH || PLACEHOLDER_RE.test(prompt)) {
      bad.prompt.push(
        `${label}: ${prompt.length < MIN_PROMPT_LENGTH ? `${prompt.length}자` : "플레이스홀더 문구"}`,
      );
    }

    if (!VALID_STATUS.includes(s.status)) {
      bad.status.push(`${label}: ${s.status ?? "없음"}`);
      return; // status 가 틀리면 아래 파일/reuse 검사는 의미 없다
    }

    if (s.status === "reuse") {
      if (!s.reuse_of || !doneKeys.has(s.reuse_of)) {
        bad.reuse.push(`${label}: reuse_of="${s.reuse_of ?? "없음"}" 미해결`);
      }
      return;
    }

    // status === "done" → 실제 파일이 있어야 한다
    if (typeof s.file !== "string" || !s.file) {
      bad.file.push(`${label}: file 없음`);
      return;
    }
    const ext = s.file.slice(s.file.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      bad.file.push(
        `${label}: 확장자 ${ext} (허용: ${ALLOWED_EXT.join(", ")})`,
      );
      return;
    }
    const abs = resolve(baseDir, s.file);
    if (!existsSync(abs)) {
      bad.file.push(`${label}: 파일 없음 (${s.file})`);
      return;
    }
    const bytes = statSync(abs).size;
    if (bytes < MIN_FILE_BYTES) {
      bad.file.push(`${label}: ${bytes}B — 빈 파일로 보인다`);
    } else if (bytes > MAX_FILE_BYTES) {
      bad.file.push(
        `${label}: ${(bytes / 1024 / 1024).toFixed(1)}MB — upload_assets 상한 10MB 초과`,
      );
    }
  });

  const report = (name, list, okDetail) =>
    add(
      name,
      list.length === 0,
      list.length === 0 ? okDetail : list.join(" / "),
    );

  report("필수 필드 (key, screen)", bad.field, "전부 존재");
  report("layer 네이밍 (Img/{key})", bad.layer, "전부 일치");
  report("aspect_ratio 허용값", bad.ratio, "전부 허용값");
  report("prompt 실질 내용", bad.prompt, "전부 작성됨");
  report("status 값 (done | reuse)", bad.status, "전부 유효");
  report("reuse_of 참조 해결", bad.reuse, "전부 해결");
  report("이미지 파일 존재·크기", bad.file, `${doneKeys.size}개 확인`);
}

// ==================== 출력 ====================

function report() {
  const passed = results.every((r) => r.pass);

  if (isJson) {
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
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
  log("🖼  assets 매니페스트 검증", "cyan");
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
    log("→ STAGE=assets 를 다시 실행하세요.", "yellow");
    log(
      "  (figma-builder: assets-plan.md 수정 → 실패 슬롯만 재생성 → 매니페스트 갱신)",
      "yellow",
    );
    log("");
  }

  return passed;
}

// ==================== 메인 ====================

const manifest = loadManifest();

checkMeta(manifest);
const slots = checkSlotList(manifest);
if (slots.length > 0) checkSlots(slots);

process.exit(report() ? 0 : 1);
