/*
Central Automation v1.3
© Aaron Scott (WiFi Downunder) 2021
*/



/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Client functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateClientGraphs() {
	var count11k = 0;
	var kClients = [];
	var count11v = 0;
	var vClients = [];
	var count11r = 0;
	var rClients = [];
	var count11ax = 0;
	var axClients = [];
	var count11ac = 0;
	var acClients = [];
	var count11gn = 0;
	var gnClients = [];
	var count11an = 0;
	var anClients = [];
	var count5Ghz = 0;
	var clients2 = [];
	var clients5 = [];
	var countMACAuth = 0;
	var countDot1X = 0;
	var countNoAuth = 0;
	var countMACAuth2 = 0;
	var countDot1X2 = 0;
	var countNoAuth2 = 0;
	var countMACAuthW = 0;
	var countDot1XW = 0;
	var countNoAuthW = 0;
	var macClients = [];
	var dot1XClients = [];
	var noAuthClients = [];
	var macClients2 = [];
	var dot1XClients2 = [];
	var noAuthClients2 = [];
	var macClientsW = [];
	var dot1XClientsW = [];
	var noAuthClientsW = [];
	var wirelessClients = getWirelessClients();
	var wiredClients = getWiredClients();

		
	$.each(wirelessClients, function() {
		if (this.connection) {
			if (this.connection.includes("802.11k")) {
				count11k++;
				kClients.push(this);
			}
			if (this.connection.includes("802.11v")) {
				count11v++;
				vClients.push(this);
			}
			if (this.connection.includes("802.11r")) {
				count11r++;
				rClients.push(this);
			}
			if (this.connection.includes("802.11ax")) {
				count11ax++;
				axClients.push(this);
			}
			if (this.connection.includes("802.11ac")) {
				count11ac++;
				acClients.push(this);
			}
			if (this.connection.includes("802.11gn")) {
				count11gn++;
				gnClients.push(this);
			}
			if (this.connection.includes("802.11an")) {
				count11an++;
				anClients.push(this);
			}
			if (this.authentication_type) {
				if (this.band == 5) {
					count5Ghz++;
					clients5.push(this);
					if (this.authentication_type.includes("MAC")) {
						countMACAuth++; 
						macClients.push(this);
					}
					if (this.authentication_type.includes("DOT1X")) {
						countDot1X++; 
						dot1XClients.push(this);
					}
					if (this.authentication_type.includes("No Authentication")) {
						countNoAuth++; 
						noAuthClients.push(this);
					}
				} else {
					clients2.push(this);
					if (this.authentication_type.includes("MAC")) {
						countMACAuth2++; 
						macClients.push(this);
					}
					if (this.authentication_type.includes("DOT1X")) {
						countDot1X2++; 
						dot1XClients2.push(this);
					}
					if (this.authentication_type.includes("No Authentication")) {
						countNoAuth2++; 
						noAuthClients2.push(this);
					}
				}
			} else {
				if (this.band == 5) {
					clients5.push(this);
					countNoAuth++;
					noAuthClients.push(this);
				} else {
					clients2.push(this);
					countNoAuth2++;
					noAuthClients2.push(this);
				}
			}
		}
	});
	
	$.each(wiredClients, function() {
		if (this.authentication_type) {
			if (this.authentication_type.includes("MAC")) {
				countMACAuthW++; 
				macClients.push(this);
			}
			if (this.authentication_type.includes("DOT1X")) {
				countDot1XW++; 
				dot1XClients.push(this);
			}
			if (this.authentication_type.includes("No Authentication")) {
				countNoAuthW++; 
				noAuthClients.push(this);
			}
		} else {
			countNoAuthW++;
			noAuthClients.push(this);
		}
	});
	
	percentage11k = Math.round((count11k/wirelessClients.length)*100);
	Chartist.Pie('#chart11k', {
	  labels: [percentage11k+'%',''],
	  series: [percentage11k, 100-percentage11k]
	});
	
	percentage11v = Math.round((count11v/wirelessClients.length)*100);
	Chartist.Pie('#chart11v', {
	  labels: [percentage11v+'%',''],
	  series: [percentage11v, 100-percentage11v]
	});
	
	percentage11r = Math.round((count11r/wirelessClients.length)*100);
	Chartist.Pie('#chart11r', {
	  labels: [percentage11r+'%',''],
	  series: [percentage11r, 100-percentage11r]
	});
	
	percentageBand = Math.round((count5Ghz/wirelessClients.length)*100);
	bandLeft = 100-percentageBand;
	Chartist.Pie('#chartBand', {
	  labels: [percentageBand+'%',bandLeft+'%'],
	  series: [percentageBand, bandLeft]
	});
	
	percentage11ax = Math.round((count11ax/wirelessClients.length)*100);
	percentage11ac = Math.round((count11ac/wirelessClients.length)*100);
	percentage11gn = Math.round((count11gn/wirelessClients.length)*100);
	percentage11an = Math.round((count11an/wirelessClients.length)*100);
	Chartist.Pie('#chart11', {
	  labels: [percentage11ax+'%', percentage11ac+'%',percentage11gn+'%',percentage11an+'%'],
	  series: [percentage11ax, percentage11ac, percentage11gn, percentage11an]
	});
	
	
	var barOptions = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false
		},
		height: '250px',
	};


	Chartist.Bar('#chartAuth', {
	  labels: ['None', 'MAC Auth','802.1X'],
	  series: [[countNoAuth, countMACAuth, countDot1X],[countNoAuth2, countMACAuth2, countDot1X2], [countNoAuthW, countMACAuthW, countDot1XW]]
	},barOptions);

}
