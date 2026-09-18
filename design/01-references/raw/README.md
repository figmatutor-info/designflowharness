# 수집 레퍼런스

**수집일:** 2026-09-18
**대상 PRD:** ./PRD.md ("허들링" — AI 실무 학습 플랫폼 + 멤버 자산 마켓)
**총 확정 화면:** 11장 (5개 앱)

> ✅ **다운로드 완료** — 아래 11장 모두 `raw/` 폴더에 실제 `.png` 파일로 저장됨.

## 앱별 수집 내역

### 크몽 (Kmong) — 재능/서비스 마켓

- 선정 이유: AI 추천·검색 카드형 UI, 서비스 비교 테이블 → "허들링 픽" 검색/비교 화면에 참고
- 확정 화면 2장
  - 001-kmong-ai-search.png — AI 검색/추천 카드 화면
    - https://d31var7gpnk8lm.cloudfront.net/new-6595360c-fef1-40ce-9011-f87428d7a031/new-b75a128d-0eae-4a52-9a0b-f245a62afabc/f258205d-4404-4e06-b953-f5e56458c8d6/ai1.png
  - 002-kmong-compare.png — 서비스 비교 테이블 화면
    - https://d31var7gpnk8lm.cloudfront.net/new-8d404bb9-24ce-459a-8e35-e7750ddc8d7a/new-fc150626-bdaf-4c21-93af-06dde1fe1d31/9cc5dfa9-8a12-4161-8a4c-5254ae5f0af3/ai14.png

### 클래스101 (Class101) — 강의 카탈로그

- 선정 이유: 강의 검색/카탈로그, 주문내역 상태 표시 → "스킬 라이브러리" 검색, "미션 상세" 제출 상태에 참고
- 확정 화면 2장
  - 003-class101-search.png — 검색 화면
    - https://d31var7gpnk8lm.cloudfront.net/cm47zfbpl005nl10ck5vvz085/7836576b-1ca8-4b86-abf6-ae89c7c660dd/IMG_6629.png
  - 004-class101-order.png — 주문/내역 상태 화면
    - https://d31var7gpnk8lm.cloudfront.net/cm47zfbpl005nl10ck5vvz085/24fb64ba-3d94-482d-976c-7ce4e0fbb4b6/IMG_6659.png

### 프립 (Frip) — 취미·클래스 마켓

- 선정 이유: 카테고리 그리드 필터, 검색+필터 리스트 → "스킬 라이브러리"의 카테고리/난이도 필터 그리드에 참고
- 확정 화면 2장
  - 005-frip-category.png — 카테고리 필터 그리드 (프립찾기)
    - https://d31var7gpnk8lm.cloudfront.net/undefined/1060d9fb-b6ef-47cc-a0f7-74d9e442bd9e/01.png
  - 006-frip-search.png — 검색+필터 리스트
    - https://d31var7gpnk8lm.cloudfront.net/clvezpppy001alb08cseqjc7h/5535aa41-496b-487a-ab2a-46611d6344d0/img_7075.png

### 차란 (Charan) — 브랜드 중고거래 (PRD §10 확장: 자산 등록/판매 검수 UI 커버 위해 채택)

- 선정 이유: 상품 등록 폼, 판매완료 상태 뱃지, AI 검수 로딩 → "내 자산" 등록·상태뱃지·판매수익 요약에 직접 참고
- 확정 화면 3장
  - 007-charan-asset-register.png — 직접판매 상품등록 폼
    - https://d31var7gpnk8lm.cloudfront.net/new/7cc73562-2933-40ef-996a-24b4bc08e9a3/app_charan_202609_107.png
  - 008-charan-pdp-sold.png — 상품 상세 · 판매완료 상태 뱃지
    - https://d31var7gpnk8lm.cloudfront.net/new/c81c8861-8113-4cfc-88f3-17b11ecf491e/app_charan_202609_96.png
  - 009-charan-ai-loading.png — AI 분석중 로딩(검수 흐름)
    - https://d31var7gpnk8lm.cloudfront.net/new/fef0bb16-6a8d-4364-8c5b-26dbc0748117/app_charan_202609_1.png

### 플랭 / 말해보카 — 교육&도서 (PRD §10 확장: 미션/진행률 UI 커버 위해 채택)

- 선정 이유: 진행률 인디케이터, 게이미피케이션 도전과제 → "홈"의 미션 진행률/D-day 카드, "미션 상세" 진행 상태에 참고
- 확정 화면 2장
  - 010-plang-progress.png — 통계·리포트 진행률 바 (플랭)
    - https://d31var7gpnk8lm.cloudfront.net/new-6aab93fa-cb04-4d8a-a3ac-da3e036bd6d6/new-47c6f45e-9f40-4700-84a1-b9097c63a5ad/4039c4f4-05c0-4e80-a370-ae988b6b33a7/app_plang_202608_37.png
  - 011-malhaeboca-challenge.png — 게이미피케이션 도전과제 진행률 (말해보카)
    - https://d31var7gpnk8lm.cloudfront.net/new-52343dd3-fa87-4fbb-a68f-9172168790ab/new-53aa1240-2e2e-47ea-9a76-fb12efb9b0c6/86ba88cc-4318-4c79-bccf-eadff050c3fe/s11.png

## 검색 키워드 / 조회 방식

- filter_by_app: 클래스101, 크몽, 홀리스(0건), 프립, 탈잉(0건), 차란
- search_ui_patterns: "챌린지 진행률"(0건 → 추천 목록 확인), "목록 (PLP)" (category=교육&도서)
- search_components: "배지"+pattern="판매" (판매 상태 뱃지), "프로그레스 인디케이터"+category="교육&도서" (미션 진행률)
- 참고: 홀리스·탈잉은 uibowl 검색 결과 0건 → PRD §10 지침에 따라 교육/지식마켓 외 카테고리(커머스: 차란)까지 확장해 자산 등록/판매 상태 패턴을 보강함

## 다음 단계

- reference-analyzer 실행하여 analysis.md 생성
