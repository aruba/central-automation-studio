/*
Central Automation v1.14.1
Updated: 
© Aaron Scott (WiFi Downunder) 2021-2025
*/

var deviceInfo = [];
var highMemoryCount = 0;
var highCPUCount = 0;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAP() {
	checkDevices();
	$('[data-toggle="tooltip"]').tooltip();
}

function checkDevices() {
	highMemoryCount = 0;
	highCPUCount = 0;
	var apCounter = 0;

	var table = $('#device-table').DataTable();

	var fullAPList = getAPs();
	$.each(fullAPList, function() {
		apCounter++;
		var memoryFree = this.mem_free;
		var memoryTotal = this.mem_total;
		var memoryFreePercentage = (memoryFree / memoryTotal) * 100;
		var memoryUsed = 100 - memoryFreePercentage;

		var cpuUsed = this.cpu_utilization;
		if (cpuUsed > 50) highCPUCount++;

		// If this AP is in a swarm/cluster
		if (memoryFreePercentage < 15) {
			highMemoryCount++;

			// Log and add to list
			var timeNow = moment();
			logInformation('Rebooting ' + this.name + ' (' + this.serial + ') due to high memory utilization - ' + memoryUsed.toFixed(0) + '%');
			deviceInfo.push({ device: this, timeUnix: timeNow.unix(), timeString: timeNow.format('LLL'), reason: 'High Memory Utilization', limit: memoryUsed.toFixed(0) });

			table.row.add(['<span style="display:none;">' + timeNow.unix() + '</span>' + timeNow.format('LLL'), '<strong>' + this['name'] + '</strong>', this['serial'], this['macaddr'], 'High Memory Utilization: ' + memoryUsed.toFixed(0) + '%', this['group_name'], this['site'], this['firmware_version']]);

			$('#device-table')
				.DataTable()
				.rows()
				.draw();

			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/device_management/v1/device/' + this.serial + '/action/reboot',
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
					console.log('Successful reboot of ' + response['serial']);
				} else {
					if (response['description']) logError(response['description']);
				}
			});
		} else if (memoryFreePercentage < 25) {
			highMemoryCount++;
		}
	});

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

	if (document.getElementById('ap_count')) {
		document.getElementById('ap_count').innerHTML = apCounter;
		if (apCounter > 0) {
			$(document.getElementById('ap_icon')).addClass('text-primary');
			$(document.getElementById('ap_icon')).removeClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
		} else {
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-warning');
			$(document.getElementById('ap_icon')).addClass('text-danger');
		}
	}

	try {
		localStorage.setItem('rebooted_aps', JSON.stringify(deviceInfo));
	} catch (e) {
		console.log('Browser Storage Full. Not able to cache rebooted AP information');
	}
}
function loadDeviceInfo() {
	deviceInfo = JSON.parse(localStorage.getItem('rebooted_aps'));
	if (deviceInfo != null && deviceInfo != 'undefined') {
		//load table
		$('#device-table')
			.DataTable()
			.rows()
			.remove();

		var table = $('#device-table').DataTable();
		$.each(deviceInfo, function() {
			table.row.add(['<span style="display:none;">' + this.timeUnix + '</span>' + this.timeString, '<strong>' + this.device['name'] + '</strong>', this.device['serial'], this.device['macaddr'], this.reason + ': ' + this.limit + '%', this.device['group_name'], this.device['site'], this.device['firmware_version']]);
		});

		$('#device-table')
			.DataTable()
			.rows()
			.draw();
	} else {
		deviceInfo = [];
		$('#device-table')
			.DataTable()
			.rows()
			.remove();
		$('#device-table')
			.DataTable()
			.rows()
			.draw();
	}
}
