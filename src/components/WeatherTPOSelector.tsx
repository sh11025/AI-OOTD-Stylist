import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer, 
  MapPin, 
  Search, 
  Sparkles, 
  SlidersHorizontal,
  RefreshCw,
  Check,
  Clock,
  RotateCcw,
  Zap,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  OutfitGenerationResult, 
  ThreeHourWeatherSlot, 
  TPOScenario, 
  WeatherConditionType, 
  WeatherInfo,
  TPO_SCENARIOS
} from '../types';

interface WeatherTPOSelectorProps {
  weather: WeatherInfo;
  setWeather: React.Dispatch<React.SetStateAction<WeatherInfo>>;
  selectedTpo: TPOScenario;
  setSelectedTpo: (tpo: TPOScenario) => void;
  onGenerateOutfit: () => void;
  isGenerating: boolean;
  onFetchLiveWeather: (cityName: string) => Promise<void>;
  recommendationResult?: OutfitGenerationResult | null;
  onNavigateToOptimalTab?: () => void;
}

const PRESET_CITIES = [
  { name: 'Seoul', label: '서울' },
  { name: 'Busan', label: '부산' },
  { name: 'Jeju', label: '제주' },
  { name: 'Tokyo', label: '도쿄' },
  { name: 'New York', label: '뉴욕' },
  { name: 'Paris', label: '파리' },
];

const WEATHER_CONDITIONS: { type: WeatherConditionType; label: string; icon: any }[] = [
  { type: 'Clear', label: '맑음', icon: Sun },
  { type: 'Clouds', label: '구름', icon: Cloud },
  { type: 'Rain', label: '비', icon: CloudRain },
  { type: 'Snow', label: '눈', icon: CloudSnow },
  { type: 'Wind', label: '바람', icon: Wind },
  { type: 'Drizzle', label: '소나기', icon: CloudRain },
];

const THREE_HOUR_TEMPLATE = [
  { timeLabel: '00:00', timeName: '자정/새벽', tempOff: -3, feelsOff: -4, humOff: 12, rainFactor: 0.8 },
  { timeLabel: '03:00', timeName: '새벽/최저', tempOff: -5, feelsOff: -6, humOff: 18, rainFactor: 0.6 },
  { timeLabel: '06:00', timeName: '이른아침', tempOff: -4, feelsOff: -5, humOff: 14, rainFactor: 0.7 },
  { timeLabel: '09:00', timeName: '오전/출근', tempOff: -1, feelsOff: -1, humOff: 5, rainFactor: 0.9 },
  { timeLabel: '12:00', timeName: '점심/낮', tempOff: +2, feelsOff: +2, humOff: -5, rainFactor: 1.0 },
  { timeLabel: '15:00', timeName: '오후/최고', tempOff: +4, feelsOff: +4, humOff: -10, rainFactor: 1.1 },
  { timeLabel: '18:00', timeName: '저녁/퇴근', tempOff: +1, feelsOff: +0, humOff: 2, rainFactor: 0.9 },
  { timeLabel: '21:00', timeName: '밤/야간', tempOff: -2, feelsOff: -3, humOff: 8, rainFactor: 0.8 },
];

export const WeatherTPOSelector: React.FC<WeatherTPOSelectorProps> = ({
  weather,
  setWeather,
  selectedTpo,
  setSelectedTpo,
  onGenerateOutfit,
  isGenerating,
  onFetchLiveWeather,
  recommendationResult,
  onNavigateToOptimalTab,
}) => {
  const [cityInput, setCityInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(weather.isManual);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [baseDayTemp, setBaseDayTemp] = useState(weather.temp);
  
  // 단계별 AI 생성 피드백 상태
  const [generationStep, setGenerationStep] = useState(1);
  const [quickPreviewOpen, setQuickPreviewOpen] = useState(false);
  const [previewOption, setPreviewOption] = useState<'A' | 'B'>('A');

  // Step-by-step progress timer during AI generation
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationStep(1);
      timer1 = setTimeout(() => setGenerationStep(2), 650);
      timer2 = setTimeout(() => setGenerationStep(3), 1350);
    } else {
      setGenerationStep(1);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isGenerating]);

  // Compute 3-hour interval slots for today dynamically
  const threeHourSlots: ThreeHourWeatherSlot[] = useMemo(() => {
    if (weather.hourlyForecast && weather.hourlyForecast.length === 8 && !weather.isManual) {
      return weather.hourlyForecast;
    }

    const currentHour = new Date().getHours();
    return THREE_HOUR_TEMPLATE.map(t => {
      const slotHour = parseInt(t.timeLabel.split(':')[0], 10);
      const isCurrent = Math.abs(currentHour - slotHour) <= 1 || (currentHour >= 22 && slotHour === 0);
      const temp = Math.round(baseDayTemp + t.tempOff);
      const feelsLike = Math.round(baseDayTemp + t.feelsOff);
      const humidity = Math.min(95, Math.max(25, weather.humidity + t.humOff));
      const precipitationProb = Math.min(100, Math.max(0, Math.round((weather.precipitationProb ?? 10) * t.rainFactor)));
      
      let desc = `${t.timeName} ${temp}°C`;
      if (weather.condition === 'Rain') desc = `${t.timeName} 비 소식 (${precipitationProb}%)`;
      else if (weather.condition === 'Snow') desc = `${t.timeName} 눈 예보 (${precipitationProb}%)`;
      else if (t.tempOff >= 3) desc = `한낮 최고기온 ${temp}°C`;
      else if (t.tempOff <= -4) desc = `새벽/아침 최저 ${temp}°C`;

      return {
        timeLabel: t.timeLabel,
        timeName: t.timeName,
        temp,
        feelsLike,
        condition: weather.condition,
        description: desc,
        humidity,
        precipitationProb,
        windSpeed: weather.windSpeed,
        isCurrentTimeSlot: isCurrent,
      };
    });
  }, [weather.hourlyForecast, weather.isManual, weather.condition, weather.humidity, weather.precipitationProb, weather.windSpeed, baseDayTemp]);

  // Diurnal range metrics
  const { minSlot, maxSlot, diurnalRange } = useMemo(() => {
    if (!threeHourSlots.length) return { minSlot: null, maxSlot: null, diurnalRange: 0 };
    let min = threeHourSlots[0];
    let max = threeHourSlots[0];
    for (const slot of threeHourSlots) {
      if (slot.temp < min.temp) min = slot;
      if (slot.temp > max.temp) max = slot;
    }
    return {
      minSlot: min,
      maxSlot: max,
      diurnalRange: max.temp - min.temp,
    };
  }, [threeHourSlots]);

  // 3시간별 날씨 슬롯 '기온 변화 스파크라인/온도 곡선' 차트 좌표 계산 (확대/고대비)
  const sparklineData = useMemo(() => {
    if (!threeHourSlots.length) return null;
    const minT = Math.min(...threeHourSlots.map(s => s.temp));
    const maxT = Math.max(...threeHourSlots.map(s => s.temp));
    const range = Math.max(1, maxT - minT);
    
    // Total SVG viewBox width: 440, height: 75
    const points = threeHourSlots.map((slot, index) => {
      const x = 28 + (index * (384 / 7));
      const y = 52 - ((slot.temp - minT) / range) * 34;
      return { x, y, slot, index };
    });

    // Build smooth bezier curve
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} 75 L ${points[0].x} 75 Z`;

    return { points, pathD, areaD, minT, maxT };
  }, [threeHourSlots]);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setIsCityLoading(true);
    await onFetchLiveWeather(cityInput.trim());
    setIsCityLoading(false);
    setIsManualMode(false);
  };

  const handlePresetCity = async (cityName: string) => {
    setIsCityLoading(true);
    await onFetchLiveWeather(cityName);
    setIsCityLoading(false);
    setIsManualMode(false);
  };

  const handleTempChange = (newTemp: number) => {
    setBaseDayTemp(newTemp);
    setWeather(prev => ({
      ...prev,
      temp: newTemp,
      feelsLike: newTemp - (prev.windSpeed > 3 ? 2 : 0),
      isManual: true,
      selectedHourSlot: undefined,
    }));
  };

  const handleConditionChange = (condition: WeatherConditionType, desc: string) => {
    setWeather(prev => ({
      ...prev,
      condition,
      description: desc,
      isManual: true,
    }));
  };

  // Select a 3-hour slot to customize outfit for that specific time of day
  const handleSelectHourSlot = (slot: ThreeHourWeatherSlot) => {
    setWeather(prev => ({
      ...prev,
      temp: slot.temp,
      feelsLike: slot.feelsLike,
      condition: slot.condition,
      description: slot.description,
      humidity: slot.humidity,
      precipitationProb: slot.precipitationProb,
      selectedHourSlot: slot.timeLabel,
    }));
  };

  const handleResetToAverage = () => {
    setWeather(prev => ({
      ...prev,
      temp: baseDayTemp,
      feelsLike: baseDayTemp - (prev.windSpeed > 3 ? 2 : 0),
      selectedHourSlot: undefined,
    }));
  };

  const getWeatherIcon = (cond: WeatherConditionType, className = "w-5 h-5") => {
    switch (cond) {
      case 'Clear': return <Sun className={`${className} text-amber-500`} />;
      case 'Clouds': return <Cloud className={`${className} text-gray-500`} />;
      case 'Rain': return <CloudRain className={`${className} text-blue-500`} />;
      case 'Snow': return <CloudSnow className={`${className} text-indigo-300`} />;
      case 'Wind': return <Wind className={`${className} text-teal-500`} />;
      case 'Drizzle': return <CloudRain className={`${className} text-sky-400`} />;
      default: return <Sun className={`${className} text-amber-500`} />;
    }
  };

  // Active outfit recommendation for quick preview
  const activePreviewPlan = recommendationResult 
    ? (previewOption === 'A' ? recommendationResult.optionA : recommendationResult.optionB)
    : null;

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 relative">
      
      {/* AI STEP-BY-STEP PROGRESS MODAL OVERLAY */}
      {isGenerating && (
        <div className="absolute inset-0 z-50 bg-[#141B24]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in rounded-sm">
          <div className="bg-white dark:bg-[#202B38] rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] p-5 w-full max-w-md shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#D5E2F3] dark:border-[#2E3D50] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-[#7FA8DC] flex items-center justify-center text-white animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#20304A] dark:text-[#E4EBF5]">
                    Gemini AI 스마트 코디네이터
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    오늘의 기상 환경 및 [{selectedTpo.name}] 코디 분석 중
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#7FA8DC]">
                {generationStep === 1 ? '30%' : generationStep === 2 ? '65%' : '95%'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#7FA8DC] h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: generationStep === 1 ? '30%' : generationStep === 2 ? '65%' : '95%' }}
              />
            </div>

            {/* 3 Step Timeline Cards */}
            <div className="space-y-2 text-xs">
              <div className={`p-2 rounded-sm border flex items-center gap-2.5 transition-all ${
                generationStep >= 1 ? 'bg-[#F4F7FC] border-[#7FA8DC] text-[#20304A] font-semibold' : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  generationStep >= 1 ? 'bg-[#7FA8DC] text-white' : 'bg-gray-300 text-white'
                }`}>
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">🌤️ 실시간 기상 & TPO 시나리오 맥락 분석</p>
                  <p className="text-[9px] text-gray-500 truncate">
                    {weather.city} {weather.temp}°C ({weather.description}) · 격식도 ★{selectedTpo.formalityTarget}
                  </p>
                </div>
                {generationStep > 1 && <Check size={12} className="text-green-600" />}
              </div>

              <div className={`p-2 rounded-sm border flex items-center gap-2.5 transition-all ${
                generationStep >= 2 ? 'bg-[#F4F7FC] border-[#7FA8DC] text-[#20304A] font-semibold' : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  generationStep >= 2 ? 'bg-[#7FA8DC] text-white' : 'bg-gray-300 text-white'
                }`}>
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">👔 스마트 옷장 20종 필터링 & 체형 매칭</p>
                  <p className="text-[9px] text-gray-500 truncate">
                    세탁 중 제외, 쾌적 바지/방수/소품 필터 반영
                  </p>
                </div>
                {generationStep > 2 && <Check size={12} className="text-green-600" />}
              </div>

              <div className={`p-2 rounded-sm border flex items-center gap-2.5 transition-all ${
                generationStep >= 3 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  generationStep >= 3 ? 'bg-[#81B29A] text-white' : 'bg-gray-300 text-white'
                }`}>
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">🎨 퍼스널 컬러 조화 및 A/B 듀얼 플랜 최종 큐레이션</p>
                  <p className="text-[9px] text-gray-500 truncate">
                    메인 추천 룩 & 대체 데일리 룩 도출 완료 중...
                  </p>
                </div>
                {generationStep === 3 && <RefreshCw size={11} className="animate-spin text-emerald-600" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A/B 코디 퀵 프리뷰 슬라이드 인 드로어 (Quick Preview Slide Drawer) */}
      {quickPreviewOpen && recommendationResult && activePreviewPlan && (
        <div className="absolute inset-0 z-40 bg-[#141B24]/50 backdrop-blur-2xs flex justify-end animate-fade-in rounded-sm">
          <div className="w-full sm:w-[420px] bg-white dark:bg-[#202B38] h-full shadow-2xl border-l border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col justify-between p-3.5 space-y-2.5 overflow-hidden animate-slide-in">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-xs bg-[#7FA8DC]/15 flex items-center justify-center text-[#7FA8DC]">
                  <Sparkles size={13} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#20304A] dark:text-[#E4EBF5]">
                    실시간 맞춤 코디 퀵 프리뷰
                  </h3>
                  <p className="text-[9px] text-gray-500">
                    {weather.city} {weather.temp}°C · [{selectedTpo.name}] 맥락
                  </p>
                </div>
              </div>

              <button
                onClick={() => setQuickPreviewOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* A/B Plan Switcher Tab */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4F7FC] rounded-sm border border-[#D5E2F3] shrink-0 text-xs">
              <button
                onClick={() => setPreviewOption('A')}
                className={`py-1.5 px-2 rounded-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  previewOption === 'A'
                    ? 'bg-[#7FA8DC] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-white/80'
                }`}
              >
                <span>Plan A (메인 룩)</span>
                <span className="text-[9px] text-amber-200">★{recommendationResult.optionA.tpoFitScore}</span>
              </button>

              <button
                onClick={() => setPreviewOption('B')}
                className={`py-1.5 px-2 rounded-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  previewOption === 'B'
                    ? 'bg-[#7FA8DC] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-white/80'
                }`}
              >
                <span>Plan B (대체 룩)</span>
                <span className="text-[9px] text-white/90">★{recommendationResult.optionB.tpoFitScore}</span>
              </button>
            </div>

            {/* Plan Details & Items Body */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {/* Concept Title Card */}
              <div className="p-2.5 rounded-sm bg-[#F4F7FC] border border-[#D5E2F3] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] tracking-wider uppercase font-bold text-[#7FA8DC]">
                    {previewOption === 'A' ? '🎯 PRIMARY OOTD PLAN' : '✨ ALTERNATIVE DAILY PLAN'}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-gray-500">
                    <span>적합도 <strong className="text-[#20304A] dark:text-[#E4EBF5]">{activePreviewPlan.tpoFitScore}점</strong></span>
                    <span>·</span>
                    <span>컬러 <strong className="text-[#7FA8DC]">{activePreviewPlan.colorHarmonyScore}점</strong></span>
                  </div>
                </div>
                <h4 className="font-bold text-sm text-[#20304A] dark:text-[#E4EBF5]">
                  {activePreviewPlan.title}
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug">
                  {activePreviewPlan.conceptSummary}
                </p>
              </div>

              {/* Items Mini Grid */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#20304A] dark:text-[#E4EBF5] flex items-center gap-1">
                  <Layers size={10} className="text-[#7FA8DC]" />
                  <span>구성 착장 아이템</span>
                </span>

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {/* Outer if any */}
                  {activePreviewPlan.items.outer && (
                    <div className="p-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] flex items-center gap-2">
                      <img 
                        src={activePreviewPlan.items.outer.imageUrl} 
                        alt={activePreviewPlan.items.outer.name}
                        className="w-10 h-10 object-cover rounded-xs border border-gray-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] text-[#7FA8DC] font-bold block">아우터</span>
                        <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{activePreviewPlan.items.outer.name}</p>
                        <span className="text-[8px] text-gray-400 truncate block">{activePreviewPlan.items.outer.material}</span>
                      </div>
                    </div>
                  )}

                  {/* Top */}
                  <div className="p-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] flex items-center gap-2">
                    <img 
                      src={activePreviewPlan.items.top.imageUrl} 
                      alt={activePreviewPlan.items.top.name}
                      className="w-10 h-10 object-cover rounded-xs border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] text-[#7FA8DC] font-bold block">상의</span>
                      <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{activePreviewPlan.items.top.name}</p>
                      <span className="text-[8px] text-gray-400 truncate block">{activePreviewPlan.items.top.material}</span>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="p-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] flex items-center gap-2">
                    <img 
                      src={activePreviewPlan.items.bottom.imageUrl} 
                      alt={activePreviewPlan.items.bottom.name}
                      className="w-10 h-10 object-cover rounded-xs border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] text-[#7FA8DC] font-bold block">하의</span>
                      <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{activePreviewPlan.items.bottom.name}</p>
                      <span className="text-[8px] text-gray-400 truncate block">{activePreviewPlan.items.bottom.material}</span>
                    </div>
                  </div>

                  {/* Shoes */}
                  <div className="p-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#202B38] flex items-center gap-2">
                    <img 
                      src={activePreviewPlan.items.shoes.imageUrl} 
                      alt={activePreviewPlan.items.shoes.name}
                      className="w-10 h-10 object-cover rounded-xs border border-gray-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] text-[#7FA8DC] font-bold block">신발</span>
                      <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{activePreviewPlan.items.shoes.name}</p>
                      <span className="text-[8px] text-gray-400 truncate block">{activePreviewPlan.items.shoes.material}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layering & Weather Advice */}
              <div className="p-2 rounded-sm bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] text-[9px] text-[#20304A] dark:text-[#E4EBF5] space-y-1">
                <span className="font-bold flex items-center gap-1 text-[#7FA8DC]">
                  <Thermometer size={10} />
                  기상 적응 & 레이어드 팁
                </span>
                <p className="leading-snug text-[#3A4A63] dark:text-[#E4EBF5]">
                  {activePreviewPlan.layeringAdvice}
                </p>
              </div>
            </div>

            {/* Navigation CTA to Full Optimal Tab */}
            <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50] space-y-1.5 shrink-0">
              <button
                onClick={() => {
                  setQuickPreviewOpen(false);
                  if (onNavigateToOptimalTab) onNavigateToOptimalTab();
                }}
                className="w-full py-2 bg-[#7FA8DC] hover:bg-[#6E98D0] text-white rounded-sm font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>👔 전체 화면에서 A/B 디테일 비교 & 착용 기록하기</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Weather & TPO with Equal Heights (50-50 / 6-6 layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-3.5 flex-1 min-h-0 items-stretch">
        
        {/* LEFT: Weather Control Center (Equal Height Container) */}
        <div className="bg-white dark:bg-[#202B38] rounded-sm p-3 sm:p-4 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col shadow-xs h-full min-h-0 overflow-hidden">
          {/* Header & Mode Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
            <div>
              <p className="text-[11px] tracking-wider font-bold text-[#7FA8DC]">기상 정보</p>
              <h3 className="text-sm font-bold text-[#20304A] dark:text-[#E4EBF5]">실시간 날씨 정보 및 시간대 선택</h3>
            </div>

            <button
              id="btn-toggle-weather-mode"
              onClick={() => setIsManualMode(!isManualMode)}
              className={`text-xs px-3 py-1.5 rounded-sm border flex items-center gap-1.5 font-medium transition-colors cursor-pointer min-h-[36px] ${
                isManualMode
                  ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] font-bold shadow-xs'
                  : 'bg-[#F4F7FC] border-[#D5E2F3] text-[#3A4A63] hover:bg-white'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>{isManualMode ? '수동 조절 모드' : 'API 실시간'}</span>
            </button>
          </div>

          {/* Body for Left Panel */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-0 space-y-2">
            {/* City Search & Preset Buttons */}
            <div className="space-y-2">
              <form onSubmit={handleCitySearch} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="도시명 검색 (서울, 부산, 제주, 도쿄, 뉴욕...)"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F4F7FC] border border-[#D5E2F3] rounded-sm focus:outline-none focus:border-[#7FA8DC] text-[#20304A] leading-tight min-h-[40px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCityLoading}
                  className="px-4 py-2 bg-[#7FA8DC] text-white rounded-sm hover:bg-[#6E98D0] transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer min-h-[40px] shadow-xs"
                >
                  {isCityLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  <span>조회</span>
                </button>
              </form>

              {/* City Presets */}
              <div className="flex flex-wrap gap-1 items-center pt-0.5">
                <span className="text-xs text-gray-400 mr-0.5">도시:</span>
                {PRESET_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handlePresetCity(city.name)}
                    className={`text-xs px-2 py-0.5 rounded-sm transition-colors cursor-pointer min-h-[26px] flex items-center ${
                      weather.city.toLowerCase().includes(city.name.toLowerCase()) || weather.city.includes(city.label)
                        ? 'bg-[#7FA8DC] text-white font-semibold shadow-xs'
                        : 'bg-[#F4F7FC] text-[#3A4A63] hover:bg-white border border-[#D5E2F3]'
                    }`}
                  >
                    {city.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current / Active Weather Card */}
            <div className="p-3 sm:p-4 rounded-sm bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-[#20304A]/70 dark:text-[#E4EBF5]/70 font-semibold">
                    <MapPin size={12} className="text-[#7FA8DC]" />
                    <span>{weather.city}</span>
                    <span className="text-gray-400">· AM {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-2xl text-[#20304A] dark:text-[#E4EBF5]">
                      {weather.temp}°C
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      (체감 {weather.feelsLike}°C)
                    </span>
                    <span className="text-xs font-semibold text-[#7FA8DC] ml-1">
                      {weather.description}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-white dark:bg-[#202B38] rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-center shadow-2xs">
                  {getWeatherIcon(weather.condition, "w-7 h-7")}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50] text-xs">
                <div className="bg-white dark:bg-[#202B38] px-2 py-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Droplets size={12} className="text-[#7FA8DC]" /> 습도</span>
                  <span className="font-bold text-[#20304A] dark:text-[#E4EBF5]">{weather.humidity}%</span>
                </div>

                <div className="bg-white dark:bg-[#202B38] px-2 py-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><Wind size={12} className="text-teal-600" /> 풍속</span>
                  <span className="font-bold text-[#20304A] dark:text-[#E4EBF5]">{weather.windSpeed}m/s</span>
                </div>

                <div className="bg-white dark:bg-[#202B38] px-2 py-1.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><CloudRain size={12} className="text-indigo-500" /> 강수</span>
                  <span className="font-bold text-[#20304A] dark:text-[#E4EBF5]">{weather.precipitationProb ?? 10}%</span>
                </div>
              </div>
            </div>

            {/* 3-HOUR INTERVAL TODAY'S TIMELINE (Always Visible, Compact) */}
            <div className="pt-1.5 border-t border-[#D5E2F3] dark:border-[#2E3D50] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock size={13} className="text-[#7FA8DC]" />
                  <span className="font-bold text-[#20304A] dark:text-[#E4EBF5]">3시간 주기 기상 변화</span>
                </div>
                {weather.selectedHourSlot ? (
                  <button
                    type="button"
                    onClick={handleResetToAverage}
                    className="text-xs text-[#7FA8DC] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw size={10} />
                    <span>전체 평균 복귀 ({weather.selectedHourSlot})</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">시간대를 클릭하여 시간별 코디 설정</span>
                )}
              </div>

              {/* ULTRA-COMPACT MINI TEMPERATURE CURVE CHART (Enlarged Height) */}
              {sparklineData && (
                <div className="w-full bg-[#F4F7FC] dark:bg-[#26313F] rounded-xs p-1 border border-[#D5E2F3] dark:border-[#2E3D50] overflow-hidden shrink-0">
                  <svg viewBox="0 0 440 75" className="w-full h-28 overflow-visible">
                    <defs>
                      <linearGradient id="miniTempCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7FA8DC" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#7FA8DC" stopOpacity="0.03" />
                      </linearGradient>
                    </defs>
                    {/* Gradient Area under curve */}
                    <path d={sparklineData.areaD} fill="url(#miniTempCurveGrad)" />
                    {/* Smooth Spline Curve */}
                    <path
                      d={sparklineData.pathD}
                      fill="none"
                      stroke="#7FA8DC"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Tiny Dots for 8 Slots */}
                    {sparklineData.points.map((pt) => {
                      const isSelected = weather.selectedHourSlot === pt.slot.timeLabel;
                      return (
                        <circle
                          key={pt.slot.timeLabel}
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? 6 : 4}
                          fill={isSelected ? '#7FA8DC' : '#A0B4CC'}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* 3-HOUR SLOT GRID (Compact) */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {threeHourSlots.map((slot) => {
                  const isSelected = weather.selectedHourSlot === slot.timeLabel;
                  const isCurrent = slot.isCurrentTimeSlot;

                  return (
                    <button
                      key={slot.timeLabel}
                      type="button"
                      onClick={() => handleSelectHourSlot(slot)}
                      className={`p-1 rounded-sm border text-center transition-all flex flex-col items-center justify-between relative cursor-pointer min-h-[64px] ${
                        isSelected
                          ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] shadow-xs font-semibold'
                          : isCurrent
                          ? 'bg-[#B7C9E6]/30 border-[#7FA8DC] text-[#20304A]'
                          : 'bg-[#F4F7FC] border-[#D5E2F3] hover:border-[#7FA8DC]/40 text-[#3A4A63]'
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${isSelected ? 'text-white/90' : 'text-[#3A4A63]/70'}`}>
                        {isSelected ? '선택' : isCurrent ? '현재' : slot.timeName.split('/')[0]}
                      </span>

                      <span className="text-xs font-bold">
                        {slot.timeLabel}
                      </span>

                      <div className="my-0.5 scale-90">
                        {getWeatherIcon(slot.condition, "w-4 h-4")}
                      </div>

                      <span className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-[#20304A]'
                      }`}>
                        {slot.temp}°C
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Diurnal Range Tip (One-line compact style with flex-wrap) */}
              {minSlot && maxSlot && (
                <div className="p-1.5 rounded-sm bg-[#F4F7FC] border border-[#D5E2F3] text-xs text-[#20304A] flex flex-wrap items-center justify-between gap-1">
                  <span className="flex items-center gap-1 font-semibold text-[#3A4A63]">
                    <Thermometer size={12} className="text-[#7FA8DC]" />
                    <span>최저 {minSlot.temp}°C ~ 최고 {maxSlot.temp}°C (일교차 {diurnalRange}°C)</span>
                  </span>
                  <span className="font-medium text-xs text-[#7FA8DC]">
                    {diurnalRange >= 8 ? '일교차 대비 외투 필수 💡' : '안정적인 기온 💡'}
                  </span>
                </div>
              )}
            </div>


          </div>
        </div>

        {/* RIGHT: TPO Scenario Grid & Selected Guide (Equal Height Container) */}
        <div className="bg-white dark:bg-[#202B38] rounded-sm p-3 sm:p-4 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col shadow-xs h-full min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
            <div>
              <p className="text-[11px] tracking-wider font-bold text-[#7FA8DC]">외출 목적</p>
              <h3 className="text-sm font-bold text-[#20304A] dark:text-[#E4EBF5]">외출 목적 선택</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3A4A63] dark:text-gray-300 hidden sm:inline">
                현재 선택: <strong className="text-[#7FA8DC]">{selectedTpo.name}</strong>
              </span>
              <span className="text-xs text-[#20304A] dark:text-[#E4EBF5] bg-[#B7C9E6]/40 dark:bg-[#2E3D50] px-2 py-0.5 rounded-xs font-semibold">
                ⚡ 클릭하여 선택
              </span>
            </div>
          </div>

          {/* Body: 7 TPO Grid + Selected TPO Detail Card + Relocated Temp Control */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-0 space-y-2 flex flex-col justify-start">
            <div className="space-y-2 flex flex-col shrink-0">
              {/* 7 TPO SCENARIOS - 3열 고정 그리드 배치 (오선택 완전 방지) */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                {TPO_SCENARIOS.map((tpo) => {
                  const isSelected = selectedTpo.id === tpo.id;
                  const keywordMap: Record<string, string> = {
                    tpo_business_formal: '👔 포멀 오피스',
                    tpo_business_casual: '💼 비즈 캐주얼',
                    tpo_daily_weekend: '☕ 데일리 카페',
                    tpo_date_special: '💖 데이트/기념일',
                    tpo_sports_outdoor: '🏃 스포츠/야외',
                    tpo_home_lounge: '🏡 가벼운 마실',
                    tpo_no_going_out: '🪑 외출 없음 (홈)',
                  };
                  const displayLabel = keywordMap[tpo.id] || tpo.name;

                  return (
                    <button
                      key={tpo.id}
                      id={`btn-tpo-${tpo.id}`}
                      type="button"
                      onClick={() => setSelectedTpo(tpo)}
                      onDoubleClick={() => {
                        setSelectedTpo(tpo);
                        onGenerateOutfit();
                      }}
                      className={`px-1.5 sm:px-2 py-2 rounded-sm border text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[44px] shadow-3xs ${
                        isSelected
                          ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] ring-1 ring-[#7FA8DC]/30 font-bold shadow-xs'
                          : 'bg-[#F4F7FC] text-[#3A4A63] border-[#D5E2F3] hover:bg-white hover:border-[#7FA8DC]/40'
                      }`}
                    >
                      <span className="nowrap-label">{displayLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* SELECTED TPO DEEP-DIVE STYLING & CONTEXT CARD (Flexible Responsive Layout) */}
              <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded-sm p-3 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col justify-between space-y-2 shrink-0 text-xs text-[#3A4A63] dark:text-[#E4EBF5]">
                {/* 1단: 가이드 텍스트 & 기온 팁 (해상도에 따라 자연스럽게 줄바꿈) */}
                <div className="flex flex-wrap items-center justify-between pb-1.5 border-b border-[#D5E2F3] dark:border-[#2E3D50] gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px] text-xs">
                    <span className="font-extrabold text-[#7FA8DC] shrink-0">💡 [{selectedTpo.name}]</span>
                    <span className="text-gray-700 dark:text-gray-300 break-keep line-clamp-2 text-xs">
                      {selectedTpo.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
                    <span className="bg-white dark:bg-[#202B38] px-1.5 py-0.5 rounded border border-[#D5E2F3] dark:border-[#2E3D50] font-semibold">
                      격식도 ★{selectedTpo.formalityTarget}
                    </span>
                    <span className="bg-white dark:bg-[#202B38] px-1.5 py-0.5 rounded border border-[#D5E2F3] dark:border-[#2E3D50]">
                      기온 팁: {weather.temp >= 26 ? '린넨/통풍 소재' : weather.temp <= 10 ? '포멀 코트/무거운 이너' : '자켓/가디건 레이어드'}
                    </span>
                  </div>
                </div>

                {/* 2단: 추천 스타일 칩 & 원클릭 생성 버튼 */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-xs text-[#20304A] dark:text-[#E4EBF5] shrink-0">스타일:</span>
                    {selectedTpo.recommendedStyles.map((style) => (
                      <span key={style} className="px-1.5 py-0.5 bg-white dark:bg-[#202B38] border border-[#D5E2F3] dark:border-[#2E3D50] text-[#3A4A63] dark:text-[#E4EBF5] rounded-xs text-[11px] font-medium whitespace-nowrap shadow-3xs">
                        #{style}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onGenerateOutfit}
                    className="text-xs text-white hover:bg-[#6895cc] font-bold flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-sm bg-[#7FA8DC] shrink-0 shadow-2xs transition-colors ml-auto"
                  >
                    <Zap size={10} />
                    <span>이 조건으로 바로 코디 생성</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Relocated Temperature & Condition Control (Expanded Layout) */}
            <div className="pt-2.5 border-t border-[#D5E2F3] dark:border-[#2E3D50] shrink-0 bg-[#F4F7FC] dark:bg-[#26313F] p-3 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] space-y-3">
              {/* Temperature Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-[#20304A] dark:text-[#E4EBF5] flex items-center gap-1">
                    <Thermometer size={14} className="text-[#7FA8DC]" />
                    기준 기온 수동 미세 조정
                  </span>
                  <span className="font-bold text-[#7FA8DC] text-sm">
                    {weather.temp}°C
                  </span>
                </div>
                <input
                  id="input-weather-temp-slider"
                  type="range"
                  min="-15"
                  max="38"
                  value={weather.temp}
                  onChange={(e) => handleTempChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#7FA8DC]"
                />
              </div>

              {/* Weather Condition Pills (3-Column 2-Row Grid) */}
              <div className="space-y-1.5 pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                <p className="text-xs font-bold text-[#20304A] dark:text-[#E4EBF5] mb-1">날씨 상태 선택</p>
                <div className="grid grid-cols-3 gap-2">
                  {WEATHER_CONDITIONS.map((cond) => {
                    const Icon = cond.icon;
                    const isSelected = weather.condition === cond.type;
                    return (
                      <button
                        key={cond.type}
                        type="button"
                        onClick={() => handleConditionChange(cond.type, cond.label)}
                        className={`flex items-center justify-center gap-2 p-2 px-3 rounded-xs border transition-all text-left cursor-pointer min-h-[42px] ${
                          isSelected
                            ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] font-bold shadow-xs'
                            : 'bg-white dark:bg-[#202B38] text-[#3A4A63] dark:text-[#E4EBF5] border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC]/40'
                        }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-white' : 'text-[#7FA8DC]'} />
                        <span className="text-xs font-semibold whitespace-nowrap">{cond.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT BOTTOM ACTION BAR - 상하 크기 시원하게 확장하여 하단 여백 제거 */}
      <div className="bg-[#FFFFFF] text-[#20304A] dark:bg-[#202B38] dark:text-[#E4EBF5] p-3 sm:p-3.5 px-4 sm:px-5 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0 min-h-[64px]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-[#7FA8DC]/15 flex items-center justify-center text-[#7FA8DC] shrink-0 shadow-2xs">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[11px] tracking-wider text-[#7FA8DC] font-bold uppercase whitespace-nowrap block mb-0.5">선택된 조건 요약</span>
            <p className="text-sm sm:text-base text-[#20304A] dark:text-[#E4EBF5] leading-snug break-keep font-bold">
              {weather.city} ({weather.temp}°C, {weather.description}) · [{selectedTpo.name}] TPO 맥락
              {weather.selectedHourSlot ? ` · [${weather.selectedHourSlot} 맞춤]` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Preview Drawer Open Trigger Button */}
          {recommendationResult && (
            <button
              id="btn-quick-preview-ootd"
              type="button"
              onClick={() => setQuickPreviewOpen(true)}
              className="btn-secondary !bg-transparent !border-[#7FA8DC] !text-[#7FA8DC] hover:!bg-[#7FA8DC]/10 gap-2 min-h-[46px] px-4 font-semibold text-xs sm:text-sm"
            >
              <Layers size={16} className="text-[#7FA8DC]" />
              <span>A/B 코디 퀵 프리뷰</span>
            </button>
          )}

          {/* Primary AI Outfit Generation Button */}
          <button
            id="btn-generate-ootd"
            onClick={onGenerateOutfit}
            disabled={isGenerating}
            className="btn-primary px-7 sm:px-8 tracking-wide gap-2.5 min-h-[46px] text-sm sm:text-base font-bold shadow-xs"
          >
            <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
            <span className="whitespace-nowrap">
              {isGenerating 
                ? 'Gemini AI 코디 분석 중...' 
                : `최적 맞춤 코디 생성하기 (A/B 듀얼 플랜) →`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
