/*
Central Automation v1.40
Updated: 1.40
Aaron Scott (WiFi Downunder) 2024
*/

var variables = {};
var currentSerial;

var deleteCounter = 0;
var errorCounter = 0;

var variableNotification;

var gotAPs = false;
var gotSwitches = false;
var gotGateways = false;

var library = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Global functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	gotAPs = true;
	getDeviceVariables(false);
}

function loadCurrentPageSwitch() {
	gotSwitches = true;
	getDeviceVariables(false);
}

function loadCurrentPageGateway() {
	gotGateways = true;
	getDeviceVariables(false);
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template Variables Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getDeviceVariables(forceUpdate) {
	if (gotAPs && gotSwitches && gotGateways || forceUpdate) {
		switchVariables = {};
		variableNotification = showLongNotification('ca-document-copy', 'Getting device variables...', 'bottom', 'center', 'info');
		getVariablesForAllDevices(0);
	}
}

function getVariablesForAllDevices(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/template_variables?format=JSON&limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/template_variables)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var variablesText = response;

		variables = Object.assign({}, variables, response);
		
		variableTotal = Object.keys(variablesText).length;
		if (Object.keys(variablesText).length == apiGroupLimit) {
			// not an empty result - there might be more to get
			getVariablesForAllDevices(offset + apiGroupLimit);
		} else {
			if (variableNotification) {
				variableNotification.update({ message: 'All variables have been downloaded', type: 'success' });
				setTimeout(variableNotification.close, 1000);
			}
			//load table
			loadVariablesTable();
		}
	});
}

function loadVariablesTable() {
	$('#variables-table')
	.DataTable()
	.rows()
	.remove();
	var table = $('#variables-table').DataTable();
	
	$.each(Object.keys(variables), function () {
		var deviceVariables = variables[this.toString()];
		var foundDevice = findDeviceInMonitoring(this.toString());
		if (foundDevice) {
			// is a template switch
			if (foundDevice['status'] != 'Up') downSwitchCount++;
			var status = '<span style="display:none;">Up</span><i class="fa-solid fa-circle text-danger"></i>';
			if (foundDevice['status'] == 'Up') {
				status = '<span style="display:none;">Down</span><i class="fa-solid fa-circle text-success"></i>';
			}
			
			var actionBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="View Variables" onclick="showVariables(\'' +  foundDevice['serial'] + '\')"><i class="fa-solid fa-circle-info"></i></a>';
			actionBtn += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Delete Variables" onclick="deleteSelectedDeviceVariables(\'' +  foundDevice['serial'] + '\')"><i class="fa-solid fa-trash-can"></i></a>';
			
			// Add row to table
			table.row.add(['<strong>' + foundDevice['name'] + '</strong>', status, foundDevice['ip_address'], foundDevice['model'], foundDevice['serial'], foundDevice['site'], foundDevice['group_name'], foundDevice['macaddr'], actionBtn]);
		} else {
			var actionBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="View Variables" onclick="showVariables(\'' +  this.toString() + '\')"><i class="fa-solid fa-circle-info"></i></a>';
			actionBtn += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Delete Variables" onclick="deleteSelectedDeviceVariables(\'' +  this.toString() + '\')"><i class="fa-solid fa-trash-can"></i></a>';
			// Add row to table
			table.row.add(['<strong>' + this.toString() + '</strong>', '<span style="display:none;">Deleted</span><i class="fa-solid fa-circle text-muted"></i>', '-', '-', this.toString(), '-', '-', deviceVariables['_sys_lan_mac']?deviceVariables['_sys_lan_mac']:'-', actionBtn]);
		}
	});
	$('#variables-table')
	.DataTable()
	.rows()
	.draw();
	
	$('[data-toggle="tooltip"]').tooltip();
}

function showVariables(selectedSerial) {
	currentSerial = selectedSerial;
	library = {};
	library.json = {
		replacer: function(match, pIndent, pKey, pVal, pEnd) {
			var key = '<span class=json-key>';
			var val = '<span class=json-value>';
			var str = '<span class=json-string>';
			var r = pIndent || '';
			if (pKey) r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
			if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
			return r + (pEnd || '');
		},
		prettyPrint: function(obj) {
			var jsonLine = /^( *)("[\w]+": )?("[^"]*"|\[\]|[\w.+-]*)?([,[{])?$/gm;
			return JSON.stringify(obj, null, 3)
				.replace(/&/g, '&amp;')
				.replace(/\\"/g, '&quot;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(jsonLine, library.json.replacer);
		},
	};
	
	$('#deviceInfo').empty();
	var deviceVariables = variables[currentSerial];
	var foundDevice = findDeviceInMonitoring(currentSerial);
	if (foundDevice) {
		
		// Build Status dot
		var memoryUsage = (((foundDevice['mem_total'] - foundDevice['mem_free']) / foundDevice['mem_total']) * 100).toFixed(0).toString();
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (foundDevice['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + foundDevice['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
		}
		
		// Build Uptime String
		var uptimeString = '-';
		if (foundDevice['uptime'] > 0) {
			var uptime = moment.duration(foundDevice['uptime'] * 1000);
			uptimeString = uptime.humanize();
		}
		
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
		
		// Site Link to Central
		var siteName = encodeURI(foundDevice['site']);
		var siteId = getIDforSite(foundDevice['site'])
		var centralURLSite = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + siteId + '&name=' + siteName + '&cid=2&cn=Site&l=label&nc=site';
		var centralURLSiteLink = '<a href="' + centralURLSite + '" target="_blank"><strong>' + foundDevice['site'] + '</strong></a>';
		
		// Group Link to Central
		var groupName = encodeURI(foundDevice['group_name']);
		var groupId = foundDevice['group_id'];
		var centralURLGroup = centralBaseURL + '/frontend/#/DASHBOARD?cgid='+groupId+'&nc=group';
		var centralURLGroupLink = '<a href="' + centralURLGroup + '" target="_blank"><strong>' + foundDevice['group_name'] + '</strong></a>';
		
		$('#deviceInfo').append('<li>Name: <strong>' + foundDevice['name'] + '</strong></li>');
		$('#deviceInfo').append('<li>Health: '+status+'</li>');
		$('#deviceInfo').append('<li>Serial Number: <strong>' + foundDevice['serial'] + '</strong></li>');
		$('#deviceInfo').append('<li>MAC Address: <strong>' + foundDevice['macaddr'] + '</strong></li>');
		$('#deviceInfo').append('<li>IP Address: <strong>' + foundDevice['ip_address'] + '</strong></li>');
		$('#deviceInfo').append('<li>Model: <strong>' + foundDevice['model'] + '</strong></li>');
		$('#deviceInfo').append('<li>Firmware: <strong>' + foundDevice['firmware_version'] + '</strong></li>');
		$('#deviceInfo').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
		$('#wirelessInfo').append('<li>Config Group: ' + centralURLGroupLink + '</li>');
		if (foundDevice['site']) $('#deviceInfo').append('<li>Site: ' + centralURLSiteLink + '</li>');
	} else {
		// Build Status dot
		var status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="Device Not Found in Central Monitoring"><i class="fa-solid fa-circle text-muted"></i></span>';
		
		$('#deviceInfo').append('<li>Name: <strong>' + currentSerial + '</strong></li>');
		$('#deviceInfo').append('<li>Health: '+status+'</li>');
		if (deviceVariables['_sys_lan_mac']) $('#deviceInfo').append('<li>MAC Address: <strong>' + deviceVariables['_sys_lan_mac'] + '</strong></li>');
	}
	console.log(deviceVariables);
	$('#deviceVariableText').html(library.json.prettyPrint(deviceVariables));
	$('#VariablesModalLink').trigger('click');
	
	$('[data-toggle="tooltip"]').tooltip();
}

function deleteSelectedDeviceVariables(selectedSerial) {
	currentSerial = selectedSerial;
	confirmDeleteDeviceVariables();
}

function confirmDeleteDeviceVariables() {
	Swal.fire({
		title: 'Are you sure?',
		text: "This will remove the device's variables from Central",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			deleteDeviceVariables();
		}
	});
}

function deleteDeviceVariables() {
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
			access_token: localStorage.getItem('access_token')
		}),
	};
	console.log(settings.data)
	
	$.ajax(settings).done(function(response, textStatus, jqXHR) {	
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to delete') {
				apiErrorCount++;
			}
		}
	
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
			} else if (response.status !== '200') {
				logError('Variables for '+currentSerial+' were not deleted');
				showNotification('ca-bin', 'Unable to delete variables for this device', 'bottom', 'center', 'danger');
			} else {
				logInformation('Variables for '+currentSerial+' were deleted');
				showNotification('ca-bin', 'Variables for this device for deleted', 'bottom', 'center', 'success');
				$('#VariablesModal').modal('hide');
			}
		} 
	});
}

