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

app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService', 'leafletBoundsHelpers',
        function ($scope, $routeParams, $location, LineService, leafletBoundsHelpers) {

            var self = this;

            self.line = LineService.getLine($routeParams.lineName);
            //check if the choosen line exists
            if (self.line) {

                var stops = LineService.getLineStops(self.line.name);
                self.stopsToShow = [];
                //set sequence number of each stop
                for(var i = 0; i < stops.length; i++){
                    var stopToShow = {};
                    stopToShow.sequenceNumber = i +1;
                    stopToShow.stop = stops[i];
                    self.stopsToShow.push(stopToShow);
                }


                self.mapCenter = {};/*{
                    lat: 45.06,
                    lng: 7.68,
                    zoom: 13
                }*/
                self.markers = LineService.getLineMarkers(self.line.name); //since the parent is the owner of the map
                self.routes = LineService.getLineRoutes(self.line.name);

                //compute the northeast and the southwest bounds of the map
                var northeastBound;
                var southwestBound;
                var tmpNorthBound = [-90.0, 180.0];
                var tmpSouthBound = [90.0, -180.0];
                for(var i = 0; i < self.markers.length; i++){
                    var lat = self.markers[i].lat;
                    var lng = self.markers[i].lng;
                    if(lat > tmpNorthBound[0]){
                        tmpNorthBound[0] = lat;
                    }
                    if(lng < tmpNorthBound[1]){
                        tmpNorthBound[1] = lng;
                    }
                    if(lat < tmpSouthBound[0]){
                        tmpSouthBound[0] = lat;
                    }
                    if(lng > tmpSouthBound[1]){
                        tmpSouthBound[1] = lng;
                    }
                }

                northeastBound= tmpNorthBound;
                southwestBound = tmpSouthBound;

                self.bounds = leafletBoundsHelpers.createBoundsFromArray([
                        northeastBound,
                        southwestBound
                    ]);

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