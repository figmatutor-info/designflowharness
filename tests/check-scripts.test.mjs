/**
 * 검증 스크립트 회귀 테스트 · 앵커
 *
 * 실제 추출물(tests/fixtures/README.md)을 그대로 넣었을 때 스크립트가 어제와 같은 판정을 내리는지 본다.
 *   PASS 앵커 — 정상 산출물은 통과해야 한다
 *   FAIL 앵커 — fix 이전 Round 1 스냅샷은 정확히 알려진 위반 수로 실패해야 한다
 * 기대값이 바뀌면 스크립트 판정이 바뀐 것이다. 정답지를 고치지 말고 왜 바뀌었는지 본다.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { run, fixture, parseAuditJson, tmpDir } from "./helpers.mjs";
import path from "node:path";

const SNAP_TC = fixture("tokens-components.json");
const SNAP_R1 = fixture("screens-round1.json");
const RULES = fixture("design-rules.md");
const KEY = fixture("figma-file-key.txt");

describe("PASS 앵커 · 정상 산출물은 통과한다", () => {
  test("check-snapshot --stage tokens", () => {
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      SNAP_TC,
      "--file-key",
      KEY,
      "--stage",
      "tokens",
    ]);
    assert.equal(r.code, 0, r.out);
  });

  test("check-snapshot --stage components", () => {
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      SNAP_TC,
      "--file-key",
      KEY,
      "--stage",
      "components",
    ]);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /semantic 전부 primitive 참조/);
  });

  test("check-layout · 02 Components (고정 높이 · 오토레이아웃 누락 · 넘침 0건)", () => {
    const r = run("check-layout.mjs", [
      "--snapshot",
      SNAP_TC,
      "--rules",
      RULES,
      "--page",
      "02 Components",
    ]);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /고정 높이 컨테이너 — 0건/);
    assert.match(r.out, /콘텐츠 넘침 — 0건/);
  });

  test("check-layout · 03 Screens (Round 1 도 레이아웃 거동은 통과)", () => {
    const r = run("check-layout.mjs", [
      "--snapshot",
      SNAP_R1,
      "--rules",
      RULES,
      "--page",
      "03 Screens",
    ]);
    assert.equal(r.code, 0, r.out);
  });

  test("check-token-docs · 문서 6프레임 규격", () => {
    const r = run("check-token-docs.mjs", ["--snapshot", SNAP_TC]);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /32\/32 통과/);
  });

  test("check-assets · §I 표 ↔ design/assets/characters", () => {
    const r = run("check-assets.mjs", ["--rules", RULES]);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /8\/8 통과/);
  });

  test("verify-design-rules --strict", () => {
    const r = run("verify-design-rules.mjs", ["--path", RULES, "--strict"]);
    assert.equal(r.code, 0, r.out);
  });
});

describe("FAIL 앵커 · 알려진 결함은 알려진 방식으로 실패한다", () => {
  test("check-snapshot(screens) · Round 1 은 isPrimary 항목 하나만 실패 (25/26)", () => {
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      SNAP_R1,
      "--file-key",
      KEY,
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ 화면당 isPrimary 1개/);
    assert.match(r.out, /25\/26 통과/);
  });

  test("figma-audit · Round 1 은 6/9 · 위반 47건 (spacing 11 · tap 33 · primary 3)", () => {
    const out = path.join(tmpDir(), "audit-r1.json");
    const r = run("figma-audit.mjs", [
      "--snapshot",
      SNAP_R1,
      "--rules",
      RULES,
      "--output",
      out,
      "--json",
    ]);
    assert.equal(r.code, 1);
    const a = parseAuditJson(r.stdout);
    assert.equal(a.passed, false);
    assert.deepEqual(a.summary, {
      total_checks: 9,
      passed_checks: 6,
      total_violations: 47,
    });
    const counts = Object.fromEntries(
      Object.entries(a.results).map(([k, v]) => [k, v.count]),
    );
    assert.deepEqual(counts, {
      palette_consistency: 0,
      typography_reuse: 0,
      spacing_grid: 11,
      tap_targets: 33,
      safe_area: 0,
      primary_count: 3,
      component_reuse: 0,
      token_layering: 0,
      layout_hug: 0,
    });
    assert.equal(a.results.component_reuse.rate, 100);
    assert.equal(a.results.token_layering.checked_bindings, 212);
  });

  test("check-snapshot(screens) · 03 Screens 가 docs 프로필이면 실패", () => {
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      SNAP_TC,
      "--file-key",
      KEY,
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ 페이지 프로필 허용/);
  });

  test("figma-audit · 03 Screens 가 docs 프로필이면 감사를 거부한다", () => {
    const out = path.join(tmpDir(), "audit-docs.json");
    const r = run("figma-audit.mjs", [
      "--snapshot",
      SNAP_TC,
      "--rules",
      RULES,
      "--output",
      out,
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /profile=docs/);
  });

  test("check-snapshot · file_key 불일치는 실패", () => {
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      SNAP_TC,
      "--file-key",
      RULES,
      "--stage",
      "tokens",
    ]);
    assert.equal(r.code, 1, r.out);
  });
});
