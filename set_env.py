import os

print("---------------------------------------")
print("Configuring environment...")

url = os.environ["API_URL"]
secure = os.environ["SECURE"]

# Check if VERIFY key is set (if not default to TRUE)
try:  
	cert_verify = os.environ["VERIFY"]
except KeyError:
	cert_verify = "True"

# Check SECURE and VERIFY key values
if secure == "T" or secure == "True" or secure == "TRUE":
	os.environ["SECURE"] = "True"
	print("HTTPS configuration enabled.")
else:
	os.environ["SECURE"] = "False"
	print("HTTP will be used.")
	
if cert_verify == "F" or cert_verify == "False" or cert_verify == "FALSE":
	os.environ["VERIFY"] = "False"
	cert_verify = "False"
	print("Central HTTPS Certificate will not be verified.")
else:
	os.environ["VERIFY"] = "True"
	cert_verify = "True"
	print("Central HTTPS Certificate will be verified.")


# Setting cert_verify within API/api.py
data = ""
with open("/central/API/api.py", "r") as f: # read mode
	data = f.read()

data = data.replace("cert_verify_state", cert_verify)

with open("/central/API/api.py", "w") as f: # write mode
	f.write(data)


# Setting api_url within UI/assets/js/main.js
data = ""
with open("/usr/local/apache2/htdocs/assets/js/proxy.js", "r") as f: # read mode
    data = f.read()

data = data.replace("Replace with API URL", url)

with open("/usr/local/apache2/htdocs/assets/js/proxy.js", "w") as f: # write mode
    f.write(data)


print("API_URL: ", os.environ["API_URL"])
print("---------------------------------------")
