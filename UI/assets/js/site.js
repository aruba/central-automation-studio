/*
Central Automation v1.46
Updated: 
Aaron Scott (WiFi Downunder) 2021-2025
*/

var selectedDevices = {};
var deviceInfo = {};
var disableChoice = 'all'
var mode24;

var fullAPList = [];
var apDetailsList = [];
var uplinkCounter = 0;
var uplinkNotification;
var deviceDisplay = [];
var individualUplinks = {};

var showSuboptimal = false;


const nameKey = 'AP NAME';
const macKey = 'MAC';
const portKey = 'PORT';
const adminKey = 'ADMIN STATE';
const opKey = 'OPERATIONAL STATE';
const speedKey = 'SPEED';
const duplexKey = 'DUPLEX';

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function disable24RadiosForSite() {
	selectedDevices = {};
	mode24 = 'disable';
	document.getElementById('modeSelector').hidden = true;
	document.getElementById('modeHr').hidden = true;
	document.getElementById('button24').innerHTML = 'Disable 2.4GHz Radios'
	$('#allAP').prop('checked', true).trigger('click');
	$('#SelectedDevicesModelLink').trigger('click');
	getSiteAPs();
}

function enable24RadiosForSite() {
	selectedDevices = {};
	mode24 = 'enable';
	document.getElementById('modeSelector').hidden = true;
	document.getElementById('modeHr').hidden = true;
	document.getElementById('button24').innerHTML = 'Enable 2.4GHz Radios'
	$('#allAP').prop('checked', true).trigger('click');
	$('#SelectedDevicesModelLink').trigger('click');
	getSiteAPs();
}

function set24ModeForSite() {
	selectedDevices = {};
	mode24 = 'mode';
	document.getElementById('modeSelector').hidden = false;
	document.getElementById('modeHr').hidden = false;
	document.getElementById('button24').innerHTML = 'Configure 2.4GHz Radio Mode'
	$('#allAP').prop('checked', true).trigger('click');
	$('#SelectedDevicesModelLink').trigger('click');
	getSiteAPs();
}

function apDisableChange(apChoice) {
	if (apChoice.value === "all") {
		disableChoice = 'all';
		document.getElementById('apTable').hidden = true;
		document.getElementById('apHr').hidden = true;
	} else {
		disableChoice = 'selected'
		document.getElementById('apTable').hidden = false;
		document.getElementById('apHr').hidden = false;
	}
}

function getSiteAPs() {
	deviceInfo = {};
	var currentSite = document.getElementById('siteselector').value;
	var fullAPList = getAPsForSite(currentSite);
	$.each(fullAPList, function() {
		// Add the device for the APs list
		deviceInfo[this['serial']] = this;
	});
	loadDevicesTable(false);
}

function loadCurrentPageAP() {
	getDevices();
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedDevices(serial) {
	var rowSelected = document.getElementById(serial).checked;
	if (!rowSelected) document.getElementById('device-select-all').checked = false;

	if (selectedDevices[serial] && !rowSelected) delete selectedDevices[serial];
	else selectedDevices[serial] = serial;
}

function selectAllDevices() {
	var checkBoxChecked = false;
	if (Object.keys(selectedDevices).length < Object.keys(deviceInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(deviceInfo)) {
			if (!selectedDevices[key]) selectedDevices[key] = key;
		}
	} else {
		selectedDevices = {};
	}

	loadDevicesTable(checkBoxChecked);
}

function loadDevicesTable(checked) {
	$('#selected-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')" checked>';

		// Build Status dot
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}

		// Add VC Cluster to table
		var table = $('#selected-table').DataTable();
		table.row.add([checkBoxString, '<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['group_name'], device['site'], device['firmware_version']]);
	}
	$('#selected-table')
		.DataTable()
		.rows()
		.draw();
}

function getSelectedAP() {
	var serialKey = 'SERIAL';
	var csvDataBuild = [];
	
	if (disableChoice === 'all') {
		// Rebuild the CSV only having site APs
		var currentSite = document.getElementById('siteselector').value;
		var fullAPList = getAPsForSite(currentSite);
		$.each(fullAPList, function() {
			csvDataBuild.push({ [serialKey]: this.serial });
		});
	} else if (disableChoice === 'selected') {
		// Rebuild the CSV only having selected APs
		var deviceSerials = Object.keys(selectedDevices);
		$.each(deviceSerials, function() {
			csvDataBuild.push({ [serialKey]: this });
		});
	}
	
	var csvDataBlob = {};
	csvDataBlob['data'] = csvDataBuild;
	processCSV(csvDataBlob);
	
	if (mode24 === 'disable') {
		logStart('Disabling 2.4GHz radios...');
		disable24radios();
	} else if (mode24 === 'enable') {
		logStart('Enabling 2.4GHz radios...');
		enable24radios();
	} else if (mode24 === 'mode') {
		var selectedMode = document.getElementById('radioModeSelector').value;
		logStart('Enabling 2.4GHz '+titleCase(selectedMode)+' Mode...');
		set24RadioMode(selectedMode);
	}
}

function getAPEthernetDetails() {
	uplinkCounter = 0;
	
	$('#ap-ethernet-table')
		.DataTable()
		.rows()
		.remove();
	$('#ap-ethernet-table')
		.DataTable()
		.clear();
	$('#ap-ethernet-table')
		.DataTable()
		.rows()
		.draw();
	
	deviceDisplay = [];
	individualUplinks = [];
	
	var currentSite = document.getElementById('siteselector').value;
	fullAPList = getAPsForSite(currentSite);
	if (fullAPList.length == 0) {
		showNotification('ca-cable', 'No APs were found in the selected Site', 'bottom', 'center', 'warning')
	} else {
		uplinkNotification = showProgressNotification('ca-cable', 'Checking AP Ethernet Information of every AP at '+currentSite+'...', 'bottom', 'center', 'info');
		var i=0;
		$.each(fullAPList, function() {
			setTimeout(getAPDetails, i*apiDelay, this['serial'])
			i++;
		});
		document.getElementById('apEthernetTitle').innerHTML = 'AP Ethernet Information at '+currentSite
		$('#APEthernetModalLink').trigger('click');
	}
}

function show100() {
	$('#ap-ethernet-table')
		.DataTable()
		.rows()
		.remove();
	$('#ap-ethernet-table')
		.DataTable()
		.clear();
	$('#ap-ethernet-table')
		.DataTable()
		.rows()
		.draw();
	
	deviceDisplay = [];
	individualUplinks = [];
	
	$.each(apDetailsList, function() {
		loadAPDetailsUI(this);
	})
}

function getAPDetails(currentSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/aps/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	/* $.ajax returns a promise*/
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
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
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			
			var ap = response;
			apDetailsList.push(ap);
			loadAPDetailsUI(ap)
			
			
			uplinkCounter++;
			var apProgress = (uplinkCounter / fullAPList.length) * 100;
			uplinkNotification.update({ progress: apProgress });
			
			if (uplinkCounter == fullAPList.length) {
				uplinkNotification.close();
			}
			$('[data-toggle="tooltip"]').tooltip();
		}
	});
}

function loadAPDetailsUI(ap) {
	var statusString = ap['status'];
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	var deviceUp = true;
	if (ap['status'] == 'Up') {
		status = '<i class="fa-solid fa-circle text-success"></i>';
	} else if ('sleep_status' in ap && ap['sleep_status'] == true) {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="AP is in Power Save"><i class="fa-solid fa-circle text-purple"></i></span>';
		statusString = 'Power-Save';
	} else {
		downAPCount++;
		deviceUp = false;
	}
	
	var name = encodeURI(ap['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
	var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
	
	var macAddresses = [];
	var ports = [];
	var admin_state = [];
	var operational_state = [];
	var link_speed = [];
	var duplex_mode = [];
	var subOptimal = false;
	var tempUplinks = [];
	$.each(ap.ethernets, function() {
		macAddresses.push(cleanMACAddress(this.macaddr));
		ports.push(this.name);
		if (this.admin_state === "Up") admin_state.push('<i class="fa-solid fa-circle text-success"></i>');
		else admin_state.push('<i class="fa-solid fa-circle text-danger"></i>');
		if (this.operational_state === "Up") operational_state.push('<i class="fa-solid fa-circle text-success"></i>');
		else operational_state.push('<i class="fa-solid fa-circle text-danger"></i>');
		if (this.link_speed < 1000) {
			link_speed.push('<span style="color:red;">'+this.link_speed+'</span>');
			subOptimal = true;
		}
		else link_speed.push(this.link_speed);
		duplex_mode.push(this.duplex_mode);
		
		tempUplinks.push({[nameKey]: ap['name'], [macKey]:cleanMACAddress(this.macaddr), [portKey]:this.name, [adminKey]: this.admin_state, [opKey]: this.operational_state, [speedKey]: this.link_speed, [duplexKey]:this.duplex_mode });
	});
	individualUplinks[ap.serial] = tempUplinks;
				
	// Add row to table
	var table = $('#ap-ethernet-table').DataTable();
	if ((!document.getElementById('show100').checked) || ((document.getElementById('show100').checked) && subOptimal)) {
		table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, macAddresses.join('<br>'), ports.join('<br>'), admin_state.join('<br>'), operational_state.join('<br>'), link_speed.join(' <br>'), duplex_mode.join('<br>')]);
		
		deviceDisplay.push(ap.serial);
	}
	
	$('#ap-ethernet-table')
		.DataTable()
		.rows()
		.draw();
}

function downloadUplinks() {
	
	var currentSite = document.getElementById('siteselector').value;
	var csvDataBuild = [];
	
	var table = $('#ap-ethernet-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = deviceDisplay[this];
		var rowData = individualUplinks[device];
		
		$.each(rowData, function() {
			csvDataBuild.push(this)
		})
	});
	
	var csv = Papa.unparse(csvDataBuild);
	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	var csvURL = window.URL.createObjectURL(csvBlob);
	var csvLink = document.createElement('a');
	csvLink.href = csvURL;
	
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'ap-uplinks-' +currentSite+ '-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'ap-uplinks-' +currentSite+'.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

