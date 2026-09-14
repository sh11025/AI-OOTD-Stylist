import fs from 'fs';
import path from 'path';
import os from 'os';
import * as ResEdit from 'resedit';

/**
 * pkg 캐시 폴더의 베이스 Node.js 바이너리에 Windows 아이콘 및 메타데이터를 주입하는 스크립트
 * 이렇게 하면 pkg가 패키징할 때 아이콘이 기본 적용된 채로 번들을 안전하게 패키징합니다.
 */
async function patchPkgBase() {
  const rootDir = process.cwd();
  const icoPath = path.join(rootDir, 'assets', 'app.ico');

  // pkg 캐시 위치 탐색
  const cacheDir = path.join(os.homedir(), '.pkg-cache');
  if (!fs.existsSync(cacheDir)) {
    console.error('오류: .pkg-cache 폴더를 찾을 수 없습니다.');
    process.exit(1);
  }

  // win-x64 타깃 바이너리 찾기 (built- 바이너리 우선 생성 및 패치)
  let builtBinary = null;
  let fetchedBinary = null;
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchDir(full);
      } else if (f.startsWith('built-') && f.includes('win-x64')) {
        builtBinary = full;
      } else if (f.startsWith('fetched-') && f.includes('win-x64') && !f.endsWith('.bak')) {
        fetchedBinary = full;
      }
    }
  }
  searchDir(cacheDir);

  if (!builtBinary && fetchedBinary) {
    builtBinary = path.join(path.dirname(fetchedBinary), path.basename(fetchedBinary).replace('fetched-', 'built-'));
    fs.copyFileSync(fetchedBinary, builtBinary);
  }

  const targetBinary = builtBinary;
  if (!targetBinary) {
    console.error('오류: win-x64 pkg 캐시 바이너리를 찾을 수 없습니다.');
    process.exit(1);
  }

  console.log(`[pkg 베이스 패치] 대상 로컬 바이너리: ${targetBinary}`);

  const data = fs.readFileSync(targetBinary);
  const exe = ResEdit.NtExecutable.from(data);
  const res = ResEdit.NtExecutableResource.from(exe);

  const icoData = fs.readFileSync(icoPath);
  const iconFile = ResEdit.Data.IconFile.from(icoData);

  // 아이콘 주입
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    1033,
    iconFile.icons.map((item) => item.data)
  );

  // 메타데이터 주입
  const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  let vi = viList.length > 0 ? viList[0] : ResEdit.Resource.VersionInfo.createEmpty();

  vi.setStringValues(
    { lang: 1042, codepage: 1200 }, // 한국어
    {
      FileDescription: 'AI OOTD Stylist - 스마트 옷장 & AI 코디 추천 프로그램',
      ProductName: 'AI OOTD Stylist',
      CompanyName: 'AI OOTD Studio',
      LegalCopyright: 'Copyright © 2026 AI OOTD Studio',
      FileVersion: '1.0.0.0',
      ProductVersion: '1.0.0',
      OriginalFilename: 'AI_OOTD_Stylist.exe',
    }
  );
  vi.setStringValues(
    { lang: 1033, codepage: 1200 }, // 영어
    {
      FileDescription: 'AI OOTD Stylist - Smart Wardrobe & AI Outfit Recommendation',
      ProductName: 'AI OOTD Stylist',
      CompanyName: 'AI OOTD Studio',
      LegalCopyright: 'Copyright © 2026 AI OOTD Studio',
      FileVersion: '1.0.0.0',
      ProductVersion: '1.0.0',
      OriginalFilename: 'AI_OOTD_Stylist.exe',
    }
  );
  vi.outputToResourceEntries(res.entries);

  res.outputResource(exe);

  // 핵심: 서브시스템을 콘솔(3: CUI)에서 윈도우 GUI(2: GUI)로 변경하여 검은색 CMD 창 완전 제거
  exe.newHeader.optionalHeader.subsystem = 2;

  const newBinary = exe.generate();
  fs.writeFileSync(targetBinary, Buffer.from(newBinary));

  console.log('✓ 성공: pkg 베이스 바이너리에 아이콘, 메타데이터 주입 및 GUI 서브시스템(CMD 창 제거) 적용 완료!');
}


patchPkgBase();
