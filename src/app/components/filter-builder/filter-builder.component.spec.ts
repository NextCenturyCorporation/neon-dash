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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import {} from 'jasmine-core';

import { AppMaterialModule } from '../../app.material.module';
import { FieldMetaData } from '../../dataset';
import { FilterBuilderComponent } from './filter-builder.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import * as neon from 'neon-framework';

describe('Component: Filter Builder', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: FilterBuilderComponent;
    let fixture: ComponentFixture<FilterBuilderComponent>;

    initializeTestBed({
        declarations: [
            FilterBuilderComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.clauseConfig).toEqual([]);
        expect(component.options.requireAll).toEqual(false);
    });

    it('class properties are set to expected defaults', () => {
        expect(component.clauses.length).toEqual(1);
        expect(component.clauses[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.clauses[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.clauses[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.clauses[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.clauses[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.clauses[0].field).toEqual(new FieldMetaData());
        expect(component.clauses[0].operator.value).toEqual('contains');
        expect(component.clauses[0].value).toEqual('');
        expect(component.clauses[0].active).toEqual(false);
        expect(component.clauses[0].id).toEqual(1);
        expect(component.clauses[0].changeDatabase).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.clauses[0].changeTable).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.clauses[0].changeField).toEqual(new FieldMetaData());

        let databaseTableFieldKeys = Array.from(component.databaseTableFieldKeysToFilterIds.keys());
        expect(databaseTableFieldKeys.length > 0).toEqual(true);

        databaseTableFieldKeys.forEach((key) => {
            expect(component.databaseTableFieldKeysToFilterIds.get(key)).toEqual('');
        });
    });

    it('addBlankFilterClause does work as expected', () => {
        component.addBlankFilterClause();

        expect(component.clauses.length).toEqual(2);
        expect(component.clauses[1].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.clauses[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.clauses[1].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.clauses[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.clauses[1].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.clauses[1].field).toEqual(new FieldMetaData());
        expect(component.clauses[1].operator.value).toEqual('contains');
        expect(component.clauses[1].value).toEqual('');
        expect(component.clauses[1].active).toEqual(false);
        expect(component.clauses[1].id).toEqual(2);
        expect(component.clauses[1].changeDatabase).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.clauses[1].changeTable).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.clauses[1].changeField).toEqual(new FieldMetaData());
    });

    it('addOrReplaceFilter does nothing if given filter does not have clauses', () => {
        // TODO
    });

    it('addOrReplaceFilter does add given filter', () => {
        // TODO
    });

    it('addOrReplaceFilter does replace given filter if filterId is defined', () => {
        // TODO
    });

    it('addOrReplaceFilter does work with multiple filter clauses', () => {
        // TODO
    });

    it('createFilterNameObject does return expected object', () => {
        expect(component.createFilterNameObject()).toEqual({
            visName: 'Filter Builder',
            text: '0 Filters'
        });

        component.clauses[0].active = true;
        component.clauses[0].field = DatasetServiceMock.TEXT_FIELD;
        component.clauses[0].value = 'My Test Text';

        expect(component.createFilterNameObject()).toEqual({
            visName: 'Filter Builder',
            text: 'Test Text Field contains My Test Text'
        });

        component.addBlankFilterClause();
        component.clauses[1].active = true;
        component.clauses[1].field = DatasetServiceMock.TEXT_FIELD;
        component.clauses[1].value = 'My Test Text';

        expect(component.createFilterNameObject()).toEqual({
            visName: 'Filter Builder',
            text: '2 Filters'
        });
    });

    it('createNeonFilter with single matching filter clause does return expected neon filter object', () => {
        // TODO
    });

    it('createNeonFilter with multiple matching filter clauses does return expected neon filter object', () => {
        // TODO
    });

    it('createNeonFilter with multiple filter clauses (some matching, some not) does return expected neon filter object', () => {
        // TODO
    });

    it('createNeonFilter does validate clauses', () => {
        // TODO
    });

    it('createNeonFilter does work as expected with numbers', () => {
        // TODO
    });

    it('createNeonFilter does work as expected with requireAll=true', () => {
        // TODO
    });

    it('finalizeVisualizationQuery does return null always', () => {
        expect(component.finalizeVisualizationQuery(component.options, new neon.query.Query(), [])).toEqual(null);
    });

    it('getCloseableFilters does return empty array always', () => {
        expect(component.getCloseableFilters()).toEqual([]);
    });

    it('getDatabaseTableFieldKey does return expected string', () => {
        expect(component.getDatabaseTableFieldKey('a', 'b', 'c')).toEqual('a-b-c');
    });

    it('getFiltersToIgnore does return null always', () => {
        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText(null)).toEqual('0 Filters');

        component.clauses[0].active = true;
        component.clauses[0].field = DatasetServiceMock.TEXT_FIELD;
        component.clauses[0].value = 'My Test Text';

        expect(component.getFilterText(null)).toEqual('Test Text Field contains My Test Text');

        component.addBlankFilterClause();
        component.clauses[1].active = true;
        component.clauses[1].field = DatasetServiceMock.TEXT_FIELD;
        component.clauses[1].value = 'My Test Text';

        expect(component.getFilterText(null)).toEqual('2 Filters');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('handleChangeDatabaseOfClause does deactivate clause, update database/tables/fields, and call updateFiltersOfKey', () => {
        // TODO
    });

    it('handleChangeDataOfClause does deactivate clause and call updateFiltersOfKey', () => {
        // TODO
    });

    it('handleChangeFieldOfClause does deactivate clause, update field, and call updateFiltersOfKey', () => {
        // TODO
    });

    it('handleChangeTableOfClause does deactivate clause, update table/fields, and call updateFiltersOfKey', () => {
        // TODO
    });

    it('handleFiltersChangedEvent does nothing', () => {
        // TODO
    });

    it('validateVisualizationQuery does return false always', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);
    });

    it('transformVisualizationQueryResults does nothing', () => {
        // TODO
    });

    it('initializeProperties does initialize clauses from clauseConfig', () => {
        component.clauses = [];
        component.options.clauseConfig = [{
            database: 'testDatabase2',
            table: 'testTable2',
            field: 'testTextField',
            operator: '=',
            value: 'My Test Text',
            id: 'testFilterId'
        }];

        component.initializeProperties();

        expect(component.clauses.length).toEqual(1);
        expect(component.clauses[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.clauses[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.clauses[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(component.clauses[0].operator.value).toEqual('=');
        expect(component.clauses[0].value).toEqual('My Test Text');
        expect(component.clauses[0].active).toEqual(true);
        expect(component.databaseTableFieldKeysToFilterIds.get('testDatabase2-testTable2-testTextField')).toEqual('testFilterId');
    });

    it('refreshVisualization does nothing', () => {
        // TODO
    });

    it('removeClause does remove the given filter clause from clauses and neon', () => {
        // TODO
    });

    it('removeClause does replace the neon filter if needed', () => {
        // TODO
    });

    it('removeFilter does nothing', () => {
        // TODO
    });

    it('removeFilterById does call removeFilters', () => {
        // TODO
    });

    it('resetFilterBuilder does remove all clauses and neon filters', () => {
        // TODO
    });

    it('setupFilters does nothing', () => {
        // TODO
    });

    it('toggleClause does validate and activate given inactive clause', () => {
        // TODO
    });

    it('toggleClause does deactivate given active clause', () => {
        // TODO
    });

    it('updateFilters does call updateFiltersOfKey on every key', () => {
        // TODO
    });

    it('updateFiltersOfKey does call addOrReplaceFilter if clauses of given key exist', () => {
        // TODO
    });

    it('updateFiltersOfKey does call removeFilterById if clauses of given key do not exist', () => {
        // TODO
    });

    it('validateClause does return expected boolean', () => {
        // TODO
    });
});

describe('Component: Filter Builder with config', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: FilterBuilderComponent;
    let fixture: ComponentFixture<FilterBuilderComponent>;

    initializeTestBed({
        declarations: [
            FilterBuilderComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            {
                provide: 'clauseConfig',
                useValue: [{
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testTextField',
                    operator: '=',
                    value: 'testTextValue',
                    id: 'testFilterId'
                }]
            },
            { provide: 'requireAll', useValue: true },
            { provide: 'config', useValue: testConfig }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set from config to expected values', () => {
        expect(component.options.clauseConfig).toEqual([{
            database: 'testDatabase2',
            table: 'testTable2',
            field: 'testTextField',
            operator: '=',
            value: 'testTextValue',
            id: 'testFilterId'
        }]);
        expect(component.options.requireAll).toEqual(true);
    });

    it('clauses and databaseTableFieldKeysToFilterIds are set from config to expected values', () => {
        expect(component.clauses.length).toEqual(1);
        expect(component.clauses[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.clauses[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.clauses[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.clauses[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.clauses[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.clauses[0].field).toEqual(DatasetServiceMock.TEXT_FIELD);
        expect(component.clauses[0].operator.value).toEqual('=');
        expect(component.clauses[0].value).toEqual('testTextValue');
        expect(component.clauses[0].active).toEqual(true);
        expect(component.clauses[0].id).toEqual(1);
        expect(component.clauses[0].changeDatabase).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.clauses[0].changeTable).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.clauses[0].changeField).toEqual(DatasetServiceMock.TEXT_FIELD);

        expect(component.databaseTableFieldKeysToFilterIds.get('testDatabase2-testTable2-testTextField')).toEqual('testFilterId');

        let databaseTableFieldKeys = Array.from(component.databaseTableFieldKeysToFilterIds.keys());
        expect(databaseTableFieldKeys.length > 0).toEqual(true);

        databaseTableFieldKeys.forEach((key) => {
            if (key !== 'testDatabase2-testTable2-testTextField') {
                expect(component.databaseTableFieldKeysToFilterIds.get(key)).toEqual('');
            }
        });
    });
});
