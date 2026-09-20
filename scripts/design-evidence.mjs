#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getArg, hasFlag } from "./lib/cli.mjs";
import {
  CONTRACT_PATH,
  loadContract,
  checkActions,
} from "./lib/screen-contract.mjs";
import {
  EVIDENCE_PATH,
  REVIEW_PATH,
  SNAPSHOT_PATH,
  fileHash,
  projectFile,
  inputHashes,
  sameHashes,
  captureArtifacts,
  reviewErrors,
  draftReview,
} from "./lib/design-evidence.mjs";

const root = getArg("--root", process.cwd());
const local = (path) => projectFile(root, path);
const read = (path) => JSON.parse(readFileSync(local(path), "utf8"));
const write = (path, value) => {
  mkdirSync(dirname(local(path)), { recursive: true });
  writeFileSync(local(path), JSON.stringify(value, null, 2) + "\n");
};

try {
  if (["--begin", "--seal", "--check"].filter(hasFlag).length > 1)
    throw new Error("begin/seal/check는 한 번에 하나만 실행");
  const contract = loadContract(local(CONTRACT_PATH), true);
  const inputs = inputHashes(root);
  if (hasFlag("--begin")) {
    const manifest = {
      schema_version: 1,
      status: "pending",
      capture_id: randomUUID(),
      started_at: new Date().toISOString(),
      inputs,
    };
    write(EVIDENCE_PATH, manifest);
    console.log(
      `✓ capture 시작: ${manifest.capture_id}\nFigma 수정 동결 → 세 페이지에 같은 __CAPTURE_ID__로 추출 → 모든 필수 스크린샷 재출력 → --seal`,
    );
  } else {
    const manifest = read(EVIDENCE_PATH);
    if (
      manifest.schema_version !== 1 ||
      !/^[a-f0-9-]{36}$/.test(manifest.capture_id || "") ||
      !Number.isFinite(Date.parse(manifest.started_at))
    )
      throw new Error("잘못된 build-manifest — --begin 필요");
    if (!sameHashes(manifest.inputs, inputs))
      throw new Error(
        "입력/규칙/시안/에셋 변경 — --begin 후 재추출·재검수 필요",
      );
    const snapshot = read(SNAPSHOT_PATH);
    if (
      snapshot.file_key !==
      readFileSync(local("design/04-screens/figma-file-key.txt"), "utf8").trim()
    )
      throw new Error("Figma 파일 키 불일치");
    for (const name of ["01 Tokens", "02 Components", "03 Screens"]) {
      const pages = snapshot.pages?.filter((p) => p.name === name) || [];
      if (pages.length !== 1 || pages[0].capture_id !== manifest.capture_id)
        throw new Error(`${name}: 현재 capture_id로 전체 페이지 재추출 필요`);
    }
    const actions = checkActions(snapshot, contract);
    if (actions.status !== "PASS")
      throw new Error(
        actions.violations.map((v) => `${v.screen}: ${v.issue}`).join("; "),
      );
    const screenshots = captureArtifacts(root, contract, manifest.started_at);
    const snapshotHash = fileHash(local(SNAPSHOT_PATH));
    if (hasFlag("--seal")) {
      if (manifest.status !== "pending")
        throw new Error("이미 봉인됨 — 수정했다면 --begin부터 재시작");
      const sealed = {
        ...manifest,
        status: "captured",
        captured_at: new Date().toISOString(),
        snapshot_sha256: snapshotHash,
        screenshots,
      };
      write(EVIDENCE_PATH, sealed);
      write(
        "design/04-screens/visual-review.draft.json",
        draftReview(sealed, contract),
      );
      console.log(
        "✓ 캡처 봉인 (품질 PASS 아님). audit 실행 후 실제 화면을 검수해 visual-review.json 작성",
      );
    } else {
      if (
        manifest.status !== "captured" ||
        manifest.snapshot_sha256 !== snapshotHash ||
        !sameHashes(manifest.screenshots, screenshots)
      )
        throw new Error(
          "캡처 미완료 또는 스냅샷/스크린샷 변경 — --begin 후 재추출·재검수 필요",
        );
      const errors = reviewErrors(read(REVIEW_PATH), manifest, contract);
      if (errors.length) throw new Error(errors.join("; "));
      console.log("✓ 캡처 신선도·필수 상태·시각 검수 PASS (구조 검수는 별도)");
    }
  }
} catch (error) {
  console.error(`✗ 디자인 증거: ${error.message}`);
  process.exitCode = 1;
}
