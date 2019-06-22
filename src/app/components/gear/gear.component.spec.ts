/**
 * Copyright 2019 Next Century Corporation
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';
import { } from 'jasmine-core';

import { GearComponent } from '../gear/gear.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';

import { NeonFieldMetaData } from '../../models/dataset';

import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { neonEvents } from '../../models/neon-namespaces';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { GearModule } from './gear.module';
import { DashboardState } from '../../models/dashboard-state';
import {
    OptionChoices,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetSelectOption
} from '../../models/widget-option';
import { RootWidgetOptionCollection, WidgetOptionCollection, ConfigurableWidget } from '../../models/widget-option-collection';

class MockConfigurable implements ConfigurableWidget {
    options: WidgetOptionCollection;
    calledChangeData = 0;
    calledChangeFilterData = 0;
    calledFinalizeCreateLayer = 0;
    calledFinalizeDeleteLayer = 0;
    calledCreateLayer = 0;
    calledDeleteLayer = 0;
    calledHandleChangeSubcomponentType = 0;
    calledExportData = 0;

    constructor(dashboardState: DashboardState) {
        this.options = new RootWidgetOptionCollection(() => [], () => [], dashboardState.asDataset(), 'Test Layer', 100, false);
    }

    changeData(__options?: WidgetOptionCollection, __databaseOrTableChange?: boolean): void {
        this.calledChangeData++;
    }

    changeFilterData(__options?: WidgetOptionCollection, __databaseOrTableChange?: boolean): void {
        this.calledChangeFilterData++;
    }

    finalizeCreateLayer(__layerOptions: any): void {
        this.calledFinalizeCreateLayer++;
    }

    finalizeDeleteLayer(__layerOptions: any): void {
        this.calledFinalizeDeleteLayer++;
    }

    createLayer(__options: WidgetOptionCollection, __layerBindings?: Record<string, any>): void {
        this.calledCreateLayer++;
    }

    deleteLayer(__options: WidgetOptionCollection, __layerOptions: any): boolean {
        this.calledDeleteLayer++;
        return undefined;
    }

    handleChangeSubcomponentType(__options?: WidgetOptionCollection): void {
        this.calledFinalizeDeleteLayer++;
    }

    exportData(): { name: string, data: any }[] {
        this.calledExportData++;
        return [];
    }
}

describe('Component: Gear Component', () => {
    let component: GearComponent;
    let fixture: ComponentFixture<GearComponent>;

    initializeTestBed('gear component', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector
        ],
        imports: [
            GearModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GearComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component['originalOptions']).not.toBeDefined();
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('getIconForFilter does return expected string', () => {
        expect(component.getIconForFilter({
            _id: 'testId1'
        })).toEqual('keyboard_arrow_up');

        component.layerHidden.set('testId1', true);
        expect(component.getIconForFilter({
            _id: 'testId1'
        })).toEqual('keyboard_arrow_down');
        expect(component.getIconForFilter({
            _id: 'testId2'
        })).toEqual('keyboard_arrow_up');

        component.layerHidden.set('testId1', false);
        expect(component.getIconForFilter({
            _id: 'testId1'
        })).toEqual('keyboard_arrow_up');
    });

    it('getIconForOptions does return expected string', () => {
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_down');
        component.collapseOptionalOptions = false;
        expect(component.getIconForOptions()).toEqual('keyboard_arrow_up');
    });

    it('getLayerList does return expected list', () => {
        let layer: any = new WidgetOptionCollection(() => [], component['dashboardState'].asDataset(), 'Test Layer', 100);
        expect(component.getLayerList(layer)).toEqual(['limit']);

        layer.append(new WidgetFieldOption('field', '', true));
        layer.append(new WidgetFreeTextOption('freeText', '', ''));
        layer.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        layer.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, true));
        expect(component.getLayerList(layer)).toEqual(['limit', 'field', 'freeText', 'select']);
    });

    it('handleApplyClick with non-field change does update originalOptions and call handleChangeData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component['originalOptions'].append(new WidgetFreeTextOption('testOption', '', ''), '');

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.append(new WidgetFreeTextOption('testOption', '', ''), 'testText');

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].testOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.testOption).toEqual('testText');

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].testOption).toEqual('testText');
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with field change does update originalOptions and call handleChangeFilterData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component['originalOptions'].append(new WidgetFieldOption('testField', '', true), NeonFieldMetaData.get());

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.append(new WidgetFieldOption('testField', '', true), DashboardServiceMock.FIELD_MAP.NAME);

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].testField).toEqual(NeonFieldMetaData.get());
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.testField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].testField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with database change does update originalOptions and call handleChangeFilterData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.database = DashboardServiceMock.DATABASES.testDatabase2;

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with table change does update originalOptions and call handleChangeFilterData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.table = DashboardServiceMock.TABLES.testTable2;

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable2);

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with created layer does update originalOptions and call handleChangeData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        let layer: any = new WidgetOptionCollection(() => [], component['dashboardState'].asDataset(), 'Test Layer', 100);
        component.modifiedOptions.layers.push(layer);

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(0);
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(mock.calledFinalizeCreateLayer).toEqual(1);
        expect(mock.calledFinalizeDeleteLayer).toEqual(0);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with changed layer does update originalOptions and call handleChangeData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        let layer: any = new WidgetOptionCollection(() => [], component['dashboardState'].asDataset(), 'Test Layer', 100);
        layer.append(new WidgetFreeTextOption('testNestedOption', '', ''), '');
        component['originalOptions'].layers.push(layer);
        component.modifiedOptions.layers.push(layer.copy());
        component.modifiedOptions.layers[0].testNestedOption = 'testNestedText';

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(component['originalOptions'].layers[0].testNestedOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.layers[0].testNestedOption).toEqual('testNestedText');

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(component['originalOptions'].layers[0].testNestedOption).toEqual('testNestedText');
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(mock.calledFinalizeCreateLayer).toEqual(0);
        expect(mock.calledFinalizeDeleteLayer).toEqual(0);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with deleted layer does update originalOptions and call handleChangeData', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        let layer: any = new WidgetOptionCollection(() => [], component['dashboardState'].asDataset(), 'Test Layer', 100);
        component['originalOptions'].layers.push(layer);

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.modifiedOptions.layers.length).toEqual(0);

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].layers.length).toEqual(0);
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(mock.calledFinalizeCreateLayer).toEqual(0);
        expect(mock.calledFinalizeDeleteLayer).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with many changes does update originalOptions and call expected function', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        component['closeSidenav'] = () => {
            calledCloseSidenav++;
        };

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component['originalOptions'].append(new WidgetFreeTextOption('testOption', '', ''), '');
        component['originalOptions'].append(new WidgetFieldOption('testField', '', true), NeonFieldMetaData.get());

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.modifiedOptions.table = DashboardServiceMock.TABLES.testTable2;
        component.modifiedOptions.append(new WidgetFreeTextOption('testOption', '', ''), 'testText');
        component.modifiedOptions.append(new WidgetFieldOption('testField', '', true), DashboardServiceMock.FIELD_MAP.NAME);

        let layer: any = new WidgetOptionCollection(() => [], component['dashboardState'].asDataset(), 'Test Layer', 100);
        layer.append(new WidgetFreeTextOption('testNestedOption', '', ''), '');
        component['originalOptions'].layers.push(layer);
        component.modifiedOptions.layers.push(layer.copy());
        component.modifiedOptions.layers[0].testNestedOption = 'testNestedText';

        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component['originalOptions'].testOption).toEqual('');
        expect(component['originalOptions'].testField).toEqual(NeonFieldMetaData.get());
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(component['originalOptions'].layers[0].testNestedOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.modifiedOptions.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.modifiedOptions.testOption).toEqual('testText');
        expect(component.modifiedOptions.testField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.layers[0].testNestedOption).toEqual('testNestedText');

        component.handleApplyClick();
        expect(component['originalOptions'].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component['originalOptions'].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component['originalOptions'].testOption).toEqual('testText');
        expect(component['originalOptions'].testField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component['originalOptions'].layers.length).toEqual(1);
        expect(component['originalOptions'].layers[0]._id).toEqual(layer._id);
        expect(component['originalOptions'].layers[0].testNestedOption).toEqual('testNestedText');
        expect(mock.calledChangeData).toEqual(0);
        expect(mock.calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(mock.calledFinalizeCreateLayer).toEqual(0);
        expect(mock.calledFinalizeDeleteLayer).toEqual(0);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleChangeDatabase does update tables', () => {
        let called = 0;
        let options: any = {
            updateTables: () => {
                called++;
            }
        };

        component.handleChangeDatabase(options);
        expect(called).toEqual(1);
        expect(component.changeMade).toEqual(true);
    });

    it('handleChangeTable does update fields', () => {
        let called = 0;
        let options: any = {
            updateFields: () => {
                called++;
            }
        };

        component.handleChangeTable(options);
        expect(called).toEqual(1);
        expect(component.changeMade).toEqual(true);
    });

    it('handleCreateLayer does call createLayer', () => {
        component.comp = new MockConfigurable(component['dashboardState']);
        let spyCreate = spyOn(component.comp, 'createLayer').and.returnValue({
            _id: 'testId1'
        });

        component.handleCreateLayer();
        expect(spyCreate.calls.count()).toEqual(1);
        expect(component.layerHidden.get('testId1')).toEqual(false);
        expect(component.changeMade).toEqual(true);
    });

    it('handleDeleteLayer does call deleteLayer', () => {
        component.layerHidden.set('testId1', true);
        component.comp = new MockConfigurable(component['dashboardState']);
        let spyDelete = spyOn(component.comp, 'deleteLayer').and.returnValue(true);

        component.handleDeleteLayer({
            _id: 'testId1'
        });
        expect(spyDelete.calls.count()).toEqual(1);
        expect(component.layerHidden.has('testId1')).toEqual(false);
        expect(component.changeMade).toEqual(true);
    });

    it('handleDeleteLayer does not delete a layer if deleteLayer returned false', () => {
        let spy = spyOn(component['messenger'], 'publish');

        component.layerHidden.set('testId1', true);
        component.comp = new MockConfigurable(component['dashboardState']);
        let spyDelete = spyOn(component.comp, 'deleteLayer').and.returnValue(false);

        component.handleDeleteLayer({
            _id: 'testId1'
        });
        expect(spyDelete.calls.count()).toEqual(1);
        expect(component.layerHidden.get('testId1')).toEqual(true);
        expect(component.changeMade).toEqual(false);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual(neonEvents.DASHBOARD_ERROR);
    });

    it('toggleFilter does update layerHidden', () => {
        component.layerHidden.set('testId1', true);
        component.layerHidden.set('testId2', true);

        component.toggleFilter({
            _id: 'testId1'
        });
        expect(component.layerHidden.get('testId1')).toEqual(false);
        expect(component.layerHidden.get('testId2')).toEqual(true);

        component.toggleFilter({
            _id: 'testId2'
        });
        expect(component.layerHidden.get('testId1')).toEqual(false);
        expect(component.layerHidden.get('testId2')).toEqual(false);

        component.toggleFilter({
            _id: 'testId1'
        });
        expect(component.layerHidden.get('testId1')).toEqual(true);
        expect(component.layerHidden.get('testId2')).toEqual(false);
    });

    it('toggleOptionalOptions does update collapseOptionalOptions', () => {
        expect(component.collapseOptionalOptions).toEqual(true);
        component.toggleOptionalOptions();
        expect(component.collapseOptionalOptions).toEqual(false);
    });

    it('updateOnChange does update changeMade and detects NonPrimitive options correctly', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        component['originalOptions'] = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component['originalOptions'].append(new WidgetNonPrimitiveOption('testOption1', 'TestOption', ''), {});

        component.modifiedOptions = new RootWidgetOptionCollection(() => [], () => [], component['dashboardState'].asDataset(),
            'Test Layer', 100, false);
        component.modifiedOptions.append(new WidgetNonPrimitiveOption('testOption1', 'TestOption', ''), {});
        expect(component.changeMade).toEqual(false);
        expect(component.modifiedOptions.testOption1).toEqual({});
        component.modifiedOptions['testOption1'] = { foo: true };
        component.updateOnChange('testOption1');
        expect(component.changeMade).toEqual(true);

        component['originalOptions'].append(new WidgetNonPrimitiveOption('testOption2', 'TestOption', ''), { foo: true });
        component.modifiedOptions.append(new WidgetNonPrimitiveOption('testOption2', 'TestOption', ''), { foo: true });
        component.updateOnChange('testOption2');
        expect(component.changeMade).toEqual(false);
        expect(component.modifiedOptions.testOption2).toEqual({ foo: true });
        component.modifiedOptions['testOption2'] = {};
        component.updateOnChange('testOption2');
        expect(component.changeMade).toEqual(true);

        component['originalOptions'].append(new WidgetNonPrimitiveOption('testOption3', 'TestOption', ''), {});
        component.modifiedOptions.append(new WidgetNonPrimitiveOption('testOption3', 'TestOption', ''), undefined);
        component.updateOnChange('testOption3');
        expect(component.changeMade).toEqual(false);
    });

    it('does have expected default HTML elements', () => {
        // TODO
    });

    it('handleRefreshClick does reset options and close menu', () => {
        const mock = new MockConfigurable(component['dashboardState']);
        component.comp = mock;

        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };

        component.handleRefreshClick();

        expect(mock.calledChangeData).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(calledCloseSidenav).toEqual(1);
    });

    it('resetOptionsAndClose does reset HTML elements and close gear menu', () => {
        // TODO
        // component.resetOptionsAndClose();
        // expect(component.changeMade).toEqual(false);
        // expect(component.collapseOptionalOptions).toEqual(true);
        // expect(component.layerHidden).toEqual(new Map<string, boolean>());
    });

    it('publishing a message on the options channel does set HTML elements', () => {
        // TODO
        // let messenger = new eventing.Messenger;
        // messenger.publish(neonEvents.SHOW_OPTION_MENU, {});
        // expect(component.changeMage).toEqual(false);
        // expect(component.collapseOptionalOptions).toEqual(true);
        // expect(component.layerHidden).toEqual(new Map<string, boolean>());
    });
});
