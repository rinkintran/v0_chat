app.controller('registerController',
 ['$scope', '$state', '$http', 'notifyDlg', 'login', 
 function($scope, $state, $http, nDlg, login) {
   $scope.user = {role: 0};
   $scope.errors = [];

   $scope.registerUser = function() {
      $http.post("Prss", $scope.user)
      .then(function() {
         return nDlg.show($scope, "Registration succeeded. " + 
          " Login automatically?", "Login", ["Yes", "No"]);
      })
      .then(function(btn) {
         if (btn === "Yes") {
          login.login($scope.user)
           .then(function(user) {
             $scope.$parent.user = user;
             $state.go('home');
          })
          .catch(function() {
            nDlg.show($scope, "That name/password is not in our records",
             "Error");
          });
            //return $http.post("Ssns", $scope.user);
         }
         else {
            $state.go('home');
         }
      })
      .catch(function(err) {
         $scope.errors = err.data;
      });
   };

   $scope.quit = function() {
      $state.go('home');
   };
}]);
