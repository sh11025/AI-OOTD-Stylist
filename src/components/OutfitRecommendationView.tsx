import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  Bookmark, 
  Share2, 
  Palette, 
  ArrowLeftRight, 
  Send, 
  RefreshCw, 
  Check, 
  MessageSquare, 
  Flame, 
  Shirt, 
  X, 
  Cpu 
} from 'lucide-react';
import { 
  ClothingCategory, 
  ClothingItem, 
  OutfitGenerationResult, 
  OutfitRecommendation, 
  StylistChatMessage, 
  TPOScenario, 
  UserProfile, 
  WeatherInfo,
  GEMINI_MODEL_OPTIONS
} from '../types';
import { ProgressiveImage } from '../helpers';

interface OutfitRecommendationViewProps {
  recommendationResult: OutfitGenerationResult | null;
  wardrobe: ClothingItem[];
  weather: WeatherInfo;
  tpo: TPOScenario;
  profile: UserProfile;
  onSaveOutfit: (recommendation: OutfitRecommendation) => void;
  onLogWearOutfit: (recommendation: OutfitRecommendation) => void;
  onSwapItem: (optionId: 'A' | 'B', category: ClothingCategory, newItem: ClothingItem) => void;
  onGenerateOutfit?: () => void;
  onNavigateToSetup?: () => void;
}

const categoryKorean: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  shoes: '신발',
  bag: '소품/가방',
  accessory: '소품/가방',
};

export const OutfitRecommendationView: React.FC<OutfitRecommendationViewProps> = ({
  recommendationResult,
  wardrobe,
  weather,
  tpo,
  profile,
  onSaveOutfit,
  onLogWearOutfit,
  onSwapItem,
  onGenerateOutfit,
  onNavigateToSetup,
}) => {
  // Active state for item swap modal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetPlan, setSwapTargetPlan] = useState<'A' | 'B'>('A');
  const [swapCategory, setSwapCategory] = useState<ClothingCategory | null>(null);

  // Stylist Interactive Chat Modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<StylistChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (recommendationResult) {
      setChatMessages([
        {
          id: 'msg_welcome',
          sender: 'gemini',
          text: `오늘 기온 ${weather.temp}°C, [${tpo.name}] 일정에 맞춰 플랜 A와 플랜 B를 추천했습니다. 코디 질문이나 아이템 변경 조언이 필요하시면 언제든 물어보세요!`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [recommendationResult, tpo.name, weather.temp]);

  if (!recommendationResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#202B38] rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#7FA8DC]/15 flex items-center justify-center mb-4 text-[#7FA8DC]">
          <Shirt size={32} />
        </div>
        <h3 className="text-2xl font-bold text-[#20304A] dark:text-[#E4EBF5] mb-2">
          아직 생성된 코디가 없습니다
        </h3>
        <p className="text-base text-gray-600 max-w-md mb-6 leading-relaxed">
          오늘의 날씨와 외출 목적(TPO)을 설정하고 최적 코디를 생성해 보세요.
        </p>
        <button
          onClick={onNavigateToSetup || onGenerateOutfit}
          className="btn-primary min-h-[48px] px-6 text-base"
        >
          <Sparkles size={18} />
          <span>오늘의 코디 생성하기</span>
        </button>
      </div>
    );
  }

  const { optionA, optionB } = recommendationResult;

  const handleOpenSwapModal = (plan: 'A' | 'B', category: ClothingCategory) => {
    setSwapTargetPlan(plan);
    setSwapCategory(category);
    setSwapModalOpen(true);
  };

  const handleSelectItemSwap = (item: ClothingItem) => {
    if (!swapCategory) return;
    onSwapItem(swapTargetPlan, swapCategory, item);
    setSwapModalOpen(false);
  };

  const availableSwapItems = swapCategory
    ? wardrobe.filter(w => w.category === swapCategory && !w.inLaundry)
    : [];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || userInput;
    if (!textToSend.trim() || isConsulting) return;

    const userMsg: StylistChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setUserInput('');
    setIsConsulting(true);

    try {
      const current = swapTargetPlan === 'A' ? optionA : optionB;
      const res = await fetch('/api/gemini/stylist-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend.trim(),
          currentOutfit: current,
          weather,
          tpo,
          profile,
          selectedModel: profile.geminiModel || 'gemini-3.7-flash',
          customGeminiKey: profile.geminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const replyText = typeof data.reply === 'string' ? data.reply : (data.reply.text || data.reply.reply || '스타일링 자문이 완료되었습니다.');
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'gemini',
            text: replyText,
            suggestedAction: data.suggestedAction || data.reply?.suggestedAction,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        throw new Error('AI 응답 실패');
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'gemini',
          text: `현재 기온(${weather.temp}°C)과 [${tpo.name}] 일정에 어울리는 조화로운 매칭입니다.`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOutfitCard = (planId: 'A' | 'B', outfit: OutfitRecommendation) => {
    const isPlanA = planId === 'A';
    const itemsList: { cat: ClothingCategory; item: ClothingItem | undefined }[] = [
      { cat: 'outer', item: outfit.items.outer },
      { cat: 'top', item: outfit.items.top },
      { cat: 'bottom', item: outfit.items.bottom },
      { cat: 'shoes', item: outfit.items.shoes },
      { cat: 'bag', item: outfit.items.bag || outfit.items.accessory },
    ];

    const colorText = typeof outfit.colorHarmony === 'object' && outfit.colorHarmony
      ? outfit.colorHarmony.explanation
      : outfit.colorHarmony || '차분한 뉴트럴 톤과 포인트 컬러가 자연스러운 시각적 균형을 이룹니다.';

    const layeringText = outfit.layeringStrategy?.advice || outfit.layeringTip || '실내외 기온차에 맞춰 유연하게 탈착 가능한 레이어링 구성입니다.';

    return (
      <div 
        key={planId}
        className={`bg-white dark:bg-[#202B38] rounded-md border ${
          isPlanA 
            ? 'border-[#7FA8DC] ring-1 ring-[#7FA8DC]/20 shadow-xs' 
            : 'border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs'
        } flex flex-col justify-between overflow-hidden transition-all hover:border-[#7FA8DC]`}
      >
        {/* Plan Header */}
        <div className={`p-2.5 sm:p-3 border-b ${
          isPlanA ? 'bg-[#F4F7FC] dark:bg-[#26313F] border-[#D5E2F3] dark:border-[#2E3D50]' : 'bg-white dark:bg-[#202B38] border-[#D5E2F3] dark:border-[#2E3D50]'
        } flex items-center justify-between`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-xs font-bold text-xs ${
                isPlanA ? 'bg-[#7FA8DC] text-white' : 'bg-[#20304A] dark:bg-[#7FA8DC] text-white'
              }`}>
                PLAN {planId}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#7FA8DC]">
                {isPlanA ? '메인 추천 스타일' : '대안 스타일'}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#20304A] dark:text-white mt-1 leading-snug">
              {outfit.title}
            </h4>
            <p className="text-xs text-[#3A4A63] dark:text-gray-200 mt-1 line-clamp-2 leading-relaxed">
              {outfit.subtitle || outfit.stylistAdvice}
            </p>
          </div>

          {/* Overall Match Score */}
          <div className="text-right shrink-0 pl-3">
            <span className="text-xs text-[#6C7F9B] dark:text-[#E4EBF5]/60 font-semibold block">종합 매칭</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-bold text-2xl sm:text-3xl text-[#20304A] dark:text-[#E4EBF5]">
                {outfit.scores?.totalScore ?? 92}
              </span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>
        </div>

        {/* 5 Outfit Items Grid */}
        <div className="p-2 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {itemsList.map(({ cat, item }) => (
              <div 
                key={cat}
                className="bg-[#F4F7FC] dark:bg-[#26313F] rounded-sm p-1.5 sm:p-2 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col justify-between hover:border-[#7FA8DC] transition-all group"
              >
                {/* Category Label & Swap Button */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#20304A] dark:text-[#E4EBF5]">
                    {categoryKorean[cat]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenSwapModal(planId, cat)}
                    title={`${categoryKorean[cat]} 다른 옷으로 교체`}
                    className="px-1.5 py-0.5 text-[10px] text-[#7FA8DC] bg-white dark:bg-[#202B38] border border-[#7FA8DC]/40 hover:bg-[#7FA8DC] hover:text-white rounded-xs transition-colors flex items-center gap-0.5 font-bold cursor-pointer shadow-3xs shrink-0 whitespace-nowrap"
                  >
                    <ArrowLeftRight size={9} />
                    <span>교체</span>
                  </button>
                </div>

                {/* Clothing Photo / Canvas */}
                <div className="aspect-square rounded-xs overflow-hidden bg-gray-100 mb-1 relative">
                  {item ? (
                    <ProgressiveImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackColorHex={item.primaryColorHex}
                      categoryName={item.subcategory || categoryKorean[cat]}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                      <Shirt size={20} className="mb-1 opacity-50" />
                      <span className="text-xs">미착용</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div>
                  <h5 className="font-bold text-xs text-[#20304A] dark:text-[#E4EBF5] truncate tracking-tight" title={item?.name || '아이템 없음'}>
                    {item?.name || '(아이템 없음)'}
                  </h5>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 gap-x-1">
                    <span className="truncate max-w-[70px]">{item?.primaryColor || '기본'}</span>
                    {item && (
                      <span className="text-[#7FA8DC] font-bold text-[11px] whitespace-nowrap shrink-0">
                        {item.minTemp}°~{item.maxTemp}°C
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plan-Specific Styling & Match Breakdown */}
          <div className="flex justify-end gap-2 pt-1.5 border-t border-[#D5E2F3] dark:border-[#2E3D50] text-xs">
            <div className="relative group/tooltip">
              <span className="cursor-pointer font-bold text-[#7FA8DC] flex items-center gap-1.5 bg-white dark:bg-[#202B38] px-2 py-0.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] text-xs">
                <Palette size={12} />
                <span>컬러 매칭 💡</span>
              </span>
              <div className="absolute bottom-full mb-1.5 right-0 hidden group-hover/tooltip:block bg-[#141B24] text-[#E4EBF5] p-2.5 rounded-sm text-xs w-64 z-20 shadow-md border border-[#2E3D50]">
                {colorText}
              </div>
            </div>
            <div className="relative group/tooltip">
              <span className="cursor-pointer font-bold text-[#20304A] dark:text-[#E4EBF5] flex items-center gap-1.5 bg-white dark:bg-[#202B38] px-2 py-0.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] text-xs">
                <Flame size={12} className="text-[#7FA8DC]" />
                <span>체온 케어 💡</span>
              </span>
              <div className="absolute bottom-full mb-1.5 right-0 hidden group-hover/tooltip:block bg-[#141B24] text-[#E4EBF5] p-2.5 rounded-sm text-xs w-64 z-20 shadow-md border border-[#2E3D50]">
                {layeringText}
              </div>
            </div>
          </div>

          {/* Quick Score Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] py-1 px-2 rounded-xs border border-[#D5E2F3] dark:border-[#2E3D50]">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] block font-normal">날씨 적합도</span>
              <span className="font-bold text-xs sm:text-sm text-[#7FA8DC]">{outfit.scores?.weatherScore ?? 90}점</span>
            </div>
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] py-1 px-2 rounded-xs border border-[#D5E2F3] dark:border-[#2E3D50]">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] block font-normal">TPO 격식도</span>
              <span className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-[#E4EBF5]">{outfit.scores?.tpoScore ?? 95}점</span>
            </div>
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] py-1 px-2 rounded-xs border border-[#D5E2F3] dark:border-[#2E3D50]">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] block font-normal">체형 밸런스</span>
              <span className="font-bold text-xs sm:text-sm text-[#5B8CB9]">{outfit.scores?.personalScore ?? 92}점</span>
            </div>
          </div>
        </div>

        {/* Plan Action Buttons */}
        <div className="p-2 sm:p-2.5 bg-[#F4F7FC] dark:bg-[#26313F] border-t border-[#D5E2F3] dark:border-[#2E3D50] flex items-center gap-2 shrink-0">
          <button
            type="button"
            id={`btn-wear-plan-${planId.toLowerCase()}`}
            onClick={() => {
              onLogWearOutfit(outfit);
              setSavedStatus(`플랜 ${planId} 오늘 착용 완료!`);
              setTimeout(() => setSavedStatus(null), 2500);
            }}
            className="btn-primary flex-1 min-h-[35px] gap-1.5 text-xs whitespace-nowrap"
          >
            <CheckCircle size={14} />
            <span>오늘 이 코디 착용</span>
          </button>

          <button
            type="button"
            id={`btn-save-plan-${planId.toLowerCase()}`}
            onClick={() => {
              onSaveOutfit(outfit);
              setSavedStatus(`플랜 ${planId} 저장 완료!`);
              setTimeout(() => setSavedStatus(null), 2500);
            }}
            className="btn-secondary min-h-[35px] gap-1.5 text-xs whitespace-nowrap"
          >
            <Bookmark size={13} />
            <span>보관</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col justify-between space-y-2.5 overflow-y-auto pr-1 pb-1">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white dark:bg-[#202B38] rounded-md p-3 sm:p-3.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-tag bg-[#7FA8DC]/15 text-[#20304A] dark:text-white font-bold">
              ✦ AI 코디 분석
            </span>
            {(() => {
              const currentModelOpt = GEMINI_MODEL_OPTIONS.find(m => m.id === (profile.geminiModel || 'gemini-3.7-flash')) || GEMINI_MODEL_OPTIONS[1];
              return (
                <span className="badge-tag bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] text-[#20304A] dark:text-white gap-1">
                  <Cpu size={12} className="text-[#7FA8DC]" />
                  <span>{currentModelOpt.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 font-semibold">({currentModelOpt.badge.split(' ')[1] || '스마트'})</span>
                </span>
              );
            })()}
            <h3 className="text-base sm:text-lg font-bold text-[#20304A] dark:text-white">
              최적 코디 추천: 플랜 A & 플랜 B 비교
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200 mt-1">
            {weather.city} 현재 {weather.temp}°C ({weather.description}) · [{tpo.name}] TPO (격식도 {tpo.formalityLevel}/10) 맞춤 코디
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedStatus && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-sm border border-emerald-300 animate-fade-in flex items-center gap-1">
              <Check size={13} /> {savedStatus}
            </span>
          )}

          <button
            type="button"
            onClick={() => setChatModalOpen(true)}
            className="min-h-[38px] px-3.5 py-1.5 bg-[#7FA8DC]/10 hover:bg-[#7FA8DC]/20 text-[#20304A] dark:text-gray-200 text-xs font-bold rounded-sm border border-[#7FA8DC]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare size={14} className="text-[#7FA8DC]" />
            <span>AI 스타일리스트 대화</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="min-h-[38px] px-3.5 py-1.5 bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-gray-200 dark:hover:bg-gray-700 text-[#20304A] dark:text-gray-200 text-xs font-semibold rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span>{copied ? '복사 완료' : '공유'}</span>
          </button>

          {onGenerateOutfit && (
            <button
              type="button"
              onClick={onGenerateOutfit}
              className="btn-primary min-h-[38px] px-4 py-1.5 gap-1.5 text-xs font-bold shadow-2xs"
            >
              <RefreshCw size={13} />
              <span>새로 추천받기</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Column Comparison (Plan A & Plan B) - flex-1 로 상하 크기 유연하게 채움 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 md:gap-3 flex-1 min-h-[360px] items-stretch">
        {renderOutfitCard('A', optionA)}
        {renderOutfitCard('B', optionB)}
      </div>

      {/* Bottom Full Review & TPO Harmony Banner */}
      <div className="bg-white dark:bg-[#202B38] rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] p-2.5 sm:p-3 px-3.5 shadow-xs shrink-0 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#D5E2F3] dark:border-[#2E3D50]">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#20304A] dark:text-white">
            <Sparkles size={14} className="text-[#7FA8DC]" />
            <span>🎨 컬러 조화 & 스타일링 총평 (TPO 종합 분석)</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            {profile?.bodyType ? `${profile.bodyType} 체형` : '사용자 맞춤'} · {(profile?.preferredStyles || profile?.stylePreferences || ['캐주얼', '미니멀']).join(', ')} 스타일
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
          <div className="bg-[#F4F7FC] dark:bg-[#26313F] p-2.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
            <strong className="text-[#7FA8DC] block mb-1 font-bold">🎨 컬러 조화</strong>
            <p className="line-clamp-3 text-[#3A4A63] dark:text-[#E4EBF5]">{typeof optionA.colorHarmony === 'object' && optionA.colorHarmony ? optionA.colorHarmony.explanation : optionA.colorHarmony}</p>
          </div>
          <div className="bg-[#F4F7FC] dark:bg-[#26313F] p-2.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
            <strong className="text-[#20304A] dark:text-[#E4EBF5] block mb-1 font-bold">🌡️ 체온 케어 & 레이어링</strong>
            <p className="line-clamp-3 text-[#3A4A63] dark:text-[#E4EBF5]">{optionA.layeringStrategy?.advice || optionA.layeringTip || '실내외 기온차에 대비한 최적의 레이어드 조합입니다.'}</p>
          </div>
          <div className="bg-[#F4F7FC] dark:bg-[#26313F] p-2.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
            <strong className="text-emerald-700 dark:text-emerald-400 block mb-1 font-bold">👔 TPO 맞춤 해설</strong>
            <p className="line-clamp-3 text-[#3A4A63] dark:text-[#E4EBF5]">{optionA.tpoFitExplanation || optionA.stylistAdvice || '선택하신 TPO 장소와 격식도에 적합하도록 코디되었습니다.'}</p>
          </div>
        </div>
      </div>

      {/* STYLIST INTERACTIVE CHAT MODAL */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#202B38] rounded-sm max-w-lg md:max-w-xl w-full p-4 sm:p-5 shadow-xl border border-[#D5E2F3] dark:border-[#2E3D50] space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
              <h4 className="text-base sm:text-lg text-[#20304A] dark:text-white font-bold flex items-center gap-2">
                <MessageSquare size={16} className="text-[#7FA8DC]" />
                <span>Gemini AI 스타일리스트 실시간 Q&A</span>
              </h4>
              <button
                onClick={() => setChatModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 cursor-pointer rounded-xs"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Touch Prompts for Tablet */}
            <div className="flex flex-wrap gap-1.5 pb-1 shrink-0">
              {[
                '이 코디에서 신발 추천 팁은?',
                '비 올 때 레이어드 방법은?',
                '더 포멀하게 연출하려면?',
                '체형 보완 스타일링 팁은?'
              ].map((quickQ) => (
                <button
                  key={quickQ}
                  type="button"
                  onClick={() => {
                    setUserInput(quickQ);
                  }}
                  className="min-h-[30px] px-2.5 py-1 text-[11px] bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-[#7FA8DC]/10 hover:text-[#7FA8DC] border border-[#D5E2F3] dark:border-[#2E3D50] rounded-full text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  💬 {quickQ}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 min-h-[200px] max-h-[340px] border border-[#D5E2F3] dark:border-[#2E3D50] p-3 rounded-sm bg-[#F4F7FC] dark:bg-[#26313F]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-sm text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#7FA8DC] text-white ml-auto max-w-[85%]'
                      : 'bg-white dark:bg-[#202B38] text-gray-800 dark:text-gray-200 border border-[#D5E2F3] dark:border-[#2E3D50] max-w-[95%] shadow-2xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] opacity-60 mt-1 block text-right">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              {isConsulting && (
                <div className="flex items-center gap-1.5 text-xs text-[#7FA8DC] p-1">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Gemini AI가 스타일 조언을 작성하고 있습니다...</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 pt-1 shrink-0"
            >
              <input
                type="text"
                placeholder="예: '신발을 스니커즈로 바꿔도 색감이 어울릴까요?'"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isConsulting}
                className="input-base flex-1 min-h-[42px]"
              />
              <button
                type="submit"
                disabled={isConsulting || !userInput.trim()}
                className="btn-primary min-h-[42px] gap-1.5"
              >
                <Send size={14} />
                <span>질문</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ITEM SWAP MODAL */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#202B38] rounded-sm max-w-lg md:max-w-2xl w-full p-4 sm:p-5 shadow-xl border border-[#D5E2F3] dark:border-[#2E3D50] space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
              <h4 className="text-base sm:text-lg text-[#20304A] dark:text-white font-bold flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-[#7FA8DC]" />
                <span>플랜 {swapTargetPlan} 의류 교체 ({swapCategory ? categoryKorean[swapCategory] : ''})</span>
              </h4>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 cursor-pointer rounded-xs"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              스마트 옷장에 등록된 다른 옷을 선택하면 코디에 즉시 적용됩니다.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto pr-1 flex-1">
              {availableSwapItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItemSwap(item)}
                  className="p-2.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC] hover:bg-[#F4F7FC] dark:hover:bg-[#26313F] text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs min-h-[140px]"
                >
                  <div className="aspect-4/3 rounded-xs overflow-hidden bg-gray-100 dark:bg-gray-800 w-full mb-1.5">
                    <ProgressiveImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackColorHex={item.primaryColorHex}
                      categoryName={item.subcategory}
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-[#20304A] dark:text-white truncate">{item.name}</h5>
                    <p className="text-xs text-gray-500">{item.primaryColor} · {item.material}</p>
                    <span className="text-xs text-[#7FA8DC] font-bold mt-1 block">
                      적정 기온: {item.minTemp}°C ~ {item.maxTemp}°C
                    </span>
                  </div>
                </button>
              ))}

              {availableSwapItems.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                  이 카테고리에 등록된 옷이 없습니다. [디지털 옷장]에서 옷을 등록해 주세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
