import Deferred = require("dojo/Deferred");
import all = require("dojo/promise/all");
import Layer = require("esri/layers/layer");
import EsriMap = require("esri/map");

/**
 * Creates a query string.
 * @param {Object} obj
 * @returns {string}
 */
function objToQuery(obj: any): string {
  const output = [];
  for (const propName in obj) {
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
 * @returns {Promise<HTMLImageElement[]>}
 */
export default async function mapToCanvas(
  map: EsriMap,
  canvas: HTMLCanvasElement
) {
  // TODO: Add the ability to specify image generation parameters (e.g., DPI).

  const ctx = canvas.getContext("2d")!;
  // Clear any existing data from the canvas.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set the canvas's size to match that of the map.
  canvas.width = map.width;
  canvas.height = map.height;

  // This array will contain Deferreds indicating when the images have loaded.
  const requests = new Array<Promise<HTMLImageElement>>();

  // Loop through map layers
  for (const layerId of map.layerIds) {
    const layer = map.getLayer(layerId);

    if (layer.url && layer.visibleAtMapScale) {
      // Create Deferred for current image loading.
      const promise = getLayerImage(layer);
      requests.push(promise);
    } else {
      // If the layer doesn't have a URL property, log info to console.
      console.log("No URL for layer: " + layerId);
    }
  }

  try {
    // Once all of the images have loaded, add them to the canvas.
    const images = await Promise.all(requests);
    // Add the map server images to the canvas.
    images.forEach((image: HTMLImageElement) => {
      ctx.drawImage(image, 0, 0);
    });

    // Get all of the graphics layer canvases in the map's root element
    // and add them to the combined map image canvas.
    const canvases = (map.root as Element).querySelectorAll("canvas");

    for (const tempCanvas of canvases.values()) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
    // Save the canvas image. (This allows the user to revert this version if further changes are made.)
    ctx.save();
    return images;
  } catch (error) {
    console.error(error);
    alert("Error creating thumbnail.");
  }

  async function getLayerImage(layer: Layer) {
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      // Setup map service image export parameters.
      let exportParams: any = {
        f: "image",
        size: [map.width, map.height].join(","),
        bbox: [
          map.extent.xmin,
          map.extent.ymin,
          map.extent.xmax,
          map.extent.ymax
        ].join(","),
        bboxSR: map.extent.spatialReference.wkid,
        format: "png",
        transparent: true
      };
      // Convert params to query string.
      exportParams = objToQuery(exportParams);
      // Create the export URL.
      let url = [layer.url, "/export?", exportParams].join("");
      // Eliminate double slashes before "export".
      url = url.replace("//export", "/export");
      // Create the image element.
      const image = new Image(map.width, map.height);
      image.crossOrigin = "anonymous";
      // Add an event listener that will resolve the Deferred once the image has loaded.
      image.addEventListener(
        "load",
        () => {
          resolve(image);
        },
        false
      );
      image.addEventListener("error", errorEvent => {
        reject({
          error: errorEvent,
          image
        });
      });
      // Set the image's src attribute. This will begin the image loading.
      image.src = url;
    });
    return promise;
  }
}
