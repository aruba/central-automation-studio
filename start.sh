#!/bin/bash

# set environment variables
python3 set_env.py

# configure Apache 
if [ $SECURE = "True" ]
then
  cp /central/apacheconfig/apache_main_ssl.conf /usr/local/apache2/conf/httpd.conf
  cp /central/apacheconfig/apache_ssl.conf /usr/local/apache2/conf/extra/httpd-ssl.conf
else
  cp /central/apacheconfig/apache_main.conf /usr/local/apache2/conf/httpd.conf
fi
    
# turn on bash's job control
set -m
  
# Start the primary process and put it in the background:
# starting the gunicorn server for the API proxy
gunicorn --bind 0.0.0.0:5000 --workers 2 --threads=4 --worker-class=gthread --worker-tmp-dir /dev/shm wsgi:app &

# Start the helper process and put it in the foreground:
# starts the Apache server for the UI/ frontend
httpd-foreground
