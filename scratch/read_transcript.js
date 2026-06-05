const fs = require('fs');
const readline = require('readline');

const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\c6b5a0b0-1ac2-4905-8f47-b90880976d19\\.system_generated\\logs\\transcript.jsonl';

async function findSubagentCalls() {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes('browser_subagent') || line.includes('report') || line.includes('error') || line.includes('Error')) {
            try {
                const obj = JSON.parse(line);
                console.log('Step:', obj.step_index, 'Type:', obj.type, 'Status:', obj.status);
                if (obj.content) console.log('Content:', obj.content.substring(0, 500));
                if (obj.tool_calls) console.log('Tool calls:', JSON.stringify(obj.tool_calls).substring(0, 500));
            } catch (e) {
                console.log('Plain line containing match:', line.substring(0, 300));
            }
            console.log('---');
        }
    }
}

findSubagentCalls();
