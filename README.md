<div align="center">

# 👗 AI OOTD Stylist

**Gemini AI 기반 스마트 옷장 분석 & 실시간 날씨/TPO 맞춤 코디네이터**

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Google%20Gemini-3.x-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License" />
</p>

<p align="center">
  내가 가진 옷장 사진을 한 장 올리면 AI가 카테고리와 스타일을 자동 분류하고,<br />
  실시간 날씨와 오늘 갈 장소(TPO), 나의 퍼스널 컬러에 맞춰 최적의 OOTD 코디를 제안합니다.
</p>

</div>

---

## ✨ 주요 기능 (Key Features)

- 📸 **AI 멀티모달 스마트 옷장 분석 (Smart Wardrobe Manager)**
  - 옷 사진을 업로드하면 **Google Gemini 3 멀티모달 비전 엔진**이 상의/하의/아우터/신발 등 카테고리, 계절감, 세부 컬러, 스타일 태그를 자동으로 정밀 분석 및 라벨링합니다.
- ⛅ **실시간 날씨 & TPO 맞춤 코디 엔진 (Weather & TPO Coordinator)**
  - **OpenWeatherMap API**를 통해 현재 기온, 습도, 체감 온도, 강수 확률을 실시간 수집합니다.
  - 출근, 데이트, 운동, 결혼식, 캐주얼 등 사용자가 선택한 **TPO(시간·장소·상황)** 와 날씨를 종합하여 최상의 착장 조합(A/B 듀얼 플랜)을 추천합니다.
- 🎨 **퍼스널 컬러 & 체형 맞춤 컨설팅 (Personal Profile)**
  - 사용자 프로필(웜톤/쿨톤, 체형, 선호 스타일)을 반영하여 체형 결점 보완 및 톤온톤 배색 팁을 제공합니다.
- 📖 **코디 룩북 & 히스토리 (Lookbook & Archive)**
  - 착용 기록 타임라인 및 마음에 드는 코디 찜하기(위시리스트) 기능을 제공합니다.
- 🛡️ **이중화 지능형 Fallback 시스템**
  - 외부 API 키가 없거나 네트워크 연결이 불안정할 때도 중단 없이 사용할 수 있는 **자체 스마트 룰베이스 코디 엔진**이 내장되어 있습니다.
- 🖥️ **Windows 단일 실행 파일(`.exe`) 지원**
  - Node.js나 브라우저 설치 없이 클릭 한 번으로 실행 가능한 독립형 데스크톱 패키징(`pkg` + `resedit`) 환경을 제공합니다.
  - 모든 의류 데이터 및 이미지는 사용자 PC의 **로컬 파일 시스템에 안전하게 보관**되어 완벽한 개인정보 보호를 실현합니다.

---

## 🎨 디자인 시스템: 스카이 미스트 (Sky Mist Palette)

날씨와 일상 코디 추천 서비스의 정체성을 담아 **하늘과 구름을 모티브로 한 파스텔 톤**의 정제된 UI를 제공합니다.

| UI 컴포넌트 | 라이트 모드 (Light) | 다크 모드 (Dark) | 설명 |
|---|---|---|---|
| **배경 (Page Background)** | `#EAF1FB` | `#141B24` | 눈의 피로를 덜어주는 베이스 컬러 |
| **카드 (Card / Panel)** | `#FFFFFF` | `#202B38` | 컨텐츠 구분을 위한 기본 컨테이너 |
| **사이드바 (Sidebar)** | `#C9DDF5` | `#2E3D50` | 일관된 브랜드 아이덴티티 전달 |
| **선택 강조 (Active / Selected)** | `#7FA8DC` | `#7FA8DC` | TPO 칩 및 활성 메뉴 강조 |
| **CTA 핵심 버튼 (Primary Button)**| `#B7C9E6` | `#B7C9E6` | "최적 맞춤 코디 생성하기" 단일 액션 버튼 |

---

## 🏗️ 시스템 아키텍처 (Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite SPA                  │
│       (스카이 미스트 UI, TailwindCSS, Lucide Icons)       │
└───────────────────────────▲────────────────────────────┘
                            │ (Local API / Vite Proxy)
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│  - /api/gemini  : Gemini 3 비전 분석 & 맞춤 코디 추론   │
│  - /api/weather : OpenWeatherMap 날씨 데이터 조회      │
│  - /api/data    : 로컬 파일 시스템 영구 저장소 동기화    │
│  - Fallback     : 자체 룰베이스 알고리즘 무중단 추천   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 시작하기 (Getting Started)

### 사전 요구 사항
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- npm (Node.js 설치 시 기본 포함)

### 1. 프로젝트 복제 및 의존성 설치
```bash
git clone https://github.com/your-username/AI-OOTD-Stylist.git
cd AI-OOTD-Stylist
npm install
```

### 2. 환경 변수 설정
프로젝트 루트 경로에 `.env` 파일을 생성하고 발급받은 API 키를 입력합니다:
```env
# Google Gemini API Key (선택 권장: 미설정 시 내장 룰베이스 엔진 가동)
# https://aistudio.google.com/ 에서 발급 가능
GEMINI_API_KEY="your_gemini_api_key_here"

# OpenWeatherMap API Key (선택, 실시간 날씨용: 미설정 시 수동 기상 제어)
# https://openweathermap.org/ 에서 발급 가능
OPENWEATHER_API_KEY="your_openweather_api_key_here"
```
> 💡 *참고: 웹 UI 내부의 [환경 설정] 메뉴에서도 API 키를 직접 등록하거나 언제든 변경할 수 있습니다.*

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 프로그램을 확인합니다.

---

## 📦 프로덕션 빌드 및 단일 실행 파일(.exe) 패키징

### 웹 클라이언트 및 로컬 서버 빌드
```bash
npm run build
```

### 단일 Windows 실행 파일(`AI_OOTD_Stylist.exe`) 생성
```bash
npm run package
```
- 빌드가 완료되면 `dist/AI_OOTD_Stylist.exe` 파일이 생성됩니다.
- 생성된 `.exe` 파일을 더블 클릭하면 백엔드 서버가 시작되고 기본 웹 브라우저가 자동으로 열립니다.

---

## 📁 디렉토리 구조 (Directory Structure)

```text
AI OOTD Stylist/
├── assets/                          # 앱 아이콘(.ico) 및 로고 리소스
├── public/                          # 웹 파비콘 및 정적 에셋
├── scripts/                         # .exe 패키징 및 resedit 아이콘 자동화 스크립트
├── src/
│   ├── components/                  # 모듈형 UI 컴포넌트 11종
│   │   ├── ModernSidebar.tsx        # 내비게이션 사이드바 (날씨 위젯/프로필 칩)
│   │   ├── ModernTopBar.tsx         # 상단 헤더 프레임
│   │   ├── WeatherTPOSelector.tsx   # [Tab 1] 날씨 및 TPO 조건 선택
│   │   ├── OutfitRecommendationView.tsx # [Tab 2] AI 최적 코디 추천 (A/B 플랜)
│   │   ├── WardrobeManager.tsx      # [Tab 3] 스마트 옷장 관리 & Gemini 비전
│   │   ├── WardrobeItemCard.tsx     # 개별 의류 카드
│   │   ├── WardrobeList.tsx         # 의류 그리드 레이아웃
│   │   ├── OutfitHistoryAndWishlist.tsx # [Tab 4] 코디 룩북 & 히스토리
│   │   ├── ProfileView.tsx          # [Tab 5] 체형 및 퍼스널 컬러 프로필
│   │   ├── SettingsView.tsx         # [Tab 6] 시스템 환경 설정 & 백업
│   │   └── ErrorBoundary.tsx        # 비정상 종료 방지 컴포넌트
│   ├── App.tsx                      # 메인 앱 컨테이너 & 상태 라우팅
│   ├── helpers.tsx                  # 로컬 스토리지 동기화 및 룰베이스 알고리즘
│   ├── types.ts                     # 전체 데이터 타입 선언
│   ├── index.css                    # 스카이 미스트 컬러 테마 및 전역 스타일
│   └── main.tsx                     # React 엔트리 포인트
├── server.ts                        # Express 로컬 API 프록시 서버
├── package.json
└── vite.config.ts
```

---

## 📄 라이선스 (License)

본 프로젝트는 [MIT License](./LICENSE)를 따릅니다.
Copyright (c) 2026 Shin Jae Wan (AI OOTD Stylist). All rights reserved.
