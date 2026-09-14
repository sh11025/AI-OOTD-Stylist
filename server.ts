import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

import { storageRouter, DATA_DIR, APP_DIR } from "./src/server/storage";
import { weatherRouter } from "./src/server/weather";
import { geminiRouter } from "./src/server/gemini";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 1. Health check & System Control
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/system/exit", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Server shutting down..." });
  setTimeout(() => {
    process.exit(0);
  }, 300);
});

// 2. Modular API Routers
app.use("/api/data", storageRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/gemini", geminiRouter);

// 3. Server Startup & Static Serving (Vite / Single Exe)
async function startServer() {
  const isPkg = Boolean((process as any).pkg);

  if (process.env.NODE_ENV !== "production" && !isPkg) {

    // 개발 모드: Vite 개발 미들웨어 사용 (pkg 번들링 시 vite 패키지 정적 추적 방지)
    try {
      const viteModuleName = "vite";
      const viteModule = await import(viteModuleName);
      const vite = await viteModule.createServer({
        configFile: path.resolve(process.cwd(), "vite.config.ts"),
        server: { 
          middlewareMode: true,
          watch: {
            ignored: ['**/data/**', '**/*.json', '**/data/*']
          }
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite dev server 로드 실패, 정적 파일 모드로 대체합니다.", e);
    }
  } else {
    // 프로덕션 / 단일 .EXE 모드: 내장 또는 인접 정적 파일 서빙
    const candidateDirs = [
      path.join(__dirname, "client"),
      path.join(__dirname, "dist", "client"),
      path.join(__dirname, "..", "dist", "client"),
      path.join(__dirname, "..", "client"),
      path.join(APP_DIR, "client"),
      path.join(APP_DIR, "dist", "client"),
      path.join(APP_DIR, "dist"),
      path.join(process.cwd(), "dist", "client"),
      path.join(process.cwd(), "dist"),
    ];

    let staticDir = candidateDirs.find((dir) => fs.existsSync(path.join(dir, "index.html")));
    if (!staticDir) {
      staticDir = path.join(APP_DIR, "dist");
    }

    console.log(`[정적 에셋 서빙 경로] ${staticDir}`);
    app.use(express.static(staticDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir!, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`====================================================`);
    console.log(` ✨ AI OOTD Stylist 프로그램이 준비되었습니다!`);
    console.log(` 🌐 접속 주소: ${url}`);
    console.log(` 💾 로컬 데이터 저장소: ${DATA_DIR}`);
    console.log(`====================================================`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`포트 ${PORT}이(가) 이미 사용 중입니다. 기존 프로그램을 종료한 뒤 다시 실행해주세요.`);
    } else {
      console.error("서버 시작 실패:", err);
    }
  });
}

startServer();
