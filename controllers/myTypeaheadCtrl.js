angular.module('myApp').controller('myTypeaheadCtrl', function ($scope, $uibModal) {
    $scope.selected = undefined;
    $scope.contracts = [];
    var contractIdLookupTable = {};
    chrome.extension.sendMessage({cmd: "template_modifier"}, function (response) {
        var contractlist = JSON.parse(response.files);
        for (var i = 0; i < contractlist.length; i++) {
            $scope.contracts.push(contractlist[i].name);
            contractIdLookupTable[contractlist[i].name] = contractlist[i].id;
        }
    });

    $scope.openTemplate = function ($item, $model, $label) {
        chrome.extension.sendMessage({ cmd : 'contract_fields', file : contractIdLookupTable[$item] }, function (response) {
            var modalInstance = $uibModal.open({
                templateUrl: response.templateurl,
                controller: 'myTemplateModifierInstanceCtrl',
                windowClass: 'app-modal-window',
                keyboard: true,
                resolve : {
                    templatefields : function () {
                        var stripped_fields = [];
                        var len = response.fields.length;
                        var fields = response.fields;
                        for (var i = 0; i < len; i++) {
                            stripped_fields.push(fields[i].replace("{{ ", "").replace(" }}", ""));
                        }
                        return stripped_fields;
                    },
                    contract : function () { return contractIdLookupTable[$item]; },
                }
            });
        });
    };
})