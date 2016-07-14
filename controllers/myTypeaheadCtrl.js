angular.module('myApp').controller('myTypeaheadCtrl', function ($scope, $uibModal) {
    $scope.selected = undefined;

    $scope.contracts = chrome.extension.sendMessage({ cmd: "getcontractnames"}, function (resp) {
        var files = JSON.parse(resp.files);
        var contractnames;
        for (var i = 0; i < files.length; i++) {
            contractnames.push(files[i].name);
        }
        return contractnames;
    });

    //  I think I have to wrap part of the InboxSDK in a directive

    //  this function is typeahead-ctrl 'on select' function
    $scope.openTemplate = function ($item, $model, $label) {
        chrome.extension.sendMessage({ cmd: 'contract_fields', file: $label }, function (resp) {
            var modalInstance = $uibModal.open({
                templateUrl: resp.templateurl,
                controller: 'myTemplateModifierInstanceCtrl',
                windowClass: 'app-modal-window',
                keyboard: true,
                resolve : {
                    templatefields : function () {
                        var stripped_fields = [];
                        var len = resp.fields.length;
                        var fields = resp.fields;
                        for (var i = 0; i < len; i++) {
                            stripped_fields.push(
                                fields[i].replace("{{ ", "").replace(" }}", "")
                            );
                        }
                        return stripped_fields;
                    },
                    contract : function () { return $label; },
                }
            });
        });
    };
})
