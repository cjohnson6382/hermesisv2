class ViewStore {
  static setView (composeView) {
    const id = ViewStore.COUNTER++;
    ViewStore.TABLE[id] = composeView;
    return id;
  }
  
  static getView (id) {
    return ViewStore.TABLE.id;
  }
}

ViewStore.TABLE = {};
ViewStore.COUNTER = 0;

var dataURLtoBlob = function (fileresource, mimeType, callback) {
  var arr = fileresource.file.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  blob = new Blob([ u8arr ], { type: mimeType });
  blob.lastModifiedDate = new Date();
  blob.name = fileresource.name;
  callback(blob);
};

angular.module('myApp', ['ngAnimate', 'ui.bootstrap'])
  .controller('mainCtrl', [function () {
    //  $scope.contracts = chrome.extensions.sendMessage({cmd: 'getcontractnames'});
  }])
  .controller('templateModifier', function ($scope, $uibModalInstance, item, composeviewid) {
    //  $scope.fieldList = Object.keys(templateproperties);
    
    var fields = Object.keys(item.properties).filter(function (prop) { return prop.includes('field') });
    var fieldJSON = fields.reduce(function (total, current) { return total + item.properties[current] }, '');
    var fieldsArray = JSON.parse(fieldJSON);
    
    $scope.fieldList = fieldsArray;
    $scope.templatefields = {};
    fieldsArray.map(function (current) { $scope.templatefields[current] = '' });
    
    $scope.done = function () {
  
      //
      console.log("templatefields: ", $scope.templatefields);
      //
      
      chrome.extension.sendMessage({
        cmd : "fillintemplate",
        template: item.id,
        fields: $scope.templatefields,
        name: item.name
      }, function (resp) {
          
        console.log('templatemodifier after background call: ', resp);
          
        dataURLtoBlob(resp, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', function (blob) {
          ViewStore.getView(composeviewid).attachFiles([blob]);
          $uibModalInstance.close('closing the modal after attaching a file');
        });
      });
    };
  
    $scope.cancel = function () { $uibModalInstance.dismiss('cancel') };
  })
  .directive('popover', ['$uibModal', '$sce', 'ContractsService', function ($uibModal, $sce, ContractsService) {
    return {
      restrict: 'E',
      scope: {composeView: '='},
      templateUrl: $sce.trustAsResourceUrl(chrome.extension.getURL('html/popover.html')),
      compile: function ($element, $attrs) {
        return function ($scope, $element, $attrs) {
          ContractsService.get().then(function (resp) {
            console.log('in popover directive, after calling ContractService.get() to populate $scope.contracts: ', resp);
            $scope.contracts = resp;
          });
  
          $scope.selected = '';
          $scope.openTemplate = function ($item, $model, $label) {
            
            console.log('popover directive, $scope.openTemplate, $item: ', $item);
            
            var modalInstance = $uibModal.open({
              templateUrl: $sce.trustAsResourceUrl(chrome.extension.getURL('html/templateModifier.html')),
              controller: 'templateModifier',
              windowClass: 'app-modal-window',
              keyword: true,
              resolve: {
                item: function () {return $item},
                composeviewid: function () {return $scope.composeView}
              }
            });
          };
          console.log('template modifier modal opens....');
        };
      },
    };
  }])
  .factory('ContractsService', ['$q', function ($q) {
    var fetchContracts = function (callback) {
      chrome.extension.sendMessage({cmd: 'fetchcontracts'}, function (resp) {
        
        
        console.log('fetchContracts returns: ', resp);
        
        
        callback(resp);
      });
    };
    
    var contracts;

    return {
      get: function () {
        var deferred = $q.defer();
        fetchContracts(function (resp) {
            console.log('ContractService#get; just before promise resolves:  ', resp);
            deferred.resolve(resp);
        });

        return deferred.promise;
      },
      update: function () {
        fetchContracts(function (resp) {
          contracts = resp;
          return contracts;
        });
      }
    };
  }]);


$('html').attr('ng-controller', 'mainCtrl');
InboxSDK.load('1.0', 'sdk_APPLEFAPPLE_98d35548c0')
  .then(function (sdk) {
    sdk.Compose.registerComposeViewHandler(function (composeView) {
      composeView.on('destroy', function (event) {
        console.log('attached files has been destroyed', event);
      });
      composeView.addButton({
        title: "Compose Contract",
        hasDropdown: true,
        iconUrl: chrome.extension.getURL('resources/hermesis.ico'),
        type: 'MODIFIER',
        onClick: function (evt) {
          evt.dropdown.setPlacementOptions({
            position: "top",
            hAlign: "left",
          });
          evt.dropdown.el.innerHTML = '<popover compose-view=' + ViewStore.setView(composeView) + '></popover>';

          angular.element(document.body).injector().invoke(function ($compile) {
            var scope = angular.element($('popover')).scope();
            $compile($('popover'))(scope);
          });
        }
      });
      return;
    });
  })
  .then(function () {
    try {
        if(!angular.element($('html')).injector()) {
          angular.bootstrap(document.body, ['myApp']);
        }
      } catch (ex) {
        console.log("error bootstrapping", ex.toString());
      }
  });