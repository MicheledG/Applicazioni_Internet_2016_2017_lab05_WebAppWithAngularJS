/**
 * Created by chief on 29/05/2017.
 */
var app = angular.module('App', ['ngRoute', 'ngResource', 'linesList', 'ui-leaflet']);

app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService', 'leafletBoundsHelpers',
        function ($scope, $routeParams, $location, LineService, leafletBoundsHelpers) {

            var self = this;
            self.selectedLineName = '';
            self.setSelectedLineName = function(lineName){
                self.selectedLineName = lineName;
                $location.path('/lines/'+lineName);
            };

            self.mapCenter = {
                lat: 45.06,
                lng: 7.68,
                zoom: 13
            };

            self.line = LineService.getLine($routeParams.lineName);
            if(self.line){
                self.selectedLineName = self.line.name;
                var stops = LineService.getLineStops(self.line.name);
                self.stopsToShow = [];
                //set sequence number of each stop
                for(var i = 0; i < stops.length; i++){
                    var stopToShow = {};
                    stopToShow.sequenceNumber = i +1;
                    stopToShow.stop = stops[i];
                    self.stopsToShow.push(stopToShow);
                }
                self.mapCenter = {};
                self.markers = LineService.getLineMarkers(self.line.name); //since the parent is the owner of the map
                self.routes = LineService.getLineRoutes(self.line.name);

                //compute the northeast and the southwest bounds of the map
                var northeastBound;
                var southwestBound;
                var tmpNorthBound = [-90.0, 180.0];
                var tmpSouthBound = [90.0, -180.0];
                for(i = 0; i < self.markers.length; i++){
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
            } else if($routeParams.lineName){
                //there is a line name in the url but it is incorrect => redirect
                $location.path('/lines');
            }
        }
]);

app.controller('RouteCtrl', ['LineService', 'leafletBoundsHelpers',
    function (LineService, leafletBoundsHelpers) {

        var self = this;
        self.startAddress = '';
        self.arriveAddress = '';
        self.mapCenter = {
            lat: 45.06,
            lng: 7.68,
            zoom: 13
        };

        self.resetRoute = function(){
            self.startAddress = '';
            self.arriveAddress = '';
            self.markers = null;
            self.routeGeoJson = null;
            self.routeDetails = null;
            self.bounds = null;
        };
        self.computeRoute = function(){
            if(self.startAddress !== '' && self.arriveAddress !== ''){
                self.markers = LineService.getLineMarkers('METRO');
                self.routeGeoJson = LineService.getLineRoutes('METRO');
                self.routeDetails = [];

                var firstRouteDetail = {};
                firstRouteDetail.from =  self.startAddress.toUpperCase();
                firstRouteDetail.to = 'Lat: ' + self.markers[0].lat + ' - Lng: ' + self.markers[0].lng;
                firstRouteDetail.description = 'reach the first stop';
                self.routeDetails.push(firstRouteDetail);

                var middleRouteDetail = {};
                middleRouteDetail.from = 'Lat: ' + self.markers[0].lat + ' - Lng: ' + self.markers[0].lng;
                middleRouteDetail.to =  'Lat: ' + self.markers[self.markers.length-1].lat + ' - Lng: ' + self.markers[self.markers.length-1].lng;
                middleRouteDetail.description = 'Take line METRO for 21 stops';
                self.routeDetails.push(middleRouteDetail);

                var lastRouteDetail = {};
                lastRouteDetail.from =  'Lat: ' + self.markers[self.markers.length-1].lat + ' - Lng: ' + self.markers[self.markers.length-1].lng;
                lastRouteDetail.to = self.arriveAddress.toUpperCase();
                lastRouteDetail.description = 'reach the arrive point';
                self.routeDetails.push(lastRouteDetail);

                self.mapCenter = {};

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
            }
        };
    }
]);

