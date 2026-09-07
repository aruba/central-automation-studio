/*
Central Automation v1.40
Updated: 1.40
Aaron Scott (WiFi Downunder) 2021-2025
*/

var variables = {};
var currentSerial;

var deleteCounter = 0;
var errorCounter = 0;

var variableNotification;

var library = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template Variables Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getDeviceVariables() {
	switchVariables = {};
	variableNotification = showPermanentNotification('ca-document-copy', 'Getting device variables...', 'bottom', 'center', 'info');
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

		variables = Object.assign({}, variables, response);
		
		variableTotal = Object.keys(variablesText).length;
		if (Object.keys(variablesText).length == apiGroupLimit) {
			// not an empty result - there might be more to get
			if (variableNotification) {
				variableNotification.update({ message: 'Getting device variables...'+Object.keys(variables).length, type: 'success' });
			}
			getVariablesForAllDevices(offset + apiGroupLimit);
			
		} else {
			if (variableNotification) {
				variableNotification.update({ message: 'All variables have been downloaded', type: 'success' });
				setTimeout(variableNotification.close, 1000);
			}
			//load table
			processVariables();
		}
	});
}

function processVariables() {
	let variableTokens = [];
	
	$.each(Object.keys(variables), function () {
		var deviceVariables = variables[this.toString()];
		$.each(Object.keys(deviceVariables), function () {
			if (!variableTokens.includes(this.toString())) variableTokens.push(this.toString())
		});
	});
	
	csvBuildData = [];
	$.each(Object.keys(variables), function () {
		var deviceVariables = variables[this.toString()];
		console∂.log(deviceVariables)
		let csvRow = {};
		$.each(variableTokens, function() {
			let tokenName = this.toString()
			csvRow[tokenName] = deviceVariables[tokenName]?deviceVariables[tokenName]:'';
		})
		csvBuildData.push(csvRow);
	});
	
	csvData = csvBuildData;
	
	var csv = Papa.unparse(csvData);
	
	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	
	var csvURL = window.URL.createObjectURL(csvBlob);
	
	var csvLink = document.createElement('a');
	csvLink.href = csvURL;
	
	csvLink.setAttribute('download', 'DeviceVariables.csv');
	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}


