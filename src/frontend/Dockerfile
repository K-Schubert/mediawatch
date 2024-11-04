# frontend/Dockerfile

FROM node:16

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY ./public /app/public
COPY ./src /app/src

EXPOSE 3000

CMD ["yarn", "start"]
