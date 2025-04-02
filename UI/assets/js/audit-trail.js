/*
Central Automation v1.44
Updated: 1.44.0
© Aaron Scott (WiFi Downunder) 2025
*/


var eventsNotification;
var detailNotification;
var currentEvent;
var trailEvents = [];
var exportEvents = [];
var eventDetails = {};

var downloadCounter = 0;
var downloadIDs = [];

function loadCurrentPageGroup() {
	$('#groupselector').prepend($('<option value="_all_" selected>All Groups</option>')); 
	$('#groupselector').selectpicker('refresh');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Event Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function refreshAuditTrailTable() {
	$('#audit-table')
	.DataTable()
	.rows()
	.remove();
	
	refreshAuditTrail(0);
}

function refreshAuditTrail(offset) {
	if (offset == 0) {
		eventsNotification = showProgressNotification('ca-timeline', 'Getting Audit Trail...', 'bottom', 'center', 'info');
		trailEvents = [];
		exportEvents = [];
	}
	
	var selectedGroup = document.getElementById('groupselector').value;
	var groupString = '';
	if (selectedGroup && selectedGroup !== '_all_') groupString = '&group_name='+selectedGroup
	
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;
	if (timescale < 180) timescale = 180;
	
	var now = new Date();
	// convert timescale from minutes to ms (*60*1000)
	var fromTime = Math.floor(now.getTime() - timescale * 60 * 1000);
	// convert back to seconds
	fromTime = Math.floor(fromTime /1000);
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/auditlogs/v1/events?limit='+apiAuditLimit+'&offset='+offset+'&start_time='+fromTime+groupString,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/auditlogs/v1/events)');
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
						refreshAuditTrail(offset);
					}
				});
			}
		} else {
			
			trailEvents = trailEvents.concat(response.events);
			offset += apiAuditLimit;
			if (response.total != 0) {
				var eventProgress = (offset / response.total) * 100;
				eventsNotification.update({ progress: eventProgress });
			} else {
				eventsNotification.update({ progress: 100 });
			}
			
			if (offset < response.total) {
				refreshAuditTrail(offset);
			} else {
				if (eventsNotification) {
					eventsNotification.update({ message: 'Obtained Audit Trail', type: 'success' });
					setTimeout(eventsNotification.close, 1000);
				}
				loadAuditTrailTable();
			}
		}
	});
}

function loadAuditTrailTable() {
	$('#audit-table')
	.DataTable()
	.rows()
	.remove();
	
	var table = $('#audit-table').DataTable();
	
	$.each(trailEvents, function() {
		//console.log(this)
		var eventEpoch = this['ts'];
		if (eventEpoch < 10000000000) eventEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
		eventEpoch = eventEpoch + new Date().getTimezoneOffset() * -1; //for timeZone
		var eventTime = new Date(eventEpoch);
		
		var target = this['target'];
		var currentDevice = findDeviceInMonitoring(this['target'])
		if (currentDevice) {
			
			var name = encodeURI(currentDevice['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralBaseURL = centralURLs[apiURL];
			if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
			var centralURL = '';
			
			if (deviceType == 'IAP') {
				centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + currentDevice['serial'] + '?casn=' + currentDevice['serial'] + '&cdcn=' + name + '&nc=access_point';
			} else if (deviceType == 'SWITCH') {
				centralURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + currentDevice['serial'] + '?cssn=' + currentDevice['serial'] + '&cdcn=' + name + '&nc=device';
			} else {
				centralURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + currentDevice['serial'] + '?csg=' + currentDevice['serial'] + '&cdcn=' + name + '&nc=gateway';
			}
			target = '<a href="' + centralURL + '" target="_blank"><strong>' + currentDevice['name'] + '</strong></a>';
		}
		
		var ipAddress = this['ip_addr']
		if (ipAddress == '0.0.0.0') ipAddress = '-';
		
		var tshootBtns = '';
		if (this['has_details']) {
			tshootBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Event Details" onclick="getEventDetails(\'' +  this['id'] + '\', true)"><i class="fa-solid fa-circle-info"></i></a> ';
		}
		
		table.row.add(['<span title="' + this['ts'] + '"</span>'+eventTime.toLocaleString(), ipAddress, this['user'], target, this['classification'], this['description'], tshootBtns]);
		
		// Save data for CSV export
		exportEvents.push({id:this['id'], day:eventTime.toDateString(), time:eventTime.toTimeString(), ip:ipAddress, user:this['user'], target:this['target'], category:this['classification'], description:this['description'], hasDetails:this['has_details']})
	});
	$('[data-toggle="tooltip"]').tooltip();
	
	$('#audit-table')
	.DataTable()
	.rows()
	.draw();
	$('#audit-table').DataTable().columns.adjust().draw();
}

function getEventDetails(eventID, needDisplay) {
	if (needDisplay && !eventDetails[eventID]) {
		downloadCounter = 0;
		downloadIDs = [eventID];
		detailNotification = showProgressNotification('ca-timeline', 'Getting audit trail details...', 'bottom', 'center', 'info');
	}
	if (!eventDetails[eventID]) {
		
		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/auditlogs/v1/event_details/'+eventID,
				access_token: localStorage.getItem('access_token'),
			}),
		};
		
		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/auditlogs/v1/events)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);
			eventDetails[eventID] = response.data;
			
			
			downloadCounter++;
			var detailProgress = (downloadCounter / downloadIDs.length) * 100;
			detailNotification.update({ progress: detailProgress });
			if (downloadCounter >= downloadIDs.length) {
				if (detailNotification) {
					detailNotification.update({ message: 'Finished obtaining event details', type: 'success' });
					setTimeout(detailNotification.close, 1000);
				}
				
				if (needDisplay) showEventDetails(eventID);
				else downloadCSV(true);
			}
		});
	} else if (needDisplay) {
		showEventDetails(eventID);
	} else {}
}

function showEventDetails(eventID) {
	eventDetail = eventDetails[eventID];
	document.getElementById('detailHeader').innerHTML = eventDetail.header
	document.getElementById('detailText').innerHTML = eventDetail.body.join('\n\n').trim();
	$('#DetailModalLink').trigger('click');
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDetailsCSV() {
	downloadCounter = 0;
	downloadIDs = [];
	
	// loop through displayed events - check for 'has_details'
	var table = $('#audit-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var event = exportEvents[this.toString()];
		// if 'has_details', check if already downloaded, else add to list to download.
		if (event.hasDetails && !eventDetails[event.id]) {
			downloadIDs.push(event.id)
		}
	});
	
	if (downloadIDs.length == 0) {
		// nothing required to be downloaded
		downloadCSV(true);
	} else {
		var i=0;
		detailNotification = showProgressNotification('ca-timeline', 'Getting audit trail details...', 'bottom', 'center', 'info');
		$.each(downloadIDs, function() {
			setTimeout(getEventDetails, apiDelay * i, this, false);
			i++;
		}) 
	}
	
}

function downloadCSV(details) {
	csvData = buildCSVData(details);
	if (csvData.length > 0) {
		var csv = Papa.unparse(csvData);
		var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	
		var csvURL = window.URL.createObjectURL(csvBlob);
	
		var csvLink = document.createElement('a');
		csvLink.href = csvURL;
	
		var table = $('#audit-table').DataTable();
		var filter = table.search();
		if (filter !== '') csvLink.setAttribute('download', 'audit-trail-' + filter.replace(/ /g, '_') + '.csv');
		else csvLink.setAttribute('download', 'audit-trail.csv');
	
		csvLink.click();
		window.URL.revokeObjectURL(csvLink);
	} else {
		showNotification('ca-file-csv', 'There are no audit trail events to download', 'bottom', 'center', 'warning');
	}
	
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData(details) {
	//CSV header
	var dateKey = 'DATE';
	var timeKey = 'TIME';
	var ipKey = 'IP ADDRESS';
	var usernameKey = 'USERNAME';
	var targetKey = 'TARGET';
	var serialKey = 'TARGET SERIAL';
	var categoryKey = 'CATEGORY';
	var descriptionKey = 'DESCRIPTION';
	var detailsHeaderKey = 'EVENT'
	var detailsKey = 'DETAILS'

	var csvDataBuild = [];

	var table = $('#audit-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var event = exportEvents[this.toString()];
		//console.log(event);

		var targetDevice = event['target'];
		var targetSerial = '';
		var currentDevice = findDeviceInMonitoring(event['target'])
		if (currentDevice) {
			targetDevice = currentDevice['name'];
			targetSerial = event['target'];
		}
		
		if (details) {
			detailHeader = '';
			detailBody = '';
			eventDetail = eventDetails[event.id];
			if (eventDetail) {
				detailHeader = eventDetail.header;
				detailBody = eventDetail.body.join('\n\n').trim();
			}
			csvDataBuild.push({
				[dateKey]: event['day'],
				[timeKey]: event['time'],
				[ipKey]: event['ip'],
				[usernameKey]: event['user'],
				[targetKey]: targetDevice,
				[serialKey]: targetSerial,
				[categoryKey]: event['category'],
				[descriptionKey]: event['description'],
				[detailsHeaderKey]: detailHeader,
				[detailsKey]: detailBody
			});
		} else {
			csvDataBuild.push({
				[dateKey]: event['day'],
				[timeKey]: event['time'],
				[ipKey]: event['ip'],
				[usernameKey]: event['user'],
				[targetKey]: targetDevice,
				[serialKey]: targetSerial,
				[categoryKey]: event['category'],
				[descriptionKey]: event['description'],
			});
		}
	});

	return csvDataBuild;
}