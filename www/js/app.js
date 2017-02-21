//Intensity copyright 2015

angular.module('app', ['ionic','ionic.service.core', 'app.controllers', 'app.services', 'app.directives', 'app.config', 'ionic-datepicker', 'angularMoment', 'highcharts-ng', 'ngCordova'])

.run(function($ionicPlatform, AuthService, $rootScope, $state, $interval, $cordovaSQLite) {

    
    $ionicPlatform.ready(function() {
        
        $rootScope.devicePlatform = ionic.Platform.platform();

        $rootScope.push = new Ionic.Push({});

        
        AuthService.userIsLoggedIn().then(function(response){
            
            if (!$rootScope.user){
                AuthService.getUserData().then(function(data){
                    $rootScope.user = data;
                    if (window.cordova){
                        $rootScope.push.register(function(token) {

                            $rootScope.push.saveToken(token);  // persist the token in the Ionic Platform
                            if (token){
                                AuthService.saveToken(token.token);
                            }          
                        });   
                    }
                },function(data){});   
            }
            else{
                $rootScope.push.register(function(token) {

                    $rootScope.push.saveToken(token);  // persist the token in the Ionic Platform
                    if (token){
                        AuthService.saveToken(token.token);
                    }          
                });                 
            }

        },function(response){$state.go('login');});        
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            if (ionic.Platform.isAndroid()) {
                StatusBar.backgroundColorByHexString("#000");
                } 
            else {            
                StatusBar.styleDefault();
            }
        }

        if (window.cordova){
            //$cordovaSQLite.deleteDB("offline.db");
            $rootScope.db = $cordovaSQLite.openDB({name: 'offline.db', location: 'default'});
            $cordovaSQLite.execute($rootScope.db, "CREATE TABLE IF NOT EXISTS offlineData (action text unique, data text)");     
        }
        
        
        
    });
    
    $ionicPlatform.on("resume", function(){ 
        window.plugin.notification.local.cancelAll();
        AuthService.userIsLoggedIn().then(function(){},function(){$state.go('login');});
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.close();
        }
        
    });
      

    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
      if (toState.data.authenticate){
          AuthService.userIsLoggedIn().then(function(response){},function(){$state.go('login');});
      }
    });  
    
    
    
    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
        
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.close();
        }        



    });     

    
    $rootScope.$on("connectionFound", function(){
        AuthService.getUserData().then(function(data){
            $rootScope.user = data;
        });        
    })
    
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    // Turn off caching for demo simplicity's sake
   //$ionicConfigProvider.views.maxCache(0);
   $ionicConfigProvider.platform.android.views.maxCache(5);
   //native scrolling on android
   //$ionicConfigProvider.platform.android.scrolling.jsScrolling(false);
    // Turn off back button text
    $ionicConfigProvider.backButton.previousTitleText(false);
    

    $stateProvider
    
    .state('login', {
        url: '/login',
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl',
        data: {
          authenticate: false
        }
    })        
    .state('app', {
        
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    
    .state('app.home', {
        url: '/home',
        views: {
            'menuContent': {
                templateUrl: 'templates/home.html',
                controller: 'HomeCtrl'
            }
        },
        data: {
          authenticate: true
        } 
        
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
})




