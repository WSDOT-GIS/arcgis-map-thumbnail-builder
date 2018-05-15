import declare = require("dojo/_base/declare");
import Evented = require("dojo/Evented");
import ArcGISDynamicMapServiceLayer = require("esri/layers/ArcGISDynamicMapServiceLayer");
import ArcGISImageServiceLayer = require("esri/layers/ArcGISImageServiceLayer");
import ArcGISTiledMapServiceLayer = require("esri/layers/ArcGISTiledMapServiceLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Layer = require("esri/layers/layer");
import OpenStreetMapLayer = require("esri/layers/OpenStreetMapLayer");
import WebTiledLayer = require("esri/layers/WebTiledLayer");
import esriRequest = require("esri/request");

/**
 * Options for {@link LayerFactory#createLayer} function
 */
export interface ICreateLayerOptions {
  /**
   * The URL used to define service types such as ArcGISTiledMapServiceLayer, ArcGISDynamicServiceLayer, and ArcGISImageServiceLayer.
   */
  url?: string;
  /**
   * Layer constructors that take an options parameter can have those options provided via this property.
   */
  options?: any;
  /**
   * The name of the type, for situations where the type cannot be determined by a URL, or if a URL is not required (e.g., OpenStreetMapLayer.).
   */
  type?: string;
}

const layerFactory = declare([Evented] as any, {
  constructor(/*options*/) {
    // this.map = options.map || null;
  },
  _triggerLayerCreate(layer: Layer) {
    this.emit("layer-create", {
      layer
    });
  },
  _triggerError(error: Error) {
    this.emit("layer-create", {
      error
    });
  },

  /** Creates a layer. Once the layer is created an event will be triggered.
   * @param {Object} options The options provided will vary depending on the type of layer to be created.
   * @param {String} [options.url] The URL used to define service types such as ArcGISTiledMapServiceLayer, ArcGISDynamicServiceLayer, and ArcGISImageServiceLayer.
   * @param {Object} [options.options] Layer constructors that take an options parameter can have those options provided via this property.
   * @param {String} [options.type] The name of the type, for situations where the type cannot be determined by a URL, or if a URL is not required (e.g., OpenStreetMapLayer.).
   */
  createLayer(options?: ICreateLayerOptions) {
    const self = this;
    const layerOptions: any = options ? options.options : {};

    /**
     * Extracts the name of a map service from its URL.
     * @param {String} mapUrl
     */
    function getMapNameFromUrl(mapUrl: string): string | null {
      const arcgisRe = /services\/(.+)\/\w+Server/i;
      const match = mapUrl.match(arcgisRe);
      let name: string | undefined;
      if (match) {
        name = match[1]; // The captured name part of the URL.
      }
      return name || null;
    }

    if (options) {
      if (options.url) {
        const url = options.url;

        const mapServerRe = /MapServer\/?$/i;
        const featureLayerRe = /((?:Feature)|(?:Map))Server\/\d+\/?$/i;
        const imageServerRe = /ImageServer\/?/i;

        // Create a different layer type based on the URL.
        if (mapServerRe.test(url)) {
          // Query the map service to see if it is a tiled map service. (We cannot determine this based on the URL alone.)
          if (!layerOptions.id) {
            layerOptions.id = getMapNameFromUrl(url);
          }
          esriRequest({
            url,
            content: {
              f: "json"
            },
            callbackParamName: "callback",
            handleAs: "json"
          }).then(
            (response: any) => {
              if (response.singleFusedMapCache) {
                // Create a tile map service layer.
                self._triggerLayerCreate(
                  new ArcGISTiledMapServiceLayer(url, layerOptions)
                );
              } else {
                // Create a dynamic map service layer.
                self._triggerLayerCreate(
                  new ArcGISDynamicMapServiceLayer(url, layerOptions)
                );
              }
            },
            (error: Error) => {
              self._triggerError(error);
            }
          );
        } else if (featureLayerRe.test(url)) {
          self._triggerLayerCreate(new FeatureLayer(url, layerOptions));
        } else if (imageServerRe.test(url)) {
          self._triggerLayerCreate(
            new ArcGISImageServiceLayer(url, layerOptions)
          );
        }
      } else if (options.type) {
        if (/^OpenStreetMap$/i.test(options.type)) {
          self._triggerLayerCreate(new OpenStreetMapLayer(layerOptions));
        }
      }
    }
  }
});

export default layerFactory;
