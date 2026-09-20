#!/usr/bin/env node
import { getArg } from "./lib/cli.mjs";
import { CONTRACT_PATH, loadContract, requiredViews } from "./lib/screen-contract.mjs";
try {
  const contract = loadContract(getArg("--contract", CONTRACT_PATH), true);
  console.log(`✓ 화면 계약: ${contract.screens.length}개 화면 · 필수 상태 ${requiredViews(contract).length}개`);
} catch (error) {
  console.error(`✗ 화면 계약: ${error.code === "ENOENT" ? "screen-contract.json 없음 — /build-structure로 생성 (docs/ui-quality.md 참고)" : error.message}`);
  process.exitCode = 1;
}
