/*
Central Automation v1.8
Updated: 1.8.2
Aaron Scott (WiFi Downunder) 2022
*/

var deviceIDs = [];
var errorCounter = 0;
var apDetails = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Override functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageAP() {
	getDenyList();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findClientForMac(macaddr) {
	var clients = getWirelessClients();
	var foundClient = null;
	$.each(clients, function() {
		if (this['macaddr'] === macaddr) {
			foundClient = this;
			return this;
		}
	});
	return foundClient;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Get DenyList for each Swarm/AP
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getDenyList() {
	showNotification('ca-l-remove', 'Getting Denylists...', 'bottom', 'center', 'info');
	$('#denylist-table')
		.DataTable()
		.rows()
		.remove();

	apDetails = {};

	accessPoints = getAPs();
	// Build a list of swarm_id or serial numbers (AOS10)
	deviceIDs = [];
	$.each(accessPoints, function() {
		if (this['swarm_id'] === '') {
			deviceIDs.push(this['serial']);
			apDetails[this['serial']] = this;
		} else if (deviceIDs.indexOf(this['swarm_id']) == -1) {
			deviceIDs.push(this['swarm_id']);
			apDetails[this['swarm_id']] = this;
		}
	});

	var processCounter = 0;
	errorCounter = 0;

	$.each(deviceIDs, function() {
		// grab denylist for each in the deviceIDs
		var settings = {
			url: getAPIURL() + '/tools/getCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/swarm/' + this + '/blacklisting',
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(response, statusText, xhr) {
			//console.log("getDenyList: "+ JSON.stringify(response))
			if (xhr.status == 200) {
				// add devices to the denylist somehow.....
				if (response['blacklist'].length > 0) {
					$.each(response['blacklist'], function() {
						var macaddress = this.toString();

						var clientInfo = findClientForMac(macaddress);
						var name = macaddress;
						if (clientInfo) name = clientInfo['name'];

						var os_type = '';
						if (clientInfo && clientInfo['os_type']) os_type = clientInfo['os_type'];

						// Get AP / Swarm details
						var ap = apDetails[response['device_id']];

						// Make Client Name as a link to Central
						name = encodeURI(name);
						swarmName = encodeURI(ap['swarm_name']);
						apName = encodeURI(ap['name']);
						var apiURL = localStorage.getItem('base_url');
						var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + macaddress + '?ccma=' + macaddress + '&cdcn=' + name + '&nc=client';
						var vcURL = centralURLs[0][apiURL] + '/frontend/#/AP/LIST?casn=' + ap['serial'] + '&cdcn=' + swarmName + '&nc=virtual_controller';
						var apURL = centralURLs[0][apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + apName + '&nc=access_point';

						var removeBtn = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="right" title="Remove from Deny List" onclick="removeClient(\'' + macaddress + "', '" + response['device_id'] + '\')"><i class="fas fa-trash-alt"></i></a>';

						// Add allocation to table
						var table = $('#denylist-table').DataTable();
						table.row.add([clientInfo ? '<a href="' + clientURL + '" target="_blank"><strong>' + name + '</strong></a>' : '<strong>' + name + '</strong>', macaddress, os_type, ap['site'], ap['group_name'], ap['swarm_id'] === '' ? '<a href="' + apURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>' : '<a href="' + vcURL + '" target="_blank"><strong>' + ap['swarm_name'] + '</strong></a>', removeBtn]);
						$('#denylist-table')
							.DataTable()
							.rows()
							.draw();

						$('[data-toggle="tooltip"]').tooltip();
					});
				}
			} else {
				logError(response.status);
			}
			processCounter++;

			if (processCounter >= deviceIDs.length) {
				if (errorCounter > 0) {
					showNotification('ca-l-remove', 'There was an error getting the denylists', 'bottom', 'center', 'error');
				} else {
					showNotification('ca-l-remove', 'Denylist obtained.', 'bottom', 'center', 'success');
				}
				$('#denylist-table')
					.DataTable()
					.rows()
					.draw();
			}
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Remove Client from Deny List
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function removeClient(macaddress, deviceID) {
	var macArray = [];
	macArray.push(macaddress);

	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/swarm/' + deviceID + '/blacklisting',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ blacklist: macArray }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log("removeClient: "+ JSON.stringify(response))
		if (xhr.status == 200) {
			showNotification('ca-l-remove', macaddress + ' removed from Deny List.', 'bottom', 'center', 'success');
		} else {
			showNotification('ca-l-remove', macaddress + ' not removed from Deny List.', 'bottom', 'center', 'error');
		}
	});
}
