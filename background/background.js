//  API information
var HERMESIS_API = 'https://cjohnson.ignorelist.com:4343';

//  functions to access the API
var apiCaller = (function () {
    return {
        authPage: function () {
            var authUrl = "https://cjohnson.ignorelist.com:4343/auth";
            var iframe = document.createElement('iframe');
            iframe.src = authUrl;
            iframe.style = 'visbility:hidden;display:none';
            document.getElementById('emptyspace').append(iframe);
        },
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
        downloadFile: function (fileid) {
            var formData = new FormData();
            formData.append('id', fileid);
            apiCaller.sendRequest(formData, 'POST', HERMESIS_API + '/downloadfile', function (xhr) {
                return xhr.responseText;
            });
        },
        uploadFile: function (file, filename) {
            var formData = new FormData();
            console.log(file);
            formData.append('uploadedfile', file, filename);
            apiCaller.sendRequest(formData, 'POST', HERMESIS_API + '/uploadfile', function (xhr) {
                console.log(xhr.status);
                return xhr.responseText;
            }); 
        },
        getFields: function (fileid, callback) {
            var formData = new FormData();
            formData.append('id', fileid);
            apiCaller.sendRequest(formData, 'POST', HERMESIS_API + '/getfields', function (xhr) {
                console.log(xhr.status);
                callback(xhr.responseText);
            });
        },
        getfilledtemplate: function (id, fields, callback) {
            formData = new FormData();
            
            console.log("fields is sending a string to the backend: ", fields);
            
            formData.append('id', id);
            formData.append('fields', fields);
            apiCaller.sendRequest(formData, "POST", HERMESIS_API + '/getfilledtemplate', function (xhr) {
                callback(xhr);
            });
        },
        apiCall: function (endpoint, callback) {    //  cannot add any parameters to the reqeust
            var xhr = new XMLHttpRequest();

            xhr.onload = function () {
                if (xhr.status === 200) {
                    callback(xhr.responseText);
                }
            };

            xhr.open('GET', endpoint, true);
            xhr.send();
        }
    };
})();

//contract_fields -- 
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'contract_fields') {
        //  downloadUrl = apiCaller.downloadFile(request.file);
        apiCaller.getFields(request.file, function (response) {
            var fields = response;
            var listfields = JSON.parse(fields);
            sendMessage({ 
                fields : listfields, 
                templateurl : chrome.extension.getURL('myTemplateFieldModifier.html')
            });                            
        });
        return true;
    }
});

//template_modifier -- the modal to modify template fields after user selects a contract to work with
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'template_modifier') {
        //  var contractlist = [];
        var endpoint = "https://cjohnson.ignorelist.com:4343/listfiles";
        var parameters = {};
        
        apiCaller.apiCall(endpoint, parameters, function (drivefileobjectlist) {
            sendMessage({ files: drivefileobjectlist });
        });
        return true;
    }
});

//auth -- OAuth2 with google to get drive and gmail (read) access
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'auth') {
        var hometabId;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            hometabId = tabs[0].id;
            console.log(hometabId);
        });
        var authurl = 'https://cjohnson.ignorelist.com:4343/auth';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', authurl);
        xhr.onload = function () {
            if (xhr.status === 200) {
                authurl = xhr.responseText;
                var tabId;
                chrome.tabs.create({url: authurl}, function (tab) {
                    tabId = tab.id;
                    var intervalId = setInterval(function () {
                        chrome.tabs.get(tabId, function (tab) {
                            if (tab.url.includes("/callback")) {
                                chrome.tabs.remove(tabId, function () {
                                    clearInterval(intervalId);
                                    sendMessage("authenticated");
                                    chrome.tabs.update(hometabId, {highlighted: true});
                                });
                            }
                        });
                    }, 200);
                });
            }
        };
        xhr.send();
        return true;
    }
});

//popover_html -- the menu that pops up over the button on the compose window
chrome.runtime.onMessage.addListener(function(request, sender, sendMessage) {
    if(request.cmd === "popover_html") {
        var xhr = new XMLHttpRequest();
        var url = 'myPopoverTemplate.html';
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                sendMessage(xhr.responseText);
            }
        };
        
        xhr.open('GET', url, true);
        xhr.send();
        return true;
    }
});

var storeUploadedFiles = (function () { //  removed: 'entry, onend' from parameters of function 
    return {
        getObjURL: function (objectURL, onend) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', objectURL, true);
            xhr.responseType = 'blob';
            xhr.onload = function (e) {
                if (this.status === 200) {
                    onend(this.response);
                }   else {
                    console.log('Error: ' + e);
                }
            };
            xhr.send();
        }
    };
})();
//storetemplates -- uploads  word docs to google docs for processing into templates
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    //  var sendMessageNow = sendMessage;
    if (request.cmd === 'storetemplate') {
        //  the request is not being passed a file; need to get a file from the foreground to the background, which I can then form encode and send to the server
        storeUploadedFiles.getObjURL(request.file, function (file) {
            var b = new Blob([file], { type : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
            //  perform some validiation to assure that this is a usable file
            sendMessage(apiCaller.uploadFile(b, request.filename));            
        });
        return true;
    }
});


//delete_contract; not implemented -- remove a contract template from google docs
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === "delete_contract") {
        sendMessage(localStorage.removeItem(request.contractname));
        return true;
    }
});

//uploadmodal_html -- this has not been explicitly checked, but seems to be fine -- controls the actual upload window
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    var contractlist = [];
    if (request.cmd === 'uploadmodal_html') {
        for(var i=0, len=localStorage.length; i<len; i++) {
          try {
            var fo = JSON.parse(localStorage[localStorage.key(i)]);
            if (fo.type === "contract") {
              contractlist.push(localStorage.key(i));
            }
          } catch (ex) { console.log("not a contract: " + localStorage.key(i).fields); }
        }
        sendMessage({ templateurl : chrome.extension.getURL('myModalTemplate.html'), listitems : contractlist});
    }

});

//  EVERYTHING BELOW THIS HAS NOT BEEN CHECKED TO WORK WITH GOOGLE DRIVE API STUFF
//  this is probably irrelevant code because templates will now just be google docs files
/*
var wordTemplateFiller = (function () {
        var writer = new zip.BlobWriter();
        var zipWriter;

        return {
            dataURLtoBlob : function (dataurl, onend) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while(n--){
                    u8arr[n] = bstr.charCodeAt(n);
                }
                onend(new Blob([u8arr], {type:mime}));
            },
            zipGetEntries: function (file, onend) {
                zip.createReader(new zip.BlobReader(file), function (zipReader) {
                    zipReader.getEntries(onend);
                }, function (e) { alert(e.toString) });
            },
            createNewZip: function (zipentries, fields, onend) {
                var addIndex = 0;
                var newfields = fields
                zip.createWriter(writer, function (w) {
                    zipWriter = w;
                    nextFile();
                });
                
                function nextFile() {
                    var file = zipentries[addIndex];
                    addToNewZip(file, function () {
                        addIndex++
                        if (addIndex < zipentries.length) {
                            nextFile();
                        } else { onend(zipWriter); }
                    });
                }
                
                function addToNewZip(entry, onfinishzip) {
                    function getDocFields (entry, onend) {
                        parser = new DOMParser();
                        return entry.getData(new zip.TextWriter(), function (text) {
                            var xmlDoc = parser.parseFromString(text, "text/xml");
                            fieldxml = xmlDoc.querySelectorAll('sdt');
                            onend({ doc: xmlDoc, fields: fieldxml });
                        });
                    }

                    if (entry.directory === true) {
                        zipWriter.add(entry.filename, null, function () { onfinishzip() }, function () {}, {'directory' : true});
                    }
                    else if (entry.filename === 'word/document.xml') {
                        getDocFields(entry, function(docandfields) {
                            currentfields = docandfields.fields;
                            doc = docandfields.doc;
                            for (i = 0; i < currentfields.length; i++) {
                                paragraph = currentfields[i].querySelector('sdtContent r');
                                paragraph.childNodes[0].childNodes[0].nodeValue = newfields[currentfields[i].textContent];
                                
                                currentfields[i].parentNode.replaceChild(paragraph, currentfields[i]);
                            }                            
                            //  (block comment begin)
                            for (i = 0; i < currentfields.length; i++) {
                                paragraph = currentfields[i].querySelector('sdtContent r t');
                                paragraph.childNodes[0].nodeValue = newfields[currentfields[i].textContent];
                                
                                currentfields[i].parentNode.replaceChild(paragraph, currentfields[i].querySelector('sdtContent r t'));
                            }
                            //  (block comment end)
                            serialized = new XMLSerializer().serializeToString(doc);
                            blobbed = new Blob([serialized], { type : doc.contentType })
                            zipWriter.add(entry.filename, new zip.BlobReader(blobbed), function () { onfinishzip() });
                        });
                    }
                    else {
                        entry.getData(new zip.BlobWriter(), function (blob) {
                            zipWriter.add(entry.filename, new zip.BlobReader(blob), function() { onfinishzip() });
                        })
                    }
                }  
            }  
        }
    })();

//fillintemplate
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'fillintemplate') {
        var userfields = request.userfields;
        var template = request.template;

        apiCaller.getfilledtemplate(template, userfields, function (xhr) {
            console.log(xhr.responseText);
            //  get the PDF and put it in a data URL or something to send back to the frontend
        });
        return true;

*/   
//  BELOW IS OLD CODE; DO NOT USE
/*        
        promise = new Promise(function (resolve) {
            templatefile = localStorage.getItem(request.template);
            resolve([JSON.parse(templatefile), request.template]);
        });    

        promise.then(function (localstorageobject) {
            var newfields = request.userfields;
            //  what is fieldEntries used for? I have replaced it with newfields as a parameter of createNewZip
            //      but that might break something
            
            var fieldEntries = localstorageobject[0].fields;
            var filename = localstorageobject[1];
            wordTemplateFiller.dataURLtoBlob(localstorageobject[0].fileEntry, function (blob) {
                wordTemplateFiller.zipGetEntries(blob, function(entries) {
                    wordTemplateFiller.createNewZip(entries, newfields, function (newwordfile) {
                        newwordfile.close(function (blob) {
                            var reader = new FileReader();
                            reader.onload = function () {
                                sendMessage({ file : reader.result, filename : filename });   
                            }
                            reader.readAsDataURL(blob);
                        })
                    })
                })
            });
        })
*/
    }
});