FROM node:current-alpine

RUN npm install -g yarn

COPY src /data/app/

WORKDIR /data/src

RUN yarn install

CMD ["yarn", "start"]
