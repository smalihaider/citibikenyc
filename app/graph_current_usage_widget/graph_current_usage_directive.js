angular.module('citibike').directive('graphCurrentUsage', function () {
    var link = function ($scope, attrs) {
        // Make an ajax request to load all the stations information
        $scope.initChart();
        $scope.initMdAutoCompleteGraph1();
        $scope.isCurrentUsageChartGlobal = true;
        $scope.selectedStationGraph1 =  null;
        $scope.graph1LastUpdated = null
    };

    var myController = ['$scope', '$http', '$timeout', '$q', '$log', 'PollingService', 'StationService', function ($scope, $http, $timeout, $q, $log, PollingService, StationService) {
        $scope.initMdAutoCompleteGraph1 = function () {
            $scope.querySearchGraph1 = $scope.querySearchGraph1;
            $scope.selectedItemChangeGraph1 = $scope.selectedItemChangeGraph1;
            $scope.searchTextChangeGraph1 = $scope.searchTextChangeGraph1;
        };

        // Initialize the map
        $scope.initChart = function () {
            // Load the Visualization API and the corechart package.
            google.charts.load('current', {'packages':['corechart']});

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback($scope.setGoogleGraphsReady);
        };

        $scope.setGoogleGraphsReady = function() {
            $scope.googleGraphsReady = true;
            $scope.updateCurrentUsageChartGlobal();
        };

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        $scope.updateCurrentUsageChartGlobal = function() {
            if ($scope.stationStatusListGraph && $scope.stations && $scope.googleGraphsReady) {
                // Create the data table.
                $scope.currentUsageChartGlobalData = new google.visualization.DataTable();
                $scope.currentUsageChartGlobalData.addColumn('string', 'Topping');
                $scope.currentUsageChartGlobalData.addColumn('number', 'Slices');

                $scope.currentUsageChartGlobalOptions = {'title':'Current Usage of All the Stations',
                    'width':400,
                    'height':300};

                $scope.currentUsageChartGlobalData.addRows($scope.getCurrentUsageChartGlobalRows());

                // Instantiate and draw our chart, passing in some options.
                $scope.currentUsageChartGlobalChart = new google.visualization.PieChart(document.getElementById('currentUsageChartGlobal'));
                $scope.currentUsageChartGlobalChart.draw($scope.currentUsageChartGlobalData, $scope.currentUsageChartGlobalOptions);
                $scope.graphRendered = true;
            }
        };

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        $scope.updateCurrentUsageChartSpecific = function() {
            if ($scope.stationStatusListGraph && $scope.selectedStationGraph1 && $scope.googleGraphsReady) {
                // Create the data table.
                $scope.currentUsageChartSpecificData = new google.visualization.DataTable();
                $scope.currentUsageChartSpecificData.addColumn('string', 'Topping');
                $scope.currentUsageChartSpecificData.addColumn('number', 'Slices');

                $scope.currentUsageChartSpecificOptions = {'title':'Current Usage of ' + $scope.selectedStationGraph1.value.name,
                    'width':400,
                    'height':300};

                $scope.currentUsageChartSpecificData.addRows($scope.getCurrentUsageChartSpecificRows());

                // Instantiate and draw our chart, passing in some options.
                $scope.currentUsageChartSpecificChart = new google.visualization.PieChart(document.getElementById('currentUsageChartSpecific'));
                $scope.currentUsageChartSpecificChart.draw($scope.currentUsageChartSpecificData, $scope.currentUsageChartSpecificOptions);
            }
        };

        $scope.getCurrentUsageChartSpecificRows = function() {
            var num_bikes_available = 0;
            var num_ebikes_available = 0;
            var num_bikes_disabled = 0;
            var num_docks_available = 0;
            var num_docks_disabled = 0;

            for (var stationStatus in $scope.stationStatusListGraph) {
                if ($scope.selectedStationGraph1.value.station_id === $scope.stationStatusListGraph[stationStatus].station_id) {
                    var stationObj = $scope.stationStatusListGraph[stationStatus];
                    num_bikes_available = stationObj.num_bikes_available + num_bikes_available;
                    num_ebikes_available = stationObj.num_ebikes_available + num_ebikes_available;
                    num_bikes_disabled = stationObj.num_bikes_disabled + num_bikes_disabled;
                    num_docks_available = stationObj.num_docks_available + num_docks_available;
                    num_docks_disabled = stationObj.num_docks_disabled + num_docks_disabled;
                    break;
                }
            }

            return [
                ['Bikes Available', num_bikes_available],
                ['eBikes Available', num_ebikes_available],
                ['Bikes Disabled', num_bikes_disabled],
                ['Docs Available', num_docks_available],
                ['Docs Disabled', num_docks_disabled]
            ];
        };

        $scope.getCurrentUsageChartGlobalRows = function() {
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
                        break;
                    }
                }
            }

            return [
                ['Bikes Available', num_bikes_available],
                ['eBikes Available', num_ebikes_available],
                ['Bikes Disabled', num_bikes_disabled],
                ['Docs Available', num_docks_available],
                ['Docs Disabled', num_docks_disabled]
            ];
        };

        $scope.querySearchGraph1 = function(query) {
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

        $scope.searchTextChangeGraph1 = function(text) {
            var stationFound = $scope.searchStationExactMatch(text.toLowerCase());
            debugger;
            if (stationFound) {
                var stationItem = $scope.createStationItem(stationFound.name, stationFound.lat, stationFound.lon);
                $scope.selectedStationGraph1 = stationItem;
                $scope.updateCurrentUsageChartSpecific();
                $scope.isCurrentUsageChartGlobal = false;
            } else {
                $scope.selectedStationGraph1 = null;
                $scope.isCurrentUsageChartGlobal = true;
            }
        };

        $scope.selectedItemChangeGraph1 = function(itemGraph1) {
            debugger;
            $scope.selectedStationGraph1 = itemGraph1;

            if (itemGraph1) {
                $scope.updateCurrentUsageChartSpecific();
                $scope.isCurrentUsageChartGlobal = false;
            }
        };

        $scope.$on('station_status_updated', function(event, args) {
            $scope.stationStatusListGraph = args.data.data.stations;
            $scope.updateCurrentUsageChartGlobal();
            $scope.updateCurrentUsageChartSpecific();
            $scope.graph1LastUpdated = moment.unix(args.data.last_updated).format('MMMM Do, YYYY h:mm:ss A')
        });
    }];

    return {
        restrict: 'E',
        templateUrl: 'graph_current_usage_widget/graph_current_usage_template.html',
        link: link,
        controller: myController
    };

});