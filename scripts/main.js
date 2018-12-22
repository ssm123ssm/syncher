$(function () {


});

var app = angular.module('myApp', []);
app.controller('ctrl', function ($scope) {
    $scope.status = "On";
    $scope.docs = [];
    $scope.synching = 1;
    $scope.remove = function (id) {
        $scope.synching = true;
        $.ajax({
            method: 'POST',
            data: {
                id: id
            },
            url: "/removeDoc",
            success: function (data) {
                if (data.status == 20) {
                    $scope.getDocs();
                }
                $scope.synching = false;
            },
            error: function () {
                console.log('error on removal');
                $scope.synching = false;
            }
        });
    }
    //getting docs
    var timeout = 0;
    var hashCheckTimeout = 3000;
    var passhash;
    $scope.getDocs = function () {
        $.ajax({
            method: 'GET',
            url: "/testMongo",
            success: function (data) {
                $scope.docs = data;
                $scope.synching = false;
                //periodic check
                var str = '';
                $scope.docs.forEach(function (item) {
                    str += item._id;
                });
                passhash = CryptoJS.MD5(str);
                $scope.hashCheck();
                $scope.$apply();
            },
            error: function () {
                console.log('error on getting docs');
                $scope.synching = false;
                $scope.$apply();
            }
        });
    }

    $scope.hashCheck = function () {

        $.ajax({
            url: '/hashCheck',
            method: 'POST',
            data: {
                hash: passhash.toString()
            },
            success: function (data) {
                if (data.stat == "changed") {
                    console.log('hash CHANGED');
                    $scope.getDocs();
                } else {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        $scope.hashCheck();
                    }, hashCheckTimeout);
                }

            },
            error: function () {
                console.log('hash check error');
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    $scope.hashCheck();
                }, hashCheckTimeout);

            }
        });
    }





});
