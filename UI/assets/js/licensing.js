/*
Central Automation v1.13
Updated: 1.42.6
Copyright Aaron Scott (WiFi Downunder) 2021-2024
*/

var keys = [];
var subscribedDevices = [];
var inventoryPromise;
var failedAuth = false;

var licenseNotification;

var subscriptionCounts = {};

var licenseMapping = {
	advanced_ap: 'Advanced AP',
	foundation_ap: 'Foundation AP',
	advance_7005: 'Advance-Base-7005',
	advance_70xx: 'Advanced-70xx/90xx',
	advance_72xx: 'Advanced-72xx/92xx',
	advance_90xx_sec: 'Advanced with Security',
	foundation_switch_6100: 'Foundation-Switch-61XX/25XX/41XX/8-12p',
	foundation_switch_6200: 'Foundation-Switch-62XX/29xx',
	foundation_switch_6300: 'Foundation-Switch-63xx/38xx',
	foundation_switch_6400: 'Foundation-Switch-64xx/54xx',
	foundation_switch_8400: 'Foundation-Switch-8xxx',
	foundation_7005: 'Foundation-Base-70XX',
	foundation_70xx: 'Foundation-70xx/90xx',
	foundation_72xx: 'Foundation-72xx/92xx',
	foundation_wlan_gw: 'Foundation-WLAN-Gateway',
	vgw_2g: 'VGW-2G',
	vgw_4g: 'VGW-4G',
	vgw_500m: 'VGW-500M',
	device_profiling: 'Device-Insight',
	analytics: 'Analytics',
};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Subscription Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getLicensingData() {
	keys = [];
	subscriptionCounts = {};
	licenseNotification = showLongNotification('ca-license-key', 'Checking Central licenses...', 'bottom', 'center', 'info');
	
	var totalNonSubscribed = 0;

	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/stats?license_type=all',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/licensing/v1/subscriptions/stats)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

				
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getLicensingData();
					}
				});
			}
		} else if (response.total) {
		

			failedAuth = false;
			if (response.non_subscribed_devices) totalNonSubscribed = response.non_subscribed_devices;
			
		}
	});

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/licensing/v1/subscriptions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('status') && commandResults.status === '401') {
			// Access Token expired - get a new one and try again.
			$.when(authRefresh()).then(function() {
				if (!failedAuth) {
					getLicensingData();
				}
			});
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);
		// Empty the table
		$('#subscription-table')
			.DataTable()
			.rows()
			.remove();
			
		var totalAvailable = 0;
		var totalQuantity = 0;
		var totalExpiring = 0;

		var table = $('#subscription-table').DataTable();
		$.each(response.subscriptions, function() {
			// Add row to table
			if ((this.acpapp_name === 'nms') && (!this.license_type.includes('UXI') && !this.license_type.includes('Device-Insight'))) {
				keys.push(this);
				var status = '<span data-toggle="tooltip" data-placement="top" title="' + titleCase(this.status) + '"><i class="fa-solid fa-circle text-danger"></i></span>';
				
				
				if (this.status === 'OK') {
					var today = moment();
					var endDate = moment(this.end_date);
					if (today.isBefore(endDate) && endDate.diff(today, 'days') <= 90) {
						status = '<span data-toggle="tooltip" data-placement="top" title="Expiring Within 90 days"><i class="fa-solid fa-circle text-warning"></i></span>';
						showNotification('ca-license-key', 'Subscription Key <strong>' + this.subscription_key + '</strong> expiring soon...', 'bottom', 'center', 'warning');
						totalExpiring += this.quantity;
					} else {
						status = '<span data-toggle="tooltip" data-placement="top" title="' + this.status + '"><i class="fa-solid fa-circle text-success"></i></span>';
					}
					
					// update the subscriptionCounts
					
					totalAvailable += this.available;
					totalQuantity += this.quantity;
					
					var sub = subscriptionCounts[this.license_type];
					if (!sub) sub = {'available':0, 'total':0};
					sub['total'] = sub['total'] + this.quantity;
					sub['available'] = sub['available'] + this.available;
					subscriptionCounts[this.license_type] = sub;
				}
	
				var subType = this.subscription_type;
				if (subType === 'EVAL') subType = 'Evaluation';
				else if (subType === 'NONE') subType = 'Paid';
				
				var actionBtns = '<button class="btn-warning btn-action" onclick="loadDeviceTable(\'' + this.subscription_key + '\')">Devices</button> ';
				table.row.add(['<strong>' + this.subscription_key + '</strong>', subType, status, this.license_type, this.quantity, this.available, '<span style="display:none;">' + this.start_date + '</span>' + moment(this.start_date).format('L'), '<span style="display:none;">' + this.end_date + '</span>' + moment(this.end_date).format('L'), actionBtns]);
			}
		});

		$('#subscription-table')
			.DataTable()
			.rows()
			.draw();

		// Update the Used table
		$('#used-table')
			.DataTable()
			.rows()
			.remove();
			
		
		//Update UI cards
		
		var totalUsed = totalQuantity - totalAvailable;
		if (document.getElementById('total_count')) {
			document.getElementById('total_count').innerHTML = totalQuantity;
			$(document.getElementById('total_icon')).removeClass('text-warning');
			$(document.getElementById('total_icon')).addClass('text-primary');
		}
		
		if (document.getElementById('available_count')) {
			document.getElementById('available_count').innerHTML = totalAvailable;
			if (totalAvailable > 0) {
				$(document.getElementById('available_icon')).addClass('text-success');
				$(document.getElementById('available_icon')).removeClass('text-warning');
				$(document.getElementById('available_icon')).removeClass('text-danger');
			} else {
				$(document.getElementById('available_icon')).removeClass('text-success');
				$(document.getElementById('available_icon')).addClass('text-warning');
				$(document.getElementById('available_icon')).removeClass('text-danger');
			}
		}
		
		if (document.getElementById('used_count')) {
			document.getElementById('used_count').innerHTML = totalUsed;
			$(document.getElementById('used_icon')).removeClass('text-warning');
			$(document.getElementById('used_icon')).addClass('text-success');
		}
		
		if (document.getElementById('unsub_count')) {
			document.getElementById('unsub_count').innerHTML = totalNonSubscribed;
			if (totalNonSubscribed > 0) {
				$(document.getElementById('unsub_icon')).removeClass('text-success');
				$(document.getElementById('unsub_icon')).removeClass('text-warning');
				$(document.getElementById('unsub_icon')).addClass('text-danger');
			} else {
				$(document.getElementById('unsub_icon')).addClass('text-success');
				$(document.getElementById('unsub_icon')).removeClass('text-warning');
				$(document.getElementById('unsub_icon')).removeClass('text-danger');
			}
		}
		
		if (document.getElementById('expiry_count')) {
			document.getElementById('expiry_count').innerHTML = totalExpiring;
			if (totalExpiring > 0) {
				$(document.getElementById('expiry_icon')).removeClass('text-success');
				$(document.getElementById('expiry_icon')).addClass('text-warning');
				$(document.getElementById('expiry_icon')).removeClass('text-danger');
			} else {
				$(document.getElementById('expiry_icon')).addClass('text-success');
				$(document.getElementById('expiry_icon')).removeClass('text-warning');
				$(document.getElementById('expiry_icon')).removeClass('text-danger');
			}
		}
		
		
		var table = $('#used-table').DataTable();
		for (const [key, value] of Object.entries(subscriptionCounts)) {
			if (value['total'] > 0) table.row.add(['<strong>' + key + '</strong>', value['total'] - value['available'], value['available'], value['total']]);
		}
		$('#used-table')
			.DataTable()
			.rows()
			.draw();

		if (licenseNotification) {
			licenseNotification.update({ message: 'Subscription keys retrieved', type: 'success' });
			setTimeout(licenseNotification.close, 1000);
		}

		$('[data-toggle="tooltip"]').tooltip();

		$.when(updateInventory(false)).then(function() {
			loadMonitoringData();
		});
	});
}

/*  --------------------------------
	Download Actions
--------------------------------- */

function downloadSubscriptionKeys() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#subscription-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'subscriptionKeys-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'subscriptionKeys.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function downloadSubscribedDevices() {
	csvData = buildDeviceCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#device-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'subscriptedDevices-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'subscriptedDevices.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	//CSV header
	var subKey = 'SUBSCRIPTION KEY';
	var subTypeKey = 'SUBSCRIPTION TYPE';
	var statusKey = 'STATUS';
	var licenseTypeKey = 'LICENSE TYPE';
	var qtyKey = 'QUANTITY';
	var availableKey = 'AVAILABLE';
	var startKey = 'START DATE';
	var endKey = 'END DATE';

	var csvDataBuild = [];

	var table = $('#subscription-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var subscription = keys[this.toString()];
		var subType = subscription['subscription_type'];
		if (subType === 'EVAL') subType = 'Evaluation';
		else if (subType === 'NONE') subType = 'Paid';
		csvDataBuild.push({ [subKey]: subscription['subscription_key'], [subTypeKey]: subType, [statusKey]: titleCase(subscription['status']), [licenseTypeKey]: subscription['license_type'], [qtyKey]: subscription['quantity'], [availableKey]: subscription['available'], [startKey]: moment(subscription['start_date']).format('L'), [endKey]: moment(subscription['end_date']).format('L') });
	});

	return csvDataBuild;
}

function buildDeviceCSVData() {
	//CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var typeKey = 'DEVICE TYPE';
	var skuKey = 'PART NUMBER';
	var modelKey = 'MODEL';
	var statusKey = 'STATUS';
	var ipKey = 'IP ADDRESS';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var licenseKey = 'LICENSE';

	var csvDataBuild = [];

	var table = $('#device-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = subscribedDevices[this];
		console.log(device.serial);
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMonitoring(device.serial);
		if (monitoringInfo) {
			var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
			var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';

			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		} else {
			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		}
	});

	return csvDataBuild;
}

/* 
//	Load Subscribed Device Table Action
*/
function loadDeviceTable(selectedKey) {
	// Empty the table
	$('#device-table')
		.DataTable()
		.rows()
		.remove();

	// build table data
	var deviceList = getFullInventory();
	subscribedDevices = [];

	var table = $('#device-table').DataTable();
	$.each(deviceList, function() {
		if (this.subscription_key === selectedKey) {
			var monitoringInfo = findDeviceInMonitoring(this.serial);

			// Add row to table
			if (monitoringInfo) {
				var status = '<i class="fa-solid fa-circle text-danger"></i>';
				if (monitoringInfo.status == 'Up') {
					status = '<i class="fa-solid fa-circle text-success"></i>';
				}
				subscribedDevices.push(this);
				table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '']);
			} else {
				var status = '<i class="fa-solid fa-circle text-muted"></i>';
				subscribedDevices.push(this);
				table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, 'Unknown', '', '', '', '']);
			}
		}
	});

	$('#device-table')
		.DataTable()
		.rows()
		.draw();

	document.getElementById('subscribed-device-title').innerHTML = 'Subscribed Devices using Key: <strong>' + selectedKey + '</strong>';

	$('#DeviceModalLink').trigger('click');
}
