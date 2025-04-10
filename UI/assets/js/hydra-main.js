/*
Central Automation v1.6.0
Updated: 1.37.4
Aaron Scott (WiFi Downunder) 2021-2025
*/

var hydraMonitoringData = {};
var authNotification;
var authCounter;
var authPromise;
var authErrorCount;
var goToAllowed = true;

var cop_url = 'https://apigw-';

// Data Dictionary Keys
var statusKey = 'status';
var apKey = 'aps';
var switchKey = 'switches';
var gatewayKey = 'gateways';
var siteKey = 'sites';

/*  ----------------------------------------------------------------------------------
		Utility functions
	---------------------------------------------------------------------------------- */

function saveGlobalSettings() {
	checkScaleConfig();
	// Save all the global settings (except for the accounts)
	localStorage.setItem('ap_naming_format', $('#ap_naming_format').val());
	localStorage.setItem('hostname_variable', $('#hostname_variable').val());
	localStorage.setItem('port_variable_format', $('#port_variable_format').val());
	localStorage.setItem('refresh_rate', $('#refresh_rate').val());
	localStorage.setItem('data_optimization', document.getElementById('scaleselector').value);
	localStorage.setItem('load_clients', document.getElementById('load_clients_wireless').checked);
	localStorage.setItem('load_clients_wired', document.getElementById('load_clients_wired').checked);
	localStorage.setItem('load_aps', document.getElementById('load_aps').checked);
	localStorage.setItem('load_switches', document.getElementById('load_switches').checked);
	localStorage.setItem('load_gateways', document.getElementById('load_gateways').checked);
	if (!document.getElementById('load_gateways').checked) document.getElementById('load_gateway_details').checked = false;
	localStorage.setItem('load_gateway_details', document.getElementById('load_gateway_details').checked);
	localStorage.setItem('load_group_properties', document.getElementById('load_group_properties').checked);
	localStorage.setItem('load_vc_config', document.getElementById('load_vc_config').checked);
	localStorage.setItem('load_airmatch_events', document.getElementById('load_airmatch_events').checked);
	localStorage.setItem('load_optimization_history', document.getElementById('load_optimization_history').checked);
	localStorage.setItem('qr_color', $('#color_picker').val());
	localStorage.setItem('qr_logo', $('#qr_logo').val());
	// remove existing client data
	if (!document.getElementById('load_clients_wireless').checked) {
		saveDataToDB('monitoring_wirelessClients', JSON.stringify([]));
	}
	if (!document.getElementById('load_clients_wired').checked) {
		saveDataToDB('monitoring_wiredClients', JSON.stringify([]));
	}
	if (!document.getElementById('load_aps').checked) {
		saveDataToDB('monitoring_aps', JSON.stringify([]));
	}
	if (!document.getElementById('load_switches').checked) {
		saveDataToDB('monitoring_switches', JSON.stringify([]));
	}
	if (!document.getElementById('load_gateways').checked) {
		saveDataToDB('monitoring_gateways', JSON.stringify([]));
		saveDataToDB('monitoring_controllers', JSON.stringify([]));
	}
	logInformation('Central Automation Studio settings saved');
	
	// remove that update is in progress
	localStorage.removeItem('update_in_progress');
}

function checkScaleConfig() {
	if (document.getElementById('load_clients_wireless').checked && document.getElementById('load_clients_wired').checked && document.getElementById('load_aps').checked && document.getElementById('load_switches').checked && document.getElementById('load_gateways').checked && document.getElementById('load_gateway_details').checked && document.getElementById('load_group_properties').checked && document.getElementById('load_airmatch_events').checked && document.getElementById('load_optimization_history').checked && document.getElementById('load_vc_config').checked) {
		$('#scaleselector').val('full');
	} else if (!document.getElementById('load_clients_wireless').checked && !document.getElementById('load_clients_wired').checked && !document.getElementById('load_aps').checked && !document.getElementById('load_switches').checked && !document.getElementById('load_gateways').checked && !document.getElementById('load_gateway_details').checked && !document.getElementById('load_group_properties').checked && !document.getElementById('load_airmatch_events').checked && !document.getElementById('load_optimization_history').checked && !document.getElementById('load_vc_config').checked) {
		$('#scaleselector').val('group');
	} else if (!document.getElementById('load_clients_wireless').checked && !document.getElementById('load_clients_wired').checked && document.getElementById('load_aps').checked && document.getElementById('load_switches').checked && document.getElementById('load_gateways').checked && !document.getElementById('load_gateway_details').checked && !document.getElementById('load_group_properties').checked && !document.getElementById('load_airmatch_events').checked && !document.getElementById('load_optimization_history').checked && !document.getElementById('load_vc_config').checked) {
		$('#scaleselector').val('scale');
	} else {
		$('#scaleselector').val('custom');
	};
	$('#scaleselector').selectpicker('refresh')
}

function updateScaleSettings() {
	var scale = document.getElementById('scaleselector').value;
	if (scale === "full") {
		document.getElementById('load_clients_wireless').checked = true;
		document.getElementById('load_clients_wired').checked = true;
		document.getElementById('load_aps').checked = true;
		document.getElementById('load_switches').checked = true;
		document.getElementById('load_gateways').checked = true;
		document.getElementById('load_gateway_details').checked = true;
		document.getElementById('load_group_properties').checked = true;
		document.getElementById('load_vc_config').checked = true;
		document.getElementById('load_airmatch_events').checked = true;
		document.getElementById('load_optimization_history').checked = true;
	} else if (scale === "group") {
		document.getElementById('load_clients_wireless').checked = false;
		document.getElementById('load_clients_wired').checked = false;
		document.getElementById('load_aps').checked = false;
		document.getElementById('load_switches').checked = false;
		document.getElementById('load_gateways').checked = false;
		document.getElementById('load_gateway_details').checked = false;
		document.getElementById('load_group_properties').checked = false;
		document.getElementById('load_vc_config').checked = false;
		document.getElementById('load_airmatch_events').checked = false;
		document.getElementById('load_optimization_history').checked = false;
	} else if (scale === "scale") {
		document.getElementById('load_clients_wireless').checked = false;
		document.getElementById('load_clients_wired').checked = false;
		document.getElementById('load_aps').checked = true;
		document.getElementById('load_switches').checked = true;
		document.getElementById('load_gateways').checked = true;
		document.getElementById('load_gateway_details').checked = false;
		document.getElementById('load_group_properties').checked = false;
		document.getElementById('load_vc_config').checked = false;
		document.getElementById('load_airmatch_events').checked = false;
		document.getElementById('load_optimization_history').checked = false;
	}
	saveGlobalSettings();
}

function onFinishSetup() {
	clearErrorLog();
	// Save all supplied addresses and details
	saveGlobalSettings();
	authRefreshForAll();
}

function loadDashboardData(refreshrate) {
	// Check if we need to get the latest data - or can we just load it from localStorage
	goToAllowed = true;
	if (!localStorage.getItem('hydra_update')) {
		console.log('Reading new hydra monitoring data from Central');
		getDashboardData();
	} else {
		loadAccountDetails();
		var lastRefresh = new Date(parseInt(localStorage.getItem('hydra_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes > refreshrate) {
			console.log('Reading new hydra monitoring data from Central');
			getDashboardData();
		} else {
			console.log('Reading hydra monitoring data from the IndexedDB');
			const transaction = db.transaction('general', 'readonly');
			const store = transaction.objectStore('general');
			const monitoringQuery = store.get('monitoring_hydra');
			monitoringQuery.onsuccess = function() {
				if (monitoringQuery.result && monitoringQuery.result.data) {
					hydraMonitoringData = JSON.parse(monitoringQuery.result.data);
					loadHydraTable();
				}
			};
		}
	}
}

function saveDataToDB(indexKey, data) {
	const transaction = db.transaction('general', 'readwrite');
	const store = transaction.objectStore('general');
	store.put({ key: indexKey, data: data });
}

function deleteDataFomDB(indexKey) {
	const transaction = db.transaction('general', 'readwrite');
	const store = transaction.objectStore('general');
	const request = store.delete(indexKey);

	request.onsuccess = () => {
		console.log(indexKey+': Data deleted');
	};

	request.onerror = err => {
		console.error('Failed to delete data: ${err}');
	};
}

/*  ----------------------------------------------------------------------------------
		Authentication functions
	---------------------------------------------------------------------------------- */
function authRefreshForAll() {
	authNotification = showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
	authCounter = 0;
	authErrorCount = 0;
	authPromise = new $.Deferred();

	var account_details = localStorage.getItem('account_details');
	if (account_details != null && account_details != 'undefined') {
		centralCredentials = JSON.parse(account_details);
		$.each(centralCredentials, function() {
			authRefreshForAccount(this['client_id']);
		});
		return authPromise.promise();
	}
}

function checkAuthComplete() {
	if (authCounter >= centralCredentials.length) {
		if (authErrorCount > 0) {
			var path = window.location.pathname;
			var page = path.split('/').pop();
			if (page.includes('settings')) {
				if (centralCredentials.length > 1) {
					Swal.fire({
						title: 'Central API connection failed',
						text: 'One or more Central accounts failed to authenticate correctly',
						icon: 'error',
						showCancelButton: true,
						cancelButtonColor: '#d33',
						cancelButtonText: "I'll fix it",
						confirmButtonColor: '#3085d6',
						confirmButtonText: 'Go to Hydra Dashboard Anyway',
					}).then(result => {
						if (result.isConfirmed) {
							var path = window.location.pathname;
							var page = path.split('/').pop();
							if (page.includes('settings')) {
								// If more than one account configured go to Hydra dashboard
								if (centralCredentials.length > 1) {
									window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'hydra-dashboard.html';
								} else {
									// if only one account configured, go to the individual dashboard
									loadIndividualAccount(centralCredentials[0].client_id, 0);
								}
							}
							if (authNotification) authNotification.close();
						}
					});
				}
			}
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();
			if (page.includes('settings')) {
				// If more than one account configured go to Hydra dashboard
				if (centralCredentials.length > 1) {
					window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'hydra-dashboard.html';
				} else {
					// if only one account configured, go to the individual dashboard
					loadIndividualAccount(centralCredentials[0].client_id, 0);
				}
			}
			if (authNotification) authNotification.close();
		}
		authPromise.resolve();
	}
}

function authRefreshForAccount(clientID) {
	if (getRefreshTokenforClientID(clientID) !== '' && getRefreshTokenforClientID(clientID) != null) {
		if (isAccessTokenExpiredForClientID(clientID)) {
			var settings = {
				url: getAPIURL() + '/auth/refresh',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					client_id: clientID,
					client_secret: getClientSecretforClientID(clientID),
					access_token: getAccessTokenforClientID(clientID),
					refresh_token: getRefreshTokenforClientID(clientID),
					base_url: getbaseURLforClientID(clientID),
				}),
			};
	
			$.ajax(settings).done(function(response, textStatus, jqXHR) {
				//console.log(response);
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/auth/refresh)');
						return;
					}
				}
				
				var cluster = getAccountforClientID(clientID);
				if (response.hasOwnProperty('error')) {
					logError(response.error_description.replace('refresh_token', 'Refresh Token') + ' for Central Account "' + getNameforClientID(clientID) + '"');
					showNotification('ca-padlock', response.error_description.replace('refresh_token', 'Refresh Token') + ' for Central Account "' + getNameforClientID(clientID) + '"', 'bottom', 'center', 'danger');
					cluster['refresh_token'] = '';
					cluster['access_token'] = '';
					cluster['expires_at'] = '';
					updateAccountDetails(cluster);
					authErrorCount++;
				} else {
					var cluster = getAccountforClientID(clientID);
					cluster['refresh_token'] = response.refresh_token;
					cluster['access_token'] = response.access_token;
					// Create timestamp for access token expiry
					var nowDatestamp = Date.now();
					nowDatestamp = nowDatestamp + (response.expires_in*1000)
					cluster['expires_at'] = nowDatestamp;
					updateAccountDetails(cluster);
					
					var d = new Date(nowDatestamp);
					console.log(getNameforClientID(clientID) + ': Access Token is valid until ' + d.toTimeString());
	
					var path = window.location.pathname;
					var page = path.split('/').pop();
					if (page.includes('settings')) {
						// refresh settings page table
						loadAccountDetails();
					}
					showNotification('ca-padlock', 'Authentication for Central Account "' + getNameforClientID(clientID) + '" was successful', 'bottom', 'center', 'success');
					
				}
				authCounter++;
				checkAuthComplete();
			})
			.fail(function(XMLHttpRequest, textStatus, errorThrown) {
				console.log(getAccountforClientID(clientID))
				if (XMLHttpRequest.readyState == 4) {
					// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
					showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
				} else if (XMLHttpRequest.readyState == 0) {
					// Network error (i.e. connection refused, access denied due to CORS, etc.)
					showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
				} else {
					// something weird is happening
				}
				authErrorCount++;
				authCounter++;
				checkAuthComplete();
			});
		} else {
			console.log('Access Token still valid for '+ getNameforClientID(clientID));
			authCounter++;
			checkAuthComplete();
		}
	} else {
		// Missing refresh token
		showNotification('ca-padlock', 'Missing Refresh Token for "'+getNameforClientID(clientID) + '"', 'bottom', 'center', 'danger');
		authErrorCount++;
		authCounter++;
		checkAuthComplete();
	}
}




/*  ----------------------------------------------------------------------------------
		Monitoring functions
	---------------------------------------------------------------------------------- */

function getDashboardData() {
	authPromise = new $.Deferred();
	// Try and refresh the token
	showNotification('ca-api', 'Updating Hydra Dashboard Data...', 'bottom', 'center', 'primary');
	goToAllowed = false;
	$.when(authRefreshForAll()).then(function() {
		goToAllowed = true;
		// Refresh card data
		console.log('Authentication attempted for all accounts')
		var account_details = localStorage.getItem('account_details');
		if (account_details != null && account_details != 'undefined') {
			centralCredentials = JSON.parse(account_details);
			for (var i=0;i<centralCredentials.length;i++) {
				var account = centralCredentials[i];
				var clientID = account.client_id;
				if (account.refresh_token && account.refresh_token !== '') {
					setTimeout(getOverviewDataForAccount, apiDelay*3*i, clientID);
				} else {
					var dataFramework = { [statusKey]: false, [apKey]: [], [switchKey]: [], [gatewayKey]: [], [siteKey]: [] };
					hydraMonitoringData[clientID] = dataFramework;
				}
			}
		}
	});
}

function getOverviewDataForAccount(clientID) {
	
	var dataFramework = { [statusKey]: true, [apKey]: [], [switchKey]: [], [gatewayKey]: [], [siteKey]: [] };
	
	hydraMonitoringData[clientID] = dataFramework;
	showNotification('ca-cloud-data-download', 'Updating data for "' + getNameforClientID(clientID) + '"', 'bottom', 'center', 'info');
	
	getWirelessClientOverviewForAccount(clientID);
	getWiredClientOverviewForAccount(clientID);
	getAPOverviewForAccount(clientID);
	getSwitchOverviewForAccount(clientID);
	getGatewayOverviewForAccount(clientID);
	getSiteDataForAccount(clientID, 0);
	
	localStorage.setItem('hydra_update', +new Date());
}

function loadHydraTable() {
	$('#account-table')
		.DataTable()
		.rows()
		.remove();
	for (let k in hydraMonitoringData) {
		//console.log(hydraMonitoringData[k]);

		// Process Clients
		var clientString = '';
		if (hydraMonitoringData[k]['wirelessClientsUp']) {
			clientString += '<i class="fa-solid fa-laptop fa-fw text-success"></i><span class="text-success me-2"><strong> ' + hydraMonitoringData[k]['wirelessClientsUp'] + ' </strong></span>';
		} else {
			clientString += '<i class="fa-solid fa-laptop fa-fw"></i><span class="me-2"> 0 </span>';
		}
		if (hydraMonitoringData[k]['wirelessClientsDown']) {
			clientString += '<i class="fa-solid fa-laptop fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + hydraMonitoringData[k]['wirelessClientsDown'] + ' </strong></span>';
		} else {
			clientString += '<i class="fa-solid fa-laptop fa-fw"></i><span class="me-2"> 0 </span>';
		}
		if (hydraMonitoringData[k]['wiredClientsUp']) {
			clientString += '<i class="fa-solid fa-computer fa-fw text-success"></i><span class="text-success me-2"><strong> ' + hydraMonitoringData[k]['wiredClientsUp'] + ' </strong></span>';
		} else {
			clientString += '<i class="fa-solid fa-computer fa-fw"></i><span class="me-2"> 0 </span>';
		}
		if (hydraMonitoringData[k]['wiredClientsDown']) {
			clientString += '<i class="fa-solid fa-computer fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + hydraMonitoringData[k]['wiredClientsDown'] + ' </strong></span>';
		} else {
			clientString += '<i class="fa-solid fa-computer fa-fw"></i><span class="me-2"> 0 </span>';
		}

		// Process APs
		var apsUp = 0;
		var apsDown = 0;
		if (hydraMonitoringData[k]['apsUp']) apsUp = hydraMonitoringData[k]['apsUp'];
		if (hydraMonitoringData[k]['apsDown']) apsDown = hydraMonitoringData[k]['apsDown'];

		var apString = '';
		if (apsUp > 0) apString += '<i class="fa-solid  fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + apsUp + ' </strong></ispan>';
		else apString += '<i class="fa-solid  fa-arrow-up fa-fw"></i><span class="me-2"> ' + apsUp + ' </span>';
		if (apsDown > 0) apString += '<i class="fa-solid  fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + apsDown + ' </strong></span>';
		else apString += '<i class="fa-solid  fa-arrow-down fa-fw"></i><span class="me-2"> ' + apsDown + ' </span>';

		// Process Switches
		var switchesUp = 0;
		var switchesDown = 0;
		if (hydraMonitoringData[k]['switchesUp']) switchesUp = hydraMonitoringData[k]['switchesUp'];
		if (hydraMonitoringData[k]['switchesDown']) switchesDown = hydraMonitoringData[k]['switchesDown'];

		var switchesString = '';
		if (switchesUp > 0) switchesString += '<i class="fa-solid  fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + switchesUp + ' </strong></span>';
		else switchesString += '<i class="fa-solid  fa-arrow-up fa-fw"></i><span class="me-2"> ' + switchesUp + ' </span>';
		if (switchesDown > 0) switchesString += '<i class="fa-solid  fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + switchesDown + ' </strong></span>';
		else switchesString += '<i class="fa-solid  fa-arrow-down fa-fw"></i><span class="me-2"> ' + switchesDown + ' </span>';

		// Process Gateways
		var gatewaysUp = 0;
		var gatewaysDown = 0;
		if (hydraMonitoringData[k]['gatewaysUp']) gatewaysUp = hydraMonitoringData[k]['gatewaysUp'];
		if (hydraMonitoringData[k]['gatewaysDown']) gatewaysDown = hydraMonitoringData[k]['gatewaysDown'];

		var gatewayString = '';
		if (gatewaysUp > 0) gatewayString += '<i class="fa-solid  fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + gatewaysUp + ' </strong></span>';
		else gatewayString += '<i class="fa-solid  fa-arrow-up fa-fw"></i><span class="me-2"> ' + gatewaysUp + ' </span>';
		if (gatewaysDown > 0) gatewayString += '<i class="fa-solid  fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + gatewaysDown + ' </strong></span>';
		else gatewayString += '<i class="fa-solid  fa-arrow-down fa-fw"></i><span class="me-2"> ' + gatewaysDown + ' </span>';

		// Process sites
		var siteDanger = 0;
		var siteWarning = 0;
		var siteMinor = 0;
		var siteOK = hydraMonitoringData[k]['sites'].length;
		$.each(hydraMonitoringData[k]['sites'], function() {
			siteIssues = 4;
			var status = '<i class="fa-solid fa-circle fa-fw text-success"></i>';
			var healthReason = '';
			if (this['wan_uplinks_down'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'Gateway with WAN links down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wan_tunnels_down'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'Gateway with VPN Tunnels down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_cpu_high'] > 1) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'APs with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_cpu_high'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'AP with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_cpu_high'] > 1) {
				status = '<i class="fa-solid fa-circle text-danger"></i>';
				healthReason = 'Switches with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_cpu_high'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'Switch with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['branch_cpu_high'] > 1) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'Gateways with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['branch_cpu_high'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'Gateway with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_device_status_down'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'One or more APs are down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_device_status_down'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-danger"></i>';
				healthReason = 'One or more switches are down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['device_high_noise_5ghz'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-warning"></i>';
				healthReason = 'High noise on 5GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_noise_2_4ghz'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-warning"></i>';
				healthReason = 'High noise on 2.4GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_ch_5ghz'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-warning"></i>';
				healthReason = 'High channel utilization on 5GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_ch_2_4ghz'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-warning"></i>';
				healthReason = 'High channel utilization on 2.4GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_mem'] > 0) {
				status = '<i class="fa-solid fa-circle fa-fw text-minor"></i>';
				healthReason = 'Devices with high memory utilization';
				if (siteIssues > 3) {
					siteIssues = 3;
					siteMinor++;
					siteOK--;
				}
			}
		});
		var siteString = '';
		if (siteOK > 0) siteString += '<i class="fa-solid fa-circle fa-fw-pointer text-success"></i><span class="text-success"><strong> ' + siteOK + ' </strong></span>';
		if (siteDanger > 0) siteString += '<i class="fa-solid fa-circle fa-fw-pointer text-danger"></i><span class="text-danger"><strong> ' + siteDanger + ' </strong></span>';
		if (siteWarning > 0) siteString += '<i class="fa-solid fa-circle fa-fw-pointer text-warning"></i><span class="text-warning"><strong> ' + siteWarning + ' </strong></span>';
		if (siteMinor > 0) siteString += '<i class="fa-solid fa-circle fa-fw-pointer text-minor"></i><span class="text-minor"><strong> ' + siteMinor + ' </strong></span>';

		var checkBtn = '<button class="btn btn-round btn-sm btn-outline btn-info" onclick="loadIndividualAccount(\'' + k + '\',1)">Go To Account <i class="fa-solid  fa-arrow-right text-default"><strong></button>';
		
		var accountStatus = '<i class="fa-solid fa-circle fa-fw-pointer text-danger"></i>'
		if (hydraMonitoringData[k]['status']) accountStatus = '<i class="fa-solid fa-circle fa-fw-pointer text-success"></i>';

		var table = $('#account-table').DataTable();
		table.row.add([accountStatus, '<strong>' + getNameforClientID(k) + '</strong>', clientString, apString, switchesString, gatewayString, siteString, checkBtn]);
		$('#account-table')
			.DataTable()
			.rows()
			.draw();
	}
}

function loadIndividualAccount(client_id, hydra) {
	if (!goToAllowed) {
		if (authNotification) authNotification.update({ type: 'warning', message: 'Authenticating with Central is still in progress' });
		else authNotification = showNotification('ca-padlock', 'Authenticating with Central is still in progress', 'bottom', 'center', 'warning')
	} else {
		// get account details and save them out
		var account = getAccountforClientID(client_id);
		
		// If COP account - write the base_url with the COP address
		var baseURL = account.base_url;
		if (baseURL === getAPIGateway('Central On-Prem')) {
			console.log('Setting COP address');
			baseURL = cop_url + account.cop_address;
			localStorage.setItem('is_cop', '1');
		} else {
			localStorage.removeItem('is_cop');
		}
		
		localStorage.setItem('client_id', account.client_id);
		localStorage.setItem('client_secret', account.client_secret);
		localStorage.setItem('base_url', baseURL);
		localStorage.setItem('refresh_token', account.refresh_token);
		localStorage.setItem('access_token', account.access_token);
		localStorage.setItem('expires_at', account.expires_at);
	
		// Jump to individual dashboard and refresh data
		if (hydra == 1) localStorage.setItem('from_hydra', hydra);
		else localStorage.removeItem('from_hydra');
		
		// If same account as last time - no need to load all the data again
		if (account.central_id !== localStorage.getItem('central_id')) {
			localStorage.setItem('central_id', account.central_id);
			
			saveDataToDB('monitoring_aps', JSON.stringify([]));
			saveDataToDB('monitoring_switches', JSON.stringify([]));
			saveDataToDB('monitoring_gateways', JSON.stringify([]));
			saveDataToDB('monitoring_controllers', JSON.stringify([]));
			saveDataToDB('monitoring_sites', JSON.stringify([]));
			saveDataToDB('monitoring_groups', JSON.stringify([]));
			saveDataToDB('monitoring_swarms', JSON.stringify([]));
			saveDataToDB('monitoring_wirelessClients', JSON.stringify([]));
			saveDataToDB('monitoring_wiredClients', JSON.stringify([]));
			saveDataToDB('inventory_ap', JSON.stringify([]));
			saveDataToDB('inventory_switch', JSON.stringify([]));
			saveDataToDB('inventory_gateway', JSON.stringify([]));
			
			localStorage.removeItem('monitoring_update');
			
			// Clear out inventory data for old customer
			localStorage.removeItem('inventory_update');
			
			
			deleteDataFomDB('monitoring_bssids');
		}
		window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'dashboard.html';
	}
}

function getWirelessClientOverviewForAccount(clientID) {
	//showNotification("ca-laptop-1", 'Getting wireless clients for "'+getNameforClientID(clientID)+'"', "bottom", "center", 'info');
	var settingsConnected = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			//url: getbaseURLforClientID(clientID) + '/monitoring/v1/clients/wireless?calculate_total=true',
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&timerange=3H&client_type=WIRELESS&client_status=CONNECTED',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsConnected).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/clients)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
		} else {
			hydraMonitoringData[clientID]['wirelessClientsUp'] = response.total;
			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});

	var settingsNotConnected = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			//url: getbaseURLforClientID(clientID) + '/monitoring/v1/clients/wireless?calculate_total=true',
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&timerange=3H&client_type=WIRELESS&client_status=FAILED_TO_CONNECT',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsNotConnected).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/clients)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
		} else {
			hydraMonitoringData[clientID]['wirelessClientsDown'] = response.total;
			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function getWiredClientOverviewForAccount(clientID) {
	var settingsConnected = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			//url: getbaseURLforClientID(clientID) + '/monitoring/v1/clients/wireless?calculate_total=true',
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiLimit + '&timerange=3H&client_type=WIRED&client_status=CONNECTED&show_usage=true&show_manufacturer=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsConnected).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
		} else {
			hydraMonitoringData[clientID]['wiredClientsUp'] = response.total;
			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});

	var settingsNotConnected = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			//url: getbaseURLforClientID(clientID) + '/monitoring/v1/clients/wireless?calculate_total=true',
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiLimit + '&timerange=3H&client_type=WIRED&client_status=FAILED_TO_CONNECT&show_usage=true&show_manufacturer=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsNotConnected).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/clients)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
		} else {
			hydraMonitoringData[clientID]['wiredClientsDown'] = response.total;
			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

/*function getWiredClientDataForAccount(clientID) {
	//showNotification("ca-computer-monitor", 'Getting wired clients for "'+getNameforClientID(clientID)+'"', "bottom", "center", 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v1/clients/wired?calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/clients)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
		} else {
			hydraMonitoringData[clientID]['wiredClients'] = response.total;
			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}*/

function getAPOverviewForAccount(clientID) {
	// Get Up AP Count for account
	var settingsUp = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/aps?status=Up&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsUp).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/aps)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['apsUp'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});

	// Get Down AP Count for account
	var settingsDown = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/aps?status=Down&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsDown).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/aps)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['apsDown'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function getSwitchOverviewForAccount(clientID) {
	// Get Up AP Count for account
	var settingsUp = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v1/switches?status=Up&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsUp).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/switches)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			if (document.getElementById('switch_icon')) document.getElementById('switch_icon').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['switchesUp'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});

	// Get Down AP Count for account
	var settingsDown = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v1/switches?status=Down&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsDown).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/switches)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			if (document.getElementById('switch_icon')) document.getElementById('switch_icon').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['switchesDown'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function getGatewayOverviewForAccount(clientID) {
	var account = getAccountforClientID(clientID);
	requestURL = '/monitoring/v1/gateways?status=Up&calculate_total=true';
	if (account.base_url === getAPIGateway('Central On-Prem')) {
		requestURL = '/monitoring/v2/mobility_controllers?status=Up&calculate_total=true';
	}
	// Get Up AP Count for account
	var settingsUp = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + requestURL,
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsUp).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/gateways)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_icon')) document.getElementById('gateway_icon').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['gatewaysUp'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});

	// Get Down AP Count for account
	requestURL = '/monitoring/v1/gateways?status=Down&calculate_total=true';
	if (account.base_url === getAPIGateway('Central On-Prem')) {
		requestURL = '/monitoring/v2/mobility_controllers?status=Down&calculate_total=true';
	}
	var settingsDown = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + requestURL,
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsDown).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/monitoring/v2/gateways)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_icon')) document.getElementById('gateway_icon').innerHTML = '-';
		} else {
			this['client_id'] = clientID;
			hydraMonitoringData[clientID]['gatewaysDown'] = response.total;

			saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function showSitesForAccount(accountName) {
	var account = getAccountforName(accountName);
	var accountData = hydraMonitoringData[account.client_id];
	$('#site-table')
		.DataTable()
		.rows()
		.remove();
	$.each(accountData['sites'], function() {
		// Add row to table
		var table = $('#site-table').DataTable();

		var capestate = '';
		if (this['cape_state'] === 'good') {
			capestate += '<i class="fa-solid fa-circle text-success"></i>';
			capestate += ' No User Experience Issues';
		} else if (this['cape_state']) {
			capestate += '<i class="fa-solid fa-circle text-danger"></i> ';
			capestate = titleCase(noUnderscore(this['cape_state_dscr'][0]));
		}

		var aiinsights = '';
		if (this['insight_hi'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-danger"></i>';
		}
		if (this['insight_mi'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-warning"></i>';
		}
		if (this['insight_lo'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-minor"></i>';
		}
		if (aiinsights === '') {
			aiinsights = '<i class="fa-solid fa-circle text-neutral"></i>';
		}

		var status = '<i class="fa-solid fa-circle text-success"></i>';
		var healthReason = '';
		if (this['wan_uplinks_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with WAN links down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wan_tunnels_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with VPN Tunnels down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'APs with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'AP with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Switches with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Switch with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['branch_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateways with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['branch_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_device_status_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'One or more APs are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_device_status_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'One or more switches are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['device_high_noise_5ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High noise on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_noise_2_4ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High noise on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_ch_5ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_ch_2_4ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_mem'] > 0) {
			status = '<i class="fa-solid fa-circle text-minor"></i>';
			healthReason = 'Devices with high memory utilization';
			if (siteIssues > 3) siteIssues = 3;
		}

		table.row.add(['<strong>' + this['name'] + '</strong>', status, this['device_up'], this['device_down'], this['connected_count'], capestate, aiinsights, healthReason]);
	});
	$('#site-table')
		.DataTable()
		.rows()
		.draw();
	document.getElementById('site-title').innerHTML = accountName + ' - Sites';
	$('#SiteModalLink').trigger('click');
}

function getSiteDataForAccount(clientID, offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/branchhealth/v1/site?limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/branchhealth/v1/site)');
				return;
			}
		}
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			if (document.getElementById('site_count')) document.getElementById('site_count').innerHTML = '-';
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();

			$.each(response.items, function() {
				// add client ID to record and store
				this['client_id'] = clientID;
				hydraMonitoringData[clientID]['sites'].push(this);
				//sites.push(this);
				//loadSiteUI(this);
			});

			if (offset + apiSiteLimit <= response.total) {
				getSiteDataForAccount(clientID, offset + apiSiteLimit);
			} else {
				//console.log(hydraMonitoringData[clientID]["sites"])
				saveDataToDB('monitoring_hydra', JSON.stringify(hydraMonitoringData));
				loadHydraTable();
			}
		}
	});
}
