
app.config(['$stateProvider', '$urlRouterProvider', '$qProvider',
   function($stateProvider, $router, $qProvider) {

      //redirect to home if path is not matched
      $router.otherwise("/");
       // $qProvider.errorOnUnhandledRejections(false);

      $stateProvider
      .state('home',  {
         url: '/',
         templateUrl: 'Home/home.template.html',
         controller: 'homeController',
      })
      .state('login', {
         url: '/login',
         templateUrl: 'Login/login.template.html',
         controller: 'loginController',
      })
      .state('register', {
         url: '/register',
         templateUrl: 'Register/register.template.html',
         controller: 'registerController',
      })
      .state('cnvOverview', {
         url: '/cnvs',
         templateUrl: 'Conversation/cnvOverview.template.html',
         controller: 'cnvOverviewController',
         resolve: {
            cnvs: ['$q', '$http', function($q, $http) {
               return $http.get('/Cnvs')
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      })
      .state('myCnvs', {
         url: '/myCnvs/{ownerId}', 
         templateUrl: 'Conversation/myCnv.template.html',
         controller: 'myCnvOverviewController',
         resolve: {
            cnvs: ['$q', '$http', '$rootScope', 
             function($q, $http, $rootScope) {
               return $http.get('/Cnvs?owner=' + $rootScope.user.id)
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      })
      .state('cnvDetail', {
         url: '/cnvs/{cnvId}',
         templateUrl: 'Conversation/cnvDetail.template.html',
         controller: 'cnvDetailController',
         resolve: {
            title: ['$q', '$http', '$stateParams', 
             function($q, $http, $stateParams) {
               return $http.get('/Cnvs/' + $stateParams.cnvId)
               .then(function(response) {
                  return response.data.title;
               });
            }],

            msgs: ['$q', '$http', '$stateParams', 
             function($q, $http, $stateParams) {
               return $http.get('/Cnvs/' + $stateParams.cnvId + '/Msgs')
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      });
   }]);
