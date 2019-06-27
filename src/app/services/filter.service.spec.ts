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
import { inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AbstractSearchService, CompoundFilterType } from './abstract.search.service';
import { DashboardService } from './dashboard.service';
import {
    CompoundFilterDesign,
    FilterBehavior,
    FilterCollection,
    FilterDataSource,
    FilterService,
    FilterUtil,
    SimpleFilterDesign
} from './filter.service';

import { NeonFieldMetaData, NeonDatabaseMetaData, NeonTableMetaData } from '../models/types';
import { neonEvents } from '../models/neon-namespaces';

import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../testUtils/initializeTestBed';
import { ConfigUtil } from '../util/config.util';

describe('FilterUtil', () => {
    beforeAll(() => {
        /* eslint-disable no-console */
        console.log('STARTING FILTER UTIL TESTS...');
        /* eslint-enable no-console */
    });

    it('areFilterDataSourcesEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore2',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database2',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table2',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field2',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(true);
    });

    it('areFilterDataSourcesEquivalent with ignoreOperator=true should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource, true)).toEqual(true);
    });

    it('areFilterDataSourceListsEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: 'contains'
        } as FilterDataSource, {
            datastoreName: 'datastore1',
            databaseName: 'database1',
            tableName: 'table1',
            fieldName: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);
    });

    it('createFilterDataSourceListFromDesign should return expected array', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '<'
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId'
            } as SimpleFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.Y,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromDesign should ignore clauses in compound filters with equivalent non-value properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.Y,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 30
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.Y,
                    operator: '=',
                    value: 40
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromDesign with ignoreOperator=true should ignore operator properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, true)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: undefined
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromDesign({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.Y,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '!=',
                    value: 30
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.Y,
                    operator: '!=',
                    value: 40
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign, true)).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testXField',
            operator: undefined
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: 'testDatabase1',
            tableName: 'testTable1',
            fieldName: 'testYField',
            operator: undefined
        } as FilterDataSource]);
    });

    it('isCompoundFilterDesign should return expected boolean', () => {
        expect(FilterUtil.isCompoundFilterDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual(false);

        expect(FilterUtil.isCompoundFilterDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);
    });

    it('isSimpleFilterDesign should return expected boolean', () => {
        expect(FilterUtil.isSimpleFilterDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign)).toEqual(true);

        expect(FilterUtil.isSimpleFilterDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });

    describe('simpleFiltering', () => {
        const queryString = `[
            [".databaseZ.tableA.field1","=","value1","or"],
            ["and", "and",
                [".databaseY.tableB.field2", "!=", "", "or"],
                [".databaseY.tableB.field2", "!=", null, "or"]
            ]
        ]`;

        const queryStringCompact = ConfigUtil.translate(
            JSON.stringify(JSON.parse(queryString)),
            ConfigUtil.encodeFiltersMap
        );

        const filtersSimple = [
            {
                root: 'or',
                datastore: '',
                database: 'databaseZ',
                table: 'tableA',
                field: 'field1',
                operator: '=',
                value: 'value1'
            },
            {
                root: 'and',
                name: 'and',
                type: 'and',
                filters: [
                    {
                        root: 'or',
                        datastore: '',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: ''
                    },
                    {
                        root: 'or',
                        datastore: '',
                        database: 'databaseY',
                        table: 'tableB',
                        field: 'field2',
                        operator: '!=',
                        value: null
                    }
                ]
            }
        ];

        const filterDesigns = [
            {
                root: CompoundFilterType.OR,
                name: '.databaseZ.tableA.field1',
                datastore: '',
                database: NeonDatabaseMetaData.get({ name: 'databaseZ' }),
                table: NeonTableMetaData.get({ name: 'tableA' }),
                field: NeonFieldMetaData.get({ columnName: 'field1' }),
                operator: '=',
                value: 'value1'
            } as SimpleFilterDesign,
            {
                root: 'and',
                name: 'and',
                type: 'and',
                filters: [
                    {
                        root: CompoundFilterType.OR,
                        name: '.databaseY.tableB.field2',
                        datastore: '',
                        database: NeonDatabaseMetaData.get({ name: 'databaseY' }),
                        table: NeonTableMetaData.get({ name: 'tableB' }),
                        field: NeonFieldMetaData.get({ columnName: 'field2' }),
                        operator: '!=',
                        value: ''
                    } as SimpleFilterDesign,
                    {
                        root: CompoundFilterType.OR,
                        name: '.databaseY.tableB.Field2',
                        datastore: '',
                        database: NeonDatabaseMetaData.get({ name: 'databaseY' }),
                        table: NeonTableMetaData.get({ name: 'tableB' }),
                        field: NeonFieldMetaData.get({ columnName: 'field2' }),
                        operator: '!=',
                        value: null
                    } as SimpleFilterDesign
                ]
            } as CompoundFilterDesign

        ];

        const expected = [
            ['.databaseZ.tableA.field1', '=', 'value1', 'or'],
            ['and',
                'and',
                ['.databaseY.tableB.field2', '!=', '', 'or'],
                ['.databaseY.tableB.field2', '!=', null, 'or']]
        ];

        const empty = ConfigUtil.translate('[]', ConfigUtil.encodeFiltersMap);

        it('toPlainFilterJSON should return expected output', () => {
            expect(FilterUtil.toPlainFilterJSON(filterDesigns)).toEqual(expected);
            expect(FilterUtil.toPlainFilterJSON([])).toEqual([]);
        });

        it('fromPlainFilterJSON should return expected output', () => {
            expect(expected.map((exp) => FilterUtil.fromPlainFilterJSON(exp))).toEqual(filtersSimple);
            expect(FilterUtil.fromPlainFilterJSON(['1.2.3.4', '=', 'b', 'or'])).toEqual({
                datastore: '1',
                database: '2',
                table: '3',
                field: '4',
                operator: '=',
                value: 'b',
                root: 'or'
            });

            expect(FilterUtil.fromPlainFilterJSON(['and', 'or'])).toEqual({
                root: 'or',
                type: 'and',
                name: 'and',
                filters: []
            });
        });

        it('toSimpleFilterQueryString should return expected output', () => {
            expect(FilterUtil.toSimpleFilterQueryString(filterDesigns)).toEqual(queryStringCompact);
            expect(FilterUtil.toSimpleFilterQueryString([])).toEqual(empty);
        });

        it('fromSimpleFilterQueryString should return expected output', () => {
            expect(FilterUtil.fromSimpleFilterQueryString(queryStringCompact)).toEqual(filtersSimple);
            expect(FilterUtil.fromSimpleFilterQueryString(empty)).toEqual([]);
        });
    });
});

describe('FilterCollection', () => {
    let filterCollection: FilterCollection;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;

    initializeTestBed('Single List Filter Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock }

        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        source1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];
        filter1A = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.AND,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign, searchService);
        filter1B = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.OR,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign, searchService);
        filter2A = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        filterCollection = new FilterCollection();
        (filterCollection as any).data.set(source1, [filter1A, filter1B]);
        (filterCollection as any).data.set(source2, [filter2A]);
    }));

    it('data of new collection should be empty', () => {
        let testCollection = new FilterCollection();
        expect((testCollection as any).data.size).toEqual(0);
    });

    it('findFilterDataSources should return data source from collection', () => {
        expect(filterCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign)).toEqual(source1);

        expect(filterCollection.findFilterDataSources({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(source2);
    });

    it('findFilterDataSources should return new data source and add to collection', () => {
        let actual = filterCollection.findFilterDataSources({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '!=',
            value: 'testId1'
        } as SimpleFilterDesign);

        expect(actual).toEqual([{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource]);

        expect((filterCollection as any).data.get(actual)).toEqual([]);
    });

    it('getDataSources should return expected array', () => {
        expect(filterCollection.getDataSources()).toEqual([source1, source2]);

        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        (filterCollection as any).data.set(testDataSource, []);

        expect(filterCollection.getDataSources()).toEqual([source1, source2, testDataSource]);
    });

    it('getFilters should create and return empty array if data source is not in collection', () => {
        // Different datastore
        let testDataSource1 = [{
            datastoreName: 'testDatastore2',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different database
        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase2.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different table
        let testDataSource3 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable2.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different field
        let testDataSource4 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        // Different operator
        let testDataSource5 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        // Different operators (compound)
        let testDataSource6 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '!='
        } as FilterDataSource];

        expect(filterCollection.getFilters(testDataSource1)).toEqual([]);
        expect(filterCollection.getFilters(testDataSource2)).toEqual([]);
        expect(filterCollection.getFilters(testDataSource3)).toEqual([]);
        expect(filterCollection.getFilters(testDataSource4)).toEqual([]);
        expect(filterCollection.getFilters(testDataSource5)).toEqual([]);
        expect(filterCollection.getFilters(testDataSource6)).toEqual([]);

        expect((filterCollection as any).data.get(testDataSource1)).toEqual([]);
        expect((filterCollection as any).data.get(testDataSource2)).toEqual([]);
        expect((filterCollection as any).data.get(testDataSource3)).toEqual([]);
        expect((filterCollection as any).data.get(testDataSource4)).toEqual([]);
        expect((filterCollection as any).data.get(testDataSource5)).toEqual([]);
        expect((filterCollection as any).data.get(testDataSource6)).toEqual([]);
    });

    it('getFilters should return array from identical data source object in collection', () => {
        expect(filterCollection.getFilters(source1)).toEqual([filter1A, filter1B]);
        expect(filterCollection.getFilters(source2)).toEqual([filter2A]);
    });

    it('getFilters should return array from similar data source object in collection', () => {
        let testDataSource1 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(filterCollection.getFilters(testDataSource1)).toEqual([filter1A, filter1B]);
        expect(filterCollection.getFilters(testDataSource2)).toEqual([filter2A]);

        expect((filterCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((filterCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('setFilters should save filters with input data source if it is not in collection', () => {
        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '!=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(filterCollection.setFilters(testDataSource, [testFilter])).toEqual(testDataSource);
        expect((filterCollection as any).data.get(testDataSource)).toEqual([testFilter]);

        expect(filterCollection.setFilters(testDataSource, [])).toEqual(testDataSource);
        expect((filterCollection as any).data.get(testDataSource)).toEqual([]);
    });

    it('setFilters should save filters with identical data source object in collection', () => {
        expect(filterCollection.setFilters(source1, [filter1A])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A]);

        expect(filterCollection.setFilters(source1, [])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([]);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(filterCollection.setFilters(source1, [testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([testFilter]);

        expect(filterCollection.setFilters(source1, [filter1A, testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
    });

    it('setFilters should save filters with similar data source object in collection', () => {
        let testDataSource = [{
            datastoreName: 'testDatastore1',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        expect(filterCollection.setFilters(testDataSource, [filter1A])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        expect(filterCollection.setFilters(testDataSource, [])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        let testFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId'
        } as SimpleFilterDesign, searchService);

        expect(filterCollection.setFilters(testDataSource, [testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([testFilter]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        expect(filterCollection.setFilters(testDataSource, [filter1A, testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);
    });
});

describe('SimpleFilter', () => {
    let simpleFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Simple Filter', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        simpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        simpleFilter.datastore = 'testDatastore1';
    }));

    it('does have expected simple filter properties', () => {
        expect(simpleFilter.datastore).toEqual('testDatastore1');
        expect(simpleFilter.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(simpleFilter.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(simpleFilter.field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(simpleFilter.operator).toEqual('=');
        expect(simpleFilter.value).toEqual('testName1');

        expect(simpleFilter.filterClause).toBeDefined();
        expect(simpleFilter.id).toBeDefined();
        expect(simpleFilter.name).toEqual('Test Database 1 / Test Table 1 / Test Name Field = testName1');
        expect(simpleFilter.root).toEqual(CompoundFilterType.AND);
        expect(simpleFilter.relations).toEqual([]);
    });

    it('createRelationFilter on simple filter should return null if substitue has bad data', () => {
        let actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], [{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: NeonFieldMetaData.get()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter on simple filter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.TEXT
        }];

        actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], testSubstituteList, searchService);
        expect(actual.datastore).toEqual('testDatastore2');
        expect(actual.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(actual.operator).toEqual('=');
        expect(actual.value).toEqual('testName1');
        expect(actual.root).toEqual(CompoundFilterType.AND);
    });

    it('createRelationFilter on simple filter should work with custom root filter', () => {
        simpleFilter.root = CompoundFilterType.OR;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.TEXT
        }];

        let actual = simpleFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], testSubstituteList, searchService);
        expect(actual.datastore).toEqual('testDatastore2');
        expect(actual.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(actual.operator).toEqual('=');
        expect(actual.value).toEqual('testName1');
        expect(actual.root).toEqual(CompoundFilterType.OR);
    });

    it('doesAffectSearch on simple filter should return expected boolean', () => {
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(simpleFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign on simple filter should return expected boolean', () => {
        // Correct, with value
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        })).toEqual(true);

        // Correct
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '='
        })).toEqual(true);

        // Correct, with custom root filter type
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            root: CompoundFilterType.AND
        })).toEqual(true);

        // Different datastore
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '='
        })).toEqual(false);

        // Different database
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '='
        })).toEqual(false);

        // Different table
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '='
        })).toEqual(false);

        // Different field
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '='
        })).toEqual(false);

        // Different operator
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!='
        })).toEqual(false);

        // Different custom root filter type
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            root: CompoundFilterType.OR
        })).toEqual(false);

        // Different value
        expect(simpleFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName2'
        })).toEqual(false);

        // Different structure
        expect(simpleFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            }]
        })).toEqual(false);
    });

    it('isEquivalentToFilter on simple filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName2'
        } as SimpleFilterDesign, searchService);

        // Different custom root filter type
        let testFilter7 = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.OR,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);

        // Different structure
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).datastore = 'testDatastore1';

        expect(simpleFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign on simple filter should return expected object', () => {
        expect(simpleFilter.toDesign()).toEqual({
            id: simpleFilter.id,
            name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
            root: CompoundFilterType.AND,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);
    });

    it('toString on simple filter should return expected string', () => {
        expect(simpleFilter.toString()).toEqual('Test Database 1 / Test Table 1 / Test Name Field = testName1');
    });

    it('toString on simple filter with name property should return name property', () => {
        simpleFilter.name = 'testName';
        expect(simpleFilter.toString()).toEqual('testName');
    });
});

describe('SimpleFilter (Falsey Values)', () => {
    let searchService: AbstractSearchService;

    initializeTestBed('Simple Filter (Falsey Values)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
    }));

    it('filter on zero', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filter as any).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(0);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on empty string', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: ''
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filter as any).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual('');

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on false', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: false
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filter as any).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(true);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('filter on null', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: null
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (filter as any).datastore = 'testDatastore1';

        expect((filter as any).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((filter as any).field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(null);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: ''
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: false
        } as SimpleFilterDesign)).toEqual(false);

        expect(filter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: null
        } as SimpleFilterDesign)).toEqual(true);
    });
});

describe('SimpleFilter and CompoundFilter (Date Fields)', () => {
    let simpleFilter: any;
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Simple and Compound Filters (Date Fields)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;

        simpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.DATE,
            operator: '=',
            value: new Date(0)
        } as SimpleFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        simpleFilter.datastore = 'testDatastore1';

        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.DATE,
                operator: '>',
                value: new Date(0)
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.DATE,
                operator: '<',
                // One year + one month + one day
                value: new Date(34300800000)
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            filter.datastore = 'testDatastore1';
        });
    }));

    it('toString on simple date filter should return expected string', () => {
        expect(simpleFilter.toString()).toEqual('Test Database 1 / Test Table 1 / Test Date Field = 1-1-1970');
    });

    it('toString on compound date filter should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test Date Field > 1-1-1970) and ' +
            '(Test Database 1 / Test Table 1 / Test Date Field < 2-2-1971)');
    });
});

describe('CompoundFilter (One Field)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (One Field)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            filter.datastore = 'testDatastore1';
        });
    }));

    it('does have expected compound filter properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('(Test Database 1 / Test Table 1 / Test X Field > -100) and ' +
            '(Test Database 1 / Test Table 1 / Test X Field < 100)');
        expect(compoundFilter.root).toEqual(CompoundFilterType.AND);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(compoundFilter.filters[0].operator).toEqual('>');
        expect(compoundFilter.filters[0].value).toEqual(-100);
        expect(compoundFilter.filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(compoundFilter.filters[1].operator).toEqual('<');
        expect(compoundFilter.filters[1].value).toEqual(100);
    });

    it('createRelationFilter on compound filter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], [{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: NeonFieldMetaData.get()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter on compound filter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.Y
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.root).toEqual(CompoundFilterType.AND);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].value).toEqual(-100);
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].value).toEqual(100);
    });

    it('createRelationFilter on compound filter should work with custom root filter', () => {
        compoundFilter.root = CompoundFilterType.OR;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.Y
        }];

        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.root).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].value).toEqual(-100);
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].value).toEqual(100);
    });

    it('doesAffectSearch on compound filter should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign on compound filter should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with custom root filter type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase2,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable2,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different custom root filter type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            root: CompoundFilterType.OR,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '>'
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '<'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X,
            operator: '>'
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isEquivalentToFilter on compound filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase2,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable2,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different custom root filter type
        let testFilter7 = FilterUtil.createFilterFromDesign({
            type: 'and',
            root: CompoundFilterType.OR,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different type
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => {
            filter.datastore = 'testDatastore1';
        });

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign on compound filter should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'and',
            id: compoundFilter.id,
            name: '(Test Database 1 / Test Table 1 / Test X Field > -100) and (Test Database 1 / Test Table 1 / Test X Field < 100)',
            root: CompoundFilterType.AND,
            filters: [{
                id: compoundFilter.filters[0].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field > -100',
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field < 100',
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign);
    });

    it('toString on compound filter should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test X Field > -100) and ' +
            '(Test Database 1 / Test Table 1 / Test X Field < 100)');
    });

    it('toString on compound filter with name property should return name property', () => {
        compoundFilter.name = 'testName';
        expect(compoundFilter.toString()).toEqual('testName');
    });
});

describe('CompoundFilter (Multi-Field)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (Multi-Field)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            filter.datastore = 'testDatastore1';
        });
    }));

    it('does have expected compound multi-field filter properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 10)');
        expect(compoundFilter.root).toEqual(CompoundFilterType.AND);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.OR);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(compoundFilter.filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(compoundFilter.filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].value).toEqual(10);
    });

    it('createRelationFilter on compound multi-field filter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], [{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: NeonFieldMetaData.get()
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter should return null if equivalent fields and substitue fields are not the same length', () => {
        let actual;

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }, {
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], [{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE
        }], searchService);
        expect(actual).toEqual(null);

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], [{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TYPE
        }, {
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.Y
        }], searchService);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter with single substitute field should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.TYPE
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.root).toEqual(CompoundFilterType.AND);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore1');
        expect(actual.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('createRelationFilter with multiple substitute fields should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.TYPE
        }, {
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.Y
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }, {
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.root).toEqual(CompoundFilterType.AND);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('createRelationFilter on compound multi-field filter should work with custom root filter', () => {
        compoundFilter.root = CompoundFilterType.OR;

        let testSubstituteList = [{
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.TYPE
        }, {
            datastore: 'testDatastore2',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.Y
        }];

        let actual = compoundFilter.createRelationFilter([{
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME
        }, {
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.X
        }], testSubstituteList, searchService);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.root).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('testDatastore2');
        expect(actual.filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('testDatastore2');
        expect(actual.filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('doesAffectSearch on compound multi-field filter should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch('testDatastore1', 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithDesign on compound multi-field filter should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with custom root filter type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore2',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase2,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable2,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different custom root filter type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            root: CompoundFilterType.OR,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            type: 'or',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '='
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '='
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '='
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isEquivalentToFilter on compound multi-field filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase2,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable2,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '!=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different custom root filter type
        let testFilter7 = FilterUtil.createFilterFromDesign({
            type: 'and',
            root: CompoundFilterType.OR,
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Different type
        let testFilter8 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => {
            filter.datastore = 'testDatastore1';
        });

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter9)).toEqual(true);
    });

    it('toDesign on compound multi-field filter should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'or',
            id: compoundFilter.id,
            name: '(Test Database 1 / Test Table 1 / Test Name Field = testName1) or (Test Database 1 / Test Table 1 / Test X Field = 10)',
            root: CompoundFilterType.AND,
            filters: [{
                id: compoundFilter.filters[0].id,
                name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
                name: 'Test Database 1 / Test Table 1 / Test X Field = 10',
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign);
    });

    it('toString on compound multi-field filter should return expected string', () => {
        expect(compoundFilter.toString()).toEqual('(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 10)');
    });

    it('toString on compound multi-field filter with name property should return name property', () => {
        compoundFilter.name = 'testName';
        expect(compoundFilter.toString()).toEqual('testName');
    });
});

describe('CompoundFilter (Nested Compound Filters)', () => {
    let compoundFilter: any;
    let searchService: AbstractSearchService;

    initializeTestBed('Compound Filter (Nested Compound Filters)', {
        providers: [
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([AbstractSearchService], (_searchService) => {
        searchService = _searchService;
        compoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                filters: [{
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterDesign, {
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '=',
                    value: 'testName2'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign, searchService);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.filters.forEach((nestedFilter) => {
            nestedFilter.datastore = 'testDatastore1';
        }));
    }));

    it('does have expected compound nested filter properties', () => {
        expect(compoundFilter.filterClause).toBeDefined();
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.name).toEqual('((Test Database 1 / Test Table 1 / Test X Field = 10) or ' +
            '(Test Database 1 / Test Table 1 / Test X Field = 20)) and ' +
            '((Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
            '(Test Database 1 / Test Table 1 / Test Name Field = testName2))');
        expect(compoundFilter.root).toEqual(CompoundFilterType.AND);
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[0].filters.length).toEqual(2);
        expect(compoundFilter.filters[0].filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[0].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(compoundFilter.filters[0].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[0].value).toEqual(10);
        expect(compoundFilter.filters[0].filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[0].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[0].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.X);
        expect(compoundFilter.filters[0].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[1].value).toEqual(20);
        expect(compoundFilter.filters[1].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[1].filters.length).toEqual(2);
        expect(compoundFilter.filters[1].filters[0].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[1].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(compoundFilter.filters[1].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].filters[1].datastore).toEqual('testDatastore1');
        expect(compoundFilter.filters[1].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(compoundFilter.filters[1].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(compoundFilter.filters[1].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[1].value).toEqual('testName2');
    });

    it('toDesign on compound nested filters should return expected object', () => {
        expect(compoundFilter.toDesign()).toEqual({
            type: 'and',
            id: compoundFilter.id,
            name: '((Test Database 1 / Test Table 1 / Test X Field = 10) or (Test Database 1 / Test Table 1 / Test X Field = 20)) and ' +
                '((Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
                '(Test Database 1 / Test Table 1 / Test Name Field = testName2))',
            root: CompoundFilterType.AND,
            filters: [{
                type: 'or',
                id: compoundFilter.filters[0].id,
                name: '(Test Database 1 / Test Table 1 / Test X Field = 10) or (Test Database 1 / Test Table 1 / Test X Field = 20)',
                root: CompoundFilterType.AND,
                filters: [{
                    id: compoundFilter.filters[0].filters[0].id,
                    name: 'Test Database 1 / Test Table 1 / Test X Field = 10',
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[0].filters[1].id,
                    name: 'Test Database 1 / Test Table 1 / Test X Field = 20',
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 20
                } as SimpleFilterDesign]
            } as CompoundFilterDesign, {
                type: 'or',
                id: compoundFilter.filters[1].id,
                name: '(Test Database 1 / Test Table 1 / Test Name Field = testName1) or ' +
                    '(Test Database 1 / Test Table 1 / Test Name Field = testName2)',
                root: CompoundFilterType.AND,
                filters: [{
                    id: compoundFilter.filters[1].filters[0].id,
                    name: 'Test Database 1 / Test Table 1 / Test Name Field = testName1',
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[1].filters[1].id,
                    name: 'Test Database 1 / Test Table 1 / Test Name Field = testName2',
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '=',
                    value: 'testName2'
                } as SimpleFilterDesign]
            } as CompoundFilterDesign]
        } as CompoundFilterDesign);
    });
});

describe('FilterService with no filters', () => {
    let filterService: FilterService;

    initializeTestBed('Filter Service with no filters', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock }

        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(inject([FilterService], (_filterService) => {
        filterService = _filterService;
    }));

    it('should have expected properties with no filters', () => {
        expect(filterService['filterCollection']).toBeDefined();
        expect((filterService['filterCollection'])['data'].size).toEqual(0);
        expect(filterService['messenger']).toBeDefined();
    });

    it('getFilters with no filters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([]);
    });
});

describe('FilterService with filters', () => {
    let datasetService: DashboardService;
    let filterService: FilterService;
    let searchService: AbstractSearchService;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let design1A: SimpleFilterDesign;
    let design1B: SimpleFilterDesign;
    let design1C: SimpleFilterDesign;
    let design1D: SimpleFilterDesign;
    let design2A: CompoundFilterDesign;
    let filter1A: any;
    let filter1B: any;
    let filter1C: any;
    let filter1D: any;
    let filter2A: any;
    let relationSource1: FilterDataSource[];
    let relationSource2: FilterDataSource[];
    let relationDesign1: SimpleFilterDesign;
    let relationDesign2: SimpleFilterDesign;
    let relationFilter1: any;
    let relationFilter2: any;

    initializeTestBed('Filter Service with filters', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            { provide: FilterService, useClass: FilterService },
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ]
    });

    beforeEach(inject([DashboardService, FilterService, AbstractSearchService], (_datasetService, _filterService, _searchService) => {
        datasetService = _datasetService;
        filterService = _filterService;
        searchService = _searchService;

        source1 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        design1A = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterDesign;
        design1B = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign;
        design1C = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId3'
        } as SimpleFilterDesign;
        design1D = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId4'
        } as SimpleFilterDesign;
        design2A = {
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '>',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '<',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        filter1A = FilterUtil.createFilterFromDesign(design1A, searchService);
        filter1B = FilterUtil.createFilterFromDesign(design1B, searchService);
        filter1C = FilterUtil.createFilterFromDesign(design1C, searchService);
        filter1D = FilterUtil.createFilterFromDesign(design1D, searchService);
        filter2A = FilterUtil.createFilterFromDesign(design2A, searchService);

        design1A.id = filter1A.id;
        design1A.name = filter1A.name;
        design1B.id = filter1B.id;
        design1B.name = filter1B.name;
        design1C.id = filter1C.id;
        design1C.name = filter1C.name;
        design1D.id = filter1D.id;
        design1D.name = filter1D.name;
        design2A.id = filter2A.id;
        design2A.name = filter2A.name;
        design2A.filters[0].id = filter2A.filters[0].id;
        design2A.filters[0].name = filter2A.filters[0].name;
        design2A.filters[1].id = filter2A.filters[1].id;
        design2A.filters[1].name = filter2A.filters[1].name;

        filterService['filterCollection'].setFilters(source1, [filter1A, filter1B, filter1C, filter1D]);
        filterService['filterCollection'].setFilters(source2, [filter2A]);
    }));

    afterEach(() => {
        // Services are not recreated in each test so we must reset the internal data.
        (filterService['filterCollection'])['data'].clear();
    });

    /**
     * Generates test relation filters and activates them in the FilterService.
     */
    let activateRelationFilters = () => {
        generateRelationFilters();
        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2]);
    };

    /**
     * Generates test relation filters.
     */
    let generateRelationFilters = () => {
        relationSource1 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.RELATION_A.columnName,
            operator: '='
        } as FilterDataSource];
        relationSource2 = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.RELATION_B.columnName,
            operator: '='
        } as FilterDataSource];

        relationDesign1 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;
        relationDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testRelation'
        } as SimpleFilterDesign;

        relationFilter1 = FilterUtil.createFilterFromDesign(relationDesign1, searchService);
        relationFilter2 = FilterUtil.createFilterFromDesign(relationDesign2, searchService);
        relationFilter1.relations = [relationFilter2.id];
        relationFilter2.relations = [relationFilter1.id];

        relationDesign1.id = relationFilter1.id;
        relationDesign1.name = relationFilter1.name;
        relationDesign2.id = relationFilter2.id;
        relationDesign2.name = relationFilter2.name;

        /* eslint-disable-next-line jasmine/no-unsafe-spy */
        spyOn(datasetService.state, 'findRelationDataList').and.returnValue([[
            [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.RELATION_A
            }],
            [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.RELATION_B
            }]
        ]]);
    };

    it('should have expected properties', () => {
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['messenger']).toBeDefined();
    });

    it('deleteFilter should delete filter and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilter('testCaller', design1A);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilter should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilter('testCaller', relationDesign1);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should delete all filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [design1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [relationDesign1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('deleteFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.deleteFilters('testCaller', searchService, [{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign]);

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource]]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('exchangeFilters should add new filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should delete old filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testId5');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should work with custom root filters', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.exchangeFilters('testCaller', [testDesign], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.exchangeFilters(
            'testCaller',
            [relationDesign1],
            datasetService.state.findRelationDataList(),
            searchService
        );

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        let actual = filterService.exchangeFilters('testCaller', [testDesign2], datasetService.state.findRelationDataList(), searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        let testDesign1 = {
            id: listComplete[0].id,
            name: listComplete[0].name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testExchangeRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testExchangeRelation');

        testDesign2.id = listComplete[0].id;
        testDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters with filter-list-to-delete should delete argument filters', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService, [design1A]);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters with filter-list-to-delete should also delete relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService, [relationDesign1]);

        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('exchangeFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.exchangeFilters('testCaller', [], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('getFilters should return expected array', () => {
        expect(filterService.getFilters()).toEqual([design1A, design1B, design1C, design1D, design2A]);
        expect(filterService.getFilters(source1)).toEqual([design1A, design1B, design1C, design1D]);
        expect(filterService.getFilters(source2)).toEqual([design2A]);
        expect(filterService.getFilters([{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource])).toEqual([]);
    });

    it('getFiltersToSaveInConfig should return expected array', () => {
        expect(filterService.getFiltersToSaveInConfig()).toEqual([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design1C.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId3'
        }, {
            name: design1D.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId4'
        }, {
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch should return expected array', () => {
        expect(filterService.getFiltersToSearch('fakeDatastore1', 'testDatabase1', 'testTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'fakeDatabase1', 'testTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'fakeTable1', searchService)).toEqual([]);
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService)).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);
    });

    it('getFiltersToSearch with filter-list-to-ignore should return expected array', () => {
        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }, {
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design1A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testSizeField',
                operator: '>',
                value: 10
            }, {
                field: 'testSizeField',
                operator: '<',
                value: 20
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design2A])).toEqual([{
            type: 'and',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId1'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId2'
            }]
        }, {
            type: 'or',
            filters: [{
                field: 'testIdField',
                operator: '=',
                value: 'testId3'
            }, {
                field: 'testIdField',
                operator: '=',
                value: 'testId4'
            }]
        }]);

        expect(filterService.getFiltersToSearch('', 'testDatabase1', 'testTable1', searchService, [design1A, design2A])).toEqual([]);
    });

    it('setFiltersFromConfig should change filterCollection', () => {
        let actual;

        filterService.setFiltersFromConfig([], datasetService.state, searchService);
        expect(filterService['filterCollection'].getDataSources()).toEqual([]);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }], datasetService.state, searchService);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(1);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design1C.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId3'
        }, {
            name: design1D.name,
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId4'
        }], datasetService.state, searchService);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(4);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].root).toEqual(CompoundFilterType.AND);
        expect(actual[2].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[2].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[2].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[2].operator).toEqual('=');
        expect(actual[2].value).toEqual('testId3');
        expect(actual[2].root).toEqual(CompoundFilterType.OR);
        expect(actual[3].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[3].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[3].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[3].operator).toEqual('=');
        expect(actual[3].value).toEqual('testId4');
        expect(actual[3].root).toEqual(CompoundFilterType.OR);

        filterService.setFiltersFromConfig([{
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], datasetService.state, searchService);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source2]);
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);

        filterService.setFiltersFromConfig([{
            name: design1A.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        }, {
            name: design1B.name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1.name,
            table: DashboardServiceMock.TABLES.testTable1.name,
            field: DashboardServiceMock.FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        }, {
            name: design2A.name,
            root: CompoundFilterType.AND,
            type: 'and',
            filters: [{
                name: design2A.filters[0].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            }, {
                name: design2A.filters[1].name,
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1.name,
                table: DashboardServiceMock.TABLES.testTable1.name,
                field: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            }]
        }], datasetService.state, searchService);
        expect(filterService['filterCollection'].getDataSources()).toEqual([source1, source2]);
        actual = filterService['filterCollection'].getFilters(source1);
        expect(actual.length).toEqual(2);
        expect(actual[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[0].operator).toEqual('=');
        expect(actual[0].value).toEqual('testId1');
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[1].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(actual[1].operator).toEqual('=');
        expect(actual[1].value).toEqual('testId2');
        expect(actual[1].root).toEqual(CompoundFilterType.AND);
        actual = filterService['filterCollection'].getFilters(source2);
        expect(actual.length).toEqual(1);
        expect(actual[0].type).toEqual(CompoundFilterType.AND);
        expect(actual[0].root).toEqual(CompoundFilterType.AND);
        expect(actual[0].filters.length).toEqual(2);
        expect(actual[0].filters[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[0].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[0].operator).toEqual('>');
        expect(actual[0].filters[0].value).toEqual(10);
        expect(actual[0].filters[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(actual[0].filters[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(actual[0].filters[1].field).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(actual[0].filters[1].operator).toEqual('<');
        expect(actual[0].filters[1].value).toEqual(20);
    });

    it('toggleFilters should add new filters to an existing data source and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId5'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        let listComplete = filterService['filterCollection'].getFilters(source1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(5);
        expect(listComplete[0]).toEqual(filter1A);
        expect(listComplete[1]).toEqual(filter1B);
        expect(listComplete[2]).toEqual(filter1C);
        expect(listComplete[3]).toEqual(filter1D);
        expect(listComplete[4].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[4].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[4].field).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(listComplete[4].operator).toEqual('=');
        expect(listComplete[4].value).toEqual('testId5');

        testDesign.id = listComplete[4].id;
        testDesign.name = listComplete[4].name;

        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D, testDesign]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should add new filters to a new data source and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should delete old argument filters and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.toggleFilters('testCaller', [design1A, design1C], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1B, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should add new argument filters, delete old argument filters, and publish a FILTERS_CHANGED event', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign, design1A], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should work with custom root filters', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign = {
            root: CompoundFilterType.OR,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testText'
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let actual = filterService.toggleFilters('testCaller', [testDesign], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(testSource) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.TEXT);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testText');

        testDesign.id = listComplete[0].id;
        testDesign.name = listComplete[0].name;

        expect(actual.size).toEqual(3);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, testSource]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should also add new relation filters', () => {
        generateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.toggleFilters(
            'testCaller',
            [relationDesign1],
            datasetService.state.findRelationDataList(),
            searchService
        );

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign1.id = listComplete[0].id;
        relationDesign1.name = listComplete[0].name;

        listComplete = filterService['filterCollection'].getFilters(relationSource2) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(1);
        expect(listComplete[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[0].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[0].operator).toEqual('=');
        expect(listComplete[0].value).toEqual('testRelation');

        relationDesign2.id = listComplete[0].id;
        relationDesign2.name = listComplete[0].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should keep old relation filters and add new relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let testDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let actual = filterService.toggleFilters('testCaller', [testDesign2], datasetService.state.findRelationDataList(), searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        let listComplete = filterService['filterCollection'].getFilters(relationSource1) as any[]; // TODO: Typings;;
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter1);
        expect(listComplete[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[1].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_A);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        let testDesign1 = {
            id: listComplete[1].id,
            name: listComplete[1].name,
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        listComplete = filterService['filterCollection'].getFilters(relationSource2);
        expect(listComplete.length).toEqual(2);
        expect(listComplete[0]).toEqual(relationFilter2);
        expect(listComplete[1].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(listComplete[1].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(listComplete[1].field).toEqual(DashboardServiceMock.FIELD_MAP.RELATION_B);
        expect(listComplete[1].operator).toEqual('=');
        expect(listComplete[1].value).toEqual('testToggleRelation');

        testDesign2.id = listComplete[1].id;
        testDesign2.name = listComplete[1].name;

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([relationDesign1, testDesign1]);
        expect(actual.get(keys[3])).toEqual([relationDesign2, testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should also delete old relation filters', () => {
        activateRelationFilters();

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.toggleFilters(
            'testCaller',
            [relationDesign1],
            datasetService.state.findRelationDataList(),
            searchService
        );

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([]);
        expect(actual.get(keys[3])).toEqual([]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should keep non-argument relation filters and delete argument relation filters', () => {
        activateRelationFilters();

        let testDesign1 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_A,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;
        let testDesign2 = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.RELATION_B,
            operator: '=',
            value: 'testToggleRelation'
        } as SimpleFilterDesign;

        let testFilter1 = FilterUtil.createFilterFromDesign(testDesign1, searchService);
        let testFilter2 = FilterUtil.createFilterFromDesign(testDesign2, searchService);
        testFilter1.relations = [testFilter2.id];
        testFilter2.relations = [testFilter1.id];

        testDesign1.id = testFilter1.id;
        testDesign1.name = testFilter1.name;
        testDesign2.id = testFilter2.id;
        testDesign2.name = testFilter2.name;

        filterService['filterCollection'].setFilters(relationSource1, [relationFilter1, testFilter1]);
        filterService['filterCollection'].setFilters(relationSource2, [relationFilter2, testFilter2]);

        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.toggleFilters('testCaller',
            [relationDesign1], datasetService.state.findRelationDataList(), searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);
        expect(filterService['filterCollection'].getFilters(relationSource1)).toEqual([testFilter1]);
        expect(filterService['filterCollection'].getFilters(relationSource2)).toEqual([testFilter2]);

        expect(actual.size).toEqual(4);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2, relationSource1, relationSource2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);
        expect(actual.get(keys[2])).toEqual([testDesign1]);
        expect(actual.get(keys[3])).toEqual([testDesign2]);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([neonEvents.FILTERS_CHANGED, {
            change: actual,
            caller: 'testCaller'
        }]);
    });

    it('toggleFilters should not publish any event if no filters are affected', () => {
        let spy = spyOn(filterService['messenger'], 'publish');

        let actual = filterService.toggleFilters('testCaller', [], [], searchService);

        expect(filterService['filterCollection'].getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(filterService['filterCollection'].getFilters(source2)).toEqual([filter2A]);

        expect(actual.size).toEqual(2);
        let keys = Array.from(actual.keys());
        expect(keys).toEqual([source1, source2]);
        expect(actual.get(keys[0])).toEqual([design1A, design1B, design1C, design1D]);
        expect(actual.get(keys[1])).toEqual([design2A]);

        expect(spy.calls.count()).toEqual(0);
    });

    it('isFiltererd should return expected boolean', () => {
        let testCollection = new FilterCollection();
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, []);
        expect(filterService.isFiltered(testCollection)).toEqual(false);

        testCollection.setFilters(source1, [filter1A]);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(false);

        testCollection.setFilters(source2, [filter2A]);
        expect(filterService.isFiltered(testCollection)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design1A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, design2A)).toEqual(true);
        expect(filterService.isFiltered(testCollection, {
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '!='
        } as SimpleFilterDesign)).toEqual(false);
    });

    it('isFiltered with compound filter designs that have a single data source should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign, searchService);

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too many nested filters (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With incorrect values (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 1
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });

    it('isFiltered with compound filter designs that have multiple data sources should return expected boolean', () => {
        let testDesign = {
            type: 'or',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let testFilter = FilterUtil.createFilterFromDesign(testDesign, searchService);

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource, {
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.SIZE.columnName,
            operator: '!='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same design (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same data source but too few nested filters (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // Same data source but too many nested filters (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);

        // With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With correct values in different order (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // Same design in different order With correct values (should return true)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 40
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(true);

        // With incorrect values (should return false)
        expect(filterService.isFiltered(testCollection, {
            type: 'or',
            filters: [{
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 10
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '=',
                value: 20
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 30
            } as SimpleFilterDesign, {
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '!=',
                value: 50
            } as SimpleFilterDesign]
        } as CompoundFilterDesign)).toEqual(false);
    });

    it('updateCollectionWithGlobalCompatibleFilters should update argument filter collection and call redraw callback', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should copy multiple filters if multiple behaviors have compatible filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter2A]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: design2A,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1, source2]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(testCollection.getFilters(source2)).toEqual([filter2A]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should update existing filters', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C]);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should remove existing filters', () => {
        // Remove filters.
        filterService['filterCollection'].setFilters(source1, []);

        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let calls = 0;
        let testRedrawCallback = (filters) => {
            calls++;
            expect(filters).toEqual([]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();
        testCollection.setFilters(source1, [filter1A, filter1C]);

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([]);
        expect(calls).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should not copy the same filters if behaviors have the same data source', () => {
        // Remove the filter value to make the design compatible with each filter of its data source
        design1A.value = undefined;

        let testDesign = {
            type: 'and',
            root: CompoundFilterType.AND,
            filters: [{
                root: CompoundFilterType.AND,
                datastore: '',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.ID,
                operator: '='
            } as SimpleFilterDesign]
        } as CompoundFilterDesign;

        let calls1 = 0;
        let testRedrawCallback1 = (filters) => {
            calls1++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let calls2 = 0;
        let testRedrawCallback2 = (filters) => {
            calls2++;
            expect(filters).toEqual([filter1A, filter1B, filter1C, filter1D]);
        };

        let testBehaviorList = [{
            filterDesign: design1A,
            redrawCallback: testRedrawCallback1
        }, {
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback2
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([source1]);
        expect(testCollection.getFilters(source1)).toEqual([filter1A, filter1B, filter1C, filter1D]);
        expect(calls1).toEqual(1);
        expect(calls2).toEqual(1);
    });

    it('updateCollectionWithGlobalCompatibleFilters should do nothing with no compatible filters', () => {
        let testDesign = {
            root: CompoundFilterType.AND,
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '='
        } as SimpleFilterDesign;

        let testSource = [{
            datastoreName: '',
            databaseName: DashboardServiceMock.DATABASES.testDatabase1.name,
            tableName: DashboardServiceMock.TABLES.testTable1.name,
            fieldName: DashboardServiceMock.FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        let calls = 0;
        let testRedrawCallback = (__filters) => {
            calls++;
        };

        let testBehaviorList = [{
            filterDesign: testDesign,
            redrawCallback: testRedrawCallback
        } as FilterBehavior];

        let testCollection = new FilterCollection();

        filterService.updateCollectionWithGlobalCompatibleFilters(testBehaviorList, testCollection);

        expect(testCollection.getDataSources()).toEqual([testSource]);
        expect(testCollection.getFilters(testSource)).toEqual([]);
        expect(calls).toEqual(0);
    });
});
