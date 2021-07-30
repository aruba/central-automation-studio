/*
Central Automation v1.2b
*/

/*  ----------------------------------------------------------------------------------
		Cluster info
	---------------------------------------------------------------------------------- */

var centralURLs = [{"https://apigw-apacsouth.central.arubanetworks.com": "https://app-apacsouth.central.arubanetworks.com", 
"https://api-ap.central.arubanetworks.com": "https://app2-ap.central.arubanetworks.com",
"https://internal-apigw.central.arubanetworks.com": "https://internal-ui.central.arubanetworks.com",
"https://app1-apigw.central.arubanetworks.com": "https://app.central.arubanetworks.com",
"https://apigw-prod2.central.arubanetworks.com": "https://app-prod2-ui.central.arubanetworks.com",
"https://apigw-apaceast.central.arubanetworks.com": "https://app-apaceast.central.arubanetworks.com",
"https://eu-apigw.central.arubanetworks.com": "https://app2-eu.central.arubanetworks.com"}];

var centralClusters = [{"Internal": "https://internal-apigw.central.arubanetworks.com",
"US-1": "https://app1-apigw.central.arubanetworks.com", 
"US-2": "https://apigw-prod2.central.arubanetworks.com",
"APAC-1": "https://api-ap.central.arubanetworks.com",
"APAC-EAST1": "https://apigw-apaceast.central.arubanetworks.com",
"APAC-SOUTH1": "https://apigw-apacsouth.central.arubanetworks.com",
"EU": "https://eu-apigw.central.arubanetworks.com"
}]

var clusterNames = [{"https://internal-apigw.central.arubanetworks.com": "Internal",
"https://app1-apigw.central.arubanetworks.com": "US-1", 
"https://apigw-prod2.central.arubanetworks.com": "US-2",
"https://api-ap.central.arubanetworks.com": "APAC-1",
"https://apigw-apaceast.central.arubanetworks.com": "APAC-EAST1",
"https://apigw-apacsouth.central.arubanetworks.com": "APAC-SOUTH1",
"https://eu-apigw.central.arubanetworks.com": "EU"
}]

/*  ----------------------------------------------------------------------------------
		Variables 
	---------------------------------------------------------------------------------- */

var api_url = "https://api.wifidownunder.com";
var forcedTokenRefresh = true;
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';
var csvData;
var authCounter = 0;
var authErrorCount = 0;
var apiErrorCount = 0;
var moveCounter = 0;
var addCounter = 0;
var licenseCounter = 0;
var renameCounter = 0;
var updateVariablesCounter = 0;
var inventoryCompleteCounter = 0;
var inventoryPromise;
var monitoringPromise;
var apPromise;
var apPromiseTracker = {};
var switchPromise;
var switchPromiseTracker = {};
var gatewayPromise;
var gatewayPromiseTracker = {};
var groupPromise;
var customerPromise;
var authPromise;

var clients = [];
var wirelessClients = [];
var wiredClients = [];
var aps = [];
var apInventory = [];
var apInventoryCount = {};
var switches = [];
var switchInventory = [];
var switchInventoryCount = {};
var gateways = [];
var gatewayInventory = [];
var gatewayInventoryCount = {};
var deviceType = "";
var sites = [];
var groups = [];
var downAPCount = 0;
var downSwitchCount = 0;
var downGatewayCount = 0;
var siteIssues = 0;

var mspAPs = [];
var mspAPCount = 0;
var mspSwitches = [];
var mspSwitchCount = 0;
var mspGateways = [];
var mspGatwayCount = 0;
var mspCustomers = [];
var mspCustomerCount = 0;
var mspID = "";
		
var neighborSwitches = {};
var renamingCounters  = {};
var magicNames = {};
var switchPortDetails = {};

const apiLimit = 100;
const apiSiteLimit = 1000;
const apiGroupLimit = 20;
const apiMSPLimit = 10;

var currentWorkflow = "";
var autoAddPromise;
var autoLicensePromise;
var autoGroupPromise;
var autoSitePromise;
var autoRenamePromise;
var autoMagicRenamePromise;
var autoPortPromise;
var autoCustomerPromise;
var autoVariablesPromise;

var manualGroup = "";
var manualCustomer = "";

var existingPassphrase = "";
var wlanConfig = {};





/*  ----------------------------------------------------------------------------------
		Hydra functions
	---------------------------------------------------------------------------------- */

function getbaseURLforClientID(client_id) {
	baseURL = "";
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) baseURL = clusterCredentials[i].base_url;
	}
	return baseURL;
}

function getCentralURLforClientID(client_id) {
	baseURL = "";
	
	var centralName
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) {
			
			apiURL = clusterCredentials[i].base_url;
			console.log(apiURL);
			baseURL = centralURLs[0][apiURL];
		}
	}
	return baseURL;
}

function getAccessTokenforClientID(client_id) {
	accessToken = "";
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) accessToken = clusterCredentials[i].access_token;
	}
	return accessToken;
}

function getRefreshTokenforClientID(client_id) {
	refreshToken = "";
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) refreshToken = clusterCredentials[i].refresh_token;
	}
	return refreshToken;
}

function getClientSecretforClientID(client_id) {
	clientSecret = "";
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) clientSecret = clusterCredentials[i].client_secret;
	}
	return clientSecret;
}

function getNameforClientID(client_id) {
	name = "";
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) name = clusterCredentials[i].cluster_name;
	}
	return name;
}

function getClusterforClientID(client_id) {
	foundCluster = {};
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) foundCluster = clusterCredentials[i];
	}
	return foundCluster;
}

function updateClusterDetails(cluster) {
	clusterCredentials[checkForDuplicateCluster(cluster.client_id)] = cluster;
	localStorage.setItem('cluster_details', JSON.stringify(clusterCredentials));
}

function getAPIGateway(clusterName) {
	var apiURL = centralClusters[0][clusterName];
	return apiURL;
}

function getClusterName(url) {
	var clusterName = clusterNames[0][url];
	return clusterName;
}

function populateCentralClusters() {
	for (let k in centralClusters[0]) {
		$("#clusterselector").append($('<option>', {value: centralClusters[0][k],text: k}));
	}
		
}

function getCentralURLforSerial(serial) {
	var foundDevice = findDeviceInMonitoring(serial)
	return getCentralURLforClientID(foundDevice["client_id"])
}

function getCentralURLforMAC(macaddr) {
	var foundDevice = null;
	$.each(clients, function () {
		if (this["macaddr"] === macaddr) {
			foundDevice = this;
			return false; // break  out of the for loop
		}
	})
	return getCentralURLforClientID(foundDevice["client_id"])
}




/*  ----------------------------------------------------------------------------------
		Utility functions
	---------------------------------------------------------------------------------- */

function showLabCard(display) {
  var x = document.getElementById("lab-card");
  if (display) {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function showCustomerGroup() {
	var x = document.getElementById("addToGroup");
	if (document.getElementById("addToGroupCheckbox").checked) {
		x.style.display = "block";
	} else {
		x.style.display = "none";
	}
}

function onFinishSetup() {
	// Save all supplied addresses and details
	localStorage.setItem('ap_naming_format', $('#ap_naming_format').val());
	localStorage.setItem('port_variable_format', $('#port_variable_format').val());
	localStorage.setItem('refresh_rate', $('#refresh_rate').val());
	tokenRefreshForAll();
}

function loadMonitoringData(refreshrate) {
	// Check if we need to get the latest data - or can we just load it from localStorage
	
	if  (!localStorage.getItem('monitoring_update')) {
		console.log("Reading new monitoring data from Central");
		getMonitoringData();
	} else {
		var lastRefresh = new Date(parseInt(localStorage.getItem('monitoring_update')));
		var now = new Date;
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60))
		if (diffMinutes > refreshrate) {
			console.log("Reading new monitoring data from Central");
			getMonitoringData();
		} else {
			console.log("Reading monitoring data from local storage");
			
			downAPCount = 0;
			downSwitchCount = 0;
			downGatewayCount = 0;
			siteIssues = 4;
			
			aps =  JSON.parse(localStorage.getItem('monitoring_aps'));
			$.each(aps, function() {loadAPUI(this)});
			updateAPUI();
			switches = JSON.parse(localStorage.getItem('monitoring_switches'));
			$.each(switches, function() {loadSwitchUI(this)});
			updateSwitchUI();
			gateways = JSON.parse(localStorage.getItem('monitoring_gateways'));
			$.each(gateways, function() {loadGatewayUI(this)});
			updateGatewayUI();
			sites = JSON.parse(localStorage.getItem('monitoring_sites'));
			$.each(sites, function() {loadSiteUI(this)});
			updateSiteUI();
			groups = JSON.parse(localStorage.getItem('monitoring_groups'));
			$.each(groups, function() {loadGroupUI(this)});
			updateGroupUI();
			clients =  JSON.parse(localStorage.getItem('monitoring_wirelessClients'));
			clients =  clients.concat(JSON.parse(localStorage.getItem('monitoring_wiredClients')));
			$.each(clients, function() {loadClientsUI(this)});
			updateClientUI();
		}
	}
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

function noUnderscore(str) {
	return str.replace(/_/g, ' ');
}

function padNumber(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function cleanMACAddress(mac) {
	var currentMac = mac.trim();
	if (!currentMac.includes(":")) {
		// missing the colons - need to add
		currentMac = currentMac.replace(/..\B/g, '$&:')
	}
	return currentMac;
}



/*  ----------------------------------------------------------------------------------
		Notifications and Logging functions
	---------------------------------------------------------------------------------- */

function showNotification(icon, message, from, align, color) {
	
	var iconString = "central-icon "+icon;
	$.notify({
		icon: iconString,
		message: message
	}, {
		type: color,
		timer: 500,
		placement: {
			from: from,
			align: align
		}
	});
}

function logError(message) {
	var errorBody = document.getElementById("errorBody");
	var text = document.createTextNode("¥ " + message);
	errorBody.appendChild(text);
	var br = document.createElement("br");
	errorBody.appendChild(br);
	console.log(message);
	apiErrorCount++;
}

function showLog() {
	$('#ErrorModalLink').trigger('click');
}



/*  ----------------------------------------------------------------------------------
		CSV functions
	---------------------------------------------------------------------------------- */

function loadCSVFile(clickedRow) {
	$('#files').parse({
		config: {
			delimiter: ",",
			header: true,
			complete: processCSV
		},
		before: function(file, inputElem)
		{
			showNotification("ca-cpu", "Processing CSV File...", "bottom", "center", 'info');
		},
		error: function(err, file)
		{
			showNotification("ca-c-warning", err.message, "bottom", "center", 'danger');
		},
		complete: function()
		{
			authCounter = 0;
			authErrorCount = 0;
			authPromise = new $.Deferred();
			$.when(tokenRefreshForAll()).then(function () {
			
				if (clickedRow === "mgmt-group") {
					$('#AddGroupModalLink').trigger('click');
				} else if (clickedRow === "mgmt-customer") {
					showCustomerGroup();
					$('#AddCustomerModalLink').trigger('click');
				} else if (!csvData) {
					showNotification("ca-c-warning", "No CSV data found. Try selecting a CSV document.", "bottom", "center", 'danger');
					return false;	
				}
				// Clear error log
				var errorBody = document.getElementById("errorBody")
				while (errorBody.hasChildNodes()) {   
					errorBody.removeChild(errorBody.firstChild);
				}
				if (clickedRow === "adddevices") {
					currentWorkflow = "";
					addDevices();
				} else if (clickedRow === "licensedevices") {
					currentWorkflow = "";
					licenseDevices();
				} else if (clickedRow === "movetogroup") {
					currentWorkflow = "";
					if (csvContainsGroup() || manualGroup) {
						moveDevicesToGroup();
					} else {
						// missing group information in the CSV for some or all records
						$('#GroupModalLink').trigger('click');
					}
				} else if (clickedRow === "movetosite") {
					currentWorkflow = "";
					moveDevicesToSite();
				} else if (clickedRow === "renametemplate") {
					currentWorkflow = "";
					renameDevices();
				} else if (clickedRow === "autorenametemplate") {
					currentWorkflow = "";
					magicRenameDevices();
				} else if (clickedRow === "devicevariables") {
					currentWorkflow = "";
					updateDeviceVariables();
				} else if (clickedRow === "portdescriptions") {
					currentWorkflow = "";
					updatePortDescription();
				} else if (clickedRow === "auto-add-license") {	
					currentWorkflow = "auto-add-license";
					addAndLicense();
				} else if (clickedRow === "auto-add-group") {	
					currentWorkflow = "auto-add-group";
					if (csvContainsGroup() || manualGroup) {
						addAndGroup();
					} else {
						// missing group information in the CSV for some or all records
						$('#GroupModalLink').trigger('click');
					}
				} else if (clickedRow === "auto-add-license-group") {	
					currentWorkflow = "auto-add-license-group";
					if (csvContainsGroup() || manualGroup) {
						addLicenseGroup();
					} else {
						// missing group information in the CSV for some or all records
						$('#GroupModalLink').trigger('click');
					}
				} else if (clickedRow === "auto-site-rename") {
					currentWorkflow = "auto-site-rename";
					siteAndRename();
				} else  if (clickedRow === "auto-site-autorename") {
					currentWorkflow = "auto-site-autorename";
					siteAndAutoRename();
				} else  if (clickedRow === "auto-renameap-portdescriptions") {
					currentWorkflow = "auto-renameap-portdescriptions";
					renameAndPortDescriptions();
				} else if (clickedRow === "auto-site-autorenameap-portdescriptions") {
					currentWorkflow = "auto-site-autorenameap-portdescriptions";
					siteAndAutoRenameAndPortDescriptions();
				
					// MSP Functions
				} else if (clickedRow === "assigntocustomer") {
					currentWorkflow = "";
					if (csvContainsCustomer() || manualCustomer) {
						assignDevicesToCustomer();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				} else if (clickedRow === "assignalltocustomer") {
					currentWorkflow = "";
					if (manualCustomer) {
						assignAllDevicesToCustomer();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				} else if (clickedRow === "licenseToCustomers") {
					currentWorkflow = "";
					licenseCounter = 0;
					licenseDevicesFromCSV(true);
				} else if (clickedRow === "auto-add-customers") {
					currentWorkflow = "auto-add-customers";
					if (csvContainsCustomer() || manualCustomer) {
						addAndCustomers();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				} else if (clickedRow === "auto-add-customers-license") {
					currentWorkflow = "auto-add-customers-license";
					if (csvContainsCustomer() || manualCustomer) {
						addAndCustomersAndLicense();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				} else if (clickedRow === "auto-add-single") {
					currentWorkflow = "auto-add-single";
					if (manualCustomer) {
						addAndSingleCustomer();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				} else if (clickedRow === "auto-add-single-license") {
					currentWorkflow = "auto-add-single-license";
					if (manualCustomer) {
						addAndSingleCustomerAndLicense();
					} else {
						// missing group information in the CSV for some or all records
						$('#CustomerModalLink').trigger('click');
					}
				}
			});
		}
	});
}


function processCSV(results){
	apiErrorCount = 0;
	csvData = results.data;
}

function generateCSVForSite(clickedRow) {
	var select = document.getElementById("siteselector");
	var selectedSite = select.options[select.selectedIndex].text;
	var clientID = select.value;
	
	if (!selectedSite || selectedSite === "Select a site...") {
		showNotification("ca-c-warning", "Please select a Site before running a task", "bottom", "center", 'danger');
	} else {
	
		//CSV header
		var siteKey = "SITE"
		var serialKey = "SERIAL"
		var macKey = "MAC"
		var nameKey = "DEVICE NAME"
		var groupKey = "GROUP"
	
		// get APs for site
		csvData = [];
		$.each(aps, function() {
			if (this["site"] === selectedSite) {
				csvData.push({[nameKey]: this["name"], [serialKey]: this["serial"], [macKey]: this["macaddr"], [groupKey]: this["group_name"], [siteKey]: this["site"]});
			}  
		});
	
		$.each(switches, function() {
			if (this["site"] === selectedSite) {
				csvData.push({[nameKey]: this["name"], [serialKey]: this["serial"], [macKey]: this["macaddr"], [groupKey]: this["group_name"], [siteKey]: this["site"]});
			}  
		});
	
		$.each(gateways, function() {
			if (this["site"] === selectedSite) {
				csvData.push({[nameKey]: this["name"], [serialKey]: this["serial"], [macKey]: this["macaddr"], [groupKey]: this["group_name"], [siteKey]: this["site"]});
			}  
		});
	
	
		if (!csvData) {
			showNotification("ca-c-warning", "No site devices found. Try selecting a different site?", "bottom", "center", 'danger');
			return false;	
		}
		// Clear error log
		var errorBody = document.getElementById("errorBody")
		while (errorBody.hasChildNodes()) {   
			errorBody.removeChild(errorBody.firstChild);
		}
		if (clickedRow === "adddevices") {
			currentWorkflow = "";
			addDevices();
		} else if (clickedRow === "licensedevices") {
			currentWorkflow = "";
			licenseDevices();
		} else if (clickedRow === "movetogroup") {
			currentWorkflow = "";
			moveDevicesToGroup();
		} else if (clickedRow === "movetosite") {
			currentWorkflow = "";
			moveDevicesToSite();
		} else if (clickedRow === "renametemplate") {
			currentWorkflow = "";
			renameDevices();
		} else if (clickedRow === "autorenametemplate") {
			currentWorkflow = "";
			magicRenameDevices();
		} else if (clickedRow === "portdescriptions") {
			currentWorkflow = "";
			updatePortDescription();
		} else if (clickedRow === "auto-add-license") {	
			currentWorkflow = "auto-add-license";
			addAndLicense();
		} else if (clickedRow === "auto-add-license-group") {	
			currentWorkflow = "auto-add-license-group";
			addLicenseGroup();
		} else if (clickedRow === "auto-site-rename") {
			currentWorkflow = "auto-site-rename";
			siteAndRename();
		} else  if (clickedRow === "auto-site-autorename") {
			currentWorkflow = "auto-site-autorename";
			siteAndAutoRename();
		} else  if (clickedRow === "auto-renameap-portdescriptions") {
			currentWorkflow = "auto-renameap-portdescriptions";
			renameAndPortDescriptions();
		} else if (clickedRow === "auto-site-autorenameap-portdescriptions") {
			currentWorkflow = "auto-site-autorenameap-portdescriptions";
			siteAndAutoRenameAndPortDescriptions();
		} else if (clickedRow === "test-layer-one") {
			currentWorkflow = "test-layer-one";
			showLayerOne();
		}
	}
}


/*  ----------------------------------------------------------------------------------
		Group functions
	---------------------------------------------------------------------------------- */

function csvContainsGroup() {
	var containsGroup = true;
	$.each(csvData, function() {
		//console.log(this["GROUP"])
		if (!this["GROUP"]) {
			containsGroup = false;
			return false;
		}
	});
	return containsGroup;
}

function selectGroup() {
	var select = document.getElementById("groupselector");
	manualGroup = select.options[select.selectedIndex].text;
	document.getElementById('manualGroupParagraph').innerText = "Manual Group: " + manualGroup;
	var mgd = document.getElementById("manualGroupDiv");
    mgd.style.display = "block";
    showNotification("ca-folder-replace", "The "+manualGroup+" group will be used for devices with no group assigned. Please re-run the task.", "top", "center", 'warning');
}

function createGroup() {
	var groupName = document.getElementById("groupName").value;
	var groupPassword = document.getElementById("groupPassword").value;
	var wiredTemplate = document.getElementById("wiredTemplate").checked;
	var wirelessTemplate = document.getElementById("wirelessTemplate").checked;

	showNotification("ca-c-add", "Adding new Group...", "bottom", "center", 'info');
	
	var select = document.getElementById("groupaccountselector");
	var clientID = select.value;
	if (clusterCredentials.length == 1) {
		clientID = clusterCredentials[0]["client_id"];
	}
		
	var settings = {
		"url": api_url + "/tools/postCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/configuration/v2/groups",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"group": groupName, "group_attributes": {"group_password": groupPassword,"template_info": {"Wired": wiredTemplate,"Wireless": wirelessTemplate}}})
		})
	};

	$.ajax(settings).done(function (response) {
		//console.log(response)
		if (response === "Created") {
			Swal.fire({
					  title: 'Add Success',
					  text: 'Group was successfully created',
					  icon: 'success'
					});
			// refresh  data to include new group
			getMonitoringData();

		} else {
			Swal.fire({
					  title: 'Add Failure',
					  text: 'Group was not able to be created',
					  icon: 'error'
					});
		}
	});
}




/*  ----------------------------------------------------------------------------------
		Authentication functions
	---------------------------------------------------------------------------------- */
function tokenRefreshForAll() {
	showNotification("ca-padlock", "Authenticating with Central...", "bottom", "center", 'info');
	authCounter = 0;
	authErrorCount = 0;
	authPromise = new $.Deferred();
	
	var cluster_details = localStorage.getItem('cluster_details');
	if (cluster_details != null && cluster_details != "undefined") {
		clusterCredentials = JSON.parse(cluster_details);
		$.each(clusterCredentials, function() { 
			tokenRefresh(this["client_id"]);
		});
		return authPromise.promise();
	}
}

function checkAuthComplete() {
	if (authCounter >= clusterCredentials.length) {
		if (authErrorCount > 0) {
			$('#ErrorModalLink').trigger('click');
			Swal.fire({
			  title: 'Central API connection failed',
			  text: "One or more Central accounts failed to authenticate correctly",
			  icon: 'error'
			});
		} else {
			var path = window.location.pathname;
			var page = path.split("/").pop();
			if (page.includes('settings')) {
				Swal.fire({
				  title: 'Connected!',
				  text: 'Central API connection successful',
				  icon: 'success'
				});
			}
		}
		authPromise.resolve();
	}
}


function tokenRefresh(clientID) {
	var settings = {
	  "url": api_url + "/auth/refresh",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"client_id": clientID,
		"client_secret": getClientSecretforClientID(clientID),
		"access_token": getAccessTokenforClientID(clientID),
		"refresh_token": getRefreshTokenforClientID(clientID),
		"base_url": getbaseURLforClientID(clientID)
	  })
	};

	return $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	logError(response.error_description + ' for Central Account "'+ getNameforClientID(clientID) +'"')
		showNotification("ca-padlock", response.error_description + ' for Central Account "'+ getNameforClientID(clientID) +'"', "bottom", "center", 'danger');
		authErrorCount++;

	  } else {
	  	var cluster = getClusterforClientID(clientID);
	  	cluster['refresh_token'] = response.refresh_token;
		cluster['access_token'] = response.access_token;
		updateClusterDetails(cluster);
	  	
	  	var path = window.location.pathname;
		var page = path.split("/").pop();
		if (page.includes('settings')) {
			// refresh settings page table
			loadClusterDetails();
		}
	  }
	  authCounter++;
	  checkAuthComplete();
	}).fail(function(XMLHttpRequest, textStatus, errorThrown) 
	{
		//console.log("error")
		if (XMLHttpRequest.readyState == 4) {
			// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
			showNotification("ca-globe", XMLHttpRequest.statusText, "bottom", "center", 'danger');
		} else if (XMLHttpRequest.readyState == 0) {
			// Network error (i.e. connection refused, access denied due to CORS, etc.)
			showNotification("ca-globe", "Can not connect to API server", "bottom", "center", 'danger');
		} else {
			// something weird is happening
		}
		authErrorCount++;
		authCounter++;
		checkAuthComplete();
	});
}



/*  ----------------------------------------------------------------------------------
		Monitoring functions
	---------------------------------------------------------------------------------- */

function getMonitoringData() {

	// Try and refresh the token
	showNotification("ca-contactless-card", "Updating Monitoring Data...", "bottom", "center", 'info');
	
	var path = window.location.pathname;
	var page = path.split("/").pop();
	
	// Empty clients array
	clients = [];
	wirelessClients = [];
	wiredClients = [];
	if (document.getElementById("client_count")) document.getElementById("client_count").innerHTML = "0";
	$('#client-table').DataTable().rows().remove();
	
	downAPCount = 0;
	aps = [];
	$('#ap-table').DataTable().rows().remove();
	
	downSwitchCount = 0;
	switches = [];
	$('#switch-table').DataTable().rows().remove();
		
	downGatewayCount = 0;
	gateways = [];
	$('#gateway-table').DataTable().rows().remove();
	
	siteIssues = 4;
	sites = [];
	$('#site-table').DataTable().clear();
	
	if (page.includes('workflow-site')) {
		// remove old groups from the selector
		select = document.getElementById('siteselector');
		select.options.length = 0;
	}
	
	groups = [];
	$('#group-table').DataTable().rows().remove();
	if (page.includes('workflow-csv') || page.includes('workflow-psk') || page.includes('workflow-msp')) {
		// remove old groups from the selector
		select = document.getElementById('groupselector');
		select.options.length = 0;
	}
	
	// Refresh card data 	
	var cluster_details = localStorage.getItem('cluster_details');
	if (cluster_details != null && cluster_details != "undefined") {
		clusterCredentials = JSON.parse(cluster_details);
		$.each(clusterCredentials, function() { 	
			// Try and refresh the token for each clientID
			var clientID = this.client_id;
			var cluster = this
			var settings = {
			  "url": api_url + "/auth/refresh",
			  "method": "POST",
			  "timeout": 0,
			  "headers": {
				"Content-Type": "application/json"
			  },
			  "data": JSON.stringify({
				"client_id": this.client_id,
				"client_secret": this.client_secret,
				"access_token": this.access_token,
				"refresh_token": this.refresh_token,
				"base_url": this.base_url
			  })
			};

			$.ajax(settings).done(function (response) {
				if (response.hasOwnProperty('error')) {
					Swal.fire({
					  title: 'Central API connection failed',
					  text: response.error_description + " for Client ID: "+clientID,
					  icon: 'error'
					});
					
				} else {
					cluster['refresh_token'] = response.refresh_token;
					cluster['access_token'] = response.access_token;
					updateClusterDetails(cluster);
		 
					getAPData(clientID, 0, true);
					getSwitchData(clientID, 0, true);
					getGatewayData(clientID, 0);
					getSiteData(clientID, 0);
					getGroupData(clientID, 0);
				}
			});
		});
	}
}

function loadClientsUI (client) {
	var status = ""
	if (!client["health"]) {
		status = "<i class=\"fa fa-circle text-neutral\"></i>";
	} else if (client["health"] < 50) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
	} else if (client["health"] < 70) {
		status = "<i class=\"fa fa-circle text-warning\"></i>";
	} else {
		status = "<i class=\"fa fa-circle text-success\"></i>";
	}  
	// Generate clean data for table
	var site = "";
	if (client["site"]) site = client["site"];
	var health = "";
	if (client["health"]) health = client["health"];
	var associatedDevice = findDeviceInMonitoring(client["associated_device"]);
	var ip_address = "";
	if (client["ip_address"]) ip_address = client["ip_address"];
	var vlan = "";
	if (client["vlan"]) vlan = client["vlan"];
	var os_type = "";
	if (client["os_type"]) os_type = client["os_type"];

	// Add row to table
	var table = $('#client-table').DataTable();
	table.row.add([
		"<strong>"+client["name"]+"</strong>",
		status,
		client["macaddr"],	
		ip_address, 
		os_type, 
		associatedDevice.name,
		site,
		vlan,
		getNameforClientID(clientID)
	]);
	
	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add([
		"Client",
		"<strong>"+client["name"]+"</strong>",
		status,
		ip_address,
		client["macaddr"],
		site,
		"",	 
		os_type, 
		vlan,
		"",
		"",
		"",
		getNameforClientID(clientID)
	]);
}

function updateClientUI() {
	// Force reload of table data
	$('#client-table').DataTable().rows().draw();
	$('#universal-table').DataTable().rows().draw();
	
	var path = window.location.pathname;
	var page = path.split("/").pop();
	if (page.includes('clients')) {
		updateClientGraphs();
	}
	
	if (document.getElementById("client_count")) document.getElementById("client_count").innerHTML = "" + clients.length + "";
	
	$(document.getElementById('client_icon')).removeClass("text-warning");
	$(document.getElementById('client_icon')).removeClass("text-danger");
	$(document.getElementById('client_icon')).addClass("text-success");
}

function getWirelessClientData(clientID, offset) {
	showNotification("ca-laptop-1", "Getting wireless clients...", "bottom", "center", 'info');
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/monitoring/v1/clients/wireless?calculate_total=true&limit=" + apiLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('ap_icon')).addClass("text-warning");
	  	$(document.getElementById('ap_icon')).removeClass("text-success");
	  	$(document.getElementById('ap_icon')).removeClass("text-danger");

	  } else {
	  	$.each(response.clients, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		clients.push(this);
	  		wirelessClients.push(this);
	  		
	  		loadClientsUI(this);
		});
		
		if (offset+apiLimit <= response.total) getWirelessClientData(clientID,offset+apiLimit)
		else {
			updateClientUI()
			localStorage.setItem('monitoring_wirelessClients', JSON.stringify(wirelessClients));
		}
	  }
	});
}

function getWiredClientData(clientID,offset) {
	showNotification("ca-computer-monitor", "Getting wired clients...", "bottom", "center", 'info');
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/monitoring/v1/clients/wired?calculate_total=true&limit=" + apiLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('ap_icon')).addClass("text-warning");
	  	$(document.getElementById('ap_icon')).removeClass("text-success");
	  	$(document.getElementById('ap_icon')).removeClass("text-danger");
	  	if (document.getElementById("client_count")) document.getElementById("client_count").innerHTML = "-";

	  } else {
	  	$.each(response.clients, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		clients.push(this);
	  		wiredClients.push(this);
	  		
			loadClientsUI(this);
		});
		
		if (offset+apiLimit <= response.total) getWiredClientData(clientID,offset+apiLimit)
		else {
			updateClientUI()
			localStorage.setItem('monitoring_wiredClients', JSON.stringify(wiredClients));
		}
	  }
	});
}

function loadAPUI(ap) {
	if (ap["status"] != "Up") downAPCount++;
	var status = "<i class=\"fa fa-circle text-danger\"></i>";
	if (ap["status"] == "Up") {
		status = "<i class=\"fa fa-circle text-success\"></i>";
	}  

	// Add row to table
	var table = $('#ap-table').DataTable();
	table.row.add([
		"<strong>"+ap["name"]+"</strong>",
		status,	
		ap["ip_address"], 
		ap["model"], 
		ap["serial"],
		ap["firmware_version"],
		ap["site"],
		ap["group_name"],
		ap["macaddr"],
		getNameforClientID(clientID)
	]);
	
	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add([
		"AP",
		"<strong>"+ap["name"]+"</strong>",
		status,
		ap["ip_address"],
		ap["macaddr"],
		ap["site"],
		ap["group_name"],	 
		"", 
		"",
		ap["model"],
		ap["serial"],
		ap["firmware_version"],
		getNameforClientID(clientID)
	]);
}

function updateAPUI() {
	// Force reload of table data
	$('#ap-table').DataTable().rows().draw();
	$('#universal-table').DataTable().rows().draw();
	
	var path = window.location.pathname;
	var page = path.split("/").pop();
	if (page.includes('aps')) {
		updateAPStatistics();
	}
	
	if (document.getElementById("ap_count")) document.getElementById("ap_count").innerHTML = "" + aps.length + "";
	$(document.getElementById('ap_icon')).removeClass("text-warning");
	if (downAPCount > 0) {
		$(document.getElementById('ap_icon')).addClass("text-danger");
		$(document.getElementById('ap_icon')).removeClass("text-success");
	} else {
		$(document.getElementById('ap_icon')).removeClass("text-danger");
		$(document.getElementById('ap_icon')).addClass("text-success");
	}
}

function getAPData(clientID, offset, needClients) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/monitoring/v2/aps?calculate_total=true&limit=" + apiLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	return $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('ap_icon')).addClass("text-warning");
	  	$(document.getElementById('ap_icon')).removeClass("text-success");
	  	$(document.getElementById('ap_icon')).removeClass("text-danger");
	  	if (document.getElementById("ap_count")) document.getElementById("ap_count").innerHTML = "-";

	  } else {
	  	
	  	$.each(response.aps, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		aps.push(this);
	  		loadAPUI(this);
		});
		
		if (offset+apiLimit <= response.total) getAPData(clientID, offset+apiLimit, needClients)
		else {
			updateAPUI();
			localStorage.setItem('monitoring_aps', JSON.stringify(aps));
			// Grab wireless client data after grabbing APs (so we can match AP Serials to AP Names)
			if (needClients) getWirelessClientData(clientID,0);
		}
	  }
	});
}

function getAPs() {
	return aps;
}

function getAPsForSite(site) {
	var siteAPs = [];
	$.each(aps, function() {
		if (this["site"] === site) siteAPs.push(this);
	});
	return siteAPs;
}



// Switch Data Functions
function loadSwitchUI(device) {
	if (device["status"] != "Up") downSwitchCount++;
	var status = "<i class=\"fa fa-circle text-danger\"></i>";
	if (device["status"] == "Up") {
		status = "<i class=\"fa fa-circle text-success\"></i>";
		}  

	// Add row to table
	var table = $('#switch-table').DataTable();
	table.row.add([
		"<strong>"+device["name"]+"</strong>",
		status,	
		device["ip_address"], 
		device["model"], 
		device["serial"],
		device["firmware_version"],
		device["site"],
		device["group_name"],
		device["macaddr"],
		getNameforClientID(clientID)
	]);
	
	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add([
		"Switch",
		"<strong>"+device["name"]+"</strong>",
		status,
		device["ip_address"],
		device["macaddr"],
		device["site"],
		device["group_name"],	 
		"", 
		"",
		device["model"],
		device["serial"],
		device["firmware_version"],
		getNameforClientID(clientID)
	]);
}

function updateSwitchUI() {
	// Force reload of table data
	$('#switch-table').DataTable().rows().draw();
	$('#universal-table').DataTable().rows().draw();

	if (document.getElementById("switch_count")) document.getElementById("switch_count").innerHTML = "" + switches.length + "";
	  	
	$(document.getElementById('switch_icon')).removeClass("text-warning");
	if (downSwitchCount > 0) {
		$(document.getElementById('switch_icon')).addClass("text-danger");
		$(document.getElementById('switch_icon')).removeClass("text-success");
	} else {
		$(document.getElementById('switch_icon')).removeClass("text-danger");
		$(document.getElementById('switch_icon')).addClass("text-success");
	}
}



function getSwitchData(clientID, offset, needClients) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/monitoring/v1/switches?calculate_total=true&limit=" + apiLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-unlink", response.error_description, "top", "center", "danger");
	  	$(document.getElementById('switch_icon')).addClass("text-warning");
	  	$(document.getElementById('switch_icon')).removeClass("text-success");
	  	$(document.getElementById('switch_icon')).removeClass("text-danger");
	  	if (document.getElementById("switch_count")) document.getElementById("switch_count").innerHTML = "-";
	  } else {
	  	
	  	$.each(response.switches, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		switches.push(this);
	  		loadSwitchUI(this);
		});
		
		if (offset+apiLimit <= response.total) getSwitchData(clientID,offset+apiLimit, needClients)
		else {
			updateSwitchUI();
			localStorage.setItem('monitoring_switches', JSON.stringify(switches));
			// Grab wired client data after grabbing switches (so we can match switch Serials to AP Names)
			if (needClients) getWiredClientData(clientID,0);
		}
	  }
	});
}


// Gateway Data Functions
function loadGatewayUI(device) {
	if (device["status"] != "Up") downGatewayCount++;
	var status = "<i class=\"fa fa-circle text-danger\"></i>";
	if (device["status"] == "Up") {
		status = "<i class=\"fa fa-circle text-success\"></i>";
	} 

	// Add row to table
	var table = $('#gateway-table').DataTable();
	table.row.add([
		"<strong>"+device["name"]+"</strong>",
		status,	
		device["ip_address"], 
		device["model"], 
		device["serial"],
		device["firmware_version"],
		device["site"],
		device["group_name"],
		device["macaddr"],
		getNameforClientID(clientID)
	]);
	
	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add([
		"Gateway",
		"<strong>"+device["name"]+"</strong>",
		status,
		device["ip_address"],
		device["macaddr"],
		device["site"],
		device["group_name"],	 
		"", 
		"",
		device["model"],
		device["serial"],
		device["firmware_version"],
		getNameforClientID(clientID)
	]);
}

function updateGatewayUI() {
	// Force reload of table data
	$('#gateway-table').DataTable().rows().draw();
	$('#universal-table').DataTable().rows().draw();
	
	if (document.getElementById("gateway_count")) document.getElementById("gateway_count").innerHTML = "" + gateways.length + "";
	  $(document.getElementById('gateway_icon')).removeClass("text-warning");
	if (downGatewayCount > 0) {
		$(document.getElementById('gateway_icon')).addClass("text-danger");
		$(document.getElementById('gateway_icon')).removeClass("text-success");
	} else {
		$(document.getElementById('gateway_icon')).removeClass("text-danger");
		$(document.getElementById('gateway_icon')).addClass("text-success");
	}
}

function getGatewayData(clientID,offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/monitoring/v1/gateways?calculate_total=true&limit=" + apiLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-unlink", response.error_description, "top", "center", "danger");
	  	$(document.getElementById('gateway_icon')).addClass("text-warning");
	  	$(document.getElementById('gateway_icon')).removeClass("text-success");
	  	$(document.getElementById('gateway_icon')).removeClass("text-danger");
	  	if (document.getElementById("gateway_count")) document.getElementById("gateway_count").innerHTML = "-";
	  } else {
	  	
	  	$.each(response.gateways, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		gateways.push(this);
			loadGatewayUI(this);
			]);
		});
		
		if (offset+apiLimit <= response.total) getGatewayData(clientID,offset+apiLimit)
		else {
			updateGatewayUI();
			localStorage.setItem('monitoring_gateways', JSON.stringify(gateways));
		}
	  }
	});
}


// Site Data Functions
function loadSiteUI(site) {
	// Add row to table
	var table = $('#site-table').DataTable();
	
	var capestate = "";
	if (site["cape_state"] === "good") {
		capestate += "<i class=\"fa fa-circle text-success\"></i>";
		capestate += " No User Experience Issues"
	} else if (site["cape_state"]) {
		capestate += "<i class=\"fa fa-circle text-danger\"></i> ";
		capestate = titleCase(noUnderscore(site["cape_state_dscr"][0]));
	}
	
	var aiinsights = "";
	if (site["insight_hi"] != 0) {
		aiinsights += "<i class=\"fa fa-circle text-danger\"></i>";
	} 
	if (site["insight_mi"] != 0) {
		aiinsights += "<i class=\"fa fa-circle text-warning\"></i>";
	} 
	if (site["insight_lo"] != 0) {
		aiinsights += "<i class=\"fa fa-circle text-minor\"></i>";
	} 
	if (aiinsights === "") {
		aiinsights = "<i class=\"fa fa-circle text-neutral\"></i>";
	} 
	
	var status = "<i class=\"fa fa-circle text-success\"></i>";
	var healthReason = "";
	if (site["wan_uplinks_down"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Gateway with WAN links down";
		if (siteIssues > 1) siteIssues = 1;
	} else if (site["wan_tunnels_down"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Gateway with VPN Tunnels down";
		if (siteIssues > 1) siteIssues = 1;
	} 
	
	else if (site["wlan_cpu_high"] > 1) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "APs with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	} else if (site["wlan_cpu_high"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "AP with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	} 
	
	else if (site["wired_cpu_high"] > 1) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Switches with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	} else if (site["wired_cpu_high"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Switch with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	} 
	
	else if (site["branch_cpu_high"] > 1) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Gateways with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	} else if (site["branch_cpu_high"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "Gateway with high CPU usage";
		if (siteIssues > 1) siteIssues = 1;
	}  
	
	else if (site["wlan_device_status_down"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "One or more APs are down";
		if (siteIssues > 1) siteIssues = 1;
	} else if (site["wired_device_status_down"] > 0) {
		status = "<i class=\"fa fa-circle text-danger\"></i>";
		healthReason = "One or more switches are down";
		if (siteIssues > 1) siteIssues = 1;
	} 
	
	else if (site["device_high_noise_5ghz"] > 0) {
		status = "<i class=\"fa fa-circle text-warning\"></i>";
		healthReason = "High noise on 5GHz";
		if (siteIssues > 2) siteIssues = 2;
	} else if (site["device_high_noise_2_4ghz"] > 0) {
		status = "<i class=\"fa fa-circle text-warning\"></i>";
		healthReason = "High noise on 2.4GHz";
		if (siteIssues > 2) siteIssues = 2;
	} else if (site["device_high_ch_5ghz"] > 0) {
		status = "<i class=\"fa fa-circle text-warning\"></i>";
		healthReason = "High channel utilization on 5GHz";
		if (siteIssues > 2) siteIssues = 2;
	} else if (site["device_high_ch_2_4ghz"] > 0) {
		status = "<i class=\"fa fa-circle text-warning\"></i>";
		healthReason = "High channel utilization on 2.4GHz";
		if (siteIssues > 2) siteIssues = 2;
	} 
	
	else if (site["device_high_mem"] > 0) {
		status = "<i class=\"fa fa-circle text-minor\"></i>";
		healthReason = "Devices with high memory utilization";
		if (siteIssues > 3) siteIssues = 3;
	}
	
	table.row.add([
		"<strong>"+site["name"]+"</strong>",
		status,	
		site["device_up"], 
		site["device_down"], 
		site["connected_count"],
		capestate,
		aiinsights,
		healthReason,
		getNameforClientID(clientID)
	]);
	
	var path = window.location.pathname;
	var page = path.split("/").pop();
	if (page.includes('workflow-site')) {
		// Add site to the dropdown selector
		$("#siteselector").append($('<option>', {value: site["name"],text: site["name"]}));
		if ($(".selectpicker").length != 0) {
		  setTimeout(function () {
			 $('.selectpicker').selectpicker('refresh');   // refresh the selectpicker with fetched courses
			}, 100);
		}
	}
}

function updateSiteUI() {
	// Force reload of table data
	$('#site-table').DataTable().rows().draw();
	if (document.getElementById("site_count")) document.getElementById("site_count").innerHTML = "" + sites.length + "";
	  	
	if (siteIssues == 1) {
		$(document.getElementById('site_icon')).addClass("text-danger");
		$(document.getElementById('site_icon')).removeClass("text-warning");
		$(document.getElementById('site_icon')).removeClass("text-minor");
		$(document.getElementById('site_icon')).removeClass("text-primary");
	} else if (siteIssues == 2) {
		$(document.getElementById('site_icon')).removeClass("text-danger");
		$(document.getElementById('site_icon')).addClass("text-warning");
		$(document.getElementById('site_icon')).removeClass("text-minor");
		$(document.getElementById('site_icon')).removeClass("text-primary");
	} else if (siteIssues == 3) {
		$(document.getElementById('site_icon')).removeClass("text-danger");
		$(document.getElementById('site_icon')).removeClass("text-warning");
		$(document.getElementById('site_icon')).addClass("text-minor");
		$(document.getElementById('site_icon')).removeClass("text-primary");
	} else if (siteIssues == 4) {
		$(document.getElementById('site_icon')).removeClass("text-danger");
		$(document.getElementById('site_icon')).removeClass("text-warning");
		$(document.getElementById('site_icon')).removeClass("text-minor");
		$(document.getElementById('site_icon')).addClass("text-primary");
	}
}

function getSiteData(clientID, offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/branchhealth/v1/site?limit=" + apiSiteLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-unlink", response.error_description, "top", "center", "danger");
	  	if (document.getElementById("site_count")) document.getElementById("site_count").innerHTML = "-";
	  	$(document.getElementById('site_icon')).addClass("text-warning");
	  	$(document.getElementById('site_icon')).removeClass("text-primary");
	  } else {
	  	
	  	var path = window.location.pathname;
		var page = path.split("/").pop();

	  	
	  	$.each(response.items, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		sites.push(this);
			loadSiteUI(this);
		});
	  	
	  	if (offset+apiSiteLimit <= response.total) {
	  		getSiteData(clientID, offset+apiSiteLimit);
		} else {
			updateSiteUI();
			localStorage.setItem('monitoring_sites', JSON.stringify(sites));
		}
	  }
	});
}


// Group Data Functions
function loadGroupUI(group) {
	// Add row to table
	var table = $('#group-table').DataTable();
	table.row.add([[this], getNameforClientID(clientID)]);

	var path = window.location.pathname;
	var page = path.split("/").pop();
	if (page.includes('workflow-csv') || page.includes('workflow-psk') || page.includes('workflow-msp')) {
		// Add site to the dropdown selector
		$("#groupselector").append($('<option>', {value: clientID,text: group}));
		if ($(".selectpicker").length != 0) {
			$('.selectpicker').selectpicker('refresh');
		}
	}
}

function updateGroupUI() {
	// Force reload of table data
	$('#group-table').DataTable().rows().draw();
	
	if (document.getElementById("group_count")) document.getElementById("group_count").innerHTML = "" + groups.length + "";
	$(document.getElementById('group_icon')).addClass("text-primary");
	$(document.getElementById('group_icon')).removeClass("text-warning");
}

function getGroupData(clientID, offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/configuration/v2/groups?limit=" + apiGroupLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-unlink", response.error_description, "top", "center", "danger");
	  	$(document.getElementById('group_icon')).addClass("text-warning");
	  	$(document.getElementById('group_icon')).removeClass("text-primary");
	  } else {
	  	
	  	var path = window.location.pathname;
		var page = path.split("/").pop();
		
	  	$.each(response.data, function() {
	  		// add client ID to record and store
	  		this["client_id"] = clientID;
	  		groups.push(this);
			loadGroupUI(this);
		});
	  	
	  	if (offset+apiGroupLimit <= response.total) getGroupData(clientID,offset+apiGroupLimit)
		else {
	  		updateGroupUI();
			localStorage.setItem('monitoring_groups', JSON.stringify(groups));
	  	}
	  }
	});
}






/*  ----------------------------------------------------------------------------------
		Inventory functions
	---------------------------------------------------------------------------------- */

function getAPInventory(clientID, offset) {
	/*  
		Grab ap inventory
		(loop while there are still items to get)
	*/
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/devices?sku_type=IAP&limit=" + apiLimit + "&offset=" + offset,
			"access_token": getAccessTokenforClientID(clientID)
		}),
		"complete": function () {
    		if (apInventory.length == apInventoryCount[clientID]) {
    			apPromiseTracker[clientID].resolve();
	  		}
    	}
	};
	
      
   $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
		showNotification("ca-unlink", response.error_description, "top", "center", "danger");
		$(document.getElementById('group_icon')).addClass("text-warning");
		$(document.getElementById('group_icon')).removeClass("text-primary");
	  } else {
		if (offset == 0) {
			apInventoryCount[clientID] = response.total;
		}
		$.each(response.devices, function () {
			// attach the clientID to each device for future reference
			this["client_id"] = clientID;
	  		apInventory.push(this);
		})
		
		if (offset+apiLimit <= response.total) getAPInventory(clientID, offset+apiLimit) // if there are still objects to get
		//console.log(apInventory)
	  }
	});
	
	return apPromiseTracker[clientID].promise();
}

function getSwitchInventory(clientID, offset) {
	/*  
		Grab switch inventory
		(loop while there are still items to get)
	*/
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/devices?sku_type=switch&limit=" + apiLimit + "&offset=" + offset,
			"access_token": getAccessTokenforClientID(clientID)
		}),
		"complete": function () {
    		if (switchInventory.length == switchInventoryCount[clientID]) {
    			switchPromiseTracker[clientID].resolve();
	  		}
    	}
	};
	
       
   $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
		showNotification("ca-unlink", response.error_description, "top", "center", "danger");
		$(document.getElementById('group_icon')).addClass("text-warning");
		$(document.getElementById('group_icon')).removeClass("text-primary");
	  } else {
		if (offset == 0) {
			switchInventoryCount[clientID] = response.total;
		}
		$.each(response.devices, function () {
			// attach the clientID to each device for future reference
			this["client_id"] = clientID;
	  		switchInventory.push(this);
		})
		if (offset+apiLimit <= response.total) getSwitchInventory(clintID, offset+apiLimit) // if there are still objects to get
	  }
	});
	
	return switchPromiseTracker[clientID].promise();
}

function getGatewayInventory(clientID, offset) {
	/*  
		Grab gateway inventory
		(loop while there are still items to get)
	*/
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/devices?sku_type=gateway&limit=" + apiLimit + "&offset=" + offset,
			"access_token": getAccessTokenforClientID(clientID)
		}),
		"complete": function () {
    		if (gatewayInventory.length == gatewayInventoryCount[clientID]) {
	  			gatewayPromiseTracker[clientID].resolve();
	  		}
    	}
	};
	
      
   $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
		showNotification("ca-unlink", response.error_description, "top", "center", "danger");
		$(document.getElementById('group_icon')).addClass("text-warning");
		$(document.getElementById('group_icon')).removeClass("text-primary");
	  } else {
		if (offset == 0) {
			gatewayInventoryCount[clientID] = response.total;
		}
		$.each(response.devices, function () {
			// attach the clientID to each device for future reference
			this["client_id"] = clientID;
	  		gatewayInventory.push(this);
		})
		if (offset+apiLimit <= response.total) getGatewayInventory(clientID, offset+apiLimit) // if there are still objects to get
		//console.log(apInventory)
	  }
	});
	
	return gatewayPromiseTracker[clientID].promise();
}

function updateInventory() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification("ca-stock-2", "Obtaining device inventories...", "bottom", "center", 'info');
	// Get the device inventories (IAP, Switch, Gateway) for each ClientID to determine device type

	var cluster_details = localStorage.getItem('cluster_details');
	if (cluster_details != null && cluster_details != "undefined") {
		clusterCredentials = JSON.parse(cluster_details);
		inventoryCompleteCounter = 0;
		apInventory = [];
		switchInventory = [];
		gatewayInventory = [];
		$.each(clusterCredentials, function() { 
			// Try and refresh the token for each clientID
			var clientID = this.client_id;
			
			console.log("Getting inventory for "+clientID)	
			// Store promises for each clientID
			apPromiseTracker[clientID] = new $.Deferred();
			switchPromiseTracker[clientID] = new $.Deferred();
			gatewayPromiseTracker[clientID] = new $.Deferred();
			
			$.when(getAPInventory(clientID, 0), getSwitchInventory(clientID, 0), getGatewayInventory(clientID, 0)).then(function () {
				//console.log('Got ALL Inventories for the clientID');
				inventoryCompleteCounter++;
				
				// check if all inventories have been received for all clientIDs
				if (inventoryCompleteCounter >= clusterCredentials.length) inventoryPromise.resolve();
			});
		});
	}
	return inventoryPromise.promise();
}



/*  ----------------------------------------------------------------------------------
		Searching functions
	---------------------------------------------------------------------------------- */

function findDeviceInInventory(currentSerial) {
	/*  
		Search through all inventories 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = ""; 
	var foundDevice = null;
	$.each(apInventory, function () {
		if (this["serial"] === currentSerial) {
			foundDevice = this;
			deviceType = "IAP"; 
			return false; // break  out of the for loop
		}
	})
	
	// Check Switches
	if (!foundDevice) {
		$.each(switchInventory, function () {
			if (this["serial"] === currentSerial) {
				foundDevice = this;
				deviceType = "SWITCH";
				return false; // break  out of the for loop
			}
		})	
	}
	
	// Check Gateways
	if (!foundDevice) {
		$.each(gatewayInventory, function () {
			if (this["serial"] === currentSerial) {	
				foundDevice = this;						
				deviceType = "CONTROLLER";
				return false; // break  out of the for loop
			}
		})
	}
	
	return foundDevice;
}

function findDeviceInMonitoring(currentSerial) {
	/*  
		Search through all monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = ""; 
	var foundDevice = null;
	$.each(aps, function () {
		if (this["serial"] === currentSerial) {
			foundDevice = this;
			deviceType = "IAP"; 
			return false; // break  out of the for loop
		}
	})
	
	// Check Switches
	if (!foundDevice) {
		$.each(switches, function () {
			if (this["serial"] === currentSerial) {
				foundDevice = this;
				deviceType = "SWITCH";
				return false; // break  out of the for loop
			}
		})	
	}
	
	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function () {
			if (this["serial"] === currentSerial) {	
				foundDevice = this;						
				deviceType = "CONTROLLER";
				return false; // break  out of the for loop
			}
		})
	}
	
	if (!foundDevice) {
		$.each(mspAPs, function () {
			if (this["serial"] === currentSerial) {	
				foundDevice = this;						
				deviceType = "IAP";
				return false; // break  out of the for loop
			}
		})
	}
	
	if (!foundDevice) {
		$.each(mspSwitches, function () {
			if (this["serial"] === currentSerial) {	
				foundDevice = this;						
				deviceType = "SWITCH";
				return false; // break  out of the for loop
			}
		})
	}
	
	if (!foundDevice) {
		$.each(mspGateways, function () {
			if (this["serial"] === currentSerial) {	
				foundDevice = this;						
				deviceType = "CONTROLLER";
				return false; // break  out of the for loop
			}
		})
	}
	
	return foundDevice;
}





/*  ----------------------------------------------------------------------------------
		Add functions
	---------------------------------------------------------------------------------- */

function addDevices() {
	addCounter = 0;
	showNotification("ca-c-add", "Adding devices...", "bottom", "center", 'info');
		
	var devices = [];
	$.each(csvData, function() {
	
		if (!this["SERIAL"] && !this["MAC"]) { return false; }

		devices.push({"mac": cleanMACAddress(this["MAC"]), "serial": this["SERIAL"].trim() });
		
	});
	
	var settings = {
		"url": api_url + "/tools/postCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/device_inventory/v1/devices",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify(devices)
			//"data": JSON.stringify([{"mac": cleanMACAddress(this["MAC"]), "serial": this["SERIAL"].trim() }])
		})
	};

	$.ajax(settings).done(function (response) {
		if (response.hasOwnProperty("error_code")) {
			logError(response.description);
		} else if (response.hasOwnProperty("message")) {
			if (response.message === "API rate limit exceeded")
				Swal.fire({
					  title: 'API Limit',
					  text: 'Daily API limit reached',
					  icon: 'error'
					});
			if (response.code === "ATHENA_ERROR_NO_DEVICE") {
				// device not added - find the reason
				if (response.message.invalid_device.length > 0) {
				   // invalid device - log reason
				   if (response.message.invalid_device[0].status === "ATHENA_ERROR_DEVICE_ALREADY_EXIST") {
					   logError('Device with Serial number "'+response.message.invalid_device[0].serial+'" is already added to Central');
				   }
				} else if (response.message.blocked_device.length > 0) {
				   // blocked device - log reason
				   logError('Device with Serial number "'+response.message.blocked_device[0].serial+'" is blocked from being added to your Central account');
				}
			}
		}
		addCounter = addCounter + 1;
		if (addCounter == csvData.length) {
			if (currentWorkflow === "") {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
					  title: 'Add Failure',
					  text: 'Some or all devices failed to be added to Central',
					  icon: 'error'
					});
				} else {
					Swal.fire({
					  title: 'Add Success',
					  text: 'All devices were added to Central',
					  icon: 'success'
					});
				}
			} else {
				// complete the Add part of the automation
				console.log("Automation: Adding devices complete")
				autoAddPromise.resolve();
			}
		}
	});
		
	if (currentWorkflow !== "") {
		return autoAddPromise.promise();
	}
}



/*  ----------------------------------------------------------------------------------
		Licensing functions
	---------------------------------------------------------------------------------- */
function checkForLicensingCompletion() {
	if (licenseCounter == csvData.length) {
		if (currentWorkflow === "") {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'License Failure',
				  text: 'Some or all devices failed to be licensed',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Add Success',
				  text: 'All devices were assigned licenses',
				  icon: 'success'
				});
			}
		} else {
			console.log("Automation: Licensing complete")
			autoLicensePromise.resolve();
		}
	}
}

function licenseDevicesFromCSV(msp) {
	showNotification("ca-license-key", "Licensing devices...", "bottom", "center", 'info');
	$.each(csvData, function() {
		// find device in inventory to get device type
		var currentSerial = this["SERIAL"].trim();
		if (currentSerial === "") return true;
		var requestedLicense = this["LICENSE"].trim();
		if (!requestedLicense) requestedLicense = "foundation"
		var license = "";
		
		// Find the device and type
		var foundDevice = findDeviceInInventory(currentSerial);
		if (msp) {
			foundDevice = findDeviceInMonitoring(currentSerial);
		}
		
		
		if (deviceType === "IAP") {
			if (requestedLicense.toLowerCase().includes('foundation')) {
				license = 'foundation_ap';
			} else {
				license = 'advanced_ap';
			}
		} else if (deviceType === "SWITCH") {
			// Check Switches
			if (requestedLicense.toLowerCase().includes('foundation')) {
				license = 'foundation_switch_';
			} else {
				license = 'advanced_switch_';
			}
			// check the license skus at https://internal-apigw.central.arubanetworks.com/platform/licensing/v1/services/config
			// Grab switch model from 
			if (foundDevice["aruba_part_no"].includes("83") || foundDevice["aruba_part_no"].includes("84")) {
				license = license + "8300";
			} else if (foundDevice["aruba_part_no"].includes("6400") || foundDevice["aruba_part_no"].includes("54")) {
				license = license + "6400";
			} else if (foundDevice["aruba_part_no"].includes("6300") || foundDevice["aruba_part_no"].includes("38")) {
				license = license + "6300";
			} else if (foundDevice["aruba_part_no"].includes("6100") || foundDevice["aruba_part_no"].includes("25")) {
				license = license + "6100";
			} else if (foundDevice["aruba_part_no"].includes("6200") || foundDevice["aruba_part_no"].includes("29")) {
				license = license + "6200";
			}
		} else if (deviceType === "CONTROLLER") {
			// Check Gateways
			if (requestedLicense.toLowerCase().includes('wlan')) {
				license = 'foundation_wlan_gw';
			} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation-base')) {
				license = 'foundation_base_90xx_sec';
			} else if (requestedLicense.toLowerCase().includes('foundation-base')) {
				license = 'foundation_base_7005';
			} else if (requestedLicense.toLowerCase().includes('advance-base')) {
				license = 'advance_base_7005';
			} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation') && ((foundDevice["aruba_part_no"].includes("70")) || (foundDevice["aruba_part_no"].includes("90")))) {
				license = 'foundation_90xx_sec';
			} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && ((foundDevice["aruba_part_no"].includes("70")) || (foundDevice["aruba_part_no"].includes("90")))) {
				license = 'advance_90xx_sec';
			} else if (requestedLicense.toLowerCase().includes('foundation') && ((foundDevice["aruba_part_no"].includes("70")) || (foundDevice["aruba_part_no"].includes("90")))) {
				license = 'foundation_70xx';
			} else if (requestedLicense.toLowerCase().includes('advanced') && ((foundDevice["aruba_part_no"].includes("70")) || (foundDevice["aruba_part_no"].includes("90")))) {
				license = 'advance_70xx';
			} else if (requestedLicense.toLowerCase().includes('foundation') && foundDevice["aruba_part_no"].includes("72")) {
				license = 'foundation_72xx';
			} else if (requestedLicense.toLowerCase().includes('advanced') && foundDevice["aruba_part_no"].includes("72")) {
				license = 'advance_72xx';
			}
		}
		
		if (!foundDevice) {
			logError("Device with Serial Number: " + currentSerial + " was not found in the device inventory");
			licenseCounter = licenseCounter + 1;
			checkForLicensingCompletion();
		} else {
	
			// Update licensing
			var settings = {
				"url": api_url + "/tools/postCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": getbaseURLforClientID(clientID) + "/platform/licensing/v1/subscriptions/assign",
					"access_token": getAccessTokenforClientID(clientID),
					"data": JSON.stringify({"serials": [ currentSerial ], "services": [ license ] })
				})
			};

			$.ajax(settings).done(function (response) {
				//console.log(response)
				if (Array.isArray(response.status)) {
					if (response.status[0].message.msg) {
						logError(response.status[0].message.msg);
					} else { 
						logError(titleCase(noUnderscore(response.status[0].error_code)) + " ("+currentSerial+")");
					}
				}
				licenseCounter = licenseCounter + 1;
				checkForLicensingCompletion();
			});
		}
	});
	if (currentWorkflow !== "") {
		return autoLicensePromise.promise();
	}
}


function licenseDevices() {
	/*  
		Grab all 3 inventories from API.  
		Scan though  each inventory to find the device.
		Generate the require license string
		Assign license.
	*/
	licenseCounter = 0;
	
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function () {
		licenseDevicesFromCSV(false);
	});
	if (currentWorkflow !== "") {
		return autoLicensePromise.promise();
	}
}


/*  ----------------------------------------------------------------------------------
		Group functions
	---------------------------------------------------------------------------------- */

function moveDevicesToGroup() {
	/*  
		Move each device to the correct group
	*/
	showNotification("ca-folder-replace", "Moving devices into groups...", "bottom", "center", 'info');
	moveCounter = 0;
	$.each(csvData, function() {
		var selectedGroup = manualGroup;
		if (this["GROUP"].trim()) selectedGroup = this["GROUP"].trim();
		var settings = {
			"url": api_url + "/tools/postCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": getbaseURLforClientID(clientID) + "/configuration/v1/devices/move",
				"access_token": getAccessTokenforClientID(clientID),
				"data": JSON.stringify({"group": selectedGroup, "serials": [ this["SERIAL"].trim() ] })
			})
		};

		$.ajax(settings).done(function (response) {
			if (response.hasOwnProperty("error_code")) {
				logError(response.description);
			}
			moveCounter = moveCounter + 1;
			if (moveCounter == csvData.length) {
				if (currentWorkflow === "")  {
					if (apiErrorCount != 0) {
						$('#ErrorModalLink').trigger('click');
						Swal.fire({
						  title: 'Move Failure',
						  text: 'Some or all devices failed to move to the specified group',
						  icon: 'error'
						});
					} else {
						Swal.fire({
						  title: 'Move Success',
						  text: 'All devices were to moved to the specified groups',
						  icon: 'success'
						});
					}
					//console.log(manualGroup)
					if (manualGroup) {
						manualGroup = "";
						var mgd = document.getElementById("manualGroupDiv");
    					mgd.style.display = "none";
					}
				} else {
					console.log("Automation: Move to Group complete")
					autoGroupPromise.resolve();
				}
			}
		});
	});
	if (currentWorkflow !== "") {
		return autoGroupPromise.promise();
	}
}



/*  ----------------------------------------------------------------------------------
		Site functions
	---------------------------------------------------------------------------------- */
function unassignDeviceFromSite(device) {
	/*  
		remove the device from its current site
	*/
	console.log('removing site from device: ' + device['serial'] + ' from ' + getIDforSite(device['site']));
	var settings = {
		"url": api_url + "/tools/deleteCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/central/v2/sites/associate",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"device_id": device['serial'], "device_type": deviceType, "site_id": parseInt(getIDforSite(device['site']))})
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.hasOwnProperty("error_code")) {
			logError(response.description);
		} else if (response.success[0].device_id === device['serial']) {
			console.log("Device removed from site: " + response.success[0].device_id);
		} else {
			logError("Unable to remove " +  device['serial'] + " from it's current site");
		}
	});
}

function assignDeviceToSite(device, site) {
	/*  
		assigning the device to a site
	*/
	console.log('assigning site ' + site + ' from device: ' + device['serial']);
	var settings = {
		"url": api_url + "/tools/postCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/central/v2/sites/associate",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"device_id": device['serial'], "device_type": deviceType, "site_id": site})
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.status !== "200") {
			logError(device + " was not assigned to site " + site);
		}
		moveCounter = moveCounter + 1;
		checkForSiteMoveCompletion();
	});
}

function getIDforSite(site) {
	/*  
		get site from sites monitoring data
		return site_id for matching site
	*/
	var siteId = -1;  // used when the site isn't found
	//console.log('looking for site: '+site)
	$.each(sites, function() { 
		if (this['name'] === site) {
			siteId = this['id'];
			return false;
		}
	});
	return siteId;
}

function checkForSiteMoveCompletion() {
	if (moveCounter == csvData.length) {
		if (currentWorkflow  === "") {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Move to Site Failure',
				  text: 'Some or all devices failed to be moved to the correct sites',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Add Success',
				  text: 'All devices were moved to the correct sites',
				  icon: 'success'
				});
			}
		} else {
			console.log("Automation: Site assignment complete")
			autoSitePromise.resolve();
		}
	}
}

function moveDevicesToSite() {
	/*  
		get site from sites data
		get device from correct device data
		check if device is in a site
		if yes, and the correct site - do nothing :)
		if yes, but not the correct site, unassign device from old site
		assign new site
	*/

	showNotification("ca-world-pin", "Moving devices into sites...", "bottom", "center", 'info');
	moveCounter = 0;
	// Get the device monitoring data (IAP, Switch, Gateway) to determine device type
	$.each(csvData, function() {
		// find device in inventory to get device type
		var currentSerial = this["SERIAL"].trim();
		var currentSite = this["SITE"].trim();
		if (!currentSite) {
			logError("Device with Serial Number: " + currentSerial + " has no site name in the CSV file");
			moveCounter = moveCounter + 1;
			checkForSiteMoveCompletion();
		} else {
			var found = false;
			// Check APs
			// Find the device and type
			var foundDevice = findDeviceInMonitoring(currentSerial);
		
			if (!foundDevice) {
				logError("Device with Serial Number: " + currentSerial + " was not found in the device monitoring");
				moveCounter = moveCounter + 1;	
				checkForSiteMoveCompletion();
			} else {
				if (!foundDevice['site']) {
					console.log("Not assigned to site")
					// add device to site
					siteId = getIDforSite(currentSite);
					if (siteId != -1) {
						assignDeviceToSite(foundDevice, siteId);
					} else {
						logError("Device with Serial Number: " + currentSerial + " could not be assigned to an unknown site");
						moveCounter = moveCounter + 1;
						checkForSiteMoveCompletion();
					}
				
				} else if (foundDevice['site'] !== currentSite) {
					// remove from old site,  then add to new site
					console.log("Unassign from site!")
					$.when(unassignDeviceFromSite(foundDevice)).then(function () {
					
						siteId = getIDforSite(currentSite);
						if (siteId != -1) {
							assignDeviceToSite(foundDevice, siteId);
						} else {
							logError("Device with Serial Number: " + currentSerial + " could not be assigned to an unknown site");
							moveCounter = moveCounter + 1;
							checkForSiteMoveCompletion();
						}
					});
				} else  {
					// no need to move the device. It's already in the correct site
					moveCounter = moveCounter + 1;
					checkForSiteMoveCompletion();
				}
			}
		}
		
	});
	if (currentWorkflow !== "") {
		return autoSitePromise.promise();
	}
}


/*  ----------------------------------------------------------------------------------
		Renaming functions
	---------------------------------------------------------------------------------- */
function checkForRenameCompletion() {
	if (renameCounter == csvData.length) {
		if (currentWorkflow === "") {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Renaming Failure',
				  text: 'Some or all devices failed to be renamed',
				  icon: 'error'
				});	
			} else {
				Swal.fire({
				  title: 'Renaming Success',
				  text: 'All devices were renamed',
				  icon: 'success'
				});
			}
		} else if (currentWorkflow === "auto-site-rename"){
			console.log("Automation: Renaming complete")
			autoRenamePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorename"){
			console.log("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorenameap-portdescriptions"){
			console.log("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		}
	}
}

function renameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/
	            
	renameCounter = 0;
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function () {
		showNotification("ca-card-update", "Renaming devices...", "bottom", "center", 'info');
	
		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this["SERIAL"].trim();
			var newHostname = this["DEVICE NAME"].trim();
			if (!newHostname) {
				logError("Device with Serial Number: " + currentSerial + " has no hostname in the CSV file");
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			} else {
				var device = findDeviceInInventory(currentSerial);
				if  (!device) {
					logError("Unable to find device " +  currentSerial + " in the device inventory");
					apiErrorCount++;
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else if (deviceType === "IAP") {
			
					// if AP then get AP settings
					var settings = {
						"url": api_url + "/tools/getCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": getbaseURLforClientID(clientID) + "/configuration/v2/ap_settings/" + currentSerial,
							"access_token": getAccessTokenforClientID(clientID)
						})
					};

					$.ajax(settings).done(function (response) {
					  //console.log(response);
					  if (response.hasOwnProperty('error_code')) {
						logError(response.description)
						apiErrorCount++;			
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();		
					  } else if (response.hostname === newHostname) {
					  	// no need to do anything as the name already matches
					  	console.log("Device " + currentSerial + " hostname doesn't need to be updated");
					  	renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					  } else {
					  		// Update ap settings
							var settings = {
								"url": api_url + "/tools/postCommand",
								"method": "POST",
								"timeout": 0,
								 "headers": {
									"Content-Type": "application/json"
								},
								"data": JSON.stringify({
									"url": getbaseURLforClientID(clientID) + "/configuration/v2/ap_settings/" + currentSerial,
									"access_token": getAccessTokenforClientID(clientID),
									"data": JSON.stringify({"achannel": response.achannel, 
															"atxpower": response.atxpower, 
															"dot11a_radio_disable": response.dot11a_radio_disable,
															"dot11g_radio_disable": response.dot11g_radio_disable,
															"gchannel": response.gchannel,
															"gtxpower": response.gtxpower,
															"ip_address": response.ip_address,
															"usb_port_disable": response.usb_port_disable,
															"zonename": response.zonename,
															"hostname": newHostname})
								})
							};

							$.ajax(settings).done(function (response) {
								if (response !== currentSerial) {
									logError(device + " was not renamed")
									//console.log(response.reason);
									apiErrorCount++;
								}
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							});
						}
					});
				} else if (deviceType === "SWITCH") {
			
					// patch the switch template variables
					var settings = {
						"url": api_url + "/tools/patchCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": getbaseURLforClientID(clientID) + "/configuration/v1/devices/" + currentSerial + "/template_variables",
							"access_token": getAccessTokenforClientID(clientID),
							"data": JSON.stringify({"total": 1, "variables": {"_sys_hostname": newHostname}})
						})
					};

					$.ajax(settings).done(function (response) {
						if (response !== "Success") {
							logError("The switch "+ currentSerial  + " was not able to be renamed")
							apiErrorCount++;			
						}
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();	
					});
				}  else if (deviceType === "CONTROLLER") {
					// unsupported
					logError("The gateway "+ currentSerial  + " was not able to be renamed,  as gateway renaming isn't supported yet")
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				}
			}
		});
	});
	if (currentWorkflow !== "") {
		return autoRenamePromise.promise();
	}
}


function magicRenameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/
	            
	renameCounter = 0;
	renamingCounters = {};
	magicNames = {};
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function () {
		showNotification("ca-card-update", "Renaming devices...", "bottom", "center", 'info');
		
		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this["SERIAL"].trim();
			var currentdevice = this;
			$.when(getAnyTopologyNeighbors(currentSerial)).then(function () {
				console.log(neighborSwitches)
				// Grab AP name format from localStorage
				var newHostname = localStorage.getItem('ap_naming_format');
				if (newHostname === null || newHostname === "") {
					newHostname = "{{initials}}-{{model}}-{{number}}";
				} else {
					newHostname = newHostname.toLowerCase();
				}
				
				// Format: SiteInitials-APModel-Number
				if (!currentdevice["SITE"] && (newHostname.includes("{{site}}") || newHostname.includes("{{initials}}"))) {
					logError("Device with Serial Number: " + currentSerial + " has no site name in the CSV file");
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();			
				} else if (!neighborSwitches[currentSerial] && (newHostname.includes("{{switch}}") || newHostname.includes("{{port}}"))) {
					logError("Device with Serial Number: " + currentSerial + " has neighbor switch information");
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();	
				} else {
					var siteInitials = "";
					var site = "";
					if (newHostname.includes("{{site}}") || newHostname.includes("{{initials}}")) {
						site = currentdevice["SITE"];
						siteInitials =  site.match(/\b(\w)/g).join('');
					}
					var device = findDeviceInInventory(currentSerial);
					if  (!device) {
						logError("Unable to find device " +  currentSerial + " in the device inventory");
						apiErrorCount++;
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					} else if (deviceType === "IAP") {					
						// Grab model number
						var model = device.aruba_part_no;
				
						// grab AP number - sequential for each site, and update for next AP.
						var apNumber = renamingCounters[siteInitials];
						if (!apNumber) {
							renamingCounters[siteInitials] = 1;
							apNumber = 1;
						}
						renamingCounters[siteInitials] = apNumber + 1;
						var connectedSwitch = neighborSwitches[currentSerial];
						
						//  generate string for AP number
						var tripleDigit = padNumber(apNumber,3);				
					
					
					
						// Replace elements in the format
						newHostname = newHostname.replace("{{initials}}", siteInitials);
						newHostname = newHostname.replace("{{site}}", site);
						newHostname = newHostname.replace("{{model}}", model);
						newHostname = newHostname.replace("{{number}}", tripleDigit);
						newHostname = newHostname.replace("{{switch}}", connectedSwitch["neighborName"]);
						newHostname = newHostname.replace("{{port}}", connectedSwitch["remotePort"]);
					
						// Replace spaces
						newHostname = newHostname.replace(/ /g, "");
					
						magicNames[currentSerial] = newHostname;  // store incase of enhanced workflow requiring it.
					
						// if AP then get AP settings
						var settings = {
							"url": api_url + "/tools/getCommand",
							"method": "POST",
							"timeout": 0,
							 "headers": {
								"Content-Type": "application/json"
							},
							"data": JSON.stringify({
								"url": getbaseURLforClientID(clientID) + "/configuration/v2/ap_settings/" + currentSerial,
								"access_token": getAccessTokenforClientID(clientID)
							})
						};

						$.ajax(settings).done(function (response) {
						  //console.log(response);
						  if (response.hasOwnProperty('error_code')) {
							logError(response.description)
							apiErrorCount++;			
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();		
						  } else if (response.hostname === newHostname) {
							// no need to do anything as the name already matches
							console.log("Device " + currentSerial + " hostname doesn't need to be updated");
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						  } else {
								// Update ap settings
								var settings = {
									"url": api_url + "/tools/postCommand",
									"method": "POST",
									"timeout": 0,
									 "headers": {
										"Content-Type": "application/json"
									},
									"data": JSON.stringify({
										"url": getbaseURLforClientID(clientID) + "/configuration/v2/ap_settings/" + currentSerial,
										"access_token": getAccessTokenforClientID(clientID),
										"data": JSON.stringify({"achannel": response.achannel, 
																"atxpower": response.atxpower, 
																"dot11a_radio_disable": response.dot11a_radio_disable,
																"dot11g_radio_disable": response.dot11g_radio_disable,
																"gchannel": response.gchannel,
																"gtxpower": response.gtxpower,
																"ip_address": response.ip_address,
																"usb_port_disable": response.usb_port_disable,
																"zonename": response.zonename,
																"hostname": newHostname})
									})
								};

								$.ajax(settings).done(function (response) {
									if (response !== currentSerial) {
										logError(device + " was not renamed")
										//console.log(response.reason);
										apiErrorCount++;
									}
									renameCounter = renameCounter + 1;
									checkForRenameCompletion();
								});
							}
						});
					} else {
						//console.log("Not an IAP")
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					}
				}
			});
		});
	});
	if (currentWorkflow !== "") {
		return autoMagicRenamePromise.promise();
	}
}


function checkForUpdatePortCompletion() {
	if (updatePortsCounter == csvData.length) {
		if  (currentWorkflow === "") {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Renaming Failure',
				  text: 'Some or all ports failed to be renamed',
				  icon: 'error'
				});	
			} else {
				Swal.fire({
				  title: 'Renaming Success',
				  text: 'All ports with connected APs were renamed',
				  icon: 'success'
				});
			}
		} else {
			autoPortPromise.resolve();
		}
	}
}

function getAnyTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + "/topology_external_api/apNeighbors/"+serial,
			"access_token": localStorage.getItem('access_token')
		})
	};

	return $.ajax(settings).done(function (response) {
		var neighbors = response.neighbors;
		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === "Switch" && this.localPort === "eth0") {
				neighborSwitches[serial] = this;
				return false;
			}
		})
	});
}

function getTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/topology_external_api/apNeighbors/"+serial,
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	return $.ajax(settings).done(function (response) {
		var neighbors = response.neighbors;
		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === "Switch" && this.localPort === "eth0" && findDeviceInMonitoring(this.neighborSerial)) {
				neighborSwitches[serial] = this;
				return false;
			}
		})
	});
}


function updatePortDescription(magic) {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/
	            
	updatePortsCounter = 0;
	neighborSwitches = {};
	showNotification("ca-card-update", "Renaming switch ports for connected APs...", "bottom", "center", 'info');

	$.each(csvData, function() {
		var currentSerial = this["SERIAL"].trim();
		var hostname = this["DEVICE NAME"].trim();
		var device = findDeviceInMonitoring(currentSerial);
		if (deviceType === "IAP") {
			$.when(getTopologyNeighbors(currentSerial)).then(function () {
				if  (!neighborSwitches[currentSerial]) {
					updatePortsCounter = updatePortsCounter + 1;
					checkForUpdatePortCompletion();
				} else {
					var portName = "int" + neighborSwitches[currentSerial].remotePort + "_name";
					var variables =  {};
					if (magic) {  // running enhanced naming workflow
						hostname = magicNames[currentSerial];
					}
					variables[portName] = hostname;
					// Update port description with AP hostname
					var settings = {
						"url": api_url + "/tools/patchCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": getbaseURLforClientID(clientID) + "/configuration/v1/devices/" + neighborSwitches[currentSerial].neighborSerial + "/template_variables",
							"access_token": getAccessTokenforClientID(clientID),
							"data": JSON.stringify({"total": 1, "variables": variables})
						})
					};

					$.ajax(settings).done(function (response) {
					  if (response !== "Success") {
						   logError("The switch port for AP ("+ currentSerial  + ") was not able to be renamed")
						   apiErrorCount++;			
					   }
					   updatePortsCounter = updatePortsCounter + 1;
					   checkForUpdatePortCompletion();	
					});
				}	
			});
		} else {
			updatePortsCounter = updatePortsCounter + 1;
			checkForUpdatePortCompletion();
		}
	});
	if (currentWorkflow !== "") {
		return autoPortPromise.promise();
	}
}

function updateDeviceVariables() {
	/*  
		Update template variables using CSV headers for variable names.
	*/
	            
	updateVariablesCounter = 0;
	showNotification("ca-setup-tools", "Updating Device Variables...", "bottom", "center", 'info');

	$.each(csvData, function() {
		var variables =  {};
		for (let k in this) {
			if (k === "DEVICE NAME") {
				var hostname_variable = "_sys_hostname";
				variables[hostname_variable] = this[k];
			} else if (k === "IP ADDRESS") {
				var ip_variable = "_sys_ip_address";
				variables[ip_variable] = this[k];
			/*} else if (k === "SERIAL") {
				var serial_variable = "_sys_serial";
				variables[serial_variable] = this[k];
			} else if (k === "MAC") {
				var mac_variable = "_sys_lan_mac";
				variables[mac_variable] = this[k];*/
			} else if ((k !== "SERIAL") && (k !== "MAC") && (k !== "GROUP") && (k !== "SITE") && (k !== "LICENSE") && (this[k] !== "")) {
				variables[k] = this[k];
			}
		}
		//console.log(variables)
		
		var settings = {
			"url": api_url + "/tools/patchCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": getbaseURLforClientID(clientID) + "/configuration/v1/devices/" + currentSerial + "/template_variables",
				"access_token": getAccessTokenforClientID(clientID),
				"data": JSON.stringify({"total": 1, "variables": variables})
			})
		};

		$.ajax(settings).done(function (response) {
		  if (response !== "Success") {
			   logError("The variables for "+ currentSerial  + " were not able to be updated")
			   apiErrorCount++;			
		   }
		   updateVariablesCounter = updateVariablesCounter + 1;
		   checkForUpdateVariablesCompletion();	
		});
	});
	if (currentWorkflow !== "") {
		return autoVariablesPromise.promise();
	}
}


/*  ----------------------------------------------------------------------------------
		Automated Tasks functions
	---------------------------------------------------------------------------------- */
	
function addAndLicense() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function () {
			
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: 'Some or all devices failed to be added & licensed',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were added & licensed',
				  icon: 'success'
				});
			}
		});
	});
}

function addAndGroup() {
	autoAddPromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		// Add devices completed  - now move devices
		$.when(moveDevicesToGroup()).then(function () {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: 'Some or all devices failed to be added, and moved into a group',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were added and moved into a group',
				  icon: 'success'
				});
			}
			if (manualGroup) {
				manualGroup = "";
				var mgd = document.getElementById("manualGroupDiv");
				mgd.style.display = "none";
			}
		});
	});
}

function addLicenseGroup() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function () {
			// licensing completed  - now move devices
			$.when(moveDevicesToGroup()).then(function () {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
					  title: 'Automation Failure',
					  text: 'Some or all devices failed to be added, licensed and moved into a group',
					  icon: 'error'
					});
				} else {
					Swal.fire({
					  title: 'Automation Success',
					  text: 'All devices were added, licensed and moved into a group',
					  icon: 'success'
					});
				}
				if (manualGroup) {
					manualGroup = "";
					var mgd = document.getElementById("manualGroupDiv");
					mgd.style.display = "none";
				}
			});
		});
	});
}

function siteAndRename() {
	autoSitePromise = new $.Deferred();
	autoRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function () {
		// Add devices completed  - now license devices
		$.when(renameDevices()).then(function () {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: 'Some or all devices failed to be assigned to a site and renamed',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were assigned to a site and renamed',
				  icon: 'success'
				});
			}
		});
	});
}

function siteAndAutoRename() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function () {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function () {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: 'Some or all devices failed to be assigned to a site and renamed',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were assigned to a site and renamed',
				  icon: 'success'
				});
			}
		});
	});
}

function renameAndPortDescriptions() {
	autoRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(renameDevices()).then(function () {
		// Add devices completed  - now license devices
		$.when(updatePortDescription()).then(function () {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: "Some or all devices failed to be renamed and/or port descriptions didn't update",
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were renamed and port descriptions updated',
				  icon: 'success'
				});
			}
		});
	});
}

function siteAndAutoRenameAndPortDescriptions() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function () {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function () {
			// update port descriptions with magic AP Name
			$.when(updatePortDescription("magic")).then(function () {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Automation Failure',
				  text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Automation Success',
				  text: 'All devices were moved to site, renamed and port descriptions updated',
				  icon: 'success'
				});
			}
		});
		});
	});
}




/*  ----------------------------------------------------------------------------------
		MSP functions
	---------------------------------------------------------------------------------- */
function getIDforCustomer(customer) {
	/*  
		get customer from customer monitoring data
		return customer_id for matching customer
	*/
	var customerId = -1;  // used when the customer isn't found
	//console.log('looking for customer: '+customer)
	$.each(mspCustomers, function() { 
		if (this['customer_name'] === customer) {
			customerId = this['customer_id'];
			return false;
		}
	});
	return customerId;
}	

function csvContainsCustomer() {
	var containsCustomer = true;
	$.each(csvData, function() {
		if (!this["CUSTOMER"]) containsCustomer = false;
		return false;
	});
	return containsCustomer;
}

function selectCustomer() {
	var select = document.getElementById("customerselector");
	manualCustomer = select.value;
	document.getElementById('manualCustomerParagraph').innerText = "Manual Customer: " + manualCustomer;
	var mcd = document.getElementById("manualCustomerDiv");
    mcd.style.display = "block";
    showNotification("ca-folder-replace", manualCustomer+" will be used for devices with no customer assigned. Please re-run the task.", "top", "center", 'warning');
}

function showMSPCard(display) {
  var x = document.getElementById("msp_card");
  if (display) {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function isMSP(offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/msp_api/v1/devices?limit=1&offset=0&device_allocation_status=0&device_type=iap",
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('message')) {
	  	if (response.message.includes("Permission denied")) {
	  		showMSPCard(false);
	  		console.log("Not an MSP user - keeping MSP card hidden")
	  	} else {
	  		showMSPCard(true);
	  		console.log("MSP user - enabling MSP card")
	  	}
	  } else {
	  	showMSPCard(true);
	  	console.log("MSP user - enabling MSP card")
	  }
	});
}

function updateMSPData() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification("ca-contactless-card", "Updating MSP Data...", "bottom", "center", 'info');
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	apPromise = new $.Deferred();
	switchPromise = new $.Deferred();
	gatewayPromise = new $.Deferred();
	customerPromise = new $.Deferred();
	inventoryPromise = new $.Deferred();
	$.when(getMSPAPData(0), getMSPSwitchData(0), getMSPGatewayData(0), getMSPCustomerData(0)).then(function () {
		//console.log('Got ALL Inventories');
		inventoryPromise.resolve();
	});
	getGroupData(0);
	return inventoryPromise.promise();
}


function getMSPAPData(offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/msp_api/v1/devices?limit=" + apiMSPLimit + "&offset=" + offset + "&device_allocation_status=0&device_type=iap",
		"access_token": getAccessTokenforClientID(clientID)
	  }),
		"complete": function () {
			if (mspAPs.length == mspAPCount) {
				apPromise.resolve();
			}
		}
	};

	$.ajax(settings).done(function (response) {
	  //console.log(response)
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('ap_icon')).removeClass("text-success");
	  	$(document.getElementById('ap_icon')).addClass("text-warning");
	  	if (document.getElementById("ap_count")) document.getElementById("ap_count").innerHTML = "-";
	  } else if (response.hasOwnProperty('message')) {
	  	showNotification("ca-globe", response.message, "bottom", "center", 'danger');
	  } else {
	  	if (document.getElementById("ap_count")) document.getElementById("ap_count").innerHTML = "" + response.deviceList.total_devices + "";
	  	if (offset === 0) {
	  		mspAPs = [];
	  		mspAPCount = response.deviceList.total_devices;
			$('#ap-table').DataTable().rows().remove();
	  	}
	  	mspAPs = mspAPs.concat(response.deviceList.devices);
	  	$.each(response.deviceList.devices, function() {  
	  	
	  		var clean = this["tier_type"];
			if (clean) clean = titleCase(clean);
	
			// Add row to table
			var table = $('#ap-table').DataTable();
			table.row.add([
				this["customer_name"],
				this["aruba_part_no"]+" ("+this["model"]+")", 
				this["serial"],
				this["macaddr"],
				clean,
				getNameforClientID(clientID)
			]);
		});
		
		if (offset+apiMSPLimit <= response.deviceList.total_devices) getMSPAPData(offset+apiMSPLimit)
		else {
			// Force reload of table data
			$('#ap-table').DataTable().rows().draw();
			$(document.getElementById('ap_icon')).removeClass("text-warning");
			$(document.getElementById('ap_icon')).addClass("text-success");
		}
	  }
	});
	return apPromise.promise();
}

function getMSPSwitchData(offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/msp_api/v1/devices?limit=" + apiMSPLimit + "&offset=" + offset + "&device_allocation_status=0&device_type=switch",
		"access_token": getAccessTokenforClientID(clientID)
	  }),
		"complete": function () {
			if (mspSwitches.length == mspSwitchCount) {
				switchPromise.resolve();
			}
		}
	};

	$.ajax(settings).done(function (response) {
	//console.log(response);
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('switch_icon')).removeClass("text-success");
	  	$(document.getElementById('switch_icon')).addClass("text-warning");
	  	if (document.getElementById("switch_count")) document.getElementById("switch_count").innerHTML = "-";
	  } else if (response.hasOwnProperty('message')) {
	  	showNotification("ca-globe", response.message, "bottom", "center", 'danger');
	  } else {
	  	if (document.getElementById("switch_count")) document.getElementById("switch_count").innerHTML = "" + response.deviceList.total_devices + "";
	  	if (offset === 0) {
	  		mspSwitches = [];
	  		mspSwitchCount = response.deviceList.total_devices;
			$('#switch-table').DataTable().rows().remove();
	  	}
	  	mspSwitches = mspSwitches.concat(response.deviceList.devices);
	  	$.each(response.deviceList.devices, function() {  
	  	
	  		var clean = this["tier_type"];
			if (clean) clean = titleCase(clean);
	
			// Add row to table
			var table = $('#switch-table').DataTable();
			table.row.add([
				this["customer_name"],
				this["aruba_part_no"]+" ("+this["model"]+")", 
				this["serial"],
				this["macaddr"],
				clean,
				getNameforClientID(clientID)
			]);
		});
		
		if (offset+apiMSPLimit <= response.deviceList.total_devices) getMSPSwitchData(offset+apiMSPLimit)
		else {
			// Force reload of table data
			$('#switch-table').DataTable().rows().draw();
			$(document.getElementById('switch_icon')).removeClass("text-warning");
			$(document.getElementById('switch_icon')).addClass("text-success");
		}
	  }
	});
	return switchPromise.promise();
}

function getMSPGatewayData(offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/msp_api/v1/devices?limit=" + apiMSPLimit + "&offset=" + offset + "&device_allocation_status=0&device_type=all_controller",
		"access_token": getAccessTokenforClientID(clientID)
	  }),
		"complete": function () {
			if (mspGateways.length == mspGatwayCount) {
				gatewayPromise.resolve();
			}
		}
	};

	$.ajax(settings).done(function (response) {
	//console.log(response);
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('gateway_icon')).removeClass("text-success");
	  	$(document.getElementById('gateway_icon')).addClass("text-warning");
	  	if (document.getElementById("gateway_count")) document.getElementById("gateway_count").innerHTML = "-";
	  } else if (response.hasOwnProperty('message')) {
	  	showNotification("ca-globe", response.message, "bottom", "center", 'danger');
	  } else {
	  	if (document.getElementById("gateway_count")) document.getElementById("gateway_count").innerHTML = "" + response.deviceList.total_devices + "";
	  	if (offset === 0) {
	  		mspGateways = [];
	  		mspGatwayCount = response.deviceList.total_devices;
			$('#gateway-table').DataTable().rows().remove();
	  	}
	  	mspGateways = mspGateways.concat(response.deviceList.devices);
	  	$.each(response.deviceList.devices, function() {  
	  	
	  		var clean = this["tier_type"];
			if (clean) clean = titleCase(clean);
	
			// Add row to table
			var table = $('#gateway-table').DataTable();
			table.row.add([
				this["customer_name"],
				this["aruba_part_no"]+" ("+this["model"]+")", 
				this["serial"],
				this["macaddr"],
				clean,
				getNameforClientID(clientID)
			]);
		});
		
		if (offset+apiMSPLimit <= response.deviceList.total_devices) getMSPSwitchData(offset+apiMSPLimit)
		else {
			// Force reload of table data
			$('#gateway-table').DataTable().rows().draw();
			$(document.getElementById('gateway_icon')).removeClass("text-warning");
			$(document.getElementById('gateway_icon')).addClass("text-success");
		}
	  }
	});
	return gatewayPromise.promise();
}

function getMSPCustomerData(offset) {
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/msp_api/v1/customers?limit=" + apiMSPLimit + "&offset=" + offset,
		"access_token": getAccessTokenforClientID(clientID)
	  }),
		"complete": function () {
			if (mspGateways.length == mspGatwayCount) {
				customerPromise.resolve();
			}
		}
	};

	$.ajax(settings).done(function (response) {
	  if (response.hasOwnProperty('error')) {	  	
	  	$(document.getElementById('customer_icon')).removeClass("text-success");
	  	$(document.getElementById('customer_icon')).addClass("text-warning");
	  	if (document.getElementById("customer_count")) document.getElementById("customer_count").innerHTML = "-";
	  } else if (response.hasOwnProperty('message')) {
	  	showNotification("ca-globe", response.message, "bottom", "center", 'danger');
	  } else {
	  	if (document.getElementById("customer_count")) document.getElementById("customer_count").innerHTML = "" + response.total + "";
	  	
	  	var path = window.location.pathname;
		var page = path.split("/").pop();
	  	
	  	if (offset === 0) {
	  		mspCustomers = [];
	  		mspCustomerCount = response.total;
			$('#customer-table').DataTable().rows().remove();
			if (page.includes('workflow-msp')) {
				// remove old groups from the selector
				select = document.getElementById('customerselector');
				select.options.length = 0;
			}
	  	}
	  	mspCustomers = mspCustomers.concat(response.customers);
	  	$.each(response.customers, function() {  
	
			// Cleanup string responses
			var clean = this["account_status"];
			if (clean) clean = titleCase(noUnderscore(clean));
			
			var customerGroup = "";
			if (this["group"]) customerGroup = this.group.name
			// Add row to table
			var table = $('#customer-table').DataTable();
			table.row.add([
				this["customer_name"],
				this["account_type"],
				clean,
				customerGroup,
				this["description"],
				getNameforClientID(clientID)
			]);
			
			// Grab MSP ID for use later on
			mspID = this["msp_id"];
			
			if (page.includes('workflow-msp')) {
				// Add site to the dropdown selector
				$("#customerselector").append($('<option>', {value: this["customer_name"],text: this["customer_name"]}));
			}
		});
		
		if (offset+apiMSPLimit <= response.total) getMSPCustomerData(offset+apiMSPLimit)
		else {
			// Force reload of table data
			$('#customer-table').DataTable().rows().draw();
			$(document.getElementById('customer_icon')).removeClass("text-warning");
			$(document.getElementById('customer_icon')).addClass("text-success");
		}
	  }
	});
	return customerPromise.promise();
}



/*  
	Customer Assignment Functions
*/
function checkForCustomerMoveCompletion() {
	/*  
		UI cleanup after processing moves
	*/
	
	if (moveCounter == csvData.length) {
		if (currentWorkflow  === "") {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
				  title: 'Customer Assignment Failure',
				  text: 'Some or all devices failed to move to the specified customer',
				  icon: 'error'
				});
			} else {
				Swal.fire({
				  title: 'Customer Assignment Success',
				  text: 'All devices were to moved to the specified customers',
				  icon: 'success'
				});
			}
			if (manualCustomer) {
				manualCustomer = "";
				var mcd = document.getElementById("manualCustomerDiv");
				mcd.style.display = "none";
			}
			updateMSPData();
		} else {
			console.log("Automation: Customer assignment complete")
			autoCustomerPromise.resolve();
		}
	}
}

function unassignDeviceFromCustomer(device) {
	/*  
		Assign device back to MSP
	*/
	var deviceSerial = device["SERIAL"]
	var settings = {
		"url": api_url + "/tools/putCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/msp/"+mspID+"/devices",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"devices": [ {"serial": device["serial"], "mac": device["macaddr"] } ] })
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + " for device: " + deviceSerial);
			} else {
				logError(response.reason);
			}
		}
	});
}

function assignDeviceToCustomer(device, customerId) {
	/*  
		Assign device to a customer (one at a time)
	*/
	var deviceSerial = device["SERIAL"]
	var settings = {
		"url": api_url + "/tools/putCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/msp/"+customerId+"/devices",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"devices": [ {"serial": device["serial"], "mac": device["macaddr"] } ] })
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + " for device: " + deviceSerial);
			} else {
				logError(response.reason);
			}
		}
		moveCounter = moveCounter + 1;
		checkForCustomerMoveCompletion();
	});
}

function unassignDevicesFromCustomers(devices) {
	/*  
		Assign supplied devices back to MSP
	*/
	var settings = {
		"url": api_url + "/tools/putCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/msp/"+mspID+"/devices",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"devices": devices })
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + " for supplied devices");
			} else {
				logError(response.reason);
			}
		}
	});
}

function assignDevicesToSingleCustomer(devices, customerId) {
	/*  
		Assign supplied devices back to a single customer
	*/
	var settings = {
		"url": api_url + "/tools/putCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/platform/device_inventory/v1/msp/"+customerId+"/devices",
			"access_token": getAccessTokenforClientID(clientID),
			"data": JSON.stringify({"devices": devices })
		})
	};

	return $.ajax(settings).done(function (response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + " for supplied devices");
			} else {
				logError(response.reason);
			}
		}
		moveCounter = moveCounter + 1;
		checkForCustomerMoveCompletion();
	});
}


function assignDevicesToCustomer() {
	/*  
		Move each device to the correct customer - either based on CSV or selected customer
	*/
	showNotification("ca-exchange", "Assigning devices to customers...", "bottom", "center", 'info');
	moveCounter = 0;
	$.each(csvData, function() {
		var selectedCustomer = manualCustomer;
		var currentSerial = this["SERIAL"].trim();
		var foundDevice = findDeviceInMonitoring(currentSerial);
		if (this["CUSTOMER"].trim()) selectedCustomer = this["CUSTOMER"].trim();
		
		if (foundDevice && foundDevice.customer_name === selectedCustomer) {
			console.log("No need to change Customer")
			moveCounter = moveCounter + 1;
			checkForCustomerMoveCompletion();
		} else if (foundDevice && foundDevice.customer_name !== selectedCustomer && getIDforCustomer(foundDevice.customer_name) != -1) {
			console.log("Assigning device back to MSP");
			$.when(unassignDeviceFromCustomer(foundDevice)).then(function () {
				// now assign to new Customer ID
				console.log("Assigning device to "+selectedCustomer)
				assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
			});
		} else {
			console.log("assigning customer")
			assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
		}
	});
	if (currentWorkflow !== "") {
		return autoCustomerPromise.promise();
	}
}


function assignAllDevicesToCustomer() {
	/*  
		Move each device to the selected customer
	*/
	showNotification("ca-exchange", "Assigning devices to a single customer...", "bottom", "center", 'info');
	moveCounter = 0;
	var devicesArray = [];
	var unassignDevicesArray = [];
	$.each(csvData, function() {
		var foundDevice = findDeviceInMonitoring(this["SERIAL"].trim());
		if (foundDevice && getIDforCustomer(foundDevice.customer_name) != -1) {
			unassignDevicesArray.push({"serial": this["SERIAL"].trim(), "mac": cleanMACAddress(this["MAC"])});
		}
		devicesArray.push({"serial": this["SERIAL"].trim(), "mac": cleanMACAddress(this["MAC"])});
	});
		
	var selectedCustomer = manualCustomer;
	//console.log("assigning all devices back to MSP")
	if (unassignDevicesArray.length != 0) {
		$.when(unassignDevicesFromCustomers(unassignDevicesArray)).then(function () {
			// now assign to new Customer ID
			console.log("Assigning all devices to "+selectedCustomer)
			assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
		});
	} else {
		assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
	}
	if (currentWorkflow !== "") {
		return autoCustomerPromise.promise();
	}
}

function addAndCustomers() {
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		// Add devices completed  - now move devices
		$.when(updateMSPData()).then(function () {
			$.when(assignDevicesToCustomer()).then(function () {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
					  title: 'Automation Failure',
					  text: 'Some or all devices failed to be added, and moved into a group',
					  icon: 'error'
					});
				} else {
					Swal.fire({
					  title: 'Automation Success',
					  text: 'All devices were added and moved into a group',
					  icon: 'success'
					});
				}
				if (manualCustomer) {
					manualCustomer = "";
					var mcd = document.getElementById("manualCustomerDiv");
					mcd.style.display = "none";
				}
				updateMSPData();
			});
		});
	});
}

function addAndCustomersAndLicense() {
	licenseCounter = 0;
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		// need to refresh MSPData - will need to wait.
		$.when(updateMSPData()).then(function () {
		// Add devices completed  - now move devices
			$.when(assignDevicesToCustomer()).then(function () {
				$.when(updateMSPData()).then(function () {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function () {
						// licensing completed
						if (apiErrorCount != 0) {
							$('#ErrorModalLink').trigger('click');
							Swal.fire({
							  title: 'Automation Failure',
							  text: 'Some or all devices failed to be added, assigned to customer and licensed',
							  icon: 'error'
							});
						} else {
							Swal.fire({
							  title: 'Automation Success',
							  text: 'All devices were added, assigned and licensed',
							  icon: 'success'
							});
						}
						if (manualCustomer) {
							manualCustomer = "";
							var mcd = document.getElementById("manualCustomerDiv");
							mcd.style.display = "none";
						}
						updateMSPData();
					});
				});
			});
		});
	});
}

function addAndSingleCustomer() {
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		$.when(updateMSPData()).then(function () {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function () {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
					  title: 'Automation Failure',
					  text: 'Some or all devices failed to be added, and moved into a group',
					  icon: 'error'
					});
				} else {
					Swal.fire({
					  title: 'Automation Success',
					  text: 'All devices were added and moved into a group',
					  icon: 'success'
					});
				}
				if (manualCustomer) {
					manualCustomer = "";
					var mcd = document.getElementById("manualCustomerDiv");
					mcd.style.display = "none";
				}
				updateMSPData();
			});
		});
	});
}

function addAndSingleCustomerAndLicense() {
	licenseCounter = 0;
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function () {
		$.when(updateMSPData()).then(function () {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function () {
				$.when(updateMSPData()).then(function () {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function () {
						// licensing completed
						if (apiErrorCount != 0) {
							$('#ErrorModalLink').trigger('click');
							Swal.fire({
							  title: 'Automation Failure',
							  text: 'Some or all devices failed to be added, assigned to customer and licensed',
							  icon: 'error'
							});
						} else {
							Swal.fire({
							  title: 'Automation Success',
							  text: 'All devices were added, assigned and licensed',
							  icon: 'success'
							});
						}
						if (manualCustomer) {
							manualCustomer = "";
							var mcd = document.getElementById("manualCustomerDiv");
							mcd.style.display = "none";
						}
						updateMSPData();
					});
				});
			});
		});
	});
}


function createCustomer() {
	var customerName = document.getElementById("customerName").value;
	var customerDescription = document.getElementById("customerDescription").value;
	var addToGroupValue = document.getElementById("addToGroupCheckbox").checked;
	var select = document.getElementById("groupselector")
	var selectedGroup = select.options[select.selectedIndex].text;
	var selectedClientID = select.value;

	showNotification("ca-c-add", "Adding new Customer...", "bottom", "center", 'info');
	
	var data;
	if (addToGroupValue) {
		data = JSON.stringify({"customer_name": customerName, "description": customerDescription, "group": {"name": selectedGroup}});
	} else {
		data = JSON.stringify({"customer_name": customerName, "description": customerDescription})
	}
		
	var settings = {
		"url": api_url + "/tools/postCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/msp_api/v1/customers",
			"access_token": getAccessTokenforClientID(clientID),
			"data": data
		})
	};

	$.ajax(settings).done(function (response) {
		if (response.status_code == 200) {
			Swal.fire({
			  title: 'Add Success',
			  text: 'Customer was successfully created',
			  icon: 'success'
			});
			// refresh group data to include new group
			getMSPCustomerData(0);
		} else {
			logError(response.status);
			Swal.fire({
			  title: 'Add Failure',
			  text: 'Customer was not able to be created',
			  icon: 'error'
			});
		}
	});
}




/*  ----------------------------------------------------------------------------------
		PSK functions
	---------------------------------------------------------------------------------- */
function getWLANsforGroup() {
	showNotification("ca-wifi-protected", "Obtaining WLANs for selected group configuration", "bottom", "center", 'info');
	document.getElementById("pskPassphrase").value = "";
	var wlans = document.getElementById('wlanselector');
	wlans.options.length = 0;


	var select = document.getElementById("groupselector");
	var wlanGroup = select.options[select.selectedIndex].text;
	var clientID = select.value;
	console.log(wlanGroup)
	console.log(clientID)
	
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/configuration/v1/wlan/" + wlanGroup,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response.hasOwnProperty('error_code')) {	  	
	  	showNotification("ca-folder-settings", response.description, "bottom", "center", 'danger');
	  } else {
	  	$.each(response.wlans, function() {  
	  		$("#wlanselector").append($('<option>', {value: this["name"],text: this["essid"]}));
		});
		if (response.wlans.length > 0) {
			if ($(".selectpicker").length != 0) {
				$('.selectpicker').selectpicker('refresh');
			}
		} else {
			showNotification("ca-wifi", 'There are no WLANs in the "'+wlanGroup+'" group', "bottom", "center", 'danger');
		}
	  }
	});
}

function getConfigforWLAN() {
	showNotification("ca-wifi-protected", "Obtaining WLAN configuration", "bottom", "center", 'info');
	document.getElementById("pskPassphrase").value = "";
	var groupselect = document.getElementById("groupselector");
	var wlanGroup = groupselect.options[groupselect.selectedIndex].text;
	var clientID = groupselect.value;
	var wlanselect = document.getElementById("wlanselector");
	var wlan = wlanselect.value;
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/configuration/v2/wlan/" + wlanGroup + "/" + wlan,
		"access_token": getAccessTokenforClientID(clientID)
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response.hasOwnProperty('error_code')) {	  	
	  	showNotification("ca-wifi", response.description, "bottom", "center", 'danger');
	  } else {
	  	if (response.wlan.wpa_passphrase === "") {
	  		showNotification("ca-wifi-protected", "The selected WLAN is not a PSK-based network", "bottom", "center", 'danger');
	  	} else {
	  		document.getElementById("pskPassphrase").value = response.wlan.wpa_passphrase;
	  		existingPassphrase = response.wlan.wpa_passphrase;
	  		document.getElementById("savePSKBtn").disabled = true;
	  		wlanConfig = response;
	  	}
	  }
	});
}

function updatePSK() {
	var groupselect = document.getElementById("groupselector");
	var wlanGroup = groupselect.options[groupselect.selectedIndex].text;
	var clientID = groupselect.value;
	var wlanselect = document.getElementById("wlanselector");
	var wlan = wlanselect.value;
	// update the passphrase value
	wlanConfig["wlan"]["wpa_passphrase"] = document.getElementById("pskPassphrase").value;
	wlanConfig["wlan"]["wpa_passphrase_changed"] = true;
	
	showNotification("ca-wifi-protected", "Updating PSK for "+wlan, "bottom", "center", 'info');
	
	var settings = {
	  "url": api_url + "/tools/putCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": getbaseURLforClientID(clientID) + "/configuration/v2/wlan/" + wlanGroup + "/" + wlan,
		"access_token": getAccessTokenforClientID(clientID),
		"data": JSON.stringify(wlanConfig)
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response === wlan) {
	  	Swal.fire({
		  title: 'Passphrase Updated',
		  text: 'Passphrase was updated for the "'+wlan+ '" WLAN',
		  icon: 'success'
		});
	  }
	  
	}).fail(function(XMLHttpRequest, textStatus, errorThrown) 
	{
		console.log("error")
		console.log(textStatus)
		if (XMLHttpRequest.readyState == 4) {
			// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
			showNotification("ca-globe", XMLHttpRequest.statusText, "bottom", "center", 'danger');
		} else if (XMLHttpRequest.readyState == 0) {
			// Network error (i.e. connection refused, access denied due to CORS, etc.)
			showNotification("ca-globe", "Can not connect to API server", "bottom", "center", 'danger');
		} else {
			// something weird is happening
		}
	});
}

function passphraseChange() {
	if (document.getElementById("pskPassphrase").value === existingPassphrase) {
		document.getElementById("savePSKBtn").disabled = false;
	} else {
		document.getElementById("savePSKBtn").disabled = false;
	}
}

function showPassphrase() {
	var x = document.getElementById("pskPassphrase");
	if (document.getElementById("revealPassphrase").checked) {
   	 	x.type = "text";
  	} else {
    	x.type = "password";
  	}
}


/*  ----------------------------------------------------------------------------------
		Client functions
	---------------------------------------------------------------------------------- */
function updateClientGraphs() {
	
	var count11k = 0;
	var count11v = 0;
	var count11r = 0;
	var count11ax = 0;
	var count11ac = 0;
	var count11gn = 0;
	var count11an = 0;
	var count5Ghz = 0;
	var countMACAuth = 0;
	var countDot1X = 0;
	var countNoAuth = 0;
	var countMACAuth2 = 0;
	var countDot1X2 = 0;
	var countNoAuth2 = 0;

		
	$.each(wirelessClients, function() {
		console.log("Speed "+this.speed)
		console.log("SNR "+this.snr)
		console.log("Signal "+this.signal_db)
		if (this.connection) {
			if (this.connection.includes("802.11k")) count11k++;
			if (this.connection.includes("802.11v")) count11v++;
			if (this.connection.includes("802.11r")) count11r++;
			if (this.connection.includes("802.11ax")) count11ax++;
			if (this.connection.includes("802.11ac")) count11ac++;
			if (this.connection.includes("802.11gn")) count11gn++;
			if (this.connection.includes("802.11an")) count11an++;
			if (this.band == 5) {
				count5Ghz++;
				if (this.authentication_type.includes("MAC")) countMACAuth++; 
				if (this.authentication_type.includes("DOT1X")) countDot1X++;
				if (this.authentication_type.includes("No Authentication")) countNoAuth++;
			} else {
				if (this.authentication_type.includes("MAC")) countMACAuth2++; 
				if (this.authentication_type.includes("DOT1X")) countDot1X2++;
				if (this.authentication_type.includes("No Authentication")) countNoAuth2++;
			}
		}
	});
	console.log("client Count: "+ wirelessClients.length)
	
	percentage11k = Math.round((count11k/wirelessClients.length)*100);
	Chartist.Pie('#chart11k', {
	  labels: [percentage11k+'%',''],
	  series: [percentage11k, 100-percentage11k]
	});
	
	percentage11v = Math.round((count11v/wirelessClients.length)*100);
	Chartist.Pie('#chart11v', {
	  labels: [percentage11v+'%',''],
	  series: [percentage11v, 100-percentage11v]
	});
	
	percentage11r = Math.round((count11r/wirelessClients.length)*100);
	Chartist.Pie('#chart11r', {
	  labels: [percentage11r+'%',''],
	  series: [percentage11r, 100-percentage11r]
	});
	
	percentageBand = Math.round((count5Ghz/wirelessClients.length)*100);
	bandLeft = 100-percentageBand;
	Chartist.Pie('#chartBand', {
	  labels: [percentageBand+'%',bandLeft+'%'],
	  series: [percentageBand, bandLeft]
	});
	
	percentage11ax = Math.round((count11ax/wirelessClients.length)*100);
	percentage11ac = Math.round((count11ac/wirelessClients.length)*100);
	percentage11gn = Math.round((count11gn/wirelessClients.length)*100);
	percentage11an = Math.round((count11an/wirelessClients.length)*100);
	Chartist.Pie('#chart11', {
	  labels: [percentage11ax+'%', percentage11ac+'%',percentage11gn+'%',percentage11an+'%'],
	  series: [percentage11ax, percentage11ac, percentage11gn, percentage11an]
	});
	
	
	var barOptions = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false
		},
		height: '250px'
	};


	Chartist.Bar('#chartAuth', {
	  labels: ['None', 'MAC Auth','802.1X'],
	  series: [[countNoAuth, countMACAuth, countDot1X],[countNoAuth2, countMACAuth2, countDot1X2]]
	},barOptions);
}

/*  ----------------------------------------------------------------------------------
		AP functions
	---------------------------------------------------------------------------------- */
function updateAPStatistics() {
	var count11k = 0;
	var count11v = 0;
	var count11r = 0;
	var count11ax = 0;
	var count11ac = 0;
	var count11gn = 0;
	var count11an = 0;
	var count5Ghz = 0;
	var countMACAuth = 0;
	var countDot1X = 0;
	var countNoAuth = 0;
	var countMACAuth2 = 0;
	var countDot1X2 = 0;
	var countNoAuth2 = 0;

		
	$.each(aps, function() {
		console.log(this)
		/*if (this.connection.includes("802.11k")) count11k++;
		if (this.connection.includes("802.11v")) count11v++;
		if (this.connection.includes("802.11r")) count11r++;
		if (this.connection.includes("802.11ax")) count11ax++;
		if (this.connection.includes("802.11ac")) count11ac++;
		if (this.connection.includes("802.11gn")) count11gn++;
		if (this.connection.includes("802.11an")) count11an++;
		if (this.band == 5) {
			count5Ghz++;
			if (this.authentication_type.includes("MAC")) countMACAuth++; 
			if (this.authentication_type.includes("DOT1X")) countDot1X++;
			if (this.authentication_type.includes("No Authentication")) countNoAuth++;
		} else {
			if (this.authentication_type.includes("MAC")) countMACAuth2++; 
			if (this.authentication_type.includes("DOT1X")) countDot1X2++;
			if (this.authentication_type.includes("No Authentication")) countNoAuth2++;
		}*/
	});
	
	/*percentage11k = Math.round((count11k/wirelessCount)*100);
	Chartist.Pie('#chart11k', {
	  labels: [percentage11k+'%',''],
	  series: [percentage11k, 100-percentage11k]
	});
	
	percentage11v = Math.round((count11v/wirelessCount)*100);
	Chartist.Pie('#chart11v', {
	  labels: [percentage11v+'%',''],
	  series: [percentage11v, 100-percentage11v]
	});
	
	percentage11r = Math.round((count11r/wirelessCount)*100);
	Chartist.Pie('#chart11r', {
	  labels: [percentage11r+'%',''],
	  series: [percentage11r, 100-percentage11r]
	});
	
	percentageBand = Math.round((count5Ghz/wirelessCount)*100);
	bandLeft = 100-percentageBand;
	Chartist.Pie('#chartBand', {
	  labels: [percentageBand+'%',bandLeft+'%'],
	  series: [percentageBand, bandLeft]
	});
	
	percentage11ax = Math.round((count11ax/wirelessCount)*100);
	percentage11ac = Math.round((count11ac/wirelessCount)*100);
	percentage11gn = Math.round((count11gn/wirelessCount)*100);
	percentage11an = Math.round((count11an/wirelessCount)*100);
	Chartist.Pie('#chart11', {
	  labels: [percentage11ax+'%', percentage11ac+'%',percentage11gn+'%',percentage11an+'%'],
	  series: [percentage11ax, percentage11ac, percentage11gn, percentage11an]
	});
	
	Chartist.Bar('#chartAuth', {
	  labels: ['None', 'MAC Auth','802.1X'],
	  series: [[countNoAuth, countMACAuth, countDot1X],[countNoAuth2, countMACAuth2, countDot1X2]]
	});*/
}

/* ---------------------------------------------------------------------------------------
						Site Functions
--------------------------------------------------------------------------------------- */
function getSwitchType(serial) {
	var currentSwitch = null;
	$.each(switches, function() {
		if (this["serial"] === serial) {
			currentSwitch = this;
			return false;
		}
	});
	if (currentSwitch["model"].includes("60") || 
		currentSwitch["model"].includes("61") || 
		currentSwitch["model"].includes("62") || 
		currentSwitch["model"].includes("63") || 
		currentSwitch["model"].includes("64") || 
		currentSwitch["model"].includes("83") || 
		currentSwitch["model"].includes("84")) {
		return "AOS-CX";
	} else {
		return "AOS-S"
	}
}

function getSwitchPortDetails(serial) {
	var url = "/monitoring/v1/switches/";
	//if (getSwitchType(serial) === "AOS-CX") url = "/monitoring/v1/cx_switches/";
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + url + serial +"/ports",
			"access_token": localStorage.getItem('access_token')
		})
	};
	
   /* $.ajax returns a promise*/      
   return $.ajax(settings).done(function (response) {
	  	if (response.hasOwnProperty('error')) {
			showNotification("ca-unlink", response.error_description, "top", "center", "danger");
	  	} else {
			switchPortDetails[serial] = response.ports;
		}
	});
}

function showLayerOne() {
	showNotification("ca-cable", "Finding LLDP Neighbours of every AP at the Site...", "bottom", "center", 'info');
	$('#layerone-table').DataTable().rows().remove();
	$('#LayerOneModalLink').trigger('click');

	var select = document.getElementById("siteselector");
	var selectedSite = select.options[select.selectedIndex].text;
	var clientID = select.value;
	var siteAPs = getAPsForSite(selectedSite);
	neighborSwitches = {};
	switchPortDetails = {};
	$.each(siteAPs, function() {
		var currentSerial = this["serial"];
		var currentAP = this["name"];
		console.log(this)
		$.when(getTopologyNeighbors(currentSerial)).then(function () {
			if  (!neighborSwitches[currentSerial]) {
				console.log("didnt find the switch")
			} else {
				// get switch port details
				$.when(getSwitchPortDetails(neighborSwitches[currentSerial].neighborSerial)).then(function () {
					$.each(switchPortDetails[neighborSwitches[currentSerial].neighborSerial], function() {
						console.log(this);
						if (this["port_number"] === neighborSwitches[currentSerial].remotePort) {
							// add data to table!
							var poe = this["power_consumption"];
							if (!poe) poe = "Unknown";
							var inErrors = this["in_errors"];
							if (!Number.isInteger(inErrors)) inErrors = "";
							var outErrors = this["out_errors"];
							if (!Number.isInteger(outErrors)) outErrors = "";
							
							var status = "<i class=\"fa fa-circle text-danger\"></i>";
							if (this["status"] == "Up") {
								status = "<i class=\"fa fa-circle text-success\"></i>";
							} 
						
							var table = $('#layerone-table').DataTable();
							table.row.add([
								"<strong>"+currentAP+"</strong>",
								status,
								neighborSwitches[currentSerial].neighborName,	
								this["port_number"], 
								poe, 
								this["speed"],
								this["duplex_mode"],
								inErrors,
								outErrors,
								getNameforClientID(clientID)
							]);
							$('#layerone-table').DataTable().rows().draw();
						}
					});
				});
			}
		});
	});
}