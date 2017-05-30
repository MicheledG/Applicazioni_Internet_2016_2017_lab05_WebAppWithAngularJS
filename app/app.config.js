angular
    .module('App')
    .config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
            $routeProvider
            .when('/lines', {
                templateUrl: 'line.html',
                controller: 'LineCtrl',
                controllerAs: 'ctrl'
            })
            .when('/lines/:lineName', {
                templateUrl: 'line.html',
                controller: 'LineCtrl',
                controllerAs: 'ctrl'
            })
            .otherwise({ redirectTo: "/lines" });

            // configure html5 to get links working on jsfiddle
            //$locationProvider.html5Mode(true);
            //$locationProvider.hashPrefix('!');
        }
]);
