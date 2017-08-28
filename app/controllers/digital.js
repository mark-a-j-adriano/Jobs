app.controller('digitalCTRL', function ($state, $auth, $uibModal, $stateParams, $timeout, toastr, focus, Upload, DataFactory, StorageFactory, currentUser) {
    //console.log('START - digitalCTRL');

    var vm = this;
    vm.isValid = true;
    vm.errorMsg = [];
    vm.productList = [];
    vm.pubOptionsList = [];
    vm.pubSizes = [];
    vm.artwork_Types = [];
    vm.creativeTypes = [];
    vm.task = {};
    vm.animationsEnabled = true;
    vm.statusNum = 0;
    vm.developerLog = false;
    vm.qProductsError = false;
    vm.filesForDeletion = [];
    vm.readOnly = true;
    vm.docHistory = [];
    vm.docMessages = [];
    vm.ACL = {
        //TRUE MEANS YOU ARE RESTRICTED
        section0: true,     //Permanent Read ONLY fields
        section1: true,     //Reques Information
        section2: true,     //Requestor Information
        section3: true,     //Specification //Materials //Instructions //Objective
        section4: true,     //Assignment Details
        section5: true,     //Preview of Completed Artwork  - team_members     
    };

    vm.spinners = {
        materials: { visible: false, progress: 0 },
        artwork: { visible: false, progress: 0 },
        article: { visible: false, progress: 0 },
        creative: { visible: false, progress: 0 },
    }

    if (_.isUndefined(currentUser) || _.isNull(currentUser)) {
        var poi = StorageFactory.getSessionData(false);
        if (_.isUndefined(poi) || _.isNull(poi)) {
            //console.log('window.location.href : ' + JSON.stringify(window.location));
            StorageFactory.setURI(window.location.href);
            $state.go('login');
        } else {
            //console.log('currentUser[0] : ' + JSON.stringify(currentUser));
            currentUser = poi;
            vm.currentUser = poi;
            vm.currentUser.canEdit = '';
            vm.currentUser.userAction = $stateParams.action;
        }
    } else {
        //console.log('currentUser[1] : ' + JSON.stringify(currentUser));
        vm.currentUser = currentUser;
        vm.currentUser.canEdit = '';
        vm.currentUser.userAction = $stateParams.action;
    }

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

    vm.gotoDash = function () {
        ////console.log('[gotoDash] - currentUser.role : ' + currentUser.role);
        var accessLVL = parseInt(currentUser.role);
        ////console.log('[gotoDash] - accessLVL : ' + accessLVL);        
        if (accessLVL >= 30) {
            //Sales Team Lead /SALES
            $state.go('sales');
        } else if (accessLVL >= 20) {
            //CopyWriter   
            $state.go('copywriter');
        } else if (accessLVL >= 10) {
            //team_members1  /team_members2 /Backup    
            $state.go('designer');
        } else {
            // Coordinator / System Administrator
            $state.go('coordinator');
        }
    }

    vm.accessControl = function () {
        var tmpFlag = '';
        var tmpStatus = vm.task.status;
        tmpStatus = tmpStatus.toLowerCase();
        var accessLVL = parseInt(currentUser.role);

        if (tmpStatus == "new" || tmpStatus == "request re-submission") {
            vm.statusNum = 0;
        } else if (tmpStatus == "pending assignment" || tmpStatus == "cancellation request") {
            vm.statusNum = 1;
        } else if (tmpStatus == "in progress" || tmpStatus == "for revision") {
            vm.statusNum = 2;
        } else if (tmpStatus == "for approval") {
            vm.statusNum = 3;
        } else if (tmpStatus == "approve" || tmpStatus == "pending import") {
            vm.statusNum = 4;
        } else if (tmpStatus == "import completed") {
            vm.statusNum = 5;
        } else if (tmpStatus == "completed") {
            vm.statusNum = 6;
        } else if (tmpStatus == "cancelled") {
            vm.statusNum = 7;
        } else {
            vm.statusNum = 0;
        }

        var current_user = currentUser.id.toLowerCase().trim();
        var submitted_by = vm.task.submitted_by_username.toLowerCase().trim();
        var cc_response = vm.task.cc_response_username.toLowerCase().trim();
        var designer = '';
        if (_.isUndefined(vm.task.creative_team_username) || _.isNull(vm.task.creative_team_username)) {
        } else {
            designer = vm.task.creative_team_username.toLowerCase().trim();
        }

        //console.log('accessLVL:' + accessLVL + ' | statusNum:' + vm.statusNum);
        //console.log('current_user:' + current_user + ' | designer:' + designer);

        if (accessLVL >= 30) {
            //Sales Team Lead /SALES
            if ((current_user == submitted_by) || (current_user == cc_response)) {
                if ((vm.statusNum == 0) || (vm.statusNum == 3)) {
                    tmpFlag = 'sales';
                } else {
                    tmpFlag = 'reader';
                }
            }
        } else if (accessLVL >= 20) {
            //CopyWriter                   
            if ((current_user == submitted_by) || (current_user == cc_response)) {
                if (vm.statusNum == 0) {
                    tmpFlag = 'sales';
                } else {
                    tmpFlag = 'reader';
                }
            }
        } else if (accessLVL >= 10) {
            //team_members1  /team_members2 /Backup  /designer  
            if (designer.includes(current_user)) {
                if ((vm.statusNum == 2) || (vm.statusNum == 4) || (vm.statusNum == 5) || (vm.statusNum == 6)) {
                    tmpFlag = 'designer';
                } else {
                    tmpFlag = 'reader';
                }
            } else {
                //console.log('current_user not listed as a designer')
            }
        } else {
            if (vm.statusNum > 5) {
                tmpFlag = 'reader';
            } else {
                tmpFlag = 'coordinator';
            }

        }
        return tmpFlag;
    };

    vm.sectionControl = function () {
        if (vm.currentUser.canEdit == 'sales') {
            //SALES
            if (vm.statusNum == 0) {
                vm.ACL.section1 = false;
                vm.ACL.section3 = false;
                vm.ACL.section4 = false;
            }
        } else if (vm.currentUser.canEdit == 'writer') {
            //CopyWriter           
        } else if (vm.currentUser.canEdit == 'designer') {
            //team_members
            vm.ACL.section5 = false;
            //vm.ACL.section9 = false;
        } else if (vm.currentUser.canEdit == 'coordinator') {
            //System Administrator & Coordinator
            vm.ACL.section1 = false;
            vm.ACL.section3 = false;
            vm.ACL.section4 = false;
            vm.ACL.section5 = false;
        } else {
            //default
            vm.ACL.section0 = true;
            vm.ACL.section1 = true;
            vm.ACL.section2 = true;
            vm.ACL.section3 = true;
            vm.ACL.section4 = true;
            vm.ACL.section5 = true;
            vm.ACL.section6 = true;
            vm.ACL.section7 = true;
            vm.ACL.section8 = true;
            vm.ACL.section9 = true;
        }
    };

    vm.editTask = function () {
        vm.readOnly = !vm.readOnly;
        vm.currentUser.userAction = 'edit';
        vm.sectionControl();
    };

    vm.getDocHistory = function (taskNum) {
        ////console.log('[getDocHistory] - jobNum : ' + jobNum);
        DataFactory.getDocHistory({ job_no: taskNum }).then(
            //success
            function (response) {
                vm.docHistory = response.data;
                //console.log('[getDocHistory] - response.data : ' + JSON.stringify(response.data));
                ////console.log('[getDocHistory] - response.status : ' + JSON.stringify(response.status));
                // error handler
            },
            function (response) {
                //console.log('[getDocHistory] Ooops, something went wrong..  \n ' + '\n param sent { job_no: ' + taskNum + ' } \n\n' + JSON.stringify(response));
            }
        );
    };

    vm.getChatHistory = function (taskNum) {
        ////console.log('[getDocHistory] - jobNum : ' + jobNum);
        DataFactory.getChatHistory({ task_no: taskNum }).then(
            //success
            function (response) {
                vm.docMessages = response.data;
                //console.log('[getChatHistory] - response.data : ' + JSON.stringify(response.data));
                ////console.log('[getChatHistory] - response.status : ' + JSON.stringify(response.status));
                // error handler
            },
            function (response) {
                //console.log('[getChatHistory] Ooops, something went wrong..  \n ' + '\n param sent { job_no: ' + taskNum + ' } \n\n' + JSON.stringify(response));
            }
        )
    };

    vm.toggleAnimation = function () {
        vm.animationsEnabled = !vm.animationsEnabled;
    };

    vm.focusText = function (index) {
        if (vm.creativeTypes[index].isSelected) {
            focus('details_' + index);
        }
    }

    vm.formatMe = function (def) {
        ////console.log('def : ' + def);
        if (def == 'ad_spend') {
            ////console.log('ad_spend : ' + vm.task.ad_spend);
            vm.task.ad_spend = $filter('currency')(vm.task.ad_spend);
        } else if (def == 'ad_spend') {
            ////console.log('production_cost : ' + vm.task.production_cost);
            vm.task.production_cost = $filter('currency')(vm.task.production_cost);
        } else if (def == 'colour') {
            //////console.log('colour : ' + vm.task.colour);
            if (vm.task.colour == 'Spot Colour') focus('colour_option');
        } else if (def == 'feature') {
            if (vm.task.feature) {
                focus('feature_option');
            } else {
                vm.task.feature_option = "";
            }
        } else if (def == 'urgent') {
            if (vm.task.urgent) {
                focus('urgent_reason');
            } else {
                vm.task.urgent_reason = "";
            }
        }

    };

    // date and time picker
    vm.MaskConfig = DataFactory.getFilters();

    // PUB date picker
    this.dateTimePicker1 = {
        date: new Date(),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                var todaysDate = new Date();
                var tempDate = new Date(data.date);
                ////console.log('todaysDate : ' + todaysDate.toDateString() + ' | tempDate : ' + tempDate.toDateString());
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) {
                            flag = true;
                        }
                    }
                }

                return flag;
            }
        }
    };

    // ET date picker
    this.dateTimePicker2 = {
        date: new Date(),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                var todaysDate = new Date();
                var tempDate = new Date(data.date);
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) {
                            //flag = true;
                        }
                    }
                }

                return flag;
            }
        }
    };

    vm.openCalendar = function (e, picker) {
        vm[picker].open = true;
    };

    vm.getTmpID = function () {
        DataFactory.getChildRequestorInf($stateParams.orderID).then(
            //success
            function (response) {
                //console.log('[getTmpID] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getTmpID] - response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.task.creative_form = 'digital';
                vm.task.status = 'new';
                vm.task.title = $stateParams.orderTitle;
                vm.task.ad_spend = 0;
                vm.task.production_cost = 0;
                vm.task.parent_id = $stateParams.orderID;
                vm.task.logged_in_user = currentUser.id;

                var res = $stateParams.taskID.split('~');
                vm.task.job_no = res[0];
                //console.log('res : ' + JSON.stringify(res[0]));
                vm.task.task_no = res.join("-");

                vm.task.size_option = "Other";
                vm.task.due_date = '';
                vm.task.launch_date = '';
                vm.task.type = null;
                vm.task.pub_size = null;
                vm.task.materials = [];

                var tmpData = {
                    team_name: 'DigitalLAB',
                    division: 'Creative',
                    role: '5',
                    primary: '1',
                };

                DataFactory.getMember(tmpData).then(
                    //success
                    function (response) {
                        ////console.log('[getTmpID - getMember] - response.data : ' + JSON.stringify(response.data));
                        ////console.log('[getTmpID - getMember] - response.status : ' + JSON.stringify(response.status));
                        vm.task.project_mgr = response.data[0].name;
                        vm.task.project_mgr_username = response.data[0].username;

                        //console.log('[getTmpID - project_mgr] : ' + vm.task.project_mgr);
                        //console.log('[getTmpID - project_mgr_username] : ' + vm.task.project_mgr_username);
                    },
                    // error handler
                    function (response) {
                        //console.log('[getTmpID - getMember] Ooops, something went wrong..  \n ' + JSON.stringify(response));
                    }
                );

                vm.sectionControl();
            },
            // error handler
            function (response) {
                //console.log('[getTmpID] Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });


    };

    vm.getCreativeTypes = function () {
        DataFactory.getCreativeTypes().then(
            //success
            function (response) {
                //console.log('response.data : ' + JSON.stringify(response.data));
                ////console.log('response.status : ' + JSON.stringify(response.status));
                var names = response.data;
                for (i = 0; i < names.length; i++) {
                    var option = {
                        title: names[i].name,
                        isSelected: false,
                        text: "",
                    };
                    vm.creativeTypes.push(option);
                }
            },
            // error handler
            function (response) {
                ////console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });
    };

    vm.getTask = function () {
        DataFactory.getTask($stateParams.taskID, 'digital').then(
            //success
            function (response) {
                //console.log('[getTask] - response.data : ' + JSON.stringify(response.data));
                ////console.log('response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.currentUser.canEdit = vm.accessControl();

                //console.log('[getTask] - currentUser.canEdit : ' + JSON.stringify(vm.currentUser.canEdit));
                if (vm.currentUser.canEdit === "") {
                    //console.log('[getTask] - gotoDash');
                    vm.gotoDash();
                } else {
                    //console.log('[getTask] - prepare Data');
                    vm.task.ad_spend = parseFloat(vm.task.ad_spend);
                    vm.task.production_cost = parseFloat(vm.task.production_cost);
                    vm.task.due_date = new Date(vm.task.due_date);
                    vm.task.launch_date = new Date(vm.task.launch_date);
                    vm.creativeTypes = JSON.parse(vm.task.creative_types);

                    if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials) || _.isEmpty(vm.task.materials)) {
                    } else {
                        vm.task.materials = vm.cleanArray(JSON.parse(vm.task.materials));
                    }

                    if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork) || _.isEmpty(vm.task.materials)) {
                    } else {
                        vm.task.artwork = vm.cleanArray(JSON.parse(vm.task.artwork));
                    }

                    vm.getDocHistory(vm.task.task_no);
                    vm.getChatHistory(vm.task.task_no);

                    if (vm.currentUser.canEdit == 'reader') {
                    } else {
                        vm.editTask();
                    }
                    //console.log('[getTask] - final.data : ' + JSON.stringify(vm.task));
                }

            },
            // error handler
            function (response) {
                //console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
            }
        );
    };

    vm.clearErrors = function () {
        ////console.log('set focus on : ' + vm.errorMsg[0].id);
        vm.isValid = true;
        focus(vm.errorMsg[0].id);
        vm.errorMsg = [];
    };

    vm.saveDraftTask = function () {
        vm.task.status = "Draft";
        vm.task.productList = JSON.stringify(vm.productList);
        if (vm.task.role) delete vm.task.role;
        if (vm.task.type) delete vm.task.type;
        if (vm.task.job_no) delete vm.task.job_no;
        if (vm.task.default_due_date) delete vm.task.default_due_date;
        if (vm.task.due_date) vm.task.due_date = moment(vm.task.due_date).format('YYYY-MM-DD HH:mm:ss');

        var passedID = null;
        if ($stateParams.action != "create") {
            passedID = vm.task.id;
            vm.task.logged_in_user = currentUser.id;
            vm.task._method = "put";
        }
        //console.log('submitted vm.task : ' + JSON.stringify(vm.task));

        DataFactory.uploadTask(vm.task, 'digital', passedID).then(
            //success
            function (response) {
                var modalInstance = $uibModal.open({
                    animation: vm.animationsEnabled,
                    templateUrl: 'partials/common/msgbox.html',
                    controller: 'msgBoxModalCtrl as ctrl',
                    resolve: {
                        parentData: function () {
                            var tmp = {
                                frm_class: 'box-digital',
                                frm_title: 'Success',
                                isConfirm: false,
                                msg: "Successfully saved DigitalLAB task and you will be redirected to dashboard.",
                            };
                            return tmp;
                        },
                        msgList: function () {
                            return null;
                        }
                    }
                }).result.then(
                    //success
                    function (submitVar) {
                        //console.log("submitted value inside parent controller", submitVar);
                        if (submitVar) vm.gotoDash();
                    },
                    //failure
                    function (submitVar) {
                        vm.gotoDash();
                    },
                )
            },
            // error handler
            function (response) {
                //console.log('[getTmpID] Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });


    };

    vm.isAssigned = function () {
        var str = vm.task.creative_team_username;
        if (_.isUndefined(str) | _.isNull(str) || _.isEmpty(str) || str.trim() == '') {
            toastr.error("Please assign creative team members.", {
                closeButton: true,
                onHidden: function () {
                    ////console.log('Calling toastr onHidden function');
                    vm.clearErrors();
                }
            });
        } else {
            vm.submitTask('In Progress');
        }
    }

    vm.submitTask = function (newStatus) {
        //console.log('[submitTask] - newStatus : ' + newStatus);
        //vm.isValid = true;
        vm.task.write_log = true;
        var bkup = angular.copy(vm.task);
        vm.isValid = vm.Validate();
        var prevStats = vm.task.status;
        if (vm.isValid) {
            if (_.isUndefined(newStatus) || _.isNull(newStatus) || newStatus == '') {
                //console.log('[submitTask] - 1');
                if (vm.task.creative_team) {
                    if (_.isNull(vm.task.creative_team) || vm.task.creative_team == '') {
                        vm.task.status = "Pending Assignment"
                    } else {
                        vm.task.status = "In Progress"
                    }
                } else {
                    vm.task.status = "Pending Assignment"
                }
            } else if (newStatus == 'Conversation reply') {
                //console.log('[submitTask] - 2');
                vm.task.write_log = false;
            } else if (newStatus == 'Previous Status') {
                //console.log('[submitTask] - 3');
                var oldStatus = '';
                //console.log('vm.docMessages.length : ' + vm.docMessages.length);
                if (vm.docMessages.length > 0) {
                    for (var i = vm.docMessages.length; i >= 0; i--) {
                        if (vm.docMessages[i - 1].prev_status != 'Request Re-Submission') {
                            oldStatus = vm.docMessages[i - 1].prev_status;
                            break;
                        }
                    }
                } else {
                    oldStatus = newStatus;
                }

                vm.task.status = oldStatus;
            } else {
                vm.task.status = newStatus
            }

            if (vm.task.status == prevStats) {
                vm.task.log_msg = "Document was saved";
            } else {
                vm.task.prev_status = prevStats;
                vm.task.log_msg = "Document was saved from " + prevStats.toUpperCase() + " to " + vm.task.status.toUpperCase();
            }

            if (!_.isUndefined(vm.task.role)) delete vm.task.role;
            if (!_.isUndefined(vm.task.type)) delete vm.task.type;
            if (!_.isUndefined(vm.task.job_no)) delete vm.task.job_no;
            if (!_.isUndefined(vm.task.default_due_date)) delete vm.task.default_due_date;

            vm.task.due_date = moment(vm.task.due_date).format('YYYY-MM-DD HH:mm:ss');
            vm.task.launch_date = moment(vm.task.launch_date).format('YYYY-MM-DD HH:mm:ss');

            var passedID = null;
            if ($stateParams.action != "create") {
                passedID = vm.task.id;
                vm.task.logged_in_user = currentUser.id;
                vm.task._method = "put";
            }

            if (_.isUndefined(vm.creativeTypes) || _.isNull(vm.creativeTypes) || _.isEmpty(vm.creativeTypes)) {
                vm.task.creative_types = [];
            } else {
                vm.task.creative_types = vm.cleanArray(vm.creativeTypes);
            }

            if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials) || _.isEmpty(vm.task.materials)) {
                vm.task.materials = [];
            } else {
                vm.task.materials = vm.cleanArray(vm.task.materials);
            }

            if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork) || _.isEmpty(vm.task.artwork)) {
                vm.task.artwork = [];
            } else {
                vm.task.artwork = vm.cleanArray(vm.task.artwork);
            }

            var tmpTsk = angular.copy(vm.task);
            tmpTsk.creative_types = JSON.stringify(tmpTsk.creative_types);
            tmpTsk.materials = JSON.stringify(tmpTsk.materials);
            tmpTsk.artwork = JSON.stringify(tmpTsk.artwork);
            //console.log('submitted vm.task : ' + JSON.stringify(tmpTsk));

            DataFactory.uploadTask(tmpTsk, 'digital', passedID).then(
                //success
                function (response) {
                    //console.log('[submitTask] - response : ' + JSON.stringify(response));

                    if (vm.filesForDeletion.length > -1) {
                        angular.forEach(vm.filesForDeletion, function (file) {
                            vm.clearFiles(file);
                        })
                    }

                    var modalInstance = $uibModal.open({
                        animation: vm.animationsEnabled,
                        templateUrl: 'partials/common/msgbox.html',
                        controller: 'msgBoxModalCtrl as ctrl',
                        resolve: {
                            parentData: function () {
                                var tmp = {
                                    frm_class: 'box-digital',
                                    frm_title: 'Success',
                                    isConfirm: false,
                                    msg: "Successfully saved DigitalLAB task and you will be redirected to dashboard.",
                                };
                                return tmp;
                            },
                            msgList: function () {
                                return null;
                            }
                        }
                    }).result.then(
                        //success
                        function (submitVar) {
                            //console.log("submitted value inside parent controller", submitVar);
                            if (submitVar) vm.gotoDash();
                        },
                        //failure
                        function (submitVar) {
                            vm.gotoDash();
                        },
                    )
                },
                // error handler
                function (response) {
                    //console.log('[submitTask] Ooops, something went wrong..  \n ' + JSON.stringify(response));
                    vm.task = angular.copy(bkup);
                });

        } else {
            //console.log('isValid : false | vm.errorMsg : ' + JSON.stringify(vm.errorMsg));
            toastr.error(vm.errorMsg[0].msg, {
                closeButton: true,
                onHidden: function () {
                    ////console.log('Calling toastr onHidden function');
                    vm.clearErrors();
                }
            });
        }
    };

    vm.gotoParent = function () {
        //$state.go('creative', { orderID: $stateParams.orderID });
        var tmpID = null;
        if (_.isUndefined(vm.task.parent_id) || _.isNull(vm.task.parent_id)) { } else { tmpID = vm.task.parent_id };
        if (_.isNull(tmpID)) {
            if (_.isUndefined(vm.task.job_id) || _.isNull(vm.task.job_id)) { } else { tmpID = vm.task.job_id };
        }
        if (_.isNull(tmpID)) {
            if (_.isUndefined($stateParams.orderID) || _.isNull($stateParams.orderID)) { } else { tmpID = $stateParams.orderID };
        }

        $state.go('creative', { orderID: tmpID });
    }

    vm.Validate = function () {
        vm.errorMsg = [];
        var tmp = true;
        if (vm.spinners.artwork.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Artwork attachment is uploaded to server.' });
        } else if (vm.spinners.materials.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Material attachment is uploaded to server.' });
        } else {
            // if (vm.task.ad_spend < 1) vm.errorMsg.push({ id: 'ad_spend', msg: 'Ad Spend is required.' });
            // if (vm.task.production_cost < 1) vm.errorMsg.push({ id: 'production_cost', msg: 'Production Cost is required.' });
            if (_.isNull(vm.task.due_date) || vm.task.due_date == '') vm.errorMsg.push({ id: 'due_date', msg: 'Date of Presentation to Client is required.' });
            if (_.isNull(vm.task.launch_date) || vm.task.launch_date == '') vm.errorMsg.push({ id: 'launch_date', msg: 'Online Launch Date is required.' });

            if (vm.creativeTypes) {
                var ctr = 0;
                for (i = 0; i < vm.creativeTypes.length; i++) {
                    if (vm.creativeTypes[i].isSelected) ctr = ctr + 1;
                }
                if (ctr < 1) {
                    if (_.isUndefined(vm.task.other_type) || _.isNull(vm.task.other_type) || vm.task.other_type.trim() == '') vm.errorMsg.push({ id: 'other_type', msg: 'Please specify the Creative Type for this task.' });
                }
            }

            if (vm.task.materials) {
                if (_.isNull(vm.task.materials) || vm.task.materials.length < 1) vm.errorMsg.push({ id: 'materials', msg: 'Materials is required.' });
            } else {
                vm.errorMsg.push({ id: 'materials', msg: 'Materials is required.' });
            }

            if (vm.task.instruction) {
                if (_.isNull(vm.task.instruction) || vm.task.instruction == '') vm.errorMsg.push({ id: 'instruction', msg: 'Instruction is required.' });
            } else {
                vm.errorMsg.push({ id: 'instruction', msg: 'Instruction is required.' });
            }

        }
        if (vm.errorMsg.length > 0) tmp = false;
        return tmp;
    };

    vm.gotoMain = function () {
        ////console.log('[gotoMain] - vm.currentUser.userAction = ' + vm.currentUser.userAction);
        if ((vm.currentUser.userAction == "create") || (vm.currentUser.userAction == "edit")) {
            var modalInstance = $uibModal.open({
                animation: vm.animationsEnabled,
                templateUrl: 'partials/common/msgbox.html',
                controller: 'msgBoxModalCtrl as ctrl',
                resolve: {
                    parentData: function () {
                        var tmp = {
                            frm_class: 'box-digital',
                            frm_title: 'Confirm Exit',
                            isConfirm: true,
                            msg: "Are you sure you want to go Job Request without saving your changes?",
                        };
                        return tmp;
                    },
                    msgList: function () {
                        return null;
                    }
                }
            }).result.then(
                function (submitVar) {
                    //console.log("submitted value inside parent controller", submitVar);
                    if (submitVar) vm.gotoParent();
                },
                function (res) {
                    //console.log("cancel gotoMain", res);
                },
            )
        } else {
            vm.gotoParent();
        }
    };

    vm.selectUser = function (team, div, rol, retFld, order) {
        var tmpData = {
            team_name: team,
            is_Multiple: "0",
            division: div,
            role: rol,
            primary: order,
        };

        if (order == "1") {
            DataFactory.getMember(tmpData).then(
                //success
                function (response) {
                    //console.log('[selectUser - getMember] - response.data : ' + JSON.stringify(response.data));
                    //console.log('[selectUser - getMember] - response.status : ' + JSON.stringify(response.status));
                    vm.task.project_mgr = response.data[0].name;
                    vm.task.project_mgr_username = response.data[0].username;

                    //console.log('[selectUser - project_mgr] : ' + vm.task.project_mgr);
                    //console.log('[selectUser - project_mgr_username] : ' + vm.task.project_mgr_username);
                },
                // error handler
                function (response) {
                    //console.log('[selectUser - getMember] Ooops, something went wrong..  \n ' + JSON.stringify(response));
                }
            );
        } else {
            tmpData.is_Multiple = "1";
            var tmp = {
                frm_class: 'box-digital',
                return_fld: retFld,
                user_data: tmpData,
                default: default_val,
            };

            var default_val = null;
            if (retFld == 'creative_team') {
                tmp.default = vm.task.creative_team_username;
            } else if (retFld == 'campaign_team') {
                tmp.default = vm.task.campaign_team_username;
            } else {
                tmp.default = vm.task.project_mgr_username;
                tmpData.is_Multiple = "0";
            }

            var modalInstance = $uibModal.open({
                animation: vm.animationsEnabled,
                templateUrl: 'partials/common/member.html',
                controller: 'memberModalCtrl as ctrl',
                resolve: {
                    parentData: function () {
                        return tmp;
                    },
                    members: function (DataFactory) {
                        return DataFactory.getMembers(tmpData);
                    }
                }
            }).result.then(function (submitVar) {
                //console.log("submitted value inside parent controller", submitVar);
                if (retFld == 'creative_team') {
                    vm.task.creative_team = submitVar.name;
                    vm.task.creative_team_username = submitVar.username;
                } else if (retFld == 'campaign_team') {
                    vm.task.campaign_team = submitVar.name;
                    vm.task.campaign_team_username = submitVar.username;
                } else if (retFld == 'project_mgr') {
                    vm.task.project_mgr = submitVar.name;
                    vm.task.project_mgr_username = submitVar.username;
                } else {
                    vm.getUser(submitVar.username, retFld);
                }
            })
        }
    };

    vm.getUser = function (user_id, tmpFld) {
        DataFactory.getRequestor(user_id).then(
            //success
            function (response) {
                //console.log('[getUser] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getUser] - response.status : ' + JSON.stringify(response.status));

                if (tmpFld == 'submitted_by') {
                    vm.task.submitted_by = '';
                    vm.task.submitted_by_id = '';
                    vm.task.extension = '';
                    vm.task.mobile_no = '';
                    vm.task.team = '';
                }

                vm.task.cc_response = '';
                vm.task.cc_response_id = '';
                vm.task.cc_extension = '';
                vm.task.cc_mobile_no = '';
            },
            // error handler
            function (response) {
                //console.log('[getUser] Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });
    };

    vm.computeDueDate = function () {
        var d = new Date();
        var n = d.getHours();
        //console.log('initial due : ' + JSON.stringify(d));
        for (i = 0; i < vm.artwork_Types.length; i++) {
            if (vm.artwork_Types[i].artwork_type == vm.task.artwork_type) {
                d.setHours(d.getHours() + vm.artwork_Types[i].due_date);
                break;
            }
        }
        //console.log('computed due : ' + JSON.stringify(d));
        vm.task.due_date = d;
        vm.task.default_due_date = d;
    };

    vm.revertTask = function (chatFlag) {
        var tmp = {
            frm_class: 'box-digital',
            frm_title: 'Request Re-Submission',
            isConfirm: false,
            isChat: true,
            msg: "Please enter your message.",
            user_role: vm.currentUser.canEdit,
        };

        if (_.isUndefined(chatFlag) || _.isNull(chatFlag) || _.isEmpty(chatFlag) || chatFlag == '') {
            chatFlag = "";
            tmp.frm_title = "Conversation";
        } else if (chatFlag == 'cancel') {
            tmp.frm_title = "Cancellation Request";
            tmp.msg = "Please enter your reason for cacelling this task.";
        } else if (chatFlag == 'rejected') {
            tmp.frm_title = "Artwork for Revision";
            tmp.msg = "Please enter your reason for returning artwork.";
        } else {
            if (chatFlag == 'revert') tmp.msg = "Please enter your reason for returning task to sales.";
        }

        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'partials/common/msgbox.html',
            controller: 'msgBoxModalCtrl as ctrl',
            resolve: {
                parentData: function () {
                    return tmp;
                },
                msgList: function () {
                    return vm.docMessages;
                }
            }
        }).result.then(
            //success
            function (submitVar) {
                ////console.log("submitted value inside parent controller : ", submitVar);
                //if (submitVar) $state.go('creative', { orderID: $stateParams.orderID });
                var tmpDate = new Date();

                var chat = {
                    senderID: vm.currentUser.id,
                    sender: vm.currentUser.name,
                    senderRole: vm.currentUser.canEdit,
                    prevStatus: vm.task.status,
                    sentDate: moment(tmpDate).format('YYYY-MM-DD HH:mm:ss'),
                    msg: submitVar,
                };

                vm.task.chatMsg = JSON.stringify(chat);
                //console.log("[revertTask] - " + JSON.stringify(vm.task));

                if (chatFlag == 'revert') {
                    //console.log("[revertTask] - 0");
                    vm.submitTask('Request Re-Submission');
                } else if (chatFlag == 'rejected') {
                    vm.task.sales_comment = submitVar;
                    vm.submitTask('For Revision');
                } else if (chatFlag == 'cancel') {
                    //console.log("[revertTask] - 1");
                    vm.submitTask('Cancellation Request');
                } else {
                    //console.log("[revertTask] - 2");
                    vm.submitTask('Conversation reply');
                }
            },
            //failure
            function (submitVar) {
                // $state.go('creative', { orderID: $stateParams.orderID });
            },
        )
    };

    vm.uploadFiles = function (files, type) {
        var details = {
            'formType': 'task',
            'fileDesc': type,
            'traceNum': vm.task.task_no,
        };
        //console.log('[uploadFiles] - details : ' + JSON.stringify(details));
        var timeStamp = new Date();

        if (type == 'artwork') {
            vm.spinners.artwork.visible = true;
            vm.spinners.artwork.progress = 0;
            if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork)) vm.task.artwork = [];
            if (_.isUndefined(vm.task.final_size) || _.isNull(vm.task.final_size)) vm.task.final_size = vm.task.pub_size;
        } else if (type == 'article') {
            if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article)) vm.task.article = [];
        } else {
            vm.spinners.materials.visible = true;
            vm.spinners.materials.progress = 0;
            if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials)) vm.task.materials = [];
        }

        angular.forEach(files, function (file) {
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

                    if (res.indexOf("ERROR") > 0) {
                    } else {
                        ////console.log('[uploadFiles] - file : ' + JSON.stringify(file));
                        var arr = res.split("/" + vm.task.task_no + "/");
                        var nam = "";
                        if (_.isString(arr[1])) nam = arr[1].trim();

                        if (nam != "") {
                            var fileTmp = {
                                name: arr[1],
                                size: file.size,
                                height: file.$ngfHeight,
                                width: file.$ngfWidth,
                                type: file.type,
                                url: "service/tmp/" + res,
                                uploadBy: vm.currentUser.id,
                                uploadDt: moment(timeStamp).format('YYYY-MM-DD HH:mm:ss'),
                            };
                            //console.log('[uploadFiles] - fileTmp : ' + JSON.stringify(fileTmp));

                            if (type == 'artwork') {
                                vm.task.artwork.push(fileTmp);
                                ////console.log('[uploadFiles] - artwork : ' + JSON.stringify(vm.task.artwork));
                            } else if (type == 'article') {
                                vm.task.article.push(fileTmp);
                                ////console.log('[uploadFiles] - article : ' + JSON.stringify(vm.task.article)); 
                            } else {
                                vm.task.materials.push(fileTmp);
                                ////console.log('[uploadFiles] - materials : ' + JSON.stringify(vm.task.materials));
                            }
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
                if (type == 'artwork') {
                    vm.spinners.artwork.progress = file.progress;
                } else if (type == 'article') {
                    vm.spinners.article.progress = file.progress;
                } else {
                    vm.spinners.materials.progress = file.progress;
                }
            });
        });

        if (type == 'artwork') {
            vm.task.artwork = vm.cleanArray(vm.task.artwork);
            vm.spinners.artwork.visible = false;
            vm.spinners.artwork.progress = 0;
        } else if (type == 'article') {
            vm.task.article = vm.cleanArray(vm.task.article);
            vm.spinners.article.visible = false;
            vm.spinners.article.progress = 0;
        } else {
            vm.task.materials = vm.cleanArray(vm.task.materials);
            vm.spinners.materials.visible = false;
            vm.spinners.materials.progress = 0;
        }
    };

    vm.deleteFile = function (ndex, file, type) {
        //console.log('[deleteFile] - type : ' + type);
        //console.log('[deleteFile] - file : ' + JSON.stringify(file));
        vm.filesForDeletion.push(file);
        if (type == 'article') {
            //vm.task.article
            vm.task.article[ndex] = null;
            vm.task.article = vm.cleanArray(vm.task.article);
        } else if (type == 'artwork') {
            //vm.task.artwork
            vm.task.artwork[ndex] = null;
            vm.task.artwork = vm.cleanArray(vm.task.artwork);
        } else {
            //vm.task.materials
            vm.task.materials[ndex] = null;
            vm.task.materials = vm.cleanArray(vm.task.materials);
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
    };

    vm.approveArtwork = function () {
        var hasTBD = false;
        var previewReady = true;
        for (i = 0; i < vm.productList.length; i++) {
            if ((vm.productList[i].etNum_tbd) || (vm.productList[i].etNum_tbd)) {
                hasTBD = true;
                break;
            }
        }
        /*
        if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork)) {
            if (vm.task.artwork.length > 0) previewReady = true;
        }
        */
        if (hasTBD) {
            toastr.error("Please update the ET Number or CASH number details in the Product table", { closeButton: true });
        } else if (previewReady == false) {
            toastr.error("Please upload an Artwork Preview", { closeButton: true });
        } else if (vm.task.pub_size != vm.task.final_size) {
            var tmpPrice = {
                title: "Update Information",
                initial: vm.task.pub_size,
                final: vm.task.final_size,
                ad_spend: vm.task.ad_spend,
                cost: vm.task.production_cost,
            };

            var modalInstance = $uibModal.open({
                animation: vm.animationsEnabled,
                templateUrl: 'partials/products/digital.html',
                controller: 'digitalModalCtrl as ctrl',
                resolve: {
                    parentData: function () {
                        var tmp = {
                            isList: false,
                            items: tmpPrice,
                            filters: vm.MaskConfig,
                            dueDate: vm.task.due_date,
                        };
                        return tmp;
                    },
                    product: function () {
                        return null;
                    }
                }
            }).result.then(function (submitVar) {
                //console.log("sumbited value inside parent controller", submitVar);
                vm.task.final_ad_spend = submitVar.final_ad_spend;
                vm.task.final_production_cost = submitVar.final_cost;
                vm.submitTask('Pending Import');
            })
        } else {
            vm.task.final_ad_spend = vm.task.ad_spend;
            vm.task.final_production_cost = vm.task.production_cost;
            vm.submitTask('Pending Import');
        }

    };

    vm.revertArtwork = function () {
        //console.log('[DIGITAL] - revertArtwork');
        if (_.isUndefined(vm.task.sales_comment) || _.isNull(vm.task.sales_comment) || vm.task.sales_comment == '') {
            toastr.error("Please add your reason for returning Artwork", { closeButton: true });
        } else {
            vm.submitTask('For Revision');
        }
    };

    vm.closeDigitalTask = function () {
        //  completed
        vm.submitTask('Completed');
    }

    vm.deleteRow = function (ndex) {
        //console.log('[deleteRow] - index : ' + ndex);
        //console.log('[deleteRow] - product list : ' + JSON.stringify(vm.productList));
        //_.findLastIndex(array, {}) 

    }

    if ($stateParams.action == "create") {
        //console.log('[DIGITAL] - create');
        vm.currentUser.canEdit = 'sales';
        vm.readOnly = false;
        vm.getTmpID();
        vm.getCreativeTypes();
        //vm.getPubOptionsList();
        //vm.getArtworkTypes();
    } else {
        //console.log('[DIGITAL] - read');
        vm.readOnly = true;
        //vm.getPubOptionsList();
        //vm.getArtworkTypes();
        vm.getTask();
    };

    ////console.log('$routeParams.orderId : ' + $routeParams.orderId);
    //console.log('END - digitalCTRL');
});

app.controller('digitalModalCtrl', function ($uibModalInstance, focus, toastr, parentData, product) {
    var vm = this;
    vm.pubOptions = parentData.items;
    vm.filter = parentData.filters;
    vm.formTitle = '';
    vm.final_ad_spend = 0;
    vm.final_cost = 0;

    if ((_.isUndefined(product)) || (_.isNull(product))) {
        vm.formTitle = "Add Product";
        vm.product = {
            pubID: '',
            pubName: '',
            pubDate: null,
            etNum: '',
            etNum_tbd: false,
            etDate: null,
            cashNum: '',
            cashDate: null,
            cashNum_tbd: false,
        }
    } else {
        vm.formTitle = "Edit Product";
        vm.product = product;
    }

    if ((_.isUndefined(vm.pubOptions.title)) || (_.isNull(vm.pubOptions.title))) {
    } else {
        vm.formTitle = vm.pubOptions.title;
        vm.final_ad_spend = vm.pubOptions.ad_spend;
        vm.final_cost = vm.pubOptions.cost;
    }

    if ((_.isUndefined(parentData.isList)) || (_.isNull(parentData.isList))) {
        vm.isList = false;
    } else {
        vm.isList = parentData.isList;
        //console.log('items : ' + JSON.stringify(vm.pubOptions) + ' | dueDate : ' + parentData.dueDate + ' | isList : ' + parentData.isList);
        //console.log('filter : ' + JSON.stringify(vm.filter) + ' | ctrl.filter.cash : ' + JSON.stringify(vm.filter.cash));
    }

    // PUB date picker
    this.dateTimePicker1 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                var todaysDate = new Date(parentData.dueDate);
                var tempDate = new Date(data.date);
                ////console.log('todaysDate : ' + todaysDate.toDateString() + ' | tempDate : ' + tempDate.toDateString());
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) {
                            flag = true;
                        }
                    }
                }

                return flag;
            }
        }
    };
    // ET date picker
    this.dateTimePicker2 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                var todaysDate = new Date(parentData.dueDate);
                var tempDate = new Date(data.date);
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) {
                            flag = true;
                        }
                    }
                }

                return flag;
            }
        }
    };

    // CASH date picker
    this.dateTimePicker3 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                var todaysDate = new Date(parentData.dueDate);
                var tempDate = new Date(data.date);
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) {
                            flag = true;
                        }
                    }
                }

                return flag;
            }
        }
    };

    vm.openCalendar = function (e, picker) {
        vm[picker].open = true;
    };

    vm.clrField = function (fld) {
        if (fld == 'etNum') {
            vm.product.etNum = null;
        } else if (fld == 'etNum_tbd') {
            vm.product.etNum_tbd = null;
        } else if (fld == 'cashNum_tbd') {
            vm.product.cashNum_tbd = null;
        } else {
            vm.product.cashNum = null;
        }
    };

    vm.ok = function () {
        if (vm.isList) {
            vm.sendProduct();
        } else {
            vm.sendPrice();
        }
    }

    vm.sendPrice = function () {
        var errMsg = [];
        //Height x Cols
        ad_spend = parseFloat(parentData.items.ad_spend);
        cost = parseFloat(parentData.items.production_cost);
        var res = parentData.items.initial.split("x");
        initial = parseInt(res[0]) * parseInt(res[1]);

        res = parentData.items.final.split("x");
        final = parseInt(res[0]) * parseInt(res[1]);

        if (final > initial) {
            if (vm.final_ad_spend < ad_spend) errMsg.push('Final Ad Spend must be higher than $ ' + ad_spend);
            if (vm.final_cost < cost) errMsg.push('Final Production Cost must be higher than $ ' + cost);
        } else {
            if (vm.final_ad_spend > ad_spend) errMsg.push('Final Ad Spend must be less than $ ' + ad_spend);
            if (vm.final_cost > cost) errMsg.push('Final Production Cost must be less than $ ' + cost);
        }

        if (errMsg.length > 0) {
            toastr.error(errMsg[0], { closeButton: true });
        } else {
            tmp = { final_cost: vm.final_cost, final_ad_spend: vm.final_ad_spend };
            $uibModalInstance.close(tmp);
        }
    }

    vm.sendProduct = function () {
        var errMsg = [];
        if (vm.product.pubID == '') errMsg.push('Publication is required');
        if (_.isNull(vm.product.pubDate)) errMsg.push('Publication date is required');

        var isComplete1 = false;
        if (vm.product.etNum == '' || _.isNull(vm.product.etNum)) {
            isComplete1 = vm.product.etNum_tbd;
        } else {
            if (_.isNull(vm.product.etDate)) {
                errMsg.push('ET Date is required');
            } else {
                //console.log('[etNum]');
                isComplete1 = true;
            }
        }

        var isComplete2 = false;
        if (vm.product.cashNum == '' || _.isNull(vm.product.cashNum)) {
            isComplete2 = vm.product.cashNum_tbd;
        } else {
            if (_.isNull(vm.product.cashDate)) {
                errMsg.push('CASH Date is required');
            } else {
                //console.log('[cashDate]');
                isComplete2 = true;
            }
        }

        if (!(isComplete1 || isComplete2)) errMsg.push('ET number or CASH is required');
        if (errMsg.length > 0) {
            toastr.error(errMsg[0], { closeButton: true });
        } else {
            if (!(_.isNull(vm.product.pubDate))) vm.product.pubDate = moment(vm.product.pubDate).format('YYYY-MM-DD');
            if (!(_.isNull(vm.product.cashDate))) vm.product.cashDate = moment(vm.product.cashDate).format('YYYY-MM-DD');
            if (!(_.isNull(vm.product.etDate))) vm.product.etDate = moment(vm.product.etDate).format('YYYY-MM-DD');
            var tmp = {
                pubID: vm.product.pubID,
                pubName: vm.product.pubName,
                pubDate: vm.product.pubDate,
                etNum: vm.product.etNum,
                etNum_tbd: vm.product.etNum_tbd,
                etDate: vm.product.etDate,
                cashNum: vm.product.cashNum,
                cashDate: vm.product.cashDate,
                cashNum_tbd: vm.product.cashNum_tbd,
            }
            $uibModalInstance.close(tmp);
        }

    };

    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});