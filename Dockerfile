FROM node:20-alpine AS build
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/
RUN npm install --prefix server && npm install --prefix client

COPY server ./server
COPY client ./client
RUN npm run build --prefix client && npm run build --prefix server


FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4400

COPY server/package.json server/package-lock.json* ./server/
RUN npm install --omit=dev --prefix server

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

EXPOSE 4400
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4400/healthz || exit 1

CMD ["node", "server/dist/index.js"]
