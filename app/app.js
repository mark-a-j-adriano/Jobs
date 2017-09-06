var underscore = angular.module('underscore', []);
underscore.factory('_', ['$window', function () {
  return $window._;
}]);

var app = angular.module('myApp', [
  'ngAnimate',
  'ngSanitize',
  'ngStorage',
  'ui.router',
  'ngFileUpload',
  'ui.bootstrap',
  'ui.bootstrap.datetimepicker',
  'text-mask',
  'satellizer',
  'toastr',
  'angularjs-dropdown-multiselect',
  'angular.filter',
  'underscore',
  //'isteven-multi-select',  
  //'restangular',
  //'ng.ckeditor',
  'angularTrix',
]);

app.config(function ($stateProvider, $urlRouterProvider, $authProvider) {
  // Google
  $authProvider.google({
    clientId: '822697465821-eu0eg8qv6k1apdcaqabo8qhvvhsd2ahf.apps.googleusercontent.com',
    //redirectUri: window.location.origin,
    //oauthType: '2.0',
    // by default, the redirect URI is http://localhost:5000
    //redirectUri: location.origin + location.pathname
    //redirectUri: window.location.origin,
  });

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'partials/common/login.html',
      controller: 'LoginCtrl as ctrl',
      resolve: {
        cookieActive: function (DataFactory) {
          return DataFactory.getCurrentUser();
        },
        devUserList: function (DataFactory) {
          return DataFactory.getDevUserList();
        }
      },
    })
    .state('sales', {
      url: '/sales',
      templateUrl: 'partials/dashboard/sales.html',
      controller: 'salesDashCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('designer', {
      url: '/designer',
      templateUrl: 'partials/dashboard/designer.html',
      controller: 'designerDashCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('copywriter', {
      url: '/copywriter',
      templateUrl: 'partials/dashboard/copywriter.html',
      controller: 'copywriterDashCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('coordinator', {
      url: '/coordinator',
      templateUrl: 'partials/dashboard/coordinator.html',
      controller: 'coordinatorDashCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('creative', {
      url: '/creative/:orderID',
      templateUrl: 'partials/creative.html',
      controller: 'creativeCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        },
        orderID: function (DataFactory, $stateParams) {
          return DataFactory.getJobTmpID($stateParams.orderID);
        },
      }
    })
    .state('digital', {
      url: '/digital/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/digital.html',
      controller: 'digitalCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('ooh', {
      url: '/ooh/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/ooh.html',
      controller: 'oohCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('studio', {
      url: '/studio/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/studio.html',
      controller: 'studioCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('classified', {
      url: '/classified/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/classified.html',
      controller: 'classifiedCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('importer', {
      url: '/importer/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/importer.html',
      controller: 'importerCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('radio', {
      url: '/radio/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/radio.html',
      controller: 'radioCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('display', {
      url: '/display/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/display.html',
      controller: 'displayCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    })
    .state('content', {
      url: '/content/:orderID/:orderTitle/:action/:taskID',
      templateUrl: 'partials/artworks/content.html',
      controller: 'contentCTRL as ctrl',
      resolve: {
        currentUser: function (DataFactory) {
          return DataFactory.getCurrentUser();
        }
      }
    });


  $urlRouterProvider.otherwise('/login');


});


app.run(function ($transitions, $rootScope, $auth, $state, $window, StorageFactory) {
  if ($auth.isAuthenticated()) {
    $transitions.onEnter({}, function (transition, state) {
      window.scrollTo(0, 0);
    }),
      $transitions.onStart({}, function (transition) {
      })
  } else {
    StorageFactory.setURI(window.location.href);
    $state.go('login');
  }
});

app.filter('propercase', function () {
  return function (x) {
    var i, c, txt = "";
    if (_.isUndefined(x) || _.isNull(x)) {
      txt = x;
    } else {
      for (i = 0; i < x.length; i++) {
        c = x[i];
        if (i == 0) {
          c = c.toUpperCase();
        }
        txt += c;
      }
    }

    return txt;
  };
});
