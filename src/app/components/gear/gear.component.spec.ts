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
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { WidgetService } from '../../services/widget.service';

import { FieldMetaData } from '../../dataset';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { neonEvents } from '../../neon-namespaces';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { GearModule } from './gear.module';
import { ConfigService } from '../../services/config.service';
import { WidgetOptionCollection, WidgetFreeTextOption, WidgetFieldOption, WidgetSelectOption, OptionChoices } from '../../widget-option';

describe('Component: Gear Component', () => {
    let component: GearComponent;
    let fixture: ComponentFixture<GearComponent>;

    initializeTestBed('gear component', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: AbstractWidgetService, useClass: WidgetService },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }
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
        expect((component as any).originalOptions).not.toBeDefined();
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
        let layer: any = new WidgetOptionCollection(() => []);
        expect(component.getLayerList(layer)).toEqual([]);

        layer.append(new WidgetFieldOption('field', '', true));
        layer.append(new WidgetFreeTextOption('freeText', '', ''));
        layer.append(new WidgetSelectOption('select', '', false, OptionChoices.NoFalseYesTrue));
        layer.append(new WidgetSelectOption('hidden', '', false, OptionChoices.NoFalseYesTrue, false));
        expect(component.getLayerList(layer)).toEqual(['field', 'freeText', 'select']);
    });

    it('handleApplyClick with non-field change does update originalOptions and call handleChangeData', () => {
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);
        (component as any).originalOptions.append(new WidgetFreeTextOption('testOption', '', ''), '');

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);
        component.modifiedOptions.append(new WidgetFreeTextOption('testOption', '', ''), 'testText');

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.testOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.testOption).toEqual('testText');

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.testOption).toEqual('testText');
        expect(calledChangeData).toEqual(1);
        expect(calledChangeFilterData).toEqual(0);
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
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);
        (component as any).originalOptions.append(new WidgetFieldOption('testField', '', true), new FieldMetaData());

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);
        component.modifiedOptions.append(new WidgetFieldOption('testField', '', true), DatasetServiceMock.NAME_FIELD);

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.testField).toEqual(new FieldMetaData());
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.testField).toEqual(DatasetServiceMock.NAME_FIELD);

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.testField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(calledChangeData).toEqual(0);
        expect(calledChangeFilterData).toEqual(1);
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
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);
        component.modifiedOptions.database = DatasetServiceMock.DATABASES[1];

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(calledChangeData).toEqual(0);
        expect(calledChangeFilterData).toEqual(1);
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
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);
        component.modifiedOptions.table = DatasetServiceMock.TABLES[1];

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[1]);

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(calledChangeData).toEqual(0);
        expect(calledChangeFilterData).toEqual(1);
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
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };
        let calledFinalizeCreate = 0;
        (component as any).finalizeCreateLayer = () => {
            calledFinalizeCreate++;
        };
        let calledFinalizeDelete = 0;
        (component as any).finalizeDeleteLayer = () => {
            calledFinalizeDelete++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);

        let layer: any = new WidgetOptionCollection(() => []);
        layer.updateDatabases((component as any).datasetService);
        component.modifiedOptions.layers.push(layer);

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(0);
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect(calledChangeData).toEqual(1);
        expect(calledChangeFilterData).toEqual(0);
        expect(calledCloseSidenav).toEqual(1);
        expect(calledFinalizeCreate).toEqual(1);
        expect(calledFinalizeDelete).toEqual(0);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with changed layer does update originalOptions and call handleChangeData', () => {
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };
        let calledFinalizeCreate = 0;
        (component as any).finalizeCreateLayer = () => {
            calledFinalizeCreate++;
        };
        let calledFinalizeDelete = 0;
        (component as any).finalizeDeleteLayer = () => {
            calledFinalizeDelete++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);

        let layer: any = new WidgetOptionCollection(() => []);
        layer.updateDatabases((component as any).datasetService);
        layer.append(new WidgetFreeTextOption('testNestedOption', '', ''), '');
        (component as any).originalOptions.layers.push(layer);
        component.modifiedOptions.layers.push(layer.copy());
        component.modifiedOptions.layers[0].testNestedOption = 'testNestedText';

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect((component as any).originalOptions.layers[0].testNestedOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.layers[0].testNestedOption).toEqual('testNestedText');

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect((component as any).originalOptions.layers[0].testNestedOption).toEqual('testNestedText');
        expect(calledChangeData).toEqual(1);
        expect(calledChangeFilterData).toEqual(0);
        expect(calledCloseSidenav).toEqual(1);
        expect(calledFinalizeCreate).toEqual(0);
        expect(calledFinalizeDelete).toEqual(0);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with deleted layer does update originalOptions and call handleChangeData', () => {
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };
        let calledFinalizeCreate = 0;
        (component as any).finalizeCreateLayer = () => {
            calledFinalizeCreate++;
        };
        let calledFinalizeDelete = 0;
        (component as any).finalizeDeleteLayer = () => {
            calledFinalizeDelete++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);

        let layer: any = new WidgetOptionCollection(() => []);
        layer.updateDatabases((component as any).datasetService);
        (component as any).originalOptions.layers.push(layer);

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.modifiedOptions.layers.length).toEqual(0);

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.layers.length).toEqual(0);
        expect(calledChangeData).toEqual(1);
        expect(calledChangeFilterData).toEqual(0);
        expect(calledCloseSidenav).toEqual(1);
        expect(calledFinalizeCreate).toEqual(0);
        expect(calledFinalizeDelete).toEqual(1);
        expect(component.changeMade).toEqual(false);
        expect(component.collapseOptionalOptions).toEqual(true);
        expect(component.layerHidden).toEqual(new Map<string, boolean>());
        expect(component.modifiedOptions.databases).toEqual([]);
        expect(component.modifiedOptions.fields).toEqual([]);
        expect(component.modifiedOptions.layers).toEqual([]);
        expect(component.modifiedOptions.tables).toEqual([]);
    });

    it('handleApplyClick with many changes does update originalOptions and call expected function', () => {
        let calledChangeData = 0;
        (component as any).handleChangeData = () => {
            calledChangeData++;
        };
        let calledChangeFilterData = 0;
        (component as any).handleChangeFilterData = () => {
            calledChangeFilterData++;
        };
        let calledCloseSidenav = 0;
        (component as any).closeSidenav = () => {
            calledCloseSidenav++;
        };
        let calledFinalizeCreate = 0;
        (component as any).finalizeCreateLayer = () => {
            calledFinalizeCreate++;
        };
        let calledFinalizeDelete = 0;
        (component as any).finalizeDeleteLayer = () => {
            calledFinalizeDelete++;
        };

        (component as any).originalOptions = new WidgetOptionCollection(() => []);
        (component as any).originalOptions.updateDatabases((component as any).datasetService);
        (component as any).originalOptions.append(new WidgetFreeTextOption('testOption', '', ''), '');
        (component as any).originalOptions.append(new WidgetFieldOption('testField', '', true), new FieldMetaData());

        component.modifiedOptions = new WidgetOptionCollection(() => []);
        component.modifiedOptions.updateDatabases((component as any).datasetService);
        component.modifiedOptions.database = DatasetServiceMock.DATABASES[1];
        component.modifiedOptions.table = DatasetServiceMock.TABLES[1];
        component.modifiedOptions.append(new WidgetFreeTextOption('testOption', '', ''), 'testText');
        component.modifiedOptions.append(new WidgetFieldOption('testField', '', true), DatasetServiceMock.NAME_FIELD);

        let layer: any = new WidgetOptionCollection(() => []);
        layer.updateDatabases((component as any).datasetService);
        layer.append(new WidgetFreeTextOption('testNestedOption', '', ''), '');
        (component as any).originalOptions.layers.push(layer);
        component.modifiedOptions.layers.push(layer.copy());
        component.modifiedOptions.layers[0].testNestedOption = 'testNestedText';

        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((component as any).originalOptions.testOption).toEqual('');
        expect((component as any).originalOptions.testField).toEqual(new FieldMetaData());
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect((component as any).originalOptions.layers[0].testNestedOption).toEqual('');
        expect(component.modifiedOptions.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.modifiedOptions.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.modifiedOptions.testOption).toEqual('testText');
        expect(component.modifiedOptions.testField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.modifiedOptions.layers.length).toEqual(1);
        expect(component.modifiedOptions.layers[0]._id).toEqual(layer._id);
        expect(component.modifiedOptions.layers[0].testNestedOption).toEqual('testNestedText');

        component.handleApplyClick();
        expect((component as any).originalOptions.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((component as any).originalOptions.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((component as any).originalOptions.testOption).toEqual('testText');
        expect((component as any).originalOptions.testField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect((component as any).originalOptions.layers.length).toEqual(1);
        expect((component as any).originalOptions.layers[0]._id).toEqual(layer._id);
        expect((component as any).originalOptions.layers[0].testNestedOption).toEqual('testNestedText');
        expect(calledChangeData).toEqual(0);
        expect(calledChangeFilterData).toEqual(1);
        expect(calledCloseSidenav).toEqual(1);
        expect(calledFinalizeCreate).toEqual(0);
        expect(calledFinalizeDelete).toEqual(0);
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
        let called = 0;
        (component as any).createLayer = () => {
            called++;
            return {
                _id: 'testId' + called
            };
        };

        component.handleCreateLayer();
        expect(called).toEqual(1);
        expect(component.layerHidden.get('testId1')).toEqual(false);
        expect(component.changeMade).toEqual(true);
    });

    it('handleDeleteLayer does call deleteLayer', () => {
        component.layerHidden.set('testId1', true);
        let called = 0;
        (component as any).deleteLayer = () => {
            called++;
            return true;
        };

        component.handleDeleteLayer({
            _id: 'testId1'
        });
        expect(called).toEqual(1);
        expect(component.layerHidden.has('testId1')).toEqual(false);
        expect(component.changeMade).toEqual(true);
    });

    it('handleDeleteLayer does not delete a layer if deleteLayer returned false', () => {
        let spy = spyOn((component as any).messenger, 'publish');

        component.layerHidden.set('testId1', true);
        let called = 0;
        (component as any).deleteLayer = () => {
            called++;
            return false;
        };

        component.handleDeleteLayer({
            _id: 'testId1'
        });
        expect(called).toEqual(1);
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

    it('updateOnChange does update changeMade', () => {
        expect(component.changeMade).toEqual(false);
        component.updateOnChange('testBindingKey1');
        expect(component.changeMade).toEqual(true);
        component.updateOnChange('testBindingKey2');
        expect(component.changeMade).toEqual(true);
    });

    it('does have expected default HTML elements', () => {
        // TODO
    });

    it('resetOptionsAndClose does reset HTML elements and close gear menu', () => {
        // TODO
        // component.resetOptionsAndClose();
        // expect(component.changeMage).toEqual(false);
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
