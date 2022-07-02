/*
Central Automation v1.10.4
Updated: 
Aaron Scott (WiFi Downunder) 2022
*/

var configGroups = [];
var groupConfigs = {};
var wlans = [];

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var wlanPrefix = 'wlan ssid-profile ';

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Array Compare Function
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Warn if overriding existing method
if (Array.prototype.equals) console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function(array) {
	// if the other array is a falsy value, return
	if (!array) return false;

	// compare lengths - can save a lot of time
	if (this.length != array.length) return false;

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].equals(array[i])) return false;
		} else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, 'equals', { enumerable: false });

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN functions (1.10.4)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getConfigforGroup() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;

	showNotification('ca-folder-settings', 'Getting "' + wlanGroup + '" WLAN Config...', 'bottom', 'center', 'info');

	configGroups = getGroups();
	groupCounter = 0;
	groupConfigs = {};
	wlans = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + wlanGroup,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		// save the group config for modifications
		groupConfigs[wlanGroup] = response;

		showNotification('ca-folder-settings', 'Retrieved "' + wlanGroup + '" WLAN Config', 'bottom', 'center', 'success');

		if (groupConfigs[wlanGroup].hasOwnProperty('error_code')) {
			document.getElementById('wlanConfig').value = '';
		} else {
			document.getElementById('wlanConfig').value = groupConfigs[wlanGroup].join('\n');
		}
	});
}

function updateFullWLAN() {
	errorCounter = 0;
	clearErrorLog();

	var select = document.getElementById('groupselector');
	var currentGroup = select.value;

	var newConfig = document.getElementById('wlanConfig').value;
	var currentConfig = newConfig.split('\n');

	showNotification('ca-folder-settings', 'Updating Group WLAN Configs...', 'bottom', 'center', 'info');

	// need to push config back to Central.
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentGroup,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ clis: currentConfig }),
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.reason && response.reason == 'Bad Gateway') {
			Swal.fire({
				title: 'API Issue',
				text: 'There is an issue communicating with the API Gateway',
				icon: 'warning',
			});
		} else if (response.code && response.code == 429) {
			console.log('errorCode');
			logError('User role was not applied to group ' + currentGroup);
			Swal.fire({
				title: 'API Limit Reached',
				text: 'You have reached your daily API limit. No more API calls will succeed today.',
				icon: 'warning',
			});
		} else if (response.description) {
			logError(response.description);
			errorCounter++;
		} else if (response !== '' + currentGroup) {
			logError('WLAN change was not applied to group "' + currentGroup + '"');
			errorCounter++;
		}
		if (errorCounter != 0) {
			showLog();
			Swal.fire({
				title: 'WLAN Configuration',
				text: 'The WLAN configuration failed to be deployed for the selected Group',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'WLAN Configuration',
				text: 'WLAN was deployed to the "' + currentGroup + '" group',
				icon: 'success',
			});
		}
	});
}
