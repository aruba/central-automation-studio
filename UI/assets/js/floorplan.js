/*
Central Automation v1.32
Updated:
Aaron Scott (WiFi Downunder) 2021-2024
*/

var vrfBuildings = [];
var vrfBuildingId;
var floorCounter;

var visualRFNotification;
var floorNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Function Overrides functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function logError(message) {
	var errorBody = document.getElementById('apiResponse');
	var text = document.createTextNode('- ' + message);
	var span = document.createElement('span');
	span.style.color = '#FB404B';
	span.appendChild(text);
	errorBody.appendChild(span);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
	apiErrorCount++;
}

function logInformation(message) {
	var errorBody = document.getElementById('apiResponse');
	var text = document.createTextNode('• ' + message);
	errorBody.appendChild(text);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
}

function clearLog() {
	var errorBody = document.getElementById('apiResponse');
	while (errorBody.hasChildNodes()) {
		errorBody.removeChild(errorBody.firstChild);
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Floorplan functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function startChecking() {
	clearLog();
	getCampus(false);
}

function getCampus(repeat) {
	if (!repeat) visualRFNotification = showNotification('ca-new-construction', 'Getting Buildings...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/campus?offset=0&limit=100',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/campus)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		vrfBuildings = [];
		// Loop through the campus objects to get all the floors
		if (response['campus']) {
			$.each(response['campus'], function() {
				// Grab the building list for the individual campus
				getBuildings(0, this['campus_id']);
			});
		} else if (response['campus_count'] == 0) {
			if (visualRFNotification) {
				visualRFNotification.update({ message: 'No Campus Information was retrieved', type: 'warning' });
				setTimeout(visualRFNotification.close, 3000);
			}
		} else if (repeat){
			if (visualRFNotification) {
				visualRFNotification.update({ message: 'Unable to Retrieve Campus Information', type: 'danger' });
				setTimeout(visualRFNotification.close, 3000);
			}
		} else {
			getCampus(true);
		}
	});
}

function getBuildings(offset, campusId) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/campus/' + campusId + '?offset=' + offset + '&limit=' + apiVRFLimit,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/campus/<campus_id>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		vrfBuildings = vrfBuildings.concat(response['buildings']);

		offset += apiVRFLimit;
		if (offset < response['building_count']) getBuildings(offset);
		else {
			// maybe save to indexedDB...
			checkFloors();

			if (visualRFNotification) {
				visualRFNotification.update({ message: 'Retrieved Building Information', type: 'success' });
				setTimeout(visualRFNotification.close, 1000);
			}
		}
	});
}

function checkFloors() {
	floorNotification = showProgressNotification('ca-floors', 'Check Floors...', 'bottom', 'center', 'info');
	floorCounter = 0;
	for (var i=0;i<vrfBuildings.length;i++) {
		setTimeout(getFloors, apiDelay * i, vrfBuildings[i]['building_id'])
	}
}

function getFloors(vrfBuildingId) {

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/building/' + vrfBuildingId,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		floorCounter++;
		var floorProgress = (floorCounter / vrfBuildings.length) * 100;
		floorNotification.update({ progress: floorProgress });
		if (floorCounter >= vrfBuildings.length) {
			if (floorNotification) {
				floorNotification.update({ message: 'Retrieved Floor Information', type: 'success' });
				setTimeout(floorNotification.close, 1000);
			}
		}
		
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/building/<building_id>)');
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
						getFloors(vrfBuildingId);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			if (response.floor_count == 0) {
				logError('The ' + response['building']['building_name'] + ' building has no floors');
			} else {
				logInformation('The ' + response['building']['building_name'] + ' building has '+response.floor_count+' floors')
			}
		}
	});
}


