/*
Central Automation v1.8.0
Updated: 1.8.2
Aaron Scott (WiFi Downunder) 2022
*/

var clientList = [];

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
		});
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CM Status
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getClientMatchStatus() {
	showNotification('ca-crossroad', 'Getting ClientMatch status...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/cm-enabled/v1/)');
				return;
			}
		}
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

		showNotification('ca-crossroad', 'Retreived ClientMatch status', 'bottom', 'center', 'success');
	});
}

function toggleCMState() {
	showNotification('ca-crossroad', 'Updating ClientMatch status...', 'bottom', 'center', 'info');
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
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CM Load Balance Status
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getLoadBalanceStatus() {
	showNotification('ca-scale', 'Getting ClientMatch Load Balance status...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("Load Balance Status: "+ JSON.stringify(response));
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/loadbal-enable/v1)');
				return;
			}
		}
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

		showNotification('ca-scale', 'Retreived ClientMatch Load Balancing status', 'bottom', 'center', 'success');
	});
}

function toggleLoadBal() {
	showNotification('ca-scale', 'Updating ClientMatch Load Balancing status...', 'bottom', 'center', 'info');
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
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Unsteerable Clients
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getUnsteerableClients() {
	showNotification('ca-m-delete', 'Getting Unsteerable Clients...', 'bottom', 'center', 'info');

	$('#unsteerable-table')
		.DataTable()
		.clear();
	$('#unsteerable-table')
		.DataTable()
		.rows()
		.draw();

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/unsteerable/v1)');
				return;
			}
		}
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
		showNotification('ca-m-delete', 'Retrieved Unsteerable Clients', 'bottom', 'center', 'success');
	});
}

function steerClient(macaddr) {
	showNotification('ca-m-check', 'Making client steerable...', 'bottom', 'center', 'info');
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
	showNotification('ca-m-search', 'Getting Steering History...', 'bottom', 'center', 'info');

	$('#history-table')
		.DataTable()
		.clear();
	$('#history-table')
		.DataTable()
		.rows()
		.draw();

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("History: "+ JSON.stringify(response))
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/cm-api/history/v1)');
				return;
			}
		}
		if (response.result.SteerHistory !== 'Not found') {
			$.each(response.result.SteerHistory, function() {
				if (!this.hasOwnProperty('TimeNow')) {
					// process item
					// Date and time string
					var m = moment(Object.keys(this)[0], 'YYYY-MM-DD hh:mm:ss.SSS Z');

					//Event string
					var result = this[Object.keys(this)[0]].split(', ');
					var client_name;
					var macaddr = '';
					var type = '';
					var mode = '';
					var status = '';
					var fromRadio = '';
					var fromAP;
					var toRadio = '';
					var toAP;
					var roamTime = '';

					$.each(result, function() {
						if (this.includes('Mac=')) {
							macaddr = this.replace('Mac=', '');
							macaddr = macaddr.replace(/(..)/g, '$1:').slice(0, -1);
							client_name = macaddr;
							$.each(clientList, function() {
								if (this['macaddr'] === macaddr) {
									if (this['name']) client_name = this['name'];
								}
							});
						} else if (this.includes('Type=')) {
							type = titleCase(this.replace('Type=', ''));
							type = type.replace('Band_steer', 'Band Steer');
						} else if (this.includes('Mode=')) {
							mode = titleCase(this.replace('Mode=', ''));
						} else if (this.includes('Status=')) {
							status = titleCase(this.replace('Status=', ''));
						} else if (this.includes('FromRadio=(')) {
							fromRadio = titleCase(this.replace('FromRadio=(', ''));
							fromAP = findAPForRadio(fromRadio.replace(/(..)/g, '$1:').slice(0, -1));
						} else if (this.includes('ToRadio=(')) {
							toRadio = titleCase(this.replace('ToRadio=(', ''));
							toAP = findAPForRadio(toRadio.replace(/(..)/g, '$1:').slice(0, -1));
						} else if (this.includes('RoamTime=')) {
							roamTime = this.replace('RoamTime=', '');
							roamTime = roamTime.replace('s', '');
						}
					});

					// Make link to Central
					client_name_url = encodeURI(client_name);
					var apiURL = localStorage.getItem('base_url');
					var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddr + '?ccma=' + macaddr + '&cdcn=' + client_name_url + '&nc=client';

					// Add row to table
					var table = $('#history-table').DataTable();
					table.row.add([m.format('LLL'), macaddr === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', type, mode, status, fromAP.name, toAP.name, roamTime]);
				}
			});
		}
		$('#history-table')
			.DataTable()
			.rows()
			.draw();
		$('[data-toggle="tooltip"]').tooltip();
		showNotification('ca-m-search', 'Retrieved History', 'bottom', 'center', 'success');
	});
}
