/*
Central Automation v1.x
Updated: 1.8.2
Aaron Scott (WiFi Downunder) 2022
*/

var forcedTokenRefresh = true;
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';
var csvData;
var apiErrorCount = 0;
var moveCounter = 0;
var addCounter = 0;
var licenseCounter = 0;
var renameCounter = 0;
var inventoryPromise;
var monitoringPromise;
var apPromise;
var switchPromise;
var gatewayPromise;

var aps = [];
var apInventory = [];
var apInventoryCount = 0;
var switches = [];
var switchInventory = [];
var switchInventoryCount = 0;
var gateways = [];
var gatewayInventory = [];
var gatewayInventoryCount = 0;
var deviceType = '';
var sites = [];
var groups = [];
var downAPCount = 0;
var downSwitchCount = 0;
var downGatewayCount = 0;

var neighborSwitches = {};
var renamingCounters = {};
var magicNames = {};

const apiLimit = 100;
const apiGroupLimit = 20;

var currentWorkflow = '';
var autoAddPromise;
var autoLicensePromise;
var autoGroupPromise;
var autoSitePromise;
var autoRenamePromise;
var autoMagicRenamePromise;
var autoPortPromise;

function showLabCard(display) {
	var x = document.getElementById('lab-card');
	if (display) {
		x.style.display = 'block';
	} else {
		x.style.display = 'none';
	}
}

function onFinishSetup() {
	// Save all supplied addresses and details
	localStorage.setItem('client_id', $('#client_id').val());
	localStorage.setItem('client_secret', $('#client_secret').val());
	localStorage.setItem('base_url', $('#base_url').val());
	localStorage.setItem('refresh_token', $('#refresh_token').val());
	localStorage.setItem('access_token', $('#access_token').val());
	localStorage.setItem('ap_naming_format', $('#ap_naming_format').val());
	localStorage.setItem('port_variable_format', $('#port_variable_format').val());
	tokenRefresh();
}

function showNotification(icon, message, from, align, color) {
	var iconString = 'central-icon ' + icon;
	$.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			timer: 500,
			placement: {
				from: from,
				align: align,
			},
		}
	);
}

function logError(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('• ' + message);
	errorBody.appendChild(text);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
	apiErrorCount++;
}

function showLog() {
	$('#ErrorModalLink').trigger('click');
}

function padNumber(num, size) {
	num = num.toString();
	while (num.length < size) num = '0' + num;
	return num;
}

/*  ----------------------------------------------------------------------------------
		CSV functions
	---------------------------------------------------------------------------------- */

function loadCSVFile(clickedRow) {
	$('#files').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processCSV,
		},
		before: function(file, inputElem) {
			showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (!csvData) {
				showNotification('ca-c-warning', 'No CSV data found. Try selecting a CSV document.', 'bottom', 'center', 'danger');
				return false;
			}
			// Clear error log
			var errorBody = document.getElementById('errorBody');
			while (errorBody.hasChildNodes()) {
				errorBody.removeChild(errorBody.firstChild);
			}
			if (clickedRow === 'adddevices') {
				currentWorkflow = '';
				addDevices();
			} else if (clickedRow === 'licensedevices') {
				currentWorkflow = '';
				licenseDevices();
			} else if (clickedRow === 'movetogroup') {
				currentWorkflow = '';
				moveDevicesToGroup();
			} else if (clickedRow === 'movetosite') {
				currentWorkflow = '';
				moveDevicesToSite();
			} else if (clickedRow === 'renametemplate') {
				currentWorkflow = '';
				renameDevices();
			} else if (clickedRow === 'autorenametemplate') {
				currentWorkflow = '';
				magicRenameDevices();
			} else if (clickedRow === 'portdescriptions') {
				currentWorkflow = '';
				updatePortDescription();
			} else if (clickedRow === 'auto-add-license') {
				currentWorkflow = 'auto-add-license';
				addAndLicense();
			} else if (clickedRow === 'auto-add-group') {
				currentWorkflow = 'auto-add-group';
				addAndGroup();
			} else if (clickedRow === 'auto-add-license-group') {
				currentWorkflow = 'auto-add-license-group';
				addLicenseGroup();
			} else if (clickedRow === 'auto-site-rename') {
				currentWorkflow = 'auto-site-rename';
				siteAndRename();
			} else if (clickedRow === 'auto-site-autorename') {
				currentWorkflow = 'auto-site-autorename';
				siteAndAutoRename();
			} else if (clickedRow === 'auto-renameap-portdescriptions') {
				currentWorkflow = 'auto-renameap-portdescriptions';
				renameAndPortDescriptions();
			} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
				currentWorkflow = 'auto-site-autorenameap-portdescriptions';
				siteAndAutoRenameAndPortDescriptions();
			}
		},
	});
}

function processCSV(results) {
	apiErrorCount = 0;
	csvData = results.data;
	forcedTokenRefresh = false;
	tokenRefresh();
}

function generateCSVForSite(clickedRow) {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	console.log(selectedSite);

	//CSV header
	var siteKey = 'SITE';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var nameKey = 'DEVICE NAME';
	var groupKey = 'GROUP';

	// get APs for site
	csvData = [];
	$.each(aps, function() {
		if (this['site'] === selectedSite) {
			csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
		}
	});

	$.each(switches, function() {
		if (this['site'] === selectedSite) {
			csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
		}
	});

	$.each(gateways, function() {
		if (this['site'] === selectedSite) {
			csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
		}
	});

	if (!csvData) {
		showNotification('ca-c-warning', 'No site devices found. Try selecting a different site?', 'bottom', 'center', 'danger');
		return false;
	}
	// Clear error log
	var errorBody = document.getElementById('errorBody');
	while (errorBody.hasChildNodes()) {
		errorBody.removeChild(errorBody.firstChild);
	}
	if (clickedRow === 'adddevices') {
		currentWorkflow = '';
		addDevices();
	} else if (clickedRow === 'licensedevices') {
		currentWorkflow = '';
		licenseDevices();
	} else if (clickedRow === 'movetogroup') {
		currentWorkflow = '';
		moveDevicesToGroup();
	} else if (clickedRow === 'movetosite') {
		currentWorkflow = '';
		moveDevicesToSite();
	} else if (clickedRow === 'renametemplate') {
		currentWorkflow = '';
		renameDevices();
	} else if (clickedRow === 'autorenametemplate') {
		currentWorkflow = '';
		magicRenameDevices();
	} else if (clickedRow === 'portdescriptions') {
		currentWorkflow = '';
		updatePortDescription();
	} else if (clickedRow === 'auto-add-license') {
		currentWorkflow = 'auto-add-license';
		addAndLicense();
	} else if (clickedRow === 'auto-add-license-group') {
		currentWorkflow = 'auto-add-license-group';
		addLicenseGroup();
	} else if (clickedRow === 'auto-site-rename') {
		currentWorkflow = 'auto-site-rename';
		siteAndRename();
	} else if (clickedRow === 'auto-site-autorename') {
		currentWorkflow = 'auto-site-autorename';
		siteAndAutoRename();
	} else if (clickedRow === 'auto-renameap-portdescriptions') {
		currentWorkflow = 'auto-renameap-portdescriptions';
		renameAndPortDescriptions();
	} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
		currentWorkflow = 'auto-site-autorenameap-portdescriptions';
		siteAndAutoRenameAndPortDescriptions();
	}
}

/*  ----------------------------------------------------------------------------------
		Authentication functions
	---------------------------------------------------------------------------------- */

function tokenRefresh() {
	showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: localStorage.getItem('client_id'),
			client_secret: localStorage.getItem('client_secret'),
			access_token: localStorage.getItem('access_token'),
			refresh_token: localStorage.getItem('refresh_token'),
			base_url: localStorage.getItem('base_url'),
		}),
	};

	$.ajax(settings)
		.done(function(response) {
			//console.log(response);
			if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description,
					icon: 'error',
				});
			} else {
				localStorage.setItem('refresh_token', response.refresh_token);
				localStorage.setItem('access_token', response.access_token);
				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('settings')) {
					document.getElementById('refresh_token').value = response.refresh_token;
					document.getElementById('access_token').value = response.access_token;
					Swal.fire({
						title: 'Connected!',
						text: 'Central API connection successful',
						icon: 'success',
					});
				}
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

/*  ----------------------------------------------------------------------------------
		Monitoring functions
	---------------------------------------------------------------------------------- */

function getMonitoringData() {
	if (!localStorage.getItem('base_url')) {
		showNotification('ca-globe', 'API settings are blank...', 'bottom', 'center', 'danger');
		window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'settings.html';
	}

	// Try and refresh the token
	showNotification('ca-contactless-card', 'Updating Monitoring Data...', 'bottom', 'center', 'info');
	var settings = {
		url: getAPIURL() + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: localStorage.getItem('client_id'),
			client_secret: localStorage.getItem('client_secret'),
			access_token: localStorage.getItem('access_token'),
			refresh_token: localStorage.getItem('refresh_token'),
			base_url: localStorage.getItem('base_url'),
		}),
	};

	$.ajax(settings)
		.done(function(response) {
			if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description,
					icon: 'error',
				});
			} else {
				localStorage.setItem('refresh_token', response.refresh_token);
				localStorage.setItem('access_token', response.access_token);

				// Refresh card data
				getAPData(0);
				getSwitchData(0);
				getGatewayData(0);
				getSiteData(0);
				getGroupData(0);
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText, 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

function getAPData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			document.getElementById('ap_count').innerHTML = '-';
		} else {
			document.getElementById('ap_count').innerHTML = '' + response.total + '';
			if (offset === 0) {
				downAPCount = 0;
				aps = [];
				$('#ap-table')
					.DataTable()
					.rows()
					.remove();
				$('#ap-table')
					.DataTable()
					.rows()
					.draw();
			}
			aps = aps.concat(response.aps);
			$.each(response.aps, function() {
				if (this['status'] != 'Up') downAPCount++;
				var status = '<button type="submit" class="btn btn-danger btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				if (this['status'] == 'Up') {
					status = '<button type="submit" class="btn btn-success btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				}

				// Add row to table
				var table = $('#ap-table').DataTable();
				table.row.add([this['name'], status, this['ip_address'], this['model'], this['serial'], this['firmware_version'], this['site'], this['group_name'], this['macaddr']]);
			});

			if (offset + apiLimit <= response.total) getAPData(offset + apiLimit);
			else {
				// Force reload of table data
				$('#ap-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('ap_icon')).removeClass('text-warning');
				if (downAPCount > 0) {
					$(document.getElementById('ap_icon')).addClass('text-danger');
					$(document.getElementById('ap_icon')).removeClass('text-success');
				} else {
					$(document.getElementById('ap_icon')).removeClass('text-danger');
					$(document.getElementById('ap_icon')).addClass('text-success');
				}
			}
		}
	});
}

function getSwitchData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			document.getElementById('switch_count').innerHTML = '-';
		} else {
			document.getElementById('switch_count').innerHTML = '' + response.total + '';

			if (offset == 0) {
				downSwitchCount = 0;
				switches = [];
				$('#switch-table')
					.DataTable()
					.rows()
					.remove();
				$('#switch-table')
					.DataTable()
					.rows()
					.draw();
			}

			switches = switches.concat(response.switches);
			$.each(response.switches, function() {
				if (this['status'] != 'Up') downSwitchCount++;
				var status = '<button type="submit" class="btn btn-danger btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				if (this['status'] == 'Up') {
					status = '<button type="submit" class="btn btn-success btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				}

				// Add row to table
				var table = $('#switch-table').DataTable();
				table.row.add([this['name'], status, this['ip_address'], this['model'], this['serial'], this['firmware_version'], this['site'], this['group_name'], this['macaddr']]);
			});

			if (offset + apiLimit <= response.total) getSwitchData(offset + apiLimit);
			else {
				// Force reload of table data
				$('#switch-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('switch_icon')).removeClass('text-warning');
				if (downSwitchCount > 0) {
					$(document.getElementById('switch_icon')).addClass('text-danger');
					$(document.getElementById('switch_icon')).removeClass('text-success');
				} else {
					$(document.getElementById('switch_icon')).removeClass('text-danger');
					$(document.getElementById('switch_icon')).addClass('text-success');
				}
			}
		}
	});
}

function getGatewayData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			document.getElementById('gateway_count').innerHTML = '-';
		} else {
			document.getElementById('gateway_count').innerHTML = '' + response.total + '';

			if (offset == 0) {
				downGatewayCount = 0;
				gateways = [];
				$('#gateway-table')
					.DataTable()
					.rows()
					.remove();
				$('#gateway-table')
					.DataTable()
					.rows()
					.draw();
			}

			gateways = gateways.concat(response.gateways);
			$.each(response.gateways, function() {
				if (this['status'] != 'Up') downGatewayCount++;
				var status = '<button type="submit" class="btn btn-danger btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				if (this['status'] == 'Up') {
					status = '<button type="submit" class="btn btn-success btn-outline btn-round btn-xs" name="statusBtn" id="statusBtn" onclick="doNothing();"></button>';
				}

				// Add row to table
				var table = $('#gateway-table').DataTable();
				table.row.add([this['name'], status, this['ip_address'], this['model'], this['serial'], this['firmware_version'], this['site'], this['group_name'], this['macaddr']]);
			});

			if (offset + apiLimit <= response.total) getGatewayData(offset + apiLimit);
			else {
				// Force reload of table data
				$('#gateway-table')
					.DataTable()
					.rows()
					.draw();

				$(document.getElementById('gateway_icon')).removeClass('text-warning');
				if (downGatewayCount > 0) {
					$(document.getElementById('gateway_icon')).addClass('text-danger');
					$(document.getElementById('gateway_icon')).removeClass('text-success');
				} else {
					$(document.getElementById('gateway_icon')).removeClass('text-danger');
					$(document.getElementById('gateway_icon')).addClass('text-success');
				}
			}
		}
	});
}

function getSiteData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			document.getElementById('site_count').innerHTML = '-';
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
		} else {
			document.getElementById('site_count').innerHTML = '' + response.count + '';

			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset == 0) {
				sites = [];
				$('#site-table')
					.DataTable()
					.rows()
					.remove();
				$('#site-table')
					.DataTable()
					.rows()
					.draw();
				if (page.includes('workflow-site')) {
					// remove old groups from the selector
					select = document.getElementById('siteselector');
					select.options.length = 0;
				}
			}

			sites = sites.concat(response.sites);
			$.each(response.sites, function() {
				// Add row to table
				var table = $('#site-table').DataTable();
				table.row.add([this['site_name']]);

				if (page.includes('workflow-site')) {
					// Add site to the dropdown selector
					$('#siteselector').append($('<option>', { value: this['site_name'], text: this['site_name'] }));
				}
			});

			if (offset + apiLimit <= response.total) getSiteData(offset + apiLimit);
			else {
				// Force reload of table data
				$('#site-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('site_icon')).addClass('text-primary');
				$(document.getElementById('site_icon')).removeClass('text-warning');
			}
		}
	});
}

function getGroupData(offset) {
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups?limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			document.getElementById('group_count').innerHTML = '' + response.total + '';
			if (offset == 0) {
				groups = [];
				$('#group-table')
					.DataTable()
					.rows()
					.remove();
				$('#group-table')
					.DataTable()
					.rows()
					.draw();
			}
			groups = groups.concat(response.data);

			$.each(response.data, function() {
				// Add row to table
				var table = $('#group-table').DataTable();
				table.row.add([this]);
			});

			if (offset + apiGroupLimit <= response.total) getGroupData(offset + apiGroupLimit);
			else {
				// Force reload of table data
				$('#group-table')
					.DataTable()
					.rows()
					.draw();
				$(document.getElementById('group_icon')).addClass('text-primary');
				$(document.getElementById('group_icon')).removeClass('text-warning');
			}
		}
	});
}

/*  ----------------------------------------------------------------------------------
		Add functions
	---------------------------------------------------------------------------------- */

function addDevices() {
	addCounter = 0;
	showNotification('ca-c-add', 'Adding devices...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/device_inventory/v1/devices',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ mac: this['MAC'], serial: [this['SERIAL']] }),
			}),
		};

		$.ajax(settings).done(function(response) {
			if (response.hasOwnProperty('error_code')) {
				logError(response.description);
			}
			moveCounter = moveCounter + 1;
			if (moveCounter == csvData.length) {
				if (currentWorkflow === '') {
					if (apiErrorCount != 0) {
						$('#ErrorModalLink').trigger('click');
						Swal.fire({
							title: 'Add Failure',
							text: 'Some or all devices failed to be added to Central',
							icon: 'error',
						});
					} else {
						Swal.fire({
							title: 'Add Success',
							text: 'All devices were added to Central',
							icon: 'success',
						});
					}
				} else {
					// complete the Add part of the automation
					console.log('Automation: Adding devices complete');
					autoAddPromise.resolve();
				}
			}
		});
	});
	return autoAddPromise.promise();
}

/*  ----------------------------------------------------------------------------------
		Inventory functions
	---------------------------------------------------------------------------------- */

function getAPInventory(offset) {
	/*  
		Grab ap inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=IAP&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (apInventory.length == apInventoryCount) {
				apPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				apInventory = [];
				apInventoryCount = response.total;
			}
			apInventory = apInventory.concat(response.devices);
			if (offset + apiLimit <= response.total) getAPInventory(offset + apiLimit); // if there are still objects to get
			//console.log(apInventory)
		}
	});

	return apPromise.promise();
}

function getSwitchInventory(offset) {
	/*  
		Grab switch inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=switch&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (switchInventory.length == switchInventoryCount) {
				switchPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				switchInventory = [];
				switchInventoryCount = response.total;
			}
			switchInventory = switchInventory.concat(response.devices);
			if (offset + apiLimit <= response.total) getSwitchInventory(offset + apiLimit); // if there are still objects to get
		}
	});

	return switchPromise.promise();
}

function getGatewayInventory(offset) {
	/*  
		Grab gateway inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=gateway&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (gatewayInventory.length == gatewayInventoryCount) {
				gatewayPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(response) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				gatewayInventory = [];
				gatewayInventoryCount = response.total;
			}
			gatewayInventory = gatewayInventory.concat(response.devices);
			if (offset + apiLimit <= response.total) getGatewayInventory(offset + apiLimit); // if there are still objects to get
			//console.log(apInventory)
		}
	});

	return gatewayPromise.promise();
}

function updateInventory() {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	showNotification('ca-stock-2', 'Obtaining device inventory...', 'bottom', 'center', 'info');
	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	apPromise = new $.Deferred();
	switchPromise = new $.Deferred();
	gatewayPromise = new $.Deferred();
	$.when(getAPInventory(0), getSwitchInventory(0), getGatewayInventory(0)).then(function() {
		//console.log('Got ALL Inventories');
		inventoryPromise.resolve();
	});
	return inventoryPromise.promise();
}

/*  ----------------------------------------------------------------------------------
		Searching functions
	---------------------------------------------------------------------------------- */

function findDeviceInInventory(currentSerial) {
	/*  
		Search through all inventories 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(apInventory, function() {
		if (this['serial'] === currentSerial) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switchInventory, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gatewayInventory, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMonitoring(currentSerial) {
	/*  
		Search through all monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(aps, function() {
		if (this['serial'] === currentSerial) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switches, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function() {
			if (this['serial'] === currentSerial) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

/*  ----------------------------------------------------------------------------------
		Licensing functions
	---------------------------------------------------------------------------------- */
function checkForLicensingCompletion() {
	if (licenseCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'License Failure',
					text: 'Some or all devices failed to be licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were assigned licenses',
					icon: 'success',
				});
			}
		} else {
			console.log('Automation: Licensing complete');
			autoLicensePromise.resolve();
		}
	}
}

function licenseDevices() {
	/*  
		Grab all 3 inventories from API.  
		Scan though  each inventory to find the device.
		Generate the require license string
		Assign license.
	*/
	licenseCounter = 0;

	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		showNotification('ca-license-key', 'Licensing devices...', 'bottom', 'center', 'info');
		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'];
			if (currentSerial === '') return true;
			var requestedLicense = this['LICENSE'];
			if (!requestedLicense) requestedLicense = 'foundation';
			var license = '';

			// Find the device and type
			var foundDevice = findDeviceInInventory(currentSerial);

			if (deviceType === 'IAP') {
				if (requestedLicense.toLowerCase().includes('foundation')) {
					license = 'foundation_ap';
				} else {
					license = 'advanced_ap';
				}
			} else if (deviceType === 'SWITCH') {
				// Check Switches
				if (requestedLicense.toLowerCase().includes('foundation')) {
					license = 'foundation_switch_';
				} else {
					license = 'advanced_switch_';
				}
				// check the license skus at https://internal-apigw.central.arubanetworks.com/platform/licensing/v1/services/config
				// Grab switch model from
				if (foundDevice['aruba_part_no'].includes('83') || foundDevice['aruba_part_no'].includes('84')) {
					license = license + '8300';
				} else if (foundDevice['aruba_part_no'].includes('6400') || foundDevice['aruba_part_no'].includes('54')) {
					license = license + '6400';
				} else if (foundDevice['aruba_part_no'].includes('6300') || foundDevice['aruba_part_no'].includes('38')) {
					license = license + '6300';
				} else if (foundDevice['aruba_part_no'].includes('6100') || foundDevice['aruba_part_no'].includes('25')) {
					license = license + '6100';
				} else if (foundDevice['aruba_part_no'].includes('6200') || foundDevice['aruba_part_no'].includes('29')) {
					license = license + '6200';
				}
			} else if (deviceType === 'CONTROLLER') {
				// Check Gateways
				if (requestedLicense.toLowerCase().includes('wlan')) {
					license = 'foundation_wlan_gw';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation-base')) {
					license = 'foundation_base_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('foundation-base')) {
					license = 'foundation_base_7005';
				} else if (requestedLicense.toLowerCase().includes('advance-base')) {
					license = 'advance_base_7005';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation') && (foundDevice['aruba_part_no'].includes('70') || foundDevice['aruba_part_no'].includes('90'))) {
					license = 'foundation_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && (foundDevice['aruba_part_no'].includes('70') || foundDevice['aruba_part_no'].includes('90'))) {
					license = 'advance_90xx_sec';
				} else if (requestedLicense.toLowerCase().includes('foundation') && (foundDevice['aruba_part_no'].includes('70') || foundDevice['aruba_part_no'].includes('90'))) {
					license = 'foundation_70xx';
				} else if (requestedLicense.toLowerCase().includes('advanced') && (foundDevice['aruba_part_no'].includes('70') || foundDevice['aruba_part_no'].includes('90'))) {
					license = 'advance_70xx';
				} else if (requestedLicense.toLowerCase().includes('foundation') && foundDevice['aruba_part_no'].includes('72')) {
					license = 'foundation_72xx';
				} else if (requestedLicense.toLowerCase().includes('advanced') && foundDevice['aruba_part_no'].includes('72')) {
					license = 'advance_72xx';
				}
			}

			if (!foundDevice) {
				logError('Device with Serial Number: ' + currentSerial + ' was not found in the device inventory');
				licenseCounter = licenseCounter + 1;
				checkForLicensingCompletion();
			} else {
				// Update licensing
				var settings = {
					url: getAPIURL() + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/assign',
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({ serials: [currentSerial], services: [license] }),
					}),
				};

				$.ajax(settings).done(function(response) {
					if (response.hasOwnProperty('error_code')) {
						logError(response.description);
					}
					licenseCounter = licenseCounter + 1;
					checkForLicensingCompletion();
				});
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoLicensePromise.promise();
	}
}

/*  ----------------------------------------------------------------------------------
		Group functions
	---------------------------------------------------------------------------------- */

function moveDevicesToGroup() {
	/*  
		Move each device to the correct group
	*/
	showNotification('ca-folder-replace', 'Moving devices into groups...', 'bottom', 'center', 'info');
	moveCounter = 0;

	$.each(csvData, function() {
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/devices/move',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ group: this['GROUP'], serials: [this['SERIAL']] }),
			}),
		};

		$.ajax(settings).done(function(response) {
			if (response.hasOwnProperty('error_code')) {
				logError(response.description);
			}
			moveCounter = moveCounter + 1;
			if (moveCounter == csvData.length) {
				if (currentWorkflow === '') {
					if (apiErrorCount != 0) {
						$('#ErrorModalLink').trigger('click');
						Swal.fire({
							title: 'Move Failure',
							text: 'Some or all devices failed to move to the specified group',
							icon: 'error',
						});
					} else {
						Swal.fire({
							title: 'Move Success',
							text: 'All devices were to moved to the specified groups',
							icon: 'success',
						});
					}
				} else {
					console.log('Automation: Move to Group complete');
					autoGroupPromise.resolve();
				}
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoGroupPromise.promise();
	}
}

/*  ----------------------------------------------------------------------------------
		Site functions
	---------------------------------------------------------------------------------- */
function unassignDeviceFromSite(device) {
	/*  
		remove the device from its current site
	*/
	console.log('removing site from device: ' + device['serial'] + ' from ' + device['site_id']);
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
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: device['site_id'] }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
		} else if (response.success[0].device_id === device['serial']) {
			console.log('Device removed from site: ' + response.success[0].device_id);
		} else {
			logError('Unable to remove ' + device['serial'] + " from it's current site");
		}
	});
}

function assignDeviceToSite(device, site) {
	/*  
		assigning the device to a site
	*/
	console.log('assigning site ' + site + ' from device: ' + device['serial']);
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: site }),
		}),
	};

	return $.ajax(settings).done(function(response) {
		if (response.status !== 200) {
			logError(device + ' was not assigned to site ' + site);
		}
		moveCounter = moveCounter + 1;
		checkForSiteMoveCompletion();
	});
}

function getIDforSite(site) {
	/*  
		get site from sites monitoring data
		return site_id for matching site
	*/
	var siteId = -1; // used when the site isn't found
	//console.log('looking for site: '+site)
	$.each(sites, function() {
		if (this['site_name'] === site) {
			siteId = this['site_id'];
			return false;
		}
	});
	return siteId;
}

function checkForSiteMoveCompletion() {
	if (moveCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Move to Site Failure',
					text: 'Some or all devices failed to be moved to the correct sites',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were moved to the correct sites',
					icon: 'success',
				});
			}
		} else {
			console.log('Automation: Site assignment complete');
			autoSitePromise.resolve();
		}
	}
}

function moveDevicesToSite() {
	/*  
		get site from sites data
		get device from correct device data
		check if device is in a site
		if yes, and the correct site - do nothing :)
		if yes, but not the correct site, unassign device from old site
		assign new site
	*/

	showNotification('ca-world-pin', 'Moving devices into sites...', 'bottom', 'center', 'info');
	moveCounter = 0;
	// Get the device monitoring data (IAP, Switch, Gateway) to determine device type
	$.each(csvData, function() {
		// find device in inventory to get device type
		var currentSerial = this['SERIAL'];
		var currentSite = this['SITE'];
		if (!currentSite) {
			logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
			moveCounter = moveCounter + 1;
			checkForSiteMoveCompletion();
		} else {
			var found = false;
			// Check APs
			// Find the device and type
			var foundDevice = findDeviceInMonitoring(currentSerial);

			if (!foundDevice) {
				logError('Device with Serial Number: ' + currentSerial + ' was not found in the device monitoring');
				moveCounter = moveCounter + 1;
				checkForSiteMoveCompletion();
			} else {
				if (!foundDevice['site']) {
					// add device to site
					siteId = getIDforSite(currentSite);
					if (siteId != -1) {
						assignDeviceToSite(foundDevice, siteId);
					} else {
						logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
						moveCounter = moveCounter + 1;
						checkForSiteMoveCompletion();
					}
				} else if (foundDevice['site'] !== currentSite) {
					// remove from old site,  then add to new site
					$.when(unassignDeviceFromSite(foundDevice)).then(function() {
						siteId = getIDforSite(currentSite);
						if (siteId != -1) {
							assignDeviceToSite(foundDevice, siteId);
						} else {
							logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
							moveCounter = moveCounter + 1;
							checkForSiteMoveCompletion();
						}
					});
				} else {
					// no need to move the device. It's already in the correct site
					moveCounter = moveCounter + 1;
					checkForSiteMoveCompletion();
				}
			}
		}
	});
	if (currentWorkflow !== '') {
		return autoSitePromise.promise();
	}
}

/*  ----------------------------------------------------------------------------------
		Renaming functions
	---------------------------------------------------------------------------------- */
function checkForRenameCompletion() {
	if (renameCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all devices failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All devices were renamed',
					icon: 'success',
				});
			}
		} else if (currentWorkflow === 'auto-site-rename') {
			console.log('Automation: Renaming complete');
			autoRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorename') {
			console.log('Automation: Magic Renaming complete');
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorenameap-portdescriptions') {
			console.log('Automation: Magic Renaming complete');
			autoMagicRenamePromise.resolve();
		}
	}
}

function renameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/

	renameCounter = 0;
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		showNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'];
			var newHostname = this['DEVICE NAME'];
			if (!newHostname) {
				logError('Device with Serial Number: ' + currentSerial + ' has no hostname in the CSV file');
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			} else {
				var device = findDeviceInInventory(currentSerial);
				if (!device) {
					logError('Unable to find device ' + currentSerial + ' in the device inventory');
					apiErrorCount++;
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else if (deviceType === 'IAP') {
					// if AP then get AP settings
					var settings = {
						url: getAPIURL() + '/tools/getCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(response) {
						//console.log(response);
						if (response.hasOwnProperty('error_code')) {
							logError(response.description);
							apiErrorCount++;
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						} else if (response.hostname === newHostname) {
							// no need to do anything as the name already matches
							console.log('Device ' + currentSerial + " hostname doesn't need to be updated");
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
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
									url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
									data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
								}),
							};

							$.ajax(settings).done(function(response) {
								if (response !== currentSerial) {
									logError(device + ' was not renamed');
									console.log(response.reason);
									apiErrorCount++;
								}
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							});
						}
					});
				} else if (deviceType === 'SWITCH') {
					// patch the switch template variables
					var settings = {
						url: getAPIURL() + '/tools/patchCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({ total: 1, variables: { _sys_hostname: newHostname } }),
						}),
					};

					$.ajax(settings).done(function(response) {
						if (response !== 'Success') {
							logError('The switch ' + currentSerial + ' was not able to be renamed');
							apiErrorCount++;
						}
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					});
				} else if (deviceType === 'CONTROLLER') {
					// unsupported
					logError('The gateway ' + currentSerial + " was not able to be renamed,  as gateway renaming isn't supported yet");
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				}
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRenamePromise.promise();
	}
}

function magicRenameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/

	renameCounter = 0;
	renamingCounters = {};
	magicNames = {};
	inventoryPromise = new $.Deferred();
	$.when(updateInventory()).then(function() {
		showNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'];

			// Grab AP name format from localStorage
			var newHostname = localStorage.getItem('ap_naming_format');
			if (newHostname === null || newHostname === '') {
				newHostname = '{{initials}}-{{model}}-{{number}}';
			}

			// Format: SiteInitials-APModel-Number
			if (!this['SITE'] && (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}'))) {
				logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			} else {
				var siteInitials = '';
				var site = '';
				if (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}')) {
					site = this['SITE'];
					siteInitials = site.match(/\b(\w)/g).join('');
				}
				var device = findDeviceInInventory(currentSerial);
				if (!device) {
					logError('Unable to find device ' + currentSerial + ' in the device inventory');
					apiErrorCount++;
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else if (deviceType === 'IAP') {
					// Grab model number
					var model = device.aruba_part_no;

					// grab AP number - sequential for each site, and update for next AP.
					var apNumber = renamingCounters[siteInitials];
					if (!apNumber) {
						renamingCounters[siteInitials] = 1;
						apNumber = 1;
					}
					renamingCounters[siteInitials] = apNumber + 1;

					//  generate string for AP number
					var tripleDigit = padNumber(apNumber, 3);

					// Replace elements in the format
					newHostname = newHostname.replace('{{initials}}', siteInitials);
					newHostname = newHostname.replace('{{site}}', site);
					newHostname = newHostname.replace('{{model}}', model);
					newHostname = newHostname.replace('{{number}}', tripleDigit);

					// Replace spaces
					newHostname = newHostname.replace(/ /g, '');

					magicNames[currentSerial] = newHostname; // store incase of enhanced workflow requiring it.

					// if AP then get AP settings
					var settings = {
						url: getAPIURL() + '/tools/getCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(response) {
						//console.log(response);
						if (response.hasOwnProperty('error_code')) {
							logError(response.description);
							apiErrorCount++;
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						} else if (response.hostname === newHostname) {
							// no need to do anything as the name already matches
							console.log('Device ' + currentSerial + " hostname doesn't need to be updated");
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
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
									url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
									data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
								}),
							};

							$.ajax(settings).done(function(response) {
								if (response !== currentSerial) {
									logError(device + ' was not renamed');
									console.log(response.reason);
									apiErrorCount++;
								}
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							});
						}
					});
				} else {
					console.log('Not an IAP');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				}
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoMagicRenamePromise.promise();
	}
}

function checkForUpdatePortCompletion() {
	if (updatePortsCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all ports failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All ports with connected APs were renamed',
					icon: 'success',
				});
			}
		} else {
			autoPortPromise.resolve();
		}
	}
}

function getTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/topology_external_api/apNeighbors/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(response) {
		var neighbors = response.neighbors;
		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === 'Switch' && this.localPort === 'eth0' && findDeviceInMonitoring(this.neighborSerial)) {
				neighborSwitches[serial] = this;
				return false;
			}
		});
	});
}

function updatePortDescription(magic) {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/

	updatePortsCounter = 0;
	neighborSwitches = {};
	showNotification('ca-card-update', 'Renaming switch ports for connected APs...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var currentSerial = this['SERIAL'];
		var hostname = this['DEVICE NAME'];
		var device = findDeviceInMonitoring(currentSerial);
		if (deviceType === 'IAP') {
			$.when(getTopologyNeighbors(currentSerial)).then(function() {
				if (!neighborSwitches[currentSerial]) {
					updatePortsCounter = updatePortsCounter + 1;
					checkForUpdatePortCompletion();
				} else {
					var portName = 'int' + neighborSwitches[currentSerial].remotePort + '_name';
					var variables = {};
					if (magic) {
						// running enhanced naming workflow
						hostname = magicNames[currentSerial];
					}
					variables[portName] = hostname;
					// Update port description with AP hostname
					var settings = {
						url: getAPIURL() + '/tools/patchCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + neighborSwitches[currentSerial].neighborSerial + '/template_variables',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({ total: 1, variables: variables }),
						}),
					};

					$.ajax(settings).done(function(response) {
						if (response !== 'Success') {
							logError('The switch port for AP (' + currentSerial + ') was not able to be renamed');
							apiErrorCount++;
						}
						updatePortsCounter = updatePortsCounter + 1;
						checkForUpdatePortCompletion();
					});
				}
			});
		} else {
			updatePortsCounter = updatePortsCounter + 1;
			checkForUpdatePortCompletion();
		}
	});
	if (currentWorkflow !== '') {
		return autoPortPromise.promise();
	}
}

/*  ----------------------------------------------------------------------------------
		Automated Tasks functions
	---------------------------------------------------------------------------------- */

function addAndLicense() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added & licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added & licensed',
					icon: 'success',
				});
			}
		});
	});
}

function addAndGroup() {
	autoAddPromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now move devices
		$.when(moveDevicesToGroup()).then(function() {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added, and moved into a group',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added and moved into a group',
					icon: 'success',
				});
			}
		});
	});
}

function addLicenseGroup() {
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			// licensing completed  - now move devices
			$.when(moveDevicesToGroup()).then(function() {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, licensed and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added, licensed and moved into a group',
						icon: 'success',
					});
				}
			});
		});
	});
}

function siteAndRename() {
	autoSitePromise = new $.Deferred();
	autoRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		$.when(renameDevices()).then(function() {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRename() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function renameAndPortDescriptions() {
	autoRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(renameDevices()).then(function() {
		// Add devices completed  - now license devices
		$.when(updatePortDescription()).then(function() {
			if (apiErrorCount != 0) {
				$('#ErrorModalLink').trigger('click');
				Swal.fire({
					title: 'Automation Failure',
					text: "Some or all devices failed to be renamed and/or port descriptions didn't update",
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were renamed and port descriptions updated',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRenameAndPortDescriptions() {
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			// update port descriptions with magic AP Name
			$.when(updatePortDescription('magic')).then(function() {
				if (apiErrorCount != 0) {
					$('#ErrorModalLink').trigger('click');
					Swal.fire({
						title: 'Automation Failure',
						text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were moved to site, renamed and port descriptions updated',
						icon: 'success',
					});
				}
			});
		});
	});
}
