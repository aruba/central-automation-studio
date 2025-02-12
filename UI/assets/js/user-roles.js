/*
Central Automation v1.2
Updated: 1.8.2
Aaron Scott (WiFi Downunder) 2021-2025
*/

var configGroups = [];
var groupConfigs = {};
var userRoles = [];

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var groupTotal = 0;
var userRolePrefix = 'wlan access-rule ';

var groupConfigNotification;

const RoleAction = { Update: 0, Delete: 1}

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
		Repeating function
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getUserRoles() {
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			groupConfigNotification = showProgressNotification('ca-folder-settings', 'Getting Group Configs...', 'bottom', 'center', 'info');
			$.when(getGroupData(0)).then(function() {
				// Clearing old data
				$('#role-table')
					.DataTable()
					.clear();
				configGroups = getGroups();
				groupCounter = 0;
				groupConfigs = {};
				userRoles = [];
	
				// Grab config for each Group in Central (slowed down to not hit api rate limit)
				for(var i=0;i<configGroups.length;i++) {
					setTimeout(retrieveGroupConfig, apiDelay*i, configGroups[i].group, false);
				}
			});
		}
	});
	$('[data-toggle="tooltip"]').tooltip();
}

function checkGroupConfigCompelete() {
	
	var groupProgress = (groupCounter / configGroups.length) * 100;
	groupConfigNotification.update({ progress: groupProgress });
	
	if (groupCounter == configGroups.length) {
		// Build table of user roles
		var table = $('#role-table').DataTable();
		for (i = 0; i < userRoles.length; i++) {
			// Add row to table
			table.row.add([i, userRoles[i]['name'], userRoles[i]['groups'].join(', ')]);
		}
		$('#role-table')
			.DataTable()
			.rows()
			.draw();
	
		if (groupConfigNotification) {
			groupConfigNotification.update({ message: 'Retrieved Group WLAN Configs...', type: 'success' });
			setTimeout(groupConfigNotification.close, 1000);
		}
		console.log(groupConfigs)
	}
}

function retrieveGroupConfig(currentGroup, singleGroup) {
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
	
	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
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
	
		// If the response is a config array - else not an AP group
		if (Array.isArray(response)) {
			// save the group config for modifications
			groupConfigs[currentGroup] = response;
		
			// pull the roles out of each group config
			getUserRolesFromConfig(response, currentGroup);
		}
		groupCounter++;
		if (!singleGroup) checkGroupConfigCompelete();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Role Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

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
		UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadUserRoleUI(roleIndex) {
	var userRole = userRoles[roleIndex];
	document.getElementById('roleName').value = userRole.name;
	document.getElementById('roleRules').value = userRole.acls.join('\n');

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
		$.each(userRole.groups, function(idx, val) {
			$("select option[value='" + val + "']").prop('selected', true);
		});
	});
	$('.selectpicker').selectpicker('refresh');
	
	checkSelectionCount();
	$('#RoleModalLink').trigger('click');
}

function checkSelectionCount() {
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);
	if (selectedGroups.length == 0) {
		document.getElementById('saveRoleBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = false;
	} else if (selectedGroups.length == configGroups.length) {
		document.getElementById('saveRoleBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = true;
	} else {
		document.getElementById('saveRoleBtn').disabled = false;
		document.getElementById('selectAllGroups').checked = false;
	}
}

function selectAll() {
	$.each(configGroups, function(idx, val) {
		$("select option[value='" + val[0] + "']").prop('selected', document.getElementById('selectAllGroups').checked);
	});
	$('.selectpicker').selectpicker('refresh');

	if (document.getElementById('selectAllGroups').checked) {
		document.getElementById('saveRoleBtn').disabled = false;
	} else {
		document.getElementById('saveRoleBtn').disabled = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Role Creation/Modification Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function createRole() {
	document.getElementById('roleName').value = '';
	document.getElementById('roleRules').value = 'rule any any match any any any permit';

	// load selectPicker with Groups
	select = document.getElementById('groupselector');
	select.options.length = 0;
	$.each(configGroups, function() {
		var currentGroup = this.group;
		$('#groupselector').append($('<option>', { value: currentGroup, text: currentGroup }));
		if ($('.selectpicker').length != 0) {
			$('.selectpicker').selectpicker('refresh');
		}
	});

	$('#RoleModalLink').trigger('click');
}

function checkForDuplicateRoleName(newName) {
	var duplicate = false;
	$.each(userRoles, function() {
		if (newName === this['name']) {
			duplicate = true;
			return false;
		}
	});
	return duplicate;
}

// Unused code - needs to be removed.
/*function saveRole() {
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get role name
	var newRoleName = document.getElementById('roleName').value;

	var newACLs = document.getElementById('roleRules').value;
	var newACLArray = [];
	var tempACLArray = newACLs.split('\n');
	// Add indent to the acls
	for (i = 0; i < tempACLArray.length; i++) {
		newACLArray.push('  ' + tempACLArray[i]);
	}

	// get selected Groups
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);

	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group WLAN Configs...', 'bottom', 'center', 'info');
	$.each(selectedGroups, function() {
		var currentConfig = groupConfigs[this];
		if (config.length) {
				
		}
		var currentGroup = this;

		// Find if there is an existing user role
		var startIndex = -1;
		var endIndex = -1;
		var firstUserRoleLocation = -1;

		var lineToFind = userRolePrefix + newRoleName;
		for (i = 0; i < currentConfig.length; i++) {
			if (currentConfig[i].includes(userRolePrefix) && firstUserRoleLocation == -1) {
				// grab the location of the first user role - in case the role we are looking for isnt in the config
				firstUserRoleLocation = i;
			}
			if (currentConfig[i] === lineToFind) {
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
				endIndex = i;
			}
		}

		if (startIndex == -1) {
			// no existing user role. Find the first user role and place this role before it.
			startIndex = firstUserRoleLocation;
		} else {
			// remove the existing role from the config
			currentConfig.splice(startIndex, endIndex - startIndex);
		}

		// build new role
		var newRole = [];
		newRole.push(userRolePrefix + newRoleName);
		newRole.push(...newACLArray);

		// Splice the new role into the config
		if (currentConfig.length) {
			currentConfig.splice(startIndex, 0, ...newRole);
		} else {
			currentConfig = newRole;
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
				logError('User role was not applied to group ' + currentGroup);
				errorCounter++;
			}
			if (updateCounter == selectedGroups.length) {
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'User Role Deployment',
						text: 'The User Role failed to be deployed to some or all of the selected Groups',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'User Role Deployment',
						text: 'User Role was deployed to all selected Groups',
						icon: 'success',
					});
				}
			}
		});
	});
}*/

function checkRoleUpdateComplete(action) {
	if (updateCounter >= groupTotal) {
		if (errorCounter != 0) {
			showLog();
			Swal.fire({
				title: 'User Role Deployment',
				text: (action == RoleAction.Update) ? 'The User Role failed to be deployed to some or all of the selected Groups' : 'The User Role failed to be removed to some or all of the selected Groups',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'User Role Deployment',
				text: (action == RoleAction.Update) ? 'User Role was deployed to all selected Groups' : 'User Role was removed to all selected Groups',
				icon: 'success',
			});
			getUserRoles();
		}
	}
}

function updateRole(action) {
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get role name
	var newRoleName = document.getElementById('roleName').value;

	// If we are going to be adding the role - then prep the ACLs with the required formatting
	if (action == RoleAction.Update) {
		var newACLs = document.getElementById('roleRules').value;
		var newACLArray = [];
		var tempACLArray = newACLs.split('\n');
		// Add indent to the acls
		for (i = 0; i < tempACLArray.length; i++) {
			newACLArray.push('  ' + tempACLArray[i]);
		}
	}

	// get selected Groups
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);
	groupTotal = selectedGroups.length;
	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group WLAN Configs...', 'bottom', 'center', 'info');
	$.each(selectedGroups, function() {
		var currentGroup = this;
		var currentConfig = groupConfigs[currentGroup];
		if (currentConfig && currentConfig.length && currentConfig.length > 0) {
			// The config was successfully retrieved from Central earlier (on page load)
			updateConfig(currentGroup, newRoleName, newACLArray, action);
		} else {
			// Need to grab the config because the config failed to be retrieved on page load
			$.when(retrieveGroupConfig(this)).then(function() {
				var currentConfig = groupConfigs[currentGroup];
				if (currentConfig && currentConfig.length && currentConfig.length > 0) updateConfig(currentGroup, newRoleName, newACLArray, action);
				else {
					// If extra attempt to retrieve config fails - bail on that group and log it
					updateCounter++;
					errorCounter++;
					logError('Failed to retrieve config for group: ' + currentGroup);
					checkRoleUpdateComplete(action);
				}
			});
		}
	});
}

function updateConfig(groupName, newRoleName, newACLArray, action) {
	var currentConfig = groupConfigs[groupName];
	var currentGroup = groupName;
	
	// Find if there is an existing user role
	var startIndex = -1;
	var endIndex = -1;
	var firstUserRoleLocation = -1;
	
	var lineToFind = userRolePrefix + newRoleName;
	for (i = 0; i < currentConfig.length; i++) {
		if (currentConfig[i].includes(userRolePrefix) && firstUserRoleLocation == -1) {
			// grab the location of the first user role - in case the role we are looking for isnt in the config
			firstUserRoleLocation = i;
		}
		if (currentConfig[i] === lineToFind) {
			startIndex = i;
		} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
			endIndex = i;
		}
	}
	
	if (startIndex == -1) {
		// no existing user role. Find the first user role and place this role before it.
		startIndex = firstUserRoleLocation;
	} else {
		// remove the existing role from the config
		currentConfig.splice(startIndex, endIndex - startIndex);
	}
	
	// If the desired result is to add the new/updated role into the config for this group
	if (action == RoleAction.Update) {
		// build new role
		var newRole = [];
		newRole.push(userRolePrefix + newRoleName);
		newRole.push(...newACLArray);
	
		// Splice the new role into the config
		if (currentConfig.length) {
			currentConfig.splice(startIndex, 0, ...newRole);
		} else {
			currentConfig = newRole;
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
			logError('User role change was not applied to group: ' + currentGroup);
			errorCounter++;
		} else {
			logInformation('Change to user role "'+newRoleName+'" was applied to group: ' + currentGroup)
		}
		
		checkRoleUpdateComplete(action);
	});
}
