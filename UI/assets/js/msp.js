/*
Central Automation v1.34
Updated: 1.34.3
Aaron Scott (WiFi Downunder) 2023
*/

// used to store devices in the unfiltered table 
var apDisplay = []; 
var switchDisplay = [];
var gatewayDisplay = [];

var mspCustomerCounter = 0;
var mspCustomerTotal = 0;

function loadCurrentPageAP() {
	loadMSPAPUI();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		MSP functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getIDforCustomer(customer) {
	/*  
		get customer from customer monitoring data
		return customer_id for matching customer
	*/
	var customerId = -1; // used when the customer isn't found
	//console.log('looking for customer: '+customer)
	$.each(mspCustomers, function() {
		if (this['customer_name'] === customer) {
			customerId = this['customer_id'];
			return false;
		}
	});
	return customerId;
}

function csvContainsCustomer() {
	var containsCustomer = true;
	$.each(csvData, function() {
		if (!this['CUSTOMER']) containsCustomer = false;
		return false;
	});
	return containsCustomer;
}

function selectCustomer() {
	var select = document.getElementById('customerselector');
	manualCustomer = select.value;
	document.getElementById('manualCustomerParagraph').innerText = 'Manual Customer: ' + manualCustomer;
	var mcd = document.getElementById('manualCustomerDiv');
	mcd.style.display = 'block';
	showNotification('ca-folder-replace', manualCustomer + ' will be used for devices with no customer assigned. Please re-run the task.', 'top', 'center', 'warning');
}

function showMSPCard(display) {
	var x = document.getElementById('msp_card');
	if (x) {
		if (display) {
			x.style.display = 'block';
		} else {
			x.style.display = 'none';
		}
	}
}

function isMSP(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/devices?limit=1&offset=0&device_allocation_status=0&device_type=iap',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/msp_api/v1/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('message')) {
			if (response.message.includes('Permission denied')) {
				showMSPCard(false);
				logInformation('Not an MSP user - keeping MSP card hidden');
			} else {
				showMSPCard(true);
				logInformation('MSP user - enabling MSP card');
			}
		} else {
			showMSPCard(true);
			logInformation('MSP user - enabling MSP card');
		}
	});
}

function updateMSPData() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification('ca-dish', 'Updating MSP Data...', 'bottom', 'center', 'info');
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	getMSPResources();	
	
	$(document.getElementById('ap_icon')).addClass('text-warning');
	$(document.getElementById('ap_icon')).removeClass('text-danger');
	$(document.getElementById('ap_icon')).removeClass('text-success');
	
	$(document.getElementById('switch_icon')).addClass('text-warning');
	$(document.getElementById('switch_icon')).removeClass('text-danger');
	$(document.getElementById('switch_icon')).removeClass('text-success');
	
	$(document.getElementById('gateway_icon')).addClass('text-warning');
	$(document.getElementById('gateway_icon')).removeClass('text-danger');
	$(document.getElementById('gateway_icon')).removeClass('text-success');
	
	mspCustomerCounter = 0;

	apPromise = new $.Deferred();
	switchPromise = new $.Deferred();
	gatewayPromise = new $.Deferred();
	customerPromise = new $.Deferred();
	mspPromise = new $.Deferred();
	$.when(getMSPAPData(0), getMSPSwitchData(0), getMSPGatewayData(0), getMSPCustomerData(0), getLicensingData()).then(function() {
		//console.log('Got ALL Inventories');
		mspPromise.resolve();
		loadCurrentPageAP();
	});

	updateGroupData();
	return mspPromise.promise();
}

function getMSPResources() {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/resource',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/msp_api/v1/resource)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		//console.log(response);
		if (response.branding && response.branding.logo_image_url) {
			document.getElementById('msp_logo').src = response.branding.logo_image_url;
			document.getElementById('msp_logo_card').style.display = 'block';
		} else {
			document.getElementById('msp_logo_card').style.display = 'none';
		}
	});
}

function getMSPAPData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=iap',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspAPs.length == mspAPCount) {
				apPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/msp/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).addClass('text-warning');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '' + response.total + '';
			if (offset === 0) {
				apNotification = showProgressNotification('ca-wifi', 'Obtaining MSP APs...', 'bottom', 'center', 'info');
				mspAPs = [];
				mspAPMonitoring = [];
				mspAPCount = response.total;
				$('#msp-ap-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspAPs = mspAPs.concat(response.devices);
			
			offset += apiMSPLimit;
			if (offset < mspAPCount) {
				var apProgress = (offset / response.total) * 100;
				apNotification.update({ progress: apProgress });
				getMSPAPData(offset);
				
				loadMSPAPUI();
				
			} else {
				loadMSPAPUI();

				$(document.getElementById('ap_icon')).removeClass('text-warning');
				$(document.getElementById('ap_icon')).removeClass('text-danger');
				$(document.getElementById('ap_icon')).addClass('text-success');
				if (apNotification) {
					apNotification.update({ progress: 100, type: 'success', message: 'MSP APs Obtained' });
					setTimeout(apNotification.close, 2000);
				}
			}
		}
	});
	return apPromise.promise();
}

function loadMSPAPUI() {
	
	apDisplay = [];
	
	$('#msp-ap-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#msp-ap-table').DataTable();
	
	$.each(mspAPs, function() {

		apDisplay.push(this);
		var monitoringInfo = findDeviceInMSPMonitoring(this['serial']);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(this['serial']);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(this['serial'])
		
		if (monitoringInfo) {
			var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);
			var uptimeString = '';
			
			var clientCount = '';
			
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (monitoringInfo.status == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
				uptimeString = duration.humanize();
				if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
				if (monitoringInfo['client_count'] == 0) clientCount = '0';
			}
			
			var publicIP = '';
			if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
			else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
			
			var labels = '';
			if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
			
			var firmwareVersion = '';
			if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status:'Down', uptimeString, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', labels, clientCount, firmwareVersion, publicIP, this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		} else {
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			var status = '<i class="fa-solid fa-circle text-muted"></i>';
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, '', '', '', '', '', '', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		}
	});

	$('[data-toggle="tooltip"]').tooltip();

	// Force reload of table data
	$('#msp-ap-table')
		.DataTable()
		.rows()
		.draw();
		
	table.columns.adjust().draw();
}

function getCustomerAPData(offset, customerId) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
			tenantID: customerId,
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/aps)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			mspAPMonitoring = mspAPMonitoring.concat(response.aps);
			
			offset += apiMSPLimit;
			if (offset < response.total) {
				getCustomerAPData(offset);
			} else {
				loadMSPAPUI();
				mspCustomerCounter++;
				var customerProgress = (mspCustomerCounter / mspCustomerTotal) * 100;
				if (customerNotification) customerNotification.update({ progress: customerProgress });
				if (mspCustomerCounter >= mspCustomerTotal) {
					if (customerNotification) {
						customerNotification.update({ progress: 100, type: 'success', message: 'Customer data otbained' });
						setTimeout(customerNotification.close, 2000);
					}
				}

			}
		}
	});
}

function getMSPSwitchData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=switch',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspSwitches.length == mspSwitchCount) {
				switchPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/msp/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).addClass('text-warning');
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '' + response.total + '';
			if (offset === 0) {
				switchNotification = showProgressNotification('ca-switch-stack', 'Obtaining MSP Switches...', 'bottom', 'center', 'info');
				mspSwitches = [];
				mspSwitchMonitoring = [];
				mspSwitchCount = response.total;
				$('#msp-switch-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspSwitches = mspSwitches.concat(response.devices);

			offset += apiMSPLimit;
			if (offset < mspSwitchCount) {
				var switchProgress = (offset / response.total) * 100;
				switchNotification.update({ progress: switchProgress });
				getMSPSwitchData(offset);
				loadMSPSwitchUI();
			} else {
				loadMSPSwitchUI();

				$(document.getElementById('switch_icon')).removeClass('text-warning');
				$(document.getElementById('switch_icon')).removeClass('text-danger');
				$(document.getElementById('switch_icon')).addClass('text-success');
				if (switchNotification) {
					switchNotification.update({ progress: 100, type: 'success', message: 'MSP Switches' });
					setTimeout(switchNotification.close, 2000);
				}
			}
		}
	});
	return switchPromise.promise();
}

function loadMSPSwitchUI() {
	
	switchDisplay = [];
	
	$('#msp-switch-table')
		.DataTable()
		.rows()
		.remove();
	
	var table = $('#msp-switch-table').DataTable();
	
	$.each(mspSwitches, function() {	
		switchDisplay.push(this);
		
		var monitoringInfo = findDeviceInMSPMonitoring(this['serial']);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(this['serial']);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(this['serial'])
		
		if (monitoringInfo) {
			var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);
			var uptimeString = '';
			
			var clientCount = '';
			
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (monitoringInfo.status == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
				uptimeString = duration.humanize();
				if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
				if (monitoringInfo['client_count'] == 0) clientCount = '0';
			}
			
			var publicIP = '';
			if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
			else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
			
			var labels = '';
			if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
			
			var firmwareVersion = '';
			if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status:'Down', uptimeString, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', labels, clientCount, firmwareVersion, publicIP, this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		} else {
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			var status = '<i class="fa-solid fa-circle text-muted"></i>';
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, '', '', '', '', '', '', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		}
	});

	$('[data-toggle="tooltip"]').tooltip();

	// Force reload of table data
	$('#msp-switch-table')
		.DataTable()
		.rows()
		.draw();
	
	table.columns.adjust().draw();
}

function getCustomerSwitchData(offset, customerId) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
			tenantID: customerId,
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			mspSwitchMonitoring = mspSwitchMonitoring.concat(response.switches);

			if (offset + apiLimit < response.total) {
				getCustomerSwitchData(offset + apiLimit);
			} else {
				loadMSPSwitchUI();
				mspCustomerCounter++;
				var customerProgress = (mspCustomerCounter / mspCustomerTotal) * 100;
				if (customerNotification) customerNotification.update({ progress: customerProgress });
				if (mspCustomerCounter >= mspCustomerTotal) {
					if (customerNotification) {
						customerNotification.update({ progress: 100, type: 'success', message: 'Customer data otbained' });
						setTimeout(customerNotification.close, 2000);
					}
				}
			}
		}
	});
}

function getMSPGatewayData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/devices?limit=' + apiMSPLimit + '&offset=' + offset + '&device_allocation_status=0&device_type=all_controller',
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspGateways.length == mspGatewayCount) {
				gatewayPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/msp/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		//console.log(response)
		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '' + response.total + '';
			if (offset === 0) {
				gatewayNotification = showProgressNotification('ca-gateway', 'Obtaining MSP Gateways...', 'bottom', 'center', 'info');
				mspGateways = [];
				mspGatewayMonitoring = [];
				mspGatewayCount = response.total;
				$('#msp-gateway-table')
					.DataTable()
					.rows()
					.remove();
			}
			mspGateways = mspGateways.concat(response.devices);
			
			offset += apiMSPLimit;
			if (offset < mspGatewayCount) {
				var gatewayProgress = (offset / response.total) * 100;
				gatewayNotification.update({ progress: gatewayProgress });
				getMSPGatewayData(offset);
				loadMSPGatewayUI();
			} else {
				loadMSPGatewayUI();

				$(document.getElementById('gateway_icon')).removeClass('text-warning');
				$(document.getElementById('gateway_icon')).removeClass('text-danger');
				$(document.getElementById('gateway_icon')).addClass('text-success');
				if (gatewayNotification) {
					gatewayNotification.update({ progress: 100, type: 'success', message: 'MSP Gateways Obtained' });
					setTimeout(gatewayNotification.close, 2000);
				}
			}
		}
	});
	return gatewayPromise.promise();
}

function loadMSPGatewayUI() {
	gatewayDisplay = [];
	
	$('#msp-gateway-table')
		.DataTable()
		.rows()
		.remove();
	
	
	var table = $('#msp-gateway-table').DataTable();

	$.each(mspGateways, function() {
		gatewayDisplay.push(this);

		/*	var monitoringInfo = findDeviceInMSPMonitoring(this['serial']);
		if (monitoringInfo) {
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (monitoringInfo.status == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
			}
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', this.tier_type ? titleCase(this.tier_type) : '']);
		} else {
			var status = '<i class="fa-solid fa-circle text-muted"></i>';
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, '', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '']);
		}*/
		
		
		var monitoringInfo = findDeviceInMSPMonitoring(this['serial']);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(this['serial']);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(this['serial'])
		
		if (monitoringInfo) {
			var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);
			var uptimeString = '';
			
			var clientCount = '';
			
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (monitoringInfo.status == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
				uptimeString = duration.humanize();
				if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
				if (monitoringInfo['client_count'] == 0) clientCount = '0';
			}
			
			var publicIP = '';
			if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
			else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
			
			var labels = '';
			if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
			
			var firmwareVersion = '';
			if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status:'Down', uptimeString, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', labels, firmwareVersion, this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		} else {
			
			var subscriptionKey = this.subscription_key;
			if (!subscriptionKey) subscriptionKey = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKey]) subEndDate = subscriptionKeys[subscriptionKey]['end_date'];
			
			var status = '<i class="fa-solid fa-circle text-muted"></i>';
			table.row.add([this.customer_name, '<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, '', '', '', '', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '', subscriptionKey ? subscriptionKey : '', subscriptionKey ? '<span style="display:none;">' + subEndDate + '</span>' + moment(subEndDate).format('L') : '']);
		}
	});
	

	$('[data-toggle="tooltip"]').tooltip();

	// Force reload of table data
	$('#msp-gateway-table')
		.DataTable()
		.rows()
		.draw();
	
	table.columns.adjust().draw();
}

function getCustomerGatewayData(offset, customerId) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
			tenantID: customerId,
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/gateways)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error') || response.hasOwnProperty('errorcode')) {
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			mspGatewayMonitoring = mspGatewayMonitoring.concat(response.gateways);

			if (offset + apiLimit < response.total) {
				getCustomerGatewayData(offset + apiLimit);
			} else {
				loadMSPGatewayUI();
				mspCustomerCounter++;
				var customerProgress = (mspCustomerCounter / mspCustomerTotal) * 100;
				if (customerNotification) customerNotification.update({ progress: customerProgress });
				if (mspCustomerCounter >= mspCustomerTotal) {
					if (customerNotification) {
						customerNotification.update({ progress: 100, type: 'success', message: 'Customer data otbained' });
						setTimeout(customerNotification.close, 2000);
					}
				}
			}
		}
	});
}

function getMSPCustomerData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/customers?limit=' + apiMSPLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (mspGateways.length == mspGatewayCount) {
				customerPromise.resolve();
			}
		},
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/msp_api/v1/customers)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('customer_icon')).removeClass('text-success');
			$(document.getElementById('customer_icon')).addClass('text-warning');
			if (document.getElementById('customer_count')) document.getElementById('customer_count').innerHTML = '-';
		} else if (response.hasOwnProperty('message')) {
			showNotification('ca-globe', response.message, 'bottom', 'center', 'danger');
		} else {
			if (document.getElementById('customer_count')) document.getElementById('customer_count').innerHTML = '' + response.total + '';
			
			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset === 0) {
				customerNotification = showProgressNotification('ca-multiple-11', 'Obtaining Customer Data...', 'bottom', 'center', 'info');
				mspCustomers = [];
				mspCustomerCount = response.total;
				$('#customer-table')
					.DataTable()
					.rows()
					.remove();
				if (page.includes('workflow-msp')) {
					// remove old groups from the selector
					select = document.getElementById('customerselector');
					select.options.length = 0;
				}
			}
			// Used for progress bar notification
			mspCustomerTotal = response.total * 3;
			
			mspCustomers = mspCustomers.concat(response.customers);
			for (var i=0;i<response.customers.length;i++) {
				var customer = response.customers[i];
				// Cleanup string responses
				var clean = customer['account_status'];
				if (clean) clean = titleCase(noUnderscore(clean));

				var customerGroup = '';
				if (customer['group']) customerGroup = customer.group.name;
				// Add row to table
				var table = $('#customer-table').DataTable();
				table.row.add([customer['customer_name'], customer['account_type'], clean, customerGroup, customer['description']]);

				// Grab MSP ID for use later on
				mspID = customer['msp_id'];

				if (page.includes('workflow-msp')) {
					// Add site to the dropdown selector
					$('#customerselector').append($('<option>', { value: customer['customer_name'], text: customer['customer_name'] }));
				}
				setTimeout(getCustomerAPData,i+apiDelay,0, customer['customer_id']);
				setTimeout(getCustomerSwitchData,i+apiDelay,0, customer['customer_id']);
				setTimeout(getCustomerGatewayData,i+apiDelay,0, customer['customer_id']);
			}

			if (offset + apiMSPLimit < response.total) {
				getMSPCustomerData(offset + apiMSPLimit);
			} else {
				// Force reload of table data
				$('#customer-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('customer_icon')).removeClass('text-warning');
				$(document.getElementById('customer_icon')).addClass('text-success');
			}
		}
	});
	return customerPromise.promise();
}

/*  
	Customer Assignment Functions
*/
function checkForCustomerMoveCompletion() {
	/*  
		UI cleanup after processing moves
	*/

	if (moveCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Customer Assignment Failure',
					text: 'Some or all devices failed to move to the specified customer',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Customer Assignment Success',
					text: 'All devices were to moved to the specified customers',
					icon: 'success',
				});
			}
			if (manualCustomer) {
				manualCustomer = '';
				var mcd = document.getElementById('manualCustomerDiv');
				mcd.style.display = 'none';
			}
			updateMSPData();
		} else {
			logInformation('Automation: Customer assignment complete');
			autoCustomerPromise.resolve();
		}
	}
}

function unassignDeviceFromCustomer(device) {
	/*  
		Assign device back to MSP
	*/
	var deviceSerial = device['SERIAL'];
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + mspID + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: [{ serial: device['serial'], mac: device['macaddr'] }] }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.status != 202) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/msp/<MSP_ID>/devices)');
			} else if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for device: ' + deviceSerial);
			} else {
				logError(response.reason);
			}
		}
	});
}

function assignDeviceToCustomer(device, customerId) {
	/*  
		Assign device to a customer (one at a time)
	*/
	var deviceSerial = device['SERIAL'];
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + customerId + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: [{ serial: device['serial'], mac: device['macaddr'] }] }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.status != 202) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/msp/<CUSTOMER_ID/<devices)');
			} else if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for device: ' + deviceSerial);
			} else {
				logError(response.reason);
			}
		}
		moveCounter = moveCounter + 1;
		checkForCustomerMoveCompletion();
	});
}

function unassignDevicesFromCustomers(devices) {
	/*  
		Assign supplied devices back to MSP
	*/
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + mspID + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: devices }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.status != 202) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/msp/<MSP_ID>/devices)');
			} else if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for supplied devices');
			} else {
				logError(response.reason);
			}
		}
	});
}

function assignDevicesToSingleCustomer(devices, customerId) {
	/*  
		Assign supplied devices back to a single customer
	*/
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/msp/' + customerId + '/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ devices: devices }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.status != 202) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/msp/<CUSTOMER_ID>/devices)');
			} else if (response.error_code) {
				logError(titleCase(noUnderscore(response.error_code)) + ' for supplied devices');
			} else {
				logError(response.reason);
			}
		}
		moveCounter = moveCounter + 1;
		checkForCustomerMoveCompletion();
	});
}

function assignDevicesToCustomer() {
	/*  
		Move each device to the correct customer - either based on CSV or selected customer
	*/
	showNotification('ca-exchange', 'Assigning devices to customers...', 'bottom', 'center', 'info');
	moveCounter = 0;
	$.each(csvData, function() {
		var selectedCustomer = manualCustomer;
		var currentSerial = this['SERIAL'].trim();
		var foundDevice = findDeviceInMSPInventory(currentSerial);
		if (this['CUSTOMER']) selectedCustomer = this['CUSTOMER'].trim();

		if (foundDevice && foundDevice.customer_name === selectedCustomer) {
			console.log('No need to change Customer');
			moveCounter = moveCounter + 1;
			checkForCustomerMoveCompletion();
		} else if (foundDevice && foundDevice.customer_name !== selectedCustomer && getIDforCustomer(foundDevice.customer_name) != -1) {
			console.log('Assigning device back to MSP');
			$.when(unassignDeviceFromCustomer(foundDevice)).then(function() {
				// now assign to new Customer ID
				console.log('Assigning device to ' + selectedCustomer);
				assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
			});
		} else {
			console.log('assigning customer');
			assignDeviceToCustomer(foundDevice, getIDforCustomer(selectedCustomer));
		}
	});
	if (currentWorkflow !== '') {
		return autoCustomerPromise.promise();
	}
}

function assignAllDevicesToCustomer() {
	/*  
		Move each device to the selected customer
	*/
	showNotification('ca-exchange', 'Assigning devices to a single customer...', 'bottom', 'center', 'info');
	moveCounter = 0;
	var devicesArray = [];
	var unassignDevicesArray = [];
	$.each(csvData, function() {
		var foundDevice = findDeviceInMSPInventory(this['SERIAL'].trim());
		if (foundDevice && getIDforCustomer(foundDevice.customer_name) != -1) {
			unassignDevicesArray.push({ serial: this['SERIAL'].trim(), mac: cleanMACAddress(this['MAC']) });
		}
		devicesArray.push({ serial: this['SERIAL'].trim(), mac: cleanMACAddress(this['MAC']) });
	});

	var selectedCustomer = manualCustomer;
	//console.log("assigning all devices back to MSP")
	if (unassignDevicesArray.length != 0) {
		$.when(unassignDevicesFromCustomers(unassignDevicesArray)).then(function() {
			// now assign to new Customer ID
			console.log('Assigning all devices to ' + selectedCustomer);
			assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
		});
	} else {
		assignDevicesToSingleCustomer(devicesArray, getIDforCustomer(selectedCustomer));
	}
	if (currentWorkflow !== '') {
		return autoCustomerPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		MSP Automation functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function addAndCustomers() {
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now move devices
		$.when(updateMSPData()).then(function() {
			$.when(assignDevicesToCustomer()).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added and moved into a group',
						icon: 'success',
					});
				}
				if (manualCustomer) {
					manualCustomer = '';
					var mcd = document.getElementById('manualCustomerDiv');
					mcd.style.display = 'none';
				}
				updateMSPData();
			});
		});
	});
}

function addAndCustomersAndLicense() {
	licenseCounter = 0;
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// need to refresh MSPData - will need to wait.
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignDevicesToCustomer()).then(function() {
				$.when(updateMSPData()).then(function() {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function() {
						// licensing completed
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Automation Failure',
								text: 'Some or all devices failed to be added, assigned to customer and licensed',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Automation Success',
								text: 'All devices were added, assigned and licensed',
								icon: 'success',
							});
						}
						if (manualCustomer) {
							manualCustomer = '';
							var mcd = document.getElementById('manualCustomerDiv');
							mcd.style.display = 'none';
						}
						updateMSPData();
					});
				});
			});
		});
	});
}

function addAndSingleCustomer() {
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function() {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added and moved into a group',
						icon: 'success',
					});
				}
				if (manualCustomer) {
					manualCustomer = '';
					var mcd = document.getElementById('manualCustomerDiv');
					mcd.style.display = 'none';
				}
				updateMSPData();
			});
		});
	});
}

function addAndSingleCustomerAndLicense() {
	licenseCounter = 0;
	autoAddPromise = new $.Deferred();
	autoCustomerPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		$.when(updateMSPData()).then(function() {
			// Add devices completed  - now move devices
			$.when(assignAllDevicesToCustomer()).then(function() {
				$.when(updateMSPData()).then(function() {
					// Devices assigned to customers
					$.when(licenseDevicesFromCSV(true)).then(function() {
						// licensing completed
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Automation Failure',
								text: 'Some or all devices failed to be added, assigned to customer and licensed',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Automation Success',
								text: 'All devices were added, assigned and licensed',
								icon: 'success',
							});
						}
						if (manualCustomer) {
							manualCustomer = '';
							var mcd = document.getElementById('manualCustomerDiv');
							mcd.style.display = 'none';
						}
						updateMSPData();
					});
				});
			});
		});
	});
}

/*  
	MSP Administration Functions
*/

function createCustomer() {
	var customerName = document.getElementById('customerName').value;
	var customerDescription = document.getElementById('customerDescription').value;
	var addToGroupValue = document.getElementById('addToGroupCheckbox').checked;
	var selectedGroup = document.getElementById('groupselector').value;

	showNotification('ca-c-add', 'Adding new Customer...', 'bottom', 'center', 'info');

	var data;
	if (addToGroupValue) {
		data = JSON.stringify({ customer_name: customerName, description: customerDescription, group: { name: selectedGroup } });
	} else {
		data = JSON.stringify({ customer_name: customerName, description: customerDescription });
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/msp_api/v1/customers',
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.status === '503') {
			apiErrorCount++;
			logError('Central Server Error (503): ' + response.reason + ' (/msp_api/v1/customers)');
		} else if (response.status_code == 200) {
			Swal.fire({
				title: 'Add Success',
				text: 'Customer was successfully created',
				icon: 'success',
			});
			// refresh group data to include new group
			getMSPCustomerData(0);
		} else {
			logError(response.status);
			Swal.fire({
				title: 'Add Failure',
				text: 'Customer was not able to be created',
				icon: 'error',
			});
		}
	});
}

function downloadMSPInventory() {
	mspCSVData = buildMSPCSVData(false);

	var csv = Papa.unparse(mspCSVData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;
	csvLink.setAttribute('download', 'msp-inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function downloadMSPExpiringInventory() {
	mspCSVData = buildMSPCSVData(true);

	var csv = Papa.unparse(mspCSVData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;
	csvLink.setAttribute('download', 'msp-expiring-inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

function buildMSPCSVData(expiringOnly) {
	//CSV header
	var customerKey = 'CUSTOMER';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var typeKey = 'DEVICE TYPE';
	var skuKey = 'PART NUMBER';
	var modelKey = 'MODEL';
	var statusKey = 'STATUS';
	var uptimeKey = 'UPTIME';
	var ipKey = 'IP ADDRESS';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var labelKey = 'LABELS';
	var clientsKey = 'CLIENTS';
	var firmwareKey = 'FIRMWARE VERSION';
	var publicIPKey = 'PUBLIC IP';
	var licenseKey = 'LICENSE';
	var subscriptionKey = 'SUBSCRIPTION KEY';
	var expiryKey = 'SUBSCRIPTION EXPIRY';
	var remainingKey = 'DAYS REMAINING';

	var csvDataBuild = [];

	// For each row MSP APs
	$.each(mspAPs, function() {
		var device = this;
		
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMSPMonitoring(device.serial);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(device.serial);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(device.serial)
		
		var subscriptionKeyString = device.subscription_key;
		if (!subscriptionKeyString) subscriptionKeyString = fullInventoryInfo.subscription_key;
		
		var subEndDate = '';
		if (subscriptionKeys[subscriptionKeyString]) subEndDate = subscriptionKeys[subscriptionKeyString]['end_date'];
		
		var keyExpiry = '';
		if (fullInventoryInfo && fullInventoryInfo['subscription_key']) keyExpiry = moment(subEndDate).format('L');
		
		var daysRemaining = '';
		var dayCount = -1;
		if (subEndDate != '') {
			var today = moment();
			var endDate = moment(subEndDate);
			if (today.isBefore(endDate)) {
				daysRemaining = endDate.diff(today, 'days');
				dayCount = endDate.diff(today, 'days');
			}
		}
		
		if ((expiringOnly && dayCount > 0 && dayCount < 90) || !expiringOnly) {
			if (monitoringInfo) {
				var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
				var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';
			
				var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);
				var uptimeString = '';
			
				
				var publicIP = '';
				if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
				else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
				
				var labels = '';
				if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
				
				var firmwareVersion = '';
				if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
				
				var clientCount = '';
				
				if (monitoringInfo['status'] == "Up") {
					uptimeString = duration.humanize();
					if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
					if (monitoringInfo['client_count'] == 0) clientCount = '0';
				}
			
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: uptimeString, [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [clientsKey]:clientCount, [firmwareKey]: firmwareVersion, [publicIPKey]: publicIP, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining});
			} else {		
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [labelKey]: '', [clientsKey]:'', [firmwareKey]: '', [publicIPKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining });
			}
		}
	});

	$.each(mspSwitches, function() {
		var device = this;
		
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMSPMonitoring(device.serial);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(device.serial);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(device.serial)
		
		var subscriptionKeyString = device.subscription_key;
		if (!subscriptionKeyString) subscriptionKeyString = fullInventoryInfo.subscription_key;
		
		var subEndDate = '';
		if (subscriptionKeys[subscriptionKeyString]) subEndDate = subscriptionKeys[subscriptionKeyString]['end_date'];
		
		var keyExpiry = '';
		if (fullInventoryInfo && fullInventoryInfo['subscription_key']) keyExpiry = moment(subEndDate).format('L');
		
		var daysRemaining = '';
		var dayCount = -1;
		if (subEndDate != '') {
			var today = moment();
			var endDate = moment(subEndDate);
			if (today.isBefore(endDate)) {
				daysRemaining = endDate.diff(today, 'days');
				dayCount = endDate.diff(today, 'days');
			}
		}
		
		if ((expiringOnly && dayCount > 0 && dayCount < 90) || !expiringOnly) {
			if (monitoringInfo) {
				var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
				var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';
			
				var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);
				var uptimeString = '';
			
				
				var publicIP = '';
				if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
				else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
				
				var labels = '';
				if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
				
				var firmwareVersion = '';
				if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
				
				var clientCount = '';
				
				if (monitoringInfo['status'] == "Up") {
					uptimeString = duration.humanize();
					if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
					if (monitoringInfo['client_count'] == 0) clientCount = '0';
				}
			
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: uptimeString, [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [clientsKey]:clientCount, [firmwareKey]: firmwareVersion, [publicIPKey]: publicIP, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining });
			} else {
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [labelKey]: '', [clientsKey]:'', [firmwareKey]: '', [publicIPKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining });
			}
		}
	});

	$.each(mspGateways, function() {
		var device = this;
		
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMSPMonitoring(device.serial);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(device.serial);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(device.serial)
		
		var subscriptionKeyString = device.subscription_key;
		if (!subscriptionKeyString) subscriptionKeyString = fullInventoryInfo.subscription_key;
		
		var subEndDate = '';
		if (subscriptionKeys[subscriptionKeyString]) subEndDate = subscriptionKeys[subscriptionKeyString]['end_date'];
		
		var keyExpiry = '';
		if (fullInventoryInfo && fullInventoryInfo['subscription_key']) keyExpiry = moment(subEndDate).format('L');
		
		var daysRemaining = '';
		var dayCount = -1;
		if (subEndDate != '') {
			var today = moment();
			var endDate = moment(subEndDate);
			if (today.isBefore(endDate)) {
				daysRemaining = endDate.diff(today, 'days');
				dayCount = endDate.diff(today, 'days');
			}
		}
		
		if ((expiringOnly && dayCount > 0 && dayCount < 90) || !expiringOnly) {
			if (monitoringInfo) {
				var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
				var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';
			
				var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);
				var uptimeString = '';
			
				
				var publicIP = '';
				if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
				else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
				
				var labels = '';
				if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
				
				var firmwareVersion = '';
				if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
				
				var clientCount = '';
				
				if (monitoringInfo['status'] == "Up") {
					uptimeString = duration.humanize();
					if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
					if (monitoringInfo['client_count'] == 0) clientCount = '0';
				}
			
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: uptimeString, [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [clientsKey]:clientCount, [firmwareKey]: firmwareVersion, [publicIPKey]: publicIP, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining });
			} else {		
				csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [labelKey]: '', [clientsKey]:'', [firmwareKey]: '', [publicIPKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry, [remainingKey]: daysRemaining });
			}
		}
	});

	return csvDataBuild;
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download AP Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadAPInventory() {
	csvData = buildInventoryCSVData('#msp-ap-table');

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#msp-ap-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'ap-inventory-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'ap-inventory.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Switch Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadSwitchInventory() {
	csvData = buildInventoryCSVData('#msp-switch-table');

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#msp-switch-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'switch-inventory-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'switch-inventory.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Gateway Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadGatewayInventory() {
	csvData = buildInventoryCSVData('#msp-gateway-table');

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#msp-gateway-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'gateway-inventory-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'gateway-inventory.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build AP CSV 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildInventoryCSVData(sourceTable) {
	//CSV header
	var customerKey = 'CUSTOMER';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var typeKey = 'DEVICE TYPE';
	var skuKey = 'PART NUMBER';
	var modelKey = 'MODEL';
	var statusKey = 'STATUS';
	var uptimeKey = 'UPTIME';
	var ipKey = 'IP ADDRESS';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var labelKey = 'LABELS';
	var clientsKey = 'CLIENTS';
	var firmwareKey = 'FIRMWARE VERSION';
	var publicIPKey = 'PUBLIC IP';
	var licenseKey = 'LICENSE';
	var subscriptionKey = 'SUBSCRIPTION KEY';
	var expiryKey = 'SUBSCRIPTION EXPIRY';

	var csvDataBuild = [];

	var table = $(sourceTable).DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device;
		if (sourceTable.includes('ap')) device = apDisplay[this];
		else if (sourceTable.includes('switch')) device = switchDisplay[this];
		else if (sourceTable.includes('gateway')) device = gatewayDisplay[this];
		
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMSPMonitoring(device.serial);
		if (!monitoringInfo) monitoringInfo = findDeviceInMonitoring(device.serial);
		
		// Needed for subscription key as it is not included in the MSP inventory info
		var fullInventoryInfo = findDeviceInInventory(device.serial)
		
		if (monitoringInfo) {
			var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
			var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';

			var uptime = monitoringInfo['uptime'] ? monitoringInfo['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);
			var uptimeString = '';
		
			
			var publicIP = '';
			if (monitoringInfo.public_ip_address) publicIP = monitoringInfo.public_ip_address;
			else if (monitoringInfo.public_ip)  publicIP = monitoringInfo.public_ip;
			
			var labels = '';
			if (monitoringInfo.labels) labels = monitoringInfo.labels.join(', ');
			
			var firmwareVersion = '';
			if (monitoringInfo.firmware_version) firmwareVersion = monitoringInfo.firmware_version;
			
			var clientCount = '';
			
			if (monitoringInfo['status'] == "Up") {
				uptimeString = duration.humanize();
				if (monitoringInfo['client_count']) clientCount = monitoringInfo['client_count'];
				if (monitoringInfo['client_count'] == 0) clientCount = '0';
			}
			
			var subscriptionKeyString = device.subscription_key;
			if (!subscriptionKeyString) subscriptionKeyString = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKeyString]) subEndDate = subscriptionKeys[subscriptionKeyString]['end_date'];
			
			var keyExpiry = '';
			if (fullInventoryInfo && fullInventoryInfo['subscription_key']) keyExpiry = moment(subEndDate).format('L');

			csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: uptimeString, [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [clientsKey]:clientCount, [firmwareKey]: firmwareVersion, [publicIPKey]: publicIP, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry });
		} else {
			
			var subscriptionKeyString = device.subscription_key;
			if (!subscriptionKeyString) subscriptionKeyString = fullInventoryInfo.subscription_key;
			
			var subEndDate = '';
			if (subscriptionKeys[subscriptionKeyString]) subEndDate = subscriptionKeys[subscriptionKeyString]['end_date'];
			
			var keyExpiry = '';
			if (fullInventoryInfo && fullInventoryInfo['subscription_key']) keyExpiry = moment(subEndDate).format('L');

			csvDataBuild.push({ [customerKey]: device['customer_name'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [labelKey]: '', [clientsKey]:'', [firmwareKey]: '', [publicIPKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: subscriptionKeyString ? subscriptionKeyString : '', [expiryKey]: keyExpiry });
		}
	});

	return csvDataBuild;
}


