/**
 * Created by chief on 02/06/2017.
 */
angular.module('core.geoJson')
    .service('GeoJsonHelper', [
        'leafletBoundsHelpers',
        function(leafletBoundsHelpers){
            /*
                right now this function compute leaflet bounds only on:
                - Point
                - LineString
             */
            this.computeGeoJsonBounds = function(geoJson){

                var northeastBound;
                var southwestBound;
                var tmpNorthBound = [-90.0, 180.0];
                var tmpSouthBound = [90.0, -180.0];

                //gather all the coordinates of the geojson
                var geoJsonFeatures = geoJson.features;
                var allGeoJsonCoordinates = [];
                for(var i = 0; i < geoJsonFeatures.length; i++){
                    var geometry = geoJsonFeatures[i].geometry;
                    if(geometry.type === 'LineString'){
                        for (var j = 0; j < geometry.coordinates.length; j++){
                            allGeoJsonCoordinates.push(geometry.coordinates[j]);
                        }
                    }
                    else if(geometry.type === 'Point'){
                        var coordinate = [];
                        coordinate.push(geometry.coordinates[0]);
                        coordinate.push(geometry.coordinates[1]);
                        allGeoJsonCoordinates.push(coordinate);
                    }
                }

                //analyze all the coordinates
                for(i = 0; i < allGeoJsonCoordinates.length; i++){
                    var lat = allGeoJsonCoordinates[i][1]; //latitude
                    var lng = allGeoJsonCoordinates[i][0]; //longitude
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

                northeastBound = tmpNorthBound;
                southwestBound = tmpSouthBound;

                return leafletBoundsHelpers.createBoundsFromArray([
                    northeastBound,
                    southwestBound
                ]);
            }
        }
    ]);