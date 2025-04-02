/*
Central Automation v1.7
Updated: 1.21
Aaron Scott (WiFi Downunder) 2021-2025
*/

var selectedClusters = {};
var clusterInfo = {};
var vcNotification;
var updateNotification;

var clusterDetails = {};
var fixedClusters = 0;
var fixedErrors = 0;
/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function reloadSwarmData() {
	vcNotification = showLongNotification('ca-networking', 'Obtaining Virtual Controllers...', 'bottom', 'center', 'info');
	getSwarmData(0);
}

function loadCurrentPageSwarm() {
	vcNotification.update({ message: 'Virtual Controllers obtained', type: 'success' });
	getClusters();
	$('[data-toggle="tooltip"]').tooltip();
}

function getClusters() {
	selectedClusters = {};

	var fullSwarmList = getSwarms();
	clusterInfo = {};
	$.each(fullSwarmList, function() {
		var swarmID = this['swarm_id'];
		clusterInfo[swarmID] = this;
	});

	loadClusterTable(false);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedClusters(swarmID) {
	var rowSelected = document.getElementById(swarmID).checked;
	if (!rowSelected) document.getElementById('cluster-select-all').checked = false;

	if (selectedClusters[swarmID] && !rowSelected) delete selectedClusters[swarmID];
	else selectedClusters[swarmID] = swarmID;
}

function selectAllClusters() {
	var checkBoxChecked = false;
	if (Object.keys(selectedClusters).length < Object.keys(clusterInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(clusterInfo)) {
			if (!selectedClusters[key]) selectedClusters[key] = key;
		}
	} else {
		selectedClusters = {};
	}

	loadClusterTable(checkBoxChecked);
}

function loadClusterTable(checked) {
	$('#cluster-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(clusterInfo)) {
		var clusterList = value;

		// Build checkbox using swarm_id as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')" checked>';

		// Add VC Cluster to table
		var table = $('#cluster-table').DataTable();
		var status = '<i class="fa-solid fa-circle text-success"></i>';
		if (clusterList['status'] === "Down") status = '<i class="fa-solid fa-circle text-danger"></i>';
		table.row.add([key, checkBoxString, '<strong>' + clusterList['name'] + '</strong>', status, clusterList['group_name'], clusterList['firmware_version']]);
	}
	$('#cluster-table')
		.DataTable()
		.rows()
		.draw();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Cluster config functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function correctVCConfig() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'All selected Virtual Controller Clusters will have their configs corrected',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#23CCEF',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, correct them!',
	}).then(result => {
		if (result.isConfirmed) {
			updateNotification = showNotification('ca-folder-settings', 'Checking and updating Instant cluster WLAN Configs...', 'bottom', 'center', 'info');
			var table = $('#cluster-table').DataTable();
			var filter = table.search();
			if (filter !== '') logStart('Checking and updating Instant cluster WLAN Configs (Filter: ' + filter + ')...');
			else logStart('Checking and updating Instant cluster WLAN Configs...');
			confirmedClusterFix();
		}
	});
}

function checkIfComplete() {
	if (fixedClusters + fixedErrors >= Object.entries(selectedClusters).length) {
		updateNotification.update({ message: 'Instant cluster correcting completed', type: 'success' });
		setTimeout(updateNotification.close, 1000);
		if (fixedErrors > 0) {
			Swal.fire({
				title: 'Config Failure',
				text: 'Some or all Instant clusters failed to have their configurations corrected.',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Config Success',
				text: 'All Instant clusters configurations were corrected.',
				icon: 'success',
			});
		}
		showLog();
	}
}

function confirmedClusterFix() {
	fixedClusters = 0;
	fixedErrors = 0;
	var totalDelay = 0;
	// Loop through the selected clusters
	for (const [key, value] of Object.entries(selectedClusters)) {
		setTimeout(processCluster, totalDelay, key); // As to not go over the 7 calls/sec speed limit
		totalDelay += apiDelay;
	}
}

function processCluster(key) {
	clusterDetails[key] = {};
	
	// get swarm IP and config
	$.when(getClusterIP(key)).then(function() {
		$.when(getClusterConfig(key)).then(function() {
			//console.log(clusterDetails)
			// extract the virtual-controller-vlan (if it exists) from the config and remember the line number
			var vcIP = clusterDetails[key]['clusterIP'];
			var vcConfig = clusterDetails[key]['clusterConfig'];
			var vcVlan = null;
			var vcIndex = -1;
			var dnsIndex = -1;
			
			for (var i=0;i<vcConfig.length;i++) {
				if (vcConfig[i].includes("virtual-controller-vlan")) {
					vcVlan = vcConfig[i].trim();
					vcIndex = i;
				} else if (vcConfig[i].includes("virtual-controller-dnsip")) {
					dnsIndex = i;
				}
			};
			
			console.log(dnsIndex)
			
			// if the virtual-controller-vlan command is found...
			if (vcVlan) {
				// need to get list of APs in cluster - to check if AP IP is in the same subnet as the VC IP.
				var vcVlanParts = vcVlan.split(' ');
				$.when(checkSameSubnet(key, vcIP, vcVlanParts[2])).then(function() {
					if (clusterDetails[key]['sameSubnet']) {
						logInformation(clusterDetails[key]['clusterName']+' is configured with VC Subnet Mask in the same subnet as the AP.');
						// remove the virtual-controller-vlan line
						if (vcIndex != -1) vcConfig.splice(vcIndex,1);
						// remove the DNS IP command line (adjusting the index for the VC VLAN command removal)
						if (dnsIndex != -1 && dnsIndex > vcIndex) vcConfig.splice(dnsIndex-1,1);
						else if (dnsIndex != -1 && dnsIndex < vcIndex) vcConfig.splice(dnsIndex,1);
						//console.log(vcConfig)
						
						// need to push updated config back to Central.
						var settings = {
							url: getAPIURL() + '/tools/postCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + key,
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ clis: vcConfig }),
							}),
						};
						
						$.ajax(settings).done(function(response) {
							var updateFailed = 0;
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<SWARM_ID>)');
									return;
								}
							}
							if (response.reason && response.reason == 'Bad Gateway') {
								Swal.fire({
									title: 'API Issue',
									text: 'There is an issue communicating with the API Gateway',
									icon: 'warning',
								});
							} else if (response.code && response.code == 429) {
								console.log('errorCode');
								logError('WLAN config was not applied to ' + clusterDetails[key]['clusterName']);
								Swal.fire({
									title: 'API Limit Reached',
									text: 'You have reached your daily API limit. No more API calls will succeed today.',
									icon: 'warning',
								});
							} else if (response.description) {
								logError(response.description);
								updateFailed++;
							} else if (response !== '' + key) {
								logError('WLAN change was not applied to ' + clusterDetails[key]['clusterName']);
								updateFailed++;
							}
							if (updateFailed != 0) {
								showLog();
								fixedErrors++;
								checkIfComplete();
							} else {
								logInformation(clusterDetails[key]['clusterName']+' configuration was corrected.');
								fixedClusters++;
								checkIfComplete();
							}
						});
						
					}
				});
			} else {
				logInformation(clusterDetails[key]['clusterName']+' is not configured with VC Subnet Mask.');
				fixedClusters++;
				checkIfComplete();
			}
		});
	});
}

function getClusterIP(swarmID) {
	var clusterIPPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/swarm_config/' + swarmID,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/swarm_config/<swarm_id>');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var vcConfig = JSON.parse(commandResults.responseBody);
		var currentDetails = clusterDetails[swarmID];
		currentDetails['clusterIP'] = vcConfig['ip_address'];
		currentDetails['clusterName'] = vcConfig['name'];
		clusterDetails[swarmID] = currentDetails;
		clusterIPPromise.resolve();
	});
	return clusterIPPromise.promise();
}

function getClusterConfig(swarmID) {
	var clusterConfigPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + swarmID,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<swarm_id>');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var vcConfig = JSON.parse(commandResults.responseBody);
		var currentDetails = clusterDetails[swarmID];
		currentDetails['clusterConfig'] = vcConfig;
		clusterDetails[swarmID] = currentDetails;
		clusterConfigPromise.resolve();
	});
	return clusterConfigPromise.promise();
}

function checkSameSubnet(swarmID, ipAddress, subnetMask) {
	var checkPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps?swarm_id=' + swarmID,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/aps?swarm_id=<swarm_id>');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.aps.length > 0) {
			var apIP = response.aps[0]['ip_address'];
			var apSM = response.aps[0]['subnet_mask'];
		
			var currentDetails = clusterDetails[swarmID];
			currentDetails['sameSubnet'] = (IPnumber(apIP) & IPnumber(apSM)) == (IPnumber(ipAddress) & IPnumber(subnetMask));
			clusterDetails[swarmID] = currentDetails;
			checkPromise.resolve();
		}
	});
	return checkPromise.promise();
}

function IPnumber(IPaddress) {
	var ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
	if(ip) {
		return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
	}
	return false;
}

