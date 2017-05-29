/**
 * Created by chief on 29/05/2017.
 */
var app = angular.module('App', ['ngRoute', 'ngResource', 'linesList', 'ui-leaflet']);

app.controller('MainCtrl',['$scope', '$routeParams','$location', function ($scope, $routeParams, $location) {
    var self = this;
    self.selectedLine = '';

    self.setSelectedLine = function(lineName){
        self.selectedLine = lineName;
        $location.path('/lines/'+lineName);
    }

    $scope.hookOnSelectedLine = function(lineName){
        self.selectedLine = lineName;
    }

}]);

app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService',
        function ($scope, $routeParams, $location, LineService) {
            var self = this;
            self.mapCenter = {
                lat: 45.06,
                lng: 7.68,
                zoom: 13
            }
            self.line = LineService.getLine($routeParams.lineName);
            //check if the choosen line exists
            if (self.line) {
                var stops = LineService.getLineStops(self.line.name);
                self.stopsToList = [];
                //make difference between stops
                for(var i = 0; i < stops.length; i++){
                    var stopToList = {};
                    stopToList.sequenceNumber = i +1;
                    stopToList.stop = stops[i];
                    self.stopsToList.push(stopToList);
                }
                self.markers = LineService.getLineMarkers(self.line.name); //since the parent is the owner of the map
                $scope.$parent.hookOnSelectedLine(self.line.name);   //to enlight (on the line list) the line which is showed in the map
            }else{
                $location.path('/lines');
            }
        }
]);

app.directive('myDirective', function () {
    /*
     return {
     };
     */
});