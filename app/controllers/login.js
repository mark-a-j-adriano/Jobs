app.controller('LoginCtrl', function ($auth, $state, $window, $stateParams, toastr, DataFactory, StorageFactory, devUserList, cookieActive) {
    var vm = this;
    vm.isDev = false;
    //console.log('hostname:'+ JSON.stringify($window.location.hostname));
    //vm.isUAT = (window.location.hostname.includes("-dev") || window.location.hostname.includes("localhost")) ? true : false;
    vm.isUAT = true;
    vm.userName = '';
    vm.eMail = '';
    vm.passWord = '';
    vm.userList = null;
    var userInfor = {};
    var ret_URI = StorageFactory.getURI();


    if (vm.isUAT) vm.userList = devUserList;

    vm.SignIn = function () {
        /*
        //console.log("[SignIn] isDev : " + vm.isDev);
        //console.log("[SignIn] userName : " + vm.userName);
        //console.log("[SignIn] eMail : " + vm.eMail);
        //console.log("[SignIn] passWord : " + vm.passWord);
        */
        if (vm.isDev) {
            userInfor = {
                id: vm.userName,
                email: vm.userName + '@sph.com.sg',
                password: '',
            };
        } else {
            var str = vm.eMail;
            if (str.includes("@")) {
                var res = str.split("@");
                userInfor = {
                    id: res[0],
                    email: vm.eMail,
                    password: vm.passWord,
                }
            } else {
                userInfor = {
                    id: vm.eMail,
                    email: vm.eMail + '@sph.com.sg',
                    password: vm.passWord,
                }
            }
        }

        if (vm.isDev) {
            $auth.setStorageType('localStorage');
            $auth.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkVNUyBNYXJrIEFudGhvbnkgQWRyaWFubyIsImFkbWluIjp0cnVlfQ.PCf3NxaUt0ZBziWE5rDN_nMDOA77_aLjKYOj6YCm27E');
            vm.getRole(userInfor.id);
        } else {
            if (userInfor.id == '') {
                toastr.error(
                    'Please enter your username or email!', {
                        closeButton: true
                    }
                );
            } else if (userInfor.password == '') {
                toastr.error(
                    'Please enter your password!', {
                        closeButton: true
                    }
                );
            } else {
                DataFactory.authenticateUser({ 'username': userInfor.id, 'password': userInfor.password }).then(
                    //success
                    function (response) {
                        var str = JSON.stringify(response.data);
                        //console.log('response.data : ' + str);
                        //console.log('response.status : ' + JSON.stringify(response.status));

                        if (str.includes("[SUCCESS]")) {
                            $auth.setStorageType('localStorage');
                            var res = str.split("]");
                            $auth.setToken(res[1]);
                            vm.getRole(userInfor.id);
                        } else if (str.includes("Unable to bind to server")) {
                            toastr.error(
                                "ldap_bind(): Unable to bind to server: Can't contact LDAP server", {
                                    closeButton: true
                                }
                            );
                        } else {
                            toastr.error("Username / Password is incorrect", { closeButton: true });
                        }


                    },
                    // error handler
                    function (response) {
                        //console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
                        toastr.error(
                            'Ooops, something went wrong..  \n ' + JSON.stringify(response), {
                                closeButton: true
                            }
                        );
                    });
            }
        }
    };

    vm.getRole = function (usrID) {
        DataFactory.getRequestor(usrID).then(
            //success
            function (response) {
                //console.log('response.data : ' + JSON.stringify(response.data));
                ////console.log('response.status : ' + JSON.stringify(response.status));
                userInfor.id = usrID;
                userInfor.name = response.data.submitted_by;
                userInfor.phone = response.data.mobile_no;
                userInfor.ext = response.data.extension;
                userInfor.role = response.data.role;
                delete userInfor.password;
                delete userInfor.email;
                delete userInfor.phone;
                delete userInfor.ext;


                ////console.log('userInfor : ' + JSON.stringify(userInfor));
                //UserData.setUserData(userInfor);
                StorageFactory.setSessionData(userInfor, null);
                if (_.isUndefined(ret_URI) || _.isNull(ret_URI) || ret_URI == '' || ret_URI.includes("login")) {
                    var accessLVL = parseInt(userInfor.role);
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
                } else {
                    //console.log('Redirecting to URL instance...');
                    window.location = ret_URI;
                }
            },
            // error handler
            function (response) {
                ////console.log('Ooops, something went wrong..  \n ' + JSON.stringify(response));
            });
    };

    vm.authenticate = function (provider) {
        $auth.authenticate(provider)
            .then(function (response) {
                console.debug("success", response);
                vm.getRole(userInfor.id);
                //toastr.success('You have successfully signed in with ' + provider + '!');
                //$location.path('/');
            })
            .catch(function (error) {
                if (error.message) {
                    // Satellizer promise reject error.
                    toastr.error(error.message);
                } else if (error.data) {
                    // HTTP response error from server
                    toastr.error(error.data.message, error.status);
                } else {
                    toastr.error(error);
                }
            })
    };

    if (_.isUndefined(cookieActive) || _.isNull(cookieActive)) {
    } else {
        var poi = StorageFactory.getSessionData(false);
        console.log("[LoginCtrl] - poi :", poi);
        if (_.isUndefined(poi) || _.isNull(poi)) {
            console.log("[LoginCtrl] - getToken :", $auth.getToken());
            console.log("[LoginCtrl] - getPayload :", $auth.getPayload());
        } else {
            vm.getRole(poi.id);
        }
    }

});

app.controller('NavCtrl', function ($auth, $state, toastr, StorageFactory) {
    var vm = this;
    vm.fullName = "";

    vm.isAuthenticated = function () {
        var userData = StorageFactory.getSessionData(false);
        ////console.log('userData : ' + JSON.stringify(userData));
        if (_.isUndefined(userData) || _.isNull(userData)) { } else {
            if (_.isUndefined(userData.name) || _.isNull(userData.name)) { } else {
                vm.fullName = userData.name
                var accessLVL = parseInt(userData.role);
                if (accessLVL > 29) {
                    vm.role = "Sales"
                } else if (accessLVL > 24) {
                    vm.role = "Sales Team Lead"
                } else if (accessLVL > 19) {
                    vm.role = "Copywriter"
                } else if (accessLVL > 9) {
                    vm.role = "Designer"
                } else if (accessLVL > 4) {
                    vm.role = "Coordinator"
                } else {
                    vm.role = "Administrator"
                }
                vm.role
            }
        };
        return $auth.isAuthenticated();
    };

    vm.logOut = function () {
        vm.fullName = "";
        $auth.logout();
        StorageFactory.clearSessionData();
        toastr.info('You have been logged out', { closeButton: true });
        StorageFactory.setFlg();
        //StorageFactory.setURI(null);
        //var orig_URI = window.location.href;
        //var res = orig_URI.split("/#!/");
        //window.location.href = res[0];
        $state.go('login');
    };

});

app.controller('memberModalCtrl', function ($uibModalInstance, focus, toastr, parentData, members) {
    //console.log('START - memberModalCtrl');
    var vm = this;

    //console.log('[memberModalCtrl] - parentData : ' + JSON.stringify(parentData));
    console.log('[memberModalCtrl] - members : ' + JSON.stringify(members));
    vm.hdr_class = parentData.frm_class;
    vm.formTitle = parentData.return_fld;
    vm.members = members;
    vm.isMultiple = false;
    vm.selected = parentData.default;
    vm.inputList = [];
    vm.outputList = [];
    vm.listSetting = { smartButtonMaxItems: 20 };
    vm.showTeam = false;
    vm.enableSearch = false;
    vm.extraSettings = {
        scrollableHeight: '400px',
        scrollable: true,
        styleActive: true,
        selectedToTop: true,
        enableSearch: (vm.members.length > 10) ? true : false,        
    } 

    if (_.isUndefined(parentData.user_data.is_Multiple) || _.isNull(parentData.user_data.is_Multiple)) {
    } else if (parentData.user_data.is_Multiple == "1") {
        vm.isMultiple = true;
        for (i = 0; i < vm.members.length; i++) {
            var obj = {
                id: (i + 1),
                label: vm.members[i].name,
                username: vm.members[i].username,
            };
            vm.inputList.push(obj);
        }

        //console.log('[memberModalCtrl] inputList -', vm.inputList);
        if (_.isUndefined(vm.selected) || _.isNull(vm.selected) || _.isEmpty(vm.selected) || vm.selected == "") {
        } else {
            vm.selected = vm.selected.split(", ");
            //console.log('[memberModalCtrl] selected -', vm.selected);
            for (i = 0; i < vm.inputList.length; i++) {
                for (ii = 0; ii < vm.selected.length; ii++) {
                    if (vm.inputList[i].username == vm.selected[ii]) {
                        vm.outputList.push(vm.inputList[i]);
                    }
                }
            }
        }
        //console.log('Pre-selected vm.outputList : ' + JSON.stringify(vm.outputList));
    }

    vm.ok = function () {
        var retVal = null;
        if (vm.isMultiple) {
            usrNm = [];
            usrID = [];
            for (i = 0; i < vm.outputList.length; i++) {
                usrNm.push(vm.outputList[i].label);
                usrID.push(vm.outputList[i].username);
            }

            retVal = {
                name: _.uniq(usrNm).join(", "),
                username: _.uniq(usrNm).join(", "),
            }
        } else {
            for (i = 0; i < vm.members.length; i++) {
                if (vm.members[i].username == vm.selected) {
                    retVal = vm.members[i];
                    break;
                }
            }
        }

        $uibModalInstance.close(retVal);
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    //console.log('END - memberModalCtrl');
});

app.controller('msgBoxModalCtrl', function ($uibModalInstance, focus, toastr, parentData, msgList) {
    //console.log('START - msgBoxModalCtrl');
    var vm = this;
    vm.selected = null;
    vm.isChat = false;
    vm.hdr_class = parentData.frm_class;
    vm.isConfirmation = parentData.isConfirm;
    vm.msg_content = parentData.msg;
    vm.formTitle = parentData.frm_title;
    vm.msg_chat = "";
    vm.msg_List = msgList;
    vm.userRole = "sales";

    vm.roleColor = function (usrTmp) {
        //console.log('[roleColor] usrTmp : ' + usrTmp);
        var style = { "color": "maroon" };
        if (usrTmp == 'designer') {
            style.color = 'green';
        } else if (usrTmp == 'coordinator') {
            style.color = 'violet';
        } else if (usrTmp == 'writer' || usrTmp == 'copywriter') {
            style.color = 'blue';
        }
        return style;
    }

    if (parentData.isChat) {
        if (_.isNull(parentData.isChat)) { } else { vm.isChat = parentData.isChat }
    }

    if (parentData.user_role) {
        if (_.isNull(parentData.user_role)) { } else { vm.userRole = parentData.user_role }
    }

    vm.ok = function () {
        if (vm.isChat) {
            $uibModalInstance.close(vm.msg_chat);
        } else {
            $uibModalInstance.close(true);
        }
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss(false);
    };
    //console.log('END - msgBoxModalCtrl');
});

app.controller('chatModalCtrl', function ($uibModalInstance, focus, toastr, parentData) {
    //console.log('START - chatModalCtrl');
    var vm = this;
    vm.selected = null;
    vm.hdr_class = parentData.frm_class;
    vm.isConfirmation = parentData.isConfirm;
    vm.msg_content = parentData.msg;
    vm.formTitle = parentData.frm_title;

    vm.ok = function () {
        $uibModalInstance.close(true);
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss(false);
    };
    //console.log('END - chatModalCtrl');
});
