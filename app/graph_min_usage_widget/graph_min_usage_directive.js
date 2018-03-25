angular.module('citibike').directive('usageTimeline', function () {
    var link = function ($scope, attrs) {
        // Make an ajax request to load all the stations information
        $scope.initChart();
        $scope.initMdAutoCompleteGraph2();
        $scope.isUsageTimelineGlobal = true;
        $scope.selectedStationGraph2 =  null;
        $scope.graph2LastUpdated = null
    };

    var myController = ['$scope', '$http', '$timeout', '$q', '$log', 'PollingService', 'StationService', function ($scope, $http, $timeout, $q, $log, PollingService, StationService) {
        $scope.initMdAutoCompleteGraph2 = function () {
            $scope.querySearchGraph2 = $scope.querySearchGraph2;
            $scope.selectedItemChangeGraph2 = $scope.selectedItemChangeGraph2;
            $scope.searchTextChangeGraph2 = $scope.searchTextChangeGraph2;
        };

        // Initialize the map
        $scope.initChart = function () {
            // Load the Visualization API and the annotatedtimeline package.
            google.charts.load('current', {'packages':['annotatedtimeline']});

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback($scope.setGoogleTimelineReady);
        };

        $scope.setGoogleTimelineReady = function() {
            $scope.googleTimelineReady = true;
            $scope.updateUsageTimelineGlobal();
        };

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        $scope.updateUsageTimelineGlobal = function() {
            if ($scope.stationStatusListGraph && $scope.stations && $scope.googleTimelineReady) {
                // Create the data table.

                if (!$scope.usageTimelineGlobalData) {
                    $scope.usageTimelineGlobalData = new google.visualization.DataTable();
                    $scope.usageTimelineGlobalData.addColumn('date', 'Date');
                    $scope.usageTimelineGlobalData.addColumn('number', 'Bikes Available');
                    $scope.usageTimelineGlobalData.addColumn('number', 'eBikes Available');
                    $scope.usageTimelineGlobalData.addColumn('number', 'Bikes Disabled');
                    $scope.usageTimelineGlobalData.addColumn('number', 'Docs Available');
                    $scope.usageTimelineGlobalData.addColumn('number', 'Docs Disabled');

                    $scope.usageTimelineGlobal = new google.visualization.AnnotatedTimeLine(document.getElementById('usageTimelineGlobal'));
                }

                $scope.usageTimelineGlobalData.addRows($scope.getUsageTimelineGlobalRows());
                // Instantiate and draw our chart, passing in some options.
                $scope.usageTimelineGlobal.draw($scope.usageTimelineGlobalData, {displayAnnotations: true});
            }
        };

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        $scope.updateUsageTimelineSpecific = function() {
            if ($scope.stationStatusListGraph && $scope.selectedStationGraph2 && $scope.googleTimelineReady) {
                // Create the data table.
                if ($scope.newItemSelected) {
                    $scope.newItemSelected = false;
                    $scope.usageTimelineSpecificData = new google.visualization.DataTable();
                    $scope.usageTimelineSpecificData.addColumn('date', 'Date');
                    $scope.usageTimelineSpecificData.addColumn('number', 'Bikes Available');
                    $scope.usageTimelineSpecificData.addColumn('number', 'eBikes Available');
                    $scope.usageTimelineSpecificData.addColumn('number', 'Bikes Disabled');
                    $scope.usageTimelineSpecificData.addColumn('number', 'Docs Available');
                    $scope.usageTimelineSpecificData.addColumn('number', 'Docs Disabled');

                    $scope.usageTimelineSpecific = new google.visualization.AnnotatedTimeLine(document.getElementById('usageTimelineSpecific'));
                }

                $scope.usageTimelineSpecificData.addRows($scope.getUsageTimelineSpecificRows());

                // Instantiate and draw our chart, passing in some options.
                $scope.usageTimelineSpecific.draw($scope.usageTimelineSpecificData, {displayAnnotations: true});
            }
        };

        $scope.getUsageTimelineSpecificRows = function() {
            var num_bikes_available = 0;
            var num_ebikes_available = 0;
            var num_bikes_disabled = 0;
            var num_docks_available = 0;
            var num_docks_disabled = 0;

            for (var stationStatus in $scope.stationStatusListGraph) {
                if ($scope.selectedStationGraph2.value.station_id === $scope.stationStatusListGraph[stationStatus].station_id) {
                    var stationObj = $scope.stationStatusListGraph[stationStatus];
                    num_bikes_available = stationObj.num_bikes_available + num_bikes_available;
                    num_ebikes_available = stationObj.num_ebikes_available + num_ebikes_available;
                    num_bikes_disabled = stationObj.num_bikes_disabled + num_bikes_disabled;
                    num_docks_available = stationObj.num_docks_available + num_docks_available;
                    num_docks_disabled = stationObj.num_docks_disabled + num_docks_disabled;
                }
            }

            return [
                [$scope.graph2LastUpdatedDate.toDate(), num_bikes_available, num_ebikes_available, num_bikes_disabled, num_docks_available, num_docks_disabled]
            ];
        };

        $scope.getUsageTimelineGlobalRows = function() {
            var num_bikes_available = 0;
            var num_ebikes_available = 0;
            var num_bikes_disabled = 0;
            var num_docks_available = 0;
            var num_docks_disabled = 0;

            for (var station in $scope.stations) {

                for (var stationStatus in $scope.stationStatusListGraph) {

                    if ($scope.stations[station].station_id === $scope.stationStatusListGraph[stationStatus].station_id) {
                        var stationObj = $scope.stationStatusListGraph[stationStatus];
                        num_bikes_available = stationObj.num_bikes_available + num_bikes_available;
                        num_ebikes_available = stationObj.num_ebikes_available + num_ebikes_available;
                        num_bikes_disabled = stationObj.num_bikes_disabled + num_bikes_disabled;
                        num_docks_available = stationObj.num_docks_available + num_docks_available;
                        num_docks_disabled = stationObj.num_docks_disabled + num_docks_disabled;
                    }
                }
            }

            return [
                [$scope.graph2LastUpdatedDate.toDate(), num_bikes_available, num_ebikes_available, num_bikes_disabled, num_docks_available, num_docks_disabled]
            ];
        };

        $scope.querySearchGraph2 = function(query) {
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

        $scope.searchTextChangeGraph2 = function(text) {
            var stationFound = $scope.searchStationExactMatch(text.toLowerCase());
            debugger;
            if (stationFound) {
                var stationItem = $scope.createStationItem(stationFound.name, stationFound.lat, stationFound.lon);
                $scope.selectedStationGraph2 = stationItem;
                $scope.newItemSelected = true;
                $scope.updateUsageTimelineSpecific();
                $scope.isUsageTimelineGlobal = false;
            } else {
                $scope.selectedStationGraph2 = null;
                $scope.isUsageTimelineGlobal = true;
            }
        };

        $scope.selectedItemChangeGraph2 = function(itemGraph2) {
            $scope.selectedStationGraph2 = itemGraph2;

            if (itemGraph2) {
                $scope.newItemSelected = true;
                $scope.updateUsageTimelineSpecific();
                $scope.isUsageTimelineGlobal = false;
            }
        };

        $scope.$on('station_status_updated', function(event, args) {
            $scope.stationStatusListGraph = args.data.data.stations;
            $scope.updateUsageTimelineGlobal();
            $scope.updateUsageTimelineSpecific();
            $scope.graph2LastUpdatedDate = moment.unix(args.data.last_updated);
            $scope.graph2LastUpdated = moment.unix(args.data.last_updated).format('MMMM Do, YYYY h:mm:ss A')
        });
    }];

    return {
        restrict: 'E',
        templateUrl: 'graph_min_usage_widget/graph_min_usage_template.html',
        link: link,
        controller: myController
    };

});