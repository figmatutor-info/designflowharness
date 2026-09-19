# Fix List · Round 1

- 작성: 코디네이터 (2026-09-19)
- 근거: snapshot-runner 의 `check-snapshot` FAIL (화면당 isPrimary 1개) + 코디네이터가 현재 스냅샷으로 사전 실행한
  `npm run audit` 결과 (spacing 11건 · 탭 영역 33건). design-auditor 는 세 페이지 스냅샷 PASS 후 실행한다.
- design-rules.md 는 **v1.1** (2026-09-19 · Tab Height → fixed(size-tap-min)). build-log 의 design_rules_version 도 1.1 로 갱신할 것.
- 재사용률 항목은 계산식 수정으로 100% PASS — Figma 수정 불필요.

**대상 열:** `figma` = STAGE=fix 로 Figma 수정 / `rules` = design-rules §I 표 교체 (design-rules-generator). 이번 라운드는 전부 `figma`.

**주의:** figma-builder STAGE=fix 는 이 목록에 있는 것만 고친다. 페이지 `02 Components` 마스터를 고치면 `03 Screens` 인스턴스에 전파된다 — 화면 인스턴스에서 개별 override 로 고치지 않는다.

## Critical (check-snapshot FAIL · 게이트 4 진입 조건)

| #   | 화면             | 대상  | 노드                                  | 문제                                                                       | 수정 방법                                                                              |
| --- | ---------------- | ----- | ------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | 01 Home          | figma | `Card` 인스턴스 (id 71:84, main=Card) | primary 액션(이번 달 미션 카드 탭)인데 이름에 primary 없음 → isPrimary 0개 | 레이어 이름을 `Card · primary` 로 변경 (이 화면에서 이 노드 하나만)                    |
| 2   | 02 Skill Library | figma | `SkillCard` 인스턴스 (id 74:117)      | primary 액션(스킬 카드 탭) 미표기 → isPrimary 0개                          | 첫 카드만 `SkillCard · primary` 로 변경. 74:127 · 74:137 은 그대로 (화면당 정확히 1개) |
| 3   | 05 Huddling Pick | figma | `PickCard` 인스턴스 (id 79:264)       | primary 액션(픽 카드 탭) 미표기 → isPrimary 0개                            | 첫 카드만 `PickCard · primary` 로 변경. 79:272 은 그대로                               |

## Major (audit FAIL 예정 · 02 Components 마스터 수정)

| #   | 화면                      | 대상  | 노드                                                                  | 문제                                             | 수정 방법                                                                                                                                          |
| --- | ------------------------- | ----- | --------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | 02 Components → ItemRow   | figma | `TextCol` (id 36:122, ItemRow 마스터 안)                              | itemSpacing 2px (4배수 아님) · 화면 8건 전파     | itemSpacing 을 semantic `space-1`(4px) 변수로 바인딩. 같은 이름의 TextCol 이 다른 마스터(Card/AssetCard 등)에도 2px 이면 동일 처리                 |
| 5   | 02 Components → SkillCard | figma | `TagsRow` (id 37:26, SkillCard 마스터 안)                             | itemSpacing 6px (4배수 아님) · 화면 3건 전파     | itemSpacing 을 semantic `space-2`(8px) 변수로 바인딩                                                                                               |
| 6   | 02 Components → TabBar    | figma | `TabItem` ×4 (id 37:49 · 37:51 · 37:53 · 37:55)                       | 폭 24~49px (HUG) → 탭 영역 44 미만 8건 전파      | 각 TabItem 의 `layoutSizingHorizontal = "FILL"` (4개가 390 을 균등 분할 → 약 97px). 세로는 HUG 44 유지. 아이콘·라벨 중앙 정렬 유지                 |
| 7   | 02 Components → Tab       | figma | `State=active` (37:17) · `State=inactive` (37:20) — Tab 컴포넌트 세트 | 높이 36 → 탭 영역 44 미만 21건 + TabRow 4건 전파 | 높이를 `size-tap-min`(44) 변수로 바인딩 (design-rules v1.1 `Height: fixed(size-tap-min)`). Underline 은 하단 유지. 화면의 TabRow 는 HUG 라 자동 44 |

## Minor

없음. (ItemRow 마스터 `Thumb` → `Img/item-thumb` 개명은 **보류**: 03 Mission Detail 의 ItemRow 2개는 §I 표에 슬롯이 없어
이미지가 없으므로, 개명하면 게이트 4 "이미지 슬롯 채움" 이 빈 슬롯 2개로 FAIL 한다. §I 에 03 화면 슬롯을 추가할 때 함께 처리.)

## 처리 규칙 (figma-builder에게)

1. 수정 후 `scripts/figma-lint.js` 를 `02 Components` · `03 Screens` 두 페이지에 돌려 0건 확인
2. build-log 에 `snapshot: requested (page=02 Components · profile=full · stage=fix)` 와
   `snapshot: requested (page=03 Screens · profile=full · stage=fix)` 두 줄을 남긴다 (직접 뽑지 않는다)
3. 화면 스크린샷 5장 갱신 (design/04-screens/screenshots/)

---

# Fix List · Round 2

- 작성: 코디네이터 (2026-09-19). Round 1 후 세 페이지 스냅샷 PASS · `npm run audit` 8/9 (탭 영역 16건만 남음).
- 남은 위반은 전부 `Tab` 인스턴스 (02 Skill Library 6 · 04 My Assets 3 · 05 Huddling Pick 7): 높이 44 는 맞았으나
  폭이 라벨 텍스트에 붙는 HUG 라 24~38px. `대상` 열 전부 `figma`.

## Major

| #   | 화면                | 대상  | 노드                                                                  | 문제                                  | 수정 방법                                                                                                                                                                                                                                                                                            |
| --- | ------------------- | ----- | --------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | 02 Components → Tab | figma | `State=active` (37:17) · `State=inactive` (37:20) — Tab 컴포넌트 세트 | 폭 HUG → 화면 인스턴스 24~38px (16건) | 두 variant 에 좌우 padding 을 semantic 12px(primitive space-3 별칭 · 실제 semantic 이름은 Figma 변수에서 조회) 로 바인딩 → 최소 폭 24+24=48 ≥ 44. `Underline` (37:19 · 37:22) 은 `layoutSizingHorizontal = "FILL"` 로 바꿔 라벨+패딩 폭을 따르게. 세트 컨테이너(37:23) 폭도 늘어난 variant 에 맞춘다 |

## 처리 규칙 (figma-builder에게)

1. 12px semantic 변수가 없으면 8px(space-2 별칭) 로 대체하되 라벨 최소 폭이 24 이므로 24+16=40 < 44 가 된다 — 그 경우 대신 두 variant 에 `minWidth` 를 `size-tap-min`(44) 로 바인딩하고 텍스트를 가로 중앙 정렬한다. 어느 쪽을 택했는지 build-log 에 적는다
2. 수정 후 `scripts/figma-lint.js` 를 `02 Components` · `03 Screens` 에 돌려 0건 확인
3. build-log 에 `## STAGE=fix · Round 2` 섹션과 `snapshot: requested (page=02 Components · profile=full · stage=fix)` · `snapshot: requested (page=03 Screens · profile=full · stage=fix)` 두 줄
4. 화면 스크린샷 02 · 04 · 05 갱신 (Tab 이 있는 화면)
