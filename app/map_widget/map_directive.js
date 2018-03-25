angular.module('citibike', ['ngMaterial', 'station_commons']).directive('googleCitiBikeMap', function () {
    var link = function ($scope, attrs) {
        // A list of all the markers. Each marker is a bicycle station.
        $scope.markers = [];

        // Make an ajax request to load all the stations information
        $scope.loadStationsInformationData();

        // Initialize the map default station
        $scope.initMap();
        $scope.initMdAutoComplete();
        $scope.selectedStation =  null;
    };

    var myController = ['$scope', '$http', '$timeout', '$q', '$log', 'PollingService', 'StationService', function ($scope, $http, $timeout, $q, $log, PollingService, StationService) {
        $scope.distance = "";

        $scope.initMdAutoComplete = function () {

            $scope.simulateQuery = false;
            $scope.isDisabled = false;
            // list of `station` value/display objects
            $scope.loadStationData();
            $scope.querySearch = $scope.querySearch;
            $scope.selectedItemChange = $scope.selectedItemChange;
            $scope.searchTextChange = $scope.searchTextChange;
        };

        $scope.loadStationsInformationData = function () {
            var station_info_api_url = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";

            $http.get(station_info_api_url)
                .then(function(response) {
                    $scope.station_information_list = response.data.data.stations;
                    $scope.callStationStatusService()
                });
        };

        // Initialize the map
        $scope.initMap = function () {
            if ($scope.map === void 0) {
                var element = document.getElementById("gmaps");

                // map config
                var mapOptions = {
                    center: new google.maps.LatLng(50, 2),
                    zoom: 4,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    scrollwheel: false
                };

                $scope.map = new google.maps.Map(element, mapOptions);
            }
        };

        $scope.$on('station_status_updated', function(event, args) {
            var stationStatusList = args.data.data.stations;
            $scope.updateMarkers(stationStatusList);
        });

        $scope.updateMarkers = function (stationStatusList) {
            for (var station in $scope.station_information_list) {
                var stationInfoObj = $scope.station_information_list[station];
                var id = stationInfoObj.station_id;
                var stationCapacity = stationInfoObj.capacity;

                for (var stationStatus in stationStatusList) {
                    var stationStatusObj = stationStatusList[stationStatus];

                    if (id === stationStatusObj.station_id) {
                        var numOfbikesAvailable = stationStatusObj.num_bikes_available;
                        var availabilityPercentage = numOfbikesAvailable / stationCapacity * 100;
                        var markerColor = $scope.calculateStationMarkerColor(availabilityPercentage);
                        var markerIcon = 'https://maps.google.com/mapfiles/ms/icons/' + markerColor + '-dot.png';
                        var marker = $scope.createMarker($scope.map, new google.maps.LatLng(stationInfoObj.lat, stationInfoObj.lon), stationInfoObj.name, markerIcon);

                        var existingMarker = $scope.getExistingMarkerIfExists(marker);

                        if (existingMarker) {
                            existingMarker.icon = markerIcon;
                        } else {
                            $scope.addMarkerToMap(marker);
                        }

                        break;
                    }
                }
            }

            if (!$scope.stationStatusesInitialized) {
                $scope.updateZoomLevel();
                $scope.stationStatusesInitialized = true;
            }
        };

        $scope.addMarkerToMap = function (marker) {
            // add marker to array
            $scope.markers.push(marker);
        };

        $scope.whittleMap = function () {
            if ($scope.selectedStation) {
                var latlon = new google.maps.LatLng($scope.selectedStation.value.lat, $scope.selectedStation.value.lon);

                if ($scope.distance != null) {
                    $scope.updateZoomBasedOnDistanceAndCenter(latlon, $scope.distance);
                } else {
                    $scope.updateZoomBasedOnDistanceAndCenter(latlon, 0);
                }
            } else {
                $scope.updateZoomLevel();
            }
        };

        $scope.updateZoomBasedOnDistanceAndCenter = function (center, distance) {
            var circleOptions = {
                center: center,
                fillOpacity: 0,
                strokeOpacity: 0,
                map: $scope.map,
                radius: distance * 1000
            }
            var myCircle = new google.maps.Circle(circleOptions)
            $scope.map.fitBounds(myCircle.getBounds());
        };


        $scope.updateZoomLevel = function () {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < $scope.markers.length; i++) {
                bounds.extend($scope.markers[i].getPosition());
            }
            $scope.map.fitBounds(bounds)
        };

        $scope.calculateStationMarkerColor = function(availabilityPercentage) {
            if (availabilityPercentage === 0) {
                return "red";
            } else if (availabilityPercentage < 50) {
                return "orange";
            } else if (availabilityPercentage > 75) {
                return "green";
            } else {
                return "yellow"
            }
        };

        $scope.createMarker = function(map, position, title, icon) {
            var marker;

            var markerOptions = {
                position: position,
                map: map,
                title: title,
                icon: icon
            };

            marker = new google.maps.Marker(markerOptions);

            return marker;
        };

        $scope.getExistingMarkerIfExists = function(marker) {
            for (var existingMarker in $scope.markers) {
                if ($scope.markers[existingMarker].position.lat() === marker.position.lat() &&
                    $scope.markers[existingMarker].position.lng() === marker.position.lng()) {
                    return $scope.markers[existingMarker];
                }
            }
        };

        $scope.querySearch = function(query) {
            var results = [];

            if (query && $scope.stations) {
                var lowercaseQuery = query.toLowerCase();

                for (var station in $scope.stations) {
                    if ($scope.stations[station].name.toLowerCase().indexOf(lowercaseQuery) === 0) {
                        $scope.pushStationToAutoCompleteResults(results, station);
                    }
                }
            } else {
                for (var station in $scope.stations) {
                    $scope.pushStationToAutoCompleteResults(results, station);
                }
            }

            return results;
        };

        $scope.pushStationToAutoCompleteResults = function(results, station) {
            var stationFound = $scope.stations[station];
            var stationItem = $scope.createStationItem(stationFound.name, stationFound.lat, stationFound.lon, stationFound.station_id);
            results.push({"display": stationFound.name, "value": stationItem});
        };

        $scope.createStationItem = function(name, lat, lon, station_id) {
            var stationObj = {"name": name, "lat": lat, "lon": lon, "station_id": station_id};
            return stationObj;
        }

        $scope.searchTextChange = function(text) {
            var stationFound = $scope.searchStationExactMatch(text.toLowerCase());

            if (stationFound) {
                var stationItem = $scope.createStationItem(stationFound.name, stationFound.lat, stationFound.lon, stationFound.station_id);
                $scope.selectedStation = stationItem;
                $scope.whittleMap();
            } else {
                $scope.selectedStation = null;
                $scope.whittleMap();
            }
        }

        $scope.selectedItemChange = function(item) {
            $scope.selectedStation = item;
            $scope.whittleMap();
        };

        $scope.loadStationData = function() {
            var station_info_api_url = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";

            $http.get(station_info_api_url).then(
                function successCallback(response) {
                    $scope.stations = response.data.data.stations;
                }, function failureCallback(reason) {
                    console.log(reason);
                })
        };

        $scope.searchStationExactMatch = function(name){
            for (var station in $scope.stations) {
                if ($scope.stations[station].name.toLowerCase() === name) {
                    return $scope.stations[station];
                }
            }

            return null;
        };
    }];

    return {
        restrict: 'E',
        templateUrl: 'map_widget/map_template.html',
        link: link,
        controller: myController
    };

});