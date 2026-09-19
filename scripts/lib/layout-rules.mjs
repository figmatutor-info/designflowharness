/**
 * scripts/lib/layout-rules.mjs — 레이아웃 거동 · design-rules.md 파서의 SSOT (로컬 .mjs 용).
 *
 * check-layout.mjs 와 figma-audit.mjs 가 각각 갖고 있던 Height 선언 파서, 면제 정규식,
 * 컨테이너 타입, 넘침 계산, image-slots 파서를 한 곳으로 모았다.
 *
 * ⚠️ scripts/figma-lint.js (Figma 샌드박스 실행) 는 import 를 못 써서 BUILTIN_EXEMPT ·
 *    CONTAINER_TYPES · TOLERANCE · 넘침 계산의 복제본을 갖는다. 여기를 바꾸면 그쪽도 함께 바꾼다.
 */

// 하네스가 늘 면제하는 것들. 프로젝트별 예외는 여기 말고 design-rules.md 에 적는다.
//   · DeviceFrame/상태바/홈 인디케이터: 기기 물리 치수
//   · Img/ 슬롯: 이미지 비율이 곧 높이
//   · Icon/: 아이콘은 정사각 고정
//   · Divider/Spacer/Track: 선·여백·바 자체가 높이다
export const BUILTIN_EXEMPT =
  /^(DeviceFrame|Status ?Bar|Home ?Indicator|Safe ?Area|Divider|Spacer|Track|Img\/|Icon\/)/i;

// 컨테이너로 볼 타입 (고정 높이 검사 대상)
export const CONTAINER_TYPES = new Set(["FRAME", "COMPONENT", "COMPONENT_SET"]);

// 넘침 허용 오차(px). 1px 반올림과 스트로크 때문에 0 으로 두면 오탐이 난다.
export const TOLERANCE = 1;

// 스냅샷의 node.layout / node.parentId 는 schema_version 3 부터 들어온다.
export const LAYOUT_MIN_SCHEMA = 3;

/**
 * design-rules.md 컴포넌트 규칙의 `### 이름` 아래 `- Height: hug|fixed(...)` 선언을 읽는다.
 * "SearchBar / FilterChip / Tab" 처럼 한 헤딩에 여러 개를 적는 경우도 각각 등록한다.
 * @returns {Map<string, "hug"|"fixed">}
 */
export function parseHeightDecl(rulesText) {
  const map = new Map();
  if (!rulesText) return map;

  let current = null;
  for (const line of rulesText.split("\n")) {
    const heading = line.match(/^###\s+(.+?)\s*(?:\(|$)/);
    if (heading) {
      current = heading[1]
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }
    if (!current) continue;

    const m = line.match(/^[-*]\s*Height\s*:\s*(hug|fixed)/i);
    if (m) {
      for (const name of current) map.set(name, m[1].toLowerCase());
    }
  }
  return map;
}

/** parseHeightDecl 결과에서 fixed 로 선언된 컴포넌트 이름만 */
export function fixedComponentsOf(heightDecl) {
  return [...heightDecl.entries()]
    .filter(([, v]) => v === "fixed")
    .map(([k]) => k);
}

/**
 * 스냅샷 노드에서 컴포넌트 이름을 뽑는다.
 *   "MarketCard"                  → MarketCard
 *   "Button/Variant=primary"      → Button
 *   "MissionCard · 제목"          → MissionCard
 * 인스턴스는 mainComponent 이름을 우선한다.
 */
export function componentNameOf(node) {
  const base = String(node.mainComponent || node.name || "");
  return base.split(/[/·,]/)[0].trim();
}

/**
 * 자식이 부모 안쪽(padding 제외) 밖으로 나가는지. 아래/오른쪽만 본다.
 * 판정 불가(좌표·크기 없음)면 null, 넘침 없으면 { overBottom, overRight } 가 전부 TOLERANCE 이하.
 */
export function overflowOf(node, parent) {
  if (!parent || !node.position || !node.size) return null;
  if (!parent.position || !parent.size) return null;

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
  return {
    overBottom,
    overRight,
    exceeded: overBottom > TOLERANCE || overRight > TOLERANCE,
  };
}

/** overflowOf 결과를 "아래로 3px / 오른쪽으로 2px" 식으로 */
export function describeOverflow(o, { suffix = "로" } = {}) {
  const parts = [];
  if (o.overBottom > TOLERANCE) parts.push(`아래${suffix} ${o.overBottom}px`);
  if (o.overRight > TOLERANCE) parts.push(`오른쪽${suffix} ${o.overRight}px`);
  return parts.join(" / ");
}

// ==================== design-rules §I 이미지 선언 ====================

// image-library 선언이 없을 때의 기본 라이브러리 (CLAUDE.md · check-assets · check-phase 공통)
export const DEFAULT_IMAGE_LIBRARY = "design/assets/characters";

/**
 * design-rules.md §I 의 `image-slots:` / `image-library:` 선언.
 *   policy  : "used" | "none"  (none 이면 이미지를 쓰지 않는 프로젝트)
 *   library : 이미지를 고르는 유일한 폴더
 */
export function parseImageSlots(rulesText) {
  const text = rulesText || "";
  const policy = text.match(/^\s*image-slots:\s*(used|none)\s*$/m);
  const lib = text.match(/^\s*image-library:\s*(\S+)\s*$/m);
  return {
    policy: policy ? policy[1] : "used",
    library: lib ? lib[1].replace(/`/g, "") : DEFAULT_IMAGE_LIBRARY,
  };
}
