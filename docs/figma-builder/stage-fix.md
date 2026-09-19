# figma-builder · STAGE=fix 절차

> 이 문서는 `.claude/agents/figma-builder.md` 의 공통 규칙(절대 원칙 · 시간 예산 · 입력 확인 ·
> MCP 프로토콜 · ⭐ Snapshot 요청 공통 절차 · 금지 사항) 위에서 실행되는 STAGE 절차다.
> 공통 규칙을 건너뛰고 이 문서만으로 시작하지 않는다. 읽었으면 build-log 에
> `stage-doc: docs/figma-builder/stage-fix.md` 를 적는다.

---

## STAGE=fix

**입력:** design-auditor가 만든 `design/04-screens/fix-list.md`

**규칙:**

- fix-list.md에 있는 결함만 수정
- 목록에 없는 것은 절대 건드리지 않음

### ⭐ 먼저 `대상` 열로 갈래를 나눈다

fix-list.md 의 각 행에는 `대상` 열이 있다. **이 열을 먼저 읽는다.**

| 대상    | 성격                                     | 처리                                                       |
| ------- | ---------------------------------------- | ---------------------------------------------------------- |
| `figma` | 노드를 고치면 해결 (빈 슬롯 재주입 포함) | 아래 "A. figma 결함 처리" · 이미지 행은 "B" 의 ①           |
| `rules` | design-rules §I 표(파일 선택)가 문제     | figma-builder 가 처리하지 않는다 — 아래 "B" 의 ② 대로 보고 |

`대상` 열이 없는 옛 형식의 fix-list 는 전부 `figma` 로 본다.

**`rules` 행을 Figma 노드 수정으로 처리하려 들지 않는다.** 고쳐지지 않는다.
이미지를 만들어서 해결하려 들지도 않는다 — 이미지는 생성물이 아니다.

### A. figma 결함 처리

1. 대상 노드 찾기 (`figma.root.findOne`)
2. 수정 (변수 재바인딩, 크기 조정 등)
3. 수정 완료 표시

### B. 이미지 결함 처리 (`대상: figma` 의 이미지 행 / `대상: rules`)

**이미지는 생성하지 않으므로 "재생성" 이라는 처리는 없다.** 두 경우로 나뉜다.

```
§I 표에서 그 슬롯의 `파일` 열을 본다. build-log 의 placements 에서 node_id 를 본다.

① 표의 파일은 폴더에 있는데 화면이 비어 있거나 다른 그림이다  → "주입 실패" (대상: figma)
   원인: 업로드 URL 만료 / imageHash 와 슬롯 매핑이 어긋남
   처리: placements 의 node_id 로 다시 주입만 한다 (STAGE=screens 의 "이미지 주입" 2~4 단계)

② 파일 자체가 이 자리에 안 맞는다 (톤·대비·잘림)  → 규칙 문제 (대상: rules)
   처리: figma-builder 가 처리하지 않는다. design-rules-generator 가 §I 표의 `파일` 열을
         라이브러리의 다른 파일로 바꾸고 status: confirmed 를 다시 받은 뒤, ① 절차로 재주입한다
   ⚠️ 폴더에 맞는 파일이 없어도 만들지 않는다. "사용자가 폴더에 파일을 추가해야 함" 으로 보고
```

어느 쪽인지 판단이 안 서면 build-log 에 질문으로 남기고 멈춘다.

### 절차

1. fix-list.md 읽기 → `대상` 열로 분류
2. `figma` 행 처리 (A · 이미지 행은 B-①) · `rules` 행은 처리하지 않고 보고 (B-②)
3. 수정 후 `scripts/figma-lint.js` 로 해당 화면 0건 확인 (스냅샷 전)
4. 전체 완료 후 build-log 에 `snapshot: requested (page=03 Screens · profile=full · stage=fix)` 를 적는다
   — 다른 STAGE 와 똑같이 추출은 snapshot-runner 가 한다. fix 라고 해서 직접 뽑지 않는다
5. 이미지 행을 건드렸으면 `node scripts/check-assets.mjs` 통과 확인
6. build-log 갱신 (runner 의 check-snapshot 결과는 코디네이터가 전달한다 · 그 뒤 design-auditor 재실행)

### build-log 갱신

```markdown
## STAGE=fix (round 1) ✅

완료: {HH:MM}
수정 사항 (fix-list 기준):

- [figma] screen 03-detail: primary button 색상 변수 미바인딩 → 수정
- [figma] screen 05-mypage: safe-area-bottom 침범 → 수정
- [assets] screen 01-home / Img/01-home-hero: 주입 실패 → 재주입 (재생성 없음)
- [rules] screen 02-search-results / card-1: 이미지에 글자 → §I 표 `파일` 열 교체 필요 (design-rules-generator 에 보고 · 여기서 처리 안 함)
  figma_read_calls: 4
  snapshot: 갱신 완료
  next: design-auditor 재실행
```

---

## 실패 대응 (fix 전용)

### fix-list 처리 실패

```
- 결함이 너무 많으면 (10개 이상)
  → 방향 오류 가능성, 사용자 에스컬레이션
- 반복 실패 (같은 결함 3회)
  → 근본적 규칙 문제, design-rules-generator 재검토 제안
```
