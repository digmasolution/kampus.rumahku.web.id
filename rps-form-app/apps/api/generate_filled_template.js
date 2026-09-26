const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../../templates/processed/rps-template-processed.docx');
const outDir = path.resolve(__dirname, '../../templates/preview');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}
const outputPath = path.resolve(outDir, 'rps-template-filled.docx');

if (!fs.existsSync(inputPath)) {
    console.error("Processed template not found at", inputPath);
    process.exit(1);
}

const content = fs.readFileSync(inputPath, 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

const templateData = {
    INSTITUSI: 'UNIVERSITAS CONTOH',
    PROGRAM_STUDI: 'TEKNIK INFORMATIKA',
    NAMA_MATA_KULIAH: 'PEMROGRAMAN WEB',
    KODE_MATA_KULIAH: 'TIF123',
    SKS_T: '2',
    SKS_P: '1',
    SKS: '3',
    TANGGAL_PENYUSUNAN: '15 April 2026',
    DOSEN_PENGEMBANG: 'Dr. Budi Santoso',
    KOORDINATOR_MATA_KULIAH: 'Prof. Siti Aminah'
};

doc.render(templateData);

const buf = doc.getZip().generate({ type: 'nodebuffer', compression: "DEFLATE" });
fs.writeFileSync(outputPath, buf);

console.log("Filled template generated.");
