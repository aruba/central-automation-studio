/*
Central Automation v1.3
Updated: 1.8.2
Copyright Aaron Scott (WiFi Downunder) 2021-2024
*/

var configGroups = [];
var groupConfigs = {};
var authServers = [];

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var authServerPrefix = 'wlan auth-server ';

var groupConfigNotification;

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

function getAuthServers() {
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			groupConfigNotification = showProgressNotification('ca-folder-settings', 'Getting Group Configs...', 'bottom', 'center', 'info');
			$.when(getGroupData(0)).then(function() {
				// Clearing old data
				$('#server-table')
					.DataTable()
					.clear();
				configGroups = getGroups();
				groupCounter = 0;
				groupConfigs = {};
				authServers = [];
	
				// Grab config for each Group in Central - need to add in API call delay to not hit api/sec limit
				for(var i=0;i<configGroups.length;i++) {
					setTimeout(getConfigForGroup, apiDelay*i, configGroups[i].group);
				}
			});
		}
	});
}

function getConfigForGroup(currentGroup) {
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
			// save the group config for modifications
			groupConfigs[currentGroup] = response;
			
			// pull the auth server out of each group config
			getAuthServersFromConfig(response, currentGroup);
		}

		groupCounter++;
		
		var groupProgress = (groupCounter / configGroups.length) * 100;
		groupConfigNotification.update({ progress: groupProgress });
		
		if (groupCounter == configGroups.length) {
			// Build table of servers
			var table = $('#server-table').DataTable();
			for (i = 0; i < authServers.length; i++) {
				// Add row to table
				table.row.add([i, authServers[i]['name'], authServers[i]['groups'].join(', ')]);
			}
			$('#server-table')
				.DataTable()
				.rows()
				.draw();
	
			if (groupConfigNotification) {
				groupConfigNotification.update({ message: 'Retrieved Group Configs...', type: 'success' });
				setTimeout(groupConfigNotification.close, 1000);
			}
		}
		$('[data-toggle="tooltip"]').tooltip();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Role Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getAuthServersFromConfig(config, group) {
	// Find the existing servers
	var startIndex = -1;
	var endIndex = -1;
	var serverName = '';

	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the server
			if (currentLine.includes(authServerPrefix) && startIndex == -1) {
				// pull out the server name.
				serverName = currentLine.replace(authServerPrefix, '');
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current server
				endIndex = i;
			}

			if (endIndex != -1 && startIndex != -1) {
				// Found the start and end of a server
				// Build the Configs from the config.
				// No need to keep the first line - since we already have the serverName, the first line can be rebuilt.
				var fullConfigs = config.slice(startIndex + 1, endIndex);

				var finalConfigs = [];
				// Remove the "index #" line and "utf8"
				$.each(fullConfigs, function() {
					if (!this.includes('utf8') && !this.includes('index ')) finalConfigs.push(this.trim());
				});

				// Check if we have already found the exact same server in another group
				var existingRoleMatch = false;
				$.each(authServers, function() {
					if (this['name'] === serverName) {
						// Role with this name exists - now check if the rules are the same.
						if (this['config'].equals(finalConfigs)) {
							// exactly the same Configs for the same server name. add group name to record.
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
					authServers.push({ name: serverName, config: finalConfigs, groups: groupList });
				}
				//console.log(authServers);

				// Is the current line another Authentication Server?
				if (currentLine.includes(authServerPrefix)) {
					serverName = currentLine.replace(authServerPrefix, '');
					startIndex = i;
					endIndex = -1;
				} else {
					// Not another server - rest of the config shouldn't contain any servers so break out of loop
					break;
				}
			}
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadServerUI(serverIndex) {
	var server = authServers[serverIndex];
	document.getElementById('serverName').value = server.name;
	document.getElementById('serverConfig').value = server.config.join('\n');

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
		$.each(server.groups, function(idx, val) {
			$("select option[value='" + val + "']").prop('selected', true);
		});
	});
	$('.selectpicker').selectpicker('refresh');
	
	checkSelectionCount();
	$('#ServerModalLink').trigger('click');
}

function checkSelectionCount() {
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);
	if (selectedGroups.length == 0) {
		document.getElementById('saveServerBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = false;
	} else if (selectedGroups.length == configGroups.length) {
		document.getElementById('saveServerBtn').disabled = true;
		document.getElementById('selectAllGroups').checked = true;
	} else {
		document.getElementById('saveServerBtn').disabled = false;
		document.getElementById('selectAllGroups').checked = false;
	}
}

function selectAll() {
	$.each(configGroups, function(idx, val) {
		$("select option[value='" + val[0] + "']").prop('selected', document.getElementById('selectAllGroups').checked);
	});
	$('.selectpicker').selectpicker('refresh');

	if (document.getElementById('selectAllGroups').checked) {
		document.getElementById('saveServerBtn').disabled = false;
	} else {
		document.getElementById('saveServerBtn').disabled = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Server Creation/Modification Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function createServer() {
	document.getElementById('serverName').value = '';
	document.getElementById('serverConfig').value = 'ip x.x.x.x\nkey ********\nport 1812\nacctport 1813\nrfc3576\ncppm-rfc3576-port 5999';

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

	$('#ServerModalLink').trigger('click');
}

function checkForDuplicateServerName(newName) {
	var duplicate = false;
	$.each(authServers, function() {
		if (newName === this['name']) {
			duplicate = true;
			return false;
		}
	});
	return duplicate;
}

function saveServer() {
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get server name
	var newServerName = document.getElementById('serverName').value;

	var newConfigs = document.getElementById('serverConfig').value;
	if (newConfigs.includes('********')) {
		document.getElementById('passwordWarning').hidden = false;
		return;
	} else {
		$('#ServerModal').modal('hide');
	}
	var newConfigArray = [];
	var tempConfigArray = newConfigs.split('\n');
	// Add indent to the config
	for (i = 0; i < tempConfigArray.length; i++) {
		newConfigArray.push('  ' + tempConfigArray[i]);
	}

	// get selected Groups
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);

	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group Configs...', 'bottom', 'center', 'info');
	$.each(selectedGroups, function() {
		var currentConfig = groupConfigs[this];
		var currentGroup = this;

		// Find if there is an existing server
		var startIndex = -1;
		var endIndex = -1;
		var firstServerLocation = -1;

		var lineToFind = authServerPrefix + newServerName;
		for (i = 0; i < currentConfig.length; i++) {
			if (currentConfig[i].includes(authServerPrefix) && firstServerLocation == -1) {
				// grab the location of the first server - in case the server we are looking for isnt in the config
				firstServerLocation = i;
			}
			if (currentConfig[i] === lineToFind) {
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
				endIndex = i;
			}
		}

		if (startIndex == -1) {
			// no existing server. Find the first server and place this server before it.
			startIndex = firstServerLocation;
		} else {
			// remove the existing server from the config
			currentConfig.splice(startIndex, endIndex - startIndex);
		}

		// build new server
		var newServer = [];
		newServer.push(authServerPrefix + newServerName);
		newServer.push(...newConfigArray);

		// Splice the new server into the config
		if (currentConfig.length) {
			currentConfig.splice(startIndex, 0, ...newServer);
		} else {
			currentConfig = newServer;
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
			updateCounter++;
			if (response.reason && response.reason == 'Bad Gateway') {
				Swal.fire({
					title: 'API Issue',
					text: 'There is an issue communicating with the API Gateway',
					icon: 'warning',
				});
			} else if (response.code && response.code == 429) {
				console.log('errorCode');
				logError('Authentication Server was not applied to group ' + currentGroup);
				Swal.fire({
					title: 'API Limit Reached',
					text: 'You have reached your daily API limit. No more API calls will succeed today.',
					icon: 'warning',
				});
			} else if (response.description) {
				logError(response.description);
				errorCounter++;
			} else if (response !== '' + currentGroup) {
				logError('Authentication Server was not applied to group ' + currentGroup);
				errorCounter++;
			}
			if (updateCounter == selectedGroups.length) {
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'Authentication Server Deployment',
						text: 'The Authentication Server failed to be deployed to some or all of the selected Groups',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Authentication Server Deployment',
						text: 'Authentication Server was deployed to all selected Groups',
						icon: 'success',
					});
					getAuthServers();
				}
			}
		});
	});
}

function updateServer(addingServer) {
	updateCounter = 0;
	errorCounter = 0;
	clearErrorLog();

	// get server name
	var newServerName = document.getElementById('serverName').value;
	if (document.getElementById('serverConfig').value.includes('********')) {
		document.getElementById('passwordWarning').hidden = false;
		return;
	} else {
		$('#ServerModal').modal('hide');
	}

	// If we are going to be adding the server - then prep the Configs with the required formatting
	if (addingServer) {
		var newConfigs = document.getElementById('serverConfig').value;
		var newConfigArray = [];
		var tempConfigArray = newConfigs.split('\n');
		// Add indent to the config
		for (i = 0; i < tempConfigArray.length; i++) {
			newConfigArray.push('  ' + tempConfigArray[i]);
		}
	}

	// get selected Groups
	var select = document.getElementById('groupselector');
	var selectedGroups = [...select.selectedOptions].map(option => option.value);

	// Loop through the groups and grab the stored config
	showNotification('ca-folder-settings', 'Updating Group Configs...', 'bottom', 'center', 'info');
	$.each(selectedGroups, function() {
		var currentConfig = groupConfigs[this];
		var currentGroup = this;

		// Find if there is an existing server
		var startIndex = -1;
		var endIndex = -1;
		var firstServerLocation = -1;

		var lineToFind = authServerPrefix + newServerName;
		for (i = 0; i < currentConfig.length; i++) {
			if (currentConfig[i].includes(authServerPrefix) && firstServerLocation == -1) {
				// grab the location of the first server - in case the server we are looking for isnt in the config
				firstServerLocation = i;
			}
			if (currentConfig[i] === lineToFind) {
				startIndex = i;
			} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
				endIndex = i;
			}
		}

		if (startIndex == -1) {
			// no existing server. Find the first server and place this server before it.
			startIndex = firstServerLocation;
		} else {
			// remove the existing server from the config
			currentConfig.splice(startIndex, endIndex - startIndex);
		}

		// If the desired result is to add the new/updated server into the config for this group
		if (addingServer) {
			// build new server
			var newServer = [];
			newServer.push(authServerPrefix + newServerName);
			newServer.push(...newConfigArray);

			// Splice the new server into the config
			if (currentConfig.length) {
				currentConfig.splice(startIndex, 0, ...newServer);
			} else {
				currentConfig = newServer;
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
			updateCounter++;
			if (response.reason && response.reason == 'Bad Gateway') {
				Swal.fire({
					title: 'API Issue',
					text: 'There is an issue communicating with the API Gateway',
					icon: 'warning',
				});
			} else if (response.code && response.code == 429) {
				console.log('errorCode');
				logError('Authentication Server was not applied to group ' + currentGroup);
				Swal.fire({
					title: 'API Limit Reached',
					text: 'You have reached your daily API limit. No more API calls will succeed today.',
					icon: 'warning',
				});
			} else if (response.description) {
				logError(response.description);
				errorCounter++;
			} else if (response !== '' + currentGroup) {
				logError('Authentication Server change was not applied to group ' + currentGroup);
				errorCounter++;
			}
			if (updateCounter == selectedGroups.length) {
				if (errorCounter != 0) {
					showLog();
					Swal.fire({
						title: 'Authentication Server Deployment',
						text: addingServer ? 'The Authentication Server failed to be deployed to some or all of the selected Groups' : 'The Authentication Server failed to be removed to some or all of the selected Groups',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Authentication Server Deployment',
						text: addingServer ? 'Authentication Server was deployed to all selected Groups' : 'Authentication Server was removed to all selected Groups',
						icon: 'success',
					});
					getAuthServers();
				}
			}
		});
	});
}
