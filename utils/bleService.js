import { EventEmitter } from 'events';

class BLEService extends EventEmitter {
  constructor() {
    super();
    this.device = null;
    this.server = null;
    this.noiseCancellationService = null;
    this.noiseCancellationCharacteristic = null;
    this.isConnected = false;
    console.log('BLEService initialized');
  }

  async connect() {
    try {
      console.log('Attempting to connect to BLE device...');
      // Request Bluetooth device with the specified service UUID
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] } // Replace with your device's service UUID
        ],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb'] // Replace with your device's service UUID
      });
      console.log('Device selected:', this.device.name);

      // Connect to the device
      console.log('Connecting to GATT server...');
      this.server = await this.device.gatt.connect();
      this.isConnected = true;
      this.emit('connected');
      console.log('Connected to GATT server');

      // Get the noise cancellation service
      console.log('Getting noise cancellation service...');
      this.noiseCancellationService = await this.server.getPrimaryService('0000ff00-0000-1000-8000-00805f9b34fb');
      console.log('Got noise cancellation service');
      
      // Get the noise cancellation characteristic
      console.log('Getting noise cancellation characteristic...');
      this.noiseCancellationCharacteristic = await this.noiseCancellationService.getCharacteristic('0000ff01-0000-1000-8000-00805f9b34fb');
      console.log('Got noise cancellation characteristic');

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);
      console.log('Added disconnect listener');

      return true;
    } catch (error) {
      console.error('Error connecting to BLE device:', error);
      this.emit('error', error);
      return false;
    }
  }

  handleDisconnect = () => {
    console.log('Device disconnected');
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.noiseCancellationService = null;
    this.noiseCancellationCharacteristic = null;
    this.emit('disconnected');
  };

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      try {
        console.log('Disconnecting from device...');
        await this.device.gatt.disconnect();
        this.handleDisconnect();
        console.log('Disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting from BLE device:', error);
        this.emit('error', error);
      }
    }
  }

  async setNoiseCancellation(enabled) {
    if (!this.isConnected || !this.noiseCancellationCharacteristic) {
      console.error('Not connected to BLE device');
      return false;
    }

    try {
      console.log(`Setting noise cancellation to: ${enabled}`);
      // Convert boolean to byte array (1 for enabled, 0 for disabled)
      const value = new Uint8Array([enabled ? 1 : 0]);
      await this.noiseCancellationCharacteristic.writeValue(value);
      this.emit('noiseCancellationChanged', enabled);
      console.log('Noise cancellation set successfully');
      return true;
    } catch (error) {
      console.error('Error setting noise cancellation:', error);
      this.emit('error', error);
      return false;
    }
  }

  async getNoiseCancellationStatus() {
    if (!this.isConnected || !this.noiseCancellationCharacteristic) {
      console.error('Not connected to BLE device');
      return null;
    }

    try {
      console.log('Getting noise cancellation status...');
      const value = await this.noiseCancellationCharacteristic.readValue();
      const status = value.getUint8(0) === 1;
      console.log(`Current noise cancellation status: ${status}`);
      return status;
    } catch (error) {
      console.error('Error getting noise cancellation status:', error);
      this.emit('error', error);
      return null;
    }
  }
}

// Create a singleton instance
const bleService = new BLEService();

export default bleService; 