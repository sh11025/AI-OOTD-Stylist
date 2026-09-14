import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  Thermometer, 
  Clock, 
  Sparkles, 
  ShoppingBag, 
  Plus, 
  Check,
  ExternalLink,
  Layers,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  SavedOutfit, 
  OutfitRecommendation, 
  TPOScenario, 
  ClothingItem, 
   
  WishlistItem,
  UserProfile,
  CapsuleWardrobeAnalysis,
  CapsuleShoppingItem
} from '../types';
import { ProgressiveImage } from '../helpers';


// ----------------------------------------------------
// OutfitHistoryView Component
// ----------------------------------------------------
interface OutfitHistoryViewProps {
  history: SavedOutfit[];
  onSelectHistoricalOutfit: (outfit: OutfitRecommendation, tpo: TPOScenario) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const OutfitHistoryView: React.FC<OutfitHistoryViewProps> = ({
  history,
  onSelectHistoricalOutfit,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'logged' | 'saved'>('all');

  const filteredHistory = history.filter(item => {
    if (filterMode === 'logged') return item.isLoggedWear;
    if (filterMode === 'saved') return !item.isLoggedWear;
    return true;
  });

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 코디 아카이브를 삭제하시겠습니까?')) {
      onDeleteHistoryItem(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('전체 아카이브 기록을 초기화하시겠습니까?')) {
      onClearHistory();
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 pb-1">
      {/* Top Header & Filter Controls */}
      <div className="bg-white dark:bg-[#202B38] rounded-sm p-2.5 px-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-[#7FA8DC] flex items-center justify-center text-white shadow-xs shrink-0">
            <History size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] tracking-wider font-bold text-[#868E96] uppercase">AI OOTD Lookbook & Archive</p>
            <h3 className="text-sm sm:text-base text-[#20304A] dark:text-white font-bold truncate">나의 데일리 코디 아카이브</h3>
          </div>
        </div>

        {/* Filter Badges & Clear button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F7FC] dark:bg-[#26313F] p-1 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50]">
            <button
              id="filter-history-all"
              type="button"
              onClick={() => setFilterMode('all')}
              className={`min-h-[32px] px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-[#7FA8DC] text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
              }`}
            >
              전체 ({history.length})
            </button>
            <button
              id="filter-history-logged"
              type="button"
              onClick={() => setFilterMode('logged')}
              className={`min-h-[32px] px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'logged'
                  ? 'bg-[#7FA8DC] text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
              }`}
            >
              오늘 착용 ({history.filter(h => h.isLoggedWear).length})
            </button>
            <button
              id="filter-history-saved"
              type="button"
              onClick={() => setFilterMode('saved')}
              className={`min-h-[32px] px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'saved'
                  ? 'bg-[#7FA8DC] text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
              }`}
            >
              저장 룩북 ({history.filter(h => !h.isLoggedWear).length})
            </button>
          </div>

          {history.length > 0 && (
            <button
              id="btn-clear-history"
              type="button"
              onClick={handleClearAll}
              className="min-h-[32px] px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded border border-red-200 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">기록 전체 삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* History Grid */}
      {filteredHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#202B38] rounded-lg border border-[#D5E2F3] dark:border-[#2E3D50] text-center">
          <Calendar size={36} className="text-[#7FA8DC] mb-2 opacity-50" />
          <h4 className="font-semibold text-sm text-[#20304A] dark:text-white">저장된 코디 기록이 없습니다</h4>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            '최적 코디 추천' 탭에서 마음에 드는 코디를 [오늘 이 코디 착용]하거나 [보관]해 보세요.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-1">
          {filteredHistory.map(record => (
            <div
              key={record.id}
              onClick={() => onSelectHistoricalOutfit(record.recommendation, record.tpo)}
              className="group bg-white dark:bg-[#202B38] rounded-lg p-3.5 sm:p-4 border border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Top Title & Badge */}
                <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shrink-0 ${
                      record.isLoggedWear ? 'bg-emerald-600' : 'bg-[#7FA8DC]'
                    }`}>
                      {record.isLoggedWear ? '오늘 착용' : '저장 룩북'}
                    </span>
                    <h5 className="font-semibold text-xs sm:text-sm text-[#20304A] dark:text-white group-hover:text-[#7FA8DC] transition-colors truncate min-w-0" title={record.recommendation.title}>
                      {record.recommendation.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={11} />
                      <span>{record.date}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(record.id, e)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      title="기록 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Weather & Score Summary */}
                <div className="flex items-center justify-between mt-2.5 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[#20304A] dark:text-gray-200 font-bold">
                      <Thermometer size={12} className="text-[#7FA8DC]" /> {record.weather.city} {record.weather.temp}°C
                    </span>
                    <span className="text-gray-400 text-[11px]">({record.weather.description})</span>
                  </div>

                  <span className="text-[11px] font-bold text-[#20304A] dark:text-gray-200 bg-[#F4F7FC] dark:bg-[#26313F] px-2.5 py-0.5 rounded border border-[#D5E2F3] dark:border-[#2E3D50]">
                    적합도 {record.recommendation.scores.totalScore}점
                  </span>
                </div>

                {/* Outfit Item Previews (Cached Images) */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {record.recommendation.items.top && (
                    <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded p-1.5 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col items-center">
                      <div className="aspect-square w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800 mb-1">
                        <ProgressiveImage 
                          src={record.recommendation.items.top.imageUrl} 
                          alt="상의" 
                          fallbackColorHex={record.recommendation.items.top.primaryColorHex}
                          categoryName="상의"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {record.recommendation.items.top.name}
                      </span>
                    </div>
                  )}

                  {record.recommendation.items.bottom && (
                    <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded p-1 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col items-center">
                      <div className="aspect-square w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800 mb-0.5">
                        <ProgressiveImage 
                          src={record.recommendation.items.bottom.imageUrl} 
                          alt="하의" 
                          fallbackColorHex={record.recommendation.items.bottom.primaryColorHex}
                          categoryName="하의"
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {record.recommendation.items.bottom.name}
                      </span>
                    </div>
                  )}

                  {(record.recommendation.items.outer || record.recommendation.items.bag) && (
                    <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded p-1 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col items-center">
                      <div className="aspect-square w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800 mb-0.5">
                        <ProgressiveImage 
                          src={record.recommendation.items.outer?.imageUrl || record.recommendation.items.bag?.imageUrl} 
                          alt="아우터/가방" 
                          fallbackColorHex={record.recommendation.items.outer?.primaryColorHex || record.recommendation.items.bag?.primaryColorHex}
                          categoryName="아우터"
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {record.recommendation.items.outer?.name || record.recommendation.items.bag?.name}
                      </span>
                    </div>
                  )}

                  {record.recommendation.items.shoes && (
                    <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded p-1 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col items-center">
                      <div className="aspect-square w-full rounded overflow-hidden bg-gray-100 dark:bg-gray-800 mb-0.5">
                        <ProgressiveImage 
                          src={record.recommendation.items.shoes.imageUrl} 
                          alt="신발" 
                          fallbackColorHex={record.recommendation.items.shoes.primaryColorHex}
                          categoryName="신발"
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {record.recommendation.items.shoes.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Advice excerpt */}
                <p className="text-[9px] text-gray-500 line-clamp-2 mt-1.5 pt-1.5 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                  {record.recommendation.stylistAdvice}
                </p>
              </div>

              {/* Bottom Click Guide */}
              <div className="mt-2 pt-1.5 border-t border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between text-[9px] text-[#7FA8DC] font-semibold">
                <span>클릭하여 이 코디 다시 불러오기</span>
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// WardrobeGapAndWishlist Component
// ----------------------------------------------------
interface WardrobeGapAndWishlistProps {
  wardrobe: ClothingItem[];
  onAddWishlistItemToWardrobe: (wish: WishlistItem) => void;
  profile?: UserProfile;
}

export const WardrobeGapAndWishlist: React.FC<WardrobeGapAndWishlistProps> = ({
  wardrobe,
  onAddWishlistItemToWardrobe,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'capsule_analysis' | 'wishlist'>('capsule_analysis');
  const [capsuleData, setCapsuleData] = useState<CapsuleWardrobeAnalysis | null>(null);
  const [isAnalyzingCapsule, setIsAnalyzingCapsule] = useState(false);
  
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: 'wish_1',
      name: '올리브 카키 울 블렌드 발마칸 코트',
      category: 'outer',
      subcategory: '발마칸 코트',
      imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce667823?w=600&auto=format&fit=crop&q=80',
      price: 198000,
      brand: 'Vogue Lab Archive',
      colorName: '올리브 카키',
      colorHex: '#4A5B44',
      addedAt: '2026-03-01',
      compatibilityScore: 96,
      notes: '기존 화이트 스니커즈 및 크림 니트와 톤온톤 매칭 극상',
      pairingMatches: [
        { withItemId: 'item_top_1', withItemName: '소프트 아이보리 울 라운드넥 니트', harmonyReason: '포근하고 세련된 웜톤 컬러 밸런스' },
        { withItemId: 'item_bottom_1', withItemName: '딥차콜 울 슬랙스', harmonyReason: '단정하고 차분한 오피스 캐주얼' },
      ]
    }
  ]);

  const [newWishName, setNewWishName] = useState('');
  const [newWishUrl, setNewWishUrl] = useState('');
  const [newWishCategory, setNewWishCategory] = useState<any>('top');

  // 로컬 즉시 매트릭스 계산
  const localMatrix = useMemo(() => {
    const outers = wardrobe.filter(w => w.category === 'outer');
    const tops = wardrobe.filter(w => w.category === 'top');
    const bottoms = wardrobe.filter(w => w.category === 'bottom');
    const shoes = wardrobe.filter(w => w.category === 'shoes');
    const bags = wardrobe.filter(w => w.category === 'bag');
    const accs = wardrobe.filter(w => w.category === 'accessory');

    const baseCombos = Math.max(1, tops.length) * Math.max(1, bottoms.length) * Math.max(1, shoes.length);
    const totalCombinations = outers.length > 0 ? baseCombos * (outers.length + 1) : baseCombos;
    const completenessScore = Math.min(100, Math.round((wardrobe.length / 20) * 100));

    return {
      outersCount: outers.length,
      topsCount: tops.length,
      bottomsCount: bottoms.length,
      shoesCount: shoes.length,
      bagsCount: bags.length,
      accsCount: accs.length,
      totalCombinations,
      completenessScore,
    };
  }, [wardrobe]);

  // 로컬 룰베이스 지능형 캡슐 분석 폴백 생성 함수
  const generateRuleBasedCapsule = (): CapsuleWardrobeAnalysis => {
    const tops = wardrobe.filter(w => w.category === 'top');
    const bottoms = wardrobe.filter(w => w.category === 'bottom');
    const outers = wardrobe.filter(w => w.category === 'outer');
    const shoes = wardrobe.filter(w => w.category === 'shoes');

    const recommendations: CapsuleShoppingItem[] = [];

    if (bottoms.length <= tops.length / 2) {
      recommendations.push({
        id: 'rule_bot_slacks',
        name: '클래식 테이퍼드 울 슬랙스',
        category: 'bottom',
        subcategory: '슬랙스',
        primaryColor: '다크 차콜',
        primaryColorHex: '#212529',
        multiplierCombos: Math.max(3, tops.length),
        whyNeeded: '현재 보유한 상의 대비 포멀·스마트캐주얼을 모두 소화할 수 있는 베이직 하의가 부족합니다.',
        shoppingKeyword: '남자 클래식 테이퍼드 울 슬랙스',
        shoppingUrl: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent('남자 클래식 테이퍼드 울 슬랙스'),
        priority: 'high',
        estimatedPrice: '89,000원'
      });
    }

    if (outers.length < 2) {
      recommendations.push({
        id: 'rule_outer_coat',
        name: '소프트 싱글 발마칸 트렌치 코트',
        category: 'outer',
        subcategory: '코트',
        primaryColor: '소프트 베이지',
        primaryColorHex: '#D4CBB6',
        multiplierCombos: Math.max(4, bottoms.length * 2),
        whyNeeded: '간절기 및 실내외 기온차에 대응할 수 있는 범용성 높은 클래식 아우터가 필요합니다.',
        shoppingKeyword: '발마칸 트렌치 코트 베이지',
        shoppingUrl: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent('발마칸 트렌치 코트 베이지'),
        priority: 'high',
        estimatedPrice: '148,000원'
      });
    }

    if (shoes.length < 2) {
      recommendations.push({
        id: 'rule_shoes_sneakers',
        name: '미니멀 화이트 레더 스니커즈',
        category: 'shoes',
        subcategory: '스니커즈',
        primaryColor: '퓨어 화이트',
        primaryColorHex: '#FFFFFF',
        multiplierCombos: Math.max(5, tops.length + bottoms.length),
        whyNeeded: '캐주얼부터 오피스룩까지 전천후로 매치 가능한 기본 신발입니다.',
        shoppingKeyword: '미니멀 화이트 레더 스니커즈',
        shoppingUrl: 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent('미니멀 화이트 레더 스니커즈'),
        priority: 'medium',
        estimatedPrice: '98,000원'
      });
    }

    const bottleneck = outers.length === 0 ? '아우터' : bottoms.length <= 1 ? '하의' : shoes.length <= 1 ? '신발' : '상의';

    return {
      totalItems: wardrobe.length,
      totalCombinations: localMatrix.totalCombinations,
      capsuleCompletenessScore: localMatrix.completenessScore,
      bottleneckCategory: bottleneck,
      bottleneckMessage: `현재 보유하신 ${wardrobe.length}벌의 의류 데이터를 종합 분석했습니다. ${bottleneck} 기본 아이템을 보강하시면 연출 가능한 OOTD 가짓수가 비약적으로 증가합니다.`,
      seasonalCoverage: {
        springFall: 80,
        summer: tops.length > 3 ? 75 : 50,
        winter: outers.length >= 2 ? 70 : 40,
      },
      recommendations,
    };
  };

  // AI 캡슐 워드로브 분석 요청 (API 장애 시 자체 스마트 룰베이스 Fallback)
  const fetchCapsuleAnalysis = async () => {
    setIsAnalyzingCapsule(true);
        try {
      const res = await fetch('/api/gemini/analyze-capsule-wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobe,
          profile,
          customGeminiKey: profile?.geminiApiKey,
          selectedModel: profile?.geminiModel,
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setCapsuleData(data.data);
      } else {
        // 자체 스마트 룰베이스 Fallback 가동
        setCapsuleData(generateRuleBasedCapsule());
      }
    } catch {
      // 네트워크 오류 시에도 룰베이스로 끊김 없는 화면 제공
      setCapsuleData(generateRuleBasedCapsule());
    } finally {
      setIsAnalyzingCapsule(false);
    }
  };

  useEffect(() => {
    if (wardrobe.length > 0) {
      fetchCapsuleAnalysis();
    }
  }, [wardrobe.length]);

  // 쇼핑 추천 아이템을 위시리스트에 추가
  const handleAddShoppingItemToWishlist = (item: CapsuleShoppingItem) => {
    const newWish: WishlistItem = {
      id: `wish_capsule_${Date.now()}`,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      colorName: item.primaryColor,
      colorHex: item.primaryColorHex,
      addedAt: new Date().toISOString().split('T')[0],
      compatibilityScore: 95,
      notes: `${item.whyNeeded} (+${item.multiplierCombos} 코디 확장)`,
      pairingMatches: [
        { withItemId: 'auto_wardrobe', withItemName: '보유 중인 기본 아이템들과 결합', harmonyReason: `${item.multiplierCombos}가지 신규 코디 조합 확장` }
      ]
    };
    setWishlist(prev => [newWish, ...prev]);
    setActiveTab('wishlist');
  };

  // 쇼핑 추천 아이템을 즉시 내 옷장에 등록
  const handleAddShoppingItemDirectlyToWardrobe = (item: CapsuleShoppingItem) => {
    const newWish: WishlistItem = {
      id: `wish_direct_${Date.now()}`,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      colorName: item.primaryColor,
      colorHex: item.primaryColorHex,
      addedAt: new Date().toISOString().split('T')[0],
      notes: item.whyNeeded,
    };
    onAddWishlistItemToWardrobe(newWish);
    alert(`[${item.name}] 아이템이 내 옷장에 성공적으로 추가되었습니다!`);
  };

  const handleCreateWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishName.trim()) return;

    const newWish: WishlistItem = {
      id: `wish_${Date.now()}`,
      name: newWishName.trim(),
      category: newWishCategory,
      subcategory: '위시리스트',
      imageUrl: newWishUrl.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      colorName: '미정',
      colorHex: '#3D405B',
      addedAt: new Date().toISOString().split('T')[0],
      compatibilityScore: 88,
      notes: '사용자 직접 등록 위시리스트',
      pairingMatches: [
        { withItemId: 'current_wardrobe', withItemName: '보유 중인 기본 하의/상의', harmonyReason: '데일리 룩 확장 가능' }
      ]
    };

    setWishlist(prev => [newWish, ...prev]);
    setNewWishName('');
    setNewWishUrl('');
  };

  const handleDeleteWishlist = (id: string) => {
    setWishlist(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-2">
      {/* Top Header & Tab Controls */}
      <div className="bg-white dark:bg-[#202B38] rounded-lg p-3 px-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#7FA8DC] flex items-center justify-center text-white shadow-xs">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[9px] tracking-[0.15em] font-bold text-[#868E96]">CAPSULE WARDROBE LAB & SMART SHOPPING</p>
            <h3 className="text-base text-[#20304A] dark:text-white font-semibold">캡슐 워드로브 분석 & 스마트 쇼핑 가이드</h3>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#F4F7FC] dark:bg-[#26313F] p-1 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50]">
          <button
            id="tab-capsule-analysis"
            type="button"
            onClick={() => setActiveTab('capsule_analysis')}
            className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'capsule_analysis'
                ? 'bg-[#7FA8DC] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>캡슐 워드로브 진단</span>
          </button>
          <button
            id="tab-wishlist"
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`min-h-[34px] px-3.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-[#7FA8DC] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
            }`}
          >
            <ShoppingBag size={13} />
            <span>위시리스트 ({wishlist.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'capsule_analysis' ? (
          <div className="space-y-3 pb-4">
            {/* 1. Capsule Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white dark:bg-[#202B38] p-3 rounded-lg border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs">
                <span className="text-[10px] text-gray-500 font-medium">조합 가능한 코디 총수</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-[#7FA8DC]">{capsuleData?.totalCombinations || localMatrix.totalCombinations}</span>
                  <span className="text-xs text-gray-400">가지 착장</span>
                </div>
                <p className="text-[9px] text-emerald-600 font-medium mt-1">옷장 레버리지 활성 상태</p>
              </div>

              <div className="bg-white dark:bg-[#202B38] p-3 rounded-lg border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs">
                <span className="text-[10px] text-gray-500 font-medium">캡슐 옷장 완성도</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-[#20304A] dark:text-white">{capsuleData?.capsuleCompletenessScore || localMatrix.completenessScore}%</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-[#7FA8DC] transition-all duration-500" 
                    style={{ width: `${capsuleData?.capsuleCompletenessScore || localMatrix.completenessScore}%` }} 
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-[#202B38] p-3 rounded-lg border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-medium">가장 부족한 카테고리</span>
                  <div className="mt-1 font-bold text-xs sm:text-sm text-red-600 truncate">
                    {capsuleData?.bottleneckCategory || (localMatrix.outersCount === 0 ? '아우터' : localMatrix.bottomsCount <= 1 ? '하의' : '신발')}
                  </div>
                </div>
                <button
                  onClick={fetchCapsuleAnalysis}
                  disabled={isAnalyzingCapsule}
                  className="mt-2 min-h-[28px] px-2.5 py-1 text-[10px] bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#20304A] dark:text-gray-200 font-semibold rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzingCapsule ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>AI 정밀 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={11} />
                      <span>AI 진단 갱신</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Bottleneck Diagnosis Banner */}
            <div className="p-3 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] rounded-lg flex items-start gap-2.5">
              <Sparkles size={18} className="text-[#7FA8DC] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-white">
                    AI 캡슐 워드로브 진단 결과
                  </h4>
                  <span className="text-[9px] bg-[#7FA8DC]/15 text-[#20304A] dark:text-gray-200 font-bold px-1.5 py-0.5 rounded-sm">
                    핵심 레버리지 포인트
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  {capsuleData?.bottleneckMessage || `현재 보유하신 ${wardrobe.length}벌의 의류 데이터를 종합 분석했습니다. 아래 추천하는 핵심 기본 아이템을 보강하시면 적은 지출로도 연출 가능한 OOTD 가짓수가 최대 2배 이상 증가합니다.`}
                </p>
              </div>
            </div>

            {/* 3. High Leverage Shopping Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag size={15} className="text-[#7FA8DC]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-white">
                    코디 가짓수를 극대화하는 맞춤 쇼핑 추천
                  </h4>
                </div>
                <span className="text-[10px] text-gray-400">
                  클릭 시 네이버 최저가 쇼핑 바로 검색
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {(capsuleData?.recommendations || []).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#202B38] rounded-lg p-3 border border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC] transition-all shadow-xs flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-sm border border-emerald-200">
                          +{item.multiplierCombos}개 코디 추가 창출
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.estimatedPrice}
                        </span>
                      </div>

                      <h5 className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-white mt-1.5">
                        {item.name}
                      </h5>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: item.primaryColorHex }} />
                        <span>{item.primaryColor}</span>
                        <span>·</span>
                        <span>{item.subcategory}</span>
                      </div>

                      <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-2 leading-relaxed bg-[#F4F7FC] dark:bg-[#26313F] p-2 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50]">
                        {item.whyNeeded}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1.5 pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                      <a
                        href={item.shoppingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[32px] w-full px-3 py-1 bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#20304A] dark:text-gray-200 text-[11px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-[#D5E2F3] dark:border-[#2E3D50] cursor-pointer"
                      >
                        <ExternalLink size={12} className="text-[#7FA8DC]" />
                        <span>네이버 최저가 쇼핑 검색</span>
                      </a>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleAddShoppingItemToWishlist(item)}
                          className="min-h-[32px] px-2 py-1 bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-gray-100 dark:hover:bg-gray-700 text-[#20304A] dark:text-gray-200 text-[10px] font-semibold rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus size={12} />
                          <span>위시리스트</span>
                        </button>

                        <button
                          onClick={() => handleAddShoppingItemDirectlyToWardrobe(item)}
                          className="min-h-[32px] px-2 py-1 bg-[#7FA8DC] hover:bg-[#6894CD] text-white text-[10px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Check size={12} />
                          <span>옷장에 등록</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 4. Wishlist View */
          <div className="space-y-2.5 pb-4">
            <form onSubmit={handleCreateWishlistItem} className="bg-white dark:bg-[#202B38] p-2.5 px-3 rounded-lg border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newWishName}
                onChange={e => setNewWishName(e.target.value)}
                placeholder="사고 싶은 옷 이름 (예: 베이지 린넨 셔츠, 블랙 레더 자켓)"
                className="min-h-[38px] flex-1 min-w-[200px] text-xs sm:text-sm px-3 py-1.5 border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] text-[#20304A] dark:text-white rounded-md focus:outline-none focus:border-[#7FA8DC]"
              />

              <select
                value={newWishCategory}
                onChange={e => setNewWishCategory(e.target.value)}
                className="min-h-[38px] text-xs sm:text-sm px-3 py-1.5 border border-[#D5E2F3] dark:border-[#2E3D50] rounded-md focus:outline-none bg-white dark:bg-[#202B38] text-[#20304A] dark:text-white"
              >
                <option value="top">상의</option>
                <option value="bottom">하의</option>
                <option value="outer">아우터</option>
                <option value="shoes">신발</option>
                <option value="bag">가방</option>
                <option value="accessory">액세서리</option>
              </select>

              <input
                type="text"
                value={newWishUrl}
                onChange={e => setNewWishUrl(e.target.value)}
                placeholder="이미지 URL (선택사항)"
                className="min-h-[38px] w-48 text-xs sm:text-sm px-3 py-1.5 border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] text-[#20304A] dark:text-white rounded-md focus:outline-none focus:border-[#7FA8DC]"
              />

              <button
                type="submit"
                className="min-h-[38px] px-4 py-1.5 bg-[#7FA8DC] hover:bg-[#6894CD] text-white text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span>위시리스트 등록</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {wishlist.map(wish => (
                <div 
                  key={wish.id}
                  className="bg-white dark:bg-[#202B38] rounded-lg p-3 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-28 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
                      <ProgressiveImage
                        src={wish.imageUrl}
                        alt={wish.name}
                        fallbackColorHex={wish.colorHex}
                        categoryName={wish.category}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-sm border border-emerald-200">
                          옷장 궁합 {wish.compatibilityScore || 90}%
                        </span>
                        <button
                          onClick={() => handleDeleteWishlist(wish.id)}
                          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h5 className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-white mt-1 truncate">
                        {wish.name}
                      </h5>

                      {wish.brand && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{wish.brand} {wish.price ? `· ₩${wish.price.toLocaleString()}` : ''}</p>
                      )}

                      <div className="mt-2 p-2 bg-[#F4F7FC] dark:bg-[#26313F] rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] text-[10px] text-gray-600 dark:text-gray-300">
                        <p className="font-semibold text-[#20304A] dark:text-gray-200">기존 옷들과의 가상 페어링 시뮬레이션:</p>
                        {wish.pairingMatches?.map((match, i) => (
                          <p key={i} className="text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            • {match.withItemName}: {match.harmonyReason}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                    <span className="text-[10px] text-gray-400">등록일: {wish.addedAt}</span>

                    <button
                      onClick={() => onAddWishlistItemToWardrobe(wish)}
                      className="min-h-[34px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Check size={13} />
                      <span>실제 구매 완료 & 내 옷장으로 이동</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

