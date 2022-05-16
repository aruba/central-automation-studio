/*
Central Automation v1.10
Updated: 
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var deviceList = [];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Inventory Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageAP() {
	// override on visible page - used as a notification
	loadFullInventory();
}

function loadFullInventory() {
	inventoryPromise = new $.Deferred();
	$.when(tokenRefresh()).then(function() {
		$.when(updateInventory()).then(function() {
			// Empty the table
			$('#inventory-table')
				.DataTable()
				.rows()
				.remove();

			// build table data
			deviceList = getFullInventory();

			$.each(deviceList, function() {
				var monitoringInfo = findDeviceInMonitoring(this.serial);

				// Add row to table
				var table = $('#inventory-table').DataTable();
				if (monitoringInfo) {
					table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, monitoringInfo.ip_address ? monitoringInfo.ip_address : '', monitoringInfo.name ? monitoringInfo.name : '', monitoringInfo.group_name ? monitoringInfo.group_name : '', monitoringInfo.site ? monitoringInfo.site : '', this.tier_type ? titleCase(this.tier_type) : '']);
				} else {
					table.row.add(['<strong>' + this.serial + '</strong>', this.macaddr, this.device_type, this.aruba_part_no, this.model, '', '', '', '', this.tier_type ? titleCase(this.tier_type) : '']);
				}
			});

			$('#inventory-table')
				.DataTable()
				.rows()
				.draw();
		});
	});
}

function downloadDeviceInventory() {
	//CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var typeKey = 'DEVICE TYPE';
	var skuKey = 'PART NUMBER';
	var modelKey = 'MODEL';
	var ipKey = 'IP ADDRESS';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var licenseKey = 'LICENSE';

	csvData = [];

	var table = $('#inventory-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = deviceList[this];
		// Find monitoring data if there is any
		var monitoringInfo = findDeviceInMonitoring(device.serial);
		if (monitoringInfo) {
			csvData.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [ipKey]: monitoringInfo['ip_address'] ? monitoringInfo['ip_address'] : '', [nameKey]: monitoringInfo['name'] ? monitoringInfo['name'] : '', [groupKey]: monitoringInfo['group_name'] ? monitoringInfo['group_name'] : '', [siteKey]: monitoringInfo['site'] ? monitoringInfo['site'] : '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		} else {
			csvData.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [typeKey]: device['device_type'], [skuKey]: device['aruba_part_no'], [modelKey]: device['model'], [ipKey]: '', [nameKey]: '', [groupKey]: '', [siteKey]: '', [licenseKey]: device['tier_type'] ? titleCase(device['tier_type']) : '' });
		}
	});

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'inventory-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'inventory.csv');
	//csvLink.setAttribute('Inventory', 'inventory.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}
