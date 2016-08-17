angular.module('myApp').factory('ActivateSDK', ['InboxSDKLoader', 'SdkService', function (InboxSDKLoader, ComposeService) {
  InboxSDKLoader.then(function (sdk) {
    sdk.Compose.registerComposeViewHandler(function (composeView) {
      composeView.addButton({
        title: "Compose Contract",
        hasDropdown: true,
        iconUrl: chrome.extension.getURL('hermesis.ico'),
        type: 'MODIFIER',
        onClick: function (evt) {
          chrome.extension.sendMessage({cmd: 'auth'}, function (resp) {
            evt.dropdown.setPlacementOptions({
              position: "top",
              hAlign: "left",
            });
            evt.dropdown.el.innerHTML = popoverHTML;
          });
        }
      });
    });
  });
}]);
