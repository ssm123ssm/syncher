$(function () {
    console.log("works");

});

var app = angular.module('myApp', []);
app.controller('ctrl', function ($scope) {
    $scope.status = "On";
});
