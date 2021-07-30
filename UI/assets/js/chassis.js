/*
Central Automation v1.4b
© Aaron Scott (WiFi Downunder) 2021
*/

var switchVLANs = [];
var currentSwitch = "";
var switchVariables = {};

var updateCounter = 0;
var errorCounter = 0;
var variableCounter = 0;




/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Chassis Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


function getVLANs(offset, currentSerial) {
	currentSwitch = currentSerial;
	if (offset == 0) {
		switchVLANs = [];
		$('#vlan-table').DataTable().rows().remove();
	}
	var settings = {
		"url": api_url + "/tools/getCommand",
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
	
	var settings = {
		"url": api_url + "/tools/getCommand",
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
			var currentGroup = data[currentSerial]["group_name"];
			var currentTemplate = data[currentSerial]["template_name"];
			console.log(currentTemplate);
			
			showNotification("ca-document-copy", "Getting template for device...", "bottom", "center", 'info');
				
			var settings = {
				"url": api_url + "/tools/getCommand",
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
				} else if (response.resultBody) {
					switchTemplate = response.resultBody;
					findVariablesForVlan(response.resultBody, document.getElementById("vlanID").value);
				}
			})
		}
	})
}

function findVariablesForVlan(switchTemplate, vlanID) {
	console.log(switchTemplate);
	console.log(vlanID);
}




/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		UI Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


function loadVLANUI(vlanID) {
	var foundVLAN = null;
	for (i=0;i<switchVLANs.length;i++) {
		if (switchVLANs[i].id == vlanID) {
			foundVLAN = switchVLANs[i];
		}
	}
	
	document.getElementById("vlanID").value = foundVLAN.id;
	document.getElementById("vlanName").value = foundVLAN.name;
	document.getElementById("untaggedPorts").value = foundVLAN.untagged_ports.join(",");
	document.getElementById("taggedPorts").value = foundVLAN.tagged_ports.join(",");
	
	$('#VLANModalLink').trigger('click');	
}

function saveVLANChanges() {
	getTemplateForSwitch(currentSwitch);
}

function loadSwitchesTable() {
	$('#template-switch-table').DataTable().rows().remove();
	var allSwitches = getSwitches();
	$.each(allSwitches, function() {
		if (switchVariables[this.serial]) {
			var device = this;
			// is a template switch
			if (device["status"] != "Up") downSwitchCount++;
			var status = "<i class=\"fa fa-circle text-danger\"></i>";
			if (device["status"] == "Up") {
				status = "<i class=\"fa fa-circle text-success\"></i>";
			}
			
			var checkBtn = '<button class="btn btn-round btn-sm btn-info" onclick="checkTemplateVariable(\''+device["serial"]+'\')">Verify</button>'
			
			// Add row to table
			var table = $('#template-switch-table').DataTable();
			table.row.add([
				"<strong>"+device["name"]+"</strong>",
				status,	
				device["ip_address"], 
				device["model"], 
				device["serial"],
				device["site"],
				device["group_name"],
				device["macaddr"],
				checkBtn
			]);
			
		}
	})
	$('#template-switch-table').DataTable().rows().draw();
}

function loadVerifyUI(missingVariables, extraVariables, switchSerial) {
	
	document.getElementById("switchSerial").value = switchSerial;
	document.getElementById("missingText").value = missingVariables.join('\n');
	document.getElementById("extraText").value = extraVariables.join('\n');
	
	$('#VerifyModalLink').trigger('click');	
}





/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Sync Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function syncVariables() {
	var commanderVariables = switchVariables[document.getElementById("stackCommander").value];
	var currentStackId = document.getElementById("stackId").value;
	variableCounter = 0;
	$.each(stackSwitches[currentStackId], function() {
		var currentSerial = this.serial;
		if (currentSerial !== document.getElementById("stackCommander").value) {
			// merge the other device serial and mac into the commander variables
			var newVariables = commanderVariables;
			newVariables["_sys_serial"] = currentSerial;
			newVariables["_sys_lan_mac"] = this.macaddr;
			
			// Push the variables to Central for the member switch
			var settingsPost = {
				"url": api_url + "/tools/patchCommand",
				"method": "POST",
				"timeout": 0,
				 "headers": {
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"url": localStorage.getItem('base_url') + "/configuration/v1/devices/" + currentSerial + "/template_variables",
					"access_token": localStorage.getItem('access_token'),
					"data": JSON.stringify({"variables": newVariables})
				})
			}
		
			$.ajax(settingsPost).done(function (response) {
				variableCounter++;
				if (response !== "Success") {
					logError(response.description);
					errorCounter++;
				}
				checkIfVariablesComplete(currentStackId);
			})
		}
	})
}


function checkIfVariablesComplete(stack_id) {
	if (variableCounter == stackSwitches[stack_id].length -1) {
		if (errorCounter != 0) {
			showLog()
			Swal.fire({
			  title: 'Syncing Failure',
			  text: 'Some or all member switch variables failed to be synced',
			  icon: 'error'
			});	
		} else {
			Swal.fire({
			  title: 'Syncing Success',
			  text: 'All stack member switch variables were synced with the Commander',
			  icon: 'success'
			});
		}
	}
}



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Variable vs Template Check Functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkTemplateVariable(currentSerial) {
	var allSwitches = getSwitches();
	var currentVariables = switchVariables[currentSerial];
	
	var settings = {
		"url": api_url + "/tools/getCommand",
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
			var currentGroup = data[currentSerial]["group_name"];
			var currentTemplate = data[currentSerial]["template_name"];
			console.log(currentTemplate);
			
			showNotification("ca-document-copy", "Getting template for device...", "bottom", "center", 'info');
				
			var settings = {
				"url": api_url + "/tools/getCommand",
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
				} else if (response.resultBody) {
					var templateVariables = findVariablesInTemplate(response.resultBody)
					var currentVariableKeys = (Object.keys(currentVariables))
					var missingVariables = [];
					var extraVariables = [];
					$.each(templateVariables, function() {
						if (!currentVariableKeys.includes(String(this))) missingVariables.push(String(this));
					})
					$.each(currentVariableKeys, function() {
						var stringKey = String(this)
						if (!templateVariables.includes(stringKey) && stringKey !== "_sys_serial" && stringKey !== "_sys_lan_mac") extraVariables.push(String(this));
					})
					
					loadVerifyUI(missingVariables, extraVariables, currentSerial)
				}
				
			})
		}
	})
}

function findVariablesInTemplate(template) {
	var matches = template.match(/(?<=\%).+?(?=\%)/g);
	var variables = [];
	$.each(matches, function() {
		var possibleVariable = String(this)
		if (!possibleVariable.includes("else") && !possibleVariable.includes("endif") && possibleVariable !== " ") {
			if (possibleVariable.includes("if ")) possibleVariable = possibleVariable.replace("if ","");
			if (possibleVariable.includes("=")) possibleVariable = possibleVariable.substr(0, possibleVariable.indexOf('='));
			possibleVariable = possibleVariable.trim();
			if (!variables.includes(possibleVariable)) variables.push(possibleVariable)
		}
	})
	return variables;
}
