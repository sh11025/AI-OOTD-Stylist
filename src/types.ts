export type ClothingCategory = 'outer' | 'top' | 'bottom' | 'shoes' | 'accessory' | 'bag';

export type SeasonType = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export type Thickness = 'thin' | 'medium' | 'thick' | 'heavy';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  secondaryColor?: string;
  imageUrl: string;
  seasons: ('spring' | 'summer' | 'fall' | 'winter')[];
  minTemp: number; // in Celsius
  maxTemp: number; // in Celsius
  formality: number; // 1 (Ultra Casual) - 5 (Formal/Black Tie)
  styleTags: string[];
  material: string;
  thickness: Thickness;
  waterproof?: boolean;
  windproof?: boolean;
  isFavorite?: boolean;
  timesWorn?: number;
  lastWornDate?: string;
  inLaundry?: boolean;
  createdAt: string;
  notes?: string;
}

export type WeatherConditionType = 
  | 'Clear' 
  | 'Clouds' 
  | 'Rain' 
  | 'Snow' 
  | 'Wind' 
  | 'Drizzle' 
  | 'Thunderstorm' 
  | 'Mist';

export interface ThreeHourWeatherSlot {
  timeLabel: string; // e.g. "00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"
  timeName: string;  // e.g. "자정/새벽", "새벽", "이른아침", "오전/등교", "점심/낮", "오후/최고", "저녁/퇴근", "밤/야간"
  temp: number;      // in Celsius
  feelsLike: number;
  condition: WeatherConditionType;
  description: string;
  humidity: number;  // %
  precipitationProb: number; // %
  windSpeed: number; // m/s
  isCurrentTimeSlot?: boolean;
}

export interface WeatherInfo {
  city: string;
  temp: number; // in Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  condition: WeatherConditionType;
  description: string;
  humidity: number; // %
  windSpeed: number; // m/s
  precipitationProb?: number; // %
  uvIndex?: number;
  isManual: boolean;
  updatedAt: string;
  hourlyForecast?: ThreeHourWeatherSlot[];
  selectedHourSlot?: string; // e.g. "09:00"
}

export interface TPOScenario {
  id: string;
  name: string;
  category: 'formal' | 'business_casual' | 'daily' | 'date' | 'active' | 'lounge' | 'home' | 'work' | 'travel';
  description: string;
  iconName: string;
  formalityTarget: number; // 1-5
  activityLevel: 'low' | 'medium' | 'high';
  indoorOutdoor: 'mostly_indoor' | 'balanced' | 'mostly_outdoor';
  recommendedStyles: string[];
  tagColor: string;
}

export type GenderType = 'male' | 'female' | 'unisex';

export type BodyType = 
  | 'hourglass'          // 모래시계형
  | 'inverted_triangle' // 역삼각형 (어깨 발달)
  | 'rectangle'         // 직사각형 (슬림 일자형)
  | 'pear'              // 조롱박/하체 발달형
  | 'apple'             // 원형/상체 발달형
  | 'athletic'          // 탄탄 근육형
  | 'slim'              // 마른 체형
  | 'plus';             // 볼륨/플러스 체형

export type PersonalColorType = 
  | 'spring_light' 
  | 'spring_bright' 
  | 'summer_light' 
  | 'summer_muted' 
  | 'summer_bright' 
  | 'fall_muted' 
  | 'fall_strong' 
  | 'fall_deep' 
  | 'winter_bright' 
  | 'winter_deep' 
  | 'neutral_light' 
  | 'neutral_dark';

export type AppTheme = 'light' | 'dark' | 'system' | 'editorial_beige' | 'modern_dark' | 'minimal_monochrome';

export type WindowSizeOption = '1280x850' | '1440x900' | '1600x900' | '1920x1080' | '전체화면';

export interface UserProfile {
  gender: GenderType;
  height: number; // cm
  weight: number; // kg
  bodyType: BodyType;
  personalColor: PersonalColorType;
  avoidColors?: string[]; // 피해야 할 워스트 컬러 목록
  temperatureOffset?: number; // 체감 온도 민감도 보정치 (-4 ~ +4°C, 음수=추위탐, 양수=더위탐)
  stylePreferences: string[];
  preferredStyles?: string[];
  coldSensitivity: 'sensitive' | 'normal' | 'resistant'; // 추위 민감도
  openWeatherApiKey: string;
  defaultCity: string;
  geminiApiKey: string;
  geminiModel?: GeminiModelId; // 사용자가 선택한 Gemini 모델
  theme?: AppTheme;
  windowSize?: WindowSizeOption; // 화면 규격 설정
}


export interface OutfitItems {
  outer?: ClothingItem;
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem;
  accessory?: ClothingItem;
  bag?: ClothingItem;
}

export interface OutfitColorHarmony {
  toneMatching: string;
  paletteHexes: string[];
  explanation: string;
}

export interface OutfitLayeringStrategy {
  level: string;
  advice: string;
}

export interface OutfitDossierSummary {
  conceptTitle: string;
  conceptDescription: string;
  stylingRules: string[];
  whatToAvoid: string;
  alternativeShoes: string;
}

export interface OutfitRecommendation {
  optionId: 'A' | 'B';
  title: string;
  subtitle: string;
  vibe: string;
  items: OutfitItems;
  scores: {
    weatherScore: number;  // 0 - 100
    tpoScore: number;      // 0 - 100
    personalScore: number; // 0 - 100
    totalScore: number;    // 0 - 100
  };
  scoreDetails: {
    weatherFitReason: string;
    tpoFitReason: string;
    personalFitReason: string;
  };
  stylistAdvice: string;
  layeringTip: string;
  colorHarmony: string | OutfitColorHarmony;
  layeringStrategy?: OutfitLayeringStrategy;
  formalityLevel?: number;
  dossier?: OutfitDossierSummary;
  weatherCaution?: string;
}

export interface OutfitGenerationResult {
  optionA: OutfitRecommendation;
  optionB: OutfitRecommendation;
  overallSummary: string;
  temperatureAssessment: string;
  recommendedAccessoriesTip?: string;
}

export interface SavedOutfit {
  id: string;
  date: string;
  time?: string;
  weather: WeatherInfo;
  tpo: TPOScenario;
  recommendation: OutfitRecommendation;
  isLoggedWear?: boolean;
  userRating?: number;
  userNotes?: string;
  createdAt?: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 월, 화, 수 ...
  weatherForecast: {
    temp: number;
    tempMin: number;
    tempMax: number;
    condition: WeatherConditionType;
    description: string;
  };
  tpoId: string;
  customNote?: string;
  selectedOutfit?: OutfitRecommendation;
  optionA?: OutfitRecommendation;
  optionB?: OutfitRecommendation;
  selectedOptionId?: 'A' | 'B';
  isCompleted?: boolean;
}

export interface WardrobeGapRecommendation {
  id: string;
  category: ClothingCategory;
  subcategory: string;
  name: string;
  colorName: string;
  colorHex: string;
  whyNeeded: string;
  comboUnlocksCount: number;
  estimatedPriceRange: string;
  suggestedStyles: string[];
  imageUrl: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  imageUrl: string;
  price?: number;
  brand?: string;
  colorName: string;
  colorHex: string;
  addedAt: string;
  notes?: string;
  compatibilityScore?: number;
  pairingMatches?: {
    withItemId: string;
    withItemName: string;
    harmonyReason: string;
  }[];
}

export interface StylistChatMessage {
  id: string;
  sender: 'gemini' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export type ActiveTab = 
  | 'recommendation' 
  | 'optimal_outfits' 
  | 'wardrobe' 
  | 'history'
  | 'profile'
  | 'settings';

export interface AvoidColorOption {
  name: string;
  hex: string;
  reason: string;
}

export const PERSONAL_COLOR_AVOID_RECOMMENDATIONS: Record<PersonalColorType, AvoidColorOption[]> = {
  spring_light: [
    { name: '딥 버건디', hex: '#571020', reason: '명도가 너무 낮아 활력과 투명감을 저해함' },
    { name: '탁한 쿨그레이', hex: '#636E72', reason: '안색을 칙칙하고 흙빛으로 가라앉힘' },
  ],
  spring_bright: [
    { name: '다크 차콜', hex: '#2F3542', reason: '얼굴빛을 무겁고 어둡게 만듦' },
    { name: '블루베이스 쿨핑크', hex: '#E84393', reason: '웜톤의 노란 피부에 이질감 유발' },
  ],
  summer_light: [
    { name: '머스터드 옐로우', hex: '#E1B12C', reason: '쿨톤 피부가 노랗게 뜨는 워스트 컬러' },
    { name: '다크 웜브라운', hex: '#4B382A', reason: '여름 쿨톤 특유의 청량한 느낌을 침범' },
  ],
  summer_muted: [
    { name: '웜 오렌지', hex: '#E67E22', reason: '맑고 세련된 안색을 누렇게 유발' },
    { name: '카멜 브라운', hex: '#C07D3E', reason: '안색을 피로하고 어둡게 연출' },
  ],
  summer_bright: [
    { name: '웜 올리브 카키', hex: '#7F8C42', reason: '피부의 붉은기와 노란기를 동시에 유발' },
    { name: '네온 형광 오렌지', hex: '#FF5722', reason: '피부톤을 그을려 보이게 함' },
  ],
  fall_muted: [
    { name: '네온 푸시아', hex: '#FF007F', reason: '차가운 형광기가 가을 웜톤의 고급스러움과 충돌' },
    { name: '실버 그레이', hex: '#BDC3C7', reason: '피부 본연의 건강한 혈색을 분리시킴' },
  ],
  fall_strong: [
    { name: '아이시 블루', hex: '#DFF9FB', reason: '안색을 창백하고 힘없어 보이게 왜곡시킴' },
    { name: '페일 라벤더', hex: '#E0D6FF', reason: '노란 피부톤을 잿빛으로 퇴색시킴' },
  ],
  fall_deep: [
    { name: '비비드 쿨마젠타', hex: '#E056FD', reason: '과도한 푸른 채도로 피부를 그늘지게 함' },
    { name: '순백색 화이트', hex: '#FFFFFF', reason: '얼굴보다 옷만 둥둥 뜨게 만들어 부조화' },
  ],
  winter_bright: [
    { name: '탁한 베이지 카멜', hex: '#D4AC0D', reason: '겨울 쿨톤의 선명한 안색을 흐리게 만듦' },
    { name: '웜 오렌지', hex: '#E67E22', reason: '시원한 대비감을 무너뜨려 안색 차단' },
  ],
  winter_deep: [
    { name: '웜 옐로우', hex: '#F1C40F', reason: '피부에 칙칙한 노란기를 강하게 유발' },
    { name: '웜 올리브 카키', hex: '#556B2F', reason: '시원하고 세련된 인상을 둔탁하게 연출' },
  ],
  neutral_light: [
    { name: '극단적 네온 그린', hex: '#39FF14', reason: '의상의 형광기만 과도하게 부각' },
    { name: '다크 블랙', hex: '#000000', reason: '밝은 뉴트럴 피부톤의 생기를 가림' },
  ],
  neutral_dark: [
    { name: '아이시 쿨블루', hex: '#E0F7FA', reason: '창백하고 흙빛으로 보이는 느낌을 유발' },
    { name: '파스텔 베이비핑크', hex: '#FFD2FC', reason: '얼굴빛을 피로하고 칙칙하게 연출' },
  ],
};

export type GeminiModelId = 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-3.7-flash' 
  | 'gemini-flash-latest' 
  | 'gemini-3.1-pro-preview';

export interface GeminiModelOption {
  id: GeminiModelId;
  name: string;
  badge: string;
  costTier: '초절약 (최저 비용)' | '스마트 균형' | '고성능' | '프리미엄 추론';
  costBadgeColor: string;
  speedRating: 1 | 2 | 3 | 4 | 5;
  intelligenceRating: 1 | 2 | 3 | 4 | 5;
  description: string;
  recommendation: string;
  relativeCostRatio: string; // 예: "1x (기준)", "0.5x (50% 절감)"
  isDefault?: boolean;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: '⚡ 비용 최적화 / 초고속',
    costTier: '초절약 (최저 비용)',
    costBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    speedRating: 5,
    intelligenceRating: 4,
    description: '가장 저렴한 토큰 비용과 밀리초 단위의 빠른 응답 속도를 자랑합니다. 대량 의류 분석 및 일상 OOTD 생성에 최적화되어 있습니다.',
    recommendation: '비용을 극대화하여 아끼거나 빠른 로딩 속도를 원할 때 적극 추천',
    relativeCostRatio: '💰 가장 경제적 (Flash 대비 약 50% 절약)',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (추천 기본값)',
    badge: '⚖️ 지능 & 가성비 완벽 밸런스',
    costTier: '스마트 균형',
    costBadgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    speedRating: 5,
    intelligenceRating: 5,
    description: '구글의 최신 플래그십 플래시 모델로, 뛰어난 패션 감각 이해도와 고속 응답, 합리적인 비용을 동시에 제공합니다.',
    recommendation: '모든 상황에서 가장 추천하는 표준 고성능 & 고효율 모델',
    relativeCostRatio: '✨ 표준 가성비 (최고의 만족도)',
    isDefault: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    badge: '🚀 범용 안정화 버전',
    costTier: '스마트 균형',
    costBadgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    speedRating: 4,
    intelligenceRating: 4,
    description: '안정적인 범용 Flash 모델로 꾸준하고 일관된 스타일링과 날씨 해석을 수행합니다.',
    recommendation: '안정적인 기존 호환성을 원할 때 사용',
    relativeCostRatio: '💡 표준 요금제',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (심층 패션 추론)',
    badge: '🧠 프리미엄 고지능',
    costTier: '프리미엄 추론',
    costBadgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    speedRating: 3,
    intelligenceRating: 5,
    description: '가장 복잡한 TPO 상황, 퍼스널 컬러 매칭 및 럭셔리 스타일링에 대해 심층적인 논리적 분석과 코디 디테일을 생성합니다.',
    recommendation: '중요한 면접/결혼식/파티 등 정밀하고 품격 있는 스타일링이 필요할 때',
    relativeCostRatio: '💎 프리미엄 요금 (개인 API 키 권장)',
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  gender: 'male',
  height: 176,
  weight: 68,
  bodyType: 'athletic',
  personalColor: 'spring_bright',
  avoidColors: ['다크 차콜', '블루베이스 쿨핑크'],
  temperatureOffset: 0,
  stylePreferences: ['미니멀', '스마트 캐주얼', '클래식 댄디'],
  preferredStyles: ['미니멀', '스마트 캐주얼', '클래식 댄디'],
  coldSensitivity: 'normal',
  openWeatherApiKey: '',
  defaultCity: 'Seoul',
  geminiApiKey: '',
  geminiModel: 'gemini-3.7-flash',
};

export const DEFAULT_USER_PROFILE = INITIAL_USER_PROFILE;

export const DEFAULT_SAVED_OUTFITS: SavedOutfit[] = [];

export const TPO_SCENARIOS: TPOScenario[] = [
  {
    id: 'tpo_business_formal',
    name: '비즈니스 공식업무',
    category: 'formal',
    description: '중요 미팅, 고객 프레젠테이션, 공식 행사 등을 위한 신뢰감 있는 포멀 수트/격식 룩',
    iconName: 'Briefcase',
    formalityTarget: 5,
    activityLevel: 'low',
    indoorOutdoor: 'mostly_indoor',
    recommendedStyles: ['포멀', '클래식 수트', '신뢰감', '단정함'],
    tagColor: '#20304A',
  },
  {
    id: 'tpo_business_casual',
    name: '비즈니스 캐주얼',
    category: 'business_casual',
    description: '오피스 출근, 사내 회의, 단정한 스마트 워크플레이스용 슬랙스/셔츠/자켓 룩',
    iconName: 'Building2',
    formalityTarget: 4,
    activityLevel: 'low',
    indoorOutdoor: 'mostly_indoor',
    recommendedStyles: ['스마트 캐주얼', '미니멀', '모던', '단정함'],
    tagColor: '#5C86BD',
  },
  {
    id: 'tpo_daily_weekend',
    name: '데일리 & 위크엔드',
    category: 'daily',
    description: '주말 외출, 친구 모임, 카페 및 쇼핑 등 일상 속 편안하고 트렌디한 데일리 캐주얼',
    iconName: 'Coffee',
    formalityTarget: 2,
    activityLevel: 'medium',
    indoorOutdoor: 'balanced',
    recommendedStyles: ['캐주얼', '꾸안꾸', '미니멀', '트렌디'],
    tagColor: '#7FA8DC',
  },
  {
    id: 'tpo_date_special',
    name: '데이트 & 특별한 날',
    category: 'date',
    description: '데이트, 기념일, 분위기 좋은 레스토랑 등 매력과 세련미를 돋보이게 하는 스타일링',
    iconName: 'HeartHandshake',
    formalityTarget: 3,
    activityLevel: 'medium',
    indoorOutdoor: 'balanced',
    recommendedStyles: ['댄디', '로맨틱', '세련미', '포근함'],
    tagColor: '#8EAEE0',
  },
  {
    id: 'tpo_sports_outdoor',
    name: '스포츠 & 아웃도어',
    category: 'active',
    description: '러닝, 헬스, 등산, 야외 활동 등 통기성과 신축성이 우수한 기능성 액티브웨어',
    iconName: 'Dumbbell',
    formalityTarget: 1,
    activityLevel: 'high',
    indoorOutdoor: 'mostly_outdoor',
    recommendedStyles: ['스포티', '애슬레저', '기능성', '통기성'],
    tagColor: '#E76F51',
  },
  {
    id: 'tpo_home_lounge',
    name: '홈 & 라운지',
    category: 'lounge',
    description: '재택 근무, 집에서의 휴식, 가벼운 집앞 외출을 위한 극강의 편안함과 부드러운 라운지웨어',
    iconName: 'Home',
    formalityTarget: 1,
    activityLevel: 'low',
    indoorOutdoor: 'mostly_indoor',
    recommendedStyles: ['이지웨어', '라운지', '편안함', '릴렉스'],
    tagColor: '#F2CC8F',
  },
  {
    id: 'tpo_no_going_out',
    name: 'No going out',
    category: 'home',
    description: '외출 없는 날(홈콕/올데이 레스트), 가장 편안한 실내 홈웨어 & 룸웨어 차림',
    iconName: 'Armchair',
    formalityTarget: 1,
    activityLevel: 'low',
    indoorOutdoor: 'mostly_indoor',
    recommendedStyles: ['룸웨어', '파자마', '홈웨어', '소프트'],
    tagColor: '#A8DADC',
  },
];

export const DEFAULT_WEATHER: WeatherInfo = {
  city: 'Seoul (서울)',
  temp: 18,
  feelsLike: 17,
  tempMin: 12,
  tempMax: 22,
  condition: 'Clear',
  description: '맑고 선선한 쾌적한 가을 바람',
  humidity: 48,
  windSpeed: 2.5,
  precipitationProb: 5,
  uvIndex: 4,
  isManual: false,
  updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  hourlyForecast: [
    { timeLabel: '00:00', timeName: '자정/새벽', temp: 15, feelsLike: 14, condition: 'Clear', description: '자정 선선한 밤공기', humidity: 60, precipitationProb: 0, windSpeed: 2.1 },
    { timeLabel: '03:00', timeName: '새벽/최저', temp: 13, feelsLike: 12, condition: 'Clear', description: '새벽 최저 기온', humidity: 66, precipitationProb: 0, windSpeed: 1.8 },
    { timeLabel: '06:00', timeName: '이른아침', temp: 14, feelsLike: 13, condition: 'Clear', description: '이른 아침 쌀쌀함', humidity: 62, precipitationProb: 0, windSpeed: 2.0 },
    { timeLabel: '09:00', timeName: '오전/출근', temp: 17, feelsLike: 16, condition: 'Clear', description: '상쾌한 출근길 기온', humidity: 53, precipitationProb: 5, windSpeed: 2.4, isCurrentTimeSlot: true },
    { timeLabel: '12:00', timeName: '점심/낮', temp: 20, feelsLike: 20, condition: 'Clear', description: '따뜻한 정오 햇살', humidity: 43, precipitationProb: 5, windSpeed: 2.7 },
    { timeLabel: '15:00', timeName: '오후/최고', temp: 22, feelsLike: 22, condition: 'Clear', description: '한낮 최고 기온', humidity: 38, precipitationProb: 10, windSpeed: 3.1 },
    { timeLabel: '18:00', timeName: '저녁/퇴근', temp: 19, feelsLike: 18, condition: 'Clear', description: '선선한 저녁 퇴근길', humidity: 50, precipitationProb: 5, windSpeed: 2.6 },
    { timeLabel: '21:00', timeName: '밤/야간', temp: 16, feelsLike: 15, condition: 'Clear', description: '차분한 밤 공기', humidity: 56, precipitationProb: 0, windSpeed: 2.2 },
  ],
};

export const SAMPLE_WARDROBE_ITEMS: ClothingItem[] = [
  // --- OUTERS (아우터) ---
  {
    id: 'item_outer_1',
    name: '오버핏 싱글 카멜 코트',
    category: 'outer',
    subcategory: '롱코트',
    primaryColor: '카멜 브라운',
    primaryColorHex: '#C68B59',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce667823?w=600&auto=format&fit=crop&q=80',
    seasons: ['fall', 'winter'],
    minTemp: 0,
    maxTemp: 13,
    formality: 4,
    styleTags: ['클래식', '미니멀', '댄디', '오피스', '데이트'],
    material: '울 90% 캐시미어 10%',
    thickness: 'thick',
    windproof: true,
    isFavorite: true,
    timesWorn: 14,
    createdAt: '2026-01-10',
    notes: '어깨 라인이 자연스럽게 떨어져 체형 보완에 좋습니다.',
  },
  {
    id: 'item_outer_2',
    name: '클래식 네이비 2버튼 블레이저',
    category: 'outer',
    subcategory: '블레이저',
    primaryColor: '다크 네이비',
    primaryColorHex: '#1D2A44',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall'],
    minTemp: 12,
    maxTemp: 22,
    formality: 4,
    styleTags: ['비즈니스', '스마트 캐주얼', '오피스', '결혼식'],
    material: '울 혼방',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 22,
    createdAt: '2026-02-01',
    notes: '슬랙스나 데님 모두에 잘 어울리는 만능 자켓',
  },
  {
    id: 'item_outer_3',
    name: '베이지 미니멀 트렌치 코트',
    category: 'outer',
    subcategory: '트렌치코트',
    primaryColor: '샌드 베이지',
    primaryColorHex: '#D7C4A5',
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall'],
    minTemp: 10,
    maxTemp: 20,
    formality: 3,
    styleTags: ['프렌치 시크', '감성', '데이트', '환절기'],
    material: '코튼 발수가공',
    thickness: 'medium',
    waterproof: true,
    windproof: true,
    isFavorite: false,
    timesWorn: 8,
    createdAt: '2026-02-15',
    notes: '비오는 봄/가을철 방수 방풍에 탁월합니다.',
  },
  {
    id: 'item_outer_4',
    name: '블랙 구스다운 숏패딩',
    category: 'outer',
    subcategory: '숏패딩',
    primaryColor: '매트 블랙',
    primaryColorHex: '#1C1C1E',
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80',
    seasons: ['winter'],
    minTemp: -15,
    maxTemp: 5,
    formality: 2,
    styleTags: ['캐주얼', '스트릿', '방한', '데일리'],
    material: '구스다운 80:20',
    thickness: 'heavy',
    windproof: true,
    waterproof: true,
    isFavorite: true,
    timesWorn: 30,
    createdAt: '2026-01-05',
  },
  {
    id: 'item_outer_5',
    name: '올리브 카키 바시티 윈드브레이커',
    category: 'outer',
    subcategory: '바람막이',
    primaryColor: '올리브 카키',
    primaryColorHex: '#4A5B44',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall'],
    minTemp: 14,
    maxTemp: 24,
    formality: 1,
    styleTags: ['스포티', '고프코어', '캠퍼스', '여행'],
    material: '나일론 테크',
    thickness: 'thin',
    waterproof: true,
    windproof: true,
    isFavorite: false,
    timesWorn: 11,
    createdAt: '2026-03-01',
  },

  // --- TOPS (상의) ---
  {
    id: 'item_top_1',
    name: '소프트 아이보리 울 라운드넥 니트',
    category: 'top',
    subcategory: '니트',
    primaryColor: '크림 아이보리',
    primaryColorHex: '#F5F2EB',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
    seasons: ['fall', 'winter', 'spring'],
    minTemp: 5,
    maxTemp: 18,
    formality: 3,
    styleTags: ['포근함', '미니멀', '남친룩', '소개팅'],
    material: '메리노울 100%',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 19,
    createdAt: '2026-01-12',
    notes: '부드러운 인상을 주는 웜톤 크림색 니트',
  },
  {
    id: 'item_top_2',
    name: '클래식 스카이블루 옥스포드 셔츠',
    category: 'top',
    subcategory: '셔츠',
    primaryColor: '스카이블루',
    primaryColorHex: '#A2C2E2',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall'],
    minTemp: 15,
    maxTemp: 26,
    formality: 4,
    styleTags: ['오피스', '비즈니스', '댄디', '단정함'],
    material: '옥스포드 코튼',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 25,
    createdAt: '2026-02-10',
  },
  {
    id: 'item_top_3',
    name: '헤비웨이트 차콜 그레이 후드티',
    category: 'top',
    subcategory: '후드티',
    primaryColor: '차콜 그레이',
    primaryColorHex: '#3A3B3C',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall', 'winter'],
    minTemp: 10,
    maxTemp: 20,
    formality: 1,
    styleTags: ['스트릿', '캐주얼', '캠퍼스', '편안함'],
    material: '코튼 100% 쭈리',
    thickness: 'thick',
    isFavorite: false,
    timesWorn: 15,
    createdAt: '2026-01-20',
  },
  {
    id: 'item_top_4',
    name: '화이트 베이직 수피마 반팔 티셔츠',
    category: 'top',
    subcategory: '반팔 티셔츠',
    primaryColor: '퓨어 화이트',
    primaryColorHex: '#FFFFFF',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall'],
    minTemp: 18,
    maxTemp: 35,
    formality: 2,
    styleTags: ['레이어드', '베이직', '미니멀', '사계절'],
    material: '수피마 코튼',
    thickness: 'thin',
    isFavorite: true,
    timesWorn: 40,
    createdAt: '2026-01-01',
  },
  {
    id: 'item_top_5',
    name: '테라코타 와플 롱슬리브 티셔츠',
    category: 'top',
    subcategory: '긴팔 티셔츠',
    primaryColor: '테라코타 코랄',
    primaryColorHex: '#E07A5F',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall'],
    minTemp: 15,
    maxTemp: 24,
    formality: 2,
    styleTags: ['컬러포인트', '웜톤', '캐주얼', '감성'],
    material: '와플 코튼',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 12,
    createdAt: '2026-03-05',
  },

  // --- BOTTOMS (하의) ---
  {
    id: 'item_bottom_1',
    name: '세미와이드 딥차콜 울 슬랙스',
    category: 'bottom',
    subcategory: '슬랙스',
    primaryColor: '딥 차콜',
    primaryColorHex: '#2B2D42',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall', 'winter'],
    minTemp: 5,
    maxTemp: 22,
    formality: 4,
    styleTags: ['오피스', '미니멀', '클래식', '체형보완'],
    material: 'TR 울 혼방',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 34,
    createdAt: '2026-01-15',
    notes: '구김이 적고 다리가 길어보이는 와이드 핏',
  },
  {
    id: 'item_bottom_2',
    name: '스트레이트 핏 인디고 데님 팬츠',
    category: 'bottom',
    subcategory: '청바지',
    primaryColor: '인디고 블루',
    primaryColorHex: '#284B63',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    minTemp: 8,
    maxTemp: 28,
    formality: 2,
    styleTags: ['캐주얼', '데일리', '스테디셀러', '캠퍼스'],
    material: '코튼 데님 100%',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 45,
    createdAt: '2026-01-08',
  },
  {
    id: 'item_bottom_3',
    name: '테이퍼드 크림 베이지 치노 팬츠',
    category: 'bottom',
    subcategory: '면바지',
    primaryColor: '소프트 베이지',
    primaryColorHex: '#EAE2B7',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall', 'summer'],
    minTemp: 15,
    maxTemp: 28,
    formality: 3,
    styleTags: ['스마트 캐주얼', '프레피', '데이트', '화사함'],
    material: '코튼 스판',
    thickness: 'medium',
    isFavorite: false,
    timesWorn: 16,
    createdAt: '2026-02-18',
  },
  {
    id: 'item_bottom_4',
    name: '블랙 나일론 이지 조거 팬츠',
    category: 'bottom',
    subcategory: '조거팬츠',
    primaryColor: '매트 블랙',
    primaryColorHex: '#1A1A1A',
    imageUrl: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall'],
    minTemp: 12,
    maxTemp: 27,
    formality: 1,
    styleTags: ['스포티', '애슬레저', '활동성', '편안함'],
    material: '나일론 스판 발수가공',
    thickness: 'thin',
    waterproof: true,
    isFavorite: false,
    timesWorn: 20,
    createdAt: '2026-02-25',
  },

  // --- SHOES (신발) ---
  {
    id: 'item_shoes_1',
    name: '화이트 클래식 가죽 스니커즈',
    category: 'shoes',
    subcategory: '스니커즈',
    primaryColor: '올 화이트',
    primaryColorHex: '#FAFAFA',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    minTemp: 0,
    maxTemp: 35,
    formality: 2,
    styleTags: ['만능', '미니멀', '캐주얼', '깔끔'],
    material: '천연 소가죽',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 50,
    createdAt: '2026-01-01',
    notes: '모든 코디에 매칭 가능한 필수 기본 아이템',
  },
  {
    id: 'item_shoes_2',
    name: '다크 브라운 페니 로퍼',
    category: 'shoes',
    subcategory: '로퍼',
    primaryColor: '다크 브라운',
    primaryColorHex: '#4A2E18',
    imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall', 'summer'],
    minTemp: 8,
    maxTemp: 28,
    formality: 4,
    styleTags: ['비즈니스', '댄디', '클래식', '결혼식'],
    material: '소가죽 에나멜',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 18,
    createdAt: '2026-02-05',
  },
  {
    id: 'item_shoes_3',
    name: '블랙 고어텍스 방수 트레킹 슈즈',
    category: 'shoes',
    subcategory: '방수화',
    primaryColor: '차콜 블랙',
    primaryColorHex: '#222222',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'fall', 'winter'],
    minTemp: -5,
    maxTemp: 25,
    formality: 1,
    styleTags: ['우천대비', '고프코어', '액티브', '방수'],
    material: '고어텍스',
    thickness: 'thick',
    waterproof: true,
    isFavorite: false,
    timesWorn: 14,
    createdAt: '2026-01-28',
  },

  // --- ACCESSORIES & BAGS (액세서리 및 가방) ---
  {
    id: 'item_acc_1',
    name: '울 캐시미어 머플러 (오트밀 베이지)',
    category: 'accessory',
    subcategory: '머플러',
    primaryColor: '오트밀 베이지',
    primaryColorHex: '#DDD5C7',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&auto=format&fit=crop&q=80',
    seasons: ['fall', 'winter'],
    minTemp: -10,
    maxTemp: 10,
    formality: 3,
    styleTags: ['방한', '포근함', '감성포인트', '겨울'],
    material: '캐시미어 100%',
    thickness: 'thick',
    isFavorite: true,
    timesWorn: 20,
    createdAt: '2026-01-10',
  },
  {
    id: 'item_bag_1',
    name: '레더 미니멀 사각 브리프/토트백',
    category: 'bag',
    subcategory: '토트백',
    primaryColor: '딥 차콜 블랙',
    primaryColorHex: '#252525',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    minTemp: -20,
    maxTemp: 40,
    formality: 4,
    styleTags: ['오피스', '미니멀', '수납', '모던'],
    material: '소가죽',
    thickness: 'medium',
    isFavorite: true,
    timesWorn: 30,
    createdAt: '2026-01-05',
  },
  {
    id: 'item_bag_2',
    name: '테크 패브릭 방수 크로스 슬링백',
    category: 'bag',
    subcategory: '크로스백',
    primaryColor: '세일트 네이비',
    primaryColorHex: '#3D405B',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    minTemp: -20,
    maxTemp: 40,
    formality: 1,
    styleTags: ['캐주얼', '방수', '캠퍼스', '여행'],
    material: '코듀라 방수원단',
    thickness: 'thin',
    waterproof: true,
    isFavorite: false,
    timesWorn: 18,
    createdAt: '2026-02-14',
  }
];

export const BODY_TYPE_LABELS: Record<string, { label: string; desc: string; tip: string }> = {
  hourglass: {
    label: '모래시계형 (균형미)',
    desc: '어깨와 골반의 균형이 잡히고 허리선이 뚜렷한 체형',
    tip: '허리선을 살려주는 벨티드 스타일이나 세미 슬림핏이 돋보입니다.',
  },
  inverted_triangle: {
    label: '역삼각형 (어깨 발달형)',
    desc: '어깨와 가슴이 발달하고 하체가 슬림한 스포티한 체형',
    tip: '와이드 팬츠나 밝은 하의를 매치해 상하체 시각적 밸런스를 맞추세요.',
  },
  rectangle: {
    label: '직사각형 (슬림 일자형)',
    desc: '상하체 라인이 균일하고 마른 직선형 체형',
    tip: '레이어드 룩이나 볼륨감 있는 오버핏 아우터로 입체감을 더하세요.',
  },
  pear: {
    label: '삼각형 / 하체 발달형',
    desc: '어깨가 좁고 골반 및 허벅지가 발달한 체형',
    tip: '상의에 컬러 포인트나 칼라(Collar) 디테일을 주고 어두운 하의를 권장합니다.',
  },
  apple: {
    label: '원형 / 상체 볼륨형',
    desc: '상체 및 복부에 볼륨감이 집중된 체형',
    tip: 'V넥이나 오픈형 아우터로 세로선을 강조하고 깔끔한 스트레이트 팬츠가 좋습니다.',
  },
  athletic: {
    label: '탄탄형 (근육형)',
    desc: '전체적으로 근육량이 많고 프레임이 잡힌 체형',
    tip: '자연스러운 레귤러 드롭숄더 핏으로 실루엣을 부드럽게 연출하세요.',
  },
  slim: {
    label: '슬림형 (마른 체형)',
    desc: '체지방과 근육이 적어 여리여리한 체형',
    tip: '도톰한 울/니트 소재감과 밝은 컬러 매칭으로 볼륨감을 부여하세요.',
  },
  plus: {
    label: '플러스형 (체격형)',
    desc: '전체적인 체격이 크고 듬직한 체형',
    tip: '모노톤 베이스에 세로 스트라이프, 롱 기장의 아우터로 슬림한 실루엣을 완성합니다.',
  }
};

export const PERSONAL_COLOR_LABELS: Record<PersonalColorType, { label: string; tone: string; color: string }> = {
  spring_light: { label: '봄 웜 라이트', tone: '봄 웜톤', color: '#FCD5B5' },
  spring_bright: { label: '봄 웜 브라이트', tone: '봄 웜톤', color: '#FAC090' },
  summer_light: { label: '여름 쿨 라이트', tone: '여름 쿨톤', color: '#B2E2E2' },
  summer_muted: { label: '여름 쿨 뮤티드', tone: '여름 쿨톤', color: '#88C0D0' },
  summer_bright: { label: '여름 쿨 브라이트', tone: '여름 쿨톤', color: '#5E81AC' },
  fall_muted: { label: '가을 웜 뮤티드', tone: '가을 웜톤', color: '#D08770' },
  fall_strong: { label: '가을 웜 스트롱', tone: '가을 웜톤', color: '#BF616A' },
  fall_deep: { label: '가을 웜 딥', tone: '가을 웜톤', color: '#A3BE8C' },
  winter_bright: { label: '겨울 쿨 브라이트', tone: '겨울 쿨톤', color: '#B48EAD' },
  winter_deep: { label: '겨울 쿨 딥', tone: '겨울 쿨톤', color: '#4C566A' },
  neutral_light: { label: '뉴트럴 라이트', tone: '뉴트럴톤', color: '#E5E9F0' },
  neutral_dark: { label: '뉴트럴 다크', tone: '뉴트럴톤', color: '#2E3440' },
};

export interface CapsuleShoppingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  multiplierCombos: number;
  whyNeeded: string;
  shoppingKeyword: string;
  shoppingUrl: string;
  estimatedPrice: string;
  priority: 'high' | 'medium';
}

export interface CapsuleWardrobeAnalysis {
  totalItems: number;
  totalCombinations: number;
  capsuleCompletenessScore: number;
  bottleneckCategory: string;
  bottleneckMessage: string;
  seasonalCoverage: {
    springFall: number;
    summer: number;
    winter: number;
  };
  recommendations: CapsuleShoppingItem[];
}


