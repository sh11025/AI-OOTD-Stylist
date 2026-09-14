import React from 'react';
import { 
  Sparkles, 
  Shirt, 
  BookOpen, 
  User, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  RefreshCw, 
  CloudSun,
  Palette
} from 'lucide-react';
import { ActiveTab, AppTheme, UserProfile, WeatherInfo, BODY_TYPE_LABELS, PERSONAL_COLOR_LABELS } from '../types';
import logoImg from '../assets/logo.png';

interface ModernSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  wardrobeCount: number;
  weather: WeatherInfo;
  profile: UserProfile;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onRefreshWeather: () => void;
  isWeatherLoading: boolean;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  wardrobeCount,
  weather,
  profile,
  theme,
  setTheme,
  onRefreshWeather,
  isWeatherLoading,
}) => {
  const genderKorean = profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '공용';
  const bodyShapeKorean = BODY_TYPE_LABELS[profile.bodyType]?.label || profile.bodyType;

  // 내비게이션 메뉴 정의
  const navItems: { id: ActiveTab; label: string; subLabel: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'recommendation',
      label: '오늘의 코디 설정',
      subLabel: '기상 & TPO 조건 맞춤',
      icon: <CloudSun size={18} />,
    },
    {
      id: 'optimal_outfits',
      label: 'AI 최적 코디 추천',
      subLabel: 'A/B 듀얼 플랜 분석',
      icon: <Sparkles size={18} />,
    },
    {
      id: 'wardrobe',
      label: '스마트 옷장 관리',
      subLabel: '등록 의류 및 AI 분석',
      icon: <Shirt size={18} />,
      badge: wardrobeCount,
    },
    {
      id: 'history',
      label: '코디 룩북 & 기록',
      subLabel: '착용 로그 & 히스토리',
      icon: <BookOpen size={18} />,
    },
    {
      id: 'profile',
      label: '개인 프로필 스펙',
      subLabel: '체형 및 퍼스널 컬러',
      icon: <User size={18} />,
    },
    {
      id: 'settings',
      label: '시스템 환경 설정',
      subLabel: '테마 · API 연동 · 백업',
      icon: <Sliders size={18} />,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between transition-[width] duration-200 ease-in-out select-none shrink-0 z-30 max-h-screen overflow-hidden ${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#C9DDF5] text-[#20304A] border-r border-[#B7D2F0] dark:bg-[#2E3D50] dark:text-[#E4EBF5] dark:border-r dark:border-[#1E2937]`}
    >
      {/* 1. 상단 브랜드 헤더 영역 */}
      <div className="p-3.5 border-b border-[#B7D2F0]/70 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div 
          onClick={() => setActiveTab('recommendation')}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden min-w-0"
          title="AI OOTD Stylist 홈으로"
        >
          <div className="w-8 h-8 rounded-lg bg-[#7FA8DC] flex items-center justify-center text-white shrink-0 shadow-xs border border-white/20">
            <img src={logoImg} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 leading-tight animate-fade-in">
              <h2 className="text-sm font-extrabold tracking-tight text-[#20304A] dark:text-[#FFFFFF] truncate">
                AI OOTD Stylist
              </h2>
              <p className="text-[10px] text-[#3A4A63] dark:text-[#E4EBF5]/60 font-medium truncate">
                Smart Sky Fashion Curator
              </p>
            </div>
          )}
        </div>

        {/* 사이드바 접기/펼치기 버튼 */}
        <button
          id="btn-sidebar-collapse-toggle"
          onClick={() => setIsCollapsed(prev => !prev)}
          title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="w-7 h-7 rounded-md bg-white/40 hover:bg-white text-[#20304A] dark:bg-white/5 dark:hover:bg-white/15 dark:text-[#E4EBF5] flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-[#B7D2F0] dark:border-white/5"
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* 2. 네비게이션 메뉴 리스트 */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-1.5 no-scrollbar">
        {!isCollapsed && (
          <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-[#3A4A63]/60 dark:text-[#E4EBF5]/40 uppercase">
            Navigation Menu
          </p>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? `${item.label} (${item.subLabel})` : undefined}
              className={`w-full group relative flex items-center rounded-lg transition-all text-left cursor-pointer min-h-[42px] ${
                isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
              } ${
                isActive
                  ? 'bg-[#7FA8DC] text-white font-bold shadow-xs'
                  : 'text-[#3A4A63] hover:text-[#20304A] hover:bg-white/50 dark:text-[#E4EBF5]/80 dark:hover:text-white dark:hover:bg-white/10 font-medium'
              }`}
            >
              {/* 액티브 상태 좌측 미세 바 */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#B7C9E6] rounded-r-full" />
              )}

              {/* 아이콘 */}
              <div className={`shrink-0 transition-transform ${isActive ? 'scale-105 text-white' : 'text-[#3A4A63] group-hover:text-[#20304A] dark:text-[#E4EBF5]/70 dark:group-hover:text-white group-hover:scale-105'}`}>
                {item.icon}
              </div>

              {/* 라벨 (펼침 상태) */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        isActive 
                          ? 'bg-white text-[#7FA8DC]' 
                          : 'bg-white/70 text-[#20304A] dark:bg-white/15 dark:text-[#E4EBF5]/90'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] truncate block ${isActive ? 'text-white/90' : 'text-[#3A4A63]/70 dark:text-[#E4EBF5]/50'}`}>
                    {item.subLabel}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. 하단 사용자 위젯 & 퀵 토글 컨트롤 영역 */}
      <div className="p-2.5 border-t border-[#B7D2F0]/70 dark:border-white/10 space-y-2 bg-[#B7D2F0]/30 dark:bg-black/20 shrink-0">
        {/* 펼침 상태일 때만 보이는 상세 위젯 */}
        {!isCollapsed && (
          <div className="space-y-2 animate-fade-in">
            {/* 유저 미니 프로필 카드 */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="p-2 rounded-lg bg-white/70 hover:bg-white border border-[#B7D2F0] dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 transition-all cursor-pointer space-y-1"
              title="프로필 편집 바로가기"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-[#20304A] dark:text-[#FDFBF7]">
                  <span className="w-2 h-2 rounded-full bg-[#7FA8DC]" />
                  <span>{genderKorean} · {bodyShapeKorean}</span>
                </div>
                <span className="text-[10px] text-[#3A4A63] dark:text-[#FDFBF7]/60">{profile.height}cm · {profile.weight}kg</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#3A4A63] dark:text-[#FDFBF7]/70 pt-0.5">
                <span className="flex items-center gap-1">
                  <Palette size={11} className="text-[#7FA8DC]" />
                  <span>{PERSONAL_COLOR_LABELS[profile.personalColor]?.label || '퍼스널컬러 진단'}</span>
                </span>
                <span className="text-[#7FA8DC] dark:text-white/60">편집 →</span>
              </div>
            </div>

            {/* 실시간 날씨 위젯 */}
            <div className="p-2 rounded-lg bg-white/70 border border-[#B7D2F0] dark:bg-[#1E2937]/80 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#7FA8DC]/20 dark:bg-[#7FA8DC]/30 flex items-center justify-center shrink-0">
                  <CloudSun size={15} className="text-[#3A5D8A] dark:text-[#A4C4EE]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#20304A] dark:text-[#FFFFFF] truncate">
                    {weather.city} {weather.temp}°C
                  </p>
                  <p className="text-[9px] text-[#3A4A63] dark:text-[#E4EBF5]/80 truncate">
                    {weather.description}
                  </p>
                </div>
              </div>

              <button
                id="sidebar-btn-refresh-weather"
                onClick={onRefreshWeather}
                disabled={isWeatherLoading}
                title="날씨 새로고침"
                className="p-1 rounded-md hover:bg-white dark:hover:bg-white/10 text-[#3A4A63] hover:text-[#20304A] dark:text-[#E4EBF5] dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw size={13} className={isWeatherLoading ? 'animate-spin text-[#7FA8DC]' : 'text-[#7FA8DC] dark:text-[#A4C4EE]'} />
              </button>
            </div>
          </div>
        )}

        {/* 테마 토글 및 하단 액션 버튼 */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between gap-1'} pt-1`}>
          <button
            id="sidebar-btn-toggle-theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className={`rounded-lg bg-white/80 hover:bg-white text-[#20304A] border border-[#B7D2F0] dark:bg-white/10 dark:hover:bg-white/20 dark:text-[#FDFBF7] dark:border-white/10 flex items-center justify-center transition-colors cursor-pointer ${
              isCollapsed ? 'w-8 h-8' : 'px-2.5 py-1.5 text-xs gap-1.5 flex-1'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} className="text-amber-300" />
                {!isCollapsed && <span className="text-[11px] font-medium">라이트 모드</span>}
              </>
            ) : (
              <>
                <Moon size={14} className="text-[#7FA8DC]" />
                {!isCollapsed && <span className="text-[11px] font-medium">다크 모드</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
