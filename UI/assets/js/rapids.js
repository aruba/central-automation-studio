/*
Central Automation v1.20
Updated: 1.36.7
Copyright Aaron Scott (WiFi Downunder) 2021-2025
*/

const RapidsType = { All: 0, Rogues: 1, SuspectedRogues: 2, Interfering: 3, Neighbours: 4, Contained: 5};

var totalAPs = [];
var rogues = [];
var interfering = [];
var suspect = [];
var neighbour = [];
var contained = [];
var widsEvents = [];
var widsCounts = {};

var roguePromise;
var interferingPromise;
var suspectPromise;
var neighbourPromise;
var containedPromise;
var widsPromise;

var failedAuth = false;

var rapidNotification;
var importNotification;

var displayAPs;

function loadCurrentPageAP() {
	// override on visible page - used as a notification
	getRapidsData();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getRapidsData() {
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			rapidNotification = showLongNotification('ca-rapids', 'Obtaining RAPIDS information...', 'bottom', 'center', 'info');
	
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
			
			widsEvents = [];
			widsCounts = {};
	
			$.when(getRogues(0), getInterfering(0), getSuspect(0), getNeighbours(0), getContained(0), getWIDSEvents(0)).then(function() {
				loadTable(RapidsType.All);
				if (rapidNotification) {
					rapidNotification.update({ message: 'RAPIDS information retrieved', type: 'success' });
					setTimeout(rapidNotification.close, 1000);
				}
			});
		}
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
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
			$(document.getElementById('interfering_icon')).addClass('text-purple');
			$(document.getElementById('interfering_icon')).removeClass('text-success');
			$(document.getElementById('interfering_icon')).removeClass('text-warning');
			$(document.getElementById('interfering_icon')).removeClass('text-danger');
			$(document.getElementById('interfering_icon')).removeClass('text-muted');

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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
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

function updateSiteGraph() {
	var labels = [];
	var siteData = {};
	$.each(displayAPs, function() {
	
		var lastSeenAP = findDeviceInMonitoring(this['last_det_device']);
		var site = '-';
		if (lastSeenAP) site = lastSeenAP['site'];
		if (!siteData[site]) {
			siteData[site] = {total:0, "Rogue":0, "Suspected Rogue":0, "Interfering":0, "Neighbour":0, "Contained":0}
		}
		
		var currentData = siteData[site];
		currentData[this.classification] = currentData[this.classification] +1;
		currentData['total'] = currentData['total'] +1;
		siteData[site] = currentData;
	});
	
	// Create Site array
	var items = Object.keys(siteData).map(function(key) {
		return [key, siteData[key]];
	});
	// Sort the array based on the total in the second element
	items.sort(function(first, second) {
		return second[1]['total'] - first[1]['total'];
	});
	
	// Create a new array with only the first "x" items
	var top10Sites = items.slice(0, 5);
	
	// Build labels and series
	var siteLabels = [];
	var siteSeries = [];
	
	// Need array or arrays
	var rogueData = [];
	var suspectData = [];
	var interferingData = [];
	var neighborData = [];
	var containedData = [];
	
	$.each(top10Sites, function() {
		siteLabels.push(this[0]);
		rogueData.push(this[1]['Rogue']);
		suspectData.push(this[1]['Suspected Rogue'])
		interferingData.push(this[1]['Interfering'])
		neighborData.push(this[1]['Neighbour'])
		containedData.push(this[1]['Contained']);
	});
	
	siteSeries[siteSeries.length] = containedData;	
	siteSeries[siteSeries.length] = rogueData;
	siteSeries[siteSeries.length] = suspectData;
	siteSeries[siteSeries.length] = interferingData;
	siteSeries[siteSeries.length] = neighborData;
	
	Chartist.Bar('#chartSites', {
	  labels: siteLabels,
	  series: siteSeries
	}, {
	  stackBars: true,
	  axisY: {
		  onlyInteger: true,
		  offset: 30,
	  }
	}).on('draw', function(data) {
	  if(data.type === 'bar') {
		data.element.attr({
		  style: 'stroke-width: 30px'
		});
	  }
	});
}

function loadTable(rapidsFilter) {
	$('#sitesLegend').empty();
	
	$('#rapids-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#rapids-table').DataTable();
	displayAPs = totalAPs;
	
	if (rapidsFilter == RapidsType.All) {
		displayAPs = totalAPs;
		$(document.getElementById('rapidsAll')).removeClass('no-focus');
		$(document.getElementById('rapidsRogue')).addClass('no-focus');
		$(document.getElementById('rapidsSuspect')).addClass('no-focus');
		$(document.getElementById('rapidsInterfering')).addClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).addClass('no-focus');
		$(document.getElementById('rapidsContained')).addClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-danger"></i> Rogues &nbsp;&nbsp;');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-warning"></i> Suspected Rogues &nbsp;&nbsp;');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-purple"></i> Interfering &nbsp;&nbsp;');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-success"></i> Neighbours &nbsp;&nbsp;');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-info"></i> Contained');
	} else if (rapidsFilter == RapidsType.Rogues) {
		displayAPs = rogues;
		$(document.getElementById('rapidsAll')).addClass('no-focus');
		$(document.getElementById('rapidsRogue')).removeClass('no-focus');
		$(document.getElementById('rapidsSuspect')).addClass('no-focus');
		$(document.getElementById('rapidsInterfering')).addClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).addClass('no-focus');
		$(document.getElementById('rapidsContained')).addClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-danger"></i> Rogues ');
	} else if (rapidsFilter == RapidsType.SuspectedRogues) {
		displayAPs = suspect;
		$(document.getElementById('rapidsAll')).addClass('no-focus');
		$(document.getElementById('rapidsRogue')).addClass('no-focus');
		$(document.getElementById('rapidsSuspect')).removeClass('no-focus');
		$(document.getElementById('rapidsInterfering')).addClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).addClass('no-focus');
		$(document.getElementById('rapidsContained')).addClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-warning"></i> Suspected Rogues ');
	} else if (rapidsFilter == RapidsType.Interfering) {
		displayAPs = interfering;
		$(document.getElementById('rapidsAll')).addClass('no-focus');
		$(document.getElementById('rapidsRogue')).addClass('no-focus');
		$(document.getElementById('rapidsSuspect')).addClass('no-focus');
		$(document.getElementById('rapidsInterfering')).removeClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).addClass('no-focus');
		$(document.getElementById('rapidsContained')).addClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-purple"></i> Interfering ');
	} else if (rapidsFilter == RapidsType.Neighbours) {
		displayAPs = neighbour;
		$(document.getElementById('rapidsAll')).addClass('no-focus');
		$(document.getElementById('rapidsRogue')).addClass('no-focus');
		$(document.getElementById('rapidsSuspect')).addClass('no-focus');
		$(document.getElementById('rapidsInterfering')).addClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).removeClass('no-focus');
		$(document.getElementById('rapidsContained')).addClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-success"></i> Neighbours ');
	} else if (rapidsFilter == RapidsType.Contained) {
		displayAPs = contained;
		$(document.getElementById('rapidsAll')).addClass('no-focus');
		$(document.getElementById('rapidsRogue')).addClass('no-focus');
		$(document.getElementById('rapidsSuspect')).addClass('no-focus');
		$(document.getElementById('rapidsInterfering')).addClass('no-focus');
		$(document.getElementById('rapidsNeighbour')).addClass('no-focus');
		$(document.getElementById('rapidsContained')).removeClass('no-focus');
		$('#sitesLegend').append('<i class="fa-solid fa-circle text-info"></i> Contained\t');
	}
	
	
	$.each(displayAPs, function() {
		// Add row to table

		var lastSeenAP = findDeviceInMonitoring(this['last_det_device']);
		var site = '-';
		if (lastSeenAP) site = lastSeenAP['site'];

		var name = encodeURI(this.last_det_device_name);
		var apiURL = localStorage.getItem('base_url');
		var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + this.last_det_device + '?casn=' + this.last_det_device + '&cdcn=' + name + '&nc=access_point';
		
		var customSearch = this.classification;
		if (customSearch === "Rogue") customSearch = "Rogues";
		
		var dotColour = '<i class="fa-solid fa-circle text-muted"></i>';
		if (this.classification === 'Rogue') dotColour = '<i class="fa-solid fa-circle text-danger"></i>';
		if (this.classification === 'Suspected Rogue') dotColour = '<i class="fa-solid fa-circle text-warning"></i>';
		if (this.classification === 'Interfering') dotColour = '<i class="fa-solid fa-circle text-purple"></i>';
		if (this.classification === 'Neighbour') dotColour = '<i class="fa-solid fa-circle text-success"></i>';
		if (this.classification === 'Contained') dotColour = '<i class="fa-solid fa-circle text-info"></i>';

		table.row.add(['<span data-toggle="tooltip" data-placement="top" data-html="true" title="' + this.mac_vendor + '"><strong>' + this.name + '</strong></span>', dotColour, this.classification, customSearch, this.ssid ? this.ssid : '', moment(this.last_seen).format('LLL'), '<span data-toggle="tooltip" data-placement="top" data-html="true" title="' + this.last_det_device + '"><a href="' + centralURL + '" target="_blank"><strong>' + this.last_det_device_name + '</strong></a></span>', site, this.signal ? this.signal : '', this.encryption, this.containment_status]);
	});

	$('#rapids-table')
		.DataTable()
		.rows()
		.draw();
		
	
	table.columns.adjust().draw();	
	
	updateSiteGraph();
}

/* ----------------------
	WIDS
------------------------*/
function getWIDSEvents(offset) {
	
	// generate the timestamp for 30days ago
	var fromDate = new Date();
	var lastWeek = fromDate.getDate() - 30;
	fromDate.setDate(lastWeek);
	var fromTimestamp = Math.round(fromDate.getTime() / 1000);
	
	if (offset == 0) widsPromise = new $.Deferred();
	// Get WIDS Events
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids/v1/wids/events?offset='+offset+'&limit='+apiLimit+'&sort=-ts&from_timestamp='+fromTimestamp,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids/v1/wids/events)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
	
		var response = JSON.parse(commandResults.responseBody);
		//console.log(response)
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getWIDSEvents(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			
			widsEvents.push(...response.wids_aps_info_list);
			// No total so if the response has the same number as the limit - try and get more
			if (apiLimit == response.count) getWIDSEvents(offset + apiLimit);
			else {
				// Load WIDS Table				
				$('#wids-table')
					.DataTable()
					.rows()
					.remove();
				
				var table = $('#wids-table').DataTable();
				$.each(widsEvents, function() {
					
					var attackType = titleCase(noUnderscore(this.attack_type));
					// Count up each type of attack for graphing
					//if (this.level === 'high') {
						if (!widsCounts[attackType]) widsCounts[attackType] = 1;
						else {
							widsCounts[attackType] = widsCounts[attackType]+1;
						}
					//}
					
					var dotColour = '<i class="fa-solid fa-circle text-muted"></i>';
					if (this.level === 'low') dotColour = '<i class="fa-solid fa-circle text-info"></i>';
					if (this.level === 'medium') dotColour = '<i class="fa-solid fa-circle text-warning"></i>';
					if (this.level === 'high') dotColour = '<i class="fa-solid fa-circle text-danger"></i>';
					
					table.row.add([moment(this.event_time*1000).format('LLL'), attackType, dotColour, titleCase(this.level), this.macaddr, this.radio_band+'GHz', this.description]);
				});
					
				$('#wids-table')
				.DataTable()
				.rows()
				.draw();	
					
				table.columns.adjust().draw();	
				widsPromise.resolve();
				
				updateWIDSGraph();
			}
			
			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	return widsPromise.promise();
}

function updateWIDSGraph() {
	$('#widsLegend').empty();
	
	// Create wids array
	var items = Object.keys(widsCounts).map(function(key) {
		return [key, widsCounts[key]];
	});
	// Sort the array based on the count
	items.sort(function(first, second) {
		return second[1] - first[1];
	});
	
	// Create a new array with only the first 5 attack types
	var top5 = items.slice(0, 5);
	
	// Build labels and series
	var widsSeries = [];
	$.each(top5, function() {
		var percentageThis = Math.round((this[1] / widsEvents.length) * 100);
		widsSeries.push(this[1]);
		if (widsSeries.length === 1) $('#widsLegend').append('<i class="fa-solid fa-circle text-info"></i> '+this[0]+' &nbsp;&nbsp;');
		else if (widsSeries.length === 2) $('#widsLegend').append('<i class="fa-solid fa-circle text-danger"></i> '+this[0]+' &nbsp;&nbsp;');
		else if (widsSeries.length === 3) $('#widsLegend').append('<i class="fa-solid fa-circle text-warning"></i> '+this[0]+' &nbsp;&nbsp;');
		else if (widsSeries.length === 4) $('#widsLegend').append('<i class="fa-solid fa-circle text-purple"></i> '+this[0]+' &nbsp;&nbsp;');
		else if (widsSeries.length === 5) $('#widsLegend').append('<i class="fa-solid fa-circle text-success"></i> '+this[0]+' &nbsp;&nbsp;');
	});
	
	Chartist.Pie(
		'#chartWIDS',
		{
			labels: widsSeries,
			series: widsSeries,
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
		//console.log(detectedAP);

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

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Import/Export Actions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function exportRules() {
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/rapids-config/v1/node_list/GLOBAL/GLOBAL/config/',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/rapids-config/v1/node_list/GLOBAL/GLOBAL/config/)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
	
		var response = JSON.parse(commandResults.responseBody);
		//console.log(response)
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getWIDSEvents(offset);
					}
				});
			}
		} else if (response) {
		//	console.log(response);
			var exportBlob = new Blob([JSON.stringify(response, null, 2)], { type: 'text/plain' });
			var exportURL = window.URL.createObjectURL(exportBlob);
			var exportLink = document.createElement('a');
			exportLink.href = exportURL;
			exportLink.setAttribute('download', 'RAPIDS_export.json');
			exportLink.click();
			window.URL.revokeObjectURL(exportLink);
		}
	});
}

function isValidJson(json) {
	try {
		JSON.parse(json);
		return true;
	} catch (e) {
		return false;
	}
}

function importRules() {
	
	var files = document.getElementById('files').files;
	if (files.length <= 0) {
		showNotification('ca-rapids', 'Please select a backup file', 'bottom', 'center', 'danger');
		return false;
	}

	Swal.fire({
		title: 'Are you sure?',
		text: 'Importing RAPIDS rules will overwrite the current rule with those in the selected file.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, import it!',
	}).then(result => {
		if (result.isConfirmed) {
			importConfirmed();
		}
	});
}
	
function importConfirmed() {
	importNotification = showLongNotification('ca-migration', 'Importing RAPIDS rules', 'bottom', 'center', 'info');
	var files = document.getElementById('files').files;
	
	var fr = new FileReader();
	fr.onload = function(e) { 
		if (isValidJson(e.target.result)) {
			var importData = e.target.result;
			//console.log(importData);
			
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/rapids-config/v1/node_list/GLOBAL/GLOBAL/config/',
					access_token: localStorage.getItem('access_token'),
					data: importData
				}),
			};
			
			$.ajax(settings).done(function(response, statusText, xhr) {
				//console.log("Run Now: "+ JSON.stringify(response))
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/rapids-config/v1/node_list/GLOBAL/GLOBAL/config/)');
						return;
					}
				}
				if (xhr.status == 200) {
					if (importNotification) {
						importNotification.update({ type: 'success', message: 'Classification Rules Imported' });
						setTimeout(importNotification.close, 2000);
					}
				} else {
					logError(response.status);
					if (importNotification) {
						importNotification.update({ type: 'danger', message: 'Unable to import classification rules' });
						setTimeout(importNotification.close, 3000);
					}
				}
			});
		}
	}
	fr.readAsText(files.item(0));
}

