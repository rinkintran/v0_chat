app.controller('cnvDetailController',
 ['$scope', '$state', '$http', '$uibModal', 'notifyDlg', '$stateParams',
 'title', 'msgs',
 function($scope, $state, $http, $uibM, nDlg, $stateParams, title, msgs) {
 	var id = $stateParams.cnvId;
 	
	$scope.convoTitle = title;
	$scope.msgs = msgs;

	$scope.newMsg = function(message) {
		$http.post("Cnvs/" + id + "/Msgs", {content: message})
		.then(function() {
         return $http.get('/Cnvs/' + id + '/Msgs');
      })
      .then(function(rsp) {
         $scope.msgs = rsp.data;
      })
	}
 }]);