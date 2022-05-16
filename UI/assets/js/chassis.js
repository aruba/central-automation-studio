/*
Central Automation v1.4b
Updated: 1.8.2
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var switchVLANs = [];
var currentSwitch = "";
var currentVLANRow = 0;
var switchVariables = {};

var updateCounter = 0;
var errorCounter = 0;
var variableCounter = 0;

var currentGroup = "";
var currentTemplate = "";
var currentTemplateModel = "";
var currentTemplateType = "";
var currentTemplateVersion = "";
var switchTemplate = "";

var templatePromise;

var switchesLoaded = false;
var groupsLoaded = false;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Template Switch Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getVLANs(offset, currentSerial) {
	currentSwitch = currentSerial;
	
	if (offset == 0) {
		switchVLANs = [];
		$('#vlan-table').DataTable().rows().remove();
	}
	var settings = {
		"url": getAPIURL() + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + "/monitoring/v1/switches/"+currentSerial+"/vlan?offset=0&limit=1000&calculate_total=true",
			"access_token": localStorage.getItem('access_token')
		})
	};

	$.ajax(settings).done(function (response) {
		if (response.hasOwnProperty("message")) {
			if (response.message === "API rate limit exceeded")
				Swal.fire({
					  title: 'API Limit',
					  text: 'Daily API limit reached',
					  icon: 'error'
					});
		} else {
			
			var vlanTable = $('#vlan-table').DataTable();
			$.each(response.vlans, function() {
				switchVLANs.push(this)
				//console.log(this);
				vlanTable.row.add([
					this["id"],
					this["name"],	
					this["ipaddress"], 
					this["tagged_ports"].join(','), 
					this["untagged_ports"].join(',')
				]);
			})			
			$('#vlan-table').DataTable().rows().draw();
			
			if (offset+apiLimit <= response.total) getVLANs(offset+apiLimit, currentSerial);
		}
	})
}

function getTemplateForSwitch(currentSerial) {
	switchTemplate = "";
	templatePromise = new $.Deferred();
	var settings = {
		"url": getAPIURL() + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": localStorage.getItem('base_url') + "/configuration/v1/devices/template?device_serials=" + currentSerial,
			"access_token": localStorage.getItem('access_token')
		})
	};

	$.ajax(settings).done(function (response) {
		if (response.hasOwnProperty("message")) {
			if (response.message === "API rate limit exceeded")
				Swal.fire({
					  title: 'API Limit',
					  text: 'Daily API limit reached',
					  icon: 'error'
					});
		} else {
			var data = response.data;
			console.log(data)
			currentGroup = data[currentSerial]["group_name"];
			currentTemplate = data[currentSerial]["template_name"];
			currentTemplateType = "ArubaSwitch";
			//console.log(currentTemplate);
			
			showNotification("ca-document-copy", "Getting template for device...", "bottom", "center", 'info');
				
			var settings = {
				"url": getAPIURL() + "/tools/getCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": localStorage.getItem('base_url') + "/configuration/v1/groups/"+currentGroup+"/templates/" + currentTemplate,
					"access_token": localStorage.getItem('access_token')
				})
			};
			
			$.ajax(settings).done(function (response) {
				if (response.error_code) {
					if (response.description.includes("not found as a Template group")) {
						Swal.fire({
						  title: 'No Template',
						  text: 'This switch ('+currentSerial+') is no longer in a Template group',
						  icon: 'warning'
						});
					} else {
						Swal.fire({
						  title: 'Template Failure',
						  text: response.description,
						  icon: 'error'
						});	
					}
					return null;
				} else if (response.resultBody) {
					switchTemplate = response.resultBody;
					templatePromise.resolve();
				}
			})
		}
	})
	return templatePromise.promise();
}

function findVariablesForVlan(vlanID) {
	showNotification("ca-document-copy", "Processing template...", "bottom", "center", 'info');
	
	var templateModified = false;
	var usingVariables = false;
	var ipAddressVar = "";
	var subnetMaskVar = "";
	var untaggedVar = "";
	var taggedVar = "";
	
	// Find config block for chosen VLAN ID
	var vlanLocation = switchTemplate.indexOf("\nvlan "+ vlanID)
	var vlanBlock = switchTemplate.substring(vlanLocation + 1, switchTemplate.indexOf("exit\n", vlanLocation)+5);
	var originalVLANBlock = vlanBlock;
	
	// Cleanup the VLAN block formatting
	var vlanArray = vlanBlock.split("\n");
	for (i=1;i<vlanArray.length;i++) {
		if (vlanArray[i].trim()) {
			var vlanRow = "   "+vlanArray[i].trim();
			vlanArray[i] = vlanRow;
		}
	}
	vlanBlock = vlanArray.join("\n");
	
	
	// Process Name changes
	var nameLocation = vlanBlock.indexOf("   name ");
	if (nameLocation != -1) {
		// Find the config line for "name"
		var nameConfig = vlanBlock.substring(nameLocation, vlanBlock.indexOf("\n", nameLocation)+1)
		if (document.getElementById("vlanName").value) {
			// Update line in config
			vlanBlock = vlanBlock.replace(nameConfig, '   name "'+document.getElementById("vlanName").value+ '"\n');
		} else {
			// removing the name from the VLAN
			vlanBlock = vlanBlock.replace(nameConfig, "");
		}
	} else {
		nameLocation = vlanBlock.indexOf("\n");
		var vlanBlockStart = vlanBlock.substring(0,nameLocation);
		var vlanBlockEnd = vlanBlock.substring(nameLocation);
		// slide the untagged ports config line in the vlan block
		vlanBlock = vlanBlockStart + '\n   name "' + document.getElementById("vlanName").value + '"' + vlanBlockEnd;
	}
	
	
	
	// Process the IP Address
	// Is there a config line for the IP address?
	var ipLocation = vlanBlock.indexOf("   ip address ");
	if (ipLocation != -1) {
		// Find the config line for "ip address"
		var ipConfig = vlanBlock.substring(ipLocation + 14, vlanBlock.indexOf("\n", ipLocation))
		// are we using a variable for the ip address?
		if (ipConfig.includes("%")) {
			// yes... grabbing the variable name
			var cleanIPAddress = ipConfig.replace(/%/g, "");
			var ipAddressArray = cleanIPAddress.split(" ");
			ipAddressVar = ipAddressArray[0];
			subnetMaskVar = ipAddressArray[1];
			usingVariables = true;
		} else if (document.getElementById("vlanIPAddress").value) {
			// No... will need to modify the template directly - as not using variables for the ip address for this vlan.
			console.log("no ip address variable in use - need to update template directly")
			var newIPAddress = document.getElementById("vlanIPAddress").value + " " + document.getElementById("vlanSubnetMask").value;
			// replace the old untagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(ipConfig, newIPAddress)
		} else {
			// need to remove untagged ports config line
			var lineToRemove = vlanBlock.substring(ipLocation, vlanBlock.indexOf("\n", ipLocation))
			vlanBlock = vlanBlock.replace(lineToRemove+"\n", "   no ip address\n")
		}
	} else if (document.getElementById("vlanIPAddress").value) {
		// VLAN currently doesn't have a config for an IP address
		var exitLocation = vlanBlock.indexOf("exit");
		var vlanBlockStart = vlanBlock.substring(0,exitLocation);
		var vlanBlockEnd = vlanBlock.substring(exitLocation);
		// slide the ip address config line in the vlan block
		var newIPAddress = document.getElementById("vlanIPAddress").value + " " + document.getElementById("vlanSubnetMask").value;
		vlanBlock = vlanBlockStart + "ip address " + newIPAddress + "\n   " + vlanBlockEnd;
		vlanBlock = vlanBlock.replace("   no ip address\n", "");
	}
	
	
	
	
	// Process the Untagged Ports
	// Is there a config line for untagged ports?
	var untaggedLocation = vlanBlock.indexOf("   untagged ");
	if (untaggedLocation != -1) {
		// Find the config line for "untagged"
		var untaggedVLANs = vlanBlock.substring(untaggedLocation + 12, vlanBlock.indexOf("\n", untaggedLocation))
		// are we using a variable for the untagged ports?
		if (untaggedVLANs.includes("%")) {
			// yes... grabbing the variable name
			untaggedVar = untaggedVLANs.replace(/%/g, "");
			usingVariables = true;
		} else if (document.getElementById("untaggedPorts").value) {
			// No... will need to modify the template directly - as not using variables for untagged ports for this vlan.
			console.log("no untagged variable in use - need to update template directly")
			var newUntaggedVLANs = document.getElementById("untaggedPorts").value;
			// replace the old untagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(" untagged "+untaggedVLANs, " untagged "+newUntaggedVLANs)
		} else {
			// need to remove untagged ports config line
			var lineToRemove = vlanBlock.substring(untaggedLocation, vlanBlock.indexOf("\n", untaggedLocation))
			vlanBlock = vlanBlock.replace(lineToRemove, "");
		}
	} else if (document.getElementById("untaggedPorts").value) {
		// VLAN currently doesn't have a config for untagged ports and user wants to configure some
		// if tagged VLANs are configured for this port - place the config just before
		var taggedLocation = vlanBlock.indexOf("   tagged");
		if (taggedLocation == -1) {
			// else place it before the exit line
			taggedLocation = vlanBlock.indexOf("exit");
		}
		var vlanBlockStart = vlanBlock.substring(0,taggedLocation);
		var vlanBlockEnd = vlanBlock.substring(taggedLocation);
		// slide the untagged ports config line in the vlan block
		vlanBlock = vlanBlockStart + "   untagged " + document.getElementById("untaggedPorts").value + "\n" + vlanBlockEnd;
	}
	
	
	// Process the Tagged Ports
	// Is there a config line for tagged ports?
	var taggedLocation = vlanBlock.indexOf("   tagged ");
	if (taggedLocation != -1) {
		// Find the config line for "tagged"
		var taggedVLANs = vlanBlock.substring(taggedLocation + 10, vlanBlock.indexOf("\n", taggedLocation))
		// are we using a variable for the tagged ports?
		if (taggedVLANs.includes("%")) {
			// yes... grabbing the variable name
			taggedVar = taggedVLANs.replace(/%/g, "");
			usingVariables = true;
		} else if (document.getElementById("taggedPorts").value) {
			// No... will need to modify the template directly - as not using variables for tagged ports for this vlan.
			console.log("no tagged variable in use - need to update template directly")
			var newTaggedVLANs = document.getElementById("taggedPorts").value;
			// replace the old tagged config line with the new untagged config line
			vlanBlock = vlanBlock.replace(" tagged "+taggedVLANs, " tagged "+newTaggedVLANs)
		} else {
			// need to remove tagged ports config line
			var lineToRemove = vlanBlock.substring(taggedLocation, vlanBlock.indexOf("\n", taggedLocation))
			vlanBlock = vlanBlock.replace(lineToRemove, "");
		}
	} else if (document.getElementById("taggedPorts").value) {
		// VLAN currently doesn't have a config for tagged ports and user wants to configure some
		// put the config in the vlan block - just before the exit command
		if (taggedLocation == -1) {
			taggedLocation = vlanBlock.indexOf("exit");
		}
		var vlanBlockStart = vlanBlock.substring(0,taggedLocation);
		var vlanBlockEnd = vlanBlock.substring(taggedLocation);
		vlanBlock = vlanBlockStart + "untagged " + document.getElementById("untaggedPorts").value + "\n   " + vlanBlockEnd;
	}
	
	/*console.log("Original: ");
	console.log(originalVLANBlock);
	console.log("Modified: ");
	console.log(vlanBlock);*/
	
	// Update the template - Name, IP Address, Tagged & Untagged (if required)
	if (originalVLANBlock !== vlanBlock) {
		switchTemplate = switchTemplate.replace(originalVLANBlock, vlanBlock);
		console.log(switchTemplate);
		
		// Need to write back template to Central
		console.log("writing template "+ currentTemplate + " in group "+ currentGroup);
		showNotification("ca-document-copy", "Modifying template for device...", "bottom", "center", 'warning');

		//console.log(templateText)
		//console.log(btoa(templateText))
		var params = "name="+currentTemplate+"&device_type="+currentTemplateType;
		var settingsPost = {
			"url": getAPIURL() + "/tools/patchFormDataCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": localStorage.getItem('base_url') + "/configuration/v1/groups/"+currentGroup+"/templates?"+params,
				"access_token": localStorage.getItem('access_token'),
				"template": switchTemplate
			})
		}
	
		$.ajax(settingsPost).done(function (response) {
			$('#VLANModal').modal('hide');
			if (response.includes("Success")) {
				showNotification("ca-document-copy", "Switch Template Updated", "bottom", "center", 'success');
				// Update table with modified vlan port data
			} else {
				showNotification("ca-document-copy", "Switch Template Update Failed", "bottom", "center", 'error');
			}
		})
	}
	
	
	
	// Modify the Variables file
	if (usingVariables) {
		showNotification("ca-card-update", "Updating Variables...", "bottom", "center", 'warning');
		var variables = {};
		if (untaggedVar) variables[untaggedVar] = document.getElementById("untaggedPorts").value;
		if (taggedVar) variables[taggedVar] = document.getElementById("taggedPorts").value;
		if (ipAddressVar) variables[ipAddressVar] = document.getElementById("vlanIPAddress").value;
		if (subnetMaskVar && document.getElementById("vlanSubnetMask").value) variables[subnetMaskVar] = document.getElementById("vlanSubnetMask").value;
		console.log(variables)
		// need to pull variables for switch
		var settings = {
			"url": getAPIURL() + "/tools/patchCommand",
			"method": "POST",
			"timeout": 0,
			 "headers": {
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"url": localStorage.getItem('base_url') + "/configuration/v1/devices/"+currentSwitch+"/template_variables",
				"access_token": localStorage.getItem('access_token'),
				"data": JSON.stringify({"total": Object.keys(variables).length, "variables": variables})
			})
		};

		$.ajax(settings).done(function (response) {
			$('#VLANModal').modal('hide')
			if (response.includes("Success")) {
				showNotification("ca-card-update", "VLAN Assignment Updated", "bottom", "center", 'success');
				// Update table with modified vlan port data
			} else {
				showNotification("ca-card-update", "VLAN Assignment Update Failed", "bottom", "center", 'error');
			}
		});
	}
	
	var vlanTable = $('#vlan-table').DataTable();
	var temp = vlanTable.row(currentVLANRow).data();
	temp[1] = document.getElementById("vlanName").value;
	temp[2] = document.getElementById("vlanIPAddress").value;
	temp[3] = document.getElementById("taggedPorts").value;
	temp[4] = document.getElementById("untaggedPorts").value;
	$('#vlan-table').dataTable().fnUpdate(temp,currentVLANRow,undefined,false);
}




/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadSwitchTable() {
	$('#template-switch-table').DataTable().rows().remove();
	$('#vlan-table').DataTable().rows().remove();
	var allSwitches = getSwitches();
	var allGroups = getGroups();
	$.each(allSwitches, function() {
		var templateSwitch = false;
		for (i=0;i<allGroups.length;i++) {
			if ((allGroups[i].group === this.group_name) && (allGroups[i]["template_details"]["Wired"])) templateSwitch = true;
		}
		if (templateSwitch) {
			var device = this;
			var status = "<i class=\"fa fa-circle text-danger\"></i>";
			if (device["status"] == "Up") {
				status = "<i class=\"fa fa-circle text-success\"></i>";
			}
			// Add row to table
			var templateTable = $('#template-switch-table').DataTable();
			templateTable.row.add([
				"<strong>"+device["name"]+"</strong>",
				status,	
				device["ip_address"], 
				device["model"], 
				device["serial"],
				device["firmware_version"],
				device["site"],
				device["group_name"],
				device["macaddr"]
			]);
			
		}
	})
	$('#template-switch-table').DataTable().rows().draw();
	$('#vlan-table').DataTable().rows().draw();
}

function loadVLANUI(vlanID,row) {
	currentVLANRow = row;
	
	var foundVLAN = null;
	for (i=0;i<switchVLANs.length;i++) {
		if (switchVLANs[i].id == vlanID) {
			foundVLAN = switchVLANs[i];
		}
	}
	
	document.getElementById("vlanID").value = foundVLAN.id;
	document.getElementById("vlanName").value = foundVLAN.name;
	document.getElementById("vlanIPAddress").value = foundVLAN.ipaddress;
	document.getElementById("untaggedPorts").value = foundVLAN.untagged_ports.join(",");
	document.getElementById("taggedPorts").value = foundVLAN.tagged_ports.join(",");
	
	$('#VLANModalLink').trigger('click');	
}

function loadCurrentPageGroup() {
	// override on visible page - used as a notification
	groupsLoaded = true;
	if (groupsLoaded && switchesLoaded) loadSwitchTable();
}

function loadCurrentPageSwitch() {
	// override on visible page - used as a notification
	switchesLoaded = true;
	if (groupsLoaded && switchesLoaded) loadSwitchTable();
}


function saveVLANChanges() {
	$.when(getTemplateForSwitch(currentSwitch)).then(function () {
		findVariablesForVlan(document.getElementById("vlanID").value);
	});
}

function checkForUniqueness() {
	if (!document.getElementById("addVlanID").value) return false;
	var foundVLAN = false;
	for (i=0;i<switchVLANs.length;i++) {
		if (switchVLANs[i].id == document.getElementById("addVlanID").value) {
			foundVLAN = true;
		}
	}
	if (foundVLAN) {
        document.getElementById("addVlanID").style.borderColor = "red";
        document.getElementById("addVLANBtn").disabled = true;
        return false;
    } else {
        document.getElementById("addVlanID").style.borderColor = "#E3E3E3";
        document.getElementById("addVLANBtn").disabled = false;
        return true;
    }
}

function addVLAN() {
	if (!checkForUniqueness()) {
		// Either VLAN ID is not unique or isn't filled in
		document.getElementById("addVlanID").style.borderColor = "red";
	}
}
