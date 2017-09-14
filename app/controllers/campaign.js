app.controller('displayCTRL', function ($state, $auth, $uibModal, $stateParams, $timeout, toastr, focus, Upload, DataFactory, StorageFactory, currentUser) {
    //console.log('START - displayCTRL');

    var vm = this;
    vm.isValid = true;
    vm.errorMsg = [];
    vm.productList = [];
    vm.pubOptionsList = [];
    vm.pubSizes = [];
    vm.artwork_Types = [];
    vm.task = {};
    vm.animationsEnabled = true;
    vm.statusNum = 0;
    vm.developerLog = false;
    vm.pubTypes = [{ code: 'CLS', name: 'Classified' }, { code: 'DSP', name: 'Display' }];
    vm.filesForDeletion = [];
    vm.qProductsError = false;
    vm.readOnly = true;
    vm.docHistory = [];
    vm.docMessages = [];
    vm.cc_response_dsp = [];
    vm.ACL = {
        //TRUE MEANS YOU ARE RESTRICTED
        section0: true,     //Permanent Read ONLY fields
        section1: true,     //Requestor Information //Requestor Information             
        section2: true,     //Specification 
        section3: true,     //Assignment Details
        section4: true,     //Materials //Instructions
        section5: true,     //Preview of Completed Write Up - Copywriter
        section6: true,     //Product Details       
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

    
    

    vm.accessControl = function () {
        var tmpFlag = '';
        var tmpStatus = vm.task.status;
        tmpStatus = tmpStatus.toLowerCase();
        var accessLVL = parseInt(currentUser.role);

        if (tmpStatus == "new" || tmpStatus == "draft" || tmpStatus == "request re-submission") {
            vm.statusNum = 0;
        } else if (tmpStatus == "pending assignment") {
            vm.statusNum = 1;
        } else if (tmpStatus == "in progress" || tmpStatus == "for revision") {
            vm.statusNum = 2;
        } else if (tmpStatus == "completed") {
            vm.statusNum = 3;
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
                if (vm.statusNum == 0) {
                    tmpFlag = 'sales';
                } else if (vm.statusNum == 2) {
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
                if (vm.statusNum == 2) {
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
                vm.ACL.section2 = false;
                vm.ACL.section4 = false;
                vm.ACL.section6 = false;
            } else if (vm.statusNum == 2) {
                vm.ACL.section6 = false;
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
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        var day = tempDate.getDay();
                        if ((day === 6) || (day === 0)) { flag = true; }
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

    vm.getTmpID = function () {
        DataFactory.getChildRequestorInf($stateParams.orderID).then(
            //success
            function (response) {

                //console.log('[getTmpID] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getTmpID] - response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.task.creative_form = 'display';
                vm.task.status = 'new';
                vm.task.title = $stateParams.orderTitle;
                vm.task.ad_spend = 0;
                vm.task.production_cost = 0;
                vm.task.parent_id = $stateParams.orderID;
                vm.task.logged_in_user = currentUser.id;
                if (_.isUndefined(vm.task.cc_response) || _.isNull(vm.task.cc_response)) {
                    vm.cc_response_dsp = [];
                } else {
                    vm.cc_response_dsp = _.uniq(vm.task.cc_response.split(","));
                }
                var res = $stateParams.taskID.split('~');
                vm.task.job_no = res[0];
                //console.log('res : ' + JSON.stringify(res[0]));
                vm.task.task_no = res.join("-");

                vm.task.size_option = "Other";
                vm.task.due_date = '';
                vm.task.type = null;
                vm.task.pub_size = null;
                vm.task.materials = [];

                var tmpData = {
                    team_name: 'DisplayLAB',
                    division: 'Creative',
                    role: '7',
                    primary: '1',
                };

                DataFactory.getMember(tmpData).then(
                    //success
                    function (response) {
                        ////console.log('[getTmpID - getMember] - response.data : ' + JSON.stringify(response.data));
                        ////console.log('[getTmpID - getMember] - response.status : ' + JSON.stringify(response.status));
                        vm.task.operations = response.data[0].name;
                        vm.task.operations_username = response.data[0].username;

                        //console.log('[getTmpID - operations] : ' + vm.task.operations);
                        //console.log('[getTmpID - operations_username] : ' + vm.task.operations_username);
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
            team: 'DisplayLAB',
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
    vm.getPubOptionsList = function () {
        DataFactory.getProductList().then(
            //success
            function (response) {
                //console.log('[getPubOptionsList] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getPubOptionsList] - response.status : ' + JSON.stringify(response.status));
                var tmp = [];
                for (i = 0; i < response.data.length; i++) {
                    var option = {
                        product_name: response.data[i].product_name,
                        product_code: response.data[i].product_code,
                        language: response.data[i].language,
                    };
                    tmp.push(option);
                }

                vm.pubOptionsList = angular.copy(tmp);
                vm.pubOptions = angular.copy(tmp);
                vm.pubOptions.push({ product_name: 'OTHER', product_code: 'Other', language: '', });
            },
            // error handler
            function (response) {
                //console.log('[getPubOptionsList] - Ooops, something went wrong..  \n ' + JSON.stringify(response));
            }
        );
    };
    vm.getTask = function () {
        DataFactory.getTask($stateParams.taskID, 'display').then(
            //success
            function (response) {
                console.log('[getTask] - response.data : ' + JSON.stringify(response.data));
                console.log('response.status : ' + JSON.stringify(response.status));
                vm.task = response.data;
                vm.currentUser.canEdit = vm.accessControl();
                vm.task.parent_id = vm.task.job_id;
                if (vm.currentUser.canEdit == '') {
                    DataFactory.gotoDashBoard(vm.currentUser.role);
                } else {

                    vm.task.ad_spend = parseFloat(vm.task.ad_spend);
                    vm.task.production_cost = parseFloat(vm.task.production_cost);
                    vm.task.due_date = new Date(vm.task.due_date);
                    if (vm.task.urgent > 0) vm.task.urgent = true;
                    //vm.task.size_option = ['Other'];
                    vm.productList = JSON.parse(vm.task.products);
                    if (_.isUndefined(vm.task.cc_response) || _.isNull(vm.task.cc_response)) {
                        vm.cc_response_dsp = [];
                    } else {
                        vm.cc_response_dsp = _.uniq(vm.task.cc_response.split(","));
                    }
                    if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials) || _.isEmpty(vm.task.materials) || vm.task.materials == "" || vm.task.materials == "[]") {
                        vm.task.materials = [];
                    } else {
                        vm.task.materials = DataFactory.cleanArray(JSON.parse(vm.task.materials));
                    }

                    if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork) || _.isEmpty(vm.task.artwork) || vm.task.artwork == "" || vm.task.artwork == "[]") {
                        vm.task.artwork = [];
                    } else {
                        vm.task.artwork = DataFactory.cleanArray(JSON.parse(vm.task.artwork));
                    }

                    if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article) || _.isEmpty(vm.task.article) || vm.task.article == "" || vm.task.article == "[]") {
                        vm.task.article = [];
                    } else {
                        vm.task.article = DataFactory.cleanArray(JSON.parse(vm.task.article));
                    }

                    if (_.isUndefined(vm.task.final_ad_spend) || _.isNull(vm.task.final_ad_spend) || _.isEmpty(vm.task.final_ad_spend) || final_ad_spend == '') {
                    } else {
                        vm.task.final_ad_spend = parseFloat(vm.task.final_ad_spend);
                    }

                    if (_.isUndefined(vm.task.final_production_cost) || _.isNull(vm.task.final_production_cost) || _.isEmpty(vm.task.final_production_cost) || final_production_cost == '') {
                    } else {
                        vm.task.final_production_cost = parseFloat(vm.task.final_production_cost);
                    }

                    if (vm.productList) {
                        if (_.isNull(vm.productList)) {
                        } else {
                            for (i = 0; i < vm.productList.length; i++) {
                                if (vm.productList[i].pubDate) {
                                    if (_.isNull(vm.productList[i].pubDate) || vm.productList[i].pubDate == '') {
                                    } else {
                                        vm.productList[i].pubDate = new Date(vm.productList[i].pubDate);
                                    }
                                };

                                if (vm.productList[i].etDate) {
                                    if (_.isNull(vm.productList[i].etDate) || vm.productList[i].etDate == '') {
                                    } else {
                                        vm.productList[i].etDate = new Date(vm.productList[i].etDate);
                                    }
                                };

                                if (vm.productList[i].cashDate) {
                                    if (_.isNull(vm.productList[i].cashDate) || vm.productList[i].cashDate == '') {
                                    } else {
                                        vm.productList[i].cashDate = new Date(vm.productList[i].cashDate);
                                    }
                                };
                            }
                        }
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

        DataFactory.uploadTask(vm.task, 'display', passedID).then(
            //success
            function (response) {
                var modalInstance = $uibModal.open({
                    animation: vm.animationsEnabled,
                    templateUrl: 'partials/common/msgbox.html',
                    controller: 'msgBoxModalCtrl as ctrl',
                    resolve: {
                        parentData: function () {
                            var tmp = {
                                frm_class: 'box-display',
                                frm_title: 'Success',
                                isConfirm: false,
                                msg: "Successfully saved DisplayLAB task and you will be redirected to dashboard.",
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
                        if (submitVar) DataFactory.gotoDashBoard(vm.currentUser.role);
                    },
                    //failure
                    function (submitVar) {
                        DataFactory.gotoDashBoard(vm.currentUser.role);
                    },
                )
            },
            // error handler
            function (response) {
                //console.log('[getTmpID] Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });


    };
    vm.isAssigned = function () {
        var str = vm.task.designer_username;
        if (_.isUndefined(str) | _.isNull(str) || _.isEmpty(str) || str.trim() == '') {
            toastr.error("Please assign a designer.", {
                closeButton: true,
                onHidden: function () {
                    ////console.log('Calling toastr onHidden function');
                    vm.clearErrors();
                }
            });
        } else {
            vm.submitTask('In Progress');
        }
    };
    vm.submitTask = function (newStatus) {
        //console.log('[submitTask] - newStatus : ' + newStatus);
        if (newStatus == 'Draft') {
            vm.isValid = true;
        } else {
            vm.isValid = vm.Validate();
        }

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

            if (_.isDate(vm.task.due_date)) {
                vm.task.due_date = moment(vm.task.due_date).format('YYYY-MM-DD HH:mm:ss');
            } else {
                vm.task.due_date = null;
            }

            var passedID = null;
            if ($stateParams.action != "create") {
                passedID = vm.task.id;
                vm.task.logged_in_user = currentUser.id;
                vm.task._method = "put";
            }

            if (_.isUndefined(vm.productList) || _.isNull(vm.productList) || _.isEmpty(vm.productList)) {
                vm.task.productList = [];
            } else {
                vm.task.productList = DataFactory.cleanArray(vm.productList);
            }

            if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials) || _.isEmpty(vm.task.materials)) {
                vm.task.materials = [];
            } else {
                vm.task.materials = DataFactory.cleanArray(vm.task.materials);
            }

            if (_.isUndefined(vm.task.artwork) || _.isNull(vm.task.artwork) || _.isEmpty(vm.task.artwork)) {
                vm.task.artwork = [];
            } else {
                vm.task.artwork = DataFactory.cleanArray(vm.task.artwork);
            }

            if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article) || _.isEmpty(vm.task.article)) {
                vm.task.article = [];
            } else {
                vm.task.article = DataFactory.cleanArray(vm.task.article);
            }

            var tmpTsk = angular.copy(vm.task);
            tmpTsk.productList = JSON.stringify(tmpTsk.productList);
            tmpTsk.products = tmpTsk.productList;
            tmpTsk.materials = JSON.stringify(tmpTsk.materials);
            tmpTsk.artwork = JSON.stringify(tmpTsk.artwork);
            tmpTsk.article = JSON.stringify(tmpTsk.article);
            //console.log('submitted vm.task : ' + JSON.stringify(tmpTsk));

            DataFactory.uploadTask(tmpTsk, 'display', passedID).then(
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
                                    frm_class: 'box-display',
                                    frm_title: 'Success',
                                    isConfirm: false,
                                    msg: "Successfully saved DisplayLAB task and you will be redirected to dashboard.",
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
                            if (submitVar) DataFactory.gotoDashBoard(vm.currentUser.role);
                        },
                        //failure
                        function (submitVar) {
                            DataFactory.gotoDashBoard(vm.currentUser.role);
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
        if (vm.spinners.artwork.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Artwork attachment is uploaded to server.' });
        } else if (vm.spinners.materials.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Material attachment is uploaded to server.' });
        } else if (vm.spinners.article.visible) {
            vm.errorMsg.push({ id: '', msg: 'Please wait until Text attachment is uploaded to server.' });
        } else {
            if (vm.task.ad_spend < 1) vm.errorMsg.push({ id: 'ad_spend', msg: 'Ad Spend is required.' });
            //if (vm.task.production_cost < 1) vm.errorMsg.push({ id: 'production_cost', msg: 'Production Cost is required.' });

            if (vm.task.artwork_type) {
                if (_.isNull(vm.task.artwork_type) || vm.task.artwork_type == '') vm.errorMsg.push({ id: 'artwork_type', msg: 'Job Classification is required.' });
            } else {
                vm.errorMsg.push({ id: 'artwork_type', msg: 'Job Classification is required.' });
            }

            if (vm.task.publication) {
                if (_.isNull(vm.task.publication) || vm.task.publication == '') {
                    vm.errorMsg.push({ id: 'publication', msg: 'Publication is required.' });
                } else if (vm.task.publication == 'Other') {
                    if (vm.task.other_pub) {
                        if (_.isNull(vm.task.other_pub) || vm.task.other_pub == '') vm.errorMsg.push({ id: 'other', msg: 'Other Information is required.' });
                    } else {
                        vm.errorMsg.push({ id: 'other_pub', msg: 'Other Information is required.' });
                    }
                }
            } else {
                vm.errorMsg.push({ id: 'publication', msg: 'Publication is required.' });
            }

            if (vm.task.pub_type) {

                if (_.isNull(vm.task.pub_type) || vm.task.pub_type == '') vm.errorMsg.push({ id: 'pub_type', msg: 'Publication Type is required.' });
            } else {
                //console.log('pub_type [2] : ' + vm.task.pub_type);
                vm.errorMsg.push({ id: 'pub_type', msg: 'Publication Type is required.' });
            }

            if (vm.task.size_option) {
                if (_.isNull(vm.task.size_option) || vm.task.size_option == '') {
                    vm.errorMsg.push({ id: 'size_option', msg: 'Pre-defined size is required.' });
                } else if (vm.task.size_option == 'Other') {
                    if (vm.task.pub_size) {
                        if (_.isNull(vm.task.pub_size) || vm.task.pub_size == '') vm.errorMsg.push({ id: 'pub_size', msg: 'Height x Cols is required.' });
                    } else {
                        vm.errorMsg.push({ id: 'pub_size', msg: 'Height x Cols is required.' });
                    }
                };
            } else {
                vm.errorMsg.push({ id: 'size_option', msg: 'Pre-defined size is required.' });
            }

            if (vm.task.language) {
                if (_.isNull(vm.task.language) || vm.task.language == '') vm.errorMsg.push({ id: 'language', msg: 'Language is required.' });
            } else {
                vm.errorMsg.push({ id: 'language', msg: 'Language is required.' });
            }

            if (vm.task.colour) {
                if (_.isNull(vm.task.colour) || vm.task.colour == '') {
                    vm.errorMsg.push({ id: 'colour', msg: 'Colour is required.' });
                } else if (vm.task.colour == 'Spot Colour') {
                    if (vm.task.colour_option) {
                        if (_.isNull(vm.task.colour_option) || vm.task.colour_option == '') vm.errorMsg.push({ id: 'colour_option', msg: 'Colour Option is required.' });
                    } else {
                        vm.errorMsg.push({ id: 'colour_option', msg: 'Colour Option is required.' });
                    }
                };
            } else {
                vm.errorMsg.push({ id: 'colour', msg: 'Colour is required.' });
            }

            /*
            if (vm.task.due_date) {
                if (_.isNull(vm.task.due_date) || vm.task.due_date == '') {
                    vm.errorMsg.push({ id: 'due_date', msg: 'Due date is required.' });
                } else {
                    var flg = false;
                    var due1 = Date.parse(vm.task.default_due_date);
                    var due2 = Date.parse(vm.task.due_date);
                    if (vm.task.urgent) flg = vm.task.urgent;
    
                    if (flg == false) {
                        if (due1 > due2) vm.errorMsg.push({ id: 'due_date', msg: 'Due date entered is less than minimum required by the sytem.\n Please click URGENT if correct.' });
                    }
                }
            } else {
                vm.errorMsg.push({ id: 'due_date', msg: 'Due date is required.' });
            }
            */
            /*
            if (vm.task.materials) {
              if (_.isNull(vm.task.materials) || vm.task.materials.length < 1) vm.errorMsg.push({ id: 'materials', msg: 'Materials is required.' });
            } else {
              vm.errorMsg.push({ id: 'materials', msg: 'Materials is required.' });
            }
            */

            if (vm.task.instruction) {
                if (_.isNull(vm.task.instruction) || vm.task.instruction == '') vm.errorMsg.push({ id: 'instruction', msg: 'Instruction is required.' });
            } else {
                vm.errorMsg.push({ id: 'instruction', msg: 'Instruction is required.' });
            }

            if (vm.productList) {
                if (_.isNull(vm.productList) || vm.productList.length < 1) vm.errorMsg.push({ id: 'productList', msg: 'Product List is required.' });
            } else {
                vm.errorMsg.push({ id: 'productList', msg: 'Product List is required.' });
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
                            frm_class: 'box-display',
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
    };
    vm.addProduct = function () {

        if (_.isUndefined(vm.productList) || _.isNull(vm.productList)) vm.productList = [];

        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'partials/products/display.html',
            controller: 'displayModalCtrl as ctrl',
            resolve: {
                parentData: function () {
                    var tmp = {
                        user: vm.currentUser.id,
                        tmpId: vm.productList.length,
                        taskID: vm.task.task_no,
                        isList: true,
                        items: vm.pubOptionsList,
                        //items: pubOptions,
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
            //console.log("value inside parent controller", submitVar);
            vm.productList.push(submitVar);
        })
    };
    vm.editRow = function (option, ndex) {
        var bak = angular.copy(option);
        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'partials/products/display.html',
            controller: 'displayModalCtrl as ctrl',
            resolve: {
                parentData: function () {
                    var tmp = {
                        user: vm.currentUser.id,
                        tmpId: null,
                        taskID: null,
                        isList: true,
                        items: vm.pubOptionsList,
                        //items: pubOptions,
                        filters: vm.MaskConfig,
                        dueDate: vm.task.due_date,
                    };
                    return tmp;
                },
                product: function () {
                    return bak;
                }
            }
        }).result.then(function (submitVar) {
            vm.productList[ndex] = submitVar;
        })
    };
    vm.selectUser = function (team, div, rol, retFld, order) {
        console.log("[selectUser]");
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
                    vm.task.operations = response.data[0].name;
                    vm.task.operations_username = response.data[0].username;

                    //console.log('[selectUser - operations] : ' + vm.task.operations);
                    //console.log('[selectUser - operations_id] : ' + vm.task.operations_username);
                },
                // error handler
                function (response) {
                    //console.log('[selectUser - getMember] Ooops, something went wrong..  \n ' + JSON.stringify(response));
                }
            );
        } else {
            tmpData.is_Multiple = "1";
            var default_val = vm.task[retFld + "_username"];

            var modalInstance = $uibModal.open({
                animation: vm.animationsEnabled,
                templateUrl: 'partials/common/member.html',
                controller: 'memberModalCtrl as ctrl',
                resolve: {
                    parentData: function () {
                        var tmp = {
                            frm_class: 'box-display',
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
                vm.task[retFld] = submitVar.name;
                vm.task[retFld + "_username"] = submitVar.username;
            })
        }
    };
    vm.ChangeStatus = function (ndex, status) {
        if (status == 'Approve') {
            vm.productList[ndex].status = "Artwork Approved";
        } else {
            vm.productList[ndex].status = "For Revision";
        }
        //console.log("[ChangeStatus] productList:", vm.productList);
    };
    vm.getUser = function (user_id, tmpFld) {
        DataFactory.getRequestor(user_id).then(
            //success
            function (response) {
                //console.log('[getUser] - response.data : ' + JSON.stringify(response.data));
                //console.log('[getUser] - response.status : ' + JSON.stringify(response.status));

                if (tmpFld == 'submitted_by') {
                    vm.task.submitted_by = '';
                    vm.task.submitted_by_username = '';
                    vm.task.extension = '';
                    vm.task.mobile_no = '';
                    vm.task.team = '';
                }

                vm.task.cc_response = '';
                vm.task.cc_response_username = '';
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
        //console.clear();
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
        console.log('defineType : ' + vm.task.pub_type);

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
            frm_class: 'box-display',
            frm_title: 'Request Re-Submission',
            isConfirm: false,
            isChat: true,
            msg: "Please enter your message.",
            user_role: vm.currentUser.canEdit,
        };

        if (_.isUndefined(chatFlag) || _.isNull(chatFlag) || _.isEmpty(chatFlag) || chatFlag == '') {
            chatFlag = "";
            tmp.frm_title = "Conversation";
        } else if (chatFlag == 'cancel' || chatFlag == 'direct cancel') {
            tmp.frm_title = "Cancellation Request";
            tmp.msg = "Please enter your reason for cancelling this task.";
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
                    vm.submitTask('Request Re-Submission');
                } else if (chatFlag == 'rejected') {
                    vm.task.sales_comment = submitVar;
                    vm.submitTask('For Revision');
                } else if (chatFlag == 'cancel') {                    
                    vm.submitTask('Cancellation Request');
                } else if (chatFlag == 'direct cancel') {                    
                    vm.submitTask('Cancelled');
                } else {                    
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
            if (_.isUndefined(vm.task.final_size) || _.isNull(vm.task.final_size) || _.isEmpty(vm.task.final_size) || vm.task.final_size == '') {
                vm.task.final_size = vm.task.pub_size;
            }
        } else if (type == 'article') {
            vm.spinners.article.visible = true;
            vm.spinners.article.progress = 0;
            if (_.isUndefined(vm.task.article) || _.isNull(vm.task.article)) vm.task.article = [];
        } else {
            if (_.isUndefined(vm.task.materials) || _.isNull(vm.task.materials)) vm.task.materials = [];
            vm.spinners.materials.visible = true;
            vm.spinners.materials.progress = 0;
        }

        angular.forEach(files, function (file) {
            file.upload = Upload.upload({
                url: StorageFactory.getAppSettings('UPL'),
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
            vm.spinners.artwork.visible = false;
            vm.spinners.artwork.progress = 0;
            vm.task.artwork = DataFactory.cleanArray(vm.task.artwork);
        } else if (type == 'article') {
            vm.spinners.article.visible = false;
            vm.spinners.article.progress = 0;
            vm.task.article = DataFactory.cleanArray(vm.task.article);
        } else {
            vm.spinners.materials.visible = false;
            vm.spinners.materials.progress = 0;
            vm.task.materials = DataFactory.cleanArray(vm.task.materials);
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
            vm.task.article = DataFactory.cleanArray(vm.task.article);
        } else if (type == 'artwork') {
            //vm.task.artwork
            vm.task.artwork[ndex] = null;
            vm.task.artwork = DataFactory.cleanArray(vm.task.artwork);
        } else {
            //vm.task.materials
            vm.task.materials[ndex] = null;
            vm.task.materials = DataFactory.cleanArray(vm.task.materials);
        }
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
                templateUrl: 'partials/products/display.html',
                controller: 'displayModalCtrl as ctrl',
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
            }).result.then(
                //success
                function (submitVar) {
                    //console.log("submitted value inside parent controller", submitVar);
                    vm.task.final_ad_spend = submitVar.final_ad_spend;
                    vm.task.final_production_cost = submitVar.final_cost;
                    vm.submitTask('Pending Import');
                },
                //failure
                function (submitVar) {
                    toastr.error("Please update Ad Spend / Production Cost", { closeButton: true });
                },
            )
        } else {
            vm.task.final_ad_spend = vm.task.ad_spend;
            vm.task.final_production_cost = vm.task.production_cost;
            vm.submitTask('Pending Import');
        }

    };
    vm.revertArtwork = function () {
        //console.log('[DISPLAY] - revertArtwork');
        if (_.isUndefined(vm.task.sales_comment) || _.isNull(vm.task.sales_comment) || vm.task.sales_comment == '') {
            toastr.error("Please add your reason for returning Artwork", { closeButton: true });
        } else {
            vm.submitTask('For Revision');
        }
    };
    vm.importComplete = function () {
        //import complete
        vm.submitTask('Import Complete');
    };
    vm.closeDisplayTask = function () {
        //  completed
        vm.submitTask('Completed');
    };
    vm.deleteRow = function (ndex) {
        ////console.log('[deleteRow] - index : ' + ndex);
        ////console.log('[deleteRow] - product list : ' + JSON.stringify(vm.productList));
        vm.productList[ndex] = null;
        vm.productList = DataFactory.cleanArray(vm.productList);
        //_.findLastIndex(array, {}) 
    };

    if ($stateParams.action == "create") {
        //console.log('[DISPLAY] - create');
        vm.currentUser.canEdit = 'sales';
        vm.readOnly = false;
        vm.getTmpID();
        vm.getPubOptionsList();
        vm.getArtworkTypes();
    } else {
        //console.log('[DISPLAY] - read');
        vm.readOnly = true;
        vm.getPubOptionsList();
        vm.getArtworkTypes();
        vm.getTask();
    };

    ////console.log('$routeParams.orderId : ' + $routeParams.orderId);
    //console.log('END - displayCTRL');
});
app.controller('displayModalCtrl', function ($timeout, $uibModalInstance, focus, toastr, parentData, product, Upload) {
    var vm = this;
    vm.pubOptions = parentData.items;
    vm.filter = parentData.filters;
    vm.formTitle = '';
    vm.final_ad_spend = 0;
    vm.final_cost = 0;

    vm.statusOptions = ["ET is due today, pls get approval TWO hours before ET", "Artwork is ready for collection",
        "Client  to revert eDM", "Client to revert Artwork", "Client to revert Logo", "Client to revert Visual",
        "Client to revert Concept", "Client to revert Chinese Copy", "Client to revert English Copy",
        "Client to revert Malay Copy", "Closed", "Collaterals", "Copy / Artwork", "Copy / Visual",
        "Job brief", "Job cancelled", "Logo Design", "Logo Design CTR", "On hold", "Ongoing", "For Approval", "Approved",
        "Pending additional info", "Pending client’s copy", "Pending client’s logo",
        "Pending client’s pix", "Pending client’s re-brief", "Pending client’s soft copy", "Pending ET number",
        "Pending further instructions", "Pending new pub dates", "Presentation", "Printer", "Photography", "Ready to ET",
        "Revise Artwork", "Revise Copy", "Revise Visual", "Revise Visual Mock-up", "Revised Artwork 1 – CTR",
        "Revised Artwork 2 - CTR", "Revised Artwork 3 - CTR", "Revised Artwork 4 - CTR", "Revised Artwork 5 - CTR",
        "Revised Artwork 6 - CTR", "Revised Artwork 7 – CTR", "Redo Artwork", "Viaual Mock-up", "Visual is ready for collection",
        "Writer [Chinese]", "Writer [English]", "Writer [Malay]"];

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
        //console.log('pre-loaded product', product);
        vm.formTitle = "Edit Product";
        vm.product = product;
        vm.product.pubDate = _.isNull(vm.product.pubDate) ? null : new Date(vm.product.pubDate);
        vm.product.presentationDate = _.isNull(vm.product.presentationDate) ? null : new Date(vm.product.presentationDate);
        vm.product.etDate = _.isNull(vm.product.etDate) ? null : new Date(vm.product.etDate);
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
        //console.log('filter : ' + JSON.stringify(vm.filter) + ' | vm.filter.cash : ' + JSON.stringify(vm.filter.cash));
    }

    // PUB date picker
    this.dateTimePicker1 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                //var todaysDate = new Date(parentData.dueDate);
                var todaysDate = new Date();
                var tempDate = new Date(data.date);
                ////console.log('todaysDate : ' + todaysDate.toDateString() + ' | tempDate : ' + tempDate.toDateString());
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        /*
                            var day = tempDate.getDay();
                            if ((day === 6) || (day === 0)) {
                                flag = true;
                            }
                        */
                    }
                }

                return flag;
            }
        }
    };
    // Presentation date picker
    this.dateTimePicker2 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                //var todaysDate = new Date(parentData.dueDate);
                var todaysDate = new Date();
                var tempDate = new Date(data.date);
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        /*
                            var day = tempDate.getDay();
                            if ((day === 6) || (day === 0)) {
                                flag = true;
                            }
                        */
                    }
                }

                return flag;
            }
        }
    };
    // ET date picker
    this.dateTimePicker3 = {
        date: new Date(parentData.dueDate),
        datepickerOptions: {
            showWeeks: false,
            startingDay: 1,
            dateDisabled: function (data) {
                var flag = false;
                //var todaysDate = new Date(parentData.dueDate);
                var todaysDate = new Date();
                var tempDate = new Date(data.date);
                if (data.mode === 'day') {
                    if (todaysDate.toDateString() == tempDate.toDateString()) {
                    } else if (tempDate < todaysDate) {
                        flag = true;
                    } else {
                        /*
                            var day = tempDate.getDay();
                            if ((day === 6) || (day === 0)) {
                                flag = true;
                            }
                        */
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

    vm.uploadFiles = function (files, type) {
        //console.log('[uploadFiles] - files : ', files);
        var traceNum = "";

        //console.log('[uploadFiles] - parentData.taskID : ', parentData.taskID);
        //console.log('[uploadFiles] - product.taskID : ', vm.product.taskID);
        if (_.isUndefined(parentData.taskID) || _.isNull(parentData.taskID)) {
            traceNum = vm.product.taskID + "-" + vm.product.ID;
        } else {
            traceNum = parentData.taskID + "-" + (parentData.tmpId + 1);
        }

        var details = {
            'formType': 'task',
            'fileDesc': type,
            'traceNum': traceNum,
        };

        //console.log('[uploadFiles] - details : ' + JSON.stringify(details));
        var timeStamp = new Date();

        angular.forEach(files, function (file) {
            //console.log('[uploadFiles] - file : ', file);
            file.upload = Upload.upload({
                url: StorageFactory.getAppSettings('UPL'),
                method: 'POST',
                file: file,
                data: details,
            });

            file.upload.then(function (response) {
                //console.log('[uploadFiles] - response : ', response);

                //SUCCESS
                $timeout(function () {
                    var res = response.data;
                    if (res.indexOf("ERROR") > 0) {
                    } else {
                        ////console.log('[uploadFiles] - file : ' + JSON.stringify(file));
                        var arr = res.split("/" + details.traceNum + "/");
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
                                uploadBy: parentData.user,
                                uploadDt: moment(timeStamp).format('YYYY-MM-DD HH:mm:ss'),
                            };
                            //console.log('[uploadFiles] - fileTmp : ' + JSON.stringify(fileTmp));
                            vm.product.artwork = fileTmp;
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
        });

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


        if (!(isComplete1)) errMsg.push('ET number is required.');
        if (errMsg.length > 0) {
            toastr.error(errMsg[0], { closeButton: true });
        } else {
            var tmp = {
                ID: (parentData.tmpId + 1),
                taskID: parentData.taskID,
                pubID: vm.product.pubID,
                pubName: vm.product.pubName,
                pubDate: (_.isNull(vm.product.pubDate) ? null : moment(vm.product.pubDate).format('YYYY-MM-DD')),
                presentationDate: (_.isNull(vm.product.presentationDate) ? null : moment(vm.product.presentationDate).format('YYYY-MM-DD')),
                etNum: vm.product.etNum,
                etNum_tbd: vm.product.etNum_tbd,
                etDate: (_.isNull(vm.product.etDate) ? null : moment(vm.product.etDate).format('YYYY-MM-DD')),
                artwork: vm.product.artwork,
                status: vm.product.status,
            }
            $uibModalInstance.close(tmp);
        }

    };

    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});