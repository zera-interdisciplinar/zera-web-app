FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig*.json vite.config.ts ./
COPY src ./src
COPY styles ./styles
COPY assets ./assets
COPY public ./public
ARG VITE_USE_MSW=true
ENV VITE_USE_MSW=$VITE_USE_MSW
ENV VITE_API_BASE_URL=/api
ENV VITE_ROUTER_MODE=history
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
