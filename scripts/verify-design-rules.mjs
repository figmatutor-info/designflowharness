#!/usr/bin/env node
/**
 * verify-design-rules.mjs
 *
 * design-rules.md의 세부 검증 (게이트 3 전용).
 * status: confirmed 여부와 규칙 준수 여부를 엄격히 검증.
 *
 * 사용법:
 *   node scripts/verify-design-rules.mjs
 *
 * 옵션:
 *   --json           JSON 출력
 *   --strict         엄격 모드 (경고도 실패로)
 *   --path <path>    design-rules.md 경로 지정 (기본: design/03-design-rules/design-rules.md)
 *
 * exit code:
 *   0: PASS (모든 검증 통과)
 *   1: FAIL (하나라도 실패)
 */

import { readFileSync, existsSync } from "node:fs";

// ==================== 유틸 ====================

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const args = process.argv.slice(2);
const isJson = args.includes("--json");
const isStrict = args.includes("--strict");
// --name 의 값을 읽는다.
// ⚠️ `args[args.indexOf(name) + 1] || fallback` 패턴을 쓰지 말 것.
//    플래그가 없으면 indexOf 가 -1 이고 -1+1=0 이라 args[0] 이 값으로 잡힌다.
//    그래서 `--json` / `--strict` / `--stage` 같은 첫 플래그가 파일 경로로 읽혀
//    "파일 없음" 으로 죽거나(심하면 --json 이라 로그까지 막혀 무음 실패) 한다.
function getArg(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) return fallback;
  return v;
}

const rulesPath = getArg("--path", "design/03-design-rules/design-rules.md");

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

// ==================== 파싱 ====================

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};
  yaml.split("\n").forEach((line) => {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) result[m[1]] = m[2].trim();
  });
  return result;
}

function extractSection(content, sectionTitle) {
  // ⚠️ 끝 조건에 /m 의 `$` 를 쓰면 안 된다. multiline 에서 `$` 는 "모든 줄 끝"에
  //    매치되므로, non-greedy 와 만나면 제목 줄 끝에서 즉시 매치가 끝나 본문이
  //    통째로 빠진다(= 섹션이 빈 문자열). 그러면 내용 검사는 전부 "누락"으로 실패하고
  //    4배수·semantic 같은 "위반 없음" 검사는 검사할 내용이 없어 헛통과한다.
  //    문자열 끝은 `(?![\s\S])` 로 표현한다.
  const regex = new RegExp(
    `^## ${sectionTitle}[\\s\\S]*?(?=^## |^---|(?![\\s\\S]))`,
    "m",
  );
  const match = content.match(regex);
  return match ? match[0] : null;
}

function extractTokenValues(section, tokenPrefix) {
  if (!section) return [];
  const regex = new RegExp(`${tokenPrefix}[\\w-]+`, "g");
  return [...new Set(section.match(regex) || [])];
}

// ==================== 검증 함수 ====================

function checkStatus(frontmatter) {
  const results = [];

  results.push({
    name: "frontmatter 존재",
    pass: frontmatter !== null,
    severity: "critical",
    detail: frontmatter ? "OK" : "YAML frontmatter 누락",
  });

  if (!frontmatter) return results;

  results.push({
    name: "status: confirmed",
    pass: frontmatter.status === "confirmed",
    severity: "critical",
    detail: `status: ${frontmatter.status}`,
  });

  results.push({
    name: "confirmed_at 타임스탬프",
    pass: frontmatter.confirmed_at !== undefined,
    severity: "warning",
    detail: frontmatter.confirmed_at || "없음",
  });

  results.push({
    name: "version 명시",
    pass: frontmatter.version !== undefined,
    severity: "warning",
    detail: frontmatter.version || "없음",
  });

  return results;
}

function checkSections(content) {
  const requiredSections = [
    { title: "A. 색상", key: "color" },
    { title: "B. 간격", key: "space" },
    { title: "C. 타이포", key: "typography" },
    { title: "D. Radius", key: "radius" },
    { title: "E. Shadow", key: "shadow" },
    { title: "F. Motion", key: "motion" },
    { title: "G. 모바일 특화", key: "mobile" },
    { title: "H. Z-Index", key: "zindex" },
  ];

  return requiredSections.map((section) => ({
    name: `섹션 ${section.title}`,
    pass: content.includes(`## ${section.title}`),
    severity: "critical",
    detail: content.includes(`## ${section.title}`) ? "존재" : "누락",
  }));
}

function checkColorTokens(content) {
  const results = [];
  const colorSection = extractSection(content, "A\\. 색상");

  if (!colorSection) {
    results.push({
      name: "색상 섹션 파싱",
      pass: false,
      severity: "critical",
      detail: "섹션 없음",
    });
    return results;
  }

  // 필수 색상 토큰
  const requiredTokens = [
    "color-bg",
    "color-text",
    "color-text-muted",
    "color-primary",
    "color-border",
    "color-danger",
  ];

  requiredTokens.forEach((token) => {
    results.push({
      name: `필수 토큰: ${token}`,
      pass: colorSection.includes(token),
      severity: "critical",
      detail: colorSection.includes(token) ? "정의됨" : "누락",
    });
  });

  // Semantic naming (color-purple-500 같은 raw 이름 금지)
  const rawColorNames = [
    "color-purple",
    "color-blue-",
    "color-red-",
    "color-green-",
  ];
  const violations = rawColorNames.filter((name) =>
    colorSection.includes(name),
  );

  results.push({
    name: "Semantic 이름 규칙",
    pass: violations.length === 0,
    severity: "critical",
    detail:
      violations.length === 0
        ? "모두 semantic"
        : `raw 이름 발견: ${violations.join(", ")}`,
  });

  return results;
}

function checkSpacingTokens(content) {
  const results = [];
  const spaceSection = extractSection(content, "B\\. 간격");

  if (!spaceSection) {
    results.push({
      name: "간격 섹션 파싱",
      pass: false,
      severity: "critical",
      detail: "섹션 없음",
    });
    return results;
  }

  // px 값 추출
  const pxValues = [...spaceSection.matchAll(/(\d+)px/g)].map((m) =>
    parseInt(m[1]),
  );
  const invalidValues = pxValues.filter((v) => v % 4 !== 0);

  results.push({
    name: "4의 배수 규칙",
    pass: invalidValues.length === 0,
    severity: "critical",
    detail:
      invalidValues.length === 0
        ? `모든 값 4배수 (${pxValues.length}개 검사)`
        : `4배수 아닌 값: ${invalidValues.join(", ")}px`,
  });

  // 필수 space 토큰
  const requiredTokens = ["space-1", "space-2", "space-4", "space-8"];
  requiredTokens.forEach((token) => {
    results.push({
      name: `필수 토큰: ${token}`,
      pass: spaceSection.includes(token),
      severity: "warning",
      detail: spaceSection.includes(token) ? "정의됨" : "누락",
    });
  });

  return results;
}

function checkTypography(content) {
  const results = [];
  const typoSection = extractSection(content, "C\\. 타이포");

  if (!typoSection) {
    results.push({
      name: "타이포 섹션 파싱",
      pass: false,
      severity: "critical",
      detail: "섹션 없음",
    });
    return results;
  }

  // 필수 role
  const requiredRoles = ["display", "h1", "body", "caption"];
  requiredRoles.forEach((role) => {
    results.push({
      name: `필수 role: ${role}`,
      pass: typoSection.includes(role),
      severity: "critical",
      detail: typoSection.includes(role) ? "정의됨" : "누락",
    });
  });

  // 최소 본문 크기 (14px 이상)
  const bodyMatch = typoSection.match(/body\s*\|\s*(\d+)/);
  if (bodyMatch) {
    const bodySize = parseInt(bodyMatch[1]);
    results.push({
      name: "본문 최소 14px",
      pass: bodySize >= 14,
      severity: "critical",
      detail: `body: ${bodySize}px`,
    });
  }

  return results;
}

function checkMobileSpecific(content) {
  const results = [];
  const mobileSection = extractSection(content, "G\\. 모바일 특화");

  if (!mobileSection) {
    results.push({
      name: "모바일 섹션 파싱",
      pass: false,
      severity: "critical",
      detail: "섹션 없음",
    });
    return results;
  }

  // 필수 값
  const requiredValues = [
    { key: "device-frame", value: "390" },
    { key: "safe-area-top", value: "44" },
    { key: "safe-area-bottom", value: "34" },
    { key: "tap-min", value: "44" },
  ];

  requiredValues.forEach(({ key, value }) => {
    const hasKey = mobileSection.includes(key);
    const hasValue =
      hasKey && new RegExp(`${key}[^\\n]*${value}`).test(mobileSection);

    results.push({
      name: `${key} = ${value}`,
      pass: hasValue,
      severity: "critical",
      detail: hasValue ? "정확" : hasKey ? "값 다름" : "누락",
    });
  });

  return results;
}

// ==================== 출력 ====================

function printResults(allResults) {
  if (isJson) return;

  log("\n🔍 design-rules.md 세부 검증", "cyan");
  log("=".repeat(60), "cyan");
  log(`파일: ${rulesPath}`, "reset");

  allResults.forEach((section) => {
    log(`\n[${section.name}]`, "bold");
    section.checks.forEach((check) => {
      const icon = check.pass ? "✓" : check.severity === "critical" ? "✗" : "⚠";
      const color = check.pass
        ? "green"
        : check.severity === "critical"
          ? "red"
          : "yellow";
      log(`  ${icon} ${check.name}`, color);
      if (check.detail && !check.pass) {
        log(`    → ${check.detail}`, "reset");
      }
    });
  });

  // 요약
  const allChecks = allResults.flatMap((s) => s.checks);
  const passed = allChecks.filter((c) => c.pass).length;
  const total = allChecks.length;
  const criticalFails = allChecks.filter(
    (c) => !c.pass && c.severity === "critical",
  ).length;
  const warnings = allChecks.filter(
    (c) => !c.pass && c.severity === "warning",
  ).length;

  log("\n" + "=".repeat(60), "cyan");
  log(`통과: ${passed}/${total}`, passed === total ? "green" : "yellow");
  if (criticalFails > 0) log(`Critical 실패: ${criticalFails}`, "red");
  if (warnings > 0) log(`경고: ${warnings}`, "yellow");
}

function printJson(results) {
  const allChecks = results.flatMap((s) => s.checks);
  console.log(
    JSON.stringify(
      {
        file: rulesPath,
        timestamp: new Date().toISOString(),
        sections: results,
        summary: {
          total: allChecks.length,
          passed: allChecks.filter((c) => c.pass).length,
          critical_failed: allChecks.filter(
            (c) => !c.pass && c.severity === "critical",
          ).length,
          warnings: allChecks.filter((c) => !c.pass && c.severity === "warning")
            .length,
        },
      },
      null,
      2,
    ),
  );
}

// ==================== 메인 ====================

function main() {
  // 파일 존재 확인
  if (!existsSync(rulesPath)) {
    log(`\n❌ 파일 없음: ${rulesPath}`, "red");
    log("design-rules-generator를 먼저 실행해주세요.", "yellow");
    process.exit(1);
  }

  const content = readFileSync(rulesPath, "utf-8");
  const frontmatter = parseFrontmatter(content);

  // 검증 실행
  const allResults = [
    { name: "Status", checks: checkStatus(frontmatter) },
    { name: "섹션 구조", checks: checkSections(content) },
    { name: "색상 토큰", checks: checkColorTokens(content) },
    { name: "간격 토큰", checks: checkSpacingTokens(content) },
    { name: "타이포", checks: checkTypography(content) },
    { name: "모바일 특화", checks: checkMobileSpecific(content) },
  ];

  // 출력
  if (isJson) {
    printJson(allResults);
  } else {
    printResults(allResults);
  }

  // exit code 결정
  const allChecks = allResults.flatMap((s) => s.checks);
  const criticalFails = allChecks.filter(
    (c) => !c.pass && c.severity === "critical",
  ).length;
  const warnings = allChecks.filter(
    (c) => !c.pass && c.severity === "warning",
  ).length;

  const failed = isStrict ? criticalFails + warnings > 0 : criticalFails > 0;

  if (!isJson) {
    log("");
    if (!failed) {
      log("✅ 검증 통과. design-rules.md 사용 가능.", "green");
    } else {
      log("❌ 검증 실패. 위 항목 확인 필요.", "red");
    }
    log("");
  }

  process.exit(failed ? 1 : 0);
}

main();
