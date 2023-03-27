/*
Central Automation v1.20
Updated: 
Copyright Aaron Scott (WiFi Downunder) 2023
*/

var totalAPs = [];
var rogues = [];
var interfering = [];
var suspect = [];
var neighbour = [];
var contained = [];

var roguePromise;
var interferingPromise;
var suspectPromise;
var neighbourPromise;
var containedPromise;

var failedAuth = false;

var rapidNotification;

function loadCurrentPageAP() {
	// override on visible page - used as a notification
	getRapidsData();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getRapidsData() {
	$.when(tokenRefresh()).then(function() {
		rapidNotification = showNotification('ca-rapids', 'Obtaining RAPIDS information...', 'bottom', 'center', 'info');

		totalAPs = [];
		document.getElementById('total_count').innerHTML = '0';
		$(document.getElementById('total_icon')).addClass('text-muted');
		$(document.getElementById('total_icon')).removeClass('text-success');
		$(document.getElementById('total_icon')).removeClass('text-warning');
		$(document.getElementById('total_icon')).removeClass('text-danger');

		rogues = [];
		document.getElementById('rogue_count').innerHTML = '0';
		$(document.getElementById('rogue_icon')).addClass('text-muted');
		$(document.getElementById('rogue_icon')).removeClass('text-success');
		$(document.getElementById('rogue_icon')).removeClass('text-warning');
		$(document.getElementById('rogue_icon')).removeClass('text-danger');

		interfering = [];
		document.getElementById('interfering_count').innerHTML = '0';
		$(document.getElementById('interfering_icon')).addClass('text-muted');
		$(document.getElementById('interfering_icon')).removeClass('text-success');
		$(document.getElementById('interfering_icon')).removeClass('text-warning');
		$(document.getElementById('interfering_icon')).removeClass('text-danger');

		suspect = [];
		document.getElementById('suspect_count').innerHTML = '0';
		$(document.getElementById('suspect_icon')).addClass('text-muted');
		$(document.getElementById('suspect_icon')).removeClass('text-success');
		$(document.getElementById('suspect_icon')).removeClass('text-warning');
		$(document.getElementById('suspect_icon')).removeClass('text-danger');

		neighbour = [];
		document.getElementById('neighbour_count').innerHTML = '0';
		$(document.getElementById('neighbour_icon')).addClass('text-muted');
		$(document.getElementById('neighbour_icon')).removeClass('text-success');
		$(document.getElementById('neighbour_icon')).removeClass('text-warning');
		$(document.getElementById('neighbour_icon')).removeClass('text-danger');

		contained = [];
		document.getElementById('contained_count').innerHTML = '0';
		$(document.getElementById('contained_icon')).addClass('text-muted');
		$(document.getElementById('contained_icon')).removeClass('text-success');
		$(document.getElementById('contained_icon')).removeClass('text-warning');
		$(document.getElementById('contained_icon')).removeClass('text-danger');
		$(document.getElementById('contained_icon')).removeClass('text-info');

		$.when(getRogues(0), getInterfering(0), getSuspect(0), getNeighbours(0), getContained(0)).then(function() {
			loadTable();
			rapidNotification.close();
		});
	});
}

function getRogues(offset) {
	if (offset == 0) roguePromise = new $.Deferred();
	// Get rogues
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/rogue_aps?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/rogue_aps)');
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
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getRogues(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			$.each(response.rogue_aps, function() {
				// Add row to table
				var detectedAP = this;
				detectedAP['classification'] = 'Rogue';
				totalAPs.push(detectedAP);
				rogues.push(detectedAP);
			});

			document.getElementById('rogue_count').innerHTML = response.total;
			$(document.getElementById('rogue_icon')).removeClass('text-muted');
			$(document.getElementById('rogue_icon')).removeClass('text-success');
			$(document.getElementById('rogue_icon')).removeClass('text-warning');
			$(document.getElementById('rogue_icon')).addClass('text-danger');

			if (offset + apiLimit < response.total) getRogues(offset + apiLimit);
			else {
				saveDataToDB('monitoring_rogues', JSON.stringify(rogues));
				updateTotal();
				roguePromise.resolve();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return roguePromise.promise();
}

function getSuspect(offset) {
	if (offset == 0) suspectPromise = new $.Deferred();
	// Get Suspected Rogues
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/suspect_aps?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/suspect_aps)');
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
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getSuspect(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			var table = $('#rapids-table').DataTable();
			$.each(response.suspect_aps, function() {
				var detectedAP = this;
				detectedAP['classification'] = 'Suspected Rogue';
				totalAPs.push(detectedAP);
				suspect.push(detectedAP);
			});

			document.getElementById('suspect_count').innerHTML = response.total;
			$(document.getElementById('suspect_icon')).removeClass('text-muted');
			$(document.getElementById('suspect_icon')).removeClass('text-success');
			$(document.getElementById('suspect_icon')).addClass('text-warning');
			$(document.getElementById('suspect_icon')).removeClass('text-danger');

			if (offset + apiLimit < response.total) getSuspect(offset + apiLimit);
			else {
				saveDataToDB('monitoring_suspect', JSON.stringify(suspect));
				updateTotal();
				suspectPromise.resolve();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return suspectPromise.promise();
}

function getInterfering(offset) {
	if (offset == 0) interferingPromise = new $.Deferred();
	// Get Interfering
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/interfering_aps?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/interfering_aps)');
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
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getInterfering(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			$.each(response.interfering_aps, function() {
				var detectedAP = this;
				detectedAP['classification'] = 'Interfering';
				totalAPs.push(detectedAP);
				interfering.push(detectedAP);
			});

			document.getElementById('interfering_count').innerHTML = response.total;
			$(document.getElementById('interfering_icon')).addClass('text-muted');
			$(document.getElementById('interfering_icon')).removeClass('text-success');
			$(document.getElementById('interfering_icon')).removeClass('text-warning');
			$(document.getElementById('interfering_icon')).removeClass('text-danger');

			if (offset + apiLimit < response.total) getInterfering(offset + apiLimit);
			else {
				saveDataToDB('monitoring_interfering', JSON.stringify(interfering));
				updateTotal();
				interferingPromise.resolve();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return interferingPromise.promise();
}

function getNeighbours(offset) {
	if (offset == 0) neighbourPromise = new $.Deferred();
	// Get Neighbours
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/neighbor_aps?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/neighbor_aps)');
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
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getNeighbours(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			$.each(response.neighbor_aps, function() {
				var detectedAP = this;
				detectedAP['classification'] = 'Neighbour';
				totalAPs.push(detectedAP);
				neighbour.push(detectedAP);
			});

			document.getElementById('neighbour_count').innerHTML = response.total;
			$(document.getElementById('neighbour_icon')).removeClass('text-muted');
			$(document.getElementById('neighbour_icon')).addClass('text-success');
			$(document.getElementById('neighbour_icon')).removeClass('text-warning');
			$(document.getElementById('neighbour_icon')).removeClass('text-danger');

			if (offset + apiLimit < response.total) getNeighbours(offset + apiLimit);
			else {
				saveDataToDB('monitoring_neighbour', JSON.stringify(neighbour));
				updateTotal();
				neighbourPromise.resolve();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return neighbourPromise.promise();
}

function getContained(offset) {
	if (offset == 0) containedPromise = new $.Deferred();
	// Get Conatined
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/manually_contained_aps?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/manually_contained_aps)');
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
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getContained(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			$.each(response.manually_contained_aps, function() {
				var detectedAP = this;
				detectedAP['classification'] = 'Contained';
				totalAPs.push(detectedAP);
				contained.push(detectedAP);
			});

			document.getElementById('contained_count').innerHTML = response.total;
			$(document.getElementById('contained_icon')).removeClass('text-muted');
			$(document.getElementById('contained_icon')).removeClass('text-success');
			$(document.getElementById('contained_icon')).removeClass('text-warning');
			$(document.getElementById('contained_icon')).removeClass('text-danger');
			$(document.getElementById('contained_icon')).addClass('text-info');

			if (offset + apiLimit < response.total) getContained(offset + apiLimit);
			else {
				saveDataToDB('monitoring_contained', JSON.stringify(contained));
				updateTotal();
				containedPromise.resolve();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return containedPromise.promise();
}

function updateTotal() {
	document.getElementById('total_count').innerHTML = totalAPs.length;
	$(document.getElementById('total_icon')).removeClass('text-muted');
	$(document.getElementById('total_icon')).removeClass('text-success');
	$(document.getElementById('total_icon')).removeClass('text-warning');
	$(document.getElementById('total_icon')).removeClass('text-danger');
	$(document.getElementById('total_icon')).removeClass('text-info');
	if (rogues.length > 0) $(document.getElementById('total_icon')).addClass('text-danger');
	else if (suspect.length > 0) $(document.getElementById('total_icon')).addClass('text-warning');
	else if (interfering.length > 0) $(document.getElementById('total_icon')).addClass('text-muted');
	else if (neighbour.length > 0) $(document.getElementById('total_icon')).addClass('text-success');
	else if (contained.length > 0) $(document.getElementById('total_icon')).addClass('text-info');
}

function loadTable() {
	$('#rapids-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#rapids-table').DataTable();
	$.each(totalAPs, function() {
		// Add row to table

		var lastSeenAP = findDeviceInMonitoring(this['last_det_device']);
		var site = '-';
		if (lastSeenAP) site = lastSeenAP['site'];

		var name = encodeURI(this.last_det_device_name);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + this.last_det_device + '?casn=' + this.last_det_device + '&cdcn=' + name + '&nc=access_point';

		table.row.add(['<span data-toggle="tooltip" data-placement="top" data-html="true" title="' + this.mac_vendor + '"><strong>' + this.name + '</strong></span>', this.classification, this.ssid ? this.ssid : '', moment(this.last_seen).format('LLL'), '<span data-toggle="tooltip" data-placement="top" data-html="true" title="' + this.last_det_device + '"><a href="' + centralURL + '" target="_blank"><strong>' + this.last_det_device_name + '</strong></a></span>', site, this.signal ? this.signal : '', this.encryption, this.containment_status]);
	});

	$('#rapids-table')
		.DataTable()
		.rows()
		.draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDetectedAPs() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#rapids-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'rapids-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'rapids.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	//CSV header
	var nameKey = 'NAME';
	var classificationKey = 'CLASSIFICATION';
	var ssidKey = 'SSID';
	var lastSeenKey = 'LAST SEEN';
	var lastSeenByKey = 'LAST SEEN BY (NAME)';
	var lastSeenBySerialKey = 'LAST SEEN BY (SERIAL)';
	var firstSeenKey = 'FIRST SEEN';
	var firstSeenByKey = 'FIRST SEEN BY (NAME)';
	var firstSeenBySerialKey = 'FIRST SEEN BY (SERIAL)';
	var siteKey = 'SITE';
	var groupKey = 'GROUP';
	var signalKey = 'SIGNAL';
	var encryptionKey = 'ENCRYPTION';
	var statusKey = 'CONTAINMENT STATUS';
	var macKey = 'MAC VENDOR';
	var switchKey = 'SWITCH (NAME)';
	var switchSerialKey = 'SWITCH (SERIAL)';
	var switchPortKey = 'SWITCH PORT';

	var csvDataBuild = [];

	var table = $('#rapids-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var detectedAP = totalAPs[this.toString()];
		console.log(detectedAP);

		var lastSeenAP = findDeviceInMonitoring(detectedAP['last_det_device']);
		var site = '-';
		if (lastSeenAP) site = lastSeenAP['site'];

		var switchName = '';
		var switchSerial = '';
		var switchPort = '';
		if (detectedAP['port']) {
			switchName = detectedAP['port']['sname'];
			switchSerial = detectedAP['port']['sid'];
			switchPort = detectedAP['port']['sname'];
		}

		csvDataBuild.push({
			[nameKey]: detectedAP['name'],
			[classificationKey]: detectedAP['classification'],
			[ssidKey]: detectedAP['ssid'] ? detectedAP['ssid'] : '',
			[lastSeenKey]: moment(detectedAP['last_seen']).format('LLL'),
			[lastSeenByKey]: detectedAP['first_det_device_name'],
			[lastSeenBySerialKey]: detectedAP['last_det_device'],
			[firstSeenKey]: moment(detectedAP['first_seen']).format('LLL'),
			[firstSeenByKey]: detectedAP['first_det_device_name'],
			[firstSeenBySerialKey]: detectedAP['first_det_device'],
			[siteKey]: site,
			[groupKey]: detectedAP['group_name'],
			[signalKey]: detectedAP['signal'] ? detectedAP['signal'] : '',
			[encryptionKey]: detectedAP['encryption'] ? detectedAP['encryption'] : '',
			[statusKey]: detectedAP['containment_status'],
			[macKey]: detectedAP['mac_vendor'],
			[switchKey]: switchName,
			[switchSerialKey]: switchSerial,
			[switchPortKey]: switchPort,
		});
	});

	return csvDataBuild;
}
