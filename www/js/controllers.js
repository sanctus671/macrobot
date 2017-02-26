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
    
    
    $scope.profileStats = {};
    $scope.openProfile = function(){
        MainService.getProfileStats().then(function(data){
            $scope.profileStats = data;
        });
        $scope.accountModal.show();
    }
    
    $scope.saveProfile = function(){
        $scope.accountModal.hide();
        $rootScope.user.profile.email = $rootScope.user.email;
        if ($rootScope.user.new_password){$rootScope.user.profile.new_password = $rootScope.user.new_password;}
        MainService.updateProfile($rootScope.user.profile).then(function(){
            $rootScope.user.new_password = "";
        })
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
            $scope.slider.slideTo($scope.goals.indexOf($rootScope.user.goal.goal), 0);if ($scope.slider.activeIndex === $scope.goals.indexOf($rootScope.user.goal.goal)){$scope.saveGoal = true;}
            $scope.progressBar.current = moment().diff(moment().isoWeekday($scope.dayOfWeekAsInteger($rootScope.user.profile.calc_day)).day($rootScope.user.profile.calc_day), 'days');
              if ($scope.progressBar.current < 0){
                $scope.progressBar.current = moment().diff(moment().isoWeekday($scope.dayOfWeekAsInteger($rootScope.user.profile.calc_day)).day($rootScope.user.profile.calc_day).subtract(1, 'week'), 'days');
              }
            $scope.$broadcast('scroll.refreshComplete');
            
        })
    }
    
    $rootScope.$on("userDataSet", $scope.doRefresh());
    
    
    
    $scope.slider = {};
    $scope.saveGoal = true;
    $scope.goals = ["Cut Aggressively", "Cutting", "Maintaining", "Bulking", "Bulk Aggressively"];    
    
    $scope.goalSlideOptions = {
      slidesPerView:3,
      centeredSlides:true,
      pagination:false,
      onInit: function(slider){
        $scope.slider = slider;
        $scope.saveGoal = false;
        if ($rootScope.user){$scope.slider.slideTo($scope.goals.indexOf($rootScope.user.goal.goal), 0);if ($scope.slider.activeIndex === $scope.goals.indexOf($rootScope.user.goal.goal)){$scope.saveGoal = true;}
            $scope.progressBar.current = moment().diff(moment().isoWeekday($scope.dayOfWeekAsInteger($rootScope.user.profile.calc_day)).day($rootScope.user.profile.calc_day), 'days');
              if ($scope.progressBar.current < 0){
                $scope.progressBar.current = moment().diff(moment().isoWeekday($scope.dayOfWeekAsInteger($rootScope.user.profile.calc_day)).day($rootScope.user.profile.calc_day).subtract(1, 'week'), 'days');
              }
            $scope.weighIn = $rootScope.user.bodyweight ? $rootScope.user.bodyweight.weight : "";
        }          
      },
      onSlideChangeEnd: function(slider){
            if ($scope.saveGoal){MainService.createGoal($scope.goals[slider.activeIndex]).then(function(){
                    $scope.doRefresh();
            });}
            $scope.saveGoal = true;          
      }
    }    
    


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
    
    $scope.dayOfWeekAsInteger = function(day) {
      return ["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday", "Sunday"].indexOf(day);
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
                    MainService.updateProfile($rootScope.user.profile).then(function(){
                        console.log($rootScope.user.profile);
                        if ($rootScope.user.profile.handle_data){
                            
                            $rootScope.user.profile.handle_data = null;
                        }
                        $scope.doRefresh();
                    });
                }
                
            }); 
        
    }   
    
    
    $scope.openEditMacros = function(){
        $scope.popupMacros = angular.copy($rootScope.user.macros);
        $scope.oldPopupMacros = angular.copy($scope.popupMacros);
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
                    MainService.createMacros($scope.popupMacros);
                }
                
            }); 
    }   
    
    $scope.rangeAddMacro = function(index,amount){
        $scope.popupMacros[index] = parseFloat($scope.popupMacros[index]) + amount;
        $scope.adjustMacros(index,amount);
       
    }
    
    $scope.adjustMacros = function(index,amount){
        
        if (!amount){
            amount = parseFloat($scope.popupMacros[index]) -  $scope.oldPopupMacros[index];
        }
        
        console.log(amount);
        
        if (index === "carbohydrates" || index === "protein"){
            $scope.popupMacros["calories"] = parseFloat($scope.popupMacros["calories"]) + (amount*4);
        }
        else if (index === "fat"){
            $scope.popupMacros["calories"] = parseFloat($scope.popupMacros["calories"]) + (amount*9);
        }
        else if (index === "calories"){
            $scope.popupMacros["carbohydrates"] = parseFloat($scope.popupMacros["carbohydrates"]) + (amount / 4);
        }
        else if (index === "activity_sessions"){
            $scope.popupMacros["carbohydrates"] = parseFloat($scope.popupMacros["carbohydrates"]) + (((amount*$scope.popupMacros["activity"]) / 7) / 4);
            $scope.popupMacros["calories"] = parseFloat($scope.popupMacros["calories"]) + ((amount*$scope.popupMacros["activity"]) / 7);
        }  
        else if (index === "activity"){
            $scope.popupMacros["carbohydrates"] = parseFloat($scope.popupMacros["carbohydrates"]) + (((amount*$scope.popupMacros["activity_sessions"]) / 7) / 4);
            $scope.popupMacros["calories"] = parseFloat($scope.popupMacros["calories"]) + ((amount*$scope.popupMacros["activity_sessions"]) / 7);
        }    
        
        $scope.oldPopupMacros = angular.copy($scope.popupMacros);
        
    }
    
    
    
    
    $ionicModal.fromTemplateUrl('templates/modals/calendar.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.calendarModal = modal;
      });     

    $scope.openCalendar = function(){
        $scope.calendarModal.show().then(function(){
            $scope.calendarSlider.slider.slideTo(1, 0);
        });
        
    }    


    $scope.weightObject = {
            last_week:[
                {
                    day:"Monday",
                    weight:160,
                    unit:"lbs"
                },
                {
                    day:"Tuesday",
                } ,
                {
                    day:"Wednesday",
                    weight:165,
                    unit:"lbs"
                } ,
                {
                    day:"Thursday",
                    weight:161,
                    unit:"lbs"
                } ,
                {
                    day:"Friday",
                    weight:163,
                    unit:"lbs"
                } ,
                {
                    day:"Saturday",
                    weight:160,
                    unit:"lbs"
                } ,
                {
                    day:"Sunday",
                    weight:161,
                    unit:"lbs"
                }                        
            ],
            this_week:[
                {
                    day:"Monday",
                    weight:161,
                    unit:"lbs"
                },
                {
                    day:"Tuesday",
                } ,
                {
                    day:"Wednesday",
                    weight:163,
                    unit:"lbs"
                } ,
                {
                    day:"Thursday",
                    weight:162,
                    unit:"lbs"
                } ,
                {
                    day:"Friday",
                    weight:163,
                    unit:"lbs"
                } ,
                {
                    day:"Saturday",
                    weight:164,
                    unit:"lbs"
                } ,
                {
                    day:"Sunday",
                    weight:162,
                    unit:"lbs"
                }                 
                
            ],
            
        };
    
    $scope.weights = [];
    
    for (var x = 1; x < 4; x++){
        $scope.weights.push(angular.copy($scope.weightObject));
    }

    $scope.calendarSlider = {
        options:{
            observer:true,
            pagination:false,
            onInit: function(slider){
                $scope.calendarSlider.slider = slider;               
                console.log("sliding to 1");
                $scope.calendarSlider.slider.slideTo(1, 0);
            },
            onSlideChangeStart: function(slider){
                //get weights for this week if not retreived already   
                console.log($scope.calendarSlider.slider.activeIndex);
                if ($scope.calendarSlider.slider.activeIndex === ($scope.calendarSlider.slider.slides.length - 1)){
                    var newObject = angular.copy($scope.weightObject);
                    $scope.weights.push(newObject);
                    $scope.calendarSlider.slider.appendSlide($scope.buildPage(newObject )); 
                    //need to get next weeks weights if there are any
                }    
                else if ($scope.calendarSlider.slider.activeIndex === 0){
                    var newObject = angular.copy($scope.weightObject);
                    $scope.weights.unshift(newObject );
                    $scope.calendarSlider.slider.prependSlide($scope.buildPage(newObject ));
                    //need to get previous weeks weights if there are any
                }                 
            }            
        },
        slider:{}
    }
    
    $scope.buildPage = function(weightObject){
        var html = '<div class="swiper-slide"><div class="box weight-lists"> \
         <div class="row"> \
         <div class="col"> \
         <ul class="list last-week"> ';
         
         for (var index in weightObject.last_week){
            var day = weightObject.last_week[index];
            html = html + '<li class="item">\
                <span class="weight-day">Last ' + day.day + '</span>\
                <span class="weight-number">' + (day.weight ? day.weight : '') + (day.unit ? day.unit: '') + '</span>\
            </li>';
        }
        html = html + '</ul></div><div class="col">';   
        
        for (var index in weightObject.this_week){
            var day = weightObject.this_week[index];
            html = html + '<li class="item">\
                <span class="weight-day">' + day.day + '</span>\
                <span class="weight-number">' + (day.weight ? day.weight : '') + (day.unit ? day.unit: '') + '</span>\
            </li>';
        }
        html = html + '</ul></div></div></div></div>';      
        
        return html;

    }
    
    $scope.changeDay = function(direction){
        console.log($scope.calendarSlider.slider);
        if (direction === 1){
            $timeout(function(){$scope.calendarSlider.slider.slideNext()})
        }
        else if(direction === -1){           
            $timeout(function(){$scope.calendarSlider.slider.slidePrev()})
        }
    }
    
    $scope.goalInline = function(differance){
        if (!$rootScope.user){return 0;}
        //differance is: last week weight - this weeks weight
        if ($rootScope.user.goal.goal === "Maintaining" && (differance > 0 || differance < 0)){
            return -1;
        }
        else if ($rootScope.user.goal.goal.indexOf("Cut") > -1){
            if (differance < 0){
                return 1;
            }
            else if (differance > 0){
                return -1
            }
            return 0;
        }
        else if ($rootScope.user.goal.goal.indexOf("Bulk") > -1){
            if (differance < 0){
                return -1;
            }
            else if (differance > 0){
                return 1
            }
            return 0;            
        }
        
        return 1;
    }



    $scope.formatCalendarDate = function(){
        return moment().calendar(null, {
            sameDay: '[This Week]',
            nextDay: '[This Week]',
            nextWeek: '[Next Week]',
            lastDay: '[This Week]',
            lastWeek: '[Last Week]',
            sameElse: '[Week Starting] DD/MM/YYYY'
        });
    }  
    
    
    $scope.bwChartConfig = {
        options: {
            chart: {
                type: 'line',
                zoomType: 'x',
                resetZoomButton: {
                    position: {
                        align: 'right', // right by default
                        verticalAlign: 'top',
                        y: 10
                    },
                    relativeTo: 'chart'
                },                  
                spacingLeft: 0,
                marginLeft:35,
                height:150,
                backgroundColor:"rgba(255,255,255,0)"
            }
        },
        series: [{
            data: [],
            showInLegend: false, 
            name: "Bodyweight",
            color: '#de4223'
        }],
        title: {
            text: null
        },
        yAxis: {title:{text:"Weight"},allowDecimals:false},
        xAxis: {type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                }},
        tooltip: {
            //headerFormat: '<b>{series.name}</b><br>',
            //pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
        },                
        loading: false
    }   
    
    $scope.bwPieChartConfig =   {   
        options:{
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },

        tooltip: {
            pointFormat: 'Total Volume:<b>{point.y:.0f}</b><br>{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        }        
        },
        title: {
            text: null
        },
        series: [{
            name: 'Percentage of total volume',
            colorByPoint: true,
            borderWidth: 0,
            data: []
        }]

    }      
    
    
    var datepickerObjectPopup = {
          titleLabel: 'Copy Sets To Date', //Optional
          todayLabel: 'Today', //Optional
          showTodayButton:true,
          closeLabel: 'Close', //Optional
          setLabel: 'Copy', //Optional
          errorMsgLabel : 'Please select date.', //Optional
          todayButtonType : 'date-picker-button', //Optional
          closeButtonType : 'date-picker-button', //Optional
          setButtonType : 'button-assertive date-picker-button', //Optional
          modalHeaderColor:'bar-positive', //Optional
          modalFooterColor:'bar-positive', //Optional
          templateType:'popup', //Optional
          mondayFirst: true, //Optional
          disabledDates:[], //Optional
          callback: function (val) { //Optional
              if (val){
              }           
          }
        };  
        
    $scope.openDatePicker = function(){
      ionicDatePicker.openDatePicker(datepickerObjectPopup);
    };     
    
    

 
 });