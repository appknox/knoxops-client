FROM node:20-bullseye AS builder

LABEL maintainer "Appknox <engineering@appknox.com>"

WORKDIR /code/
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npx vite build


FROM nginx:alpine

LABEL maintainer "Appknox <engineering@appknox.com>"

EXPOSE 80

COPY --from=builder /code/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
