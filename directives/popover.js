angular.module('myApp').directive('popover', ['$uibModal', function ($uibModal) {
  return {
    restrict: 'E',
    templateURL: chrome.extension.getURL('html/popover.html'),
    //  templateURL: 'html/popover.html',
    compile: function ($element, $attrs) {
      return function ($scope, $element, $attrs) {
        $scope.contracts = [
          {name: 'contract a', fields: {derp: 'yar yar', whu: 'haaaay'}},
          {name: 'contract b', fields: {derp: 'nar nar', whu: 'aaaay'}},
          {name: 'contract c', fields: {derp: 'car car', whu: 'saaaay'}}
        ];

        $scope.selected = '';
        
        $scope.openTemplate = function ($item, $model, $label) {
            console.log('template modifier modal opens....');
        };
        return;
      };
    },
  };
}]);
