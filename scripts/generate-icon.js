import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';

/**
 * Layer 1.png 이미지를 프로젝트 로고 에셋에 반영하고
 * Windows 실행 파일용 표준 .ico 파일을 생성하는 스크립트
 */
async function generateIcons() {
  const rootDir = process.cwd();
  const candidatePngs = [
    path.join(rootDir, 'smart-wardrobe-logo', 'logo.png'),
    path.join(rootDir, 'Layer 1.png'),
    path.join(rootDir, 'assets', 'logo.png'),
    path.join(rootDir, 'src', 'assets', 'logo.png'),
  ];

  let sourcePng = candidatePngs.find(p => fs.existsSync(p));
  const icoPath = path.join(rootDir, 'assets', 'app.ico');

  if (!sourcePng) {
    if (fs.existsSync(icoPath)) {
      console.log('✓ 기존 app.ico 파일이 이미 존재하므로 아이콘 생성을 스킵합니다.');
      return;
    }
    console.warn('⚠️ 아이콘 소스 PNG 파일을 찾을 수 없어 아이콘 생성을 스킵합니다.');
    return;
  }

  console.log(`[아이콘 생성] 소스 이미지(${path.basename(sourcePng)})를 읽는 중...`);


  // 1. 웹 에셋에 로고 이미지 복사
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const destLogo1 = path.join(rootDir, 'src', 'assets', 'logo.png');
  const destLogo2 = path.join(rootDir, 'assets', 'logo.png');
  const destLogo3 = path.join(publicDir, 'logo.png');

  fs.copyFileSync(sourcePng, destLogo1);
  fs.copyFileSync(sourcePng, destLogo2);
  fs.copyFileSync(sourcePng, destLogo3);
  console.log('✓ 웹 UI 로고 업데이트 완료: src/assets/logo.png, assets/logo.png, public/logo.png');

  // 2. Windows 실행 파일용 .ico 파일 생성
  console.log('[아이콘 생성] Windows 규격 .ico 변환 중...');
  try {
    const icoBuffer = await pngToIco(sourcePng);
    const icoPath1 = path.join(rootDir, 'assets', 'app.ico');
    const icoPath2 = path.join(rootDir, 'src', 'assets', 'app.ico');
    const icoPath3 = path.join(publicDir, 'favicon.ico');

    fs.writeFileSync(icoPath1, icoBuffer);
    fs.writeFileSync(icoPath2, icoBuffer);
    fs.writeFileSync(icoPath3, icoBuffer);
    console.log(`✓ Windows 아이콘(.ico) 생성 완료 (${icoBuffer.length} bytes): assets/app.ico, public/favicon.ico`);
  } catch (error) {
    console.error('오류: .ico 변환 실패:', error);
    process.exit(1);
  }
}

generateIcons();
