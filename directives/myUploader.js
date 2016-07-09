angular.module('myApp').directive('myUploader', function(){
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
				var filelength = scope.files.length;
				for (var i = 0; i < filelength; i++) {
                    if (scope.files[i].type ==='application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        scope.fileList.push({
                            name: escape(scope.files[i].name),
                            size: scope.files[i].size,
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
});