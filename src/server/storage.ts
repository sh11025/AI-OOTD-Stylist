import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

// Local Data Storage paths (단일 실행 파일인 경우 실행 파일이 위치한 폴더 기준)
export const APP_DIR = (process as any).pkg
  ? path.dirname(process.execPath)
  : process.cwd();

export const DATA_DIR = path.join(APP_DIR, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 안전한 파일 스토리지 키 및 경로 검증 (Path Traversal 방어)
export const ALLOWED_STORAGE_KEYS = new Set(["wardrobe", "profile", "weather", "history"]);

export function getSafeFilePath(key: string): string | null {
  if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
    return null;
  }
  const safeFilename = `${path.basename(key)}.json`;
  const resolvedPath = path.resolve(DATA_DIR, safeFilename);
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    return null;
  }
  return resolvedPath;
}

// 원자적(Atomic) 파일 쓰기: 임시 파일 작성 후 교체하여 프로세스 강제 종료 시 파일 파손 방지
export function atomicWriteJsonFile(targetPath: string, data: any): void {
  const tempPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, targetPath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // 임시 파일 삭제 실패 무시
      }
    }
    throw err;
  }
}

export const storageRouter = Router();

// Load all settings/wardrobe data
storageRouter.get("/load", (_req: Request, res: Response) => {
  try {
    const keys = Array.from(ALLOWED_STORAGE_KEYS);
    const result: Record<string, any> = {};

    for (const key of keys) {
      const filePath = getSafeFilePath(key);
      if (filePath && fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          result[key] = JSON.parse(raw);
        } catch (e) {
          console.error(`Failed to read data file ${key}.json:`, e);
          result[key] = null;
        }
      } else {
        result[key] = null;
      }
    }
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Save specific key's data with path traversal defense and atomic write
storageRouter.post("/save", (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || typeof key !== "string" || value === undefined) {
      return res.status(400).json({ success: false, error: "Invalid key or value" });
    }

    const filePath = getSafeFilePath(key);
    if (!filePath) {
      return res.status(400).json({ success: false, error: "Unauthorized or invalid storage key" });
    }

    atomicWriteJsonFile(filePath, value);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Data save error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
