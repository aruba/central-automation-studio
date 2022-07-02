/*
Central Automation v1.12
Updated: 
Aaron Scott (WiFi Downunder) 2022
*/

var configGroups = [];
var groupConfigs = {};
var wlans = {};
var userRoles = [];
var mpskPools = {};
var mpskPoolName = '';

var groupCounter = 0;
var updateCounter = 0;
var errorCounter = 0;
var wlanPrefix = 'wlan ssid-profile ';
var essidPrefix = 'essid ';
var mpskConfigPrefix = 'mpsk-local ';
var userRolePrefix = 'wlan access-rule ';
var mpskPoolPrefix = 'wlan mpsk-local ';

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Array Compare Function
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Warn if overriding existing method
if (Array.prototype.equals) console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function(array) {
	// if the other array is a false value, return
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
		QR Code Functions (1.12)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function prepForQR(mpskName, mpskPassphrase) {
	document.getElementById('mpskName').value = mpskName;
	document.getElementById('mpskPassphrase').value = mpskPassphrase;
	generateQRCode();
}

function generateQRCode() {
	// Get needed values
	var mpskName = document.getElementById('mpskName').value;
	var psk = document.getElementById('mpskPassphrase').value;
	// Check if WLAN is hidden
	var wlan = document.getElementById('wlanselector').value;
	var wlanConfig = wlans[wlan];
	var compiledConfig = wlanConfig.config.join('\n');
	var hidden = false;
	if (compiledConfig.includes('hide-ssid')) hidden = true;

	var enc = 'WPA';

	// Label the modal
	document.getElementById('wlanQRTitle').innerHTML = document.getElementById('mpskName').value + ' QR Code for ' + wlan;

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
		data: 'WIFI:S:' + wlanConfig.essid + ';T:' + enc + ';P:' + psk + ';H:' + hidden + ';;',
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
	qrCode.download({ name: document.getElementById('mpskName').value + '-' + wlan, extension: 'png' });
	$('#QRModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group Config Functions (1.12)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getGroupConfig() {
	var groupSelect = document.getElementById('groupselector');
	var currentGroup = groupSelect.value;

	// Deselect the current WLAN/SSID selected
	$('#wlanselector').selectpicker('deselectAll');
	$('.selectpicker').selectpicker('refresh');
	// Disable the CSV Upload button
	document.getElementById('uploadMPSKBtn').disabled = true;

	if (currentGroup !== '') {
		$.when(tokenRefresh()).then(function() {
			// Clearing old data
			$('#mpsk-table')
				.DataTable()
				.clear();

			document.getElementById('mpskPoolTitle').innerHTML = 'MPSK Pool';

			$('#mpsk-table')
				.DataTable()
				.rows()
				.draw();

			groupCounter = 0;
			groupConfigs = {};
			wlans = {};
			userRoles = [];
			mpskPools = {};
			showNotification('ca-folder-settings', 'Getting Group WLAN Configs...', 'bottom', 'center', 'info');

			// Grab config for Group in Central
			var settings = {
				url: getAPIURL() + '/tools/getCommand',
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

			$.ajax(settings).done(function(response) {
				showNotification('ca-folder-settings', 'Retrieved ' + currentGroup + ' WLAN Configs... Processing...', 'bottom', 'center', 'info');
				// save the group config for modifications
				groupConfigs[currentGroup] = response;

				// pull the pieces out of group config
				getWLANsFromConfig(response, currentGroup);
				getRolesFromConfig(response, currentGroup);
				getMPSKPoolsFromConfig(response, currentGroup);

				showNotification('ca-folder-settings', currentGroup + ' WLAN config processed', 'bottom', 'center', 'success');
			});
		});
	}
}

function getWLANsFromConfig(config, group) {
	// Find the existing user role
	var startWLANIndex = -1;
	var endWLANIndex = -1;
	var wlanName = '';

	// Clear out the WLAN List
	var wlansList = document.getElementById('wlanselector');
	wlansList.options.length = 0;

	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the wlan role
			if (currentLine.includes(wlanPrefix) && startWLANIndex == -1) {
				// pull out the wlan name.
				wlanName = currentLine.replace(wlanPrefix, '');
				startWLANIndex = i;
			} else if (endWLANIndex == -1 && startWLANIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current role
				endWLANIndex = i;
			}

			if (endWLANIndex != -1 && startWLANIndex != -1) {
				// Found the start and end of a WLAN
				// Build the WLAN from the config.
				// No need to keep the first line - since we already have the wlanName, the first line can be rebuilt.
				var fullWLAN = config.slice(startWLANIndex + 1, endWLANIndex);
				// Grab ESSID
				var combinedWLAN = fullWLAN.join('\n');
				var essidLocation = combinedWLAN.indexOf(essidPrefix) + essidPrefix.length;
				var endEssidLocation = combinedWLAN.indexOf('\n', essidLocation);
				var essidName = combinedWLAN.substring(essidLocation, endEssidLocation);

				var finalWLAN = [];
				// Remove the "index #" line and "utf8"
				$.each(fullWLAN, function() {
					if (!this.includes('utf8') && !this.includes('index ')) finalWLAN.push(this.trim());
				});

				// Currently do not support WLANs with spaces in the name
				if (!wlanName.includes(' ')) {
					if (combinedWLAN.includes('opmode mpsk-local')) {
						// save the WLANs
						wlans[wlanName] = { name: wlanName, essid: essidName, config: finalWLAN };
						// Generate the WLAN List
						$('#wlanselector').append($('<option>', { value: wlanName, text: wlanName }));
					}
				}

				// Is the current line another WLAN?
				if (currentLine.includes(wlanPrefix)) {
					wlanName = currentLine.replace(wlanPrefix, '');
					startWLANIndex = i;
					endWLANIndex = -1;
				} else {
					// Not another WLAN - rest of the config shouldn't contain any WLANs so break out of loop
					break;
				}
			}
		}
	}
	if ($('.selectpicker').length != 0) {
		$('.selectpicker').selectpicker('refresh');
	}
	//console.log(wlans);
}

function getRolesFromConfig(config, group) {
	// Find the existing user role
	var startRoleIndex = -1;
	var endRoleIndex = -1;
	var roleName = '';

	// Clear out the WLAN List
	var userRoleList = document.getElementById('mpskRoleSelector');
	userRoleList.options.length = 0;

	// check if is a UI group (this doesn't work for template groups... yet)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the user role
			if (currentLine.includes(userRolePrefix) && startRoleIndex == -1) {
				// pull out the role name.
				roleName = currentLine.replace(userRolePrefix, '');
				startRoleIndex = i;
			} else if (endRoleIndex == -1 && startRoleIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current role
				endRoleIndex = i;
			}

			if (endRoleIndex != -1 && startRoleIndex != -1) {
				// Found the start and end of a user role
				// Build the ACLs from the config.
				// No need to keep the first line - since we already have the roleName, the first line can be rebuilt.
				var fullACLs = config.slice(startRoleIndex + 1, endRoleIndex);

				var finalACLs = [];
				// Remove the "index #" line and "utf8"
				$.each(fullACLs, function() {
					if (!this.includes('utf8') && !this.includes('index ')) finalACLs.push(this.trim());
				});

				// Save Role
				userRoles.push({ name: roleName, acls: finalACLs });
				// Generate the User Role List
				$('#mpskRoleSelector').append($('<option>', { value: roleName, text: roleName }));

				// Is the current line another User Role?
				if (currentLine.includes(userRolePrefix)) {
					roleName = currentLine.replace(userRolePrefix, '');
					startRoleIndex = i;
					endRoleIndex = -1;
				} else {
					// Not another user role - rest of the config shouldn't contain any user roles so break out of loop
					break;
				}
			}
		}
	}
	if ($('#mpskRoleSelector').length != 0) {
		$('#mpskRoleSelector').selectpicker('refresh');
	}
	//console.log(userRoles);
}

function getMPSKPoolsFromConfig(config, group) {
	// Find the existing MPSK Pools
	var startMPSKIndex = -1;
	var endMPSKIndex = -1;
	mpskPoolName = '';

	// check if is a UI group (this doesn't work for template groups)
	if (config.length) {
		for (i = 0; i < config.length; i++) {
			var currentLine = config[i];

			// Find first row of the user role
			if (currentLine.includes(mpskPoolPrefix) && startMPSKIndex == -1) {
				// pull out the pool name.
				mpskPoolName = currentLine.replace(mpskPoolPrefix, '');
				startMPSKIndex = i;
			} else if (endMPSKIndex == -1 && startMPSKIndex != -1 && !currentLine.includes('  ')) {
				// next line after the end of the current pool
				endMPSKIndex = i;
			}

			if (endMPSKIndex != -1 && startMPSKIndex != -1) {
				// Found the start and end of a pool
				// Build the ACLs from the config.
				// No need to keep the first line - since we already have the roleName, the first line can be rebuilt.
				var mpskPool = config.slice(startMPSKIndex + 1, endMPSKIndex);

				var finalMPSKPool = [];
				// Remove the "index #" line and "utf8" if they exist
				$.each(mpskPool, function() {
					if (!this.includes('utf8') && !this.includes('index ')) finalMPSKPool.push(this.toString());
				});

				// Save the Pool
				mpskPools[mpskPoolName] = finalMPSKPool;

				// Is the current line another MPSK Pool?
				if (currentLine.includes(mpskPoolPrefix)) {
					mpskPoolName = currentLine.replace(mpskPoolPrefix, '');
					startMPSKIndex = i;
					endMPSKIndex = -1;
				} else {
					// Not another MPSK Pool - rest of the config shouldn't contain any MPSK Pools so break out of loop
					break;
				}
			}
		}
	}
	//console.log(mpskPools);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		MPSK UI Functions (1.12)
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageGroup() {
	getGroupConfig();
}

function loadMPSKTable() {
	// A WLAN has been chosen from the dropdown
	$('#mpsk-table')
		.DataTable()
		.clear();

	var table = $('#mpsk-table').DataTable();

	// Get MPSK Pool Name
	var wlanSelect = document.getElementById('wlanselector');
	var currentWLAN = wlanSelect.value;
	mpskPoolName = '';
	var wlanConfig = wlans[currentWLAN].config.join('\n');
	var mpskLocation = wlanConfig.indexOf(mpskConfigPrefix) + mpskConfigPrefix.length;
	var endMpskLocation = wlanConfig.indexOf('\n', mpskLocation);
	mpskPoolName = wlanConfig.substring(mpskLocation, endMpskLocation);
	document.getElementById('mpskPoolTitle').innerHTML = 'MPSK Pool: ' + mpskPoolName;

	var mpskPool = mpskPools[mpskPoolName];
	for (i = 0; i < mpskPool.length; i++) {
		// Add row to table
		var mpskRow = mpskPool[i].trim().split(' ');
		// 1 = Name, 2 = passphrase, 3 = Role
		var actionBtns = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Edit MPSK" onclick="editMPSK(\'' + i + '\')"><i class="fa-regular fa-pencil"></i></a> ';
		actionBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Remove MPSK" onclick="removeMPSK(\'' + i + '\')"><i class="fa-regular fa-trash-can"></i></a> ';
		if (mpskRow[2] !== '********') {
			actionBtns += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Generate QR Code" onclick="prepForQR(\'' + mpskRow[1] + "','" + mpskRow[2] + '\')"><i class="fa-regular fa-qrcode"></i></a>';
		}
		table.row.add([i, mpskRow[1], mpskRow[2], mpskRow[3], actionBtns]);
	}

	// check count to make sure we don't allow more than 24 MPSKs per pool
	if (mpskPool.length < 24) {
		document.getElementById('addMPSKBtn').disabled = false;
		document.getElementById('maxMPSKWarning').hidden = true;
	} else {
		document.getElementById('addMPSKBtn').disabled = true;
		document.getElementById('maxMPSKWarning').hidden = false;
	}

	// Enable the CSV Upload button
	document.getElementById('uploadMPSKBtn').disabled = false;

	$('#mpsk-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

function addMPSK() {
	// setup the add modal
	document.getElementById('mpskName').readOnly = false;
	document.getElementById('mpskName').value = '';
	document.getElementById('mpskPassphrase').value = '';
	document.getElementById('removeMPSKBtn').hidden = true;
	$('#MPSKModalLink').trigger('click');
}

function removeMPSK(mpskIndex) {
	// throw up warning
	Swal.fire({
		title: 'Are you sure?',
		text: 'Removing an MPSK can not be undone.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, remove it!',
	}).then(result => {
		if (result.isConfirmed) {
			removeConfirmed(mpskIndex);
		}
	});
}

function removeConfirmed(mpskIndex) {
	$('#MPSKModal').modal('hide');
	// delete from config
	var mpskPool = mpskPools[mpskPoolName];
	// Find row in array that has the same MPSK name
	var rowToRemove = -1;
	if (mpskIndex) {
		rowToRemove = mpskIndex;
	} else {
		// didnt get the index passed in. Need to find MPSK using text field
		for (let k in mpskPool) {
			var mpskParts = mpskPool[k].trim().split(' ');
			if (mpskParts[1] === document.getElementById('mpskName').value) {
				rowToRemove = k;
			}
		}
	}
	// remove the MPSK from the array
	mpskPool.splice(rowToRemove, 1);
	mpskPools[mpskPoolName] = mpskPool;
	loadMPSKTable();

	// update the config for the group
	var currentConfig = updateMSPKConfig();

	// Push back to Central
	var currentGroup = document.getElementById('groupselector').value;
	saveConfigToCentral(currentGroup, currentConfig);
}

function editMPSK(mpskIndex) {
	// grab the selected MPSK
	var mpskPool = mpskPools[mpskPoolName];
	var selectedMPSK = mpskPool[mpskIndex].trim().split(' ');

	// Load up the UI elements
	document.getElementById('mpskName').readOnly = true;
	document.getElementById('mpskName').value = selectedMPSK[1];
	document.getElementById('mpskPassphrase').value = selectedMPSK[2];
	$('select[name=mpskRoleSelector]').val(selectedMPSK[3]);
	$('.selectpicker').selectpicker('refresh');
	document.getElementById('removeMPSKBtn').hidden = false;
	$('#MPSKModalLink').trigger('click');
}

function mpskChange() {
	document.getElementById('mpskPassphrase').style.borderColor = '#E3E3E3';
	document.getElementById('saveMPSKBtn').disabled = false;
}

function saveMPSK() {
	if (document.getElementById('mpskPassphrase').value === '********') {
		// through warning about needing to update the MPSK
		document.getElementById('mpskPassphrase').style.borderColor = 'red';
		document.getElementById('saveMPSKBtn').disabled = true;
		return false;
	} else {
		// dismiss modal and add/update MPSK in mpskPools[mpskPoolName]
		var mpskPool = mpskPools[mpskPoolName];
		if (document.getElementById('mpskName').readOnly) {
			// Editing an existing MPSK
			// Find row in array that has the same MPSK name
			for (let k in mpskPool) {
				var mpskParts = mpskPool[k].trim().split(' ');
				if (mpskParts[1] === document.getElementById('mpskName').value) {
					mpskPool[k] = '  mpsk-local-passphrase ' + document.getElementById('mpskName').value + ' ' + document.getElementById('mpskPassphrase').value + ' ' + document.getElementById('mpskRoleSelector').value;
				}
			}
			mpskPools[mpskPoolName] = mpskPool;
		} else {
			// Adding new MPSK to pool
			mpskPool.push('  mpsk-local-passphrase ' + document.getElementById('mpskName').value + ' ' + document.getElementById('mpskPassphrase').value + ' ' + document.getElementById('mpskRoleSelector').value);
			mpskPools[mpskPoolName] = mpskPool;
		}
		// Update the UI
		loadMPSKTable();

		// Update the config
		var currentConfig = updateMSPKConfig();

		// Push back to Central
		// need to push config back to Central.
		var currentGroup = document.getElementById('groupselector').value;
		saveConfigToCentral(currentGroup, currentConfig);
	}
}

function updateMSPKConfig() {
	// Find if there is an existing MPSK Pool is in the config
	var startIndex = -1;
	var endIndex = -1;
	var mpskPoolLocation = -1;

	var currentGroup = document.getElementById('groupselector').value;
	var currentConfig = groupConfigs[currentGroup];
	var lineToFind = mpskPoolPrefix + mpskPoolName;
	for (i = 0; i < currentConfig.length; i++) {
		if (currentConfig[i] === lineToFind) {
			startIndex = i;
		} else if (endIndex == -1 && startIndex != -1 && !currentConfig[i].includes('  ')) {
			endIndex = i;
		}
	}
	// remove old MPSK Pool Config
	currentConfig.splice(startIndex, endIndex - startIndex);

	// Need to push the MPSK block into the config
	var newPool = [];
	newPool.push(lineToFind);
	newPool.push(...mpskPools[mpskPoolName]);

	if (currentConfig.length) {
		currentConfig.splice(startIndex, 0, ...newPool);
	}
	return currentConfig;
}

function saveConfigToCentral(currentGroup, currentConfig) {
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
		//console.log(response);
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
			logError('MPSK change was not applied to group ' + currentGroup);
			errorCounter++;
		}
		if (errorCounter != 0) {
			showLog();
			Swal.fire({
				title: 'MPSK-Local Deployment',
				text: 'The MPSK changes failed to be deployed to the selected Groups',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'MPSK-Local Deployment',
				text: 'The MPSK changes were deployed to to the selected Group',
				icon: 'success',
			});
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	MPSK CSV Functions (1.12)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

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

			Swal.fire({
				title: 'Add or Replace',
				text: 'Do you want to "Add and Update" the MPSKs or "Replace" the entire pool of MPSKs?',
				icon: 'question',
				showDenyButton: true,
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#bcbcbc',
				denyButtonColor: '#d33',
				confirmButtonText: 'Add and Update',
				denyButtonText: 'Replace All',
			}).then(result => {
				if (result.isConfirmed) {
					addAndUpdateMPSKs();
				} else if (result.isDenied) {
					replaceAllMPSKs();
				}
			});
		},
	});
}

function addAndUpdateMPSKs() {
	// Counters for notification
	var newCount = 0;
	var updatedCount = 0;

	var mpskPool = mpskPools[mpskPoolName];
	$.each(csvData, function() {
		// Find row in array that has the same MPSK name
		var newMPSK = true;
		for (let k in mpskPool) {
			// try and find an existing MPSK
			var mpskParts = mpskPool[k].trim().split(' ');
			if (mpskParts[1] === this['NAME']) {
				// Updating an existing MPSK
				mpskPool[k] = '  mpsk-local-passphrase ' + this['NAME'] + ' ' + this['MPSK'] + ' ' + this['ROLE'];
				newMPSK = false;
				updatedCount++;
			}
		}
		if (newMPSK && mpskPool.length < 24) {
			// Adding new MPSK to pool if pool count is <24
			mpskPool.push('  mpsk-local-passphrase ' + this['NAME'] + ' ' + this['MPSK'] + ' ' + this['ROLE']);
			newCount++;
		} else if (newMPSK && mpskPool.length >= 24) {
			showNotification('ca-password-1', 'Maximum MPSKs/pool reached', 'bottom', 'center', 'warning');
		}
	});

	// Store the MPSK pool
	mpskPools[mpskPoolName] = mpskPool;

	// Update the UI
	loadMPSKTable();

	// Update the config
	var currentConfig = updateMSPKConfig();

	// Push back to Central
	// need to push config back to Central.
	var currentGroup = document.getElementById('groupselector').value;
	saveConfigToCentral(currentGroup, currentConfig);

	showNotification('ca-password-1', 'New MPSKs: ' + newCount + ', Updated MPSKs: ' + updatedCount, 'bottom', 'center', 'success');
}

function replaceAllMPSKs() {
	// Counters for notification
	var newCount = 0;

	var mpskPool = mpskPools[mpskPoolName];
	mpskPool = [];
	$.each(csvData, function() {
		if (mpskPool.length < 24) {
			// Adding new MPSK to pool if pool count is <24
			mpskPool.push('  mpsk-local-passphrase ' + this['NAME'] + ' ' + this['MPSK'] + ' ' + this['ROLE']);
			newCount++;
		} else if (mpskPool.length >= 24) {
			showNotification('ca-password-1', 'Maximum MPSKs/pool reached', 'bottom', 'center', 'warning');
			return false;
		}
	});

	// Store the MPSK pool
	mpskPools[mpskPoolName] = mpskPool;

	// Update the UI
	loadMPSKTable();

	// Update the config
	var currentConfig = updateMSPKConfig();

	// Push back to Central
	// need to push config back to Central.
	var currentGroup = document.getElementById('groupselector').value;
	saveConfigToCentral(currentGroup, currentConfig);

	showNotification('ca-password-1', 'Replaced MPSKs: ' + newCount, 'bottom', 'center', 'success');
}
