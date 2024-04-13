/*
Central Automation v1.30
Updated:
Aaron Scott (WiFi Downunder) 2021-2023
*/


var allClients;
var osType = [];

var vrfBuildings = [];
var vrfFloors = [];
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
var selectedClient;
var storedAP;
var found;

var clientNotification = null;
var visualRFNotification;

var apImage;
var clientImage;

var needAllLabels;
var needClientLabel;
var associatedAP;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Callback functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';

	clientImage = new Image();
	clientImage.src = 'assets/img/client-icon.svg';

	needAllLabels = true;
}

/* ----------------------------
	Override Functions
-----------------------------*/
function loadClientsUI(client) {
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

	// Make link to Central
	client_name_url = encodeURI(client_name);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + client['macaddr'] + '?ccma=' + client['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';
	
	var locateBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Locate on Floorplan" onclick="locateClient(\'' + client_mac + '\')"><i class="fa-solid fa-location-dot"></i></a> ';
			
	// Add row to table
	var table = $('#client-table').DataTable();
	table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan, locateBtn]);
	
	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Client', client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, ip_address, client_mac, site, '', os_type, vlan, '', '', '']);

	$('[data-toggle="tooltip"]').tooltip();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	VisualAP functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function locateClient(clientMac) {
	vrfClients = [];
	selectedClient = findDeviceInMonitoringForMAC(clientMac);
	$('#clientInfoList').empty();
	$('#clientInfoList').append('<li>Name: <strong>' + selectedClient['name'] + '</strong></li>');
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	if (!selectedClient['health'] && selectedClient['failure_stage'] !== '' && selectedClient['failure_stage'] !== 'NA') {
		status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + selectedClient['failure_reason'] + ' at ' + selectedClient['failure_stage'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (!selectedClient['health']) {
		status = '<i class="fa-solid fa-circle text-neutral"></i>';
	} else if (selectedClient['health'] < 50) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + selectedClient['health'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (selectedClient['health'] < 70) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + selectedClient['health'] + '"><i class="fa-solid fa-circle text-warning"></i></span>';
	} else {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + selectedClient['health'] + '"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	
	$('#clientInfoList').append('<li>Health: '+status+'</li>');
	$('#clientInfoList').append('<li>Device: <strong>' + selectedClient['os_type'] + '</strong></li>');
	$('#clientInfoList').append('<li>MAC Address: <strong>' + selectedClient['radio_mac'] + '</strong></li>');
	$('#clientInfoList').append('<li>IP Address: <strong>' + selectedClient['ip_address'] + '</strong></li>');
	$('#clientInfoList').append('<li>VLAN: <strong>' + selectedClient['vlan'] + '</strong></li>');
	$('#clientInfoList').append('<li>User Role: <strong>' + selectedClient['user_role'] + '</strong></li>');
	if (selectedClient['associated_device_name']) $('#clientInfoList').append('<li>Associated To: <strong>' + selectedClient['associated_device_name'] + '</strong></li>');
	$('#ClientModal').modal('hide');
	$('[data-toggle="tooltip"]').tooltip();
	
	clientNotification = showNotification('ca-map-pin', 'Getting Client Location...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/client_location/' + clientMac,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/client_location/<client-mac>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		vrfClients.push(response.location);
		if (response['location']['floor_id'] != vrfFloorId) getFloor(response['location']['floor_id']);
		else drawFloorplan();
	
		if (clientNotification) {
			clientNotification.update({ message: 'Located Client', type: 'success' });
			setTimeout(clientNotification.close, 1000);
		}

	});
	
	var roamingSettings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/clients/wireless/' + clientMac + '/mobility_trail',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(roamingSettings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/clients/wireless/<client-mac>/mobility_trail)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		console.log(response);
		var trail = response.trails;
		trail = trail.slice(0,10);
		$('#roamingList').empty();
		$.each(trail, function() {
			eventTime = new Date(this['ts']);
			if (this['previous_ap_name']) $('#roamingList').append('<li><i>'+eventTime.toLocaleString()+'</i> - To: <strong>' + this['ap_name'] + '</strong>, From: <strong>' + this['previous_ap_name'] + '</strong> on <strong>'+ this['network'] + '</strong></li>');
			else $('#roamingList').append('<li><i>'+eventTime.toLocaleString()+'</i> - To: <strong>' + this['ap_name'] + '</strong> on <strong>'+ this['network'] + '</strong></li>');
		});
	});
	
}

function getFloor(floorId) {
	resetCanvases();
	vrfFloors = [];

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + floorId + '?limit=' + apiVRFLimit + '&units=' + vrfUnits,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/visualrf_api/v1/floor/<floor_id>)');
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
						getFloor(floorId);
					}
				});
			}
		} else if (response) {
			failedAuth = false;
			vrfFloors.push(response['floor']);
			currentFloor = response['floor'];
			if ($('#wirelessInfo')) $('#wirelessInfo').append('<li>Floor: <strong>' + currentFloor['floor_name'] + '</strong></li>');
			getFloorData(floorId);
		}
	});
}

function getFloorData(floorId) {
	vrfFloorId = floorId;

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
			if (visualRFNotification) {
				visualRFNotification.update({ message: 'Retrieved Floorplan', type: 'success' });
				setTimeout(visualRFNotification.close, 1000);
			}
			drawFloorplan();
		}
	});
}

function drawFloorplan() {
	// Draw floorplan
	resetCanvases();
	drawFloorplanImage(false);
	loadAPsForFloor(0);
	drawClientsOnFloorplan();
	
	
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
			url: localStorage.getItem('base_url') + '/visualrf_api/v1/floor/' + vrfFloorId + '/access_point_location?offset=' + offset + '&limit=' + apiVRFLimit + '&units=' + vrfUnits,
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
		//currentFloor = response['floor'];
		vrfAPs = vrfAPs.concat(response['access_points']);
		//console.log(vrfAPs);
		offset += apiVRFLimit;
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
		

		x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
		y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
		vrfAPLocations.push({ x: x, y: y, serial: this['serial_number'] });

		// default AP colour
		ctx.fillStyle = '#447DF7';
		if (associatedAP === this['serial_number']) ctx.fillStyle = '#FB404B';

		ctx.beginPath();
		ctx.shadowColor = 'white';
		ctx.shadowBlur = 14;
		ctx.roundRect(x - 8, y - 8, 16, 16, 1);
		ctx.fill();
		ctx.drawImage(apImage, x - 10, y - 10, 20, 20);

		// Create Labels
		if (needAllLabels) {
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



function drawClientsOnFloorplan() {
	clearLinkCanvas();
	clearInfoCanvas();

	vrfClientLocations = [];
	// Draw Clients on floorplan
	var floorplanCanvas = document.getElementById('ap-floorplanCanvas');
	var canvas = document.getElementById('ap-infoCanvas');
	var ctx = canvas.getContext('2d');
	
	$.each(vrfClients, function() {
		var thisClient = this.device_mac;
		var foundClient = selectedClient;
		var showClient = true;

		if (showClient) {
			var label1 = foundClient.name;
			var label2 = foundClient.os_type;

			x = (this['x'] / currentFloor['floor_width']) * (canvas.width / ratio);
			y = (this['y'] / currentFloor['floor_length']) * (canvas.height / ratio);
			vrfClientLocations.push({ x: x, y: y, mac: thisClient });
			if (this.associated) ctx.fillStyle = '#87CB16';
			else ctx.fillStyle = '#c2c2c2';

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

					// Create Labels
				if (needClientLabel) {
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
	});
}

function drawApLinks(fromAP) {
	storedAP = findDeviceInMonitoring(fromAP['serial']);
	var allClients = getWirelessClients();

	$.each(vrfClients, function() {
		var currentClient = this;
		var storedClient = null;
		$.each(allClients, function() {
			if (this['macaddr'] === currentClient.device_mac) storedClient = this;
		});
		if (storedClient['associated_device'] === fromAP['serial']) {
			drawClientRSSI(fromAP, currentClient, storedClient['signal_db'], false);
		}
		
	});
}

function drawClientLink(currentClient) {
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

	drawAPsOnFloorplan();
	drawClientsOnFloorplan();
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
