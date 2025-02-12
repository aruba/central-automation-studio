/*
Central Automation v1.7.5
Updated: 1.14.
Aaron Scott (WiFi Downunder) 2021-2025
*/

var addNotification;
var devicesArray = [];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function processInput() {
	var bulkData = document.getElementById('scanData').value;
	if (bulkData === '') {
		clearInput();
	} else {
		var newData = bulkData.split('\n');
		console.log(newData)
		$.each(newData, function() {
			var currentData = this.toString().toUpperCase();
			currentData = currentData.replaceAll(':', '');
			console.log(currentData);
			if (currentData.length == 12 && isHex(currentData)) {
				var macAddress = cleanMACAddress(currentData)
				if (document.getElementById('deviceMac').value === '' || document.getElementById('deviceMac').value === macAddress) document.getElementById('deviceMac').value = macAddress;
				else document.getElementById('bleMac').value = macAddress;
			}
			if (currentData.length == 10 && !currentData.includes('-')) {
				// should be serial number
				document.getElementById('deviceSerial').value = currentData;
			}
		});
	}
}

function clearInput() {
	document.getElementById('deviceSerial').value = '';
	document.getElementById('deviceMac').value = '';
	document.getElementById('bleMac').value = '';
	document.getElementById("scanData").value = '';
	$('#scanData').focus();
}

function addNewDevice() {
	if (document.getElementById('deviceSerial').value && document.getElementById('deviceMac').value) {
		devicesArray.push({serial: document.getElementById('deviceSerial').value, macaddr: document.getElementById('deviceMac').value, ble: document.getElementById('bleMac').value, group: document.getElementById('groupselector').value, site: document.getElementById('siteselector').value});
		reloadTable();
	}
}

function reloadTable() {
	$('#device-table')
	.DataTable()
	.rows()
	.remove();
	
	var table = $('#device-table').DataTable();
	for (var i=0; i<devicesArray.length;i++) {
		var device = devicesArray[i];
		var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Remove Device" onclick="removeDevice(\'' + i + '\')"><i class="fa-solid fa-trash-can"></i></a> ';
		table.row.add([device.serial, device.macaddr, device.ble, device.group, device.site, actionBtns]);
	}
	
	$('#device-table')
	.DataTable()
	.rows()
	.draw();
}

function removeDevice(deviceToRemove) {
	devicesArray = devicesArray.slice(1);
	reloadTable();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDeviceCSV() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#device-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'newDevices-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'newDevices.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	//CSV header
	var nameKey = 'DEVICE NAME';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var labelKey = 'LABELS';
	var licenseKey = 'LICENSE';
	var zoneKey = 'ZONE';
	var swarmKey = 'SWARM MODE';
	var rfKey = 'RF PROFILE';
	var installationKey = 'INSTALLATION TYPE';
	var radio0Key = 'RADIO 0 MODE';
	var radio1Key = 'RADIO 1 MODE';
	var radio2Key = 'RADIO 2 MODE';
	var dualKey = 'DUAL 5GHZ MODE';
	var splitKey = 'SPLIT 5GHZ MODE';
	var flexKey = 'FLEX DUAL BAND';
	var ipKey = 'IP ADDRESS';
	var smKey = 'SUBNET MASK';
	var dgwKey = 'DEFAULT GATEWAY';
	var dnsKey = 'DNS SERVER';
	var domainKey = 'DOMAIN NAME';
	var timezoneKey = 'TIMEZONE';

	var csvDataBuild = [];

	var table = $('#device-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = devicesArray[this];		
		csvDataBuild.push({ [nameKey]: device['name'] ? device['name'] : device['macaddr'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [groupKey]: device['group'], [siteKey]: device['site'], [labelKey]: '', [licenseKey]: '', [zoneKey]:'', [swarmKey]:'', [rfKey]:'', [installationKey]:'', [radio0Key]:'', [radio1Key]:'', [radio2Key]:'', [dualKey]:'', [splitKey]:'', [flexKey]:'', [ipKey]:'', [smKey]:'', [dgwKey]:'', [dnsKey]:'', [domainKey]:'', [timezoneKey]:'' });
	});

	return csvDataBuild;
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Adding devices to GLP/Greenlake
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function bulkAddDevices() {
	csvData = buildCSVData();
	addDevices();
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Adding devices to GLP/Greenlake
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function addSingleDevice() {
	addNotification = showLongNotification('ca-c-add', 'Adding device...', 'bottom', 'center', 'info');
	var currentSerial = document.getElementById('deviceSerial').value.trim();
	var devices = [];
	devices.push({ mac: cleanMACAddress(document.getElementById('deviceMac').value), serial: currentSerial });
	
	var base_url = localStorage.getItem('base_url');
	var currentClusterName = 'Internal';
	if (base_url) currentClusterName = getClusterName(base_url);

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify(devices)
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log('Add device response: ' + JSON.stringify(response));

		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to add') {
				errorMsg = 'No devices to add';
			}
		}

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/devices)');
			}
		}

		// check for erroring devices
		var errorMsg = '';
		if (response.code && response.code === 'ATHENA_ERROR_NO_DEVICE') {
			if (response.extra.message.invalid_device && response.extra.message.invalid_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.invalid_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is already added to your GreenLake account';
					} else if (this.status === 'INVALID_MAC_SN') {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is invalid';
					} else {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is invalid';
					}
				});
			}
			if (response.extra.message.blocked_device && response.extra.message.blocked_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.blocked_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is already added to your GreenLake account';
					} else if (this.status === 'ALREADY_PROVISIONED_TO_ANOTHER_CUSTOMER') {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is already claimed by a different GreenLake Customer';
					} else {
						errorMsg = 'Device with Serial number "' + currentSerial + '" is blocked from being added to your GreenLake account';
					}
				});
			}
		}

		if (errorMsg !== '') {
			logError(errorMsg);
			if (addNotification) {
				addNotification.update({ type: 'danger', message: errorMsg });
				setTimeout(addNotification.close, 5000);
			}
		} else {
			if (addNotification) {
				addNotification.update({ type: 'success', message: 'Device added successfully to GLP' });
				setTimeout(addNotification.close, 2000);
			}
			clearInput();
		}
	});
}

function switchMacs() {
	var deviceMac = document.getElementById('deviceMac').value
	var bleMac = document.getElementById('bleMac').value
	document.getElementById('deviceMac').value = bleMac;
	document.getElementById('bleMac').value = deviceMac;
}

function isHex(str) {
	regexp = /^[0-9A-F]+$/;
	if (regexp.test(str)) {
		return true;
	} else {
		return false;
	}
}
