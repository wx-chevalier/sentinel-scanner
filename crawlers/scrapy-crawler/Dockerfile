FROM python:2
ENV LANG=C.UTF-8

RUN set -ex && mkdir -p ~/.pip
RUN echo "[global]" > ~/.pip/pip.conf && \
echo "index-url = https://mirrors.ustc.edu.cn/pypi/web/simple" >> ~/.pip/pip.conf && \
echo "format = columns" >> ~/.pip/pip.conf && \
pip install pipenv

# -- Install Application into container:
RUN set -ex && mkdir /app

WORKDIR /app
COPY . /app
RUN pipenv install --system --deploy
