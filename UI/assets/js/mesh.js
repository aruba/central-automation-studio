/*
Central Automation v1.30
Updated: 
Aaron Scott (WiFi Downunder) 2021-2024
*/

var portals = [];
var errorCounter = 0;
var meshTopologyData = {};
var currentPortal = '';

var apLocations = [];
var currentAP = null;
var requiredHeight = [[], [], []];

var overallNotification;
var meshNotifications = {};

var allWiredClients = [];
var allWirelessClients = [];

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Override functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	getPortalAPs();

	// Support focus mode (clicking on an AP)
	var apCanvas = document.getElementById('mesh-infoCanvas');
	apCanvas.onmouseup = function(e) {
		// important: correct mouse position:
		var rect = this.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		var i = 0;
		var r;

		found = false;
		$.each(apLocations, function() {
			ap_x = this['x'];
			ap_y = this['y'];
			if (Math.abs(ap_x - x) <= 32 && Math.abs(ap_y - y) <= 32) {
				if (currentAP !== this) {
					found = true;
					currentAP = this;
					var currentSerial = currentAP['serial'];
				}
			}
		});
		if (!found) {
			currentAP = null;
		}
		drawMeshTopology();
	};
}

function loadCurrentPageClient() {
	allWiredClients = getWiredClients();
	allWirelessClients = getWirelessClients();
}

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

function findAPForBSSID(bssidMac) {
	var radioMac = bssidMac.slice(0, -1) + '0';
	return findAPForRadio(radioMac);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Get Portals in the network
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getPortalAPs() {
	var table = $('#portal-table').DataTable();
	$('#portal-table')
		.DataTable()
		.rows()
		.remove();

	accessPoints = getAPs();
	portals = [];
	$.each(accessPoints, function() {
		if (this['status'] === 'Up' && this['mesh_role'] == 'Portal') {
			var ap = this;
			portals.push(this['serial']);

			var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';

			var ip_address = ap['ip_address'];
			if (!ip_address) ip_address = '';

			var uptime = ap['uptime'] ? ap['uptime'] : 0;
			var duration = moment.duration(uptime * 1000);

			// Make AP Name as a link to Central
			var name = encodeURI(ap['name']);
			var apiURL = localStorage.getItem('base_url');
			var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';

			var tshootBtns = '<button class="btn btn-round btn-sm btn-outline btn-warning" onclick="getMeshTopology(\'' + ap.serial + '\')">Topology</button> ';
			// Add row to table
			table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['macaddr'], ap['site'], ap['group_name'], duration.humanize(), tshootBtns]);

			$('[data-toggle="tooltip"]').tooltip();
		}
	});
	$('#portal-table')
		.DataTable()
		.rows()
		.draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Troubleshooting Functions (running 'show ap mesh link' - command 87 in 2.5.6)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function reloadMeshTopology() {
	getMeshTopology(currentPortal);
}

function getMeshTopology(deviceSerial) {
	overallNotification = showLongNotification('ca-mesh', 'Gathering mesh topology information...', 'bottom', 'center', 'primary');
	var selectedAP = findDeviceInMonitoring(deviceSerial);
	document.getElementById('mesh-title').innerHTML = 'Mesh Topology: <strong>' + selectedAP.name + '</strong>';
	meshTopologyData = {};
	requiredHeight = [[], [], []];
	currentPortal = deviceSerial;
	getMeshLinks(deviceSerial);
}

function getMeshLinks(deviceSerial) {
	var selectedAP = findDeviceInMonitoring(deviceSerial);
	var printedMessage = 'Obtaining Mesh topology information for '+selectedAP.name + '...';
	meshNotifications[deviceSerial] = showPermanentNotification('ca-ap-icon', printedMessage, 'bottom', 'center', 'info');
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
			data: JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 87 }] }),
		}),
	};

	$.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/troubleshooting/v1/devices/<SERIAL>)');
				return;
			}
		}
		
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getMeshLinks(deviceSerial);
					}
				});
			}
		} else if (response.status === 'QUEUED') {
			failedAuth = false;
			setTimeout(checkMeshLinkResult, 5000, response.session_id, response.serial);
		} else {
			failedAuth = false;
			if (response.description) {
				showNotification('ca-window-code', response.description, 'bottom', 'center', 'danger');
			}
		}
	});
}

function checkMeshLinkResult(session_id, deviceSerial) {
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
			var currentNotification = meshNotifications[response.serial];
			var selectedAP = findDeviceInMonitoring(response.serial);
			
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				currentNotification.update({ type: 'info', message: "response.message.replace(' Please try after sometime', '.')" });
				setTimeout(checkMeshLinkResult, 10000, session_id, response.serial);
			} else if (response.status === 'COMPLETED') {
				var results = decodeURI(response.output);
				if (results.includes('No response was received')) {
					currentNotification.update({ type: 'danger', message: 'Central did not recieve a response from the AP ('+response.serial+')' });
				} else {
					currentNotification.update({ type: 'success', message: 'Obtained Mesh topology information for '+selectedAP.name });
					processMeshLinks(results, response.serial);
					setTimeout(currentNotification.close, 1000);
					delete meshNotifications[response.serial];
				}
			} else {
				if (response.description) {
					currentNotification({ type: 'danger', message: response.description});
					setTimeout(currentNotification.close, 1000);
					delete meshNotifications[response.serial];
				}
			}
			
			if (Object.keys(meshNotifications).length == 0) overallNotification.close();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Processing Troubleshooting Output (show ap mesh link)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function processMeshLinks(meshLinkString, serial) {
	var lines = meshLinkString.split('\n');
	// Find the header row...
	var headerIndex = -1;
	for (var i = 0; i < lines.length; i++) {
		if (lines[i] === 'Neighbor list') {
			headerIndex = i + 2;
			break;
		}
	}

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
	for (var i = headerIndex + 2; i < lines.length; i++) {
		if (lines[i].trim() === '') break;
		else {
			// Pull apart each link
			var neighbour = lines[i];
			var neighbourMAC = neighbour.substring(columnHeaders['MAC'].start, columnHeaders['MAC'].end).trim();
			var neighbourName = neighbour.substring(columnHeaders['AP Name'].start, columnHeaders['AP Name'].end).trim();
			var neighbourBand = neighbour.substring(columnHeaders['Band'].start, columnHeaders['Band'].end).trim();
			var neighbourChannel = neighbour.substring(columnHeaders['Channel'].start, columnHeaders['Channel'].end).trim();
			var neighbourRSSI = neighbour.substring(columnHeaders['RSSI'].start, columnHeaders['RSSI'].end).trim();
			var neighbourType = 'Child';
			if (neighbour.substring(columnHeaders['Relation'].start, columnHeaders['Relation'].end).includes('P')) neighbourType = 'Parent';
			var neighbourUptime = neighbour.substring(columnHeaders['Relation'].start, columnHeaders['Relation'].end).trim();
			neighbourUptime = neighbourUptime.slice(neighbourUptime.indexOf(' ') + 1);
			var neighbourFlags = neighbour.substring(columnHeaders['Flags'].start, columnHeaders['Flags'].end).trim();
			var neighbourRate = neighbour.substring(columnHeaders['Rate Tx/Rx'].start, columnHeaders['Rate Tx/Rx'].end).trim();
			var neighbourAFail = neighbour.substring(columnHeaders['A-Fail'].start, columnHeaders['A-Fail'].end).trim();
			var neighbourAP = findAPForBSSID(neighbourMAC);

			// Build the data to be able to used
			var meshLink = { serial: neighbourAP.serial, mac: neighbourMAC, name: neighbourName, band: neighbourBand, channel: neighbourChannel, type: neighbourType, rate: neighbourRate, flags: neighbourFlags, rssi: neighbourRSSI, uptime: neighbourUptime, afail: neighbourAFail };
			// Save the link for the serial
			var device = meshTopologyData[serial];
			if (!device) device = {};
			if (neighbourType == 'Child') {
				if (!device['children']) device['children'] = [];
				var currentChildren = device['children'];
				currentChildren.push(meshLink);
				device['children'] = currentChildren;
			} else {
				if (!device['parent']) device['parent'] = [];
				var currentParent = device['parent'];
				currentParent.push(meshLink);
				device['parent'] = currentParent;
			}
			meshTopologyData[serial] = device;

			// if this was a child link - go get the mesh link data for that child AP
			if (neighbourType == 'Child') getMeshLinks(meshLink.serial);
		}
	}

	// draw tree
	drawMeshTopology();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Draw the topology
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function drawMeshTopology() {
	if (document.getElementById('visualizationselector').value === 'flags') document.getElementById('flagDiv').hidden = false;
	else document.getElementById('flagDiv').hidden = true;

	if (currentPortal) {
		apLocations = [];
		var portalAP = findDeviceInMonitoring(currentPortal);
		requiredHeight[0] = [currentPortal];

		var canvas = document.getElementById('mesh-floorplanCanvas');
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		var linkCanvas = document.getElementById('mesh-linkCanvas');
		var linkCtx = linkCanvas.getContext('2d');
		linkCtx.clearRect(0, 0, linkCanvas.width, linkCanvas.height);

		var apCanvas = document.getElementById('mesh-apCanvas');
		var apCtx = apCanvas.getContext('2d');
		apCtx.clearRect(0, 0, apCanvas.width, apCanvas.height);

		clearInfoCanvas();

		var superView = document.getElementById('mesh-visualPlan');
		canvas.width = superView.offsetWidth - 40 * ratio;
		canvas.height = 140 * ratio;
		canvas.style.width = superView.offsetWidth - 40 + 'px';
		canvas.style.height = 140 + 'px';
		canvas.getContext('2d').scale(ratio, ratio);
		//canvas.width = superView.offsetWidth - 40;
		//canvas.height = 140;

		// Determine the height required for the canvas based on the number of nodes in the mesh at each hop
		let max = -Infinity;
		requiredHeight.forEach(function(a, i) {
			if (a.length > max) {
				max = a.length;
			}
		});
		updateSizes(canvas.offsetWidth, 126 * max + 40);

		var x0 = 100;
		var y0 = 80;
		var lasty = 0;

		drawAPAtLocation(apCtx, portalAP, x0, y0);
		drawPortalLink({ x: x0, y: y0 });

		// hop 1
		var x1 = apCanvas.offsetWidth / 2;
		var x2 = apCanvas.offsetWidth - 100;
		if (meshTopologyData[currentPortal]) {
			var portalChildren = meshTopologyData[currentPortal].children;
			for (var i = 0; i < portalChildren.length; i++) {
				var currentLink = portalChildren[i].serial;
				// Update the number of APs at each hop
				if (!requiredHeight[1].includes(currentLink)) requiredHeight[1].push(currentLink);

				var hop1AP = findDeviceInMonitoring(currentLink);
				var hop1Parent = [];
				if (meshTopologyData[currentLink]) hop1Parent = meshTopologyData[currentLink].parent;
				var y1 = 80 * (i + 1) + i * 46;

				drawAPAtLocation(apCtx, hop1AP, x1, y1);
				drawMeshLink(portalAP, hop1AP, { x: x0, y: y0 }, { x: x1, y: y1 }, portalChildren[i], hop1Parent[0]);

				// hop 2
				if (meshTopologyData[currentLink] && meshTopologyData[currentLink].children) {
					var hop1Children = meshTopologyData[currentLink].children;
					for (var j = 0; j < hop1Children.length; j++) {
						// Update the number of APs at each hop
						if (!requiredHeight[2].includes(hop1Children[j].serial)) requiredHeight[2].push(hop1Children[j].serial);

						var hop2AP = findDeviceInMonitoring(hop1Children[j].serial);
						var hop2Parent = [];
						if (meshTopologyData[hop1Children[j].serial]) hop2Parent = meshTopologyData[hop1Children[j].serial].parent;
						var y2 = 80 * (lasty + 1) + lasty * 46;
						drawAPAtLocation(apCtx, hop2AP, x2, 80 * (lasty + 1) + lasty * 46);
						drawMeshLink(hop1AP, hop2AP, { x: x1, y: y1 }, { x: x2, y: y2 }, hop1Children[j], hop2Parent[0]);
						lasty++;
					}
				}
			}
		}
	}
}

function drawAPAtLocation(apCtx, selectedAP, x, y) {
	apLocations.push({ x: x, y: y, serial: selectedAP.serial });
	
	var apImage = new Image();
	apImage.src = 'assets/img/ap-icon.svg';

	apCtx.beginPath();
	apCtx.fillStyle = 'white';
	if (!meshTopologyData[selectedAP.serial]) apCtx.fillStyle = '#D3D3D3';
	if (currentAP && currentAP.serial === selectedAP.serial) apCtx.fillStyle = '#23CCEF';
	apCtx.shadowColor = 'white';
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) apCtx.shadowColor = '#272727';
	apCtx.shadowBlur = 14;
	apCtx.roundRect(x - 28, y - 28, 56, 56, 6);
	apCtx.fill();
	apCtx.drawImage(apImage, x - 32, y - 32, 64, 64);

	// Put white background to the text so it's readable

	const match = /(?<value>\d+\.?\d*)/;
	apCtx.font = apCtx.font.replace(match, 12);
	ap_name_size = apCtx.measureText(selectedAP.name);

	apCtx.shadowBlur = 0;
	apCtx.fillStyle = 'black';
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) apCtx.fillStyle = '#FCFCFC';
	apCtx.fillText(selectedAP.name, x - ap_name_size.width / 2, y + 46);

	if (document.getElementById('visualizationselector').value === 'clients') {
		apCtx.fillStyle = 'gray';
		var wiredClientCount = 0;
		$.each(allWiredClients, function(){
			if (this.associated_device === selectedAP.serial) wiredClientCount++;
		});
		var wirelessClientCount = 0;
		$.each(allWirelessClients, function(){
			if (this.associated_device === selectedAP.serial) wirelessClientCount++;
		});
		var countString = 'Clients: '+wirelessClientCount+' | '+wiredClientCount;
		if (wirelessClientCount == 0 && wiredClientCount == 0) countString = 'Clients: 0';
		client_count_size = apCtx.measureText(countString);
		apCtx.fillText(countString, x - client_count_size.width / 2, y + 62);
	}
}

function drawPortalLink(toLocation) {
	var linkCanvas = document.getElementById('mesh-linkCanvas');
	var ctx = linkCanvas.getContext('2d');
	x = toLocation.x;
	y = toLocation.y;

	// Draw Portal Line
	ctx.strokeStyle = 'lightgray';
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x - 62, y);
	ctx.stroke();
}

function drawMeshLink(fromAP, toAP, fromLocation, toLocation, fromMetrics, toMetrics) {
	// Links are draw from the parent to the point
	// from = parent/portal
	// to = point
	// Call is made when the point AP is drawn
	var linkCanvas = document.getElementById('mesh-linkCanvas');
	var ctx = linkCanvas.getContext('2d');

	// Figure out position of APs
	x1 = fromLocation.x;
	y1 = fromLocation.y;
	x2 = toLocation.x;
	y2 = toLocation.y;

	// Figure out center for text
	x_center = (x1 + x2) / 2;
	y_center = (y1 + y2) / 2;

	// choose link colour
	var strokeColour = 'black';
	if (document.getElementById('visualizationselector').value === 'snr') {
		if (toMetrics) {
			if (parseInt(toMetrics.rssi) >= 25) strokeColour = '#87CB16';
			else if (parseInt(toMetrics.rssi) >= 15) strokeColour = '#FFA534';
			else strokeColour = '#FB404B';
		} else {
			if (parseInt(fromMetrics.rssi) >= 25) strokeColour = '#87CB16';
			else if (parseInt(fromMetrics.rssi) >= 15) strokeColour = '#FFA534';
			else strokeColour = '#FB404B';
		}

		$('#meshFooter').empty();
		$('#meshFooter').append('<i class="fa-solid fa-circle text-danger"></i> < 15dB\t');
		$('#meshFooter').append('<i class="fa-solid fa-circle text-warning"></i> < 25dB\t');
		$('#meshFooter').append('<i class="fa-solid fa-circle text-success"></i> >= 25dB ');
	} else {
		if (fromMetrics.band === '2.4GHz') strokeColour = '#FB404B';
		else if (fromMetrics.band === '5GHz') strokeColour = '#FFA534';
		else if (fromMetrics.band === '6GHz') strokeColour = '#87CB16';
		$('#meshFooter').empty();
		$('#meshFooter').append('<i class="fa-solid fa-circle text-danger"></i> 2.4GHz\t');
		$('#meshFooter').append('<i class="fa-solid fa-circle text-warning"></i> 5GHz\t');
		$('#meshFooter').append('<i class="fa-solid fa-circle text-success"></i> 6GHz ');
	}

	// Draw Line
	ctx.strokeStyle = strokeColour;
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	var infoCanvas = document.getElementById('mesh-infoCanvas');
	var infoCtx = infoCanvas.getContext('2d');

	// Create Labels
	const match = /(?<value>\d+\.?\d*)/;
	infoCtx.font = infoCtx.font.replace(match, 12);

	// Draw label for Parent AP
	// Only show labels is related to the selected "currentAP" or if no AP is selected
	if ((currentAP && (currentAP.serial === fromMetrics.serial || currentAP.serial === toAP.serial || (toMetrics && currentAP.serial === toMetrics.serial))) || !currentAP) {
		var fromData = '';
		var fromData2 = '';
		if (document.getElementById('visualizationselector').value === 'rate') fromData = 'Tx/Rx: ' + fromMetrics.rate;
		else if (document.getElementById('visualizationselector').value === 'snr') fromData = 'SNR: ' + fromMetrics.rssi;
		else if (document.getElementById('visualizationselector').value === 'flags') fromData = 'Flags: ' + fromMetrics.flags;
		else if (document.getElementById('visualizationselector').value === 'channel') {
			fromData = 'Channel: ' + fromMetrics.channel;
			var radioUtil = '';
			$.each(fromAP.radios, function() {
				var radioName = this.radio_name;
				radioName = radioName.replace(' GHz', 'GHz')
				if (radioName.includes(fromMetrics.band)) radioUtil = this.utilization;
			});
			fromData2 = 'Utilization: ' + radioUtil + '%';
		} else if (document.getElementById('visualizationselector').value === 'stability') {
			fromData = 'Uptime: ' + fromMetrics.uptime;
			fromData2 = 'Association Fails: ' + fromMetrics.afail;
		}

		if (fromData2 !== '') {
			fromData_size = infoCtx.measureText(fromData);
			fromData2_size = infoCtx.measureText(fromData2);
			var boxSize = fromData_size;
			if (fromData2_size.width > fromData_size.width) boxSize = fromData2_size;
			infoCtx.strokeStyle = 'black';
			infoCtx.shadowColor = 'black';
			infoCtx.shadowBlur = 2;
			infoCtx.fillStyle = 'white';
			infoCtx.fillRect(fromLocation.x + 34, fromLocation.y + 6, boxSize.width + 10, 40);
			infoCtx.shadowBlur = 0;
			infoCtx.fillStyle = 'black';
			infoCtx.fillText(fromData, fromLocation.x + 40, fromLocation.y + 20);
			infoCtx.fillText(fromData2, fromLocation.x + 40, fromLocation.y + 40);
		} else if (fromData !== '') {
			fromData_size = infoCtx.measureText(fromData);
			infoCtx.strokeStyle = 'black';
			infoCtx.shadowColor = 'black';
			infoCtx.shadowBlur = 2;
			infoCtx.fillStyle = 'white';
			infoCtx.fillRect(fromLocation.x + 36, fromLocation.y + 6, fromData_size.width + 10, 18);
			infoCtx.shadowBlur = 0;
			infoCtx.fillStyle = 'black';
			infoCtx.fillText(fromData, fromLocation.x + 40, fromLocation.y + 20);
		}
	}

	// Draw label for Point AP
	if (toMetrics) {
		if ((currentAP && (currentAP.serial === fromMetrics.serial || currentAP.serial === toAP.serial || currentAP.serial === toMetrics.serial)) || !currentAP) {
			var toData = '';
			var toData2 = '';
			if (document.getElementById('visualizationselector').value === 'rate') toData = 'Tx/Rx: ' + toMetrics.rate;
			else if (document.getElementById('visualizationselector').value === 'snr') toData = 'SNR: ' + toMetrics.rssi;
			else if (document.getElementById('visualizationselector').value === 'flags') toData = 'Flags: ' + toMetrics.flags;
			else if (document.getElementById('visualizationselector').value === 'channel') {
				toData = 'Channel: ' + toMetrics.channel;
				var radioUtil = '';
				$.each(toAP.radios, function() {
					var radioName = this.radio_name;
					radioName = radioName.replace(' GHz', 'GHz')
					if (radioName.includes(toMetrics.band)) radioUtil = this.utilization;
				});
				toData2 = 'Utilization: ' + radioUtil + '%';
			} else if (document.getElementById('visualizationselector').value === 'stability') {
				toData = 'Uptime: ' + toMetrics.uptime;
				toData2 = 'Association Fails: ' + toMetrics.afail;
			}

			if (toData2 !== '') {
				toData_size = infoCtx.measureText(toData);
				toData2_size = infoCtx.measureText(toData2);
				var boxSize = toData_size;
				if (toData2_size.width > toData_size.width) boxSize = toData2_size;
				infoCtx.strokeStyle = 'black';
				infoCtx.shadowColor = 'black';
				infoCtx.shadowBlur = 2;
				infoCtx.fillStyle = 'white';
				infoCtx.fillRect(toLocation.x - 46 - boxSize.width, toLocation.y + 6, boxSize.width + 10, 40);
				infoCtx.shadowBlur = 0;
				infoCtx.fillStyle = 'black';
				infoCtx.fillText(toData, toLocation.x - 40 - toData_size.width, toLocation.y + 20);
				infoCtx.fillText(toData2, toLocation.x - 40 - toData2_size.width, toLocation.y + 40);
			} else if (toData !== '') {
				toData_size = infoCtx.measureText(toData);
				infoCtx.strokeStyle = 'black';
				infoCtx.shadowColor = 'black';
				infoCtx.shadowBlur = 2;
				infoCtx.fillStyle = 'white';
				infoCtx.fillRect(toLocation.x - 46 - toData_size.width, toLocation.y + 6, toData_size.width + 10, 18);
				infoCtx.shadowBlur = 0;
				infoCtx.fillStyle = 'black';
				infoCtx.fillText(toData, toLocation.x - 40 - toData_size.width, toLocation.y + 20);
			}
		}
	}
}

function updateSizes(width, height) {
	var canvas = document.getElementById('mesh-floorplanCanvas');
	//canvas.width = width;
	//canvas.height = height;
	canvas.width = width * ratio;
	canvas.height = height * ratio;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	canvas.getContext('2d').scale(ratio, ratio);

	var linkCanvas = document.getElementById('mesh-linkCanvas');
	//linkCanvas.width = width;
	//linkCanvas.height = height;
	linkCanvas.width = width * ratio;
	linkCanvas.height = height * ratio;
	linkCanvas.style.width = width + 'px';
	linkCanvas.style.height = height + 'px';
	linkCanvas.getContext('2d').scale(ratio, ratio);

	var infoCanvas = document.getElementById('mesh-infoCanvas');
	//linkCanvas.width = width;
	//linkCanvas.height = height;
	infoCanvas.width = width * ratio;
	infoCanvas.height = height * ratio;
	infoCanvas.style.width = width + 'px';
	infoCanvas.style.height = height + 'px';
	infoCanvas.getContext('2d').scale(ratio, ratio);

	var apCanvas = document.getElementById('mesh-apCanvas');
	//apCanvas.width = width;
	//apCanvas.height = height;
	apCanvas.width = width * ratio;
	apCanvas.height = height * ratio;
	apCanvas.style.width = width + 'px';
	apCanvas.style.height = height + 'px';
	apCanvas.getContext('2d').scale(ratio, ratio);
	var rfVisualPlanHeight = height + 20;
	document.getElementById('mesh-visualPlan').setAttribute('style', 'height:' + rfVisualPlanHeight + 'px');
	document.getElementById('mesh-visualPlan').style.height = rfVisualPlanHeight + 'px';
}

function clearInfoCanvas() {
	var infoCanvas = document.getElementById('mesh-infoCanvas');
	var infoCtx = infoCanvas.getContext('2d');
	infoCtx.clearRect(0, 0, infoCanvas.width, infoCanvas.height);
}
