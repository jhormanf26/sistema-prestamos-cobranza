const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');

console.log('Has chartScroll canvas:', html.includes('id="chartScroll"'));
console.log('Has chartAnalytics canvas:', html.includes('id="chartAnalytics"'));
console.log('Has chartEstados canvas:', html.includes('id="chartEstados"'));

// Let's print the HTML block containing tab-marketing
const start = html.indexOf('id="tab-marketing"');
if (start !== -1) {
    console.log('tab-marketing content block:');
    console.log(html.substring(start, start + 3000));
}
