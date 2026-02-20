# Stage 1: Deps - 缓存依赖
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# 启用 corepack 和 pnpm，缓存依赖
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch

# Stage 2: Builder - 构建 SEA 可执行文件
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# 安装 UPX 压缩工具（从 GitHub 下载二进制文件）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    xz-utils \
    && rm -rf /var/lib/apt/lists/* && \
    curl -L https://github.com/upx/upx/releases/download/v4.2.4/upx-4.2.4-amd64_linux.tar.xz -o /tmp/upx.tar.xz && \
    tar -xf /tmp/upx.tar.xz -C /tmp && \
    cp /tmp/upx-4.2.4-amd64_linux/upx /usr/local/bin/ && \
    rm -rf /tmp/upx.tar.xz /tmp/upx-4.2.4-amd64_linux

# 启用 corepack 和 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 从 Stage 1 复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 安装依赖、esbuild 和 postject，构建 bundle，生成 blob，复制并注入 SEA
# 注意：UPX 压缩在注入 SEA 后无法使用，因为 blob 注入会修改 ELF 结构
RUN pnpm install --no-frozen-lockfile && \
    pnpm add -D esbuild postject && \
    pnpm run build:bundle && \
    echo '{"main":"./dist/bundle.js","output":"./dist/sea-prep.blob"}' > sea-config.json && \
    pnpm run build:sea && \
    cp $(which node) ./node-sea && \
    npx postject ./node-sea NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 && \
    chmod +x ./node-sea

# Stage 3: Runner - 最小化运行环境（使用 bookworm-slim 以提供 libstdc++）
FROM debian:bookworm-slim

WORKDIR /app

# 安装 libstdc++ 运行库
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# 从 Stage 2 仅拷贝压缩后的可执行文件
COPY --from=builder /app/node-sea ./app

# 设置入口点为可执行文件
ENTRYPOINT ["./app"]

# 暴露端口 3000
EXPOSE 3000
