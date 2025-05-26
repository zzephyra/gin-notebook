FROM node:22.9.0
# RUN npm config set registry https://registry.npm.taobao.org
COPY . /gnote-client
WORKDIR /gnote-client
RUN npm install
ENTRYPOINT [ "npm", "run", "dev" ]