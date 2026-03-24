# HANDOOF - 개발 현황

> 최종 수정: 2026-03-24

---

## 완료 ✅

| 분류 | 항목 | 파일 |
|------|------|------|
| 🔴 버그 | PlayArea 도전 전 카드 숨김 (`revealed` 로직) | `components/PlayArea.tsx` |
| 🔴 버그 | AI `black_joker` 탈취 카드 소멸 수정 | `store/gameStore.ts` |
| 🔴 버그 | 백엔드 `black_joker` 탈취 카드 소멸 수정 | `backend/src/index.ts` |
| 🔴 버그 | 특수 카드 `discardPile` 진입 차단 (`isSpecial` 필터) | `store/gameStore.ts`, `backend/src/index.ts` |
| 🔴 버그 | 점수 계산 반전 — 남은 카드 패널티(음수) 적용 | `store/gameStore.ts`, `backend/src/index.ts` |
| 🔴 버그 | `calcRoundScore` `_endRound()` 연동 (콤보 보너스 누락) | `store/gameStore.ts` |
| 🔴 버그 | 드로우 파일 소진 시 재셔플 → 즉시 라운드 종료 | `store/gameStore.ts` |
| 🔴 보안 | `cards_played` 이벤트 `cards` 배열 제거 → `cardCount`만 전송 | `backend/src/index.ts` |
| 🟡 기능 | 특수 카드 효과 구현 (handoof/nullify/black_joker/red_joker) | `store/gameStore.ts` |
| 🟡 기능 | 특수 카드 4종 고유 색상 적용 | `components/Card.tsx` |
| 🟡 기능 | `MultiPlayer` 타입에 `passStreak` 추가 + Pass 버튼 표시 수정 | `store/multiStore.ts`, `screens/MultiGameScreen.tsx` |
| 🟡 기능 | `MultiLastPlay` 타입 정의 (`lastPlay: any` 제거) | `store/multiStore.ts` |
| 🟡 기능 | `MultiGameScreen` 하드코딩 영어 → `i18n` 연동 | `screens/MultiGameScreen.tsx` |
| 🟡 기능 | 인게임 플레이 로그 패널 구현 (`PlayLogEntry` 3상태) | `types.ts`, `store/*`, `screens/GameScreen.*`, `screens/MultiGameScreen.*` |
| 🟡 기능 | 선언 블록 UX — 턴 시작 시 닫힘, 카드 선택 시 열림 | `screens/GameScreen.tsx`, `screens/MultiGameScreen.tsx` |
| 🟡 UX | `btn-declare-open` CSS 스타일 추가 | `screens/GameScreen.css` |
| 🟡 UX | 닉네임 미입력 시 시작 버튼 비활성화 | `screens/LobbyScreen.tsx` |
| 🟢 기타 | `index.html` 타이틀 → "HANDOOF" | `dev/index.html` |
| 🟢 기타 | 멀티플레이어 전체 구현 (Socket.io, 방 시스템, 이모지) | `backend/src/index.ts`, `backend/src/rooms.ts`, `store/multiStore.ts` |

---

## 미완료 🔧

### 🔴 높음 — 버그 / 게임 밸런스

| # | 항목 | 수정 위치 |
|---|------|-----------|
| 5-17 | 도전 성공 시 블러퍼가 낸 카드 전부 손패 회수 (특수 카드 제외) | `backend/src/index.ts: resolveChallenge()`, `store/gameStore.ts: _resolveChallenge()` |
| 5-18 | 2장 낼 수 없도록 검증 — Play 버튼 비활성화 + 서버 reject | `backend/src/index.ts`, `screens/GameScreen.tsx`, `screens/MultiGameScreen.tsx` |
| 5-16 | 상대 handCount 마스킹 — challenge 해소 전까지 숨김 | `backend/src/index.ts: broadcastRoom()` |
| 5-12 | 턴 종료 시 lastPlay 카드 공개 — `skipChallenge()` reveal 딜레이 | `backend/src/index.ts: skipChallenge()`, `components/PlayArea.tsx` |
| 5-13 | 도전 점수 — 선언 타입별 차등 적용 확인 | `backend/src/game/scoring.ts`, `store/gameStore.ts` |
| 5-15 | NL 반응형 카운터 — 상대 특수 카드 발동 전 `nl_counter` 창 구현 | 신규 설계 |

### 🟡 중간 — UX / 기능 개선

| # | 항목 | 수정 위치 |
|---|------|-----------|
| 5-19 | i18n "슈트" → "모양", 점수 설명 마이너스 표기 정리 | `src/i18n.ts` |
| — | 턴마다 점수 변화 시각적 표시 (+N/-N 애니메이션) | `screens/GameScreen.tsx`, `screens/MultiGameScreen.tsx` |
| — | red_joker suit/rank 자유 선언 UI | `screens/GameScreen.tsx`, `screens/MultiGameScreen.tsx` |
| — | 메인 화면에 콤보 예시 섹션 추가 | `screens/MainScreen.tsx` |
| — | 재접속 처리 | `backend/src/index.ts`, `store/multiStore.ts` |

### 🟢 낮음 — 인프라 / 반응형

| # | 항목 |
|---|------|
| — | Redis 도입 (현재 메모리 Map) |
| — | 모바일 반응형 CSS |
