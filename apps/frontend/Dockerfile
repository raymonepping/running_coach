FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY samples ./samples
COPY apps/frontend ./apps/frontend
RUN npm run build -w apps/frontend

FROM node:22-alpine
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=5173
COPY --from=build /app/apps/frontend/.output ./apps/frontend/.output
EXPOSE 5173
CMD ["node", "apps/frontend/.output/server/index.mjs"]
