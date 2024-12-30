/*
Central Automation v1.7
Updated: 1.39
© Aaron Scott (WiFi Downunder) 2023-2024
*/

var selectedClusters = {};
var selectedDevices = {};
var clusterInfo = {};
var deviceInfo = {};
var aaaInfo = {};
var apBSSIDs = {};
var neighbourCache = {};
var radioClients = {};

var currentAP;
var selectedAP;
var currentAPSerial;
var neighbourTableData = [];
var dirtyConfig;

var bssidNotification;
var troubleshootingNotification;
var rfNotification;
var systemNotification;
var aaaNotification;
var neighboursNotification;
var datapathNotification;
var apNotification;
var cliNotification;
var visualRFNotification;

var ipToUsername = {};
var ipToPAN = {};
var sessionPairs = {};
var includePAN = false;

var vrfAccountID;
var floorplanImgs = {};

var cliCommands;

var snr0 = [];
var snr10 = [];
var snr20 = [];
var snr30 = [];
var snr40 = [];
var snr50 = [];
var snr60 = [];
var snrLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60+'];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findAPForRadio(radiomac) {
	// Check APs for radio mac
	var foundDevice = null;
	var aps = getAPs();
	$.each(aps, function() {
		for (var i = 0, len = this.radios.length; i < len; i++) {
			if (this.radios[i]['macaddr'] === radiomac) {
				foundDevice = this;
				return false; // break  out of the for loop
			}
		}
	});

	return foundDevice;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAP() {
	apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';
	
	getDevices();
	refreshBSSIDs();
	getAppRFMappings();
	getCLICommands();
	getCampus(false);
	$('[data-toggle="tooltip"]').tooltip();
}

function loadCurrentPageClient() {
	processClients();
	generateIPtoUsernameMapping();
}

function getDevices() {
	selectedClusters = {};

	var fullAPList = getAPs();
	clusterInfo = {};
	$.each(fullAPList, function() {
		// Add the device for the APs list
		deviceInfo[this['serial']] = this;
	});

	loadDevicesTable(false);
}

function processClients() {
	snr0 = [];
	snr10 = [];
	snr20 = [];
	snr30 = [];
	snr40 = [];
	snr50 = [];
	snr60 = [];
	
	var allWirelessClients = getWirelessClients();
	radioClients = {};
	$.each(allWirelessClients, function() {
		var selectedRadioMac = radioClients[this.radio_mac];
		if (!selectedRadioMac) selectedRadioMac = [];
		selectedRadioMac.push(this);
		radioClients[this.radio_mac] = selectedRadioMac;
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedDevices(serial) {
	var rowSelected = document.getElementById(serial).checked;
	if (!rowSelected) document.getElementById('device-select-all').checked = false;

	if (selectedDevices[serial] && !rowSelected) delete selectedDevices[serial];
	else selectedDevices[serial] = serial;
}

function selectAllDevices() {
	var checkBoxChecked = false;
	if (Object.keys(selectedDevices).length < Object.keys(deviceInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(deviceInfo)) {
			if (!selectedDevices[key]) selectedDevices[key] = key;
		}
	} else {
		selectedDevices = {};
	}

	loadDevicesTable(checkBoxChecked);
}

function loadDevicesTable(checked) {
	$('#device-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#device-table').DataTable();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;
		
		// Build Status dot
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}

		// Build Uptime String
		var uptimeString = '-';
		if (device['uptime'] > 0) {
			var uptime = moment.duration(device['uptime'] * 1000);
			uptimeString = uptime.humanize();
		}

		// Build troubleshooting links
		var tshootBtns = '';
		if (device['status'] == 'Up') {
			tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="AP Details" onclick="getAPDetails(\'' +  device['serial'] + '\')"><i class="fa-solid fa-circle-info"></i></a> ';
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot AP" onclick="rebootAP(\'' +  device['serial'] + '\')"><i class="fa-solid fa-power-off"></i></a> ';
		}

		// Add AP to table		
		table.row.add(['<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['group_name'], device['site'], device['client_count'], device['firmware_version'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, tshootBtns]);
	}
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

function rebootAP(currentSerial) {
	if (!currentSerial) currentSerial = currentAPSerial;
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/device_management/v1/device/' + currentSerial + '/action/reboot',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log('Device Reboot response: ' + JSON.stringify(response));
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/device_management/v1/device/<SERIAL>/action/reboot)');
				return;
			}
		}
		if (response['state'] && response['state'].toLowerCase() === 'success') {
			logInformation('Successful reboot of ' + response['serial']);
			showNotification('ca-connection', 'Rebooting of AP (' + response['serial'] + ') was successful', 'bottom', 'center', 'success');
		} else {
			if (response['description']) logError(response['description']);
		}
	});
}

/*  ----------------------------------
	AP Troubleshooting functions
---------------------------------- */
function getCLICommands() {
	cliNotification = showLongNotification('ca-window-code', 'Getting available CLI commands...', 'bottom', 'center', 'info');
		
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/commands?device_type=IAP',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/commands?device_type=IAP)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		cliCommands = response.commands;
		cliCommands.sort((a, b) => {
			const apA = a.command.toUpperCase(); // ignore upper and lowercase
			const apB = b.command.toUpperCase(); // ignore upper and lowercase
			// Sort on Group name
			if (apA < apB) {
				return -1;
			}
			if (apA > apB) {
				return 1;
			}
			return 0;
		});
		
		if (document.getElementById('cliselector')) {
			// remove old groups from the selector
			select = document.getElementById('cliselector');
			select.options.length = 0;
			
			
			$.each(cliCommands, function() {
				if (!this.arguments && !this['command'].includes('show ap')) $('#cliselector').append($('<option>', { value: this['command_id'], text: this['command'] }));
			});
			
			if ($('#cliselector').length != 0) {
				$('#cliselector').selectpicker('refresh');
			}
		}
		if (cliNotification) {
			cliNotification.update({ message: 'Obtained CLI commands', type: 'success' });
			setTimeout(cliNotification.close, 1000);
		}
	});
}

function getAPDetails(currentAP) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/aps/' + currentAP,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/aps/<serial>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		showAPDetails(currentAP, response);
		if (response.swarm_id === '') getDirtyDiff(currentAP);
		else getDirtyDiff(response.swarm_id);
	});
}

function getDirtyDiff(currentAP) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/dirty_diff/' + currentAP+ '?limit=20',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (configuration/v1/dirty_diff/<serial>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.count > 0) {
			dirtyConfig =  response.dirty_diff_list[0]['dirty_diff'].split('--------------------------------------------')[0];
			$('#wirelessInfo').append('<li>Config: <button class="btn btn-round btn-sm btn-outline btn-warning" onclick="displayDirtyConfig()" id="dirtyBtn">Unsynchronized</button></li>');
		} else {
			dirtyConfig =  '';
			$('#wirelessInfo').append('<li>Config: <strong>Synchronized</strong></li>');
		}
	});
}

function showAPDetails(currentAP, apData) {
	//hideTroubleshooting();
	currentAPSerial = currentAP;
	selectedAP = findDeviceInMonitoring(currentAP);
	var extraData = apData;
	//console.log(selectedAP)
	
	// Build Status dot
	var memoryUsage = (((selectedAP['mem_total'] - selectedAP['mem_free']) / selectedAP['mem_total']) * 100).toFixed(0).toString();
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	if (selectedAP['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + selectedAP['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	} else if ('sleep_status' in selectedAP && selectedAP['sleep_status'] == true) {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="AP is in Power Save"><i class="fa-solid fa-circle text-purple"></i></span>';
	}
	
	client_name_url = encodeURI(selectedAP['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + selectedAP['serial'] + '?casn=' + selectedAP['serial'] + '&cdcn=' + name + '&nc=access_point';
	var nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + selectedAP['name'] + '</strong></a>'
	
	$('#wirelessInfo').empty();
	$('#wirelessInfo').append('<li>Name: ' + nameValue + '</li>');
	
	
	var uptimeString = '-';
	if (selectedAP['uptime'] > 0) {
		var uptime = moment.duration(selectedAP['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	// Site Link to Central
	var siteName = encodeURI(selectedAP['site']);
	var siteId = getIDforSite(selectedAP['site'])
	var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
	var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + selectedAP['site'] + '</strong></a>';
	
	// Group Link to Central
	var groupName = encodeURI(selectedAP['group_name']);
	var groupId = selectedAP['group_id'];
	var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
	var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + selectedAP['group_name'] + '</strong></a>';
	
	
	/*console.log(currentClient)
	console.log(connectedAP)
	console.log(connectedRadio)
	*/
	
	$('#wirelessInfo').append('<li>Health: '+status+'</li>');
	$('#wirelessInfo').append('<li>Serial Number: <strong>' + selectedAP['serial'] + '</strong></li>');
	$('#wirelessInfo').append('<li>MAC Address: <strong>' + selectedAP['macaddr'] + '</strong></li>');
	$('#wirelessInfo').append('<li>IP Address: <strong>' + selectedAP['ip_address'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Model: <strong>' + selectedAP['model'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Firmware: <strong>' + selectedAP['firmware_version'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	if (selectedAP['mesh_role'] !== 'Unknown') $('#wirelessInfo').append('<li>Mesh Role: <strong>' + selectedAP['mesh_role'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
	if (selectedAP['site']) $('#wirelessInfo').append('<li>Site: ' + centralURLSiteLink + '</li>');
	
	
	
	$('#wirelessRadio1').empty();
	$('#wirelessRadio2').empty();
	$('#wirelessRadio3').empty();
	var radioColumn = 1;
	var selectedCol = '';
	$.each(selectedAP['radios'], function() {
		// get matching radio from extraData
		var radioData = this;
		var extraRadioData;
		$.each(extraData['radios'], function() {
			if (radioData.macaddr === this.macaddr) {
				extraRadioData = this;
				return false;
			}
		})
		var statusString = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this['status'] == 'Up') {
			statusString = '<i class="fa-solid fa-circle text-success"></i>';
		}
		var band = '5GHz';
		if (this.band == 0) band = '2.4GHz';
		else if (this.band == 3) band = '6GHz';
		selectedCol = '#wirelessRadio'+radioColumn;
		$(selectedCol).append('<li><button class="btn btn-round btn-sm btn-outline btn-warning" onclick="displayRadioStats('+this.index+')" id="radioBtn'+this.index+'">Radio Stats</button></li>');
		$(selectedCol).append('<li>Radio: <strong>' + this.index + '</strong></li>');
		$(selectedCol).append('<li>Name: <strong>' + this.radio_name + '</strong></li>');
		$(selectedCol).append('<li>Status: <strong>'+statusString+'</strong></li>');
		if (extraRadioData) $(selectedCol).append('<li>Mode: <strong>'+extraRadioData.role+'</strong></li>');
		$(selectedCol).append('<li>Band: <strong>' + band + '</strong></li>');
		if (extraRadioData && this['status'] == 'Up')$(selectedCol).append('<li>Channel: <strong>' + extraRadioData.channel + '</strong></li>');
		if (extraRadioData && this['status'] == 'Up')$(selectedCol).append('<li>Tx Power: <strong>' + extraRadioData.tx_power + 'dB</strong></li>');
		if (extraRadioData && this['status'] == 'Up')$(selectedCol).append('<li>Utilization: <strong>' + extraRadioData.utilization + '%</strong></li>');
		if (extraRadioData && this['status'] == 'Up')$(selectedCol).append('<li>Noise Floor: <strong>-' + extraRadioData.noise_floor + 'dBm</strong></li>');
		$(selectedCol).append('<li>&nbsp;</li>');
		radioColumn++;
	});
	
	$('#wiredConnection1').empty();
	$('#wiredConnection2').empty();
	var wiredColumn = 1;
	var selectedCol = '';
	$.each(extraData['ethernets'], function() {
		
		var interfaceStatusString = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this['status'] == 'Up') {
			interfaceStatusString = '<i class="fa-solid fa-circle text-success"></i>';
		}
		var adminStatusString = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this['admin_state'] == 'Up') {
			adminStatusString = '<i class="fa-solid fa-circle text-success"></i>';
		}
		var operStatusString = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this['operational_state'] == 'Up') {
			operStatusString = '<i class="fa-solid fa-circle text-success"></i>';
		}
		selectedCol = '#wiredConnection'+wiredColumn;
		$(selectedCol).append('<li>Name: <strong>' + this.name + '</strong></li>');
		$(selectedCol).append('<li>Status: <strong>'+interfaceStatusString+'</strong></li>');
		$(selectedCol).append('<li>Operational State: <strong>'+operStatusString+'</strong></li>');
		$(selectedCol).append('<li>Admin State: <strong>'+adminStatusString+'</strong></li>');
		$(selectedCol).append('<li>Link Speed: <strong>' + this.link_speed + '</strong></li>');
		$(selectedCol).append('<li>Duplex Mode: <strong>' + this.duplex_mode + '</strong></li>');
		$(selectedCol).append('<li>MAC Address: <strong>' + this.macaddr + '</strong></li>');
		$(selectedCol).append('<li>&nbsp;</li>');
		wiredColumn++;
	});
	
	$('#wirelessConnection').empty();
	$('#wirelessConnection').append('<li>SSIDs: <strong>'+extraData['ssid_count']+'</li>');
	$('#wirelessConnection').append('<li>Clients: <strong>'+selectedAP['client_count']+'</li>');
	
	if (selectedAP['gateway_cluster_name'] !== '') {
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
		var centralURL = centralBaseURL + '/frontend/#/GATEWAYCLUSTERDETAIL/OVERVIEW/' + selectedAP['gateway_cluster_id'] + '/' + selectedAP['gateway_cluster_name'] + '?csgc=%5Bobject%20Object%5D&cdcn=' + selectedAP['gateway_cluster_name'] + '&nc=gatewaycluster';
		var nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + selectedAP['gateway_cluster_name'] + '</strong></a>'
		
		//https://internal-ui.central.arubanetworks.com/frontend/#/GATEWAYCLUSTERDETAIL/OVERVIEW/2291/auto_group_403?csgc=%5Bobject%20Object%5D&cdcn=auto_group_403&nc=gatewaycluster
		$('#wirelessConnection').append('<li>Gateway Cluster: <strong>'+nameValue+'</li>');
	}
		
	if (document.getElementById('syncedAPFloorplanCard')) document.getElementById('syncedAPFloorplanCard').hidden = true;
	if (document.getElementById('syncedAPCard')) document.getElementById('syncedAPCard').hidden = true;

	hideTroubleshooting();
	resetCanvases();
	$('#APModalLink').trigger('click');
	
	needAllLabels = false;
	needClientLabel = false;
	locateAP(currentAPSerial);
	
	if (document.getElementById('rfBtn')) {
		if (selectedAP['firmware_version'].startsWith('10.')) {
			document.getElementById('rfBtn').hidden = false;
			getRFNeighbourClients();
		} else {
			document.getElementById('rfBtn').hidden = true;
		}
	}
	$('[data-toggle="tooltip"]').tooltip();
}

function locateAP(apSerial) {
	resetCanvases();
	visualRFNotification = showLongNotification('ca-map-pin', 'Getting AP Location...', 'bottom', 'center', 'info');
	// get buildingID for AP site
	vrfAccountID = '';
	$.each(vrfBuildings, function() {
		if (this.building_name === selectedAP.site) {
			vrfAccountID = this.building_id.split('__')[0];
		}
	});
	
	vrfAPs = [];
	
	if (vrfAccountID !== '') {
		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/visualrf_api/v1/access_point_location/' + vrfAccountID+'__'+cleanMACAddress(selectedAP.macaddr),
				access_token: localStorage.getItem('access_token'),
			}),
		};
		
		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/access_point_location/<ap_id>)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);
			if (response['access_point']) {
				vrfAPs.push(response.access_point);
				if (response['access_point']['floor_id'] != vrfFloorId) getFloor(response['access_point']['floor_id']);
				else {
					drawFloorplan();
				}
			
				if (visualRFNotification) {
					visualRFNotification.update({ message: 'Located AP', type: 'success' });
				}
			} else {
				if (visualRFNotification) {
					visualRFNotification.update({ message: 'AP was not able to be located', type: 'warning' });
					setTimeout(visualRFNotification.close, 3000);
				}
			}
		});
	} else {
		if (visualRFNotification) {
			visualRFNotification.update({ message: 'AP was not able to be located', type: 'warning' });
			setTimeout(visualRFNotification.close, 3000);
		}
	}
}

function getFloor(floorId) {
	resetCanvases();
	vrfFloors = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + floorId + '?limit=' + apiVRFLimit + '&units=' + vrfUnits,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getFloor(floorId);
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			vrfFloors.push(response['floor']);
			currentFloor = response['floor'];
			if ($('#wirelessInfo')) $('#wirelessInfo').append('<li>Floor: <strong>' + currentFloor['floor_name'] + '</strong></li>');
			getFloorData(floorId);
		}
	});
}

function getFloorData(floorId) {
	if (floorId === vrfFloorId) {
		drawAPsOnFloorplan();
	} else {
		vrfFloorId = floorId;
		if (floorplanImgs[vrfFloorId]) {
			vrfFloorplan = floorplanImgs[vrfFloorId];
			drawFloorplan();
		} else {
			//get Floorplan
			if (visualRFNotification) visualRFNotification.update({ message: 'Downloading floorplan...', type: 'info' });
			else visualRFNotification = showNotification('ca-floors', 'Getting Floor information...', 'bottom', 'center', 'info');
			var settings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + vrfFloorId + '/image?limit=100',
					access_token: localStorage.getItem('access_token'),
				}),
			};
		
			$.ajax(settings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>/image)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);
				vrfFloorplan = response;
				floorplanImgs[vrfFloorId] = response;
				if (!vrfFloorplan || vrfFloorplan === '') {
					visualRFNotification.update({ message: 'Attempting to obtain floorplan...', type: 'warning' });
				} else {
					if (visualRFNotification) {
						visualRFNotification.update({ message: 'Retrieved Floorplan', type: 'success' });
					}
					drawFloorplan();
				}
			});
		}
	}
}

function drawAPsOnFloorplan() {
	// Clear APs from view
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();

	// Draw APs on floorplan
	vrfAPLocations = [];
	var floorplanCanvas = document.getElementById('ap-floorplanCanvas');
	var canvas = document.getElementById('ap-apCanvas');
	var ctx = canvas.getContext('2d');
	ctx.willReadFrequently = true;

	$.each(vrfAPs, function() {
		var thisAP = findDeviceInMonitoring(this['serial_number']);
		
		x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
		y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
		
		// default AP colour
		ctx.fillStyle = '#23CCEF';

		ctx.beginPath();
		ctx.shadowColor = 'white';
		ctx.shadowBlur = 14;
		ctx.roundRect(x - 8, y - 8, 16, 16, 1);
		ctx.fill();
		
		ctx.drawImage(apImage, x - 10, y - 10, 20, 20);
	});
	if (visualRFNotification) {
		visualRFNotification.update({ message: 'AP location displayed on floorplan', type: 'success' });
		setTimeout(visualRFNotification.close, 1000);
	}
}

function drawFloorplan() {
	// Draw floorplan
	resetCanvases();
	drawFloorplanImage(false);
	// need to delay AP placement until floorplan is drawn
	setTimeout(drawAPsOnFloorplan, 500);
}



/*  ----------------------------------
	Wireless Troubleshooting functions
---------------------------------- */
function hideTroubleshooting() {
	$(document.getElementById('systemBtn')).removeClass('btn-fill');
	$(document.getElementById('systemBtn')).addClass('btn-outline');
	document.getElementById('systemCard').hidden = true;
	
	$(document.getElementById('rfBtn')).removeClass('btn-fill');
	$(document.getElementById('rfBtn')).addClass('btn-outline');
	document.getElementById('rfCard').hidden = true;
	
	$(document.getElementById('aaaBtn')).removeClass('btn-fill');
	$(document.getElementById('aaaBtn')).addClass('btn-outline');
	document.getElementById('aaaCard').hidden = true;
	
	$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
	$(document.getElementById('neighboursBtn')).addClass('btn-outline');
	document.getElementById('neighboursCard').hidden = true;
	
	$(document.getElementById('datapathBtn')).removeClass('btn-fill');
	$(document.getElementById('datapathBtn')).addClass('btn-outline');
	document.getElementById('datapathCard').hidden = true;
	
	$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
	$(document.getElementById('dirtyBtn')).addClass('btn-outline');
	document.getElementById('dirtyCard').hidden = true;
	
	$(document.getElementById('commandsBtn')).removeClass('btn-fill');
	$(document.getElementById('commandsBtn')).addClass('btn-outline');
	document.getElementById('commandsCard').hidden = true;
	
	// Hide other tabs
	var radioBtns = $('button[id^="radioBtn"]')
	$.each(radioBtns, function() {
		$(document.getElementById(this.id)).removeClass('btn-fill');
		$(document.getElementById(this.id)).addClass('btn-outline');
	});
	document.getElementById('radioCard').hidden = true;

	// Clear old table data
	/*$('#events-table').DataTable().rows().remove();
	$('#events-table').DataTable().rows().draw();
	$('#mobility-table').DataTable().rows().remove();
	$('#mobility-table').DataTable().rows().draw();
	$('#synced-ap-table').DataTable().rows().remove();
	$('#synced-ap-table').DataTable().rows().draw();*/
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Dirty Config Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayDirtyConfig() {
	// Control the UI pieces
	if ($(document.getElementById('dirtyBtn')).hasClass('btn-outline' )) {
		// Not selected
		document.getElementById('configText').value = dirtyConfig;
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-outline');
		$(document.getElementById('dirtyBtn')).addClass('btn-fill');
		document.getElementById('dirtyCard').hidden = false;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	RF View Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayRFView() {
	// Control the UI pieces
	if ($(document.getElementById('rfBtn')).hasClass('btn-outline' )) {
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-outline');
		$(document.getElementById('rfBtn')).addClass('btn-fill');
		document.getElementById('rfCard').hidden = false;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
	}
	
	getRFNeighbourClients();
}

function getRFNeighbourClients() {
	var band = document.getElementById('bandselector').value;

	var radioMac;
	// Find the first radio in a band that is up and use that for finding RF Neighbours from AirMatch
	$.each(selectedAP['radios'], function() {
		if (this.radio_name.includes('2.4') && band == '2.4' && this.status === "Up") radioMac = this.macaddr;
		else if (this.radio_name.includes('5') && band == '5' && this.status === "Up") radioMac = this.macaddr;
		else if (this.radio_name.includes('6') && band == '6' && this.status === "Up") radioMac = this.macaddr;
	});
	var neighbourCacheString = radioMac+'-'+band;
	
	// Try and use cached RF Neighbour data for repeat viewing
	if (radioMac && neighbourCache[neighbourCacheString]) {
		processNeighbourClients(neighbourCache[neighbourCacheString], radioMac, band);
	} else {
		neighboursNotification = showLongNotification('ca-duplicate', 'Getting RF Neighbours...', 'bottom', 'center', 'info');
			
		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/airmatch/telemetry/v1/nbr_pathloss_radio/' + radioMac + '/' + band+'ghz',
				access_token: localStorage.getItem('access_token'),
			}),
		};
	
		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/airmatch/telemetry/v1/nbr_pathloss_radio/)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);
			// Add to neighbour cache for repeat viewing
			neighbourCache[neighbourCacheString] = response;
			
			if (neighboursNotification) {
				neighboursNotification.update({ message: 'Neighbours retrieved', type: 'success' });
				setTimeout(neighboursNotification.close, 1000);
			}
			
			processNeighbourClients(neighbourCache[neighbourCacheString], radioMac, band);
		});
	}
}

function processNeighbourClients(apRFNeighbours, radioMac, band) {
	// Sort the RF Neighbours based on pathloss
	apRFNeighbours.sort((a, b) => {
		return a.pathloss - b.pathloss;
	});
	
	// Trim the number of Neighbours to top 4 that are managed APs (is_friend =  true)
	var topNeighbours = [];
	for (var i=0; i<apRFNeighbours.length; i++) {
		if (apRFNeighbours[i].is_friend) topNeighbours.push(apRFNeighbours[i])
		if (topNeighbours.length == 4) break;
	}
	
	var neighbourSeries1 = [];
	var neighbourSeries2 = [];
	var neighbourLabels = [];
	
	// add the source AP for comparison
	neighbourLabels.push(selectedAP.name);
	var clientCount = 0;
	if (radioClients[radioMac]) clientCount = radioClients[radioMac].length
	neighbourSeries2.push({meta: selectedAP.name, value: clientCount});
	neighbourSeries1.push(0);
	
	// add the other AP's radios in the same band
	$.each(topNeighbours, function() {
		var foundAP = findAPForRadio(this.nbr_mac);
		neighbourLabels.push(foundAP.name);
		var neighbourMac;
		$.each(foundAP['radios'], function() {
			if (this.radio_name.includes('2.4') && band == '2.4' && this.status === "Up") neighbourMac = this.macaddr;
			else if (this.radio_name.includes('5') && band == '5' && this.status === "Up") neighbourMac = this.macaddr;
			else if (this.radio_name.includes('6') && band == '6' && this.status === "Up") neighbourMac = this.macaddr;
		});
		clientCount = 0;
		if (neighbourMac && radioClients[neighbourMac]) clientCount = radioClients[neighbourMac].length;
		neighbourSeries1.push({meta: foundAP.name, value: clientCount});
		neighbourSeries2.push(0);
	});
	
	Chartist.Bar(
		'#chartNeighbours',
		{
			labels: neighbourLabels,
			series: [neighbourSeries1, neighbourSeries2],
		},
		{
			//distributeSeries: true,
			height: 250,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 50,
			},
			plugins: [Chartist.plugins.tooltip()],
		}
	);
	
	// Build the SNR data for graph
	snr0 = [];
	snr10 = [];
	snr20 = [];
	snr30 = [];
	snr40 = [];
	snr50 = [];
	snr60 = [];
	if (radioClients[radioMac]) {
		$.each(radioClients[radioMac], function() {
			if (this.snr >= 0 && this.snr < 10) snr0.push(this);
			else if (this.snr >= 10 && this.snr < 20) snr10.push(this);
			else if (this.snr >= 20 && this.snr < 30) snr20.push(this);
			else if (this.snr >= 30 && this.snr < 40) snr30.push(this);
			else if (this.snr >= 40 && this.snr < 50) snr40.push(this);
			else if (this.snr >= 50 && this.snr < 60) snr50.push(this);
			else if (this.snr >= 60) snr60.push(this);
		});
	}

	
	// Build series
	var snrSeries = [{ meta: '0-9', value: snr0.length}, { meta: '10-19', value: snr10.length}, { meta: '20-29', value: snr20.length}, { meta: '30-39', value: snr30.length}, { meta: '40-49', value: snr40.length}, { meta: '50-59', value: snr50.length}, { meta: '60+', value: snr60.length}];
	
	Chartist.Bar(
		'#chartSNR',
		{
			labels: snrLabels,
			series: [snrSeries],
		},
		{
			//distributeSeries: true,
			height: 250,
			axisX: {
				showGrid: false,
				labelInterpolationFnc: function(value) {
				  return value + 'dB'
				},
			},
			axisY: {
				onlyInteger: true,
				offset: 50,
			},
			plugins: [Chartist.plugins.tooltip()],
		}
	);
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Radio-stats Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayRadioStats(radioId) {
	
	// Control the UI pieces
	if ($(document.getElementById('radioBtn'+radioId)).hasClass('btn-outline' )) {
		// Not selected
		debugRadioStats(selectedAP.serial, radioId);
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		// Hide other tabs
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			if (this.id === 'radioBtn'+radioId) {
				console.log('found')
				$(document.getElementById(this.id)).removeClass('btn-outline');
				$(document.getElementById(this.id)).addClass('btn-fill');
			} else {
				$(document.getElementById(this.id)).removeClass('btn-fill');
				$(document.getElementById(this.id)).addClass('btn-outline');
			}
		});
		document.getElementById('radioCard').hidden = false;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
	} else {
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
	}
}

function debugRadioStats(deviceSerial, radioBand) {
	rfNotification = showLongNotification('ca-antenna', 'Getting Radio information...', 'bottom', 'center', 'info');
	var data = '';
	if (radioBand == 0) data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 105 }] });
	else if (radioBand == 1) data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 107 }] });
	else if (radioBand == 2) data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 371 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};
	
	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDebugRadioResult, 5000, response.session_id, response.serial, radioBand);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkDebugRadioResult(session_id, deviceSerial, radioBand) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkDebugRadioResult, 10000, session_id, response.serial, radioBand);
			} else if (response.status === 'COMPLETED') {
				var results = decodeURI(response.output);
				
				// convert to JSON structure
				var startString = '-------------------              General';
				var startLocation = results.indexOf(startString) + startString.length;
				var block = results.substring(startLocation);
				var lines = block.split('\n');
				var output = {};
				$.each(lines, function() {
					var name = this.substring(0, 32).trim();
					var result = parseInt(this.substring(32).trim());
					if (!name.includes('---------') && !name.includes('===') && name !== '' && !name.includes('Parameter') && !name.includes('ANUL RADIO Stats')) output[name] = result;
				});
				//console.log(output);
				var deviceDetails = findDeviceInMonitoring(response.serial);
				var bandString = '';
				
				if (radioBand == 0) bandString = '5GHz';
				else if (radioBand == 1) bandString = '2.4GHz';
				else bandString = '6GHz';
				// Populate the RadioStats Modal
				document.getElementById('radioStatsTitle').innerHTML = '<strong>' + bandString + '</strong> Radio Stats for <strong>' + deviceDetails.name + '</strong>';

				// General Column
				$('#generalRFIssues').empty();
				$('#generalRFIssues').append('<li>Total Radio Resets: <strong>' + output['Total Radio Resets'] + '</strong></li>');
				$('#generalRFIssues').append('<li>Power Changes: <strong>' + output['TX Power Changes'] + '</strong></li>');
				$('#generalRFIssues').append('<li>Channel Changes: <strong>' + output['Channel Changes'] + '</strong></li>');
				$('#generalRFIssues').append('<li>&nbsp;</li>');
				$('#generalRFIssues').append('<li>EIRP: <strong>' + output['EIRP'] + 'dBm</strong></li>');
				$('#generalRFIssues').append('<li>Noise Floor: <strong>-' + output['Current Noise Floor'] + 'dBm</strong></li>');

				// Tx Column
				$('#txIssues').empty();
				$('#txIssues').append('<li>Channel Busy 1s: <strong>' + output['Channel Busy 1s'] + '</strong></li>');
				$('#txIssues').append('<li>Channel Busy 4s: <strong>' + output['Channel Busy 4s'] + '</strong></li>');
				$('#txIssues').append('<li>Channel Busy 64s: <strong>' + output['Channel Busy 64s'] + '</strong></li>');
				$('#txIssues').append('<li>&nbsp;</li>');

				var txRetryDrop = 0;
				if (output['Tx Dropped After Retry']) txRetryDrop = output['Tx Dropped After Retry'];
				if (txRetryDrop > 0) $('#txIssues').append('<li>Dropped After Retry: <strong>' + txRetryDrop + '</strong></li>');

				var txNoBufferDrop = 0;
				if (output['Tx Dropped No Buffer']) txNoBufferDrop = output['Tx Dropped No Buffer'];
				if (txNoBufferDrop > 0) $('#txIssues').append('<li>Dropped No Buffer: <strong>' + txNoBufferDrop + '</strong></li>');

				var failedBeacons = 0;
				if (output['Tx Failed Beacons']) failedBeacons = output['Tx Failed Beacons'];
				if (failedBeacons > 0) $('#txIssues').append('<li>Failed Beacons: <strong>' + failedBeacons + '</strong></li>');

				var txTimeouts = 0;
				if (output['TX Timeouts']) txTimeouts = output['TX Timeouts'];
				if (txTimeouts > 0) $('#txIssues').append('<li>Dropped No Buffer: <strong>' + txTimeouts + '</strong></li>');

				var txCarrier = 0;
				if (output['Lost Carrier Events']) txCarrier = output['Lost Carrier Events'];
				if (txCarrier > 0) $('#txIssues').append('<li>Lost Carrier Events: <strong>' + txCarrier + '</strong></li>');

				// Rx Column
				$('#rxIssues').empty();
				var lprt = 0;
				if (output['Probe Request Rejects']) lprt = output['Probe Request Rejects'];
				if (lprt > 0) $('#rxIssues').append('<li>Low Probe Threshold Rejects: <strong>' + lprt + '</strong></li>');

				var art = 0;
				if (output['Auth Request Rejects']) art = output['Auth Request Rejects'];
				if (art > 0) $('#rxIssues').append('<li>Auth Request Rejects: <strong>' + art + '</strong></li>');

				$('#rxIssues').append('<li>Radar Events: <strong>' + output['Rx RADAR Events'] + '</strong></li>');

				var assocRejects = 0;
				if (output['ANUL Assoc Rejects']) assocRejects = output['ANUL Assoc Rejects'];
				if (assocRejects > 0) $('#rxIssues').append('<li>Association Rejects: <strong>' + assocRejects + '</strong></li>');

				var authRejects = 0;
				if (output['ANUL Auth Rejects']) authRejects = output['ANUL Auth Rejects'];
				if (authRejects > 0) $('#rxIssues').append('<li>Authentication Rejects: <strong>' + authRejects + '</strong></li>');

				var maxStaLimit = output['ANUL Max STA Rejects'];
				if (maxStaLimit > 0) $('#rxIssues').append('<li>Max Station Threshold Rejects: <strong>' + maxStaLimit + '</strong></li>');

				document.getElementById('radioStatsText').innerHTML = results;
				$('#RadioStatsModalLink').trigger('click');
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
		
		if (rfNotification) {
			setTimeout(rfNotification.close, 1000);
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	System Status Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displaySystemStatus() {
	
	// Control the UI pieces
	if ($(document.getElementById('systemBtn')).hasClass('btn-outline' )) {
		// Not selected
		debugSystemStatus(currentAPSerial);
		
		$(document.getElementById('systemBtn')).removeClass('btn-outline');
		$(document.getElementById('systemBtn')).addClass('btn-fill');
		document.getElementById('systemCard').hidden = false;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
	}
}

function refreshSystemStatus() {
	debugSystemStatus(currentAPSerial);
}

function debugSystemStatus(deviceSerial) {
	systemNotification = showLongNotification('ca-ap-icon', 'Getting System Status information...', 'bottom', 'center', 'info');
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 113 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDebugSystemStatus, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkDebugSystemStatus(session_id, deviceSerial) {
	toolNotification = showLongNotification('ca-ap-icon', 'Getting System Status information...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkDebugSystemStatus, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				//console.log(response.output);
				//var results = decodeURI(response.output);
				var results = response.output;

				// Command Run Time
				var startString = 'Output Time: ';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var runTime = results.substring(startLocation, endLocation).trim();

				// Populate the SystemStatus Modal
				var deviceDetails = findDeviceInMonitoring(response.serial);
				document.getElementById('systemStatusTitle').innerHTML = 'System Status for ' + deviceDetails.name; // + ' (' + runTime + ')';

				$('#generalSystemIssues').empty();
				$('#powerIssues').empty();
				$('#hardwareIssues').empty();
				$('#interfaceIssues').empty();

				// Find AP Uptime
				var startString = 'AP Uptime\n---------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var uptime = results.substring(startLocation, endLocation).trim();
				$('#generalSystemIssues').append('<li>Uptime: <strong>' + uptime + '</strong></li>');

				// Find Reboot Reason "AP Reboot reason:  "
				var startString = 'Reboot Information\n------------------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var rebootReason = results.substring(startLocation, endLocation).trim();
				$('#generalSystemIssues').append('<li>Reboot Reason: <strong>' + rebootReason + '</strong></li>');

				// Check if crash log exists
				var startString = 'Crash Information\n-----------------';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('------------', startLocation);
				var crashReason = results.substring(startLocation, endLocation).trim();
				if (crashReason !== '(none found)') {
					if (crashReason == "Crash information is available; use 'show ap debug crash-info' to retrieve") {
						$('#generalSystemIssues').append('<li id="crashInfo">Crash Information: <button class="btn btn-round btn-sm btn-outline btn-warning" onclick="obtainCrashLog(\'' + response.serial + '\')">Download Crash Information</button></li>');
					} else {
						$('#generalSystemIssues').append('<li id="crashInfo">Crash Information: <strong>' + crashReason + '</strong></li>');
					}
				}

				// Power Information
				var startString = 'Power Status\n------------\nItem                        Value\n----                        -----\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n\n', startLocation);
				var powerInformationBlock = results.substring(startLocation, endLocation).trim();
				addPowerInfoForLabel(powerInformationBlock, 'Power Supply');
				addPowerInfoForLabel(powerInformationBlock, 'LLDP Power');
				addPowerInfoForLabel(powerInformationBlock, 'Current Operational State');

				if (results.indexOf('Power Monitoring Information') != -1) {
					var startString = 'Power Monitoring Information\n----------------------------\nCurrent(mW)  Average(mW)  Minimum(mW)  Maximum(mW)\n-----------  -----------  -----------  -----------\n';
					var startLocation = results.indexOf(startString) + startString.length;
					var endLocation = results.indexOf(' ', startLocation);
					//console.log(results.substring(startLocation, endLocation).trim());
					var currentDraw = parseInt(results.substring(startLocation, endLocation).trim()) / 1000;
					$('#powerIssues').append('<li>Current Power Draw: <strong>' + currentDraw.toFixed(2) + 'W</strong></li>');
				}

				// Hardware status
				var startString = 'Peak CPU Util in the last one hour\n----------------------------------\nTimestamp            CPU Util(%)  Memory Util(%)\n---------            -----------  --------------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var memoryLine = results.substring(startLocation, endLocation).trim();

				// CPU
				startString = '  ';
				var startLocation = memoryLine.indexOf(startString) + startString.length;
				var endLocation = memoryLine.indexOf('   ', startLocation);
				var lastCPUValue = memoryLine.substring(startLocation, endLocation).trim();
				$('#hardwareIssues').append('<li>CPU Usage: <strong>' + lastCPUValue + '%</strong></li>');
				// Memory
				startString = '   ';
				var startLocation = memoryLine.indexOf(startString) + startString.length;
				var lastMemoryValue = parseInt(memoryLine.substring(startLocation).trim());
				if (lastMemoryValue > 74) $('#hardwareIssues').append('<li>Memory Usage: <i class="fa-solid fa-circle text-warning"></i><strong> ' + lastMemoryValue + '%</strong></li>');
				else $('#hardwareIssues').append('<li>Memory Usage: <strong>' + lastMemoryValue + '%</strong></li>');

				// Ethernet status
				var startString = 'Ethernet Duplex/Speed Settings\n------------------------------\nAutoneg  Speed (Mbps)  Duplex  Iface\n-------  ------------  ------  -----\n';
				if (results.indexOf(startString) == -1) startString = 'Ethernet Duplex/Speed Settings\n------------------------------\nAutoneg  Speed (Mbps)  Duplex   Iface\n-------  ------------  ------   -----\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n\n', startLocation);
				var ethernetInterfaces = results.substring(startLocation, endLocation).trim();
				//console.log(ethernetInterfaces);
				var interfaces = ethernetInterfaces.split('\n');
				$.each(interfaces, function() {
					var intString = this.replace(/  +/g, ' ');
					var intParts = intString.split(' ');
					var intSpeed = intParts[1];
					var intDuplex = intParts[2];
					var intName = intParts[3];
					// check if int is actually up
					var startString = 'ifconfig output for ' + intName + '\n';
					var endString = '\n\n';
					if (results.indexOf(startString) == -1) {
						startString = '====== ifconfig ' + intName + ' ======';
						endString = 'B)   ';
					}
					if (results.indexOf(startString) != -1) {
						startLocation = results.indexOf(startString) + startString.length;
						var endLocation = results.indexOf(endString, startLocation);
						var intDetails = results.substring(startLocation, endLocation).trim();

						startString = 'HWaddr';
						var startLocation = intDetails.indexOf(startString) + startString.length;
						var endLocation = intDetails.indexOf('\n', startLocation);
						var macaddr = intDetails.substring(startLocation, endLocation).trim();
					} else {
						var intDetails = '';
						var macaddr = '?';
					}
					if (intDetails.includes('RUNNING')) {
						$('#interfaceIssues').append('<li>' + intName + ' (' + macaddr + '): <strong>' + intSpeed + 'Mbps (' + intDuplex + ' Duplex)</strong></li>');
					} else {
						$('#interfaceIssues').append('<li>' + intName + ' (' + macaddr + '): <strong>Down</strong></li>');
					}
				});

				document.getElementById('systemStatusText').innerHTML = results;
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
		if (systemNotification) {
			setTimeout(systemNotification.close, 1000);
		}
	});
}

function addPowerInfoForLabel(powerInformationBlock, powerLabel) {
	var startLocation = powerInformationBlock.indexOf(powerLabel);
	var labelSpace = ': ';
	var labelFinishLocation = powerInformationBlock.indexOf(labelSpace, startLocation) + labelSpace.length;
	var endLocation = powerInformationBlock.indexOf('\n', startLocation);
	var powerData = powerInformationBlock.substring(labelFinishLocation, endLocation).trim();
	if (powerLabel === 'Current Operational State') {
		if (!powerData.includes('No restrictions')) $('#powerIssues').append('<li>' + powerLabel + ': <i class="fa-solid fa-circle text-warning"></i><strong> ' + powerData + '</strong></li>');
		else $('#powerIssues').append('<li>' + powerLabel + ': <i class="fa-solid fa-circle text-success"></i><strong> ' + powerData + '</strong></li>');
	} else {
		$('#powerIssues').append('<li>' + powerLabel + ': <strong>' + powerData + '</strong></li>');
	}
}

function obtainCrashLog(deviceSerial) {
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 34 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkCrashLog, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkCrashLog(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkDebugSystemStatus, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				//console.log(response.output);
				var crashBlob = new Blob([response.output], { type: 'text/csv;charset=utf-8;' });
				var crashURL = window.URL.createObjectURL(crashBlob);
				var crashLink = document.createElement('a');
				crashLink.href = crashURL;
				crashLink.setAttribute('download', 'CrashInformation-' + response.serial + '.txt');
				crashLink.click();
				window.URL.revokeObjectURL(crashLink);
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AAA Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayAAA() {
	
	// Control the UI pieces
	if ($(document.getElementById('aaaBtn')).hasClass('btn-outline' )) {
		// Not selected
		debugAAA(currentAPSerial);
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-outline');
		$(document.getElementById('aaaBtn')).addClass('btn-fill');
		document.getElementById('aaaCard').hidden = false;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
	}
}

function refreshAAA() {
	debugAAA(currentAPSerial);
}

function debugAAA(deviceSerial) {
	aaaNotification = showLongNotification('ca-multiple-11', 'Getting AAA information...', 'bottom', 'center', 'info');
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 108 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkAAA, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkAAA(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkAAA, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				$('#aaaResponseTimes').empty();
				$('#aaaResponseStats').empty();
				$('#aaaPossibleIssues').empty();
				
				var deviceDetails = findDeviceInMonitoring(response.serial);
				document.getElementById('aaaTitle').innerHTML = 'AAA Details for ' + deviceDetails.name; // + ' (' + runTime + ')';

				aaaInfo = {};
				var columnIndexes = [];
				var columnNames = [];
				//console.log(response.output);
				//var results = decodeURI(response.output);
				var results = response.output;

				// Process the response...
				var lines = results.split('\n');
				var startLine = 0;
				// Get AAA Server Names
				for (var i = 0; i < lines.length; i++) {
					var currentLine = lines[i];
					// Pull out the Server Names
					if (currentLine.startsWith('Statistics')) {
						var nameLine = currentLine;
						var serverNames = nameLine.match(/[^\s]+/g);
						// get column index for server
						$.each(serverNames, function() {
							if (this != 'Statistics') {
								aaaInfo[this] = {};
								columnNames.push(this.toString());
								columnIndexes.push(nameLine.indexOf(this));
							}
						});
						startLine = i + 2;
						break;
					}
				}
				lines = lines.splice(startLine);

				// For each server get the values
				$.each(lines, function() {
					var currentLine = this.toString();
					if (currentLine.trim() != '' && !currentLine.includes('=== Troubleshooting session completed ===')) {
						var statName = currentLine.substring(0, columnIndexes[0]).trim();
						for (var i = 0; i < columnIndexes.length; i++) {
							var statValue = '';
							if (i == columnIndexes.length - 1) {
								var aaaStats = aaaInfo[columnNames[i]];
								aaaStats[statName] = currentLine.substring(columnIndexes[i]).trim();
								aaaInfo[columnNames[i]] = aaaStats;
							} else {
								var columnName = columnNames[i];
								var aaaStats = aaaInfo[columnName];
								aaaStats[statName] = currentLine.substring(columnIndexes[i], columnIndexes[i + 1]).trim();
								aaaInfo[columnName] = aaaStats;
							}
						}
					}
				});
				//console.log(aaaInfo);

				// Build out the UI elements
				for (const [key, value] of Object.entries(aaaInfo)) {
					if (value['AvgRespTime (ms)'] != '0') $('#aaaResponseTimes').append('<li>' + key + ': <strong>' + value['AvgRespTime (ms)'] + ' ms</strong></li>');
					if (value['Access-Accept'] != '0' || value['Access-Reject'] != '0') $('#aaaResponseStats').append('<li>' + key + ': Access-Accept: <strong>' + value['Access-Accept'] + ' </strong> Access-Reject: <strong>' + value['Access-Reject'] + '</strong></li>');

					if (value['Invalid Secret'] != '0') $('#aaaPossibleIssues').append('<li>' + key + ': <strong>Invalid Secret (' + value['Invalid Secret'] + ')</strong></li>');
					if (value['Read Error'] != '0') $('#aaaPossibleIssues').append('<li>' + key + ': <strong>Read Error (' + value['Read Error'] + ')</strong></li>');
					if (value['Mismatch Response'] != '0') $('#aaaPossibleIssues').append('<li>' + key + ': <strong>Mismatch Response (' + value['Mismatch Response'] + ')</strong></li>');
				}

				document.getElementById('aaaText').innerHTML = results;
				$('#AAAModalLink').trigger('click');
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
		if (aaaNotification) {
			setTimeout(aaaNotification.close, 1000);
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Tech Support Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function debugTech(deviceSerial) {
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 257 }, { command_id: 201 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDebugTech, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkDebugTech(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkDebugTech, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				console.log(response.output);
				/*//var results = decodeURI(response.output);
				var results = response.output;

				// Command Run Time
				var startString = 'Output Time: ';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var runTime = results.substring(startLocation, endLocation).trim();

				// Populate the SystemStatus Modal
				var deviceDetails = findDeviceInMonitoring(response.serial);
				document.getElementById('systemStatusTitle').innerHTML = 'System Status for ' + deviceDetails.name; // + ' (' + runTime + ')';

				$('#generalSystemIssues').empty();
				$('#powerIssues').empty();
				$('#hardwareIssues').empty();
				$('#interfaceIssues').empty();

				// Find AP Uptime
				var startString = 'AP Uptime\n---------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var uptime = results.substring(startLocation, endLocation).trim();
				$('#generalSystemIssues').append('<li>Uptime: <strong>' + uptime + '</strong></li>');

				// Find Reboot Reason "AP Reboot reason:  "
				var startString = 'Reboot Information\n------------------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var rebootReason = results.substring(startLocation, endLocation).trim();
				$('#generalSystemIssues').append('<li>Reboot Reason: <strong>' + rebootReason + '</strong></li>');

				// Check if crash log exists
				var startString = 'Crash Information\n-----------------';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('------------', startLocation);
				var crashReason = results.substring(startLocation, endLocation).trim();
				if (crashReason !== '(none found)') {
					if (crashReason == "Crash information is available; use 'show ap debug crash-info' to retrieve") {
						$('#generalSystemIssues').append('<li id="crashInfo">Crash Information: <button class="btn btn-round btn-sm btn-outline btn-warning" onclick="obtainCrashLog(\'' + response.serial + '\')">Download Crash Information</button></li>');
					} else {
						$('#generalSystemIssues').append('<li id="crashInfo">Crash Information: <strong>' + crashReason + '</strong></li>');
					}
				}

				// Power Information
				var startString = 'Power Status\n------------\nItem                        Value\n----                        -----\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n\n', startLocation);
				var powerInformationBlock = results.substring(startLocation, endLocation).trim();
				addPowerInfoForLabel(powerInformationBlock, 'Power Supply');
				addPowerInfoForLabel(powerInformationBlock, 'LLDP Power');
				addPowerInfoForLabel(powerInformationBlock, 'Current Operational State');

				if (results.indexOf('Power Monitoring Information') != -1) {
					var startString = 'Power Monitoring Information\n----------------------------\nCurrent(mW)  Average(mW)  Minimum(mW)  Maximum(mW)\n-----------  -----------  -----------  -----------\n';
					var startLocation = results.indexOf(startString) + startString.length;
					var endLocation = results.indexOf(' ', startLocation);
					//console.log(results.substring(startLocation, endLocation).trim());
					var currentDraw = parseInt(results.substring(startLocation, endLocation).trim()) / 1000;
					$('#powerIssues').append('<li>Current Power Draw: <strong>' + currentDraw.toFixed(2) + 'W</strong></li>');
				}

				// Hardware status
				var startString = 'Peak CPU Util in the last one hour\n----------------------------------\nTimestamp            CPU Util(%)  Memory Util(%)\n---------            -----------  --------------\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n', startLocation);
				var memoryLine = results.substring(startLocation, endLocation).trim();

				// CPU
				startString = '  ';
				var startLocation = memoryLine.indexOf(startString) + startString.length;
				var endLocation = memoryLine.indexOf('   ', startLocation);
				var lastCPUValue = memoryLine.substring(startLocation, endLocation).trim();
				$('#hardwareIssues').append('<li>CPU Usage: <strong>' + lastCPUValue + '%</strong></li>');
				// Memory
				startString = '   ';
				var startLocation = memoryLine.indexOf(startString) + startString.length;
				var lastMemoryValue = parseInt(memoryLine.substring(startLocation).trim());
				if (lastMemoryValue > 74) $('#hardwareIssues').append('<li>Memory Usage: <i class="fa-solid fa-circle text-warning"></i><strong>' + lastMemoryValue + '%</strong></li>');
				else $('#hardwareIssues').append('<li>Memory Usage: <strong>' + lastMemoryValue + '%</strong></li>');

				// Ethernet status
				var startString = 'Ethernet Duplex/Speed Settings\n------------------------------\nAutoneg  Speed (Mbps)  Duplex  Iface\n-------  ------------  ------  -----\n';
				if (results.indexOf(startString) == -1) startString = 'Ethernet Duplex/Speed Settings\n------------------------------\nAutoneg  Speed (Mbps)  Duplex   Iface\n-------  ------------  ------   -----\n';
				var startLocation = results.indexOf(startString) + startString.length;
				var endLocation = results.indexOf('\n\n', startLocation);
				var ethernetInterfaces = results.substring(startLocation, endLocation).trim();
				//console.log(ethernetInterfaces);
				var interfaces = ethernetInterfaces.split('\n');
				$.each(interfaces, function() {
					var intString = this.replace(/  +/g, ' ');
					var intParts = intString.split(' ');
					var intSpeed = intParts[1];
					var intDuplex = intParts[2];
					var intName = intParts[3];
					// check if int is actually up
					var startString = 'ifconfig output for ' + intName + '\n';
					var endString = '\n\n';
					if (results.indexOf(startString) == -1) {
						startString = '====== ifconfig ' + intName + ' ======';
						endString = 'B)   ';
					}
					if (results.indexOf(startString) != -1) {
						startLocation = results.indexOf(startString) + startString.length;
						var endLocation = results.indexOf(endString, startLocation);
						var intDetails = results.substring(startLocation, endLocation).trim();

						startString = 'HWaddr';
						var startLocation = intDetails.indexOf(startString) + startString.length;
						var endLocation = intDetails.indexOf('\n', startLocation);
						var macaddr = intDetails.substring(startLocation, endLocation).trim();
					} else {
						var intDetails = '';
						var macaddr = '?';
					}
					if (intDetails.includes('RUNNING')) {
						$('#interfaceIssues').append('<li>' + intName + ' (' + macaddr + '): <strong>' + intSpeed + 'Mbps (' + intDuplex + ' Duplex)</strong></li>');
					} else {
						$('#interfaceIssues').append('<li>' + intName + ' (' + macaddr + '): <strong>Down</strong></li>');
					}
				});

				document.getElementById('systemStatusText').innerHTML = results;
				$('#SystemStatusModalLink').trigger('click');
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
				*/
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	ARM Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayRFNeighbours() {
	
	// Control the UI pieces
	if ($(document.getElementById('neighboursBtn')).hasClass('btn-outline' )) {
		// Not selected
		debugNeighbours(currentAPSerial);
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-outline');
		$(document.getElementById('neighboursBtn')).addClass('btn-fill');
		document.getElementById('neighboursCard').hidden = false;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
	}
}

function refreshNeighbours() {
	debugNeighbours(currentAPSerial);
}

function refreshBSSIDs() {
	bssidNotification = showLongNotification('ca-wifi', 'Obtaining BSSIDs...', 'bottom', 'center', 'info');
	$.when(getBSSIDData(0)).then(function() {
		// build BSSID to AP mapping
		var rawBSSIDs = getBSSIDs();
		$.each(rawBSSIDs, function() {
			var ap = findDeviceInMonitoring(this.serial);
			$.each(this.radio_bssids, function() {
				var radio = this;
				$.each(radio.bssids, function() {
					apBSSIDs[this.macaddr] = ap;
				});
			});
		});
		if (bssidNotification) {
			bssidNotification.update({ message: 'Obtained BSSIDs', type: 'success' });
			setTimeout(bssidNotification.close, 1000);
		}
	});
}

function debugNeighbours(deviceSerial) {
	neighboursNotification = showLongNotification('ca-duplicate', 'Getting RF Neighbour information...', 'bottom', 'center', 'info');
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 18 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDebugNeighbours, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkDebugNeighbours(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkDebugNeighbours, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				$('#BSSIDModalLink').trigger('click');
				
				neighbourTableData = [];
				currentAP = findDeviceInMonitoring(response.serial);
				
				$('#bssid-table')
					.DataTable()
					.rows()
					.remove();
				var table = $('#bssid-table').DataTable();

				var results = response.output;

				// For each block of BSSIDs (column widths could be different!!!)
				var bssidBlocks = results.split('ARM Neighbors\n-------------\n');
				bssidBlocks.shift(); // no need for the first block (not useful info)

				$.each(bssidBlocks, function() {
					// Get column widths by dissecting the header row
					var headerLocation = this.indexOf('bssid              essid');
					var headers = this.substring(headerLocation, this.indexOf('\n', headerLocation));
					var bssidLocation = headers.indexOf('bssid');
					var essidLocation = headers.indexOf('essid');
					var bandLocation = headers.indexOf('phy-type');
					var channelLocation = headers.indexOf('channel');
					var snrLocation = headers.indexOf('snr');
					var txLocation = headers.indexOf('tx-power');
					var pathLossLocation = headers.indexOf('PL (dB)');
					var flagsLocation = headers.indexOf('AP Flags');
					var updateLocation = headers.indexOf('Last Update');

					// Rip out the Neighbour BSSIDs
					var foundBSSIDs = this.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2}).*$/gm);
					$.each(foundBSSIDs, function() {
						// Dissect each line for the pieces needed
						var bssid = this.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/gm);
						var essid = this.substring(essidLocation, bandLocation).trim();
						var band = this.substring(bandLocation, channelLocation).trim();
						if (bandLocation == -1) {
							essid = this.substring(essidLocation, channelLocation).trim();
							band = '';
						}
						var channel = this.substring(channelLocation, snrLocation).trim();
						var snr = this.substring(snrLocation, txLocation).trim();
						var txPower = this.substring(txLocation, pathLossLocation).trim();
						var pathLoss = this.substring(pathLossLocation, flagsLocation).trim();
						var flags = this.substring(flagsLocation, updateLocation).trim();
						var update = this.substring(updateLocation).trim();

						var ap = apBSSIDs[bssid];
						if (ap) {
							// Make AP Name as a link to Central
							var name = encodeURI(ap['name']);
							var apiURL = localStorage.getItem('base_url');
							var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';

							table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank" data-toggle="tooltip" data-placement="right" title="' + bssid + '"><strong>' + ap['name'] + '</strong></a>', essid, band, channel, snr, txPower, pathLoss, flags]);
							
							neighbourTableData.push([ap['name'], essid, band, channel, snr, txPower, pathLoss, flags]);
						} else {
							table.row.add([bssid, essid, band, channel, snr, txPower, pathLoss, flags]);
							neighbourTableData.push([bssid, essid, band, channel, snr, txPower, pathLoss, flags]);
						}
					});
				});

				$('#bssid-table')
					.DataTable()
					.rows()
					.draw();
				$('[data-toggle="tooltip"]').tooltip();
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
		if (neighboursNotification) {
			setTimeout(neighboursNotification.close, 1000);
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadNeighbourTable() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#bssid-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', currentAP['name']+'-Neighbours-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', currentAP['name']+'-Neighbours.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildCSVData() {
	//CSV header
	var bssidKey = 'AP/BSSID';
	var essidKey = 'ESSID';
	var bandKey = 'BAND';
	var channelKey = 'CHANNEL';
	var snrKey = 'SNR';
	var powerKey = 'TX POWER';
	var lossKey = 'PATH LOSS';
	var discoveryKey = 'DISCOVERY';

	var csvDataBuild = [];

	// For each row in the filtered set
	$.each(neighbourTableData, function() {
		csvDataBuild.push({ [bssidKey]: this[0], [essidKey]: this[1], [bandKey]: this[2], [channelKey]: this[3], [snrKey]: this[4], [powerKey]: this[5], [lossKey]: this[6], [discoveryKey]: this[7]});
	});

	return csvDataBuild;
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Datapath Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayDatapath() {
	
	// Control the UI pieces
	if ($(document.getElementById('datapathBtn')).hasClass('btn-outline' )) {
		// Not selected
		getDatapathForAP(currentAPSerial);
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-outline');
		$(document.getElementById('datapathBtn')).addClass('btn-fill');
		document.getElementById('datapathCard').hidden = false;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	} else {
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
	}
}

function refreshDatapath() {
	getDatapathForAP(currentAP.serial);
}

function getDatapathForAP(deviceSerial) {
	datapathNotification = showLongNotification('ca-firewall', 'Getting AP Datapath information...', 'bottom', 'center', 'info');
	currentAP = findDeviceInMonitoring(deviceSerial);
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 45 }, { command_id: 211 }] });
	includePAN = false;
	if (currentAP.firmware_version.includes('10.6') || currentAP.firmware_version.includes('10.7') || currentAP.firmware_version.includes('10.8')) {
		data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 22 }, { command_id: 45 }, { command_id: 211 }] });
		includePAN = true
	} 
	
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};
	
	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			troubleshootingNotification = showPermanentNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDatapathStatus, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}


function checkDatapathStatus(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				troubleshootingNotification.update({ message: response.message.replace(' Please try after sometime', '.'), type: 'info' });
				setTimeout(checkDatapathStatus, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				$('#DatapathModalLink').trigger('click');
				//var results = decodeURI(response.output);
				var results = response.output;
				var pos = -1;		
				// split into the three commands (show ap association, show datapath session, show datapath session dpi)
				if (includePAN) {
					pos = results.indexOf('COMMAND=show ap association');
					var associationResults = results.substring(pos, results.indexOf('===================================', pos));
					var associationLines = associationResults.split('\n');
					var tableIndex = associationLines.indexOf('-----------------');
					associationLines.splice(0,tableIndex+3);
					var tableIndex = associationLines.indexOf('');
					associationLines.splice(tableIndex-1);
					// get PANID for each macaddr and map to the user IP.
					$.each(associationLines, function() {
						var associationPieces = this.split(' ');
						var panId = associationPieces.pop();
						if (panId != 0) {
							var filtered = associationPieces.filter(elm => elm);
							var clientDevice = findDeviceInMonitoringForMAC(filtered[2]);
							if (clientDevice) ipToPAN[clientDevice.ip_address] = panId;
						}
					});
				}
				
				pos = results.indexOf('COMMAND=show datapath session');
				var sessionResults = results.substring(pos, results.indexOf('===================================', pos));
				var sessionLines = sessionResults.split('\n');
				var tableIndex = sessionLines.indexOf('----------------  --------------  ---- ----- ----- ---- ---- --- --- ----------- ---- ------- ----- ------ ------------- ');
				sessionLines.splice(0,tableIndex+1);
				var tableIndex = sessionLines.indexOf('');
				sessionLines.splice(tableIndex);
				
				pos = results.indexOf('COMMAND=show datapath session dpi');
				var dpiResults = results.substring(pos);
				var dpiLines = dpiResults.split('\n');
				var tableIndex = dpiLines.indexOf('----------------  --------------  ---- ----- ----- -------------------------- ------------------------- ------ ------- ----- ------- ------ ------------- ---------');
				dpiLines.splice(0,tableIndex+1);
				var tableIndex = dpiLines.indexOf('');
				dpiLines.splice(tableIndex);
				
				// Filter session table for client specific entries
				// and Sort session table into flow pairs...
				sessionPairs = {};
				var sessionTableFound
				$.each(sessionLines, function() {
					var lineData = this.replace(/  +/g, ' '); // remove the extra padding in the results
					var lineArray = lineData.split(' ');
					if (isIpAddress(lineArray[0])) {
						lineArray[10] = parseInt(lineArray[10], 16).toString(); // convert hex to int
						lineArray[11] = parseInt(lineArray[11], 16).toString(); // convert hex to int
						lineArray[12] = parseInt(lineArray[12], 16).toString(); // convert hex to int
						if (lineArray.length < 15) lineArray.push(' '); // Add extra if Offload Flags are empty (and therefore trimmed off)
						
						lineArray.splice(10, 1); // Remove TAge since we are not showing it
						lineArray[5] = '-'; // repurposing CNTR value with DPI App
						lineArray[6] = '-'; // repurposing PRIO value with DPI Web Category
						
						// Check for DPI information for session line
						$.each(dpiLines, function(){
							var dpiLineData = this.replace(/  +/g, ' ');
							var dpiLineArray = dpiLineData.split(' ');
							// Match on Src IP/Port and Dest IP/port 
							if ((lineArray[0] === dpiLineArray[0]) && (lineArray[1] === dpiLineArray[1]) && (lineArray[3] === dpiLineArray[3]) && (lineArray[4] === dpiLineArray[4])) {
								
								// Put in App from AppRF Mappings
								var apprfIDs = dpiLineData.match(/\[(.*?)\]/g);
								var appId = apprfIDs[0].replace(/[\[\]\s]+/g,'');
								lineArray[5] = appIDMappings[appId];
								
								// Put in Web Category from AppRF Mappings
								var webCatId = apprfIDs[1].replace(/[\[\]\s]+/g,'');
								lineArray[6] = webCatMappings[webCatId];
								
								return false; // Break out of dpiLines iteration
							}
						});
						
						// create session pair key - used to link in and out sessions together
						var sessionKey = '';
						if (isPrivateIP(lineArray[0])) sessionKey = lineArray[1] + ':' + lineArray[3] + ':' + lineArray[4]; // key for outbound traffic
						else sessionKey = lineArray[0] + ':' + lineArray[4] + ':' + lineArray[3]; // key for return traffic
						
						if (!sessionPairs[sessionKey]) {
							sessionPairs[sessionKey] = [];
						}
						sessionPairs[sessionKey].push(lineArray); // add session line to pairing
					}
				});
				
				loadDatapathTable();
				
				if (troubleshootingNotification) {
					troubleshootingNotification.update({ message: response.message, type: 'success' });
					setTimeout(troubleshootingNotification.close, 1000);
				}
			} else {
				if (troubleshootingNotification) {
					troubleshootingNotification.update({ message: response.message, type: 'danger' });
					setTimeout(troubleshootingNotification.close, 2000);
				}
			}
			if (datapathNotification) datapathNotification.close();
		}
	});
}

function loadDatapathTable() {
	// Clear the table
	var table = $('#datapath-table').DataTable();
	$('#datapath-table')
	.DataTable()
	.rows()
	.remove();
	
	var sessionKeyArray = Object.keys(sessionPairs);
	for (var i=0;i<sessionKeyArray.length;i++) {
		var sessionLines = sessionPairs[sessionKeyArray[i]];
		
		// Sort the session pairs so that the outbound is first
		sessionLines.sort((a,b) => (isPrivateIP(b[0])) ? 1 : (isPrivateIP(a[0]) ? -1 : 0))
		sessionCopy = JSON.parse(JSON.stringify(sessionLines));
		$.each(sessionCopy, function(){
			var sessionRow = this;
			// Map protocol to name
			sessionRow[2] = networkProtocols[sessionRow[2]];
			
			// Add session direction arrow (and colour red is Denied)
			if (isPrivateIP(sessionRow[0])) {
				sessionRow.unshift('<span title="Outbound"</span><i class="fa-solid fa-caret-up"></i>');
			} else {
				if (sessionRow[13].includes('D')) sessionRow.unshift('<span title="Inbound"</span><i class="fa-solid fa-caret-down text-danger"></i>');
				sessionRow.unshift('<span title="Inbound"</span><i class="fa-solid fa-caret-down"></i>');
			}
			// Add the session pair number as the first element in the row, then add row to table
			sessionRow.unshift(i+1);
			var srcIP = sessionRow[2];
			var dstIP = sessionRow[3];
			if (document.getElementById('revealUsernames').checked) {
				if (ipToUsername[srcIP]) sessionRow[2] = '<span data-toggle="tooltip" data-placement="top" title="'+srcIP+'">'+ipToUsername[srcIP]+'</span>';
				if (ipToUsername[dstIP]) sessionRow[3] = '<span data-toggle="tooltip" data-placement="top" title="'+dstIP+'">'+ipToUsername[dstIP]+'</span>';
			} else {
				if (ipToUsername[srcIP]) sessionRow[2] = '<span data-toggle="tooltip" data-placement="top" title="'+ipToUsername[srcIP]+'">'+srcIP+'</span>';
				if (ipToUsername[dstIP]) sessionRow[3] = '<span data-toggle="tooltip" data-placement="top" title="'+ipToUsername[dstIP]+'">'+dstIP+'</span>';
			}
			if (includePAN) {
				if (ipToPAN[srcIP]) sessionRow[15] = ipToPAN[srcIP];
				else sessionRow[15] = '-'
			} else {
				sessionRow[15] = '-'
			}
				
			if (sessionRow[14].includes('D')) sessionRow.splice(14, 0, '<i class="fa-solid fa-circle text-danger"></i>');
			else sessionRow.splice(14, 0, '<i class="fa-solid fa-circle text-success"></i>');
			
			var rowNode = table.row.add(sessionRow).draw().node();
			
			
		});
	}
	
	$('#datapath-table').DataTable().columns.adjust().draw();
}

function isIpAddress(ip) { 
	const ipv4Pattern =  
		/^(\d{1,3}\.){3}\d{1,3}$/; 
	const ipv6Pattern =  
		/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/; 
	return ipv4Pattern.test(ip) || ipv6Pattern.test(ip); 
}

function isPrivateIP(ip) {
   var parts = ip.split('.');
   return parts[0] === '10' || 
	  (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) || 
	  (parts[0] === '192' && parts[1] === '168');
}

function generateIPtoUsernameMapping() {
	ipToUsername = {};
	var allClients = getClients();
	$.each(allClients, function() {
		if (this.ip_address && this.name !== this.macaddr) ipToUsername[this.ip_address] = this.name;
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	CLI Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayCLI() {
	// Control the UI pieces
	if ($(document.getElementById('datapathBtn')).hasClass('btn-outline' )) {
		// Not selected
		document.getElementById('cliText').value = '';
		
		$(document.getElementById('systemBtn')).removeClass('btn-fill');
		$(document.getElementById('systemBtn')).addClass('btn-outline');
		document.getElementById('systemCard').hidden = true;
		
		var radioBtns = $('button[id^="radioBtn"]')
		$.each(radioBtns, function() {
			$(document.getElementById(this.id)).removeClass('btn-fill');
			$(document.getElementById(this.id)).addClass('btn-outline');
		});
		document.getElementById('radioCard').hidden = true;
		
		$(document.getElementById('rfBtn')).removeClass('btn-fill');
		$(document.getElementById('rfBtn')).addClass('btn-outline');
		document.getElementById('rfCard').hidden = true;
		
		$(document.getElementById('aaaBtn')).removeClass('btn-fill');
		$(document.getElementById('aaaBtn')).addClass('btn-outline');
		document.getElementById('aaaCard').hidden = true;
		
		$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
		$(document.getElementById('neighboursBtn')).addClass('btn-outline');
		document.getElementById('neighboursCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('dirtyBtn')).removeClass('btn-fill');
		$(document.getElementById('dirtyBtn')).addClass('btn-outline');
		document.getElementById('dirtyCard').hidden = true;
		
		$(document.getElementById('commandsBtn')).removeClass('btn-outline');
		$(document.getElementById('commandsBtn')).addClass('btn-fill');
		document.getElementById('commandsCard').hidden = false;
	} else {
		$(document.getElementById('commandsBtn')).removeClass('btn-fill');
		$(document.getElementById('commandsBtn')).addClass('btn-outline');
		document.getElementById('commandsCard').hidden = true;
	}
}

function runCLICommand() {
	cliNotification = showLongNotification('ca-tshoot-ap', 'Running CLI command...', 'bottom', 'center', 'info');
	var selection = document.getElementById('cliselector').value;
	
	if (selection) {
		var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: parseInt(selection) }] });
	
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + currentAPSerial,
				access_token: localStorage.getItem('access_token'),
				data: data,
			}),
		};
		
		$.ajax(settings).done(function(response) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
					return;
				}
			}
			if (response.hasOwnProperty('error')) {
				showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			} else if (response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
				setTimeout(checkCLIStatus, 5000, response.session_id, response.serial);
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		});
	} else {
		if (cliNotification) cliNotification.close();
		showNotification('ca-c-warning', 'Please select a command', 'bottom', 'center', 'danger');
	}
}

function checkCLIStatus(session_id, deviceSerial) {
	cliNotification.update({ message: 'Waiting for response from device...', type: 'info' });
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkCLIStatus, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				//console.log(response.output);
				//var results = decodeURI(response.output);
				var results = response.output;
				
				document.getElementById('cliText').value = results;
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
		if (cliNotification) {
			cliNotification.update({ message: 'Results recieved', type: 'success' });
			setTimeout(cliNotification.close, 1000);
		}
	});
}