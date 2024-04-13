/*
Central Automation v1.33
Updated: 
© Aaron Scott (WiFi Downunder) 2023
*/

var osType = [];

var clientNotification;
var eventsNotification;
var disconnectNotification;
var disconnectingClient;

var currentClientMac;
var needAllLabels = false;
var needClientLabel = false;
var associateAP;

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
	table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', clientIcon, status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan, tshootBtns]);

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
	$('#wirelessInfo').empty();
	$('#wirelessInfo').append('<li>Name: <strong>' + currentClient['name'] + '</strong></li>');
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
	
	var connectedAP = findDeviceInMonitoring(currentClient['associated_device']);
	var connectedRadio;
	$.each(connectedAP.radios, function() {
		var currentChannel = this['channel'].replace(/\D/g,'');
		if (currentClient['channel'].includes(currentChannel)) connectedRadio = this;
	});
	var uptimeString = '-';
	if (connectedAP['uptime'] > 0) {
		var uptime = moment.duration(connectedAP['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	/*
	console.log(currentClient)
	console.log(connectedAP)
	console.log(connectedRadio)
	*/
	
	$('#wirelessInfo').append('<li>Health: '+status+'</li>');
	$('#wirelessInfo').append('<li>Device: <strong>' + currentClient['os_type'] + '</strong></li>');
	$('#wirelessInfo').append('<li>MAC Address: <strong>' + currentClient['macaddr'] + '</strong></li>');
	$('#wirelessInfo').append('<li>IP Address: <strong>' + currentClient['ip_address'] + '</strong></li>');
	$('#wirelessInfo').append('<li>VLAN: <strong>' + currentClient['vlan'] + '</strong></li>');
	$('#wirelessInfo').append('<li>User Role: <strong>' + currentClient['user_role'] + '</strong></li>');
	$('#wirelessInfo').append('<li>Site: <strong>' + currentClient['site'] + '</strong></li>');
	
	
	$('#wirelessConnection').empty();
	$('#wirelessConnection').append('<li>Associated To: <strong>' + currentClient['associated_device_name'] + '</strong></li>');
	if (currentClient['failure_stage'] !== '') $('#wirelessConnection').append('<li>Failure Reason: '+currentClient['failure_stage']+'</li>');
	$('#wirelessConnection').append('<li>SSID: <strong>'+currentClient['network']+'</li>');
	$('#wirelessConnection').append('<li>Auth Method: <strong>'+currentClient['authentication_type']+'</li>');
	$('#wirelessConnection').append('<li>Encryption Method: <strong>'+currentClient['encryption_method'].replace('_', '-')+'</li>');
	$('#wirelessConnection').append('<li>Band: <strong>' + currentClient['band'] + 'GHz</strong></li>');
	$('#wirelessConnection').append('<li>Channel: <strong>' + currentClient['channel'] + '</strong></li>');
	$('#wirelessConnection').append('<li>RSSI: <strong>' + currentClient['signal_db'] + 'dB</strong></li>');
	$('#wirelessConnection').append('<li>SNR: <strong>' + currentClient['snr'] + '</strong></li>');
	$('#wirelessConnection').append('<li>Speed: <strong>' + currentClient['speed'] + 'Mbps</strong></li>');
	$('#wirelessConnection').append('<li>Capabilities: <strong>' + currentClient['connection'] ? currentClient['connection']:'-' + '</strong></li>');
	
	$('#wirelessAP').empty();
	$('#wirelessAP').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	$('#wirelessAP').append('<li>Config Group: <strong>' + connectedAP['group_name'] + '</strong></li>');
	$('#wirelessAP').append('<li>Total Clients: <strong>' + connectedAP['client_count'] + '</strong></li>');
	$('#wirelessAP').append('<li>CPU Utilization: <strong>' + connectedAP['cpu_utilization'] + '%</strong></li>');
	var memoryUsage = (((connectedAP['mem_total'] - connectedAP['mem_free']) / connectedAP['mem_total']) * 100).toFixed(0).toString();
	$('#wirelessAP').append('<li>Memory Utilization: <strong>' + memoryUsage + '%</strong></li>');
	if (connectedRadio) $('#wirelessAP').append('<li>Channel Utilization ('+ currentClient['band'] +'GHz): <strong>' + connectedRadio['utilization'] + '%</strong></li>');
	
	if (document.getElementById('syncedAPFloorplanCard')) document.getElementById('syncedAPFloorplanCard').hidden = true;
	if (document.getElementById('syncedAPCard')) document.getElementById('syncedAPCard').hidden = true;

	$('#WirelessClientModalLink').trigger('click');
	
	associatedAP = currentClient['associated_device'];
	needAllLabels = false;
	needClientLabel = false;
	locateClient(currentClient.macaddr);
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
		if (response['location']['floor_id'] != vrfFloorId) getFloor(response['location']['floor_id']);
		else {
			drawFloorplan();
		}
	
		if (clientNotification) {
			clientNotification.update({ message: 'Located Client', type: 'success' });
			setTimeout(clientNotification.close, 1000);
		}
	
	});
}

function disconnectUser(clientMac) {
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
	$('#wiredInfo').empty();
	$('#wiredInfo').append('<li>Name: <strong>' + currentClient['name'] + '</strong></li>');
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	
	$('#wiredInfo').append('<li>Device: <strong>' + currentClient['os_type'] + '</strong></li>');
	$('#wiredInfo').append('<li>MAC Address: <strong>' + currentClient['macaddr'] + '</strong></li>');
	if (currentClient['ip_address']) $('#wiredInfo').append('<li>IP Address: <strong>' + currentClient['ip_address'] + '</strong></li>');
	$('#wiredInfo').append('<li>VLAN: <strong>' + currentClient['vlan'] + '</strong></li>');
	if (currentClient['user_role']) $('#wiredInfo').append('<li>User Role: <strong>' + currentClient['user_role'] + '</strong></li>');
	$('#wiredInfo').append('<li>Site: <strong>' + currentClient['site'] + '</strong></li>');
	
	
	$('#wiredConnection').empty();
	$('#wiredConnection').append('<li>Connected To: <strong>' + currentClient['associated_device_name'] + '</strong></li>');
	$('#wiredConnection').append('<li>Port: <strong>' + currentClient['interface_port'] + '</strong></li>');
	if (currentClient['authentication_type'] !== '') $('#wiredConnection').append('<li>Auth Method: <strong>'+currentClient['authentication_type']+'</li>');
	
	$('#WiredClientModalLink').trigger('click');
}

function wiredPoeBounce(clientMac) {
	disconnectingClient = findDeviceInMonitoringForMAC(clientMac);
	showNotification('ca-switch-stack', 'Attempting to bounce PoE on interface that '+disconnectingClient.name + ' is connected to...', 'bottom', 'center', 'info');
	poeBounce(disconnectingClient.associated_device, disconnectingClient.interface_port);
}

function wiredInterfaceBounce(clientMac) {
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
	eventsNotification = showNotification('ca-check-list', 'Getting Client Events...', 'bottom', 'center', 'info');
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
		
		console.log(response)
	
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
	mobilityNotification = showLongNotification('ca-check-list', 'Getting Client Mobility Trail...', 'bottom', 'center', 'info');
	
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



