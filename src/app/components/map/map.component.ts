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
import {FieldMetaData, TableMetaData, DatabaseMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import {LegendItem} from '../legend/legend.component';
import 'cesium/Build/Cesium/Cesium.js';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class MapComponent implements OnInit,
    OnDestroy, AfterViewInit {

    private FIELD_ID: string;
    //@ViewChild('myChart') chartModule: ChartModule;
    //@Input() chartType: string;
    private queryTitle: string;
    private messenger: neon.eventing.Messenger;
    private outstandingDataQuery: Object;
    private filters: {
        latField: string,
        lonField: string,
        filterName: string
    }[];
    // private errorMessage: string;
    private initializing: boolean;
    // private exportId: number;

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
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        fields: FieldMetaData[],
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
        y: number
    };

    private legendData: LegendItem[];

    private colorScheme6: string[];
    private colorScheme12: string[];
    private cesiumViewer: any;
    @ViewChild('cesiumContainer') cesiumContainer: ElementRef;

    constructor(private connectionService: ConnectionService, private datasetService: DatasetService, private filterService: FilterService,
        private exportService: ExportService, private injector: Injector, private themesService: ThemesService) {
        (<any>window).CESIUM_BASE_URL = '/assets/Cesium';
        this.FIELD_ID = '_id';
        console.log(this.exportService);
        console.log(this.filterService);
        console.log(this.connectionService);
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
        this.themesService = themesService;
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];


        this.colorScheme6 = ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)',
            'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)'];

        this.colorScheme12 = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)',
            'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)',
            'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)',
            'rgb(177,89,40)'
        ];

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
            databases: [],
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
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
            y: 0
        };

        this.legendData = [];

    };
    ngOnInit() {
        this.initializing = true;
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        //var viewer = new Cesium.Viewer('cesiumContainer');
        //console.log(viewer);

        // this.exportId = this.exportService.register(this.getExportData);
        // TODO: Resize??
        /*
            $scope.element.resize(resize);
            $scope.element.find('.headers-container').resize(resizeDisplay);
            $scope.element.find('.options-menu-button').resize(resizeTitle);
            resize();
        */

        // prefill outstanding data query object so it has all databases
        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        this.initData();

        this.initializing = false;
        this.executeQueryChain();
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
            selectedImageryProviderViewModel: imagerySources[12],
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

    }

    onSelectUp(event) {
        if (this.selection.selectionDown && event) {
            this.setEndPos(event.position);
            this.selection.selectionDown = false;
            this.addLocalFilter(this.active.latitudeField.columnName, this.active.longitudeField.columnName, this.getFilterText());
            this.addNeonFilter(true);
        }
    }

    onMouseMove(movement) {
        if (this.selection.selectionDown && movement) {
            this.setEndPos(movement.endPosition);

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

    ngOnDestroy() {
        /* $scope.element.off('resize', resize);
        $scope.element.find('.headers-container').off('resize', resizeDisplay);
        $scope.element.find('.options-menu-button').off('resize', resizeTitle);
        $scope.messenger.unsubscribeAll();

        if($scope.functions.isFilterSet()) {
            $scope.functions.removeNeonFilter({
                fromSystem: true
            });
        }

        exportService.unregister($scope.exportId);
        linksPopupService.deleteLinks($scope.visualizationId);
        $scope.getDataLayers().forEach(function(layer) {
            linksPopupService.deleteLinks(createLayerLinksSource(layer));
        });
        themeService.unregisterListener($scope.visualizationId);
        visualizationService.unregister($scope.stateId);

        resizeListeners.forEach(function(element) {
            $scope.element.find(element).off('resize', resize);
        }); */
    };

    initData() {
        this.initDatabases();
    };

    initDatabases() {
        this.active.databases = this.datasetService.getDatabases();
        this.active.database = this.active.databases[0];

        if (this.active.databases.length > 0) {
            if (this.optionsFromConfig.database) {
                for (let database of this.active.databases) {
                    if (this.optionsFromConfig.database === database.name) {
                        this.active.database = database;
                        break;
                    }
                }
            }

            this.initTables();
        }
    };

    initTables() {
        this.active.tables = this.datasetService.getTables(this.active.database['name']);
        this.active.table = this.active.tables[0];

        if (this.active.tables.length > 0) {
            if (this.optionsFromConfig.table) {
                for (let table of this.active.tables) {
                    if (this.optionsFromConfig.table === table.name) {
                        this.active.table = table;
                        break;
                    }
                }
            }
            this.initFields();
        }
    };

    initFields() {
        // Sort the fields that are displayed in the dropdowns in the options menus
        // alphabetically.
        this.active.fields = this.datasetService
            .getSortedFields(this.active.database['name'], this.active.table['name']);

        this.active.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.active.unsharedFilterValue = this.optionsFromConfig.unsharedFilterValue || '';

        this.onUpdateFields();
    };

    onUpdateFields() {
        this.active.latitudeField = this.findFieldObject('latitudeField', neonMappings.TAGS);
        this.active.longitudeField = this.findFieldObject('longitudeField', neonMappings.TAGS);
        this.active.sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
        this.active.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
    };

    addLocalFilter(latField, lonField, name) {
        this.filters[0] = {
            latField: latField,
            lonField: lonField,
            filterName: name
        };
    };

    stopEventPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }

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
        let database = this.active.database.name;
        let table = this.active.table.name;
        let latField = this.active.latitudeField.columnName;
        let lonField = this.active.longitudeField.columnName;
        let text = database + ' - ' + table + ' - ' + latField + ', ' + lonField;
        return text;
    }

    addNeonFilter(executeQueryChainOnSuccess) {
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.latitudeField.columnName, this.active.longitudeField.columnName];
        let text = this.getFilterText();

        let onSuccess = () => {
            console.log('filter set successfully');
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        this.filterService.addFilter(this.messenger, database, table, fields,
            this.createNeonFilterClauseEquals.bind(this),
            {
                visName: 'Map',
                text: text
            }
            , onSuccess.bind(this),
            () => {
                console.log('filter failed to set');
            });
    }

    createTitle(resetQueryTitle?: boolean): string {
        if (resetQueryTitle) {
            this.queryTitle = '';
        }
        if (this.queryTitle) {
            return this.queryTitle;
        }
        if (this.optionsFromConfig.title) {
            return this.optionsFromConfig.title;
        }
        let title = this.active.unsharedFilterValue
            ? this.active.unsharedFilterValue + ' '
            : '';
        if (_.keys(this.active).length) {
            return title + (this.active.table && this.active.table.name
                ? this.active.table.prettyName
                : '');
        }
        return title;
    };

    /**
    This is expected to get called whenever a query is expected to be run.
    This could be startup, user action to change field, relevant filter change
    from another visualization
     */
    executeQueryChain() {
        let isValidQuery = this.isValidQuery();
        if (!isValidQuery) {
            return;
        }
        this.queryTitle = this.createTitle(true);
        let query = this.createQuery();

        this.executeQuery(query);
    }

    isValidQuery() {
        let valid = true;
        valid = (this.active.database && valid);
        valid = (this.active.table && valid);
        valid = (this.active.longitudeField && valid);
        valid = (this.active.latitudeField && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.active.database.name;
        let tableName = this.active.table.name;
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

    executeQuery = function(query: neon.query.Query) {
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let connection = this.connectionService.getActiveConnection();
        if (!connection || !this.datasetService.isFieldValid(this.active.latitudeField)
            || !this.datasetService.isFieldValid(this.active.longitudeField)) {
            return;
        }
        // Cancel any previous data query currently running.
        if (this.outstandingDataQuery[database] && this.outstandingDataQuery[database][table]) {
            this.outstandingDataQuery[database][table].abort();
        }

        // Execute the data query, calling the function defined in 'done' or 'fail' as
        // needed.
        this.outstandingDataQuery[database][table] = connection.executeQuery(query, null);

        // Visualizations that do not execute data queries will not return a query
        // object.
        if (!this.outstandingDataQuery[database][table]) {
            // TODO do something
            console.log('execute query did not return an object');
        }

        this.outstandingDataQuery[database][table].always(function() {
            me.outstandingDataQuery[database][table] = undefined;
        });

        this.outstandingDataQuery[database][table].done(this.onQuerySuccess.bind(this));

        this.outstandingDataQuery[database][table].fail(function(response) {
            console.error(response);
            if (response.status === 0) {
                // TODO handle error
            } else {
                // TODO handle error
            }
        });
    };

    getColorFromScheme(index, numDatasets) {
        let colorScheme = null;
        if (numDatasets <= 6 && numDatasets > 0) {
            colorScheme = this.colorScheme6;
        } else {
            colorScheme = this.colorScheme12;
        }
        let i = index % colorScheme.length;
        let color = (colorScheme[i]);
        return color;
    }

    onQuerySuccess = (response) => {
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.
        let lngField = this.active.longitudeField.columnName;
        let latField = this.active.latitudeField.columnName;
        let colorField = this.active.colorField.columnName;
        let entities = this.cesiumViewer.entities;
        entities.removeAll();
        let numDatasets = 7; //forces to larger color scheme
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
                    let colorString = this.getColorFromScheme(legendIndex, numDatasets);
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
                    pixelSize: 2, // default: 1
                    outlineColor: color, // default: BLACK
                    outlineWidth: 0 // default: 0
                }
            };
            entities.add(entity);
        }
        console.log(response);

    }

    /**
    * Get field object from the key into the config options
    */
    findFieldObject(bindingKey: string, mappingKey?: string): FieldMetaData {
        let me = this;
        let find = function(name) {
            return _.find(me.active.fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let field;
        if (bindingKey) {
            field = find(this.optionsFromConfig[bindingKey]);
        }

        if (!field && mappingKey) {
            field = find(this.getMapping(mappingKey));
        }

        return field || this.datasetService.createBlankField();
    };

    getMapping = function(key: string): string {
        return this.datasetService.getMapping(this.active.database.name, this.active.table.name, key);
    };

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.latitudeField.columnName, this.active.longitudeField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                console.log(filter);
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
                        this.addLocalFilter(this.active.latitudeField.columnName, this.active.longitudeField.columnName, filterName);
                    }
                }
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    onUpdateDataChannelEvent(event) {
        console.log('update data channel event');
        console.log(event);
    }

    getExportData() { };

    handleChangeDatabase() {
        this.initTables();
        this.logChangeAndStartQueryChain(); // ('database', this.active.database.name);
    };

    handleChangeTable() {
        this.initFields();
        this.logChangeAndStartQueryChain(); // ('table', this.active.table.name);
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

    logChangeAndStartQueryChain() { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain();
        }
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
            return ['Date Filter'];
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

    removeLocalFilterFromLocalAndNeon(value: string) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let me = this;
        let database = this.active.database.name;
        let table = this.active.table.name;
        let fields = [this.active.latitudeField.columnName, this.active.longitudeField.columnName];
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.filters = [];
                me.executeQueryChain();
                console.log('remove filter' + value);
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);

    };
}
