var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { AbstractMap, BoundingBoxByDegrees, whiteString } from './map.type.abstract';
import 'cesium/Build/Cesium/Cesium.js';
var CesiumNeonMap = /** @class */ (function (_super) {
    __extends(CesiumNeonMap, _super);
    function CesiumNeonMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.selection = {
            selectionDown: false,
            startY: 0,
            startX: 0,
            endX: 0,
            endY: 0,
            startLat: 0,
            startLon: 0,
            endLat: 0,
            endLon: 0,
            height: 0,
            width: 0,
            x: 0,
            y: 0,
            showSelection: false,
            selectionGeometry: null,
            rectangle: null
        };
        _this.dataSources = new Map();
        _this.hiddenEntities = new Map();
        return _this;
    }
    CesiumNeonMap.prototype.doCustomInitialization = function (mapContainer) {
        // In order to get a minimal viable product in the short time span we have, we decided to disable the following Cesium features:
        //  3D Map and Columbus view.
        //  Rotating 2D map
        // These were mostly done to prevent the more complex problem of drawing on a 3D map.
        var cesiumSettings = {
            sceneMode: Cesium.SceneMode.SCENE3D,
            terrainProviderViewModels: [],
            imageryViewModels: [],
            fullscreenButton: false,
            timeline: false,
            animation: false,
            baseLayerPicker: true,
            mapMode2D: Cesium.MapMode2D.ROTATE,
            sceneModePicker: false,
            navigationHelpButton: false,
            infoBox: false,
            geocoder: false
        };
        var customOptions = this.optionsFromConfig.customServer;
        if (customOptions && customOptions.useCustomServer) {
            cesiumSettings.baseLayerPicker = false;
            cesiumSettings.imageryProvider = new Cesium.WebMapServiceImageryProvider({
                url: this.optionsFromConfig.customServer.mapUrl,
                layers: this.optionsFromConfig.customServer.layer,
                parameters: {
                    transparent: true,
                    tiled: true,
                    requestWaterMask: true
                }
            });
        }
        else if (!cesiumSettings.baseLayerPicker) {
            // Stand-alone arcgis provider to be used if baseLayerPicker is turned off
            cesiumSettings.imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            });
        }
        else {
            var imagerySources = Cesium.createDefaultImageryProviderViewModels();
            var sourceId = 0;
            for (; sourceId < imagerySources.length; sourceId++) {
                var sourceName = imagerySources[sourceId].name;
                if ('ESRI World Street Map' === sourceName) {
                    break;
                }
            }
            if (sourceId === imagerySources.length) {
                sourceId = 0;
            }
            cesiumSettings.imageryProviderViewModels = imagerySources;
            //set default imagery to eliminate annoying text and using a bing key by default
            cesiumSettings.selectedImageryProviderViewModel = imagerySources[sourceId];
        }
        var west = -180.0;
        var east = 180.0;
        var north = 90.0;
        var south = -90.0;
        if (this.areBoundsSet()) {
            west = this.optionsFromConfig.west;
            east = this.optionsFromConfig.east;
            north = this.optionsFromConfig.north;
            south = this.optionsFromConfig.south;
        }
        Cesium.BingMapsApi.defaultKey = ''; // remove console line concerning Bing maps
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(west, south, east, north);
        var viewer = new Cesium.Viewer(mapContainer.nativeElement, cesiumSettings), scene = viewer.scene;
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onSelectDown.bind(this), Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP);
        viewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // Disable rotation (for 2D map, although this is also true if 3D map becomes enabled)
        scene.screenSpaceCameraController.enableRotate = false;
        this.cesiumViewer = viewer;
        this.popupEntity = this.optionsFromConfig.hoverPopupEnabled && this.cesiumViewer.entities.add({
            label: {
                show: false,
                showBackground: true,
                font: '14px monospace',
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(15, 0),
                eyeOffset: new Cesium.Cartesian3(0, 0, -6)
            }
        });
        setTimeout(function () { return scene.mode === Cesium.SceneMode.SCENE3D && scene.morphTo2D(0); }, 700);
    };
    CesiumNeonMap.prototype.makeSelectionInexact = function () {
        //TODO: replace below with change color of rectangle if it already exists. No reason to create new one
        this.drawSelection();
    };
    CesiumNeonMap.prototype.drawSelection = function () {
        var entities = this.cesiumViewer.entities;
        if (this.selection.selectionGeometry) {
            entities.removeById(this.selection.selectionGeometry.id);
        }
        this.selection.selectionGeometry = entities.add({
            name: 'SelectionRectangle',
            rectangle: {
                coordinates: new Cesium.CallbackProperty(this.getSelectionRectangle.bind(this), false),
                material: Cesium.Color.GREEN.withAlpha(0.0),
                height: 0,
                outline: true,
                outlineColor: this.isDrawnFilterExact ? Cesium.Color.GREEN : Cesium.Color.RED.withAlpha(.3)
            }
        });
    };
    CesiumNeonMap.prototype.removeFilterBox = function () {
        if (this.selection.selectionGeometry) {
            this.cesiumViewer.entities.remove(this.selection.selectionGeometry);
            this.selection.selectionGeometry = null;
            this.selection.rectangle = null;
        }
    };
    CesiumNeonMap.prototype.addPoints = function (points, layer, cluster) {
        if (cluster === void 0) { cluster = false; }
        var ds = this.getDataSource(layer), entities = ds.entities;
        entities.suspendEvents();
        for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
            var point = points_1[_i];
            var color = Cesium.Color.fromCssColorString(point.cssColorString);
            entities.add({
                name: point.name,
                position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat),
                point: {
                    show: true,
                    color: color,
                    pixelSize: Math.min(Math.floor(12 * Math.pow(point.count, 0.5)), 60),
                    outlineColor: point.cssColorString === whiteString ? Cesium.Color.BLACK : color,
                    outlineWidth: 0,
                    translucencyByDistance: new Cesium.NearFarScalar(100, .4, 8.0e6, 0.4)
                },
                description: point.description,
                colorByField: point.colorByField,
                colorByValue: point.colorByValue
            });
        }
        ds.clustering.enabled = cluster;
        if (cluster) {
            this.clusterPoints(ds);
        }
        entities.resumeEvents();
    };
    CesiumNeonMap.prototype.clearLayer = function (layer) {
        var ds = this.getDataSource(layer);
        this.cesiumViewer.dataSources.remove(ds, true);
        this.dataSources.delete(layer);
        // Remove any hidden points as well
        this.hiddenEntities.set(layer, null);
    };
    CesiumNeonMap.prototype.destroy = function () {
        return this.cesiumViewer && this.cesiumViewer.destroy();
    };
    CesiumNeonMap.prototype.hidePoints = function (layer, value) {
        var ds = this.getDataSource(layer);
        var entities = ds.entities;
        entities.suspendEvents();
        var allEntities = entities.values;
        var hiddenEntities = this.hiddenEntities.get(layer);
        if (!hiddenEntities) {
            hiddenEntities = [];
        }
        for (var _i = 0, allEntities_1 = allEntities; _i < allEntities_1.length; _i++) {
            var entity = allEntities_1[_i];
            if (entity._colorByValue === value) {
                entities.removeById(entity.id);
                hiddenEntities.push(entity);
            }
        }
        entities.resumeEvents();
        this.hiddenEntities.set(layer, hiddenEntities);
    };
    CesiumNeonMap.prototype.unhidePoints = function (layer, value) {
        var ds = this.getDataSource(layer);
        var entities = ds.entities;
        entities.suspendEvents();
        var hiddenEntities = this.hiddenEntities.get(layer);
        if (hiddenEntities) {
            hiddenEntities = hiddenEntities.filter(function (entity) {
                var matches = entity._colorByField === layer.colorField.columnName &&
                    entity._colorByValue === value;
                if (matches) {
                    entities.add(entity);
                }
                return !matches;
            });
        }
        entities.resumeEvents();
        this.hiddenEntities.set(layer, hiddenEntities);
    };
    CesiumNeonMap.prototype.unhideAllPoints = function (layer) {
        var ds = this.getDataSource(layer);
        var entities = ds.entities;
        entities.suspendEvents();
        var hiddenEntities = this.hiddenEntities.get(layer);
        if (hiddenEntities) {
            for (var _i = 0, hiddenEntities_1 = hiddenEntities; _i < hiddenEntities_1.length; _i++) {
                var entity = hiddenEntities_1[_i];
                entities.add(entity);
            }
        }
        entities.resumeEvents();
        this.hiddenEntities.set(layer, null);
    };
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Filter support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    CesiumNeonMap.prototype.onSelectDown = function (event) {
        this.selection.selectionDown = true;
        var geoPos = this.xyToLatLon(event.position);
        this.selection.startLat = geoPos.lat;
        this.selection.startLon = geoPos.lon;
        this.selection.startX = event.position.x;
        this.selection.startY = event.position.y;
        this.selection.endLat = geoPos.lat;
        this.selection.endLon = geoPos.lon;
        this.selection.endX = event.position.x;
        this.selection.endY = event.position.y;
        this.selection.x = event.position.x;
        this.selection.y = event.position.y;
        this.selection.width = 0;
        this.selection.height = 0;
        this.isDrawnFilterExact = true;
        this.drawSelection();
    };
    CesiumNeonMap.prototype.getBoundingBoxByDegrees = function () {
        return new BoundingBoxByDegrees(Math.min(this.selection.startLat, this.selection.endLat), Math.max(this.selection.startLat, this.selection.endLat), Math.min(this.selection.startLon, this.selection.endLon), Math.max(this.selection.startLon, this.selection.endLon));
    };
    CesiumNeonMap.prototype.getSelectionRectangle = function () {
        var location = this.getBoundingBoxByDegrees();
        return Cesium.Rectangle.fromDegrees(location.west, location.south, location.east, location.north);
    };
    CesiumNeonMap.prototype.onSelectUp = function (event) {
        if (this.selection.selectionDown && event && this.selection.selectionGeometry) {
            this.setEndPos(event.position);
            this.selection.selectionDown = false;
            var rect = this.getSelectionRectangle();
            var validFilter = (rect.east !== rect.west) && (rect.north !== rect.south);
            if (validFilter) {
                this.filterListener.filterByLocation(this.getBoundingBoxByDegrees());
                var zoomRect = rect;
                var vDiff = zoomRect.north - zoomRect.south;
                var hDiff = zoomRect.east - zoomRect.west;
                var delta = .05;
                zoomRect.north += vDiff * delta;
                zoomRect.south -= vDiff * delta;
                zoomRect.east += hDiff * delta;
                zoomRect.west -= hDiff * delta;
                this.cesiumViewer.camera.flyTo({
                    destination: zoomRect,
                    duration: .5
                });
                this.isDrawnFilterExact = true;
                this.drawSelection();
            }
            else {
                this.removeFilterBox();
            }
        }
    };
    CesiumNeonMap.prototype.onMouseMove = function (movement) {
        var _this = this;
        var end = movement && movement.endPosition;
        if (this.selection.selectionDown && end) {
            this.setEndPos(end);
            this.drawSelection();
        }
        else if (end && (this.optionsFromConfig.hoverPopupEnabled || this.optionsFromConfig.hoverSelect)) {
            var viewer_1 = this.cesiumViewer, objectsAtLocation_1 = viewer_1.scene.drillPick(end); // get all entities under mouse
            if (this.optionsFromConfig.hoverPopupEnabled) {
                var popup = this.popupEntity;
                // ensure that an object exists at cursor and that it isn't one of the map-feature entities (eg. popup)
                if (objectsAtLocation_1.length && !viewer_1.entities.contains(objectsAtLocation_1[0].id)) {
                    popup.position = objectsAtLocation_1[0].id.position.getValue();
                    popup.label.show = true;
                    popup.label.text = objectsAtLocation_1[0].id.name + '\n' + objectsAtLocation_1[0].id.description;
                }
                else {
                    popup.label.show = false;
                }
            }
            if (this.optionsFromConfig.hoverSelect) {
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                    delete this.hoverTimeout;
                }
                if (objectsAtLocation_1.length) {
                    this.hoverTimeout = setTimeout(function () {
                        viewer_1.selectedEntity = objectsAtLocation_1[0].id;
                        delete _this.hoverTimeout;
                    }, this.optionsFromConfig.hoverSelect.hoverTime);
                }
            }
        }
    };
    CesiumNeonMap.prototype.setEndPos = function (position) {
        var geoPos = this.xyToLatLon(position);
        if (geoPos) {
            this.selection.endLat = geoPos.lat;
            this.selection.endLon = geoPos.lon;
            this.selection.endX = position.x;
            this.selection.endY = position.y;
            this.correctSelectionToMapExtents();
            this.selection.x = Math.min(this.selection.endX, this.selection.startX);
            this.selection.y = Math.min(this.selection.endY, this.selection.startY);
            this.selection.width = Math.abs(this.selection.endX - this.selection.startX);
            this.selection.height = Math.abs(this.selection.endY - this.selection.startY);
        }
    };
    CesiumNeonMap.prototype.correctSelectionToMapExtents = function () {
        var a = '1';
        var b = '2';
        if (a === b) {
            this.correctLatLon(this.selection, 'startLat', 'startX', 'startLon', 'startY');
            this.correctLatLon(this.selection, 'endLat', 'endX', 'endLon', 'endY');
        }
    };
    CesiumNeonMap.prototype.correctLatLon = function (obj, lat, x, lon, y) {
        var needCorrection = false;
        if (obj[lat] < -90) {
            obj[lat] = -90;
            needCorrection = true;
        }
        else if (obj[lat] > 90) {
            obj[lat] = 90;
            needCorrection = true;
        }
        if (obj[lon] < -180) {
            obj[lon] = -180;
            needCorrection = true;
        }
        else if (obj[lon] > 180) {
            obj[lon] = 180;
            needCorrection = true;
        }
        if (needCorrection) {
            var correctedXy = this.latLonToXy({ lat: obj[lat], lon: obj[lon] });
            obj[x] = correctedXy.x;
            obj[y] = correctedXy.y;
        }
    };
    CesiumNeonMap.prototype.latLonToXy = function (position) {
        var viewer = this.cesiumViewer;
        var p = viewer.scene.globe.ellipsoid.cartographicToCartesian({ latitude: position.lat, longitude: position.lon });
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, p);
    };
    CesiumNeonMap.prototype.xyToLatLon = function (position) {
        var viewer = this.cesiumViewer;
        var cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            return {
                lat: latitude,
                lon: longitude
            };
        }
        return null;
    };
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Drawing support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    CesiumNeonMap.prototype.getDataSource = function (layer) {
        var dataSource = this.dataSources.get(layer);
        if (!dataSource) {
            dataSource = new Cesium.CustomDataSource(layer.title);
            this.dataSources.set(layer, dataSource);
            this.cesiumViewer.dataSources.add(dataSource);
        }
        return dataSource;
    };
    CesiumNeonMap.prototype.clusterPoints = function (dataSource) {
        //greatly inspired by Cesium demo at https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Clustering.html&label=Showcases
        var enabled = true;
        dataSource.clustering.enabled = enabled;
        dataSource.clustering.pixelRange = this.optionsFromConfig.clusterPixelRange;
        dataSource.clustering.minimumClusterSize = this.optionsFromConfig.minClusterSize;
        var removeListener;
        var pinBuilder = new Cesium.PinBuilder();
        var pin50 = pinBuilder.fromText('50+', Cesium.Color.RED, 52).toDataURL();
        var pin40 = pinBuilder.fromText('40+', Cesium.Color.ORANGE, 52).toDataURL();
        var pin30 = pinBuilder.fromText('30+', Cesium.Color.YELLOW, 52).toDataURL();
        var pin20 = pinBuilder.fromText('20+', Cesium.Color.GREEN, 52).toDataURL();
        var pin10 = pinBuilder.fromText('10+', Cesium.Color.BLUE, 52).toDataURL();
        var singleDigitPins = new Array(8);
        for (var i = 0; i < singleDigitPins.length; ++i) {
            singleDigitPins[i] = pinBuilder.fromText('' + (i + 2), Cesium.Color.VIOLET, 52).toDataURL();
        }
        var customStyle = function () {
            if (Cesium.defined(removeListener)) {
                removeListener();
                removeListener = undefined;
            }
            else {
                removeListener = dataSource.clustering.clusterEvent.addEventListener(function (clusteredEntities, cluster) {
                    cluster.label.show = true;
                    cluster.label.showBackground = true;
                    cluster.label.font = '18px sans-serif';
                    cluster.point.show = true;
                    //cluster.billboard.show = true;
                    cluster.billboard.id = cluster.label.id;
                    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                    if (clusteredEntities.length >= 50) {
                        cluster.billboard.image = pin50;
                    }
                    else if (clusteredEntities.length >= 40) {
                        cluster.billboard.image = pin40;
                    }
                    else if (clusteredEntities.length >= 30) {
                        cluster.billboard.image = pin30;
                    }
                    else if (clusteredEntities.length >= 20) {
                        cluster.billboard.image = pin20;
                    }
                    else if (clusteredEntities.length >= 10) {
                        cluster.billboard.image = pin10;
                    }
                    else {
                        cluster.billboard.image = singleDigitPins[clusteredEntities.length - 2];
                    }
                });
            }
            // force a re-cluster with the new styling
            var pixelRange = dataSource.clustering.pixelRange;
            dataSource.clustering.pixelRange = 0;
            dataSource.clustering.pixelRange = pixelRange;
        };
        // start with custom style
        customStyle();
    };
    return CesiumNeonMap;
}(AbstractMap));
export { CesiumNeonMap };
//# sourceMappingURL=map.type.cesium.js.map