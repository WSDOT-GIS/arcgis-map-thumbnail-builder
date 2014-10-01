/*global define*/
define(["dojo/Deferred", "dojo/promise/all"], function (Deferred, all) {

	/**
	 * Creates a query string.
	 * @param {Object} obj
	 * @returns {string}
	 */
	function objToQuery(obj) {
		var output = [];
		for (var propName in obj) {
			if (obj.hasOwnProperty) {
				output.push([propName, encodeURIComponent(obj[propName])].join("="));
			}
		}
		return output.join("&");
	}

	/**
	 * Creates a canvas element that displays the contents of a map.
	 * @param {esri/Map} map
	 * @param {HTMLCanvasElement} canvas
	 * @returns {dojo/promise/Promise}
	 */
	function mapToCanvas(map, canvas) {
		// TODO: Add the ability to specify image generation parameters (e.g., DPI).

		var ctx, requests;
		ctx = canvas.getContext("2d");
		// Clear any existing data from the canvas.
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Set the canvas's size to match that of the map.
		canvas.width = map.width;
		canvas.height = map.height;
		
		// This array will contain Deferreds indicating when the images have loaded.
		requests = [];

		// Loop through map layers
		map.layerIds.forEach(function (layerId) {
			var layer, url, exportParams, image, deferred;

			layer = map.getLayer(layerId);

			if (layer.url) {
				// Create Deferred for current image loading.
				deferred = new Deferred();
				// Setup map service image export parameters.
				exportParams = {
					f: "image",
					size: [map.width, map.height].join(","),
					bbox: [map.extent.xmin, map.extent.ymin, map.extent.xmax, map.extent.ymax].join(","),
					bboxSR: map.extent.spatialReference.wkid,
					format: "png",
					transparent: true
				};
				// Convert params to query string.
				exportParams = objToQuery(exportParams);
				// Create the export URL.
				url = [layer.url, "/export?", exportParams].join("");
				// Eliminate double slashes before "export".
				url = url.replace("//export", "/export");

				// Create the image element.
				image = new Image(map.width, map.height);
				image.crossOrigin = "anonymous";
				// Add the current Deferred to the array.
				requests.push(deferred);
				// Add an event listener that will resolve the Deferred once the image has loaded.
				image.addEventListener("load", function () {
					deferred.resolve(image);
				}, false);
				// Set the image's src attribute. This will begin the image loading.
				image.src = url;
			} else {
				// If the layer doesn't have a URL property, log info to console.
				console.log("No URL for layer: " + layerId);
			}
		});

		// Once all of the images have loaded, add them to the canvas.
		return all(requests).then(function (images) {
			// Add the map server images to the canvas.
			images.forEach(function (image) {
				ctx.drawImage(image, 0, 0);
			});

			// Get all of the graphics layer canvases in the map's root element
			// and add them to the combined map image canvas.
			var canvases = map.root.querySelectorAll("canvas");
			var tempCanvas;

			for (var i = 0, l = canvases.length; i < l; i++) {
				tempCanvas = canvases[i];
				ctx.drawImage(tempCanvas, 0, 0);
			}
			// Save the canvas image. (This allows the user to revert this version if further changes are made.)
			ctx.save();
		});
	}

	return mapToCanvas;
});