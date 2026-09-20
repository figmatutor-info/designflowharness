# 최종 캡처와 검수 증거

개발 중에는 기존 lint → 백그라운드 snapshot-runner 리듬을 유지한다.
최종 검수 직전에는 Figma 수정을 동결하고 하나의 캡처 ID로 세 페이지를 읽는다.
이 과정은 도구의 서버 revision을 대체하지 않는다. 외부에서 Figma가 변경된 사실은 로컬
파일 해시로 탐지할 수 없으므로 변경을 알게 되면 새 캡처를 시작한다.

## 소유권

- structure-builder: `design/02-structure/screen-contract.json` (화면/상태/주 행동 계약)
- design-rules-generator: `design-direction.md`, `direction-options.html`, preview.html, 규칙
- figma-builder: Figma·필수 스크린샷·build-log, `capture:begin` 실행
- snapshot-runner: 스냅샷·배치·build-log만. 최종 캡처 때는 동일 ID를 주입
- 코디네이터: 세 페이지 결과와 스크린샷 완료를 기다린 후 `capture:seal` 실행
- design-auditor: audit-structural.json, audit-report.md, visual-review.json, fix-list.md
- build-manifest.json·visual-review.draft.json: 스크립트가 작성. 에이전트가 해시를 손으로 고치지 않음

## 실제 실행 순서

1. structure-builder가 `npm run check:contract`, 규칙 담당이 `npm run check:rules`를 통과한다.
2. builder가 계약의 모든 required 상태를 만들고 lint를 실행한다.
   주 행동의 실제 탭 대상에 `node.setPluginData("harnessAction", "open-skill")`처럼 의미를 기록한다.
   single은 한 대상, collection은 동등한 각 카드에 같은 ID. 보조 행동에는 이 값을 붙이지 않는다.
   `none` 상태에서는 기본 상태에서 상속된 메타데이터를 빈 문자열로 지운다.
   이름/버튼 색 변경으로 주 행동 검사를 맞추지 않는다.
3. 최종 수정 후 `npm run capture:begin`. 출력된 capture_id를 기록하고 **Figma 수정을 동결**한다.
   이 명령은 기존 검수를 무효화하는 pending manifest를 만든다. 규칙·시안·계약·에셋의 SHA-256을 기록한다.
4. 모든 required 상태의 스크린샷을 Figma에서 **새로 내보낸다**. 기존 PNG를 복사하거나 touch하지 않는다.
5. 코디네이터가 snapshot-runner에 세 페이지를 각각 요청한다. 모든 요청에 같은 CAPTURE_ID를 준다.
   추출기의 `__CAPTURE_ID__`를 그 값으로 치환. tokens=docs, components/screens=full.
   배치는 `snapshot-batches/{capture_id}/{slug}-*.json`에 저장한다.
   한 페이지의 전체 범위를 같은 ID로 병합한다. 이전 캡처 배치와 혼합하면 merge가 실패한다.
   **공유 figma-snapshot.json으로의 병합은 코디네이터가 직렬화**한다. runner끼리 동시에 병합하지 않는다.
6. 세 페이지의 check가 끝나고 PNG 재출력이 끝나면 `npm run capture:seal`.
   입력이 변하지 않았는지, 세 페이지가 동일 캡처인지, 필수 상태/행동/PNG가 있는지 검사한다.
   snapshot·PNG 해시를 manifest에 봉인하고 미평가 상태의 `visual-review.draft.json`을 만든다.
   seal은 시각/구조 품질 PASS가 아니다.
7. design-auditor가 `npm run audit` 실행. 결과에는 snapshot/rules/contract 파일 내용 해시가 포함된다.
8. auditor가 [UI 품질 기준](ui-quality.md)에 따라 preview와 PNG를 실제로 비교한다.
   draft의 null 점수·빈 근거를 관찰 결과로 채워 visual-review.json으로 저장한다.
   문제가 있으면 실패 점수/체크와 issues를 그대로 기록하고 fix-list를 작성한다.
9. `npm run check:evidence` → audit-report.md 작성 → `npm run check:screens`.
   모든 검사 PASS 뒤 기존 사용자 완료 승인을 받는다.

## 수정과 재개

Figma 수정 시 begin부터 다시 한다. 이전 PASS는 새 라운드의 근거가 아니다.
규칙·계약·시안·에셋 변경은 입력 해시, snapshot/PNG 변경은 산출물 해시로 검출한다.
같은 snapshot_date를 유지한 채 내용을 바꿔도 이전 audit은 만료된다.
pending은 추출 중, captured는 증거 봉인, 최종 완료 여부는 `check:screens`로 판정한다.
폴더 존재/로그의 ✅만으로 완료를 선언하지 않는다.

시각 검수는 `manifest_sha256 = SHA256(JSON.stringify(봉인된 manifest))`와 각 PNG 해시를 참조한다.
직접 계산하지 말고 스크립트가 만든 draft의 값을 유지한다. 점수만 전부 5로 채우는 작업은 검수가 아니다.
중요 결함을 수정했다고 쓴 경우 실제로 새 캡처에서 확인한 위치·결과를 resolution에 기록한다.

## 기존 프로젝트 업그레이드

기존 승인된 design-rules·Figma·스크린샷은 자동 변경하지 않는다.
새 게이트에서 계약/방향 기록/캡처 증거가 없으면 FAIL과 함께 보완할 파일을 알려준다.

1. `/build-structure`: 기존 screens/flows를 보존하며 계약으로 옮기고 필요한 상태의 범위를 확인.
2. `/generate-rules`: 기존 승인 방향이 있다면 그 근거를 기록; 없다면 대표 2안을 비교.
   실제 이미지·필수 상태·텍스트 정책을 프리뷰에 반영하고 변경분을 승인받는다.
3. `/create-figma STAGE=fix`: 승인된 범위에서 메타데이터·누락 상태·UI 결함을 보완.
4. 위 최종 캡처 순서 후 `/audit-design`.

독립 check-snapshot/figma-audit은 계약 없는 구형 fixture의 회귀 검증을 위해 옛 primary 검사를 유지한다.
이는 프로젝트 최종 게이트를 우회하는 방법이 아니다. check:structure/check:screens는 계약을 필수로 요구한다.

`--snapshot <별도 파일>`로 독립 실행하면 프로젝트 계약을 자동 탐색하지 않는다.
새 계약도 검사하려면 `--contract <경로>`를 함께 지정한다. 지정한 계약 파일이 없거나 잘못됐으면 실패한다.
