/**
 * Created by chief on 24/05/2017.
 */
angular
    .module('core.lines')
    .service('LineService', ['LinesInfo', 'SubwayRoutes', 'BusRoutes', 'TramRoutes',
        function (LinesInfo, SubwayRoutes, BusRoutes, TramRoutes) {

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

            this.getLineMarkers = function (lineName) {
                var markers = [];
                var stops = this.getLineStops(lineName);

                for (var i = 0; i < stops.length; i++) {
                    var marker = {
                        lat: 0,
                        lng: 0,
                        message: ""
                    };
                    marker.lat = stops[i].latLng[0];
                    marker.lng = stops[i].latLng[1];
                    marker.message = "id: "+ stops[i].id + "<br>";
                    marker.message += "name: "+stops[i].name +"<br>";
                    marker.message += "lines:<br>";
                    for (var j=0; j<stops[i].lines.length; j++) {
                        marker.message+="- <a href='#!/lines/"+stops[i].lines[j]+"'>"+stops[i].lines[j]+"</a><br>";
                    }
                    // markers.message+=" - ";
                    // markers.message+= stops[i].name;
                    markers.push(marker);
                }
                return markers;
            };

            this.getLineRoutes = function (lineName) {

                var geoJson = {};
                geoJson.style = {
                    weight: 3,
                    opacity: 1,
                    color: 'blue'
                };

                var featureCollection = {};
                featureCollection.type = "FeatureCollection";
                featureCollection.features = [];

                //find all the routes covered by the specified line
                for(var i = 0; i < SubwayRoutes.features.length; i++){
                    var feature = SubwayRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        featureCollection.features.push(feature);
                    }
                }

                for(var i = 0; i < BusRoutes.features.length; i++){
                    var feature = BusRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        featureCollection.features.push(feature);
                    }
                }

                for(var i = 0; i < TramRoutes.features.length; i++){
                    var feature = TramRoutes.features[i];
                    if(feature.properties.ref === lineName){
                        featureCollection.features.push(feature);
                    }
                }

                geoJson.data = featureCollection;

                return geoJson;
            }

    }]);
