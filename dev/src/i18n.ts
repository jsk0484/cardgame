export type Lang = 'ko' | 'en';

export const translations = {
  ko: {
    // Main Screen
    subtitle: '블러핑 카드게임',
    nickname_placeholder: '닉네임 입력',
    play_vs_ai: '▶ AI와 대결',
    deck_info: '60장 덱 · 싱글 플레이',

    // Rules
    rules_title: '게임 방법',
    rules: [
      '매 턴 드로우 파일 또는 버린 파일에서 카드 1장 뽑기',
      '손패에서 1~3장을 조합해 테이블에 제출하고 조합 타입을 선언',
      '상대방은 선언이 거짓이라 판단하면 도전(Challenge) 가능',
      '도전 성공 (허풍 적발): 도전자 +3점 / 허풍쟁이 -2점',
      '도전 실패 (허풍 성공): 도전자 -2점 / 허풍쟁이 +3점',
      '연속 패스는 최대 2회까지 가능',
      '3라운드 후 누적 점수가 가장 높은 플레이어 승리',
    ],

    // Scoring
    scoring_title: '점수 체계',
    scoring: [
      '카드 숫자 합산 (A=1, J=11, Q=12, K=13, 조커=15)',
      '같은 슈트 3장 이상 (플러시): +5',
      '연속 숫자 3장 이상 (스트레이트): +5',
      '같은 숫자 3장 (트리플): +8',
      '먼저 손패 0장 (핸드아웃): +10',
    ],

    // Combos
    combos_title: '조합 예시',
    combos: [
      { label: '싱글', desc: '카드 1장', example: ['♠7'] },
      { label: '플러시', desc: '같은 슈트 3장', example: ['♥3', '♥7', '♥K'] },
      { label: '스트레이트', desc: '연속 숫자 3장', example: ['♠5', '♦6', '♣7'] },
      { label: '트리플', desc: '같은 숫자 3장', example: ['♠9', '♥9', '♦9'] },
    ],

    // Special Cards
    special_title: '특수 카드',
    special_cards: [
      { rank: 'HF', suit: 'joker', color: 'purple', name: 'HANDOOF', count: '×2', desc: '손패 전체를 상대와 교환' },
      { rank: 'NL', suit: 'club', color: 'green', name: 'Nullify', count: '×2', desc: '상대의 방금 낸 카드를 무효화' },
      { rank: 'RJ', suit: 'joker', color: '#cc3333', name: 'Red Joker', count: '×2', desc: '어떤 슈트·숫자로도 선언 가능' },
      { rank: 'BJ', suit: 'joker', color: '#333', name: 'Black Joker', count: '×2', desc: '상대 손패에서 카드 1장 탈취' },
    ],

    // Game Screen
    round: '라운드',
    thinking: '생각 중...',
    no_cards: '패 없음',
    score: '점수',
    cards: '장',
    draw_pile: '드로우 파일',
    discard: '버린 파일',
    declare: '선언:',
    draw_hint: '드로우 파일 또는 버린 파일을 클릭해 카드를 뽑으세요',
    play: '내기',
    pass: '패스',
    challenge: '도전!',
    no_challenge: '패스',
    waiting_ai_challenge: 'AI가 도전 여부를 결정 중...',
    ai_thinking: 'AI가 턴을 진행 중...',
    hand_types: {
      single: '싱글',
      flush: '플러시',
      straight: '스트레이트',
      triple: '트리플',
      special: '스페셜',
    },
    timer_play: '플레이',
    timer_challenge: '도전',

    // Result Screen
    tie: '무승부!',
    wins: '승리!',
    final_scores: '최종 점수 — 3라운드 완료',
    ai_opponent: 'AI 상대',
    you: '나',
    won_by: (pts: number) => `${pts}점 차이로 승리!`,
    lost_by: (pts: number) => `AI가 ${pts}점 차이로 승리.`,
    play_again: '다시 하기',
    main_menu: '메인 메뉴',
  },
  en: {
    // Main Screen
    subtitle: 'The Bluffing Card Game',
    nickname_placeholder: 'Enter your nickname',
    play_vs_ai: '▶ Play vs AI',
    deck_info: '60-card deck · Single player',

    // Rules
    rules_title: 'How to Play',
    rules: [
      'Draw 1 card each turn from the draw pile or discard pile',
      'Play 1–3 cards and declare a hand type',
      'Opponent can Challenge your declaration',
      'Challenge succeeds (bluff caught): challenger +3 / bluffer -2',
      'Challenge fails (bluff holds): challenger -2 / bluffer +3',
      'Max 2 consecutive passes allowed',
      '3 rounds — highest cumulative score wins!',
    ],

    // Scoring
    scoring_title: 'Scoring',
    scoring: [
      'Card value sum (A=1, J=11, Q=12, K=13, Joker=15)',
      'Flush — 3+ cards same suit: +5',
      'Straight — 3+ consecutive ranks: +5',
      'Triple — 3 cards same rank: +8',
      'Handout — first to empty hand: +10',
    ],

    // Combos
    combos_title: 'Combo Examples',
    combos: [
      { label: 'Single', desc: 'Any 1 card', example: ['♠7'] },
      { label: 'Flush', desc: '3 cards, same suit', example: ['♥3', '♥7', '♥K'] },
      { label: 'Straight', desc: '3 consecutive ranks', example: ['♠5', '♦6', '♣7'] },
      { label: 'Triple', desc: '3 cards, same rank', example: ['♠9', '♥9', '♦9'] },
    ],

    // Special Cards
    special_title: 'Special Cards',
    special_cards: [
      { rank: 'HF', suit: 'joker', color: 'purple', name: 'HANDOOF', count: '×2', desc: 'Swap entire hand with opponent' },
      { rank: 'NL', suit: 'club', color: 'green', name: 'Nullify', count: '×2', desc: "Invalidate opponent's last play" },
      { rank: 'RJ', suit: 'joker', color: '#cc3333', name: 'Red Joker', count: '×2', desc: 'Declare any suit and rank' },
      { rank: 'BJ', suit: 'joker', color: '#333', name: 'Black Joker', count: '×2', desc: 'Steal 1 random card from opponent' },
    ],

    // Game Screen
    round: 'Round',
    thinking: 'thinking...',
    no_cards: 'No cards',
    score: 'Score',
    cards: 'cards',
    draw_pile: 'Draw Pile',
    discard: 'Discard',
    declare: 'Declare:',
    draw_hint: 'Click Draw Pile or Discard Pile to draw',
    play: 'Play',
    pass: 'Pass',
    challenge: 'Challenge!',
    no_challenge: 'No Challenge',
    waiting_ai_challenge: 'Waiting for AI challenge decision...',
    ai_thinking: 'AI is taking its turn...',
    hand_types: {
      single: 'single',
      flush: 'flush',
      straight: 'straight',
      triple: 'triple',
      special: 'special',
    },
    timer_play: 'Play',
    timer_challenge: 'Challenge',

    // Result Screen
    tie: "It's a Tie!",
    wins: 'Wins!',
    final_scores: 'Final Scores — 3 Rounds Complete',
    ai_opponent: 'AI Opponent',
    you: 'You',
    won_by: (pts: number) => `You won by ${pts} points!`,
    lost_by: (pts: number) => `AI won by ${pts} points.`,
    play_again: 'Play Again',
    main_menu: 'Main Menu',
  },
} as const;

export type SpecialCard = { rank: string; suit: string; color: string; name: string; count: string; desc: string };
export type Combo = { label: string; desc: string; example: readonly string[] };

export type T = {
  subtitle: string;
  nickname_placeholder: string;
  play_vs_ai: string;
  deck_info: string;
  rules_title: string;
  rules: readonly string[];
  scoring_title: string;
  scoring: readonly string[];
  combos_title: string;
  combos: readonly Combo[];
  special_title: string;
  special_cards: readonly SpecialCard[];
  round: string;
  thinking: string;
  no_cards: string;
  score: string;
  cards: string;
  draw_pile: string;
  discard: string;
  declare: string;
  draw_hint: string;
  play: string;
  pass: string;
  challenge: string;
  no_challenge: string;
  waiting_ai_challenge: string;
  ai_thinking: string;
  hand_types: { single: string; flush: string; straight: string; triple: string; special: string };
  timer_play: string;
  timer_challenge: string;
  tie: string;
  wins: string;
  final_scores: string;
  ai_opponent: string;
  you: string;
  won_by: (pts: number) => string;
  lost_by: (pts: number) => string;
  play_again: string;
  main_menu: string;
};
