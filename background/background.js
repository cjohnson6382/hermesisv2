//  API information
var HERMESIS_API = 'https://cjohnson.ignorelist.com:4343';


var apiCaller = (function () {
    return {
        sendRequest: function (formData, method, endpoint, callback) {
            var filesent = false;
            var xhr = new XMLHttpRequest();
            xhr.open(method, endpoint);
            xhr.onload = function ()  {
                if (xhr.status === 200 && filesent === false) {
                    callback(xhr);
                    filesent = true;
                } else if (xhr.status !== 200) {
                    console.log('ERROR', xhr.status);
                }
            };
            xhr.send(formData);
        },
        getFields: function (fileid, callback) {
            var formData = new FormData();
            formData.append('id', fileid);
            apiCaller.sendRequest(formData, 'POST', HERMESIS_API + '/getfields', function (xhr) {
                console.log(xhr.status);
                callback(xhr.responseText);
            });
        },
        //  this does not appear to be done; it should return an xhr of the PDF; format unknown
        getfilledtemplate: function (id, fields, callback) {
            formData = new FormData();
            
            console.log("fields is sending a string to the backend: ", fields);
            
            formData.append('id', id);
            formData.append('fields', fields);
            apiCaller.sendRequest(formData, "POST", HERMESIS_API + '/getfilledtemplate', function (xhr) {
                callback(xhr);
            });
        },
        apiCall: function (endpoint, parameters, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                }
            };

            xhr.open('GET', endpoint, true);
            xhr.send();
        }
    }
})();


var requester = function () {
  return {
    contract_fields: function (request) {
      apiCaller.getFields(request.file, function (response) {
        return {fields: JSON.parse(response), template: chrome.extension.getURL('myTemplateFieldModifier.html')};
      });
    },
    getcontractnames: function (request) {
      //  used on server; no parameters sent to server
      apiCaller.apiCall('https://cjohnson.ignorelist.com:4343/listfiles', function (response) {
        return {files: response};
      });
    },
    auth: function (request) {
      var tabId;
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        tabId = tabs[0].id;
      });
      
      apiCaller.apiCall('https://cjohnson.ignorelist.com:4343/auth', function (response) {
        var OauthUrl = response.txt;
        var newTabId;
        chrome.tabs.create({url: OauthUrl}, function (tab) {
          newTabId = tab.id;
          var intervalId = setInterval(function () {
            chrome.tabs.get(newTabId, function () {
              clearInterval(intervalId);
              chrome.tabs.update(tabId, {highlighted: true});
              return "authenticated";
            });
          }, 200);
        });
      });
    },
    popover_html: function (request) {
      //  to get this template from the server, need to use a URL, not a filename
      apiCaller.apiCall('myPopoverTemplate.html', function (response) {
        return response.responseText;
      });
    },
    fillintemplate: function (request) {
        var userfields = request.userfields;
        var template = request.template;

        apiCaller.getfilledtemplate(template, userfields, function (resp) {
            //  the code here was never finished, so the function returns the data of the downloaded file?
            return resp.responseText;
        });
    }
  };
};

chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
  sendMessage(requester[request.cmd](request));
  return true;
});
