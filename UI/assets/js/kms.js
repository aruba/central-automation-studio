/*
Central Automation v1.31
Updated: 
Copyright Aaron Scott (WiFi Downunder) 2021-2023
*/

var currentClientMac;
var syncedAPs = [];

var kmsEncryptionKey = '';
var encryptionPromise;

var apNotification;
var clientNotification;
var visualRFNotification;
var kmsNotification;

var vrfBuildings = [];
var vrfFloors = [];
var vrfAPs = [];
var vrfSelectedAPs = {};
var vrfPathloss = {};
var vrfFloorplan;
var vrfFloorId;
var vrfBuildingId;
var vrfCampusId;
var vrfChannels = {};
var vrfOptimization = [];
var needChannelList = false;
var currentAP = null;
var currentFloor;
var storedAP;
var found;
const vrfLimit = 100;
const units = 'METERS';

var apImage;
const ratio = window.devicePixelRatio;

const apColors = ['#23CCEF', '#FB404B', '#FFA534', '#9368E9', '#87CB16', '#1D62F0', '#5E5E5E', '#DD4B39', '#35465c', '#e52d27', '#55acee', '#cc2127', '#1769ff', '#6188e2', '#a748ca', '#ca489f', '#48ca9a', '#95e851', '#f2f536', '#b0b0b0', '#3414b5', '#1498b5', '#b55714', '#e3e3e3', '#851919', '#196385', '#88fceb', '#cafc88'];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findAPForMAC(macaddr) {
	// Check APs for radio mac
	var foundDevice = null;
	var aps = getAPs();
	$.each(aps, function() {
		if (this['macaddr'] === macaddr) {
			foundDevice = this;
			return false; // break  out of the for loop
		}
	});

	return foundDevice;
}

/*  -------------------------
		Client functions
----------------------------- */

function updateKMSData() {
	getWirelessClientData(0);
}

function loadCurrentPageClient() {
	apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';

	// clear out any old data
	$('#wireless-table')
		.DataTable()
		.clear();
	$('#wireless-table')
		.DataTable()
		.rows()
		.draw();

	var table = $('#wireless-table').DataTable();
	var wirelessClients = getWirelessClients();
	$.each(wirelessClients, function() {
		var client = this;
		var status = '<i class="fa-solid fa-circle text-neutral"></i>';
		if (!client['health'] && client['failure_stage'] !== '' && client['failure_stage'] !== 'NA') {
			status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + client['failure_reason'] + ' at ' + client['failure_stage'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
		} else if (!client['health']) {
			status = '<i class="fa-solid fa-circle text-neutral"></i>';
		} else if (client['health'] < 50) {
			status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
		} else if (client['health'] < 70) {
			status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-warning"></i></span>';
		} else {
			status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-success"></i></span>';
		}
		// Generate clean data for table
		var site = '';
		if (client['site']) site = client['site'];
		var health = '';
		if (client['health']) health = client['health'];
		var associatedDevice_name = '';
		var associatedDevice = findDeviceInMonitoring(client['associated_device']);
		if (associatedDevice) associatedDevice_name = associatedDevice.name;
		var ip_address = '';
		if (client['ip_address']) ip_address = client['ip_address'];
		var vlan = '';
		if (client['vlan']) vlan = client['vlan'];
		var os_type = '';
		if (client['os_type']) os_type = client['os_type'];
		var client_name = '';
		if (client['name']) client_name = client['name'];
		var client_mac = 'Unknown';
		if (client['macaddr']) client_mac = client['macaddr'];

		//console.log(client);

		// Make link to Central
		client_name_url = encodeURI(client_name);
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[0][apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
		var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + client['macaddr'] + '?ccma=' + client['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';

		var actionBtns = '';
		if (client['connection'] && client['connection'].includes('11r')) {
			actionBtns += '<button class="btn-warning btn-action" onclick="getClientRecord(\'' + client_mac + '\')">Cloud Record</button> ';
			actionBtns += '<button class="btn-warning btn-action" onclick="getSyncedAPsForClient(\'' + client_mac + '\')">Synced APs</button> ';
			//actionBtns += '<button class="btn-warning btn-action" onclick="getRoamingForClient(\'' + client_mac + '\')">Roaming History</button> ';
		}

		// Add row to table
		table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan, actionBtns]);

		$('[data-toggle="tooltip"]').tooltip();
	});
	$('#wireless-table')
		.DataTable()
		.rows()
		.draw();

	table.columns.adjust().draw();
}

function getClientRecord(clientMac) {
	clientNotification = showNotification('ca-laptop-1', 'Retrieving Cloud Client Record...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/keymgmt/v1/keycache/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/keymgmt/v1/keycache/<CLIENT-MAC>)');
			apiErrorCount++;
			if (apNotification) apNotification.close();
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			if (apNotification) apNotification.close();
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);
		if (response.status) showNotification('ca-laptop-1', response.status, 'bottom', 'center', 'warning');
		else {
			if (clientNotification) {
				clientNotification.update({ type: 'success', message: 'Cloud Client Record retrieved' });
				setTimeout(clientNotification.close, 1000);
			}
			// process the response
			$('#userDetails').empty();
			$('#keyDetails').empty();
			if (response['11r/OKC KEYCACHE ']) {
				// 11r keycache entry - note the stupid extra space on the key!!
				var keyCache = response['11r/OKC KEYCACHE '];
				$('#userDetails').append('<li>Name: <strong>' + keyCache['name'] + '</strong></li>');
				$('#userDetails').append('<li>Mac Address: <strong>' + keyCache['clientmac'] + '</strong></li>');
				$('#userDetails').append('<li>ESSID: <strong>' + keyCache['essid'] + '</strong></li>');
				$('#userDetails').append('<li>User Role: <strong>' + keyCache['role'] + '</strong></li>');
				$('#userDetails').append('<li>VLAN: <strong>' + keyCache['vlan'] + '</strong></li>');

				var originAP = findAPForMAC(keyCache['origin_apmac']);
				if (originAP) {
					// Make AP Name as a link to Central
					var name = encodeURI(originAP['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralBaseURL = centralURLs[0][apiURL];
					if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
					var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + originAP['serial'] + '?casn=' + originAP['serial'] + '&cdcn=' + name + '&nc=access_point';
					$('#userDetails').append('<li>Origin AP: <a href="' + centralURL + '" target="_blank"><strong>' + originAP['name'] + '</strong></a></li>');
				}

				$('#keyDetails').append('<li>Key Type: <strong>' + keyCache['keytype'] + '</strong></li>');
				$('#keyDetails').append('<li>R0 Name: <strong>' + keyCache['R0name'] + '</strong></li>');
				$('#keyDetails').append('<li>MDID: <strong>' + keyCache['MDID'] + '</strong></li>');
				$('#keyDetails').append('<li>Reauth Interval: <strong>' + keyCache['reauth_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Accounting Interval: <strong>' + keyCache['acct_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Key Cache TTL: <strong>' + keyCache['keycache TTL'] + '</strong></li>');
				var timestamp = Date.parse(keyCache['timestamp']);
				$('#keyDetails').append('<li>Timestamp: <strong>' + moment(timestamp).format('LT') + '</strong></li>');
			} else if (response['NON 11r ']) {
				// Non 11r entry - note the stupid extra space on the key!!
				var keyCache = response['NON 11r '];
				$('#userDetails').append('<li>Name: <strong>' + keyCache['name'] + '</strong></li>');
				$('#userDetails').append('<li>Mac Address: <strong>' + keyCache['clientmac'] + '</strong></li>');
				$('#userDetails').append('<li>ESSID: <strong>' + keyCache['essid'] + '</strong></li>');
				$('#userDetails').append('<li>User Role: <strong>' + keyCache['role'] + '</strong></li>');
				$('#userDetails').append('<li>VLAN: <strong>' + keyCache['vlan'] + '</strong></li>');

				var originAP = findAPForMAC(keyCache['origin_apmac']);
				if (originAP) {
					// Make AP Name as a link to Central
					var name = encodeURI(originAP['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralBaseURL = centralURLs[0][apiURL];
					if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
					var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + originAP['serial'] + '?casn=' + originAP['serial'] + '&cdcn=' + name + '&nc=access_point';
					$('#userDetails').append('<li>Origin AP: <a href="' + centralURL + '" target="_blank"><strong>' + originAP['name'] + '</strong></a></li>');
				}

				$('#keyDetails').append('<li>Key Type: <strong>' + keyCache['opmode'] + '</strong></li>');
				$('#keyDetails').append('<li>Expiry Time: <strong>' + keyCache['expiry_time'] + '</strong></li>');
				$('#keyDetails').append('<li>Idle Timeout: <strong>' + keyCache['idle_timeout'] + '</strong></li>');
				$('#keyDetails').append('<li>Reauth Interval: <strong>' + keyCache['reauth_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Accounting Interval: <strong>' + keyCache['acct_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Roam Cache TTL: <strong>' + keyCache['roamcache TTL'] + '</strong></li>');
				var timestamp = Date.parse(keyCache['timestamp']);
				$('#keyDetails').append('<li>Timestamp: <strong>' + moment(timestamp).format('LT') + '</strong></li>');
			}

			$('#ClientRecordModalLink').trigger('click');

			var x = document.getElementById('syncedAPCard');
			if (x && currentClientMac !== clientMac) {
				x.hidden = true;
			}
		}
	});
}

function getSyncedAPsForClient(clientMac) {
	apNotification = showNotification('ca-wifi', 'Retrieving Synced APs...', 'bottom', 'center', 'info');
	currentClientMac = clientMac;
	document.getElementById('syncAPTitle').innerHTML = 'Keys Synced to APs for: <strong>' + clientMac + '</strong>';
	document.getElementById('syncAPPlanTitle').innerHTML = 'Keys Synced to APs for: <strong>' + clientMac + '</strong>';

	// clear out any old data
	$('#synced-ap-table')
		.DataTable()
		.clear();
	$('#synced-ap-table')
		.DataTable()
		.rows()
		.draw();

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/keymgmt/v1/syncedaplist/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/keymgmt/v1/syncedaplist/<CLIENT-MAC>)');
			apiErrorCount++;
			if (apNotification) apNotification.close();
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			if (apNotification) apNotification.close();
			apiErrorCount++;
			return;
		}

		if (apNotification) {
			apNotification.update({ type: 'success', message: 'Synced APs retrieved' });
			setTimeout(apNotification.close, 1000);
		}

		var response = JSON.parse(commandResults.responseBody);
		if (response['status']) {
			clientNotification = showNotification('ca-laptop-1', response['status'], 'bottom', 'center', 'warning');
		} else {
			syncedAPs = [];
			var apSerials = Object.keys(response);
			$.each(apSerials, function() {
				var ap = findDeviceInMonitoring(this.toString());

				memoryUsage = 'N/A';
				if (ap['mem_total']) memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();

				var status = '<i class="fa-solid fa-circle text-danger"></i>';
				var deviceUp = true;
				if (ap['status'] == 'Up') {
					status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
				} else {
					downAPCount++;
					deviceUp = false;
				}
				var ip_address = ap['ip_address'];
				if (!ip_address) ip_address = '';

				var uptime = ap['uptime'] ? ap['uptime'] : 0;
				var duration = moment.duration(uptime * 1000);

				// Make AP Name as a link to Central
				var name = encodeURI(ap['name']);
				var apiURL = localStorage.getItem('base_url');
				var centralBaseURL = centralURLs[0][apiURL];
				if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
				var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';

				var actionBtns = '';
				actionBtns += '<button class="btn-warning btn-action" onclick="verifyKMSEncryptionKey(\'' + ap['serial'] + '\')">Troubleshoot</button> ';

				// Add row to table
				var table = $('#synced-ap-table').DataTable();
				table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['client_count'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr'], deviceUp ? duration.humanize() : '-', actionBtns]);

				$('[data-toggle="tooltip"]').tooltip();

				syncedAPs.push(ap);
			});

			var x = document.getElementById('syncedAPCard');
			if (x) {
				x.hidden = false;
				x.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
			}

			$('#synced-ap-table')
				.DataTable()
				.rows()
				.draw();
		}
	});
}

function refreshSyncedAP() {
	getSyncedAPsForClient(currentClientMac);
}

function verifyKMSEncryptionKey(serial) {
	apNotification = showLongNotification('ca-kms', 'Verifying Encryption Key...', 'bottom', 'center', 'info');
	if (kmsEncryptionKey === '') {
		$.when(getCloudEncryptionKey()).then(function() {
			getKMSDetailsFromAP(serial);
		});
	} else {
		getKMSDetailsFromAP(serial);
	}
}

function getCloudEncryptionKey() {
	encryptionPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/keymgmt/v1/keyhash',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/keymgmt/v1/syncedaplist/<CLIENT-MAC>)');
			apiErrorCount++;
			if (apNotification) apNotification.close();
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			if (apNotification) apNotification.close();
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);
		if (response['Encryption Key Hash']) kmsEncryptionKey = response['Encryption Key Hash'];
		else kmsEncryptionKey = '';
		encryptionPromise.resolve();
	});
	return encryptionPromise.promise();
}

function getKMSDetailsFromAP(deviceSerial) {
	var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 100 }, { command_id: 199 }, { command_id: 200 }, { command_id: 114 }] });

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkKMSStatus, 5000, response.session_id, response.serial);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkKMSStatus(session_id, deviceSerial) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkKMSStatus, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				//var results = decodeURI(response.output);
				var results = response.output;

				// Verify the encryption key matches the key in the cloud
				var apPMKEncryption = results.match(/(\bPMK Encryption Key\s+:)(\S+)/)[2];
				$('#pmkAPDetails').empty();
				if (apPMKEncryption === kmsEncryptionKey) $('#pmkAPDetails').append('<li>KMS Encryption Key: <i class="fa-solid fa-circle text-success"></i><strong> Verified</strong></li>');
				else $('#pmkAPDetails').append('<li>KMS Encryption Key: <i class="fa-solid fa-circle text-danger"></i><strong> Mismatch</strong></li>');
				if (apNotification) apNotification.close();

				// Dissect the PMK Cache Table
				var x = document.getElementById('pmkUserRow');
				var pmkCacheTable = results.match(/\b(PMK Cache Table)((.|\n)*)(\bPMK Cache Count:.+\n)/gm)[0];
				var mpskCacheTable = results.match(/\b(PPSK Cache Table)((.|\n)*)(\bPPSK Cache Count:.+\n)/gm)[0];
				//console.log(mpskCacheTable);
				if (!pmkCacheTable.includes(currentClientMac)) {
					// not in PMK Cache - check the MPSK cache too
					if (!mpskCacheTable.includes(currentClientMac)) {
						$('#pmkAPDetails').append('<li>Client Record: <i class="fa-solid fa-circle text-danger"></i><strong> Client missing from PMK/MPSK Cache on AP</strong></li>');
						if (x) x.hidden = true;
					} else {
						$('#pmkAPDetails').append('<li>Client Record: <i class="fa-solid fa-circle text-danger"></i><strong> Found in MPSK Cache on AP</strong></li>');
						if (x) x.hidden = false;
					}
				} else {
					$('#pmkAPDetails').append('<li>Client Record: <i class="fa-solid fa-circle text-success"></i><strong> Found in PMK Cache on AP</strong></li>');
					if (x) x.hidden = false;
					var lines = pmkCacheTable.split('\n');
					var headerIndex = 2;
					// determine column indexes
					var headerDashes = lines[headerIndex + 1];
					var columnIndexes = [0];
					// Split up based on space followed by a dash
					var re = /\s-/g;
					var matches;
					while ((matches = re.exec(headerDashes))) {
						columnIndexes.push(matches.index + 1);
					}

					// Get column names for indexes
					var columnHeaders = {};
					var headerString = lines[headerIndex];
					for (var i = 0; i < columnIndexes.length; i++) {
						var header = '';
						// Last column header
						if (i + 1 >= columnIndexes.length) {
							header = headerString.substring(columnIndexes[i]);
							header = header.trim();
							columnHeaders[header] = { start: columnIndexes[i] };
						} else {
							header = headerString.substring(columnIndexes[i], columnIndexes[i + 1]);
							header = header.trim();
							columnHeaders[header] = { start: columnIndexes[i], end: columnIndexes[i + 1] };
						}
					}

					// Loop through the lines
					for (var i = headerIndex + 2; i < lines.length; i++) {
						if (lines[i].trim() === '') break;
						else {
							// Pull apart client record
							var clientRow = lines[i];
							if (clientRow.includes(currentClientMac)) {
								//Pull this row apart
								$('#pmkUserDetails').empty();
								$('#pmkUserDetails').append('<li>Mac Address: <strong>' + clientRow.substring(columnHeaders['Client MAC'].start, columnHeaders['Client MAC'].end).trim() + '</strong></li>');
								$('#pmkUserDetails').append('<li>ESSID: <strong>' + clientRow.substring(columnHeaders['ESSID'].start, columnHeaders['ESSID'].end).trim() + '</strong></li>');
								$('#pmkUserDetails').append('<li>User Role: <strong>' + clientRow.substring(columnHeaders['Role'].start, columnHeaders['Role'].end).trim() + '</strong></li>');
								$('#pmkUserDetails').append('<li>VLAN: <strong>' + clientRow.substring(columnHeaders['VLAN'].start, columnHeaders['VLAN'].end).trim() + '</strong></li>');
								$('#pmkUserDetails').append('<li>IP Address: <strong>' + clientRow.substring(columnHeaders['IP'].start, columnHeaders['IP'].end).trim() + '</strong></li>');

								$('#pmkKeyDetails').empty();
								$('#pmkKeyDetails').append('<li>Type: <strong>' + clientRow.substring(columnHeaders['OKC/11r'].start, columnHeaders['OKC/11r'].end).trim() + '</strong></li>');
								$('#pmkKeyDetails').append('<li>Key: <strong>' + clientRow.substring(columnHeaders['Key'].start, columnHeaders['Key'].end).trim() + '</strong></li>');
								$('#pmkKeyDetails').append('<li>Expiry: <strong>' + clientRow.substring(columnHeaders['Expiry'].start, columnHeaders['Expiry'].end).trim() + '</strong></li>');
							}
						}
					}
				}
				$('#PMKCacheModalLink').trigger('click');

				// Dissect the PMK Sync Stats
				//console.log(results);
				$('#pmkRoamingDetails').empty();
				$('#pmkNeighourDetails').empty();
				$('#pmkFTDetails').empty();
				$('#pmkOKCDetails').empty();
				$('#pmkLatencyDetails').empty();
				var startString = 'COMMAND=show ap debug pmk-sync-statistics';
				var startLocation = results.indexOf(startString) + startString.length;
				var pmkSyncStats = results
					.substring(startLocation)
					.trim()
					.split('\n');

				$.each(pmkSyncStats, function() {
					// Roaming Stats
					if (this.includes('PMK update to central  ')) $('#pmkRoamingDetails').append('<li>Update to Central: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK update to central fail')) $('#pmkRoamingDetails').append('<li>Update to Central fail: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK update from central  ')) $('#pmkRoamingDetails').append('<li>Update from Central: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK update from central fail')) $('#pmkRoamingDetails').append('<li>Update from Central fail: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK update from central seqnr mismatch')) $('#pmkRoamingDetails').append('<li>Update from Central Seqnr Mismatch: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK delete from central count')) $('#pmkRoamingDetails').append('<li>Delete from Central: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK delete from central fail')) $('#pmkRoamingDetails').append('<li>Delete from Central fail: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK key deleted event sent to central')) $('#pmkRoamingDetails').append('<li>Key deleted event sent to Central: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK key delete on device')) $('#pmkRoamingDetails').append('<li>Key delete on device: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK Key found in DT cache')) $('#pmkRoamingDetails').append('<li>Key found in DT cache: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK Key not found DT in cache')) $('#pmkRoamingDetails').append('<li>Key not found DT in cache: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('PMK Key found in R1 lcoal cache')) $('#pmkRoamingDetails').append('<li>Key found in R1 local cache: <strong>' + this.match(/\d+/g)[1] + '</strong></li>');
					// Neighbour Stats
					else if (this.includes('Neighbor update to central  ')) $('#pmkNeighourDetails').append('<li>Update to Central: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('Neighbor update to central fail')) $('#pmkNeighourDetails').append('<li>Update to Central fail: <strong>' + this.match(/\d+/g) + '</strong></li>');
					// FT 11r Auth Stats
					else if (this.includes('FT Auth Requests pkt Count')) $('#pmkFTDetails').append('<li>Requests pkt: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Success Responses Count')) $('#pmkFTDetails').append('<li>Success Responses: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Error R0KHUNREACHABLE Count')) $('#pmkFTDetails').append('<li>Error R0KHUNREACHABLE: <strong>' + this.match(/\d+/g)[1] + '</strong></li>');
					else if (this.includes('FT Auth Error invalid MDID IE')) $('#pmkFTDetails').append('<li>Error invalid MDID IE: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Error MDID mismatch Count')) $('#pmkFTDetails').append('<li>Error MDID mismatch: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Error Invalid FT IE Count')) $('#pmkFTDetails').append('<li>Error Invalid FT IE<strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Error Invalid RSN IE Count')) $('#pmkFTDetails').append('<li>Error Invalid RSN IE: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('FT Auth Failed Count')) $('#pmkFTDetails').append('<li>Failed: <strong>' + this.match(/\d+/g) + '</strong></li>');
					// OKC Authentication Stats
					else if (this.includes('OKC Auth Requests pkt Count')) $('#pmkOKCDetails').append('<li>Requests pkt: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('OKC Auth Success Responses Count')) $('#pmkOKCDetails').append('<li>Success Responses: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('OKC Auth Failed Count ')) $('#pmkOKCDetails').append('<li>Failed: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('OKC Key found in DT cache')) $('#pmkOKCDetails').append('<li>Key found in DT cache: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('OKC Key not found DT in cache')) $('#pmkOKCDetails').append('<li>Key not found DT in cache: <strong>' + this.match(/\d+/g) + '</strong></li>');
					// PMK keycache latency Stats
					else if (this.includes('Maximum latency')) $('#pmkLatencyDetails').append('<li>Maximum latency: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('Median latency')) $('#pmkLatencyDetails').append('<li>Median latency: <strong>' + this.match(/\d+/g) + '</strong></li>');
					else if (this.includes('Average latency')) $('#pmkLatencyDetails').append('<li>Average latency: <strong>' + this.match(/\d+/g) + '</strong></li>');
				});

				//console.log(pmkSyncStats);

				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

function getRoamingForClient(clientMac) {
	clientNotification = showNotification('ca-laptop-1', 'Retrieving Raoming History...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/keymgmt/v1/clientroamhistory/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/keymgmt/v1/clientroamhistory/<CLIENT-MAC>)');
			apiErrorCount++;
			if (apNotification) apNotification.close();
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			if (apNotification) apNotification.close();
			apiErrorCount++;
			return;
		}

		var response = JSON.parse(commandResults.responseBody);
		console.log(response);
		if (response.status) showNotification('ca-laptop-1', response.status, 'bottom', 'center', 'warning');
		else {
			if (clientNotification) {
				clientNotification.update({ type: 'success', message: 'Roaming history retrieved' });
				setTimeout(clientNotification.close, 1000);
			}
			// process the response
			//console.log(response);
			/*
			$('#userDetails').empty();
			$('#keyDetails').empty();
			if (response['11r/OKC KEYCACHE ']) {
				// 11r keycache entry - note the stupid extra space on the key!!
				var keyCache = response['11r/OKC KEYCACHE '];
				$('#userDetails').append('<li>Name: <strong>' + keyCache['name'] + '</strong></li>');
				$('#userDetails').append('<li>Mac Address: <strong>' + keyCache['clientmac'] + '</strong></li>');
				$('#userDetails').append('<li>ESSID: <strong>' + keyCache['essid'] + '</strong></li>');
				$('#userDetails').append('<li>User Role: <strong>' + keyCache['role'] + '</strong></li>');
				$('#userDetails').append('<li>VLAN: <strong>' + keyCache['vlan'] + '</strong></li>');

				var originAP = findAPForMAC(keyCache['origin_apmac']);
				if (originAP) {
					// Make AP Name as a link to Central
					var name = encodeURI(originAP['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralBaseURL = centralURLs[0][apiURL];
					if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
					var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + originAP['serial'] + '?casn=' + originAP['serial'] + '&cdcn=' + name + '&nc=access_point';
					$('#userDetails').append('<li>Origin AP: <a href="' + centralURL + '" target="_blank"><strong>' + originAP['name'] + '</strong></a></li>');
				}

				$('#keyDetails').append('<li>Key Type: <strong>' + keyCache['keytype'] + '</strong></li>');
				$('#keyDetails').append('<li>R0 Name: <strong>' + keyCache['R0name'] + '</strong></li>');
				$('#keyDetails').append('<li>MDID: <strong>' + keyCache['MDID'] + '</strong></li>');
				$('#keyDetails').append('<li>Reauth Interval: <strong>' + keyCache['reauth_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Accounting Interval: <strong>' + keyCache['acct_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Key Cache TTL: <strong>' + keyCache['keycache TTL'] + '</strong></li>');
				var timestamp = Date.parse(keyCache['timestamp']);
				$('#keyDetails').append('<li>Timestamp: <strong>' + moment(timestamp).format('LT') + '</strong></li>');
			} else if (response['NON 11r ']) {
				// Non 11r entry - note the stupid extra space on the key!!
				var keyCache = response['NON 11r '];
				$('#userDetails').append('<li>Name: <strong>' + keyCache['name'] + '</strong></li>');
				$('#userDetails').append('<li>Mac Address: <strong>' + keyCache['clientmac'] + '</strong></li>');
				$('#userDetails').append('<li>ESSID: <strong>' + keyCache['essid'] + '</strong></li>');
				$('#userDetails').append('<li>User Role: <strong>' + keyCache['role'] + '</strong></li>');
				$('#userDetails').append('<li>VLAN: <strong>' + keyCache['vlan'] + '</strong></li>');

				var originAP = findAPForMAC(keyCache['origin_apmac']);
				if (originAP) {
					// Make AP Name as a link to Central
					var name = encodeURI(originAP['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralBaseURL = centralURLs[0][apiURL];
					if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
					var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + originAP['serial'] + '?casn=' + originAP['serial'] + '&cdcn=' + name + '&nc=access_point';
					$('#userDetails').append('<li>Origin AP: <a href="' + centralURL + '" target="_blank"><strong>' + originAP['name'] + '</strong></a></li>');
				}

				$('#keyDetails').append('<li>Key Type: <strong>' + keyCache['opmode'] + '</strong></li>');
				$('#keyDetails').append('<li>Expiry Time: <strong>' + keyCache['expiry_time'] + '</strong></li>');
				$('#keyDetails').append('<li>Idle Timeout: <strong>' + keyCache['idle_timeout'] + '</strong></li>');
				$('#keyDetails').append('<li>Reauth Interval: <strong>' + keyCache['reauth_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Accounting Interval: <strong>' + keyCache['acct_interval'] + '</strong></li>');
				$('#keyDetails').append('<li>Roam Cache TTL: <strong>' + keyCache['roamcache TTL'] + '</strong></li>');
				var timestamp = Date.parse(keyCache['timestamp']);
				$('#keyDetails').append('<li>Timestamp: <strong>' + moment(timestamp).format('LT') + '</strong></li>');
			}

			$('#ClientRecordModalLink').trigger('click');

			var x = document.getElementById('syncedAPCard');
			if (x && currentClientMac !== clientMac) {
				x.hidden = true;
			}*/
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	VisualRF functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function showSyncedAPFloorplan() {
	$('#SyncAPPlanModalLink').trigger('click');
}

function showClientRecord() {
	$('#ClientRecordModalLink').trigger('click');
}

function getCampus(repeat) {
	if (!repeat) visualRFNotification = showNotification('ca-new-construction', 'Getting Buildings...', 'bottom', 'center', 'info');
	var apRFNeighbours = [];
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/campus?offset=0&limit=100',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/campus)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		vrfBuildings = [];
		// Loop through the campus objects to get all the floors
		if (response['campus']) {
			$.each(response['campus'], function() {
				// Grab the building list for the individual campus
				getBuildings(0, this['campus_id']);
			});
		} else {
			getCampus(true);
		}
	});
}

function getBuildings(offset, campusId) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/campus/' + campusId + '?offset=' + offset + '&limit=' + vrfLimit,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/campus/<campus_id>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		vrfBuildings = vrfBuildings.concat(response['buildings']);
		offset += vrfLimit;
		if (offset < response['building_count']) getBuildings(offset);
		else {
			// maybe save to indexedDB...
			loadBuildingSelector();

			if (visualRFNotification) {
				visualRFNotification.update({ message: 'Retrieved Building Information', type: 'success' });
				setTimeout(visualRFNotification.close, 1000);
			}
		}
	});
}

function getFloors(offset) {
	vrfBuildingId = document.getElementById('kms-buildingselector').value;

	if (offset == 0) {
		resetCanvases();
		vrfFloors = [];
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/building/' + vrfBuildingId + '?offset=' + offset + '&limit=' + vrfLimit + '&units=' + units,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/building/<building_id>)');
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
				var authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getFloors(offset);
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			if (response.floor_count == 0) {
				showNotification('ca-floors', 'The ' + response['building']['building_name'] + ' building has no floors', 'bottom', 'center', 'danger');
				resetCanvases();
			} else {
				vrfFloors = vrfFloors.concat(response['floors']);
				offset += vrfLimit;
				if (offset < response['floor_count']) getFloors(offset);
				else {
					// maybe save to indexedDB...
					loadFloorSelector();
				}
			}
		}
	});
}

function getFloorData() {
	vrfFloorId = document.getElementById('kms-floorselector').value;

	//get Floorplan
	if (visualRFNotification) visualRFNotification.update({ message: 'Attempting to obtain floorplan...', type: 'warning' });
	else visualRFNotification = showNotification('ca-floors', 'Getting Floor information...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + vrfFloorId + '/image?limit=100',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>/image)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		vrfFloorplan = response;
		if (!vrfFloorplan || vrfFloorplan === '') {
			visualRFNotification.update({ message: 'Attempting to obtain floorplan...', type: 'warning' });
		} else {
			drawFloorplan();

			if (visualRFNotification) {
				visualRFNotification.update({ message: 'Retrieved Floorplan', type: 'success' });
				setTimeout(visualRFNotification.close, 1000);
			}
		}
	});
}

function drawFloorplan() {
	// Draw floorplan for specific part of AirMatch Page
	var superView = document.getElementById('kms-visualPlan');

	var canvas = document.getElementById('kms-floorplanCanvas');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var apCanvas = document.getElementById('kms-apCanvas');
	var apCtx = apCanvas.getContext('2d');
	apCtx.clearRect(0, 0, apCanvas.width, apCanvas.height);

	var background = new Image();
	background.src = 'data:image/png;base64,' + vrfFloorplan;
	background.onload = function() {
		var normalWidth = superView.offsetWidth - 40;
		var normalHeight = normalWidth * (background.height / background.width);
		updateSizes(normalWidth, normalHeight);
		ctx.drawImage(background, 0, 0, normalWidth, normalHeight);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
	};

	needChannelList = true;

	loadAPsForFloor(0);
}

function loadAPsForFloor(offset) {
	if (offset == 0) {
		vrfAPs = [];
		vrfChannels = { 2: [], 5: [], 6: [] };
		clearAPCanvas();
	}

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + vrfFloorId + '/access_point_location?offset=' + offset + '&limit=' + vrfLimit + '&units=' + units,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>/access_point_location)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		currentFloor = response['floor'];
		vrfAPs = vrfAPs.concat(response['access_points']);
		//console.log(vrfAPs);
		offset += vrfLimit;
		if (offset < response['access_point_count']) {
			loadAPsForFloor(offset);
		} else {
			drawAPsOnFloorplan();
		}
	});
}

function drawAPsOnFloorplan() {
	// Clear APs from view
	clearAPCanvas();

	// Draw APs on floorplan
	vrfSelectedAPs = {};
	var canvas = document.getElementById('kms-apCanvas');
	var floorplanCanvas = document.getElementById('kms-floorplanCanvas');
	var ctx = canvas.getContext('2d');
	$.each(vrfAPs, function() {
		var apLabel1 = this['ap_name'];
		var apLabel2 = null;
		var currentAP = findDeviceInMonitoring(this['serial_number']);

		x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
		y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
		// AP with no Radar hits will be white.
		ctx.fillStyle = apColors[1];
		var hitCounter = 0;

		$.each(syncedAPs, function() {
			foundAP = this;
			if (foundAP.macaddr === currentAP.macaddr) {
				ctx.fillStyle = apColors[0];
			}
		});

		ctx.beginPath();
		ctx.roundRect(x - 7, y - 7, 14, 14, 2);
		ctx.fill();
		ctx.drawImage(apImage, x - 8, y - 8, 16, 16);

		if (apLabel2) {
			apLabel1_size = ctx.measureText(apLabel1);
			apLabel2_size = ctx.measureText(apLabel2);
			var boxSize = apLabel1_size;
			if (apLabel2_size.width > apLabel1_size.width) boxSize = apLabel2_size;
			ctx.strokeStyle = 'black';
			ctx.shadowColor = 'black';
			ctx.shadowBlur = 2;
			ctx.fillStyle = 'white';
			ctx.fillRect(x - boxSize.width / 2 - 4, y + 12, boxSize.width + 6, 24);
			ctx.shadowBlur = 0;
			ctx.fillStyle = 'black';
			ctx.fillText(apLabel1, x - apLabel1_size.width / 2, y + 22);
			ctx.fillText(apLabel2, x - apLabel2_size.width / 2, y + 32);
		} else if (apLabel1) {
			apLabel1_size = ctx.measureText(apLabel1);
			ctx.strokeStyle = 'black';
			ctx.shadowColor = 'black';
			ctx.shadowBlur = 2;
			ctx.fillStyle = 'white';
			ctx.fillRect(x - apLabel1_size.width / 2 - 4, y + 12, apLabel1_size.width + 6, 14);
			ctx.shadowBlur = 0;
			ctx.fillStyle = 'black';
			ctx.fillText(apLabel1, x - apLabel1_size.width / 2, y + 22);
		}
	});

	needChannelList = false;
}

function clearAPCanvas() {
	var apCanvas = document.getElementById('kms-apCanvas');
	var apCtx = apCanvas.getContext('2d');
	apCtx.clearRect(0, 0, apCanvas.width, apCanvas.height);
}

function clearFloorplanCanvas() {
	var floorplanCanvas = document.getElementById('kms-floorplanCanvas');
	var floorplanCtx = floorplanCanvas.getContext('2d');
	floorplanCtx.clearRect(0, 0, floorplanCanvas.width, floorplanCanvas.height);
}

function resetCanvases() {
	clearAPCanvas();
	clearFloorplanCanvas();
	var rfVisualPlanHeight = 0;
	document.getElementById('kms-visualPlan').setAttribute('style', 'height:' + rfVisualPlanHeight + 'px');
	document.getElementById('kms-visualPlan').style.height = rfVisualPlanHeight + 'px';
}

function loadBuildingSelector() {
	// remove old data from the selector
	var selectOpt = document.getElementById('kms-buildingselector');
	selectOpt.options.length = 0;

	vrfBuildings.sort((a, b) => {
		const siteA = a.building_name.toUpperCase(); // ignore upper and lowercase
		const siteB = b.building_name.toUpperCase(); // ignore upper and lowercase
		// Sort on Site Name
		if (siteA < siteB) {
			return -1;
		}
		if (siteA > siteB) {
			return 1;
		}
		return 0;
	});

	$.each(vrfBuildings, function() {
		// Add group to the dropdown selector
		$('#kms-buildingselector').append($('<option>', { value: this['building_id'], text: this['building_name'] }));
		$('#kms-buildingselector').selectpicker('refresh');
	});
}

function loadFloorSelector() {
	// remove old data from the selector
	var selectOpt = document.getElementById('kms-floorselector');
	selectOpt.options.length = 0;

	vrfFloors.sort((a, b) => {
		const floorA = a.floor_level; // ignore upper and lowercase
		const floorB = b.floor_level; // ignore upper and lowercase
		// Sort on Site Name
		if (floorA > floorB) {
			return -1;
		}
		if (floorA < floorB) {
			return 1;
		}
		return 0;
	});

	$.each(vrfFloors, function() {
		// Add floors to the dropdown selector
		$('#kms-floorselector').append($('<option>', { value: this['floor_id'], text: this['floor_name'] }));
		$('#kms-floorselector').selectpicker('refresh');
	});
}

function updateSizes(width, height) {
	var canvas = document.getElementById('kms-floorplanCanvas');
	canvas.width = width * ratio;
	canvas.height = height * ratio;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	canvas.getContext('2d').scale(ratio, ratio);

	var apCanvas = document.getElementById('kms-apCanvas');
	apCanvas.width = width * ratio;
	apCanvas.height = height * ratio;
	apCanvas.style.width = width + 'px';
	apCanvas.style.height = height + 'px';
	apCanvas.getContext('2d').scale(ratio, ratio);

	var rfVisualPlanHeight = height + 20;
	document.getElementById('kms-visualPlan').setAttribute('style', 'height:' + rfVisualPlanHeight + 'px');
	document.getElementById('kms-visualPlan').style.height = rfVisualPlanHeight + 'px';
}
