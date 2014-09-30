/*global define*/
/*jslint nomen:true*/
/// <reference path="../jsapi_vsdoc12_v33.js" />
define([
	"require",
	"dojo/_base/declare",
	"dojo/Evented",
	"esri/request",
	"esri/layers/WebTiledLayer",
	"esri/layers/OpenStreetMapLayer",
	"esri/layers/FeatureLayer",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/layers/ArcGISImageServiceLayer",
	"dojo/io/script"
], function (require, declare, Evented, esriRequest, WebTiledLayer, OpenStreetMapLayer, FeatureLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer) {
	"use strict";
	var layerFactory;

	/**
	 * Creates an OpenCycleMap WebTiledLayer
	 * @param {string} type - Valid values: "Transport", "Landscape", "default"
	 * @returns {esri/layers/WebTiledLayer}
	 */
	function CreateOpenCycleMapLayer(type) {
		var subdomains = ["a", "b", "c"], urlTemplate, id, layer;

		// Set the URL template.
		if (/Transport/i.test(type)) {
			urlTemplate = "http://${subDomain}.tile2.opencyclemap.org/transport/${level}/${col}/${row}.png";
			id = "openCycleMapTransport";
		} else if (/Landscape/i.test(type)) {
			urlTemplate = "http://${subDomain}.tile3.opencyclemap.org/landscape/${level}/${col}/${row}.png";
			id = "openCycleMapLandscape";
		} else {
			urlTemplate = "http://${subDomain}.tile.opencyclemap.org/cycle/${level}/${col}/${row}.png";
			id = "openCycleMap";
		}

		layer = new WebTiledLayer(urlTemplate, {
			id: id,
			subDomains: subdomains,
			copyright: '© OpenStreetMap contributors'
		});

		return layer;
	}

	/**
	 * Creates a MapQuest layer.
	 * @param {string} [type] - Set this to "Aerial" for MapQuest OpenAerial tiles, any other value (incl. undefined) for MapQuestOSM.
	 * @returns {esri/layers/WebTiledLayer}
	 */
	function createMapQuestLayer(type) {
		var layer, subdomains = ["otile1", "otile2", "otile3", "otile4"], ext = "png";
		if (!!type && /Aerial/i.test(type)) {
			layer = new WebTiledLayer("http://${subDomain}.mqcdn.com/tiles/1.0.0/sat/${level}/${col}/${row}." + ext, {
				"id": "mapQuestOpenAerial",
				"subDomains": subdomains,
				"copyright": 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency, Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
			});
		} else {
			layer = new WebTiledLayer("http://${subDomain}.mqcdn.com/tiles/1.0.0/map/${level}/${col}/${row}." + ext, {
				"id": "mapQuestOSM",
				"subDomains": subdomains,
				"copyright": '© OpenStreetMap contributors, Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
			});
		}
		return layer;
	}

	layerFactory = declare([Evented], {
		constructor: function (/*options*/) {
			// this.map = options.map || null;
		},
		_triggerLayerCreate: function (layer) {
			this.emit("layer-create", {
				layer: layer
			});
		},
		_triggerError: function (error) {
			this.emit("layer-create", {
				error: error
			});
		},

		/** Creates a layer. Once the layer is created an event will be triggered.
		* @param {Object} options The options provided will vary depending on the type of layer to be created.
		* @param {String} [options.url] The URL used to define service types such as ArcGISTiledMapServiceLayer, ArcGISDynamicServiceLayer, and ArcGISImageServiceLayer.
		* @param {Object} [options.options] Layer constructors that take an options parameter can have those options provided via this property.
		* @param {String} [options.type] The name of the type, for situations where the type cannot be determined by a URL, or if a URL is not required (e.g., OpenStreetMapLayer.).
		*/
		createLayer: function (options) {
			var self = this, mapServerRe, featureLayerRe, imageServerRe, url, layerOptions = options.options || {};

			/**
			Extracts the name of a map service from its URL.
			@param {String} url
			@returns {String}
			*/
			function getMapNameFromUrl(url) {
				var arcgisRe = /services\/(.+)\/\w+Server/i, name, match;
				match = url.match(arcgisRe);
				if (match) {
					name = match[1]; // The captured name part of the URL.
				}
			}

			if (options.url) {
				url = options.url;

				mapServerRe = /MapServer\/?$/i;
				featureLayerRe = /((?:Feature)|(?:Map))Server\/\d+\/?$/i;
				imageServerRe = /ImageServer\/?/i;


				// Create a different layer type based on the URL.
				if (mapServerRe.test(url)) {
					// Query the map service to see if it is a tiled map service. (We cannot determine this based on the URL alone.)
					if (!layerOptions.id) {
						layerOptions.id = getMapNameFromUrl(url);
					}
					esriRequest({
						url: url,
						content: {
							f: "json"
						},
						callbackParamName: "callback",
						handleAs: "json"
					}).then(function (response) {
						if (response.singleFusedMapCache) {
							// Create a tile map service layer.
							self._triggerLayerCreate(new ArcGISTiledMapServiceLayer(url, layerOptions));
						} else {
							// Create a dynamic map service layer.
							self._triggerLayerCreate(new ArcGISDynamicMapServiceLayer(url, layerOptions));
						}
					}, function (error) {
						self._triggerError(error);
					});
				} else if (featureLayerRe.test(url)) {
					self._triggerLayerCreate(new FeatureLayer(url, layerOptions));
				} else if (imageServerRe.test(url)) {
					self._triggerLayerCreate(new ArcGISImageServiceLayer(url, layerOptions));
				}
			} else if (options.type) {
				if (/^OpenStreetMap$/i.test(options.type)) {
					self._triggerLayerCreate(new OpenStreetMapLayer(layerOptions));
				} else if (/^MapQuest/i.test(options.type)) { // /^MapQuest\s?((O(?:pen)?S(?:treet)?M(?:ap)?)|(Open\s?Aerial))$/i.test(options.type)) {
					self._triggerLayerCreate(createMapQuestLayer(options.type));
				} else if (/^OpenCycleMap/i.test(options.type)) {
					self._triggerLayerCreate(CreateOpenCycleMapLayer(options.type));
				}

			}
		}
	});

	return layerFactory;
});