/* global angular, document, window */
'use strict';

angular.module('app.controllers', [])

.controller('AppCtrl', function($scope, $timeout, SecuredPopups, $cordovaNativeAudio, $ionicModal, $ionicSlideBoxDelegate, $rootScope, $q, $ionicPopover, MainService) {

    $scope.checkConnection = function(scope){
        $rootScope.$on("connectionFound", function(){scope.doRefresh();});        
    }
  
    

})

.controller('LoginCtrl', function($scope, $ionicHistory,$rootScope, $timeout, $state, SecuredPopups,AuthService, $ionicLoading) {
    $scope.$on("$ionicView.enter", function () {
       $ionicHistory.clearCache();
       $ionicHistory.clearHistory();
    });          

  
    
    $scope.$on('$ionicView.loaded', function() { //hide splash screen if user is supposed to be on login page, otherwise let the home ctrl deal with it       
      ionic.Platform.ready( function() {
        AuthService.userIsLoggedIn().then(function(response){$state.go('app.home')},function(response){
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}  
        });            
                       
      });
    });    
    
    
    
})


.controller('HomeCtrl', function($scope,  $state,$ionicSideMenuDelegate,$cordovaSocialSharing,$rootScope, $ionicPopover,ionicDatePicker,SecuredPopups, $timeout, $interval, $ionicModal, $ionicLoading, ionicMaterialInk, MainService, DiaryService) {
    //$ionicLoading.show({template: 'Loading...'});   
  
    $scope.$parent.checkConnection($scope);
 

    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    });  

 
 
 });