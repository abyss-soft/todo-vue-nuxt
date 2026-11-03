FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive --network-timeout 120000

COPY . .
RUN yarn build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build /app/.output ./.output
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
