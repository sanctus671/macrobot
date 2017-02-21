angular.module('app.services', [])

.service('AuthService', function ($state, ConnectionService, $http, $q, API_URL, API_KEY, OfflineService){

})


.service('MainService', function (ConnectionService, $http, $q, API_URL, API_KEY, $timeout, AuthService, OfflineService){
    
})


.service('ConnectionService', function ($http, $ionicLoading, $rootScope,$interval, API_URL, API_KEY, OfflineService){
    var offlineMode = false;
    var promise = null;
    var ConnectionService = this;
    var testRequest = function(){
        $http.post(API_URL, {key:API_KEY})    
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


