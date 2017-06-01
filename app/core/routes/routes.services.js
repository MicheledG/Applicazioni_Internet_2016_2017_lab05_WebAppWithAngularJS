/**
 * Created by chief on 01/06/2017.
 */
angular
    .module('core.routes')
    .service('RouteService', ['LinesInfo', 'SubwayRoutes', 'BusRoutes', 'TramRoutes',
        function (LinesInfo, SubwayRoutes, BusRoutes, TramRoutes) {

            var self = this;
            self.i = 0;
            self.translateAddressToLAtLng = function(address){
                /*
                    dumb implementation
                 */
                var coordinate = {};
                if(self.i === 0){
                    //from point -> fermi
                    coordinate.lat = 45.076772;
                    coordinate.lng = 7.587581;
                    self.i = 1;
                }
                else{
                    //to point -> lingotto
                    coordinate.lat = 45.027018;
                    coordinate.lng = 7.665261;
                    self.i = 0;
                }
                return coordinate;
            };

            self.getMinRouteFromRemoteService = function(fromLat, fromLng, toLat, toLng){
                /*
                    NO REMOTE INTERACTION
                 */

                /*
                 create an ad-hoc GeoJson with the following features:
                 - the marker at the fromPoint
                 - the line from the fromPoint to the first stop
                 - the line METRO from Fermi to Lingotto
                 - the line from the last stop to the to the toPoint
                 - the marker at the toPoint
                 */

                var geoJson = {};
                geoJson.type = 'FeatureCollection';
                geoJson.features = [];
                //insert the fromPoint marker
                var featureFromPoint = {
                    type: "Feature",
                    properties: {
                        sequenceNumber: 1,
                        first: true
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [
                            fromLng,
                            fromLat
                        ]
                    }
                };
                geoJson.features.push(featureFromPoint);

                //insert the line from fromPoint to METRO
                var featureFromPointToLine = {
                    type: "Feature",
                    properties: {
                        sequenceNumber: 2,
                        type: "foot",
                        from: "Lat: "+fromLat+" - Lng: "+fromLng,
                        to: "FERMI",
                        distance: 150 //in meter
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [
                                fromLng,
                                fromLat
                            ],
                            [
                                7.5911782,
                                45.0760004
                            ]
                        ]
                    }
                };
                geoJson.features.push(featureFromPointToLine);

                //insert the line METRO from Fermi to Lingotto
                var featureMetroLine = SubwayRoutes.features[0];
                featureMetroLine.properties.sequenceNumber = 3;
                featureMetroLine.properties.line = "METRO";
                featureMetroLine.properties.stops = 21;
                geoJson.features.push(featureMetroLine);

                //insert the line from the METRO to the toPoint
                var featureLineToToPoint = {
                    type: "Feature",
                    properties: {
                        sequenceNumber: 4,
                        type: "foot",
                        from: "LINGOTTO",
                        to: "Lat: "+toLat+" - Lng: "+toLng,
                        distance: 200 //in meter
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [
                                toLng,
                                toLat
                            ],
                            [
                                7.6668751,
                                45.03135
                            ]
                        ]
                    }
                };
                geoJson.features.push(featureLineToToPoint);

                //insert the marker at toPoint
                var featureToPoint = {
                    type: "Feature",
                    properties: {
                        sequenceNumber: 5,
                        last: true
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [
                            toLng,
                            toLat
                        ]
                    }
                };
                geoJson.features.push(featureToPoint);

                return geoJson;
            };

            self.getMinRoute = function (fromAddress, toAddress) {

                var fromCoordinate = self.translateAddressToLAtLng(fromAddress);
                var toCoordinate = self.translateAddressToLAtLng(toAddress);
                var routeGeoJson = self.getMinRouteFromRemoteService(
                    fromCoordinate.lat,
                    fromCoordinate.lng,
                    toCoordinate.lat,
                    toCoordinate.lng
                );

                return routeGeoJson;
            };

        }]);
