const fs = require('fs');
const readline = require('readline');

const filePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\c6b5a0b0-1ac2-4905-8f47-b90880976d19\\.system_generated\\logs\\transcript.jsonl';

async function printStep49() {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.step_index === 49) {
                console.log(obj.content);
                break;
            }
        } catch (e) {
        }
    }
}

printStep49();
