/*
Central Automation v1.10.4
Updated: 1.23
Aaron Scott (WiFi Downunder) 2021-2025
*/

var configGroups = [];
var groupConfigs = {};
var wlans = [];

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var wlanPrefix = 'wlan ssid-profile ';

var groupsLoaded = false;
var swarmsLoaded = false;

var configNotification;

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
	document.getElementById('wlanConfig').value = '';
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	var wlanGroupName = select.options[select.selectedIndex].text;
	var swarmSelected = false;
	var notificationString = wlanGroup;
	if (wlanGroupName !== wlanGroup) {
		// Swarm - not a group
		swarmSelected = true;
		notificationString = wlanGroupName.substring(wlanGroupName.indexOf(' > ') + 3);
	}

	configNotification = showNotification('ca-folder-settings', 'Getting "' + notificationString + '" WLAN Config...', 'bottom', 'center', 'info');

	//configGroups = getGroups();
	groupCounter = 0;
	groupConfigs = {};
	wlans = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		// save the group config for modifications
		groupConfigs[wlanGroup] = response;

		if (configNotification) {
			configNotification.update({ type: 'success', message: 'Retrieved "' + notificationString + '" WLAN Config' });
			setTimeout(configNotification.close, 2000);
		}

		if (groupConfigs[wlanGroup].hasOwnProperty('error_code')) {
			document.getElementById('wlanConfig').value = '';
		} else {
			document.getElementById('wlanConfig').value = groupConfigs[wlanGroup].join('\n');
		}
		checkForAWConfig();
		checkForAutoDRTConfig();
		checkForSSHConfig();
	});
	$('[data-toggle="tooltip"]').tooltip();
}

function updateFullWLAN() {
	errorCounter = 0;
	clearErrorLog();

	var select = document.getElementById('groupselector');
	var currentGroup = select.value;
	var wlanGroupName = select.options[select.selectedIndex].text;
	var swarmSelected = false;
	var notificationString = currentGroup;
	var configType = 'Group';
	if (wlanGroupName !== currentGroup) {
		// Swarm - not a group
		swarmSelected = true;
		notificationString = wlanGroupName.substring(wlanGroupName.indexOf(' > ') + 3);
		configType = 'VC';
	}

	var newConfig = document.getElementById('wlanConfig').value;
	var currentConfig = newConfig.split('\n');

	configNotification = showNotification('ca-folder-settings', 'Updating Group WLAN Configs...', 'bottom', 'center', 'info');

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
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<GROUP>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						updateFullWLAN();
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			if (response.reason && response.reason == 'Bad Gateway') {
				Swal.fire({
					title: 'API Issue',
					text: 'There is an issue communicating with the API Gateway',
					icon: 'warning',
				});
			} else if (response.code && response.code == 429) {
				console.log('errorCode');
				logError('WLAN config was not applied to ' + configType + ': ' + notificationString);
				Swal.fire({
					title: 'API Limit Reached',
					text: 'You have reached your daily API limit. No more API calls will succeed today.',
					icon: 'warning',
				});
			} else if (response.description) {
				logError(response.description);
				errorCounter++;
			} else if (response !== '' + currentGroup) {
				logError('WLAN change was not applied to ' + configType + ': "' + notificationString + '"');
				errorCounter++;
			}
			if (errorCounter != 0) {
				showLog();
				Swal.fire({
					title: 'WLAN Configuration',
					text: 'The WLAN configuration failed to be deployed for the selected ' + configType,
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'WLAN Configuration',
					text: 'WLAN was deployed to the "' + notificationString + '" ' + configType,
					icon: 'success',
				}).then(result => {
					if (result.isConfirmed) {
						// refresh the config from Central
						getConfigforGroup();
					}
				});
			}
			if (configNotification) {
				setTimeout(configNotification.close, 1000);
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Swarm Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageSwarm() {
	// Needs groups to be finished loading first
	if (groupsLoaded) {
		var swarmList = getSwarms();
		if (swarmList.length > 0) {
			// Add UI elements for separators and titles
			var select = document.getElementById('groupselector');
			addSelectSeparator(select);
			addSelectTitle(select, 'Virtual Controllers', true);
			addSelectTitle(select, 'Groups', false);

			swarmList.sort((a, b) => {
				const swarmAGroup = a.group_name.toUpperCase(); // ignore upper and lowercase
				const swarmAVC = a.name.toUpperCase(); // ignore upper and lowercase
				const swarmBGroup = b.group_name.toUpperCase(); // ignore upper and lowercase
				const swarmBVC = b.name.toUpperCase(); // ignore upper and lowercase
				// Sort on Group then on VC
				if (swarmAGroup < swarmBGroup) {
					return -1;
				}
				if (swarmAGroup > swarmBGroup) {
					return 1;
				}
				if (swarmAVC < swarmBVC) {
					return -1;
				}
				if (swarmAVC > swarmBVC) {
					return 1;
				}
				return 0;
			});
			$.each(swarmList, function() {
				loadSwarmUI(this);
			});
		}
		swarmsLoaded = true;
	}
}


/*
	Config Shortcuts Functions
*/
function checkForAWConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('ams-ip')) {
		document.getElementById('clearAWCheckbox').disabled = false;
		document.getElementById('clearAWCheckbox').checked = false;
	} else {
		document.getElementById('clearAWCheckbox').disabled = true;
		document.getElementById('clearAWCheckbox').checked = false;
	}
}

function clearAWConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('clearAWCheckbox').checked) {
		if (!newConfig.includes('clean-airwave-configuration')) newConfig += '\nclean-airwave-configuration';
	} else {
		if (newConfig.includes('clean-airwave-configuration')) newConfig = newConfig.replace('\nclean-airwave-configuration', '');
	}
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}

function checkForAutoDRTConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('auto-drt-upgrade-under-central-mgmt-disable')) {
		document.getElementById('clearAutoDRTCheckbox').checked = false;
	} else {
		document.getElementById('clearAutoDRTCheckbox').checked = false;
	}
}

function clearAutoDRTConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('clearAutoDRTCheckbox').checked) {
		if (!newConfig.includes('auto-drt-upgrade-under-central-mgmt-disable')) newConfig += '\nauto-drt-upgrade-under-central-mgmt-disable';
	} else {
		if (newConfig.includes('auto-drt-upgrade-under-central-mgmt-disable')) newConfig = newConfig.replace('\nauto-drt-upgrade-under-central-mgmt-disable', '');
	}
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}

function checkForSSHConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('ssh disable-ciphers aes-cbc')) {
		$('#sshselector').selectpicker('val', 'aes-cbc');
	} else if (newConfig.includes('ssh disable-ciphers aes-ctr')) {
		$('#sshselector').selectpicker('val', 'aes-ctr');
	} else {
		$('#sshselector').selectpicker('val', 'both');
	}
}

function changeSSHConfig() {
	var sshValue = document.getElementById('sshselector').value;
	
	var newConfig = document.getElementById('wlanConfig').value;
	var currentConfig = newConfig.split('\n');
	
	if (sshValue.includes('both') && newConfig.includes('disable-ciphers')) {
		// loop through config to find the line and remove it
		for (var i=0; i<currentConfig.length;i++) {
			if (currentConfig[i].includes('disable-ciphers')) {
				currentConfig.splice(i, 1);
				break;
			}
		}
	} else if (!sshValue.includes('both')) {
		if (newConfig.includes('disable-ciphers')) {
			// loop through config to find the line and replace it
			for (var i=0; i<currentConfig.length;i++) {
				if (currentConfig[i].includes('disable-ciphers')) {
					currentConfig[i] = 'ssh disable-ciphers '+sshValue;
					break;
				}
			}
		} else {
			currentConfig.push('ssh disable-ciphers '+sshValue);
		}
	}
	newConfig = currentConfig.join('\n')
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}

/*
	Group Functions
*/
function loadCurrentPageGroup() {
	// override on visible page - used as a notification
	groupsLoaded = true;
	if (!swarmsLoaded) loadCurrentPageSwarm(); // Once groups are loaded add the Swarms to the list
}

function loadCurrentPageCleanup() {
	groupsLoaded = false;
	swarmsLoaded = false;
}
