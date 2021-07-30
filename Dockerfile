FROM httpd:alpine

# Install Python3 and pip3
# This hack is widely applied to avoid python printing issues in docker containers.
# See: https://github.com/Docker-Hub-frolvlad/docker-alpine-python3/pull/13
ENV PYTHONUNBUFFERED=1

# set current directory in container, will be created if it doesn't exist
WORKDIR /central

# use HTTP instead of HTTPS
# there seems to be some issues with Windows security certificates
RUN sed -i 's/https/http/' /etc/apk/repositories

# installing dependencies
RUN echo "*** install bash ***" && \
    apk update && \
    apk add --no-cache bash

RUN echo "**** install Python ****" && \
    apk update && \
    apk add --no-cache python3 && \
    echo "**** install pip ****" && \
    apk add --no-cache py3-pip && \
    pip3 install --no-cache --upgrade pip setuptools wheel

RUN echo "installing Flask and gunicorn" && \
    pip install Flask && \
    pip install -U flask-cors && \
    pip install gunicorn && \
    mkdir /central/API && \
    mkdir /central/UI && \
    mkdir /central/apacheconfig

# copying over source code
COPY API /central/API
COPY UI /usr/local/apache2/htdocs/

# needed for Flask app
ENV FLASK_APP=api.py

# copying file for setting up environment variables
COPY set_env.py /central/API

# copying over shell script
COPY start.sh /central/API

# sets file permissions as executable
RUN chmod +x /central/API/start.sh

# copying over Apache configuration files 
COPY apache_main.conf /central/apacheconfig
COPY apache_main_ssl.conf /central/apacheconfig
COPY apache_ssl.conf /central/apacheconfig

WORKDIR /central/API
CMD ["/central/API/start.sh"]

