#!/usr/bin/env node
/**
 * check-phase.mjs
 *
 * 통합 게이트 체커. 각 Phase의 통과 조건을 자동 검증.
 *
 * 사용법:
 *   node scripts/check-phase.mjs --phase references
 *   node scripts/check-phase.mjs --phase structure
 *   node scripts/check-phase.mjs --phase rules
 *   node scripts/check-phase.mjs --phase screens
 *   node scripts/check-phase.mjs --phase all
 *
 * 옵션:
 *   --json    JSON 형식으로 출력
 *   --quiet   PASS/FAIL만 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
const isQuiet = args.includes("--quiet");
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

const phase = getArg("--phase", "all");

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function fileExists(path) {
  return existsSync(path);
}

function readFile(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function countFiles(dir, ext) {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter((f) => f.endsWith(ext)).length;
  } catch {
    return 0;
  }
}

// ==================== 게이트 1: 레퍼런스 ====================

function checkReferences() {
  const results = [];
  const rawDir = "design/01-references/raw";
  const analysisPath = "design/01-references/analysis.md";

  // 1. raw 폴더 존재
  results.push({
    name: "raw 폴더 존재",
    pass: existsSync(rawDir),
    detail: rawDir,
  });

  // 2. 스크린샷 3개 이상
  const screenshotCount = countFiles(rawDir, ".png");
  results.push({
    name: "스크린샷 3개 이상",
    pass: screenshotCount >= 3,
    detail: `${screenshotCount}장 발견 (최소 3장 필요)`,
  });

  // 3. analysis.md 존재
  results.push({
    name: "analysis.md 존재",
    pass: fileExists(analysisPath),
    detail: analysisPath,
  });

  // 4. analysis.md 필수 섹션
  if (fileExists(analysisPath)) {
    const content = readFile(analysisPath);
    const requiredSections = ["UX 패턴", "시각 패턴", "컴포넌트 패턴"];
    const missingSections = requiredSections.filter(
      (s) => !content.includes(s),
    );

    results.push({
      name: "analysis.md 필수 섹션",
      pass: missingSections.length === 0,
      detail:
        missingSections.length === 0
          ? "모든 섹션 존재"
          : `누락: ${missingSections.join(", ")}`,
    });

    // 5. 각 카테고리 최소 3개 패턴
    const uxPatternCount = (content.match(/^### \d+\./gm) || []).length;
    results.push({
      name: "패턴 최소 개수 (총 9개+)",
      pass: uxPatternCount >= 9,
      detail: `${uxPatternCount}개 발견 (권장 9개+)`,
    });
  }

  return {
    phase: "references",
    gate: 1,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// ==================== 게이트 2: 화면 구조 ====================

function checkStructure() {
  const results = [];
  const screensPath = "design/02-structure/screens.md";
  const flowsPath = "design/02-structure/flows.md";

  // 1. screens.md 존재
  results.push({
    name: "screens.md 존재",
    pass: fileExists(screensPath),
    detail: screensPath,
  });

  // 2. flows.md 존재
  results.push({
    name: "flows.md 존재",
    pass: fileExists(flowsPath),
    detail: flowsPath,
  });

  if (fileExists(screensPath)) {
    const content = readFile(screensPath);

    // 3. 화면 5개 이상 (## 화면 N · ... 형식)
    const screenCount = (content.match(/^## 화면 \d+/gm) || []).length;
    results.push({
      name: "화면 5개 이상",
      pass: screenCount >= 5,
      detail: `${screenCount}개 화면 (최소 5개 필요)`,
    });

    // 4. 필수 필드 (primary 액션 언급)
    const primaryCount = (content.match(/primary/gi) || []).length;
    results.push({
      name: "primary 액션 정의",
      pass: primaryCount >= screenCount,
      detail: `primary 언급 ${primaryCount}회 (화면당 1개 필요)`,
    });

    // 5. 레퍼런스 매칭
    const patternMatchCount = (content.match(/analysis\.md/gi) || []).length;
    results.push({
      name: "레퍼런스 매칭 (analysis.md 참조)",
      pass: patternMatchCount >= screenCount,
      detail: `매칭 언급 ${patternMatchCount}회 (화면당 1개 이상)`,
    });
  }

  if (fileExists(flowsPath)) {
    const content = readFile(flowsPath);

    // 6. 시나리오 2-3개
    const scenarioCount = (content.match(/^## 시나리오 \d+/gm) || []).length;
    results.push({
      name: "시나리오 2-3개",
      pass: scenarioCount >= 2 && scenarioCount <= 5,
      detail: `${scenarioCount}개 시나리오 (2-3개 권장)`,
    });
  }

  return {
    phase: "structure",
    gate: 2,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// ==================== 게이트 3: 디자인 규칙 ====================

function checkRules() {
  const results = [];
  const rulesPath = "design/03-design-rules/design-rules.md";
  const tokensPath = "design/03-design-rules/tokens.md";
  const componentsPath = "design/03-design-rules/components.md";

  // 1. design-rules.md 존재
  results.push({
    name: "design-rules.md 존재",
    pass: fileExists(rulesPath),
    detail: rulesPath,
  });

  // 2. tokens.md 존재
  results.push({
    name: "tokens.md 존재",
    pass: fileExists(tokensPath),
    detail: tokensPath,
  });

  // 3. components.md 존재
  results.push({
    name: "components.md 존재",
    pass: fileExists(componentsPath),
    detail: componentsPath,
  });

  if (fileExists(rulesPath)) {
    const content = readFile(rulesPath);

    // 4. status: confirmed
    const statusMatch = content.match(/^status:\s*(\w+)/m);
    const status = statusMatch ? statusMatch[1] : "unknown";
    results.push({
      name: "status: confirmed",
      pass: status === "confirmed",
      detail: `현재 status: ${status}`,
    });

    // 5. 필수 섹션 (A ~ I)
    const requiredSections = [
      "## A. 색상",
      "## B. 간격",
      "## C. 타이포",
      "## D. Radius",
      "## E. Shadow",
      "## F. Motion",
      "## G. 모바일 특화",
      "## H. Z-Index",
      "## I. 이미지",
    ];
    const missingSections = requiredSections.filter(
      (s) => !content.includes(s),
    );
    results.push({
      name: "필수 섹션 9개 (A-I)",
      pass: missingSections.length === 0,
      detail:
        missingSections.length === 0
          ? "모든 섹션 존재"
          : `누락: ${missingSections.join(", ")}`,
    });

    // 6. color-primary 정의됨
    results.push({
      name: "color-primary 정의",
      pass: /color-primary/.test(content),
      detail: /color-primary/.test(content) ? "정의됨" : "누락",
    });

    // 7. 컴포넌트 카탈로그 완결성
    //
    // 왜 있나: default-tokens.md 는 규칙의 상위 소스다. 그런데 Phase 2 의 컴포넌트
    // 목록은 "화면 기능에서 역산"하는 방식이라, Icon·Divider 처럼 다른 컴포넌트
    // 안에 들어가는 원자 요소를 구조적으로 놓친다. 그 누락이 Phase 3 로 그대로
    // 상속되면 figma-builder 는 "규칙에 없는 값은 만들지 않는다"는 원칙에 따라
    // 플레이스홀더로 대체하고 넘어간다 (실제로 Icon 이 회색 원으로 나온 사례).
    //
    // 그래서 여기서 default 대비 차집합을 기계로 막는다. 버리는 건 자유지만,
    // 버렸다고 말은 해야 한다.
    results.push(checkComponentCatalog(content, componentsPath));
  }

  return {
    phase: "rules",
    gate: 3,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// default-tokens.md 의 "## 컴포넌트 기본값" 아래 ### 항목들을 뽑는다.
function defaultComponentNames() {
  const src = readFile("scripts/default-tokens.md");
  if (!src) return [];
  const section =
    src.match(/^## 컴포넌트 기본값[\s\S]*?(?=^## |(?![\s\S]))/m)?.[0] || "";
  return [...section.matchAll(/^### +(.+?)\s*$/gm)].map((m) => m[1].trim());
}

// 이름 비교용 정규화: 공백·하이픈·슬래시 제거 + 소문자.
// "Tab Bar" 와 "BottomTabBar" 가 같은 것을 가리키도록 부분일치를 허용한다.
function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\s\-_/()]+/g, "")
    .replace(/[^a-z0-9가-힣]/g, "");
}

// design-rules.md 의 "의도적 제외" 표에서 첫 칸(항목명)을 뽑는다.
// | 항목 | 사유 | 형태의 표를 기대한다.
function declaredExclusions(rulesContent) {
  const section =
    rulesContent.match(/의도적 제외[\s\S]*?(?=^## |(?![\s\S]))/m)?.[0] || "";
  return [...section.matchAll(/^\|\s*([^|\r\n]+?)\s*\|/gm)]
    .map((m) => m[1].trim())
    .filter((v) => v && !/^-+$/.test(v) && !/^항목$/.test(v));
}

function checkComponentCatalog(rulesContent, componentsPath) {
  const defaults = defaultComponentNames();

  if (defaults.length === 0) {
    return {
      name: "컴포넌트 카탈로그 완결성",
      pass: true,
      detail: "default-tokens.md 에 컴포넌트 기본값 섹션 없음 — 검사 생략",
    };
  }
  if (!fileExists(componentsPath)) {
    return {
      name: "컴포넌트 카탈로그 완결성",
      pass: false,
      detail: `${componentsPath} 없음 — 대조 불가`,
    };
  }

  // 본문이 아니라 "헤딩"만 본다.
  // 본문에는 "- Icon: icon-md" 같은 속성 줄이 흔해서, 본문까지 보면
  // 컴포넌트 정의가 없어도 통과해버린다 (이번 Icon 사고가 정확히 그 형태였다).
  const componentsSrc = readFile(componentsPath);
  const headings = [...componentsSrc.matchAll(/^#{2,3} +(.+?)\s*$/gm)].map(
    (m) => normalizeName(m[1]),
  );
  const exclusions = declaredExclusions(rulesContent).map(normalizeName);

  const missing = defaults.filter((name) => {
    const key = normalizeName(name);
    if (!key) return false;
    const covered = headings.some((h) => h.includes(key) || key.includes(h));
    const excluded = exclusions.some((e) => e.includes(key) || key.includes(e));
    return !covered && !excluded;
  });

  return {
    name: "컴포넌트 카탈로그 완결성",
    pass: missing.length === 0,
    detail:
      missing.length === 0
        ? `default 컴포넌트 ${defaults.length}개 모두 반영 또는 제외 선언됨`
        : `default-tokens.md 의 [${missing.join(", ")}] 가 components.md 에 없습니다.\n` +
          `    → 포함하거나, design-rules.md 의 "의도적 제외" 표에 '| 항목 | 사유 |' 로 선언하세요.`,
  };
}

// design-rules.md §I 의 `image-slots:` 선언을 읽는다.
// "none" 이면 이 프로젝트는 이미지를 쓰지 않는다고 선언한 것이므로
// assets STAGE 와 이미지 슬롯 검사를 "해당 없음"으로 통과시킨다.
// (가계부·설정·계산기처럼 사진이 정당하게 없는 앱을 게이트가 막지 않게 한다)
function readImagePolicy() {
  const content = readFile("design/03-design-rules/design-rules.md");
  if (!content) return "used";
  const m = content.match(/^\s*image-slots:\s*(used|none)\s*$/m);
  return m ? m[1] : "used";
}

// ==================== 게이트 4: Figma 화면 ====================

function checkScreens() {
  const results = [];
  const fileKeyPath = "design/04-screens/figma-file-key.txt";
  const buildLogPath = "design/04-screens/build-log.md";
  const screenshotDir = "design/04-screens/screenshots";
  const auditReportPath = "design/04-screens/audit-report.md";
  const snapshotPath = "design/04-screens/figma-snapshot.json";
  const manifestPath = "design/04-screens/assets/assets-manifest.json";
  const imagePolicy = readImagePolicy();
  const usesImages = imagePolicy !== "none";

  // 1. figma-file-key.txt 존재 (사용자가 만든 Figma 파일의 키)
  const fileKey = readFile(fileKeyPath)?.trim();
  results.push({
    name: "figma-file-key.txt 존재",
    pass: Boolean(fileKey),
    detail: fileKey
      ? `키 확인: ${fileKey}`
      : `${fileKeyPath} 없음 또는 비어있음`,
  });

  // 2. build-log.md 존재
  results.push({
    name: "build-log.md 존재",
    pass: fileExists(buildLogPath),
    detail: buildLogPath,
  });

  if (fileExists(buildLogPath)) {
    const content = readFile(buildLogPath);

    // 3. tokens STAGE 완료
    results.push({
      name: "STAGE=tokens 완료",
      pass: /## STAGE=tokens.*✅/.test(content),
      detail: /## STAGE=tokens.*✅/.test(content) ? "완료" : "미완료",
    });

    // 4. components STAGE 완료
    results.push({
      name: "STAGE=components 완료",
      pass: /## STAGE=components.*✅/.test(content),
      detail: /## STAGE=components.*✅/.test(content) ? "완료" : "미완료",
    });

    // 4-2. assets STAGE 완료 (이미지 생성)
    //      image-slots: none 이면 이 STAGE 자체가 없는 게 정상이다.
    results.push({
      name: "STAGE=assets 완료",
      pass: usesImages ? /## STAGE=assets.*✅/.test(content) : true,
      detail: !usesImages
        ? "해당 없음 (design-rules §I image-slots: none)"
        : /## STAGE=assets.*✅/.test(content)
          ? "완료"
          : "미완료",
    });

    // 5. screens STAGE 완료 (모든 화면)
    const screenComplete = (content.match(/^## screen: \d+/gm) || []).length;
    results.push({
      name: "screens STAGE 완료 (5개+)",
      pass: screenComplete >= 5,
      detail: `${screenComplete}개 화면 로그 (최소 5개)`,
    });
  }

  // 6. 스크린샷 5개 이상
  const screenshotCount = countFiles(screenshotDir, ".png");
  results.push({
    name: "스크린샷 5장 이상",
    pass: screenshotCount >= 5,
    detail: `${screenshotCount}장 발견`,
  });

  // 7. figma-snapshot.json 존재 + 최소 형태
  //    (상세 스키마 검증은 npm run check:snapshot — 여기선 audit 실행 가능 여부만 본다)
  if (!fileExists(snapshotPath)) {
    results.push({
      name: "figma-snapshot.json 유효",
      pass: false,
      detail: `${snapshotPath} 없음 — figma-audit.mjs 실행 불가 (figma-builder가 Write 해야 함)`,
    });
  } else {
    let detail = "";
    let pass = false;
    try {
      const snap = JSON.parse(readFile(snapshotPath));
      const screensPage = snap.pages?.find((p) => p.name === "03 Screens");
      const frameCount = screensPage?.frames?.length ?? 0;
      const keyOk = snap.file_key && snap.file_key !== "__FILE_KEY__";
      const keyMatches = !fileKey || snap.file_key === fileKey;

      pass = frameCount >= 5 && keyOk && keyMatches;

      if (!screensPage) detail = '"03 Screens" 페이지 없음';
      else if (frameCount < 5)
        detail = `화면 프레임 ${frameCount}개 (최소 5개)`;
      else if (!keyOk) detail = "file_key 비어있음 또는 __FILE_KEY__ 미치환";
      else if (!keyMatches)
        detail = `file_key 불일치 (txt=${fileKey} / snapshot=${snap.file_key})`;
      else detail = `화면 ${frameCount}개 · file_key 일치`;
    } catch (err) {
      detail = `JSON 파싱 실패: ${err.message}`;
    }

    results.push({ name: "figma-snapshot.json 유효", pass, detail });
  }

  // 8. assets-manifest.json 존재 (상세 검증은 npm run check:assets)
  if (!usesImages) {
    results.push({
      name: "assets-manifest.json 존재",
      pass: true,
      detail: "해당 없음 (image-slots: none)",
    });
  } else if (!fileExists(manifestPath)) {
    results.push({
      name: "assets-manifest.json 존재",
      pass: false,
      detail: `${manifestPath} 없음 — STAGE=assets 미실행`,
    });
  } else {
    let pass = false;
    let detail = "";
    try {
      const m = JSON.parse(readFile(manifestPath));
      const slots = Array.isArray(m.slots) ? m.slots : [];
      pass = slots.length > 0;
      detail = pass
        ? `슬롯 ${slots.length}개 (상세: npm run check:assets)`
        : "slots 비어있음";
    } catch (err) {
      detail = `JSON 파싱 실패: ${err.message}`;
    }
    results.push({ name: "assets-manifest.json 존재", pass, detail });
  }

  // 9. 이미지 슬롯이 실제로 채워졌는지 (회색 플레이스홀더로 끝나지 않았는지)
  //    figma-audit.mjs 의 팔레트 검사는 SOLID fill 만 보므로 이 실패를 잡지 못한다.
  //    "화면은 다 만들어졌는데 이미지만 비었다"를 여기서 잡는다.
  if (!usesImages) {
    results.push({
      name: "이미지 슬롯 채움 (빈 슬롯 0개)",
      pass: true,
      detail: "해당 없음 (image-slots: none)",
    });
  } else if (fileExists(snapshotPath)) {
    try {
      const snap = JSON.parse(readFile(snapshotPath));
      const screensPage = snap.pages?.find((p) => p.name === "03 Screens");
      const slotNodes = [];
      (screensPage?.frames || []).forEach((frame) => {
        (frame.nodes || []).forEach((node) => {
          if (typeof node.name === "string" && node.name.startsWith("Img/")) {
            slotNodes.push({ frame: frame.name, node });
          }
        });
      });

      const empty = slotNodes.filter(
        ({ node }) => !(node.fills || []).some((f) => f.type === "IMAGE"),
      );

      results.push({
        name: "이미지 슬롯 채움 (빈 슬롯 0개)",
        pass: slotNodes.length > 0 && empty.length === 0,
        detail:
          slotNodes.length === 0
            ? "Img/* 슬롯이 하나도 없음 — 이미지 없는 시안"
            : empty.length === 0
              ? `슬롯 ${slotNodes.length}개 전부 IMAGE fill`
              : `미충전 ${empty.length}개: ${empty
                  .slice(0, 5)
                  .map(({ frame, node }) => `${frame}/${node.name}`)
                  .join(", ")}`,
      });
    } catch {
      // 스냅샷 파싱 실패는 위 7번에서 이미 잡힌다
    }
  }

  // 10. audit-report.md PASS
  if (fileExists(auditReportPath)) {
    const content = readFile(auditReportPath);
    const isPass = /최종 판정.*PASS/i.test(content);
    results.push({
      name: "audit 통과",
      pass: isPass,
      detail: isPass ? "PASS" : "FAIL 또는 미완료",
    });
  } else {
    results.push({
      name: "audit 통과",
      pass: false,
      detail: "audit-report.md 없음 (design-auditor 실행 필요)",
    });
  }

  return {
    phase: "screens",
    gate: 4,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// ==================== 출력 ====================

function printResult(result) {
  if (isJson) return;

  const icon = result.passed ? "✅" : "❌";
  const color = result.passed ? "green" : "red";

  log("", "reset");
  log(`${icon} 게이트 ${result.gate} · ${result.phase}`, color);
  log("─".repeat(50), "reset");

  if (isQuiet) {
    log(`${result.passed ? "PASS" : "FAIL"}`, color);
    return;
  }

  result.checks.forEach((check, i) => {
    const checkIcon = check.pass ? "  ✓" : "  ✗";
    const checkColor = check.pass ? "green" : "red";
    log(`${checkIcon} ${check.name}`, checkColor);
    if (check.detail) {
      log(`    ${check.detail}`, "reset");
    }
  });

  log("", "reset");
  const summary = result.checks.filter((c) => c.pass).length;
  const total = result.checks.length;
  log(`  ${summary}/${total} 통과`, result.passed ? "green" : "yellow");
}

function printJson(results) {
  console.log(
    JSON.stringify(
      {
        phase,
        timestamp: new Date().toISOString(),
        results,
        overall_passed: results.every((r) => r.passed),
      },
      null,
      2,
    ),
  );
}

// ==================== 메인 ====================

function main() {
  const checkers = {
    references: checkReferences,
    structure: checkStructure,
    rules: checkRules,
    screens: checkScreens,
  };

  let results = [];

  if (phase === "all") {
    log("\n🚪 전체 게이트 검증 시작", "cyan");
    log("=".repeat(50), "cyan");
    for (const [key, checker] of Object.entries(checkers)) {
      const result = checker();
      results.push(result);
      printResult(result);
    }
  } else if (checkers[phase]) {
    const result = checkers[phase]();
    results.push(result);
    printResult(result);
  } else {
    log(`\n❌ 알 수 없는 phase: ${phase}`, "red");
    log("사용 가능: references, structure, rules, screens, all", "reset");
    process.exit(1);
  }

  if (isJson) {
    printJson(results);
  }

  const allPassed = results.every((r) => r.passed);

  if (!isJson) {
    log("", "reset");
    log("=".repeat(50), "cyan");
    if (allPassed) {
      log("🎉 모든 게이트 통과!", "green");
    } else {
      log("⚠️  일부 게이트 미통과. 위 상세 확인.", "yellow");
    }
    log("", "reset");
  }

  process.exit(allPassed ? 0 : 1);
}

main();
