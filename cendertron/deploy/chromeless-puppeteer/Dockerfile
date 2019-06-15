# Dockerfile extending the generic Node image with application files for a single application.
# FROM zenika/alpine-chrome:with-node
FROM browserless/chrome

LABEL name="cendertron" \ 
    version="0.0.1" \
    description="Extract(vulnerable) apis from your Web 2.0 page"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=development

USER root

# Install Google Chrome
RUN cd /tmp &&\
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
    dpkg -i google-chrome-stable_current_amd64.deb;

# Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update &&  apt-get install yarn

COPY ./resolv.conf /etc/

# Copy source to specified user
RUN rm -rf /usr/src/app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

# Compile and rm source code
RUN yarn install --registry=https://registry.npm.taobao.org 
RUN yarn run build
RUN yarn run prune
RUN rm -rf ./**/*.ts

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD [ "npm", "start" ]