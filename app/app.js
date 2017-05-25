var app = angular.module('App', ['ngRoute', 'ngResource', 'linesList'])

app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'main.html',
            controller: 'MainCtrl',
            controllerAs: 'ctrl'
        })
        .otherwise({ redirectTo: "/" });

    // configure html5 to get links working on jsfiddle
    // $locationProvider.html5Mode(true);
});

app.controller('MainCtrl', function () {
    var self = this;
    self.selectedLine = '';
    self.setSelectedLine = function(lineName){
        self.selectedLine = lineName;
    }
});

app.directive('myDirective', function () {
    /*
  return {
  };
  */
});


