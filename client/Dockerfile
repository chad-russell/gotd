FROM node:16-alpine as builder
WORKDIR /usr/src/gotd
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM nginx:alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/gotd/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
