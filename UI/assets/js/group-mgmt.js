/*
Central Automation v1.15
Updated: 
© Aaron Scott (WiFi Downunder) 2021-2024
*/

var allGroups = [];
var selectedGroups = {};
var groupInfo = {};
var modifyGroup = {};

var completeTotal = 0;
var runningTotal = 0;

var complianceNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageGroup() {
	const transaction = db.transaction('general', 'readonly');
	const store = transaction.objectStore('general');

	const firmwareQuery = store.get('firmware_groups');
	firmwareQuery.onsuccess = function() {
		if (firmwareQuery.result && firmwareQuery.result.data) {
			groupInfo = JSON.parse(firmwareQuery.result.data);
			if (groupInfo) {
				loadFirmwareTable(false);
			}
		} else {
			getFirmwareCompliance();
		}
	};

	$('[data-toggle="tooltip"]').tooltip();
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
	var enableAPs = document.getElementById('deviceTypeAccessPoint').checked;
	var enableAOSS = document.getElementById('deviceTypeSwitchesAOS').checked;
	var enableCX = document.getElementById('deviceTypeSwitchesCX').checked;
	var enableGateways = document.getElementById('deviceTypeGateways').checked;
	var properties = modifyGroup['group_properties'];

	var allowedDevTypes = properties['AllowedDevTypes'];
	var allowedSwitchTypes = properties['AllowedSwitchTypes'];

	// If switches are being added to the group (no adding of switch types after switching has been added is allowed)
	if (!allowedDevTypes.includes('Switches')) {
		if (enableAOSS) allowedSwitchTypes.push('AOS_S');
		else if (enableCX) allowedSwitchTypes.push('AOS_CX');
	}
	properties['AllowedSwitchTypes'] = allowedSwitchTypes;

	// Set the allowedDevTypes
	if (!allowedDevTypes.includes('AccessPoints')) {
		if (enableAPs) allowedDevTypes.push('AccessPoints');
	}
	if (!allowedDevTypes.includes('Switches')) {
		if (enableAOSS) allowedDevTypes.push('Switches');
		else if (enableCX) allowedDevTypes.push('Switches');
	}
	if (!allowedDevTypes.includes('Gateways')) {
		if (enableGateways) allowedDevTypes.push('Gateways');
	}
	properties['AllowedDevTypes'] = allowedDevTypes;

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

	document.getElementById('monitorAOSS').disabled = false;
	document.getElementById('monitorCX').disabled = false;

	var templateModes = modifyGroup['template_details'];
	document.getElementById('templateWireless').disabled = false;
	document.getElementById('templateWired').disabled = false;

	if (templateModes.Wired == false) document.getElementById('templateWired').checked = false;
	else document.getElementById('templateWired').checked = true;
	if (templateModes.Wireless == false) document.getElementById('templateWireless').checked = false;
	else document.getElementById('templateWireless').checked = true;

	if (devTypes.includes('AccessPoints')) {
		document.getElementById('deviceTypeAccessPoint').checked = true;
		document.getElementById('deviceTypeAccessPoint').disabled = true;
		document.getElementById('templateWireless').disabled = true;
	} else {
		document.getElementById('deviceTypeAccessPoint').checked = false;
		document.getElementById('deviceTypeAccessPoint').disabled = false;
	}

	document.getElementById('gatewayMobility').disabled = true;
	document.getElementById('gatewayBranch').disabled = true;
	document.getElementById('gatewayVPNC').disabled = true;
	if (devTypes.includes('Gateways')) {
		document.getElementById('deviceTypeGateways').checked = true;
		document.getElementById('deviceTypeGateways').disabled = true;
		document.getElementById('templateWireless').disabled = true;
		document.getElementById('gatewayMobility').checked = false;
		document.getElementById('gatewayBranch').checked = false;
		document.getElementById('gatewayVPNC').checked = false;
		if (modifyGroup['group_properties']['GwNetworkRole'] && modifyGroup['group_properties']['GwNetworkRole'] === 'WLANGateway') document.getElementById('gatewayMobility').checked = true;
		else document.getElementById('gatewayMobility').checked = false;
		if (modifyGroup['group_properties']['GwNetworkRole'] && modifyGroup['group_properties']['GwNetworkRole'] === 'BranchGateway') document.getElementById('gatewayBranch').checked = true;
		else document.getElementById('gatewayBranch').checked = false;
		if (modifyGroup['group_properties']['GwNetworkRole'] && modifyGroup['group_properties']['GwNetworkRole'] === 'VPNConcentrator') document.getElementById('gatewayVPNC').checked = true;
		else document.getElementById('gatewayVPNC').checked = false;
	} else {
		document.getElementById('deviceTypeGateways').checked = false;
		document.getElementById('deviceTypeGateways').disabled = false;
		document.getElementById('gatewayMobility').checked = false;
		document.getElementById('gatewayBranch').checked = false;
		document.getElementById('gatewayVPNC').checked = false;
	}
	enablePersonas();

	var switchTypes = modifyGroup['group_properties']['AllowedSwitchTypes'];
	if (devTypes.includes('Switches')) {
		if (switchTypes.includes('AOS_S')) document.getElementById('deviceTypeSwitchesAOS').checked = true;
		if (switchTypes.includes('AOS_CX')) document.getElementById('deviceTypeSwitchesCX').checked = true;
		document.getElementById('deviceTypeSwitchesAOS').disabled = true;
		document.getElementById('deviceTypeSwitchesCX').disabled = true;
		document.getElementById('templateWired').disabled = true;
		document.getElementById('monitorAOSS').disabled = true;
		document.getElementById('monitorCX').disabled = true;
		if (modifyGroup['group_properties']['MonitorOnly'] && modifyGroup['group_properties']['MonitorOnly'].includes('AOS_S')) {
			document.getElementById('monitorAOSS').checked = true;
		} else {
			document.getElementById('monitorAOSS').checked = false;
		}
		if (modifyGroup['group_properties']['MonitorOnly'] && modifyGroup['group_properties']['MonitorOnly'].includes('AOS_CX')) {
			document.getElementById('monitorCX').checked = true;
		} else {
			document.getElementById('monitorCX').checked = false;
		}
	} else {
		document.getElementById('deviceTypeSwitchesAOS').checked = false;
		document.getElementById('deviceTypeSwitchesCX').checked = false;
		document.getElementById('deviceTypeSwitchesAOS').disabled = false;
		document.getElementById('deviceTypeSwitchesCX').disabled = false;
	}

	$('#ModifyGroupModalLink').trigger('click');
}

function enablePersonas() {
	if (document.getElementById('deviceTypeGateways').checked) {
		document.getElementById('GatewayDivider').hidden = false;
		document.getElementById('GatewayPersonas').hidden = false;
		if (!document.getElementById('deviceTypeGateways').disabled) {
			document.getElementById('gatewayMobility').disabled = false;
			document.getElementById('gatewayBranch').disabled = false;
			document.getElementById('gatewayVPNC').disabled = false;
		}
	} else {
		document.getElementById('GatewayDivider').hidden = true;
		document.getElementById('GatewayPersonas').hidden = true;
		document.getElementById('gatewayMobility').disabled = true;
		document.getElementById('gatewayBranch').disabled = true;
		document.getElementById('gatewayVPNC').disabled = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Firmware functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getFirmwareVersions() {
	select = document.getElementById('apselector');
	select.options.length = 0;
	select = document.getElementById('switchselector');
	select.options.length = 0;
	select = document.getElementById('cxswitchselector');
	select.options.length = 0;
	select = document.getElementById('gatewayselector');
	select.options.length = 0;

	// AP Firmware Versions
	$('#apselector').append($('<option>', { value: 'No AP Compliance', text: 'No AP Compliance' }));
	var apSettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(apSettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/versions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		$.each(response, function() {
			$('#apselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#apselector').length != 0) {
				$('#apselector').selectpicker('refresh');
			}
		});
	});

	// Switch Firmware Versions
	$('#switchselector').append($('<option>', { value: 'No Switch Compliance', text: 'No AOS-Switch Compliance' }));
	var switchAOSSSettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(switchAOSSSettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/versions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		$.each(response, function() {
			$('#switchselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#switchselector').length != 0) {
				$('#switchselector').selectpicker('refresh');
			}
		});
	});

	$('#cxswitchselector').append($('<option>', { value: 'No Switch Compliance', text: 'No CX Switch Compliance' }));
	var switchCXSettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/firmware/v1/versions?device_type=CX',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(switchCXSettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/versions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		$.each(response, function() {
			$('#cxswitchselector').append($('<option>', { value: this['firmware_version'], text: this['firmware_version'] }));
			if ($('#cxswitchselector').length != 0) {
				$('#cxswitchselector').selectpicker('refresh');
			}
		});
	});

	// Gateway Firmware Versions
	$('#gatewayselector').append($('<option>', { value: 'No Gateway Compliance', text: 'No Gateway Compliance' }));
	var gatewaySettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(gatewaySettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/versions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

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
		console.log(this);
		// Check if group includes APs
		if (this['group_properties']['AllowedDevTypes'].includes('AccessPoints')) {
			var apSettings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
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
			$.ajax(apSettings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/upgrade/compliance_version)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);

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
			if (this['group_properties']['AllowedSwitchTypes'].includes('AOS_S')) {
				var switchSettings = {
					url: getAPIURL() + '/tools/getCommandwHeaders',
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
				$.ajax(switchSettings).done(function(commandResults, statusText, xhr) {
					if (commandResults.hasOwnProperty('headers')) {
						updateAPILimits(JSON.parse(commandResults.headers));
					}
					if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
						logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/upgrade/compliance_version)');
						apiErrorCount++;
						return;
					} else if (commandResults.hasOwnProperty('error_code')) {
						logError(commandResults.description);
						apiErrorCount++;
						return;
					}
					var response = JSON.parse(commandResults.responseBody);
	
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
			
			if (this['group_properties']['AllowedSwitchTypes'].includes('AOS_CX')) {
				var switchSettings = {
					url: getAPIURL() + '/tools/getCommandwHeaders',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=CX&group=' + groupName,
						access_token: localStorage.getItem('access_token'),
					}),
				};
				// Get Switch Compliance
				$.ajax(switchSettings).done(function(commandResults, statusText, xhr) {
					if (commandResults.hasOwnProperty('headers')) {
						updateAPILimits(JSON.parse(commandResults.headers));
					}
					if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
						logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/upgrade/compliance_version)');
						apiErrorCount++;
						return;
					} else if (commandResults.hasOwnProperty('error_code')) {
						logError(commandResults.description);
						apiErrorCount++;
						return;
					}
					var response = JSON.parse(commandResults.responseBody);
			
					currentInfo = groupInfo[groupName];
					if (response['firmware_compliance_version']) {
						currentInfo['CXSwitchVersion'] = response['firmware_compliance_version'];
					} else {
						currentInfo['CXSwitchVersion'] = 'Not Set';
					}
					groupInfo[groupName] = currentInfo;
					loadFirmwareTable(false);
				});
			} else {
				currentInfo = groupInfo[groupName];
				currentInfo['CXSwitchVersion'] = '-';
				groupInfo[groupName] = currentInfo;
				loadFirmwareTable(false);
			}
		} else {
			currentInfo = groupInfo[groupName];
			currentInfo['SwitchVersion'] = '-';
			currentInfo['CXSwitchVersion'] = '-';
			groupInfo[groupName] = currentInfo;
			loadFirmwareTable(false);
		}

		// Check if group includes Gateways
		if (this['group_properties']['AllowedDevTypes'].includes('Gateways')) {
			var gatewaySettings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
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
			$.ajax(gatewaySettings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/firmware/v1/upgrade/compliance_version)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);

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
		table.row.add([key, checkBoxString, '<strong>' + key + '</strong>', group['APVersion'] ? group['APVersion'] : '', group['SwitchVersion'] ? group['SwitchVersion'] : '',group['CXSwitchVersion'] ? group['CXSwitchVersion'] : '', group['GatewayVersion'] ? group['GatewayVersion'] : '']);
	}
	$('#firmware-group-table')
		.DataTable()
		.rows()
		.draw();
	saveDataToDB('firmware_groups', JSON.stringify(groupInfo));
}

function checkFirmwareUpdateDone() {
	if (runningTotal >= completeTotal) {
		
		if (complianceNotification) {
			complianceNotification.update({ type: 'success', message: 'Firmware Compliance was configured' });
			setTimeout(complianceNotification.close, 1000);
		}
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
		getFirmwareCompliance();
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
	var cxswitchselect = document.getElementById('cxswitchselector');
	var gatewayselect = document.getElementById('gatewayselector');

	// UI Sanity Check
	if (Object.keys(selectedGroups).length <= 0) {
		showNotification('ca-folder-check', 'Please select one or more Groups from the table', 'bottom', 'center', 'warning');
		return;
	}
	if (apselect.value === '' && switchselect.value === '' && cxswitchselect.value === '' && gatewayselect.value === '') {
		showNotification('ca-folder-check', 'Please select one or more Firmware choices', 'bottom', 'center', 'warning');
		return;
	}

	// for each group
	var groupArray = [];
	for (const [key, value] of Object.entries(selectedGroups)) {
		groupArray.push(key);
	}

	// 3 device types
	completeTotal = groupArray.length * 4;

	complianceNotification = showLongNotification('ca-folder-check', 'Setting Firmware Compliance...', 'bottom', 'center', 'info');
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

	// Update AOS-S Switches
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
					logInformation('Firmware Compliance for AOS-S Switches in ' + currentGroup + ' were already configured for ' + switchselect.value);
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
					logInformation('Firmware Compliance for AOS-S Switches in ' + currentGroup + ' is not configured');
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
							logInformation('Firmware Compliance for AOS-S Switches in ' + currentGroup + ' was removed');
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
	
	// Update AOS-CX Switches
	if (cxswitchselect.value !== '') {
		if (cxswitchselect.value !== 'No Switch Compliance') {
			// Set the compliance
			$.each(groupArray, function() {
				var currentGroup = this;
				// Check if groups includes the AP device type or if the version compliance is already set to the selected version
				if (groupInfo[currentGroup]['CXSwitchVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['CXSwitchVersion'] === cxswitchselect.value) {
					runningTotal++;
					logInformation('Firmware Compliance for AOS-CX Switches in ' + currentGroup + ' were already configured for ' + cxswitchselect.value);
				} else {
					// Update the cached info (assuming change is successful)
					currentInfo = groupInfo[currentGroup];
					currentInfo['CXSwitchVersion'] = cxswitchselect.value;
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
								device_type: 'CX',
								group: currentGroup,
								firmware_compliance_version: cxswitchselect.value,
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
							logInformation('Firmware Compliance for AOS-CX Switches in ' + currentGroup + ' was updated to ' + cxswitchselect.value);
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
				if (groupInfo[currentGroup]['CXSwitchVersion'] === '-') {
					runningTotal++;
				} else if (groupInfo[currentGroup]['CXSwitchVersion'] === 'Not Set') {
					runningTotal++;
					logInformation('Firmware Compliance for AOS-CX Switches in ' + currentGroup + ' is not configured');
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
							url: localStorage.getItem('base_url') + '/firmware/v1/upgrade/compliance_version?device_type=CX&group=' + currentGroup,
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
							logInformation('Firmware Compliance for AOS-CX Switches in ' + currentGroup + ' was removed');
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
