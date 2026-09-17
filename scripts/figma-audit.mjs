#!/usr/bin/env node
/**
 * figma-audit.mjs
 *
 * Figma 파일이 design-rules.md를 준수하는지 검증 (게이트 4 전용).
 * figma-builder가 각 STAGE 완료 시 저장한 figma-snapshot.json을 파싱해서 검사.
 *
 * 사용법:
 *   node scripts/figma-audit.mjs
 *   node scripts/figma-audit.mjs --json
 *
 * ⚠️ --file-key 옵션은 없다. file_key 는 snapshot 안에서 읽는다.
 *    실행 전 `node scripts/check-snapshot.mjs` 로 스냅샷 스키마를 먼저 검증할 것.
 *    (이 스크립트는 필드가 없어도 예외를 던지지 않고 조용히 오판한다)
 *
 * 옵션:
 *   --snapshot <path>  snapshot 파일 경로 (기본: design/04-screens/figma-snapshot.json)
 *   --rules <path>     design-rules.md 경로 (기본: design/03-design-rules/design-rules.md)
 *   --output <path>    결과 JSON 저장 경로 (기본: design/04-screens/audit-structural.json)
 *   --json             콘솔에 JSON 출력
 *
 * exit code:
 *   0: PASS
 *   1: FAIL
 *
 * figma-snapshot.json 형식 (scripts/figma-snapshot.js 가 생성 → figma-builder가 Write):
 * ⚠️ frames[].nodes 는 서브트리를 평탄화한 1차원 배열이어야 한다 (아래 getAllNodes 는 재귀하지 않음).
 * ⚠️ position 은 화면 프레임 기준 좌표여야 한다 (safe-area 검사가 기기 높이와 직접 비교).
 * {
 *   "file_key": "xxx",
 *   "snapshot_date": "2025-01-15",
 *   "pages": [
 *     {
 *       "name": "03 Screens",
 *       "frames": [
 *         {
 *           "name": "01 Home",
 *           "width": 390,
 *           "height": 844,
 *           "nodes": [
 *             {
 *               "id": "1:23",
 *               "name": "Card",
 *               "type": "FRAME",
 *               "fills": [{"type": "SOLID", "color": "#FFFFFF",
 *                          "boundVariable": "color-bg",
 *                          "boundVariableCollection": "semantic"}],
 *               "textStyle": null,
 *               "padding": {"top": 16, "right": 16, "bottom": 16, "left": 16},
 *               "size": {"width": 358, "height": 200},
 *               "position": {"x": 16, "y": 100},
 *               "isTapTarget": false,
 *               "isPrimary": false,
 *               "isInstance": true
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

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

const snapshotPath = getArg(
  "--snapshot",
  "design/04-screens/figma-snapshot.json",
);
const rulesPath = getArg("--rules", "design/03-design-rules/design-rules.md");
const outputPath = getArg(
  "--output",
  "design/04-screens/audit-structural.json",
);

function log(msg, color = "reset") {
  if (isJson) return;
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

// ==================== 규칙 로드 ====================

// ⚠️ 섹션 추출 정규식의 끝 조건에 /m 의 `$` 를 쓰지 말 것.
//    multiline 에서 `$` 는 모든 줄 끝에 매치되어 제목 줄만 잡히고 본문이 빠진다.
//    그러면 아래 토큰/모바일 값이 전부 fallback 으로 떨어져 design-rules.md 를
//    읽지 않은 채 하드코딩 기본값으로 audit 하게 된다. 문자열 끝은 `(?![\s\S])`.
function loadRules() {
  if (!existsSync(rulesPath)) {
    log(`\n❌ design-rules.md 없음: ${rulesPath}`, "red");
    process.exit(1);
  }

  const content = readFileSync(rulesPath, "utf-8");

  // status: confirmed 확인
  const statusMatch = content.match(/^status:\s*(\w+)/m);
  if (!statusMatch || statusMatch[1] !== "confirmed") {
    log(
      `\n❌ design-rules.md가 confirmed 상태 아님: ${statusMatch?.[1] || "unknown"}`,
      "red",
    );
    process.exit(1);
  }

  // 색상 토큰 추출
  const colorSection =
    content.match(/## A\. 색상[\s\S]*?(?=^## |^---|(?![\s\S]))/m)?.[0] || "";
  const validColorTokens = [
    ...new Set(colorSection.match(/color-[\w-]+/g) || []),
  ];

  // 텍스트 스타일 추출
  const typoSection =
    content.match(/## C\. 타이포[\s\S]*?(?=^## |^---|(?![\s\S]))/m)?.[0] || "";
  const validTextStyles = [
    ...new Set(
      typoSection
        .match(/^\|\s*(\w+)\s*\|\s*[\d/]+/gm)
        ?.map((m) => m.match(/^\|\s*(\w+)/)?.[1]) || [],
    ),
  ].filter(Boolean);

  // 모바일 값
  const mobileSection =
    content.match(/## G\. 모바일 특화[\s\S]*?(?=^## |^---|(?![\s\S]))/m)?.[0] ||
    "";
  const safeAreaTop = parseInt(
    mobileSection.match(/safe-area-top[^\n]*?(\d+)/)?.[1] || "44",
  );
  const safeAreaBottom = parseInt(
    mobileSection.match(/safe-area-bottom[^\n]*?(\d+)/)?.[1] || "34",
  );
  const tapMin = parseInt(
    mobileSection.match(/tap-min[^\n]*?(\d+)/)?.[1] || "44",
  );
  const deviceWidth = parseInt(
    mobileSection.match(/device-frame[^\n]*?(\d+)/)?.[1] || "390",
  );
  // 기기 높이는 규칙이 아니라 각 프레임의 실제 height 를 쓴다.
  // 스크롤 화면(844보다 긴 프레임)에서 전 노드가 위반으로 잡히는 문제 때문.
  const deviceHeightFallback = 844;

  // 의도적 고정 높이 컴포넌트 (레이아웃 검사의 예외 SSOT).
  // 컴포넌트 규칙의 `### 이름` 아래 `- Height: fixed(...)` 로 선언된 것만 면제된다.
  // 선언이 없으면 HUG 가 기본이다 — 예외는 반드시 규칙 파일에 적어야 한다.
  const fixedHeightComponents = [];
  {
    let current = [];
    for (const line of content.split("\n")) {
      const heading = line.match(/^###\s+(.+?)\s*(?:\(|$)/);
      if (heading) {
        current = heading[1]
          .split("/")
          .map((t) => t.trim())
          .filter(Boolean);
        continue;
      }
      if (current.length && /^[-*]\s*Height\s*:\s*fixed/i.test(line)) {
        fixedHeightComponents.push(...current);
      }
    }
  }

  return {
    validColorTokens,
    validTextStyles,
    safeAreaTop,
    safeAreaBottom,
    tapMin,
    deviceWidth,
    deviceHeightFallback,
    fixed_height_components: [...new Set(fixedHeightComponents)],
  };
}

// ==================== 스냅샷 로드 ====================

function loadSnapshot() {
  if (!existsSync(snapshotPath)) {
    log(`\n❌ figma-snapshot.json 없음: ${snapshotPath}`, "red");
    log("figma-builder가 STAGE 완료 시 자동 생성합니다.", "yellow");
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(snapshotPath, "utf-8"));
  } catch (err) {
    log(`\n❌ snapshot 파싱 실패: ${err.message}`, "red");
    process.exit(1);
  }
}

// ==================== 검증 ====================

function getScreensPage(snapshot) {
  return (
    snapshot.pages?.find((p) => p.name === "03 Screens") || snapshot.pages?.[0]
  );
}

function getAllNodes(frame) {
  return frame.nodes || [];
}

// 1. 팔레트 일관성
function checkPaletteConsistency(snapshot, rules) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage)
    return { status: "FAIL", violations: [{ issue: "Screens 페이지 없음" }] };

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      // fill 검사
      (node.fills || []).forEach((fill, idx) => {
        if (fill.type === "SOLID" && !fill.boundVariable) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `미바인딩 fill: ${fill.color}`,
            expected: "color-* 변수 바인딩",
          });
        }
      });

      // stroke 검사 (있는 경우)
      (node.strokes || []).forEach((stroke, idx) => {
        if (stroke.type === "SOLID" && !stroke.boundVariable) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `미바인딩 stroke: ${stroke.color}`,
            expected: "color-* 변수 바인딩",
          });
        }
      });
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
  };
}

// 2. 타이포 재사용
function checkTypographyReuse(snapshot, rules) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [] };

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      if (node.type === "TEXT" && !node.textStyle) {
        violations.push({
          screen: frame.name,
          node: `${node.name} (${node.id})`,
          issue: "텍스트 스타일 미적용",
          expected: "Text/* 스타일 적용",
        });
      }
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
  };
}

// 3. spacing 그리드 (4의 배수)
function checkSpacingGrid(snapshot) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [] };

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      const values = [];
      if (node.padding) {
        values.push(["padding.top", node.padding.top]);
        values.push(["padding.right", node.padding.right]);
        values.push(["padding.bottom", node.padding.bottom]);
        values.push(["padding.left", node.padding.left]);
      }
      if (node.itemSpacing !== undefined) {
        values.push(["itemSpacing", node.itemSpacing]);
      }

      values.forEach(([key, val]) => {
        if (val !== undefined && val % 4 !== 0) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `${key}: ${val}px (4배수 아님)`,
            expected: `${Math.round(val / 4) * 4}px`,
          });
        }
      });
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
  };
}

// 4. 탭 영역
function checkTapTargets(snapshot, rules) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [] };

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      if (node.isTapTarget) {
        const { width, height } = node.size || {};
        if (width < rules.tapMin || height < rules.tapMin) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `탭 영역 ${width}x${height}px`,
            expected: `${rules.tapMin}x${rules.tapMin}px 이상`,
          });
        }
      }
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
  };
}

// 5. 세이프 에어리어
//
// 검사 대상은 "콘텐츠 노드"(탭 가능 노드 + 텍스트)로 한정한다.
// 배경·AppBar·TabBar 같은 크롬 컨테이너는 safe-area 를 걸쳐 그리는 것이 정상이며
// (design-rules §G, figma-builder 의 TabBar=49+34 / BottomCTA=56+34 명세),
// 규칙의 의도는 "콘텐츠가 상단 44 / 하단 34 안쪽에" 있는지다.
// 모든 노드를 검사하면 화면마다 배경·앱바·탭바가 전부 위반으로 잡혀 게이트가
// 구조적으로 통과 불가능해진다.
function isContentNode(node) {
  return Boolean(node.isTapTarget) || node.type === "TEXT";
}

function checkSafeArea(snapshot, rules) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [] };

  let checked = 0;

  screensPage.frames.forEach((frame) => {
    // 기기 높이가 아니라 이 프레임의 실제 높이 기준 (스크롤 화면 대응)
    const frameHeight = frame.height || rules.deviceHeightFallback;
    const bottomLimit = frameHeight - rules.safeAreaBottom;

    getAllNodes(frame)
      .filter(isContentNode)
      .forEach((node) => {
        checked++;
        const y = node.position?.y ?? 0;
        const h = node.size?.height ?? 0;

        // 상단 침범
        if (y < rules.safeAreaTop) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `y=${y} (상단 safe-area ${rules.safeAreaTop} 침범)`,
            expected: `y >= ${rules.safeAreaTop}`,
          });
        }

        // 하단 침범
        if (y + h > bottomLimit) {
          violations.push({
            screen: frame.name,
            node: `${node.name} (${node.id})`,
            issue: `y+h=${y + h} (하단 safe-area 침범, 프레임 높이 ${frameHeight})`,
            expected: `y+h <= ${bottomLimit}`,
          });
        }
      });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
    checked_nodes: checked,
  };
}

// 6. primary 버튼 개수
function checkPrimaryCount(snapshot) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [] };

  screensPage.frames.forEach((frame) => {
    const primaryNodes = getAllNodes(frame).filter((n) => n.isPrimary);

    if (primaryNodes.length !== 1) {
      violations.push({
        screen: frame.name,
        node: "N/A",
        issue: `primary 버튼 ${primaryNodes.length}개`,
        expected: "정확히 1개",
      });
    }
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
  };
}

// 7. 컴포넌트 재사용률
function checkComponentReuseRate(snapshot) {
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [], rate: 0 };

  let totalNodes = 0;
  let instanceNodes = 0;

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      if (node.type === "FRAME" || node.type === "INSTANCE") {
        totalNodes++;
        if (node.isInstance) instanceNodes++;
      }
    });
  });

  const rate =
    totalNodes > 0 ? Math.round((instanceNodes / totalNodes) * 100) : 0;
  const violations =
    rate < 90
      ? [{ issue: `재사용률 ${rate}% (기준 90%)`, expected: "90% 이상" }]
      : [];

  return {
    status: rate >= 90 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
    rate,
  };
}

// 8. 토큰 계층 (semantic 만 바인딩)
//
// 2계층 구조에서 화면·컴포넌트가 바인딩해도 되는 것은 semantic 컬렉션 변수뿐이다.
// primitive 를 직접 바인딩하면 이름이 의도를 말하지 않고(brand-500 이 왜 여기 있나),
// 리브랜딩 시 semantic 만 바꿔서는 반영되지 않는 노드가 남는다.
//
// boundVariable 이 없는 경우는 여기서 세지 않는다. 그건 팔레트 일관성 검사의 몫이라
// 같은 위반을 두 번 보고하게 된다.
function checkTokenLayering(snapshot) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [], count: 0 };

  let checked = 0;

  screensPage.frames.forEach((frame) => {
    getAllNodes(frame).forEach((node) => {
      [
        ["fill", node.fills || []],
        ["stroke", node.strokes || []],
      ].forEach(([kind, list]) => {
        list.forEach((paint) => {
          if (!paint || !paint.boundVariable) return;
          checked++;

          const collection = paint.boundVariableCollection;

          if (collection === undefined) {
            violations.push({
              screen: frame.name,
              node: `${node.name} (${node.id})`,
              issue: `${kind} 의 boundVariableCollection 누락 (${paint.boundVariable})`,
              expected:
                "figma-snapshot.js (schema_version 2) 로 다시 추출할 것",
            });
            return;
          }

          if (collection !== "semantic") {
            violations.push({
              screen: frame.name,
              node: `${node.name} (${node.id})`,
              issue: `${kind} 이 ${collection || "알 수 없는"} 컬렉션의 ${paint.boundVariable} 을 직접 바인딩`,
              expected: "semantic 컬렉션 변수로 바인딩 (예: color-primary)",
            });
          }
        });
      });
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
    checked_bindings: checked,
  };
}

// 9. 레이아웃 거동 — 컨테이너가 내용을 감싸는가
//
// 화면에서도 같은 사고가 난다. 컴포넌트 단계(check-layout.mjs)에서 막지 못한 것,
// 그리고 화면에서 인스턴스 높이를 덮어써 깨진 것을 게이트 4 에서 한 번 더 잡는다.
//
// 판정 근거는 스냅샷 schema_version 3 의 node.layout / node.parentId 다.
// v2 스냅샷에는 둘 다 없어서 아무것도 판정할 수 없다 — "위반 0건"이 아니라 "검사 불가"이므로
// 조용히 PASS 시키지 않고 FAIL 로 돌려 재추출을 요구한다.
const LAYOUT_EXEMPT_RE =
  /^(DeviceFrame|Status ?Bar|Home ?Indicator|Safe ?Area|Divider|Spacer|Track|Img\/|Icon\/)/i;
const LAYOUT_CONTAINER_TYPES = new Set(["FRAME", "COMPONENT", "COMPONENT_SET"]);
const LAYOUT_TOLERANCE = 1;

function checkLayoutHug(snapshot, rules) {
  const violations = [];
  const screensPage = getScreensPage(snapshot);
  if (!screensPage) return { status: "FAIL", violations: [], count: 0 };

  // design-rules 가 fixed 로 선언한 컴포넌트는 면제한다 (예외의 SSOT 는 규칙 파일)
  const fixedByRule = new Set((rules && rules.fixed_height_components) || []);
  const canCheck = (snapshot.schema_version ?? 0) >= 3;
  if (!canCheck) {
    return {
      status: "FAIL",
      violations: [
        {
          screen: "(전체)",
          node: "-",
          issue: `스냅샷 schema_version ${snapshot.schema_version ?? "없음"} — layout / parentId 필드가 없어 레이아웃을 판정할 수 없다`,
          expected:
            "scripts/figma-snapshot.js (v3) 로 03 Screens 를 다시 추출할 것",
        },
      ],
      count: 1,
      sizing_checked: false,
    };
  }

  const exempt = (node) => {
    if (LAYOUT_EXEMPT_RE.test(String(node.name || ""))) return true;
    const base = String(node.mainComponent || node.name || "")
      .split(/[/·,]/)[0]
      .trim();
    return fixedByRule.has(base);
  };

  screensPage.frames.forEach((frame) => {
    const nodes = getAllNodes(frame);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    nodes.forEach((node) => {
      // 고정 높이 컨테이너
      if (
        LAYOUT_CONTAINER_TYPES.has(node.type) &&
        node.layout &&
        node.layout.layoutMode &&
        node.layout.layoutMode !== "NONE" &&
        node.layout.vSizing === "FIXED" &&
        !exempt(node)
      ) {
        violations.push({
          screen: frame.name,
          node: `${node.name} (${node.id})`,
          issue: `오토레이아웃 컨테이너가 세로 FIXED (높이 ${node.size?.height})`,
          expected:
            'layoutSizingVertical = "HUG" · 의도적 고정이면 design-rules 에 Height: fixed 선언',
        });
      }

      // 콘텐츠 넘침
      if (!node.parentId || !node.position || !node.size) return;
      const parent = byId.get(node.parentId);
      if (!parent || !parent.position || !parent.size) return;

      const pad = parent.padding || { bottom: 0, right: 0 };
      const overBottom = Math.round(
        node.position.y +
          node.size.height -
          (parent.position.y + parent.size.height - (pad.bottom || 0)),
      );
      const overRight = Math.round(
        node.position.x +
          node.size.width -
          (parent.position.x + parent.size.width - (pad.right || 0)),
      );

      if (overBottom > LAYOUT_TOLERANCE || overRight > LAYOUT_TOLERANCE) {
        const parts = [];
        if (overBottom > LAYOUT_TOLERANCE) parts.push(`아래 ${overBottom}px`);
        if (overRight > LAYOUT_TOLERANCE) parts.push(`오른쪽 ${overRight}px`);
        violations.push({
          screen: frame.name,
          node: `${node.name} (${node.id})`,
          issue: `"${parent.name}" 밖으로 ${parts.join(" / ")} 넘침`,
          expected: "부모가 내용을 감싸도록 HUG 로 바꿀 것",
        });
      }
    });
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    violations,
    count: violations.length,
    sizing_checked: true,
  };
}

// ==================== 실행 ====================

function runAudit() {
  const rules = loadRules();
  const snapshot = loadSnapshot();

  const results = {
    palette_consistency: checkPaletteConsistency(snapshot, rules),
    typography_reuse: checkTypographyReuse(snapshot, rules),
    spacing_grid: checkSpacingGrid(snapshot),
    tap_targets: checkTapTargets(snapshot, rules),
    safe_area: checkSafeArea(snapshot, rules),
    primary_count: checkPrimaryCount(snapshot),
    component_reuse: checkComponentReuseRate(snapshot),
    token_layering: checkTokenLayering(snapshot),
    layout_hug: checkLayoutHug(snapshot, rules),
  };

  const overallPassed = Object.values(results).every(
    (r) => r.status === "PASS",
  );

  return {
    audit_date: new Date().toISOString(),
    file_key: snapshot.file_key,
    passed: overallPassed,
    results,
    summary: {
      total_checks: Object.keys(results).length,
      passed_checks: Object.values(results).filter((r) => r.status === "PASS")
        .length,
      total_violations: Object.values(results).reduce(
        (sum, r) => sum + (r.count || 0),
        0,
      ),
    },
  };
}

// ==================== 출력 ====================

function printReport(audit) {
  if (isJson) return;

  log("\n🔍 Figma Audit", "cyan");
  log("=".repeat(60), "cyan");
  log(`파일: ${audit.file_key}`, "reset");
  log(`날짜: ${audit.audit_date}`, "reset");

  const labels = {
    palette_consistency: "팔레트 일관성",
    typography_reuse: "타이포 재사용",
    spacing_grid: "spacing 그리드",
    tap_targets: "탭 영역",
    safe_area: "세이프 에어리어",
    primary_count: "primary 개수",
    component_reuse: "컴포넌트 재사용률",
    token_layering: "토큰 계층 (semantic 전용)",
    layout_hug: "레이아웃 거동 (컨테이너 HUG · 넘침)",
  };

  Object.entries(audit.results).forEach(([key, result]) => {
    const icon = result.status === "PASS" ? "✓" : "✗";
    const color = result.status === "PASS" ? "green" : "red";
    const label = labels[key];
    const detail =
      key === "component_reuse"
        ? ` (${result.rate}%)`
        : result.count > 0
          ? ` (${result.count}건)`
          : "";

    log(`  ${icon} ${label}${detail}`, color);

    // 실패 시 상세 (최대 5개)
    if (result.status === "FAIL" && !isJson) {
      result.violations.slice(0, 5).forEach((v) => {
        log(`      → ${v.screen || ""}: ${v.issue}`, "reset");
        if (v.expected) log(`         기대: ${v.expected}`, "reset");
      });
      if (result.violations.length > 5) {
        log(`      ... ${result.violations.length - 5}건 더`, "reset");
      }
    }
  });

  log("\n" + "=".repeat(60), "cyan");
  log(
    `통과: ${audit.summary.passed_checks}/${audit.summary.total_checks}`,
    audit.passed ? "green" : "yellow",
  );
  log(
    `총 위반: ${audit.summary.total_violations}건`,
    audit.summary.total_violations === 0 ? "green" : "red",
  );

  log("");
  if (audit.passed) {
    log("✅ AUDIT PASS - 게이트 4 통과 가능", "green");
  } else {
    log("❌ AUDIT FAIL - fix-list.md 생성 필요", "red");
  }
  log("");
}

// ==================== 메인 ====================

function main() {
  const audit = runAudit();

  // 결과 JSON 저장
  writeFileSync(outputPath, JSON.stringify(audit, null, 2));

  if (isJson) {
    console.log(JSON.stringify(audit, null, 2));
  } else {
    printReport(audit);
    log(`상세 결과: ${outputPath}`, "cyan");
    log("");
  }

  process.exit(audit.passed ? 0 : 1);
}

main();
