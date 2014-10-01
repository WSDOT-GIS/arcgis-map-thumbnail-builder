ArcGIS Map thumbnail builder
============================

Exports an image of an [ArcGIS API for JavaScript] map.

## Demo ##

http://wsdot-gis.github.io/arcgis-map-thumbnail-builder/

## Limitations ##

* There does not currently seem to be a way for Internet Explorer users to save the image displayed in the canvas, whereas Chrome and Firefox users can either right-click on the canvas or click the link below the canvas to save the image.

	This IE issue may be CORS related. It may be possible to work around it by using a proxy to call remote resources.

## Modules ##

### map-to-canvas ###

Exports the contents of an [esri/Map] to an HTML [Canvas] element.

Note that the [dojoConfig.gfxRenderer] option must be set to *"canvas"* in order for graphics layers to be exported.

```javascript
var dojoConfig = {
	gfxRenderer: "canvas"
}
```


### layerFactory ###

Allows many types of map layers to be generated from a URL without knowing ahead of time what layer type will be needed.

This module was copied from [its own repository](https://github.com/WSDOT-GIS/LayerFactory). 
It was copied instead of using a [git submodule] so that the site would work as a [GitHub Project Page].

[ArcGIS API for JavaScript]:https://developers.arcgis.com/javascript/
[Canvas]:https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
[dojoConfig.gfxRenderer]:http://dojotoolkit.org/reference-guide/1.10/dojox/gfx.html#renderer-options
[esri/Map]:https://developers.arcgis.com/javascript/jsapi/map-amd.html
[GitHub Project Page]:https://help.github.com/articles/creating-project-pages-manually
[git submodule]:http://www.git-scm.com/book/en/Git-Tools-Submodules