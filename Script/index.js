/*global require */

require([
	"esri/map",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/arcgis/utils",
	"dojo/Deferred",
	"layerFactory",
	"map-to-canvas",
], function (Map, ArcGISTiledMapServiceLayer, arcgisUtils, Deferred, LayerFactory, mapToCanvas) {
	"use strict";

	/**
	 * When a layer list item's delete button is clicked, this function
	 * will remove the associated layer from the map and then
	 * remove the list item from the list.
	 * @param {Event} evt - Button click event
	 */
	function deleteLayer(evt) {
		var button = evt.target; // The button that was clicked.
		var layerId = button.dataset.layerId;
		var layer = map.getLayer(layerId);
		// Remove the layer from the map.
		map.removeLayer(layer);
		// Remove list item from ul.
		var li = button.parentElement;
		li.parentElement.removeChild(li);
	}

	/**
	 * Adds a layer to an HTML list.
	 * @param {Object} layerInfo
	 * @param {esri/layers/Layer} layerInfo.layer - Layer that was added to the map.
	 */
	function addLayerToList(layerInfo) {
		var ul, layer, li, a, deleteButton;
		// Get the list that will have a list item added to it.
		ul = document.getElementById("layersList");
		// Get the layer that was added to the map.
		layer = layerInfo.layer;
		// Create a list item associated with the added layer.
		li = document.createElement("li");
		// Create a button that will allow the user to remove the layer from
		// the map along with the associated list item.
		deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.textContent = "Delete";
		deleteButton.title = "Remove this layer from the map.";
		// Add data attribute with the layer's ID to the delete button and list item.
		[deleteButton, li].forEach(function (el) {
			el.setAttribute("data-layer-id", layerInfo.layer.id);
		});
		// Attach the delete button click event handler.
		deleteButton.addEventListener("click", deleteLayer);

		a = document.createElement("a");
		a.href = layer.url;
		a.textContent = layer.url;
		li.appendChild(a);
		li.appendChild(deleteButton);
		ul.appendChild(li);
	}

	/**
	 * Adds images of map layers to the canvas element.
	 * Updates the data URL link to the image currently displayed in the canvas.
	 */
	function takeScreenshot() {
		var canvas = document.getElementById("screenshotCanvas");
		mapToCanvas(map, canvas).then(function () {
			// Update the data URL.
			var url;
			try {
				url = canvas.toDataURL();
			} catch (e) {
				console.log("Error generating image URL", e.message);
				alert(e.message);
			}
			if (url) {
				document.getElementById("dataLink").href = url;
			}
		});
	}

	var map, layerFactory;

	/**
	 * Creates the map.
	 */
	function createMap(mapId) {
		// If caller needs to alter map, this function will need to be modified to return a Promise.
		var bgLayer, output, domId = "map", mapOptions;

		mapOptions = {
			center: [-120.80566406246835, 47.41322033015946],
			zoom: 5,
			showAttribution: false,
			showInfoWindowOnClick: false,
			slider: false,
			logo: false
		};

		if (mapId) {
			// Web map will have predefined extent. Remove options that would override this.
			delete mapOptions.center;
			delete mapOptions.zoom;

			// Create the webmap.
			output = arcgisUtils.createMap(mapId, domId, {
				mapOptions: mapOptions
			}).then(function (response) {
				map = response.map;
				// Add existing layers to list.
				map.layerIds.concat(map.graphicsLayerIds).forEach(function (layerId) {
					addLayerToList({ layer: map.getLayer(layerId) });
				});
				map.on("layer-add", addLayerToList);
			}, function (error) {
				console.log("Create map error", error);
			});
		} else {
			output = new Deferred();
			map = new Map(domId, mapOptions);
			output.resolve({ map: map });


			bgLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer");
			map.addLayer(bgLayer);
			map.on("layer-add", addLayerToList);
		}
		return output;
	}


	layerFactory = new LayerFactory();

	// Add layer to the map once created by the LayerFactory.
	layerFactory.on("layer-create", function (response) {
		if (response.layer) {
			map.addLayer(response.layer);
		} else if (response.error) {
			console.error(response.error);
		}
	});

	// Create the layer from the user-specified URL.
	document.forms.addLayerForm.onsubmit = function () {
		console.log("url", this.layerUrl.value);
		layerFactory.createLayer({
			url: this.layerUrl.value
		});

		return false;
	};

	/**
	 * Gets the id parameter from the query string. Returns null if there is no such parameter.
	 * @returns {(string|null)}
	 */
	function getMapIdFromQueryString() {
		var re = /webmap=([^&]+)/i, match;
		if (document.location.search) {
			match = document.location.search.match(re);
		}
		return match ? decodeURIComponent(match[1]) : null;
	}

	getMapIdFromQueryString();

	createMap(getMapIdFromQueryString());

	var screenshotButton = document.getElementById("screenshotButton");
	screenshotButton.addEventListener("click", takeScreenshot);
});