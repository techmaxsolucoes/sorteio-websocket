FROM node:current-alpine

COPY src /data/app/

WORKDIR /data/app

RUN yarn install

CMD ["yarn", "start"]
