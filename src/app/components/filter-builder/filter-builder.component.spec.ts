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

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

describe('Component: Filter Builder', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: FilterBuilderComponent;
    let fixture: ComponentFixture<FilterBuilderComponent>;

    initializeTestBed('Filter Builder', {
        declarations: [
            FilterBuilderComponent
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
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

    it('class properties are set to expected defaults', () => {
        expect(component.filterClauses.length).toEqual(1);
        expect(component.filterClauses[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.filterClauses[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.filterClauses[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.filterClauses[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.filterClauses[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.filterClauses[0].field).toEqual(new FieldMetaData());
        expect(component.filterClauses[0].operator.value).toEqual('contains');
        expect(component.filterClauses[0].value).toEqual('');
        expect(component.filterClauses[0]._id).toBeDefined();
        expect(component.filterClauses[0].changeDatabase).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.filterClauses[0].changeTable).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.filterClauses[0].changeField).toEqual(new FieldMetaData());

        expect(component.compoundTypeIsOr).toEqual(false);
        expect(component.filterIsOptional).toEqual(false);
    });

    it('does show expected HTML elements', () => {
        // TODO THOR-701
    });

    it('addBlankFilterClause does add a new blank filter clause to the internal list', () => {
        component.addBlankFilterClause();

        expect(component.filterClauses.length).toEqual(2);
        expect(component.filterClauses[1].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.filterClauses[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.filterClauses[1].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.filterClauses[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.filterClauses[1].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.filterClauses[1].field).toEqual(new FieldMetaData());
        expect(component.filterClauses[1].operator.value).toEqual('contains');
        expect(component.filterClauses[1].value).toEqual('');
        expect(component.filterClauses[1]._id).toBeDefined();
        expect(component.filterClauses[1].changeDatabase).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.filterClauses[1].changeTable).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.filterClauses[1].changeField).toEqual(new FieldMetaData());
    });

    it('clearEveryFilterClause does remove all the filter clauses from the internal list', () => {
        // TODO THOR-701
    });

    it('handleChangeDatabaseOfClause does update database/tables/fields', () => {
        // TODO THOR-701
    });

    it('handleChangeDataOfClause does work as expected', () => {
        // TODO THOR-701
    });

    it('handleChangeFieldOfClause does update field', () => {
        // TODO THOR-701
    });

    it('handleChangeTableOfClause does update table/fields', () => {
        // TODO THOR-701
    });

    it('removeClause does remove the given filter clause from the internal list of filter clauses', () => {
        // TODO THOR-701
    });

    it('saveFilter does not add a new filter to the filter service if any of the filter clauses are not valid', () => {
        // TODO THOR-701
    });

    it('saveFilter does add a new simple filter to the filter service and clear the internal list of filter clauses', () => {
        // TODO THOR-701
    });

    it('saveFilter does add a new compound OR filter to the filter service', () => {
        // TODO THOR-701
    });

    it('saveFilter does add a new compound AND filter to the filter service', () => {
        // TODO THOR-701
    });

    it('saveFilter does parse number strings of non-CONTAINS filters', () => {
        // TODO THOR-701
    });

    it('saveFilter does not parse number strings of CONTAINS and NOT CONTAINS filters', () => {
        // TODO THOR-701
    });

    it('validateFilter does return expected boolean', () => {
        // TODO THOR-701
    });
});
