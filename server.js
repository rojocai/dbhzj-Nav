const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data.json');
const USER_FILE = path.join(__dirname, 'users.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const PORT = 38002;

// ===== 用户管理 =====
const SALT = 'nav_site_salt_2026';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function readUsers() {
    try {
        if (!fs.existsSync(USER_FILE)) {
            const defaultUsers = {
                users: [{ id: 1, username: 'admin', password: hashPassword('admin123'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
                tokens: {}
            };
            writeUsers(defaultUsers);
            return defaultUsers;
        }
        return JSON.parse(fs.readFileSync(USER_FILE, 'utf-8'));
    } catch (e) {
        return { users: [], tokens: {} };
    }
}

function writeUsers(data) {
    fs.writeFileSync(USER_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function verifyToken(token) {
    if (!token) return null;
    const users = readUsers();
    return users.tokens[token] || null;
}

// ===== 网站配置管理 =====
function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            const def = {
                site_title: '六零导航',
                site_subtitle: '上网从这里开始 · 收录精品网站',
                site_logo: '',
                logo_type: 'image',
                logo_layout: 'horizontal',
                logo_text: '',
                logo_text_font: '',
                logo_text_size: 48,
                logo_text_color: '#ffffff',
                logo_text_opacity: 1,
                logo_text_effect: 'none',
                logo_fit: 'contain',
                site_title_font: '',
                site_title_size: 36,
                site_title_color: '#ffffff',
                site_title_opacity: 1,
                site_title_effect: 'none',
                site_subtitle_font: '',
                site_subtitle_size: 18,
                site_subtitle_color: '#aaaaaa',
                site_subtitle_opacity: 1,
                site_subtitle_effect: 'none',
                site_footer_font: '',
                site_footer_size: 14,
                site_footer_color: '#888888',
                site_footer_opacity: 1,
                site_footer_effect: 'none',
                site_background: '',
                site_background_mobile: '',
                site_keywords: '导航,网址导航,六零导航,实用工具',
                site_description: '六零导航 - 上网从这里开始，收录精品网站',
                site_footer: '🧭 六零导航 · 上网从这里开始',
                site_icp: '',
                site_custom_css: '',
                site_custom_js: '',
                bg_type: 'gradient',  // gradient, image, color
                bg_color: '#0f0c29',
                bg_gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                card_opacity: 0.03,
                accent_color: '#667eea',
                visitor_enabled: true,
                backup_enabled: false,
                backup_period: 'daily',
                backup_retention: 3,
                backup_time: '03:00',
                backup_day: '1',
                last_backup: ''
            };
            writeConfig(def);
            return def;
        }
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {
        return {};
    }
}

function writeConfig(data) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ===== 导航数据管理 =====
function readData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
        return null;
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve(null); }
        });
    });
}

function sendJSON(res, code, data) {
    res.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
    const ext = path.extname(filePath);
    const mime = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2'
    };
    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': mime[ext] || 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': ext === '.html' && filePath.endsWith('index.html') ? 'public, max-age=600' : ext === '.html' ? 'no-cache' : 'max-age=86400'
        });
        res.end(content);
    } catch (e) {
        sendJSON(res, 404, { error: 'File not found' });
    }
}

function parseCookies(req) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = {};
    cookieHeader.split(';').forEach(c => {
        const parts = c.trim().split('=');
        if (parts.length >= 2) cookies[parts[0].trim()] = parts.slice(1).join('=');
    });
    return cookies;
}

function getTokenFromReq(req) {
    const cookies = parseCookies(req);
    const authHeader = req.headers.authorization;
    return cookies.nav_token || (authHeader && authHeader.replace('Bearer ', ''));
}

// ===== 访问统计 =====
const STATS_FILE = path.join(__dirname, 'stats.json');

function readStats() {
    try {
        if (!fs.existsSync(STATS_FILE)) {
            const def = { total_visits: 0, today_visits: 0, last_date: '', visitors: [] };
            writeStats(def);
            return def;
        }
        return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
    } catch { return { total_visits: 0, today_visits: 0, last_date: '', visitors: [] }; }
}

function writeStats(data) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function recordVisit(ip, ua) {
    const stats = readStats();
    const today = getToday();
    stats.total_visits++;
    if (stats.last_date !== today) {
        stats.today_visits = 1;
        stats.last_date = today;
    } else {
        stats.today_visits++;
    }
    // 记录最近30个访客
    stats.visitors.unshift({
        ip, ua: (ua || '').substring(0, 120),
        time: new Date().toISOString()
    });
    if (stats.visitors.length > 30) stats.visitors.length = 30;
    writeStats(stats);
}

// ===== IP地理位置查询（通过 ip-api.com，免费，无key）=====
const http2 = require('http');

function queryGeoIP(ip) {
    return new Promise((resolve) => {
        let done = false;
        const finish = (result) => { if (!done) { done = true; resolve(result); } };
        // 内网IP不查询
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.21.') || ip.startsWith('172.22.') || ip.startsWith('172.23.') || ip.startsWith('172.24.') || ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') || ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') || ip.startsWith('172.31.')) {
            finish({ country: '内网', region: '', city: '' });
            return;
        }
        // Cloudflare 代理IP不查询（实际访客IP未知）
        if (ip.startsWith('104.16.') || ip.startsWith('104.17.') || ip.startsWith('104.18.') || ip.startsWith('104.19.') || ip.startsWith('104.20.') || ip.startsWith('104.21.') || ip.startsWith('104.22.') || ip.startsWith('104.23.') || ip.startsWith('172.64.') || ip.startsWith('172.65.') || ip.startsWith('172.66.') || ip.startsWith('172.67.') || ip.startsWith('172.68.') || ip.startsWith('172.69.') || ip.startsWith('172.70.') || ip.startsWith('188.114.') || ip.startsWith('188.115.') || ip.startsWith('162.158.') || ip.startsWith('173.245.') || ip.startsWith('103.21.') || ip.startsWith('103.22.') || ip.startsWith('103.31.') || ip.startsWith('141.101.') || ip.startsWith('108.162.') || ip.startsWith('190.93.') || ip.startsWith('197.234.')) {
            finish({ country: 'Cloudflare', region: '', city: '' });
            return;
        }
        try {
            const req = http2.get(`http://ip-api.com/json/${ip}?lang=zh-CN`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('error', () => finish({ country: '未知', region: '', city: '' }));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.status === 'success') {
                            finish({ country: json.country, region: json.regionName, city: json.city, isp: json.isp || '', org: json.org || '', lat: json.lat, lon: json.lon });
                        } else {
                            finish({ country: '未知', region: '', city: '' });
                        }
                    } catch { finish({ country: '未知', region: '', city: '' }); }
                });
            });
            req.on('error', () => finish({ country: '未知', region: '', city: '' }));
            req.setTimeout(3000, () => { req.destroy(); finish({ country: '超时', region: '', city: '' }); });
            req.end();
        } catch { finish({ country: '未知', region: '', city: '' }); }
    });
}

function getClientIP(req) {
    const xForwarded = req.headers['x-forwarded-for'];
    if (xForwarded) return xForwarded.split(',')[0].trim();
    const xReal = req.headers['x-real-ip'];
    if (xReal) return xReal.trim();
    const ip = req.socket.remoteAddress || req.connection?.remoteAddress || '未知';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.substring(7);
    return ip;
}

// ===== 系统信息 =====
const os = require('os');

function getSystemInfo() {
    try {
        const cpus = os.cpus() || [];
        const totalMem = os.totalmem() || 0;
        const freeMem = os.freemem() || 0;
        const usedMem = totalMem - freeMem;
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            uptime: Math.floor(os.uptime()),
            cpu_model: cpus.length > 0 ? (cpus[0].model || '').trim() : '未知',
            cpu_cores: cpus.length,
            memory_total: (totalMem / 1024 / 1024 / 1024).toFixed(1) + 'GB',
            memory_used: (usedMem / 1024 / 1024 / 1024).toFixed(1) + 'GB',
            memory_free: (freeMem / 1024 / 1024 / 1024).toFixed(1) + 'GB',
            loadavg: (os.loadavg() || []).map(v => v.toFixed(2))
        };
    } catch { return { hostname: 'unknown', platform: 'linux', arch: 'x64', uptime: 0, cpu_model: '未知', cpu_cores: 0, memory_total: '0GB', memory_used: '0GB', memory_free: '0GB', loadavg: ['0'] }; }
}

// ===== 文件上传 =====
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) return reject('No boundary');

        let raw = Buffer.alloc(0);
        req.on('data', chunk => raw = Buffer.concat([raw, chunk]));
        req.on('end', () => {
            const parts = [];
            const bufStr = raw.toString('binary');
            const sep = '--' + boundary;
            const blocks = bufStr.split(sep).filter(b => b.includes('Content-Disposition'));

            blocks.forEach(block => {
                const headerEnd = block.indexOf('\r\n\r\n');
                if (headerEnd === -1) return;
                const headers = block.substring(0, headerEnd);
                const content = block.substring(headerEnd + 4);
                const nameMatch = headers.match(/name="([^"]+)"/);
                const filenameMatch = headers.match(/filename="([^"]+)"/);
                const name = nameMatch ? nameMatch[1] : '';
                const filename = filenameMatch ? filenameMatch[1] : '';

                if (filename) {
                    // 文件字段 - 去掉尾部的 \r\n--\r\n
                    let fileData = block.substring(headerEnd + 4);
                    fileData = fileData.replace(/\r\n--\r\n$/, '').replace(/\r\n--$/, '');
                    parts.push({ name, filename, data: Buffer.from(fileData, 'binary') });
                } else {
                    parts.push({ name, value: content.replace(/\r\n$/, '') });
                }
            });
            resolve(parts);
        });
    });
}

// ===== 上传文件保存 =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');

function ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

function saveUploadedFile(filename, buffer) {
    ensureUploadDir();
    const ext = path.extname(filename) || '.png';
    const safeName = Date.now() + ext;
    const filePath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filePath, buffer);
    return '/uploads/' + safeName;
}


// ===== 备份与还原 =====
const BACKUP_DIR = path.join(__dirname, 'backups');
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
function getBackupFiles() {
    ensureBackupDir();
    return fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-') && f.endsWith('.json')).sort().reverse();
}
function createBackupFile() {
    ensureBackupDir();
    const now = new Date();
    const ts = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');
    const filename = `backup-${ts}.json`;
    const fp = path.join(BACKUP_DIR, filename);
    const data = readData(); const config = readConfig(); const users = readUsers();
    const backup = { type:'full', version:'1.0.7', created_at: now.toISOString(), data, config, users_raw: users };
    fs.writeFileSync(fp, JSON.stringify(backup, null, 2), 'utf-8');
    return { filename, filepath: fp };
}
function cleanupOldBackups(retention) {
    const files = getBackupFiles();
    while (files.length > retention) { const old = files.pop(); try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch {} }
}
function shouldRunBackup(config) {
    if (!config.backup_enabled) return false;
    const now = new Date();
    const [th, tm] = (config.backup_time || '03:00').split(':').map(Number);
    if (Math.abs(now.getHours()*60+now.getMinutes() - (th*60+tm)) > 2) return false;
    const dayVal = String(config.backup_day || '1');
    switch (config.backup_period) {
        case 'weekly': {
            const wm = {'sun':0,'mon':1,'tue':2,'wed':3,'thu':4,'fri':5,'sat':6};
            const td = wm[dayVal] !== undefined ? wm[dayVal] : parseInt(dayVal) || 0;
            if (now.getDay() !== td) return false;
            if (!config.last_backup) return true;
            return Math.floor((now - new Date(config.last_backup)) / (7*86400000)) >= 1;
        }
        case 'monthly': {
            const td = Math.min(parseInt(dayVal) || 1, 28);
            if (now.getDate() !== td) return false;
            if (!config.last_backup) return true;
            const lb = new Date(config.last_backup);
            return now.getMonth() !== lb.getMonth() || now.getFullYear() !== lb.getFullYear();
        }
        default:
            if (!config.last_backup) return true;
            return new Date().toDateString() !== new Date(config.last_backup).toDateString();
    }
}
// ===== 路由 =====
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    // ---- 认证 API ----
    if (pathname === '/api/login' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body) { sendJSON(res, 400, { error: '请求数据无效' }); return; }
        const { username, password } = body;
        if (!username || !password) { sendJSON(res, 400, { error: '请输入用户名和密码' }); return; }

        const users = readUsers();
        const user = users.users.find(u => u.username === username);
        if (!user || user.password !== hashPassword(password)) {
            sendJSON(res, 401, { error: '用户名或密码错误' });
            return;
        }

        const token = generateToken();
        users.tokens[token] = username;
        writeUsers(users);

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Set-Cookie': `nav_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
        });
        res.end(JSON.stringify({ success: true, token, user: { username } }));
        return;
    }

    if (pathname === '/api/verify' && req.method === 'GET') {
        const token = getTokenFromReq(req);
        const username = verifyToken(token);
        if (username) sendJSON(res, 200, { success: true, user: { username } });
        else sendJSON(res, 401, { error: '未登录' });
        return;
    }

    if (pathname === '/api/change-password' && req.method === 'POST') {
        const token = getTokenFromReq(req);
        const username = verifyToken(token);
        if (!username) { sendJSON(res, 401, { error: '未登录' }); return; }

        const body = await parseBody(req);
        if (!body) { sendJSON(res, 400, { error: '请求数据无效' }); return; }

        const { oldPassword, newPassword } = body;
        if (!oldPassword || !newPassword) { sendJSON(res, 400, { error: '请填写旧密码和新密码' }); return; }
        if (newPassword.length < 6) { sendJSON(res, 400, { error: '新密码至少6位' }); return; }

        const users = readUsers();
        const user = users.users.find(u => u.username === username);
        if (!user || user.password !== hashPassword(oldPassword)) {
            sendJSON(res, 401, { error: '旧密码错误' });
            return;
        }

        if (body.newUsername && body.newUsername.trim()) {
            const newUsername = body.newUsername.trim();
            const existing = users.users.find(u => u.username === newUsername && u.username !== username);
            if (existing) { sendJSON(res, 400, { error: '用户名已存在' }); return; }
            user.username = newUsername;
            Object.keys(users.tokens).forEach(t => {
                if (users.tokens[t] === username) users.tokens[t] = newUsername;
            });
        }

        user.password = hashPassword(newPassword);
        user.updated_at = new Date().toISOString();
        writeUsers(users);
        sendJSON(res, 200, { success: true, message: '密码修改成功', username: user.username });
        return;
    }

    if (pathname === '/api/logout' && req.method === 'POST') {
        const token = getTokenFromReq(req);
        if (token) {
            const users = readUsers();
            delete users.tokens[token];
            writeUsers(users);
        }
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Set-Cookie': 'nav_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
        });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ---- 导航数据 API ----
    if (pathname === '/api/data' && req.method === 'GET') {
        const data = readData();
        if (data) sendJSON(res, 200, data);
        else sendJSON(res, 500, { error: 'Failed to read data' });
        return;
    }

    if (pathname === '/api/data' && req.method === 'POST') {
        const token = getTokenFromReq(req);
        if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        const body = await parseBody(req);
        if (body) { writeData(body); sendJSON(res, 200, { success: true }); }
        else sendJSON(res, 400, { error: 'Invalid JSON' });
        return;
    }

    // ---- 拖拽排序 API (不需要登录，前台拖拽直接保存) ----
    if (pathname === '/api/data/reorder' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body || body.categoryIndex === undefined || !body.sites) {
            sendJSON(res, 400, { error: '缺少参数' });
            return;
        }
        const data = readData();
        if (!data || !data.categories[body.categoryIndex]) {
            sendJSON(res, 404, { error: '分类不存在' });
            return;
        }
        data.categories[body.categoryIndex].sites = body.sites;
        writeData(data);
        sendJSON(res, 200, { success: true });
        return;
    }

    // ---- 网站配置 API ----
    if (pathname === '/api/config' && req.method === 'GET') {
        sendJSON(res, 200, readConfig());
        return;
    }

    if (pathname === '/api/config' && req.method === 'POST') {
        const token = getTokenFromReq(req);
        if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        const body = await parseBody(req);
        if (body) { writeConfig(body); sendJSON(res, 200, { success: true }); }
        else sendJSON(res, 400, { error: 'Invalid JSON' });
        return;
    }

    // ---- 文件上传 API (POST /api/upload) ----
    if (pathname === '/api/upload' && req.method === 'POST') {
        const token = getTokenFromReq(req);
        if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }

        try {
            const parts = await parseMultipart(req);
            const filePart = parts.find(p => p.filename && p.data);
            if (!filePart) { sendJSON(res, 400, { error: '没有上传文件' }); return; }

            // 如果是图片，缩放最大 128px 以减少加载量
            let buffer = filePart.data;
            const isImage = filePart.filename.match(/\.(jpg|jpeg|png|gif|webp|ico)$/i);
            if (isImage && buffer.length > 10240) {  // >10KB 的图片才缩放
                try {
                    const sharp = require('sharp');
                    const resized = await sharp(buffer).resize(128, 128, { fit: 'inside', withoutEnlargement: true }).toBuffer();
                    if (resized.length < buffer.length) buffer = resized;
                } catch {} // sharp 不可用时保持原图
            }

            const url = saveUploadedFile(filePart.filename, buffer);
            sendJSON(res, 200, { success: true, url });
        } catch (e) {
            sendJSON(res, 400, { error: '上传失败: ' + e.message });
        }
    }

    // ---- 网站图标代理 (GET /api/favicon?url=...) ----
    if (pathname === '/api/favicon' && req.method === 'GET') {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) { sendJSON(res, 400, { error: '缺少 url 参数' }); return; }
        try {
            const u = new URL(targetUrl);
            // 直接获取 Google favicons（最快最稳定）
            const googleUrl = `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
            try {
                const resp = await fetch(googleUrl, { signal: AbortSignal.timeout(3000) });
                if (resp.ok) {
                    const buf = Buffer.from(await resp.arrayBuffer());
                    if (buf.length > 0) {
                        res.writeHead(200, {
                            'Content-Type': resp.headers.get('content-type') || 'image/png',
                            'Cache-Control': 'public, max-age=86400',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(buf);
                        return;
                    }
                }
            } catch {}
            sendJSON(res, 404, { error: '未找到图标' });
        } catch (e) { sendJSON(res, 500, { error: e.message }); }
        return;
    }

    // ---- 备份 API ----
    if (pathname === '/api/backup/create' && req.method === 'POST') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        try { const r = createBackupFile(); const c = readConfig(); cleanupOldBackups(parseInt(c.backup_retention)||3); sendJSON(res, 200, { success: true, filename: r.filename }); } catch (e) { sendJSON(res, 500, { error: '备份失败: '+e.message }); }
        return;
    }
    if (pathname === '/api/backup/list' && req.method === 'GET') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        try { const files = getBackupFiles(); const b = files.map(f => { const s = fs.statSync(path.join(BACKUP_DIR,f)); return {filename:f, size:s.size, mtime:s.mtime.toISOString()}; }); sendJSON(res, 200, { success: true, backups: b }); } catch { sendJSON(res, 500, { error: '读取失败' }); }
        return;
    }
    if (pathname === '/api/backup/restore' && req.method === 'POST') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        const body = await parseBody(req); if (!body || !body.filename) { sendJSON(res, 400, { error: '缺少文件名' }); return; }
        try { const fp = path.join(BACKUP_DIR, body.filename); if (!fs.existsSync(fp)) { sendJSON(res, 404, { error: '文件不存在' }); return; }
            const b = JSON.parse(fs.readFileSync(fp,'utf-8')); writeData(b.data); writeConfig(b.config); writeUsers(b.users_raw); sendJSON(res, 200, { success: true, message: '还原成功' }); }
        catch (e) { sendJSON(res, 500, { error: '还原失败: '+e.message }); }
        return;
    }
    if (pathname === '/api/backup/download' && req.method === 'GET') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        const fn = url.searchParams.get('filename'); if (!fn) { sendJSON(res, 400, { error: '缺少文件名' }); return; }
        const safe = path.basename(fn); const fp = path.join(BACKUP_DIR, safe);
        if (!fs.existsSync(fp)) { sendJSON(res, 404, { error: '文件不存在' }); return; }
        try { const c = fs.readFileSync(fp); res.writeHead(200, {'Content-Type':'application/json','Content-Disposition':`attachment; filename=\"${safe}\"`,'Content-Length':c.length}); res.end(c); } catch { sendJSON(res, 500, { error: '下载失败' }); }
        return;
    }
    if (pathname === '/api/backup/upload' && req.method === 'POST') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        try { const parts = await parseMultipart(req); const fp = parts.find(p => p.filename && p.data); if (!fp) { sendJSON(res, 400, { error: '没有上传文件' }); return; }
            if (!fp.filename.endsWith('.json')) { sendJSON(res, 400, { error: '请上传 .json 文件' }); return; }
            let b; try { b = JSON.parse(fp.data.toString()); } catch { sendJSON(res, 400, { error: '无效JSON' }); return; }
            if (!b.data || !b.config || !b.users_raw) { sendJSON(res, 400, { error: '不是有效备份文件' }); return; }
            ensureBackupDir(); const sn = 'uploaded-'+Date.now()+'-'+fp.filename.replace(/[^a-zA-Z0-9._-]/g,'');
            fs.writeFileSync(path.join(BACKUP_DIR, sn), fp.data); sendJSON(res, 200, { success: true, filename: sn });
        } catch (e) { sendJSON(res, 500, { error: '上传失败: '+e.message }); }
        return;
    }
    if (pathname === '/api/backup/settings' && req.method === 'POST') {
        const token = getTokenFromReq(req); if (!verifyToken(token)) { sendJSON(res, 401, { error: '未登录' }); return; }
        const body = await parseBody(req); if (!body) { sendJSON(res, 400, { error: '无效请求' }); return; }
        const cfg = readConfig();
        if (body.backup_enabled !== undefined) cfg.backup_enabled = body.backup_enabled;
        if (body.backup_period) cfg.backup_period = body.backup_period;
        if (body.backup_retention) cfg.backup_retention = parseInt(body.backup_retention) || 3;
        if (body.backup_time) cfg.backup_time = body.backup_time;
        if (body.backup_day !== undefined) cfg.backup_day = String(body.backup_day);
        writeConfig(cfg); sendJSON(res, 200, { success: true });
        return;
    }

    // ---- 访客统计 & 系统信息 API ----
    if (pathname === '/api/visitor-info' && req.method === 'GET') {
        (async () => {
            const config = readConfig();
            const enabled = config.visitor_enabled !== false;
            if (!enabled) {
                sendJSON(res, 200, { stats: { total_visits: 0, today_visits: 0 }, visitor: {}, system: {} });
                return;
            }
            const ip = getClientIP(req);
            const stats = readStats();
            const sysInfo = getSystemInfo();
            const geo = await queryGeoIP(ip);
            sendJSON(res, 200, {
                stats: {
                    total_visits: stats.total_visits,
                    today_visits: stats.today_visits
                },
                visitor: {
                    ip,
                    country: geo.country,
                    region: geo.region,
                    city: geo.city,
                    isp: geo.isp || '',
                    org: geo.org || ''
                },
                system: sysInfo
            });
        })();
        return;
    }

    // ---- 记录访问（首页加载时调用）----
    if (pathname === '/api/visit' && req.method === 'GET') {
        const config = readConfig();
        if (config.visitor_enabled !== false) {
            const ip = getClientIP(req);
            const ua = req.headers['user-agent'] || '';
            recordVisit(ip, ua);
        }
        sendJSON(res, 200, { success: true });
        return;
    }

    // ---- 静态文件 ----
    // 上传的文件
    if (pathname.startsWith('/uploads/')) {
        sendFile(res, path.join(UPLOAD_DIR, path.basename(pathname)));
        return;
    }

    if (pathname === '/' || pathname === '/index.html') {
        sendFile(res, path.join(__dirname, 'index.html'));
        return;
    }

    if (pathname === '/admin.html' || pathname === '/admin') {
        sendFile(res, path.join(__dirname, 'admin.html'));
        return;
    }

    if (pathname === '/data.json') {
        sendFile(res, DATA_FILE);
        return;
    }

    sendJSON(res, 404, { error: 'Not found' });
}).on('error', (err) => {
    console.error('Server error:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`API server running on http://0.0.0.0:${PORT}`);
});

// ===== 自动备份定时器（每分钟检查一次）=====
setInterval(() => {
    try {
        const config = readConfig();
        if (shouldRunBackup(config)) {
            const result = createBackupFile();
            const retention = parseInt(config.backup_retention) || 3;
            cleanupOldBackups(retention);
            config.last_backup = new Date().toISOString();
            writeConfig(config);
            console.log(`[AutoBackup] Created: ${result.filename}`);
        }
    } catch (e) {
        console.error('[AutoBackup] Error:', e.message);
    }
}, 60000);

// 全局异常捕获 — 防止单次请求crash整个进程
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
