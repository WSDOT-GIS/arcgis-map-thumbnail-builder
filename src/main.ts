import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Layer from "@arcgis/core/layers/Layer";
import "@fontsource/lato";

import "./index.css";
const [
  { default: Extent },
  { default: SpatialReference },
  { default: MapView },
] = await Promise.all([
  import("@arcgis/core/geometry/Extent"),
  import("@arcgis/core/geometry/SpatialReference"),
  import("@arcgis/core/views/MapView"),
]);

const map = await import("./createMap").then(({ createMap }) => createMap());

map.layers.on("after-add", addLayerToList);
map.watch("basemap", (newValue: __esri.Basemap, oldValue: __esri.Basemap) => {
  /* @__PURE__ */ console.debug("basemap changed", { newValue, oldValue });
  if (newValue) {
    newValue.baseLayers.forEach(addLayerToList);
    newValue.referenceLayers.forEach(addLayerToList);
  }
});

const [xmin, ymin, xmax, ymax] = [-116.91, 45.54, -124.79, 49.05];

const waExtent = new Extent({
  xmin,
  ymin,
  xmax,
  ymax,
  spatialReference: new SpatialReference({ wkid: 4326 }),
});

const mapView = new MapView({
  map,
  popupEnabled: false,
  container: "map",
  extent: waExtent,
  ui: {
    components: [],
  },
});

mapView.when(() => {
  mapView.constraints.geometry = mapView.extent;
});

/**
 * When a layer list item's delete button is clicked, this function
 * will remove the associated layer from the map and then
 * remove the list item from the list.
 * @param {Event} evt - Button click event
 */
function deleteLayer(this: HTMLButtonElement, evt: MouseEvent) {
  /** The button that was clicked. */
  const button = evt.target! as HTMLButtonElement;
  // Get the layer ID from the button's dataset.
  const layerId = button.dataset.layerId!;
  if (map) {
    // Remove the layer from the map.
    const layer = map.layers.find((layer) => layer.id === layerId);
    if (layer) {
      map.remove(layer);
    }
  }
  // Remove list item from ul.
  const li = button.parentElement;
  li?.remove();
}

type LayerWithUrl = Layer & Pick<FeatureLayer, "url">;

/**
 * Checks if the given layer has a URL property.
 *
 * @param layer - The layer to check.
 * @return True if the layer has a URL, false otherwise.
 */
function isLayerWithUrl(layer: Layer): layer is LayerWithUrl {
  return (layer as LayerWithUrl).url !== undefined;
}

/**
 * Adds a layer to an HTML list.
 * @param layer - Layer that was added to the map.
 */
function addLayerToList(layer: __esri.Layer) {
  // Get the list that will have a list item added to it.
  const ul = document.getElementById("layersList")!;
  // Create a list item associated with the added layer.
  const li = document.createElement("li");
  // Create a button that will allow the user to remove the layer from
  // the map along with the associated list item.
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.title = "Remove this layer from the map.";
  // Add data attribute with the layer's ID to the delete button and list item.
  for (const el of [deleteButton, li]) {
    el.setAttribute("data-layer-id", layer.id);
  }
  // Attach the delete button click event handler.
  deleteButton.addEventListener("click", deleteLayer);

  const a = document.createElement("a");
  if (isLayerWithUrl(layer)) {
    a.href = layer.url;
    a.textContent = layer.url;
  }
  li.appendChild(a);
  li.appendChild(deleteButton);
  ul.appendChild(li);
}

/**
 * Asynchronously captures a screenshot of the current map view.
 */
async function takeScreenshot() {
  // Take a screenshot of the mapView with PNG format
  const screenshot = await mapView.takeScreenshot({ format: "png" });

  // Get the canvas element by its ID and assert it as HTMLCanvasElement
  const screenshotCanvas = document.getElementById(
    "screenshotCanvas"
  ) as HTMLCanvasElement;

  // Get the 2D rendering context of the canvas
  const context = screenshotCanvas.getContext("2d");

  // Draw the screenshot's image data onto the canvas
  context?.putImageData(screenshot.data, 0, 0);

  // Return the screenshot object containing the image data
  return screenshot;
}

// Add the screenshot button to the DOM.
const screenshotButton = document.getElementById("screenshotButton")!;
screenshotButton.addEventListener("click", takeScreenshot);
