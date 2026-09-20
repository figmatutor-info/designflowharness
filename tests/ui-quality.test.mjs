import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, utimesSync, rmSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { ROOT, run, loadJson, fixture, writeTmpJson, tmpDir, parseAuditJson } from "./helpers.mjs";
import { validateContract, checkActions, previewErrors } from "../scripts/lib/screen-contract.mjs";
import { overflowOf } from "../scripts/lib/layout-rules.mjs";
import { EVIDENCE_PATH, REVIEW_PATH, SNAPSHOT_PATH, draftReview, fileHash, AUDIT_KEYS } from "../scripts/lib/design-evidence.mjs";

function contractFor(frames) {
  return { schema_version: 1, screens: frames.map((frame, i) => ({
    id: `screen-${i}`, purpose: "자료 탐색", references: ["analysis.md · 카드 패턴"],
    states: [{ id: "default", required: true, frame: frame.name,
      screenshot: `design/04-screens/screenshots/screen-${i}.png`,
      action: { mode: "collection", id: "open-item" }, checks: ["필터 선택이 보임"] }],
  })) };
}

test("행동 계약: 동등한 카드 여러 개 허용, 이름만 primary로 바꾸면 실패", () => {
  const frame = { name: "Library", nodes: [{ id: "1", actionId: "open-item", isTapTarget: true }, { id: "2", actionId: "open-item", isTapTarget: true }] };
  const contract = contractFor([frame]);
  const snapshot = { pages: [{ name: "03 Screens", frames: [frame] }] };
  assert.deepEqual(validateContract(contract), []);
  assert.equal(checkActions(snapshot, contract).status, "PASS");
  for (const n of frame.nodes) { delete n.actionId; n.name = "Button · primary"; n.isPrimary = true; }
  assert.equal(checkActions(snapshot, contract).status, "FAIL");
});

test("상태별 single/none 정책과 필수 상태 누락·중복을 검사", () => {
  const frame = { name: "Submit", nodes: [{ actionId: "open-item", isTapTarget: true }] };
  const contract = contractFor([frame]);
  const state = contract.screens[0].states[0];
  state.action.mode = "single";
  const snapshot = { pages: [{ name: "03 Screens", frames: [frame] }] };
  assert.equal(checkActions(snapshot, contract).status, "PASS");
  frame.nodes.push({ actionId: "open-item", isTapTarget: true });
  assert.equal(checkActions(snapshot, contract).status, "FAIL");
  state.action = { mode: "none", reason: "전송 중" };
  assert.equal(checkActions(snapshot, contract).status, "FAIL");
  frame.nodes = [];
  assert.equal(checkActions(snapshot, contract).status, "PASS");
  snapshot.pages[0].frames.push(frame);
  assert.equal(checkActions(snapshot, contract).status, "FAIL");
  snapshot.pages[0].frames = [];
  assert.equal(checkActions(snapshot, contract).status, "FAIL");
});

test("계약: 중복 id·필수 default 누락·제외 사유 누락·잘못된 경로 거부", () => {
  const good = contractFor([{ name: "Home" }]);
  for (const mutate of [
    (c) => c.screens.push(structuredClone(c.screens[0])),
    (c) => c.screens[0].states[0].required = false,
    (c) => c.screens[0].states.push({ id: "empty", required: false }),
    (c) => c.screens[0].states[0].screenshot = "../../file.png",
  ]) {
    const copy = structuredClone(good); mutate(copy);
    assert.ok(validateContract(copy).length);
  }
});

test("HTML: 화면 수만 맞추거나 주석으로 상태 마커를 넣어 통과할 수 없음", () => {
  const contract = contractFor([{ name: "Home" }]);
  const state = structuredClone(contract.screens[0].states[0]);
  state.id = "empty"; state.frame = "Home empty"; state.screenshot = "design/04-screens/screenshots/empty.png";
  contract.screens[0].states.push(state);
  const defaultHtml = '<section data-screen="screen-0" data-state="default"></section>';
  const emptyHtml = '<section data-state="empty" data-screen="screen-0"></section>';
  assert.equal(previewErrors(defaultHtml + emptyHtml, contract).length, 0);
  assert.equal(previewErrors(defaultHtml + `<!-- ${emptyHtml} -->`, contract).length, 1);
  assert.equal(previewErrors(defaultHtml + `<script>${emptyHtml}</script>`, contract).length, 1);
  assert.equal(previewErrors(defaultHtml + emptyHtml + emptyHtml, contract).length, 1);
});

test("실제 check-snapshot/audit은 계약을 공유하고 구형 isPrimary를 강제하지 않음", () => {
  const snapshot = loadJson("screens-round1.json");
  const frames = snapshot.pages.find((p) => p.name === "03 Screens").frames;
  const contract = contractFor(frames);
  for (const frame of frames) {
    for (const node of frame.nodes) delete node.isPrimary;
    const node = frame.nodes.find((n) => n.isTapTarget);
    node.actionId = "open-item";
  }
  const snapPath = writeTmpJson("contract-snapshot.json", snapshot);
  const contractPath = writeTmpJson("screen-contract.json", contract);
  const schema = run("check-snapshot.mjs", ["--snapshot", snapPath, "--file-key", fixture("figma-file-key.txt"), "--contract", contractPath]);
  assert.equal(schema.code, 0, schema.out);
  const args = ["--snapshot", snapPath, "--rules", fixture("design-rules.md"), "--contract", contractPath, "--output", path.join(tmpDir(), "contract-audit.json"), "--json"];
  const result = parseAuditJson(run("figma-audit.mjs", args).stdout);
  assert.equal(result.results.primary_count.status, "PASS");
  assert.equal(result.input_hashes.snapshot, fileHash(snapPath));
  assert.equal(result.input_hashes.contract, fileHash(contractPath));
  // 날짜를 바꾸지 않고 내용만 바꿔도 감사 입력 해시가 달라진다.
  snapshot.pages[0].frames[0].name += " changed";
  writeFileSync(snapPath, JSON.stringify(snapshot));
  assert.notEqual(result.input_hashes.snapshot, fileHash(snapPath));
});

test("스크롤은 선언한 축만 허용하고 클리핑만 설정한 넘침은 거부", () => {
  const parent = { position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, clipsContent: true, overflowDirection: "VERTICAL" };
  const child = { position: { x: 0, y: 0 }, size: { width: 100, height: 200 } };
  assert.equal(overflowOf(child, parent).exceeded, false);
  child.size.width = 110;
  assert.equal(overflowOf(child, parent).exceeded, true);
  child.size.width = 100;
  parent.overflowDirection = "NONE";
  assert.equal(overflowOf(child, parent).exceeded, true);
});

test("Figma lint와 로컬 overflow 검사가 같은 스크롤 동작을 판정", () => {
  const source = readFileSync(path.join(ROOT, "scripts/figma-lint.js"), "utf8");
  const helper = source.slice(source.indexOf("function isScrollViewport("), source.indexOf("async function isExempt("));
  const check = source.slice(source.indexOf("function checkOverflow("), source.indexOf("function checkText("));
  const lint = new Function("report", `const TOLERANCE = 1; ${helper}\n${check}\nreturn checkOverflow;`);
  for (const direction of ["NONE", "VERTICAL", "HORIZONTAL", "BOTH"]) {
    for (const clipped of [true, false]) {
      const findings = [];
      const parent = { type: "FRAME", name: "Viewport", width: 100, height: 100, clipsContent: clipped, overflowDirection: direction };
      const child = { x: 0, y: 0, width: 120, height: 200 };
      lint((...args) => findings.push(args))(child, parent, "Test");
      const local = overflowOf({ position: { x: 0, y: 0 }, size: child }, { ...parent, position: { x: 0, y: 0 }, size: parent });
      assert.equal(findings.length > 0, local.exceeded, `${direction}/${clipped}`);
    }
  }
});

test("스크롤 안의 화면 밖 텍스트는 safe-area 위반 아님; viewport 자체 침범은 실패", () => {
  const snapshot = loadJson("screens-round1.json");
  const frame = snapshot.pages.find((p) => p.name === "03 Screens").frames[0];
  const viewport = { id: "viewport", name: "Viewport", type: "FRAME", position: { x: 16, y: 100 }, size: { width: 358, height: 600 }, clipsContent: true, overflowDirection: "VERTICAL", layout: { layoutMode: "VERTICAL", vSizing: "FIXED" } };
  frame.nodes.push(viewport, { id: "offscreen-text", name: "Last item", parentId: "viewport", type: "TEXT", position: { x: 16, y: 1000 }, size: { width: 100, height: 20 }, textStyle: "Text/body" });
  const snapPath = writeTmpJson("scroll-snapshot.json", snapshot);
  const args = ["--snapshot", snapPath, "--rules", fixture("design-rules.md"), "--output", path.join(tmpDir(), "scroll-audit.json"), "--json"];
  let result = parseAuditJson(run("figma-audit.mjs", args).stdout);
  assert.equal(result.results.safe_area.status, "PASS");
  assert.equal(result.results.layout_hug.status, "PASS");
  viewport.size.height = 800;
  writeFileSync(snapPath, JSON.stringify(snapshot));
  result = parseAuditJson(run("figma-audit.mjs", args).stdout);
  assert.equal(result.results.safe_area.status, "FAIL");
});

function evidenceProject(t) {
  const root = mkdtempSync(path.join(tmpdir(), "dfh-evidence-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (file, data) => { const p = path.join(root, file); mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, typeof data === "object" && !Buffer.isBuffer(data) ? JSON.stringify(data) : data); };
  const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
  const contract = contractFor([{ name: "Library" }]);
  put("design/02-structure/screen-contract.json", contract);
  for (const file of ["PRD.md", "design/01-references/analysis.md", "design/02-structure/screens.md", "design/02-structure/flows.md", "design/03-design-rules/design-direction.md", "design/03-design-rules/preview.html"]) put(file, "reviewed design");
  put("design/03-design-rules/design-rules.md", "status: confirmed\nimage-slots: none\n");
  put("design/04-screens/figma-file-key.txt", "test-key");
  const exec = (flag) => run("design-evidence.mjs", ["--root", root, flag]);
  assert.equal(exec("--begin").code, 0);
  const pending = read(EVIDENCE_PATH);
  const snapshot = { schema_version: 4, snapshot_date: "2026-09-20", file_key: "test-key", pages: ["01 Tokens", "02 Components", "03 Screens"].map((name) => ({ name, capture_id: pending.capture_id, frames: name === "03 Screens" ? [{ name: "Library", nodes: [{ actionId: "open-item", isTapTarget: true }] }] : [] })) };
  put(SNAPSHOT_PATH, snapshot);
  const pngPath = contract.screens[0].states[0].screenshot;
  put(pngPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=", "base64"));
  const after = new Date(Date.parse(pending.started_at) + 1000);
  utimesSync(path.join(root, pngPath), after, after);
  const seal = exec("--seal"); assert.equal(seal.code, 0, seal.out);
  const manifest = read(EVIDENCE_PATH);
  const review = draftReview(manifest, contract);
  for (const view of review.views) {
    view.comparison = "승인 시안과 같은 폭이며 카드 제목과 필터의 위계가 유지됨";
    for (const score of Object.values(view.scores)) { score.score = 4; score.evidence = "Library 상단 제목과 카드 문구가 겹침 없이 읽힘"; }
    for (const check of Object.values(view.checks)) { check.passed = true; check.evidence = "Library 화면에서 조건 확인"; }
  }
  put(REVIEW_PATH, review);
  return { root, put, read, contract, exec, snapshot, pngPath, pending, review };
}

test("동결 캡처 → 봉인 → 실제 검수 입력 → PASS, 초안/중요 결함/낮은 점수는 거부", (t) => {
  const p = evidenceProject(t);
  assert.equal(p.exec("--check").code, 0);
  p.put(REVIEW_PATH, p.read("design/04-screens/visual-review.draft.json"));
  assert.equal(p.exec("--check").code, 1);
  p.review.views[0].scores.readability.score = 3;
  p.put(REVIEW_PATH, p.review);
  assert.equal(p.exec("--check").code, 1);
  p.review.views[0].scores.readability.score = 4;
  p.review.views[0].issues = [{ severity: "major", location: "카드 태그", problem: "도구명 줄바꿈", resolution: "폭 수정 필요", resolved: false }];
  p.put(REVIEW_PATH, p.review);
  assert.equal(p.exec("--check").code, 1);
});

test("캡처 후 snapshot_date가 같아도 내용/스크린샷/규칙 변경은 이전 PASS 만료", (t) => {
  const p = evidenceProject(t);
  p.snapshot.extra = "changed"; p.put(SNAPSHOT_PATH, p.snapshot);
  assert.match(p.exec("--check").out, /스냅샷\/스크린샷 변경/);
  delete p.snapshot.extra; p.put(SNAPSHOT_PATH, p.snapshot);
  p.put(p.pngPath, Buffer.concat([readFileSync(path.join(p.root, p.pngPath)), Buffer.from("changed")]));
  const after = new Date(Date.parse(p.pending.started_at) + 1000);
  utimesSync(path.join(p.root, p.pngPath), after, after);
  assert.equal(p.exec("--check").code, 1);
  p.put("design/03-design-rules/design-rules.md", "status: confirmed\nimage-slots: none\nchanged");
  assert.match(p.exec("--check").out, /입력\/규칙\/시안\/에셋 변경/);
});

test("최종 캡처: 이전 페이지/오래된 PNG/필수 상태 누락은 봉인 불가", (t) => {
  const p = evidenceProject(t);
  p.put(EVIDENCE_PATH, p.pending);
  p.snapshot.pages[0].capture_id = "old"; p.put(SNAPSHOT_PATH, p.snapshot);
  assert.match(p.exec("--seal").out, /현재 capture_id/);
  p.snapshot.pages[0].capture_id = p.pending.capture_id;
  p.snapshot.pages[2].frames = []; p.put(SNAPSHOT_PATH, p.snapshot);
  assert.match(p.exec("--seal").out, /필수 상태 프레임/);
  p.snapshot.pages[2].frames = [{ name: "Library", nodes: [{ actionId: "open-item", isTapTarget: true }] }];
  p.put(SNAPSHOT_PATH, p.snapshot);
  utimesSync(path.join(p.root, p.pngPath), new Date(0), new Date(0));
  assert.match(p.exec("--seal").out, /캡처 시작 전 스크린샷/);
});

test("merge: 다른 캡처 배치 혼합 거부, 같은 캡처는 page 메타 보존", () => {
  const batch = (from, id) => ({ schema_version: 4, file_key: "test", snapshot_date: "2026-09-20", frame_range: { from, to: from + 1, total_frames: 2 }, variables: {}, page: { name: "03 Screens", profile: "full", capture_id: id, frames: [{ name: `Screen ${from}`, nodes: [] }] } });
  const a = writeTmpJson("capture-batch-a.json", batch(0, "a"));
  const b = writeTmpJson("capture-batch-b.json", batch(1, "b"));
  const out = path.join(tmpDir(), "capture-merge.json");
  assert.match(run("merge-snapshot.mjs", [a, b, "--out", out]).out, /capture_id 불일치/);
  writeFileSync(b, JSON.stringify(batch(1, "a")));
  const result = run("merge-snapshot.mjs", [a, b, "--out", out]);
  assert.equal(result.code, 0, result.out);
  assert.equal(JSON.parse(readFileSync(out)).pages[0].capture_id, "a");
});

test("최종 게이트: 로그 제목 대신 상태를 확인, 날짜가 같아도 오래된 audit 거부", (t) => {
  const p = evidenceProject(t);
  symlinkSync(path.join(ROOT, "scripts"), path.join(p.root, "scripts"), "dir");
  p.put("design/04-screens/build-log.md", "## STAGE=tokens ✅\n## STAGE=components ✅\n## STAGE=screens ✅\n");
  p.put("design/04-screens/audit-report.md", "PASS라고 쓴 문서만으로 통과할 수 없음");
  const contractPath = "design/02-structure/screen-contract.json";
  const frames = Array.from({ length: 5 }, (_, i) => ({ name: `Screen ${i}`, nodes: [{ actionId: "open-item", isTapTarget: true }] }));
  p.put(contractPath, contractFor(frames));
  p.snapshot.pages[2].frames = frames;
  p.put(SNAPSHOT_PATH, p.snapshot);
  const png = readFileSync(path.join(p.root, p.pngPath));
  for (let i = 1; i < 5; i++) p.put(`design/04-screens/screenshots/screen-${i}.png`, png);
  const audit = {
    passed: true, snapshot_date: p.snapshot.snapshot_date,
    input_hashes: { snapshot: fileHash(path.join(p.root, SNAPSHOT_PATH)), rules: fileHash(path.join(p.root, "design/03-design-rules/design-rules.md")), contract: fileHash(path.join(p.root, contractPath)) },
    results: Object.fromEntries(AUDIT_KEYS.map((key) => [key, { status: "PASS" }])),
    summary: { total_checks: 9, passed_checks: 9, total_violations: 0 },
  };
  p.put("design/04-screens/audit-structural.json", audit);
  const gate = () => {
    const result = spawnSync(process.execPath, [path.join(ROOT, "scripts/check-phase.mjs"), "--phase", "screens", "--json", "--shallow"], { cwd: p.root, encoding: "utf8" });
    return JSON.parse(result.stdout);
  };
  let result = gate();
  const check = (name) => result.results[0].checks.find((c) => c.name === name);
  assert.equal(check("필수 화면·상태 산출물").pass, true);
  assert.equal(check("audit 통과 (구조 검증 결과)").pass, true);
  assert.equal(result.overall_passed, false, "shallow 진단으로 완료 판정 불가");
  p.snapshot.changed = true; p.put(SNAPSHOT_PATH, p.snapshot);
  result = gate();
  assert.equal(check("audit 통과 (구조 검증 결과)").pass, false);
  assert.match(check("audit 통과 (구조 검증 결과)").detail, /해시/);
});
