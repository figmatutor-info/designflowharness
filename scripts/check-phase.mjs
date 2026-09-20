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
 *   --json     JSON 형식으로 출력
 *   --quiet    PASS/FAIL만 출력
 *   --shallow  하위 검증기를 실행하지 않고 파일 존재만 확인 (디버깅용)
 *
 * ⚠️ 이 스크립트는 하위 검증기를 직접 실행한다.
 *    verify-design-rules / check-snapshot / check-token-docs / check-layout /
 *    check-assets 의 exit code 가 게이트 판정에 그대로 들어간다.
 *    즉 `npm run check` 통과 = 게이트 통과 다.
 *    figma-audit.mjs 만 예외로 실행하지 않는다 (결과 파일을 Write 하므로).
 *    대신 그 산출물 audit-structural.json 의 passed 를 읽어 판정한다.
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { getArg, hasFlag, createLog } from "./lib/cli.mjs";
import { parseImageSlots } from "./lib/layout-rules.mjs";
import { join } from "node:path";
import {
  CONTRACT_PATH,
  loadContract,
  requiredViews,
  previewErrors,
} from "./lib/screen-contract.mjs";
import { fileHash, AUDIT_KEYS } from "./lib/design-evidence.mjs";
import { execFileSync } from "node:child_process";

// ==================== 유틸 ====================

const isJson = hasFlag("--json");
const isQuiet = hasFlag("--quiet");
// 하위 검증기를 실제로 실행하지 않고, 파일 존재 확인만 한다 (디버깅용).
// 기본값은 실행한다 — "게이트 통과 = npm run check" 가 사실이어야 하기 때문.
const isShallow = hasFlag("--shallow");

const phase = getArg("--phase", "all");

const log = createLog(isJson);

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

// ==================== 하위 검증기 실행 ====================
//
// 이 파일은 오랫동안 "파일이 있는가"만 봤다. 진짜 판정은 verify-design-rules /
// check-snapshot / check-layout 같은 별도 스크립트가 했는데, 그것들을 부르는 코드가
// 없어서 `npm run check` 통과와 게이트 통과가 서로 다른 뜻이었다.
// (1계층 토큰으로 만들어도 게이트 3 은 통과했다)
//
// 여기서 직접 실행해 exit code 를 게이트 판정에 넣는다.
//
// ⚠️ 여기서 부르는 스크립트는 전부 파일을 쓰지 않는 순수 판정기여야 한다.
//    figma-audit.mjs 는 audit-structural.json 을 Write 하므로 부르지 않는다.
//    (대신 그 결과 JSON 을 읽는다 — checkScreens 참고)

function runScript(file, scriptArgs = []) {
  try {
    execFileSync("node", [join("scripts", file), ...scriptArgs], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
    return { ok: true, output: "" };
  } catch (err) {
    // 스크립트가 exit 1 로 죽으면 stdout 에 실패 사유가 들어 있다.
    // node 자체를 못 찾는 등의 경우엔 status 가 null 이다.
    const out = `${err.stdout || ""}${err.stderr || ""}`;
    return { ok: false, output: out, spawnFailed: err.status == null };
  }
}

// 실패 출력에서 사람이 읽을 첫 줄들만 뽑는다 (ANSI 제거, 최대 3줄).
//
// ⚠️ 키워드로 거르지 말 것. "없음"/"누락" 같은 말은 통과 줄에도 나온다.
//    (예: "✓ 색상 · Semantic 에 생값 없음" 은 PASS 인데 '없음' 에 걸린다)
//    실패 마커로 시작하는 줄만 고른다.
function summarizeFailure(output) {
  const lines = String(output)
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const failed = lines.filter((l) => /^[✗❌]/.test(l));
  if (failed.length > 0) return failed.slice(0, 3).join(" / ");

  // 마커 없이 죽은 경우 (스크립트가 조기 종료하며 메시지만 남긴 경우)
  const alt = lines.filter(
    (l) => !/^[✓🎉]/.test(l) && /실패|없음|누락|불일치|FAIL/.test(l),
  );
  if (alt.length > 0) return alt.slice(0, 2).join(" / ");
  return "상세는 개별 명령으로 확인";
}

// 하위 검증기 실행 결과를 게이트 검사 항목 하나로 만든다.
//   label       : 검사 항목 이름
//   file        : scripts/ 아래 파일명
//   scriptArgs  : 넘길 인자
//   command     : 사용자가 직접 돌려볼 명령 (실패 시 안내)
//   precondition: 이 값이 false 면 실행하지 않고 건너뛴다 (선행 산출물이 아직 없을 때)
function subCheck({ label, file, scriptArgs = [], command, precondition }) {
  if (precondition === false) {
    return {
      name: label,
      pass: false,
      detail: `선행 산출물이 없어 실행 못 함 — ${command}`,
    };
  }
  if (isShallow) {
    return { name: label, pass: true, detail: "--shallow: 실행 건너뜀" };
  }

  const res = runScript(file, scriptArgs);
  if (res.ok) return { name: label, pass: true, detail: "PASS" };
  if (res.spawnFailed) {
    return {
      name: label,
      pass: false,
      detail: `실행 실패 (스크립트 없음/오류) — ${command}`,
    };
  }
  return {
    name: label,
    pass: false,
    detail: `FAIL — ${summarizeFailure(res.output)} · 상세: ${command}`,
  };
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

    // 문서 전체의 단어 개수가 아니라 각 화면의 실제 필드를 검사한다.
    const sections = content.split(/^## 화면 \d+[^\n]*$/m).slice(1);
    const missingActions = sections.flatMap((section, i) =>
      /\*\*primary 액션:\*\*\s*\S+/i.test(section) ? [] : [i + 1],
    );
    results.push({
      name: "화면별 주 행동 정의",
      pass: sections.length > 0 && !missingActions.length,
      detail: missingActions.length
        ? `누락 화면: ${missingActions.join(", ")}`
        : "각 화면에 정의됨",
    });
    const missingReferences = sections.flatMap((section, i) =>
      /analysis\.md/.test(section) && /패턴/.test(section) ? [] : [i + 1],
    );
    results.push({
      name: "화면별 레퍼런스 매칭",
      pass: sections.length > 0 && !missingReferences.length,
      detail: missingReferences.length
        ? `누락 화면: ${missingReferences.join(", ")}`
        : "각 화면에 참조됨",
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

  results.push(
    subCheck({
      label: "화면·상태·행동 계약",
      file: "check-design-contract.mjs",
      command: "npm run check:contract",
    }),
  );
  try {
    const contract = loadContract(CONTRACT_PATH, true);
    const count = (readFile(screensPath)?.match(/^## 화면 \d+/gm) || []).length;
    results.push({
      name: "문서·계약 화면 수 일치",
      pass: contract.screens.length === count,
      detail: `screens.md ${count}개 / 계약 ${contract.screens.length}개`,
    });
  } catch {
    /* 위 계약 검사에서 파일/형식 오류 보고 */
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

    // 7. preview.html 화면 시안
    //
    // 왜 있나: 토큰·컴포넌트가 낱개로는 다 멀쩡한데 화면에 모으면 무너지는 일이
    // 있었다 (콘텐츠가 844 를 넘겨 섹션끼리 겹쳐 렌더). Figma 에서 조립한 뒤에야
    // 발견하면 되돌리는 비용이 크다. 레이아웃은 HTML 에서 먼저 확정하고,
    // Phase 4 는 확정된 시안을 옮기기만 하게 한다.
    results.push(checkPreviewScreens());
    results.push({
      name: "디자인 방향 비교 기록",
      pass: Boolean(
        readFile("design/03-design-rules/design-direction.md")?.trim(),
      ),
      detail:
        "design-direction.md: 대표 화면 2안 비교·선택 근거 (실제 품질은 시각 검수)",
    });

    // 8. 컴포넌트 카탈로그 완결성
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

  // 세부 판정은 verify-design-rules.mjs 가 한다 (토큰 2계층, 4배수, semantic 이름,
  // 타이포 최소 크기, 모바일 상수 등). 위의 검사들은 "파일이 있는가" 수준이라
  // 이걸 부르지 않으면 1계층 토큰으로도 게이트 3 이 통과해 버린다.
  results.push(
    subCheck({
      label: "규칙 세부 검증 (verify-design-rules)",
      file: "verify-design-rules.mjs",
      scriptArgs: ["--path", rulesPath],
      command: "npm run verify",
      precondition: fileExists(rulesPath),
    }),
  );

  return {
    phase: "rules",
    gate: 3,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// preview.html 이 "토큰 스와치 카탈로그"가 아니라 "화면 시안"인지 본다.
// screens.md 의 화면 수와 시안 수가 맞아야 한다.
function checkPreviewScreens() {
  const previewPath = "design/03-design-rules/preview.html";
  if (!fileExists(previewPath)) {
    return {
      name: "preview.html 화면 시안",
      pass: false,
      detail:
        `${previewPath} 없음\n` +
        `    → screens.md 의 화면을 각각 390x844 프레임으로 렌더한 시안을 만드세요.\n` +
        `    → 각 프레임 래퍼에 data-screen="01-home" 형태의 마커가 필요합니다.`,
    };
  }

  try {
    const contract = loadContract(CONTRACT_PATH, true);
    const errors = previewErrors(readFile(previewPath), contract);
    return {
      name: "preview.html 필수 화면·상태 시안",
      pass: errors.length === 0,
      detail:
        errors.join("; ") ||
        `${requiredViews(contract).length}개 화면·상태 마커 일치 (시각 검수 별도)`,
    };
  } catch (error) {
    return {
      name: "preview.html 필수 화면·상태 시안",
      pass: false,
      detail: error.message,
    };
  }
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
// 이미지 라이브러리·슬롯 검사를 "해당 없음"으로 통과시킨다.
// (가계부·설정·계산기처럼 사진이 정당하게 없는 앱을 게이트가 막지 않게 한다)
// 파서·기본값은 check-assets.mjs 와 공유한다 (scripts/lib/layout-rules.mjs parseImageSlots).
function readImagePolicy() {
  return parseImageSlots(readFile("design/03-design-rules/design-rules.md"))
    .policy;
}

// design-rules.md §I 의 `image-library:` 선언 (이미지를 고르는 유일한 폴더). 없으면 기본 경로.
function readImageLibrary() {
  return parseImageSlots(readFile("design/03-design-rules/design-rules.md"))
    .library;
}

// ==================== 게이트 4: Figma 화면 ====================

function checkScreens() {
  const results = [];
  const fileKeyPath = "design/04-screens/figma-file-key.txt";
  const buildLogPath = "design/04-screens/build-log.md";
  const screenshotDir = "design/04-screens/screenshots";
  const auditReportPath = "design/04-screens/audit-report.md";
  const auditStructuralPath = "design/04-screens/audit-structural.json";
  const snapshotPath = "design/04-screens/figma-snapshot.json";
  const libraryPath = readImageLibrary();
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

    // 로그 제목은 사람용이다. 완료 여부는 필수 상태 프레임/파일의 실제 존재로 판정.
    try {
      const contract = loadContract(CONTRACT_PATH, true);
      const snapshot = JSON.parse(readFile(snapshotPath));
      const frames =
        snapshot.pages?.find((p) => p.name === "03 Screens")?.frames || [];
      const views = requiredViews(contract);
      const missing = views.filter(
        (v) =>
          frames.filter((f) => f.name === v.frame).length !== 1 ||
          !fileExists(v.screenshot),
      );
      results.push({
        name: "필수 화면·상태 산출물",
        pass: contract.screens.length >= 5 && !missing.length,
        detail: `${views.length - missing.length}/${views.length}개 상태 존재 · 기본 화면 ${contract.screens.length}개`,
      });
    } catch (error) {
      results.push({
        name: "필수 화면·상태 산출물",
        pass: false,
        detail: `계약/스냅샷 확인 필요: ${error.message}`,
      });
    }
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

  // 8. 이미지 라이브러리 존재 (§I 표와의 대조는 npm run check:assets)
  //    이미지는 생성하지 않는다. Figma 공식 에셋을 내려받은 이 폴더에서만 고른다.
  if (!usesImages) {
    results.push({
      name: "이미지 라이브러리 존재",
      pass: true,
      detail: "해당 없음 (image-slots: none)",
    });
  } else {
    const libCount = countFiles(libraryPath, ".png");
    results.push({
      name: "이미지 라이브러리 존재",
      pass: libCount > 0,
      detail:
        libCount > 0
          ? `${libraryPath} · PNG ${libCount}개 (상세: npm run check:assets)`
          : `${libraryPath} 없음 또는 비어있음 — Figma 에셋을 PNG 로 내려받아 넣어야 한다`,
    });
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

  // 10. 하위 검증기 실행 (스냅샷·토큰문서·레이아웃·에셋)
  //
  // figma-audit.mjs 는 여기서 부르지 않는다. 그것만 audit-structural.json 을
  // Write 하기 때문이다 (check-phase 는 판정만 하는 읽기 전용이어야 한다).
  // 대신 11번에서 그 결과 JSON 을 읽는다.
  const hasSnapshot = fileExists(snapshotPath);

  results.push(
    subCheck({
      label: "snapshot 스키마 (check-snapshot)",
      file: "check-snapshot.mjs",
      command: "npm run check:snapshot",
      precondition: hasSnapshot,
    }),
    subCheck({
      label: "토큰 문서 규격 (check-token-docs)",
      file: "check-token-docs.mjs",
      command: "npm run check:token-docs",
      precondition: hasSnapshot,
    }),
    subCheck({
      label: "레이아웃 거동 (check-layout)",
      file: "check-layout.mjs",
      command: "npm run check:layout",
      precondition: hasSnapshot,
    }),
    subCheck({
      label: "이미지 에셋 (check-assets)",
      file: "check-assets.mjs",
      command: "npm run check:assets",
      // design-rules §I 에 image-slots: none 이면 스스로 통과 처리한다.
      // 그래서 매니페스트 존재 여부를 선행조건으로 걸지 않는다.
      precondition: fileExists("design/03-design-rules/design-rules.md"),
    }),
  );

  // 11. audit 최종 판정 — 기계가 찍은 결과로만 판정한다
  //
  // 예전에는 audit-report.md(에이전트가 쓴 마크다운)의 "최종 판정: PASS" 문자열을
  // regex 로 읽었다. 그러면 figma-audit.mjs 가 passed:false 를 내도, 에이전트가
  // 리포트에 PASS 라고 적기만 하면 게이트가 열렸다. audit 을 아예 안 돌려도 통과했다.
  // harness-principles.md 의 "LLM 자기 보고 안 믿음" 과 정면으로 어긋나는 지점이라
  // 판정 근거를 figma-audit.mjs 가 쓴 JSON 으로 옮겼다.
  if (!fileExists(auditStructuralPath)) {
    results.push({
      name: "audit 통과 (구조 검증 결과)",
      pass: false,
      detail: `${auditStructuralPath} 없음 — npm run audit 실행 필요`,
    });
  } else {
    let pass = false;
    let detail = "";
    try {
      const audit = JSON.parse(readFile(auditStructuralPath));
      const passedChecks = audit.summary?.passed_checks;
      const totalChecks = audit.summary?.total_checks;
      const violations = audit.summary?.total_violations ?? 0;

      if (audit.passed !== true) {
        detail = `FAIL — ${passedChecks ?? "?"}/${totalChecks ?? "?"} 항목 통과, 위반 ${violations}건`;
      } else {
        // 날짜가 같아도 파일 내용이 바뀌면 결과는 무효다.
        const expected = {
          snapshot: fileHash(snapshotPath),
          rules: fileHash("design/03-design-rules/design-rules.md"),
          contract: fileHash(CONTRACT_PATH),
        };
        const fresh = Object.entries(expected).every(
          ([key, value]) => audit.input_hashes?.[key] === value,
        );
        const complete =
          AUDIT_KEYS.every((key) => audit.results?.[key]?.status === "PASS") &&
          totalChecks === AUDIT_KEYS.length &&
          passedChecks === AUDIT_KEYS.length &&
          violations === 0;
        pass = fresh && complete;
        detail = !fresh
          ? "검증 입력 해시 불일치/누락 — npm run audit 재실행 필요"
          : !complete
            ? "audit PASS 항목 누락/모순"
            : "PASS (현재 입력 해시 일치)";
      }
    } catch (err) {
      detail = `JSON 파싱 실패: ${err.message}`;
    }
    results.push({ name: "audit 통과 (구조 검증 결과)", pass, detail });
  }

  results.push(
    subCheck({
      label: "캡처 신선도·시각 품질·상태 검수",
      file: "design-evidence.mjs",
      command: "npm run check:evidence",
    }),
  );

  // 12. audit-report.md 존재 — 사람이 읽는 요약. 판정 근거가 아니라 산출물 확인이다.
  results.push({
    name: "audit-report.md 작성됨 (사람용 요약)",
    pass: fileExists(auditReportPath),
    detail: fileExists(auditReportPath)
      ? auditReportPath
      : "없음 (design-auditor 실행 필요)",
  });

  return {
    phase: "screens",
    gate: 4,
    checks: results,
    passed: results.every((r) => r.pass),
  };
}

// ==================== 출력 ====================

function enforceDiagnosticMode(result) {
  if (isShallow) {
    result.checks.push({
      name: "정식 게이트 검사 필요",
      pass: false,
      detail: "--shallow는 진단 전용. 검사 생략으로 완료 판정 불가",
    });
    result.passed = false;
  }
  return result;
}

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
      const result = enforceDiagnosticMode(checker());
      results.push(result);
      printResult(result);
    }
  } else if (checkers[phase]) {
    const result = enforceDiagnosticMode(checkers[phase]());
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
