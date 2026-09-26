const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// Clean up the docx xml to fix docxtemplater duplicate tag errors
function fixDocxTags(inputPath, outputPath) {
    const content = fs.readFileSync(inputPath, 'binary');
    const zip = new PizZip(content);
    let xml = zip.file("word/document.xml").asText();
    
    // Naively remove all XML tags inside a {{ }} block.
    // This is a known workaround for MS Word splitting tags.
    // However, docxtemplater usually handles this if not corrupted.
    // Since it's duplicate open/close tags like {{ {{ or }} }}, 
    // it's likely python-docx injected it multiple times in different runs or paragraphs.
    
    // We will just do a regex replace to clean it up for testing.
    xml = xml.replace(/\{\{(.*?)\}\}/g, (match) => {
        // remove all XML tags inside the curly braces
        return "{{" + match.slice(2, -2).replace(/<[^>]+>/g, '') + "}}";
    });
    
    // Also, python-docx may have resulted in text like: {{KOOR<w:t>LIAH}}
    // Let's just fix the specific duplicate tag issue by stripping extra braces
    xml = xml.replace(/\{\{\{\{/g, "{{").replace(/\}\}\}\}/g, "}}");

    zip.file("word/document.xml", xml);
    const buf = zip.generate({ type: 'nodebuffer', compression: "DEFLATE" });
    fs.writeFileSync(outputPath, buf);
}

fixDocxTags(
    path.resolve(__dirname, '../../templates/processed/rps-template-processed.docx'),
    path.resolve(__dirname, '../../templates/processed/rps-template-processed-clean.docx')
);

console.log("Cleaned.");
