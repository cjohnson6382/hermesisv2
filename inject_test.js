var InboxComposeView;

angular.module('myApp', ['ngAnimate', 'ui.bootstrap'])
//  templatefields and contract parameters are from the modal constructor's link function
//  .controller('fieldsModalInstCtrl', function ($scope, $uibModalInstance, templatefields, contract) {
.controller('myTemplateModifierInstanceCtrl', function ($scope, $uibModalInstance, templatefields, contract) {
    $scope.fieldList = templatefields;
    $scope.delete = function () {
        chrome.extension.sendMessage({cmd : 'delete_contract', contractname : contract}, function (response) {
            console.log(response);
            $uibModalInstance.dismiss('cancel');
        });
    };

    $scope.done = function () {
        
        //  needs to be: var newfields = {oldfield: newfield, oldfield: newfield};
        var newfields = {};
        for (i = 0; i < $scope.fieldList.length; i++) {
            newfields[$scope.fieldList[i]] = document.querySelector('#' + $scope.fieldList[i]).value;
        }
        
        console.log("newfields: ", newfields);

        chrome.extension.sendMessage({ cmd : "fillintemplate", template : contract, userfields: newfields }, function (res) {
            var response = res;
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

                InboxComposeView.on('destroy', function (event) {
                    console.log('attached files has been destroyed', event);
                });

                //  blob.name = response.filename;
                InboxComposeView.attachFiles([blob]);
            });
            $uibModalInstance.close('closing the modal after attaching a file');
        });
    };
    
    $scope.cancel = function () { $uibModalInstance.dismiss('cancel') };
})
.controller('myTypeaheadCtrl', function ($scope, $uibModal) {
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
.controller('myModalInstanceCtrl', function ($scope, $uibModalInstance) {
	$scope.done = function () {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('drop', false, true);
        document.dispatchEvent(evt);
		$uibModalInstance.close("bye bye");
	};
	$scope.save = function (files) {
        //  disable the 'done' button
        for (i = 0; i < files.length; i++) {
            objURL = URL.createObjectURL(files[i]);
            chrome.extension.sendMessage({cmd : "storetemplate", file : objURL, filename : files[i].name}, function (response) {
                //  when background returns 'stored', activate the 'done' button
                URL.revokeObjectURL(objURL);
                console.log(response);
            });
        }
    };
})
.controller('myUploadModalCtrl', function ($scope, $uibModal, $log, $q) {
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
})
.directive('myUploader', function(){
	return { link: function(scope, element, attrs){
            element.on('dragover', function(event){
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('drop', false, true);
                document.dispatchEvent(evt);
				event.stopPropagation();
				event.preventDefault();
				event.dataTransfer.dropEffect = 'copy';
			});
			element.on('drop', function(event){
				event.stopPropagation();
				event.preventDefault();
				scope.files = event.dataTransfer.files;
				scope.fileList = [];
				for (var i = 0, f; f = scope.files[i]; i++) {
                    if (f.type ==='application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        scope.fileList.push({
                            name: escape(f.name),
                            size: f.size,
                        });
                    } else {
                        console.log('uploaded file is not a docx');
                    }
			  	}
                //  shows a list of the files uploaded
				scope.$apply(function(){scope.filesUploaded = true;});
			});
		}
	};
})
.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'chrome-extension://**'
  ]);
});

var popoverHTML;
var promise = new Promise(function (resolve, reject) {
    chrome.extension.sendMessage({cmd: "popover_html"}, function(response){
        resolve(response);
    });
});

promise.then(function (value) {
    popoverHTML = value;
    InboxSDK.load('1.0', 'sdk_APPLEFAPPLE_98d35548c0').then(function(sdk){
        sdk.Compose.registerComposeViewHandler(function (composeView) {
            InboxComposeView = composeView;
            composeView.addButton({
                title: "Compose Contract",
                hasDropdown: true,
                iconUrl: chrome.extension.getURL('hermesis.ico'),
                type: 'MODIFIER',
                onClick: function (event) {
                    var evt = event;
                    chrome.extension.sendMessage({cmd: "auth"}, function(response){
                        console.log(response);
                        evt.dropdown.setPlacementOptions({
                            position: "top",
                            hAlign: "left",
                        });
                        evt.dropdown.el.innerHTML = popoverHTML;
                        try {
                            angular.bootstrap(document.querySelector('#myPopoverDiv'), ['myApp']);
                        } catch (ex) {
                            console.log("got to error bootstrapping");
                            console.log(ex.toString());
                        }
                    })
                },
            });

            composeView.on("sent", function (event) {
                console.log(event);
                console.log(event.messageID);
                //  use the messageID to get a MessageView object which can do....
                //      getBodyElement()
            })
        })
    });
})
