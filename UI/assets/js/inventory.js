/*
Central Automation v1.10
Updated: v1.38
Copyright Aaron Scott (WiFi Downunder) 2021-2024
*/

const InventoryType = { All: 0, Unlicensed: 1, Group: 2, Site: 3, Offline: 4, Expiring: 5};

var deviceList = [];
var deviceDisplay = []; // used to store devices in the unfiltered table (depending on the empty group toggle)

var gotAPs = false;
var gotSwitches = false;
var gotGateways = false;

var subscriptionKeys = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Inventory Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
	
function getInventoryData() {
	gotAPs = false;
	gotSwitches = false;
	gotGateways = false;
	updateMonitoringWithClients(false);
}

function loadCurrentPageAP() {
	gotAPs = true;
	loadFullInventory(false);
	$('[data-toggle="tooltip"]').tooltip();
}

function loadCurrentPageSwitch() {
	gotSwitches = true;
	loadFullInventory(false);
	$('[data-toggle="tooltip"]').tooltip();
}

function loadCurrentPageGateway() {
	gotGateways = true;
	loadFullInventory(false);
	$('[data-toggle="tooltip"]').tooltip();
}

function refreshFullInventory() {
	gotAPs = true;
	gotSwitches = true;
	gotGateways = true;
	loadFullInventory(true);
}

function loadFullInventory(forceUpdate) {
	document.getElementById('total_count').innerHTML = '0';
	$(document.getElementById('total_icon')).addClass('text-muted');
	$(document.getElementById('total_icon')).removeClass('text-success');
	$(document.getElementById('total_icon')).removeClass('text-warning');
	$(document.getElementById('total_icon')).removeClass('text-danger');
	$(document.getElementById('total_icon')).removeClass('text-purple');
	$(document.getElementById('total_icon')).removeClass('text-info');
	
	document.getElementById('unlicensed_count').innerHTML = '0';
	$(document.getElementById('unlicensed_icon')).addClass('text-muted');
	$(document.getElementById('unlicensed_icon')).removeClass('text-warning');
	$(document.getElementById('unlicensed_icon')).removeClass('text-danger');
	
	document.getElementById('expiring_count').innerHTML = '0';
	$(document.getElementById('expiring_icon')).addClass('text-muted');
	$(document.getElementById('expiring_icon')).removeClass('text-warning');
	$(document.getElementById('expiring_icon')).removeClass('text-danger');
	
	document.getElementById('no_group_count').innerHTML = '0';
	$(document.getElementById('no_group_icon')).addClass('text-muted');
	$(document.getElementById('no_group_icon')).removeClass('text-warning');
	
	document.getElementById('no_site_count').innerHTML = '0';
	$(document.getElementById('no_site_icon')).addClass('text-muted');
	$(document.getElementById('no_site_icon')).removeClass('text-warning');
	$(document.getElementById('no_site_icon')).removeClass('text-purple');
	
	document.getElementById('offline_count').innerHTML = '0';
	$(document.getElementById('offline_icon')).addClass('text-muted');
	$(document.getElementById('offline_icon')).removeClass('text-info');
	$(document.getElementById('offline_icon')).removeClass('text-warning');
	
	if (gotAPs && gotSwitches && gotGateways) {
		$.when(updateInventory(forceUpdate), getLicensingData()).then(function() {
			// Update date string
			var lastRefresh = new Date(parseInt(localStorage.getItem('inventory_update')));
			document.getElementById('lastUpdateDate').innerHTML = 'Updated: '+ lastRefresh.toLocaleString();
			
			updateTotal();
			loadTable(InventoryType.All);
		});
	}
}

function updateTotal() {
	deviceList = getFullInventory();
	
	var unlicensedCount = 0;
	var expiringCount = 0;
	var noGroupCount = 0;
	var noSiteCount = 0;
	var offlineCount = 0;
	
	$.each(deviceList, function() {
		var monitoringInfo = findDeviceInMonitoring(this.serial);
		if (!this.subscription_key) unlicensedCount++;
		
		var daysRemaining = -1;
		if (this.subscription_key) {
			var today = moment();
			var endDate = moment(subscriptionKeys[this.subscription_key]['end_date']);
			if (today.isBefore(endDate)) {
				daysRemaining = endDate.diff(today, 'days');
			}
		}
		if (daysRemaining > 0 && daysRemaining < 90) expiringCount++;
		
		if (!monitoringInfo) {
			noGroupCount++;
			noSiteCount++;
			offlineCount++;
		} else if (monitoringInfo.group_name === '') noGroupCount++;
		else if (monitoringInfo.site === '') noSiteCount++;
		else if (monitoringInfo.status !== 'Up') offlineCount++;
	})
	
	document.getElementById('total_count').innerHTML = deviceList.length;
	if (unlicensedCount > 0) $(document.getElementById('total_icon')).addClass('text-danger');
	else if (noGroupCount > 0) $(document.getElementById('total_icon')).addClass('text-warning');
	else if (noSiteCount > 0) $(document.getElementById('total_icon')).addClass('text-purple');
	else if (expiringCount > 0) $(document.getElementById('total_icon')).addClass('text-warning');
	else if (offlineCount > 0) $(document.getElementById('total_icon')).addClass('text-info');
	else $(document.getElementById('total_icon')).addClass('text-success');
	
	document.getElementById('unlicensed_count').innerHTML = unlicensedCount;
	$(document.getElementById('unlicensed_icon')).removeClass('text-muted');
	$(document.getElementById('unlicensed_icon')).addClass('text-danger');
	
	document.getElementById('expiring_count').innerHTML = expiringCount;
	$(document.getElementById('expiring_icon')).removeClass('text-muted');
	$(document.getElementById('expiring_icon')).addClass('text-warning');
	
	document.getElementById('no_group_count').innerHTML = noGroupCount;
	$(document.getElementById('no_group_icon')).removeClass('text-muted');
	$(document.getElementById('no_group_icon')).addClass('text-warning');
	
	document.getElementById('no_site_count').innerHTML = noSiteCount;
	$(document.getElementById('no_site_icon')).removeClass('text-muted');
	$(document.getElementById('no_site_icon')).addClass('text-purple');
	
	document.getElementById('offline_count').innerHTML = offlineCount;
	$(document.getElementById('offline_icon')).addClass('text-info');
	$(document.getElementById('offline_icon')).removeClass('text-muted');
}

function loadTable(inventoryFilter) {
	// Empty the table
	$('#inventory-table')
		.DataTable()
		.rows()
		.remove();

	// build table data
	deviceList = getFullInventory();
	deviceDisplay = [];

	var table = $('#inventory-table').DataTable();
	var column;
	if (!document.getElementById('showColumns').checked) {
		column = table.column(17);
		column.visible(false);
		column = table.column(18);
		column.visible(false);
	}
	column = table.column(19);
	column.visible(false);
	
	if (inventoryFilter == InventoryType.All) {
		$(document.getElementById('inventoryAll')).removeClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).addClass('no-focus');
		$(document.getElementById('inventoryExpiring')).addClass('no-focus');
		$(document.getElementById('inventoryGroup')).addClass('no-focus');
		$(document.getElementById('inventorySite')).addClass('no-focus');
		$(document.getElementById('inventoryOffline')).addClass('no-focus');
		let column = table.column(19);
		column.visible(false);
	} else if (inventoryFilter == InventoryType.Unlicensed) {
		$(document.getElementById('inventoryAll')).addClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).removeClass('no-focus');
		$(document.getElementById('inventoryExpiring')).addClass('no-focus');
		$(document.getElementById('inventoryGroup')).addClass('no-focus');
		$(document.getElementById('inventorySite')).addClass('no-focus');
		$(document.getElementById('inventoryOffline')).addClass('no-focus');
	} else if (inventoryFilter == InventoryType.Group) {
		$(document.getElementById('inventoryAll')).addClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).addClass('no-focus');
		$(document.getElementById('inventoryExpiring')).addClass('no-focus');
		$(document.getElementById('inventoryGroup')).removeClass('no-focus');
		$(document.getElementById('inventorySite')).addClass('no-focus');
		$(document.getElementById('inventoryOffline')).addClass('no-focus');
	} else if (inventoryFilter == InventoryType.Site) {
		$(document.getElementById('inventoryAll')).addClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).addClass('no-focus');
		$(document.getElementById('inventoryExpiring')).addClass('no-focus');
		$(document.getElementById('inventoryGroup')).addClass('no-focus');
		$(document.getElementById('inventorySite')).removeClass('no-focus');
		$(document.getElementById('inventoryOffline')).addClass('no-focus');
	} else if (inventoryFilter == InventoryType.Offline) {
		$(document.getElementById('inventoryAll')).addClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).addClass('no-focus');
		$(document.getElementById('inventoryExpiring')).addClass('no-focus');
		$(document.getElementById('inventoryGroup')).addClass('no-focus');
		$(document.getElementById('inventorySite')).addClass('no-focus');
		$(document.getElementById('inventoryOffline')).removeClass('no-focus');
	} else if (inventoryFilter == InventoryType.Expiring) {
		$(document.getElementById('inventoryAll')).addClass('no-focus');
		$(document.getElementById('inventoryUnlicensed')).addClass('no-focus');
		$(document.getElementById('inventoryExpiring')).removeClass('no-focus');
		$(document.getElementById('inventoryGroup')).addClass('no-focus');
		$(document.getElementById('inventorySite')).addClass('no-focus');
		$(document.getElementById('inventoryOffline')).addClass('no-focus');
		column = table.column(17);
		column.visible(true);
		column = table.column(18);
		column.visible(true);
		column = table.column(19);
		column.visible(true);
	}
	
	
	$.each(deviceList, function() {
		
		var daysRemaining = -1;
		if (this.subscription_key) {
			var today = moment();
			var endDate = moment(subscriptionKeys[this.subscription_key]['end_date']);
			if (today.isBefore(endDate)) {
				daysRemaining = endDate.diff(today, 'days');
			}
		}
		
		var monitoringInfo = findDeviceInMonitoring(this.serial);
		// Filter table based on the Selected tile
		if ((inventoryFilter == InventoryType.All) || (inventoryFilter == InventoryType.Unlicensed && !this.subscription_key) || (inventoryFilter == InventoryType.Expiring && daysRemaining > 0 && daysRemaining <= 90) || (inventoryFilter == InventoryType.Group && (!monitoringInfo || monitoringInfo.group_name === '')) || (inventoryFilter == InventoryType.Site && (!monitoringInfo || monitoringInfo.site === '')) || (inventoryFilter == InventoryType.Offline && (!monitoringInfo || monitoringInfo.status !== 'Up'))) {
			
			// Add row to table
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
				
				
				deviceDisplay.push(this);
					table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', uptimeString, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', labels, clientCount, monitoringInfo['firmware_version'] ? monitoringInfo['firmware_version']:'', publicIP, this.tier_type ? titleCase(this.tier_type) : '', this.subscription_key ? this.subscription_key : '', this.subscription_key ? '<span style="display:none;">' + subscriptionKeys[this.subscription_key]['end_date'] + '</span>' + moment(subscriptionKeys[this.subscription_key]['end_date']).format('L') : '', daysRemaining]);
			} else {
				deviceDisplay.push(this);
				var status = '<i class="fa-solid fa-circle text-muted"></i>';
				table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, 'Unknown', '', '', '', '', '', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '', this.subscription_key ? this.subscription_key : '', this.subscription_key ? '<span style="display:none;">' + subscriptionKeys[this.subscription_key]['end_date'] + '</span>' + moment(subscriptionKeys[this.subscription_key]['end_date']).format('L') : '', daysRemaining]);
			}
		}
	});

	$('#inventory-table')
		.DataTable()
		.rows()
		.draw();
	table.columns.adjust().draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDeviceInventory() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#inventory-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'inventory-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'inventory.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Group Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function askToSelectGroup() {
	$('#GroupModalLink').trigger('click');
}

function selectGroup() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will move all devices shown in the table to the ' + manualGroup + ' group',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			moveToGroup(manualGroup);
		}
	});
}

function moveToGroup(selectedGroup) {
	// Build CSV with selected group name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(selectedGroup, undefined);
	processCSV(csvDataBlob);
	// Move devices to the selected Group
	moveDevicesToGroup();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Site Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function askToSelectSite() {
	$('#SiteModalLink').trigger('click');
}

function selectSite() {
	var select = document.getElementById('siteselector');
	manualSite = select.value;
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will move all devices shown in the table to the ' + manualSite + ' site',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			moveToSite(manualSite);
		}
	});
}

function moveToSite(selectedSite) {
	// Build CSV with selected site name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(undefined, selectedSite);
	processCSV(csvDataBlob);
	// Move devices to the selected Site
	moveDevicesToSite();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Licensing Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function askToLicense() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will change the licensing for all devices shown in the table (provided auto-licensing is disabled)',
		icon: 'warning',
		showDenyButton: true,
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		denyButtonColor: '#ff8500',
		denyButtonText: 'Unlicense',
		confirmButtonText: 'License',
	}).then(result => {
		if (result.isDenied) {
			unlicenseDevices();
		}
	});
}

function unlicenseDevices() {
	// Build CSV with selected site name replaced in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = buildCSVData(undefined, undefined);
	processCSV(csvDataBlob);
	// Move devices to the selected Site
	unlicenseDevicesFromCSV();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData(selectedGroup, selectedSite) {
	//CSV header
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

	var table = $('#inventory-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = deviceDisplay[this];
		
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMonitoring(device.serial);
		if (monitoringInfo) {
			var groupToUse = monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '';
			if (selectedGroup) groupToUse = selectedGroup;

			var siteToUse = monitoringInfo['site'] ? monitoringInfo['site'] : '';
			if (selectedSite) siteToUse = selectedSite;

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
			
			var keyExpiry = '';
			if (device['subscription_key']) keyExpiry = moment(subscriptionKeys[device['subscription_key']]['end_date']).format('L');

			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: uptimeString, [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [clientsKey]:clientCount, [firmwareKey]: firmwareVersion, [publicIPKey]: publicIP, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: device['subscription_key'] ? device['subscription_key'] : '', [expiryKey]: keyExpiry });
		} else {
			var groupToUse = '';
			if (selectedGroup) groupToUse = selectedGroup;

			var siteToUse = '';
			if (selectedSite) siteToUse = selectedSite;
			
			var keyExpiry = '';
			if (device['subscription_key']) keyExpiry = moment(subscriptionKeys[device['subscription_key']]['end_date']).format('L');

			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: '', [clientsKey]:'', [firmwareKey]: '', [publicIPKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '', [subscriptionKey]: device['subscription_key'] ? device['subscription_key'] : '', [expiryKey]: keyExpiry });
		}
	});

	return csvDataBuild;
}

function emptyGroupDisplay() {
	var table = $('#inventory-table').DataTable();
	if (document.getElementById('emptyGroupCheckbox').checked) {
		table
			.column(10)
			.search('^$', false, true)
			.draw();
	} else {
		table.search('').draw();
	}
}

function showColumns() {
	var table = $('#inventory-table').DataTable();
	let column = table.column(7);
	column.visible(!column.visible());
	column = table.column(12);
	column.visible(!column.visible());
	column = table.column(13);
	column.visible(!column.visible());
	column = table.column(14);
	column.visible(!column.visible());
	column = table.column(18);
	column.visible(!column.visible());
}
