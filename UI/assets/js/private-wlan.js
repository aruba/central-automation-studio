/*
Central Automation v1.42
Updated: 1.42
Aaron Scott (WiFi Downunder) 2021-2025
*/

var defaultPSK = "essid %essid%\nopmode wpa3-sae-aes\nwpa-passphrase %passphrase%\nvlan TEST_USERS\nrf-band 5.0\ntype employee\ncaptive-portal disable\ndtim-period 1\nbroadcast-filter arp\ninactivity-timeout 1000\ng-min-tx-rate 12\na-min-tx-rate 12\nmax-authentication-failures 0\nblacklist\ndmo-channel-utilization-threshold 90\nmax-clients-threshold 128\nenable\ndot11r\nadvertise-ap-name\ndeny-intra-vlan-traffic\nauth-server InternalServer";
var defaultOpen = "essid %essid%\nopmode enhanced-open\nvlan TEST_USERS\nrf-band 5.0\ntype employee\ncaptive-portal disable\ndtim-period 1\nbroadcast-filter arp\ninactivity-timeout 1000\ng-min-tx-rate 12\na-min-tx-rate 12\nmax-authentication-failures 0\nblacklist\ndmo-channel-utilization-threshold 90\nmax-clients-threshold 128\nenable\nadvertise-ap-name\ndeny-intra-vlan-traffic\nauth-server InternalServer";

function checkDuplicateSSID() {
	var newSSID = document.getElementById('ssidField').value;
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;
	$.each(groupWLANs[wlanGroup], function() {
		console.log(this['essid'])
		if (this['essid'] === newSSID) {
			$('#ssidField').addClass('has-error');
			document.getElementById('createPSKBtn').disabled = true;
		} else {
			$('#ssidField').removeClass('has-error');
			document.getElementById('createPSKBtn').disabled = false;
		}
	});
}

function createPSK() {
	
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get WLAN details
	var newWLANName = document.getElementById('ssidField').value;
	var newPassphrase = document.getElementById('pskPassphrase').value;

    // Build SSID Config
	// If we are going to be adding the WLAN - then prep the config with the required formatting
	
	var newConfig = defaultPSK;
	if (newPassphrase === '') newConfig = defaultOpen;
	newConfig = newConfig.replace('%essid%', newWLANName);
	newConfig = newConfig.replace('%passphrase%', newPassphrase);
	var newConfigArray = [];
	var tempConfigArray = newConfig.split('\n');
	// Add indent to the config
	for (i = 0; i < tempConfigArray.length; i++) {
		newConfigArray.push('  ' + tempConfigArray[i]);
	}
	
	// Add matching user role
	var newRoleConfig = "wlan access-rule %essid%\n  utf8\n  rule any any match any any any permit";
	newRoleConfig = newRoleConfig.replace('%essid%', newWLANName);
	var tempConfigArray = newRoleConfig.split('\n');
	// Add indent to the config
	for (i = 0; i < tempConfigArray.length; i++) {
		newConfigArray.push('  ' + tempConfigArray[i]);
	}

	// get selected Group
	var select = document.getElementById('groupselector');
	var currentGroup = select.value;

	// grab the stored config
	showNotification('ca-folder-settings', 'Updating Group WLAN Configs...', 'bottom', 'center', 'info');
	var currentConfig = groupConfigs[currentGroup];

	// Find if there is an existing WLAN
	var startIndex = -1;
	var endIndex = -1;
	var firstWLANLocation = -1;

	var lineToFind = wlanPrefix + newWLANName;
	for (i = 0; i < currentConfig.length; i++) {
		if (currentConfig[i].includes(wlanPrefix) && firstWLANLocation == -1) {
			// grab the location of the first user role - in case the role we are looking for isnt in the config
			firstWLANLocation = i;
		}
		if (currentConfig[i] === lineToFind) {
			startIndex = i;
		} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
			endIndex = i;
		}
	}

	if (startIndex == -1) {
		// no matching ssid. Find the first ssid and place this ssid before it.
		startIndex = firstWLANLocation;
	} else {
		// remove the existing ssid from the config
		currentConfig.splice(startIndex, endIndex - startIndex);
	}

	// If the desired result is to add the new/updated ssid into the config for this group
	// build new SSID
	var newWLAN = [];
	newWLAN.push(wlanPrefix + newWLANName);
	newWLAN.push(...newConfigArray);

	// Splice the new role into the config
	if (currentConfig.length) {
		currentConfig.splice(startIndex, 0, ...newWLAN);
	} else {
		currentConfig = newWLAN;
	}
	
	console.log(

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
		updateCounter++;
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
			logError('WLAN change was not applied to group ' + currentGroup);
			errorCounter++;
		}
		if (updateCounter == 1) {
			if (errorCounter != 0) {
				showLog();
				Swal.fire({
					title: 'WLAN Deployment',
					text: 'The WLAN failed to be deployed to the selected Group',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'WLAN Deployment',
					text: 'WLAN was deployed to the selected Group',
					icon: 'success',
				});
				getWLANs();
			}
		}
	});
}