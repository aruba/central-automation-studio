/*
Central Automation v1.7
Updated: 1.38.3
© Aaron Scott (WiFi Downunder) 2023
*/

var switchList;
var deviceInfo = {};
var switchPorts = {};
var portNotification;
var portAccessNotification;
var commandNotification;

var currentSwitch;
var selectedSwitch;
var currentSwitchSerial;
var currentAPIEndpoint;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageSwitch() {
	switchList = getSwitches();
	loadDevicesTable();
	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadDevicesTable() {
	$('#device-table')
		.DataTable()
		.rows()
		.remove();

	deviceInfo = {};
	var table = $('#device-table').DataTable();
	$.each(switchList, function() {
		var device = this;
		deviceInfo[device.serial] = this;
		
		// Build Status dot
		var memTotal = device['mem_total'];
		var memoryUsage = '-';
		if (memTotal != 0) memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString() + '%';
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage: ' + memoryUsage + '"><i class="fa-solid fa-circle text-success"></i></span>';
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
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Switch Details" onclick="showSwitchDetails(\'' + device.serial + '\')"><i class="fa-solid fa-circle-info"></i></a> ';
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot Switch" onclick="rebootSwitch(\'' +  device['serial'] + '\')"><i class="fa-solid fa-power-off"></i></a> ';
		}

		// Add Switch to table
		table.row.add(['<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['ip_address'], device['serial'], device['macaddr'], device['group_name'], device['site'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, tshootBtns]);
	});
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

function rebootSwitch(currentSerial) {
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
			showNotification('ca-connection', 'Rebooting of Switch (' + response['serial'] + ') was successful', 'bottom', 'center', 'success');
		} else {
			if (response['description']) logError(response['description']);
		}
	});
}

/*  ----------------------------------
	Troubleshooting functions
---------------------------------- */
function hideTroubleshooting() {
	$(document.getElementById('portsBtn')).removeClass('btn-fill');
	$(document.getElementById('portsBtn')).addClass('btn-outline');
	document.getElementById('portsCard').hidden = true;
	
	$(document.getElementById('portAccessBtn')).removeClass('btn-fill');
	$(document.getElementById('portAccessBtn')).addClass('btn-outline');
	document.getElementById('portAccessCard').hidden = true;

	// Clear old table data
	$('#port-access-table').DataTable().rows().remove();
	$('#port-access-table').DataTable().rows().draw();
	
	document.getElementById('portAccessText').innerHTML = '';
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Switch Port Page Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchPorts(serial) {
	// Get switch ports
	portNotification = showNotification('ca-switch-stack', 'Obtaining Switch Ports...', 'bottom', 'center', 'info');
	
	var currentSwitch = findDeviceInMonitoring(serial);
	var searchVariable = serial;
	
	// Assume AOS-S standalone switch
	var url = '/monitoring/v1/switches/';
	if (getSwitchType(serial) === 'AOS-S' && currentSwitch.stack_id) {
		url = '/monitoring/v1/switch_stacks/';
		searchVariable = currentSwitch.stack_id;
	}
	
	// Check if switch is a CX switch
	if (getSwitchType(serial) === 'AOS-CX' && !currentSwitch.stack_id) url = '/monitoring/v1/cx_switches/';
	else if (getSwitchType(serial) === 'AOS-CX' && currentSwitch.stack_id) {
		url = '/monitoring/v1/cx_switch_stacks/';
		searchVariable = currentSwitch.stack_id;
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + url + searchVariable + '/ports',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches/<SERIAL>/ports)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);
		if (response.ports) switchPorts[serial] = response.ports;
		else {
			var tempArray = [];
			$.each(response.member_port_detail, function() {
				tempArray = tempArray.concat(this.ports);
			})
			switchPorts[serial] = tempArray;
		}
		
		debugPorts(serial);
		
		if (portNotification) {
			portNotification.update({ message: 'SwitchPorts obtained', type: 'success' });
			setTimeout(portNotification.close, 1000);
		}
	});

}

function showSwitchDetails(deviceSerial) {
	
	currentSwitchSerial = deviceSerial;
	selectedSwitch = deviceInfo[currentSwitchSerial];
	var memoryUsage = (((selectedSwitch['mem_total'] - selectedSwitch['mem_free']) / selectedSwitch['mem_total']) * 100).toFixed(0).toString();
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	if (selectedSwitch['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + selectedSwitch['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	
	client_name_url = encodeURI(selectedSwitch['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var centralURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + selectedSwitch['serial'] + '?cssn=' + selectedSwitch['serial'] + '&cdcn=' + name + '&nc=device';
	var nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + selectedSwitch['name'] + '</strong></a>';
	
	// Site Link to Central
	var siteName = encodeURI(selectedSwitch['site']);
	var siteId = getIDforSite(selectedSwitch['site'])
	var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
	var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + selectedSwitch['site'] + '</strong></a>';
	
	// Group Link to Central
	var groupName = encodeURI(selectedSwitch['group_name']);
	var groupId = selectedSwitch['group_id'];
	var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
	var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + selectedSwitch['group_name'] + '</strong></a>';
	
	// Build Uptime String
	var uptimeString = '-';
	if (selectedSwitch['uptime'] > 0) {
		var uptime = moment.duration(selectedSwitch['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	$('#generalDetails').empty();
	$('#generalDetails').append('<li>Name: <strong>' + nameValue + '</strong></li>');
	$('#generalDetails').append('<li>Health: '+status+'</li>');
	$('#generalDetails').append('<li>Serial Number: <strong>' + selectedSwitch['serial'] + '</strong></li>');
	$('#generalDetails').append('<li>MAC Address: <strong>' + selectedSwitch['macaddr'] + '</strong></li>');
	$('#generalDetails').append('<li>IP Address: <strong>' + selectedSwitch['ip_address'] + '</strong></li>');
	$('#generalDetails').append('<li>Model: <strong>' + selectedSwitch['model'] + '</strong></li>');
	$('#generalDetails').append('<li>Firmware: <strong>' + selectedSwitch['firmware_version'] + '</strong></li>');
	$('#generalDetails').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	if (selectedSwitch['group_name']) $('#generalDetails').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
	if (selectedSwitch['site']) $('#generalDetails').append('<li>Site: ' + centralURLSiteLink + '</li>');
	
	var uplinkPorts = [];
	if (selectedSwitch['uplink_ports']) {
		$.each(selectedSwitch['uplink_ports'], function() {
			uplinkPorts.push(this.port);
		});
	}
	
	$('#additionalDetails').empty();
	$('#additionalDetails').append('<li>Clients: <strong>' + selectedSwitch['client_count'] + '</strong></li>');
	if (uplinkPorts.length > 0) $('#additionalDetails').append('<li>Uplink Ports: <strong>' + uplinkPorts.join(', ') + '</strong></li>');
	$('#additionalDetails').append('<li>&nbsp;</li>');
	if (selectedSwitch['poe_consumption']) $('#additionalDetails').append('<li>PoE Consumption: <strong>' + selectedSwitch['poe_consumption'] + 'W</strong></li>');
	if (selectedSwitch['temperature'] !== 'None') $('#additionalDetails').append('<li>Temperature: <strong>' + selectedSwitch['temperature'] + '°C</strong></li>');
	$('#additionalDetails').append('<li>Fan Speed: <strong>' + selectedSwitch['fan_speed'] + '</strong></li>');
	
	hideTroubleshooting();
	document.getElementById('portAccessBtn').hidden = true;
	if (selectedSwitch['switch_type'] === 'AOS-CX') getSupportedCommands(currentSwitchSerial);
	else document.getElementById('portAccessBtn').hidden = false;
	getSwitchPorts(currentSwitchSerial);
	
	
	$('#SwitchModalLink').trigger('click');
}

function getSupportedCommands(currentSerial) {
	commandNotification = showNotification('ca-tshoot-switch', 'Checking supported commands...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/cxcommands?Serial=' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/cxcommands)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
	
		var response = JSON.parse(commandResults.responseBody);
		if (response.commands) {
			if (response.commands.includes("show port-access clients")) document.getElementById('portAccessBtn').hidden = false;
		} else {
			document.getElementById('portAccessBtn').hidden = true;
		}
		
		if (commandNotification) {
			commandNotification.update({ message: 'Supported commands obtained', type: 'success' });
			setTimeout(commandNotification.close, 1000);
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Port Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function displayPorts() {
	
	// Control the UI pieces
	if ($(document.getElementById('portsBtn')).hasClass('btn-outline' )) {
		// Not selected
		debugPorts(currentSwitchSerial);
		
		$(document.getElementById('portsBtn')).removeClass('btn-outline');
		$(document.getElementById('portsBtn')).addClass('btn-fill');
		document.getElementById('portsCard').hidden = false;
		
		$(document.getElementById('portAccessBtn')).removeClass('btn-fill');
		$(document.getElementById('portAccessBtn')).addClass('btn-outline');
		document.getElementById('portAccessCard').hidden = true;
		
	} else {
		$(document.getElementById('portsBtn')).removeClass('btn-fill');
		$(document.getElementById('portsBtn')).addClass('btn-outline');
		document.getElementById('portsCard').hidden = true;
	}
}

function refreshPorts() {
	getSwitchPorts(currentSwitchSerial);
}

function debugPorts(currentSerial) {
	$('#port-table')
	.DataTable()
	.rows()
	.remove();
	
	selectedSwitch = deviceInfo[currentSwitchSerial];
	var ports = switchPorts[currentSerial];
	var table = $('#port-table').DataTable();
	$.each(ports, function() {
		var port = this;
		// Build Status dot
		var status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="Down Reason: ' + port['intf_state_down_reason'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
		if (port['status'] == 'Up') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}
	
		// Build troubleshooting links
		var tshootBtns = '';
		if (port['status'] == 'Up') {
			var tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="poeBounce(\'' + currentSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="interfaceBounce(\'' + currentSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-ethernet"></i></a>';
			if (selectedSwitch['switch_type'] === 'AOS-S') {
				tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Cable Test" onclick="cableTest(\'' + currentSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-microscope"></i></a>';
			}
		}
	
		var vlanString = port['vlan'];
		if (port['allowed_vlan'].length > 0) {
			var sortedVLANs = port['allowed_vlan'];
			sortedVLANs.sort();
			vlanString = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="Allowed VLANs: ' + sortedVLANs.join(', ') + '">' + port['vlan'] + '</span>';
		}
	
		// Add port to table
		var portNumberString = port['port'].toString();
		portNumberString = portNumberString.padStart(3, '0');
		var poeString = port['power_consumption']+'W'
		if (port['power_consumption'] === '-') poeString = '-'
		table.row.add(['<strong><span style="display:none;">' + portNumberString + ' </span>' + port['port_number'] + '</strong>', status, port['status'] ? port['status'] : 'down', port['mode'], vlanString, port['speed'], port['duplex_mode'], poeString, port['phy_type'], tshootBtns]);
	});
	$('#port-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Port Access Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayPortAccess() {
	
	// Control the UI pieces
	if ($(document.getElementById('portAccessBtn')).hasClass('btn-outline' )) {
		// Not selected
		debugPortAccess(currentSwitchSerial);
		
		$(document.getElementById('portsBtn')).removeClass('btn-fill');
		$(document.getElementById('portsBtn')).addClass('btn-outline');
		document.getElementById('portsCard').hidden = true;
		
		$(document.getElementById('portAccessBtn')).removeClass('btn-outline');
		$(document.getElementById('portAccessBtn')).addClass('btn-fill');
		document.getElementById('portAccessCard').hidden = false;
	} else {
		$(document.getElementById('portAccessBtn')).removeClass('btn-fill');
		$(document.getElementById('portAccessBtn')).addClass('btn-outline');
		document.getElementById('portAccessCard').hidden = true;
	}
}

function refreshPortAccess() {
	debugPortAccess(currentSwitchSerial);
}

function debugPortAccess(deviceSerial) {
	$('#port-access-table')
	.DataTable()
	.rows()
	.remove();
	
	$('#port-access-table')
	.DataTable()
	.rows()
	.draw();
	
	portAccessNotification = showLongNotification('ca-switch-stack', 'Getting Port Access information...', 'bottom', 'center', 'info');
	selectedSwitch = deviceInfo[deviceSerial];
	var data = JSON.stringify({ "commands": [ "show port-access clients" ] });
	var apiEndpoint = '/troubleshooting/v1/cxdevices/'
	if (selectedSwitch['switch_type'] === 'AOS-S') {
		data = JSON.stringify({ device_type: 'SWITCH', commands: [{ command_id: 1089 }] });
		apiEndpoint = '/troubleshooting/v1/devices/'
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + apiEndpoint + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' ('+apiEndpoint+'<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkDebugPortAccess, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkDebugPortAccess(session_id, deviceSerial) {
	portAccessNotification.update({ message: 'Waiting for response from Switch...', type: 'info' });
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
				setTimeout(checkDebugPortAccess, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				
				//var results = decodeURI(response.output);
				// Grab just the port access client table
				var results = response.output;
				
				var table = $('#port-access-table').DataTable();
				var resultsArray = results.split('\n');
				
				if (selectedSwitch['switch_type'] === 'AOS-S') {
					var portAccessStart = resultsArray.lastIndexOf('  ----- ------------- ----------------- --------------- ----------------- ----- -------------------------------------------------------');
					var portAccessEnd = resultsArray.indexOf(' ', portAccessStart);
					var portAccessData = resultsArray.slice(portAccessStart+1, portAccessEnd)
					
					$.each(portAccessData, function() {
						// cut up line for data
						var portNumber = this.substring(2, 6).trim();
						var clientName = this.substring(8, 20).trim();
						var macAddress = this.substring(22, 38).trim();
						var ipAddress = this.substring(40, 54).trim();
						var userRole = this.substring(56, 74).trim();
						var type = this.substring(74, 78).trim();
						if (type === 'MAC') type = 'mac-auth'; // for consistency between AOS-S and CX
						var vlan = this.substring(80).trim();
						
						var foundClient = findDeviceInMonitoringForMAC(cleanMACAddress(macAddress)) 
						
						// Padd the port number for sorting
						var portNumberString = portNumber;
						portNumberString = portNumberString.padStart(3, '0');
						
						// create link to Central
						var nameValue;
						if (foundClient) {
							// Make link to Central
							var client_name_url = encodeURI(foundClient.name);
							var apiURL = localStorage.getItem('base_url');
							var centralBaseURL = centralURLs[apiURL];
							if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
							if (deviceType === 'CLIENT') {
								var centralURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + foundClient['macaddr'] + '?ccma=' + foundClient['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'IAP') {
								var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + foundClient['serial'] + '?casn=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=access_point';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'SWITCH') {
								var centralURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + foundClient['serial'] + '?casn=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=device';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'CONTROLLER') {
								var centralURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + foundClient['serial'] + '?csg=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=gateway';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							}
						}
						
						// Add data to table
						var tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="poeBounce(\'' + deviceSerial + "', '" + portNumber + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
						tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="interfaceBounce(\'' + deviceSerial + "', '" + portNumber + '\')"><i class="fa-solid fa-ethernet"></i></a>';
						tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Cable Test" onclick="cableTest(\'' + deviceSerial + "', '" + portNumber + '\')"><i class="fa-solid fa-microscope"></i></a>';
						
						table.row.add(['<strong><span style="display:none;">' + portNumberString + ' </span>' + portNumber + '</strong>', nameValue ? nameValue:'-', cleanMACAddress(macAddress).toLowerCase(), foundClient ? foundClient.ip_address:'-', type, '-', '-', userRole, vlan, tshootBtns]);
					});
				} else {
					
					// CX Switch processing
					var portAccessHeaderStart = resultsArray.indexOf('--------------------------------------------------------------------------------------------------------------');
					var portAccessHeader = resultsArray.slice(portAccessHeaderStart+1, portAccessHeaderStart+2)[0]
					var clientStart = portAccessHeader.indexOf('Client-Name');
					var ipStart = portAccessHeader.indexOf('IPv4-Address');
					var roleStart = portAccessHeader.indexOf('User-Role');
					var vlanStart = portAccessHeader.indexOf('VLAN');
					var flagsStart = portAccessHeader.indexOf('Flags');
					
					var portAccessStart = resultsArray.lastIndexOf('--------------------------------------------------------------------------------------------------------------');
					var portAccessEnd = resultsArray.indexOf('', portAccessStart);
					var portAccessData = resultsArray.slice(portAccessStart+1, portAccessEnd)
					
					$.each(portAccessData, function() {
						// split the row into the pieces
						var currentRow = this.toString();
						var portNumberRaw = currentRow.substring(0, clientStart).trim();
						var clientName = currentRow.substring(clientStart, ipStart).trim();
						var ipAddress = currentRow.substring(ipStart, roleStart).trim();
						var userRole = currentRow.substring(roleStart, vlanStart).trim();
						var vlan = currentRow.substring(vlanStart, flagsStart).trim();
						var flags = currentRow.substring(flagsStart).trim();
						var foundClient = findDeviceInMonitoringForName(clientName);
						
						
						var portNumberString;
						var parts = portNumberRaw.split("/");
						var portNumber = parts[parts.length - 1];
						portNumberString = portNumber.padStart(2, '0');
						parts[parts.length - 1] = portNumberString;
						portNumberString = parts.join('/');
						
						var nameValue = clientName;
						var ipAddressValue = ipAddress;
						var macAddressValue = '-';
						if (foundClient) {
							// Make link to Central
							var client_name_url = encodeURI(foundClient.name);
							var apiURL = localStorage.getItem('base_url');
							var centralBaseURL = centralURLs[apiURL];
							if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
							if (deviceType === 'CLIENT') {
								var centralURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + foundClient['macaddr'] + '?ccma=' + foundClient['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'IAP') {
								var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + foundClient['serial'] + '?casn=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=access_point';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'SWITCH') {
								var centralURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + foundClient['serial'] + '?casn=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=device';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							} else if (deviceType === 'CONTROLLER') {
								var centralURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + foundClient['serial'] + '?csg=' + foundClient['serial'] + '&cdcn=' + client_name_url + '&nc=gateway';
								nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + foundClient['name'] + '</strong></a>'
							}
							
							macAddressValue = cleanMACAddress(foundClient['macaddr']).toLowerCase();
							ipAddressValue = foundClient.ip_address?foundClient.ip_address:'-';
						}
						
						var flagPieces = flags.split('|');
						
						var methodValue = '-'
						if (flagPieces[0].includes('1x')) methodValue = '802.1X';
						else if (flagPieces[0].includes('ma')) methodValue = 'MAC-Auth';
						else if (flagPieces[0].includes('ps')) methodValue = 'Port-Security';
						else if (flagPieces[0].includes('dp')) methodValue = 'Device-Profile';
						
						var modeValue = '-'
						if (flagPieces[1].includes('c')) modeValue = 'Client-Mode';
						else if (flagPieces[1].includes('d')) modeValue = 'Device-Mode';
						else if (flagPieces[1].includes('m')) modeValue = 'Multi-Domain';
						
						var statusValue = '-'
						if (flagPieces[3].includes('s')) statusValue = 'Success';
						else if (flagPieces[3].includes('f')) statusValue = 'Failed';
						else if (flagPieces[3].includes('p')) statusValue = 'In-Progress';
						else if (flagPieces[3].includes('d')) statusValue = 'Role-Download-Failed';
						
						
						// Add data to table
						var tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="poeBounce(\'' + deviceSerial + "', '" + portNumberRaw + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
						tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="interfaceBounce(\'' + deviceSerial + "', '" + portNumberRaw + '\')"><i class="fa-solid fa-ethernet"></i></a>';
						
						table.row.add(['<strong><span style="display:none;">' + portNumberString + ' </span>' + portNumberRaw + '</strong>', nameValue, macAddressValue, ipAddressValue, methodValue, modeValue, statusValue, userRole, vlan, tshootBtns]);
						
					});
				}
				
				$('#port-access-table')
					.DataTable()
					.rows()
					.draw();
				table.columns.adjust().draw();
				
				document.getElementById('portAccessText').innerHTML = results;
				if (portAccessNotification) {
					portAccessNotification.update({ message: 'Obtained Port Access Details', type: 'success' });
					setTimeout(portAccessNotification.close, 1000);
				}
			} else {
				if (portAccessNotification) {
					portAccessNotification.update({ message: 'Unable to obtain Port Access Details', type: 'danger' });
					setTimeout(portAccessNotification.close, 3000);
				}
			}
		}
	});
}

