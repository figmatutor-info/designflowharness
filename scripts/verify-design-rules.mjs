#!/usr/bin/env node
/**
 * verify-design-rules.mjs
 *
 * design-rules.md의 세부 검증 (게이트 3 전용).
 * status: confirmed 여부와 규칙 준수 여부를 엄격히 검증.
 *
 * 토큰 2계층 검증 포함:
 *   A(색상) / B(간격) / D(Radius) / G(모바일 size) 각 섹션이
 *   "### Primitive"(값) 와 "### Semantic"({primitive} 참조) 를 모두 갖는지,
 *   semantic 에 hex/px 가 직결돼 있지 않은지 본다.
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
    { title: "I. 이미지", key: "image" },
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

// ==================== 토큰 계층 (2계층 강제) ====================

// 한 섹션 안에서 "### Primitive" / "### Semantic" 블록을 잘라낸다.
// 끝 조건에 /m 의 `$` 를 쓰지 않는 이유는 extractSection() 주석과 같다.
function extractSubsection(section, title) {
  if (!section) return null;
  const re = new RegExp(
    `^### ${title}[\\s\\S]*?(?=^### |^## |(?![\\s\\S]))`,
    "m",
  );
  const m = section.match(re);
  return m ? m[0] : null;
}

// 표의 데이터 행에서 두 번째 칸(값/참조)만 뽑는다.
// 헤더(| 토큰 | 값 |)와 구분선(| --- | --- |)은 제외.
function tableValueCells(block) {
  if (!block) return [];
  return block
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((cells) => cells.length >= 4)
    .filter((cells) => !/^-{2,}$/.test(cells[2].replace(/\s/g, "")))
    .filter((cells) => cells[1] && !/^(토큰|Semantic|이름)$/i.test(cells[1]))
    .map((cells) => ({ token: cells[1], value: cells[2] }));
}

const LAYERED_SECTIONS = [
  { title: "A\\. 색상", label: "색상" },
  { title: "B\\. 간격", label: "간격" },
  { title: "D\\. Radius", label: "Radius" },
  { title: "G\\. 모바일 특화", label: "모바일(size)" },
];

function checkTokenLayering(content) {
  const results = [];

  LAYERED_SECTIONS.forEach(({ title, label }) => {
    const section = extractSection(content, title);
    if (!section) {
      results.push({
        name: `${label} 섹션 파싱`,
        pass: false,
        severity: "critical",
        detail: "섹션 없음",
      });
      return;
    }

    const primitive = extractSubsection(section, "Primitive");
    const semantic = extractSubsection(section, "Semantic");

    results.push({
      name: `${label} · ### Primitive 존재`,
      pass: Boolean(primitive),
      severity: "critical",
      detail: primitive ? "존재" : "누락 — 참조할 원본 계층이 없다",
    });

    results.push({
      name: `${label} · ### Semantic 존재`,
      pass: Boolean(semantic),
      severity: "critical",
      detail: semantic ? "존재" : "누락",
    });

    if (!semantic) return;

    const rows = tableValueCells(semantic);

    // semantic 값 칸은 {primitive-name} 참조여야 한다.
    // device-frame(390×844)처럼 참조 대상이 없는 상수는 예외로 둔다.
    const CONSTANT_TOKENS = ["device-frame"];
    const target = rows.filter((r) => !CONSTANT_TOKENS.includes(r.token));

    const notRef = target.filter((r) => !/^\{[\w-]+\}$/.test(r.value));
    results.push({
      name: `${label} · Semantic 이 primitive 참조`,
      pass: target.length > 0 && notRef.length === 0,
      severity: "critical",
      detail:
        target.length === 0
          ? "Semantic 표에 행이 없다"
          : notRef.length === 0
            ? `${target.length}개 전부 {primitive} 참조`
            : `값 직결 ${notRef.length}개: ${notRef
                .slice(0, 4)
                .map((r) => `${r.token}=${r.value}`)
                .join(", ")}`,
    });

    // 값 직결의 대표 징후를 따로 집어준다 (수정 지점이 바로 보이게)
    const hardcoded = target.filter((r) =>
      /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\b\d+px\b/.test(r.value),
    );
    results.push({
      name: `${label} · Semantic 에 생값 없음`,
      pass: hardcoded.length === 0,
      severity: "critical",
      detail:
        hardcoded.length === 0
          ? "없음"
          : `hex/px 직결: ${hardcoded
              .slice(0, 4)
              .map((r) => `${r.token}=${r.value}`)
              .join(", ")}`,
    });

    // primitive 는 값을 가져야 한다 (참조로 적혀 있으면 계층이 뒤집힌 것)
    if (primitive) {
      const primRows = tableValueCells(primitive);
      const primAsRef = primRows.filter((r) => /^\{[\w-]+\}$/.test(r.value));
      results.push({
        name: `${label} · Primitive 는 값 보유`,
        pass: primRows.length > 0 && primAsRef.length === 0,
        severity: "critical",
        detail:
          primRows.length === 0
            ? "Primitive 표에 행이 없다"
            : primAsRef.length === 0
              ? `${primRows.length}개 전부 값`
              : `참조로 적힌 primitive: ${primAsRef
                  .map((r) => r.token)
                  .slice(0, 4)
                  .join(", ")}`,
      });
    }
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
    { name: "토큰 계층", checks: checkTokenLayering(content) },
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
