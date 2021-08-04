# Central Automation Studio (CAS)

Central Automation Studio uses a Docker container to provide a portable, customizable platform for users to explore Central APIs. <br>

Central Automation Studio is a Dockerization of Aaron Scott's Central Automation platform (https://central.wifidownunder.com). <br>
Source code by Aaron Scott at https://central.wifidownunder.com/source <br>
See https://central.wifidownunder.com/documentation.html

### Table of Contents
[Instructions for Use (MacOS/ Linux)](#instructions-linux) <br>
[Instructions for Use (Windows)](#instructions-windows) <br>
[Dependencies](#dependencies) <br>
[Image Versions](#images) <br>
[Useful Commands for Development](#development) <br>
[Architecture](#architecture) <br>
[Container Structure](#container-structure) <br>
[Important Files](#files) <br>
[Notes/ Issues](#notes) <br>


### <a name="instructions-linux"> Instructions for Use (MacOS/ Linux) </a>
Note: Using WSL has not been tested.<br>
1. Install Docker: https://docs.docker.com/get-docker/

2. Pull the image:<br>
    `sudo docker pull arubahpe/central-automation-studio`

3. Start a container using the image you just built.<br>
    - With HTTP<br>
        `sudo docker run -it --rm --name containerName -p <port-number>:80 -e API_URL="http://<ip-address>:<port-number>/backend" -e SECURE="False" arubahpe/central-automation-studio`<br>

        For example: <br>
        `sudo docker run -it --rm --name myContainer -p 5001:80 -e API_URL="http://192.168.1.200:5001/backend" -e SECURE="False" arubahpe/central-automation-studio` <br>

        View your container at the specified IP address, ex: http://192.168.1.200:5001/

    - With HTTPS/ SSL enabled. Note that <path-to-ssl-key> and <path-to-ssl-certificate> need to be provided by the user, and are the file paths of the key and certificate, respectively. <br>
        `sudo docker run -it --rm --name containerName -p 443:443 -e API_URL="https://<ip-address-or-fqdn>/backend" -e SECURE="True" -v <path-to-ssl-key>:/usr/local/apache2/conf/apache-private.key -v <path-to-ssl-certificate>:/usr/local/apache2/conf/apache-cert.crt arubahpe/central-automation-studio`<br>

        For example: <br>
        `sudo docker run -it --rm --name myContainer -p 443:443 -e API_URL="https://192.168.1.200/backend" -e SECURE="True" -v /etc/ssl/private/apache-selfsigned.key:/usr/local/apache2/conf/apache-private.key -v /etc/ssl/certs/apache-selfsigned.crt:/usr/local/apache2/conf/apache-cert.crt arubahpe/central-automation-studio`<br>

        View your container at the specified IP address or FQDN (Fully Qualified Domain Name), ex: https://192.168.1.200/<br>
        For an example of how to quickly set up a self-signed certificate, see **Step 1** of this article: https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-apache-in-ubuntu-16-04. The Common Name should match the IP address in API_URL. Note that if you use a self-signed certificate, you may see an error message; click "Advanced" and proceed anyway.

    - Environment variables<br>
        The "-e" flag sets an environment variable. There are two environment variables that need to be set: <br>
        **API_URL**: Set this to the URL of your backend server.<br>
        **SECURE**: Set this to "True" if you want to enable SSL and use HTTPS, otherwise set it to "False". <br>

3. If you want to stop your container:  <br>
       `sudo docker stop containerName`<br>
       <br>
       The --rm flag means that your container will be removed when it is stopped; if you would like continue running the same exact container, remove the --rm flag. <br>



### <a name="instructions-windows"> Instructions for Use (Windows) </a>
Note: Using WSL has not been tested.<br>
1. Install Docker: https://docs.docker.com/get-docker/. 

2. Pull the image:<br>
    `docker pull arubahpe/central-automation-studio`

3. Start a container using the image you just pulled.<br>
    - With HTTP<br>
        `docker run -it --rm --name containerName -p <port-number>:80 -e API_URL="http://<ip-address>:<port-number>/backend" -e SECURE="False" arubahpe/central-automation-studio`<br>

        For example: <br>
        `docker run -it --rm --name myContainer -p 5001:80 -e API_URL="http://192.168.1.200:5001/backend" -e SECURE="False" arubahpe/central-automation-studio` <br>

        View your container at the specified IP address, ex: http://192.168.1.200:5001/. The --rm flag means that your container will be removed when it is stopped; if you would like continue running the same exact container, remove the --rm flag. <br>

    - Environment variables<br>
        The "-e" flag sets an environment variable. There are two environment variables that need to be set: <br>
        **API_URL**: Set this to the URL of your backend server.<br>
        **SECURE**: Set this to "True" if you want to enable SSL and use HTTPS, otherwise set it to "False". <br>

3. If you want to stop your container:  <br>
       `sudo docker stop containerName`<br>
       <br>    

-----------------------------------------------------

### <a name="dependencies"> Dependencies </a>
API: Python, Flask, Flask-CORS, Gunicorn

### <a name="development"> Useful Commands for Development </a>

Clone the repo here: `git clone https://github.com/aruba/central-automation-studio.git` <br>

To build an image from scratch:<br>
`sudo docker build --no-cache -t imageRepo .` <br>
NOTE: On Windows, you will need to change the line endings ___before___ you build the image. Find the file central-automation-studio/start.sh and change the line endings from CRLF (Windows) to LF (Unix). You can do this with a text editor. <br>
    Sublime: View -> Line Endings -> Unix <br>
    Notepad++: Edit -> EOL Conversion -> Unix (LF) <br>
    Visual Studio Code: See the bottom right corner -> CRLF -> LF <br>


To run a new interactive container (accessible through bash) that is automatically removed when stopped: <br>
`sudo docker run --name containerName -it --rm --entrypoint "" imageRepo tail -f /dev/null` <br>

To access a container's terminal:<br>
`sudo docker exec -it containerName /bin/bash` <br>



### <a name="architecture"> Architecture </a>
UI (Apache) <----> API Proxy (Gunicorn) <----> Aruba Central <br>
See https://central.wifidownunder.com/documentation.html#architecture-row<br>



### <a name="container-structure"> Container Structure </a>
/central <br>
&nbsp;&nbsp;&nbsp;&nbsp;    |----/API <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----set_env.py: sets environment variables <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----start.sh: bash script that starts frontend and backend servers <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----timed_test.log: rotating error log <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----api.py <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;          |----wsgi.py <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----/api <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----/static <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----/templates <br>
&nbsp;&nbsp;&nbsp;&nbsp;    |----/UI <br>
&nbsp;&nbsp;&nbsp;&nbsp;    |----/apacheconfig <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----apache_main.conf: main Apache configuration <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----apache_main_ssl.conf: main Apache configuration with SSL enabled <br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;           |----apache_ssl.conf: specific SSL configuration for Apache <br>
/usr/local/apache2/ <br>
&nbsp;&nbsp;&nbsp;&nbsp;    |----/htdocs/   UI code is located here <br>
&nbsp;&nbsp;&nbsp;&nbsp;    |----/conf/    If SSL is enabled, the certificate and key are placed here. <br>


### <a name="files"> Important files </a>
- UI/assets/js/main.js:32 is where the api_url/ location of backend server is defined.
- set_env.py sets the environment variables API_URL and SECURE
- API/api.py is where the error log is created
- apache_main.conf contains the Apache reverse proxy config
- apache_main_ssl.conf and apache_ssl.conf contain the Apache reverse proxy config + SSL enablement.
- start.sh starts the Gunicorn server in the background, and the Apache server in the foreground


### <a name="notes"> Notes /Issues </a>
- UI/assets/js/main.js: Copyright symbol was removed due to encoding issues when trying to read the file in set_env.py
- Some issues on Windows PC, so for now just use http instead of https: `RUN sed -i 's/https/http/' /etc/apk/repositories` (put this before `apk update`)
- To run on Windows, change the line endings in start.sh from CRLF to LF before building the image
- Setting up HTTPS for Windows? "Invalid mode" when volume mounting SSL certificate and key, using OpenSSL on Windows

