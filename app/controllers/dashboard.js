app.controller('salesDashCTRL', function ($state, $stateParams, $uibModal, toastr, DataFactory, currentUser) {
  ////console.log('salesDashCTRL : START');

  var vm = this;
  vm.jobs = [];
  vm.qResultError = false;
  vm.orderByField = 'job_no';
  vm.reverseSort = false;
  vm.stats = null;
  vm.animationsEnabled = true;
  vm.pageSize = 30;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.toggleAnimation = function () {
    vm.animationsEnabled = !vm.animationsEnabled;
  };

  if (currentUser) {
    if (_.isNull(currentUser)) {
      $state.go('login');
    } else {
      vm.currentUser = currentUser;
      vm.currentUser.canEdit = '';
      vm.currentUser.userAction = '';
    }
  } else {
    $state.go('login');
  }

  vm.columnTitle = [
    { text: " ", predicate: " ", sortable: true, dataType: "string" },
    //{ text: "Job Number", predicate: "job_no", sortable: true, dataType: "string" },
    { text: "Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Booking Type", predicate: "booking_type", sortable: true, dataType: "string" },
    { text: "Ad Spend", predicate: "ad_spend", sortable: true, dataType: "number" },
    { text: "Production Cost", predicate: "production_cost", sortable: true, dataType: "number" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  vm.subColumnTitle = [
    { text: "#", predicate: "", sortable: false, dataType: "number" },
    { text: "Creative Team", predicate: "creative_form", sortable: true, dataType: "string" },
    { text: "Job Classification", predicate: "artwork_type", sortable: true, dataType: "string" },
    { text: "Due Date", predicate: "due_date", sortable: true, dataType: "string" },
    { text: "Pub Date", predicate: "pub_date", sortable: true, dataType: "string" },
    { text: "Designer", predicate: "designer", sortable: true, dataType: "string" },
    { text: "Copywriter", predicate: "writer", sortable: true, dataType: "string" },
    { text: "Submitted Date", predicate: "submit_date", sortable: true, dataType: "string" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  ////console.log('columnTitle : ' + JSON.stringify(vm.columnTitle));
  vm.getJobList = function (tmpStatus) {
    ////console.log('[getJobList] - START');
    //pass in: {username, status}
    var filter = { username: currentUser.id, status: tmpStatus, as_sales: true };
    DataFactory.getJobList(filter).then(
      //success
      function (response) {
        ////console.log('[getJobList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getJobList] - response.status : ' + JSON.stringify(response.status));
        vm.jobs = response.data;
        vm.totalItems = vm.jobs.length;
        console.clear();
        for (x = 0; x < vm.jobs.length; x++) {
          vm.jobs[x].tasks = JSON.parse(vm.jobs[x].tasks);
          for (y = 0; y < vm.jobs[x].tasks.length; y++) {
            if (_.isUndefined(vm.jobs[x].tasks[y].designer) || _.isNull(vm.jobs[x].tasks[y].designer)) {
            } else {
              vm.jobs[x].tasks[y].designer = vm.jobs[x].tasks[y].designer.split(",");
            }

            if (_.isUndefined(vm.jobs[x].tasks[y].writer) || _.isNull(vm.jobs[x].tasks[y].writer)) {
            } else {
              vm.jobs[x].tasks[y].writer = vm.jobs[x].tasks[y].writer.split(",");
            }


            if (_.isUndefined(vm.jobs[x].tasks[y].due_date) || _.isNull(vm.jobs[x].tasks[y].due_date) || vm.jobs[x].tasks[y].due_date == '') {
              vm.jobs[x].tasks[y].due_date = '';
            } else {
              var tmpDue = new Date(vm.jobs[x].tasks[y].due_date);
              vm.jobs[x].tasks[y].due_date = (_.isDate(tmpDue) ? tmpDue : '');
            }

            if (_.isUndefined(vm.jobs[x].tasks[y].submitted_date) || _.isNull(vm.jobs[x].tasks[y].submitted_date)) {
              vm.jobs[x].tasks[y].submitted_date = '';
            } else {
              vm.jobs[x].tasks[y].submitted_date = new Date(vm.jobs[x].tasks[y].submitted_date);
            }

            if (_.isUndefined(vm.jobs[x].tasks[y].pub_date) || _.isNull(vm.jobs[x].tasks[y].pub_date) || vm.jobs[x].tasks[y].pub_date == '') {
              vm.jobs[x].tasks[y].pub_date = '';
            } else {
              var pub_date = vm.jobs[x].tasks[y].pub_date;
              //if (pub_date.indexOf(", ") > 0) {
              var str = [];
              var res = pub_date.split(",");
              for (z = 0; z < res.length; z++) {
                if (_.isUndefined(res[z]) || _.isNull(res[z]) || res[z] == '') {
                } else {
                  var tmpDt = new Date(res[z].trim());
                  if (_.isDate(tmpDt)) str.push(tmpDt);
                  //str.push(pub_date[z]);
                }
              }
              vm.jobs[x].tasks[y].pub_date = str;
            }


          }
        }
        //console.log('[getJobList] - final.data : ' + JSON.stringify(vm.jobs));
      },
      // error handler
      function (response) {
        vm.qResultError = true;
        ////console.log('[getJobList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getJobList] - END');
  };
  vm.openJobReq = function (jobID) {
    $state.go('creative', { orderID: jobID });
  };
  vm.go = function (job) {
    ////console.log('job.Title - [GO] : ' + job.title)
  };

  vm.accessControl = function () {
    var accessLVL = parseInt(currentUser.role);
    if (accessLVL >= 30) {
      //SALES //Sales Team Lead

    } else if (accessLVL >= 20) {
      //CopyWriter

    } else if (accessLVL >= 10) {
      //Designer1 //Designer2 /Backup

    } else {
      //System Administrator & Coordinator

    }
  }

  vm.openTask = function (jobTmp, taskTmp) {
    ////console.log('jobTmp : ' + JSON.stringify(jobTmp));
    ////console.log('taskTmp : ' + JSON.stringify(taskTmp));
    //$location.path("/" + nam + "/ABC123/00/");
    $state.go(taskTmp.creative_form, {
      orderID: jobTmp.id,
      orderTitle: jobTmp.title,
      action: 'read',
      taskID: taskTmp.id,
    });
  };

  vm.getStatList = function (tmpStatus) {
    ////console.log('[getStatList] - START');
    //pass in: {username, status}
    //var filter = { username: currentUser.id, status: tmpStatus };
    var filter = { username: currentUser.id, as_sales: true };
    DataFactory.getStats(filter).then(
      //success
      function (response) {
        ////console.log('[getStatList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getStatList] - response.status : ' + JSON.stringify(response.status));
        vm.stats = response.data;
      },
      // error handler
      function (response) {
        ////console.log('[getStatList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getStatList] - END');
  };

  vm.getJobList('');
  vm.getStatList('In Progress');
  ////console.log('salesDashCTRL : END');
});

app.controller('designerDashCTRL', function ($state, $stateParams, $uibModal, toastr, DataFactory, currentUser) {
  ////console.log('designerDashCTRL : START');

  var vm = this;
  vm.tasks = [];
  vm.qResultError = false;
  vm.orderByField = 'task_no';
  vm.reverseSort = false;
  vm.stats = null;
  vm.pageSize = 30;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.animationsEnabled = true;
  vm.toggleAnimation = function () {
    vm.animationsEnabled = !vm.animationsEnabled;
  };

  if (currentUser) {
    if (_.isNull(currentUser)) {
      $state.go('login');
    } else {
      vm.currentUser = currentUser;
      vm.currentUser.canEdit = '';
      vm.currentUser.userAction = '';
    }
  } else {
    $state.go('login');
  }

  vm.columnTitle = [
    { text: " ", predicate: " ", sortable: true, dataType: "string" },
    { text: "Job Number", predicate: "job_no", sortable: true, dataType: "string" },
    { text: "Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Booking Type", predicate: "booking_type", sortable: true, dataType: "string" },
    { text: "Ad Spend", predicate: "ad_spend", sortable: true, dataType: "number" },
    { text: "Production Cost", predicate: "production_cost", sortable: true, dataType: "number" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  vm.subColumnTitle = [
    { text: "#", predicate: " ", sortable: false, dataType: "number" },
    { text: "Client / Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Creative Team", predicate: "creative_form", sortable: true, dataType: "string" },
    { text: "Job Classification", predicate: "artwork_type", sortable: true, dataType: "string" },
    { text: "Due Date", predicate: "due_date", sortable: true, dataType: "string" },
    { text: "Pub Date", predicate: "pub_date", sortable: true, dataType: "string" },
    { text: "Ad Size (cm x col)", predicate: "pub_size", sortable: true, dataType: "string" },
    { text: "Copywriter", predicate: "writer", sortable: true, dataType: "string" },
    { text: "Sales", predicate: "sales", sortable: true, dataType: "string" },
    { text: "Submit Date", predicate: "submit_date", sortable: true, dataType: "string" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  ////console.log('columnTitle : ' + JSON.stringify(vm.columnTitle));
  vm.getTaskList = function (tmpStatus) {
    ////console.log('[getJobList] - START');
    //pass in: {username, status}
    var filter = { username: currentUser.id, status: tmpStatus, as_sales: false };
    DataFactory.getJobList(filter).then(
      //success
      function (response) {
        //console.log('[getJobList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getJobList] - response.status : ' + JSON.stringify(response.status));
        vm.tasks = response.data;
        vm.totalItems = vm.tasks.length;
        for (i = 0; i < vm.tasks.length; i++) {
          if (_.isUndefined(vm.tasks[i].due_date) || _.isNull(vm.tasks[i].due_date) || vm.tasks[i].due_date == '') {
            vm.tasks[i].due_date = ''
          } else {
            vm.tasks[i].due_date = new Date(vm.tasks[i].due_date);
          }

          if (_.isUndefined(vm.tasks[i].submitted_date) || _.isNull(vm.tasks[i].submitted_date)) {
          } else {
            vm.tasks[i].submitted_date = new Date(vm.tasks[i].submitted_date);
          }

          if (_.isUndefined(vm.tasks[i].pub_date) || _.isNull(vm.tasks[i].pub_date) || vm.tasks[i].pub_date == '') {
            vm.tasks[i].pub_date = ''
          } else {
            var pub_date = vm.tasks[i].pub_date;
            //if (pub_date.indexOf(", ") > 0) {
            var str = [];
            var res = pub_date.split(",");
            for (z = 0; z < res.length; z++) {
              if (_.isUndefined(res[z]) || _.isNull(res[z]) || res[z] == '') {
              } else {
                var tmpDt = new Date(res[z].trim());
                if (_.isDate(tmpDt)) str.push(tmpDt);
                //str.push(pub_date[z]);
              }
            }
            vm.tasks[i].pub_date = str;
          }

          if (_.isUndefined(vm.tasks[i].designer) || _.isNull(vm.tasks[i].designer)) {
          } else {
            vm.tasks[i].designer = vm.tasks[i].designer.split(",");
          }

          if (_.isUndefined(vm.tasks[i].writer) || _.isNull(vm.tasks[i].writer)) {
          } else {
            vm.tasks[i].writer = vm.tasks[i].writer.split(",");
          }
        }
      },
      // error handler
      function (response) {
        vm.qResultError = true;
        ////console.log('[getJobList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getJobList] - END');
  };


  vm.getStatList = function (tmpStatus) {
    ////console.log('[getStatList] - START');
    //pass in: {username, status}
    //var filter = { username: currentUser.id, status: tmpStatus };
    var filter = { username: currentUser.id, as_sales: false };
    DataFactory.getStats(filter).then(
      //success
      function (response) {
        ////console.log('[getStatList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getStatList] - response.status : ' + JSON.stringify(response.status));
        vm.stats = response.data;
      },
      // error handler
      function (response) {
        ////console.log('[getStatList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getStatList] - END');
  };

  vm.go = function (job) {
    ////console.log('job.Title - [GO] : ' + job.title)
  };


  vm.openTask = function (jobTmp, taskTmp) {
    //console.log('[openTask]-jobTmp : ' + JSON.stringify(jobTmp));
    //console.log('[openTask]-taskTmp : ' + JSON.stringify(taskTmp));
    $state.go(taskTmp.creative_form, {
      orderID: taskTmp.task_no,
      orderTitle: taskTmp.title,
      action: 'read',
      taskID: taskTmp.id,
    });
  };

  vm.getTaskList('In Progress');
  vm.getStatList('In Progress');

  ////console.log('designerDashCTRL : END');
});

app.controller('copywriterDashCTRL', function ($state, $stateParams, $uibModal, toastr, DataFactory, currentUser) {
  ////console.log('copywriterDashCTRL : START');

  var vm = this;
  vm.pageSize = 30;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.tasks = [];
  vm.qResultError = false;
  vm.orderByField = 'task_no';
  vm.reverseSort = false;
  vm.stats = null;

  vm.animationsEnabled = true;
  vm.toggleAnimation = function () {
    vm.animationsEnabled = !vm.animationsEnabled;
  };

  if (currentUser) {
    if (_.isNull(currentUser)) {
      $state.go('login');
    } else {
      vm.currentUser = currentUser;
      vm.currentUser.canEdit = '';
      vm.currentUser.userAction = '';
    }
  } else {
    $state.go('login');
  }


  vm.columnTitle = [
    { text: " ", predicate: " ", sortable: true, dataType: "string" },
    { text: "Job Number", predicate: "job_no", sortable: true, dataType: "string" },
    { text: "Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Booking Type", predicate: "booking_type", sortable: true, dataType: "string" },
    { text: "Ad Spend", predicate: "ad_spend", sortable: true, dataType: "number" },
    { text: "Production Cost", predicate: "production_cost", sortable: true, dataType: "number" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  vm.subColumnTitle = [
    { text: "#", predicate: " ", sortable: false, dataType: "number" },
    { text: "Client / Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Creative Team", predicate: "creative_form", sortable: true, dataType: "string" },
    { text: "Job Classification", predicate: "artwork_type", sortable: true, dataType: "string" },
    { text: "Due Date", predicate: "due_date", sortable: true, dataType: "string" },
    { text: "Pub Date", predicate: "pub_date", sortable: true, dataType: "string" },
    { text: "Ad Size (cm x col)", predicate: "pub_size", sortable: true, dataType: "string" },
    { text: "Designer", predicate: "designer", sortable: true, dataType: "string" },
    { text: "Sales", predicate: "sales", sortable: true, dataType: "string" },
    { text: "Submit Date", predicate: "submit_date", sortable: true, dataType: "string" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  ////console.log('columnTitle : ' + JSON.stringify(vm.columnTitle));
  vm.getTaskList = function (tmpStatus) {
    ////console.log('[getJobList] - START');
    //pass in: {username, status}
    var filter = { username: currentUser.id, status: tmpStatus, as_sales: false };
    DataFactory.getJobList(filter).then(
      //success
      function (response) {
        //console.log('[getJobList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getJobList] - response.status : ' + JSON.stringify(response.status));
        vm.tasks = response.data;
        vm.totalItems = vm.tasks.length;

        for (i = 0; i < vm.tasks.length; i++) {
          if (_.isUndefined(vm.tasks[i].due_date) || _.isNull(vm.tasks[i].due_date) || vm.tasks[i].due_date == '') {
            vm.tasks[i].due_date = ''
          } else {
            vm.tasks[i].due_date = new Date(vm.tasks[i].due_date);
          }

          if (_.isUndefined(vm.tasks[i].submitted_date) || _.isNull(vm.tasks[i].submitted_date)) {
          } else {
            vm.tasks[i].submitted_date = new Date(vm.tasks[i].submitted_date);
          }


          if (_.isUndefined(vm.tasks[i].pub_date) || _.isNull(vm.tasks[i].pub_date) || vm.tasks[i].pub_date == '') {
            vm.tasks[i].pub_date = ''
          } else {
            var pub_date = vm.tasks[i].pub_date;
            //if (pub_date.indexOf(", ") > 0) {
            var str = [];
            var res = pub_date.split(",");
            for (z = 0; z < res.length; z++) {
              if (_.isUndefined(res[z]) || _.isNull(res[z]) || res[z] == '') {
              } else {
                var tmpDt = new Date(res[z].trim());
                if (_.isDate(tmpDt)) str.push(tmpDt);
                //str.push(pub_date[z]);
              }
            }
            vm.tasks[i].pub_date = str;
          }

          if (_.isUndefined(vm.tasks[i].designer) || _.isNull(vm.tasks[i].designer)) {
          } else {
            vm.tasks[i].designer = vm.tasks[i].designer.split(",");
          }

          if (_.isUndefined(vm.tasks[i].writer) || _.isNull(vm.tasks[i].writer)) {
          } else {
            vm.tasks[i].writer = vm.tasks[i].writer.split(",");
          }
        }


      },
      // error handler
      function (response) {
        vm.qResultError = true;
        ////console.log('[getJobList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getJobList] - END');
  };

  vm.go = function (job) {
    ////console.log('job.Title - [GO] : ' + job.title)
  };

  vm.getStatList = function (tmpStatus) {
    ////console.log('[getStatList] - START');
    //pass in: {username, status}
    //var filter = { username: currentUser.id, status: tmpStatus };
    var filter = { username: currentUser.id, as_sales: false };
    DataFactory.getStats(filter).then(
      //success
      function (response) {
        ////console.log('[getStatList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getStatList] - response.status : ' + JSON.stringify(response.status));
        vm.stats = response.data;
      },
      // error handler
      function (response) {
        ////console.log('[getStatList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getStatList] - END');
  };

  vm.openTask = function (jobTmp, taskTmp) {
    $state.go(taskTmp.creative_form, {
      orderID: taskTmp.task_no,
      orderTitle: taskTmp.title,
      action: 'read',
      taskID: taskTmp.id,
    });
  };

  vm.getTaskList('In Progress');
  vm.getStatList('In Progress');
  ////console.log('copywriterDashCTRL : END');
});

app.controller('coordinatorDashCTRL', function ($state, $stateParams, $uibModal, toastr, DataFactory, currentUser) {
  ////console.log('coordinatorDashCTRL : START');

  var vm = this;
  vm.tasks = [];
  vm.qResultError = false;
  vm.orderByField = 'task_no';
  vm.reverseSort = false;
  vm.stats = null;
  vm.jobs = [];
  vm.pageSize = 30;
  vm.currentPage = 1;
  vm.totalItems = 0;

  vm.animationsEnabled = true;
  vm.toggleAnimation = function () {
    vm.animationsEnabled = !vm.animationsEnabled;
  };

  if (currentUser) {
    if (_.isNull(currentUser)) {
      $state.go('login');
    } else {
      vm.currentUser = currentUser;
      vm.currentUser.canEdit = '';
      vm.currentUser.userAction = '';
    }
  } else {
    $state.go('login');
  }

  vm.columnTitle = [
    { text: " ", predicate: " ", sortable: true, dataType: "string" },
    { text: "Job Number", predicate: "job_no", sortable: true, dataType: "string" },
    { text: "Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Booking Type", predicate: "booking_type", sortable: true, dataType: "string" },
    { text: "Ad Spend", predicate: "ad_spend", sortable: true, dataType: "number" },
    { text: "Production Cost", predicate: "production_cost", sortable: true, dataType: "number" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];


  vm.subColumnTitle = [
    { text: "#", predicate: " ", sortable: false, dataType: "number" },
    { text: "Client / Title", predicate: "title", sortable: true, dataType: "string" },
    { text: "Job Classification", predicate: "artwork_type", sortable: true, dataType: "string" },
    { text: "Due Date", predicate: "due_date", sortable: true, dataType: "string" },
    { text: "Pub Date", predicate: "pub_date", sortable: true, dataType: "string" },
    { text: "Ad Size (cm x col)", predicate: "pub_size", sortable: true, dataType: "string" },
    { text: "Designer", predicate: "designer", sortable: true, dataType: "string" },
    { text: "Copywriter", predicate: "writer", sortable: true, dataType: "string" },
    { text: "Sales", predicate: "sales", sortable: true, dataType: "string" },
    { text: "Submit Date", predicate: "submit_date", sortable: true, dataType: "string" },
    { text: "Status", predicate: "status", sortable: true, dataType: "string" },
    { text: "Action", predicate: "", sortable: false, dataType: "string" }
  ];



  ////console.log('columnTitle : ' + JSON.stringify(vm.columnTitle));
  vm.getTaskList = function (tmpStatus) {
    ////console.log('[getJobList] - START');
    //pass in: {username, status}
    var filter = { username: currentUser.id, status: tmpStatus, as_sales: false };
    DataFactory.getJobList(filter).then(
      //success
      function (response) {
        //console.log('[getJobList] - response.data : ' + JSON.stringify(response.data));
        ////console.log('[getJobList] - response.status : ' + JSON.stringify(response.status));
        vm.tasks = response.data;
        vm.totalItems = vm.tasks.length;
        for (i = 0; i < vm.tasks.length; i++) {
          if (_.isUndefined(vm.tasks[i].due_date) || _.isNull(vm.tasks[i].due_date) || vm.tasks[i].due_date == '') {
            vm.tasks[i].due_date = ''
          } else {
            vm.tasks[i].due_date = new Date(vm.tasks[i].due_date);
          }

          if (_.isUndefined(vm.tasks[i].submitted_date) || _.isNull(vm.tasks[i].submitted_date)) {
          } else {
            vm.tasks[i].submitted_date = new Date(vm.tasks[i].submitted_date);
          }


          if (_.isUndefined(vm.tasks[i].pub_date) || _.isNull(vm.tasks[i].pub_date) || vm.tasks[i].pub_date == '') {
            vm.tasks[i].pub_date = ''
          } else {
            var pub_date = vm.tasks[i].pub_date;
            //if (pub_date.indexOf(", ") > 0) {
            var str = [];
            var res = pub_date.split(",");
            for (z = 0; z < res.length; z++) {
              if (_.isUndefined(res[z]) || _.isNull(res[z]) || res[z] == '') {
              } else {
                var tmpDt = new Date(res[z].trim());
                if (_.isDate(tmpDt)) str.push(tmpDt);
                //str.push(pub_date[z]);
              }
            }
            vm.tasks[i].pub_date = str;
          }

          if (_.isUndefined(vm.tasks[i].designer) || _.isNull(vm.tasks[i].designer)) {
          } else {
            vm.tasks[i].designer = vm.tasks[i].designer.split(",");
          }

          if (_.isUndefined(vm.tasks[i].writer) || _.isNull(vm.tasks[i].writer)) {
          } else {
            vm.tasks[i].writer = vm.tasks[i].writer.split(",");
          }
        }

        /*
        for (i = 0; i < vm.jobs.length; i++) {
          vm.jobs[i].tasks = JSON.parse(vm.jobs[i].tasks);
        }
        */
      },
      // error handler
      function (response) {
        vm.qResultError = true;
        ////console.log('[getJobList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getJobList] - END');
  };



  vm.getStatList = function (tmpStatus) {
    ////console.log('[getStatList] - START');
    //pass in: {username, status}
    //var filter = { username: currentUser.id, status: tmpStatus };
    var filter = { username: currentUser.id, as_sales: false };
    DataFactory.getStats(filter).then(
      //success
      function (response) {
        //console.log('[getStatList] - response.data : ' + JSON.stringify(response.data));
        //console.log('[getStatList] - response.status : ' + JSON.stringify(response.status));
        vm.stats = response.data;
      },
      // error handler
      function (response) {
        ////console.log('[getStatList] Ooops, something went wrong..  \n ' + JSON.stringify(response));
      }
    );
    ////console.log('[getStatList] - END');
  };

  vm.go = function (job) {
    ////console.log('job.Title - [GO] : ' + job.title)
  };


  vm.openTask = function (taskTmp) {
    //console.log('[openTask] - taskTmp : ' + JSON.stringify(taskTmp));
    $state.go(taskTmp.creative_form, {
      orderID: taskTmp.task_no,
      orderTitle: taskTmp.title,
      action: 'read',
      taskID: taskTmp.id,
    });
    /*
    $state.go(taskTmp.creative_form, {
      orderID: taskTmp.task_no,
      orderTitle: taskTmp.title,
      action: 'read',
      taskID: taskTmp.id,
    });
    */
  };

  vm.getTaskList('Pending Assignment');
  vm.getStatList('Pending Assignment');

  ////console.log('coordinatorDashCTRL : END');
});