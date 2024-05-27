/*
Central Automation v1.7
Updated: 1.24.1
© Aaron Scott (WiFi Downunder) 2023-2024
*/

var selectedClusters = {};
var selectedDevices = {};
var clusterInfo = {};
var deviceInfo = {};
var aaaInfo = {};
var apBSSIDs = {};

var currentAP;
var neighbourTableData = [];

var bssidNotification;
var troubleshootingNotification;

var ipToUsername = {};
var sessionPairs = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAP() {
	getDevices();
	refreshBSSIDs();
	$('[data-toggle="tooltip"]').tooltip();
}

function loadCurrentPageClient() {
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
		//console.log(device);
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
			tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="debugSystemStatus(\'' + device.serial + '\')">System</button> ';

			$.each(device.radios, function() {
				if (this.status == 'Up') tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="debugRadioStats(\'' + device.serial + "','" + this.index + '\')">' + this.radio_name.replace('Radio ', '') + '</button> ';
			});

			tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="debugAAA(\'' + device.serial + '\')">AAA</button> ';
			//tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="debugTech(\'' + device.serial + '\')">Tech-Support</button> ';
			tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="debugNeighbours(\'' + device.serial + '\')">Neighbours</button> ';
			tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="getDatapathForAP(\'' + device.serial + '\')">Datapath</button> ';
		}

		// Add AP to table		
		table.row.add(['<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['group_name'], device['site'], device['firmware_version'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, tshootBtns]);
	}
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Radio-stats Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function debugRadioStats(deviceSerial, radioBand) {
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
		//console.log(response);
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
				else radioString = '6GHz';
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
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	System Status Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function debugSystemStatus(deviceSerial) {
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
				$('#SystemStatusModalLink').trigger('click');
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
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

function debugAAA(deviceSerial) {
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
function refreshDatapath() {
	getDatapathForAP(currentAP.serial);
}

function getDatapathForAP(deviceSerial) {
	datapathNotification = showLongNotification('ca-firewall', 'Getting AP Datapath information...', 'bottom', 'center', 'info');
	currentAP = findDeviceInMonitoring(deviceSerial);
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 45 }, { command_id: 211 }] });
	
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
								
				// split into the two commands (show datapath session, show datapath session dpi)
				var pos = results.indexOf('COMMAND=show datapath session');
				var sessionResults = results.substring(pos, results.indexOf('COMMAND=show datapath session dpi', pos));
				pos = results.indexOf('COMMAND=show datapath session dpi');
				var dpiResults = results.substring(pos);
				// Turn command results into arrays for iterating through and trim to just table contents
				var sessionLines = sessionResults.split('\n');
				var tableIndex = sessionLines.indexOf('----------------  --------------  ---- ----- ----- ---- ---- --- --- ----------- ---- ------- ----- ------ ------------- ');
				sessionLines.splice(0,tableIndex+1);
				var tableIndex = sessionLines.indexOf('');
				sessionLines.splice(tableIndex);
				
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
								// Put in App
								if (dpiLineArray[5] === 'App-Not-Class') lineArray[5] = 'Not Classified';
								else lineArray[5] = titleCase(dpiLineArray[5]);
								
								// Put in Web Category
								var webCat = dpiLineArray[7];
								if (webCat === ']') webCat = dpiLineArray[8];
								if (webCat === 'Web-Not-Class') webCat = "Not Classified";
								lineArray[6] = titleCase(webCat);
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
		
		$.each(sessionLines, function(){
			// Add session direction arrow (and colour red is Denied)
			var sessionRow = this;
			if (isPrivateIP(sessionRow[0])) {
				if (sessionRow[13].includes('D')) sessionRow.unshift('<span title="Outbound"</span><i class="fa-solid fa-caret-up text-danger"></i>');
				else sessionRow.unshift('<span title="Outbound"</span><i class="fa-solid fa-caret-up"></i>');
			} else {
				if (sessionRow[13].includes('D')) sessionRow.unshift('<span title="Inbound"</span><i class="fa-solid fa-caret-down text-danger"></i>');
				else sessionRow.unshift('<span title="Inbound"</span><i class="fa-solid fa-caret-down"></i>');
			}
			// Add the session pair number as the first element in the row, then add row to table
			sessionRow.unshift(i+1);
			var srcIP = sessionRow[2];
			var dstIP = sessionRow[3];
			if (ipToUsername[srcIP]) sessionRow[2] = '<span data-toggle="tooltip" data-placement="top" title="'+ipToUsername[srcIP]+'">'+srcIP+'</span>';
			if (ipToUsername[dstIP]) sessionRow[3] = '<span data-toggle="tooltip" data-placement="top" title="'+ipToUsername[dstIP]+'">'+dstIP+'</span>';
			table.row.add(sessionRow);
		});
	}
	
	
	$('#datapath-table')
	.DataTable()
	.rows()
	.draw();
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
		if (this.ip_address) ipToUsername[this.ip_address] = this.name;
	});
	console.log(ipToUsername);
}