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
      '매 턴 드로우 덱 또는 버린 덱에서 카드 1장 뽑기',
      '손패에서 정확히 3장을 내고 조합 타입 선언 (특수카드는 1장 단독 플레이)',
      '상대방은 선언이 거짓이라 판단하면 도전(Challenge) 가능',
      '도전 성공 (허풍 적발): 도전자 +3점, 허풍쟁이 선언 조합 점수만큼 감점',
      '도전 실패 (정직 확인): 도전자 -2점, 정직한 플레이어 +3점',
      '연속 패스는 최대 2회까지 가능',
      '3라운드 후 누적 점수가 가장 높은 플레이어 승리',
    ],

    // Scoring
    scoring_title: '점수 체계',
    scoring: [
      '플러시 (같은 모양 3장): 3점',
      '스트레이트 (연속 숫자 3장): 5점',
      '트리플 (같은 숫자 3장): 8점',
      '스트레이트플러시 (연속+같은 모양 3장): 15점',
      '핸드아웃 (먼저 손패 0장): 5점',
    ],

    // Combos
    combos_title: '조합 예시',
    combos: [
      { label: '플러시', desc: '같은 모양 3장', example: ['♥3', '♥7', '♥K'] },
      { label: '스트레이트', desc: '연속 숫자 3장', example: ['♠5', '♦6', '♣7'] },
      { label: '트리플', desc: '같은 숫자 3장', example: ['♠9', '♥9', '♦9'] },
      { label: '스트레이트플러시', desc: '연속+같은 모양 3장', example: ['♥5', '♥6', '♥7'] },
    ],

    // Special Cards
    special_title: '특수 카드',
    special_cards: [
      { rank: 'HF', suit: 'joker', color: '#9c27b0', name: 'HANDOOF', count: '×2', desc: '손패 전체를 상대와 교환' },
      { rank: 'NL', suit: 'joker', color: '#00bcd4', name: 'Nullify', count: '×2', desc: '상대의 방금 낸 카드를 무효화' },
      { rank: 'RJ', suit: 'joker', color: '#ff5722', name: 'Red Joker', count: '×2', desc: '어떤 슈트·숫자로도 선언 가능' },
      { rank: 'BJ', suit: 'joker', color: '#607d8b', name: 'Black Joker', count: '×2', desc: '상대 손패에서 카드 1장 탈취' },
    ],

    // Game Screen
    round: '라운드',
    thinking: '생각 중...',
    no_cards: '패 없음',
    score: '점수',
    cards: '장',
    draw_pile: '드로우 덱',
    discard: '버린 덱',
    declare: '선언:',
    draw_hint: '드로우 덱 또는 버린 덱을 클릭해 카드를 뽑으세요',
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
      straight_flush: '스트레이트플러시',
      special: '스페셜',
    },
    timer_play: '플레이',
    timer_challenge: '도전',

    // Multi Game UI
    leave_btn: '나가기',
    deciding: '결정 중...',
    disconnected: '접속 끊김',
    nullify_use: '★ Nullify 사용',
    nullify_skip: '패스',
    waiting_nullify_opp: '상대가 Nullify 여부 결정 중...',
    waiting_for: (name: string) => `${name} 대기 중...`,
    you_label: '(나)',
    hand_label: '패',
    special_hint: '★ 스페셜 카드 — 바로 낼 수 있습니다',
    rj_hint_text: '★ Red Joker: 도전 불가',
    pile_empty: '비어있음',
    pile_cards: (n: number) => `${n}장`,
    by: '선언자',
    last_play: '마지막 플레이',
    declared_label: '선언:',
    no_play_yet: '아직 낸 카드 없음',

    // Single Game Messages (gameStore)
    msg_draw_start: '카드를 뽑아 턴을 시작하세요.',
    msg_draw_empty: '드로우 덱이 비었습니다! 라운드 종료.',
    msg_select_play: '1~3장을 선택해 내거나 패스하세요.',
    msg_nullify_cancel: 'Nullify! 이전 플레이가 취소됐습니다.',
    msg_ai_nullify_deciding: 'AI가 Nullify 사용 여부를 결정 중...',
    msg_ai_nullify_used: 'AI가 Nullify 사용! 특수카드 취소.',
    msg_special_played: '특수카드를 냈습니다.',
    msg_timeout: '시간 초과! -2점. 자동 패스.',
    msg_ai_passed: 'AI가 패스했습니다.',
    msg_ai_round_over: 'AI가 마지막 카드를 냈습니다! 라운드 종료.',
    msg_ai_nullify_played: 'AI가 Nullify를 사용했습니다! 이전 플레이 취소.',
    msg_your_turn: '내 턴! 카드를 뽑으세요.',
    msg_human_round_over: (name: string) => `${name}이(가) 마지막 카드를 냈습니다! 라운드 종료.`,
    msg_you_played: (count: number, type: string) => `${count}장을 "${type}"으로 선언. AI가 도전 여부 결정 중...`,
    msg_ai_special: 'AI가 특수카드를 냈습니다. Nullify로 취소할까요?',
    msg_ai_special_no_nl: 'AI가 특수카드를 냈습니다.',
    msg_ai_played: (count: number, type: string) => `AI가 ${count}장을 "${type}"으로 선언. 도전?`,

    // Multi Game Messages
    msg_game_started: '게임 시작! 카드를 뽑으세요.',
    msg_your_turn_draw: '내 턴 — 카드를 뽑으세요.',
    msg_challenge_or_pass: '도전 또는 패스?',
    msg_use_nullify: '상대가 특수카드 사용! Nullify 쓸까요?',
    msg_select_cards: '낼 카드를 선택하세요.',
    msg_opp_deciding: (name: string) => `${name}님이 결정 중...`,
    msg_round_over: '라운드 종료! 다음 라운드 시작...',
    msg_player_dc: '플레이어 접속 끊김. 재연결 대기 중...',
    msg_nullify_used: 'Nullify 사용됨! 카드 취소.',
    msg_passed: (name: string) => `${name}이(가) 패스.`,
    msg_bluff_caught: (type: string, delta: string) => `허풍 적발! 실제 조합: ${type}. 점수: ${delta}`,
    msg_bluff_held: (type: string, delta: string) => `허풍 성공! 실제 조합: ${type}. 점수: ${delta}`,

    // Turn Announcements
    announce_your_turn: '내 턴!',
    announce_opp_turn: (name: string) => `${name}의 턴`,
    announce_challenge: '도전 찬스!',
    announce_nl: '★ Nullify 기회!',
    announce_round: (n: number) => `라운드 ${n}`,

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
      'Play exactly 3 cards and declare a hand type (special cards: 1 card alone)',
      'Opponent can Challenge your declaration',
      'Challenge succeeds (bluff caught): challenger +3, bluffer loses declared combo points',
      'Challenge fails (honest confirmed): challenger -2, honest player +3',
      'Max 2 consecutive passes allowed',
      '3 rounds — highest cumulative score wins!',
    ],

    // Scoring
    scoring_title: 'Scoring',
    scoring: [
      'Flush (3 cards, same suit): 3 pts',
      'Straight (3 consecutive ranks): 5 pts',
      'Triple (3 cards, same rank): 8 pts',
      'Straight Flush (consecutive + same suit): 15 pts',
      'Handout (first to empty hand): 5 pts',
    ],

    // Combos
    combos_title: 'Combo Examples',
    combos: [
      { label: 'Flush', desc: '3 cards, same suit', example: ['♥3', '♥7', '♥K'] },
      { label: 'Straight', desc: '3 consecutive ranks', example: ['♠5', '♦6', '♣7'] },
      { label: 'Triple', desc: '3 cards, same rank', example: ['♠9', '♥9', '♦9'] },
      { label: 'Straight Flush', desc: 'consecutive + same suit', example: ['♥5', '♥6', '♥7'] },
    ],

    // Special Cards
    special_title: 'Special Cards',
    special_cards: [
      { rank: 'HF', suit: 'joker', color: '#9c27b0', name: 'HANDOOF', count: '×2', desc: 'Swap entire hand with opponent' },
      { rank: 'NL', suit: 'joker', color: '#00bcd4', name: 'Nullify', count: '×2', desc: "Invalidate opponent's last play" },
      { rank: 'RJ', suit: 'joker', color: '#ff5722', name: 'Red Joker', count: '×2', desc: 'Declare any suit and rank' },
      { rank: 'BJ', suit: 'joker', color: '#607d8b', name: 'Black Joker', count: '×2', desc: 'Steal 1 random card from opponent' },
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
      straight_flush: 'str.flush',
      special: 'special',
    },
    timer_play: 'Play',
    timer_challenge: 'Challenge',

    // Multi Game UI
    leave_btn: 'Leave',
    deciding: 'Deciding...',
    disconnected: 'Disconnected',
    nullify_use: '★ Use Nullify',
    nullify_skip: 'Skip',
    waiting_nullify_opp: 'Opponent deciding Nullify...',
    waiting_for: (name: string) => `Waiting for ${name}...`,
    you_label: '(You)',
    hand_label: 'Hand',
    special_hint: '★ Special card — play immediately',
    rj_hint_text: '★ Red Joker: challenge-proof',
    pile_empty: 'Empty',
    pile_cards: (n: number) => `${n} cards`,
    by: 'by',
    last_play: 'Last Play',
    declared_label: 'declared:',
    no_play_yet: 'No cards played yet',

    // Single Game Messages (gameStore)
    msg_draw_start: 'Draw a card to start your turn.',
    msg_draw_empty: 'Draw pile empty! Round over.',
    msg_select_play: 'Select 1-3 cards to play, or pass.',
    msg_nullify_cancel: 'Nullify! Previous play is cancelled.',
    msg_ai_nullify_deciding: 'AI is deciding whether to use Nullify...',
    msg_ai_nullify_used: 'AI used Nullify! Special card cancelled.',
    msg_special_played: 'You played a special card.',
    msg_timeout: 'Time up! -2 points. Auto-passing.',
    msg_ai_passed: 'AI passed.',
    msg_ai_round_over: "AI played their last card(s)! Round over.",
    msg_ai_nullify_played: 'AI played Nullify! Previous play is cancelled.',
    msg_your_turn: 'Your turn! Draw a card.',
    msg_human_round_over: (name: string) => `${name} played their last card(s)! Round over.`,
    msg_you_played: (count: number, type: string) => `You played ${count} card(s) as "${type}". AI can challenge...`,
    msg_ai_special: 'AI played a special card. Use Nullify to cancel?',
    msg_ai_special_no_nl: 'AI played a special card.',
    msg_ai_played: (count: number, type: string) => `AI played ${count} card(s) as "${type}". Challenge?`,

    // Multi Game Messages
    msg_game_started: 'Game started! Draw a card.',
    msg_your_turn_draw: 'Your turn — draw a card.',
    msg_challenge_or_pass: 'Challenge or pass?',
    msg_use_nullify: 'Opponent played a special card — use Nullify?',
    msg_select_cards: 'Select cards to play.',
    msg_opp_deciding: (name: string) => `${name} is deciding...`,
    msg_round_over: 'Round over! Next round starting...',
    msg_player_dc: 'A player disconnected. Waiting for reconnect...',
    msg_nullify_used: 'Nullify used! Play cancelled.',
    msg_passed: (name: string) => `${name} passed.`,
    msg_bluff_caught: (type: string, delta: string) => `Bluff caught! Actual: ${type}. Score: ${delta}`,
    msg_bluff_held: (type: string, delta: string) => `Bluff held! Actual: ${type}. Score: ${delta}`,

    // Turn Announcements
    announce_your_turn: 'Your Turn!',
    announce_opp_turn: (name: string) => `${name}'s Turn`,
    announce_challenge: 'Challenge!',
    announce_nl: '★ Nullify Chance!',
    announce_round: (n: number) => `Round ${n}`,

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
  hand_types: { single: string; flush: string; straight: string; triple: string; straight_flush: string; special: string };
  timer_play: string;
  timer_challenge: string;
  // Multi Game UI
  leave_btn: string;
  deciding: string;
  disconnected: string;
  nullify_use: string;
  nullify_skip: string;
  waiting_nullify_opp: string;
  waiting_for: (name: string) => string;
  you_label: string;
  hand_label: string;
  special_hint: string;
  rj_hint_text: string;
  pile_empty: string;
  pile_cards: (n: number) => string;
  by: string;
  last_play: string;
  declared_label: string;
  no_play_yet: string;
  // Single Game Messages
  msg_draw_start: string;
  msg_draw_empty: string;
  msg_select_play: string;
  msg_nullify_cancel: string;
  msg_ai_nullify_deciding: string;
  msg_ai_nullify_used: string;
  msg_special_played: string;
  msg_timeout: string;
  msg_ai_passed: string;
  msg_ai_round_over: string;
  msg_ai_nullify_played: string;
  msg_your_turn: string;
  msg_human_round_over: (name: string) => string;
  msg_you_played: (count: number, type: string) => string;
  msg_ai_special: string;
  msg_ai_special_no_nl: string;
  msg_ai_played: (count: number, type: string) => string;
  // Multi Game Messages
  msg_game_started: string;
  msg_your_turn_draw: string;
  msg_challenge_or_pass: string;
  msg_use_nullify: string;
  msg_select_cards: string;
  msg_opp_deciding: (name: string) => string;
  msg_round_over: string;
  msg_player_dc: string;
  msg_nullify_used: string;
  msg_passed: (name: string) => string;
  msg_bluff_caught: (type: string, delta: string) => string;
  msg_bluff_held: (type: string, delta: string) => string;
  // Turn Announcements
  announce_your_turn: string;
  announce_opp_turn: (name: string) => string;
  announce_challenge: string;
  announce_nl: string;
  announce_round: (n: number) => string;
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
