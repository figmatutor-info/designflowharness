# 컴포넌트 문서 규격 (Component Docs Spec)

`02b Component Docs` 페이지에 그려지는 **컴포넌트 문서 프레임**의 레이아웃 계약이다.
사람이 읽는 SSOT 이고, 이 규격을 구현한 것이 `scripts/figma-component-docs.js` 다.
둘 중 하나만 고치지 말 것.

> **왜 별도 페이지인가**
> `02 Components` 는 검증 입력이다. `figma-snapshot.js` 는 그 페이지의 최상위
> FRAME / COMPONENT / COMPONENT_SET 만 추출하고, `check-layout.mjs` 는 세트가 최상위에
> 있다는 전제로 variant 면제를 판정한다. 세트를 문서 카드 안으로 옮기면 게이트 4 가 어긋난다.
> 그래서 **원본은 `02 Components` 에 그대로 두고, 문서 페이지에는 인스턴스만 놓는다.**
> 문서 페이지는 제품 UI 가 아니므로 스냅샷·check-layout 대상이 아니다 (`01 Tokens` 와 같은 취급).

---

## 1. 카테고리 (문서 1장 = 카테고리 1개)

컴포넌트 이름의 **슬래시 앞 첫 조각**으로 매칭한다 (`Icon/home` → `Icon`, `Card/Destination` → `Card`).
순서가 곧 캔버스 배치 순서다. 컴포넌트가 없는 카테고리는 문서를 만들지 않는다.

| 순서 | key          | 라벨       | 들어가는 컴포넌트 이름                                                                |
| ---- | ------------ | ---------- | ------------------------------------------------------------------------------------- |
| 1    | `action`     | Action     | Button, IconButton, BottomCTA, BottomActionBar, Chip, Toggle, Switch, Checkbox, Radio |
| 2    | `input`      | Input      | Input, TextField, Select, SearchBar, Textarea, Slider, Stepper                        |
| 3    | `navigation` | Navigation | AppBar, TabBar, Tabs, SegmentedControl, Breadcrumb, Pagination                        |
| 4    | `overlay`    | Overlay    | BottomSheet, Dialog, Modal, Toast, Snackbar, Tooltip, Popover                         |
| 5    | `content`    | Content    | Card, `*Card`, ListItem, Badge, Tag, Avatar, Divider, Thumbnail, Banner               |
| 6    | `feedback`   | Feedback   | EmptyState, Skeleton, ErrorState, Spinner, ProgressBar, Loading                       |
| 7    | `icon`       | Icon       | `Icon/*`                                                                              |
| 8    | `layout`     | Layout     | DeviceFrame, StatusBar, HomeIndicator, SafeArea                                       |
| 9    | `other`      | 기타       | 위에 없는 전부. **비어 있어야 정상.**                                                 |

`other` 에 무언가 들어가면 스크립트 반환값 `uncategorized` 에 이름이 뜬다.
이 표(와 스크립트의 `CATEGORIES`)에 이름을 추가하거나, design-rules.md 의 컴포넌트 이름을 고친다.
화면 전용 컴포넌트(`DestinationCard` 등)는 `*Card` 규칙으로 Content 에 들어간다.

프레임은 캔버스에 가로로 나란히 놓는다. x = `i × 1400`, y = `0` (i 는 비어 있지 않은 카테고리 순번).

---

## 2. 문서 프레임 구조 (전부 오토레이아웃 · 세로 HUG)

```
Component Documentation — {라벨}       1280 wide · 세로 스택 · bg #FFFFFF
├─ _Status                              가로 · SPACE_BETWEEN · 패딩 32/23.5
│   ├─ text  프로젝트 라벨 (대문자, 11/600, 자간 +8%)
│   └─ text  날짜 (SEP 20, 2026 형식)  11/600 faint
├─ Title                                세로 · 패딩 64 좌우 · 56 상 · 48 하
│   ├─ text  카테고리 라벨               32/700
│   ├─ text  카테고리 설명               15/400  muted
│   └─ text  "컴포넌트 N개 · 원본은 …"   13/400  faint
└─ Cards                                세로 · 패딩 64 좌우 · 33 상 · 64 하 · 상단 1px 헤어라인 · 간격 32
    └─ {컴포넌트명}  (카드 · 컴포넌트 수만큼)
```

높이는 숫자로 정하지 않는다. 내용이 정한다 (하네스 원칙과 같다).

---

## 3. 카드 (카드 1장 = 컴포넌트 1개)

참고: 카드 헤더 → 회색 본문 패널 → 속성별 Case 카드 구조는 사용자가 지정한
참고 파일(Pagination 문서 카드)의 패턴을 따른다. Resource(내부 원자 부품) 단은 하네스에
해당 개념이 없어 만들지 않는다.

```
{컴포넌트명}                            FILL · 세로 · 패딩 32 · 간격 24 · bg #FFFFFF · border 1px #E5E7EB · radius 16
├─ Heading                              세로 · 간격 8
│   ├─ text  컴포넌트명                  24/700
│   ├─ text  설명                        15/400 muted
│   │        (컴포넌트 description 이 있으면 그것 · 없으면 "variant N개 · 속성: Size, Variant")
│   └─ text  "원본 보기 → 02 Components › {이름}"   13/500 link · 텍스트 하이퍼링크(NODE) 로 원본 세트에 점프
└─ Content                              세로 · 패딩 24 · 간격 16 · bg #F6F6F7 · radius 12
    └─ Case · {속성명}  (variant 속성 수만큼 · 속성 없으면 "Case · default" 1개)
        │                               세로 · 패딩 24 · 간격 16 · bg #FFFFFF · radius 12
        ├─ Heading                      가로 · WRAP · 간격 8 · 세로 중앙
        │   ├─ text  "{속성명 소문자} ="  13/500 muted
        │   └─ Chip · {값}  (값 수만큼)   모노 12/500 · bg #EEEFF1 · 패딩 4/10 · radius 6
        └─ Content                      가로 · WRAP · 간격 24 · 세로 중앙
            └─ 인스턴스  (값 수만큼 · 그 속성만 바꾸고 나머지는 기본값 · 칩과 같은 순서)
```

### Case 규칙

- variant 속성(`Size`, `Variant`, `State` …) **하나당 Case 1개**. 축을 섞어 조합표를 만들지 않는다.
- Case 안의 인스턴스는 그 속성만 바꾼다. 나머지 속성은 세트의 기본값(`defaultVariant`).
- 조합이 세트에 없어 `setProperties` 가 실패하면 그 인스턴스는 빠지고 반환값 `missing` 에 남는다.
  (세트에 빠진 조합이 있다는 뜻 — design-rules.md 의 variant 표와 대조한다)
- BOOLEAN / TEXT / INSTANCE_SWAP 속성은 시연하지 않는다. variant 축만.
- 인스턴스 이름은 `{컴포넌트명} · {속성}={값}`.
- 단일 COMPONENT 는 `Case · default` 하나에 인스턴스 1개.

---

## 4. 이름 규칙

| 노드        | 이름                                                          |
| ----------- | ------------------------------------------------------------- |
| 문서 프레임 | `Component Documentation — {라벨}`                            |
| 카드        | `{컴포넌트명}` (원본과 같은 이름)                             |
| 구조 프레임 | `_Status` `Title` `Cards` `Heading` `Content` (템플릿 공통명) |
| 속성 시연   | `Case · {속성명}` / `Case · default`                          |
| 값 칩       | `Chip · {값}`                                                 |

`Component Documentation — ` 접두는 멱등 삭제의 열쇠다. 문서 페이지에 이 접두로 다른 것을 만들지 않는다.

---

## 5. 예외 규정 — 문서 크롬은 제품 토큰이 아니다

카드 배경·헤어라인·칩·글자색은 위의 고정값(#FFFFFF · #E5E7EB · #F6F6F7 · #EEEFF1 · #111827 · #6B7280 · #9CA3AF · #3D5AFE)을 쓴다.
`token-docs-spec.md §5` 와 같은 근거다 — 문서 프레임은 제품 UI 가 아니고, 문서가 프로젝트 semantic
토큰 이름에 의존하면 토큰 이름이 다른 프로젝트에서 문서가 깨진다.
**카드 안의 인스턴스는 원본 그대로**이므로 제품 토큰은 원본(`02 Components`)에서 검증된다.

폰트: 본문 `Pretendard` → 없으면 `Inter`. 칩은 `JetBrains Mono` → `Roboto Mono` → `Menlo` → 없으면 본문 글꼴.

---

## 6. 검증

이 페이지는 스냅샷을 뽑지 않는다. 확인은 두 가지로 한다.

1. 스크립트 반환값: `uncategorized` 가 비어 있고, 각 카드의 `missing` 이 비어 있는지.
   → build-log 의 `### component-docs` 항목에 요약을 적는다.
2. `get_screenshot` 1회 (내부용): 칩과 인스턴스가 같은 순서인지, 카드가 내용을 감싸는지.

`check-layout.mjs` 는 이 페이지를 건너뛴다 (`SKIP_PAGES`). 실수로 스냅샷에 들어와도 판정하지 않는다.
