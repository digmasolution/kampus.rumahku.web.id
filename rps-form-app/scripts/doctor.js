const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('===========================================');
console.log('🩺 RPS Form Builder - System Doctor');
console.log('===========================================\n');

let allPassed = true;

function check(name, cmd, successMsg, failMsg, fatal = true) {
  process.stdout.write(`Mengecek ${name}... `);
  try {
    const out = execSync(cmd, { stdio: 'pipe' }).toString().trim();
    console.log(`✅ OK (${successMsg ? successMsg(out) : out})`);
    return true;
  } catch (err) {
    console.log(`❌ GAGAL`);
    console.log(`   └─ ${failMsg}`);
    if (fatal) allPassed = false;
    return false;
  }
}

function checkDir(name, dirPath) {
  process.stdout.write(`Mengecek folder ${name}... `);
  try {
    fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    console.log(`✅ Akses baca/tulis OK`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Dibuat otomatis`);
        return true;
      } catch (e) {
        console.log(`❌ GAGAL (Tidak dapat membuat folder: ${e.message})`);
      }
    } else {
      console.log(`❌ GAGAL (Izin ditolak: ${err.message})`);
    }
    allPassed = false;
    return false;
  }
}

// 1. Node & NPM
check('Node.js', 'node -v', (v) => v, 'Silakan instal Node.js versi terbaru dari nodejs.org');
check('NPM', 'npm -v', (v) => v, 'NPM tidak terdeteksi. Silakan instal ulang Node.js');

// 2. LibreOffice
const platform = os.platform();
let sofficeCmd = 'soffice --version';
if (platform === 'win32') {
  // Try default path in Windows if soffice is not in PATH
  sofficeCmd = 'where soffice || "C:\\Program Files\\LibreOffice\\program\\soffice.exe" --version';
} else if (platform === 'darwin') {
  sofficeCmd = 'soffice --version || "/Applications/LibreOffice.app/Contents/MacOS/soffice" --version';
}

check('LibreOffice (PDF Export)', sofficeCmd, (v) => 'Terdeteksi', 
  `LibreOffice tidak ditemukan di sistem.
      Windows: Instal dari libreoffice.org.
      Mac: Instal LibreOffice dan drag ke folder Applications.
      Linux: Jalankan 'sudo apt install libreoffice-core'.`, 
  false
); // Not fatal for dev, but bad for PDF

// 3. Database
process.stdout.write(`Mengecek Database SQLite... `);
const dbPath = path.resolve(__dirname, '../prisma/dev.db');
if (fs.existsSync(dbPath)) {
  console.log('✅ OK (dev.db ditemukan)');
} else {
  console.log('❌ GAGAL');
  console.log('   └─ Jalankan perintah: npx prisma db push');
  allPassed = false;
}

// 4. Folders
checkDir('Storage (Uploads)', path.resolve(__dirname, '../storage/uploads'));
checkDir('Storage (Exports)', path.resolve(__dirname, '../storage/exports'));
checkDir('Storage (Drafts)', path.resolve(__dirname, '../storage/drafts'));
checkDir('Templates (Original)', path.resolve(__dirname, '../templates/original'));
checkDir('Templates (Processed)', path.resolve(__dirname, '../templates/processed'));

// 5. Port Checking
check('Ketersediaan Port 3000 (Backend)', platform === 'win32' ? 'netstat -ano | findstr :3000' : 'lsof -i:3000', 
  () => 'Port Sedang Digunakan (Pastikan itu adalah aplikasi ini)', 
  'Port tersedia (Bebas / Tidak error)', 
  false
);

console.log('\n===========================================');
if (allPassed) {
  console.log('🎉 SISTEM SIAP! Semua persyaratan utama terpenuhi.');
  console.log('   Gunakan "npm run dev" atau "npm run start" untuk mulai.');
} else {
  console.log('⚠️ TERDAPAT MASALAH! Harap perbaiki error (❌) di atas sebelum menjalankan aplikasi.');
}
console.log('===========================================\n');
