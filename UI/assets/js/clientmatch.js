/*
Central Automation v1.8.0
Updated: 1.17
Aaron Scott (WiFi Downunder) 2022
*/

var clientList = [];
var graphDataType = {};
var graphDataMode = {};
var graphDataStatus = {};
var graphDataClients = {};

var statusNotification;
var balanceNotification;
var unsteerableNotification;
var historyNotification;

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
		Pull ClientMatch Data from Central
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageClient() {
	// override on visible page - used as a notification
	updateClientMatchData();
}

function updateClientMatchData() {
	if (!localStorage.getItem('central_id') || localStorage.getItem('central_id') === 'undefined') {
		Swal.fire({
			title: 'Central ID Needed',
			text: '.',
			icon: 'error',
		});
		Swal.fire({
			title: 'Central ID Needed!',
			text: 'The ClientMatch service control requires you to enter your Central ID in the settings',
			icon: 'warning',
			confirmButtonText: 'Go to Settings',
		}).then(result => {
			if (result.isConfirmed) {
				window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'settings.html';
			}
		});
	} else {
		$.when(tokenRefresh()).then(function() {
			clientList = getWirelessClients();

			getClientMatchStatus();
			getLoadBalanceStatus();
			getUnsteerableClients();
			getSteerHistory();
			$('[data-toggle="tooltip"]').tooltip();
		});
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CM Status
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getClientMatchStatus() {
	statusNotification = showNotification('ca-crossroad', 'Getting ClientMatch status...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/cm-enabled/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/cm-enabled/v1/<CENTRAL-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log("CM Status: "+ JSON.stringify(response));
		if (response.status === 'Success') {
			if (response.result.includes('Client Match enabled')) {
				$(document.getElementById('cmStateBtn')).addClass('btn-success');
				$(document.getElementById('cmStateBtn')).removeClass('btn-danger');
				document.getElementById('cmStateBtn').innerHTML = 'Enabled';
			} else {
				$(document.getElementById('cmStateBtn')).addClass('btn-danger');
				$(document.getElementById('cmStateBtn')).removeClass('btn-success');
				document.getElementById('cmStateBtn').innerHTML = 'Disabled';
			}
		}

		statusNotification.close();
	});
}

function toggleCMState() {
	statusNotification = showNotification('ca-crossroad', 'Updating ClientMatch status...', 'bottom', 'center', 'info');
	var cmState = true;
	if (document.getElementById('cmStateBtn').innerHTML === 'Enabled') {
		console.log('Disabling ClientMatch');
		cmState = false;
	} else {
		console.log('Enabling ClientMatch');
		cmState = true;
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/cm-enabled/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ enable: cmState }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response)
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/cm-enabled/v1/)');
				return;
			}
		}
		if (response.status === 'Success') {
			if (response.result.includes('ClientMatch disabled')) {
				showNotification('ca-crossroad', 'ClientMatch was disabled', 'bottom', 'center', 'success');
				$(document.getElementById('cmStateBtn')).addClass('btn-danger');
				$(document.getElementById('cmStateBtn')).removeClass('btn-success');
				document.getElementById('cmStateBtn').innerHTML = 'Disabled';
			} else if (response.result.includes('ClientMatch enabled')) {
				showNotification('ca-crossroad', 'ClientMatch was enabled', 'bottom', 'center', 'success');
				$(document.getElementById('cmStateBtn')).addClass('btn-success');
				$(document.getElementById('cmStateBtn')).removeClass('btn-danger');
				document.getElementById('cmStateBtn').innerHTML = 'Enabled';
			}
		}
		statusNotification.close();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CM Load Balance Status
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getLoadBalanceStatus() {
	balanceNotification = showNotification('ca-scale', 'Getting ClientMatch Load Balance status...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/loadbal-enable/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/loadbal-enable/v1/<CENTRAL-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.status === 'Success') {
			if (response.result.includes('Client Match Load Balance enabled')) {
				$(document.getElementById('loadbalBtn')).addClass('btn-success');
				$(document.getElementById('loadbalBtn')).removeClass('btn-danger');
				document.getElementById('loadbalBtn').innerHTML = 'Enabled';
			} else {
				$(document.getElementById('loadbalBtn')).addClass('btn-danger');
				$(document.getElementById('loadbalBtn')).removeClass('btn-success');
				document.getElementById('loadbalBtn').innerHTML = 'Disabled';
			}
		}
		balanceNotification.close();
	});
}

function toggleLoadBal() {
	balanceNotification = showNotification('ca-scale', 'Updating ClientMatch Load Balancing status...', 'bottom', 'center', 'info');
	var cmState = true;
	if (document.getElementById('loadbalBtn').innerHTML === 'Enabled') {
		console.log('Disabling ClientMatch Load Balancing');
		cmState = false;
	} else {
		console.log('Enabling ClientMatch Load Balancing');
		cmState = true;
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/loadbal-enable/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ enable: cmState }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response)
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/loadbal-enable/v1)');
				return;
			}
		}
		if (response.status === 'Success') {
			if (response.result.includes('ClientMatch Load Balance disabled')) {
				showNotification('ca-scale', 'ClientMatch Load Balancing was disabled', 'bottom', 'center', 'success');
				$(document.getElementById('loadbalBtn')).addClass('btn-danger');
				$(document.getElementById('loadbalBtn')).removeClass('btn-success');
				document.getElementById('loadbalBtn').innerHTML = 'Disabled';
			} else if (response.result.includes('ClientMatch Load Balance enabled')) {
				showNotification('ca-scale', 'ClientMatch Load Balancing was enabled', 'bottom', 'center', 'success');
				$(document.getElementById('loadbalBtn')).addClass('btn-success');
				$(document.getElementById('loadbalBtn')).removeClass('btn-danger');
				document.getElementById('loadbalBtn').innerHTML = 'Enabled';
			}
			balanceNotification.close();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Unsteerable Clients
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getUnsteerableClients() {
	unsteerableNotification = showNotification('ca-m-delete', 'Getting Unsteerable Clients...', 'bottom', 'center', 'info');

	$('#unsteerable-table')
		.DataTable()
		.clear();
	$('#unsteerable-table')
		.DataTable()
		.rows()
		.draw();

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/unsteerable/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/unsteerable/v1/<CENTRAL-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		//console.log("Unsteerable Clients: "+ JSON.stringify(response.result.UnsteerableEntries))
		if (response.result.UnsteerableEntries !== 'Not found') {
			$.each(response.result.UnsteerableEntries, function() {
				if (!this.hasOwnProperty('TimeNow')) {
					var processedMac = this.replace(/(..)/g, '$1:').slice(0, -1);
					var foundDevice = false;
					$.each(clientList, function() {
						if (this['macaddr'] === processedMac) {
							foundDevice = true;
							var status = '';
							if (!this['health']) {
								status = '<i class="fa fa-circle text-neutral"></i>';
							} else if (this['health'] < 50) {
								status = '<i class="fa fa-circle text-danger"></i>';
							} else if (this['health'] < 70) {
								status = '<i class="fa fa-circle text-warning"></i>';
							} else {
								status = '<i class="fa fa-circle text-success"></i>';
							}
							// Generate clean data for table
							var site = '';
							if (this['site']) site = this['site'];
							var health = '';
							if (this['health']) health = this['health'];
							var associatedDevice_name = '';
							var associatedDevice = findDeviceInMonitoring(this['associated_device']);
							if (associatedDevice) associatedDevice_name = associatedDevice.name;
							var ip_address = '';
							if (this['ip_address']) ip_address = this['ip_address'];
							var vlan = '';
							if (this['vlan']) vlan = this['vlan'];
							var os_type = '';
							if (this['os_type']) os_type = this['os_type'];
							var client_name = '';
							if (this['name']) client_name = this['name'];
							var client_mac = 'Unknown';
							if (this['macaddr']) client_mac = this['macaddr'];

							// Make link to Central
							client_name_url = encodeURI(client_name);
							var apiURL = localStorage.getItem('base_url');
							var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';

							var steerBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Make Steerable" onclick="steerClient(\'' + this['macaddr'] + '\')"><i class="fas fa-directions"></i></a>';

							// Add row to table
							var table = $('#unsteerable-table').DataTable();
							table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan, steerBtn]);
						}
					});
					if (!foundDevice) {
						// device not in monitoring - need to add row anyway.
						var status = '<i class="fa fa-circle text-neutral"></i>';

						// Generate clean data for table
						var site = '';
						var associatedDevice_name = 'Offline';
						var ip_address = '';
						var vlan = '';
						var os_type = '';
						var client_name = processedMac;

						// Make link to Central
						client_name_url = encodeURI(client_name);
						var apiURL = localStorage.getItem('base_url');
						var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + processedMac + '?ccma=' + processedMac + '&cdcn=' + client_name_url + '&nc=client';

						var steerBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Make Steerable" onclick="steerClient(\'' + processedMac + '\')"><i class="fas fa-directions"></i></a>';

						// Add row to table
						var table = $('#unsteerable-table').DataTable();
						table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, processedMac, ip_address, os_type, associatedDevice_name, site, vlan, steerBtn]);
					}
				}
			});
		}
		$('#unsteerable-table')
			.DataTable()
			.rows()
			.draw();
		$('[data-toggle="tooltip"]').tooltip();
		unsteerableNotification.close();
	});
}

function steerClient(macaddr) {
	unsteerableNotification = showNotification('ca-m-check', 'Making client steerable...', 'bottom', 'center', 'info');
	// convert macaddr in to safe string with swapping colon to %3A
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/unsteerable/v1/' + localStorage.getItem('central_id') + '/' + macaddr.replaceAll(':', '%3A'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		unsteerableNotification.close();
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/unsteerable/v1)');
				return;
			}
		}
		if (response.status === 'Success') {
			showNotification('ca-m-check', response.result, 'bottom', 'center', 'success');
			getUnsteerableClients();
		} else showNotification('ca-m-check', response.result, 'bottom', 'center', 'warning');
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		 Steer History Clients
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getSteerHistory() {
	historyNotification = showNotification('ca-m-search', 'Getting Steering History...', 'bottom', 'center', 'info');

	graphDataStatus = {};
	$('#history-table')
		.DataTable()
		.clear();
	$('#history-table')
		.DataTable()
		.rows()
		.draw();

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/history/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/history/v1/<CENTRAL-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.result.SteerHistory !== 'Not found') {
			var centralURLs = getCentralURLs();
			var centralHostURL = localStorage.getItem('base_url');

			$.each(response.result.SteerHistory, function() {
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
					mode = titleCase(steerString.match(/Mode=(.+?),/)[1]);

					status = titleCase(steerString.match(/Status=(.+?),/)[1]);
					statusResult = titleCase(steerString.match(/11vResult=(.+?),/)[1]);
					var statusString = status;
					if (mode === '11v') var statusString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="11v Result: ' + statusResult + '">' + status + '</span>';

					// Update Graph data...
					if (!graphDataStatus.hasOwnProperty(status)) graphDataStatus[status] = 1;
					else graphDataStatus[status] = graphDataStatus[status] + 1;

					if (!graphDataType.hasOwnProperty(type)) graphDataType[type] = 1;
					else graphDataType[type] = graphDataType[type] + 1;

					if (!graphDataMode.hasOwnProperty(mode)) graphDataMode[mode] = 1;
					else graphDataMode[mode] = graphDataMode[mode] + 1;

					if (!graphDataClients.hasOwnProperty(client_type)) graphDataClients[client_type] = 1;
					else graphDataClients[client_type] = graphDataClients[client_type] + 1;

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
					var centralURL = centralURLs[0][centralHostURL] + '/frontend/#/APDETAILV2/' + fromAP['serial'] + '?casn=' + fromAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
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
					var centralURL = centralURLs[0][centralHostURL] + '/frontend/#/APDETAILV2/' + toAP['serial'] + '?casn=' + toAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
					var toAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(toRadio[0]) + '<br>Band: ' + toBand + '<br>Channel: ' + toChannel + '">' + '<a href="' + centralURL + '" target="_blank"><strong>' + fromAP['name'] + '</strong></a>' + '<br>RSSI: -' + toRadio[1] + 'dBm</span>';

					var destRadio = steerString.match(/DstRadio=\((.+?)\)/)[1].split(', ');
					var destRadioClean = destRadio[0].replace(/(..)/g, '$1:').slice(0, -1);
					destAP = findAPForRadio(destRadioClean);
					destStatus = titleCase(steerString.match(/DstAcceptable=(.+?),/)[1]);
					var destBand = '';
					if (destAP && destAP.radios) {
						for (var i = 0, len = destAP.radios.length; i < len; i++) {
							if (destAP.radios[i]['macaddr'] === destRadioClean) {
								if (destAP.radios[i].band == 3) destBand = '6GHz';
								else if (destAP.radios[i].band == 0) destBand = '2.4GHz';
								else destBand = '5GHz';
							}
						}
					}

					var dstName = destRadioClean;
					if (destAP) dstName = destAP.name;
					var destAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(destRadio[0]) + '<br>Band: ' + destBand + '<br>' + 'Destination Acceptable: ' + destStatus + '">' + dstName + '<br>RSSI: -' + destRadio[1] + 'dBm</span>';

					roamTime = steerString.match(/RoamTime=(.*)/)[1];
					roamTime = roamTime.replace('s', '');

					// Make link to Central
					client_name_url = encodeURI(client_name);
					var apiURL = localStorage.getItem('base_url');
					var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddr + '?ccma=' + macaddr + '&cdcn=' + client_name_url + '&nc=client';

					// Add row to table
					var table = $('#history-table').DataTable();
					table.row.add([m.format('LLL'), macaddr === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', type, mode, statusString, fromAPString, toAPString, destAPString, roamTime]);
				}
			});
		}
		updateGraphs();
		$('#history-table')
			.DataTable()
			.rows()
			.draw();
		$('[data-toggle="tooltip"]').tooltip();
		historyNotification.close();
	});
}

function updateGraphs() {
	// CM Type Graph
	var cmType = Object.keys(graphDataType).map(function(key) {
		return { meta: key, value: graphDataType[key] };
	});

	Chartist.Bar(
		'#chartCMType',
		{
			labels: Object.keys(graphDataType),
			series: cmType,
		},
		{
			distributeSeries: true,
			height: 250,
			plugins: [Chartist.plugins.tooltip()],
		}
	);

	// CM Mode Graph
	var cmMode = Object.keys(graphDataMode).map(function(key) {
		return { meta: key, value: graphDataMode[key] };
	});

	Chartist.Bar(
		'#chartCMMode',
		{
			labels: Object.keys(graphDataMode),
			series: cmMode,
		},
		{
			distributeSeries: true,
			height: 250,
			plugins: [Chartist.plugins.tooltip()],
		}
	);

	// CM Status Graph
	var cmStatus = Object.keys(graphDataStatus).map(function(key) {
		return { meta: key, value: graphDataStatus[key] };
	});

	Chartist.Bar(
		'#chartCMStatus',
		{
			labels: Object.keys(graphDataStatus),
			series: cmStatus,
		},
		{
			distributeSeries: true,
			height: 250,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 30,
			},
			plugins: [Chartist.plugins.tooltip()],
		}
	);

	// CM Clients Graph
	var cmClients = Object.keys(graphDataClients).map(function(key) {
		return { meta: key, value: graphDataClients[key] };
	});
	// Sort based on count
	cmClients.sort(function(a, b) {
		return b['value'] - a['value'];
	});
	// Keep on the top 5
	cmClients = cmClients.slice(0, 10);
	//Build the labels to match the top 10
	labels = [];
	$.each(cmClients, function() {
		labels.push(this.meta);
	});

	Chartist.Bar(
		'#chartCMClients',
		{
			labels: labels,
			series: cmClients,
		},
		{
			distributeSeries: true,
			height: 250,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 30,
			},
			plugins: [Chartist.plugins.tooltip()],
		}
	);

	// Show the graphs section
	document.getElementById('cmGraphs').hidden = false;
	document.getElementById('cmGraphs2').hidden = false;
}
