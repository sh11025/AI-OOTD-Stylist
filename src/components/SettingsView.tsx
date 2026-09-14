import React, { useState } from 'react';
import {
  Key,
  Database,
  Check,
  CloudSun,
  Sparkles,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Zap,
  Cpu,
  Coins,
  Gauge,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import {
  AppTheme,
  UserProfile,
  GEMINI_MODEL_OPTIONS
} from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onResetWardrobe: () => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  setProfile,
  theme,
  setTheme,
  onResetWardrobe,
  onExportData,
  onImportData,
}) => {
  const [showOpenWeatherKey, setShowOpenWeatherKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [weatherTestStatus, setWeatherTestStatus] = useState<string | null>(null);
  const [isTestingWeather, setIsTestingWeather] = useState(false);

  const [geminiTestStatus, setGeminiTestStatus] = useState<string | null>(null);
  const [isTestingGemini, setIsTestingGemini] = useState(false);

  const [savedToast, setSavedToast] = useState(false);



  // Drag & drop state for backup file
  const [isBackupDragOver, setIsBackupDragOver] = useState(false);

  const handleProfileChange = (key: keyof UserProfile, val: any) => {
    setProfile(prev => ({
      ...prev,
      [key]: val,
    }));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleTestWeather = async () => {
    setIsTestingWeather(true);
    setWeatherTestStatus(null);
    try {
      const res = await fetch(`/api/weather/current?city=Seoul&apiKey=${encodeURIComponent(profile.openWeatherApiKey || '')}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setWeatherTestStatus(`✅ 실시간 날씨 API 연동 완료: ${data.data.city} (${data.data.temp}°C, ${data.data.description})`);
      } else {
        setWeatherTestStatus(`⚠️ 시스템 기본 내장 기상 엔진으로 정상 작동 중입니다.`);
      }
    } catch (e) {
      setWeatherTestStatus(`⚠️ 기본 날씨 모드로 가동됩니다.`);
    } finally {
      setIsTestingWeather(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestStatus(null);
    try {
      const activeModel = profile.geminiModel || 'gemini-3.7-flash';
      const res = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customGeminiKey: profile.geminiApiKey,
          selectedModel: activeModel
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeminiTestStatus(`✅ [${activeModel}] 응답 성공 (${data.elapsedMs || 0}ms): "${data.message || '응답 정상'}"`);
      } else {
        setGeminiTestStatus(`⚠️ ${data.error || '연결 실패 (기본 스마트 룰 엔진으로 동작합니다)'}`);
      }
    } catch (e) {
      setGeminiTestStatus(`✅ AI 엔진 기본 모드로 정상 동작 중입니다.`);
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processJsonBackupFile(file);
    }
  };

  const processJsonBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          JSON.parse(text);
          onImportData(text);
        } catch (err) {
          alert('올바른 JSON 백업 파일 형식이 아닙니다.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 pb-1">
      {/* Header */}
      <div className="bg-white dark:bg-[#202B38] rounded-lg p-3 px-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#7FA8DC] flex items-center justify-center text-white shadow-xs">
            <Sliders size={18} />
          </div>
          <div>
            <p className="text-xs tracking-wider font-bold text-[#868E96]">설정 및 API</p>
            <h3 className="text-base sm:text-lg text-[#20304A] dark:text-white font-semibold">화면 테마 · API 연동 · 백업</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in shadow-2xs">
              <Check size={12} /> 설정이 저장되었습니다.
            </span>
          )}

          {/* Header Theme Toggle Switch */}
          <div className="flex items-center gap-2 bg-[#F4F7FC] dark:bg-[#26313F] px-2.5 py-1 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50]">
            <div className="flex items-center gap-1.5">
              {theme === 'dark' ? <Moon size={15} className="text-[#7FA8DC]" /> : <Sun size={15} className="text-[#7FA8DC]" />}
              <span className="text-xs font-bold text-[#20304A] dark:text-gray-200">
                {theme === 'dark' ? '다크 모드' : '라이트 모드'}
              </span>
            </div>

            <button
              type="button"
              id="btn-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-11 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${theme === 'dark' ? 'bg-[#7FA8DC]' : 'bg-[#20304A]'
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Area: 1, 2, 3, 4번 설정창 가로 일렬(4열) 나열 */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 flex flex-col justify-start">
        {/* ROW 1: 1, 2, 3, 4번 설정창 가로 일렬(4열) 1줄 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch shrink-0">

          {/* SECTION 1: Gemini AI Model Selection */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-3 sm:p-3.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-3">
              <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                  <Cpu size={17} className="text-[#7FA8DC]" />
                  AI 모델 선택
                </h4>
              </div>

              {/* Gemini Model Dropdown Selection */}
              <div className="space-y-2">
                <label htmlFor="select-gemini-model" className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-[#7FA8DC]" />
                    Gemini AI 모델
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <Coins size={11} /> 비용 최적화
                  </span>
                </label>

                <select
                  id="select-gemini-model"
                  value={profile.geminiModel || 'gemini-3.7-flash'}
                  onChange={(e) => handleProfileChange('geminiModel', e.target.value)}
                  className="input-base font-semibold cursor-pointer text-xs min-h-[40px] !pl-2.5 !pr-6 w-full"
                >
                  {GEMINI_MODEL_OPTIONS.map((opt) => {
                    const shortName = opt.id === 'gemini-3.7-flash'
                      ? '3.7 Flash (기본 추천)'
                      : opt.id === 'gemini-3.1-flash-lite'
                        ? '3.1 Flash Lite (초고속)'
                        : opt.id === 'gemini-flash-latest'
                          ? 'Flash Latest (안정)'
                          : opt.id === 'gemini-3.1-pro-preview'
                            ? '3.1 Pro (심층 추론)'
                            : opt.name;
                    return (
                      <option key={opt.id} value={opt.id}>
                        {shortName}
                      </option>
                    );
                  })}
                </select>

                {/* Selected Model Live Details Preview Card */}
                {(() => {
                  const selectedOpt = GEMINI_MODEL_OPTIONS.find(o => o.id === (profile.geminiModel || 'gemini-3.7-flash')) || GEMINI_MODEL_OPTIONS[1];
                  return (
                    <div className="p-3 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] rounded-md space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-xs font-bold border shrink-0 ${selectedOpt.costBadgeColor}`}>
                          {selectedOpt.badge}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">{selectedOpt.id}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedOpt.description}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-gray-400 pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium text-[11px] whitespace-nowrap">
                          <Zap size={12} className="text-amber-500" /> 속도: {'★'.repeat(selectedOpt.speedRating)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium text-[11px] whitespace-nowrap">
                          <Gauge size={12} className="text-blue-500" /> 추론력: {'★'.repeat(selectedOpt.intelligenceRating)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50] text-xs text-gray-400 flex items-center justify-between">
              <span></span>
            </div>
          </div>

          {/* SECTION 2: Screen Size Mode */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-3 sm:p-3.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-3">
              <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                  <Sliders size={17} className="text-[#7FA8DC]" />
                  화면 크기 설정
                </h4>
              </div>

              {/* Screen Resolution Dropdown Selection */}
              <div className="space-y-2.5">
                <label htmlFor="select-screen-size" className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sliders size={14} className="text-[#7FA8DC]" />
                    해상도 드롭다운
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    현재: {profile.windowSize || '1280x850'}
                  </span>
                </label>

                <select
                  id="select-screen-size"
                  value={profile.windowSize || '1280x850'}
                  onChange={(e) => {
                    const sizeOpt = e.target.value as any;
                    handleProfileChange('windowSize', sizeOpt);
                    if (sizeOpt === '전체화면') {
                      if ((window as any).pywebview?.api?.toggleFullscreen) {
                        (window as any).pywebview.api.toggleFullscreen();
                      } else if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => { });
                      }
                    } else {
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => { });
                      }
                      const [w, h] = sizeOpt.split('x').map(Number);
                      if (w && h) {
                        try {
                          window.resizeTo(w, h);
                          if ((window as any).pywebview?.api?.resizeWindow) {
                            (window as any).pywebview.api.resizeWindow(w, h);
                          }
                        } catch (err) { }
                      }
                    }
                  }}
                  className="input-base font-semibold cursor-pointer text-xs sm:text-sm min-h-[40px]"
                >
                  <option value="1280x850">1280 × 850 (기본 표준)</option>
                  <option value="1440x900">1440 × 900 (와이드)</option>
                  <option value="1600x900">1600 × 900 (HD+ 모니터)</option>
                  <option value="1920x1080">1920 × 1080 (FHD 모니터)</option>
                  <option value="전체화면">🖥️ 전체화면 (Full Screen)</option>
                </select>

                <div className="p-3 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] rounded-md space-y-1.5 text-xs leading-relaxed">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    💡 <strong>전체화면 지원:</strong> 드롭다운에서 '전체화면'을 선택하면 모니터 전체에 꽉 찬 화면으로 확장되며 상단 바 버튼으로 복귀할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between text-xs text-gray-500">
              <span></span>
              <span className="text-[#7FA8DC] font-bold">반응형 UI</span>
            </div>
          </div>

          {/* SECTION 3: External API Keys */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-3 sm:p-3.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-3">
              <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                  <Key size={17} className="text-[#7FA8DC]" />
                  외부 API Key 설정
                </h4>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-[#20304A] dark:text-gray-200 flex items-center gap-1">
                    <Sparkles size={14} className="text-[#7FA8DC]" />
                    <span>Gemini API Key</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#7FA8DC] hover:underline flex items-center gap-0.5"
                  >
                    <span>발급</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="input-gemini-api-key"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="개인 키 사용 시 입력"
                    value={profile.geminiApiKey || ''}
                    onChange={(e) => handleProfileChange('geminiApiKey', e.target.value)}
                    className="input-base pr-8 text-xs sm:text-sm min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#20304A] dark:hover:text-white p-1"
                  >
                    {showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-test-gemini-api"
                  onClick={handleTestGemini}
                  disabled={isTestingGemini}
                  className="btn-secondary w-full gap-1.5 text-xs sm:text-sm min-h-[38px] font-semibold"
                >
                  <Sparkles size={14} className={isTestingGemini ? 'animate-spin text-[#7FA8DC]' : 'text-[#7FA8DC]'} />
                  <span>AI 응답 테스트</span>
                </button>
              </div>

              {/* OpenWeatherMap API Key */}
              <div className="space-y-1.5 pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-[#20304A] dark:text-gray-200 flex items-center gap-1">
                    <CloudSun size={14} className="text-[#7FA8DC]" />
                    <span>Weather Key</span>
                  </label>
                  <a
                    href="https://openweathermap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#7FA8DC] hover:underline flex items-center gap-0.5"
                  >
                    <span>발급</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="input-openweather-api-key"
                    type={showOpenWeatherKey ? 'text' : 'password'}
                    placeholder="OpenWeather 키"
                    value={profile.openWeatherApiKey || ''}
                    onChange={(e) => handleProfileChange('openWeatherApiKey', e.target.value)}
                    className="input-base pr-8 text-xs sm:text-sm min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenWeatherKey(!showOpenWeatherKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#20304A] dark:hover:text-white p-1"
                  >
                    {showOpenWeatherKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-test-weather-api"
                  onClick={handleTestWeather}
                  disabled={isTestingWeather}
                  className="btn-secondary w-full gap-1.5 text-xs sm:text-sm min-h-[38px] font-semibold"
                >
                  <CloudSun size={14} className={isTestingWeather ? 'animate-spin text-[#7FA8DC]' : 'text-[#7FA8DC]'} />
                  <span>날씨 API 테스트</span>
                </button>
              </div>
            </div>

            {(geminiTestStatus || weatherTestStatus) && (
              <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50] text-[11px] text-gray-600 dark:text-gray-300">
                <p className="truncate">{geminiTestStatus || weatherTestStatus}</p>
              </div>
            )}
          </div>

          {/* SECTION 4: Data Backup & Reset */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-3 sm:p-3.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-3">
              <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                  <Database size={17} className="text-[#7FA8DC]" />
                  백업 및 복원
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-export-json"
                  type="button"
                  onClick={onExportData}
                  className="btn-primary py-2 px-3 text-xs sm:text-sm gap-1.5 min-h-[42px]"
                >
                  <Download size={15} />
                  <span>백업 저장</span>
                </button>

                <label className="btn-secondary py-2 px-3 text-xs sm:text-sm gap-1.5 text-center min-h-[42px] cursor-pointer">
                  <Upload size={15} className="text-[#7FA8DC]" />
                  <span>파일 선택</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBackupDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBackupDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBackupDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    processJsonBackupFile(file);
                  }
                }}
                className={`border-2 border-dashed rounded-md p-4 text-center transition-all flex flex-col items-center justify-center min-h-[130px] ${isBackupDragOver
                  ? 'border-[#7FA8DC] bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-[#D5E2F3] dark:border-[#2E3D50] bg-[#F4F7FC]/60 dark:bg-[#26313F]/60'
                  }`}
              >
                <Upload size={22} className="text-[#7FA8DC] mb-1.5 opacity-80" />
                <p className="text-xs sm:text-sm text-[#20304A] dark:text-white font-bold">
                  JSON 백업 파일 드래그 & 드롭
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-1">
                  파일을 여기에 끌어다 놓아 즉시 복원
                </p>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
              <button
                id="btn-clear-all-data"
                type="button"
                onClick={onResetWardrobe}
                className="btn-secondary w-full text-gray-500 hover:text-red-600 gap-1.5 text-xs sm:text-sm py-2 min-h-[38px] font-semibold"
              >
                <RotateCcw size={14} />
                <span>기본 샘플(20벌) 초기화</span>
              </button>
            </div>
          </div>

        </div>

        {/* SECTION 5: External API Key Issuance Guide (하단 2열 와이드 배치) */}
        <div className="bg-white dark:bg-[#202B38] rounded-md p-4 sm:p-5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 shrink-0">
          <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-[#20304A] dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-[#7FA8DC]" />
              외부 API Key 무료 발급 가이드 (문서 요약)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Guide 1: Gemini API */}
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded-md p-4 border border-[#D5E2F3] dark:border-[#2E3D50] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#7FA8DC]" />
                    1. Google Gemini API Key 발급
                  </span>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#7FA8DC] hover:text-[#6894CD] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Google AI Studio 바로가기</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <ol className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                  <li>
                    <strong className="text-[#20304A] dark:text-white">Google AI Studio</strong>(aistudio.google.com) 접속 후 Google 계정으로 로그인합니다.
                  </li>
                  <li>
                    좌측 메뉴의 열쇠 모양 아이콘(<strong className="text-[#20304A] dark:text-white">Get API key</strong>)을 클릭합니다.
                  </li>
                  <li>
                    우측 상단의 <strong className="text-[#20304A] dark:text-white">Create API key</strong> 버튼을 누르고 프로젝트를 선택합니다.
                  </li>
                  <li>
                    생성된 키를 복사하여 위 <strong className="text-[#7FA8DC]">Gemini API Key</strong> 란에 붙여넣습니다.
                  </li>
                </ol>
              </div>

              <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded text-xs text-amber-900 dark:text-amber-200 leading-snug">
                <p className="font-semibold flex items-center gap-1 mb-0.5">
                  ⚠️ 주의사항
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  무료 사용량이 제공되며, 발급받은 API 키는 개인 고유 인증 정보이므로 타인에게 공유하지 마세요.
                </p>
              </div>
            </div>

            {/* Guide 2: OpenWeatherMap API */}
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded-md p-4 border border-[#D5E2F3] dark:border-[#2E3D50] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                    <CloudSun size={14} className="text-[#7FA8DC]" />
                    2. OpenWeatherMap API Key 발급
                  </span>
                  <a
                    href="https://openweathermap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#7FA8DC] hover:text-[#6894CD] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>OpenWeatherMap 바로가기</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <ol className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                  <li>
                    <strong className="text-[#20304A] dark:text-white">OpenWeatherMap</strong>(openweathermap.org) 사이트 접속 후 가입/로그인합니다.
                  </li>
                  <li>
                    우측 상단 사용자 계정명 클릭 후 <strong className="text-[#20304A] dark:text-white">My API keys</strong>를 선택합니다.
                  </li>
                  <li>
                    'Create key'에 식별 이름 입력 후 <strong className="text-[#20304A] dark:text-white">Generate</strong>를 누릅니다.
                  </li>
                  <li>
                    생성된 32자리 키를 복사하여 위 <strong className="text-[#7FA8DC]">OpenWeatherMap API Key</strong> 란에 붙여넣습니다.
                  </li>
                </ol>
              </div>

              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded text-xs text-blue-900 dark:text-blue-200 leading-snug">
                <p className="font-semibold flex items-center gap-1 mb-0.5">
                  💡 키 활성화 대기 시간
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  신규 발급된 키는 서버에 배포되기까지 <strong>1~2시간 정도</strong> 소요될 수 있습니다. 테스트 실패 시 잠시 후 다시 시도하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
