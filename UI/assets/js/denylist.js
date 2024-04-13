/*
Central Automation v1.8
Updated: 1.34.2
Aaron Scott (WiFi Downunder) 2021-2023
*/

var deviceIDs = [];
var errorCounter = 0;
var apDetails = {};

var denyDevices = [];

var configGroups = [];
var groupConfigs = {};
var groupWLANs = {};

var denylistNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Override functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	//getDenyList();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findClientForMac(macaddr) {
	var clients = getWirelessClients();
	var foundClient = null;
	$.each(clients, function() {
		if (this['macaddr'] === macaddr) {
			foundClient = this;
			return this;
		}
	});
	return foundClient;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Get DenyList for selected Group
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getDenyListforGroup() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	
	denylistNotification = showLongNotification('ca-l-remove', 'Getting Denylist For '+ wlanGroup, 'bottom', 'center', 'info');
	$('#denylist-table')
		.DataTable()
		.rows()
		.remove();
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + wlanGroup,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		// Get the original request URL
		var requestedUrl = '';
		if (commandResults.hasOwnProperty('requestedUrl')) requestedUrl = commandResults.requestedUrl;

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

		// Get the correct group back from the original Group
		var requestedGroup = requestedUrl.match(/[^\/]+$/)[0];

		// save the group config for modifications
		groupConfigs[requestedGroup] = response;
		
		var table = $('#denylist-table').DataTable();
		denyDevices = [];
		// Denylist clients to the table
		for (i = 0; i < response.length; i++) {
			if (response[i].includes('blacklist-client ')) {
				var clientMac = response[i].replace('blacklist-client ', '');
				clientMac = clientMac.trim();
				
				// Action Buttons
				var removeBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Remove from Denylist" onclick="removeClient(\'' + clientMac + '\')"><i class="fa-solid fa-trash-alt"></i></a>';
				
				var client = findClientForMac(clientMac);
				if (client) {
					table.row.add(['<strong>' + client.name + '</strong>', clientMac, client.os_type, client.site, removeBtn]);
					denyDevices.push({name: client.name, mac: clientMac, os:client.os_type, site:client.site});
				} else {
					table.row.add(['<strong>' + clientMac + '</strong>', clientMac, '', '', removeBtn]);
					denyDevices.push({name: clientMac, mac: clientMac, os:'', site:''});
				}
			}
		}
		$('#denylist-table')
			.DataTable()
			.rows()
			.draw();

		if (denylistNotification) {
			denylistNotification.update({ message: 'Retrieved Denylist...', type: 'success' });
			setTimeout(denylistNotification.close, 1000);
		}
		$('[data-toggle="tooltip"]').tooltip();
	});
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Remove Client from Denylist
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function removeClient(macaddress) {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	
	// remove client from denylist in group config
	var currentConfig = groupConfigs[wlanGroup];
	var indexToRemove = currentConfig.indexOf('blacklist-client '+macaddress);
	currentConfig.splice(indexToRemove, 1);

	// need to push config back to Central.
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + wlanGroup,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ clis: currentConfig }),
		}),
	};
	
	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
				return;
			}
		}
		if (response.reason && response.reason == 'Bad Gateway') {
			Swal.fire({
				title: 'API Issue',
				text: 'There is an issue communicating with the API Gateway',
				icon: 'warning',
			});
		} else if (response.code && response.code == 429) {
			console.log('errorCode');
			Swal.fire({
				title: 'API Limit Reached',
				text: 'You have reached your daily API limit. No more API calls will succeed today.',
				icon: 'warning',
			});
		} else if (response.description) {
			logError(response.description);
			errorCounter++;
		} else if (response !== '' + wlanGroup) {
			logError('Denylist change was not applied to group ' + wlanGroup);
			errorCounter++;
		}
		if (errorCounter != 0) {
			showLog();
			Swal.fire({
				title: 'Denylist Update',
				text: 'Denylist failed to be updated',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Denylist Update',
				text: 'Denylist was updated',
				icon: 'success',
			});
			getDenyListforGroup();
		}
	});
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Add Clients (CSV) to Denylist
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function bulkAddDenyList() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	if (wlanGroup === '') {
		showNotification('ca-l-remove', 'Please select a group for which to modify the denylist', 'bottom', 'center', 'danger');
	} else {
		loadCSVFile('bulkAddDenyList');
	}
}

function addClientsToDenylist() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	
	if (csvData.length == 0) showNotification('ca-l-remove', 'No MAC addresses in the CSV file', 'bottom', 'center', 'warning');
	else {
		denylistNotification = showLongNotification('ca-l-remove', 'Modifing the Denylist for '+wlanGroup, 'bottom', 'center', 'info');
		var currentConfig = groupConfigs[wlanGroup];
		var updatedConfig = false;
		var changeCount = 0;
		$.each(csvData, function() {
			if (!this['MAC']) return false;
			if (currentConfig.indexOf('blacklist-client '+cleanMACAddress(this['MAC']).toLowerCase()) == -1) {
				// not already in the denylist... need to add it.
				currentConfig.push('blacklist-client '+cleanMACAddress(this['MAC']).toLowerCase());
				updatedConfig = true;
				changeCount++;
			}
		});
		
		logInformation(changeCount + ' clients added to the Denylist in the group '+ wlanGroup);
		if (denylistNotification) denylistNotification.update({ type: 'info', message: changeCount + ' clients are being added to the Denylist in the group '+ wlanGroup });
		if (updatedConfig) {
			// push the config back to Central
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + wlanGroup,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ clis: currentConfig }),
				}),
			};
			
			$.ajax(settings).done(function(response) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
						return;
					}
				}
				if (response.reason && response.reason == 'Bad Gateway') {
					Swal.fire({
						title: 'API Issue',
						text: 'There is an issue communicating with the API Gateway',
						icon: 'warning',
					});
				} else if (response.code && response.code == 429) {
					console.log('errorCode');
					Swal.fire({
						title: 'API Limit Reached',
						text: 'You have reached your daily API limit. No more API calls will succeed today.',
						icon: 'warning',
					});
				} else if (response.description) {
					logError(response.description);
					errorCounter++;
				} else if (response !== '' + wlanGroup) {
					logError('Denylist change was not applied to group ' + wlanGroup);
					errorCounter++;
				}
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'Denylist Update',
						text: 'Denylist failed to be updated',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Denylist Update',
						text: 'Denylist was updated',
						icon: 'success',
					});
					getDenyListforGroup();
				}
			});
		} else {
			Swal.fire({
				title: 'Denylist Update',
				text: 'Denylist did not need to be updated',
				icon: 'success',
			});
		}
		if (denylistNotification) setTimeout(denylistNotification.close, 2000);
		
	}
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Remove Clients (CSV) from Denylist
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function bulkRemoveDenyList() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	if (wlanGroup === '') {
		showNotification('ca-l-remove', 'Please select a group for which to modify the denylist', 'bottom', 'center', 'danger');
	} else {
		loadCSVFile('bulkRemoveDenyList');
	}
}

function removeClientsFromDenylist() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	
	if (csvData.length == 0) showNotification('ca-l-remove', 'No MAC addresses in the CSV file', 'bottom', 'center', 'warning');
	else {
		denylistNotification = showLongNotification('ca-l-remove', 'Modifing the Denylist for '+wlanGroup, 'bottom', 'center', 'info');
		
		var currentConfig = groupConfigs[wlanGroup];
		var updatedConfig = false;
		var changeCount = 0;
		$.each(csvData, function() {
			if (!this['MAC']) return false;
			var macaddress = cleanMACAddress(this['MAC']).toLowerCase();
			if (currentConfig.indexOf('blacklist-client '+macaddress) != -1) {
				// already in the denylist... need to remove it.
				var indexToRemove = currentConfig.indexOf('blacklist-client '+macaddress);
				currentConfig.splice(indexToRemove, 1);
				updatedConfig = true;
				changeCount++;
			}
		});
		
		logInformation(changeCount + ' clients removed from the Denylist in the group '+ wlanGroup);
		if (denylistNotification) denylistNotification.update({ type: 'info', message: changeCount + ' clients are being removed from the Denylist in the group '+ wlanGroup });
		if (updatedConfig) {
			// push the config back to Central
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + wlanGroup,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ clis: currentConfig }),
				}),
			};
			
			$.ajax(settings).done(function(response) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
						return;
					}
				}
				if (response.reason && response.reason == 'Bad Gateway') {
					Swal.fire({
						title: 'API Issue',
						text: 'There is an issue communicating with the API Gateway',
						icon: 'warning',
					});
				} else if (response.code && response.code == 429) {
					console.log('errorCode');
					Swal.fire({
						title: 'API Limit Reached',
						text: 'You have reached your daily API limit. No more API calls will succeed today.',
						icon: 'warning',
					});
				} else if (response.description) {
					logError(response.description);
					errorCounter++;
				} else if (response !== '' + wlanGroup) {
					logError('Denylist change was not applied to group ' + wlanGroup);
					errorCounter++;
				}
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'Denylist Update',
						text: 'Denylist failed to be updated',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Denylist Update',
						text: 'Denylist was updated',
						icon: 'success',
					});
					getDenyListforGroup();
				}
			});
		} else {
			Swal.fire({
				title: 'Denylist Update',
				text: 'Denylist did not need to be updated',
				icon: 'success',
			});
		}
		if (denylistNotification) setTimeout(denylistNotification.close,2000);
		
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download CSV
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDenyList() {
	csvData = buildCSVData();
	
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	
	var csv = Papa.unparse(csvData);
	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	var csvURL = window.URL.createObjectURL(csvBlob);
	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#denylist-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'Denylist-'+ wlanGroup+ '-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'DenyList-'+wlanGroup+'.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildCSVData(selectedGroup, selectedSite) {
	//CSV header
	var nameKey = 'NAME';
	var macKey = 'MAC';
	var osKey = 'CLIENT OS';
	var siteKey = 'SITE';

	var csvDataBuild = [];

	var table = $('#denylist-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = denyDevices[this];
		csvDataBuild.push({ [nameKey]: row.name, [macKey]: row.mac, [osKey]: row.os, [siteKey]: row.site });
	});

	return csvDataBuild;
}
