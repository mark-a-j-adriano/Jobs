app.controller("creativeCTRL", function (
  $state,
  $auth,
  $uibModal,
  $stateParams,
  $timeout,
  $filter,
  toastr,
  focus,
  Upload,
  DataFactory,
  currentUser,
  orderID
) {
  ////console.log('creativeCTRL : START');

  var vm = this;
  vm.filesForDeletion = [];
  vm.isValid = true;
  vm.errorMsg = [];
  vm.currentUser = {};
  vm.job = {
    id: null,
    job_no: null
  };

  vm.cc_response_dsp = [];
  vm.creatives = [];
  vm.docHistory = [];
  vm.creativeMembers = [];
  vm.taskList = [];
  vm.qTaskResultError = false;
  vm.readOnly = true;
  vm.jobID = "";
  vm.MaterialDsp = null;
  vm.carousel = {
    preview: false,
    noWrap: false,
    interval: 5000,
    active: 0
  };

  vm.spinners = {
    materials: { visible: false, progress: 0 },
    artwork: { visible: false, progress: 0 },
    article: { visible: false, progress: 0 },
    creative: { visible: false, progress: 0 },
  };

  vm.artwork = {
    preview: false,
    noWrap: false,
    interval: 5000,
    active: 0
  };

  if (currentUser) {
    if (_.isNull(currentUser)) {
      $state.go("login");
    } else {
      //vm.currentUser = currentUser.id;
      //console.log("currentUser : " + JSON.stringify(currentUser.name));
      vm.currentUser = currentUser;
      vm.currentUser.canEdit = false;
      vm.currentUser.userAction = "";
    }
  } else {
    $state.go("login");
  }

  vm.iconList = [];
  vm.getIconList = function () {
    DataFactory.getIconList().then(
      //success
      function (response) {
        console.log("[getIconList] - response.data : " + JSON.stringify(response.data));
        console.log("[getIconList] - response.status : " + JSON.stringify(response.status));
        vm.iconList = response.data;
      },
      // error handler
      function (response) {
        //console.log("[getTaskIcons] Ooops, something went wrong..  \n " +    JSON.stringify(response) );
      }
    );
  }
  vm.getTaskIcons = function (salesTeam) {
    DataFactory.getTaskIcons({ name: salesTeam }).then(
      //success
      function (response) {
        //console.log("[getTaskIcons] - response.data : " + JSON.stringify(response.data));
        //console.log("[getTaskIcons] - response.status : " + JSON.stringify(response.status));

        angular.forEach(response.data[0], function (value, key) {
          //console.log("key:", key);
          //console.log("value:", value);
          for (x = 0; x < vm.iconList.length; x++) {
            var iconTmp = vm.iconList[x].taskName;
            if (iconTmp.toLowerCase() == key.toLowerCase() && value > 0) vm.iconList[x].isActive = true;
          }
        });
        //console.log("[getTaskIcons] updated List:" + JSON.stringify(vm.iconList));
      },
      // error handler
      function (response) {
        //console.log("[getTaskIcons] Ooops, something went wrong..  \n " +    JSON.stringify(response) );
      }
    );
  };

  vm.cleanArray = function (tmpArray) {
    var newArray = [];
    if (_.isUndefined(tmpArray) || _.isNull(tmpArray)) {
    } else {
      for (i = 0, len = tmpArray.length; i < len; i++) {
        if (_.isUndefined(tmpArray[i]) || _.isNull(tmpArray[i]) || _.isEmpty(tmpArray[i])) {
        } else {
          newArray.push(tmpArray[i]);
        }
      }
    }
    return newArray;
  };

  vm.animationsEnabled = true;
  var job_id = parseInt($stateParams.orderID);
  //console.log("job_id1 : " + $stateParams.orderID + " | job_id2 : " + orderID);
  vm.columnTitles = [
    { text: " ", predicate: "", sortable: false },
    { text: "Creative Team", predicate: "creative_form", sortable: true },
    { text: "Job Classification", predicate: "artwork_type", sortable: true },
    { text: "Designer", predicate: "designer", sortable: true },
    { text: "Copywriter", predicate: "writer", sortable: true, dataType: "number" },
    { text: "Date / Time Required", predicate: "due_date", sortable: true, dataType: "number" },
    { text: "Status", predicate: "status", sortable: true },
    { text: "Action", predicate: "", sortable: false }
  ];
  vm.accessControl = function () {
    var tmpFlag = false;

    var current_user = currentUser.id.toLowerCase().trim();
    var submitted_by = vm.job.submitted_by_username.toLowerCase().trim();
    var cc_response = "";
    if (_.isNull(vm.job.cc_response_username)) {
    } else {
      var cc_response = vm.job.cc_response_username.toLowerCase().trim();
    }
    /*
    //console.log('[accessControl] - currentUser : ' + JSON.stringify(currentUser));
    //console.log('[accessControl] - submitted_by_username : ' + JSON.stringify(vm.job.submitted_by_username));
    //console.log('[accessControl] - cc_response : ' + JSON.stringify(vm.job.cc_response));
    //console.log('[accessControl] - cc_response_username : ' + JSON.stringify(vm.job.cc_response_username));
    */
    var accessLVL = parseInt(currentUser.role);
    if (accessLVL >= 30) {
      //SALES //Sales Team Lead
      if ((current_user == submitted_by) || (current_user == cc_response)) tmpFlag = true;
    } else if (accessLVL > 20) {
      //CopyWriter
      if ((current_user == submitted_by) || (current_user == cc_response)) tmpFlag = true;
    } else if (accessLVL >= 15) {
      //Designer2 /Backup
    } else if (accessLVL >= 10) {
      //Designer1
    } else {
      //System Administrator & Coordinator
      tmpFlag = true;
    }
    return tmpFlag;
  };
  vm.toggleAnimation = function () {
    vm.animationsEnabled = !vm.animationsEnabled;
  };
  // date and time picker
  vm.MaskConfig = DataFactory.getFilters();
  vm.dateTimePicker = {
    date: new Date(),
    default: new Date(),
    datepickerOptions: {
      showWeeks: false,
      startingDay: 1,
      dateDisabled: function (data) {
        //////console.log('data : ' + JSON.stringify(data));
        var flag = false;
        var todaysDate = new Date();
        var tempDate = new Date(data.date);
        if (data.mode === "day") {
          if (todaysDate.toDateString() == tempDate.toDateString()) {
          } else if (tempDate < todaysDate) {
            flag = true;
          } else {
            var day = tempDate.getDay();
            if (day === 6 || day === 0) {
              flag = true;
            }
          }
        }

        return flag;
        //return (data.mode === 'day' && (new Date().toDateString() == data.date.toDateString()));
      }
    }
  };
  vm.openCalendar = function (e, picker) {
    vm[picker].open = true;
  };
  vm.getTaskIcons = function (salesTeam) {
    DataFactory.getTaskIcons({ name: salesTeam }).then(
      //success
      function (response) {
        //console.log("[getTaskIcons] - response.data : " + JSON.stringify(response.data));
        //console.log("[getTaskIcons] - response.status : " + JSON.stringify(response.status));

        angular.forEach(response.data[0], function (value, key) {
          //console.log("key:", key);
          //console.log("value:", value);
          for (x = 0; x < vm.iconList.length; x++) {
            var iconTmp = vm.iconList[x].taskName;
            if (iconTmp.toLowerCase() == key.toLowerCase() && value > 0) vm.iconList[x].isActive = true;
          }
        });
        //console.log("[getTaskIcons] updated List:" + JSON.stringify(vm.iconList));
      },
      // error handler
      function (response) {
        //console.log("[getTaskIcons] Ooops, something went wrong..  \n " +    JSON.stringify(response) );
      }
    );
  };
  vm.getDocHistory = function (jobNum) {
    ////console.log('[getDocHistory] - jobNum : ' + jobNum);
    DataFactory.getDocHistory({ job_no: jobNum }).then(
      //success
      function (response) {
        vm.docHistory = response.data;
        ////console.log('[getDocHistory] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getDocHistory] - response.status : ' + JSON.stringify(response.status));
        // error handler
      },
      function (response) {
        //console.log("DataFactory.getDocHistory] Ooops, something went wrong..  \n " +  JSON.stringify(response));
      }
    );
  };
  vm.getJobRequest = function (jobID) {
    DataFactory.getJobID({ logged_in_user: currentUser.id }, jobID, true).then(
      //success
      function (response) {
        //console.log("[getJobRequest] - response.data : " + JSON.stringify(response.data));
        //console.log("[getJobRequest] - response.status : " + JSON.stringify(response.status));
        vm.job = response.data;

        if (
          _.isUndefined(vm.job.creative_checkbox) ||
          _.isNull(vm.job.creative_checkbox) ||
          _.isEmpty(vm.job.materials)
        ) {
          vm.creatives = [];
        } else {
          vm.creatives = JSON.parse(vm.job.creative_checkbox);
        }

        if (_.isUndefined(vm.job.materials) ||
          _.isNull(vm.job.materials) ||
          _.isEmpty(vm.job.materials)) {
          vm.job.materials = [];
        } else {
          vm.job.materials = JSON.parse(vm.job.materials);
        }

        if (
          _.isUndefined(vm.job.creative_briefs) ||
          _.isNull(vm.job.creative_briefs) ||
          _.isEmpty(vm.job.creative_briefs)
        ) {
          vm.job.creative_briefs = [];
        } else {
          vm.job.creative_briefs = JSON.parse(vm.job.creative_briefs);
        }
        
        if (_.isUndefined(vm.job.tasks) ||
          _.isNull(vm.job.tasks) ||
          _.isEmpty(vm.job.team_members)
        ) {
          vm.job.tasks = [];
        } else {
          vm.job.tasks = [];
        }

        vm.job.ad_spend = $filter('currency')(parseFloat(vm.job.ad_spend),"");
        vm.job.production_cost =  $filter('currency')(parseFloat(vm.job.production_cost),"");

        if(_.isUndefined(vm.job.cc_response) || _.isNull(vm.job.cc_response)){
          vm.cc_response_dsp = [];
        }else{
          vm.cc_response_dsp = vm.job.cc_response.split(",");
        }
        
        vm.getTaskList(vm.job.id);
        vm.getDocHistory(vm.job.job_no);
        vm.getTaskIcons(vm.job.team);
        vm.currentUser.canEdit = vm.accessControl();
      },
      // error handler
      function (response) {
        //console.log("[getJobRequest] Ooops, something went wrong..  \n " +  JSON.stringify(response));
      }
    );
  };
  vm.getTaskList = function (jobID) {
    DataFactory.getTaskList({ job_id: jobID }).then(
      //success
      function (response) {
        //console.log("[getTaskList] - response.data : " + JSON.stringify(response.data));
        //console.log("[getTaskList] - response.status : " + JSON.stringify(response.status));
        vm.taskList = response.data;
        for (i = 0; i < vm.taskList.length; i++) {
          //console.log('due_date : |' + vm.taskList[i].due_date + '|');
          if (_.isUndefined(vm.taskList[i].due_date) || _.isNull(vm.taskList[i].due_date) || vm.taskList[i].due_date == '') {
            vm.taskList[i].due_date = ''
          } else {
            vm.taskList[i].due_date = new Date(vm.taskList[i].due_date);
          }

          if (_.isUndefined(vm.taskList[i].designer) || _.isNull(vm.taskList[i].designer)) {
          } else {
            vm.taskList[i].designer = vm.taskList[i].designer.split(",");
          }

          if (_.isUndefined(vm.taskList[i].writer) || _.isNull(vm.taskList[i].writer)) {
          } else {
            vm.taskList[i].writer = vm.taskList[i].writer.split(",");
          }
        }
      },
      // error handler
      function (response) {
        vm.qTaskResultError = true;
        //console.log("[getTaskList] Ooops, something went wrong..  \n " +   JSON.stringify(response));
      }
    );
  };
  vm.getTaskOptions = function (salesTeam) { };
  vm.setNewJobRequest = function (file, passedID) {
    DataFactory.uploadJobRequest(file, passedID).then(
      //success
      function (response) {
        //console.log("response.data : " + JSON.stringify(response.data));
        //console.log("response.status : " + JSON.stringify(response.status));
        if (_.isNull(passedID)) {
          vm.job.id = response.data;
        } else {
          var modalInstance = $uibModal
            .open({
              animation: vm.animationsEnabled,
              templateUrl: "partials/common/msgbox.html",
              controller: "msgBoxModalCtrl as ctrl",
              resolve: {
                parentData: function () {
                  var tmp = {
                    frm_class: "box-creative",
                    frm_title: "Success",
                    isConfirm: false,
                    msg:
                    "Successfully saved Job Order and you will be redirected to Dashboard."
                  };
                  return tmp;
                },
                msgList: function () {
                  return null;
                }
              }
            })
            .result.then(
            //success
            function (success) {
              //console.log("submitted value inside parent controller", success);
              if (vm.filesForDeletion.length > -1) {
                angular.forEach(vm.filesForDeletion, function (file) {
                  vm.clearFiles(file);
                })
              };
              vm.gotoDash(true);
            },
            //failure
            function (failure) {
              toastr.error(
                "Ooops, something went wrong..  \n " +
                JSON.stringify(failure),
                {
                  closeButton: true
                }
              );
            }
            );
        }
      },
      // error handler
      function (response) {
        toastr.error(
          "Ooops, something went wrong..  \n " + JSON.stringify(response),
          {
            closeButton: true
          }
        );
      }
    );
  };
  vm.checkValidity = function () {
    //console.log("Dirty --- vm.job : " + JSON.stringify(vm.job));
    ////console.log('checkValidity - START');
    vm.isValid = vm.Validate();
    ////console.log('Do Not Show Error BAR : ' + vm.isValid);
    if (vm.isValid) {
      ////console.log('isValid : true');
      var hasMaterial = false;
      var briefs = [];
      for (i = 0; i < vm.creatives.length; i++) {
        var tmp = {
          id: vm.creatives[i].id,
          name: vm.creatives[i].name,
          isSelected: vm.creatives[i].isSelected
        };

        briefs.push(tmp);
      }
      vm.job.creative_checkbox = JSON.stringify(briefs);
      vm.job.logged_in_user = vm.currentUser.id;

      vm.artwork.preview = false;
      if (_.isUndefined(vm.job.id) || _.isNull(vm.job.id)) {
      } else {
        vm.job._method = "put";
      }

      if (
        _.isUndefined(vm.job.meeting_schedule) ||
        _.isNull(vm.job.meeting_schedule) ||
        _.isEmpty(vm.job.meeting_schedule)
      ) {
      } else {
        vm.job.meeting_schedule = moment(vm.job.meeting_schedule).format(
          "YYYY-MM-DD HH:mm:ss"
        );
      }

      if (_.isUndefined(vm.job.materials) ||
        _.isNull(vm.job.materials) ||
        _.isEmpty(vm.job.materials)
      ) {
        vm.job.materials = [];
      } else {
        vm.job.materials = vm.cleanArray(vm.job.materials);
      }

      if (
        _.isUndefined(vm.job.creative_briefs) ||
        _.isNull(vm.job.creative_briefs) ||
        _.isEmpty(vm.job.creative_briefs)
      ) {
        vm.job.creative_briefs = [];
      } else {
        vm.job.creative_briefs = vm.cleanArray(vm.job.creative_briefs);
      }

      var tmpJob = angular.copy(vm.job);
      tmpJob.materials = JSON.stringify(tmpJob.materials);
      tmpJob.creative_briefs = JSON.stringify(tmpJob.creative_briefs);

      //console.log("Cleaned --- vm.job : " + JSON.stringify(tmpJob));
      vm.setNewJobRequest(tmpJob, tmpJob.id);
    } else {
      //console.log("isValid : false");
      toastr.error(vm.errorMsg[0].msg, {
        closeButton: true,
        onHidden: function () {
          ////console.log('Calling toastr onHidden function');
          vm.clearErrors();
        }
      });
    }
    ////console.log('checkValidity - END');
  };
  vm.Validate = function () {
    ////console.log('isValid - START');
    vm.errorMsg = [];
    var tmp = true;
    if (vm.spinners.creative.visible) {
      vm.errorMsg.push({ id: '', msg: 'Please wait until Creative Brief attachment is uploaded to server.' });
    } else if (vm.spinners.materials.visible) {
      vm.errorMsg.push({ id: '', msg: 'Please wait until Material attachment is uploaded to server.' });
    } else {
      var fldList = [
        {
          id: "title",
          name: "Client / Title"
        },
        {
          id: "booking_type",
          name: "Booking Type"
        },
        {
          id: "submitted_by",
          name: "Submitted By"
        },
        {
          id: "extension",
          name: "Extension"
        },
        {
          id: "mobile_no",
          name: "Mobile Number"
        },
        {
          id: "team",
          name: "Team"
        },
        // {
        //   id: "cc_response",
        //   name: "CC Response"
        // },
        // {
        //   id: "cc_extension",
        //   name: "Extension"
        // },
        // {
        //   id: "cc_mobile_no",
        //   name: "Mobile Number"
        // }
      ];

      if (JSON.stringify(vm.job) == "{}") {
        var jTmp = {
          id: "title",
          msg: "Client / Title is required."
        };
        vm.errorMsg.push(jTmp);
      } else {
        ////console.log('vm.job = ' + JSON.stringify(vm.job));
        ////console.log('fldList = ' + JSON.stringify(fldList));
        for (i = 0; i < fldList.length; i++) {
          var addError = false;

          ////console.log('fldList[' + i + '] : ' + fldList[i]);
          fld = vm.job[fldList[i].id];
          if (fld) {
            if (fldList[i].id == "mobile_no" || fldList[i].id == "cc_mobile_no") {
              ////console.log('[1] fld = ' + fld + ' | fldList[' + i + '] : ' + fldList[i].id);
              fld = fld.split("_").join("").trim();
              ////console.log('[2] fld = ' + fld + ' | fld.length : ' + fld.length);
              if (fld.length < 8) {
                addError = false;
                var jTmp = {
                  id: fldList[i].id.toLowerCase(),
                  msg: fldList[i].name.toUpperCase() + " is incorrect."
                };
                vm.errorMsg.push(jTmp);
              }
            } else if (
              fldList[i].id == "extension" ||
              fldList[i].id == "cc_extension"
            ) {
              ////console.log('fld = ' + fld + ' | fldList[' + i + '] : ' + fldList[i].id);
              fld = fld.split("_").join("").trim();
              if (fld.length < 4) {
                addError = false;
                var jTmp = {
                  id: fldList[i].id.toLowerCase(),
                  msg: fldList[i].name.toUpperCase() + " is incorrect."
                };
                vm.errorMsg.push(jTmp);
              }
            } else {
              if (fld.trim() == "") addError = true;
            }
          } else {
            addError = true;
          }

          if (addError) {
            var jTmp = {
              id: fldList[i].id.toLowerCase(),
              msg: fldList[i].name.toUpperCase() + " is required."
            };
            vm.errorMsg.push(jTmp);
          }
        }
      }

    }

    if (vm.errorMsg.length > 0) tmp = false;
    return tmp;
  };
  vm.openPage = function (nam) {
    console.log("newPath : " + nam +" | jobNum : " + vm.job.job_no + " | tasks : " +  vm.taskList.length );
    //$location.path("/" + nam + "/ABC123/00/");
    $state.go(nam, {
      orderID: vm.job.id,
      orderTitle: vm.job.title,
      action: "create",
      taskID: vm.job.job_no + "~" + (vm.taskList.length + 1)
    });
  };
  vm.clearErrors = function () {
    //console.log("set focus on : " + vm.errorMsg[0].id);
    focus(vm.errorMsg[0].id);
    vm.isValid = true;
    vm.errorMsg = [];
    toastr.clear();
  };
  vm.editJob = function () {
    vm.readOnly = !vm.readOnly;
    vm.currentUser.userAction = "Edit";
  };
  vm.gotoDash = function (flag) {
    var newLoc = "login";
    var accessLVL = parseInt(vm.currentUser.role);
    if (accessLVL >= 30) {
      //Sales Team Lead /SALES
      newLoc = "sales";
    } else if (accessLVL >= 20) {
      //CopyWriter
      newLoc = "copywriter";
    } else if (accessLVL >= 10) {
      //Designer1  /Designer2 /Backup
      newLoc = "designer";
    } else {
      // Coordinator / System Administrator
      newLoc = "coordinator";
    }
    if (flag) {
      //console.log("[gotoDash] - Filter failure");
      $state.go(newLoc);
    } else {
      //console.log("[gotoDash] - userAction : " + vm.currentUser.userAction);
      if (vm.currentUser.userAction == "Create" || vm.currentUser.userAction == "Edit") {
        //console.log("[gotoDash] - confirmation box");

        var modalInstance = $uibModal
          .open({
            animation: vm.animationsEnabled,
            templateUrl: "partials/common/msgbox.html",
            controller: "msgBoxModalCtrl as ctrl",
            resolve: {
              parentData: function () {
                var tmp = {
                  frm_class: "box-creative",
                  frm_title: "Confirm Exit",
                  isConfirm: true,
                  msg:
                  "Are you sure you want to go Dashboard without saving your changes?"
                };
                return tmp;
              },
              msgList: function () {
                return null;
              }
            }
          })
          .result.then(
          function (submitVar) {
            //console.log("submitted value inside parent controller", submitVar);
            if (submitVar) $state.go(newLoc);
          },
          function (res) {
            //console.log("cancel gotoDash", res);
          }
          );
      } else {
        //console.log("[gotoDash] - Filter failure");
        $state.go(newLoc);
      }
    }

  };
  vm.openTask = function (taskTmp) {
    ////console.log('jobTmp : ' + JSON.stringify(jobTmp));
    //console.log("taskTmp - PARENT : " + JSON.stringify(taskTmp));
    //$location.path("/" + nam + "/ABC123/00/");
    $state.go(taskTmp.creative_form, {
      orderID: vm.job.id,
      orderTitle: vm.job.title,
      action: "read",
      taskID: taskTmp.id
    });
  };

  vm.downloadFiles = function (isMaterial) {
    if (isMaterial) {
      if (_.isUndefined(vm.job.materials) || _.isNull(vm.job.materials)) {
        //console.log("Materials for job is not defined.");
      } else {
        var mat = vm.job.materials;
        for (var i = 0, len = mat.length; i < len; i++) {
          //vm.download( variable here );
        }
      }
    } else {
      if (
        _.isUndefined(vm.job.creative_briefs) ||
        _.isNull(vm.job.creative_briefs)
      ) {
        //console.log("Materials for job is not defined.");
      } else {
        var brf = vm.job.creative_briefs;
        for (var i = 0, len = brf.length; i < len; i++) {
          //vm.download( variable here );
        }
      }
    }
  };

  vm.download = function (document) {
    DocumentResource.download(document)
      .$promise.then(function (result) {
        var url = URL.createObjectURL(new Blob([result.data]));
        var a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.target = "_blank";
        a.click();
      })
      .catch(resourceError)
      .catch(function (error) {
        //console.log(error.data); // in JSON
      });
  };

  vm.uploadFiles = function (files, type) {

    if (type == "creative_briefs") {
      if (_.isUndefined(vm.job.creative_briefs) || _.isNull(vm.job.creative_briefs)) {
        vm.job.creative_briefs = [];
      }
      vm.spinners.creative.visible = true;
      vm.spinners.creative.progress = 0;
    } else {
      if (_.isUndefined(vm.job.materials) || _.isNull(vm.job.materials)) {
        vm.job.materials = [];
      }
      vm.spinners.materials.visible = true;
      vm.spinners.materials.progress = 0;
    }


    var tmpJobID = null;
    if (_.isUndefined(vm.job.job_no) || _.isNull(vm.job.job_no)) {
      tmpJobID = orderID;
    } else {
      tmpJobID = vm.job.job_no;
    }
    //console.log("traceNum : " + orderID);

    var details = {
      formType: "job",
      fileDesc: type,
      traceNum: tmpJobID
    };
    //console.log("[uploadFiles] - details : " + JSON.stringify(details));
    var timeStamp = new Date();

    angular.forEach(files, function (file) {
      file.upload = Upload.upload({
        url: "./service/upload.php",
        method: "POST",
        file: file,
        data: details
      });

      file.upload.then(
        function (response) {
          //SUCCESS
          $timeout(function () {
            var res = response.data;
            //console.log("[uploadFiles] - result : " + JSON.stringify(res));

            if (res.indexOf("ERROR") > 0) {
            } else {
              var arr = res.split("/" + vm.job.job_no + "/");
              //console.log("[uploadFiles] - arr[0] : " + JSON.stringify(arr[0]));
              //console.log("[uploadFiles] - arr[1] : " + JSON.stringify(arr[1]));
              var fileTmp = {
                name: arr[1],
                size: file.size,
                height: file.$ngfHeight,
                width: file.$ngfWidth,
                type: file.type,
                url: "service/tmp/" + res,
                uploadBy: vm.currentUser.id,
                uploadDt: moment(timeStamp).format("YYYY-MM-DD HH:mm:ss")
              };
              //console.log("[uploadFiles] - fileTmp : " + JSON.stringify(fileTmp));

              if (type == "creative_briefs") {
                vm.job.creative_briefs.push(fileTmp);
              } else {
                vm.job.materials.push(fileTmp);
              }
            }

            if (type == "creative_briefs") {
              vm.job.creative_briefs.visible = vm.cleanArray(vm.job.creative_briefs);
              vm.spinners.creative = false;
              vm.spinners.creative.progress = 0;
            } else {
              vm.job.materials = vm.cleanArray(vm.job.materials);
              vm.spinners.materials.visible = false;
              vm.spinners.materials.progress = 0;
            }
          });
        },
        function (response) {
          //FAILURE
          if (response.status > 0) {
            vm.spinners.materials = false;
            var errorMsg = response.status + ": " + response.data;
            //console.log("[uploadFiles] - errorMsg : " + JSON.stringify(errorMsg));
          }
        },
        function (evt) {
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
          if (type == "creative_briefs") {
            vm.spinners.creative.progress = file.progress;
          } else {
            vm.spinners.materials.progress = file.progress;
          }
          ////console.log("file.progress:", file.progress);
        }
      );
    });
  };

  vm.deleteFile = function (ndex, file, type) {
    //console.log('[deleteFile] - type : ' + type);
    //console.log('[deleteFile] - file : ' + JSON.stringify(file));
    vm.filesForDeletion.push(file);
    if (type == 'creative_briefs') {
      //vm.job.creative_briefs
      vm.job.creative_briefs[ndex] = null;
      vm.job.creative_briefs = vm.cleanArray(vm.job.creative_briefs);
    } else {
      //vm.job.materials
      vm.job.materials[ndex] = null;
      vm.job.materials = vm.cleanArray(vm.job.materials);
    }
  };

  vm.clearFiles = function (file) {
    var ret = false;
    var url = file.url.trim();
    //console.log("Deleting uploaded file : " + url);
    DataFactory.deleteFiles({ fileLoc: url }).then(
      //success
      function (response) {
        //console.log('[clearFiles] - response.data : ' + JSON.stringify(response.data));
        //console.log('[clearFiles] - response.status : ' + JSON.stringify(response.status));
        ret = true;
      },
      // error handler
      function (response) {
        //console.log('[clearFiles] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      });
    return ret;
  }

  vm.getRequestor = function (username) {
    DataFactory.getRequestor(username).then(
      //success
      function (response) {
        //console.log("[getRequestor] - response.data : " + JSON.stringify(response.data));
        //console.log("[getRequestor] - response.status : " +   JSON.stringify(response.status));
        vm.job = response.data;
        vm.job.status = "new";
        vm.job.id = null;
        vm.job.logged_in_user = username;
        vm.job.tasks = [];
        vm.job.job_no = orderID;
        vm.job.meeting_location = "CreativeLAB";
        vm.getCreativeBriefs(true);
        vm.getTaskIcons(vm.job.team);
      },
      // error handler
      function (response) {
        //console.log("[DataFactory.getRequestor] Ooops, something went wrong..  \n " +          JSON.stringify(response));
      }
    );
  };
  vm.getCreativeBriefs = function (isNew) {
    DataFactory.getCreativeBriefs().then(
      //success
      function (response) {
        vm.creatives = response.data;
      },
      // error handler
      function (response) {
        ////console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
  };

  vm.showMaterialPreview = function () {
    vm.artwork.preview = !vm.artwork.preview;
    if (_.isUndefined(vm.job.materials) || _.isNull(vm.job.materials)) {
    } else {
      if (vm.artwork.preview)
        vm.MaterialDsp = vm.cleanArray(angular.copy(vm.job.materials));
    }
  };

  vm.selectTeam = function () {
    var tmpData = {
      team_name: null,
      is_Multiple: "0",
      division: null,
      role: null,
      primary: null,
    };

    var modalInstance = $uibModal.open({
      animation: vm.animationsEnabled,
      templateUrl: 'partials/common/member.html',
      controller: 'memberModalCtrl as ctrl',
      resolve: {
        parentData: function () {
          var tmp = {
            frm_class: 'box-creative',
            user_data: tmpData,
            return_fld: 'team',
            default: vm.job.team,
          };
          return tmp;
        },
        members: function (DataFactory) {
          return DataFactory.getSalesTeam();
        }
      }
    }).result.then(function (submitVar) {
      console.log('[selectTeam] - submitVar', submitVar);
      vm.job.team = submitVar
    })
  };

  vm.selectUser = function (team, div, rol, retFld, order) {
    var tmpData = {
      team_name: team,
      is_Multiple: "1",

      division: div,
      role: rol,
      primary: order,
    };

    var default_val = vm.job[retFld + "_username"];
    var modalInstance = $uibModal.open({
      animation: vm.animationsEnabled,
      templateUrl: 'partials/common/member.html',
      controller: 'memberModalCtrl as ctrl',
      resolve: {
        parentData: function () {
          var tmp = {
            frm_class: 'box-creative',
            return_fld: retFld,
            user_data: tmpData,
            default: default_val,
          };
          return tmp;
        },
        members: function (DataFactory) {
          return DataFactory.getMembers(tmpData);
        }
      }
    }).result.then(function (submitVar) {
      console.log("submitted value inside parent controller", submitVar);
      if (_.isUndefined(submitVar.name) || _.isNull(submitVar.name) || submitVar.name == "") {
        vm.job[retFld] = "";
        vm.job[retFld + "_username"] = "";
        vm.cc_response_dsp = [];
      } else {
        vm.job[retFld] = submitVar.name;
        vm.job[retFld + "_username"] = submitVar.username;
        vm.cc_response_dsp = _.uniq(submitVar.name.split(","));
      }
    })

  };


  vm.copyTask = function(){
    alert('Function not yet available!');
  }

  //console.log("columnTitle : " + JSON.stringify(vm.columnTitle));
  //console.log("$stateParams.orderID : " + JSON.stringify(job_id));
  if (job_id > 0) {
    //console.log("job_id - 2");
    vm.currentUser.userAction = "Read";
    vm.getIconList();
    vm.getJobRequest(job_id);
  } else {
    //console.log("job_id - 1");
    vm.readOnly = false;
    vm.currentUser.canEdit = true;
    vm.currentUser.userAction = "Create";
    vm.getIconList();
    vm.getRequestor(vm.currentUser.id);
  }

  ////console.log('creativeCTRL : END');
});
