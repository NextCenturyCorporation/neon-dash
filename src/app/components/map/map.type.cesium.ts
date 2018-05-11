/*
 * Copyright 2017 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { ElementRef } from '@angular/core';
import { AbstractMap, BoundingBoxByDegrees, MapPoint, whiteString } from './map.type.abstract';
import { MapLayer } from './map.component';
import 'cesium/Build/Cesium/Cesium.js';
declare var Cesium;

export class CesiumNeonMap extends AbstractMap {
    private cesiumViewer: any;
    private popupEntity: any;
    private hoverTimeout: any;

    private selection = {
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

    private dataSources = new Map<MapLayer, any>();

    private hiddenEntities = new Map();

    doCustomInitialization(mapContainer: ElementRef) {
        // In order to get a minimal viable product in the short time span we have, we decided to disable the following Cesium features:
        //  3D Map and Columbus view.
        //  Rotating 2D map
        // These were mostly done to prevent the more complex problem of drawing on a 3D map.
        let cesiumSettings: any = {
            sceneMode: Cesium.SceneMode.SCENE3D,
            terrainProviderViewModels: [],
            imageryViewModels: [],
            fullscreenButton: false, //full screen button doesn't work in our context, so don't show it
            timeline: false, //disable timeline widget
            animation: false, // disable animation widget
            baseLayerPicker: true,
            mapMode2D: Cesium.MapMode2D.ROTATE,
            sceneModePicker: false,
            navigationHelpButton: false,
            infoBox: false,
            geocoder: false
        };

        if (this.mapOptions.customServer && this.mapOptions.customServer.useCustomServer) {
            cesiumSettings.baseLayerPicker = false;
            cesiumSettings.imageryProvider = new Cesium.WebMapServiceImageryProvider({
                url: this.mapOptions.customServer.mapUrl,
                layers: this.mapOptions.customServer.layer,
                parameters: {
                    transparent: true,
                    tiled: true,
                    requestWaterMask: true
                }
            });
        } else if (!cesiumSettings.baseLayerPicker) {
            // Stand-alone arcgis provider to be used if baseLayerPicker is turned off
            cesiumSettings.imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
                url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            });
        } else {
            let imagerySources = Cesium.createDefaultImageryProviderViewModels();
            let sourceId = 0;
            for (; sourceId < imagerySources.length; sourceId++) {
                let sourceName = imagerySources[sourceId].name;
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

        let west = -180.0;
        let east = 180.0;
        let north = 90.0;
        let south = -90.0;

        if (this.areBoundsSet()) {
            west = this.mapOptions.west;
            east = this.mapOptions.east;
            north = this.mapOptions.north;
            south = this.mapOptions.south;
        }

        Cesium.BingMapsApi.defaultKey = ''; // remove console line concerning Bing maps
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(west, south, east, north);
        let viewer = new Cesium.Viewer(mapContainer.nativeElement, cesiumSettings),
            scene = viewer.scene;

        viewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.SHIFT);

        viewer.screenSpaceEventHandler.setInputAction(this.onSelectDown.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_UP);
        viewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        viewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Disable rotation (for 2D map, although this is also true if 3D map becomes enabled)
        scene.screenSpaceCameraController.enableRotate = false;

        this.cesiumViewer = viewer;

        this.popupEntity = this.mapOptions.hoverPopupEnabled && this.cesiumViewer.entities.add({
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

        setTimeout(() => scene.mode === Cesium.SceneMode.SCENE3D && scene.morphTo2D(0), 700);
    }

    makeSelectionInexact() {
        //TODO: replace below with change color of rectangle if it already exists. No reason to create new one
        this.drawSelection();
    }

    drawSelection() {
        let entities = this.cesiumViewer.entities;
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
    }

    removeFilterBox() {
        if (this.selection.selectionGeometry) {
            this.cesiumViewer.entities.remove(this.selection.selectionGeometry);
            this.selection.selectionGeometry = null;
            this.selection.rectangle = null;
        }
    }

    addPoints(points: MapPoint[], layer?: MapLayer, cluster: boolean = false) {
        let ds = this.getDataSource(layer),
            entities = ds.entities;

        entities.suspendEvents();
        for (let point of points) {
            let color = Cesium.Color.fromCssColorString(point.cssColorString);

            entities.add({
                name: point.name,
                position: Cesium.Cartesian3.fromDegrees(point.lng, point.lat),
                point: {
                    show: true, // default
                    color: color, // default: WHITE
                    pixelSize: Math.min(Math.floor(12 * Math.pow(point.count, 0.5)), 60), // default: 1
                    outlineColor: point.cssColorString === whiteString ? Cesium.Color.BLACK : color, // default: BLACK
                    outlineWidth: 0, // default: 0
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
    }

    clearLayer(layer: MapLayer) {
        let ds = this.getDataSource(layer);
        this.cesiumViewer.dataSources.remove(ds, true);
        this.dataSources.delete(layer);

        // Remove any hidden points as well
        this.hiddenEntities.set(layer, null);
    }

    destroy() {
        return this.cesiumViewer && this.cesiumViewer.destroy();
    }

    hidePoints(layer: MapLayer, value: string) {
        let ds = this.getDataSource(layer);
        let entities = ds.entities;

        entities.suspendEvents();

        let allEntities = entities.values;

        let hiddenEntities: any[] = this.hiddenEntities.get(layer);
        if (!hiddenEntities) {
            hiddenEntities = [];
        }

        for (let entity of allEntities) {
            if (entity._colorByValue === value) {
                entities.removeById(entity.id);
                hiddenEntities.push(entity);
            }
        }

        entities.resumeEvents();
        this.hiddenEntities.set(layer, hiddenEntities);
    }

    unhidePoints(layer: MapLayer, value: string) {
        let ds = this.getDataSource(layer);
        let entities = ds.entities;

        entities.suspendEvents();

        let hiddenEntities: any[] = this.hiddenEntities.get(layer);

        if (hiddenEntities) {
            hiddenEntities = hiddenEntities.filter((entity) => {
                let matches = entity._colorByField === layer.colorField.columnName &&
                    entity._colorByValue === value;
                if (matches) {
                    entities.add(entity);
                }
                return !matches;
            });
        }

        entities.resumeEvents();
        this.hiddenEntities.set(layer, hiddenEntities);
    }

    unhideAllPoints(layer: MapLayer) {
        let ds = this.getDataSource(layer);
        let entities = ds.entities;

        entities.suspendEvents();

        let hiddenEntities: any[] = this.hiddenEntities.get(layer);

        if (hiddenEntities) {
            for (let entity of hiddenEntities) {
                entities.add(entity);
            }
        }

        entities.resumeEvents();
        this.hiddenEntities.set(layer, null);
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Filter support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    private onSelectDown(event) {
        this.selection.selectionDown = true;
        let geoPos = this.xyToLatLon(event.position);
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
    }

    private getBoundingBoxByDegrees(): BoundingBoxByDegrees {
        return new BoundingBoxByDegrees(
            Math.min(this.selection.startLat, this.selection.endLat),
            Math.max(this.selection.startLat, this.selection.endLat),
            Math.min(this.selection.startLon, this.selection.endLon),
            Math.max(this.selection.startLon, this.selection.endLon)
        );
    }

    private getSelectionRectangle() {
        let location = this.getBoundingBoxByDegrees();
        return Cesium.Rectangle.fromDegrees(location.west, location.south, location.east, location.north);
    }

    private onSelectUp(event) {
        if (this.selection.selectionDown && event && this.selection.selectionGeometry) {
            this.setEndPos(event.position);
            this.selection.selectionDown = false;
            let rect = this.getSelectionRectangle();
            let validFilter = (rect.east !== rect.west) && (rect.north !== rect.south);
            if (validFilter) {

                this.filterListener.filterByLocation(this.getBoundingBoxByDegrees());

                let zoomRect = rect;
                let vDiff = zoomRect.north - zoomRect.south;
                let hDiff = zoomRect.east - zoomRect.west;
                let delta = .05;
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
            } else {
                this.removeFilterBox();
            }
        }
    }

    private onMouseMove(movement) {
        let end = movement && movement.endPosition;
        if (this.selection.selectionDown && end) {
            this.setEndPos(end);
            this.drawSelection();
        } else if (end && (this.mapOptions.hoverPopupEnabled || this.mapOptions.hoverSelect)) {
            let viewer = this.cesiumViewer,
                objectsAtLocation = viewer.scene.drillPick(end); // get all entities under mouse

            if (this.mapOptions.hoverPopupEnabled) {
                let popup = this.popupEntity;

                // ensure that an object exists at cursor and that it isn't one of the map-feature entities (eg. popup)
                if (objectsAtLocation.length && !viewer.entities.contains(objectsAtLocation[0].id)) {
                    popup.position = objectsAtLocation[0].id.position.getValue();
                    popup.label.show = true;
                    popup.label.text = objectsAtLocation[0].id.name + '\n' + objectsAtLocation[0].id.description;
                } else {
                    popup.label.show = false;
                }
            }

            if (this.mapOptions.hoverSelect) {
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                    delete this.hoverTimeout;
                }

                if (objectsAtLocation.length) {
                    this.hoverTimeout = setTimeout(() => {
                        viewer.selectedEntity = objectsAtLocation[0].id;
                        delete this.hoverTimeout;
                    }, this.mapOptions.hoverSelect.hoverTime);
                }
            }
        }
    }

    private setEndPos(position) {
        let geoPos = this.xyToLatLon(position);
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
    }

    private correctSelectionToMapExtents() {
        let a = '1';
        let b = '2';
        if (a === b) {//TODO fix this later
            this.correctLatLon(this.selection, 'startLat', 'startX', 'startLon', 'startY');
            this.correctLatLon(this.selection, 'endLat', 'endX', 'endLon', 'endY');
        }
    }

    zoomIn() {
        //;
    }
    zoomOut() {
        //
    }
    private correctLatLon(obj, lat, x, lon, y) {
        let needCorrection = false;
        if (obj[lat] < -90) {
            obj[lat] = -90;
            needCorrection = true;
        } else if (obj[lat] > 90) {
            obj[lat] = 90;
            needCorrection = true;
        }
        if (obj[lon] < -180) {
            obj[lon] = -180;
            needCorrection = true;
        } else if (obj[lon] > 180) {
            obj[lon] = 180;
            needCorrection = true;
        }
        if (needCorrection) {
            let correctedXy = this.latLonToXy({lat: obj[lat], lon: obj[lon]});
            obj[x] = correctedXy.x;
            obj[y] = correctedXy.y;
        }
    }

    private latLonToXy(position) {
        let viewer = this.cesiumViewer;
        let p = viewer.scene.globe.ellipsoid.cartographicToCartesian({latitude: position.lat, longitude: position.lon});
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, p);
    }

    private xyToLatLon(position) {
        let viewer = this.cesiumViewer;
        let cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let longitude = Cesium.Math.toDegrees(cartographic.longitude);
            let latitude = Cesium.Math.toDegrees(cartographic.latitude);
            return {
                lat: latitude,
                lon: longitude
            };
        }
        return null;
    }

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Drawing support
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    private getDataSource(layer: MapLayer) {
        let dataSource = this.dataSources.get(layer);

        if (!dataSource) {
            dataSource = new Cesium.CustomDataSource(layer.title);
            this.dataSources.set(layer, dataSource);
            this.cesiumViewer.dataSources.add(dataSource);
        }

        return dataSource;
    }

    private clusterPoints(dataSource) {
        //greatly inspired by Cesium demo at https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Clustering.html&label=Showcases
        let enabled = true;

        dataSource.clustering.enabled = enabled;
        dataSource.clustering.pixelRange = this.mapOptions.clusterPixelRange;
        dataSource.clustering.minimumClusterSize = this.mapOptions.minClusterSize;

        let removeListener;
        let pinBuilder = new Cesium.PinBuilder();
        let pin50 = pinBuilder.fromText('50+', Cesium.Color.RED, 52).toDataURL();
        let pin40 = pinBuilder.fromText('40+', Cesium.Color.ORANGE, 52).toDataURL();
        let pin30 = pinBuilder.fromText('30+', Cesium.Color.YELLOW, 52).toDataURL();
        let pin20 = pinBuilder.fromText('20+', Cesium.Color.GREEN, 52).toDataURL();
        let pin10 = pinBuilder.fromText('10+', Cesium.Color.BLUE, 52).toDataURL();

        let singleDigitPins = new Array(8);
        for (let i = 0; i < singleDigitPins.length; ++i) {
            singleDigitPins[i] = pinBuilder.fromText('' + (i + 2), Cesium.Color.VIOLET, 52).toDataURL();
        }

        let customStyle = () => {
            if (Cesium.defined(removeListener)) {
                removeListener();
                removeListener = undefined;
            } else {
                removeListener = dataSource.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
                    cluster.label.show = true;
                    cluster.label.showBackground = true;
                    cluster.label.font = '18px sans-serif';
                    cluster.point.show = true;
                    //cluster.billboard.show = true;
                    cluster.billboard.id = cluster.label.id;
                    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

                    if (clusteredEntities.length >= 50) {
                        cluster.billboard.image = pin50;
                    } else if (clusteredEntities.length >= 40) {
                        cluster.billboard.image = pin40;
                    } else if (clusteredEntities.length >= 30) {
                        cluster.billboard.image = pin30;
                    } else if (clusteredEntities.length >= 20) {
                        cluster.billboard.image = pin20;
                    } else if (clusteredEntities.length >= 10) {
                        cluster.billboard.image = pin10;
                    } else {
                        cluster.billboard.image = singleDigitPins[clusteredEntities.length - 2];
                    }
                });
            }

            // force a re-cluster with the new styling
            let pixelRange = dataSource.clustering.pixelRange;
            dataSource.clustering.pixelRange = 0;
            dataSource.clustering.pixelRange = pixelRange;
        };

        // start with custom style
        customStyle();
    }
}
