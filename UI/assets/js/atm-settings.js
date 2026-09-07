/*
Central Automation v1.45.1
Updated: 
Aaron Scott (WiFi Downunder) 2021-2025
*/


/*  ----------------------------------------------------------------------------------
		Utility functions
	---------------------------------------------------------------------------------- */

function saveGlobalSettings() {
	// Save all the global settings (except for the accounts)
	localStorage.setItem('refresh_rate', $('#refresh_rate').val());
	localStorage.setItem('atm_timescale', document.getElementById('timescalePicker').value);
	localStorage.setItem('atm_rollingrate', $('#atm_rollingrate').val());
	localStorage.setItem('atm_rolling', document.getElementById('atm_rolling').checked);
	logInformation('ATM settings saved');
}

function goToChoices() {
	window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'choice.html';
}
