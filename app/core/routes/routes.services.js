/**
 * Created by chief on 01/06/2017.
 */
angular
    .module('core.routes')
    .service('RouteService', ['$http', '$q',
        function ($http, $q) {

            var self = this;
            var API_KEY = "AIzaSyCm6hrZsb60Vs2Qve5CZg-2CGTa_cCpGd0";

            /*
                PRIVATE FUNCTIONS
             */
            function translateAddressToLatLng (address){

                var encodedAddress = encodeURIComponent(address);
                var queryString =  "https://maps.googleapis.com/maps/api/geocode/json?";
                queryString += "address="+encodedAddress+"&";
                queryString += "key="+API_KEY;

                return $http.get(queryString)
                    .then(function (response) {
                        var googleCoordinates = response.data.results[0].geometry.location;
                        return [googleCoordinates.lat, googleCoordinates.lng];
                    })
                    .catch(function (response) {
                        console.log("error code: "+response.status);
                        console.log("error: "+response.statusText);
                    });
            }

            function getRouteGeoJsonRemote (fromLat, fromLng, toLat, toLng){

                var queryString =  "http://localhost:8080/route?";
                queryString += "fromLat="+fromLat+"&";
                queryString += "fromLng="+fromLng+"&";
                queryString += "toLat="+toLat+"&";
                queryString += "toLng="+toLng+"&";
                queryString += "geoJson=true";

                return $http.get(queryString)
                    .then(function (response) {
                        var geoJson = response.data.geoJson;
                        console.log("geoJson:"+geoJson);
                        return geoJson;
                    })
                    .catch(function (response) {
                        console.log("error code: "+response.status);
                        console.log("error: "+response.statusText);
                    });

            }

            /*
                EXPOSED API
             */
            self.getRouteGeoJson = function (fromAddress, toAddress) {

                var coordinatePromises = [];
                coordinatePromises.push(translateAddressToLatLng(fromAddress));
                coordinatePromises.push(translateAddressToLatLng(toAddress));

                return $q.all(coordinatePromises)
                    .then(function (coordinates) {
                        var fromCoordinate = coordinates[0];
                        var fromLat = fromCoordinate[0];
                        var fromLng = fromCoordinate[1];
                        var toCoordinate = coordinates[1];
                        var toLat = toCoordinate[0];
                        var toLng = toCoordinate[1];

                        return getRouteGeoJsonRemote(fromLat, fromLng, toLat, toLng);
                    })
                    .catch(function (error) {
                        console.log("error: "+error);
                    });

            };

        }]);
