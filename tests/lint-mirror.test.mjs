/**
 * figma-lint.js 는 Figma 샌드박스에서 돌아 import 를 못 쓴다. 그래서 scripts/lib/layout-rules.mjs 의
 * 상수 3개를 "미러 주석" 으로 베껴 둔다. 한쪽만 바꾸면 lint(즉시 검증)와 check-layout / figma-audit
 * (게이트 검증)의 기준이 조용히 어긋난다 — lint 는 0건인데 게이트가 FAIL 하는 상황이 그것이다.
 *
 * 이 테스트는 두 파일의 상수 정의를 문자 단위로 비교한다.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./helpers.mjs";
import * as rules from "../scripts/lib/layout-rules.mjs";

const lintSrc = readFileSync(path.join(ROOT, "scripts/figma-lint.js"), "utf-8");

function lintConst(name) {
  // `const NAME = <값>;` — 값이 여러 줄(정규식이 다음 줄에 올 수 있다)이어도 첫 `;` 까지 잡는다
  const m = lintSrc.match(new RegExp(`const ${name} =[^;]*;`));
  assert.ok(m, `figma-lint.js 에 const ${name} 가 없다`);
  return m[0];
}

test("TOLERANCE 미러 일치", () => {
  const m = lintConst("TOLERANCE").match(/=\s*([\d.]+)/);
  assert.equal(Number(m[1]), rules.TOLERANCE);
});

test("BUILTIN_EXEMPT 정규식 미러 일치", () => {
  // 주석(// mirror of …)이 같은 줄에 있으므로 `/^` 로 시작하는 정규식 리터럴만 잡는다
  const m = lintConst("BUILTIN_EXEMPT").match(/\/\^[\s\S]*?\/[a-z]*(?=\s*;)/);
  assert.ok(m, "BUILTIN_EXEMPT 정규식 리터럴을 못 찾음");
  assert.equal(m[0], rules.BUILTIN_EXEMPT.toString());
});

test("CONTAINER_TYPES 집합 미러 일치", () => {
  const m = lintConst("CONTAINER_TYPES").match(/new Set\(\[(.*?)\]\)/s);
  assert.ok(m, "CONTAINER_TYPES Set 리터럴을 못 찾음");
  const lintSet = m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .sort();
  assert.deepEqual(lintSet, [...rules.CONTAINER_TYPES].sort());
});

test("figma-lint.js 는 여전히 미러 주석으로 lib 를 가리킨다 (연결 근거가 지워지면 실패)", () => {
  assert.match(lintSrc, /layout-rules\.mjs/);
});
