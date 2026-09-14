import React, { useState } from 'react';
import { 
  User, 
  Check, 
  Sparkles, 
  Upload, 
  Palette,
  Thermometer,
  Ban
} from 'lucide-react';
import { 
  BodyType, 
  PersonalColorType, 
  UserProfile, 
  BODY_TYPE_LABELS,
  PERSONAL_COLOR_AVOID_RECOMMENDATIONS,
  AvoidColorOption
} from '../types';
import { compressImageBase64 } from '../helpers';


interface ProfileViewProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const STYLE_OPTIONS = [
  '캐주얼',
  '미니멀',
  '오피스/비즈니스',
  '스트릿',
  '아웃도어/고프코어',
  '댄디/클래식'
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  setProfile,
}) => {
  const [savedToast, setSavedToast] = useState(false);
  
  // Face Photo Personal Color Analysis state
  const [isAnalyzingFaceColor, setIsAnalyzingFaceColor] = useState(false);
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<any | null>(null);
  const [faceAnalysisError, setFaceAnalysisError] = useState<string | null>(null);
  const [uploadedFacePhotoUrl, setUploadedFacePhotoUrl] = useState<string | null>(null);

  const handleFacePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const base64Str = await compressImageBase64(rawBase64, 640, 640, 0.80);
      setUploadedFacePhotoUrl(base64Str);
      setIsAnalyzingFaceColor(true);
      setFaceAnalysisError(null);
      setFaceAnalysisResult(null);

      try {
        const activeModel = profile.geminiModel || 'gemini-3.7-flash';
        const res = await fetch('/api/gemini/analyze-face-personal-color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Str,
            customGeminiKey: profile.geminiApiKey,
            selectedModel: activeModel,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFaceAnalysisResult(data.data);
        } else {
          setFaceAnalysisError(data.error || '퍼스널 컬러 분석에 실패했습니다.');
        }
      } catch (err: any) {
        setFaceAnalysisError(err.message || '서버 통신 중 오류가 발생했습니다.');
      } finally {
        setIsAnalyzingFaceColor(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyFaceAnalysis = () => {
    if (!faceAnalysisResult) return;
    const diagnosedColor = faceAnalysisResult.personalColor as PersonalColorType;
    const diagnosedAvoids = PERSONAL_COLOR_AVOID_RECOMMENDATIONS[diagnosedColor]?.map(o => o.name) || [];

    setProfile(prev => {
      return {
        ...prev,
        personalColor: diagnosedColor || prev.personalColor,
        avoidColors: diagnosedAvoids,
      };
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleProfileChange = (key: keyof UserProfile, val: any) => {
    setProfile(prev => {
      const updated = { ...prev, [key]: val };
      
      // Auto-sync coldSensitivity if temperatureOffset changed
      if (key === 'temperatureOffset') {
        const offset = Number(val);
        if (offset <= -2) updated.coldSensitivity = 'sensitive';
        else if (offset >= 2) updated.coldSensitivity = 'resistant';
        else updated.coldSensitivity = 'normal';
      }

      // Auto-sync avoidColors if personalColor changed
      if (key === 'personalColor') {
        const selectedColor = val as PersonalColorType;
        const recommends = PERSONAL_COLOR_AVOID_RECOMMENDATIONS[selectedColor] || [];
        updated.avoidColors = recommends.map(opt => opt.name);
      }

      // Auto-sync stylePreferences and preferredStyles
      if (key === 'preferredStyles') {
        updated.stylePreferences = val;
      } else if (key === 'stylePreferences') {
        updated.preferredStyles = val;
      }

      return updated;
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleStyleTagToggle = (styleName: string) => {
    const current = profile.preferredStyles || [];
    const exists = current.includes(styleName);
    const updated = exists 
      ? current.filter(s => s !== styleName)
      : [...current, styleName];
    handleProfileChange('preferredStyles', updated);
  };

  // Temperature Offset guidance calculation
  const tempOffset = profile.temperatureOffset ?? 0;
  const getTempOffsetGuidance = (offset: number) => {
    if (offset <= -3) {
      return {
        label: '❄️ 추위를 매우 많이 탐 (-3°C ~ -4°C)',
        description: '실제 기온보다 체감을 3~4°C 낮게 판단하여, 두껍고 보온성이 뛰어난 아우터와 따뜻한 이너 레이어드를 최우선 추천합니다.',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
      };
    }
    if (offset <= -1) {
      return {
        label: '🌬️ 추위를 조금 탐 (-1°C ~ -2°C)',
        description: '약간 쌀쌀함을 느끼므로, 간절기 아우터(가디건/자켓)와 가벼운 레이어드 스타일을 우선 제안합니다.',
        color: 'text-sky-700 bg-sky-50 border-sky-200',
      };
    }
    if (offset === 0) {
      return {
        label: '⚖️ 표준 체감 온도 (0°C 기준)',
        description: '기상청 실측 기온에 맞춰 가장 대중적이고 표준적인 두께감의 의류를 균형 있게 매치합니다.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }
    if (offset <= 2) {
      return {
        label: '☀️ 더위를 조금 탐 (+1°C ~ +2°C)',
        description: '몸에 열이 많은 편으로, 통기성이 좋고 답답하지 않은 단품 또는 얇은 겉옷 위주로 스타일링합니다.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      };
    }
    return {
      label: '🔥 더위를 매우 많이 탐 (+3°C ~ +4°C)',
      description: '실제 기온보다 체감을 3~4°C 높게 판단하여, 땀 배출이 용이한 가볍고 시원한 린넨/코튼 단품 위주로 제안합니다.',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  };

  const tempGuidance = getTempOffsetGuidance(tempOffset);
  const currentAvoidRecommendations: AvoidColorOption[] = PERSONAL_COLOR_AVOID_RECOMMENDATIONS[profile.personalColor] || [];

  return (
    <div className="h-full flex flex-col min-h-0 gap-2.5 pb-1">
      {/* Header */}
      <div className="bg-white dark:bg-[#202B38] rounded-md p-3 px-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#7FA8DC] flex items-center justify-center text-white shadow-2xs">
            <User size={18} />
          </div>
          <div>
            <p className="text-[9px] tracking-[0.2em] font-semibold text-[#868E96]">개인 사용자 프로필 및 신체 · 컬러 스펙</p>
            <h3 className="text-base text-[#20304A] dark:text-white font-bold">체형 스펙 · 퍼스널 컬러 진단 · 워스트 컬러 · 체감 온도 보정</h3>
          </div>
        </div>

        {savedToast && (
          <span className="text-xs text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-sm border border-emerald-200 animate-fade-in shadow-2xs">
            <Check size={13} /> 프로필이 저장되었습니다.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-3 overflow-y-auto flex-1 min-h-0 pr-1 items-stretch">
        
        {/* LEFT: Body Specs, Preferred Styles, Temperature Sensitivity */}
        <div className="md:col-span-6 lg:col-span-6 space-y-3 flex flex-col justify-between">
          
          {/* BODY & MEASUREMENTS CARD */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-4 sm:p-4.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
              <h4 className="text-sm sm:text-base text-[#20304A] dark:text-white font-bold flex items-center gap-1.5">
                <User size={16} className="text-[#7FA8DC]" />
                신체 프로필 & 체형 실루엣
              </h4>
              <span className="text-[9px] text-gray-500 font-semibold">체형 맞춤 핏</span>
            </div>

            {/* Gender Selection (Toggle Switch) */}
            <div>
              <div className="flex items-center justify-between bg-[#F4F7FC] dark:bg-[#26313F] p-2.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] min-h-[44px]">
                <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white">성별 설정 (남성 / 여성)</span>
                <div className="flex items-center gap-2.5 select-none">
                  <span className={`text-xs sm:text-sm font-extrabold transition-colors ${profile.gender === 'male' ? 'text-[#7FA8DC]' : 'text-gray-400'}`}>남성</span>
                  <button
                    type="button"
                    id="btn-gender-toggle"
                    onClick={() => handleProfileChange('gender', profile.gender === 'male' ? 'female' : 'male')}
                    className={`w-14 h-7 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      profile.gender === 'female' ? 'bg-[#7FA8DC]' : 'bg-[#20304A]'
                    }`}
                    aria-label="성별 전환"
                  >
                    <div
                      className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${
                        profile.gender === 'female' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs sm:text-sm font-extrabold transition-colors ${profile.gender === 'female' ? 'text-[#7FA8DC]' : 'text-gray-400'}`}>여성</span>
                </div>
              </div>
            </div>

            {/* Height & Weight (Direct Numeric Input) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#FBF9F5] p-2 rounded-sm border border-[#3D405B]/10">
                <label htmlFor="input-height" className="block text-xs font-semibold text-[#3D405B] mb-1">
                  키(신장) 직접 입력
                </label>
                <div className="relative">
                  <input
                    id="input-height"
                    type="number"
                    min="140"
                    max="205"
                    value={profile.height}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleProfileChange('height', val);
                    }}
                    className="input-base pr-10 font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">cm</span>
                </div>
              </div>

              <div className="bg-[#FBF9F5] p-2 rounded-sm border border-[#3D405B]/10">
                <label htmlFor="input-weight" className="block text-xs font-semibold text-[#3D405B] mb-1">
                  몸무게(체중) 직접 입력
                </label>
                <div className="relative">
                  <input
                    id="input-weight"
                    type="number"
                    min="40"
                    max="130"
                    value={profile.weight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleProfileChange('weight', val);
                    }}
                    className="input-base pr-10 font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">kg</span>
                </div>
              </div>
            </div>

            {/* Body Type Selection (3개 - 2개(가운데 여백) - 3개 3열 그리드 구조) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#20304A] dark:text-white mb-2">체형 실루엣 선택</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(() => {
                  const bodyKeys: BodyType[] = ['hourglass', 'inverted_triangle', 'rectangle', 'pear', 'apple', 'athletic', 'slim', 'plus'];
                  const renderBtn = (bt: BodyType) => {
                    const isSelected = profile.bodyType === bt;
                    return (
                      <button
                        key={bt}
                        id={`btn-bodytype-${bt}`}
                        type="button"
                        onClick={() => handleProfileChange('bodyType', bt)}
                        className={`min-h-[66px] p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] shadow-sm font-semibold scale-102'
                            : 'bg-[#F4F7FC] dark:bg-[#26313F] text-gray-700 dark:text-gray-200 border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC] hover:bg-white dark:hover:bg-[#2E3D50]'
                        }`}
                      >
                        <p className="font-bold text-xs sm:text-sm">{BODY_TYPE_LABELS[bt].label}</p>
                        <p className={`text-[11px] mt-1 leading-snug ${isSelected ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                          {BODY_TYPE_LABELS[bt].desc}
                        </p>
                      </button>
                    );
                  };

                  return (
                    <>
                      {/* 1행: 3개 */}
                      {renderBtn(bodyKeys[0])}
                      {renderBtn(bodyKeys[1])}
                      {renderBtn(bodyKeys[2])}

                      {/* 2행: 1개 + [가운데 여백] + 1개 */}
                      {renderBtn(bodyKeys[3])}
                      <div className="hidden sm:block" aria-hidden="true" />
                      {renderBtn(bodyKeys[4])}

                      {/* 3행: 3개 */}
                      {renderBtn(bodyKeys[5])}
                      {renderBtn(bodyKeys[6])}
                      {renderBtn(bodyKeys[7])}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* PREFERRED STYLES TAG PICKER */}
          <div className="bg-white dark:bg-[#202B38] rounded-sm p-3 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-2">
            <div className="pb-1.5 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
              <h4 className="text-xs sm:text-sm text-[#20304A] dark:text-white font-bold">
                선호하는 스타일 무드 (다중 선택)
              </h4>
              <span className="text-[9px] text-gray-500 font-semibold">스타일 취향</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((style) => {
                const isChecked = (profile.preferredStyles || []).includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleStyleTagToggle(style)}
                    className={`min-h-[32px] text-xs px-2.5 py-1 rounded-sm border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#7FA8DC] text-white border-[#7FA8DC] font-semibold shadow-2xs'
                        : 'bg-[#F4F7FC] dark:bg-[#26313F] text-gray-600 dark:text-gray-300 border-[#D5E2F3] dark:border-[#2E3D50] hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isChecked ? `✓ ${style}` : `+ ${style}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEMPERATURE SENSITIVITY SLIDER CARD (Optimized space for 16:9) */}
          <div className="bg-white dark:bg-[#202B38] rounded-sm p-2.5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-2">
            <div className="pb-1 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
              <h4 className="text-xs text-[#20304A] dark:text-white font-bold flex items-center gap-1.5">
                <Thermometer size={14} className="text-[#7FA8DC]" />
                체감 온도 민감도 (추위/더위 보정)
              </h4>
              <span className="text-[9px] text-gray-500 font-semibold">온도 오프셋</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#20304A] dark:text-white">체감 기온 보정치:</span>
                <span className="badge-tag bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] text-[#7FA8DC] font-bold">
                  {tempOffset > 0 ? `+${tempOffset}°C` : `${tempOffset}°C`}
                </span>
              </div>

              {/* Slider -4 to +4 */}
              <input
                id="input-temp-offset"
                type="range"
                min="-4"
                max="4"
                step="1"
                value={tempOffset}
                onChange={(e) => handleProfileChange('temperatureOffset', parseInt(e.target.value))}
                className="w-full accent-[#3E332E] cursor-pointer h-2 my-1"
              />

              {/* Scale Ticks */}
              <div className="flex justify-between text-[10px] text-gray-500 px-0.5">
                <span className="text-blue-600 font-semibold">-4°C (추위)</span>
                <span className="text-gray-500 font-semibold">0°C (표준)</span>
                <span className="text-rose-600 font-semibold">+4°C (더위)</span>
              </div>
            </div>

            {/* Dynamic Status Feedback Box */}
            <div className={`p-1.5 rounded-sm border text-[11px] leading-snug space-y-0.5 ${tempGuidance.color}`}>
              <div className="font-bold flex items-center gap-1.5">
                <span>{tempGuidance.label}</span>
              </div>
              <p className="text-[11px] leading-normal text-[#3D405B] font-medium drop-shadow-2xs">
                {tempGuidance.description}
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT: Personal Color & Avoid Colors Settings */}
        <div className="md:col-span-6 lg:col-span-6 space-y-3 flex flex-col justify-between">
          
          {/* PERSONAL COLOR & AVOID COLORS CARD */}
          <div className="bg-white dark:bg-[#202B38] rounded-md p-4 sm:p-5 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-sm space-y-4 relative overflow-hidden flex-1 flex flex-col justify-between">
            {/* Eye-catching badge accent */}
            <div className="absolute top-0 right-0 bg-[#7FA8DC] text-white text-xs font-bold px-3 py-1 rounded-bl-md shadow-xs flex items-center gap-1">
              <Sparkles size={12} className="text-amber-200 animate-spin" />
              <span>AI VISION 추천</span>
            </div>

            <div className="pb-2 border-b border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between">
              <h4 className="text-sm sm:text-base text-[#20304A] dark:text-white font-bold flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#7FA8DC]/15 text-[#7FA8DC] flex items-center justify-center shrink-0">
                  <Palette size={16} />
                </div>
                <span>퍼스널 컬러 & 워스트 컬러 (Avoid Colors) 정밀 설정</span>
              </h4>
              <span className="badge-tag bg-[#7FA8DC]/15 text-[#20304A] dark:text-gray-200 font-bold">
                추천 기능
              </span>
            </div>

            {/* AI Face Photo Personal Color Analysis Section */}
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] rounded-md p-3.5 sm:p-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#7FA8DC] text-white flex items-center justify-center shadow-md shrink-0">
                  <Sparkles size={18} className="text-amber-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs sm:text-sm text-[#20304A] dark:text-white font-bold flex items-center gap-1.5 truncate">
                    <span>📸 내 얼굴 사진으로 퍼스널 컬러 & 워스트 컬러 진단</span>
                  </h5>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    Gemini Vision AI가 피부 톤과 헤어·눈동자 조화를 분석하여 정밀 컬러를 진단합니다.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone & Action Box */}
              <div className="bg-white dark:bg-[#202B38] rounded-md p-3 border border-[#D5E2F3] dark:border-[#2E3D50] flex flex-col xl:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 w-full xl:w-auto min-w-0">
                  {uploadedFacePhotoUrl ? (
                    <div className="w-12 h-12 rounded-md overflow-hidden border border-[#7FA8DC] shrink-0 shadow-xs relative">
                      <img src={uploadedFacePhotoUrl} alt="업로드된 얼굴" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-[#F4F7FC] dark:bg-[#26313F] border-2 border-dashed border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-center text-gray-400 shrink-0">
                      <Upload size={20} className="text-[#7FA8DC]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#20304A] dark:text-white block truncate">
                      {uploadedFacePhotoUrl ? '얼굴 사진 업로드 완료' : '얼굴 사진 업로드'}
                    </span>
                    <span className="text-[11px] text-gray-500 block truncate">
                      정면 얼굴 셀피 (JPG, PNG 권장)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto justify-end shrink-0">
                  <label 
                    htmlFor="face-photo-input"
                    className="btn-primary w-full xl:w-auto min-h-[34px] px-3.5 py-1 text-xs gap-1.5 whitespace-nowrap justify-center shadow-xs cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{uploadedFacePhotoUrl ? '사진 다시 업로드' : '사진 업로드 & AI 진단'}</span>
                  </label>
                  <input
                    id="face-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFacePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {isAnalyzingFaceColor && (
                <div className="bg-white/80 dark:bg-[#202B38]/80 p-3 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] text-center space-y-1.5 animate-pulse">
                  <p className="text-xs font-bold text-[#7FA8DC] flex items-center justify-center gap-2">
                    <Sparkles size={16} className="animate-spin text-amber-500" />
                    <span>Gemini Vision AI가 사용자의 피부 톤과 컬러를 정밀 분석 중입니다...</span>
                  </p>
                  <p className="text-[10px] text-gray-500">잠시만 기다려주세요 (약 2~3초 소요)</p>
                </div>
              )}

              {/* Error Message */}
              {faceAnalysisError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                  ⚠️ {faceAnalysisError}
                </p>
              )}

              {/* Analysis Result Card */}
              {faceAnalysisResult && (
                <div className="bg-white dark:bg-[#202B38] rounded-md p-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs space-y-3 mt-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{faceAnalysisResult.badgeEmoji || '🌸'}</span>
                      <div>
                        <h6 className="text-sm font-bold text-[#20304A] dark:text-white flex items-center gap-1.5">
                          <span>진단 결과:</span>
                          <span className="text-[#7FA8DC]">{faceAnalysisResult.personalColorName}</span>
                        </h6>
                        <p className="text-[11px] text-gray-500">
                          신뢰도: <strong className="text-[#7FA8DC]">{faceAnalysisResult.confidenceScore || 90}%</strong> · {faceAnalysisResult.skinUndertone}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyFaceAnalysis}
                      className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 gap-1.5"
                    >
                      <Check size={16} />
                      <span>내 프로필에 즉시 적용</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-body bg-[#F4F7FC] dark:bg-[#26313F] p-3 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50]">
                    {faceAnalysisResult.analysisSummary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-50/90 dark:bg-emerald-950/30 p-3 rounded-md border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block flex items-center gap-1">
                        <span>✨ 베스트 추천 컬러 (톤 매칭)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(faceAnalysisResult.recommendedColors || []).map((c: string) => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-white dark:bg-[#202B38] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xs font-bold shadow-2xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-red-50/90 dark:bg-red-950/30 p-3 rounded-md border border-red-300 dark:border-red-800 space-y-1.5">
                      <span className="text-xs font-bold text-red-900 dark:text-red-300 block flex items-center gap-1">
                        <span>🚫 워스트 컬러 (Avoid Colors 자동 반영)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(faceAnalysisResult.avoidColors || []).map((c: string) => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-white dark:bg-[#202B38] text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xs font-bold shadow-2xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Color Selection (12 Tones) - 버튼 크기 및 여백 확장 */}
            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-bold text-[#20304A] dark:text-white">퍼스널 컬러 PCCS 12톤 상세 진단</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'spring_light' as PersonalColorType, label: '봄 웜 라이트', color: '#FCD5B5' },
                  { id: 'spring_bright' as PersonalColorType, label: '봄 웜 브라이트', color: '#FAC090' },
                  { id: 'summer_light' as PersonalColorType, label: '여름 쿨 라이트', color: '#B2E2E2' },
                  { id: 'summer_muted' as PersonalColorType, label: '여름 쿨 뮤티드', color: '#88C0D0' },
                  { id: 'summer_bright' as PersonalColorType, label: '여름 쿨 브라이트', color: '#5E81AC' },
                  { id: 'fall_muted' as PersonalColorType, label: '가을 웜 뮤티드', color: '#D08770' },
                  { id: 'fall_strong' as PersonalColorType, label: '가을 웜 스트롱', color: '#BF616A' },
                  { id: 'fall_deep' as PersonalColorType, label: '가을 웜 딥', color: '#A3BE8C' },
                  { id: 'winter_bright' as PersonalColorType, label: '겨울 쿨 브라이트', color: '#B48EAD' },
                  { id: 'winter_deep' as PersonalColorType, label: '겨울 쿨 딥', color: '#4C566A' },
                  { id: 'neutral_light' as PersonalColorType, label: '뉴트럴 라이트', color: '#E5E9F0' },
                  { id: 'neutral_dark' as PersonalColorType, label: '뉴트럴 다크', color: '#2E3440' },
                ].map((pc) => (
                  <button
                    key={pc.id}
                    id={`btn-pcolor-${pc.id}`}
                    type="button"
                    onClick={() => handleProfileChange('personalColor', pc.id)}
                    className={`min-h-[52px] px-3 py-2 rounded-md border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      profile.personalColor === pc.id
                        ? 'bg-[#F4F7FC] dark:bg-[#26313F] border-[#7FA8DC] ring-2 ring-[#7FA8DC]/40 font-bold shadow-xs'
                        : 'bg-white dark:bg-[#202B38] border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC] hover:bg-gray-50 dark:hover:bg-[#2A3747]'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shrink-0 border border-black/15 shadow-xs" style={{ backgroundColor: pc.color }} />
                    <span className="text-xs sm:text-[13px] font-semibold text-[#20304A] dark:text-white tracking-tight whitespace-nowrap">{pc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Avoid Colors Section - Auto summary card */}
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] p-3 rounded-md border border-[#D5E2F3] dark:border-[#2E3D50] space-y-2 mt-1">
              <div className="flex items-center gap-1.5">
                <Ban size={15} className="text-red-500" />
                <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white">
                  워스트 컬러 (Avoid Colors) 자동 매핑 및 필터링 안내
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                진단하신 퍼스널 컬러에 상극인 워스트 컬러(Avoid Colors)가 AI 코디 알고리즘에 자동으로 적용되어, 코디 추천 시 완벽하게 배제됩니다.
              </p>

              <div className="pt-2 border-t border-[#D5E2F3] dark:border-[#2E3D50]">
                <label className="block text-xs font-bold text-[#20304A] dark:text-gray-200 mb-1.5">
                  🚫 배제 설정된 워스트 컬러 리스트 ({currentAvoidRecommendations.length}개):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {currentAvoidRecommendations.map((opt) => (
                    <span
                      key={opt.name}
                      title={opt.reason}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-sm text-xs font-semibold shadow-2xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 shadow-2xs" style={{ backgroundColor: opt.hex }} />
                      <span>{opt.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
