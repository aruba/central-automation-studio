/*
Central Automation v1.1.4
Updated: 1.8.2
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var rfEvents = [];
var noiseEvents = [];
var rfhistory = [];
var staticRadios = [];
var powerLabels = [];

var optimizations = {};

var sixChannel;
var fiveChannel;
var twoChannel;
var sixPower;
var fivePower;
var twoPower;

var labels2 = ['1', '6', '11'];
var labels5 = ['36', '40', '44', '48', '52', '56', '60', '64', '100', '104', '108', '112', '116', '120', '124', '128', '132', '136', '140', '144', '149', '153', '157', '161', '165'];

var selectedDevices = {};
var deviceInfo = {};
var frozenDevices = 0;
var frozenErrors = 0;
var currentAPIndex = 0;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findAPForRadio(radiomac) {
	// Check APs for radio mac
	var foundDevice = null;
	var aps = getAPs();
	$.each(aps, function() {
		for (var i = 0, len = this.radios.length; i < len; i++) {
			if (this.radios[i]['macaddr'] === radiomac) {
				foundDevice = this;
				return false; // break  out of the for loop
			}
		}
	});

	return foundDevice;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Run Now
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated: 1.8.0
function airmatchRunNow() {
	showNotification('ca-run-shoes', 'Running AirMatch...', 'bottom', 'center', 'info');

	var select = document.getElementById('modeselector');
	var runmode = select.value;
	var runModeLabel = select.options[select.selectedIndex].text;

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/scheduler/v1/runnow?runnow_type=' + runmode,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("Run Now: "+ JSON.stringify(response))
		if (xhr.status == 200) {
			Swal.fire({
				title: 'Success',
				text: 'AirMatch was triggered to run now (' + runModeLabel + ')',
				icon: 'success',
			});
			// refresh group data to include new group
		} else {
			logError(response.status);
			Swal.fire({
				title: 'Failure',
				text: 'AirMatch was not able to be triggered to run now (' + runModeLabel + ')',
				icon: 'error',
			});
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Pull AirMatch Data from Central
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated: 1.8.0
function updateAirMatchData() {
	$.when(tokenRefresh()).then(function() {
		showNotification('ca-wifi', 'Obtaining APs...', 'bottom', 'center', 'info');
		$.when(getAPData(0, false)).then(function() {
			fiveChannel = Array.apply(null, new Array(labels5.length)).map(Number.prototype.valueOf, 0);
			twoChannel = Array.apply(null, new Array(labels2.length)).map(Number.prototype.valueOf, 0);
			sixPower = Array.apply(null, new Array(30)).map(Number.prototype.valueOf, 0);
			fivePower = Array.apply(null, new Array(30)).map(Number.prototype.valueOf, 0);
			twoPower = Array.apply(null, new Array(30)).map(Number.prototype.valueOf, 0);

			$('#lastrun-table')
				.DataTable()
				.clear();
			$('#lastrun-table')
				.DataTable()
				.rows()
				.draw();

			powerLabels = [];

			getEIRPDistribution();
			getChannelDistribution();
			getRFEvents();
			getNoiseEvents();
			getAirmatchOptimization();
			getStaticRadios();
			//getAirMatchHistory();
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		EIRP
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getEIRPDistribution() {
	showNotification('ca-chart-bar-32', 'Getting EIRP Distribution...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/telemetry/v1/adv_eirp_distrubution',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("EIRP Distribution: "+ JSON.stringify(response))
		// Build labels and sort them

		for (let k in response['6ghz']) {
			var index = powerLabels.indexOf(k);
			if (index == -1) {
				if (k !== 'EIRP Static') powerLabels.push(k);
			}
		}
		for (let k in response['5ghz']) {
			var index = powerLabels.indexOf(k);
			if (index == -1) {
				if (k !== 'EIRP Static') powerLabels.push(k);
			}
		}
		for (let k in response['2.4ghz']) {
			var index = powerLabels.indexOf(k);
			if (index == -1) {
				if (k !== 'EIRP Static') powerLabels.push(k);
			}
		}
		powerLabels.sort(function(a, b) {
			return a - b;
		});

		for (let k in response['6ghz']) {
			var index = powerLabels.indexOf(k);
			if (index != -1) {
				sixPower[index] = response['6ghz'][k];
			}
		}
		for (let k in response['5ghz']) {
			var index = powerLabels.indexOf(k);
			if (index != -1) {
				fivePower[index] = response['5ghz'][k];
			}
		}
		for (let k in response['2.4ghz']) {
			var index = powerLabels.indexOf(k);
			if (index != -1) {
				twoPower[index] = response['2.4ghz'][k];
			}
		}

		if (powerLabels.length > 0) {
			var data = {
				labels: powerLabels,
				series: [sixPower, fivePower, twoPower],
			};

			var options = {
				seriesBarDistance: 10,
				axisX: {
					showGrid: false,
				},
				axisY: {
					onlyInteger: true,
					offset: 0,
				},
				height: '200px',
			};

			var responsiveOptions = [
				[
					'screen and (max-width: 640px)',
					{
						seriesBarDistance: 10,
						axisX: {
							labelInterpolationFnc: function(value) {
								return value[0];
							},
						},
					},
				],
			];

			var eirpChart = Chartist.Bar('#eirpChart', data, options, responsiveOptions);
			eirpChart.on('draw', function(data) {
				if (data.type == 'bar') {
					data.element.animate({
						y2: {
							dur: '0.2s',
							from: data.y1,
							to: data.y2,
						},
					});
				}
			});
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Channels
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getChannelDistribution() {
	showNotification('ca-chart-bar-32', 'Getting Channel Distribution...', 'bottom', 'center', 'info');

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/solver/v1/radio_plan',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		console.log(response);
		//console.log("Channel Distribution: "+ JSON.stringify(response))
		$.each(response, function() {
			if (this['band'] === '2.4GHz') {
				var index = labels2.indexOf(this['channel'].toString());
				if (index != -1) {
					twoChannel[index] = twoChannel[index] + 1;
				}
			}
			if (this['band'] === '5GHz') {
				if (this['channel'].toString() === '120') console.log(this);
				var index = labels5.indexOf(this['channel'].toString());
				if (index != -1) {
					fiveChannel[index] = fiveChannel[index] + 1;
				}
			}
		});

		var data2 = {
			labels: labels2,
			series: [twoChannel],
		};

		var options2 = {
			seriesBarDistance: 10,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 20,
			},
			height: '200px',
		};

		var responsiveOptions2 = [
			[
				'screen and (max-width: 640px)',
				{
					seriesBarDistance: 5,
					axisX: {
						labelInterpolationFnc: function(value) {
							return value[0];
						},
					},
				},
			],
		];
		var twoGChart = Chartist.Bar('#channelChart2GHz', data2, options2, responsiveOptions2);
		twoGChart.on('draw', function(data) {
			if (data.type == 'bar') {
				data.element.animate({
					y2: {
						dur: '0.2s',
						from: data.y1,
						to: data.y2,
					},
				});
			}
		});

		var data5 = {
			labels: labels5,
			series: [fiveChannel],
		};

		var options5 = {
			seriesBarDistance: 10,
			axisX: {
				showGrid: false,
			},
			axisY: {
				onlyInteger: true,
				offset: 20,
			},
			height: '200px',
		};

		var responsiveOptions5 = [
			[
				'screen and (max-width: 640px)',
				{
					seriesBarDistance: 5,
					axisX: {
						labelInterpolationFnc: function(value) {
							return value[0];
						},
					},
				},
			],
		];
		var fiveGChart = Chartist.Bar('#channelChart5GHz', data5, options5, responsiveOptions5);
		fiveGChart.on('draw', function(data) {
			if (data.type == 'bar') {
				data.element.animate({
					y2: {
						dur: '0.2s',
						from: data.y1,
						to: data.y2,
					},
				});
			}
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Optimizations
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated: 1.8.0
function getAirmatchOptimization() {
	showNotification('ca-hotspot', 'Getting AirMatch Optimisation...', 'bottom', 'center', 'info');

	// Grab the optimizations - latest 11 (1 for Latest section, next 10 for the table)
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/solver/v1/optimization?count=11',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response)
		//console.log("AirMatch Optimization: "+ JSON.stringify(response))

		var optimizationIndex = 0;

		$.each(response, function() {
			// Reset variables
			var airMatchEpoch;
			var two_deployed = false;
			var five_deployed = false;
			var six_deployed = false;
			var two_improvement = 0;
			var five_improvement = 0;
			var six_improvement = 0;
			var two_num_ap = 0;
			var five_num_ap = 0;
			var six_num_ap = 0;
			var two_num_radios = 0;
			var five_num_radios = 0;
			var six_num_radios = 0;
			var sequence = 0;
			var two_new_radios = false;
			var five_new_radios = false;
			var six_new_radios = false;
			var two_counter = 0;
			var five_counter = 0;
			var six_counter = 0;
			var runmode = 0;

			var results = [];
			var optimization = this;
			var timestamp = '';

			// need to loop through Band:RFDomain:RFPartition keys in the list...
			var optimizationKeys = Object.keys(this);
			$.each(optimizationKeys, function() {
				var currentData = optimization[this];

				if (this.includes('2.4GHz')) {
					// Add together all the 2.4Ghz data - AP counts, Radio counts, Improvement (will be averaged across all rf domains and partitions)
					timestamp = currentData['timestamp'];
					airMatchEpoch = currentData['timestamp'];
					if (currentData['timestamp'] >= airMatchEpoch) {
						airMatchEpoch = currentData['timestamp'];
						two_deployed = currentData['meta']['deploy'];
					}
					two_improvement = two_improvement + currentData['meta']['improvement_percent'];
					two_counter++;
					two_num_ap = two_num_ap + currentData['num_ap'];
					two_num_radios = two_num_radios + currentData['num_radio'];
					two_new_radios = currentData['meta']['new_radios_computed'];
					runmode = currentData['runmode'];
					results = results.concat(currentData['result']);
				} else if (this.includes('5GHz')) {
					// Add together all the 5Ghz data - AP counts, Radio counts, Improvement (will be averaged across all rf domains and partitions)
					timestamp = currentData['timestamp'];
					airMatchEpoch = currentData['timestamp'];
					if (currentData['timestamp'] >= airMatchEpoch) {
						airMatchEpoch = currentData['timestamp'];
						five_deployed = currentData['meta']['deploy'];
					}
					five_improvement = five_improvement + currentData['meta']['improvement_percent'];
					five_counter++;
					five_num_ap = five_num_ap + currentData['num_ap'];
					five_num_radios = five_num_radios + currentData['num_radio'];
					five_new_radios = currentData['meta']['new_radios_computed'];
					runmode = currentData['runmode'];
					results = results.concat(currentData['result']);
				} else if (this.includes('6GHz')) {
					// Add together all the 6Ghz data - AP counts, Radio counts, Improvement (will be averaged across all rf domains and partitions)
					timestamp = currentData['timestamp'];
					airMatchEpoch = currentData['timestamp'];
					if (currentData['timestamp'] >= airMatchEpoch) {
						airMatchEpoch = currentData['timestamp'];
						six_deployed = currentData['meta']['deploy'];
					}
					six_improvement = six_improvement + currentData['meta']['improvement_percent'];
					six_counter++;
					six_num_ap = six_num_ap + currentData['num_ap'];
					six_num_radios = six_num_radios + currentData['num_radio'];
					six_new_radios = currentData['meta']['new_radios_computed'];
					runmode = currentData['runmode'];
					results = results.concat(currentData['result']);
				}
			});

			// Convert timestamp into actual date
			if (airMatchEpoch < 10000000000) airMatchEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
			var airMatchEpoch = airMatchEpoch + new Date().getTimezoneOffset() * -1; //for timeZone
			eventTime = new Date(airMatchEpoch);

			// Convert boolean into words for deployed state
			var two_deployedState = 'Not Deployed';
			if (two_deployed) two_deployedState = 'Deployed';
			var five_deployedState = 'Not Deployed';
			if (five_deployed) five_deployedState = 'Deployed';
			var six_deployedState = 'Not Deployed';
			if (six_deployed) six_deployedState = 'Deployed';

			// Build improvement strings. Averaged out across the RF domains and partitions per band.
			var two_improvement_string =
				two_counter == 0
					? '0'
					: Number(two_improvement / two_counter)
							.toFixed(0)
							.toString();
			var five_improvement_string =
				five_counter == 0
					? '0'
					: Number(five_improvement / five_counter)
							.toFixed(0)
							.toString();
			var six_improvement_string =
				six_counter == 0
					? '0'
					: Number(six_improvement / six_counter)
							.toFixed(0)
							.toString();

			// Pretty up the runmode for display
			var runModeType = 'Scheduled';
			if (runmode == 1) runModeType = 'On-Demand';
			else if (runmode == 2) runModeType = 'Quick';
			else if (runmode == 3) runModeType = 'Incremental';
			else if (runmode == 4) runModeType = 'Incremental - Auto';
			else if (runmode == 5) runModeType = 'EIRP Only';
			else if (runmode == 6) runModeType = 'Opmode';

			if (optimizationIndex == 0) {
				// only update the "Latest" section with the first result
				document.getElementById('airmatch-LastRunDate').innerHTML = 'Date Last Run: <strong>' + eventTime.toLocaleString() + '</strong>';
				document.getElementById('airmatch-RunMode').innerHTML = 'Run Mode: <strong>' + runModeType + '</strong>';

				document.getElementById('airmatch-6-Deployed').innerHTML = '<strong>Deployed:</strong> ' + six_deployedState;
				document.getElementById('airmatch-6-APs').innerHTML = '<strong>APs:</strong> ' + six_num_ap;
				document.getElementById('airmatch-6-Radios').innerHTML = '<strong>Radios:</strong> ' + six_num_radios;
				document.getElementById('airmatch-6-Improvement').innerHTML = '<strong>Improvement:</strong> ' + six_improvement_string + '%';
				document.getElementById('airmatch-6-NewRadios').innerHTML = six_new_radios ? '<strong>New Radios Included:</strong> Yes' : '<strong>New Radios Included:</strong> No';

				document.getElementById('airmatch-5-Deployed').innerHTML = '<strong>Deployed:</strong> ' + five_deployedState;
				document.getElementById('airmatch-5-APs').innerHTML = '<strong>APs:</strong> ' + five_num_ap;
				document.getElementById('airmatch-5-Radios').innerHTML = '<strong>Radios:</strong> ' + five_num_radios;
				document.getElementById('airmatch-5-Improvement').innerHTML = '<strong>Improvement:</strong> ' + five_improvement_string + '%';
				document.getElementById('airmatch-5-NewRadios').innerHTML = five_new_radios ? '<strong>New Radios Included:</strong> Yes' : '<strong>New Radios Included:</strong> No';

				document.getElementById('airmatch-2-Deployed').innerHTML = '<strong>Deployed:</strong> ' + two_deployedState;
				document.getElementById('airmatch-2-APs').innerHTML = '<strong>APs:</strong> ' + two_num_ap;
				document.getElementById('airmatch-2-Radios').innerHTML = '<strong>Radios:</strong> ' + two_num_radios;
				document.getElementById('airmatch-2-Improvement').innerHTML = '<strong>Improvement: </strong> ' + two_improvement_string + '%';
				document.getElementById('airmatch-2-NewRadios').innerHTML = two_new_radios ? '<strong>New Radios Included:</strong> Yes' : '<strong>New Radios Included:</strong> No';

				document.getElementById('loadOptimizationBtn').setAttribute('onClick', 'javascript: loadOptimization(' + timestamp + ');');
			} else {
				// rest of the results go into the table
				var table = $('#lastrun-table').DataTable();
				table.row.add([timestamp, '<strong><span style="display:none;">' + airMatchEpoch + '</span>' + eventTime.toLocaleString() + '</strong>', runModeType, five_deployedState, five_num_ap, five_num_radios, five_improvement_string, two_deployedState, two_num_ap, two_num_radios, two_improvement_string]);
			}

			// Add the radio info in under the timestamp
			optimizations[timestamp] = results;
			optimizationIndex++;

			$('#lastrun-table')
				.DataTable()
				.rows()
				.draw();
		});
		showNotification('ca-hotspot', 'Retrieved Lastest AirMatch Optimisation', 'bottom', 'center', 'success');
	});
}

// Updated: 1.8.0
function loadOptimization(timestamp) {
	$('#optimization-table')
		.DataTable()
		.clear();
	var results = optimizations[timestamp];
	var table = $('#optimization-table').DataTable();
	airMatchEpoch = timestamp;
	if (airMatchEpoch < 10000000000) airMatchEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
	var airMatchEpoch = airMatchEpoch + new Date().getTimezoneOffset() * -1; //for timeZone
	eventTime = new Date(airMatchEpoch);
	document.getElementById('optimizationTitle').innerHTML = 'Optimization Details: <strong>' + eventTime.toLocaleString() + '</strong>';

	$.each(results, function() {
		var foundAP = findAPForRadio(this['mac']);

		var channel = this['channel'];
		if (this['chan_frozen']) channel = channel + ' *';

		var bandwidth = this['bandwidth'].replace('CBW', '') + 'MHz';
		if (this['cbw_frozen']) bandwidth = bandwidth + ' *';

		var eirp = this['eirp_dbm'] + 'dBm';
		if (this['chan_frozen']) eirp = eirp + ' *';

		var channelList = '';
		var feasibleChannels = this['solver_feas_list']['chan_list'];
		var channelWidths = this['solver_feas_list']['bw_list'];
		$.each(channelWidths, function() {
			if (this.toString() === 'CBW160') channelList += feasibleChannels[this].join('S, ') + 'S, ';
			if (this.toString() === 'CBW80') channelList += feasibleChannels[this].join('E, ') + 'E, ';
			if (this.toString() === 'CBW40') channelList += feasibleChannels[this].join('+, ') + '+, ';
			if (this.toString() === 'CBW20') channelList += feasibleChannels[this].join(', ') + ', ';
		});
		channelList = channelList.replace(/(, $)/, '');

		table.row.add([foundAP['name'], this['band'], '<span data-toggle="tooltip" data-placement="right" title="Valid Channels: ' + channelList + '">' + channel + '</span>', bandwidth, eirp]);
	});

	$('#optimization-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
	$('#OptimizationModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Static Radios
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated: 1.8.0
function getStaticRadios() {
	showNotification('ca-snow', 'Getting Static radios...', 'bottom', 'center', 'info');

	$('#static-table')
		.DataTable()
		.clear();
	$('#static-table')
		.DataTable()
		.rows()
		.draw();
	staticRadios = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/telemetry/v1/static_radio_all',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("Static Radios: "+ JSON.stringify(response))

		staticRadios = staticRadios.concat(response);
		$.each(response, function() {
			//console.log(this)
			var reason = '';
			var eventTime = null;
			var baseEventTime = null;
			if (this['chan_reason'] === 'AIRMATCH_FREEZE' && this['eirp_reason'] === 'AIRMATCH_FREEZE') {
				// frozen channel add to list...
				var chan_epoch = this['chan_timestamp'];
				var eirp_epoch = this['eirp_timestamp'];
				var epoch;
				if (chan_epoch > eirp_epoch) epoch = chan_epoch;
				else epoch = eirp_epoch;
				baseEventTime = epoch;
				if (epoch < 10000000000) epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var epoch = epoch + new Date().getTimezoneOffset() * -1; //for timeZone
				eventTime = new Date(epoch);
				reason = 'Frozen EIRP & Channel';
			} else if (this['chan_reason'] === 'AIRMATCH_FREEZE') {
				// frozen channel add to list...
				var chan_epoch = this['chan_timestamp'];
				baseEventTime = chan_epoch;
				if (chan_epoch < 10000000000) chan_epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var chan_epoch = chan_epoch + new Date().getTimezoneOffset() * -1; //for timeZone
				eventTime = new Date(chan_epoch);
				reason = 'Frozen Channel';
			} else if (this['eirp_reason'] === 'AIRMATCH_FREEZE') {
				// frozen channel add to list...
				var eirp_epoch = this['eirp_timestamp'];
				baseEventTime = eirp_epoch;
				if (eirp_epoch < 10000000000) eirp_epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var eirp_epoch = eirp_epoch + new Date().getTimezoneOffset() * -1; //for timeZone
				eventTime = new Date(eirp_epoch);
				reason = 'Frozen EIRP';
			}

			if (reason) {
				var bandwidth = this['bandwidth'].replace('CBW', '') + 'MHz';
				var foundAP = findAPForRadio(this['mac']);

				var thawBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Unfreeze AP" onclick="unfreezeAP(\'' + foundAP['serial'] + "', '" + this['band'] + '\')"><i class="fas fa-sun"></i></a>';

				// Add row to table
				var table = $('#static-table').DataTable();
				table.row.add(['<span style="display:none;">' + baseEventTime + '</span>' + eventTime.toLocaleString(), this['ap_name'], reason, this['channel'], bandwidth, this['eirp'] + 'dBm', thawBtn]);
				$('#static-table')
					.DataTable()
					.rows()
					.draw();
			}
		});
		$('[data-toggle="tooltip"]').tooltip();
	});
}

// Added: 1.8.0
function unfreezeAP(serial, band) {
	showNotification('ca-sun', 'Unfreezing radio on ' + band, 'bottom', 'center', 'info');
	//console.log(band)

	// Get current AP settings
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
		} else {
			// Update ap settings
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + serial,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ achannel: band === '5GHz' ? '0' : response.achannel, atxpower: band === '5GHz' ? '-127' : response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: band === '2.4GHz' ? '0' : response.gchannel, gtxpower: band === '2.4GHz' ? '-127' : response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: response.hostname }),
				}),
			};

			$.ajax(settings).done(function(response, statusText, xhr) {
				if (response !== serial) {
					logError(serial + ' was not unfrozen');
					//console.log(response.reason);
					apiErrorCount++;
				} else {
					showNotification('ca-sun', 'Radio unfrozen on ' + band, 'bottom', 'center', 'success');
					$('#static-table')
						.DataTable()
						.clear();
					$('#static-table')
						.DataTable()
						.rows()
						.draw();
					staticRadios = [];
					getStaticRadios();
				}
			});
		}
	});
}

// Added: 1.8.0
function selectAPsToFreeze() {
	selectedDevices = {};
	$('#freeze-ap-table')
		.DataTable()
		.clear();
	$('#freeze-ap-table')
		.DataTable()
		.rows()
		.draw();
	// load up APs into freeze-ap-table
	var currentAPs = getAPs();

	$.each(currentAPs, function() {
		var checkBoxString = '<input class="" type="checkbox" id="' + this['serial'] + '" onclick="updateSelectedAPs(\'' + this['serial'] + '\')">';
		//if (checked) checkBoxString = '<input class="" type="checkbox" id="'+this["serial"]+'" onclick="updateSelectedAPs(\''+this["serial"]+'\')" checked>';

		// Build Status dot
		var status = '<i class="fa fa-circle text-danger"></i>';
		if (this['status'] === 'Up') {
			status = '<i class="fa fa-circle text-success"></i>';
		}

		// Build Channels and power
		var channel5 = '-';
		var power5 = '-';
		var channel2 = '-';
		var power2 = '-';
		$.each(this['radios'], function() {
			if (this['band'] == 1 && this['index'] == 0) {
				if (this['channel'] && this['channel'] !== '0') channel5 = this['channel'];
				if (this['tx_power']) power5 = this['tx_power'].toString() + 'dBm';
			} else if (this['band'] == 0) {
				if (this['channel'] && this['channel'] !== '0') channel2 = this['channel'];
				if (this['tx_power']) power2 = this['tx_power'].toString() + 'dBm';
			}
		});

		// Add AP to table
		var table = $('#freeze-ap-table').DataTable();
		table.row.add([checkBoxString, '<strong>' + this['name'] + '</strong>', status, this['serial'], this['macaddr'], this['group_name'], this['site'], channel5 + ' / ' + power5, channel2 + ' / ' + power2]);
	});
	$('#freeze-ap-table')
		.DataTable()
		.rows()
		.draw();
	$('#FreezeModalLink').trigger('click');
}

// Added: 1.8.0
function updateSelectedAPs(serial) {
	if (document.getElementById(serial)) {
		var rowSelected = document.getElementById(serial).checked;
		if (!rowSelected) document.getElementById('ap-select-all').checked = false;

		if (selectedDevices[serial] && !rowSelected) delete selectedDevices[serial];
		else selectedDevices[serial] = serial;
	}
}

// Added: 1.8.0
function freezeSelectedAPs() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'All selected APs will have their EIRP and Channel statically assigned',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#23CCEF',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, freeze them!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmedAPFreeze();
		}
	});
}

// Added: 1.8.0
function confirmedAPFreeze() {
	showNotification('ca-snow', 'Freezing radios on selected APs', 'bottom', 'center', 'info');
	frozenDevices = 0;
	frozenErrors = 0;
	currentAPIndex = 0;
	// freeze first AP
	freezeAP(Object.keys(selectedDevices)[currentAPIndex]);
}

// Added: 1.8.0
function freezeAP(serial) {
	var apMonitoring = findDeviceInMonitoring(serial);
	// Get current AP settings
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
		} else {
			// Update ap settings back into Central
			var channel5 = '0';
			var power5 = '-127';
			var channel2 = '0';
			var power2 = '-127';

			$.each(apMonitoring['radios'], function() {
				//console.log(this)
				if (this['band'] == 1 && this['index'] == 0) {
					if (this['channel'] && this['channel'] !== '0') channel5 = this['channel'];
					if (channel5.includes('-')) {
						// convert from - to a + channel
						channel5int = parseInt(channel5.slice(0, -1));
						channel5int = channel5int - 4;
						channel5 = channel5int.toString() + '+';
					}
					if (this['tx_power']) power5 = this['tx_power'].toString();
				} else if (this['band'] == 0) {
					if (this['channel'] && this['channel'] !== '0') channel2 = this['channel'];
					if (this['tx_power']) power2 = this['tx_power'].toString();
				}
			});

			var apZone = response.zonename;
			if (apZone === '_#ALL#_') apZone = '';

			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + serial,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ achannel: channel5, atxpower: power5, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: channel2, gtxpower: power2, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: apZone, hostname: response.hostname }),
				}),
			};

			$.ajax(settings).done(function(response, statusText, xhr) {
				if (xhr.status != 200) {
					logError(serial + ' was not frozen');
					//console.log(response.reason);
					frozenErrors++;
				} else {
					frozenDevices++;
				}

				// check if finished
				if (frozenDevices + frozenErrors == Object.keys(selectedDevices).length) {
					if (frozenErrors > 0) {
						Swal.fire({
							title: 'Freeze Failure',
							text: 'Some or all AP radios failed to be frozen',
							icon: 'error',
						});
					} else {
						Swal.fire({
							title: 'Freeze Success',
							text: 'All AP radios were frozen',
							icon: 'success',
						});
					}
					$('#static-table')
						.DataTable()
						.clear();
					$('#static-table')
						.DataTable()
						.rows()
						.draw();
					staticRadios = [];
					getStaticRadios();
				} else {
					// freeze next AP in list
					currentAPIndex++;
					freezeAP(Object.keys(selectedDevices)[currentAPIndex]);
				}
			});
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		RF Events
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getRFEvents() {
	showNotification('ca-opening-times', 'Getting Events...', 'bottom', 'center', 'info');

	$('#rfevents-table')
		.DataTable()
		.clear();
	$('#rfevents-table')
		.DataTable()
		.rows()
		.draw();
	rfEvents = [];

	rfEvents = [];
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/telemetry/v1/rf_events_all',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("RF Events: "+ JSON.stringify(response))
		rfEvents = rfEvents.concat(response);

		$.each(response, function() {
			if (this['mac']) {
				foundAP = findAPForRadio(this['mac']);
				if (!foundAP) {
					foundAP = {};
					foundAP['name'] = this['mac'];
				}
				var epoch = this['timestamp'];
				if (epoch < 10000000000) epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var epoch = epoch + new Date().getTimezoneOffset() * -1; //for timeZone
				var eventTime = new Date(epoch);

				var new_bandwidth = this['new_bandwidth'].replace('CBW', '') + 'MHz';
				var old_bandwidth = this['bandwidth'].replace('CBW', '') + 'MHz';

				var new_channel = this['new_channel'];
				var old_channel = this['channel'];

				var type = this['type'];
				if (type === 'AIRMATCH_SOLVER') type = 'AirMatch Assigned';
				else type = titleCase(noUnderscore(type));

				if (old_bandwidth !== new_bandwidth || old_channel !== new_channel) {
					// Add row to table
					var table = $('#rfevents-table').DataTable();
					table.row.add(['<span style="display:none;">' + this['timestamp'] + '</span>' + eventTime.toLocaleString(), foundAP['name'], type, new_channel, new_bandwidth, old_channel, old_bandwidth]);
				}
			}
		});
		$('#rfevents-table')
			.DataTable()
			.rows()
			.draw();
	});
}

function getNoiseEvents() {
	showNotification('ca-radar', 'Getting Radar & Noise Events...', 'bottom', 'center', 'info');

	$('#noise-table')
		.DataTable()
		.clear();
	$('#noise-table')
		.DataTable()
		.rows()
		.draw();
	noiseEvents = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/airmatch/telemetry/v1/priority_rf_events_all',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("RF Events: "+ JSON.stringify(response))
		noiseEvents = noiseEvents.concat(response);

		$.each(response, function() {
			if (this['mac']) {
				foundAP = findAPForRadio(this['mac']);
				if (!foundAP) {
					foundAP = {};
					foundAP['name'] = this['mac'];
				}

				var epoch = this['timestamp'];
				if (epoch < 10000000000) epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var epoch = epoch + new Date().getTimezoneOffset() * -1; //for timeZone
				var eventTime = new Date(epoch);

				var bandwidth = this['bandwidth'].replace('CBW', '') + 'MHz';
				// Add row to table
				var table = $('#noise-table').DataTable();
				table.row.add(['<span style="display:none;">' + this['timestamp'] + '</span>' + eventTime.toLocaleString(), foundAP['name'], titleCase(noUnderscore(this['type'])), this['channel'], bandwidth, this['band']]);
			}
		});
		$('#noise-table')
			.DataTable()
			.rows()
			.draw();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		History
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getAirMatchHistory() {
	$('#rfhistory-table')
		.DataTable()
		.clear();
	$('#rfhistory-table')
		.DataTable()
		.rows()
		.draw();
	rfhistory = [];

	var aps = getAPs();
	$.each(aps, function() {
		if (this.firmware_version.startsWith('10.')) {
			for (var i = 0, len = this.radios.length; i < len; i++) {
				var url = localStorage.getItem('base_url') + '/airmatch/telemetry/v1/history/' + this.radios[i]['macaddr'];
				if (this.radios[i].band == 0) url = url + '/5GHz';
				else url = url + '/2.4GHz';

				var settings = {
					url: getAPIURL() + '/tools/getCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: url,
						access_token: localStorage.getItem('access_token'),
					}),
				};

				$.ajax(settings).done(function(response, statusText, xhr) {
					//console.log("AirMatch History: "+ JSON.stringify(response))

					rfhistory = rfhistory.concat(response);
					if (response.status && response.status !== 500) {
						$.each(response, function() {
							foundAP = findAPForRadio(this['mac']);
							var epoch = this['timestamp'];
							if (epoch < 10000000000) epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
							var epoch = epoch + new Date().getTimezoneOffset() * -1; //for timeZone
							var eventTime = new Date(epoch);

							var newBandwidth = this.new['bw'].replace('CBW', '') + 'MHz';
							var oldBandwidth = this.old['bw'].replace('CBW', '') + 'MHz';
							// Add row to table
							var table = $('#rfhistory-table').DataTable();
							table.row.add(['<span style="display:none;">' + this['timestamp'] + '</span>' + eventTime.toLocaleString(), foundAP['name'], this.new['chan'], this.new['eirp'] + 'dBm', newBandwidth, this.old['chan'], this.old['eirp'] + 'dBm', oldBandwidth, titleCase(noUnderscore(this['reason']))]);
						});
					}
					$('#rfhistory-table')
						.DataTable()
						.rows()
						.draw();
				});
			}
		}
	});
}
