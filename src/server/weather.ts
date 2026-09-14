import { Router, Request, Response } from "express";

// Helper to generate 3-hour interval forecast for today (00:00 to 21:00)
export function generate3HourForecast(
  baseTemp: number,
  baseCondition: string,
  baseHumidity: number,
  baseWind: number,
  basePrecip: number
) {
  const currentHour = new Date().getHours();
  const intervals = [
    { timeLabel: '00:00', timeName: '자정/새벽', tempOff: -3, feelsOff: -4, humOff: 12, precipFactor: 0.8 },
    { timeLabel: '03:00', timeName: '새벽/최저', tempOff: -5, feelsOff: -6, humOff: 18, precipFactor: 0.6 },
    { timeLabel: '06:00', timeName: '이른아침', tempOff: -4, feelsOff: -5, humOff: 14, precipFactor: 0.7 },
    { timeLabel: '09:00', timeName: '오전/출근', tempOff: -1, feelsOff: -1, humOff: 5, precipFactor: 0.9 },
    { timeLabel: '12:00', timeName: '점심/낮', tempOff: +2, feelsOff: +2, humOff: -5, precipFactor: 1.0 },
    { timeLabel: '15:00', timeName: '오후/최고', tempOff: +4, feelsOff: +4, humOff: -10, precipFactor: 1.1 },
    { timeLabel: '18:00', timeName: '저녁/퇴근', tempOff: +1, feelsOff: +0, humOff: 2, precipFactor: 0.9 },
    { timeLabel: '21:00', timeName: '밤/야간', tempOff: -2, feelsOff: -3, humOff: 8, precipFactor: 0.8 },
  ];

  return intervals.map(slot => {
    const slotHour = parseInt(slot.timeLabel.split(':')[0], 10);
    const isCurrent = Math.abs(currentHour - slotHour) <= 1 || (currentHour >= 22 && slotHour === 0);
    const temp = Math.round(baseTemp + slot.tempOff);
    const feelsLike = Math.round(baseTemp + slot.feelsOff);
    const humidity = Math.min(95, Math.max(20, baseHumidity + slot.humOff));
    const precipitationProb = Math.min(100, Math.max(0, Math.round(basePrecip * slot.precipFactor)));
    
    let desc = `${slot.timeName} ${temp}°C`;
    if (baseCondition === 'Rain') desc = `${slot.timeName} 비 예보 (${precipitationProb}%)`;
    else if (baseCondition === 'Snow') desc = `${slot.timeName} 눈 예보 (${precipitationProb}%)`;
    else if (slot.tempOff >= 3) desc = `한낮 최고기온 ${temp}°C`;
    else if (slot.tempOff <= -4) desc = `새벽/아침 최저 ${temp}°C`;

    return {
      timeLabel: slot.timeLabel,
      timeName: slot.timeName,
      temp,
      feelsLike,
      condition: baseCondition,
      description: desc,
      humidity,
      precipitationProb,
      windSpeed: baseWind,
      isCurrentTimeSlot: isCurrent,
    };
  });
}

export const weatherRouter = Router();

// Weather API Proxy
weatherRouter.get("/current", async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string) || "Seoul";
    const userApiKey = (req.query.apiKey as string) || process.env.OPENWEATHER_API_KEY;

    if (userApiKey && userApiKey.trim() !== "") {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=kr&appid=${userApiKey.trim()}`;
        const response = await fetch(weatherUrl);
        if (response.ok) {
          const data = await response.json();
          const weatherCondition = data.weather?.[0]?.main || 'Clear';
          const weatherDesc = data.weather?.[0]?.description || '맑음';
          const curTemp = Math.round(data.main?.temp ?? 18);
          const curHumidity = data.main?.humidity ?? 50;
          const curWind = Math.round((data.wind?.speed ?? 2) * 10) / 10;
          const curPrecip = data.clouds?.all ? Math.min(100, Math.round(data.clouds.all * 0.7)) : 10;
          
          return res.json({
            success: true,
            source: "OpenWeatherMap Live API",
            data: {
              city: `${data.name} (${data.sys?.country || 'KR'})`,
              temp: curTemp,
              feelsLike: Math.round(data.main?.feels_like ?? 18),
              tempMin: Math.round(data.main?.temp_min ?? (curTemp - 4)),
              tempMax: Math.round(data.main?.temp_max ?? (curTemp + 4)),
              condition: weatherCondition,
              description: weatherDesc,
              humidity: curHumidity,
              windSpeed: curWind,
              precipitationProb: curPrecip,
              uvIndex: 4,
              isManual: false,
              updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              hourlyForecast: generate3HourForecast(curTemp, weatherCondition, curHumidity, curWind, curPrecip),
            }
          });
        }
      } catch (apiErr) {
        console.warn("OpenWeatherMap fetch failed, falling back to realistic city weather:", apiErr);
      }
    }

    // Realistic weather fallback based on city and current season
    const month = new Date().getMonth() + 1;
    let baseTemp = 18;
    let baseCondition: string = 'Clear';
    let baseDesc = '선선하고 맑은 날씨';

    if (month >= 12 || month <= 2) {
      baseTemp = -1;
      baseCondition = 'Clouds';
      baseDesc = '쌀쌀한 겨울 바람';
    } else if (month >= 3 && month <= 5) {
      baseTemp = 16;
      baseCondition = 'Clear';
      baseDesc = '따스한 봄 햇살';
    } else if (month >= 6 && month <= 8) {
      baseTemp = 28;
      baseCondition = 'Clouds';
      baseDesc = '무더운 여름 기온';
    } else {
      baseTemp = 17;
      baseCondition = 'Clear';
      baseDesc = '청명하고 쾌적한 가을 날씨';
    }

    const fallbackHumidity = 52;
    const fallbackWind = 2.8;
    const fallbackPrecip = 15;

    return res.json({
      success: true,
      source: "Simulated Weather (API 키 미입력 또는 대체 모드)",
      data: {
        city: `${city} (기준)`,
        temp: baseTemp,
        feelsLike: baseTemp - 1,
        tempMin: baseTemp - 4,
        tempMax: baseTemp + 4,
        condition: baseCondition,
        description: baseDesc,
        humidity: fallbackHumidity,
        windSpeed: fallbackWind,
        precipitationProb: fallbackPrecip,
        uvIndex: 4,
        isManual: false,
        updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        hourlyForecast: generate3HourForecast(baseTemp, baseCondition, fallbackHumidity, fallbackWind, fallbackPrecip),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch weather" });
  }
});
