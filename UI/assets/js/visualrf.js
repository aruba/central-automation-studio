/*
Central Automation v1.30
Updated:
Aaron Scott (WiFi Downunder) 2021-2023
*/

var colorArray = ['text-info', 'text-danger', 'text-warning', 'text-purple', 'text-success', 'text-primary', 'text-series7', 'text-series8'];

var allClients;
var osType = [];

var vrfBuildings = [];
var vrfFloors = [];
var vrfRogues = [];
var vrfRogueLocations = [];
var vrfAPs = [];
var vrfAPLocations = [];
var vrfPathloss = {}; // Possibly remove this
var vrfFloorplan;
var vrfFloorId;
var vrfBuildingId;
var vrfCampusId;
var vrfChannels = {};
var vrfClients;
var vrfClientLocations = [];
var vrfOptimization = [];
var needChannelList = false;
var currentAP = null;
var currentClient = null;
var currentFloor;
var storedAP;
var found;
const vrfLimit = 100;
const units = 'FEET';

var apImage;
var clientImage;
const ratio = window.devicePixelRatio;
const apColors = ['#23CCEF', '#FB404B', '#FFA534', '#9368E9', '#87CB16', '#1D62F0', '#5E5E5E', '#DD4B39', '#35465c', '#e52d27', '#55acee', '#cc2127', '#1769ff', '#6188e2', '#a748ca', '#ca489f', '#48ca9a', '#95e851', '#f2f536', '#b0b0b0', '#3414b5', '#1498b5', '#b55714', '#e3e3e3', '#851919', '#196385', '#88fceb', '#cafc88'];
var labels2 = ['1', '6', '11'];
var labels5 = ['36', '40', '44', '48', '52', '56', '60', '64', '100', '104', '108', '112', '116', '120', '124', '128', '132', '136', '140', '144', '149', '153', '157', '161', '165', '169', '173', '177'];
var labels6 = ['5', '21', '37', '53', '69', '85', '101', '117', '133', '149', '165', '181', '197', '213', '229'];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Callback functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';

	clientImage = new Image();
	clientImage.src = 'assets/img/client-icon.svg';

	// Get VRF data
	setTimeout(getCampus, 1000, false);

	updateBandSelector();
	updateChannelSelector();
}

function loadCurrentPageClient() {
	document.getElementById('secondaryFilter').style.display = 'none';
	allClients = getWirelessClients();
	osType = [];
	$.each(allClients, function() {
		if (!osType.includes(this.os_type) && !this.os_type.includes('--')) osType.push(this.os_type);
	});

	osType.sort((a, b) => {
		const siteA = a.toUpperCase(); // ignore upper and lowercase
		const siteB = b.toUpperCase(); // ignore upper and lowercase
		// Sort on Site Name
		if (siteA < siteB) {
			return -1;
		}
		if (siteA > siteB) {
			return 1;
		}
		return 0;
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	VisualAP functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function showVisualAP() {
	// Get VRF data
	getCampus(false);
	$('#VisualAPModalLink').trigger('click');
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
	vrfBuildingId = document.getElementById('buildingselector').value;
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
				clearAPCanvas();
				clearLinkCanvas();
				clearFloorplanCanvas();
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

function getFloorData(floorId) {
	vrfFloorId = document.getElementById('floorselector').value;

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
	// Draw floorplan
	resetCanvases();
	drawFloorplanImage(false);

	needChannelList = true;

	loadAPsForFloor(0);
}

function drawFloorplanImage(swap) {
	var superView = document.getElementById('ap-visualPlan');
	var canvas = document.getElementById('ap-floorplanCanvas');
	var ctx = canvas.getContext('2d');

	var floorplanImg = new Image();
	floorplanImg.src = 'data:image/png;base64,' + vrfFloorplan;
	floorplanImg.onload = function() {
		var normalWidth = superView.offsetWidth - 40;
		var normalHeight = normalWidth * (floorplanImg.height / floorplanImg.width);
		if (!swap) updateSizes(normalWidth, normalHeight);
		ctx.drawImage(floorplanImg, 0, 0, normalWidth, normalHeight);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		if (!document.getElementById('colourFloorplan').checked) {
			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			var dataArray = imageData.data;

			for (var i = 0; i < dataArray.length; i += 4) {
				var red = dataArray[i];
				var green = dataArray[i + 1];
				var blue = dataArray[i + 2];
				var alpha = dataArray[i + 3];

				var gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

				dataArray[i] = gray;
				dataArray[i + 1] = gray;
				dataArray[i + 2] = gray;
				dataArray[i + 3] = alpha;
			}
			ctx.putImageData(imageData, 0, 0);
		}
	};
}

function loadAPsForFloor(offset) {
	if (offset == 0) {
		vrfAPs = [];
		vrfChannels = { 2: [], 5: [], 6: [] };
		clearAPCanvas();
		clearLinkCanvas();
		clearInfoCanvas();
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
			changeFloorplanData();
		}
	});
}

function drawAPsOnFloorplan() {
	// Clear APs from view
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();

	// Draw APs on floorplan
	vrfAPLocations = [];
	var floorplanCanvas = document.getElementById('ap-floorplanCanvas');
	var canvas = document.getElementById('ap-apCanvas');
	var ctx = canvas.getContext('2d');
	$.each(vrfAPs, function() {
		var apLabel1 = this['ap_name'];
		var apLabel2 = null;
		var apLabel2Alt = ['', ''];
		var thisAP = findDeviceInMonitoring(this['serial_number']);
		if (needChannelList) {
			$.each(thisAP.radios, function() {
				var currentChannel = this.channel.replace(/\D/g, '');
				if (currentChannel !== '') {
					if (this.radio_name.includes('2.4 GHz') && !vrfChannels[2].includes(currentChannel)) {
						var currentChannels = vrfChannels[2];
						currentChannels.push(currentChannel);
						currentChannels.sort(function(a, b) {
							return a - b;
						});
						vrfChannels[2] = currentChannels;
					} else if (this.radio_name.includes('5 GHz') && !vrfChannels[5].includes(currentChannel)) {
						var currentChannels = vrfChannels[5];
						currentChannels.push(currentChannel);
						currentChannels.sort(function(a, b) {
							return a - b;
						});
						vrfChannels[5] = currentChannels;
					} else if (this.radio_name.includes('6 GHz') && !vrfChannels[6].includes(currentChannel)) {
						var currentChannels = vrfChannels[6];
						currentChannels.push(currentChannel);
						currentChannels.sort(function(a, b) {
							return a - b;
						});
						vrfChannels[6] = currentChannels;
					}
				}
			});
			updateChannelSelector();
		}

		x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
		y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
		vrfAPLocations.push({ x: x, y: y, serial: this['serial_number'] });

		// default AP colour
		ctx.fillStyle = 'white';

		var selectedBand = document.getElementById('bandselector').value;
		var selectedChannel = document.getElementById('channelselector').value;
		if (document.getElementById('visualizationselector').value === 'channels') {
			$.each(thisAP.radios, function() {
				var currentChannel = this.channel.replace(/\D/g, '');
				if (currentChannel !== '') {
					if (this.radio_name.includes('2.4 GHz') && selectedBand == 2 && (selectedChannel == parseInt(currentChannel) || selectedChannel == 'All')) {
						if (parseInt(currentChannel) == 1) {
							ctx.fillStyle = apColors[0];
						} else if (parseInt(currentChannel) == 6) {
							ctx.fillStyle = apColors[1];
						} else if (parseInt(currentChannel) == 11) {
							ctx.fillStyle = apColors[2];
						}
						apLabel2 = this.channel;
					} else if (this.radio_name.includes('2.4 GHz') && selectedChannel == 'All') {
						apLabel2Alt[0] = this.channel;
					}

					if (this.radio_name.includes('5 GHz') && selectedBand == 5 && (selectedChannel == parseInt(currentChannel) || selectedChannel == 'All')) {
						ctx.fillStyle = apColors[labels5.indexOf(currentChannel.toString())];
						apLabel2 = this.channel;
					} else if (this.radio_name.includes('5 GHz') && selectedChannel == 'All') {
						apLabel2Alt[1] = this.channel;
					}

					if (this.radio_name.includes('6 GHz') && selectedBand == 6 && (selectedChannel == parseInt(currentChannel) || selectedChannel == 'All')) {
						if (parseInt(currentChannel) < 97) {
							ctx.fillStyle = apColors[0];
						} else if (parseInt(currentChannel) < 189) {
							ctx.fillStyle = apColors[1];
						} else if (parseInt(currentChannel) < 234) {
							ctx.fillStyle = apColors[2];
						}
						apLabel2 = this.channel;
					} else if (this.radio_name.includes('6 GHz') && selectedChannel == 'All') {
						apLabel2Alt.push(this.channel);
					}
				}
			});
		} else if (document.getElementById('visualizationselector').value === 'health') {
			var memoryUsage = (((thisAP['mem_total'] - thisAP['mem_free']) / thisAP['mem_total']) * 100).toFixed(0);
			var uptime = thisAP['uptime'] ? thisAP['uptime'] : 0;

			if (thisAP['status'] === 'Down') ctx.fillStyle = '#FB404B';
			else if (memoryUsage > 90) ctx.fillStyle = '#FFA534';
			else if (thisAP['cpu_utilization'] > 70) ctx.fillStyle = '#FFA534';
			else if (uptime < 3600) ctx.fillStyle = '#FFA534';
			else ctx.fillStyle = '#87CB16';
		} else if (document.getElementById('visualizationselector').value === 'clients') {
			ctx.fillStyle = '#447DF7';
		}

		if (selectedBand == 'All' && document.getElementById('visualizationselector').value === 'channels') {
			apLabel2 = apLabel2Alt.join(' | ');
			ctx.fillStyle = '#447DF7';
		}

		ctx.beginPath();
		ctx.shadowColor = 'white';
		ctx.shadowBlur = 14;
		ctx.roundRect(x - 8, y - 8, 16, 16, 1);
		ctx.fill();
		ctx.drawImage(apImage, x - 10, y - 10, 20, 20);

		// Create Labels
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

	var apCanvas = document.getElementById('ap-apCanvas');
	apCanvas.onmouseup = function(e) {
		// important: correct mouse position:
		var rect = this.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		var i = 0;
		var r;

		found = false;
		// Search APs
		$.each(vrfAPLocations, function() {
			ap_x = this['x'];
			ap_y = this['y'];
			if (Math.abs(ap_x - x) <= 20 && Math.abs(ap_y - y) <= 20) {
				if (currentAP !== this) {
					found = true;
					currentAP = this;
				}
			}
		});

		if (found) {
			clearLinkCanvas();
			drawApLinks(currentAP);
		} else {
			clearLinkCanvas();
			currentAP = null;
			// otherwise search clients
			$.each(vrfClientLocations, function() {
				cl_x = this['x'];
				cl_y = this['y'];
				if (Math.abs(cl_x - x) <= 16 && Math.abs(cl_y - y) <= 16) {
					if (currentClient !== this) {
						found = true;
						currentClient = this;
					}
				}
			});
			if (found) {
				clearLinkCanvas();
				drawClientLink(currentClient);
			} else {
				clearLinkCanvas();
				currentClient = null;
			}
		}
	};
}

function loadClientsForFloor(offset) {
	if (offset == 0) {
		vrfClients = [];
		clearInfoCanvas();
	}

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + vrfFloorId + '/client_location?offset=' + offset + '&limit=' + vrfLimit + '&units=' + units,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>/client_location)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		currentFloor = response['floor'];
		vrfClients = vrfClients.concat(response['locations']);
		offset += vrfLimit;
		if (offset < response['location_count']) {
			loadClientsForFloor(offset);
		} else {
			drawClientsOnFloorplan();
		}
	});
}

function drawClientsOnFloorplan() {
	clearLinkCanvas();
	clearInfoCanvas();

	vrfClientLocations = [];
	// Draw Clients on floorplan
	var floorplanCanvas = document.getElementById('ap-floorplanCanvas');
	var canvas = document.getElementById('ap-infoCanvas');
	var ctx = canvas.getContext('2d');
	var selectedBand = document.getElementById('bandselector').value;
	if (selectedBand == 2) selectedBand = 2.4;
	var selectedChannel = document.getElementById('channelselector').value;
	var secondaryFilter = document.getElementById('secondaryselector').value;
	var includeUnassociated = document.getElementById('unassociatedCheckbox').checked;

	$.each(vrfClients, function() {
		var thisClient = this.device_mac;
		// Only show if required (including unassociated or not)
		if (includeUnassociated || this.associated) {
			var foundClient = null;
			$.each(allClients, function() {
				if (this.macaddr === thisClient) {
					foundClient = this;
				}
			});

			var showClient = true;
			var clientOS = false;
			var clientBand = false;
			var clientChannel = false;
			// Match criteria is is a device found in Central - otherwise only show if "All"
			if (document.getElementById('visualizationselector').value === 'clients') {
				if ((foundClient && foundClient.os_type == secondaryFilter) || secondaryFilter === 'All' || secondaryFilter === '80211mix') clientOS = true;
				if ((foundClient && foundClient.band == selectedBand) || selectedBand === 'All') clientBand = true;
				if ((foundClient && foundClient.channel && foundClient.channel.split(' (')[0] === selectedChannel) || selectedChannel === 'All') clientChannel = true;
				if (clientOS && clientBand && clientChannel) showClient = true;
				else showClient = false;
			}

			if (showClient) {
				var label1 = thisClient;
				var label2 = null;

				x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
				y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
				vrfClientLocations.push({ x: x, y: y, mac: thisClient });
				if (this.associated) ctx.fillStyle = '#87CB16';
				else ctx.fillStyle = '#c2c2c2';

				if (secondaryFilter === '80211mix') ctx.fillStyle = '#c2c2c2';

				if (foundClient) {
					// its a client we have data for in monitoring
					label1 = foundClient['name'];
					if (foundClient['health'] <= 30) ctx.fillStyle = '#FB404B';
					else if (foundClient['health'] <= 70) ctx.fillStyle = '#FFA534';
					else if (foundClient['health'] <= 100) ctx.fillStyle = '#87CB16';

					if (secondaryFilter === '80211mix') {
						if (foundClient.connection.includes('802.11ax')) ctx.fillStyle = '#23CCEF';
						else if (foundClient.connection.includes('802.11ac')) ctx.fillStyle = '#FB404B';
						else if (foundClient.connection.includes('802.11gn')) ctx.fillStyle = '#FFA534';
						else if (foundClient.connection.includes('802.11an')) ctx.fillStyle = '#9368E9';
					}
				}

				if (foundClient || !this.associated) {
					// check for overlap with AP location - move it a bit to be more visible
					$.each(vrfAPLocations, function() {
						if (Math.floor(this.x) == Math.floor(x) && Math.floor(this.y) == Math.floor(y)) {
							// exact same location as the AP - pick a random spot around the AP (but nice and close)
							var xAmount = Math.floor(Math.random() * 40);
							var xSymbol = Math.random() > 0.5 ? 1 : -1;
							var xChange = xAmount * xSymbol;
							x = x + xChange;

							var yAmount = Math.floor(Math.random() * 40);
							var ySymbol = Math.random() > 0.5 ? 1 : -1;
							var yChange = yAmount * ySymbol;
							y = y + yChange;
						}
					});

					// Draw client
					ctx.beginPath();
					ctx.shadowColor = 'white';
					ctx.shadowBlur = 14;
					ctx.arc(x, y, 7, 0, 2 * Math.PI, false);
					ctx.fill();
					ctx.drawImage(clientImage, x - 8, y - 8, 16, 16);

					if (document.getElementById('clientLabelCheckbox').checked) {
						// Create Labels
						if (label2) {
							label1_size = ctx.measureText(label1);
							label2_size = ctx.measureText(label2);
							var boxSize = label1_size;
							if (label2_size.width > label1_size.width) boxSize = label2_size;
							ctx.strokeStyle = 'black';
							ctx.shadowColor = 'black';
							ctx.shadowBlur = 2;
							ctx.fillStyle = 'white';
							ctx.fillRect(x - boxSize.width / 2 - 4, y + 12, boxSize.width + 6, 24);
							ctx.shadowBlur = 0;
							ctx.fillStyle = 'black';
							ctx.fillText(label1, x - label1_size.width / 2, y + 22);
							ctx.fillText(label2, x - label2_size.width / 2, y + 32);
						} else if (label1) {
							label1_size = ctx.measureText(label1);
							ctx.strokeStyle = 'black';
							ctx.shadowColor = 'black';
							ctx.shadowBlur = 2;
							ctx.fillStyle = 'white';
							ctx.fillRect(x - label1_size.width / 2 - 4, y + 12, label1_size.width + 6, 14);
							ctx.shadowBlur = 0;
							ctx.fillStyle = 'black';
							ctx.fillText(label1, x - label1_size.width / 2, y + 22);
						}
					}
				}
			}
		}
	});
}

function drawApLinks(fromAP) {
	var band = document.getElementById('bandselector').value;
	if (band == 2) band = 2.4;
	storedAP = findDeviceInMonitoring(fromAP['serial']);
	var allClients = getWirelessClients();

	$.each(vrfClients, function() {
		var currentClient = this;
		var storedClient = null;
		$.each(allClients, function() {
			if (this['macaddr'] === currentClient.device_mac) storedClient = this;
		});
		if (storedClient && storedClient.band == band) {
			if (storedClient['associated_device'] === fromAP['serial']) {
				drawClientRSSI(fromAP, currentClient, storedClient['signal_db'], false);
			}
		}
	});
}

function drawClientLink(currentClient) {
	var band = document.getElementById('bandselector').value;
	if (band == 2) band = 2.4;
	var allClients = getWirelessClients();

	var storedClient = null;
	$.each(allClients, function() {
		if (this['macaddr'] === currentClient.mac) storedClient = this;
	});
	var foundAP = null;
	$.each(vrfAPLocations, function() {
		if (storedClient && this['serial'] === storedClient['associated_device']) {
			drawClientRSSI(this, currentClient, storedClient['signal_db'] ? storedClient['signal_db'] : 0, true);
		}
	});
}

function drawClientRSSI(fromAP, toClient, rssi, fromClient) {
	var linkCanvas = document.getElementById('ap-linkCanvas');
	var ctx = linkCanvas.getContext('2d');

	// Figure out position of APs
	x1 = fromAP.x;
	y1 = fromAP.y;
	if (fromClient) {
		x2 = toClient.x;
		y2 = toClient.y;
	} else {
		x2 = (toClient.x / currentFloor['floor_width']) * (linkCanvas.width / ratio);
		y2 = (toClient.y / currentFloor['floor_length']) * (linkCanvas.height / ratio);
	}

	// Figure out center for text
	x_center = (x1 + x2) / 2;
	y_center = (y1 + y2) / 2;

	// choose pathloss colour
	var strokeColour = 'black';
	if (rssi > -65) strokeColour = '#87CB16';
	else if (rssi > -72) strokeColour = '#FFA534';
	else if (rssi < -80) strokeColour = '#FB404B';

	if (rssi == 0) strokeColour = 'black';

	// Draw Line
	ctx.strokeStyle = strokeColour;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	if (rssi != 0) {
		var label = rssi + ' dBm';
		var label_size = ctx.measureText(label);
		ctx.strokeStyle = 'black';
		ctx.shadowColor = 'black';
		ctx.shadowBlur = 2;
		ctx.fillStyle = 'white';
		ctx.fillRect(x_center - label_size.width / 2 - 3, y_center - 4, label_size.width + 6, 14);

		ctx.shadowBlur = 0;
		ctx.fillStyle = 'black';
		ctx.fillText(label, x_center - label_size.width / 2, y_center + 6);
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Canvas Clearing functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function clearLinkCanvas() {
	var linkCanvas = document.getElementById('ap-linkCanvas');
	var pathlossCtx = linkCanvas.getContext('2d');
	pathlossCtx.clearRect(0, 0, linkCanvas.width, linkCanvas.height);
}

function clearAPCanvas() {
	var apCanvas = document.getElementById('ap-apCanvas');
	var apCtx = apCanvas.getContext('2d');
	apCtx.clearRect(0, 0, apCanvas.width, apCanvas.height);
}

function clearInfoCanvas() {
	var infoCanvas = document.getElementById('ap-infoCanvas');
	var infoCtx = infoCanvas.getContext('2d');
	infoCtx.clearRect(0, 0, infoCanvas.width, infoCanvas.height);
}

function clearFloorplanCanvas() {
	var floorplanCanvas = document.getElementById('ap-floorplanCanvas');
	var floorplanCtx = floorplanCanvas.getContext('2d');
	floorplanCtx.clearRect(0, 0, floorplanCanvas.width, floorplanCanvas.height);
}

function resetCanvases() {
	clearLinkCanvas();
	clearAPCanvas();
	clearInfoCanvas();
	clearFloorplanCanvas();
	var rfVisualPlanHeight = 0;
	document.getElementById('ap-visualPlan').setAttribute('style', 'height:' + rfVisualPlanHeight + 'px');
	document.getElementById('ap-visualPlan').style.height = rfVisualPlanHeight + 'px';
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	VRF UI functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function changeFloorplanData() {
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();

	updateBandSelector();
	updateChannelSelector();
	changeFooter();
	if (document.getElementById('visualizationselector').value === 'channels') {
		document.getElementById('secondaryFilter').style.display = 'none';
		drawAPsOnFloorplan();
	} else if (document.getElementById('visualizationselector').value === 'health') {
		document.getElementById('secondaryFilter').style.display = 'none';
		drawAPsOnFloorplan();
	} else if (document.getElementById('visualizationselector').value === 'clients') {
		document.getElementById('secondaryFilter').style.display = 'block';

		// populate the secondary Filter
		select = document.getElementById('secondaryselector');
		select.options.length = 0;
		$('#secondaryselector').append($('<option>', { value: 'All', text: 'All' }));
		$('#secondaryselector').append($('<option>', { value: '', text: '─────────────────', style: 'color: #cccccc;', disabled: true }));
		$('#secondaryselector').append($('<option>', { value: '80211mix', text: 'Wi-Fi Standard' }));
		$('#secondaryselector').append($('<option>', { value: '', text: '─────────────────', style: 'color: #cccccc;', disabled: true }));
		$('#secondaryselector').append($('<option>', { value: '', text: 'Client OS', style: 'color: #999999;', disabled: true }));
		$.each(osType, function() {
			$('#secondaryselector').append($('<option>', { value: this, text: this }));
		});
		$('#secondaryselector').selectpicker('refresh');
		$('#secondaryselector').selectpicker('val', 'All');
		drawAPsOnFloorplan();
		loadClientsForFloor(0);
	}
}

function changeSecondaryFilter() {
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();
	drawAPsOnFloorplan();
	if (document.getElementById('visualizationselector').value.includes('client')) {
		document.getElementById('secondaryFilter').style.display = 'block';
		changeFooter();
		updateBandSelector();
		loadClientsForFloor(0);
	} else {
		document.getElementById('secondaryFilter').style.display = 'none';
	}
}

function changeFooter() {
	if (document.getElementById('visualizationselector').value === 'channels') {
		$('#floorplanFooter').empty();
	} else if (document.getElementById('visualizationselector').value === 'health') {
		$('#floorplanFooter').empty();
		$('#floorplanFooter').append('<i class="fa-solid fa-circle text-danger"></i> Down\t');
		$('#floorplanFooter').append('<i class="fa-solid fa-circle text-warning"></i> Poor\t');
		$('#floorplanFooter').append('<i class="fa-solid fa-circle text-success"></i> Good ');
	} else if (document.getElementById('visualizationselector').value === 'clients') {
		if (document.getElementById('secondaryselector').value === '80211mix') {
			$('#floorplanFooter').empty();
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-info"></i> 11ax\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-danger"></i> 11ac\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-warning"></i> 11gn\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-purple"></i> 11an\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-muted"></i> Unknown\t');
		} else {
			$('#floorplanFooter').empty();
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-danger"></i> Poor\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-warning"></i> Fair\t');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-success"></i> Good ');
			$('#floorplanFooter').append('<i class="fa-solid fa-circle text-muted"></i> Unassociated Client');
		}
	}
}

function changeBand() {
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();
	currentAP = null;
	updateChannelSelector();
	drawAPsOnFloorplan();
	if (document.getElementById('visualizationselector').value.includes('client')) {
		loadClientsForFloor(0);
	}
}

function changeChannel() {
	clearAPCanvas();
	clearLinkCanvas();
	clearInfoCanvas();

	currentAP = null;
	drawAPsOnFloorplan();
	if (document.getElementById('visualizationselector').value.includes('client')) {
		loadClientsForFloor(0);
	}
}

function updateBandSelector() {
	var visualization = document.getElementById('visualizationselector').value;
	select = document.getElementById('bandselector');
	select.options.length = 0;
	$('#bandselector').append($('<option>', { value: 'All', text: 'All' }));
	if (visualization === 'clients') {
		$('#bandselector').append($('<option>', { value: '2', text: '2.4GHz' }));
		$('#bandselector').append($('<option>', { value: '5', text: '5GHz' }));
		$('#bandselector').append($('<option>', { value: '6', text: '6GHz' }));
		$('#bandselector').selectpicker('refresh');
		$('#bandselector').selectpicker('val', 'All');
	} else if (visualization === 'health') {
		$('#bandselector').selectpicker('refresh');
		$('#bandselector').selectpicker('val', 'All');
	} else {
		$('#bandselector').append($('<option>', { value: '2', text: '2.4GHz' }));
		$('#bandselector').append($('<option>', { value: '5', text: '5GHz' }));
		$('#bandselector').append($('<option>', { value: '6', text: '6GHz' }));
		$('#bandselector').selectpicker('refresh');
		$('#bandselector').selectpicker('val', 'All');
	}
}

function updateChannelSelector() {
	var band = document.getElementById('bandselector').value;
	select = document.getElementById('channelselector');
	select.options.length = 0;
	$('#channelselector').append($('<option>', { value: 'All', text: 'All' }));
	var channels = vrfChannels[band];
	$.each(channels, function() {
		if (this !== '') $('#channelselector').append($('<option>', { value: this, text: this }));
	});
	$('#channelselector').selectpicker('refresh');
	$('#channelselector').selectpicker('val', 'All');
}

function loadBuildingSelector() {
	// remove old data from the selector
	select = document.getElementById('buildingselector');
	select.options.length = 0;

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
		$('#buildingselector').append($('<option>', { value: this['building_id'], text: this['building_name'] }));
		if ($('#buildingselector').length != 0) {
			$('#buildingselector').selectpicker('refresh');
		}
	});
}

function loadFloorSelector() {
	// remove old data from the selector
	var select = document.getElementById('floorselector');
	select.options.length = 0;

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
		// Add group to the dropdown selector
		$('#floorselector').append($('<option>', { value: this['floor_id'], text: this['floor_name'] }));
		if ($('#floorselector').length != 0) {
			$('#floorselector').selectpicker('refresh');
		}
	});
}

function updateSizes(width, height) {
	var canvas = document.getElementById('ap-floorplanCanvas');
	canvas.width = width * ratio;
	canvas.height = height * ratio;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	canvas.getContext('2d').scale(ratio, ratio);

	var linkCanvas = document.getElementById('ap-linkCanvas');
	linkCanvas.width = width * ratio;
	linkCanvas.height = height * ratio;
	linkCanvas.style.width = width + 'px';
	linkCanvas.style.height = height + 'px';
	linkCanvas.getContext('2d').scale(ratio, ratio);

	var apCanvas = document.getElementById('ap-apCanvas');
	apCanvas.width = width * ratio;
	apCanvas.height = height * ratio;
	apCanvas.style.width = width + 'px';
	apCanvas.style.height = height + 'px';
	apCanvas.getContext('2d').scale(ratio, ratio);

	var infoCanvas = document.getElementById('ap-infoCanvas');
	infoCanvas.width = width * ratio;
	infoCanvas.height = height * ratio;
	infoCanvas.style.width = width + 'px';
	infoCanvas.style.height = height + 'px';
	infoCanvas.getContext('2d').scale(ratio, ratio);

	var rfVisualPlanHeight = height + 20;
	document.getElementById('ap-visualPlan').setAttribute('style', 'height:' + rfVisualPlanHeight + 'px');
	document.getElementById('ap-visualPlan').style.height = rfVisualPlanHeight + 'px';
}
