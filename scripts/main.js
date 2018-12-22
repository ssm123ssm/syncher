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
    $scope.getDocs = function () {
        $.ajax({
            method: 'GET',
            url: "/testMongo",
            success: function (data) {
                $scope.docs = data;
                $scope.synching = false;
                $scope.$apply();
            },
            error: function () {
                console.log('error on getting docs');
                $scope.synching = false;
                $scope.$apply();
            }
        });
    }

});
