angular.module('myApp').factory('InboxSDKLoader', ['$q', '$rootScope', '$window', function ($q, $rootScope, $window) {
  //  is this the appropriate place for $rootScope.$apply?
  var deferred = $q.defer();
  $rootScope.$apply(function () {
    $window.InboxSDK.load('1.0', 'sdk_APPLEFAPPLE_98d35548c0')
      .then(function (sdk) {
        SdkService.get = sdk;
        deferred.resolve();
      });
  });
  
  return deferred.promise;
}]);
