/*
Central Automation v1.6.0
Updated: 1.8.2
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var centralCredentials = [];

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

/*function getCentralURLforClientID(client_id) {
	baseURL = '';

	var centralName;

	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) {
			apiURL = centralCredentials[i].base_url;
			console.log(apiURL);
			baseURL = centralURLs[0][apiURL];
		}
	}
	return baseURL;
}*/

function getAccessTokenforClientID(client_id) {
	accessToken = '';
	loadCentralVCredentials();
	for (i = 0; i < centralCredentials.length; i++) {
		if (centralCredentials[i].client_id === client_id) accessToken = centralCredentials[i].access_token;
	}
	return accessToken;
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
	document.getElementById('refresh_token').value = '';
	isCOPSelected();
	$('#AccountModalLink').trigger('click');
}

function saveAccount() {
	loadCentralVCredentials();
	// Save all supplied addresses and details to the array of accounts
	var currentAccount = checkForDuplicateAccount($('#client_id').val());

	if (currentAccount == -1) {
		centralCredentials.push({ account_name: $('#account_name').val(), central_id: $('#central_id').val(), client_id: $('#client_id').val(), client_secret: $('#client_secret').val(), base_url: document.getElementById('clusterselector').value, cop_address: $('#cop_address').val(), refresh_token: $('#refresh_token').val(), access_token: $('#access_token').val() });

		// save array to localStorage
		localStorage.setItem('account_details', JSON.stringify(centralCredentials));
	} else {
		//modify existing account
		centralCredentials[currentAccount] = { account_name: $('#account_name').val(), central_id: $('#central_id').val(), client_id: $('#client_id').val(), client_secret: $('#client_secret').val(), base_url: document.getElementById('clusterselector').value, cop_address: $('#cop_address').val(), refresh_token: $('#refresh_token').val(), access_token: $('#access_token').val() };
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
		var btnString = '<a href="#" class="btn btn-link btn-warning edit"><i class="fa fa-edit"></i></a><a href="#" class="btn btn-link btn-danger remove"><i class="fa fa-times"></i></a>';

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
		.done(function(response) {
			//console.log(response);
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/auth/refresh)');
					return;
				}
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
				showNotification('ca-padlock', '"' + $('#account_name').val() + '" Authenticated with Central', 'bottom', 'center', 'success');
				saveAccount();
			}
		})
		.fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText.replace('refresh_token', 'Refresh Token'), 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
		});
}
