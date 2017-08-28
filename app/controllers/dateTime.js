app.controller('MyController', ['$scope', function ($scope) {

    var that = this;

    // date picker
    this.picker1 = {
        date: new Date('2015-03-01T00:00:00Z'),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                return (data.mode === 'day' && (new Date().toDateString() == data.date.toDateString()));
            }
        }
    };

    // time picker
    this.picker2 = {
        date: new Date('2015-03-01T12:30:00Z'),
        timepickerOptions: {
            readonlyInput: false,
            showMeridian: false
        }
    };

    // date and time picker
    this.picker3 = {
        date: new Date()
    };

    // min date picker
    this.picker4 = {
        date: new Date(),
        datepickerOptions: {
            maxDate: null
        }
    };

    // max date picker
    this.picker5 = {
        date: new Date(),
        datepickerOptions: {
            minDate: null
        }
    };

    // set date for max picker, 10 days in future
    this.picker5.date.setDate(this.picker5.date.getDate() + 10);

    // global config picker
    this.picker6 = {
        date: new Date()
    };

    // dropdown up picker
    this.picker7 = {
        date: new Date()
    };

    // view mode picker
    this.picker8 = {
        date: new Date(),
        datepickerOptions: {
            mode: 'year',
            minMode: 'year',
            maxMode: 'year'
        }
    };

    // dropdown up picker
    this.picker9 = {
        date: null
    };

    // min time picker
    this.picker10 = {
        date: new Date('2016-03-01T09:00:00Z'),
        timepickerOptions: {
            max: null
        }
    };

    // max time picker
    this.picker11 = {
        date: new Date('2016-03-01T10:00:00Z'),
        timepickerOptions: {
            min: null
        }
    };

    // button bar
    this.picker12 = {
        date: new Date(),
        buttonBar: {
            show: true,
            now: {
                show: true,
                text: 'Now!'
            },
            today: {
                show: true,
                text: 'Today!'
            },
            clear: {
                show: false,
                text: 'Wipe'
            },
            date: {
                show: true,
                text: 'Date'
            },
            time: {
                show: true,
                text: 'Time'
            },
            close: {
                show: true,
                text: 'Shut'
            }
        }
    };

    // when closed picker
    this.picker13 = {
        date: new Date(),
        closed: function (args) {
            that.closedArgs = args;
        }
    };

    // saveAs - ISO
    this.picker14 = {
        date: new Date().toISOString()
    }

    this.openCalendar = function (e, picker) {
        that[picker].open = true;
    };

    // watch min and max dates to calculate difference
    var unwatchMinMaxValues = $scope.$watch(function () {
        return [that.picker4, that.picker5, that.picker10, that.picker11];
    }, function () {
        // min max dates
        that.picker4.datepickerOptions.maxDate = that.picker5.date;
        that.picker5.datepickerOptions.minDate = that.picker4.date;

        if (that.picker4.date && that.picker5.date) {
            var diff = that.picker4.date.getTime() - that.picker5.date.getTime();
            that.dayRange = Math.round(Math.abs(diff / (1000 * 60 * 60 * 24)))
        } else {
            that.dayRange = 'n/a';
        }

        // min max times
        that.picker10.timepickerOptions.max = that.picker11.date;
        that.picker11.timepickerOptions.min = that.picker10.date;
    }, true);


    // destroy watcher
    $scope.$on('$destroy', function () {
        unwatchMinMaxValues();
    });

}]);

app.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {


    // upload later on form submit or something similar
    $scope.uploadPic = function (file) {
        ////console.log('file : ' + JSON.stringify(file));
        file.upload = Upload.upload({
            url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
            data: { username: $scope.username, file: file },
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
            });
        }, function (response) {
            if (response.status > 0)
                $scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
            // Math.min is to fix IE which reports 200% sometimes
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
    }

    $scope.state = '';
    $scope.listNames = [1, 2];
    $scope.fileNameChanged2 = function (ele) {
        ////console.log('ele : ' + JSON.stringify(ele));
        //var files = ele.files;
        var files = ele;
        var l = files.length;
        var namesArr = [];

        for (var i = 0; i < l; i++) {
            ////console.log('files [' + i + '] : ' + JSON.stringify(files[i]));
            namesArr.push(files[i].name);
        }
        $scope.listNames = namesArr;
        ////console.log('fileNames2 : ' + JSON.stringify($scope.listNames));
    }

    $scope.fileNameChanged = function (ele) {
        $scope.state = 'loading';
        var files = ele.files;
        var l = files.length;
        var namesArr = [];

        for (var i = 0; i < l; i++) {
            namesArr.push(files[i].name);
        }
        $scope.listNames = namesArr;
        ////console.log('fileNames : ' + JSON.stringify($scope.listNames));
        $scope.state = 'loaded';
    }

    $scope.uploadFiles = function (files, errFiles) {
        $scope.files = files;
        ////console.log('files : ' + JSON.stringify(files));
        $scope.errFiles = errFiles;
        angular.forEach(files, function (file) {
            ////console.log('file : ' + JSON.stringify(file));
            file.upload = Upload.upload({
                url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                data: { file: file }
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        });
    }
}]);

app.controller('uploadCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    console.clear();
    //console.log('uploadCtrl START');
    $scope.uploadFiles = function (file, errFiles) {
        //console.log('[uploadFiles] - file : ' + JSON.stringify(file));
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: './service/upload.php',
                //data: { file: file }
                method: 'POST',
                file: file,
                data: {
                    'awesomeThings': 'emsmaav1',
                    'targetPath': '/images/'
                },
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                    //console.log('[uploadFiles] - response.data : ' + JSON.stringify(response.data));
                });
            }, function (response) {
                if (response.status > 0) {
                    $scope.errorMsg = response.status + ': ' + response.data;
                    //console.log('[uploadFiles] - errorMsg : ' + JSON.stringify($scope.errorMsg));
                }
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        }
    };

    // upload later on form submit or something similar
    $scope.uploadPic = function (file) {
        //console.log('[uploadPic] - file : ' + JSON.stringify(file));
        file.upload = Upload.upload({
            url: './service/upload.php',
            data: { username: 'emsmaav1', file: file },
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
                //console.log('[uploadPic] - response.data : ' + JSON.stringify(response.data));
            });
        }, function (response) {
            if (response.status > 0) {
                $scope.errorMsg = response.status + ': ' + response.data;
                //console.log('[uploadPic] - response.data : ' + JSON.stringify($scope.errorMsg));
            }
        }, function (evt) {
            // Math.min is to fix IE which reports 200% sometimes
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
    }


    $scope.uploadFiles2 = function (files) {
        //console.log('[uploadFiles2] - file : ' + JSON.stringify(files));
        $scope.files = files;
        if (files && files.length) {
            Upload.upload({
                url: './service/upload.php',
                method: 'POST',
                file: files,
                data: {
                    'awesomeThings': 'emsmaav1',
                    'targetPath': '/images/'
                },
            }).then(function (response) {
                $timeout(function () {
                    $scope.result = response.data;
                    //console.log('[uploadFiles2] - result : ' + JSON.stringify($scope.result));
                });
            }, function (response) {
                if (response.status > 0) {
                    $scope.errorMsg = response.status + ': ' + response.data;
                    //console.log('[uploadFiles2] - errorMsg : ' + JSON.stringify($scope.errorMsg));
                }
            }, function (evt) {
                $scope.progress =
                    Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        }
    };

    $scope.uploadFiles3 = function (files, errFiles) {
        $scope.files = files;
        $scope.errFiles = errFiles;

        //console.log('[uploadFiles3] - files : ' + JSON.stringify(files));
        angular.forEach(files, function (file) {

            /*
            file.upload = Upload.upload({
                url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                data: { file: file }
            });
            */

            //console.log('[uploadFiles3] - file : ' + JSON.stringify(file));
            file.upload = Upload.upload({
                url: './service/upload.php',
                method: 'POST',
                file: file,
                data: {
                    'formType': 'job',
                    'fileDesc': 'materials',
                    'traceNum': 'emsmaav1-170516-001'
                },
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    var res = response.data;
                    //console.log('[uploadFiles3] - result : ' + JSON.stringify(response.data));
                    var arr = res.split("/emsmaav1-170516-001/");
                    //console.log('[uploadFiles3] - file.height : ' + file.$ngfHeight);
                    //console.log('[uploadFiles3] - file.width : ' + file.$ngfWidth);
                    //console.log('[uploadFiles3] - file.url : ' + "service/tmp/" + res);
                    //console.log('[uploadFiles3] - file.name : ' + arr[1]);
                    //console.log('[uploadFiles3] - file.size : ' + file.size);
                    //console.log('[uploadFiles3] - file.type : ' + file.type);
                });
            }, function (response) {
                if (response.status > 0) {
                    $scope.errorMsg = response.status + ': ' + response.data;
                    //console.log('[uploadFiles3] - errorMsg : ' + JSON.stringify($scope.errorMsg));
                }
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        });
    }
    //console.log('uploadCtrl END');
}]);

app.controller('CarouselDemoCtrl', function () {
    var vm = this;

    vm.previewSettings = {
        myInterval: 5000,
        noWrapSlides: false,
        active: 0,
    };

    var slides = vm.slides = [];
    var currIndex = 0;
    vm.addSlide = function () {
        var newWidth = 600 + slides.length + 1;
        slides.push({
            image: '//unsplash.it/' + newWidth + '/300',
            text: ['Nice image', 'Awesome photograph', 'That is so cool', 'I love that'][slides.length % 4],
            id: currIndex++
        });
    };

    vm.randomize = function () {
        var indexes = generateIndexesArray();
        assignNewIndexesToSlides(indexes);
    };

    for (var i = 0; i < 4; i++) {
        vm.addSlide();
    }

    // Randomize logic below
    function assignNewIndexesToSlides(indexes) {
        for (var i = 0, l = slides.length; i < l; i++) {
            slides[i].id = indexes.pop();
        }
    }

    function generateIndexesArray() {
        var indexes = [];
        for (var i = 0; i < currIndex; ++i) {
            indexes[i] = i;
        }
        return shuffle(indexes);
    }

    // http://stackoverflow.com/questions/962802#962890
    function shuffle(array) {
        var tmp, current, top = array.length;

        if (top) {
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }

        return array;
    }
});

app.controller('ckEditorCtrl', ['$scope', function ($scope) {
    $scope.htmlEditor = '...';
}]);

app.controller('trixEditorCtrl', function (Upload, $timeout, $scope) {
    var vm = this;
    vm.blob = [];
    vm.base64 = null;
    vm.trix = '';   
    var host = './service/upload.php';
    var createStorageKey, host, uploadAttachment;
    var events = ['trixInitialize', 'trixChange', 'trixSelectionChange', 'trixFocus',
        'trixBlur', 'trixFileAccept', 'trixAttachmentAdd', 'trixAttachmentRemove'];
    for (var i = 0; i < events.length; i++) {
        vm[events[i]] = function (e) {
            console.info('Event type:', e.type);
        }
    };


    vm.cleanArray = function (tmpArray) {
        var newArray = [];
        if (_.isUndefined(tmpArray) || _.isNull(tmpArray)) {
        } else {
            for (i = 0, len = tmpArray.length; i < len; i++) {
                if (_.isUndefined(tmpArray[i]) || _.isNull(tmpArray[i]) || _.isEmpty(tmpArray[i])) {
                } else if (_.isDate(tmpArray[i])) {
                    newArray.push(moment(tmpArray[i]).format('YYYY-MM-DD'));
                } else {
                    newArray.push(tmpArray[i]);
                }
            }
        }
        return newArray;
    }

    vm.trixAttachmentRemove = function (e) {
        var attachment;
        attachment = e.attachment;
        console.info('attachment to remove:', attachment);
        //console.info('blob1:', attachment.attachment.fileObjectURL);

        for (i = 0; i < vm.blob.length; i++) {
            //console.info('blob2:', vm.blob[i].blob);
            if (_.isUndefined(vm.blob[i]) || _.isNull(vm.blob[i])) {
            } else {
                if (attachment.attachment.fileObjectURL == vm.blob[i].blob) {
                    vm.blob[i] = null;
                }
            }
        }
        vm.blob = vm.cleanArray(vm.blob);

    }

  
    vm.trixAttachmentAdd = function (e) {
        var attachment, base64;       
        attachment = e.attachment;
        console.info('attachment to add:', attachment);
        
        var fileReader = new FileReader();
        fileReader.onload = function (event) {
            vm.base64  = event.target.result;
            ////console.log('base64: ' + JSON.stringify( base64 ));
        };
        
        if (attachment.file) {
            fileReader.readAsDataURL(attachment.file);
            ////console.log('base64 : ' + JSON.stringify( vm.base64 ));
            return uploadAttachment(attachment, base64);
            
        }
    }

    var details = {
        'formType': 'task',
        'fileDesc': 'blob',
        'traceNum': 'emsmaav1-27072017',
    };

    uploadAttachment = function (attachment, base64) {
        console.info('uploadAttachment to add:', attachment);
        file = attachment.file;
        file.upload = Upload.upload({
            url: './service/upload.php',
            method: 'POST',
            file: file,
            data: details,
        });

        file.upload.then(function (response) {
            //SUCCESS
            $timeout(function () {
                var res = response.data;
                //console.log('[uploadFiles] - result : ' + JSON.stringify(res));
                //console.log('[uploadFiles] - base64 : ' + JSON.stringify(vm.base64));
                if (res.indexOf("ERROR") > 0) {
                } else {
                    ////console.log('[uploadFiles] - file : ' + JSON.stringify(file));
                    var arr = res.split("/emsmaav1-27072017/");
                    var nam = "";
                    if (_.isString(arr[1])) nam = arr[1].trim();


                    /*
                   var dataUrl = null;
                   FileReader.readAsDataURL(attachment.attachment.fileObjectURL, $scope)
                       .then(function (resp) {
                           // Do stuff
                           dataUrl = resp
                       }, function (err) {
                           // Do stuff
                           dataUrl = err
                       });
                   

                    var fileReader = new FileReader();
                    fileReader.readAsDataURL(attachment.attachment.fileObjectURL);
                    fileReader.onload = function (e) {
                        dataUrl = e.target.result;
                    };
                    */


                    if (nam != "") {
                        var fileTmp = {
                            name: arr[1],
                            size: file.size,
                            height: file.$ngfHeight,
                            width: file.$ngfWidth,
                            type: file.type,
                            blob: attachment.attachment.fileObjectURL,
                            url: "service/tmp/" + res,
                            base: vm.base64,
                            uploadBy: 'EMS Mark Anthony Adriano',
                            uploadDt: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                        };
                        //console.log('[uploadFiles] - fileTmp : ' + JSON.stringify(fileTmp));
                        vm.blob.push(fileTmp);

                        //vm.trixAttachmentRemove(attachment);
                        //vm.trixInitialize(fileTmp.url, editor);
                    }
                }
            });
        }, function (response) {
            //FAILURE
            if (response.status > 0) {
                var errorMsg = response.status + ': ' + response.data;
                //console.log('[uploadFiles] - errorMsg : ' + JSON.stringify(errorMsg));
            }
        }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 *
                evt.loaded / evt.total));
        });

    }

    //var host = "./service/delete.php";
    //host = "https://d13txem1unpe48.cloudfront.net/";

    uploadAttachment2 = function (attachment) {
        console.info('attachment2:', attachment);
        var file, form, key, xhr;
        file = attachment.file;
        key = createStorageKey(file);

        console.info('file:', file);
        console.info('key:', key);

        form = new FormData;
        form.append("key", key);
        form.append("Content-Type", file.type);
        form.append("file", file);
        form.append("data", details);
        xhr = new XMLHttpRequest;
        xhr.open("POST", host, true);
        xhr.upload.onprogress = function (event) {
            var progress;
            progress = event.loaded / event.total * 100;
            return attachment.setUploadProgress(progress);
        };
        xhr.onload = function () {
            var href, url;
            if (xhr.status === 204) {
                url = href = host + key;
                console.info('- host:', host);
                console.info('- key:', key);
                console.info('- href:', href);
                console.info('- url:', url);
                return attachment.setAttributes({
                    url: url,
                    href: href
                });
            }
        };

        console.info('form:', form);
        return xhr.send(form);
    };

    createStorageKey = function (file) {
        var date, day, time;
        date = new Date();
        day = date.toISOString().slice(0, 10);
        time = date.getTime();
        return "tmp/" + day + "/" + time + "-" + file.name;
    };



    var getFileBlob = function (url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.addEventListener('load', function () {
            cb(xhr.response);
        });
        xhr.send();
    };

    var blobToFile = function (blob, name) {
        blob.lastModifiedDate = new Date();
        blob.name = name;
        return blob;
    };

    var getFileObject = function (filePathOrUrl, cb) {
        getFileBlob(filePathOrUrl, function (blob) {
            cb(blobToFile(blob, 'image.png'));
        });
    };

    vm.trixInitialize = function (e, editor) {
        // Insert “Hello\n”
        editor.insertString("Hello")
        editor.insertLineBreak()
        /*
        // Insert the selected file from the first file input element
        //var file = document.querySelector("input[type=file]").file        
        //url = "http://localhost/creative/jobs/service/tmp/task/blob/emsmaav1-27072017/image.png";


        console.info('trixInitialize to add:', e);
        if (_.isUndefined(e) || _.isNull(e)) {
        } else {
            url = e;
            getFileObject(url, function (fileObject) {
                //console.log(fileObject);
                editor.insertFile(fileObject)
            })
        }
        */

    }

    

    vm.trixBlur = function (e) {
        //console.log('[trixBlur] vm.trix', vm.trix)
    }
});