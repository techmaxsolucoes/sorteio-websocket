FROM node:current-alpine

COPY src /data/app/

WORKDIR /data/src

RUN yarn install

CMD ["yarn", "start"]
