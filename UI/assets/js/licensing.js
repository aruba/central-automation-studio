/*
Central Automation v1.13
Updated: 
Copyright Aaron Scott (WiFi Downunder) 2022
*/

var keys = [];
var failedAuth = false;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Build Subscription Table
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getLicensingData() {
	keys = [];

	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/stats?license_type=all',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/licensing/v1/subscriptions/stats)');
			}
		} else if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
		} else if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					if (!failedAuth) {
						failedAuth = true;
						getLicensingData();
					}
				});
			}
		} else if (response.total) {
			failedAuth = false;
			if (document.getElementById('total_count')) {
				document.getElementById('total_count').innerHTML = response.total;
				$(document.getElementById('total_icon')).removeClass('text-warning');
				$(document.getElementById('total_icon')).addClass('text-primary');
			}

			if (document.getElementById('available_count')) {
				document.getElementById('available_count').innerHTML = response.available;
				if (response.available > 0) {
					$(document.getElementById('available_icon')).addClass('text-success');
					$(document.getElementById('available_icon')).removeClass('text-warning');
					$(document.getElementById('available_icon')).removeClass('text-danger');
				} else {
					$(document.getElementById('available_icon')).removeClass('text-success');
					$(document.getElementById('available_icon')).addClass('text-warning');
					$(document.getElementById('available_icon')).removeClass('text-danger');
				}
			}

			if (document.getElementById('used_count')) {
				document.getElementById('used_count').innerHTML = response.used;
				$(document.getElementById('used_icon')).removeClass('text-warning');
				$(document.getElementById('used_icon')).addClass('text-success');
			}

			if (document.getElementById('unsub_count')) {
				document.getElementById('unsub_count').innerHTML = response.non_subscribed_devices;
				if (response.non_subscribed_devices > 0) {
					$(document.getElementById('unsub_icon')).removeClass('text-success');
					$(document.getElementById('unsub_icon')).removeClass('text-warning');
					$(document.getElementById('unsub_icon')).addClass('text-danger');
				} else {
					$(document.getElementById('unsub_icon')).addClass('text-success');
					$(document.getElementById('unsub_icon')).removeClass('text-warning');
					$(document.getElementById('unsub_icon')).removeClass('text-danger');
				}
			}

			if (document.getElementById('expiry_count')) {
				document.getElementById('expiry_count').innerHTML = response.expiring;
				if (response.expiring > 0) {
					$(document.getElementById('expiry_icon')).removeClass('text-success');
					$(document.getElementById('expiry_icon')).addClass('text-warning');
					$(document.getElementById('expiry_icon')).removeClass('text-danger');
				} else {
					$(document.getElementById('expiry_icon')).addClass('text-success');
					$(document.getElementById('expiry_icon')).removeClass('text-warning');
					$(document.getElementById('expiry_icon')).removeClass('text-danger');
				}
			}
		}
	});

	var settings = {
		url: getAPIURL() + '/tools/getCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		// Empty the table
		$('#subscription-table')
			.DataTable()
			.rows()
			.remove();

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/licensing/v1/subscriptions)');
			} else if (response.status === '401') {
				// Access Token expired - get a new one and try again.
				authPromise = new $.Deferred();
				$.when(authRefresh(authPromise)).then(function() {
					getLicensingData();
				});
			}
		} else if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
		} else {
			var table = $('#subscription-table').DataTable();
			$.each(response.subscriptions, function() {
				// Add row to table
				keys.push(this);
				var status = '<span data-toggle="tooltip" data-placement="top" title="' + titleCase(this.status) + '"><i class="fa fa-circle text-danger"></i></span>';
				if (this.status === 'OK') {
					var today = moment();
					var endDate = moment(this.end_date);
					if (today.isBefore(endDate) && endDate.diff(today, 'days') <= 30) {
						status = '<span data-toggle="tooltip" data-placement="top" title="Expiring Within 30 days"><i class="fa fa-circle text-warning"></i></span>';
						showNotification('ca-license-key', 'Subscription Key <strong>' + this.subscription_key + '</strong> expiring soon...', 'bottom', 'center', 'warning');
					} else {
						status = '<span data-toggle="tooltip" data-placement="top" title="' + this.status + '"><i class="fa fa-circle text-success"></i></span>';
					}
				}

				var subType = this.subscription_type;
				if (subType === 'EVAL') subType = 'Evaluation';
				else if (subType === 'NONE') subType = 'Paid';

				table.row.add(['<strong>' + this.subscription_key + '</strong>', subType, status, this.license_type, this.quantity, '<span style="display:none;">' + this.start_date + '</span>' + moment(this.start_date).format('L'), '<span style="display:none;">' + this.end_date + '</span>' + moment(this.end_date).format('L')]);
			});
		}

		$('#subscription-table')
			.DataTable()
			.rows()
			.draw();

		$('[data-toggle="tooltip"]').tooltip();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadSubscriptionKeys() {
	csvData = buildCSVData();

	var csv = Papa.unparse(csvData);

	var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

	var csvURL = window.URL.createObjectURL(csvBlob);

	var csvLink = document.createElement('a');
	csvLink.href = csvURL;

	var table = $('#subscription-table').DataTable();
	var filter = table.search();
	if (filter !== '') csvLink.setAttribute('download', 'subscriptionKeys-' + filter.replace(/ /g, '_') + '.csv');
	else csvLink.setAttribute('download', 'subscriptionKeys.csv');

	csvLink.click();
	window.URL.revokeObjectURL(csvLink);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Build CSV with any required changes (group or site action)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function buildCSVData() {
	//CSV header
	var subKey = 'SUBSCRIPTION KEY';
	var subTypeKey = 'SUBSCRIPTION TYPE';
	var statusKey = 'STATUS';
	var licenseTypeKey = 'LICENSE TYPE';
	var qtyKey = 'QUANTITY';
	var startKey = 'START DATE';
	var endKey = 'END DATE';

	var csvDataBuild = [];

	var table = $('#subscription-table').DataTable();
	var filteredRows = table.rows({ filter: 'applied' });
	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var subscription = keys[this.toString()];
		var subType = subscription['subscription_type'];
		if (subType === 'EVAL') subType = 'Evaluation';
		else if (subType === 'NONE') subType = 'Paid';
		csvDataBuild.push({ [subKey]: subscription['subscription_key'], [subTypeKey]: subType, [statusKey]: titleCase(subscription['status']), [licenseTypeKey]: subscription['license_type'], [qtyKey]: subscription['quantity'], [startKey]: moment(subscription['start_date']).format('L'), [endKey]: moment(subscription['end_date']).format('L') });
	});

	return csvDataBuild;
}
