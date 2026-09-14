import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Cpu, Clock } from 'lucide-react';
import { ActiveTab, UserProfile, WeatherInfo, GEMINI_MODEL_OPTIONS } from '../types';

interface ModernTopBarProps {
  activeTab: ActiveTab;
  profile: UserProfile;
  weather?: WeatherInfo;
  isAiGenerating: boolean;
  onRequestExit?: () => void;
}

export const ModernTopBar: React.FC<ModernTopBarProps> = ({
  activeTab,
  profile,
  isAiGenerating,
  onRequestExit,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit',
          weekday: 'short',
        }) + ' ' + now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFullscreen = () => {
    if ((window as any).pywebview?.api?.toggleFullscreen) {
      (window as any).pywebview.api.toggleFullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCloseWindow = () => {
    if (onRequestExit) {
      onRequestExit();
      return;
    }
    if ((window as any).pywebview?.api?.closeWindow) {
      (window as any).pywebview.api.closeWindow();
      return;
    }
    window.close();
  };

  const handleMinimize = () => {
    if ((window as any).pywebview?.api?.minimizeWindow) {
      (window as any).pywebview.api.minimizeWindow();
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };


  const activeModelName = GEMINI_MODEL_OPTIONS.find(m => m.id === (profile.geminiModel || 'gemini-3.7-flash'))?.name || 'Gemini 3.7 Flash';

  const tabTitleMap: Record<ActiveTab, { title: string; subtitle: string }> = {
    recommendation: { title: '오늘의 코디 설정', subtitle: '실시간 날씨와 TPO에 최적화된 조건 빌더' },
    optimal_outfits: { title: 'AI 최적 코디 추천', subtitle: 'Gemini AI 멀티모달 분석 A/B 듀얼 착장 플랜' },
    wardrobe: { title: '스마트 옷장 관리', subtitle: '보유 의류 갤러리 및 카테고리별 스마트 태깅' },
    history: { title: '코디 룩북 & 기록', subtitle: '실제 착용 기록과 날짜별 OOTD 아카이브' },
    profile: { title: '개인 프로필 스펙', subtitle: '신체 스펙, 퍼스널 컬러 진단 및 선호 스타일' },
    settings: { title: '시스템 환경 설정', subtitle: '테마 전환, API 연동, 데이터 백업 및 복원' },
  };

  const currentTabInfo = tabTitleMap[activeTab] || { title: '코디네이터', subtitle: '' };

  return (
    <header 
      style={{ WebkitAppRegion: 'drag' } as any}
      className="pywebview-drag-region h-11 border-b border-[#D5E2F3] dark:border-white/10 bg-white/70 dark:bg-[#202B38]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 select-none z-20"
    >
      {/* 1. 좌측 브레드크럼 & 현재 위치 */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-bold text-[#7FA8DC] hidden md:inline">OOTD Studio</span>
        <span className="text-xs text-[#3A4A63]/30 dark:text-white/30 hidden md:inline">/</span>
        <h1 className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-[#FFFFFF] flex items-center gap-1.5 truncate">
          <span>{currentTabInfo.title}</span>
          <span className="text-[11px] font-normal text-[#3A4A63]/70 dark:text-[#E4EBF5]/60 hidden lg:inline border-l border-[#D5E2F3] dark:border-white/20 pl-2">
            {currentTabInfo.subtitle}
          </span>
        </h1>
      </div>

      {/* 2. 우측 상태 인디케이터 및 윈도우 조작 바 */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs shrink-0">
        {/* AI 엔진 상태 */}
        <div className="flex items-center gap-1.5 px-2 py-0.8 rounded-full bg-[#7FA8DC]/15 border border-[#7FA8DC]/30 text-[11px] text-[#20304A] dark:bg-white/5 dark:border-white/10 dark:text-[#E4EBF5]">
          <span className={`w-2 h-2 rounded-full ${isAiGenerating ? 'bg-amber-400 animate-ping' : 'bg-[#7FA8DC]'}`} />
          <Cpu size={12} className="text-[#7FA8DC]" />
          <span className="font-medium hidden sm:inline">{activeModelName}</span>
          {isAiGenerating && <span className="text-amber-500 text-[10px] font-bold">분석 중...</span>}
        </div>

        {/* 실시간 시계 */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#3A4A63]/80 dark:text-[#E4EBF5]/70">
          <Clock size={11} className="text-[#7FA8DC]" />
          <span>{timeStr}</span>
        </div>

        {/* 윈도우 창 제어 버튼 (최소화, 최대화, 닫기) */}
        <div 
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="flex items-center pl-1 border-l border-[#D5E2F3] dark:border-white/10 select-none z-30"
        >
          <button
            id="win-btn-minimize"
            onClick={handleMinimize}
            title="최소화"
            className="w-7 h-7 rounded hover:bg-black/5 text-[#3A4A63] hover:text-[#20304A] dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus size={11} />
          </button>
          <button
            id="win-btn-maximize"
            onClick={handleToggleFullscreen}
            title="최대화"
            className="w-7 h-7 rounded hover:bg-black/5 text-[#3A4A63] hover:text-[#20304A] dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Square size={9} />
          </button>
          <button
            id="win-btn-close"
            onClick={handleCloseWindow}
            title="닫기"
            className="w-7 h-7 rounded hover:bg-red-500 hover:text-white text-[#3A4A63] dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>

      </div>
    </header>
  );
};
