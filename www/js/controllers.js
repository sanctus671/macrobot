/* global angular, document, window */
'use strict';

angular.module('app.controllers', [])

.controller('AppCtrl', function($scope, $timeout, SecuredPopups, $cordovaNativeAudio, $ionicModal, $ionicSlideBoxDelegate, $rootScope, $q, $ionicPopover, MainService) {

    $scope.checkConnection = function(scope){
        $rootScope.$on("connectionFound", function(){scope.doRefresh();});        
    }
  
    

})

.controller('LoginCtrl', function($scope, $ionicHistory,$rootScope, $timeout, $state, SecuredPopups,AuthService, $ionicLoading) {
    $scope.currentForm = "login";
    $scope.error = {
        login:[],
        register:[],
        forgotpassword:[]
    };
    $scope.user = {email:"", password:"", confirm_password:""}

    $scope.login = function(){
        AuthService.login($scope.user).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.error.login = "";
            $state.go("app.home");
        },function(data){
            console.log(data);
            if (data.error && data.error.errors){
                $scope.error.login = data.error.errors;
            }
            else{
                $scope.error.login = [["Invalid email or password."]];
            }
        });
    }
    
    $scope.register = function(){
        AuthService.register($scope.user).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.error.register = [];            
            $state.go("app.home");
        },function(data){
            console.log(data);
            if (data.error && data.error.errors){
                $scope.error.register = data.error.errors;
            }
            else{
                $scope.error.register = [["Invalid registration."]];
            }
        })
    }
    
    $scope.resetPassword = function(){
        AuthService.recoverPassword($scope.user.email).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.error.register = [];              
            $scope.currentForm = 'login';
        },function(data){
            console.log(data);
            if (data.error && data.error.errors){
                $scope.error.forgotpassword = data.error.errors;
            }
            else{
                $scope.error.forgotpassword = [["Invalid email."]];
            }
        })
    }
    
    $scope.$on('$ionicView.loaded', function() { //hide splash screen if user is supposed to be on login page, otherwise let the home ctrl deal with it       
      ionic.Platform.ready( function() {
        AuthService.userIsLoggedIn().then(function(response){$state.go('app.home')},function(response){
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}  
        });            
                       
      });
    });    
    
    
    
})


.controller('HomeCtrl', function($scope,  $state,$ionicSideMenuDelegate,$cordovaSocialSharing,AuthService,$rootScope, $ionicPopover,ionicDatePicker,SecuredPopups, $timeout, $interval, $ionicModal, $ionicLoading) {
    //$ionicLoading.show({template: 'Loading...'});   
  
    $scope.$parent.checkConnection($scope);
 

    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    });  
    
    
    $scope.logout = function(){
        AuthService.logout().then(function(){
            $state.go("login");
        });
    }

 
 
 });