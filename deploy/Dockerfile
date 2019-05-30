FROM node:12 as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn webpack

FROM nginx:1.16
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
