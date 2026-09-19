# design/ — 파이프라인 산출물 (= 진행 상태)

각 Phase 의 산출물이 이 폴더에 쌓인다. **폴더가 곧 상태다** — 세션이 끊겨도 `ls design/` 과
`node scripts/check-phase.mjs` 로 어디까지 왔는지 알 수 있다. 규칙 SSOT 는 CLAUDE.md.

| 폴더                 | Phase | 담당 에이전트                                    | 핵심 산출물                                                                                                                                                                 |
| -------------------- | ----- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-references/`     | 1     | reference-collector → reference-analyzer         | `raw/` 스크린샷 3장+ · `analysis.md`                                                                                                                                        |
| `02-structure/`      | 2     | structure-builder                                | `screens.md` (화면 5개+) · `flows.md` (시나리오 2-3개)                                                                                                                      |
| `03-design-rules/`   | 3     | design-rules-generator                           | `design-rules.md` ⭐ 유일한 규칙 SSOT (`status: confirmed` 필수) · `tokens.md` · `components.md` · `preview.html`                                                           |
| `04-screens/`        | 4     | figma-builder · snapshot-runner · design-auditor | `figma-file-key.txt` (사용자가 만든 파일) · `build-log.md` · `figma-snapshot.json` · `audit-report.md` · `audit-structural.json` · `fix-list.md` (FAIL 시) · `screenshots/` |
| `assets/characters/` | —     | **사람이 채운다** (에이전트 생성 금지)           | design-rules §I 표의 `파일` 열이 가리키는 이미지 · `check-assets.mjs` 가 대조                                                                                               |

- `figma-snapshot.json` 은 `scripts/figma-snapshot.js` 로만 추출하고 `merge-snapshot.mjs` 로 병합한다 (손으로 쓰지 않는다)
- `figma-snapshot.json` · `audit-structural.json` · `snapshot-batches/` 는 매번 갱신되는 중간 산출물이라 git 에서 제외된다
- 각 에이전트는 자기 담당 폴더 외 편집 금지
