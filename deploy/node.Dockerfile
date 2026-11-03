# 웹·운영 콘솔·API 이미지. 저장소 루트를 컨텍스트로 쓴다 (--target web | console | api)
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY console/package.json console/
RUN npm ci --no-audit --no-fund

# ---- API (prisma CLI로 마이그레이션도 돌리므로 개발 의존성을 지우지 않는다)
FROM deps AS api
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN DATABASE_URL=postgresql://build:build@localhost/build npx prisma generate && npx nest build
RUN mkdir -p data/personas && chown -R node:node data
ENV NODE_ENV=production
USER node
EXPOSE 4000
CMD ["node", "dist/main"]

# ---- 이용자 사이트. CONSOLE_BASE_URL은 빌드할 때 리다이렉트에 박힌다
FROM deps AS web
ARG CONSOLE_BASE_URL=http://localhost:3001
COPY apps/web apps/web
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN CONSOLE_BASE_URL=$CONSOLE_BASE_URL npx next build && chown -R node:node .next
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

# ---- 운영 콘솔
FROM deps AS console
COPY console console
WORKDIR /app/console
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build && chown -R node:node .next
USER node
EXPOSE 3001
CMD ["npx", "next", "start", "-p", "3001"]
