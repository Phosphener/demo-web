FROM node:0.12

COPY . ./demo-web

WORKDIR /demo-web

RUN npm install -g http-server

EXPOSE 80

RUN chmod +x start.sh

CMD ./start.sh