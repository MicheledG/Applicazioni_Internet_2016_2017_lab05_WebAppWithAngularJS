/**
 * Created by chief on 24/05/2017.
 */
angular
    .module('linesList')
    .component('linesList', {
        templateUrl: 'lines-list/lines-list.template.html',
        controller: ['LineService',
            function (LineService) {
                var self = this;
                self.lines = [];
                LineService.getLinesRemote()
                    .then(function(lineDescriptions){
                        self.lines = lineDescriptions;
                    });
                self.selectLine = function (lineName){
                    self.selectedLine = lineName;
                    self.onSelectedLine({lineName: lineName});
                    //console.log(LineService.getLineStops(lineName));
                };
            }
        ],
        bindings:{
            selectedLine:'<',
            onSelectedLine:'&'
        }
    });