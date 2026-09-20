import { existsSync, readFileSync } from "node:fs";

export const CONTRACT_PATH = "design/02-structure/screen-contract.json";
const nonempty = (v) => typeof v === "string" && v.trim().length > 0;

// 화면 목적/상태는 구조 단계의 계약이다. 버튼 색상·레이어 이름과 분리한다.
export function validateContract(contract) {
  const errors = [];
  if (contract?.schema_version !== 1)
    errors.push("screen-contract schema_version은 1이어야 함");
  if (!Array.isArray(contract?.screens) || !contract.screens.length) {
    return [...errors, "screens 배열이 비어 있음"];
  }
  const ids = new Set(),
    frames = new Set(),
    screenshots = new Set();
  for (const screen of contract.screens) {
    if (!/^[a-z0-9-]+$/.test(screen?.id || "") || ids.has(screen.id))
      errors.push("화면 id 누락/중복/형식 오류");
    ids.add(screen?.id);
    if (!nonempty(screen?.purpose)) errors.push(`${screen?.id}: purpose 필요`);
    if (
      !Array.isArray(screen?.references) ||
      !screen.references.length ||
      !screen.references.every(nonempty)
    )
      errors.push(`${screen?.id}: references 필요`);
    const states = Array.isArray(screen?.states) ? screen.states : [];
    if (!states.some((s) => s?.id === "default" && s.required === true))
      errors.push(`${screen?.id}: required default 상태 필요`);
    const stateIds = new Set();
    for (const state of states) {
      const key = `${screen.id}/${state?.id}`;
      if (!/^[a-z0-9-]+$/.test(state?.id || "") || stateIds.has(state.id))
        errors.push(`${key}: 상태 id 누락/중복`);
      stateIds.add(state?.id);
      if (typeof state?.required !== "boolean")
        errors.push(`${key}: required boolean 필요`);
      if (state?.required === false) {
        if (!nonempty(state.reason)) errors.push(`${key}: 제외 사유 필요`);
        continue;
      }
      if (!nonempty(state?.frame) || frames.has(state.frame))
        errors.push(`${key}: frame 누락/중복`);
      frames.add(state?.frame);
      if (
        !/^design\/04-screens\/screenshots\/[a-z0-9-]+\.png$/.test(
          state?.screenshot || "",
        ) ||
        screenshots.has(state.screenshot)
      )
        errors.push(`${key}: screenshot 경로 누락/중복/형식 오류`);
      screenshots.add(state?.screenshot);
      if (
        !Array.isArray(state?.checks) ||
        !state.checks.length ||
        !state.checks.every(nonempty) ||
        new Set(state.checks).size !== state.checks.length
      )
        errors.push(`${key}: 중복 없는 사용자 관점 checks 필요`);
      const action = state?.action;
      if (!["single", "collection", "none"].includes(action?.mode))
        errors.push(`${key}: action.mode 오류`);
      else if (action.mode === "none") {
        if (!nonempty(action.reason))
          errors.push(`${key}: 주 행동 없음의 사유 필요`);
      } else if (!/^[a-z0-9-]+$/.test(action.id || ""))
        errors.push(`${key}: action.id 필요`);
    }
  }
  return errors;
}

export function loadContract(path = CONTRACT_PATH, required = false) {
  if (!path && !required) return null;
  if (!existsSync(path) && !required) return null; // 구형 fixture의 독립 실행만 호환
  if (!existsSync(path))
    throw new Error(
      `화면 계약 없음: ${path} — /build-structure로 생성 (docs/ui-quality.md)`,
    );
  const contract = JSON.parse(readFileSync(path, "utf8"));
  const errors = validateContract(contract);
  if (errors.length) throw new Error(errors.join("; "));
  return contract;
}

export function requiredViews(contract) {
  return contract.screens.flatMap((screen) =>
    screen.states
      .filter((s) => s.required)
      .map((state) => ({ screen: screen.id, ...state })),
  );
}

// 존재 검사일 뿐 렌더 품질 판정이 아니다. 같은 태그의 화면/상태 쌍을 대조한다.
export function previewErrors(html, contract) {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const found = [];
  for (const [tag] of source.matchAll(/<[a-z][^>]*>/gi)) {
    const screen = tag.match(/\bdata-screen\s*=\s*["']([^"']+)["']/)?.[1];
    const state = tag.match(/\bdata-state\s*=\s*["']([^"']+)["']/)?.[1];
    if (screen) found.push(`${screen}/${state || ""}`);
  }
  return requiredViews(contract).flatMap((view) => {
    const key = `${view.screen}/${view.id}`;
    const count = found.filter((v) => v === key).length;
    return count === 1 ? [] : [`${key}: HTML 시안 ${count}개 (기대 1개)`];
  });
}

export function checkActions(snapshot, contract) {
  const frames =
    snapshot.pages?.find((p) => p.name === "03 Screens")?.frames || [];
  const violations = [];
  for (const view of requiredViews(contract)) {
    const matches = frames.filter((f) => f.name === view.frame);
    if (matches.length !== 1) {
      violations.push({
        screen: view.frame,
        issue: `필수 상태 프레임 ${matches.length}개 (기대 1개)`,
      });
      continue;
    }
    const targets = (matches[0].nodes || []).filter((n) => n.actionId);
    const matched = targets.filter((n) => n.actionId === view.action.id);
    const expected =
      view.action.mode === "single"
        ? "1개"
        : view.action.mode === "collection"
          ? "1개 이상"
          : "0개";
    const valid =
      view.action.mode === "none"
        ? targets.length === 0
        : matched.length > 0 &&
          (view.action.mode !== "single" || matched.length === 1) &&
          matched.every((n) => n.isTapTarget === true) &&
          targets.length === matched.length;
    if (!valid)
      violations.push({
        screen: view.frame,
        issue: `주 행동 ${view.action.id || "none"}: actionId/탭 영역 계약 불일치`,
        expected,
      });
  }
  const known = new Set(requiredViews(contract).map((v) => v.frame));
  for (const frame of frames)
    if (!known.has(frame.name))
      violations.push({
        screen: frame.name,
        issue: "계약에 없는 화면/상태 — 계약에 등록하거나 작업 페이지로 이동",
      });
  return {
    status: violations.length ? "FAIL" : "PASS",
    count: violations.length,
    violations,
  };
}
