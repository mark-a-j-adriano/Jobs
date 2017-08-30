app.controller('oohCTRL', function ($state, $auth, $uibModal, $stateParams, $timeout, toastr, focus, Upload, DataFactory, StorageFactory, currentUser) {
    //console.log('START - oohCTRL');

    var vm = this;
    vm.isValid = true;
    vm.errorMsg = [];
    vm.task = {};
    vm.task.digital_list = [];
    vm.task.static_list = [];
    vm.animationsEnabled = true;
    vm.statusNum = 0;
    vm.developerLog = false;
    vm.cc_response_dsp = [];
    vm.filesForDeletion = [];
    vm.qProductsError = false;
    vm.readOnly = true;
    vm.docHistory = [];
    vm.docMessages = [];

    vm.ACL = {
        //TRUE MEANS YOU ARE RESTRICTED
        section0: true,     //Permanent Read ONLY fields
        section1: true,     //Request Information
        section2: true,     //Requestor Information
        section3: true,     //Specifications  //Materials //Instructions
        section4: true,     //Assignment Details
        section5: true,     //Preview of Completed Write Up - Copywriter
        section6: true,     //Preview of Completed Artwork  - Designer     
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

    // date and time picker
    vm.MaskConfig = DataFactory.getFilters();
    // DUE date picker
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
    // PUB date picker
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

    vm.cleanArray = function (tmpArray) {
        //console.log("[cleanArray] tmpArray - ", tmpArray);
        if (_.isUndefined(tmpArray) || _.isNull(tmpArray)) {
            return null;
        } else {
            if (_.isArray(tmpArray)) {
                var newArray = [];
                for (i = 0, len = tmpArray.length; i < len; i++) {
                    if (_.isUndefined(tmpArray[i]) || _.isNull(tmpArray[i]) || _.isEmpty(tmpArray[i])) {
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

    vm.artwork = {
        preview: false,
        noWrap: false,
        interval: 5000,
        active: 0,
    };
    vm.gotoDash = function () {
        var accessLVL = parseInt(currentUser.role);
        if (accessLVL >= 30) {
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
    };
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
        } else {
            vm.statusNum = 0;
        }

        var current_user = currentUser.id.toLowerCase().trim();
        var submitted_by = vm.task.submitted_by_username.toLowerCase().trim();
        var cc_response = "";
        if (_.isNull(vm.task.cc_response_username)) {
        } else {
            var cc_response = vm.task.cc_response_username.toLowerCase().trim();
        }


        var designer = '';
        if (_.isUndefined(vm.task.designer_username) || _.isNull(vm.task.designer_username)) {
        } else {
            designer = vm.task.designer_username.toLowerCase().trim();
        }

        var eng_writer = '';
        if (_.isUndefined(vm.task.english_writer) || _.isNull(vm.task.english_writer)) {
        } else {
            eng_writer = vm.task.english_writer.toLowerCase().trim();
        }

        var chi_writer = '';
        if (_.isUndefined(vm.task.chinese_writer) || _.isNull(vm.task.chinese_writer)) {
        } else {
            chi_writer = vm.task.chinese_writer.toLowerCase().trim();
        }

        var mal_writer = '';
        if (_.isUndefined(vm.task.malay_writer) || _.isNull(vm.task.malay_writer)) {
        } else {
            mal_writer = vm.task.malay_writer.toLowerCase().trim();
        }
        var writer = eng_writer + ", " + chi_writer + ", " + mal_writer;

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
                if ((vm.statusNum == 0) || (vm.statusNum == 3)) {
                    tmpFlag = 'sales';
                } else {
                    tmpFlag = 'reader';
                }
            } else if (writer.includes(current_user)) {
                if (vm.statusNum == 2) {
                    tmpFlag = 'writer';
                } else {
                    tmpFlag = 'reader';
                }
            }
        } else if (accessLVL >= 10) {
            //Designer1  /Designer2 /Backup    
            if (designer.includes(current_user)) {
                if ((vm.statusNum == 2) || (vm.statusNum == 4) || (vm.statusNum == 5) || (vm.statusNum == 6)) {
                    tmpFlag = 'designer';
                } else {
                    tmpFlag = 'reader';
                }
            }
        } else {
            tmpFlag = 'coordinator';
        }
        return tmpFlag;
    };
    vm.sectionControl = function () {
        if (vm.currentUser.canEdit == 'sales') {
            //SALES
            if (vm.statusNum == 0) {
                vm.ACL.section1 = false;
                vm.ACL.section3 = false;
            }
        } else if (vm.currentUser.canEdit == 'writer') {
            //CopyWriter
            vm.ACL.section5 = false;
        } else if (vm.currentUser.canEdit == 'designer') {
            //Designer
            vm.ACL.section6 = false;
            //vm.ACL.section9 = false;
        } else if (vm.currentUser.canEdit == 'coordinator') {
            //System Administrator & Coordinator
            vm.ACL.section1 = false;
            vm.ACL.section2 = false;
            vm.ACL.section3 = false;
            vm.ACL.section4 = false;
            vm.ACL.section5 = false;
            vm.ACL.section6 = false;
        } else {
            //default
            vm.ACL.section1 = true;
            vm.ACL.section2 = true;
            vm.ACL.section3 = true;
            vm.ACL.section4 = true;
            vm.ACL.section5 = true;
            vm.ACL.section6 = true;
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
                //console.log('[getDocHistory] Ooops, something went wrong..  \n ' +   '\n param sent { job_no: ' + taskNum + ' } \n\n' + JSON.stringify(response));
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
                //console.log('[getChatHistory] Ooops, something went wrong..  \n ' +  '\n param sent { job_no: ' + taskNum + ' } \n\n' + JSON.stringify(response));
            }
        )
    };
    vm.toggleAnimation = function () {
        vm.animationsEnabled = !vm.animationsEnabled;
    };
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
    vm.getTmpID = function () {
        DataFactory.getChildRequestorInf($stateParams.orderID).then(
            //success
            function (response) {
                //console.log('[getTmpID] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getTmpID] - response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.task.creative_form = 'ooh';
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
                vm.task.type = null;
                vm.task.pub_size = null;
                vm.task.materials = [];
                vm.cc_response_dsp = vm.task.cc_response.split(",");
                var tmpData = {
                    team_name: 'OOH',
                    division: 'Creative',
                    role: '5',
                    primary: '1',
                };


                DataFactory.getMember(tmpData).then(
                    //success
                    function (response) {
                        //console.log('[getTmpID - getMember] - response.data : ' + JSON.stringify(response.data));
                        //console.log('[getTmpID - getMember] - response.status : ' + JSON.stringify(response.status));
                        vm.task.team_head = response.data[0].name;
                        vm.task.team_head_username = response.data[0].username;

                        //console.log('[getTmpID - team_head] : ' + vm.task.team_head);
                        //console.log('[getTmpID - team_head_username] : ' + vm.task.team_head_username);
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
    vm.getArtworkTypes = function () {
        var filter = {
            team: 'oohLAB',
            department: 'Creative',
        };
        DataFactory.getArtworkTypes(filter).then(
            //success
            function (response) {
                vm.artwork_Types = response.data;
                //console.log('response.data : ' + JSON.stringify(response.data));
                ////console.log('response.status : ' + JSON.stringify(response.status));
            },
            // error handler
            function (response) {
                ////console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });
    };
    vm.getTask = function () {
        DataFactory.getTask($stateParams.taskID, 'ooh').then(
            //success
            function (response) {
                //console.log('[getTask] - response.data : ' + JSON.stringify(response.data));
                ////console.log('response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.currentUser.canEdit = vm.accessControl();
                vm.task.parent_id = vm.task.job_id;
                if (vm.currentUser.canEdit == '') {
                    vm.gotoDash();
                } else {
                    vm.task.ad_spend = parseFloat(vm.task.ad_spend);
                    vm.task.production_cost = parseFloat(vm.task.production_cost);
                    vm.task.due_date = new Date(vm.task.due_date);
                    vm.task.pub_date = new Date(vm.task.pub_date);
                    if (vm.task.urgent > 0) vm.task.urgent = true;
                    vm.task.size_option = 'Other';
                    vm.cc_response_dsp = vm.task.cc_response.split(",");

                    if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials) || _.isEmpty(vm.task.materials)) {
                        vm.task.materials = [];
                    } else {
                        vm.task.materials = vm.cleanArray(JSON.parse(vm.task.materials));
                    }

                    if (_.isUndefined(vm.task.static_list) || _.isNull(vm.task.static_list) || _.isEmpty(vm.task.static_list)) {
                        vm.task.static_list = [];
                    } else {
                        vm.task.static_list = vm.cleanArray(JSON.parse(vm.task.static_list));
                    }

                    if (_.isUndefined(vm.task.digital_list) || _.isNull(vm.task.digital_list) || _.isEmpty(vm.task.digital_list)) {
                        vm.task.digital_list = [];
                    } else {
                        vm.task.digital_list = vm.cleanArray(JSON.parse(vm.task.digital_list));
                    }


                    if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork) || _.isEmpty(vm.task.artwork) || vm.task.artwork == "" || vm.task.artwork == "[]") {
                        vm.task.artwork = [];
                    } else {
                        vm.task.artwork = vm.cleanArray(JSON.parse(vm.task.artwork));
                    }

                    if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article) || _.isEmpty(vm.task.article) || vm.task.article == "" || vm.task.article == "[]") {
                        vm.task.article = [];
                    } else {
                        vm.task.article = vm.cleanArray(JSON.parse(vm.task.article));
                    }

                    vm.defineType(false);
                    vm.getDocHistory(vm.task.task_no);
                    vm.getChatHistory(vm.task.task_no);

                    if (vm.currentUser.canEdit == 'reader') {
                    } else {
                        vm.editTask();
                    }
                }
                //console.log('[getTask] - final.data : ' + JSON.stringify(vm.task));
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

        DataFactory.uploadTask(vm.task, 'ooh', passedID).then(
            //success
            function (response) {
                var modalInstance = $uibModal.open({
                    animation: vm.animationsEnabled,
                    templateUrl: 'partials/common/msgbox.html',
                    controller: 'msgBoxModalCtrl as ctrl',
                    resolve: {
                        parentData: function () {
                            var tmp = {
                                frm_class: 'box-ooh',
                                frm_title: 'Success',
                                isConfirm: false,
                                msg: "Successfully saved oohLAB task and you will be redirected to dashboard.",
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
        //console.log('[isAssigned] - start');
        if (_.isUndefined(vm.task.designer) || _.isNull(vm.task.designer) || vm.task.designer == '') {
            toastr.error('You must select a designer.', {
                closeButton: true,
                onHidden: function () {
                    ////console.log('Calling toastr onHidden function');
                    vm.clearErrors();
                }
            });
        } else {
            vm.submitTask('In Progress');
        }
        //console.log('[isAssigned] - end');
    };

    vm.submitTask = function (newStatus) {
        //console.log('[submitTask] - newStatus : ' + newStatus);
        //vm.isValid = true;
        vm.isValid = vm.Validate();
        vm.task.write_log = true;
        var bkup = angular.copy(vm.task);
        var prevStats = vm.task.status;

        if (vm.isValid) {
            if (_.isUndefined(newStatus) || _.isNull(newStatus) || newStatus == '') {
                //console.log('[submitTask] - 1');
                if (vm.task.designer) {
                    if (_.isNull(vm.task.designer) || vm.task.designer == '') {
                        vm.task.status = "Pending Assignment";
                        vm.task.sales_comment = '';
                    } else {
                        vm.task.status = "In Progress";
                        vm.task.sales_comment = '';
                    }
                } else {
                    vm.task.status = "Pending Assignment"
                }
            } else if (newStatus == 'Conversation reply') {
                //console.log('[submitTask] - 2');
                vm.task.write_log = false;
            } else if (newStatus == 'Previous Status') {
                //console.log('[submitTask] - 3');
                vm.task.status = vm.task.prev_status;
            } else {
                vm.task.status = newStatus;
            }

            if (vm.task.status == prevStats) {
                vm.task.log_msg = "Document was saved";
            } else {
                vm.task.prev_status = prevStats;
                vm.task.log_msg = "Document was saved from " + prevStats.toUpperCase() + " to " + vm.task.status.toUpperCase();
            }

            delete vm.task.role;
            delete vm.task.type;
            delete vm.task.job_no;
            delete vm.task.default_due_date;
            vm.task.due_date = moment(vm.task.due_date).format('YYYY-MM-DD HH:mm:ss');
            vm.task.pub_date = moment(vm.task.pub_date).format('YYYY-MM-DD HH:mm:ss');

            var passedID = null;
            if ($stateParams.action != "create") {
                passedID = vm.task.id;
                vm.task.logged_in_user = currentUser.id;
                vm.task._method = "put";
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

            if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article) || _.isEmpty(vm.task.article)) {
                vm.task.article = [];
            } else {
                vm.task.article = vm.cleanArray(vm.task.article);
            }

            if (_.isUndefined(vm.task.static_list) || _.isNull(vm.task.static_list) || _.isEmpty(vm.task.static_list)) {
                vm.task.static_list = [];
            } else {
                vm.task.static_list = vm.cleanArray(vm.task.static_list);
            }

            if (_.isUndefined(vm.task.digital_list) || _.isNull(vm.task.digital_list) || _.isEmpty(vm.task.digital_list)) {
                vm.task.digital_list = [];
            } else {
                vm.task.digital_list = vm.cleanArray(vm.task.digital_list);
            }

            var tmpTsk = angular.copy(vm.task);
            tmpTsk.materials = JSON.stringify(tmpTsk.materials);
            tmpTsk.artwork = JSON.stringify(tmpTsk.artwork);
            tmpTsk.article = JSON.stringify(tmpTsk.article);
            tmpTsk.static_list = JSON.stringify(tmpTsk.static_list);
            tmpTsk.digital_list = JSON.stringify(tmpTsk.digital_list);
            //console.log('submitted vm.task : ' + JSON.stringify(tmpTsk));

            DataFactory.uploadTask(tmpTsk, 'ooh', passedID).then(
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
                                    frm_class: 'box-ooh',
                                    frm_title: 'Success',
                                    isConfirm: false,
                                    msg: "Successfully saved OOH task and you will be redirected to dashboard.",
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
                    vm.errorMsg.push({ id: 'due_date', msg: response.data.error_msg })
                    toastr.error(response.data.error_msg, {
                        closeButton: true,
                        onHidden: function () {
                            ////console.log('Calling toastr onHidden function');
                            vm.clearErrors();
                        }
                    });
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
    vm.Validate = function () {
        vm.errorMsg = [];
        var tmp = true;
        var type_count = 0;

        if (vm.spinners.artwork.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Artwork attachment is uploaded to server.' });
        } else if (vm.spinners.article.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Article attachment is uploaded to server.' });
        } else if (vm.spinners.materials.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Material attachment is uploaded to server.' });
        } else {
            if (_.isUndefined(vm.task.ad_spend) || _.isNull(vm.task.ad_spend)) {
                vm.errorMsg.push({ id: 'ad_spend', msg: 'Ad Spend is required.' });
            } else {
                if (vm.task.ad_spend < 1) vm.errorMsg.push({ id: 'ad_spend', msg: 'Ad Spend is required.' });
            }

            if (vm.task.artwork_type) {
                if (_.isNull(vm.task.artwork_type) || vm.task.artwork_type == '') {
                    vm.errorMsg.push({ id: 'artwork_type', msg: 'Job Classification is required.' });
                }
            } else {
                vm.errorMsg.push({ id: 'artwork_type', msg: 'Job Classification is required.' });
            }


            if (_.isUndefined(vm.task.static) || _.isNull(vm.task.static)) {
            } else {
                if (vm.task.static == 1) {
                    if (_.isUndefined(vm.task.static_list) || _.isNull(vm.task.static_list)) {
                        vm.errorMsg.push({ id: 'Static', msg: 'Static location is required.' });
                    } else {
                        if (vm.task.static_list.length > 0) {
                            type_count = type_count + 1;
                        } else {
                            vm.errorMsg.push({ id: 'Static', msg: 'Static location is required.' });
                        }
                    }
                }
            }

            if (_.isUndefined(vm.task.digital) || _.isNull(vm.task.digital)) {
            } else {
                if (vm.task.digital == 1) {
                    if (_.isUndefined(vm.task.digital_list) || _.isNull(vm.task.digital_list)) {
                        vm.errorMsg.push({ id: 'Digital', msg: 'Digital location is required.' });
                    } else {
                        if (vm.task.digital_list.length > 0) {
                            type_count = type_count + 1;
                        } else {
                            vm.errorMsg.push({ id: 'Digital', msg: 'Digital location is required.' });
                        }
                    }
                }
            }

            if (_.isUndefined(vm.task.video) || _.isNull(vm.task.video)) {
            } else {
                if (vm.task.video == 1) {
                    if (_.isUndefined(vm.task.video_len) || _.isNull(vm.task.video_len)) {
                        vm.errorMsg.push({ id: 'video_len', msg: 'Please provide the video length.' });
                    } else {
                        if (vm.task.video_len == 'Other') {
                            if (_.isUndefined(vm.task.video_len_option) || _.isNull(vm.task.video_len_option)) {
                                vm.errorMsg.push({ id: 'video_len_option', msg: 'Please provide the video length.' });
                            } else {
                                type_count = type_count + 1;
                            }
                        } else {
                            type_count = type_count + 1;
                        }
                    }
                }
            }

            if (_.isUndefined(vm.task.motion_graphic) || _.isNull(vm.task.motion_graphic)) {
            } else {
                if (vm.task.motion_graphic == 1) {
                    if (_.isUndefined(vm.task.graphic_len) || _.isNull(vm.task.graphic_len)) {
                        vm.errorMsg.push({ id: 'graphic_len', msg: 'Please provide the Motion Graphic length.' });
                    } else {
                        if (vm.task.graphic_len == 'Other') {
                            if (_.isUndefined(vm.task.graphic_len_option) || _.isNull(vm.task.graphic_len_option)) {
                                vm.errorMsg.push({ id: 'graphic_len_option', msg: 'Please provide the Motion Graphic length.' });
                            } else {
                                type_count = type_count + 1;
                            }
                        } else {
                            type_count = type_count + 1;
                        }
                    }
                }
            }

            if (_.isUndefined(vm.task.others) || _.isNull(vm.task.others) || vm.task.others == "") {
            } else {
                type_count = type_count + 1;
            }

            if (type_count == 0) vm.errorMsg.push({ id: 'others', msg: 'Please provide the Type of task.' });


            if (_.isUndefined(vm.task.due_date) || _.isNull(vm.task.due_date) || vm.task.due_date == '') {
                vm.errorMsg.push({ id: 'due_date', msg: 'Due date is required.' });
            }

            if (_.isUndefined(vm.task.pub_date) || _.isNull(vm.task.pub_date) || vm.task.pub_date == '') {
                vm.errorMsg.push({ id: 'pub_date', msg: 'Pub date is required.' });
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
                            frm_class: 'box-ooh',
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

    vm.addProduct = function (typ) {

        if (typ == 'Digital') {
            if (_.isUndefined(vm.task.digital_list) || _.isNull(vm.task.digital_list)) vm.task.digital_list = [];
        } else {
            if (_.isUndefined(vm.task.static_list) || _.isNull(vm.task.static_list)) vm.task.static_list = [];
        }

        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'partials/products/ooh.html',
            controller: 'oohModalCtrl as ctrl',
            resolve: {
                preload: function () {
                    return { 'type': typ, 'option': null };
                }
            }
        }).result.then(function (submitVar) {
            //console.log("submitted value inside parent controller", submitVar);
            if (typ == 'Digital') {
                vm.task.digital_list.push(submitVar);
            } else {
                vm.task.static_list.push(submitVar);
            }
        })
    };
    vm.editRow = function (option, typ, ndex) {
        var bak = angular.copy(option);
        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'partials/products/ooh.html',
            controller: 'oohModalCtrl as ctrl',
            resolve: {
                preload: function () {
                    return { 'type': typ, 'option': bak };
                }
            }
        }).result.then(
            function (submitVar) {
                //console.log("submitted value inside parent controller", submitVar);
                //console.log("old value", option);
                //console.log("new value", submitVar);
                if (typ == 'Digital') {
                    vm.task.digital_list[ndex] = submitVar;
                } else {
                    vm.task.static_list[ndex] = submitVar;
                }
            },
            function (res) {
                //console.log("cancel ----> reset option", res);
                //option = bak;
            },
        )
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
                    vm.task.team_head = response.data[0].name;
                    vm.task.team_head_username = response.data[0].username;

                    //console.log('[selectUser - team_head] : ' + vm.task.team_head);
                    //console.log('[selectUser - team_head_id] : ' + vm.task.team_head_username);
                },
                // error handler
                function (response) {
                    //console.log('[selectUser - getMember] Ooops, something went wrong..  \n ' + JSON.stringify(response));
                }
            );
        } else {
            tmpData.is_Multiple = "1";
            var default_val = null;
            if (retFld == 'designer') {
                default_val = vm.task.designer_username;
            } else if (retFld == 'buddy') {
                default_val = vm.task.buddy_username;
            } else if (retFld == 'english_writer') {
                default_val = vm.task.english_writer_username;
            } else if (retFld == 'chinese_writer') {
                default_val = vm.task.chinese_writer_username;
            } else if (retFld == 'malay_writer') {
                default_val = vm.task.malay_writer_username;
            } else {
                default_val = vm.task.team_head_username;
                tmpData.is_Multiple = "0";
            }

            var modalInstance = $uibModal.open({
                animation: vm.animationsEnabled,
                templateUrl: 'partials/common/member.html',
                controller: 'memberModalCtrl as ctrl',
                resolve: {
                    parentData: function () {
                        var tmp = {
                            frm_class: 'box-ooh',
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
                //console.log("submitted value inside parent controller", submitVar);
                if (retFld == 'designer') {
                    vm.task.designer = submitVar.name;
                    vm.task.designer_username = submitVar.username;
                } else if (retFld == 'buddy') {
                    vm.task.buddy = submitVar.name;
                    vm.task.buddy_username = submitVar.username;
                } else if (retFld == 'english_writer') {
                    vm.task.english_writer = submitVar.name;
                    vm.task.english_writer_username = submitVar.username;
                } else if (retFld == 'chinese_writer') {
                    vm.task.chinese_writer = submitVar.name;
                    vm.task.chinese_writer_username = submitVar.username;
                } else if (retFld == 'malay_writer') {
                    vm.task.malay_writer = submitVar.name;
                    vm.task.malay_writer_username = submitVar.username;
                } else if (retFld == 'team_head') {
                    vm.task.team_head = submitVar.name;
                    vm.task.team_head_username = submitVar.username;
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
    vm.defineLang = function () {
        console.clear();
        //console.log('publication : ' + vm.task.publication + ' | language : ' + vm.task.language);
        for (i = 0; i < vm.pubOptionsList.length; i++) {
            //console.log('product_code : ' + vm.pubOptionsList[i].product_code);
            if (vm.task.publication == vm.pubOptionsList[i].product_code) {
                vm.task.language = vm.pubOptionsList[i].language;
                break;
            }
        }
        //console.log('language : ' + vm.task.language);
    };
    vm.defineSize = function () {
        ////console.log('size_option : ' + vm.task.size_option);
        for (i = 0; i < vm.pubSizes.length; i++) {
            ////console.log('pubSizes ['+ i +'] : ' + vm.pubSizes[i].size);
            if (vm.task.size_option == 'Other') {
                vm.task.pub_size = null;
                break;
            } else if (vm.task.size_option == vm.pubSizes[i].size) {
                var cols = vm.pubSizes[i].column;
                //console.log('column : ' + cols + ' | length : ' + cols.length);
                cols = (cols > 9) ? cols : ("0" + cols);
                //console.log('cols : ' + cols);

                var ht = vm.pubSizes[i].height;
                //console.log('ht : ' + ht + ' | length : ' + ht.length);
                ht = (ht > 9) ? ht : ("0" + ht);
                //console.log('ht : ' + ht);
                vm.task.pub_size = ht + " x " + cols;
                break;
            }
        }
    };
    vm.defineType = function (isChanged) {
        var param = { category: vm.task.pub_type };
        //console.log('defineType : ' + vm.task.pub_type);

        DataFactory.getSize(param).then(
            //success
            function (response) {
                //console.log('[defineType] - response.data : ' + JSON.stringify(response.data));
                //console.log('[defineType] - response.status : ' + JSON.stringify(response.status));
                if (isChanged) {
                    vm.task.size_option = null;
                    vm.task.pub_size = null;
                }
                vm.pubSizes = response.data;
                vm.pubSizes.push({ size: 'Other', height: 0, width: 0 });
            },
            // error handler
            function (response) {
                //console.log('[getPubSize] Ooops, something went wrong..  \n ' + JSON.stringify(response));
            }
        )

    };

    vm.revertTask = function (chatFlag) {
        var tmp = {
            frm_class: 'box-classified',
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

    vm.approveArtwork = function () {
        vm.submitTask('Pending Import');
    };
    vm.revertArtwork = function () {
        //console.log('[ooh] - revertArtwork');
        if (_.isUndefined(vm.task.sales_comment) || _.isNull(vm.task.sales_comment) || vm.task.sales_comment == '') {
            toastr.error("Please add your reason for returning Artwork", { closeButton: true });
        } else {
            vm.submitTask('For Revision');
        }
    };
    vm.importComplete = function () {
        //import complete
        vm.submitTask('Import Complete');
    }

    vm.closeOOHTask = function () {
        //  completed
        vm.submitTask('Completed');
    }

    vm.deleteRow = function (ndex, typ) {
        ////console.log('[deleteRow] - index : ' + ndex);
        ////console.log('[deleteRow] - product list : ' + JSON.stringify(vm.productList));
        if (typ == 'Static') {
            vm.task.static_list[ndex] = null;
            vm.task.static_list = vm.cleanArray(vm.task.static_list);
        } else {
            vm.task.digital_list[ndex] = null;
            vm.task.digital_list = vm.cleanArray(vm.task.digital_list);
        }
    }

    if ($stateParams.action == "create") {
        //console.log('[ooh] - create');
        vm.currentUser.canEdit = 'sales';
        vm.readOnly = false;
        vm.getTmpID();
        //vm.getPubOptionsList();
        //vm.getArtworkTypes();
    } else {
        //console.log('[ooh] - read');
        vm.readOnly = true;
        //vm.getPubOptionsList();
        //vm.getArtworkTypes();
        vm.getTask();
    };

    ////console.log('$routeParams.orderId : ' + $routeParams.orderId);
    //console.log('END - oohCTRL');
});
app.controller('oohModalCtrl', function ($uibModalInstance, $filter, focus, toastr, preload, DataFactory) {
    var vm = this;
    vm.formTitle = '';
    console.clear();
    //console.log('[oohModalCtrl] - preload : ' + JSON.stringify(preload));
    vm.formType = preload.type;

    vm.Options = {
        list1: '',
        list2: '',
        list3: '',
        list4: '',
        list5: '',
    };


    vm.clearField = function (fldNum) {
        if (vm.formType == 'Digital') {
            if (fldNum == 1) {
                vm.output.category = '';
                vm.output.location = '';
                vm.output.description = '';
                vm.output.material = '';
                vm.output.screens = '';
            } else if (fldNum == 2) {
                vm.output.location = '';
                vm.output.description = '';
                vm.output.material = '';
                vm.output.screens = '';
            } else if (fldNum == 3) {
                vm.output.description = '';
                vm.output.material = '';
                vm.output.screens = '';
            } else if (fldNum == 4) {
                vm.output.material = '';
                vm.output.screens = '';
            } else {
                vm.output.screens = '';
            }
        } else {
            if (fldNum == 1) {
                vm.output.location = '';
                vm.output.dimension = '';
                vm.output.material = '';
                vm.output.remarks = '';
            } else if (fldNum == 2) {
                vm.output.description = '';
                vm.output.dimension = '';
                vm.output.material = '';
                vm.output.remarks = '';
            } else if (fldNum == 3) {
                vm.output.dimension = '';
                vm.output.material = '';
                vm.output.remarks = '';
            } else if (fldNum == 4) {
                vm.output.material = '';
                vm.output.remarks = '';
            } else {
                vm.output.remarks = '';
            }
        }
    }

    vm.setDefault = function (fldName, srcName) {
        tmp = _.uniq(_.map(vm.Options[srcName], fldName));
        ////console.log('output : ' + JSON.stringify(vm.output), vm.output);
        //console.log('fldName : ' + fldName + ' | srcName : ' + srcName + ' | tmp : ' + JSON.stringify(tmp), tmp);
        if (tmp.length == 1) {
            if (_.isNull(tmp[0])) {
            } else {
                vm.output[fldName] = tmp[0].toString();
                res = parseInt(srcName.charAt(srcName.length - 1)) + 1;
                vm.getFilteredList(res);
            }
        }
    }

    vm.getFilteredList = function (fldNum) {
        var fldName = '';
        var filter = {};
        if (fldNum == 1) {
            if (vm.formType == 'Digital') {
                fldName = 'category';
            } else {
                fldName = 'location';
            }
            vm.setDefault(fldName, 'list1');
        } else if (fldNum == 2) {
            if (vm.formType == 'Digital') {
                filter = { 'category': vm.output.category };
                fldName = 'location';
            } else {
                filter = { 'location': vm.output.location };
                fldName = 'description';
            }
            vm.Options.list2 = $filter('filter')(vm.Options.list1, filter);
            vm.setDefault(fldName, 'list2');
        } else if (fldNum == 3) {
            if (vm.formType == 'Digital') {
                filter = { 'category': vm.output.category, 'location': vm.output.location };
                fldName = 'description';
            } else {
                filter = { 'location': vm.output.location, 'description': vm.output.description };
                fldName = 'dimension';
            }
            vm.Options.list3 = $filter('filter')(vm.Options.list1, filter);
            vm.setDefault(fldName, 'list3');
        } else if (fldNum == 4) {
            if (vm.formType == 'Digital') {
                filter = { 'category': vm.output.category, 'location': vm.output.location, 'description': vm.output.description };
                fldName = 'material';
            } else {
                filter = { 'location': vm.output.location, 'description': vm.output.description, 'dimension': vm.output.dimension };
                fldName = 'material';
            }
            vm.Options.list4 = $filter('filter')(vm.Options.list1, filter);
            vm.setDefault(fldName, 'list4');
        } else if (fldNum == 5) {
            if (vm.formType == 'Digital') {
                filter = { 'category': vm.output.category, 'location': vm.output.location, 'description': vm.output.description, 'material': vm.output.material };
                fldName = 'screens';
            } else {
                filter = { 'location': vm.output.location, 'description': vm.output.description, 'dimension': vm.output.dimension, 'material': vm.output.material };
                fldName = 'remarks';
            }
            vm.Options.list5 = $filter('filter')(vm.Options.list1, filter);
            vm.setDefault(fldName, 'list5');
        } else {
        }
    }

    vm.runOptions = function () {
        if (_.isUndefined(preload.option) || _.isNull(preload.option)) {
            vm.formTitle = "Add Product";
            if (preload.type == 'Digital') {
                vm.output = {
                    category: '',
                    location: '',
                    description: '',
                    material: '',
                    screens: '',
                }
            } else {
                vm.output = {
                    location: '',
                    description: '',
                    dimension: '',
                    material: '',
                    remarks: '',
                }
            }
            vm.getFilteredList(1);
        } else {
            vm.formTitle = "Edit Product";
            vm.output = preload.option;
            vm.getFilteredList(1);
            vm.getFilteredList(2);
            vm.getFilteredList(3);
            vm.getFilteredList(4);
            vm.getFilteredList(5);
        }
    }

    vm.getOptionsList = function (typ) {
        var ret = null;
        if (typ == 'Digital') {
            DataFactory.getOOHDigitalList().then(
                //success
                function (response) {
                    //console.log('[getOptionsList] - digital.response.data : ' + JSON.stringify(response.data));
                    ////console.log('[getOptionsList] - digital.response.status : ' + JSON.stringify(response.status));
                    vm.Options.list1 = response.data;
                    vm.runOptions();
                },
                // error handler
                function (response) {
                    //console.log('[getOptionsList] digital : Ooops, something went wrong..  \n ' + JSON.stringify(response));
                });
        } else {
            DataFactory.getOOHStaticList().then(
                //success
                function (response) {
                    //console.log('[getOptionsList] - static.response.data : ' + JSON.stringify(response.data));
                    ////console.log('[getOptionsList] - static.response.status : ' + JSON.stringify(response.status));
                    vm.Options.list1 = response.data;
                    vm.runOptions();
                },
                // error handler
                function (response) {
                    //console.log('[getOptionsList] static: Ooops, something went wrong..  \n ' + JSON.stringify(response));
                });
        }
        return ret;
    };

    vm.getOptionsList(vm.formType);

    vm.ok = function () {
        $uibModalInstance.close(vm.output);
    }

    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});