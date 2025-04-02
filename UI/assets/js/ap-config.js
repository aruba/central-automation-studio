/*
Central Automation v1.45
Updated: 1.45
© Aaron Scott (WiFi Downunder) 2025
*/

var deviceInfo = {};
var dirtyConfig = {};
var dirtyCounter = 0;
var dirtyTotal = 0;
var exportRows = [];

var dirtyNotification;

var loadedAPs = false;
var loadedSites = false;
var loadedGroups = false;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAPBegin() {
	loadedAPs = false;
}

function loadCurrentPageGroupBegin() {
	loadedGroups = false;
}

function loadCurrentPageSiteBegin() {
	loadedSites = false;
}

function loadCurrentPageAP() {
	loadedAPs = true;
	if (loadedAPs && loadedGroups && loadedSites) filterTable();
}

function loadCurrentPageGroup() {
	$('#groupselector').prepend($('<option value="_all_" selected>All Groups</option>')); 
	$('#groupselector').selectpicker('refresh');
	loadedGroups = true;
	if (loadedAPs && loadedGroups && loadedSites) filterTable();
}

function loadCurrentPageSite() {
	$('#siteselector').prepend($('<option value="_all_" selected>All Sites</option>')); 
	$('#siteselector').selectpicker('refresh');
	loadedSites = true;
	if (loadedAPs && loadedGroups && loadedSites) filterTable();
}

function filterTable() {
	var selectedGroup = document.getElementById('groupselector').value;
	var selectedSite = document.getElementById('siteselector').value;
	
	if (loadedAPs) {
		dirtyCounter = 0;
		dirtyTotal = 0;
		deviceInfo = {};
	
		var fullAPList = getAPs();
		$.each(fullAPList, function() {
			// Check APs against filter options
			if (selectedGroup === "_all_" && selectedSite === "_all_") {
				// Add the device for the APs list
				deviceInfo[this['serial']] = this;
				if (this['status'] == "Up") dirtyTotal++;
			} else if (selectedGroup === this['group_name'] && (selectedSite === "_all_" || selectedSite === this['site'])) {
				// Add the device for the APs list
				deviceInfo[this['serial']] = this;
				if (this['status'] == "Up") dirtyTotal++;
			} else if (selectedSite === this['site'] && (selectedGroup === "_all_" || selectedGroup === this['group_name'])) {
				// Add the device for the APs list
				deviceInfo[this['serial']] = this;
				if (this['status'] == "Up") dirtyTotal++;
			}
			
		});
	
		loadDevicesTable();
	} else {
		showNotification('ca-ap-icon', 'Please wait for the AP list to be obtained', 'bottom', 'center', 'warning');
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadDevicesTable() {
	$('#status-table')
		.DataTable()
		.rows()
		.remove();
		
	exportRows = [];
	
	var table = $('#status-table').DataTable();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;
		
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
		
		// Make AP Name as a link to Central
		var name = encodeURI(device['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
		var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + device['serial'] + '?casn=' + device['serial'] + '&cdcn=' + name + '&nc=access_point';
		

		// Check for Config status data
		var configStatus = '';
		var configString = '';
		var configStatusString = 'N/A'
		if (dirtyConfig[device['serial']]) {
			if (dirtyConfig[device['serial']] === '-') {
				configStatusString = 'Synchronized';
				configStatus = 'Synchronized';
			} else {
				configStatusString = 'Unsynchronized';
				configStatus += 'Unsynchronized ' + '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Config Status Details" onclick="displayDirtyConfig(\'' +  device['serial'] + '\', true)"><i class="fa-solid fa-circle-info"></i></a> ';
				configString = dirtyConfig[device['serial']];
			}
		}

		// Add AP to table		
		table.row.add([device['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'] ? device['status'] : 'down', device['ip_address']?device['ip_address']:'', device['model'], device['serial'], device['macaddr'], device['group_name'], device['site'], device['firmware_version'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, configStatus]);
		
		// Save data for CSV export
		exportRows.push({name:device['name'], status:device['status'] ? device['status']:'Down', ip:device['ip_address']?device['ip_address']:'', model:device['model'], serial:device['serial'], mac:device['macaddr'], group:device['group_name'], site:device['site'], firmware:device['firmware_version'], uptime:uptimeString, configStatus:configStatusString, configString})
	}
	$('#status-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

function getConfigStatus() {
	dirtyNotification = showProgressNotification('ca-priority-normal', 'Checking config status...', 'bottom', 'center', 'info');
	dirtyConfig = {};
	
	var i=0;
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;
		if (device['status'] == 'Up') {
			setTimeout(getDirtyDiff, apiDelay*i, device['serial']);
		}
	}
}

function getDirtyDiff(currentAP) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/dirty_diff/' + currentAP+ '?limit=20',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (configuration/v1/dirty_diff/<serial>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.count > 0) {
			dirtyConfig[currentAP] = response.dirty_diff_list[0]['dirty_diff'].split('--------------------------------------------')[0];
		} else {
			dirtyConfig[currentAP] = '-';
		}
		
		dirtyCounter++;
		var dirtyProgress = (dirtyCounter / dirtyTotal) * 100;
		dirtyNotification.update({ progress: dirtyProgress });
		if (dirtyCounter >= dirtyTotal) {
			if (dirtyNotification) {
				dirtyNotification.update({ message: 'Finished obtaining event details', type: 'success' });
				setTimeout(dirtyNotification.close, 1000);
			}
			loadDevicesTable();
		}
	});
}

function downloadCSV() {
	csvData = buildCSVData();
	if (csvData.length > 0) {
		var csv = Papa.unparse(csvData);
		var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	
		var csvURL = window.URL.createObjectURL(csvBlob);
	
		var csvLink = document.createElement('a');
		csvLink.href = csvURL;
	
		var table = $('#status-table').DataTable();
		var filter = table.search();
		if (filter !== '') csvLink.setAttribute('download', 'config-status-' + filter.replace(/ /g, '_') + '.csv');
		else csvLink.setAttribute('download', 'config-status.csv');
	
		csvLink.click();
		window.URL.revokeObjectURL(csvLink);
	} else {
		showNotification('ca-file-csv', 'There are no APs to download', 'bottom', 'center', 'warning');
	}
	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	
	//CSV header
	var nameKey = 'DEVICE NAME';
	var statusKey = 'STATUS';
	var ipKey = 'IP ADDRESS';
	var modelKey = 'MODEL';
	var serialKey = 'SERIAL';
	var macKey = 'MAC ADDRESS';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var firmwareKey = 'FIRMWARE';
	var uptimeKey = 'UPTIME';
	var configStatusKey = 'CONFIG STATUS';
	var diffKey = 'CONFIG DIFFERENCE';

	var csvDataBuild = [];

	var table = $('#status-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = exportRows[this.toString()];
		
		csvDataBuild.push({
			[nameKey]: row['name'],
			[statusKey]: row['status'],
			[ipKey]: row['ip'],
			[modelKey]: row['model'],
			[serialKey]: row['serial'],
			[macKey]: row['mac'],
			[groupKey]: row['group'],
			[siteKey]: row['site'],
			[firmwareKey]: row['firmware'],
			[uptimeKey]: row['uptime'],
			[configStatusKey]: row['configStatus'],
			[diffKey]: row['configString']
		});
	});

	return csvDataBuild;
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Dirty Config Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function displayDirtyConfig(currentSerial) {
	var configString = dirtyConfig[currentSerial];
	var currentAP = findDeviceInMonitoring(currentSerial);
	document.getElementById('detailHeader').innerHTML = 'Config Difference for ' + currentAP.name
	document.getElementById('detailText').innerHTML = configString.trim();
	$('#DetailModalLink').trigger('click');
}
