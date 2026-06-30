FROM node:18-alpine AS builder

# 这个多阶段构建用于发布，但当前项目纯静态 + Node 原生模块，单阶段即可
WORKDIR /app

COPY server.js package.json ./
COPY index.html admin.html ./
COPY config.json data.json users.json ./
COPY uploads/ ./uploads/

EXPOSE 5001

CMD ["node", "server.js"]
