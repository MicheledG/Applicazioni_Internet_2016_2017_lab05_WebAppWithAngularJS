/**
 * Created by chief on 24/05/2017.
 */
angular
    .module('linesList')
    .component('linesList', {
        templateUrl: 'lines-list/lines-list.template.html',
        controller: ['DataProvider',
            function (DataProvider) {
                var self = this;
                self.selectedLine = '';
                self.lines = DataProvider;
                self.selectLine = function (lineName){
                    self.selectedLine = lineName;
                    self.onSelectedLine({lineName: lineName});
                }
            }
        ],
        bindings:{
            onSelectedLine:'&'
        }
    });