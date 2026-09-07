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
	document.getElementById('wlanVSG').innerHTML = '';
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	if (wlanGroup == '') {
		showNotification('ca-folder-settings', 'Please select a Group to obtain config', 'bottom', 'center', 'warning');
		return;
	}
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
			document.getElementById('wlanVSG').value = '';
		} else {
			document.getElementById('wlanConfig').value = groupConfigs[wlanGroup].join('\n');
			document.getElementById('wlanVSG').value = groupConfigs[wlanGroup].join('\n');
		}
		checkForAWConfig();
		checkForAutoDRTConfig();
		checkForDisableManagementConfig();
		checkForSSHConfig();
		getValidation();
	});
	$('[data-toggle="tooltip"]').tooltip();
}

// Function for validation box
// TODO: Break out GlobalFeatures and SSID features into separate functions.
function getValidation() {
	var wlanConfig = document.getElementById('wlanConfig');
	var wlanVSG = document.getElementById('wlanVSG');
	var configText = wlanConfig.value;
	if (configText === '') {
		showNotification('ca-folder-settings', 'Please select a Group with AP config to begin validation', 'bottom', 'center', 'warning');
		return;
	}
	
	// Define global features
	const globalFeatures = [
		'data-encryption-enable',
		'application-monitoring',
		'voip_qos_trusted',
		'dpi',
		'deny-local-routing',
		'ipm',
		'ntp-server',
		'clock timezone',
		//'virtual-controller-country',
		'pmkcache-timeout'
	];
	
	const globalFeatures8 = [
		'application-monitoring',
		'voip_qos_trusted',
		'dpi',
		'deny-local-routing',
		'ipm',
		'ntp-server',
		'clock timezone',
		//'virtual-controller-country'
	]; 
	
	const globalFeatures10 = [
		'data-encryption-enable',
		'application-monitoring',
		'voip_qos_trusted',
		'dpi',
		'deny-local-routing',
		'ipm',
		'ntp-server',
		'clock timezone',
		//'virtual-controller-country',
		'pmkcache-timeout'
	];  
	
	// Define SSID-specific features
	const ssidFeatures = [
		'rf-band-6ghz',
		'broadcast-filter arp',
		'broadcast-filter-ipv6 unicast-router-advertisements',
		'g-min-tx-rate',
		'a-min-tx-rate',
		'multicast-rate-optimization',
		'dynamic-multicast-optimization',	
		'okc',
		'dot11k',
		'delete-pmkcache'
	];
	
	// check Group type 8 or 10?
	var wlanGroup = document.getElementById('groupselector').value;
	var groupInfo = getGroupForName(wlanGroup);
	var globalFeaturesSelected = globalFeatures;
	var groupVersion = 8;
	if (groupInfo.group_properties && groupInfo.group_properties.AOSVersion === "AOS_10X") {
		globalFeaturesSelected = globalFeatures10;
		groupVersion = 10;
	} else if (groupInfo.group_properties && groupInfo.group_properties.AOSVersion === "AOS_8X") globalFeaturesSelected = globalFeatures8;
	
	
	// Define feature-specific formatting rules. This is used to callout specific values, if needed.
	const featureConfig = {
		'virtual-controller-country': {
			pattern: /virtual-controller-country\s+(\w+)/,
			formatter: (line, match) => {
				return `<span style="color: #87CB16;">✔ <strong>${line}</strong> (Country Code Set)</span>`;
			}
		},
		'clock timezone': {
			pattern: /clock timezone none/,
			formatter: (line, match) => {
				return `<span style="color: #FB404B;">✘ ${line} (Timezone not set)</span>`;
			}
		},
		'pmkcache-timeout': {
			pattern: /no pmkcache-timeout/,
			formatter: (line, match) => {
				return `<span style="color: #FB404B;">✘ ${line}</span> <span style="color: #FFA534;">(PMK Cache Timeout is disabled)</span>`;
			}
		}
	};
	
	// Parse SSID profiles
	const lines = configText.split('\n');
	const ssids = {};
	let currentSSID = '';
	let currentConfig = [];
	
	lines.forEach(line => {
		if (line.match(/^wlan ssid-profile\s+(.+)$/)) {
			if (currentSSID) {
				ssids[currentSSID] = currentConfig;
			}
			currentSSID = line.match(/^wlan ssid-profile\s+(.+)$/)[1];
			currentConfig = [];
		} else if (currentSSID) {
			currentConfig.push(line);
		}
	});
	if (currentSSID) {
		ssids[currentSSID] = currentConfig;
	}
	
	// Analyze SSIDs and global features
	const formattedLines = [];
	
	// SSID analysis
	Object.keys(ssids).forEach(ssid => {
		if (formattedLines.length == 0) formattedLines.push(`<span style="color: #888888;">Analyzing SSID:</span><span style="color: #888888;font-weight:bold;"> ${ssid}</span>`);
		else formattedLines.push(`<br/><br/><span style="color: #888888;">Analyzing SSID:</span><span style="color: #888888;font-weight:bold;"> ${ssid}</span>`);
		formattedLines.push('<span style="color: #888888;">------------------------------------------------</span>');
		
		const configContent = ssids[ssid].join('\n');
		
		ssidFeatures.forEach(feature => {
			if (feature === 'rf-band-6ghz') {
				if ((configContent.match(/rf-band-6ghz/)) && ((configContent.match(/wpa3/)) || (configContent.match(/enhanced-open/)))) {
					const actualValue = configContent.match(/opmode\s+(.+)\s+/)[1];
					formattedLines.push(`<span style="color: #87CB16;">✔ rf-band-6ghz</span> <span style="color: #FFA534; font-style: italic;">(using ${actualValue})</span>`);
				} else if (configContent.match(/rf-band-6ghz\s+/)) {
					formattedLines.push(`<span style="color: #FFA534;"><strong>!</strong> rf-band-6ghz</span> <span style="color: #FFA534; font-style: italic;">(incorrect opmode for 6GHz support)</span>`);
				} else {
					formattedLines.push(`<span style="color: #FB404B;">✘ rf-band-6ghz</span>`);
				}
			} else if (feature === 'g-min-tx-rate') {
				if (configContent.match(/g-min-tx-rate\s+(\d+)/)) {
					const actualValue = configContent.match(/g-min-tx-rate\s+(\d+)/)[1];
					if (parseInt(actualValue) >= 12) {
						formattedLines.push(`<span style="color: #87CB16;">✔ g-min-tx-rate ${actualValue}</span>`);
					} else {
						formattedLines.push(`<span style="color: #FB404B;">✘ g-min-tx-rate ${actualValue}</span>`);
					}
				} else {
					formattedLines.push(`<span style="color: #FB404B;">✘ g-min-tx-rate</span> <span style="color: #FFA534; font-style: italic;">(using default data rates)</span>`);
				}
			} else if (feature === 'a-min-tx-rate') {
				if (configContent.match(/a-min-tx-rate\s+(\d+)/)) {
					const actualValue = configContent.match(/a-min-tx-rate\s+(\d+)/)[1];
					if (parseInt(actualValue) >= 12) {
						formattedLines.push(`<span style="color: #87CB16;">✔ a-min-tx-rate ${actualValue}</span>`);
					} else {
						formattedLines.push(`<span style="color: #FB404B;">✘ a-min-tx-rate ${actualValue}</span>`);
					}
				} else {
					formattedLines.push(`<span style="color: #FB404B;">✘ a-min-tx-rate</span> <span style="color: #FFA534; font-style: italic;">(using default data rates)</span>`);
				}
			} else if (feature === 'broadcast-filter arp') {
				if (configContent.match(/broadcast-filter\s+(arp|all)/)) {
					const actualValue = configContent.match(/broadcast-filter\s+(arp|all)/)[1];
					formattedLines.push(`<span style="color: #87CB16;">✔ broadcast-filter ${actualValue}</span>`);
				} else {
					formattedLines.push(`<span style="color: #FB404B;">✘ broadcast-filter</span> <span style="color: #FFA534; font-style: italic;">(broadcast filter is disabled)</span>`);
				}
			} else if (feature === 'delete-pmkcache') {
				if (configContent.match(/delete-pmkcache\s+/)) {
					formattedLines.push(`<span style="color: #FB404B;">✔ delete-pmkcache</span> <span style="color: #FFA534; font-style: italic;">(PMK Caching is disabled)</span>`);
				} else {
					formattedLines.push(`<span style="color: #87CB16;">✘ delete-pmkcache</span> <span style="color: #FFA534; font-style: italic;">(PMK Caching is enabled)</span>`);
				}
			} else if (feature === 'multicast-rate-optimization') {
				if (configContent.match(/multicast-rate-optimization\s+/)) {
					formattedLines.push(`<span style="color: #FB404B;">✔ multicast-rate-optimization</span>`);
				} else {
					formattedLines.push(`<span style="color: #87CB16;">✘ multicast-rate-optimization</span>`);
				}
			} else if (feature === 'dynamic-multicast-optimization') {
				if (configContent.match(/dynamic-multicast-optimization\s+/)) {
					formattedLines.push(`<span style="color: #FB404B;">✔ ${feature}</span>`);
					
					// Additionally check the dmo-channel-utilization-threshold
					if (configContent.match(/dmo-channel-utilization-threshold\s+(\d+)/)) {
						const actualValue = configContent.match(/dmo-channel-utilization-threshold\s+(\d+)/)[1];
						if (parseInt(actualValue) == 90) {
							formattedLines.push(`<span style="color: #FB404B;">   ✔ dmo-channel-utilization-threshold ${actualValue}</span>`);
						} else {
							formattedLines.push(`<span style="color: #87CB16;">   ✘ dmo-channel-utilization-threshold ${actualValue}</span>`);
						}
					} else {
						formattedLines.push(`<span style="color: #87CB16;">   ✘ dmo-channel-utilization-threshold</span> <span style="color: #FFA534; font-style: italic;">(using default threshold - 90%)</span>`);
					}
					
					// Additionally check the dmo-client threshold for 10.x
					if (groupVersion == 10) {
						if (configContent.match(/dmo-client-threshold\s+(\d+)/)) {
							const actualValue = configContent.match(/dmo-client-threshold\s+(\d+)/)[1];
							if (parseInt(actualValue) == 40) {
								formattedLines.push(`<span style="color: #FB404B;">   ✔ dmo-client-threshold ${actualValue}</span>`);
							} else {
								formattedLines.push(`<span style="color: #87CB16;">   ✘ dmo-client-threshold ${actualValue}</span>`);
							}
						} else {
							formattedLines.push(`<span style="color: #87CB16;">   ✘ dmo-client-threshold</span> <span style="color: #FFA534; font-style: italic;">(using default threshold - 6 Clients)</span>`);
						}
					}
				} else {
					formattedLines.push(`<span style="color: #87CB16;">✘ ${feature}</span>`);
				}
			} else if (configContent.includes(feature)) {
				formattedLines.push(`<span style="color: #87CB16;">✔ ${feature}</span>`);
			} else {
				formattedLines.push(`<span style="color: #FB404B;">✘ ${feature}</span>`);
			}
		});
	});
	
	// Global feature analysis
	formattedLines.push(`<br/><br/><span style="color: #888888;font-weight:bold;">Global Settings Validation</span>`);
	formattedLines.push('<span style="color: #888888;">------------------------------------------------</span>');

	globalFeaturesSelected.forEach(feature => {
		if (feature === 'pmkcache-timeout') {
			if (configText.includes(feature)) {
				const match = configText.match(featureConfig[feature].pattern);
				if (match) {
					formattedLines.push(featureConfig[feature].formatter(configText.match(feature)[0], match));
				} else {
					const actualValue = configText.match(/pmkcache-timeout\s+(\d+)/)[1];
					formattedLines.push(`<span style="color: #87CB16;">✔ pmkcache-timeout ${actualValue}</span>`);
				}
			} else {
				formattedLines.push(`<span style="color: #87CB16;">✔ pmkcache-timeout</span> <span style="color: #FFA534;">(Default Timeout value - 8hrs)</span>`);
			}
		} else if (configText.includes(feature)) {
			if (featureConfig[feature]) {
				const match = configText.match(featureConfig[feature].pattern);
				if (match) {
					formattedLines.push(featureConfig[feature].formatter(configText.match(feature)[0], match));
				} else {
					formattedLines.push(`<span style="color: #87CB16;">✔ ${feature}</span>`);
				}
			} else {
				formattedLines.push(`<span style="color: #87CB16;">✔ ${feature}</span>`);
			}
		} else {
			formattedLines.push(`<span style="color: #FB404B;">✘ ${feature}</span>`);
		}
	});
	
	// Join the lines and break them so they're formatted correctly.
	const formattedContent = formattedLines.join('<br>');
	wlanVSG.innerHTML = formattedContent || 'Validating. . .';
	// Ensure non-editable. I have had issues in some browsers not setting this inline in the HTML.
	wlanVSG.setAttribute('contenteditable', 'false');
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
			data: JSON.stringify({ clis: currentConfig }).split("%20").join("\\u002520"),
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
		document.getElementById('clearAutoDRTCheckbox').checked = true;
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

function checkForDisableManagementConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('disable-local-management-when-remotely-managed')) {
		document.getElementById('disableManagementCheckbox').checked = true;
	} else {
		document.getElementById('disableManagementCheckbox').checked = false;
	}
}

function clearDisableManagementConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('disableManagementCheckbox').checked) {
		if (!newConfig.includes('disable-local-management-when-remotely-managed')) newConfig += '\ndisable-local-management-when-remotely-managed';
	} else {
		if (newConfig.includes('disable-local-management-when-remotely-managed')) newConfig = newConfig.replace('\ndisable-local-management-when-remotely-managed', '');
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