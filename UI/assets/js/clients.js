/*
Central Automation v1.4.5
Updated: 1.12.3
Aaron Scott (WiFi Downunder) 2022
*/

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Client functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateClientGraphs() {
	var countRandomMAC = 0;
	var randomMACClients = [];
	var actualMACClients = [];
	var count11k = 0;
	var kClients = [];
	var noKClients = [];
	var count11v = 0;
	var vClients = [];
	var noVClients = [];
	var count11r = 0;
	var rClients = [];
	var noRClients = [];
	var count11ax = 0;
	var axClients = [];
	var count11ac = 0;
	var acClients = [];
	var count11gn = 0;
	var gnClients = [];
	var count11an = 0;
	var anClients = [];
	var count2Ghz = 0;
	var count5Ghz = 0;
	var count6Ghz = 0;
	var clients2 = [];
	var clients5 = [];
	var clients6 = [];
	var countMACAuth = 0;
	var countDot1X = 0;
	var countNoAuth = 0;
	var countMACAuth2 = 0;
	var countDot1X2 = 0;
	var countNoAuth2 = 0;
	var countMACAuth6 = 0;
	var countDot1X6 = 0;
	var countNoAuth6 = 0;
	var countMACAuthW = 0;
	var countDot1XW = 0;
	var countNoAuthW = 0;
	var macClients = [];
	var dot1XClients = [];
	var noAuthClients = [];
	var macClients2 = [];
	var dot1XClients2 = [];
	var noAuthClients2 = [];
	var macClients6 = [];
	var dot1XClients6 = [];
	var noAuthClients6 = [];
	var macClientsW = [];
	var dot1XClientsW = [];
	var noAuthClientsW = [];
	var osType = {};
	var maxOSLimit = 10;
	var wirelessClients = getWirelessClients();
	var wiredClients = getWiredClients();

	// Get stats for wireless clients
	$.each(wirelessClients, function() {
		if (this.connection) {
			// Randomized MAC?
			if (this.macaddr.charAt(1) === '2' || this.macaddr.charAt(1) === '6' || this.macaddr.charAt(1) === 'a' || this.macaddr.charAt(1) === 'e') {
				countRandomMAC++;
				randomMACClients.push(this);
			} else {
				actualMACClients.push(this);
			}

			// 11k/v/r
			if (this.connection.includes('802.11k')) {
				count11k++;
				kClients.push(this);
			} else {
				noKClients.push(this);
			}
			if (this.connection.includes('802.11v')) {
				count11v++;
				vClients.push(this);
			} else {
				noVClients.push(this);
			}
			if (this.connection.includes('802.11r')) {
				count11r++;
				rClients.push(this);
			} else {
				noRClients.push(this);
			}

			// Standard Split
			if (this.connection.includes('802.11ax')) {
				count11ax++;
				axClients.push(this);
			}
			if (this.connection.includes('802.11ac')) {
				count11ac++;
				acClients.push(this);
			}
			if (this.connection.includes('802.11gn')) {
				count11gn++;
				gnClients.push(this);
			}
			if (this.connection.includes('802.11an')) {
				count11an++;
				anClients.push(this);
			}

			// Authentication splits per band
			if (this.authentication_type) {
				if (this.band == 5) {
					count5Ghz++;
					clients5.push(this);
					if (this.authentication_type.includes('MAC')) {
						countMACAuth++;
						macClients.push(this);
					}
					if (this.authentication_type.includes('DOT1X')) {
						countDot1X++;
						dot1XClients.push(this);
					}
					if (this.authentication_type.includes('No Authentication')) {
						countNoAuth++;
						noAuthClients.push(this);
					}
				} else if (this.band == 6) {
					count6Ghz++;
					clients6.push(this);
					if (this.authentication_type.includes('MAC')) {
						countMACAuth6++;
						macClients6.push(this);
					}
					if (this.authentication_type.includes('DOT1X')) {
						countDot1X6++;
						dot1XClients6.push(this);
					}
					if (this.authentication_type.includes('No Authentication')) {
						countNoAuth6++;
						noAuthClients6.push(this);
					}
				} else {
					count2Ghz++;
					clients2.push(this);
					if (this.authentication_type.includes('MAC')) {
						countMACAuth2++;
						macClients2.push(this);
					}
					if (this.authentication_type.includes('DOT1X')) {
						countDot1X2++;
						dot1XClients2.push(this);
					}
					if (this.authentication_type.includes('No Authentication')) {
						countNoAuth2++;
						noAuthClients2.push(this);
					}
				}
			} else {
				if (this.band == 5) {
					count5Ghz++;
					clients5.push(this);
					countNoAuth++;
					noAuthClients.push(this);
				} else if (this.band == 6) {
					count6Ghz++;
					clients6.push(this);
					countNoAuth++;
					noAuthClients6.push(this);
				} else {
					count2Ghz++;
					clients2.push(this);
					countNoAuth2++;
					noAuthClients2.push(this);
				}
			}

			// OS Type
			if (this.os_type !== '--') {
				if (osType[this.os_type]) {
					var osArray = osType[this.os_type];
					osArray.push(this);
					osType[this.os_type] = osArray;
				} else {
					var osArray = [];
					osArray.push(this);
					osType[this.os_type] = osArray;
				}
			}
		}
	});

	// Get stats for wired clients
	$.each(wiredClients, function() {
		if (this.authentication_type) {
			if (this.authentication_type.includes('MAC')) {
				countMACAuthW++;
				macClientsW.push(this);
			}
			if (this.authentication_type.includes('DOT1X')) {
				countDot1XW++;
				dot1XClientsW.push(this);
			}
			if (this.authentication_type.includes('No Authentication')) {
				countNoAuthW++;
				noAuthClientsW.push(this);
			}
		} else {
			countNoAuthW++;
			noAuthClientsW.push(this);
		}

		// OS Type
		if (this.os_type !== '--') {
			if (osType[this.os_type]) {
				var osArray = osType[this.os_type];
				osArray.push(this);
				osType[this.os_type] = osArray;
			} else {
				var osArray = [];
				osArray.push(this);
				osType[this.os_type] = osArray;
			}
		}
	});

	// Build charts only if we have wireless clients
	if (wirelessClients.length > 0) {
		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Randomized MAC chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
		percentageRandomzied = Math.round((countRandomMAC / wirelessClients.length) * 100);
		var percentageActual = 100 - percentageRandomzied;

		labelRandom = percentageRandomzied + '%';
		if (percentageRandomzied == 0) labelRandom = '';
		labelActual = percentageActual + '%';
		if (percentageActual == 0) labelActual = '';

		Chartist.Pie('#chartMAC', {
			labels: [labelRandom, labelActual],
			series: [
				{
					meta: 'randomized',
					value: percentageRandomzied,
				},
				{
					meta: 'actual',
					value: percentageActual,
				},
			],
		});

		$('#chartMAC').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === 'randomized') {
				selectedClients = randomMACClients;
				document.getElementById('selected-title').innerHTML = 'Clients using a randomized MAC Address';
			} else {
				selectedClients = acutalMACClients;
				document.getElementById('selected-title').innerHTML = 'Clients using actual MAC Address';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});

		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		11k chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
		percentage11k = Math.round((count11k / wirelessClients.length) * 100);
		var percentageNoK = 100 - percentage11k;

		labelK = percentage11k + '%';
		if (percentage11k == 0) labelK = '';
		labelNoK = percentageNoK + '%';
		if (percentageNoK == 0) labelNoK = '';

		Chartist.Pie('#chart11k', {
			labels: [labelK, labelNoK],
			//series: [percentage11k, 100-percentage11k]
			series: [
				{
					meta: '11k',
					value: percentage11k,
				},
				{
					meta: 'no11k',
					value: percentageNoK,
				},
			],
		});

		$('#chart11k').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === '11k') {
				selectedClients = kClients;
				document.getElementById('selected-title').innerHTML = 'Clients with 802.11k Support';
			} else {
				selectedClients = noKClients;
				document.getElementById('selected-title').innerHTML = 'Clients without 802.11k Support';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});

		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		11v chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

		percentage11v = Math.round((count11v / wirelessClients.length) * 100);
		percentageNoV = 100 - percentage11v;

		labelV = percentage11v + '%';
		if (percentage11v == 0) labelV = '';
		labelNoV = percentageNoV + '%';
		if (percentageNoV == 0) labelNoV = '';

		Chartist.Pie('#chart11v', {
			labels: [labelV, labelNoV],
			//series: [percentage11v, 100-percentage11v]
			series: [
				{
					meta: '11v',
					value: percentage11v,
				},
				{
					meta: 'no11v',
					value: percentageNoV,
				},
			],
		});

		$('#chart11v').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === '11v') {
				selectedClients = vClients;
				document.getElementById('selected-title').innerHTML = 'Clients with 802.11v Support';
			} else {
				selectedClients = noVClients;
				document.getElementById('selected-title').innerHTML = 'Clients without 802.11v Support';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});

		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		11r chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

		percentage11r = Math.round((count11r / wirelessClients.length) * 100);
		percentageNoR = 100 - percentage11r;

		labelR = percentage11r + '%';
		if (percentage11r == 0) labelR = '';
		labelNoR = percentageNoR + '%';
		if (percentageNoR == 0) labelNoR = '';

		Chartist.Pie('#chart11r', {
			labels: [labelR, labelNoR],
			//series: [percentage11r, 100-percentage11r]
			series: [
				{
					meta: '11r',
					value: percentage11r,
				},
				{
					meta: 'no11r',
					value: percentageNoR,
				},
			],
		});

		$('#chart11r').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === '11r') {
				selectedClients = rClients;
				document.getElementById('selected-title').innerHTML = 'Clients with 802.11r Support';
			} else {
				selectedClients = noRClients;
				document.getElementById('selected-title').innerHTML = 'Clients without 802.11r Support';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});

		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Band split chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

		percentage5 = Math.round((count5Ghz / wirelessClients.length) * 100);
		percentage6 = Math.round((count6Ghz / wirelessClients.length) * 100);
		percentage2 = 100 - percentage5 - percentage6;

		label5 = percentage5 + '%';
		if (percentage5 == 0) label5 = '';
		label6 = percentage6 + '%';
		if (percentage6 == 0) label6 = '';
		label2 = percentage2 + '%';
		if (percentage2 == 0) label2 = '';

		Chartist.Pie('#chartBand', {
			labels: [label6, label5, label2],
			//series: [percentageBand, bandLeft]
			series: [
				{
					meta: '6Ghz',
					value: percentage6,
				},
				{
					meta: '5GHz',
					value: percentage5,
				},
				{
					meta: '2.4GHz',
					value: percentage2,
				},
			],
		});

		$('#chartBand').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === '2.4GHz') {
				selectedClients = clients2;
				document.getElementById('selected-title').innerHTML = '2.4GHz Clients';
			} else if (val === '5GHz') {
				selectedClients = clients5;
				document.getElementById('selected-title').innerHTML = '5GHz Clients';
			} else {
				selectedClients = clients6;
				document.getElementById('selected-title').innerHTML = '6GHz Clients';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});

		/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Standard Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

		percentage11ax = Math.round((count11ax / wirelessClients.length) * 100);
		percentage11ac = Math.round((count11ac / wirelessClients.length) * 100);
		percentage11gn = Math.round((count11gn / wirelessClients.length) * 100);
		percentage11an = Math.round((count11an / wirelessClients.length) * 100);

		labelAX = percentage11ax + '%';
		if (percentage11ax == 0) labelAX = '';
		labelAC = percentage11ac + '%';
		if (percentage11ac == 0) labelAC = '';
		labelGN = percentage11gn + '%';
		if (percentage11gn == 0) labelGN = '';
		labelAN = percentage11an + '%';
		if (percentage11an == 0) labelAN = '';

		Chartist.Pie('#chart11', {
			labels: [labelAX, labelAC, labelGN, labelAN],
			//series: [percentage11ax, percentage11ac, percentage11gn, percentage11an]
			series: [
				{
					meta: '11ax',
					value: percentage11ax,
				},
				{
					meta: '11ac',
					value: percentage11ac,
				},
				{
					meta: '11gn',
					value: percentage11gn,
				},
				{
					meta: '11an',
					value: percentage11an,
				},
			],
		});

		$('#chart11').on('click', '.ct-slice-pie', function() {
			$('#selected-client-table')
				.DataTable()
				.rows()
				.remove();
			var table = $('#selected-client-table').DataTable();
			var selectedClients = [];
			var val = $(this).attr('ct:meta');
			if (val === '11ax') {
				selectedClients = axClients;
				document.getElementById('selected-title').innerHTML = 'Wi-Fi 6 Clients (802.11ax)';
			} else if (val === '11ac') {
				selectedClients = acClients;
				document.getElementById('selected-title').innerHTML = 'Wi-Fi 5 Clients (802.11ac)';
			} else if (val === '11gn') {
				selectedClients = gnClients;
				document.getElementById('selected-title').innerHTML = '802.11g/n Clients';
			} else {
				selectedClients = anClients;
				document.getElementById('selected-title').innerHTML = '802.11a/n Clients';
			}

			$.each(selectedClients, function() {
				var status = '';
				if (!this['health']) {
					status = '<i class="fa fa-circle text-neutral"></i>';
				} else if (this['health'] < 50) {
					status = '<i class="fa fa-circle text-danger"></i>';
				} else if (this['health'] < 70) {
					status = '<i class="fa fa-circle text-warning"></i>';
				} else {
					status = '<i class="fa fa-circle text-success"></i>';
				}
				// Generate clean data for table
				var site = '';
				if (this['site']) site = this['site'];
				var health = '';
				if (this['health']) health = this['health'];
				var associatedDevice_name = '';
				var associatedDevice = findDeviceInMonitoring(this['associated_device']);
				if (associatedDevice) associatedDevice_name = associatedDevice.name;
				var ip_address = '';
				if (this['ip_address']) ip_address = this['ip_address'];
				var vlan = '';
				if (this['vlan']) vlan = this['vlan'];
				var os_type = '';
				if (this['os_type']) os_type = this['os_type'];
				var client_name = '';
				if (this['name']) client_name = this['name'];

				// Make link to Central
				name = encodeURI(client_name);
				var apiURL = localStorage.getItem('base_url');
				var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

				// Add row to table
				table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
			});
			$('#selected-client-table')
				.DataTable()
				.rows()
				.draw();
			$('#SelectedClientModalLink').trigger('click');
		});
	}

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Auth Method / Band Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	var barOptions = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false,
		},
		height: '250px',
		plugins: [Chartist.plugins.tooltip()],
	};

	Chartist.Bar(
		'#chartAuth',
		{
			labels: ['None', 'MAC Auth', '802.1X'],
			//series: [[countNoAuth, countMACAuth, countDot1X],[countNoAuth2, countMACAuth2, countDot1X2], [countNoAuthW, countMACAuthW, countDot1XW]]
			series: [
				[
					{
						meta: '6GHz: No Auth',
						value: countNoAuth6,
					},
					{
						meta: '6GHz: MAC Auth',
						value: countMACAuth6,
					},
					{
						meta: '6GHz: 802.1X',
						value: countDot1X6,
					},
				],
				[
					{
						meta: '5GHz: No Auth',
						value: countNoAuth,
					},
					{
						meta: '5GHz: MAC Auth',
						value: countMACAuth,
					},
					{
						meta: '5GHz: 802.1X',
						value: countDot1X,
					},
				],
				[
					{
						meta: '2.4GHz: No Auth',
						value: countNoAuth2,
					},
					{
						meta: '2.4GHz: MAC Auth',
						value: countMACAuth2,
					},
					{
						meta: '2.4GHz: 802.1X',
						value: countDot1X2,
					},
				],
				[
					{
						meta: 'Wired: No Auth',
						value: countNoAuthW,
					},
					{
						meta: 'Wired: MAC Auth',
						value: countMACAuthW,
					},
					{
						meta: 'Wired: 802.1X',
						value: countDot1XW,
					},
				],
			],
		},
		barOptions
	);

	$('#chartAuth').on('click', '.ct-bar', function() {
		$('#selected-client-table')
			.DataTable()
			.rows()
			.remove();
		var table = $('#selected-client-table').DataTable();
		var selectedClients = [];
		var val = $(this).attr('ct:meta');
		if (val === '5GHz: No Auth') {
			selectedClients = noAuthClients;
			document.getElementById('selected-title').innerHTML = '5GHz clients using no Authentication';
		} else if (val === '5GHz: MAC Auth') {
			selectedClients = macClients;
			document.getElementById('selected-title').innerHTML = '5GHz clients using MAC Authentication';
		} else if (val === '5GHz: 802.1X') {
			selectedClients = dot1XClients;
			document.getElementById('selected-title').innerHTML = '5GHz clients using 802.1X Authentication';
		} else if (val === '2.4GHz: No Auth') {
			selectedClients = noAuthClients2;
			document.getElementById('selected-title').innerHTML = '2.4GHz clients using no Authentication';
		} else if (val === '2.4GHz: MAC Auth') {
			selectedClients = macClients2;
			document.getElementById('selected-title').innerHTML = '2.4GHz clients using MAC Authentication';
		} else if (val === '2.4GHz: 802.1X') {
			selectedClients = dot1XClients2;
			document.getElementById('selected-title').innerHTML = '2.4GHz clients using 802.1X Authentication';
		} else if (val === '6GHz: No Auth') {
			selectedClients = noAuthClients6;
			document.getElementById('selected-title').innerHTML = '6GHz clients using no Authentication';
		} else if (val === '6GHz: MAC Auth') {
			selectedClients = macClients6;
			document.getElementById('selected-title').innerHTML = '6GHz clients using MAC Authentication';
		} else if (val === '6GHz: 802.1X') {
			selectedClients = dot1XClients6;
			document.getElementById('selected-title').innerHTML = '6GHz clients using 802.1X Authentication';
		} else if (val === 'Wired: No Auth') {
			selectedClients = noAuthClientsW;
			document.getElementById('selected-title').innerHTML = 'Wired clients using no Authentication';
		} else if (val === 'Wired: MAC Auth') {
			selectedClients = macClientsW;
			document.getElementById('selected-title').innerHTML = 'Wired clients using MAC Authentication';
		} else if (val === 'Wired: 802.1X') {
			selectedClients = dot1XClientsW;
			document.getElementById('selected-title').innerHTML = 'Wired clients using 802.1X Authentication';
		}

		$.each(selectedClients, function() {
			var status = '';
			if (!this['health']) {
				status = '<i class="fa fa-circle text-neutral"></i>';
			} else if (this['health'] < 50) {
				status = '<i class="fa fa-circle text-danger"></i>';
			} else if (this['health'] < 70) {
				status = '<i class="fa fa-circle text-warning"></i>';
			} else {
				status = '<i class="fa fa-circle text-success"></i>';
			}
			// Generate clean data for table
			var site = '';
			if (this['site']) site = this['site'];
			var health = '';
			if (this['health']) health = this['health'];
			var associatedDevice_name = '';
			var associatedDevice = findDeviceInMonitoring(this['associated_device']);
			if (associatedDevice) associatedDevice_name = associatedDevice.name;
			var ip_address = '';
			if (this['ip_address']) ip_address = this['ip_address'];
			var vlan = '';
			if (this['vlan']) vlan = this['vlan'];
			var os_type = '';
			if (this['os_type']) os_type = this['os_type'];
			var client_name = '';
			if (this['name']) client_name = this['name'];

			// Make link to Central
			name = encodeURI(client_name);
			var apiURL = localStorage.getItem('base_url');
			var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

			// Add row to table
			table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
		});
		$('#selected-client-table')
			.DataTable()
			.rows()
			.draw();
		$('#SelectedClientModalLink').trigger('click');
	});

	/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		OS Type Bar Chart
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

	var barOptions = {
		seriesBarDistance: 10,
		axisX: {
			showGrid: false,
		},
		axisY: {
			onlyInteger: true,
			offset: 30,
		},
		height: 250,
		plugins: [Chartist.plugins.tooltip()],
	};

	// Create osType array
	var items = Object.keys(osType).map(function(key) {
		return [key, osType[key]];
	});

	// Sort the array based on the second element
	items.sort(function(first, second) {
		return second[1].length - first[1].length;
	});

	// Create a new array with only the first "x" items
	var top5os = items.slice(0, maxOSLimit);

	// Build labels and series
	var osLabels = [];
	var osSeries = [];
	$.each(top5os, function() {
		osLabels.push(this[0]);
		osSeries.push({ meta: this[0], value: this[1].length });
	});

	Chartist.Bar(
		'#chartOS',
		{
			labels: osLabels,
			series: [osSeries],
		},
		barOptions
	);

	$('#chartOS').on('click', '.ct-bar', function() {
		$('#selected-client-table')
			.DataTable()
			.rows()
			.remove();
		var table = $('#selected-client-table').DataTable();
		var selectedClients = [];
		var val = $(this).attr('ct:meta');
		selectedClients = osType[val];
		document.getElementById('selected-title').innerHTML = 'Clients running operating system: ' + val;

		$.each(selectedClients, function() {
			var status = '';
			if (!this['health']) {
				status = '<i class="fa fa-circle text-neutral"></i>';
			} else if (this['health'] < 50) {
				status = '<i class="fa fa-circle text-danger"></i>';
			} else if (this['health'] < 70) {
				status = '<i class="fa fa-circle text-warning"></i>';
			} else {
				status = '<i class="fa fa-circle text-success"></i>';
			}
			// Generate clean data for table
			var site = '';
			if (this['site']) site = this['site'];
			var health = '';
			if (this['health']) health = this['health'];
			var associatedDevice_name = '';
			var associatedDevice = findDeviceInMonitoring(this['associated_device']);
			if (associatedDevice) associatedDevice_name = associatedDevice.name;
			var ip_address = '';
			if (this['ip_address']) ip_address = this['ip_address'];
			var vlan = '';
			if (this['vlan']) vlan = this['vlan'];
			var os_type = '';
			if (this['os_type']) os_type = this['os_type'];
			var client_name = '';
			if (this['name']) client_name = this['name'];

			// Make link to Central
			name = encodeURI(client_name);
			var apiURL = localStorage.getItem('base_url');
			var clientURL = centralURLs[0][apiURL] + '/frontend/#/CLIENTDETAIL/' + this['macaddr'] + '?ccma=' + this['macaddr'] + '&cdcn=' + client_name + '&nc=client';

			// Add row to table
			table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, this['macaddr'], ip_address, os_type, associatedDevice_name, site, vlan]);
		});
		$('#selected-client-table')
			.DataTable()
			.rows()
			.draw();
		$('#SelectedClientModalLink').trigger('click');
	});
}
