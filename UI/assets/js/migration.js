/*
Central Automation v1.2.1
© Aaron Scott (WiFi Downunder) 2021
*/

var centralURLs = [{"https://apigw-apacsouth.central.arubanetworks.com": "https://app-apacsouth.central.arubanetworks.com", 
"https://api-ap.central.arubanetworks.com": "https://app2-ap.central.arubanetworks.com",
"https://internal-apigw.central.arubanetworks.com": "https://internal-ui.central.arubanetworks.com",
"https://app1-apigw.central.arubanetworks.com": "https://app.central.arubanetworks.com",
"https://apigw-prod2.central.arubanetworks.com": "https://app-prod2-ui.central.arubanetworks.com",
"https://apigw-uswest4.central.arubanetworks.com": "https://app-uswest4.central.arubanetworks.com",
"https://apigw-ca.central.arubanetworks.com": "app-ca.central.arubanetworks.com",
"https://apigw-apaceast.central.arubanetworks.com": "https://app-apaceast.central.arubanetworks.com",
"https://eu-apigw.central.arubanetworks.com": "https://app2-eu.central.arubanetworks.com"}];

var centralClusters = [{"Internal": "https://internal-apigw.central.arubanetworks.com",
"US-1": "https://app1-apigw.central.arubanetworks.com", 
"US-2": "https://apigw-prod2.central.arubanetworks.com",
"US-4": "https://apigw-uswest4.central.arubanetworks.com",
"APAC-1": "https://api-ap.central.arubanetworks.com",
"APAC-EAST1": "https://apigw-apaceast.central.arubanetworks.com",
"APAC-SOUTH1": "https://apigw-apacsouth.central.arubanetworks.com",
"EU": "https://eu-apigw.central.arubanetworks.com",
"Canada-1": "https://apigw-ca.central.arubanetworks.com"
}]

var clusterNames = [{"https://internal-apigw.central.arubanetworks.com": "Internal",
"https://app1-apigw.central.arubanetworks.com": "US-1", 
"https://apigw-prod2.central.arubanetworks.com": "US-2",
"https://apigw-uswest4.central.arubanetworks.com": "US-4",
"https://api-ap.central.arubanetworks.com": "APAC-1",
"https://apigw-apaceast.central.arubanetworks.com": "APAC-EAST1",
"https://apigw-apacsouth.central.arubanetworks.com": "APAC-SOUTH1",
"https://eu-apigw.central.arubanetworks.com": "EU",
"https://apigw-ca.central.arubanetworks.com": "Canada-1"
}]

var api_url = "https://api.wifidownunder.com";
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';

var maxSimultaneousGroups = 5;
var groupDetails = [];
var groupPromise;
var groupDetailsPromise;
var groupErrorCounter = 0;
var errorCounter = 0;
var wlanCounter = 0;
var wlanConfigs = {};
var countryCodes = {};
var wlanConfigLocations = {};
var authConfigLocations = {};
var cppmConfigLocations = {};
var templateGroups = [];
var templateGroupCounter = 0;
var templateErrorCounter = 0;
var templateTotal = {};
var variableCounter = 0;
var variableErrorCounter = 0;
var variableTotal = 0;
var siteCounter = 0;
var siteTotal = 0;
var labelCounter = 0;
var labelTotal = 0;

var wlanPrefix = "wlan ssid-profile ";
var authServerPrefix = "wlan auth-server ";


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	 	Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}




/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function populateCentralClusters() {
	for (let k in centralClusters[0]) {
		$("#clusterselector").append($('<option>', {value: centralClusters[0][k],text: k}));
		$("#destination_clusterselector").append($('<option>', {value: centralClusters[0][k],text: k}));
	}
		
}




/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Load and Save from Local Storage functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function onFinishSetup() {
	// Save all supplied addresses and details
	localStorage.setItem('client_id', $('#client_id').val());
	localStorage.setItem('client_secret', $('#client_secret').val());
	localStorage.setItem('base_url', document.getElementById("clusterselector").value);
	localStorage.setItem('refresh_token', $('#refresh_token').val());
	localStorage.setItem('access_token', $('#access_token').val());
	localStorage.setItem('destination_client_id', $('#destination_client_id').val());
	localStorage.setItem('destination_client_secret', $('#destination_client_secret').val());
	localStorage.setItem('destination_base_url', document.getElementById("destination_clusterselector").value);
	localStorage.setItem('destination_refresh_token', $('#destination_refresh_token').val());
	localStorage.setItem('destination_access_token', $('#destination_access_token').val());
	localStorage.setItem('destination_password', $('#destination_password').val());
	localStorage.setItem('destination_secret', $('#destination_secret').val());
	localStorage.setItem('destination_cppm', $('#destination_cppm').val());
	
	sourceTokenRefresh();
	destinationTokenRefresh();
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Authentication functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Refresh the Auth token and Access token for the source
function sourceTokenRefresh() {
	showNotification("ca-padlock", "Authenticating with Source Central...", "bottom", "center", 'info');
	var settings = {
	  "url": api_url + "/auth/refresh",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"client_id": localStorage.getItem('client_id'),
		"client_secret": localStorage.getItem('client_secret'),
		"access_token": localStorage.getItem('access_token'),
		"refresh_token": localStorage.getItem('refresh_token'),
		"base_url": localStorage.getItem('base_url')
	  })
	};

	return $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-padlock", "Authenticated with Source Central Failed: "+ response.error_description, "bottom", "center", 'danger');
	  } else {
	  	localStorage.setItem('refresh_token',response.refresh_token);
	  	localStorage.setItem('access_token',response.access_token); 
	  	var path = window.location.pathname;
		var page = path.split("/").pop();
		if (page.includes('settings')) {
			document.getElementById("refresh_token").value = response.refresh_token;
			document.getElementById("access_token").value = response.access_token;
			showNotification("ca-padlock", "Authenticated with Source Central Successful", "bottom", "center", 'success');
	
		}
	  }
	}).fail(function(XMLHttpRequest, textStatus, errorThrown) 
	{
		console.log("error")
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

function destinationTokenRefresh() {
	showNotification("ca-padlock", "Authenticating with Destination Central...", "bottom", "center", 'info');
	var settings = {
	  "url": api_url + "/auth/refresh",
	  "method": "POST",
	  "timeout": 0,
	  "headers": {
		"Content-Type": "application/json"
	  },
	  "data": JSON.stringify({
		"client_id": localStorage.getItem('destination_client_id'),
		"client_secret": localStorage.getItem('destination_client_secret'),
		"access_token": localStorage.getItem('destination_access_token'),
		"refresh_token": localStorage.getItem('destination_refresh_token'),
		"base_url": localStorage.getItem('destination_base_url')
	  })
	};

	return $.ajax(settings).done(function (response) {
	  //console.log(response);
	  if (response.hasOwnProperty('error')) {
	  	showNotification("ca-padlock", "Authenticated with Destination Central Failed: "+ response.error_description, "bottom", "center", 'danger');
	  } else {
	  	localStorage.setItem('destination_refresh_token',response.refresh_token);
	  	localStorage.setItem('destination_access_token',response.access_token); 
	  	var path = window.location.pathname;
		var page = path.split("/").pop();
		if (page.includes('settings')) {
			document.getElementById("destination_refresh_token").value = response.refresh_token;
			document.getElementById("destination_access_token").value = response.access_token;
			showNotification("ca-padlock", "Authenticated with Destination Central Successful", "bottom", "center", 'success');
		}
	  }
	}).fail(function(XMLHttpRequest, textStatus, errorThrown) 
	{
		console.log("error")
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
		Migration functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateSelectedOptions() {
	// Make sure the Access Tokens are still good to use
	$.when(sourceTokenRefresh(), destinationTokenRefresh()).then(function () {
	
		errorCounter = 0;
		clearErrorLog();
		
		// Migrate Sites
		if (document.getElementById("siteCheckbox").checked) {
			migrateSites();
		}
		
		// Migrate Labels
		if (document.getElementById("labelCheckbox").checked) {
			migrateLabels();
		}
		
		// Grab full group details - since its used by config migrations
		if (document.getElementById("groupCheckbox").checked || document.getElementById("wlanconfigCheckbox").checked || document.getElementById("templateCheckbox").checked) {
			groupDetailsPromise = new $.Deferred(); 
			$.when(getGroupDetails()).then(function () {
			
				// Migrate Groups and Config
				groupPromise = new $.Deferred();
				if (document.getElementById("groupCheckbox").checked && document.getElementById("wlanconfigCheckbox").checked && document.getElementById("templateCheckbox").checked) {
					$.when(migrateGroups()).then(function () {
						migrateWLANConfig();
						migrateTemplateConfig();
					});
				} else if (document.getElementById("groupCheckbox").checked && document.getElementById("wlanconfigCheckbox").checked) {
					$.when(migrateGroups()).then(function () {
						migrateWLANConfig();
					});
				} else if (document.getElementById("groupCheckbox").checked && document.getElementById("templateCheckbox").checked) {
					$.when(migrateGroups()).then(function () {
						migrateTemplateConfig();
					});
				} else if (document.getElementById("wlanconfigCheckbox").checked && document.getElementById("templateCheckbox").checked) {
					migrateWLANConfig();
					migrateTemplateConfig();
				} else if (document.getElementById("groupCheckbox").checked) {
					migrateGroups();
				} else if (document.getElementById("wlanconfigCheckbox").checked) {
					migrateWLANConfig();
				} else if (document.getElementById("templateCheckbox").checked) {
					migrateTemplateConfig();
				}
			});
		}
	});
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getGroupDetails() {
	showNotification("ca-folder-settings", "Getting Existing Group Details...", "bottom", "center", 'info');
	
	// Get Groups from the last monitoring data
	groups = getGroups();
	
	// Grab current group details (name, template usage, etc) can be done in batches of 20 groups
	groupDetails = [];
	var groupCounter = 0;
	
	while (groupCounter < groups.length) {
		var groupList = "";
		var groupsLeft = groups.length - groupCounter;
		if (groupsLeft > maxSimultaneousGroups) groupsLeft = groupCounter + maxSimultaneousGroups;
		else groupsLeft = groupCounter + groupsLeft;
		
		// Build a list of the maximum allowed groups to be called in the API
		for (i=groupCounter;i<groupsLeft;i++) {
			if (groupList === "") groupList = groups[i][0];
			else groupList = groupList + "," + groups[i][0];
		}
		
		// Grab the group details for each bunch of groups
		var settings = {
			"url": api_url + "/tools/getCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": localStorage.getItem('base_url') + "/configuration/v2/groups/template_info?groups="+groupList,
				"access_token": localStorage.getItem('access_token')
			})
		};

		$.ajax(settings).done(function (response) {
			// save them for recreating the groups in the destination account.
			groupDetails = groupDetails.concat(response["data"])
			if (groupDetails.length == groups.length) {
				// i.e. now have all the groups details
				groupDetailsPromise.resolve();
			}
		});
		
		// move onto the next batch
		groupCounter += maxSimultaneousGroups;
	}
	return groupDetailsPromise.promise();
}


function migrateGroups() {
		
		showNotification("ca-folder-settings", "Migrating Groups...", "bottom", "center", 'info');
	
		// Now have the group details.
		// Time to create the groups on the destination account with the default password
		var dPassword = localStorage.getItem('destination_password');
		if (dPassword == null || dPassword == "undefined") {
			dPassword = "Central123!";
		}
		var groupCreationCounter = 0;
		groupErrorCounter = 0;
		$.each(groupDetails, function() {
			var currentGroup = this.group;
			if (this.group !== "default" && this.group !== "unprovisioned") { // default and unprovisioned groups already exist in every account - no need to migrate it
				var settings = {
					"url": api_url + "/tools/postCommand",
					"method": "POST",
					"timeout": 0,
					 "headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify({
						"url": localStorage.getItem('destination_base_url') + "/configuration/v2/groups",
						"access_token": localStorage.getItem('destination_access_token'),
						"data": JSON.stringify({"group": this.group, "group_attributes": {"group_password": dPassword,"template_info": {"Wired": this["template_details"]["Wired"],"Wireless": this["template_details"]["Wireless"]}}})
					})
				};

				$.ajax(settings).done(function (response) {
					groupCreationCounter++;
					if (response !== "Created") {
						logError(response.description);
						groupErrorCounter++
					}
					if (groupCreationCounter == groupDetails.length) {
						// done migrating the groups
						groupPromise.resolve();
						if (groupErrorCounter > 0) {
							showLog();
							showNotification("ca-folder-settings", "Some groups were not migrated to the Destination Central", "bottom", "center", 'warning');
						} else {
							showNotification("ca-folder-settings", "Groups migrated to the Destination Central", "bottom", "center", 'success');
						}
					}
				});
			} else {
				groupCreationCounter++;
			}
		})
		return groupPromise.promise();
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		WLAN UI Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function prepareWLAN() {
	$('#migration-table').DataTable().clear();
	$('#migration-table').DataTable().rows().draw();
	document.getElementById("pskCheckbox").checked = false;
	document.getElementById("confirmBtn").disabled = true;
	document.getElementById('psk_loading').style.display = "block";
							
	wlanCounter = 0;
	wlanConfigs = {};
	wlanConfigLocations = {};
	cppmConfigLocations = {};
	$.when(sourceTokenRefresh()).then(function () {
		groupDetailsPromise = new $.Deferred(); 
		$.when(getGroupDetails()).then(function () {
		
			showNotification("ca-wifi", "Getting Group WLAN Configs...", "bottom", "center", 'info');
			$('#MigrationModalLink').trigger('click');
			// Grab config for each Group in Central
			$.each(groupDetails, function() {
				var currentGroup = this.group;
		
				// only migrate groups config that aren't "unprovisioned" and that are not template groups
				if (currentGroup !== "unprovisioned" && this["template_details"]["Wireless"] == false) {
					var settings = {
						"url": api_url + "/tools/getCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": localStorage.getItem('base_url') + "/configuration/v1/ap_cli/" + currentGroup,
							"access_token": localStorage.getItem('access_token')
						})
					};

					$.ajax(settings).done(function (response) {
						// Save the configs
						wlanConfigs[currentGroup] = response;
						var pskPromise = new $.Deferred();
						var authPromise = new $.Deferred();
						// need to check for PSKs - and get passphrase
						$.when(getPSKsForConfig(pskPromise, currentGroup), getAuthServersFromConfig(authPromise, currentGroup)).then(function () {
							wlanCounter++;
							if (wlanCounter == groupDetails.length) {
								// show that psks have be obtained
								// show that Auth servers need to be updated with shared secrets
								console.log("Finished this processing WLANs")
								document.getElementById("pskCheckbox").checked = true;
								document.getElementById("confirmBtn").disabled = false;
								document.getElementById('psk_loading').style.display = "none";
							}
						});
					})
					
					var settingsCountry = {
						"url": api_url + "/tools/getCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": localStorage.getItem('base_url') + "/configuration/v1/" + currentGroup + "/country",
							"access_token": localStorage.getItem('access_token')
						})
					};

					$.ajax(settingsCountry).done(function (response) {
						// Save the configs
						countryCodes[currentGroup] = response["country"];
					})
				} else {
					wlanCounter++;
				}
			})
		})
	})
}

function getPSKsForConfig(pskPromise, currentGroup) {
	// Find the existing WLAN
	var passphraseIndex = -1;
	var wlanName = "";
	var config = wlanConfigs[currentGroup];
	var pskCounter = 0;
	wlanConfigLocations[currentGroup] = {};
	
	// check if is a UI group (this doesn't work for template groups...)
	if (config.length) {
		for (i=0;i<config.length;i++) {
			var currentLine = config[i];
			
			// Find first row of the WLAN
			if (currentLine.includes(wlanPrefix)) {
				// pull out the wlan name.
				wlanName = currentLine.replace(wlanPrefix,'');
				
			} else if (currentLine.includes("  wpa-passphrase ")) {
				passphraseIndex = i;
				// next line after the end of the WLAN
				if (!wlanName.includes(" ")) {
					// remember location for WLAN passphrase in config
					var currentLocations = wlanConfigLocations[currentGroup];
					currentLocations[wlanName] = i;
					wlanConfigLocations[currentGroup] = currentLocations;
				
					pskCounter++;
					var settings = {
					  "url": api_url + "/tools/getCommand",
					  "method": "POST",
					  "timeout": 0,
					  "headers": {
						"Content-Type": "application/json"
					  },
					  "data": JSON.stringify({
						"url": localStorage.getItem('base_url') + "/configuration/v2/wlan/" + currentGroup + "/" + wlanName,
						"access_token": localStorage.getItem('access_token')
					  })
					};

					$.ajax(settings).done(function (response) {
						// pull out passphrase and then replace it in the correct location in the config
						var passphrase = response.wlan.wpa_passphrase;
						config[wlanConfigLocations[currentGroup][response.wlan.name]] = "  wpa-passphrase "+passphrase;
						pskCounter--;
						if (pskCounter == 0) {
							// if all passphrases have been replaced - save the config and resolve.
							wlanConfigs[currentGroup] = config;
							pskPromise.resolve();
						}
					});
				}
			}
		}
		if (passphraseIndex == -1) {
			// no PSK networks in config
			return pskPromise.resolve();
		}
	}
	return pskPromise.promise();
}

function getAuthServersFromConfig(authPromise, currentGroup) {

	// Find the existing WLAN
	var serverName = "";
	var config = wlanConfigs[currentGroup];
	var authCounter = 0;
	authConfigLocations[currentGroup] = {};
	cppmConfigLocations[currentGroup] = {};
	
	var dPassword = localStorage.getItem('destination_secret');
	if (dPassword == null || dPassword == "undefined") {
		dPassword = "";
	}
	
	var cppmPassword = localStorage.getItem('destination_cppm');
	if (cppmPassword == null || cppmPassword == "undefined") {
		cppmPassword = "";
	}
	
	// check if is a UI group (this doesn't work for template groups...)
	if (config.length) {
		for (i=0;i<config.length;i++) {
			var currentLine = config[i];
			
			// Find first row of the Auth Server
			if (currentLine.includes(authServerPrefix)) {
				// pull out the auth server name.
				if (currentLine.includes("_#guest#_")) serverName = "";
				else serverName = currentLine.replace(authServerPrefix,'');

			} else if (currentLine.includes("  key ") && serverName != "") {
				
				// remember location for the shared secret in config
				var currentLocations = authConfigLocations[currentGroup];
				currentLocations[serverName] = i;
				authConfigLocations[currentGroup] = currentLocations;
			
				// build table with auth Servers - to be able to set the shared secrets				
				var table = $('#migration-table').DataTable();
				// Add row to table
				table.row.add([
					currentGroup,
					serverName,
					'<input type="text" name="'+currentGroup+'%'+serverName+'" id="'+currentGroup+'%'+serverName+'" value="'+dPassword+'">',
					'<input type="text" name="'+currentGroup+'%'+serverName+'%cppm" id="'+currentGroup+'%'+serverName+'%cppm" value="" disabled>'
				]);
				$('#migration-table').DataTable().rows().draw();
			} else if (currentLine.includes("cppm username ") && serverName != "") {
				
				// remember location for the cppm username/password in config
				var currentCPPMLocations = cppmConfigLocations[currentGroup];
				currentCPPMLocations[serverName] = i;
				cppmConfigLocations[currentGroup] = currentCPPMLocations;

				// update the last row with the cppm pasword box
				var table = $('#migration-table').DataTable();
				var lastRow = table.rows().count() - 1
				var temp = table.row(lastRow).data();
				temp[3] = '<input type="text" name="'+currentGroup+'%'+serverName+'%cppm" id="'+currentGroup+'%'+serverName+'%cppm" value="'+cppmPassword+'">';
				table.row(lastRow).data(temp).draw();
			}
		}
	}
	return authPromise.resolve();
}

function confirmWLAN() {
	// grab the text field data
	$('#migration-table').DataTable().rows().every( function ( rowIdx, tableLoop, rowLoop ) {
		// replace the "  key ********" line in the config with new shared secret
		var data = this.data();
		
		var currentGroup = data[0];
		var serverName = data[1];
		var sharedSecret = data[2].replace('<input type="text" name="'+currentGroup+'%'+serverName+'" id="'+currentGroup+'%'+serverName+'" value="', '');
		sharedSecret = sharedSecret.replace('">', '');
		var cppmPassword = data[3].replace('<input type="text" name="'+currentGroup+'%'+serverName+'%cppm" id="'+currentGroup+'%'+serverName+'%cppm" value="', '');
		cppmPassword = cppmPassword.replace('">', '');
		
		var config = wlanConfigs[currentGroup];
		
		var configLine = authConfigLocations[currentGroup][serverName];
		config[configLine] = "  key "+sharedSecret;
		
		var configCPPMLine = cppmConfigLocations[currentGroup][serverName];
		if (configCPPMLine) {
			config[configCPPMLine] = config[configCPPMLine].replace("********", cppmPassword);
		}
		
		wlanConfigs[currentGroup] = config;
		console.log(wlanConfigs[currentGroup])
	});
	document.getElementById("wlanconfigCheckbox").disabled = false;
	document.getElementById("wlanconfigCheckbox").checked = true;
}


function migrateWLANConfig() {
	// need to push config to destination Central group.
	showNotification("ca-wifi", "Migrating WLAN UI Group Configurations...", "bottom", "center", 'info');
	
	$.each(groupDetails, function() {
		var currentGroup = this.group;
		
		// only migrate groups config that aren't "unprovisioned" and that are not template groups
		if (currentGroup !== "unprovisioned" && this["template_details"]["Wireless"] == false) {
		
			putCountryCodeForGroup(currentGroup);
	
			var settings = {
				"url": api_url + "/tools/postCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": localStorage.getItem('destination_base_url') + "/configuration/v1/ap_cli/" + currentGroup,
					"access_token": localStorage.getItem('destination_access_token'),
					"data": JSON.stringify({"clis":wlanConfigs[currentGroup]})
				})
			};


			$.ajax(settings).done(function (response) {
				wlanCounter++;
				if (response.reason && response.reason == "Bad Gateway") {
					Swal.fire({
						  title: 'API Issue',
						  text: 'There is an issue communicating with the API Gateway',
						  icon: 'warning'
						});
				} else if (response.code && response.code == 429) {
					logError("Unable to migrate WLAN config for Group " + currentGroup);
					Swal.fire({
						  title: 'API Limit Reached',
						  text: 'You have reached your daily API limit. No more API calls will succeed today.',
						  icon: 'warning'
						});
				} else if (response.description) {
					logError(response.description);
					errorCounter++;
				} else if (response !== ""+currentGroup) {
					logError("Unable to migrate WLAN config for Group " + currentGroup);
					errorCounter++;
				}
				if (wlanCounter == groupDetails.length) {
					if (errorCounter != 0) {
						showLog();
						showNotification("ca-wifi", "Some WLAN GUI Config failed to migrate to the Destination Central", "bottom", "center", 'warning');
					} else {
						showNotification("ca-wifi", "WLAN GUI Config migrated to the Destination Central", "bottom", "center", 'success');
					}
				}	
			});
			
		}
	});	
}

function putCountryCodeForGroup(currentGroup) {
	if (countryCodes[currentGroup]) {
		var settings = {
			"url": api_url + "/tools/putCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": localStorage.getItem('destination_base_url') + "/configuration/v1/country",
				"access_token": localStorage.getItem('destination_access_token'),
				"data": JSON.stringify({"groups":[currentGroup], "country": countryCodes[currentGroup]})
			})
		};
	
	
		$.ajax(settings).done(function (response) {
			wlanCounter++;
			if (response.reason && response.reason == "Bad Gateway") {
				Swal.fire({
					  title: 'API Issue',
					  text: 'There is an issue communicating with the API Gateway',
					  icon: 'warning'
					});
			} else if (response.code && response.code == 429) {
				logError("Unable to migrate WLAN config for Group " + currentGroup);
				Swal.fire({
					  title: 'API Limit Reached',
					  text: 'You have reached your daily API limit. No more API calls will succeed today.',
					  icon: 'warning'
					});
			} else if (response.description) {
				logError(response.description);
				errorCounter++;
			} else if (response !== ""+currentGroup) {
				logError("Unable to migrate WLAN Country for Group " + currentGroup);
				errorCounter++;
			}
			if (wlanCounter == groupDetails.length) {
				if (errorCounter != 0) {
					showLog();
					showNotification("ca-wifi", "Some WLAN GUI Config Country Codes failed to migrate to the Destination Central", "bottom", "center", 'warning');
				} else {
					showNotification("ca-wifi", "WLAN GUI Config Country Codes migrated to the Destination Central", "bottom", "center", 'success');
				}
			}	
		});
	}
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template functions 
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function migrateTemplateConfig() {
	templateGroups = [];
	templateGroupCounter = 0;
	templateTotal = {};
	templateErrorCounter = 0;
	variableTotal = 0;
	showNotification("ca-document-copy", "Getting Templates and Variables...", "bottom", "center", 'info');
	
	// only migrate groups config that aren't "unprovisioned" and that are template groups
	$.each(groupDetails, function() {
		var currentGroup = this.group;
		if (currentGroup !== "unprovisioned" && (this["template_details"]["Wireless"] == true || this["template_details"]["Wired"] == true)) {
			templateGroups.push(this);
		}
	});
	
	// Grab templates for each Group in Central
	$.each(templateGroups, function() {
		//getTemplatesForGroup(this["group"], 0);
	});
	
	// Grab the variables across all devices and migrate
	getVariablesForAllDevices(0);
}

function getTemplatesForGroup(currentGroup, offset) {
	
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + "/configuration/v1/groups/"+currentGroup+"/templates?limit=20&offset="+offset,
			"access_token": localStorage.getItem('access_token')
		})
	};

	$.ajax(settings).done(function (response) {
		// For each Template in the group - get the template text.
		templateTotal[currentGroup] = response.total
		var templateCounter = 0;
		if (response.total > 0) {
			$.each(response.data, function() {
				var templateName = this.name;
				var model = this.model;
				var deviceType = this.device_type;
				var version = this.version;
				var settings2 = {
					"url": api_url + "/tools/getCommand",
					"method": "POST",
					"timeout": 0,
					 "headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify({
						"url": localStorage.getItem('base_url') + "/configuration/v1/groups/"+currentGroup+"/templates/"+templateName,
						"access_token": localStorage.getItem('access_token')
					})
				};
			
				$.ajax(settings2).done(function (response) {
					var templateText = response.resultBody
					//console.log(templateText)
					//console.log(btoa(templateText))
					var params = "name="+templateName+"&device_type="+deviceType+"&version="+version+"&model="+model;
					var settingsPost = {
						"url": api_url + "/tools/postFormDataCommand",
						"method": "POST",
						"timeout": 0,
						 "headers": {
							"Content-Type": "application/json"
						},
						"data": JSON.stringify({
							"url": localStorage.getItem('destination_base_url') + "/configuration/v1/groups/"+currentGroup+"/templates?name="+templateName+"&device_type="+deviceType+"&version="+version+"&model="+model,
							"access_token": localStorage.getItem('destination_access_token'),
							"template": templateText
						})
					}
				
					$.ajax(settingsPost).done(function (response) {
						templateCounter++;
						if (response !== "Created") {
							logError("Template with same name or same device type, model & version exists in the group: "+ currentGroup);
							templateErrorCounter++;
						}
						if (templateCounter == templateTotal[currentGroup]) {
							templateGroupCounter++;
							checkIfTemplatesComplete();
						}
					})
				});
			})
		} else {
			templateGroupCounter++;
			checkIfTemplatesComplete();
		}
	})
	
	if (offset+apiGroupLimit <= templateTotal[currentGroup]) {
		getTemplatesForGroup(currentGroup, offset+apiGroupLimit);
	}
}

function checkIfTemplatesComplete() {
	if (templateGroupCounter == templateGroups.length) {
		if (templateErrorCounter != 0) {
			showLog();
			showNotification("ca-document-copy", "Some Templates failed to migrate to the Destination Central", "bottom", "center", 'warning');
		} else {
			showNotification("ca-document-copy", "Templates migrated to the Destination Central", "bottom", "center", 'success');
		}
	}
}



function getVariablesForAllDevices(offset) {
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + "/configuration/v1/devices/template_variables?format=JSON&limit="+apiGroupLimit+"&offset="+offset,
			"access_token": localStorage.getItem('access_token')
		})
	};
	
	$.ajax(settings).done(function (response) {
		var variablesText = response
		variableTotal = Object.keys(variablesText).length;
		if (Object.keys(variablesText).length == apiGroupLimit) {
			// not an empty result - there might be more to get
			getVariablesForAllDevices(offset+apiGroupLimit);
		}
		
		var settingsPost = {
			"url": api_url + "/tools/postFormDataCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": localStorage.getItem('destination_base_url') + "/configuration/v1/devices/template_variables?format=JSON",
				"access_token": localStorage.getItem('destination_access_token'),
				"variables": JSON.stringify(variablesText)
			})
		}
		
		$.ajax(settingsPost).done(function (response) {
			//console.log(response)
			variableCounter += Object.keys(variablesText).length;
			if (response !== "Success") {
				logError(response.description);
				variableErrorCounter++;
			}
			checkIfVariablesComplete();
		})
	});
}

function checkIfVariablesComplete() {
	if (variableCounter == variableTotal) {
		if (variableErrorCounter != 0) {
			showLog();
			showNotification("ca-document-copy", "Some Variables failed to migrate to the Destination Central", "bottom", "center", 'warning');
		} else {
			showNotification("ca-document-copy", "Variables migrated to the Destination Central", "bottom", "center", 'success');
		}
	}
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Sites functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateSites() {
	showNotification("ca-world-pin", "Migrating Existing Sites...", "bottom", "center", 'info');
	siteCounter = 0;
	getSiteDetails(0);
}

function getSiteDetails(offset) {
	// Get the current bunch of sites
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
		  "Content-Type": "application/json"
		},
		"data": JSON.stringify({
		  "url": localStorage.getItem('base_url') + "/central/v2/sites?calculate_total=true&limit=" + apiSiteLimit + "&offset=" + offset,
		  "access_token": localStorage.getItem('access_token')
		})
	};

	$.ajax(settings).done(function (response) {
		siteTotal = response.total;
		// Migrate each site to the destination
	  	$.each(response.sites, function() {
	  		var currentSite = this["site_name"]
			var settings = {
				"url": api_url + "/tools/postCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": localStorage.getItem('destination_base_url') + "/central/v2/sites",
					"access_token": localStorage.getItem('destination_access_token'),
					"data": JSON.stringify({"site_name": this["site_name"], 
											"site_address": {
												"address": this["address"],
												"city": this["city"],
												"state": this["state"],
												"country": this["country"],
												"zipcode": this["zipcode"]
											  }
											})
				})
			};

			return $.ajax(settings).done(function (response) {
				//console.log(response)
				siteCounter++;
				if (response.hasOwnProperty("error_code")) {
					errorCounter++;
					if (response.description === "SITE_ERR_DUPLICATE_SITE_NAME") {
						logError('Site with name "'+currentSite+'" already exists');
					} else {
						logError(response.description);
					}
				} else if (response.hasOwnProperty("site_name")) {
					console.log("Add added successfully");
				}
				if (siteCounter == siteTotal) {	
					if (errorCounter != 0) {
						showLog();
						showNotification("ca-world-pin", "Some Sites failed to migrate to the Destination Central", "bottom", "center", 'warning');
					} else if (siteCounter == siteTotal){
						showNotification("ca-world-pin", "Sites were migrated to the Destination Central", "bottom", "center", 'success');
					}
				}
			});
		});
	  	
	  	if (offset+apiSiteLimit <= siteTotal) {
	  		getSiteDetails(offset+apiSiteLimit);
		}
	});
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Labels functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function migrateLabels() {
	showNotification("ca-tag-cut", "Migrating Existing Labels...", "bottom", "center", 'info');
	labelCounter = 0;
	getLabelDetails(0);
}

function getLabelDetails(offset) {
	// Get the current bunch of sites
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		"headers": {
		  "Content-Type": "application/json"
		},
		"data": JSON.stringify({
		  "url": localStorage.getItem('base_url') + "/central/v1/labels?calculate_total=true&limit=" + apiSiteLimit + "&offset=" + offset,
		  "access_token": localStorage.getItem('access_token')
		})
	};

	$.ajax(settings).done(function (response) {
		//console.log(response);
		labelTotal = response.total;
		// Migrate each site to the destination
	  	$.each(response.labels, function() {
	  		var currentLabel = this["label_name"];
	  		// category_id 2 is created when a site is created - so no need to manually create them
	  		if (this["category_id"] == 1) {
				var settings = {
					"url": api_url + "/tools/postCommand",
					"method": "POST",
					"timeout": 0,
					 "headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify({
						"url": localStorage.getItem('destination_base_url') + "/central/v1/labels",
						"access_token": localStorage.getItem('destination_access_token'),
						"data": JSON.stringify({"category_id": 1, 
												"label_name": currentLabel
												})
					})
				};

				return $.ajax(settings).done(function (response) {
					//console.log(response)
					labelCounter++;
					if (response.hasOwnProperty("error_code")) {
						errorCounter++;
						if (response.description === "LABEL_ERR_DUPLICATE_LABEL_NAME") {
							logError('Label with name "'+currentLabel+'" already exists');
						} else {
							logError(response.description +": "+ currentLabel);
						}
					} else if (response.hasOwnProperty("label_name")) {
						console.log("Add added successfully");
					}
					if (errorCounter != 0) {
						showLog();
						showNotification("ca-tag-cut", "Some Labels failed to migrate to the Destination Central", "bottom", "center", 'warning');
					} else if (labelCounter == labelTotal){
						showNotification("ca-tag-cut", "Labels were migrated to the Destination Central", "bottom", "center", 'success');
					}
				});
			} else {
				labelCounter++;
			}
		});
	  	
	  	if (offset+apiSiteLimit <= labelTotal) {
	  		getLabelDetails(offset+apiSiteLimit);
		}
	});
}