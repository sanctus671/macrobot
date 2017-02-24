/* global angular, document, window */
'use strict';

angular.module('app.controllers', [])

.controller('AppCtrl', function($scope, $timeout, SecuredPopups, AuthService, $state, $cordovaNativeAudio, $ionicHistory, $ionicModal, $ionicSlideBoxDelegate, $rootScope, $q, $ionicPopover, MainService) {

    $scope.checkConnection = function(scope){
        $rootScope.$on("connectionFound", function(){scope.doRefresh();});        
    }
    
    $ionicModal.fromTemplateUrl('templates/modals/help.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.helpModal = modal;
      });      
    
    $scope.openHelp = function(){
        $scope.helpModal.show();
    }
    
    $ionicModal.fromTemplateUrl('templates/modals/account.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.accountModal = modal;
      });     
    
    $scope.openProfile = function(){
        $scope.accountModal.show();
       
        
    }
    
    $scope.logout = function(){
        console.log("here");
        AuthService.logout().then(function(){
            console.log("here");
            $scope.accountModal.hide();
            $state.go("login");
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();            
        },function(){
            console.log("here");
            $state.go("login");
        });         
    }
  
    

})

.controller('LoginCtrl', function($scope, $ionicHistory,$rootScope, $timeout, $state, SecuredPopups,AuthService, $ionicLoading, MainService) {
    $scope.form = {currentForm:"login"};
    $scope.error = {
        login:[],
        register:[],
        forgotpassword:[]
    };
    $scope.user = {email:"", password:"", confirm_password:""}
    $scope.profile = {first_name:"", last_name:"", avatar:"", gender:"", age:"", bodyfat:"",energy_unit:"kcal",weight_unit:"lbs"}

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
        AuthService.register($scope.user).then(function(data){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.error.register = [];            
            $scope.form.currentForm = 'profile';
            
        },function(data){
            if (data.error && data.error.errors){
                $scope.error.register = data.error.errors;
            }
            else{
                $scope.error.register = [["Invalid registration."]];
            }
        })
    }
    
    $scope.saveProfile = function(){
        $scope.profile.cal_day = moment().format("dddd");
        MainService.updateProfile($scope.profile).then(function(){
            $state.go("app.home");            
        },function(data){
            console.log(data)
        })
    }
    
    $scope.skipProfile = function(){
        $state.go("app.home");
    }
    
    $scope.resetPassword = function(){
        AuthService.recoverPassword($scope.user.email).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.error.register = [];              
            $scope.form.currentForm = 'login';
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


.controller('HomeCtrl', function($scope,  $state,$ionicSideMenuDelegate,$cordovaSocialSharing,AuthService,$rootScope, MainService,$ionicPopover,ionicDatePicker,SecuredPopups, $timeout, $interval, $ionicModal, $ionicLoading) {
    //$ionicLoading.show({template: 'Loading...'});   
  
    $scope.$parent.checkConnection($scope);
    
    $scope.weighIn = "";
 

    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    });  
    
    $scope.doRefresh = function(){
        AuthService.getUserData(true).then(function(){
            $scope.saveGoal = false;
            $scope.slider.slideTo($scope.goals.indexOf($rootScope.user.goal.goal), 0);
            $scope.progressBar.current = moment().diff(moment().day($rootScope.user.profile.calc_day), 'days');
            console.log($rootScope.user);
            $scope.$broadcast('scroll.refreshComplete');
            
        })
    }
    
    $rootScope.$on("userDataSet", $scope.doRefresh());
    
    $scope.goalSlideOptions = {
      slidesPerView:3,
      centeredSlides:true
    }    
    
    $scope.slider = false;
    $scope.saveGoal = true;
    
    $scope.goals = ["Cut Aggressively", "Cutting", "Maintaining", "Bulking", "Bulk Aggressively"];
    
    
    $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
        $scope.slider = data.slider;
        $scope.saveGoal = false;
        if ($rootScope.user){cdata.slider.slideTo($scope.goals.indexOf($rootScope.user.goal.goal), 0);
            $scope.progressBar.current = moment().diff(moment().day($rootScope.user.profile.calc_day), 'days');
            $scope.weighIn = $rootScope.user.bodyweight ? $rootScope.user.bodyweight.weight : "";
        }

    });  
    
    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
        if ($scope.saveGoal){MainService.createGoal($scope.goals[data.slider.activeIndex]);}
        $scope.saveGoal = true;
    });  
    
    $scope.progressBar = {
        color: "#69cf8d",
        max:7,
        current:0
    }
    
    $scope.formatDate = function(macros){
        if (macros){
            return moment(macros.created_at).from(moment());
        }
    }    
    
    
    $scope.openAddWeight = function(){
        $scope.popupWeight = {weight:$rootScope.user.bodyweight ? $rootScope.user.bodyweight.weight : $rootScope.user.last_bodyweight.weight};
        console.log("sdasd");
        SecuredPopups.show('show',{
            templateUrl: 'templates/popups/add-weight.html',
            title: 'Enter Todays Weight',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function(e) {
                    return true;
                }
              }
            ]
          }).then(function(res) {
                if (res){
                    if ($rootScope.user.bodyweight){
                        //update
                        $rootScope.user.bodyweight.weight = parseFloat($scope.popupWeight.weight);
                        MainService.updateBodyweight($rootScope.user.bodyweight);
                    }
                    else{
                        //create
                        MainService.createBodyweight({weight:parseFloat($scope.popupWeight.weight), unit:$rootScope.user.last_bodyweight.unit});
                    }
                }
            });         
    }
    
    $scope.rangeAddWeight = function(amount){
        $scope.popupWeight.weight = parseFloat($scope.popupWeight.weight) + amount;
    }
    
    $ionicModal.fromTemplateUrl('templates/modals/calendar.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.calendarModal = modal;
      });     

    $scope.openCalendar = function(){
        $scope.calendarModal.show();
    }
    
    $scope.openSettings = function(){
        SecuredPopups.show('show',{
            templateUrl: 'templates/popups/settings.html',
            title: 'Settings',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function(e) {
                    return true;
                }
              }
            ]
          }).then(function(res) {
                if (res){
                    MainService.updateProfile($rootScope.user.profile);
                }
                
            }); 
        
    }   
    
    
    $scope.openEditMacros = function(){
        $scope.popupMacros = angular.copy($rootScope.user.macros);
        SecuredPopups.show('show',{
            templateUrl: 'templates/popups/macros.html',
            title: 'Edit Macros',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function(e) {
                    return true;
                }
              }
            ]
          }).then(function(res) {
                if (res){
                    MainService.updateMacros($rootScope.user.macros);
                }
                
            }); 
    }   
    
    $scope.rangeAddMacro = function(index,amount){
        $scope.popupMacros[index] = parseFloat($scope.popupMacros[index]) + amount;
    }
    
    

 
 });