# 🧭 东白湖之家导航站 (dbhzj-Nav)

> 个人网址导航系统 — 卡片/条目双布局、拖拽排序、后台管理、多搜索引擎

![Version](https://img.shields.io/badge/version-1.0.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen)
![Last Updated](https://img.shields.io/badge/last%20update-2026--07--01-brightgreen)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| **📇 卡片模式** | 分类作为卡片块，站点网格排列，美观大方 |
| **📋 条目模式** | 分类变成横条，站点横向排列，支持折叠/展开 |
| **🔄 布局切换** | 一键切换卡片/条目模式，偏好自动保存 |
| **🎯 拖拽排序** | 分类卡片 & 站点均支持鼠标拖拽排序，实时保存 |
| **🔧 后台管理** | 完整 CRUD 管理面板 — 分类、站点、搜索引擎、外观 |
| **🎨 自定义外观** | 背景图/渐变/纯色、强调色、Logo、自定义 CSS/JS |
| **🔍 多搜索引擎** | 支持百度、Google、Bing 等一键切换搜索 |
| **⚡ 快捷链接** | 顶部导航栏，快速直达常用网站 |
| **📱 响应式** | 自适应桌面端和移动端 |
|| **✏️ 14+ 中文字体** | 霞鹜文楷、思源黑体等 13 款中文字体 + 8 款英文字体 |
|| **👁️ 访客统计** | 累计/今日访问次数、访客IP定位、服务器系统状态 |

---

## 🚀 一键 Docker 部署（推荐）

```bash
# 1. 拉取代码
git clone https://github.com/rojocai/dbhzj-Nav.git
cd dbhzj-Nav

# 2. 用 Docker Compose 启动
docker compose up -d
```

访问 **http://localhost:5001** 即可打开导航首页。
访问 **http://localhost:5001/admin.html** 进入后台管理。

> 默认管理员：`admin` / `admin123`

### 持久化挂载

```yaml
services:
  nav-site:
    image: rojocai/dbhzj-nav:latest
    container_name: dbhzj-nav
    restart: unless-stopped
    ports:
      - "5001:5001"
    volumes:
      - ./data.json:/app/data.json      # 分类/站点数据
      - ./config.json:/app/config.json  # 站点配置
      - ./users.json:/app/users.json    # 账号密码
      - ./uploads:/app/uploads          # 上传文件
```

### 使用 Nginx Proxy Manager 反代

1. 在 NPM 面板添加代理
   - **域名**: 你的域名（如 `nav.example.com`）
   - **转发**: `http://172.17.0.1:5001`（Docker 网关地址）
   - **SSL**: 申请 Let's Encrypt 证书

2. 访问 `https://你的域名` 打开导航首页

---

## 🐳 手动构建 Docker 镜像

```bash
docker build -t dbhzj-nav .
docker run -d --name dbhzj-nav -p 5001:5001 \
  -v $(pwd)/data.json:/app/data.json \
  -v $(pwd)/config.json:/app/config.json \
  -v $(pwd)/users.json:/app/users.json \
  -v $(pwd)/uploads:/app/uploads \
  dbhzj-nav
```

---

## 📦 直接部署（无 Docker）

### 前置要求

- Node.js v12+

### 快速启动

```bash
git clone https://github.com/rojocai/dbhzj-Nav.git
cd dbhzj-Nav
node server.js
```

服务默认运行在 **http://localhost:5001**

### 使用 systemd（生产环境推荐）

```bash
cat > /etc/systemd/system/nav-api.service << 'EOF'
[Unit]
Description=东白湖导航站 API 服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/dbhzj-Nav
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nav-api.service
```

---

## 🔑 后台管理

| 项目 | 默认值 |
|------|--------|
| **后台地址** | `https://你的域名/admin.html` |
| **默认用户名** | `admin` |
| **默认密码** | `admin123` |

### 管理功能
- 📝 **基本设置** — 标题、副标题、底部文案、ICP 备案号
- 🎨 **外观设置** — 背景类型/颜色/图片、Logo、强调色、透明度、自定义 CSS/JS
- 🔍 **搜索引擎** — 添加/编辑/删除搜索引擎
- ⚡ **快捷链接** — 管理顶部导航栏链接
- 📂 **分类管理** — 增删改查分类和站点，配置图标，拖拽排序

---

## 📂 源码结构

```
dbhzj-Nav/
├── server.js          # Node.js 后端服务 (端口 5001)
├── index.html         # 首页前端 — 导航站展示
├── admin.html         # 后台管理前端 — 分类/站点/外观
├── config.json        # 站点配置 (标题/外观/搜索引擎等)
├── data.json          # 核心数据 (分类树 + 站点列表)
├── users.json         # 管理员账号 (SHA-256) + Token
├── Dockerfile         # Docker 构建文件
├── docker-compose.yml # Docker Compose 配置
├── uploads/           # 用户上传文件目录
└── README.md          # 项目说明 (本文档)
```

---

## 📦 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
|| **1.0.5** | 2026-07-01 | 👁️ 访客统计+IP定位+系统信息 + 手机端适配修复 |
|| **1.0.4** | 2026-07-01 | 📱 手机端排版优化 — 标题单行、隐藏管理/布局按钮 |
|| **1.0.3** | 2026-07-01 | 📱 手机端排版优化 — 标题单行、隐藏管理/布局按钮 |
|| **1.0.2** | 2026-06-30 | 🐳 Docker 支持、🐛 6 项 Bug 修复 + 多项体验优化（详见下文） |
|| 1.0.1 | 2026-06-30 | 初始发布：卡片/条目双布局、后台管理、拖拽排序 |

### v1.0.5 更新详情 (2026-07-01)

#### ✨ 新增功能
- **👁️ 底部访客信息面板** — 实时显示累计访问次数、今日访问次数、访客IP、地理位置（国家·省份·城市）、服务器系统信息、服务器运行时长
- **📊 统计持久化** — 访问计数写入 `stats.json`，重启不丢失

#### 🐛 问题修复
1. **📱 手机端访客面板不显示** — 修复三个深层原因：NPM 转发端口配置错误(5000→5001)、Node 用 `https.get` 请求 `http://` URL 导致 GeoIP 请求永久挂起、超时处理缺少双 resolve 保护
2. **🛡️ 服务稳定性** — 添加 `getSystemInfo` try-catch 防空数组崩溃、`uncaughtException` + `unhandledRejection` 全局兜底

#### ⚡ 优化
- GeoIP 查询 3 秒超时速断，不影响页面渲染
- 内网 IP 自动识别并跳过查询
- 服务器 CPU/内存/运行时长信息实时显示

---

### v1.0.4 更新详情 (2026-07-01)

#### 📱 手机端适配优化
- **标题自动单行** — `white-space: nowrap` + `clamp(16px, 5.5vw, 24px)` 自适应字号
- **隐藏管理/布局按钮** — `.admin-btn` 和 `.layout-toggle` 在手机端 `display: none`
- **排版全面缩减** — 容器边距、站点卡片大小、分类间距均按手机屏幕优化

---

### v1.0.3 更新详情 (2026-07-01)

> 同 v1.0.4，合并发布。

---

### v1.0.2 更新详情

#### ✨ 新增功能
- **🐳 Docker 部署支持** — 新增 `Dockerfile` + `docker-compose.yml`，一键启动
- **🖼️ 分类序号只读徽标** — 圆形紫色数字显示，拖拽后自动更新序号
- **🔤 中文字体扩展** — 新增 13 款中文字体（霞鹜文楷、思源黑体等）+ 8 款英文字体

#### 🐛 问题修复
1. **🎯 分类卡片拖拽不保存服务器** — 拖拽后更新 `catOrder` + `POST /api/data` 持久化，刷新不再恢复
2. **🔄 站点拖拽不保存服务器** — 新增 `fetch` 保存逻辑
3. **🖱️ 分类拖拽被按钮/输入框拦截** — 支持拖拽手柄 ⠿ 启动
4. **📦 站点与分类拖拽冲突** — 重构全局单事件监听拖拽系统
5. **🎨 搜索引擎下拉背景色** — option 背景现在自动跟随网页背景（纯色/渐变/图片自适应）
6. **🔧 序号从可编辑 input 改为只读徽标** — 避免手动序号和拖拽排序冲突

#### ⚡ 优化
- 单事件监听 + `_dragConfigs` 数组模式，render 后自动重建拖拽配置
- `#dynamicStyles` 强调色替换增强

---

## 📄 开源协议

MIT License

---

*🏠 东白湖之家 · 上网从这里开始*
