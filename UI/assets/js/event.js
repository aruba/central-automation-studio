/*
Central Automation v1.29
Updated: 1.39
Aaron Scott (WiFi Downunder) 2021-2025
*/

var dashboardWLAN;
var dashboardDHCP;
var dashboardInfra;
var dashboardTop;

var updateTimestamp;
var dashboardData = {};
var eventData = {};
var nowData = {};

var gatewayCounter = 0;
var gatewayUpdateNotification;
var selectedGateway;
var selectedVLAN;
var selectedWLAN;

var infraTableRows = [];
var downAPs = {};
var newDownAPs = {};
var upAPs = {};
var newUpAPs = {};

var downSwitches = {};
var newDownSwitches = {};
var upSwitches = {};
var newUpSwitches = {};

var downGateways = {};
var newDownGateways = {};
var upGateways = {};
var newUpGateways = {};

var graphHeightMultiplier = 1;

/*---------------------------------------------------------------------
	Dashboard Functions
---------------------------------------------------------------------*/

function loadDashboardData(refreshrate) {
	if (!localStorage.getItem('dashboard_update')) {
		getDashboardData();
	} else {
		var lastRefresh = new Date(parseInt(localStorage.getItem('dashboard_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes > refreshrate) {
			//console.log("Reading new monitoring data from Central");
			getDashboardData();
		} else {
			console.log('Reading dashboard data from IndexedDB');
			const transaction = db.transaction('general', 'readonly');
			const store = transaction.objectStore('general');

			const eventQuery = store.get('monitoring_event');
			eventQuery.onsuccess = function() {
				if (eventQuery.result) {
					eventData = JSON.parse(eventQuery.result.data);
				} else {
					eventData = {};
				}
			};

			// Reload the WLAN list until the WLAN list can be pulled again
			var networks = [];
			var wlanList = localStorage.getItem('event_networks');
			if (wlanList) networks = JSON.parse(wlanList);
			for (var i = 0; i < networks.length; i++) {
				$('#wlanselector').append($('<option>', { value: networks[i]['essid'], text: networks[i]['essid'] }));
				if ($('#wlanselector').length != 0) {
					$('#wlanselector').selectpicker('refresh');
				}
			}
			if (selectedWLAN) $('#wlanselector').selectpicker('val', selectedWLAN);
		}
	}
}

function getDashboardData() {
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			updateTimestamp = +new Date();
			showNotification('ca-dashboard', 'Updating Dashboard Data...', 'bottom', 'center', 'primary');
	
			// Load current data to be updated...
			const transaction = db.transaction('general', 'readonly');
			const store = transaction.objectStore('general');
	
			/*const dashboardQuery = store.get('monitoring_dashboard');
			dashboardQuery.onsuccess = function() {
				if (dashboardQuery.result) {
					dashboardData = JSON.parse(dashboardQuery.result.data);
				} else {
					dashboardData = {};
				}
			};*/
	
			const eventQuery = store.get('monitoring_event');
			eventQuery.onsuccess = function() {
				if (eventQuery.result) {
					eventData = JSON.parse(eventQuery.result.data);
				} else {
					eventData = {};
				}
			};
			if (dashboardWLAN) {
				getWLANs();
			}
			if (dashboardInfra) {
				processAPs(0);
				setTimeout(processSwitches, 2000, 0);
				setTimeout(processGateways, 4000, 0);
			}
	
			if (dashboardTop) {
				getAppRFStats();
				getTopClients();
				getTopAPs();
			}
			/*
			var nowData = dashboardData[updateTimestamp] ? dashboardData[updateTimestamp] : {};
			console.log(dashboardBandwidth);
			if (dashboardClients) {
				getWirelessUserCount();
				getWiredUserCount();
			}
			if (dashboardBandwidth) getWLANs();
			if (dashboardDHCP) getDHCPStats();
			*/
			localStorage.setItem('dashboard_update', +new Date());
		}
	});
}

function refreshData(event) {
	if (event.shiftKey) getNonInfrastructureData();
	if (event.altKey) getMonitoringData();
	else getDashboardData();
}

/*---------------------------------------------------------------------
	AppRF API Functions
---------------------------------------------------------------------*/
function getAppRFStats() {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;
	if (timescale < 180) timescale = 180;

	var now = new Date();
	// convert timescale from minutes to ms (*60*1000)
	var fromTime = Math.floor(now.getTime() - timescale * 60 * 1000);
	// convert back to seconds
	fromTime = Math.floor(fromTime /1000);

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/apprf/datapoints/v2/topn_stats?count=5&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/apprf/datapoints/v2/topn_stats)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var applications = response['result']['app_id'];
		var appLabels = [];
		var appSeries = [];
		$.each(applications, function() {
			var labelString = this.name + '\n(' + this['app_cat']['name'] + ')';
			var amount = this.data / 1024 / 1024 / 1024;
			appLabels.push(this.name);
			appSeries.push({ meta: labelString, value: amount.toFixed(2) });
		});

		var data = { labels: appLabels, series: appSeries };

		var barOptions = {
			distributeSeries: true,
			seriesBarDistance: 10,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				//offset: 30,
			},
			height: '300px',
			plugins: [Chartist.plugins.tooltip()],
		};

		new Chartist.Bar('#chartApps', data, barOptions);
	});
}

/*---------------------------------------------------------------------
	Top Clients API Functions
---------------------------------------------------------------------*/
function getTopClients() {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/clients/bandwidth_usage/topn?from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/clients/bandwidth_usage/topn)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var clients = response['clients'];
		var clientLabels = [];
		var clientSeriesTx = [];
		var clientSeriesRx = [];
		$.each(clients, function() {
			var totalThroughput = this.tx_data_bytes + this.rx_data_bytes;
			var labelString = this.name + '\n(' + Math.floor(totalThroughput / 1024 / 1024 / 1024) + 'GB)';
			var txAmount = this.tx_data_bytes / 1024 / 1024 / 1024;
			var rxAmount = this.rx_data_bytes / 1024 / 1024 / 1024;
			clientLabels.push(this.name);
			clientSeriesTx.push({ meta: labelString, value: txAmount.toFixed(2) });
			clientSeriesRx.push({ meta: labelString, value: rxAmount.toFixed(2) });
		});

		new Chartist.Bar(
			'#chartClients',
			{
				labels: clientLabels,
				series: [clientSeriesTx, clientSeriesRx],
			},
			{
				stackBars: true,
				axisX: {
					showGrid: false,
				},

				axisY: {
					onlyInteger: true,
				},
				height: '300px',
				plugins: [Chartist.plugins.tooltip()],
			}
		).on('draw', function(data) {
			if (data.type === 'bar') {
				data.element.attr({
					style: 'stroke-width: 30px',
				});
			}
		});
	});
}

/*---------------------------------------------------------------------
	Top APs API Functions
---------------------------------------------------------------------*/
function getTopAPs() {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps/bandwidth_usage/topn?from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/aps/bandwidth_usage/topn)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var topAPs = response['aps'];
		var apLabels = [];
		var apSeriesTx = [];
		var apSeriesRx = [];
		$.each(topAPs, function() {
			var totalThroughput = this.tx_data_bytes + this.rx_data_bytes;
			var labelString = this.name + '\n(' + Math.floor(totalThroughput / 1024 / 1024 / 1024) + 'GB)';
			var txAmount = this.tx_data_bytes / 1024 / 1024 / 1024;
			var rxAmount = this.rx_data_bytes / 1024 / 1024 / 1024;
			apLabels.push(this.name);
			apSeriesTx.push({ meta: labelString, value: txAmount.toFixed(2) });
			apSeriesRx.push({ meta: labelString, value: rxAmount.toFixed(2) });
		});

		new Chartist.Bar(
			'#chartAPs',
			{
				labels: apLabels,
				series: [apSeriesTx, apSeriesRx],
			},
			{
				stackBars: true,
				axisX: {
					showGrid: false,
				},

				axisY: {
					onlyInteger: true,
				},
				height: '300px',
				plugins: [Chartist.plugins.tooltip()],
			}
		).on('draw', function(data) {
			if (data.type === 'bar') {
				data.element.attr({
					style: 'stroke-width: 30px',
				});
			}
		});
	});
}

/*---------------------------------------------------------------------
	Gateway API Functions
---------------------------------------------------------------------*/

function getDHCPStats() {
	gatewayUpdateNotification = showNotification('ca-gateway', 'Obtaining Gateways Information...', 'bottom', 'center', 'info');
	gatewayCounter = 0;

	$.when(getGatewayData(0)).then(function() {
		var allGateways = getGateways();
		allGateways.sort((a, b) => {
			const gatewayA = a.name.toUpperCase(); // ignore upper and lowercase
			const gatewayB = b.name.toUpperCase(); // ignore upper and lowercase
			// Sort on Site Name
			if (gatewayA < gatewayB) {
				return -1;
			}
			if (gatewayA > gatewayB) {
				return 1;
			}
			return 0;
		});

		// Clear the Gateways from the dropdown
		select = document.getElementById('gatewayselector');
		select.options.length = 0;

		// Grab config for each Group in Central
		$.each(allGateways, function() {
			var currentSerial = this.serial;
			var currentName = this.name;
			var settings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/monitoring/v1/gateways/' + currentSerial + '/dhcp_pools',
					access_token: localStorage.getItem('access_token'),
				}),
			};

			$.ajax(settings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/gateways/<serial>/dhcp_pools)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);
				gatewayCounter++;
				if (!nowData['dhcp_pools']) nowData['dhcp_pools'] = {};
				if (response.result && response.result.length > 0) {
					nowData['dhcp_pools'][currentSerial] = { name: currentName, pools: response.result };

					$('#gatewayselector').append($('<option>', { value: currentSerial, text: currentName }));
					if ($('#gatewayselector').length != 0) {
						$('#gatewayselector').selectpicker('refresh');
					}
				}

				if (gatewayCounter >= allGateways.length) {
					// save out the data
					dashboardData[updateTimestamp] = nowData;
					saveDataToDB('monitoring_dashboard', JSON.stringify(dashboardData));

					if (selectedGateway) {
						$('#gatewayselector').selectpicker('val', selectedGateway);
					}
					loadDHCPTable();
					reselectRow();

					if (gatewayUpdateNotification) {
						gatewayUpdateNotification.update({ message: 'Retrieved Gateway Information', type: 'success' });
						setTimeout(gatewayUpdateNotification.close, 1000);
					}
				}
			});
		});
	});
}

/*---------------------------------------------------------------------
	WLAN API Functions
---------------------------------------------------------------------*/

function getWLANs() {
	// Clear the WLANs from the dropdown
	select = document.getElementById('wlanselector');
	select.options.length = 0;

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/networks?calculate_client_count=false',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/networks)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		var networks = response['networks'];
		localStorage.setItem('event_networks', JSON.stringify(networks));

		for (var i = 0; i < networks.length; i++) {
			$('#wlanselector').append($('<option>', { value: networks[i]['essid'], text: networks[i]['essid'] }));
			if ($('#wlanselector').length != 0) {
				$('#wlanselector').selectpicker('refresh');
			}
		}
		if (selectedWLAN) {
			$('#wlanselector').selectpicker('val', selectedWLAN);
			getBandwidthForNetwork(selectedWLAN);
			getClientCountForNetwork(selectedWLAN);
		}
	});
}

function getBandwidthForNetwork(essid) {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/networks/bandwidth_usage?network=' + essid + '&from_timestamp=' + fromTime,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/networks/bandwidth_usage)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		$.each(response['samples'], function() {
			var timestamp = this['timestamp'];

			if (!eventData[timestamp]) eventData[timestamp] = {};
			var timeData = eventData[timestamp];

			if (!timeData[essid]) timeData[essid] = {};
			var essidData = timeData[essid];

			essidData['rx_data_bytes'] = this['rx_data_bytes'];
			essidData['tx_data_bytes'] = this['tx_data_bytes'];

			timeData[essid] = essidData;
			eventData[timestamp] = timeData;
			saveDataToDB('monitoring_event', JSON.stringify(eventData));
		});

		loadBandwidthForNetwork(essid);
	});
}

function getClientCountForNetwork(essid) {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var now = new Date();
	// convert timescale from minutes to seconds (*60)
	// convert timestamp from ms to s (/1000)
	var fromTime = Math.floor(now.getTime() / 1000 - timescale * 60);

	var clientAPI = '/monitoring/v1/clients/count?from_timestamp=' + fromTime;
	if (essid) clientAPI = '/monitoring/v1/clients/count?network=' + essid + '&from_timestamp=' + fromTime;

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + clientAPI,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/clients/count)');
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
						getUserCount();
					}
				});
			}
		} else if (response) {
			failedAuth = false;

			$.each(response['samples'], function() {
				var timestamp = this['timestamp'];
				if (!eventData[timestamp]) eventData[timestamp] = {};
				var timeData = eventData[timestamp];

				if (!timeData[essid]) timeData[essid] = {};
				var essidData = timeData[essid];

				essidData['client_count'] = this['client_count'];

				timeData[essid] = essidData;
				eventData[timestamp] = timeData;
				saveDataToDB('monitoring_event', JSON.stringify(eventData));
			});

			loadClientCountForNetwork(essid);
		}
	});
}

/*---------------------------------------------------------------------
	Infrastructure API Functions
---------------------------------------------------------------------*/
function processAPs() {
	newDownAPs = {};
	newUpAPs = {};

	$.when(getAPData(0, false)).then(function() {
		var table = $('#infra-table').DataTable();
		var newAPs = getAPs();
		$.each(newAPs, function() {
			var currentSerial = this.serial;

			if (this.status === 'Down') {
				// add to new dictionary of down APs
				newDownAPs[currentSerial] = this;

				if (!downAPs[currentSerial]) {
					// need to alert in the infrastructure status as this is a new down AP
					// Add table row to top of table
					console.log('New Down AP: ' + this['name']);
					if (upAPs[currentSerial]) delete upAPs[currentSerial];
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'offline', 'type':'ap'});
				}
			}

			if (this.status === 'Up') {
				// add to new dictionary of down APs
				newUpAPs[currentSerial] = this;

				var upAPCount = Object.keys(upAPs).length;
				if (upAPCount != 0 && !upAPs[currentSerial]) {
					// need to alert in the infrastructure status as this is a new up AP
					// Add table row to top of table
					console.log('New Up AP ' + this['name']);
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'online', 'type':'ap'});
				}
			}
		});
		downAPs = newDownAPs;
		upAPs = newUpAPs;
		
		loadInfraTable();
	});
}

function processSwitches() {
	newDownSwitches = {};
	newUpSwitches = {};

	$.when(getSwitchData(0, false)).then(function() {
		var table = $('#infra-table').DataTable();
		var newSwitches = getSwitches();
		$.each(newSwitches, function() {
			var currentSerial = this.serial;

			if (this.status === 'Down') {
				// add to new dictionary of down APs
				newDownSwitches[currentSerial] = this;

				if (!downSwitches[currentSerial]) {
					// need to alert in the infrastructure status as this is a new down Switch
					// Add table row to top of table
					console.log('New Down Switch ' + this['name']);
					if (upSwitches[currentSerial]) delete upSwitches[currentSerial];
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'offline', 'type':'switch'});
				}
			}

			if (this.status === 'Up') {
				// add to new dictionary of down APs
				newUpSwitches[currentSerial] = this;

				var upSwitchCount = Object.keys(upSwitches).length;
				if (upSwitchCount != 0 && !upSwitches[currentSerial]) {
					// need to alert in the infrastructure status as this is a new up Switch
					// Add table row to top of table
					console.log('New Up Switch ' + this['name']);
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'online', 'type':'switch'});
				}
			}
		});
		downSwitches = newDownSwitches;
		upSwitches = newUpSwitches;
		
		loadInfraTable();
	});
}

function processGateways() {
	newDownGateways = {};
	newUpGateways = {};

	// Disable the extra checking of details on the gateways
	disableGatewayDetails();

	$.when(getGatewayData(0, false)).then(function() {
		var newGateways = getGateways();
		$.each(newGateways, function() {
			var currentSerial = this.serial;

			if (this.status === 'Down') {
				// add to new dictionary of down APs
				newDownGateways[currentSerial] = this;

				if (!downGateways[currentSerial]) {
					// need to alert in the infrastructure status as this is a new down Switch
					// Add table row to top of table
					console.log('New Down Gateway ' + this['name']);
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'offline', 'type':'gateway'});
				}
			}

			if (this.status === 'Up') {
				// add to new dictionary of down APs
				newUpGateways[currentSerial] = this;

				var upGatewayCount = Object.keys(upGateways).length;
				if (upGatewayCount != 0 && !upGateways[currentSerial]) {
					// need to alert in the infrastructure status as this is a new up Switch
					// Add table row to top of table
					console.log('New Up Gateway ' + this['name']);
					infraTableRows.push({'device':this, 'timestamp':updateTimestamp, 'state':'online', 'type':'gateway'});
				}
			}
		});
		downGateways = newDownGateways;
		upGateways = newUpGateways;
		
		loadInfraTable();
	});
}

function loadInfraTable() {
	var table = $('#infra-table').DataTable();
	$('#infra-table')
	.DataTable()
	.clear();
	
	$.each(infraTableRows, function() {
		var device = this.device;
		var name = encodeURI(device['name']);
		var apiURL = localStorage.getItem('base_url');
		var eventTime = new Date(this.timestamp);
		var iconColour = 'success';
		if (this.state === 'offline') iconColour = 'danger';
		
		if (this.type === 'ap') {
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + device['serial'] + '?casn=' + device['serial'] + '&cdcn=' + name + '&nc=access_point';
			table.row.add([this.timestamp, '<i class="fa-solid fa-circle text-'+ iconColour +'"></i>', 'AP <a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a> is now '+this.state, eventTime.toLocaleString()]);
		} else if (this.type === 'switch') {
			var centralURL = centralURLs[apiURL] + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';
			table.row.add([this.timestamp, '<i class="fa-solid fa-circle text-'+ iconColour +'"></i>', 'Switch <a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a> is now '+this.state, eventTime.toLocaleString()]);
		} else if (this.type === 'gateway') {
			var centralURL = centralURLs[apiURL] + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + device['serial'] + '?csg=' + device['serial'] + '&cdcn=' + name + '&nc=gateway';
			table.row.add([this.timestamp, '<i class="fa-solid fa-circle text-'+ iconColour +'"></i>', 'Gateway <a href="' + centralURL + '" target="_blank"><strong>' + device['name'] + '</strong></a> is now '+this.state, eventTime.toLocaleString()]);
		}
	});
	
	$('#infra-table')
	.DataTable()
	.rows()
	.draw();
}

/*---------------------------------------------------------------------
	Helper Functions
---------------------------------------------------------------------*/

function filterToTimescale() {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var baseData = Object.entries(dashboardData);
	var graphData = [];
	for (const [key, value] of baseData) {
		var dataTime = new Date(+key);
		var now = new Date();
		var diffTime = Math.abs(now - dataTime);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes <= timescale) {
			graphData.push([key, value]);
		}
	}
	return graphData;
}

function filterEventDataToTimescale() {
	// filter the data for the timescale
	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var baseData = Object.entries(eventData);
	var graphData = [];
	for (const [key, value] of baseData) {
		var nowStamp = Math.floor(Date.now() / 1000);
		var diffSecs = nowStamp - key;
		var diffMinutes = diffSecs / 60;
		if (diffMinutes <= timescale) {
			if (value) graphData.push([key, value]);
		}
	}
	//Sorting the data
	graphData.sort((a, b) => {
		const timeA = a[0]; // ignore upper and lowercase
		const timeB = b[0]; // ignore upper and lowercase
		if (timeA < timeB) {
			return -1;
		}
		if (timeA > timeB) {
			return 1;
		}
		return 0;
	});

	return graphData;
}

function getLatestData() {
	var baseData = Object.entries(dashboardData);
	var latestData = {};
	var newestTime = 0;
	for (const [key, value] of baseData) {
		if (key > newestTime) {
			newestTime = key;
			latestData = value;
		}
	}
	return latestData;
}

/*---------------------------------------------------------------------
	UI Functions
---------------------------------------------------------------------*/

function reselectRow() {
	if (selectedVLAN) {
		// re-highlight the previously selected VLAN
		var table = $('#dhcp-table').DataTable();
		table.rows().every(function(rowIdx, tableLoop, rowLoop) {
			var data = this.data();
			if (data[0] === selectedVLAN) {
				$(this.node()).addClass('row_selected');
			}
		});

		// Update the graphs
		updateDHCPGraphs(selectedVLAN);
	}
}

function changeTimescale() {
	//updateDHCPTable();
	//reselectRow();
	loadGraphs();
	getTopAPs();
	getTopClients();
	getAppRFStats();
}

function loadGraphs() {
	select = document.getElementById('wlanselector');
	selectedWLAN = select.value;
	localStorage.setItem('event_wlan', selectedWLAN);
	if (selectedWLAN) {
		getBandwidthForNetwork(selectedWLAN);
		getClientCountForNetwork(selectedWLAN);
	}
}

function loadClientCountForNetwork(network) {
	var graphData = filterEventDataToTimescale();

	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var series1 = [];
	var series2 = [];
	var labels = [];
	var maxClient = 0;
	var avgClient = 0;
	var avgClientCounter = 0;
	// filter the dashboard data based on the selected time window

	var labelCounter = 0;
	for (const [key, value] of graphData) {
		if (value[network]) {
			var currentTimestamp = key * 1000;
			var eventDate = new Date(+currentTimestamp);

			if (labelCounter == graphData.length - 1) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == Math.floor(graphData.length / 2) && timescale > 1440) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == Math.floor(graphData.length / 2)) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == 0 && timescale > 180) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == 0) labels.push(moment(eventDate).format('LT'));
			else labels.push('');

			series1.push(value[network]['client_count']);
			labelCounter++;
			
			if (value[network]['client_count']) {
				if (value[network]['client_count'] > maxClient) maxClient = value[network]['client_count'];
				avgClient = avgClient + value[network]['client_count'];
				avgClientCounter++;
			}
		}
	}
	
	$('#clientDetails').empty();
	$('#clientDetails').append('<li><strong>Max Clients: </strong>' + maxClient + '&nbsp;&nbsp;<strong>Average Clients: </strong>'+Math.floor(avgClient/avgClientCounter)+'</li>');
	$('#clientDetails').append('<li>&nbsp;</li');

	optionsPage = {
		lineSmooth: false,
		showPoint: false,
		showArea: false,
		height: 280*graphHeightMultiplier+ 'px',
		axisY: {
			offset: 40,
			onlyInteger: true,
		},

		chartPadding: {
			right: 40,
			bottom: 50,
		},
		lineSmooth: Chartist.Interpolation.simple({
			divisor: 3,
		}),
		low: 0,
		plugins: [Chartist.plugins.tooltip()],
	};

	dataPage = {
		labels: labels,
		series: [series1],
	};

	var clientChart = Chartist.Line('#client-chart', dataPage, optionsPage);

	clientChart.on('draw', function(data) {
		if (data.type === 'line' || data.type === 'area') {
			data.element.animate({
				d: {
					begin: 0,
					dur: 1000,
					from: data.path
						.clone()
						.scale(1, 0)
						.translate(0, data.chartRect.height())
						.stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint,
				},
			});
		}
	});
}

function loadGatewayList() {
	var latestData = getLatestData();
	var dhcpData = latestData['dhcp_pools'];
	for (const [key, value] of Object.entries(dhcpData)) {
		$('#gatewayselector').append($('<option>', { value: key, text: value.name }));
	}
	if ($('#gatewayselector').length != 0) {
		$('#gatewayselector').selectpicker('refresh');
	}
}

function updateDHCPTable() {
	select = document.getElementById('gatewayselector');
	if (select.value) {
		selectedGateway = select.value;
		loadDHCPTable();
		if (selectedVLAN) updateDHCPGraphs(selectedVLAN);
	}
}

function loadDHCPTable() {
	// Clearing old data
	$('#dhcp-table')
		.DataTable()
		.clear();

	if (selectedGateway) {
		var table = $('#dhcp-table').DataTable();
		var latestData = getLatestData();
		var dhcpData = latestData['dhcp_pools'][selectedGateway]['pools'];
		// Add row to table

		for (const [key, value] of Object.entries(dhcpData)) {
			var freePercentage = value['free_ip_addr_percent'];
			if (freePercentage < 10) freePercentage = '<span class=text-danger>' + freePercentage + '</span>';
			table.row.add([value['vlan_id'], value['subnet'], value['pool_size'], value['curr_leases'], freePercentage]);
		}
	}

	$('#dhcp-table')
		.DataTable()
		.rows()
		.draw();
}

function updateDHCPGraphs(currentVLAN) {
	selectedVLAN = currentVLAN;
	var graphData = filterToTimescale();

	// Update pie graph
	var latestData = getLatestData();
	var dhcpData = latestData['dhcp_pools'][selectedGateway]['pools'];

	for (const [key, value] of Object.entries(dhcpData)) {
		if (value['vlan_id'] === selectedVLAN) {
			var usedPercentage = 100 - value['free_ip_addr_percent'];
			Chartist.Pie(
				'#dhcp-pie-chart',
				{
					labels: ['', ''],
					series: [
						{
							meta: 'Free',
							value: value['free_ip_addr_percent'],
						},
						{
							meta: 'Used',
							value: usedPercentage,
						},
					],
				},
				{
					width: 300,
					height: 300,
					donut: true,
					donutWidth: 30,
					showLabel: true,
					chartPadding: 26,
					labelOffset: 30,
					labelDirection: 'explode',
				}
			);
		}
	}

	// Update timeline
	var labelCounter = 0;
	var series = [];
	var labels = [];
	var scopeMax = 0;

	for (const [key, value] of graphData) {
		var eventDate = new Date(+key);
		if (labelCounter == 0 || labelCounter == graphData.length - 1 || labelCounter == Math.floor(graphData.length / 2)) labels.push(moment(eventDate).format('LT'));
		else labels.push('');

		if (value['dhcp_pools']) {
			var poolData = value['dhcp_pools'][selectedGateway]['pools'];
			$.each(poolData, function() {
				if (this.vlan_id === selectedVLAN) {
					series.push(100 - this['free_ip_addr_percent']);
					scopeMax = this['pool_size'];
				}
			});
		} else {
			Swal.fire({
				title: 'Data Error',
				text: 'There was an error in the time series data. All time series data will need to be deleted.',
				icon: 'danger',
				confirmButtonText: 'Delete it now',
			}).then(result => {
				if (result.isConfirmed) {
					saveDataToDB('monitoring_dashboard', JSON.stringify({}));
					localStorage.removeItem('dashboard_update');
					location.reload();
				}
			});
		}

		labelCounter++;
	}

	optionsPage = {
		lineSmooth: false,
		showPoint: false,
		showArea: true,
		height: 350,
		axisY: {
			offset: 40,
			onlyInteger: true,
		},
		lineSmooth: Chartist.Interpolation.simple({
			divisor: 3,
		}),
		low: 0,
		high: scopeMax,
		divisor: 8,
		plugins: [Chartist.plugins.tooltip()],
	};

	dataPage = {
		labels: labels,
		series: [series],
	};

	var dhcpChart = Chartist.Line('#dhcp-timeline-chart', dataPage, optionsPage);

	dhcpChart.on('draw', function(data) {
		if (data.type === 'line' || data.type === 'area') {
			data.element.animate({
				d: {
					begin: 0,
					dur: 1000,
					from: data.path
						.clone()
						.scale(1, 0)
						.translate(0, data.chartRect.height())
						.stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint,
				},
			});
		}
	});
}

/*---------------------------------------------------------------------
	Bandwidth Functions
---------------------------------------------------------------------*/

function loadBandwidthForNetwork(network) {
	var graphData = filterEventDataToTimescale();

	var select = document.getElementById('timescalePicker');
	var timescale = select.value;

	var series1 = [];
	var series2 = [];
	var labels = [];
	var peakThroughputUp = 0;
	var peakThroughputDown = 0;
	var totalThroughputUp = 0;
	var totalThroughputDown = 0;
	// filter the dashboard data based on the selected time window

	var labelCounter = 0;
	for (const [key, value] of graphData) {
		if (value[network]) {
			var currentTimestamp = key * 1000;
			var eventDate = new Date(+currentTimestamp);

			if (labelCounter == graphData.length - 1) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == Math.floor(graphData.length / 2) && timescale > 1440) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == Math.floor(graphData.length / 2)) labels.push(moment(eventDate).format('LT'));
			else if (labelCounter == 0 && timescale > 180) labels.push(moment(eventDate).format('MMM D H:MM A'));
			else if (labelCounter == 0) labels.push(moment(eventDate).format('LT'));
			else labels.push('');
			//console.log(value[network])
			series1.push(value[network]['rx_data_bytes'] / 1024 / 1024);
			series2.push(value[network]['tx_data_bytes'] / 1024 / 1024);
			if (value[network]['rx_data_bytes'] && value[network]['tx_data_bytes']) {
				// Calculate Throughput counts
				if (value[network]['rx_data_bytes'] > peakThroughputUp) peakThroughputUp = value[network]['rx_data_bytes'];
				if (value[network]['tx_data_bytes'] > peakThroughputDown) peakThroughputDown = value[network]['tx_data_bytes'];
				totalThroughputUp = totalThroughputUp + value[network]['rx_data_bytes'];
				totalThroughputDown = totalThroughputDown + value[network]['tx_data_bytes'];
			}
			labelCounter++;
		}
	}
	
	$('#bandwidthDetails').empty();
	var peakDisplayedUp = '';
	peakThroughputUp = peakThroughputUp/1024/1024;
	peakDisplayedUp = peakThroughputUp.toFixed(2)+'MB';
	if (peakThroughputUp > 1000) {
		peakThroughputUp = peakThroughputUp/1024;
		peakDisplayedUp = peakThroughputUp.toFixed(2)+'GB';
	}
	if (peakThroughputUp > 1000) {
		peakThroughputUp = peakThroughputUp/1024;
		peakDisplayedUp = peakThroughputUp.toFixed(2)+'TB';
	}
	
	var peakDisplayedDown = '';
	//console.log(peakThroughputDown)
	peakThroughputDown = peakThroughputDown/1024/1024;
	peakDisplayedDown = peakThroughputDown.toFixed(2)+'MB';
	if (peakThroughputDown > 1000) { 
		peakThroughputDown = peakThroughputDown/1024;
		peakDisplayedDown = peakThroughputDown.toFixed(2)+'GB';
	}
	if (peakThroughputDown > 1000) {
		peakThroughputDown = peakThroughputDown/1024;
		peakDisplayedDown = peakThroughputDown.toFixed(2)+'TB';
	}
	
	var totalDisplayedUp = '';
	totalThroughputUp = totalThroughputUp/1024/1024;
	totalDisplayedUp = totalThroughputUp.toFixed(2)+'MB';
	if (totalThroughputUp > 1000) {
		totalThroughputUp = totalThroughputUp/1024;
		totalDisplayedUp = totalThroughputUp.toFixed(2)+'GB';
	}
	if (totalThroughputUp > 1000) {
		totalThroughputUp = totalThroughputUp/1024;
		totalDisplayedUp = totalThroughputUp.toFixed(2)+'TB';
	}
	
	var totalDisplayedDown = '';
	totalThroughputDown = totalThroughputDown/1024/1024;
	totalDisplayedDown = totalThroughputDown.toFixed(2)+'MB';
	if (totalThroughputDown > 1000) {
		totalThroughputDown = totalThroughputDown/1024;
		totalDisplayedDown = totalThroughputDown.toFixed(2)+'GB';
	}
	if (totalThroughputDown > 1000) {
		totalThroughputDown = totalThroughputDown/1024;
		totalDisplayedDown = totalThroughputDown.toFixed(2)+'TB';
	}
	
	$('#bandwidthDetails').append('<li><strong>Peak Upload: </strong>' + peakDisplayedUp + '&nbsp;&nbsp;<strong>Peak Download: </strong>'+peakDisplayedDown+' (over 5mins)</li>');
	$('#bandwidthDetails').append('<li><strong>Total Upload: </strong>' + totalDisplayedUp + '&nbsp;&nbsp;<strong>Total Download: </strong>'+totalDisplayedDown+'</li>');

	optionsPage = {
		lineSmooth: false,
		showPoint: false,
		showArea: false,
		height: 280*graphHeightMultiplier+ 'px',
		axisY: {
			offset: 50,
			onlyInteger: true,
		},
		chartPadding: {
			right: 40,
			bottom: 50,
		},
		lineSmooth: Chartist.Interpolation.simple({
			divisor: 3,
		}),
		low: 0,
		plugins: [Chartist.plugins.tooltip()],
	};

	dataPage = {
		labels: labels,
		series: [series1, series2],
	};

	var bandwidthChart = Chartist.Line('#bandwidth-chart', dataPage, optionsPage);

	bandwidthChart.on('draw', function(data) {
		if (data.type === 'line' || data.type === 'area') {
			data.element.animate({
				d: {
					begin: 0,
					dur: 1000,
					from: data.path
						.clone()
						.scale(1, 0)
						.translate(0, data.chartRect.height())
						.stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint,
				},
			});
		}
	});
}

/*---------------------------------------------------------------------
	Settings Functions
---------------------------------------------------------------------*/

function showSettingsModal() {
	$('#SettingsModalLink').trigger('click');
}

function saveDashboardSettings() {
	localStorage.setItem('dashboard_interval', $('#dashboard_interval').val());
	localStorage.setItem('dashboard_overview', document.getElementById('dashboard_overview').checked);
	localStorage.setItem('dashboard_wlan', document.getElementById('dashboard_wlan').checked);
	localStorage.setItem('dashboard_infra', document.getElementById('dashboard_infra').checked);
	localStorage.setItem('dashboard_top', document.getElementById('dashboard_top').checked);
	localStorage.setItem('dashboard_condensed', document.getElementById('dashboard_condensed').checked);
	localStorage.setItem('dashboard_clients', document.getElementById('dashboard_clients').checked);
	updateVisibleCards();

	getDashboardData();
}

function updateVisibleCards() {
	if (document.getElementById('dashboard_overview').checked) {
		document.getElementById('overview-cards').hidden = false;
	} else {
		document.getElementById('overview-cards').hidden = true;
	}
	
	if (document.getElementById('dashboard_condensed').checked) {
		graphHeightMultiplier = 0.8;
		document.getElementById('client-card').setAttribute("style","height:470px");
		document.getElementById('infra-card').setAttribute("style","height:470px");
		document.getElementById('top-aps-card').classList.remove('col-md-6');
		document.getElementById('top-aps-card').classList.add('col-md-4');
		document.getElementById('top-clients-card').classList.remove('col-md-6');
		document.getElementById('top-clients-card').classList.add('col-md-4');
		document.getElementById('top-apps-card').classList.remove('col-md-6');
		document.getElementById('top-apps-card').classList.add('col-md-4');	
		resizeInfraTable('350px');
	} else {
		graphHeightMultiplier = 1
		document.getElementById('client-card').setAttribute("style","height:530px");
		document.getElementById('infra-card').setAttribute("style","height:530px");
		document.getElementById('top-aps-card').classList.remove('col-md-4');
		document.getElementById('top-aps-card').classList.add('col-md-6');
		document.getElementById('top-clients-card').classList.remove('col-md-4');
		document.getElementById('top-clients-card').classList.add('col-md-6');
		document.getElementById('top-apps-card').classList.remove('col-md-4');
		document.getElementById('top-apps-card').classList.add('col-md-6');	
		resizeInfraTable('400px');
	}
	
	if (document.getElementById('dashboard_wlan').checked) {
		dashboardWLAN = true;
		document.getElementById('wlan-md').hidden = false;
	} else {
		dashboardWLAN = false;
		document.getElementById('wlan-md').hidden = true;
	}
	
	if (document.getElementById('dashboard_clients').checked) {
		document.getElementById('mix-card').hidden = false;
		document.getElementById('band-card').hidden = false;
	} else {
		document.getElementById('mix-card').hidden = true;
		document.getElementById('band-card').hidden = true;
	}

	if (document.getElementById('dashboard_infra').checked) {
		dashboardInfra = true;
		document.getElementById('infra-md').hidden = false;
	} else {
		dashboardInfra = false;
		document.getElementById('infra-md').hidden = true;
	}

	if (dashboardWLAN && !dashboardInfra) {
		document.getElementById('wlan-md').classList.remove('col-md-8');
		document.getElementById('wlan-md').classList.add('col-md-12');
		//$('#wlan-md').load(window.location.href + ' #wlan-md');
	} else if (dashboardWLAN && dashboardInfra) {
		document.getElementById('wlan-md').classList.remove('col-md-12');
		document.getElementById('wlan-md').classList.add('col-md-8');
		//$('#wlan-md').load(window.location.href + ' #wlan-md');
	}

	if (document.getElementById('dashboard_top').checked) {
		dashboardTop = true;
		document.getElementById('top-aps-card').hidden = false;
		document.getElementById('top-clients-card').hidden = false;
		document.getElementById('top-apps-card').hidden = false;
	} else {
		dashboardTop = false;
		document.getElementById('top-aps-card').hidden = true;
		document.getElementById('top-clients-card').hidden = true;
		document.getElementById('top-apps-card').hidden = true;
	}

	/*
	if (document.getElementById('dashboard_dhcp').checked) {
		dashboardDHCP = true;
		document.getElementById('dhcp-card').hidden = false;
	} else {
		dashboardDHCP = false;
		document.getElementById('dhcp-card').hidden = true;
	}*/
}

function resizeInfraTable(newHeight) {
	var table = $('#infra-table').DataTable();
	table.clear().destroy();
	
	$('#infra-table').DataTable({
		responsive: true,
		paging: false,
		searching: false,
		info: false,
		scrollX: false,
		scrollY: newHeight,
		scrollCollapse: true,
		'order': [[0, 'desc']],
		"columnDefs": [
			{ "targets": [0], "visible": false },
			{ "targets": [2], className: 'col-100' }],
		"fnDrawCallback": function (oSettings) { $('[data-toggle="tooltip"]').tooltip(); $(oSettings.nTHead).hide(); }
	});
	
	loadInfraTable();
}

/*---------------------------------------------------------------------
	UI Override Functions
---------------------------------------------------------------------*/

function loadCurrentPageClient() {
	updateClientGraphs();
}
