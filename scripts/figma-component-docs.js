/**
 * figma-component-docs.js
 *
 * ⚠️ 이 파일은 Node.js로 실행하지 않는다. (top-level await/return 사용)
 *    figma-builder가 Read 한 뒤 `use_figma` 의 code 파라미터로 그대로 주입하는 스크립트다.
 *    실행 환경은 Figma Plugin API 샌드박스이며, 반환값(JSON)은 실행 요약이다.
 *
 * 무엇을 하나:
 *    `02 Components` 페이지의 컴포넌트(세트·단일)를 읽어 `02b Component Docs` 페이지에
 *    카테고리별 문서 프레임을 그린다. 문서 1장 = 카테고리 1개, 카드 1장 = 컴포넌트 1개.
 *    카드 안에는 variant 속성마다 "Case" (속성값 칩 + 그 값만 바꾼 인스턴스 가로 나열) 가 있다.
 *
 *    **원본 컴포넌트는 옮기지 않는다.** 문서에는 인스턴스만 놓는다.
 *    (검증 스크립트 figma-snapshot / check-layout 은 `02 Components` 최상위에 세트가 있다는
 *     전제로 판정한다 — 세트를 카드 안으로 옮기면 게이트 4 가 어긋난다)
 *
 * 왜 파일로 고정했나:
 *    figma-token-docs.js 와 같은 처방이다 — 즉흥 작성 금지, 파일 하나로 고정.
 *    레이아웃 계약의 SSOT 는 docs/component-docs-spec.md 다. 둘 중 하나만 고치지 말 것.
 *
 * ── 사용법 (figma-builder · STAGE=components · lint 0건 이후) ────────────
 *   1. Read scripts/figma-component-docs.js
 *   2. 상단 CONFIG 치환:
 *        __PAGE_NAME__      → "02b Component Docs"
 *        __SOURCE_PAGE__    → "02 Components"
 *        __PROJECT_LABEL__  → 문서 상단 좌측 라벨 (예: "BETA DESIGN SYSTEM")
 *        __DOC_DATE__       → 문서 상단 우측 날짜 (예: "SEP 20, 2026")
 *        __ONLY__           → 보통 치환하지 않는다. 한 번에 다 못 그릴 때만 카테고리 키
 *                             (action|input|navigation|overlay|content|feedback|icon|layout|other)
 *   3. use_figma 로 실행 (skillNames 에 figma-use 포함)
 *   4. 반환된 summary 를 build-log 에 적고 get_screenshot 1회로 확인한다.
 *      이 페이지는 스냅샷을 뽑지 않는다 (문서 페이지 · 제품 UI 가 아니다).
 *
 * ── 멱등성 ──────────────────────────────────────────────────────────────
 *   실행 시 기존 `Component Documentation — *` 프레임을 먼저 지운다.
 *   컴포넌트를 고친 뒤 다시 돌리면 문서가 항상 현재 상태와 일치한다.
 *   (__ONLY__ 로 쪼개 실행하면 그 카테고리 문서만 지우고 다시 그린다)
 *
 * ── 제약 (figma-use SKILL.md) ───────────────────────────────────────────
 *   · 호출당 setCurrentPageAsync 는 1회만 → 문서 페이지로 이동하고, 원본 페이지는 loadAsync 로만 읽는다.
 *   · console.log 는 전달되지 않는다. 결과는 반드시 return.
 *   · async IIFE 로 감싸지 않는다 (자동 래핑됨).
 */

// ==================== CONFIG (figma-builder가 치환) ====================

const PAGE_NAME = "__PAGE_NAME__";
const SOURCE_PAGE = "__SOURCE_PAGE__";
const PROJECT_LABEL = "__PROJECT_LABEL__";
const DOC_DATE = "__DOC_DATE__";

const ONLY_RAW = "__ONLY__";

// ==================== 카테고리 (docs/component-docs-spec.md §1) ====================

// 순서가 곧 캔버스 배치 순서다. 컴포넌트 이름(슬래시 앞 첫 조각)으로 매칭한다.
const CATEGORIES = [
  {
    key: "action",
    label: "Action",
    desc: "사용자가 누르는 것. 주 행동·보조 행동·아이콘 버튼.",
    match:
      /^(Button|IconButton|BottomCTA|BottomActionBar|Chip|Toggle|Switch|Checkbox|Radio)$/i,
  },
  {
    key: "input",
    label: "Input",
    desc: "값을 넣는 것. 텍스트 입력·선택·검색.",
    match: /^(Input|TextField|Select|SearchBar|Textarea|Slider|Stepper)$/i,
  },
  {
    key: "navigation",
    label: "Navigation",
    desc: "화면 사이를 오가는 것. 앱바·탭바·세그먼트.",
    match: /^(AppBar|TabBar|Tabs|SegmentedControl|Breadcrumb|Pagination)$/i,
  },
  {
    key: "overlay",
    label: "Overlay",
    desc: "화면 위에 뜨는 것. 바텀시트·다이얼로그·토스트.",
    match: /^(BottomSheet|Dialog|Modal|Toast|Snackbar|Tooltip|Popover)$/i,
  },
  {
    key: "content",
    label: "Content",
    desc: "정보를 담는 것. 카드·리스트 아이템·배지·아바타.",
    match:
      /^(Card|.*Card|ListItem|Badge|Tag|Avatar|Divider|Thumbnail|Banner)$/i,
  },
  {
    key: "feedback",
    label: "Feedback",
    desc: "상태를 알리는 것. 빈 화면·로딩·에러.",
    match: /^(EmptyState|Skeleton|ErrorState|Spinner|ProgressBar|Loading)$/i,
  },
  {
    key: "icon",
    label: "Icon",
    desc: "lucide 아이콘. 이름이 곧 CDN 주소다.",
    match: /^Icon$/i,
  },
  {
    key: "layout",
    label: "Layout",
    desc: "화면의 틀. 디바이스 프레임·상태바·세이프에어리어.",
    match: /^(DeviceFrame|StatusBar|HomeIndicator|SafeArea)$/i,
  },
  {
    key: "other",
    label: "기타",
    desc: "위 카테고리에 안 들어간 컴포넌트. 이름을 고치거나 spec 의 표에 추가한다.",
    match: /^$/,
  },
];
const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
const ONLY = CATEGORY_KEYS.indexOf(ONLY_RAW) >= 0 ? ONLY_RAW : "all";

// ==================== 레이아웃 상수 (docs/component-docs-spec.md) ====================

const DOC_W = 1280;
const DOC_GAP = 120;
const PAD_X = 64;

const CARD_PAD = 32;
const CARD_GAP = 24; // 카드 내부 블록 간격
const CASE_PAD = 24;
const CASE_GAP = 16;
const CHIP_GAP = 8;
const INSTANCE_GAP = 24;

// 문서 크롬 색 (제품 토큰이 아니다 — spec §5 예외 규정 · token-docs 와 같은 팔레트)
const C_BG = { r: 1, g: 1, b: 1 };
const C_PANEL = { r: 0.965, g: 0.965, b: 0.969 }; // #F6F6F7
const C_LINE = { r: 0.898, g: 0.906, b: 0.922 }; // #E5E7EB
const C_TEXT = { r: 0.067, g: 0.094, b: 0.153 }; // #111827
const C_MUTED = { r: 0.42, g: 0.447, b: 0.502 }; // #6B7280
const C_FAINT = { r: 0.612, g: 0.639, b: 0.686 }; // #9CA3AF
const C_CHIP = { r: 0.933, g: 0.937, b: 0.945 }; // #EEEFF1
const C_LINK = { r: 0.239, g: 0.353, b: 0.996 }; // #3D5AFE

// ==================== 폰트 ====================

const FONT_CANDIDATES = ["Pretendard", "Inter"];
const WEIGHT = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold" };
const MONO_CANDIDATES = ["JetBrains Mono", "Roboto Mono", "Menlo"];

let FAMILY = null;
let MONO = null;

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

// 칩 글꼴. 모노가 없으면 본문 글꼴로 대체한다 (실패 사유가 아니다).
async function pickMono() {
  for (const family of MONO_CANDIDATES) {
    try {
      await figma.loadFontAsync({ family, style: "Regular" });
      return family;
    } catch (e) {
      // 다음 후보로
    }
  }
  return null;
}

// ==================== 노드 유틸 (전부 오토레이아웃 · 세로 HUG) ====================

function solid(color) {
  return { type: "SOLID", color, opacity: 1 };
}

/**
 * 오토레이아웃 프레임. 세로는 항상 HUG.
 * width 가 숫자면 가로 고정, "FILL" 이면 부모 폭을 채운다 (부모가 오토레이아웃일 때만 유효).
 * ⚠️ resize 는 sizing 모드 지정 **전에** 부른다 — 뒤에 부르면 HUG 가 FIXED 로 풀린다.
 */
function stack(name, direction, width, pad, gap, parent) {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.clipsContent = false;
  f.layoutMode = direction;
  if (typeof width === "number") f.resize(width, 1);
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = pad;
  f.itemSpacing = gap;
  if (parent) parent.appendChild(f);
  if (direction === "VERTICAL") {
    f.primaryAxisSizingMode = "AUTO"; // 세로 = 내용
    f.counterAxisSizingMode = "FIXED"; // 가로 = 지정
  } else {
    f.counterAxisSizingMode = "AUTO"; // 세로 = 내용
    f.primaryAxisSizingMode = typeof width === "number" ? "FIXED" : "AUTO";
  }
  if (parent && width === "FILL") f.layoutSizingHorizontal = "FILL";
  if (parent && width === "HUG") f.layoutSizingHorizontal = "HUG";
  return f;
}

function text(str, size, weight, color, parent, opts) {
  const o = opts || {};
  const t = figma.createText();
  t.fontName = {
    family: o.mono && MONO ? MONO : FAMILY,
    style: o.mono && MONO ? "Regular" : WEIGHT[weight],
  };
  t.characters = String(str);
  t.fontSize = size;
  t.fills = [solid(color)];
  t.textAutoResize = o.autoWidth ? "WIDTH_AND_HEIGHT" : "HEIGHT";
  if (o.align) t.textAlignHorizontal = o.align;
  if (parent) parent.appendChild(t);
  if (parent && !o.autoWidth) t.layoutSizingHorizontal = "FILL";
  return t;
}

function chip(label, parent, mono) {
  const c = stack(`Chip · ${label}`, "HORIZONTAL", "HUG", 0, 0, parent);
  c.paddingTop = c.paddingBottom = 4;
  c.paddingLeft = c.paddingRight = 10;
  c.fills = [solid(C_CHIP)];
  c.cornerRadius = 6;
  text(label, 12, 500, C_MUTED, c, { autoWidth: true, mono });
  return c;
}

// ==================== 컴포넌트 수집 ====================

function baseNameOf(node) {
  // "Icon/home" → "Icon", "Button" → "Button", "Card/Destination" → "Card"
  return String(node.name || "")
    .split("/")[0]
    .trim();
}

function categoryOf(node) {
  const base = baseNameOf(node);
  for (const c of CATEGORIES) {
    if (c.key === "other") continue;
    if (c.match.test(base)) return c.key;
  }
  return "other";
}

/**
 * variant 속성 정의 → [{ name, options[], defaultValue }]
 * BOOLEAN/TEXT/INSTANCE_SWAP 속성은 문서화하지 않는다 (인스턴스 시연은 variant 축만).
 */
function variantPropsOf(set) {
  const out = [];
  let defs = {};
  try {
    defs = set.componentPropertyDefinitions || {};
  } catch (e) {
    return out;
  }
  for (const name of Object.keys(defs)) {
    const d = defs[name];
    if (!d || d.type !== "VARIANT") continue;
    out.push({
      name,
      options: (d.variantOptions || []).slice(),
      defaultValue: d.defaultValue,
    });
  }
  return out;
}

// ==================== 카드 렌더러 ====================

/**
 * 컴포넌트 1개 → 카드 1장.
 * node: COMPONENT_SET | COMPONENT (원본 페이지 최상위)
 */
function renderCard(node, parent, summary) {
  const isSet = node.type === "COMPONENT_SET";
  const card = stack(node.name, "VERTICAL", "FILL", CARD_PAD, CARD_GAP, parent);
  card.fills = [solid(C_BG)];
  card.strokes = [solid(C_LINE)];
  card.strokeWeight = 1;
  card.cornerRadius = 16;

  // ── Heading ──
  const heading = stack("Heading", "VERTICAL", "FILL", 0, 8, card);
  text(node.name, 24, 700, C_TEXT, heading);

  const props = isSet ? variantPropsOf(node) : [];
  const variantCount = isSet ? node.children.length : 1;
  // MCP 호스트는 타입에 없는 속성을 읽으면 throw 한다 — 설명은 안전하게 읽는다
  let description = "";
  try {
    description = String(node.description || "").trim();
  } catch (e) {
    description = "";
  }
  const desc =
    description ||
    (isSet
      ? `variant ${variantCount}개 · 속성: ${props.map((p) => p.name).join(", ") || "(없음)"}`
      : "단일 컴포넌트 (variant 없음)");
  text(desc, 15, 400, C_MUTED, heading);

  // 원본으로 가는 링크 (Figma 텍스트 하이퍼링크 · 노드 점프)
  const link = text(
    `원본 보기 → ${SOURCE_PAGE} › ${node.name}`,
    13,
    500,
    C_LINK,
    heading,
    {
      autoWidth: true,
    },
  );
  try {
    link.hyperlink = { type: "NODE", value: node.id };
  } catch (e) {
    // 링크 실패는 문서 결함이 아니다
  }

  // ── Content 패널 ──
  const panel = stack("Content", "VERTICAL", "FILL", CASE_PAD, CASE_GAP, card);
  panel.fills = [solid(C_PANEL)];
  panel.cornerRadius = 12;

  const cardSummary = {
    name: node.name,
    type: node.type,
    cases: [],
    missing: [],
  };

  const master = isSet ? node.defaultVariant || node.children[0] : node;
  const defaults = {};
  if (isSet) {
    for (const p of props) defaults[p.name] = p.defaultValue;
  }

  if (!isSet || props.length === 0) {
    // Case 1개: 기본 모습
    const c = stack(
      "Case · default",
      "VERTICAL",
      "FILL",
      CASE_PAD,
      CASE_GAP,
      panel,
    );
    c.fills = [solid(C_BG)];
    c.cornerRadius = 12;
    const row = stack("Content", "HORIZONTAL", "FILL", 0, INSTANCE_GAP, c);
    row.layoutWrap = "WRAP";
    row.counterAxisSpacing = INSTANCE_GAP;
    try {
      row.appendChild(master.createInstance());
      cardSummary.cases.push({ prop: "default", shown: 1 });
    } catch (e) {
      cardSummary.missing.push(`default: ${e.message}`);
    }
  } else {
    // 속성마다 Case 1개: 그 속성만 바꾸고 나머지는 기본값
    for (const p of props) {
      const c = stack(
        `Case · ${p.name}`,
        "VERTICAL",
        "FILL",
        CASE_PAD,
        CASE_GAP,
        panel,
      );
      c.fills = [solid(C_BG)];
      c.cornerRadius = 12;

      const head = stack("Heading", "HORIZONTAL", "FILL", 0, CHIP_GAP, c);
      head.layoutWrap = "WRAP";
      head.counterAxisSpacing = CHIP_GAP;
      head.counterAxisAlignItems = "CENTER";
      text(`${p.name.toLowerCase()} =`, 13, 500, C_MUTED, head, {
        autoWidth: true,
      });
      for (const opt of p.options) chip(String(opt).toLowerCase(), head, true);

      const row = stack("Content", "HORIZONTAL", "FILL", 0, INSTANCE_GAP, c);
      row.layoutWrap = "WRAP";
      row.counterAxisSpacing = INSTANCE_GAP;
      row.counterAxisAlignItems = "CENTER";

      let shown = 0;
      for (const opt of p.options) {
        const want = Object.assign({}, defaults);
        want[p.name] = opt;
        try {
          const inst = master.createInstance();
          inst.setProperties(want);
          inst.name = `${node.name} · ${p.name}=${opt}`;
          row.appendChild(inst);
          shown += 1;
        } catch (e) {
          cardSummary.missing.push(`${p.name}=${opt}: ${e.message}`);
        }
      }
      cardSummary.cases.push({
        prop: p.name,
        options: p.options.length,
        shown,
      });
    }
  }

  summary.push(cardSummary);
  return card;
}

// ==================== 문서 렌더러 (카테고리 1개 = 문서 1장) ====================

function renderDoc(cat, nodes, x) {
  const doc = stack(
    `Component Documentation — ${cat.label}`,
    "VERTICAL",
    DOC_W,
    0,
    0,
    figma.currentPage,
  );
  doc.x = x;
  doc.y = 0;
  doc.fills = [solid(C_BG)];
  doc.clipsContent = true;

  // _Status
  const status = stack("_Status", "HORIZONTAL", "FILL", 0, 0, doc);
  status.paddingLeft = status.paddingRight = 32;
  status.paddingTop = status.paddingBottom = 23.5;
  status.primaryAxisAlignItems = "SPACE_BETWEEN";
  const pl = text(PROJECT_LABEL, 11, 600, C_TEXT, status, { autoWidth: true });
  pl.letterSpacing = { unit: "PERCENT", value: 8 };
  text(DOC_DATE, 11, 600, C_FAINT, status, { autoWidth: true });

  // Title
  const title = stack("Title", "VERTICAL", "FILL", 0, 12, doc);
  title.paddingLeft = title.paddingRight = PAD_X;
  title.paddingTop = 56;
  title.paddingBottom = 48;
  text(cat.label, 32, 700, C_TEXT, title);
  text(cat.desc, 15, 400, C_MUTED, title);
  text(
    `컴포넌트 ${nodes.length}개 · 원본은 ${SOURCE_PAGE} 페이지. 이 문서의 것은 전부 인스턴스다.`,
    13,
    400,
    C_FAINT,
    title,
  );

  // Cards
  const list = stack("Cards", "VERTICAL", "FILL", 0, 32, doc);
  list.paddingLeft = list.paddingRight = PAD_X;
  list.paddingBottom = 64;
  list.strokes = [solid(C_LINE)];
  list.strokeTopWeight = 1;
  list.strokeBottomWeight = list.strokeLeftWeight = list.strokeRightWeight = 0;
  list.paddingTop = 33;

  const cards = [];
  for (const n of nodes) renderCard(n, list, cards);

  return { name: doc.name, id: doc.id, category: cat.key, cards };
}

// ==================== 실행 ====================

FAMILY = await pickFamily();
MONO = await pickMono();

// 원본 페이지 (읽기만 · 이동하지 않는다)
const source = figma.root.children.find((p) => p.name === SOURCE_PAGE);
if (!source)
  throw new Error(
    `원본 페이지 "${SOURCE_PAGE}" 가 없다. STAGE=components 가 먼저다.`,
  );
await source.loadAsync();

// 문서 페이지 (없으면 만든다 · 이 스크립트가 만드는 유일한 페이지)
let page = figma.root.children.find((p) => p.name === PAGE_NAME);
if (!page) {
  page = figma.createPage();
  page.name = PAGE_NAME;
}
await page.loadAsync();
await figma.setCurrentPageAsync(page);

// 멱등: 기존 문서 프레임 제거 (ONLY 면 그 카테고리만)
let removed = 0;
for (const child of page.children.slice()) {
  if (!/^Component Documentation — /.test(child.name)) continue;
  if (ONLY !== "all") {
    const cat = CATEGORIES.find((c) => c.key === ONLY);
    if (child.name !== `Component Documentation — ${cat.label}`) continue;
  }
  child.remove();
  removed += 1;
}

// 수집: 원본 페이지 최상위의 세트·단일 컴포넌트만 (세트 안의 variant 는 세트로 대표된다)
const byCat = new Map(CATEGORY_KEYS.map((k) => [k, []]));
const skipped = [];
for (const n of source.children) {
  if (n.type !== "COMPONENT_SET" && n.type !== "COMPONENT") {
    if (n.type === "FRAME")
      skipped.push({ name: n.name, reason: "컴포넌트가 아닌 최상위 프레임" });
    continue;
  }
  byCat.get(categoryOf(n)).push(n);
}
for (const list of byCat.values())
  list.sort((a, b) => a.name.localeCompare(b.name));

// 그리기: 카테고리 순서대로 가로 배치. 빈 카테고리는 문서를 만들지 않는다.
const docs = [];
let x = 0;
for (const cat of CATEGORIES) {
  const nodes = byCat.get(cat.key);
  if (nodes.length === 0) continue;
  if (ONLY !== "all" && cat.key !== ONLY) {
    x += DOC_W + DOC_GAP; // 자리는 비워 둔다 (다음 실행에서 채운다)
    continue;
  }
  docs.push(renderDoc(cat, nodes, x));
  x += DOC_W + DOC_GAP;
}

const others = byCat.get("other").map((n) => n.name);

return {
  page: PAGE_NAME,
  source_page: SOURCE_PAGE,
  font: FAMILY,
  mono: MONO,
  only: ONLY,
  removed_frames: removed,
  docs,
  uncategorized: others, // 비어 있어야 정상. 있으면 spec §1 표에 이름을 추가하거나 컴포넌트 이름을 고친다
  skipped,
};
