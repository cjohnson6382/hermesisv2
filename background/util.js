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


