angular.module('citibike')
    .service('PollingService', ['$http', '$rootScope', '$interval', function ($http, $rootScope, $interval) {
        $rootScope.callStationStatusService = function() {
            var station_status_api = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

            return $http.get(station_status_api).then(
                function successCallback(response) {
                    updatedData = response.data;
                    $rootScope.$broadcast('station_status_updated', {data: updatedData});
                }, function failureCallback(reason) {
                    console.log(reason);
                })
        };

        $interval($rootScope.callStationStatusService, 10000);
    }]);