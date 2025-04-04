/*
Central Automation v1.5
Updated: 1.41.10
Aaron Scott (WiFi Downunder) 2021-2025
*/

var configGroups = [];
var groupConfigs = {};
var groupWLANs = {};
var wlans = [];
var allWLANS = [];
var userRoles = [];

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var pskCounter = 0;
var wlanPrefix = 'wlan ssid-profile ';
var userRolePrefix = 'wlan access-rule ';

var selectedDevices = {};
var selectedWLAN;
var deviceInfo = {};

var groupConfigNotification;
var tunneledGroupList = [];

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
		PSK functions (1.26)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getWLANsforGroup() {
	if (document.getElementById('pskPassphrase')) document.getElementById('pskPassphrase').value = '';
	var wlans = document.getElementById('wlanselector');
	if (wlans) wlans.options.length = 0;

	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;

	var selectedGroupWLANs = groupWLANs[wlanGroup];
	if (!selectedGroupWLANs || selectedGroupWLANs.length == 0) showNotification('ca-wifi-protected', 'No WLANs are configured for selected group', 'bottom', 'center', 'warning');
	$.each(selectedGroupWLANs, function() {
		$('#wlanselector').append($('<option>', { value: this['name'], text: this['essid'] }));
	});
	$('#wlanselector').selectpicker('refresh');

	
	$('[data-toggle="tooltip"]').tooltip();
}

function getConfigforWLAN() {
	showNotification('ca-wifi-protected', 'Obtaining WLAN configuration', 'bottom', 'center', 'info');
	document.getElementById('pskPassphrase').value = '';
	var groupselect = document.getElementById('groupselector');
	var wlanGroup = groupselect.value;
	var wlanselect = document.getElementById('wlanselector');
	var wlan = wlanselect.value;
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/wlan/' + wlanGroup + '/' + wlan,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/wlan/<GROUP>/<WLAN>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.wlan.wpa_passphrase === '') {
			showNotification('ca-wifi-protected', 'The selected WLAN is not a PSK-based network', 'bottom', 'center', 'danger');
			document.getElementById('qrBtn').disabled = true;
		} else {
			//console.log(response.wlan);
			document.getElementById('pskPassphrase').value = response.wlan.wpa_passphrase;
			existingPassphrase = response.wlan.wpa_passphrase;
			document.getElementById('savePSKBtn').disabled = true;
			wlanConfig = response;
			document.getElementById('qrBtn').disabled = false;
		}
	});
}

function updatePSK() {
	var groupselect = document.getElementById('groupselector');
	var wlanGroup = groupselect.value;
	var wlanselect = document.getElementById('wlanselector');
	var wlan = wlanselect.value;
	// update the passphrase value
	wlanConfig['wlan']['wpa_passphrase'] = document.getElementById('pskPassphrase').value;
	wlanConfig['wlan']['wpa_passphrase_changed'] = true;

	showNotification('ca-wifi-protected', 'Updating PSK for ' + wlan, 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/wlan/' + wlanGroup + '/' + wlan,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify(wlanConfig),
		}),
	};

	$.ajax(settings)
		.done(function(response) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/wlan/<GROUP>)');
					return;
				}
			}
			if (response === wlan) {
				Swal.fire({
					title: 'Passphrase Updated',
					text: 'Passphrase was updated for the "' + wlan + '" WLAN',
					icon: 'success',
				});
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			console.log(textStatus);
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		PSK UI functions (1.2)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function passphraseChange() {
	if (document.getElementById('pskPassphrase').value === existingPassphrase) {
		document.getElementById('savePSKBtn').disabled = false;
	} else {
		document.getElementById('savePSKBtn').disabled = false;
	}
}

function showPassphrase() {
	var x = document.getElementById('pskPassphrase');
	if (document.getElementById('revealPassphrase').checked) {
		x.type = 'text';
	} else {
		x.type = 'password';
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	QR Code functions (1.12)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function generateQRCode() {
	// Get needed values
	var wlanselect = document.getElementById('wlanselector');
	var wlan = wlanselect.value;
	var psk = document.getElementById('pskPassphrase').value;
	var hidden = wlanConfig.wlan.hide_ssid;

	var enc = 'WPA';
	// Label the modal
	document.getElementById('wlanQRTitle').innerHTML = 'WLAN QR Code for ' + wlan;

	// Are we using a custom colour?
	var qrColor = localStorage.getItem('qr_color');
	if (qrColor == null || qrColor == 'undefined') {
		// use the default colour - Aruba Orange
		qrColor = '#FF8300';
	}

	// Custom Logo?
	var qrLogo = localStorage.getItem('qr_logo');
	if (qrLogo == null || qrLogo == 'undefined' || qrLogo === '') {
		qrLogo = 'assets/img/api.svg';
	}

	// Generate the QR Code and display
	$('#qrcanvas').empty();
	const qrCode = new QRCodeStyling({
		width: 400,
		height: 400,
		type: 'svg',
		data: 'WIFI:S:' + wlan + ';T:' + enc + ';P:' + psk + ';H:' + hidden + ';;',
		image: qrLogo,
		dotsOptions: {
			color: qrColor,
			type: 'rounded',
		},
		cornersDotOptions: {
			color: qrColor,
			type: 'dot',
		},
		backgroundOptions: {
			color: '#ffffff',
		},
		imageOptions: {
			crossOrigin: 'anonymous',
			margin: 10,
		},
	});

	qrCode.append(document.getElementById('qrcanvas'));
	qrCode.download({ name: wlan + '-qr', extension: 'png' });
	$('#QRModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN functions (1.26)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// UPDATED 1.26 - Added delay to prevent hitting API calls/sec limit
function getWLANs() {
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			// Clearing old data
			$('#wlan-table')
				.DataTable()
				.clear();
			configGroups = getGroups();
			groupCounter = 0;
			groupConfigs = {};
			groupWLANs = {};
			wlans = [];
			groupConfigNotification = showProgressNotification('ca-folder-settings', 'Getting Group Configs...', 'bottom', 'center', 'info');
	
			// Grab config for each Group in Central - need to add in API call delay to not hit api/sec limit
			for(var i=0;i<configGroups.length;i++) {
				setTimeout(getWLANConfigForGroup, apiDelay*i, configGroups[i].group);
			}
		}
	});
}

// UPDATED 1.26 - Added obtaining the RequestUrl back from the original call to get the Group name
function getWLANConfigForGroup(group) {
	var currentGroup = group;
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentGroup,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		// Get the original request URL
		var requestedUrl = '';
		if (commandResults.hasOwnProperty('requestedUrl')) requestedUrl = commandResults.requestedUrl;

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
		
		if (Array.isArray(response)) {
			// Get the correct group back from the original Group
			var requestedGroup = requestedUrl.match(/[^\/]+$/)[0];
			
			// save the group config for modifications
			groupConfigs[requestedGroup] = response;
			
			// pull the SSIDs out of each group config
			getWLANsFromConfig(response, requestedGroup);
		
			// pull the roles out of each group config
			getUserRolesFromConfig(response, requestedGroup);
		}

		

		groupCounter++;
		groupConfigNotification.update({ progress: groupCounter/configGroups.length*100 });
		reloadWLANTable();
	});
}

function reloadWLANTable() {
	if (groupCounter >= configGroups.length) {
		$('#wlan-table')
		.DataTable()
		.clear();
		// Build table of ssids
		var table = $('#wlan-table').DataTable();
		for (i = 0; i < wlans.length; i++) {
			// Pull additional info out
			var keyMgmt = '';
			var fastRoaming = [];
			var mbr;
			var mbr2 = '1';
			var mbr5 = '6';
			var apZone = '';
			var rfBand = 'All';
			var rfBand6 = false;
			$.each(wlans[i]['config'], function() {
				if (this.includes('opmode ')) keyMgmt = this.replace('opmode ', '');
				if (this.includes('g-min-tx-rate ')) mbr2 = this.replace('g-min-tx-rate ', '');
				if (this.includes('a-min-tx-rate ')) mbr5 = this.replace('a-min-tx-rate ', '');
				if (this.includes('dot11k')) fastRoaming.push('11k');
				if (this.includes('dot11v')) fastRoaming.push('11v');
				if (this.includes('dot11r')) fastRoaming.push('11r');
				if (this.includes('zone')) apZone = this.replace('zone ', '');
				if (this.includes('rf-band ')) rfBand = this.replace('rf-band ', '');
				if (this.includes('rf-band-6ghz')) rfBand6 = true;
			});
			fastRoaming.sort();
			mbr = '2.4GHz: ' + mbr2 + 'Mbps / 5GHz: ' + mbr5 + 'Mbps';
			
			if (rfBand === '2.4') rfBand = '2.4GHz';
			else if (rfBand === '5.0') rfBand = '5GHz';
			else if (rfBand === 'none' && rfBand6) rfBand = '6GHz';
			
			if (rfBand === 'All') rfBand = '2.4GHz/5GHz';	
			if (rfBand === '2.4GHz/5GHz' && rfBand6) rfBand = 'All';	
			if ((rfBand === '2.4GHz' || rfBand === '5GHz') && rfBand6) rfBand += '/6GHz';
	
			// Action Buttons
			var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Edit WLAN" onclick="loadWLANUI(\'' + i + '\')"><i class="fa-solid fa-pencil"></i></a> ';
			if (wlans[i]['config'].indexOf('disable') != -1) {
				actionBtns += '<a class="btn btn-link btn-neutral" data-toggle="tooltip" data-placement="top" title="Enable WLAN" onclick="enableWLAN(\'' + i + '\',true)"><i class="fa-solid fa-wifi"></i></a>';
			} else {
				actionBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Disable WLAN" onclick="enableWLAN(\'' + i + '\',false)"><i class="fa-solid fa-wifi"></i></a>';
			}
	
			// Add row to table
			table.row.add([i, '<strong>' + wlans[i]['name'] + '</strong>', wlans[i]['groups'].join(', '), rfBand, keyMgmt, mbr, fastRoaming.join('/'), apZone, actionBtns]);
		}
		$('#wlan-table')
			.DataTable()
			.rows()
			.draw();
	
		if (groupConfigNotification) {
			groupConfigNotification.update({ message: 'Retrieved Group Configs...', type: 'success' });
			setTimeout(groupConfigNotification.close, 1000);
		}
		
		// Rebuild Group dropdown to only contain groups with config
		select = document.getElementById('groupselector');
		select.options.length = 0;
		
		// Sort the groups alphabetically
		var wlanGroupList = Object.keys(groupConfigs);
		wlanGroupList.sort((a, b) => {
			const groupA = a.toUpperCase(); // ignore upper and lowercase
			const groupB = b.toUpperCase(); // ignore upper and lowercase
			// Sort on Group name
			if (groupA < groupB) {
				return -1;
			}
			if (groupA > groupB) {
				return 1;
			}
			return 0;
		});
		
		// Add and select the groups needed
		$.each(wlanGroupList, function() {
			$('#groupselector').append($('<option>', { value: this, text: this }));
			if ($('.selectpicker').length != 0) {
				$('.selectpicker').selectpicker('refresh');
			}
		});
		
		$('[data-toggle="tooltip"]').tooltip();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getConfigforGroup() {
	var select = document.getElementById('groupselector');
	var wlanGroup = select.value;

	if (groupConfigs[wlanGroup].hasOwnProperty('error_code')) {
		document.getElementById('wlanConfig').value = '';
	} else {
		document.getElementById('wlanConfig').value = groupConfigs[wlanGroup].join('\n');
	}
}

function getPSKForWLAN(wlanGroup, wlan) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/wlan/' + wlanGroup + '/' + wlan,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/wlan/<GROUP>/<WLAN>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				// Try again - too many concurrent calls
				console.log('API Limit Exceeded - Trying again for ' + wlan + ' in ' + wlanGroup);
				setTimeout(getPSKForWLAN, apiDelay, wlanGroup, wlan);
				return;
			}
		}
		if (response.wlan && response.wlan.wpa_passphrase) {
			var passphrase = response.wlan.wpa_passphrase;
			
			$.each(groupWLANs[wlanGroup], function() {
				// find the WLAN and update the line with the actual PSK
				if (this.name === wlan) {
					// found the matching wlan
					var config = this.config;
					for (i = 0; i < config.length; i++) {
						if (config[i].includes('wpa-passphrase')) {
							this.config[i] = 'wpa-passphrase ' + passphrase;
							pskCounter--;
							if (pskCounter <= 0) processForDuplicateWLANs();
						}
					}
				}
			});
		}
	});
}

// UPDATED 1.26 - Added the building of the SSID list per Group
function getWLANsFromConfig(config, group) {
	// Find the existing SSID
	var startIndex = -1;
	var endIndex = -1;
	var wlanName = '';
	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the WLAN SSID
			if (currentLine.includes(wlanPrefix) && startIndex == -1) {
				// pull out the wlan name.
				wlanName = currentLine.replace(wlanPrefix, '');
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current ssid
				endIndex = i;
			}
			
			// Remove Quotes
			wlanName = wlanName.replaceAll('"', '');
			
			if (endIndex != -1 && startIndex != -1) {
				// Found the start and end of a WLAN
				// Build the WLAN from the config.
				// No need to keep the first line - since we already have the wlanName, the first line can be rebuilt.
				var fullWLAN = config.slice(startIndex + 1, endIndex);
				var essidName = 'abc';
				var finalWLAN = [];
				pskCounter = 0;
				// Remove the "index #" line and "utf8"
				$.each(fullWLAN, function() {
					if (this.includes('essid')) essidName = this.match(/^.*essid\s(.*$)/)[1];
					if (!this.includes('utf8') && !this.includes('index ')) finalWLAN.push(this.trim());
					if (this.trim().includes('-psk-') || this.trim().includes('wpa3-sae')) {
						pskCounter++;
						getPSKForWLAN(group, wlanName);
					}
				});

				// Build WLANs list for the group
				var groupWLANList = groupWLANs[group];
				if (!groupWLANList) groupWLANList = [];
				groupWLANList.push({ name: wlanName, essid: essidName, config: finalWLAN });
				groupWLANs[group] = groupWLANList;
				
				// Is the current line another WLAN?
				if (currentLine.includes(wlanPrefix)) {
					wlanName = currentLine.replace(wlanPrefix, '');
					startIndex = i;
					endIndex = -1;
				} else {
					// Not another WLAN - rest of the config shouldn't contain any WLANs so break out of loop
					if (pskCounter <= 0) processForDuplicateWLANs();
					break;
				}
			}
		}
	}
}

function processForDuplicateWLANs() {
	wlans = [];
	var groupKeys = Object.keys(groupWLANs);
	$.each(groupKeys, function() {
		var groupName = this;
		$.each(groupWLANs[groupName], function() {
			var wlanName = this.name;
			var wlanConfig = this.config
			// Check if we have already found the exact same ssid in another group
			var existingWLANMatch = false;
			$.each(wlans, function() {
				if (this['name'] === wlanName) {
					// SSID with this name exists - now check if the rules are the same.
					if (JSON.stringify(this['config']) === JSON.stringify(wlanConfig)) {
					//if (this['config'].equals(finalWLAN)) {
						// exactly the same ACLs for the same ssid name. add group name to record.
						var groupList = this['groups'];
						groupList.push(groupName);
						this['groups'] = groupList;
						existingWLANMatch = true;
						return false;
					}
				}
			});
			
			
			// No existing exact match. Need to add record.
			if (!existingWLANMatch) {
				var groupList = [];
				groupList.push(groupName);
				// Currently do not support WLANs with spaces in the name
				//if (!wlanName.includes(' ')) {
					wlans.push({ name: wlanName, config: wlanConfig, groups: groupList });
				//}
			}
		});
	})
	reloadWLANTable();
}

function getUserRolesFromConfig(config, group) {
	// Find the existing user role
	var startIndex = -1;
	var endIndex = -1;
	var roleName = '';

	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the user role
			if (currentLine.includes(userRolePrefix) && startIndex == -1) {
				// pull out the role name.
				roleName = currentLine.replace(userRolePrefix, '');
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current role
				endIndex = i;
			}

			if (endIndex != -1 && startIndex != -1) {
				// Found the start and end of a user role
				// Build the ACLs from the config.
				// No need to keep the first line - since we already have the roleName, the first line can be rebuilt.
				var fullACLs = config.slice(startIndex + 1, endIndex);

				var finalACLs = [];
				// Remove the "index #" line and "utf8"
				$.each(fullACLs, function() {
					if (!this.includes('utf8') && !this.includes('index ')) finalACLs.push(this.trim());
				});

				// Check if we have already found the exact same role in another group
				var existingRoleMatch = false;
				$.each(userRoles, function() {
					if (this['name'] === roleName) {
						// Role with this name exists - now check if the rules are the same.
						if (this['acls'].equals(finalACLs)) {
							// exactly the same ACLs for the same role name. add group name to record.
							var groupList = this['groups'];
							groupList.push(group);
							this['groups'] = groupList;
							existingRoleMatch = true;
							return false;
						}
					}
				});

				// No existing exact match. Need to add record.
				if (!existingRoleMatch) {
					var groupList = [];
					groupList.push(group);
					userRoles.push({ name: roleName, acls: finalACLs, groups: groupList });
				}

				// Is the current line another User Role?
				if (currentLine.includes(userRolePrefix)) {
					roleName = currentLine.replace(userRolePrefix, '');
					startIndex = i;
					endIndex = -1;
				} else {
					// Not another user role - rest of the config shouldn't contain any user roles so break out of loop
					break;
				}
			}
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageGroup() {
	select = document.getElementById('wlanselector');
	if (select) select.options.length = 0;
	
	table = document.getElementById('device-table');
	if (table) {
		$('#device-table')
		.DataTable()
		.rows()
		.remove();
		$('#device-table')
		.DataTable()
		.rows()
		.draw();
	}
	getWLANs();
}

function loadWLANUI(wlanIndex) {
	tunneledGroupList = [];
	
	selectedWLAN = wlans[wlanIndex];
	document.getElementById('wlanName').value = selectedWLAN.name;
	document.getElementById('wlanConfig').value = selectedWLAN.config.join('\n');

	// Rebuild Group dropdown to only contain groups with config
	buildGroupList();
	
	checkSelectionCount();
	
	// Check for specific configs and set checkboxes
	checkForTxBFConfig();
	checkForMUMIMOConfig();
	checkForOFDMAConfig();
	
	$('#WLANModalLink').trigger('click');
}

function buildGroupList() {
	// Rebuild Group dropdown to only contain groups with config
	select = document.getElementById('modalGroupSelector');
	select.options.length = 0;
	
	// Sort the groups alphabetically
	var wlanGroupList = Object.keys(groupConfigs);
	wlanGroupList.sort((a, b) => {
		const groupA = a.toUpperCase(); // ignore upper and lowercase
		const groupB = b.toUpperCase(); // ignore upper and lowercase
		// Sort on Group name
		if (groupA < groupB) {
			return -1;
		}
		if (groupA > groupB) {
			return 1;
		}
		return 0;
	});
	
	// Add and select the groups needed
	$.each(wlanGroupList, function() {
		$('#modalGroupSelector').append($('<option>', { value: this, text: this }));
		if ($('.selectpicker').length != 0) {
			$('.selectpicker').selectpicker('refresh');
		}
		$.each(selectedWLAN.groups, function(idx, val) {
			$("select option[value='" + val.toString() + "']").prop('selected', true);
			if (!tunneledGroupList.includes(val.toString())) tunneledGroupList.push(val.toString());
		});
	});
	$('.selectpicker').selectpicker('refresh');
}

function checkSelectionCount() {
	var select = document.getElementById('modalGroupSelector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);
	if (selectedGroups.length == 0) {
		document.getElementById('saveWLANBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = false;
	} else if (selectedGroups.length == configGroups.length) {
		document.getElementById('saveWLANBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = true;
	} else {
		document.getElementById('saveWLANBtn').disabled = false;
		document.getElementById('selectAllGroups').checked = false;
	}
	
	var newConfig = document.getElementById('wlanConfig').value;
	if ((newConfig.includes('forward-mode l2') || newConfig.includes('forward-mode l3') || newConfig.includes('forward-mode mixed')) && selectedGroups.toString() !== tunneledGroupList.toString()) {
		Swal.fire({
			title: 'WLAN Deployment',
			text: 'Deploying Tunnel or Mixed mode SSIDs to additional groups is not supported. Modifying an existing WLAN in the original group is supported.',
			icon: 'warning',
		});
		
		//reset the selected groups back to original
		buildGroupList();
	}
}

function checkSSIDSelectionCount() {
	var select = document.getElementById('wlanselector');
	var selectedSSIDs = [...select.selectedOptions].map(option => option.value);
	if (selectedSSIDs.length == 0) {
		document.getElementById('selectAllSSIDs').checked = false;
	} else if (selectedSSIDs.length == $('#wlanselector option').length) {
		document.getElementById('selectAllSSIDs').checked = true;
	} else {
		document.getElementById('selectAllSSIDs').checked = false;
	}
}

function selectAll() {
	$.each(configGroups, function(idx, val) {
		$("select option[value='" + val.group + "']").prop('selected', document.getElementById('selectAllGroups').checked);
	});
	$('.selectpicker').selectpicker('refresh');

	if (document.getElementById('selectAllGroups').checked) {
		document.getElementById('saveWLANBtn').disabled = false;
	} else {
		document.getElementById('saveWLANBtn').disabled = true;
	}
}

function selectAllSSIDs() {
	var select = document.getElementById('wlanselector');
	var allSSIDs = [...select.options].map(option => option.value);
	$.each(allSSIDs, function(idx, val) {
		$("select option[value='" + val + "']").prop('selected', document.getElementById('selectAllSSIDs').checked);
	});
	$('.selectpicker').selectpicker('refresh');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN Creation/Modification Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForDuplicateWLANName(newName) {
	var duplicate = false;
	$.each(wlans, function() {
		if (newName === this['name']) {
			duplicate = true;
			return false;
		}
	});
	return duplicate;
}

function confirmWLANDelete() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'The WLAN "'+ document.getElementById('wlanName').value + '" will be deleted from the selected groups.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			updateWLAN(false);
		}
	});
}

function updateWLAN(addingWLAN) {
	if ($('#WLANModal')) $('#WLANModal').modal('hide');
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get WLAN name
	var newWLANName = document.getElementById('wlanName').value;
	if (newWLANName.includes(' '))  newWLANName = '"'+newWLANName+'"';
	
	var newUserRole;
	$.each(userRoles, function() {
		if (this['name'] === newWLANName) {
			newUserRole = this;
			return false;
		}
	});

	// If we are going to be adding the WLAN - then prep the config with the required formatting
	if (addingWLAN) {
		var newConfig = document.getElementById('wlanConfig').value;
		var newConfigArray = [];
		var tempConfigArray = newConfig.split('\n');
		// Add indent to the config
		for (i = 0; i < tempConfigArray.length; i++) {
			newConfigArray.push('  ' + tempConfigArray[i]);
		}
	}

	// get selected Groups
	var select = document.getElementById('modalGroupSelector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);

	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group Configs...', 'bottom', 'center', 'info');
	$.each(selectedGroups, function() {
		var currentConfig = groupConfigs[this];
		var currentGroup = this.toString();

		// Find if there is an existing WLAN
		var startIndex = -1;
		var endIndex = -1;
		var firstWLANLocation = -1;

		var lineToFind = wlanPrefix + newWLANName;
		for (i = 0; i < currentConfig.length; i++) {
			if (currentConfig[i].includes(wlanPrefix) && firstWLANLocation == -1) {
				// grab the location of the first ssid - in case the role we are looking for isnt in the config
				firstWLANLocation = i;
			}
			if (currentConfig[i] === lineToFind) {
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
				endIndex = i;
			}
		}

		if (startIndex == -1) {
			// no existing ssid. Find the first ssid and place this role before it.
			startIndex = firstWLANLocation;
		} else {
			// remove the existing SSID from the config
			currentConfig.splice(startIndex, endIndex - startIndex);
		}
		

		// If the desired result is to add the new/updated role into the config for this group
		if (addingWLAN) {
			// build new WLAN
			var newWLAN = [];
			newWLAN.push(wlanPrefix + newWLANName);
			newWLAN.push(...newConfigArray);
			
			// Include default role if missing from the destination group
			var userRoleGroups = newUserRole.groups;
			var roleToFind = userRolePrefix + newWLANName;
			if (!currentConfig.includes(roleToFind)) {
				logInformation('Adding missing WLAN default user role to Group "'+currentGroup+'"')
				newWLAN.push(userRolePrefix + newWLANName);
				// Add indent to the acls
				var tempACLArray = newUserRole.acls;
				for (i = 0; i < tempACLArray.length; i++) {
					newWLAN.push('  ' + tempACLArray[i]);
				}
			}

			// Splice the new role into the config
			if (currentConfig.length) {
				currentConfig.splice(startIndex, 0, ...newWLAN);
			} else {
				currentConfig = newWLAN;
			}
		} else {
			// Find if there is an existing default user role
			var startRoleIndex = -1;
			var endRoleIndex = -1;
			var firstUserRoleLocation = -1;
			
			var lineToFind = userRolePrefix + newWLANName;
			for (i = 0; i < currentConfig.length; i++) {
				if (currentConfig[i].includes(userRolePrefix) && firstUserRoleLocation == -1) {
					// grab the location of the first user role - in case the role we are looking for isnt in the config
					firstUserRoleLocation = i;
				}
				if (currentConfig[i] === lineToFind) {
					startRoleIndex = i;
				} else if (endRoleIndex == -1 && startRoleIndex != -1 && !currentConfig[i].includes('  ')) {
					endRoleIndex = i;
				}
			}
			
			if (startRoleIndex != -1) {
				// remove the existing role from the config
				logInformation('Removing WLAN default user role from Group "'+currentGroup+'"')
				currentConfig.splice(startRoleIndex, endRoleIndex - startRoleIndex);
			}
		}
		
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
				logError('WLAN was not applied to group ' + currentGroup);
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
			} else {
				logInformation('WLAN change was applied to group ' + currentGroup)
			}
			if (updateCounter == selectedGroups.length) {
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'WLAN Deployment',
						text: addingWLAN ? 'The WLAN failed to be deployed to some or all of the selected Groups' : 'The WLAN failed to be removed to some or all of the selected Groups',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'WLAN Deployment',
						text: addingWLAN ? 'WLAN was deployed to all selected Groups' : 'WLAN was removed to all selected Groups',
						icon: 'success',
					});
					getWLANs();
				}
			}
		});
	});
}

function enableWLAN(wlanIndex, wlanEnable) {
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// Get selected WLAN and update the enable/disable
	var wlan = wlans[wlanIndex];
	var wlanName = wlan.name;
	var wlanGroups = wlan.groups;
	var wlanConfig = wlan.config;
	if (wlanEnable) {
		var enableRow = wlanConfig.indexOf('disable');
		wlanConfig[enableRow] = 'enable';
	} else {
		var disableRow = wlanConfig.indexOf('enable');
		wlanConfig[disableRow] = 'disable';
	}

	// prep the config with the required formatting
	var newConfigArray = [];
	for (i = 0; i < wlanConfig.length; i++) {
		newConfigArray.push('  ' + wlanConfig[i]);
	}

	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group Configs...', 'bottom', 'center', 'info');
	$.each(wlanGroups, function() {
		var currentConfig = groupConfigs[this];
		var currentGroup = this;

		// Find if there is an existing WLAN
		var startIndex = -1;
		var endIndex = -1;
		var firstWLANLocation = -1;

		var lineToFind = wlanPrefix + wlanName;
		for (i = 0; i < currentConfig.length; i++) {
			if (currentConfig[i].includes(wlanPrefix) && firstWLANLocation == -1) {
				// grab the location of the first ssid - in case the role we are looking for isnt in the config
				firstWLANLocation = i;
			}
			if (currentConfig[i] === lineToFind) {
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
				endIndex = i;
			}
		}

		if (startIndex == -1) {
			// no existing ssid. Find the first ssid and place this role before it.
			startIndex = firstWLANLocation;
		} else {
			// remove the existing role from the config
			currentConfig.splice(startIndex, endIndex - startIndex);
		}

		// If the desired result is to add the new/updated wlan into the config for this group
		var newWLAN = [];
		newWLAN.push(wlanPrefix + wlanName);
		newWLAN.push(...newConfigArray);

		// Splice the new role into the config
		if (currentConfig.length) {
			currentConfig.splice(startIndex, 0, ...newWLAN);
		} else {
			currentConfig = newWLAN;
		}

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
				logError('WLAN was not applied to group ' + currentGroup);
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
			if (updateCounter == wlanGroups.length) {
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'WLAN Deployment',
						text: wlanEnable ? 'The WLAN failed to be enabled to some or all of the selected Groups' : 'The WLAN failed to be disabled to some or all of the selected Groups',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'WLAN Deployment',
						text: wlanEnable ? 'The WLAN was enabled on all of the selected Groups' : 'The WLAN was disabled on all of the selected Groups',
						icon: 'success',
					});
					getWLANs();
				}
			}
		});
	});
}

function updateFullWLAN() {
	errorCounter = 0;
	clearErrorLog();

	var select = document.getElementById('groupselector');
	var currentGroup = select.value;

	var newConfig = document.getElementById('wlanConfig').value;
	var currentConfig = newConfig.split('\n');

	showNotification('ca-folder-settings', 'Updating Group Configs...', 'bottom', 'center', 'info');

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
		if (response.reason && response.reason == 'Bad Gateway') {
			Swal.fire({
				title: 'API Issue',
				text: 'There is an issue communicating with the API Gateway',
				icon: 'warning',
			});
		} else if (response.code && response.code == 429) {
			console.log('errorCode');
			logError('WLAN was not applied to group ' + currentGroup);
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
				text: 'WLAN was deployed to the ' + currentGroup + ' group',
				icon: 'success',
			});
			getWLANs();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AOS10 SSID Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedDevices(serial) {
	// Find the checkbox for the selected serial number
	var rowSelected = document.getElementById(serial).checked;
	if (!rowSelected) document.getElementById('device-select-all').checked = false;

	if (selectedDevices[serial] && !rowSelected) delete selectedDevices[serial];
	else selectedDevices[serial] = serial;
}

function loadDevicesAndSSIDs() {
	document.getElementById('selectAllSSIDs').checked = false;
	var select = document.getElementById('groupselector');

	// Pull the SSIDs for the selected Group
	var selectedGroupWLANs = groupWLANs[select.value];
	
	var wlans = document.getElementById('wlanselector');
	wlans.options.length = 0;
	
	$('#wlanselector').selectpicker('refresh');
	$.each(selectedGroupWLANs, function() {
		$('#wlanselector').append($('<option>', { value: this['name'], text: this['essid'] }));
	});
	$('#wlanselector').selectpicker('refresh');

	// Pull the APs for the selected Group (and build a reference list based on the serial number - for the selecting of the APs)
	var select = document.getElementById('groupselector');
	var groupAPs = getAPsForGroup(select.value);
	deviceInfo = {};
	$.each(groupAPs, function() {
		deviceInfo[this['serial']] = this;
	});

	// Load up the table
	loadDevicesTable(false);
}

function loadDevicesTable(checked) {
	$('#device-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')" checked>';

		// Build Status dot
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		if (device['status'] == 'Up') {
			status = '<i class="fa-solid fa-circle text-success"></i>';
		}

		// Add AP to table
		var table = $('#device-table').DataTable();
		table.row.add([checkBoxString, '<strong>' + device['name'] + '</strong>', status, device['status'] ? device['status'] : 'down', device['serial'], device['macaddr'], device['model'], device['group_name'], device['site'], device['labels'].join(', '), device['firmware_version']]);
	}
	$('#device-table')
		.DataTable()
		.rows()
		.draw();
}

function assignSSIDs() {
	// CSV header
	var serialKey = 'SERIAL';
	var ssidKey = 'ZONE';

	var csvDataBuild = [];

	// Get Selected SSIDs
	var select = document.getElementById('wlanselector');
	var selectedSSIDs = [...select.selectedOptions].map(option => option.value.replace(/"/g, ''));
	selectedSSIDstring = selectedSSIDs.join(',');
	if (document.getElementById('selectAllSSIDs').checked) selectedSSIDstring = '*';

	// Get selected APs
	for (const [key, value] of Object.entries(selectedDevices)) {
		csvDataBuild.push({ [serialKey]: key, [ssidKey]: selectedSSIDstring });
	}

	// Build CSV with selected SSIDs in CSV
	// Build into structure for processing in main.js
	var csvDataBlob = {};
	csvDataBlob['data'] = csvDataBuild;
	processCSV(csvDataBlob);
	setAPZone();
}


/*
	Config Shortcuts Functions
*/
function checkForTxBFConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('he-txbf-disable') || newConfig.includes('vht-txbf-explicit-disable')) {
		document.getElementById('txbfCheckbox').checked = false;
	} else {
		document.getElementById('txbfCheckbox').checked = true;
	}
}

function txbfConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('txbfCheckbox').checked) {
		if (newConfig.includes('vht-txbf-explicit-disable')) newConfig = newConfig.replace('\nvht-txbf-explicit-disable', '');
		if (newConfig.includes('he-txbf-disable')) newConfig = newConfig.replace('\nhe-txbf-disable', '');
	} else {
		if (!newConfig.includes('vht-txbf-explicit-disable')) newConfig += '\nvht-txbf-explicit-disable';
		if (!newConfig.includes('he-txbf-disable')) newConfig += '\nhe-txbf-disable';
	}
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}

function checkForMUMIMOConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('vht-mu-txbf-disable') || newConfig.includes('he-mu-mimo-disable')) {
		document.getElementById('mumimoCheckbox').checked = false;
	} else {
		document.getElementById('mumimoCheckbox').checked = true;
	}
}

function mumimoConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('mumimoCheckbox').checked) {
		if (newConfig.includes('vht-mu-txbf-disable')) newConfig = newConfig.replace('\nvht-mu-txbf-disable', '');
		if (newConfig.includes('he-mu-mimo-disable')) newConfig = newConfig.replace('\nhe-mu-mimo-disable', '');
	} else {
		if (!newConfig.includes('vht-mu-txbf-disable')) newConfig += '\nvht-mu-txbf-disable';
		if (!newConfig.includes('he-mu-mimo-disable')) newConfig += '\nhe-mu-mimo-disable';
	}
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}

function checkForOFDMAConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (newConfig.includes('he-mu-ofdma-disable')) {
		document.getElementById('ofdmaCheckbox').checked = false;
	} else {
		document.getElementById('ofdmaCheckbox').checked = true;
	}
}

function ofdmaConfig() {
	var newConfig = document.getElementById('wlanConfig').value;
	if (document.getElementById('ofdmaCheckbox').checked) {
		if (newConfig.includes('he-mu-ofdma-disable')) newConfig = newConfig.replace('\nhe-mu-ofdma-disable', '');
	} else {
		if (!newConfig.includes('he-mu-ofdma-disable')) newConfig += '\nhe-mu-ofdma-disable';
	}
	document.getElementById('wlanConfig').value = newConfig;
	document.getElementById('wlanConfig').scrollTop = document.getElementById('wlanConfig').scrollHeight;
}