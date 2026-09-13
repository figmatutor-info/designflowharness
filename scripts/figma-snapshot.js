/**
 * figma-snapshot.js
 *
 * ⚠️ 이 파일은 Node.js로 실행하지 않는다. (top-level return 사용 → node 실행 시 SyntaxError)
 *    figma-builder가 Read 한 뒤 `use_figma` 의 code 파라미터로 그대로 주입하는 스크립트다.
 *    실행 환경은 Figma Plugin API 샌드박스이며, 반환값(JSON)을 에이전트가 받아
 *    design/04-screens/figma-snapshot.json 에 Write 한다.
 *
 * 왜 파일로 고정했나:
 *    scripts/figma-audit.mjs 가 읽는 필드 이름이 엄격하다. LLM이 매번 추출 코드를
 *    즉흥 작성하면 스키마가 어긋나 audit 이 조용히 오판(전부 PASS / 전부 FAIL)한다.
 *    추출 계약을 이 파일 하나로 고정한다.
 *
 * ── 사용법 (figma-builder) ──────────────────────────────────────────────
 *   1. Read scripts/figma-snapshot.js
 *   2. 상단 CONFIG 의 두 값을 치환:
 *        __FILE_KEY__   → design/04-screens/figma-file-key.txt 의 내용
 *        __PAGE_NAME__  → "01 Tokens" | "02 Components" | "03 Screens"
 *   3. use_figma 로 실행 (skillNames 에 figma-use 포함)
 *   4. 반환된 JSON 의 page 를 기존 figma-snapshot.json 의 pages 배열에
 *      같은 name 이 있으면 교체, 없으면 추가 → Write
 *   5. node scripts/check-snapshot.mjs 로 스키마 검증
 *
 * ── 제약 (figma-use SKILL.md) ───────────────────────────────────────────
 *   · 호출당 setCurrentPageAsync 는 1회만 → 이 스크립트는 "한 페이지"만 처리한다.
 *     여러 페이지가 필요하면 페이지 수만큼 병렬 호출하고 결과를 합친다.
 *   · console.log 는 전달되지 않는다. 결과는 반드시 return.
 *   · async IIFE 로 감싸지 않는다 (자동 래핑됨).
 *
 * ── 출력 계약 (scripts/figma-audit.mjs 가 읽는 필드) ────────────────────
 *   page.frames[].nodes 는 서브트리를 평탄화한 1차원 배열이다.
 *   (figma-audit.mjs 의 getAllNodes() 가 frame.nodes 를 재귀 없이 그대로 쓴다)
 *   position 은 화면 프레임 기준 좌표다. (safe-area 검사가 844 와 직접 비교)
 */

// ==================== CONFIG (figma-builder가 치환) ====================

const FILE_KEY = "__FILE_KEY__";
const PAGE_NAME = "__PAGE_NAME__";

const SCHEMA_VERSION = 1;
const MAX_NODES_PER_FRAME = 2000; // 폭주 방지

// ==================== 유틸 ====================

function toHex(color) {
  if (!color) return null;
  const ch = (v) => {
    const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
    return n.toString(16).padStart(2, "0").toUpperCase();
  };
  return `#${ch(color.r)}${ch(color.g)}${ch(color.b)}`;
}

// 변수/스타일 이름 캐시 (같은 id 재조회 방지)
const varNameCache = new Map();
const styleNameCache = new Map();

async function variableName(id) {
  if (!id) return null;
  if (varNameCache.has(id)) return varNameCache.get(id);
  let name = null;
  try {
    const v = await figma.variables.getVariableByIdAsync(id);
    name = v ? v.name : null;
  } catch (e) {
    name = null;
  }
  varNameCache.set(id, name);
  return name;
}

async function styleName(id) {
  if (!id || typeof id !== "string") return null;
  if (styleNameCache.has(id)) return styleNameCache.get(id);
  let name = null;
  try {
    const s = await figma.getStyleByIdAsync(id);
    name = s ? s.name : null;
  } catch (e) {
    name = null;
  }
  styleNameCache.set(id, name);
  return name;
}

// paint[] → audit 이 읽는 형태로. boundVariable 은 "바인딩된 변수 이름 or null".
async function paints(list) {
  if (!list || list === figma.mixed || !Array.isArray(list)) return [];
  const out = [];
  for (const p of list) {
    if (!p || p.visible === false) continue;
    out.push({
      type: p.type,
      color: p.type === "SOLID" ? toHex(p.color) : null,
      boundVariable: await variableName(p.boundVariables?.color?.id),
    });
  }
  return out;
}

// 탭 가능 노드 판별.
//
// 이름 규약으로 추정하되, 부분 문자열 매칭은 쓰지 않는다.
// (\b 없이 /row/ 를 쓰면 Ar-row / B-row-se / G-row 가, /tab/ 은 Tab-le 이,
//  /link/ 는 Link-ed 가 전부 탭 타겟으로 잡힌다)
// camelCase 는 단어로 쪼갠 뒤 판정한다: "IconButton" → "Icon Button"

// 이 단어가 있으면 무조건 탭 타겟
// (복합어는 NON_TAP 의 'list'/'menu' 보다 먼저 판정되어야 한다)
const STRONG_TAP_RE =
  /\b(button|btn|cta|fab|list item|menu item|card action)\b/i;

// 탭 타겟일 가능성이 높은 단어 (아래 NON_TAP 에 걸리지 않을 때만)
const WEAK_TAP_RE =
  /\b(tab|chip|toggle|switch|checkbox|radio|link|row|item)\b/i;

// 컨테이너·장식 요소. 실제 탭 단위는 이들의 부모다.
// TabBar("Tab Bar") 같은 크롬 컨테이너와 아이콘·라벨을 여기서 걸러낸다.
const NON_TAP_RE =
  /\b(bar|nav|navigation|container|wrapper|group|section|list|grid|screen|page|background|bg|icon|label|text|title|caption|badge|image|divider)\b/i;

function splitWords(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-/]+/g, " ");
}

function matchesTap(name) {
  const words = splitWords(name);
  if (STRONG_TAP_RE.test(words)) return true;
  if (NON_TAP_RE.test(words)) return false;
  return WEAK_TAP_RE.test(words);
}

function isTapTarget(node, mainName) {
  // 프로토타입 인터랙션이 붙어 있어도 컨테이너면 제외
  if (Array.isArray(node.reactions) && node.reactions.length > 0) {
    return !NON_TAP_RE.test(splitWords(node.name));
  }
  if (matchesTap(node.name)) return true;
  if (mainName && matchesTap(mainName)) return true;
  return false;
}

// primary 판별. 이름에 primary 가 있거나, 인스턴스의 variant 속성이 primary.
function isPrimary(node, mainName) {
  if (/primary/i.test(node.name)) return true;
  if (mainName && /primary/i.test(mainName)) return true;
  const props = node.componentProperties;
  if (props) {
    for (const key of Object.keys(props)) {
      const val = props[key]?.value;
      if (typeof val === "string" && /^primary$/i.test(val)) return true;
    }
  }
  return false;
}

function autoLayoutPadding(node) {
  if (!node.layoutMode || node.layoutMode === "NONE") return null;
  return {
    top: node.paddingTop ?? 0,
    right: node.paddingRight ?? 0,
    bottom: node.paddingBottom ?? 0,
    left: node.paddingLeft ?? 0,
  };
}

// ==================== 노드 추출 ====================

async function extractNode(node, frameOrigin) {
  const box = node.absoluteBoundingBox;

  // 프레임 기준 좌표. absoluteBoundingBox 가 없으면 로컬 x/y 로 폴백.
  const position =
    box && frameOrigin
      ? {
          x: Math.round(box.x - frameOrigin.x),
          y: Math.round(box.y - frameOrigin.y),
        }
      : { x: Math.round(node.x ?? 0), y: Math.round(node.y ?? 0) };

  const size = {
    width: Math.round(node.width ?? box?.width ?? 0),
    height: Math.round(node.height ?? box?.height ?? 0),
  };

  let mainName = null;
  if (node.type === "INSTANCE") {
    try {
      const main = await node.getMainComponentAsync();
      mainName = main ? main.name : null;
    } catch (e) {
      mainName = null;
    }
  }

  const out = {
    id: node.id,
    name: node.name,
    type: node.type,
    fills: await paints(node.fills),
    strokes: await paints(node.strokes),
    textStyle: null,
    padding: autoLayoutPadding(node),
    size,
    position,
    isTapTarget: isTapTarget(node, mainName),
    isPrimary: isPrimary(node, mainName),
    isInstance: node.type === "INSTANCE",
  };

  if (node.layoutMode && node.layoutMode !== "NONE") {
    out.itemSpacing = node.itemSpacing ?? 0;
  }

  if (node.type === "TEXT") {
    const id = node.textStyleId;
    // figma.mixed = 한 텍스트에 여러 스타일 → 스타일 미적용으로 간주(위반)
    out.textStyle = id === figma.mixed ? null : await styleName(id);
  }

  if (mainName) out.mainComponent = mainName;

  return out;
}

// 프레임 서브트리를 평탄화. 숨김 노드는 제외(오탐 방지).
async function extractFrame(frame) {
  const origin = frame.absoluteBoundingBox || {
    x: frame.x ?? 0,
    y: frame.y ?? 0,
  };
  const nodes = [];
  let truncated = false;

  const stack = [...(frame.children || [])];
  while (stack.length > 0) {
    const node = stack.shift();
    if (!node || node.visible === false) continue;

    if (nodes.length >= MAX_NODES_PER_FRAME) {
      truncated = true;
      break;
    }

    nodes.push(await extractNode(node, origin));

    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }

  return {
    name: frame.name,
    width: Math.round(frame.width ?? 0),
    height: Math.round(frame.height ?? 0),
    truncated,
    nodes,
  };
}

// ==================== 변수 / 스타일 ====================

async function extractVariables() {
  const result = {};
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  for (const col of collections) {
    const names = [];
    for (const id of col.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) names.push(v.name);
    }
    result[col.name] = names;
  }
  return result;
}

async function extractStyles() {
  const text = (await figma.getLocalTextStylesAsync()).map((s) => s.name);
  const effect = (await figma.getLocalEffectStylesAsync()).map((s) => s.name);
  const paint = (await figma.getLocalPaintStylesAsync()).map((s) => s.name);
  return { text, effect, paint };
}

// ==================== 실행 ====================

const page = figma.root.children.find((p) => p.name === PAGE_NAME);

if (!page) {
  throw new Error(
    `페이지 "${PAGE_NAME}" 없음. 존재하는 페이지: ${figma.root.children.map((p) => p.name).join(", ")}`,
  );
}

// 페이지는 지연 로딩된다. 전환해야 children 이 채워진다. (호출당 1회만)
await figma.setCurrentPageAsync(page);

const frames = [];
for (const child of page.children) {
  if (
    child.type === "FRAME" ||
    child.type === "COMPONENT" ||
    child.type === "COMPONENT_SET"
  ) {
    frames.push(await extractFrame(child));
  }
}

const styles = await extractStyles();

return {
  schema_version: SCHEMA_VERSION,
  file_key: FILE_KEY,
  snapshot_date: new Date().toISOString(),
  page: {
    name: page.name,
    frames,
  },
  variables: await extractVariables(),
  textStyles: styles.text,
  effectStyles: styles.effect,
  paintStyles: styles.paint,
};
