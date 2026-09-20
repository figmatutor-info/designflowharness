# figma-builder · STAGE=screens 절차

> 이 문서는 `.claude/agents/figma-builder.md` 의 공통 규칙(절대 원칙 · 시간 예산 · 입력 확인 ·
> MCP 프로토콜 · ⭐ Snapshot 요청 공통 절차 · 금지 사항) 위에서 실행되는 STAGE 절차다.
> 공통 규칙을 건너뛰고 이 문서만으로 시작하지 않는다. 읽었으면 build-log 에
> `stage-doc: docs/figma-builder/stage-screens.md` 를 적는다.
>
> 대상 페이지: `03 Screens`

---

## STAGE=screens

**대상 페이지:** `03 Screens`

**핵심:** 각 화면 완성 즉시 사용자에게 스크린샷 전달.
이때 스크린샷은 **이미지까지 채워진 완성본**이어야 한다.

### 사전 확인

```bash
node scripts/check-assets.mjs
```

FAIL 이면 screens 를 시작하지 않는다. 출력이 가리키는 대로 design-rules.md §I 표나
`image-library` 폴더가 고쳐져야 한다 — **이미지를 만들어서 해결하지 않는다.** 사용자에게 보고한다.
(`image-slots: none` 프로젝트면 이 스크립트가 "해당 없음"으로 통과시킨다.
그 경우 아래 이미지 관련 절차는 전부 건너뛴다)

design-rules.md §I 를 Read 해서 두 가지를 손에 쥐고 시작한다:

- `image-library:` 폴더 (없으면 `design/assets/characters`)
- "화면별 슬롯 계획" 표 → 슬롯마다 `슬롯 key / 화면 / role / 비율 / 파일`
  이 표가 **유일한 이미지 계약**이다. 표에 없는 슬롯은 만들지 않고, 표의 파일 외에는 넣지 않는다.

### 절차

screens.md와 screen-contract.json의 화면/필수 상태 순서대로 순차 생성.
`docs/ui-quality.md`의 텍스트 폭·배지·스크롤 규칙을 적용한다.
실제 주 행동 노드에 `setSharedPluginData("harness", "harnessAction", action.id)` (MCP 호스트는 setPluginData 미지원)를 호출한다.
검수 전에는 `docs/capture-protocol.md` 순서로 동결 캡처하고 스크린샷을 다시 내보낸다.

각 화면마다:

1. use_figma로 화면 프레임 생성 (390×844)
2. DeviceFrame 컴포넌트 안에 배치
3. screens.md의 "필요 컴포넌트" 목록대로 컴포넌트 인스턴스 배치
4. 실제 콘텐츠 채움 (더미 금지):
   - 텍스트: "제주 오션뷰 숙소" 같은 실제 문구
   - 이미지: §I 표에서 `화면` 열이 이 화면인 슬롯만 자리를 잡는다
     (표에 없는 슬롯은 만들지 않는다)

     **A. 화면 직속 슬롯** (role 이 hero / full-bleed — 컴포넌트 밖에 놓이는 이미지)
     · **RECTANGLE 로 만든다. FRAME 으로 만들지 않는다.**
     단일 이미지 표면에는 RECTANGLE이 적합하다. 복합 구조가 필요하면 컴포넌트를 사용한다.
     재사용률 수치만 맞추려고 필요한 컨테이너 구조를 제거하지 않는다.
     · 이름은 `Img/{슬롯 key}`
     · 크기는 §I 표의 `비율` 열에 맞춘다
     · radius 는 semantic 토큰 바인딩 (`radius-card` 등)
     · **이 시점엔 빈 노드다. 회색 채움을 넣지 않는다**

     **B. 인스턴스 내부 슬롯** (role 이 card / thumb / avatar — 카드 썸네일, 아바타)
     · 새로 만들지 않는다. 배치한 인스턴스가 이미 슬롯을 갖고 있다
     · 마스터에서 `Img/` 로 시작하는 이름의 자식 노드를 찾는다
     · **이름을 바꾸려 하지 않는다.** Figma 가 인스턴스 자식 이름 변경을 막는다

     **C. 두 경우 모두 — node_id 를 확정해 돌려받는다**
     `return placements` → `[{ key: "01-home-hero", node_id: "12:345" }, ...]`
     어떤 노드가 어떤 슬롯인지는 **배치하는 그 순간의 코드가 알고 있다.**
     나중에 이름으로 되찾으려 하지 말고 이때 매핑을 확정한다.
5. **이미지 주입** (아래 "이미지 주입" 절차)
6. **`scripts/figma-lint.js` 실행** — `__PAGE_NAME__` = `03 Screens`, `__FRAME_NAMES__` = 이 화면 프레임 이름
   (방금 만든 화면만 본다 · 수 초). 위반은 그 자리에서 고친다. 스냅샷은 뽑지 않는다
7. `get_screenshot` 1회 (화면 단위) — 이미지 주입·lint **후**에 찍는다
8. **즉시 사용자에게 스크린샷 전달** (하나씩)
9. build-log 갱신

### 이미지 주입

**`figma.createImage` 로 외부 URL 을 가져오지 않는다.** `upload_assets` 를 쓴다.
로컬 파일 바이트를 직접 올리므로 CDN 만료·CORS·네트워크 정책에 영향받지 않는다.

**`upload_assets` 는 imageHash 를 받는 용도로만 쓴다. 슬롯에 넣는 건 플러그인 코드가 한다.**
`upload_assets` 의 `nodeIds` 는 `"123:456"` 단순 id 만 받는데, 인스턴스 내부 슬롯(카드 썸네일)은
`"I68:367;13:103;13:26"` 같은 복합 id 라 거부된다. 실제로 이 때문에 주입이 막힌 적이 있다.
그래서 nodeIds 를 쓰지 않고, 해시를 먼저 받아 `fills` 에 직접 대입한다. 이 방식은 두 경우 모두 통한다.

```
1) 이 화면의 슬롯들을 §I 표에서 고른다 (`화면` 열로 필터) → 슬롯마다 `파일` 열의 파일명
   파일 경로 = {image-library}/{파일} (기본 design/assets/characters/{파일})
   각 슬롯의 node_id 는 4단계 C 에서 돌려받은 placements 에서 가져온다

2) 유니크한 파일 수만큼 업로드 URL 을 받는다 (nodeIds 없이)
   mcp__figma__upload_assets({
     fileKey: "{figma-file-key.txt 의 키}",
     count: {이 화면에 쓰이는 유니크 파일 수}
   })
   → 파일마다 { uploadUrl, imageHash } 가 돌아온다. 순서대로 파일에 대응시킨다

3) 반환된 업로드 URL 각각에 파일 바이트를 POST (Bash)
   curl -sS -X POST --data-binary @design/assets/characters/{파일} \
        -H "Content-Type: image/png" "{업로드 URL}"
   · 업로드 URL 은 1회용이다. 실패하면 upload_assets 부터 다시 부른다
   · Content-Type 을 파일 확장자에 맞춘다 (png → image/png, jpg → image/jpeg)

4) use_figma 로 슬롯마다 fills 를 대입한다 (node_id 는 placements 의 값 그대로)
   const n = await figma.getNodeByIdAsync("{node_id}");   // 복합 id 도 그대로 통한다
   n.fills = [{ type: "IMAGE", imageHash: "{imageHash}", scaleMode: "FILL" }];
   → 슬롯별로 { node_id, fillType: n.fills[0].type } 를 return 해서 전부 "IMAGE" 인지 확인한다
   ⚠️ 인스턴스 내부 노드도 getNodeByIdAsync 로 잡힌다. fill 은 오버라이드로 들어간다
   ⚠️ 같은 파일을 쓰는 슬롯은 같은 imageHash 를 쓴다. 다시 업로드하지 않는다
      (라이브러리 방식에서는 재사용이 기본이다 — 파일 하나가 여러 화면에 들어간다)

5) get_screenshot 으로 실제로 채워졌는지 눈으로 확인한다
   회색으로 남아 있으면 그 슬롯만 4) 부터 다시 한다 (해시는 남아 있다)

6) build-log 의 이 화면 항목에 placements 를 적는다 (STAGE=fix 재주입용 · 매니페스트 파일은 없다)
   placements:
     - 01-home-hero: I68:358;13:17 · buddy-front.png · imageHash …
   ⚠️ 복합 id 를 그대로 적는다. 비우면 재주입 때 노드를 못 찾는다
      (인스턴스 내부 슬롯은 이름이 전부 같아 이름으로 되찾을 수 없다)
```

**한 번에 60개까지** 업로드 URL 을 받을 수 있다. 화면당 유니크 파일은 많아야 6개이므로
화면 단위로 한 번씩 부르면 충분하다. 같은 파일이 여러 화면에 쓰이면 해시를 기억해 두고 재사용한다.

### 스크린샷 저장

`design/04-screens/screenshots/{번호}-{화면이름}.png`

예:

- 01-home.png
- 02-search-results.png
- 03-detail.png
- 04-booking.png
- 05-mypage.png

### 화면 상태 처리

screens.md의 "필요 상태" 항목:

- default: 기본 화면
- loading: 로딩 스켈레톤
- empty: 빈 상태
- error: 에러 상태

**규칙:**

- default는 반드시 생성
- screen-contract.json의 required 상태는 전부 생성; 제외 상태는 계약에 이유 기록
- 각 상태마다 별도 프레임 (같은 페이지에 나열)

### 화면 규칙 검증

각 화면 생성 시 확인. **lint 가 잡는 것**(스냅샷 없이 즉시)과 **생성 코드가 스스로 확인할 것**으로 나눈다.

`figma-lint.js` (`__FRAME_NAMES__` 에 이 화면만) 가 잡는다:

- 모든 fill/stroke 가 **semantic 컬렉션** 변수에 바인딩 (primitive 직접 바인딩 0개)
  · `Img/*` 슬롯의 IMAGE fill 은 예외다. 이미지에는 색 변수를 바인딩하지 않는다
  (figma-audit.mjs 의 팔레트 검사도 `type === "SOLID"` 만 본다)
- 모든 텍스트가 Text/\* 스타일, textAutoResize 가 NONE 이 아님
- 컨테이너 HUG · 오토레이아웃 · 넘침

생성 코드의 `return` 값으로 직접 확인한다 (lint 범위 밖):

- 프레임 크기 정확히 390×844
- safe-area 침범 없음 (상단 44, 하단 34)
- 주 행동의 실제 탭 대상에 harnessAction 메타데이터 (single/collection/none 계약)
- **`Img/*` 슬롯이 전부 IMAGE fill 로 채워짐** (빈 슬롯 0개)
  · 주입 코드가 슬롯별 `fills[0].type` 을 돌려주게 한다. IMAGE 가 아닌 슬롯이 있으면
  주입이 실패한 것이다. 화면을 넘기지 말고 그 자리에서 다시 주입한다

위반 발견 시:

- 즉시 수정 (스냅샷을 뽑지 않는다)
- build-log에 기록

### ⭐ Snapshot 요청 (screens STAGE 종료 시 · 비차단)

**절차는 `figma-builder.md` 의 "⭐ Snapshot 요청 (공통 절차)" 와 동일.** 모든 화면이 lint 0건인 뒤 build-log 에
`snapshot: requested (page=03 Screens · profile=full · stage=screens)` 를 적는다.
화면 하나마다 요청하지 않는다 — 페이지 단위로 한 번.

**여기서는 기다린다.** audit(design-auditor) 은 세 페이지 스냅샷이 모두 PASS 여야 시작할 수 있다.
runner 의 `### snapshot · 03 Screens ✅` 가 build-log 에 찍히고 01/02 도 ✅ 인지 확인한 뒤
사용자에게 audit 시작 확인을 받는다. ❌ 가 있으면 위 "FAIL 통지" 절차대로 먼저 고친다.

runner 가 돌리는 검증: `node scripts/check-snapshot.mjs` · `check-layout.mjs --page "03 Screens"`.
figma-audit.mjs 가 이 데이터로 검증하며, 아래가 실제 출력 스키마다.

**Snapshot 스키마:**

⚠️ `figma-snapshot.js` 는 **`page` (단수) 하나**를 반환한다. 그것을 그대로 저장하지 말고,
`figma-snapshot.json` 의 **`pages` 배열**에 같은 name 이 있으면 교체 / 없으면 추가한다.
(`check-snapshot.mjs` 는 `pages` 배열과 `schema_version` 을 요구한다)

**figma-snapshot.js 의 반환값 (한 페이지분):**

> ⚠️ `schema_version` 은 **스크립트가 찍어서 돌려준다. 손으로 쓰지 않는다.**
> `check-snapshot.mjs` 는 2~4 만 받는다. 아래 예시를 베껴 옛 버전을 적으면 즉시 FAIL 이다.
> v4 부터 `page.profile` 이 있고, 비어 있는 fills/strokes 와 false 인 플래그는 키 자체가 없다.

```json
{
  "schema_version": 4,
  "file_key": "abc123",
  "snapshot_date": "2025-01-15T14:30:00.000Z",
  "frame_range": { "from": 0, "to": 5, "total_frames": 5 },
  "page": { "name": "03 Screens", "profile": "full", "frames": [] },
  "variables": {
    "primitives": [{ "name": "brand-500", "type": "COLOR", "aliasOf": null }],
    "semantic": [
      { "name": "color-primary", "type": "COLOR", "aliasOf": "brand-500" }
    ]
  },
  "textStyles": ["Text/h1"],
  "effectStyles": ["Shadow/sm"],
  "paintStyles": []
}
```

`variables` 는 **컬렉션별 객체 배열**이다 (v2 부터). `aliasOf` 가 2계층 판정의 근거다.
primitive 는 `aliasOf: null`, semantic 은 전부 primitive 이름을 가리켜야 한다.

**figma-snapshot.json 의 최종 형태 (병합 후):**

```json
{
  "schema_version": 4,
  "file_key": "abc123",
  "snapshot_date": "2025-01-15T14:30:00.000Z",
  "variables": {
    "primitives": [{ "name": "brand-500", "type": "COLOR", "aliasOf": null }],
    "semantic": [
      { "name": "color-primary", "type": "COLOR", "aliasOf": "brand-500" }
    ]
  },
  "textStyles": ["Text/h1"],
  "effectStyles": ["Shadow/sm"],
  "paintStyles": [],
  "pages": [
    {
      "name": "03 Screens",
      "frames": [
        {
          "name": "01 Home",
          "width": 390,
          "height": 844,
          "nodes": [
            {
              "id": "1:23",
              "parentId": null,
              "name": "SearchBar",
              "type": "INSTANCE",
              "fills": [
                {
                  "type": "SOLID",
                  "color": "#FFFFFF",
                  "boundVariable": "color-bg",
                  "boundVariableCollection": "semantic"
                }
              ],
              "textStyle": null,
              "padding": { "top": 12, "right": 16, "bottom": 12, "left": 16 },
              "itemSpacing": 8,
              "size": { "width": 358, "height": 44 },
              "position": { "x": 16, "y": 100 },
              "layout": {
                "layoutMode": "HORIZONTAL",
                "layoutSizingHorizontal": "FILL",
                "layoutSizingVertical": "HUG",
                "primaryAxisSizingMode": "FIXED",
                "counterAxisSizingMode": "AUTO",
                "vSizing": "HUG"
              },
              "textAutoResize": null,
              "isTapTarget": true,
              "isPrimary": false,
              "isInstance": true
            }
          ]
        }
      ]
    }
  ]
}
```

**필수 필드:**

- `fills[].boundVariable`: 변수 바인딩 이름 (없으면 null → 미바인딩)
- `fills[].boundVariableCollection`: 그 변수가 속한 컬렉션 (`semantic` 아니면 계층 위반)
- `parentId`, `layout.vSizing`, `textAutoResize`: 레이아웃 거동 검사용 (v3)
- `textStyle`: 적용된 텍스트 스타일 이름 (없으면 null)
- `padding`, `itemSpacing`: 4배수 검증용
- `size.width/height`: tap-min 검증용
- `position.y`: safe-area 검증용
- `isTapTarget`: 탭 가능 여부
- `isPrimary`: 구형 스냅샷 호환용; 현재 행동 검증은 `actionId`와 screen-contract.json 사용
- `isInstance`: 컴포넌트 인스턴스 여부 (재사용률 계산)

### build-log 갱신 (화면마다)

```markdown
## screen: 01-home ✅

완료: {HH:MM}
컴포넌트 사용: SearchBar, CategoryFilter, DestinationCard, TabBar
이미지 슬롯: Img/01-home-hero, Img/01-home-card-1 (2개 주입 완료)
placements:

- 01-home-hero: 12:345 · buddy-front.png · imageHash a1b2…
- 01-home-card-1: I12:350;7:21 · character-asset-1.png · imageHash c3d4…
  상태: default, loading, empty (3개 프레임)
  figma_read_calls: 3
  스크린샷: design/04-screens/screenshots/01-home.png
  snapshot: 화면 노드 정보 추가됨
```

**⚠️ 스크린샷 즉시 전달:**

```
✅ 홈 화면 완성 (① / 5)

[스크린샷 첨부]

계속 진행합니다. 다음: 검색 결과 화면
```

---

## 실패 대응 (screens 전용)

### 이미지 라이브러리 불일치 (STAGE=screens 사전 확인)

```
- check-assets FAIL: 표의 파일이 폴더에 없음 → 사용자에게 "폴더에 {파일} 추가 필요" 보고. 생성 금지
- check-assets FAIL: 표 열 이름·비율 오류 → design-rules-generator 몫. screens 시작 안 함
```

### 이미지 주입 실패 (STAGE=screens)

```
- 업로드 URL 은 1회용 → 실패하면 upload_assets 부터 다시
- 스크린샷에 회색 박스가 남음 → nodeIds 순서와 슬롯 순서가 어긋났을 가능성
  → 해당 화면의 슬롯 노드 ID 를 다시 조회해 1:1 매핑을 확인
- 파일 10MB 초과 → upload_assets 거부. 해당 슬롯을 1k 로 다시 생성
```
