app.controller('myCnvOverviewController',
 ['$scope', '$state', '$http', '$uibModal', 'notifyDlg', 'cnvs', '$rootScope',
 function($scope, $state, $http, $uibM, nDlg, cnvs, $rootScope) {
   $scope.cnvs = cnvs;

   $scope.newCnv = function() {
      $scope.title = null;
      $scope.dlgTitle = "New Conversation";
      var selectedTitle;

      $uibM.open({
         templateUrl: 'Conversation/editCnvDlg.template.html',
         scope: $scope
      }).result
      .then(function(newTitle) {
         selectedTitle = newTitle;
         return $http.post("Cnvs", {title: newTitle});
      })
      .then(function() {
         return $http.get('/Cnvs');
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      .catch(function(err) {
         // console.log("Error: " + JSON.stringify(err));
         if (err.data[0].tag == "dupTitle")
            nDlg.show($scope, "Another conversation already has title " + 
             selectedTitle, "Error");
      });
   };

   $scope.editCnv = function(index) {

      $scope.title = null;
      $scope.dlgTitle = "Edit Conversation";

      var selectedTitle;

      $uibM.open({
         templateUrl: 'Conversation/editCnvDlg.template.html',
         scope: $scope
      }).result
      .then(function(newTitle) {
         selectedTitle = newTitle;
         return $http.put("Cnvs/" + $scope.cnvs[index].id, {title: newTitle});
      })
      .then(function () {
         return $http.get('/Cnvs?owner=' + $rootScope.user.id);
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      .catch(function(err) {
         if (err && err.data[0].tag == "dupTitle") {
            nDlg.show($scope, "Another conversation already has title " + 
             selectedTitle, "Error");
         }
      });
   };

   $scope.delCnv = function(index) {
      var selectedTitle = $scope.cnvs[index].title;
      var selectedTitleId = $scope.cnvs[index].id;

      nDlg.show($scope, "Delete conversation entitled " + selectedTitle
       + "?", "Verify", ["Yes", "No"])
      .then(function(btn) {
         if (btn === "Yes") {
            return $http.delete("Cnvs/" + selectedTitleId);
         }
         else {
            $state.go('myCnvs');
         }
      })
      .then(function() {
         return $http.get('/Cnvs?owner=' + $rootScope.user.id);
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      });
   }
}]);
