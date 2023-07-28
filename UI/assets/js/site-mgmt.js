/*
Central Automation v1.27
Updated: 
© Aaron Scott (WiFi Downunder) 2023
*/

var allSites = [];
var selectedSites = {};
var siteInfo = {};

var unassociatedTotals = {};
var goalTotals = {};

var sitesToDelete = 0;
var sitesCounter = 0;

var deleteNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function loadCurrentPageSite() {
	$('#site-mgmt-table')
		.DataTable()
		.clear();
	selectedSites = {};
	document.getElementById('deleteBtn').disabled = true;

	allSites = getSites();
	loadSitesTable(false);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Site UI functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedSites(siteID) {
	var rowSelected = document.getElementById(siteID).checked;
	if (!rowSelected) document.getElementById('site-select-all').checked = false;

	if (selectedSites[siteID] && !rowSelected) delete selectedSites[siteID];
	else selectedSites[siteID] = getSiteNameForID(siteID);

	if (Object.keys(selectedSites).length > 0) document.getElementById('deleteBtn').disabled = false;
	else document.getElementById('deleteBtn').disabled = true;
}

function loadSitesTable(checked) {
	$('#site-mgmt-table')
		.DataTable()
		.rows()
		.remove();

	// Add row to table
	var table = $('#site-mgmt-table').DataTable();
	$.each(allSites, function() {
		var site = this;
		var capestate = '';
		if (site['cape_state'] === 'good') {
			capestate += '<i class="fa-solid fa-circle text-success"></i>';
			capestate += ' No User Experience Issues';
		} else if (site['cape_state']) {
			capestate += '<i class="fa-solid fa-circle text-danger"></i> ';
			capestate = titleCase(noUnderscore(site['cape_state_dscr'][0]));
		}
		if (site['cape_url']) {
			capestate = '<a href="' + site['cape_url'] + '" target="_blank">' + capestate + '</a>';
		}

		var aiinsights = '';
		if (site['insight_hi'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-danger"></i>';
		}
		if (site['insight_mi'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-warning"></i>';
		}
		if (site['insight_lo'] != 0) {
			aiinsights += '<i class="fa-solid fa-circle text-minor"></i>';
		}
		if (aiinsights === '') {
			aiinsights = '<i class="fa-solid fa-circle text-neutral"></i>';
		}

		var status = '<i class="fa-solid fa-circle text-success"></i>';
		var healthReason = '';
		if (site['wan_uplinks_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with WAN links down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wan_tunnels_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with VPN Tunnels down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wlan_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'APs with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wlan_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'AP with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wired_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Switches with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wired_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Switch with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['branch_cpu_high'] > 1) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateways with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['branch_cpu_high'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'Gateway with high CPU usage';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wlan_device_status_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'One or more APs are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['wired_device_status_down'] > 0) {
			status = '<i class="fa-solid fa-circle text-danger"></i>';
			healthReason = 'One or more switches are down';
			if (siteIssues > 1) siteIssues = 1;
		} else if (site['device_high_noise_6ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High noise on 6GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_noise_5ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High noise on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_noise_2_4ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High noise on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_ch_6ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 6GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_ch_5ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 5GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_ch_2_4ghz'] > 0) {
			status = '<i class="fa-solid fa-circle text-warning"></i>';
			healthReason = 'High channel utilization on 2.4GHz';
			if (siteIssues > 2) siteIssues = 2;
		} else if (site['device_high_mem'] > 0) {
			status = '<i class="fa-solid fa-circle text-minor"></i>';
			healthReason = 'Devices with high memory utilization';
			if (siteIssues > 3) siteIssues = 3;
		}

		// Make link to Central
		var name = encodeURI(site['name']);
		var apiURL = localStorage.getItem('base_url');
		var clientURL = centralURLs[0][apiURL] + '/frontend/#/SITEHEALTH?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';
		var aiURL = centralURLs[0][apiURL] + '/frontend/#/SITE_INSIGHTS?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';

		// Build checkbox using Site name
		var checkBoxString = '<input class="" type="checkbox" id="' + site['id'] + '" onclick="updateSelectedSites(\'' + site['id'] + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + site['id'] + '" onclick="updateSelectedSites(\'' + site['id'] + '\')" checked>';

		table.row.add([site['id'], checkBoxString, '<a href="' + clientURL + '" target="_blank"><strong>' + site['name'] + '</strong></a>', status, site['device_up'], site['device_down'], site['connected_count'], capestate, '<a href="' + aiURL + '" target="_blank">' + aiinsights + '</a>', healthReason]);
	});

	$('#site-mgmt-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

function deleteSelectedSites() {
	unassociatedTotals = {};
	goalTotals = {};
	sitesToDelete = Object.entries(selectedSites).length;
	sitesCounter = 0;

	if (Object.entries(selectedSites).length == 0) {
		showNotification('ca-pin-delete', 'No Sites selected. Please select one or more sites', 'bottom', 'center', 'warning');
	} else {
		logStart('Deleting selected sites...');
		deleteNotification = showProgressNotification('ca-pin-delete', 'Deleting selected sites...', 'bottom', 'center', 'info');

		for (const [key, value] of Object.entries(selectedSites)) {
			// get devices for the site
			var devices = [];
			devices = devices.concat(getAPsForSiteID(key));
			devices = devices.concat(getSwitchesForSiteID(key));
			devices = devices.concat(getGatewaysForSiteID(key));

			unassociatedTotals[key] = 0;
			goalTotals[key] = devices.length;

			// If there are devices - need to unassociated before deleting
			if (devices.length > 0) {
				showNotification('ca-unlink', 'Unassociating devices from ' + value + '...', 'bottom', 'center', 'info');
				$.when(unassignDevicesFromSite(devices)).then(function() {
					if (unassociatedTotals[key] >= goalTotals[key]) {
						console.log('Now to delete the site: ' + value);
						deleteSite(key, value);
					} else {
						// error removing devices from the site
						showLog();
						Swal.fire({
							title: 'Removing Devices Failure',
							text: 'Some or all devices failed to be removed from the Site. Site was not deleted.',
							icon: 'error',
						});
					}
				});
			} else {
				console.log('No devices in Site. Deleting the site: ' + value);
				deleteSite(key, value);
			}
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Site Deletion functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function unassignDevicesFromSite(devices) {
	var deletePromise = new $.Deferred();
	for (let i = 0; i < devices.length; i++) {
		var device = devices[i];
		setTimeout(unassignDeviceFromSite, apiDelay * i, device, deletePromise); // As to not go over the 7 calls/sec speed limit
	}
	return deletePromise.promise();
}

function unassignDeviceFromSite(device, deletePromise) {
	/*  
		remove the device from its current site
	*/
	var siteID = getIDforSite(device['site']);
	console.log('Removing device: ' + device['serial'] + ' from site: ' + siteID);

	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: parseInt(siteID) }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites/associate)');
				deletePromise.resolve();
			}
		}
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			deletePromise.resolve();
		} else if (response.hasOwnProperty('success')) {
			logInformation(device['serial'] + ' removed from existing site (' + device['site'] + ')');

			// update totals and check if all done for this site
			unassociatedTotals[siteID] = unassociatedTotals[siteID] + 1;
			if (unassociatedTotals[siteID] >= goalTotals[siteID]) deletePromise.resolve();
		} else {
			logError('Unable to remove ' + device['serial'] + " from it's current site");
			deletePromise.resolve();
		}
	});
}

function checkForDeleteSiteCompletion() {
	var deleteProgress = (sitesCounter / sitesToDelete) * 100;
	deleteNotification.update({ progress: deleteProgress });

	if (sitesCounter >= sitesToDelete) {
		deleteNotification.close();
		if (apiErrorCount != 0) {
			showLog();
			Swal.fire({
				title: 'Site Deletion Failure',
				text: 'Some or all sites failed to be deleted',
				icon: 'error',
			});
		} else {
			setTimeout(getMonitoringData, 5000);
			Swal.fire({
				title: 'Site Deletion Success',
				text: 'All selected sites have been deleted',
				icon: 'success',
			});
		}
	}
}

function deleteSite(siteID, siteName) {
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/' + siteID,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		sitesCounter++;

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites/<site-id>)');
				// Check if all done
				checkForDeleteSiteCompletion();
			}
		}
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			// Check if all done
			checkForDeleteSiteCompletion();
		} else if (response === 'success') {
			logInformation(siteName + ' was deleted');

			// Check if all done
			checkForDeleteSiteCompletion();
		} else {
			logError('Unable to delete site: ' + siteName);
			// Check if all done
			checkForDeleteSiteCompletion();
		}
	});
}
