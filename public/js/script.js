var pollApp = angular.module('poll-app', ['ngRoute']);

pollApp.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider.
        when('/:tliId', {
            controller: 'IndexCtrl',
            template: ''
        }).
        when('/:tliId/edit', {
            templateUrl: '/public/html/teacher_view.html',
            controller: 'TeacherCtrl'
        }).
        when('/:tliId/results', {
            templateUrl: '/public/html/results_view.html',
            controller: 'ResultsCtrl'
        }).
        when('/:tliId/vote', {
            templateUrl: '/public/html/student_view.html',
            controller: 'StudentCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
    });

pollApp.controller('IndexCtrl', function($http, $location, $routeParams) {
    $http.get('/api/init').then(function(result) {
        if(result.data.userType === 'teacher') {
            $location.path('/' + $routeParams.tliId + '/edit');
        } else if(result.data.userType === 'student') {
            $location.path('/' + $routeParams.tliId + '/vote');
        } else {
            console.err('Unknown userType');
        }
    });
});

pollApp.controller('TeacherCtrl', function($scope, $http, $routeParams) {
    $http.get('/api/results/' + $routeParams.tliId).then(function(result) {
        $scope.pollData = result.data;
    });

    $scope.addOption = function() {
        $scope.pollData.choices.push({title: '', votes: 0});
    };

    $scope.removeOption = function(index) {
        $scope.pollData.choices.splice(index, 1);
    };

    $scope.save = function() {
        $http.put('/api/poll/' + $routeParams.tliId, $scope.pollData).then(function(result) {
            $scope.pollData = result.data;
        });
    };
});

pollApp.controller('ResultsCtrl', function($scope, $http, $routeParams) {
    $http.get('/api/results/' + $routeParams.tliId).then(function(result) {
        $scope.pollData = result.data;

        $scope.totalVotes = 0;
        $scope.pollData.choices.forEach(function(choice) {
            $scope.totalVotes += choice.votes;
        });
    });

    $scope.percentOfVotes = function(index) {
        var percent = ($scope.pollData.choices[index].votes / $scope.totalVotes * 100).toFixed(1);
        return isNaN(percent) ? 0 : percent;
    };
});

pollApp.controller('StudentCtrl', function($scope, $http, $routeParams) {
    $http.get('/api/poll/' + $routeParams.tliId).then(function(result) {
        $scope.pollData = result.data;

        if($scope.pollData.hasVoted) {
            $scope.message = 'Du har redan röstat i den här omröstningen';
        }
    });

    $scope.vote = function(choice) {
        $http.post('/api/vote/' + $routeParams.tliId, {title: choice.title}).then(function() {
            $scope.pollData.hasVoted = true;
            $scope.message = 'Tack för din röst';
        });
    };
});