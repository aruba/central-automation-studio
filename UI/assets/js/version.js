/*
Central Automation v1.x
Aaron Scott (WiFi Downunder) 2023-2025
*/

const CASVersion = "1.44.1";
function getCASVersion() {
	var versionP = document.getElementById('cas-version');
	if (versionP) versionP.innerHTML = 'Version: ' + CASVersion;
	
	var docsTitle = document.getElementById('docsTitle');
	if (docsTitle) docsTitle.innerHTML = 'Central Automation Studio v' + CASVersion;
}