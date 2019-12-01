var Service, Characteristic;

var Gpio = require('onoff').Gpio;
	exec = require('child_process').exec


module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-hcsr501-sensor-script', 'HCSR501-script', scriptHCSR501);
}

function scriptHCSR501(log, config) {
	this.log = log;
	this.name = config.name;
	this.pinId = config.pinId;
	this.gpio = new Gpio(this.pinId, 'in', 'both');

	this.startCommand = config['start'];
  	this.stopCommand = config['stop'];

	this.informationService = new Service.AccessoryInformation()
		.setCharacteristic(Characteristic.Manufacturer, config.manufacturer || 'HCSR501')
		.setCharacteristic(Characteristic.Model, config.model || 'HC-SR501')
		.setCharacteristic(Characteristic.SerialNumber, config.serial || 'B7FAB24B-E55B-4453-9A4F-57D45AA221DA');

	this.service = new Service.MotionSensor(this.name);

	this.service.getCharacteristic(Characteristic.MotionDetected)
		.on('get', this.getState.bind(this));

	var accessory = this;
	this.gpio.watch(function(err, value) {
		accessory.service.getCharacteristic(Characteristic.MotionDetected)
			.updateValue(value, null, 'motionsensor_handler');

        var prop = value ? 'startCommand' : 'stopCommand';
	  	var command = accessory[prop];

	  	exec(command, puts);
	  	accessory.log('[' + (value ? 'Detects Motion' : 'Stops Detecting Motion') + '] ' + command);
	});

	process.on('SIGINT', function () {
		accessory.gpio.unexport();
	});
}

scriptHCSR501.prototype.getState = function(callback) {
	var value = this.gpio.readSync();
	callback(null, value);
}

scriptHCSR501.prototype.getServices = function() {
	return [this.informationService, this.service];
}

function puts(error, stdout, stderr) {
   console.log(stdout);
}
