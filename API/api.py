# API Proxy v1.3
# Updated: 2025/02/13
# Aaron Scott (WiFi Downunder) 2023-2025
# ------------------------------------------------------------------------------------------
# Convert JS based API calls into Python calls (to work around CORS) and return the results
# ------------------------------------------------------------------------------------------


from flask import Flask, jsonify, request, json, render_template, g
from flask_cors import CORS, cross_origin
from datetime import datetime
import flask
import logging
import requests
import binascii
import os

from logging.handlers import RotatingFileHandler

app = Flask(__name__)

cors = CORS(app, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], supports_credentials=True, 
          expose_headers='Authorization', allow_headers=['Accept', 'Authorization', 'Cache-Control', 'Content-Type', 'DNT', 'If-Modified-Since', 'Keep-Alive', 'Origin', 'User-Agent', 'X-Requested-With'])
		  
# Handle untrusted SSL certs
# creating Session object and declaring the verify variable to set the SSL verification state
session = requests.Session()
session.verify = cert_verify_state
if session.verify == False:
	# Disable warnings for insecure requests
	from requests.packages.urllib3.exceptions import InsecureRequestWarning
	requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
	print("SSL Check Disabled for this worker")

def create_timed_rotating_log(path):
	app.logger = logging.getLogger('werkzeug')
	handler = RotatingFileHandler(path, maxBytes=1024, backupCount=5) # creates handler for the log file
	app.logger.setLevel(logging.DEBUG) # controls the priority of the messages that are logged
	app.logger.addHandler(handler) # adds handler to the logger

log_file = "/central/API/api-proxy.log" # creates this file at the specified path
create_timed_rotating_log(log_file)

@app.route('/auth/refresh', methods = ["POST"])
def tokenRefresh():
	data = request.get_json()
	url = data['base_url'] + "/oauth2/token"
	payload = json.dumps({
	  "client_id": data['client_id'],
	  "client_secret": data['client_secret'],
	  "grant_type": "refresh_token",
	  "refresh_token": data['refresh_token']
	})
	headers = {
	  'Authorization': 'Bearer ' + data['access_token'],
	  'Content-Type': 'application/json'
	}
	try:
		response = session.request("POST", url, headers=headers, data=payload)
	except requests.exceptions.ConnectionError as e:
		result = jsonify(status="500", reason=str(e));
		print("Connection Error. Make sure you are connected to Internet. Technical Details given below:");
		print(str(e));
		print("\n");
		return result;

	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;

@app.route('/auth/refreshwHeaders', methods = ["POST"])
def tokenRefreshwHeaders():
	data = request.get_json()
	url = data['base_url'] + "/oauth2/token"
	payload = json.dumps({
	  "client_id": data['client_id'],
	  "client_secret": data['client_secret'],
	  "grant_type": "refresh_token",
	  "refresh_token": data['refresh_token']
	})
	headers = {
	  'Authorization': 'Bearer ' + data['access_token'],
	  'Content-Type': 'application/json'
	}
	response = session.request("POST", url, headers=headers, data=payload)
	
	headers_json = json.dumps(dict(response.headers))
	try:
		result = jsonify(responseBody=str(response.text), status=str(response.status_code), headers=headers_json);
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;


@app.route('/tools/getCommand', methods = ["POST"])
def getCommand():
	data = request.get_json();
	url = data['url'];
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json',
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json'
		};
	
	response = session.request("GET", url, headers=headers);
	#print(response.text)
	#print(response);
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason, responseBody=str(response.text));
	return result;


@app.route('/tools/getCommandwHeaders', methods = ["POST"])
def getCommandwHeaders():
	data = request.get_json();
	url = data['url'];
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json',
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json'
		};
	
	response = session.request("GET", url, headers=headers);
	headers_json = json.dumps(dict(response.headers))
	try:
		result = jsonify(responseBody=str(response.text), status=str(response.status_code), headers=headers_json, requestedUrl=url);
		# ...
	except ValueError:
		# no JSON returned
		result = jsonify(responseBody=str(response.text), status=str(response.status_code), reason=response.reason, requestedUrl=url);
	return result;
	
	
	
@app.route('/tools/postCommand', methods = ["POST"])
def postCommand():
	data = request.get_json();
	url = data['url'];
	
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json',
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json'
		};

	if 'data' in data:
		payload = data['data'];
		response = session.request("POST", url, headers=headers, data=payload);
	else:
		response = session.request("POST", url, headers=headers);

	#app.logger.debug(response.text)
	
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		app.logger.debug("No JSON")
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;
	
	
@app.route('/tools/postFormDataCommand', methods = ["POST"])
def postFormDataCommand():
	data = request.get_json();
	url = data['url'];
	
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  "Accept": "*/*",
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  "Accept": "*/*"
		};
    
	if 'template' in data:
		payload = data['template'];
		files = {'template': ('template.txt', payload)}
		response = session.request("POST", url, headers=headers, files=files);
	elif 'variables' in data:
		payload = data['variables'];
		files = {'variables': ('variables.txt', payload)}
		response = session.request("POST", url, headers=headers, files=files);
	else:
		response = session.request("POST", url, headers=headers);

	#app.logger.debug(response.text)
	
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		app.logger.debug("No JSON")
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;

	
@app.route('/tools/putCommand', methods = ["POST"])
def putCommand():
	data = request.get_json();
	url = data['url'];
	payload = data['data'];
	
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json',
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  'Content-Type': 'application/json'
		};
    
	response = session.request("PUT", url, data=payload, headers=headers);
	
	#app.logger.debug(response.text)
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;


@app.route('/tools/patchFormDataCommand', methods = ["POST"])
def patchFormDataCommand():
	data = request.get_json();
	url = data['url'];
	
	if 'tenantID' in data:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  "Accept": "*/*",
		  'TenantID': data['tenantID']
		};
	else:
		headers = { 
		  'cache-control': "no-cache",
		  'Authorization': 'Bearer ' + data['access_token'],
		  "Accept": "*/*"
		};
    
	if 'template' in data:
		payload = data['template'];
		files = {'template': ('template.txt', payload)}
		response = session.request("PATCH", url, headers=headers, files=files);
	elif 'variables' in data:
		payload = data['variables'];
		files = {'variables': ('variables.txt', payload)}
		response = session.request("PATCH", url, headers=headers, files=files);
	else:
		response = session.request("PATCH", url, headers=headers);

	#app.logger.debug(response.text)
	
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		app.logger.debug("No JSON")
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;


@app.route('/tools/patchCommand', methods = ["POST"])
def patchCommand():
	data = request.get_json();
	url = data['url'];
	payload = data['data'];
	
	if 'tenantID' in data:
		headers = {
			'cache-control': "no-cache",
			'Authorization': 'Bearer ' + data['access_token'],
			'Content-Type': 'application/json',
			'TenantID': data['tenantID']
		};
	else:
		headers = {
			'cache-control': "no-cache",
			'Authorization': 'Bearer ' + data['access_token'],
			'Content-Type': 'application/json'
		};
    
	response = session.request("PATCH", url, data=payload, headers=headers);
	
	try:
		result = jsonify(json.loads(response.text));
		# ...
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason);
	return result;

	
@app.route('/tools/deleteCommand', methods = ["POST"])
def deleteCommand():
	data = request.get_json();
	url = data['url'];
	
	if 'tenantID' in data:
		headers = {
			'cache-control': "no-cache",
			'Authorization': 'Bearer ' + data['access_token'],
			'Content-Type': 'application/json',
			'TenantID': data['tenantID']
		};
	else:
		headers = {
			'cache-control': "no-cache",
			'Authorization': 'Bearer ' + data['access_token'],
			'Content-Type': 'application/json'
		};
	
	if "data" in data:
		payload = data['data'];
		response = session.request("DELETE", url, data=payload, headers=headers);
	else:
		response = session.request("DELETE", url, headers=headers);
	
	try:
		result = jsonify(json.loads(response.text)), response.status_code;
	except ValueError:
		# no JSON returned
		result = jsonify(status=str(response.status_code), reason=response.reason), response.status_code;
	return result;

		


@app.route("/")
def hello():
    return render_template('index.html')



@app.route("/reachable")
def reachable():
    return flask.request.url_root;


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
	