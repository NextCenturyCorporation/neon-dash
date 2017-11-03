import {VisualizationService} from '../../services/visualization.service';

declare let Cesium: any;
import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    ElementRef,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {ColorSchemeService} from '../../services/color-scheme.service';
import {FieldMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import {BaseLayeredNeonComponent} from '../base-neon-component/base-layered-neon.component';
import 'cesium/Build/Cesium/Cesium.js';
import * as _ from 'lodash';
import {color} from 'd3';

export class MapLayer {
    title: string;
    latitudeField: FieldMetaData;
    longitudeField: FieldMetaData;
    sizeField: FieldMetaData;
    colorField: FieldMetaData;
    dateField: FieldMetaData;
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends BaseLayeredNeonComponent implements OnInit,
    OnDestroy, AfterViewInit {

    private FIELD_ID: string;
    private filters: {
        id: string,
        fieldsByLayer: {
            latField: string,
            lonField: string
        },
        filterName: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        latitudeField: string,
        longitudeField: string,
        sizeField: string,
        colorField: string,
        dateField: string,
        limit: number,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        layers: {
            title: string,
            database: string,
            table: string,
            latitudeField: string,
            longitudeField: string,
            sizeField: string,
            colorField: string,
            dateField: string
        }[],
        clustering: string,
        minClusterSize: number,
        clusterPixelRange: number,
        hoverSelect: {
            hoverTime: number,
        },
        hoverPopupEnabled: boolean,
        west: number,
        east: number,
        north: number,
        south: number
    };
    public active: {
        layers: MapLayer[],
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        data: number[][],
        unusedColors: string[],
        nextColorIndex: number,
        clustering: string,
        minClusterSize: number,
        clusterPixelRange: number
    };

    public selection: {
        selectionDown: boolean,
        startY: number,
        startX: number,
        endX: number,
        endY: number,
        startLat: number,
        startLon: number,
        endLat: number,
        endLon: number,
        height: number,
        width: number,
        x: number,
        y: number,
        showSelection: boolean,
        selectionGeometry: any,
        rectangle: any,
        isExact: boolean
    };
    public colorByFields: string[] = [];

    public filterVisible: boolean[] = [];

    private colorSchemeService: ColorSchemeService;

    private cesiumViewer: any;
    private hoverTimeout: any;
    private popupEntity: any;

    @ViewChild('cesiumContainer') cesiumContainer: ElementRef;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        (<any>window).CESIUM_BASE_URL = 'assets/Cesium';
        this.colorSchemeService = colorSchemeSrv;
        this.FIELD_ID = '_id';
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            latitudeField: this.injector.get('latitudeField', null),
            longitudeField: this.injector.get('longitudeField', null),
            colorField: this.injector.get('colorField', null),
            sizeField: this.injector.get('sizeField', null),
            dateField: this.injector.get('dateField', null),
            limit: this.injector.get('limit', 1000),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            layers: this.injector.get('layers', []),
            clustering: this.injector.get('clustering', 'points'),
            minClusterSize: this.injector.get('minClusterSize', 5),
            clusterPixelRange: this.injector.get('clusterPixelRange', 15),
            hoverSelect: this.injector.get('hoverSelect', null),
            hoverPopupEnabled: this.injector.get('hoverPopupEnabled', false),
            west: this.injector.get('west', null),
            east: this.injector.get('east', null),
            north: this.injector.get('north', null),
            south: this.injector.get('south', null)
        };

        this.filters = [];

        this.active = {
            layers: [],
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            data: [],
            nextColorIndex: 0,
            unusedColors: [],
            clustering: this.optionsFromConfig.clustering,
            minClusterSize: this.optionsFromConfig.minClusterSize,
            clusterPixelRange: this.optionsFromConfig.clusterPixelRange
        };

        this.selection = {
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
            rectangle: null,
            isExact: true
        };
        this.queryTitle = this.optionsFromConfig.title || 'Map';
        //this.addEmptyLayer();
    };

    subNgOnInit() {

    }

    postInit() {
        // There is one layer automatically added
        for (let i = 1; i < this.optionsFromConfig.layers.length; i++) {
            this.addEmptyLayer();
        }
    }

    subRemoveLayer(index: number) {
        this.active.layers.splice(index, 1);

        // Update the map
        this.handleChangeLimit();
    }

    subGetBindings(bindings: any) {
        bindings.limit = this.active.limit;
        // The map layers objects are different, clear out the old stuff;
        bindings.layers = [];
        for (let layer of this.active.layers) {
            bindings.layers.push({
                title: layer.title,
                latitudeField: layer.latitudeField.columnName,
                longitudeField: layer.longitudeField.columnName,
                sizeField: layer.sizeField.columnName,
                colorField: layer.colorField.columnName,
                dateField: layer.dateField.columnName
            });
        }
    }

    ngAfterViewInit() {
        let imagerySources = Cesium.createDefaultImageryProviderViewModels();
        // In order to get a minimal viable product in the short time span we have, we decided to disable the following Cesium features:
        //  3D Map and Columbus view.
        //  Rotating 2D map
        // These were mostly done to prevent the more complex problem of drawing on a 3D map.
        let sourceId = 0;
        for ( ; sourceId < imagerySources.length; sourceId++) {
            let sourceName = imagerySources[sourceId].name;
            if ('ESRI World Street Map' === sourceName) {
                break;
            }
        }
        if ( sourceId === imagerySources.length) {
            sourceId = 0;
        }
        console.log(sourceId);
        let west  = -180.0;
        let east = 180.0;
        let north = 90.0;
        let south = -90.0;

        if (this.optionsFromConfig.west != null) {
            west = this.optionsFromConfig.west;
            east = this.optionsFromConfig.east;
            north = this.optionsFromConfig.north;
            south = this.optionsFromConfig.south;
        }

        let rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;
        this.cesiumViewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
            sceneMode: Cesium.SceneMode.SCENE3D,
            imageryProviderViewModels: imagerySources,
            //set default imagery to eliminate annoying text and using a bing key by default
            selectedImageryProviderViewModel: imagerySources[sourceId],
            terrainProviderViewModels: [],
            fullscreenButton: false, //full screen button doesn't work in our context, so don't show it
            timeline: false, //disable timeline widget
            animation: false, // disable animation widget
            mapMode2D: Cesium.MapMode2D.ROTATE,
            sceneModePicker: false,
            navigationHelpButton: false,
            infoBox: true
        });

        this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_CLICK, Cesium.KeyboardEventModifier.SHIFT);

        this.cesiumViewer.screenSpaceEventHandler.setInputAction(this.onSelectDown.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.setInputAction(this.onSelectUp.bind(this),
            Cesium.ScreenSpaceEventType.LEFT_UP);
        this.cesiumViewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        this.cesiumViewer.screenSpaceEventHandler.setInputAction(this.onMouseMove.bind(this),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        //Disable rotation (for 2D map, although this is also true if 3D map becomes enabled)
        this.cesiumViewer.scene.screenSpaceCameraController.enableRotate = false;
       // this.cesiumViewer.camera.flyHome(0);

        this.popupEntity = this.optionsFromConfig.hoverPopupEnabled && this.cesiumViewer.entities.add({
            label : {
                show : false,
                showBackground : true,
                font : '14px monospace',
                horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
                verticalOrigin : Cesium.VerticalOrigin.TOP,
                pixelOffset : new Cesium.Cartesian2(15, 0),
                eyeOffset: new Cesium.Cartesian3(0, 0, -6)
            }
        });

        // Draw everything
        this.handleChangeLimit();

        let scene = this.cesiumViewer.scene;
        setTimeout(() => scene.mode === Cesium.SceneMode.SCENE3D && scene.morphTo2D(0), 700);
    }

    subNgOnDestroy() {
        if (this.cesiumViewer) {
            // This must be called to stop Cesium's event loop
            this.cesiumViewer.destroy();
        }
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    subAddEmptyLayer() {
        this.active.layers.push({
          title: '',
          latitudeField: new FieldMetaData(),
          longitudeField: new FieldMetaData(),
          colorField: new FieldMetaData(),
          sizeField: new FieldMetaData(),
          dateField: new FieldMetaData(),
        });
        this.filterVisible[this.active.layers.length - 1] = true;
    }

    onSelectDown(event) {
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
        this.selection.isExact = true;
        this.drawSelection();
    }

    getSelectionRectangle() {
        let south = Math.min(this.selection.startLat, this.selection.endLat);
        let north = Math.max(this.selection.startLat, this.selection.endLat);
        let west = Math.min(this.selection.startLon, this.selection.endLon);
        let east = Math.max(this.selection.startLon, this.selection.endLon);
        return Cesium.Rectangle.fromDegrees(west, south, east, north);
    }

    getExportFields(layerIndex) {
        let usedFields = [this.active.layers[layerIndex].latitudeField,
            this.active.layers[layerIndex].longitudeField,
            this.active.layers[layerIndex].colorField,
            this.active.layers[layerIndex].sizeField,
            this.active.layers[layerIndex].dateField];
        return usedFields
          .filter((header) => header && header.columnName)
          .map((header) => {
              return {
                  columnName: header.columnName,
                  prettyName: header.prettyName
              };
          });
    }

    drawSelection() {
        if (!this.cesiumViewer) {
            return;
        }
        let entities = this.cesiumViewer.entities;
        if (this.selection.selectionGeometry) {
            entities.removeById(this.selection.selectionGeometry.id);
        }
        //if (!this.selection.selectionGeometry) {
        let color = (this.selection.isExact ? Cesium.Color.GREEN : Cesium.Color.RED.withAlpha(.3));
        let geo = entities.add({
            name: 'SelectionRectangle',
            rectangle: {
                coordinates: new Cesium.CallbackProperty(this.getSelectionRectangle.bind(this), false),
                material: Cesium.Color.GREEN.withAlpha(0.0),
                height: 0,
                outline: true,
                outlineColor: color
            }
        });
        this.selection.selectionGeometry = geo;
        //}
    }

    onSelectUp(event) {
        if (this.selection.selectionDown && event && this.selection.selectionGeometry) {
            this.setEndPos(event.position);
            this.selection.selectionDown = false;
            let rect = this.getSelectionRectangle();
            let validFilter = (rect.east !== rect.west) && (rect.north !== rect.south);
            if (validFilter) {
                let fieldsByLayer = this.active.layers.map( (l) => {
                    return {
                        latitudeName: l.latitudeField.columnName,
                        longitudeName: l.longitudeField.columnName
                    };
                });
                let localLayerName = this.getFilterTextByFields(fieldsByLayer);
                let localFilters = this.createFilter(fieldsByLayer, localLayerName);
                this.addLocalFilter(localFilters);
                for (let i = 0; i < localFilters.fieldsByLayer.length; i++) {
                    let neonFilters = this.filterService.getFiltersByOwner(this.id);
                    if (neonFilters && neonFilters.length) {
                        localFilters.id = neonFilters[0].id;
                        this.replaceNeonFilter(i, true, localFilters);
                    } else {
                        this.addNeonFilter(i, true, localFilters);
                    }
                }

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
                this.selection.isExact = true;
                this.drawSelection();
            } else {
                this.removeFilterBox();
            }
        }
    }

    removeFilterBox() {
        if (this.selection.selectionGeometry) {
            this.cesiumViewer.entities.remove(this.selection.selectionGeometry);
            this.selection.selectionGeometry = null;
            this.selection.rectangle = null;
        }
    }

    onMouseMove(movement) {
        let end = movement.endPosition;
        if (this.selection.selectionDown && movement) {
            this.setEndPos(end);
            this.drawSelection();
        }


        if (this.optionsFromConfig.hoverPopupEnabled || this.optionsFromConfig.hoverSelect) {
            let viewer = this.cesiumViewer,
                objectsAtLocation = viewer.scene.drillPick(end); // get all entities under mouse

            if (this.optionsFromConfig.hoverPopupEnabled) {
                let popup = this.popupEntity;

                //ensure that an object exists at cursor and that it isn't the popup
                if (objectsAtLocation.length && objectsAtLocation[0].id.id !== popup.id) {
                    popup.position = objectsAtLocation[0].id.position.getValue();
                    popup.label.show = true;
                    popup.label.text = 'Count: ' + objectsAtLocation.length;
                } else {
                    popup.label.show = false;
                }
            }

            if (this.optionsFromConfig.hoverSelect) {
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                    delete this.hoverTimeout;
                }

                if (objectsAtLocation.length) {
                    this.hoverTimeout = setTimeout(() => {
                        viewer.selectedEntity = objectsAtLocation[0].id;
                        delete this.hoverTimeout;
                    }, 300);
                }
            }
        }

        //console.log(movement.endPosition);
        //console.log(this.xyToLatLon(movement.endPosition))
    }

    setEndPos(position) {
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

    correctSelectionToMapExtents() {
        let a = '1';
        let b = '2';
        if (a === b) {//TODO fix this later
            this.correctLatLon(this.selection, 'startLat', 'startX', 'startLon', 'startY');
            this.correctLatLon(this.selection, 'endLat', 'endX', 'endLon', 'endY');
        }
    }

    correctLatLon(obj, lat, x, lon, y) {
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
            let correctedXy = this.latLonToXy({ 'lat': obj[lat], 'lon': obj[lon] });
            obj[x] = correctedXy.x;
            obj[y] = correctedXy.y;
        }
    }


    latLonToXy(position) {
        let viewer = this.cesiumViewer;
        let p = viewer.scene.globe.ellipsoid.cartographicToCartesian({ 'latitude': position.lat, 'longitude': position.lon });
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, p);
    }

    xyToLatLon(position) {
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

    onUpdateFields(layerIndex) {
        let layer = this.active.layers[layerIndex];
        layer.latitudeField = this.findFieldObject(layerIndex, 'latitudeField', neonMappings.TAGS);
        layer.longitudeField = this.findFieldObject(layerIndex, 'longitudeField', neonMappings.TAGS);
        layer.sizeField = this.findFieldObject(layerIndex, 'sizeField', neonMappings.TAGS);
        layer.colorField = this.findFieldObject(layerIndex, 'colorField', neonMappings.TAGS);
        layer.dateField = this.findFieldObject(layerIndex, 'dateField', neonMappings.TAGS);

        // Get the title from the options, if it exists
        if (layerIndex >= this.optionsFromConfig.layers.length ||
                !this.optionsFromConfig.layers[layerIndex] || !this.optionsFromConfig.layers[layerIndex].title) {
            layer.title = this.optionsFromConfig.title;
        } else {
            layer.title = this.optionsFromConfig.layers[layerIndex].title;
        }
        if (!layer.title || layer.title === '') {
            layer.title = 'New Layer';
        }
    };

    findFieldObject(layerIndex: number, bindingKey: string, mappingKey?: string): FieldMetaData {
        // If there are no layers or the index is past the end of the layers in the config, default to the original
        if (layerIndex >= this.optionsFromConfig.layers.length || !bindingKey
            || !this.optionsFromConfig.layers[layerIndex][bindingKey]) {
            return super.findFieldObject(layerIndex, bindingKey, mappingKey);
        }

        let me = this;
        let find = function(name) {
            return _.find(me.meta.layers[layerIndex].fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let field = find(this.optionsFromConfig.layers[layerIndex][bindingKey]);
        return field || this.getBlankField();
    }

    createFilter(fieldsByLayer, name) {
        return {
            id: undefined,
            fieldsByLayer: fieldsByLayer,
            filterName: name
        };
    };

    addLocalFilter(filter) {
        this.filters[0] = filter;
    };

    createNeonFilterClauseEquals(database: string, table: string, latLonFieldNames: string[]) {
        let filterClauses = [];
        //console.log(fieldName);
        let latField = latLonFieldNames[0];
        let lonField = latLonFieldNames[1];
        let minLat = Math.min(this.selection.startLat, this.selection.endLat);
        let maxLat = Math.max(this.selection.startLat, this.selection.endLat);
        let minLon = Math.min(this.selection.startLon, this.selection.endLon);
        let maxLon = Math.max(this.selection.startLon, this.selection.endLon);
        filterClauses[0] = neon.query.where(latField, '>=', minLat);
        filterClauses[1] = neon.query.where(latField, '<=', maxLat);
        filterClauses[2] = neon.query.where(lonField, '>=', minLon);
        filterClauses[3] = neon.query.where(lonField, '<=', maxLon);
        //let endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
        //let endDatePlusOneDate = new Date(endDatePlusOne);
        //filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
        return neon.query.and.apply(neon.query, filterClauses);
    };

    getFilterTextByFields(fieldsByLayer: any[]) {
        if (fieldsByLayer.length === 1) {
            return this.getFilterTextForLayer(0);
        } else {
            return 'Map Filter - multiple layers';
        }
    }

    getFilterText(filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
        } else {
            return 'Map Filter';
        }
    }

    getFilterTextForLayer(layerIndex: number) {
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
        let latField = this.active.layers[layerIndex].latitudeField.columnName;
        let lonField = this.active.layers[layerIndex].longitudeField.columnName;
        return database + ' - ' + table + ' - ' + latField + ', ' + lonField + ' - ' + layerIndex;
    }

    getNeonFilterFields(layerIndex) {
        return [this.active.layers[layerIndex].latitudeField.columnName, this.active.layers[layerIndex].longitudeField.columnName];
    }

    getVisualizationName() {
        return 'Map';
    }

    getFiltersToIgnore() {
        return null;
    }

    isValidQuery(layerIndex) {
        let valid = true;
        valid = (this.meta.layers[layerIndex].database && this.meta.layers[layerIndex].database.name && valid);
        valid = (this.meta.layers[layerIndex].table && this.meta.layers[layerIndex].table.name && valid);
        valid = (this.active.layers[layerIndex].longitudeField && this.active.layers[layerIndex].longitudeField.columnName && valid);
        valid = (this.active.layers[layerIndex].latitudeField && this.active.layers[layerIndex].latitudeField.columnName && valid);
        return valid;
    }

    createQuery(layerIndex): neon.query.Query {
        let databaseName = this.meta.layers[layerIndex].database.name;
        let tableName = this.meta.layers[layerIndex].table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses = [];
        let latitudeField = this.active.layers[layerIndex].latitudeField.columnName;
        let longitudeField = this.active.layers[layerIndex].longitudeField.columnName;
        whereClauses.push(neon.query.where(latitudeField, '!=', null));
        whereClauses.push(neon.query.where(longitudeField, '!=', null));
        let colorField = this.active.layers[layerIndex].colorField.columnName;
        let sizeField = this.active.layers[layerIndex].sizeField.columnName;
        let dateField = this.active.layers[layerIndex].dateField.columnName;
        let fields = [this.FIELD_ID, latitudeField, longitudeField];
        if (colorField) {
            fields.push(colorField);
        }
        if (sizeField) {
            fields.push(sizeField);
        }
        if (dateField) {
            fields.push(dateField);
        }
        query = query.withFields(fields);
        let whereClause = neon.query.and.apply(neon.query, whereClauses);
        query = query.where(whereClause);
        query = query.limit(this.active.limit);
        return query;
    };

    isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    onQuerySuccess(layerIndex, response) {
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.
        let lngField = this.active.layers[layerIndex].longitudeField.columnName;
        let latField = this.active.layers[layerIndex].latitudeField.columnName;
        let colorField = this.active.layers[layerIndex].colorField.columnName;
        let entities = this.cesiumViewer.entities;
        // let uniqueEntities = new HashMap();
        let dataSource = new Cesium.CustomDataSource('MyData');
        entities.suspendEvents();
        //entities.getOrCreateEntities(layerIndex);
        if (this.active.data[layerIndex]) {
            for (let id of this.active.data[layerIndex]) {
                entities.removeById(id);
            }
        }
        //keeps track of the ids for entities we put into cesium so we can change/remove single layers
        //without needing to remove and readd all layers
        let newDataIds = [];

        //entities.removeAll();
        //if (this.selection.selectionGeometry) {
        //    entities.add(this.selection.selectionGeometry);
        //}

        //let legendIndex = 0;
        let data = response.data;
        for (let point of data) {
            let color,
                colorValue = colorField && point[colorField];
            if (colorValue) {
                let colorString = this.colorSchemeService.getColorFor(colorField, colorValue).toRgb();
                color = Cesium.Color.fromCssColorString(colorString);
            } else {
                color = Cesium.Color.WHITE;
            }
            let lngCoord = point[lngField];
            let latCoord = point[latField];

            //console.log(point);

            //This allows the map to function if the config file is a little off, i.e. if point isn't a flat dict;
            // like if latFied holds 'JSONMapping.status.geolocation.latitude', but the actual latitude value is
            // saved at point['JSONMapping']['status']['geolocation']['latitude']
            let lngFieldParts = lngField.split('.');
            let latFieldParts = latField.split('.');
            if ( !lngCoord && lngFieldParts.length > 1) {
                lngCoord = point[lngFieldParts[0]];
                lngFieldParts.shift();
                while (lngFieldParts.length > 0) {
                    if (lngFieldParts.length === 1 && lngCoord instanceof Array) {
                        lngCoord = lngCoord.map((elem) => {
                            return elem[lngFieldParts[0]];
                        });
                    } else {
                        lngCoord = lngCoord[lngFieldParts[0]];
                    }
                    lngFieldParts.shift();
                }
            }
            if ( !latCoord && latFieldParts.length > 1) {
                latCoord = point[latFieldParts[0]];
                latFieldParts.shift();
                while (latFieldParts.length > 0) {
                    if (latFieldParts.length === 1 && latCoord instanceof Array) {
                        latCoord = latCoord.map((elem) => {
                            return elem[latFieldParts[0]];
                        });
                    } else {
                        latCoord = latCoord[latFieldParts[0]];
                    }
                    latFieldParts.shift();
                }
            }

            if (latCoord instanceof Array && lngCoord instanceof Array) {
                for (let pos = latCoord.length - 1; pos >= 0; pos--) {
                    this.createAndAddPoint(latCoord[pos], lngCoord[pos], color, dataSource, newDataIds);
                }
            } else {
                this.createAndAddPoint(latCoord, lngCoord, color, dataSource, newDataIds);
            }
        }

        this.cesiumViewer.dataSources.removeAll(true);
        this.cesiumViewer.dataSources.add(dataSource);
        if (this.active.clustering === 'points') {
            dataSource.clustering.enabled = false;
            this.active.data[layerIndex] = newDataIds;
        }
        if (this.active.clustering === 'clusters') {
            this.active.data[layerIndex] = [];
            this.clusterPoints(dataSource);
        }
        this.updateLegend();
        entities.resumeEvents();

        //console.log(response);
        //this.queryTitle = 'Map of ' + this.meta.table.prettyName + ' locations';
    }

    updateLegend() {
        let colorByFields: string[] = [];
        for (let layer of this.active.layers) {
            if (layer.colorField.columnName !== '') {
                colorByFields.push(layer.colorField.columnName);
            }
        }
        this.colorByFields = colorByFields;
    }

    createAndAddPoint(latCoord, lngCoord, color, dataSource, newDataIds) {
        if (this.isNumeric(latCoord) && this.isNumeric(lngCoord)) {
            let lat = parseFloat(latCoord).toFixed(3);
            let lng = parseFloat(lngCoord).toFixed(3);
            let entity = dataSource.entities.add({
                name: lat + ', ' + lng,
                position: Cesium.Cartesian3.fromDegrees(lngCoord, latCoord),
                point: {
                    show: true, // default
                    color: color, // default: WHITE
                    pixelSize: 12, // default: 1
                    outlineColor: color === Cesium.Color.WHITE ? Cesium.Color.BLACK : color, // default: BLACK
                    outlineWidth: 0, // default: 0
                    translucencyByDistance : new Cesium.NearFarScalar(100, .4, 8.0e6, 0.4)
                }
            });
            if (this.active.clustering === 'points') {

                newDataIds.push(entity.id);
            }
        }
    }

    clusterPoints(dataSource) {
    //greatly inspired by Cesium demo at https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Clustering.html&label=Showcases
        let enabled = true;

        dataSource.clustering.enabled = enabled;
        dataSource.clustering.pixelRange = this.active.clusterPixelRange;
        dataSource.clustering.minimumClusterSize = this.active.minClusterSize;

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

        let customStyle = function() {
            if (Cesium.defined(removeListener)) {
                removeListener();
                removeListener = undefined;
            } else {
                removeListener = dataSource.clustering.clusterEvent.addEventListener(function(clusteredEntities, cluster) {
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

    refreshVisualization() {
        //Cesium doesn't need to be refreshed manually
    }

    doesLayerStillHaveFilter(i): boolean {
        let database = this.meta.layers[i].database.name;
        let table = this.meta.layers[i].table.name;
        let fields = this.getNeonFilterFields(i);
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        return neonFilters && neonFilters.length > 0;
    }

    getClausesFromFilterWithIdenticalArguments(filters, args: string[]) {
        if (filters && filters.length > 0) {
            for (let filter of filters) {
                let clauses;
                if (filter.filter.whereClause.type === 'and') {
                    clauses = filter.filter.whereClause.whereClauses;
                } else if (args.length === 1) {
                    //if it is not an 'and' and only has 1 where class.
                    //This shouldn't be used in map, but may be used more generically.
                    clauses = [filter.filter.whereClause];
                }
                let continu = clauses && clauses.length > 0;
                for (let where of clauses) {
                    if (args.indexOf(where.lhs) === -1) {
                        continu = false;
                        break;
                    }
                }
                if (continu) {
                    return clauses;
                }
            }
        }
        return null;
    }

    hasLayerFilterChanged(i): boolean {
        let filterChanged = true;
        let database = this.meta.layers[i].database.name;
        let table = this.meta.layers[i].table.name;
        let fields = this.getNeonFilterFields(i);
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
            this.active.layers[i].latitudeField.columnName,
            this.active.layers[i].longitudeField.columnName
        ]);
        if (clauses) {
            // console.log(clauses);
            let values = [this.selection.endLat, this.selection.endLon, this.selection.startLat, this.selection.startLon];
            //FIX THE NEXT LINE!!!!
            let emptyIfUnchanged = clauses.filter(cl => (values.indexOf(cl.rhs) === -1 ));
            return emptyIfUnchanged.length > 0;
        }
        return true;
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        //TODO needs to be reworked now that we have layers.
        //I'm not sure what it even should do from a user perspective.
        let allLayersHaveFilters:  boolean = true;
        let oneOrMoreLayersHaveFilters: boolean = false;
        let oneOrMoreFiltersHaveChanged: boolean = false;
        for (let i = 0; i < this.meta.layers.length; i++) {
            let layerHasFilter: boolean = this.doesLayerStillHaveFilter(i);
            oneOrMoreLayersHaveFilters = oneOrMoreLayersHaveFilters ||  layerHasFilter;
            allLayersHaveFilters = allLayersHaveFilters && layerHasFilter;
            let filterHasChanged = this.hasLayerFilterChanged(i);
            oneOrMoreFiltersHaveChanged = oneOrMoreFiltersHaveChanged || filterHasChanged;
        }
        console.log('oneOrMoreLayersHaveFilters: ' + oneOrMoreLayersHaveFilters);
        console.log('allLayersHaveFilters: ' + allLayersHaveFilters);
        console.log('oneOrMoreFiltersHaveChanged: ' + oneOrMoreFiltersHaveChanged);
        if (!oneOrMoreLayersHaveFilters) {
            //aka no layers have filters
            this.filters = [];
            this.removeFilterBox();
        } else if (oneOrMoreFiltersHaveChanged) {
            this.selection.isExact = false;
            this.drawSelection();
        }
    }

    handleChangeLimit() {
        this.logChangeAndStartAllQueryChain();
    }

    handleChangeDateField(layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };

    handleChangeSizeField(layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };

    handleChangeColorField(layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };

    handleChangeLatitudeField(layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };

    handleChangeLongitudeField(layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };

    handleChangeAndFilters() {
        this.logChangeAndStartAllQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    handleChangeClustering() {
        this.logChangeAndStartAllQueryChain();
    }

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        // let closeableFilters = this.filters.map((filter) => {
        //    return filter.key + ' Filter';
        //});
        //return closeableFilters;
        //TODO
        return this.filters;
    };

    getFilterTitle(): string {
        let title = 'Map Filter';
        if (!this.selection.isExact) {
            title += ' *Filter has been altered outside of Map visualization and selection rectange may not accurately represent filter.';
        }
        return title;
    };

    getFilterCloseText(value: string) {
        let v = value;
        if (!this.selection.isExact) {
            v += '*';
        }
        return v;
    };

    getRemoveFilterTooltip() {
        let tooltip = 'Delete ' + this.getFilterTitle();
        return tooltip;
    };

    removeFilter(/*value*/): void {
        this.filters = [];
        this.removeFilterBox();
    }

    handleRemoveFilter(filter: any): void {
        for (let i = 0; i < this.meta.layers.length; i++) {
            this.removeLocalFilterFromLocalAndNeon(i, filter, true, false);
        }
        this.filters = [];
        this.removeFilterBox();
    };

    toggleFilter(index: number): void {
        this.filterVisible[index] = !(this.filterVisible[index]);
    }

    getIconForFilter(index: number): string {
        return this.filterVisible[index] ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    }


    /*removeLocalFilterFromLocalAndNeon(value: string) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.latitudeField.columnName, this.active.longitudeField.columnName];
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.filters = [];
                this.removeFilterBox();
                me.executeQueryChain();
                console.log('remove filter' + value);
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);
        if (this.filters.length === 0) {
            this.removeFilterBox();
        }

    };*/
}
