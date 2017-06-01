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
                    //distinguish the possible popup
                    if(feature.geometry.type === 'Point'){
                        if(feature.properties){
                            var properties = feature.properties;
                            if(properties.first){
                                popupContent = "Starting point!"
                            }
                            else if(properties.last){
                                popupContent = "Arriving point!"
                            }
                        }
                    }
                    else if(feature.geometry.type == 'LineString'){
                        if(feature.properties){
                            var properties = feature.properties;
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

                //handle the data to show in the details table
                self.routeDetailHeaders = ['from', 'to', 'description'];
                self.routeDetails = [];

                for(var i = 0; i < self.routeGeoJson.data.features.length; i++){
                    var routeDetail = [];
                    var routeFeature = self.routeGeoJson.data.features[i];
                    if(routeFeature.geometry.type == 'LineString'){
                        if(routeFeature.properties){
                            var properties = routeFeature.properties;
                            routeDetail.push(properties.from);
                            routeDetail.push(properties.to);
                            var description;
                            if(properties.type === 'foot'){
                                description = "Walk for "+properties.distance+"m";
                            }
                            else{
                                description = "Take line "+properties.line;
                                description += " for "+properties.stops+"stops";
                            }
                            routeDetail.push(description);
                        }
                    }
                    self.routeDetails.push(routeDetail);
                }

                //self.mapCenter = {};
                //compute the northeast and the southwest bounds of the map
                // var northeastBound;
                // var southwestBound;
                // var tmpNorthBound = [-90.0, 180.0];
                // var tmpSouthBound = [90.0, -180.0];
                // for(var i = 0; i < self.markers.length; i++){
                //     var lat = self.markers[i].lat;
                //     var lng = self.markers[i].lng;
                //     if(lat > tmpNorthBound[0]){
                //         tmpNorthBound[0] = lat;
                //     }
                //     if(lng < tmpNorthBound[1]){
                //         tmpNorthBound[1] = lng;
                //     }
                //     if(lat < tmpSouthBound[0]){
                //         tmpSouthBound[0] = lat;
                //     }
                //     if(lng > tmpSouthBound[1]){
                //         tmpSouthBound[1] = lng;
                //     }
                // }
                //
                // northeastBound= tmpNorthBound;
                // southwestBound = tmpSouthBound;

                // self.bounds = leafletBoundsHelpers.createBoundsFromArray([
                //     northeastBound,
                //     southwestBound
                // ]);
            }
        };
    }
]);

