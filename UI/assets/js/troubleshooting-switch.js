/*
Central Automation v1.7
Updated: 1.24.1
© Aaron Scott (WiFi Downunder) 2023
*/

var switchList;
var deviceInfo = {};
var switchPorts = {};
var portNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageSwitch() {
	switchList = getSwitches();
	loadDevicesTable();
	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadDevicesTable() {
	$('#device-table')
		.DataTable()
		.rows()
		.remove();

	deviceInfo = {};
	var table = $('#device-table').DataTable();
	$.each(switchList, function() {
		var device = this;
		deviceInfo[device.serial] = this;
		console.log(deviceInfo);
		// Build Status dot
		var memTotal = device['mem_total'];
		var memoryUsage = '-';
		if (memTotal != 0) memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString() + '%';
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage: ' + memoryUsage + '"><i class="fa-solid fa-circle text-success"></i></span>';
		}

		// Build Uptime String
		var uptimeString = '-';
		if (device['uptime'] > 0) {
			var uptime = moment.duration(device['uptime'] * 1000);
			uptimeString = uptime.humanize();
		}

		// Build troubleshooting links
		var tshootBtns = '';
		if (device['status'] == 'Up') {
			tshootBtns += '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="getSwitchPorts(\'' + device.serial + '\')">Ports</button> ';
		}

		// Add AP to table
		table.row.add(['<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['ip_address'], device['serial'], device['macaddr'], device['group_name'], device['site'], uptimeString, tshootBtns]);
	});
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Switch Port Page Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchPorts(deviceSerial) {
	// Get switch ports
	var ports = switchPorts[deviceSerial];
	if (!ports) {
		portNotification = showNotification('ca-switch-stack', 'Obtaining Switch Ports...', 'bottom', 'center', 'info');
		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/monitoring/v1/switches/' + deviceSerial + '/ports',
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			console.log(commandResults);
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches/<SERIAL>/ports)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}

			var response = JSON.parse(commandResults.responseBody);
			console.log(response);
			switchPorts[deviceSerial] = response['ports'];
			loadPortTable(deviceSerial);

			portNotification.close();
		});
	} else {
		loadPortTable(deviceSerial);
	}
}

function loadPortTable(deviceSerial) {
	$('#port-table')
		.DataTable()
		.rows()
		.remove();

	$('#generalDetails').empty();
	$('#additionalDetails').empty();
	var switchInfo = deviceInfo[deviceSerial];
	console.log(switchInfo);
	$('#generalDetails').append('<li>Switch: <strong>' + switchInfo['name'] + '</strong></li>');
	$('#generalDetails').append('<li>Serial: <strong>' + switchInfo['serial'] + '</strong></li>');
	$('#generalDetails').append('<li>IP Address: <strong>' + switchInfo['ip_address'] + '</strong></li>');
	$('#generalDetails').append('<li>Model: <strong>' + switchInfo['model'] + '</strong></li>');
	$('#generalDetails').append('<li>Firmware: <strong>' + switchInfo['firmware_version'] + '</strong></li>');

	// Build Uptime String
	var uptimeString = '-';
	if (switchInfo['uptime'] > 0) {
		var uptime = moment.duration(switchInfo['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	var uplinkPorts = [];
	if (switchInfo['uplink_ports']) {
		$.each(switchInfo['uplink_ports'], function() {
			uplinkPorts.push(this.port);
		});
	}
	$('#additionalDetails').append('<li>Clients: <strong>' + switchInfo['client_count'] + '</strong></li>');
	if (switchInfo['poe_consumption']) $('#additionalDetails').append('<li>PoE Consumption: <strong>' + switchInfo['poe_consumption'] + '</strong></li>');
	if (switchInfo['temperature'] !== 'None') $('#additionalDetails').append('<li>Temperature: <strong>' + switchInfo['temperature'] + '</strong></li>');
	$('#additionalDetails').append('<li>Uptime: <strong>' + uptimeString + '</strong></li>');
	if (uplinkPorts.length > 0) $('#additionalDetails').append('<li>Uplink Ports: <strong>' + uplinkPorts.join(', ') + '</strong></li>');

	var ports = switchPorts[deviceSerial];
	var table = $('#port-table').DataTable();
	$.each(ports, function() {
		var port = this;
		// Build Status dot
		var status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="Down Reason: ' + port['intf_state_down_reason'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
		if (port['status'] == 'Up') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}

		// Build troubleshooting links
		var tshootBtns = '';
		if (port['status'] == 'Up') {
			var tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="poeBounce(\'' + deviceSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
			tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="interfaceBounce(\'' + deviceSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-ethernet"></i></a>';
			if (switchInfo['switch_type'] === 'AOS-S') {
				tshootBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Cable Test" onclick="cableTest(\'' + deviceSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-microscope"></i></a>';
			}
		}

		var vlanString = port['vlan'];
		if (port['allowed_vlan'].length > 0) {
			var sortedVLANs = port['allowed_vlan'];
			sortedVLANs.sort();
			vlanString = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="Allowed VLANs: ' + sortedVLANs.join(', ') + '">' + port['vlan'] + '</span>';
		}

		// Add AP to table
		var portNumberString = port['port'].toString();
		portNumberString = portNumberString.padStart(3, '0');
		table.row.add(['<strong><span style="display:none;">' + portNumberString + ' </span>' + port['port_number'] + '</strong>', status, port['status'] ? port['status'] : 'down', port['mode'], vlanString, port['speed'], port['duplex_mode'], port['power_consumption'], port['phy_type'], tshootBtns]);
	});
	$('#port-table')
		.DataTable()
		.rows()
		.draw();
	//table.columns.adjust().draw();

	$('#BounceModalLink').trigger('click');
}
