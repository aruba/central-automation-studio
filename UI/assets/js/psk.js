/*
Central Automation v1.2
© Aaron Scott (WiFi Downunder) 2021
*/



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getWLANsforGroup() {
	showNotification("ca-wifi-protected", "Obtaining WLANs for selected group configuration", "bottom", "center", 'info');
	document.getElementById("pskPassphrase").value = "";
	var wlans = document.getElementById('wlanselector');
	wlans.options.length = 0;


	var select = document.getElementById("groupselector");
	var wlanGroup = select.value;
	
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": localStorage.getItem('base_url') + "/configuration/v1/wlan/" + wlanGroup,
		"access_token": localStorage.getItem('access_token')
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response.hasOwnProperty('error_code')) {	  	
	  	showNotification("ca-folder-settings", response.description, "bottom", "center", 'danger');
	  } else {
	  	$.each(response.wlans, function() {  
	  		$("#wlanselector").append($('<option>', {value: this["name"],text: this["essid"]}));
		});
		if (response.wlans.length > 0) {
			if ($(".selectpicker").length != 0) {
				$('.selectpicker').selectpicker('refresh');
			}
		} else {
			showNotification("ca-wifi", 'There are no WLANs in the "'+wlanGroup+'" group', "bottom", "center", 'danger');
		}
	  }
	});
}

function getConfigforWLAN() {
	showNotification("ca-wifi-protected", "Obtaining WLAN configuration", "bottom", "center", 'info');
	document.getElementById("pskPassphrase").value = "";
	var groupselect = document.getElementById("groupselector");
	var wlanGroup = groupselect.value;
	var wlanselect = document.getElementById("wlanselector");
	var wlan = wlanselect.value;
	var settings = {
	  "url": api_url + "/tools/getCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": localStorage.getItem('base_url') + "/configuration/v2/wlan/" + wlanGroup + "/" + wlan,
		"access_token": localStorage.getItem('access_token')
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response.hasOwnProperty('error_code')) {	  	
	  	showNotification("ca-wifi", response.description, "bottom", "center", 'danger');
	  } else {
	  	if (response.wlan.wpa_passphrase === "") {
	  		showNotification("ca-wifi-protected", "The selected WLAN is not a PSK-based network", "bottom", "center", 'danger');
	  	} else {
	  		document.getElementById("pskPassphrase").value = response.wlan.wpa_passphrase;
	  		existingPassphrase = response.wlan.wpa_passphrase;
	  		document.getElementById("savePSKBtn").disabled = true;
	  		wlanConfig = response;
	  	}
	  }
	});
}

function updatePSK() {
	var groupselect = document.getElementById("groupselector");
	var wlanGroup = groupselect.value;
	var wlanselect = document.getElementById("wlanselector");
	var wlan = wlanselect.value;
	// update the passphrase value
	wlanConfig["wlan"]["wpa_passphrase"] = document.getElementById("pskPassphrase").value;
	wlanConfig["wlan"]["wpa_passphrase_changed"] = true;
	
	showNotification("ca-wifi-protected", "Updating PSK for "+wlan, "bottom", "center", 'info');
	
	var settings = {
	  "url": api_url + "/tools/putCommand",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"url": localStorage.getItem('base_url') + "/configuration/v2/wlan/" + wlanGroup + "/" + wlan,
		"access_token": localStorage.getItem('access_token'),
		"data": JSON.stringify(wlanConfig)
	  })
	};

	$.ajax(settings).done(function (response) {
	  if (response === wlan) {
	  	Swal.fire({
		  title: 'Passphrase Updated',
		  text: 'Passphrase was updated for the "'+wlan+ '" WLAN',
		  icon: 'success'
		});
	  }
	  
	}).fail(function(XMLHttpRequest, textStatus, errorThrown) 
	{
		console.log("error")
		console.log(textStatus)
		if (XMLHttpRequest.readyState == 4) {
			// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
			showNotification("ca-globe", XMLHttpRequest.statusText, "bottom", "center", 'danger');
		} else if (XMLHttpRequest.readyState == 0) {
			// Network error (i.e. connection refused, access denied due to CORS, etc.)
			showNotification("ca-globe", "Can not connect to API server", "bottom", "center", 'danger');
		} else {
			// something weird is happening
		}
	});
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


function passphraseChange() {
	if (document.getElementById("pskPassphrase").value === existingPassphrase) {
		document.getElementById("savePSKBtn").disabled = false;
	} else {
		document.getElementById("savePSKBtn").disabled = false;
	}
}

function showPassphrase() {
	var x = document.getElementById("pskPassphrase");
	if (document.getElementById("revealPassphrase").checked) {
   	 	x.type = "text";
  	} else {
    	x.type = "password";
  	}
}

