/*
Central Automation v1.18
Updated: v1.23
Copyright Aaron Scott (WiFi Downunder) 2023
*/

var deviceList = [];
var filteredList = [];
var rfProfiles = {};


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Inventory Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	loadAntennas();

	$.when(updateInventory(false)).then(function() {
		deviceList = getFullInventory();
	});
	$('[data-toggle="tooltip"]').tooltip();
}

function loadGroupInventory() {
	// Empty the table
	$('#inventory-table')
		.DataTable()
		.rows()
		.remove();

	// build table data
	filteredList = [];
	$.each(deviceList, function() {
		if (this.device_type === 'AP') {
			var monitoringInfo = findDeviceInMonitoring(this.serial);
			// Add row to table
			var table = $('#inventory-table').DataTable();
			if (monitoringInfo && monitoringInfo.group_name === document.getElementById('groupselector').value) {
				var status = '<i class="fa-solid fa-circle text-danger"></i>';
				if (monitoringInfo.status == 'Up') {
					status = '<i class="fa-solid fa-circle text-success"></i>';
				}
				table.row.add([monitoringInfo.name ? '<strong>' + monitoringInfo.name + '</strong>' : '<strong>' + this.macaddr.toLowerCase() + '</strong>', this.serial, this.macaddr, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', monitoringInfo.labels ? monitoringInfo.labels.join(', ') : '']);

				filteredList.push(monitoringInfo);
			}
		}
	});

	$('#inventory-table')
		.DataTable()
		.rows()
		.draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Loading Data
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getAPsforGroup() {
	if (document.getElementById('groupselector').value) {
		loadGroupInventory();
	}
}

function loadRFProfiles() {
	showNotification('ca-router', 'Obtaining RF Profiles...', 'bottom', 'center', 'info');

	var url = '/configuration/v1/dot11a_radio_profiles/';
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + url + document.getElementById('groupselector').value,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (' + url + ')');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error')) {
			//console.log(response);
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			$.each(response, function() {
				//console.log(this);
				$('#radioSelector').append($('<option>', { value: this.name, text: this.name }));
				rfProfiles[this.name] = this;
				if ($('#radioSelector').length != 0) {
					$('#radioSelector').selectpicker('refresh');
				}
			});
			showNotification('ca-router', 'RF Profiles loaded', 'bottom', 'center', 'success');
		}
	});
}

function profileSelected() {
	document.getElementById('profileDetails').hidden = false;
	var profileDetails = rfProfiles[document.getElementById('radioSelector').value];
	console.log(profileDetails);
	$('#profileDetailsTooltip').attr('data-original-title', 'Tx Power: ' + profileDetails.min_tx_power + '/' + profileDetails.max_tx_power + '<br>Allowed Channels: ' + profileDetails.allowed_channels + '<br>Channel Width: ' + profileDetails.ch_bw_range.join('/'));
	$('[data-toggle="tooltip"]').tooltip();
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Opening Modals 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function openProfileBulkConfig() {
	// Clear out old RF Profiles
	document.getElementById('profileDetails').hidden = true;
	select = document.getElementById('radioSelector');
	if (select) select.options.length = 0;
	$('#radioSelector').selectpicker('refresh');
	loadRFProfiles();

	$('#BulkProfileConfigModalLink').trigger('click');
}

function openRadioBulkConfig() {
	$('#BulkRadioConfigModalLink').trigger('click');
}

function openAntennaBulkConfig() {
	$('#BulkAntennaConfigModalLink').trigger('click');
}

function openPOEBulkConfig() {
	$('#BulkPOEConfigModalLink').trigger('click');
}

function openAP1XBulkConfig() {
	$('#BulkAP1XModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Antenna Action 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function updateAntennaGains() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will configure all external antenna APs shown in the table',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			applyAntennaBulkChanges();
		}
	});
}

function applyAntennaBulkChanges() {
	// Build CSV with selected group name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(manualGroup, 'antenna');

	processCSV(csvDataBlob);
	// Move devices to the selected Group
	setAntennaGain();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	RF Profile Action 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function updateRFProfile() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will configure the RF Profile for all APs shown in the table',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			applyProfileBulkChanges();
		}
	});
}

function applyProfileBulkChanges() {
	// Build CSV with selected group name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(manualGroup, 'rfprofile');

	processCSV(csvDataBlob);
	// Move devices to the selected Group
	setRFProfile();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	POE Action 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function updatePOEOpt() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will configure the POE Optimization for all APs shown in the table',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			applyPOEBulkChanges();
		}
	});
}

function applyPOEBulkChanges() {
	logStart('Configuring devices for POE Optimization...');
	// Build CSV with selected group name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(manualGroup, 'poe');

	processCSV(csvDataBlob);
	// Move devices to the selected Group
	setPOEOptimization();
	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AP1x Action 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function updateAP1X() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will configure the AP1x PEAP Credentials for all APs shown in the table',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			applyAP1xBulkChanges();
		}
	});
}

function applyAP1xBulkChanges() {
	logStart('Configuring devices AP1x PEAP Credentials...');
	// Build CSV with selected group name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(manualGroup, 'ap1x');

	processCSV(csvDataBlob);
	// Move devices to the selected Group
	setAP1XCredentials();
	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData(selectedGroup, mode) {
	//CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var antenna0Key = 'RADIO 0 GAIN';
	var antenna1Key = 'RADIO 1 GAIN';
	var antenna2Key = 'RADIO 2 GAIN';
	var rfProfileKey = 'RF PROFILE';
	var poeOptKey = 'POE OPT';
	var ap1xUsernameKey = 'AP1X USERNAME';
	var ap1xPasswordKey = 'AP1X PASSWORD';
	

	var csvDataBuild = [];

	var table = $('#inventory-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = filteredList[this];
		// Find monitoring data if there is any
		if (mode === 'antenna') {
			if (device['model'].match(/^..4.*$/gi) || device['model'].match(/^..8.*$/gi)) {
				csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [antenna0Key]: document.getElementById('antennaGain0').value, [antenna1Key]: document.getElementById('antennaGain1').value });
			}
		} else if (mode === 'rfprofile') {
			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [rfProfileKey]: document.getElementById('radioSelector').value });
		} else if (mode === 'poe') {
			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [poeOptKey]: document.getElementById('poeopt').checked });
		} else if (mode === 'ap1x') {
			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [ap1xUsernameKey]: document.getElementById('ap1xUsername').value, [ap1xPasswordKey]: document.getElementById('ap1xPassword').value });
		}
	});

	return csvDataBuild;
}
