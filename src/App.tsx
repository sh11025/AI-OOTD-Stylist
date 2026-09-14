import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { ModernSidebar } from './components/ModernSidebar';
import { ModernTopBar } from './components/ModernTopBar';
import { WeatherTPOSelector } from './components/WeatherTPOSelector';
import { OutfitRecommendationView } from './components/OutfitRecommendationView';

// Code Splitting (Lazy Loading for large secondary tabs to optimize initial bundle size & load speed)
const WardrobeManager = lazy(() => import('./components/WardrobeManager').then(m => ({ default: m.WardrobeManager })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const OutfitHistoryView = lazy(() => import('./components/OutfitHistoryAndWishlist').then(m => ({ default: m.OutfitHistoryView })));

function TabLoadingFallback() {
  return (
    <div className="h-full min-h-0 flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <div className="w-7 h-7 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide">화면을 불러오는 중...</span>
      </div>
    </div>
  );
}
import { 
  ActiveTab,
  AppTheme,
  ClothingCategory, 
  ClothingItem, 
  OutfitGenerationResult,
  OutfitRecommendation, 
  SavedOutfit, 
  TPOScenario,
  UserProfile, 
  WeatherInfo, 
  WishlistItem,
  TPO_SCENARIOS, 
  SAMPLE_WARDROBE_ITEMS
} from './types';
import { 
  loadWardrobe, 
  saveWardrobe, 
  loadProfile, 
  saveProfile, 
  loadWeather, 
  saveWeather, 
  loadHistory, 
  saveHistory, 
  generateRuleBasedOutfit,
  preloadImages,
  syncLocalFilesToStorage
} from './helpers';
import { Sparkles, Power, X as CloseIcon, AlertTriangle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('recommendation');
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('vogue_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('vogue_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  // App Theme State
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('vogue_app_theme') as AppTheme) || 'light';
  });

  // Persistent State
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(() => loadWardrobe());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [weather, setWeather] = useState<WeatherInfo>(() => loadWeather());
  const [history, setHistory] = useState<SavedOutfit[]>(() => loadHistory());

  // Startup Sync: load from server files then update React state
  useEffect(() => {
    async function initSync() {
      const changed = await syncLocalFilesToStorage();
      if (changed) {
        setWardrobe(loadWardrobe());
        setProfile(loadProfile());
        setWeather(loadWeather());
        setHistory(loadHistory());
      }
    }
    initSync();
  }, []);


  useEffect(() => {
    localStorage.setItem('vogue_app_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [theme]);

  // Active Recommendation State
  const [selectedTpo, setSelectedTpo] = useState<TPOScenario>(TPO_SCENARIOS[0]);
  const [recommendationResult, setRecommendationResult] = useState<OutfitGenerationResult | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveWardrobe(wardrobe);
    // Background preload all wardrobe images for lightning-fast UI rendering
    if (wardrobe && wardrobe.length > 0) {
      preloadImages(wardrobe.map(w => w.imageUrl));
    }
  }, [wardrobe]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveWeather(weather);
  }, [weather]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Live Weather Fetcher
  const handleFetchLiveWeather = useCallback(async (cityName: string) => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather/current?city=${encodeURIComponent(cityName)}&apiKey=${encodeURIComponent(profile.openWeatherApiKey || '')}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setWeather(data.data);
      } else {
        // Fallback simulation
        setWeather(prev => ({
          ...prev,
          city: cityName,
          isManual: false,
          updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }));
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [profile.openWeatherApiKey]);

  // Initial load: Fetch weather if default city configured
  useEffect(() => {
    if (profile.defaultCity && !weather.isManual) {
      handleFetchLiveWeather(profile.defaultCity);
    }
  }, []);

  // Filter wardrobe based on inLaundry status
  const getFilteredWardrobeForRecommendation = useCallback(() => {
    const list = wardrobe.filter(w => !w.inLaundry);
    return list.length >= 3 ? list : wardrobe;
  }, [wardrobe]);

  // Generate Outfit with Gemini AI (or rule-based fallback)
  const handleGenerateOutfit = async () => {
    const candidateWardrobe = getFilteredWardrobeForRecommendation();
    if (candidateWardrobe.length < 3) {
      alert('스마트 옷장에 최소 3벌 이상의 옷이 등록되어 있어야 코디 추천이 가능합니다.');
      setActiveTab('wardrobe');
      return;
    }

    setIsAiGenerating(true);
    setStatusMessage('Gemini AI가 날씨, TPO, 체형 점수를 종합 분석 중입니다...');

    try {
      const response = await fetch('/api/gemini/recommend-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobe: candidateWardrobe,
          weather,
          tpo: selectedTpo,
          profile,
          selectedModel: profile.geminiModel || 'gemini-3.7-flash',
          customGeminiKey: profile.geminiApiKey || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const resObj = data.result || data.data;
        if (data.success && resObj) {
          setRecommendationResult(resObj);
          setStatusMessage(null);
          setActiveTab('optimal_outfits');
        } else {
          // Rule based fallback
          const fallback = generateRuleBasedOutfit(candidateWardrobe, weather, selectedTpo, profile);
          setRecommendationResult(fallback);
          setStatusMessage(null);
          setActiveTab('optimal_outfits');
        }
      } else {
        const fallback = generateRuleBasedOutfit(candidateWardrobe, weather, selectedTpo, profile);
        setRecommendationResult(fallback);
        setStatusMessage(null);
        setActiveTab('optimal_outfits');
      }
    } catch (err) {
      console.error('AI Outfit Error:', err);
      const fallback = generateRuleBasedOutfit(candidateWardrobe, weather, selectedTpo, profile);
      setRecommendationResult(fallback);
      setStatusMessage('최적 룰베이스 엔진으로 코디(A/B)를 산출했습니다.');
      setActiveTab('optimal_outfits');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Initial recommendation on first mount if none exists
  useEffect(() => {
    if (!recommendationResult && wardrobe.length > 0) {
      const initialFallback = generateRuleBasedOutfit(wardrobe, weather, selectedTpo, profile);
      setRecommendationResult(initialFallback);
    }
  }, []);

  // Save Outfit to Favorites / History
  const handleSaveOutfit = (recommendation: OutfitRecommendation) => {
    const newRecord: SavedOutfit = {
      id: `save_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      weather: { ...weather },
      tpo: { ...selectedTpo },
      recommendation,
      isLoggedWear: false,
      userRating: 5,
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  // Log Outfit as Worn Today
  const handleLogWearOutfit = (recommendation: OutfitRecommendation) => {
    const newRecord: SavedOutfit = {
      id: `wear_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      weather: { ...weather },
      tpo: { ...selectedTpo },
      recommendation,
      isLoggedWear: true,
      userRating: 5,
    };
    setHistory(prev => [newRecord, ...prev]);

    // Increase worn count on wardrobe items
    const itemIds = [
      recommendation.items.outer?.id,
      recommendation.items.top?.id,
      recommendation.items.bottom?.id,
      recommendation.items.shoes?.id,
      recommendation.items.bag?.id,
      recommendation.items.accessory?.id,
    ].filter(Boolean);

    setWardrobe(prev => prev.map(item => 
      itemIds.includes(item.id) 
        ? { ...item, timesWorn: (item.timesWorn || 0) + 1 }
        : item
    ));
  };

  // Swap Item inside Recommendation Option A or B
  const handleSwapItem = (optionId: 'A' | 'B', category: ClothingCategory, newItem: ClothingItem) => {
    if (!recommendationResult) return;

    setRecommendationResult(prev => {
      if (!prev) return null;
      const targetOption = optionId === 'A' ? prev.optionA : prev.optionB;
      const updatedItems = {
        ...targetOption.items,
        [category]: newItem,
      };

      const updatedOption: OutfitRecommendation = {
        ...targetOption,
        items: updatedItems,
        title: `${targetOption.title} (커스텀)`,
      };

      return {
        ...prev,
        [optionId === 'A' ? 'optionA' : 'optionB']: updatedOption,
      };
    });
  };

  // Add WishlistItem to Wardrobe
  const handleAddWishlistItemToWardrobe = (wish: WishlistItem) => {
    const newItem: ClothingItem = {
      id: `item_bought_${Date.now()}`,
      name: wish.name,
      category: wish.category,
      subcategory: wish.subcategory || '신규',
      primaryColor: wish.colorName || '베이지',
      primaryColorHex: wish.colorHex || '#3D405B',
      imageUrl: wish.imageUrl,
      seasons: ['spring', 'fall', 'winter'],
      minTemp: 10,
      maxTemp: 24,
      formality: 3,
      styleTags: ['스마트', '데일리'],
      material: '혼방',
      thickness: 'medium',
      isFavorite: true,
      timesWorn: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `위시리스트에서 구매 전환 등록 (${wish.brand || ''})`,
    };

    setWardrobe(prev => [newItem, ...prev]);
    alert(`🎉 '${wish.name}'이(가) 스마트 옷장에 등록되었습니다!`);
    setActiveTab('wardrobe');
  };

  // Reset Wardrobe
  const handleResetWardrobe = () => {
    if (confirm('스마트 옷장의 모든 데이터를 초기화하고 기본 20벌의 샘플 데이터로 복원하시겠습니까?')) {
      setWardrobe(SAMPLE_WARDROBE_ITEMS);
      alert('스마트 옷장이 기본 샘플로 초기화되었습니다.');
    }
  };

  // Export JSON
  const handleExportData = () => {
    const exportObj = {
      wardrobe,
      profile,
      history,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_ootd_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.wardrobe && Array.isArray(parsed.wardrobe)) {
        setWardrobe(parsed.wardrobe);
      }
      if (parsed.profile) {
        setProfile(parsed.profile);
      }
      if (parsed.history && Array.isArray(parsed.history)) {
        setHistory(parsed.history);
      }
      alert('백업 데이터가 성공적으로 복원되었습니다.');
    } catch (e) {
      alert('유효하지 않은 백업 JSON 파일입니다.');
    }
  };

  return (
    <div className={`aspect-16-9-desktop-container w-full h-screen flex flex-row ${theme === 'dark' ? 'bg-[#17212F] text-[#E4EBF5]' : 'bg-[#EAF1FB] text-[#3A4A63]'} overflow-hidden selection:bg-[#7FA8DC]/25 selection:text-[#20304A]`}>
      
      {/* 1. 좌측 모던 세로 사이드바 (A안 핵심 UI) */}
      <ModernSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        wardrobeCount={wardrobe.length}
        weather={weather}
        profile={profile}
        theme={theme}
        setTheme={setTheme}
        onRefreshWeather={() => handleFetchLiveWeather(weather.city)}
        isWeatherLoading={isWeatherLoading}
      />

      {/* 2. 우측 메인 영역: 슬림 탑바 + 넓은 메인 컨텐츠 캔버스 */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-transparent">
        
        {/* 슬림 모던 탑바 (브레드크럼, AI상태, 시계, 윈도우 조작) */}
        <ModernTopBar
          activeTab={activeTab}
          profile={profile}
          weather={weather}
          isAiGenerating={isAiGenerating}
          onRequestExit={() => setIsExitModalOpen(true)}
        />

        {/* 메인 컨텐츠 캔버스 (넉넉하고 시원한 뷰포트 여백 제공) */}
        <main className="flex-1 min-h-0 w-full p-2.5 sm:p-3 pb-2 overflow-hidden flex flex-col">
          
          {/* 상태 / 알림 토스트 (알림 있을 시 표시) */}
          {statusMessage && (
            <div className="mb-2 bg-[#4A3F35] text-[#FDFBF7] text-xs px-3.5 py-1.5 rounded-lg shadow-xs flex items-center justify-between animate-fade-in border border-white/10 shrink-0">
              <span className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#E1AD01]" />
                {statusMessage}
              </span>
              <button 
                onClick={() => setStatusMessage(null)}
                className="text-[#FDFBF7]/70 hover:text-white font-bold ml-3 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: WEATHER & TPO SETUP */}
          {activeTab === 'recommendation' && (
            <div className="h-full min-h-0 flex flex-col animate-fade-in">
              <WeatherTPOSelector
                weather={weather}
                setWeather={setWeather}
                selectedTpo={selectedTpo}
                setSelectedTpo={setSelectedTpo}
                onGenerateOutfit={handleGenerateOutfit}
                isGenerating={isAiGenerating}
                onFetchLiveWeather={handleFetchLiveWeather}
                recommendationResult={recommendationResult}
                onNavigateToOptimalTab={() => setActiveTab('optimal_outfits')}
              />
            </div>
          )}

          {/* TAB 2: CURATE OPTIMAL OUTFITS (A/B) */}
          {activeTab === 'optimal_outfits' && (
            <div className="h-full min-h-0 flex flex-col animate-fade-in">
              <OutfitRecommendationView
                recommendationResult={recommendationResult}
                wardrobe={wardrobe}
                weather={weather}
                tpo={selectedTpo}
                profile={profile}
                onSaveOutfit={handleSaveOutfit}
                onLogWearOutfit={handleLogWearOutfit}
                onSwapItem={handleSwapItem}
                onGenerateOutfit={handleGenerateOutfit}
                onNavigateToSetup={() => setActiveTab('recommendation')}
              />
            </div>
          )}

          {/* TAB 3: SMART WARDROBE (Code-split) */}
          {activeTab === 'wardrobe' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="h-full min-h-0 flex flex-col animate-fade-in">
                <WardrobeManager
                  wardrobe={wardrobe}
                  setWardrobe={setWardrobe}
                  profile={profile}
                  onAddWishlistItemToWardrobe={handleAddWishlistItemToWardrobe}
                  customGeminiKey={profile.geminiApiKey}
                />
              </div>
            </Suspense>
          )}

          {/* TAB: OUTFIT HISTORY & ARCHIVE (Code-split) */}
          {activeTab === 'history' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="h-full min-h-0 flex flex-col animate-fade-in">
                <OutfitHistoryView
                  history={history}
                  onSelectHistoricalOutfit={(outfit, histTpo) => {
                    setSelectedTpo(histTpo);
                    setRecommendationResult({
                      optionA: outfit,
                      optionB: outfit,
                      overallSummary: `아카이브에서 선택된 룩북 코디입니다. (${outfit.title})`,
                      temperatureAssessment: `${outfit.scores?.totalScore ? `적합도 ${outfit.scores.totalScore}점` : '기존 저장 코디'}`,
                    });
                    setActiveTab('optimal_outfits');
                  }}
                  onClearHistory={() => {
                    setHistory([]);
                    saveHistory([]);
                  }}
                  onDeleteHistoryItem={(id) => {
                    setHistory(prev => {
                      const next = prev.filter(h => h.id !== id);
                      saveHistory(next);
                      return next;
                    });
                  }}
                />
              </div>
            </Suspense>
          )}

          {/* TAB 4: USER PROFILE (Code-split) */}
          {activeTab === 'profile' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="h-full min-h-0 flex flex-col animate-fade-in">
                <ProfileView
                  profile={profile}
                  setProfile={setProfile}
                />
              </div>
            </Suspense>
          )}

          {/* TAB 5: SETTINGS & API INTEGRATION (Code-split) */}
          {activeTab === 'settings' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="h-full min-h-0 flex flex-col animate-fade-in">
                <SettingsView
                  profile={profile}
                  setProfile={setProfile}
                  theme={theme}
                  setTheme={setTheme}
                  onResetWardrobe={handleResetWardrobe}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                />
              </div>
            </Suspense>
          )}

        </main>
      </div>

      {/* 프로그램 중앙 종료 확인 모달 (Glassmorphism & 애니메이션) */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
          <div 
            className="w-full max-w-md bg-white dark:bg-[#202B38] rounded-xl shadow-2xl border border-[#D5E2F3] dark:border-white/10 overflow-hidden transform transition-all animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            {/* 모달 상단 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5E2F3] dark:border-white/10 bg-[#F4F7FC] dark:bg-[#1A232E]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shadow-2xs">
                  <Power size={18} />
                </div>
                <h3 className="text-base font-bold text-[#20304A] dark:text-white">
                  프로그램 종료
                </h3>
              </div>
              <button
                onClick={() => !isExiting && setIsExitModalOpen(false)}
                disabled={isExiting}
                className="w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
                title="취소"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#3A4A63] dark:text-[#E4EBF5] font-medium leading-relaxed">
                AI OOTD Stylist 프로그램을 종료하시겠습니까?
              </p>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#EAF1FB] dark:bg-[#141B24] border border-[#D5E2F3] dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
                <AlertTriangle size={15} className="text-[#7FA8DC] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  저장된 옷장, 코디 아카이브 및 개인 프로필 설정 데이터는 로컬 저장소에 안전하게 유지됩니다.
                </span>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#1A232E]/70 border-t border-[#D5E2F3] dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                disabled={isExiting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#3A4A63] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer border border-[#D5E2F3] dark:border-white/10"
              >
                계속 사용하기
              </button>
              <button
                type="button"
                disabled={isExiting}
                onClick={async () => {
                  setIsExiting(true);
                  // 1. 로컬 Express 서버 안전 종료 요청
                  try {
                    await fetch('/api/system/exit', { method: 'POST' }).catch(() => {});
                  } catch (e) {}

                  // 2. pywebview 데스크톱 창 닫기 시도
                  if ((window as any).pywebview?.api?.closeWindow) {
                    try {
                      (window as any).pywebview.api.closeWindow();
                      return;
                    } catch (e) {}
                  }

                  // 3. 브라우저 창 닫기
                  try {
                    window.close();
                  } catch (e) {}
                }}
                className="px-4.5 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExiting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>종료 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Power size={13} />
                    <span>프로그램 종료</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
