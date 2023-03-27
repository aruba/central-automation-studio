/*
Central Automation v1.15.1
Updated: 1.17 
Aaron Scott (WiFi Downunder) 2023
*/

var colorArray = ['text-info', 'text-danger', 'text-warning', 'text-purple', 'text-success', 'text-primary', 'text-series7', 'text-series8'];

var down2APs = [];
var down5APs = [];
var down6APs = [];
var highMemoryAPs = [];
var highCPUAPs = [];
var apBSSIDs = [];

var bssidNotification;

function loadCurrentPageAP() {
	updateAPGraphs();
	loadBSSIDs();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
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
		}

		$.each(currentAP.radios, function() {
			if (this.band === 0 && this.status === 'Down') {
				down2++;
				down2APs.push(currentAP);
			}
			if (this.band === 1 && this.status === 'Down') {
				down5++;
				down5APs.push(currentAP);
			}
			if (this.band === 2 && this.status === 'Down') {
				down5++;
				down5APs.push(currentAP);
			}
			if (this.band === 3 && this.status === 'Down') {
				down6++;
				down6APs.push(currentAP);
			}
		});
	});

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

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP Model Bar Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	var barOptions = {
		distributeSeries: true,
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
			series: apSeries,
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
		selectedAPs = apModels[val];
		document.getElementById('selected-title').innerHTML = 'AP-' + val + ' model Access Points';

		$.each(selectedAPs, function() {
			var ap = this;
			var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
			if (ap['status'] != 'Up') downAPCount++;
			var status = '<i class="fa fa-circle text-danger"></i>';
			if (ap['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
			}
			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = ap['uptime'] ? ap['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
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
		var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + busyAPs[i]['serial'] + '?casn=' + busyAPs[i]['serial'] + '&cdcn=' + name + '&nc=access_point';
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
				var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + busyAPs[i]['serial'] + '?casn=' + busyAPs[i]['serial'] + '&cdcn=' + name + '&nc=access_point';

				var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Troubleshoot AP" onclick="debugSystemStatus(\'' + busyAPs[i]['serial'] + '\')"><i class="fa-regular fa-screwdriver-wrench"></i></a> ';

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
			var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + this['serial'] + '?casn=' + this['serial'] + '&cdcn=' + name + '&nc=access_point';

			var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot AP" onclick="rebootAP(\'' + this['serial'] + '\')"><i class="fa-regular fa-power-off"></i></a> ';
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
		$('#firmware-footer').append('<li><i class="fa fa-circle ' + colorArray[i] + '"></i> ' + top5Firmware[i][0] + '</li>');
	}

	Chartist.Pie('#chartFirmware', {
		labels: fwLabels,
		series: fwSeries,
	});

	$('#chartFirmware').on('click', '.ct-slice-pie', function() {
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
			var status = '<i class="fa fa-circle text-danger"></i>';
			if (ap['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
			}
			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = ap['uptime'] ? ap['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
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
		var status = '<i class="fa fa-circle text-danger"></i>';
		if (ap['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa fa-circle text-success"></i></span>';
		}
		var ip_address = ap['ip_address'];
		if (!ip_address) ip_address = '';

		var uptime = ap['uptime'] ? ap['uptime'] : 0;
		var duration = moment.duration(uptime * 1000);

		// Make AP Name as a link to Central
		var name = encodeURI(ap['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
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
	bssidNotification = showNotification('ca-wifi', 'Obtaining BSSIDs...', 'bottom', 'center', 'info');
	$.when(getBSSIDData(0)).then(function() {
		loadBSSIDTable(getBSSIDs());
		bssidNotification.close();
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
		var status = '<i class="fa fa-circle text-danger"></i>';
		if (ap['status'] == 'Up') {
			status = '<i class="fa fa-circle text-success"></i>';
		}
		var ip_address = ap['ip_address'];
		if (!ip_address) ip_address = '';

		// Make AP Name as a link to Central
		var name = encodeURI(ap['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
		$.each(this.radio_bssids, function() {
			var radio = this;
			$.each(radio.bssids, function() {
				// Add row to table
				table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], this['essid'], this['macaddr']]);

				apBSSIDs.push({ name: ap['name'], status: ap['status'], ip_address: ip_address, model: ap['model'], serial: ap['serial'], essid: this['essid'], bssid: this['macaddr'] });
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
	});
	$('#bssid-table')
		.DataTable()
		.rows()
		.draw();
}

function showBSSIDs() {
	$('#BSSIDModalLink').trigger('click');
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

	var csvDataBuild = [];

	var table = $('#bssid-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var row = apBSSIDs[this];
		csvDataBuild.push({ [nameKey]: row.name, [statusKey]: row.status, [ipKey]: row.ip_address, [modelKey]: row.model, [serialKey]: row.serial, [essidKey]: row.essid, [bssidKey]: row.bssid });
	});

	return csvDataBuild;
}
