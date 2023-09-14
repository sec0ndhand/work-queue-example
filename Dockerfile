FROM node:20-alpine

ENV DEBIAN_FRONTEND noninteractive

WORKDIR /app

# RUN apk update
# RUN apk add python-software-properties
# RUN apk add software-properties-common
# RUN apk update
# RUN apk --no-cache add file
# RUN apk --update add ghostscript graphicsmagick
# RUN apk --update add git

# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . ./

ARG NODE_ENV=production
ENV NODE_ENV ${NODE_ENV}

ARG PORT=8080
ENV PORT ${PORT}
RUN echo $PORT

USER node
EXPOSE 8080

CMD npm run start-prod
