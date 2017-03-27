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
    ElementRef
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
//import * as _ from 'lodash';
import {LegendItem} from '../legend/legend.component';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import 'cesium/Build/Cesium/Cesium.js';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class MapComponent extends BaseNeonComponent implements OnInit,
    OnDestroy, AfterViewInit {

    private FIELD_ID: string;
    private filters: {
        latField: string,
        lonField: string,
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
        unsharedFilterValue: string
    };
    private active: {
        latitudeField: FieldMetaData,
        longitudeField: FieldMetaData,
        sizeField: FieldMetaData,
        colorField: FieldMetaData,
        dateField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: Object[]
    };

    private selection: {
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
        //showSelection: boolean
        selectionGeometry: any,
        rectangle: any
    };

    private legendData: LegendItem[];

    private colorSchemeService: ColorSchemeService;

    private cesiumViewer: any;
    @ViewChild('cesiumContainer') cesiumContainer: ElementRef;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, colorSchemeSrv: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
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
            unsharedFilterValue: ''
        };
        this.filters = [];

        let limit = this.optionsFromConfig.limit;
        limit = (limit ? limit : 1000);

        this.active = {
            latitudeField: new FieldMetaData(),
            longitudeField: new FieldMetaData(),
            colorField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            andFilters: true,
            limit: limit,
            filterable: true,
            layers: [],
            data: [],
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
            selectionGeometry: null,
            rectangle: null
        };

        this.legendData = [];

    };

    subNgOnInit() {

    }

    postInit() {

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
        this.executeQueryChain();
    }

    subNgOnDestroy() {
        //do nothing
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

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

    drawSelection() {
        if (!this.selection.selectionGeometry) {
            let geo = this.cesiumViewer.entities.add({
                name: 'SelectionRectangle',
                rectangle: {
                    coordinates: new Cesium.CallbackProperty(this.getSelectionRectangle.bind(this), false),
                    material: Cesium.Color.GREEN.withAlpha(0.0),
                    height: 0,
                    outline: true,
                    outlineColor: Cesium.Color.GREEN
                }
            });
            this.selection.selectionGeometry = geo;
        }
    }

    onSelectUp(event) {
        if (this.selection.selectionDown && event && this.selection.selectionGeometry) {
            this.setEndPos(event.position);
            this.selection.selectionDown = false;
            let rect = this.getSelectionRectangle();
            let validFilter = (rect.east !== rect.west) && (rect.north !== rect.south);
            if (validFilter) {
                let f = this.createFilter(
                    this.active.latitudeField.columnName, this.active.longitudeField.columnName, this.getFilterText());
                this.addLocalFilter(f);
                this.addNeonFilter(true, f);

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

    onUpdateFields() {
        this.active.latitudeField = this.findFieldObject('latitudeField', neonMappings.TAGS);
        this.active.longitudeField = this.findFieldObject('longitudeField', neonMappings.TAGS);
        this.active.sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
        this.active.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
    };

    createFilter(latField, lonField, name) {
        return {
            latField: latField,
            lonField: lonField,
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

    getFilterText() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let latField = this.active.latitudeField.columnName;
        let lonField = this.active.longitudeField.columnName;
        let text = database + ' - ' + table + ' - ' + latField + ', ' + lonField;
        return text;
    }

    getNeonFilterFields() {
        let fields = [this.active.latitudeField.columnName, this.active.longitudeField.columnName];
        return fields;
    }

    getVisualizationName() {
        return 'Map';
    }

    getFiltersToIgnore() {
        return null;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.longitudeField && this.active.longitudeField.columnName && valid);
        valid = (this.active.latitudeField && this.active.latitudeField.columnName && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses = [];
        let latitudeField = this.active.latitudeField.columnName;
        let longitudeField = this.active.longitudeField.columnName;
        whereClauses.push(neon.query.where(latitudeField, '!=', null));
        whereClauses.push(neon.query.where(longitudeField, '!=', null));
        let colorField = this.active.colorField.columnName;
        let sizeField = this.active.sizeField.columnName;
        let dateField = this.active.dateField.columnName;
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

    onQuerySuccess(response) {
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.
        let lngField = this.active.longitudeField.columnName;
        let latField = this.active.latitudeField.columnName;
        let colorField = this.active.colorField.columnName;
        let entities = this.cesiumViewer.entities;
        entities.removeAll();
        if (this.selection.selectionGeometry) {
            entities.add(this.selection.selectionGeometry);
        }
        let legendMap = {};
        this.legendData = [];
        let legendIndex = 0;
        let data = response.data;
        for (let point of data) {
            let color;
            if (colorField && point[colorField]) {
                let colorKey = point[colorField];
                if (legendMap[colorKey]) {
                    color = legendMap[colorKey];
                } else {
                    let colorString = this.getColorFromScheme(legendIndex);
                    let legendItem: LegendItem = {
                        prettyName: colorKey,
                        accessName: colorKey,
                        activeColor: colorString,
                        inactiveColor: 'rgb(128,128,128)',
                        active: true
                    };
                    this.legendData.push(legendItem);
                    color = Cesium.Color.fromCssColorString(colorString);
                    legendIndex++;
                    legendMap[colorKey] = color;
                }
            } else {
                color = Cesium.Color.Blue;
            }
            let entity = {
                position: Cesium.Cartesian3.fromDegrees(point[lngField], point[latField]),
                point: {
                    show: true, // default
                    color: color, // default: WHITE
                    pixelSize: 4, // default: 1
                    outlineColor: color, // default: BLACK
                    outlineWidth: 0 // default: 0
                }
            };
            entities.add(entity);
        }
        //console.log(response);
    }

    refreshVisualization() {
        //Cesium doesn't need to be refreshed manually
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                //console.log(filter);
                let filterName = filter.filter.filterName;
                if (filter.filter.whereClause.type === 'and') {
                    let applicable = true;
                    for (let where of filter.filter.whereClause.whereClauses) {
                        if (where.lhs === this.active.latitudeField.columnName || where.lhs === this.active.longitudeField.columnName) {

                        } else {
                            applicable = false;
                            break;
                        }
                    }
                    if (applicable) {
                        let f = this.createFilter(this.active.latitudeField.columnName, this.active.longitudeField.columnName, filterName);
                        this.addLocalFilter(f);
                    }
                }
            }
        } else {
            this.filters = [];
            this.removeFilterBox();
        }
        this.executeQueryChain();
    };

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDateField() {
        this.logChangeAndStartQueryChain();
    };

    handleChangeSizeField() {
        this.logChangeAndStartQueryChain();
    };

    handleChangeColorField() {
        this.logChangeAndStartQueryChain();
    };

    handleChangeLatitudeField() {
        this.logChangeAndStartQueryChain();
    };

    handleChangeLongitudeField() {
        this.logChangeAndStartQueryChain();
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    getButtonText() {
        // TODO Fix this.  It gets called a lot
        // return !this.isFilterSet() && !this.active.data.length
        //    ? 'No Data'
        //    : 'Top ' + this.active.data.length;
        // console.log('TODO - see getButtonText()')
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
        return 'Map Filter';
    };

    getFilterCloseText(value: string) {
        return value;
    };

    getRemoveFilterTooltip() {
        return 'Delete ' + this.getFilterTitle();
    };

    removeFilter(/*value*/): void {
        this.filters = [];
    }

    handleRemoveFilter(value): void {
        this.removeLocalFilterFromLocalAndNeon(value, true, false);
        this.removeFilterBox();
    };

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
