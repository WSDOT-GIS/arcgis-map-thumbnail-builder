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
	 */
	function mapToCanvas(map, canvas) {
		var ctx;
		if (!canvas) {
			canvas = document.createElement("canvas");
		} else {
			ctx = canvas.getContext("2d");
			ctx.clearRect(0,0,canvas.width, canvas.height);
		}
		canvas.width = map.width;
		canvas.height = map.height;
		if (!ctx) {
			ctx = canvas.getContext("2d");
		}
		var requests = [];

		// Loop through map layers
		map.layerIds.forEach(function (layerId) {
			var layer = map.getLayer(layerId);
			var url;
			var exportParams;
			var image;
			var deferred;

			if (layer.url) {
				deferred = new Deferred();
				exportParams = {
					f: "image",
					size: [map.width, map.height].join(","),
					bbox: [map.extent.xmin, map.extent.ymin, map.extent.xmax, map.extent.ymax].join(","),
					bboxSR: map.extent.wkid,
					format: "png",
					transparent: true
				};
				exportParams = objToQuery(exportParams);
				url = [layer.url, "/export?", exportParams].join("");
				url = url.replace("//export", "/export");

				image = new Image(map.width, map.height);
				requests.push(deferred);
				image.addEventListener("load", function () {
					// ctx.drawImage(image, 0, 0);
					deferred.resolve(image);
				}, false);
				image.src = url;
			} else {
				console.log("No URL for layer: " + layerId);
			}
		});

		// Once all of the images have loaded, add them to the canvas.
		all(requests).then(function (images) {
			images.forEach(function (image) {
				ctx.drawImage(image, 0, 0);
			});

			var canvases = map.root.querySelectorAll("canvas");
			var tempCanvas;

			for (var i = 0, l = canvases.length; i < l; i++) {
				tempCanvas = canvases[i];
				ctx.drawImage(tempCanvas, 0, 0);
			}
		});




		return canvas;
	}

	return mapToCanvas;
});