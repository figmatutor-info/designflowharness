/**
 * tests/helpers.mjs — 검증 스크립트를 자식 프로세스로 실행하고 결과를 돌려주는 유틸.
 *
 * 스크립트는 process.exit 로 결과를 알리므로 import 하지 않고 spawn 한다.
 * 정답지는 tests/fixtures/ 에 있고, 변이 테스트는 정답지를 메모리에서 복사해
 * 임시 디렉터리에 쓴 뒤 그 경로를 스크립트에 넘긴다.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const FIXTURES = path.join(ROOT, "tests/fixtures");

export const fixture = (name) => path.join(FIXTURES, name);

/** 스크립트 실행 → { code, stdout, stderr, out(둘 합침) } */
export function run(script, args = []) {
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts", script), ...args],
    {
      cwd: ROOT, // check-assets 가 design/assets/characters 를 상대 경로로 찾는다
      encoding: "utf-8",
      env: { ...process.env, NO_COLOR: "1" },
    },
  );
  const stdout = r.stdout || "";
  const stderr = r.stderr || "";
  return { code: r.status, stdout, stderr, out: stripAnsi(stdout + stderr) };
}

export function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

export function loadJson(name) {
  return JSON.parse(readFileSync(fixture(name), "utf-8"));
}

let tmpRoot = null;
/** 테스트 프로세스 하나가 공유하는 임시 디렉터리 */
export function tmpDir() {
  if (!tmpRoot) tmpRoot = mkdtempSync(path.join(tmpdir(), "dfh-test-"));
  return tmpRoot;
}

/** 객체를 임시 JSON 파일로 쓰고 경로를 돌려준다 */
export function writeTmpJson(name, obj) {
  const p = path.join(tmpDir(), name);
  writeFileSync(p, JSON.stringify(obj));
  return p;
}

export function writeTmpText(name, text) {
  const p = path.join(tmpDir(), name);
  writeFileSync(p, text);
  return p;
}

/** 정답지를 깊은 복사한 뒤 mutate 로 결함을 넣고 임시 파일 경로를 돌려준다 */
export function mutatedSnapshot(name, tag, mutate) {
  const snap = structuredClone(loadJson(name));
  mutate(snap);
  return writeTmpJson(`${name.replace(/\.json$/, "")}.${tag}.json`, snap);
}

export const page = (snap, name) => snap.pages.find((p) => p.name === name);

/** 페이지의 모든 노드를 (frame, node) 쌍으로 순회 */
export function* nodesOf(snap, pageName) {
  const p = page(snap, pageName);
  for (const f of p.frames) for (const n of f.nodes) yield [f, n];
}

/** 조건을 만족하는 첫 노드. 없으면 throw (정답지가 바뀌었다는 뜻) */
export function findNode(snap, pageName, pred) {
  for (const [, n] of nodesOf(snap, pageName)) if (pred(n)) return n;
  throw new Error(
    `정답지에서 노드를 못 찾음 (${pageName}) — 정답지가 바뀌었는지 확인`,
  );
}

/** figma-audit --json 출력에서 결과 객체를 꺼낸다 */
export function parseAuditJson(stdout) {
  const start = stdout.indexOf("{");
  if (start === -1)
    throw new Error(`audit JSON 없음:\n${stdout.slice(0, 500)}`);
  return JSON.parse(stdout.slice(start));
}
