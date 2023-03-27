/*
Central Automation v1.7
Updated: 1.21
Aaron Scott (WiFi Downunder) 2023
*/

var selectedClusters = {};
var selectedDevices = {};
var clusterInfo = {};
var deviceInfo = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAP() {
	getDevices();
	$('[data-toggle="tooltip"]').tooltip();
}

function getDevices() {
	selectedClusters = {};

	var fullAPList = getAPs();
	clusterInfo = {};
	$.each(fullAPList, function() {
		var swarmID = this['swarm_id'];

		// If this AP is in a swarm/cluster
		if (swarmID) {
			// Check if this swarm has been seen before
			if (!clusterInfo[swarmID]) {
				clusterInfo[swarmID] = [];
			}

			// Add serial to the list that matches the swarm_id.
			var devices = clusterInfo[swarmID];
			devices.push(this);
			clusterInfo[swarmID] = devices;
		}

		// Add the device for the APs list
		deviceInfo[this['serial']] = this;
	});

	loadClusterTable(false);
	loadDevicesTable(false);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedClusters(swarmID) {
	var rowSelected = document.getElementById(swarmID).checked;
	if (!rowSelected) document.getElementById('cluster-select-all').checked = false;

	if (selectedClusters[swarmID] && !rowSelected) delete selectedClusters[swarmID];
	else selectedClusters[swarmID] = swarmID;
}

function selectAllClusters() {
	var checkBoxChecked = false;
	if (Object.keys(selectedClusters).length < Object.keys(clusterInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(clusterInfo)) {
			if (!selectedClusters[key]) selectedClusters[key] = key;
		}
	} else {
		selectedClusters = {};
	}

	loadClusterTable(checkBoxChecked);
}

function loadClusterTable(checked) {
	$('#cluster-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(clusterInfo)) {
		var deviceList = value;

		// Build checkbox using swarm_id as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')" checked>';

		// Add VC Cluster to table
		var table = $('#cluster-table').DataTable();
		table.row.add([key, checkBoxString, '<strong>' + deviceList[0]['swarm_name'] + '</strong>', deviceList.length, deviceList[0]['group_name'], deviceList[0]['site'], deviceList[0]['firmware_version']]);
	}
	$('#cluster-table')
		.DataTable()
		.rows()
		.draw();
}

function rebootSelectedClusters() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'All selected Virtual Controller Clusters will be rebooted',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#23CCEF',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, reboot them!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmedClusterReboot();
		}
	});
}

function confirmedClusterReboot() {
	var rebootedClusters = 0;
	var rebootErrors = 0;
	for (const [key, value] of Object.entries(selectedClusters)) {
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/device_management/v1/swarm/' + key + '/action/reboot_swarm',
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(response) {
			//console.log("Cluster Reboot response: "+JSON.stringify(response));
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/device_management/v1/swarm/<CLUSTER_ID>/action/reboot_swarm)');
					return;
				}
			}
			if (response['status'] && response['status'] === 'success') {
				rebootedClusters++;
			} else {
				rebootErrors++;
			}

			// check if finished
			if (rebootedClusters + rebootErrors == Object.keys(selectedClusters).length) {
				if (rebootErrors > 0) {
					Swal.fire({
						title: 'Reboot Failure',
						text: 'Some or all devices failed to be rebooted',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Reboot Success',
						text: 'All Virtual Controller clusters were rebooted',
						icon: 'success',
					});
				}
			}
		});
	}
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
	$('#device-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')" checked>';

		// Build Status dot
		var status = '<i class="fa fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<i class="fa fa-circle text-success"></i>';
		}

		// Add VC Cluster to table
		var table = $('#device-table').DataTable();
		table.row.add([checkBoxString, '<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['group_name'], device['site'], device['firmware_version']]);
	}
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
}

function rebootSelectedDevices() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'All selected devices will be rebooted',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#23CCEF',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, reboot them!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmedDeviceReboot();
		}
	});
}

function confirmedDeviceReboot() {
	var rebootedDevices = 0;
	var rebootErrors = 0;
	for (const [key, value] of Object.entries(selectedDevices)) {
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/device_management/v1/device/' + key + '/action/reboot',
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(response) {
			//console.log('Device Reboot response: ' + JSON.stringify(response));
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/device_management/v1/device/<SERIAL>/action/reboot)');
					return;
				}
			}
			if (response['state'] && response['state'].toLowerCase() === 'success') {
				rebootedDevices++;
			} else {
				rebootErrors++;
				if (response['description']) logError(response['description']);
			}

			// check if finished
			if (rebootedDevices + rebootErrors == Object.keys(selectedDevices).length) {
				if (rebootErrors > 0) {
					Swal.fire({
						title: 'Reboot Failure',
						text: 'Some or all devices failed to be rebooted',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Reboot Success',
						text: 'All devices were rebooted',
						icon: 'success',
					});
				}
			}
		});
	}
}
