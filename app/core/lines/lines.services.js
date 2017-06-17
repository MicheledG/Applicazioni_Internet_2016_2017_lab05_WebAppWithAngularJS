/**
 * Created by chief on 24/05/2017.
 */
angular
    .module('core.lines')
    .service('LineService', ['$http', '$q',
        function ($http, $q) {

            var self = this;

            /*
                PRIVATE FUNCTIONS
             */
            function getLineSnippetsRemote() {
                //async action => return a promise
                return $http({
                    method:'GET',
                    url:'http://localhost:8080/lines',
                    cache:true
                });
            }

            function getLineDescriptionRemote(lineName){
                //async action => return a promise
                return $http({
                    method:'GET',
                    url:'http://localhost:8080/lines/'+lineName+'?description=true',
                    cache: true
                });
            }

            function getLineDescriptionsRemote (lineSnippets){
                //sync actions => returns an array of promises not resolved yet
                var lineDescriptions = [];
                lineSnippets.data.forEach(function(lineSnippet){
                    var lineDescription = getLineDescriptionRemote(lineSnippet.line);
                    lineDescriptions.push(lineDescription);
                });
                /*
                    return a single promise with all the promises created above.
                    the returned promise is resolved when all the promises are resolved!
                 */
                return $q.all(lineDescriptions);
            }

            function handleLineDescriptions (lineDescriptions) {
                //transform the received data to be compliant with the data used in the Angular app
                var lineDescriptionsToReturn = [];
                lineDescriptions.forEach(function(lineDescription){
                    var lineDescriptionToReturn = {};
                    lineDescriptionToReturn.name = lineDescription.data.line;
                    lineDescriptionToReturn.description = lineDescription.data.description;
                    lineDescriptionsToReturn.push(lineDescriptionToReturn);
                });
                return lineDescriptionsToReturn;
            }

            /*
                EXPOSED API
             */

            self.existLine = function(lineName){
                return getLineDescriptionRemote(lineName)
                    .then(function(){
                        return true;
                    })
                    .catch(function(response){
                        console.log("error code: "+response.status);
                        console.log("error: "+response.statusText);
                        return false;
                    });
            };

            self.getLinesRemote = function(){
                return getLineSnippetsRemote()
                    .then(getLineDescriptionsRemote)
                    .then(handleLineDescriptions)
                    .catch(function(error){
                        console.log("error :"+error);
                        return error;
                    });
            };

            self.getLineGeoJsonRemote = function(lineName){
                return $http({
                    method:'GET',
                    url:'http://localhost:8080/lines/'+lineName+'?geoJson=true',
                    cache: true
                }).then(function (response) {
                    return response.data.geoJson;
                }).catch(function (error) {
                    console.log("error : "+error);
                    return error;
                });
            };

            self.getLineStopsRemote = function(lineName){
                return $http({
                    method:'GET',
                    url:'http://localhost:8080/lines/'+lineName+'?stops=true',
                    cache: true
                }).then(function (response) {
                    return response.data.stops;
                }).catch(function (error) {
                    return error;
                });
            };

    }]);
