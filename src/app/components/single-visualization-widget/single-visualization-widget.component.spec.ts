/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
 */

import {
    AggregationType,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionMultipleSelect,
    ConfigOptionNonPrimitive,
    ConfigOptionSelect,
    FieldConfig,
    OptionChoices,
    SearchServiceMock,
    DATABASES,
    DATABASES_LIST,
    DATASET,
    FIELD_MAP,
    FIELDS,
    TABLES,
    TABLES_LIST
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { NeonConfig } from '../../models/types';
import { RootWidgetOptionCollection, WidgetOptionCollection } from '../../models/widget-option-collection';
import { SingleVisualizationWidgetComponent } from './single-visualization-widget.component';
import { VisualizationType } from '../../models/visualization-widget';

import { getConfigService } from '../../../testUtils/initializeTestBed';

import { neonEvents } from '../../models/neon-namespaces';

describe('SingleVisualizationWidgetComponent static function', () => {
    it('createInfoButtonText does return expected string', () => {
        let layerIdToElementCount: Map<string, number> = new Map<string, number>();
        let options = new RootWidgetOptionCollection(DATASET);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('');

        layerIdToElementCount.set(options._id, 0);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('0 Results');

        layerIdToElementCount.set(options._id, 1);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1 Result');

        layerIdToElementCount.set(options._id, 10);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('10 Results');

        layerIdToElementCount.set(options._id, 1234567890);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1,234,567,890 Results');
    });

    it('createInfoButtonText with options.hideUnflitered does return expected string', () => {
        let layerIdToElementCount: Map<string, number> = new Map<string, number>();
        let options = new RootWidgetOptionCollection(DATASET);
        options.hideUnfiltered = 'true';
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('Please Filter');
    });

    it('createInfoButtonText with single options layer does return expected string', () => {
        let layerIdToElementCount: Map<string, number> = new Map<string, number>();
        let options = new RootWidgetOptionCollection(DATASET);
        let layerA: any = new WidgetOptionCollection(DATASET);
        layerA.title = 'Layer A';
        options.layers.push(layerA);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('');

        layerIdToElementCount.set(layerA._id, 0);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('0 Results');

        layerIdToElementCount.set(layerA._id, 1);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1 Result');

        layerIdToElementCount.set(layerA._id, 10);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('10 Results');

        layerIdToElementCount.set(layerA._id, 1234567890);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1,234,567,890 Results');
    });

    it('createInfoButtonText with multiple options layers does return expected string', () => {
        let layerIdToElementCount: Map<string, number> = new Map<string, number>();
        let options = new RootWidgetOptionCollection(DATASET);
        let layerA: any = new WidgetOptionCollection(DATASET);
        layerA.title = 'Layer A';
        options.layers.push(layerA);
        let layerB: any = new WidgetOptionCollection(DATASET);
        layerB.title = 'Layer B';
        options.layers.push(layerB);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('');

        layerIdToElementCount.set(layerA._id, 0);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('0 Results');

        layerIdToElementCount.set(layerB._id, 0);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('Layer A (0 Results), Layer B (0 Results)');

        layerIdToElementCount.set(layerA._id, 1234567890);
        layerIdToElementCount.set(layerB._id, 1);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('Layer A (1,234,567,890 Results), Layer B (1 Result)');

        layerIdToElementCount.set(layerA._id, undefined);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1 Result');
    });

    it('createInfoButtonText with pagination does return the expected string', () => {
        spyOn(SingleVisualizationWidgetComponent, 'isPaginatedVisualization').and.returnValue(true);

        let layerIdToElementCount: Map<string, number> = new Map<string, number>();
        let options = new RootWidgetOptionCollection(DATASET);
        options.dataLimit = 10;
        options.searchLimit = 10;
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('');

        layerIdToElementCount.set(options._id, 5);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('5 Results');

        options.dataLimit = 2;
        options.searchLimit = 2;
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 1, VisualizationType.SAMPLE))
            .toEqual('1 - 2 of 5 Results');

        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 2, VisualizationType.SAMPLE))
            .toEqual('3 - 4 of 5 Results');

        layerIdToElementCount.set(options._id, 1234567890);
        expect(SingleVisualizationWidgetComponent.createInfoButtonText(layerIdToElementCount, options, 2, VisualizationType.SAMPLE))
            .toEqual('3 - 4 of 1,234,567,890 Results');
    });

    it('createWidgetOptionCollection with custom options and no config does return expected object', () => {
        spyOn(SingleVisualizationWidgetComponent, 'createWidgetOptionsForVisualization').and.returnValue([
            new ConfigOptionField('testRequiredField', 'Test Required Field', true),
            new ConfigOptionField('testOptionalField', 'Test Optional Field', false),
            new ConfigOptionFieldArray('testMultipleFields', 'Test Multiple Fields', false),
            new ConfigOptionFreeText('testFreeText', 'Test Free Text', false, ''),
            new ConfigOptionMultipleSelect('testMultipleSelect', 'Test Multiple Select', false, [], [{
                prettyName: 'A',
                variable: 'a'
            }, {
                prettyName: 'B',
                variable: 'b'
            }, {
                prettyName: 'C',
                variable: 'c'
            }]),
            new ConfigOptionNonPrimitive('testArray', 'Test Array', false, []),
            new ConfigOptionNonPrimitive('testObject', 'Test Object', false, {}),
            new ConfigOptionSelect('testSelect', 'Test Select', false, 'y', [{
                prettyName: 'X',
                variable: 'x'
            }, {
                prettyName: 'Y',
                variable: 'y'
            }, {
                prettyName: 'Z',
                variable: 'z'
            }]),
            new ConfigOptionSelect('testToggle', 'Test Toggle', false, false, OptionChoices.NoFalseYesTrue)
        ]);

        const options = SingleVisualizationWidgetComponent.createWidgetOptionCollection({}, {}, DATASET, VisualizationType.SAMPLE);

        expect(options.database).toEqual(DATABASES.testDatabase1);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.fields).toEqual(FIELDS);
        expect(options.table).toEqual(TABLES.testTable1);
        expect(options.tables).toEqual(TABLES_LIST);

        expect(options.contributionKeys).toEqual(undefined);
        expect(options.filter).toEqual(undefined);
        expect(options.hideUnfiltered).toEqual('false');
        expect(options.searchLimit).toEqual(10);
        expect(options.testArray).toEqual([]);
        expect(options.testFreeText).toEqual('');
        expect(options.testMultipleFields).toEqual([]);
        expect(options.testMultipleSelect).toEqual([]);
        expect(options.testObject).toEqual({});
        expect(options.testOptionalField).toEqual(FieldConfig.get());
        expect(options.testRequiredField).toEqual(FieldConfig.get());
        expect(options.testSelect).toEqual('y');
        expect(options.testToggle).toEqual(false);
        expect(options.title).toEqual('Widget');
    });

    it('createWidgetOptionCollection with custom options and config object does return expected object', () => {
        spyOn(SingleVisualizationWidgetComponent, 'createWidgetOptionsForVisualization').and.returnValue([
            new ConfigOptionField('testRequiredField', 'Test Required Field', true),
            new ConfigOptionField('testOptionalField', 'Test Optional Field', false),
            new ConfigOptionFieldArray('testMultipleFields', 'Test Multiple Fields', false),
            new ConfigOptionFreeText('testFreeText', 'Test Free Text', false, ''),
            new ConfigOptionMultipleSelect('testMultipleSelect', 'Test Multiple Select', false, [], [{
                prettyName: 'A',
                variable: 'a'
            }, {
                prettyName: 'B',
                variable: 'b'
            }, {
                prettyName: 'C',
                variable: 'c'
            }]),
            new ConfigOptionNonPrimitive('testArray', 'Test Array', false, []),
            new ConfigOptionNonPrimitive('testObject', 'Test Object', false, {}),
            new ConfigOptionSelect('testSelect', 'Test Select', false, 'y', [{
                prettyName: 'X',
                variable: 'x'
            }, {
                prettyName: 'Y',
                variable: 'y'
            }, {
                prettyName: 'Z',
                variable: 'z'
            }]),
            new ConfigOptionSelect('testToggle', 'Test Toggle', false, false, OptionChoices.NoFalseYesTrue)
        ]);

        const configOptions = {
            contributionKeys: ['organization1', 'organization2'],
            filter: [{ lhs: 'testFilterField', operator: '!=', rhs: 'testFilterValue' }],
            dataLimit: 50,
            hideUnfiltered: 'true',
            searchLimit: 100,
            tableKey: 'table_key_2',
            testArray: [4, 3, 2, 1],
            testFreeText: 'the quick brown fox jumps over the lazy dog',
            testMultipleFields: ['testXField', 'testYField'],
            testMultipleSelect: ['b', 'c'],
            testObject: { key: 'value' },
            testOptionalField: 'testNameField',
            testRequiredField: 'testSizeField',
            testSelect: 'z',
            testToggle: true,
            title: 'VisualizationTitle'
        };

        const options = SingleVisualizationWidgetComponent.createWidgetOptionCollection({}, configOptions, DATASET,
            VisualizationType.SAMPLE);

        expect(options.database).toEqual(DATABASES.testDatabase2);
        expect(options.databases).toEqual(DATABASES_LIST);
        expect(options.fields).toEqual(FIELDS);
        expect(options.table).toEqual(TABLES.testTable2);
        expect(options.tables).toEqual(TABLES_LIST);

        expect(options.contributionKeys).toEqual(['organization1', 'organization2']);
        expect(options.filter).toEqual([{
            lhs: 'testFilterField',
            operator: '!=',
            rhs: 'testFilterValue'
        }]);
        expect(options.dataLimit).toEqual(50);
        expect(options.hideUnfiltered).toEqual('true');
        expect(options.searchLimit).toEqual(100);
        expect(options.title).toEqual('VisualizationTitle');

        expect(options.testArray).toEqual([4, 3, 2, 1]);
        expect(options.testFreeText).toEqual('the quick brown fox jumps over the lazy dog');
        expect(options.testMultipleFields).toEqual([FIELD_MAP.X, FIELD_MAP.Y]);
        expect(options.testMultipleSelect).toEqual(['b', 'c']);
        expect(options.testObject).toEqual({
            key: 'value'
        });
        expect(options.testOptionalField).toEqual(FIELD_MAP.NAME);
        expect(options.testRequiredField).toEqual(FIELD_MAP.SIZE);
        expect(options.testSelect).toEqual('z');
        expect(options.testToggle).toEqual(true);
    });

    it('handleCreateLayer does return expected object', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        let layerOptions = SingleVisualizationWidgetComponent.handleCreateLayer(options, {});
        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].title).toEqual('Layer 1');
        expect(options.layers[0].databases).toEqual(DATABASES_LIST);
        expect(options.layers[0].database).toEqual(DATABASES.testDatabase1);
        expect(options.layers[0].tables).toEqual(TABLES_LIST);
        expect(options.layers[0].table).toEqual(TABLES.testTable1);
        expect(options.layers[0].fields).toEqual(FIELDS);
        expect(options.layers[0]).toEqual(layerOptions);
    });

    it('handleCreateLayer with bindings does return expected object', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        let layerOptions = SingleVisualizationWidgetComponent.handleCreateLayer(options, {
            tableKey: 'table_key_2',
            title: 'Title Binding'
        });
        expect(options.layers.length).toEqual(1);
        expect(options.layers[0].title).toEqual('Title Binding');
        expect(options.layers[0].databases).toEqual(DATABASES_LIST);
        expect(options.layers[0].database).toEqual(DATABASES.testDatabase2);
        expect(options.layers[0].tables).toEqual(TABLES_LIST);
        expect(options.layers[0].table).toEqual(TABLES.testTable2);
        expect(options.layers[0].fields).toEqual(FIELDS);
        expect(options.layers[0]).toEqual(layerOptions);
    });

    it('handleDeleteLayer does work as expected', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        options.addLayer();
        let id1 = options.layers[0]._id;
        expect(options.layers.length).toEqual(1);

        // Do not delete the final layer
        let result1 = SingleVisualizationWidgetComponent.handleDeleteLayer(options, options.layers[0]);
        expect(options.layers.length).toEqual(1);
        expect(options.layers[0]._id).toEqual(id1);
        expect(result1).toEqual(false);

        options.addLayer();
        let id2 = options.layers[1]._id;
        expect(options.layers.length).toEqual(2);

        let result2 = SingleVisualizationWidgetComponent.handleDeleteLayer(options, options.layers[0]);
        expect(options.layers.length).toEqual(1);
        expect(options.layers[0]._id).toEqual(id2);
        expect(result2).toEqual(true);
    });

    it('retrieveExportFields does return expected array', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        options.append(new ConfigOptionField('testRequiredField', 'Test Required Field', true), FIELD_MAP.NAME);
        options.append(new ConfigOptionField('testOptionalField', 'Test Optional Field', false), FIELD_MAP.TYPE);
        options.append(new ConfigOptionFieldArray('testMultipleFields', 'Test Multiple Fields', false), [FIELD_MAP.DATE,
            FIELD_MAP.SIZE]);

        expect(SingleVisualizationWidgetComponent.retrieveExportFields(options)).toEqual([{
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        }, {
            columnName: 'testTypeField',
            prettyName: 'Test Type Field'
        }, {
            columnName: 'testDateField',
            prettyName: 'Test Date Field'
        }, {
            columnName: 'testSizeField',
            prettyName: 'Test Size Field'
        }]);
    });

    it('retrieveExportFields does not return empty or repeated fields', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        options.append(new ConfigOptionField('testFieldA', 'Test Field A', true), FIELD_MAP.NAME);
        options.append(new ConfigOptionField('testFieldB', 'Test Field B', true), FieldConfig.get());
        options.append(new ConfigOptionField('testFieldC', 'Test Field C', true), FIELD_MAP.NAME);

        expect(SingleVisualizationWidgetComponent.retrieveExportFields(options)).toEqual([{
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        }]);
    });
});

describe('SingleVisualizationWidgetComponent', () => {
    let changeDetectorMock;
    let component: SingleVisualizationWidgetComponent;
    let dashboardServiceMock: DashboardServiceMock;
    let dialogMock;
    let widgetElementMock: HTMLElement;

    beforeEach(() => {
        const colorThemeService = new InjectableColorThemeService();
        dashboardServiceMock = new DashboardServiceMock(getConfigService(NeonConfig.get()));
        const filterService = new InjectableFilterService();
        const searchServiceMock = new SearchServiceMock();
        changeDetectorMock = jasmine.createSpyObj('ChangeDetectorRef', ['detach', 'detectChanges']);
        dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        component = new SingleVisualizationWidgetComponent(colorThemeService, dashboardServiceMock, filterService, searchServiceMock,
            changeDetectorMock, null, dialogMock);

        widgetElementMock = document.createElement('div');
        spyOn(component, '_getHtmlElement').and.returnValue(widgetElementMock);
    });

    function retrieveVisualizationEventListener(eventName: string, index: number, options?: any): any {
        let visElementMock = document.createElement('div');
        visElementMock.setAttribute('id', component.visElementId);
        widgetElementMock.appendChild(visElementMock);

        // eslint-disable-next-line jasmine/no-unsafe-spy
        let spyOnVis = spyOn(visElementMock, 'addEventListener');

        component.options = options || new RootWidgetOptionCollection(DATASET);

        component.ngAfterViewInit();

        expect(spyOnVis.calls.count()).toEqual(5);
        expect(spyOnVis.calls.argsFor(index)[0]).toEqual(eventName);

        return spyOnVis.calls.argsFor(index)[1];
    }

    it('does set dataset in component constructor', () => {
        expect(component.dataset).toEqual(DATASET);
    });

    it('getWidgetOptionMenuCallbacks does return expected data', () => {
        const callbacks = component.getWidgetOptionMenuCallbacks();
        /* eslint-disable @typescript-eslint/unbound-method */
        expect(typeof callbacks.changeOptions).toBe('function');
        expect(typeof callbacks.createLayer).toBe('function');
        expect(typeof callbacks.deleteLayer).toBe('function');
        expect(typeof callbacks.exportData).toBe('function');
        expect(typeof callbacks.finalizeCreateLayer).toBe('function');
        expect(typeof callbacks.finalizeDeleteLayer).toBe('function');
        expect(typeof callbacks.handleChangeSubcomponentType).toBe('function');
        /* eslint-enable @typescript-eslint/unbound-method */
        expect(callbacks.options).toEqual(component.options);
    });

    it('getWidgetOptionMenuCallbacks.changeOptions does update expected properties and publish expected events', () => {
        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        let spyPublish = spyOn(component['_eventMessenger'], 'publish');

        component.options = new RootWidgetOptionCollection(DATASET);
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';
        component['_cachedPage'] = 5;
        component['_lastPage'] = false;
        component['_page'] = 2;

        const callbacks = component.getWidgetOptionMenuCallbacks();
        callbacks.changeOptions();

        expect(spyTransform.calls.count()).toEqual(1);
        expect(spyPublish.calls.count()).toEqual(1);
        expect(spyPublish.calls.argsFor(0)[0]).toEqual(neonEvents.WIDGET_CONFIGURED);
        expect(component.errorMessage).toEqual('');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.showNoData).toEqual('');
        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_lastPage']).toEqual(true);
        expect(component['_page']).toEqual(1);
    });

    it('goToNextPage does not update page or transform options if lastPage is true', () => {
        expect(component['_lastPage']).toEqual(true);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        component.options = new RootWidgetOptionCollection(DATASET);

        component.goToNextPage();

        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('goToNextPage does update page and transform options if lastPage is false', () => {
        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        component['_lastPage'] = false;
        component.options = new RootWidgetOptionCollection(DATASET);

        component.goToNextPage();

        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(1);

        component.goToNextPage();

        expect(component['_page']).toEqual(3);
        expect(spyTransform.calls.count()).toEqual(2);
    });

    it('goToPreviousPage does not update page or transform options if page is 1', () => {
        expect(component['_page']).toEqual(1);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        component.options = new RootWidgetOptionCollection(DATASET);

        component.goToPreviousPage();

        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('goToPreviousPage does update page and transform options if page is not 1', () => {
        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        component['_page'] = 3;
        component.options = new RootWidgetOptionCollection(DATASET);

        component.goToPreviousPage();

        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(1);

        component.goToPreviousPage();

        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(2);
    });

    it('ngAfterViewInit does add event listeners to vis element and call expected functions', () => {
        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');

        let visElementMock = document.createElement('div');
        visElementMock.setAttribute('id', component.visElementId);
        widgetElementMock.appendChild(visElementMock);

        let spyOnVis = spyOn(visElementMock, 'addEventListener');

        component.options = new RootWidgetOptionCollection(DATASET);

        component.ngAfterViewInit();

        expect(spyOnVis.calls.count()).toEqual(5);
        expect(spyOnVis.calls.argsFor(0)[0]).toEqual('searchCanceled');
        expect(spyOnVis.calls.argsFor(1)[0]).toEqual('searchFailed');
        expect(spyOnVis.calls.argsFor(2)[0]).toEqual('searchFinished');
        expect(spyOnVis.calls.argsFor(3)[0]).toEqual('searchLaunched');
        expect(spyOnVis.calls.argsFor(4)[0]).toEqual('valuesFiltered');

        expect(spyTransform.calls.count()).toEqual(1);
        expect(changeDetectorMock.detectChanges).toHaveBeenCalledWith();
    });

    it('ngOnDestroy does call expected functions and publish expected events', () => {
        let spyUnsubscribe = spyOn(component['_eventMessenger'], 'unsubscribeAll');
        let spyPublish = spyOn(component['_eventMessenger'], 'publish');

        component.ngOnDestroy();

        expect(changeDetectorMock.detach).toHaveBeenCalledWith();
        expect(spyUnsubscribe.calls.count()).toEqual(1);
        expect(spyPublish.calls.count()).toEqual(1);
        expect(spyPublish.calls.argsFor(0)[0]).toEqual(neonEvents.WIDGET_UNREGISTER);
    });

    it('ngOnInit does create options and subscribe and publish expected events', () => {
        let spySubscribe = spyOn(component['_eventMessenger'], 'subscribe');
        let spyPublish = spyOn(component['_eventMessenger'], 'publish');

        component.options = null;

        component.ngOnInit();

        expect(component.options).toBeDefined();

        expect(spySubscribe.calls.count()).toEqual(1);
        expect(spySubscribe.calls.argsFor(0)[0]).toEqual(neonEvents.DASHBOARD_REFRESH);

        expect(spyPublish.calls.count()).toEqual(1);
        expect(spyPublish.calls.argsFor(0)[0]).toEqual(neonEvents.WIDGET_REGISTER);
    });

    it('onResizeStop does update header styles and call redraw and detectChanges', (done) => {
        let spyRedraw = spyOn(component, 'redraw');

        component.onResizeStop();

        setTimeout(() => {
            expect(changeDetectorMock.detectChanges).toHaveBeenCalledWith();
            expect(spyRedraw.calls.count()).toEqual(1);
            done();
        }, 500);
    });

    it('openContributionDialog does open dialog', () => {
        const contributors = {
            organization1: {
                orgName: 'Organization 1',
                abbreviation: 'ORG ONE',
                contactName: 'Test Name 1',
                contactEmail: 'test1@email.com',
                website: 'https://localhost:4200/1',
                logo: 'fake-logo-1.jpg'
            },
            organization2: {
                orgName: 'Organization 2',
                abbreviation: 'ORG TWO',
                contactName: 'Test Name 2',
                contactEmail: 'test2@email.com',
                website: 'https://localhost:4200/2',
                logo: 'fake-logo-2.jpg'
            }
        };
        dashboardServiceMock.state.dashboard.contributors = contributors;

        component.options = new RootWidgetOptionCollection(DATASET);

        component.openContributionDialog();

        expect(dialogMock.open).toHaveBeenCalledWith(DynamicDialogComponent, {
            data: {
                component: 'contribution-dialog',
                contributors: [contributors.organization1, contributors.organization2]
            },
            width: '400px',
            minHeight: '200px'
        });
    });

    it('retrieveContributionAbbreviations does return expected string', () => {
        const contributors = {
            organization1: {
                orgName: 'Organization 1',
                abbreviation: 'ORG ONE',
                contactName: 'Test Name 1',
                contactEmail: 'test1@email.com',
                website: 'https://localhost:4200/1',
                logo: 'fake-logo-1.jpg'
            },
            organization2: {
                orgName: 'Organization 2',
                abbreviation: 'ORG TWO',
                contactName: 'Test Name 2',
                contactEmail: 'test2@email.com',
                website: 'https://localhost:4200/2',
                logo: 'fake-logo-2.jpg'
            }
        };
        dashboardServiceMock.state.dashboard.contributors = contributors;

        component.options = new RootWidgetOptionCollection(DATASET);

        expect(component.retrieveContributionAbbreviations()).toEqual('ORG ONE, ORG TWO');
    });

    it('retrieveContributionAbbreviations does return expected string if options.contributionKeys is set', () => {
        const contributors = {
            organization1: {
                orgName: 'Organization 1',
                abbreviation: 'ORG ONE',
                contactName: 'Test Name 1',
                contactEmail: 'test1@email.com',
                website: 'https://localhost:4200/1',
                logo: 'fake-logo-1.jpg'
            },
            organization2: {
                orgName: 'Organization 2',
                abbreviation: 'ORG TWO',
                contactName: 'Test Name 2',
                contactEmail: 'test2@email.com',
                website: 'https://localhost:4200/2',
                logo: 'fake-logo-2.jpg'
            }
        };
        dashboardServiceMock.state.dashboard.contributors = contributors;

        component.options = new RootWidgetOptionCollection(DATASET);
        component.options.contributionKeys = ['organization2'];

        expect(component.retrieveContributionAbbreviations()).toEqual('ORG TWO');
    });

    it('showContribution does return true if contributors are set', () => {
        component.options = new RootWidgetOptionCollection(DATASET);

        expect(component.showContribution()).toEqual(false);

        const contributors = {
            organization1: {
                orgName: 'Organization 1',
                abbreviation: 'ORG ONE',
                contactName: 'Test Name 1',
                contactEmail: 'test1@email.com',
                website: 'https://localhost:4200/1',
                logo: 'fake-logo-1.jpg'
            },
            organization2: {
                orgName: 'Organization 2',
                abbreviation: 'ORG TWO',
                contactName: 'Test Name 2',
                contactEmail: 'test2@email.com',
                website: 'https://localhost:4200/2',
                logo: 'fake-logo-2.jpg'
            }
        };
        dashboardServiceMock.state.dashboard.contributors = contributors;

        expect(component.showContribution()).toEqual(true);
    });

    it('showPagination does return expected boolean', () => {
        component.options = new RootWidgetOptionCollection(DATASET);

        expect(component.showPagination()).toEqual(false);

        spyOn(SingleVisualizationWidgetComponent, 'isPaginatedVisualization').and.returnValue(true);

        expect(component.showPagination()).toEqual(false);

        component['_page'] = 2;
        expect(component.showPagination()).toEqual(true);

        component['_page'] = 1;
        component.options.dataLimit = 10;
        component.options.searchLimit = 10;
        expect(component.showPagination()).toEqual(false);

        component['_layerIdToElementCount'].set(component.options._id, 1000);
        expect(component.showPagination()).toEqual(true);

        component['_layerIdToElementCount'].set(component.options._id, 5);
        expect(component.showPagination()).toEqual(false);
    });

    it('searchCanceled event from vis element does update expected properties and call expected functions', () => {
        const onSearchCanceled = retrieveVisualizationEventListener('searchCanceled', 0);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        // Invoke the event listener callback function
        onSearchCanceled({
            detail: {}
        });

        expect(component.errorMessage).toEqual('');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('');
    });

    it('searchCanceled event with error message does update expected properties and call expected functions', () => {
        let spyPublish = spyOn(component['_eventMessenger'], 'publish');

        const onSearchCanceled = retrieveVisualizationEventListener('searchCanceled', 0);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        onSearchCanceled({
            detail: {
                error: 'New Error',
                message: 'New Message'
            }
        });

        expect(component.errorMessage).toEqual('New Message');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('New Message');

        expect(spyPublish.calls.count()).toEqual(1);
        expect(spyPublish.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_MESSAGE, {
            error: 'New Error',
            message: 'New Message'
        }]);
    });

    it('searchFailed event from vis element does update expected properties and call expected functions', () => {
        const onSearchFailed = retrieveVisualizationEventListener('searchFailed', 1);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        onSearchFailed({
            detail: {}
        });

        expect(component.errorMessage).toEqual('');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('');
    });

    it('searchFailed event with error message does update expected properties and call expected functions', () => {
        let spyPublish = spyOn(component['_eventMessenger'], 'publish');

        const onSearchFailed = retrieveVisualizationEventListener('searchFailed', 1);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        onSearchFailed({
            detail: {
                error: 'New Error',
                message: 'New Message'
            }
        });

        expect(component.errorMessage).toEqual('New Message');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('New Message');

        expect(spyPublish.calls.count()).toEqual(1);
        expect(spyPublish.calls.argsFor(0)).toEqual([neonEvents.DASHBOARD_MESSAGE, {
            error: 'New Error',
            message: 'New Message'
        }]);
    });

    it('searchFinished event from vis element does update expected properties and call expected functions', () => {
        const onSearchFinished = retrieveVisualizationEventListener('searchFinished', 2);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        onSearchFinished({
            detail: {
                size: 1234
            }
        });

        expect(component.errorMessage).toEqual('');
        expect(component.infoButtonText).toEqual('1,234 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('');
    });

    it('searchFinished event with no data does update expected properties and call expected functions', () => {
        const onSearchFinished = retrieveVisualizationEventListener('searchFinished', 2);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = '';

        onSearchFinished({
            detail: {
                size: 0
            }
        });

        expect(component.errorMessage).toEqual('No Data');
        expect(component.infoButtonText).toEqual('0 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('No Data');
    });

    it('searchFinished event with info property does update expected properties and call expected functions', () => {
        const onSearchFinished = retrieveVisualizationEventListener('searchFinished', 2);

        component.loadingCount = 1;
        component.errorMessage = 'Test Error Message';
        component.infoButtonText = 'Test Info Text';
        component.showNoData = 'No Data';

        onSearchFinished({
            detail: {
                info: 'New Info',
                size: 1234
            }
        });

        expect(component.errorMessage).toEqual('New Info');
        expect(component.infoButtonText).toEqual('1,234 Results');
        expect(component.loadingCount).toEqual(0);
        expect(component.showNoData).toEqual('New Info');
    });

    it('searchLaunched event from vis element does update expected properties', () => {
        const onSearchLaunched = retrieveVisualizationEventListener('searchLaunched', 3);

        component.loadingCount = 0;

        onSearchLaunched({
            detail: {}
        });

        expect(component.loadingCount).toEqual(1);
    });

    it('valuesFiltered event from vis element does update cachedPage but not page if filtered', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(false);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: ['a', 'b']
            }
        });

        expect(component['_cachedPage']).toEqual(2);
        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('valuesFiltered event from vis element does update cachedPage and page if filtered and self filterable', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(true);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: ['a', 'b']
            }
        });

        expect(component['_cachedPage']).toEqual(2);
        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(1);
    });

    it('valuesFiltered event from vis element does update cachedPage but not page if filtered but options.ignoreSelf=true', () => {
        let options = new RootWidgetOptionCollection(DATASET);
        options.ignoreSelf = true;

        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4, options);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(false);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: ['a', 'b']
            }
        });

        expect(component['_cachedPage']).toEqual(2);
        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('valuesFiltered event from vis element does not update cachedPage or page if filtered by a different caller', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(true);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: 'testElementId',
                values: ['a', 'b']
            }
        });

        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('valuesFiltered event from vis element does update cachedPage and page if not filtered', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(false);

        component['_cachedPage'] = 3;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: []
            }
        });

        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_page']).toEqual(3);
        expect(spyTransform.calls.count()).toEqual(1);
    });

    it('valuesFiltered event from vis element does not update page if not filtered and cachedPage is not set', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(false);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: []
            }
        });

        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_page']).toEqual(2);
        expect(spyTransform.calls.count()).toEqual(0);
    });

    it('valuesFiltered event from vis element does reset page if not filtered, cachedPage is not set, and is different caller', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(false);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: 'testElementId',
                values: []
            }
        });

        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(1);
    });

    it('valuesFiltered event from vis element does reset page if not filtered, cachedPage is not set, and is self filterable', () => {
        const onValuesFiltered = retrieveVisualizationEventListener('valuesFiltered', 4);

        let spyTransform = spyOn(SingleVisualizationWidgetComponent, 'transformComponentLibraryOptions');
        spyOn(SingleVisualizationWidgetComponent, 'isSelfFilterableVisualization').and.returnValue(true);

        component['_cachedPage'] = -1;
        component['_page'] = 2;

        onValuesFiltered({
            detail: {
                caller: component['_id'],
                values: []
            }
        });

        expect(component['_cachedPage']).toEqual(-1);
        expect(component['_page']).toEqual(1);
        expect(spyTransform.calls.count()).toEqual(1);
    });
});

describe('SingleVisualizationWidgetComponent (TEXT_CLOUD)', () => {
    it('createWidgetOptionCollection on TEXT_CLOUD with default options does return expected object', () => {
        const options = SingleVisualizationWidgetComponent.createWidgetOptionCollection({}, {}, DATASET,
            VisualizationType.TEXT_CLOUD);

        expect(options.searchLimit).toEqual(40);
        expect(options.title).toEqual('Text Cloud');

        expect(options.dataField).toEqual(FieldConfig.get());
        expect(options.sizeField).toEqual(FieldConfig.get());
        expect(options.aggregation).toEqual(AggregationType.COUNT);
        expect(options.andFilters).toEqual(true);
        expect(options.ignoreSelf).toEqual(false);
        expect(options.paragraphs).toEqual(false);
        expect(options.showCounts).toEqual(false);
    });

    it('createWidgetOptionCollection on TEXT_CLOUD with set options does return expected object', () => {
        const configOptions = {
            dataField: 'testTextField',
            sizeField: 'testSizeField',
            aggregation: 'avg',
            andFilters: false,
            ignoreSelf: true,
            paragraphs: true,
            showCounts: true
        };

        const options = SingleVisualizationWidgetComponent.createWidgetOptionCollection({}, configOptions, DATASET,
            VisualizationType.TEXT_CLOUD);

        expect(options.dataField).toEqual(FIELD_MAP.TEXT);
        expect(options.sizeField).toEqual(FIELD_MAP.SIZE);
        expect(options.aggregation).toEqual(AggregationType.AVG);
        expect(options.andFilters).toEqual(false);
        expect(options.ignoreSelf).toEqual(true);
        expect(options.paragraphs).toEqual(true);
        expect(options.showCounts).toEqual(true);
    });

    it('getVisualizationElementLabel on TEXT_CLOUD does return expected object', () => {
        expect(SingleVisualizationWidgetComponent.getVisualizationElementLabel(VisualizationType.TEXT_CLOUD, 0)).toEqual('Terms');
        expect(SingleVisualizationWidgetComponent.getVisualizationElementLabel(VisualizationType.TEXT_CLOUD, 1)).toEqual('Term');
        expect(SingleVisualizationWidgetComponent.getVisualizationElementLabel(VisualizationType.TEXT_CLOUD, 2)).toEqual('Terms');
    });

    it('isPaginatedVisualization on TEXT_CLOUD does return expected object', () => {
        expect(SingleVisualizationWidgetComponent.isPaginatedVisualization(VisualizationType.TEXT_CLOUD)).toEqual(false);
    });

    it('isSelfFilterableVisualization on TEXT_CLOUD does return expected object', () => {
        expect(SingleVisualizationWidgetComponent.isSelfFilterableVisualization(VisualizationType.TEXT_CLOUD)).toEqual(true);
    });

    it('transformComponentLibraryOptions on TEXT_CLOUD with missing required options does return null', () => {
        const colorThemeService = new InjectableColorThemeService();
        const options = new RootWidgetOptionCollection(DATASET);

        expect(SingleVisualizationWidgetComponent.transformComponentLibraryOptions(colorThemeService, options, 1,
            VisualizationType.TEXT_CLOUD)).toEqual(null);
    });

    it('transformComponentLibraryOptions on TEXT_CLOUD with minimal options does return expected object', () => {
        const colorThemeService = new InjectableColorThemeService();
        const options = new RootWidgetOptionCollection(DATASET);
        options.dataField = FIELD_MAP.TEXT;

        expect(SingleVisualizationWidgetComponent.transformComponentLibraryOptions(colorThemeService, options, 1,
            VisualizationType.TEXT_CLOUD)).toEqual({
            'color-accent': '#54C8CD',
            'color-text': '#333333',
            'data-limit': 0,
            'enable-hide-if-unfiltered': undefined,
            'enable-ignore-self-filter': undefined,
            'search-limit': 0,
            'search-page': 1,
            'aggregation-field-key': undefined,
            'aggregation-type': undefined,
            'enable-show-paragraphs': undefined,
            'enable-show-values': undefined,
            'list-intersection': undefined,
            'text-field-key': 'datastore1.testDatabase1.testTable1.testTextField'
        });
    });

    it('transformComponentLibraryOptions on TEXT_CLOUD with set options does return expected object', () => {
        const colorThemeService = new InjectableColorThemeService();
        const options = new RootWidgetOptionCollection(DATASET);
        options.dataField = FIELD_MAP.TEXT;
        options.sizeField = FIELD_MAP.SIZE;
        options.dataLimit = 50;
        options.hideUnfiltered = 'true';
        options.searchLimit = 100;
        options.aggregation = AggregationType.AVG;
        options.andFilters = true;
        options.ignoreSelf = true;
        options.paragraphs = true;
        options.showCounts = true;

        expect(SingleVisualizationWidgetComponent.transformComponentLibraryOptions(colorThemeService, options, 2,
            VisualizationType.TEXT_CLOUD)).toEqual({
            'color-accent': '#54C8CD',
            'color-text': '#333333',
            'data-limit': 50,
            'enable-hide-if-unfiltered': true,
            'enable-ignore-self-filter': true,
            'search-limit': 100,
            'search-page': 2,
            'aggregation-field-key': 'datastore1.testDatabase1.testTable1.testSizeField',
            'aggregation-type': 'avg',
            'enable-show-paragraphs': true,
            'enable-show-values': true,
            'list-intersection': true,
            'text-field-key': 'datastore1.testDatabase1.testTable1.testTextField'
        });
    });
});
