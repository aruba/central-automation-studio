/*
Central Automation v1.x
Last Updated 1.10
Aaron Scott (WiFi Downunder) 2022
*/

var centralURLs = [
	{
		'https://apigw-apacsouth.central.arubanetworks.com': 'https://app-apacsouth.central.arubanetworks.com',
		'https://api-ap.central.arubanetworks.com': 'https://app2-ap.central.arubanetworks.com',
		'https://internal-apigw.central.arubanetworks.com': 'https://internal-ui.central.arubanetworks.com',
		'https://app1-apigw.central.arubanetworks.com': 'https://app.central.arubanetworks.com',
		'https://apigw-prod2.central.arubanetworks.com': 'https://app-prod2-ui.central.arubanetworks.com',
		'https://apigw-uswest4.central.arubanetworks.com': 'https://app-uswest4.central.arubanetworks.com',
		'https://apigw-ca.central.arubanetworks.com': 'app-ca.central.arubanetworks.com',
		'https://apigw-apaceast.central.arubanetworks.com': 'https://app-apaceast.central.arubanetworks.com',
		'https://eu-apigw.central.arubanetworks.com': 'https://app2-eu.central.arubanetworks.com',
		'https://apigw-eucentral2.central.arubanetworks.com': 'https://app-eucentral2.central.arubanetworks.com',
		'https://apigw-eucentral3.central.arubanetworks.com': 'https://app-eucentral3.central.arubanetworks.com',
		//COP: 'COP',
	},
];

var centralClusters = [
	{
		Internal: 'https://internal-apigw.central.arubanetworks.com',
		'US-1': 'https://app1-apigw.central.arubanetworks.com',
		'US-2': 'https://apigw-prod2.central.arubanetworks.com',
		'US-WEST-4': 'https://apigw-uswest4.central.arubanetworks.com',
		'APAC-1': 'https://api-ap.central.arubanetworks.com',
		'APAC-EAST1': 'https://apigw-apaceast.central.arubanetworks.com',
		'APAC-SOUTH1': 'https://apigw-apacsouth.central.arubanetworks.com',
		'EU-1': 'https://eu-apigw.central.arubanetworks.com',
		'EU-2': 'https://apigw-eucentral2.central.arubanetworks.com',
		'EU-3': 'https://apigw-eucentral3.central.arubanetworks.com',
		'Canada-1': 'https://apigw-ca.central.arubanetworks.com',
		//'Central On-Prem': 'COP',
	},
];

var clusterNames = [
	{
		'https://internal-apigw.central.arubanetworks.com': 'Internal',
		'https://app1-apigw.central.arubanetworks.com': 'US-1',
		'https://apigw-prod2.central.arubanetworks.com': 'US-2',
		'https://apigw-uswest4.central.arubanetworks.com': 'US-WEST4',
		'https://api-ap.central.arubanetworks.com': 'APAC-1',
		'https://apigw-apaceast.central.arubanetworks.com': 'APAC-EAST1',
		'https://apigw-apacsouth.central.arubanetworks.com': 'APAC-SOUTH1',
		'https://eu-apigw.central.arubanetworks.com': 'EU-1',
		'https://apigw-eucentral2.central.arubanetworks.com': 'EU-2',
		'https://apigw-eucentral3.central.arubanetworks.com': 'EU-3',
		'https://apigw-ca.central.arubanetworks.com': 'Canada-1',
		//COP: 'Central On-Prem',
	},
];

var cop_url = 'https://apigw-';
var reachableProxies = [];

var forcedTokenRefresh = true;
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';
var csvData;
var csvDataCount = 0;
var apiErrorCount = 0;
var moveCounter = 0;
var devicesToMove = 0;
var addCounter = 0;
var archiveCounter = 0;
var licenseCounter = 0;
var renameCounter = 0;
var updateVariablesCounter = 0;
var inventoryPromise;
var monitoringPromise;
var apPromise;
var switchPromise;
var gatewayPromise;
var groupPromise;
var customerPromise;

var clients = [];
var wirelessClients = [];
var wiredClients = [];
var aps = [];
var apInventory = [];
var apInventoryCount = 0;
var switches = [];
var switchInventory = [];
var switchInventoryCount = 0;
var gateways = [];
var gatewayInventory = [];
var gatewayInventoryCount = 0;
var deviceType = '';
var sites = [];
var siteCreationCount = 0;
var groups = [];
var groupTemplateInfo = [];
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
var mspID = '';

var neighborSwitches = {};
var modifiedUISwitches = {};
var renamingCounters = {};
var magicNames = {};
var switchPortDetails = {};

const apiLimit = 1000;
const apiGLCPLimit = 100;
const apiSiteLimit = 1000;
const apiGroupLimit = 20;
const apiMSPLimit = 10;
var apiMessage = false;

var currentWorkflow = '';
var movePromise;
var autoAddPromise;
var autoArchivePromise;
var autoLicensePromise;
var autoGroupPromise;
var autoSitePromise;
var autoRenamePromise;
var autoMagicRenamePromise;
var autoPortPromise;
var autoCustomerPromise;
var autoVariablesPromise;

var manualGroup = '';
var manualCustomer = '';

var existingPassphrase = '';
var wlanConfig = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

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
		$('#clusterselector').append($('<option>', { value: centralClusters[0][k], text: k }));
	}
}

function isCOPSelected() {
	//console.log(document.getElementById("clusterselector").value)
	if (document.getElementById('clusterselector').value === getAPIGateway('Central On-Prem')) {
		document.getElementById('cop_address_row').hidden = false;
	} else {
		document.getElementById('cop_address_row').hidden = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Load and Save from Local Storage functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Updated 1.9.2
function onFinishSetup() {
	// Save all supplied addresses and details
	var base_url = document.getElementById('clusterselector').value;
	if (base_url === getAPIGateway('Central On-Prem')) {
		base_url = cop_url + document.getElementById('cop_address').value;
		localStorage.setItem('cop_address', $('#cop_address').val());
	}
	localStorage.setItem('client_id', $('#client_id').val());
	localStorage.setItem('client_secret', $('#client_secret').val());
	localStorage.setItem('base_url', base_url);
	localStorage.setItem('refresh_token', $('#refresh_token').val());
	localStorage.setItem('access_token', $('#access_token').val());
	localStorage.setItem('ap_naming_format', $('#ap_naming_format').val());
	localStorage.setItem('port_variable_format', $('#port_variable_format').val());
	localStorage.setItem('refresh_rate', $('#refresh_rate').val());
	localStorage.setItem('load_clients', document.getElementById('load_clients').value === 'Include' ? true : false);
	localStorage.removeItem('monitoring_update');

	var cluster = getAccountforClientID($('#client_id').val());
	cluster['refresh_token'] = $('#refresh_token').val();
	cluster['access_token'] = $('#access_token').val();
	updateAccountDetails(cluster);
	console.log(base_url);
	tokenRefresh();
}

function loadMonitoringData(refreshrate) {
	// Check if we need to get the latest data - or can we just load it from localStorage
	apiMessage = false;

	if (!localStorage.getItem('monitoring_update')) {
		getMonitoringData();
	} else {
		var lastRefresh = new Date(parseInt(localStorage.getItem('monitoring_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes > refreshrate) {
			//console.log("Reading new monitoring data from Central");
			getMonitoringData();
		} else {
			console.log('Reading monitoring data from local storage');

			clients = [];
			downAPCount = 0;
			downSwitchCount = 0;
			downGatewayCount = 0;
			siteIssues = 4;

			aps = JSON.parse(localStorage.getItem('monitoring_aps'));
			$.each(aps, function() {
				loadAPUI(this);
			});
			updateAPUI();
			switches = JSON.parse(localStorage.getItem('monitoring_switches'));
			$.each(switches, function() {
				loadSwitchUI(this);
			});
			updateSwitchUI();
			gateways = JSON.parse(localStorage.getItem('monitoring_gateways'));
			$.each(gateways, function() {
				loadGatewayUI(this);
			});
			updateGatewayUI();
			sites = JSON.parse(localStorage.getItem('monitoring_sites'));
			$.each(sites, function() {
				loadSiteUI(this);
			});
			updateSiteUI();
			groups = JSON.parse(localStorage.getItem('monitoring_groups'));
			$.each(groups, function() {
				loadGroupUI(this);
			});
			updateGroupUI();
			wirelessClients = JSON.parse(localStorage.getItem('monitoring_wirelessClients'));
			wiredClients = clients.concat(JSON.parse(localStorage.getItem('monitoring_wiredClients')));
			clients = clients.concat(wirelessClients);
			clients = clients.concat(wiredClients);

			$.each(clients, function() {
				loadClientsUI(this);
			});
			updateClientUI();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function titleCase(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function(word) {
			return word.replace(word[0], word[0].toUpperCase());
		})
		.join(' ');
}

function noUnderscore(str) {
	return str.replace(/_/g, ' ');
}

function cleanMACAddress(mac) {
	var currentMac = mac.trim();
	if (!currentMac.includes(':')) {
		// missing the colons - need to add
		currentMac = currentMac.replace(/..\B/g, '$&:');
	}
	return currentMac;
}

function padNumber(num, size) {
	num = num.toString();
	while (num.length < size) num = '0' + num;
	return num;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Logging and Notifications
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function showNotification(icon, message, from, align, color) {
	// Valid Colors: danger, warning, success, info, primary
	var iconString = 'central-icon ' + icon;
	$.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			timer: 500,
			placement: {
				from: from,
				align: align,
			},
		}
	);
}

// Updated 1.9.3
function logError(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('- ' + message);
	var span = document.createElement('span');
	span.style.color = '#FB404B';
	span.appendChild(text);
	errorBody.appendChild(span);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
	apiErrorCount++;
}

// Added 1.9.3
function logInformation(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('• ' + message);
	errorBody.appendChild(text);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
}

function clearErrorLog() {
	var errorBody = document.getElementById('errorBody');
	while (errorBody.hasChildNodes()) {
		errorBody.removeChild(errorBody.firstChild);
	}
}

function showLog() {
	$('#ErrorModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CSV functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function processCSV(results) {
	apiErrorCount = 0;
	csvData = results.data;
	csvDataCount = csvData.length;
	forcedTokenRefresh = false;
	tokenRefresh();
}

function loadCSVFile(clickedRow) {
	$('#files').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processCSV,
		},
		before: function(file, inputElem) {
			showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (clickedRow === 'mgmt-group') {
				$('#AddGroupModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-group-clone') {
				$('#CloneGroupModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-site') {
				$('#AddSiteModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-customer') {
				showCustomerGroup();
				$('#AddCustomerModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-inventory') {
				downloadDeviceInventory();
			} else if (!csvData) {
				showNotification('ca-c-warning', 'No CSV data found. Try selecting a CSV document.', 'bottom', 'center', 'danger');
				return false;
			}
			// Clear error log
			clearErrorLog();

			if (clickedRow === 'adddevices') {
				currentWorkflow = '';
				addDevices();
			} else if (clickedRow === 'archivedevices') {
				currentWorkflow = '';
				archiveDevices();
			} else if (clickedRow === 'licensedevices') {
				currentWorkflow = '';
				licenseDevices();
			} else if (clickedRow === 'unlicensedevices') {
				currentWorkflow = '';
				unlicenseDevices();
			} else if (clickedRow === 'movetogroup') {
				currentWorkflow = '';
				if (csvContainsGroup() || manualGroup) {
					moveDevicesToGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'movetosite') {
				currentWorkflow = '';
				moveDevicesToSite();
			} else if (clickedRow === 'renametemplate') {
				currentWorkflow = '';
				renameDevices();
			} else if (clickedRow === 'autorenametemplate') {
				currentWorkflow = '';
				magicRenameDevices();
			} else if (clickedRow === 'setZone') {
				currentWorkflow = '';
				setAPZone();
			} else if (clickedRow === 'devicevariables') {
				currentWorkflow = '';
				updateDeviceVariables();
			} else if (clickedRow === 'portdescriptions') {
				currentWorkflow = '';
				updatePortDescription();
			} else if (clickedRow === 'auto-add-license') {
				currentWorkflow = 'auto-add-license';
				addAndLicense();
			} else if (clickedRow === 'auto-add-group') {
				currentWorkflow = 'auto-add-group';
				if (csvContainsGroup() || manualGroup) {
					addAndGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-license-group') {
				currentWorkflow = 'auto-add-license-group';
				if (csvContainsGroup() || manualGroup) {
					addLicenseGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-site-rename') {
				currentWorkflow = 'auto-site-rename';
				siteAndRename();
			} else if (clickedRow === 'auto-site-autorename') {
				currentWorkflow = 'auto-site-autorename';
				siteAndAutoRename();
			} else if (clickedRow === 'auto-renameap-portdescriptions') {
				currentWorkflow = 'auto-renameap-portdescriptions';
				renameAndPortDescriptions();
			} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
				currentWorkflow = 'auto-site-autorenameap-portdescriptions';
				siteAndAutoRenameAndPortDescriptions();

				// MSP Functions
			} else if (clickedRow === 'assigntocustomer') {
				currentWorkflow = '';
				if (csvContainsCustomer() || manualCustomer) {
					assignDevicesToCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'assignalltocustomer') {
				currentWorkflow = '';
				if (manualCustomer) {
					assignAllDevicesToCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'licenseToCustomers') {
				currentWorkflow = '';
				licenseCounter = 0;
				licenseDevicesFromCSV(true);
			} else if (clickedRow === 'auto-add-customers') {
				currentWorkflow = 'auto-add-customers';
				if (csvContainsCustomer() || manualCustomer) {
					addAndCustomers();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-customers-license') {
				currentWorkflow = 'auto-add-customers-license';
				if (csvContainsCustomer() || manualCustomer) {
					addAndCustomersAndLicense();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-single') {
				currentWorkflow = 'auto-add-single';
				if (manualCustomer) {
					addAndSingleCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-single-license') {
				currentWorkflow = 'auto-add-single-license';
				if (manualCustomer) {
					addAndSingleCustomerAndLicense();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			}
		},
	});
}

function generateCSVForSite(clickedRow) {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	if (!selectedSite) {
		showNotification('ca-c-warning', 'Please select a Site before running a task', 'bottom', 'center', 'danger');
	} else {
		//console.log(selectedSite);

		//CSV header
		var siteKey = 'SITE';
		var serialKey = 'SERIAL';
		var macKey = 'MAC';
		var nameKey = 'DEVICE NAME';
		var groupKey = 'GROUP';

		// get APs for site
		csvData = [];
		$.each(aps, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		$.each(switches, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		$.each(gateways, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		if (!csvData) {
			showNotification('ca-c-warning', 'No site devices found. Try selecting a different site?', 'bottom', 'center', 'danger');
			return false;
		}
		// Clear error log
		clearErrorLog();
		if (clickedRow === 'adddevices') {
			currentWorkflow = '';
			addDevices();
		} else if (clickedRow === 'licensedevices') {
			currentWorkflow = '';
			licenseDevices();
		} else if (clickedRow === 'movetogroup') {
			currentWorkflow = '';
			moveDevicesToGroup();
		} else if (clickedRow === 'movetosite') {
			currentWorkflow = '';
			moveDevicesToSite();
		} else if (clickedRow === 'renametemplate') {
			currentWorkflow = '';
			renameDevices();
		} else if (clickedRow === 'autorenametemplate') {
			currentWorkflow = '';
			magicRenameDevices();
		} else if (clickedRow === 'portdescriptions') {
			currentWorkflow = '';
			updatePortDescription();
		} else if (clickedRow === 'auto-add-license') {
			currentWorkflow = 'auto-add-license';
			addAndLicense();
		} else if (clickedRow === 'auto-add-license-group') {
			currentWorkflow = 'auto-add-license-group';
			addLicenseGroup();
		} else if (clickedRow === 'auto-site-rename') {
			currentWorkflow = 'auto-site-rename';
			siteAndRename();
		} else if (clickedRow === 'auto-site-autorename') {
			currentWorkflow = 'auto-site-autorename';
			siteAndAutoRename();
		} else if (clickedRow === 'auto-renameap-portdescriptions') {
			currentWorkflow = 'auto-renameap-portdescriptions';
			renameAndPortDescriptions();
		} else if (clickedRow === 'auto-autorenameap-portdescriptions') {
			currentWorkflow = 'auto-autorenameap-portdescriptions';
			autoRenameAndPortDescriptions();
		} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
			currentWorkflow = 'auto-site-autorenameap-portdescriptions';
			siteAndAutoRenameAndPortDescriptions();
		} else if (clickedRow === 'test-layer-one') {
			currentWorkflow = 'test-layer-one';
			showLayerOne();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Authentication functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function tokenRefresh() {
	showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: localStorage.getItem('client_id'),
			client_secret: localStorage.getItem('client_secret'),
			access_token: localStorage.getItem('access_token'),
			refresh_token: localStorage.getItem('refresh_token'),
			base_url: localStorage.getItem('base_url'),
		}),
	};

	return $.ajax(settings)
		.done(function(response) {
			//console.log(response);
			if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description.replace('refresh_token', 'Refresh Token'),
					icon: 'error',
				});
			} else {
				localStorage.setItem('refresh_token', response.refresh_token);
				localStorage.setItem('access_token', response.access_token);

				var cluster = getAccountforClientID(localStorage.getItem('client_id'));
				cluster['refresh_token'] = response.refresh_token;
				cluster['access_token'] = response.access_token;
				updateAccountDetails(cluster);

				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('settings')) {
					document.getElementById('refresh_token').value = response.refresh_token;
					document.getElementById('access_token').value = response.access_token;
					Swal.fire({
						title: 'Connected!',
						text: 'Central API connection successful',
						icon: 'success',
						confirmButtonText: 'Go to Dashboard',
					}).then(result => {
						if (result.isConfirmed) {
							window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'dashboard.html';
						}
					});
				}
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText.replace('refresh_token', 'Refresh Token'), 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Monitoring functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageClient() {
	// override on visible page - used as a notification
}

function loadCurrentPageAP() {
	// override on visible page - used as a notification
}

function loadCurrentPageSwitch() {
	// override on visible page - used as a notification
}

function loadCurrentPageGateway() {
	// override on visible page - used as a notification
}

function loadCurrentPageSite() {
	// override on visible page - used as a notification
}

function loadCurrentPageGroup() {
	// override on visible page - used as a notification
}

// Updated: 1.6.0
function getMonitoringData() {
	console.log('Reading new monitoring data from Central');

	// Are we including Clients in the monitoring data calls?
	var loadClients = localStorage.getItem('load_clients');
	if (loadClients === null || loadClients === '') {
		loadClients = true;
	} else {
		loadClients = JSON.parse(loadClients);
	}
	console.log('Client Monitoring: ' + loadClients);

	apiMessage = false;

	if (!localStorage.getItem('base_url') && !localStorage.getItem('account_details')) {
		// No account settings at all.
		showNotification('ca-globe', 'API settings are blank...', 'bottom', 'center', 'danger');
		window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'settings.html';
	} else if (localStorage.getItem('base_url') && !localStorage.getItem('account_details')) {
		// Old account settings - need to migrate to v1.6
		upgradeAccountSettings();
	}

	// Try and refresh the token
	showNotification('ca-contactless-card', 'Updating Monitoring Data...', 'bottom', 'center', 'info');
	showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: localStorage.getItem('client_id'),
			client_secret: localStorage.getItem('client_secret'),
			access_token: localStorage.getItem('access_token'),
			refresh_token: localStorage.getItem('refresh_token'),
			base_url: localStorage.getItem('base_url'),
		}),
	};

	$.ajax(settings)
		.done(function(response) {
			//console.log(response)
			if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description,
					icon: 'error',
				});
			} else {
				localStorage.setItem('refresh_token', response.refresh_token);
				localStorage.setItem('access_token', response.access_token);

				var cluster = getAccountforClientID(localStorage.getItem('client_id'));
				cluster['refresh_token'] = response.refresh_token;
				cluster['access_token'] = response.access_token;
				updateAccountDetails(cluster);

				// Empty universal search table
				$('#universal-table')
					.DataTable()
					.rows()
					.remove();

				// Empty clients array
				clients = [];
				wiredClients = [];
				wirelessClients = [];
				groups = [];
				if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '0';
				$('#client-table')
					.DataTable()
					.rows()
					.remove();

				downAPCount = 0;
				downSwitchCount = 0;
				downGatewayCount = 0;
				siteIssues = 4;

				// Refresh card data
				showNotification('ca-wifi', 'Obtaining APs...', 'bottom', 'center', 'info');
				getAPData(0, loadClients);
				showNotification('ca-server-rack', 'Obtaining Switches...', 'bottom', 'center', 'info');
				getSwitchData(0, loadClients);
				showNotification('ca-content-delivery', 'Obtaining Gateways...', 'bottom', 'center', 'info');
				getGatewayData(0);
				showNotification('ca-world-pin', 'Obtaining Sites...', 'bottom', 'center', 'info');
				getSiteData(0);
				showNotification('ca-folder-settings', 'Obtaining Groups...', 'bottom', 'center', 'info');
				getGroupData(0);

				localStorage.setItem('monitoring_update', +new Date());
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

// Clients
// Updated: 1.6.0
function loadClientsUI(client) {
	var status = '';
	if (!client['health'] && client['failure_stage'] !== '' && client['failure_stage'] !== 'NA') {
		status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + client['failure_reason'] + ' at ' + client['failure_stage'] + '"><i class="fa fa-circle text-danger"></i></span>';
	} else if (!client['health']) {
		status = '<i class="fa fa-circle text-neutral"></i>';
	} else if (client['health'] < 50) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa fa-circle text-danger"></i></span>';
	} else if (client['health'] < 70) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa fa-circle text-warning"></i></span>';
	} else {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa fa-circle text-success"></i></span>';
	}
	// Generate clean data for table
	var site = '';
	if (client['site']) site = client['site'];
	var health = '';
	if (client['health']) health = client['health'];
	var associatedDevice_name = '';
	var associatedDevice = findDeviceInMonitoring(client['associated_device']);
	if (associatedDevice) associatedDevice_name = associatedDevice.name;
	var ip_address = '';
	if (client['ip_address']) ip_address = client['ip_address'];
	var vlan = '';
	if (client['vlan']) vlan = client['vlan'];
	var os_type = '';
	if (client['os_type']) os_type = client['os_type'];
	var client_name = '';
	if (client['name']) client_name = client['name'];
	var client_mac = 'Unknown';
	if (client['macaddr']) client_mac = client['macaddr'];

	// Make link to Central
	client_name_url = encodeURI(client_name);
	var apiURL = localStorage.getItem('base_url');
	var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + client['macaddr'] + '?ccma=' + client['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';

	// Add row to table
	var table = $('#client-table').DataTable();
	table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Client', client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, ip_address, client_mac, site, '', os_type, vlan, '', '', '']);

	$('[data-toggle="tooltip"]').tooltip();
}

function updateClientUI() {
	// Force reload of table data
	$('#client-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	var path = window.location.pathname;
	var page = path.split('/').pop();
	if (page.includes('clients')) {
		//console.log("loading Client Graphs")
		updateClientGraphs();
	}

	if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '' + clients.length + '';

	$(document.getElementById('client_icon')).removeClass('text-warning');
	$(document.getElementById('client_icon')).removeClass('text-danger');
	$(document.getElementById('client_icon')).addClass('text-success');

	// call to current showing page
	loadCurrentPageClient();
}

function getWirelessClientData(offset) {
	if (offset == 0) showNotification('ca-laptop-1', 'Obtaining wireless clients...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/clients?calculate_total=true&offset=' + offset + '&limit=' + apiLimit + '&timerange=3H&client_type=WIRELESS&client_status=CONNECTED&show_usage=true&show_manufacturer=true&show_signal_db=true',
			//url: localStorage.getItem('base_url') + '/monitoring/v1/clients/wireless?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			localStorage.setItem('monitoring_wirelessClients', JSON.stringify([]));
		} else {
			$.each(response.clients, function() {
				clients.push(this);
				wirelessClients.push(this);
				loadClientsUI(this);
			});

			if (offset + apiLimit < response.total) getWirelessClientData(offset + apiLimit);
			else {
				updateClientUI();
				localStorage.setItem('monitoring_wirelessClients', JSON.stringify(wirelessClients));
			}
		}
	});
}

function getWiredClientData(offset) {
	if (offset == 0) showNotification('ca-computer-monitor', 'Obtaining wired clients...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/clients?calculate_total=true&offset=' + offset + '&limit=' + apiLimit + '&timerange=3H&client_type=WIRED&client_status=CONNECTED&show_usage=true&show_manufacturer=true',
			//url: localStorage.getItem('base_url') + '/monitoring/v1/clients/wired?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			localStorage.setItem('monitoring_wiredClients', JSON.stringify([]));
		} else {
			$.each(response.clients, function() {
				clients.push(this);
				wiredClients.push(this);
				loadClientsUI(this);
			});

			if (offset + apiLimit < response.total) getWiredClientData(offset + apiLimit);
			else {
				updateClientUI();
				localStorage.setItem('monitoring_wiredClients', JSON.stringify(wiredClients));
			}
		}
	});
}

function getWirelessClients() {
	return wirelessClients;
}

function getWiredClients() {
	return wiredClients;
}

// Access Points
// Updated: 1.6.0
function loadAPUI(ap) {
	var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
	if (ap['status'] != 'Up') downAPCount++;
	var status = '<i class="fa fa-circle text-danger"></i>';
	if (ap['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
	}
	var ip_address = ap['ip_address'];
	if (!ip_address) ip_address = '';

	// Make AP Name as a link to Central
	var name = encodeURI(ap['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
	// Add row to table
	var table = $('#ap-table').DataTable();
	table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ip_address, ap['model'], ap['serial'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr']]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['AP', '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ip_address, ap['macaddr'], ap['site'], ap['group_name'], '', '', ap['model'], ap['serial'], ap['firmware_version']]);

	$('[data-toggle="tooltip"]').tooltip();
}

function updateAPUI() {
	// Force reload of table data
	$('#ap-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	var path = window.location.pathname;
	var page = path.split('/').pop();
	if (page.includes('aps')) {
		updateAPStatistics();
	}

	if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '' + aps.length + '';
	$(document.getElementById('ap_icon')).removeClass('text-warning');
	if (downAPCount > 0) {
		$(document.getElementById('ap_icon')).addClass('text-danger');
		$(document.getElementById('ap_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('ap_icon')).removeClass('text-danger');
		$(document.getElementById('ap_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageAP();
}

function getAPData(offset, needClients) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-primary');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-primary');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			localStorage.setItem('monitoring_aps', JSON.stringify([]));
		} else {
			if (offset === 0) {
				downAPCount = 0;
				aps = [];
				$('#ap-table')
					.DataTable()
					.rows()
					.remove();
			}

			aps = aps.concat(response.aps);
			$.each(response.aps, function() {
				loadAPUI(this);
			});

			if (offset + apiLimit < response.total) getAPData(offset + apiLimit, needClients);
			else {
				updateAPUI();
				localStorage.setItem('monitoring_aps', JSON.stringify(aps));
				// Grab wireless client data after grabbing APs (so we can match AP Serials to AP Names)
				if (needClients) getWirelessClientData(0);
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
		if (this['site'] === site) siteAPs.push(this);
	});
	return siteAPs;
}

function getAPsForGroup(group) {
	var groupAPs = [];
	$.each(aps, function() {
		if (this['group_name'] === group) groupAPs.push(this);
	});
	return groupAPs;
}

// Switches
// Updated: 1.6.0
function loadSwitchUI(device) {
	var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
	if (device['status'] != 'Up') downSwitchCount++;
	var status = '<i class="fa fa-circle text-danger"></i>';
	if (device['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
	}

	// Make link to Central
	name = encodeURI(device['name']);
	var apiURL = localStorage.getItem('base_url');
	var clientURL = centralURLs[0][apiURL] + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';

	// Add row to table
	var table = $('#switch-table').DataTable();
	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'], device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr']]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Switch', '<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'], device['macaddr'], device['site'], device['group_name'], '', '', device['model'], device['serial'], device['firmware_version']]);
}

function updateSwitchUI() {
	// Force reload of table data
	$('#switch-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '' + switches.length + '';

	$(document.getElementById('switch_icon')).removeClass('text-warning');
	if (downSwitchCount > 0) {
		$(document.getElementById('switch_icon')).addClass('text-danger');
		$(document.getElementById('switch_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('switch_icon')).removeClass('text-danger');
		$(document.getElementById('switch_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageSwitch();
}

function getSwitchData(offset, needClients) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-primary');
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-primary');
			localStorage.setItem('monitoring_switches', JSON.stringify([]));
		} else {
			if (offset == 0) {
				downSwitchCount = 0;
				switches = [];
				$('#switch-table')
					.DataTable()
					.rows()
					.remove();
				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('experimental-switching'))
					$('#chassis-switch-table')
						.DataTable()
						.rows()
						.remove();
			}

			switches = switches.concat(response.switches);
			$.each(response.switches, function() {
				loadSwitchUI(this);
			});

			if (offset + apiLimit < response.total) getSwitchData(offset + apiLimit, needClients);
			else {
				updateSwitchUI();
				localStorage.setItem('monitoring_switches', JSON.stringify(switches));
				// Grab wired client data after grabbing switches (so we can match switch Serials to AP Names)
				if (needClients) getWiredClientData(0);
			}
		}
	});
}

function getSwitches() {
	return switches;
}

function getSwitchesForGroup(group) {
	var groupSwitches = [];
	$.each(switches, function() {
		if (this['group_name'] == group) {
			groupSwitches.push(this);
		}
	});
	return groupSwitches;
}

// Gateways
// Updated: 1.6.0
function loadGatewayUI(device) {
	var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();

	if (device['status'] != 'Up') downGatewayCount++;
	var status = '<i class="fa fa-circle text-danger"></i>';
	if (device['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
	}

	// Make link to Central
	name = encodeURI(device['name']);
	var apiURL = localStorage.getItem('base_url');
	var clientURL = centralURLs[0][apiURL] + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + device['serial'] + '?csg=' + device['serial'] + '&cdcn=' + name + '&nc=gateway';

	// Add row to table
	var table = $('#gateway-table').DataTable();
	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'], device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], device['reboot_reason']]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Gateway', '<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'], device['macaddr'], device['site'], device['group_name'], '', '', device['model'], device['serial'], device['firmware_version']]);
}

function updateGatewayUI() {
	// Force reload of table data
	$('#gateway-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '' + gateways.length + '';
	$(document.getElementById('gateway_icon')).removeClass('text-warning');
	if (downGatewayCount > 0) {
		$(document.getElementById('gateway_icon')).addClass('text-danger');
		$(document.getElementById('gateway_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('gateway_icon')).removeClass('text-danger');
		$(document.getElementById('gateway_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageGateway();
}

function getGatewayData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			localStorage.setItem('monitoring_gateways', JSON.stringify([]));
		} else {
			if (offset == 0) {
				downGatewayCount = 0;
				gateways = [];
				$('#gateway-table')
					.DataTable()
					.rows()
					.remove();
			}

			gateways = gateways.concat(response.gateways);
			$.each(response.gateways, function() {
				loadGatewayUI(this);
			});

			if (offset + apiLimit < response.total) getGatewayData(offset + apiLimit);
			else {
				updateGatewayUI();
				localStorage.setItem('monitoring_gateways', JSON.stringify(gateways));
			}
		}
	});
}

function getGateways() {
	return gateways;
}

function getGatewaysForGroup(group) {
	var groupGateways = [];
	$.each(gateways, function() {
		if (this['group_name'] === group) groupGateways.push(this);
	});
	return groupGateways;
}

// Sites
// Updated: 1.6.0
function loadSiteUI(site) {
	// Add row to table
	var table = $('#site-table').DataTable();

	var capestate = '';
	if (site['cape_state'] === 'good') {
		capestate += '<i class="fa fa-circle text-success"></i>';
		capestate += ' No User Experience Issues';
	} else if (site['cape_state']) {
		capestate += '<i class="fa fa-circle text-danger"></i> ';
		capestate = titleCase(noUnderscore(site['cape_state_dscr'][0]));
	}
	if (site['cape_url']) {
		capestate = '<a href="' + site['cape_url'] + '" target="_blank">' + capestate + '</a>';
	}

	var aiinsights = '';
	if (site['insight_hi'] != 0) {
		aiinsights += '<i class="fa fa-circle text-danger"></i>';
	}
	if (site['insight_mi'] != 0) {
		aiinsights += '<i class="fa fa-circle text-warning"></i>';
	}
	if (site['insight_lo'] != 0) {
		aiinsights += '<i class="fa fa-circle text-minor"></i>';
	}
	if (aiinsights === '') {
		aiinsights = '<i class="fa fa-circle text-neutral"></i>';
	}

	var status = '<i class="fa fa-circle text-success"></i>';
	var healthReason = '';
	if (site['wan_uplinks_down'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Gateway with WAN links down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wan_tunnels_down'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Gateway with VPN Tunnels down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_cpu_high'] > 1) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'APs with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_cpu_high'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'AP with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_cpu_high'] > 1) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Switches with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_cpu_high'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Switch with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['branch_cpu_high'] > 1) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Gateways with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['branch_cpu_high'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'Gateway with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_device_status_down'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'One or more APs are down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_device_status_down'] > 0) {
		status = '<i class="fa fa-circle text-danger"></i>';
		healthReason = 'One or more switches are down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['device_high_noise_6ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High noise on 6GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_noise_5ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High noise on 5GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_noise_2_4ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High noise on 2.4GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_6ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 6GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_5ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 5GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_2_4ghz'] > 0) {
		status = '<i class="fa fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 2.4GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_mem'] > 0) {
		status = '<i class="fa fa-circle text-minor"></i>';
		healthReason = 'Devices with high memory utilization';
		if (siteIssues > 3) siteIssues = 3;
	}

	// Make link to Central
	var name = encodeURI(site['name']);
	var apiURL = localStorage.getItem('base_url');
	var clientURL = centralURLs[0][apiURL] + '/frontend/#/SITEHEALTH?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';
	var aiURL = centralURLs[0][apiURL] + '/frontend/#/SITE_INSIGHTS?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';

	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + site['name'] + '</strong></a>', status, site['device_up'], site['device_down'], site['connected_count'], capestate, '<a href="' + aiURL + '" target="_blank">' + aiinsights + '</a>', healthReason]);

	var path = window.location.pathname;
	var page = path.split('/').pop();
	if (page.includes('workflow-site')) {
		// Add site to the dropdown selector
		$('#siteselector').append($('<option>', { value: site['name'], text: site['name'] }));
		if ($('.selectpicker').length != 0) {
			setTimeout(function() {
				$('.selectpicker').selectpicker('refresh'); // refresh the selectpicker with fetched courses
			}, 100);
		}
	}
}

function updateSiteUI() {
	// Force reload of table data
	$('#site-table')
		.DataTable()
		.rows()
		.draw();
	if (document.getElementById('site_count')) document.getElementById('site_count').innerHTML = '' + sites.length + '';

	if (siteIssues == 1) {
		$(document.getElementById('site_icon')).addClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 2) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).addClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 3) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).addClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 4) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).addClass('text-primary');
	}

	// call to current showing page
	loadCurrentPageSite();
}

function getSiteData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/branchhealth/v1/site?limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			if (document.getElementById('site_count')) document.getElementById('site_count').innerHTML = '-';
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
			localStorage.setItem('monitoring_sites', JSON.stringify([]));
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset == 0) {
				sites = [];
				$('#site-table')
					.DataTable()
					.clear();
				if (page.includes('workflow-site')) {
					// remove old groups from the selector
					select = document.getElementById('siteselector');
					select.options.length = 0;
				}
			}

			sites = sites.concat(response.items);
			$.each(response.items, function() {
				loadSiteUI(this);
			});

			if (offset + apiSiteLimit < response.total) {
				getSiteData(offset + apiSiteLimit);
			} else {
				updateSiteUI();
				localStorage.setItem('monitoring_sites', JSON.stringify(sites));
			}
		}
	});
}

function getSites() {
	return sites;
}

// Groups
function loadGroupUI(group) {
	// Add row to table

	var table = $('#group-table').DataTable();
	var wiredTemplateUsed = '<input class="form-check-input" type="checkbox" value="" id="wiredTemplate" disabled>';
	if (group.template_details && group.template_details['Wired']) wiredTemplateUsed = '<input class="form-check-input" type="checkbox" value="" id="wiredTemplate" checked disabled>';
	var wirelessTemplateUsed = '<input class="form-check-input" type="checkbox" value="" id="wiredTemplate" disabled>';
	if (group.template_details && group.template_details['Wireless']) wirelessTemplateUsed = '<input class="form-check-input" type="checkbox" value="" id="wiredTemplate" checked disabled>';

	table.row.add(['<strong>' + group['group'] + '</strong>', wiredTemplateUsed, wirelessTemplateUsed]);

	var path = window.location.pathname;
	var page = path.split('/').pop();
	if (page.includes('workflow-csv') || page.includes('workflow-psk') || page.includes('deployment-wlan') || page.includes('deployment-group') || page.includes('workflow-msp') || page.includes('migration') || page.includes('dashboard')) {
		// Add site to the dropdown selector
		$('#groupselector').append($('<option>', { value: group['group'], text: group['group'] }));
		if ($('.selectpicker').length != 0) {
			$('.selectpicker').selectpicker('refresh');
		}
	}
}

function updateGroupUI() {
	// Force reload of table data
	$('#group-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('group_count')) document.getElementById('group_count').innerHTML = '' + groups.length + '';
	$(document.getElementById('group_icon')).addClass('text-primary');
	$(document.getElementById('group_icon')).removeClass('text-warning');

	// call to current showing page
	loadCurrentPageGroup();
}

function getGroupData(offset) {
	if (offset == 0) groupPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups?limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			localStorage.setItem('monitoring_groups', JSON.stringify([]));
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset == 0) {
				groups = [];
				$('#group-table')
					.DataTable()
					.rows()
					.remove();
				if (page.includes('workflow-csv') || page.includes('workflow-psk') || page.includes('workflow-msp') || page.includes('migration') || page.includes('deployment-group') || page.includes('dashboard')) {
					// remove old groups from the selector
					select = document.getElementById('groupselector');
					select.options.length = 0;
				}
			}

			var upto = offset + apiGroupLimit;
			if (offset + apiGroupLimit < response.total) {
				getGroupData(offset + apiGroupLimit);
				getGroupTemplateInfo(response.data, false);
			} else {
				getGroupTemplateInfo(response.data, true);
			}
		}
	});
	return groupPromise.promise();
}

function getGroups() {
	return groups;
}

// Updated: 1.5.0
function getGroupTemplateInfo(currentGroups, last) {
	// ******************************************************************************************************************************************************************************* //
	// remove any groups with a comma in the name... due to API issue.
	var newGroups = [];
	$.each(currentGroups, function() {
		if (!this[0].includes(',')) newGroups.push(this);
	});
	currentGroups = newGroups;
	// ******************************************************************************************************************************************************************************* //

	// Combine groups into a single escaped comma separated list
	var groupList = currentGroups.join('%2C');
	//groupList = encodeURI(groupList);
	groupList = groupList.replace('&', '%26');
	groupList = groupList.replace("'", '%27');

	//console.log(groupList)

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups/template_info?groups=' + groupList,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	//console.log(settings)

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			localStorage.setItem('monitoring_groups', JSON.stringify([]));
		} else {
			// Sort Groups before loading into tables or dropdowns
			groups = groups.concat(response.data);
			groups.sort(compareGroups);
			//console.log(groups);
			response.data.sort(compareGroups);

			// Uncomment for 2.5.4
			getGroupProperties(groupList, last);

			/*$.each(response.data, function() {
				loadGroupUI(this);
			});
			
			if (last) {
				updateGroupUI();
				localStorage.setItem('monitoring_groups', JSON.stringify(groups));
				groupPromise.resolve();
			}*/
		}
	});
}

// Introduced: 1.5.0
// Get the group properties... Central 2.5.4 and later
function getGroupProperties(groupList, last) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/groups/properties?groups=' + groupList,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	//console.log(settings)

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				showNotification('ca-api', response.message, 'top', 'center', 'danger');
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			localStorage.setItem('monitoring_groups', JSON.stringify([]));
		} else {
			// Find each group in "groups" and add properties to it
			$.each(response.data, function() {
				var properties = this['properties'];
				var groupName = this['group'];
				$.each(groups, function() {
					if (this['group'] === groupName) {
						this['group_properties'] = properties;
						return false;
					}
				});
			});

			// Sort Groups before loading into tables or dropdowns
			groups.sort(compareGroups);
			//console.log(groups);
			response.data.sort(compareGroups);
			$.each(response.data, function() {
				loadGroupUI(this);
			});

			if (last) {
				updateGroupUI();
				localStorage.setItem('monitoring_groups', JSON.stringify(groups));
				groupPromise.resolve();
			}
		}
	});
}

function compareGroups(a, b) {
	if (a.group < b.group) {
		return -1;
	}
	if (a.group > b.group) {
		return 1;
	}
	return 0;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Inventory functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated version 1.9.1
// now pulling from inventory instead of monitoring - bug fix
function downloadDeviceInventory() {
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		showNotification('ca-cloud-data-download', 'Preparing CSV file...', 'bottom', 'center', 'info');

		//CSV header
		var serialKey = 'SERIAL';
		var macKey = 'MAC';
		var typeKey = 'DEVICE TYPE';
		var skuKey = 'SKU';
		var modelKey = 'MODEL';
		var licenseKey = 'LICENSE';

		// get APs for site
		csvData = [];
		$.each(apInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'AP', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		$.each(switchInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'Switch', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		$.each(gatewayInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'Gateway', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		var csv = Papa.unparse(csvData);

		var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

		var csvURL = window.URL.createObjectURL(csvBlob);

		var csvLink = document.createElement('a');
		csvLink.href = csvURL;
		csvLink.setAttribute('download', 'inventory.csv');
		//csvLink.setAttribute('Inventory', 'inventory.csv');
		csvLink.click();
		window.URL.revokeObjectURL(csvLink);
	});
}
function updateInventory() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification('ca-stock-2', 'Obtaining device inventory...', 'bottom', 'center', 'info');
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	apPromise = new $.Deferred();
	switchPromise = new $.Deferred();
	gatewayPromise = new $.Deferred();
	$.when(getAPInventory(0), getSwitchInventory(0), getGatewayInventory(0)).then(function() {
		//console.log('Got ALL Inventories');
		inventoryPromise.resolve();
	});
	return inventoryPromise.promise();
}

// Updated version 1.9.1
// Change to include all_ap instead of just iap
function getAPInventory(offset) {
	/*  
		Grab ap inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=all_ap&limit=' + apiGLCPLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (apInventory.length == apInventoryCount) {
				/*$.each(apInventory, function(){
					console.log(this.serial+","+this.macaddr);
				})*/
				apPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				apInventory = [];
				apInventoryCount = response.total;
			}
			apInventory = apInventory.concat(response.devices);
			if (offset + apiGLCPLimit < response.total) getAPInventory(offset + apiGLCPLimit); // if there are still objects to get
			//console.log(apInventory);
		}
	});

	return apPromise.promise();
}

function getSwitchInventory(offset) {
	/*  
		Grab switch inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=switch&limit=' + apiGLCPLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (switchInventory.length == switchInventoryCount) {
				/*$.each(switchInventory, function(){
					console.log(this.serial+","+this.macaddr);
				})*/
				switchPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				switchInventory = [];
				switchInventoryCount = response.total;
			}
			switchInventory = switchInventory.concat(response.devices);
			if (offset + apiGLCPLimit < response.total) getSwitchInventory(offset + apiGLCPLimit); // if there are still objects to get
		}
	});

	return switchPromise.promise();
}

function getGatewayInventory(offset) {
	/*  
		Grab gateway inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=gateway&limit=' + apiGLCPLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (gatewayInventory.length == gatewayInventoryCount) {
				/*$.each(gatewayInventory, function(){
					console.log(this.serial+","+this.macaddr);
				})*/
				gatewayPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				gatewayInventory = [];
				gatewayInventoryCount = response.total;
			}
			gatewayInventory = gatewayInventory.concat(response.devices);
			if (offset + apiGLCPLimit < response.total) getGatewayInventory(offset + apiGLCPLimit); // if there are still objects to get
			//console.log(apInventory)
		}
	});

	return gatewayPromise.promise();
}

// Added in 1.10
function getFullInventory() {
	return [...apInventory, ...switchInventory, ...gatewayInventory];
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Searching functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findDeviceInInventory(currentSerial) {
	/*  
		Search through all inventories 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(apInventory, function() {
		if (this['serial'] === currentSerial) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switchInventory, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gatewayInventory, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
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
	deviceType = '';
	var foundDevice = null;
	$.each(aps, function() {
		if (this['serial'] === currentSerial) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switches, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspAPs, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspSwitches, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspGateways, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Add functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Updated 1.9.2
function addDevices() {
	addCounter = 0;
	showNotification('ca-c-add', 'Adding devices...', 'bottom', 'center', 'info');

	var base_url = localStorage.getItem('base_url');
	var currentClusterName = 'Internal';
	if (base_url) currentClusterName = getClusterName(base_url);

	var devices = [];
	$.each(csvData, function() {
		// build array for uploading.

		if (!this['SERIAL'] || !this['MAC']) {
			return false;
		}
		if (currentClusterName === 'Central On-Prem') devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim(), partNumber: this['MODEL'].trim() });
		else devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim() });
	});
	//console.log('About to add: ' + JSON.stringify(devices));
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify(devices),
			//"data": JSON.stringify([{"mac": cleanMACAddress(this["MAC"]), "serial": this["SERIAL"].trim() }])
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log('Add device response: ' + JSON.stringify(response));

		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to add') {
				apiErrorCount++;
			}
		}

		// check for erroring devices
		if (response.code && response.code === 'ATHENA_ERROR_NO_DEVICE') {
			if (response.extra.message.invalid_device && response.extra.message.invalid_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.invalid_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						logError('Device with Serial number "' + this.serial + '" is already added to Central or is an invalid MAC address');
					} else if (this.status === 'INVALID_MAC_SN') {
						logError('Device with Serial number "' + this.serial + '" is invalid');
					}
					apiErrorCount++;
				});
			}
			if (response.extra.message.blocked_device && response.extra.message.blocked_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.blocked_device, function() {
					logError('Device with Serial number "' + this.serial + '" is blocked from being added to your destination Central account');
					apiErrorCount++;
				});
			}
		}

		//addCounter = addCounter + 1;
		addCounter = addCounter + devices.length;
		if (addCounter == devices.length) {
			if (currentWorkflow === '') {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Add Failure',
						text: 'Some or all devices failed to be added to Central',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Add Success',
						text: 'All devices were added to Central',
						icon: 'success',
					});
				}
			} else {
				// complete the Add part of the automation
				console.log('Automation: Adding devices complete');
				autoAddPromise.resolve();
			}
		}
	});
	//console.log(JSON.stringify(devices));
	if (currentWorkflow !== '') {
		return autoAddPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Archive functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Added 1.9.2
function archiveDevices() {
	addCounter = 0;
	showNotification('ca-box', 'Archiving devices...', 'bottom', 'center', 'info');

	var devices = [];
	$.each(csvData, function() {
		// build array for uploading.

		if (!this['SERIAL']) {
			return false;
		}
		devices.push(this['SERIAL'].trim());
	});
	console.log('About to archive: ' + JSON.stringify(devices));
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices/archive',
			access_token: localStorage.getItem('access_token'),
			//data: JSON.stringify(devices),
			data: JSON.stringify({ serials: devices }),
		}),
	};

	$.ajax(settings).done(function(response) {
		console.log('Archive device response: ' + JSON.stringify(response));

		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to archive') {
				apiErrorCount++;
			}
		}

		// check for erroring devices
		if (response.code && response.code === 'ERROR_DEVICE_ARCHIVE_FAILED') {
			if (response.extra.message === 'No valid Serial(s) to Archive') {
				logError('No valid Serial(s) to Archive');
				apiErrorCount++;
			}
		}

		//addCounter = addCounter + 1;
		archiveCounter = archiveCounter + devices.length;
		if (archiveCounter == csvData.length) {
			if (currentWorkflow === '') {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Archive Failure',
						text: 'Some or all devices failed to be archived in Central',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Archive Success',
						text: 'All devices were archived in Central',
						icon: 'success',
					});
				}
			} else {
				// complete the Add part of the automation
				console.log('Automation: Archiving devices complete');
				autoArchivePromise.resolve();
			}
		}
	});
	//console.log(JSON.stringify(devices));
	if (currentWorkflow !== '') {
		return autoArchivePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Licensing functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkForLicensingCompletion() {
	if (licenseCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'License Failure',
					text: 'Some or all devices failed to be licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were assigned licenses',
					icon: 'success',
				});
			}
		} else {
			console.log('Automation: Licensing complete');
			autoLicensePromise.resolve();
		}
	}
}

// Will be removed in next release...
/* OLD Code - pre-v1.5.3
function licenseDevicesFromCSV(msp) {
	showNotification("ca-license-key", "Licensing devices...", "bottom", "center", 'info');
	$.each(csvData, function() {
		// find device in inventory to get device type
		// only process if the Serial is filled in - e.g. not a blank row!
		if (this["SERIAL"]) {	
			var currentSerial = this["SERIAL"].trim();
			if (currentSerial === "") return true;
			var requestedLicense = this["LICENSE"];
			if (requestedLicense) requestedLicense = requestedLicense.trim();
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
					"url": getAPIURL() + "/tools/postCommand",
					"method": "POST",
					"timeout": 0,
					 "headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify({
						"url": localStorage.getItem('base_url') + "/platform/licensing/v1/subscriptions/assign",
						"access_token": localStorage.getItem('access_token'),
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
		}
	});
	if (currentWorkflow !== "") {
		return autoLicensePromise.promise();
	}
}*/

/* Updated v.1.5.4 */
function licenseDevicesFromCSV(msp) {
	showNotification('ca-license-key', 'Licensing devices...', 'bottom', 'center', 'info');
	// variable to hold the device list per license service
	var serviceList = {};

	$.each(csvData, function() {
		// find device in inventory to get device type
		// only process if the Serial is filled in - e.g. not a blank row!
		if (this['SERIAL']) {
			var currentSerial = this['SERIAL'].trim();
			if (currentSerial === '') {
				// Blank row
				licenseCounter++;
				return true;
			}
			var requestedLicense = this['LICENSE'];
			if (requestedLicense) requestedLicense = requestedLicense.trim();
			if (!requestedLicense) requestedLicense = 'foundation';
			var license = '';

			// Find the device and type
			var foundDevice = findDeviceInInventory(currentSerial);
			if (msp) {
				foundDevice = findDeviceInMonitoring(currentSerial);
			}

			if (deviceType === 'IAP') {
				if (requestedLicense.toLowerCase().includes('foundation')) {
					license = 'foundation_ap';
				} else {
					license = 'advanced_ap';
				}
			} else if (deviceType === 'SWITCH') {
				// Check Switches
				if (requestedLicense.toLowerCase().includes('foundation')) {
					license = 'foundation_switch_';
				} else {
					license = 'advanced_switch_';
				}
				// check the license skus at https://internal-apigw.central.arubanetworks.com/platform/licensing/v1/services/config
				// Grab switch model from
				var arubaPart = foundDevice['aruba_part_no'];
				if (arubaPart.startsWith('J')) arubaPart = foundDevice['model'];

				if (arubaPart.includes('83') || arubaPart.includes('84')) {
					license = license + '8300';
				} else if (arubaPart.includes('6400') || arubaPart.includes('54')) {
					license = license + '6400';
				} else if (arubaPart.includes('6300') || arubaPart.includes('38')) {
					license = license + '6300';
				} else if (arubaPart.includes('6100') || arubaPart.includes('25')) {
					license = license + '6100';
				} else if (arubaPart.includes('6200') || arubaPart.includes('29')) {
					license = license + '6200';
				}
			} else if (deviceType === 'CONTROLLER') {
				// Check Gateways
				if (requestedLicense.toLowerCase().includes('wlan')) {
					license = 'foundation_wlan_gw';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation-base')) {
					license = 'foundation_base_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('foundation-base')) {
					license = 'foundation_base_7005';
				} else if (requestedLicense.toLowerCase().includes('advance-base')) {
					license = 'advance_base_7005';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation') && (arubaPart.includes('70') || arubaPart.includes('90'))) {
					license = 'foundation_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && (arubaPart.includes('70') || arubaPart.includes('90'))) {
					license = 'advance_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('foundation') && (arubaPart.includes('70') || arubaPart.includes('90'))) {
					license = 'foundation_70xx';
				} else if (requestedLicense.toLowerCase().includes('advanced') && (arubaPart.includes('70') || arubaPart.includes('90'))) {
					license = 'advance_70xx';
				} else if (requestedLicense.toLowerCase().includes('foundation') && arubaPart.includes('72')) {
					license = 'foundation_72xx';
				} else if (requestedLicense.toLowerCase().includes('advanced') && arubaPart.includes('72')) {
					license = 'advance_72xx';
				}
			}

			if (!foundDevice) {
				logError('Device with Serial Number: ' + currentSerial + ' was not found in the device inventory');
				licenseCounter = licenseCounter + 1;
				checkForLicensingCompletion();
			} else {
				// check if other devices have the same services assigned
				if (!serviceList[license]) {
					serviceList[license] = [];
				}

				// Add serial to the list that matches the services.
				var serials = serviceList[license];
				serials.push(currentSerial);
				serviceList[license] = serials;
			}
		} else {
			// Empty Row
			licenseCounter++;
			checkForLicensingCompletion();
		}
	});

	for (const [key, value] of Object.entries(serviceList)) {
		var serials = value;

		// Update licensing
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/assign',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ serials: value, services: [key] }),
			}),
		};
		licenseCounter = licenseCounter + value.length;
		logInformation('Licensing with ' + key + ': ' + JSON.stringify(value));

		$.ajax(settings).done(function(response) {
			if (Array.isArray(response.status)) {
				if (response.status[0].message.msg) {
					logError(response.status[0].message.msg);
				} else {
					logError('There was an error un-assigning licenses.');
				}
			} else if (response.error_code) {
				if (response.error_code == 400) {
					logError(response.message);
				} else {
					logError('There was an error un-assigning licenses.');
				}
			}
			checkForLicensingCompletion();
		});
	}

	if (currentWorkflow !== '') {
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
	$.when(updateInventory()).then(function() {
		licenseDevicesFromCSV(false);
	});
	if (currentWorkflow !== '') {
		return autoLicensePromise.promise();
	}
}

// Added in 1.5.2
function checkForUnlicensingCompletion() {
	if (licenseCounter == csvDataCount) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'License Failure',
					text: 'Some or all devices failed to be unassigned licenses',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices had licenses unassigned',
					icon: 'success',
				});
			}
		} else {
			console.log('Automation: Unlicensing complete');
			autoLicensePromise.resolve();
		}
	}
}

/* Updated v1.5.4*/
function unlicenseDevicesFromCSV() {
	licenseCounter = 0;
	showNotification('ca-license-key', 'Un-assigning licenses from devices', 'bottom', 'center', 'info');

	// variable to hold the device list per license service
	var serviceList = {};

	// unassign license from each device
	$.each(csvData, function() {
		if (this['SERIAL']) {
			// find the device to be able to get current license assigned.
			var device = findDeviceInInventory(this['SERIAL']);
			if (device['services'].length > 0) {
				// convert the services into a string
				var serviceName = JSON.stringify(device['services']);
				// check if other devices have the same services assigned
				if (!serviceList[serviceName]) {
					serviceList[serviceName] = [];
				}

				// Add serial to the list that matches the services.
				var serials = serviceList[serviceName];
				serials.push(this['SERIAL']);
				serviceList[serviceName] = serials;
			} else {
				licenseCounter++; // skipping devices without licenses.
				checkForUnlicensingCompletion(); // just in case none have licenses assigned.
			}
		} else {
			licenseCounter++; // missing a serial number in the row of the CSV (possibly blank row)
			checkForUnlicensingCompletion();
		}
	});

	for (const [key, value] of Object.entries(serviceList)) {
		var serials = value;

		// Update licensing
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/unassign',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ serials: value, services: JSON.parse(key) }),
			}),
		};
		licenseCounter = licenseCounter + value.length;

		$.ajax(settings).done(function(response) {
			//console.log(response);
			if (Array.isArray(response.status)) {
				if (response.status[0].message.msg) {
					logError(response.status[0].message.msg);
				} else {
					logError('There was an error un-assigning licenses.');
				}
			}
			checkForUnlicensingCompletion();
		});
	}
}

// Added in 1.5.2
function unlicenseDevices() {
	/*  
		Grab all 3 inventories from API.  
		Scan though  each inventory to find the device.
		Grab the assigned service
		Unassign license.
	*/
	licenseCounter = 0;

	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		unlicenseDevicesFromCSV(false);
	});
	if (currentWorkflow !== '') {
		return autoLicensePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function csvContainsGroup() {
	var containsGroup = true;
	$.each(csvData, function() {
		//console.log(this["GROUP"])
		if (!this['GROUP'] && this['SERIAL']) {
			containsGroup = false;
			return false;
		}
	});
	return containsGroup;
}

function selectGroup() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	document.getElementById('manualGroupParagraph').innerText = 'Manual Group: ' + manualGroup;
	var mgd = document.getElementById('manualGroupDiv');
	mgd.style.display = 'block';
	showNotification('ca-folder-replace', 'The ' + manualGroup + ' group will be used for devices with no group assigned. Please re-run the task.', 'top', 'center', 'warning');
}

function createGroup() {
	var groupName = document.getElementById('groupName').value;
	var groupPassword = document.getElementById('groupPassword').value;
	var wiredTemplate = document.getElementById('wiredTemplate').checked;
	var wirelessTemplate = document.getElementById('wirelessTemplate').checked;

	showNotification('ca-c-add', 'Adding new Group...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, group_attributes: { group_password: groupPassword, template_info: { Wired: wiredTemplate, Wireless: wirelessTemplate } } }),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response)
		if (response === 'Created') {
			Swal.fire({
				title: 'Add Success',
				text: 'Group was successfully created',
				icon: 'success',
			});
			// refresh group data to include new group
			getGroupData(0);
		} else {
			Swal.fire({
				title: 'Add Failure',
				text: 'Group was not able to be created',
				icon: 'error',
			});
		}
	});
}

function cloneGroup() {
	var selectedGroup = document.getElementById('groupselector').value;
	var groupName = document.getElementById('existingGroupName').value;
	var upgrade10 = document.getElementById('aos10upgrade').checked;

	if (upgrade10) showNotification('ca-folder-add', 'Upgrading new Group...', 'bottom', 'center', 'info');
	else showNotification('ca-folder-add', 'Cloning Group...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups/clone',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, clone_group: selectedGroup, upgrade_architecture: upgrade10 }),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response === 'Created') {
			Swal.fire({
				title: 'Clone Success',
				text: 'Group was successfully cloned',
				icon: 'success',
			});
			// refresh group data to include new group
			getGroupData(0);
		} else {
			Swal.fire({
				title: 'Clone Failure',
				text: 'Group was not able to be cloned',
				icon: 'error',
			});
		}
	});
}

function showCustomerGroup() {
	var x = document.getElementById('addToGroup');
	if (document.getElementById('addToGroupCheckbox').checked) {
		x.style.display = 'block';
	} else {
		x.style.display = 'none';
	}
}

// Old moveDevicesToGroup code will be removed in next release...
/*
function moveDevicesToGroup() {
	
	// Move each device to the correct group
	
	showNotification('ca-folder-replace', 'Moving devices into groups...', 'bottom', 'center', 'info');
	moveCounter = 0;
	$.each(csvData, function() {
		var selectedGroup = manualGroup;
		if (this['GROUP'].trim()) selectedGroup = this['GROUP'].trim();
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/devices/move',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ group: selectedGroup, serials: [this['SERIAL'].trim()] }),
			}),
		};

		$.ajax(settings).done(function(response) {
			if (response.hasOwnProperty('error_code')) {
				logError(response.description);
			}
			moveCounter = moveCounter + 1;
			if (moveCounter == csvData.length) {
				if (currentWorkflow === '') {
					if (apiErrorCount != 0) {
						showLog();
						Swal.fire({
							title: 'Move Failure',
							text: 'Some or all devices failed to move to the specified group',
							icon: 'error',
						});
					} else {
						Swal.fire({
							title: 'Move Success',
							text: 'All devices were to moved to the specified groups',
							icon: 'success',
						});
					}
					//console.log(manualGroup)
					if (manualGroup) {
						manualGroup = '';
						var mgd = document.getElementById('manualGroupDiv');
						mgd.style.display = 'none';
					}
				} else {
					logInformation('Automation: Move to Group complete');
					autoGroupPromise.resolve();
				}
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoGroupPromise.promise();
	}
}
*/

// Updated in version 1.10
function moveDevicesToGroup() {
	/*  
		Move each device to the correct group
	*/
	showNotification('ca-folder-replace', 'Moving devices into groups...', 'bottom', 'center', 'info');
	moveCounter = 0;
	var groupsToUse = {};

	devicesToMove = 0;
	// Build lists of devices for each Group
	$.each(csvData, function() {
		if (this['SERIAL']) {
			var selectedGroup = manualGroup;
			if (this['GROUP'].trim()) selectedGroup = this['GROUP'].trim();
			var groupDevices = [];
			if (groupsToUse[selectedGroup]) {
				// grab existing list for this group
				groupDevices = groupsToUse[selectedGroup];
			}
			// add device to the list
			groupDevices.push(this['SERIAL'].trim());
			// save the list back into the dictionary
			groupsToUse[selectedGroup] = groupDevices;
			devicesToMove++;
		}
	});
	// For each Group, move the devices in bulk (not a call per device)
	for (const [groupName, serialsToMove] of Object.entries(groupsToUse)) {
		var serialArray = serialsToMove;

		// Need to split up into 50 device blocks (API limitation)
		while (serialArray.length > 0) {
			var serialBlock = [];
			serialBlock = serialArray.splice(0, 50);
			console.log('Adding Devices to ' + groupName + ': ' + JSON.stringify(serialBlock));

			// Move the block of serials in separate function to avoid variable changing between API call and response (due to looping) - enables better error and completion tracking
			$.when(performDeviceMove(groupName, serialBlock, new $.Deferred())).then(function() {
				// check for completion after each bulk move
				if (moveCounter == devicesToMove) {
					if (currentWorkflow === '') {
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Move Failure',
								text: 'Some or all devices failed to move to the specified group(s)',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Move Success',
								text: 'All devices were to moved to the specified group(s)',
								icon: 'success',
							});
						}
						//console.log(manualGroup)
						if (manualGroup) {
							manualGroup = '';
							var mgd = document.getElementById('manualGroupDiv');
							mgd.style.display = 'none';
						}
					} else {
						logInformation('Automation: Move to Group complete');
						autoGroupPromise.resolve();
					}
				}
			});
		}
	}
	if (currentWorkflow !== '') {
		return autoGroupPromise.promise();
	}
}

// Added in version 1.10
function performDeviceMove(groupName, serialNumbers, movePromiseVar) {
	// Perform actual device move and update the counters/log
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/move',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, serials: serialNumbers }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.includes('Controller/Gateway group move has been initiated, please check audit trail for details')) {
			logInformation('Controller/Gateway group move has been initiated, please check audit trail in Central for details');
		} else if (response.hasOwnProperty('error_code') || response !== 'Success') {
			logError(response.description);
			apiErrorCount++;
		}
		moveCounter = moveCounter + serialNumbers.length;
		movePromiseVar.resolve();
	});
	return movePromiseVar.promise();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Site functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function createSiteFromCSV() {
	$('#sitefiles').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processCSV,
		},
		before: function(file, inputElem) {
			showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			siteCreationCount = 0;
			apiErrorCount = 0;
			$.each(csvData, function() {
				var currentSite = this['SITE NAME'].trim();
				var settings = {
					url: getAPIURL() + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/central/v2/sites',
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({
							site_name: this['SITE NAME'].trim(),
							site_address: {
								address: this['ADDRESS'].trim(),
								city: this['CITY'].trim(),
								state: this['STATE'].trim(),
								country: this['COUNTRY'].trim(),
								zipcode: this['ZIPCODE'].trim(),
							},
						}),
					}),
				};

				return $.ajax(settings).done(function(response) {
					//console.log(response)
					if (response.hasOwnProperty('error_code')) {
						apiErrorCount++;
						if (response.description === 'SITE_ERR_DUPLICATE_SITE_NAME') {
							logError('Site with name "' + currentSite + '" already exists');
						} else {
							logError(response.description + ': ' + currentSite);
						}
					} else if (response.hasOwnProperty('site_name')) {
						logInformation(currentSite + ' added successfully');
					}
					siteCreationCount++;
					if (siteCreationCount >= csvData.length) {
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Site Creation Failure',
								text: 'Some or all Sites failed to be created',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Site Creation Success',
								text: 'All sites were created successfully',
								icon: 'success',
							});
						}
					}
				});
			});
		},
	});
}

function createSite() {
	apiErrorCount = 0;
	var currentSite = document.getElementById('siteName').value.trim();
	var address = document.getElementById('siteAddress').value.trim();
	var city = document.getElementById('siteCity').value.trim();
	var state = document.getElementById('siteState').value.trim();
	var country = document.getElementById('siteCountry').value.trim();
	var zipcode = document.getElementById('siteZipcode').value.trim();

	if (currentSite === '' || address === '' || city === '' || state === '' || country === '' || zipcode === '') {
		showNotification('ca-pin-add', 'Please fill in all fields to add a new Site', 'bottom', 'center', 'warning');
	} else {
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/central/v2/sites',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({
					site_name: currentSite,
					site_address: {
						address: address,
						city: city,
						state: state,
						country: country,
						zipcode: zipcode,
					},
				}),
			}),
		};

		return $.ajax(settings).done(function(response) {
			//console.log(response)
			if (response.hasOwnProperty('error_code')) {
				apiErrorCount++;
				if (response.description === 'SITE_ERR_DUPLICATE_SITE_NAME') {
					logError('Site with name "' + currentSite + '" already exists');
				} else {
					logError(response.description + ': ' + currentSite);
				}
			} else if (response.hasOwnProperty('site_name')) {
				logInformation(currentSite + ' added successfully');
			}
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Site Creation Failure',
					text: 'Site failed to be created',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Site Creation Success',
					text: 'Site "' + currentSite + '" was created successfully',
					icon: 'success',
				});
			}
		});
	}
}

function unassignDeviceFromSite(device) {
	/*  
		remove the device from its current site
	*/
	console.log('removing site from device: ' + device['serial'] + ' from ' + getIDforSite(device['site']));
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: parseInt(getIDforSite(device['site'])) }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
		} else if (response.hasOwnProperty('success')) {
			console.log('Device removed from existing site');
		} else {
			logError('Unable to remove ' + device['serial'] + " from it's current site");
		}
	});
}

function assignDeviceToSite(device, site) {
	/*  
		assigning the device to a site
	*/
	console.log('assigning site ' + site + ' from device: ' + device['serial']);
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: parseInt(site) }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		console.log(response);
		if (response.status !== '200') {
			logError(device['serial'] + ' was not assigned to site ' + site);
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
	var siteId = -1; // used when the site isn't found
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
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Move to Site Failure',
					text: 'Some or all devices failed to be moved to the correct sites',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were moved to the correct sites',
					icon: 'success',
				});
			}
		} else {
			logInformation('Automation: Site assignment complete');
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

	showNotification('ca-world-pin', 'Moving devices into sites...', 'bottom', 'center', 'info');
	moveCounter = 0;
	// Get the device monitoring data (IAP, Switch, Gateway) to determine device type
	$.each(csvData, function() {
		// find device in inventory to get device type
		if (this['SERIAL'] && this['SITE']) {
			var currentSerial = this['SERIAL'].trim();
			var currentSite = this['SITE'].trim();
			if (!currentSite) {
				logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
				moveCounter = moveCounter + 1;
				checkForSiteMoveCompletion();
			} else {
				var found = false;
				// Check APs
				// Find the device and type
				var foundDevice = findDeviceInMonitoring(currentSerial);

				if (!foundDevice) {
					logError('Device with Serial Number: ' + currentSerial + ' was not found in the device monitoring');
					moveCounter = moveCounter + 1;
					checkForSiteMoveCompletion();
				} else {
					if (!foundDevice['site']) {
						console.log('Not assigned to site');
						// add device to site
						siteId = getIDforSite(currentSite);
						if (siteId != -1) {
							assignDeviceToSite(foundDevice, siteId);
						} else {
							logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
							moveCounter = moveCounter + 1;
							checkForSiteMoveCompletion();
						}
					} else if (foundDevice['site'] !== currentSite) {
						// remove from old site,  then add to new site
						console.log('Unassign from site!');
						$.when(unassignDeviceFromSite(foundDevice)).then(function() {
							siteId = getIDforSite(currentSite);
							if (siteId != -1) {
								assignDeviceToSite(foundDevice, siteId);
							} else {
								logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
								moveCounter = moveCounter + 1;
								checkForSiteMoveCompletion();
							}
						});
					} else {
						// no need to move the device. It's already in the correct site
						moveCounter = moveCounter + 1;
						checkForSiteMoveCompletion();
					}
				}
			}
		} else {
			// blank line in CSV
			moveCounter = moveCounter + 1;
			checkForSiteMoveCompletion();
		}
	});
	if (currentWorkflow !== '') {
		return autoSitePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Renaming functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkForRenameCompletion() {
	if (renameCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all devices failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All devices were renamed',
					icon: 'success',
				});
			}
		} else if (currentWorkflow === 'auto-site-rename') {
			logInformation('Automation: Renaming complete');
			autoRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorename') {
			logInformation('Automation: Magic Renaming complete');
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorenameap-portdescriptions') {
			logInformation('Automation: Magic Renaming complete');
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
	$.when(updateInventory()).then(function() {
		showNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL'] && this['DEVICE NAME']) {
				var currentSerial = this['SERIAL'].trim();
				var newHostname = this['DEVICE NAME'].trim();
				if (!newHostname) {
					logError('Device with Serial Number: ' + currentSerial + ' has no device name in the CSV file');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					} else if (deviceType === 'IAP') {
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(response) {
							//console.log(response);
							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							} else if (response.hostname === newHostname) {
								// no need to do anything as the name already matches
								logInformation('Device ' + currentSerial + " hostname doesn't need to be updated");
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							} else {
								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
									}),
								};

								$.ajax(settings).done(function(response) {
									if (response !== currentSerial) {
										logError(device + ' was not renamed');
										//console.log(response.reason);
										apiErrorCount++;
									}
									renameCounter = renameCounter + 1;
									checkForRenameCompletion();
								});
							}
						});
					} else if (deviceType === 'SWITCH') {
						// patch the switch template variables
						var settings = {
							url: getAPIURL() + '/tools/patchCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ total: 1, variables: { _sys_hostname: newHostname } }),
							}),
						};

						$.ajax(settings).done(function(response) {
							if (response !== 'Success') {
								logError('The switch ' + currentSerial + ' was not able to be renamed');
								apiErrorCount++;
							}
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						});
					} else if (deviceType === 'CONTROLLER') {
						// unsupported
						logError('The gateway ' + currentSerial + " was not able to be renamed,  as gateway renaming isn't supported yet");
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					}
				}
			} else {
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
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
	$.when(updateInventory()).then(function() {
		showNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'].trim();
			var currentdevice = this;
			$.when(getAnyTopologyNeighbors(currentSerial)).then(function() {
				//console.log(neighborSwitches)
				// Grab AP name format from localStorage
				var newHostname = localStorage.getItem('ap_naming_format');
				if (newHostname === null || newHostname === '') {
					newHostname = '{{initials}}-{{model}}-{{number}}';
				} else {
					newHostname = newHostname.toLowerCase();
				}

				// Format: SiteInitials-APModel-Number
				if (!currentdevice['SITE'] && (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}'))) {
					logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else if (!neighborSwitches[currentSerial] && (newHostname.includes('{{switch}}') || newHostname.includes('{{port}}'))) {
					logError('Device with Serial Number: ' + currentSerial + ' has neighbor switch information');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else {
					var siteInitials = '';
					var site = '';
					if (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}')) {
						site = currentdevice['SITE'];
						siteInitials = site.match(/\b(\w)/g).join('');
					}
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					} else if (deviceType === 'IAP') {
						// Grab model number
						var model = device.aruba_part_no;
						if (model.startsWith('J')) model = device.model;

						// grab AP number - sequential for each site, and update for next AP.
						var apNumber = renamingCounters[siteInitials];
						if (!apNumber) {
							renamingCounters[siteInitials] = 1;
							apNumber = 1;
						}
						renamingCounters[siteInitials] = apNumber + 1;
						var connectedSwitch = neighborSwitches[currentSerial];
						if (!connectedSwitch) connectedSwitch = {};
						if (!connectedSwitch['neighborName']) connectedSwitch['neighborName'] = 'UnknownSwitch';
						if (!connectedSwitch['remotePort']) connectedSwitch['remotePort'] = 'UnknownPort';

						//  generate string for AP number
						var tripleDigit = padNumber(apNumber, 3);

						// Replace elements in the format
						newHostname = newHostname.replace('{{initials}}', siteInitials);
						newHostname = newHostname.replace('{{site}}', site);
						newHostname = newHostname.replace('{{model}}', model);
						newHostname = newHostname.replace('{{number}}', tripleDigit);
						newHostname = newHostname.replace('{{switch}}', connectedSwitch['neighborName']);
						newHostname = newHostname.replace('{{port}}', connectedSwitch['remotePort']);

						// Replace spaces
						newHostname = newHostname.replace(/ /g, '');

						magicNames[currentSerial] = newHostname; // store incase of enhanced workflow requiring it.

						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(response) {
							//console.log(response);
							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							} else if (response.hostname === newHostname) {
								// no need to do anything as the name already matches
								logInformation('Device ' + currentSerial + " hostname doesn't need to be updated");
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							} else {
								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
									}),
								};

								$.ajax(settings).done(function(response) {
									if (response !== currentSerial) {
										logError(device + ' was not renamed');
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
	if (currentWorkflow !== '') {
		return autoMagicRenamePromise.promise();
	}
}

function checkForUpdatePortCompletion() {
	if (updatePortsCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all ports failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All ports with connected APs were renamed',
					icon: 'success',
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
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/topology_external_api/apNeighbors/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response) {
		var neighbors = response.neighbors;

		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === 'Switch' && this.localPort === 'eth0') {
				neighborSwitches[serial] = this;
				return false;
			}
		});
	});
}

function getTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/topology_external_api/apNeighbors/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response) {
		var neighbors = response.neighbors;
		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === 'Switch' && this.localPort === 'eth0' && findDeviceInMonitoring(this.neighborSerial)) {
				neighborSwitches[serial] = this;
				//console.log(this)
				return false;
			}
		});
	});
}

/* Updated v.1.9 */
function getSwitchPorts(currentSerial) {
	/*  
		Get switch port details from AOS-S UI Group API
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/aos_switch/ports/devices/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response) {
		console.log('Got Switch port details for switch: ' + currentSerial);
		modifiedUISwitches[currentSerial] = response;
	});
}

function updateSwitchPorts(currentSerial) {
	// Update port description with AP hostname
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/aos_switch/ports/devices/' + neighborSwitches[currentSerial].neighborSerial,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ ports: modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports }),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		logInformation('Updating switch port name for AP (' + currentSerial + '): ' + response);
		if (response !== 'Success') {
			logError('The switch port for AP (' + currentSerial + ') was not able to be renamed');
			apiErrorCount++;
		}
		updatePortsCounter = updatePortsCounter + 1;
		checkForUpdatePortCompletion();
	});
}
function updatePortDescription(magic) {
	/*  
		if switch templates - "update" the variable using the switch port variable from settings
		else using UI group - "update" the port number directly
	*/

	updatePortsCounter = 0;
	neighborSwitches = {};
	modifiedUISwitches = {};
	showNotification('ca-card-update', 'Renaming switch ports for connected APs...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var currentSerial = this['SERIAL'].trim();
		var hostname = this['DEVICE NAME'].trim();
		var device = findDeviceInMonitoring(currentSerial);
		if (deviceType === 'IAP') {
			$.when(getTopologyNeighbors(currentSerial)).then(function() {
				if (!neighborSwitches[currentSerial]) {
					updatePortsCounter = updatePortsCounter + 1;
					checkForUpdatePortCompletion();
				} else {
					// Need to check if switch is UI group or Template Group
					var neighborSwitch = findDeviceInMonitoring(neighborSwitches[currentSerial].neighborSerial);
					var switchGroup = {};
					$.each(groups, function() {
						if (this.group === neighborSwitch.group_name) {
							switchGroup = this;
						}
					});
					//console.log(neighborSwitch)

					if (switchGroup['template_details']['Wired']) {
						logInformation('Template Group');
						// If using Templates for switches

						var portName = 'int' + neighborSwitches[currentSerial].remotePort + '_name';
						var variables = {};
						if (magic) {
							// running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}
						variables[portName] = hostname;
						// Update port description with AP hostname
						var settings = {
							url: getAPIURL() + '/tools/patchCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + neighborSwitches[currentSerial].neighborSerial + '/template_variables',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ total: 1, variables: variables }),
							}),
						};

						$.ajax(settings).done(function(response) {
							if (response !== 'Success') {
								logError('The switch port for AP (' + currentSerial + ') was not able to be renamed');
								apiErrorCount++;
							}
							updatePortsCounter = updatePortsCounter + 1;
							checkForUpdatePortCompletion();
						});
					} else if (neighborSwitch.switch_type === 'AOS-S') {
						// If using UI Group for AOS-S switches
						logInformation('AOS-S UI Group');

						if (magic) {
							// running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}

						// if already obtained the switch ports for this switch then just update the port name
						if (modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial]) {
							$.each(modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports, function() {
								if (this['port_id'] === neighborSwitches[currentSerial].remotePort.toString()) {
									this['name'] = hostname;
									updateSwitchPorts(currentSerial);
								}
							});
						} else {
							// get the port details for connected switch
							$.when(getSwitchPorts(neighborSwitches[currentSerial].neighborSerial)).then(function() {
								// then just update the port name
								$.each(modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports, function() {
									if (this['port_id'] === neighborSwitches[currentSerial].remotePort.toString()) {
										this['name'] = hostname;
										updateSwitchPorts(currentSerial);
									}
								});
							});
						}
					} else {
						logInformation('AOS-CX UI Group');
						logError('The switch port for AP (' + currentSerial + ') was not able to be renamed as it is a CX Switch in a UI Group');
						apiErrorCount++;
						updatePortsCounter = updatePortsCounter + 1;
						checkForUpdatePortCompletion();

						// Based on Goldman Sachs UI APIs
						/*
						var variables =  {};
						if (magic) {  // running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}
						
						// Update port description with AP hostname
						var settings = {
							"url": getAPIURL() + "/tools/postCommand",
							"method": "POST",
							"timeout": 0,
							 "headers": {
								"Content-Type": "application/json"
							},
							"data": JSON.stringify({
								"url": localStorage.getItem('base_url') + "/configuration/v1/switch/cx/interfaces?device_serial=" + neighborSwitches[currentSerial].neighborSerial,
								"access_token": localStorage.getItem('access_token'),
								"data": JSON.stringify({"update": {neighborSwitches[currentSerial].remotePort: {"description": hostname}}})
								
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
						*/
					}
				}
			});
		} else {
			updatePortsCounter = updatePortsCounter + 1;
			checkForUpdatePortCompletion();
		}
	});
	if (currentWorkflow !== '') {
		return autoPortPromise.promise();
	}
}

function updateDeviceVariables() {
	/*  
		Update template variables using CSV headers for variable names.
	*/

	updateVariablesCounter = 0;
	showNotification('ca-setup-tools', 'Updating Device Variables...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var variables = {};
		for (let k in this) {
			if (k === 'DEVICE NAME') {
				var hostname_variable = '_sys_hostname';
				variables[hostname_variable] = this[k];
			} else if (k === 'IP ADDRESS') {
				var ip_variable = '_sys_ip_address';
				variables[ip_variable] = this[k];
				/*} else if (k === "SERIAL") {
				var serial_variable = "_sys_serial";
				variables[serial_variable] = this[k];
			} else if (k === "MAC") {
				var mac_variable = "_sys_lan_mac";
				variables[mac_variable] = this[k];*/
			} else if (k !== 'SERIAL' && k !== 'MAC' && k !== 'GROUP' && k !== 'SITE' && k !== 'LICENSE' && this[k] !== '') {
				variables[k] = this[k];
			}
		}
		//console.log(variables)

		var settings = {
			url: getAPIURL() + '/tools/patchCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ total: 1, variables: variables }),
			}),
		};

		$.ajax(settings).done(function(response) {
			if (response !== 'Success') {
				logError('The variables for ' + currentSerial + ' were not able to be updated');
				apiErrorCount++;
			}
			updateVariablesCounter = updateVariablesCounter + 1;
			checkForUpdateVariablesCompletion();
		});
	});
	if (currentWorkflow !== '') {
		return autoVariablesPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Zone functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForZoneCompletion() {
	if (zoneCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Zone Configuration Failure',
					text: 'Some or all devices failed to be set to the correct Zones',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Zone Configuration Success',
					text: 'All devices were set to the correct Zones',
					icon: 'success',
				});
			}
		} /* else if (currentWorkflow === "auto-site-rename"){
			console.log("Automation: Renaming complete")
			autoZonePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorename"){
			console.log("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorenameap-portdescriptions"){
			console.log("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		}*/
	}
}

function setAPZone() {
	/*  
		if AP - grab ap settings via API, then update the zonename
	*/

	zoneCounter = 0;
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		showNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'].trim();
			var newZonename = this['AP ZONE'].trim();
			if (!newZonename) {
				//logError("Device with Serial Number: " + currentSerial + " has no zonename in the CSV file");
				zoneCounter = zoneCounter + 1;
				checkForZoneCompletion();
			} else {
				var device = findDeviceInInventory(currentSerial);
				if (!device) {
					logError('Unable to find device ' + currentSerial + ' in the device inventory');
					apiErrorCount++;
					zoneCounter = zoneCounter + 1;
					checkForZoneCompletion();
				} else if (deviceType === 'IAP') {
					// if AP then get AP settings
					var settings = {
						url: getAPIURL() + '/tools/getCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(response) {
						//console.log(response);
						if (response.hasOwnProperty('error_code')) {
							logError(response.description);
							apiErrorCount++;
							zoneCounter = zoneCounter + 1;
							checkForZoneCompletion();
						} else if (response.zonename === newZonename) {
							// no need to do anything as the name already matches
							logInformation('Device ' + currentSerial + " AP Zone doesn't need to be updated");
							zoneCounter = zoneCounter + 1;
							checkForZoneCompletion();
						} else {
							// Update ap settings
							var settings = {
								url: getAPIURL() + '/tools/postCommand',
								method: 'POST',
								timeout: 0,
								headers: {
									'Content-Type': 'application/json',
								},
								data: JSON.stringify({
									url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
									data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: newZonename, hostname: response.hostname }),
								}),
							};

							$.ajax(settings).done(function(response) {
								if (response !== currentSerial) {
									logError(currentSerial + ' was not assigned to AP Zone "' + newZonename + '". Reason: ' + response.reason);
									//console.log(response.reason);
									apiErrorCount++;
								}
								zoneCounter = zoneCounter + 1;
								checkForZoneCompletion();
							});
						}
					});
				} else {
					// Either switch or controller/gateway
					zoneCounter = zoneCounter + 1;
					checkForZoneCompletion();
				}
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoZonePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Automated Tasks functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function addAndLicense() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added & licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added & licensed',
					icon: 'success',
				});
			}
		});
	});
}

function addAndGroup() {
	autoAddPromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now move devices
		$.when(moveDevicesToGroup()).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added, and moved into a group',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added and moved into a group',
					icon: 'success',
				});
			}
			if (manualGroup) {
				manualGroup = '';
				var mgd = document.getElementById('manualGroupDiv');
				mgd.style.display = 'none';
			}
		});
	});
}

function addLicenseGroup() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			// licensing completed  - now move devices
			$.when(moveDevicesToGroup()).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, licensed and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added, licensed and moved into a group',
						icon: 'success',
					});
				}
				if (manualGroup) {
					manualGroup = '';
					var mgd = document.getElementById('manualGroupDiv');
					mgd.style.display = 'none';
				}
			});
		});
	});
}

function siteAndRename() {
	autoSitePromise = new $.Deferred();
	autoRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		$.when(renameDevices()).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRename() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function renameAndPortDescriptions() {
	autoRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(renameDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(updatePortDescription()).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: "Some or all devices failed to be renamed and/or port descriptions didn't update",
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were renamed and port descriptions updated',
					icon: 'success',
				});
			}
		});
	});
}

function autoRenameAndPortDescriptions() {
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	//  need the   auto  magical renaming  based  on  site name
	$.when(magicRenameDevices()).then(function() {
		// update port descriptions with magic AP Name
		$.when(updatePortDescription('magic')).then(function() {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were moved to site, renamed and port descriptions updated',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRenameAndPortDescriptions() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			// update port descriptions with magic AP Name
			$.when(updatePortDescription('magic')).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were moved to site, renamed and port descriptions updated',
						icon: 'success',
					});
				}
			});
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		MSP functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getIDforCustomer(customer) {
	/*  
		get customer from customer monitoring data
		return customer_id for matching customer
	*/
	var customerId = -1; // used when the customer isn't found
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
		if (!this['CUSTOMER']) containsCustomer = false;
		return false;
	});
	return containsCustomer;
}

function selectCustomer() {
	var select = document.getElementById('customerselector');
	manualCustomer = select.value;
	document.getElementById('manualCustomerParagraph').innerText = 'Manual Customer: ' + manualCustomer;
	var mcd = document.getElementById('manualCustomerDiv');
	mcd.style.display = 'block';
	showNotification('ca-folder-replace', manualCustomer + ' will be used for devices with no customer assigned. Please re-run the task.', 'top', 'center', 'warning');
}

function showMSPCard(display) {
	var x = document.getElementById('msp_card');
	if (display) {
		x.style.display = 'block';
	} else {
		x.style.display = 'none';
	}
}

function isMSP(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/devices?limit=1&offset=0&device_allocation_status=0&device_type=iap',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('message')) {
			if (response.message.includes('Permission denied')) {
				showMSPCard(false);
				logInformation('Not an MSP user - keeping MSP card hidden');
			} else {
				showMSPCard(true);
				logInformation('MSP user - enabling MSP card');
			}
		} else {
			showMSPCard(true);
			logInformation('MSP user - enabling MSP card');
		}
	});
}

function updateMSPData() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification('ca-contactless-card', 'Updating MSP Data...', 'bottom', 'center', 'info');
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	apPromise = new $.Deferred();
	switchPromise = new $.Deferred();
	gatewayPromise = new $.Deferred();
	customerPromise = new $.Deferred();
	inventoryPromise = new $.Deferred();
	$.when(getMSPAPData(0), getMSPSwitchData(0), getMSPGatewayData(0), getMSPCustomerData(0)).then(function() {
		//console.log('Got ALL Inventories');
		inventoryPromise.resolve();
	});
	getGroupData(0);
	return inventoryPromise.promise();
}

function getMSPAPData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=iap',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspAPs.length == mspAPCount) {
				apPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(response) {
		//console.log(response)
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).addClass('text-warning');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '' + response.deviceList.total_devices + '';
			if (offset === 0) {
				mspAPs = [];
				mspAPCount = response.deviceList.total_devices;
				$('#ap-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspAPs = mspAPs.concat(response.deviceList.devices);
			$.each(response.deviceList.devices, function() {
				var clean = this['tier_type'];
				if (clean) clean = titleCase(clean);

				// Add row to table
				var table = $('#ap-table').DataTable();
				table.row.add([this['customer_name'], this['aruba_part_no'] + ' (' + this['model'] + ')', this['serial'], this['macaddr'], clean]);
			});

			if (offset + apiMSPLimit < response.deviceList.total_devices) getMSPAPData(offset + apiMSPLimit);
			else {
				// Force reload of table data
				$('#ap-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('ap_icon')).removeClass('text-warning');
				$(document.getElementById('ap_icon')).addClass('text-success');
			}
		}
	});
	return apPromise.promise();
}

function getMSPSwitchData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=switch',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspSwitches.length == mspSwitchCount) {
				switchPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).addClass('text-warning');
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '' + response.deviceList.total_devices + '';
			if (offset === 0) {
				mspSwitches = [];
				mspSwitchCount = response.deviceList.total_devices;
				$('#switch-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspSwitches = mspSwitches.concat(response.deviceList.devices);
			$.each(response.deviceList.devices, function() {
				var clean = this['tier_type'];
				if (clean) clean = titleCase(clean);

				// Add row to table
				var table = $('#switch-table').DataTable();
				table.row.add([this['customer_name'], this['aruba_part_no'] + ' (' + this['model'] + ')', this['serial'], this['macaddr'], clean]);
			});

			if (offset + apiMSPLimit < response.deviceList.total_devices) getMSPSwitchData(offset + apiMSPLimit);
			else {
				// Force reload of table data
				$('#switch-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('switch_icon')).removeClass('text-warning');
				$(document.getElementById('switch_icon')).addClass('text-success');
			}
		}
	});
	return switchPromise.promise();
}

function getMSPGatewayData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=all_controller',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspGateways.length == mspGatwayCount) {
				gatewayPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '' + response.deviceList.total_devices + '';
			if (offset === 0) {
				mspGateways = [];
				mspGatwayCount = response.deviceList.total_devices;
				$('#gateway-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspGateways = mspGateways.concat(response.deviceList.devices);
			$.each(response.deviceList.devices, function() {
				var clean = this['tier_type'];
				if (clean) clean = titleCase(clean);

				// Add row to table
				var table = $('#gateway-table').DataTable();
				table.row.add([this['customer_name'], this['aruba_part_no'] + ' (' + this['model'] + ')', this['serial'], this['macaddr'], clean]);
			});

			if (offset + apiMSPLimit < response.deviceList.total_devices) getMSPSwitchData(offset + apiMSPLimit);
			else {
				// Force reload of table data
				$('#gateway-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('gateway_icon')).removeClass('text-warning');
				$(document.getElementById('gateway_icon')).addClass('text-success');
			}
		}
	});
	return gatewayPromise.promise();
}

function getMSPCustomerData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/customers?limit=' + apiMSPLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspGateways.length == mspGatwayCount) {
				customerPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('customer_icon')).removeClass('text-success');
			$(document.getElementById('customer_icon')).addClass('text-warning');
			if (document.getElementById('customer_count')) document.getElementById('customer_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('customer_count')) document.getElementById('customer_count').innerHTML = '' + response.total + '';

			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset === 0) {
				mspCustomers = [];
				mspCustomerCount = response.total;
				$('#customer-table')
					.DataTable()
					.rows()
					.remove();
				if (page.includes('workflow-msp')) {
					// remove old groups from the selector
					select = document.getElementById('customerselector');
					select.options.length = 0;
				}
			}
			mspCustomers = mspCustomers.concat(response.customers);
			$.each(response.customers, function() {
				// Cleanup string responses
				var clean = this['account_status'];
				if (clean) clean = titleCase(noUnderscore(clean));

				var customerGroup = '';
				if (this['group']) customerGroup = this.group.name;
				// Add row to table
				var table = $('#customer-table').DataTable();
				table.row.add([this['customer_name'], this['account_type'], clean, customerGroup, this['description']]);

				// Grab MSP ID for use later on
				mspID = this['msp_id'];

				if (page.includes('workflow-msp')) {
					// Add site to the dropdown selector
					$('#customerselector').append($('<option>', { value: this['customer_name'], text: this['customer_name'] }));
				}
			});

			if (offset + apiMSPLimit < response.total) getMSPCustomerData(offset + apiMSPLimit);
			else {
				// Force reload of table data
				$('#customer-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('customer_icon')).removeClass('text-warning');
				$(document.getElementById('customer_icon')).addClass('text-success');
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
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Customer Assignment Failure',
					text: 'Some or all devices failed to move to the specified customer',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Customer Assignment Success',
					text: 'All devices were to moved to the specified customers',
					icon: 'success',
				});
			}
			if (manualCustomer) {
				manualCustomer = '';
				var mcd = document.getElementById('manualCustomerDiv');
				mcd.style.display = 'none';
			}
			updateMSPData();
		} else {
			logInformation('Automation: Customer assignment complete');
			autoCustomerPromise.resolve();
		}
	}
}

function unassignDeviceFromCustomer(device) {
	/*  
		Assign device back to MSP
	*/
	var deviceSerial = device['SERIAL'];
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + mspID + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: [{ serial: device['serial'], mac: device['macaddr'] }] }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for device: ' + deviceSerial);
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
	var deviceSerial = device['SERIAL'];
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + customerId + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: [{ serial: device['serial'], mac: device['macaddr'] }] }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for device: ' + deviceSerial);
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
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + mspID + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: devices }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for supplied devices');
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
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + customerId + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: devices }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.status != 202) {
			if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for supplied devices');
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
	showNotification('ca-exchange', 'Assigning devices to customers...', 'bottom', 'center', 'info');
	moveCounter = 0;
	$.each(csvData, function() {
		var selectedCustomer = manualCustomer;
		var currentSerial = this['SERIAL'].trim();
		var foundDevice = findDeviceInMonitoring(currentSerial);
		if (this['CUSTOMER']) selectedCustomer = this['CUSTOMER'].trim();

		if (foundDevice && foundDevice.customer_name === selectedCustomer) {
			console.log('No need to change Customer');
			moveCounter = moveCounter + 1;
			checkForCustomerMoveCompletion();
		} else if (foundDevice && foundDevice.customer_name !== selectedCustomer && getIDforCustomer(foundDevice.customer_name) != -1) {
			console.log('Assigning device back to MSP');
			$.when(unassignDeviceFromCustomer(foundDevice)).then(function() {
				// now assign to new Customer ID
				console.log('Assigning device to ' + selectedCustomer);
				assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
			});
		} else {
			console.log('assigning customer');
			assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
		}
	});
	if (currentWorkflow !== '') {
		return autoCustomerPromise.promise();
	}
}

function assignAllDevicesToCustomer() {
	/*  
		Move each device to the selected customer
	*/
	showNotification('ca-exchange', 'Assigning devices to a single customer...', 'bottom', 'center', 'info');
	moveCounter = 0;
	var devicesArray = [];
	var unassignDevicesArray = [];
	$.each(csvData, function() {
		var foundDevice = findDeviceInMonitoring(this['SERIAL'].trim());
		if (foundDevice && getIDforCustomer(foundDevice.customer_name) != -1) {
			unassignDevicesArray.push({ serial: this['SERIAL'].trim(), mac: cleanMACAddress(this['MAC']) });
		}
		devicesArray.push({ serial: this['SERIAL'].trim(), mac: cleanMACAddress(this['MAC']) });
	});

	var selectedCustomer = manualCustomer;
	//console.log("assigning all devices back to MSP")
	if (unassignDevicesArray.length != 0) {
		$.when(unassignDevicesFromCustomers(unassignDevicesArray)).then(function() {
			// now assign to new Customer ID
			console.log('Assigning all devices to ' + selectedCustomer);
			assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
		});
	} else {
		assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
	}
	if (currentWorkflow !== '') {
		return autoCustomerPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		MSP Automation functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function addAndCustomers() {
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now move devices
		$.when(updateMSPData()).then(function() {
			$.when(assignDevicesToCustomer()).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added and moved into a group',
						icon: 'success',
					});
				}
				if (manualCustomer) {
					manualCustomer = '';
					var mcd = document.getElementById('manualCustomerDiv');
					mcd.style.display = 'none';
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
	$.when(addDevices()).then(function() {
		// need to refresh MSPData - will need to wait.
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignDevicesToCustomer()).then(function() {
				$.when(updateMSPData()).then(function() {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function() {
						// licensing completed
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Automation Failure',
								text: 'Some or all devices failed to be added, assigned to customer and licensed',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Automation Success',
								text: 'All devices were added, assigned and licensed',
								icon: 'success',
							});
						}
						if (manualCustomer) {
							manualCustomer = '';
							var mcd = document.getElementById('manualCustomerDiv');
							mcd.style.display = 'none';
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
	$.when(addDevices()).then(function() {
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added and moved into a group',
						icon: 'success',
					});
				}
				if (manualCustomer) {
					manualCustomer = '';
					var mcd = document.getElementById('manualCustomerDiv');
					mcd.style.display = 'none';
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
	$.when(addDevices()).then(function() {
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function() {
				$.when(updateMSPData()).then(function() {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function() {
						// licensing completed
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Automation Failure',
								text: 'Some or all devices failed to be added, assigned to customer and licensed',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Automation Success',
								text: 'All devices were added, assigned and licensed',
								icon: 'success',
							});
						}
						if (manualCustomer) {
							manualCustomer = '';
							var mcd = document.getElementById('manualCustomerDiv');
							mcd.style.display = 'none';
						}
						updateMSPData();
					});
				});
			});
		});
	});
}

function createCustomer() {
	var customerName = document.getElementById('customerName').value;
	var customerDescription = document.getElementById('customerDescription').value;
	var addToGroupValue = document.getElementById('addToGroupCheckbox').checked;
	var selectedGroup = document.getElementById('groupselector').value;

	showNotification('ca-c-add', 'Adding new Customer...', 'bottom', 'center', 'info');

	var data;
	if (addToGroupValue) {
		data = JSON.stringify({ customer_name: customerName, description: customerDescription, group: { name: selectedGroup } });
	} else {
		data = JSON.stringify({ customer_name: customerName, description: customerDescription });
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/customers',
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.status_code == 200) {
			Swal.fire({
				title: 'Add Success',
				text: 'Customer was successfully created',
				icon: 'success',
			});
			// refresh group data to include new group
			getMSPCustomerData(0);
		} else {
			logError(response.status);
			Swal.fire({
				title: 'Add Failure',
				text: 'Customer was not able to be created',
				icon: 'error',
			});
		}
	});
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
						Site Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function getSwitchType(serial) {
	var currentSwitch = null;
	$.each(switches, function() {
		if (this['serial'] === serial) {
			currentSwitch = this;
			return false;
		}
	});
	if (currentSwitch['model'].includes('60') || currentSwitch['model'].includes('61') || currentSwitch['model'].includes('62') || currentSwitch['model'].includes('63') || currentSwitch['model'].includes('64') || currentSwitch['model'].includes('83') || currentSwitch['model'].includes('84')) {
		return 'AOS-CX';
	} else {
		return 'AOS-S';
	}
}

function getSwitchPortDetails(serial) {
	var url = '/monitoring/v1/switches/';
	if (getSwitchType(serial) === 'AOS-CX') url = '/monitoring/v1/cx_switches/';
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + url + serial + '/ports',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	/* $.ajax returns a promise*/

	return $.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			switchPortDetails[serial] = response.ports;
		}
	});
}

function showLayerOne() {
	showNotification('ca-cable', 'Finding LLDP Neighbours of every AP at the Site...', 'bottom', 'center', 'info');
	$('#layerone-table')
		.DataTable()
		.rows()
		.remove();
	$('#layerone-table')
		.DataTable()
		.clear();
	$('#LayerOneModalLink').trigger('click');

	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	var siteAPs = getAPsForSite(selectedSite);
	neighborSwitches = {};
	switchPortDetails = {};
	$.each(siteAPs, function() {
		var currentSerial = this['serial'];
		var currentAP = this['name'];
		if (this['mesh_role'] !== 'Point') {
			$.when(getTopologyNeighbors(currentSerial)).then(function() {
				if (!neighborSwitches[currentSerial]) {
					//console.log("didnt find the switch")
				} else {
					// get switch port details
					$.when(getSwitchPortDetails(neighborSwitches[currentSerial].neighborSerial)).then(function() {
						$.each(switchPortDetails[neighborSwitches[currentSerial].neighborSerial], function() {
							if (this['port_number'] === neighborSwitches[currentSerial].remotePort) {
								// add data to table!
								var poe = this['power_consumption'];
								if (!poe) poe = 'Unknown';
								var inErrors = this['in_errors'];
								if (!Number.isInteger(inErrors)) inErrors = '';
								var outErrors = this['out_errors'];
								if (!Number.isInteger(outErrors)) outErrors = '';

								var status = '<i class="fa fa-circle text-danger"></i>';
								if (this['status'] == 'Up') {
									status = '<i class="fa fa-circle text-success"></i>';
								}

								var table = $('#layerone-table').DataTable();
								table.row.add(['<strong>' + currentAP + '</strong>', status, neighborSwitches[currentSerial].neighborHostName, this['port_number'], poe, this['speed'], this['duplex_mode'], inErrors, outErrors]);
								$('#layerone-table')
									.DataTable()
									.rows()
									.draw();
							}
						});
					});
				}
			});
		}
	});
}
