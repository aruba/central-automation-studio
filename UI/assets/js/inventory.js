/*
Central Automation v1.10
Updated: v1.11
Copyright Aaron Scott (WiFi Downunder) 2023
*/

var deviceList = [];
var deviceDisplay = []; // used to store devices in the unfiltered table (depending on the empty group toggle)

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Inventory Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	loadFullInventory();
	$('[data-toggle="tooltip"]').tooltip();
}

function loadFullInventory() {
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		loadTable();
	});
}

function loadTable() {
	// Empty the table
	$('#inventory-table')
		.DataTable()
		.rows()
		.remove();

	// build table data
	deviceList = getFullInventory();
	deviceDisplay = [];

	$.each(deviceList, function() {
		var monitoringInfo = findDeviceInMonitoring(this.serial);

		// Add row to table
		var table = $('#inventory-table').DataTable();
		if (monitoringInfo) {
			if (document.getElementById('emptyGroupCheckbox').checked) {
				if (monitoringInfo.group_name === '') {
					var status = '<i class="fa fa-circle text-danger"></i>';
					if (monitoringInfo.status == 'Up') {
						status = '<i class="fa fa-circle text-success"></i>';
					}

					deviceDisplay.push(this);
					table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', this.tier_type ? titleCase(this.tier_type) : '']);
				}
			} else {
				var status = '<i class="fa fa-circle text-danger"></i>';
				if (monitoringInfo.status == 'Up') {
					status = '<i class="fa fa-circle text-success"></i>';
				}

				deviceDisplay.push(this);
				table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, monitoringInfo.status ? monitoringInfo.status : '', monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', this.tier_type ? titleCase(this.tier_type) : '']);
			}
		} else {
			deviceDisplay.push(this);
			var status = '<i class="fa fa-circle text-muted"></i>';
			table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, status, 'Unknown', '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '']);
		}
	});

	$('#inventory-table')
		.DataTable()
		.rows()
		.draw();
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
	var licenseKey = 'LICENSE';

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

			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: monitoringInfo['status'] ? monitoringInfo['status'] : '', [uptimeKey]: duration.humanize(), [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: groupToUse, [siteKey]: siteToUse, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		} else {
			var groupToUse = '';
			if (selectedGroup) groupToUse = selectedGroup;

			var siteToUse = '';
			if (selectedSite) siteToUse = selectedSite;

			csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [statusKey]: '', [uptimeKey]: '', [ipKey]: '', [nameKey]: '', [groupKey]: groupToUse, [siteKey]: siteToUse, [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		}
	});

	return csvDataBuild;
}

function emptyGroupDisplay() {
	var table = $('#inventory-table').DataTable();
	if (document.getElementById('emptyGroupCheckbox').checked) {
		table
			.column(9)
			.search('^$', false, true)
			.draw();
	} else {
		table.search('').draw();
	}
}
