angular.module('myApp').controller('typeaheadCtrl', function ($scope, $uibModal) {
    //  what is this for? anything?
    $scope.selected = undefined;

    $scope.contracts = [
        {name: 'contract a', fields: {derp: 'yar yar', whu: 'haaaay'}},
        {name: 'contract b', fields: {derp: 'nar nar', whu: 'aaaay'}},
        {name: 'contract c', fields: {derp: 'car car', whu: 'saaaay'}}
    ];

    //  this function is typeahead-ctrl 'on select' function

    $scope.openTemplate = function ($item, $model, $label) {
        console.log('template modifier modal opens....');
    };
})
