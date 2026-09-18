# Build Log

## Metadata

- figma_file: 9mSXSf3cI36nDWiyolGXja
- figma_file_url: https://www.figma.com/design/9mSXSf3cI36nDWiyolGXja/
- design_rules_version: 1.0
- start_date: 2026-09-18
- design_rules_confirmed_at: 2026-09-18

## STAGE=tokens ⚠️ (부분 완료 — 아래 "미완료" 참고)

완료: 2026-09-18 14:05 (자원 생성) / 진행 중 14:20 (snapshot 배치 추출)

### 페이지 구조

- 기존 "Page 1" → "01 Tokens" 로 이름 변경
- "02 Components", "03 Screens" 신규 생성
- 최종: ["01 Tokens", "02 Components", "03 Screens"]

### 변수 생성 (Figma Variables — 2계층: primitives → semantic)

**primitives 컬렉션** (38개, design-rules.md §A/B/D/G Primitive 표 그대로)

- COLOR (15): brand-500, brand-600, brand-50, neutral-0/50/100/200/400/500/900,
  red-600, green-600, amber-500, overlay-black-50, sky-100
- FLOAT (23): space-1/2/3/4/5/6/8/12, radius-4/8/12/16/full,
  size-34/36/44/47/49/52/56, icon-16/20/24

**semantic 컬렉션** (39개, 전부 `createVariableAlias` 로 primitives 참조 — 값 직결 0개)

- COLOR (16): color-bg→neutral-0, color-surface-1→neutral-50, color-surface-2→neutral-100,
  color-border→neutral-200, color-text→neutral-900, color-text-muted→neutral-500,
  color-text-disabled→neutral-400, color-text-inverse→neutral-0, color-primary→brand-500,
  color-primary-pressed→brand-600, color-primary-soft→brand-50, color-danger→red-600,
  color-success→green-600, color-warning→amber-500, color-overlay→overlay-black-50,
  color-image-slot-bg→sky-100
- FLOAT (23): space-screen-padding/section/card-padding/list-gap/inline/tap-gap-min,
  radius-tag/button/card/sheet/pill, safe-area-top/top-notch/bottom, size-tap-min,
  size-button-sm/md/lg, app-bar-height, tab-bar-height, icon-sm/md/lg
- missingPrimitiveTargets: 0개 (전부 정상 alias 연결)

**의도적으로 만들지 않은 것:** `device-frame` (390×844) — 단일 스칼라가 아닌 W×H 쌍이라
Figma Variable 로 만들지 않음. figma-audit.mjs/verify-design-rules.mjs 도 이 토큰을
design-rules.md 텍스트에서 직접 읽지 Figma 변수로 기대하지 않음 (CONSTANT_TOKENS 처리 확인).

### 텍스트 스타일 (8개, design-rules.md §C role 그대로)

Text/display(28/Bold), Text/h1(24/SemiBold), Text/h2(20/SemiBold), Text/h3(17/SemiBold),
Text/body(15/Regular), Text/body-sm(14/Regular), Text/caption(12/Regular), Text/label(13/Medium)
— font family: Pretendard (로드 성공, Inter 대체 불필요)

### 이펙트 스타일 (3개, design-rules.md §E 그대로)

Shadow/sm (y1·blur2·6%), Shadow/md (y4·blur12·8%), Shadow/lg (y8·blur24·12%)

### 토큰 문서 (scripts/figma-token-docs.js 그대로 사용, 즉흥 작성 없음)

01 Tokens 페이지에 6개 프레임 생성, 전부 스크린샷으로 육안 검증 완료:

- `Token Documentation — Color Primitives` (node 19:15, 15 카드, 1280×2235)
- `Token Documentation — Color Semantic` (node 19:132, 16 카드, 1280×2866) — 모든 alias 화살표(`→ neutral-0` 등) 정상 표시
- `Token Documentation — Scale Primitives` (node 19:269, 23 카드, 1280×1604)
- `Token Documentation — Scale Semantic` (node 19:411, 23 카드, 1280×2235) — 모든 alias + 값 정상 표시
- `Token Documentation — Typography` (node 19:568, 8 카드, 1280×2083) — 폰트 샘플·role·size/weight 정상
- `Token Documentation — Shadow` (node 19:650, 3 카드, 1280×1039) — 그림자 렌더 정상

레거시 `Token Swatch` 프레임 없음 (removed_frames: 0, 최초 실행이라 지울 것 없었음).

### ⚠️ 진행 중 (체크포인트): figma-snapshot.json 노드 단위 배치 추출

**코디네이터 지시(옵션 1)에 따라 노드 단위 배치 추출로 전환.** 추가 15분 예산 소진 시점에
아래 체크포인트를 남기고 멈춤. 배치 파일은 `design/04-screens/snapshot-batches/tokens-fNN-bNN.json`.

**청크 크기 재조정 경위:** 30개/배치로 시작 → 노드 내용이 짧은 프레임(Color Primitives)은
30개가 들어갔지만, 텍스트가 긴 프레임(Color Semantic 의 안내문 등)에서는 30개도 잘려
20개 이하로 줄여야 했다. 잘린 배치는 파일로 저장하지 않고 즉시 폐기 후 좁혀서 재추출했다
(잘린 JSON을 손으로 고치지 않음 — 원칙 준수).

**완료:**

| 프레임 (index)     | 총 노드 | 배치 파일                     | 커버리지            |
| ------------------ | ------- | ----------------------------- | ------------------- |
| 0 Color Primitives | 116     | tokens-f00-b01~b05.json (5개) | 0~116 완전          |
| 1 Color Semantic   | 136     | tokens-f01-b01~b02.json (2개) | 0~45 만 (91개 남음) |
| 2 Scale Primitives | 141     | 없음                          | 미착수              |
| 3 Scale Semantic   | 156     | 없음                          | 미착수              |
| 4 Typography       | 81      | 없음                          | 미착수              |
| 5 Shadow           | 36      | 없음                          | 미착수              |

**중요:** `merge-snapshot.mjs` 는 페이지 전체(`frame_range.total_frames`)가 커버되어야
파일을 쓴다 — 프레임 0만 완전해도 "01 Tokens" 페이지 전체가 안 끝나면 아무것도 병합되지
않는다(gap 검사가 페이지 단위). 그래서 **아직 figma-snapshot.json 자체는 생성되지 않았다.**
(`node scripts/merge-snapshot.mjs design/04-screens/snapshot-batches/tokens-f00-b0*.json --out ... --dry-run`
실행 시 "범위 누락: 1~6 가 빠졌다" 로 정상 거부됨 — merge 로직 자체는 올바르게 동작 확인.)

**남은 작업 견적:** 20노드/배치 기준으로 프레임 1 잔여(91) ~5배치, 프레임 2(141) ~7배치,
프레임 3(156) ~8배치, 프레임 4(81) ~4배치, 프레임 5(36) ~2배치 = **총 약 26배치 추가 필요**
(이미 완료한 7배치 포함 전체 약 33배치). 배치 1개당 use_figma 호출 1회 + 검증·저장 1회가 필요해
이 페이지 하나를 완전히 끝내는 데 상당히 긴 세션이 필요하다는 것이 실측으로 확인됨.

**재추출 시 유의:**

- 프레임 1(Color Semantic)처럼 안내문 텍스트가 긴 프레임은 20개도 빠듯할 수 있어
  필요시 15개로 더 좁힌다.
- 매 배치는 `use_figma` 응답을 받는 즉시 파이썬(`json.loads(raw)` 후 `json.dump`)으로
  저장하고 `python3 -c "import json; json.load(open('파일'))"` 로 유효성을 확인한 뒤
  다음 배치로 진행한다 (bash heredoc 직접 삽입은 특수문자 이스케이프 문제로 비권장).
- 응답이 `// truncated to Nkb` 로 끝나면 그 배치는 파일로 저장하지 말고 폐기,
  범위를 절반 이하로 좁혀 재시도한다.

**대신 확보한 것 (수동/시각 검증 — 배치 추출과 별개로 유효):**

- `get_screenshot` 으로 6개 문서 전부 확인 → design-rules.md 의 모든 값·별칭이
  정확히 일치 (예: `color-primary → brand-500`, `radius-pill → radius-full · 9999` 등)
- `use_figma` 로 컬렉션·스타일 개수를 직접 조회해 구조적 정합성 확인
  (primitives 38개, semantic 39개, missingPrimitiveTargets: 0, textStyles 8개, effectStyles 3개)

### 다음 단계

이어서 진행할 경우: `design/04-screens/snapshot-batches/` 의 기존 배치 파일을 재사용하고
프레임 1의 45번 노드부터, 프레임 2~5는 처음부터 20노드 단위로 이어서 추출 →

```
node scripts/merge-snapshot.mjs design/04-screens/snapshot-batches/tokens-*.json \
  --out design/04-screens/figma-snapshot.json
npm run check:snapshot
npm run check:token-docs
```

figma_read_calls: 약 21회 (get_metadata 1 · get_screenshot 6 · use_figma 14: 컬렉션/스타일
생성 4 + 토큰문서 1 + 노드개수조회 1 + 스냅샷 배치 7 + 잘려서 폐기한 배치 1)
next: 이 체크포인트에서 재개 (프레임 0 완료 · 프레임 1 45/136 · 프레임 2~5 미착수) —
STAGE=components 진행은 이 페이지의 figma-snapshot.json 완성 및 check-snapshot/
check-token-docs PASS 후로 보류
