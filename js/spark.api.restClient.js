// {"resource":"http://api.spark.net/apps/application/' + apiInfo.appId + '?client_id=' + apiInfo.appId + '&client_secret=OKm5C5XQRsymz0EaVLcvVLI357lyDrGdib/ZyC0mqTc="}
// brandId/{brandId}/oauth2/accesstoken/application/{applicationId}/refreshtoken

var spark = spark || {};
spark.API = spark.API || {};
spark.API.restClient = spark.API.restClient || {

    getQueryVariable : function (url, variable) {
        var query = url.split("?");
        if (query.length > 1) {
            var vars = query[1].split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
        }
    },

    prodApiInfo : {
        domain : 'https://api.spark.net',
        appId : 1001,
        clientSecret : 'OKm5C5XQRsymz0EaVLcvVLI357lyDrGdib/ZyC0mqTc='
    },

    devApiInfo : {
        domain : 'http://dev.api.spark.net',
        appId : 1054,
        clientSecret : 'nZGVVfj8dfaBPKsx_dmcRXQml8o5N-iivf5lBkrAmLQ1'
    },


//    getLoginDataLocalStorage : function () {
//        var dateStr = localStorage["accessExpiresTime"];
//        var testDate = new Date(dateStr);
//        var loginData = {
//            "memberId":localStorage["memberId"],
//            "accessToken":localStorage["accessToken"],
//            "isPayingMember":localStorage["isPayingMember"] === 'true',
//            "expiresIn":localStorage["expiresIn"],
//            "accessExpiresTime":new Date(localStorage["accessExpiresTime"]),
//            "refreshToken":localStorage["refreshToken"]
//        };
//        return loginData;
//    },
//
//    saveLoginDataLocalStorage : function (loginData) {
//        localStorage["memberId"] = loginData.memberId;
//        localStorage["accessToken"] = loginData.accessToken;
//        localStorage["isPayingMember"] = loginData.isPayingMember;
//        localStorage["expiresIn "] = loginData.expiresIn;
//        localStorage["accessExpiresTime"] = loginData.accessExpiresTime;
//        localStorage["refreshToken"] = loginData.refreshToken;
//    },
//

    getLoginDataCookies : function () {
        var dateStr = localStorage["accessExpiresTime"];
        var testDate = new Date(dateStr);
        var loginData = {
            "memberId" : $.cookie("MOS_MEMBER"),
            "accessToken" : $.cookie("MOS_ACCESS"),
            "isPayingMember" : $.cookie("MOS_SUB"),
            "accessExpiresTime" : new Date($.cookie("MOS_ACCESS_EXPIRES")),
            "refreshToken" : $.cookie("MOS_REFRESH")
        };
        return loginData;
    },

    saveLoginDataCookies : function (loginData) {

        var nextMonth = new Date().getDate() + 30;
        var accessExpires = new Date(loginData.accessExpiresTime);
        $.cookie("MOS_MEMBER", loginData.memberId, { expires: nextMonth, path: '/', domain: 'jdate.com' });
        $.cookie("MOS_ACCESS", loginData.accessToken, { expires: accessExpires, path: '/', domain: 'jdate.com' });
        $.cookie("MOS_SUB", loginData.isPayingMember, { expires: nextMonth, path: '/', domain: 'jdate.com' });
        $.cookie("MOS_ACCESS_EXPIRES", loginData.accessExpiresTime, { expires: accessExpires, path: '/', domain: 'jdate.com' });
        $.cookie("MOS_REFRESH", loginData.refreshToken, { expires: nextMonth, path: '/', domain: 'jdate.com' });
    },

    getLoginData : function () {
        return this.getLoginDataCookies();
    },

    saveLoginData : function (loginData) {
        this.saveLoginDataCookies(loginData);
    },

    tokenResponseToLoginData : function (tokenResponse) {
        var loginData = {
            "memberId":tokenResponse["MemberId"],
            "accessToken":tokenResponse["AccessToken"],
            "expiresIn":tokenResponse["ExpiresIn"],
            "accessExpiresTime":this.convertAspNetDate(tokenResponse["AccessExpiresTime"]),
            //"accessExpiresTime":new Date(tokenResponse["AccessExpiresTime"]),
            "refreshToken":tokenResponse["RefreshToken"],
            "isPayingMember":tokenResponse["IsPayingMember"]
        };
        console.log("expires " + loginData.accessExpiresTime);
        return loginData;
    },

    getSearchPrefs : function () {
        var prefJson = localStorage["searchPrefs"];
        if (!prefJson) {
            return null;
        }
        var prefData = JSON.parse(prefJson);
        return prefData;
    },

    saveSearchPrefs : function (searchPrefs) {
        var prefJson = JSON.stringify(searchPrefs);
        localStorage["searchPrefs"] = prefJson;
    },

    loadSearchPrefsFromPage : function() {
        var searchPrefs = {
            "gender" : $('input:radio[name=gender]:checked').val(),
            "seekingGender" : $('input:radio[name=seekingGender]:checked').val(),
            "minAge" : parseInt($('#search-preferences-minage').val()),
            "maxAge" : parseInt($('#search-preferences-maxage').val()),
            "maxDistance" : parseInt($('#search-preferences-location-range').val()),
            "showOnlyMembersWithPhotos" : $('#search-preferences-photo').val() === "true",
            "showOnlyJewishMembers" : $('#search-preferences-jewish').val() === "true"
        };
        return searchPrefs;
    },

    matchPrefsResponseToDTO : function (machPrefsResponse) {
        var searchPrefs = {
            "gender" : machPrefsResponse["gender"],
            "seekingGender" : machPrefsResponse["seekingGender"],
            "minAge" : parseInt(machPrefsResponse["minAge"]),
            "maxAge" : parseInt(machPrefsResponse["maxAge"]),
            "location" : machPrefsResponse["location"],
            "maxDistance": parseInt(machPrefsResponse["maxDistance"]),
            "showOnlyMembersWithPhotos" : machPrefsResponse["showOnlyMembersWithPhotos"] === "true",
            "showOnlyJewishMembers" : true
        };
        return searchPrefs;
    },

    ensureSearchPrefs : function(callback, state) {
        if (typeof(callback) !== "function") {
            return;
        }
        var searchPrefs = getSearchPrefs();
        if (searchPrefs) {
            callback(searchPrefs, state);
        }
        else {
            ensureGoodToken(function () {
                $.ajax({
                    contentType:"application/json",
                    type:'GET',
                    url: self.baseUrl + '/match/preferences/' + loginData.memberId + '?access_token=' + loginData.accessToken,
                    dataType:'json',
                    success:function (data) {
                        searchPrefs = matchPrefsResponseToDTO(data);
                        saveSearchPrefs(searchPrefs);
                        searchPrefs = getSearchPrefs();
                        callback(searchPrefs, state);
                    },
                    error:showErrors
                });
            });
        }
    },

    goToLogin : function () {
        if (typeof(this.loggedOutCallback) === 'function') {
            this.loggedOutCallback();
        }
    },

    setLoggedOutCallback : function (callback) {
        if (typeof(callback) === 'function') {
            this.loggedOutCallback = callback;
        }
    },

    fetchMiniProfile : function (memberId, callback) {
        this.ensureGoodToken(function () {
        if (memberId) {
            var api = spark.API.restClient;
            $.ajax({
                type:'GET',
                url: api.baseUrl + '/profile/attributeset/miniProfile/' + memberId + "/" + api.loginData.memberId + '?access_token=' + api.loginData.accessToken,
                dataType:'json',
                success:function (data) {
                    if (typeof(callback) === 'function') {
                        data.thumbOrNoPic = api.getThumbOrNoPic(data); // adding convenience property
                        callback(data);
                    }
                },
                error: function() {

                    //alert('error getting mini profile');
                }
            });
        }
        });
    },

    fetchHotlistCounts : function (successCallback, failureCallback) {
        spark.API.restClient.ensureGoodToken(function () {
            var api = spark.API.restClient;
            $.ajax({
                //contentType:"application/json",
                type:'GET',
                url: api.baseUrl + '/hotlist/counts/' + api.loginData.memberId + '?access_token=' + api.loginData.accessToken,
                //url: 'http://rails.spark.net:3000/brandId/1003/oauth2/accesstoken/application/1000',
                dataType:'json',
                //data:JSON.stringify(tokenRequest),
                success:function (data) {
                    if (typeof(successCallback === "function")) {
                        successCallback(data);
                    }
                },
                error : function() {
                    if (typeof(failureCallback === "function")) {
                        failureCallback();
                    }
                    showErrors();
                }
            });
        });
     },


    showErrors : function (data) {
        var errorInfo = "";

        function showType(dataType) {
            for (var prop in data) {
                if (data.hasOwnProperty(prop) && (typeof(data[prop]) === dataType)) {
                    errorInfo += prop + " :  " + data[prop] + "\n";
                }
            }
        }
        showType("number");
        showType("string");
        alert("POST error: \n" + errorInfo);
    },

    completePendingRestCalls : function () {
        var count = this.restCallbackWithState.length;
        for (var i = 0; i < count; i++) {
            var cbAndState = this.restCallbackWithState[i];
            if (cbAndState) {
                if (cbAndState.callback && typeof(cbAndState.callback) === "function") {
                    cbAndState.callback(cbAndState.state);
                }
            }
        }
        this.restCallbackWithState = [];
    },


    getTokensUsingPassword : function (email, password, successCallback, failureCallback) {
        var tokenRequest = {
            "email" : email,
            "password" : password
        };

        $.ajax({
            contentType : "application/json",
            type : 'POST',
            url : this.baseUrl + '/oauth2/accesstoken/application/' + this.apiInfo.appId + '?client_secret=' + this.apiInfo.clientSecret,
            //url: 'http://rails.spark.net:3000/brandId/1003/oauth2/accesstoken/application/1000',
            dataType :'json',
            data : JSON.stringify(tokenRequest),
            success : function (data) {
                var api = spark.API.restClient;
                var msg = "";
                if (data.Success) {
                    if (data.AccessToken) {
                        msg = "got access token: " + data.AccessToken;
                    }
    //                    alert("POST success!!! \n" + msg);
                    api.loginData = api.tokenResponseToLoginData(data);
                    api.saveLoginData(api.loginData);
                    if (typeof(successCallback === "function")) {
                        successCallback();
                    }
                }
                else
                    alert("Login failed \n" + data.Error)
            },
            error : function() {
                if (typeof(failureCallback === "function")) {
                    failureCallback();
                }
                showErrors();
            }
        });
    },

    makeRefreshTokenCall : function () {
        var tokenRequest = {
            "memberId" : this.loginData.memberId,
            "refreshToken" : this.loginData.refreshToken
        };

        $.ajax({
            contentType : "application/json",
            type : 'POST',
            url : this.baseUrl + '/oauth2/accesstoken/application/' + this.apiInfo.appId + '/refreshtoken?client_secret=' + this.apiInfo.clientSecret,
            dataType : 'json',
            data:JSON.stringify(tokenRequest),
            success : function (data) {
                if (data.Success) {
                    spark.API.restClient.loginData = spark.API.restClient.tokenResponseToLoginData(data);
                    spark.API.restClient.saveLoginData(spark.API.restClient.loginData);
                    spark.API.restClient.completePendingRestCalls();
                }
                else {
                    if (console && console.log) {
                        console.log("Login failed \n" + data.Error);
                    }
                    spark.API.restClient.goToLogin();
                }

            },
            error:this.showErrors
        });
    },

    ensureGoodToken : function (callback, state) {
        this.loginData = this.getLoginData();
        var now = new Date();
        if (!this.loginData.accessToken || !this.loginData.refreshToken) {
            this.goToLogin();
            return;
        }
        if (this.loginData.accessExpiresTime > now) {
            callback(state); // good token, ok to make call
        }
        else {
            var cbAndState = {
                "callback":callback,
                "state":state
            };
            this.restCallbackWithState.push(cbAndState);
            if (this.refreshCallInProgressSince) { // an extra check that shouldn't be necessary.
                // In case token call got into a bad state (no callback after 5 minutes), reset it.
                var difference = new Date() - this.refreshCallInProgressSince;
                var minutes = difference / (1000 * 60);
                if (minutes > 5) {
                    this.refreshCallInProgressSince = null;
                }
            }

            if (!this.refreshCallInProgressSince) { // call isn't already in progress
                this.refreshCallInProgressSince = new Date();
                this.makeRefreshTokenCall();
            }
        }
    },

    convertAspNetDate : function (dateString) {
        if (!dateString) {
            return null;
        }
        return new Date(parseInt(dateString.substr(6)));
    },

    getNoPic : function(gender) {
        return (gender && gender === "Female") ? 'http://m.jdate.com/images/no-photo-f.png' : 'http://m.jdate.com/images/no-photo-m.png';
    },

    getThumbOrNoPic : function (member) {
        if (member.primaryPhoto && member.primaryPhoto.thumbPath) {
            return member.primaryPhoto.thumbPath;
        }
        else if (member.defaultPhoto && member.defaultPhoto.thumbPath) {
            return member.defaultPhoto.thumbPath;
        }
        return (this.getNoPic(member.gender));
    },

    getFullOrNoPic : function (member) {
        if (member.primaryPhoto && member.defaultPhoto.fullPath) {
            return member.primaryPhoto.fullPath;
        }
        else if (member.defaultPhoto && member.defaultPhoto.fullPath) {
            return member.defaultPhoto.fullPath;
        }
        return (this.getNoPic(member.gender));
    },

    init : function() {
        this.apiInfo = this.devApiInfo;
        this.baseUrl = this.apiInfo.domain + '/brandId/1003';
        // global login object
        this.loginData = this.getLoginData();
        if (!this.loginData.accessToken) {
            this.makeRefreshTokenCall();
        }
        this.restCallbackWithState = [];
        this.refreshCallInProgressSince = null;
    }

};

if (!spark.API.restClient.initialized) {
    spark.API.restClient.init();
    spark.API.restClient.initialized = true;
}


