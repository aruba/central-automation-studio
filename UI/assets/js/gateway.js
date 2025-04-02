/*
Central Automation v1.7.5
Updated: 1.14.
Aaron Scott (WiFi Downunder) 2021-2025
*/

var groupDeviceList = {};

var updateNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageGateway() {
	showNotification('ca-gateway', 'Retrieved all Gateways', 'bottom', 'center', 'success');
	buildGroupDeviceList();
}

function loadCurrentPageGroup() {
	showNotification('ca-folder-settings', 'Retrieved all Groups', 'bottom', 'center', 'success');
	buildGroupDeviceList();
}

function buildGroupDeviceList() {
	var groupList = getGroups();
	var gatewayList = getGateways();
	groupList.sort((a, b) => {
		const groupA = a.group.toUpperCase(); // ignore upper and lowercase
		const groupB = b.group.toUpperCase(); // ignore upper and lowercase
		// Sort on Group name
		if (groupA < groupB) {
			return -1;
		}
		if (groupA > groupB) {
			return 1;
		}
		return 0;
	});
	$.each(groupList, function() {
		if (this.group !== 'unprovisioned') {
			//if (this.group_properties.AllowedDevTypes.includes("Gateways")) {
			var groupName = this.group;
			// Add group name to list
			groupDeviceList[groupName] = encodeURI(groupName);

			$.each(gatewayList, function() {
				if (this.group_name === groupName) {
					var visibleName = groupName + ' > ' + this.name;
					groupDeviceList[visibleName] = encodeURI(groupName) + '/' + this.macaddr;
				}
			});
			//}
		}
	});

	// load selectPicker with Groups
	select = document.getElementById('groupselector');
	select.options.length = 0;

	var variableGroups = Object.keys(groupDeviceList);
	$.each(variableGroups, function() {
		$('#groupselector').append($('<option>', { value: groupDeviceList[this], text: this }));
		if ($('.selectpicker').length != 0) {
			$('.selectpicker').selectpicker('refresh');
		}
	});
	$('[data-toggle="tooltip"]').tooltip();
}

function viewConfig() {
	$('#ConfigModalLink').trigger('click');
}

function viewEffectiveConfig() {
	$('#EffectiveConfigModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Config functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getConfigforSelected() {
	document.getElementById('viewGatewayBtn').disabled = true;

	var groupselect = document.getElementById('groupselector');
	var selectedEntity = groupselect.value;
	//if (selectedEntity.includes('/')) {
	document.getElementById('viewEffectiveGatewayBtn').hidden = false;
	getEffectiveConfigForSelected();
	//} else {
	//	document.getElementById('viewEffectiveGatewayBtn').hidden = true;
	//}

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/caasapi/v1/showcommand/object/committed?group_name=' + selectedEntity,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/caasapi/v1/showcommand/object/committed)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		document.getElementById('gatewayConfigView').value = response.config.join('\n');
		document.getElementById('viewGatewayBtn').disabled = false;
	});
}

function getEffectiveConfigForSelected() {
	document.getElementById('viewEffectiveGatewayBtn').disabled = true;

	var groupselect = document.getElementById('groupselector');
	var selectedEntity = groupselect.value;

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/caasapi/v1/showcommand/object/effective?group_name=' + selectedEntity,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/caasapi/v1/showcommand/object/effective)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		document.getElementById('gatewayEffectiveConfigView').value = response.config.join('\n');
		document.getElementById('viewEffectiveGatewayBtn').disabled = false;
	});
}

function confirmCommands() {
	var select = document.getElementById('groupselector');
	var newConfig = document.getElementById('gatewayConfig').value;

	if (select.selectedIndex == 0) {
		showNotification('ca-window-code', 'Please select a Group / Device', 'bottom', 'center', 'danger');
	} else if (newConfig === '') {
		showNotification('ca-window-code', 'Please enter the required CLI commands', 'bottom', 'center', 'danger');
	} else {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Changes will be applied to the selected Group/Device',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#23CCEF',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, do it!',
		}).then(result => {
			if (result.isConfirmed) {
				applyCLICommands();
			}
		});
	}
}

function applyCLICommands() {
	errorCounter = 0;
	clearErrorLog();

	var select = document.getElementById('groupselector');
	var selectedText = select.options[select.selectedIndex].text;
	var currentGroup = select.value;

	var newConfig = document.getElementById('gatewayConfig').value;
	var currentConfig = newConfig.split('\n');

	updateNotification = showLongNotification('ca-window-code', 'Updating Gateway Config...', 'bottom', 'center', 'info');
	logStart('Applying commands for: ' +currentGroup)
		
	// need to push config back to Central.
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/caasapi/v1/exec/cmd?group_name=' + currentGroup,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ cli_cmds: currentConfig }),
		}),
	};
	//console.log(JSON.stringify({ cli_cmds: currentConfig }));

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response)
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/caasapi/v1/exec/cmd)');
				return;
			}
		}
		// Check overall result
		var result = response['_global_result'];
		if (result['status'] == 0) {
			if (updateNotification) {
				updateNotification.update({ type: 'success', message: 'Gateway config for ' + selectedText + ' was successfully updated' });
				setTimeout(updateNotification.close, 2000);
			}
			if (result['warning']) {
				logWarning(result['warning']);
			}
			var successState = false;
			$.each(response['cli_cmds_result'], function() {
				var currentResult = this;
				var commands = Object.keys(currentResult);
				$.each(commands, function() {
					if (currentResult[this].status == 1) {
						logError('Error with command "' + this + '": ' + currentResult[this]['status_str']);
					} else if (currentResult[this].status == 2) {
						logInformation('Command "' + this + '" was successful but returned a warning:');
						logWarning(currentResult[this].status_str);
						successState = true;
					} else if (currentResult[this].status == 0) {
						logInformation('Command "' + this + '" was successful');
						successState = true;
					}
				});
			});
			showLog();
			getConfigforSelected();
		} else {
			// Loop through the cli_cmds_result looking for the failed command
			var successState = false;
			$.each(response['cli_cmds_result'], function() {
				var currentResult = this;
				var commands = Object.keys(currentResult);
				$.each(commands, function() {
					if (currentResult[this].status == 1) {
						logError('Error with command "' + this + '": ' + currentResult[this]['status_str']);
					} else if (currentResult[this].status == 2) {
						logInformation('Command "' + this + '" was successful');
						logWarning(currentResult[this].status_str);
						successState = true;
					} else if (currentResult[this].status == 0) {
						logInformation('Command "' + this + '" was successful');
						successState = true;
					}
				});
			});
			if (successState) getConfigforSelected();
			showLog();
			if (updateNotification) {
				updateNotification.update({ type: 'warning', message: 'Gateway config for ' + selectedText + ' returned errors' });
				setTimeout(updateNotification.close, 2000);
			}
		}
	});
}
