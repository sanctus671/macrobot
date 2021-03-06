angular.module('app.services', [])

.service('AuthService', function ($state, ConnectionService, $http, $q, API_URL, OfflineService, $rootScope){
    var AuthService = this;
    this.login = function(data){
        var deferred = $q.defer();
        $http.post(API_URL + "/auth/login", data)
        .success(function(data) {
            console.log(data);
            AuthService.setToken(data.token);
            AuthService.getUserData();
            deferred.resolve(data.token);
            
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    }; 
    this.getUserData = function(noBroadcast){
        var deferred = $q.defer();
        var token = AuthService.getToken();        
        if (!token){deferred.reject("No token");}
        $http.get(API_URL + '/user?token=' + token)
        .success(function(data) {
            console.log(data);
            data.user.profile.age = parseFloat(data.user.profile.age);
            data.user.profile.bodyfat = parseFloat(data.user.profile.bodyfat);
            if (data.user.macros){
                data.user.macros.activity = parseFloat(data.user.macros.activity);
                data.user.macros.activity_sessions = parseFloat(data.user.macros.activity_sessions);
                data.user.macros.calories = parseFloat(data.user.macros.calories);
                data.user.macros.carbohydrates = parseFloat(data.user.macros.carbohydrates);
                data.user.macros.protein = parseFloat(data.user.macros.protein);
                data.user.macros.fat = parseFloat(data.user.macros.fat);
                
            }
            
            if (data.user.last_macros){
                data.user.last_macros.activity = parseFloat(data.user.last_macros.activity);
                data.user.last_macros.activity_sessions = parseFloat(data.user.last_macros.activity_sessions);
                data.user.last_macros.calories = parseFloat(data.user.last_macros.calories);
                data.user.last_macros.carbohydrates = parseFloat(data.user.last_macros.carbohydrates);
                data.user.last_macros.protein = parseFloat(data.user.last_macros.protein);
                data.user.last_macros.fat = parseFloat(data.user.last_macros.fat);
                
            }            
            
            var userData = data.user;
            
            $rootScope.user = userData;
            console.log(data);
            AuthService.setUser(userData);
            if (!noBroadcast){$rootScope.$broadcast("userDataSet");}
            deferred.resolve(data.user);
        })
        .error(function(data) {
            if (data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            deferred.reject(data);
        });

        return deferred.promise;                 
    }

    this.register = function(data){
        var deferred = $q.defer();
        $http.post(API_URL + "/auth/signup", data)
        .success(function(data) {
            AuthService.setToken(data.token);     
            AuthService.getUserData();
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };
    
    this.userIsLoggedIn = function(){
        var deferred = $q.defer(),  
            AuthService = this,
            user = AuthService.getToken();
        if (user){
            deferred.resolve(user);           
        }
        else{
            deferred.reject("No user saved");
        }
        return deferred.promise;
    }    
     
    this.recoverPassword = function(email){
        var deferred = $q.defer();
        $http.post(API_URL + '/auth/recovery',{"email":email})
        .success(function(data) {
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    } 
    this.recoverPasswordReset = function(password, token){
        
        var deferred = $q.defer();
        if (!token){deferred.reject("No token");}  
        $http.post(API_URL + '/auth/recoveryreset?token=' + token,{"password":password})
        .success(function(data) {
            AuthService.setToken(data.token);
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    }   
    
    this.resetPassword = function(data){
        
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        data["token"] = token;
        $http.post(API_URL + '/auth/reset?token=' + token,data)
        .success(function(data) {
            AuthService.setToken(data.token);
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    } 
 
    this.logout = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}   
        console.log(token);
        $http.post(API_URL + "/auth/logout?token=" + token)
        .success(function(data) {
            AuthService.removeToken();
            AuthService.removeUser();
            $rootScope.user = null;            
            deferred.resolve(data);
        })
        .error(function(data) {
            AuthService.removeToken();
            AuthService.removeUser();
            $rootScope.user = null;            
            deferred.reject(data);
        });
          

        

        return deferred.promise;         
    }
    
    this.setToken = function(token){
        window.localStorage.mb_user_token = JSON.stringify(token);
        
    }
    this.getToken = function(){
        var data = window.localStorage.mb_user_token ? JSON.parse(window.localStorage.mb_user_token) : null;
        return data;        
    }
    this.removeToken = function(){
        window.localStorage.mb_user_token = null;
    }
    
    this.setUser = function(user){
        window.localStorage.mb_user = JSON.stringify(user);
    }
    this.getUser = function(){
        var data = window.localStorage.mb_user ? JSON.parse(window.localStorage.mb_user) : null;
        return data;
    }
    this.removeUser = function(){
        window.localStorage.mb_user = null;
    } 
   
})


.service('MainService', function (ConnectionService, $http, $q, $rootScope,API_URL, $timeout, AuthService, OfflineService){


    this.getProfileStats = function(){
        console.log("here");
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        console.log("here");
        $http.get(API_URL + "/profile/stats?token=" + token)
        .success(function(data) {            
            deferred.resolve(data);
        })
        .error(function(data) {
            if (data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            deferred.reject(data);
        });


        return deferred.promise;         
    }              
            
    this.updateProfile = function(profile){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.put(API_URL + "/profiles/"+$rootScope.user.id + "?token=" + token, profile)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["profile"] = data.profile;
            userData["email"] = $rootScope.user.email;
            $rootScope.user.profile = userData["profile"];
            AuthService.setUser(userData);             
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;         
    }  
    
    this.createGoal = function(goal){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.post(API_URL + "/goals?token=" + token, {goal:goal})
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["goal"] = data.goal;
            $rootScope.user = userData;
            AuthService.setUser(userData);             
            deferred.resolve(data.goal);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;           
    }
    
    this.createBodyweight = function(bodyweight){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.post(API_URL + "/bodyweights?token=" + token, bodyweight)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["bodyweight"] = data.bodyweight;
            $rootScope.user = userData;
            AuthService.setUser(userData);             
            deferred.resolve(data.bodyweight);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;           
    }    
    
    this.updateBodyweight = function(bodyweight){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.put(API_URL + "/bodyweights/"+bodyweight.id + "?token=" + token, bodyweight)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["bodyweight"]["weight"] = parseFloat(data.bodyweight.weight);
            AuthService.setUser(userData);             
            deferred.resolve(data.bodyweight);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;         
    }   
    
    
    this.createMacros = function(macros){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.post(API_URL + "/macros?token=" + token, macros)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["last_macros"] = angular.copy(userData["macros"]);
            userData["macros"] = data.macro;
            $rootScope.user["last_macros"] = userData["last_macros"];
            $rootScope.user["macros"] = userData["macros"];
            console.log($rootScope.user);
            AuthService.setUser(userData);             
            deferred.resolve(data.macros);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;         
    }
    
    this.getWeights = function(date, initial){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        $http.get(API_URL + "/bodyweights?token=" + token + "&selected_date=" + date + (initial ? "&limit=3" : ""))
        .success(function(data) { 
            deferred.resolve(data);
        })
        .error(function(data) {
            if (data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            deferred.reject(data);
        });


        return deferred.promise;         
    }  
    
    this.getWeightStats = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        $http.get(API_URL + "/bodyweight/stats?token=" + token)
        .success(function(data) { 
            console.log(data);
            deferred.resolve(data);
        })
        .error(function(data) {
            if (data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            deferred.reject(data);
        });


        return deferred.promise;         
    } 
    
    this.checkAffiliate = function(code){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        $http.get(API_URL + "/affiliates/" + code + "?token=" + token)
        .success(function(data) { 
            console.log(data);
            deferred.resolve(data);
        })
        .error(function(data) {
            if (data && data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            deferred.reject(data);
        });


        return deferred.promise;         
    }
    
    this.createBilling = function(product){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.post(API_URL + "/billings?token=" + token, product)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["permission"] = "paid";
            $rootScope.user = userData;
            AuthService.setUser(userData);             
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;         
    }
    
    
    this.cancelMembership = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}        
        $http.delete(API_URL + "/billings/cancel?token=" + token)
        .success(function(data) {
            var userData = AuthService.getUser();
            userData["permission"] = "free";
            $rootScope.user = userData;
            AuthService.setUser(userData);             
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });


        return deferred.promise;         
    }    
    
})


.service('ConnectionService', function ($http, $ionicLoading, $rootScope,$interval, API_URL, OfflineService){
    var offlineMode = false;
    var promise = null;
    var ConnectionService = this;
    var testRequest = function(){
        $http.post(API_URL + "/test")    
            .success(function(data) {
                if (promise){$interval.cancel(promise);promise = null;}  
                document.body.classList.remove("offline-mode");

                OfflineService.doRequests().then(function(){
                    $rootScope.$broadcast('connectionFound');
                });
                offlineMode = false;
            })            
    }
    
    
    this.checkConnection = function(status){
        $ionicLoading.hide();  
        document.body.classList.add("offline-mode");
        offlineMode = true;
        if (!promise){promise = $interval(testRequest,20000);}   
    }
    
    this.isOfflineMode = function(){
        return offlineMode;
    }
    
 
    document.addEventListener("offline", onOffline, false);
    function onOffline() {
       ConnectionService.checkConnection()
    }  

    document.addEventListener("online", onOnline, false);
    function onOnline() {
        if (ConnectionService.isOfflineMode()){
            testRequest();
        }
    }    

    
    
})

.service('OfflineService', function ($http,$interval, $q, API_URL, $rootScope, $cordovaSQLite){
    
    var OfflineService = this;
    this.getRequests = function(request){
        var data = window.localStorage.mb_offline ? JSON.parse(window.localStorage.mb_offline) : [];
        return data;        
    }     
    this.storeRequest = function(request){
        var requests = OfflineService.getRequests();
        request.requestid = requests.length < 1 ? 1 : parseInt(requests[requests.length - 1].requestid) + 1;
        requests.push(request);
        window.localStorage.mb_offline = JSON.stringify(requests);
        return request.requestid;
    }
    this.updateRequest = function(request, requestid){
        var requests = OfflineService.getRequests();
        delete request.action; delete request.id; delete request.controller;
        for (var index in requests){
            if (requests[index].requestid === requestid){
                for (var key in request){
                    if (request[key]){
                        requests[index][key] = request[key];
                    }
                }
            }
        }
        window.localStorage.mb_offline = JSON.stringify(requests);
    }   
    this.removeRequest = function(requestid){
        var requests = OfflineService.getRequests();
        for (var index in requests){
            if (requests[index].requestid === requestid){
                requests.splice(index, 1);
            }
        }  
        window.localStorage.mb_offline = JSON.stringify(requests);
    }  
    
    this.doRequests = function(){
        var deferred = $q.defer(); 
        var requests = OfflineService.getRequests();
        var index = 0;
        var interval = $interval(function(){  
            if (index >= requests.length){
                $interval.cancel(interval);
                deferred.resolve();
            }
            else{
                OfflineService.submitRequest(requests[index], index)
                index +=1;
            }

        },100);     
        return deferred.promise; 
    }  
    
    this.submitRequest = function(request, index){
        var deferred = $q.defer(); 
        $http.post(API_URL, request)   
            .success(function(data) {      
                    OfflineService.removeRequest(request["requestid"]);
                    if (data.success === true){
                        deferred.resolve(data);
                    }
                    else{
                        deferred.reject();
                    }
                })
            .error(function(data,status) {
                deferred.reject();
            });  
        return deferred.promise;     
    }  
    
    this.getOfflineData = function(key){ 
        var deferred = $q.defer(); 
        if (!$rootScope.db){deferred.reject();}
        else{
            var query = "SELECT * FROM offlineData WHERE action = ?";
            $cordovaSQLite.execute($rootScope.db, query, [key]).then(function(res) {
                if(res.rows.length > 0) {
                    deferred.resolve(JSON.parse(res.rows.item(0).data));
                } else {
                    deferred.reject();
                }
            }, function (err) {
                console.error(err);
                deferred.reject();
            });  
        }
        return deferred.promise;
    }
    
    this.storeOfflineData = function(key,data){
        if (!$rootScope.db){return;}
        var data = JSON.stringify(data);
        
        var query = "INSERT OR REPLACE INTO offlineData (action,data) VALUES (?,?)";
        $cordovaSQLite.execute($rootScope.db, query, [key, data]).then(function(res) {

        }, function (err) {
            console.error(err);
        });        
    }
    
    this.clearOfflineData = function(){
        if (!$rootScope.db){return;}
        var query = "DELETE FROM offlineData";
        $cordovaSQLite.execute($rootScope.db, query).then(function(res) {
        }, function (err) {
            console.error(err);
        });
    }
    
   
    
})

.factory('SecuredPopups', [
        '$ionicPopup',
        '$q',
        function ($ionicPopup, $q) {

            var firstDeferred = $q.defer();
            firstDeferred.resolve();

            var lastPopupPromise = firstDeferred.promise;

            return {
                'show': function (method, object) {
                    var deferred = $q.defer();

                    lastPopupPromise.then(function () {
                        $ionicPopup[method](object).then(function (res) {
                            deferred.resolve(res);
                        });
                    });

                    lastPopupPromise = deferred.promise;

                    return deferred.promise;
                }
            };
        },
    ])

;


