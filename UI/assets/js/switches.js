/*
Central Automation v1.41.0
Updated: 
Aaron Scott (WiFi Downunder) 2021-2024
*/

var fullList;
var downSwitches = [];
var upSwitches = [];
var highMemory = [];
var highCPU = [];
var highFan = [];

var stackInfo = {};

var topSwitches;
var selectedSwitch;

var stacks = [];
var stacksPromise;
var stackNotification;

function loadCurrentPageSwitch() {
	fullList = getSwitches();
	stacksPromise = new $.Deferred();
	stackNotification = showLongNotification('ca-switch-stack', 'Getting Switch Stacks...', 'bottom', 'center', 'info');
	$.when(getStacks(0)).then(function() {
		if (stackNotification) {
			stackNotification.update({ message: 'Downloaded Switch Stack Information', type: 'success' });
			setTimeout(stackNotification.close, 1000);
		}
		updateSwitchGraphs();
		getDevices();
		getTopSwitches();
	});
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
		Switch functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getStacks(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switch_stacks?calculate_total=true',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switch_stacks)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		if (commandResults.responseBody !== '') {
			var response = JSON.parse(commandResults.responseBody);

			stacks = stacks.concat(response.stacks);
			if (offset + apiLimit <= response.total) getStacks(offset + apiLimit);
			else {
				stacksPromise.resolve();
			}
		} else {
			stacksPromise.resolve();
		}
	});
	return stacksPromise.promise();
}

function getDevices() {
	
	stackInfo = {};
	$.each(fullList, function() {
		
		deviceInfo[this.serial] = this;
		
		var stackID = this['stack_id'];

		// If this Switch is in a stack
		if (stackID) {
			// Check if this stack has been seen before
			if (!stackInfo[stackID]) {
				stackInfo[stackID] = [];
			}

			// Add serial to the list that matches the swarm_id.
			var devices = stackInfo[stackID];
			devices.push(this);
			stackInfo[stackID] = devices;
		}
	});
}

function updateSwitchGraphs() {
	var models = {};
	var firmware = {};
	var maxTypeLimit = 10;
	var maxDeviceLimit = 10;
	var maxFirmwareLimit = 5;
	var wiredClients = getWiredClients();

	var highMemoryCount = 0;
	highMemory = [];
	var highCPUCount = 0;
	highCPU = [];
	var highFanCount = 0;
	highFan = [];
	downSwitches = [];
	upswitches = [];;


	// Get stats for switches
	$.each(fullList, function() {
		var currentSwitch = this;
		// Model
		if (models[this.model]) {
			var switchArray = models[this.model];
			switchArray.push(this);
			models[this.model] = switchArray;
		} else {
			var switchArray = [];
			switchArray.push(this);
			models[this.model] = switchArray;
		}

		if (firmware[this.firmware_version]) {
			var switchArray = firmware[this.firmware_version];
			switchArray.push(this);
			firmware[this.firmware_version] = switchArray;
		} else {
			var switchArray = [];
			switchArray.push(this);
			firmware[this.firmware_version] = switchArray;
		}

		if (this.status === 'Up') {
			var memoryFree = this.mem_free;
			var memoryTotal = this.mem_total;
			var memoryFreePercentage = (memoryFree / memoryTotal) * 100;
			var memoryUsed = 100 - memoryFreePercentage;
			if (memoryFreePercentage < 25) {
				highMemoryCount++;
				highMemory.push(this);
			}

			var cpuUsed = this.cpu_utilization;
			if (cpuUsed > 50) {
				highCPUCount++;
				highCPU.push(this);
			}
			
			var fanState = this.fan_speed;
			if (fanState != 'Ok') {
				highFanCount++;
				highFan.push(this);
			}

		}
	});

	$('[data-toggle="tooltip"]').tooltip();


	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Switch Status Bar
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
	
	if (document.getElementById('fan_count')) {
		document.getElementById('fan_count').innerHTML = highFanCount;
		if (highFanCount == 0) {
			$(document.getElementById('fan_icon')).addClass('text-success');
			$(document.getElementById('fan_icon')).removeClass('text-warning');
			$(document.getElementById('fan_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('fan_icon')).removeClass('text-success');
			$(document.getElementById('fan_icon')).addClass('text-warning');
			$(document.getElementById('fan_icon')).removeClass('text-danger');
		}
	}
	
	if (document.getElementById('stack_count')) {
		document.getElementById('stack_count').innerHTML = stacks.length;
		// Process Stack Health...
		
		var downMember = 0;
		$.each(stacks, function() {
			var stackDetail = this;
			stackSwitches = stackInfo[this.id];
			$.each(stackSwitches, function () {
				if (this.status === 'Down') downMember++;
			});
		});
		
		if (downMember == 0) {
			$(document.getElementById('stack_icon')).addClass('text-success');
			$(document.getElementById('stack_icon')).removeClass('text-warning');
			$(document.getElementById('stack_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('stack_icon')).removeClass('text-success');
			$(document.getElementById('stack_icon')).addClass('text-warning');
			$(document.getElementById('stack_icon')).removeClass('text-danger');
		}
	}

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Model Bar Chart
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
	var items = Object.keys(models).map(function(key) {
		return [key, models[key]];
	});

	// Sort the array based on the second element
	items.sort(function(first, second) {
		return second[1].length - first[1].length;
	});

	// Create a new array with only the first "x" items
	var top5models = items.slice(0, maxTypeLimit);

	// Build labels and series
	var modelLabels = [];
	var modelSeries = [];
	$.each(top5models, function() {
		modelLabels.push(this[0]);
		modelSeries.push({ meta: this[0], value: this[1].length });
	});

	Chartist.Bar(
		'#chartModel',
		{
			labels: modelLabels,
			series: [modelSeries],
		},
		barOptions
	);

	$('#chartModel').on('click', '.ct-bar', function() {
		$('#selected-device-table')
			.DataTable()
			.rows()
			.remove();
		var table = $('#selected-device-table').DataTable();
		var selectedDevices = [];
		var val = $(this).attr('ct:meta');
		selectedDevices = models[val];
		document.getElementById('selected-title').innerHTML = 'Switch-' + val + ' model Switches';

		$.each(selectedDevices, function() {
			var device = this;
			var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (device['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
			}
			var ip_address = device['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = device['uptime'] ? device['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make Name as a link to Central
			var name = encodeURI(device['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';
			// Add row to table
			table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'], ip_address, device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], duration.humanize()]);

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

	var busySwitches = fullList;
	// Sort the array based on the second element
	busySwitches.sort(function(first, second) {
		return second.client_count - first.client_count;
	});

	$('#busy-table')
		.DataTable()
		.rows()
		.remove();

	var busySwitches = busySwitches.slice(0, maxDeviceLimit);

	var table = $('#busy-table').DataTable();
	for (i = 0; i < busySwitches.length; i++) {
		var deviceName = busySwitches[i]['name']
		if (busySwitches[i]['stack_id']) deviceName = deviceName + ' ('+busySwitches[i]['stack_member_id']+')';
		var name = encodeURI(busySwitches[i]['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + busySwitches[i]['serial'] + '?cssn=' + busySwitches[i]['serial'] + '&cdcn=' + name + '&nc=device';	
		// Add row to table
		table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + deviceName + '</strong></a>', busySwitches[i]['client_count']]);
	}
	$('#busy-table')
		.DataTable()
		.rows()
		.draw();

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Uptime Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	busySwitches = fullList;
	// Sort the array based on the second element
	busySwitches.sort(function(first, second) {
		return first.uptime - second.uptime;
	});

	$('#uptime-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#uptime-table').DataTable();
	var uptimeCounter = 0;
	for (i = 0; i < busySwitches.length; i++) {
		if (busySwitches[i]['uptime'] != 0) {
			if (uptimeCounter < maxDeviceLimit) {
				var deviceName = busySwitches[i]['name']
				if (busySwitches[i]['stack_id']) deviceName = deviceName + ' ('+busySwitches[i]['stack_member_id']+')';
				
				var name = encodeURI(busySwitches[i]['name']);
				var uptime = busySwitches[i]['uptime'] ? busySwitches[i]['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);
				var apiURL = localStorage.getItem('base_url');
				var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + busySwitches[i]['serial'] + '?cssn=' + busySwitches[i]['serial'] + '&cdcn=' + name + '&nc=device';

				var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Troubleshoot Switch" onclick="showSwitchDetails(\'' + busySwitches[i]['serial'] + '\')"><i class="fa-solid fa-screwdriver-wrench"></i></a> ';

				// Add row to table
				table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' +deviceName + '</strong></a>', duration.humanize(), actionBtns]);
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

	busySwitches = fullList;
	// Sort the array based on the second element
	busySwitches.sort(function(first, second) {
		return second['poe_consumption'] - first['poe_consumption'];
	});

	$('#power-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#power-table').DataTable();
	var i = 0;
	var powerDevices = 0;
	$.each(busySwitches, function() {
		if (powerDevices < maxDeviceLimit) {
			var deviceName = busySwitches[i]['name']
			if (busySwitches[i]['stack_id']) deviceName = deviceName + ' ('+ busySwitches[i]['stack_member_id']+')';
			var name = encodeURI(this['name']);
			var powerDraw = this['poe_consumption'];
			if (powerDraw != '-') {
				var apiURL = localStorage.getItem('base_url');
				var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + this['serial'] + '?cssn=' + this['serial'] + '&cdcn=' + name + '&nc=device';
	
				var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Reboot Switch" onclick="rebootSwitch(\'' + this['serial'] + '\')"><i class="fa-solid fa-power-off"></i></a> ';
				if (this.status !== 'Up') {
					var actionBtns = '';
				}
				// Add row to table
				table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + deviceName + '</strong></a>', powerDraw + 'W', actionBtns]);
				//table.row.add([busyAPs[i]['name'], duration.humanize()]);
				powerDevices++;
			}
			i++;
		} else {
			return false;
		}
	});

	$('#power-table')
		.DataTable()
		.rows()
		.draw();

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Firmware Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
	// Create AP Model array
	var items = Object.keys(firmware).map(function(key) {
		return [key, firmware[key]];
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
		var selectedDevices = [];
		var val = $(this).attr('ct:meta');
		selectedDevices = firmware[val];
		document.getElementById('selected-title').innerHTML = 'Switches running version ' + val + ' firmware';

		$.each(selectedDevices, function() {
			var device = this;
			var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (device['status'] == 'Up') {
				status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
			}
			var ip_address = device['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = device['uptime'] ? device['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(device['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';
			// Add row to table
			table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'], ip_address, device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], duration.humanize()]);

			$('[data-toggle="tooltip"]').tooltip();
		});
		$('#selected-device-table')
			.DataTable()
			.rows()
			.draw();
		$('#SelectedDeviceModalLink').trigger('click');
	});
}

function rebootSwitch(currentSerial) {
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
			showNotification('ca-chart-bar-32', 'Rebooted Switch (' + response['serial'] + ') was successful', 'bottom', 'center', 'success');
		} else {
			if (response['description']) logError(response['description']);
		}
	});
}

function showSwitches(showMode) {
	$('#selected-device-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#selected-device-table').DataTable();
	var selectedDevices = [];
	var val = $(this).attr('ct:meta');
	if (showMode === 'Memory') {
		selectedDevices = highMemory;
		document.getElementById('selected-title').innerHTML = 'Switches with High Memory Utilization';
	} else if (showMode === 'CPU') {
		selectedDevices = highCPU;
		document.getElementById('selected-title').innerHTML = 'Switches with High CPU Utilization';
	} else if (showMode === 'Fan') {
		selectedDevices = highFan;
		document.getElementById('selected-title').innerHTML = 'Switches with Fan Speed Issue';
	}

	$.each(selectedDevices, function() {
		var device = this;
		var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
		}
		var ip_address = device['ip_address'];
		if (!ip_address) ip_address = '';

		var uptime = device['uptime'] ? device['uptime'] : 0;
		var duration = moment.duration(uptime * 1000);

		// Make AP Name as a link to Central
		var name = encodeURI(device['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';
		// Add row to table
		table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'], ip_address, device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], duration.humanize()]);

		$('[data-toggle="tooltip"]').tooltip();
	});
	$('#selected-device-table')
		.DataTable()
		.rows()
		.draw();
	$('#SelectedDeviceModalLink').trigger('click');
}




/*---------------------------------------------------------------------
	Top Switches API Functions
---------------------------------------------------------------------*/
function getTopSwitches() {
	topSwitches = [];
	
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
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches/bandwidth_usage/topn?count=100&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches/bandwidth_usage/topn)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		topDevices = response['switches'];
		// sort on total usage
		topDevices.sort(function(first, second) {
			return (second['rx_data_bytes']+second['tx_data_bytes']) - (first['rx_data_bytes']+first['tx_data_bytes']);
		});
		var peakBandwidth = topDevices[0]['rx_data_bytes']+topDevices[0]['tx_data_bytes'];
		
		$('#bandwidth-table')
		.DataTable()
		.rows()
		.remove();
		var table = $('#bandwidth-table').DataTable();
		$.each(topDevices, function() {
			var currentSwitch = findDeviceInMonitoring(this['serial'])
			var deviceName = currentSwitch['name']
			if (currentSwitch['stack_id']) deviceName = deviceName + ' ('+ currentSwitch['stack_member_id']+')';
			
			var name = encodeURI(this['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + this['serial'] + '?cssn=' + this['serial'] + '&cdcn=' + name + '&nc=device';
			
			var totalThroughput = this.tx_data_bytes + this.rx_data_bytes;
			var labelString = Math.floor(totalThroughput / 1024 / 1024 / 1024) + 'GB';
			var txAmount = Math.floor(this.tx_data_bytes / 1024 / 1024 / 1024) + 'GB'
			var txPercentage = (this.tx_data_bytes / peakBandwidth) *100;
			var rxAmount = Math.floor(this.rx_data_bytes / 1024 / 1024 / 1024) + 'GB';
			var rxPercentage = (this.rx_data_bytes / peakBandwidth) *100
			
			var throughputBar = '<a onclick="getSwitchBandwidth(\'' + this['serial'] + '\')"><div class="progress progress-thin"><div class="progress-bar progress-bar-info" style="width: '+txPercentage+'%"><span class="sr-only">'+txAmount+'</span></div><div class="progress-bar progress-bar-danger" style="width: '+rxPercentage+'%"><span class="sr-only">'+rxAmount+'</span></div></div></a>';
			
			var actionBtns = '<a class="btn btn-link btn-warning" onclick="getSwitchBandwidth(\'' + this['serial'] + '\')"><i class="fa-solid fa-chart-line"></i></a> ';
			
			// Add row to table
			table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + deviceName + '</strong></a>', '<span title="totalThroughput">'+labelString+'</span>', throughputBar]);
		});
		$('#bandwidth-table')
			.DataTable()
			.rows()
			.draw();
			
		$('#bandwidth-table').DataTable().columns.adjust().draw();
		
		if (selectedSwitch) getAPBandwidth(selectedSwitch)
	});
}

function getSwitchBandwidth(currentSerial) {
	selectedSwitch = currentSerial;
	var currentSwitch = findDeviceInMonitoring(currentSerial);
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;
	
	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);
	var switchName = currentSerial;
	if (currentSwitch) switchName = currentSwitch.name
	if (document.getElementById('bandwidthLabel')) document.getElementById('bandwidthLabel').innerHTML = switchName + ' bandwidth for the last ' + select.options[select.selectedIndex].innerHTML + ' (in MB)';
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches/bandwidth_usage?serial='+currentSerial+'&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches/bandwidth_usage)');
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


function showStacks() {
	$('#stacks-table')
	.DataTable()
	.clear();
	
	var table = $('#stacks-table').DataTable();
	// Process Stack Health...
	
	
	$.each(stacks, function() {
		var downMember = 0;
		var upMember = 0;
		var site;
		var group; 
		
		stackSwitches = stackInfo[this.id];
		
		var commander;
		$.each(stackSwitches, function () {
			if (this.status === 'Down') downMember++;
			else upMember++;
			group = this.group_name
			if (site && site !== this.site) site = 'Multiple Sites';
			else site = this.site;
			
			if (this.switch_role == 2) commander = this.serial
		});
		
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this['status'] == 'Up' && downMember == 0) {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		} else if (this['status'] == 'Up' && downMember != 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
		}
		
		
		var memberStatus = '';
		if (upMember > 0) memberStatus += '<i class="fa-solid fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + upMember + ' </strong></span>';
		if (downMember > 0) memberStatus += '<i class="fa-solid fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + downMember + ' </strong></span>';

		var name = encodeURI(this['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + commander + '/'+ this.id +'?cssn=' + commander + '&cdcn=' + name + '&csstn='+ this.id +'&nc=device';

		table.row.add(['<a href="' + centralURL + '" target="_blank"><strong>' + this['name'] + '</strong></a>', status, this.status, this.split_policy, this.topology, memberStatus, site, group]);
	});

	$('#stacks-table')
		.DataTable()
		.rows()
		.draw();
		
		
	$('#StackModalLink').trigger('click');
}