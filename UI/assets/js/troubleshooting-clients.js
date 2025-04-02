/*
Central Automation v1.37
Updated: 1.37.1
© Aaron Scott (WiFi Downunder) 2021-2025
*/

var osType = [];

var clientNotification;
var eventsNotification;
var mobilityNotification;
var authNotification;
var disconnectNotification;
var disconnectingClient;
var troubleshootingNotification;
var cmNotification;
var roleNotification;

var currentClientMac;
var connectedAP;
var needAllLabels = false;
var needClientLabel = false;
var associateAP;

var selectedClient;
var sessionPairs;
var ipToUsername = {};
var ipToPAN = {};
var includePAN = false;


var userRolePrefix = 'wlan access-rule ';
var userRoles = {};

/*  ----------------------------------
		Global functions
	---------------------------------- */
function loadClientsUI(client) {
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	if (!client['health'] && client['failure_stage'] !== '' && client['failure_stage'] !== 'NA') {
		status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + client['failure_reason'] + ' at ' + client['failure_stage'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (!client['health']) {
		status = '<i class="fa-solid fa-circle text-neutral"></i>';
	} else if (client['health'] < 50) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (client['health'] < 70) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-warning"></i></span>';
	} else {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-success"></i></span>';
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
	if (!osType.includes(client.os_type) && !client.os_type.includes('--')) osType.push(client.os_type);
	
	var client_name = '';
	if (client['name']) client_name = client['name'];
	var client_mac = 'Unknown';
	if (client['macaddr']) client_mac = client['macaddr'];
	
	var clientIcon = '<span title="wired"</span><i class="fa-solid fa-ethernet"></i>'
	if (client.client_type === "WIRELESS") clientIcon = '<span title="wireless"</span><i class="fa-solid fa-wifi"></i>'

	// Make link to Central
	client_name_url = encodeURI(client_name);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + client['macaddr'] + '?ccma=' + client['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
	
	var tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Client Details" onclick="showClientDetails(\'' + client['macaddr'] + '\')"><i class="fa-solid fa-circle-info"></i></a> ';
	
	if (client.client_type === "WIRELESS") {
		tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Disconnect Client" onclick="disconnectUser(\'' + client['macaddr'] + '\')"><i class="fa-solid fa-wifi"></i></a> ';
	} else if (client.client_type === "WIRED") {
		tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="wiredPoeBounce(\'' + client['macaddr'] + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
		tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="wiredInterfaceBounce(\'' + client['macaddr'] + '\')"><i class="fa-solid fa-ethernet"></i></a>';
	}

	// Add row to table
	var table = $('#client-table').DataTable();
	table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', clientIcon, status, client_mac, ip_address, os_type, client['user_role'], associatedDevice_name, site, vlan, tshootBtns]);

	$('[data-toggle="tooltip"]').tooltip();
}

function reloadClientTable(reloadTrigger) {
	
	$('#client-table')
	.DataTable()
	.rows()
	.remove();
	
	var selectedConnection = document.getElementById('connectionselector').value;
	var selectedType = document.getElementById('typeselector').value;
	
	var selectedClients;
	if (selectedConnection === 'All') {
		selectedClients = getClients();
	} else if (selectedConnection === 'Wired') {
		selectedClients = getWiredClients();
	} else if (selectedConnection === 'Wireless') {
		selectedClients = getWirelessClients();
	}
	
	
	osType = [];
	$.each(selectedClients, function(){
		if (selectedType === 'All') loadClientsUI(this);
		else if (selectedType === this.os_type) loadClientsUI(this);
	});
	
	if (reloadTrigger == 0) {
		populateOSSelector();
	}
	
	$('#client-table')
	.DataTable()
	.rows()
	.draw();
	$('#client-table').DataTable().columns.adjust().draw();
}

function refreshClientDataTable() {
	$('#client-table')
	.DataTable()
	.rows()
	.remove();
	
	refreshClientData();
}

function loadCurrentPageClient() {
	populateOSSelector();
	generateIPtoUsernameMapping();
	getAppRFMappings();
}

function populateOSSelector() {
	osType.sort((a, b) => {
		const siteA = a.toUpperCase(); // ignore upper and lowercase
		const siteB = b.toUpperCase(); // ignore upper and lowercase
		// Sort on Site Name
		if (siteA < siteB) {
			return -1;
		}
		if (siteA > siteB) {
			return 1;
		}
		return 0;
	});
	
	// populate the secondary Filter
	select = document.getElementById('typeselector');
	select.options.length = 0;
	$('#typeselector').append($('<option>', { value: 'All', text: 'All' }));
	$('#typeselector').append($('<option>', { value: '', text: '─────────────────', style: 'color: #cccccc;', disabled: true }));
	$('#typeselector').append($('<option>', { value: '', text: 'Client OS', style: 'color: #999999;', disabled: true }));
	$.each(osType, function() {
		$('#typeselector').append($('<option>', { value: this, text: this }));
	});
	$('#typeselector').selectpicker('refresh');
	$('#typeselector').selectpicker('val', 'All');
}

function showClientDetails(clientMac) {
	var client = findDeviceInMonitoringForMAC(clientMac)
	if (client.client_type === "WIRELESS") {
		showWirelessClient(client);
	} else {
		showWiredClient(client);
	}
}

/*  ----------------------------------
	Wireless Troubleshooting functions
---------------------------------- */
function hideTroubleshooting() {
	$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
	$(document.getElementById('keySyncBtn')).addClass('btn-outline');
	document.getElementById('syncedAPCard').hidden = true;
	
	$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
	$(document.getElementById('mobilityBtn')).addClass('btn-outline');
	document.getElementById('mobilityCard').hidden = true;
	
	$(document.getElementById('eventsBtn')).removeClass('btn-fill');
	$(document.getElementById('eventsBtn')).addClass('btn-outline');
	document.getElementById('eventsCard').hidden = true;
	
	$(document.getElementById('datapathBtn')).removeClass('btn-fill');
	$(document.getElementById('datapathBtn')).addClass('btn-outline');
	document.getElementById('datapathCard').hidden = true;
	
	if ($(document.getElementById('userRoleBtn'))) {
		$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
		$(document.getElementById('userRoleBtn')).addClass('btn-outline');
	}
	document.getElementById('userRoleCard').hidden = true;

	// Clear old table data
	$('#events-table').DataTable().rows().remove();
	$('#events-table').DataTable().rows().draw();
	$('#mobility-table').DataTable().rows().remove();
	$('#mobility-table').DataTable().rows().draw();
	$('#synced-ap-table').DataTable().rows().remove();
	$('#synced-ap-table').DataTable().rows().draw();
}

function showWirelessClient(currentClient) {
	hideTroubleshooting();
	currentClientMac = currentClient['macaddr'];
	
	vrfClients = [];
	selectedClient = currentClient;
	
	client_name_url = encodeURI(currentClient['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + currentClient['macaddr'] + '?ccma=' + currentClient['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
	var nameValue = '<a href="' + clientURL + '" target="_blank"><strong>' + currentClient['name'] + '</strong></a>'
	
	$('#wirelessInfo').empty();
	$('#wirelessInfo').append('<li>Name: ' + nameValue + '</li>');
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	if (!currentClient['health'] && currentClient['failure_stage'] !== '' && currentClient['failure_stage'] !== 'NA') {
		status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + currentClient['failure_reason'] + ' at ' + currentClient['failure_stage'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (!currentClient['health']) {
		status = '<i class="fa-solid fa-circle text-neutral"></i>';
	} else if (currentClient['health'] < 50) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + currentClient['health'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (currentClient['health'] < 70) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + currentClient['health'] + '"><i class="fa-solid fa-circle text-warning"></i></span>';
	} else {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + currentClient['health'] + '"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	
	connectedAP = findDeviceInMonitoring(currentClient['associated_device']);
	var connectedRadio;
	$.each(connectedAP.radios, function() {
		if (currentClient['radio_mac'] === this.macaddr) connectedRadio = this;
	});
	var uptimeString = '-';
	if (connectedAP['uptime'] > 0) {
		var uptime = moment.duration(connectedAP['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	// AP Link to Central
	var apName = encodeURI(connectedAP['name']);
	var centralURLAP = centralBaseURL + '/frontend/#/APDETAILV2/' + connectedAP['serial'] + '?casn=' + connectedAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
	var centralURLAPLink = '<a href="' + centralURLAP + '" target="_blank"><strong>' + connectedAP['name'] + '</strong></a>';
	
	// Site Link to Central
	var siteName = encodeURI(currentClient['site']);
	var siteId = getIDforSite(currentClient['site'])
	var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
	var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + currentClient['site'] + '</strong></a>';
	
	// Group Link to Central
	var groupName = encodeURI(connectedAP['group_name']);
	var groupId = connectedAP['group_id'];
	var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
	var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + connectedAP['group_name'] + '</strong></a>';
	
	
	/*console.log(currentClient)
	console.log(connectedAP)
	console.log(connectedRadio)*/
	
	
	$('#wirelessInfo').append('<li>Health: '+status+'</li>');
	$('#wirelessInfo').append('<li>Device: <strong>' + currentClient['os_type'] + '</strong></li>');
	$('#wirelessInfo').append('<li>MAC Address: <strong>' + currentClient['macaddr'] + '</strong></li>');
	$('#wirelessInfo').append('<li>IP Address: <strong>' + currentClient['ip_address'] + '</strong></li>');
	$('#wirelessInfo').append('<li>VLAN: <strong>' + currentClient['vlan'] + '</strong></li>');
	$('#wirelessInfo').append('<li>User Role: <strong>' + currentClient['user_role'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Connected Since: <strong>' + moment(currentClient['last_connection_time']).toString()  + '</strong></li>');
	if (currentClient['site']) $('#wirelessInfo').append('<li>Site: ' + centralURLSiteLink + '</li>');
	
	
	
	$('#wirelessConnection').empty();
	$('#wirelessConnection').append('<li>Associated To: ' + centralURLAPLink + '</li>');
	if (currentClient['failure_stage'] !== '') $('#wirelessConnection').append('<li>Failure Reason: '+currentClient['failure_stage']+'</li>');
	$('#wirelessConnection').append('<li>SSID: <strong>'+currentClient['network']+'</li>');
	$('#wirelessConnection').append('<li>Auth Method: <strong>'+currentClient['authentication_type']+'</li>');
	$('#wirelessConnection').append('<li>Encryption Method: <strong>'+currentClient['encryption_method'].replace('_', '-')+'</li>');
	$('#wirelessConnection').append('<li>Band: <strong>' + currentClient['band'] + 'GHz</strong></li>');
	if (currentClient['channel']) $('#wirelessConnection').append('<li>Channel: <strong>' + currentClient['channel'] + '</strong></li>');
	if (currentClient['signal_db']) $('#wirelessConnection').append('<li>RSSI: <strong>' + currentClient['signal_db'] + 'dBm</strong></li>');
	if (currentClient['snr']) $('#wirelessConnection').append('<li>SNR: <strong>' + currentClient['snr'] + 'dB</strong></li>');
	if (currentClient['speed']) $('#wirelessConnection').append('<li>Speed: <strong>' + currentClient['speed'] + 'Mbps</strong></li>');
	var capabilities = currentClient['connection'] ? currentClient['connection']:'-';
	$('#wirelessConnection').append('<li>Capabilities: <strong>' + capabilities + '</strong></li>');
	
	$('#wirelessAP').empty();
	$('#wirelessAP').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	$('#wirelessAP').append('<li>AP Model: <strong>' + connectedAP['model'] + '</strong></li>');
	$('#wirelessAP').append('<li>Firmware: <strong>' + connectedAP['firmware_version'] + '</strong></li>');
	$('#wirelessAP').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
	$('#wirelessAP').append('<li>Total Clients: <strong>' + connectedAP['client_count'] + '</strong></li>');
	$('#wirelessAP').append('<li>CPU Utilization: <strong>' + connectedAP['cpu_utilization'] + '%</strong></li>');
	var memoryUsage = (((connectedAP['mem_total'] - connectedAP['mem_free']) / connectedAP['mem_total']) * 100).toFixed(0).toString();
	$('#wirelessAP').append('<li>Memory Utilization: <strong>' + memoryUsage + '%</strong></li>');
	if (connectedRadio) $('#wirelessAP').append('<li>Channel Utilization ('+ currentClient['band'] +'GHz): <strong>' + connectedRadio['utilization'] + '%</strong></li>');
	
	if (document.getElementById('syncedAPFloorplanCard')) document.getElementById('syncedAPFloorplanCard').hidden = true;
	if (document.getElementById('syncedAPCard')) document.getElementById('syncedAPCard').hidden = true;
	
	resetCanvases();
	$('#WirelessClientModalLink').trigger('click');
	
	associatedAP = currentClient['associated_device'];
	needAllLabels = false;
	needClientLabel = false;
	locateClient(currentClient.macaddr);
	getUserRoles(connectedAP['group_name']);
}

function locateClient(clientMac) {
	clientNotification = showLongNotification('ca-map-pin', 'Getting Client Location...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/client_location/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/client_location/<client-mac>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		vrfClients.push(response.location);
		if (response['location']) {
			if (response['location']['floor_id'] != vrfFloorId) getFloor(response['location']['floor_id']);
			else {
				drawFloorplan();
			}
		
			if (clientNotification) {
				clientNotification.update({ message: 'Located Client', type: 'success' });
				setTimeout(clientNotification.close, 1000);
			}
		} else {
			if (clientNotification) {
				clientNotification.update({ message: 'Unable to locate Client', type: 'warning' });
				setTimeout(clientNotification.close, 1000);
			}
		}
	
	});
}

function disconnectUser(clientMac) {
	if (!clientMac) clientMac = currentClientMac;
	disconnectingClient = findDeviceInMonitoringForMAC(clientMac);
	
	disconnectNotification = showLongNotification('ca-wifi-off', 'Attempting to disconnect '+ disconnectingClient.name + ' from ' + disconnectingClient.network, 'bottom', 'center', 'info');
		
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/device_management/v1/device/'+ disconnectingClient.associated_device +'/action/disconnect_user',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ "disconnect_user_mac": clientMac }),
		}),
	};
	
	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/device_management/v1/device/<SERIAL>/action/disconnect_user)');
			}
		}
		if (response.state === "SUCCESS") {
			if (disconnectNotification) {
				disconnectNotification.update({ type: 'success', message: disconnectingClient.name + ' was successfully disconnected' });
				setTimeout(disconnectNotification.close, 1000);
			}
		} else if (response.state === "FAILED") {
			if (disconnectNotification) {
				disconnectNotification.update({ type: 'danger', message: disconnectingClient.name + ' failed to be disconnected' });
				setTimeout(disconnectNotification.close, 1000);
			}
		} else if (response.state === "QUEUED") {
			setTimeout(checkDisconnectStatus, 1000, response.task_id);
		}
	});
}

function checkDisconnectStatus(taskID) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/device_management/v1/status/'+taskID,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/device_management/v1/status/<task_id>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
	
		var response = JSON.parse(commandResults.responseBody);
		console.log(response);
		if (response.state === "SUCCESS") {
			if (disconnectNotification) {
				disconnectNotification.update({ type: 'success', message: disconnectingClient.name + ' was successfully disconnected' });
				setTimeout(disconnectNotification.close, 1000);
			}
		} else if (response.state === "FAILED") {
			if (disconnectNotification) {
				disconnectNotification.update({ type: 'danger', message: disconnectingClient.name + ' failed to be disconnected' });
				setTimeout(disconnectNotification.close, 1000);
			}
		} else if (response.state === "QUEUED") {
			setTimeout(checkDisconnectStatus, 1000, taskID);
		} else {
			if (disconnectNotification) {
				disconnectNotification.update({ type: 'danger', message: 'Client Disconnect Failed: '+response.reason });
				setTimeout(disconnectNotification.close, 1000);
			}
		}
	});
}

/*  ----------------------------------
	Wired Troubleshooting functions
---------------------------------- */
function showWiredClient(currentClient) {
	currentClientMac = currentClient['macaddr'];
	
	connectedSwitch = findDeviceInMonitoring(currentClient['associated_device']);
	var uptimeString = '-';
	if (connectedSwitch['uptime'] > 0) {
		var uptime = moment.duration(connectedSwitch['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	client_name_url = encodeURI(currentClient['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + currentClient['macaddr'] + '?ccma=' + currentClient['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
	var nameValue = '<a href="' + clientURL + '" target="_blank"><strong>' + currentClient['name'] + '</strong></a>';
	
	var switchName = encodeURI(currentClient['associated_device_name']);
	var switchURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + currentClient['associated_device'] + '?cssn=' + currentClient['associated_device'] + '&cdcn=' + switchName + '&nc=device';
	var switchValue = '<a href="' + switchURL + '" target="_blank"><strong>' + currentClient['associated_device_name'] + '</strong></a>';
	
	// Site Link to Central
	var siteName = encodeURI(currentClient['site']);
	var siteId = getIDforSite(currentClient['site'])
	var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
	var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + currentClient['site'] + '</strong></a>';
	
	// Group Link to Central
	var groupName = encodeURI(connectedSwitch['group_name']);
	var groupId = connectedSwitch['group_id'];
	var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
	var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + connectedSwitch['group_name'] + '</strong></a>';
	
	
	$('#wiredInfo').empty();
	$('#wiredInfo').append('<li>Name: ' + nameValue + '</li>');
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	
	$('#wiredInfo').append('<li>Device: <strong>' + currentClient['os_type'] + '</strong></li>');
	$('#wiredInfo').append('<li>MAC Address: <strong>' + currentClient['macaddr'] + '</strong></li>');
	if (currentClient['ip_address']) $('#wiredInfo').append('<li>IP Address: <strong>' + currentClient['ip_address'] + '</strong></li>');
	$('#wiredInfo').append('<li>VLAN: <strong>' + currentClient['vlan'] + '</strong></li>');
	if (currentClient['user_role']) $('#wiredInfo').append('<li>User Role: <strong>' + currentClient['user_role'] + '</strong></li>');
	$('#wiredInfo').append('<li>Site: ' + centralURLSiteLink + '</li>');
	
	
	$('#wiredConnection').empty();
	$('#wiredConnection').append('<li>Connected To: ' + switchValue + '</li>');
	$('#wiredConnection').append('<li>Port: <strong>' + currentClient['interface_port'] + '</strong></li>');
	if (currentClient['authentication_type'] !== '') $('#wiredConnection').append('<li>Auth Method: <strong>'+currentClient['authentication_type']+'</li>');
	
	$('#wiredSwitch').empty();
	$('#wiredSwitch').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	$('#wiredSwitch').append('<li>Model: <strong>' + connectedSwitch['model'] + '</strong></li>');
	$('#wiredSwitch').append('<li>Firmware: <strong>' + connectedSwitch['firmware_version'] + '</strong></li>');
	$('#wiredSwitch').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
	if (connectedSwitch['client_count']) $('#wiredSwitch').append('<li>Total Clients: <strong>' + connectedSwitch['client_count'] + '</strong></li>');
	$('#wiredSwitch').append('<li>CPU Utilization: <strong>' + connectedSwitch['cpu_utilization'] + '%</strong></li>');
	if (connectedSwitch['poe_consumption']) $('#wiredSwitch').append('<li>PoE Consumption: <strong>' + connectedSwitch['poe_consumption'] + 'W</strong></li>');
	
	$('#WiredClientModalLink').trigger('click');
}

function wiredPoeBounce(clientMac) {
	if (!clientMac) clientMac = currentClientMac;
	disconnectingClient = findDeviceInMonitoringForMAC(clientMac);
	showNotification('ca-switch-stack', 'Attempting to bounce PoE on interface that '+disconnectingClient.name + ' is connected to...', 'bottom', 'center', 'info');
	poeBounce(disconnectingClient.associated_device, disconnectingClient.interface_port);
}

function wiredInterfaceBounce(clientMac) {
	if (!clientMac) clientMac = currentClientMac;
	disconnectingClient = findDeviceInMonitoringForMAC(clientMac);
	showNotification('ca-switch-stack', 'Attempting to bounce interface that '+disconnectingClient.name + ' is connected to...', 'bottom', 'center', 'info');
	interfaceBounce(disconnectingClient.associated_device, disconnectingClient.interface_port);
}

/*  ----------------------------------
	KMS functions
---------------------------------- */
function displayKeySync() {
	
	// Control the UI pieces
	if ($(document.getElementById('keySyncBtn')).hasClass('btn-outline' )) {
		// Not selected
		refreshSyncedAP();
		
		// Hide other tabs
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
		
		$(document.getElementById('keySyncBtn')).removeClass('btn-outline');
		$(document.getElementById('keySyncBtn')).addClass('btn-fill');
		document.getElementById('syncedAPCard').hidden = false;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
		
		if ($(document.getElementById('userRoleBtn'))) {
			$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
			$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		}
		document.getElementById('userRoleCard').hidden = true;
	} else {
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
	}
}
function showSyncedAPFloorplanBelow() {
	if (document.getElementById('syncedAPFloorplanCard')) document.getElementById('syncedAPFloorplanCard').hidden = false;
}

/*  ----------------------------------
	Events functions
---------------------------------- */
function displayEvents() {
	
	// Control the UI pieces
	if ($(document.getElementById('eventsBtn')).hasClass('btn-outline' )) {
		// Not selected
		getEventsForClient(currentClientMac);
		
		// Hide other tabs
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
		
		$(document.getElementById('eventsBtn')).removeClass('btn-outline');
		$(document.getElementById('eventsBtn')).addClass('btn-fill');
		document.getElementById('eventsCard').hidden = false;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
		
		if ($(document.getElementById('userRoleBtn'))) {
			$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
			$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		}
		document.getElementById('userRoleCard').hidden = true;
	} else {
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
	}
}

function refreshEvents() {
	getEventsForClient(currentClientMac);
}

function getEventsForClient(clientMac) {
	eventsNotification = showNotification('ca-row-table', 'Getting Client Events...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/events?macaddr='+encodeURI(clientMac)+'&sort=-timestamp',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/events)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		
		var response = JSON.parse(commandResults.responseBody);
		
		$('#events-table')
		.DataTable()
		.rows()
		.remove();
		
		var table = $('#events-table').DataTable();
		$.each(response.events, function() {
			var eventEpoch = this['timestamp'];
			if (eventEpoch < 10000000000) eventEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
			eventEpoch = eventEpoch + new Date().getTimezoneOffset() * -1; //for timeZone
			var eventTime = new Date(eventEpoch);
			
			var eventLevel = '<i class="fa-solid fa-circle text-info"></i>';
			if (this['level'] === "positive") eventLevel = '<i class="fa-solid fa-circle text-success"></i>';
			else if (this['level'] === "negative") eventLevel = '<i class="fa-solid fa-circle text-danger"></i>';
			else if (this['level'] === "neutral") eventLevel = '<i class="fa-solid fa-circle text-muted"></i>';
			
			var currentDevice = findDeviceInMonitoring(this['device_serial'])
			// Make AP Name as a link to Central
			var name = encodeURI(currentDevice['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralBaseURL = centralURLs[apiURL];
			if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
			var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + currentDevice['serial'] + '?casn=' + currentDevice['serial'] + '&cdcn=' + name + '&nc=access_point';
			
			table.row.add(['<span title="' + this['timestamp'] + '"</span>'+eventTime.toLocaleString(), this['event_type'], eventLevel, '<a href="' + centralURL + '" target="_blank"><strong>' + currentDevice.name + '</strong></a>', this['description']]);
		});
		$('[data-toggle="tooltip"]').tooltip();
		
		$('#events-table')
		.DataTable()
		.rows()
		.draw();
		$('#events-table').DataTable().columns.adjust().draw();
	
		if (eventsNotification) {
			eventsNotification.update({ message: 'Obtained Events for the last 3hrs', type: 'success' });
			setTimeout(eventsNotification.close, 1000);
		}
	
	});
}


/*  ----------------------------------
	Mobility functions
---------------------------------- */
function displayMobility() {
	
	// Control the UI pieces
	if ($(document.getElementById('mobilityBtn')).hasClass('btn-outline' )) {
		// Not selected
		getMobilityForClient(currentClientMac);
		
		// Hide other tabs
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
		
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-outline');
		$(document.getElementById('mobilityBtn')).addClass('btn-fill');
		document.getElementById('mobilityCard').hidden = false;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
		
		if ($(document.getElementById('userRoleBtn'))) {
			$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
			$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		}
		document.getElementById('userRoleCard').hidden = true;
	} else {
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
	}
}

function refreshMobility() {
	getMobilityForClient(currentClientMac);
}

function getMobilityForClient(clientMac) {
	mobilityNotification = showLongNotification('ca-journey', 'Getting Client Mobility Trail...', 'bottom', 'center', 'info');
	
	var roamingSettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/clients/wireless/' + clientMac + '/mobility_trail',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(roamingSettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/clients/wireless/<client-mac>/mobility_trail)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		$('#mobility-table')
		.DataTable()
		.rows()
		.remove();
		
		var table = $('#mobility-table').DataTable();
		
		$.each(response.trails, function() {
			var eventEpoch = this['ts'];
			if (eventEpoch < 10000000000) eventEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
			eventEpoch = eventEpoch + new Date().getTimezoneOffset() * -1; //for timeZone
			var eventTime = new Date(eventEpoch);
			
			var currentDevice = findDeviceInMonitoring(this['ap_serial'])
			// Make AP Name as a link to Central
			var name = encodeURI(currentDevice['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralBaseURL = centralURLs[apiURL];
			if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
			var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + currentDevice['serial'] + '?casn=' + currentDevice['serial'] + '&cdcn=' + name + '&nc=access_point';
			
			table.row.add(['<span title="' + this['ts'] + '"</span>'+eventTime.toLocaleString(), this['network'], '<a href="' + centralURL + '" target="_blank"><strong>' + currentDevice.name + '</strong></a>', this['channel'], this['rssi'], this['previous_ap_name'] ? this['previous_ap_name']:'-', this['roaming_type'], this['latency']]);
		});
		$('[data-toggle="tooltip"]').tooltip();
		console.log(response.trails);
		
		$('#mobility-table')
		.DataTable()
		.rows()
		.draw();
		$('#mobility-table').DataTable().columns.adjust().draw();
		
		if (mobilityNotification) {
			mobilityNotification.update({ message: 'Obtained Client Mobility Trail', type: 'success' });
			setTimeout(mobilityNotification.close, 1000);
		}
	});
}

/*  ----------------------------------
	Datapath functions
---------------------------------- */
function displayDatapath() {
	
	// Control the UI pieces
	if ($(document.getElementById('datapathBtn')).hasClass('btn-outline' )) {
		$('#datapath-table')
		.DataTable()
		.rows()
		.remove();
		$('#datapath-table')
		.DataTable()
		.rows()
		.draw();
		
		// Not selected
		getDatapathForClient(currentClientMac, connectedAP.serial);
		
		// Hide other tabs
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
		
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-outline');
		$(document.getElementById('datapathBtn')).addClass('btn-fill');
		document.getElementById('datapathCard').hidden = false;
		
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
		
		if ($(document.getElementById('userRoleBtn'))) {
			$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
			$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		}
		document.getElementById('userRoleCard').hidden = true;
	} else {
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
	}
}

function refreshDatapath() {
	getDatapathForClient(currentClientMac);
}

function getDatapathForClient(clientMac, deviceSerial) {
	datapathNotification = showLongNotification('ca-firewall', 'Getting Client Datapath information...', 'bottom', 'center', 'info');
	var currentAP = findDeviceInMonitoring(deviceSerial);
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 45 }, { command_id: 211 }] });
	includePAN = false;
	if (currentAP.firmware_version.includes('10.6') || currentAP.firmware_version.includes('10.7') || currentAP.firmware_version.includes('10.8')) {
		data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 22 }, { command_id: 45 }, { command_id: 211 }] });
		includePAN = true;
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
				//var results = decodeURI(response.output);
				var results = response.output;
				// Find client in monitoring - to get current IP Address for session filtering
				selectedClient = findDeviceInMonitoringForMAC(currentClientMac);
				
				var pos = -1;
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
							//console.log(filtered[2])
							var clientDevice = findDeviceInMonitoringForMAC(filtered[2]);
							//console.log(clientDevice)
							if (clientDevice) ipToPAN[clientDevice.ip_address] = panId;
						}
					});
				}
				
				// split into the two commands (show datapath session, show datapath session dpi)
				var pos = results.indexOf('COMMAND=show datapath session');
				var sessionResults = results.substring(pos, results.indexOf('COMMAND=show datapath session dpi', pos));
				
				pos = results.indexOf('COMMAND=show datapath session dpi');
				var dpiResults = results.substring(pos);
				
				// Turn command results into arrays for iterating through
				var sessionLines = sessionResults.split('\n');
				var rawDpiLines = dpiResults.split('\n');
				var dpiLines = [];
				// filter dpiLines for specific client info only (less to loop through each time)
				$.each(rawDpiLines, function() {
					if (this.includes(selectedClient['ip_address']+' ')) dpiLines.push(this);
				});
				
				// Filter session table for client specific entries
				// and Sort session table into flow pairs...
				sessionPairs = {};
				$.each(sessionLines, function() {
					if (this.includes(selectedClient['ip_address']+' ')) {
						var lineData = this.replace(/  +/g, ' '); // remove the extra padding in the results
						var lineArray = lineData.split(' ');
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
						if (lineArray[0] === selectedClient['ip_address']) sessionKey = lineArray[1] + ':' + lineArray[3] + ':' + lineArray[4]; // key for outbound traffic
						else sessionKey = lineArray[0] + ':' + lineArray[4] + ':' + lineArray[3]; // key for return traffic
						
						if (!sessionPairs[sessionKey]) {
							sessionPairs[sessionKey] = [];
						}
						sessionPairs[sessionKey].push(lineArray); // add session line to pairing
					}
				});
				
				loadDatapathTable()
				
				
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
		sessionLines.sort((a,b) => (b[0] === selectedClient['ip_address']) ? 1 : (a[0] === selectedClient['ip_address'] ? -1 : 0))
		
		// Make a duplicate so we are not modifying the stored data.
		sessionCopy = JSON.parse(JSON.stringify(sessionLines));
		
		$.each(sessionCopy, function(){
			var sessionRow = this;
			// Map protocol to name
			sessionRow[2] = networkProtocols[sessionRow[2]];
			
			// Add session direction arrow (and colour red is Denied)
			if (isPrivateIP(sessionRow[0])) {
				sessionRow.unshift('<span title="Outbound"</span><i class="fa-solid fa-caret-up"></i>');
			} else {
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
				else sessionRow[15] = '-';
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


/*  ----------------------------------
	ClientMatch functions
---------------------------------- */
function displayClientMatch() {
	
	// Control the UI pieces
	if ($(document.getElementById('cmBtn')).hasClass('btn-outline' )) {
		// Not selected
		getClientMatchForClient(currentClientMac);
		
		// Hide other tabs
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
		
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('cmBtn')).removeClass('btn-outline');
		$(document.getElementById('cmBtn')).addClass('btn-fill');
		document.getElementById('cmCard').hidden = false;
		
		if ($(document.getElementById('userRoleBtn'))) {
			$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
			$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		}
		document.getElementById('userRoleCard').hidden = true;
	} else {
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
	}
}

function refreshCM() {
	getClientMatchForClient(currentClientMac);
}

function getClientMatchForClient(clientMac) {
	if (!localStorage.getItem('central_id') || localStorage.getItem('central_id') === 'undefined') {
		Swal.fire({
			title: 'Central ID Needed!',
			text: 'ClientMatch requires you to enter your Central ID in the settings',
			icon: 'warning',
			confirmButtonText: 'Go to Settings',
		}).then(result => {
			if (result.isConfirmed) {
				window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'settings.html';
			}
		});
	} else {
		cmNotification = showLongNotification('ca-crossroad', 'Getting ClientMatch details...', 'bottom', 'center', 'info');
		var notificationClosed = false;
		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/cm-api/station/v1/' + localStorage.getItem('central_id') + '/'+ clientMac,
				access_token: localStorage.getItem('access_token'),
			}),
		};
		
		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/station/v1/<central-id>/<client-mac>)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);
			//console.log(response.result);
			var fullString = response.result;
			var vbrString = fullString.substring(fullString.indexOf('Timestamp \n')+11, fullString.indexOf('Last Redis Write'));
			var vbrArray = vbrString.split('\n');
			
			$('#cm-info-table')
			.DataTable()
			.rows()
			.remove();
			var table = $('#cm-info-table').DataTable();

			$.each(vbrArray, function() {
				if (this.trim() !== '') {
					var vbrPieces = this.split('\t');
					var foundAP = findDeviceInMonitoringForMAC(vbrPieces[1]);
					
					var name = encodeURI(foundAP['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralBaseURL = centralURLs[apiURL];
					if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
					var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + foundAP['serial'] + '?casn=' + foundAP['serial'] + '&cdcn=' + name + '&nc=access_point';
					
					table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + foundAP['name'] + '</strong></a>','-'+vbrPieces[2]+'dB', vbrPieces[3]]);
				}
			});
			$('#cm-info-table')
			.DataTable()
			.rows()
			.draw();
			$('#cm-info-table').DataTable().columns.adjust().draw();
			
			if (cmNotification && !notificationClosed) {
				cmNotification.update({ message: 'Obtained ClientMatch details', type: 'success' });
				notificationClosed = true;
				setTimeout(cmNotification.close, 1000);
			}
		});
		
		var steerSettings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/cm-api/history/v1/' + localStorage.getItem('central_id') + '/'+ clientMac,
				access_token: localStorage.getItem('access_token'),
			}),
		};
		
		$.ajax(steerSettings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/history/v1/<central-id>/<client-mac>)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);
			//console.log(response.result);
			
			$('#cm-history-table')
			.DataTable()
			.rows()
			.remove();
			var table = $('#cm-history-table').DataTable();
			if (response.result.SteerHistory !== 'Not found') {
				// load into table
				if (!this.hasOwnProperty('TimeNow')) {
					// process item
					// Date and time string
					var m = moment(Object.keys(this)[0], 'YYYY-MM-DD hh:mm:ss.SSS Z');
					//Event string
				
					var client_name;
					var client_type = 'Unknown';
					var macaddr = '';
					var type = '';
					var mode = '';
					var status = '';
					var statusResult = '';
					var fromRadio = '';
					var fromAP;
					var toRadio = '';
					var toAP;
					var destRadio = '';
					var destAP = '';
					var roamTime = '';
				
					var steerString = this[Object.keys(this)[0]].toString();
					//console.log(steerString.split(', '))
					//console.log(steerString);
					macaddr = steerString.match(/Mac=(.+?),/)[1];
					client_name = macaddr;
					$.each(clientList, function() {
						var cleanMac = this['macaddr'].replace(/:/g, '');
						if (cleanMac === macaddr) {
							if (this['name']) client_name = this['name'];
							if (this['os_type']) client_type = this['os_type'];
						}
					});
				
					type = titleCase(steerString.match(/Type=(.+?),/)[1]);
					type = type.replace('Band_steer', 'Band Steer');
					type = type.replace('Load_bal', 'Load Balance');
					type = type.replace('HE_steer', 'HE Steer');
					type = type.replace('Voice_roam', 'Voice Roam');
					mode = titleCase(steerString.match(/Mode=(.+?),/)[1]);
				
					status = titleCase(steerString.match(/Status=(.+?),/)[1]);
					status = status.replace('Wrong_dst', 'Wrong Destination');
					status = status.replace('Wrong_src', 'Wrong Source');
					statusResult = titleCase(steerString.match(/11vResult=(.+?),/)[1]);
					var statusString = status;
					if (mode === '11v') var statusString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="11v Result: ' + statusResult + '">' + status + '</span>';
				
					var fromRadio = steerString.match(/FromRadio=\((.+?)\)/)[1].split(', ');
					var fromRadioClean = fromRadio[0].replace(/(..)/g, '$1:').slice(0, -1);
					fromAP = findAPForRadio(fromRadioClean);
					var fromBand = '';
					var fromChannel = '';
					for (var i = 0, len = fromAP.radios.length; i < len; i++) {
						if (fromAP.radios[i]['macaddr'] === fromRadioClean) {
							fromChannel = fromAP.radios[i].channel;
							if (fromAP.radios[i].band == 3) fromBand = '6GHz';
							else if (fromAP.radios[i].band == 0) fromBand = '2.4GHz';
							else fromBand = '5GHz';
						}
					}
					// Make AP Name as a link to Central
					var apName = encodeURI(fromAP['name']);
					var centralURL = centralURLs[centralHostURL] + '/frontend/#/APDETAILV2/' + fromAP['serial'] + '?casn=' + fromAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
					var fromAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(fromRadio[0]) + '<br>Band: ' + fromBand + '<br>Channel: ' + fromChannel + '">' + '<a href="' + centralURL + '" target="_blank"><strong>' + fromAP['name'] + '</strong></a>' + '<br>RSSI: -' + fromRadio[1] + 'dBm</span>';
				
					var toRadio = steerString.match(/ToRadio=\((.+?)\)/)[1].split(', ');
					var toRadioClean = toRadio[0].replace(/(..)/g, '$1:').slice(0, -1);
					toAP = findAPForRadio(toRadioClean);
					
					var toBand = '';
					var toChannel = '';
					for (var i = 0, len = toAP.radios.length; i < len; i++) {
						if (toAP.radios[i]['macaddr'] === toRadioClean) {
							toChannel = toAP.radios[i].channel;
							if (toAP.radios[i].band == 3) toBand = '6GHz';
							else if (toAP.radios[i].band == 0) toBand = '2.4GHz';
							else toBand = '5GHz';
						}
					}
					// Make AP Name as a link to Central
					var apName = encodeURI(toAP['name']);
					var centralURL = centralURLs[centralHostURL] + '/frontend/#/APDETAILV2/' + toAP['serial'] + '?casn=' + toAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
					var toAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(toRadio[0]) + '<br>Band: ' + toBand + '<br>Channel: ' + toChannel + '">' + '<a href="' + centralURL + '" target="_blank"><strong>' + toAP['name'] + '</strong></a>' + '<br>RSSI: -' + toRadio[1] + 'dBm</span>';
				
					var destRadio = steerString.match(/DstRadio=\((.+?)\)/)[1].split(', ');
					var destRadioClean = destRadio[0].replace(/(..)/g, '$1:').slice(0, -1);
					destAP = findAPForRadio(destRadioClean);
					destStatus = titleCase(steerString.match(/DstAcceptable=(.+?),/)[1]);
					var destBand = '';
					var destChannel = '';
					if (destAP && destAP.radios) {
						for (var i = 0, len = destAP.radios.length; i < len; i++) {
							if (destAP.radios[i]['macaddr'] === destRadioClean) {
								destChannel = destAP.radios[i].channel;
								if (destAP.radios[i].band == 4) destBand = '6GHz';
								else if (destAP.radios[i].band == 0) destBand = '2.4GHz';
								else destBand = '5GHz';
							}
						}
					}
				
					var dstName = destRadioClean;
					var destAPString = '-';
					if (destAP) {
						dstName = destAP.name;
						var centralURL = centralURLs[centralHostURL] + '/frontend/#/APDETAILV2/' + destAP['serial'] + '?casn=' + destAP['serial'] + '&cdcn=' + dstName + '&nc=access_point';
						destAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(destRadio[0]) + '<br>Band: ' + destBand + '<br>Channel: ' + destChannel + '<br>' + 'Destination Acceptable: ' + destStatus + '">' + '<a href="' + centralURL + '" target="_blank"><strong>' + dstName + '</strong></a>' + '<br>RSSI: -' + destRadio[1] + 'dBm</span>';
					}
				
					roamTime = steerString.match(/RoamTime=(.*)/)[1];
					roamTime = roamTime.replace('s', '');
				
					// Make link to Central
					var client_name_url = encodeURI(client_name);
					var apiURL = localStorage.getItem('base_url');
					var clientURL = centralURLs[apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddr + '?ccma=' + macaddr + '&cdcn=' + client_name_url + '&nc=client';
				
					// Add row to table
					var table = $('#cm-history-table').DataTable();
					table.row.add([m.format('LLL'), macaddr === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', type, mode, statusString, fromAPString, toAPString, destAPString, roamTime, actionBtns]);
					
				}
			}
			$('#cm-history-table')
			.DataTable()
			.rows()
			.draw();
			$('#cm-history-table').DataTable().columns.adjust().draw();
			
			if (cmNotification && !notificationClosed) {
				cmNotification.update({ message: 'Obtained ClientMatch details', type: 'success' });
				notificationClosed = true;
				setTimeout(cmNotification.close, 1000);
			}
		});
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Role Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getUserRoles(currentGroup) {
	roleNotification = showLongNotification('ca-user-list', 'Getting User Role ACLs...', 'bottom', 'center', 'info');
	userRoles = {};

	// Grab config for Group in Central
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		// pull the roles out of each group config
		getUserRolesFromConfig(response, currentGroup);
	});
}



function getUserRolesFromConfig(config, group) {
	// Find the existing user role
	var startIndex = -1;
	var endIndex = -1;
	var roleName = '';

	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the user role
			if (currentLine.includes(userRolePrefix) && startIndex == -1) {
				// pull out the role name.
				roleName = currentLine.replace(userRolePrefix, '');
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current role
				endIndex = i;
			}

			if (endIndex != -1 && startIndex != -1) {
				// Found the start and end of a user role
				// Build the ACLs from the config.
				// No need to keep the first line - since we already have the roleName, the first line can be rebuilt.
				var fullACLs = config.slice(startIndex + 1, endIndex);

				var finalACLs = [];
				// Remove the "index #" line and "utf8"
				$.each(fullACLs, function() {
					if (!this.includes('utf8') && !this.includes('index ')) {
						var rule = this.trim();
						rule = rule.replace('rule ', '');
						finalACLs.push(rule);
					}
				});

				userRoles[roleName.toLowerCase()] = finalACLs;
				
				// Is the current line another User Role?
				if (currentLine.includes(userRolePrefix)) {
					roleName = currentLine.replace(userRolePrefix, '');
					startIndex = i;
					endIndex = -1;
				} else {
					// Not another user role - rest of the config shouldn't contain any user roles so break out of loop
					break;
				}
			}
		}
	}
	// replace User role reference in UI with button to display the user role details
	var ul = document.getElementById('wirelessInfo');
	var li = ul.getElementsByTagName('li');
	
	var userRoleLi = li[6];
	// now put this value into the li tag by setting the .innerHTML
	userRoleLi.innerHTML = 'User Role: <button class="btn btn-round btn-sm btn-outline btn-warning" onclick="displayUserRole(\''+selectedClient['user_role']+'\')" id="userRoleBtn">'+selectedClient['user_role']+'</button>';
	if (roleNotification) {
		roleNotification.update({ message: 'Obtained User Role ACLs', type: 'success' });
		setTimeout(roleNotification.close, 1000);
	}
}

function displayUserRole(userRole) {
	// Control the UI pieces
	if ($(document.getElementById('userRoleBtn')).hasClass('btn-outline' )) {
		// Not selected
		var userRoleRules = userRoles[userRole.toLowerCase()];
		document.getElementById('userRoleTitle').innerHTML = 'User Role: <strong>'+ userRole + '</strong>';
		
		$('#userRoleRules').empty();
		$.each(userRoleRules, function() {
			var currentRule = this;
			$('#userRoleRules').append('<li>');
			if (currentRule.includes('vlan')) $('#userRoleRules').append('<i class="fa-solid fa-network-wired text-primary"></i> ');
			if (currentRule.includes('captive-portal')) $('#userRoleRules').append('<i class="fa-solid fa-globe text-info"></i> ');
			if (currentRule.includes('bandwidth-limit')) $('#userRoleRules').append('<i class="fa-solid fa-gauge text-warning"></i> ');
			if (currentRule.includes('upstream ')) $('#userRoleRules').append('<i class="fa-solid fa-circle-up"></i> ');
			if (currentRule.includes('downstream ')) $('#userRoleRules').append('<i class="fa-solid fa-circle-down"></i> ');
			if (currentRule.includes('peruser')) $('#userRoleRules').append('<i class="fa-solid fa-user"></i> ');
			
			if (this.includes('permit')) $('#userRoleRules').append('<i class="fa-solid fa-circle text-success"></i> '+ currentRule.replace(' permit', ''));
			else if (this.includes('deny')) $('#userRoleRules').append('<i class="fa-solid fa-circle text-danger"></i> '+ currentRule.replace(' deny', ''));
			else $('#userRoleRules').append(currentRule);
			
			$('#userRoleRules').append('</li>');
		});
		
		// Hide other tabs
		$(document.getElementById('keySyncBtn')).removeClass('btn-fill');
		$(document.getElementById('keySyncBtn')).addClass('btn-outline');
		document.getElementById('syncedAPCard').hidden = true;
		
		$(document.getElementById('eventsBtn')).removeClass('btn-fill');
		$(document.getElementById('eventsBtn')).addClass('btn-outline');
		document.getElementById('eventsCard').hidden = true;
		
		$(document.getElementById('mobilityBtn')).removeClass('btn-fill');
		$(document.getElementById('mobilityBtn')).addClass('btn-outline');
		document.getElementById('mobilityCard').hidden = true;
		
		$(document.getElementById('datapathBtn')).removeClass('btn-fill');
		$(document.getElementById('datapathBtn')).addClass('btn-outline');
		document.getElementById('datapathCard').hidden = true;
		
		$(document.getElementById('cmBtn')).removeClass('btn-fill');
		$(document.getElementById('cmBtn')).addClass('btn-outline');
		document.getElementById('cmCard').hidden = true;
		
		$(document.getElementById('userRoleBtn')).removeClass('btn-outline');
		$(document.getElementById('userRoleBtn')).addClass('btn-fill');
		document.getElementById('userRoleCard').hidden = false;
	} else {
		$(document.getElementById('userRoleBtn')).removeClass('btn-fill');
		$(document.getElementById('userRoleBtn')).addClass('btn-outline');
		document.getElementById('userRoleCard').hidden = true;
	}
}

