# 🧭 东白湖之家导航站 (dbhzj-Nav)

> 个人网址导航系统 - 支持卡片/条目双布局、拖拽排序、后台管理

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 功能特性

- **📇 卡片模式** — 分类作为卡片块，站点网格排列，美观大方
- **📋 条目模式** — 分类变成横条，站点横向排列，支持折叠/展开
- **🔄 布局切换** — 一键切换卡片/条目模式，偏好自动保存到 localStorage
- **🎯 拖拽排序** — 首页站点支持拖拽重新排序，实时保存
- **🔧 后台管理** — 完整的 CRUD 管理面板，管理分类、站点、搜索引擎
- **🎨 自定义外观** — 背景图/渐变/纯色、强调色、Logo、自定义 CSS/JS
- **🔍 多搜索引擎** — 支持百度、Google、Bing 等一键搜索切换
- **⚡ 快捷链接** — 顶部快捷导航栏，快速直达常用网站
- **📱 响应式设计** — 适配桌面端和移动端

---

## 📂 源码框架结构

```
dbhzj-Nav/
├── server.js          # Node.js 后端服务 (Express, 端口 5001)
├── index.html         # 首页前端 - 导航站展示页面
├── admin.html         # 后台管理前端 - 分类/站点/外观管理
├── config.json        # 站点配置 (标题/外观/搜索引擎等)
├── data.json          # 核心数据 (分类树 + 站点列表)
├── users.json         # 管理员用户和 Token
├── package.json       # 项目元数据
├── uploads/           # 用户上传文件目录
└── README.md          # 项目说明 (本文档)
```

### 数据文件说明

| 文件 | 说明 |
|------|------|
| `config.json` | 站点标题、副标题、外观设置（背景、强调色、Logo、自定义 CSS/JS） |
| `data.json` | 分类树（含顺序、图标）、站点列表（含顺序、图标 URL）、搜索引擎列表、快捷链接 |
| `users.json` | 管理员账号（SHA-256 加密密码）、认证 Token |
| `uploads/` | 通过后台上传的 Logo 图片文件 |

---

## 🚀 部署教程

### 前置要求

- Node.js (v12+)
- Linux 服务器 (Debian/Ubuntu/CentOS 等)

### 快速部署

```bash
# 1. 下载代码
git clone https://github.com/rojocai/dbhzj-Nav.git
cd dbhzj-Nav

# 2. 启动服务
node server.js
```

服务默认运行在 **http://localhost:5001**

### 使用 Nginx Proxy Manager 反代

1. 在 Nginx Proxy Manager 面板添加代理
   - **域名**: `blog.dbhzj.top`（替换为你的域名）
   - **转发**: `http://172.17.0.1:5001`（Docker 网关地址）
   - **SSL**: 申请 Let's Encrypt 证书

2. 访问 `https://你的域名` 即可打开导航首页
3. 访问 `https://你的域名/admin.html` 进入后台管理

### 使用 systemd 管理（推荐生产环境）

```bash
# 创建 systemd 服务文件
cat > /etc/systemd/system/nav-api.service << 'EOF'
[Unit]
Description=东白湖导航站 API 服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/nav-site
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 启动并设置开机自启
systemctl daemon-reload
systemctl enable nav-api.service
systemctl start nav-api.service
```

---

## 🔑 后台管理

| 项目 | 默认值 |
|------|--------|
| **后台地址** | `https://你的域名/admin.html` |
| **默认用户名** | `admin` |
| **默认密码** | `admin123` |

登录后可通过下面的功能管理：
- 📝 **基本设置** — 标题、副标题、底部文案
- 🎨 **外观设置** — 背景类型/颜色/图片、Logo、强调色
- 🔍 **搜索引擎** — 添加/编辑/删除搜索引擎
- ⚡ **快捷链接** — 管理顶部导航栏链接
- 📂 **分类管理** — 增删改查分类和站点，配置图标

---

## 📦 版本历史

| v1.0.1 | 2026-06-30 | 初始发布：卡片/条目双布局、后台管理、拖拽排序、布局切换、序号整理 |

---

## 📄 开源协议

MIT License

---

*🏠 东白湖之家 · 上网从这里开始*
