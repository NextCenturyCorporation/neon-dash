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
import { } from 'jasmine-core';

import { FilterBuilderComponent } from './filter-builder.component';

import {
    CompoundFilterDesign,
    CompoundFilterType,
    FieldConfig,
    ListFilterDesign
} from '@caci-critical-insight-solutions/nucleus-core';

import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';

import { getConfigService } from '../../../testUtils/initializeTestBed';

describe('Component: Filter Builder', () => {
    let component: FilterBuilderComponent;
    let filterService: InjectableFilterService;

    beforeEach(() => {
        filterService = jasmine.createSpyObj('InjectableFilterService', ['createFilters']);
        component = new FilterBuilderComponent(new DashboardServiceMock(getConfigService()), filterService);
    });

    it('class properties are set to expected defaults', () => {
        expect(component.filterClauses.length).toEqual(1);
        expect(component.filterClauses[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.filterClauses[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.filterClauses[0].field).toEqual(FieldConfig.get());
        expect(component.filterClauses[0].operator.value).toEqual('contains');
        expect(component.filterClauses[0].value).toEqual('');
        expect(component.filterClauses[0]._id).toBeDefined();
        expect(component.filterClauses[0].changeDatabase).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[0].changeTable).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[0].changeField).toEqual(FieldConfig.get());

        expect(component.compoundTypeIsOr).toEqual(false);
    });

    it('addBlankFilterClause does add a new blank filter clause to the internal list', () => {
        component.addBlankFilterClause();

        expect(component.filterClauses.length).toEqual(2);
        expect(component.filterClauses[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[1].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.filterClauses[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[1].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.filterClauses[1].field).toEqual(FieldConfig.get());
        expect(component.filterClauses[1].operator.value).toEqual('contains');
        expect(component.filterClauses[1].value).toEqual('');
        expect(component.filterClauses[1]._id).toBeDefined();
        expect(component.filterClauses[1].changeDatabase).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.filterClauses[1].changeTable).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.filterClauses[1].changeField).toEqual(FieldConfig.get());
    });

    it('addBlankFilterClause does use the database, table, and/or field from the existing filter clause', () => {
        // Arrange
        component.filterClauses[0].databases = DashboardServiceMock.DATABASES_LIST;
        component.filterClauses[0].tables = DashboardServiceMock.TABLES_LIST;
        component.filterClauses[0].fields = DashboardServiceMock.FIELDS;
        component.filterClauses[0].changeDatabase = DashboardServiceMock.DATABASES.testDatabase2;
        component.filterClauses[0].changeTable = DashboardServiceMock.TABLES.testTable2;
        component.filterClauses[0].changeField = FieldConfig.get();

        // Act
        component.addBlankFilterClause();

        // Assert
        expect(component.filterClauses.length).toEqual(2);
        expect(component.filterClauses[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[1].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.filterClauses[1].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.filterClauses[1].operator.value).toEqual('contains');
        expect(component.filterClauses[1].value).toEqual('');
        expect(component.filterClauses[1].changeDatabase).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.filterClauses[1].changeTable).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.filterClauses[1].changeField).toEqual(FieldConfig.get());
    });

    it('clearEveryFilterClause does remove all the filter clauses from the internal list', () => {
        component.addBlankFilterClause();
        expect(component.filterClauses.length).toEqual(2);

        component.clearEveryFilterClause();
        expect(component.filterClauses.length).toEqual(1);

        component.addBlankFilterClause();
        component.addBlankFilterClause();
        component.addBlankFilterClause();
        expect(component.filterClauses.length).toEqual(4);

        component.clearEveryFilterClause();
        expect(component.filterClauses.length).toEqual(1);
    });

    it('handleChangeDatabaseOfClause does update database/tables/fields', () => {
        component.addBlankFilterClause();
        component.filterClauses[1].changeDatabase = DashboardServiceMock.DATABASES.testDatabase2;

        expect(component.filterClauses[1].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.filterClauses[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);

        component.handleChangeDatabaseOfClause(component.filterClauses[1]);
        expect(component.filterClauses[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
    });

    it('handleChangeFieldOfClause does update field', () => {
        component.filterClauses[0].changeField = FieldConfig.get();

        component.handleChangeFieldOfClause(component.filterClauses[0]);

        expect(component.filterClauses[0].field).toEqual(FieldConfig.get());
    });

    it('handleChangeTableOfClause does update table/fields', () => {
        component.filterClauses[0].changeTable = DashboardServiceMock.TABLES.testTable2;

        component.handleChangeTableOfClause(component.filterClauses[0]);

        expect(component.filterClauses[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.filterClauses[0].field).toEqual(FieldConfig.get());
    });

    it('removeClause does remove the given filter clause from the internal list of filter clauses', () => {
        component.addBlankFilterClause();
        component.filterClauses[1].value = 'test Filter';
        component.addBlankFilterClause();

        component.removeClause(component.filterClauses[1]);
        expect(component.filterClauses[1].value).toEqual('');
    });

    it('removeClause does add a blank filter clause to the internal list if it is empty', () => {
        component.removeClause(component.filterClauses[0]);
        expect(component.filterClauses.length).toEqual(1);
    });

    it('saveFilter does not call filterService.createFilters if any of the filter clauses are not valid', () => {
        component.saveFilter();

        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).not.toHaveBeenCalled();
    });

    it('saveFilter does call filterService.createFilters with a simple filter and clear the internal list of filter clauses', () => {
        // Arrange
        component.filterClauses[0].field = DashboardServiceMock.FIELD_MAP.FILTER;
        let filterConfig: ListFilterDesign = new ListFilterDesign(CompoundFilterType.AND, component.filterClauses[0].datastore.name + '.' +
            component.filterClauses[0].database.name + '.' + component.filterClauses[0].table.name + '.' +
            component.filterClauses[0].field.columnName, 'contains', ['']);

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).toHaveBeenCalledWith('CustomFilter', [filterConfig], component['_dataset']);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does call filterService.createFilters with a compound OR filter and clear the internal list of filter clauses', () => {
        // Arrange
        component.addBlankFilterClause();
        component.compoundTypeIsOr = true;
        component.filterClauses[0].field = DashboardServiceMock.FIELD_MAP.NAME;
        component.filterClauses[1].field = DashboardServiceMock.FIELD_MAP.TYPE;
        let filterConfig: CompoundFilterDesign = new CompoundFilterDesign(CompoundFilterType.OR, [
            new ListFilterDesign(CompoundFilterType.OR, component.filterClauses[0].datastore.name + '.' +
                component.filterClauses[0].database.name + '.' + component.filterClauses[0].table.name + '.' +
                component.filterClauses[0].field.columnName, 'contains', ['']),
            new ListFilterDesign(CompoundFilterType.OR, component.filterClauses[1].datastore.name + '.' +
                component.filterClauses[1].database.name + '.' + component.filterClauses[1].table.name + '.' +
                component.filterClauses[1].field.columnName, 'contains', [''])
        ]);

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).toHaveBeenCalledWith('CustomFilter', [filterConfig], component['_dataset']);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does call filterService.createFilters with a compound AND filter and clear the internal list of filter clauses', () => {
        // Arrange
        component.addBlankFilterClause();
        component.filterClauses[0].field = DashboardServiceMock.FIELD_MAP.NAME;
        component.filterClauses[1].field = DashboardServiceMock.FIELD_MAP.TYPE;
        let filterConfig: CompoundFilterDesign = new CompoundFilterDesign(CompoundFilterType.AND, [
            new ListFilterDesign(CompoundFilterType.AND, component.filterClauses[0].datastore.name + '.' +
                component.filterClauses[0].database.name + '.' + component.filterClauses[0].table.name + '.' +
                component.filterClauses[0].field.columnName, 'contains', ['']),
            new ListFilterDesign(CompoundFilterType.AND, component.filterClauses[1].datastore.name + '.' +
                component.filterClauses[1].database.name + '.' + component.filterClauses[1].table.name + '.' +
                component.filterClauses[1].field.columnName, 'contains', [''])
        ]);

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).toHaveBeenCalledWith('CustomFilter', [filterConfig], component['_dataset']);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does parse number strings of non-CONTAINS filters', () => {
        // Arrange
        component.filterClauses[0].field = DashboardServiceMock.FIELD_MAP.FILTER;
        component.filterClauses[0].operator = component.operators[3];
        component.filterClauses[0].value = '53';
        let filterConfig: ListFilterDesign = new ListFilterDesign(CompoundFilterType.AND, component.filterClauses[0].datastore.name + '.' +
            component.filterClauses[0].database.name + '.' + component.filterClauses[0].table.name + '.' +
            component.filterClauses[0].field.columnName, '!=', [53]);

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).toHaveBeenCalledWith('CustomFilter', [filterConfig], component['_dataset']);
    });

    it('saveFilter does not parse number strings of CONTAINS and NOT CONTAINS filters', () => {
        // Arrange
        component.filterClauses[0].field = DashboardServiceMock.FIELD_MAP.FILTER;
        component.filterClauses[0].value = '53';
        let filterConfig: ListFilterDesign = new ListFilterDesign(CompoundFilterType.AND, component.filterClauses[0].datastore.name + '.' +
            component.filterClauses[0].database.name + '.' + component.filterClauses[0].table.name + '.' +
            component.filterClauses[0].field.columnName, 'contains', ['53']);

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.createFilters).toHaveBeenCalledWith('CustomFilter', [filterConfig], component['_dataset']);
    });

    it('validateFilters does return expected boolean', () => {
        // Arrange
        // Must have column name to be a valid filter
        component.filterClauses[0].field = FieldConfig.get({ columnName: 'testColumn' });

        // Act and Assert
        expect(component.validateFilters(component.filterClauses)).toEqual(true);
    });
});
