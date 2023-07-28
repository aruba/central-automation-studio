/*
Central Automation v1.18
Updated: v1.23
Copyright Aaron Scott (WiFi Downunder) 2023
*/

var deviceList = [];
var filteredList = [];
var rfProfiles = {};

var antennas = {
	'AP-ANT-1W': { two: 3.8, five: 5.8 },
	'AP-ANT-19': { two: 3, five: 6 },
	'AP-ANT-20W': { two: 2, five: 2 },
	'AP-ANT-13B': { two: 2.2, five: 4 },
	'AP-ANT-16': { two: 3.9, five: 4.7 },
	'AP-ANT-40': { two: 4, five: 5 },
	'AP-ANT-25A': { two: 5, five: 5 },
	'AP-ANT-35A': { two: 5, five: 5 },
	'AP-ANT-45': { two: 4.5, five: 5.5 },
	'AP-ANT-28': { two: 7.5, five: 7.5 },
	'AP-ANT-38': { two: 7.5, five: 7.5 },
	'AP-ANT-48': { two: 8.5, five: 8.5 },
	'AP-ANT-32': { two: 2, five: 4 },
	'AP-ANT-22': { two: 2, five: 4 },
	'ANT-3X3-D100': { two: 5, five: 5 },
	'ANT-3X3-D608': { two: 7.5, five: 7.5 },
	'ANT-3X3-2005': { two: 5 },
	'ANT-3X3-5005': { five: 5 },
	'ANT-3X3-5010': { five: 10 },
	'ANT-3X3-5712': { five: 11.5 },
	'ANT-2X2-2005': { two: 5 },
	'ANT-2X2-5005': { five: 5 },
	'ANT-2X2-2314': { two: 14 },
	'ANT-2X2-5314': { five: 14 },
	'ANT-2X2-5010': { five: 10 },
	'ANT-2X2-2714': { two: 14 },
};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Inventory Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	loadAntennas();

	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
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
				table.row.add([monitoringInfo.name ? '<strong>' + monitoringInfo.name + '</strong>' : '<strong>' + this.macaddr.toLowerCase() + '</strong>', this.serial, this.macaddr, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '']);

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

	var csvDataBuild = [];

	var table = $('#inventory-table').DataTable();
	console.log(table.rows({ filter: 'applied' }));
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
		}
	});

	return csvDataBuild;
}
