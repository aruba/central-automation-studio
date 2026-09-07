/*
Central Automation v1.48
Updated: 
Aaron Scott (WiFi Downunder) 2026
*/

const AGMODE = { replace: 0, append: 1, allowed: 2, disallowed: 3};

var airGroupServers = [];
var airGroupDisplay = [];

var airGroupStatuses = {};
var agGroups;

var serverCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var delayCounter = 0;
var statusCounter = 0;

var loadingNotification;
var airGroupNotification;
var csvNotification;
var statusNotification;
var groupStatusNotification;

function loadCurrentPageAP() {
	// override on visible page - used as a notification
	$.when(authRefresh()).then(function() {
		getAirGroupServers(0);
	});
}

function loadCurrentPageGroup() {
	// override on visible page - used as a notification
	agGroups = getGroups();
	$.when(authRefresh()).then(function() {
		getAirGroupStatusPerGroup(null,false);
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AirGroup Status
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getAirGroupStatus() {
	statusNotification = showNotification('ca-mirror-display', 'Getting AirGroup status...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airgroup-config/v2/node_list/GLOBAL/GLOBAL/config/general_settings/airgroup_status' ,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/airgroup-config/v2/node_list/GLOBAL/GLOBAL/config/general_settings/airgroup_status)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.airgroup_status) {
			$(document.getElementById('agStateBtn')).addClass('btn-success');
			$(document.getElementById('agStateBtn')).removeClass('btn-danger');
			document.getElementById('agStateBtn').innerHTML = 'Enabled';
		} else {
			$(document.getElementById('agStateBtn')).addClass('btn-danger');
			$(document.getElementById('agStateBtn')).removeClass('btn-success');
			document.getElementById('agStateBtn').innerHTML = 'Disabled';
		}

		statusNotification.close();
	});
}

function getAirGroupStatusPerGroup(nodeId, singular) {
	if (!nodeId) {
		// single group to get
		groupStatusNotification = showProgressNotification('ca-mirror-display', 'Getting AirGroup status...', 'bottom', 'center', 'info');
		statusCounter = 0;
		// get groups and update NodeId to first group
		nodeId = agGroups[0]['group'];
	}
	
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airgroup-config/v2/node_list/GROUP/'+nodeId+'/config/general_settings/airgroup_status' ,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/airgroup-config/v2/node_list/GROUP/<node-id>/config/general_settings/airgroup_status)');
			apiErrorCount++;
			if (groupStatusNotification) {
				groupStatusNotification.update({ progress: 100, type: 'danger', message: 'AirGroup status failed to be updated' });
				setTimeout(groupStatusNotification.close, 1000);
			}
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			if (groupStatusNotification) {
				groupStatusNotification.update({ progress: 100, type: 'danger', message: 'AirGroup status failed to be updated' });
				setTimeout(groupStatusNotification.close, 1000);
			}
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		airGroupStatuses[nodeId] = response.airgroup_status;
		
		if (singular) {
			statusNotification.close();
			loadStatusTable();
		} else {
			statusCounter++;
			let agProgress = statusCounter/agGroups.length*100;
			groupStatusNotification.update({ progress: agProgress });
			loadStatusTable();
			if (statusCounter < agGroups.length) {
				getAirGroupStatusPerGroup(getNextGroup(nodeId), false);
			} else {
				if (groupStatusNotification) {
					groupStatusNotification.update({ progress: 100, type: 'success', message: 'AirGroup status updated' });
					setTimeout(groupStatusNotification.close, 2000);
				}
			}
		}
	});
}

function toggleAGState(nodeId, agState) {
	statusNotification = showNotification('ca-mirror-display', 'Updating AirGroup status at ' + nodeId, 'bottom', 'center', 'info');
	if (agState) {
		console.log('Disabling AirGroup at '+ nodeId);
		agState = false;
	} else {
		console.log('Enabling AirGroup at '+ nodeId);
		agState = true;
	}
	
	let nodeType = 'GROUP';
	if (nodeId.toUpperCase() === 'GLOBAL') nodeType = 'GLOBAL';

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airgroup-config/v2/node_list/'+nodeType+'/'+nodeId+'/config/general_settings/airgroup_status',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ airgroup_status: agState }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response)
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/airgroup-config/v2/node_list/{node_type}/{node_id}/config/general_settings/airgroup_status)');
				return;
			}
		}
		if (response.status === 'success') {
			if (agState) {
				showNotification('ca-mirror-display', 'AirGroup was enabled', 'bottom', 'center', 'success');
				if (nodeType === 'GLOBAL') {
					$(document.getElementById('agStateBtn')).addClass('btn-success');
					$(document.getElementById('agStateBtn')).removeClass('btn-danger');
					document.getElementById('agStateBtn').innerHTML = 'Enabled';
				} else {
					getAirGroupStatusPerGroup(nodeId, true);
				}
			} else {
				showNotification('ca-mirror-display', 'AirGroup was disabled', 'bottom', 'center', 'success');
				if (nodeType === 'GLOBAL') {
					$(document.getElementById('agStateBtn')).addClass('btn-danger');
					$(document.getElementById('agStateBtn')).removeClass('btn-success');
					document.getElementById('agStateBtn').innerHTML = 'Disabled';
				} else {
					getAirGroupStatusPerGroup(nodeId, true);
				}
			}
		}
		statusNotification.close();
	});
}

function getNextGroup(currentGroup) {
	for (let g in agGroups) {
		if (agGroups[g]['group'] === currentGroup && g < agGroups.length-1){
			let nextId = parseInt(g)+1;
			return agGroups[nextId]['group'];
		} 
	}
	return -1;
}

function loadStatusTable() {
	$('#status-table')
		.DataTable()
		.clear();
	
	var table = $('#status-table').DataTable();
	var statusKeys = Object.keys(airGroupStatuses);
	$.each(statusKeys, function() {
		var currentStatus = airGroupStatuses[this];
		let btnStatus = 'btn-outline btn-info';
		let btnString = 'Not configured';
		let btnState = true;
		if (currentStatus) {
			btnStatus = 'btn-success';
			btnString = 'Enabled';
			btnState = true;
		} else if (currentStatus == false) {
			btnStatus = 'btn-danger';
			btnString = 'Disabled';
			btnState = false;
		}
		var statusBtn = '<button class="btn btn-sm '+btnStatus+' btn-text-sm" onclick="toggleAGState(\'' + this + '\','+btnState+')">'+btnString+'</button>';
		table.row.add([this, statusBtn]);
	});
	
	$('#status-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AirGroup Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadServerTable() {
	$('#server-table')
		.DataTable()
		.clear();

	var table = $('#server-table').DataTable();

	for (let i in airGroupServers) {
		let currentServer = airGroupServers[i];
		//console.log(currentServer)
		// create simple server list:
		let apNameList = [];
		let apSerials = [];
		let apCount = 'All'
		if (currentServer['network_visibility'] && currentServer['network_visibility']['ap_list']){
			apCount = currentServer['network_visibility']['ap_list'].length;
			for (let a in currentServer['network_visibility']['ap_list']) {
				let ap = currentServer['network_visibility']['ap_list'][a];
				let foundAP = findDeviceInMonitoring(ap['serial_number']);
				if (foundAP) apNameList.push(foundAP['name']);
				else apNameList.push(ap['serial_number']);
				
				apSerials.push(ap['serial_number']);
			}
		}
		
		let disallowed = [];
		if (currentServer['role_restrictions'] && currentServer['role_restrictions']['disallowed_roles']){
			for (let a in currentServer['role_restrictions']['disallowed_roles']) {
				let role = currentServer['role_restrictions']['disallowed_roles'][a];
				disallowed.push(role['role']);
			}
		}
		
		let allowed = [];
		if (currentServer['role_restrictions'] && currentServer['role_restrictions']['allowed_roles']){
			for (let a in currentServer['role_restrictions']['allowed_roles']) {
				let role = currentServer['role_restrictions']['allowed_roles'][a];
				allowed.push(role['role']);
			}
		}
		
		table.row.add([currentServer['name'], currentServer['mac_address'], allowed.join(', '),disallowed.join(', '), '<span data-toggle="tooltip" data-placement="right" data-html="true" title="' + apNameList.join('<br>') + '">'+apCount+' APs</span>']);
		
		airGroupDisplay.push({'name':currentServer['name'], 'mac': currentServer['mac_address'], 'allowed':allowed, 'disallowed':disallowed, 'aps': apSerials})
	}

	$('#server-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

function getAirGroupServers(offset) {
	if (offset === 0) {
		airGroupServers = [];
		loadingNotification = showProgressNotification('ca-mirror-display', 'Obtaining AirGroup Servers...', 'bottom', 'center', 'info')
	}
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airgroup-config/v2/servers/servers_list?limit=20&offset='+offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/airgroup-config/v2/servers/servers_list)');
			apiErrorCount++;
			if (loadingNotification) {
				loadingNotification.update({ progress: 100, type: 'danger', message: 'Failed to retreive AirGroup Servers' });
				setTimeout(loadingNotification.close, 2000);
			}
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			if (loadingNotification) {
				loadingNotification.update({ progress: 100, type: 'danger', message: 'Failed to retreive AirGroup Servers' });
				setTimeout(loadingNotification.close, 2000);
			}
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		airGroupServers = airGroupServers.concat(response['servers_list']);
		
		offset += response.pagination_data['limit'];
		if (offset < response.pagination_data['total']) {
			if (loadingNotification) {
				var apProgress = (offset / response.pagination_data['total']) * 100;
				loadingNotification.update({ progress: apProgress });
			}
			getAirGroupServers(offset)
		} else {
			if (loadingNotification) {
				loadingNotification.update({ progress: 100, type: 'success', message: 'Retrieved AirGroup Servers' });
				setTimeout(loadingNotification.close, 2000);
			}
			loadServerTable();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AirGroup Download Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function downloadAirGroupServers() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#server-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'airGroupServers-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'airGroupServers.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildCSVData(selectedGroup, selectedSite) {
	//CSV header
	var nameKey = 'NAME';
	var macKey = 'MAC';
	var allowedKey = 'ALLOWED ROLES';
	var disallowedKey = 'DISALLOWED ROLES';
	var apKey = 'APS';

	var csvDataBuild = [];

	var table = $('#server-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var server = airGroupDisplay[this];
		csvDataBuild.push({ [nameKey]: server['name'], [macKey]: server['mac'], [allowedKey]: server['allowed'].join(';'), [disallowedKey]: server['disallowed'].join(';'), [apKey]: server['aps'].join(';')});
	});

	return csvDataBuild;
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AirGroup CSV Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function processAGCSV(results) {
	apiErrorCount = 0;
	csvData = results.data;
	csvDataCount = csvData.length;
}

function uploadAirGroupCSV() {
	$('#files').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processAGCSV,
			transformHeader: function(h) {
				return h.trim();
			},
		},
		before: function(file, inputElem) {
			csvNotification = showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (!csvData) {
				showNotification('ca-c-warning', 'No CSV data found. Try selecting a CSV document.', 'bottom', 'center', 'danger');
				return false;
			}
			// Clear error log
			clearErrorLog();
			
			if (csvNotification) csvNotification.close();
			Swal.fire({
				title: 'Replace or Append?',
				text: 'Append will add any missing Role or AP to the existing lists.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Replace',
				cancelButtonText: 'Append'
			}).then(result => {
				if (result.isConfirmed) {
					updateAirGroupServers(AGMODE.replace);
				} else {
					updateAirGroupServers(AGMODE.append);
				}
			});
			
			
		},
	});
}

function updateAirGroupServers(mode) {
	airGroupNotification = showProgressNotification('ca-mirror-display', 'Updating AirGroup Servers...', 'bottom', 'center', 'info');
	
	// Counters for notification
	serverCounter = airGroupServers.length;
	updateCounter = 0;
	delayCounter = 0;
	
	$.each(csvData, function() {

		let foundServer = null;
		let currentServer = this;		
		let separator = '|';
		
		// Find mac address in CSV entry
		let currentName = currentServer['name'];
		if (!currentName) currentName = currentServer['NAME'];
		if (!currentName) currentName = currentServer['Name'];
		
		// Find mac address in CSV entry
		let currentMac = currentServer['mac_address'];
		if (!currentMac) currentMac = currentServer['MAC'];
		if (!currentMac) currentMac = currentServer['MAC Address'];
		
		if(!currentMac) {
			logError('An AirGroup Server is missing the MAC address');
			updateCounter++;
			checkServerComplete();
			return true;
		} else if(!currentName) {
			logError('An AirGroup Server ('+currentMac+') is missing a name');
			updateCounter++;
			checkServerComplete();
			return true;
		}
		
		// Find the server if it exists already
		for (let k in airGroupServers) {
			if (currentMac === airGroupServers[k]['mac_address']) {
				foundServer = airGroupServers[k];
				break;
			}
		}
		
		if (!foundServer) {
			// didn't find an existing server to update.
			// Need to build a new server
			foundServer = {
				'mac_address': currentMac,
				'name': currentName
			};
		}
		if (!foundServer['network_visibility']) foundServer['network_visibility'] = {};
		if (!foundServer['role_restrictions']) foundServer['role_restrictions'] = {};
		
		// Find the AP List and determine the separator used in CSV entry
		let apList = currentServer['ap_list'];
		if (!apList) apList = currentServer['APs'];
		if (!apList) apList = currentServer['APS'];
		let newSerials = [];
		if (apList) {
			separator = '|';
			if (apList.includes(':')) separator = ':';
			if (apList.includes(';')) separator = ';';
			
			// Deal with AP List first
			// generate the new AP List format after splitting up the apList
			let apSerials = apList.split(separator);
			
			for (let s in apSerials) {
				newSerials.push({'serial_number':apSerials[s]});
			}
		}
		// Build the AP List
		if (mode === AGMODE.replace) foundServer['network_visibility']['ap_list'] = newSerials;
		else if (mode === AGMODE.append) {
			let existingSerials = foundServer['network_visibility']['ap_list'];		
			if (!existingSerials) existingSerials = [];	
			foundServer['network_visibility']['ap_list'] = mergeSerialNumbers(newSerials, existingSerials);
		}
		
		// Check for allowed and disallowed roles
		let allowedRoles = currentServer['allowed roles'];
		if (!allowedRoles) allowedRoles = currentServer['ALLOWED ROLES'];
		if (!allowedRoles) allowedRoles = currentServer['ALLOWED'];
		
		let disallowedRoles = currentServer['disallowed roles'];
		if (!disallowedRoles) disallowedRoles = currentServer['DISALLOWED ROLES'];
		if (!disallowedRoles) disallowedRoles = currentServer['DISALLOWED'];
		
		
		if (allowedRoles) {
			let newRoles = [];
			separator = '|';
			if (allowedRoles.includes(':')) separator = ':';
			if (allowedRoles.includes(';')) separator = ';';
			let roles = allowedRoles.split(separator);
			for (let s in roles) {
				newRoles.push({'role':roles[s]});
			}
			if (mode === AGMODE.replace) {
				foundServer['role_restrictions']['allowed_roles'] = newRoles;
			} else if (mode === AGMODE.append) {
				let existingRoles = foundServer['role_restrictions']['allowed_roles'];		
				if (!existingRoles) existingRoles = [];	
				foundServer['role_restrictions']['allowed_roles'] = mergeRoles(newRoles, existingRoles);
			}
			foundServer['role_restrictions']['disallowed_roles'] = [];
			
		} else if (disallowedRoles) {
			let newRoles = [];
			separator = '|';
			if (disallowedRoles.includes(':')) separator = ':';
			if (disallowedRoles.includes(';')) separator = ';';
			let roles = disallowedRoles.split(separator);
			for (let s in roles) {
				newRoles.push({'role':roles[s]});
			}
			if (mode === AGMODE.replace) {
				foundServer['role_restrictions']['disallowed_roles'] = newRoles;
			} else if (mode === AGMODE.append) {
				let existingRoles = foundServer['role_restrictions']['disallowed_roles'];
				if (!existingRoles) existingRoles = [];
				foundServer['role_restrictions']['disallowed_roles'] = mergeRoles(newRoles, existingRoles);
			}
			foundServer['role_restrictions']['allowed_roles'] = [];
		} else {
			// No roles configured
			if (mode === AGMODE.replace) {
				foundServer['role_restrictions']['allowed_roles'] = [];
				foundServer['role_restrictions']['disallowed_roles'] = [];
			}
		}
		
		setTimeout(putAirGroupServer, apiDelay*delayCounter, currentMac, foundServer);
		delayCounter++;
	});
	checkServerComplete();
}

function mergeSerialNumbers(serialNumbers, records) {
  const existing = new Set(records.map(r => r.serial_number));
  const missing = serialNumbers.filter(sn => !existing.has(sn.serial_number));

  return [...records, ...missing];
}

function mergeRoles(roles, records) {
  const existing = new Set(records.map(r => r.role));
  const missing = roles.filter(sn => !existing.has(sn.role));

  return [...records, ...missing];
}

function putAirGroupServer(currentMac, config) {
	
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airgroup-config/v2/servers/servers_list/' + currentMac,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify(config),
		}),
	};
	
	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (airgroup-config/v2/servers/servers_list/<mac-address>)');
			}
		}
		
		if (response['status'] !== 'success') {
			logError('The AirGroup Server "' + config['name'] + '" was not able to be updated');
			apiErrorCount++;
		}
		updateCounter++;
		checkServerComplete();
	});
}

function checkServerComplete() {
	if (airGroupNotification) {
		var serverProgress = (updateCounter / serverCounter) * 100;
		airGroupNotification.update({ progress: serverProgress });
	}
	
	if (updateCounter >= serverCounter) {
		if (airGroupNotification) {
			airGroupNotification.update({ type: 'success', message: 'Updated '+ serverCounter + ' AirGroup Server configurations'});
			setTimeout(airGroupNotification.close, 2000);
		}
		getAirGroupServers(0);
	}
}


