/**
 * Created by chief on 29/05/2017.
 */
var app = angular.module('App', ['ngRoute', 'ngResource', 'core.routes', 'core.geoJson' ,'linesList', 'detailsTable', 'ui-leaflet']);

/*
    Handle "/lines and "/lines/:lineName" views
    1) "/lines" => show the list of the lines and the map centered on Turin (clear unused objects);
    2) "/lines/:lineName" => show on map the route of the selected line and in a table below the details of each
    line stop
 */
app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService', 'leafletBoundsHelpers', 'GeoJsonHelper',
        function ($scope, $routeParams, $location, LineService, leafletBoundsHelpers, GeoJsonHelper) {

            var self = this;
            /*
                1) handle generic "/lines" view
             */
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

            /*
                2) handle specific "lines/:lineName" view
             */
            self.line = LineService.getLine($routeParams.lineName);
            if(self.line){
                self.selectedLineName = self.line.name;

                /*
                    handle data to show on the map
                 */
                self.lineRoute = {};
                self.lineRoute.data = {};
                LineService.getLineGeoJsonRemote(self.line.name)
                    .then(function(geoJson){
                        self.lineRoute.data = geoJson;
                    });
                self.lineRoute.style = {
                    color: 'blue',
                    weight: 2
                };
                // self.lineRoute.onEachFeature = function(feature, layer){
                //     var popupContent = null;
                //     var properties;
                //     //distinguish the possible popup
                //     if(feature.geometry.type === 'Point'){
                //         if(feature.properties){
                //             properties = feature.properties;
                //             popupContent = "name: "+properties.name+"<br>";
                //             popupContent += "id: "+properties.id+"<br>";
                //             popupContent += "lines:<br>";
                //             for(var i = 0; i < properties.lines.length; i++){
                //                 var lineName = properties.lines[i];
                //                 popupContent += "- <a href='#!/lines/"+lineName+"'>"+lineName+"</a><br>"
                //             }
                //         }
                //     }
                //
                //     //if a popup content has been defined -> apply!
                //     if(popupContent){
                //         layer.bindPopup(popupContent);
                //     }
                // };
                self.mapCenter = {};
                //self.bounds = GeoJsonHelper.computeGeoJsonBounds(self.lineRoute.data);

                /*
                    handle data to show in the details table
                 */
                //var stops = LineService.getLineStops(self.line.name);
                self.lineDetailHeaders = ['nr.', 'id', 'name'];
                self.lineDetails = [];
                LineService.getLineStopsRemote(self.line.name)
                    .then(function(stops){
                        stops.forEach(function(stop) {
                            var lineDetail = [];
                            lineDetail.push(stop.sequenceNumber);
                            lineDetail.push(stop.id);
                            lineDetail.push(stop.name);
                            self.lineDetails.push(lineDetail);
                        });
                    });

            } else if($routeParams.lineName){
                //there is a line name in the url but it is incorrect => redirect
                $location.path('/lines');
            }
        }
]);


/*
    Handle "/computeRoute and "/computeRoute/:fromAddress/:toAddress" views
    1) "/computeRoute" => show the form to insert the source and the destination address of the route to compute;
    2) "/computeRoute/:fromAddress/:toAddress" => show on map the computed route between the source and the destination address;
 */
app.controller('RouteCtrl', ['LineService', 'RouteService','leafletBoundsHelpers','GeoJsonHelper','$location', '$routeParams',
    function (LineService, RouteService, leafletBoundsHelpers, GeoJsonHelper, $location, $routeParams) {

        var self = this;

        /*
            1) Handle "/computeRoute" view
         */
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
            $location.path('/computeRoute');
        };

        self.computeRoute = function() {
            if (self.fromAddress !== '' && self.toAddress !== '') {
                var fromAddress = encodeURIComponent(self.fromAddress);
                var toAddress = encodeURIComponent(self.toAddress);
                $location.path('/computeRoute/' + fromAddress + '/' + toAddress);
            }
        };

        /*
            2) Handle "/computeRoute/:fromAddress/:toAddress" view
         */
        if($routeParams.fromAddress && $routeParams.toAddress){

            self.fromAddress = decodeURIComponent($routeParams.fromAddress);
            self.toAddress = decodeURIComponent($routeParams.toAddress);

            /*
                handle the data to show on the map
             */
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


            self.mapCenter = {};
            self.bounds = GeoJsonHelper.computeGeoJsonBounds(self.routeGeoJson.data);

            /*
                handle the data to show in the details table
             */
            self.routeDetailHeaders = ['from', 'to', 'description'];
            self.routeDetails = [];
            var routeFeatures = self.routeGeoJson.data.features;
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
            for(var i = 0; i < routeFeatures.length; i++){
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

            //remove the latitude and the longitude of the first and the last route detail in the showed table
            //YES, I KNOW: IT'S A MESS -> NEEDS TO CHANGE DETAILS FROM ARRAYS TO OBJECTS
            self.routeDetails[0][0] = self.fromAddress; //this change "from" information of first detail
            self.routeDetails[self.routeDetails.length-1][1] = self.toAddress; //this change "to" information of last detail
        }
    }
]);