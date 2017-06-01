/**
 * Created by chief on 29/05/2017.
 */
var app = angular.module('App', ['ngRoute', 'ngResource', 'core.routes' ,'linesList', 'detailsTable', 'ui-leaflet']);

/*
    Handle lines and lines/:lineName views
    1) lines/ => show the list of the lines and the map centered on Turin (clear unused objects);
    2) lines/:lineName => show on map the route of the selected line and in a table below the details of each
    line stop
 */
app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService', 'leafletBoundsHelpers',
        function ($scope, $routeParams, $location, LineService, leafletBoundsHelpers) {

            var self = this;
            //1) handle generic lines/ view
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

            //2) handle lines/:lineName view
            self.line = LineService.getLine($routeParams.lineName);
            if(self.line){
                self.selectedLineName = self.line.name;
                var stops = LineService.getLineStops(self.line.name);
                self.lineDetailHeaders = ['nr.', 'id', 'name'];
                self.lineDetails = [];
                //set sequence number of each stop
                for(var i = 0; i < stops.length; i++){
                    var lineDetail = [];
                    lineDetail.push(i+1);
                    lineDetail.push(stops[i].id);
                    lineDetail.push(stops[i].name);
                    self.lineDetails.push(lineDetail);
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


/*
    Handle computeRoute view
 */
app.controller('RouteCtrl', ['LineService', 'RouteService','leafletBoundsHelpers',
    function (LineService, RouteService, leafletBoundsHelpers) {

        var self = this;
        self.fromAddress = '';
        self.toAddress = '';
        self.mapCenter = {
            lat: 45.06,
            lng: 7.68,
            zoom: 13
        };

        self.resetRoute = function(){
            self.fromAddress = '';
            self.toAddress = '';
            self.markers = null;
            self.routeGeoJson = null;
            self.routeDetails = null;
            self.bounds = null;
        };

        self.computeRoute = function(){
            if(self.fromAddress !== '' && self.toAddress !== ''){

                //handle the data to show on the map
                self.routeGeoJson = {};
                self.routeGeoJson.data = RouteService.getMinRoute(self.fromAddress, self.toAddress);
                self.routeGeoJson.style = function(feature){
                  if(feature.geometry.type === 'LineString') {
                      if (feature.properties.type === 'foot') {
                          return {
                              color: "red"
                          }
                      }
                  }
                };
                self.routeGeoJson.onEachFeature = function(feature, layer){
                    var popupContent = null;
                    var properties;
                    //distinguish the possible popup
                    if(feature.geometry.type === 'Point'){
                        if(feature.properties){
                            properties = feature.properties;
                            if(properties.first){
                                popupContent = "Starting point!"
                            }
                            else if(properties.last){
                                popupContent = "Arriving point!"
                            }
                        }
                    }
                    else if(feature.geometry.type === 'LineString'){
                        if(feature.properties){
                            properties = feature.properties;
                            if(properties.type === 'foot'){
                                popupContent = "Walk for "+properties.distance+"m";
                            }
                            else{
                                popupContent = "Line: "+properties.line+"<br>";
                                popupContent += "Number of stops: "+properties.stops;
                            }
                        }
                    }

                    //if a popup content has been defined -> apply!
                    if(popupContent){
                        layer.bindPopup(popupContent);
                    }
                };

                //compute the northeast and the southwest bounds of the map
                var northeastBound;
                var southwestBound;
                var tmpNorthBound = [-90.0, 180.0];
                var tmpSouthBound = [90.0, -180.0];

                //gather all the coordinates of the geojson
                var routeFeatures = self.routeGeoJson.data.features;
                var allRouteGeoJsonCoordinates = [];
                for(var i = 0; i < routeFeatures.length; i++){
                    var geometry = routeFeatures[i].geometry;
                    if(geometry.type === 'LineString'){
                        for (var j = 0; j < geometry.coordinates.length; j++){
                            allRouteGeoJsonCoordinates.push(geometry.coordinates[j]);
                        }
                    }
                }

                //analyze all the coordinates
                for(i = 0; i < allRouteGeoJsonCoordinates.length; i++){
                    var lat = allRouteGeoJsonCoordinates[i][1]; //latitude
                    var lng = allRouteGeoJsonCoordinates[i][0]; //longitude
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

                self.mapCenter = {};
                self.bounds = leafletBoundsHelpers.createBoundsFromArray([
                    northeastBound,
                    southwestBound
                ]);

                //handle the data to show in the details table
                self.routeDetailHeaders = ['from', 'to', 'description'];
                self.routeDetails = [];

                routeFeatures.sort(function(a, b){
                    var sequenceNumberA = a.properties.sequenceNumber;
                    var sequenceNumberB = b.properties.sequenceNumber;
                    if(sequenceNumberA < sequenceNumberB){
                        return -1;
                    }
                    else if(sequenceNumberA === sequenceNumberB){
                        return 0;
                    }
                    else{
                        return 1;
                    }
                });

                for(i = 0; i < routeFeatures.length; i++){
                    var routeFeature = routeFeatures[i];
                    if(routeFeature.geometry.type === 'LineString'){
                        var routeDetail = [];
                        if(routeFeature.properties){
                            var properties = routeFeature.properties;
                            //add the "from" data -> first information of the detail
                            routeDetail.push(properties.from);
                            //add the "to" data -> second information of the detail
                            routeDetail.push(properties.to);
                            var description;
                            if(properties.type === 'foot'){
                                description = "Walk for "+properties.distance+"m";
                            }
                            else{
                                description = "Take line "+properties.line;
                                description += " for "+properties.stops+"stops";
                            }
                            //add the "description" data -> third information of the detail
                            routeDetail.push(description);
                        }
                        self.routeDetails.push(routeDetail);
                    }
                }

                //remove the latitude and the longitude of the first and the last route detail to show
                //YES, I KNOW: IT'S A MESS -> NEEDS TO CHANGE DETAILS FROM ARRAYS TO OBJECTS
                self.routeDetails[0][0] = self.fromAddress; //this change "from" information of first detail
                self.routeDetails[self.routeDetails.length-1][1] = self.toAddress; //this change "to" information of last detail
            }
        };
    }
]);

