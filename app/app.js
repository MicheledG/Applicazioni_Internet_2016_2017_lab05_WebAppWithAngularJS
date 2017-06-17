/**
 * Created by chief on 29/05/2017.
 */
var app = angular.module('App', ['ngRoute', 'core.routes', 'core.geoJson' ,'linesList', 'detailsTable', 'ui-leaflet']);

/*
    Handle "/lines and "/lines/:lineName" views
    1) "/lines" => show the list of the lines and the map centered on Turin (clear unused objects);
    2) "/lines/:lineName" => show on map the route of the selected line and in a table below the details of each
    line stop
 */
app.controller('LineCtrl', ['$scope', '$routeParams', '$location', 'LineService', 'leafletBoundsHelpers', 'GeoJsonHelper', '$timeout',
        function ($scope, $routeParams, $location, LineService, leafletBoundsHelpers, GeoJsonHelper, $timeout) {

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
            var lineName = $routeParams.lineName;
            if(lineName !== undefined){
                LineService.existLine($routeParams.lineName)
                    .then(function(existLine) {
                        if(existLine){
                            self.selectedLineName = lineName;

                            /*
                             handle data to show on the map
                             */

                            self.lineRoute = {};
                            LineService.getLineGeoJsonRemote(lineName)
                                .then(function(geoJson){
                                    self.lineRoute.data = geoJson;
                                    /*
                                     bad workaround to let center the map on the geoJson
                                     on a cached geoJson.
                                     otherwise the map center object is seen after the bounds
                                     and leaflet goes crazy!
                                     */
                                    return $timeout(10);
                                })
                                .then(function(){
                                    self.bounds = GeoJsonHelper.computeGeoJsonBounds(self.lineRoute.data);
                                });

                            self.lineRoute.style = {
                                color: 'blue',
                                weight: 2
                            };

                            self.lineRoute.onEachFeature = function(feature, layer){
                                var popupContent = null;
                                var properties;
                                //distinguish the possible popup
                                if(feature.geometry.type === 'Point'){
                                    if(feature.properties){
                                        properties = feature.properties;
                                        popupContent = "name: "+properties.stopName+"<br>";
                                        popupContent += "id: "+properties.stopId+"<br>";
                                        popupContent += "lines:<br>";
                                        for(var i = 0; i < properties.lines.length; i++){
                                            var lineName = properties.lines[i];
                                            popupContent += "- <a href='#!/lines/"+lineName+"'>"+lineName+"</a><br>"
                                        }
                                    }
                                }

                                //if a popup content has been defined -> apply!
                                if(popupContent){
                                    layer.bindPopup(popupContent);
                                }
                            };

                            /*
                             handle data to show in the details table
                             */

                            self.lineDetailHeaders = ['nr.', 'id', 'name', 'lines'];
                            self.lineDetails = [];
                            LineService.getLineStopsRemote(lineName)
                                .then(function(stops){
                                    stops.forEach(function(stop) {
                                        var lineDetail = [];
                                        lineDetail.push(stop.sequenceNumber);
                                        lineDetail.push(stop.id);
                                        lineDetail.push(stop.name);
                                        var linesContent = '';
                                        stop.lines.forEach(function(line){
                                            //create the link to the line
                                            linesContent += '<a href="#!/lines/'+line+'">'+line+'</a> ';
                                        });
                                        lineDetail.push(linesContent);
                                        self.lineDetails.push(lineDetail);
                                    });
                                });

                        }
                        else {
                            //there is a line name in the url but it is incorrect => redirect
                            $location.path('/lines');
                        }
                    });
            }
        }
]);


/*
    Handle "/computeRoute and "/computeRoute/:fromAddress/:toAddress" views
    1) "/computeRoute" => show the form to insert the source and the destination address of the route to compute;
    2) "/computeRoute/:fromAddress/:toAddress" => show on map the computed route between the source and the destination address;
 */
app.controller('RouteCtrl', ['LineService', 'RouteService','leafletBoundsHelpers','GeoJsonHelper','$location', '$routeParams', '$timeout',
    function (LineService, RouteService, leafletBoundsHelpers, GeoJsonHelper, $location, $routeParams, $timeout) {

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
            RouteService.getRouteGeoJson(self.fromAddress, self.toAddress)
                .then( function(geoJson) {
                    self.routeGeoJson.data = geoJson;
                    /*
                     bad workaround to let center the map on the geoJson
                     on a cached geoJson.
                     otherwise the map center object is seen after the bounds
                     and leaflet goes crazy!
                     */
                    return $timeout(10);
                })
                .then(function(){
                    self.bounds = GeoJsonHelper.computeGeoJsonBounds(self.routeGeoJson.data);
                });

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
                        if(properties.sequenceNumber === 1){
                            popupContent = "Starting point!"
                        }
                        else {
                            popupContent = "Arriving point!"
                        }
                    }
                }
                else if(feature.geometry.type === 'LineString'){
                    if(feature.properties){
                        properties = feature.properties;
                        if(properties.type === 'foot'){
                            popupContent = "Walk for "+properties.length+"m";
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

            /*
                handle the data to show in the details table
             */
            // self.routeDetailHeaders = ['from', 'to', 'description'];
            // self.routeDetails = [];
            // var routeFeatures = self.routeGeoJson.data.features;
            // routeFeatures.sort(function(a, b){
            //     var sequenceNumberA = a.properties.sequenceNumber;
            //     var sequenceNumberB = b.properties.sequenceNumber;
            //     if(sequenceNumberA < sequenceNumberB){
            //         return -1;
            //     }
            //     else if(sequenceNumberA === sequenceNumberB){
            //         return 0;
            //     }
            //     else{
            //         return 1;
            //     }
            // });
            // for(var i = 0; i < routeFeatures.length; i++){
            //     var routeFeature = routeFeatures[i];
            //     if(routeFeature.geometry.type === 'LineString'){
            //         var routeDetail = [];
            //         if(routeFeature.properties){
            //             var properties = routeFeature.properties;
            //             //add the "from" data -> first information of the detail
            //             routeDetail.push(properties.from);
            //             //add the "to" data -> second information of the detail
            //             routeDetail.push(properties.to);
            //             var description;
            //             if(properties.type === 'foot'){
            //                 description = "Walk for "+properties.distance+"m";
            //             }
            //             else{
            //                 description = "Take line "+properties.line;
            //                 description += " for "+properties.stops+"stops";
            //             }
            //             //add the "description" data -> third information of the detail
            //             routeDetail.push(description);
            //         }
            //         self.routeDetails.push(routeDetail);
            //     }
            // }
            //
            // //remove the latitude and the longitude of the first and the last route detail in the showed table
            // //YES, I KNOW: IT'S A MESS -> NEEDS TO CHANGE DETAILS FROM ARRAYS TO OBJECTS
            // self.routeDetails[0][0] = self.fromAddress; //this change "from" information of first detail
            // self.routeDetails[self.routeDetails.length-1][1] = self.toAddress; //this change "to" information of last detail
        }
    }
]);