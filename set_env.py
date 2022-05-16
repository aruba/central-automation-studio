import os

url = os.environ["API_URL"]
secure = os.environ["SECURE"]

if secure == "T" or secure == "True":
	os.environ["SECURE"] = "True"
	print("HTTPS configuration enabled.")
else:
	os.environ["SECURE"] = "False"
	print("HTTP will be used.")

# setting api_url within UI/assets/js/main.js
# NOTE: copyright symbol removed because of encoding issues when trying to read the file
data = ""
with open("/usr/local/apache2/htdocs/assets/js/proxy.js", "r") as f: # read mode
    data = f.read()

data = data.replace("Replace with API URL", url)

with open("/usr/local/apache2/htdocs/assets/js/proxy.js", "w") as f: # write mode
    f.write(data)

print("API_URL: ", os.environ["API_URL"])
print("SECURE: ", os.environ["SECURE"])
