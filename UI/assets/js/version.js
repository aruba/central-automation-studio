/*
Central Automation v1.x
Last Updated 1.42.6
Aaron Scott (WiFi Downunder) 2023-2024
*/

const CASVersion = "1.43.6";
function getCASVersion() {
	var versionP = document.getElementById('cas-version');
	if (versionP) versionP.innerHTML = 'Version: ' + CASVersion;
	
	var docsTitle = document.getElementById('docsTitle');
	if (docsTitle) docsTitle.innerHTML = 'Central Automation Studio v' + CASVersion;
}