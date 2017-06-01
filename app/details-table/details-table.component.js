/**
 * Created by chief on 01/06/2017.
 */
angular.module('detailsTable')
    .component( 'detailsTable', {
        templateUrl: 'details-table/details-table.template.html',
        bindings: {
            tableTitle: '<',
            tableHeaders: '<',
            tableDetails: '<'
        }
    });