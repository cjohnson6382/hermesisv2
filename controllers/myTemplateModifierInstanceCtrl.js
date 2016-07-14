angular.module('myApp').controller('myTemplateModifierInstanceCtrl', function ($scope, $uibModalInstance, templatefields, contract) {
    $scope.fieldList = templatefields;
    $scope.done = function () {
        
        //  needs to be: var newfields = {oldfield: newfield, oldfield: newfield};
        var newfields = {};

        //  no document.querySelector: use one-way binds instead *************
        for (i = 0; i < $scope.fieldList.length; i++) {
            newfields[$scope.fieldList[i]] = document.querySelector('#' + $scope.fieldList[i]).value;
        }
        
        console.log("newfields: ", newfields);

        chrome.extension.sendMessage({ cmd : "fillintemplate", template : contract, userfields: newfields }, function (res) {
            var response = res;

            //  this is a general purpose function and should go into a util file ****************
            function dataURLtoBlob(dataurl, onend) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                onend(new Blob([u8arr], {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
            }
            
            dataURLtoBlob(response.file, function (blob) {
                blob.lastModifiedDate = new Date();
                blob.name = response.filename;

                //  why are these things here? I can presumably set them anywhere; they should be somewhere my global and more obvious ***************
                InboxComposeView.on('destroy', function (event) {
                    console.log('attached files has been destroyed', event);
                });

                //  blob.name = response.filename;
                InboxComposeView.attachFiles([blob]);
            });
            //  can probably put the attach in the close here? or make the close.then() into the attach, to keep the InboxCompose stuff out of the controllers
            $uibModalInstance.close('closing the modal after attaching a file');
        });
    };
    
    $scope.cancel = function () { $uibModalInstance.dismiss('cancel') };
})
