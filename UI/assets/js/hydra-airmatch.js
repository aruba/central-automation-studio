/*
Central Automation v0.1
*/

var runNowCount = 0;
var runNowErrors = 0;
var runNowSingle = false;

var rfEvents = [];
var rfhistory = [];
var staticRadios = [];
var powerLabels =  [];

var fiveChannel;
var twoChannel;
var fivePower;
var twoPower;

var labels2 =  ['1','6','11'];
var labels5 = ['36','40','44','48','52','56','60','64','100','104','108','112','116','120','124','128','132','136','140','144','149','153','157','161','165'];
		

function findAPForRadio(radiomac) {
	// Check APs for radio mac
	var foundDevice = null;
	var aps = getAPs();
	$.each(aps, function () {
		for (var i = 0, len = this.radios.length; i < len; i++) {
  			if (this.radios[i]["macaddr"] === radiomac) {
				foundDevice = this;
				return false; // break  out of the for loop
			}
		}
	});
	
	return foundDevice;
}

function airmatchRunNow() {
	var select = document.getElementById("accountselector");
	var clientID = select.value;
	if (clusterCredentials.length == 1) {
		clientID = clusterCredentials[0]["client_id"];
	}
	if (!clientID) {
		showNotification("ca-c-warning", "Please select an account before running AirMatch", "bottom", "center", 'danger');
	} else {
		runNowCount = 0;
		runNowErrors = 0;
		showNotification("ca-run-shoes", "Running AirMatch...", "bottom", "center", 'info');
		if (clientID === "allAccounts") {
			runNowSingle = false;
			$.each(clusterCredentials, function () {
				clientID = this["client_id"];
				runAirMatchForClientID(clientID);
			})
		} else {
			runNowSingle = true;
			runAirMatchForClientID(clientID);
		}
	}
}

function runAirMatchForClientID(clientID) {
	var settings = {
		"url": api_url + "/tools/postCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/solver/v1/optimization",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		if (response.status != 200) runNowErrors++;
		runNowCount++;
		if (runNowCount >= clusterCredentials.length || runNowSingle) {
			if (runNowErrors == 0) {
				Swal.fire({
				  title: 'Success',
				  text: 'AirMatch was triggered to run now',
				  icon: 'success'
				});
			} else {
				logError(response.status);
				Swal.fire({
				  title: 'Failure',
				  text: 'AirMatch was not able to be triggered to run now',
				  icon: 'error'
				});
			}					
		}
	});
}

function updateAirMatchData() {
	// refresh auth token
	$.when(tokenRefreshForAll()).then(function () {
		showNotification("ca-hotspot", "Getting AirMatch data...", "bottom", "center", 'info');
		// loop through each account
		$.each(clusterCredentials, function (){
			var currentCluster = this;
			// get all the APs for the customer
			$.when(getAPData(currentCluster["client_id"], 0, false)).then(function () {
			
				fiveChannel = Array.apply(null, new Array(labels5.length)).map(Number.prototype.valueOf,0);
				twoChannel = Array.apply(null, new Array(labels2.length)).map(Number.prototype.valueOf,0);
				fivePower = Array.apply(null, new Array(30)).map(Number.prototype.valueOf,0);
				twoPower = Array.apply(null, new Array(30)).map(Number.prototype.valueOf,0);
			
				$('#static-table').DataTable().clear();
				$('#static-table').DataTable().rows().draw();
				staticRadios = [];
					
				$('#rfhistory-table').DataTable().clear();
				$('#rfhistory-table').DataTable().rows().draw();
				rfhistory = [];
				
				$('#rfevents-table').DataTable().clear();
				$('#rfevents-table').DataTable().rows().draw();
				rfEvents = [];
				
				$('#lastrun-table').DataTable().clear();
				$('#lastrun-table').DataTable().rows().draw();
			
				// Grab all data from AirMatch APIs
				getEIRPDistribution(currentCluster["client_id"]);
				getChannelDistribution(currentCluster["client_id"]);
				getRFEvents(currentCluster["client_id"]);
				getAirmatchOptimization(currentCluster["client_id"]);
				getStaticRadios(currentCluster["client_id"]);
				getAirMatchHistory(currentCluster["client_id"]);
			});
		})
	});
}

function getEIRPDistribution(clientID) {
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/telemetry/v1/adv_eirp_distrubution",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		
		// Build labels and sort them
		
		for (let k in response["5ghz"]) {
			var index = powerLabels.indexOf(k);
			if (index == -1) {
				if (k !== "EIRP Static") powerLabels.push(k);
			}
		}
		for (let k in response["2.4ghz"]) {
			var index = powerLabels.indexOf(k);
			if (index == -1) {
				if (k !== "EIRP Static") powerLabels.push(k);
			}
		}
		powerLabels.sort(function(a, b){return a-b});
		
		
		for (let k in response["5ghz"]) {
			var index = powerLabels.indexOf(k);
			if (index != -1) {
				fivePower[index] = response["5ghz"][k];
			}
		}
		for (let k in response["2.4ghz"]) {
			var index = powerLabels.indexOf(k);
			if (index != -1) {
				twoPower[index] = response["2.4ghz"][k];
			}
		}
		
		if(powerLabels.length > 0) {
			var data = {
				labels: powerLabels,
				series: [
					fivePower,
					twoPower
				]
			};

			var options = {
				seriesBarDistance: 10,
				axisX: {
					showGrid: false
				},
				axisY: {
					onlyInteger: true,
					offset: 20
				},
				height: "200px"
			};

			var responsiveOptions = [
				['screen and (max-width: 640px)', {
					seriesBarDistance: 5,
					axisX: {
						labelInterpolationFnc: function(value) {
							return value[0];
						}
					}
				}]
			];
		
			Chartist.Bar('#eirpChart', data, options, responsiveOptions);
        }
	});
}

function getChannelDistribution(clientID) {
	
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/solver/v1/radio_plan",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		
		$.each(response, function() {
			if (this["band"] === "2.4GHz") {
				var index = labels2.indexOf(this["channel"].toString());
				if (index != -1) {
					twoChannel[index] = twoChannel[index]+1;
				}	
			}
			if (this["band"] === "5GHz") {
				var index = labels5.indexOf(this["channel"].toString());
				if (index != -1) {
					fiveChannel[index] = fiveChannel[index]+1;
				}	
			}
		});
		
		var data2 = {
            labels: labels2,
            series: [
                twoChannel
            ]
        };

        var options2 = {
            seriesBarDistance: 10,
            axisX: {
                showGrid: false
            },
            axisY: {
                onlyInteger: true,
                offset: 20
            },
            height: "200px"
        };

        var responsiveOptions2 = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function(value) {
                        return value[0];
                    }
                }
            }]
        ];
        Chartist.Bar('#channelChart2GHz', data2, options2, responsiveOptions2);
        
        
        var data5 = {
            labels: labels5,
            series: [
                fiveChannel
            ]
        };

        var options5 = {
            seriesBarDistance: 10,
            axisX: {
                showGrid: false
            },
            axisY: {
                onlyInteger: true,
                offset: 20
            },
            height: "200px"
        };

        var responsiveOptions5 = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function(value) {
                        return value[0];
                    }
                }
            }]
        ];
        Chartist.Bar('#channelChart5GHz', data5, options5, responsiveOptions5);
	});
}

function getAirmatchOptimization(clientID) {
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/solver/v1/optimization",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		//console.log(response)
		var airMatchEpoch;	
		var two_deployed = false;
		var five_deployed = false;
		var two_improvement = 0;
		var five_improvement = 0;
		var five_num_ap = 0;
		var two_num_ap = 0;
		var five_num_radios = 0;
		var two_num_radios = 0;
		$.each(response, function() {
			
			
			if (!airMatchEpoch) {
				if (this["2.4GHz:1:0"]) airMatchEpoch = this["2.4GHz:1:0"]["timestamp"];
				if (this["5GHz:1:0"]) airMatchEpoch = this["5GHz:1:0"]["timestamp"];
			}
			if (this["2.4GHz:1:0"]) {
				if (this["2.4GHz:1:0"]["timestamp"] >= airMatchEpoch) {
					airMatchEpoch = this["2.4GHz:1:0"]["timestamp"];
					two_deployed = this["2.4GHz:1:0"]["deployed"];
				} 
				two_improvement = this["2.4GHz:1:0"]["meta"]["improvement_percent"];
				two_num_ap = two_num_ap+this["2.4GHz:1:0"]["num_ap"];
				two_num_radios = two_num_radios+this["2.4GHz:1:0"]["num_radio"];
			}
			if (this["5GHz:1:0"]) {
				if (this["5GHz:1:0"]["timestamp"] >= airMatchEpoch) {
					airMatchEpoch = this["5GHz:1:0"]["timestamp"];
					five_deployed = this["5GHz:1:0"]["deployed"];
				}
				five_improvement = this["5GHz:1:0"]["meta"]["improvement_percent"];
				five_num_ap = five_num_ap+this["5GHz:1:0"]["num_ap"];
				five_num_radios = five_num_radios+this["5GHz:1:0"]["num_radio"];
			}
			
			if (airMatchEpoch < 10000000000)
				airMatchEpoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
			var airMatchEpoch = airMatchEpoch + (new Date().getTimezoneOffset() * -1); //for timeZone  
     
			eventTime = new Date(airMatchEpoch);
			var two_deployedState = "Not Deployed";
			if (two_deployed) two_deployedState = "Deployed"
			var five_deployedState = "Not Deployed";
			if (five_deployed) five_deployedState = "Deployed"
			
			var table = $('#lastrun-table').DataTable();
			table.row.add([
				getNameforClientID(clientID), 
				eventTime.toLocaleString(),
				five_deployedState, 
				five_num_ap,
				five_num_radios,
				five_improvement,
				two_deployedState, 
				two_num_ap,
				two_num_radios,
				two_improvement
			]);
			
			$('#lastrun-table').DataTable().rows().draw();
		});
	});
}

function getStaticRadios(clientID) {
	
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/telemetry/v1/static_radio_all",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		
		staticRadios = staticRadios.concat(response);
		$.each(response, function() {
			var reason = "";
			var eventTime = null;
			if (this["chan_reason"] === "AIRMATCH_FREEZE" && this["eirp_reason"] === "AIRMATCH_FREEZE") {
				// frozen channel add to list...
				var chan_epoch = this["chan_timestamp"];
				var eirp_epoch = this["eirp_timestamp"];
				var epoch;
				if (chan_epoch > eirp_epoch) epoch = chan_epoch;
				else epoch = eirp_epoch;
				if (epoch < 10000000000)
					epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
				eventTime = new Date(epoch);
				reason = "Frozen EIRP & Channel";
			} else if (this["chan_reason"] === "AIRMATCH_FREEZE") {
				// frozen channel add to list...
				var chan_epoch = this["chan_timestamp"];
				if (chan_epoch < 10000000000)
					chan_epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var chan_epoch = chan_epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
				eventTime = new Date(chan_epoch);
				reason = "Frozen Channel";
			} else if (this["eirp_reason"] === "AIRMATCH_FREEZE") {
				// frozen channel add to list...
				var eirp_epoch = this["eirp_timestamp"];
				if (eirp_epoch < 10000000000)
					eirp_epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var eirp_epoch = eirp_epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
				eventTime = new Date(eirp_epoch);
				reason = "Frozen EIRP";
			}

			if (reason) {
				var bandwidth = this["bandwidth"].replace("CBW", "") + "MHz"
			
				// Add row to table
				var table = $('#static-table').DataTable();
				table.row.add([
					getNameforClientID(clientID),
					eventTime.toLocaleString(), 
					this["ap_name"],
					reason, 
					this["channel"],
					bandwidth,
					this["eirp"]+"dBm"
				]);
				$('#static-table').DataTable().rows().draw();
			}
		});
	});
}

function getRFEvents(clientID) {
	
	var settings = {
		"url": api_url + "/tools/getCommand",
		"method": "POST",
		"timeout": 0,
		 "headers": {
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"url": getbaseURLforClientID(clientID) + "/airmatch/telemetry/v1/rf_events_all",
			"access_token": getAccessTokenforClientID(clientID)
		})
	};

	$.ajax(settings).done(function (response) {
		rfEvents = rfEvents.concat(response);
		
		$.each(response, function() {
			if (this["mac"]) {
				foundAP = findAPForRadio(this["mac"]);
				var epoch = this["timestamp"];
				if (epoch < 10000000000)
					epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
				var epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
				var eventTime = new Date(epoch);
		
				var bandwidth = this["new_bandwidth"].replace("CBW", "") + "MHz"
				// Add row to table
				var table = $('#rfevents-table').DataTable();
				table.row.add([
					getNameforClientID(clientID),
					eventTime.toLocaleString(), 
					foundAP["name"],
					titleCase(noUnderscore(this["type"])), 
					this["new_channel"],
					bandwidth
				]);
			}
		});
		$('#rfevents-table').DataTable().rows().draw();
	});
}

function getAirMatchHistory(clientID) {
	
	var aps = getAPs();
	$.each(aps, function () {
		if (this.client_id === clientID) {
			for (var i = 0, len = this.radios.length; i < len; i++) {
				//console.log(this.radios[i])
		
				var url = getbaseURLforClientID(clientID) + "/airmatch/telemetry/v1/history/"+this.radios[i]["macaddr"];
				if (this.radios[i].band == 0) url = url+"/5GHz"
				else url = url+"/2.4GHz"
		
				var settings = {
					"url": api_url + "/tools/getCommand",
					"method": "POST",
					"timeout": 0,
					 "headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify({
						"url": url,
						"access_token": getAccessTokenforClientID(clientID)
					})
				};
	
	

				$.ajax(settings).done(function (response) {
				
					rfhistory = rfhistory.concat(response);
					//console.log(response)
		
					$.each(response, function() {
						foundAP = findAPForRadio(this["mac"]);
						var epoch = this["timestamp"];
						if (epoch < 10000000000)
							epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
						var epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
						var eventTime = new Date(epoch);
			
						var newBandwidth = this.new["bw"].replace("CBW", "") + "MHz"
						var oldBandwidth = this.old["bw"].replace("CBW", "") + "MHz"
						// Add row to table
						var table = $('#rfhistory-table').DataTable();
						table.row.add([
							getNameforClientID(clientID),
							eventTime.toLocaleString(),
							foundAP["name"],
							this.new["chan"],
							this.new["eirp"]+"dBm",
							newBandwidth,
							this.old["chan"],
							this.old["eirp"]+"dBm",
							oldBandwidth,
							titleCase(noUnderscore(this["reason"])),
						]);
					});
					$('#rfhistory-table').DataTable().rows().draw();
				});
			}
		}
	});
}