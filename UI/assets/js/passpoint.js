/*
Central Automation v1.43.6
Updated: 
Aaron Scott (WiFi Downunder) 2021-2025
*/

var updateCounter = 0;
var errorCounter = 0;
var venuePrefix = 'venue-name ';
var totalAPCount = 0;

var configNotification;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateVenueName() {
	// for each site supplied...
	var timoutCounter = 0;
	updateCounter = 0;
	errorCounter = 0;
	totalAPCount = 0;
	
	configNotification = showProgressNotification('ca-shop-location', 'Setting Venue Name for Passpoint...', 'bottom', 'center', 'info');
	for (let i = 0; i < csvData.length; i++) {
	
		var csvRow = csvData[i];
		var siteAPs = getAPsForSite(csvRow['SITE']);
		
		$.each(siteAPs, function() {
			// for each AP in the siteAPs  set the setVenueNameForAP(suppliedVenue, apSerial)
			setTimeout(setVenueNameForAP, apiDelay*timoutCounter, csvRow['VENUE-NAME'], this['serial']);
			totalAPCount++;
			timoutCounter++;
		});
	}
}

function setVenueNameForAP(venueName, currentSerial) {
	// Get CLI config for AP
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status')) {
			if (commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
				return;
			}
		}
		if (commandResults.hasOwnProperty('error')) {
			if (commandResults.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						setVenueNameForAP(venueName, currentSerial);
					}
				});
			}
		}
		var response = JSON.parse(commandResults.responseBody);

		var apCLIResponse = response;
		// Modify the config response with new venue name
		if (apCLIResponse.length) {
			for (i = 0; i < apCLIResponse.length; i++) {
				var currentLine = apCLIResponse[i];
				if (currentLine.includes(venuePrefix)) {
					apCLIResponse[i] = '  '+ venuePrefix + '"'+venueName+'"';
					break;
				}
			}
			
			// need to push config back to Central.
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ clis: apCLIResponse }),
				}),
			};
			
			$.ajax(settings).done(function(response) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
						return;
					}
				}
				if (response) {
					failedAuth = false;
					if (response.reason && response.reason == 'Bad Gateway') {
						Swal.fire({
							title: 'API Issue',
							text: 'There is an issue communicating with the API Gateway',
							icon: 'warning',
						});
					} else if (response.code && response.code == 429) {
						console.log('errorCode');
						logError('WLAN config was not applied to AP ' + currentSerial);
						Swal.fire({
							title: 'API Limit Reached',
							text: 'You have reached your daily API limit. No more API calls will succeed today.',
							icon: 'warning',
						});
					} else if (response.description) {
						logError(response.description);
						errorCounter++;
					} else if (response !== '' + currentSerial) {
						logError('Venue name change was not applied to AP ' + currentSerial);
						errorCounter++;
					} else {
						logInformation(currentSerial + ' venue-name was changed to "'+ venueName + '"');
					}
					updateCounter++;
					checkForAirPassCompletion();
				}
			});
		} else {
			updateCounter++;
			checkForAirPassCompletion();
		}
	});
}

function checkForAirPassCompletion() {
	var airpassProgress = (updateCounter / totalAPCount) * 100;
	configNotification.update({ progress: airpassProgress });
	
	if (updateCounter >= totalAPCount) {
		if (errorCounter > 0) {
			if (configNotification) {
				configNotification.update({ type: 'danger', message: 'Failed to update Venue Name for all APs' });
				setTimeout(configNotification.close, 2000);
			}
		} else {
			Swal.fire({
				title: 'Airpass Configuration',
				text: 'Venue name was configured to the selected sites',
				icon: 'success',
			})
			if (configNotification) {
				configNotification.close();
			}
		}
	}
}

