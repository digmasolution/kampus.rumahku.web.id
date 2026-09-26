const fs = require('fs');

function fixFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Fix width: \`\${progress}%\` -> `${progress}%`
    content = content.replace(/\\`\\\$\\{/g, '`\${');
    content = content.replace(/\\`\\$\\{/g, '`\${');
    content = content.replace(/\\`\$\\{/g, '`\${');
    content = content.replace(/\\\`\$\\{/g, '`\${');
    
    content = content.replace(/\\}\\`/g, '}`');
    content = content.replace(/\\}/g, '}');
    content = content.replace(/\\\`/g, '`');
    content = content.replace(/\\`/g, '`');
    
    fs.writeFileSync(filepath, content);
}

fixFile('apps/web/src/pages/WizardMockup.tsx');
fixFile('apps/web/src/pages/DashboardMockup.tsx');

console.log("Fixed!");
