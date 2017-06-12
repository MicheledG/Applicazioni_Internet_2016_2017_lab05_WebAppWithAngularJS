/**
 * Created by chief on 24/05/2017.
 */
angular
    .module('core.lines')
    .service('LineService', ['LinesInfo', 'SubwayRoutes', 'BusRoutes', 'TramRoutes', '$http', '$q',
        function (LinesInfo, SubwayRoutes, BusRoutes, TramRoutes, $http, $q) {

            this.getLineSnippetsRemote = function () {
                //async action => return a promise
                return $http({
                    method:'GET',
                    url:'http://localhost:8080/lines'
                });
            };

            this.getLineDescriptionsRemote = function (lineSnippets){
                //sync actions => returns an array of promises not resolved yet
                var lineDescriptions = [];
                lineSnippets.data.forEach(function(lineSnippet){
                    var lineDescription = $http({
                        method:'GET',
                        url:'http://localhost:8080/lines/'+lineSnippet.line+'?description=true'
                    });
                    lineDescriptions.push(lineDescription);
                });
                /*
                    return a single promise with all the promises created above.
                    the returned promise is resolved when all the promises are resolved!
                 */
                return $q.all(lineDescriptions);

            };

            this.handleLineDescriptions = function (lineDescriptions) {
                //transform the received data to be compliant with the data used in the Angular app
                var lineDescriptionsToReturn = [];
                lineDescriptions.forEach(function(lineDescription){
                    var lineDescriptionToReturn = {};
                    lineDescriptionToReturn.name = lineDescription.data.line;
                    lineDescriptionToReturn.description = lineDescription.data.description;
                    lineDescriptionsToReturn.push(lineDescriptionToReturn);
                });
                return lineDescriptionsToReturn;
            };

            this.getLinesRemote = function(){
                return this.getLineSnippetsRemote()
                    .then(this.getLineDescriptionsRemote)
                    .then(this.handleLineDescriptions)
                    .then(function(result){
                        console.log("Result: "+result);
                        return result;
                    })
                    .catch(function(error){
                        console.log("error :"+error);
                        return error;
                    });
            };

            this.getLineGeoJsonRemote = function(lineName){

            };

            this.getLines = function () {
                var lines = [];
                for (var i in LinesInfo.lines) {
                    var line = {};
                    line.name = LinesInfo.lines[i].line;
                    line.description = LinesInfo.lines[i].desc;
                    line.stops = LinesInfo.lines[i].stops;
                    lines.push(line);
                }

                console.log(lines);

                return lines;
            };

            this.getLine = function (lineName) {

                var lines = this.getLines();
                var line;
                for(var i = 0; i < lines.length; i++){
                    line = lines[i];
                    if(line.name === lineName) {
                        return line;
                    }
                }
                return null;
            }

            this.getStops = function(){
                return LinesInfo.stops;
            }

            this.getStop = function (stopId) {

                var stops = this.getStops();
                var stop;
                for(var i = 0; i < stops.length; i++){
                    stop = stops[i];
                    if(stop.id=== stopId) {
                        return stop;
                    }
                }
                return null;
            }

            this.getLineStops = function(lineName){

                var line = this.getLine(lineName);
                var stops = [];
                for(i = 0; i < line.stops.length; i++){
                    var stopId = line.stops[i];
                    var stop = this.getStop(stopId);
                    stops.push(stop);
                }

                return stops;
            }

            this.getLineRoute = function (lineName) {

                var geoJson = {};
                
                geoJson.type = "FeatureCollection";
                geoJson.features = [];

                //find all the routes covered by the specified line
                for(var i = 0; i < SubwayRoutes.features.length; i++){
                    var feature = SubwayRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        geoJson.features.push(feature);
                    }
                }

                for(i = 0; i < BusRoutes.features.length; i++){
                    var feature = BusRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        geoJson.features.push(feature);
                    }
                }

                for(i = 0; i < TramRoutes.features.length; i++){
                    var feature = TramRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        geoJson.features.push(feature);
                    }
                }

                //find all the stops of the line
                var stops = this.getLineStops(lineName);

                for (i = 0; i < stops.length; i++) {
                    var feature = {};
                    feature.type = 'Feature';
                    feature.geometry = {};
                    feature.geometry.type = 'Point';
                    feature.geometry.coordinates = [
                        stops[i].latLng[1], //lng
                        stops[i].latLng[0]  //lat
                    ];
                    feature.properties = {};
                    feature.properties.id = stops[i].id;
                    feature.properties.name = stops[i].name;
                    feature.properties.sequenceNumber = i+1;
                    feature.properties.lines = [];
                    for (var j=0; j<stops[i].lines.length; j++) {
                        feature.properties.lines.push(stops[i].lines[j]);
                    }
                    geoJson.features.push(feature);
                }

                return geoJson;
            }

    }]);
