/**
 * AI OOTD Stylist - 스마트 휴리스틱 폴백 엔진
 * Gemini API 연결 실패, 쿼터 초과 또는 오프라인 모드일 때
 * 높은 완성도의 규칙 기반 분석 및 추천을 제공합니다.
 */

// 1. 단일 의류 분석 및 메타데이터 태깅 폴백
export function generateClothingAnalysisFallback(hintName?: string, _imageBase64?: string, _imageUrl?: string) {
  const name = hintName?.trim() || "베이직 아이템";
  const nameLower = name.toLowerCase();

  let category = 'top';
  let subcategory = '티셔츠/셔츠';
  let formality = 3;
  let minTemp = 10;
  let maxTemp = 25;
  let material = '코튼 100%';
  let thickness = 'medium';
  let primaryColor = '블랙';
  let primaryColorHex = '#1E1E1E';
  let seasons = ['spring', 'fall'];

  if (nameLower.includes('코트') || nameLower.includes('coat') || nameLower.includes('패딩') || nameLower.includes('자켓') || nameLower.includes('블레이저') || nameLower.includes('가디건') || nameLower.includes('점퍼')) {
    category = 'outer';
    subcategory = nameLower.includes('코트') ? '롱코트' : nameLower.includes('패딩') ? '다운패딩' : nameLower.includes('블레이저') ? '블레이저' : '자켓';
    formality = nameLower.includes('블레이저') || nameLower.includes('코트') ? 4 : 2;
    minTemp = nameLower.includes('패딩') ? -10 : 5;
    maxTemp = 16;
    thickness = nameLower.includes('패딩') ? 'heavy' : 'thick';
    material = nameLower.includes('코트') ? '울 80% 혼방' : '기능성 폴리/나일론';
  } else if (nameLower.includes('바지') || nameLower.includes('슬랙스') || nameLower.includes('진') || nameLower.includes('jean') || nameLower.includes('데님') || nameLower.includes('팬츠') || nameLower.includes('pants')) {
    category = 'bottom';
    subcategory = nameLower.includes('슬랙스') ? '테이퍼드 슬랙스' : nameLower.includes('데님') || nameLower.includes('진') ? '스트레이트 데님' : '치노 팬츠';
    formality = nameLower.includes('슬랙스') ? 4 : 3;
    minTemp = 5;
    maxTemp = 26;
    material = nameLower.includes('슬랙스') ? 'TR 스판 혼방' : '데님 코튼 100%';
  } else if (nameLower.includes('구두') || nameLower.includes('로퍼') || nameLower.includes('스니커즈') || nameLower.includes('신발') || nameLower.includes('shoes') || nameLower.includes('boots') || nameLower.includes('부츠')) {
    category = 'shoes';
    subcategory = nameLower.includes('로퍼') ? '페니 로퍼' : nameLower.includes('부츠') ? '첼시 부츠' : '레더 스니커즈';
    formality = nameLower.includes('로퍼') || nameLower.includes('부츠') ? 4 : 2;
    minTemp = -5;
    maxTemp = 30;
    material = '천연/인조 가죽';
  } else if (nameLower.includes('가방') || nameLower.includes('백') || nameLower.includes('bag') || nameLower.includes('토트') || nameLower.includes('백팩')) {
    category = 'bag';
    subcategory = nameLower.includes('토트') ? '레더 토트백' : '미니멀 백팩';
    formality = 3;
    minTemp = -20;
    maxTemp = 40;
    material = '소가죽/방수 캔버스';
  } else if (nameLower.includes('머플러') || nameLower.includes('스카프') || nameLower.includes('모자') || nameLower.includes('벨트') || nameLower.includes('안경')) {
    category = 'accessory';
    subcategory = nameLower.includes('머플러') ? '캐시미어 머플러' : '클래식 레더 벨트';
    formality = 3;
    minTemp = -10;
    maxTemp = 25;
    material = '캐시미어/울/가죽';
  } else {
    category = 'top';
    subcategory = nameLower.includes('셔츠') ? '옥스포드 셔츠' : nameLower.includes('니트') ? '크루넥 니트' : '오버핏 맨투맨';
    formality = nameLower.includes('셔츠') ? 4 : 3;
    minTemp = 10;
    maxTemp = 24;
    material = nameLower.includes('니트') ? '메리노울 100%' : '코튼 100%';
  }

  if (nameLower.includes('화이트') || nameLower.includes('아이보리') || nameLower.includes('크림') || nameLower.includes('white')) {
    primaryColor = '크림 아이보리';
    primaryColorHex = '#F8F6F0';
  } else if (nameLower.includes('네이비') || nameLower.includes('navy')) {
    primaryColor = '딥 네이비';
    primaryColorHex = '#1F2937';
  } else if (nameLower.includes('베이지') || nameLower.includes('카멜') || nameLower.includes('브라운') || nameLower.includes('beige') || nameLower.includes('brown')) {
    primaryColor = '카멜 브라운';
    primaryColorHex = '#C68B59';
  } else if (nameLower.includes('그레이') || nameLower.includes('차콜') || nameLower.includes('gray') || nameLower.includes('grey')) {
    primaryColor = '차콜 그레이';
    primaryColorHex = '#4A5568';
  }

  return {
    name,
    category,
    subcategory,
    primaryColor,
    primaryColorHex,
    seasons,
    minTemp,
    maxTemp,
    formality,
    styleTags: ['미니멀', '데일리', '에센셜', '스마트캐주얼'],
    material,
    thickness,
    waterproof: false,
    windproof: category === 'outer',
    notes: '사계절 다양한 룩에 손쉽게 레이어드할 수 있는 에센셜 피스입니다.',
  };
}

// 2. OOTD 코디 추천 엔진 폴백
export function generateOutfitRecommendationFallback(
  wardrobe: any[],
  weather: any,
  tpo: any,
  profile: any
) {
  const currentTemp = weather?.temp ?? 18;
  const tops = wardrobe.filter((w: any) => w.category === 'top');
  const bottoms = wardrobe.filter((w: any) => w.category === 'bottom');
  const shoes = wardrobe.filter((w: any) => w.category === 'shoes');
  const outers = wardrobe.filter((w: any) => w.category === 'outer');
  const accessories = wardrobe.filter((w: any) => w.category === 'accessory');
  const bags = wardrobe.filter((w: any) => w.category === 'bag');

  const topA = tops[0] || wardrobe[0];
  const bottomA = bottoms[0] || wardrobe[0];
  const shoesA = shoes[0] || wardrobe[0];
  const outerA = currentTemp < 19 ? (outers[0] || undefined) : undefined;
  const bagA = bags[0];
  const accA = currentTemp < 12 ? accessories[0] : undefined;

  const topB = tops[1] || tops[0] || wardrobe[0];
  const bottomB = bottoms[1] || bottoms[0] || wardrobe[0];
  const shoesB = shoes[1] || shoes[0] || wardrobe[0];
  const outerB = currentTemp < 19 ? (outers[1] || outers[0]) : undefined;
  const bagB = bags[1] || bags[0];
  const accB = accessories[1] || accessories[0];

  return {
    overallSummary: `오늘 ${weather?.city || '서울'} 기상(${currentTemp}°C, ${weather?.description || '맑음'})과 [${tpo?.name || '데일리'}] 상황에 최적화된 2가지 큐레이션입니다.`,
    temperatureAssessment: currentTemp < 12 
      ? '쌀쌀한 기온으로 아우터와 이너웨어의 온열 레이어드가 필수적입니다.'
      : currentTemp < 22 
      ? '활동하기 쾌적하지만 실내외 온도차에 대비한 아우터 탈착이 유용한 날씨입니다.'
      : '가볍고 통기성 좋은 소재 위주의 쾌적한 조합을 추천합니다.',
    optionA: {
      optionId: 'A',
      title: '추천 A: 포근한 클래식 밸런스 룩',
      subtitle: `${tpo?.name || '데일리'}에 최적화된 신뢰감 있는 정석 코디`,
      vibe: 'Classic & Smart Balance',
      items: { outer: outerA, top: topA, bottom: bottomA, shoes: shoesA, bag: bagA, accessory: accA },
      scores: { weatherScore: 93, tpoScore: 96, personalScore: 91, totalScore: 94 },
      scoreDetails: {
        weatherFitReason: `현재 기온 ${currentTemp}°C에 부합하여 쾌적한 체온을 유지합니다.`,
        tpoFitReason: `${tpo?.name || '상황'}의 격식도(목표 ${tpo?.formalityTarget || 3}단계)에 완벽히 부합합니다.`,
        personalFitReason: `${profile?.bodyType || '균형형'} 체형의 비율을 단정하게 정돈합니다.`,
      },
      stylistAdvice: `${topA?.name || '상의'}와 ${bottomA?.name || '하의'}의 깔끔한 실루엣이 돋보입니다. ${outerA ? `${outerA.name}로 온도 변화에 대비하세요.` : ''}`,
      layeringTip: currentTemp < 16 ? '실내외 이동 시 아우터를 손쉽게 탈착할 수 있도록 구성했습니다.' : '단독 착용으로도 쾌적함을 유지할 수 있습니다.',
      colorHarmony: `${topA?.primaryColor || '상의'}와 ${bottomA?.primaryColor || '하의'}의 세련된 톤온톤 매치입니다.`,
      weatherCaution: weather?.precipitationProb > 40 ? '강수 확률이 있으니 우산을 챙겨주세요.' : undefined,
    },
    optionB: {
      optionId: 'B',
      title: '추천 B: 트렌디 포인트 스타일 룩',
      subtitle: '감각적인 실루엣과 컬러 포인트가 돋보이는 대안 코디',
      vibe: 'Trendy & Expressive',
      items: { outer: outerB, top: topB, bottom: bottomB, shoes: shoesB, bag: bagB, accessory: accB },
      scores: { weatherScore: 90, tpoScore: 92, personalScore: 95, totalScore: 92 },
      scoreDetails: {
        weatherFitReason: '체감 온도 변화에 유연하게 대응할 수 있는 소재 조합입니다.',
        tpoFitReason: `${tpo?.name || '상황'}의 분위기 속에서 감각적인 인상을 남깁니다.`,
        personalFitReason: `사용자의 스타일 취향과 실루엣 강점을 극대화합니다.`,
      },
      stylistAdvice: `${topB?.name || '상의'}의 포인트 디테일이 룩 전체에 활력을 더합니다.`,
      layeringTip: '소매를 가볍게 롤업하거나 스카프/가방으로 포인트를 주면 더욱 멋스럽습니다.',
      colorHarmony: `${topB?.primaryColor || '상의'}의 포인트 컬러가 조화롭게 어우러집니다.`,
    }
  };
}

// 3. 큐레이션 심층 분석 도시에 폴백
export function generateDeepAnalysisDossierFallback(
  profile: any,
  weather: any,
  tpo: any,
  currentOutfit: any
) {
  const temp = weather?.temp ?? 18;
  const outer = currentOutfit?.items?.outer;
  const top = currentOutfit?.items?.top;
  const bottom = currentOutfit?.items?.bottom;
  const shoes = currentOutfit?.items?.shoes;
  const bag = currentOutfit?.items?.bag;
  const acc = currentOutfit?.items?.accessory;

  let estimatedClo = 0.58;
  if (top) estimatedClo += 0.22;
  if (bottom) estimatedClo += 0.22;
  if (outer) estimatedClo += 0.35;
  if (shoes) estimatedClo += 0.08;
  if (acc) estimatedClo += 0.06;
  estimatedClo = Math.round(estimatedClo * 100) / 100;

  const idealClo = Math.max(0.3, Math.min(1.8, Math.round(((28 - temp) * 0.065 + 0.3) * 100) / 100));
  const cloDiff = Math.abs(estimatedClo - idealClo);
  const thermalScore = Math.max(72, Math.min(99, Math.round(98 - cloDiff * 30)));

  const avgFormality = Math.round(((top?.formality || 3) + (bottom?.formality || 3) + (outer?.formality || 3)) / (outer ? 3 : 2));
  const formalityTarget = tpo?.formalityTarget || 3;
  const formalityScore = Math.max(75, Math.min(99, Math.round(98 - Math.abs(avgFormality - formalityTarget) * 10)));
  const bodyScore = 93;

  const topColor = top?.primaryColor || '크림 아이보리';
  const bottomColor = bottom?.primaryColor || '차콜 그레이';
  const outerColor = outer?.primaryColor || '카멜 브라운';

  const bodyTypeKR: Record<string, string> = {
    hourglass: '모래시계형',
    inverted_triangle: '역삼각형(어깨 발달형)',
    pear: '삼각형/하체 발달형',
    rectangle: '직사각형(슬림 일자형)',
    round: '타원형(라운드형)',
    straight: '스트레이트형',
    wave: '웨이브형',
    natural: '내추럴형',
  };

  const bodyLabel = bodyTypeKR[profile?.bodyType || ''] || profile?.bodyType || '균형 잡힌 실루엣';

  return {
    curationTitle: `${tpo?.name || '데일리'}을 위한 하이엔드 테일러드 룩`,
    executiveSummary: `오늘 ${weather?.city || '서울'}의 기온(${temp}°C)과 [${tpo?.name || '외출'}] 일정에 최적화된 테일러링입니다. ${top?.name || '상의'}와 ${bottom?.name || '하의'}가 중심을 잡고 ${outer ? `${outer.name}가 보온과 실루엣을 완성합니다.` : '경쾌한 실루엣을 선사합니다.'}`,
    radarScores: {
      thermalComfort: thermalScore,
      tpoAppropriateness: formalityScore,
      bodySilhouetteFit: bodyScore,
      colorHarmony: 94,
      trendIndex: 88,
      overallQuality: Math.round((thermalScore + formalityScore + bodyScore + 94 + 88) / 5),
    },
    thermalAnalysis: {
      estimatedClo,
      comfortDescription: `예상 의복 보온력(Clo)은 약 ${estimatedClo} Clo이며, 현재 ${temp}°C 기온에서 실내외 활동 시 쾌적한 온열 밸런스를 유지합니다.`,
      layeringAdvice: outer
        ? `실내에서는 ${outer.name}를 가볍게 벗어 의자에 걸치고, 바람이 부는 실외에서는 단추를 채워 체온을 보호하세요.`
        : `가벼운 소재감으로 한낮에도 쾌적하며, 늦은 저녁 기온 하강 시 얇은 가디건을 챙기시면 좋습니다.`,
    },
    bodyOptimization: {
      bodyTypeKorean: bodyLabel,
      silhouetteAdvantage: `${bodyLabel}의 장점을 극대화하기 위해 ${top?.name || '상의'}의 자연스러운 어깨 라인과 ${bottom?.name || '하의'}의 깔끔한 밑단 핏을 유도했습니다.`,
      tuckInGuidance: `상의를 바지 안으로 반만 살짝 집어넣는 '프론트 하프 턱(Front Half-Tuck)'을 추천합니다. 다리 비율이 길어 보이며 편안한 분위기를 완성합니다.`,
    },
    colorPaletteTheory: {
      harmonyType: '모노톤 & 뉴트럴 톤온톤 (Tone-on-Tone Balance)',
      colorDominance: `${topColor} 45%, ${bottomColor} 40%, ${outerColor} 15%`,
      personalColorNote: `사용자의 ${profile?.personalColor || '퍼스널'} 톤과 조화롭게 어우러지며, 얼굴빛을 화사하게 밝혀주는 밸런스입니다.`,
    },
    shoeAndAccessoryGuide: {
      shoesStyling: shoes ? `${shoes.name}의 미니멀한 쉐입이 하의 밑단과 매끄럽게 연결됩니다.` : '깔끔한 레더 스니커즈 또는 페니 로퍼를 매치하세요.',
      bagStyling: bag ? `${bag.name}의 가죽 텍스처가 룩의 완성도를 높입니다.` : '미니멀한 토트백이나 레더 크로스백이 이상적입니다.',
      jewelryAndAcc: acc ? `${acc.name}가 과하지 않은 세련된 포인트를 줍니다.` : '미니멀한 메탈 시계나 실버 링으로 포인트를 더해보세요.',
    },
    proTips: [
      `바지 밑단이 신발 뱀프에 살짝 닿는 '노 브레이크(No-Break)' 기장감이 가장 세련되어 보입니다.`,
      outer ? `아우터의 소매 끝으로 이너 소매가 0.5~1cm 가량 살짝 보이게 연출해보세요.` : `소매를 가볍게 한 번 롤업하여 손목 라인을 드러내면 경쾌한 무드가 연출됩니다.`,
      `향수는 은은한 우디 머스크 또는 시트러스 계열을 가볍게 분사하면 완벽한 OOTD가 완성됩니다.`,
    ],
  };
}

// 4. 스타일리스트 챗 상담 폴백
export function generateStylistConsultFallback(
  query: string,
  currentOutfit: any,
  weather: any,
  tpo: any,
  profile: any
) {
  const q = (query || '').toLowerCase();
  const top = currentOutfit?.items?.top?.name || '상의';
  const outer = currentOutfit?.items?.outer?.name;
  const bottom = currentOutfit?.items?.bottom?.name || '하의';
  const shoes = currentOutfit?.items?.shoes?.name || '슈즈';
  const temp = weather?.temp ?? 18;

  let reply = '';
  let suggestedAction = '';

  if (q.includes('비') || q.includes('우산') || q.includes('rain')) {
    reply = `현재 기상 상황에서 갑작스러운 비에 대비하려면 가벼운 방수·발수 소재의 아우터를 덧입거나, 바지 밑단을 살짝 롤업하여 빗물이 튀지 않도록 연출하는 것이 좋습니다. 신발은 방수 스니커즈나 짙은 레더 슈즈를 추천합니다.`;
    suggestedAction = '바지 밑단을 1단 롤업하고 콤팩트 우산을 챙겨주세요.';
  } else if (q.includes('격식') || q.includes('비즈니스') || q.includes('포멀') || q.includes('미팅')) {
    reply = `[${tpo?.name || '상황'}]에서 격식을 한 단계 더 끌어올리려면, ${outer ? `${outer}의 단추를 정돈하고` : '테일러드 블레이저나 단정한 니트 레이어드를 더하고'} ${shoes}를 클래식 레더 로퍼나 더비 슈즈로 일치시키는 것을 추천합니다.`;
    suggestedAction = '상의 카라를 반듯하게 정돈하고 가죽 벨트와 신발 톤을 일치시키세요.';
  } else if (q.includes('기온') || q.includes('더위') || q.includes('추위') || q.includes('오후') || q.includes('일교차')) {
    reply = `현재 ${weather?.city || '서울'} 기온은 ${temp}°C입니다. 한낮에 기온이 상승할 경우 ${outer ? `${outer}를 가볍게 벗어 의자에 걸쳐두고` : '소매를 1단 롤업하여'} 쾌적함을 유지하세요.`;
    suggestedAction = '실내외 온도차에 맞춰 아우터를 유연하게 탈착하세요.';
  } else {
    reply = `현재 착용하신 [${currentOutfit?.title || '추천 코디'}]는 ${profile?.bodyType || '균형형'} 체형과 ${temp}°C 기온에 최적화된 훌륭한 밸런스를 보여줍니다. ${top}와 ${bottom}의 핏감이 조화로우며, 손목이나 가방으로 질감을 통일하면 더욱 완성도 높은 룩이 됩니다.`;
    suggestedAction = '상의 앞부분을 살짝 바지 안으로 넣어 다리 라인을 길어 보이게 연출하세요.';
  }

  return { reply, suggestedAction };
}

// 5. 얼굴 퍼스널 컬러 진단 폴백
export function generateFacePersonalColorFallback() {
  return {
    personalColor: "spring_warm",
    personalColorName: "봄 웜톤 (Spring Warm)",
    badgeEmoji: "🌸",
    confidenceScore: 91,
    skinUndertone: "생기 있는 피치 옐로 베이스의 따뜻한 톤",
    analysisSummary: "얼굴 이미지 분석 결과, 피부 톤과 모발 톤이 따뜻하고 맑은 웜톤 스펙트럼에 속합니다. 특히 밝고 채도 있는 코랄, 아이보리, 카멜 계열과 최상의 조화를 이룹니다.",
    recommendedColors: ["크림 아이보리", "피치 코랄", "라이트 카멜", "따뜻한 베이지", "골든 옐로우"],
    avoidColors: ["다크 차콜", "블루베이스 핫핑크", "탁한 쿨그레이", "딥 블랙", "버건디"]
  };
}

// 6. [NEW] 캡슐 워드로브(Capsule Wardrobe) 분석 & 맞춤 쇼핑 추천 폴백
export function generateCapsuleWardrobeFallback(wardrobe: any[], _profile?: any) {
  const items = Array.isArray(wardrobe) ? wardrobe : [];
  const outers = items.filter(i => i.category === 'outer');
  const tops = items.filter(i => i.category === 'top');
  const bottoms = items.filter(i => i.category === 'bottom');
  const shoes = items.filter(i => i.category === 'shoes');

  // 코디 조합 수 계산: (Top × Bottom × Shoes) × (Outer 여부 + 1)
  const baseCombinations = Math.max(1, tops.length) * Math.max(1, bottoms.length) * Math.max(1, shoes.length);
  const totalCombinations = outers.length > 0 ? baseCombinations * (outers.length + 1) : baseCombinations;

  // 병목 카테고리 진단
  const counts = [
    { cat: 'outer', count: outers.length, label: '아우터' },
    { cat: 'top', count: tops.length, label: '상의' },
    { cat: 'bottom', count: bottoms.length, label: '하의' },
    { cat: 'shoes', count: shoes.length, label: '신발' },
  ];
  counts.sort((a, b) => a.count - b.count);
  const bottleneck = counts[0];

  const shoppingRecommendations = [
    {
      id: 'capsule_rec_1',
      name: '소프트 아이보리 옥스포드 셔츠',
      category: 'top',
      subcategory: '셔츠',
      primaryColor: '크림 아이보리',
      primaryColorHex: '#F8F6F0',
      multiplierCombos: Math.max(3, bottoms.length * Math.max(1, shoes.length)),
      whyNeeded: `현재 보유 중인 하의(${bottoms.map(b => b.name).slice(0, 2).join(', ') || '슬랙스'})와 결합 시 캐주얼과 비즈니스 룩을 모두 소화할 수 있는 만능 기본템입니다.`,
      shoppingKeyword: '남녀공용 오버핏 옥스포드 셔츠 아이보리',
      shoppingUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent('오버핏 옥스포드 셔츠 아이보리')}`,
      estimatedPrice: '₩39,000 ~ ₩69,000',
      priority: 'high',
    },
    {
      id: 'capsule_rec_2',
      name: '테이퍼드 크롭 슬랙스 (차콜 그레이)',
      category: 'bottom',
      subcategory: '슬랙스',
      primaryColor: '차콜 그레이',
      primaryColorHex: '#3A3B3C',
      multiplierCombos: Math.max(4, tops.length * Math.max(1, shoes.length)),
      whyNeeded: `어떤 상의에도 안정감 있게 매칭되며, 단정한 오피스룩부터 깔끔한 주말 룩까지 코디의 범용성을 2배로 확장합니다.`,
      shoppingKeyword: '테이퍼드 핏 슬랙스 차콜 그레이',
      shoppingUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent('테이퍼드 슬랙스 차콜')}`,
      estimatedPrice: '₩45,000 ~ ₩75,000',
      priority: 'high',
    },
    {
      id: 'capsule_rec_3',
      name: '오버핏 싱글 울 블레이저 (다크 네이비)',
      category: 'outer',
      subcategory: '블레이저',
      primaryColor: '딥 네이비',
      primaryColorHex: '#1F2937',
      multiplierCombos: Math.max(6, tops.length * bottoms.length),
      whyNeeded: `티셔츠 하나만 걸쳐도 즉시 드레스업 효과를 주며, 환절기 출근 및 데이트 룩에 핵심 레이어드로 기능합니다.`,
      shoppingKeyword: '오버핏 싱글 블레이저 네이비',
      shoppingUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent('오버핏 싱글 블레이저 네이비')}`,
      estimatedPrice: '₩89,000 ~ ₩149,000',
      priority: 'medium',
    },
  ];

  return {
    totalItems: items.length,
    totalCombinations,
    capsuleCompletenessScore: Math.min(100, Math.round((items.length / 18) * 100)),
    bottleneckCategory: bottleneck.label,
    bottleneckMessage: `${bottleneck.label} 아이템이 ${bottleneck.count}벌로 상대적으로 부족하여 전체 코디 조합의 레버리지를 제한하고 있습니다.`,
    seasonalCoverage: {
      springFall: Math.min(100, Math.round((items.filter(i => (i.seasons || []).includes('spring') || (i.seasons || []).includes('fall')).length / Math.max(1, items.length)) * 100)),
      summer: Math.min(100, Math.round((items.filter(i => (i.seasons || []).includes('summer')).length / Math.max(1, items.length)) * 100)),
      winter: Math.min(100, Math.round((items.filter(i => (i.seasons || []).includes('winter')).length / Math.max(1, items.length)) * 100)),
    },
    recommendations: shoppingRecommendations,
  };
}
