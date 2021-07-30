/*
Central Automation v0.1
*/

var clusterCredentials = [];


function addCluster() {
	document.getElementById("cluster_name").value = "";
	document.getElementById("client_id").value = "";
	document.getElementById("client_id").disabled = false;
	document.getElementById("client_secret").value = "";
	document.getElementById("access_token").value = "";
	document.getElementById("refresh_token").value = "";
	$('#ClusterModalLink').trigger('click');
}

function saveCluster() {
	// Save all supplied addresses and details to the array of clusters
	var currentCluster = checkForDuplicateCluster($('#client_id').val());
	if (checkForDuplicateCluster($('#client_id').val()) == -1) {
		clusterCredentials.push({'cluster_name': $('#cluster_name').val(),
								'client_id': $('#client_id').val(),
								'client_secret': $('#client_secret').val(),
								'base_url': document.getElementById("clusterselector").value,
								'refresh_token': $('#refresh_token').val(),
								'access_token': $('#access_token').val()
		});
		
		// save array to localStorage
		localStorage.setItem('cluster_details', JSON.stringify(clusterCredentials));
	} else {
		//modify existing cluster
		clusterCredentials[currentCluster] = {'cluster_name': $('#cluster_name').val(),
												'client_id': $('#client_id').val(),
												'client_secret': $('#client_secret').val(),
												'base_url': document.getElementById("clusterselector").value,
												'refresh_token': $('#refresh_token').val(),
												'access_token': $('#access_token').val()
											};									
		localStorage.setItem('cluster_details', JSON.stringify(clusterCredentials));
	}
	loadClusterDetails();
	$('#ClusterModal').modal('hide');
}

function cancelCluster() {
	$('#ClusterModal').modal('hide');
}

function editCluster(clientID) {
	var cluster = clusterCredentials[checkForDuplicateCluster(clientID)];
	document.getElementById("cluster_name").value = cluster.cluster_name;
	document.getElementById("client_id").value = cluster.client_id;
	document.getElementById("client_id").disabled = true;
	document.getElementById("client_secret").value = cluster.client_secret;
	document.getElementById("clusterselector").value = cluster.base_url;
	document.getElementById("access_token").value = cluster.access_token;
	document.getElementById("refresh_token").value = cluster.refresh_token;
		
	$('#ClusterModalLink').trigger('click');
}

function deleteCluster(clientID) {
	Swal.fire({
		title: 'Are you sure you want to delete?',
		icon: 'question',
		showDenyButton: true,
		confirmButtonText: `Yes`,
		denyButtonText: `No`
	}).then((result) => {
	  if (result.isConfirmed) {
	  	clusterCredentials.splice(checkForDuplicateCluster(clientID),1);
		localStorage.setItem('cluster_details', JSON.stringify(clusterCredentials));
		loadClusterDetails();
	  }
	})
	
}

function checkForDuplicateCluster(client_id) {
	foundCluster = -1;
	for (i=0; i<clusterCredentials.length; i++) {
		if (clusterCredentials[i].client_id === client_id) foundCluster = i;
	}
	return foundCluster;
}

function loadClusterDetails() {
	$('#hydra-table').DataTable().clear();
	
	var cluster_details = localStorage.getItem('cluster_details');
	if (cluster_details != null && cluster_details != "undefined") {
		clusterCredentials = JSON.parse(cluster_details);
		$.each(clusterCredentials, function() {
		
			var btnString = '<a href="#" class="btn btn-link btn-warning edit"><i class="fa fa-edit"></i></a><a href="#" class="btn btn-link btn-danger remove"><i class="fa fa-times"></i></a>'
		
			var table = $('#hydra-table').DataTable();
			table.row.add([
				"<strong>"+this["cluster_name"]+"</strong>", 
				getClusterName(this["base_url"]), 
				this["client_id"],
				this["client_secret"], 
				this["access_token"],
				this["refresh_token"],
				btnString
			]);
		});
		$('#hydra-table').DataTable().rows().draw();
	}
	
	
}