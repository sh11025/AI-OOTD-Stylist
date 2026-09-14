import React, { useState, useEffect } from 'react';
import { 
  ClothingItem, 
  OutfitRecommendation, 
  OutfitGenerationResult, 
  TPOScenario, 
  UserProfile, 
  WeatherInfo, 
  SavedOutfit,
  SAMPLE_WARDROBE_ITEMS, 
  DEFAULT_USER_PROFILE, 
  DEFAULT_WEATHER, 
  DEFAULT_SAVED_OUTFITS 
} from './types';

export const LOCAL_STORAGE_KEYS = {
  WARDROBE: 'ootd_stylist_wardrobe_v1',
  PROFILE: 'ootd_stylist_profile_v1',
  WEATHER: 'ootd_stylist_weather_v1',
  HISTORY: 'ootd_stylist_history_v1',
  SELECTED_TPO: 'ootd_stylist_selected_tpo_v1',
};

// localStorage 5MB 용량 초과 또는 비활성화 시를 대비한 인메모리 안전 폴백 저장소
const memoryFallbackStore: Record<string, any> = {};

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.warn(`[Storage] localStorage 읽기 실패 (${key}), 인메모리 폴백 확인:`, e);
  }

  // localStorage 실패 또는 빈 값인 경우 인메모리 캐시 확인
  if (memoryFallbackStore[key] !== undefined) {
    return memoryFallbackStore[key] as T;
  }

  return defaultValue;
}

const syncDebounceTimers: Record<string, any> = {};

export function setStoredData<T>(key: string, value: T): void {
  // 1. 메모리 폴백 저장소에 우선 최신 상태 보존 (UI 세션 보장)
  memoryFallbackStore[key] = value;

  // 2. 브라우저 localStorage에 안전하게 저장 (용량 초과 QuotaExceededError 방어)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    // 5MB 쿼터 초과 시 콘솔 경고 및 백엔드 파일 스토리지로 지속성 위임
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
      console.warn(`[Storage] 브라우저 localStorage 용량 한계(약 5MB) 도달. 로컬 백엔드 파일 스토리지에 안전하게 기록됩니다 (${key})`);
    } else {
      console.error(`[Storage] localStorage 저장 오류 (${key}):`, e);
    }
  }

  // 3. 로컬 백엔드 파일 시스템(/api/data/save)에 항상 독립적이고 안전하게 비동기 원자적 저장
  let apiFieldKey = '';
  if (key === LOCAL_STORAGE_KEYS.WARDROBE) apiFieldKey = 'wardrobe';
  else if (key === LOCAL_STORAGE_KEYS.PROFILE) apiFieldKey = 'profile';
  else if (key === LOCAL_STORAGE_KEYS.WEATHER) apiFieldKey = 'weather';
  else if (key === LOCAL_STORAGE_KEYS.HISTORY) apiFieldKey = 'history';

  if (apiFieldKey) {
    if (syncDebounceTimers[apiFieldKey]) {
      clearTimeout(syncDebounceTimers[apiFieldKey]);
    }
    syncDebounceTimers[apiFieldKey] = setTimeout(() => {
      fetch('/api/data/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiFieldKey, value })
      }).catch(err => console.error(`[Storage] 로컬 파일 동기화 실패 (${apiFieldKey}):`, err));
    }, 350);
  }
}

export function loadWardrobe(): ClothingItem[] {
  return getStoredData<ClothingItem[]>(LOCAL_STORAGE_KEYS.WARDROBE, SAMPLE_WARDROBE_ITEMS);
}

export function saveWardrobe(wardrobe: ClothingItem[]): void {
  setStoredData(LOCAL_STORAGE_KEYS.WARDROBE, wardrobe);
}

export function loadProfile(): UserProfile {
  return getStoredData<UserProfile>(LOCAL_STORAGE_KEYS.PROFILE, DEFAULT_USER_PROFILE);
}

export function saveProfile(profile: UserProfile): void {
  setStoredData(LOCAL_STORAGE_KEYS.PROFILE, profile);
}

export function loadWeather(): WeatherInfo {
  return getStoredData<WeatherInfo>(LOCAL_STORAGE_KEYS.WEATHER, DEFAULT_WEATHER);
}

export function saveWeather(weather: WeatherInfo): void {
  setStoredData(LOCAL_STORAGE_KEYS.WEATHER, weather);
}

export function loadHistory(): SavedOutfit[] {
  return getStoredData<SavedOutfit[]>(LOCAL_STORAGE_KEYS.HISTORY, DEFAULT_SAVED_OUTFITS);
}

export function saveHistory(history: SavedOutfit[]): void {
  setStoredData(LOCAL_STORAGE_KEYS.HISTORY, history);
}

// Utility to fetch backend stored local files and synchronize with localStorage on startup
export async function syncLocalFilesToStorage(): Promise<boolean> {
  try {
    const res = await fetch('/api/data/load');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const { wardrobe, profile, weather, history } = result.data;
        let changed = false;
        
        if (wardrobe) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.WARDROBE, JSON.stringify(wardrobe));
          changed = true;
        }
        if (profile) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILE, JSON.stringify(profile));
          changed = true;
        }
        if (weather) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.WEATHER, JSON.stringify(weather));
          changed = true;
        }
        if (history) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(history));
          changed = true;
        }
        return changed;
      }
    }
  } catch (e) {
    console.error("Failed to fetch/sync local files from server:", e);
  }
  return false;
}


// Smart rule-based outfit generator if Gemini API is unreachable or on initial mount
export function generateRuleBasedOutfit(
  wardrobe: ClothingItem[],
  weather: WeatherInfo,
  tpo: TPOScenario,
  profile: UserProfile
): OutfitGenerationResult {
  const currentTemp = weather.temp;
  const tempOffset = profile.temperatureOffset ?? (profile.coldSensitivity === 'sensitive' ? -2 : profile.coldSensitivity === 'resistant' ? 2 : 0);
  const effectiveTemp = currentTemp + tempOffset;
  const avoidColors = profile.avoidColors || [];

  // Filter items suitable for temperature
  const scoreItemWeather = (item: ClothingItem) => {
    let score = 100;
    if (effectiveTemp < item.minTemp) {
      score -= Math.min(60, (item.minTemp - effectiveTemp) * 8);
    }
    if (effectiveTemp > item.maxTemp) {
      score -= Math.min(60, (effectiveTemp - item.maxTemp) * 8);
    }
    if ((weather.condition === 'Rain' || weather.condition === 'Drizzle') && item.waterproof) {
      score += 15;
    }
    if (weather.windSpeed > 4 && item.windproof) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  };

  const scoreItemTPO = (item: ClothingItem) => {
    const diff = Math.abs(item.formality - tpo.formalityTarget);
    let score = 100 - diff * 20;
    const hasMatchingStyle = item.styleTags.some(tag => 
      tpo.recommendedStyles.some(s => tag.includes(s) || s.includes(tag))
    );
    if (hasMatchingStyle) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const scoreItemAvoidColor = (item: ClothingItem) => {
    if (avoidColors.length === 0) return 0;
    const itemColor = (item.primaryColor || '').toLowerCase();
    const itemName = (item.name || '').toLowerCase();
    const isAvoided = avoidColors.some(ac => {
      const acLower = ac.toLowerCase();
      return itemColor.includes(acLower) || acLower.includes(itemColor) || itemName.includes(acLower);
    });
    return isAvoided ? -35 : 0;
  };

  const tops = wardrobe.filter(w => w.category === 'top');
  const bottoms = wardrobe.filter(w => w.category === 'bottom');
  const shoes = wardrobe.filter(w => w.category === 'shoes');
  const outers = wardrobe.filter(w => w.category === 'outer');
  const accessories = wardrobe.filter(w => w.category === 'accessory');
  const bags = wardrobe.filter(w => w.category === 'bag');

  const rankItems = (items: ClothingItem[]) => {
    return [...items].sort((a, b) => {
      const scoreA = scoreItemWeather(a) * 0.4 + scoreItemTPO(a) * 0.4 + (a.isFavorite ? 10 : 0) + scoreItemAvoidColor(a);
      const scoreB = scoreItemWeather(b) * 0.4 + scoreItemTPO(b) * 0.4 + (b.isFavorite ? 10 : 0) + scoreItemAvoidColor(b);
      return scoreB - scoreA;
    });
  };

  const rankedTops = rankItems(tops.length > 0 ? tops : wardrobe);
  const rankedBottoms = rankItems(bottoms.length > 0 ? bottoms : wardrobe);
  const rankedShoes = rankItems(shoes.length > 0 ? shoes : wardrobe);
  const rankedOuters = rankItems(outers);

  // Option A (Best classic match)
  const topA = rankedTops[0] || tops[0] || wardrobe[0];
  const bottomA = rankedBottoms[0] || bottoms[0] || wardrobe[0];
  const shoesA = rankedShoes[0] || shoes[0] || wardrobe[0];
  const outerA = effectiveTemp < 19 ? (rankedOuters[0] || undefined) : undefined;
  const accA = effectiveTemp < 10 ? accessories[0] : undefined;
  const bagA = bags[0];

  // Option B (Alternative / Trendy look)
  const topB = rankedTops[1] || rankedTops[0] || tops[0] || wardrobe[0];
  const bottomB = rankedBottoms[1] || rankedBottoms[0] || bottoms[0] || wardrobe[0];
  const shoesB = rankedShoes[1] || rankedShoes[0] || shoes[0] || wardrobe[0];
  const outerB = effectiveTemp < 19 ? (rankedOuters[1] || rankedOuters[0]) : undefined;
  const accB = accessories[1] || accessories[0];
  const bagB = bags[1] || bags[0];

  const calcOptionScores = (top: ClothingItem, bottom: ClothingItem, outer?: ClothingItem) => {
    const items = [top, bottom, outer].filter(Boolean) as ClothingItem[];
    const avgWeather = Math.round(items.reduce((acc, i) => acc + scoreItemWeather(i), 0) / (items.length || 1));
    const avgTpo = Math.round(items.reduce((acc, i) => acc + scoreItemTPO(i), 0) / (items.length || 1));
    const personalScore = 92; // Profile match
    const totalScore = Math.round(avgWeather * 0.35 + avgTpo * 0.35 + personalScore * 0.30);
    return {
      weatherScore: Math.min(99, Math.max(70, avgWeather)),
      tpoScore: Math.min(98, Math.max(72, avgTpo)),
      personalScore: Math.min(96, Math.max(75, personalScore)),
      totalScore: Math.min(98, Math.max(72, totalScore)),
    };
  };

  const scoresA = calcOptionScores(topA, bottomA, outerA);
  const scoresB = calcOptionScores(topB, bottomB, outerB);

  const optionA: OutfitRecommendation = {
    optionId: 'A',
    title: '추천 A: 포근한 클래식 밸런스 룩',
    subtitle: `${tpo.name}에 최적화된 정석적이고 신뢰감 있는 코디`,
    vibe: 'Classic & Smart Balance',
    items: {
      top: topA,
      bottom: bottomA,
      shoes: shoesA,
      outer: outerA,
      accessory: accA,
      bag: bagA,
    },
    scores: scoresA,
    scoreDetails: {
      weatherFitReason: `현재 기온 ${currentTemp}°C에 부합하며 실내외 적정 보온성을 유지합니다.`,
      tpoFitReason: `${tpo.name}의 격식도(목표: ${tpo.formalityTarget}단계)에 정확히 부합합니다.`,
      personalFitReason: `${profile.gender === 'male' ? '남성' : '여성'} ${profile.bodyType} 체형의 비율을 단정하게 정돈합니다.`,
    },
    stylistAdvice: `${topA?.name || '상의'}와 ${bottomA?.name || '하의'}의 깔끔한 핏감이 안정감을 줍니다. ${outerA ? `${outerA.name}를 걸쳐 일교차에 대비하세요.` : '가벼운 차림으로 쾌적함을 살렸습니다.'}`,
    layeringTip: currentTemp < 15 ? '실내 난방에 따라 아우터를 가볍게 벗을 수 있도록 이너를 단정하게 연출하세요.' : '통기성이 좋은 이너웨어로 쾌적함을 유지하세요.',
    colorHarmony: `${topA?.primaryColor || '상의'}와 ${bottomA?.primaryColor || '하의'}의 차분한 톤온톤 밸런스가 세련된 인상을 줍니다.`,
  };

  const optionB: OutfitRecommendation = {
    optionId: 'B',
    title: '추천 B: 트렌디 포인트 스타일 룩',
    subtitle: '감각적인 실루엣과 컬러 포인트가 돋보이는 대안 코디',
    vibe: 'Trendy & Expressive',
    items: {
      top: topB,
      bottom: bottomB,
      shoes: shoesB,
      outer: outerB,
      accessory: accB,
      bag: bagB,
    },
    scores: scoresB,
    scoreDetails: {
      weatherFitReason: `체감 온도 변화에 유연하게 대처할 수 있는 소재 조합입니다.`,
      tpoFitReason: `${tpo.name} 분위기 속에서 세련된 포인트를 전달합니다.`,
      personalFitReason: `선호 키워드(${(profile.preferredStyles || profile.stylePreferences || []).slice(0, 2).join(', ')})를 적극 반영했습니다.`,
    },
    stylistAdvice: `${topB?.name || '상의'}의 실루엣이 돋보이며 개성 있는 무드를 연출합니다.`,
    layeringTip: '소매를 살짝 롤업하거나 액세서리로 포인트를 더하면 더욱 감각적입니다.',
    colorHarmony: `${topB?.primaryColor || '상의'}의 포인트 컬러가 전체 룩에 활력을 더해줍니다.`,
  };

  return {
    overallSummary: `오늘 ${weather.city} 날씨(${currentTemp}°C, ${weather.description})와 [${tpo.name}] 일정에 맞춰 엄선된 2가지 최적 코디입니다.`,
    temperatureAssessment: currentTemp < 10 
      ? '쌀쌀한 기온으로 보온성 높은 아우터와 레이어드가 필수적인 날씨입니다.'
      : currentTemp < 20 
      ? '활동하기 쾌적하지만 아침저녁 일교차를 고려한 가벼운 아우터 조합을 추천합니다.'
      : '온화하거나 다소 더운 기온으로 통기성 있는 가벼운 소재가 최적입니다.',
    optionA,
    optionB,
  };
}

export function generateLocalOutfitRecommendations(
  wardrobe: ClothingItem[],
  weather: WeatherInfo,
  tpo: TPOScenario,
  profile: UserProfile
): OutfitGenerationResult {
  return generateRuleBasedOutfit(wardrobe, weather, tpo, profile);
}

export function formatWeatherConditionKR(condition: string): string {
  switch (condition) {
    case 'Clear': return '맑음 ☀️';
    case 'Clouds': return '구름 많음 ⛅';
    case 'Rain': return '비 🌧️';
    case 'Snow': return '눈 ❄️';
    case 'Wind': return '바람 💨';
    case 'Drizzle': return '이슬비 🌦️';
    case 'Thunderstorm': return '뇌우 ⛈️';
    case 'Mist': return '안개 🌫️';
    default: return condition;
  }
}

// ----------------------------------------------------
// ProgressiveImage & Image Optimization utilities
// ----------------------------------------------------
const imageCache = new Set<string>();

export function optimizeImageUrl(url: string, targetWidth = 360): string {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', targetWidth.toString());
      parsed.searchParams.set('q', '70');
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    } catch {
      return url.replace(/w=\d+/, `w=${targetWidth}`).replace(/q=\d+/, 'q=70');
    }
  }
  return url;
}

export function preloadImages(urls: (string | undefined | null)[], targetWidth = 360) {
  if (typeof window === 'undefined') return;
  const validUrls = urls.filter((u): u is string => Boolean(u && u.trim()));
  const doPreload = () => {
    validUrls.forEach(rawUrl => {
      const optimized = optimizeImageUrl(rawUrl, targetWidth);
      if (imageCache.has(optimized)) return;
      const img = new Image();
      img.src = optimized;
      img.onload = () => imageCache.add(optimized);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(doPreload);
  } else {
    setTimeout(doPreload, 150);
  }
}

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackColorHex?: string;
  showCategoryFallback?: boolean;
  categoryName?: string;
  targetWidth?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  fallbackColorHex,
  showCategoryFallback = true,
  categoryName,
  targetWidth = 360,
  ...props
}) => {
  const optimizedSrc = optimizeImageUrl(src, targetWidth);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => imageCache.has(optimizedSrc));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!optimizedSrc) {
      setHasError(true);
      return;
    }

    if (imageCache.has(optimizedSrc)) {
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => {
      imageCache.add(optimizedSrc);
      setIsLoaded(true);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(true);
    };
  }, [optimizedSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-gray-100/70">
      {/* Background color placeholder */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{ 
          backgroundColor: fallbackColorHex || '#EAE6DF',
          opacity: isLoaded && !hasError ? 0 : 0.4 
        }} 
      />

      {/* Actual image */}
      {!hasError && optimizedSrc ? (
        <img
          src={optimizedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      ) : null}

      {/* Fallback placeholder if image fails to load */}
      {hasError && showCategoryFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-[#F4F7FC] dark:bg-[#26313F] text-gray-500">
          <div 
            className="w-7 h-7 rounded-full mb-1 border border-black/10 shadow-2xs flex items-center justify-center"
            style={{ backgroundColor: fallbackColorHex || '#7FA8DC' }}
          />
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 line-clamp-1 break-all">
            {categoryName || alt || '의류 이미지'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * 고해상도 이미지를 브라우저 Canvas를 통해 리사이징 및 압축합니다.
 * AI 분석 및 저장 시 네트워크/메모리 부하를 줄이고 처리 속도를 대폭 향상시킵니다.
 */
export async function compressImageBase64(
  dataUrl: string,
  maxWidth = 640,
  maxHeight = 640,
  quality = 0.78
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 이미 작은 크기인 경우 그대로 반환
      if (width <= maxWidth && height <= maxHeight && dataUrl.length < 150 * 1024) {
        resolve(dataUrl);
        return;
      }

      // 종횡비 유지 리사이징
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

