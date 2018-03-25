angular.module('station_commons', [])
    .service('StationService', ['$http', '$rootScope', function ($http, $rootScope) {
        $rootScope.getStationInfoSet = function() {
            var station_info_api_url = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
            $http.get(station_info_api_url).then(
                function successCallback(response) {
                    $rootScope.station_information_list = response.data.data.stations;
                }, function failureCallback(reason) {
                    alert("Something went wrong while calling citibike services. Please check your internet connection.")
                })

        };
    }]);