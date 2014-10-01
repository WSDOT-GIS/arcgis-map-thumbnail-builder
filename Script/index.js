/*global require */

require([
	"esri/map",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"layerFactory",
	"map-to-canvas"
], function (Map, ArcGISTiledMapServiceLayer, LayerFactory, mapToCanvas) {

	function addLayerToList(layerInfo) {
		var ul = document.getElementById("layersList");
		var layer = layerInfo.layer;
		var li = document.createElement("li");
		li.setAttribute("data-layer-id", layerInfo.layer.id);
		li.textContent = layer.url;
		ul.appendChild(li);
	}

	function takeScreenshot() {
		var canvas = document.getElementById("screenshotCanvas");
		mapToCanvas(map, canvas).then(function () {
			// Update the data URL.
			var url;
			try {
				url = canvas.toDataURL();
			} catch (e) {
				console.log("Error generating image URL", e.message);
			}
			if (url) {
				document.getElementById("dataLink").href = url;
			}
		});
	}

	var map, bgLayer, layerFactory;

	layerFactory = new LayerFactory();

	layerFactory.on("layer-create", function (response) {
		if (response.layer) {
			map.addLayer(response.layer);
		} else if (response.error) {
			console.error(response.error);
		}
	});

	document.forms.addLayerForm.onsubmit = function () {
		console.log("url", this.layerUrl.value);
		layerFactory.createLayer({
			url: this.layerUrl.value
		});

		return false;
	};


	bgLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer", {
		useMapImage: true
	});

	map = new Map("map", {
		center: [-120.80566406246835, 47.41322033015946],
		zoom: 5,
		showAttribution: false,
		showInfoWindowOnClick: false,
		slider: false,
		logo: false
	});

	map.on("layer-add", addLayerToList);

	map.addLayer(bgLayer);

	var screenshotButton = document.getElementById("screenshotButton");
	screenshotButton.addEventListener("click", takeScreenshot);
});