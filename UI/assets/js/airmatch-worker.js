/*
Central Automation v1.34
Updated: 1.47.8
Copyright Aaron Scott (WiFi Downunder) 2021-2025
*/

var aps = [];
var apsDict = {}
var radioDictionary = {};

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function generateRadioDictionary() {
	radioDictionary = {};
	
	for (const obj of aps) {
		for (const radio of obj.radios) {
			const radioMac = radio.macaddr.toUpperCase();
			radioDictionary[radioMac] = obj;
		}
	}
}

function findAPForRadio(radiomac) {
	return radioDictionary[radiomac.toUpperCase()];
}

/*  --------------------------------------------------
	Processing functions
-------------------------------------------------- */

// addEventListener can be accessed directly in the worker file - listen to messages from the main AirMatch process
addEventListener("message", e => {
	const optData = e.data;
	aps = optData.aps;
	generateRadioDictionary();
	processAPs();
	processOptimization(optData.opt, optData.vrf);
	close()
});

// Reconstruct the APs list in a dict for easier lookup
function processAPs() {
	for (var j=0;j<aps.length;j++) {
		var serial = aps[j]['serial'];
		apsDict[serial] = aps[j]
	}
}
 
function processOptimization(optSearchRadios, searchAPs) {
	var processCounter = 10;
	var vrfOptimizationAPs = [];
	var i=0;
	for (i=0; i<optSearchRadios.length; i++) {
		var optRadio = optSearchRadios[i];
		var foundAP = findAPForRadio(optRadio['mac']);
		
		// loop through  the APs left to match on the floorplan
		for (var s = 0; s<searchAPs.length; s++) {
			// grab AP from monitoring
			ap_name = searchAPs[s]['ap_name'];
			var currentAP = apsDict[searchAPs[s]['serial_number']];
			
			// Match the AP names from optimization and floorplan
			if (foundAP && foundAP.name === currentAP.name) {
				vrfOptimizationAPs.push(optRadio)
			}
		}
		if (i/optSearchRadios.length*100 > processCounter) {
			postMessage({type:'update', value:i/optSearchRadios.length*100});
			processCounter += 10;
		}
	}
	postMessage({type:'result', value:{opt:vrfOptimizationAPs, vrf:searchAPs}});
}