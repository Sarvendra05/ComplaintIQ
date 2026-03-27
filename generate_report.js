const fs = require('fs');
const path = require('path');

const projectRoot = "c:\\Users\\le\\web dev\\complaint-system";
const outputFile = path.join("c:\\Users\\le\\web dev", "complaint-system-report.txt");

const ignoreDirs = ['node_modules', '.git'];
const ignoreFiles = ['package-lock.json', '.env'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (ignoreDirs.includes(file) || ignoreFiles.includes(file)) return;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!ignoreDirs.includes(path.basename(fullPath))) {
                results = results.concat(walk(fullPath));
            }
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walk(projectRoot);
let outputContent = "# Project Code Report\n\n";

allFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.zip', '.pdf'].includes(ext)) return;
    
    const relativePath = path.relative(projectRoot, file);
    try {
        const content = fs.readFileSync(file, 'utf-8');
        outputContent += `\n## File: \`${relativePath}\`\n\`\`\`${ext.replace('.', '')}\n`;
        outputContent += content;
        outputContent += `\n\`\`\`\n`;
    } catch (e) {
        console.error(`Could not read file ${relativePath}: ${e.message}`);
    }
});

fs.writeFileSync(outputFile, outputContent);
console.log("Text report generated at: " + outputFile);
