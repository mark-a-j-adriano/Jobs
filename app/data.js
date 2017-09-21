app.factory("StorageFactory", ["$localStorage", "$auth", "$window", "$state", function ($localStorage, $auth, $window, $state) {
  var obj = {};
  var win_URI = null;

  obj.getAppSettings = function (wht) {
    var ret = null;
    if (wht == 'API') {
      ret = "https://creativelab-dev.sphnet.com.sg";
    } else if (wht == 'ENV') {
      ret = "UAT";
    } else if (wht == 'LOG') {
      ret = true;
    } else if (wht == 'UPL') {
      ret = "./service/upload.php";
    }
    return ret;
  }

  obj.clearSessionData = function () {
    delete $localStorage.uri;
    delete $localStorage.user;
    delete $localStorage.exp;
    delete $localStorage.data;
    return null;
  };

  obj.getSessionData = function (dataFlag) {
    var ret = null;
    if ($auth.isAuthenticated()) {
      if (dataFlag) {
        try {
          ret = _.attempt(JSON.parse.bind(null, window.atob($localStorage.data)));
          //ret = DataFactory.parseLodash(window.atob($localStorage.data));
        } catch (e) {
          console.log('[getSessionData] data is not a valid base64 String.');
        }
      } else {
        try {
          ret = _.attempt(JSON.parse.bind(null, window.atob($localStorage.user)));
          //ret = DataFactory.parseLodash(window.atob($localStorage.user));
        } catch (e) {
          console.log('[getSessionData] user is not a valid base64 String.');
        }
      }
    } else {
      delete $localStorage.user;
      delete $localStorage.exp;
      delete $localStorage.data;
    }
    return ret;
  };

  obj.getSessionExpiry = function () {
    return $localStorage.exp;
  }

  obj.setSessionExpiry = function () {
    $localStorage.exp = $auth.getPayload().exp;
  }

  obj.setSessionData = function (userData, tmpData) {
    ////console.log('setSessionData UserData: ' + JSON.stringify(userData));
    if (_.isNil(userData)) userData = {};
    if (_.isNil(tmpData)) tmpData = {};
    $localStorage.user = window.btoa(JSON.stringify(userData));
    $localStorage.data = window.btoa(JSON.stringify(tmpData));
    //console.log('getPayload: ' + JSON.stringify($auth.getPayload()));
    $localStorage.exp = $auth.getPayload().exp;
    //$localStorage.exp = window.btoa(JSON.stringify($auth.getPayload().exp));
    var dnsFlag = $localStorage.uri;
    if (_.isNil(dnsFlag)) { } else { delete $localStorage.uri }
  };

  obj.setFlg = function () {
    $localStorage.uri = '';
  }

  obj.setURI = function (tmp) {
    //console.log("originating URI : " + tmp);
    var dnsFlag = $localStorage.uri;
    if (_.isNil(dnsFlag)) {
      $localStorage.uri = window.btoa(JSON.stringify(tmp));
    }
  };

  obj.getURI = function () {
    //console.log("get URI : " + $localStorage.uri);
    var ret = null;
    try {
      ret = DataFactory.parseLodash(window.atob($localStorage.uri));
    } catch (e) {
      console.log('[getSessionData] uri is not a valid base64 String.');
    }
    return ret;
  };

  return obj;
}
]);


app.factory("DataFactory", [
  "$http",
  "$timeout",
  "$q",
  "$location",
  "$auth",
  "$window",
  "$state",
  "StorageFactory",
  "Upload",
  function ($http, $timeout, $q, $location, $auth, $window, $state, StorageFactory, Upload) {
    var obj = {};
    var base_url = StorageFactory.getAppSettings('API');

    /***  UTILITIES - START ***/
    obj.parseLodash = function (str) {
      var ret = _.attempt(JSON.parse.bind(null, str));
      //console.log("[parseLodash] ret : ", ret);
      return ret;
    }

    obj.gotoDashBoard = function (str) {
      var accessLVL = parseInt(str);
      if ($auth.isAuthenticated()) {
        if (accessLVL >= 25) {
          //Sales Team Lead /SALES
          $state.go('sales');
        } else if (accessLVL >= 20) {
          //CopyWriter   
          $state.go('copywriter');
        } else if (accessLVL >= 10) {
          //Designer1  /Designer2 /Backup    
          $state.go('designer');
        } else {
          // Coordinator / System Administrator
          $state.go('coordinator');
        }
      } else {
        $state.go('login');
      }
    }

    obj.printThis = function () {
      $("#taskHeader").css("background-size", "");
      html2canvas($("#printSectionId"), {
        onrendered: function (canvas) {
          var myImage = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
          var innerContents = "<img id='Image' src=" + myImage + " style='width:100%;'></img>";
          var popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
          popupWinindow.document.open();
          popupWinindow.document.write("<html><head></head>" +
            "<body onload='window.print();'>" + innerContents + "</body></html>");
          popupWinindow.document.close();
        }
      });

    }

    obj.saveThis = function (taskID) {
      var section = $("#printSectionId");
      html2canvas(section, {
        onrendered: function (canvas) {
          var a = document.createElement('a');
          // toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
          a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
          a.download = taskID + '.jpg';
          a.click();
        }
      });
    }

    obj.cleanArray = function (tmpArray) {
      //console.log("[cleanArray] tmpArray - ", tmpArray);
      if (_.isNil(tmpArray)) {
        return null;
      } else {
        if (_.isArray(tmpArray)) {
          var newArray = [];
          for (i = 0, len = tmpArray.length; i < len; i++) {
            if (_.isNil(tmpArray[i]) || _.isEmpty(tmpArray[i])) {
            } else if (_.isDate(tmpArray[i])) {
              newArray.push(moment(tmpArray[i]).format('YYYY-MM-DD'));
            } else {
              newArray.push(tmpArray[i]);
            }
          }
          return newArray;
        } else {
          return tmpArray.trim();
        }
      }
    };
    /***  UTILITIES - END ***/

    /***  RESOLVABLE - START ***/
    // returns a PROMISE
    obj.getDevUserList = function () {
      //C:\xampp\htdocs\Creative\Jobs\lib\docs\dump\userList.json
      var deferred = $q.defer();
      var httpURL = "./lib/dump/userList.json";
      //console.log("[getDevUserList] - httpURL : " + JSON.stringify(httpURL));
      $http.get(httpURL).then(
        //success
        function (response) {
          //console.log("[getDevUserList] - response : " + JSON.stringify(response));
          deferred.resolve(response.data);
        },
        // error handler
        function (response) {
          deferred.reject(response);
          //console.log("[getDevUserList] Ooops, something went wrong..  \n " + JSON.stringify(response));
        }
      );

      return deferred.promise;
    }

    // returns a PROMISE
    obj.getSalesTeam = function () {
      var deferred = $q.defer()
      var httpURL = base_url + "/json/get-sales-teams";
      $http.get(httpURL).then(
        //success
        function (response) {
          //console.log("[getDevUserList] - response : " + JSON.stringify(response));
          deferred.resolve(response.data);
        },
        // error handler
        function (response) {
          deferred.reject(response);
          //console.log("[getDevUserList] Ooops, something went wrong..  \n " + JSON.stringify(response));
        }
      );

      return deferred.promise;
    };

    // returns a PROMISE
    obj.getUserRoleList = function () {
      //C:\xampp\htdocs\Creative\Jobs\lib\docs\dump\userList.json
      var deferred = $q.defer();
      var httpURL = "./lib/dump/Roles.json";
      //console.log("[getUserRoleList] - httpURL : " + JSON.stringify(httpURL));
      $http.get(httpURL).then(
        //success
        function (response) {
          //console.log("[getUserRoleList] - response : " + JSON.stringify(response));
          deferred.resolve(response.data);
        },
        // error handler
        function (response) {
          deferred.reject(response);
          //console.log("[getUserRoleList] Ooops, something went wrong..  \n " + JSON.stringify(response));
        }
      );

      return deferred.promise;
    }


    obj.getCLSMembers = function (filters) {
      //GET MEMBER  INFORMATION
      //GET REQUESTOR / CC RESPONSE INFORMATION
      // FOR STATE RESOLVE
      //console.log("[getMembers] - user_data : " + JSON.stringify(filters), filters);
      var deferred = $q.defer();
      var httpURL = base_url + "/json/users/classified-designers";
      $http.post(httpURL, filters).then(
        //success
        function (response) {
          deferred.resolve(response.data);
          //console.log("[getMembers] - response.data : " + JSON.stringify(response.data));
          //console.log("[getMembers] - response.status : " + JSON.stringify(response.status));
        },
        // error handler
        function (response) {
          deferred.reject(response);
          //console.log("[selectMember] Ooops, something went wrong..  \n " + JSON.stringify(response));
        }
      );

      return deferred.promise;
    };

    obj.getMembers = function (filters) {
      //GET MEMBER  INFORMATION
      //GET REQUESTOR / CC RESPONSE INFORMATION
      // FOR STATE RESOLVE
      //console.log("[getMembers] - user_data : " + JSON.stringify(filters), filters);
      var deferred = $q.defer();
      var httpURL = base_url + "/json/users/filtered-user-list";
      $http.post(httpURL, filters).then(
        //success
        function (response) {
          deferred.resolve(response.data);
          //console.log("[getMembers] - response.data : " + JSON.stringify(response.data));
          //console.log("[getMembers] - response.status : " + JSON.stringify(response.status));
        },
        // error handler
        function (response) {
          deferred.reject(response);
          //console.log("[selectMember] Ooops, something went wrong..  \n " + JSON.stringify(response));
        }
      );

      return deferred.promise;
    };

    obj.getCurrentUser = function () {
      var deferred = $q.defer();
      var userData = null;
      if ($auth.isAuthenticated()) userData = StorageFactory.getSessionData(false);

      if (_.isNil(userData)) {
        console.log('userData is Null');
        deferred.resolve(null);
      } else {
        exp = parseFloat($auth.getPayload().exp + '000');
        var d = new Date();
        var current = moment(d.getTime());
        var expiry = moment(new Date(exp));
        var b4Expiry = moment(new Date(exp)).subtract(10, 'm');

        // console.log('current : ' + moment(current).format("YYYY-MM-DD HH:mm:ss") + ' | current : ' + current);
        // console.log('b4Expiry : ' + moment(b4Expiry).format("YYYY-MM-DD HH:mm:ss") + ' | b4Expiry : ' + b4Expiry);
        // console.log('expiry : ' + moment(expiry).format("YYYY-MM-DD HH:mm:ss") + ' | expiry : ' + expiry);

        if (current.isAfter(expiry)) {
          console.log('Request Token');
          deferred.resolve(null);
        } else {
          if (current.isBetween(b4Expiry, expiry)) {
            console.log('Renew Token');
            var httpURL = "./service/renew.php";
            $http.post(httpURL, { 'id': window.btoa(userData.id) }).then(
              //success
              function (response) {
                //console.log("[getDevUserList] - response : " + JSON.stringify(response));
                $auth.setStorageType('localStorage');
                $auth.setToken(response.data);
                StorageFactory.setSessionExpiry();
                deferred.resolve(userData);
              },
              // error handler
              function (response) {
                deferred.reject(response);
                //console.log("[getDevUserList] Ooops, something went wrong..  \n " + JSON.stringify(response));
              }
            )
          } else {
            console.log('ReUSE Token');
            deferred.resolve(userData);
          }
        }
      }

      return deferred.promise;
    };

    obj.getIconList = function () {
      var httpURL = "./lib/dump/iconList.json";
      return $http.get(httpURL);
    }

    obj.getRadioList = function (type, filter) {
      var httpURL = "";
      if (type == 'contracts') {
        httpURL = base_url + "/json/get-radio-contracts";
        //httpURL = "./lib/dump/radioContracts.json";
        return $http.get(httpURL);
      } else if (type == 'class') {
        httpURL = "./lib/dump/radioJobClass.json";
        return $http.post(httpURL, filter);
      } else {
        httpURL = "./lib/dump/radioStations.json";
        return $http.get(httpURL);
      }

    }

    obj.getContentTypes = function () {
      //var httpURL = "./lib/dump/contentGrp.json";
      var httpURL = base_url + "/json/get-content-groups";
      return $http.get(httpURL);
    }

    obj.getImporterLogoGrp = function (type) {
      var httpURL = "";
      if (type == "Company Logo") {
        httpURL = base_url + "/json/company-logo-groups";
        //httpURL = "./lib/dump/coLogoGrp.json";
      } else if (type == "Obituary Pix") {
        httpURL = base_url + "/json/obituary-logo-groups";
        //httpURL = "./lib/dump/obitLogoGrp.json";
      } else {
        httpURL = base_url + "/json/advertiser-logo-groups";
        //httpURL = "./lib/dump/advLogoGrp.json";
      }
      return $http.get(httpURL);
    }

    obj.getJobTmpID = function (tmpID) {
      var deferred = $q.defer();
      var userData = StorageFactory.getSessionData(false);
      var httpURL = base_url + "/jobs/get-job-no";
      var tmpName = { logged_in_user: userData.id };

      //console.log("tmpID : " + tmpID + " | param : " + JSON.stringify(tmpName));
      if (tmpID == "00") {
        $http.post(httpURL, tmpName).then(
          //success
          function (response) {
            //console.log("[getJobTmpID] - response.data : " + JSON.stringify(response.data));
            //console.log("[getJobTmpID] - response.status : " + JSON.stringify(response.status));
            deferred.resolve(response.data.job_no);
          },
          // error handler
          function (response) {
            //console.log("[getJobTmpID] Ooops, something went wrong..  \n " +  JSON.stringify(response));
          }
        );
      } else {
        deferred.resolve(tmpID);
      }
      return deferred.promise;
    };
    /***  RESOLVABLE - END ***/

    obj.getStats = function (filter) {
      ///jobs/get-job-count
      //username, status
      var httpURL = base_url + "/jobs/get-job-count";
      //console.log("httpURL : " + httpURL + " | filter : " + JSON.stringify(filter));
      return $http.post(httpURL, filter);
    };

    obj.getJobList = function (filter) {
      //pass in: {username, status}
      var httpURL = base_url + "/json/get-job-list";
      //console.log("httpURL : " + httpURL + " | filter : " + JSON.stringify(filter));
      return $http.post(httpURL, filter);
    };

    obj.getTaskList = function (filter) {
      var httpURL =
        base_url + "/json/get-artwork-list";
      return $http.post(httpURL, filter);
    };

    obj.getTaskOptions = function (filter) {
      //Gets the list of Artwork JOBS user can create based on team (what a team can create)
      var httpURL = base_url + "/json/users/" + user;
      return $http.get(httpURL);
    };

    obj.getTask = function (filter, frm) {
      //Gets Artwork task
      var httpURL = '';
      if (frm == 'digital') {
        httpURL = base_url + "/digital-artworks/" + filter;
      } else if (frm == 'ooh') {
        httpURL = base_url + "/ooh-artworks/" + filter;
      } else if (frm == 'studio') {
        httpURL = base_url + "/studio-artworks/" + filter;
      } else if (frm == 'classified') {
        httpURL = base_url + "/classified-artworks/" + filter;
      } else if (frm == 'content') {
        httpURL = base_url + "/content-artworks/" + filter;
      } else if (frm == 'display') {
        httpURL = base_url + "/display-artworks/" + filter;
      } else if (frm == 'importer') {
        httpURL = base_url + "/importer-artworks/" + filter;
      } else if (frm == 'radio') {
        httpURL = base_url + "/radio-artworks/" + filter;
      }

      return $http.get(httpURL);
    };

    obj.getDocHistory = function (filters) {
      var httpURL = base_url + "/json/edit-history";
      return $http.post(httpURL, filters);
    };

    obj.getChatHistory = function (filters) {
      //post {task_id}    
      var httpURL = base_url + "/json/chat-history";
      return $http.post(httpURL, filters);
    };

    obj.getChildRequestorInf = function (filters) {
      var httpURL = base_url + "/jobs/get-requester-info";
      return $http.post(httpURL, { parent_id: filters });
    };

    obj.getArtworkTypes = function (filters) {
      var httpURL = base_url + "/json/artwork-types";
      return $http.post(httpURL, filters);
    };

    obj.getSize = function (filters) {
      var httpURL = base_url + "/json/sizes";
      return $http.post(httpURL, filters);
    };

    obj.getMember = function (filters) {
      //GET MEMBER  INFORMATION
      //GET REQUESTOR / CC RESPONSE INFORMATION
      //console.log("user_data : " + filters);
      var httpURL = base_url + "/json/users/filtered-user-list";
      return $http.post(httpURL, filters);
    };

    obj.getFilters = function () {
      var tmp = {
        text: { mask: ["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/] },
        extNum: { mask: ["x", /[0-9]/, /\d/, /\d/, /\d/] },
        phone: { mask: [/[0-9]/, /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, /\d/] },
        cash: { mask: [/[0-9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/] },
        etNum: { mask: [/[9]/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/] },
        size: { mask: [/[0-9]/, /\d/, " ", "x", " ", /\d/, /\d/] }
      };
      return tmp;
    };

    obj.getTaskIcons = function (filter) {
      httpURL = base_url + "/json/get-task-icons";
      return $http.post(httpURL, filter);
    };

    obj.getJobID = function (user, tmpID, isForm) {
      var httpURL = "";
      if (isForm) {
        if (tmpID > 0) {
          httpURL = base_url + "/jobs/" + tmpID;
          return $http.get(httpURL);
        } else {
          httpURL = base_url + "/jobs/get-job-no";
          return $http.post(httpURL, user);
        }
      } else {
        //ADMIN
        httpURL = base_url + "/jobs";
        return $http.get(httpURL);
      }
    };

    obj.getRequestor = function (user) {
      var httpURL = base_url + "/json/users/" + user;
      return $http.get(httpURL);
    };

    obj.getCreativeBriefs = function () {
      var httpURL = base_url + "/json/creative-briefs";
      return $http.get(httpURL);
    };

    obj.uploadTask = function (task, type, passedID) {
      var httpURL = "";
      if (type == "studio") {
        httpURL = base_url + "/studio-artworks";
      } else if (type == "digital") {
        httpURL = base_url + "/digital-artworks";
      } else if (type == "ooh") {
        httpURL = base_url + "/ooh-artworks";
      } else if (type == "display") {
        httpURL = base_url + "/display-artworks";
      } else if (type == "content") {
        httpURL = base_url + "/content-artworks";
      } else if (type == "classified") {
        httpURL = base_url + "/classified-artworks";
      } else if (type == "importer") {
        httpURL = base_url + "/importer-artworks";
      } else if (type == "radio") {
        httpURL = base_url + "/radio-artworks";
      }
      if (_.isNil(passedID)) { } else { httpURL = httpURL + "/" + passedID; };
      return $http.post(httpURL, task);
    };

    obj.uploadJobRequest = function (jobRequest, passedID) {
      var httpURL = base_url + "/jobs";
      if (_.isNil(passedID)) {
      } else {
        httpURL = base_url + "/jobs/" + passedID;
      }
      //console.log("[uploadJobRequest] httpURL : " + httpURL);
      return $http.post(httpURL, jobRequest);
    };

    obj.getProductList = function (q) {
      var httpURL = base_url + "/json/products";
      return $http.get(httpURL);
    };

    obj.uploadJobRequest2 = function (file) {
      tmpData = { jobOrder: file };
      var httpURL = base_url + "/jobs";
      ////console.log('httpURL : ' + JSON.stringify(httpURL) + ' | param : ' + JSON.stringify(tmpData));
      return $http.post(httpURL, file).then(
        //success
        function (response) {
          ////console.log('response.data : ' + JSON.stringify(response.data));
          ////console.log('response.status : ' + JSON.stringify(response.status));
          // file is uploaded successfully
          StorageFactory.setSessionData(file);
          return response;
        },
        // error handler
        function (response) {
          ////console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
          return response;
        }
      );
    };

    obj.uploadFiles = function (files, errFiles, details) {
      file.upload = Upload.upload({
        url: StorageFactory.getAppSettings('UPL'),
        method: "POST",
        file: file,
        data: details
      });
      return file.upload;
    };

    obj.deleteFiles = function (files) {
      var httpURL = "./service/delete.php";
      return $http.post(httpURL, files)
    }

    obj.authenticateUser = function (credentials) {
      var httpURL = "./service/login.php";
      return $http.post(httpURL, credentials)
    }

    obj.refreshToken = function (credentials) {
      var httpURL = "./service/renew.php";
      return $http.post(httpURL, credentials)
    }

    /* STUDIO APIs */
    obj.getCreativeTypes = function () {
      var httpURL = base_url + "/json/creative-types";
      return $http.get(httpURL);
    };

    /* OOH APIs */
    obj.getOOHStaticList = function () {
      var httpURL = base_url + "/json/static-specifications";
      return $http.get(httpURL);
    };

    obj.getOOHDigitalList = function () {
      var httpURL = base_url + "/json/digital-specifications";
      return $http.get(httpURL);
    };

    return obj;
  }
]);



app.factory("DocumentResource", function ($scope, $resource, getHeaderFilename) {
  $resource(
    "document/:Id",
    { Id: "@Id" },
    {
      download: {
        method: "GET",
        responseType: "arraybuffer",
        transformResponse: function (data, headers) {
          return {
            data: data,
            filename: parseHeaderFilename(headers)
          };
        }
      }
    }
  );
});

app.service("getHeaderFilename", function () {
  return function (headers) {
    var header = headers("content-disposition");
    var result = header.split(";")[1].trim().split("=")[1];
    return result.replace(/"/g, "");
  };
});

app.service("resourceError", function ($q) {
  var arrayBufferToString = function (buff) {
    var charCodeArray = Array.apply(null, new Uint8Array(buff));
    var result = "";
    for (i = 0, len = charCodeArray.length; i < len; i++) {
      code = charCodeArray[i];
      result += String.fromCharCode(code);
    }
    return result;
  };

  return function (error) {
    error.data = angular.fromJson(arrayBufferToString(error.data.data));
    return $q.reject(error);
  };
});

app.factory('FileReader', ['$q', '$window', function ($q, $window) {

  // Wrap the onLoad event in the promise
  var onLoad = function (reader, deferred, scope) {
    return function () {
      scope.$apply(function () {
        deferred.resolve(reader.result);
      });
    };
  };

  // Wrap the onLoad event in the promise
  var onError = function (reader, deferred, scope) {
    return function () {
      scope.$apply(function () {
        deferred.reject(reader.result);
      });
    };
  };

  // Wrap the onProgress event by broadcasting an event
  var onProgress = function (reader, scope) {
    return function (event) {
      scope.$broadcast('fileProgress', {
        total: event.total,
        loaded: event.loaded
      });
    };
  };

  // Instantiate a new Filereader with the wrapped properties
  var getReader = function (deferred, scope) {
    var reader = new $window.FileReader();
    reader.onload = onLoad(reader, deferred, scope);
    reader.onerror = onError(reader, deferred, scope);
    reader.onprogress = onProgress(reader, scope);
    return reader;
  };

  // Read a file as a data url
  var readAsDataURL = function (file, scope) {
    var deferred = $q.defer();

    var reader = getReader(deferred, scope);
    reader.readAsDataURL(file);

    return deferred.promise;
  };

  // Read a file as a text
  var readAsText = function (file, encoding, scope) {
    var deferred = $q.defer();

    var reader = getReader(deferred, scope);
    reader.readAsText(file, encoding);

    return deferred.promise;
  };

  // Read a file as a binary data
  var readAsBinaryString = function (file, scope) {
    var deferred = $q.defer();

    var reader = getReader(deferred, scope);
    reader.readAsBinaryString(file);

    return deferred.promise;
  };

  return {
    readAsDataURL: readAsDataURL,
    readAsBinaryString: readAsBinaryString,
    readAsText: readAsText
  };
}]);

app.factory("focus", function ($timeout, $window) {
  return function (id) {
    // timeout makes sure that is invoked after any other event has been triggered.
    // e.g. click events that need to run before the focus or
    // inputs elements that are in a disabled state but are enabled when those events
    // are triggered.
    $timeout(function () {
      var element = $window.document.getElementById(id);
      if (element) element.focus();
    });
  };
});
