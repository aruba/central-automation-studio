/*
Central Automation v1.6.0
Updated: 1.8.2
Copyright Aaron Scott (WiFi Downunder) 2021-2025
*/

var centralCredentials = [];

var cop_url = 'https://apigw-';

/*  ----------------------------------------------------------------------------------
		Hydra functions
	---------------------------------------------------------------------------------- */
function loadCentralVCredentials() {
	var account_details = localStorage.getItem('account_details');
	if (account_details != null && account_details != 'undefined') {
		centralCredentials = JSON.parse(account_details);
		if (document.getElementById('dashboardLink')) {
			if (centralCredentials.length > 1) {
				document.getElementById('dashboardLink').setAttribute('href', 'hydra-dashboard.html');
			} else {
				document.getElementById('dashboardLink').setAttribute('href', 'dashboard.html');
			}
		}
	}
}

function getbaseURLforClientID(client_id) {
	baseURL = '';
	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) {
			baseURL = centralCredentials[i].base_url;
			if (baseURL === getAPIGateway('Central On-Prem')) {
				baseURL = cop_url + centralCredentials[i].cop_address;
			}
		}
	}
	return baseURL;
}

function getAccessTokenforClientID(client_id) {
	accessToken = '';
	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) accessToken = centralCredentials[i].access_token;
	}
	return accessToken;
}

function isAccessTokenExpiredForClientID(client_id) {
	
	expiry = true;
	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) {
			expiryTimestamp = centralCredentials[i].expires_at;
			if (expiryTimestamp) {
				var nowTimestamp = Date.now();
				expiry = (expiryTimestamp < nowTimestamp + 300000)
			}
		}
	}
	return expiry;
}

function getRefreshTokenforClientID(client_id) {
	refreshToken = '';
	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) refreshToken = centralCredentials[i].refresh_token;
	}
	return refreshToken;
}

function getClientSecretforClientID(client_id) {
	clientSecret = '';

	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) clientSecret = centralCredentials[i].client_secret;
	}
	return clientSecret;
}

function getNameforClientID(client_id) {
	name = '';

	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) name = centralCredentials[i].account_name;
	}
	return name;
}

function getAccountforClientID(client_id) {
	foundAccount = {};

	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) foundAccount = centralCredentials[i];
	}
	return foundAccount;
}

function getAccountforName(account_name) {
	foundAccount = {};

	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].account_name === account_name) foundAccount = centralCredentials[i];
	}
	return foundAccount;
}

function updateAccountDetails(account) {
	loadCentralVCredentials();
	centralCredentials[checkForDuplicateAccount(account.client_id)] = account;
	localStorage.setItem('account_details', JSON.stringify(centralCredentials));
}

/*  ----------------------------------------------------------------------------------
		Hydra Account functions
	---------------------------------------------------------------------------------- */

function addAccount() {
	document.getElementById('account_name').value = '';
	document.getElementById('cop_address').value = '';
	document.getElementById('central_id').value = '';
	document.getElementById('client_id').value = '';
	document.getElementById('client_id').disabled = false;
	document.getElementById('client_secret').value = '';
	document.getElementById('access_token').value = '';
	document.getElementById('expires_at').value = '';
	document.getElementById('expires_at').name = '';
	document.getElementById('refresh_token').value = '';
	isCOPSelected();
	$('#AccountModalLink').trigger('click');
}

function saveAccount() {
	loadCentralVCredentials();
	// Save all supplied addresses and details to the array of accounts
	var currentAccount = checkForDuplicateAccount($('#client_id').val());

	if (currentAccount == -1) {
		centralCredentials.push({ account_name: $('#account_name').val(), central_id: $('#central_id').val().trim(), client_id: $('#client_id').val().trim(), client_secret: $('#client_secret').val().trim(), base_url: document.getElementById('clusterselector').value, cop_address: $('#cop_address').val(), refresh_token: $('#refresh_token').val().trim(), access_token: $('#access_token').val().trim(), expires_at: document.getElementById('expires_at').name.trim() });

		// save array to localStorage
		localStorage.setItem('account_details', JSON.stringify(centralCredentials));
	} else {
		//modify existing account
		centralCredentials[currentAccount] = { account_name: $('#account_name').val(), central_id: $('#central_id').val().trim(), client_id: $('#client_id').val().trim(), client_secret: $('#client_secret').val().trim(), base_url: document.getElementById('clusterselector').value, cop_address: $('#cop_address').val(), refresh_token: $('#refresh_token').val().trim(), access_token: $('#access_token').val().trim(), expires_at: document.getElementById('expires_at').name.trim() };
		localStorage.setItem('account_details', JSON.stringify(centralCredentials));
	}

	loadAccountDetails();
	localStorage.removeItem('monitoring_update');
	$('#AccountModal').modal('hide');
}

function cancelAccount() {
	$('#AccountModal').modal('hide');
}

function editAccount(clientID) {
	loadCentralVCredentials();
	var account = centralCredentials[checkForDuplicateAccount(clientID)];
	document.getElementById('account_name').value = account.account_name;
	document.getElementById('central_id').value = account.central_id ? account.central_id : '';
	document.getElementById('client_id').value = account.client_id;
	document.getElementById('client_id').disabled = true;
	document.getElementById('client_secret').value = account.client_secret;
	document.getElementById('clusterselector').value = account.base_url;
	document.getElementById('cop_address').value = account.cop_address ? account.cop_address : '';
	document.getElementById('access_token').value = account.access_token;
	document.getElementById('expires_at').value = account.expires_at;
	document.getElementById('expires_at').name = account.expires_at;
	document.getElementById('refresh_token').value = account.refresh_token;
	
	isCOPSelected();
	$('#AccountModalLink').trigger('click');
}

function deleteAccount(clientID) {
	Swal.fire({
		title: 'Are you sure you want to delete?',
		icon: 'question',
		showDenyButton: true,
		confirmButtonText: `Yes`,
		denyButtonText: `No`,
	}).then(result => {
		if (result.isConfirmed) {
			loadCentralVCredentials();
			centralCredentials.splice(checkForDuplicateAccount(clientID), 1);
			localStorage.setItem('account_details', JSON.stringify(centralCredentials));
			loadAccountDetails();
		}
	});
}

function checkForDuplicateAccount(client_id) {
	foundAccount = -1;
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) foundAccount = i;
	}
	return foundAccount;
}

function loadAccountDetails() {
	$('#hydra-table')
		.DataTable()
		.clear();

	var showSecrets = JSON.parse(localStorage.getItem('reveal_secrets'));

	loadCentralVCredentials();
	$.each(centralCredentials, function() {
		var btnString = '<a href="#" class="btn btn-link btn-warning edit"><i class="fa-solid fa-edit"></i></a><a href="#" class="btn btn-link btn-danger remove"><i class="fa-solid fa-trash-can"></i></a>';

		var table = $('#hydra-table').DataTable();
		if (showSecrets) {
			table.row.add(['<strong>' + this['account_name'] + '</strong>', getClusterName(this['base_url']), this['client_id'], this['client_secret'], this['access_token'], this['refresh_token'], btnString]);
		} else {
			table.row.add(['<strong>' + this['account_name'] + '</strong>', getClusterName(this['base_url']), this['client_id'], '********', '********', '********', btnString]);
		}
	});
	$('#hydra-table')
		.DataTable()
		.rows()
		.draw();
}

function showSecrets() {
	localStorage.setItem('reveal_secrets', document.getElementById('revealSecrets').checked);
	loadAccountDetails();
}

function upgradeAccountSettings() {
	// Migration of account settings to hydra format
	centralCredentials.push({ account_name: 'Central', central_id: localStorage.getItem('central_id'), client_id: localStorage.getItem('client_id'), client_secret: localStorage.getItem('client_secret'), base_url: localStorage.getItem('base_url'), cop_address: localStorage.getItem('cop_address'), refresh_token: localStorage.getItem('refresh_token'), access_token: localStorage.getItem('access_token') });
	// save array to localStorage
	localStorage.setItem('account_details', JSON.stringify(centralCredentials));
}

function testToken() {
	showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');

	var base_url = document.getElementById('clusterselector').value;
	if (base_url === getAPIGateway('Central On-Prem')) {
		base_url = cop_url + document.getElementById('cop_address').value;
	}

	var settings = {
		url: getAPIURL() + '/auth/refresh',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			client_id: $('#client_id').val(),
			client_secret: $('#client_secret').val(),
			access_token: $('#access_token').val(),
			refresh_token: $('#refresh_token').val(),
			base_url: base_url,
		}),
	};

	return $.ajax(settings)
		.done(function(response, textStatus, jqXHR) {
			//console.log(response)
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/auth/refresh)');
				} else if (response.status === '500') {
					if (response.reason.includes('Failed to resolve')) {
						logError('Central Server Error (500): Failed to resolve DNS for Central (/auth/refresh)');
						showNotification('ca-globe', 'Unable to resolve hostname for Central (DNS issue)', 'top', 'center', 'danger');
					} else logError('Central Server Error (500): ' + response.reason + ' (/auth/refresh)');
				}
				return;
			}
			if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description.replace('refresh_token', 'Refresh Token'),
					icon: 'error',
				});
			} else {
				document.getElementById('access_token').value = response.access_token;
				document.getElementById('refresh_token').value = response.refresh_token;
				
				var nowDatestamp = Date.now();
				nowDatestamp = nowDatestamp + (response.expires_in*1000)
				document.getElementById('expires_at').value = nowDatestamp;
				document.getElementById('expires_at').name = nowDatestamp;
				
				showNotification('ca-padlock', '"' + $('#account_name').val() + '" Authenticated with Central', 'bottom', 'center', 'success');
				saveAccount();
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error: '+ errorThrown);
			
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText.replace('refresh_token', 'Refresh Token'), 'top', 'center', 'danger');
				
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'top', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}

function exportSettings() {
	var exportData = {};
	exportData['account_details'] = localStorage.getItem('account_details');
	exportData['reveal_secrets'] = localStorage.getItem('reveal_secrets');
	exportData['ap_naming_format'] = localStorage.getItem('ap_naming_format');
	exportData['hostname_variable'] = localStorage.getItem('hostname_variable');
	exportData['port_variable_format'] = localStorage.getItem('port_variable_format');
	console.log(localStorage.getItem('refresh_rate'))
	exportData['refresh_rate'] = localStorage.getItem('refresh_rate');
	exportData['qr_color'] = localStorage.getItem('qr_color');
	exportData['qr_logo'] = localStorage.getItem('qr_logo');
	exportData['load_clients'] = localStorage.getItem('load_clients');
	exportData['load_clients_wired'] = localStorage.getItem('load_clients_wired');
	exportData['load_aps'] = localStorage.getItem('load_aps');
	exportData['load_switches'] = localStorage.getItem('load_switches');
	exportData['load_gateways'] = localStorage.getItem('load_gateways');
	exportData['load_gateway_details'] = localStorage.getItem('load_gateway_details');
	exportData['load_group_properties'] = localStorage.getItem('load_group_properties');
	exportData['load_airmatch_events'] = localStorage.getItem('load_airmatch_events');
	exportData['load_vc_config'] = localStorage.getItem('load_vc_config');
	
	//console.log(exportData)
	
	var exportBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'text/plain' });
	var exportURL = window.URL.createObjectURL(exportBlob);
	var exportLink = document.createElement('a');
	exportLink.href = exportURL;
	exportLink.setAttribute('download', 'cas-settings.json');
	exportLink.click();
	window.URL.revokeObjectURL(exportLink);
}

function importSettings() {

	Swal.fire({
		title: 'Are you sure?',
		text: 'Importing settings will overwrite the current settings with those in the selected file.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, import it!',
	}).then(result => {
		if (result.isConfirmed) {
			importConfirmed();
		}
	});
}
	
function importConfirmed() {
	var files = document.getElementById('import').files;
	console.log(files);
	if (files.length <= 0) {
		showNotification('ca-migration', 'Please select a backup file', 'bottom', 'center', 'danger');
		return false;
	}
	
	var fr = new FileReader();
	fr.onload = function(e) { 
	var importData = JSON.parse(e.target.result);
		console.log(importData);
		if (importData['account_details']) {
			if (importData['account_details']) localStorage.setItem('account_details', importData['account_details']);
			if (importData['reveal_secrets']) localStorage.setItem('reveal_secrets', importData['reveal_secrets']);
			if (importData['ap_naming_format']) localStorage.setItem('ap_naming_format', importData['ap_naming_format']);
			else localStorage.setItem('ap_naming_format', '');
			if (importData['hostname_variable']) localStorage.setItem('hostname_variable', importData['hostname_variable']);
			else localStorage.setItem('hostname_variable', '');
			if (importData['port_variable_format']) localStorage.setItem('port_variable_format', importData['port_variable_format']);
			else localStorage.setItem('port_variable_format', '');
			if (importData['refresh_rate']) localStorage.setItem('refresh_rate', importData['refresh_rate']);
			else localStorage.setItem('refresh_rate', '');
			if (importData['qr_color']) localStorage.setItem('qr_color', importData['qr_color']);
			if (importData['qr_logo']) localStorage.setItem('qr_logo', importData['qr_logo']);
			else localStorage.setItem('qr_logo', '');
			if (importData['load_clients']) localStorage.setItem('load_clients', importData['load_clients']);
			if (importData['load_clients_wired']) localStorage.setItem('load_clients_wired', importData['load_clients_wired']);
			if (importData['load_devices']) localStorage.setItem('load_devices', importData['load_devices']);
			if (importData['load_aps']) localStorage.setItem('load_aps', importData['load_aps']);
			if (importData['load_switches']) localStorage.setItem('load_switches', importData['load_switches']);
			if (importData['load_gateways']) localStorage.setItem('load_gateways', importData['load_gateways']);
			if (importData['load_gateway_details']) localStorage.setItem('load_gateway_details', importData['load_gateway_details']);
			if (importData['load_group_properties']) localStorage.setItem('load_group_properties', importData['load_group_properties']);
			if (importData['load_airmatch_events']) localStorage.setItem('load_airmatch_events', importData['load_airmatch_events']);
			if (importData['load_vc_config']) localStorage.setItem('load_vc_config', importData['load_vc_config']);
			
			Swal.fire({
				title: 'Settings Import Successful!',
				text: 'Backup has been imported. Reload for changes to take effect',
				icon: 'success',
				confirmButtonText: 'Reload Now',
			}).then(result => {
				if (result.isConfirmed) {
					location.reload();
				}
			});
		} else {
			Swal.fire({
				title: 'Settings Import Failed',
				text: 'File does not seem to be a Central Automation Studio backup.',
				icon: 'error',
			});
		}
		
	}
	fr.readAsText(files.item(0));
}
