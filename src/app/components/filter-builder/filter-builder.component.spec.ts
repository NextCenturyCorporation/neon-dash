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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { NeonFieldMetaData } from '../../types';
import { FilterBuilderComponent } from './filter-builder.component';
import { NeonConfig } from '../../types';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { FilterBuilderModule } from './filter-builder.module';
import { ConfigService } from '../../services/config.service';

describe('Component: Filter Builder', () => {
    let testConfig: NeonConfig = NeonConfig.get();
    let component: FilterBuilderComponent;
    let fixture: ComponentFixture<FilterBuilderComponent>;

    initializeTestBed('Filter Builder', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) }

        ],
        imports: [
            FilterBuilderModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class properties are set to expected defaults', () => {
        expect(component.filterClauses.length).toEqual(1);
        expect(component.filterClauses[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.filterClauses[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.filterClauses[0].field).toEqual(NeonFieldMetaData.get());
        expect(component.filterClauses[0].operator.value).toEqual('contains');
        expect(component.filterClauses[0].value).toEqual('');
        expect(component.filterClauses[0]._id).toBeDefined();
        expect(component.filterClauses[0].changeDatabase).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[0].changeTable).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[0].changeField).toEqual(NeonFieldMetaData.get());

        expect(component.compoundTypeIsOr).toEqual(false);
        expect(component.parentFilterIsOr).toEqual(false);
    });

    it('does show expected HTML elements', () => {
        // TODO THOR-701
    });

    it('addBlankFilterClause does add a new blank filter clause to the internal list', () => {
        component.addBlankFilterClause();

        expect(component.filterClauses.length).toEqual(2);
        expect(component.filterClauses[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[1].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.filterClauses[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[1].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.filterClauses[1].field).toEqual(NeonFieldMetaData.get());
        expect(component.filterClauses[1].operator.value).toEqual('contains');
        expect(component.filterClauses[1].value).toEqual('');
        expect(component.filterClauses[1]._id).toBeDefined();
        expect(component.filterClauses[1].changeDatabase).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[1].changeTable).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[1].changeField).toEqual(NeonFieldMetaData.get());
    });

    it('addBlankFilterClause does use the database, table, and/or field from the existing filter clause', () => {
        // TODO THOR-701
    });

    it('addBlankFilterClause does add a new set of HTML elements', () => {
        // TODO THOR-701
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
