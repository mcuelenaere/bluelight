'use strict';

const
    events = require('events'),
    noble = require('noble'),
    util = require('util');

class ScanArbitrator {
    constructor() {
        this._scanRequested = false;
        this._scanningPaused = false;
        this._isScanning = false;
        this._pendingScanTimeoutId = null;

        noble.on('stateChange', this._stateChange.bind(this));
        noble.on('scanStart', this._scanningStarted.bind(this));
        noble.on('scanStop', this._scanningStopped.bind(this));
    }

    _stateChange(newState) {
        if (newState === 'poweredOn') {
            if (this._scanRequested && !this._isScanning) {
                noble.startScanning([], true);
            }
        }
    }

    _scanningStarted() {
        this._isScanning = true;

        this.emit('scanStart');
    }

    _scanningStopped() {
        this._isScanning = false;

        if (!this._scanningPaused) {
            // clear any pending scan timeout, if present
            if (this._pendingScanTimeoutId) {
                clearTimeout(this._pendingScanTimeoutId);
                this._pendingScanTimeoutId = null;
                this._scanRequested = false;
            }

            this.emit('scanStop');
        }
    }

    scanFor(timeout) {
        this.startScanning();

        // stop scanning after timeout
        if (this._pendingScanTimeoutId !== null) {
            clearTimeout(this._pendingScanTimeoutId);
        }
        this._pendingScanTimeoutId = setTimeout(() => {
            noble.stopScanning();
            this._scanRequested = false;
            this._pendingScanTimeoutId = null;
        }, timeout);
    }

    startScanning() {
        this._scanRequested = true;
        if (noble.state === 'poweredOn' && !this._isScanning) {
            noble.startScanning([], true);
        }
    }

    stopScanning() {
        this._scanRequested = false;
        if (this._pendingScanTimeoutId !== null) {
            clearTimeout(this._pendingScanTimeoutId);
        }
        if (this._isScanning) {
            noble.stopScanning();
        }
    }

    pauseScanning() {
        this._scanningPaused = true;
        if (this._isScanning) {
            noble.stopScanning();
        }
    }

    resumeScanning() {
        this._scanningPaused = false;
        if (this._scanRequested && noble.state === 'poweredOn') {
            noble.startScanning([], true);
        }
    }
}
util.inherits(ScanArbitrator, events.EventEmitter);

module.exports = new ScanArbitrator();