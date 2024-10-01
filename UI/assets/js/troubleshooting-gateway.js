/*
Central Automation v1.39
Updated: 1.39
© Aaron Scott (WiFi Downunder) 2023-2024
*/

var selectedDevices = {};
var deviceInfo = {};
var cliCommands = [];

var currentGW;
var selectedGW;
var currentGWSerial;

var cliNotification;
var gwNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageGateway() {
	getDevices();
	getCLICommands();
	$('[data-toggle="tooltip"]').tooltip();
}


function getDevices() {
	selectedClusters = {};

	var fullGWList = getGateways();
	$.each(fullGWList, function() {
		// Add the device for the APs list
		deviceInfo[this['serial']] = this;
	});

	loadDevicesTable(false);
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
			tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Gateway Details" onclick="getGWDetails(\'' +  device['serial'] + '\')"><i class="fa-solid fa-circle-info"></i></a> ';
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot AP" onclick="rebootGW(\'' +  device['serial'] + '\')"><i class="fa-solid fa-power-off"></i></a> ';
		}

		// Add AP to table		
		table.row.add(['<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['group_name'], device['site'], device['ip_address'], device['firmware_version'], device['model'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, tshootBtns]);
	}
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

function rebootGW(currentSerial) {
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
			showNotification('ca-connection', 'Rebooting of GW (' + response['serial'] + ') was successful', 'bottom', 'center', 'success');
		} else {
			if (response['description']) logError(response['description']);
		}
	});
}

function getGWDetails(currentGW) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways/' + currentGW + '?stats_metric=true',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/gateways/<serial>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		showGWDetails(currentGW, response);
	});
}

function showGWDetails(currentGW, gwData) {
	//hideTroubleshooting();
	currentGWSerial = currentGW;
	selectedGW = findDeviceInMonitoring(currentGW);
	var extraData = gwData;
	console.log(extraData)
	// Build status icon
	var memoryUsage = (((extraData['mem_total'] - extraData['mem_free']) / extraData['mem_total']) * 100).toFixed(0).toString();
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	if (extraData['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + extraData['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	
	client_name_url = encodeURI(extraData['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var centralURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + extraData['serial'] + '?csg=' + extraData['serial'] + '&cdcn=' + name + '&nc=gateway';
	var nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + extraData['name'] + '</strong></a>'
	
	$('#gatewayInfo').empty();
	$('#gatewayInfo').append('<li>Name: ' + nameValue + '</li>');
	
	
	var uptimeString = '-';
	if (extraData['uptime'] > 0) {
		var uptime = moment.duration(extraData['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	// Site Link to Central
	var siteName = encodeURI(extraData['site']);
	var siteId = getIDforSite(extraData['site'])
	var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
	var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + extraData['site'] + '</strong></a>';
	
	// Group Link to Central
	var groupName = encodeURI(extraData['group_name']);
	var groupId = extraData['group_id'];
	var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
	var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + extraData['group_name'] + '</strong></a>';
	
	$('#gatewayInfo').append('<li>Health: '+status+'</li>');
	$('#gatewayInfo').append('<li>Serial Number: <strong>' + extraData['serial'] + '</strong></li>');
	$('#gatewayInfo').append('<li>MAC Address: <strong>' + extraData['macaddr'] + '</strong></li>');
	$('#gatewayInfo').append('<li>IP Address: <strong>' + extraData['ip_address'] + '</strong></li>');
	$('#gatewayInfo').append('<li>Model: <strong>' + extraData['model'] + '</strong></li>');
	$('#gatewayInfo').append('<li>Firmware: <strong>' + extraData['firmware_version'] + '</strong></li>');
	$('#gatewayInfo').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	$('#gatewayInfo').append('<li>Last Reboot Reason: <strong>' + extraData['reboot_reason'] + '</strong></li>');
	$('#gatewayInfo').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
	if (extraData['site']) $('#gatewayInfo').append('<li>Site: ' + centralURLSiteLink + '</li>');
	
	
	if (extraData['uplinks'].length > 0) {
		$('#Uplink1').empty();
		$('#Uplink2').empty();
		$('#Uplink3').empty();
		$('#Uplink4').empty();
		document.getElementById('UplinkDiv').hidden = false;
		var uplinkColumn = 1;
		var selectedCol = '';
		$.each(extraData['uplinks'], function() {
			var statusString = '<i class="fa-solid fa-circle text-danger"></i>';
			if (this['status'] == 'Up') {
				statusString = '<i class="fa-solid fa-circle text-success"></i>';
			}
			selectedCol = '#Uplink'+uplinkColumn;
			//$(selectedCol).append('<li><button class="btn btn-round btn-sm btn-outline btn-warning" onclick="displayRadioStats('+this.index+')" id="radioBtn'+this.index+'">Radio Stats</button></li>');
			$(selectedCol).append('<li>Name: <strong>' + this.link_tag + '</strong></li>');
			$(selectedCol).append('<li>Type: <strong>' + this.wan_type + '</strong></li>');
			$(selectedCol).append('<li>Status: <strong>'+statusString+'</strong></li>');
			$(selectedCol).append('<li>VLAN: <strong>'+this.vlan+'</strong></li>');
			$(selectedCol).append('<li>Public IP: <strong>' + this.public_ip + '</strong></li>');
			$(selectedCol).append('<li>Default GW: <strong>' + this.default_gw + '</strong></li>');
			$(selectedCol).append('<li>&nbsp;</li>');
			uplinkColumn++;
		});
	} else {
		document.getElementById('UplinkDiv').hidden = true;
	}
	
	
	$('#cluster-details').empty();
	$('#cluster-details').append('<li>Cluster Name: <strong>' + extraData.gw_cluster_name + '</strong></li>');
	$('#cluster-details').append('<li>&nbsp;</li>');
	$('#cluster-members').empty();
	if (extraData['peers'].length > 0) {
		$('#cluster-members').append('<li><strong>Additional Cluster Members</strong></li>');
		document.getElementById('clusterDiv').hidden = false;
		$.each(extraData['peers'], function() {
			var gw = findDeviceInMonitoring(this.serial);
			
			var memoryUsage = (((gw['mem_total'] - gw['mem_free']) / gw['mem_total']) * 100).toFixed(0).toString();
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (gw['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + gw['cpu_utilization'] + '%<br>Memory Usage:' + gw + '%"><i class="fa-solid fa-circle text-success"></i></span>';
			}
			
			client_name_url = encodeURI(this['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralBaseURL = centralURLs[apiURL];
			if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
			var centralURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + this['serial'] + '?csg=' + this['serial'] + '&cdcn=' + name + '&nc=gateway';
			var nameValue = '<a href="' + centralURL + '" target="_blank"><strong>' + this['name'] + '</strong></a>'
			
			$('#cluster-members').append('<li>Name: <strong>' + nameValue + '</strong></li>');
			$('#cluster-members').append('<li>Status: <strong>'+status+'</strong></li>');
			$('#cluster-members').append('<li>&nbsp;</li>');
		});
	}
	/*} else {
		document.getElementById('clusterDiv').hidden = true;
	}*/
	
	$('#gatewayFW').empty();
	$('#gatewayFW').append('<li>Primary: <strong>'+extraData['firmware_version']+'</li>');
	$('#gatewayFW').append('<li>Backup: <strong>'+extraData['firmware_backup_version']+'</li>');
	
	hideTroubleshooting();
	$('#GWModalLink').trigger('click');
	
	$('[data-toggle="tooltip"]').tooltip();
}


/*  ----------------------------------
	GW Troubleshooting functions
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
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/commands?device_type=CONTROLLER',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/commands?device_type=CONTROLLER)');
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
function hideTroubleshooting() {
	$(document.getElementById('commandsBtn')).removeClass('btn-fill');
	$(document.getElementById('commandsBtn')).addClass('btn-outline');
	document.getElementById('commandsCard').hidden = true;
	/*
	$(document.getElementById('aaaBtn')).removeClass('btn-fill');
	$(document.getElementById('aaaBtn')).addClass('btn-outline');
	document.getElementById('aaaCard').hidden = true;
	
	$(document.getElementById('neighboursBtn')).removeClass('btn-fill');
	$(document.getElementById('neighboursBtn')).addClass('btn-outline');
	document.getElementById('neighboursCard').hidden = true;
	
	$(document.getElementById('datapathBtn')).removeClass('btn-fill');
	$(document.getElementById('datapathBtn')).addClass('btn-outline');
	document.getElementById('datapathCard').hidden = true;
	
	// Hide other tabs
	var radioBtns = $('button[id^="radioBtn"]')
	$.each(radioBtns, function() {
		$(document.getElementById(this.id)).removeClass('btn-fill');
		$(document.getElementById(this.id)).addClass('btn-outline');
	});
	document.getElementById('radioCard').hidden = true;
	*/
	// Clear old data
	document.getElementById('cliText').value = '';
	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	CLI Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayCLI() {
	
	// Control the UI pieces
	if ($(document.getElementById('commandsBtn')).hasClass('btn-outline' )) {
		// Not selected
		document.getElementById('cliText').value = '';
		
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
	cliNotification = showLongNotification('ca-tshoot-gateway', 'Running CLI command...', 'bottom', 'center', 'info');
	var selection = document.getElementById('cliselector').value;
	
	if (selection) {
		var data = JSON.stringify({ device_type: 'CONTROLLER', commands: [{ command_id: parseInt(selection) }] });
	
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + currentGWSerial,
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
