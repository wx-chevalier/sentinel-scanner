# Dockerfile extending the generic Node image with application files for a
# single application.
FROM zenika/alpine-chrome:with-node

LABEL name="cendertron" \ 
    version="0.1" \
    description="Extract (vulnerable) apis from your Web 2.0 page"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1

COPY ./resolv.conf /etc/

# Copy source to specified user
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY --chown=chrome . /usr/src/app

# Compile and rm source code
RUN yarn install --registry=https://registry.npm.taobao.org 
RUN yarn run tsc
RUN rm -rf ./*.ts
RUN rm -rf ./db

EXPOSE 8080

ENTRYPOINT [ "npm" ]
CMD ["run", "start"]