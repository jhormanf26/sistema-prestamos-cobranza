const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const instance = axios.create({
            baseURL: 'http://localhost:3000',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const loginRes = await instance.post('/auth/login', 'email=admin%40sistema.com&password=123456', {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });

        const cookie = loginRes.headers['set-cookie'];
        const dashRes = await instance.get('/', {
            headers: {
                Cookie: cookie ? cookie[0] : ''
            }
        });

        fs.writeFileSync(path.join(__dirname, 'dashboard.html'), dashRes.data);
        console.log('Saved dashboard.html, length:', dashRes.data.length);
        
        // Let's check the end of the HTML
        console.log('End of HTML:\n', dashRes.data.slice(-1000));
    } catch (e) {
        console.error('Error:', e);
    }
}
run();
