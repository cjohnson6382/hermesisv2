//  API information
var HERMESIS_API = 'https://cjohnson.ignorelist.com';

var getRequest = function (options) {
  var deferred = new Promise(function (resolve, reject) {
    $.ajax({
      url: options.url,
      method: options.method,
      data: options.data
    })
      .then(function (resp) {
        console.log(resp);
        resolve(resp.type === 'auth' ? auth(resp.resp, options.func, options.args) : resp);
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
  var deferred = new Promise(function (resolve, reject) {
    chrome.tabs.create({url: url}, function (tab) {
      newTabId = tab.id;
  
      var intervalId = setInterval(function () {
        chrome.tabs.get(newTabId, function (tab) {
          console.log('the new tab:', tab,' id: ', tab.id);
          if (tab.url.includes(HERMESIS_API)) {
            chrome.tabs.update(tabId, {highlighted: true});
            chrome.tabs.remove(newTabId);
            clearInterval(intervalId);
            
            resolve(func(...args));
          }
        });
      }, 300);
    });
  });

  return deferred;
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
    var data = { id: request.template, fields: JSON.stringify(request.fields), name: request.name };
    var method = 'POST';
    
    return getRequest({ url: url, func: func, args: args, data: data, method: method});
  }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  requester[request.cmd](request)
    .then(function (resp) {
      console.log('response to requester: ', resp);
      sendResponse(resp);
    });

  return true;
});