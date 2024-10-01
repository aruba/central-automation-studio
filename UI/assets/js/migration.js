/*
Central Automation v1.4.4
Updated: 1.36.0
� Aaron Scott (WiFi Downunder) 2021-2024
*/

var centralURLs = [
	{
		'https://apigw-apacsouth.central.arubanetworks.com': 'https://app-apacsouth.central.arubanetworks.com',
		'https://api-ap.central.arubanetworks.com': 'https://app2-ap.central.arubanetworks.com',
		'https://internal-apigw.central.arubanetworks.com': 'https://internal-ui.central.arubanetworks.com',
		'https://app1-apigw.central.arubanetworks.com': 'https://app.central.arubanetworks.com',
		'https://apigw-prod2.central.arubanetworks.com': 'https://app-prod2-ui.central.arubanetworks.com',
		'https://apigw-us-east-1.central.arubanetworks.com': 'https://app-us-east-1.central.arubanetworks.com',
		'https://apigw-uswest4.central.arubanetworks.com': 'https://app-uswest4.central.arubanetworks.com',
		'https://apigw-cmcsa1api.aruba.b4b.comcast.net': 'https://cmcsa1.aruba.b4b.comcast.net',
		'https://apigw-ca.central.arubanetworks.com': 'https://app-ca.central.arubanetworks.com',
		'https://apigw.central.arubanetworks.com.cn': 'https://app.central.arubanetworks.com.cn',
		'https://apigw-apaceast.central.arubanetworks.com': 'https://app-apaceast.central.arubanetworks.com',
		'https://eu-apigw.central.arubanetworks.com': 'https://app2-eu.central.arubanetworks.com',
		'https://apigw-eucentral2.central.arubanetworks.com': 'https://app-eucentral2.central.arubanetworks.com',
		'https://apigw-eucentral3.central.arubanetworks.com': 'https://app-eucentral3.central.arubanetworks.com',
		'https://apigw-uaenorth1.central.arubanetworks.com': 'https://app-uaenorth1.central.arubanetworks.com',
	},
];

function getCentralURLs() {
	return centralURLs;
}

var centralClusters = 
	{
		'US-1': {url: 'https://app1-apigw.central.arubanetworks.com', type: 'Public'},
		'US-2': {url: 'https://apigw-prod2.central.arubanetworks.com', type: 'Public'},
		'US-EAST-1': {url: 'https://apigw-us-east-1.central.arubanetworks.com', type: 'Public'},
		'US-WEST-4': {url: 'https://apigw-uswest4.central.arubanetworks.com', type: 'Public'},
		'APAC-1': {url: 'https://api-ap.central.arubanetworks.com', type: 'Public'},
		'APAC-EAST1': {url: 'https://apigw-apaceast.central.arubanetworks.com', type: 'Public'},
		'APAC-SOUTH1': {url: 'https://apigw-apacsouth.central.arubanetworks.com', type: 'Public'},
		'EU-1': {url: 'https://eu-apigw.central.arubanetworks.com', type: 'Public'},
		'EU-2': {url: 'https://apigw-eucentral2.central.arubanetworks.com', type: 'Public'},
		'EU-3': {url: 'https://apigw-eucentral3.central.arubanetworks.com', type: 'Public'},
		'Canada-1': {url: 'https://apigw-ca.central.arubanetworks.com', type: 'Public'},
		'CN-North': {url: 'https://apigw.central.arubanetworks.com.cn', type: 'Public'},
		'UAE-North': {url: 'https://apigw-uaenorth1.central.arubanetworks.com', type: 'Public'},
		'Internal': {url: 'https://internal-apigw.central.arubanetworks.com', type: 'Private'},
		'CMCSA1': {url: 'https://apigw-cmcsa1api.aruba.b4b.comcast.net', type: 'Private'},
		'STGTHDNAAS':{url: 'https://apigw-stgthdnaas.central.arubanetworks.com', type: 'Private'},
		'Central On-Prem': {url: 'COP', type: 'Private'},
	};

var clusterNames = 
	{
		'https://app1-apigw.central.arubanetworks.com': 'US-1',
		'https://apigw-prod2.central.arubanetworks.com': 'US-2',
		'https://apigw-us-east-1.central.arubanetworks.com': 'US-EAST-1',
		'https://apigw-uswest4.central.arubanetworks.com': 'US-WEST4',
		'https://api-ap.central.arubanetworks.com': 'APAC-1',
		'https://apigw-apaceast.central.arubanetworks.com': 'APAC-EAST1',
		'https://apigw-apacsouth.central.arubanetworks.com': 'APAC-SOUTH1',
		'https://eu-apigw.central.arubanetworks.com': 'EU-1',
		'https://apigw-eucentral2.central.arubanetworks.com': 'EU-2',
		'https://apigw-eucentral3.central.arubanetworks.com': 'EU-3',
		'https://apigw-ca.central.arubanetworks.com': 'Canada-1',
		'https://apigw.central.arubanetworks.com.cn': 'CN-North',
		'https://apigw-uaenorth1.central.arubanetworks.com': 'UAE-North',
		'https://internal-apigw.central.arubanetworks.com': 'Internal',
		'https://apigw-cmcsa1api.aruba.b4b.comcast.net': 'CMCSA1',
		'https://apigw-stgthdnaas.central.arubanetworks.com':'STGTHDNAAS',
		COP: 'Central On-Prem',
	};

var api_url = 'https://api.wifidownunder.com';
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';

var maxSimultaneousGroups = 5;
var groupDetails = [];
var groupPromise;
var groupDetailsPromise;
var wlanPromise;
var devicePromise;
var sitesPromise;
var sourceLicensingPromise;
var destinationLicensingPromise;
var groupErrorCounter = 0;
var errorCounter = 0;
var wlanCounter = 0;
var countryCounter = 0;
var wlanConfigs = {};
var countryCodes = {};
var wlanConfigLocations = {};
var authConfigLocations = {};
var cppmConfigLocations = {};
var templateGroups = [];
var templateGroupCounter = 0;
var templateErrorCounter = 0;
var templateTotal = {};
var variableCounter = 0;
var variableErrorCounter = 0;
var variableTotal = 0;
var variablesDone = false;
var destinationSites = [];
var destinationSitesPromise;
var siteCounter = 0;
var siteTotal = 0;
var labelCounter = 0;
var labelTotal = 0;
var deviceCount = 0;
var deviceTotal = 0;
var uiDevicesToMigrate = [];
var templateDevicesToMigrate = [];
var devicesToMigrate = [];
var apsToMigrate = [];
var switchesToMigrate = [];
var apLicense = 'Advanced';
var licenseErrorCount = 0;

var adminUserPrefix = 'hash-mgmt-user admin password ';
var wlanPrefix = 'wlan ssid-profile ';
var authServerPrefix = 'wlan auth-server ';

var groupNotification;
var wlanNotification;
var templateNotification;
var siteNotification;
var labelNotification;
var wlanNotification;
var authNotification;
var dstAuthNotification;


var configGroups = [];

var csvLicense;

var testCounter = 0;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	 	Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}

function generateCSVForDevices(devices) {
	//CSV header
	var siteKey = 'SITE';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';
	var licenseKey = 'LICENSE';

	var csvData = [];
	$.each(devices, function() {
		var currentDevice = this;

		$.each(aps, function() {
			if (this['serial'] === currentDevice['serial']) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'], [licenseKey]: apLicense });
			}
		});

		$.each(switches, function() {
			if (this['serial'] === currentDevice['serial']) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		/*$.each(gateways, function() {
			if (this["serial"] === currentDevice["serial"]) {
				csvData.push({[nameKey]: this["name"], [serialKey]: this["serial"], [macKey]: this["macaddr"], [groupKey]: this["group_name"], [siteKey]: this["site"]});
			}  
		});*/
	});
	return csvData;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function populateCentralClusters() {
	for (let k in centralClusters) {
		$('#clusterselector').append($('<option>', { value: centralClusters[k].url, text: k }));
		$('#destination_clusterselector').append($('<option>', { value: centralClusters[k].url, text: k }));
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Load and Save from Local Storage functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function onFinishSetup() {
	// Save all supplied addresses and details
	localStorage.setItem('client_id', $('#client_id').val());
	localStorage.setItem('client_secret', $('#client_secret').val());
	localStorage.setItem('base_url', document.getElementById('clusterselector').value);
	localStorage.setItem('refresh_token', $('#refresh_token').val());
	localStorage.setItem('access_token', $('#access_token').val());
	localStorage.setItem('destination_client_id', $('#destination_client_id').val());
	localStorage.setItem('destination_client_secret', $('#destination_client_secret').val());
	localStorage.setItem('destination_base_url', document.getElementById('destination_clusterselector').value);
	localStorage.setItem('destination_refresh_token', $('#destination_refresh_token').val());
	localStorage.setItem('destination_access_token', $('#destination_access_token').val());
	localStorage.setItem('destination_password', $('#destination_password').val());
	localStorage.setItem('destination_secret', $('#destination_secret').val());
	localStorage.setItem('destination_cppm', $('#destination_cppm').val());

	testCounter = 0;
	
	sourceTokenRefresh();
	destinationTokenRefresh();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Authentication functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Refresh the Auth token and Access token for the source
function sourceTokenRefresh() {
	authNotification = showLongNotification('ca-padlock', 'Authenticating with Source Central...', 'bottom', 'center', 'info');
	var settings = {
		url: api_url + '/auth/refresh',
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
				if (authNotification) {
					authNotification.update({ type: 'danger', message: 'Authenticated with Source Central Failed: ' + response.error_description });
					setTimeout(authNotification.close, 1000);
				}
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
					testCounter++;
					checkTestCounter();
				}
				if (authNotification) {
					authNotification.update({ type: 'success', message: 'Authenticated with Source Central Successful' });
					setTimeout(authNotification.close, 1000);
				}
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
			checkTestCounter();
			if (authNotification) authNotification.close();
		});
}

function destinationTokenRefresh() {
	dstAuthNotification = showLongNotification('ca-padlock', 'Authenticating with Destination Central...', 'bottom', 'center', 'info');
	var settings = {
		url: api_url + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: localStorage.getItem('destination_client_id'),
			client_secret: localStorage.getItem('destination_client_secret'),
			access_token: localStorage.getItem('destination_access_token'),
			refresh_token: localStorage.getItem('destination_refresh_token'),
			base_url: localStorage.getItem('destination_base_url'),
		}),
	};

	return $.ajax(settings)
		.done(function(response) {
			//console.log(response);
			if (response.hasOwnProperty('error')) {
				if (dstAuthNotification) {
					dstAuthNotification.update({ type: 'danger', message: 'Authenticated with Destination Central Failed: ' + response.error_description });
					setTimeout(dstAuthNotification.close, 1000);
				}
			} else {
				localStorage.setItem('destination_refresh_token', response.refresh_token);
				localStorage.setItem('destination_access_token', response.access_token);
				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('settings')) {
					document.getElementById('destination_refresh_token').value = response.refresh_token;
					document.getElementById('destination_access_token').value = response.access_token;
					if (dstAuthNotification) {
						dstAuthNotification.update({ type: 'success', message: 'Authenticated with Destination Central Successful' });
						setTimeout(dstAuthNotification.close, 1000);
					}
					testCounter++;
					checkTestCounter();
				}
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
			dstAuthNotification.close();
			checkTestCounter();
		});
}

function checkTestCounter() {
	if (testCounter == 2) {
		setTimeout(goToMigrationPage, 1500);
	}
}

function goToMigrationPage() {
	window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'migration.html';
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Migration functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function confirmChoices() {
	if ((document.getElementById('uiConfigCheckbox').checked || document.getElementById('templateConfigCheckbox').checked) && (document.getElementById('templateDeviceCheckbox').checked || document.getElementById('uiDeviceCheckbox').checked)) {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Migrating devices will move devices between Central accounts. Configurations will be copied.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#23CCEF',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, do it!',
		}).then(result => {
			if (result.isConfirmed) {
				migrateSelectedOptions();
			}
		});
	} else if (document.getElementById('templateDeviceCheckbox').checked || document.getElementById('uiDeviceCheckbox').checked) {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Migrating devices will move devices between Central accounts. Ensure configurations have already been migrated.',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#23CCEF',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, move them!',
		}).then(result => {
			if (result.isConfirmed) {
				migrateSelectedOptions();
			}
		});
	} else if (document.getElementById('siteDeviceCheckbox').checked) {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Devices need to have been already migrated to the destination account to assign sites',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#23CCEF',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, assign them!',
		}).then(result => {
			if (result.isConfirmed) {
				migrateSelectedOptions();
			}
		});
	} else {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Your configurations will be copied from the source account to the destination account',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#23CCEF',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, copy them!',
		}).then(result => {
			if (result.isConfirmed) {
				migrateSelectedOptions();
			}
		});
	}
}

function migrateSelectedOptions() {
	// Make sure the Access Tokens are still good to use
	$.when(sourceTokenRefresh(), destinationTokenRefresh()).then(function() {
		errorCounter = 0;
		wlanCounter = 0;
		clearErrorLog();

		// Migrate Sites
		if (document.getElementById('siteDeviceCheckbox').checked && document.getElementById('siteCheckbox').checked) {
			$.when(migrateSites()).then(function() {
				getGroupInformation();
				$.when(updateInventory(false)).then(function() {
					assignDevicesToSites();
				});
			});
		}

		if (document.getElementById('siteCheckbox').checked) {
			migrateSites();
		}

		if (document.getElementById('siteDeviceCheckbox').checked) {
			getGroupInformation();
			$.when(updateInventory(false)).then(function() {
				assignDevicesToSites();
			});
		}

		// Migrate Labels
		if (document.getElementById('labelCheckbox').checked) {
			migrateLabels();
		}

		if (document.getElementById('uiDeviceCheckbox').checked || document.getElementById('templateDeviceCheckbox').checked) {
			// If migrating devices, disable auto-licensing
			// Disable auto licensing on both accounts
			sourceLicensingPromise = new $.Deferred();
			destinationLicensingPromise = new $.Deferred();
			$.when(disableDestinationAutoLicensing(), disableSourceAutoLicensing()).then(function() {
				// can now move on with auto licensing disabled.

				// Grab full group details and device inventory - since its used by config migrations
				getGroupInformation();
				$.when(updateInventory(false)).then(function() {
					// unassign licenses from devices in source account
					sourceLicensingPromise = new $.Deferred();
					var devicesToUnLicense = devicesToMigrate;
					if (document.getElementById('uiDeviceCheckbox').checked && !document.getElementById('templateDeviceCheckbox').checked) devicesToUnLicense = uiDevicesToMigrate;
					if (!document.getElementById('uiDeviceCheckbox').checked && document.getElementById('templateDeviceCheckbox').checked) devicesToUnLicense = templateDevicesToMigrate;
					$.when(unlicenseSourceDevices(devicesToUnLicense)).then(function() {
						console.log('All devices in groups have been un-assigned');
						showNotification('ca-license-key', 'Licenses un-assigned from source devices', 'bottom', 'center', 'success');
						coreMigration();
					});
				});
			});
		} else if (document.getElementById('groupCheckbox').checked || document.getElementById('uiConfigCheckbox').checked || document.getElementById('templateConfigCheckbox').checked || document.getElementById('templateVariableCheckbox').checked) {
			// No device migration, so no need to touch the licensing at all.
			// Grab full group details and device inventory - since its used by config migrations
			getGroupInformation();
			$.when(updateInventory(false)).then(function() {
				coreMigration();
			});
		}
	});
}

function coreMigration() {
	// reset some counters
	variableTotal = 0;
	variableCounter = 0;
	variableErrorCounter = 0;
	variablesDone = false;

	// If groups are to be migrated.
	if (document.getElementById('groupCheckbox').checked) {
		// Wait for groups to be migrated.
		groupPromise = new $.Deferred();
		wlanPromise = new $.Deferred();
		devicePromise = new $.Deferred();

		$.when(migrateGroups()).then(function() {
			// If WLAN UI Config is selected...
			if (document.getElementById('uiConfigCheckbox').checked && document.getElementById('uiDeviceCheckbox').checked) {
				// migrate WLAN config
				$.when(migrateWLANConfig()).then(function() {
					// once config is migrated - migrate UI devices
					migrateUIDevices();
				});
			} else if (document.getElementById('uiConfigCheckbox').checked) {
				migrateWLANConfig();
			} else if (document.getElementById('uiDeviceCheckbox').checked) {
				migrateUIDevices();
			}

			if (document.getElementById('templateConfigCheckbox').checked) {
				migrateTemplateConfig();
			}

			if (document.getElementById('templateDeviceCheckbox').checked) {
				$.when(migrateTemplateDevices()).then(function() {
					if (document.getElementById('templateVariableCheckbox').checked) {
						showNotification('ca-document-copy', 'Obtaining a batch of variables...', 'bottom', 'center', 'info');
						migrateVariables(0);
					}
				});
			} else if (document.getElementById('templateVariableCheckbox').checked) {
				showNotification('ca-document-copy', 'Obtaining a batch of variables...', 'bottom', 'center', 'info');
				migrateVariables(0);
			}
		});
	} else {
		wlanPromise = new $.Deferred();
		devicePromise = new $.Deferred();
		// If WLAN UI Config is selected...
		if (document.getElementById('uiConfigCheckbox').checked && document.getElementById('uiDeviceCheckbox').checked) {
			// migrate WLAN config
			$.when(migrateWLANConfig()).then(function() {
				// once config is migrated - migrate UI devices
				migrateUIDevices();
			});
		} else if (document.getElementById('uiConfigCheckbox').checked) {
			migrateWLANConfig();
		} else if (document.getElementById('uiDeviceCheckbox').checked) {
			migrateUIDevices();
		}

		if (document.getElementById('templateConfigCheckbox').checked) {
			migrateTemplateConfig();
		}

		if (document.getElementById('templateDeviceCheckbox').checked) {
			$.when(migrateTemplateDevices()).then(function() {
				if (document.getElementById('templateVariableCheckbox').checked) {
					showNotification('ca-document-copy', 'Obtaining a batch of variables...', 'bottom', 'center', 'info');
					migrateVariables(0);
				}
			});
		} else if (document.getElementById('templateVariableCheckbox').checked) {
			showNotification('ca-document-copy', 'Obtaining a batch of variables...', 'bottom', 'center', 'info');
			migrateVariables(0);
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function selectAll() {
	configGroups = getGroups();
	$.each(configGroups, function(idx, val) {
		$('#groupselector option[value="' + val.group + '"]').prop('selected', document.getElementById('selectAllGroups').checked);
	});
	$('.selectpicker').selectpicker('refresh');
}

function checkSelectionCount() {
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);
	if (selectedGroups.length == 0) {
		document.getElementById('selectAllGroups').checked = false;
	} else if (selectedGroups.length == configGroups.length) {
		document.getElementById('selectAllGroups').checked = true;
	} else {
		document.getElementById('selectAllGroups').checked = false;
	}
}

function getGroupInformation() {
	groupNotification = showLongNotification('ca-folder-settings', 'Getting Existing Group Details...', 'bottom', 'center', 'info');

	// get selected Groups
	var select = document.getElementById('groupselector');
	var groups = [...select.selectedOptions].map(option => option.value);

	// Get the already stored groups
	var currentGroupDetails = getGroups();
	groupDetails = [];

	$.each(groups, function() {
		var groupName = this;
		$.each(currentGroupDetails, function() {
			if (this['group'] == groupName) {
				groupDetails.push(this);
				return false;
			}
		});
	});
	getDevicesInGroups(groupDetails);
}

function getDevicesInGroups(groups) {
	devicesToMigrate = [];
	templateDevicesToMigrate = [];
	uiDevicesToMigrate = [];
	apsToMigrate = [];
	switchesToMigrate = [];

	var apDevices, switchDevices;
	$.each(groups, function() {
		apDevices = getAPsForGroup(this['group']);
		apsToMigrate = apsToMigrate.concat(apDevices);
		devicesToMigrate = devicesToMigrate.concat(apDevices);
		if (this['template_details']['Wireless']) {
			// if it is a template group add to the templateDevicesToMigrate
			templateDevicesToMigrate = templateDevicesToMigrate.concat(apDevices);
		} else {
			// if it is a UI group add to the uiDevicesToMigrate
			uiDevicesToMigrate = uiDevicesToMigrate.concat(apDevices);
		}

		switchDevices = getSwitchesForGroup(this['group']);
		switchesToMigrate = switchesToMigrate.concat(switchDevices);
		if (this['template_details']['Wired']) {
			// if it is a template group add to the templateDevicesToMigrate
			devicesToMigrate = devicesToMigrate.concat(switchDevices);
			templateDevicesToMigrate = templateDevicesToMigrate.concat(switchDevices);
		} else {
			// if it is a UI group - Ignore due to no APIs to migrate switch UI groups
		}
	});
	if (groupNotification) {
		groupNotification.update({ type: 'success', message: 'Existing Group Details Obtained.' });
		setTimeout(groupNotification.close, 1000);
	}
}

function migrateGroups() {
	groupNotification = showLongNotification('ca-folder-settings', 'Migrating Groups...', 'bottom', 'center', 'info');

	// Now have the group details.
	// Time to create the groups on the destination account with the default password
	var dPassword = localStorage.getItem('destination_password');
	if (dPassword == null || dPassword == 'undefined') {
		dPassword = 'Central123!';
	}
	var groupCreationCounter = 0;
	groupErrorCounter = 0;
	$.each(groupDetails, function() {
		var currentGroup = this;
		if (currentGroup !== 'default' && currentGroup !== 'unprovisioned') {
			// default and unprovisioned groups already exist in every account - no need to migrate it

			var apiCall = '/configuration/v2/groups';

			var data = {};
			data['group'] = currentGroup.group;
			data['group_attributes'] = {};
			data['group_attributes']['group_password'] = dPassword;
			if ('template_details' in currentGroup) data['group_attributes']['template_info'] = currentGroup['template_details'];
			else if ('template_info' in currentGroup) data['group_attributes']['template_info'] = currentGroup['template_info'];
			if ('group_properties' in currentGroup) {
				data['group_attributes']['group_properties'] = currentGroup['group_properties'];
				apiCall = '/configuration/v3/groups';
			}

			var settings = {
				url: api_url + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + apiCall,
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify(data),
				}),
			};

			$.ajax(settings).done(function(response) {
				groupCreationCounter++;
				if (response !== 'Created') {
					logError(response.description);
					groupErrorCounter++;
				}
				if (groupCreationCounter == groupDetails.length) {
					// done migrating the groups
					groupPromise.resolve();
					if (groupErrorCounter > 0) {
						showLog();
						if (groupNotification) {
							groupNotification.update({ type: 'warning', message: groupErrorCounter + ' groups were not migrated to the Destination Central' });
							setTimeout(groupNotification.close, 1000);
						}
					} else {
						if (groupNotification) {
							groupNotification.update({ type: 'success', message: groupDetails.length + ' groups migrated to the Destination Central' });
							setTimeout(groupNotification.close, 1000);
						}
					}
				}
			});
		} else {
			groupCreationCounter++;
		}
	});
	return groupPromise.promise();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN UI Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkDeviceLicensing() {
	if (document.getElementById('uiDeviceCheckbox').checked) {
		//document.getElementById("autoLicensingCheckbox").checked = true;
	}
}

function prepareWLAN() {
	$('#migration-table')
		.DataTable()
		.clear();
	$('#migration-table')
		.DataTable()
		.rows()
		.draw();
	document.getElementById('pskCheckbox').checked = false;
	document.getElementById('confirmBtn').disabled = true;
	document.getElementById('psk_loading').style.display = 'block';
	document.getElementById('passphraseLabel').style.color = 'black';
	document.getElementById('passphraseLabel').innerHTML = 'Passphrases obtained for all PSK WLANs';

	wlanCounter = 0;
	wlanConfigs = {};
	wlanConfigLocations = {};
	cppmConfigLocations = {};
	$.when(sourceTokenRefresh()).then(function() {
		getGroupInformation();

		wlanNotification = showLongNotification('ca-wifi', 'Getting Group WLAN Configs...', 'bottom', 'center', 'info');
		$('#MigrationModalLink').trigger('click');
		// Grab config for each Group in Central
		$.each(groupDetails, function() {
			var currentGroup = this.group;

			// only migrate groups config that aren't "unprovisioned" and that are not template groups
			if (currentGroup !== 'unprovisioned' && this['template_details']['Wireless'] == false) {
				var settings = {
					url: api_url + '/tools/getCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentGroup,
						access_token: localStorage.getItem('access_token'),
					}),
				};

				$.ajax(settings).done(function(response) {
					//console.log(response)
					// Save the configs
					wlanConfigs[currentGroup] = response;
					var pskPromise = new $.Deferred();
					var authPromise = new $.Deferred();

					// need to check for PSKs - and get passphrase
					setWLANAdminPassword(currentGroup);
					$.when(getPSKsForConfig(pskPromise, currentGroup), getAuthServersFromConfig(authPromise, currentGroup)).then(function() {
						wlanCounter++;
						if (wlanCounter == groupDetails.length) {
							// show that psks have be obtained
							// show that Auth servers need to be updated with shared secrets
							console.log('Finished this processing WLANs');
							if (wlanNotification) {
								wlanNotification.update({ type: 'success', message: 'Finished this processing WLANs' });
								setTimeout(wlanNotification.close, 1000);
							}
							document.getElementById('pskCheckbox').checked = true;
							document.getElementById('confirmBtn').disabled = false;
							document.getElementById('psk_loading').style.display = 'none';
						}
					});
				});

				var settingsCountry = {
					url: api_url + '/tools/getCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/' + currentGroup + '/country',
						access_token: localStorage.getItem('access_token'),
					}),
				};

				$.ajax(settingsCountry).done(function(response) {
					// Save the configs
					countryCodes[currentGroup] = response['country'];
				});
			} else {
				wlanCounter++;
			}
		});
	});
}

function setWLANAdminPassword(currentGroup) {
	var dPassword = localStorage.getItem('destination_password');
	if (dPassword != null && dPassword != 'undefined') {
		var config = wlanConfigs[currentGroup];
		if (config.length) {
			for (i = 0; i < config.length; i++) {
				var currentLine = config[i];

				// Find admin user line
				if (currentLine.includes(adminUserPrefix)) {
					config[i] = adminUserPrefix + 'cleartext ' + dPassword;
					wlanConfigs[currentGroup] = config;
					break;
				}
			}
		}
	}
}

function getPSKsForConfig(pskPromise, currentGroup) {
	// Find the existing WLAN
	var passphraseIndex = -1;
	var wlanName = '';
	var config = wlanConfigs[currentGroup];
	var pskCounter = 0;
	wlanConfigLocations[currentGroup] = {};

	// check if is a UI group (this doesn't work for template groups...)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the WLAN
			if (currentLine.includes(wlanPrefix)) {
				// pull out the wlan name.
				wlanName = currentLine.replace(wlanPrefix, '');
			} else if (currentLine.includes('  wpa-passphrase ')) {
				passphraseIndex = i;
				// next line after the end of the WLAN
				if (!wlanName.includes(' ')) {
					// remember location for WLAN passphrase in config
					var currentLocations = wlanConfigLocations[currentGroup];
					currentLocations[wlanName] = i;
					wlanConfigLocations[currentGroup] = currentLocations;

					pskCounter++;
					var settings = {
						url: api_url + '/tools/getCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/wlan/' + currentGroup + '/' + wlanName,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(response) {
						//console.log(response)
						if (response.hasOwnProperty('error_code')) {
							errorCounter++;
							if (response.description.includes('WLAN Northbound API is not enabled for customer')) {
								logError('Due to missing WLAN Northbound API, passphrases can not be automatically obtained. Ask your Aruba SE about getting this API enabled');
								document.getElementById('passphraseLabel').style.color = 'red';
								document.getElementById('passphraseLabel').innerHTML = 'Due to missing WLAN Northbound API, passphrases can not be automatically obtained. Ask your Aruba SE about getting this API enabled';
								pskPromise.resolve();
							}
						} else {
							// pull out passphrase and then replace it in the correct location in the config
							var passphrase = response.wlan.wpa_passphrase;
							config[wlanConfigLocations[currentGroup][response.wlan.name]] = '  wpa-passphrase ' + passphrase;
							pskCounter--;
							if (pskCounter == 0) {
								// if all passphrases have been replaced - save the config and resolve.
								wlanConfigs[currentGroup] = config;
								pskPromise.resolve();
							}
						}
					});
				}
			}
		}
		if (passphraseIndex == -1) {
			// no PSK networks in config
			return pskPromise.resolve();
		}
	}
	return pskPromise.promise();
}

function getAuthServersFromConfig(authPromise, currentGroup) {
	// Find the existing WLAN
	var serverName = '';
	var config = wlanConfigs[currentGroup];
	var authCounter = 0;
	authConfigLocations[currentGroup] = {};
	cppmConfigLocations[currentGroup] = {};

	var dPassword = localStorage.getItem('destination_secret');
	if (dPassword == null || dPassword == 'undefined') {
		dPassword = '';
	}

	var cppmPassword = localStorage.getItem('destination_cppm');
	if (cppmPassword == null || cppmPassword == 'undefined') {
		cppmPassword = '';
	}

	// check if is a UI group (this doesn't work for template groups...)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the Auth Server
			if (currentLine.includes(authServerPrefix)) {
				// pull out the auth server name.
				if (currentLine.includes('_#guest#_')) serverName = '';
				else serverName = currentLine.replace(authServerPrefix, '');
			} else if (currentLine.includes('  key ') && serverName != '') {
				// remember location for the shared secret in config
				var currentLocations = authConfigLocations[currentGroup];
				currentLocations[serverName] = i;
				authConfigLocations[currentGroup] = currentLocations;

				// build table with auth Servers - to be able to set the shared secrets
				var table = $('#migration-table').DataTable();
				// Add row to table
				table.row.add([currentGroup, serverName, '<input type="text" name="' + currentGroup + '%' + serverName + '" id="' + currentGroup + '%' + serverName + '" value="' + dPassword + '">', '<input type="text" name="' + currentGroup + '%' + serverName + '%cppm" id="' + currentGroup + '%' + serverName + '%cppm" value="" disabled>']);
				$('#migration-table')
					.DataTable()
					.rows()
					.draw();
			} else if (currentLine.includes('cppm username ') && serverName != '') {
				// remember location for the cppm username/password in config
				var currentCPPMLocations = cppmConfigLocations[currentGroup];
				currentCPPMLocations[serverName] = i;
				cppmConfigLocations[currentGroup] = currentCPPMLocations;

				// update the last row with the cppm pasword box
				var table = $('#migration-table').DataTable();
				var lastRow = table.rows().count() - 1;
				var temp = table.row(lastRow).data();
				temp[3] = '<input type="text" name="' + currentGroup + '%' + serverName + '%cppm" id="' + currentGroup + '%' + serverName + '%cppm" value="' + cppmPassword + '">';
				table
					.row(lastRow)
					.data(temp)
					.draw();
			}
		}
	}
	return authPromise.resolve();
}

function confirmWLAN() {
	// grab the text field data
	$('#migration-table')
		.DataTable()
		.rows()
		.every(function(rowIdx, tableLoop, rowLoop) {
			// replace the "  key ********" line in the config with new shared secret
			var data = this.data();

			var currentGroup = data[0];
			var serverName = data[1];
			var sharedSecret = data[2].replace('<input type="text" name="' + currentGroup + '%' + serverName + '" id="' + currentGroup + '%' + serverName + '" value="', '');
			sharedSecret = sharedSecret.replace('">', '');
			var cppmPassword = data[3].replace('<input type="text" name="' + currentGroup + '%' + serverName + '%cppm" id="' + currentGroup + '%' + serverName + '%cppm" value="', '');
			cppmPassword = cppmPassword.replace('">', '');

			var config = wlanConfigs[currentGroup];

			var configLine = authConfigLocations[currentGroup][serverName];
			config[configLine] = '  key ' + sharedSecret;

			var configCPPMLine = cppmConfigLocations[currentGroup][serverName];
			if (configCPPMLine) {
				config[configCPPMLine] = config[configCPPMLine].replace('********', cppmPassword);
			}

			wlanConfigs[currentGroup] = config;
			//console.log(wlanConfigs[currentGroup])
		});

	document.getElementById('uiConfigCheckbox').disabled = false;
	document.getElementById('uiConfigCheckbox').checked = true;
	document.getElementById('uiDeviceCheckbox').disabled = false;
	document.getElementById('uiDeviceCheckbox').checked = true;
	document.getElementById('groupCheckbox').checked = true;
}

function migrateWLANConfig() {
	// need to push config to destination Central group.
	showNotification('ca-wifi', 'Migrating WLAN UI Group Configurations...', 'bottom', 'center', 'info');
	countryCounter = 0;
	$.each(groupDetails, function() {
		var currentGroup = this.group;

		// only migrate groups config that aren't "unprovisioned" and that are not template groups
		if (currentGroup !== 'unprovisioned' && this['template_details']['Wireless'] == false) {
			putCountryCodeForGroup(currentGroup);
			var settings = {
				url: api_url + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/configuration/v1/ap_cli/' + currentGroup,
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify({ clis: wlanConfigs[currentGroup] }),
				}),
			};

			//console.log(wlanConfigs[currentGroup]);
			$.ajax(settings).done(function(response) {
				console.log('Migrating WLAN Config for ' + currentGroup + ': ' + JSON.stringify(response));
				wlanCounter++;
				if (response.reason && response.reason == 'Bad Gateway') {
					Swal.fire({
						title: 'API Issue',
						text: 'There is an issue communicating with the API Gateway',
						icon: 'warning',
					});
				} else if (response.code && response.code == 429) {
					logError('Unable to migrate WLAN config for Group ' + currentGroup);
					Swal.fire({
						title: 'API Limit Reached',
						text: 'You have reached your daily API limit. No more API calls will succeed today.',
						icon: 'warning',
					});
				} else if (response.description) {
					logError(response.description);
					errorCounter++;
				} else if (response !== '' + currentGroup) {
					logError('Unable to migrate WLAN config for Group ' + currentGroup);
					errorCounter++;
				}
				//console.log("wlanCounter: "+wlanCounter);
				//console.log("groupDetails.length: "+groupDetails.length)
				if (wlanCounter == groupDetails.length) {
					wlanPromise.resolve();
					if (errorCounter != 0) {
						showLog();
						showNotification('ca-wifi', 'Some WLAN GUI Config failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
					} else {
						showNotification('ca-wifi', 'WLAN GUI Config for ' + groupDetails.length + ' groups migrated to the Destination Central', 'bottom', 'center', 'success');
					}
				}
			});
		} else {
			// No need to migrate nothing :)
			wlanCounter++;
		}
	});
	return wlanPromise.promise();
}

function putCountryCodeForGroup(currentGroup) {
	if (countryCodes[currentGroup]) {
		var settings = {
			url: api_url + '/tools/putCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('destination_base_url') + '/configuration/v1/country',
				access_token: localStorage.getItem('destination_access_token'),
				data: JSON.stringify({ groups: [currentGroup], country: countryCodes[currentGroup] }),
			}),
		};

		$.ajax(settings).done(function(response) {
			//console.log(response)
			countryCounter++;
			if (response.reason && response.reason == 'Bad Gateway') {
				Swal.fire({
					title: 'API Issue',
					text: 'There is an issue communicating with the API Gateway',
					icon: 'warning',
				});
			} else if (response.code && response.code == 429) {
				logError('Unable to migrate WLAN config for Group ' + currentGroup);
				Swal.fire({
					title: 'API Limit Reached',
					text: 'You have reached your daily API limit. No more API calls will succeed today.',
					icon: 'warning',
				});
			} else if (response.description) {
				logError(response.description);
				errorCounter++;
			} else if (response !== '' + currentGroup && response !== 'Success') {
				logError('Unable to migrate WLAN Country for Group ' + currentGroup);
				errorCounter++;
			}
			if (countryCounter == groupDetails.length) {
				if (errorCounter != 0) {
					showLog();
					showNotification('ca-wifi', errorCounter + ' WLAN GUI Config Country Codes failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
				} else {
					showNotification('ca-wifi', 'WLAN GUI Config Country Codes migrated to the Destination Central for ' + groupDetails.length + ' groups', 'bottom', 'center', 'success');
				}
			}
		});
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template functions 
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkTemplateDevices() {
	if (document.getElementById('templateDeviceCheckbox').checked) {
		document.getElementById('templateVariableCheckbox').checked = true;
		//document.getElementById("autoLicensingCheckbox").checked = true;
	}
}

function migrateTemplateConfig() {
	templateGroups = [];
	templateGroupCounter = 0;
	templateTotal = {};
	templateErrorCounter = 0;
	showNotification('ca-document-copy', 'Getting Templates and Variables...', 'bottom', 'center', 'info');

	// only migrate groups config that aren't "unprovisioned" and that are template groups
	$.each(groupDetails, function() {
		var currentGroup = this.group;
		if (currentGroup !== 'unprovisioned' && (this['template_details']['Wireless'] == true || this['template_details']['Wired'] == true)) {
			templateGroups.push(this);
		}
	});

	// Grab templates for each Group in Central
	$.each(templateGroups, function() {
		getTemplatesForGroup(this['group'], 0);
	});
}

function getTemplatesForGroup(currentGroup, offset) {
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/groups/' + currentGroup + '/templates?limit=20&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		// For each Template in the group - get the template text.
		templateTotal[currentGroup] = response.total;
		var templateCounter = 0;
		if (response.total > 0) {
			$.each(response.data, function() {
				var templateName = this.name;
				var model = this.model;
				var deviceType = this.device_type;
				var version = this.version;
				var settings2 = {
					url: api_url + '/tools/getCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/groups/' + currentGroup + '/templates/' + templateName,
						access_token: localStorage.getItem('access_token'),
					}),
				};

				// Copy the template over to the destination account/group
				$.ajax(settings2).done(function(response) {
					var templateText = response.responseBody;
					//console.log(templateText)
					//console.log(btoa(templateText))
					var params = 'name=' + templateName + '&device_type=' + deviceType + '&version=' + version + '&model=' + model;
					var settingsPost = {
						url: api_url + '/tools/postFormDataCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('destination_base_url') + '/configuration/v1/groups/' + currentGroup + '/templates?name=' + templateName + '&device_type=' + deviceType + '&version=' + version + '&model=' + model,
							access_token: localStorage.getItem('destination_access_token'),
							template: templateText,
						}),
					};

					$.ajax(settingsPost).done(function(response) {
						console.log('Template ' + templateName + ' in ' + currentGroup + ': ' + JSON.stringify(response));
						templateCounter++;
						if (response !== 'Created') {
							logError('Template with same name or same device type, model & version exists in the group: ' + currentGroup + ' (' + templateName + ')');
							templateErrorCounter++;
						}
						if (templateCounter == templateTotal[currentGroup]) {
							templateGroupCounter++;
							checkIfTemplatesComplete();
						}
					});
				});
			});
		} else {
			templateGroupCounter++;
			checkIfTemplatesComplete();
		}
	});

	if (offset + apiGroupLimit <= templateTotal[currentGroup]) {
		getTemplatesForGroup(currentGroup, offset + apiGroupLimit);
	}
}

function checkIfTemplatesComplete() {
	if (templateGroupCounter == templateGroups.length) {
		if (templateErrorCounter != 0) {
			showLog();
			showNotification('ca-document-copy', templateErrorCounter + ' Templates failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
		} else {
			showNotification('ca-document-copy', 'Templates from ' + templateGroups.length + ' groups migrated to the Destination Central', 'bottom', 'center', 'success');
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Variables functions 
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateVariables(offset) {
	//  Get all variables for all devices
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/template_variables?format=JSON&limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		var variablesText = response;
		var variableSerials = Object.keys(variablesText);

		// Remove any variables for devices not being migrated.
		// Check device serial numbers against the templateDevicesToMigrate list. Remove any that are not being copied
		$.each(variableSerials, function() {
			var currentSerial = String(this);
			var found = false;
			$.each(templateDevicesToMigrate, function() {
				if (this['serial'] === currentSerial) {
					found = true;
					return false; // break  out of the for loop
				}
			});
			if (!found) {
				delete variablesText[currentSerial];
			}
		});

		if (variableSerials.length == apiGroupLimit) {
			showNotification('ca-document-copy', 'Obtaining another batch of variables...', 'bottom', 'center', 'info');
			// not an empty result - there might be more to get
			variablesDone = false;
			migrateVariables(offset + apiGroupLimit);
		} else {
			variablesDone = true;
			showNotification('ca-document-copy', 'Obtained all variables from the Source Account', 'bottom', 'center', 'info');
		}

		if (Object.keys(variablesText).length != 0) {
			console.log('Variables to Migrate: ' + JSON.stringify(variablesText));
			// There are variables in this batch to upload
			var settingsPost = {
				url: api_url + '/tools/postFormDataCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/configuration/v1/devices/template_variables?format=JSON',
					access_token: localStorage.getItem('destination_access_token'),
					variables: JSON.stringify(variablesText),
				}),
			};

			$.ajax(settingsPost).done(function(response) {
				console.log('Variable upload response:' + JSON.stringify(response));
				variableCounter += Object.keys(variablesText).length;
				if (response !== 'Success') {
					logError(response.description);
					variableErrorCounter++;
				}
				checkIfVariablesComplete();
			});
		} else {
			console.log('No variables to upload in this batch');
			// No variables in this batch that match the template devices.
			checkIfVariablesComplete();
		}
	});
}

function checkIfVariablesComplete() {
	if (variableCounter >= templateDevicesToMigrate.length && variablesDone) {
		console.log('Migrated Template Variables...');
		if (variableErrorCounter != 0) {
			showLog();
			showNotification('ca-document-copy', 'Some Variables failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
		} else {
			showNotification('ca-document-copy', 'Variables migrated to the Destination Central', 'bottom', 'center', 'success');
			if (document.getElementById('autoLicensingCheckbox').checked) {
				console.log('Licensing Template Devices');
				licenseDestinationDevices(templateDevicesToMigrate);
			}
		}
	} else {
		console.log('Migrating Template Variables not yet complete...');
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateTemplateDevices() {
	var migrateDeviceErrorCount = 0;
	showNotification('ca-c-add', 'Migrating Template Group Devices...', 'bottom', 'center', 'info');
	console.log('Migrating Template Group Devices...');
	var templateAddCounter = 0;

	var csvTemplateDevices = generateCSVForDevices(templateDevicesToMigrate);
	var devices = [];
	$.each(csvTemplateDevices, function() {
		// build array for uploading.
		if (!this['SERIAL'] && !this['MAC']) {
			return false;
		}
		devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim() });
	});

	var settings = {
		url: api_url + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('destination_base_url') + '/device_inventory/v1/devices',
			access_token: localStorage.getItem('destination_access_token'),
			data: JSON.stringify(devices),
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				migrateDeviceErrorCount++;
			}
		}

		if (response.extra && response.extra.error_code === 'ATHENA_ERROR_NO_DEVICE') {
			if (response.extra.message.invalid_device && response.extra.message.invalid_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.invalid_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						logError('Device with Serial number "' + this.serial + '" is already added to Central or is an invalid MAC address');
					} else if (this.status === 'INVALID_MAC_SN') {
						logError('Device with Serial number "' + this.serial + '" is invalid');
					}
					migrateDeviceErrorCount++;
				});
			} else if (response.extra.message.blocked_device && response.extra.message.blocked_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.blocked_device, function() {
					logError('Device with Serial number "' + this.serial + '" is blocked from being added to your destination Central account');
					migrateDeviceErrorCount++;
				});
			}
		}

		//addCounter = addCounter + 1;
		templateAddCounter = templateAddCounter + devices.length;
		if (templateAddCounter == csvTemplateDevices.length) {
			if (migrateDeviceErrorCount != 0) {
				showLog();
				showNotification('ca-c-add', 'Template devices failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
			} else {
				showNotification('ca-c-add', csvTemplateDevices.length + ' Template devices have been to migrated to the Destination Central', 'bottom', 'center', 'success');
				// License the devices in the destination account
				addDevicesToDestinationGroup(csvTemplateDevices, false);
				console.log('Migrated Template Group Devices...');
				devicePromise.resolve();
			}
		}
	});

	return devicePromise.promise();
}

function migrateUIDevices() {
	var migrateAPErrorCount = 0;
	var uiAddCounter = 0;
	showNotification('ca-c-add', 'Migrating UI Group Devices...', 'bottom', 'center', 'info');

	var csvUIDevices = generateCSVForDevices(uiDevicesToMigrate);
	var devices = [];
	$.each(csvUIDevices, function() {
		// build array for uploading.

		if (!this['SERIAL'] && !this['MAC']) {
			return false;
		}
		devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim() });
	});
	console.log('About to migrate: ' + JSON.stringify(devices));

	var settings = {
		url: api_url + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('destination_base_url') + '/platform/device_inventory/v1/devices',
			access_token: localStorage.getItem('destination_access_token'),
			data: JSON.stringify(devices),
		}),
	};

	$.ajax(settings).done(function(response) {
		console.log('UI Group device response: ' + JSON.stringify(response));
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				migrateAPErrorCount++;
			}
		}

		// check for erroring devices
		if (response.extra && response.extra.error_code === 'ATHENA_ERROR_NO_DEVICE') {
			if (response.extra.message.invalid_device && response.extra.message.invalid_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.invalid_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						logError('Device with Serial number "' + this.serial + '" is already added to Central or is an invalid MAC address');
					} else if (this.status === 'INVALID_MAC_SN') {
						logError('Device with Serial number "' + this.serial + '" is invalid');
					}
					migrateAPErrorCount++;
				});
			}
			if (response.extra.message.blocked_device && response.extra.message.blocked_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.blocked_device, function() {
					logError('Device with Serial number "' + this.serial + '" is blocked from being added to your destination Central account');
					migrateAPErrorCount++;
				});
			}
		}

		//addCounter = addCounter + 1;
		uiAddCounter = uiAddCounter + devices.length;
		console.log(uiAddCounter);
		console.log(csvUIDevices.length);
		if (uiAddCounter == csvUIDevices.length) {
			if (migrateAPErrorCount != 0) {
				showLog();
				showNotification('ca-c-add', 'UI Group APs failed to migrate to the Destination Central', 'bottom', 'center', 'warning');
			} else {
				showNotification('ca-c-add', csvUIDevices.length + ' APs have been to migrated to the Destination Central', 'bottom', 'center', 'success');
				// add devices to correct group and License the devices in the destination account
				addDevicesToDestinationGroup(csvUIDevices, true);
			}
		}
	});
}

function addDevicesToDestinationGroup(devices, licenseDevices) {
	showNotification('ca-folder-replace', 'Moving devices into groups...', 'bottom', 'center', 'info');
	moveCounter = 0;
	var moveErrorCounter = 0;
	$.each(groupDetails, function() {
		// Build a list of serial numbers for each group - one API call per group
		var selectedGroup = this['group'];
		var serialArray = [];

		$.each(devices, function() {
			if (this['GROUP'] === selectedGroup) serialArray.push(this['SERIAL']);
		});
		//console.log("Devices in this group: "+JSON.stringify(serialArray))
		//console.log(serialArray)
		// Need to split up into 50 device blocks (API limitation)
		while (serialArray.length > 0) {
			var serialBlock = [];
			serialBlock = serialArray.splice(0, 50);
			console.log('Adding Devices to ' + selectedGroup + ': ' + JSON.stringify(serialBlock));
			var settings = {
				url: api_url + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/configuration/v1/devices/move',
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify({ group: selectedGroup, serials: serialBlock }),
				}),
			};

			$.ajax(settings).done(function(response) {
				console.log(serialBlock.length + ' devices moved into group ' + selectedGroup + ': ' + JSON.stringify(response));
				if (response.hasOwnProperty('error_code')) {
					logError(response.description);
					moveErrorCounter++;
				}
				moveCounter = moveCounter + serialBlock.length;
				if (moveCounter == devices.length) {
					if (moveErrorCounter != 0) {
						showLog();
						showNotification('ca-folder-replace', moveErrorCounter + ' Devices failed moved into groups', 'bottom', 'center', 'warning');
					} else {
						showNotification('ca-folder-replace', devices.length + ' Devices moved into groups', 'bottom', 'center', 'success');
						if (licenseDevices && document.getElementById('autoLicensingCheckbox').checked) licenseDestinationDevices(devices);
					}
				}
			});
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Licensing functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function disableSourceAutoLicensing() {
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/customer/settings/autolicense',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		// Grab the group details for each bunch of groups
		var settings2 = {
			url: api_url + '/tools/deleteCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/platform/licensing/v1/customer/settings/autolicense',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ services: response.services }),
			}),
		};

		$.ajax(settings2).done(function(response) {
			if (response.status && response.status === '200') {
				showNotification('ca-license-key', 'Auto Licensing disabled on source account', 'bottom', 'center', 'success');
				sourceLicensingPromise.resolve();
			} else {
				showNotification('ca-license-key', 'Failed to disable Auto Licensing on source account', 'bottom', 'center', 'danger');
			}
		});
	});
	return sourceLicensingPromise.promise();
}

function disableDestinationAutoLicensing() {
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('destination_base_url') + '/platform/licensing/v1/customer/settings/autolicense',
			access_token: localStorage.getItem('destination_access_token'),
		}),
	};

	$.ajax(settings)
		.done(function(response) {
			console.log('Disabling Auto Licensing on Destination: ' + JSON.stringify(response));
			// Grab the group details for each bunch of groups
			var settings2 = {
				url: api_url + '/tools/deleteCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/platform/licensing/v1/customer/settings/autolicense',
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify({ services: response.services }),
				}),
			};

			$.ajax(settings2).done(function(response) {
				if ((response.status && response.status === '200') || Object.keys(response).length === 0) {
					showNotification('ca-license-key', 'Auto Licensing disabled on destination account', 'bottom', 'center', 'success');
					destinationLicensingPromise.resolve();
				} else {
					showNotification('ca-license-key', 'Failed to disable Auto Licensing on destination account', 'bottom', 'center', 'danger');
				}
			});
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Failed to disable Auto Licensing on destination account');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-license-key', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-license-key', 'Failed to disable Auto Licensing on destination account', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
	return destinationLicensingPromise.promise();
}

/* ORIGINAL CODE v1.5.x 
function unlicenseSourceDevices(devices) {
	licenseCounter = 0;
	showNotification("ca-license-key", "Unassigning licenses from devices", "bottom", "center", 'info');
				
	// unassign license from each device
	$.each(devices, function() {
		// find the device to be able to get current license assigned.
		var device = findDeviceInInventory(this["serial"]);
		if (device["services"].length > 0) {
			//console.log(device["services"])
			// Update licensing
			var settings = {
				"url": api_url + "/tools/postCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": localStorage.getItem('base_url') + "/platform/licensing/v1/subscriptions/unassign",
					"access_token": localStorage.getItem('access_token'),
					"data": JSON.stringify({"serials": [ this["serial"] ], "services": device["services"] })
				})
			};

			$.ajax(settings).done(function (response) {
				//console.log(response);
				if (Array.isArray(response.status)) {
					if (response.status[0].message.msg) {
						logError(response.status[0].message.msg);
					} else { 
						logError(titleCase(noUnderscore(response.status[0].error_code)) + " ("+currentSerial+")");
					}
				}
				licenseCounter = licenseCounter + 1;
				if (licenseCounter == devices.length) {
					sourceLicensingPromise.resolve();
				}
			});
		} else {
			licenseCounter = licenseCounter + 1;
			if (licenseCounter == devices.length) {
				sourceLicensingPromise.resolve();
			}
		}
	});
	return sourceLicensingPromise.promise();
}
*/

/* New CODE v1.6.0 */
function unlicenseSourceDevices(devices) {
	licenseCounter = 0;
	showNotification('ca-license-key', 'Un-assigning licenses from devices', 'bottom', 'center', 'info');

	// variable to hold the device list per license service
	var serviceList = {};

	// unassign license from each device
	$.each(devices, function() {
		// find the device to be able to get current license assigned.
		var device = findDeviceInInventory(this['serial']);
		if (device['services'].length > 0) {
			// convert the services into a string
			var serviceName = JSON.stringify(device['services']);
			// check if other devices have the same services assigned
			if (!serviceList[serviceName]) {
				serviceList[serviceName] = [];
			}

			// Add serial to the list that matches the services.
			var serials = serviceList[serviceName];
			serials.push(this['serial']);
			serviceList[serviceName] = serials;
		}
	});

	for (const [key, value] of Object.entries(serviceList)) {
		var serials = value;

		// Update licensing
		var settings = {
			url: api_url + '/tools/postCommand',
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

		$.ajax(settings).done(function(response) {
			//console.log(response);
			if (Array.isArray(response.status)) {
				if (response.status[0].message.msg) {
					logError(response.status[0].message.msg);
				} else {
					logError('There was an error un-assigning licenses.');
				}
				showNotification('ca-license-key', 'Un-assigning licenses from devices failed', 'bottom', 'center', 'danger');
			} else {
				licenseCounter++;
			}
			if (licenseCounter == Object.keys(serviceList).length) {
				sourceLicensingPromise.resolve();
			}
		});
	}

	// just in case none have licenses assigned.
	if (licenseCounter == Object.keys(serviceList).length) {
		sourceLicensingPromise.resolve();
	}
	return sourceLicensingPromise.promise();
}

function licenseDestinationDevices(devices) {
	var csvLicense = generateCSVForDevices(devices);

	licenseErrorCount = 0;
	licenseCounter = 0;
	showNotification('ca-license-key', 'Licensing devices...', 'bottom', 'center', 'info');
	$.each(csvLicense, function() {
		// find device in inventory to get device type
		var currentSerial = this['SERIAL'].trim();
		if (currentSerial === '') return true;

		// Find the device and type
		var foundDevice = findDeviceInInventory(currentSerial);

		if (!foundDevice) {
			logError('Device with Serial Number: ' + currentSerial + ' was not found in the device inventory');
			licenseCounter = licenseCounter + 1;
			checkForLicensingCompletion();
		} else if (foundDevice['services'].length > 0) {
			// Get the old license type from the inventory and match it on the destination
			var settings = {
				url: api_url + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/platform/licensing/v1/subscriptions/assign',
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify({ serials: [currentSerial], services: foundDevice['services'] }),
				}),
			};

			$.ajax(settings).done(function(response) {
				console.log('licenseDestinationDevices: ' + JSON.stringify(response));
				if (Array.isArray(response.status)) {
					if (response.status[0].message.msg) {
						logError(response.status[0].message.msg);
					} else {
						logError(titleCase(noUnderscore(response.status[0].error_code)) + ' (' + currentSerial + ')');
					}
					licenseErrorCount++;
				}
				licenseCounter = licenseCounter + 1;
				checkForLicensingCompletion();
			});
		} else {
			licenseCounter = licenseCounter + 1;
			checkForLicensingCompletion();
		}
	});
}

function checkForLicensingCompletion() {
	if (licenseCounter == csvLicense.length) {
		if (licenseErrorCount != 0) {
			showLog();
			showNotification('ca-license-key', 'Some licenses were not assigned in the destination account', 'bottom', 'center', 'danger');
		} else {
			showNotification('ca-license-key', 'Licenses were assigned in the destination account', 'bottom', 'center', 'success');
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Sites functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function assigningDevicesCheckbox() {
	if (document.getElementById('siteDeviceCheckbox').checked) {
		document.getElementById('autoLicensingCheckbox').checked = false;
		document.getElementById('groupCheckbox').checked = false;
		document.getElementById('uiConfigCheckbox').checked = false;
		document.getElementById('uiDeviceCheckbox').checked = false;
		document.getElementById('templateConfigCheckbox').checked = false;
		document.getElementById('templateVariableCheckbox').checked = false;
		document.getElementById('templateDeviceCheckbox').checked = false;
	}
}

function migrateSites() {
	
	siteNotification = showLongNotification('ca-world-pin', 'Migrating Existing Sites...', 'bottom', 'center', 'info');
	siteCounter = 0;
	sitesPromise = new $.Deferred();
	migrateSiteDetails(0);
	return sitesPromise.promise();
}

function migrateSiteDetails(offset) {
	// Get the current bunch of sites
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites?calculate_total=true&limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		siteTotal = response.total;
		// Migrate each site to the destination
		$.each(response.sites, function() {
			var currentSite = this['site_name'];
			var settings = {
				url: api_url + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('destination_base_url') + '/central/v2/sites',
					access_token: localStorage.getItem('destination_access_token'),
					data: JSON.stringify({
						site_name: this['site_name'],
						site_address: {
							address: this['address'],
							city: this['city'],
							state: this['state'],
							country: this['country'],
							zipcode: this['zipcode'],
						},
					}),
				}),
			};

			return $.ajax(settings).done(function(response) {
				//console.log(response)
				siteCounter++;
				if (response.hasOwnProperty('error_code')) {
					errorCounter++;
					if (response.description === 'SITE_ERR_DUPLICATE_SITE_NAME') {
						logError('Site with name "' + currentSite + '" already exists');
					} else {
						logError(response.description);
					}
				} else if (response.hasOwnProperty('site_name')) {
					console.log(currentSite + ' added successfully');
				}
				if (siteCounter == siteTotal) {
					if (errorCounter != 0) {
						showLog();
						if (siteNotification) {
							siteNotification.update({ type: 'warning', message: 'Some Sites failed to migrate to the Destination Central' });
							setTimeout(siteNotification.close, 1000);
						}
					} else if (siteCounter == siteTotal) {
						if (siteNotification) {
							siteNotification.update({ type: 'success', message: siteTotal + ' Sites were migrated to the Destination Central' });
							setTimeout(siteNotification.close, 1000);
						}
					}
				}
			});
		});

		if (offset + apiSiteLimit <= siteTotal) {
			migrateSiteDetails(offset + apiSiteLimit);
		} else {
			sitesPromise.resolve();
		}
	});
}

function assignDevicesToSites() {
	siteNotification = showLongNotification('ca-world-pin', 'Assigning Devices to Sites...', 'bottom', 'center', 'info');

	// get destination sites (need site_id for each site)
	destinationSitesPromise = new $.Deferred();
	destinationSites = [];
	$.when(getDestinationSites(0)).then(function() {
		// loop through the sites in the destination account to get the site_id for the site with the matching site_name
		// create two lists per site - one for APs and one for switches (due to API call needing a device_type per call)
		$.each(destinationSites, function() {
			var currentSite = this;
			var siteAPs = [];
			var siteSwitches = [];
			$.each(apsToMigrate, function() {
				if (this['site'] === currentSite.site_name) {
					siteAPs.push(this.serial);
				}
			});
			$.each(switchesToMigrate, function() {
				if (this['site'] === currentSite.site_name) {
					siteSwitches.push(this.serial);
				}
			});
			if (siteAPs.length > 0) moveDevicesToSite(siteAPs, currentSite, 'IAP');
			if (siteSwitches.length > 0) moveDevicesToSite(siteSwitches, currentSite, 'SWITCH');
		});
	});
}

function getDestinationSites(offset) {
	// Get full list of sites from the Destination account
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('destination_base_url') + '/central/v2/sites?calculate_total=true&limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: localStorage.getItem('destination_access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		destinationSites = destinationSites.concat(response.sites);
		if (response.total == 0) {
			// No sites have been migrated / created on the destination
			Swal.fire({
				title: 'Missing Sites',
				text: 'There are no Sites in the destination account. You need to migrate them over.',
				icon: 'warning',
			});
			if (siteNotification) {
				setTimeout(siteNotification.close, 1000);
			}
		}
		if (offset + apiSiteLimit <= response.total) {
			getDestinationSites(offset + apiSiteLimit);
		} else {
			destinationSitesPromise.resolve();
		}
	});
	return destinationSitesPromise.promise();
}

function moveDevicesToSite(devices, site, type) {
	/*  
		assigning the devices to a site on the destination account
	*/
	var data = {};
	data['site_id'] = site.site_id;
	data['device_type'] = type;
	data['device_ids'] = devices;

	var settings = {
		url: api_url + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('destination_base_url') + '/central/v2/sites/associations',
			access_token: localStorage.getItem('destination_access_token'),
			data: JSON.stringify(data),
		}),
	};

	return $.ajax(settings).done(function(response) {
		console.log('Devices Moved to Site ' + site.site_name + ': ' + JSON.stringify(response));
		if (response.failed & (response.failed.length > 0)) {
			$.each(response.failed, function() {
				if (this.reason === 'SITE_ERR_MAX_NO_ALREADY_ASSIGNED') logError("Device with serial number: '" + this.device_id + "' was not assigned to site " + site.site_name + ' (Reason: Already assigned to a Site)');
				else logError("Device with serial number: '" + this.device_id + "' was not assigned to site " + site.site_name);
			});
			showLog();
		} else {
			if (type === 'IAP') siteNotification.update({ type: 'success', message:  devices.length + " APs assigned to Site '" + site.site_name + "' successfully" });
			if (type === 'SWITCH') siteNotification.update({ type: 'success', message:  devices.length + " Switches assigned to Site '" + site.site_name + "' successfully" });
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Labels functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateLabels() {
	labelNotification = showLongNotification('ca-tag-cut', 'Migrating Existing Labels...', 'bottom', 'center', 'info');
	labelCounter = 0;
	migrateLabelDetails(0);
}

function migrateLabelDetails(offset) {
	// Get the current bunch of labels
	var settings = {
		url: api_url + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v1/labels?calculate_total=true&limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log("Migrating Labels: "+JSON.stringify(response));
		labelTotal = response.total;
		// Migrate each site to the destination
		$.each(response.labels, function() {
			var currentLabel = this['label_name'];
			// category_id 2 is created when a site is created - so no need to manually create them
			if (this['category_id'] == 1) {
				var settings = {
					url: api_url + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('destination_base_url') + '/central/v1/labels',
						access_token: localStorage.getItem('destination_access_token'),
						data: JSON.stringify({ category_id: 1, label_name: currentLabel }),
					}),
				};

				return $.ajax(settings).done(function(response) {
					//console.log(response)
					labelCounter++;
					if (response.hasOwnProperty('error_code')) {
						errorCounter++;
						if (response.description === 'LABEL_ERR_DUPLICATE_LABEL_NAME') {
							logError('Label with name "' + currentLabel + '" already exists');
						} else {
							logError(response.description + ': ' + currentLabel);
						}
					} else if (response.hasOwnProperty('label_name')) {
						console.log(currentLabel + ' added successfully');
					}
					if (errorCounter != 0) {
						showLog();
						if (labelNotification) {
							labelNotification.update({ type: 'warning', message: 'Some Labels failed to migrate to the Destination Central' });
							setTimeout(labelNotification.close, 1000);
						}
					} else if (labelCounter == labelTotal) {
						if (labelNotification) {
							labelNotification.update({ type: 'warning', message: 'Labels were migrated to the Destination Central' });
							setTimeout(labelNotification.close, 1000);
						}
					}
				});
			} else {
				labelCounter++;
			}
		});

		if (offset + apiSiteLimit <= labelTotal) {
			getLabelDetails(offset + apiSiteLimit);
		}
	});
}
