# Dockerfile extending the generic Node image with application files for a single application.
# FROM zenika/alpine-chrome:with-node
FROM browserless/chrome

LABEL name="cendertron" \ 
    version="0.0.1" \
    description="Extract(vulnerable) apis from your Web 2.0 page"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

USER root

# Install Google Chrome
RUN cd /tmp &&\
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
    dpkg -i google-chrome-stable_current_amd64.deb;

# Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update &&  apt-get install yarn

# Set DNS
COPY ./resolv.conf /etc/

# Set Timezone
## for apt to be noninteractive
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true

## preesed tzdata, update package index, upgrade packages and install needed software
RUN echo "tzdata tzdata/Areas select Asia" > /tmp/preseed.txt; \
    echo "tzdata tzdata/Zones/Asia select Shanghai" >> /tmp/preseed.txt; \
    debconf-set-selections /tmp/preseed.txt && \
    rm -rf /etc/timezone && \
    rm -rf /etc/localtime && \
    apt-get update && \
    apt-get install -y tzdata

# Copy source to specified user
RUN rm -rf /usr/src/app \
    && mkdir -p /usr/src/app \
    && mkdir -p /usr/src/app/logs

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