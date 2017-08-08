declare var Cesium: any;
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
import {LegendItem, LegendGroup} from '../legend/legend.component';
import {BaseLayeredNeonComponent} from '../base-neon-component/base-layered-neon.component';
import 'cesium/Build/Cesium/Cesium.js';
import * as _ from 'lodash';

export class MapLayer {
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
            database: string,
            table: string,
            latitudeField: string,
            longitudeField: string,
            sizeField: string,
            colorField: string,
            dateField: string
        }[]
    };
    public active: {
        layers: MapLayer[]
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        data: number[][],
        colorMap: {},
        unusedColors: string[],
        nextColorIndex: number
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

    public filterVisible: boolean[] = [];

    //passed to legend
    public legendData: LegendItem[];

    //stores legend information unique to each layer
    public legendMaps: any[];

    private colorSchemeService: ColorSchemeService;

    private cesiumViewer: any;
    @ViewChild('cesiumContainer') cesiumContainer: ElementRef;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
        (<any>window).CESIUM_BASE_URL = '/assets/Cesium';
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
            layers: this.injector.get('layers', [])
        };

        this.filters = [];

        let limit = this.optionsFromConfig.limit;
        limit = (limit ? limit : 1000);

        this.active = {
            layers: [],
            andFilters: true,
            limit: limit,
            filterable: true,
            data: [],
            nextColorIndex: 0,
            colorMap: {},
            unusedColors: []
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
        this.queryTitle = 'Map';
        this.legendData = [];
        this.legendMaps = [];
        //this.addEmptyLayer();
    };

    subNgOnInit() {

    }

    postInit() {
        // There is one layer automatically added
        for (let i = 1; i < this.optionsFromConfig.layers.length; i++) {
            this.addEmptyLayer();
        }
    };

    ngAfterViewInit() {
        let imagerySources = Cesium.createDefaultImageryProviderViewModels();
        // In order to get a minimal viable product in the short time span we have, we decided to disable the following Cesium features:
        //  3D Map and Columbus view.
        //  Rotating 2D map
        // These were mostly done to prevent the more complex problem of drawing on a 3D map.

        this.cesiumViewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
            sceneMode: Cesium.SceneMode.SCENE2D,
            imageryProviderViewModels: imagerySources,
            //set default imagery to eliminate annoying text and using a bing key by default
            selectedImageryProviderViewModel: imagerySources[9],
            terrainProviderViewModels: [],
            fullscreenButton: false, //full screen button doesn't work in our context, so don't show it
            timeline: false, //disable timeline widget
            animation: false, // disable animation widget
            mapMode2D: Cesium.MapMode2D.ROTATE,
            sceneModePicker: false,
            navigationHelpButton: false
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
        this.cesiumViewer.camera.flyHome(0);

        // Draw everything
        this.handleChangeLimit();
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
        let r = Cesium.Rectangle.fromDegrees(west, south, east, north);
        return r;
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
                    let fields = localFilters.fieldsByLayer[i];
                    let f = {
                        latField: fields.latitudeName,
                        lonField: fields.longitudeName,
                        filterName: this.getFilterTextForLayer(i)
                    };
                    this.addNeonFilter(i, true, f);
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
        if (this.selection.selectionDown && movement) {
            this.setEndPos(movement.endPosition);
            this.drawSelection();
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
        let pos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, p);
        return pos;
    }

    xyToLatLon(position) {
        let viewer = this.cesiumViewer;
        let cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let longitude = Cesium.Math.toDegrees(cartographic.longitude);
            let latitude = Cesium.Math.toDegrees(cartographic.latitude);
            let geoPosition = {
                lat: latitude,
                lon: longitude
            };
            return geoPosition;
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
            fieldsByLayer: fieldsByLayer,
            filterName: name
        };
    };

    addLocalFilter(filter) {
        this.filters[0] = filter;
    };

    createNeonFilterClauseEquals(_databaseAndTableName: {}, latLonFieldNames: string[]) {
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
        let text = database + ' - ' + table + ' - ' + latField + ', ' + lonField + ' - ' + layerIndex;
        return text;
    }

    getNeonFilterFields(layerIndex) {
        let fields = [this.active.layers[layerIndex].latitudeField.columnName, this.active.layers[layerIndex].longitudeField.columnName];
        return fields;
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

    getColorFromScheme(index) {
        let color = this.colorSchemeService.getColorAsRgb(index);
        return color;
    }

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
        let localColorMap = {};
        this.legendMaps[layerIndex] = localColorMap;
        this.recalculateColorMap();

        //entities.removeAll();
        //if (this.selection.selectionGeometry) {
        //    entities.add(this.selection.selectionGeometry);
        //}

        //let legendIndex = 0;
        let data = response.data;
        for (let point of data) {
            let color;
            if (colorField && point[colorField]) {
                let colorKey = point[colorField];
                if (localColorMap[colorKey]) {
                    color = localColorMap[colorKey];
                } else if (this.active.colorMap[colorKey]) {
                    color = this.active.colorMap[colorKey];
                    localColorMap[colorKey] = color;
                } else {
                    let colorString = this.getNextAvailableColorString();
                    let legendItem: LegendItem = this.getLegendItem(colorKey, colorString);
                    color = Cesium.Color.fromCssColorString(colorString);
                    localColorMap[colorKey] = color;
                    this.active.colorMap[colorKey] = color;
                }
            } else {
                color = Cesium.Color.Blue;
            }
            let lngCoord = point[lngField];
            let latCoord = point[latField];
            if (this.isNumeric(latCoord) && this.isNumeric(lngCoord)) {
                let entity = {
                    position: Cesium.Cartesian3.fromDegrees(lngCoord, latCoord),
                    point: {
                        show: true, // default
                        color: color, // default: WHITE
                        pixelSize: 4, // default: 1
                        outlineColor: color, // default: BLACK
                        outlineWidth: 0 // default: 0
                    }
                };
                let en = entities.add(entity);
                newDataIds.push(en.id);
            }
        }
        this.active.data[layerIndex] = newDataIds;
        this.legendMaps[layerIndex] = localColorMap;
        this.calculateLegendData();
        entities.resumeEvents();
        //console.log(response);
        //this.queryTitle = 'Map of ' + this.meta.table.prettyName + ' locations';
    }

    calculateLegendData() {
        this.recalculateColorMap();
        let data: LegendItem[] = [];
        for (let key in this.active.colorMap) {
            if (this.active.colorMap.hasOwnProperty(key)) {
                let color = this.active.colorMap[key];
                let colorString = color.toCssColorString();
                let li = this.getLegendItem(key, colorString);
                data.push(li);
            }
        }
        this.legendData = data;
    }

    getNextAvailableColorString() {
        if (this.active.unusedColors.length > 0) {
            let color = this.active.unusedColors[0];
            this.active.unusedColors.splice(0, 1);
            return color;
        } else {
            let index = this.active.nextColorIndex;
            let color = this.getColorFromScheme(index);
            this.active.nextColorIndex++;
            return color;
        }
    }

    getLegendItem(colorKey, colorString) {
        let legendItem: LegendItem = {
            prettyName: colorKey,
            accessName: colorKey,
            activeColor: colorString,
            inactiveColor: 'rgb(128,128,128)',
            active: true
        };
        return legendItem;
    }

    recalculateColorMap() {
        for (let key in this.active.colorMap) {
            if (this.active.colorMap.hasOwnProperty(key)) {
                let exists = false;
                for (let legendMap of this.legendMaps) {
                    for (let usedColorKey in legendMap) {
                        if (usedColorKey === key) {
                            exists = true;
                            break;
                        }
                    }
                    if (exists) {
                        break;
                    }
                }
                if (!exists) {
                    let color = this.active.colorMap[key];
                    this.active.unusedColors.push(color.toCssColorString());
                    delete this.active.colorMap[key];
                }
            }
        }

    }

    refreshVisualization() {
        //Cesium doesn't need to be refreshed manually
    }

    doesLayerStillHaveFilter(i): boolean {
        let database = this.meta.layers[i].database.name;
        let table = this.meta.layers[i].table.name;
        let fields = this.getNeonFilterFields(i);
        let neonFilters = this.filterService.getFilters(database, table, fields);
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
        let neonFilters = this.filterService.getFilters(database, table, fields);
        let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
            this.active.layers[i].latitudeField.columnName,
            this.active.layers[i].longitudeField.columnName
        ]);
        if (clauses) {
            console.log(clauses);
            let values = [this.selection.endLat, this.selection.endLon, this.selection.startLat, this.selection.startLon];
            //FIX THE NEXT LINE!!!!
            let emptyIfUnchanged = clauses.filter(cl => (values.indexOf(cl.rhs) === -1 ));
            return emptyIfUnchanged.length > 0;
        }
        return true;
    }

    handleFiltersChangedEvent() {
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
        this.executeAllQueryChain();
    };

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

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        // let closeableFilters = this.filters.map((filter) => {
        //    return filter.key + " Filter";
        //});
        //return closeableFilters;
        //TODO
        if (this.filters.length > 0) {
            return ['Map Filter'];
        } else {
            return [];
        }
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
    }

    handleRemoveFilter(value): void {
        for (let i = 0; i < this.meta.layers.length; i++) {
            this.removeLocalFilterFromLocalAndNeon(i, value, true, false);
        }
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
