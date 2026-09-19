/**
 * scripts/lib/cli.mjs — 로컬 검증 스크립트(.mjs)의 공통 CLI 유틸.
 *
 * check-*.mjs / verify-design-rules.mjs / merge-snapshot.mjs / figma-audit.mjs 가 전부
 * 같은 getArg·COLORS·log 를 복붙해 쓰던 것을 한 곳으로 모았다.
 *
 * ⚠️ scripts/figma-*.js (Figma 샌드박스에서 use_figma 로 실행) 는 import 를 못 쓴다.
 *    그쪽은 여기 코드를 import 하지 않고 미러 주석으로만 연결된다.
 */

export const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

/** process.argv 에서 스크립트 경로를 뺀 인자 목록 */
export const args = process.argv.slice(2);

/** `--flag` 존재 여부 */
export function hasFlag(name) {
  return args.includes(name);
}

/**
 * `--name value` 의 value 를 읽는다.
 *
 * ⚠️ `args[args.indexOf(name) + 1] || fallback` 패턴을 쓰지 말 것.
 *    플래그가 없으면 indexOf 가 -1 이고 -1+1=0 이라 args[0] 이 값으로 잡힌다.
 *    그래서 `--json` / `--strict` / `--stage` 같은 첫 플래그가 파일 경로로 읽혀
 *    "파일 없음" 으로 죽거나(심하면 --json 이라 로그까지 막혀 무음 실패) 한다.
 */
export function getArg(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) return fallback;
  return v;
}

/**
 * 색상 로거. `isJson` 이면 stdout 을 JSON 전용으로 비워 두기 위해 아무것도 찍지 않는다.
 *   const log = createLog(isJson);  log("메시지", "red");
 */
export function createLog(isJson) {
  return function log(msg, color = "reset") {
    if (isJson) return;
    console.log(`${COLORS[color] || COLORS.reset}${msg}${COLORS.reset}`);
  };
}
