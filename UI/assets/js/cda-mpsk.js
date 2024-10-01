/*
Central Automation v1.31
Updated: 
Copyright Aaron Scott (WiFi Downunder) 2021-2024
*/

var mpskSSIDs = [];
var namedMPSKs = [];

var mpskNotification;
var statsNotification;
var ssidNotification;

var addCounter = 0;
var errorCounter = 0;

var csvData;

var failedAuth;

/*  ------------------------------------
		Initial Data
	------------------------------------*/

function getMPSKData() {
	getMPSKSSIDs();
}

function getMPSKStats() {
	statsNotification = showLongNotification('ca-license-key', 'Retrieving Statistics...', 'bottom', 'center', 'info');

	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cloudAuth/api/v2/usage/mpsk',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cloudAuth/api/v2/usage/mpsk)');
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getMPSKData();
					}
				});
			}
		} else if (response.used) {
			failedAuth = false;

			if (document.getElementById('limit_count')) {
				document.getElementById('limit_count').innerHTML = response.limit;
				$(document.getElementById('limit_icon')).removeClass('text-warning');
				$(document.getElementById('limit_icon')).addClass('text-primary');
			}

			if (document.getElementById('used_count')) {
				document.getElementById('used_count').innerHTML = response.used;
				if ((response.used / response.limit) * 100 > 90) {
					$(document.getElementById('used_icon')).removeClass('text-warning');
					$(document.getElementById('used_icon')).removeClass('text-success');
					$(document.getElementById('used_icon')).addClass('text-danger');
				} else {
					$(document.getElementById('used_icon')).removeClass('text-warning');
					$(document.getElementById('used_icon')).addClass('text-success');
					$(document.getElementById('used_icon')).removeClass('text-danger');
				}
			}

			if (document.getElementById('ssid_count')) {
				document.getElementById('ssid_count').innerHTML = Object.keys(response['ssids']).length;
				$(document.getElementById('ssid_icon')).removeClass('text-warning');
				$(document.getElementById('ssid_icon')).addClass('text-success');

				$('#ssid-table')
					.DataTable()
					.rows()
					.remove();
				var table = $('#ssid-table').DataTable();
				for (const [key, value] of Object.entries(response['ssids'])) {
					$.each(mpskSSIDs, function() {
						if (this['ssid'] === key) {
							var policy = 'Passphrase';
							if (this['passwordPolicy'] === 'generate_alphanumeric') policy = 'Random Password';

							table.row.add(['<strong>' + key + '</strong>', value, policy, '<a href="' + this['accessURL'] + '" target="_blank"><strong>Access URL</strong></a>']);
						}
					});
				}
				$('#ssid-table')
					.DataTable()
					.rows()
					.draw();
			}
			if (statsNotification) {
				statsNotification.update({ type: 'success', message: 'Named MPSK Stats Retrieved' });
				setTimeout(statsNotification.close, 1000);
			}
		}
	});
}

function getMPSKSSIDs() {
	mpskSSIDs = [];
	ssidNotification = showLongNotification('ca-wifi', 'Retrieving Named MPSK SSIDs...', 'bottom', 'center', 'info');

	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cloudAuth/api/v2/mpsk)');
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getMPSKSSIDs();
					}
				});
			}
		} else {
			failedAuth = false;

			// Clear the WLANs from the dropdown
			select = document.getElementById('wlanselector');
			var selectedWLAN = select.value;
			select.options.length = 0;

			mpskSSIDs = response['items'];

			$.each(mpskSSIDs, function() {
				$('#wlanselector').append($('<option>', { value: this['id'], text: this['ssid'] }));
			});
			if ($('#wlanselector').length != 0) {
				$('#wlanselector').selectpicker('refresh');
			}
			if (selectedWLAN) $('#wlanselector').selectpicker('val', selectedWLAN);
			if (ssidNotification) {
				ssidNotification.update({ type: 'success', message: 'Named MPSK SSIDs Retrieved' });
				setTimeout(ssidNotification.close, 1000);
			}

			// Now get MPSK Stats - to mix with the SSID data.
			getMPSKStats();
		}
	});
}

function loadMPSKs(cursor) {
	if (!cursor) namedMPSKs = [];
	mpskNotification = showLongNotification('ca-wifi-protected', 'Retrieving Named MPSKs...', 'bottom', 'center', 'info');
	select = document.getElementById('wlanselector');
	selectedWLAN = select.value;

	var effectiveURL = localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk/' + selectedWLAN + '/namedMPSK?limit=' + apiLimit;
	if (cursor) effectiveURL = localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk/' + selectedWLAN + '/namedMPSK?cursor=' + cursor + '&limit=' + apiLimit;

	var x = document.getElementById('accessLinkDiv');
	if (x) x.hidden = false;

	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: effectiveURL,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/cloudAuth/api/v2/mpsk/<mpsk_id>/namedMPSK)');
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
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						loadMPSKs(cursor);
					}
				});
			}
		} else {
			failedAuth = false;

			namedMPSKs = namedMPSKs.concat(response.items);
			if (response.next) {
				loadMPSKs(response.next);
			} else {
				loadMPSKTable();
				if (mpskNotification) {
					mpskNotification.update({ type: 'success', message: 'Named MPSKs Retrieved' });
					setTimeout(mpskNotification.close, 1000);
				}
			}
		}
	});
}

function loadMPSKTable() {
	document.getElementById('downloadKeysBtn').disabled = false;
	document.getElementById('addKeysBtn').disabled = false;

	$('#mpsk-table')
		.DataTable()
		.rows()
		.remove();
	var table = $('#mpsk-table').DataTable();
	var displayMPSK = document.getElementById('showMPSKCheckbox').checked;
	for (var i = 0; i < namedMPSKs.length; i++) {
		var thisMPSK = namedMPSKs[i];

		var status = '<i class="fa-solid fa-circle text-success"></i>';
		if (thisMPSK['status'] === 'disabled') status = '<i class="fa-solid fa-circle text-danger"></i>';

		var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Generate QR Code" onclick="generateQRCode(\'' + thisMPSK['name'] + "','" + thisMPSK['mpsk'] + '\')"><i class="fa-solid fa-qrcode"></i></a>';
		actionBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Regenerate MPSK" onclick="regenerateMPSK(\'' + i + '\')"><i class="fa-solid fa-recycle"></i></a> ';
		actionBtns += '<a class="btn btn-link btn-danger" data-toggle="tooltip" data-placement="top" title="Remove MPSK" onclick="removeMPSK(\'' + i + '\')"><i class="fa-solid fa-trash-can"></i></a> ';

		table.row.add([i, thisMPSK['name'], thisMPSK['role'], status, thisMPSK['status'], displayMPSK ? thisMPSK['mpsk'] : '********', actionBtns]);
	}
	$('#mpsk-table')
		.DataTable()
		.rows()
		.draw();
}

function copyAccessURL() {
	// build Access URL and show
	$.each(mpskSSIDs, function() {
		if (this['id'] === selectedWLAN) {
			navigator.clipboard.writeText(this['accessURL']);
			showNotification('ca-link', 'Access URL has been copied to the clipboard', 'bottom', 'center', 'success');
		}
	});
}

function addMPSKs() {
	$('#MPSKModalLink').trigger('click');
}

function removeMPSK(mpskIndex) {
	Swal.fire({
		title: 'Are you sure?',
		text: 'There is no undoing this action',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, remove it!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmRemoveMPSK(mpskIndex);
		}
	});
}

function confirmRemoveMPSK(mpskIndex) {
	select = document.getElementById('wlanselector');
	selectedWLAN = select.value;

	var selectedMPSK = namedMPSKs[mpskIndex];

	console.log('Removing MPSK: ' + selectedMPSK['name']);
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk/' + selectedWLAN + '/namedMPSK/' + selectedMPSK['id'],
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.reason + ' (/cloudAuth/api/v2/mpsk/<mpsk_id>/namedMPSK/<named_mpsk_id>)');
				}
			}
			if (response.hasOwnProperty('error_code')) {
				logError(response.description);
			}
		} else if (jqXHR.status == 204) {
			logInformation(selectedMPSK['name'] + ' mpsk removed');
			showNotification('ca-wifi-protected', selectedMPSK['name'] + ' removed', 'bottom', 'center', 'success');
			namedMPSKs.splice(mpskIndex, 1);
			loadMPSKTable();
		} else {
			logError('Unable to remove ' + selectedMPSK['name'] + ' mpsk');
		}
	});
}

function regenerateMPSK(mpskIndex) {
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will result in a new PSK for the user. The Old PSK will no longer work',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, regenerate it!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmRegenerateMPSK(mpskIndex);
		}
	});
}

function confirmRegenerateMPSK(mpskIndex) {
	select = document.getElementById('wlanselector');
	selectedWLAN = select.value;

	var selectedMPSK = namedMPSKs[mpskIndex];

	console.log('Regenerating MPSK: ' + selectedMPSK['name']);
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk/' + selectedWLAN + '/namedMPSK/' + selectedMPSK['id'] + '?resetMPSK=true',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ name: selectedMPSK['name'], role: selectedMPSK['role'], status: selectedMPSK['status'] }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.reason + ' (/cloudAuth/api/v2/mpsk/<mpsk_id>/namedMPSK/<named_mpsk_id>)');
				} else if (response.status === '204') {
					logInformation(selectedMPSK['name'] + ' mpsk was regrenerated');
					showNotification('ca-wifi-protected', selectedMPSK['name'] + ' regenerated', 'bottom', 'center', 'success');
					loadMPSKs();
				} else {
					logError('Unable to regenerate mpsk for ' + selectedMPSK['name']);
				}
			}
			if (response.hasOwnProperty('error_code')) {
				logError(response.description);
			}
		} else {
			logError('Unable to regenerate mpsk for ' + selectedMPSK['name']);
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadMPSKs() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	select = document.getElementById('wlanselector');
	var selectedWLAN = select.options[select.selectedIndex].text;

	var table = $('#mpsk-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', selectedWLAN + '-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', selectedWLAN + '.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	//CSV header
	var nameKey = 'NAME';
	var roleKey = 'ROLE';
	var statusKey = 'STATUS';
	var mpskKey = 'MPSK';

	var csvDataBuild = [];

	var table = $('#mpsk-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var mpskData = namedMPSKs[this];
		csvDataBuild.push({ [nameKey]: mpskData['name'], [roleKey]: mpskData['role'], [statusKey]: titleCase(mpskData['status']), [mpskKey]: mpskData['mpsk'] });
	});

	return csvDataBuild;
}

/*  ----------------------------------------
		QR Code Functions
	--------------------------------------- */

function generateQRCode(mpskName, psk) {
	// Set needed values
	var hidden = false;
	var enc = 'WPA';
	select = document.getElementById('wlanselector');
	var selectedWLAN = select.options[select.selectedIndex].text;

	// Label the modal
	document.getElementById('wlanQRTitle').innerHTML = mpskName + ' QR Code for ' + selectedWLAN;

	// Are we using a custom colour?
	var qrColor = localStorage.getItem('qr_color');
	if (qrColor == null || qrColor == 'undefined') {
		// use the default colour - Aruba Orange
		qrColor = '#FF8300';
	}

	// Custom Logo?
	var qrLogo = localStorage.getItem('qr_logo');
	if (qrLogo == null || qrLogo == 'undefined' || qrLogo == '') {
		qrLogo = 'assets/img/api.svg';
	}

	// Generate the QR Code and display
	$('#qrcanvas').empty();
	const qrCode = new QRCodeStyling({
		width: 400,
		height: 400,
		type: 'svg',
		data: 'WIFI:S:' + selectedWLAN + ';T:' + enc + ';P:' + psk + ';H:' + hidden + ';;',
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

	$('#QRModalLink').trigger('click');

	qrCode.download({ name: mpskName + '-' + selectedWLAN, extension: 'png' });
}

/*  ----------------------------------------
	Bulk Add CSV Functions
--------------------------------------- */
function processMPSKCSV(results) {
	apiErrorCount = 0;
	csvData = results.data;
	csvDataCount = csvData.length;
}

function uploadMPSKCSV() {
	$('#files').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processMPSKCSV,
			transformHeader: function(h) {
				return h.trim();
			},
		},
		before: function(file, inputElem) {
			showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (!csvData) {
				showNotification('ca-c-warning', 'No CSV data found. Try selecting a CSV document.', 'bottom', 'center', 'danger');
				return false;
			}
			// Clear error log
			clearErrorLog();

			var select = document.getElementById('wlanselector');
			var selectedWLAN = select.value;

			var domainName = document.getElementById('domainName').value;

			addCounter = 0;
			errorCounter = 0;
			var delayCounter = 0;
			$.each(csvData, function() {
				var username = this['NAME'];
				if (domainName !== '' && !username.includes('@')) username = username + '@' + domainName;

				setTimeout(addMPSK, delayCounter * apiDelay, selectedWLAN, username, this['ROLE']);
				delayCounter++;
			});
		},
	});
}

function addMPSK(mpskId, username, userrole) {
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/cloudAuth/api/v2/mpsk/' + mpskId + '/namedMPSK',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ name: username, role: userrole, status: 'enabled' }),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				erroCounter++;
				logError('Central Server Error (503): ' + response.reason + ' (/cloudAuth/api/v2/mpsk/<mpsk_id>/namedMPSK	)');
				return;
			}
		}
		if (response.reason && response.reason == 'Bad Gateway') {
			errorCounter++;
			Swal.fire({
				title: 'API Issue',
				text: 'There is an issue communicating with the API Gateway',
				icon: 'warning',
			});
		} else if (response.errorCode) {
			errorCounter++;
			logError(response.errorMessage);
		} else {
			addCounter++;
			namedMPSKs.push(response);
			loadMPSKTable();
			logInformation(response['name'] + ' was added successfully');
		}

		// Check if done.
		if (addCounter + errorCounter >= csvData.length) {
			if (errorCounter > 0) {
				showLog();
				Swal.fire({
					title: 'Add Failure',
					text: 'Some or all MPSKs failed to be added to Central',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All MPSKs were added to Central',
					icon: 'success',
				});
			}
		}
	});
}
