/*
Central Automation v1.4b2
Updated: 1.20
Aaron Scott (WiFi Downunder) 2023
*/

var stacks = [];
var stacksPromise;
var stackSwitches = {};
var switchVariables = {};
var switchVars = {};

var updateCounter = 0;
var errorCounter = 0;
var variableCounter = 0;

var switchVLANs = [];
var currentSwitch = '';
var selectedSwitch = {};
var currentVLANRow = 0;

var currentGroup = '';
var currentTemplate = '';
var currentTemplateModel = '';
var currentTemplateType = '';
var currentTemplateVersion = '';
var switchTemplate = '';

var templatePromise;
var variablesPromise;

var switchesLoaded = false;
var groupsLoaded = false;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Global functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageSwitch() {
	getSwitchStacks();
	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Repeating function
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchStacks() {
	$.when(tokenRefresh()).then(function() {
		getSwitchVariables();
		stacksPromise = new $.Deferred();
		$('#stacks-table')
			.DataTable()
			.clear();
		stackCounter = 0;
		stacks = [];
		stackSwitches = {};
		showNotification('ca-switch-stack', 'Getting Switch Stacks...', 'bottom', 'center', 'info');
		$.when(getStacks(0)).then(function() {
			showNotification('ca-switch-stack', 'Downloaded Switch Stack Information', 'bottom', 'center', 'success');
			// loop through each stack and get details for each switch in the the stack
			showNotification('ca-switch-stack', 'Getting Switch Details...', 'bottom', 'center', 'info');
			$.each(stacks, function() {
				getStackSwitches(this.id, this.name);
			});
		});
	});
	document.getElementById('addNewVLANBtn').disabled = true;
}

function updateData() {
	var refreshrate = localStorage.getItem('refresh_rate');
	if (refreshrate === null || refreshrate === '') {
		refreshrate = '30';
	}
	getMonitoringData(refreshrate);
	getSwitchStacks();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Stack Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getStacks(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switch_stacks?calculate_total=true',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switch_stacks)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		stacks = stacks.concat(response.stacks);
		if (offset + apiLimit <= response.total) getStacks(offset + apiLimit);
		else {
			stacksPromise.resolve();
		}
	});
	return stacksPromise.promise();
}

function getStackSwitches(stack_id, stackName) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches?stack_id=' + stack_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		stackSwitches[stack_id] = response.switches;
		var switchCounter = 0;
		var stackCommander = '';
		var stackMembers = '';
		$.each(response.switches, function() {
			var currentSerial = this.serial;
			var settings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/monitoring/v1/switches/' + currentSerial,
					access_token: localStorage.getItem('access_token'),
				}),
			};

			$.ajax(settings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/switches)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);

				switchCounter++;

				for (i = 0; i < stackSwitches[stack_id].length; i++) {
					if (stackSwitches[stack_id][i].serial === currentSerial) {
						stackSwitches[stack_id][i] = response;
						if (response.commander_serial) {
							stackCommander = response.commander_serial;
							stackMembers = stackMembers + response.serial + '\n';
						}
					}
				}
				if (switchCounter == stackSwitches[stack_id].length) {
					var table = $('#stacks-table').DataTable();
					// Add row to table
					table.row.add([stack_id, stackName, stackCommander, stackMembers.trim()]);
					$('#stacks-table')
						.DataTable()
						.rows()
						.draw();

					stackCounter++;
					if (stackCounter === stacks.length) showNotification('ca-switch-stack', 'Downloaded Switch Details', 'bottom', 'center', 'success');
				}
			});
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template Variables Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchVariables() {
	switchVariables = {};
	showNotification('ca-document-copy', 'Getting Switch variables...', 'bottom', 'center', 'info');
	getVariablesForAllDevices(0);
}

function getVariablesForAllDevices(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/template_variables?format=JSON&limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/template_variables)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var variablesText = response;

		switchVariables = Object.assign({}, switchVariables, response);

		variableTotal = Object.keys(variablesText).length;
		if (Object.keys(variablesText).length == apiGroupLimit) {
			// not an empty result - there might be more to get
			getVariablesForAllDevices(offset + apiGroupLimit);
		} else {
			showNotification('ca-document-copy', 'All variables have been downloaded', 'bottom', 'center', 'success');

			//load switches table
			loadSwitchesTable();
		}
	});
}

function getVariablesForSingleDevice(serialNumber) {
	// gets template variables for single device and updates the dictionary of variables
	variablesPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + serialNumber + '/template_variables',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		// save out the current variables
		switchVariables[serialNumber] = response['data']['variables'];
		variablesPromise.resolve();
	});
	return variablesPromise.promise();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template Switch Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchDetails(currentSerial) {
	// Clear existing data
	$('#vlan-table')
		.DataTable()
		.rows()
		.remove();
	$('#vlan-table')
		.DataTable()
		.rows()
		.draw();
	document.getElementById('dns1').value = '';
	document.getElementById('dns2').value = '';

	currentSwitch = currentSerial;

	// Get the template for the selected switch
	$.when(getTemplateForSwitch(currentSerial)).then(function() {
		// then process the template and variables to fill in the VLANs table
		getVLANDetailsFromTemplate(currentSerial);
		getSystemDetailsFromTemplate(currentSerial);
	});
}

function getTemplateForSwitch(currentSerial) {
	switchTemplate = '';
	templatePromise = new $.Deferred();
	// Get the template name for the selected switch
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/template?device_serials=' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/template)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var data = response.data;
		// grab out the group name and the template name.
		currentGroup = data[currentSerial]['group_name'];
		currentTemplate = data[currentSerial]['template_name'];
		currentTemplateType = 'ArubaSwitch';
		//console.log(currentTemplate);

		showNotification('ca-document-copy', 'Getting template for device...', 'bottom', 'center', 'info');

		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/groups/' + currentGroup + '/templates/' + currentTemplate,
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(commandResults, statusText, xhr) {
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/template)');
				apiErrorCount++;
				return;
			} else if (commandResults.hasOwnProperty('error_code')) {
				logError(commandResults.description);
				apiErrorCount++;
				return;
			}
			var response = JSON.parse(commandResults.responseBody);

			if (response.error_code) {
				if (response.description.includes('not found as a Template group')) {
					Swal.fire({
						title: 'No Template',
						text: 'This switch (' + currentSerial + ') is no longer in a Template group',
						icon: 'warning',
					});
				} else {
					Swal.fire({
						title: 'Template Failure',
						text: response.description,
						icon: 'error',
					});
				}
				return null;
			} else if (response.responseBody) {
				// store the template returned.
				switchTemplate = response.responseBody;
				templatePromise.resolve();
			}
		});
	});
	return templatePromise.promise();
}

function getVLANDetailsFromTemplate(currentSerial) {
	showNotification('ca-document-copy', 'Processing template...', 'bottom', 'center', 'info');

	var templateModified = false;
	var usingVariables = false;

	// Find config block for the first VLAN
	var vlanLocation = switchTemplate.indexOf('\nvlan ');
	// Loop whilst there are more VLANs to process
	while (vlanLocation != -1) {
		var vlanID = '';
		var vlanName = '';
		var ipAddressVar = '';
		var subnetMaskVar = '';
		var untaggedVar = '';
		var taggedVar = '';
		var untaggedPorts = '';
		var taggedPorts = '';

		var vlanBlock = switchTemplate.substring(vlanLocation + 1, switchTemplate.indexOf('exit\n', vlanLocation) + 5);
		//console.log(vlanBlock)

		// Cleanup the VLAN block formatting
		var vlanArray = vlanBlock.split('\n');
		for (i = 1; i < vlanArray.length; i++) {
			if (vlanArray[i].trim()) {
				var vlanRow = '   ' + vlanArray[i].trim();
				vlanArray[i] = vlanRow;
			}
		}
		vlanBlock = vlanArray.join('\n');

		// Process VLAN ID
		var idLocation = vlanBlock.indexOf('vlan ');
		if (idLocation != -1) {
			// Find the config line for "vlan"
			vlanID = vlanBlock.substring(idLocation + 5, vlanBlock.indexOf('\n', idLocation));
		}
		// Process VLAN Name
		var nameLocation = vlanBlock.indexOf('   name ');
		if (nameLocation != -1) {
			// Find the config line for "name"
			vlanName = vlanBlock.substring(nameLocation + 8, vlanBlock.indexOf('\n', nameLocation));
			vlanName = vlanName.replace(/"/g, '');
		}

		// Process the IP Address
		// Is there a config line for the IP address?
		var ipLocation = vlanBlock.indexOf('   ip address ');
		var ipAddress = '';
		var subnetMask = '';
		if (ipLocation != -1) {
			// Find the config line for "ip address"
			var ipConfig = vlanBlock.substring(ipLocation + 14, vlanBlock.indexOf('\n', ipLocation));
			// are we using a variable for the ip address?
			if (ipConfig.includes('%')) {
				// yes... grabbing the variable name
				var cleanIPAddress = ipConfig.replace(/%/g, '');
				var ipAddressArray = cleanIPAddress.split(' ');
				ipAddressVar = ipAddressArray[0];
				if (ipAddressArray[1]) subnetMaskVar = ipAddressArray[1];
				// grab the variables for switch and get value for variable name
				switchVars = switchVariables[currentSerial];
				ipAddress = switchVars[ipAddressVar];
				if (subnetMaskVar) {
					// separate variable for subnet mask
					subnetMask = switchVars[subnetMaskVar];
				} else if (ipAddress) {
					// if using a single variable to hold both ip and subnet eg. "x.x.x.x 255.255.255.0"
					var ipArray = ipAddress.split(' ');
					ipAddress = ipArray[0];
					subnetMask = ipArray[1];
				}
			} else {
				// No... not using variables for the ip address for this vlan.
				var ipAddressArray = ipConfig.split(' ');
				ipAddress = ipAddressArray[0];
				subnetMask = ipAddressArray[1];
			}
		} /* else {
			console.log("No IP address configured on "+ vlanName + " ("+vlanID+")")
		}*/

		// Process the Untagged Ports
		// Is there a config line for untagged ports?
		var untaggedLocation = vlanBlock.indexOf('   untagged ');
		if (untaggedLocation != -1) {
			// Find the config line for "untagged"
			var untaggedPorts = vlanBlock.substring(untaggedLocation + 12, vlanBlock.indexOf('\n', untaggedLocation));
			// are we using a variable for the untagged ports?
			if (untaggedPorts.includes('%')) {
				// yes... grabbing the variable name
				untaggedVar = untaggedPorts.replace(/%/g, '');

				// grab the variables for switch and get value for variable name
				switchVars = switchVariables[currentSerial];
				untaggedPorts = switchVars[untaggedVar];
			}
			//console.log("Untagged: "+untaggedPorts)
		} /* else {
			console.log("No untagged ports")
		}*/

		// Process the Tagged Ports
		// Is there a config line for tagged ports?
		var taggedLocation = vlanBlock.indexOf('   tagged ');
		if (taggedLocation != -1) {
			// Find the config line for "tagged"
			var taggedPorts = vlanBlock.substring(taggedLocation + 10, vlanBlock.indexOf('\n', taggedLocation));
			// are we using a variable for the tagged ports?
			if (taggedPorts.includes('%')) {
				// yes... grabbing the variable name
				taggedVar = taggedPorts.replace(/%/g, '');

				// grab the variables for switch and get value for variable name
				switchVars = switchVariables[currentSerial];
				taggedPorts = switchVars[taggedVar];
			}
			//console.log("Tagged: "+taggedPorts)
		} /* else {
			console.log("No tagged ports")
		}*/

		var vlanTable = $('#vlan-table').DataTable();
		// Clean up the IP address for the table
		var tableIP = '';
		if (ipAddress) tableIP = ipAddress + ' / ' + subnetMask;
		if (ipAddress === 'dhcp-bootp') {
			tableIP = ipAddress;
			subnetMask = '';
		}

		// Protect against missing template variables for a switch
		if (!ipAddress) ipAddress = '';
		if (!subnetMask) subnetMask = '';
		if (!untaggedPorts) untaggedPorts = '';
		if (!taggedPorts) taggedPorts = '';

		var vlanObject = {
			id: vlanID,
			name: vlanName,
			ipaddress: ipAddress,
			subnetMask: subnetMask,
			untagged_ports: untaggedPorts,
			tagged_ports: taggedPorts,
		};

		// Save the vlan into the stored VLAN list
		switchVLANs.push(vlanObject);
		// Add row to VLAN Config table
		vlanTable.row.add([vlanID, vlanName, tableIP, taggedPorts, untaggedPorts]);
		$('#vlan-table')
			.DataTable()
			.rows()
			.draw();

		// Move to the next VLAN
		vlanLocation = switchTemplate.indexOf('\nvlan ', vlanLocation + 4);
	}
	document.getElementById('addNewVLANBtn').disabled = false;
}

function processVLANChanges(vlanID) {
	showNotification('ca-document-copy', 'Processing changes...', 'bottom', 'center', 'info');

	var templateModified = false;
	var usingVariables = false;
	var ipAddressVar = '';
	var subnetMaskVar = '';
	var untaggedVar = '';
	var taggedVar = '';

	// Find config block for chosen VLAN ID
	var vlanLocation = switchTemplate.indexOf('\nvlan ' + vlanID);
	var vlanBlock = switchTemplate.substring(vlanLocation + 1, switchTemplate.indexOf('exit\n', vlanLocation) + 5);
	var originalVLANBlock = vlanBlock;

	// Cleanup the VLAN block formatting
	var vlanArray = vlanBlock.split('\n');
	for (i = 1; i < vlanArray.length; i++) {
		if (vlanArray[i].trim()) {
			var vlanRow = '   ' + vlanArray[i].trim();
			vlanArray[i] = vlanRow;
		}
	}
	vlanBlock = vlanArray.join('\n');

	// Process Name changes
	var nameLocation = vlanBlock.indexOf('   name ');
	if (nameLocation != -1) {
		// Find the config line for "name"
		var nameConfig = vlanBlock.substring(nameLocation, vlanBlock.indexOf('\n', nameLocation) + 1);
		if (document.getElementById('vlanName').value) {
			// Update line in config
			vlanBlock = vlanBlock.replace(nameConfig, '   name "' + document.getElementById('vlanName').value + '"\n');
		} else {
			// removing the name from the VLAN
			vlanBlock = vlanBlock.replace(nameConfig, '');
		}
	} else {
		nameLocation = vlanBlock.indexOf('\n');
		var vlanBlockStart = vlanBlock.substring(0, nameLocation);
		var vlanBlockEnd = vlanBlock.substring(nameLocation);
		// slide the untagged ports config line in the vlan block
		vlanBlock = vlanBlockStart + '\n   name "' + document.getElementById('vlanName').value + '"' + vlanBlockEnd;
	}

	// Process the IP Address
	// Clean up inputs
	var providedIP = document.getElementById('vlanIPAddress').value.trim();
	providedIP = providedIP.toLowerCase();
	var providedSubnet = document.getElementById('vlanSubnetMask').value.trim();
	var providedAddress = providedIP + ' ' + providedSubnet;
	if (providedIP.includes('dhcp')) {
		providedIP = 'dhcp-bootp';
		providedAddress = 'dhcp-bootp';
	} else if (!providedIP) {
		providedAddress = '';
	}
	providedAddress = providedAddress.trim();

	// Is there a config line for the IP address?
	var ipLocation = vlanBlock.indexOf('   ip address ');
	if (ipLocation != -1) {
		// Find the config line for "ip address"
		var ipConfig = vlanBlock.substring(ipLocation + 14, vlanBlock.indexOf('\n', ipLocation));
		// are we using a variable for the ip address?
		if (ipConfig.includes('%')) {
			// yes... grabbing the variable name
			var cleanIPAddress = ipConfig.replace(/%/g, '');
			var ipAddressArray = cleanIPAddress.split(' ');
			ipAddressVar = ipAddressArray[0];
			if (ipAddressArray[1]) {
				subnetMaskVar = ipAddressArray[1];
			}
			usingVariables = true;
		} else if (document.getElementById('vlanIPAddress').value) {
			// No... will need to modify the template directly - as not using variables for the ip address for this vlan.
			console.log('no ip address variable in use - need to update template directly');
			// replace the old untagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(ipConfig, providedAddress);
		} else {
			// need to remove untagged ports config line
			var lineToRemove = vlanBlock.substring(ipLocation, vlanBlock.indexOf('\n', ipLocation));
			vlanBlock = vlanBlock.replace(lineToRemove + '\n', '   no ip address\n');
		}
	} else if (document.getElementById('vlanIPAddress').value) {
		// VLAN currently doesn't have a config for an IP address
		var exitLocation = vlanBlock.indexOf('exit');
		var vlanBlockStart = vlanBlock.substring(0, exitLocation);
		var vlanBlockEnd = vlanBlock.substring(exitLocation);
		// slide the ip address config line in the vlan block
		vlanBlock = vlanBlockStart + 'ip address ' + providedAddress + '\n   ' + vlanBlockEnd;
		vlanBlock = vlanBlock.replace('   no ip address\n', '');
	}

	// Process the Untagged Ports
	// Is there a config line for untagged ports?
	var untaggedLocation = vlanBlock.indexOf('   untagged ');
	if (untaggedLocation != -1) {
		// Find the config line for "untagged"
		var untaggedVLANs = vlanBlock.substring(untaggedLocation + 12, vlanBlock.indexOf('\n', untaggedLocation));
		// are we using a variable for the untagged ports?
		if (untaggedVLANs.includes('%')) {
			// yes... grabbing the variable name
			untaggedVar = untaggedVLANs.replace(/%/g, '');
			usingVariables = true;
		} else if (document.getElementById('untaggedPorts').value) {
			// No... will need to modify the template directly - as not using variables for untagged ports for this vlan.
			console.log('no untagged variable in use - need to update template directly');
			var newUntaggedVLANs = document.getElementById('untaggedPorts').value;
			// replace the old untagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(' untagged ' + untaggedVLANs, ' untagged ' + newUntaggedVLANs);
		} else {
			// need to remove untagged ports config line
			var lineToRemove = vlanBlock.substring(untaggedLocation, vlanBlock.indexOf('\n', untaggedLocation) + 1);
			vlanBlock = vlanBlock.replace(lineToRemove, '');
		}
	} else if (document.getElementById('untaggedPorts').value) {
		// VLAN currently doesn't have a config for untagged ports and user wants to configure some
		// if tagged VLANs are configured for this port - place the config just before
		var taggedLocation = vlanBlock.indexOf('   tagged');
		if (taggedLocation == -1) {
			// else place it before the exit line
			taggedLocation = vlanBlock.indexOf('exit');
		}
		var vlanBlockStart = vlanBlock.substring(0, taggedLocation);
		var vlanBlockEnd = vlanBlock.substring(taggedLocation);
		// slide the untagged ports config line in the vlan block
		vlanBlock = vlanBlockStart + '   untagged ' + document.getElementById('untaggedPorts').value + '\n' + vlanBlockEnd;
	}

	// Process the Tagged Ports
	// Is there a config line for tagged ports?
	var taggedLocation = vlanBlock.indexOf('   tagged ');
	if (taggedLocation != -1) {
		// Find the config line for "tagged"
		var taggedVLANs = vlanBlock.substring(taggedLocation + 10, vlanBlock.indexOf('\n', taggedLocation));
		// are we using a variable for the tagged ports?
		if (taggedVLANs.includes('%')) {
			// yes... grabbing the variable name
			taggedVar = taggedVLANs.replace(/%/g, '');
			usingVariables = true;
		} else if (document.getElementById('taggedPorts').value) {
			// No... will need to modify the template directly - as not using variables for tagged ports for this vlan.
			console.log('no tagged variable in use - need to update template directly');
			var newTaggedVLANs = document.getElementById('taggedPorts').value;
			// replace the old tagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(' tagged ' + taggedVLANs, ' tagged ' + newTaggedVLANs);
		} else {
			// need to remove tagged ports config line
			var lineToRemove = vlanBlock.substring(taggedLocation, vlanBlock.indexOf('\n', taggedLocation));
			vlanBlock = vlanBlock.replace(lineToRemove, '');
		}
	} else if (document.getElementById('taggedPorts').value) {
		// VLAN currently doesn't have a config for tagged ports and user wants to configure some
		// put the config in the vlan block - just before the exit command
		if (taggedLocation == -1) {
			taggedLocation = vlanBlock.indexOf('exit');
		}
		var vlanBlockStart = vlanBlock.substring(0, taggedLocation);
		var vlanBlockEnd = vlanBlock.substring(taggedLocation);
		vlanBlock = vlanBlockStart + 'untagged ' + document.getElementById('untaggedPorts').value + '\n   ' + vlanBlockEnd;
	}

	/*console.log("Original: ");
	console.log(originalVLANBlock);
	console.log("Modified: ");
	console.log(vlanBlock);*/

	// Update the template - Name, IP Address, Tagged & Untagged (if required)
	if (originalVLANBlock !== vlanBlock) {
		switchTemplate = switchTemplate.replace(originalVLANBlock, vlanBlock);
		//console.log(switchTemplate);

		uploadCurrentTemplate();
	}

	// Modify the Variables file
	if (usingVariables) {
		var variables = {};
		if (untaggedVar) variables[untaggedVar] = document.getElementById('untaggedPorts').value;
		if (taggedVar) variables[taggedVar] = document.getElementById('taggedPorts').value;
		if (ipAddressVar && !subnetMaskVar) variables[ipAddressVar] = providedAddress; // single variable in use for ip and subnet
		if (ipAddressVar && subnetMaskVar) variables[ipAddressVar] = providedIP; // separate variables for subnet and ip
		if (subnetMaskVar && document.getElementById('vlanSubnetMask').value) variables[subnetMaskVar] = providedSubnet;
		//console.log(variables)

		// need to patch variables for switch
		uploadVariablesForCurrentSwitch(variables);
	}

	// refresh the VLAN table for the selected switch
	getSwitchDetails(currentSwitch);
	/*$.when(getVariablesForSingleDevice(currentSwitch)).then(function() {
		getVLANDetailsFromTemplate(currentSwitch);
	});*/
}

function uploadCurrentTemplate() {
	// Need to write back template to Central
	console.log('writing template ' + currentTemplate + ' in group ' + currentGroup);
	showNotification('ca-document-copy', 'Modifying template for device...', 'bottom', 'center', 'warning');

	//console.log(templateText)
	//console.log(btoa(templateText))
	var params = 'name=' + currentTemplate + '&device_type=' + currentTemplateType;
	var settingsPost = {
		url: getAPIURL() + '/tools/patchFormDataCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/groups/' + currentGroup + '/templates?' + params,
			access_token: localStorage.getItem('access_token'),
			template: switchTemplate,
		}),
	};

	$.ajax(settingsPost).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/groups/<GROUP>/templates)');
				return;
			}
		}
		$('#VLANModal').modal('hide');
		if (response.includes('Success')) {
			showNotification('ca-document-copy', 'Switch Template Updated', 'bottom', 'center', 'success');
			// Update table with modified vlan port data
		} else {
			showNotification('ca-document-copy', 'Switch Template Update Failed', 'bottom', 'center', 'error');
		}
	});
}

function uploadVariablesForCurrentSwitch(variables) {
	showNotification('ca-card-update', 'Updating Variables...', 'bottom', 'center', 'warning');

	// Add mandatory variables
	var switchVars = switchVariables[currentSwitch];
	variables['_sys_serial'] = switchVars['_sys_serial'];
	variables['_sys_lan_mac'] = switchVars['_sys_lan_mac'];

	// need to pull variables for switch
	var settings = {
		url: getAPIURL() + '/tools/patchCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSwitch + '/template_variables',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ total: Object.keys(variables).length, variables: variables }),
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
				return;
			}
		}
		$('#VLANModal').modal('hide');
		if (response.includes('Success')) {
			showNotification('ca-card-update', 'VLAN Variables Updated', 'bottom', 'center', 'success');
			// Update table with modified vlan port data
			// refresh the VLAN table for the selected switch
			$.when(getVariablesForSingleDevice(currentSwitch)).then(function() {
				getVLANDetailsFromTemplate(currentSwitch);
			});
		} else {
			showNotification('ca-card-update', 'VLAN Variables Update Failed', 'bottom', 'center', 'error');
		}
	});
}

function getTrunkForPort(portNumber) {
	// locate Trunk's in the switch template
	var trkLocation = 0;
	while (trkLocation != -1) {
		trkLocation = switchTemplate.indexOf('trunk ', trkLocation);
		if (trkLocation != -1) {
			// get trunk config line.
			var trunkConfig = switchTemplate.substring(trkLocation, switchTemplate.indexOf('\n', trkLocation));

			if (trunkConfig.includes(portNumber)) {
				var trunkArray = trunkConfig.split(' ');
				// [0] = trunk
				// [1] = ports
				// [2] = trk group
				// [3] = type (e.g. LACP or Trunk)
				return (trkGroup = trunkArray[2]);
			}

			trkLocation = switchTemplate.indexOf('trunk ', trkLocation + 1);
		}
	}
	return '';
}

function addVLAN() {
	// grab values from form
	var newID = document.getElementById('addVlanID').value;
	var newName = document.getElementById('addVlanName').value;
	var newIPAddress = document.getElementById('addVlanIPAddress').value;
	var newSubnet = document.getElementById('addVlanSubnetMask').value;
	var newTaggedPorts = document.getElementById('addTaggedPorts').value;
	var newUntaggedPorts = document.getElementById('addUntaggedPorts').value;

	// Process fields
	newName = newName.trim();
	newIPAddress = newIPAddress.trim();
	newSubnet = newSubnet.trim();
	newTaggedPorts = newTaggedPorts.trim();
	newUntaggedPorts = newUntaggedPorts.trim();

	// variables to be used
	var ipAddressVar = 'vlan' + newID + '.ip';
	var untaggedVar = 'vlan' + newID + '.untagged';
	var taggedVar = 'vlan' + newID + '.tagged';

	// Build if blocks
	var untaggedVariableBlock = '   %if ' + untaggedVar + '%\n   untagged %' + untaggedVar + '%\n   %endif%\n';
	var taggedVariableBlock = '   %if ' + taggedVar + '%\n   tagged %' + taggedVar + '%\n   %endif%\n';
	var ipVariableBlock = '   %if ' + ipAddressVar + '%\n   ip address %' + ipAddressVar + '%\n   %endif%\n';

	// Generate VLAN block...
	var vlanBlock = 'vlan ' + newID + '\n';
	if (newName) vlanBlock += '   name "' + newName + '"\n';
	vlanBlock += untaggedVariableBlock;
	vlanBlock += taggedVariableBlock;
	vlanBlock += ipVariableBlock;
	vlanBlock += '   exit\n';
	//console.log(vlanBlock);

	// Find correct location in template to place it.
	var vlanInsertion = false;
	var exitLocation = 0;
	var vlanLocation = switchTemplate.indexOf('\nvlan ');
	// Loop whilst there are more VLANs to process
	while (vlanLocation != -1) {
		var vlanID = '';
		exitLocation = switchTemplate.indexOf('exit\n', vlanLocation) + 5;
		configVLANBlock = switchTemplate.substring(vlanLocation + 1, exitLocation);

		// Process VLAN ID
		var idLocation = configVLANBlock.indexOf('vlan ');
		if (idLocation != -1) {
			// Find the config line for "vlan"
			vlanID = configVLANBlock.substring(idLocation + 5, configVLANBlock.indexOf('\n', idLocation)).trim();
		}

		if (parseInt(vlanID) > parseInt(newID)) {
			// current VLAN block should be placed before the the configBlock at "vlanLocation"
			// console.log("Place VLAN before this: "+ configVLANBlock)
			var templateBlockStart = switchTemplate.substring(0, vlanLocation + 1);
			var templateBlockEnd = switchTemplate.substring(vlanLocation + 1);
			switchTemplate = templateBlockStart + vlanBlock + templateBlockEnd;
			vlanInsertion = true;
			vlanLocation = -1;
		} else {
			// move to next vlan - if there is one...
			vlanLocation = switchTemplate.indexOf('\nvlan ', vlanLocation + 4);
		}
	}

	if (!vlanInsertion) {
		// need to insert VLAN after the last VLAN that exists in the config
		//console.log("inserting after final VLAN config block at location :" + exitLocation);
		var templateBlockStart = switchTemplate.substring(0, exitLocation);
		var templateBlockEnd = switchTemplate.substring(exitLocation);
		switchTemplate = templateBlockStart + vlanBlock + templateBlockEnd;
	}

	// Save the updated template
	uploadCurrentTemplate();

	// Update variables file for switch.
	var variables = {};
	if (newIPAddress.toLowerCase().includes('dhcp')) newIPAddress = 'dhcp-bootp';
	else if (newIPAddress) newIPAddress = newIPAddress + ' ' + newSubnet;
	variables[untaggedVar] = newUntaggedPorts;
	variables[taggedVar] = newTaggedPorts;
	variables[ipAddressVar] = newIPAddress;

	uploadVariablesForCurrentSwitch(variables);

	$('#VLANAddModal').modal('hide');
}

function getSystemDetailsFromTemplate(currentSerial) {
	// Generic variables to be used
	var dns1Var = 'dns1.ip';
	var dns2Var = 'dns2.ip';

	// grab the variables for switch and get value for variable name
	switchVars = switchVariables[currentSerial];

	// Go looking in the template for "ip dns server-address"
	var dns1Location = switchTemplate.indexOf('ip dns server-address priority 1 ');
	var dns1Block = '';
	var dns1Line = '';
	var useVariables = false;
	if (dns1Location != -1) {
		// grab the section where the value/variable would be
		dns1Line = switchTemplate.substring(dns1Location, switchTemplate.indexOf('\n', dns1Location) + 1);
		dns1Block = switchTemplate.substring(dns1Location + 33, switchTemplate.indexOf('\n', dns1Location) + 1);
		if (dns1Block.includes('%')) {
			// yes... grabbing the existing variable name
			dns1Var = dns1Block.replace(/%/g, '').trim();
			document.getElementById('dns1').value = switchVars[dns1Var];
			useVariables = true;
		} else {
			document.getElementById('dns1').value = dns1Block;
		}
	}
	var dns2Location = switchTemplate.indexOf('ip dns server-address priority 2 ');
	var dns2Block = '';
	var dns2Line = '';
	if (dns2Location != -1) {
		// grab the section where the value/variable would be
		dns2Line = switchTemplate.substring(dns2Location, switchTemplate.indexOf('\n', dns2Location) + 1);
		dns2Block = switchTemplate.substring(dns2Location + 33, switchTemplate.indexOf('\n', dns2Location) + 1);
		if (dns2Block.includes('%')) {
			// yes... grabbing the existing variable name
			dns2Var = dns2Block.replace(/%/g, '').trim();
			document.getElementById('dns2').value = switchVars[dns2Var];
			useVariables = true;
		} else {
			document.getElementById('dns2').value = dns2Block;
		}
	}
	document.getElementById('useVariablesCheckBox').checked = useVariables;
}

function saveSystemChanges() {
	// Check if using variables?
	var usingVariables = document.getElementById('useVariablesCheckBox').checked;

	// grab DNS servers from UI
	dnsServer1 = document.getElementById('dns1').value.trim();
	dnsServer2 = document.getElementById('dns2').value.trim();

	// Generic variables to be used
	var dns1Var = 'dns1.ip';
	var dns2Var = 'dns2.ip';

	// Go looking in the template for "ip dns server-address"
	var dns1Location = switchTemplate.indexOf('ip dns server-address priority 1 ');
	var dns1Block = '';
	var dns1Line = '';
	if (dns1Location != -1) {
		// grab the section where the value/variable would be
		dns1Line = switchTemplate.substring(dns1Location, switchTemplate.indexOf('\n', dns1Location) + 1);
		dns1Block = switchTemplate.substring(dns1Location + 33, switchTemplate.indexOf('\n', dns1Location) + 1);
		if (dns1Block.includes('%')) {
			// yes... grabbing the existing variable name
			dns1Var = dns1Block.replace(/%/g, '').trim();
		}
	}
	var dns2Location = switchTemplate.indexOf('ip dns server-address priority 2 ');
	var dns2Block = '';
	var dns2Line = '';
	if (dns2Location != -1) {
		// grab the section where the value/variable would be
		dns2Line = switchTemplate.substring(dns2Location, switchTemplate.indexOf('\n', dns2Location) + 1);
		dns2Block = switchTemplate.substring(dns2Location + 33, switchTemplate.indexOf('\n', dns2Location) + 1);
		if (dns2Block.includes('%')) {
			// yes... grabbing the existing variable name
			dns2Var = dns2Block.replace(/%/g, '').trim();
		}
	}

	// Build IF blocks
	var dns1UsingBlock = 'ip dns server-address priority 1 ' + dnsServer1 + '\n';
	var dns2UsingBlock = 'ip dns server-address priority 2 ' + dnsServer2 + '\n';
	var dns1VariableBlock = '%if ' + dns1Var + '%\nip dns server-address priority 1 %' + dns1Var + '%\n%endif%\n';
	var dns2VariableBlock = '%if ' + dns2Var + '%\nip dns server-address priority 2 %' + dns2Var + '%\n%endif%\n';
	if (usingVariables) {
		dns1UsingBlock = dns1VariableBlock;
		dns2UsingBlock = dns2VariableBlock;
	}

	// Find insert location
	var dnsInsertLocation = switchTemplate.indexOf('\ninterface');
	// place the DNS 1 config into the template
	if (dnsServer1) {
		console.log('checking template for: ' + dns1VariableBlock);
		if (switchTemplate.indexOf(dns1VariableBlock) == -1) {
			// "If" block is not in template
			if (dns1Line) {
				// replace the single line config
				switchTemplate = switchTemplate.replace(dns1Line, dns1UsingBlock);
			} else {
				// splice the config into the template
				switchTemplate = [switchTemplate.slice(0, dnsInsertLocation), dns1UsingBlock, switchTemplate.slice(dnsInsertLocation)].join('');
			}
		} else if (!usingVariables) {
			console.log('not using variables and if block found');
			// not using variables - but if block exists (replacing variable with hardcoded template)
			// need to replace the entire if block with the hardcoded line
			switchTemplate = switchTemplate.replace(dns1VariableBlock, dns1UsingBlock);
		}
	}

	// Update the DNS location
	dnsInsertLocation = switchTemplate.indexOf('\ninterface');
	// place the DNS 2 config into the template
	if (dnsServer2) {
		if (switchTemplate.indexOf(dns2VariableBlock) == -1) {
			// "If" block is not in template
			if (dns2Line) {
				// replace the single line config
				switchTemplate = switchTemplate.replace(dns2Line, dns2UsingBlock);
			} else {
				// splice the config into the template
				switchTemplate = [switchTemplate.slice(0, dnsInsertLocation), dns2UsingBlock, switchTemplate.slice(dnsInsertLocation)].join('');
			}
		} else if (!usingVariables) {
			// not using variables - but if block exists (replacing variable with hardcoded template)
			// need to replace the entire if block with the hardcoded line
			switchTemplate = switchTemplate.replace(dns2VariableBlock, dns2UsingBlock);
		}
	}

	// Upload the template back to Central
	uploadCurrentTemplate();

	// Update the variables for the switch...
	if (usingVariables) {
		var variables = {};
		variables[dns1Var] = dnsServer1;
		variables[dns2Var] = dnsServer2;

		//console.log(variables)

		// need to patch variables for switch
		uploadVariablesForCurrentSwitch(variables);
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadStackUI(stack_id, commanderSerial, stackName) {
	var commanderVariables = switchVariables[commanderSerial];
	document.getElementById('stackId').value = stack_id;
	document.getElementById('stackName').value = stackName;
	document.getElementById('stackCommander').value = commanderSerial;
	document.getElementById('stackVariables').value = JSON.stringify(commanderVariables, null, 4);

	$('#StackModalLink').trigger('click');
}

function loadSwitchesTable() {
	$('#template-switch-table')
		.DataTable()
		.rows()
		.remove();
	$('#vlan-table')
		.DataTable()
		.rows()
		.remove();
	var allSwitches = getSwitches();
	var allGroups = getGroups();
	$.each(allSwitches, function() {
		var templateSwitch = false;
		for (i = 0; i < allGroups.length; i++) {
			// Template Group and AOS-S only
			if (allGroups[i].group === this.group_name && allGroups[i]['template_details']['Wired'] && this.switch_type === 'AOS-S') templateSwitch = true;
		}
		if (templateSwitch) {
			var device = this;
			// is a template switch
			if (device['status'] != 'Up') downSwitchCount++;
			var status = '<i class="fa fa-circle text-danger"></i>';
			if (device['status'] == 'Up') {
				status = '<i class="fa fa-circle text-success"></i>';
			}

			var checkBtn = '<button class="btn btn-round btn-sm btn-info" onclick="checkTemplateVariable(\'' + device['serial'] + '\')">Verify</button>';

			// Add row to table
			var table = $('#template-switch-table').DataTable();
			table.row.add(['<strong>' + device['name'] + '</strong>', status, device['ip_address'], device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], checkBtn]);
		}
	});
	$('#template-switch-table')
		.DataTable()
		.rows()
		.draw();
	$('#vlan-table')
		.DataTable()
		.rows()
		.draw();
}

function loadVerifyUI(missingVariables, extraVariables, switchSerial) {
	document.getElementById('switchSerial').value = switchSerial;
	document.getElementById('missingText').value = missingVariables.join('\n');
	document.getElementById('extraText').value = extraVariables.join('\n');

	$('#VerifyModalLink').trigger('click');
}

function loadVLANUI(vlanID, row) {
	currentVLANRow = row;

	var foundVLAN = null;
	for (i = 0; i < switchVLANs.length; i++) {
		if (switchVLANs[i].id == vlanID) {
			foundVLAN = switchVLANs[i];
		}
	}

	document.getElementById('vlanID').value = foundVLAN.id;
	document.getElementById('vlanName').value = foundVLAN.name;
	document.getElementById('vlanIPAddress').value = foundVLAN.ipaddress;
	document.getElementById('vlanSubnetMask').value = foundVLAN.subnetMask;
	document.getElementById('untaggedPorts').value = foundVLAN.untagged_ports;
	document.getElementById('taggedPorts').value = foundVLAN.tagged_ports;

	$('#VLANModalLink').trigger('click');
}

function loadNewVLANUI() {
	var defaultTaggedUplinks = '';
	selectedSwitch = findDeviceInMonitoring(currentSwitch);

	if (selectedSwitch.uplink_ports.length > 1) {
		defaultTaggedUplinks = getTrunkForPort(selectedSwitch.uplink_ports[0].port);
	} else if (selectedSwitch.uplink_ports.length == 1) {
		defaultTaggedUplinks = selectedSwitch.uplink_ports[0].port;
	}

	document.getElementById('addVlanID').value = '';
	document.getElementById('addVlanName').value = '';
	document.getElementById('addVlanIPAddress').value = '';
	document.getElementById('addVlanSubnetMask').value = '';
	document.getElementById('addUntaggedPorts').value = '';
	document.getElementById('addTaggedPorts').value = defaultTaggedUplinks;

	$('#VLANAddModalLink').trigger('click');
}

function loadCurrentPageGroup() {
	// override on visible page - used as a notification
	groupsLoaded = true;
	if (groupsLoaded && switchesLoaded) loadSwitchesTable();
}

function loadCurrentPageSwitch() {
	// override on visible page - used as a notification
	switchesLoaded = true;
	if (groupsLoaded && switchesLoaded) loadSwitchesTable();
}

function saveVLANChanges() {
	ipAddress = document.getElementById('vlanIPAddress').value.trim();
	subnetMask = document.getElementById('vlanSubnetMask').value.trim();
	if (ipAddress && !subnetMask) {
		document.getElementById('vlanSubnetMask').style.borderColor = 'red';
		document.getElementById('vlanSubnetMask').focus();
		document.getElementById('vlanSubnetMask').select();
	} else {
		document.getElementById('vlanSubnetMask').style.borderColor = '#E3E3E3';
		processVLANChanges(document.getElementById('vlanID').value);
	}
}

function checkForUniqueness() {
	if (!document.getElementById('addVlanID').value) return false;
	var foundVLAN = false;
	for (i = 0; i < switchVLANs.length; i++) {
		if (switchVLANs[i].id == document.getElementById('addVlanID').value) {
			foundVLAN = true;
			break;
		}
	}
	if (foundVLAN) {
		document.getElementById('addVlanID').style.borderColor = 'red';
		document.getElementById('addVLANBtn').disabled = true;
		return false;
	} else {
		document.getElementById('addVlanID').style.borderColor = '#E3E3E3';
		document.getElementById('addVLANBtn').disabled = false;
		return true;
	}
}

function checkIPAddress(caller) {
	var ipAddress = caller.value;
	if (ipAddress) {
		var regEx = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
		if (ipAddress.match(regEx)) {
			caller.style.borderColor = '#E3E3E3';
			return true;
		} else if (ipAddress === 'dhcp' || ipAddress === 'dhcp-bootp') {
			caller.style.borderColor = '#E3E3E3';
			return true;
		}
		caller.style.borderColor = 'red';
		return false;
	} else {
		caller.style.borderColor = '#E3E3E3';
		return true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Sync Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function syncVariables() {
	var commanderVariables = switchVariables[document.getElementById('stackCommander').value];
	var currentStackId = document.getElementById('stackId').value;
	variableCounter = 0;
	$.each(stackSwitches[currentStackId], function() {
		var currentSerial = this.serial;
		if (currentSerial !== document.getElementById('stackCommander').value) {
			// merge the other device serial and mac into the commander variables
			var newVariables = commanderVariables;
			newVariables['_sys_serial'] = currentSerial;
			newVariables['_sys_lan_mac'] = this.macaddr;

			// Push the variables to Central for the member switch
			var settingsPost = {
				url: getAPIURL() + '/tools/patchCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ variables: newVariables }),
				}),
			};

			$.ajax(settingsPost).done(function(response) {
				variableCounter++;
				if (response !== 'Success') {
					logError(response.description);
					errorCounter++;
				}
				checkIfVariablesComplete(currentStackId);
			});
		}
	});
}

function checkIfVariablesComplete(stack_id) {
	if (variableCounter == stackSwitches[stack_id].length - 1) {
		if (errorCounter != 0) {
			showLog();
			Swal.fire({
				title: 'Syncing Failure',
				text: 'Some or all member switch variables failed to be synced',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Syncing Success',
				text: 'All stack member switch variables were synced with the Commander',
				icon: 'success',
			});
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Variable vs Template Check Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkTemplateVariable(currentSerial) {
	var allSwitches = getSwitches();
	var currentVariables = switchVariables[currentSerial];

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/template?device_serials=' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/devices/template)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var data = response.data;
		var currentGroup = data[currentSerial]['group_name'];
		var currentTemplate = data[currentSerial]['template_name'];
		//console.log(currentTemplate);

		showNotification('ca-document-copy', 'Getting template for device...', 'bottom', 'center', 'info');

		var settings = {
			url: getAPIURL() + '/tools/getCommandwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/groups/' + currentGroup + '/templates/' + currentTemplate,
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(response) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/groups/<GROUP>/templates)');
					return;
				}
			}
			if (response.error_code) {
				if (response.description.includes('not found as a Template group')) {
					Swal.fire({
						title: 'No Template',
						text: 'This switch (' + currentSerial + ') is no longer in a Template group',
						icon: 'warning',
					});
				} else {
					Swal.fire({
						title: 'Template Failure',
						text: response.description,
						icon: 'error',
					});
				}
			} else if (response.responseBody) {
				var templateVariables = findVariablesInTemplate(response.responseBody);
				var currentVariableKeys = Object.keys(currentVariables);
				var missingVariables = [];
				var extraVariables = [];
				$.each(templateVariables, function() {
					if (!currentVariableKeys.includes(String(this))) missingVariables.push(String(this));
				});
				$.each(currentVariableKeys, function() {
					var stringKey = String(this);
					if (!templateVariables.includes(stringKey) && stringKey !== '_sys_serial' && stringKey !== '_sys_lan_mac') extraVariables.push(String(this));
				});

				loadVerifyUI(missingVariables, extraVariables, currentSerial);
			}
		});
	});
}

function findVariablesInTemplate(template) {
	var matches = template.match('(?:%).+?(?=%)/g');
	var variables = [];
	$.each(matches, function() {
		var possibleVariable = String(this);
		if (!possibleVariable.includes('else') && !possibleVariable.includes('endif') && possibleVariable !== ' ') {
			if (possibleVariable.includes('if ')) possibleVariable = possibleVariable.replace('if ', '');
			if (possibleVariable.includes('=')) possibleVariable = possibleVariable.substr(0, possibleVariable.indexOf('='));
			possibleVariable = possibleVariable.trim();
			if (!variables.includes(possibleVariable)) variables.push(possibleVariable);
		}
	});
	return variables;
}
