# figma-builder · STAGE=tokens 절차

> 이 문서는 `.claude/agents/figma-builder.md` 의 공통 규칙(절대 원칙 · 시간 예산 · 입력 확인 ·
> MCP 프로토콜 · ⭐ Snapshot 요청 공통 절차 · 금지 사항) 위에서 실행되는 STAGE 절차다.
> 공통 규칙을 건너뛰고 이 문서만으로 시작하지 않는다. 읽었으면 build-log 에
> `stage-doc: docs/figma-builder/stage-tokens.md` 를 적는다.
>
> 대상 페이지: `01 Tokens`

---

## STAGE=tokens

**대상 페이지:** `01 Tokens`

### ⭐ 변수 컬렉션은 정확히 2개다 (토큰 2계층)

```
primitives  ← 값을 가진 유일한 컬렉션
semantic    ← 전부 primitives 를 가리키는 alias. 자체 값을 갖지 않는다
```

컬렉션을 `color` / `space` / `radius` / `size` 로 쪼개지 않는다.
계층으로 나누고, 카테고리는 변수 **이름**으로 구분한다.

### 생성할 것

1. **`primitives` 컬렉션** — design-rules.md 각 섹션의 `### Primitive` 표

   | 그룹  | 변수                                                                                                |
   | ----- | --------------------------------------------------------------------------------------------------- |
   | COLOR | brand-50/500/600, neutral-0/50/100/200/400/500/900, red-600, green-600, amber-500, overlay-black-50 |
   | FLOAT | space-1~space-12 · radius-4/8/12/16/full · size-34/36/44/47/49/52/56 · icon-16/20/24                |

2. **`semantic` 컬렉션** — design-rules.md 각 섹션의 `### Semantic` 표

   **반드시 alias 로 만든다.** 값을 직접 넣지 않는다.

   ```js
   // ❌ 이렇게 하면 2계층이 아니다 (게이트 4에서 FAIL)
   semanticVar.setValueForMode(modeId, { r: 0.14, g: 0.39, b: 0.92 });

   // ✅ primitive 를 가리키는 alias
   const prim = primitiveByName.get("brand-500");
   semanticVar.setValueForMode(
     modeId,
     figma.variables.createVariableAlias(prim),
   );
   ```

   | 그룹  | 변수                                                                                                                                                                              |
   | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | COLOR | color-bg, color-surface-1/2, color-border, color-text(-muted/-disabled/-inverse), color-primary(-pressed/-soft), color-danger, color-success, color-warning, color-overlay (15개) |
   | FLOAT | space-screen-padding, space-section, space-card-padding, space-list-gap, space-inline, space-tap-gap-min                                                                          |
   | FLOAT | radius-tag, radius-button, radius-card, radius-sheet, radius-pill                                                                                                                 |
   | FLOAT | safe-area-top(-notch), safe-area-bottom, size-tap-min, size-button-sm/md/lg, app-bar-height, tab-bar-height, icon-sm/md/lg                                                        |

   **생성 순서 고정:** primitives 를 **전부** 만들고 이름→변수 맵을 확보한 뒤
   semantic 을 만든다. 순서가 뒤집히면 alias 대상이 없어 실패한다.

   참조 대상이 design-rules.md 의 `{...}` 값과 다르면 만들지 말고 멈춘다.
   (build-log.md 에 질문으로 남긴다)

3. **텍스트 스타일** (2계층 대상 아님)
   - design-rules.md §C의 type.roles 8개
   - 이름 형식: `Text/display`, `Text/h1`, `Text/body` 등
   - font-family: Pretendard, -apple-system, "Roboto", sans-serif

4. **이펙트 스타일**
   - shadow-sm, shadow-md, shadow-lg
   - 이름 형식: `Shadow/sm` 등

### 절차

1. use_figma 스크립트 작성 (한 번에 큰 프레임 만들지 않는다)
2. **primitives 전부 → semantic 전부(alias) → 텍스트 스타일 → 이펙트 스타일** 순
3. **토큰 문서 프레임 생성** — 아래 "⭐ 토큰 문서" 절차를 그대로 실행
4. `get_screenshot`으로 문서 프레임 확인 (내부용, 사용자에게 안 보냄)

### ⭐ 토큰 문서 (필수)

**문서 그리는 코드를 직접 작성하지 않는다.** `scripts/figma-token-docs.js` 를 그대로 쓴다.
레이아웃 계약의 SSOT 는 `docs/token-docs-spec.md` 다.

> 즉흥 작성하면 매번 다른 것이 나온다. 실제로 2016×146 짜리 한 줄 띠에
> 라벨이 칩 위에 겹쳐 잘린 산출물이 나온 적이 있다. snapshot 과 같은 처방이다.

```
1) Read scripts/figma-token-docs.js

2) CONFIG 4값 치환
   __PAGE_NAME__      → "01 Tokens"
   __PROJECT_LABEL__  → 프로젝트 라벨 (대문자 영문. 없으면 "DESIGN SYSTEM")
   __DOC_DATE__       → 오늘 날짜 ("SEP 17, 2026" 형식)
   __ONLY__           → 치환하지 않는다. 응답이 잘릴 때만
                        "color" | "scale" | "type" | "shadow" 로 쪼개 여러 번 실행

3) use_figma 로 실행 (skillNames 에 figma-use 포함)
   스크립트가 기존 `Token Documentation — *` 와 레거시 `Token Swatch` 를
   먼저 지우고 새로 그린다 (멱등). 여러 번 돌려도 안전하다.

4) 스냅샷 재추출 후 게이트 검증
   node scripts/check-token-docs.mjs      # = npm run check:token-docs
```

**FAIL 이면 STAGE=components 로 넘어가지 않는다.**
스냅샷이나 문서를 손으로 고치지 말고, 원인(변수 누락·이름 어긋남)을 고친 뒤 3)부터 다시 돌린다.

만드는 문서 6개 (모두 1280 폭 · 5열 그리드 · 카드 214×136):
`Color Primitives` / `Color Semantic` / `Scale Primitives` / `Scale Semantic` /
`Typography` / `Shadow`

### ⭐ Snapshot 요청 (비차단 · snapshot-runner 위임)

**절차는 `figma-builder.md` 의 "⭐ Snapshot 요청 (공통 절차)" 를 따른다.** 이 에이전트는 스냅샷을 뽑지 않는다.
lint 0건 · get_screenshot 확인이 끝났으면 build-log 에 아래를 적고 바로 다음으로 간다.

```
snapshot: requested (page=01 Tokens · profile=docs · stage=tokens)
next: STAGE=components
```

### build-log 갱신

```markdown
## STAGE=tokens ✅

완료: {YYYY-MM-DD HH:MM}
변수 생성:

- primitives: 14 COLOR + 25 FLOAT (brand-_, neutral-_, space-_, radius-_, size-_, icon-_)
- semantic: 15 COLOR + 24 FLOAT (전부 alias)
- alias 미연결: 0개
  스타일 생성:
- text: 8개
- shadow: 3개
  토큰 문서: figma-token-docs.js 로 6개 프레임 생성 (Color Primitives / Color Semantic /
  Scale Primitives / Scale Semantic / Typography / Shadow) · check-token-docs 는 runner 결과 대기
  figma_read_calls: 3
  snapshot: requested (snapshot-runner 위임 · 결과는 build-log 의 `### snapshot · {page}` 항목)
  next: STAGE=components
```

**⚠️ 사용자에게 알림만:**
"tokens STAGE 완료. components STAGE로 자동 진행합니다."
(스크린샷 전달 X)
