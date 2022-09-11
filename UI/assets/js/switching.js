/*
Central Automation v1.3
Updated: 1.8.2
Aaron Scott (WiFi Downunder) 2022
*/

var stacks = [];
var stacksPromise;
var stackSwitches = {};
var switchVariables = {};

var updateCounter = 0;
var errorCounter = 0;
var variableCounter = 0;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Repeating function
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getSwitchStacks() {
	$.when(tokenRefresh()).then(function() {
		stacksPromise = new $.Deferred();
		$('#stacks-table')
			.DataTable()
			.clear();
		stackCounter = 0;
		stacks = [];
		stackSwitches = {};
		switchVariables = {};
		showNotification('ca-document-copy', 'Getting Switch variables...', 'bottom', 'center', 'info');
		getVariablesForAllDevices(0);
		showNotification('ca-server-rack', 'Getting Switch Stacks...', 'bottom', 'center', 'info');
		$.when(getStacks(0)).then(function() {
			showNotification('ca-server-rack', 'Downloaded Switch Stack Information', 'bottom', 'center', 'success');

			// loop through each stack and get details for each switch in the the stack
			showNotification('ca-server-rack', 'Getting Switch Details...', 'bottom', 'center', 'info');
			$.each(stacks, function() {
				getStackSwitches(this.id, this.name);
			});
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Stack Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getStacks(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v1/switch_stacks)');
				return;
			}
		}
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded')
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
		} else {
			stacks = stacks.concat(response.stacks);
			if (offset + apiLimit <= response.total) getStacks(offset + apiLimit);
			else {
				stacksPromise.resolve();
			}
		}
	});
	return stacksPromise.promise();
}

function getStackSwitches(stack_id, stackName) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v1/switches)');
				return;
			}
		}
		stackSwitches[stack_id] = response.switches;
		var switchCounter = 0;
		var stackCommander = '';
		var stackMembers = '';
		$.each(response.switches, function() {
			var currentSerial = this.serial;
			var settings = {
				url: getAPIURL() + '/tools/getCommand',
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

			$.ajax(settings).done(function(response) {
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
					if (stackCounter === stacks.length) showNotification('ca-server-rack', 'Downloaded Switch Details', 'bottom', 'center', 'success');
				}
			});
		});
	});
}

function getVariablesForAllDevices(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/template_variables)');
				return;
			}
		}
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded')
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
		} else {
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
		}
	});
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
	var allSwitches = getSwitches();
	var allGroups = getGroups();
	$.each(allSwitches, function() {
		var templateSwitch = false;
		for (i = 0; i < allGroups.length; i++) {
			if (allGroups[i].group === this.group_name && allGroups[i]['template_details']['Wired']) templateSwitch = true;
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
			table.row.add(['<strong>' + device['name'] + '</strong>', status, device['ip_address'], device['model'], device['serial'], device['site'], device['group_name'], device['macaddr'], checkBtn]);
		}
	});
	$('#template-switch-table')
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
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
						return;
					}
				}
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
		url: getAPIURL() + '/tools/getCommand',
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

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/template)');
				return;
			}
		}
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded')
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
		} else {
			var data = response.data;
			var currentGroup = data[currentSerial]['group_name'];
			var currentTemplate = data[currentSerial]['template_name'];

			showNotification('ca-document-copy', 'Getting template for device...', 'bottom', 'center', 'info');

			var settings = {
				url: getAPIURL() + '/tools/getCommand',
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
				} else if (response.resultBody) {
					var templateVariables = findVariablesInTemplate(response.resultBody);
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
		}
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
