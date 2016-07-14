angular.module('myApp').controller('myUploadModalCtrl', function ($scope, $uibModal, $log, $q) {
    chrome.extension.sendMessage({cmd: "uploadmodal_html"}, function (response) {
        $scope.contractTemplates = response.listitems;
        $scope.open = function () {
            var modalInstance = $uibModal.open({
                templateUrl: response.templateurl,
                controller: 'myModalInstanceCtrl',
                windowClass: 'app-modal-window',
                keyboard: true,
            });
        };
    });
});