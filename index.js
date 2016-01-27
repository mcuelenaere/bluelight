'use strict';

const
    events = require('events'),
    devices = require('./devices'),
    noble = require('noble'),
    util = require('util');

class BlueLight {
    constructor() {
        this._alreadySeenPeripheralUuids = new Set();
        this._devices = new Map();
        this._scanRequested = false;
        this._pendingScanTimeoutId = null;

        var stateChangeListener = this._stateChange.bind(this);
        var discoverPeripheralListener = this._discoverPeripheral.bind(this);
        var scanningStoppedListener = this._scanningStopped.bind(this);
        noble.on('stateChange', stateChangeListener);
        noble.on('discover', discoverPeripheralListener);
        noble.on('scanStop', scanningStoppedListener);

        // dynamically define the dispose function so we don't need to keep track
        // of the registered event listeners handles when trying to unregister them
        this.dispose = () => {
            // unbind event handlers
            noble.removeListener('stateChange', stateChangeListener);
            noble.removeListener('discover', discoverPeripheralListener);
            noble.removeListener('scanStop', scanningStoppedListener);

            // stop scanning, if we were still doing this
            if (this._pendingScanTimeoutId) {
                clearTimeout(this._pendingScanTimeoutId);
                noble.stopScanning();
            }
        };
    }

    _stateChange(newState) {
        if (newState === 'poweredOn') {
            if (this._scanRequested) {
                noble.startScanning([], true);
                // make sure we don't start scanning twice
                this._scanRequested = false;
            }
        } else if (newState === 'poweredOff') {
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

        // clear any pending scan timeout, if present
        if (this._pendingScanTimeoutId) {
            clearTimeout(this._pendingScanTimeoutId);
            this._pendingScanTimeoutId = null;
            this._scanRequested = false;
        }
    }

    scanFor(timeout) {
        this._scanRequested = true;
        if (this._pendingScanTimeoutId !== null) {
            clearTimeout(this._pendingScanTimeoutId);
        }

        if (noble.state === 'poweredOn') {
            noble.startScanning([], true);
        }

        this._pendingScanTimeoutId = setTimeout(() => {
            noble.stopScanning();
            this._scanRequested = false;
            this._pendingScanTimeoutId = null;
        }, timeout);
    }

    get detectedDevices() {
        return this._devices.values();
    }
}
util.inherits(BlueLight, events.EventEmitter);

module.exports = BlueLight;