/*
Central Automation v1.15.1
Updated: 1.39
Aaron Scott (WiFi Downunder) 2021-2025
*/

var down2APs = [];
var down5APs = [];
var down6APs = [];
var highMemoryAPs = [];
var highCPUAPs = [];
var apBSSIDs = [];
var apRadios = [];
var bleBeacons = [];
var bleGroups = [];
var completedBLEGroups = 0;

var clusterInfo = {};
var apSwarms = [];

var bssidNotification;
var bleNotification;

var blePromise;

var topAPs;
var selectedAP;

function loadCurrentPageAP() {
	apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';
	
	updateAPGraphs();
	loadBSSIDs();
	getDevices();
	getTopAPs();
}

function loadCurrentPageGroup() {
	loadBLEData();
}

function loadCurrentPageSwarm() {
	loadSwarmData();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findAPForMAC(macaddr) {
	// Check APs for radio mac
	var foundDevice = null;
	var aps = getAPs();
	$.each(aps, function() {
		if (this['macaddr'] === macaddr) {
			foundDevice = this;
			return false; // break  out of the for loop
		}
	});

	return foundDevice;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getDevices() {
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
	});
}

function updateAPGraphs() {
	var apModels = {};
	var apFirmware = {};
	var maxTypeLimit = 10;
	var maxAPLimit = 10;
	var maxFirmwareLimit = 5;
	var wirelessClients = getWirelessClients();
	var wiredClients = getWiredClients();
	var aps = getAPs();

	var highMemoryCount = 0;
	highMemoryAPs = [];
	var highCPUCount = 0;
	highCPUAPs = [];
	var down2 = 0;
	down2APs = [];
	var down5 = 0;
	down5APs = [];
	var down6 = 0;
	down6APs = [];
	var apCounter = 0;
	var radioCounter = 0;
	apRadios = [];
	var gatewayAPCount = 0;

	$('#radios-table')
		.DataTable()
		.rows()
		.remove();
		
	$('#gw-ap-table')
	.DataTable()
	.rows()
	.remove();

	// Get stats for APs
	$.each(aps, function() {
		var currentAP = this;
		// AP Model
		if (apModels[this.model]) {
			var apArray = apModels[this.model];
			apArray.push(this);
			apModels[this.model] = apArray;
		} else {
			var apArray = [];
			apArray.push(this);
			apModels[this.model] = apArray;
		}

		if (apFirmware[this.firmware_version]) {
			var apArray = apFirmware[this.firmware_version];
			apArray.push(this);
			apFirmware[this.firmware_version] = apArray;
		} else {
			var apArray = [];
			apArray.push(this);
			apFirmware[this.firmware_version] = apArray;
		}

		apCounter++;
		if (this.status === 'Up') {
			var memoryFree = this.mem_free;
			var memoryTotal = this.mem_total;
			var memoryFreePercentage = (memoryFree / memoryTotal) * 100;
			var memoryUsed = 100 - memoryFreePercentage;
			if (memoryFreePercentage < 25) {
				highMemoryCount++;
				highMemoryAPs.push(currentAP);
			}

			var cpuUsed = this.cpu_utilization;
			if (cpuUsed > 50) {
				highCPUCount++;
				highCPUAPs.push(currentAP);
			}
			
			if (this['gateway_cluster_name'] !== '') gatewayAPCount++;
			addAPtoGatewayTable(this);
			

			$.each(currentAP.radios, function() {
				var table = $('#radios-table').DataTable();
				var radio = this;
				var status = '<i class="fa-solid fa-circle text-danger"></i>';
				if (radio['status'] == 'Up') {
					status = '<i class="fa-solid fa-circle text-success"></i>';
				}

				var band = '6GHz';
				if (this.radio_name.includes('2.4 GHz')) band = '2.4GHz';
				else if (this.radio_name.includes('5 GHz')) band = '5GHz';
				// Make AP Name as a link to Central
				var name = encodeURI(currentAP['name']);
				var apiURL = localStorage.getItem('base_url');
				var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + currentAP['serial'] + '?casn=' + currentAP['serial'] + '&cdcn=' + name + '&nc=access_point';
				// Add row to table
				if (radio['status'] == 'Up') {
					table.row.add([currentAP['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + currentAP['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + currentAP['name'] + '</strong></a>', status, radio['status'], radio['macaddr'], band, radio['channel'], radio['tx_power'] ? radio['tx_power'] : '-', radio['utilization'] ? radio['utilization'] : '-', radio['spatial_stream']]);
				} else {
					table.row.add([currentAP['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + currentAP['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + currentAP['name'] + '</strong></a>', status, radio['status'], radio['macaddr'], band, '-', '-', '-', radio['spatial_stream']]);
				}
				
				apRadios.push({ name: currentAP['name'], serial: currentAP['serial'], status: radio['status'], radiomac: radio['macaddr'], band: band, channel: radio['channel'] ? radio['channel'] : '-', power: radio['tx_power'] ? radio['tx_power'] : '-', util: radio['utilization'] ? radio['utilization'] : '-', streams: radio['spatial_stream'] });
				
				radioCounter++;

				if (this.radio_name.includes('2.4 GHz') && this.status === 'Down') {
					down2++;
					down2APs.push(currentAP);
				}
				if (this.radio_name.includes('5 GHz') && this.status === 'Down') {
					down5++;
					down5APs.push(currentAP);
				}
				/*if (this.band === 2 && this.status === 'Down') {
					down5++;
					down5APs.push(currentAP);
				}*/
				if (this.radio_name.includes('6 GHz') && this.status === 'Down') {
					down6++;
					down6APs.push(currentAP);
				}
			});
		}
	});

	$('[data-toggle="tooltip"]').tooltip();
	$('#radios-table')
		.DataTable()
		.rows()
		.draw();
		
	$('#gw-ap-table')
	.DataTable()
	.rows()
	.draw();
	if (document.getElementById('radio_count')) {
		document.getElementById('radio_count').innerHTML = radioCounter;

		if (radioCounter > 0) {
			$(document.getElementById('radio_icon')).addClass('text-primary');
			$(document.getElementById('radio_icon')).removeClass('text-warning');
			$(document.getElementById('radio_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('radio_icon')).removeClass('text-success');
			$(document.getElementById('radio_icon')).removeClass('text-warning');
			$(document.getElementById('radio_icon')).addClass('text-danger');
		}
	}

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP Status Bar
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	if (document.getElementById('mem_count')) {
		document.getElementById('mem_count').innerHTML = highMemoryCount;
		if (highMemoryCount == 0) {
			$(document.getElementById('mem_icon')).addClass('text-success');
			$(document.getElementById('mem_icon')).removeClass('text-warning');
			$(document.getElementById('mem_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('mem_icon')).removeClass('text-success');
			$(document.getElementById('mem_icon')).addClass('text-warning');
			$(document.getElementById('mem_icon')).removeClass('text-danger');
		}
	}

	if (document.getElementById('cpu_count')) {
		document.getElementById('cpu_count').innerHTML = highCPUCount;
		if (highCPUCount == 0) {
			$(document.getElementById('cpu_icon')).addClass('text-success');
			$(document.getElementById('cpu_icon')).removeClass('text-warning');
			$(document.getElementById('cpu_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('cpu_icon')).removeClass('text-success');
			$(document.getElementById('cpu_icon')).addClass('text-warning');
			$(document.getElementById('cpu_icon')).removeClass('text-danger');
		}
	}

	if (document.getElementById('2_count')) {
		document.getElementById('2_count').innerHTML = down2;

		if (down2 > 0) {
			$(document.getElementById('2_icon')).removeClass('text-primary');
			$(document.getElementById('2_icon')).removeClass('text-success');
			$(document.getElementById('2_icon')).removeClass('text-warning');
			$(document.getElementById('2_icon')).addClass('text-danger');
		} else {
			$(document.getElementById('2_icon')).addClass('text-primary');
			$(document.getElementById('2_icon')).removeClass('text-success');
			$(document.getElementById('2_icon')).removeClass('text-warning');
			$(document.getElementById('2_icon')).removeClass('text-danger');
		}
	}

	if (document.getElementById('5_count')) {
		document.getElementById('5_count').innerHTML = down5;

		if (down5 > 0) {
			$(document.getElementById('5_icon')).removeClass('text-primary');
			$(document.getElementById('5_icon')).removeClass('text-success');
			$(document.getElementById('5_icon')).removeClass('text-warning');
			$(document.getElementById('5_icon')).addClass('text-danger');
		} else {
			$(document.getElementById('5_icon')).addClass('text-primary');
			$(document.getElementById('5_icon')).removeClass('text-success');
			$(document.getElementById('5_icon')).removeClass('text-warning');
			$(document.getElementById('5_icon')).removeClass('text-danger');
		}
	}

	if (document.getElementById('6_count')) {
		document.getElementById('6_count').innerHTML = down6;

		if (down6 > 0) {
			$(document.getElementById('6_icon')).removeClass('text-primary');
			$(document.getElementById('6_icon')).removeClass('text-success');
			$(document.getElementById('6_icon')).removeClass('text-warning');
			$(document.getElementById('6_icon')).addClass('text-danger');
		} else {
			$(document.getElementById('6_icon')).addClass('text-primary');
			$(document.getElementById('6_icon')).removeClass('text-success');
			$(document.getElementById('6_icon')).removeClass('text-warning');
			$(document.getElementById('6_icon')).removeClass('text-danger');
		}
	}
	
	if (document.getElementById('gw_count')) {
		document.getElementById('gw_count').innerHTML = gatewayAPCount;
	
		if (gw_count > 0) {
			$(document.getElementById('gw_icon')).removeClass('text-primary');
			$(document.getElementById('gw_icon')).removeClass('text-success');
			$(document.getElementById('gw_icon')).removeClass('text-warning');
			$(document.getElementById('gw_icon')).addClass('text-danger');
		} else {
			$(document.getElementById('gw_icon')).removeClass('text-primary');
			$(document.getElementById('gw_icon')).addClass('text-success');
			$(document.getElementById('gw_icon')).removeClass('text-warning');
			$(document.getElementById('gw_icon')).removeClass('text-danger');
		}
	}

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP Model Bar Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	var barOptions = {
		//distributeSeries: true,
		seriesBarDistance: 10,
		axisX: {
			showGrid: false,
		},
		axisY: {
			onlyInteger: true,
			offset: 30,
		},
		height: 250,
		plugins: [Chartist.plugins.tooltip()],
	};

	// Create AP Model array
	var items = Object.keys(apModels).map(function(key) {
		return [key, apModels[key]];
	});

	// Sort the array based on the second element
	items.sort(function(first, second) {
		return second[1].length - first[1].length;
	});

	// Create a new array with only the first "x" items
	var top5models = items.slice(0, maxTypeLimit);

	// Build labels and series
	var apLabels = [];
	var apSeries = [];
	$.each(top5models, function() {
		apLabels.push(this[0]);
		apSeries.push({ meta: this[0], value: this[1].length });
	});

	Chartist.Bar(
		'#chartModel',
		{
			labels: apLabels,
			series: [apSeries],
		},
		barOptions
	);

	$('#chartModel').on('click', '.ct-bar', function() {
		$('#selected-device-table')
			.DataTable()
			.rows()
			.remove();
		var table = $('#selected-device-table').DataTable();
		var selectedAPs = [];
		var val = $(this).attr('ct:meta');
		console.log(this)
		selectedAPs = apModels[val];
		document.getElementById('selected-title').innerHTML = 'AP-' + val + ' model Access Points';

		$.each(selectedAPs, function() {
			var ap = this;
			var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
			if (ap['status'] != 'Up') downAPCount++;
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (ap['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
			}
			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = ap['uptime'] ? ap['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
			// Add row to table
			table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr'], duration.humanize()]);

			$('[data-toggle="tooltip"]').tooltip();
		});
		$('#selected-device-table')
			.DataTable()
			.rows()
			.draw();
		$('#SelectedDeviceModalLink').trigger('click');
	});

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Client Count Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	var busyAPs = aps;
	// Sort the array based on the second element
	busyAPs.sort(function(first, second) {
		return second.client_count - first.client_count;
	});

	$('#busy-table')
		.DataTable()
		.rows()
		.remove();

	var busyAPs = busyAPs.slice(0, maxAPLimit);

	var table = $('#busy-table').DataTable();
	for (i = 0; i < busyAPs.length; i++) {
		var name = encodeURI(busyAPs[i]['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + busyAPs[i]['serial'] + '?casn=' + busyAPs[i]['serial'] + '&cdcn=' + name + '&nc=access_point';
		// Add row to table
		table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + busyAPs[i]['name'] + '</strong></a>', busyAPs[i]['client_count']]);
	}
	$('#busy-table')
		.DataTable()
		.rows()
		.draw();

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Uptime Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	busyAPs = aps;
	// Sort the array based on the second element
	busyAPs.sort(function(first, second) {
		return first.uptime - second.uptime;
	});

	$('#uptime-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#uptime-table').DataTable();
	var uptimeCounter = 0;
	for (i = 0; i < busyAPs.length; i++) {
		if (busyAPs[i]['uptime'] != 0) {
			if (uptimeCounter < maxAPLimit) {
				var name = encodeURI(busyAPs[i]['name']);
				var uptime = busyAPs[i]['uptime'] ? busyAPs[i]['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);
				var apiURL = localStorage.getItem('base_url');
				var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + busyAPs[i]['serial'] + '?casn=' + busyAPs[i]['serial'] + '&cdcn=' + name + '&nc=access_point';

				var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Troubleshoot AP" onclick="getAPDetails(\'' + busyAPs[i]['serial'] + '\')"><i class="fa-solid fa-screwdriver-wrench"></i></a> ';

				// Add row to table
				table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + busyAPs[i]['name'] + '</strong></a>', duration.humanize(), actionBtns]);
				//table.row.add([busyAPs[i]['name'], duration.humanize()]);
				uptimeCounter++;
			} else break;
		}
	}
	$('#uptime-table')
		.DataTable()
		.rows()
		.draw();

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Memory Utilisation Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	busyAPs = aps;
	// Sort the array based on the second element
	busyAPs.sort(function(first, second) {
		var memoryFirst = ((first['mem_total'] - first['mem_free']) / first['mem_total']) * 100;
		var memorysecond = ((second['mem_total'] - second['mem_free']) / second['mem_total']) * 100;
		return memorysecond - memoryFirst;
	});

	$('#memory-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#memory-table').DataTable();
	var i = 0;
	$.each(busyAPs, function() {
		if (i < maxAPLimit) {
			var name = encodeURI(this['name']);
			var memoryUsage = (((this['mem_total'] - this['mem_free']) / this['mem_total']) * 100).toFixed(0).toString();
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + this['serial'] + '?casn=' + this['serial'] + '&cdcn=' + name + '&nc=access_point';

			var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot AP" onclick="rebootAP(\'' + this['serial'] + '\')"><i class="fa-solid fa-power-off"></i></a> ';
			if (this.status !== 'Up') {
				var actionBtns = '';
			}
			// Add row to table
			table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + this['name'] + '</strong></a>', memoryUsage + '%', actionBtns]);
			//table.row.add([busyAPs[i]['name'], duration.humanize()]);
			i++;
		} else {
			return false;
		}
	});

	$('#memory-table')
		.DataTable()
		.rows()
		.draw();

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Firmware Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
	// Create AP Model array
	var items = Object.keys(apFirmware).map(function(key) {
		return [key, apFirmware[key]];
	});
	// Sort the array based on the second element
	items.sort(function(first, second) {
		return second[1].length - first[1].length;
	});

	// Create a new array with only the first "x" items
	var top5Firmware = items.slice(0, maxFirmwareLimit);

	// Build labels and series
	var fwLabels = [];
	var fwSeries = [];
	$('#firmware-footer').empty();
	for (i = 0; i < top5Firmware.length; i++) {
		fwLabels.push('');
		fwSeries.push({ meta: top5Firmware[i][0], value: top5Firmware[i][1].length });
		$('#firmware-footer').append('<li><i class="fa-solid fa-circle ' + colorArray[i] + '"></i> ' + top5Firmware[i][0] + '</li>');
	}

	Chartist.Pie(
		'#chartFirmware',
		{
			labels: fwLabels,
			series: fwSeries,
		},
		{
			donut: true,
			donutWidth: 30,
			showLabel: true,
			chartPadding: 26,
			labelOffset: 30,
			labelDirection: 'explode',
		}
	);

	$('#chartFirmware').on('click', '.ct-slice-donut', function() {
		$('#selected-device-table')
			.DataTable()
			.rows()
			.remove();
		var table = $('#selected-device-table').DataTable();
		var selectedAPs = [];
		var val = $(this).attr('ct:meta');
		selectedAPs = apFirmware[val];
		document.getElementById('selected-title').innerHTML = 'APs running version ' + val + ' firmware';

		$.each(selectedAPs, function() {
			var ap = this;
			var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
			if (ap['status'] != 'Up') downAPCount++;
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (ap['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
			}
			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = ap['uptime'] ? ap['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
			// Add row to table
			table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr'], duration.humanize()]);

			$('[data-toggle="tooltip"]').tooltip();
		});
		$('#selected-device-table')
			.DataTable()
			.rows()
			.draw();
		$('#SelectedDeviceModalLink').trigger('click');
	});
}

function rebootAP(currentSerial) {
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/device_management/v1/device/' + currentSerial + '/action/reboot',
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
			logInformation('Successful reboot of ' + response['serial']);
			showNotification('ca-chart-bar-32', 'Rebooted AP (' + response['serial'] + ') was successful', 'bottom', 'center', 'success');
		} else {
			if (response['description']) logError(response['description']);
		}
	});
}

function showAPs(showMode) {
	$('#selected-device-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#selected-device-table').DataTable();
	var selectedAPs = [];
	var val = $(this).attr('ct:meta');
	if (showMode === '2.4GHz') {
		selectedAPs = down2APs;
		document.getElementById('selected-title').innerHTML = 'APs with Down ' + showMode + ' Radios';
	} else if (showMode === '5GHz') {
		selectedAPs = down5APs;
		document.getElementById('selected-title').innerHTML = 'APs with Down ' + showMode + ' Radios';
	} else if (showMode === '6GHz') {
		selectedAPs = down6APs;
		document.getElementById('selected-title').innerHTML = 'APs with Down ' + showMode + ' Radios';
	} else if (showMode === 'Memory') {
		selectedAPs = highMemoryAPs;
		document.getElementById('selected-title').innerHTML = 'APs with High Memory Utilization';
	} else if (showMode === 'CPU') {
		selectedAPs = highCPUAPs;
		document.getElementById('selected-title').innerHTML = 'APs with High CPU Utilization';
	}

	$.each(selectedAPs, function() {
		var ap = this;
		var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
		if (ap['status'] != 'Up') downAPCount++;
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (ap['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
		}
		var ip_address = ap['ip_address'];
		if (!ip_address) ip_address = '';

		var uptime = ap['uptime'] ? ap['uptime'] : 0;
		var duration = moment.duration(uptime * 1000);

		// Make AP Name as a link to Central
		var name = encodeURI(ap['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
		// Add row to table
		table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr'], duration.humanize()]);

		$('[data-toggle="tooltip"]').tooltip();
	});
	$('#selected-device-table')
		.DataTable()
		.rows()
		.draw();
	$('#SelectedDeviceModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------
	BSSID Table
	------------------------------------------------------------------------------------------------- */
function loadBSSIDs() {
	const transaction = db.transaction('general', 'readonly');
	const store = transaction.objectStore('general');

	const bssidQuery = store.get('monitoring_bssids');
	bssidQuery.onsuccess = function() {
		if (bssidQuery.result && bssidQuery.result.data) {
			loadBSSIDTable(JSON.parse(bssidQuery.result.data));
		} else {
			refreshBSSIDs();
		}
	};
}

function refreshBSSIDs() {
	bssidNotification = showLongNotification('ca-wifi', 'Obtaining BSSIDs...', 'bottom', 'center', 'info');
	$.when(getBSSIDData(0)).then(function() {
		loadBSSIDTable(getBSSIDs());
		if (bssidNotification) {
			bssidNotification.update({ message: 'BSSID Table updated', type: 'success' });
			setTimeout(bssidNotification.close, 1000);
		}
	});
}

function loadBSSIDTable(currentBSSIDs) {
	apBSSIDs = [];
	$('#bssid-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#bssid-table').DataTable();
	$.each(currentBSSIDs, function() {
		var ap = findDeviceInMonitoring(this.serial);
		if (ap) {
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (ap['status'] && ap['status'] == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
			}
			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';
	
			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
			$.each(this.radio_bssids, function() {
				var radio = this;
				$.each(radio.bssids, function() {
					// Add row to table
					table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], this['essid'], this['macaddr'], ap['site'], ap['group_name']]);
	
					apBSSIDs.push({ name: ap['name'], status: ap['status'], ip_address: ip_address, model: ap['model'], serial: ap['serial'], essid: this['essid'], bssid: this['macaddr'] ,site: ap['site'], group: ap['group_name']});
				});
			});
			if (document.getElementById('bssid_count')) {
				document.getElementById('bssid_count').innerHTML = apBSSIDs.length;
	
				if (apBSSIDs.length > 0) {
					$(document.getElementById('bssid_icon')).addClass('text-primary');
					$(document.getElementById('bssid_icon')).removeClass('text-warning');
					$(document.getElementById('bssid_icon')).removeClass('text-danger');
				} else {
					$(document.getElementById('bssid_icon')).removeClass('text-success');
					$(document.getElementById('bssid_icon')).removeClass('text-warning');
					$(document.getElementById('bssid_icon')).addClass('text-danger');
				}
			}
		}
	});
	$('#bssid-table')
		.DataTable()
		.rows()
		.draw();
}

/*  -------------------------------------------------------------------------------------------------
	Swarm Table
	------------------------------------------------------------------------------------------------- */
function loadSwarmData() {
	const transaction = db.transaction('general', 'readonly');
	const store = transaction.objectStore('general');

	const swarmQuery = store.get('monitoring_swarms');
	swarmQuery.onsuccess = function() {
		if (swarmQuery.result && swarmQuery.result.data) {
			loadSwarmTable(JSON.parse(swarmQuery.result.data));
		} else {
			updateSwarmData();
		}
	};
}

function loadSwarmTable(currentSwarms) {
	apSwarms = [];
	$('#swarm-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#swarm-table').DataTable();
	for (const [key, value] of Object.entries(clusterInfo)) {
		var deviceList = value;
		var currentSwarm = null;
		$.each(currentSwarms, function() {
			if (this.swarm_id == key) {
				currentSwarm = this;
			}
		});
		
		// Add VC Cluster to table
		table.row.add([key, '<strong>' + deviceList[0]['swarm_name'] + '</strong>', deviceList.length, deviceList[0]['group_name'], deviceList[0]['site'], currentSwarm.ip_address, currentSwarm.public_ip_address, currentSwarm.firmware_version]);
		
		apSwarms.push({ name: deviceList[0]['swarm_name'], aps: deviceList.length, group: deviceList[0]['group_name'], site: deviceList[0]['site'], ip_address: currentSwarm.ip_address, public_ip: currentSwarm.public_ip_address, firmware: currentSwarm.firmware_version });
		
		if (document.getElementById('vc_count')) {
			document.getElementById('vc_count').innerHTML = apSwarms.length;
		
			if (apSwarms.length > 0) {
				$(document.getElementById('vc_icon')).addClass('text-primary');
				$(document.getElementById('vc_icon')).removeClass('text-warning');
				$(document.getElementById('vc_icon')).removeClass('text-danger');
			} else {
				$(document.getElementById('vc_icon')).removeClass('text-success');
				$(document.getElementById('vc_icon')).removeClass('text-warning');
				$(document.getElementById('vc_icon')).addClass('text-danger');
			}
		}
	}
	
	$('#swarm-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------
	BLE Table
	------------------------------------------------------------------------------------------------- */
function loadBLEData() {
	const transaction = db.transaction('general', 'readonly');
	const store = transaction.objectStore('general');

	const bleQuery = store.get('monitoring_ble');
	bleQuery.onsuccess = function() {
		if (bleQuery.result && bleQuery.result.data) {
			bleBeacons = JSON.parse(bleQuery.result.data);
			loadBLETable();
		} else {
			refreshBLE();
		}
	};
}

function refreshBLE() {
	bleNotification = showLongNotification('ca-bluetooth', 'Obtaining BLE Beacons...', 'bottom', 'center', 'info');
	$.when(getBLEData()).then(function() {
		loadBLETable();
		if (bleNotification) {
			bleNotification.update({ message: 'BLE Beacons updated', type: 'success' });
			setTimeout(bleNotification.close, 1000);
		}
	});
}

function getBLEData() {
	completedBLEGroups = 0;
	bleBeacons = [];
	blePromise = new $.Deferred();
	// for each group
	bleGroups = getGroups();
	for (let i = 0; i < bleGroups.length; i++) {
		var currentGroup = bleGroups[i];
		setTimeout(getBLEBeacons, apiDelay * i, currentGroup.group, 0); // As to not go over the 7 calls/sec speed limit
	}
	return blePromise.promise();
}

function getBLEBeacons(currentGroup, offset) {
	// make currentGroup a url safe string
	//console.log('Getting BLE Beacons for ' + currentGroup + ' at offset ' + offset);
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/bbs/v1/ble_run_beacons/' + currentGroup + '?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/bbs/v1/ble_run_beacons/)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
		} else {
			bleBeacons = bleBeacons.concat(response.actual_beacons);
			offset += apiLimit;
			if (offset < response.beacons_num) getBLEBeacons(currentGroup, offset);
			else {
				completedBLEGroups++;
				if (completedBLEGroups == bleGroups.length) {
					saveDataToDB('monitoring_ble', JSON.stringify(bleBeacons));
					blePromise.resolve();
				}
			}
		}
	});
}

function loadBLETable() {
	$('#ble-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#ble-table').DataTable();
	for (var i = 0; i < bleBeacons.length; i++) {
		var currentBeacon = bleBeacons[i];
		var ap = findAPForMAC(currentBeacon['ap_mac']);
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (currentBeacon['status'] == 'Normal') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}

		// Make AP Name as a link to Central
		if (ap) {
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
			table.row.add([i, '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', currentBeacon['iot_radio_mac'], status, currentBeacon['status'], currentBeacon['profile_name'], currentBeacon['radio_instance'], currentBeacon['adv_format'], currentBeacon['interval'], currentBeacon['major'], currentBeacon['minor'], ap['group_name']]);
		} else {
			table.row.add([i, currentBeacon['ap_mac'], currentBeacon['iot_radio_mac'], status, currentBeacon['status'], currentBeacon['profile_name'], currentBeacon['radio_instance'], currentBeacon['adv_format'], currentBeacon['interval'], currentBeacon['major'], currentBeacon['minor'], '']);
		}
	}
	if (document.getElementById('ble_count')) {
		document.getElementById('ble_count').innerHTML = bleBeacons.length;

		if (apBSSIDs.length > 0) {
			$(document.getElementById('ble_icon')).addClass('text-primary');
			$(document.getElementById('ble_icon')).removeClass('text-warning');
			$(document.getElementById('ble_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('ble_icon')).removeClass('text-success');
			$(document.getElementById('ble_icon')).removeClass('text-warning');
			$(document.getElementById('ble_icon')).addClass('text-danger');
		}
	}
	$('#ble-table')
		.DataTable()
		.rows()
		.draw();
}

function showBSSIDs() {
	$('#BSSIDModalLink').trigger('click');
}

function showRadios() {
	$('#RadiosModalLink').trigger('click');
}

function showBLE() {
	$('#BLEModalLink').trigger('click');
}

function showVCs() {
	$('#VCModalLink').trigger('click');
}

function showGWAPs() {
	$('#GatewayAPModelLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Radios Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadRadios() {
	csvData = buildRadioCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#bssid-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'Radios-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'Radios.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildRadioCSVData() {
	//CSV header
	var nameKey = 'DEVICE NAME';
	var serialKey = 'SERIAL';
	var statusKey = 'STATUS';
	var radioKey = 'RADIO MAC';
	var bandKey = 'BAND';
	var channelKey = 'CHANNEL';
	var powerKey = 'POWER';
	var utilKey = 'UTLIZATION';
	var streamsKey = 'SPATIAL STREAMS';

	var csvDataBuild = [];

	var table = $('#radios-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = apRadios[this];
		csvDataBuild.push({ [nameKey]: row.name, [serialKey]:row.serial, [statusKey]: row.status, [radioKey]: row.radiomac, [bandKey]: row.band, [channelKey]: row.channel, [powerKey]: row.power, [utilKey]: row.util, [streamsKey]: row.streams });
	});

	return csvDataBuild;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download BSSID Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadBSSIDs() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#bssid-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'bssid-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'BSSIDs.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildCSVData(selectedGroup, selectedSite) {
	//CSV header
	var nameKey = 'DEVICE NAME';
	var statusKey = 'STATUS';
	var ipKey = 'IP ADDRESS';
	var modelKey = 'MODEL';
	var serialKey = 'SERIAL';
	var essidKey = 'ESSID';
	var bssidKey = 'BSSID';
	var siteKey = 'SITE';
	var groupKey = 'GROUP'

	var csvDataBuild = [];

	var table = $('#bssid-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = apBSSIDs[this];
		csvDataBuild.push({ [nameKey]: row.name, [statusKey]: row.status, [ipKey]: row.ip_address, [modelKey]: row.model, [serialKey]: row.serial, [essidKey]: row.essid, [bssidKey]: row.bssid, [siteKey]: row.site, [groupKey]: row.group});
	});

	return csvDataBuild;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Beacons Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadBeacons() {
	csvData = buildBLECSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#ble-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'BLEBeacons-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'BLEBeacons.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildBLECSVData() {
	//CSV header
	var nameKey = 'AP NAME';
	var bleKey = 'BLE MAC ADDRESS';
	var statusKey = 'STATUS';
	var configKey = 'CONFIG PROFILE';
	var radioKey = 'RADIO';
	var formatKey = 'FORMAT';
	var intervalKey = 'INTERVAL';
	var majorKey = 'MAJOR';
	var minorKey = 'MINOR';
	var groupKey = 'GROUP';

	var csvDataBuild = [];

	var table = $('#ble-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = bleBeacons[this];
		var ap = findAPForMAC(row['ap_mac']);
		if (ap) {
			csvDataBuild.push({ [nameKey]: ap['name'], [bleKey]: row['iot_radio_mac'], [statusKey]: row['status'], [configKey]: row['profile_name'], [radioKey]: row['radio_instance'], [formatKey]: row['adv_format'], [intervalKey]: row['interval'], [majorKey]: row['major'], [minorKey]: row['minor'], [groupKey]: ap['group_name'] });
		} else {
			csvDataBuild.push({ [nameKey]: row['ap_mac'], [bleKey]: row['iot_radio_mac'], [statusKey]: row['status'], [configKey]: row['profile_name'], [radioKey]: row['radio_instance'], [formatKey]: row['adv_format'], [intervalKey]: row['interval'], [majorKey]: row['major'], [minorKey]: row['minor'], [groupKey]: '' });
		}
	});

	return csvDataBuild;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download VC Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadVCs() {
	csvData = buildVCCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#swarm-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'VirtualControllers-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'VirtualControllers.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildVCCSVData() {
	//CSV header
	var nameKey = 'NAME';
	var apsKey = 'APs';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var ipKey = 'IP ADDRESS';
	var publicKey = "PUBLIC IP";
	var firmwareKey = "FIRMWARE";

	var csvDataBuild = [];

	var table = $('#swarm-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = apSwarms[this.toString()];
		csvDataBuild.push({ [nameKey]: row['name'], [apsKey]: row['aps'], [groupKey]: row['group'], [siteKey]: row['site'], [ipKey]: row['ip_address'], [publicKey]:row['public_ip'], [firmwareKey]:row['firmware']});
	});

	return csvDataBuild;
}

/*---------------------------------------------------------------------
	Top APs API Functions
---------------------------------------------------------------------*/
function getTopAPs() {
	topAPs = [];
	
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps/bandwidth_usage/topn?count=100&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/aps/bandwidth_usage/topn)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		topAPs = response['aps'];
		// sort on total usage
		topAPs.sort(function(first, second) {
			return (second['rx_data_bytes']+second['tx_data_bytes']) - (first['rx_data_bytes']+first['tx_data_bytes']);
		});
		var peakBandwidth = topAPs[0]['rx_data_bytes']+topAPs[0]['tx_data_bytes'];
		
		$('#bandwidth-table')
		.DataTable()
		.rows()
		.remove();
		var table = $('#bandwidth-table').DataTable();
		$.each(topAPs, function() {
			var name = encodeURI(this['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + this['serial'] + '?casn=' + this['serial'] + '&cdcn=' + name + '&nc=access_point';
			
			var totalThroughput = this.tx_data_bytes + this.rx_data_bytes;
			var labelString = Math.floor(totalThroughput / 1024 / 1024 / 1024) + 'GB';
			var txAmount = Math.floor(this.tx_data_bytes / 1024 / 1024 / 1024) + 'GB'
			var txPercentage = (this.tx_data_bytes / peakBandwidth) *100;
			var rxAmount = Math.floor(this.rx_data_bytes / 1024 / 1024 / 1024) + 'GB';
			var rxPercentage = (this.rx_data_bytes / peakBandwidth) *100
			
			var throughputBar = '<a onclick="getAPBandwidth(\'' + this['serial'] + '\')"><div class="progress progress-thin"><div class="progress-bar progress-bar-info" style="width: '+txPercentage+'%"><span class="sr-only">'+txAmount+'</span></div><div class="progress-bar progress-bar-danger" style="width: '+rxPercentage+'%"><span class="sr-only">'+rxAmount+'</span></div></div></a>';
			
			var actionBtns = '<a class="btn btn-link btn-warning" onclick="getAPBandwidth(\'' + this['serial'] + '\')"><i class="fa-solid fa-chart-line"></i></a> ';
			
			// Add row to table
			table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + this['name'] + '</strong></a>', '<span title="totalThroughput">'+labelString+'</span>', throughputBar]);
		});
		$('#bandwidth-table')
			.DataTable()
			.rows()
			.draw();
			
		$('#bandwidth-table').DataTable().columns.adjust().draw();
		
		if (selectedAP) getAPBandwidth(selectedAP)
	});
}

function getAPBandwidth(currentSerial) {
	selectedAP = currentSerial;
	var currentAP = findDeviceInMonitoring(currentSerial);
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;
	
	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);
	var apName = currentSerial;
	if (currentAP) apName = currentAP.name
	if (document.getElementById('bandwidthLabel')) document.getElementById('bandwidthLabel').innerHTML = apName + ' bandwidth for the last ' + select.options[select.selectedIndex].innerHTML + ' (in MB)';
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v3/aps/bandwidth_usage?serial='+currentSerial+'&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v3/aps/bandwidth_usage)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		var series1 = [];
		var series2 = [];
		var labels = [];
		var labelCounter = 0;
		var peakThroughput = 0;
		
		$.each(response['samples'], function() {
			var timestamp = this['timestamp'];
			var currentTimestamp = timestamp * 1000;
			var eventDate = new Date(+currentTimestamp);
			
			if (labelCounter == response.count - 1) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == Math.floor(response.count / 2) && timescale > 1440) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == Math.floor(response.count / 2)) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == 0 && timescale > 180) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == 0) labels.push(moment(eventDate).format('LT'));
			else labels.push('');
			
			series1.push(this['tx_data_bytes'] / 1024 / 1024 );
			series2.push(this['rx_data_bytes'] / 1024 / 1024 );
			if ((this['rx_data_bytes'] / 1024 / 1024 ) > peakThroughput) peakThroughput = this['rx_data_bytes'] / 1024 / 1024;
			else if ((this['tx_data_bytes'] / 1024 / 1024 ) > peakThroughput) peakThroughput = this['tx_data_bytes'] / 1024 / 1024 ;
			peakThroughput = Math.ceil(peakThroughput);
			labelCounter++;
		});
		
		
		optionsPage = {
			lineSmooth: false,
			showPoint: false,
			showArea: true,
			height: '450px',
			axisY: {
				offset: 40,
				onlyInteger: true,
			},
			chartPadding: {
				right: 40,
				bottom: 50,
			},
			lineSmooth: Chartist.Interpolation.simple({
				divisor: 3,
			}),
			low: 0,
			high: peakThroughput,
			plugins: [Chartist.plugins.tooltip()],
		};
		
		dataPage = {
			labels: labels,
			series: [series1, series2],
		};
		
		var bandwidthChart = Chartist.Line('#bandwidth-chart', dataPage, optionsPage);
		
		bandwidthChart.on('draw', function(data) {
			if (data.type === 'line' || data.type === 'area') {
				data.element.animate({
					d: {
						begin: 0,
						dur: 1000,
						from: data.path
							.clone()
							.scale(1, 0)
							.translate(0, data.chartRect.height())
							.stringify(),
						to: data.path.clone().stringify(),
						easing: Chartist.Svg.Easing.easeOutQuint,
					},
				});
			}
		});
		
	});
}

function addAPtoGatewayTable(ap) {
	var table = $('#gw-ap-table').DataTable();
	var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	if (ap['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	var ip_address = ap['ip_address'];
	if (!ip_address) ip_address = '';
	
	var uptime = ap['uptime'] ? ap['uptime'] : 0;
	var duration = moment.duration(uptime * 1000);
	
	// Make AP Name as a link to Central
	var name = encodeURI(ap['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
	
	var clusterValue = '-'
	if (ap['gateway_cluster_name']) {
		var clusterURL = centralURLs[apiURL] + '/frontend/#/GATEWAYCLUSTERDETAIL/OVERVIEW/' + ap['gateway_cluster_id'] + '/' + ap['gateway_cluster_name'] + '?csgc=%5Bobject%20Object%5D&cdcn=' + ap['gateway_cluster_name'] + '&nc=gatewaycluster';
		clusterValue = '<a href="' + clusterURL + '" target="_blank"><strong>' + ap['gateway_cluster_name'] + '</strong></a>'
	}
	
	// Add row to table
	table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], clusterValue, ip_address, ap['model'], ap['serial'], ap['macaddr'], ap['site'], ap['group_name'], duration.humanize()]);
	
	$('[data-toggle="tooltip"]').tooltip();
}