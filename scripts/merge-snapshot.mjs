#!/usr/bin/env node
/**
 * merge-snapshot.mjs
 *
 * figma-snapshot.js 의 배치 추출 결과를 figma-snapshot.json 에 병합한다.
 *
 * 왜 필요한가:
 *   use_figma 응답에는 크기 상한이 있어서, 프레임이 많은 페이지는 한 번에 추출되지 않는다.
 *   그래서 FRAME_FROM/FRAME_TO 로 나눠 뽑게 되는데, 그 결과를 사람(에이전트)이 매번
 *   즉흥 스크립트로 이어 붙이면 그 지점이 곧 "손으로 만지는 구간"이 된다.
 *   실제로 그 구간에서 스냅샷이 수정된 사고가 있었다. 병합을 이 파일 하나로 고정한다.
 *
 * 사용법:
 *   node scripts/merge-snapshot.mjs batch-1.json batch-2.json batch-3.json
 *   node scripts/merge-snapshot.mjs batch-*.json --out design/04-screens/figma-snapshot.json
 *
 * 옵션:
 *   --out <path>   병합 결과 경로 (기본: design/04-screens/figma-snapshot.json)
 *   --dry-run      파일을 쓰지 않고 검사 결과만 출력
 *   --json         JSON 으로 출력
 *
 * 동작:
 *   - 배치는 전부 같은 file_key / schema_version / page.name 이어야 한다.
 *   - frame.node_range 가 있는 배치(노드 청크)는 같은 프레임끼리 먼저 재조합한다.
 *     (프레임 1개가 응답 상한을 넘어 NODE_FROM/NODE_TO 로 나눠 뽑은 경우)
 *     노드 범위의 구멍·중복·누락도 같은 기준으로 검사한다.
 *   - frame_range 로 정렬한 뒤 구멍(gap)·중복(overlap)·누락을 검사한다.
 *     하나라도 걸리면 아무것도 쓰지 않고 exit 1.
 *   - 값은 절대 고치지 않는다. frames 배열을 순서대로 이어 붙이기만 한다.
 *   - 기존 figma-snapshot.json 이 있으면 같은 이름의 page 만 교체하고 나머지 page 는 유지한다.
 *     (01 Tokens 를 남긴 채 02 Components 만 갱신하는 경우)
 *
 * exit code:
 *   0: 병합 성공
 *   1: 검사 실패 (아무것도 쓰지 않음)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getArg, hasFlag, createLog, args } from "./lib/cli.mjs";

const isJson = hasFlag("--json");
const isDryRun = hasFlag("--dry-run");

const outPath = getArg("--out", "design/04-screens/figma-snapshot.json");

// 플래그와 그 값을 뺀 나머지가 배치 파일 목록
const outValue = getArg("--out", null);
const batchPaths = args.filter((a) => !a.startsWith("--") && a !== outValue);

const log = createLog(isJson);

function die(msg, detail) {
  if (isJson) {
    console.log(JSON.stringify({ ok: false, error: msg, detail }, null, 2));
  } else {
    log(`\n❌ ${msg}`, "red");
    if (detail) log(`   ${detail}`);
    log("");
  }
  process.exit(1);
}

// ==================== 로드 ====================

if (batchPaths.length === 0) {
  die(
    "배치 파일을 하나도 받지 못했다",
    "사용법: node scripts/merge-snapshot.mjs batch-1.json batch-2.json [--out <path>]",
  );
}

const batches = batchPaths.map((p) => {
  if (!existsSync(p)) die(`파일 없음: ${p}`);
  try {
    return { path: p, data: JSON.parse(readFileSync(p, "utf-8")) };
  } catch (err) {
    die(`JSON 파싱 실패: ${p}`, err.message);
  }
});

// ==================== 검사 ====================

const problems = [];

// 1. 메타 일치
const first = batches[0].data;
const pageName = first.page?.name;

if (!pageName) {
  die(
    `page.name 없음: ${batches[0].path}`,
    "figma-snapshot.js 의 반환값을 그대로 저장한 파일이어야 한다",
  );
}

for (const { path, data } of batches) {
  if (data.schema_version !== first.schema_version)
    problems.push(
      `schema_version 불일치: ${path} (${data.schema_version} ≠ ${first.schema_version})`,
    );
  if (data.file_key !== first.file_key)
    problems.push(
      `file_key 불일치: ${path} (${data.file_key} ≠ ${first.file_key}) — 다른 파일에서 뽑은 배치다`,
    );
  if (data.page?.name !== pageName)
    problems.push(
      `page.name 불일치: ${path} (${data.page?.name} ≠ ${pageName}) — 한 번에 한 페이지만 병합한다`,
    );
  // v4: 같은 페이지의 배치는 프로필(docs/full)도 같아야 한다. 섞이면 노드 필드가 들쭉날쭉해진다.
  if ((data.page?.profile ?? null) !== (first.page?.profile ?? null))
    problems.push(
      `page.profile 불일치: ${path} (${data.page?.profile ?? "없음"} ≠ ${first.page?.profile ?? "없음"}) — 같은 __PROFILE__ 로 다시 뽑을 것`,
    );
  if ((data.page?.capture_id ?? null) !== (first.page?.capture_id ?? null))
    problems.push(
      `capture_id 불일치: ${path} — 다른 수정 라운드 배치를 섞을 수 없다`,
    );
  if (!data.frame_range)
    problems.push(
      `frame_range 없음: ${path} — 구버전 figma-snapshot.js 로 뽑았다. 다시 추출할 것`,
    );
  if (!Array.isArray(data.page?.frames))
    problems.push(`page.frames 배열 아님: ${path}`);
}

if (problems.length > 0) {
  die("배치 메타가 맞지 않는다", problems.join("\n   "));
}

// 2. 노드 청크 재조합
//
// 프레임 1개가 응답 상한을 넘으면 figma-snapshot.js 가 NODE_FROM/NODE_TO 로 노드를 나눠 뽑고
// frame.node_range 를 남긴다. 같은 frame_range(=같은 프레임)의 청크를 여기서 하나의 프레임으로
// 되돌린다. 값은 건드리지 않고 nodes 배열만 이어 붙인다. 구멍·중복·누락이 있으면 전부 거부한다.
// 재조합이 끝난 프레임은 node_range 를 떼어 내서, 아래 프레임 단위 검사에는 일반 배치처럼 들어간다.
function isChunkBatch(data) {
  return data.page.frames.some((f) => f && f.node_range);
}

const chunkGroups = new Map(); // "from-to" → [{path, data}]
const plain = [];
for (const b of batches) {
  if (!isChunkBatch(b.data)) {
    plain.push(b);
    continue;
  }
  const { from, to } = b.data.frame_range;
  if (to - from !== 1 || b.data.page.frames.length !== 1) {
    problems.push(
      `노드 청크는 프레임 1개여야 한다: ${b.path} (frame_range ${from}~${to}, 프레임 ${b.data.page.frames.length}개)`,
    );
    continue;
  }
  const key = `${from}-${to}`;
  if (!chunkGroups.has(key)) chunkGroups.set(key, []);
  chunkGroups.get(key).push(b);
}

if (problems.length > 0) {
  die("노드 청크 배치 형식이 맞지 않는다", problems.join("\n   "));
}

const reassembled = [];
for (const group of chunkGroups.values()) {
  const chunks = [...group].sort(
    (a, b) =>
      a.data.page.frames[0].node_range.from -
      b.data.page.frames[0].node_range.from,
  );
  const head = chunks[0].data.page.frames[0];
  const total = head.node_range.total_nodes;
  const name = head.name;

  let cursor = 0;
  const nodes = [];
  let truncated = false;
  for (const { path, data } of chunks) {
    const f = data.page.frames[0];
    const { from, to, total_nodes } = f.node_range;
    if ((f.id ?? null) !== (head.id ?? null))
      problems.push(`청크의 프레임 id 불일치: ${path}`);
    if (f.name !== name)
      problems.push(
        `청크의 프레임 이름 불일치: ${path} ("${f.name}" ≠ "${name}") — 다른 프레임의 청크가 섞였다`,
      );
    if (total_nodes !== total)
      problems.push(
        `total_nodes 불일치: ${path} (${total_nodes} ≠ ${total}) — 추출 도중 프레임이 바뀌었다. 이 프레임 청크를 전부 다시 뽑을 것`,
      );
    if (f.nodes.length !== to - from)
      problems.push(
        `노드 개수가 범위와 다름: ${path} (범위 ${from}~${to} = ${to - from}개인데 실제 ${f.nodes.length}개)`,
      );
    if (from > cursor)
      problems.push(
        `노드 범위에 구멍: "${name}" 의 ${cursor}~${from} 이 어느 청크에도 없다 (${path} 앞)`,
      );
    if (from < cursor)
      problems.push(
        `노드 범위 중복: ${path} 의 ${from}~${to} 가 앞 청크와 겹친다 (직전까지 ${cursor})`,
      );
    cursor = Math.max(cursor, to);
    nodes.push(...f.nodes);
    truncated = truncated || !!f.truncated;
  }
  if (cursor < total)
    problems.push(
      `노드 범위 누락: "${name}" 의 ${cursor}~${total} 가 빠졌다. 마지막 청크를 NODE_TO=0 (끝까지) 으로 다시 뽑을 것`,
    );

  // 프레임 메타는 첫 청크의 것을 쓴다 (어느 청크나 같은 값이다). node_range 는 뗀다.
  const { node_range, nodes: _drop, ...meta } = head;
  const frame = { ...meta, truncated, nodes };

  // 재조합된 프레임을 담은 "가상 배치". 파일 단위 정보는 가장 늦은 청크의 것을 쓴다.
  const latestChunk = [...chunks]
    .sort((a, b) =>
      String(a.data.snapshot_date).localeCompare(String(b.data.snapshot_date)),
    )
    .at(-1).data;
  reassembled.push({
    path: `${chunks.map((c) => c.path).join(" + ")}`,
    chunks: chunks.length,
    data: { ...latestChunk, page: { ...latestChunk.page, frames: [frame] } },
  });
}

if (problems.length > 0) {
  die("노드 청크 재조합 실패 — 아무것도 쓰지 않았다", problems.join("\n   "));
}

// 3. 범위 정렬 + 커버리지 (재조합된 프레임도 일반 배치로 들어간다)
const sorted = [...plain, ...reassembled].sort(
  (a, b) => a.data.frame_range.from - b.data.frame_range.from,
);

const total = sorted[0].data.frame_range.total_frames;
for (const { path, data } of sorted) {
  if (data.frame_range.total_frames !== total)
    problems.push(
      `total_frames 불일치: ${path} (${data.frame_range.total_frames} ≠ ${total}) — 추출 도중 페이지가 바뀌었다. 전부 다시 추출할 것`,
    );
}

let cursor = 0;
for (const { path, data } of sorted) {
  const { from, to } = data.frame_range;
  const got = data.page.frames.length;
  const want = to - from;

  if (got !== want)
    problems.push(
      `프레임 개수가 범위와 다름: ${path} (범위 ${from}~${to} = ${want}개인데 실제 ${got}개)`,
    );

  if (from > cursor)
    problems.push(
      `범위에 구멍: 인덱스 ${cursor}~${from} 이 어느 배치에도 없다 (${path} 앞)`,
    );
  if (from < cursor)
    problems.push(
      `범위 중복: ${path} 의 ${from}~${to} 가 앞 배치와 겹친다 (직전까지 ${cursor})`,
    );

  cursor = Math.max(cursor, to);
}

if (cursor < total)
  problems.push(
    `범위 누락: ${cursor}~${total} 가 빠졌다. 마지막 배치를 FRAME_TO=0 (끝까지) 으로 다시 뽑을 것`,
  );

if (problems.length > 0) {
  die("배치 범위 검사 실패 — 아무것도 쓰지 않았다", problems.join("\n   "));
}

// ==================== 병합 ====================

// frames 를 순서대로 이어 붙이기만 한다. 값은 건드리지 않는다.
const mergedFrames = sorted.flatMap(({ data }) => data.page.frames);

const byDate = [...batches].sort((a, b) =>
  String(a.data.snapshot_date).localeCompare(String(b.data.snapshot_date)),
);
const latest = byDate.at(-1).data;

// 파일 단위 정보(변수/스타일). v3 까지는 모든 배치에 있었고, v4 부터는 첫 배치에만 실린다.
// 실려 있는 배치 중 가장 최근 것을 쓴다. 하나도 없으면 기존 스냅샷의 값을 유지한다.
const withStyles = byDate
  .filter((b) => b.data.variables !== undefined)
  .at(-1)?.data;

let out;
if (existsSync(outPath)) {
  out = JSON.parse(readFileSync(outPath, "utf-8"));
  if (out.file_key && out.file_key !== latest.file_key)
    die(
      `기존 스냅샷과 file_key 가 다르다`,
      `${outPath}=${out.file_key} / 배치=${latest.file_key}`,
    );
} else {
  out = {
    schema_version: latest.schema_version,
    file_key: latest.file_key,
    pages: [],
  };
}

if (!withStyles && out.variables === undefined)
  die(
    "변수·스타일이 실린 배치가 없고 기존 스냅샷에도 없다",
    'FRAME_FROM=0 NODE_FROM=0 배치를 포함하거나 __WITH_STYLES__ 를 "1" 로 치환해 한 배치에 실을 것',
  );

out.schema_version = latest.schema_version;
out.file_key = latest.file_key;
out.snapshot_date = latest.snapshot_date;
if (withStyles) {
  out.variables = withStyles.variables;
  out.textStyles = withStyles.textStyles;
  out.effectStyles = withStyles.effectStyles;
  out.paintStyles = withStyles.paintStyles;
}
if (!Array.isArray(out.pages)) out.pages = [];

const newPage = { name: pageName, frames: mergedFrames };
if (first.page?.profile) newPage.profile = first.page.profile;
if (first.page?.capture_id) newPage.capture_id = first.page.capture_id;
const idx = out.pages.findIndex((p) => p?.name === pageName);
const replaced = idx >= 0;
if (replaced) out.pages[idx] = newPage;
else out.pages.push(newPage);

if (!isDryRun) writeFileSync(outPath, JSON.stringify(out, null, 2));

// ==================== 출력 ====================

if (isJson) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        out: outPath,
        page: pageName,
        batches: sorted.map((b) => ({
          path: b.path,
          from: b.data.frame_range.from,
          to: b.data.frame_range.to,
        })),
        frames: mergedFrames.length,
        total_frames: total,
        page_replaced: replaced,
        dry_run: isDryRun,
      },
      null,
      2,
    ),
  );
} else {
  log("");
  log(`🧩 snapshot 병합 · ${pageName}`, "cyan");
  log("─".repeat(50));
  sorted.forEach(({ path, data, chunks }) => {
    const { from, to } = data.frame_range;
    const tag = chunks ? ` (노드 청크 ${chunks}개 재조합)` : "";
    log(
      `  ✓ ${path}  [${from}~${to}) ${data.page.frames.length}개${tag}`,
      "green",
    );
  });
  log("");
  log(`  프레임 ${mergedFrames.length}/${total}개 · 구멍·중복 없음`, "green");
  log(
    `  ${replaced ? "교체" : "추가"}: pages["${pageName}"] → ${outPath}`,
    "green",
  );
  if (isDryRun) log("  (--dry-run: 파일은 쓰지 않았다)", "yellow");
  log("");
  log(`→ 다음: node scripts/check-snapshot.mjs`, "cyan");
  log("");
}
