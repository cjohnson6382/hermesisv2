//  API information
var HERMESIS_API = 'https://cjohnson.ignorelist.com:4343';

var getRequest = function (options) {
  var deferred = new Promise(function (resolve, reject) {
    $.ajax({
      url: options.url,
      method: options.method,
      data: options.data
    })
      .then(function (resp) {
        resolve(resp.type === 'auth' ? auth(resp.resp, options.func, options.args) : resp.resp);
      });
  });

  return deferred;
};

var auth = function (url, func, args) {
  var tabId;
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    tabId = tabs[0].id;
  });

  var newTabId;
  chrome.tabs.create({url: url}, function (tab) {
    newTabId = tab.id;
    var intervalId = setInterval(function () {
      chrome.tabs.get(newTabId, function () {
        clearInterval(intervalId);
        chrome.tabs.update(tabId, {highlighted: true});
        return func(...args);
      });
    }, 1000);
  });
};

var requester = {
  fetchcontracts: function (request) {
    var func = arguments.callee;
    var args = arguments;
    var url = HERMESIS_API + "/listfiles";
    var method = 'GET';
    
    return getRequest({ url: url, func: func, args: args, method: method });
  },
  fillintemplate: function (request) {
    var func = arguments.callee;
    var args = arguments;
    var url = HERMESIS_API + "/getfilledtemplate";
    var data = { id: request.template, fields: request.userfields };
    var method = 'POST';
    
    return getRequest({ url: url, func: func, args: args, data: data, method: method});
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {


  requester[request.cmd](request)
    .then(function (resp) {
      sendResponse(resp);
      console.log('sending to client side: ', resp);
    });

//  sendResponse(requester[request.cmd](request));
  return true;
});