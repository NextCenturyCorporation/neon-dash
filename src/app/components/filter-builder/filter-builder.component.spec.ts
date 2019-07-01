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

import { FilterBuilderComponent } from './filter-builder.component';
import { NeonFieldMetaData } from '../../models/types';

import { FilterService, FilterDesign, SimpleFilterDesign, CompoundFilterDesign } from '../../services/filter.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { getConfigService } from '../../../testUtils/initializeTestBed';
import { CompoundFilterType } from '../../services/abstract.search.service';

describe('Component: Filter Builder', () => {
    let component: FilterBuilderComponent;
    let filterService: FilterService;

    beforeEach(() => {
        filterService = jasmine.createSpyObj('FilterService', ['toggleFilters']);
        component = new FilterBuilderComponent(new DashboardServiceMock(getConfigService()), filterService, new SearchServiceMock());
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
        // Arrange
        component.filterClauses[0].databases = DashboardServiceMock.DATABASES_LIST;
        component.filterClauses[0].tables = DashboardServiceMock.TABLES_LIST;
        component.filterClauses[0].fields = DashboardServiceMock.FIELDS;
        component.filterClauses[0].changeDatabase = DashboardServiceMock.DATABASES.testDatabase2;
        component.filterClauses[0].changeTable = DashboardServiceMock.TABLES.testTable2;
        component.filterClauses[0].changeField = NeonFieldMetaData.get();

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
        expect(component.filterClauses[1].changeField).toEqual(NeonFieldMetaData.get());
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
        component.filterClauses[0].changeField = NeonFieldMetaData.get();

        component.handleChangeFieldOfClause(component.filterClauses[0]);

        expect(component.filterClauses[0].field).toEqual(NeonFieldMetaData.get());
    });

    it('handleChangeTableOfClause does update table/fields', () => {
        component.filterClauses[0].changeTable = DashboardServiceMock.TABLES.testTable2;

        component.handleChangeTableOfClause(component.filterClauses[0]);

        expect(component.filterClauses[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.filterClauses[0].field).toEqual(NeonFieldMetaData.get());
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

    it('saveFilter does not call filterService.toggleFilters if any of the filter clauses are not valid', () => {
        component.filterClauses[0].field.columnName = 'testColumn';
        component.filterClauses[0].operator = component.operators[3];
        component.filterClauses[0].operator.value = '!=';
        component.filterClauses[0].value = '53';

        // Blank filter clause is invalid
        component.addBlankFilterClause();

        component.saveFilter();

        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).not.toHaveBeenCalled();
    });

    it('saveFilter does call filterService.toggleFilters with a simple filter and clear the internal list of filter clauses', () => {
        // Arrange
        let filterDesign: FilterDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[0].database,
            table: component.filterClauses[0].table,
            field: component.filterClauses[0].field,
            operator: 'contains',
            value: ''
        } as SimpleFilterDesign;
        component.filterClauses[0].field.columnName = 'testColumn';

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).toHaveBeenCalledWith('CustomFilter', [filterDesign],
            component.dashboardState.findRelationDataList(), component.searchService);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does call filterService.toggleFilters with a compound OR filter and clear the internal list of filter clauses', () => {
        // Arrange
        component.addBlankFilterClause();
        component.compoundTypeIsOr = true;
        let filterDesigns: SimpleFilterDesign[] = [{
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[0].database,
            table: component.filterClauses[0].table,
            field: component.filterClauses[0].field,
            operator: 'contains',
            value: ''
        } as SimpleFilterDesign,
        {
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[1].database,
            table: component.filterClauses[1].table,
            field: component.filterClauses[1].field,
            operator: 'contains',
            value: ''
        } as SimpleFilterDesign];

        let filterDesign: FilterDesign = {
            type: CompoundFilterType.OR,
            root: CompoundFilterType.AND,
            filters: filterDesigns
        } as CompoundFilterDesign;
        component.filterClauses[0].field.columnName = 'testColumn1';

        component.filterClauses[1].field.columnName = 'testColumn2';

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).toHaveBeenCalledWith('CustomFilter', [filterDesign],
            component.dashboardState.findRelationDataList(), component.searchService);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does call filterService.toggleFilters with a compound AND filter and clear the internal list of filter clauses', () => {
        // Arrange
        component.addBlankFilterClause();
        let filterDesigns: SimpleFilterDesign[] = [{
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[0].database,
            table: component.filterClauses[0].table,
            field: component.filterClauses[0].field,
            operator: 'contains',
            value: ''
        } as SimpleFilterDesign,
        {
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[1].database,
            table: component.filterClauses[1].table,
            field: component.filterClauses[1].field,
            operator: 'contains',
            value: ''
        } as SimpleFilterDesign];

        let filterDesign: FilterDesign = {
            type: CompoundFilterType.AND,
            root: CompoundFilterType.AND,
            filters: filterDesigns
        } as CompoundFilterDesign;
        component.filterClauses[0].field.columnName = 'testColumn1';

        component.filterClauses[1].field.columnName = 'testColumn2';

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).toHaveBeenCalledWith('CustomFilter', [filterDesign],
            component.dashboardState.findRelationDataList(), component.searchService);
        // Clearing filter list invalidates filters
        expect(component.validateFilters(component.filterClauses)).toEqual(false);
    });

    it('saveFilter does parse number strings of non-CONTAINS filters', () => {
        // Arrange
        let filterDesign: FilterDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[0].database,
            table: component.filterClauses[0].table,
            field: component.filterClauses[0].field,
            operator: '!=',
            value: 53
        } as SimpleFilterDesign;
        component.filterClauses[0].field.columnName = 'testColumn';
        component.filterClauses[0].operator = component.operators[3];
        component.filterClauses[0].operator.value = '!=';
        component.filterClauses[0].value = '53';

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).toHaveBeenCalledWith('CustomFilter', [filterDesign],
            component.dashboardState.findRelationDataList(), component.searchService);
    });

    it('saveFilter does not parse number strings of CONTAINS and NOT CONTAINS filters', () => {
        // Arrange
        let filterDesign: FilterDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: component.filterClauses[0].database,
            table: component.filterClauses[0].table,
            field: component.filterClauses[0].field,
            operator: 'contains',
            value: '53'
        } as SimpleFilterDesign;
        component.filterClauses[0].field.columnName = 'testColumn';
        component.filterClauses[0].value = '53';

        // Act
        component.saveFilter();

        // Assert
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(filterService.toggleFilters).toHaveBeenCalledWith('CustomFilter', [filterDesign],
            component.dashboardState.findRelationDataList(), component.searchService);
    });

    it('validateFilters does return expected boolean', () => {
        // Arrange
        // Must have column name to be a valid filter
        component.filterClauses[0].field.columnName = 'testColumn';

        // Act and Assert
        expect(component.validateFilters(component.filterClauses)).toEqual(true);
    });
});
