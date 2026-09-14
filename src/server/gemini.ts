import { Router, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import {
  generateClothingAnalysisFallback,
  generateOutfitRecommendationFallback,
  generateDeepAnalysisDossierFallback,
  generateStylistConsultFallback,
  generateFacePersonalColorFallback,
  generateCapsuleWardrobeFallback,
} from "./fallbacks";

// Helper to get Gemini client
export function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// Fallback Model Cascade
export const MODEL_CASCADE = [
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview"
];

export async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    systemInstruction?: string;
    responseSchema?: any;
    responseMimeType?: string;
    preferredModel?: string;
  }
): Promise<any> {
  const preferred = options.preferredModel && options.preferredModel.trim() !== "" ? options.preferredModel.trim() : null;
  const candidateModels = preferred 
    ? [preferred, ...MODEL_CASCADE.filter(m => m !== preferred)]
    : ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: options.responseMimeType || "application/json",
          responseSchema: options.responseSchema,
        },
      });

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Model Fallback] ${modelName} failed (${err?.status || err?.message || 'Error'}). Trying next model in cascade...`);
    }
  }

  throw lastError || new Error("All Gemini models in cascade failed.");
}

export const geminiRouter = Router();

// 1. Single Clothing AI Analysis & Auto-tagging
geminiRouter.post("/analyze-clothing", async (req: Request, res: Response) => {
  try {
    const { imageBase64, imageUrl, hintName, customGeminiKey, selectedModel, model } = req.body;
    const ai = getGeminiClient(customGeminiKey);
    const targetModel = selectedModel || model;

    if (ai) {
      try {
        const systemInstruction = `당신은 대한민국 최고의 패션 AI 스타일리스트이자 의류 태깅 전문가입니다.
제공된 의류 사진(또는 의류 정보)을 면밀히 분석하여 메타데이터 태그를 완벽하게 분류하고 정확한 JSON 형식으로만 반환하세요.
- category: 'outer' | 'top' | 'bottom' | 'shoes' | 'accessory' | 'bag' 중 정확히 1개
- subcategory: 세부 품목 (예: 롱코트, 숏패딩, 블레이저, 가디건, 셔츠, 맨투맨, 니트, 슬랙스, 청바지, 치노팬츠, 스니커즈, 로퍼, 머플러, 토트백 등)
- primaryColor: 주요 색상명 한국어 (예: 카멜 브라운, 차콜 그레이, 딥 네이비, 크림 아이보리, 세이지 그린 등)
- primaryColorHex: 해당 색상과 가장 유사한 HEX 코드 (예: #C68B59)
- secondaryColor: 보조 색상 (선택사항)
- seasons: 착용 가능한 계절 배열 (['spring', 'summer', 'fall', 'winter'] 중 1개 이상)
- minTemp: 착용에 적합한 최저 기온 (섭씨 온도 숫자)
- maxTemp: 착용에 적합한 최고 기온 (섭씨 온도 숫자)
- formality: 격식도 (1: 매우 캐주얼/홈웨어 ~ 5: 최고 격식 정장/블랙타이)
- styleTags: 어울리는 스타일 태그 3~5개 (예: ['미니멀', '댄디', '스마트캐주얼', '오피스'])
- material: 추정 소재 (예: '울 90% 혼방', '옥스포드 코튼 100%', '데님', '소가죽')
- thickness: 'thin' | 'medium' | 'thick' | 'heavy' 중 1개
- waterproof: 방수/발수 여부 boolean
- windproof: 방풍 여부 boolean
- notes: AI 스타일리스트의 착용 팁 한 줄`;

        const promptText = `이 옷 사진을 분석하여 의류 정보와 메타데이터 태그를 추출해주세요. ${hintName ? `(참고 이름: ${hintName})` : ''}`;
        let contents: any;

        if (imageBase64 && imageBase64.includes("base64,")) {
          const parts = imageBase64.split("base64,");
          const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const rawData = parts[1];

          contents = {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawData,
                },
              },
              { text: promptText },
            ],
          };
        } else {
          contents = promptText + (imageUrl ? ` (이미지 URL: ${imageUrl})` : "");
        }

        const parsed = await generateWithModelFallback(ai, {
          contents,
          systemInstruction,
          preferredModel: targetModel,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              primaryColorHex: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              seasons: { type: Type.ARRAY, items: { type: Type.STRING } },
              minTemp: { type: Type.NUMBER },
              maxTemp: { type: Type.NUMBER },
              formality: { type: Type.INTEGER },
              styleTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              material: { type: Type.STRING },
              thickness: { type: Type.STRING },
              waterproof: { type: Type.BOOLEAN },
              windproof: { type: Type.BOOLEAN },
              notes: { type: Type.STRING },
            },
            required: ["name", "category", "subcategory", "primaryColor", "primaryColorHex", "seasons", "minTemp", "maxTemp", "formality", "styleTags", "material", "thickness"]
          }
        });

        return res.json({ success: true, item: parsed });
      } catch (geminiErr) {
        console.warn("[Analyze Clothing] Gemini models unavailable. Using smart heuristic fallback:", geminiErr);
      }
    }

    const fallbackItem = generateClothingAnalysisFallback(hintName, imageBase64, imageUrl);
    return res.json({ success: true, item: fallbackItem });
  } catch (error: any) {
    console.error("Clothing analysis error:", error);
    const fallbackItem = generateClothingAnalysisFallback(req.body?.hintName);
    return res.json({ success: true, item: fallbackItem });
  }
});

// 2. Batch Clothing AI Analysis
geminiRouter.post("/analyze-clothing-batch", async (req: Request, res: Response) => {
  try {
    const { items, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided for analysis" });
    }

    const ai = getGeminiClient(customGeminiKey);
    const results: Array<{ id: string; item: any }> = [];

    for (const batchItem of items) {
      const { id, hintName, imageBase64, imageUrl } = batchItem;
      let analyzedItem: any = null;

      if (ai) {
        try {
          const systemInstruction = `당신은 대한민국 최고의 패션 AI 스타일리스트입니다. 제공된 사진(또는 의류 정보)을 분석하여 정확한 의류 메타데이터 태그를 JSON으로 반환하세요.`;
          const promptText = `이 옷 사진을 분석해주세요. ${hintName ? `(참고 명칭: ${hintName})` : ''}`;
          let contents: any;

          if (imageBase64 && imageBase64.includes("base64,")) {
            const parts = imageBase64.split("base64,");
            const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            const rawData = parts[1];

            contents = {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: rawData,
                  },
                },
                { text: promptText },
              ],
            };
          } else {
            contents = promptText + (imageUrl ? ` (이미지 URL: ${imageUrl})` : "");
          }

          analyzedItem = await generateWithModelFallback(ai, {
            contents,
            systemInstruction,
            preferredModel: targetModel,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                subcategory: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                primaryColorHex: { type: Type.STRING },
                secondaryColor: { type: Type.STRING },
                seasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                minTemp: { type: Type.NUMBER },
                maxTemp: { type: Type.NUMBER },
                formality: { type: Type.INTEGER },
                styleTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                material: { type: Type.STRING },
                thickness: { type: Type.STRING },
                waterproof: { type: Type.BOOLEAN },
                windproof: { type: Type.BOOLEAN },
                notes: { type: Type.STRING },
              },
              required: ["name", "category", "subcategory", "primaryColor", "primaryColorHex", "seasons", "minTemp", "maxTemp", "formality", "styleTags", "material", "thickness"]
            }
          });
        } catch (geminiErr) {
          console.warn(`[Batch Analyze] Item ${id || hintName} Gemini error, using fallback:`, geminiErr);
        }
      }

      if (!analyzedItem) {
        analyzedItem = generateClothingAnalysisFallback(hintName, imageBase64, imageUrl);
      }

      results.push({ id, item: analyzedItem });
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    console.error("Batch clothing analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to batch analyze clothing" });
  }
});

// 3. Outfit Recommendation Engine
geminiRouter.post("/recommend-outfit", async (req: Request, res: Response) => {
  try {
    const { profile, weather, tpo, wardrobe, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || profile?.geminiModel;

    if (!wardrobe || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return res.status(400).json({ error: "옷장에 등록된 옷이 없습니다." });
    }

    const ai = getGeminiClient(customGeminiKey || profile?.geminiApiKey);

    if (ai) {
      try {
        const prompt = `사용자의 프로필, 오늘 날씨, TPO(시간·장소·목적) 상황, 그리고 사용자가 보유한 옷장 아이템 목록을 종합 분석하여 최적의 코디 2가지(추천 A, 추천 B)를 생성해주세요.

[사용자 프로필]
- 성별: ${profile?.gender || '유니섹스'}
- 신체 스펙: 키 ${profile?.height || 175}cm, 몸무게 ${profile?.weight || 68}kg
- 체형: ${profile?.bodyType || '균형형'}
- 퍼스널 컬러: ${profile?.personalColor || '웜톤'}
- 피해야 할 색상: ${(profile?.avoidColors || []).join(', ') || '없음'}
- 체감 온도 민감도: ${profile?.temperatureOffset !== undefined ? `${profile.temperatureOffset}°C` : '0°C'}
- 선호 스타일: ${(profile?.preferredStyles || profile?.stylePreferences || []).join(', ') || '미니멀, 스마트 캐주얼'}

[오늘의 날씨 정보]
- 지역: ${weather?.city || '서울'}
- 현재 기온: ${weather?.temp ?? 18}°C (체감 ${weather?.feelsLike ?? 18}°C)
- 날씨 상태: ${weather?.condition || 'Clear'} (${weather?.description || '맑음'})
- 강수 확률: ${weather?.precipitationProb ?? 10}%

[TPO 시나리오]
- 상황: ${tpo?.name || '데일리 캐주얼'} (${tpo?.description || '일상 외출'})
- 목표 격식도(1-5): ${tpo?.formalityTarget || 3}

[사용자 보유 옷장 목록]
${JSON.stringify(wardrobe.map((item: any) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  subcategory: item.subcategory,
  primaryColor: item.primaryColor,
  formality: item.formality,
  seasons: item.seasons,
  minTemp: item.minTemp,
  maxTemp: item.maxTemp,
  styleTags: item.styleTags,
})))}`;

        const parsed = await generateWithModelFallback(ai, {
          contents: prompt,
          preferredModel: targetModel,
          systemInstruction: "당신은 최고 권위의 보그 패션 에디터이자 AI 퍼스널 스타일리스트입니다. 추천 A(클래식/단정 밸런스)와 추천 B(트렌디/포인트 룩)를 도출하고 엄격한 JSON으로 반환하세요.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSummary: { type: Type.STRING },
              temperatureAssessment: { type: Type.STRING },
              optionA: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  vibe: { type: Type.STRING },
                  itemIds: {
                    type: Type.OBJECT,
                    properties: {
                      outer: { type: Type.STRING },
                      top: { type: Type.STRING },
                      bottom: { type: Type.STRING },
                      shoes: { type: Type.STRING },
                      bag: { type: Type.STRING },
                      accessory: { type: Type.STRING },
                    },
                    required: ["top", "bottom", "shoes"]
                  },
                  scores: {
                    type: Type.OBJECT,
                    properties: {
                      weatherScore: { type: Type.INTEGER },
                      tpoScore: { type: Type.INTEGER },
                      personalScore: { type: Type.INTEGER },
                      totalScore: { type: Type.INTEGER },
                    },
                    required: ["weatherScore", "tpoScore", "personalScore", "totalScore"]
                  },
                  scoreDetails: {
                    type: Type.OBJECT,
                    properties: {
                      weatherFitReason: { type: Type.STRING },
                      tpoFitReason: { type: Type.STRING },
                      personalFitReason: { type: Type.STRING },
                    }
                  },
                  stylistAdvice: { type: Type.STRING },
                  layeringTip: { type: Type.STRING },
                  colorHarmony: { type: Type.STRING },
                  weatherCaution: { type: Type.STRING },
                },
                required: ["title", "vibe", "itemIds", "scores", "stylistAdvice"]
              },
              optionB: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  vibe: { type: Type.STRING },
                  itemIds: {
                    type: Type.OBJECT,
                    properties: {
                      outer: { type: Type.STRING },
                      top: { type: Type.STRING },
                      bottom: { type: Type.STRING },
                      shoes: { type: Type.STRING },
                      bag: { type: Type.STRING },
                      accessory: { type: Type.STRING },
                    },
                    required: ["top", "bottom", "shoes"]
                  },
                  scores: {
                    type: Type.OBJECT,
                    properties: {
                      weatherScore: { type: Type.INTEGER },
                      tpoScore: { type: Type.INTEGER },
                      personalScore: { type: Type.INTEGER },
                      totalScore: { type: Type.INTEGER },
                    },
                    required: ["weatherScore", "tpoScore", "personalScore", "totalScore"]
                  },
                  scoreDetails: {
                    type: Type.OBJECT,
                    properties: {
                      weatherFitReason: { type: Type.STRING },
                      tpoFitReason: { type: Type.STRING },
                      personalFitReason: { type: Type.STRING },
                    }
                  },
                  stylistAdvice: { type: Type.STRING },
                  layeringTip: { type: Type.STRING },
                  colorHarmony: { type: Type.STRING },
                  weatherCaution: { type: Type.STRING },
                },
                required: ["title", "vibe", "itemIds", "scores", "stylistAdvice"]
              }
            },
            required: ["overallSummary", "temperatureAssessment", "optionA", "optionB"]
          }
        });

        const wardrobeMap = new Map(wardrobe.map((item: any) => [item.id, item]));
        const mapItems = (ids: any) => ({
          outer: ids?.outer ? wardrobeMap.get(ids.outer) : undefined,
          top: ids?.top ? wardrobeMap.get(ids.top) : wardrobe.find((w: any) => w.category === 'top'),
          bottom: ids?.bottom ? wardrobeMap.get(ids.bottom) : wardrobe.find((w: any) => w.category === 'bottom'),
          shoes: ids?.shoes ? wardrobeMap.get(ids.shoes) : wardrobe.find((w: any) => w.category === 'shoes'),
          bag: ids?.bag ? wardrobeMap.get(ids.bag) : undefined,
          accessory: ids?.accessory ? wardrobeMap.get(ids.accessory) : undefined,
        });

        const finalResult = {
          ...parsed,
          optionA: {
            ...parsed.optionA,
            optionId: 'A',
            items: mapItems(parsed.optionA.itemIds),
          },
          optionB: {
            ...parsed.optionB,
            optionId: 'B',
            items: mapItems(parsed.optionB.itemIds),
          }
        };

        return res.json({ success: true, data: finalResult, result: finalResult });
      } catch (geminiErr) {
        console.warn("[Recommend Outfit] Gemini models unavailable. Using smart rule engine fallback:", geminiErr);
      }
    }

    const fallbackResult = generateOutfitRecommendationFallback(wardrobe, weather, tpo, profile);
    return res.json({ success: true, data: fallbackResult, result: fallbackResult });
  } catch (error: any) {
    console.error("Outfit recommendation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate outfit recommendation" });
  }
});

// 4. Curation Deep Analysis Dossier
geminiRouter.post("/curation-deep-analysis", async (req: Request, res: Response) => {
  try {
    const { profile, weather, tpo, currentOutfit, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || "gemini-3.7-flash";
    const ai = getGeminiClient(customGeminiKey);

    if (ai) {
      try {
        const prompt = `사용자가 선택한 코디 조합과 날씨, TPO, 체형을 바탕으로 최고 권위의 보그 패션 매거진 심층 스타일링 도시에(Dossier) 리포트를 생성해주세요.

[현재 코디 아이템]
- 아우터: ${currentOutfit?.items?.outer?.name || '없음'}
- 상의: ${currentOutfit?.items?.top?.name || '미선택'}
- 하의: ${currentOutfit?.items?.bottom?.name || '미선택'}
- 신발: ${currentOutfit?.items?.shoes?.name || '미선택'}

[상황 및 날씨]
- 상황: ${tpo?.name || '데일리'}
- 날씨: ${weather?.city || '서울'}, ${weather?.temp ?? 18}°C, ${weather?.description || '맑음'}`;

        const parsed = await generateWithModelFallback(ai, {
          contents: prompt,
          preferredModel: targetModel,
          systemInstruction: "당신은 보그 파리 수석 에디터이자 하이엔드 테일러링 컨설턴트입니다. 심층 분석 도시에 리포트를 JSON으로 응답하세요.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              curationTitle: { type: Type.STRING },
              executiveSummary: { type: Type.STRING },
              radarScores: {
                type: Type.OBJECT,
                properties: {
                  thermalComfort: { type: Type.INTEGER },
                  tpoAppropriateness: { type: Type.INTEGER },
                  bodySilhouetteFit: { type: Type.INTEGER },
                  colorHarmony: { type: Type.INTEGER },
                  trendIndex: { type: Type.INTEGER },
                  overallQuality: { type: Type.INTEGER },
                },
                required: ["thermalComfort", "tpoAppropriateness", "bodySilhouetteFit", "colorHarmony", "trendIndex", "overallQuality"]
              },
              thermalAnalysis: {
                type: Type.OBJECT,
                properties: {
                  estimatedClo: { type: Type.NUMBER },
                  comfortDescription: { type: Type.STRING },
                  layeringAdvice: { type: Type.STRING },
                },
                required: ["estimatedClo", "comfortDescription", "layeringAdvice"]
              },
              bodyOptimization: {
                type: Type.OBJECT,
                properties: {
                  bodyTypeKorean: { type: Type.STRING },
                  silhouetteAdvantage: { type: Type.STRING },
                  tuckInGuidance: { type: Type.STRING },
                },
                required: ["bodyTypeKorean", "silhouetteAdvantage", "tuckInGuidance"]
              },
              colorPaletteTheory: {
                type: Type.OBJECT,
                properties: {
                  harmonyType: { type: Type.STRING },
                  colorDominance: { type: Type.STRING },
                  personalColorNote: { type: Type.STRING },
                },
                required: ["harmonyType", "colorDominance", "personalColorNote"]
              },
              shoeAndAccessoryGuide: {
                type: Type.OBJECT,
                properties: {
                  shoesStyling: { type: Type.STRING },
                  bagStyling: { type: Type.STRING },
                  jewelryAndAcc: { type: Type.STRING },
                },
                required: ["shoesStyling", "bagStyling", "jewelryAndAcc"]
              },
              proTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["curationTitle", "executiveSummary", "radarScores", "thermalAnalysis", "bodyOptimization", "colorPaletteTheory", "shoeAndAccessoryGuide", "proTips"]
          }
        });

        return res.json({ success: true, data: parsed });
      } catch (geminiErr) {
        console.warn("[Deep Analysis] Gemini unavailable. Using fallback:", geminiErr);
      }
    }

    const fallbackDossier = generateDeepAnalysisDossierFallback(profile, weather, tpo, currentOutfit);
    return res.json({ success: true, data: fallbackDossier });
  } catch (error: any) {
    const fallbackDossier = generateDeepAnalysisDossierFallback(req.body?.profile, req.body?.weather, req.body?.tpo, req.body?.currentOutfit);
    return res.json({ success: true, data: fallbackDossier });
  }
});

// 5. Stylist Consultation Chat
geminiRouter.post("/stylist-consult", async (req: Request, res: Response) => {
  try {
    const { query, currentOutfit, weather, tpo, profile, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || "gemini-3.7-flash";
    const ai = getGeminiClient(customGeminiKey);

    if (ai) {
      try {
        const prompt = `사용자의 코디 질문: "${query}"
[현재 코디 정보]
- 상의: ${currentOutfit?.items?.top?.name || '미선택'}
- 하의: ${currentOutfit?.items?.bottom?.name || '미선택'}
- 아우터: ${currentOutfit?.items?.outer?.name || '없음'}
- 기온: ${weather?.temp ?? 18}°C (${weather?.description || '맑음'})
- TPO: ${tpo?.name || '데일리'}`;

        const parsed = await generateWithModelFallback(ai, {
          contents: prompt,
          preferredModel: targetModel,
          systemInstruction: "당신은 대한민국 최고 권위의 패션 스타일리스트입니다. 정중하고 전문적인 어조로 답변과 추천 액션을 JSON으로 제공하세요.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              suggestedAction: { type: Type.STRING },
            },
            required: ["reply", "suggestedAction"]
          }
        });

        return res.json({ success: true, reply: parsed.reply, suggestedAction: parsed.suggestedAction });
      } catch (geminiErr) {
        console.warn("[Stylist Consult] Gemini error, using fallback:", geminiErr);
      }
    }

    const fallbackChat = generateStylistConsultFallback(query, currentOutfit, weather, tpo, profile);
    return res.json({ success: true, reply: fallbackChat.reply, suggestedAction: fallbackChat.suggestedAction });
  } catch (error: any) {
    const fallbackChat = generateStylistConsultFallback(req.body?.query, req.body?.currentOutfit, req.body?.weather, req.body?.tpo, req.body?.profile);
    return res.json({ success: true, reply: fallbackChat.reply, suggestedAction: fallbackChat.suggestedAction });
  }
});

// 6. Test Gemini Connection
geminiRouter.post("/test-connection", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || "gemini-3.7-flash";
    const ai = getGeminiClient(customGeminiKey);

    if (!ai) {
      return res.status(400).json({
        success: false,
        error: "Gemini API 키가 제공되지 않았거나 서버 환경변수가 비어있습니다.",
      });
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: "당신은 AI 패션 스타일리스트입니다. '연결 성공'과 함께 한 줄 환영 인사를 한국어로 짧게 남겨주세요.",
    });

    const elapsedMs = Date.now() - startTime;
    return res.json({
      success: true,
      model: targetModel,
      elapsedMs,
      message: response.text || "Gemini 모델과 성공적으로 연결되었습니다.",
    });
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    console.error("Gemini test connection error:", error);
    return res.status(500).json({
      success: false,
      elapsedMs,
      error: error.message || "Gemini API 연결에 실패했습니다.",
    });
  }
});

// 7. Face Personal Color Analysis
geminiRouter.post("/analyze-face-personal-color", async (req: Request, res: Response) => {
  try {
    const { imageBase64, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || "gemini-3.7-flash";
    const ai = getGeminiClient(customGeminiKey);

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "얼굴 사진 데이터가 제공되지 않았습니다." });
    }

    if (ai) {
      try {
        const systemInstruction = `당신은 최고 권위의 퍼스널 컬러 컨설턴트입니다. 사진을 분석하여 정확한 퍼스널 컬러와 피해야 할 색상을 JSON으로 응답하세요.`;
        const promptText = "얼굴 사진을 바탕으로 퍼스널 컬러와 추천/비추천 색상을 진단해주세요.";

        let contents: any;
        if (imageBase64.includes("base64,")) {
          const parts = imageBase64.split("base64,");
          const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const rawData = parts[1];

          contents = {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawData,
                },
              },
              { text: promptText },
            ],
          };
        } else {
          contents = promptText;
        }

        const parsed = await generateWithModelFallback(ai, {
          contents,
          preferredModel: targetModel,
          systemInstruction,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personalColor: { type: Type.STRING },
              personalColorName: { type: Type.STRING },
              badgeEmoji: { type: Type.STRING },
              confidenceScore: { type: Type.INTEGER },
              skinUndertone: { type: Type.STRING },
              analysisSummary: { type: Type.STRING },
              recommendedColors: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoidColors: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["personalColor", "personalColorName", "badgeEmoji", "confidenceScore", "skinUndertone", "analysisSummary", "recommendedColors", "avoidColors"]
          }
        });

        return res.json({ success: true, data: parsed });
      } catch (geminiErr) {
        console.warn("[Face Color Analysis] Gemini error, using fallback:", geminiErr);
      }
    }

    const fallbackResult = generateFacePersonalColorFallback();
    return res.json({ success: true, data: fallbackResult });
  } catch (error: any) {
    console.error("Face analysis error:", error);
    const fallbackResult = generateFacePersonalColorFallback();
    return res.json({ success: true, data: fallbackResult });
  }
});

// 8. [NEW] Capsule Wardrobe Gap Analysis & Shopping Recommendation
geminiRouter.post("/analyze-capsule-wardrobe", async (req: Request, res: Response) => {
  try {
    const { wardrobe, profile, customGeminiKey, selectedModel, model } = req.body;
    const targetModel = selectedModel || model || profile?.geminiModel || "gemini-3.7-flash";

    if (!wardrobe || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return res.status(400).json({ error: "옷장에 등록된 의류가 없습니다." });
    }

    const ai = getGeminiClient(customGeminiKey || profile?.geminiApiKey);

    if (ai) {
      try {
        const prompt = `사용자의 현재 옷장 목록을 분석하여 '캡슐 워드로브(Capsule Wardrobe)' 진단과, "이 옷 1벌만 추가하면 코디가 N개 늘어나는" 핵심 쇼핑 추천 아이템 3~4개를 도출해주세요.

[사용자 프로필]
- 성별: ${profile?.gender || '유니섹스'}
- 체형: ${profile?.bodyType || '균형형'}
- 퍼스널 컬러: ${profile?.personalColor || '웜톤'}
- 선호 스타일: ${(profile?.preferredStyles || []).join(', ') || '미니멀, 스마트 캐주얼'}

[현재 등록된 옷장 아이템 목록 (${wardrobe.length}벌)]
${JSON.stringify(wardrobe.map((item: any) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  subcategory: item.subcategory,
  primaryColor: item.primaryColor,
  formality: item.formality,
  seasons: item.seasons,
  styleTags: item.styleTags,
})))}`;

        const parsed = await generateWithModelFallback(ai, {
          contents: prompt,
          preferredModel: targetModel,
          systemInstruction: "당신은 미니멀리스트 캡슐 워드로브 컨설턴트입니다. 현재 옷장의 병목 카테고리를 진단하고, 코디 레버리지를 가장 극대화하는 3개의 쇼핑 아이템을 제안하세요.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              capsuleCompletenessScore: { type: Type.INTEGER },
              bottleneckCategory: { type: Type.STRING },
              bottleneckMessage: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    subcategory: { type: Type.STRING },
                    primaryColor: { type: Type.STRING },
                    primaryColorHex: { type: Type.STRING },
                    multiplierCombos: { type: Type.INTEGER },
                    whyNeeded: { type: Type.STRING },
                    shoppingKeyword: { type: Type.STRING },
                    estimatedPrice: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                  required: ["name", "category", "subcategory", "primaryColor", "primaryColorHex", "multiplierCombos", "whyNeeded", "shoppingKeyword", "estimatedPrice", "priority"]
                }
              }
            },
            required: ["capsuleCompletenessScore", "bottleneckCategory", "bottleneckMessage", "recommendations"]
          }
        });

        // 네이버 쇼핑 링크 및 추가 통계 합성
        const outers = wardrobe.filter((i: any) => i.category === 'outer');
        const tops = wardrobe.filter((i: any) => i.category === 'top');
        const bottoms = wardrobe.filter((i: any) => i.category === 'bottom');
        const shoes = wardrobe.filter((i: any) => i.category === 'shoes');
        const baseCombos = Math.max(1, tops.length) * Math.max(1, bottoms.length) * Math.max(1, shoes.length);
        const totalCombinations = outers.length > 0 ? baseCombos * (outers.length + 1) : baseCombos;

        const enhancedRecommendations = parsed.recommendations.map((rec: any, idx: number) => ({
          ...rec,
          id: `capsule_rec_ai_${Date.now()}_${idx}`,
          shoppingUrl: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(rec.shoppingKeyword || rec.name)}`,
        }));

        const resultData = {
          totalItems: wardrobe.length,
          totalCombinations,
          capsuleCompletenessScore: parsed.capsuleCompletenessScore,
          bottleneckCategory: parsed.bottleneckCategory,
          bottleneckMessage: parsed.bottleneckMessage,
          seasonalCoverage: {
            springFall: Math.min(100, Math.round((wardrobe.filter((i: any) => (i.seasons || []).includes('spring') || (i.seasons || []).includes('fall')).length / Math.max(1, wardrobe.length)) * 100)),
            summer: Math.min(100, Math.round((wardrobe.filter((i: any) => (i.seasons || []).includes('summer')).length / Math.max(1, wardrobe.length)) * 100)),
            winter: Math.min(100, Math.round((wardrobe.filter((i: any) => (i.seasons || []).includes('winter')).length / Math.max(1, wardrobe.length)) * 100)),
          },
          recommendations: enhancedRecommendations,
        };

        return res.json({ success: true, data: resultData });
      } catch (geminiErr) {
        console.warn("[Capsule Analysis] Gemini error, using fallback:", geminiErr);
      }
    }

    const fallbackResult = generateCapsuleWardrobeFallback(wardrobe, profile);
    return res.json({ success: true, data: fallbackResult });
  } catch (error: any) {
    console.error("Capsule analysis error:", error);
    const fallbackResult = generateCapsuleWardrobeFallback(req.body?.wardrobe, req.body?.profile);
    return res.json({ success: true, data: fallbackResult });
  }
});
