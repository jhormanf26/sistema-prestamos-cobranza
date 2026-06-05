const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');

const startIdx = html.indexOf('id="tab-marketing"');
if (startIdx !== -1) {
    let openDivs = 0;
    let endIdx = -1;
    const divStart = html.lastIndexOf('<div', startIdx);
    console.log('Div starts at:', divStart);
    
    for (let i = divStart; i < html.length; i++) {
        if (html.substring(i, i + 4) === '<div') {
            openDivs++;
        } else if (html.substring(i, i + 5) === '</div') {
            openDivs--;
            if (openDivs === 0) {
                endIdx = i + 6;
                break;
            }
        }
    }
    
    if (endIdx !== -1) {
        const block = html.substring(divStart, endIdx);
        console.log('Block length:', block.length);
        console.log('Block ends with:', block.substring(block.length - 200));
        fs.writeFileSync(path.join(__dirname, 'tab_marketing_block.html'), block);
    } else {
        console.log('Could not find matching closing div tag!');
    }
} else {
    console.log('Could not find id="tab-marketing"');
}
