/**
 * figma-lint.js
 *
 * ⚠️ 이 파일은 Node.js로 실행하지 않는다. (top-level return 사용 → node 실행 시 SyntaxError)
 *    figma-builder가 Read 한 뒤 `use_figma` 의 code 파라미터로 그대로 주입하는 스크립트다.
 *    실행 환경은 Figma Plugin API 샌드박스이며, 반환값은 "위반 목록"만이다.
 *
 * 왜 필요한가:
 *    스냅샷(figma-snapshot.js) 은 페이지의 모든 노드를 통째로 내보내서 크다.
 *    use_figma 응답 상한(약 20KB) 때문에 프레임을 2~4개씩 나눠 뽑아야 하고,
 *    한 번 뽑는 데 1분 넘게 걸린다. 그런데 이 스냅샷을 check-layout / check-snapshot 이
 *    읽어야만 위반을 알 수 있어서, "뽑고 → 걸리고 → 고치고 → 다시 뽑는" 루프가 생겼다.
 *    (components STAGE 46분 중 33분이 이 루프였다)
 *
 *    이 스크립트는 같은 판정을 Figma 안에서 바로 하고 **위반만** 돌려준다.
 *    응답은 수백 바이트~수 KB 라 잘리지 않고, 몇 초면 끝난다.
 *    생성 직후 이걸로 고치고, 스냅샷은 STAGE 마지막에 한 번만 뽑는다.
 *
 * 판정 기준은 아래 두 스크립트와 같다 (여기서 PASS 면 저기서도 PASS 여야 한다):
 *    · scripts/check-layout.mjs  — fixed-height / no-auto-layout / content-overflow
 *    · scripts/figma-audit.mjs   — 토큰 계층 (semantic 컬렉션만 바인딩)
 *    기준을 바꿀 때는 세 파일을 함께 고친다. 여기만 고치면 lint 는 통과하고 게이트는 FAIL 한다.
 *
 * ── 사용법 (figma-builder) ──────────────────────────────────────────────
 *   1. Read scripts/figma-lint.js
 *   2. 상단 CONFIG 치환:
 *        __PAGE_NAME__    → "02 Components" | "03 Screens"
 *        __FIXED_ALLOW__  → design-rules.md 에서 `- Height: fixed(...)` 로 선언된 컴포넌트 이름을
 *                           쉼표로 이어 붙인다. 예: "Button,AppBar,TabBar,BottomActionBar,Input"
 *                           (check-layout.mjs 는 이걸 design-rules.md 에서 직접 읽지만
 *                            Figma 샌드박스는 파일을 못 읽어서 치환으로 넘긴다)
 *        __FRAME_NAMES__  → 방금 만든 것만 보려면 최상위 프레임 이름을 쉼표로. 비우면 페이지 전체.
 *   3. use_figma 로 실행 (skillNames 에 figma-use 포함)
 *   4. 반환된 findings 를 보고 Figma 노드를 고친다 (스냅샷을 만지지 않는다)
 *   5. findings 가 0 이 될 때까지 반복 (보통 1~2회) → 그 다음에야 figma-snapshot.js
 *
 * ── 제약 (figma-use SKILL.md) ───────────────────────────────────────────
 *   · 호출당 setCurrentPageAsync 는 1회만 → 이 스크립트는 "한 페이지"만 처리한다.
 *   · console.log 는 전달되지 않는다. 결과는 반드시 return.
 *   · async IIFE 로 감싸지 않는다 (자동 래핑됨).
 *
 * ── 반환 형태 ───────────────────────────────────────────────────────────
 *   {
 *     schema: "figma-lint/1",
 *     page, frames_checked, nodes_scanned,
 *     passed: boolean,
 *     counts: { "fixed-height": n, "primitive-binding": n, ... },
 *     findings: [{ rule, frame, node, id, detail }],   // 최대 MAX_FINDINGS 개
 *     truncated: boolean                                 // findings 가 잘렸으면 true
 *   }
 *
 * ── 규칙 ────────────────────────────────────────────────────────────────
 *   fixed-height        오토레이아웃 컨테이너인데 세로가 FIXED (면제 제외)
 *   no-auto-layout      자식이 있는 컨테이너인데 오토레이아웃이 없다 (면제 제외)
 *   content-overflow    자식이 부모의 아래/오른쪽 밖으로 1px 넘게 나감
 *   primitive-binding   바인딩된 변수가 semantic 컬렉션이 아니다 (fill/stroke/padding/gap/radius/size)
 *   unbound-paint       SOLID fill/stroke 인데 변수 바인딩이 없다 (Img/ 슬롯 IMAGE fill 은 제외)
 *   text-no-style       TEXT 인데 텍스트 스타일이 없다
 *   text-no-autoresize  TEXT 인데 textAutoResize 가 NONE (줄이 늘면 잘린다)
 */

// ==================== CONFIG (figma-builder가 치환) ====================

const PAGE_NAME = "__PAGE_NAME__";
const FIXED_ALLOW_RAW = "__FIXED_ALLOW__";
const FRAME_NAMES_RAW = "__FRAME_NAMES__";

const MAX_NODES = 6000; // 폭주 방지
const MAX_FINDINGS = 200; // 응답 크기 방지 — 넘으면 truncated: true
// ⚠️ 아래 셋은 scripts/lib/layout-rules.mjs 의 미러다 (Figma 샌드박스는 import 불가).
//    lib 쪽을 바꾸면 여기도 함께 바꾼다. 여기만 바꾸지 말 것.
const TOLERANCE = 1; // 넘침 허용 오차(px) — mirror of layout-rules.mjs TOLERANCE
const BUILTIN_EXEMPT = // mirror of layout-rules.mjs BUILTIN_EXEMPT
  /^(DeviceFrame|Status ?Bar|Home ?Indicator|Safe ?Area|Divider|Spacer|Track|Img\/|Icon\/)/i;
const CONTAINER_TYPES = new Set(["FRAME", "COMPONENT", "COMPONENT_SET"]); // mirror of layout-rules.mjs CONTAINER_TYPES

// ==================== 치환값 파싱 ====================

function splitList(raw) {
  if (!raw || raw.startsWith("__")) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const FIXED_ALLOW = new Set(splitList(FIXED_ALLOW_RAW));
const FRAME_FILTER = new Set(splitList(FRAME_NAMES_RAW));

// ==================== 유틸 ====================

const collectionNameCache = new Map();
const variableCache = new Map();

async function collectionNameOf(collectionId) {
  if (!collectionId) return null;
  if (collectionNameCache.has(collectionId))
    return collectionNameCache.get(collectionId);
  let name = null;
  try {
    const c =
      await figma.variables.getVariableCollectionByIdAsync(collectionId);
    name = c ? c.name : null;
  } catch (e) {
    name = null;
  }
  collectionNameCache.set(collectionId, name);
  return name;
}

// 변수 id → { name, collection }
async function variableInfo(variableId) {
  if (!variableId) return null;
  if (variableCache.has(variableId)) return variableCache.get(variableId);
  let info = null;
  try {
    const v = await figma.variables.getVariableByIdAsync(variableId);
    if (v) {
      info = {
        name: v.name,
        collection: await collectionNameOf(v.variableCollectionId),
      };
    }
  } catch (e) {
    info = null;
  }
  variableCache.set(variableId, info);
  return info;
}

// scripts/lib/layout-rules.mjs 의 componentNameOf 와 같은 규칙 (Plugin API 판).
//   "Button/Variant=primary" → Button, "MissionCard · 제목" → MissionCard
// 인스턴스의 메인 컴포넌트는 getMainComponentAsync 로 읽는다 — 동기 `node.mainComponent` 는
// dynamic-page 접근 모드에서 예외를 던진다 (figma-snapshot.js 와 같은 이유).
async function componentNameOf(node) {
  let base = node.name || "";
  if (node.type === "INSTANCE") {
    let mc = null;
    try {
      mc = await node.getMainComponentAsync();
    } catch (e) {
      mc = null;
    }
    if (mc) {
      base =
        (mc.parent && mc.parent.type === "COMPONENT_SET"
          ? mc.parent.name
          : mc.name) || base;
    }
  }
  // 변형(COMPONENT) 은 부모 세트 이름으로 판정한다 ("Size=md, State=default" 는 컴포넌트 이름이 아니다)
  if (
    node.type === "COMPONENT" &&
    node.parent &&
    node.parent.type === "COMPONENT_SET"
  ) {
    base = node.parent.name || base;
  }
  return String(base).split(/[/·,]/)[0].trim();
}

async function isExempt(node) {
  const name = String(node.name || "");
  if (BUILTIN_EXEMPT.test(name)) return "하네스 기본 면제";
  if (FIXED_ALLOW.has(await componentNameOf(node)))
    return "design-rules 가 fixed 로 선언";
  return null;
}

// figma-snapshot.js 의 layoutInfo 와 같은 정규화.
// 세로 스택은 primaryAxisSizingMode, 가로 스택은 counterAxisSizingMode 가 높이를 지배한다.
function vSizingOf(node) {
  const mode = node.layoutMode || "NONE";
  if (mode === "NONE") return null;
  const own =
    mode === "VERTICAL"
      ? node.primaryAxisSizingMode
      : node.counterAxisSizingMode;
  let v = own === "AUTO" ? "HUG" : own === "FIXED" ? "FIXED" : null;
  // 부모가 오토레이아웃이면 layoutSizingVertical 이 더 정확하다 (FILL 구분 가능)
  if (node.layoutSizingVertical) v = node.layoutSizingVertical;
  return v;
}

function isImageSlot(node) {
  return /^Img\//.test(String(node.name || ""));
}

// ==================== 검사 ====================

const findings = [];
const counts = {};
let nodesScanned = 0;
let truncated = false;

function report(rule, frameName, node, detail) {
  counts[rule] = (counts[rule] || 0) + 1;
  if (findings.length >= MAX_FINDINGS) {
    truncated = true;
    return;
  }
  findings.push({
    rule,
    frame: frameName,
    node: node.name,
    id: node.id,
    detail,
  });
}

// 바인딩된 변수를 전부 모은다: fills/strokes 의 color, 그리고 node.boundVariables 의 나머지.
async function checkBindings(node, frameName) {
  const bv = node.boundVariables || {};

  // 1) paint (fill / stroke)
  for (const [kind, list] of [
    ["fill", Array.isArray(node.fills) ? node.fills : []],
    ["stroke", Array.isArray(node.strokes) ? node.strokes : []],
  ]) {
    for (const paint of list) {
      if (!paint || paint.visible === false) continue;
      if (paint.type === "IMAGE") continue; // 이미지에는 색 변수를 바인딩하지 않는다
      const id =
        paint.boundVariables &&
        paint.boundVariables.color &&
        paint.boundVariables.color.id;
      if (!id) {
        if (paint.type === "SOLID" && !isImageSlot(node)) {
          report(
            "unbound-paint",
            frameName,
            node,
            `${kind} 이 변수 없이 값으로 칠해져 있다`,
          );
        }
        continue;
      }
      const info = await variableInfo(id);
      if (!info || info.collection !== "semantic") {
        report(
          "primitive-binding",
          frameName,
          node,
          `${kind} 이 ${info ? info.collection || "알 수 없는" : "알 수 없는"} 컬렉션의 ${info ? info.name : id} 을 직접 바인딩 (semantic 이어야 한다)`,
        );
      }
    }
  }

  // 2) 그 외 속성 (padding / itemSpacing / radius / size / strokeWeight ...)
  for (const prop of Object.keys(bv)) {
    if (prop === "fills" || prop === "strokes") continue; // 위에서 봤다
    const entry = bv[prop];
    const refs = Array.isArray(entry) ? entry : [entry];
    for (const ref of refs) {
      const id = ref && ref.id;
      if (!id) continue;
      const info = await variableInfo(id);
      if (!info || info.collection !== "semantic") {
        report(
          "primitive-binding",
          frameName,
          node,
          `${prop} 이 ${info ? info.collection || "알 수 없는" : "알 수 없는"} 컬렉션의 ${info ? info.name : id} 을 직접 바인딩 (semantic 이어야 한다)`,
        );
      }
    }
  }
}

async function checkLayout(node, frameName) {
  if (!CONTAINER_TYPES.has(node.type)) return;
  const mode = node.layoutMode || "NONE";
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  if (
    mode !== "NONE" &&
    vSizingOf(node) === "FIXED" &&
    !(await isExempt(node))
  ) {
    report(
      "fixed-height",
      frameName,
      node,
      `오토레이아웃(${mode}) 컨테이너인데 세로가 FIXED (높이 ${Math.round(node.height)}). HUG 여야 한다`,
    );
  }

  if (mode === "NONE" && hasChildren && !(await isExempt(node))) {
    report(
      "no-auto-layout",
      frameName,
      node,
      "자식이 있는 컨테이너인데 오토레이아웃이 없다",
    );
  }
}

// 자식이 부모 안쪽(padding 제외) 밖으로 나가는지. 아래/오른쪽만 본다.
// mirror of scripts/lib/layout-rules.mjs overflowOf (Plugin API 좌표계 판) — 둘을 함께 고친다.
function checkOverflow(node, parent, frameName) {
  if (!parent || parent.type === "PAGE") return;
  if (typeof node.x !== "number" || typeof node.width !== "number") return;
  const padRight = parent.paddingRight || 0;
  const padBottom = parent.paddingBottom || 0;
  const overRight = Math.round(node.x + node.width - (parent.width - padRight));
  const overBottom = Math.round(
    node.y + node.height - (parent.height - padBottom),
  );
  if (overRight > TOLERANCE || overBottom > TOLERANCE) {
    const parts = [];
    if (overBottom > TOLERANCE) parts.push(`아래로 ${overBottom}px`);
    if (overRight > TOLERANCE) parts.push(`오른쪽으로 ${overRight}px`);
    report(
      "content-overflow",
      frameName,
      node,
      `"${parent.name}"(${Math.round(parent.width)}×${Math.round(parent.height)}) 밖으로 ${parts.join(" / ")} 넘침`,
    );
  }
}

function checkText(node, frameName) {
  if (node.type !== "TEXT") return;
  const styleId = node.textStyleId;
  if (!styleId || styleId === figma.mixed) {
    report("text-no-style", frameName, node, "텍스트 스타일(Text/*)이 없다");
  }
  if (node.textAutoResize === "NONE") {
    report(
      "text-no-autoresize",
      frameName,
      node,
      "textAutoResize 가 NONE — 줄이 늘면 잘린다. HEIGHT 로",
    );
  }
}

async function walk(node, parent, frameName) {
  if (nodesScanned >= MAX_NODES) return;
  nodesScanned++;

  await checkBindings(node, frameName);
  await checkLayout(node, frameName);
  checkOverflow(node, parent, frameName);
  checkText(node, frameName);

  if (Array.isArray(node.children)) {
    for (const child of node.children) await walk(child, node, frameName);
  }
}

// ==================== 실행 ====================

const page = figma.root.children.find((p) => p.name === PAGE_NAME);
if (!page) {
  return {
    schema: "figma-lint/1",
    page: PAGE_NAME,
    error: `페이지 없음: "${PAGE_NAME}"`,
    passed: false,
  };
}
await page.loadAsync();
await figma.setCurrentPageAsync(page);

const topLevel = page.children.filter(
  (n) => FRAME_FILTER.size === 0 || FRAME_FILTER.has(n.name),
);

for (const frame of topLevel) {
  await walk(frame, page, frame.name);
}

return {
  schema: "figma-lint/1",
  page: PAGE_NAME,
  frames_checked: topLevel.map((n) => n.name),
  nodes_scanned: nodesScanned,
  fixed_allow: Array.from(FIXED_ALLOW),
  passed: findings.length === 0 && !truncated,
  counts,
  findings,
  truncated,
};
