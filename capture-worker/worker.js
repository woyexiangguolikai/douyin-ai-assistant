const { chromium } = require('playwright');
const fetch = require('node-fetch'); // npm install node-fetch@2

const PHP_API = process.env.PHP_API_URL || 'http://localhost:8080/api';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const ROOM_ID = process.env.ROOM_ID || '';

let browser, page;

async function postToPhp(endpoint, data) {
    try {
        await fetch(PHP_API + '/' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, room_id: ROOM_ID }),
        });
    } catch (e) { console.error('[HTTP]', e.message); }
}

async function callAI(danmaku) {
    if (!DEEPSEEK_KEY) return;
    try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + DEEPSEEK_KEY,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '?????????????????????????????????50????' },
                    { role: 'user', content: '???' + danmaku.content + '\n?????' + danmaku.username }
                ],
                temperature: 0.8,
                max_tokens: 200,
            }),
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '';
        if (reply) {
            await postToPhp('ai-reply', {
                id: Date.now().toString(),
                danmaku_id: danmaku.id,
                text: reply,
            });
        }
    } catch (e) { console.error('[AI]', e.message); }
}

async function capture() {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // ????????????
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('danmaku') || url.includes('live')) {
            try {
                const body = await response.json();
                // ???????? - ??????????
                if (body?.data?.content) {
                    const danmaku = {
                        id: Date.now().toString(),
                        content: body.data.content,
                        username: body.data.user?.nickname || 'anonymous',
                        type: 'normal',
                    };
                    await postToPhp('danmaku/receive', { ...danmaku, filtered: 0 });
                    await callAI(danmaku);
                }
            } catch (e) { /* ignore non-JSON */ }
        }
    });

    // ???????? room_id
    const url = 'https://live.douyin.com/' + ROOM_ID;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('[Capture] Connected to', url);

    // ????
    setInterval(async () => {
        await postToPhp('danmaku/heartbeat', { status: 'online' });
    }, 60000);
}

capture().catch(e => {
    console.error('[Capture] Fatal:', e.message);
    process.exit(1);
});

process.on('SIGINT', async () => {
    await browser?.close();
    process.exit(0);
});
