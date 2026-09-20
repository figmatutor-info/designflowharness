import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { requiredViews } from "./screen-contract.mjs";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const fileHash = (path) => hash(readFileSync(path));
export const EVIDENCE_PATH = "design/04-screens/build-manifest.json";
export const REVIEW_PATH = "design/04-screens/visual-review.json";
export const SNAPSHOT_PATH = "design/04-screens/figma-snapshot.json";
export const DIMENSIONS = ["hierarchy", "readability", "density", "image_relevance", "consistency"];
export const VISUAL_CHECKS = ["text_wrapping", "content_width", "image_meaning", "navigation", "scroll_behavior", "contrast"];
export const AUDIT_KEYS = ["palette_consistency", "typography_reuse", "spacing_grid", "tap_targets", "safe_area", "primary_count", "component_reuse", "token_layering", "layout_hug"];

export function projectFile(root, path) {
  const full = resolve(root, path);
  const rel = relative(resolve(root), full);
  if (!path || isAbsolute(path) || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`프로젝트 밖 경로: ${path}`);
  return full;
}

export function inputHashes(root) {
  const paths = ["PRD.md", "design/01-references/analysis.md", "design/02-structure/screens.md", "design/02-structure/flows.md", "design/02-structure/screen-contract.json", "design/03-design-rules/design-rules.md", "design/03-design-rules/design-direction.md", "design/03-design-rules/preview.html", "design/04-screens/figma-file-key.txt"];
  const rules = readFileSync(projectFile(root, "design/03-design-rules/design-rules.md"), "utf8");
  if (!/^\s*image-slots:\s*none\s*$/m.test(rules)) {
    const library = rules.match(/^\s*image-library:\s*(.+?)\s*$/m)?.[1] || "design/assets/characters";
    const walk = (dir) => {
      for (const item of readdirSync(projectFile(root, dir), { withFileTypes: true })) {
        if (item.name.startsWith(".")) continue;
        const path = `${dir}/${item.name}`;
        if (item.isDirectory()) walk(path);
        else if (item.isFile()) paths.push(path);
      }
    };
    walk(library);
  }
  return Object.fromEntries(paths.sort().map((path) => [path, fileHash(projectFile(root, path))]));
}

export function sameHashes(a, b) {
  return a && b && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => a[key] === b[key]);
}

export function captureArtifacts(root, contract, startedAt) {
  return Object.fromEntries(requiredViews(contract).map((view) => {
    const path = projectFile(root, view.screenshot);
    const bytes = readFileSync(path);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`PNG 아님: ${view.screenshot}`);
    if (statSync(path).mtimeMs < Date.parse(startedAt)) throw new Error(`캡처 시작 전 스크린샷: ${view.screenshot} — Figma에서 다시 내보낼 것`);
    return [view.screenshot, hash(bytes)];
  }));
}

// 숫자는 자동 미학 판정이 아니다. 실제 화면을 본 auditor의 근거를 빠짐없이 받는다.
export function reviewErrors(review, manifest, contract) {
  const errors = [];
  const text = (v) => typeof v === "string" && v.trim().length > 0;
  if (review?.schema_version !== 1 || review?.capture_id !== manifest.capture_id || review?.manifest_sha256 !== hash(JSON.stringify(manifest))) errors.push("시각 검수 버전/캡처/manifest 해시 불일치");
  const rows = Array.isArray(review?.views) ? review.views : [];
  const views = requiredViews(contract);
  if (rows.length !== views.length) errors.push("시각 검수 화면·상태 수 불일치");
  for (const view of views) {
    const matches = rows.filter((r) => r.frame === view.frame);
    if (matches.length !== 1) { errors.push(`${view.frame}: 시각 검수 누락/중복`); continue; }
    const row = matches[0];
    if (row.screenshot_sha256 !== manifest.screenshots[view.screenshot]) errors.push(`${view.frame}: 검수 스크린샷 해시 불일치`);
    if (!text(row.comparison)) errors.push(`${view.frame}: 승인 시안 대비 관찰 근거 필요`);
    for (const dimension of DIMENSIONS) {
      const result = row.scores?.[dimension];
      if (!Number.isInteger(result?.score) || result.score < 4 || result.score > 5 || !text(result.evidence)) errors.push(`${view.frame}: ${dimension} 4/5 이상 및 근거 필요`);
    }
    for (const key of [...VISUAL_CHECKS, ...view.checks]) {
      const check = row.checks?.[key];
      if (check?.passed !== true || !text(check.evidence)) errors.push(`${view.frame}: ${key} 검수 미완료/실패`);
    }
    if (!Array.isArray(row.issues)) errors.push(`${view.frame}: issues 배열 필요`);
    else for (const issue of row.issues) {
      if (!["critical", "major", "minor"].includes(issue?.severity) || !text(issue?.location) || !text(issue?.problem) || !text(issue?.resolution) || typeof issue?.resolved !== "boolean") errors.push(`${view.frame}: 결함 근거/수정 또는 수용 사유 필요`);
      if (["critical", "major"].includes(issue?.severity) && issue.resolved !== true) errors.push(`${view.frame}: 미해결 ${issue.severity}`);
    }
  }
  return errors;
}

export function draftReview(manifest, contract) {
  return {
    schema_version: 1, capture_id: manifest.capture_id,
    manifest_sha256: hash(JSON.stringify(manifest)),
    views: requiredViews(contract).map((view) => ({
      frame: view.frame, screenshot_sha256: manifest.screenshots[view.screenshot], comparison: "",
      scores: Object.fromEntries(DIMENSIONS.map((key) => [key, { score: null, evidence: "" }])),
      checks: Object.fromEntries([...VISUAL_CHECKS, ...view.checks].map((key) => [key, { passed: null, evidence: "" }])),
      issues: [],
    })),
  };
}
