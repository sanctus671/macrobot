/* global angular, document, window */
'use strict';

angular.module('app.controllers', [])

.controller('AppCtrl', function($scope, $timeout, SecuredPopups, AuthService, API_URL, $state, $cordovaNativeAudio, $ionicHistory, $ionicModal, $ionicSlideBoxDelegate, $rootScope, $q, $ionicPopover, MainService) {

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
    
    $scope.useGetFile = function(){
        var photoFunction = $scope.uploadAvatar;
        navigator.camera.getPicture(
                photoFunction,
                function(message){/*alert('Failed: ' + message);*/},
                {
                        quality: 25,
                        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
                }
        )      
    };

    $scope.uploadAvatar = function(imageURI){
          var options = new FileUploadOptions();
          options.fileKey="fileToUpload";
          options.fileName= $rootScope.user.email;
          options.mimeType="image/jpeg";
          options.params = {token:$rootScope.user.sessionid, controller:"create", action:"uploadprogramimage"};
          var ft = new FileTransfer();
          var token = AuthService.getToken();
          ft.upload(imageURI, encodeURI(API_URL + "/upload?token=" + token), function(data){
              $rootScope.user.profile.avatar = data;
          },  
          function(data){          
              SecuredPopups.show('alert',{
              title: 'Error',
              template: 'Sorry, there was an error uploading your image.'
              });
          }, options);		


    };      
  
    

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
                    if ($scope.calendarSlider.modalOpened){
                        $scope.reloadCalendarPage();
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
    
    
    //calendar stuff
    
    $ionicModal.fromTemplateUrl('templates/modals/calendar.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.calendarModal = modal;
      });     

    $scope.weights = [{initialSlide:true},{initialSlide:true},{initialSlide:true}];
    $scope.openCalendar = function(){
        if ($scope.calendarSlider.modalOpened){
            $scope.calendarModal.show();
            return;
        }
        $scope.firstCalendarLoad = true;
        $scope.weights = [{initialSlide:true},{initialSlide:true},{initialSlide:true}];
        $scope.calendarSlider.selectedDate = moment();
        $scope.arrangeDays();
        $scope.calendarModal.show().then(function(){
            var weekId = "initPage2";
            $scope.calendarSlider.modalOpened = true;
            MainService.getWeights($scope.calendarSlider.selectedDate.format("YYYY-MM-DD")).then(function(data){
                var week = $scope.buildWeek(data, weekId);
                $scope.weights[1] = week;
                $scope.buildPage(week);            
                $scope.calendarSlider.slider.slideTo(1, 0);      
            });
        });   
    } 
    
    var datepickerObjectPopup = {
          titleLabel: 'Select Date', //Optional
          todayLabel: 'Today', //Optional
          showTodayButton:true,
          closeLabel: 'Close', //Optional
          setLabel: 'Set', //Optional
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
                $scope.weights = [{initialSlide:true},{initialSlide:true},{initialSlide:true}];
                $scope.firstCalendarLoad = true;
                $scope.calendarSlider.selectedDate = moment(val);
                document.getElementById('initPage1').innerHTML = '';document.getElementById('initPage2').innerHTML = '';document.getElementById('initPage3').innerHTML = '';
                var col_wrapper = document.getElementById("calendar-slider").getElementsByClassName("swiper-slide");
                var len = col_wrapper.length;
                for (var i = 0; i < len; i++) {
                    if (col_wrapper[i].className.toLowerCase() == "loaded-page") {
                        col_wrapper[i].parentNode.removeChild(col_wrapper[i]);
                    }
                }                
                var weekId = "initPage2";
                MainService.getWeights($scope.calendarSlider.selectedDate.format("YYYY-MM-DD")).then(function(data){
                    var week = $scope.buildWeek(data, weekId);
                    $scope.weights[1] = week;
                    $scope.buildPage(week);            
                    $scope.calendarSlider.slider.slideTo(1, 0);      
                });                
              }           
          }
        };  
        
    $scope.changeDay = function(direction){
        $scope.calendarSlider.slider.slideTo($scope.calendarSlider.slider.activeIndex + direction);
    }
        
    $scope.openDatePicker = function(){
        return; //currently not enabled
      ionicDatePicker.openDatePicker(datepickerObjectPopup);
    }; 
    
    $scope.reloadCalendarPage = function(){
        MainService.getWeights(moment().format("YYYY-MM-DD")).then(function(data){
            var week = $scope.buildWeek(data, "initPage2");
            //$scope.weights[1] = week;
            $scope.buildPage(week);  
            console.log("here");
        });          
    }
    
    $scope.arrangeDays = function(){
        $scope.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        var count = $scope.days.indexOf($rootScope.user.profile.calc_day);
        count -= $scope.days.length * Math.floor(count / $scope.days.length)
        $scope.days.push.apply($scope.days, $scope.days.splice(0, count));      
    }    

    $scope.buildWeek = function(data, id){
        var week = {average:0, id:id};
        for (var index in data.selected_week){
            var weight = data.selected_week[index];
            week.average = week.average + weight.weight;
            var day = moment(weight.created_at).format("dddd");
            week[day] = {
                weight:weight.weight,
                time:moment(weight.created_at).format("h:mma"),
                unit:weight.unit,
                differance:0
            }
            for (var index in data.previous_week){
                var previousWeight = data.previous_week[index];
                if (day === moment(previousWeight.created_at).format("dddd")){
                    week[day].differance = previousWeight.weight - weight.weight;
                }
            }
        }
        week.average = data.selected_week.length > 0 ? week.average / data.selected_week.length : 0;   
        
        return week;
    }
    
    $scope.calendarSlider = {
        modalOpened:false,
        selectedDate:false,
        options:{
            observer:true,
            pagination:false,
            onInit: function(slider){
                $scope.calendarSlider.slider = slider;               
                $scope.calendarSlider.slider.slideTo(1, 0);
            },
            onSlideChangeStart: function(slider){
                if ($scope.firstCalendarLoad){$scope.firstCalendarLoad = false;return;}
                if (slider.activeIndex < slider.previousIndex){
                    $scope.calendarSlider.selectedDate = $scope.calendarSlider.selectedDate.subtract(1, 'weeks');
                }
                else if (slider.activeIndex > slider.previousIndex){
                    $scope.calendarSlider.selectedDate = $scope.calendarSlider.selectedDate.add(1, 'weeks');
                }
                
                
                console.log($scope.calendarSlider.selectedDate);
                if(!$scope.$$phase) {$scope.$apply();}
                
                if ($scope.weights[$scope.calendarSlider.slider.activeIndex].initialSlide){
                    $scope.weights[$scope.calendarSlider.slider.activeIndex].initialSlide = false;
                    var weekId = slider.activeIndex < slider.previousIndex ? "initPage1" : "initPage3";
                    var weekIndex = slider.activeIndex < slider.previousIndex ? 0 : 2;
                    MainService.getWeights($scope.calendarSlider.selectedDate.format("YYYY-MM-DD")).then(function(data){
                        var week = $scope.buildWeek(data, weekId);
                        $scope.weights[weekIndex] = week;
                        $scope.buildPage(week);    
                        $scope.addSlide();
                    });
                    return;
                }                
                
                //add the next slide in prep
                $scope.addSlide();
                

                              
            }            
        },
        slider:{}
    }
    
  
    $scope.addSlide = function(){

        var isPrevious = $scope.calendarSlider.slider.activeIndex === 0;
        var isNext = $scope.calendarSlider.slider.activeIndex === ($scope.calendarSlider.slider.slides.length - 1);

        if (isNext || isPrevious){
            var slideDate = isNext ? angular.copy($scope.calendarSlider.selectedDate).add(1, 'weeks') : angular.copy($scope.calendarSlider.selectedDate).subtract(1, 'weeks'); 

            var weekId = "page" + $scope.weights.length;
            MainService.getWeights(slideDate.format("YYYY-MM-DD")).then(function(data){
                var week = $scope.buildWeek(data, weekId);
                if (isNext){
                    $scope.weights.push(week)
                }
                else if (isPrevious){
                    $scope.weights.unshift(week)
                }

                $scope.buildPage(week);
            })
            if (isNext){$scope.calendarSlider.slider.appendSlide('<div id="' + weekId + '" class="swiper-slide loaded-page"></div>');}
            else if (isPrevious){$scope.calendarSlider.slider.prependSlide('<div id="' + weekId + '" class="swiper-slide loaded-page"></div>');}
        }    
    }    
    
    
    
    $scope.buildPage = function(week){
        var html = '<div class="box weight-lists">\
            <ul class="list" >';
                for (var index in $scope.days){
                    var day = $scope.days[index];
                    if (!week[day]){
                        html = html + '<li class="item row">\
                            <div class="col weight-day">\
                                ' + day + '\
                                <div class="weight-hour">No weight</div>\
                            </div>\
                            <div class="col weight-number">\
                                <span>-</span>\
                            </div>\
                            <div class="col weight-differance">\
                                <span>-</span>\
                                <div class="differance-text">\
                                    From last ' + day + '\
                                </div>\
                            </div>\
                        </li>';                        
                    }
                    else{
                        html = html + '<li class="item row">\
                            <div class="col weight-day">\
                                ' + day + '\
                                <div class="weight-hour">' + (week[day].time ? week[day].time : 'No weight') + '</div>\
                            </div>\
                            <div class="col weight-number">\
                                ' + (week[day].weight ? week[day].weight.toFixed(1) : '') + week[day].unit + '\
                                ' + (week[day].weight ? '' : '<span>-</span>') + '\
                            </div>\
                            <div class="col weight-differance ' + (week[day].differance > 0 ? 'goal-positive' : (week[day].differance === 0 ? '' : 'goal-negative')) + '">\
                                ' + (week[day].differance ? week[day].differance.toFixed(1) : '0') + week[day].unit + '\
                                <div class="differance-text">\
                                    From last ' + day + '\
                                </div>\
                            </div>\
                        </li>';
                    }
                }
                
            html = html + '</ul>\
            <div class="average">\
                ' + (week["average"] ? week["average"].toFixed(1) : '0') + $rootScope.user.profile.weight_unit + '\
                <div class="average-text">Weekly Average</div>\
            </div>\
        </div>'; 

        document.getElementById(week.id).innerHTML = html;

    }
 


    $scope.formatCalendarDate = function(){
        if (!$scope.calendarSlider.selectedDate){return;}
        return $scope.calendarSlider.selectedDate.calendar(null, {
            sameDay: '[This Week]',
            nextDay: '[This Week]',
            nextWeek: '[Next Week]',
            lastDay: '[This Week]',
            lastWeek: '[Last Week]',
            sameElse: '[Week Of] DD/MM/YYYY'
        });
    }  
    
    
    //stats stuff
    
    $scope.getStats = function(){
        MainService.getWeightStats().then(function(data){
            console.log(data);
            $timeout(function(){
            $scope.bwChartConfig.series[0].data = $scope.formatStats(data.bodyweights);
            $scope.macroChartConfig.series[0].data = $scope.formatMacroStats(data.macros);
            $scope.energyChartConfig.series[0].data = $scope.formatEnergyStats(data.macros);
            $scope.bwChartConfig.options.chart.width = document.getElementById('graph-tab').offsetWidth - 20;
            $scope.macroChartConfig.options.chart.width = document.getElementById('graph-tab').offsetWidth - 20;
            $scope.energyChartConfig.options.chart.width = document.getElementById('graph-tab').offsetWidth - 20;
        });
        });
    } 
    
    $scope.formatStats = function(data){
        var formatted = [];
        for (var index in data){
            var stat = data[index];
            var date = new Date(stat.created_at);
            formatted.push([date.getTime(), stat.weight]);
        }
        return formatted.sort(function(a, b){
            return a[0] - b[0];
        });
    } 
    
    $scope.formatMacroStats = function(data){
        console.log(data);
        return [
            {name:"Carbohydrates",y:data.carbohydrates},
            {name:"Fat",y:data.fat},
            {name:"Protein",y:data.protein}
        ];
    }   
    
    $scope.formatEnergyStats = function(data){
        var weeklyCardio = data.activity * data.activity_sessions;
        var weeklyEenergy = (data.calories * 7) - weeklyCardio;
        
        return [
            {name:"Base Calories",y:weeklyEenergy},
            {name:"Activity",y:weeklyCardio}
        ];
    }    
    
    $scope.bwChartConfig = {
        options: {
            chart: {
                type: 'line',
                width:300,
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
                backgroundColor:"rgba(255,255,255,0)"
            }
        },
        series: [{
            data: [],
            showInLegend: false, 
            name: "Bodyweight",
            color: '#69cf8d'
        }],
        title: {
            text: null
        },
        credits:{"enabled":false},
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

     Highcharts.getOptions().plotOptions.pie.colors = (function () {
        var colors = [],
            base = '#69cf8d',
            i;

        for (i = 0; i < 10; i += 1) {
            // Start out with a darkened base color (negative brighten), and end
            // up with a much brighter color
            colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
        }
        return colors;
    }());   
    
    $scope.macroChartConfig =   {   
        options:{
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },

        tooltip: {
            pointFormat: '{series.name} (g): <b>{point.y:.0f}</b><br>{series.name}: <b>{point.percentage:.1f}%</b>'
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
        credits:{"enabled":false},
        series: [{
            name: 'Percentage of total macros',
            colorByPoint: true,
            borderWidth: 0,
            data: []
        }]

    }  
    
    $scope.energyChartConfig =   {   
        options:{
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },

        tooltip: {
            pointFormat: '{series.name} (kcal):<b>{point.y:.0f}</b><br>{series.name}: <b>{point.percentage:.1f}%</b>'
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
        credits:{"enabled":false},
        series: [{
            name: 'Percentage of total energy',
            colorByPoint: true,
            borderWidth: 0,
            data: []
        }]

    }     
 
 });