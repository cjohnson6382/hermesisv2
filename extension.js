class ViewStore {
  static setView (composeView) {
    const id = ViewStore.COUNTER++;
    ViewStore.TABLE[id] = composeView;
    return id;
  }
  
  static getView (id) {
    return ViewStore.TABLE[id];
  }
}

ViewStore.TABLE = {};
ViewStore.COUNTER = 1;

var dataURLtoBlob = function (fileresource, mimeType, callback) {


  //  var arr = fileresource.file.split(','), mime = arr[0].match(/:(.*?);/)[1],
  
  console.log(fileresource);
  
  var arr = fileresource.split(',');
  var mime = arr[0].match(/:(.*?);/);
  
  //  console.log('arr, mime', arr, mime);
  
  //  var mime = arr[0].match(/:(.*?);/)[1];
  var bstr = atob(arr[1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);
  
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  blob = new Blob([ u8arr ], { type: mimeType });
  blob.lastModifiedDate = new Date();
  //  blob.name = fileresource.name;
  
  
  console.log('does blob have a name automatically? ', blob.name);
  
  
  callback(blob);
};

angular.module('myApp', ['ngAnimate', 'ui.bootstrap'])
  .controller('mainCtrl', [function () {
    //  console.log('some shit to do in the main controller?');
  }])
  .controller('templateModifier', function ($scope, $uibModalInstance, item, composeviewid) {
    var fields = Object.keys(item.properties).filter(function (prop) { return prop.includes('field') });
    var fieldJSON = fields.reduce(function (total, current) { return total + item.properties[current] }, '');
    var fieldsArray = JSON.parse(fieldJSON);
    
    //  set the draft's subject so that it creates a draftid, get the draftid (returns a promise)
    //    put the server call in the promise's resolution, with the draft id
    
    $scope.progressbar = '';
    
    $scope.visible = function () {
      return $scope.progressbar === 'visible' ? true : false;
    };
    
    $scope.fieldList = fieldsArray;
    $scope.templatefields = {};
    fieldsArray.map(function (current) { $scope.templatefields[current] = '' });
    
    $scope.done = function () {
      $scope.progressbar = 'visible';
      
      chrome.extension.sendMessage({
        cmd : "fillintemplate",
        template: item.id,
        fields: $scope.templatefields,
        name: item.name
      }, function (resp) {
        $scope.progressbar = '';
        
        var deferred = new Promise(function (resolve, reject) {
          console.log('typeof resp: ', typeof resp, resp.length);
          var bstr = resp;
          var n = bstr.length;
          
          var u8arr = new Int8Array(n);
          
          while(n--){
            u8arr[n] = bstr.charCodeAt(n);
          }
          
          
          file = new File([ u8arr ], 'stupidfile.pdf', { type: 'application/pdf', lastModified: Date.now() });
          
          console.log(file, file.length);
          
          
          
          resolve(file);
        });

        deferred.then(function (file) {
          //  console.log('blob before attaching: ', blob);
          //  ViewStore.getView(composeviewid).insertTextIntoBodyAtCursor(resp);
          ViewStore.getView(composeviewid).attachFiles([file]);
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
            $scope.contracts = resp;
          });
  
          $scope.selected = '';
          $scope.openTemplate = function ($item, $model, $label) {
            var modalInstance = $uibModal.open({
              templateUrl: $sce.trustAsResourceUrl(chrome.extension.getURL('html/templateModifier.html')),
              controller: 'templateModifier',
              windowClass: 'app-modal-window',
              keyword: true,
              resolve: {
                item: function () {return $item},
                composeviewid: function () { return $scope.composeView }
              }
            });
          };
        };
      },
    };
  }])
  .factory('ContractsService', ['$q', function ($q) {
    var fetchContracts = function (callback) {
      chrome.extension.sendMessage({cmd: 'fetchcontracts'}, function (resp) {
        callback(resp);
      });
    };
    
    var contracts;

    return {
      get: function () {
        var deferred = $q.defer();
        fetchContracts(function (resp) {
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
            
            //  is this going to set my scope right for composeView so that the popover can access it?
            //  scope.composeView = ViewStore.setView(composeView);
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