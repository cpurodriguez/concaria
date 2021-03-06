'use strict';

var ngModule = angular.mock.module;

describe('purifierDeviceCtrl', function() {
  var fakeProps, $controller, $rootScope, $scope,
      filterDepletion, mqttSensorPublisher, cycleFan;
  beforeEach(function() {
    ngModule('purifier');

    fakeProps = {
      something: {
        initial: 5,
        max: 10,
        min: 0,
      },
      fan: {
        initial: 0,
        max: 3,
        min: 0,
      },
    };
    ngModule(function($provide) {
      $provide.value('sensorProps', fakeProps);

      $provide.factory('sensorStore', function() {
        return {
          set: sinon.stub().returns(true),
        };
      });

      $provide.factory('filterDepletion', function() {
        return {
          depleteFilter: sinon.stub(),
          replaceFilter: sinon.stub(),
        };
      });

      $provide.factory('mqttSensorPublisher', function() {
        return {
          publishUpdate: sinon.stub(),
        };
      });

      $provide.factory('cycleFan', function() {
        return sinon.stub().returns(1);
      });
    });
  });

  beforeEach(inject(function(_$controller_, _$rootScope_, _filterDepletion_, _mqttSensorPublisher_, _cycleFan_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    filterDepletion = _filterDepletion_;
    mqttSensorPublisher = _mqttSensorPublisher_;
    cycleFan = _cycleFan_;
  }));

  beforeEach(function() {
    $scope = $rootScope.$new();
    $controller('purifierDeviceCtrl', {$scope: $scope});
  });

  describe('depletion', function() {
    it('starts out as false', function() {
      expect($scope.depleting).to.be.false;
    });

    it('updates according to events published on the $scope', function() {
      $rootScope.$broadcast('device.filterDepleting', true);
      expect($scope.depleting).to.be.true;
    });
  });

  describe('sensor props', function() {
    it('should attach them to the scope', function() {
      expect($scope.fan).to.equal(fakeProps.fan);
      expect($scope.something).to.equal(fakeProps.something);
    });

    it('should attach the initial values to the scope', function() {
      expect($scope.fanValue).to.equal(fakeProps.fan.initial);
      expect($scope.somethingValue).to.equal(fakeProps.something.initial);
    });

    it('should update them when the device.sensors event is emitted', function() {
      $rootScope.$broadcast('device.sensors', 'fan', 3);
      expect($scope.fanValue).to.equal(3);
    });
  });

  describe('the slide handler', function() {
    beforeEach(function() {
      $scope.onSlide('fan');
    });

    // Testing for throttling seems impossible when using Lodash to throttle, as it
    // uses an internal cached version of `setInterval` that is loaded before the tests
    // are run.
    it('should publish a fan update', function() {
      expect(mqttSensorPublisher.publishUpdate.callCount).to.equal(1);
      // This is a silly hack to get around 'no-undefined'
      var x;
      expect(mqttSensorPublisher.publishUpdate.calledWithExactly(['fan'], x)).to.be.true;
    });
  });

  describe('the fan click handler', function() {
    beforeEach(function() {
      $scope.onClickFan();
    });

    it('should cycle the fan', function() {
      expect(cycleFan.callCount).to.equal(1);
    });

    it('should publish a fan update', function() {
      expect(mqttSensorPublisher.publishUpdate.callCount).to.equal(1);
      var x;
      expect(mqttSensorPublisher.publishUpdate.calledWithExactly(['fan'], x)).to.be.true;
    });

    it('should cycle before updating', function() {
      expect(cycleFan.calledBefore(mqttSensorPublisher.publishUpdate)).to.be.true;
    });
  });

  describe('toggleBoolean', function() {
    it('should toggle the value specified', function() {
      expect($scope.someValue).to.be.undefined;
      $scope.toggleBoolean('someValue');
      expect($scope.someValue).to.be.true;
      $scope.toggleBoolean('someValue');
      expect($scope.someValue).to.be.false;
    });
  });

  describe('when button click handlers are activated', function() {
    it('should delegate to the filterDepletion provider', function() {
      $scope.onClickDepleteFilter();
      expect(filterDepletion.depleteFilter.callCount).to.equal(1);
    });

    it('should delegate to the filterDepletion provider', function() {
      $scope.onClickReplaceFilter();
      expect(filterDepletion.replaceFilter.callCount).to.equal(1);
    });
  });
});
