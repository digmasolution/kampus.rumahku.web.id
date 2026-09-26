const fs = require('fs');
let c = fs.readFileSync('apps/web/src/pages/TemplateSettingsMockup.tsx', 'utf8');

const injection = `export default function TemplateSettingsMockup() {
  const [isUploading, setIsUploading] = React.useState(false);
  const handleFileUpload = async (event: any) => { 
    const file = event.target.files?.[0]; 
    if (!file) return; 
    if (!file.name.endsWith('.docx')) { 
      alert("Hanya file .docx yang didukung."); 
      return; 
    } 
    setIsUploading(true); 
    const formData = new FormData(); 
    formData.append('template', file); 
    try { 
      const res = await fetch('http://localhost:3000/api/templates/upload', { method: 'POST', body: formData }); 
      if (!res.ok) throw new Error("Gagal"); 
      alert("Template berhasil diperbarui! Semua RPS akan menggunakan template ini."); 
    } catch (err) { 
      alert("Gagal mengunggah"); 
    } finally { 
      setIsUploading(false); 
    } 
  };
`;

c = c.replace(/export default function TemplateSettingsMockup\(\) \{/, injection);
c = c.replace(/<input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" \/>/, '<input type="file" accept=".docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isUploading} />');
c = c.replace(/Klik untuk memilih file DOCX/, '{isUploading ? "Mengunggah..." : "Klik untuk memilih file DOCX"}');

fs.writeFileSync('apps/web/src/pages/TemplateSettingsMockup.tsx', c);
