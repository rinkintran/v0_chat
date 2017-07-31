
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap'
]);

app.constant("errMap", {
   missingField: 'Field missing from request: ',
   badValue: 'Field has bad value: ',
   notFound: 'Entity not present in DB',
   badLogin: 'Email/password combination invalid',
   dupEmail: 'Email duplicates an existing email',
   noTerms: 'Acceptance of terms is required',
   forbiddenRole: 'Role specified is not permitted.',
   noOldPwd: 'Change of password requires an old password',
   oldPwdMismatch: 'Old password that was provided is incorrect.',
   dupTitle: 'Conversation title duplicates an existing one',
   dupEnrollment: 'Duplicate enrollment',
   forbiddenField: 'Field in body not allowed.',
   queryFailed: 'Query failed (server problem).'
});

app.constant("translateMap", {
   English: "",
   Ingles: "",
   Espanol: "[ES] ",
   Spanish: "[ES] "
});

app.controller('indexController', 
 ['$scope', '$state', '$http', 'notifyDlg', '$rootScope', 'login',
 function($scope, $state, $http, nDlg, $rootScope, login) {
   $rootScope.lang = 'English';
   $rootScope.langs = ["English", "Spanish"];

   $scope.chooseLang = function(index) {
      if($rootScope.langs[index] === 'Spanish') {
         $rootScope.langs = ["Ingles", "Espanol"];
         $rootScope.lang = $rootScope.langs[index];  
      }
      else if ($rootScope.langs[index] === 'Ingles') {
         $rootScope.langs = ["English", "Spanish"];
         $rootScope.lang = $rootScope.langs[index];
      }
   }

   $scope.logout = function() {
      login.logout()
      .then(function() {
         $rootScope.user = null;
         $state.go('home');
      })
   };
}]);

app.filter('tagError', ['errMap', 'translateMap', '$rootScope', 
 function(errMap, translateMap, $rootScope) {
   return function(err, language) {
      console.log(err);
      console.log($rootScope.lang);
      if ($rootScope.lang === "English") {
         return  errMap[err.tag] + (err.params != null && 
          err.params.length ? err.params[0] : "");
      }
      else {
         return translateMap[$rootScope.lang] + errMap[err.tag] + 
          (err.params != null && err.params.length ? err.params[0] : "");
      }
   };
}]);

app.directive('cnvSummary', [function() {
   return {
      restrict: 'E',
      scope: {
         cnv: "=toSummarize",
         delconvo: "&",
         editconvo: "&",
         uzer: "@"
      },
      template: '<a href="#" ui-sref="cnvDetail({cnvId:{{cnv.id}}})">' +
       '{{cnv.title}} {{cnv.lastMessage | date : "medium"}}</a>' + 
       '<button type="button" class="btn btn-default btn-sm pull-right" ' +
       'ng-show="uzer && uzer == cnv.ownerId" ng-click="delconvo()">' +
       '<span class="glyphicon glyphicon-trash"></span></button>' +
       '<button type="button" class="btn btn-default btn-sm pull-right" ' + 
       'ng-show="uzer && uzer == cnv.ownerId" ng-click="editconvo()">' +
       '<span class="glyphicon glyphicon-edit"></span></button>'

   };
}]);

app.directive('msgSummary', [function() {
   return {
      restrict: 'E',
      scope: {
         msg: "=toSummarize"
      },
      template: '<div class="msg-header">{{msg.whenMade | date : "medium"}} '
       + 'by {{msg.email}}</div> <div>{{msg.content}}</div>'
   };
}]);
