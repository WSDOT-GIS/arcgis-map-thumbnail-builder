import Deferred = require("dojo/Deferred");
import arcgisUtils = require("esri/arcgis/utils");
import Extent = require("esri/geometry/Extent");
import ArcGISTiledMapServiceLayer = require("esri/layers/ArcGISTiledMapServiceLayer");
import Layer = require("esri/layers/layer");
import EsriMap = require("esri/map");
import LayerFactory from "./layerFactory";
import mapToCanvas from "./map-to-canvas";

/**
 * When a layer list item's delete button is clicked, this function
 * will remove the associated layer from the map and then
 * remove the list item from the list.
 * @param {Event} evt - Button click event
 */
function deleteLayer(this: HTMLButtonElement, evt: MouseEvent) {
  const button = evt.target! as HTMLButtonElement; // The button that was clicked.
  const layerId = button.dataset.layerId!;
  if (map) {
    const layer = map.getLayer(layerId);
    // Remove the layer from the map.
    map.removeLayer(layer);
  }
  // Remove list item from ul.
  const li = button.parentElement!;
  li.parentElement!.removeChild(li);
}

/**
 * Adds a layer to an HTML list.
 * @param {Object} layerInfo
 * @param {esri/layers/Layer} layerInfo.layer - Layer that was added to the map.
 */
function addLayerToList(layerInfo: any) {
  // Get the list that will have a list item added to it.
  const ul = document.getElementById("layersList")!;
  // Get the layer that was added to the map.
  const layer = layerInfo.layer;
  // Create a list item associated with the added layer.
  const li = document.createElement("li");
  // Create a button that will allow the user to remove the layer from
  // the map along with the associated list item.
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.title = "Remove this layer from the map.";
  // Add data attribute with the layer's ID to the delete button and list item.
  [deleteButton, li].forEach(el => {
    el.setAttribute("data-layer-id", layerInfo.layer.id);
  });
  // Attach the delete button click event handler.
  deleteButton.addEventListener("click", deleteLayer);

  const a = document.createElement("a");
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
  const canvas = document.getElementById(
    "screenshotCanvas"
  )! as HTMLCanvasElement;
  mapToCanvas(map!, canvas).then(() => {
    // Update the data URL.
    let url;
    try {
      url = canvas.toDataURL();
    } catch (e) {
      console.log("Error generating image URL", e.message);
      alert(e.message);
    }
    if (url) {
      const link = document.getElementById("dataLink")! as HTMLAnchorElement;
      link.href = url;
    }
  });
}

let map: EsriMap | undefined;
let layerFactory: any | undefined;

/**
 * Response from the arcgisUtils.createMap type.
 */
interface ICreateMapResponse {
  map: EsriMap;
  clickEventHandle?: any;
  clickEventListener?: (...params: any[]) => any;
  itemInfo?: {
    item: any;
    itemData: any;
    errors?: any[];
  };
}

/**
 * Creates the map.
 * @param mapId Optional ArcGIS Online item id for a webmap.
 */
async function createMap(mapId?: string | null): Promise<ICreateMapResponse> {
  // If caller needs to alter map, this function will need to be modified to return a Promise.
  const domId = "map";

  // Define extent coords based on http://epsg.io/1416-area
  const [xmax, ymin, xmin, ymax] = [-116.91, 45.54, -124.79, 49.05];

  // Initialize the map options object used for constructing the map.
  const mapOptions: any = {
    extent: new Extent({ xmin, ymin, xmax, ymax }),
    showAttribution: false,
    showInfoWindowOnClick: false,
    slider: false,
    logo: false
  };

  if (mapId) {
    // Web map will have predefined extent. Remove options that would override this.
    delete mapOptions.extent;

    try {
      const response: ICreateMapResponse = await arcgisUtils.createMap(
        mapId,
        domId,
        {
          mapOptions
        }
      );

      // Create the webmap.
      map = response.map;
      // Add existing layers to list.
      map.layerIds.concat(map.graphicsLayerIds).forEach(layerId => {
        addLayerToList({ layer: map!.getLayer(layerId) });
      });
      map.on("layer-add", addLayerToList);
      return response;
    } catch (error) {
      console.log("Create map error", error);
      throw error;
    }
  } else {
    return new Promise<ICreateMapResponse>((resolve, reject) => {
      try {
        // mapOptions.basemap = "gray-vector"; // TODO: fix: App does not currently support vector tile layers
        map = new EsriMap(domId, mapOptions);
        const basemapLayer = new ArcGISTiledMapServiceLayer(
          "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer"
        );
        map.addLayer(basemapLayer);
        resolve({ map });
        map.on("layer-add", addLayerToList);
      } catch (error) {
        reject(error);
      }
    });
  }
}

layerFactory = new LayerFactory();

// Add layer to the map once created by the LayerFactory.
layerFactory.on("layer-create", (response: any) => {
  if (response.layer) {
    map!.addLayer(response.layer);
  } else if (response.error) {
    console.error(response.error);
  }
});

// Create the layer from the user-specified URL.
(document.forms as any).addLayerForm.onsubmit = function() {
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
  const re = /webmap=([^&]+)/;
  let match: RegExpMatchArray | null | undefined;
  if (document.location.search) {
    match = document.location.search.match(re);
  }
  return match ? decodeURIComponent(match[1]) : null;
}

createMap(getMapIdFromQueryString());

const screenshotButton = document.getElementById("screenshotButton")!;
screenshotButton.addEventListener("click", takeScreenshot);
