FROM node:0.10

WORKDIR /usr/src/app

ADD ./package.json /usr/src/app/package.json
RUN npm install

ADD ./bin /usr/src/app/bin
ADD ./lib /usr/src/app/lib
ADD ./resources /usr/src/app/resources
ADD ./middleware /usr/src/app/middleware
ADD ./server.js /usr/src/app/server.js

EXPOSE 9000
EXPOSE 1337

CMD [ "./bin/server" ]
