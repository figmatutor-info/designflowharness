/**
 * figma-token-docs.js
 *
 * ⚠️ 이 파일은 Node.js로 실행하지 않는다. (top-level await/return 사용)
 *    figma-builder가 Read 한 뒤 `use_figma` 의 code 파라미터로 그대로 주입하는 스크립트다.
 *    실행 환경은 Figma Plugin API 샌드박스이며, 반환값(JSON)은 실행 요약이다.
 *
 * 무엇을 하나:
 *    `01 Tokens` 페이지에 토큰 문서 프레임 6개를 그린다.
 *    (Color Primitives / Color Semantic / Scale Primitives / Scale Semantic /
 *     Typography / Shadow)
 *
 * 왜 파일로 고정했나:
 *    예전 지시는 "스와치 프레임 하나 그림 (내부 검증용)" 한 줄이 전부였다.
 *    치수·그리드·카드 구조가 없으니 실행마다 결과가 달랐고, 실제로 2016×146 짜리
 *    한 줄 띠에 라벨이 칩 위에 겹쳐 잘린 산출물이 나왔다.
 *    figma-snapshot.js 와 같은 처방이다 — 즉흥 작성 금지, 파일 하나로 고정.
 *
 *    레이아웃 계약의 SSOT 는 docs/token-docs-spec.md 다.
 *    이 스크립트는 그 문서의 구현이고, scripts/check-token-docs.mjs 가 판정한다.
 *    셋 중 하나만 고치지 말 것.
 *
 * ── 사용법 (figma-builder) ──────────────────────────────────────────────
 *   1. Read scripts/figma-token-docs.js
 *   2. 상단 CONFIG 치환:
 *        __PAGE_NAME__      → "01 Tokens"
 *        __PROJECT_LABEL__  → 문서 상단 좌측 라벨 (예: "BETA DESIGN SYSTEM")
 *        __DOC_DATE__       → 문서 상단 우측 날짜 (예: "SEP 17, 2026")
 *        __ONLY__           → 보통 치환하지 않는다. 한 번에 다 못 그릴 때만
 *                             "color" | "scale" | "type" | "shadow" 로 쪼개 실행
 *   3. use_figma 로 실행 (skillNames 에 figma-use 포함)
 *   4. 끝나면 figma-snapshot.js 로 스냅샷 재추출 → check-token-docs.mjs 로 검증
 *
 * ── 멱등성 ──────────────────────────────────────────────────────────────
 *   실행 시 기존 `Token Documentation — *` 와 레거시 `Token Swatch` 를 먼저 지운다.
 *   토큰을 고친 뒤 다시 돌리면 문서가 항상 현재 변수 상태와 일치한다.
 *
 * ── 제약 (figma-use SKILL.md) ───────────────────────────────────────────
 *   · 호출당 setCurrentPageAsync 는 1회만 → 이 스크립트는 "한 페이지"만 처리한다.
 *   · console.log 는 전달되지 않는다. 결과는 반드시 return.
 *   · async IIFE 로 감싸지 않는다 (자동 래핑됨).
 */

// ==================== CONFIG (figma-builder가 치환) ====================

const PAGE_NAME = "__PAGE_NAME__";
const PROJECT_LABEL = "__PROJECT_LABEL__";
const DOC_DATE = "__DOC_DATE__";

// 쪼개 실행할 때만 치환. 치환하지 않으면 플레이스홀더 그대로 → 전부 그린다.
const ONLY_RAW = "__ONLY__";
const ONLY = /^(color|scale|type|shadow)$/.test(ONLY_RAW) ? ONLY_RAW : "all";

// ==================== 레이아웃 상수 (docs/token-docs-spec.md) ====================

const DOC_W = 1280;
const DOC_GAP = 120; // 캔버스에서 문서끼리 벌리는 간격
const PAD_X = 64;

const STATUS_H = 64;
const TITLE_H = 192;

const SECTION_HEADER_Y = 33;
const SECTION_HEADER_H = 40;
const GRID_Y = 93; // = SECTION_HEADER_Y + SECTION_HEADER_H + 20
const SECTION_PAD_BOTTOM = 32;

const COLS = 5;
const CARD_W = 214;
const CARD_H = 136;
const COL_PITCH = 230; // CARD_W + 16
const ROW_PITCH = 152; // CARD_H + 16
const GRID_W = 1152; // = DOC_W - PAD_X * 2

const CARD_PAD = 13;
const SWATCH_W = 190;
const SWATCH_H = 56;
const NAME_Y = 77;
const VALUE_Y = 105;
const LINE_H = 20;

// 문서 크롬 색 (제품 토큰이 아니다 — spec §5 의 예외 규정)
const C_BG = { r: 1, g: 1, b: 1 };
const C_LINE = { r: 0.898, g: 0.906, b: 0.922 }; // #E5E7EB
const C_TEXT = { r: 0.067, g: 0.094, b: 0.153 }; // #111827
const C_MUTED = { r: 0.42, g: 0.447, b: 0.502 }; // #6B7280
const C_FAINT = { r: 0.612, g: 0.639, b: 0.686 }; // #9CA3AF
const C_BAR = { r: 0.239, g: 0.353, b: 0.996 }; // #3D5AFE

const NOTE = {
  primitive: "원시 값입니다. 제품 UI에서는 시맨틱 토큰을 통해 참조하세요.",
  semantic: "제품 UI는 이 계층만 참조합니다. 값은 프리미티브에서 옵니다.",
  type: "role 기반 텍스트 스타일입니다. 크기를 직접 쓰지 마세요.",
  shadow: "이펙트 스타일입니다. 그림자를 직접 그리지 마세요.",
};

// 그룹 키 → 한글 라벨. 표에 없는 키는 키 그대로 쓰고 표 뒤에 알파벳 순으로 붙는다.
const GROUP_LABEL = {
  brand: "브랜드",
  neutral: "뉴트럴",
  red: "레드",
  green: "그린",
  amber: "앰버",
  teal: "틸",
  overlay: "오버레이",
  bg: "배경",
  surface: "표면",
  border: "보더",
  text: "텍스트",
  primary: "프라이머리",
  danger: "위험",
  success: "성공",
  warning: "경고",
  status: "상태",
  space: "간격",
  radius: "라운드",
  size: "크기",
  icon: "아이콘",
  safe: "세이프에어리어",
  app: "앱바",
  tab: "탭바",
};
const GROUP_ORDER = Object.keys(GROUP_LABEL);

// ==================== 폰트 ====================

const FONT_CANDIDATES = ["Pretendard", "Inter"];
const WEIGHT = {
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
};

let FAMILY = null;

async function pickFamily() {
  for (const family of FONT_CANDIDATES) {
    try {
      for (const style of Object.values(WEIGHT)) {
        await figma.loadFontAsync({ family, style });
      }
      return family;
    } catch (e) {
      // 다음 후보로
    }
  }
  throw new Error(
    `문서용 폰트를 못 찾았다. ${FONT_CANDIDATES.join(" / ")} 중 하나가 Regular/Medium/SemiBold/Bold 전부 있어야 한다.`,
  );
}

// ==================== 노드 유틸 ====================

function solid(color) {
  return { type: "SOLID", color, opacity: 1 };
}

function frame(name, x, y, w, h, parent) {
  const f = figma.createFrame();
  f.name = name;
  f.x = x;
  f.y = y;
  f.resize(w, h);
  f.fills = [];
  f.clipsContent = false;
  if (parent) parent.appendChild(f);
  return f;
}

function text(str, x, y, w, size, weight, color, parent, align) {
  const t = figma.createText();
  t.fontName = { family: FAMILY, style: WEIGHT[weight] };
  t.characters = String(str);
  t.fontSize = size;
  t.fills = [solid(color)];
  t.textAutoResize = "HEIGHT";
  t.x = x;
  t.y = y;
  t.resize(w, LINE_H);
  if (align) t.textAlignHorizontal = align;
  if (parent) parent.appendChild(t);
  return t;
}

function rect(name, x, y, w, h, radius, parent) {
  const r = figma.createRectangle();
  r.name = name;
  r.x = x;
  r.y = y;
  r.resize(w, h);
  r.cornerRadius = radius;
  if (parent) parent.appendChild(r);
  return r;
}

function hexOf(rgba) {
  if (!rgba || typeof rgba.r !== "number") return "";
  const ch = (v) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  const base = `#${ch(rgba.r)}${ch(rgba.g)}${ch(rgba.b)}`;
  const a = typeof rgba.a === "number" ? rgba.a : 1;
  return a >= 1 ? base : `${base}${ch(a)}`;
}

function groupKeyOf(name, isSemanticColor) {
  const parts = String(name).split("-");
  // color-text-muted → text (semantic 색상만 두 번째 조각을 쓴다)
  if (isSemanticColor && parts[0] === "color" && parts.length > 1)
    return parts[1];
  return parts[0];
}

// GROUP_ORDER 에 있는 것 먼저 그 순서대로, 없는 것은 뒤에 알파벳 순.
function sortedGroups(map) {
  const keys = Array.from(map.keys());
  const known = GROUP_ORDER.filter((k) => map.has(k));
  const unknown = keys.filter((k) => GROUP_ORDER.indexOf(k) === -1).sort();
  return known.concat(unknown);
}

// ==================== 문서 렌더러 ====================

/**
 * items: [{ name, value, render(swatchFrame, item) }]
 * render 는 카드의 시각 영역(190×56 프레임)을 채운다.
 */
async function renderDoc(opts) {
  const { title, desc, note, items, semanticColorGrouping, x } = opts;

  // 그룹핑
  const groups = new Map();
  for (const it of items) {
    const key = groupKeyOf(it.name, semanticColorGrouping);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  const order = sortedGroups(groups);

  // 전체 높이 선계산
  let totalH = STATUS_H + TITLE_H;
  const sectionH = new Map();
  for (const key of order) {
    const rows = Math.ceil(groups.get(key).length / COLS);
    const gridH = rows * CARD_H + (rows - 1) * 16;
    const h = GRID_Y + gridH + SECTION_PAD_BOTTOM;
    sectionH.set(key, { h, gridH });
    totalH += h;
  }

  const doc = frame(
    `Token Documentation — ${title}`,
    x,
    0,
    DOC_W,
    totalH,
    figma.currentPage,
  );
  doc.fills = [solid(C_BG)];
  doc.clipsContent = true;

  // _Status
  const status = frame("_Status", 0, 0, DOC_W, STATUS_H, doc);
  const pl = text(PROJECT_LABEL, 32, 23.5, 400, 11, 600, C_TEXT, status);
  pl.letterSpacing = { unit: "PERCENT", value: 8 };
  text(
    DOC_DATE,
    DOC_W - 32 - 200,
    23.5,
    200,
    11,
    600,
    C_FAINT,
    status,
    "RIGHT",
  );

  // Title
  const titleFrame = frame("Title", 0, STATUS_H, DOC_W, TITLE_H, doc);
  text(title, PAD_X, 56, GRID_W, 32, 700, C_TEXT, titleFrame);
  text(desc, PAD_X, 115, 760, 15, 400, C_MUTED, titleFrame);

  // Sections
  let y = STATUS_H + TITLE_H;
  for (const key of order) {
    const { h, gridH } = sectionH.get(key);
    const label = GROUP_LABEL[key] || key;
    const section = frame(`Section · ${label}`, 0, y, DOC_W, h, doc);
    section.strokes = [solid(C_LINE)];
    section.strokeTopWeight = 1;
    section.strokeBottomWeight = 0;
    section.strokeLeftWeight = 0;
    section.strokeRightWeight = 0;

    const header = frame(
      "Section Header",
      PAD_X,
      SECTION_HEADER_Y,
      GRID_W,
      SECTION_HEADER_H,
      section,
    );
    text(label, 0, 0, 400, 18, 600, C_TEXT, header);
    text(note, GRID_W - 620, 0, 620, 13, 400, C_FAINT, header, "RIGHT");

    const grid = frame("Token Grid", PAD_X, GRID_Y, GRID_W, gridH, section);

    groups.get(key).forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const card = frame(
        item.name,
        col * COL_PITCH,
        row * ROW_PITCH,
        CARD_W,
        CARD_H,
        grid,
      );
      card.fills = [solid(C_BG)];
      card.strokes = [solid(C_LINE)];
      card.strokeWeight = 1;
      card.cornerRadius = 10;

      const swatch = frame(
        `Swatch · ${item.name}`,
        CARD_PAD,
        CARD_PAD,
        SWATCH_W,
        SWATCH_H,
        card,
      );
      swatch.clipsContent = true;
      item.render(swatch, item);

      text(item.name, CARD_PAD, NAME_Y, SWATCH_W, 13, 500, C_TEXT, card);
      text(item.value, CARD_PAD, VALUE_Y, SWATCH_W, 12, 400, C_MUTED, card);
    });

    y += h;
  }

  return {
    name: doc.name,
    cards: items.length,
    sections: order.length,
    height: totalH,
  };
}

// ==================== 데이터 수집 ====================

async function collections() {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  const byName = new Map(all.map((c) => [c.name, c]));
  const prim = byName.get("primitives");
  const sem = byName.get("semantic");
  if (!prim || !sem) {
    throw new Error(
      `컬렉션 "primitives" / "semantic" 이 필요하다. 현재: ${all.map((c) => c.name).join(", ") || "(없음)"}`,
    );
  }
  return { prim, sem };
}

async function variablesOf(collection) {
  const out = [];
  for (const id of collection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) out.push(v);
  }
  return out;
}

// 변수의 기본 모드 값. alias 면 { alias: 대상변수 } 를 함께 돌려준다.
async function resolveValue(variable, collection) {
  const modeId =
    collection.defaultModeId || Object.keys(variable.valuesByMode)[0];
  let raw = variable.valuesByMode[modeId];
  let alias = null;
  let guard = 0;
  while (raw && raw.type === "VARIABLE_ALIAS" && guard++ < 5) {
    const target = await figma.variables.getVariableByIdAsync(raw.id);
    if (!target) break;
    if (!alias) alias = target;
    const tCol = await figma.variables.getVariableCollectionByIdAsync(
      target.variableCollectionId,
    );
    const tMode =
      (tCol && tCol.defaultModeId) || Object.keys(target.valuesByMode)[0];
    raw = target.valuesByMode[tMode];
  }
  return { raw, alias };
}

// ==================== 메인 ====================

const page = figma.root.children.find((p) => p.name === PAGE_NAME);
if (!page) {
  throw new Error(
    `페이지 "${PAGE_NAME}" 없음. 존재하는 페이지: ${figma.root.children.map((p) => p.name).join(", ")}`,
  );
}
await figma.setCurrentPageAsync(page);

FAMILY = await pickFamily();

// 멱등: 기존 문서 프레임과 레거시 스와치를 지운다
let removed = 0;
for (const child of page.children.slice()) {
  if (
    child.name.indexOf("Token Documentation — ") === 0 ||
    child.name === "Token Swatch"
  ) {
    child.remove();
    removed++;
  }
}

const { prim, sem } = await collections();
const primVars = await variablesOf(prim);
const semVars = await variablesOf(sem);

const docs = [];
let slot = 0;
const nextX = () => slot++ * (DOC_W + DOC_GAP);

// ── 1) Color Primitives ────────────────────────────────────────────────
if (ONLY === "all" || ONLY === "color") {
  const items = [];
  for (const v of primVars.filter((v) => v.resolvedType === "COLOR")) {
    const { raw } = await resolveValue(v, prim);
    items.push({
      name: v.name,
      value: hexOf(raw),
      render: (sw) => {
        const r = rect(`Chip · ${v.name}`, 0, 0, SWATCH_W, SWATCH_H, 6, sw);
        r.fills = [
          figma.variables.setBoundVariableForPaint(solid(C_BG), "color", v),
        ];
        r.strokes = [
          { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.08 },
        ];
        r.strokeWeight = 1;
        r.strokeAlign = "INSIDE";
      },
    });
  }
  docs.push(
    await renderDoc({
      title: "Color Primitives",
      desc: "시맨틱 계층의 기반이 되는 원시 팔레트입니다. 제품 UI에서 직접 쓰지 않습니다.",
      note: NOTE.primitive,
      items,
      semanticColorGrouping: false,
      x: nextX(),
    }),
  );
}

// ── 2) Color Semantic ──────────────────────────────────────────────────
if (ONLY === "all" || ONLY === "color") {
  const items = [];
  for (const v of semVars.filter((v) => v.resolvedType === "COLOR")) {
    const { alias } = await resolveValue(v, sem);
    items.push({
      name: v.name,
      value: alias ? `→ ${alias.name}` : "⚠ 값 직결 (alias 아님)",
      render: (sw) => {
        const r = rect(`Chip · ${v.name}`, 0, 0, SWATCH_W, SWATCH_H, 6, sw);
        r.fills = [
          figma.variables.setBoundVariableForPaint(solid(C_BG), "color", v),
        ];
        r.strokes = [
          { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.08 },
        ];
        r.strokeWeight = 1;
        r.strokeAlign = "INSIDE";
      },
    });
  }
  docs.push(
    await renderDoc({
      title: "Color Semantic",
      desc: "제품 UI가 참조하는 유일한 색상 계층입니다. 모든 값은 프리미티브의 alias 입니다.",
      note: NOTE.semantic,
      items,
      semanticColorGrouping: true,
      x: nextX(),
    }),
  );
}

// ── 3) Scale Primitives / 4) Scale Semantic ────────────────────────────
function barRender(value) {
  return (sw) => {
    const w = Math.max(4, Math.min(SWATCH_W, Number(value) || 0));
    const bar = rect("Bar", 0, (SWATCH_H - 12) / 2, w, 12, 6, sw);
    bar.fills = [solid(C_BAR)];
  };
}

if (ONLY === "all" || ONLY === "scale") {
  const items = [];
  for (const v of primVars.filter((v) => v.resolvedType === "FLOAT")) {
    const { raw } = await resolveValue(v, prim);
    items.push({ name: v.name, value: String(raw), render: barRender(raw) });
  }
  docs.push(
    await renderDoc({
      title: "Scale Primitives",
      desc: "간격·라운드·크기의 원시 수치입니다. 바 길이는 실제 값에 비례합니다 (190 에서 잘림).",
      note: NOTE.primitive,
      items,
      semanticColorGrouping: false,
      x: nextX(),
    }),
  );

  const semItems = [];
  for (const v of semVars.filter((v) => v.resolvedType === "FLOAT")) {
    const { raw, alias } = await resolveValue(v, sem);
    semItems.push({
      name: v.name,
      value: alias ? `→ ${alias.name} · ${raw}` : `⚠ 값 직결 · ${raw}`,
      render: barRender(raw),
    });
  }
  docs.push(
    await renderDoc({
      title: "Scale Semantic",
      desc: "제품 UI가 참조하는 의도 단위입니다. 수치는 프리미티브에서 옵니다.",
      note: NOTE.semantic,
      items: semItems,
      semanticColorGrouping: false,
      x: nextX(),
    }),
  );
}

// ── 5) Typography ──────────────────────────────────────────────────────
if (ONLY === "all" || ONLY === "type") {
  const styles = await figma.getLocalTextStylesAsync();
  const items = [];
  for (const s of styles) {
    try {
      await figma.loadFontAsync(s.fontName);
    } catch (e) {
      // 폰트 로드 실패 시 샘플은 문서 기본 폰트로 떨어진다
    }
    const size = s.fontSize;
    const style = s.fontName ? s.fontName.style : "";
    items.push({
      name: s.name,
      value: `${size} / ${style}`,
      render: (sw) => {
        const t = figma.createText();
        t.fontName = { family: FAMILY, style: WEIGHT[400] };
        t.characters = "가나다 Ag 123";
        t.fills = [solid(C_TEXT)];
        t.x = 0;
        t.y = 0;
        t.resize(SWATCH_W, SWATCH_H);
        t.textAutoResize = "NONE";
        t.textAlignVertical = "CENTER";
        t.name = `Sample · ${s.name}`;
        sw.appendChild(t);
        // 스타일 적용은 append 후 (실패해도 샘플 글자는 남는다)
        t.setTextStyleIdAsync(s.id).catch(() => {});
      },
    });
  }
  docs.push(
    await renderDoc({
      title: "Typography",
      desc: "role 기반 텍스트 스타일입니다. 화면에서는 크기를 직접 지정하지 않고 이 스타일을 씁니다.",
      note: NOTE.type,
      items,
      semanticColorGrouping: false,
      x: nextX(),
    }),
  );
}

// ── 6) Shadow ──────────────────────────────────────────────────────────
if (ONLY === "all" || ONLY === "shadow") {
  const styles = await figma.getLocalEffectStylesAsync();
  const items = [];
  for (const s of styles) {
    const shadows = (s.effects || []).filter((e) => e.type === "DROP_SHADOW");
    const first = shadows[0];
    items.push({
      name: s.name,
      value: first
        ? `y${first.offset ? first.offset.y : 0} · blur ${first.radius}`
        : "(drop shadow 없음)",
      render: (sw) => {
        sw.clipsContent = false;
        const r = rect(
          `Card · ${s.name}`,
          16,
          8,
          SWATCH_W - 32,
          SWATCH_H - 16,
          10,
          sw,
        );
        r.fills = [solid(C_BG)];
        r.setEffectStyleIdAsync(s.id).catch(() => {});
      },
    });
  }
  docs.push(
    await renderDoc({
      title: "Shadow",
      desc: "이펙트 스타일입니다. 화면에서 그림자를 직접 그리지 않고 이 스타일을 씁니다.",
      note: NOTE.shadow,
      items,
      semanticColorGrouping: false,
      x: nextX(),
    }),
  );
}

return {
  page: PAGE_NAME,
  font: FAMILY,
  removed_frames: removed,
  only: ONLY,
  docs,
};
