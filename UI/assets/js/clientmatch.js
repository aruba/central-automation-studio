/*
Central Automation v1.8.0
Updated: 1.37.3
Aaron Scott (WiFi Downunder) 2021-2024
*/

var clientList = [];
var graphDataType = {};
var graphDataMode = {};
var graphDataStatus = {};
var graphDataClients = {};
var graphDataTime = {};
var graphDataDB = {};
var performanceStats = {};
var performanceCSVData = [];

var statusNotification;
var balanceNotification;
var balanceHistoryNotification;
var unsteerableNotification;
var historyNotification;

//CSV header
var typeKey = 'TYPE';
var totalKey = 'TOTAL';
var successTotalKey = 'SUCCESS TOTAL';
var successPercentageKey = 'SUCCESS PERCENTAGE';
var successAverageKey = 'SUCCESS AVERAGE ROAM TIME';
var deauthTotalKey = 'DEAUTH TOTAL';
var deauthPercentageKey = 'DEAUTH PERCENTAGE';
var deauthAverageKey = 'DEAUTH AVERAGE ROAM TIME';
var vTotalKey = '802.11v TOTAL';
var vPercentageKey = '802.11v PERCENTAGE';
var vAverageKey = '802.11v AVERAGE ROAM TIME';
var timeoutTotalKey = 'TIMEOUTS';
var timeoutAvgKey = 'TIMEOUT AVERAGE'
var rejectTotalKey = 'REJECTS';
var wrongDstTotalKey = 'WRONG DST';
var wrongSrcTotalKey = 'WRONG SRC';

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

function findAPForBSSID(bssidMac) {
	var radioMac = bssidMac.slice(0, -1) + '0';
	return findAPForRadio(radioMac);
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
		$.when(authRefresh()).then(function() {
			if (!failedAuth) {
				clientList = getWirelessClients();
	
				getClientMatchStatus();
				getLoadBalanceStatus();
				getLoadBalanceHistory();
				getUnsteerableClients();
				getSteerHistory();
				$('[data-toggle="tooltip"]').tooltip();
			}
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
		CM Load Balance Info
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

function getLoadBalanceHistory() {
	balanceHistoryNotification = showNotification('ca-scale', 'Getting Load Balance History...', 'bottom', 'center', 'info');

	$('#balance-history-table')
		.DataTable()
		.clear();
	$('#balance-history-table')
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
			url: localStorage.getItem('base_url') + '/cm-api/loadbal-history/v1/' + localStorage.getItem('central_id'),
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/loadbal-history/v1/<CENTRAL-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		var centralURLs = getCentralURLs();
		var centralHostURL = localStorage.getItem('base_url');
		var table = $('#balance-history-table').DataTable();
		
		if (response.result.LoadBalanceHistory !== "Not found") {
			$.each(response.result.LoadBalanceHistory, function() {
				if (!this.hasOwnProperty('TimeNow')) {
					
					var m = moment(Object.keys(this)[0], 'YYYY-MM-DD hh:mm:ss.SSS Z');
					var historyString = this[Object.keys(this)[0]].toString();
					
					var client_name;
					var client_type = 'Unknown';
					var macaddr = '';
					var fromRadio = '';
					var fromAP;
					var toRadio = '';
					var toAP;
					
					macaddr = historyString.match(/Mac=(.+?),/)[1];
					client_name = macaddr;
					$.each(clientList, function() {
						var cleanMac = this['macaddr'].replace(/:/g, '');
						if (cleanMac === macaddr) {
							if (this['name']) client_name = this['name'];
							if (this['os_type']) client_type = this['os_type'];
						}
					});
					
					// "From" Radio
					var fromRadio = historyString.match(/FromRadio=\((.+?)\)/)[1].split(', ');
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
					var fromPrefFlags = fromRadio[4];
					if (fromPrefFlags !== '') fromPrefFlags = '<br>Pref Flag: '+ fromRadio[4];
					// Make AP Name as a link to Central
					var apName = encodeURI(fromAP['name']);
					var centralURL = centralURLs[centralHostURL] + '/frontend/#/APDETAILV2/' + fromAP['serial'] + '?casn=' + fromAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
					var fromAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(fromRadio[0]) + '<br>Band: ' + fromBand + '<br>Channel: ' + fromChannel + fromPrefFlags +'">' + '<a href="' + centralURL + '" target="_blank"><strong>' + fromAP['name'] + '</strong></a>' + '<br>RSSI: -' + fromRadio[1] + 'dBm</span>';
					
					
					// "To" Radio
					var toRadio = historyString.match(/ToRadio=\((.+?)\)/)[1].split(', ');
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
					var toPrefFlags = toRadio[4];
					if (toPrefFlags !== '') toPrefFlags = '<br>Pref Flag: '+ toRadio[4];
					// Make AP Name as a link to Central
					var apName = encodeURI(toAP['name']);
					var centralURL = centralURLs[centralHostURL] + '/frontend/#/APDETAILV2/' + toAP['serial'] + '?casn=' + toAP['serial'] + '&cdcn=' + apName + '&nc=access_point';
					var toAPString = '<span data-toggle="tooltip" data-placement="top" data-html="true" title="Radio MAC: ' + cleanMACAddress(toRadio[0]) + '<br>Band: ' + toBand + '<br>Channel: ' + toChannel + fromPrefFlags + '">' + '<a href="' + centralURL + '" target="_blank"><strong>' + toAP['name'] + '</strong></a>' + '<br>RSSI: -' + toRadio[1] + 'dBm</span>';
					
					// Make link to Central
					var client_name_url = encodeURI(client_name);
					var apiURL = localStorage.getItem('base_url');
					var clientURL = centralURLs[apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddr + '?ccma=' + macaddr + '&cdcn=' + client_name_url + '&nc=client';
					
					// Add row to table
					
					table.row.add([m.format('LLL'), macaddr === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', fromAPString, toAPString]);
				}
			});
		}
		$('#balance-history-table')
			.DataTable()
			.rows()
			.draw();
		
		table.columns.adjust().draw();
		$('[data-toggle="tooltip"]').tooltip();
		balanceHistoryNotification.close();
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
								status = '<i class="fa-solid fa-circle text-neutral"></i>';
							} else if (this['health'] < 50) {
								status = '<i class="fa-solid fa-circle text-danger"></i>';
							} else if (this['health'] < 70) {
								status = '<i class="fa-solid fa-circle text-warning"></i>';
							} else {
								status = '<i class="fa-solid fa-circle text-success"></i>';
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
							var clientURL = centralURLs[apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';

							var steerBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Make Steerable" onclick="steerClient(\'' + this['macaddr'] + '\')"><i class="fa-solid  fa-directions"></i></a>';

							// Add row to table
							var table = $('#unsteerable-table').DataTable();
							table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan, steerBtn]);
						}
					});
					if (!foundDevice) {
						// device not in monitoring - need to add row anyway.
						var status = '<i class="fa-solid fa-circle text-neutral"></i>';

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
						var clientURL = centralURLs[apiURL] + '/frontend/#/CLIENTDETAIL/' + processedMac + '?ccma=' + processedMac + '&cdcn=' + client_name_url + '&nc=client';

						var steerBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Make Steerable" onclick="steerClient(\'' + processedMac + '\')"><i class="fa-solid  fa-directions"></i></a>';

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

	graphDataType = {};
	graphDataMode = {};
	graphDataStatus = {};
	graphDataClients = {};
	graphDataTime = {};
	graphDataDB = {};
	performanceStats = {};
	
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
								if (destAP.radios[i].band == 3) destBand = '6GHz';
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
					
					// Store roamTime by Type for graphing
					var typeData = {};
					if (!graphDataTime.hasOwnProperty(type)) {
						graphDataTime[type] = typeData;
					}
					typeData = graphDataTime[type];
					
					// Build the correct array for each type
					var statusData = [];
					if (!typeData.hasOwnProperty(status)) {
						typeData[status] = statusData;
					}
					statusData = typeData[status];
					statusData.push(roamTime);
					typeData[status] = statusData;
					graphDataTime[type] = typeData;
					
					// Store dB change by Type for graphing
					if (mode === "11v") {
						var typeData = {};
						if (!graphDataDB.hasOwnProperty(type)) {
							graphDataDB[type] = typeData;
						}
						typeData = graphDataDB[type];
						
						// Build the correct array for each type
						var statusData = [];
						if (!typeData.hasOwnProperty(status)) {
							typeData[status] = statusData;
						}
						statusData = typeData[status];
						statusData.push(parseInt(fromRadio[1])-parseInt(toRadio[1]));
						typeData[status] = statusData;
						graphDataDB[type] = typeData;
					}

					// Make link to Central
					client_name_url = encodeURI(client_name);
					var apiURL = localStorage.getItem('base_url');
					var clientURL = centralURLs[apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddr + '?ccma=' + macaddr + '&cdcn=' + client_name_url + '&nc=client';

					// Create link to get station record
					var actionBtns = '';
					actionBtns += '<button class="btn-warning btn-action" onclick="getStationRecord(\'' + cleanMACAddress(macaddr) + '\')">Station Record</button> ';

					// Add row to table
					var table = $('#history-table').DataTable();
					table.row.add([m.format('LLL'), macaddr === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', type, mode, statusString, fromAPString, toAPString, destAPString, roamTime, actionBtns]);
					
					// Store for performance stats table
					// Create dictionary with counters for each mod
					if (!performanceStats.hasOwnProperty(type)) performanceStats[type] = {};
					var typeStats = performanceStats[type];
					
					if (!typeStats.hasOwnProperty(mode)) typeStats[mode] = {};
					var modeStats = typeStats[mode];
					if (!modeStats.hasOwnProperty(status)) modeStats[status] = 1;
					else modeStats[status] = modeStats[status] + 1;
					
					// Add up the roam times for averaging
					if (status === 'Timeout') {
						if (!typeStats.hasOwnProperty('Total-Timeout')) typeStats['Total-Timeout'] = parseInt(roamTime);
						else typeStats['Total-Timeout'] = typeStats['Total-Timeout'] + parseInt(roamTime);
					} else if (status === 'Success') {
						if (!typeStats.hasOwnProperty('Total-Success')) typeStats['Total-Success'] = parseInt(roamTime);
						else typeStats['Total-Success'] = typeStats['Total-Success'] + parseInt(roamTime);
					}
					if ((mode === '11v') && (status !== 'Timeout'))  {
						if (!typeStats.hasOwnProperty('Total-11v')) typeStats['Total-11v'] = parseInt(roamTime);
						else typeStats['Total-11v'] = typeStats['Total-11v'] + parseInt(roamTime);
					} else if ((mode === 'Deauth') && (status !== 'Timeout')) {
						if (!typeStats.hasOwnProperty('Total-Deauth')) typeStats['Total-Deauth'] = parseInt(roamTime);
						else typeStats['Total-Deauth'] = typeStats['Total-Deauth'] + parseInt(roamTime);
					}
					
					typeStats[mode] = modeStats;
					performanceStats[type] = typeStats;
				}
			});
		}
		$('#history-table')
			.DataTable()
			.rows()
			.draw();
		$('[data-toggle="tooltip"]').tooltip();
		historyNotification.close();
		
		// Update the CM Stats Graphs
		updateGraphs();
		
		// Configure the selectors for the Performance Stats cards
		select = document.getElementById('graphSelector');
		select.options.length = 0;
		$.each(Object.keys(graphDataTime), function() {
			$('#graphSelector').append($('<option>', { value: this, text: this }));
		})
		if ($('#graphSelector').length != 0) {
			$('#graphSelector').selectpicker('refresh');
		}
		
		select = document.getElementById('graph11vSelector');
		select.options.length = 0;
		$('#graph11vSelector').append($('<option>', { value: 'All', text: 'All' }));
		$.each(Object.keys(graphDataDB), function() {
			$('#graph11vSelector').append($('<option>', { value: this, text: this }));
		})
		if ($('#graph11vSelector').length != 0) {
			$('#graph11vSelector').selectpicker('refresh');
		}
		
		updateStatisticsTable();
	});
}

function getStationRecord(clientMac) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cm-api/station/v1/' + localStorage.getItem('central_id') + '/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cm-api/station/v1/<CENTRAL-ID>/<CLIENT-MAC>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var results = response.result;
		
		// Load UI elements
		document.getElementById('recordTitle').innerHTML = 'Station Record: <strong>' + clientMac + '</strong>';
		$('#RecordModalLink').trigger('click');

		// Get details for client and AP links to Central
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);

		$('#generalRecord').empty();
		var clientDevice = findDeviceInMonitoringForMAC(clientMac);
		if (clientDevice) {
			client_name_url = encodeURI(clientDevice['name']);
			var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + clientDevice['macaddr'] + '?ccma=' + clientDevice['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
			$('#generalRecord').append('<li>Client Name: <strong>' + '<a href="' + clientURL + '" target="_blank"><strong>' + clientDevice['name'] + '</strong></a>' + '</strong></li>');
			$('#generalRecord').append('<li>Client OS: <strong>' + clientDevice['os_type'] + '</strong></li>');
			$('#generalRecord').append('<li>&nbsp;</li>');
		} else {
			$('#generalRecord').append('<li>Client Name: <strong>' + clientMac + '</strong></li>');
			$('#generalRecord').append('<li>Client OS: <strong>' + results.match(/deviceType=(.*)assocBssid/m)[1].trim() + '</strong></li>');
			$('#generalRecord').append('<li>&nbsp;</li>');
		}

		var associatedRadio = results.match(/assocBssid=(\S*)\s/m)[1];
		associatedRadio = associatedRadio.replace(/(..)/g, '$1:').slice(0, -1);
		var associatedAP = findAPForBSSID(associatedRadio);

		// Make AP Name as a link to Central
		var name = encodeURI(associatedAP['name']);
		var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + associatedAP['serial'] + '?casn=' + associatedAP['serial'] + '&cdcn=' + name + '&nc=access_point';
		$('#generalRecord').append('<li>Associated AP: <strong>' + '<a href="' + centralURL + '" target="_blank"><strong>' + associatedAP['name'] + '</strong></a>' + '</strong></li>');
		$('#generalRecord').append('<li>Associated BSSID: <strong>' + cleanMACAddress(results.match(/assocBssid=(\S*)\s/m)[1]) + '</strong></li>');

		$('#capabilitiesRecord').empty();
		$('#capabilitiesRecord').append('<li>Supports 5GHz: <strong>' + titleCase(results.match(/is5GCapable=(\S*)\s/m)[1]) + '</strong></li>');
		$('#capabilitiesRecord').append('<li>Supports 6GHz: <strong>' + titleCase(results.match(/is6GCapable=(\S*)\s/m)[1]) + '</strong></li>');
		$('#capabilitiesRecord').append('<li>Supports 11v: <strong>' + titleCase(results.match(/is11vCapable=(\S*)\s/m)[1]) + '</strong></li>');
		$('#capabilitiesRecord').append('<li>Steerable: <strong>' + titleCase(results.match(/isLbSteerable=(\S*)\s/m)[1]) + '</strong></li>');
		$('#capabilitiesRecord').append('<li>Trusted: <strong>' + titleCase(results.match(/isTrusted=(\S*)\s/m)[1]) + '</strong></li>');

		// clear out any old data
		$('#record-table')
			.DataTable()
			.clear();
		var table = $('#record-table').DataTable();
		// process the VBR
		var vbrTableData = results.match(/VBR:\s((.|\s)*)Last/m)[1].trim();

		var vbrRows = vbrTableData.split('\n');
		vbrRows.shift();
		
		$.each(vbrRows, function() {
			var vbrEntry = this.toString().split('\t');
			var vbrRadio = vbrEntry[0].replace(/(..)/g, '$1:').slice(0, -1);
			var vbrAP = findAPForBSSID(vbrRadio);
			var vbrName = encodeURI(associatedAP['name']);
			var vbrCentralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + vbrAP['serial'] + '?casn=' + vbrAP['serial'] + '&cdcn=' + vbrName + '&nc=access_point';

			table.row.add(['<a href="' + vbrCentralURL + '" target="_blank"><strong>' + vbrAP['name'] + '</strong></a>', cleanMACAddress(vbrRadio), vbrEntry[2], vbrEntry[3]]);
		});

		$('#record-table')
			.DataTable()
			.rows()
			.draw();
		table.columns.adjust().draw();
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
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 40,
			},
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
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 40,
			},
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
				offset: 40,
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
				offset: 40,
			},
			plugins: [Chartist.plugins.tooltip()],
		}
	);

	// Show the graphs section
	document.getElementById('cmGraphs').hidden = false;
	document.getElementById('cmGraphs2').hidden = false;
}

function updatePerformanceGraphs() {
	$('#performanceLegend').empty();
	var legendIndex = 0;
	
	// Massage raw data based on selected graph
	var select = document.getElementById('graphSelector');
	var currentType = select.value;
	var dataTimeSet = graphDataTime[currentType];
	
	var maxXValue = 0;
	var massagedData = [];
	if (dataTimeSet) {
		dataTimeSet = sortDataSets(dataTimeSet);
		// Determine the max value in the data sets
		$.each(Object.keys(dataTimeSet), function(){
			if (this.toString() === "Timeout") {
				// skip
			} else if ((document.getElementById('includeRejectCheckbox').checked == false) && (this.toString() === "Reject")) {
				// skip
			} else {
				var currentData = dataTimeSet[this];
				currentData.sort(function(a, b) {
					return parseInt(a) - parseInt(b);
				});
				var currMax = parseInt(currentData[currentData.length - 1])
				if (currMax > maxXValue) maxXValue = currMax;
			}
		});
		
		// Generate Labels
		var labels;
		if (maxXValue > 20 && maxXValue <= 100) {
			labels = Array.from(new Array(maxXValue+1),(val,index)=> "");
			for (var i=0;i<maxXValue+1;i=i+10) {
				labels.splice(i, 1, i.toString())
			}
		} else if (maxXValue > 100 && maxXValue < 1000) {
			labels = Array.from(new Array(maxXValue+1),(val,index)=> "");
			for (var i=0;i<maxXValue+1;i=i+100) {
				labels.splice(i, 1, i.toString())
			}
		} else if (maxXValue > 1000) {
			labels = Array.from(new Array(maxXValue+1),(val,index)=> "");
			for (var i=0;i<maxXValue+1;i=i+500) {
				labels.splice(i, 1, i.toString())
			}
		} else {
			labels = Array.from(new Array(maxXValue+1),(val,index)=> index+"");
		}
		
		// Populate the massaged data
		$.each(Object.keys(dataTimeSet), function(){
			if (this.toString() === "Timeout") {
				// skip
			} else if ((document.getElementById('includeRejectCheckbox').checked == false) && (this.toString() === "Reject")) {
				// skip
			} else {
				$('#performanceLegend').append('<i class="fa-solid fa-circle '+colorArray[legendIndex]+'"></i> '+this.toString()+'\t');
				var currentData = dataTimeSet[this];
				var currentCounts = Array.from(new Array(maxXValue+1),(val,index)=> 0);
				$.each(currentData, function() {
					var currentTime = parseInt(this);
					var currentCount = currentCounts[currentTime] +1;
					currentCounts.splice(currentTime, 1, currentCount);
				});
				massagedData.push(currentCounts);
				legendIndex++;
			}
		});
		
		Chartist.Bar('#chartCMTime', {
			labels: labels,
			series: massagedData
		}, {
			showPoint: false,
			lineSmooth: Chartist.Interpolation.none(),
			height: 250,
			seriesBarDistance: 12,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 30,
			},
			plugins: [Chartist.plugins.tooltip()],
		});			
	}
}

function sortDataSets(obj) {
	items = Object.keys(obj).map(function(key) {
		return [key, obj[key]];
	});
	items.sort((a, b) => a[0].localeCompare(b[0]))
	sorted_obj={}
	$.each(items, function(k, v) {
		use_key = v[0]
		use_value = v[1]
		sorted_obj[use_key] = use_value
	})
	return(sorted_obj)
} 


function update11vGraphs() {
	$('#11vLegend').empty();

	// Massage raw data based on selected graph
	var select = document.getElementById('graph11vSelector');
	var currentType = select.value;

	if (currentType === 'All') {
		displayMergedDataSets(graphDataDB);
	} else {
		displayIndividualDataSet(graphDataDB[currentType]);
	}
}

function displayMergedDataSets(dataDBSet) {

	dataDBSet = sortDataSets(dataDBSet);
	var mergedDataSet = {};
	$.each(Object.keys(dataDBSet), function(){
		var mergedSet = [];
		// merge the data first
		var currentSet = dataDBSet[this.toString()]
		$.each(Object.keys(currentSet), function(){
			if ((document.getElementById('include11vTimeoutCheckbox').checked == false) && (this.toString() === "Timeout")) {
				// skip
			} else if ((document.getElementById('include11vRejectCheckbox').checked == false) && (this.toString() === "Reject")) {
				// skip
			} else {
				mergedSet = mergedSet.concat(currentSet[this]);
			}
		})
		mergedDataSet[this.toString()] = mergedSet;	
	})
	displayIndividualDataSet(mergedDataSet);
}


function displayIndividualDataSet(dataDBSet) {
	var legendIndex = 0;
	
	var minXValue = 0;
	var maxXValue = 0;
	var massagedData = [];
	if (dataDBSet) {
		dataDBSet = sortDataSets(dataDBSet);
		// Determine the max value in the data sets
		$.each(Object.keys(dataDBSet), function(){
			if ((document.getElementById('include11vTimeoutCheckbox').checked == false) && (this.toString() === "Timeout")) {
				// skip
			} else if ((document.getElementById('include11vRejectCheckbox').checked == false) && (this.toString() === "Reject")) {
				// skip
			} else {
				var currentData = dataDBSet[this];
				currentData.sort(function(a, b) {
					return parseInt(a) - parseInt(b);
				});
				var currMax = parseInt(currentData[currentData.length - 1])
				if (currMax > maxXValue) maxXValue = currMax;
				
				var currMin = parseInt(currentData[0])
				if (currMin < minXValue) minXValue = currMin;
			}
		});
		
		// Generate Labels
		var labels;
		var valueSpread = maxXValue - minXValue;
		if (valueSpread > 20) {
			labels = Array.from(new Array(valueSpread+1),(val,index)=> "");
			for (var i=0;i<valueSpread+1;i=i+5) {
				labels.splice(i, 1, (minXValue+i).toString())
			}
		} else {
			labels = Array.from(new Array(valueSpread+1),(val,index)=> "");
			for (var i=0;i<valueSpread+1;i++) {
				labels.splice(i, 1, (minXValue+i).toString())
			}
		}
		// Populate the massaged data
		$.each(Object.keys(dataDBSet), function(){
			if ((document.getElementById('include11vTimeoutCheckbox').checked == false) && (this.toString() === "Timeout")) {
				// skip
			} else if ((document.getElementById('include11vRejectCheckbox').checked == false) && (this.toString() === "Reject")) {
				// skip
			} else {
				$('#11vLegend').append('<i class="fa-solid fa-circle '+colorArray[legendIndex]+'"></i> '+this.toString()+'\t');
				var currentData = dataDBSet[this];
				var currentCounts = Array.from(new Array(valueSpread+1),(val,index)=> 0);
				$.each(currentData, function() {
					var currentDB = parseInt(this);
					
					var locationIndex = 0;
					if (minXValue == 0) indexLocation = currentDB;
					else if (minXValue < 0) indexLocation = Math.abs(currentDB) - Math.abs(minXValue);
					else indexLocation = currentDB - minXValue;
					
					var currentCount = currentCounts[indexLocation] +1;
					currentCounts.splice(indexLocation, 1, currentCount);
					
				});
				console.log(currentCounts)
				massagedData.push(currentCounts);
				legendIndex++;
			}
		});
		
		Chartist.Line('#chartCM11v', {
			labels: labels,
			series: massagedData
		}, {
			showPoint: false,
			lineSmooth: Chartist.Interpolation.none(),
			height: 250,
			seriesBarDistance: 12,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 30,
			},
			plugins: [Chartist.plugins.tooltip()],
		});
		
						
	}
}

function updateStatisticsTable() {
	performanceCSVData = [];
	
	$('#performance-table')
		.DataTable()
		.clear();
	var table = $('#performance-table').DataTable();
	
	$.each(Object.keys(performanceStats), function() {
		var steerType = this.toString();
		var steerCounts = performanceStats[steerType];
		var typeTotal = 0;
		var successTotal = 0;
		var vTotal = 0;
		var vSuccess = 0;
		var deauthTotal = 0;
		var deauthSuccess = 0;
		var timeoutTotal = 0;
		var timeoutT
		var rejectTotal = 0;
		var wrongDstTotal = 0;
		var wrongSrcTotal = 0;
		//console.log(steerCounts)
		$.each(Object.keys(steerCounts), function() {
			var mode = this.toString();
			var statusCounts = steerCounts[this.toString()];
			$.each(Object.keys(statusCounts), function() {
				typeTotal += statusCounts[this.toString()]
				if (this.toString() === "Success") successTotal += statusCounts[this.toString()]
				else if (this.toString() === "Timeout") timeoutTotal += statusCounts[this.toString()]
				else if (this.toString() === "Reject") rejectTotal += statusCounts[this.toString()]
				else if (this.toString() === "Wrong Destination") wrongDstTotal += statusCounts[this.toString()]
				else if (this.toString() === "Wrong Source") wrongSrcTotal += statusCounts[this.toString()]
				if (mode === "11v") {
					vTotal += statusCounts[this.toString()];
					if (this.toString() === "Success") vSuccess += statusCounts[this.toString()];
				} else if (mode === "Deauth") {
					deauthTotal += statusCounts[this.toString()];
					if (this.toString() === "Success") deauthSuccess += statusCounts[this.toString()];
				}
			});
		});
		
		
		table.row.add([steerType, typeTotal, (successTotal/typeTotal*100).toFixed(2)+'%', deauthTotal!=0?deauthTotal + ' (' + (deauthSuccess/deauthTotal*100).toFixed(2)+'%)':'-',vTotal!=0?vTotal + ' (' + (vSuccess/vTotal*100).toFixed(2)+'%)':'-',timeoutTotal,rejectTotal,wrongDstTotal,wrongSrcTotal]);
		
		performanceCSVData.push({
			[typeKey]: steerType,
			[totalKey]: typeTotal,
			[successTotalKey]: successTotal,
			[successPercentageKey]: (successTotal/typeTotal*100).toFixed(2)+'%',
			[successAverageKey]: successTotal>0?(steerCounts['Total-Success']/successTotal).toFixed(0):'-',
			[deauthTotalKey]: deauthTotal,
			[deauthPercentageKey]: deauthTotal>0?(deauthSuccess/deauthTotal*100).toFixed(2)+'%':'-',
			[deauthAverageKey]: deauthTotal>0?(steerCounts['Total-Deauth']/deauthTotal).toFixed(0):'-',
			[vTotalKey]: vTotal,
			[vPercentageKey]: vTotal>0?(vSuccess/vTotal*100).toFixed(2)+'%':'-',
			[vAverageKey]: vTotal>0?(steerCounts['Total-11v']/vTotal).toFixed(0):'-',
			[timeoutTotalKey]: timeoutTotal,
			[timeoutAvgKey]: timeoutTotal>0?(steerCounts['Total-Timeout']/timeoutTotal).toFixed(0):'-',
			[rejectTotalKey]: rejectTotal,
			[wrongDstTotalKey]: wrongDstTotal,
			[wrongSrcTotalKey]: wrongSrcTotal,
		});
		
	});
	
	$('#performance-table')
	.DataTable()
	.rows()
	.draw();
	
	table.columns.adjust().draw();	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadPerformanceStats() {
	csvData = performanceCSVData;

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	csvLink.setAttribute('download', 'CM-PerformanceStats.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}
