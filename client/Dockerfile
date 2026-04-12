# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_POSTHOG_API_KEY
ARG VITE_POSTHOG_HOST
ENV VITE_POSTHOG_API_KEY=$VITE_POSTHOG_API_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Production stage (nginx) ──────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
