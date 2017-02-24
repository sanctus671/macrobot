/* global angular, document, window */
'use strict';

angular.module('app.directives', [])

.directive("fileread", ['$cordovaFile', function ($cordovaFile) {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    var fileName = changeEvent.target.files[0].name;
                    $cordovaFile.writeFile(cordova.file.dataDirectory, fileName, loadEvent.target.result, true)
                        .then(function (result) {
                        }, function (err) {
                        });
                    scope.$apply(function () {
                        scope.fileread = cordova.file.dataDirectory + fileName;
                    });
                }
                reader.readAsArrayBuffer(changeEvent.target.files[0]);
            });
        }
    }
}])

.directive('ngMin', function() {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMin, function watchNgMin(value) {
          element.attr('min', value);
          ngModelController.$render();
        })
      }
    }
  }
})
.directive('ngMax', function() {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMax, function watchNgMax(value) {
          element.attr('max', value);
          ngModelController.$render();
        })
      }
    }
  }
})
