/*
Central Automation v1.26
Updated: 
Aaron Scott (WiFi Downunder) 2023
*/

var visitorPortals = {};
var csvData;
var csvDataCount = 0;

var portalNotification;
var visitorNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Visitor Functions (1.26)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getVisitorPortals() {
	$.when(tokenRefresh()).then(function() {
		visitorPortals = {};
		var portals = document.getElementById('portalselector');
		portals.options.length = 0;
		portalNotification = showNotification('ca-user-frame-33', 'Obtaining Visitor portals...', 'bottom', 'center', 'info');

		getPortals(0);
	});
}

function getPortals(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/guest/v1/portals?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/guest/v1/portals)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getPortals(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			$.each(response.portals, function() {
				// Add to dropdown
				$('#portalselector').append($('<option>', { value: this['id'], text: this['name'] }));
				var portalID = this['id'];
				visitorPortals[portalID] = this;
			});

			if (response.portals.length > 0) {
				if ($('#portalselector').length != 0) {
					$('#portalselector').selectpicker('refresh');
				}
			} else if (offset == 0) {
				showNotification('ca-user-frame-33', 'There are no visitor portals', 'bottom', 'center', 'danger');
			}

			if (offset + apiLimit < response.total) getPortals(offset + apiLimit);
			else {
				saveDataToDB('monitoring_portals', JSON.stringify(visitorPortals));
				portalNotification.close();
			}

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
}

function getVisitors(offset) {
	$('#visitor-table')
		.DataTable()
		.rows()
		.remove();

	var table = $('#visitor-table').DataTable();

	var select = document.getElementById('portalselector');
	var currentPortal = visitorPortals[select.value];
	visitorNotification = showNotification('ca-multiple-11', 'Obtaining visitors for portal: ' + currentPortal.name, 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/guest/v1/portals/' + select.value + '/visitors?limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/guest/v1/portals/<PORTAL_ID>/visitors)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getVisitors(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			$.each(response.visitors, function() {
				// Build Status dot
				var status = '<i class="fa fa-circle text-neutral"></i>';
				if (this['status'] == 'Active') {
					status = '<i class="fa fa-circle text-success"></i>';
				}

				var user = this['user'];
				var email = '';
				if (user['email']) email = user['email'];
				var phone = '';
				if (user['phone']) phone = user['phone'];

				var expires = 'Never';
				if (this['expire_at']) {
					var duration = moment.duration(this['expire_at'] * 1000 - Date.now());
					expires = duration.humanize();
				}

				// Action Buttons
				var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Delete Account" onclick="deleteAccount(\'' + this['id'] + '\')"><i class="fa-regular fa-trash-can"></i></a> ';

				// Add AP to table
				table.row.add([this['id'], '<strong>' + this['name'] + '</strong>', this['company_name'], status, this['is_enabled'] ? 'Enabled' : 'Disabled', email, phone, expires, actionBtns]);
			});

			if (response.visitors.length == 0 && offset == 0) {
				showNotification('ca-multiple-11', 'There are no visitors for the selected portal', 'bottom', 'center', 'warning');
			}

			if (offset + apiLimit < response.total) getVisitors(offset + apiLimit);
			else {
				visitorNotification.close();
			}
			$('#visitor-table')
				.DataTable()
				.rows()
				.draw();

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
}

function deleteAccount(visitorID) {
	var select = document.getElementById('portalselector');
	var currentPortal = visitorPortals[select.value];

	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/guest/v1/portals/' + select.value + '/visitors/' + visitorID,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites/associate)');
			}
		}
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
		} else if (response.hasOwnProperty('status_code') && response['status_code'] === 200) {
			logInformation('Visitor account deleted');
			// reload the visitor table with the latest
			getVisitors(0);
		} else {
			logError('Unable to delete visitor account');
		}
	});
}

function loadPortalDetails() {
	// Get visitor accounts for selected portal
	getVisitors(0);

	document.getElementById('portalSeparator').hidden = false;
	document.getElementById('portalDetails').hidden = false;

	var select = document.getElementById('portalselector');
	var currentPortal = visitorPortals[select.value];
	var sharedState = currentPortal['is_shared'] ? 'Yes' : 'No';
	$('#portalInformation').empty();
	$('#portalInformation').append('<li>Name: <strong>' + currentPortal['name'] + '</strong></li>');
	$('#portalInformation').append('<li>Authentication Type: <strong>' + currentPortal['auth_type'] + '</strong></li>');
	$('#portalInformation').append('<li>Shared: <strong>' + sharedState + '</strong></li>');
}

function uploadVisitors() {
	loadCSVFile('createVisitors');
}

function loadCurrentPageVisitors() {
	// Get visitor accounts for selected portal
	getVisitors(0);
}
