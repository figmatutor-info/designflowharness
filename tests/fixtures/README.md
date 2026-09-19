# tests/fixtures — 검증 스크립트 회귀 테스트용 정답지

**이 폴더의 JSON 은 손으로 고치지 않는다.** 전부 `scripts/figma-snapshot.js` 가 실제 Figma 파일에서
추출한 것이다. 스크립트 판정이 바뀌어 테스트가 깨지면, 정답지를 고칠 게 아니라 판정이 왜 바뀌었는지 본다.
정답지를 갱신할 때는 아래 "갱신 절차" 대로 실제 추출물을 통째로 교체한다.

| 파일                     | 출처                                                                                                                                                     | 상태                                                                                                                                                        | 용도                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `tokens-components.json` | Figma `9mSXSf3cI36nDWiyolGXja` · 2026-09-19 추출 · 01 Tokens(docs · 6프레임) + 02 Components(full · 32프레임) + 03 Screens(**docs** · 5프레임)           | check-snapshot `--stage tokens`/`components` · check-layout · check-token-docs 전부 PASS. 03 Screens 는 docs 프로필이라 audit 이 거부해야 한다 (부정 앵커)  | PASS 앵커 · 변이 원본                                |
| `screens-round1.json`    | 같은 파일 · 2026-09-18 07:15 추출 · 03 Screens(full · 5프레임) · **STAGE=fix 이전 Round 1** (git 커밋 `2691b36` 의 배치 27개를 merge-snapshot 으로 병합) | check-snapshot 25/26 (화면당 isPrimary 1개 실패) · check-layout PASS · figma-audit **6/9 · 위반 47건** (spacing_grid 11 · tap_targets 33 · primary_count 3) | **FAIL 앵커** — 위반 수가 바뀌면 판정 로직이 바뀐 것 |
| `design-rules.md`        | git 커밋 `46f9f2c` 의 `design/03-design-rules/design-rules.md` (v1.1 · status: confirmed)                                                                | verify-design-rules `--strict` PASS · check-assets PASS (§I 표 ↔ `design/assets/characters/` 대조)                                                          | 규칙 입력                                            |
| `figma-file-key.txt`     | 위 스냅샷의 file_key                                                                                                                                     | check-snapshot 의 file_key 대조용                                                                                                                           |                                                      |

## 아직 없는 정답지

**fix 이후 PASS 상태의 03 Screens(full) 스냅샷.** 2026-09-19 게이트 4 15/15 통과 당시의 스냅샷은
gitignore 대상이라 저장소에 없고, 같은 날 design/ 초기화로 작업 트리에서도 사라졌다.
다음 프로젝트가 게이트 4 를 통과하면 그 `design/04-screens/figma-snapshot.json` 을
`screens-pass.json` 으로 복사하고 `tests/check-scripts.test.mjs` 의 PASS 앵커에 audit 9/9 항목을 추가한다.

## 갱신 절차

1. 실제 파이프라인에서 `snapshot-runner` 가 만든 `design/04-screens/figma-snapshot.json` 을 그대로 복사한다.
2. 이 README 표에 파일 키 · 추출 시점 · 각 스크립트의 결과(통과 수 · 위반 수)를 적는다.
3. `npm test` 를 돌려 기대값을 새 정답지에 맞춘다. 기대값을 바꿀 때는 커밋 메시지에 이유를 적는다.

변이 테스트(`tests/mutations.test.mjs`)는 이 정답지를 메모리에서 복사해 결함을 하나만 넣고 임시 파일로 쓴다.
정답지 자체는 건드리지 않는다.
