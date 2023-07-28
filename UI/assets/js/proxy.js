/*
Central Automation v1.10
Updated: 1.30
Used to verify API proxy accessibility and to update the UI Footer
Copyright Aaron Scott (WiFi Downunder) 2023
*/

var api_url = 'Replace with API URL';
var reachableProxies = [];
var proxyNotification;

/* -------------------------------------
	Private vs Public version Check
-------------------------------------- */
function isPublicInstall() {
	return false;
}

/*  ------------------------------------
	API Proxy Functions
-------------------------------------- */

// Added: 1.8.3
function getAPIURL() {
	return api_url;
}

// Added: 1.8.3
// Updated: 1.10
function checkReachability(reachablePromise) {
	if (reachablePromise) proxyNotification = showNotification('ca-api', 'Checking API Proxy reachability...', 'top', 'center', 'primary'); // Only show notification on the page load
	console.log('Checking API Proxy reachability...'); // log in console every time though
	var testingOrder = [api_url];
	var reachabilityCounter = 0;

	reachableProxies = [];

	$('#api-footer').empty();
	$('#api-footer').append('<li><a href="javascript:checkReachability();">API Proxy Accessibility</a></li>');
	$('#api-footer').append('<li><a href="' + api_url + '" target="_blank" id="api-proxy-link"><i id="api-proxy" class="fa fa-circle text-neutral"></i> Local API Proxy</a></li>');

	$.each(testingOrder, function() {
		var settings = {
			url: this + '/reachable',
			method: 'GET',
			timeout: 8000,
			headers: {
				'Content-Type': 'application/json',
			},
		};

		$.ajax(settings).done(function(response, statusText, xhr) {
			reachabilityCounter++;
			if (xhr.status == 200) {
				reachableProxies.push(api_url);
				$(document.getElementById('api-proxy')).removeClass('text-neutral');
				$(document.getElementById('api-proxy')).removeClass('text-danger');
				$(document.getElementById('api-proxy')).addClass('text-success');
			} else {
				$(document.getElementById('api-proxy')).removeClass('text-neutral');
				$(document.getElementById('api-proxy')).removeClass('text-success');
				$(document.getElementById('api-proxy')).addClass('text-danger');
			}

			if (reachabilityCounter == testingOrder.length) {
				if (reachableProxies.length == 0) {
					Swal.fire({
						title: 'Central API connection failed',
						text: 'No API Proxy Servers were reachable',
						icon: 'error',
					});
				}
				if (reachablePromise) reachablePromise.resolve();
			}
			if (reachablePromise && reachableProxies.length != 0) {
				reachablePromise.resolve();
				proxyNotification.close();
			}
		});
	});
	if (reachablePromise) return reachablePromise.promise();
}
