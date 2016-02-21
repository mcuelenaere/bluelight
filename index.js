'use strict';

const
    events = require('events'),
    devices = require('./devices'),
    noble = require('noble'),
    scanArbitrator = require('./scan_arbitrator'),
    util = require('util');

class BlueLight {
    constructor() {
        this._alreadySeenPeripheralUuids = new Set();
        this._devices = new Map();

        var stateChangeListener = this._stateChange.bind(this);
        var discoverPeripheralListener = this._discoverPeripheral.bind(this);
        var scanningStoppedListener = this._scanningStopped.bind(this);
        noble.on('stateChange', stateChangeListener);
        noble.on('discover', discoverPeripheralListener);
        scanArbitrator.on('scanStop', scanningStoppedListener);

        // dynamically define the dispose function so we don't need to keep track
        // of the registered event listeners handles when trying to unregister them
        this.dispose = () => {
            // unbind event handlers
            noble.removeListener('stateChange', stateChangeListener);
            noble.removeListener('discover', discoverPeripheralListener);
            scanArbitrator.removeListener('scanStop', scanningStoppedListener);
        };
    }

    _stateChange(newState) {
        if (newState === 'poweredOff') {
            // clear internal state
            this._alreadySeenPeripheralUuids = new Set();
            this._devices = new Map();
        }
    }

    _discoverPeripheral(peripheral) {
        if (this._alreadySeenPeripheralUuids.has(peripheral.uuid)) {
            // this peripheral has already been processed
            return;
        }

        this._alreadySeenPeripheralUuids.add(peripheral.uuid);

        // try creating a device handler for this peripheral
        devices.createFor(peripheral).then((device) => {
            if (device !== null) {
                this._devices.set(peripheral.uuid, device);
                peripheral.once('disconnect', () => {
                    this._devices.delete(peripheral.uuid);
                    this._alreadySeenPeripheralUuids.delete(peripheral.uuid);
                    this.emit('disconnect', device);
                });
                this.emit('discover', device);
            }
        }).catch((error) => {
            this.emit('error', error);
        });
    }

    _scanningStopped() {
        // pass on to our listeners
        this.emit('scanStop');
    }

    scanFor(timeout) {
        scanArbitrator.scanFor(timeout);
    }

    get detectedDevices() {
        return this._devices.values();
    }
}
util.inherits(BlueLight, events.EventEmitter);

module.exports = BlueLight;