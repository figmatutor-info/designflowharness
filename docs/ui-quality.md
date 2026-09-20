# UI 품질 계약

Claude Code의 기존 4단계·7개 에이전트 안에서 적용한다. 에이전트 추가나 새 런타임은 필요 없다.
스타일의 SSOT는 `design-rules.md`, 화면/상태/행동의 기계 판독 계약은
`design/02-structure/screen-contract.json`이다. screens.md는 목적과 근거를 설명한다.
두 파일이 다르면 structure-builder가 함께 고친다. 시각 검수 점수는 인간/LLM 판단이며
스크립트가 UI의 아름다움을 자동으로 판정한다고 표현하지 않는다.

## Phase 2 · 화면 목적과 상태

structure-builder는 screens.md·flows.md와 함께 screen-contract.json을 작성한다.
화면마다 목적, 레퍼런스, 기본 상태와 실패/빈 상태 중 핵심 흐름에 필요한 것을 선택한다.
전부 만들 필요는 없지만 제외하는 상태는 `required:false`와 구체적인 이유를 남긴다.
예산 부족만으로 이미 승인된 필수 상태를 몰래 제외하지 않는다.

아래는 한 화면의 형식 예시다. 실제 프로젝트의 전체 화면 목록을 등록한다.

```json
{
  "schema_version": 1,
  "screens": [{
    "id": "02-skill-library",
    "purpose": "목적에 맞는 실무 스킬을 찾아 상세를 연다",
    "references": ["analysis.md · 필터 칩 패턴"],
    "states": [{
      "id": "default",
      "required": true,
      "frame": "DeviceFrame · 02 Skill Library",
      "screenshot": "design/04-screens/screenshots/02-skill-library.png",
      "action": {"mode": "collection", "id": "open-skill"},
      "checks": ["동등한 카드가 같은 가중치로 보임", "필터 선택 상태가 구분됨"]
    }, {
      "id": "empty",
      "required": true,
      "frame": "DeviceFrame · 02 Skill Library · empty",
      "screenshot": "design/04-screens/screenshots/02-skill-library-empty.png",
      "action": {"mode": "single", "id": "clear-filters"},
      "checks": ["결과 없음의 이유와 필터 초기화가 보임"]
    }, {
      "id": "loading",
      "required": false,
      "reason": "이번 시연은 탐색과 결과 없음 복구만 검증하며 로딩은 후속 범위"
    }]
  }]
}
```

- `single`: 그 상태의 주 행동 탭 대상 정확히 하나. 제출/등록/재시도 등에 사용.
- `collection`: 같은 행동을 하는 동등한 카드 하나 이상. 특정 카드만 primary로 표시하지 않는다.
- `none`: 처리 중/읽기 전용 등 주 행동이 없는 상태. `action.reason` 필수.
- style variant `primary/secondary`와 위 행동 정책은 별개다. 주 행동 외 보조 버튼은 허용된다.
- checks는 “좋음” 대신 사용자가 확인할 수 있는 관찰 조건을 쓴다.
- 검색의 empty, 제출의 submitting/error·재시도, 긴 콘텐츠의 스크롤을 우선 검토한다.

`npm run check:contract` 후 `npm run check:structure`. 최종 게이트는 계약에 없는 프레임,
필수 상태 누락·중복, 스크린샷 누락을 실패로 처리한다. 실험용 프레임은 작업 페이지에 둔다.

## Phase 3 · 대표 화면 방향 선택

전체 라이브러리 제작 전에 대표 화면 하나를 같은 콘텐츠로 2안 비교한다.
색만 바꾸지 말고 정보 위계·밀도·이미지 비중 중 적어도 하나가 다른 안을 만든다.
사용자가 이미 방향을 지정했거나 승인한 시안이 있으면 다시 선택을 요구하지 않고 근거를 기록한다.

`design/03-design-rules/design-direction.md`에 다음을 기록한다.

- 제품의 핵심 과업과 첫 시선이 가야 할 정보
- A/B 방향, 각 안의 장점·한계, 해당 레퍼런스
- 실제 콘텐츠로 렌더한 두 안의 HTML 위치 또는 로컬 이미지 경로
- 선택한 안과 선택 이유, 사용자 피드백 또는 위임받아 결정한 근거
- 유지할 시각 원칙 3개, 피할 패턴 3개

비교 HTML은 `direction-options.html`로 저장하고 선택안의 규칙을 design-rules.md에 옮긴다.
브랜드 컬러는 이 과정의 일부다. 미결정 값만 default-tokens로 채우며 전체 기본값을 무조건 고정하지 않는다.
2안 비교는 기존 Phase 3 승인에 묶는다. 값마다 승인 요청을 추가하지 않는다.

최종 preview.html은 모든 기본 화면과 계약의 필수 상태를 실제 문구·실제 §I 에셋으로 채운다.
각 상태에 `data-screen="화면 id" data-state="상태 id"`를 붙인다. 기본 상태도 명시한다.
이미지가 부족하면 다른 상품을 캐릭터로 일괄 대체하지 말고 필요한 에셋의 역할을 보고한다.
회색 박스 시안은 작업 중에만 허용하며 최종 승인안으로 쓰지 않는다.

## 읽기 편한 텍스트와 이미지

design-rules.md의 컴포넌트 규칙에 제목 최대 줄 수/넘칠 때 처리, 배지 줄바꿈 정책,
본문 line-height와 가로 sizing을 함께 적는다. Figma의 남는 폭은 텍스트에 FILL로 배분한다.

- `D-5`, `ChatGPT`, `Cursor`, 짧은 상태 배지는 한 줄 HUG + 좌우 padding. 고정 폭으로 단어를 쪼개지 않는다.
- 카드 제목은 가용 폭을 사용한다. 좁은 텍스트 프레임 때문에 마지막 한 글자만 내려가지 않게 한다.
- 긴 한글 제목, 영문 도구명, 큰 금액, 긴 상태 문구를 대표 컴포넌트에서 확인한다.
- 글자를 축소해 억지로 맞추기 전에 폭·정보 순서·행 배치를 수정한다.
- line-height/폰트가 달라 HTML과 Figma의 줄 수가 달라지면 Figma 결과를 다시 검수한다.
- 캐릭터는 온보딩·응원·빈 상태에, 자료/상품 커버는 내용을 구별하는 데 사용한다.
- §I의 `담을 내용`에는 슬롯의 의미를 기록한다. 에셋이 같은 톤이라는 이유만으로 채택하지 않는다.
- `image-library:`는 프로젝트가 공급한 에셋 폴더로 지정할 수 있다. 생성/외부 이미지 금지는 유지한다.

## 스크롤과 내비게이션

390×844는 뷰포트다. 콘텐츠 전체 높이의 상한으로 취급하지 않는다.
앱바·탭바·하단 CTA는 스크롤 밖, 본문은 viewport + HUG content로 나눈다.
viewport에 `clipsContent=true`, 실제 `overflowDirection=VERTICAL` 등을 설정한다.
스크린샷으로만 스크롤 성공을 주장하지 말고 Figma prototype에서 마지막 항목까지 확인한다.
safe area를 삭제하거나 카드 수를 줄여 검사만 통과시키지 않는다. 콘텐츠 축소는 제품 범위 결정이다.

검사기는 실제 클리핑+스크롤 방향이 있는 viewport에서 해당 축의 넘침만 허용한다.
세로 스크롤의 가로 넘침은 계속 실패한다. viewport 자체와 고정 영역은 safe area 검사를 받는다.
각 탭의 선택 표시, 뒤로가기 경로, 제출 중 중복 행동 방지, 실패 후 복구를 확인한다.
API 의미: [Figma overflowDirection](https://developers.figma.com/docs/plugins/api/properties/nodes-overflowdirection/).

## 시각 검수 · design-auditor

승인된 preview.html과 각 Figma 상태 화면을 같은 크기로 비교한다. 렌더링/이미지 읽기가
불가능하면 판정 불가로 보고하고 PASS로 기록하지 않는다. 새 브라우저 MCP를 필수로 만들지는 않는다.

`visual-review.draft.json`을 출발점으로 화면을 실제로 본 뒤 `visual-review.json`을 작성한다.
필드와 캡처 순서는 [capture-protocol.md](capture-protocol.md)를 따른다.

각 차원에 1~5점과 화면 위치·구체적인 관찰 근거를 적는다.

| 키 | 판단 기준 |
| --- | --- |
| hierarchy | 핵심 과업/정보가 먼저 보이고 부가 정보가 경쟁하지 않음 |
| readability | 제목·본문·배지가 자연스럽게 읽히며 잘림/부자연스러운 줄바꿈 없음 |
| density | 화면 목적에 맞는 밀도, 섹션별 여백과 폭 배분 |
| image_relevance | 내용 식별에 기여하는 이미지; 이미지가 없으면 그 적합성 근거 |
| consistency | 컴포넌트·탭·상태 표현과 정보 위계가 화면 사이에서 일관됨 |

공통 기준: 1=핵심 과업 방해, 2=여러 큰 문제, 3=사용 가능하나 중요한 개선 필요,
4=출시 검토 가능하며 작은 보완만 있음, 5=레퍼런스 비교에서도 명확하고 정돈됨.
각 차원 4 이상, 공통 체크와 계약의 사용자 체크 모두 PASS, 미해결 Critical/Major 0건이어야 완료다.
Minor는 위치·문제·수용 사유를 남긴다. 평균점수로 가독성 실패를 덮지 않는다.

공통 체크: text_wrapping / content_width / image_meaning / navigation / scroll_behavior / contrast.
해당 없는 항목도 이유를 쓴다. 대비는 작은 회색 글씨·컬러 배지·이미지 위 글씨를 실제로 확인한다.
이 검수는 전체 접근성 인증을 대체하지 않는다.

최대 3개의 영향 큰 결함부터 fix-list에 위치·사용자 영향·수정 방향을 적어 보낸다.
수정 후 전후 차이를 `comparison`에 남기고 새 캡처에서 재검수한다. 최대 3라운드 뒤에도
기준 미달이면 남은 문제를 보고한다. 예산 소진은 PASS의 근거가 아니다.
4배수/재사용률 기준은 유지하되 구조를 의미 없이 바꿔 수치를 맞추지 않는다.
예외가 필요하면 규칙 담당에게 근거와 검사기 변경 필요성을 보고한다.
