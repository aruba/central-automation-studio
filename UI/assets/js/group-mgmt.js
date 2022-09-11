/*
Central Automation v1.15
Updated: 
© Aaron Scott (WiFi Downunder) 2022
*/

var allGroups = [];
var selectedGroups = {};
var groupInfo = {};
var modifyGroup = {};

var completeTotal = 0;
var runningTotal = 0;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageGroup() {
	groupInfo = JSON.parse(localStorage.getItem('firmware_groups'));
	if (groupInfo) {
		loadFirmwareTable(false);
	} else {
		getFirmwareCompliance();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Group functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function createGroup() {
	var groupName = document.getElementById('groupName').value;
	var groupPassword = document.getElementById('groupPassword').value;
	var wiredTemplate = document.getElementById('wiredTemplate').checked;
	var wirelessTemplate = document.getElementById('wirelessTemplate').checked;

	showNotification('ca-c-add', 'Adding new Group...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, group_attributes: { group_password: groupPassword, template_info: { Wired: wiredTemplate, Wireless: wirelessTemplate } } }),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response)
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/groups)');
			}
		}

		if (response === 'Created') {
			Swal.fire({
				title: 'Add Success',
				text: 'Group was successfully created',
				icon: 'success',
			});
			// refresh group data to include new group
			getGroupData(0);
		} else {
			Swal.fire({
				title: 'Add Failure',
				text: 'Group was not able to be created',
				icon: 'error',
			});
		}
	});
}

function cloneGroup() {
	var selectedGroup = document.getElementById('groupselector').value;
	var groupName = document.getElementById('existingGroupName').value;
	var upgrade10 = document.getElementById('aos10upgrade').checked;

	if (upgrade10) showNotification('ca-folder-add', 'Upgrading new Group...', 'bottom', 'center', 'info');
	else showNotification('ca-folder-add', 'Cloning Group...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups/clone',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, clone_group: selectedGroup, upgrade_architecture: upgrade10 }),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/groups/clone)');
			}
		}

		if (response === 'Created') {
			Swal.fire({
				title: 'Clone Success',
				text: 'Group was successfully cloned',
				icon: 'success',
			});
			// refresh group data to include new group
			getGroupData(0);
		} else {
			Swal.fire({
				title: 'Clone Failure',
				text: 'Group was not able to be cloned',
				icon: 'error',
			});
		}
	});
}

function updateGroup() {
	var enableAOSS = document.getElementById('deviceTypeSwitchesAOS').checked;
	var enableCX = document.getElementById('deviceTypeSwitchesCX').checked;
	var properties = modifyGroup['group_properties'];

	var allowedDevTypes = properties['AllowedDevTypes'];
	if (enableAOSS && !allowedDevTypes.includes('Switches')) allowedDevTypes.push('Switches');
	else if (enableCX && !allowedDevTypes.includes('Switches')) allowedDevTypes.push('Switches');
	properties['AllowedDevTypes'] = allowedDevTypes;

	var allowedSwitchTypes = properties['AllowedSwitchTypes'];
	if (enableAOSS && !allowedSwitchTypes.includes('AOS_S')) allowedSwitchTypes.push('AOS_S');
	else if (enableCX && !allowedSwitchTypes.includes('AOS_CX')) allowedSwitchTypes.push('AOS_CX');
	properties['AllowedSwitchTypes'] = allowedSwitchTypes;
	console.log(properties);
	var apSettings = {
		url: getAPIURL() + '/tools/patchCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups/' + document.getElementById('modifyGroupName').value + '/properties',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group_properties: properties }),
		}),
	};

	$.ajax(apSettings).done(function(response, statusText, xhr) {
		console.log(response);
		console.log(xhr);
	});
}

function loadModifyGroup(groupName) {
	// Find group
	allGroups = getGroups();
	$.each(allGroups, function() {
		if (this.group === groupName) {
			modifyGroup = this;
			return false;
		}
	});

	// Update checkboxes
	document.getElementById('modifyGroupName').value = groupName;
	var devTypes = modifyGroup['group_properties']['AllowedDevTypes'];
	if (devTypes.includes('AccessPoints')) document.getElementById('deviceTypeAccessPoint').checked = true;
	else document.getElementById('deviceTypeAccessPoint').checked = false;

	if (devTypes.includes('Gateways')) document.getElementById('deviceTypeGateways').checked = true;
	else document.getElementById('deviceTypeGateways').checked = false;

	var switchTypes = modifyGroup['group_properties']['AllowedSwitchTypes'];
	if (devTypes.includes('Switches') && switchTypes.includes('AOS_S')) document.getElementById('deviceTypeSwitchesAOS').checked = true;
	else document.getElementById('deviceTypeSwitchesAOS').checked = false;
	if (devTypes.includes('Switches') && switchTypes.includes('AOS_CX')) document.getElementById('deviceTypeSwitchesCX').checked = true;
	else document.getElementById('deviceTypeSwitchesCX').checked = false;

	$('#ModifyGroupModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Firmware functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getFirmwareVersions() {
	select = document.getElementById('apselector');
	select.options.length = 0;
	select = document.getElementById('switchselector');
	select.options.length = 0;
	select = document.getElementById('gatewayselector');
	select.options.length = 0;

	// AP Firmware Versions
	$('#apselector').append($('<option>', { value: 'No AP Compliance', text: 'No AP Compliance' }));
	var apSettings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/firmware/v1/versions?device_type=IAP',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(apSettings).done(function(response, statusText, xhr) {
		$.each(response, function() {
			$('#apselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#apselector').length != 0) {
				$('#apselector').selectpicker('refresh');
			}
		});
	});

	// Switch Firmware Versions
	$('#switchselector').append($('<option>', { value: 'No Switch Compliance', text: 'No Switch Compliance' }));
	var switchAOSSSettings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/firmware/v1/versions?device_type=HP',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(switchAOSSSettings).done(function(response, statusText, xhr) {
		$.each(response, function() {
			$('#switchselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#switchselector').length != 0) {
				$('#switchselector').selectpicker('refresh');
			}
		});
	});

	/*var switchCXSettings = {
			url: getAPIURL() + '/tools/getCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/firmware/v1/versions?device_type=CX',
				access_token: localStorage.getItem('access_token'),
			}),
		};*/

	//$.ajax(switchCXSettings).done(function(response, statusText, xhr) {});

	// Gateway Firmware Versions
	$('#gatewayselector').append($('<option>', { value: 'No Gateway Compliance', text: 'No Gateway Compliance' }));
	var gatewaySettings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/firmware/v1/versions?device_type=CONTROLLER',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(gatewaySettings).done(function(response, statusText, xhr) {
		$.each(response, function() {
			$('#gatewayselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#gatewayselector').length != 0) {
				$('#gatewayselector').selectpicker('refresh');
			}
		});
	});
}

function getFirmwareCompliance() {
	selectedGroups = {};
	var fullGroupList = getGroups();
	groupInfo = {};
	var groupCounter = 0;
	$.each(fullGroupList, function() {
		var groupName = this['group'];

		// get Firmware info
		groupInfo[groupName] = this;

		// Check if group includes APs
		if (this['group_properties']['AllowedDevTypes'].includes('AccessPoints')) {
			var apSettings = {
				url: getAPIURL() + '/tools/getCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=IAP&group=' + groupName,
					access_token: localStorage.getItem('access_token'),
				}),
			};
			// Get AP Compliance
			$.ajax(apSettings).done(function(response, statusText, xhr) {
				currentInfo = groupInfo[groupName];
				if (response['firmware_compliance_version']) {
					currentInfo['APVersion'] = response['firmware_compliance_version'];
				} else {
					currentInfo['APVersion'] = 'Not Set';
				}
				groupInfo[groupName] = currentInfo;
				loadFirmwareTable(false);
			});
		} else {
			currentInfo = groupInfo[groupName];
			currentInfo['APVersion'] = '-';
			groupInfo[groupName] = currentInfo;
			loadFirmwareTable(false);
		}

		// Check if group includes Switches
		if (this['group_properties']['AllowedDevTypes'].includes('Switches')) {
			var switchSettings = {
				url: getAPIURL() + '/tools/getCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=HP&group=' + groupName,
					access_token: localStorage.getItem('access_token'),
				}),
			};
			// Get Switch Compliance
			$.ajax(switchSettings).done(function(response, statusText, xhr) {
				currentInfo = groupInfo[groupName];
				if (response['firmware_compliance_version']) {
					currentInfo['SwitchVersion'] = response['firmware_compliance_version'];
				} else {
					currentInfo['SwitchVersion'] = 'Not Set';
				}
				groupInfo[groupName] = currentInfo;
				loadFirmwareTable(false);
			});
		} else {
			currentInfo = groupInfo[groupName];
			currentInfo['SwitchVersion'] = '-';
			groupInfo[groupName] = currentInfo;
			loadFirmwareTable(false);
		}

		// Check if group includes Gateways
		if (this['group_properties']['AllowedDevTypes'].includes('Gateways')) {
			var gatewaySettings = {
				url: getAPIURL() + '/tools/getCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=CONTROLLER&group=' + groupName,
					access_token: localStorage.getItem('access_token'),
				}),
			};
			// Get Gateway Compliance
			$.ajax(gatewaySettings).done(function(response, statusText, xhr) {
				currentInfo = groupInfo[groupName];
				if (response['firmware_compliance_version']) {
					currentInfo['GatewayVersion'] = response['firmware_compliance_version'];
				} else {
					currentInfo['GatewayVersion'] = 'Not Set';
				}
				groupInfo[groupName] = currentInfo;
				loadFirmwareTable(false);
			});
		} else {
			currentInfo = groupInfo[groupName];
			currentInfo['GatewayVersion'] = '-';
			groupInfo[groupName] = currentInfo;
			loadFirmwareTable(false);
		}
	});
}

function updateSelectedGroups(groupName) {
	if (document.getElementById(groupName)) {
		var rowSelected = document.getElementById(groupName).checked;
		if (!rowSelected) document.getElementById('group-select-all').checked = false;
	}

	if (selectedGroups[groupName] && !rowSelected) delete selectedGroups[groupName];
	else selectedGroups[groupName] = groupName;
}

function selectAllGroups() {
	var checkBoxChecked = false;
	if (Object.keys(selectedGroups).length < Object.keys(groupInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(groupInfo)) {
			if (!selectedGroups[key]) selectedGroups[key] = key;
		}
	} else {
		selectedGroups = {};
	}

	loadFirmwareTable(checkBoxChecked);
}

function loadFirmwareTable(checked) {
	$('#firmware-group-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(groupInfo)) {
		var group = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedGroups(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedGroups(\'' + key + '\')" checked>';

		// Add VC Cluster to table
		var table = $('#firmware-group-table').DataTable();
		table.row.add([key, checkBoxString, '<strong>' + key + '</strong>', group['APVersion'] ? group['APVersion'] : '', group['SwitchVersion'] ? group['SwitchVersion'] : '', group['GatewayVersion'] ? group['GatewayVersion'] : '']);
	}
	$('#firmware-group-table')
		.DataTable()
		.rows()
		.draw();

	localStorage.setItem('firmware_groups', JSON.stringify(groupInfo));
}

function checkFirmwareUpdateDone() {
	if (runningTotal >= completeTotal) {
		if (apiErrorCount > 0) {
			Swal.fire({
				title: 'Firmware Compliance Failure',
				text: 'Some or all Groups failed to be configured',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Firmware Compliance Success',
				text: 'All Groups were configured',
				icon: 'success',
			});
		}
	}
}

function configureSelectedGroupsFirmware() {
	// setup counters for messaging
	apiErrorCount = 0;
	var groupArray = [];

	completeTotal = 0;
	runningTotal = 0;

	var apselect = document.getElementById('apselector');
	var switchselect = document.getElementById('switchselector');
	var gatewayselect = document.getElementById('gatewayselector');

	// UI Sanity Check
	if (Object.keys(selectedGroups).length <= 0) {
		showNotification('ca-folder-check', 'Please select one or more Groups from the table', 'bottom', 'center', 'warning');
		return;
	}
	if (apselect.value === '' && switchselect.value === '' && gatewayselect.value === '') {
		showNotification('ca-folder-check', 'Please select one or more Firmware choices', 'bottom', 'center', 'warning');
		return;
	}

	// for each group
	var groupArray = [];
	for (const [key, value] of Object.entries(selectedGroups)) {
		groupArray.push(key);
	}

	// 3 device types
	completeTotal = groupArray.length * 3;

	showNotification('ca-folder-check', 'Setting Firmware Compliance...', 'bottom', 'center', 'info');
	// Update APs
	if (apselect.value !== '') {
		if (apselect.value !== 'No AP Compliance') {
			// Set the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['APVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['APVersion'] === apselect.value) {
					runningTotal++;
					logInformation('Firmware Compliance for APs in ' + currentGroup + ' were already configured for ' + apselect.value);
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['APVersion'] = apselect.value;
					groupInfo[currentGroup] = currentInfo;

					var apsettings = {
						url: getAPIURL() + '/tools/postCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v2/upgrade/compliance_version',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({
								device_type: 'IAP',
								group: currentGroup,
								firmware_compliance_version: apselect.value,
								reboot: true,
								allow_unsupported_version: true,
								compliance_scheduled_at: 0,
							}),
						}),
					};

					$.ajax(apsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for APs in ' + currentGroup + ' was updated to ' + apselect.value);
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		} else {
			// need to remove the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['APVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['APVersion'] === 'Not Set') {
					runningTotal++;
					//logInformation('Firmware Compliance for APs in ' + currentGroup + ' is not configured');
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['APVersion'] = 'Not Set';
					groupInfo[currentGroup] = currentInfo;

					var apsettings = {
						url: getAPIURL() + '/tools/deleteCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=IAP&group=' + currentGroup,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(apsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for APs in ' + currentGroup + ' was removed');
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		}
	} else {
		runningTotal += groupArray.length;
		checkFirmwareUpdateDone();
	}

	// Update Switches
	if (switchselect.value !== '') {
		if (switchselect.value !== 'No Switch Compliance') {
			// Set the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['SwitchVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['SwitchVersion'] === switchselect.value) {
					runningTotal++;
					logInformation('Firmware Compliance for Switches in ' + currentGroup + ' were already configured for ' + switchselect.value);
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['SwitchVersion'] = switchselect.value;
					groupInfo[currentGroup] = currentInfo;

					var switchsettings = {
						url: getAPIURL() + '/tools/postCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v2/upgrade/compliance_version',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({
								device_type: 'HP',
								group: currentGroup,
								firmware_compliance_version: switchselect.value,
								reboot: true,
								allow_unsupported_version: true,
								compliance_scheduled_at: 0,
							}),
						}),
					};

					$.ajax(switchsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for Switches in ' + currentGroup + ' was updated to ' + switchselect.value);
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		} else {
			// need to remove the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['SwitchVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['SwitchVersion'] === 'Not Set') {
					runningTotal++;
					logInformation('Firmware Compliance for Switches in ' + currentGroup + ' is not configured');
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['SwitchVersion'] = 'Not Set';
					groupInfo[currentGroup] = currentInfo;

					var apsettings = {
						url: getAPIURL() + '/tools/deleteCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=HP&group=' + currentGroup,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(apsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for Switches in ' + currentGroup + ' was removed');
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		}
	} else {
		runningTotal += groupArray.length;
		checkFirmwareUpdateDone();
	}

	// Update Gateways
	if (gatewayselect.value !== '') {
		if (gatewayselect.value !== 'No Gateway Compliance') {
			// Set the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['GatewayVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['GatewayVersion'] === gatewayselect.value) {
					runningTotal++;
					logInformation('Firmware Compliance for Gateways in ' + currentGroup + ' were already configured for ' + gatewayselect.value);
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['GatewayVersion'] = gatewayselect.value;
					groupInfo[currentGroup] = currentInfo;

					var apsettings = {
						url: getAPIURL() + '/tools/postCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v2/upgrade/compliance_version',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({
								device_type: 'CONTROLLER',
								group: currentGroup,
								firmware_compliance_version: gatewayselect.value,
								reboot: true,
								allow_unsupported_version: true,
								compliance_scheduled_at: 0,
							}),
						}),
					};

					$.ajax(apsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for Gateways in ' + currentGroup + ' was updated to ' + gatewayselect.value);
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		} else {
			// need to remove the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['GatewayVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['GatewayVersion'] === 'Not Set') {
					runningTotal++;
					//logInformation('Firmware Compliance for Gateways in ' + currentGroup + ' is not configured');
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['GatewayVersion'] = 'Not Set';
					groupInfo[currentGroup] = currentInfo;

					var apsettings = {
						url: getAPIURL() + '/tools/deleteCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=CONTROLLER&group=' + currentGroup,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(apsettings).done(function(response, statusText, xhr) {
						runningTotal++;
						if (response.hasOwnProperty('status')) {
							if (response.status === '503') {
								apiErrorCount++;
								logError('Central Server Error (503): ' + response.reason + ' (/firmware/v2/upgrade/compliance_version)');
							}
						} else if (response.hasOwnProperty('error_codes')) {
							apiErrorCount++;
							logError('Central Server Error (' + response.error_codes + ')');
							Swal.fire({
								title: 'Firmware Compliance Failure',
								text: 'Some or all Groups failed to be configured',
								icon: 'error',
							});
						} else {
							logInformation('Firmware Compliance for Gateways in ' + currentGroup + ' was removed');
							checkFirmwareUpdateDone();
						}
						// Refresh the table to show the changes.
						loadFirmwareTable(false);
					});
				}
			});
		}
	} else {
		runningTotal += groupArray.length;
		checkFirmwareUpdateDone();
	}
}
