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
    })
    .state('chat', {
      url: '/chat',
      templateUrl: 'partials/common/chat.html',
    })
    .state('upload', {
      url: '/upload',
      templateUrl: 'partials/testFiles/uploadTest.html',
      controller: 'uploadCtrl as ctrl',
    })
    .state('ckEditor', {
      url: '/ckEditor',
      templateUrl: 'partials/testFiles/ckEditor.html',
      controller: 'ckEditorCtrl as ctrl',
    })
    .state('trixEditor', {
      url: '/trixEditor',
      templateUrl: 'partials/testFiles/trixEditor.html',
      controller: 'trixEditorCtrl as ctrl',
    })
    .state('carousel', {
      url: '/carousel',
      templateUrl: 'partials/testFiles/carousel.html',
      controller: 'CarouselDemoCtrl as ctrl',
    });


  $urlRouterProvider.otherwise('/login');


});

app.run(function ($transitions, $rootScope, $auth, $state, $window, StorageFactory) {

  var prevState = '';
  $transitions.onEnter({}, function (transition, state) {
    ////console.log("Entered " + state.name + " module while transitioning to " + transition.to().name + " from " + transition.from().name);
    prevState = transition.from().name;
    window.scrollTo(0, 0);
  }),
    $transitions.onStart({}, function (trans) {
      var requiredLogin = true;
      console.log("window.location : " + JSON.stringify(window.location));
      console.log("Transitioning to " + trans.to().name + " from " + trans.from().name);
      //var stateTo = trans.to().defaultSubstate;

      if (requiredLogin && !$auth.isAuthenticated()) {
        console.log('RUN - is NOT authenticated');
        StorageFactory.setURI(window.location.href);
        $state.go('login');
      } else {
        //console.log('RUN - is authenticated');
      }
    })
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
