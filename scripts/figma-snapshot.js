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
 *   2. 상단 CONFIG 치환:
 *        __FILE_KEY__   → design/04-screens/figma-file-key.txt 의 내용
 *        __PAGE_NAME__  → "01 Tokens" | "02 Components" | "03 Screens"
 *        __FRAME_FROM__ / __FRAME_TO__ → 배치 추출할 때만. 안 쓰면 그대로 두면 된다.
 *
 *   ── 응답이 잘릴 때 (프레임 많은 페이지) ─────────────────────────────
 *   use_figma 응답에는 크기 상한이 있다. 한 번에 다 못 뽑으면 범위를 나눠 여러 번 호출하고
 *   결과를 각각 파일로 저장한 뒤 병합 스크립트로 합친다. 손으로 합치지 말 것.
 *     예) FRAME_FROM=0  FRAME_TO=8   → batch-1.json
 *         FRAME_FROM=8  FRAME_TO=16  → batch-2.json
 *         FRAME_FROM=16 FRAME_TO=0   → batch-3.json (0 = 끝까지)
 *     node scripts/merge-snapshot.mjs batch-1.json batch-2.json batch-3.json
 *   병합 스크립트가 frame_range 로 구멍·중복·누락을 검사한다.
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
 *
 * ── schema_version 3 (레이아웃 거동) ───────────────────────────────────
 *   v2 대비 추가된 것 (전부 추가이며, 기존 필드는 그대로다):
 *   1) node.layout = {layoutMode, layoutSizingHorizontal/Vertical,
 *                     primaryAxisSizingMode, counterAxisSizingMode, vSizing}
 *      vSizing 이 "FIXED" 면 그 컨테이너는 내용을 감싸지 않는다.
 *      scripts/check-layout.mjs 가 이걸로 고정 높이를 잡는다.
 *   2) node.parentId — 넘침(자식이 부모 밖으로 삐져나감) 계산의 근거
 *   3) node.textAutoResize — 텍스트가 잘리는지 판정
 *   4) frame.layout / frame.padding — 프레임 루트 자신의 거동
 *
 * ── schema_version 2 (토큰 2계층) ──────────────────────────────────────
 *   v1 대비 바뀐 것:
 *   1) variables 가 {컬렉션: [이름]} → {컬렉션: [{name, type, aliasOf}]}
 *      aliasOf 는 "이 변수가 가리키는 다른 변수의 이름". primitive 는 null.
 *      semantic 이 전부 alias 인지를 check-snapshot.mjs 가 이걸로 판정한다.
 *   2) fills[]/strokes[] 에 boundVariableCollection 추가.
 *      바인딩된 변수가 속한 컬렉션 이름("primitives" | "semantic").
 *      화면이 primitive 를 직접 바인딩했는지를 figma-audit.mjs 가 이걸로 판정한다.
 */

// ==================== CONFIG (figma-builder가 치환) ====================

const FILE_KEY = "__FILE_KEY__";
const PAGE_NAME = "__PAGE_NAME__";

// 배치 추출 범위 (0-based, from 포함 / to 미포함).
// use_figma 응답에는 크기 상한이 있어서 프레임이 많은 페이지는 한 번에 못 뽑는다.
// 그때만 이 두 값을 치환해 나눠 뽑고, scripts/merge-snapshot.mjs 로 합친다.
// 치환하지 않으면(= 플레이스홀더 그대로) Number() 가 NaN → 0 이 되어 페이지 전체를 뽑는다.
const FRAME_FROM = Number("__FRAME_FROM__") || 0;
const FRAME_TO = Number("__FRAME_TO__") || 0; // 0 = 끝까지

const SCHEMA_VERSION = 3;
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

// 변수/스타일 캐시 (같은 id 재조회 방지)
const varInfoCache = new Map();
const collectionNameCache = new Map();
const styleNameCache = new Map();

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

// 이 변수가 다른 변수를 가리키면 그 대상 이름을 돌려준다.
// 2계층(semantic → primitive) 판정의 유일한 근거다.
// 값을 직접 가진 변수(= primitive)는 null.
async function aliasTargetName(variable) {
  try {
    const byMode = variable.valuesByMode || {};
    for (const modeId of Object.keys(byMode)) {
      const v = byMode[modeId];
      if (v && v.type === "VARIABLE_ALIAS" && v.id) {
        const target = await figma.variables.getVariableByIdAsync(v.id);
        if (target) return target.name;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function variableInfo(id) {
  if (!id) return null;
  if (varInfoCache.has(id)) return varInfoCache.get(id);
  let info = null;
  try {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) {
      info = {
        name: v.name,
        collection: await collectionNameOf(v.variableCollectionId),
        aliasOf: await aliasTargetName(v),
      };
    }
  } catch (e) {
    info = null;
  }
  varInfoCache.set(id, info);
  return info;
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

// paint[] → audit 이 읽는 형태로.
//   boundVariable           = 바인딩된 변수 이름 or null
//   boundVariableCollection = 그 변수가 속한 컬렉션 이름 or null
//                             ("semantic" 이 아니면 토큰 계층 위반)
async function paints(list) {
  if (!list || list === figma.mixed || !Array.isArray(list)) return [];
  const out = [];
  for (const p of list) {
    if (!p || p.visible === false) continue;
    const info = await variableInfo(p.boundVariables?.color?.id);
    out.push({
      type: p.type,
      color: p.type === "SOLID" ? toHex(p.color) : null,
      boundVariable: info ? info.name : null,
      boundVariableCollection: info ? info.collection : null,
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
// 'row' 는 뺐다. Card > Row, SpecBox > Row 처럼 좌라벨/우값을 배치하는 레이아웃
// 컨테이너 이름으로 흔히 쓰여 오탐이 크다(누를 수 없는 노드가 tap-min 44 위반으로 잡힌다).
// 진짜 눌리는 행은 STRONG_TAP_RE 의 'list item' 이 이미 잡는다.
const WEAK_TAP_RE = /\b(tab|chip|toggle|switch|checkbox|radio|link|item)\b/i;

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

// 레이아웃 거동. "컨테이너가 내용을 감싸는가"를 판정할 유일한 근거다.
// 이 필드들이 없으면 고정 높이를 아무도 못 잡는다 (schema_version 3 에서 추가).
//
// layoutSizingVertical 은 오토레이아웃 "자식"에서만 의미가 있고,
// primaryAxisSizingMode / counterAxisSizingMode 는 오토레이아웃 "컨테이너" 자신의 값이다.
// 세로 스택(VERTICAL)에서 높이를 지배하는 건 primaryAxisSizingMode,
// 가로 스택(HORIZONTAL)에서 높이를 지배하는 건 counterAxisSizingMode 다.
// 판정기가 헷갈리지 않게 vSizing 으로 정규화해서 같이 내보낸다.
function layoutInfo(node) {
  const mode = node.layoutMode || "NONE";
  const info = {
    layoutMode: mode,
    layoutSizingHorizontal: node.layoutSizingHorizontal ?? null,
    layoutSizingVertical: node.layoutSizingVertical ?? null,
    primaryAxisSizingMode: null,
    counterAxisSizingMode: null,
    vSizing: null, // "HUG" | "FIXED" | "FILL" | null(오토레이아웃 아님)
  };

  if (mode !== "NONE") {
    info.primaryAxisSizingMode = node.primaryAxisSizingMode ?? null;
    info.counterAxisSizingMode = node.counterAxisSizingMode ?? null;
    const own =
      mode === "VERTICAL"
        ? info.primaryAxisSizingMode
        : info.counterAxisSizingMode;
    // AUTO = 내용을 감싼다(HUG), FIXED = 높이를 박았다
    info.vSizing = own === "AUTO" ? "HUG" : own === "FIXED" ? "FIXED" : null;
  }

  // 부모가 오토레이아웃이면 자식의 layoutSizingVertical 이 더 정확하다 (FILL 구분 가능)
  if (info.layoutSizingVertical) info.vSizing = info.layoutSizingVertical;

  return info;
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

async function extractNode(node, frameOrigin, parentId) {
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
    // 부모 노드 id. 프레임 직속이면 null.
    // check-layout.mjs 가 "자식이 부모를 넘쳤는가"를 계산하는 근거다.
    parentId: parentId ?? null,
    name: node.name,
    type: node.type,
    fills: await paints(node.fills),
    strokes: await paints(node.strokes),
    textStyle: null,
    padding: autoLayoutPadding(node),
    size,
    position,
    layout: layoutInfo(node),
    textAutoResize: node.type === "TEXT" ? (node.textAutoResize ?? null) : null,
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

  // { node, parentId } 로 들고 다닌다. parentId 는 프레임 직속이면 null.
  const stack = (frame.children || []).map((n) => ({
    node: n,
    parentId: null,
  }));
  while (stack.length > 0) {
    const { node, parentId } = stack.shift();
    if (!node || node.visible === false) continue;

    if (nodes.length >= MAX_NODES_PER_FRAME) {
      truncated = true;
      break;
    }

    nodes.push(await extractNode(node, origin, parentId));

    if (node.children && node.children.length > 0) {
      stack.push(...node.children.map((c) => ({ node: c, parentId: node.id })));
    }
  }

  return {
    name: frame.name,
    width: Math.round(frame.width ?? 0),
    height: Math.round(frame.height ?? 0),
    // 프레임 자신의 레이아웃 거동 (화면·컴포넌트 루트가 고정 높이인지 판정)
    layout: layoutInfo(frame),
    padding: autoLayoutPadding(frame),
    truncated,
    nodes,
  };
}

// ==================== 변수 / 스타일 ====================

// {컬렉션 이름: [{name, type, aliasOf}]}
// aliasOf 가 있으면 그 변수는 다른 변수를 참조하는 semantic 토큰이다.
async function extractVariables() {
  const result = {};
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  for (const col of collections) {
    const entries = [];
    for (const id of col.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (!v) continue;
      entries.push({
        name: v.name,
        type: v.resolvedType || null,
        aliasOf: await aliasTargetName(v),
      });
    }
    result[col.name] = entries;
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

// 이 페이지의 추출 대상 프레임 전체 목록 (범위 계산의 기준이 된다)
const targets = page.children.filter(
  (c) =>
    c.type === "FRAME" || c.type === "COMPONENT" || c.type === "COMPONENT_SET",
);

const from = Math.max(0, Math.min(FRAME_FROM, targets.length));
const to = FRAME_TO > 0 ? Math.min(FRAME_TO, targets.length) : targets.length;

if (from >= to && targets.length > 0) {
  throw new Error(
    `빈 범위: FRAME_FROM=${from} / FRAME_TO=${FRAME_TO} (이 페이지의 프레임 ${targets.length}개)`,
  );
}

const frames = [];
for (const child of targets.slice(from, to)) {
  frames.push(await extractFrame(child));
}

const styles = await extractStyles();

return {
  schema_version: SCHEMA_VERSION,
  file_key: FILE_KEY,
  snapshot_date: new Date().toISOString(),
  // 배치 병합의 근거. merge-snapshot.mjs 가 이 값으로 순서를 잡고
  // 구멍/중복 없이 total_frames 를 전부 덮었는지 검사한다.
  frame_range: { from, to, total_frames: targets.length },
  page: {
    name: page.name,
    frames,
  },
  variables: await extractVariables(),
  textStyles: styles.text,
  effectStyles: styles.effect,
  paintStyles: styles.paint,
};
