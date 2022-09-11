/*
Central Automation v1.6.0
Updated: 1.11.1
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var hydraMonitoringData = {};

/*  ----------------------------------------------------------------------------------
		Utility functions
	---------------------------------------------------------------------------------- */

function saveGlobalSettings() {
	// Save all the global settings (except for the accounts)
	localStorage.setItem('ap_naming_format', $('#ap_naming_format').val());
	localStorage.setItem('hostname_variable', $('#hostname_variable').val());
	localStorage.setItem('port_variable_format', $('#port_variable_format').val());
	localStorage.setItem('refresh_rate', $('#refresh_rate').val());
	localStorage.setItem('load_clients', document.getElementById('load_clients').value === 'Include' ? true : false);
	localStorage.setItem('load_group_properties', document.getElementById('load_group_properties').value === 'Include' ? true : false);
	localStorage.setItem('qr_color', $('#color_picker').val());
	localStorage.setItem('qr_logo', $('#qr_logo').val());
	logInformation('Central Automation Studio settings saved');
}

function onFinishSetup() {
	clearErrorLog();
	// Save all supplied addresses and details
	saveGlobalSettings();
	tokenRefreshForAll();
}

function loadDashboardData(refreshrate) {
	// Check if we need to get the latest data - or can we just load it from localStorage

	if (!localStorage.getItem('monitoring_update')) {
		console.log('Reading new hydra monitoring data from Central');
		getDashboardData();
	} else {
		loadAccountDetails();
		var lastRefresh = new Date(parseInt(localStorage.getItem('monitoring_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes > refreshrate) {
			console.log('Reading new hydra monitoring data from Central');
			getDashboardData();
		} else {
			console.log('Reading hydra monitoring data from local storage');

			var monitoringData = localStorage.getItem('monitoring_hydra');
			if (monitoringData != null && monitoringData != 'undefined') {
				hydraMonitoringData = JSON.parse(monitoringData);
				loadHydraTable();
			}
		}
	}
}

/*  ----------------------------------------------------------------------------------
		Authentication functions
	---------------------------------------------------------------------------------- */
function tokenRefreshForAll() {
	showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
	authCounter = 0;
	authErrorCount = 0;
	authPromise = new $.Deferred();

	var account_details = localStorage.getItem('account_details');
	if (account_details != null && account_details != 'undefined') {
		centralCredentials = JSON.parse(account_details);
		$.each(centralCredentials, function() {
			tokenRefreshForAccount(this['client_id']);
		});
		return authPromise.promise();
	}
}

function checkAuthComplete() {
	if (authCounter >= centralCredentials.length) {
		if (authErrorCount > 0) {
			$('#ErrorModalLink').trigger('click');
			Swal.fire({
				title: 'Central API connection failed',
				text: 'One or more Central accounts failed to authenticate correctly',
				icon: 'error',
			});
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
		}
		authPromise.resolve();
	}
}

function tokenRefreshForAccount(clientID) {
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

	return $.ajax(settings)
		.done(function(response) {
			//console.log(response);
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/auth/refresh)');
					return;
				}
			}
			if (response.hasOwnProperty('error')) {
				logError(response.error_description.replace('refresh_token', 'Refresh Token') + ' for Central Account "' + getNameforClientID(clientID) + '"');
				showNotification('ca-padlock', response.error_description.replace('refresh_token', 'Refresh Token') + ' for Central Account "' + getNameforClientID(clientID) + '"', 'bottom', 'center', 'danger');
				authErrorCount++;
			} else {
				var cluster = getAccountforClientID(clientID);
				cluster['refresh_token'] = response.refresh_token;
				cluster['access_token'] = response.access_token;
				updateAccountDetails(cluster);

				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('settings')) {
					// refresh settings page table
					loadAccountDetails();
				}
			}
			authCounter++;
			checkAuthComplete();
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			//console.log("error")
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
}

/*  ----------------------------------------------------------------------------------
		Monitoring functions
	---------------------------------------------------------------------------------- */

function getDashboardData() {
	// Try and refresh the token
	showNotification('ca-contactless-card', 'Updating Hydra Dashboard Data...', 'bottom', 'center', 'info');

	// Refresh card data
	var account_details = localStorage.getItem('account_details');
	if (account_details != null && account_details != 'undefined') {
		centralCredentials = JSON.parse(account_details);
		$.each(centralCredentials, function() {
			// Try and refresh the token for each clientID
			var clientID = this.client_id;
			var account = this;
			var saveBaseURL = this.base_url;
			if (saveBaseURL === getAPIGateway('Central On-Prem')) {
				saveBaseURL = cop_url + this.cop_address;
			}
			var settings = {
				url: getAPIURL() + '/auth/refresh',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					client_id: this.client_id,
					client_secret: this.client_secret,
					access_token: this.access_token,
					refresh_token: this.refresh_token,
					base_url: saveBaseURL,
				}),
			};

			$.ajax(settings).done(function(response) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/auth/refresh)');
						return;
					}
				}
				if (response.hasOwnProperty('error')) {
					showNotification('ca-padlock', response.error_description + ' for "' + getNameforClientID(clientID) + '"', 'bottom', 'center', 'danger');
				} else {
					account['refresh_token'] = response.refresh_token;
					account['access_token'] = response.access_token;
					updateAccountDetails(account);

					var apKey = 'aps';
					var switchKey = 'switches';
					var gatewayKey = 'gateways';
					var siteKey = 'sites';
					var dataFramework = { [apKey]: [], [switchKey]: [], [gatewayKey]: [], [siteKey]: [] };

					hydraMonitoringData[clientID] = dataFramework;
					showNotification('ca-cloud-data-download', 'Updating data for "' + getNameforClientID(clientID) + '"', 'bottom', 'center', 'info');

					getWirelessClientOverviewForAccount(clientID);
					getWiredClientOverviewForAccount(clientID);
					getAPOverviewForAccount(clientID);
					getSwitchOverviewForAccount(clientID);
					getGatewayOverviewForAccount(clientID);
					getSiteDataForAccount(clientID, 0);

					localStorage.setItem('monitoring_update', +new Date());
				}
			});
		});
	}
}

function loadHydraTable() {
	$('#account-table')
		.DataTable()
		.rows()
		.remove();
	for (let k in hydraMonitoringData) {
		//console.log(getNameforClientID(k));

		// Process Clients
		var clientString = '';
		if (hydraMonitoringData[k]['wirelessClientsUp']) {
			clientString += '<i class="central-icon ca-laptop-1 fa-fw text-success"><strong> ' + hydraMonitoringData[k]['wirelessClientsUp'] + ' </strong></i>';
		} else {
			clientString += '<i class="central-icon ca-laptop-1 fa-fw"><strong> 0 </strong></i>';
		}
		if (hydraMonitoringData[k]['wirelessClientsDown']) {
			clientString += '<i class="central-icon ca-laptop-1 fa-fw text-danger"><strong> ' + hydraMonitoringData[k]['wirelessClientsDown'] + ' </strong></i>';
		} else {
			clientString += '<i class="central-icon ca-laptop-1 fa-fw"><strong> 0 </strong></i>';
		}
		if (hydraMonitoringData[k]['wiredClientsUp']) {
			clientString += '<i class="central-icon ca-computer-monitor fa-fw text-success"><strong> ' + hydraMonitoringData[k]['wiredClientsUp'] + ' </strong></i>';
		} else {
			clientString += '<i class="central-icon ca-computer-monitor fa-fw"><strong> 0 </strong></i>';
		}
		if (hydraMonitoringData[k]['wiredClientsDown']) {
			clientString += '<i class="central-icon ca-computer-monitor fa-fw text-danger"><strong> ' + hydraMonitoringData[k]['wiredClientsDown'] + ' </strong></i>';
		} else {
			clientString += '<i class="central-icon ca-computer-monitor fa-fw"><strong> 0 </strong></i>';
		}

		// Process APs
		var apsUp = 0;
		var apsDown = 0;
		if (hydraMonitoringData[k]['apsUp']) apsUp = hydraMonitoringData[k]['apsUp'];
		if (hydraMonitoringData[k]['apsDown']) apsDown = hydraMonitoringData[k]['apsDown'];

		var apString = '';
		if (apsUp > 0) apString += '<i class="fa fa-arrow-up fa-fw text-success"><strong> ' + apsUp + ' </strong></i>';
		else apString += '<i class="fa fa-arrow-up fa-fw"> ' + apsUp + ' </i>';
		if (apsDown > 0) apString += '<i class="fa fa-arrow-down fa-fw text-danger"><strong> ' + apsDown + ' </strong></i>';
		else apString += '<i class="fa fa-arrow-down fa-fw"> ' + apsDown + ' </i>';

		// Process Switches
		var switchesUp = 0;
		var switchesDown = 0;
		if (hydraMonitoringData[k]['switchesUp']) switchesUp = hydraMonitoringData[k]['switchesUp'];
		if (hydraMonitoringData[k]['switchesDown']) switchesDown = hydraMonitoringData[k]['switchesDown'];

		var switchesString = '';
		if (switchesUp > 0) switchesString += '<i class="fa fa-arrow-up fa-fw text-success"><strong> ' + switchesUp + ' </strong></i>';
		else switchesString += '<i class="fa fa-arrow-up fa-fw"> ' + switchesUp + ' </i>';
		if (switchesDown > 0) switchesString += '<i class="fa fa-arrow-down fa-fw text-danger"><strong> ' + switchesDown + ' </strong></i>';
		else switchesString += '<i class="fa fa-arrow-down fa-fw"> ' + switchesDown + ' </i>';

		// Process Gateways
		var gatewaysUp = 0;
		var gatewaysDown = 0;
		if (hydraMonitoringData[k]['gatewaysUp']) gatewaysUp = hydraMonitoringData[k]['gatewaysUp'];
		if (hydraMonitoringData[k]['gatewaysDown']) gatewaysDown = hydraMonitoringData[k]['gatewaysDown'];

		var gatewayString = '';
		if (gatewaysUp > 0) gatewayString += '<i class="fa fa-arrow-up fa-fw text-success"><strong> ' + gatewaysUp + ' </strong></i>';
		else gatewayString += '<i class="fa fa-arrow-up fa-fw"> ' + gatewaysUp + ' </i>';
		if (gatewaysDown > 0) gatewayString += '<i class="fa fa-arrow-down fa-fw text-danger"><strong> ' + gatewaysDown + ' </strong></i>';
		else gatewayString += '<i class="fa fa-arrow-down fa-fw"> ' + gatewaysDown + ' </i>';

		// Process sites
		var siteDanger = 0;
		var siteWarning = 0;
		var siteMinor = 0;
		var siteOK = hydraMonitoringData[k]['sites'].length;
		$.each(hydraMonitoringData[k]['sites'], function() {
			siteIssues = 4;
			var status = '<i class="fa fa-circle text-success"></i>';
			var healthReason = '';
			if (this['wan_uplinks_down'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Gateway with WAN links down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wan_tunnels_down'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Gateway with VPN Tunnels down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_cpu_high'] > 1) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'APs with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_cpu_high'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'AP with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_cpu_high'] > 1) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Switches with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_cpu_high'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Switch with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['branch_cpu_high'] > 1) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Gateways with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['branch_cpu_high'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'Gateway with high CPU usage';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wlan_device_status_down'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'One or more APs are down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['wired_device_status_down'] > 0) {
				status = '<i class="fa fa-circle text-danger"></i>';
				healthReason = 'One or more switches are down';
				if (siteIssues > 1) {
					siteIssues = 1;
					siteDanger++;
					siteOK--;
				}
			} else if (this['device_high_noise_5ghz'] > 0) {
				status = '<i class="fa fa-circle text-warning"></i>';
				healthReason = 'High noise on 5GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_noise_2_4ghz'] > 0) {
				status = '<i class="fa fa-circle text-warning"></i>';
				healthReason = 'High noise on 2.4GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_ch_5ghz'] > 0) {
				status = '<i class="fa fa-circle text-warning"></i>';
				healthReason = 'High channel utilization on 5GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_ch_2_4ghz'] > 0) {
				status = '<i class="fa fa-circle text-warning"></i>';
				healthReason = 'High channel utilization on 2.4GHz';
				if (siteIssues > 2) {
					siteIssues = 2;
					siteWarning++;
					siteOK--;
				}
			} else if (this['device_high_mem'] > 0) {
				status = '<i class="fa fa-circle text-minor"></i>';
				healthReason = 'Devices with high memory utilization';
				if (siteIssues > 3) {
					siteIssues = 3;
					siteMinor++;
					siteOK--;
				}
			}
		});
		var siteString = '';
		if (siteOK > 0) siteString += '<i class="fa fa-circle fa-fw-pointer text-success"><strong> ' + siteOK + ' </strong></i>';
		if (siteDanger > 0) siteString += '<i class="fa fa-circle fa-fw-pointer text-danger"><strong> ' + siteDanger + ' </strong></i>';
		if (siteWarning > 0) siteString += '<i class="fa fa-circle fa-fw-pointer text-warning"><strong> ' + siteWarning + ' </strong></i>';
		if (siteMinor > 0) siteString += '<i class="fa fa-circle fa-fw-pointer text-minor"><strong> ' + siteMinor + ' </strong></i>';

		var checkBtn = '<button class="btn btn-round btn-sm btn-outline btn-info" onclick="loadIndividualAccount(\'' + k + '\',1)">Go To Account<i class="fa fa-arrow-right text-default"><strong></button>';

		var table = $('#account-table').DataTable();
		table.row.add(['<strong>' + getNameforClientID(k) + '</strong>', clientString, apString, switchesString, gatewayString, siteString, checkBtn]);
		$('#account-table')
			.DataTable()
			.rows()
			.draw();
	}
}

function loadIndividualAccount(client_id, hydra) {
	// get account details and save them out
	var account = getAccountforClientID(client_id);
	localStorage.setItem('central_id', account.central_id);
	localStorage.setItem('client_id', account.client_id);
	localStorage.setItem('client_secret', account.client_secret);
	localStorage.setItem('base_url', account.base_url);
	localStorage.setItem('refresh_token', account.refresh_token);
	localStorage.setItem('access_token', account.access_token);

	// Jump to individual dashboard and refresh data
	if (hydra == 1) localStorage.setItem('from_hydra', hydra);
	else localStorage.removeItem('from_hydra');

	localStorage.removeItem('monitoring_update');
	window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'dashboard.html';
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

	$.ajax(settingsConnected).done(function(response) {
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
			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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

	$.ajax(settingsNotConnected).done(function(response) {
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
			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&timerange=3H&client_type=WIRED&client_status=CONNECTED',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsConnected).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
		} else {
			hydraMonitoringData[clientID]['wiredClientsUp'] = response.total;
			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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
			url: getbaseURLforClientID(clientID) + '/monitoring/v2/clients?calculate_total=true&timerange=3H&client_type=WIRED&client_status=FAILED_TO_CONNECT',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsNotConnected).done(function(response) {
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
			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function getWiredClientDataForAccount(clientID) {
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

	$.ajax(settings).done(function(response) {
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
			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

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

	$.ajax(settingsUp).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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

	$.ajax(settingsDown).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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

	$.ajax(settingsUp).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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

	$.ajax(settingsDown).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
			loadHydraTable();
		}
	});
}

function getGatewayOverviewForAccount(clientID) {
	// Get Up AP Count for account
	var settingsUp = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: getbaseURLforClientID(clientID) + '/monitoring/v1/gateways?status=Up&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsUp).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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
			url: getbaseURLforClientID(clientID) + '/monitoring/v1/gateways?status=Down&calculate_total=true',
			access_token: getAccessTokenforClientID(clientID),
		}),
	};

	$.ajax(settingsDown).done(function(response) {
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

			localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
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
			capestate += '<i class="fa fa-circle text-success"></i>';
			capestate += ' No User Experience Issues';
		} else if (this['cape_state']) {
			capestate += '<i class="fa fa-circle text-danger"></i> ';
			capestate = titleCase(noUnderscore(this['cape_state_dscr'][0]));
		}

		var aiinsights = '';
		if (this['insight_hi'] != 0) {
			aiinsights += '<i class="fa fa-circle text-danger"></i>';
		}
		if (this['insight_mi'] != 0) {
			aiinsights += '<i class="fa fa-circle text-warning"></i>';
		}
		if (this['insight_lo'] != 0) {
			aiinsights += '<i class="fa fa-circle text-minor"></i>';
		}
		if (aiinsights === '') {
			aiinsights = '<i class="fa fa-circle text-neutral"></i>';
		}

		var status = '<i class="fa fa-circle text-success"></i>';
		var healthReason = '';
		if (this['wan_uplinks_down'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Gateway with WAN links down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wan_tunnels_down'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Gateway with VPN Tunnels down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_cpu_high'] > 1) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'APs with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_cpu_high'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'AP with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_cpu_high'] > 1) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Switches with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_cpu_high'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Switch with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['branch_cpu_high'] > 1) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Gateways with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['branch_cpu_high'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'Gateway with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wlan_device_status_down'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'One or more APs are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['wired_device_status_down'] > 0) {
			status = '<i class="fa fa-circle text-danger"></i>';
			healthReason = 'One or more switches are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (this['device_high_noise_5ghz'] > 0) {
			status = '<i class="fa fa-circle text-warning"></i>';
			healthReason = 'High noise on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_noise_2_4ghz'] > 0) {
			status = '<i class="fa fa-circle text-warning"></i>';
			healthReason = 'High noise on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_ch_5ghz'] > 0) {
			status = '<i class="fa fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_ch_2_4ghz'] > 0) {
			status = '<i class="fa fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (this['device_high_mem'] > 0) {
			status = '<i class="fa fa-circle text-minor"></i>';
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

	$.ajax(settings).done(function(response) {
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
				localStorage.setItem('monitoring_hydra', JSON.stringify(hydraMonitoringData));
				loadHydraTable();
			}
		}
	});
}
