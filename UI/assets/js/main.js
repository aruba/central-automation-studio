/*
Central Automation v1.x
Last Updated 1.42.5
Aaron Scott (WiFi Downunder) 2023-2024
*/

var showTimingData = false;

var centralURLs = 
	{
		'https://apigw-apacsouth.central.arubanetworks.com': 'https://app-apacsouth.central.arubanetworks.com',
		'https://api-ap.central.arubanetworks.com': 'https://app2-ap.central.arubanetworks.com',
		'https://app1-apigw.central.arubanetworks.com': 'https://app.central.arubanetworks.com',
		'https://apigw-prod2.central.arubanetworks.com': 'https://app-prod2-ui.central.arubanetworks.com',
		'https://apigw-us-east-1.central.arubanetworks.com': 'https://app-us-east-1.central.arubanetworks.com',
		'https://apigw-uswest4.central.arubanetworks.com': 'https://app-uswest4.central.arubanetworks.com',
		'https://apigw-uswest5.central.arubanetworks.com': 'https://app-uswest5.central.arubanetworks.com',
		'https://apigw-ca.central.arubanetworks.com': 'https://app-ca.central.arubanetworks.com',
		'https://apigw.central.arubanetworks.com.cn': 'https://app.central.arubanetworks.com.cn',
		'https://apigw-apaceast.central.arubanetworks.com': 'https://app-apaceast.central.arubanetworks.com',
		'https://eu-apigw.central.arubanetworks.com': 'https://app2-eu.central.arubanetworks.com',
		'https://apigw-eucentral2.central.arubanetworks.com': 'https://app-eucentral2.central.arubanetworks.com',
		'https://apigw-eucentral3.central.arubanetworks.com': 'https://app-eucentral3.central.arubanetworks.com',
		'https://apigw-uaenorth1.central.arubanetworks.com': 'https://app-uaenorth1.central.arubanetworks.com',
		'https://internal-apigw.central.arubanetworks.com': 'https://internal-ui.central.arubanetworks.com',
		'https://apigw-cordelia.arubadev.cloud.hpe.com': 'https://app-cordelia.arubadev.cloud.hpe.com',
		'https://apigw-cmcsa1api.aruba.b4b.comcast.net': 'https://cmcsa1.aruba.b4b.comcast.net',
		'https://apigw-stgthdnaas.central.arubanetworks.com': 'https://app-stgthdnaas.central.arubanetworks.com',
		'https://apigw-thdnaas.central.arubanetworks.com': 'https://app-thdnaas.central.arubanetworks.com',
		COP: 'COP',
	};

function getCentralURLs() {
	return centralURLs;
}

var centralClusters = 
	{
		'US-1': {url: 'https://app1-apigw.central.arubanetworks.com', type: 'Public'},
		'US-2': {url: 'https://apigw-prod2.central.arubanetworks.com', type: 'Public'},
		'US-EAST-1': {url: 'https://apigw-us-east-1.central.arubanetworks.com', type: 'Public'},
		'US-WEST-4': {url: 'https://apigw-uswest4.central.arubanetworks.com', type: 'Public'},
		'US-WEST-5': {url: 'https://apigw-uswest5.central.arubanetworks.com', type: 'Public'},
		'APAC-1': {url: 'https://api-ap.central.arubanetworks.com', type: 'Public'},
		'APAC-EAST1': {url: 'https://apigw-apaceast.central.arubanetworks.com', type: 'Public'},
		'APAC-SOUTH1': {url: 'https://apigw-apacsouth.central.arubanetworks.com', type: 'Public'},
		'EU-1': {url: 'https://eu-apigw.central.arubanetworks.com', type: 'Public'},
		'EU-2': {url: 'https://apigw-eucentral2.central.arubanetworks.com', type: 'Public'},
		'EU-3': {url: 'https://apigw-eucentral3.central.arubanetworks.com', type: 'Public'},
		'Canada-1': {url: 'https://apigw-ca.central.arubanetworks.com', type: 'Public'},
		'CN-North': {url: 'https://apigw.central.arubanetworks.com.cn', type: 'Public'},
		'UAE-North': {url: 'https://apigw-uaenorth1.central.arubanetworks.com', type: 'Public'},
		'Internal': {url: 'https://internal-apigw.central.arubanetworks.com', type: 'Private'},
		'Cordelia':{url: 'https://apigw-cordelia.arubadev.cloud.hpe.com', type: 'Private'},
		'CMCSA1': {url: 'https://apigw-cmcsa1api.aruba.b4b.comcast.net', type: 'Private'},
		'STGTHDNAAS':{url: 'https://apigw-stgthdnaas.central.arubanetworks.com', type: 'Private'},
		'THDNAAS':{url: 'https://apigw-thdnaas.central.arubanetworks.com', type: 'Private'},
		'Central On-Prem': {url: 'COP', type: 'Private'},
	};

var clusterNames = 
	{
		'https://app1-apigw.central.arubanetworks.com': 'US-1',
		'https://apigw-prod2.central.arubanetworks.com': 'US-2',
		'https://apigw-us-east-1.central.arubanetworks.com': 'US-EAST-1',
		'https://apigw-uswest4.central.arubanetworks.com': 'US-WEST4',
		'https://apigw-uswest5.central.arubanetworks.com': 'US-WEST5',
		'https://api-ap.central.arubanetworks.com': 'APAC-1',
		'https://apigw-apaceast.central.arubanetworks.com': 'APAC-EAST1',
		'https://apigw-apacsouth.central.arubanetworks.com': 'APAC-SOUTH1',
		'https://eu-apigw.central.arubanetworks.com': 'EU-1',
		'https://apigw-eucentral2.central.arubanetworks.com': 'EU-2',
		'https://apigw-eucentral3.central.arubanetworks.com': 'EU-3',
		'https://apigw-ca.central.arubanetworks.com': 'Canada-1',
		'https://apigw.central.arubanetworks.com.cn': 'CN-North',
		'https://apigw-uaenorth1.central.arubanetworks.com': 'UAE-North',
		'https://internal-apigw.central.arubanetworks.com': 'Internal',
		'https://apigw-cordelia.arubadev.cloud.hpe.com': 'Cordelia',
		'https://apigw-cmcsa1api.aruba.b4b.comcast.net': 'CMCSA1',
		'https://apigw-stgthdnaas.central.arubanetworks.com':'STGTHDNAAS',
		'https://apigw-thdnaas.central.arubanetworks.com':'THDNAAS',
		COP: 'Central On-Prem',
	};

var antennas = {
	'AP-ANT-311': { type: "Indoor", two: 3, five: 6, six: 6, description:"Tri-band Omni dipole" },
	'AP-ANT-312': { type: "Indoor", two: 3.3, five: 3.3, six: 4.1, description:"Tri-band Low-profile Omni Dipole" },
	'AP-ANT-313': { type: "Indoor", two: 3, five: 6, six: 6, description:"Tri-band Omni dipole" },
	'AP-ANT-320': { type: "Indoor", two: 4, five: 5, six: 5, description:"Tri-Band Low-profile Down-tilt 2x2 Omni" },
	'AP-ANT-325': { type: "Indoor", two: 6.1, five: 6.1, six: 5.4, description:"Tri-Band 90°H x 90°V 2x2 Directional" },
	'AP-ANT-328': { type: "Indoor", two: 7.5, five: 8, six: 8, description:"Tri-Band 60°H x 60°V 2x2 Directional" },
	'AP-ANT-340': { type: "Indoor", two: 4, five: 5, six: 5, description:"Tri-Band Low-profile Down-tilt 4x4 Omni" },
	'AP-ANT-345': { type: "Indoor", two: 6.1, five: 6.1, six: 5.4, description:"Tri-Band 90°H x 90°V 4x4 Directional" },
	'AP-ANT-348': { type: "Indoor", two: 7.5, five: 8, six: 8, description:"Tri-Band 60°H x 60°V 4x4 Directional" },
	'AP-ANT-22': { type: "Indoor", two: 2, five: 4, description:"Dual-Band Small Form Factor Omni" },
	'AP-ANT-25A': { type: "Indoor", two: 5, five: 5, description:"Dual-Band 90°H x 90°V 2x2 Directional" },
	'AP-ANT-28A': { type: "Indoor/Outdoor", two: 7.5, five: 7.5, description:"Dual-Band 60°H x 60°V 3x3 Directional" },
	'AP-ANT-32': { type: "Indoor", two: 2, five: 4, description:"Dual-Band Small Form Factor Omni" },
	'AP-ANT-35A': { type: "Indoor", two: 5, five: 5, description:"Dual-Band 90°H x 90°V 3x3 Directional"  },
	'AP-ANT-38': { type: "Indoor", two: 7.5, five: 7.5, description:"Dual-Band 60°H x 60°V 4x4 Directional" },
	'AP-ANT-40': { type: "Indoor", two: 4, five: 5, description:"Dual-Band Low-profile Down-tilt 4x4 Omni"  },
	'AP-ANT-45': { type: "Indoor/Outdoor", two: 4.5, five: 5.5, description:"Dual-Band 90°H x 90°V 4x4 Directional" },
	'AP-ANT-48': { type: "Indoor/Outdoor", two: 8.5, five: 8.5, description:"Dual-Band 60°H x 60°V 4x4 Directional" },
	'AP-ANT-1W': { type: "Indoor", two: 3.8, five: 5.8, description:"Dual-Band Omni Dipole" },
	'AP-ANT-13B': { type: "Indoor", two: 2.2, five: 4, description:"Dual-Band Down-tilt Omni" },
	'AP-ANT-16': { type: "Indoor", two: 3.9, five: 4.7, description:"Dual-Band Down-tilt 3x3 Omni" },
	'AP-ANT-19': { type: "Indoor/Outdoor", two: 3, five: 6, description:"Dual-Band Omni Dipole" },
	'AP-ANT-20W': { type: "Indoor", two: 2, five: 2, description:"Dual-Band Omni Dipole" },
	'ANT-4x4-D707': { type: "Outdoor", two: 7.5, five: 7.5, description:"Dual-Band 60°H x 60°V 4x4 Directional" },
	'ANT-4x4-5314': { type: "Outdoor", five: 14, description:"5GHz 30°H x 30°V 4x4 Directional" },
	'ANT-4x4-D100': { type: "Outdoor", two: 5, five: 5, description:"Dual-Band 90°H x 90°V 4x4 Directional" },
	'ANT-4x4-D608': { type: "Outdoor", two: 7.5, five: 7.5, description:"Dual-Band 60°H x 60°V 4x4 Directional" },
	'ANT-3X3-D100': { type: "Outdoor", two: 5, five: 5, description:"Dual-Band 90°H x 90°V 3x3 Directional" },
	'ANT-3X3-D608': { type: "Outdoor", two: 7.5, five: 7.5, description:"Dual-Band 60°H x 60°V 3x3 Directional" },
	'ANT-3X3-2005': { type: "Outdoor", two: 5, description:"2.4GHz 5dBi Omni N-type Direct Mount" },
	'ANT-3X3-5005': { type: "Outdoor", five: 5, description:"5GHz 5dBi Omni N-type Direct Mount" },
	'ANT-3X3-5010': { type: "Outdoor", five: 10, description:"5GHz 10dBi Omni N-type Direct Mount" },
	'ANT-3X3-5712': { type: "Outdoor", five: 11.5, description:"5GHz 70°H x 25°V 3x3 Directional" },
	'ANT-2X2-2005': { type: "Outdoor", two: 5, description:"2.4GHz 5dBi Omni N-type Direct Mount" },
	'ANT-2X2-5005': { type: "Outdoor", five: 5, description:"5GHz 5dBi Omni N-type Direct Mount" },
	'ANT-2X2-2314': { type: "Outdoor", two: 14, description:"2.4GHz 30°H x 30°V 2x2 Directional" },
	'ANT-2X2-5010': { type: "Outdoor", five: 10, description:"5GHz 10dBi Omni N-type Direct Mount" },
	'ANT-2X2-5314': { type: "Outdoor", five: 14, description:"5GHz 30°H x 30°V 2x2 Directional" },
	'ANT-2X2-2714': { type: "Outdoor", two: 14, description:"2.4GHz 70°H x 23°V 2x2 Directional" },
};

const networkProtocols = ['HOPOPT','ICMP','IGMP','GGP','IPv4','ST','TCP','CBT','EGP','IGP','BBN-RCC-MON','NVP-II','PUP','ARGUS','EMCON','XNET','CHAOS','UDP','MUX','DCN-MEAS','HMP','PRM','XNS-IDP','TRUNK-1','TRUNK-2','LEAF-1','LEAF-2','RDP','IRTP','ISO-TP4','NETBLT','MFE-NSP','MERIT-INP','DCCP','3PC','IDPR','XTP','DDP','IDPR-CMTP','TP++','IL','IPv6','SDRP','IPv6-Route','IPv6-Frag','IDRP','RSVP','GRE','DSR','BNA','ESP','AH','I-NLSP','SWIPE (deprecated)','NARP','Min-IPv4','TLSP','SKIP','IPv6-ICMP','IPv6-NoNxt','IPv6-Opts','','CFTP','','SAT-EXPAK','KRYPTOLAN','RVD','IPPC','','SAT-MON','VISA','IPCV','CPNX','CPHB','WSN','PVP','BR-SAT-MON','SUN-ND','WB-MON','WB-EXPAK','ISO-IP','VMTP','SECURE-VMTP','VINES','IPTM','NSFNET-IGP','DGP','TCF','EIGRP','OSPFIGP','Sprite-RPC','LARP','MTP','AX.25','IPIP','MICP','SCC-SP','ETHERIP','ENCAP','','GMTP','IFMP','PNNI','PIM','ARIS','SCPS','QNX','A/N','IPComp','SNP','Compaq-Peer','IPX-in-IP','VRRP','PGM','','L2TP','DDX','IATP','STP','SRP','UTI','SMP','SM','PTP','ISIS over IPv4','FIRE','CRTP','CRUDP','SSCOPMCE','IPLT','SPS','PIPE','SCTP','FC','RSVP-E2E-IGNORE','Mobility Header','UDPLite','MPLS-in-IP','manet','HIP','Shim6','WESP','ROHC','Ethernet','AGGFRAG','NSH'];

// Constants
const DeviceType = { AP: 0, Switch: 1, Gateway: 2, Controller: 3};
const ConfigType = { All: 0, IP: 1, Antenna: 2, Width: 3 };
const ScaleType = { Full: 0, Scale: 1, Custom: 2, Group: 3};
const vrfUnits = 'FEET';
const ratio = window.devicePixelRatio;
const colorArray = ['text-info', 'text-danger', 'text-warning', 'text-purple', 'text-success', 'text-primary', 'text-series7', 'text-series8'];
const apColors = ['#23CCEF', '#FB404B', '#FFA534', '#9368E9', '#87CB16', '#1D62F0', '#5E5E5E', '#DD4B39', '#35465c', '#e52d27', '#55acee', '#cc2127', '#1769ff', '#6188e2', '#a748ca', '#ca489f', '#48ca9a', '#95e851', '#f2f536', '#b0b0b0', '#3414b5', '#1498b5', '#b55714', '#e3e3e3', '#851919', '#196385', '#88fceb', '#cafc88'];
const labels2 = ['1', '6', '11'];
const labels5 = ['36', '40', '44', '48', '52', '56', '60', '64', '100', '104', '108', '112', '116', '120', '124', '128', '132', '136', '140', '144', '149', '153', '157', '161', '165', '169', '173', '177'];
const labels6 = ['5', '21', '37', '53', '69', '85', '101', '117', '133', '149', '165', '181', '197', '213', '229'];

const class1Switches = ['R8Q72A', 'JL258A', 'JL693A', 'JL692A'];
const class2Switches = ['S3L77A', 'S3L75A', 'S3L76A'];
const class3Switches = [];
const class4Switches = [];
const class5Switches = [];

var DateTime = luxon.DateTime;

// COP Specific variables
var cop_url = 'https://apigw-';
var cop_central_url = 'https://central-';

var reachableProxies = [];

var forcedTokenRefresh = true;
var $SCRIPT_ROOT = '{{ request.script_root|tojson|safe }}';

var authInProgress = false;
var failedAuth = false;

var csvData;
var csvDataCount = 0;

var apiErrorCount = 0;
var moveCounter = 0;
var devicesToMove = 0;
var addCounter = 0;
var archiveCounter = 0;
var deleteCounter = 0;
var licenseCounter = 0;
var renameCounter = 0;
var zoneCounter = 0;
var radioModeCounter = 0;
var rfCounter = 0;
var swarmCounter = 0;
var poeCounter = 0;
var radioCounter = 0;
var antennaCounter = 0;
var gpsCounter = 0;
var ap1xCounter = 0;
var installCounter = 0;
var ledCounter = 0;
var ipCounter = 0;
var rebootCounter = 0;
var checkedCounter = 0;
var updateVariablesCounter = 0;
var visitorCounter = 0;
var labelCounter = 0;
var gatewayCounter = 0;
var inventoryProgress = 0;
var inventoryAPProgress = 0;
var inventorySwitchProgress = 0;
var inventoryGatewayProgress = 0;


var authPromise;
var inventoryPromise;
var monitoringPromise;
var apPromise;
var switchPromise;
var gatewayPromise;
var controllerPromise;
var groupPromise;
var swarmPromise;
var customerPromise;
var zonePromise;
var rfPromise;
var bssidPromise;
var mspPromise;
var autoLicenseCheckPromise;

var updateCounter = 0;
var updateCount = 0;

var clients = [];
var wirelessClients = [];
var wiredClients = [];
var aps = [];
var bssids = [];
var apInventory = [];
var apInventoryCount = 0;
var switches = [];
var switchInventory = [];
var switchInventoryCount = 0;
var gateways = [];
var gatewayInventory = [];
var gatewayInventoryCount = 0;
var needGatewayDetails = false;
var controllers = [];
var controllerInventory = [];
var controllerInventoryCount = 0;
var deviceType = '';
var sites = [];
var siteCreationCount = 0;
var groups = [];
var groupTemplateInfo = [];
var downAPCount = 0;
var downSwitchCount = 0;
var downGatewayCount = 0;
var downControllerCount = 0;
var siteIssues = 0;
var swarms = [];
var labels = [];
var subscriptionKeys = {};

var mspAPs = [];
var mspAPMonitoring = [];
var mspAPCount = 0;
var mspSwitches = [];
var mspSwitchMonitoring = [];
var mspSwitchCount = 0;
var mspGateways = [];
var mspGatewayMonitoring = [];
var mspGatewayCount = 0;
var mspCustomers = [];
var mspCustomerCount = 0;
var mspID = '';

var rebootedDevices = 0;
var rebootErrors = 0;
var skippedDevices = 0;

var neighborSwitches = {};
var modifiedUISwitches = {};
var renamingCounters = {};
var magicNames = {};
var switchPortDetails = {};

var checkedDevices = {};
var commandCheckCounter = {};
const commandRetries = 5;
var devicesToReboot = [];

var needAntennaConfig = [];

const apiLimit = 1000;
const apiClientLimit = 1000;
const apiAPLimit = 500;
const apiGLCPLimit = 100;
const apiSiteLimit = 1000;
const apiGroupLimit = 20;
const apiMSPLimit = 50;
const apiDelay = 250;
const apiVRFLimit = 100;
const apiLicensingLimit = 50;
const apiLicensingDelay = 500;
var apiMessage = false;

var currentWorkflow = '';
var movePromise;
var autoAddPromise;
var autoArchivePromise;
var autoDeletePromise;
var autoLicensePromise;
var autoGroupPromise;
var autoSitePromise;
var autoRenamePromise;
var autoMagicRenamePromise;
var autoPortPromise;
var autoCustomerPromise;
var autoVariablesPromise;
var autoAntennaPromise;
var autoStaticIPPromise;

var automationTotal;
var automationCounter;

var manualGroup = '';
var manualCustomer = '';

var existingPassphrase = '';
var wlanConfig = {};

var apiLimitNotification;
var authNotification;
var csvNotification;
var apNotification;
var switchNotification;
var gatewayNotification;
var siteNotification;
var groupNotification;
var wirelessNotification;
var wiredNotification;
var vcNotification;
var inventoryNotification;
var expiryNotification;
var customerNotification;
var neighbourNotification
var toolNotification

var automationNotification;
var addNotification;
var renameNotification;
var deleteNotification;
var zoneNotification;
var profileNotification;
var installNotification;
var radioNotification;
var antennaNotification;
var gpsNotification;
var licenseNotification;
var ap1xNotification;
var moveNotification;
var renameNotification;
var rebootNotification;
var configNotification;
var ipNotification;
var visitorNotification;
var siteNotification;
var labelNotification;

var appIDMappings = {};
var webCatMappings = {};

var autoLicenseState = false;

var indexedDB;
var dbRequest;
var db;

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Cluster Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function getAPIGateway(clusterName) {
	var apiURL = centralClusters[clusterName].url;
	return apiURL;
}

function getClusterName(url) {
	var clusterName = clusterNames[url];
	return clusterName;
}

function populateCentralClusters() {
	$('#clusterselector').append($('<option>', { value: '', text: 'Public Clusters', style: 'color: #cccccc;', disabled: true }));
	var addedPrivate = false;
	for (let k in centralClusters) {
		var currentCluster = centralClusters[k]
		
		if ((currentCluster.type === 'Private') && !addedPrivate) {
			$('#clusterselector').append($('<option>', { value: '', text: '─────────', style: 'color: #cccccc;', disabled: true }));
			$('#clusterselector').append($('<option>', { value: '', text: 'Private Clusters', style: 'color: #cccccc;', disabled: true }));
			addedPrivate = true;
		}
		
		if (isPublicInstall() && currentCluster.url === 'COP') {
			// Skip adding the COP value on the public release
		} else {
			$('#clusterselector').append($('<option>', { value: currentCluster.url, text: k }));
		}
	}
}

function isCOPSelected() {
	//console.log(document.getElementById("clusterselector").value)
	if (document.getElementById('clusterselector').value === getAPIGateway('Central On-Prem')) {
		document.getElementById('cop_address_row').hidden = false;
	} else {
		document.getElementById('cop_address_row').hidden = true;
	}
}

function checkUIForCOP() {
	// Check if using COP
	// Hide non-COP supported features e.g. AOS10 only pieces
	var isCOP = localStorage.getItem('is_cop');
	if (isCOP) {
		var x = document.getElementById('airmatch_card');
		if (x) x.hidden = true;
		x = document.getElementById('clientmatch_card');
		if (x) x.hidden = true;
		/*x = document.getElementById('ipam_card');
		if (x) x.hidden = true;*/
		x = document.getElementById('gateway_card');
		if (x) x.hidden = true;
		x = document.getElementById('gateway_stats');
		if (x) x.hidden = true;
		x = document.getElementById('controller_stats');
		if (x) x.hidden = false;
	} else {
		var x = document.getElementById('airmatch_card');
		if (x) x.hidden = false;
		x = document.getElementById('clientmatch_card');
		if (x) x.hidden = false;
		/*x = document.getElementById('ipam_card');
		if (x) x.hidden = false;*/
		x = document.getElementById('gateway_card');
		if (x) x.hidden = false;
		x = document.getElementById('gateway_stats');
		if (x) x.hidden = false;
		x = document.getElementById('controller_stats');
		if (x) x.hidden = true;
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Load and Save from Local Storage & IndexedDB functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Added 1.19
function openIndexedDB() {
	indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

	if (!indexedDB) {
		console.log('IndexedDB could not be found in this browser.');
	}

	dbRequest = indexedDB.open('Central-Automation-Studio-DB', 3);

	dbRequest.onerror = function(event) {
		console.error('An error occurred with IndexedDB');
		console.error(event);
		console.error('Database error: ${event.target.errorCode}');
	};

	dbRequest.onupgradeneeded = function() {
		db = dbRequest.result;
		if (!db.objectStoreNames.contains('general')) {
			// if there's no "general" store
			db.createObjectStore('general', { keyPath: 'key' });
		}
	};

	dbRequest.onsuccess = function() {
		console.log('IndexedDB opened successfully');
		db = dbRequest.result;
	};
}

function saveDataToDB(indexKey, data) {
	const transaction = db.transaction('general', 'readwrite');
	const store = transaction.objectStore('general');
	store.put({ key: indexKey, data: data });
	
	// Update the last collected monitoring data
	localStorage.setItem('monitoring_update', +new Date());
}

function deleteDataFomDB(indexKey) {
	const transaction = db.transaction('general', 'readwrite');
	const store = transaction.objectStore('general');
	const request = store.delete(indexKey);

	request.onsuccess = () => {
		console.log('Data deleted');
	};

	request.onerror = err => {
		console.error('Failed to delete data: ${err}');
	};
}


function loadMonitoringData(refreshrate) {
	// Check if we need to get the latest data - or can we just load it from localStorage
	apiMessage = false;

	if (!localStorage.getItem('monitoring_update')) {
		getMonitoringData();
	} else {
		var lastRefresh = new Date(parseInt(localStorage.getItem('monitoring_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		var diffMinutes = Math.ceil(diffTime / (1000 * 60));
		if (diffMinutes > refreshrate) {
			//console.log("Reading new monitoring data from Central");
			getMonitoringData();
		} else {
			console.log('Reading monitoring data from IndexedDB');
			
			// Are we including Wireless Clients in the monitoring data calls?
			var loadWirelessClients = localStorage.getItem('load_clients');
			if (loadWirelessClients === null || loadWirelessClients === '') {
				loadWirelessClients = true;
			} else {
				loadWirelessClients = JSON.parse(loadWirelessClients);
			}
			console.log('Wireless Client Monitoring: ' + loadWirelessClients);
			
			// Are we including Wired Clients in the monitoring data calls?
			var loadWiredClients = localStorage.getItem('load_clients_wired');
			if (loadWiredClients === null || loadWiredClients === '') {
				loadWiredClients = true;
			} else {
				loadWiredClients = JSON.parse(loadWiredClients);
			}
			console.log('Wired Client Monitoring: ' + loadWiredClients);
			
			if (!loadWirelessClients && !loadWiredClients) {
				// Mark the Client tile in Grey
				if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
				$(document.getElementById('client_icon')).removeClass('text-warning');
				$(document.getElementById('client_icon')).removeClass('text-danger');
				$(document.getElementById('client_icon')).removeClass('text-success');
				$(document.getElementById('client_icon')).addClass('text-neutral');
			} else {
				if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
				$(document.getElementById('client_icon')).addClass('text-warning');
				$(document.getElementById('client_icon')).removeClass('text-danger');
				$(document.getElementById('client_icon')).removeClass('text-success');
				$(document.getElementById('client_icon')).removeClass('text-neutral');
			}
			
			var loadAPs = localStorage.getItem('load_aps');
			if (loadAPs === null || loadAPs === "") {
				loadAPs = true;
			} else {
				loadAPs = JSON.parse(loadAPs)
			}
			
			var loadSwitches = localStorage.getItem('load_switches');
			if (loadSwitches === null || loadSwitches === "") {
				loadSwitches = true;
			} else {
				loadSwitches = JSON.parse(loadSwitches)
			}
			
			var loadDevices = localStorage.getItem('load_devices');
			if (loadDevices === null || loadDevices === "") {
				// do nothing anymore - moved to individual loading of APs and switches
			} else {
				loadDevices = JSON.parse(loadDevices)
				loadAPs = loadDevices;
				loadSwitches = loadDevices;
			}
			
			console.log('AP Monitoring: ' + loadAPs);
			if (!loadAPs) {
				// Mark the Devices tiles in Grey
				if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
				$(document.getElementById('ap_icon')).removeClass('text-warning');
				$(document.getElementById('ap_icon')).removeClass('text-danger');
				$(document.getElementById('ap_icon')).removeClass('text-success');
				$(document.getElementById('ap_icon')).addClass('text-neutral');
			} else {
				if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
				$(document.getElementById('ap_icon')).addClass('text-warning');
				$(document.getElementById('ap_icon')).removeClass('text-danger');
				$(document.getElementById('ap_icon')).removeClass('text-success');
				$(document.getElementById('ap_icon')).removeClass('text-neutral');
			}
			
			console.log('Switch Monitoring: ' + loadSwitches);
			if (!loadSwitches) {
				// Mark the Devices tiles in Grey				
				if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
				$(document.getElementById('switch_icon')).removeClass('text-warning');
				$(document.getElementById('switch_icon')).removeClass('text-danger');
				$(document.getElementById('switch_icon')).removeClass('text-success');
				$(document.getElementById('switch_icon')).addClass('text-neutral');
			} else {
				if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
				$(document.getElementById('switch_icon')).addClass('text-warning');
				$(document.getElementById('switch_icon')).removeClass('text-danger');
				$(document.getElementById('switch_icon')).removeClass('text-success');
				$(document.getElementById('switch_icon')).removeClass('text-neutral');
			}
			
			var loadGateways = localStorage.getItem('load_gateways');
			if (loadGateways === null || loadGateways === '') {
				loadGateways = true;
			} else {
				loadGateways = JSON.parse(loadGateways);
			}
			console.log('Gateway Monitoring: ' + loadGateways);
			if (!loadGateways) {
				// Mark the Devices tiles in Grey				
				if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
				$(document.getElementById('gateway_icon')).removeClass('text-warning');
				$(document.getElementById('gateway_icon')).removeClass('text-danger');
				$(document.getElementById('gateway_icon')).removeClass('text-success');
				$(document.getElementById('gateway_icon')).addClass('text-neutral');
				
				if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '-';
				$(document.getElementById('controller_icon')).removeClass('text-warning');
				$(document.getElementById('controller_icon')).removeClass('text-danger');
				$(document.getElementById('controller_icon')).removeClass('text-success');
				$(document.getElementById('controller_icon')).addClass('text-neutral');
			} else {				
				if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
				$(document.getElementById('gateway_icon')).addClass('text-warning');
				$(document.getElementById('gateway_icon')).removeClass('text-danger');
				$(document.getElementById('gateway_icon')).removeClass('text-success');
				$(document.getElementById('gateway_icon')).removeClass('text-neutral');
				
				if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '-';
				$(document.getElementById('controller_icon')).addClass('text-warning');
				$(document.getElementById('controller_icon')).removeClass('text-danger');
				$(document.getElementById('controller_icon')).removeClass('text-success');
				$(document.getElementById('controller_icon')).removeClass('text-neutral');
			}

			clients = [];
			downAPCount = 0;
			downSwitchCount = 0;
			downGatewayCount = 0;
			downControllerCount = 0;
			siteIssues = 4;
			var clientLoadCount = 0;

			const transaction = db.transaction('general', 'readonly');
			const store = transaction.objectStore('general');

			const allQuery = store.getAll();
			allQuery.onsuccess = function() {
				if (allQuery.result) {
					$.each(allQuery.result, function() {
						if (this.key === 'monitoring_aps') {
							if (loadAPs) {
								aps = JSON.parse(this.data);
								$.each(aps, function() {
									loadAPUI(this);
								});
								updateAPUI();
							}
						} else if (this.key === 'monitoring_switches') {
							if (loadSwitches) {
								switches = JSON.parse(this.data);
								$.each(switches, function() {
									loadSwitchUI(this);
								});
								updateSwitchUI();
							}
						} else if (this.key === 'monitoring_gateways') {
							if (loadGateways) {
								gateways = JSON.parse(this.data);
								$.each(gateways, function() {
									loadGatewayUI(this);
								});
								updateGatewayUI();
							}
						} else if (this.key === 'monitoring_controllers') {
							if (loadGateways) {
								controllers = JSON.parse(this.data);
								$.each(controllers, function() {
									loadControllerUI(this);
								});
								updateControllerUI();
							}
						} else if (this.key === 'monitoring_sites') {
							sites = JSON.parse(this.data);
							$.each(sites, function() {
								loadSiteUI(this);
							});
							updateSiteUI();
						} else if (this.key === 'monitoring_groups') {
							groups = JSON.parse(this.data);
							$.each(groups, function() {
								loadGroupUI(this);
							});
							updateGroupUI();
						} else if (this.key === 'monitoring_swarms') {
							var loadVCConfig = localStorage.getItem('load_vc_config');
							if (loadVCConfig === null || loadVCConfig === '') {
								loadVCConfig = true;
							} else {
								loadVCConfig = JSON.parse(loadVCConfig);
							}
							if (loadVCConfig) {
								swarms = JSON.parse(this.data);
								loadCurrentPageSwarm();
							} else {
								// Clear out old data
								saveDataToDB('monitoring_swarms', JSON.stringify([]));
							}
						} else if (this.key === 'monitoring_wirelessClients') {
							if (loadWirelessClients) {
								clientLoadCount++;
								wirelessClients = JSON.parse(this.data);
								clients = clients.concat(wirelessClients);
								if (!loadWiredClients || clientLoadCount > 1) {
									$.each(clients, function() {
										loadClientsUI(this);
									});
									updateClientUI();
								}
							}
						} else if (this.key === 'monitoring_wiredClients') {
							if (loadWiredClients) {
								clientLoadCount++;
								wiredClients = JSON.parse(this.data);
								clients = clients.concat(wiredClients);
								if (!loadWirelessClients || clientLoadCount > 1) {
									$.each(clients, function() {
										console.log('loading clientUI')
										loadClientsUI(this);
									});
									updateClientUI();
								}
							}
						} else if (this.key === 'inventory_ap') {
							apInventory = JSON.parse(this.data);
						} else if (this.key === 'inventory_switch') {
							switchInventory = JSON.parse(this.data);
						} else if (this.key === 'inventory_gateway') {
							gatewayInventory = JSON.parse(this.data);
						}
					});
				}
			};
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Utility functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function titleCase(str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function(word) {
			return word.replace(word[0], word[0].toUpperCase());
		})
		.join(' ');
}

function noUnderscore(str) {
	return str.replace(/_/g, ' ');
}

function noDash(str) {
	return str.replace(/-/g, ' ');
}

function cleanMACAddress(mac) {
	var currentMac = mac.trim();
	currentMac = currentMac.toUpperCase();
	currentMac = currentMac.replace(/[^a-z0-9]/gi, '');
	currentMac = currentMac.replace(/..\B/g, '$&:');
	return currentMac;
}

function padNumber(num, size) {
	num = num.toString();
	while (num.length < size) num = '0' + num;
	return num;
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function addSelectTitle(currentSelect, title, end) {
	var eaOption = document.createElement('option');
	eaOption.style.color = '#aaaaaa';
	eaOption.disabled = true;
	eaOption.innerHTML = title;
	if (end) currentSelect.appendChild(eaOption);
	else currentSelect.insertBefore(eaOption, currentSelect.firstChild);
}

function addSelectSeparator(currentSelect) {
	var eaOption = document.createElement('option');
	eaOption.style.color = '#aaaaaa';
	eaOption.disabled = true;
	eaOption.value = '────────────────────────────────────────────────';
	eaOption.innerHTML = '────────────────────────────────────────────────';
	currentSelect.appendChild(eaOption);
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Logging and Notifications
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function showNotification(icon, message, from, align, color) {
	// Valid Colors: danger, warning, success, info, primary
	var iconString = 'central-icon ' + icon;
	return $.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			delay: 5000,
			placement: {
				from: from,
				align: align,
			},
			allow_dismiss: false,
		}
	);
}

function showLongNotification(icon, message, from, align, color) {
	// Valid Colors: danger, warning, success, info, primary
	var iconString = 'central-icon ' + icon;
	return $.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			delay: 50000,
			placement: {
				from: from,
				align: align,
			},
			allow_dismiss: false,
		}
	);
}

// Added in 1.18.2
function showProgressNotification(icon, message, from, align, color) {
	// Valid Colors: danger, warning, success, info, primary
	var iconString = 'central-icon ' + icon;
	return $.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			placement: {
				from: from,
				align: align,
			},
			showProgressbar: true,
			allow_dismiss: false,
			delay: 0,
		}
	);
}

function showPermanentNotification(icon, message, from, align, color, url) {
	// Valid Colors: danger, warning, success, info, primary
	var iconString = 'central-icon ' + icon;
	return $.notify(
		{
			icon: iconString,
			message: message,
		},
		{
			type: color,
			placement: {
				from: from,
				align: align,
			},
			allow_dismiss: true,
			delay: 0,
		}
	);
}

// Updated 1.9.3
function logError(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('- ' + message);
	var span = document.createElement('span');
	span.style.color = '#FB404B';
	span.appendChild(text);
	errorBody.appendChild(span);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
	apiErrorCount++;
}

// Added 1.9.3
function logInformation(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('• ' + message);
	errorBody.appendChild(text);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
}

// Added 1.28.1
function logStart(message) {
	var errorBody = document.getElementById('errorBody');
	var br = document.createElement('br');
	errorBody.appendChild(br);
	var text = document.createTextNode(message);
	var span = document.createElement('span');
	span.style.color = '#1D62F0';
	span.appendChild(text);
	errorBody.appendChild(span);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
}

function logEnd(message) {
	var errorBody = document.getElementById('errorBody');
	var text = document.createTextNode('>>> ' + message);
	var span = document.createElement('span');
	span.style.color = '#23CCEF';
	span.appendChild(text);
	errorBody.appendChild(span);
	var br = document.createElement('br');
	errorBody.appendChild(br);
	console.log(message);
}

function clearErrorLog() {
	var errorBody = document.getElementById('errorBody');
	while (errorBody.hasChildNodes()) {
		errorBody.removeChild(errorBody.firstChild);
	}
}

function showLog() {
	$('#ErrorModalLink').trigger('click');
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		CSV functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function processCSV(results) {
	apiErrorCount = 0;
	csvData = results.data;
	csvDataCount = csvData.length;
	forcedTokenRefresh = false;
	authRefresh();
}

function loadCSVFile(clickedRow) {
	$('#files').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processCSV,
			skipEmptyLines: 'greedy',
			transformHeader: function(h) {
				return h.toUpperCase().trim();
			},
		},
		before: function(file, inputElem) {
			csvNotification = showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (csvNotification) csvNotification.close();
			if (clickedRow === 'mgmt-group') {
				$('#AddGroupModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-group-clone') {
				$('#CloneGroupModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-site') {
				$('#AddSiteModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-customer') {
				showCustomerGroup();
				$('#AddCustomerModalLink').trigger('click');
			} else if (clickedRow === 'mgmt-inventory') {
				downloadMSPInventory();
			} else if (clickedRow === 'mgmt-expiring-inventory') {
				downloadMSPExpiringInventory();
			} else if (!csvData) {
				showNotification('ca-c-warning', 'No CSV data found. Try selecting a CSV document.', 'bottom', 'center', 'danger');
				return false;
			}
			// Clear error log
			clearErrorLog();

			if (clickedRow === 'adddevices') {
				logStart('Adding devices...');
				currentWorkflow = '';
				addDevices();
			} else if (clickedRow === 'archivedevices') {
				logStart('Archving devices...');
				currentWorkflow = '';
				archiveDevices();
			} else if (clickedRow === 'deletedevices') {
				logStart('Deleting devices...');
				currentWorkflow = '';
				deleteDevices();
			} else if (clickedRow === 'licensedevices') {
				logStart('Licensing devices...');
				currentWorkflow = '';
				licenseDevices();
			} else if (clickedRow === 'unlicensedevices') {
				logStart('Unlicensing devices...');
				currentWorkflow = '';
				unlicenseDevices();
			} else if (clickedRow === 'updatelicenses') {
				logStart('Updating Licenses...');
				currentWorkflow = '';
				updateLicenses();
			} else if (clickedRow === 'updateAPlicenses') {
				logStart('Updating Licenses...');
				currentWorkflow = '';
				updateAPLicenses();
			} else if (clickedRow === 'preprovisiontogroup') {
				currentWorkflow = '';
				if (csvContainsGroup() || manualGroup) {
					logStart('Preprovisioning devices to groups...');
					preprovisionDevicesToGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'movetogroup') {
				currentWorkflow = '';
				if (csvContainsGroup() || manualGroup) {
					logStart('Moving devices to groups...');
					moveDevicesToGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'movetosite') {
				logStart('Moving devices to sites...');
				currentWorkflow = '';
				moveDevicesToSite();
			} else if (clickedRow === 'removefromsite') {
				logStart('Removing devices from sites...');
				currentWorkflow = '';
				removeDevicesFromSite();
			} else if (clickedRow === 'assignlabel') {
				logStart('Assigning labels to devices...');
				currentWorkflow = '';
				assignLabelsToDevices();
			} else if (clickedRow === 'removelabel') {
				logStart('Removing labels from devices...');
				currentWorkflow = '';
				removeLabelsFromDevices();
			} else if (clickedRow === 'renametemplate') {
				logStart('Renaming devices...');
				currentWorkflow = '';
				renameDevices();
			} else if (clickedRow === 'autorenametemplate') {
				currentWorkflow = '';
				magicRenameDevices();
			} else if (clickedRow === 'setZone') {
				logStart('Configuring Zones/SSIDs...');
				currentWorkflow = '';
				setAPZone();
			} else if (clickedRow === 'setRFProfile') {
				logStart('Configuring RF profiles...');
				currentWorkflow = '';
				setRFProfile();
			} else if (clickedRow === 'setRadioMode') {
				logStart('Configuring radio modes...');
				currentWorkflow = '';
				setRadioMode('all');
			} else if (clickedRow === 'setFlexMode') {
				logStart('Configuring radios...');
				currentWorkflow = '';
				setFlexRadioMode();
			} else if (clickedRow === 'enable24') {
				logStart('Enabling 2.4GHz radios...');
				currentWorkflow = '';
				enable24radios();
			} else if (clickedRow === 'disable24') {
				logStart('Disabling 2.4GHz radios...');
				currentWorkflow = '';
				disable24radios();
			} else if (clickedRow === 'setSwarmMode') {
				logStart('Configuring Swarm Mode...');
				currentWorkflow = '';
				setSwarmMode();
			} else if (clickedRow === 'setAP1XCredentials') {
				logStart('Configuring AP1X PEAP credentials...');
				currentWorkflow = '';
				setAP1XCredentials();
			} else if (clickedRow === 'devicevariables') {
				logStart('Updating device variables...');
				currentWorkflow = '';
				updateDeviceVariables();
			} else if (clickedRow === 'portdescriptions') {
				logStart('Updating port descriptions...');
				currentWorkflow = '';
				updatePortDescription();
			} else if (clickedRow === 'countrycode') {
				logStart('Updating country codes...');
				currentWorkflow = '';
				updateCountryCodes();
			} else if (clickedRow === 'antennaGain') {
				logStart('Configuring antenna gain...');
				currentWorkflow = '';
				buildAntennaAPList();
				loadAntennas();
				$('#AntennaConfigModalLink').trigger('click');
			} else if (clickedRow === 'antennaWidth') {
				logStart('Configuring antenna width...');
				currentWorkflow = '';
				updateAntennaWidth();
			} else if (clickedRow === 'apAltitude') {
				logStart('Configuring AP altitude...');
				currentWorkflow = '';
				updateAPAltitude();
			} else if (clickedRow === 'staticIP') {
				logStart('Configuring static IP...');
				currentWorkflow = '';
				setStaticIPConfig();
			} else if (clickedRow === 'installType') {
				logStart('Configuring AP Installation Type...');
				currentWorkflow = '';
				setInstallationType();
			} else if (clickedRow === 'ledOff') {
				logStart('Turning off AP LEDs...');
				currentWorkflow = '';
				setLEDOff();
			} else if (clickedRow === 'ledOn') {
				logStart('Turning on AP LEDs...');
				currentWorkflow = '';
				setLEDOn();
			} else if (clickedRow === 'rebootDevices') {
				logStart('Rebooting devices...');
				currentWorkflow = '';
				rebootDevices();
			} else if (clickedRow === 'gatewayTimezones') {
				logStart('Configuring Gateway Timezones...');
				currentWorkflow = '';
				setGatewayTimezones();
			} else if (clickedRow === 'auto-add-license') {
				logStart('Adding devices and licensing...');
				currentWorkflow = 'auto-add-license';
				addAndLicense();
			} else if (clickedRow === 'auto-add-group') {
				currentWorkflow = 'auto-add-group';
				if (csvContainsGroup() || manualGroup) {
					logStart('Adding devices and moving to groups...');
					addAndGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-license-group') {
				currentWorkflow = 'auto-add-license-group';
				if (csvContainsGroup() || manualGroup) {
					logStart('Adding devices, licensing and moving to groups...');
					addLicenseGroup();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-license-group-site') {
				currentWorkflow = 'auto-add-license-group-site';
				if (csvContainsGroup() || manualGroup) {
					logStart('Adding devices, licensing, pre-provisioning to groups, assign to sites...');
					addLicenseGroupSite();
				} else {
					// missing group information in the CSV for some or all records
					$('#GroupModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-site-rename') {
				logStart('Moving devices to sites and renaming APs...');
				currentWorkflow = 'auto-site-rename';
				siteAndRename();
			} else if (clickedRow === 'auto-site-autorename') {
				logStart('Moving devices to sites and renaming APs...');
				currentWorkflow = 'auto-site-autorename';
				siteAndAutoRename();
			} else if (clickedRow === 'auto-renameap-portdescriptions') {
				logStart('Renaming APs and updating port descriptions...');
				currentWorkflow = 'auto-renameap-portdescriptions';
				renameAndPortDescriptions();
			} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
				logStart('Renaming APs and updating port descriptions...');
				currentWorkflow = 'auto-site-autorenameap-portdescriptions';
				siteAndAutoRenameAndPortDescriptions();
			} else if (clickedRow === 'auto-renameap-radiomode') {
				logStart('Renaming APs and configuring radio modes...');
				currentWorkflow = 'auto-renameap-radiomode';
				renameAndRadioMode();

				// MSP Functions
			} else if (clickedRow === 'assigntocustomer') {
				currentWorkflow = '';
				if (csvContainsCustomer() || manualCustomer) {
					logStart('Assigning devices to customers...');
					assignDevicesToCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'assignalltocustomer') {
				logStart('Assigning devices to a customer...');
				currentWorkflow = '';
				if (manualCustomer) {
					assignAllDevicesToCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'licenseToCustomers') {
				logStart('Licensing devices to a customer...');
				currentWorkflow = '';
				licenseCounter = 0;
				licenseDevicesFromCSV(true,false, false);
			} else if (clickedRow === 'auto-add-customers') {
				currentWorkflow = 'auto-add-customers';
				if (csvContainsCustomer() || manualCustomer) {
					logStart('Adding devices and assigning to customers...');
					addAndCustomers();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-customers-license') {
				currentWorkflow = 'auto-add-customers-license';
				if (csvContainsCustomer() || manualCustomer) {
					logStart('Adding devices, assigning to customers and licensing...');
					addAndCustomersAndLicense();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-single') {
				currentWorkflow = 'auto-add-single';
				if (manualCustomer) {
					logStart('Adding devices and assigning to a customer...');
					addAndSingleCustomer();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'auto-add-single-license') {
				currentWorkflow = 'auto-add-single-license';
				if (manualCustomer) {
					logStart('Adding devices, assigning to a customer and licensing...');
					addAndSingleCustomerAndLicense();
				} else {
					// missing group information in the CSV for some or all records
					$('#CustomerModalLink').trigger('click');
				}
			} else if (clickedRow === 'createVisitors') {
				logStart('Creating visitors...');
				currentWorkflow = '';
				createVisitors();
			} else if (clickedRow === 'bulkAddDenyList') {
				logStart('Adding clients to denylist...');
				currentWorkflow = '';
				addClientsToDenylist();
			} else if (clickedRow === 'bulkRemoveDenyList') {
				logStart('Removing clients from denylist...');
				currentWorkflow = '';
				removeClientsFromDenylist();
			}
		},
	});
}

function generateCSVForSite(clickedRow) {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	if (!selectedSite) {
		showNotification('ca-c-warning', 'Please select a Site before running a task', 'bottom', 'center', 'danger');
	} else {
		//console.log(selectedSite);

		//CSV header
		var siteKey = 'SITE';
		var serialKey = 'SERIAL';
		var macKey = 'MAC';
		var nameKey = 'DEVICE NAME';
		var groupKey = 'GROUP';

		// get APs for site
		csvData = [];
		$.each(aps, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		$.each(switches, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		$.each(gateways, function() {
			if (this['site'] === selectedSite) {
				csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'] });
			}
		});

		if (!csvData) {
			showNotification('ca-c-warning', 'No site devices found. Try selecting a different site?', 'bottom', 'center', 'danger');
			return false;
		}
		// Clear error log
		clearErrorLog();
		if (clickedRow === 'adddevices') {
			currentWorkflow = '';
			logStart('Adding devices...');
			addDevices();
		} else if (clickedRow === 'licensedevices') {
			logStart('Licensing devices...');
			currentWorkflow = '';
			licenseDevices();
		} else if (clickedRow === 'movetogroup') {
			logStart('Moving devices to groups...');
			currentWorkflow = '';
			moveDevicesToGroup();
		} else if (clickedRow === 'movetosite') {
			logStart('Moving devices to sites...');
			currentWorkflow = '';
			moveDevicesToSite();
		} else if (clickedRow === 'renametemplate') {
			logStart('Renaming devices...');
			currentWorkflow = '';
			renameDevices();
		} else if (clickedRow === 'autorenametemplate') {
			logStart('Renaming devices...');
			currentWorkflow = '';
			magicRenameDevices();
		} else if (clickedRow === 'portdescriptions') {
			logStart('Updating port descriptions...');
			currentWorkflow = '';
			updatePortDescription();
		} else if (clickedRow === 'countrycode') {
			logStart('Updating country codes...');
			currentWorkflow = '';
			updateCountryCodes();
		} else if (clickedRow === 'setSwarmMode') {
			logStart('Configuring Swarm Mode...');
			currentWorkflow = '';
			setSwarmMode();
		} else if (clickedRow === 'split5GhzMode') {
			logStart('Configuring 5GHz radios...');
			currentWorkflow = '';
			// get supported APs for site (rebuild the CSV)
			var split5Key = 'SPLIT 5GHZ MODE';
			var radio0Mode = 'RADIO 0 MODE';
			var radio2Mode = 'RADIO 2 MODE';
			csvData = [];
			$.each(aps, function() {
				if (this['site'] === selectedSite && this['model'].includes('555')) {
					csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'], [radio0Mode]: 'access', [radio2Mode]: 'access', [split5Key]: 'enabled' });
				}
			});
			setRadioMode('split');
		} else if (clickedRow === 'dual5GhzMode') {
			logStart('Configuring 5GHz radios...');
			currentWorkflow = '';
			// get supported APs for site (rebuild the CSV)
			var dual5Key = 'DUAL 5GHZ MODE';
			var radio0Mode = 'RADIO 0 MODE';
			var radio1Mode = 'RADIO 1 MODE';
			csvData = [];
			$.each(aps, function() {
				if (this['site'] === selectedSite && (this['model'].includes('344') || this['model'].includes('345'))) {
					csvData.push({ [nameKey]: this['name'], [serialKey]: this['serial'], [macKey]: this['macaddr'], [groupKey]: this['group_name'], [siteKey]: this['site'], [radio0Mode]: 'access', [radio1Mode]: 'access', [dual5Key]: 'enabled' });
				}
			});
			setRadioMode('dual');
		} else if (clickedRow === 'setFlexMode') {
			logStart('Configuring radios...');
			currentWorkflow = '';
			setFlexRadioMode();
		} else if (clickedRow === 'antennaGain') {
			logStart('Configuring antenna gain...');
			currentWorkflow = '';
			buildAntennaAPList();
			loadAntennas();
			$('#AntennaConfigModalLink').trigger('click');
		} else if (clickedRow === 'rebootDevices') {
			logStart('Rebooting devices...');
			currentWorkflow = '';
			rebootSiteDevices();
		} else if (clickedRow === 'auto-add-license') {
			logStart('Adding devices and licensing...');
			currentWorkflow = 'auto-add-license';
			addAndLicense();
		} else if (clickedRow === 'auto-add-license-group') {
			logStart('Adding devices, licensing and moving to group...');
			currentWorkflow = 'auto-add-license-group';
			addLicenseGroup();
		} else if (clickedRow === 'auto-site-rename') {
			logStart('Moving devices to site and renaming APs...');
			currentWorkflow = 'auto-site-rename';
			siteAndRename();
		} else if (clickedRow === 'auto-site-autorename') {
			logStart('Moving devices to site and renaming APs...');
			currentWorkflow = 'auto-site-autorename';
			siteAndAutoRename();
		} else if (clickedRow === 'auto-renameap-portdescriptions') {
			logStart('Renaming APs and updating port descriptions...');
			currentWorkflow = 'auto-renameap-portdescriptions';
			renameAndPortDescriptions();
		} else if (clickedRow === 'auto-autorenameap-portdescriptions') {
			logStart('Renaming APs and updating port descriptions...');
			currentWorkflow = 'auto-autorenameap-portdescriptions';
			autoRenameAndPortDescriptions();
		} else if (clickedRow === 'auto-site-autorenameap-portdescriptions') {
			logStart('Moving devices, renaming APs and updating port descriptions...');
			currentWorkflow = 'auto-site-autorenameap-portdescriptions';
			siteAndAutoRenameAndPortDescriptions();
		} else if (clickedRow === 'test-layer-one') {
			logStart('Testing layer one...');
			currentWorkflow = 'test-layer-one';
			showLayerOne();
		} else if (clickedRow === 'test-antenna-gain') {
			logStart('Testing for antenna gains...');
			currentWorkflow = 'test-antenna-gain';
			testAntennaGain();
		} else if (clickedRow === 'test-static-ip') {
			logStart('Testing for static IPs...');
			currentWorkflow = 'test-static-ip';
			testStaticIPAddress();
		} else if (clickedRow === 'test-topology-reset') {
			currentWorkflow = 'test-topology-reset';
			resetTopology();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Authentication functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function isAuthInProgress() {
	return authInProgress;	
}

function authRefresh() {
	authPromise = new $.Deferred();
	
	var expiryTimestamp = localStorage.getItem('expires_at');
	var nowTimestamp = Date.now();
	
	if (expiryTimestamp == null || expiryTimestamp == 'undefined' || (expiryTimestamp < nowTimestamp + 300000)) {
		if (authNotification) authNotification.close();
		authNotification = showNotification('ca-padlock', 'Authenticating with Central...', 'bottom', 'center', 'info');
		authInProgress = true;
		var settings = {
			url: getAPIURL() + '/auth/refreshwHeaders',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				client_id: localStorage.getItem('client_id'),
				client_secret: localStorage.getItem('client_secret'),
				access_token: localStorage.getItem('access_token'),
				refresh_token: localStorage.getItem('refresh_token'),
				base_url: localStorage.getItem('base_url'),
			}),
		};
	
		$.ajax(settings).done(function(commandResults, statusText, jqXHR) {
			//console.log(commandResults)
			if (commandResults.hasOwnProperty('headers')) {
				updateAPILimits(JSON.parse(commandResults.headers));
			}
	
			var response = JSON.parse(commandResults.responseBody);
			if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
				logError('Central Server Error (503): ' + commandResults.reason + ' (/auth/refresh)');
				failedAuth = true;
			} else if (response.hasOwnProperty('error')) {
				Swal.fire({
					title: 'Central API connection failed',
					text: response.error_description.replace('refresh_token', 'Refresh Token'),
					footer: '<a href="settings.html">Go to Settings to correct the information</a>',
					icon: 'error',
				});
				if (authNotification) {
					authNotification.update({ type: 'danger', message: 'Authentication Tokens Failed to be Updated' });
					setTimeout(authNotification.close, 2000);
				}
				failedAuth = true;
			} else if (response) {
				//console.log(response)
				if (response.refresh_token) {
					localStorage.setItem('refresh_token', response.refresh_token);
					localStorage.setItem('access_token', response.access_token);
		
					// Create timestamp for access token expiry
					var nowDatestamp = Date.now();
					nowDatestamp = nowDatestamp + (response.expires_in*1000)
					localStorage.setItem('expires_at', nowDatestamp);
					
					var cluster = getAccountforClientID(localStorage.getItem('client_id'));
					cluster['refresh_token'] = response.refresh_token;
					cluster['access_token'] = response.access_token;
					
					updateAccountDetails(cluster);
					
					failedAuth = false;
					
					var path = window.location.pathname;
					var page = path.split('/').pop();
					if (page.includes('settings')) {
						document.getElementById('refresh_token').value = response.refresh_token;
						document.getElementById('access_token').value = response.access_token;
						Swal.fire({
							title: 'Connected!',
							text: 'Central API connection successful',
							icon: 'success',
							confirmButtonText: 'Go to Dashboard',
						}).then(result => {
							if (result.isConfirmed) {
								window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'dashboard.html';
							}
						});
					} else {
						if (authNotification) {
							authNotification.update({ type: 'success', message: 'Authentication Tokens Updated' });
							setTimeout(authNotification.close, 1000);
						}
						console.log('Authentication Tokens Updated');
						var d = new Date(nowDatestamp);
						console.log('Access Token is valid until ' + d.toTimeString());
					}
				} else {
					if (authNotification) {
						authNotification.update({ type: 'danger', message: 'Authentication Tokens Failed to be Updated' });
						setTimeout(authNotification.close, 1000);
					}
					failedAuth = true;
					console.log('Authentication Tokens Failed to be Updated');
				}
			}
			authInProgress = false;
			authPromise.resolve();
		}).fail(function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Auth Error');
			if (XMLHttpRequest.readyState == 4) {
				// HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
				showNotification('ca-globe', XMLHttpRequest.statusText.replace('refresh_token', 'Refresh Token'), 'bottom', 'center', 'danger');
			} else if (XMLHttpRequest.readyState == 0) {
				// Network error (i.e. connection refused, access denied due to CORS, etc.)
				showNotification('ca-globe', 'Can not connect to API server', 'bottom', 'center', 'danger');
			} else {
				// something weird is happening
			}
			authInProgress = false;
			failedAuth = true;
		});
		return authPromise.promise();
	} else {
		failedAuth = false;
		var d = new Date(parseInt(expiryTimestamp)); // The 0 there is the key, which sets the date to the epoch
		console.log('Access Token is valid until ' + d.toTimeString());
		return authPromise.resolve().promise();
	}
}

function updateAPILimits(headers) {
	if (headers['X-RateLimit-Limit-day']) {
		var usage = parseInt(headers['X-RateLimit-Limit-day']) - parseInt(headers['X-RateLimit-Remaining-day']);
		$('#titleText').attr('data-original-title', 'Daily API Usage: ' + usage.toString() + ' / ' + headers['X-RateLimit-Limit-day']);
		if (parseInt(headers['X-RateLimit-Remaining-day']) == 0) {
			if (!apiLimitNotification) {
				apiLimitNotification = showLongNotification('ca-api', 'Daily API limit reached', 'top', 'center', 'danger');
				setTimeout(clearAPINotification, 5000);
			}
		}
	} else {
		$('#titleText').attr('data-original-title', '');
	}
}

function clearAPINotification() {
	apiLimitNotification.close();
	apiLimitNotification = null;
}

function loadAccountList() {
	var account_details = localStorage.getItem('account_details');
	if (account_details != null && account_details != 'undefined') {
		centralCredentials = JSON.parse(account_details);
		if (centralCredentials.length > 1) {
			$("#accountDropdownList").html("");
			centralCredentials.sort((a,b) => (a.account_name > b.account_name) ? 1 : ((b.account_name > a.account_name) ? -1 : 0))
			$.each(centralCredentials, function() {
				if (localStorage.getItem('client_id') === this.client_id) {
					document.getElementById('accountDropdownList').innerHTML += '<a href="javascript:switchAccount(\''+this.client_id+'\', 1);" class="dropdown-item"><i class="fa-solid fa-check text-muted"></i> '+this.account_name+'</a>'
				} else {
					document.getElementById('accountDropdownList').innerHTML += '<a href="javascript:switchAccount(\''+this.client_id+'\', 1);" class="dropdown-item"><i class="fa-solid fa-minus text-transparent"></i> '+this.account_name+'</a>'
				} 
			})
			if (document.getElementById('accountDropdown')) document.getElementById('accountDropdown').hidden = false;
		} else {
			// hide account menu item
			if (document.getElementById('accountDropdown')) document.getElementById('accountDropdown').hidden = true;
		}
	}
}

function switchAccount(client_id, hydra) {
	if (authInProgress) {
		if (authNotification) authNotification.update({ type: 'warning', message: 'Authenticating with Central is still in progress. Please wait before switching accounts.' });
	} else {
		// get account details and save them out
		var account = getAccountforClientID(client_id);
		
		if (account.client_id === localStorage.getItem('client_id')) {
			console.log('No need to switch accounts, copying access token to clipboard')
			navigator.clipboard.writeText(localStorage.getItem('access_token'));
			showNotification('ca-document-copy', 'Access Token for account copied to clipboard', 'top', 'center', 'success');
		} else {
	
			// If COP account - write the base_url with the COP address
			var baseURL = account.base_url;
			if (baseURL === getAPIGateway('Central On-Prem')) {
				console.log('Setting COP address');
				baseURL = cop_url + account.cop_address;
				localStorage.setItem('is_cop', '1');
			} else {
				localStorage.removeItem('is_cop');
			}
		
			localStorage.setItem('central_id', account.central_id);
			localStorage.setItem('client_id', account.client_id);
			localStorage.setItem('client_secret', account.client_secret);
			localStorage.setItem('base_url', baseURL);
			localStorage.setItem('refresh_token', account.refresh_token);
			localStorage.setItem('access_token', account.access_token);
			localStorage.setItem('expires_at', account.expires_at);
		
			// Jump to individual dashboard and refresh data
			if (hydra == 1) localStorage.setItem('from_hydra', hydra);
			else localStorage.removeItem('from_hydra');
		
			localStorage.removeItem('monitoring_update');
			localStorage.removeItem('inventory_update');
			
			apInventory = [];
			switchInventory = [];
			gatewayInventory = [];
			
			deleteDataFomDB('monitoring_bssids');
			location.reload();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Monitoring functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function loadCurrentPageCleanup() {
	// override on visible page - used as a notification
	// Called when new data is being pulled from Central
}

function loadCurrentPageClient() {
	// override on visible page - used as a notification
}

function loadCurrentPageAP() {
	// override on visible page - used as a notification
}

function loadCurrentPageSwitch() {
	// override on visible page - used as a notification
}

function loadCurrentPageGateway() {
	// override on visible page - used as a notification
}

function loadCurrentPageController() {
	// override on visible page - used as a notification
}

function loadCurrentPageSite() {
	// override on visible page - used as a notification
}

function loadCurrentPageGroup() {
	// override on visible page - used as a notification
}

function loadCurrentPageSwarm() {
	// override on visible page - used as a notification
}

function loadCurrentPageVisitors() {
	// override on visible page - used as a notification
}

function goToDashboard(event) {
	location.href = 'dashboard.html';
}


// Updated: 1.6.0
function getMonitoringData(event) {
	if (event && event.shiftKey) {
		updateInventory(true);
	} else {
		/*var uip = localStorage.getItem('update_in_progress');
		if (uip === null || uip === '') {
			localStorage.setItem('update_in_progress', '1');
		} else {
			console.log('Already fetching monitoring data from Central.');
			showNotification('ca-reload', 'An update of the monitoring data is already in progress...', 'top', 'center', 'warning')
			return; // an update is already in progress
		}*/
		
		console.log('Reading new monitoring data from Central');
	
		// Are we including Wireless Clients in the monitoring data calls?
		var loadWirelessClients = localStorage.getItem('load_clients');
		if (loadWirelessClients === null || loadWirelessClients === '') {
			loadWirelessClients = true;
		} else {
			loadWirelessClients = JSON.parse(loadWirelessClients);
		}
		console.log('Wireless Client Monitoring: ' + loadWirelessClients);
		
		// Are we including Wired Clients in the monitoring data calls?
		var loadWiredClients = localStorage.getItem('load_clients_wired');
		if (loadWiredClients === null || loadWiredClients === '') {
			loadWiredClients = true;
		} else {
			loadWiredClients = JSON.parse(loadWiredClients);
		}
		console.log('Wired Client Monitoring: ' + loadWiredClients);
		
		if (!loadWirelessClients && !loadWiredClients) {
			// Mark the Client tile in Grey
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
			$(document.getElementById('client_icon')).removeClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).addClass('text-neutral');
		} else {
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-neutral');
		}
		
		var loadAPs = localStorage.getItem('load_aps');
		if (loadAPs === null || loadAPs === "") {
			loadAPs = true;
		} else {
			loadAPs = JSON.parse(loadAPs)
		}
		
		var loadSwitches = localStorage.getItem('load_switches');
		if (loadSwitches === null || loadSwitches === "") {
			loadSwitches = true;
		} else {
			loadSwitches = JSON.parse(loadSwitches)
		}
		
		var loadDevices = localStorage.getItem('load_devices');
		if (loadDevices === null || loadDevices === "") {
			// do nothing anymore - moved to individual loading of APs and switches
		} else {
			loadDevices = JSON.parse(loadDevices)
			loadAPs = loadDevices;
			loadSwitches = loadDevices;
		}
		
		console.log('AP Monitoring: ' + loadAPs);
		if (!loadAPs) {
			// Mark the Devices tiles in Grey
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
			$(document.getElementById('ap_icon')).removeClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).addClass('text-neutral');
		} else {
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-neutral');
		}
		
		console.log('Switch Monitoring: ' + loadSwitches);
		if (!loadSwitches) {
			// Mark the Devices tiles in Grey				
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
			$(document.getElementById('switch_icon')).removeClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).addClass('text-neutral');
		} else {
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-neutral');
		}
		
		var loadGateways = localStorage.getItem('load_gateways');
		if (loadGateways === null || loadGateways === '') {
			loadGateways = true;
		} else {
			loadGateways = JSON.parse(loadGateways);
		}
		console.log('Gateway Monitoring: ' + loadGateways);
		if (!loadGateways) {
			// Mark the Devices tiles in Grey		
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
			$(document.getElementById('gateway_icon')).removeClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).addClass('text-neutral');
			
			if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '-';
			$(document.getElementById('controller_icon')).removeClass('text-warning');
			$(document.getElementById('controller_icon')).removeClass('text-danger');
			$(document.getElementById('controller_icon')).removeClass('text-success');
			$(document.getElementById('controller_icon')).addClass('text-neutral');
		} else {		
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-neutral');
			
			if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '-';
			$(document.getElementById('controller_icon')).addClass('text-warning');
			$(document.getElementById('controller_icon')).removeClass('text-danger');
			$(document.getElementById('controller_icon')).removeClass('text-success');
			$(document.getElementById('controller_icon')).removeClass('text-neutral');
		}
		
		loadCurrentPageCleanup();
		updateMonitoringWithClients(loadWirelessClients, loadWiredClients);
	}
}

function getNonInfrastructureData() {
	apiMessage = false;
	showNotification('ca-dashboard', 'Updating Monitoring Data...', 'bottom', 'center', 'primary');
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			// Empty clients array
			clients = [];
			wiredClients = [];
			wirelessClients = [];
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '0';
			$('#client-table')
				.DataTable()
				.rows()
				.remove();
	
			downAPCount = 0;
			downSwitchCount = 0;
			downGatewayCount = 0;
			siteIssues = 4;
	
			getWirelessClientData(null);
			getWiredClientData(null);
			setTimeout(getSiteData, 200, 0);
			setTimeout(updateGroupData, 4000);
		}
	});
}

function checkForMonitoringUpdateCompletion() {
	updateCounter++;
	if (updateCounter >= updateCount) {
		localStorage.removeItem('update_in_progress');
		console.log('Monitoring Update completed')
	}
}

function updateMonitoringWithClients(needWirelessClients, needWiredClients) {
	apiMessage = false;

	if (!localStorage.getItem('base_url') && !localStorage.getItem('account_details')) {
		// No account settings at all.
		showNotification('ca-globe', 'API settings are blank...', 'bottom', 'center', 'danger');
		window.location.href = window.location.href.substr(0, location.href.lastIndexOf('/') + 1) + 'settings.html';
	} else if (localStorage.getItem('base_url') && !localStorage.getItem('account_details')) {
		// Old account settings - need to migrate to v1.6
		upgradeAccountSettings();
	}

	// Try and refresh the token
	showNotification('ca-dashboard', 'Updating Monitoring Data...', 'bottom', 'center', 'primary');
	
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			// Empty universal search table
			$('#universal-table')
				.DataTable()
				.rows()
				.remove();
	
			// Empty clients array
			clients = [];
			wiredClients = [];
			wirelessClients = [];
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '0';
			$('#client-table')
				.DataTable()
				.rows()
				.remove();
	
			downAPCount = 0;
			downSwitchCount = 0;
			downGatewayCount = 0;
			downControllerCount = 0;
			siteIssues = 4;
	
			var isCOP = localStorage.getItem('is_cop');
			if (!isCOP) {
				// Are we including Detailed Gateway Information in the monitoring data calls?
				needGatewayDetails = localStorage.getItem('load_gateway_details');
				if (needGatewayDetails === null || needGatewayDetails === '') {
					needGatewayDetails = true;
				} else {
					needGatewayDetails = JSON.parse(needGatewayDetails);
				}
				//console.log('Gateway Details: ' + needGatewayDetails);
			}
			updateCounter = 0;
			updateCount = 7;
			
			var loadAPs = localStorage.getItem('load_aps');
			if (loadAPs === null || loadAPs === "") {
				loadAPs = true;
			} else {
				loadAPs = JSON.parse(loadAPs)
			}
			
			var loadSwitches = localStorage.getItem('load_switches');
			if (loadSwitches === null || loadSwitches === "") {
				loadSwitches = true;
			} else {
				loadSwitches = JSON.parse(loadSwitches)
			}
			
			var loadDevices = localStorage.getItem('load_devices');
			if (loadDevices === null || loadDevices === "") {
				// do nothing anymore - moved to individual loading of APs and switches
			} else {
				loadDevices = JSON.parse(loadDevices)
				loadAPs = loadDevices;
				loadSwitches = loadDevices;
			}
			
			var loadGateways = localStorage.getItem('load_gateways');
			if (loadGateways === null || loadGateways === '') {
				loadGateways = true;
			} else {
				loadGateways = JSON.parse(loadGateways);
			}
	
			// Refresh card data
			if (licenseNotification) licenseNotification.close();
			licenseNotification = showNotification('ca-license-key', 'Checking Central licenses...', 'bottom', 'center', 'info');
			setTimeout(getLicensingStats, 1000); // As to not go over the 7 calls/sec speed limit();
			
			if (loadAPs) {
				if (apNotification) apNotification.close();
				apNotification = showProgressNotification('ca-wifi', 'Obtaining APs...', 'bottom', 'center', 'info');
				getAPData(0, needWirelessClients);
			}
			if (loadSwitches) {			
				if (switchNotification) switchNotification.close();
				switchNotification = showProgressNotification('ca-switch-stack', 'Obtaining Switches...', 'bottom', 'center', 'info');
				getSwitchData(0, needWiredClients);
			}
			if (loadGateways) {
				if (gatewayNotification) gatewayNotification.close();
				if (!isCOP) {
					gatewayNotification = showProgressNotification('ca-gateway', 'Obtaining Gateways...', 'bottom', 'center', 'info');
					getGatewayData(0);
				} else {
					gatewayNotification = showProgressNotification('ca-controller', 'Obtaining Controllers...', 'bottom', 'center', 'info');
					getControllerData(0);
				}
			}
	
			if (siteNotification) siteNotification.close();
			siteNotification = showProgressNotification('ca-world-pin', 'Obtaining Sites...', 'bottom', 'center', 'info');
			getSiteData(0);
	
			setTimeout(updateGroupData, 4000);
			setTimeout(updateSwarmData, 4000);
	
			localStorage.setItem('monitoring_update', +new Date());
		}
	});			
}

function updateInfrastructure() {
	var infraPromise = new $.Deferred();
	downAPCount = 0;
	downSwitchCount = 0;
	downGatewayCount = 0;
	downControllerCount = 0;
	
	var isCOP = localStorage.getItem('is_cop');
	if (!isCOP) {
		// Are we including Detailed Gateway Information in the monitoring data calls?
		needGatewayDetails = localStorage.getItem('load_gateway_details');
		if (needGatewayDetails === null || needGatewayDetails === '') {
			needGatewayDetails = true;
		} else {
			needGatewayDetails = JSON.parse(needGatewayDetails);
		}
		//console.log('Gateway Details: ' + needGatewayDetails);
	}
	
	if (apNotification) apNotification.close();
	apNotification = showProgressNotification('ca-wifi', 'Obtaining APs...', 'bottom', 'center', 'info');
	$.when(getAPData(0, false)).then(function() {
	
		if (switchNotification) switchNotification.close();
		switchNotification = showProgressNotification('ca-switch-stack', 'Obtaining Switches...', 'bottom', 'center', 'info');
		$.when(getSwitchData(0, false)).then(function() {
		
			if (gatewayNotification) gatewayNotification.close();
			if (!isCOP) {
				gatewayNotification = showProgressNotification('ca-gateway', 'Obtaining Gateways...', 'bottom', 'center', 'info');
				$.when(getGatewayData(0)).then(function() {
					localStorage.setItem('monitoring_update', +new Date());
					infraPromise.resolve();
				});
			} else {
				gatewayNotification = showProgressNotification('ca-controller', 'Obtaining Controllers...', 'bottom', 'center', 'info');
				$.when(getControllerData(0)).then(function() {
					localStorage.setItem('monitoring_update', +new Date());
					infraPromise.resolve();
				});
			}
		});
	});
	return infraPromise.promise();
}

function getLicensingStats() {
	// Get overview stats
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (licenseNotification) licenseNotification.close();
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/licensing/v1/subscriptions/stats)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response) {
			if (response.expiring) {
				if (expiryNotification == null) {
					expiryNotification = showLongNotification('ca-license-key', 'A Subscription Key expiring soon...', 'top', 'center', 'warning', '/monitoring-licensing.html');
					setTimeout(clearExpiryNotification, 20000);
				}
			}
		}
		checkForMonitoringUpdateCompletion();
	});
}

function getLicensingData() {
	var licensePromise = new $.Deferred();
	subscriptionKeys = {};
	licenseNotification = showLongNotification('ca-license-key', 'Checking Central licenses...', 'bottom', 'center', 'info');
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
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
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/licensing/v1/subscriptions)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('status') && commandResults.status === '401') {
			// Access Token expired - get a new one and try again.
			$.when(authRefresh()).then(function() {
				if (!failedAuth) {
					getLicensingData();
				}
			});
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
	
		var response = JSON.parse(commandResults.responseBody);
		$.each(response.subscriptions, function() {
			subscriptionKeys[this.subscription_key] = this;
		});
	
		if (licenseNotification) {
			licenseNotification.update({ message: 'Subscription keys retrieved', type: 'success' });
			setTimeout(licenseNotification.close, 1000);
		}
		licensePromise.resolve();
	});
	return licensePromise.promise();
}

function clearExpiryNotification() {
	expiryNotification.close();
	expiryNotification = null;
}

// Clients
// Updated: 1.6.0
function loadClientsUI(client) {
	var status = '<i class="fa-solid fa-circle text-neutral"></i>';
	if (!client['health'] && client['failure_stage'] !== '' && client['failure_stage'] !== 'NA') {
		status = '<span data-toggle="tooltip" data-placement="right" title="Failed To Connect: ' + client['failure_reason'] + ' at ' + client['failure_stage'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (!client['health']) {
		status = '<i class="fa-solid fa-circle text-neutral"></i>';
	} else if (client['health'] < 50) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-danger"></i></span>';
	} else if (client['health'] < 70) {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-warning"></i></span>';
	} else {
		status = '<span data-toggle="tooltip" data-placement="right" title="Health: ' + client['health'] + '"><i class="fa-solid fa-circle text-success"></i></span>';
	}
	// Generate clean data for table
	var site = '';
	if (client['site']) site = client['site'];
	var health = '';
	if (client['health']) health = client['health'];
	var associatedDevice_name = '';
	var associatedDevice = findDeviceInMonitoring(client['associated_device']);
	if (associatedDevice) associatedDevice_name = associatedDevice.name;
	var ip_address = '';
	if (client['ip_address']) ip_address = client['ip_address'];
	var vlan = '';
	if (client['vlan']) vlan = client['vlan'];
	var os_type = '';
	if (client['os_type']) os_type = client['os_type'];
	var client_name = '';
	if (client['name']) client_name = client['name'];
	var client_mac = 'Unknown';
	if (client['macaddr']) client_mac = client['macaddr'];
	
	var clientIcon = '<span title="wired"</span><i class="fa-solid fa-ethernet"></i>'
	if (client.client_type === "WIRELESS") clientIcon = '<span title="wireless"</span><i class="fa-solid fa-wifi"></i>'

	// Make link to Central
	client_name_url = encodeURI(client_name);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	var clientURL = centralBaseURL + '/frontend/#/CLIENTDETAIL/' + client['macaddr'] + '?ccma=' + client['macaddr'] + '&cdcn=' + client_name_url + '&nc=client';

	// Add row to table
	var table = $('#client-table').DataTable();
	table.row.add([client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>',  clientIcon , status, client_mac, ip_address, os_type, associatedDevice_name, site, vlan]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Client', client_mac === 'Unknown' ? client_name : '<a href="' + clientURL + '" target="_blank"><strong>' + client_name + '</strong></a>', status, ip_address, client_mac, site, '', os_type, vlan, '', '', '']);

	$('[data-toggle="tooltip"]').tooltip();
}

function updateClientUI() {
	// Force reload of table data
	$('#client-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '' + clients.length + '';

	$(document.getElementById('client_icon')).removeClass('text-warning');
	$(document.getElementById('client_icon')).removeClass('text-danger');
	$(document.getElementById('client_icon')).removeClass('text-neutral');
	$(document.getElementById('client_icon')).addClass('text-success');

	// call to current showing page
	loadCurrentPageClient();
}

function getWirelessClientData(lastMac) {
	if (showTimingData) {
		var wirelessDate = Date.now();
		console.log('Requesting Wired Clients :' + lastMac)
	}
	
	//console.log('Getting Client block:' + offset);
	var clientsURL = '';
	if (!lastMac) {
		if (wirelessNotification) wirelessNotification.close();
		wirelessNotification = showProgressNotification('ca-laptop-1', 'Obtaining wireless clients...', 'bottom', 'center', 'info');
		wirelessClients = [];
		clientsURL = '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiClientLimit + '&timerange=3H&client_type=WIRELESS&client_status=CONNECTED&show_usage=true&show_manufacturer=true&show_signal_db=true';
	} else {
		clientsURL = '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiClientLimit + '&last_client_mac=' + encodeURIComponent(lastMac)+ '&timerange=3H&client_type=WIRELESS&client_status=CONNECTED&show_usage=true&show_manufacturer=true&show_signal_db=true';
	}
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + clientsURL,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-wirelessDate)/1000 + ' - received Wireless Clients: ' + lastMac)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/clients)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
			showNotification('ca-laptop-1', response.error, 'top', 'center', 'danger');
			if (wirelessNotification) wirelessNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			saveDataToDB('monitoring_wirelessClients', JSON.stringify([]));
			if (wirelessNotification) wirelessNotification.close();
		} else {
			$.each(response.clients, function() {
				clients.push(this);
				wirelessClients.push(this);
				loadClientsUI(this);
			});

			if ((wirelessClients.length < response.total) && response.last_client_mac) {
				saveDataToDB('monitoring_wirelessClients', JSON.stringify(wirelessClients));
				var wirelessProgress = (wirelessClients.length / response.total) * 100;
				wirelessNotification.update({ progress: wirelessProgress });
				if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '' + clients.length + '';
				getWirelessClientData(response.last_client_mac);
			} else {
				wirelessNotification.update({ progress: 100 });
				updateClientUI();
				saveDataToDB('monitoring_wirelessClients', JSON.stringify(wirelessClients));
				if (wirelessNotification) wirelessNotification.close();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function getWiredClientData(lastMac) {
	if (showTimingData) {
		var wiredDate = Date.now();
		console.log('Requesting Wired Clients :' + lastMac)
	}
	var clientsURL = '';
	if (!lastMac) {
		if (wiredNotification) wiredNotification.close();
		wiredNotification = showProgressNotification('ca-computer-monitor', 'Obtaining wired clients...', 'bottom', 'center', 'info');
		wiredClients = [];
		clientsURL = '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiClientLimit + '&timerange=3H&client_type=WIRED&client_status=CONNECTED&show_usage=true&show_manufacturer=true';
	} else {
		clientsURL = '/monitoring/v2/clients?calculate_total=true&offset=0&limit=' + apiClientLimit + '&last_client_mac=' + encodeURIComponent(lastMac)+ '&timerange=3H&client_type=WIRED&client_status=CONNECTED&show_usage=true&show_manufacturer=true';
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + clientsURL,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-wiredDate)/1000 + ' - received Wired Clients: ' + lastMac)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/clients)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '-';
			showNotification('ca-computer-monitor', response.error, 'top', 'center', 'danger');
			if (wiredNotification) wiredNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('client_icon')).addClass('text-warning');
			$(document.getElementById('client_icon')).removeClass('text-success');
			$(document.getElementById('client_icon')).removeClass('text-primary');
			$(document.getElementById('client_icon')).removeClass('text-danger');
			saveDataToDB('monitoring_wiredClients', JSON.stringify([]));
			if (wiredNotification) wiredNotification.close();
		} else {
			$.each(response.clients, function() {
				clients.push(this);
				wiredClients.push(this);
				loadClientsUI(this);
			});
			
			if ((wiredClients.length < response.total) && response.last_client_mac) {
				saveDataToDB('monitoring_wiredClients', JSON.stringify(wiredClients));
				var wiredProgress = (wiredClients.length / response.total) * 100;
				wiredNotification.update({ progress: wiredProgress });
				if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '' + clients.length + '';
				getWiredClientData(response.last_client_mac);
			} else {
				wiredNotification.update({ progress: 100 });
				updateClientUI();
				saveDataToDB('monitoring_wiredClients', JSON.stringify(wiredClients));
				if (wiredNotification) wiredNotification.close();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function refreshClientData() {
	apiMessage = false;
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			clients = [];
			wiredClients = [];
			wirelessClients = [];
			if (document.getElementById('client_count')) document.getElementById('client_count').innerHTML = '0';
			$('#client-table')
				.DataTable()
				.rows()
				.remove();
			
			// Are we including Wireless Clients in the monitoring data calls?
			var loadWirelessClients = localStorage.getItem('load_clients');
			if (loadWirelessClients === null || loadWirelessClients === '') {
				loadWirelessClients = true;
			} else {
				loadWirelessClients = JSON.parse(loadWirelessClients);
			}
			if (loadWirelessClients) getWirelessClientData(null);
			
			// Are we including Wired Clients in the monitoring data calls?
			var loadWiredClients = localStorage.getItem('load_clients_wired');
			if (loadWiredClients === null || loadWiredClients === '') {
				loadWiredClients = true;
			} else {
				loadWiredClients = JSON.parse(loadWiredClients);
			}
			
			if (loadWiredClients) getWiredClientData(null);
		}
	});
}

function getClients() {
	return clients;
}

function getWirelessClients() {
	return wirelessClients;
}

function getWiredClients() {
	return wiredClients;
}

// Access Points
// Updated: 1.6.0
function loadAPUI(ap) {
	//console.log(ap);
	var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();

	var statusString = ap['status'];
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	var deviceUp = true;
	if (ap['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	} else if ('sleep_status' in ap && ap['sleep_status'] == true) {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="AP is in Power Save"><i class="fa-solid fa-circle text-purple"></i></span>';
		statusString = 'Power-Save';
	} else {
		downAPCount++;
		deviceUp = false;
	}
	var ip_address = ap['ip_address'];
	if (!ip_address) ip_address = '';

	// Build Uptime String
	var uptimeString = '-';
	if (ap['uptime'] > 0) {
		var uptime = moment.duration(ap['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}

	// Make AP Name as a link to Central
	var name = encodeURI(ap['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
	var centralURL = centralBaseURL + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';
	// Add row to table
	var table = $('#ap-table').DataTable();
	table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, statusString, ip_address, ap['model'], ap['serial'], ap['client_count'], ap['firmware_version'], ap['site'], ap['group_name'], ap['macaddr'], '<span title="' + ap['uptime'] + '"</span>'+uptimeString]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['AP', '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ip_address, ap['macaddr'], ap['site'], ap['group_name'], '', '', ap['model'], ap['serial'], ap['firmware_version']]);

	$('[data-toggle="tooltip"]').tooltip();
}

function updateAPUI() {
	// Force reload of table data
	$('#ap-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '' + aps.length + '';
	$(document.getElementById('ap_icon')).removeClass('text-warning');
	if (downAPCount > 0) {
		$(document.getElementById('ap_icon')).addClass('text-danger');
		$(document.getElementById('ap_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('ap_icon')).removeClass('text-danger');
		$(document.getElementById('ap_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageAP();
}

function getAPData(offset, needClients) {
	if (showTimingData) {
		var apDate = Date.now();
		console.log('Requesting APs offset: ' + offset)
	}
	if (offset == 0) apPromise = new $.Deferred();
	//console.log('Asking for AP block: ' + offset);
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/aps?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		//console.log('processing AP block: ' + offset);
		if (showTimingData) console.log((Date.now()-apDate)/1000 + ' - received APs offset: ' + offset)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/aps)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-primary');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '-';
			showNotification('ca-wifi', response.error, 'top', 'center', 'danger');
			if (apNotification) apNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('ap_icon')).addClass('text-warning');
			$(document.getElementById('ap_icon')).removeClass('text-success');
			$(document.getElementById('ap_icon')).removeClass('text-primary');
			$(document.getElementById('ap_icon')).removeClass('text-danger');
			saveDataToDB('monitoring_aps', JSON.stringify([]));
			if (apNotification) apNotification.close();
		} else {
			if (offset === 0) {
				downAPCount = 0;
				aps = [];
				$('#ap-table')
					.DataTable()
					.rows()
					.remove();
			}

			aps = aps.concat(response.aps);
			$.each(response.aps, function() {
				loadAPUI(this);
			});

			offset += apiLimit;
			if (offset < response.total) {
				if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = offset.toString();
				var apProgress = (offset / response.total) * 100;
				apNotification.update({ progress: apProgress });
				getAPData(offset, needClients);
			} else {
				if (apNotification) apNotification.update({ progress: 100 });
				updateAPUI();
				saveDataToDB('monitoring_aps', JSON.stringify(aps));
				if (apNotification) apNotification.close();

				// Grab wireless client data after grabbing APs (so we can match AP Serials to AP Names)
				if (needClients) getWirelessClientData(null);
				else {
					checkForMonitoringUpdateCompletion();
					apPromise.resolve();
				}
			}
		}
	});
	return apPromise.promise();
}

function refreshAPData() {
	apiMessage = false;
	if (apNotification) apNotification.close();
	apNotification = showProgressNotification('ca-wifi', 'Obtaining APs...', 'bottom', 'center', 'info');
	
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			if (document.getElementById('ap_count')) document.getElementById('ap_count').innerHTML = '0';
			getAPData(0, false);
		}
	});
}

function getAPs() {
	return aps;
}

function getAPsForSite(site) {
	var siteAPs = [];
	$.each(aps, function() {
		if (this['site'] === site) siteAPs.push(this);
	});
	return siteAPs;
}

function getAPsForSiteID(siteID) {
	return getAPsForSite(getNameforSiteId(siteID));
}

function getAPsForGroup(group) {
	var groupAPs = [];
	$.each(aps, function() {
		if (this['group_name'] === group) groupAPs.push(this);
	});
	return groupAPs;
}

function getBSSIDData(offset) {
	if (offset == 0) bssidPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/bssids?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/bssids)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			saveDataToDB('monitoring_bssids', JSON.stringify([]));
		} else {
			if (offset === 0) {
				bssids = [];
			}

			bssids = bssids.concat(response.aps);

			offset += apiLimit;
			if (offset < response.total) getBSSIDData(offset);
			else {
				bssidPromise.resolve();
				saveDataToDB('monitoring_bssids', JSON.stringify(bssids));
			}
		}
	});
	return bssidPromise.promise();
}

function getBSSIDs() {
	return bssids;
}

// Switches
// Updated: 1.6.0
function loadSwitchUI(device) {
	//console.log(device);
	var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	var deviceUp = true;
	if (device['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	} else {
		downSwitchCount++;
		deviceUp = false;
	}

	// Build Uptime String
	var uptimeString = '-';
	if (device['uptime'] > 0) {
		var uptime = moment.duration(device['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}

	// Make link to Central
	name = encodeURI(device['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
	var clientURL = centralBaseURL + '/frontend/#/SWITCHDETAILS/' + device['serial'] + '?cssn=' + device['serial'] + '&cdcn=' + name + '&nc=device';

	// Add row to table
	var table = $('#switch-table').DataTable();
	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'], device['ip_address'], device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], '<span title="' + device['uptime'] + '"</span>'+uptimeString]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Switch', '<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'], device['macaddr'], device['site'], device['group_name'], '', '', device['model'], device['serial'], device['firmware_version']]);
}

function updateSwitchUI() {
	// Force reload of table data
	$('#switch-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '' + switches.length + '';

	$(document.getElementById('switch_icon')).removeClass('text-warning');
	if (downSwitchCount > 0) {
		$(document.getElementById('switch_icon')).addClass('text-danger');
		$(document.getElementById('switch_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('switch_icon')).removeClass('text-danger');
		$(document.getElementById('switch_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageSwitch();
}

function getSwitchData(offset, needClients) {
	if (showTimingData) {
		var switchDate = Date.now();
		console.log('Requesting Switches offset: ' + offset)
	}
	if (offset == 0) switchPromise = new $.Deferred();

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/switches?calculate_total=true&show_resource_details=true&calculate_client_count=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-switchDate)/1000 + ' - received Switches offset: ' + offset)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/switches)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-primary');
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '-';
			showNotification('ca-switch-stack', response.error, 'top', 'center', 'danger');
			if (switchNotification) switchNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('switch_icon')).addClass('text-warning');
			$(document.getElementById('switch_icon')).removeClass('text-danger');
			$(document.getElementById('switch_icon')).removeClass('text-success');
			$(document.getElementById('switch_icon')).removeClass('text-primary');
			saveDataToDB('monitoring_switches', JSON.stringify([]));
		} else {
			if (offset == 0) {
				downSwitchCount = 0;
				switches = [];
				$('#switch-table')
					.DataTable()
					.rows()
					.remove();
				var path = window.location.pathname;
				var page = path.split('/').pop();
				if (page.includes('experimental-switching'))
					$('#chassis-switch-table')
						.DataTable()
						.rows()
						.remove();
			}

			switches = switches.concat(response.switches);
			$.each(response.switches, function() {
				loadSwitchUI(this);
			});

			offset += apiLimit;
			if (offset < response.total) {
				if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = offset.toString();
				var switchProgress = (offset / response.total) * 100;
				switchNotification.update({ progress: switchProgress });
				getSwitchData(offset, needClients);
			} else {
				if (switchNotification) switchNotification.update({ progress: 100 });
				updateSwitchUI();
				saveDataToDB('monitoring_switches', JSON.stringify(switches));
				if (switchNotification) switchNotification.close();
				// Grab wired client data after grabbing switches (so we can match switch Serials to AP Names)
				if (needClients) getWiredClientData(null);
				else {
					checkForMonitoringUpdateCompletion();
					switchPromise.resolve();
				}
			}
		}
	});
	return switchPromise.promise();
}

function refreshSwitchData() {
	apiMessage = false;
	if (switchNotification) switchNotification.close();
	switchNotification = showProgressNotification('ca-switch-stack', 'Obtaining Switches...', 'bottom', 'center', 'info');
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			if (document.getElementById('switch_count')) document.getElementById('switch_count').innerHTML = '0';
			getSwitchData(0, false);
		}
	});
}

function getSwitches() {
	return switches;
}

function getSwitchesForSite(site) {
	var siteSwitches = [];
	$.each(switches, function() {
		if (this['site'] === site) siteSwitches.push(this);
	});
	return siteSwitches;
}

function getSwitchesForSiteID(siteID) {
	return getSwitchesForSite(getNameforSiteId(siteID));
}

function getSwitchesForGroup(group) {
	var groupSwitches = [];
	$.each(switches, function() {
		if (this['group_name'] == group) {
			groupSwitches.push(this);
		}
	});
	return groupSwitches;
}

// Gateways
// Updated: 1.22.0
function loadGatewayUI(device) {
	if (!device.message) {  // Protection against API limit message accidently being in the gateway list. (although it shouldn't happen any more)
		var memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
	
		var status = '<i class="fa-solid fa-circle text-danger"></i>';
		var deviceUp = true;
		if (device['status'] == 'Up') {
			status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
		} else {
			downGatewayCount++;
			deviceUp = false;
		}
	
		// Build Uptime String
		var uptimeString = '-';
		if (device['uptime'] > 0) {
			var uptime = moment.duration(device['uptime'] * 1000);
			uptimeString = uptime.humanize();
		}
	
		var uplinkStatus = '';
		if (device['uplinks_metric']) {
			var uplinks = device['uplinks_metric'];
			if (uplinks['up'] > 0) uplinkStatus += '<i class="fa-solid fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + uplinks['up'] + ' </strong></span>';
			else uplinkStatus += '<i class="fa-solid fa-arrow-up fa-fw"></i><span class="me-2"> ' + uplinks['up'] + ' </span>';
			if (uplinks['down'] > 0) uplinkStatus += '<i class="fa-solid fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + uplinks['down'] + ' </strong></span>';
			else uplinkStatus += '<i class="fa-solid fa-arrow-down fa-fw"></i><span class="me-2"> ' + uplinks['down'] + ' </span>';
		}
	
		var tunnelsStatus = '';
		if (device['tunnels_metric']) {
			var tunnels = device['tunnels_metric'];
			if (tunnels['up'] > 0) tunnelsStatus += '<i class="fa-solid  fa-arrow-up fa-fw text-success"></i><span class="text-success me-2"><strong> ' + tunnels['up'] + ' </strong></span>';
			else tunnelsStatus += '<i class="fa-solid fa-arrow-up fa-fw"></i><span class="me-2"> ' + tunnels['up'] + ' </span>';
			if (tunnels['down'] > 0) tunnelsStatus += '<i class="fa-solid fa-arrow-down fa-fw text-danger"></i><span class="text-danger me-2"><strong> ' + tunnels['down'] + ' </strong></span>';
			else tunnelsStatus += '<i class="fa-solid fa-arrow-down fa-fw"></i><span class="me-2"> ' + tunnels['down'] + ' </span>';
		}
		
	
		// Make link to Central
		name = encodeURI(device['name']);
		var apiURL = localStorage.getItem('base_url');
		var centralBaseURL = centralURLs[apiURL];
		if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
		var clientURL = centralBaseURL + '/frontend/#/GATEWAYDETAIL/OVERVIEW/' + device['serial'] + '?csg=' + device['serial'] + '&cdcn=' + name + '&nc=gateway';
	
		// Add row to table
		var table = $('#gateway-table').DataTable();
		table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'] ? device['status']:'Down', device['ip_address'] ? device['ip_address']:'', device['public_ip'] ? device['public_ip'] : '', device['model'] ? device['model']: '', device['serial'], device['firmware_version'] ? device['firmware_version']:'', device['site']?device['site']:'', device['group_name'], device['macaddr'] ? device['macaddr']:'', '<span title="' + device['uptime'] + '"</span>'+uptimeString, uplinkStatus, tunnelsStatus, device['reboot_reason']?device['reboot_reason']:'']);
	
		var universalTable = $('#universal-table').DataTable();
		universalTable.row.add(['Gateway', '<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['ip_address'] ? device['ip_address']:'', device['macaddr'] ? device['macaddr']:'', device['site']?device['site']:'', device['group_name'], '', '', device['model']?device['model']:'', device['serial'], device['firmware_version']?device['firmware_version']:'']);
	}
}

function updateGatewayUI() {
	// Force reload of table data
	$('#gateway-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '' + gateways.length + '';
	$(document.getElementById('gateway_icon')).removeClass('text-warning');
	if (downGatewayCount > 0) {
		$(document.getElementById('gateway_icon')).addClass('text-danger');
		$(document.getElementById('gateway_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('gateway_icon')).removeClass('text-danger');
		$(document.getElementById('gateway_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageGateway();
}

function getGatewayData(offset) {
	if (showTimingData) {
		var gwDate = Date.now();
		console.log('Requesting Gateways offset: ' + offset)
	}
	
	if (offset == 0) gatewayPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-gwDate)/1000 + ' - received Gateways offset: ' + offset)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/gateways)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
			showNotification('ca-gateway', response.error, 'top', 'center', 'danger');
			if (gatewayNotification) gatewayNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			saveDataToDB('monitoring_gateways', JSON.stringify([]));
		} else {
			if (offset == 0) {
				downGatewayCount = 0;
				gateways = [];
				$('#gateway-table')
					.DataTable()
					.rows()
					.remove();
			}

			gateways = gateways.concat(response.gateways);

			// Only load the gateway table with info if we are not getting the detailed info
			if (!needGatewayDetails) {
				$.each(response.gateways, function() {
					loadGatewayUI(this);
				});
			}
			offset += apiLimit;
			if (offset < response.total) {
				if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = offset.toString();
				var gwProgress = (offset / response.total) * 100;
				gatewayNotification.update({ progress: gwProgress });
				getGatewayData(offset);
			} else {
				if (needGatewayDetails && response.total > 0) {
					setTimeout(getGatewayDetails, 1000, 0);
				} else {
					if (gatewayNotification) gatewayNotification.update({ progress: 100 });
					updateGatewayUI();
					saveDataToDB('monitoring_gateways', JSON.stringify(gateways));
					if (gatewayNotification) gatewayNotification.close();
					if (gatewayPromise) gatewayPromise.resolve();
					checkForMonitoringUpdateCompletion();
				}
			}
		}
	});
	return gatewayPromise.promise();
}

function getGatewayDetails(gatewayIndex) {
	if (showTimingData) {
		var gwDetailsDate = Date.now();
		console.log('Requesting Gateway Detail (index: ' + gatewayIndex + ')');
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/gateways/' + gateways[gatewayIndex].serial + '?stats_metric=true',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData)	console.log((Date.now()-gwDetailsDate)/1000 + ' - received Gateway Detail (index: ' + gatewayIndex + ')');
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/gateways/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
			showNotification('ca-gateway', response.error, 'top', 'center', 'danger');
			if (gatewayNotification) gatewayNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (response.message.includes('API rate limit exceeded')) getGatewayDetails(gatewayIndex);
			else {
				showNotification('ca-api', response.message + ' ('+gateways[gatewayIndex].serial+')', 'top', 'center', 'danger');
				logError(response.message + ' ('+gateways[gatewayIndex].serial+')');
				// Error on that gateway - move to the next one
				gatewayIndex++;
				if (gatewayIndex < gateways.length) {
					var gwProgress = (gatewayIndex / gateways.length) * 100;
					gatewayNotification.update({ progress: gwProgress });
					getGatewayDetails(gatewayIndex);
					// get the next gateway's detailed info
				} else {
					gatewayNotification.update({ progress: 100 });
					$.each(gateways, function() {
						loadGatewayUI(this);
					});
					updateGatewayUI();
					saveDataToDB('monitoring_gateways', JSON.stringify(gateways));
					if (gatewayNotification) gatewayNotification.close();
					if (gatewayPromise) gatewayPromise.resolve();
					checkForMonitoringUpdateCompletion();
				}
			}
		} else {
			//console.log(response);
			gateways[gatewayIndex] = response;
			gatewayIndex++;
			if (gatewayIndex < gateways.length) {
				var gwProgress = (gatewayIndex / gateways.length) * 100;
				gatewayNotification.update({ progress: gwProgress });
				getGatewayDetails(gatewayIndex);
				// get the next gateway's detailed info
			} else {
				gatewayNotification.update({ progress: 100 });
				$.each(gateways, function() {
					loadGatewayUI(this);
				});
				updateGatewayUI();
				saveDataToDB('monitoring_gateways', JSON.stringify(gateways));
				if (gatewayNotification) gatewayNotification.close();
				if (gatewayPromise) gatewayPromise.resolve();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function refreshGatewayData() {
	apiMessage = false;
	if (gatewayNotification) gatewayNotification.close();
	gatewayNotification = showProgressNotification('ca-gateway', 'Obtaining Gateways...', 'bottom', 'center', 'info');
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '0';
			$('#gateway-table')
				.DataTable()
				.rows()
				.remove();
	
			getGatewayData(0);
		}
	});
}

function disableGatewayDetails() {
	needGatewayDetails = false;
}

function getGateways() {
	return gateways;
}

function getGatewaysForSite(site) {
	var siteGateways = [];
	$.each(gateways, function() {
		if (this['site'] === site) siteGateways.push(this);
	});
	return siteGateways;
}

function getGatewaysForSiteID(siteID) {
	return getGatewaysForSite(getNameforSiteId(siteID));
}

function getGatewaysForGroup(group) {
	var groupGateways = [];
	$.each(gateways, function() {
		if (this['group_name'] === group) groupGateways.push(this);
	});
	return groupGateways;
}

// Controllers
// Added: 1.30
function loadControllerUI(device) {
	var memoryUsage = '0';
	if (device['mem_total'] > 0) {
		memoryUsage = (((device['mem_total'] - device['mem_free']) / device['mem_total']) * 100).toFixed(0).toString();
	}

	var status = '<i class="fa-solid fa-circle text-danger"></i>';
	var deviceUp = true;
	if (device['status'] == 'Up') {
		status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + device['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
	} else {
		downControllerCount++;
		deviceUp = false;
	}

	// Build Uptime String
	var uptimeString = '-';
	if (device['uptime'] > 0) {
		var uptime = moment.duration(device['uptime'] * 1000);
		uptimeString = uptime.humanize();
	}
	
	var ip_address = device['ip_address'];
	if (!ip_address) ip_address = '';

	// Make link to Central
	name = encodeURI(device['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
	var clientURL = centralBaseURL + '/frontend/#/CONTROLLERDETAIL/OVERVIEW/' + device['serial'] + '?csg=' + device['serial'] + '&cdcn=' + name + '&nc=controller';

	// Add row to table
	var table = $('#controller-table').DataTable();
	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, device['status'], ip_address, device['model'], device['serial'], device['firmware_version'], device['site'], device['group_name'], device['macaddr'], '<span title="' + device['uptime'] + '"</span>'+uptimeString, device['role'], device['reboot_reason']]);

	var universalTable = $('#universal-table').DataTable();
	universalTable.row.add(['Controller', '<a href="' + clientURL + '" target="_blank"><strong>' + device['name'] + '</strong></a>', status, ip_address, device['macaddr'], device['site'], device['group_name'], '', '', device['model'], device['serial'], device['firmware_version']]);
}

function updateControllerUI() {
	// Force reload of table data
	$('#controller-table')
		.DataTable()
		.rows()
		.draw();
	$('#universal-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '' + controllers.length + '';
	$(document.getElementById('controller_icon')).removeClass('text-warning');
	if (downControllerCount > 0) {
		$(document.getElementById('controller_icon')).addClass('text-danger');
		$(document.getElementById('controller_icon')).removeClass('text-success');
	} else {
		$(document.getElementById('controller_icon')).removeClass('text-danger');
		$(document.getElementById('controller_icon')).addClass('text-success');
	}
	// call to current showing page
	loadCurrentPageController();
}

function getControllerData(offset) {
	if (offset == 0) controllerPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/mobility_controllers?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/mobility_controllers)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('controller_icon')).addClass('text-warning');
			$(document.getElementById('controller_icon')).removeClass('text-primary');
			$(document.getElementById('controller_icon')).removeClass('text-success');
			$(document.getElementById('controller_icon')).removeClass('text-danger');
			if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '-';
			showNotification('ca-controller', response.error, 'top', 'center', 'danger');
			if (gatewayNotification) gatewayNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('controller_icon')).addClass('text-warning');
			$(document.getElementById('controller_icon')).removeClass('text-primary');
			$(document.getElementById('controller_icon')).removeClass('text-success');
			$(document.getElementById('controller_icon')).removeClass('text-danger');
			saveDataToDB('monitoring_controllers', JSON.stringify([]));
		} else {
			if (offset == 0) {
				downControllerCount = 0;
				controllers = [];
				$('#controller-table')
					.DataTable()
					.rows()
					.remove();
			}

			controllers = controllers.concat(response.mcs);

			// Only load the controller table with info if we are not getting the detailed info
			if (!needGatewayDetails) {
				$.each(response.mcs, function() {
					loadControllerUI(this);
				});
			}

			offset += apiLimit;
			if (offset < response.total) {
				if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = offset.toString();
				var gwProgress = (offset / response.total) * 100;
				gatewayNotification.update({ progress: gwProgress });
				getControllerData(offset);
			} else {
				if (needGatewayDetails && response.total > 0) {
					setTimeout(getControllerDetails, 500, 0);
				} else {
					gatewayNotification.update({ progress: 100 });
					updateControllerUI();
					saveDataToDB('monitoring_controllers', JSON.stringify(controllers));
					if (gatewayNotification) gatewayNotification.close();
					if (controllerPromise) controllerPromise.resolve();
					checkForMonitoringUpdateCompletion();
				}
			}
		}
	});
	return controllerPromise.promise();
}

function getControllerDetails(controllerIndex) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v2/mobility_controllers/' + controllers[controllerIndex].serial + '?stats_metric=true',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v2/mobility_controllers/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('gateway_icon')).addClass('text-warning');
			$(document.getElementById('gateway_icon')).removeClass('text-primary');
			$(document.getElementById('gateway_icon')).removeClass('text-success');
			$(document.getElementById('gateway_icon')).removeClass('text-danger');
			if (document.getElementById('gateway_count')) document.getElementById('gateway_count').innerHTML = '-';
			showNotification('ca-gateway', response.error, 'top', 'center', 'danger');
			if (gatewayNotification) gatewayNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				if (response.message.includes('API rate limit exceeded')) getControllerDetails(gatewayIndex);
				else {
					apiMessage = true;
					showNotification('ca-api', response.message, 'top', 'center', 'danger');
				}
			}
		} else {
			controllers[controllerIndex] = response;
			controllerIndex++;
			if (controllerIndex < controllers.length) {
				var gwProgress = (controllerIndex / controllers.length) * 100;
				gatewayNotification.update({ progress: gwProgress });
				getControllerDetails(controllerIndex);
				// get the next gateway's detailed info
			} else {
				gatewayNotification.update({ progress: 100 });
				$.each(controllers, function() {
					loadControllerUI(this);
				});
				updateControllerUI();
				saveDataToDB('monitoring_controllers', JSON.stringify(controllers));
				if (gatewayNotification) gatewayNotification.close();
				if (controllerPromise) controllerPromise.resolve();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function refreshControllerData() {
	apiMessage = false;
	if (gatewayNotification) gatewayNotification.close();
	gatewayNotification = showProgressNotification('ca-controller', 'Obtaining Controllers...', 'bottom', 'center', 'info');
	$.when(authRefresh()).then(function() {
		if (!failedAuth) {
			if (document.getElementById('controller_count')) document.getElementById('controller_count').innerHTML = '0';
			$('#controller-table')
				.DataTable()
				.rows()
				.remove();
	
			getControllerData(0);
		}
	});
}

function getControllers() {
	return controllers;
}

function getControllersForSite(site) {
	var siteControllers = [];
	$.each(controllers, function() {
		if (this['site'] === site) siteControllers.push(this);
	});
	return siteControllers;
}

function getControllersForSiteID(siteID) {
	return getControllersForSite(getNameforSiteId(siteID));
}

function getControllersForGroup(group) {
	var groupControllers = [];
	$.each(controllers, function() {
		if (this['group_name'] === group) groupControllers.push(this);
	});
	return groupControllers;
}

// Sites
// Updated: 1.6.0
function loadSiteUI(site) {
	// Add row to table
	var table = $('#site-table').DataTable();

	var capestate = '';
	if (site['cape_state'] === 'good') {
		capestate += '<i class="fa-solid fa-circle text-success"></i>';
		capestate += ' No User Experience Issues';
	} else if (site['cape_state']) {
		capestate += '<i class="fa-solid fa-circle text-danger"></i> ';
		capestate = titleCase(noUnderscore(site['cape_state_dscr'][0]));
	}
	if (site['cape_url']) {
		capestate = '<a href="' + site['cape_url'] + '" target="_blank">' + capestate + '</a>';
	}

	var aiinsights = '';
	if (site['insight_hi'] != 0) {
		aiinsights += '<i class="fa-solid fa-circle text-danger"></i>';
	}
	if (site['insight_mi'] != 0) {
		aiinsights += '<i class="fa-solid fa-circle text-warning"></i>';
	}
	if (site['insight_lo'] != 0) {
		aiinsights += '<i class="fa-solid fa-circle text-minor"></i>';
	}
	if (aiinsights === '') {
		aiinsights = '<i class="fa-solid fa-circle text-neutral"></i>';
	}

	var status = '<i class="fa-solid fa-circle text-success"></i>';
	var healthReason = '';
	if (site['wan_uplinks_down'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Gateway with WAN links down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wan_tunnels_down'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Gateway with VPN Tunnels down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_cpu_high'] > 1) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'APs with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_cpu_high'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'AP with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_cpu_high'] > 1) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Switches with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_cpu_high'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Switch with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['branch_cpu_high'] > 1) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Gateways with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['branch_cpu_high'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'Gateway with high CPU usage';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wlan_device_status_down'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'One or more APs are down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['wired_device_status_down'] > 0) {
		status = '<i class="fa-solid fa-circle text-danger"></i>';
		healthReason = 'One or more switches are down';
		if (siteIssues > 1) siteIssues = 1;
	} else if (site['device_high_noise_6ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High noise on 6GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_noise_5ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High noise on 5GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_noise_2_4ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High noise on 2.4GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_6ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 6GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_5ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 5GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_ch_2_4ghz'] > 0) {
		status = '<i class="fa-solid fa-circle text-warning"></i>';
		healthReason = 'High channel utilization on 2.4GHz';
		if (siteIssues > 2) siteIssues = 2;
	} else if (site['device_high_mem'] > 0) {
		status = '<i class="fa-solid fa-circle text-minor"></i>';
		healthReason = 'Devices with high memory utilization';
		if (siteIssues > 3) siteIssues = 3;
	}

	// Make link to Central
	var name = encodeURI(site['name']);
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url);
	var clientURL = centralBaseURL + '/frontend/#/SITEHEALTH?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';
	var aiURL = centralBaseURL + '/frontend/#/SITE_INSIGHTS?id=' + site['id'] + '&name=' + name + '&cid=2&cn=Site&l=label&nc=site';

	table.row.add(['<a href="' + clientURL + '" target="_blank"><strong>' + site['name'] + '</strong></a>', status, site['device_up'], site['device_down'], site['connected_count'], capestate, '<a href="' + aiURL + '" target="_blank">' + aiinsights + '</a>', healthReason]);
}

function updateSiteUI() {
	// Force reload of table data
	$('#site-table')
		.DataTable()
		.rows()
		.draw();
	if (document.getElementById('site_count')) document.getElementById('site_count').innerHTML = '' + sites.length + '';

	if (siteIssues == 1) {
		$(document.getElementById('site_icon')).addClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 2) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).addClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 3) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).addClass('text-minor');
		$(document.getElementById('site_icon')).removeClass('text-primary');
	} else if (siteIssues == 4) {
		$(document.getElementById('site_icon')).removeClass('text-danger');
		$(document.getElementById('site_icon')).removeClass('text-warning');
		$(document.getElementById('site_icon')).removeClass('text-minor');
		$(document.getElementById('site_icon')).addClass('text-primary');
	}

	if ($('#siteselector')) {
		sites.sort((a, b) => {
			const siteA = a.name.toUpperCase(); // ignore upper and lowercase
			const siteB = b.name.toUpperCase(); // ignore upper and lowercase
			// Sort on Site Name
			if (siteA < siteB) {
				return -1;
			}
			if (siteA > siteB) {
				return 1;
			}
			return 0;
		});

		$.each(sites, function() {
			// Add group to the dropdown selector
			$('#siteselector').append($('<option>', { value: this['name'], text: this['name'] }));
			if ($('#siteselector').length != 0) {
				$('#siteselector').selectpicker('refresh');
			}
		});
	}

	// call to current showing page
	loadCurrentPageSite();
}

function getSiteData(offset) {
	if (showTimingData) {
		var siteDate = Date.now();
		console.log('Requesting Sites offset: ' + offset)
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/branchhealth/v1/site?limit=' + apiSiteLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-siteDate)/1000 + ' - received Sites offset: ' + offset)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/branchhealth/v1/site)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			if (document.getElementById('site_count')) document.getElementById('site_count').innerHTML = '-';
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
			showNotification('ca-ca-world-pin', response.error, 'top', 'center', 'danger');
			if (siteNotification) siteNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('site_icon')).addClass('text-warning');
			$(document.getElementById('site_icon')).removeClass('text-primary');
			saveDataToDB('monitoring_sites', JSON.stringify([]));
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset == 0) {
				sites = [];
				$('#site-table')
					.DataTable()
					.clear();
				if (document.getElementById('siteselector')) {
					// remove old groups from the selector
					select = document.getElementById('siteselector');
					select.options.length = 0;
				}
			}

			sites = sites.concat(response.items);
			$.each(response.items, function() {
				loadSiteUI(this);
			});

			offset += apiSiteLimit;
			if (offset < response.total) {
				var siteProgress = (offset / response.total) * 100;
				if (siteNotification) siteNotification.update({ progress: siteProgress });
				getSiteData(offset);
			} else {
				if (siteNotification) siteNotification.update({ progress: 100 });
				updateSiteUI();
				saveDataToDB('monitoring_sites', JSON.stringify(sites));
				if (siteNotification) siteNotification.close();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function getSites() {
	return sites;
}

function getSiteNameForID(siteID) {
	var siteName = '';
	$.each(sites, function() {
		if (this['id'] === siteID) siteName = this['name'];
	});
	return siteName;
}

function getSiteIDForName(siteName) {
	var siteID = '';
	$.each(sites, function() {
		if (this['name'] === siteName) siteID = this['id'];
	});
	return siteID;
}

// Groups
function loadGroupUI(group) {
	// Add row to table
	//console.log(group);
	var table = $('#group-table').DataTable();
	var wiredTemplateUsed = '<button class="btn btn-round btn-outline btn-tag">UI Group</button>';
	if (group.template_details && group.template_details['Wired']) wiredTemplateUsed = '<button class="btn btn-round btn-tag">Template</button>';
	var wirelessTemplateUsed = '<button class="btn btn-round btn-outline btn-tag">UI Group</button>';
	if (group.template_details && group.template_details['Wireless']) wirelessTemplateUsed = '<button class="btn btn-round btn-tag">Template</button>';

	var groupProperties = '';
	if (group.group_properties) {
		if (group.group_properties['NewCentral']) groupProperties += '<button class="btn btn-round btn-tag btn-purple">New Central</button>';
		
		if (group.group_properties['AllowedDevTypes'].includes('AccessPoints') || group.group_properties['AllowedDevTypes'].includes('Gateways')) {
			if (group.group_properties['AOSVersion'] === 'AOS_10X') groupProperties += '<button class="btn btn-round btn-tag btn-warning">AOS 10</button>';
			if (group.group_properties['AOSVersion'] === 'AOS_8X') groupProperties += '<button class="btn btn-round btn-tag btn-element">AOS 8</button>';
		}

		if (group.group_properties['AllowedDevTypes'].includes('AccessPoints')) {
			if (group.group_properties['AOSVersion'] === 'AOS_10X' && group.group_properties['ApNetworkRole'] === 'Standard') groupProperties += '<button class="btn btn-round btn-tag">Campus AP</button>';
			if (group.group_properties['AOSVersion'] === 'AOS_10X' && group.group_properties['ApNetworkRole'] === 'Microbranch') groupProperties += '<button class="btn btn-round btn-tag">Microbranch AP</button>';
		}

		if (group.group_properties['AllowedDevTypes'].includes('Switches')) {
			if (group.group_properties['AllowedSwitchTypes'].includes('AOS_CX')) groupProperties += '<button class="btn btn-round btn-tag btn-primary">AOS-CX</button>';
			if (group.group_properties['AllowedSwitchTypes'].includes('AOS_S')) groupProperties += '<button class="btn btn-round btn-tag btn-info">AOS-S</button>';
			if (group.group_properties['MonitorOnly'] && group.group_properties['MonitorOnly'].length > 0) groupProperties += '<button class="btn btn-round btn-outline btn-tag btn-primary">Monitor-Only</button>';
		}

		if (group.group_properties['AllowedDevTypes'].includes('Gateways')) {
			if (group.group_properties['GwNetworkRole'] === 'BranchGateway') groupProperties += '<button class="btn btn-round btn-tag">Branch Gateway</button>';
			if (group.group_properties['GwNetworkRole'] === 'WLANGateway') groupProperties += '<button class="btn btn-round btn-tag">Mobility Gateway</button>';
			if (group.group_properties['GwNetworkRole'] === 'VPNConcentrator') groupProperties += '<button class="btn btn-round btn-tag">VPNC</button>';
		}
		
	}

	table.row.add(['<strong>' + group['group'] + '</strong>', wiredTemplateUsed, wirelessTemplateUsed, groupProperties]);
}

function updateGroupUI() {
	// Force reload of table data
	$('#group-table')
		.DataTable()
		.rows()
		.draw();

	if (document.getElementById('group_count')) document.getElementById('group_count').innerHTML = '' + groups.length + '';
	$(document.getElementById('group_icon')).addClass('text-primary');
	$(document.getElementById('group_icon')).removeClass('text-warning');

	if (document.getElementById('groupselector')) {
		var groupsList = document.getElementById('groupselector');
		groupsList.options.length = 0;
		
		// Sort the groups alphabetically
		groups.sort((a, b) => {
			const groupA = a.group.toUpperCase(); // ignore upper and lowercase
			const groupB = b.group.toUpperCase(); // ignore upper and lowercase
			// Sort on Group name
			if (groupA < groupB) {
				return -1;
			}
			if (groupA > groupB) {
				return 1;
			}
			return 0;
		});
		
		// Add the groups to the dropdown
		$.each(groups, function() {
			// Add group to the dropdown selector
			$('#groupselector').append($('<option>', { value: this['group'], text: this['group'] }));
			if ($('#groupselector').length != 0) {
				$('#groupselector').selectpicker('refresh');
			}
		});
	}
	loadCurrentPageGroup();
}

function getGroupData(offset) {
	if (showTimingData) {
		var groupDate = Date.now();
		console.log('Requesting Groups offset: ' + offset)
	}
	
	if (offset == 0) groupPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups?limit=' + apiGroupLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (showTimingData) console.log((Date.now()-groupDate)/1000 + ' - received Groups offset: ' + offset)
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/groups)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getGroupData(0);
					}
				});
			} else showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			showNotification('ca-folder-settings', response.error, 'top', 'center', 'danger');
			if (groupNotification) groupNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			saveDataToDB('monitoring_groups', JSON.stringify([]));
			checkForMonitoringUpdateCompletion();
		} else {
			var path = window.location.pathname;
			var page = path.split('/').pop();

			if (offset == 0) {
				groups = [];
				$('#group-table')
					.DataTable()
					.rows()
					.remove();

				// remove old groups from the selector
				select = document.getElementById('groupselector');
				if (select) select.options.length = 0;
			}

			offset += apiGroupLimit;
			if (offset < response.total) {
				getGroupData(offset);
				getGroupTemplateInfo(response.data, false);
			} else {
				getGroupTemplateInfo(response.data, true);
			}
		}
	});
	return groupPromise.promise();
}

// Added in 1.15 (splitting up the larger refresh) - allows for selective refresh of data
function updateGroupData() {
	groups = [];
	if (groupNotification) groupNotification.close();
	groupNotification = showLongNotification('ca-folder-settings', 'Obtaining Groups...', 'bottom', 'center', 'info');
	getGroupData(0);
}

function getGroups() {
	return groups;
}

// Updated: 1.5.0
function getGroupTemplateInfo(currentGroups, last) {
	// ****************************************************************************************************************************************************** //
	// remove any groups with a comma in the name... due to API issue.
	var newGroups = [];
	$.each(currentGroups, function() {
		if (!this[0].includes(',')) newGroups.push(this);
	});
	currentGroups = newGroups;
	// ***************************************************************************************************************************************************** //

	// Combine groups into a single escaped comma separated list
	var groupList = currentGroups.join('%2C');
	//groupList = encodeURI(groupList);
	groupList = groupList.replace('&', '%26');
	groupList = groupList.replace("'", '%27');

	//console.log(groupList)

	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v2/groups/template_info?groups=' + groupList,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	//console.log(settings)

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/groups/template_info)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			showNotification('ca-folder-settings', response.error, 'top', 'center', 'danger');
			if (groupNotification) groupNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			saveDataToDB('monitoring_groups', JSON.stringify([]));
			if (groupNotification) groupNotification.close();
			checkForMonitoringUpdateCompletion();
		} else {
			// Sort Groups before loading into tables or dropdowns
			groups = groups.concat(response.data);
			groups.sort(compareGroups);
			//console.log(groups);
			if (response.data) response.data.sort(compareGroups);

			// Do we need to grab the group properties?
			var loadGroupProperties = localStorage.getItem('load_group_properties');
			if (loadGroupProperties === null || loadGroupProperties === '') {
				loadGroupProperties = true;
			} else {
				loadGroupProperties = JSON.parse(loadGroupProperties);
			}
			if (loadGroupProperties) {
				getGroupProperties(groupList, last);
			} else {
				$.each(response.data, function() {
					loadGroupUI(this);
				});

				if (last) {
					updateGroupUI();
					saveDataToDB('monitoring_groups', JSON.stringify(groups));
					if (groupNotification) {
						groupNotification.update({ message: 'Group information obtained', type: 'success' });
						setTimeout(groupNotification.close, 1000);
					}
					groupPromise.resolve();
					checkForMonitoringUpdateCompletion();
				}
			}
		}
	});
}

// removed until Migration support is needed
// Introduced: 1.5.0
// Get the group properties... Central 2.5.4 and later
function getGroupProperties(groupList, last) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/groups/properties?groups=' + groupList,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	//console.log(settings)

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/groups/properties)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			showNotification('ca-folder-settings', response.error, 'top', 'center', 'danger');
			if (groupNotification) groupNotification.close();
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
			saveDataToDB('monitoring_groups', JSON.stringify([]));
		} else {
			// Find each group in "groups" and add properties to it
			$.each(response.data, function() {
				var properties = this['properties'];
				var groupName = this['group'];
				$.each(groups, function() {
					if (this['group'] === groupName) {
						this['group_properties'] = properties;
						loadGroupUI(this);
						return false;
					}
				});
			});

			// Sort Groups before loading into tables or dropdowns
			groups.sort(compareGroups);
			//console.log(groups);
			response.data.sort(compareGroups);

			if (last) {
				updateGroupUI();
				saveDataToDB('monitoring_groups', JSON.stringify(groups));
				if (groupNotification) {
					groupNotification.update({ message: 'Group information obtained', type: 'success' });
					setTimeout(groupNotification.close, 1000);
				}
				groupPromise.resolve();
				checkForMonitoringUpdateCompletion();
			}
		}
	});
}

function compareGroups(a, b) {
	if (a.group < b.group) {
		return -1;
	}
	if (a.group > b.group) {
		return 1;
	}
	return 0;
}

// Swarms
function loadSwarmUI(swarm) {
	if ($('#groupselector')) {
		// Add site to the dropdown selector
		//console.log(swarm);
		$('#groupselector').append($('<option>', { value: swarm['swarm_id'], text: swarm['group_name'] + ' > ' + swarm['name'] }));
		if ($('#groupselector').length != 0) {
			$('#groupselector').selectpicker('refresh');
		}
	}
}

function getSwarmData(offset) {
	if (offset == 0) swarmPromise = new $.Deferred();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/monitoring/v1/swarms?calculate_total=true&limit=' + apiLimit + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/monitoring/v1/swarms)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			if (response.error === 'invalid_token') {
				// Access Token expired - get a new one and try again.
				$.when(authRefresh()).then(function() {
					if (!failedAuth) {
						getSwarmData(offset);
					}
				});
			} else showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.hasOwnProperty('message')) {
			if (!apiMessage) {
				apiMessage = true;
				var level = 'danger';
				if (response.message.includes('API rate limit exceeded')) level = 'warning';
				showNotification('ca-api', response.message, 'top', 'center', level);
			}
			saveDataToDB('monitoring_swarms', JSON.stringify([]));
			checkForMonitoringUpdateCompletion();
		} else {
			if (offset == 0) {
				swarms = [];
			}
			swarms = swarms.concat(response.swarms);

			offset += apiLimit;
			if (offset < response.total) getSwarmData(offset);
			else {
				loadCurrentPageSwarm();
				saveDataToDB('monitoring_swarms', JSON.stringify(swarms));
				swarmPromise.resolve();
				if (vcNotification) setTimeout(vcNotification.close, 1000);
				checkForMonitoringUpdateCompletion();
			}
		}
	});
	return swarmPromise.promise();
}

// Added in 1.15 (splitting up the larger refresh) - allows for selective refresh of data
function updateSwarmData() {
	// Do we need to grab the Swarms?
	var loadVCConfig = localStorage.getItem('load_vc_config');
	if (loadVCConfig === null || loadVCConfig === '') {
		loadVCConfig = true;
	} else {
		loadVCConfig = JSON.parse(loadVCConfig);
	}
	if (loadVCConfig) {
		if (vcNotification) vcNotification.close();
		vcNotification = showNotification('ca-networking', 'Obtaining Virtual Controllers...', 'bottom', 'center', 'info');
		getSwarmData(0);
	}
}

function getSwarms() {
	return swarms;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Inventory functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Updated version 1.9.1
// now pulling from inventory instead of monitoring - bug fix
function downloadDeviceInventory() {
	$.when(updateInventory(false)).then(function() {
		csvNotification = showNotification('ca-cloud-data-download', 'Preparing CSV file...', 'bottom', 'center', 'info');

		//CSV header
		var serialKey = 'SERIAL';
		var macKey = 'MAC';
		var typeKey = 'DEVICE TYPE';
		var skuKey = 'SKU';
		var modelKey = 'MODEL';
		var licenseKey = 'LICENSE';

		// get APs for site
		csvData = [];
		$.each(apInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'AP', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		$.each(switchInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'Switch', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		$.each(gatewayInventory, function() {
			//console.log(this);
			var license = '';
			if (this['services'].length > 0) license = this['services'][0];

			csvData.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [typeKey]: 'Gateway', [modelKey]: this['aruba_part_no'], [skuKey]: this['model'], [licenseKey]: license });
		});

		var csv = Papa.unparse(csvData);

		var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

		var csvURL = window.URL.createObjectURL(csvBlob);

		var csvLink = document.createElement('a');
		csvLink.href = csvURL;
		csvLink.setAttribute('download', 'inventory.csv');
		//csvLink.setAttribute('Inventory', 'inventory.csv');
		csvLink.click();
		window.URL.revokeObjectURL(csvLink);
		if (csvNotification) csvNotification.close();
	});
}
function updateInventory(forceUpdate) {
	/*  
		Grab all inventories 
		after complete trigger promise
	*/
	inventoryPromise = new $.Deferred();
	
	var refreshrate = localStorage.getItem('refresh_rate');
	if (refreshrate === null || refreshrate === "") {
		refreshrate = "30";
	}
	var diffMinutes = refreshrate + 1;
	if (localStorage.getItem('inventory_update')) {
		var lastRefresh = new Date(parseInt(localStorage.getItem('inventory_update')));
		var now = new Date();
		var diffTime = Math.abs(now - lastRefresh);
		diffMinutes = Math.ceil(diffTime / (1000 * 60));
	}

	if (forceUpdate) diffMinutes = refreshrate + 1;
	else if (apInventory.length == 0 && switchInventory.length == 0 && gatewayInventory.length == 0) diffMinutes = refreshrate + 1;
	
	if (diffMinutes > refreshrate) {
		if (inventoryNotification) inventoryNotification.close();
 		inventoryNotification = showProgressNotification('ca-stock-2', 'Obtaining device inventory...', 'bottom', 'center', 'info');
		// Get the device inventories (IAP, Switch, Gateway) to determine device type
		apPromise = new $.Deferred();
		switchPromise = new $.Deferred();
		gatewayPromise = new $.Deferred();
		inventoryProgress = 0;
		inventoryAPProgress = 0;
		inventorySwitchProgress = 0;
		inventoryGatewayProgress = 0;
		$.when(getAPInventory(0), getSwitchInventory(0), getGatewayInventory(0)).then(function() {
			//console.log('Got ALL Inventories');
			if (inventoryNotification) {
				inventoryNotification.update({ message: 'Device Inventory updated', type: 'success' });
				setTimeout(inventoryNotification.close, 1000);
			}
			localStorage.setItem('inventory_update', +new Date());
			inventoryPromise.resolve();
		});
	} else {
		console.log('Loading existing Inventory data')
		setTimeout(inventoryUpdated, 10);
	}
	return inventoryPromise.promise();
}

function inventoryUpdated() {
	inventoryPromise.resolve();
}

// Updated version 1.9.1
// Change to include all_ap instead of just iap
function getAPInventory(offset) {
	/*  
		Grab ap inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=all_ap&limit=' + apiLimit / 2 + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (apInventory.length == apInventoryCount) {
				inventoryAPProgress = 100;
				console.log('AP Inventory Complete');
				inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
				inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
				saveDataToDB('inventory_ap', JSON.stringify(apInventory));
				apPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				apInventory = [];
				apInventoryCount = response.total;
			}
			apInventory = apInventory.concat(response.devices);

			offset += apiLimit / 2;
			inventoryAPProgress = (apInventory.length/response.total)*100;
			console.log('AP Inventory Progress: '+inventoryAPProgress.toFixed(2) +'%')
			inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
			console.log('Total Inventory Progress: '+inventoryProgress.toFixed(2) +'%')
			if (inventoryNotification) inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
			if (offset < response.total) getAPInventory(offset); // if there are still objects to get
			//console.log(response.devices);
		}
	});

	return apPromise.promise();
}

function getSwitchInventory(offset) {
	/*  
		Grab switch inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=switch&limit=' + apiLimit / 2 + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (switchInventory.length == switchInventoryCount) {
				/*$.each(switchInventory, function(){
					console.log(this.serial+","+this.macaddr);
				})*/
				inventorySwitchProgress = 100;
				console.log('Switch Inventory Complete');
				inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
				inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
				saveDataToDB('inventory_switch', JSON.stringify(switchInventory));
				switchPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				switchInventory = [];
				switchInventoryCount = response.total;
			}
			switchInventory = switchInventory.concat(response.devices);

			offset += apiLimit / 2;
			inventorySwitchProgress = (switchInventory.length/response.total)*100;
			console.log('Switch Inventory Progress: '+inventorySwitchProgress.toFixed(2) +'%')
			inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
			console.log('Total Inventory Progress: '+inventoryProgress.toFixed(2) +'%')
			if (inventoryNotification) inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
			if (offset < response.total) getSwitchInventory(offset); // if there are still objects to get
		}
	});

	return switchPromise.promise();
}

function getGatewayInventory(offset) {
	/*  
		Grab gateway inventory
		(loop while there are still items to get)
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices?sku_type=gateway&limit=' + apiLimit / 2 + '&offset=' + offset,
			access_token: localStorage.getItem('access_token'),
		}),
		complete: function() {
			if (gatewayInventory.length == gatewayInventoryCount) {
				/*$.each(gatewayInventory, function(){
					console.log(this.serial+","+this.macaddr);
				})*/
				inventoryGatewayProgress = 100;
				console.log('Gateway Inventory Complete')
				inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
				inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
				saveDataToDB('inventory_gateway', JSON.stringify(gatewayInventory));
				gatewayPromise.resolve();
			}
		},
	};

	/* $.ajax returns a promise*/

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/platform/device_inventory/v1/devices)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
			$(document.getElementById('group_icon')).addClass('text-warning');
			$(document.getElementById('group_icon')).removeClass('text-primary');
		} else {
			if (offset == 0) {
				gatewayInventory = [];
				gatewayInventoryCount = response.total;
			}
			gatewayInventory = gatewayInventory.concat(response.devices);

			offset += apiLimit / 2;
			inventoryGatewayProgress = (gatewayInventory.length/response.total)*100;
			console.log('Gateway Inventory Progress: '+inventoryGatewayProgress.toFixed(2) +'%')
			inventoryProgress = (inventoryAPProgress + inventorySwitchProgress + inventoryGatewayProgress)/3;
			console.log('Total Inventory Progress: '+inventoryProgress.toFixed(2) +'%')
			if (inventoryNotification) inventoryNotification.update({ message: 'Obtaining device inventory... ('+inventoryAPProgress.toFixed(0)+'%/'+inventorySwitchProgress.toFixed(0)+'%/'+inventoryGatewayProgress.toFixed(0)+'%)', progress: inventoryProgress });
			if (offset < response.total) getGatewayInventory(offset); // if there are still objects to get
			//console.log(apInventory)
		}
	});

	return gatewayPromise.promise();
}

// Added in 1.10
function getFullInventory() {
	return [...apInventory, ...switchInventory, ...gatewayInventory];
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Searching functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function findDeviceInInventory(currentSerial) {
	/*  
		Search through all inventories 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(apInventory, function() {
		if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switchInventory, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gatewayInventory, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMSPInventory(currentSerial) {
	/*  
		Search through all inventories 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(mspAPs, function() {
		if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(mspSwitches, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(mspGateways, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMonitoring(currentSerial) {
	/*  
		Search through all monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(aps, function() {
		if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(switches, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspAPs, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspSwitches, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspGateways, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMonitoringForMAC(currentMAC) {
	/*  
		Search through all monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check Clients
	deviceType = '';
	var foundDevice = null;
	$.each(clients, function() {
		if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
			foundDevice = this;
			deviceType = 'CLIENT'
			return false; // break  out of the for loop
		}
	});

	// Check APs
	if (!foundDevice) {
		$.each(aps, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Switches
	if (!foundDevice) {
		$.each(switches, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspAPs, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspSwitches, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspGateways, function() {
			if (cleanMACAddress(this['macaddr']) === cleanMACAddress(currentMAC)) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMonitoringForName(clientName) {
	/*  
		Search through all monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check Clients
	deviceType = '';
	var foundDevice = null;
	$.each(clients, function() {
		if (this['name'].toLowerCase() === clientName.toLowerCase()) {
			foundDevice = this;
			deviceType = 'CLIENT'
			return false; // break  out of the for loop
		}
	});

	// Check APs
	if (!foundDevice) {
		$.each(aps, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Switches
	if (!foundDevice) {
		$.each(switches, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(gateways, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspAPs, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'IAP';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspSwitches, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	if (!foundDevice) {
		$.each(mspGateways, function() {
			if (this['name'].toLowerCase() === clientName.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

function findDeviceInMSPMonitoring(currentSerial) {
	/*  
		Search through all MSP monitoring data 
		return the device if found, along with storing the device type
	*/
	var found = false;
	// Check APs
	deviceType = '';
	var foundDevice = null;
	$.each(mspAPMonitoring, function() {
		if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
			foundDevice = this;
			deviceType = 'IAP';
			return false; // break  out of the for loop
		}
	});

	// Check Switches
	if (!foundDevice) {
		$.each(mspSwitchMonitoring, function() {
			if (this['serial'.toLowerCase()] === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'SWITCH';
				return false; // break  out of the for loop
			}
		});
	}

	// Check Gateways
	if (!foundDevice) {
		$.each(mspGatewayMonitoring, function() {
			if (this['serial'].toLowerCase() === currentSerial.toLowerCase()) {
				foundDevice = this;
				deviceType = 'CONTROLLER';
				return false; // break  out of the for loop
			}
		});
	}

	return foundDevice;
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Add functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Updated 1.9.2
function addDevices() {
	addCounter = 0;
	addNotification = showNotification('ca-c-add', 'Adding devices...', 'bottom', 'center', 'info');

	var base_url = localStorage.getItem('base_url');
	var currentClusterName = 'Internal';
	if (base_url) currentClusterName = getClusterName(base_url);

	var devices = [];
	$.each(csvData, function() {
		// build array for uploading.

		if (!this['SERIAL'] || !this['MAC']) {
			return false;
		}
		if (currentClusterName === 'Central On-Prem') devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim(), partNumber: this['MODEL'].trim() });
		else devices.push({ mac: cleanMACAddress(this['MAC']), serial: this['SERIAL'].trim() });
	});
	//console.log('About to add: ' + JSON.stringify(devices));
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify(devices),
			//"data": JSON.stringify([{"mac": cleanMACAddress(this["MAC"]), "serial": this["SERIAL"].trim() }])
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log('Add device response: ' + JSON.stringify(response));

		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to add') {
				apiErrorCount++;
			}
		}

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/devices)');
			}
		}

		// check for erroring devices
		if (response.code && response.code === 'ATHENA_ERROR_NO_DEVICE') {
			if (response.extra.message.invalid_device && response.extra.message.invalid_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.invalid_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						logInformation('Device with Serial number "' + this.serial + '" is already added to your GreenLake account');
					} else if (this.status === 'INVALID_MAC_SN') {
						logError('Device with Serial number "' + this.serial + '" is invalid');
					} else {
						logError('Device with Serial number "' + this.serial + '" is invalid');
					}
					apiErrorCount++;
				});
			}
			if (response.extra.message.blocked_device && response.extra.message.blocked_device.length > 0) {
				// invalid device - log reason
				$.each(response.extra.message.blocked_device, function() {
					if (this.status === 'ATHENA_ERROR_DEVICE_ALREADY_EXIST') {
						logInformation('Device with Serial number "' + this.serial + '" is already added to your GreenLake account');
					} else if (this.status === 'ALREADY_PROVISIONED_TO_ANOTHER_CUSTOMER') {
						logError('Device with Serial number "' + this.serial + '" is already claimed by a different GreenLake Customer');
					} else {
						logError('Device with Serial number "' + this.serial + '" is blocked from being added to your GreenLake account');
					}
					apiErrorCount++;
				});
			}
		}

		//addCounter = addCounter + 1;
		addCounter = addCounter + devices.length;
		if (addCounter == devices.length) {
			if (addNotification) addNotification.close();
			if (currentWorkflow === '') {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Add Failure',
						text: 'Some or all devices failed to be added to Central',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Add Success',
						text: 'All devices were added to Central',
						icon: 'success',
					});
				}
			} else {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Add Failure',
						text: 'Some or all devices failed to be added to Central',
						icon: 'error',
					});
					if (automationNotification) {
						automationNotification.update({ message: 'Unable to add all Devices', type: 'danger' });
						setTimeout(automationNotification.close, 1000);
					}
				} else {
					// complete the Add part of the automation
					logEnd('Automation: Adding devices complete');
					autoAddPromise.resolve();
				}
				
			}
		}
	});
	//console.log(JSON.stringify(devices));
	if (currentWorkflow !== '') {
		return autoAddPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Archive functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Added 1.9.2
function archiveDevices() {
	archiveCounter = 0;
	showNotification('ca-box', 'Archiving devices...', 'bottom', 'center', 'info');

	var devices = [];
	$.each(csvData, function() {
		// build array for uploading.

		if (!this['SERIAL']) {
			return false;
		}
		devices.push(this['SERIAL'].trim());
	});
	console.log('About to archive: ' + JSON.stringify(devices));
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/device_inventory/v1/devices/archive',
			access_token: localStorage.getItem('access_token'),
			//data: JSON.stringify(devices),
			data: JSON.stringify({ serials: devices }),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		console.log('Archive device response: ' + JSON.stringify(response));

		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to archive') {
				apiErrorCount++;
			}
		}

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/device_inventory/v1/devices/archive)');
			}
		}

		// check for erroring devices
		if (response.code && response.code === 'ERROR_DEVICE_ARCHIVE_FAILED') {
			if (response.extra.message === 'No valid Serial(s) to Archive') {
				logError('No valid Serial(s) to Archive');
				apiErrorCount++;
			}
		}

		//addCounter = addCounter + 1;
		archiveCounter = archiveCounter + devices.length;
		if (archiveCounter == csvData.length) {
			if (currentWorkflow === '') {
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Archive Failure',
						text: 'Some or all devices failed to be archived in Central',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Archive Success',
						text: 'All devices were archived in Central',
						icon: 'success',
					});
				}
			} else {
				// complete the Add part of the automation
				logEnd('Automation: Archiving devices complete');
				autoArchivePromise.resolve();
			}
		}
	});
	//console.log(JSON.stringify(devices));
	if (currentWorkflow !== '') {
		return autoArchivePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Delete functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// Added 1.37.2
function deleteDevices() {
	Swal.fire({
		title: 'Are you sure?',
		text: 'This will remove the devices from Central. The devices will still be GreenLake.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmDeleteDevices();
		}
	});
}

function confirmDeleteDevices() {
	$.when(updateInfrastructure()).then(function() {
		deleteCounter = 0;
		deleteNotification = showProgressNotification('ca-bin', 'Deleting devices...', 'bottom', 'center', 'info');
		for (var i=0; i< csvData.length; i++) {			
			var currentRow = csvData[i];
			if (currentRow['SERIAL']) {
				var currentSerial = currentRow['SERIAL'].trim();
				if (currentSerial === '') {
					// Blank row
					deleteCounter++;
					checkForDeleteCompletion();
					continue;
				}
				var foundDevice = findDeviceInMonitoring(currentRow['SERIAL']);
				
				// Spread out the requests to not hit 7/sec api limit
				var currentName = currentRow['DEVICE NAME'].trim();
				if (currentName !== '') currentName = currentSerial;
				if (foundDevice) {
					logInformation('Deleting '+ currentName + ' from Central')
					setTimeout(singleDelete, apiDelay*i, currentSerial, deviceType);
				} else {
					var currentName = currentRow['DEVICE NAME'].trim();
					logInformation('Unable to delete '+ currentName + ' as it was not found in Central');
					deleteCounter++;
					checkForDeleteCompletion();
				}
			} else {
				deleteCounter++;
				checkForDeleteCompletion();
			}
		}
		if (currentWorkflow !== '') {
			return autoDeletePromise.promise();
		}
	});
}

function singleDelete(currentSerial, monitoredType) {

	if (monitoredType === 'IAP') {
		apiString = '/monitoring/v1/aps/';
	} else if (monitoredType === 'SWITCH') {
		apiString = '/monitoring/v1/switches/';
	} else if (monitoredType === 'CONTROLLER') {
		apiString = '/monitoring/v1/gateways/';
	}
	
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + apiString + currentSerial,
			access_token: localStorage.getItem('access_token')
		}),
	};
	
	$.ajax(settings).done(function(response, textStatus, jqXHR) {	
		if (response.hasOwnProperty('message')) {
			if (response.message === 'API rate limit exceeded') {
				Swal.fire({
					title: 'API Limit',
					text: 'Daily API limit reached',
					icon: 'error',
				});
				apiErrorCount++;
			}
			if (response.message === 'No devices to delete') {
				apiErrorCount++;
			}
		}
	
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' ('+apiString+'<SERIAL>)');
			}
		}
	
		deleteCounter++;
		checkForDeleteCompletion();
	});

}

function checkForDeleteCompletion() {
	var deleteProgress = (deleteCounter / csvData.length) * 100;
	deleteNotification.update({ progress: deleteProgress });
	
	if (deleteCounter == csvData.length) {
		if (deleteNotification) deleteNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Delete Failure',
					text: 'Some or all devices failed to be deleted from Central',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Delete Success',
					text: 'All devices were deleted from Central',
					icon: 'success',
				});
			}
		} else {
			// complete the Add part of the automation
			logEnd('Automation: Deleting devices complete');
			autoDeletePromise.resolve();
		}
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Licensing functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkForLicensingCompletion() {
	var licenseProgress = (licenseCounter / csvData.length) * 100;
	licenseNotification.update({ progress: licenseProgress });

	if (licenseCounter == csvData.length) {
		if (licenseNotification) licenseNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'License Failure',
					text: 'Some or all devices failed to be licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were assigned licenses',
					icon: 'success',
				});
			}
		} else {
			logEnd('Automation: Licensing complete');
			autoLicensePromise.resolve();
		}
	}
}

/* Updated v.1.5.4 */
function licenseDevicesFromCSV(msp,updateExisting,apOnly) {
	licenseNotification = showProgressNotification('ca-license-key', 'Licensing devices...', 'bottom', 'center', 'info');
	// variable to hold the device list per license service
	var serviceList = {};

	$.each(csvData, function() {
		// find device in inventory to get device type
		// only process if the Serial is filled in - e.g. not a blank row!
		if (this['SERIAL']) {
			var currentSerial = this['SERIAL'].trim();
			if (currentSerial === '') {
				// Blank row
				licenseCounter++;
				return true;
			}
			var requestedLicense = this['LICENSE'];
			if (requestedLicense) requestedLicense = requestedLicense.trim();
			if (!requestedLicense) requestedLicense = 'foundation';
			var license = '';
			
			if (apOnly) {
				// AP Only CSV - doesn't need to determine deviceType and model
				deviceType === 'IAP'
			} else {
				
				// Determine the deviceType and model
				deviceType = '';
				var foundDevice;
				var arubaPart;
				var arubaModel;
				
				// Try and use the CSV data instead of needing to search for the device in monitoring or inventory
				var csvModel = this['MODEL'];
				if (!csvModel) csvModel = this['model']; // to account for differences in the export format from Central
				
				if (csvModel && csvModel === 'ArubaVGW') {
					logInformation('Skipping Virtual GW with Serial Number: ' + currentSerial);
					licenseCounter++;
					checkForLicensingCompletion();
					return true;
				}
				if (csvModel && csvModel !== '') {
					csvModel = csvModel.trim();
					var gwRegex = /^A([0-9]{4}).*$/;
					var swAOSSRegex = /^(Aruba)([0-9]{4})/; // AOS-S models begin with "Aruba" followed by the 4 digits of the model
					var swCXRegex = /^[\d]{4}.*\(([^)]+)\)/; // 4 digits and include the part no at the end
					var partNoRegex = /\(([^)]+)\)/; // find part number within the brackets
					if (csvModel.includes('AP-')) {
						// AP / IAP
						deviceType = 'IAP';
						arubaModel = csvModel;
						foundDevice = this;
					} else if (csvModel.match(gwRegex)) {
						// Gateway / Controller
						deviceType = 'CONTROLLER';
						arubaModel = csvModel;
						foundDevice = this;
					} else if (csvModel.match(swAOSSRegex)) {
						// AOS-S Switch
						deviceType = 'SWITCH';
						arubaModel = csvModel;
						arubaPart = csvModel.match(partNoRegex)[1];
						foundDevice = this;
					} else if (csvModel.match(swCXRegex)) {
						// CX Switch
						deviceType = 'SWITCH';
						arubaModel = csvModel;
						arubaPart = csvModel.match(partNoRegex)[1];
						foundDevice = this;
					}
				}
				
				// If just updating existing licenses - look in monitoring if not already able to determine the device details needed
				if (updateExisting && !foundDevice) {
					// Use Monitoring data to find devices
					foundDevice = findDeviceInMonitoring(currentSerial);
					if (msp) {
						foundDevice = findDeviceInMSPMonitoring(currentSerial);
					}
					arubaModel = foundDevice['model'].replace('Aruba','');
				} else if (!updateExisting) {
					// If not updating licenses - will need to use device inventory data to determine type and model
					foundDevice = findDeviceInInventory(currentSerial);
					if (msp) {
						foundDevice = findDeviceInMSPInventory(currentSerial);
					}
					if (foundDevice) {
						arubaPart = foundDevice['aruba_part_no'];
						arubaModel = foundDevice['aruba_part_no'];
						if (arubaModel && (arubaModel.startsWith('J') || arubaModel.startsWith('R') || arubaModel.startsWith('Q') || arubaModel.startsWith('S'))) {
							arubaModel = foundDevice['model'];
						}
					}
				}
			}
			
			if (!apOnly && updateExisting && !foundDevice) {
				logError('Unable to determine the device type for device with Serial Number: ' + currentSerial);
				licenseCounter++;
				checkForLicensingCompletion();
			} else if (!apOnly && !updateExisting && !foundDevice) {
				logError('Device with Serial Number: ' + currentSerial + ' was not found in the device inventory');
				licenseCounter++;
				checkForLicensingCompletion();
			} else {
				if (deviceType === 'IAP') {
					// Check APs
					if (requestedLicense.toLowerCase().includes('foundation')) {
						license = 'foundation_ap';
					} else {
						license = 'advanced_ap';
					}
				} else if (deviceType === 'SWITCH') {
					// Check Switches
					if (requestedLicense.toLowerCase().includes('foundation')) {
						license = 'foundation_switch_';
					} else {
						license = 'advanced_switch_';
					}
					// check the license skus at https://internal-apigw.central.arubanetworks.com/platform/licensing/v1/services/config
					if (arubaModel.includes('6100') || arubaModel.includes('6000') || arubaModel.includes('4100') || arubaModel.includes('2530') || arubaModel.includes('2540') || class1Switches.includes(arubaPart)) {
						license = license + '6100';
					} else if (arubaModel.includes('6200') || arubaModel.includes('6300L') || arubaModel.includes('29') || class2Switches.includes(arubaPart)) {
						license = license + '6200';
					} else if (arubaModel.includes('6300') || arubaModel.includes('38') || class3Switches.includes(arubaPart)) {
						license = license + '6300';
					} else if (arubaModel.startsWith('64') || arubaModel.includes('5406') || arubaModel.includes('5412') || class4Switches.includes(arubaPart)) {
						license = license + '6400';
					} else if (arubaModel.startsWith('81') || arubaModel.startsWith('83') || arubaModel.startsWith('84') || arubaModel.startsWith('93') || arubaModel.includes('10000') || class5Switches.includes(arubaPart)) {
						license = license + '8xxx_9xxx_10xxx';
					}
				} else if (deviceType === 'CONTROLLER') {
					// Check Gateways
					if (requestedLicense.toLowerCase().includes('wlan')) {
						license = 'foundation_wlan_gw';
					} else if (requestedLicense.toLowerCase().includes('wlan') && requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('90')) {
						license = 'wlan_advanced_90xx';
					} else if (requestedLicense.toLowerCase().includes('wlan') && requestedLicense.toLowerCase().includes('advanced') && requestedLicense.toLowerCase().includes('security') && arubaModel.includes('90')) {
						license = 'wlan_advanced_90xx_sec';
					} else if (requestedLicense.toLowerCase().includes('wlan') && requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('91')) {
						license = 'wlan_advanced_91xx';
					} else if (requestedLicense.toLowerCase().includes('wlan') && requestedLicense.toLowerCase().includes('advanced') && requestedLicense.toLowerCase().includes('security') && arubaModel.includes('91')) {
						license = 'wlan_advanced_91xx_sec';
					} else if (requestedLicense.toLowerCase().includes('wlan') && requestedLicense.toLowerCase().includes('advanced') && requestedLicense.toLowerCase().includes('security') && arubaModel.includes('92')) {
						license = 'wlan_advanced_92xx_sec';
					} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation-base')) {
						license = 'foundation_base_90xx_sec';
					} else if (requestedLicense.toLowerCase().includes('foundation-base')) {
						license = 'foundation_base_7005';
					} else if (requestedLicense.toLowerCase().includes('advance-base')) {
						license = 'advance_base_7005';
					} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('foundation') && (arubaModel.includes('70') || arubaModel.includes('90'))) {
						license = 'foundation_90xx_sec';
					} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && (arubaModel.includes('70') || arubaModel.includes('90'))) {
						license = 'advance_90xx_sec';
					} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('91')) {
						license = 'advanced_91xx_sec';
					} else if (requestedLicense.toLowerCase().includes('security') && requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('92')) {
						license = 'advanced_92xx_sec';
					} else if (requestedLicense.toLowerCase().includes('foundation') && (arubaModel.includes('70') || arubaModel.includes('90'))) {
						license = 'foundation_70xx';
					} else if (requestedLicense.toLowerCase().includes('advanced') && (arubaModel.includes('70') || arubaModel.includes('90'))) {
						license = 'advance_70xx';
					} else if (requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('91')) {
						license = 'advanced_91xx';
					} else if (requestedLicense.toLowerCase().includes('foundation') && arubaModel.includes('72')) {
						license = 'foundation_72xx';
					} else if (requestedLicense.toLowerCase().includes('advanced') && arubaModel.includes('72')) {
						license = 'advance_72xx';
					}
				}
				//console.log(arubaModel)
				//console.log(arubaPart)
				//console.log(license)
				//console.log(foundDevice.services)
				if (license === '') {
					logError('Unable to determine the correct license type required for ' + currentSerial );
					licenseCounter++;
					checkForLicensingCompletion();
				} else if (updateExisting || !foundDevice.services.includes(license.toUpperCase())) {
			
					// check if other devices have the same services assigned
					if (!serviceList[license]) {
						serviceList[license] = [];
					}
	
					// Add serial to the list that matches the services.
					var serials = serviceList[license];
					serials.push(currentSerial);
					serviceList[license] = serials;
				} else {
					logInformation(currentSerial + ' is already assigned the correct license');
					licenseCounter++;
					checkForLicensingCompletion();
				}
			}
		} else {
			// Empty Row
			licenseCounter++;
			checkForLicensingCompletion();
		}
	});

	var timeoutCounter = 0;
	for (const [key, value] of Object.entries(serviceList)) {
		var serials = value;
		
		// Need to split up into 100 device blocks (API limitation)
		while (serials.length > 0) {
			var serialBlock = [];
			serialBlock = serials.splice(0, apiLicensingLimit);
			
			// Update licensing
			setTimeout(licenseDeviceBlock, apiLicensingDelay * timeoutCounter, key, serialBlock);
			timeoutCounter++;
		}
	}

	if (currentWorkflow !== '') {
		return autoLicensePromise.promise();
	}
}

function licenseDeviceBlock(licenseType, serialNumbers) {
	// Update licensing
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/assign',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ serials: serialNumbers, services: [licenseType] }),
		}),
	};
	//logInformation('Licensing with ' + licenseType + ': ' + serialNumbers.join(', '));
	
	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/platform/licensing/v1/subscriptions/assign)');
			}
		}
		
		if (Array.isArray(response.status)) {
			if (response.status[0].message.msg) {
				logError(response.status[0].message.msg);
			} else {
				logError('There was an error assigning licenses.');
			}
		} else if (response.error_code) {
			if (response.error_code == 400) {
				logError(response.message);
			} else {
				logError('There was an error assigning licenses.');
			}
		}
	
		if (response.hasOwnProperty('detail')) {
			logError('Licensing failed for ' + licenseType + ': ' + serialNumbers.join(', ') + '. Reason: ' + response.detail);
		}
		
		if (response.hasOwnProperty('response') && response.response == 'success') {
			logInformation('Licensing successful for ' + licenseType + ': ' + serialNumbers.join(', '));	
		} else {
			apiErrorCount++;
			logError('Licensing failed for ' + licenseType + ': ' + serialNumbers.join(', '));
		}
		licenseCounter = licenseCounter + serialNumbers.length;
		
		checkForLicensingCompletion();
	});
}

function licenseDevices() {
	// Check if auto-licensing is disabled
	$.when(checkAutoLicenseState()).then(function() {
		if (autoLicenseState) {
			Swal.fire({
				title: 'License Failure',
				text: 'Auto-Subscribe is enabled in GreenLake. Please disable this to use this task',
				icon: 'error',
			});
		} else {
			/*  
				Grab all 3 inventories from API.  
				Scan though  each inventory to find the device.
				Generate the require license string
				Assign license.
			*/
			licenseCounter = 0;
			
			// Get the device inventories (IAP, Switch, Gateway) to determine device type
			$.when(updateInventory(true)).then(function() {
				licenseDevicesFromCSV(false,false,false);
			});
			if (currentWorkflow !== '') {
				return autoLicensePromise.promise();
			}
		}
	});
}

function updateLicenses() {
	// Check if auto-licensing is disabled
	$.when(checkAutoLicenseState()).then(function() {
		if (autoLicenseState) {
			Swal.fire({
				title: 'License Failure',
				text: 'Auto-Subscribe is enabled in GreenLake. Please disable this to use this task',
				icon: 'error',
			});
		} else {
			/*  
				Grab all 3 inventories from API.  
				Scan though  each inventory to find the device.
				Generate the require license string
				Assign license.
			*/
			licenseCounter = 0;
			
			// Get the device inventories (IAP, Switch, Gateway) to determine device type
			licenseDevicesFromCSV(false,true,false);
			if (currentWorkflow !== '') {
				return autoLicensePromise.promise();
			}
		}
	});
}

function updateAPLicenses() {
	Swal.fire({
		title: 'AP Only License Update',
		text: 'Are all devices in the CSV APs? This task is only for APs',
		icon: 'warning',
		showCancelButton: true,
		cancelButtonColor: '#d33',
		cancelButtonText: "No, I'll use 'Update Device Licenses' instead",
		confirmButtonColor: '#3085d6',
		confirmButtonText: 'Yes, start licensing',
	}).then(result => {
		if (result.isConfirmed) {
			// Check if auto-licensing is disabled
			$.when(checkAutoLicenseState()).then(function() {
				if (autoLicenseState) {
					Swal.fire({
						title: 'License Failure',
						text: 'Auto-Subscribe is enabled in GreenLake. Please disable this to use this task',
						icon: 'error',
					});
				} else {
					/*  
						Grab all 3 inventories from API.  
						Scan though  each inventory to find the device.
						Generate the require license string
						Assign license.
					*/
					licenseCounter = 0;
					
					// No need for device inventory or monitoring data - know they are APs only
					licenseDevicesFromCSV(false,true,true);
					if (currentWorkflow !== '') {
						return autoLicensePromise.promise();
					}
				}
			});
		}
	});
}

function checkAutoLicenseState() {
	licenseNotification = showNotification('ca-license-key', 'Checking Auto-Subscribe state...', 'bottom', 'center', 'info');
	autoLicenseCheckPromise = new $.Deferred();
	
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/platform/licensing/v1/customer/settings/autolicense',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/central/v1/labels)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		//console.log(response.services)
		
		var reasonArray = [];
		$.each(response.services, function() {
			if (this.includes('_ap') && !reasonArray.includes('APs')) reasonArray.push('APs');
			else if (this.includes('_switch') && !reasonArray.includes('Switches')) reasonArray.push('Switches');
			else if ((this.includes('wlan_') || this.includes('70xx') || this.includes('90xx') || this.includes('91xx') || this.includes('92xx')) && !reasonArray.includes('Gateways')) reasonArray.push('Gateways');
		});
		
		if (reasonArray.length > 0) {
			
			var reasonString = reasonArray.join(', ');
			var pos = reasonString.lastIndexOf(',');
			if (pos != -1) reasonString = reasonString.substring(0,pos) + ' &' + reasonString.substring(pos+1);
			var buttonText = "I'm not assigning licenses to those device types";
			if (reasonArray.length = 1) buttonText = "I'm not assigning licenses for that device type";
			Swal.fire({
				title: 'Auto-Subscribe is enabled',
				text: 'Auto-Subscribe is enabled for '+reasonString+'. To assign licenses for these device types it needs to be disabled. Would you like to disable it?',
				icon: 'warning',
				showCancelButton: true,
				cancelButtonColor: '#d33',
				cancelButtonText: "I'll go do it in GreenLake",
				confirmButtonColor: '#3085d6',
				confirmButtonText: buttonText,
			}).then(result => {
				if (result.isConfirmed) {
					autoLicenseState = false;
					autoLicenseCheckPromise.resolve();
					
					/*// go through services in response to determine the types enabled
					var disableServices = [];
					if (response.services.includes('advance_70xx/90xx')) disableServices.push('advance_70xx/90xx');
					if (response.services.includes('foundation_70xx/90xx')) disableServices.push('foundation_70xx/90xx');
					if (response.services.includes('advance_ap')) disableServices.push('advance_ap');
					if (response.services.includes('foundation_ap')) disableServices.push('foundation_ap');
					if (response.services.includes('advance_switch_6100')) disableServices.push('advance_switch_6100');
					if (response.services.includes('foundation_switch_6100')) disableServices.push('foundation_switch_6100');
					
					var settings2 = {
						url: getAPIURL() + '/tools/deleteCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/platform/licensing/v1/customer/settings/autolicense',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({ services: disableServices }),
						}),
					};
					console.log(settings2.data)
					$.ajax(settings2).done(function(response) {
						console.log(response)
						if (response.response && response.response === 'success') {
							showNotification('ca-license-key', 'Auto Licensing disabled', 'bottom', 'center', 'success');
							autoLicenseState = false;
						} else {
							showNotification('ca-license-key', 'Failed to disable Auto Licensing', 'bottom', 'center', 'danger');
							autoLicenseState = true;
						}
						autoLicenseCheckPromise.resolve();
					});*/
				} else {
					autoLicenseState = true;
					autoLicenseCheckPromise.resolve();
				}
			});
		} else {
			autoLicenseState = false;
			autoLicenseCheckPromise.resolve();
		}
		licenseNotification.close();
	});
	return autoLicenseCheckPromise.promise();
}

// Added in 1.5.2
function checkForUnlicensingCompletion() {
	var licenseProgress = (licenseCounter / csvDataCount) * 100;
	licenseNotification.update({ progress: licenseProgress });

	if (licenseCounter == csvDataCount) {
		if (licenseNotification) licenseNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'License Failure',
					text: 'Some or all devices failed to be unassigned licenses',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices had licenses unassigned',
					icon: 'success',
				});
			}
		} else {
			logEnd('Automation: Unlicensing complete');
			autoLicensePromise.resolve();
		}
	}
}

/* Updated v1.5.4*/
function unlicenseDevicesFromCSV() {
	licenseCounter = 0;
	licenseNotification = showProgressNotification('ca-license-key', 'Un-assigning licenses from devices', 'bottom', 'center', 'info');

	// variable to hold the device list per license service
	var serviceList = {};

	// unassign license from each device
	$.each(csvData, function() {
		if (this['SERIAL']) {
			// find the device to be able to get current license assigned.
			var device = findDeviceInInventory(this['SERIAL']);
			if (!device) {
				logError('Unable to find device ' + this['SERIAL'] + ' in the device inventory');
				apiErrorCount++;
				licenseCounter++;
				checkForUnlicensingCompletion();
			} else if (device['services'] && device['services'].length > 0) {
				// convert the services into a string
				var serviceName = JSON.stringify(device['services']);
				// check if other devices have the same services assigned
				if (!serviceList[serviceName]) {
					serviceList[serviceName] = [];
				}

				// Add serial to the list that matches the services.
				var serials = serviceList[serviceName];
				serials.push(this['SERIAL']);
				serviceList[serviceName] = serials;
			} else {
				licenseCounter++; // skipping devices without licenses.
				checkForUnlicensingCompletion(); // just in case none have licenses assigned.
			}
		} else {
			licenseCounter++; // missing a serial number in the row of the CSV (possibly blank row)
			checkForUnlicensingCompletion();
		}
	});

	for (const [key, value] of Object.entries(serviceList)) {
		var serials = value;

		// Update licensing
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/platform/licensing/v1/subscriptions/unassign',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ serials: value, services: JSON.parse(key) }),
			}),
		};
		licenseCounter = licenseCounter + value.length;

		$.ajax(settings).done(function(response, textStatus, jqXHR) {
			//console.log(response);
			if (Array.isArray(response.status)) {
				if (response.status[0].message.msg) {
					logError(response.status[0].message.msg);
				} else {
					logError('There was an error un-assigning licenses');
				}
			}

			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.reason + ' (/platform/licensing/v1/subscriptions/unassign)');
				}
			}
			checkForUnlicensingCompletion();
		});
	}
}

// Added in 1.5.2
function unlicenseDevices() {
	/*  
		Grab all 3 inventories from API.  
		Scan though  each inventory to find the device.
		Grab the assigned service
		Unassign license.
	*/
	licenseCounter = 0;

	// Get the device inventories (IAP, Switch, Gateway) to determine device type
	$.when(updateInventory(true)).then(function() {
		unlicenseDevicesFromCSV(false);
	});
	if (currentWorkflow !== '') {
		return autoLicensePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Group functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function csvContainsGroup() {
	var containsGroup = true;
	$.each(csvData, function() {
		//console.log(this["GROUP"])
		if (!this['GROUP'] && this['SERIAL']) {
			containsGroup = false;
			return false;
		}
	});
	return containsGroup;
}

function selectGroup() {
	var select = document.getElementById('groupselector');
	manualGroup = select.value;
	document.getElementById('manualGroupParagraph').innerText = 'Manual Group: ' + manualGroup;
	var mgd = document.getElementById('manualGroupDiv');
	mgd.style.display = 'block';
	showNotification('ca-folder-replace', 'The ' + manualGroup + ' group will be used for devices with no group assigned. Please re-run the task.', 'top', 'center', 'warning');
}

function showCustomerGroup() {
	var x = document.getElementById('addToGroup');
	if (document.getElementById('addToGroupCheckbox').checked) {
		x.style.display = 'block';
	} else {
		x.style.display = 'none';
	}
}

// Updated in version 1.10
function moveDevicesToGroup() {
	/*  
		Move each device to the correct group
	*/
	moveNotification = showProgressNotification('ca-folder-replace', 'Moving devices into groups...', 'bottom', 'center', 'info');

	moveCounter = 0;
	var groupsToUse = {};

	devicesToMove = 0;
	// Build lists of devices for each Group
	$.each(csvData, function() {
		if (this['SERIAL']) {
			var selectedGroup = manualGroup;
			if (this['GROUP'].trim()) selectedGroup = this['GROUP'].trim();
			var groupDevices = [];
			if (groupsToUse[selectedGroup]) {
				// grab existing list for this group
				groupDevices = groupsToUse[selectedGroup];
			}
			// add device to the list
			groupDevices.push(this['SERIAL'].trim());
			// save the list back into the dictionary
			groupsToUse[selectedGroup] = groupDevices;
			devicesToMove++;
		}
	});
	// For each Group, move the devices in bulk (not a call per device)
	for (const [groupName, serialsToMove] of Object.entries(groupsToUse)) {
		var serialArray = serialsToMove;

		// Need to split up into 50 device blocks (API limitation)
		while (serialArray.length > 0) {
			var serialBlock = [];
			serialBlock = serialArray.splice(0, 50);
			logInformation('Adding Devices to ' + groupName + ': ' + serialBlock.join(', '));

			// Move the block of serials in separate function to avoid variable changing between API call and response (due to looping) - enables better error and completion tracking
			$.when(performDeviceMove(groupName, serialBlock, new $.Deferred())).then(function() {
				// check for completion after each bulk move

				var moveProgress = (moveCounter / devicesToMove) * 100;
				moveNotification.update({ progress: moveProgress });

				if (moveCounter == devicesToMove) {
					if (moveNotification) moveNotification.close();
					if (currentWorkflow === '') {
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Move Failure',
								text: 'Some or all devices failed to move to the specified group(s)',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Move Success',
								text: 'All devices were to moved to the specified group(s)',
								icon: 'success',
							});
						}
						//console.log(manualGroup)
						if (manualGroup) {
							manualGroup = '';
							var mgd = document.getElementById('manualGroupDiv');
							if (mgd) mgd.style.display = 'none';
						}
					} else {
						logEnd('Automation: Move to Group complete');
						autoGroupPromise.resolve();
					}
				}
			});
		}
	}
	if (currentWorkflow !== '') {
		return autoGroupPromise.promise();
	}
}

// Added in version 1.10
function performDeviceMove(groupName, serialNumbers, movePromiseVar) {
	// Perform actual device move and update the counters/log
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/devices/move',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group: groupName, serials: serialNumbers }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		//console.log(response);
		if (response.hasOwnProperty('error_code') || response !== 'Success') {
			logError(response.description);
			apiErrorCount++;
		} else if (response.includes('Controller/Gateway group move has been initiated, please check audit trail for details')) {
			logInformation('Controller/Gateway group move has been initiated, please check audit trail in Central for details');
		}

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/move)');
			}
		}
		moveCounter = moveCounter + serialNumbers.length;
		movePromiseVar.resolve();
	});
	return movePromiseVar.promise();
}

// Added in version 1.37
function preprovisionDevicesToGroup() {
	/*  
		preprovision each device to the correct group
	*/
	moveNotification = showProgressNotification('ca-folder-check', 'Preprovisioning devices into groups...', 'bottom', 'center', 'info');

	moveCounter = 0;
	var groupsToUse = {};

	devicesToMove = 0;
	// Build lists of devices for each Group
	$.each(csvData, function() {
		if (this['SERIAL']) {
			var selectedGroup = manualGroup;
			if (this['GROUP'].trim()) selectedGroup = this['GROUP'].trim();
			var groupDevices = [];
			if (groupsToUse[selectedGroup]) {
				// grab existing list for this group
				groupDevices = groupsToUse[selectedGroup];
			}
			// add device to the list
			groupDevices.push(this['SERIAL'].trim());
			// save the list back into the dictionary
			groupsToUse[selectedGroup] = groupDevices;
			devicesToMove++;
		}
	});
	// For each Group, move the devices in bulk (not a call per device)
	for (const [groupName, serialsToMove] of Object.entries(groupsToUse)) {
		var serialArray = serialsToMove;

		// Need to split up into 50 device blocks (API limitation)
		while (serialArray.length > 0) {
			var serialBlock = [];
			serialBlock = serialArray.splice(0, 50);
			logInformation('Adding Devices to ' + groupName + ': ' + serialBlock.join(', '));

			// Move the block of serials in separate function to avoid variable changing between API call and response (due to looping) - enables better error and completion tracking
			$.when(performDevicePreprovision(groupName, serialBlock, new $.Deferred())).then(function() {
				// check for completion after each bulk move

				var moveProgress = (moveCounter / devicesToMove) * 100;
				moveNotification.update({ progress: moveProgress });

				if (moveCounter == devicesToMove) {
					if (moveNotification) moveNotification.close();
					if (currentWorkflow === '') {
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Move Failure',
								text: 'Some or all devices failed to move to the specified group(s)',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Move Success',
								text: 'All devices were to moved to the specified group(s)',
								icon: 'success',
							});
						}
						//console.log(manualGroup)
						if (manualGroup) {
							manualGroup = '';
							var mgd = document.getElementById('manualGroupDiv');
							if (mgd) mgd.style.display = 'none';
						}
					} else {
						logEnd('Automation: Move to Group complete');
						autoGroupPromise.resolve();
					}
				}
			});
		}
	}
	if (currentWorkflow !== '') {
		return autoGroupPromise.promise();
	}
}

function performDevicePreprovision(groupName, serialNumbers, movePromiseVar) {
	// Perform actual device move and update the counters/log
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/preassign',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ group_name: groupName, device_id: serialNumbers }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.hasOwnProperty('error_code') || response !== 'Success') {
			var errorResponse = response.description;
			errorResponse = errorResponse.replace('Following Devices are already connected to Central dict_keys', 'The following devices are already provisioned in Central: ');
			errorResponse = errorResponse.replace('([', '');
			errorResponse = errorResponse.replace('])', '');
			logError(errorResponse);
			apiErrorCount++;
		} else if (response === "Success") {
			logInformation('Device pre-provisioning into ' + groupName + ' was successful for ' + serialNumbers.join(', '));
		}

		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/preassign)');
			}
		}
		moveCounter = moveCounter + serialNumbers.length;
		movePromiseVar.resolve();
	});
	return movePromiseVar.promise();
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Site functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function createSiteFromCSV() {
	$('#sitefiles').parse({
		config: {
			delimiter: ',',
			header: true,
			complete: processCSV,
			skipEmptyLines: 'greedy',
			transformHeader: function(h) {
				return h.toUpperCase().trim();
			},
		},
		before: function(file, inputElem) {
			csvNotification = showNotification('ca-cpu', 'Processing CSV File...', 'bottom', 'center', 'info');
		},
		error: function(err, file) {
			showNotification('ca-c-warning', err.message, 'bottom', 'center', 'danger');
		},
		complete: function() {
			if (csvNotification) csvNotification.close();
			siteCreationCount = 0;
			apiErrorCount = 0;
			siteNotification = showProgressNotification('ca-pin-add-2', 'Creating Sites...', 'bottom', 'center', 'info');
			$.each(csvData, function() {
				var currentSite = this['SITE NAME'].trim();
				var settings = {};
				if (this['ADDRESS'].trim()) {
					settings = {
						url: getAPIURL() + '/tools/postCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/central/v2/sites',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({
								site_name: this['SITE NAME'].trim(),
								site_address: {
									address: this['ADDRESS'].trim(),
									city: this['CITY'].trim(),
									state: this['STATE'].trim(),
									country: this['COUNTRY'].trim(),
									zipcode: this['ZIPCODE'].trim(),
								},
							}),
						}),
					};
				} else {
					settings = {
						url: getAPIURL() + '/tools/postCommand',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/central/v2/sites',
							access_token: localStorage.getItem('access_token'),
							data: JSON.stringify({
								site_name: this['SITE NAME'].trim(),
								geolocation: {
									latitude: this['LATITUDE'].trim(),
									longitude: this['LONGITUDE'].trim(),
								},
							}),
						}),
					};
				}

				$.ajax(settings).done(function(response, textStatus, jqXHR) {
					//console.log(response)
					if (response.hasOwnProperty('error_code')) {
						apiErrorCount++;
						if (response.description === 'SITE_ERR_DUPLICATE_SITE_NAME') {
							logError('Site with name "' + currentSite + '" already exists');
						} else {
							logError(response.description + ': ' + currentSite);
						}
					} else if (response.hasOwnProperty('site_name')) {
						logInformation(currentSite + ' added successfully');
					}

					if (response.hasOwnProperty('status')) {
						if (response.status === '503') {
							apiErrorCount++;
							logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites)');
						} else if (response.status === '500') {
							logError('Site with name "' + currentSite + '" failed to be created');
						}
					}

					siteCreationCount++;
					var siteProgress = (siteCreationCount / csvData.length) * 100;
					siteNotification.update({ progress: siteProgress });

					if (siteCreationCount >= csvData.length) {
						if (siteNotification) siteNotification.close();
						if (apiErrorCount != 0) {
							showLog();
							Swal.fire({
								title: 'Site Creation Failure',
								text: 'Some or all Sites failed to be created',
								icon: 'error',
							});
						} else {
							Swal.fire({
								title: 'Site Creation Success',
								text: 'All sites were created successfully',
								icon: 'success',
							});
						}
					}
				});
			});
		},
	});
}

function createSite() {
	apiErrorCount = 0;
	var currentSite = document.getElementById('siteName').value.trim();
	var address = document.getElementById('siteAddress').value.trim();
	var city = document.getElementById('siteCity').value.trim();
	var state = document.getElementById('siteState').value.trim();
	var country = document.getElementById('siteCountry').value.trim();
	var zipcode = document.getElementById('siteZipcode').value.trim();
	var longitude = document.getElementById('siteLongitude').value.trim();
	var latitude = document.getElementById('siteLatitude').value.trim();

	if (currentSite === '' && (address === '' || city === '' || state === '' || country === '' || zipcode === '' || longitude === '' || latitude === '')) {
		showNotification('ca-pin-add', 'Please fill in either an address or coordinates to add a new Site', 'bottom', 'center', 'warning');
	} else {
		var settings = {};
		if (address) {
			settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/central/v2/sites',
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({
						site_name: currentSite,
						site_address: {
							address: address,
							city: city,
							state: state,
							country: country,
							zipcode: zipcode,
						},
					}),
				}),
			};
		} else {
			settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/central/v2/sites',
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({
						site_name: currentSite,
						geolocation: {
							latitude: latitude,
							longitude: longitude,
						},
					}),
				}),
			};
		}

		return $.ajax(settings).done(function(response, textStatus, jqXHR) {
			//console.log(response)
			if (response.hasOwnProperty('error_code')) {
				apiErrorCount++;
				if (response.description === 'SITE_ERR_DUPLICATE_SITE_NAME') {
					logError('Site with name "' + currentSite + '" already exists');
				} else {
					logError(response.description + ': ' + currentSite);
				}
			} else if (response.hasOwnProperty('site_name')) {
				logInformation(currentSite + ' added successfully');
			}
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites)');
				}
			}
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Site Creation Failure',
					text: 'Site failed to be created',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Site Creation Success',
					text: 'Site "' + currentSite + '" was created successfully',
					icon: 'success',
				});
			}
		});
	}
}

function unassignDeviceFromSite(device) {
	/*  
		remove the device from its current site
	*/
	console.log('Removing device: ' + device['serial'] + ' from site: ' + getIDforSite(device['site']));
	var settings = {
		url: getAPIURL() + '/tools/deleteCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: parseInt(getIDforSite(device['site'])) }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites/associate)');
			}
		}
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
		} else if (response.hasOwnProperty('success')) {
			logInformation(device['serial'] + ' removed from existing site (' + device['site'] + ')');
		} else {
			logError('Unable to remove ' + device['serial'] + " from it's current site");
		}
	});
}

function assignDeviceToSite(device, site) {
	/*  
		assigning the device to a site
	*/
	//console.log('assigning site ' + site + ' for device: ' + device['serial']);
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v2/sites/associate',
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ device_id: device['serial'], device_type: deviceType, site_id: parseInt(site) }),
		}),
	};

	return $.ajax(settings).done(function(response, textStatus, jqXHR) {
		console.log('Site Assignment response: '+JSON.stringify(response));
		
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/central/v2/sites/associate)');
			} else if (response.status !== '200') {
				logError(device['serial'] + ' was not assigned to site ' + getNameforSiteId(site));
			} else {
				logInformation(device['serial']+ ' was assigned to the site: ' + getNameforSiteId(site));
			}
		} 
		if (response.hasOwnProperty('description') && response['description'].includes('SITE_ERR_DEFAULT')) {
			logError(device['serial'] + ' was not assigned to site ' + getNameforSiteId(site)+'. Please retry assigning sites');
		}
		moveCounter = moveCounter + 1;
		checkForSiteMoveCompletion();
	});
}

function getIDforSite(site) {
	/*  
		get site from sites monitoring data
		return site_id for matching site
	*/
	var siteId = -1; // used when the site isn't found
	//console.log('looking for site: '+site)
	$.each(sites, function() {
		if (this['name'] === site) {
			siteId = this['id'];
			return false;
		}
	});
	return siteId;
}

function getNameforSiteId(siteID) {
	/*  
		get site from sites monitoring data
		return site_id for matching site
	*/
	var siteName = -1; // used when the site isn't found
	//console.log('looking for site: '+site)
	$.each(sites, function() {
		if (this['id'] === siteID) {
			siteName = this['name'];
			return false;
		}
	});
	return siteName;
}

function checkForSiteMoveCompletion() {
	var moveProgress = (moveCounter / csvData.length) * 100;
	moveNotification.update({ progress: moveProgress });

	if (moveCounter == csvData.length) {
		if (moveNotification) moveNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Move to Site Failure',
					text: 'Some or all devices failed to be moved to the correct sites',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were moved to the correct sites',
					icon: 'success',
				});
			}
			updateMonitoringWithClients(false, false);
		} else {
			logEnd('Automation: Site assignment complete');
			autoSitePromise.resolve();
		}
		showLog()
	}
}

function moveDevicesToSite() {
	/*  
		get site from sites data
		get device from correct device data
		check if device is in a site
		if yes, and the correct site - do nothing :)
		if yes, but not the correct site, unassign device from old site
		assign new site
	*/
	$.when(updateInfrastructure()).then(function() {
		moveNotification = showProgressNotification('ca-world-pin', 'Moving devices into sites...', 'bottom', 'center', 'info');
		moveCounter = 0;
		// Get the device monitoring data (IAP, Switch, Gateway) to determine device type
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL'] && this['SITE']) {
				var currentSerial = this['SERIAL'].trim();
				var currentSite = this['SITE'].trim();
				if (!currentSite) {
					logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
					moveCounter = moveCounter + 1;
					checkForSiteMoveCompletion();
				} else {
					var found = false;
					// Check APs
					// Find the device and type
					var foundDevice = findDeviceInMonitoring(currentSerial);
	
					if (!foundDevice) {
						logError('Device with Serial Number: ' + currentSerial + ' was not found in the device monitoring');
						moveCounter = moveCounter + 1;
						checkForSiteMoveCompletion();
					} else {
						if (!foundDevice['site']) {
							// add device to site
							siteId = getIDforSite(currentSite);
							if (siteId != -1) {
								assignDeviceToSite(foundDevice, siteId);
							} else {
								logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
								moveCounter = moveCounter + 1;
								checkForSiteMoveCompletion();
							}
						} else if (foundDevice['site'] !== currentSite) {
							// remove from old site,  then add to new site
							console.log('Unassign '+currentSerial+' from current site!');
							$.when(unassignDeviceFromSite(foundDevice)).then(function() {
								siteId = getIDforSite(currentSite);
								if (siteId != -1) {
									assignDeviceToSite(foundDevice, siteId);
								} else {
									logError('Device with Serial Number: ' + currentSerial + ' could not be assigned to an unknown site');
									moveCounter = moveCounter + 1;
									checkForSiteMoveCompletion();
								}
							});
						} else {
							// no need to move the device. It's already in the correct site
							logInformation('Device with Serial Number: ' + currentSerial + ' was aleady assigned the correct site');
							moveCounter = moveCounter + 1;
							checkForSiteMoveCompletion();
						}
					}
				}
			} else {
				// blank line in CSV
				moveCounter = moveCounter + 1;
				checkForSiteMoveCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoSitePromise.promise();
	}
}

function checkForSiteRemoveCompletion() {
	var moveProgress = (moveCounter / csvData.length) * 100;
	moveNotification.update({ progress: moveProgress });

	if (moveCounter == csvData.length) {
		if (moveNotification) moveNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Remove from Site Failure',
					text: 'Some or all devices failed to be removed from the requested sites',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All devices were removed to the requested sites',
					icon: 'success',
				});
			}
			updateMonitoringWithClients(false, false);
		} else {
			logEnd('Automation: Site removal complete');
			autoSitePromise.resolve();
		}
	}
}

function removeDevicesFromSite() {
	/*  
		get site from sites data
		get device from correct device data
		check if device is in a site
		if yes, and the correct site - remove it
	*/

	moveNotification = showProgressNotification('ca-world-pin', 'Removing devices from sites...', 'bottom', 'center', 'info');
	moveCounter = 0;
	// Get the device monitoring data (IAP, Switch, Gateway) to determine device type
	$.each(csvData, function() {
		// find device in inventory to get device type
		if (this['SERIAL']) {
			var currentSerial = this['SERIAL'].trim();
			var found = false;
			// Check APs
			// Find the device and type
			var foundDevice = findDeviceInMonitoring(currentSerial);

			if (!foundDevice) {
				logError('Device with Serial Number: ' + currentSerial + ' was not found in the device monitoring');
				moveCounter = moveCounter + 1;
				checkForSiteRemoveCompletion();
			} else {
				if (!foundDevice['site']) {
					logError('Device with Serial Number: ' + currentSerial + ' is not assigned to a site');
					moveCounter = moveCounter + 1;
					checkForSiteRemoveCompletion();
				} else {
					// remove from old site
					$.when(unassignDeviceFromSite(foundDevice)).then(function() {
						moveCounter = moveCounter + 1;
						checkForSiteRemoveCompletion();
					});
				}
			}
		} else {
			// blank line in CSV
			moveCounter = moveCounter + 1;
			checkForSiteRemoveCompletion();
		}
	});
	if (currentWorkflow !== '') {
		return autoSitePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Label functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function getLabelIDforLabel(label) {
	var labelID = -1;
	$.each(labels, function() {
		if (this['label_name'] === label) {
			labelID = this['label_id'];
			return false;
		}
	});
	return labelID;
}

function getLabels(offset) {
	if (offset == 0) {
		var labelPromise = new $.Deferred();
		labels = [];
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/central/v1/labels?offset=' + offset + '&limit=' + apiLimit,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/central/v1/labels)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		labels = labels.concat(response.labels);
		offset += apiLimit;
		if (offset < response.total) {
			getLabels(offset);
		} else {
			labelPromise.resolve();
		}
	});
	return labelPromise.promise();
}

function assignLabelsToDevices() {
	/*  
		get labels from label data
		group the devices per label
		assign label to list of devices
	*/
	var labelSuccessCount = 0;
	var labelFailedCount = 0;
	var labelTotalCount = 0;
	$.when(updateInventory(false)).then(function() {
		labelNotification = showProgressNotification('ca-tag-add', 'Assigning devices to labels...', 'bottom', 'center', 'info');
		labelCounter = 0;
		// Get all the Labels
		$.when(getLabels(0)).then(function() {
			// Build lists of devices for each label in the CSV
			var labelDevices = {};
			$.each(csvData, function() {
				// support case of multiple labels per device
				var currentLabels = this['LABELS'].split(':');
				if (this['LABELS'].includes(',')) currentLabels = this['LABELS'].split(',');
				var currentSerial = this['SERIAL'].trim();
				$.each(currentLabels, function() {
					var currentLabel = this.trim();
					if (currentLabel !== '') {
						// break up into label based sets of IAP, Switch, Gateway device types
						if (!labelDevices[currentLabel]) labelDevices[currentLabel] = {};
						var foundDevice = findDeviceInInventory(currentSerial);
						if (foundDevice) {
							var currentDevices = labelDevices[currentLabel];
							if (!currentDevices[deviceType]) currentDevices[deviceType] = [];
							var currentDeviceType = currentDevices[deviceType];
							currentDeviceType.push(currentSerial);
							labelTotalCount++;
							currentDevices[deviceType] = currentDeviceType;
							labelDevices[currentLabel] = currentDevices;
						}
					}
				});
			});

			// Update the labels
			for (const [key, value] of Object.entries(labelDevices)) {
				// Build data JSON
				var labelID = getLabelIDforLabel(key);
				if (labelID == -1) {
					logError('The label "' + key + '" does not exist in Central');
				} else {
					var labelDeviceTypes = value;
					for (const [key, value] of Object.entries(labelDeviceTypes)) {
						var labelData = {};
						labelData['label_id'] = labelID;
						labelData['device_ids'] = value;
						labelData['device_type'] = key;

						var settings = {
							url: getAPIURL() + '/tools/postCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/central/v2/labels/associations',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify(labelData),
							}),
						};

						$.ajax(settings).done(function(response, textStatus, jqXHR) {
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (/central/v2/labels/associations)');
								}
							}

							$.each(response['failed'], function() {
								if (this['reason'] !== 'LABEL_ERR_LABEL_ID_ALREADY_ASSOCIATED') {
									logError('Device with Serial Number "' + this['device_id'] + '" failed to be assigned the requested Label');
									labelFailedCount++;
								} else {
									labelSuccessCount++;
								}
							});
							$.each(response['success'], function() {
								logInformation('Device with Serial Number "' + this['device_id'] + '" was assigned the requested Label');
								labelSuccessCount++;
							});
							var labelProgress = ((labelFailedCount + labelSuccessCount) / labelTotalCount) * 100;
							labelNotification.update({ progress: labelProgress });

							if (labelFailedCount + labelSuccessCount >= labelTotalCount) {
								labelNotification.close();
								if (labelFailedCount > 0) {
									showLog();
									Swal.fire({
										title: 'Labelling Failure',
										text: 'Some or all devices failed to be assigned labels',
										icon: 'error',
									});
								} else {
									Swal.fire({
										title: 'Labelling Success',
										text: 'All devices were assigned the requested labels',
										icon: 'success',
									});
								}
							}
						});
					}
				}
			}
		});
	});
}

function removeLabelsFromDevices() {
	/*  
		get labels from label data
		group the devices per label
		Unassociate label from list of devices
	*/
	var labelSuccessCount = 0;
	var labelFailedCount = 0;
	var labelTotalCount = 0;
	$.when(updateInventory(false)).then(function() {
		labelNotification = showProgressNotification('ca-tag-remove', 'Removing labels from devices...', 'bottom', 'center', 'info');
		labelCounter = 0;
		// Get all the Labels
		$.when(getLabels(0)).then(function() {
			// Build lists of devices for each label in the CSV
			var labelDevices = {};
			$.each(csvData, function() {
				// support case of multiple labels per device
				var currentLabels = this['LABELS'].split(':');
				if (this['LABELS'].includes(',')) currentLabels = this['LABELS'].split(',');
				var currentSerial = this['SERIAL'].trim();
				$.each(currentLabels, function() {
					var currentLabel = this.trim();
					if (currentLabel !== '') {
						// break up into label based sets of IAP, Switch, Gateway device types
						if (!labelDevices[currentLabel]) labelDevices[currentLabel] = {};
						var foundDevice = findDeviceInInventory(currentSerial);
						if (foundDevice) {
							var currentDevices = labelDevices[currentLabel];
							if (!currentDevices[deviceType]) currentDevices[deviceType] = [];
							var currentDeviceType = currentDevices[deviceType];
							currentDeviceType.push(currentSerial);
							labelTotalCount++;
							currentDevices[deviceType] = currentDeviceType;
							labelDevices[currentLabel] = currentDevices;
						}
					}
				});
			});

			// Update the labels
			for (const [key, value] of Object.entries(labelDevices)) {
				// Build data JSON
				var labelID = getLabelIDforLabel(key);
				if (labelID == -1) {
					logError('The label "' + key + '" does not exist in Central');
					labelFailedCount++;
				} else {
					var labelDeviceTypes = value;
					for (const [key, value] of Object.entries(labelDeviceTypes)) {
						var labelData = {};
						labelData['label_id'] = labelID;
						labelData['device_ids'] = value;
						labelData['device_type'] = key;

						var settings = {
							url: getAPIURL() + '/tools/deleteCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/central/v2/labels/associations',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify(labelData),
							}),
						};

						$.ajax(settings).done(function(response, textStatus, jqXHR) {
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (/central/v2/labels/associations)');
								}
							}
							
							$.each(response['failed'], function() {
								if (this['reason'] === 'LABEL_ERR_UNABLE_TO_DELETE_ASSOCIATION') {
									logError('Device with Serial Number "' + this['device_id'] + '" failed to have the requested label removed');
									labelFailedCount++;
								} else {
									labelSuccessCount++;
								}
							});
							$.each(response['success'], function() {
								logInformation('Device with Serial Number "' + this['device_id'] + '" had the requested label removed');
								labelSuccessCount++;
							});
							var labelProgress = ((labelFailedCount + labelSuccessCount) / labelTotalCount) * 100;
							labelNotification.update({ progress: labelProgress });

							if (labelFailedCount + labelSuccessCount >= labelTotalCount) {
								labelNotification.close();
								if (labelFailedCount > 0) {
									showLog();
									Swal.fire({
										title: 'Labelling Failure',
										text: 'Some or all devices failed to have labels removed',
										icon: 'error',
									});
								} else {
									Swal.fire({
										title: 'Labelling Success',
										text: 'All devices had the requested labels removed',
										icon: 'success',
									});
								}
							}
						});
					}
				}
			}
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Renaming functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function checkForRenameCompletion() {
	var renameProgress = (renameCounter / csvData.length) * 100;
	renameNotification.update({ progress: renameProgress });

	if (renameCounter == csvData.length) {
		if (renameNotification) renameNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all devices failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All devices were renamed',
					icon: 'success',
				});
			}
		} else if (currentWorkflow === 'auto-site-rename') {
			logEnd('Automation: Renaming complete');
			autoRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorename') {
			logEnd('Automation: Magic Renaming complete');
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === 'auto-site-autorenameap-portdescriptions') {
			logEnd('Automation: Magic Renaming complete');
			autoMagicRenamePromise.resolve();
		}
	}
}

function renameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname"
	*/

	renameCounter = 0;
	$.when(updateInventory(false)).then(function() {
		renameNotification = showProgressNotification('ca-card-update', 'Renaming devices...', 'bottom', 'center', 'info');

		var hostnameVariable = localStorage.getItem('hostname_variable');
		if (hostnameVariable === null || hostnameVariable === '') {
			hostnameVariable = '_sys_hostname';
		}

		for (var i=0; i< csvData.length; i++) {			
			// Spread out the requests to not hit 7/sec api limit
			setTimeout(singleRename, apiDelay*i, csvData[i]);
		}
	});
	if (currentWorkflow !== '') {
		return autoRenamePromise.promise();
	}
}

function singleRename(csvRow) {
	if (csvRow['SERIAL'] && csvRow['DEVICE NAME']) {
		var currentSerial = csvRow['SERIAL'].trim();
		var newHostname = csvRow['DEVICE NAME'].trim();
		if (!newHostname) {
			logError('Device with Serial Number: ' + currentSerial + ' has no device name in the CSV file');
			renameCounter = renameCounter + 1;
			checkForRenameCompletion();
		} else {
			var device = findDeviceInInventory(currentSerial);
			//console.log(device)
			if (!device) {
				logError('Unable to find device ' + currentSerial + ' in the device inventory');
				apiErrorCount++;
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			} else if (deviceType === 'IAP' || deviceType === 'AP' || device.device_type === 'AP') {
				// if AP then get AP settings
				//console.log('IAP')
				var settings = {
					url: getAPIURL() + '/tools/getCommandwHeaders',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
						access_token: localStorage.getItem('access_token'),
					}),
				};
	
				$.ajax(settings).done(function(commandResults, statusText, xhr) {
					if (commandResults.hasOwnProperty('headers')) {
						updateAPILimits(JSON.parse(commandResults.headers));
					}
					if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
						logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
						apiErrorCount++;
						return;
					} else if (commandResults.hasOwnProperty('error_code')) {
						logError(commandResults.description);
						apiErrorCount++;
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					} else {
						var response = JSON.parse(commandResults.responseBody);
						// Update ap settings
						var settings = {
							url: getAPIURL() + '/tools/postCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
							}),
						};
	
						$.ajax(settings).done(function(response, textStatus, jqXHR) {
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
								}
							}
							if (response !== currentSerial) {
								logError(currentSerial + ' was not renamed');
								//console.log(response.reason);
								apiErrorCount++;
							} else {
								logInformation(currentSerial + ' was renamed successfully');
							}
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						});
					}
				});
			} else if (deviceType === 'SWITCH') {
				var currentMac = csvRow['MAC'].trim();
				// patch the switch template variables
				var variables = {};
				variables[hostnameVariable] = newHostname;
				variables['_sys_serial'] = currentSerial;
				variables['_sys_lan_mac'] = currentMac;
	
				var settings = {
					url: getAPIURL() + '/tools/patchCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({ variables: variables }),
					}),
				};
	
				$.ajax(settings).done(function(response, textStatus, jqXHR) {
					if (response.hasOwnProperty('status')) {
						if (response.status === '503') {
							apiErrorCount++;
							logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
						}
					} else if (response.description && response.description === 'Internal Server Error') {
						apiErrorCount++;
						logError('Central Server Error (500): Internal Server Error (/configuration/v1/devices/<SERIAL>/template_variables)');
					}
					if (response !== 'Success') {
						logError('The switch ' + currentSerial + ' was not able to be renamed');
						apiErrorCount++;
					}
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				});
			} else if (deviceType === 'CONTROLLER') {
				// unsupported
				logError('The gateway ' + currentSerial + " was not able to be renamed,  as gateway renaming isn't supported yet");
				renameCounter = renameCounter + 1;
				checkForRenameCompletion();
			}
		}
	} else {
		renameCounter = renameCounter + 1;
		checkForRenameCompletion();
	}
}

function magicRenameDevices() {
	/*  
		if AP - grab ap settings via API, then update the hostname
		if switch - "update" "_sys_hostname" or if customer hostname variable is configured
	*/

	renameCounter = 0;
	renamingCounters = {};
	magicNames = {};
	$.when(updateInventory(false)).then(function() {
		renameNotification = showProgressNotification('ca-pattern-recognition', 'Renaming devices...', 'bottom', 'center', 'info');

		var hostnameVariable = localStorage.getItem('hostname_variable');
		if (hostnameVariable === null || hostnameVariable === '') {
			hostnameVariable = '_sys_hostname';
		}

		$.each(csvData, function() {
			// find device in inventory to get device type
			var currentSerial = this['SERIAL'].trim();
			var currentMac = this['MAC'].trim();
			var currentdevice = this;
			$.when(getAnyTopologyNeighbors(currentSerial)).then(function() {
				//console.log(neighborSwitches)
				// Grab AP name format from localStorage
				var newHostname = localStorage.getItem('ap_naming_format');
				if (newHostname === null || newHostname === '') {
					newHostname = '{{initials}}-{{model}}-{{number}}';
				} else {
					newHostname = newHostname.toLowerCase();
				}

				// Format: SiteInitials-APModel-Number
				if (!currentdevice['SITE'] && (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}'))) {
					logError('Device with Serial Number: ' + currentSerial + ' has no site name in the CSV file');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else if (!neighborSwitches[currentSerial] && (newHostname.includes('{{switch}}') || newHostname.includes('{{port}}'))) {
					logError('Device with Serial Number: ' + currentSerial + ' has neighbor switch information');
					renameCounter = renameCounter + 1;
					checkForRenameCompletion();
				} else {
					var siteInitials = '';
					var site = '';
					if (newHostname.includes('{{site}}') || newHostname.includes('{{initials}}')) {
						site = currentdevice['SITE'];
						siteInitials = site.match(/\b(\w)/g).join('');
					}
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					} else if (deviceType === 'IAP') {
						// Grab model number
						var model = device.aruba_part_no;
						if (model.startsWith('J')) model = device.model;
						else if (model.startsWith('R')) model = device.model;
						else if (model.startsWith('Q')) model = device.model;

						// grab AP number - sequential for each site, and update for next AP.
						var apNumber = renamingCounters[siteInitials];
						if (!apNumber) {
							renamingCounters[siteInitials] = 1;
							apNumber = 1;
						}
						renamingCounters[siteInitials] = apNumber + 1;
						var connectedSwitch = neighborSwitches[currentSerial];
						if (!connectedSwitch) connectedSwitch = {};
						if (!connectedSwitch['neighborName']) connectedSwitch['neighborName'] = 'UnknownSwitch';
						if (!connectedSwitch['remotePort']) connectedSwitch['remotePort'] = 'UnknownPort';

						//  generate string for AP number
						var tripleDigit = padNumber(apNumber, 3);

						// Replace elements in the format
						newHostname = newHostname.replace('{{initials}}', siteInitials);
						newHostname = newHostname.replace('{{site}}', site);
						newHostname = newHostname.replace('{{model}}', model);
						newHostname = newHostname.replace('{{number}}', tripleDigit);
						newHostname = newHostname.replace('{{switch}}', connectedSwitch['neighborName']);
						newHostname = newHostname.replace('{{port}}', connectedSwitch['remotePort']);

						// Replace spaces
						newHostname = newHostname.replace(/ /g, '');

						magicNames[currentSerial] = newHostname; // store incase of enhanced workflow requiring it.

						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								renameCounter = renameCounter + 1;
								checkForRenameCompletion();
							} else {
								var response = JSON.parse(commandResults.responseBody);
								if (response.hostname === newHostname) {
									// no need to do anything as the name already matches
									logInformation('Device ' + currentSerial + " hostname doesn't need to be updated");
									renameCounter = renameCounter + 1;
									checkForRenameCompletion();
								} else {
									// Update ap settings
									var settings = {
										url: getAPIURL() + '/tools/postCommand',
										method: 'POST',
										timeout: 0,
										headers: {
											'Content-Type': 'application/json',
										},
										data: JSON.stringify({
											url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
											access_token: localStorage.getItem('access_token'),
											data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: newHostname }),
										}),
									};

									$.ajax(settings).done(function(response, textStatus, jqXHR) {
										if (response.hasOwnProperty('status')) {
											if (response.status === '503') {
												apiErrorCount++;
												logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
											}
										}
										if (response !== currentSerial) {
											logError(device.serial + ' was not renamed');
											//console.log(response.reason);
											apiErrorCount++;
										}
										renameCounter = renameCounter + 1;
										checkForRenameCompletion();
									});
								}
							}
						});
					} else if (deviceType === 'SWITCH') {
						// Grab model number
						//console.log(device);
						var model = device.aruba_part_no;
						if (model.startsWith('J')) model = device.model;
						else if (model.startsWith('R')) model = device.model;
						else if (model.startsWith('Q')) model = device.model;

						// grab AP number - sequential for each site, and update for next AP.
						var apNumber = renamingCounters[siteInitials];
						if (!apNumber) {
							renamingCounters[siteInitials] = 1;
							apNumber = 1;
						}
						renamingCounters[siteInitials] = apNumber + 1;
						var connectedSwitch = neighborSwitches[currentSerial];
						if (!connectedSwitch) connectedSwitch = {};
						if (!connectedSwitch['neighborName']) connectedSwitch['neighborName'] = 'UnknownSwitch';
						if (!connectedSwitch['remotePort']) connectedSwitch['remotePort'] = 'UnknownPort';

						//  generate string for AP number
						var tripleDigit = padNumber(apNumber, 3);

						// Replace elements in the format
						newHostname = newHostname.replace('{{initials}}', siteInitials);
						newHostname = newHostname.replace('{{site}}', site);
						newHostname = newHostname.replace('{{model}}', model);
						newHostname = newHostname.replace('{{number}}', tripleDigit);
						newHostname = newHostname.replace('{{switch}}', connectedSwitch['neighborName']);
						newHostname = newHostname.replace('{{port}}', connectedSwitch['remotePort']);

						// Replace spaces
						newHostname = newHostname.replace(/ /g, '');

						magicNames[currentSerial] = newHostname; // store incase of enhanced workflow requiring it.

						var variables = {};
						variables[hostnameVariable] = newHostname;
						variables['_sys_serial'] = currentSerial;
						variables['_sys_lan_mac'] = currentMac;
						console.log(variables);

						// patch the switch template variables
						var settings = {
							url: getAPIURL() + '/tools/patchCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ variables: variables }),
							}),
						};

						$.ajax(settings).done(function(response, textStatus, jqXHR) {
							//console.log(response);
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
								}
							} else if (response.description && response.description === 'Internal Server Error') {
								apiErrorCount++;
								logError('Central Server Error (500): Internal Server Error (/configuration/v1/devices/<SERIAL>/template_variables)');
							}
							if (response !== 'Success') {
								logError('The switch ' + currentSerial + ' was not able to be renamed');
								if (response.description) {
									logError(response.description);
								}
								apiErrorCount++;
							}
							renameCounter = renameCounter + 1;
							checkForRenameCompletion();
						});
					} else {
						//console.log("Not an IAP or switch")
						renameCounter = renameCounter + 1;
						checkForRenameCompletion();
					}
				}
			});
		});
	});
	if (currentWorkflow !== '') {
		return autoMagicRenamePromise.promise();
	}
}

function checkForUpdatePortCompletion() {
	if (updatePortsCounter == csvData.length) {
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Renaming Failure',
					text: 'Some or all ports failed to be renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Renaming Success',
					text: 'All ports with connected APs were renamed',
					icon: 'success',
				});
			}
		} else {
			autoPortPromise.resolve();
		}
	}
}

function getAnyTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/topology_external_api/apNeighbors/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/topology_external_api/apNeighbors/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var neighbors = response.neighbors;

		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === 'Switch' && this.localPort === 'eth0') {
				neighborSwitches[serial] = this;
				return false;
			}
		});
	});
}

function getTopologyNeighbors(serial) {
	/*  
		get LLDP neighbours for AP
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/topology_external_api/apNeighbors/' + serial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/topology_external_api/apNeighbors/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		var neighbors = response.neighbors;
		$.each(neighbors, function() {
			// Neighbour is a switch, and AP connects on Eth0, and its one of our managed switches
			if (this.neighborRole === 'Switch' && this.localPort === 'eth0' && findDeviceInMonitoring(this.neighborSerial)) {
				neighborSwitches[serial] = this;
				return false;
			}
		});
	});
}

/* Updated v.1.9 */
function getSwitchPorts(currentSerial) {
	/*  
		Get switch port details from AOS-S UI Group API
	*/
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/aos_switch/ports/devices/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/aos_switch/ports/devices/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		//console.log('Got Switch port details for switch: ' + currentSerial);
		modifiedUISwitches[currentSerial] = response;
	});
}

function updateSwitchPorts(currentSerial) {
	// Update port description with AP hostname
	var settings = {
		url: getAPIURL() + '/tools/putCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/aos_switch/ports/devices/' + neighborSwitches[currentSerial].neighborSerial,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ ports: modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports }),
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				apiErrorCount++;
				logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/aos_switch/ports/devices/<SERIAL>)');
			}
		}
		logInformation('Updating switch port name for AP (' + currentSerial + '): ' + response);
		if (response !== 'Success') {
			logError('The switch port for AP (' + currentSerial + ') was not able to be renamed');
			apiErrorCount++;
		}
		updatePortsCounter = updatePortsCounter + 1;
		checkForUpdatePortCompletion();
	});
}
function updatePortDescription(magic) {
	/*  
		if switch templates - "update" the variable using the switch port variable from settings
		else using UI group - "update" the port number directly
	*/

	updatePortsCounter = 0;
	neighborSwitches = {};
	modifiedUISwitches = {};
	showNotification('ca-card-update', 'Renaming switch ports for connected APs...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var currentSerial = this['SERIAL'].trim();
		var hostname = this['DEVICE NAME'].trim();
		var device = findDeviceInMonitoring(currentSerial);
		if (deviceType === 'IAP') {
			$.when(getTopologyNeighbors(currentSerial)).then(function() {
				if (!neighborSwitches[currentSerial]) {
					updatePortsCounter = updatePortsCounter + 1;
					checkForUpdatePortCompletion();
				} else {
					// Need to check if switch is UI group or Template Group
					var neighborSwitch = findDeviceInMonitoring(neighborSwitches[currentSerial].neighborSerial);
					var switchGroup = {};
					$.each(groups, function() {
						if (this.group === neighborSwitch.group_name) {
							switchGroup = this;
						}
					});
					//console.log(neighborSwitch)

					if (switchGroup['template_details']['Wired']) {
						logInformation('Template Group');
						// If using Templates for switches

						var portName = 'int' + neighborSwitches[currentSerial].remotePort + '_name';
						var variables = {};
						if (magic) {
							// running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}
						variables[portName] = hostname;
						variables['_sys_serial'] = neighborSwitch.serial;
						variables['_sys_lan_mac'] = neighborSwitch.macaddr;

						// Update port description with AP hostname
						var settings = {
							url: getAPIURL() + '/tools/patchCommand',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + neighborSwitches[currentSerial].neighborSerial + '/template_variables',
								access_token: localStorage.getItem('access_token'),
								data: JSON.stringify({ variables: variables }),
							}),
						};

						$.ajax(settings).done(function(response, textStatus, jqXHR) {
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
								}
							}
							if (response !== 'Success') {
								logError('The switch port for AP (' + currentSerial + ') was not able to be renamed');
								apiErrorCount++;
							}
							updatePortsCounter = updatePortsCounter + 1;
							checkForUpdatePortCompletion();
						});
					} else if (neighborSwitch.switch_type === 'AOS-S') {
						// If using UI Group for AOS-S switches
						logInformation('AOS-S UI Group');

						if (magic) {
							// running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}

						// if already obtained the switch ports for this switch then just update the port name
						if (modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial]) {
							$.each(modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports, function() {
								if (this['port_id'] === neighborSwitches[currentSerial].remotePort.toString()) {
									this['name'] = hostname;
									updateSwitchPorts(currentSerial);
								}
							});
						} else {
							// get the port details for connected switch
							$.when(getSwitchPorts(neighborSwitches[currentSerial].neighborSerial)).then(function() {
								// then just update the port name
								$.each(modifiedUISwitches[neighborSwitches[currentSerial].neighborSerial].ports, function() {
									if (this['port_id'] === neighborSwitches[currentSerial].remotePort.toString()) {
										this['name'] = hostname;
										updateSwitchPorts(currentSerial);
									}
								});
							});
						}
					} else {
						logInformation('AOS-CX UI Group');
						logError('The switch port for AP (' + currentSerial + ') was not able to be renamed as it is a CX Switch in a UI Group');
						apiErrorCount++;
						updatePortsCounter = updatePortsCounter + 1;
						checkForUpdatePortCompletion();

						// Based on Goldman Sachs UI APIs
						/*
						var variables =  {};
						if (magic) {  // running enhanced naming workflow
							hostname = magicNames[currentSerial];
						}
						
						// Update port description with AP hostname
						var settings = {
							"url": getAPIURL() + "/tools/postCommand",
							"method": "POST",
							"timeout": 0,
							 "headers": {
								"Content-Type": "application/json"
							},
							"data": JSON.stringify({
								"url": localStorage.getItem('base_url') + "/configuration/v1/switch/cx/interfaces?device_serial=" + neighborSwitches[currentSerial].neighborSerial,
								"access_token": localStorage.getItem('access_token'),
								"data": JSON.stringify({"update": {neighborSwitches[currentSerial].remotePort: {"description": hostname}}})
								
							})
						};
						
						$.ajax(settings).done(function (response, textStatus, jqXHR) {
							if (response.hasOwnProperty('status')) {
								if (response.status === '503') {
									apiErrorCount++;
									logError('Central Server Error (503): ' + response.reason + ' (api)');
								}
							}
						  if (response !== "Success") {
							   logError("The switch port for AP ("+ currentSerial  + ") was not able to be renamed")
							   apiErrorCount++;			
						   }
						   updatePortsCounter = updatePortsCounter + 1;
						   checkForUpdatePortCompletion();	
						});
						*/
					}
				}
			});
		} else {
			updatePortsCounter = updatePortsCounter + 1;
			checkForUpdatePortCompletion();
		}
	});
	if (currentWorkflow !== '') {
		return autoPortPromise.promise();
	}
}

function updateDeviceVariables() {
	/*  
		Update template variables using CSV headers for variable names.
	*/

	updateVariablesCounter = 0;
	showNotification('ca-setup-tools', 'Updating Device Variables...', 'bottom', 'center', 'info');

	$.each(csvData, function() {
		var variables = {};
		for (let k in this) {
			if (k === 'DEVICE NAME') {
				var hostname_variable = '_sys_hostname';
				variables[hostname_variable] = this[k];
			} else if (k === 'IP ADDRESS') {
				var ip_variable = '_sys_ip_address';
				variables[ip_variable] = this[k];
			} else if (k === 'SERIAL') {
				var serial_variable = '_sys_serial';
				variables[serial_variable] = this[k];
			} else if (k === 'MAC') {
				var mac_variable = '_sys_lan_mac';
				variables[mac_variable] = this[k];
			} else if (k !== 'SERIAL' && k !== 'MAC' && k !== 'GROUP' && k !== 'SITE' && k !== 'LICENSE' && this[k] !== '') {
				variables[k] = this[k];
			}
		}
		//console.log(variables)

		var settings = {
			url: getAPIURL() + '/tools/patchCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/configuration/v1/devices/' + currentSerial + '/template_variables',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify({ variables: variables }),
			}),
		};

		$.ajax(settings).done(function(response, textStatus, jqXHR) {
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/devices/<SERIAL>/template_variables)');
				}
			}
			if (response !== 'Success') {
				logError('The variables for ' + currentSerial + ' were not able to be updated');
				apiErrorCount++;
			}
			updateVariablesCounter = updateVariablesCounter + 1;
			checkForUpdateVariablesCompletion();
		});
	});
	if (currentWorkflow !== '') {
		return autoVariablesPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Zone functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForZoneCompletion() {
	var zoneProgress = (zoneCounter / csvData.length) * 100;
	zoneNotification.update({ progress: zoneProgress });

	if (zoneCounter == csvData.length) {
		if (zoneNotification) zoneNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Zone/SSID Configuration Failure',
					text: 'Some or all devices failed to be set to the correct Zones/SSIDs',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Zone/SSID Configuration Success',
					text: 'All devices were set to the correct Zones/SSIDs',
					icon: 'success',
				});
			}
		} /* else if (currentWorkflow === "auto-site-rename"){
			logEnd("Automation: Renaming complete")
			autoZonePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorename"){
			logEnd("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorenameap-portdescriptions"){
			logEnd("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		}*/
	}
}

function setAPZone() {
	/*  
		if AP - grab ap settings via API, then update the zonename
	*/

	zoneCounter = 0;
	$.when(updateInventory(false)).then(function() {
		zoneNotification = showProgressNotification('ca-setup-tools', 'Setting AP Zones/SSIDs...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var newZonename = this['ZONE'].trim();
				newZonename = newZonename.replace(/\s*,\s*/g, ',');
				if (!newZonename || newZonename === '-') {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no AP Zone/SSIDs in the CSV file');
					zoneCounter = zoneCounter + 1;
					checkForZoneCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						zoneCounter = zoneCounter + 1;
						checkForZoneCompletion();
					} else if (deviceType === 'IAP') {
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);
							
							
							
							// Alternate approach using /configuration/v1/ap_settings_cli/<SERIAL>
							
							/*
							var apCLIResponse = response;
							if (apCLIResponse.indexOf('  zonename ' + newZonename) != -1) {
								// no need to change the config
								logInformation(currentSerial + ' was already assigned the Zone/SSID "' + newZonename + '"');
								zoneCounter++;
								checkForZoneCompletion();
							} else {
								// Check if existing config line needs to be removed
								var zoneLocation = -1;
								for (i = 0; i < apCLIResponse.length; i++) {
									if (apCLIResponse[i].includes('zonename ')) zoneLocation = i;
								}
								if (zoneLocation != -1) apCLIResponse.splice(zoneLocation, 1);
								
								// Add the new zone/profile config if required
								if (newZonename !== '*') apCLIResponse.push('  zonename ' + newZonename);
							
								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};
							
								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the AP Zone/SSID "' + newZonename + '". Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										if (newZonename === '*') logInformation(currentSerial + ' was assigned no AP Zone/SSID');
										else logInformation(currentSerial + ' was assigned the AP Zone/SSID "' + newZonename + '"');
									}
									zoneCounter++;
									checkForZoneCompletion();
								});
							}*/

							//console.log(response, textStatus, jqXHR);
							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								zoneCounter = zoneCounter + 1;
								checkForZoneCompletion();
							} else if (response.zonename === newZonename) {
								// no need to do anything as the name already matches
								logInformation('Device ' + currentSerial + " AP Zone/SSIDs doesn't need to be updated");
								zoneCounter = zoneCounter + 1;
								checkForZoneCompletion();
							} else {
								// Check if we need to set the Zone back to all SSIDs (AOS10 SSID per AP support)
								if (newZonename === '*') newZonename = '_#ALL#_';

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: response.dot11g_radio_disable, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: newZonename, hostname: response.hostname }),
									}),
								};

								$.ajax(settings).done(function(response, textStatus, jqXHR) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned to AP Zone/SSIDs "' + newZonename + '". Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned to AP Zone/SSIDs "' + newZonename + '"');
									}
									zoneCounter = zoneCounter + 1;
									checkForZoneCompletion();
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						zoneCounter = zoneCounter + 1;
						checkForZoneCompletion();
					}
				}
			} else {
				zoneCounter = zoneCounter + 1;
				checkForZoneCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoZonePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		RF Profile functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForRFCompletion() {
	var profileProgress = (rfCounter / csvData.length) * 100;
	profileNotification.update({ progress: profileProgress });

	if (rfCounter == csvData.length) {
		if (profileNotification) profileNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'RF Zone/Profile Configuration Failure',
					text: 'Some or all devices failed to be set to the correct RF Zones/Profiles',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'RF Zone/Profile Configuration Success',
					text: 'All devices were set to the correct RF Zones/RF Profiles',
					icon: 'success',
				});
			}
		} /* else if (currentWorkflow === "auto-site-rename"){
			logEnd("Automation: Renaming complete")
			autoZonePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorename"){
			logEnd("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		} else if (currentWorkflow === "auto-site-autorenameap-portdescriptions"){
			logEnd("Automation: Magic Renaming complete")
			autoMagicRenamePromise.resolve();
		}*/
	}
}

function setRFProfile() {
	/*  
		if AP - grab ap settings via API, then update the rf-zone
	*/

	rfCounter = 0;
	$.when(updateInventory(false)).then(function() {
		profileNotification = showProgressNotification('ca-antenna', 'Setting RF Zones/Profiles...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var newProfileName = null;
				if (this['RF PROFILE']) newProfileName = this['RF PROFILE'].trim();
				else if (this['RF ZONE']) newProfileName = this['RF ZONE'].trim(); 
				
				if (!newProfileName || newProfileName === '-') {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation(currentSerial + ' has no RF Zone/Profile in the CSV file');
					rfCounter++;
					checkForRFCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						rfCounter++;
						checkForRFCompletion();
					} else if (deviceType === 'IAP') {
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								rfCounter++;
								checkForRFCompletion();
							} else {
								// Add profile to the response
								var apCLIResponse = response;
								if (apCLIResponse.indexOf('  rf-zone ' + newProfileName) != -1) {
									// no need to change the config
									logInformation(currentSerial + ' was already assigned the RF Zone/Profile "' + newProfileName + '"');
									rfCounter++;
									checkForRFCompletion();
								} else {
									// Check if existing config line needs to be removed
									var zoneLocation = -1;
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('rf-zone ')) zoneLocation = i;
									}
									if (zoneLocation != -1) apCLIResponse.splice(zoneLocation, 1);
									
									// Add the new zone/profile config if required
									if (newProfileName !== '*') apCLIResponse.push('  rf-zone ' + newProfileName);
	
									// Update ap settings
									var settings = {
										url: getAPIURL() + '/tools/postCommand',
										method: 'POST',
										timeout: 0,
										headers: {
											'Content-Type': 'application/json',
										},
										data: JSON.stringify({
											url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
											access_token: localStorage.getItem('access_token'),
											data: JSON.stringify({ clis: apCLIResponse }),
										}),
									};
	
									$.ajax(settings).done(function(response, statusText, xhr) {
										if (response.hasOwnProperty('status')) {
											if (response.status === '503') {
												apiErrorCount++;
												logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
											}
										}
										if (response !== currentSerial) {
											logError(currentSerial + ' was not assigned the RF Zone/Profile "' + newProfileName + '". Reason: ' + response.reason);
											//console.log(response.reason);
											apiErrorCount++;
										} else {
											if (newProfileName === '*') logInformation(currentSerial + ' was assigned no  RF Zone/Profile');
											else logInformation(currentSerial + ' was assigned the RF Zone/Profile "' + newProfileName + '"');
										}
										rfCounter++;
										checkForRFCompletion();
									});
								}
							}
						});
					} else {
						// Either switch or controller/gateway
						rfCounter++;
						checkForRFCompletion();
					}
				}
			} else {
				rfCounter++;
				checkForRFCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRFPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Swarm Mode functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForSwarmModeCompletion() {
	var swarmProgress = (swarmCounter / csvData.length) * 100;
	vcNotification.update({ progress: swarmProgress });

	if (swarmCounter == csvData.length) {
		if (vcNotification) vcNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Swarm Mode Configuration Failure',
					text: 'Some or all devices failed to be set to the correct Swarm Mode',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Swarm Mode Configuration Success',
					text: 'All devices were set to the correct Swarm Mode',
					icon: 'success',
				});
			}
		}
	}
}

function setSwarmMode() {
	/*  
		if AP - grab ap settings via API, then update the swarm-mode line
	*/

	swarmCounter = 0;
	
	vcNotification = showProgressNotification('ca-networking', 'Configuring Swarm Mode...', 'bottom', 'center', 'info');

	for (var i=0; i<csvData.length; i++) {
		var currentDevice = csvData[i];
		// find device in inventory to get device type
		if (currentDevice['SERIAL'] && currentDevice['SWARM MODE']) {
			var currentSerial = currentDevice['SERIAL'].trim();
			var newMode = currentDevice['SWARM MODE'].toLowerCase();
			setTimeout(processSwarmMode, apiDelay*i, currentSerial, newMode);
		} else {
			if (currentDevice['SERIAL']) logInformation('No Swarm Mode was found in the CSV for '+ currentDevice['SERIAL'])
			swarmCounter++;
			checkForSwarmModeCompletion();
		}
	}
}

function processSwarmMode(currentSerial, newMode) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
			swarmCounter++;
			checkForSwarmModeCompletion();
		} else {
			var apCLIResponse = response;
			
			// Look for existing config
			for (var i=0;i<apCLIResponse.length;i++) {
				if (apCLIResponse[i].includes('swarm-mode')) commandLocation = i
			}
			
			var needsUpdate = false;
			// check if we need to add the command or replace the current command
			if (commandLocation == -1) {
				if (newMode.includes('standalone')) apCLIResponse.push('  swarm-mode standalone');
				else if (newMode.includes('single')) apCLIResponse.push('  swarm-mode single-ap');
				else apCLIResponse.push('  swarm-mode cluster');
				needsUpdate = true;
			} else if (newMode.includes('cluster') && !apCLIResponse[commandLocation].includes('cluster')) {
				apCLIResponse.splice(commandLocation, 1, '  swarm-mode cluster');
				needsUpdate = true;
			} else if (newMode.includes('standalone') && !apCLIResponse[commandLocation].includes('standalone')) {
				apCLIResponse.splice(commandLocation, 1, '  swarm-mode standalone');
				needsUpdate = true;
			} else if (newMode.includes('single') && !apCLIResponse[commandLocation].includes('single-ap')) {
				apCLIResponse.splice(commandLocation, 1, '  swarm-mode single-ap');
				needsUpdate = true;
			}

			// Only push back changes if it was updated.
			if (needsUpdate) {
				// Update ap settings
				var settings = {
					url: getAPIURL() + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({ clis: apCLIResponse }),
					}),
				};
	
				$.ajax(settings).done(function(response, statusText, xhr) {
					if (response.hasOwnProperty('status')) {
						if (response.status === '503') {
							apiErrorCount++;
							logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
						}
					}
					if (response !== currentSerial) {
						logError(currentSerial + ' was not assigned the Swarm Mode configuration. Reason: ' + response.reason);
						//console.log(response.reason);
						apiErrorCount++;
					} else {
						logInformation(currentSerial + ' was assigned the Swarm Mode configuration');
					}
					swarmCounter++;
					checkForSwarmModeCompletion();
				});
			} else {
				logInformation(currentSerial + ' was already configured for the Swarm Mode configuration');
				swarmCounter++;
				checkForSwarmModeCompletion();
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		AP1X functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForAP1XCompletion() {
	var ap1xProgress = (ap1xCounter / csvData.length) * 100;
	ap1xNotification.update({ progress: ap1xProgress });

	if (ap1xCounter == csvData.length) {
		if (ap1xNotification) ap1xNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'AP1X PEAP Credentials Configuration Failure',
					text: 'Some or all devices failed to be set to the correct AP1X credentials',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'AP1X PEAP Configuration Success',
					text: 'All devices were set to the correct AP1X credentials',
					icon: 'success',
				});
			}
		}
	}
}

function setAP1XCredentials() {
	/*  
		if AP - grab ap settings via API, then update the ap1x-peap-user line
	*/

	ap1xCounter = 0;
	
	ap1xNotification = showProgressNotification('ca-ap1x', 'Configuring AP1X PEAP Credentials...', 'bottom', 'center', 'info');

	for (var i=0; i<csvData.length; i++) {
		var currentDevice = csvData[i];
		// find device in inventory to get device type
		if (currentDevice['SERIAL'] && currentDevice['AP1X USERNAME'] && currentDevice['AP1X PASSWORD']) {
			var currentSerial = currentDevice['SERIAL'].trim();
			var newUsername = currentDevice['AP1X USERNAME'];
			var newPassword = currentDevice['AP1X PASSWORD'];
			setTimeout(processAP1XCredentials, apiDelay*i, currentSerial, newUsername, newPassword);
		} else {
			if (currentDevice['SERIAL']) logInformation('No PEAP Credentials were found in the CSV for '+ currentDevice['SERIAL'])
			ap1xCounter++;
			checkForAP1XCompletion();
		}
	}
}

function processAP1XCredentials(currentSerial, newUsername, newPassword) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
			ap1xCounter++;
			checkForAP1XCompletion();
		} else {
			var apCLIResponse = response;
			
			// Look for existing config
			for (var i=0;i<apCLIResponse.length;i++) {
				if (apCLIResponse[i].includes('ap1x-peap-user')) commandLocation = i
			}
			
			var needsUpdate = false;
			// check if we need to add the command or replace the current command
			if (commandLocation == -1) {
				apCLIResponse.push('  ap1x-peap-user '+newUsername+' '+newPassword);
				needsUpdate = true;
			} else if (!apCLIResponse[commandLocation].includes(newUsername) || !apCLIResponse[commandLocation].includes(newPassword)) {
				apCLIResponse.splice(commandLocation, 1, '  ap1x-peap-user '+newUsername+' '+newPassword);
				needsUpdate = true;
			}

			// Only push back changes if it was updated.
			if (needsUpdate) {
				// Update ap settings
				var settings = {
					url: getAPIURL() + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({ clis: apCLIResponse }),
					}),
				};
	
				$.ajax(settings).done(function(response, statusText, xhr) {
					if (response.hasOwnProperty('status')) {
						if (response.status === '503') {
							apiErrorCount++;
							logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
						}
					}
					if (response !== currentSerial) {
						logError(currentSerial + ' was not configured with the new AP1X PEAP credentials. Reason: ' + response.reason);
						//console.log(response.reason);
						apiErrorCount++;
					} else {
						logInformation(currentSerial + ' was configured with the new AP1X PEAP credentials');
					}
					ap1xCounter++;
					checkForAP1XCompletion();
				});
			} else {
				logInformation(currentSerial + ' was already configured with the AP1X PEAP credentials');
				ap1xCounter++;
				checkForAP1XCompletion();
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		POE Optimization functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForPOECompletion() {
	var profileProgress = (poeCounter / csvData.length) * 100;
	profileNotification.update({ progress: profileProgress });

	if (poeCounter == csvData.length) {
		if ($('#BulkPOEConfigModal')) $('#BulkPOEConfigModal').modal('hide');
		if (profileNotification) profileNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'POE Configuration Failure',
					text: 'Some or all devices failed to be set to the correct POE Optimization configuration',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'RF Profile Configuration Success',
					text: 'All devices were set to the correct POE Optimization configuration',
					icon: 'success',
				});
			}
		}
	}
}

function setPOEOptimization() {
	/*  
		if AP - grab ap settings via API, then update the ap-poe-power-optimization enable line
	*/

	poeCounter = 0;
	
	profileNotification = showProgressNotification('ca-antenna', 'Configuring POE Optimization...', 'bottom', 'center', 'info');

	for (var i=0; i<csvData.length; i++) {
		var currentDevice = csvData[i];
		// find device in inventory to get device type
		if (currentDevice['SERIAL']) {
			var currentSerial = currentDevice['SERIAL'].trim();
			var newPOE = currentDevice['POE OPT'];
			setTimeout(processPOEOptimization, apiDelay*i, currentSerial, newPOE);
		} else {
			poeCounter++;
			checkForPOECompletion();
		}
	}
}

function processPOEOptimization(currentSerial, newPOE) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		
		if (response.hasOwnProperty('error_code')) {
			logError(response.description);
			apiErrorCount++;
			poeCounter++;
			checkForPOECompletion();
		} else {
			var apCLIResponse = response;
			var needsUpdate = false;
			if (newPOE) {
				if (apCLIResponse.indexOf('  ap-poe-power-optimization enable') == -1) {
					// Need to add the command
					apCLIResponse.push('  ap-poe-power-optimization enable');
					needsUpdate = true;
				}
			} else {
				// need to check if command is there and remove it.
				if (apCLIResponse.indexOf('  ap-poe-power-optimization enable') != -1) {
					apCLIResponse.splice(apCLIResponse.indexOf('  ap-poe-power-optimization enable'), 1);
					needsUpdate = true;
				}
			}
			
			if (needsUpdate) {
				// Update ap settings
				var settings = {
					url: getAPIURL() + '/tools/postCommand',
					method: 'POST',
					timeout: 0,
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
						access_token: localStorage.getItem('access_token'),
						data: JSON.stringify({ clis: apCLIResponse }),
					}),
				};
	
				$.ajax(settings).done(function(response, statusText, xhr) {
					if (response.hasOwnProperty('status')) {
						if (response.status === '503') {
							apiErrorCount++;
							logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
						}
					}
					if (response !== currentSerial) {
						logError(currentSerial + ' was not assigned the POE Optimization configuration. Reason: ' + response.reason);
						//console.log(response.reason);
						apiErrorCount++;
					} else {
						logInformation(currentSerial + ' was assigned the POE Optimization configuration');
					}
					poeCounter++;
					checkForPOECompletion();
				});
			} else {
				logInformation(currentSerial + ' was already configured for the POE Optimization configuration');
				poeCounter++;
				checkForPOECompletion();
			}
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Radio Mode functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForRadioModeCompletion() {
	var radioProgress = (radioModeCounter / csvData.length) * 100;
	radioNotification.update({ progress: radioProgress });

	if (radioModeCounter >= csvData.length) {
		if (radioNotification) radioNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Radio Mode Configuration Failure',
					text: 'Some or all devices failed to be set to the correct Radio Modes',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Radio Mode Configuration Success',
					text: 'All devices were set to the correct Radio Modes',
					icon: 'success',
				});
			}
		}
	}
}

function setRadioMode(specificMode) {
	/*  
		if AP - grab ap settings via API, then update the wifi0-mode, wifi1-mode, wifi2-mode, split-5ghz-mode and dual-5ghz-mode
	*/
	var settingsList = {};
	radioModeCounter = 0;
	$.when(updateInventory(false)).then(function() {
		radioNotification = showProgressNotification('ca-router', 'Setting Radio Mode...', 'bottom', 'center', 'info');
		if (csvData.length == 0) showNotification('ca-router', 'No matching APs available', 'bottom', 'center', 'warning');
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var newRadio0Mode = this['RADIO 0 MODE'];
				var newRadio1Mode = this['RADIO 1 MODE'];
				var newRadio2Mode = this['RADIO 2 MODE'];
				var dualRadioMode = this['DUAL 5GHZ MODE'];
				var splitRadioMode = this['SPLIT 5GHZ MODE'];
				if ((!newRadio0Mode || newRadio0Mode === '-') && (!newRadio1Mode || newRadio1Mode === '-') && (!newRadio2Mode || newRadio2Mode === '-')) {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no Radio Mode in the CSV file');
					radioModeCounter++;
					checkForRadioModeCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						radioModeCounter++;
						checkForRadioModeCompletion();
					} else if (deviceType === 'IAP') {
						settingsList[device.macaddr.toLowerCase()] = this;
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								radioModeCounter++;
								checkForRadioModeCompletion();
							} else {
								var apCLIResponse = response;
								// Pull in the new settings from the settingsList (ensures correct settings are used)
								var newSettingsKey = [apCLIResponse[0].replace('per-ap-settings ', '')];
								var newSettings = settingsList[newSettingsKey];

								var currentSerial = newSettings['SERIAL'].trim();
								var newRadio0Mode = newSettings['RADIO 0 MODE'];
								var newRadio1Mode = newSettings['RADIO 1 MODE'];
								var newRadio2Mode = newSettings['RADIO 2 MODE'];
								var dualRadioMode = newSettings['DUAL 5GHZ MODE'];
								var splitRadioMode = newSettings['SPLIT 5GHZ MODE'];

								// rebuild each line required for the radio config
								var wifi0mode = -1;
								var wifi1mode = -1;
								var wifi2mode = -1;
								// Radio 0
								if (newRadio0Mode && newRadio0Mode !== '-' && (specificMode === 'all' || specificMode === 'split' || specificMode === 'dual')) {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-0-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-0-disable'), 1);
									if (apCLIResponse.indexOf('  dot11a-radio-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dot11a-radio-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi0-mode')) wifi0mode = i;
									}
									if (wifi0mode != -1) apCLIResponse.splice(wifi0mode, 1);

									// add in the new config but only on supported AP models
									var newRadioMode = newRadio0Mode.trim().toLowerCase();
									if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
										apCLIResponse.push('  wifi0-mode ' + newRadioMode);
									} else if (newRadioMode === 'off') {
										if (device.model.includes('635') || device.model.includes('655')) apCLIResponse.push('  radio-0-disable');
										else apCLIResponse.push('  dot11a-radio-disable');
									}
								}

								// Radio 1
								if (newRadio1Mode && newRadio1Mode !== '-' && (specificMode === 'all' || specificMode === 'dual')) {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-1-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-1-disable'), 1);
									if (apCLIResponse.indexOf('  dot11g-radio-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dot11g-radio-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi1-mode')) wifi1mode = i;
									}
									if (wifi1mode != -1) apCLIResponse.splice(wifi1mode, 1);

									// add in the new config but only on supported AP models
									var newRadioMode = newRadio1Mode.trim().toLowerCase();
									if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
										apCLIResponse.push('  wifi1-mode ' + newRadioMode);
									} else if (newRadioMode === 'off') {
										if (device.model.includes('635') || device.model.includes('655')) apCLIResponse.push('  radio-1-disable');
										else apCLIResponse.push('  dot11g-radio-disable');
									}
								}

								// Radio 2
								if (newRadio2Mode && newRadio2Mode !== '-' && (specificMode === 'all' || specificMode === 'split')) {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-2-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-2-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi2-mode')) wifi2mode = i;
									}
									if (wifi2mode != -1) apCLIResponse.splice(wifi2mode, 1);

									// Check if Split radio is enabled - which allow use of radio2
									var split555 = false;
									if (splitRadioMode && splitRadioMode !== '-') {
										var newRadioMode = splitRadioMode.trim().toLowerCase();
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled' || newRadioMode === 'enable') split555 = true;
									}
									// add in the new config but only on supported AP models
									if (device.model.includes('635') || device.model.includes('655') || split555) {
										var newRadioMode = newRadio2Mode.trim().toLowerCase();
										if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
											apCLIResponse.push('  wifi2-mode ' + newRadioMode);
										} else if (newRadioMode === 'off') {
											apCLIResponse.push('  radio-2-disable');
										}
									}
								}

								// Dual 5GHz Mode
								if (dualRadioMode && dualRadioMode !== '-' && (specificMode === 'all' || specificMode === 'dual')) {
									// remove the old settings
									if (apCLIResponse.indexOf('  dual-5GHz-mode disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dual-5GHz-mode disable'), 1);
									if (apCLIResponse.indexOf('  dual-5GHz-mode enable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dual-5GHz-mode enable'), 1);

									// add in the new config but only on supported AP models
									if (device.model.includes('344') || device.model.includes('345')) {
										// Standardize inputs for correct setting
										var newRadioMode = dualRadioMode.trim().toLowerCase();
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled') newRadioMode = 'enable';
										if (newRadioMode === 'false' || newRadioMode === 'no' || newRadioMode === 'n' || newRadioMode === 'disabled') newRadioMode = 'disable';
										if (newRadioMode === 'enable' || newRadioMode === 'disable') {
											apCLIResponse.push('  dual-5GHz-mode ' + newRadioMode);
										}
									}
								}

								// Split 5GHz Mode on 555
								if (splitRadioMode && splitRadioMode !== '-' && (specificMode === 'all' || specificMode === 'split')) {
									// remove the old settings
									if (apCLIResponse.indexOf('  split-5ghz-mode enabled') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  split-5ghz-mode enabled'), 1);

									// add in the new config but only on supported AP models
									if (device.model.includes('555')) {
										// Standardize inputs for correct setting
										var newRadioMode = splitRadioMode.trim().toLowerCase();
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled') newRadioMode = 'enable';
										if (newRadioMode === 'enable') {
											apCLIResponse.push('  split-5ghz-mode enabled');
										}
									}
								}
								//console.log(apCLIResponse);

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};

								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the new Radio Modes. Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned the new Radio Modes ');
									}
									radioModeCounter++;
									checkForRadioModeCompletion();
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						radioModeCounter++;
						checkForRadioModeCompletion();
					}
				}
			} else {
				radioModeCounter++;
				checkForRadioModeModeCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRadioModeModePromise.promise();
	}
}

function setFlexRadioMode() {
	/*  
		if AP - grab ap settings via API, then update the flex-dual-band
	*/
	var settingsList = {};
	radioModeCounter = 0;
	$.when(updateInventory(false)).then(function() {
		radioNotification = showProgressNotification('ca-router', 'Setting Radio Mode...', 'bottom', 'center', 'info');
		if (csvData.length == 0) showNotification('ca-router', 'No matching APs available', 'bottom', 'center', 'warning');
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var flexMode = this['FLEX DUAL BAND'];
				if (!flexMode || flexMode === '-') {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no Radio Mode in the CSV file');
					radioModeCounter++;
					checkForRadioModeCompletion();
				} else if ((flexMode != '5GHz-and-2.4GHz') && (flexMode != '5GHz-and-6GHz') && (flexMode != '2.4GHz-and-6GHz')) {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logError('Device with Serial Number: ' + currentSerial + ' has no supported mode in the CSV');
					apiErrorCount++;
					radioModeCounter++;
					checkForRadioModeCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						radioModeCounter++;
						checkForRadioModeCompletion();
					} else if (deviceType === 'IAP') {
						if (!device['model'].includes('615') && (!device['model'].includes('605'))) {
							logError('Device with Serial Number: ' + currentSerial + ' does not support Flex Dual Band configuration');
							apiErrorCount++;
							radioModeCounter++;
							checkForRadioModeCompletion();
						} else {
							settingsList[device.macaddr.toLowerCase()] = this;
							// if AP then get AP settings
							var settings = {
								url: getAPIURL() + '/tools/getCommandwHeaders',
								method: 'POST',
								timeout: 0,
								headers: {
									'Content-Type': 'application/json',
								},
								data: JSON.stringify({
									url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
								}),
							};
	
							$.ajax(settings).done(function(commandResults, statusText, xhr) {
								if (commandResults.hasOwnProperty('headers')) {
									updateAPILimits(JSON.parse(commandResults.headers));
								}
								if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
									logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
									apiErrorCount++;
									return;
								} else if (commandResults.hasOwnProperty('error_code')) {
									logError(commandResults.description);
									apiErrorCount++;
									return;
								}
								var response = JSON.parse(commandResults.responseBody);
	
								if (response.hasOwnProperty('error_code')) {
									logError(response.description);
									apiErrorCount++;
									radioModeCounter++;
									checkForRadioModeCompletion();
								} else {
									var apCLIResponse = response;
									
									// Pull in the new settings from the settingsList (ensures correct settings are used)
									var newSettingsKey = [apCLIResponse[0].replace('per-ap-settings ', '')];
									var newSettings = settingsList[newSettingsKey];
	
									var currentSerial = newSettings['SERIAL'].trim();
									var newFlexMode = newSettings['FLEX DUAL BAND'];
	
									// rebuild each line required for the radio config
									if (newFlexMode && newFlexMode !== '-') {
										// remove the old settings
										var commandLocation = -1;
										for (var i=0;i<apCLIResponse.length;i++) {
											if (apCLIResponse[i].includes('flex-dual-band')) commandLocation = i
										}
										if (commandLocation != -1) apCLIResponse.splice(commandLocation, 1);
	
										// add in the new config but only on supported AP models
										apCLIResponse.push('  flex-dual-band ' + newFlexMode);
									}
									//console.log(apCLIResponse);
									
									// Update ap settings
									var settings = {
										url: getAPIURL() + '/tools/postCommand',
										method: 'POST',
										timeout: 0,
										headers: {
											'Content-Type': 'application/json',
										},
										data: JSON.stringify({
											url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
											access_token: localStorage.getItem('access_token'),
											data: JSON.stringify({ clis: apCLIResponse }),
										}),
									};
	
									$.ajax(settings).done(function(response, statusText, xhr) {
										if (response.hasOwnProperty('status')) {
											if (response.status === '503') {
												apiErrorCount++;
												logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
											}
										}
										if (response !== currentSerial) {
											logError(currentSerial + ' was not assigned the new Radio Modes. Reason: ' + response.reason);
											//console.log(response.reason);
											apiErrorCount++;
										} else {
											logInformation(currentSerial + ' was assigned the '+ newFlexMode+ ' mode');
										}
										radioModeCounter++;
										checkForRadioModeCompletion();
									});
								}
							});
						}
					} else {
						// Either switch or controller/gateway
						radioModeCounter++;
						checkForRadioModeCompletion();
					}
				}
			} else {
				radioModeCounter++;
				checkForRadioModeModeCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRadioModeModePromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Antenna functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
// Build the list of AP models that support external antennas from the supplied CSV
function buildAntennaAPList() {
	select = document.getElementById('apSelector');
	if (select) select.options.length = 0;
	if ($('#apSelector')) {
		$('#apSelector').append($('<option>', { value: 'All', text: 'All External Antenna AP Models' }));
	}

	if (csvData.length == 0) {
		showNotification('ca-router', 'No external antenna APs available', 'bottom', 'center', 'warning');
		return;
	}
	var apModels = [];
	$.each(csvData, function() {
		var device = findDeviceInMonitoring(this['SERIAL']);
		if (deviceType === 'IAP' && device['model'] && (device['model'].match(/^..4.*$/gi) || device['model'].match(/^..8.*$/gi))) {
			if (!apModels.includes(device['model'])) apModels.push(device['model']);
		}
	});

	if ($('#apSelector')) {
		apModels.sort((a, b) => {
			const apA = a.toUpperCase(); // ignore upper and lowercase
			const apB = b.toUpperCase(); // ignore upper and lowercase
			// Sort on Group name
			if (apA < apB) {
				return -1;
			}
			if (apA > apB) {
				return 1;
			}
			return 0;
		});
		$.each(apModels, function() {
			// Add group to the dropdown selector
			$('#apSelector').append($('<option>', { value: this.toString(), text: this.toString() }));
			if ($('#apSelector').length != 0) {
				$('#apSelector').selectpicker('refresh');
			}
		});
	}
}

// Load up the supported Antennas
function loadAntennas() {
	document.getElementById('antennaGain0').value = 0;
	document.getElementById('antennaGain1').value = 0;
	select = document.getElementById('antennaSelector');
	if (select) select.options.length = 0;
	var antennaKeys = Object.keys(antennas);
	$('#antennaSelector').append($('<option>', { value: '', text: 'Indoor', style: 'font-weight: bold; color: #cccccc;', disabled: true }));
	$.each(antennaKeys, function() {
		if (antennas[this]['type'] === "Indoor") $('#antennaSelector').append($('<option>', { value: this, text: this + " ("+antennas[this]['description']+")" }));
	});
	$('#antennaSelector').append($('<option>', { value: '', text: '───────────────────────────', style: 'color: #cccccc;', disabled: true }));
	$('#antennaSelector').append($('<option>', { value: '', text: 'Indoor/Outdoor', style: 'font-weight: bold; color: #cccccc;', disabled: true }));
	$.each(antennaKeys, function() {
		if (antennas[this]['type'] === "Indoor/Outdoor") $('#antennaSelector').append($('<option>', { value: this, text: this + " ("+antennas[this]['description']+")" }));
	});
	$('#antennaSelector').append($('<option>', { value: '', text: '───────────────────────────', style: 'color: #cccccc;', disabled: true }));
	$('#antennaSelector').append($('<option>', { value: '', text: 'Outdoor', style: 'font-weight: bold; color: #cccccc;', disabled: true }));
	$.each(antennaKeys, function() {
		if (antennas[this]['type'] === "Outdoor") $('#antennaSelector').append($('<option>', { value: this, text: this + " ("+antennas[this]['description']+")" }));
	});
	$('#antennaSelector').selectpicker('refresh');
}

// Update the UI with selected antenna gain values
function antennaSelected() {
	var selectedAntenna = antennas[document.getElementById('antennaSelector').value];
	if (selectedAntenna.five) document.getElementById('antennaGain0').value = selectedAntenna.five;
	if (selectedAntenna.two) document.getElementById('antennaGain1').value = selectedAntenna.two;
	//if (selectedAntenna.six) document.getElementById('antennaGain2').value = selectedAntenna.six;
}

function applyAntennaGains() {
	apiErrorCount = 0;
	// CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var antenna0Key = 'RADIO 0 GAIN';
	var antenna1Key = 'RADIO 1 GAIN';
	var antenna2Key = 'RADIO 2 GAIN';

	var csvDataBuild = [];

	var selectedAPModel = document.getElementById('apSelector').value;

	// For each row in the supplied device CSV
	// Rebuild the CSV only having selected APs and set antenna gains
	$.each(csvData, function() {
		var device = findDeviceInMonitoring(this['SERIAL']);
		if (device['model'].match(/^..4.*$/gi) || device['model'].match(/^..8.*$/gi)) {
			if (selectedAPModel === device['model'] || selectedAPModel === 'All') csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [antenna0Key]: document.getElementById('antennaGain0').value, [antenna1Key]: document.getElementById('antennaGain1').value });
		}
	});

	csvData = csvDataBuild;
	setAntennaGain();
}

function checkForAntennaCompletion(antennaChange) {
	var antennaProgress = (antennaCounter / csvData.length) * 100;
	antennaNotification.update({ progress: antennaProgress });

	if (antennaCounter >= csvData.length) {
		if ($('#AntennaConfigModal')) $('#AntennaConfigModal').modal('hide');
		if (antennaNotification) antennaNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Antenna Configuration Failure',
					text: 'Some or all devices failed to be set to the correct antenna configurations. Please reboot any successful APs for change to take effect.',
					icon: 'error',
				});
			} else {
				if (antennaChange === ConfigType.Width) {
					Swal.fire({
						title: 'Antenna Configuration Success',
						text: 'All devices were set to the correct antenna configurations',
						icon: 'success'
					});
				} else {
					Swal.fire({
						title: 'Antenna Configuration Success',
						text: 'All devices were set to the correct antenna configurations. Please reboot APs for change to take effect.',
						icon: 'success',
						showCancelButton: true,
						cancelButtonColor: '#d33',
						cancelButtonText: "I'll reboot later",
						confirmButtonColor: '#3085d6',
						confirmButtonText: 'Reboot them!',
					}).then(result => {
						if (result.isConfirmed) {
							// Need to confirm config has made it to each AP
							confirmEnvConfigSync(antennaChange, true);
							//setTimeout(rebootDevices, 5000);
						}
					});
				}
			}
		}
	}
}

function setAntennaGain() {
	/*  
		if AP - grab ap settings via API, then update the antenna gain values
	*/
	var settingsList = {};
	antennaCounter = 0;
	$.when(updateInventory(false)).then(function() {
		antennaNotification = showProgressNotification('ca-antenna', 'Setting Antenna Gains...', 'bottom', 'center', 'info');
		if (csvData.length == 0) antennaNotification.update({ message: 'No external antenna APs available', type: 'warning' });
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();

				// Determine Radio 0 gain
				var newRadio0Gain = this['RADIO 0 GAIN'];

				// Determine Radio 1 gain
				var newRadio1Gain = this['RADIO 1 GAIN'];

				if ((!newRadio0Gain || newRadio0Gain === '-') && (!newRadio1Gain || newRadio1Gain === '-')) {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no antenna gain in the CSV file');
					antennaCounter++;
					checkForAntennaCompletion(ConfigType.Antenna);
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						antennaCounter++;
						checkForAntennaCompletion(ConfigType.Antenna);
					} else if (deviceType === 'IAP') {
						settingsList[device.macaddr.toLowerCase()] = this;
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								antennaCounter++;
								checkForAntennaCompletion(ConfigType.Antenna);
							} else {
								var apCLIResponse = response;
								// Pull in the new settings from the settingsList (ensures correct settings are used)
								var newSettingsKey = [apCLIResponse[0].replace('per-ap-settings ', '')];
								var newSettings = settingsList[newSettingsKey];

								var currentSerial = newSettings['SERIAL'].trim();
								var newRadio0Gain = newSettings['RADIO 0 GAIN'];
								var newRadio1Gain = newSettings['RADIO 1 GAIN'];

								// rebuild each line required for the radio config
								var gAntenna = -1;
								var aAntenna = -1;
								// Radio 0
								if (newRadio0Gain && newRadio0Gain !== '-') {
									// remove the old settings
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('a-external-antenna')) aAntenna = i;
									}
									if (aAntenna != -1) apCLIResponse.splice(aAntenna, 1);

									// add in the new config but only on supported AP models
									var newRadioGain = newRadio0Gain.trim();
									apCLIResponse.push('  a-external-antenna ' + newRadioGain);
								}

								// Radio 1
								if (newRadio1Gain && newRadio1Gain !== '-') {
									// remove the old settings
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('g-external-antenna')) gAntenna = i;
									}
									if (gAntenna != -1) apCLIResponse.splice(gAntenna, 1);

									// add in the new config but only on supported AP models
									var newRadioGain = newRadio1Gain.trim();
									apCLIResponse.push('  g-external-antenna ' + newRadioGain);
								}

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};

								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the new Antenna gain values. Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned the new Antenna gain values');
									}
									antennaCounter++;
									checkForAntennaCompletion(ConfigType.Antenna);
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						antennaCounter++;
						checkForAntennaCompletion(ConfigType.Antenna);
					}
				}
			} else {
				antennaCounter++;
				checkForAntennaCompletion(ConfigType.Antenna);
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoAntennaPromise.promise();
	}
}

function testAntennaGain() {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	var siteAPs = getAPsForSite(selectedSite);
	$('#ap-antenna-table')
		.DataTable()
		.rows()
		.remove();

	antennaNotification = showProgressNotification('ca-antenna', 'Checking APs at ' + selectedSite + '...', 'bottom', 'center', 'info');
	antennaCounter = 0;
	needAntennaConfig = [];
	var externalAPs = 0;
	$.each(siteAPs, function() {
		var currentSerial = this['serial'];
		// If external antenna model
		if (this['model'].match(/^..4.*$/gi) || this['model'].match(/^..8.*$/gi)) {
			externalAPs++;
			// Get current config for AP
			var settings = {
				url: getAPIURL() + '/tools/getCommandwHeaders',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
					access_token: localStorage.getItem('access_token'),
				}),
			};

			$.ajax(settings).done(function(commandResults, statusText, xhr) {
				if (commandResults.hasOwnProperty('headers')) {
					updateAPILimits(JSON.parse(commandResults.headers));
				}
				if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
					logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
					apiErrorCount++;
					return;
				} else if (commandResults.hasOwnProperty('error_code')) {
					logError(commandResults.description);
					apiErrorCount++;
					return;
				}
				var response = JSON.parse(commandResults.responseBody);

				if (response.hasOwnProperty('error_code')) {
					logError(response.description);
					apiErrorCount++;
					antennaCounter++;
					checkForAntennaTestCompletion();
				} else {
					var apCLIResponse = response;
					var twoGain = '0';
					var fiveGain = '0';

					// Pull out antenna gain values
					for (i = 0; i < apCLIResponse.length; i++) {
						if (apCLIResponse[i].includes('g-external-antenna')) {
							twoGain = apCLIResponse[i].replace('g-external-antenna', '').trim();
						}
						if (apCLIResponse[i].includes('a-external-antenna')) {
							fiveGain = apCLIResponse[i].replace('a-external-antenna', '').trim();
						}
					}
					var needConfig = false;
					if (twoGain === '0') {
						twoGain = '<span class=text-danger>' + twoGain + 'dBi</span>';
						needConfig = true;
					} else twoGain += 'dBi';
					if (fiveGain === '0') {
						fiveGain = '<span class=text-danger>' + fiveGain + 'dBi</span>';
						needConfig = true;
					} else fiveGain += 'dBi';

					// Get AP info from Monitoring
					var ap = findDeviceInMonitoringForMAC(apCLIResponse[0].replace('per-ap-settings ', ''));
					if (needConfig) {
						needAntennaConfig.push(ap);
						if (document.querySelector('#missingAntennaGainBtn')) document.querySelector('#missingAntennaGainBtn').disabled = false;
					}

					// add to table
					var table = $('#ap-antenna-table').DataTable();

					var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
					var status = '<i class="fa-solid fa-circle text-danger"></i>';
					if (ap['status'] == 'Up') {
						status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
					}
					var ip_address = ap['ip_address'];
					if (!ip_address) ip_address = '';

					// Make AP Name as a link to Central
					var name = encodeURI(ap['name']);
					var apiURL = localStorage.getItem('base_url');
					var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';

					table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], ip_address, ap['model'], ap['serial'], ap['site'], ap['group_name'], ap['macaddr'], twoGain, fiveGain]);

					// Force reload of table data
					$('#ap-antenna-table')
						.DataTable()
						.rows()
						.draw();

					antennaCounter++;
					var antennaProgress = (antennaCounter / siteAPs.length) * 100;
					antennaNotification.update({ progress: antennaProgress });
					if (antennaCounter >= siteAPs.length && antennaNotification) antennaNotification.close();
				}
			});

			$('[data-toggle="tooltip"]').tooltip();
		} else {
			antennaCounter++;
			var antennaProgress = (antennaCounter / siteAPs.length) * 100;
			antennaNotification.update({ progress: antennaProgress });
			if (antennaCounter >= siteAPs.length && antennaNotification) antennaNotification.close();
		}
	});
	if (externalAPs != 0) {
		$('#APAntennaConfigModalLink').trigger('click');
	} else {
		antennaNotification.update({ type: 'danger', message: 'No external antenna APs found at ' + selectedSite });
	}
}

function addMissingAntennaGain() {
	if ($('#APAntennaConfigModal')) $('#APAntennaConfigModal').modal('hide');
	// Build csvData with APs from needAntennaConfig
	var serialKey = 'SERIAL';
	var macKey = 'MAC';

	var csvDataBuild = [];

	// For each of the APs needing to be rebooted (stored in 'devicesToReboot')
	// Rebuild the CSV only having selected APs
	$.each(needAntennaConfig, function() {
		csvDataBuild.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'] });
	});

	csvData = csvDataBuild;

	buildAntennaAPList();
	loadAntennas();
	currentWorkflow = '';
	$('#AntennaConfigModalLink').trigger('click');
}

function updateAntennaWidth() {
	apiErrorCount = 0;
	// CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var antennaWidthKey = 'ANTENNA WIDTH';

	var csvDataBuild = [];
	
	// For each row in the supplied device CSV
	// Rebuild the CSV only having selected APs and set antenna gains
	$.each(csvData, function() {
		var device = findDeviceInMonitoring(this['SERIAL']);
		if (device['model'].match(/^679.*$/gi)) {
			var newAntennaWidth = this['ANTENNA WIDTH'];
			if ((newAntennaWidth || newAntennaWidth !== '-')) {
				csvDataBuild.push({ [serialKey]: device['serial'], [macKey]: device['macaddr'], [antennaWidthKey]: newAntennaWidth });
			}
		}
	});

	csvData = csvDataBuild;
	setAntennaWidth();
}

function setAntennaWidth() {
	/*  
		if AP - grab ap settings via API, then update the antenna gain values
	*/
	antennaCounter = 0;
	$.when(updateInventory(false)).then(function() {
		antennaNotification = showProgressNotification('ca-antenna-width', 'Setting Antenna Width...', 'bottom', 'center', 'info');
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				
				// Determine antenna width
				var newAntennaWidth = this['ANTENNA WIDTH'];

				if ((!newAntennaWidth || newAntennaWidth === '-')) {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no antenna width in the CSV file');
					antennaCounter++;
					checkForAntennaCompletion(ConfigType.Width);
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						antennaCounter++;
						checkForAntennaCompletion(ConfigType.Width);
					} else if (deviceType === 'IAP') {
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								antennaCounter++;
								checkForAntennaCompletion(ConfigType.Width);
							} else {
								var apCLIResponse = response;
								
								// remove old installation type if there
								var foundType = -1;
								for (i = 0; i < apCLIResponse.length; i++) {
									if (apCLIResponse[i].includes('dynamic-ant')) {
										foundType = i;
										break;
									}
								}
								if (foundType !== -1) apCLIResponse.splice(foundType, 1);
								
								// Add install type to the response if it is not "Automatic"
								newAntennaWidth = newAntennaWidth.toLowerCase();
								if (newAntennaWidth === 'narrow') apCLIResponse.push('  dynamic-ant ' + newAntennaWidth);

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};
								
								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the new antenna width. Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned the new antenna width');
									}
									antennaCounter++;
									checkForAntennaCompletion(ConfigType.Width);
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						antennaCounter++;
						checkForAntennaCompletion(ConfigType.Width);
					}
				}
			} else {
				antennaCounter++;
				checkForAntennaCompletion(ConfigType.Width);
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoAntennaPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		GPS functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForGPSCompletion() {
	var gpsProgress = (gpsCounter / csvData.length) * 100;
	gpsNotification.update({ progress: gpsProgress });

	if (gpsCounter == csvData.length) {
		if (gpsNotification) gpsNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'AP Altitude Configuration Failure',
					text: 'Some or all devices failed to have the altitude configured',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'AP Altitude Configuration Success',
					text: 'All APs altitudes were configured',
					icon: 'success',
				});
			}
		}
	}
}

function updateAPAltitude() {
	/*  
		if AP - grab ap config via API, then update the gps lines
	*/

	gpsCounter = 0;
	gpsNotification = showProgressNotification('ca-ap-altitude', 'Configuring AP altitudes...', 'bottom', 'center', 'info');
	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		var altitude = device['ALTITUDE'];
		if (device['SERIAL'] && altitude && altitude !== '' && altitude !== '-' && !isNaN(altitude)) {
			setTimeout(setAPAltitude, apiDelay * i, device['SERIAL'], altitude); // As to not go over the 7 calls/sec speed limit
		} else {
			gpsCounter++;
			checkForGPSCompletion();
		}
	}
}

function setAPAltitude(serial, altitude) {
	var currentSerial = serial.trim();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {	
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
	
		var apCLIResponse = response;
		// Check if gps command block exists in the config
		var gpsIndex = apCLIResponse.indexOf('gps')
		var altitudeIndex = -1;
		var postRequired = false;
		if (gpsIndex == -1) {
			apCLIResponse.push('gps');
			apCLIResponse.push('  ap-altitude '+ altitude);
			postRequired = true;
		} else {
			for (var i=gpsIndex+1; i < apCLIResponse.length; i++) {
				if (apCLIResponse[i].startsWith('  ')) {
					if (apCLIResponse[i].includes('ap-altitude')) {
						if (!apCLIResponse[i].includes(altitude)) {
							apCLIResponse[i] = '  ap-altitude '+ altitude;
							postRequired = true;
						}
						altitudeIndex = i;
						break;
					}
				} else if (!apCLIResponse[i].startsWith('  ')) {
					// No longer in the gps command block
					break;
				}
			}
			if (altitudeIndex == -1) {
				apCLIResponse.splice(gpsIndex+1, 0, '  ap-altitude '+ altitude);
				postRequired = true;
			}
			
		}
		console.log(apCLIResponse)
		console.log(postRequired)
		
		if (postRequired) {	
			// Update ap cli as the LED state is altered
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ clis: apCLIResponse }),
				}),
			};
		
			$.ajax(settings).done(function(response, statusText, xhr) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						apiErrorCount++;
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
					}
				}
				if (response !== currentSerial) {
					logError('Altitude for AP ' + currentSerial + ' was not correctly configured. Reason: ' + response.reason);
					//console.log(response.reason);
					apiErrorCount++;
				} else {
					logInformation('Altitude for AP ' + currentSerial + ' was configured');
				}
				gpsCounter++;
				checkForGPSCompletion();
			});
		} else {
			logInformation('Altitude for AP ' + currentSerial + ' was already configured correctly');
			gpsCounter++;
			checkForGPSCompletion();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		2.4GHz Radio functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForRadioCompletion() {
	var radioProgress = (radioCounter / csvData.length) * 100;
	radioNotification.update({ progress: radioProgress });

	if (radioCounter == csvData.length) {
		if (radioNotification) radioNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: '2.4GHz Radio Failure',
					text: 'Some or all devices failed to have the 2.4GHz radio configured',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: '2.4GHz Radio Success',
					text: 'All devices had the 2.4GHz radio configured',
					icon: 'success',
				});
			}
		}
	}
}

function disable24radios() {
	/*  
		if AP - grab AP settings via API, then disable the 2.4GHz radio
	*/

	radioCounter = 0;
	$.when(updateInventory(false)).then(function() {
		radioNotification = showProgressNotification('ca-wifi-off', 'Disabling 2.4GHz radios...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var device = findDeviceInInventory(currentSerial);
				if (!device) {
					logError('Unable to find device ' + currentSerial + ' in the device inventory');
					apiErrorCount++;
					radioCounter = radioCounter + 1;
					checkForRadioCompletion();
				} else if (deviceType === 'IAP') {
					// if AP then get AP settings
					var settings = {
						url: getAPIURL() + '/tools/getCommandwHeaders',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(commandResults, statusText, xhr) {
						if (commandResults.hasOwnProperty('headers')) {
							updateAPILimits(JSON.parse(commandResults.headers));
						}
						if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
							logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
							apiErrorCount++;
							return;
						} else if (commandResults.hasOwnProperty('error_code')) {
							logError(commandResults.description);
							apiErrorCount++;
							return;
						}
						var response = JSON.parse(commandResults.responseBody);

						//console.log(response);
						if (response.hasOwnProperty('error_code')) {
							logError(response.description);
							apiErrorCount++;
							radioCounter = radioCounter + 1;
							checkForRadioCompletion();
						} else if (response.dot11g_radio_disable) {
							// no need to do anything as the name already matches
							logInformation('Device ' + currentSerial + ' 2.4GHz radio is already disabled');
							radioCounter = radioCounter + 1;
							checkForRadioCompletion();
						} else {
							// Update ap settings
							var settings = {
								url: getAPIURL() + '/tools/postCommand',
								method: 'POST',
								timeout: 0,
								headers: {
									'Content-Type': 'application/json',
								},
								data: JSON.stringify({
									url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
									data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: true, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: response.hostname }),
								}),
							};

							$.ajax(settings).done(function(response, textStatus, jqXHR) {
								if (response.hasOwnProperty('status')) {
									if (response.status === '503') {
										apiErrorCount++;
										logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
									}
								}
								if (response !== currentSerial) {
									logError('2.4GHz radio on AP "' + currentSerial + '" was not disabled. Reason: ' + response.reason);
									//console.log(response.reason);
									apiErrorCount++;
								} else {
									logInformation('2.4GHz radio on AP "' + currentSerial + '" was disabled');
								}
								radioCounter = radioCounter + 1;
								checkForRadioCompletion();
							});
						}
					});
				} else {
					// Either switch or controller/gateway
					radioCounter = radioCounter + 1;
					checkForRadioCompletion();
				}
			} else {
				radioCounter = radioCounter + 1;
				checkForRadioCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRadioPromise.promise();
	}
}

function enable24radios() {
	/*  
		if AP - grab AP settings via API, then disable the 2.4GHz radio
	*/

	radioCounter = 0;
	$.when(updateInventory(false)).then(function() {
		radioNotification = showProgressNotification('ca-wifi', 'Enabling 2.4GHz radios...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var device = findDeviceInInventory(currentSerial);
				if (!device) {
					logError('Unable to find device ' + currentSerial + ' in the device inventory');
					apiErrorCount++;
					radioCounter = radioCounter + 1;
					checkForRadioCompletion();
				} else if (deviceType === 'IAP') {
					// if AP then get AP settings
					var settings = {
						url: getAPIURL() + '/tools/getCommandwHeaders',
						method: 'POST',
						timeout: 0,
						headers: {
							'Content-Type': 'application/json',
						},
						data: JSON.stringify({
							url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
							access_token: localStorage.getItem('access_token'),
						}),
					};

					$.ajax(settings).done(function(commandResults, statusText, xhr) {
						if (commandResults.hasOwnProperty('headers')) {
							updateAPILimits(JSON.parse(commandResults.headers));
						}
						if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
							logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
							apiErrorCount++;
							return;
						} else if (commandResults.hasOwnProperty('error_code')) {
							logError(commandResults.description);
							apiErrorCount++;
							return;
						}
						var response = JSON.parse(commandResults.responseBody);
						//console.log(response);
						if (response.hasOwnProperty('error_code')) {
							logError(response.description);
							apiErrorCount++;
							radioCounter = radioCounter + 1;
							checkForRadioCompletion();
						} else if (!response.dot11g_radio_disable) {
							// no need to do anything as the name already matches
							logInformation('Device ' + currentSerial + ' 2.4GHz radio is already enabled');
							radioCounter = radioCounter + 1;
							checkForRadioCompletion();
						} else {
							// Update ap settings
							var settings = {
								url: getAPIURL() + '/tools/postCommand',
								method: 'POST',
								timeout: 0,
								headers: {
									'Content-Type': 'application/json',
								},
								data: JSON.stringify({
									url: localStorage.getItem('base_url') + '/configuration/v2/ap_settings/' + currentSerial,
									access_token: localStorage.getItem('access_token'),
									data: JSON.stringify({ achannel: response.achannel, atxpower: response.atxpower, dot11a_radio_disable: response.dot11a_radio_disable, dot11g_radio_disable: false, gchannel: response.gchannel, gtxpower: response.gtxpower, ip_address: response.ip_address, usb_port_disable: response.usb_port_disable, zonename: response.zonename, hostname: response.hostname }),
								}),
							};

							$.ajax(settings).done(function(response, textStatus, jqXHR) {
								if (response.hasOwnProperty('status')) {
									if (response.status === '503') {
										apiErrorCount++;
										logError('Central Server Error (503): ' + response.reason + ' (/configuration/v2/ap_settings/<SERIAL>)');
									}
								}
								if (response !== currentSerial) {
									logError('2.4GHz radio on AP "' + currentSerial + '" was not enabled. Reason: ' + response.reason);
									//console.log(response.reason);
									apiErrorCount++;
								} else {
									logInformation('2.4GHz radio on AP "' + currentSerial + '" was enabled');
								}
								radioCounter = radioCounter + 1;
								checkForRadioCompletion();
							});
						}
					});
				} else {
					// Either switch or controller/gateway
					radioCounter = radioCounter + 1;
					checkForRadioCompletion();
				}
			} else {
				radioCounter = radioCounter + 1;
				checkForRadioCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoRadioPromise.promise();
	}
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Indoor / Outdoor functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForInstallationCompletion() {
	var installProgress = (installCounter / csvData.length) * 100;
	installNotification.update({ progress: installProgress });

	if (installCounter == csvData.length) {
		if (installNotification) installNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'AP Installation Type Configuration Failure',
					text: 'Some or all devices failed to be set to the correct installation type',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'AP Installation Type Configuration Success',
					text: 'All devices were set to the correct installation type',
					icon: 'success',
				});
			}

			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'AP Installation Type Failure',
					text: 'Some or all devices failed to be set to the correct installation type. Please reboot any successful APs for change to take effect.',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'AP Installation Type Success',
					text: 'All devices were set to the correct antenna gains. Please reboot APs for change to take effect.',
					icon: 'success',
					showCancelButton: true,
					cancelButtonColor: '#d33',
					cancelButtonText: "I'll reboot later",
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Reboot them!',
				}).then(result => {
					if (result.isConfirmed) {
						// Need to confirm config has made it to each AP
						//confirmEnvConfigSync(ConfigType.Antenna, true);
						setTimeout(rebootDevices, 5000);
					}
				});
			}
		}
	}
}

function setInstallationType() {
	/*  
		if AP - grab ap settings via API, then update the ap-installation
	*/

	installCounter = 0;
	$.when(updateInventory(false)).then(function() {
		installNotification = showProgressNotification('ca-globe', 'Setting Installation Type...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var newInstallType = this['INSTALLATION TYPE'].trim();
				if (!newInstallType || newInstallType === '-') {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no installation type in the CSV file');
					installCounter++;
					checkForInstallationCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						installCounter++;
						checkForInstallationCompletion();
					} else if (deviceType === 'IAP') {
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								installCounter++;
								checkForInstallationCompletion();
							} else {
								var apCLIResponse = response;

								// remove old installation type if there
								var foundType = -1;
								for (i = 0; i < apCLIResponse.length; i++) {
									if (apCLIResponse[i].includes('ap-installation')) {
										foundType = i;
										break;
									}
								}
								if (foundType !== -1) apCLIResponse.splice(foundType, 1);

								// Add install type to the response if it is not "Automatic"
								newInstallType = newInstallType.toLowerCase();
								if (!newInstallType.includes('default')) apCLIResponse.push('  ap-installation ' + newInstallType);

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};

								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the installation type "' + newInstallType + '". Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned the installation type "' + newInstallType + '"');
									}
									installCounter++;
									checkForInstallationCompletion();
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						installCounter++;
						checkForInstallationCompletion();
					}
				}
			} else {
				installCounter++;
				checkForInstallationCompletion();
			}
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		LED functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForLEDCompletion() {
	var ledProgress = (ledCounter / csvData.length) * 100;
	ledNotification.update({ progress: ledProgress });

	if (ledCounter == csvData.length) {
		if (ledNotification) ledNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'AP LED Configuration Failure',
					text: 'Some or all devices failed to have the LEDs configured',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'AP LED Configuration Success',
					text: 'All devices LEDs were configured',
					icon: 'success',
				});
			}
		}
	}
}

function setLEDOff() {
	/*  
		if AP - grab ap config via API, then update the led-off line
	*/
	ledCounter = 0;
	ledNotification = showProgressNotification('ca-bulb-61', 'Turning Off LEDs...', 'bottom', 'center', 'info');
	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		if (device['SERIAL']) setTimeout(setLEDState, apiDelay * i, device['SERIAL'], false); // As to not go over the 7 calls/sec speed limit
	}
}

function setLEDOn() {
	/*  
		if AP - grab ap config via API, then update the led-off line
	*/

	ledCounter = 0;
	ledNotification = showProgressNotification('ca-bulb-63', 'Turning On LEDs...', 'bottom', 'center', 'info');
	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		if (device['SERIAL']) setTimeout(setLEDState, apiDelay * i, device['SERIAL'], true); // As to not go over the 7 calls/sec speed limit
	}
}

function setLEDState(serial, ledState) {
	var currentSerial = serial.trim();
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {	
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
	
		var apCLIResponse = response;
		// Check if led-off command exists in the config
		var ledIndex = apCLIResponse.indexOf('led-off')
		var postRequired = false;
		if (ledState) {
			if (ledIndex != -1) {
				// LED is currently disabled - need to turn on
				apCLIResponse.splice(ledIndex,1);
				postRequired = true;
			}
		} else {
			if (ledIndex == -1) {
				// LED is currently enabled - need to turn off
				apCLIResponse.push('led-off');
				postRequired = true;
			}
		}
		
		if (postRequired) {	
			// Update ap cli as the LED state is altered
			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/configuration/v1/ap_cli/' + currentSerial,
					access_token: localStorage.getItem('access_token'),
					data: JSON.stringify({ clis: apCLIResponse }),
				}),
			};
		
			$.ajax(settings).done(function(response, statusText, xhr) {
				if (response.hasOwnProperty('status')) {
					if (response.status === '503') {
						apiErrorCount++;
						logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_cli/<SERIAL>)');
					}
				}
				if (response !== currentSerial) {
					logError('LED Mode on ' + currentSerial + ' was not correctly configured. Reason: ' + response.reason);
					//console.log(response.reason);
					apiErrorCount++;
				} else {
					if (ledState) logInformation('LED Mode on ' + currentSerial + ' was enabled');
					else logInformation('LED Mode on ' + currentSerial + ' was disabled');
				}
				ledCounter++;
				checkForLEDCompletion();
			});
		} else {
			logInformation('LED Mode on ' + currentSerial + ' was already configured correctly');
			ledCounter++;
			checkForLEDCompletion();
		}
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Country Code functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function updateCountryCodes() {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	$.when(configureSite(selectedSite)).then(function() {
		checkSiteUpdateDone();
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
		Automated Tasks functions
	------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function updateAutomationProgress() {
	automationCounter++;
	var progress = automationCounter/automationTotal*100
	automationNotification.update({ progress: progress });
	if (progress >= 100) automationNotification.close();
	
}

function addAndLicense() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-digital-key', 'Adding Devices and Licensing...', 'bottom', 'center', 'info');
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added & licensed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added & licensed',
					icon: 'success',
				});
			}
		});
	});
}

function addAndGroup() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-folder-add', 'Adding Devices and Pre-provisioning into Groups...', 'bottom', 'center', 'info');
	
	autoAddPromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now move devices
		$.when(preprovisionDevicesToGroup()).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be added, and pre-provisioned into a group',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were added and pre-provisioned into a group',
					icon: 'success',
				});
			}
			if (manualGroup) {
				manualGroup = '';
				var mgd = document.getElementById('manualGroupDiv');
				mgd.style.display = 'none';
			}
		});
	});
}

function addLicenseGroup() {
	automationTotal = 3;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-decentralize', 'Adding Devices, licensing and Pre-provisioning into Groups...', 'bottom', 'center', 'info');
	
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			updateAutomationProgress();
			// licensing completed  - now move devices
			$.when(preprovisionDevicesToGroup()).then(function() {
				updateAutomationProgress();
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: 'Some or all devices failed to be added, licensed and moved into a group',
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were added, licensed and moved into a group',
						icon: 'success',
					});
				}
				if (manualGroup) {
					manualGroup = '';
					var mgd = document.getElementById('manualGroupDiv');
					mgd.style.display = 'none';
				}
			});
		});
	});
}

function addLicenseGroupSite() {
	automationTotal = 4;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-decentralize', 'Adding, licensing, Pre-provisioning, and assigning sites...', 'bottom', 'center', 'info');
	
	autoAddPromise = new $.Deferred();
	autoLicensePromise = new $.Deferred();
	autoGroupPromise = new $.Deferred();
	autoSitePromise = new $.Deferred();
	$.when(addDevices()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		$.when(licenseDevices()).then(function() {
			updateAutomationProgress();
			// licensing completed  - now move devices
			$.when(preprovisionDevicesToGroup()).then(function() {
				updateAutomationProgress();
				// pre-provisioning complete - now assign sites (after updating the device inventory)
				$.when(moveDevicesToSite()).then(function() {
					updateAutomationProgress();
					if (apiErrorCount != 0) {
						showLog();
						Swal.fire({
							title: 'Automation Failure',
							text: 'Some or all devices failed to be added, licensed and pre-provisioned into a group and assigned to sites',
							icon: 'error',
						});
					} else {
						Swal.fire({
							title: 'Automation Success',
							text: 'All devices were added, licensed and pre-provisioned into a group and assigned to sites',
							icon: 'success',
						});
					}
					if (manualGroup) {
						manualGroup = '';
						var mgd = document.getElementById('manualGroupDiv');
						mgd.style.display = 'none';
					}
				});
			});
		});
	});
}

function siteAndRename() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-pin-sync', 'Assigning sites and renaming devices...', 'bottom', 'center', 'info');
	
	autoSitePromise = new $.Deferred();
	autoRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		$.when(renameDevices()).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRename() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-artificial-intelligence', 'Assigning sites and renaming devices...', 'bottom', 'center', 'info');
	
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: 'Some or all devices failed to be assigned to a site and renamed',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were assigned to a site and renamed',
					icon: 'success',
				});
			}
		});
	});
}

function renameAndPortDescriptions() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-algorithm', 'Renaming APs and Updating Port Descriptions...', 'bottom', 'center', 'info');
	
	autoRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(renameDevices()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		$.when(updatePortDescription()).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: "Some or all devices failed to be renamed and/or port descriptions didn't update",
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were renamed and port descriptions updated',
					icon: 'success',
				});
			}
		});
	});
}

function autoRenameAndPortDescriptions() {
	automationTotal = 2;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-artificial-brain', 'Renaming APs and Updating Port Descriptions...', 'bottom', 'center', 'info');
	
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	//  need the   auto  magical renaming  based  on  site name
	$.when(magicRenameDevices()).then(function() {
		updateAutomationProgress();
		// update port descriptions with magic AP Name
		$.when(updatePortDescription('magic')).then(function() {
			updateAutomationProgress();
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Automation Failure',
					text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Automation Success',
					text: 'All devices were moved to site, renamed and port descriptions updated',
					icon: 'success',
				});
			}
		});
	});
}

function siteAndAutoRenameAndPortDescriptions() {
	automationTotal = 3;
	automationCounter = 0;
	automationNotification = showProgressNotification('ca-artificial-brain', 'Moving To Site + Renaming APs + Updating Port Descriptions...', 'bottom', 'center', 'info');
	
	autoSitePromise = new $.Deferred();
	autoMagicRenamePromise = new $.Deferred();
	autoPortPromise = new $.Deferred();
	$.when(moveDevicesToSite()).then(function() {
		updateAutomationProgress();
		// Add devices completed  - now license devices
		//  need the   auto  magical renaming  based  on  site name
		$.when(magicRenameDevices()).then(function() {
			updateAutomationProgress();
			// update port descriptions with magic AP Name
			$.when(updatePortDescription('magic')).then(function() {
				updateAutomationProgress();
				if (apiErrorCount != 0) {
					showLog();
					Swal.fire({
						title: 'Automation Failure',
						text: "Some or all devices failed to be move to site, renamed and/or port descriptions didn't update",
						icon: 'error',
					});
				} else {
					Swal.fire({
						title: 'Automation Success',
						text: 'All devices were moved to site, renamed and port descriptions updated',
						icon: 'success',
					});
				}
			});
		});
	});
}

/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Automated Tasks functions - using "ap_settings_cli"
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function checkForNameAndRadioModeCompletion() {
	if (radioModeCounter == csvData.length) {
		if (apiErrorCount != 0) {
			showLog();
			Swal.fire({
				title: 'Automation Configuration Failure',
				text: 'Some or all devices failed to be set to the correct Hostname and Radio Modes',
				icon: 'error',
			});
		} else {
			Swal.fire({
				title: 'Automation Configuration Success',
				text: 'All devices were set to the correct Hostanme and Radio Modes',
				icon: 'success',
			});
		}
	}
}

function renameAndRadioMode() {
	/*  
		if AP - grab ap settings via API, then update the wifi0-mode, wifi1-mode, wifi2-mode, + hostname
		Modified version of setRadioMode function (includes Hostname changes)
	*/
	var settingsList = {};
	radioModeCounter = 0;
	$.when(updateInventory(false)).then(function() {
		showNotification('ca-contactless-card', 'Setting Hostname and Radio Mode...', 'bottom', 'center', 'info');

		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();
				var newAPHostname = this['DEVICE NAME'].trim();
				var newRadio0Mode = this['RADIO 0 MODE'];
				var newRadio1Mode = this['RADIO 1 MODE'];
				var newRadio2Mode = this['RADIO 2 MODE'];
				var dualRadioMode = this['DUAL 5GHZ MODE'];
				var splitRadioMode = this['SPLIT 5GHZ MODE'];
				if ((!newRadio0Mode || newRadio0Mode === '-') && (!newRadio1Mode || newRadio1Mode === '-') && (!newRadio2Mode || newRadio2Mode === '-') && (!newAPHostname || newAPHostname === '-')) {
					// "-" zone comes from the downloaded CSV from Central - equals to no configured zone.
					logInformation('Device with Serial Number: ' + currentSerial + ' has no Hostname AND Radio Mode in the CSV file');
					radioModeCounter++;
					checkForNameAndRadioModeCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						radioModeCounter++;
						checkForNameAndRadioModeCompletion();
					} else if (deviceType === 'IAP') {
						settingsList[device.macaddr.toLowerCase()] = this;
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								radioModeCounter++;
								checkForNameAndRadioModeCompletion();
							} else {
								var apCLIResponse = response;
								// Pull in the new settings from the settingsList (ensures correct settings are used)
								var newSettingsKey = [apCLIResponse[0].replace('per-ap-settings ', '')];
								var newSettings = settingsList[newSettingsKey];

								var currentSerial = newSettings['SERIAL'].trim();
								var newAPHostname = newSettings['DEVICE NAME'].trim();
								var newRadio0Mode = newSettings['RADIO 0 MODE'];
								var newRadio1Mode = newSettings['RADIO 1 MODE'];
								var newRadio2Mode = newSettings['RADIO 2 MODE'];
								var dualRadioMode = newSettings['DUAL 5GHZ MODE'];
								var splitRadioMode = newSettings['SPLIT 5GHZ MODE'];

								// rebuild each line required for the radio config
								var wifi0mode = -1;
								var wifi1mode = -1;
								var wifi2mode = -1;
								// Radio 0
								if (newRadio0Mode && newRadio0Mode !== '-') {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-0-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-0-disable'), 1);
									if (apCLIResponse.indexOf('  dot11a-radio-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dot11a-radio-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi0-mode')) wifi0mode = i;
									}
									if (wifi0mode != -1) apCLIResponse.splice(wifi0mode, 1);

									// add in the new config but only on supported AP models
									var newRadioMode = newRadio0Mode.trim().toLowerCase();
									if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
										apCLIResponse.push('  wifi0-mode ' + newRadioMode);
									} else if (newRadioMode === 'off') {
										if (device.model.includes('635') || device.model.includes('655')) apCLIResponse.push('  radio-0-disable');
										else apCLIResponse.push('  dot11a-radio-disable');
									}
								}

								// Radio 1
								if (newRadio1Mode && newRadio1Mode !== '-') {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-1-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-1-disable'), 1);
									if (apCLIResponse.indexOf('  dot11g-radio-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dot11g-radio-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi1-mode')) wifi1mode = i;
									}
									if (wifi1mode != -1) apCLIResponse.splice(wifi1mode, 1);

									// add in the new config but only on supported AP models
									var newRadioMode = newRadio1Mode.trim().toLowerCase();
									if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
										apCLIResponse.push('  wifi1-mode ' + newRadioMode);
									} else if (newRadioMode === 'off') {
										if (device.model.includes('635') || device.model.includes('655')) apCLIResponse.push('  radio-1-disable');
										else apCLIResponse.push('  dot11g-radio-disable');
									}
								}

								// Radio 2
								if (newRadio2Mode && newRadio2Mode !== '-') {
									// remove the old settings
									if (apCLIResponse.indexOf('  radio-2-disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  radio-2-disable'), 1);
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('wifi2-mode')) wifi2mode = i;
									}
									if (wifi2mode != -1) apCLIResponse.splice(wifi2mode, 1);

									// add in the new config but only on supported AP models
									var split555 = false;
									if (splitRadioMode && splitRadioMode !== '-') {
										var newRadioMode = splitRadioMode.trim().toLowerCase();
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled' || newRadioMode === 'enable') split555 = true;
									}
									if (device.model.includes('635') || device.model.includes('655') || split555) {
										var newRadioMode = newRadio2Mode.trim().toLowerCase();
										if (newRadioMode === 'access' || newRadioMode === 'monitor' || newRadioMode === 'spectrum') {
											apCLIResponse.push('  wifi2-mode ' + newRadioMode);
										} else if (newRadioMode === 'off') {
											apCLIResponse.push('  radio-2-disable');
										}
									}
								}

								// Dual 5GHz Mode
								if (dualRadioMode && dualRadioMode !== '-') {
									// remove the old settings
									if (apCLIResponse.indexOf('  dual-5GHz-mode disable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dual-5GHz-mode disable'), 1);
									if (apCLIResponse.indexOf('  dual-5GHz-mode enable') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  dual-5GHz-mode enable'), 1);

									// add in the new config but only on supported AP models
									if (device.model.includes('344') || device.model.includes('345')) {
										var newRadioMode = dualRadioMode.trim().toLowerCase();
										// Standardize inputs for correct setting
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled') newRadioMode = 'enable';
										if (newRadioMode === 'false' || newRadioMode === 'no' || newRadioMode === 'n' || newRadioMode === 'disabled') newRadioMode = 'disable';
										if (newRadioMode === 'enable' || newRadioMode === 'disable') {
											apCLIResponse.push('  dual-5GHz-mode ' + newRadioMode);
										}
									}
								}

								// Split 5GHz Mode on 555
								if (splitRadioMode && splitRadioMode !== '-') {
									// remove the old settings
									if (apCLIResponse.indexOf('  split-5ghz-mode enabled') != -1) apCLIResponse.splice(apCLIResponse.indexOf('  split-5ghz-mode enabled'), 1);

									// add in the new config but only on supported AP models
									if (device.model.includes('555')) {
										var newRadioMode = splitRadioMode.trim().toLowerCase();
										// Standardize inputs for correct setting
										if (newRadioMode === 'true' || newRadioMode === 'yes' || newRadioMode === 'y' || newRadioMode === 'enabled') newRadioMode = 'enable';
										if (newRadioMode === 'enable') {
											apCLIResponse.push('  split-5ghz-mode enabled');
										}
									}
								}

								// Hostname
								if (newAPHostname && newAPHostname !== '-') {
									// remove the old hostname
									var hostnameIndex = -1;
									for (i = 0; i < apCLIResponse.length; i++) {
										if (apCLIResponse[i].includes('hostname')) hostnameIndex = i;
									}
									if (hostnameIndex != -1) apCLIResponse.splice(hostnameIndex, 1);

									// add in the new config but only on supported AP models
									var newAPHostname = newAPHostname.trim();
									apCLIResponse.push('  hostname ' + newAPHostname);
								}
								//console.log(apCLIResponse);

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};

								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the new Hostname and Radio Modes. Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										logInformation(currentSerial + ' was assigned the new Hostname and Radio Modes ');
									}
									radioModeCounter++;
									checkForNameAndRadioModeCompletion();
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						radioModeCounter++;
						checkForNameAndRadioModeCompletion();
					}
				}
			} else {
				radioModeCounter++;
				checkForNameAndRadioModeCompletion();
			}
		});
	});
}



/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
						Site Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function getSwitchType(serial) {
	var currentSwitch = null;
	$.each(switches, function() {
		if (this['serial'] === serial) {
			currentSwitch = this;
			return false;
		}
	});
	if (currentSwitch['model'].includes('60') || currentSwitch['model'].includes('61') || currentSwitch['model'].includes('62') || currentSwitch['model'].includes('63') || currentSwitch['model'].includes('64') || currentSwitch['model'].includes('83') || currentSwitch['model'].includes('84')) {
		return 'AOS-CX';
	} else {
		return 'AOS-S';
	}
}

function getSwitchPortDetails(serial) {
	var currentSwitch = findDeviceInMonitoring(serial);
	var searchVariable = serial;
	
	// Assume AOS-S standalone switch
	var url = '/monitoring/v1/switches/';
	if (getSwitchType(serial) === 'AOS-S' && currentSwitch.stack_id) {
		url = '/monitoring/v1/switch_stacks/';
		searchVariable = currentSwitch.stack_id;
	}
	
	// Check if switch is a CX switch
	if (getSwitchType(serial) === 'AOS-CX' && !currentSwitch.stack_id) url = '/monitoring/v1/cx_switches/';
	else if (getSwitchType(serial) === 'AOS-CX' && currentSwitch.stack_id) {
		url = '/monitoring/v1/cx_switch_stacks/';
		searchVariable = currentSwitch.stack_id;
	}
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + url + searchVariable + '/ports',
			access_token: localStorage.getItem('access_token'),
		}),
	};

	/* $.ajax returns a promise*/

	return $.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (' + url + ')');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.ports) switchPortDetails[serial] = response.ports;
			else {
				var tempArray = [];
				$.each(response.member_port_detail, function() {
					tempArray = tempArray.concat(this.ports);
				})
				switchPortDetails[serial] = tempArray;
			}
		}
	});
}

function showLayerOne() {
	neighbourNotification = showProgressNotification('ca-cable', 'Finding LLDP Neighbours of every AP at the Site...', 'bottom', 'center', 'info');
	$('#layerone-table')
		.DataTable()
		.rows()
		.remove();
	$('#layerone-table')
		.DataTable()
		.clear();
	$('#layerone-table')
		.DataTable()
		.rows()
		.draw();
	$('#LayerOneModalLink').trigger('click');

	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	var siteAPs = getAPsForSite(selectedSite);
	
	neighborSwitches = {};
	switchPortDetails = {};
	
	processAPPortData(siteAPs, 0);
}

function checkAPPortProgress(siteAPs, currentIndex) {
	neighbourNotification.update({ progress: currentIndex/siteAPs.length*100 });
	if (currentIndex < siteAPs.length) {
		processAPPortData(siteAPs, currentIndex++);
	} else {
		if (neighbourNotification) {
			neighbourNotification.update({ type: 'success', message: 'AP Neighbour information processed' });
			setTimeout(neighbourNotification.close, 1000);
		}
	}
}

function processAPPortData(siteAPs, currentIndex) {
	var currentSerial = siteAPs[currentIndex]['serial'];
	var currentAP = siteAPs[currentIndex]['name'];
	if (siteAPs[currentIndex]['mesh_role'] !== 'Point') {
		$.when(getTopologyNeighbors(currentSerial)).then(function() {
			if (!neighborSwitches[currentSerial]) {
				//console.log("didnt find the switch")
				currentIndex++;
				checkAPPortProgress(siteAPs, currentIndex)
			} else {
				// check if we have already obtained port data for this switch
				if (!switchPortDetails[neighborSwitches[currentSerial].neighborSerial]) {
					// get switch port details
					console.log('Need to get switch information for '+ neighborSwitches[currentSerial].neighborSerial)
					$.when(getSwitchPortDetails(neighborSwitches[currentSerial].neighborSerial)).then(function() {
						// now that we have the port data try again.
						processAPPortData(siteAPs, currentIndex);
					});
				} else {
					$.each(switchPortDetails[neighborSwitches[currentSerial].neighborSerial], function() {
						if (this['macaddr'] === neighborSwitches[currentSerial].neighborPortMac) {
							// Buttons for each row
							var btnString = '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="PoE Bounce" onclick="poeBounce(\'' + neighborSwitches[currentSerial].neighborSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-plug-circle-bolt"></i></a>';
							btnString += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Interface Bounce" onclick="interfaceBounce(\'' + neighborSwitches[currentSerial].neighborSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-ethernet"></i></a>';
							if (getSwitchType(neighborSwitches[currentSerial].neighborSerial) === 'AOS-S') {
								btnString += '<a class="btn btn-link btn-warning" data-toggle="tooltip" data-placement="top" title="Cable Test" onclick="cableTest(\'' + neighborSwitches[currentSerial].neighborSerial + "', '" + this['port_number'] + '\')"><i class="fa-solid fa-microscope"></i></a>';
							}
					
							// add data to table!
							var poe = this['power_consumption'];
							if (!poe) poe = 'Unknown';
							var inErrors = this['in_errors'];
							if (!Number.isInteger(inErrors)) inErrors = '';
							var outErrors = this['out_errors'];
							if (!Number.isInteger(outErrors)) outErrors = '';
					
							var status = '<i class="fa-solid fa-circle text-danger"></i>';
							if (this['status'] == 'Up') {
								status = '<i class="fa-solid fa-circle text-success"></i>';
							}
					
							var table = $('#layerone-table').DataTable();
							table.row.add(['<strong>' + currentAP + '</strong>', status, neighborSwitches[currentSerial].neighborHostName, this['port_number'], poe, this['speed'], this['duplex_mode'], inErrors, outErrors, btnString]);
							$('#layerone-table')
								.DataTable()
								.rows()
								.draw();
					
							$('[data-toggle="tooltip"]').tooltip();
							
							currentIndex++;
							checkAPPortProgress(siteAPs, currentIndex)
						}
					});
				}
			}
		});
	} else {
		currentIndex++;
		checkAPPortProgress(siteAPs, currentIndex)
	}
}

function poeBounce(switchSerial, switchPort) {
	
	toolNotification = showLongNotification('ca-switch-stack', 'Attemping to bounce PoE on interface '+switchPort+'...', 'bottom', 'center', 'info');
	var data;
	if (getSwitchType(switchSerial) === 'AOS-S') {
		data = JSON.stringify({ device_type: 'switch', commands: [{ command_id: 1050, arguments: [{ name: 'Port', value: switchPort }] }] });
	} else {
		data = JSON.stringify({ device_type: 'CX', commands: [{ command_id: 6003, arguments: [{ name: 'Port', value: switchPort }] }] });
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + switchSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkTroubleshootingResult, 10000, response.session_id, response.serial, switchPort);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function interfaceBounce(switchSerial, switchPort) {
	toolNotification = showLongNotification('ca-switch-stack', 'Attemping to bounce interface '+switchPort+'...', 'bottom', 'center', 'info');
	var data;
	if (getSwitchType(switchSerial) === 'AOS-S') {
		data = JSON.stringify({ device_type: 'switch', commands: [{ command_id: 1051, arguments: [{ name: 'Port', value: switchPort }] }] });
	} else {
		data = JSON.stringify({ device_type: 'CX', commands: [{ command_id: 6004, arguments: [{ name: 'Port', value: switchPort }] }] });
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + switchSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};
	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkTroubleshootingResult, 10000, response.session_id, response.serial, switchPort);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function cableTest(switchSerial, switchPort) {
	Swal.fire({
		title: 'Are you sure?',
		text: 'Running a Cable Test will cause a disruption on the selected port.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, run it!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmCableTest(switchSerial, switchPort);
		}
	});
}

function confirmCableTest(switchSerial, switchPort) {
	
	toolNotification = showLongNotification('ca-switch-stack', 'Running cable test on interface '+switchPort+'...', 'bottom', 'center', 'info');
	var data;
	if (getSwitchType(switchSerial) === 'AOS-S') {
		data = JSON.stringify({ device_type: 'switch', commands: [{ command_id: 1205, arguments: [{ name: 'Port', value: switchPort }] }] });
	} else {
		// No CX Support for TDR command
		return false;
		//data = JSON.stringify({ device_type: 'switch', commands: [{ command_id: 6004, arguments: [{ name: 'Port', value: switchPort }] }] });
	}

	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + switchSerial,
			access_token: localStorage.getItem('access_token'),
			data: data,
		}),
	};

	$.ajax(settings).done(function(response, textStatus, jqXHR) {
		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else if (response.status === 'QUEUED') {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
			setTimeout(checkTroubleshootingResult, 10000, response.session_id, response.serial, switchPort);
		} else {
			showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
		}
	});
}

function checkTroubleshootingResult(session_id, deviceSerial, switchPort) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			if (response.status === 'RUNNING' || response.status === 'QUEUED') {
				showNotification('ca-window-code', response.message.replace(' Please try after sometime', '.'), 'bottom', 'center', 'info');
				setTimeout(checkTroubleshootingResult, 30000, session_id, response.serial, switchPort);
			} else if (response.status === 'COMPLETED') {
				if (response.output.includes('cable_status')) {
					var results = JSON.parse(response.output);
					cableResult = results['result'][switchPort];
					console.log(cableResult);

					// Display cable test results for each pair of wires.

					var cableFault = false;
					var cableDetail = '';
					$.each(cableResult, function() {
						var cables = this['mdi_pair'].replace('(R1)', '');
						var cableStatus = this['cable_status'];
						if (cableStatus !== 'OK') cableFault = true;
						var cableLength = this['cable_length_in_meters'];
						cableDetail += 'Pair' + cables + ': ' + cableStatus + ' (' + cableLength + 'm), ';
					});

					Swal.fire({
						title: findDeviceInMonitoring(response.serial).name + ' Cable Test - Port: ' + switchPort,
						text: cableDetail.substring(0, cableDetail.length - 2),
						icon: cableFault ? 'error' : 'success',
					});
				}
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'success');
				if (toolNotification) {
					toolNotification.update({ message: 'Switch Troubleshooting Action Completed', type: 'success' });
					setTimeout(toolNotification.close, 1000);
				}
			} else {
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	CSV Reboot Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function rebootDevices() {
	rebootedDevices = 0;
	rebootErrors = 0;
	skippedDevices = 0;

	rebootNotification = showProgressNotification('ca-reload', 'Rebooting devices...', 'bottom', 'center', 'info');
	logStart('Rebooting devices...');
	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		setTimeout(rebootSingleDevice, apiDelay * i, device); // As to not go over the 7 calls/sec speed limit
	}
}

function rebootSiteDevices() {
	$('#RebootDeviceModalLink').trigger('click');
}

function rebootSpecificDevices() {
	rebootedDevices = 0;
	rebootErrors = 0;
	skippedDevices = 0;

	// process csvData for device types selected
	// CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';

	var csvDataBuild = [];

	// For each of the APs needing to be rebooted (stored in 'devicesToReboot')
	// Rebuild the CSV only having selected APs
	$.each(devicesToReboot, function() {
		csvDataBuild.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'] });
	});

	csvData = csvDataBuild;

	rebootNotification = showProgressNotification('ca-reload', 'Rebooting devices...', 'bottom', 'center', 'info');
	logStart('Rebooting devices...');

	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		setTimeout(rebootSingleDevice, apiDelay * i, device); // As to not go over the 7 calls/sec speed limit
	}
	$('#RebootDeviceModal').modal('hide');
}

function rebootSelectedDeviceTypes() {
	rebootedDevices = 0;
	rebootErrors = 0;
	skippedDevices = 0;

	// process csvData for device types selected
	var csvDataBuild = [];
	$.each(csvData, function() {
		var device = findDeviceInMonitoring(this['SERIAL']);
		if (document.getElementById('rebootAPs').checked && deviceType === 'IAP') csvDataBuild.push(this);
		if (document.getElementById('rebootSwitches').checked && deviceType === 'SWITCH') csvDataBuild.push(this);
		if (document.getElementById('rebootGateways').checked && deviceType === 'CONTROLLER') csvDataBuild.push(this);
	});
	csvData = csvDataBuild;

	rebootNotification = showProgressNotification('ca-reload', 'Rebooting devices...', 'bottom', 'center', 'info');
	logStart('Rebooting devices...');
	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		console.log(device);
		setTimeout(rebootSingleDevice, apiDelay * i, device); // As to not go over the 7 calls/sec speed limit
	}
	$('#RebootDeviceModal').modal('hide');
}

function rebootSingleDevice(device) {
	// build array for uploading.
	console.log('Attempting Reboot of: ' + device['SERIAL']);
	if (!device['SERIAL']) {
		skippedDevices++;
	} else {
		var key = device['SERIAL'].trim();

		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/device_management/v1/device/' + key + '/action/reboot',
				access_token: localStorage.getItem('access_token'),
			}),
		};

		$.ajax(settings).done(function(response) {
			//console.log('Device Reboot response: ' + JSON.stringify(response));
			if (response.hasOwnProperty('status')) {
				if (response.status === '503') {
					logError('Central Server Error (503): ' + response.reason + ' (/device_management/v1/device/<SERIAL>/action/reboot)');
					return;
				}
			}
			if (response['state'] && response['state'].toLowerCase() === 'success') {
				rebootedDevices++;
				logInformation('Rebooted ' + response['serial'] + ': ' + rebootedDevices + ' of ' + csvData.length);
			} else {
				rebootErrors++;
				logError('Device Reboot Failed ' + key + ': ' + JSON.stringify(response));
				//console.log('Failed to reboot ' + response['serial'] + ': ' + rebootErrors + ' of ' + csvData.length);
				//if (response['description']) logError(response['description']);
			}

			var rebootProgress = ((rebootedDevices + rebootErrors + skippedDevices) / csvData.length) * 100;
			rebootNotification.update({ progress: rebootProgress });

			// check if finished
			if (rebootedDevices + rebootErrors + skippedDevices == csvData.length) {
				if (rebootNotification) rebootNotification.close();
				if (rebootErrors > 0) {
					showLog();
					Swal.fire({
						title: 'Reboot Failure',
						text: 'Some or all devices (' + rebootErrors + ') failed to be rebooted',
						icon: 'error',
					});
					if (skippedDevices > 0) console.log('CSV file contained ' + skippedDevices + ' empty rows');
				} else {
					Swal.fire({
						title: 'Reboot Success',
						text: 'All ' + rebootedDevices + ' devices were rebooted',
						icon: 'success',
					});
				}
			}
		});
	}
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AP-ENV config sync checking
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function confirmEnvConfigSync(configType, reboot) {
	// Uses csvData to get list of devices to check config sync has completed for ap-env

	// Reset counters for config check stage
	checkedDevices = {};
	commandCheckCounter = {};
	checkedCounter = 0;
	skippedDevices = 0;
	rebootCounter = 0;

	// Reset counters for the reboot stage
	rebootedDevices = 0;
	rebootErrors = 0;
	skippedDevices = 0;

	configNotification = showProgressNotification('ca-reload', 'Checking configuration sync status...', 'bottom', 'center', 'info');

	for (let i = 0; i < csvData.length; i++) {
		var device = csvData[i];
		setTimeout(checkConfigSync, apiDelay * i, device, configType, reboot); // As to not go over the 7 calls/sec speed limit
	}
}

function checkConfigSync(device, configType, reboot) {
	// build array for uploading.
	console.log('Checking config sync for: ' + device['SERIAL']);
	if (!device['SERIAL']) {
		skippedDevices++;
	} else {
		var key = device['SERIAL'].trim();
		var deviceMonitoring = findDeviceInMonitoring(key);
		if (deviceMonitoring && deviceMonitoring['status'] == 'Up') {
			checkedDevices[key] = device;
			commandCheckCounter[key] = 0;
			var data = JSON.stringify({ device_type: 'IAP', commands: [{ command_id: 53 }, { command_id: 60 }] });

			var settings = {
				url: getAPIURL() + '/tools/postCommand',
				method: 'POST',
				timeout: 0,
				headers: {
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + key,
					access_token: localStorage.getItem('access_token'),
					data: data,
				}),
			};

			$.ajax(settings).done(function(response, textStatus, jqXHR) {
				//console.log(response);
				if (response.hasOwnProperty('error')) {
					showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
				} else if (response.status === 'QUEUED' || response.status === 'RUNNING') {
					//showNotification('ca-window-code', response.message, 'bottom', 'center', 'info');
					if (configType == ConfigType.Antenna) setTimeout(checkAntennaConfigResult, 10000, response.session_id, response.serial, reboot);
					else if (configType == ConfigType.IP) setTimeout(checkStaticIPConfigResult, 10000, response.session_id, response.serial, reboot);
				} else {
					showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
				}
			});
		} else {
			logInformation(key + ' is marked as offline in the current Monitoring data. Device is skipped.');
			skippedDevices++;
			checkedCounter++;
			var checkedProgress = ((checkedCounter + skippedDevices) / csvData.length) * 100;
			configNotification.update({ progress: checkedProgress });
			if (checkedProgress > 99 && configNotification) configNotification.close();
		}
	}
}

function checkAntennaConfigResult(session_id, deviceSerial, reboot) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			var deviceKey = response.serial;
			var currentCheckCounter = commandCheckCounter[deviceKey];
			if (response.status === 'QUEUED') {
				console.log('Waiting for commands to be run against: ' + response.serial);
				commandCheckCounter[deviceKey] = currentCheckCounter++;
				if (currentCheckCounter >= commandRetries) {
					// we have waited long enough just give up checking and log it
					skippedDevices++;
					logError("Config Sync Check didn't start for " + response.serial + '. Manually check and reboot if required.');
				} else {
					setTimeout(checkAntennaConfigResult, 30000, session_id, response.serial, reboot);
				}
			} else if (response.status === 'RUNNING') {
				console.log('Commands still running against: ' + response.serial);
				commandCheckCounter[deviceKey] = currentCheckCounter++;
				if (currentCheckCounter >= commandRetries) {
					// we have waited long enough just give up checking and log it
					skippedDevices++;
					logError("Config Sync Check didn't finish for " + response.serial + '. Manually check and reboot if required.');
				} else {
					setTimeout(checkAntennaConfigResult, 30000, session_id, response.serial, reboot);
				}
			} else if (response.status === 'COMPLETED') {
				console.log('Processing results for: ' + response.serial);
				var currentDevice = checkedDevices[response.serial];
				//console.log(currentDevice);
				//console.log(response.output);

				// Antenna Gain Check
				// check contents of ap-env block for antenna gain

				// Get 'a' radio antenna
				var a_ant_gain = response.output.match(/a_ant_gain.*?:(.*$)/m);
				if (a_ant_gain) a_ant_gain = response.output.match(/a_ant_gain.*?:(.*$)/m)[1];
				// check for older ap-env variable

				// Get configured value from CSV for radio 0 (a)
				var original_a_gain = currentDevice['RADIO 0 GAIN'];
				if (!original_a_gain.includes('.')) original_a_gain += '.0';

				// Get 'g' radio antenna
				var g_ant_gain = response.output.match(/g_ant_gain.*?:(.*$)/m);
				if (g_ant_gain) g_ant_gain = response.output.match(/g_ant_gain.*?:(.*$)/m)[1];

				// Get configured value from CSV for radio 1 (g)
				var original_g_gain = currentDevice['RADIO 1 GAIN'];
				if (!original_g_gain.includes('.')) original_g_gain += '.0';

				// If antenna gain is same then config is synced
				if (a_ant_gain === original_a_gain && g_ant_gain === original_g_gain) {
					// Update Notification
					checkedCounter++;
					var checkedProgress = ((checkedCounter + skippedDevices) / csvData.length) * 100;
					configNotification.update({ progress: checkedProgress });
					if (checkedProgress > 99 && configNotification) configNotification.close();

					if (reboot) {
						// Add device to list of devices to reboot
						var ap = { serial: currentDevice['SERIAL'], macaddr: currentDevice['MAC'] };
						devicesToReboot.push(ap);
						console.log(currentDevice['SERIAL'] + ' is ready for reboot.');
						if (checkedCounter + skippedDevices >= csvData.length) {
							// if all devices are ready to be rebooted...
							if (skippedDevices > 0) logInformation('Some devices were not able to be verified for config sync. The rest are being rebooted...');
							else logInformation('All devices are being rebooted...');
							rebootSpecificDevices();
						}
					}
				} else {
					// if antenna gain or IP address doesn't match the CSV - run the command again (until it matches)
					console.log('Waiting for config to sync to ' + response.serial);
					checkConfigSync(checkedDevices[response.serial], ConfigType.Antenna, reboot);
				}
			} else {
				checkedCounter++;
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

function checkStaticIPConfigResult(session_id, deviceSerial, reboot) {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/troubleshooting/v1/devices/' + deviceSerial + '?session_id=' + session_id,
			access_token: localStorage.getItem('access_token'),
		}),
	};

	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/troubleshooting/v1/devices/)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);

		//console.log(response);
		if (response.hasOwnProperty('error')) {
			showNotification('ca-unlink', response.error_description, 'top', 'center', 'danger');
		} else {
			var deviceKey = response.serial;
			var currentCheckCounter = commandCheckCounter[deviceKey];
			if (response.status === 'QUEUED') {
				console.log('Waiting for commands to be run against: ' + response.serial);
				commandCheckCounter[deviceKey] = currentCheckCounter++;
				if (currentCheckCounter > 10) {
					skippedDevices++;
					logError("Config Sync Check didn't start for " + response.serial + '. Manually check and reboot if required.');
				} else {
					setTimeout(checkStaticIPConfigResult, 30000, session_id, response.serial, reboot);
				}
			} else if (response.status === 'RUNNING') {
				console.log('Commands still running against: ' + response.serial);
				commandCheckCounter[deviceKey] = currentCheckCounter++;
				if (currentCheckCounter > 10) {
					skippedDevices++;
					logError("Config Sync Check didn't finish for " + response.serial + '. Manually check and reboot if required.');
				} else {
					setTimeout(checkStaticIPConfigResult, 30000, session_id, response.serial, reboot);
				}
			} else if (response.status === 'COMPLETED') {
				console.log('Processing results for: ' + response.serial);
				var currentDevice = checkedDevices[response.serial];
				//console.log(currentDevice);
				//console.log(response.output);

				// Check contents of ap-env block for IP Address
				// Get ip address from device
				var ipaddress = response.output.match(/ipaddr.*?:(.*$)/m);
				if (ipaddress) {
					// Grab found isolated IP address from AP-ENV
					ipaddress = response.output.match(/ipaddr.*?:(.*$)/m)[1];

					// if IP address in the AP-ENV doesn't match the config desired - run the command again (until it matches)
					if (currentDevice && currentDevice['IP ADDRESS'] && currentDevice['IP ADDRESS'] !== ipaddress) {
						console.log('Waiting for config to sync to ' + response.serial);
						checkConfigSync(currentDevice, ConfigType.IP, reboot);
					} else {
						// AP-ENV and CSV data match now check against active IP address from br0
						// Get configured value from 'show ip interface brief'
						var original_ipaddr = response.output.match(/br0\s*([0-9.]*)\s/m);
						if (original_ipaddr) original_ipaddr = response.output.match(/br0\s*([0-9.]*)\s/m)[1];

						// If IPs don't match then the AP needs to be rebooted so that the static IP can be installed
						if (ipaddress !== original_ipaddr) {
							// Update Notification
							checkedCounter++;
							checkForStaticIPCompletion();
							logError('Static IP for ' + response.serial + ' is not active.');

							var ap = findDeviceInMonitoring(response.serial);
							devicesToReboot.push(ap);
							if (reboot) {
								if (rebootCounter == 0) rebootNotification = showProgressNotification('ca-reload', 'Rebooting devices...', 'bottom', 'center', 'info');
								rebootCounter++;
								// Reboot AP as config is sync'd
								rebootSingleDevice(currentDevice);
							} else {
								$('#APStaticIPConfigModalLink').trigger('click');

								// add to table
								var table = $('#ap-static-table').DataTable();

								// Build strings
								var memoryUsage = (((ap['mem_total'] - ap['mem_free']) / ap['mem_total']) * 100).toFixed(0).toString();
								var status = '<i class="fa-solid fa-circle text-danger"></i>';
								if (ap['status'] == 'Up') {
									status = '<span data-toggle="tooltip" data-placement="right" data-html="true" title="CPU Usage: ' + ap['cpu_utilization'] + '%<br>Memory Usage:' + memoryUsage + '%"><i class="fa-solid fa-circle text-success"></i></span>';
								}
								var active_ip_address = ap['ip_address'];
								if (!active_ip_address) active_ip_address = '';

								// Make AP Name as a link to Central
								var name = encodeURI(ap['name']);
								var apiURL = localStorage.getItem('base_url');
								var centralURL = centralURLs[apiURL] + '/frontend/#/APDETAILV2/' + ap['serial'] + '?casn=' + ap['serial'] + '&cdcn=' + name + '&nc=access_point';

								table.row.add([ap['swarm_master'] ? '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + ' (VC)</strong></a>' : '<a href="' + centralURL + '" target="_blank"><strong>' + ap['name'] + '</strong></a>', status, ap['status'], active_ip_address, ipaddress, ap['serial'], ap['group_name'], ap['macaddr']]);

								// Force reload of table data
								$('#ap-static-table')
									.DataTable()
									.rows()
									.draw();

								$('[data-toggle="tooltip"]').tooltip();
							}
						} else {
							logInformation('Static IP for ' + response.serial + ' (' + ipaddress + ') is already active.');
							checkedCounter++;
							checkForStaticIPCompletion();
						}
					}
				} else {
					logInformation(response.serial + ' is not configured to use a static IP');
					checkedCounter++;
					checkForStaticIPCompletion();
				}
			} else {
				checkedCounter++;
				showNotification('ca-window-code', response.message, 'bottom', 'center', 'danger');
			}
		}
	});
}

function testStaticIPAddress() {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	var siteAPs = getAPsForSite(selectedSite);

	// Prep UI and counters
	devicesToReboot = [];
	$('#ap-static-table')
		.DataTable()
		.rows()
		.remove();

	showNotification('ca-square-pin', 'Checking APs at ' + selectedSite + '...', 'bottom', 'center', 'info');

	// CSV header
	var serialKey = 'SERIAL';
	var macKey = 'MAC';

	var csvDataBuild = [];

	// For each row in the supplied device CSV
	// Rebuild the CSV only having selected APs and set antenna gains
	$.each(siteAPs, function() {
		csvDataBuild.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'] });
	});

	csvData = csvDataBuild;
	confirmEnvConfigSync(ConfigType.IP, false);
}

function checkForStaticIPCompletion() {
	var checkedProgress = ((checkedCounter + skippedDevices) / csvData.length) * 100;
	configNotification.update({ progress: checkedProgress });
	if (checkedProgress > 99) {
		if (configNotification) configNotification.close();
		var table = $('#ap-static-table').DataTable();
		var icon = 'warning';
		if (!table.data().count()) {
			icon = 'success';
			showLog();
		}
		Swal.fire({
			title: 'Active Static IP',
			text: 'All APs using static IP have been checked.',
			icon: icon,
		});
	}
}

function checkForStaticIPConfigCompletion() {
	var ipProgress = (ipCounter / csvData.length) * 100;
	ipNotification.update({ progress: ipProgress });

	if (ipCounter >= csvData.length) {
		if (ipNotification) ipNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Static IP Configuration Failure',
					text: 'Some or all devices failed to be set to the correct static IP addresses. Please reboot any successful APs for change to take effect.',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Static IP Configuration Success',
					text: 'All devices were set to the supplied static IPs. Please reboot APs for change to take effect.',
					icon: 'success',
					showCancelButton: true,
					cancelButtonColor: '#d33',
					cancelButtonText: "I'll reboot later",
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Reboot them!',
				}).then(result => {
					if (result.isConfirmed) {
						// Build a CSV of only the APs that require a reboot
						var serialKey = 'SERIAL';
						var macKey = 'MAC';
						var ipKey = 'IP ADDRESS';
						var csvDataBuild = [];
						$.each(devicesToReboot, function() {
							csvDataBuild.push({ [serialKey]: this['serial'], [macKey]: this['macaddr'], [ipKey]: this['ip_address'] });
						});
						csvData = csvDataBuild;

						// Need to confirm config has made it to each AP
						confirmEnvConfigSync(ConfigType.IP, true);
					}
				});
			}
		}
	}
}

function setStaticIPConfig() {
	/*  
		if AP - grab ap settings via API, then update the IP address values
	*/
	var settingsList = {};
	devicesToReboot = [];
	ipCounter = 0;
	$.when(updateInventory(false)).then(function() {
		ipNotification = showProgressNotification('ca-square-pin', 'Setting static IP addresses...', 'bottom', 'center', 'info');
		$.each(csvData, function() {
			// find device in inventory to get device type
			if (this['SERIAL']) {
				var currentSerial = this['SERIAL'].trim();

				// get IP details
				var ipAddress = this['IP ADDRESS'];
				var subnetMask = this['SUBNET MASK'];
				var gateway = this['DEFAULT GATEWAY'];
				var dnsServer = this['DNS SERVER'];
				var domainName = this['DOMAIN NAME'];

				if (!ipAddress && !subnetMask && !gateway && !dnsServer) {
					logError('Device with Serial Number: ' + currentSerial + ' is missing static IP information in the CSV');
					ipCounter++;
					checkForStaticIPConfigCompletion();
				} else {
					var device = findDeviceInInventory(currentSerial);
					if (!device) {
						logError('Unable to find device ' + currentSerial + ' in the device inventory');
						apiErrorCount++;
						ipCounter++;
						checkForStaticIPConfigCompletion();
					} else if (deviceType === 'IAP') {
						settingsList[device.macaddr.toLowerCase()] = this;
						// if AP then get AP settings
						var settings = {
							url: getAPIURL() + '/tools/getCommandwHeaders',
							method: 'POST',
							timeout: 0,
							headers: {
								'Content-Type': 'application/json',
							},
							data: JSON.stringify({
								url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
								access_token: localStorage.getItem('access_token'),
							}),
						};

						$.ajax(settings).done(function(commandResults, statusText, xhr) {
							if (commandResults.hasOwnProperty('headers')) {
								updateAPILimits(JSON.parse(commandResults.headers));
							}
							if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
								logError('Central Server Error (503): ' + commandResults.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
								apiErrorCount++;
								return;
							} else if (commandResults.hasOwnProperty('error_code')) {
								logError(commandResults.description);
								apiErrorCount++;
								return;
							}
							var response = JSON.parse(commandResults.responseBody);

							if (response.hasOwnProperty('error_code')) {
								logError(response.description);
								apiErrorCount++;
								ipCounter++;
								checkForStaticIPConfigCompletion();
							} else {
								var apCLIResponse = response;
								// Pull in the new settings from the settingsList (ensures correct settings are used)
								var newSettingsKey = [apCLIResponse[0].replace('per-ap-settings ', '')];
								var newSettings = settingsList[newSettingsKey];

								var currentSerial = newSettings['SERIAL'].trim();
								var newIpAddress = newSettings['IP ADDRESS'] ? newSettings['IP ADDRESS'].trim() : null;
								var newSubnetMask = newSettings['SUBNET MASK'] ? newSettings['SUBNET MASK'].trim() : null;
								var newGateway = newSettings['DEFAULT GATEWAY'] ? newSettings['DEFAULT GATEWAY'].trim() : null;
								var newDnsServer = newSettings['DNS SERVER'] ? newSettings['DNS SERVER'].trim() : null;
								if (newDnsServer) newDnsServer = newDnsServer.replace(/\s/g, ''); // remove any spaces in between multiple DNS servers
								var newDomainName = newSettings['DOMAIN NAME'] ? newSettings['DOMAIN NAME'].trim() : null;

								// rebuild ip address line
								var ipAddressLine = -1;
								// remove the old settings
								for (i = 0; i < apCLIResponse.length; i++) {
									if (apCLIResponse[i].includes('ip-address ')) ipAddressLine = i;
								}
								var originalLine = '';
								if (ipAddressLine != -1) originalLine = apCLIResponse.splice(ipAddressLine, 1);
								if (originalLine !== '') {
									var ipArray = originalLine[0].split(' ');
									if (!newIpAddress) newIpAddress = ipArray[3];
									if (!newSubnetMask) newSubnetMask = ipArray[4];
									if (!newGateway) newGateway = ipArray[5];
									if (!newDnsServer) newDnsServer = ipArray[6];
									if (!newDomainName) newDomainName = ipArray[7];

									if (newIpAddress === '0.0.0.0' || newSubnetMask === '0.0.0.0' || newGateway === '0.0.0.0' || newDnsServer === '0.0.0.0') {
										ipCounter++;
										logInformation(currentSerial + ' was not assigned the new static IP settings, as it is not configured for Static IP or is missing data in the CSV file');
										checkForStaticIPConfigCompletion();
										return true;
										console.log('shouldnt see this');
									}
								}

								// add in the new config
								apCLIResponse.push('  ip-address ' + newIpAddress + ' ' + newSubnetMask + ' ' + newGateway + ' ' + newDnsServer + ' ' + newDomainName);
								var combinedForOutput = newIpAddress + '/' + newSubnetMask + '/' + newGateway + ', ' + newDnsServer + ', ' + newDomainName;

								// Update ap settings
								var settings = {
									url: getAPIURL() + '/tools/postCommand',
									method: 'POST',
									timeout: 0,
									headers: {
										'Content-Type': 'application/json',
									},
									data: JSON.stringify({
										url: localStorage.getItem('base_url') + '/configuration/v1/ap_settings_cli/' + currentSerial,
										access_token: localStorage.getItem('access_token'),
										data: JSON.stringify({ clis: apCLIResponse }),
									}),
								};

								$.ajax(settings).done(function(response, statusText, xhr) {
									if (response.hasOwnProperty('status')) {
										if (response.status === '503') {
											apiErrorCount++;
											logError('Central Server Error (503): ' + response.reason + ' (/configuration/v1/ap_settings_cli/<SERIAL>)');
										}
									}
									if (response !== currentSerial) {
										logError(currentSerial + ' was not assigned the new static IP address. Reason: ' + response.reason);
										//console.log(response.reason);
										apiErrorCount++;
									} else {
										var ap = { serial: currentSerial, macaddr: newSettingsKey, ip_address: newIpAddress };
										devicesToReboot.push(ap);
										logInformation(currentSerial + ' was assigned the static IP address values (' + combinedForOutput + ')');
									}
									ipCounter++;
									checkForStaticIPConfigCompletion();
								});
							}
						});
					} else {
						// Either switch or controller/gateway
						ipCounter++;
						checkForStaticIPConfigCompletion();
					}
				}
			} else {
				ipCounter++;
				checkForStaticIPConfigCompletion();
			}
		});
	});
	if (currentWorkflow !== '') {
		return autoStaticIPPromise.promise();
	}
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Visitor Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function checkForVisitorCompletion() {
	var visitorProgress = (visitorCounter / csvData.length) * 100;
	visitorNotification.update({ progress: visitorProgress });
	if (visitorCounter >= csvData.length) {
		if (visitorNotification) visitorNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Visitor Creation Failure',
					text: 'Some or all visitor accounts failed to be created.',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Add Success',
					text: 'All visitor accounts were created.',
					icon: 'success',
				});
			}
			loadCurrentPageVisitors();
		}
	}
}

function createVisitors() {
	vistorCounter = 0;
	if (csvData.length == 0) showNotification('ca-multiple-11', 'No visitors in the CSV file', 'bottom', 'center', 'warning');
	else visitorNotification = showProgressNotification('ca-multiple-11', 'Creating Visitors...', 'bottom', 'center', 'info');
	for (var i=0;i<csvData.length;i++) {
		setTimeout(createVisitor, apiDelay * i, csvData[i]);
	}
}

function createVisitor(visitor) {
	if (visitor['NAME']) {
		var visitorData = {};
		var visitorName = visitor['NAME'].trim();
		visitorData['name'] = visitor['NAME'].trim();
		visitorData['company_name'] = visitor['COMPANY'].trim();
		if (visitor['PASSWORD'].trim()) visitorData['password'] = visitor['PASSWORD'].trim();

		var visitorPhone = visitor['PHONE'].trim();
		if (visitorPhone && visitorPhone.length > 0 && !visitorPhone.includes('+')) visitorPhone = '+' + visitorPhone;
		var visitorEmail = visitor['EMAIL'].trim();
		if (visitorPhone || visitorEmail) {
			var userData = {};
			if (visitorPhone && visitorPhone !== '') userData['phone'] = visitorPhone;
			if (visitorEmail && visitorEmail !== '') userData['email'] = visitorEmail;
			visitorData['user'] = userData;
		}

		visitorData['is_enabled'] = true;
		var visitorEnabled = visitor['ENABLED'].trim();
		if (visitorEnabled) {
			visitorEnabled = visitorEnabled.toLowerCase();
			if (visitorEnabled === 'no') visitorData['is_enabled'] = false;
			else if (visitorEnabled === 'false') visitorData['is_enabled'] = false;
			else if (visitorEnabled === '0') visitorData['is_enabled'] = false;
		}

		var visitorDays = parseInt(visitor['DAYS'].trim());
		if (!visitorDays) visitorDays = 0;
		var visitorHours = parseInt(visitor['HOURS'].trim());
		if (!visitorHours) visitorHours = 0;
		var visitorMinutes = parseInt(visitor['MINUTES'].trim());
		if (!visitorMinutes) visitorMinutes = 0;
		visitorData['valid_till_no_limit'] = false;
		if (visitorDays == 0 && visitorHours == 0 && visitorMinutes == 0) {
			visitorData['valid_till_no_limit'] = true;
			visitorData['valid_till_days'] = 0;
			visitorData['valid_till_hours'] = 0;
			visitorData['valid_till_minutes'] = 0;
		} else {
			visitorData['valid_till_days'] = visitorDays;
			visitorData['valid_till_hours'] = visitorHours;
			visitorData['valid_till_minutes'] = visitorMinutes;
		}

		var visitorNotify = visitor['NOTIFY'].trim();
		if (visitorNotify) {
			visitorNotify = visitorNotify.toLowerCase();
			if (visitorNotify === 'email') {
				visitorData['notify'] = true;
				visitorData['notify_to'] = 'email';
			} else if (visitorNotify === 'phone') {
				visitorData['notify'] = true;
				visitorData['notify_to'] = 'phone';
			}
		}

		var select = document.getElementById('portalselector');

		// Create visitor
		var settings = {
			url: getAPIURL() + '/tools/postCommand',
			method: 'POST',
			timeout: 0,
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				url: localStorage.getItem('base_url') + '/guest/v1/portals/' + select.value + '/visitors',
				access_token: localStorage.getItem('access_token'),
				data: JSON.stringify(visitorData),
			}),
		};
		$.ajax(settings).done(function(response, statusText, xhr) {
			if (response.hasOwnProperty('error_code')) {
				if (response.error_code == 400) {
					apiErrorCount++;
					logError('Central Server Error (400): ' + response.description);
				}
				if (response.error_code == 503) {
					apiErrorCount++;
					logError('Central Server Error (503): ' + response.description + ' (/guest/v1/portals/<PORTAL_ID>/visitors)');
				}
				if (response.error_code == 500) {
					if (response.description.includes('id')) logError('Visitor account for "' + visitorName + '" was not created as to a duplicate account already exists.');
					else if (response.description.includes('phone')) logError('Visitor account for "' + visitorName + '" was not created due to lack of a phone number. (Format: [+CountryCode][PhoneNumber])');
					else if (response.description) logError('Visitor account for "' + visitorName + '" was not created due to an error with the field: '+ response.description);
					else logError('Central Server Error (500): Internal Server Error on Central (/guest/v1/portals/<PORTAL_ID>/visitors)');
					apiErrorCount++;
				}
			}
			if (!('id' in response)) {
				//logInformation(currentSerial + ' was not assigned the new Antenna gain values. Reason: ' + response.reason);
				//console.log(response.reason);
				apiErrorCount++;
			}
			visitorCounter++;
			checkForVisitorCompletion();
		});
	} else {
		visitorCounter++;
		checkForVisitorCompletion();
	}
}


function resetTopology() {
	var select = document.getElementById('siteselector');
	var selectedSite = select.value;
	Swal.fire({
		title: 'Are you sure?',
		html: 'A topology reset for '+ selectedSite +' will take ~2-3 hours to be recreated by Central.<br><br>Clicking Yes below will open a new window, and a successful topology reset will only show “{"status_code":200}” on the following page. <br><br>Please close that page to return to Central Automation Studio.',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, do it!',
	}).then(result => {
		if (result.isConfirmed) {
			confirmTopologyReset(getSiteIDForName(selectedSite));
		}
	});
}

function confirmTopologyReset(siteID) {
	var apiURL = localStorage.getItem('base_url');
	var centralBaseURL = centralURLs[apiURL];
	if (!centralBaseURL) centralBaseURL = apiURL.replace(cop_url, cop_central_url); //manually build the COP address
	
	var resetURL = centralBaseURL + '/topology/debug/'+siteID+'/reset';
	window.open(resetURL, '_blank');
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	AppRF Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function getAppRFMappings() {
	var settings = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/apprf/v1/metainfo/iap/application/id_to_name',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/apprf/v1/metainfo/iap/application/id_to_name)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		appIDMappings = response;
	});
	
	var settings2 = {
		url: getAPIURL() + '/tools/getCommandwHeaders',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/apprf/v1/metainfo/iap/webcategory/id_to_name',
			access_token: localStorage.getItem('access_token'),
		}),
	};
	
	$.ajax(settings2).done(function(commandResults, statusText, xhr) {
		if (commandResults.hasOwnProperty('headers')) {
			updateAPILimits(JSON.parse(commandResults.headers));
		}
		if (commandResults.hasOwnProperty('status') && commandResults.status === '503') {
			logError('Central Server Error (503): ' + commandResults.reason + ' (/apprf/v1/metainfo/iap/webcategory/id_to_name)');
			apiErrorCount++;
			return;
		} else if (commandResults.hasOwnProperty('error_code')) {
			logError(commandResults.description);
			apiErrorCount++;
			return;
		}
		var response = JSON.parse(commandResults.responseBody);
		webCatMappings = response;
	});
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Gateway CSV Functions
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */

function checkForGatewayCompletion() {
	var gatewayProgress = (gatewayCounter / csvData.length) * 100;
	automationNotification.update({ progress: gatewayProgress });
	if (gatewayCounter >= csvData.length) {
		if (automationNotification) automationNotification.close();
		if (currentWorkflow === '') {
			if (apiErrorCount != 0) {
				showLog();
				Swal.fire({
					title: 'Gateway Config Failure',
					text: 'Some or all gateways failed to be updated.',
					icon: 'error',
				});
			} else {
				Swal.fire({
					title: 'Gateway Config Success',
					text: 'All Gateways have been updated.',
					icon: 'success',
				});
			}
			logEnd('Gateway Timezone update complete')
		}
	}
}

function setGatewayTimezones() {
	if (csvData.length == 0) showNotification('ca-config-gateway', 'No Gateways in the CSV file', 'bottom', 'center', 'warning');
	else automationNotification = showProgressNotification('ca-config-gateway', 'Setting Gateway Timezones...', 'bottom', 'center', 'info');
	
	// Build Device List to obtain the full path
	var groupList = getGroups();
	var gatewayList = getGateways();
	var groupDeviceList = {};
	$.each(groupList, function() {
		if (this.group !== 'unprovisioned') {
			var groupName = this.group;	
			$.each(gatewayList, function() {
				if (this.group_name === groupName) {
					var visibleName = this.macaddr;
					groupDeviceList[this.macaddr] = encodeURI(groupName) + '/' + this.macaddr;
				}
			});
		}
	});
	
	for (var i=0;i<csvData.length;i++) {
		var currentRow = csvData[i];
		var currentMac = currentRow['MAC'];
		if (!currentMac) currentMac = currentRow['MAC ADDRESS'];
		if (currentMac) {
			if (currentRow['TIMEZONE']) {
				if (groupDeviceList[currentMac]) {
					currentMac = groupDeviceList[currentMac]
					currentTz = currentRow['TIMEZONE'].trim().replace(' ', '_');
					destTZ = DateTime.local().setZone(currentTz);
					if (destTZ.isValid) {
						currentCommand = [];
						currentCommand.push('clock timezone '+currentTz+ ' ' +destTZ.toFormat('ZZ').replace(':', ' '));
						setTimeout(applyCLICommandsForGateway, apiDelay*i, currentMac, currentCommand);
					} else {
						logError('Invalid Timezone for Gateway (' + currentRow['SERIAL'] +'): '+ currentTz);
						gatewayCounter++;
						checkForGatewayCompletion();
					}
				} else {
					logError('Unable to find Gateway with serial: ' + currentRow['SERIAL']);
					gatewayCounter++;
					checkForGatewayCompletion();
				}
			} else {
				logError('Missing Timezone for ' + currentRow['SERIAL']);
				gatewayCounter++;
				checkForGatewayCompletion();
			}
		}
	}
}

function applyCLICommandsForGateway(currentGroup, currentConfig) {
	
	// need to push config back to Central.
	var settings = {
		url: getAPIURL() + '/tools/postCommand',
		method: 'POST',
		timeout: 0,
		headers: {
			'Content-Type': 'application/json',
		},
		data: JSON.stringify({
			url: localStorage.getItem('base_url') + '/caasapi/v1/exec/cmd?group_name=' + currentGroup,
			access_token: localStorage.getItem('access_token'),
			data: JSON.stringify({ cli_cmds: currentConfig }),
		}),
	};

	$.ajax(settings).done(function(response, statusText, xhr) {
		if (response.hasOwnProperty('status')) {
			if (response.status === '503') {
				logError('Central Server Error (503): ' + response.reason + ' (/caasapi/v1/exec/cmd)');
				return;
			}
		}
		var result = response['_global_result'];
		if (result['status_str'] === 'Success') {
			logInformation('Gateway config for ' + currentGroup + ' was successfully updated');
		} else {
			logError('Config for ' + currentGroup + ' failed to be applied: ' + result['status_str']);
		}
		gatewayCounter++;
		checkForGatewayCompletion();
	});
}


/*  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Generic Device Download Action
------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

function downloadDeviceCSV(downloadType) {

	var table = $('#ap-table').DataTable();	
	var filename = 'ap';
	if (downloadType == DeviceType.AP) {
		table = $('#ap-table').DataTable();
		filename = 'ap';
	} else if (downloadType == DeviceType.Switch) {
		table = $('#switch-table').DataTable();
		filename = 'switch';
	} else if (downloadType == DeviceType.Gateway) {
		table = $('#gateway-table').DataTable();
		filename = 'gateway';
	} else if (downloadType == DeviceType.Controller) {
		table = $('#controller-table').DataTable();
		filename = 'controller';
	}
	
	$.when(updateInventory(false)).then(function() {
		csvData = buildDeviceCSVData(downloadType);
		var csv = Papa.unparse(csvData);
		var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		var csvURL = window.URL.createObjectURL(csvBlob);
		var csvLink = document.createElement('a');
		csvLink.href = csvURL;
		
		var filter = table.search();
		if (filter !== '') csvLink.setAttribute('download', filename + '-' + filter.replace(/ /g, '_') + '.csv');
		else csvLink.setAttribute('download', filename+'.csv');
		csvLink.click();
		window.URL.revokeObjectURL(csvLink);
	});
}

function buildDeviceCSVData(downloadType) {
	
	var table = $('#ap-table').DataTable();	
	var filename = 'ap';
	var deviceDisplay = [];
	if (downloadType == DeviceType.AP) {
		table = $('#ap-table').DataTable();
		filename = 'ap';
		deviceDisplay = getAPs();
	} else if (downloadType == DeviceType.Switch) {
		table = $('#switch-table').DataTable();
		filename = 'switch';
		deviceDisplay = getSwitches();
	} else if (downloadType == DeviceType.Gateway) {
		table = $('#gateway-table').DataTable();
		filename = 'gateway';
		deviceDisplay = getGateways();
	} else if (downloadType == DeviceType.Controller) {
		table = $('#controller-table').DataTable();
		filename = 'controller';
		deviceDisplay = getControllers();
	}
	
	//CSV header
	var nameKey = 'DEVICE NAME';
	var serialKey = 'SERIAL';
	var macKey = 'MAC';
	var groupKey = 'GROUP';
	var siteKey = 'SITE';
	var labelKey = 'LABELS';
	var licenseKey = 'LICENSE';
	var zoneKey = 'ZONE';
	var swarmKey = 'SWARM MODE';
	var rfKey = 'RF PROFILE';
	var installationKey = 'INSTALLATION TYPE';
	var radio0Key = 'RADIO 0 MODE';
	var radio1Key = 'RADIO 1 MODE';
	var radio2Key = 'RADIO 2 MODE';
	var dualKey = 'DUAL 5GHZ MODE';
	var splitKey = 'SPLIT 5GHZ MODE';
	var flexKey = 'FLEX DUAL BAND';
	var ipKey = 'IP ADDRESS';
	var smKey = 'SUBNET MASK';
	var dgwKey = 'DEFAULT GATEWAY';
	var dnsKey = 'DNS SERVER';
	var domainKey = 'DOMAIN NAME';
	var timezoneKey = 'TIMEZONE';
	var altitudeKey = 'ALTITUDE';

	var csvDataBuild = [];

	var filteredRows = table.rows({ filter: 'applied' });

	// For each row in the filtered set
	$.each(filteredRows[0], function() {
		var device = deviceDisplay[this];
		// Find monitoring data if there is any
		var inventoryInfo = findDeviceInInventory(device.serial);
		var groupToUse = device['group_name'] ? device['group_name'] : '';
		var siteToUse = device['site'] ? device['site'] : '';
		
		var labels = '';
		if (device.labels) labels = device.labels.join(', ');
		
		var swarmMode = '';
		if (downloadType == DeviceType.AP) swarmMode = device['swarm_id'] ? 'Cluster':'Standalone';
		
		var licenseString = '';
		if (inventoryInfo) {
			if (inventoryInfo['tier_type'] && inventoryInfo['tier_type'] === 'other') licenseString = inventoryInfo['services'][0];
			else if (inventoryInfo['tier_type']) licenseString = titleCase(inventoryInfo['tier_type']);
		}

		csvDataBuild.push({ [nameKey]: device['name'] ? device['name'] : device['macaddr'], [serialKey]: device['serial'], [macKey]: device['macaddr'], [groupKey]: groupToUse, [siteKey]: siteToUse, [labelKey]: labels, [licenseKey]: licenseString, [zoneKey]:'', [swarmKey]:swarmMode, [rfKey]:'', [installationKey]:'', [radio0Key]:'', [radio1Key]:'', [radio2Key]:'', [dualKey]:'', [splitKey]:'', [flexKey]:'', [ipKey]:device['ip_address'] ? device['ip_address']:'', [smKey]:device['subnet_mask'] ? device['subnet_mask']:'', [dgwKey]:'', [dnsKey]:'', [domainKey]:'', [timezoneKey]:'', [altitudeKey]:'' });
	});

	return csvDataBuild;
}