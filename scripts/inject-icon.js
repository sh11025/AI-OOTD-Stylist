import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { rcedit } = require('rcedit');

/**
 * rcedit을 사용하여 Windows 실행 파일(.exe)의 PE 오버레이(pkg VFS 페이로드)를 손상시키지 않고
 * 아이콘과 메타데이터를 정밀하게 주입하는 스크립트
 */
async function injectIcon() {
  const rootDir = process.cwd();
  const exePath = path.join(rootDir, 'dist', 'AI_OOTD_Stylist.exe');
  const icoPath = path.join(rootDir, 'assets', 'app.ico');

  if (!fs.existsSync(exePath)) {
    console.error(`오류: 대상 실행 파일이 없습니다: ${exePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(icoPath)) {
    console.error(`오류: 아이콘 파일이 없습니다: ${icoPath}`);
    process.exit(1);
  }

  console.log(`[아이콘 주입] 대상 실행 파일: ${exePath}`);
  console.log(`[아이콘 주입] 소스 아이콘: ${icoPath}`);

  try {
    await rcedit(exePath, {
      icon: icoPath,
      'file-version': '1.0.0.0',
      'product-version': '1.0.0',
      'version-string': {
        FileDescription: 'AI OOTD Stylist - 스마트 옷장 & AI 코디 추천 프로그램',
        ProductName: 'AI OOTD Stylist',
        CompanyName: 'AI OOTD Studio',
        LegalCopyright: 'Copyright © 2026 AI OOTD Studio',
        OriginalFilename: 'AI_OOTD_Stylist.exe',
      },
    });

    console.log('✓ 성공: rcedit을 통한 AI_OOTD_Stylist.exe 아이콘 및 메타데이터 주입 완료!');
  } catch (err) {
    console.error('오류: 아이콘 주입 실패:', err);
    process.exit(1);
  }
}

injectIcon();
