/**
 * Asynchronously initializes a map instance. It creates a WebMap if
 * a valid webmap ID is present in the query string, otherwise an
 * EsriMap with a default basemap is created.
 *
 * @return A promise that resolves to a map instance.
 */
export async function createMap() {
  // Attempt to retrieve a webmap ID from the URL query string
  const webmapId = await import("./utils").then(({ getMapIdFromQueryString }) =>
    getMapIdFromQueryString()
  );

  // If an ID was found, create a WebMap instance
  if (webmapId) {
    // Dynamically import the WebMap module
    const { default: WebMap } = await import("@arcgis/core/WebMap");
    // Return a new WebMap using the retrieved ID
    return new WebMap({
      portalItem: { id: webmapId },
    });
  }

  // If no ID, create a default EsriMap instance
  else {
    // Dynamically import the EsriMap module
    const { default: EsriMap } = await import("@arcgis/core/Map");
    // Return a new EsriMap with a gray vector basemap
    return new EsriMap({
      basemap: "gray-vector",
    });
  }
}
