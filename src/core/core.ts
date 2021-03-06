import { Client } from './client';
import { Cordova } from './cordova';
import { Device } from './device';
import { EventEmitter } from './events';
import { Storage } from './storage';
import { Logger } from './logger';
import { ISettings, Config, config } from './config';

declare var Ionic: any;

export class Core {

  client: Client;
  config: Config;
  cordova: Cordova;
  device: Device;
  emitter: EventEmitter;
  logger: Logger;
  storage: Storage;

  private pluginsReady: boolean = false;
  private _version = 'VERSION_STRING';

  constructor() {
    this.config = config;
    this.logger = new Logger();
    this.client = new Client(this.config.getURL('api'));
    this.device = new Device();
    this.cordova = new Cordova(this.device, this.logger);
    this.emitter = new EventEmitter();
    this.storage = new Storage();
    this.cordova.load();
    this.registerEventHandlers();
  }

  public init(cfg: ISettings) {
    this.config.register(cfg);
    this.logger.info('Ionic Core: init');
    this.emitter.emit('core:init');
  }

  public get version(): string {
    return this._version;
  }

  private registerEventHandlers() {
    this.emitter.on('auth:token-changed', data => {
      this.client.token = data['new'];
    });

    this.emitter.on('core:init', data => {
      this.client.baseUrl = this.config.getURL('api');
    });

    if (this.device.deviceType === 'unknown') {
      this.logger.info('Ionic Core: attempting to mock plugins');
      this.pluginsReady = true;
      this.emitter.emit('device:ready');
    } else {
      document.addEventListener('deviceready', () => {
        this.logger.info('Ionic Core: plugins are ready');
        this.pluginsReady = true;
        this.emitter.emit('device:ready');
      }, false);
    }
  }

  /**
   * Fire a callback when core + plugins are ready. This will fire immediately if
   * the components have already become available.
   *
   * @param {function} callback function to fire off
   * @return {void}
   */
  onReady(callback) {
    if (this.pluginsReady) {
      callback(this);
    } else {
      this.emitter.on('device:ready', () => {
        callback(this);
      });
    }
  }
}

export let IonicPlatform = new Core();
