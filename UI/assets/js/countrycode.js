/*
Central Automation v1.7
Updated: 1.28
© Aaron Scott (WiFi Downunder) 2021-2024
*/

var selectedGroups = {};
var selectedSites = {};
var selectedClusters = {};
var selectedDevices = {};
var groupInfo = {};
var siteInfo = {};
var clusterInfo = {};
var deviceInfo = {};
var countryPromise;
var sitePromise;

var siteCountries = {};

var swarmCounter = 0;
var swarmTotal = 0;
var clusterCounter = 0;
var clusterTotal = 0;
var deviceCounter = 0;
var deviceTotal = 0;
var countryCounter = 0;
var countryTotal = 0;
var siteCounter = 0;
var siteTotal = 0;

var currentVariables = {};

var progressNotification;
var countryCodeNotification;

var countryCodes = {
	Andorra: { code: 'AD', label: 'AD - Andorra' },
	'United Arab Emirates': { code: 'AE', label: 'AE - United Arab Emirates' },
	Afghanistan: { code: 'AF', label: 'AF - Afghanistan' },
	'Antigua and Barbuda': { code: 'AG', label: 'AG - Antigua and Barbuda' },
	Albania: { code: 'AL', label: 'AL - Albania' },
	Armenia: { code: 'AM', label: 'AM - Armenia' },
	Angola: { code: 'AO', label: 'AO - Angola' },
	Argentina: { code: 'AR', label: 'AR - Argentina' },
	'American Samoa': { code: 'AS', label: 'AS - American Samoa' },
	Austria: { code: 'AT', label: 'AT - Austria' },
	Australia: { code: 'AU', label: 'AU - Australia' },
	'Aland Islands': { code: 'AX', label: 'AX - Aland Islands' },
	Azerbaijan: { code: 'AZ', label: 'AZ - Azerbaijan' },
	'Bosnia and Herzegovina': { code: 'BA', label: 'BA - Bosnia and Herzegovina' },
	Barbados: { code: 'BB', label: 'BB - Barbados' },
	Bangladesh: { code: 'BD', label: 'BD - Bangladesh' },
	Belgium: { code: 'BE', label: 'BE - Belgium' },
	Bulgaria: { code: 'BG', label: 'BG - Bulgaria' },
	Bahrain: { code: 'BH', label: 'BH - Bahrain' },
	'Saint Barthelemy': { code: 'BL', label: 'BL - Saint Barthelemy' },
	Bermuda: { code: 'BM', label: 'BM - Bermuda' },
	'Brunei Darussalam': { code: 'BN', label: 'BN - Brunei Darussalam' },
	Bolivia: { code: 'BO', label: 'BO - Bolivia' },
	Brazil: { code: 'BR', label: 'BR - Brazil' },
	Bahamas: { code: 'BS', label: 'BS - Bahamas' },
	Botswana: { code: 'BW', label: 'BW - Botswana' },
	Belarus: { code: 'BY', label: 'BY - Belarus' },
	Belize: { code: 'BZ', label: 'BZ - Belize' },
	Canada: { code: 'CA', label: 'CA - Canada' },
	Switzerland: { code: 'CH', label: 'CH - Switzerland' },
	"Cote D'Ivoire": { code: 'CI', label: "CI - Cote D'Ivoire" },
	Chile: { code: 'CL', label: 'CL - Chile' },
	Cameroon: { code: 'CM', label: 'CM - Cameroon' },
	China: { code: 'CN', label: 'CN - China' },
	Colombia: { code: 'CO', label: 'CO - Colombia' },
	'Costa Rica': { code: 'CR', label: 'CR - Costa Rica' },
	Curacao: { code: 'CW', label: 'CW - Curacao' },
	Cyprus: { code: 'CY', label: 'CY - Cyprus' },
	'Czech Republic': { code: 'CZ', label: 'CZ - Czech Republic' },
	Germany: { code: 'DE', label: 'DE - Germany' },
	Denmark: { code: 'DK', label: 'DK - Denmark' },
	'Dominican Republic': { code: 'DO', label: 'DO - Dominican Republic' },
	Algeria: { code: 'DZ', label: 'DZ - Algeria' },
	Ecuador: { code: 'EC', label: 'EC - Ecuador' },
	Estonia: { code: 'EE', label: 'EE - Estonia' },
	Egypt: { code: 'EG', label: 'EG - Egypt' },
	Spain: { code: 'ES', label: 'ES - Spain' },
	Ethiopia: { code: 'ET', label: 'ET - Ethiopia' },
	Finland: { code: 'FI', label: 'FI - Finland' },
	'Federated States of Micronesia': { code: 'FM', label: 'FM - Federated States of Micronesia' },
	'Faroe Islands': { code: 'FO', label: 'FO - Faroe Islands' },
	France: { code: 'FR', label: 'FR - France' },
	'United Kingdom': { code: 'GB', label: 'GB - United Kingdom' },
	Grenada: { code: 'GD', label: 'GD - Grenada' },
	Grenada: { code: 'GE', label: 'GE - Georgia' },
	'French Guiana': { code: 'GF', label: 'GF - French Guiana' },
	Guernsey: { code: 'GG', label: 'GG - Guernsey' },
	Ghana: { code: 'GH', label: 'GH - Ghana' },
	Greenland: { code: 'GL', label: 'GL - Greenland' },
	Guadeloupe: { code: 'GP', label: 'GP - Guadeloupe' },
	Greece: { code: 'GR', label: 'GR - Greece' },
	Guatemala: { code: 'GT', label: 'GT - Guatemala' },
	Guam: { code: 'GU', label: 'GU - Guam' },
	Guyana: { code: 'GY', label: 'GY - Guyana' },
	'Hong Kong': { code: 'HK', label: 'HK - Hong Kong' },
	Honduras: { code: 'HN', label: 'HN - Honduras' },
	Croatia: { code: 'HR', label: 'HR - Croatia' },
	Haiti: { code: 'HT', label: 'HT - Haiti' },
	Hungary: { code: 'HU', label: 'HU - Hungary' },
	Indonesia: { code: 'ID', label: 'ID - Indonesia' },
	Ireland: { code: 'IE', label: 'IE - Ireland' },
	Israel: { code: 'IL', label: 'IL - Israel' },
	'Isle of Man': { code: 'IM', label: 'IM - Isle of Man' },
	India: { code: 'IN', label: 'IN - India' },
	Iraq: { code: 'IQ', label: 'IQ - Iraq' },
	Iceland: { code: 'IS', label: 'IS - Iceland' },
	Italy: { code: 'IT', label: 'IT - Italy' },
	Jersey: { code: 'JE', label: 'JE - Jersey' },
	Jamaica: { code: 'JM', label: 'JM - Jamaica' },
	Jordan: { code: 'JO', label: 'JO - Jordan' },
	Japan: { code: 'JP3', label: 'JP3 - Japan' },
	Kenya: { code: 'KE', label: 'KE - Kenya' },
	'Saint Kitts and Nevis': { code: 'KN', label: 'KN - Saint Kitts and Nevis' },
	'Republic of Korea (South Korea)': { code: 'KR', label: 'KR - Republic of Korea (South Korea)' },
	Kuwait: { code: 'KW', label: 'KW - Kuwait' },
	'Cayman Islands': { code: 'KY', label: 'KY - Cayman Islands' },
	Kazakhstan: { code: 'KZ', label: 'KZ - Kazakhstan' },
	"Lao People's Democratic Republic": { code: 'LA', label: "LA - Lao People's Democratic Republic" },
	Lebanon: { code: 'LB', label: 'LB - Lebanon' },
	'Saint Lucia': { code: 'LC', label: 'LC - Saint Lucia' },
	Liechtenstein: { code: 'LI', label: 'LI - Liechtenstein' },
	'Sri Lanka': { code: 'LK', label: 'LK - Sri Lanka' },
	Lithuania: { code: 'LT', label: 'LT - Lithuania' },
	Luxembourg: { code: 'LU', label: 'LU - Luxembourg' },
	Latvia: { code: 'LV', label: 'LV - Latvia' },
	Libya: { code: 'LY', label: 'LY - Libya' },
	Morocco: { code: 'MA', label: 'MA - Morocco' },
	'Maritime Forward Operating Base': { code: 'MB', label: 'MB - Maritime Forward Operating Base' },
	Monaco: { code: 'MC', label: 'MC - Monaco' },
	Moldova: { code: 'MD', label: 'MD - Moldova' },
	Montenegro: { code: 'ME', label: 'ME - Montenegro' },
	'Saint Martin': { code: 'MF', label: 'MF - Saint Martin' },
	'Marshall Islands': { code: 'MH', label: 'MH - Marshall Islands' },
	'Maritime Offshore': { code: 'MI', label: 'MI - Maritime Offshore' },
	Macedonia: { code: 'MK', label: 'MK - Macedonia' },
	Myanmar: { code: 'MM', label: 'MM - Myanmar' },
	Myanmar: { code: 'MO', label: 'MO - Macau' },
	'Northern Mariana Islands': { code: 'MP', label: 'MP - Northern Mariana Islands' },
	Martinique: { code: 'MQ', label: 'MQ - Martinique' },
	Mauritania: { code: 'MR', label: 'MR - Mauritania' },
	Malta: { code: 'MT', label: 'MT - Malta' },
	Mauritius: { code: 'MU', label: 'MU - Mauritius' },
	Maldives: { code: 'MV', label: 'MV - Maldives' },
	Malawi: { code: 'MW', label: 'MW - Malawi' },
	Mexico: { code: 'MX', label: 'MX - Mexico' },
	Malaysia: { code: 'MY', label: 'MY - Malaysia' },
	Mozambique: { code: 'MZ', label: 'MZ - Mozambique' },
	Mozambique: { code: 'NA', label: 'NA - Namibia' },
	'New Caledonia': { code: 'NC', label: 'NC - New Caledonia' },
	Nigeria: { code: 'NG', label: 'NG - Nigeria' },
	Nicaragua: { code: 'NI', label: 'NI - Nicaragua' },
	Netherlands: { code: 'NL', label: 'NL - Netherlands' },
	Norway: { code: 'NO', label: 'NO - Norway' },
	Nepal: { code: 'NP', label: 'NP - Nepal' },
	'New Zealand': { code: 'NZ', label: 'NZ - New Zealand' },
	Oman: { code: 'OM', label: 'OM - Oman' },
	Panama: { code: 'PA', label: 'PA - Panama' },
	Peru: { code: 'PE', label: 'PE - Peru' },
	'French Polynesia': { code: 'PF', label: 'PF - French Polynesia' },
	'Papua New Guinea': { code: 'PG', label: 'PG - Papua New Guinea' },
	Philippines: { code: 'PH', label: 'PH - Philippines' },
	'Islamic Republic of Pakistan': { code: 'PK', label: 'PK - Islamic Republic of Pakistan' },
	Poland: { code: 'PL', label: 'PL - Poland' },
	'Saint Pierre and Miquelon': { code: 'PM', label: 'PM - Saint Pierre and Miquelon' },
	'Puerto Rico': { code: 'PR', label: 'PR - Puerto Rico' },
	Portugal: { code: 'PT', label: 'PT - Portugal' },
	Paraguay: { code: 'PY', label: 'PY - Paraguay' },
	Qatar: { code: 'QA', label: 'QA - Qatar' },
	Reunion: { code: 'RE', label: 'RE - Reunion' },
	Romania: { code: 'RO', label: 'RO - Romania' },
	Serbia: { code: 'RS', label: 'RS - Serbia' },
	Russia: { code: 'RU', label: 'RU - Russia' },
	Rwanda: { code: 'RW', label: 'RW - Rwanda' },
	'Saudi Arabia': { code: 'SA', label: 'SA - Saudi Arabia' },
	Sweden: { code: 'SE', label: 'SE - Sweden' },
	Singapore: { code: 'SG', label: 'SG - Singapore' },
	Slovenia: { code: 'SI', label: 'SI - Slovenia' },
	'Svalbard and Jan Mayen': { code: 'SJ', label: 'SJ - Svalbard and Jan Mayen' },
	'Slovak Republic': { code: 'SK', label: 'SK - Slovak Republic' },
	'San Marino': { code: 'SM', label: 'SM - San Marino' },
	Senegal: { code: 'SN', label: 'SN - Senegal' },
	Suriname: { code: 'SR', label: 'SR - Suriname' },
	'El Salvador': { code: 'SV', label: 'SV - El Salvador' },
	'Sint Maarten': { code: 'SX', label: 'SX - Sint Maarten' },
	'Turks And Caicos Islands': { code: 'TC', label: 'TC - Turks And Caicos Islands' },
	'French Southern Territories': { code: 'TF', label: 'TF - French Southern Territories' },
	Thailand: { code: 'TH', label: 'TH - Thailand' },
	Tajikistan: { code: 'TJ', label: 'TJ - Tajikistan' },
	Turkmenistan: { code: 'TM', label: 'TM - Turkmenistan' },
	Tunisia: { code: 'TN', label: 'TN - Tunisia' },
	Turkey: { code: 'TR', label: 'TR - Turkey' },
	'Trinidad and Tobago': { code: 'TT', label: 'TT - Trinidad and Tobago' },
	Taiwan: { code: 'TW', label: 'TW - Taiwan' },
	Tanzania: { code: 'TZ', label: 'TZ - Tanzania' },
	Ukraine: { code: 'UA', label: 'UA - Ukraine' },
	Uganda: { code: 'UG', label: 'UG - Uganda' },
	'United States': { code: 'US', label: 'US - United States' },
	Uruguay: { code: 'UY', label: 'UY - Uruguay' },
	Uzbekistan: { code: 'UZ', label: 'UZ - Uzbekistan' },
	'Vatican City': { code: 'VA', label: 'VA - Vatican City' },
	'Saint Vincent and the Grenadines': { code: 'VC', label: 'VC - Saint Vincent and the Grenadines' },
	Venezuela: { code: 'VE', label: 'VE - Venezuela' },
	'British Virgin Islands': { code: 'VG', label: 'VG - British Virgin Islands' },
	'US Virgin Islands': { code: 'VI', label: 'VI - US Virgin Islands' },
	Vietnam: { code: 'VN', label: 'VN - Vietnam' },
	'Wallis and Futuna': { code: 'WF', label: 'WF - Wallis and Futuna' },
	Kosovo: { code: 'XK', label: 'XK - Kosovo' },
	Mayotte: { code: 'YT', label: 'YT - Mayotte' },
	'South Africa': { code: 'ZA', label: 'ZA - South Africa' },
	Zambia: { code: 'ZM', label: 'ZM - Zambia' },
	Zimbabwe: { code: 'ZW', label: 'ZW - Zimbabwe' },
};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Global functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCountryCodes() {
	for (const [key, value] of Object.entries(countryCodes)) {
		$('#group-countryselector').append($('<option>', { value: value.code, text: value.label }));
		$('#site-countryselector').append($('<option>', { value: value.code, text: value.label }));
		$('#cluster-countryselector').append($('<option>', { value: value.code, text: value.label }));
		$('#device-countryselector').append($('<option>', { value: value.code, text: value.label }));
	}

	if ($('#group-countryselector').length != 0) {
		$('#group-countryselector').selectpicker('refresh');
		$('#site-countryselector').selectpicker('refresh');
		$('#cluster-countryselector').selectpicker('refresh');
		$('#device-countryselector').selectpicker('refresh');
	}
}

function loadCurrentPageAP() {
	getDevices();
}

function getDevices() {
	selectedClusters = {};
	selectedSites = {};

	var fullAPList = getAPs();
	clusterInfo = {};
	siteInfo = {};
	$.each(fullAPList, function() {
		var swarmID = this['swarm_id'];
		var siteName = this['site'];

		if (siteName && !siteInfo[siteName]) {
			var siteStructure = { swarms: [], aps: [] };
			siteInfo[siteName] = siteStructure;
		}

		// If this AP is in a swarm/cluster
		if (swarmID) {
			// Check if this swarm has been seen before
			if (!clusterInfo[swarmID]) {
				clusterInfo[swarmID] = [];
			}

			// Add serial to the list that matches the swarm_id.
			var devices = clusterInfo[swarmID];
			devices.push(this);
			clusterInfo[swarmID] = devices;

			if (siteName) {
				// Check if this swarm has been seen before
				// Add serial to the list that matches the swarm_id.
				var swarms = siteInfo[siteName].swarms;
				if (swarms.indexOf(swarmID) == -1) {
					swarms.push(swarmID);
					siteInfo[siteName].swarms = swarms;
				}
			}
		} else {
			// AOS10 AP
			if (siteName) {
				// Check if this swarm has been seen before

				// Add serial to the list that matches the swarm_id.
				var siteAPs = siteInfo[siteName].aps;
				siteAPs.push(this);
				siteInfo[siteName].aps = siteAPs;
			}
		}
		// Add the device for the APs list
		deviceInfo[this['serial']] = this;
	});

	loadSiteTable(false);
	loadClusterTable(false);
	loadDevicesTable(false);
}

function loadCurrentPageGroup() {
	selectedGroups = {};

	var fullAPList = getAPs();
	groupInfo = {};
	$.each(fullAPList, function() {
		var groupName = this['group_name'];

		// If this AP is in a swarm/cluster
		if (groupName) {
			// Check if this swarm has been seen before
			if (!groupInfo[groupName]) {
				groupInfo[groupName] = [];
			}

			// Add serial to the list that matches the swarm_id.
			var devices = groupInfo[groupName];
			devices.push(this);
			groupInfo[groupName] = devices;
		}
	});

	// Add any empty groups
	var fullGroupList = getGroups();
	$.each(fullGroupList, function() {
		var groupName = this['group_name'];
		if (groupName) {
			if (!groupInfo[groupName]) {
				groupInfo[groupName] = [];
			}
		}
	});

	loadGroupTable(false);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Swarm update function
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function configureSwarm(swarmID, countryCode) {
	var swarmPromise = new $.Deferred();

	// for each VC
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/iap_variables/' + swarmID,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/iap_variables/<SWARM-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var currentVariables = response.variables[0];
		if (currentVariables.country === countryCode) {
			// No need to update the country code
			logInformation('Country for Virtual Controller "' + currentVariables.name + '" does not need updating.');
			clusterCounter++;
			if (clusterCounter >= clusterTotal) {
				swarmPromise.resolve();
			}
		} else {
			// Create the updated JSON
			currentVariables.country = countryCode;
			var variablesArray = [];
			variablesArray.push(currentVariables);
			var uploadData = { variables: variablesArray };

			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/iap_variables/' + currentVariables.guid,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify(uploadData),
				}),
			};

			$.ajax(settings).done(function(response, statusText, xhr) {
				if (response === currentVariables.guid) {
					// success
					logInformation('Country for Virtual Controller "' + currentVariables.name + '" was configured to ' + countryCode);
				} else {
					apiErrorCount++;
					logError('Country for Virtual Controller "' + currentVariables.name + '" failed to be configured configured to ' + countryCode);
				}
				clusterCounter++;
				if (clusterCounter >= clusterTotal) swarmPromise.resolve();
			});
		}
	});
	return swarmPromise.promise();
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
	$('#country-cluster-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(clusterInfo)) {
		var deviceList = value;

		// Build checkbox using swarm_id as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedClusters(\'' + key + '\')" checked>';

		// Add VC Cluster to table
		var table = $('#country-cluster-table').DataTable();
		table.row.add([key, checkBoxString, '<strong>' + deviceList[0]['swarm_name'] + '</strong>', deviceList.length, deviceList[0]['group_name'], deviceList[0]['site'], deviceList[0]['firmware_version']]);
	}
	$('#country-cluster-table')
		.DataTable()
		.rows()
		.draw();
	$('[data-toggle="tooltip"]').tooltip();
}

function configureSelectedClusters() {
	// setup counters for messaging
	clusterCounter = 0;
	clusterTotal = 0;
	apiErrorCount = 0;

	// UI Sanity Checks
	var select = document.getElementById('cluster-countryselector');
	var countryCode = select.value;
	if (!countryCode) {
		showNotification('ca-networking', 'Please select a Country from the dropdown', 'bottom', 'center', 'warning');
		return;
	}

	if (Object.keys(selectedClusters).length <= 0) {
		showNotification('ca-networking', 'Please select one or more Virtual Controllers from the table', 'bottom', 'center', 'warning');
		return;
	} else {
		clusterTotal = Object.keys(selectedClusters).length;
	}

	logStart('Configuring Selected Clusters...');
	// Update each selected cluster
	for (const [key, value] of Object.entries(selectedClusters)) {
		// for each VC
		$.when(configureSwarm(key, countryCode)).then(function() {
			checkClusterUpdateDone();
		});
	}
}

function checkClusterUpdateDone() {
	if (clusterCounter >= clusterTotal) {
		if (apiErrorCount != 0) {
			showLog();
			Swal.fire({
				title: 'Country Codes Assignment Failure',
				text: 'Some or all Virtual Controllers failed to be configured',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Country Codes Assignment Success',
				text: 'All Virtual Controllers were configured',
				icon: 'success',
			});
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Device update function
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function configureDevice(deviceID, countryCode) {
	var devicePromise = new $.Deferred(); // promise to ensure variables aren't changed by the following device (wait until each device is done)

	var currentDevice = findDeviceInMonitoring(deviceID);

	// for each VC
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/iap_variables/' + deviceID,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/iap_variables/<DEVICE-SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var currentVariables = response.variables[0];
		if (currentVariables.country === countryCode) {
			// No need to update the country code
			logInformation('Country for AP "' + currentDevice.name + '" does not need updating.');
			deviceCounter++;
			devicePromise.resolve();
		} else {
			// Create the updated JSON
			currentVariables.country = countryCode;
			var variablesArray = [];
			variablesArray.push(currentVariables);
			var uploadData = { variables: variablesArray };

			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/iap_variables/' + deviceID,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify(uploadData),
				}),
			};

			$.ajax(settings).done(function(response, statusText, xhr) {
				if (response === deviceID) {
					// success
					logInformation('Country for AP "' + currentDevice.name + '" was configured to ' + countryCode);
				} else {
					apiErrorCount++;
					logError('Country for AP "' + currentDevice.name + '" failed to be configured configured to ' + countryCode);
				}
				deviceCounter++;
				devicePromise.resolve();
			});
		}
	});
	return devicePromise.promise();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Device functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedDevices(serial) {
	var rowSelected = document.getElementById(serial).checked;
	if (!rowSelected) document.getElementById('device-select-all').checked = false;

	if (selectedDevices[serial] && !rowSelected) delete selectedDevices[serial];
	else selectedDevices[serial] = serial;
}

function selectAllDevices() {
	var checkBoxChecked = false;
	if (Object.keys(selectedDevices).length < Object.keys(deviceInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(deviceInfo)) {
			if (!selectedDevices[key]) selectedDevices[key] = key;
		}
	} else {
		selectedDevices = {};
	}

	loadDevicesTable(checkBoxChecked);
}

function loadDevicesTable(checked) {
	$('#country-device-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(deviceInfo)) {
		var device = value;
		if (device['firmware_version'].startsWith('10.')) {
			// Build checkbox using serial number as key/id
			var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')">';
			if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedDevices(\'' + key + '\')" checked>';

			// Build Status dot
			var status = '<i class="fa-solid fa-circle text-danger"></i>';
			if (device['status'] == 'Up') {
				status = '<i class="fa-solid fa-circle text-success"></i>';
			}

			// Add VC Cluster to table
			var table = $('#country-device-table').DataTable();
			table.row.add([checkBoxString, '<strong>' + device['name'] + '</strong>', status, device['serial'], device['macaddr'], device['group_name'], device['site'], device['firmware_version']]);
		}
	}
	$('#country-device-table')
		.DataTable()
		.rows()
		.draw();
}

function configureSelectedDevices() {
	// setup counters for messaging
	deviceCounter = 0;
	deviceTotal = 0;
	apiErrorCount = 0;

	siteTotal = 0;

	// UI Sanity Checks
	var select = document.getElementById('device-countryselector');
	var countryCode = select.value;
	if (!countryCode) {
		showNotification('ca-networking', 'Please select a Country from the dropdown', 'bottom', 'center', 'warning');
		return;
	}

	if (Object.keys(selectedDevices).length <= 0) {
		showNotification('ca-router', 'Please select one or more APs from the table', 'bottom', 'center', 'warning');
		return;
	} else {
		deviceTotal = Object.keys(selectedDevices).length;
	}

	// Update each selected AP
	logStart('Configuring Selected APs...');
	progressNotification = showProgressNotification('ca-world', 'Configuring APs...', 'bottom', 'center', 'info');
	for (const [key, value] of Object.entries(selectedDevices)) {
		// for each AP
		$.when(configureDevice(key, countryCode)).then(function() {
			checkDeviceUpdateDone();
		});
	}
}

function configureSelectedDevicesUsingSite() {
	// setup counters for messaging
	deviceCounter = 0;
	deviceTotal = 0;
	apiErrorCount = 0;

	siteTotal = 0;

	// UI Sanity Checks
	if (Object.keys(selectedDevices).length <= 0) {
		showNotification('ca-router', 'Please select one or more APs from the table', 'bottom', 'center', 'warning');
		return;
	} else {
		deviceTotal = Object.keys(selectedDevices).length;
	}

	logStart('Configuring Selected APs using Site Address...');
	// Get the country codes for the sites for the selected APs
	countryCodeNotification = showNotification('ca-square-pin', 'Obtaining Site Country Codes...', 'bottom', 'center', 'info');
	countryPromise = new $.Deferred();
	$.when(getAllCountryCodesForSelectedDevices()).then(function() {
		countryCodeNotification.close();
		var delayCounter = 0;
		progressNotification = showProgressNotification('ca-world', 'Configuring APs...', 'bottom', 'center', 'info');
		for (const [key, value] of Object.entries(selectedDevices)) {
			var currentDevice = findDeviceInMonitoring(key);
			siteDetails = siteCountries[currentDevice.site];
			//console.log(siteDetails);
			$.when(configureDevice(key, siteDetails.country)).then(function() {
				checkDeviceUpdateDone();
			});
		}
	});
}

function checkDeviceUpdateDone() {
	var progress = (deviceCounter / deviceTotal) * 100;
	progressNotification.update({ progress: progress });

	if (deviceCounter >= deviceTotal) {
		progressNotification.close();
		if (siteTotal == 0) {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Country Codes Assignment Failure',
					text: 'Some or all of the selected APs failed to be configured',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Country Codes Assignment Success',
					text: 'All the selected APs were configured',
					icon: 'success',
				});
			}
		} else {
			sitePromise.resolve();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Site functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedSites(siteName) {
	var rowSelected = document.getElementById(siteName).checked;
	if (!rowSelected) document.getElementById('site-select-all').checked = false;

	if (selectedSites[siteName] && !rowSelected) delete selectedSites[siteName];
	else selectedSites[siteName] = siteName;
}

function selectAllSites() {
	var checkBoxChecked = false;
	if (Object.keys(selectedSites).length < Object.keys(siteInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(siteInfo)) {
			if (!selectedSites[key]) selectedSites[key] = key;
		}
	} else {
		selectedSites = {};
	}

	loadSiteTable(checkBoxChecked);
}

function loadSiteTable(checked) {
	$('#country-site-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(siteInfo)) {
		var site = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedSites(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedSites(\'' + key + '\')" checked>';

		if (site.swarms.length > 0) {
			// Site has Virtual Controllers (item is a swarmID)
			// Get AP Counts
			var apCount = 0;
			$.each(site.swarms, function() {
				apCount += clusterInfo[this].length;
			});

			// Add VC Cluster to table
			var table = $('#country-site-table').DataTable();
			table.row.add([key, checkBoxString, '<strong>' + key + '</strong>', site.swarms.length, apCount]);
		} else {
			// Site is AOS10 - list of APs not swarmID
			var table = $('#country-site-table').DataTable();
			table.row.add([key, checkBoxString, '<strong>' + key + '</strong>', '-', site.aps.length]);
		}
	}
	$('#country-site-table')
		.DataTable()
		.rows()
		.draw();
}

async function configureSelectedSites() {
	// setup counters for messaging
	clusterCounter = 0;
	clusterTotal = 0;
	apiErrorCount = 0;

	// UI Sanity Checks
	if (Object.keys(selectedSites).length <= 0) {
		showNotification('ca-world-pin', 'Please select one or more Sites from the table', 'bottom', 'center', 'warning');
		return;
	}

	logStart('Configuring Selected Sites...');
	siteTotal = Object.entries(selectedSites).length;
	siteCounter = 0;
	// for each site get each VC out of selectedSites
	for (const [key, value] of Object.entries(selectedSites)) {
		var currentSite = key;
		var siteClusters = siteInfo[key].swarms;
		clusterTotal += siteClusters.length;

		// wait for each site to be updated (stops subsequent site/cluster from overriding variable)
		await $.when(configureSite(currentSite)).then(function() {
			siteCounter++;
			checkSiteUpdateDone();
		});
	}
}

function configureSite(siteName) {
	sitePromise = new $.Deferred();

	// Get the site list
	var allSites = getSites();
	var siteClusters = siteInfo[siteName].swarms;
	var siteAPs = siteInfo[siteName].aps;

	var siteID;
	// find Site ID...
	$.each(allSites, function() {
		if (this.name === siteName.toString()) {
			// found the site name so can get the site ID.
			siteID = this.id;
			return false;
		}
	});

	// get the site details to get the country (used to find the country code)
	console.log('Getting country code for ' + siteName);
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/central/v2/sites/<SITE-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var countryCode = countryCodes[response.country].code;

		// If there are 8.x VCs - set at the VC level
		if (siteClusters && siteClusters.length > 0) {
			var siteClusterCounter = 0;
			progressNotification = showProgressNotification('ca-world', 'Configuring Virtual Contollers at ' + siteName, 'bottom', 'center', 'info');

			$.each(siteClusters, function() {
				// wait for each swarm to be updated
				$.when(configureSwarm(this, countryCode)).then(function() {
					siteClusterCounter++;
					var progress = (siteClusterCounter / siteClusters.length) * 100;
					progressNotification.update({ progress: progress });

					if (siteClusterCounter >= siteClusters.length) {
						progressNotification.close();
						sitePromise.resolve();
					}
				});
			});

			// If there are 10.x APs at the site - set at the AP level
		} else if (siteAPs.length > 0) {
			deviceCounter = 0;
			deviceTotal = siteAPs.length;

			progressNotification = showProgressNotification('ca-world', 'Configuring APs at ' + siteName, 'bottom', 'center', 'info');

			$.each(siteAPs, function() {
				if (this['firmware_version'].startsWith('10.')) {
					console.log('Attempting to configure ' + this['serial'] + ' with Country Code: ' + countryCode);
					$.when(configureDevice(this['serial'], countryCode)).then(function() {
						checkDeviceUpdateDone();
					});
				} else {
					deviceCounter++;
					checkDeviceUpdateDone();
				}
			});
		} else {
			checkSiteUpdateDone();
			sitePromise.resolve();
		}
	});
	return sitePromise.promise();
}

function checkSiteUpdateDone() {
	if (siteCounter >= siteTotal) {
		if (apiErrorCount != 0) {
			showLog();
			Swal.fire({
				title: 'Country Codes Assignment Failure',
				text: 'Some or all Virtual Controllers/APs at the selected sites failed to be configured',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Country Codes Assignment Success',
				text: 'All Virtual Controllers/APs at the selected sites were configured',
				icon: 'success',
			});
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateSelectedGroups(groupName) {
	var rowSelected = document.getElementById(groupName).checked;
	if (!rowSelected) document.getElementById('group-select-all').checked = false;

	if (selectedGroups[groupName] && !rowSelected) delete selectedGroups[groupName];
	else selectedGroups[groupName] = groupName;
}

function selectAllGroups() {
	var checkBoxChecked = false;
	if (Object.keys(selectedGroups).length < Object.keys(groupInfo).length) {
		checkBoxChecked = true;
		for (const [key, value] of Object.entries(groupInfo)) {
			if (!selectedGroups[key]) selectedGroups[key] = key;
		}
	} else {
		selectedGroups = {};
	}

	loadSiteTable(checkBoxChecked);
}

function loadGroupTable(checked) {
	$('#country-group-table')
		.DataTable()
		.rows()
		.remove();
	for (const [key, value] of Object.entries(groupInfo)) {
		var group = value;

		// Build checkbox using serial number as key/id
		var checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedGroups(\'' + key + '\')">';
		if (checked) checkBoxString = '<input class="" type="checkbox" id="' + key + '" onclick="updateSelectedGroups(\'' + key + '\')" checked>';

		// Add VC Cluster to table
		var table = $('#country-group-table').DataTable();
		table.row.add([key, checkBoxString, '<strong>' + key + '</strong>', value.length]);
	}
	$('#country-group-table')
		.DataTable()
		.rows()
		.draw();
}

function configureSelectedGroups() {
	// setup counters for messaging
	clusterCounter = 0;
	clusterTotal = 0;
	apiErrorCount = 0;

	// UI Sanity Check
	var select = document.getElementById('group-countryselector');
	var countryCode = select.value;
	if (!countryCode) {
		showNotification('ca-folder-settings', 'Please select a Country from the dropdown', 'bottom', 'center', 'warning');
		return;
	}

	if (Object.keys(selectedGroups).length <= 0) {
		showNotification('ca-folder-settings', 'Please select one or more Groups from the table', 'bottom', 'center', 'warning');
		return;
	} else {
		clusterTotal = Object.keys(selectedGroups).length;
	}

	logStart('Configuring Selected Groups...');
	// for each group
	var groupArray = [];
	for (const [key, value] of Object.entries(selectedGroups)) {
		groupArray.push(key);
	}

	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/country',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ groups: groupArray, country: countryCode }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/country)');
			}
		}

		if (response === 'Success') {
			logInformation('Country Code for selected groups was updated to ' + countryCode);

			Swal.fire({
				title: 'Country Codes Assignment Success',
				text: 'All Groups were configured',
				icon: 'success',
			});
		} else {
			Swal.fire({
				title: 'Country Codes Assignment Failure',
				text: 'Some or all Groups failed to be configured',
				icon: 'error',
			});
		}
	});
}

/* Site Country Code */
function getAllCountryCodesForSelectedDevices() {
	countryCounter = 0;
	countryTotal = Object.entries(selectedDevices).length;
	for (const [key, value] of Object.entries(selectedDevices)) {
		var currentDevice = findDeviceInMonitoring(key);
		if (!siteCountries[currentDevice.site]) {
			siteCountries[currentDevice.site] = {};
			getCountryCodeForSite(currentDevice.site);
		} else {
			// either already have the country code - or are in the process of getting it for another AP.
			countryCounter++;
			if (countryCounter >= countryTotal) {
				countryPromise.resolve();
			}
		}
	}
	return countryPromise.promise();
}

function getCountryCodeForSite(siteName) {
	console.log('Getting country code for ' + siteName);
	var siteID;

	// find Site ID...
	var allSites = getSites();
	$.each(allSites, function() {
		if (this.name === siteName.toString()) {
			// found the site name so can get the site ID.
			siteID = this.id;
			return false;
		}
	});

	// get the site details to get the country (used to find the country code)
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/central/v2/sites/<SITE-ID>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		// Grab country code and store it
		var countryCode = countryCodes[response.country].code;
		siteCountries[siteName] = { name: siteName, id: siteID, country: countryCode };
		//console.log(siteCountries[siteName]);

		countryCounter++;
		if (countryCounter >= countryTotal) {
			countryPromise.resolve();
		}
	});
}
