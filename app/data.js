app.factory("StorageFactory", ["$localStorage", "$auth", function ($localStorage, $auth) {
  var obj = {};
  var win_URI = null;

  obj.clearSessionData = function () {
    delete $localStorage.winURI;
    delete $localStorage.userStamp;
    delete $localStorage.expireStamp;
    delete $localStorage.dataStamp;
    return null;
  };

  obj.getSessionData2 = function (dataFlag) {
    var ret = null;

    var d = new Date();
    var current = d.getTime();
    ////console.log('current : ' + JSON.stringify(current));

    // Get Schedule
    var stored_time = $localStorage.expireStamp;
    if (stored_time == undefined || stored_time == "null") stored_time = 0;
    if (stored_time < current) {
      // Remove expired data
      delete $localStorage.userStamp;
      delete $localStorage.expireStamp;
      delete $localStorage.dataStamp;
      //$auth.removeToken();
      return null;
    } else {
      //Renew expiry Stamp
      d = new Date();
      current = d.getTime();
      $localStorage.expireStamp = current + 900000;

      if (dataFlag) {
        return $localStorage.dataStamp;
      } else {
        return $localStorage.userStamp;
      }
    }
  };
  obj.getSessionData = function (dataFlag) {
    var ret = null;
    if ($auth.isAuthenticated()) {
      if (dataFlag) {
        return $localStorage.dataStamp;
      } else {
        return $localStorage.userStamp;
      }
    } else {
      var d = new Date();
      var current = d.getTime();
      ////console.log('current : ' + JSON.stringify(current));

      // Get Schedule
      var stored_time = $localStorage.expireStamp;
      if (stored_time == undefined || stored_time == "null") stored_time = 0;
      if (stored_time < current) {
        // Remove expired data
        delete $localStorage.userStamp;
        delete $localStorage.expireStamp;
        delete $localStorage.dataStamp;
        $auth.removeToken();
        return null;
      } else {
        //Renew expiry Stamp
        d = new Date();
        current = d.getTime();
        $localStorage.expireStamp = current + 900000;

        if (dataFlag) {
          return $localStorage.dataStamp;
        } else {
          return $localStorage.userStamp;
        }
      }
    }


  };

  obj.setSessionData = function (userData, tmpData) {
    var d = new Date();
    var current = d.getTime();
    ////console.log('setSessionData UserData: ' + JSON.stringify(userData));
    $localStorage.userStamp = userData;
    $localStorage.expireStamp = current + 900000;
    $localStorage.dataStamp = tmpData;
    var dnsFlag = $localStorage.dnsURI;
    if (_.isUndefined(dnsFlag) || _.isNull(dnsFlag)) { } else { delete $localStorage.dnsURI }
  };

  obj.setFlg = function () {
    $localStorage.dnsURI = true;
  }

  obj.setURI = function (tmp) {
    //console.log("originating URI : " + tmp);
    var dnsFlag = $localStorage.dnsURI;
    if (_.isUndefined(dnsFlag) || _.isNull(dnsFlag)) {
      $localStorage.winURI = tmp;
    }
  };

  obj.getURI = function () {
    //console.log("get URI : " + $localStorage.winURI);
    return $localStorage.winURI;
  };

  return obj;
}
]);

app.factory("DataFactory", [
  "$http",
  "$timeout",
  "$q",
  "$location",
  "StorageFactory",
  "Upload",
  function ($http, $timeout, $q, $location, StorageFactory, Upload) {
    var obj = {};
    var base_url = "http://creativelab-dev.sphnet.com.sg";
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
      var userData = StorageFactory.getSessionData(false);
      deferred.resolve(userData);
      return deferred.promise;
    };

    obj.getImporterLogoGrp = function (type) {
      var httpURL = "";
      if (type == "Company Logo") {
        httpURL = "./lib/dump/coLogoGrp.json";
      } else if (type == "Obituary Pix") {
        httpURL = "./lib/dump/obitLogoGrp.json";
      } else {
        httpURL = "./lib/dump/advLogoGrp.json";
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
    }

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
      if (_.isNull(passedID)) { } else { httpURL = httpURL + "/" + passedID; };
      return $http.post(httpURL, task);
    };

    obj.uploadJobRequest = function (jobRequest, passedID) {
      var httpURL = base_url + "/jobs";
      if (_.isNull(passedID)) {
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
        url: "./service/upload.php",
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
