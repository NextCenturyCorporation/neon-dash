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
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CompoundFilterType } from '../services/abstract.search.service';
import { DashboardService } from '../services/dashboard.service';
import {
    CompoundFilter,
    CompoundFilterDesign,
    FilterCollection,
    FilterDataSource,
    FilterUtil,
    SimpleFilter,
    SimpleFilterDesign
} from './filter.util';

import { NeonFieldMetaData, NeonDatabaseMetaData, NeonTableMetaData } from '../models/dataset';

import { DashboardServiceMock } from '../../testUtils/MockServices/DashboardServiceMock';
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
                datastore: '',
                database: NeonDatabaseMetaData.get({ name: 'databaseZ' }),
                table: NeonTableMetaData.get({ name: 'tableA' }),
                field: NeonFieldMetaData.get({ columnName: 'field1' }),
                operator: '=',
                value: 'value1'
            } as SimpleFilterDesign,
            {
                root: 'and',
                type: 'and',
                filters: [
                    {
                        root: CompoundFilterType.OR,
                        datastore: '',
                        database: NeonDatabaseMetaData.get({ name: 'databaseY' }),
                        table: NeonTableMetaData.get({ name: 'tableB' }),
                        field: NeonFieldMetaData.get({ columnName: 'field2' }),
                        operator: '!=',
                        value: ''
                    } as SimpleFilterDesign,
                    {
                        root: CompoundFilterType.OR,
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
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;

    initializeTestBed('Single List Filter Collection', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock }
        ],
        imports: [
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
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
        } as SimpleFilterDesign);
        filter1B = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.OR,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.ID,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterDesign);
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
        } as CompoundFilterDesign);
        filterCollection = new FilterCollection();
        (filterCollection as any).data.set(source1, [filter1A, filter1B]);
        (filterCollection as any).data.set(source2, [filter2A]);
    });

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
        } as SimpleFilterDesign);

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
        } as SimpleFilterDesign);

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
        } as SimpleFilterDesign);

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

    beforeEach(() => {
        simpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);
        // TODO THOR-1078 Remove this line
        simpleFilter.datastore = 'testDatastore1';
    });

    it('does have expected simple filter properties', () => {
        expect(simpleFilter.datastore).toEqual('testDatastore1');
        expect(simpleFilter.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(simpleFilter.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(simpleFilter.field).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(simpleFilter.operator).toEqual('=');
        expect(simpleFilter.value).toEqual('testName1');

        expect(simpleFilter.id).toBeDefined();
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
        }]);
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
        }], testSubstituteList);
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
        }], testSubstituteList);
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
        } as SimpleFilterDesign);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase2,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable2,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.TEXT,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: 'testName1'
        } as SimpleFilterDesign);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName2'
        } as SimpleFilterDesign);

        // Different custom root filter type
        let testFilter7 = FilterUtil.createFilterFromDesign({
            root: CompoundFilterType.OR,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);

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
        } as CompoundFilterDesign);

        // Correct
        let testFilter9 = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);
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
            root: CompoundFilterType.AND,
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign);
    });
});

describe('SimpleFilter (Falsey Values)', () => {
    it('filter on zero', () => {
        let filter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 0
        } as SimpleFilterDesign);
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
        } as SimpleFilterDesign);
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
        } as SimpleFilterDesign);
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
        } as SimpleFilterDesign);
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

describe('CompoundFilter (One Field)', () => {
    let compoundFilter: any;

    beforeEach(() => {
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
        } as CompoundFilterDesign);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
        });
    });

    it('does have expected compound filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
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
        }]);
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
        }], testSubstituteList);
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
        }], testSubstituteList);
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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
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
            root: CompoundFilterType.AND,
            filters: [{
                id: compoundFilter.filters[0].id,
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>',
                value: -100
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
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
});

describe('CompoundFilter (Multi-Field)', () => {
    let compoundFilter: any;

    beforeEach(() => {
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
        } as CompoundFilterDesign);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
        });
    });

    it('does have expected compound multi-field filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
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
        }]);
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
        }]);
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
        }]);
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
        }], testSubstituteList);
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
        }], testSubstituteList);
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
        }], testSubstituteList);
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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);

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
        } as CompoundFilterDesign);
        // TODO THOR-1078 Remove this line
        (testFilter9 as any).filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
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
            root: CompoundFilterType.AND,
            filters: [{
                id: compoundFilter.filters[0].id,
                root: CompoundFilterType.AND,
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterDesign, {
                id: compoundFilter.filters[1].id,
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
});

describe('CompoundFilter (Nested Compound Filters)', () => {
    let compoundFilter: any;

    beforeEach(() => {
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
        } as CompoundFilterDesign);
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => filter.filters.forEach((nestedFilter) => {
            (nestedFilter as SimpleFilter).datastore = 'testDatastore1';
        }));
    });

    it('does have expected compound nested filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
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
            root: CompoundFilterType.AND,
            filters: [{
                type: 'or',
                id: compoundFilter.filters[0].id,
                root: CompoundFilterType.AND,
                filters: [{
                    id: compoundFilter.filters[0].filters[0].id,
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.X,
                    operator: '=',
                    value: 10
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[0].filters[1].id,
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
                root: CompoundFilterType.AND,
                filters: [{
                    id: compoundFilter.filters[1].filters[0].id,
                    root: CompoundFilterType.AND,
                    datastore: 'testDatastore1',
                    database: DashboardServiceMock.DATABASES.testDatabase1,
                    table: DashboardServiceMock.TABLES.testTable1,
                    field: DashboardServiceMock.FIELD_MAP.NAME,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterDesign, {
                    id: compoundFilter.filters[1].filters[1].id,
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

describe('Filter Labels', () => {
    it('getLabel functions on string filters should return expected strings', () => {
        let stringContainsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: 'contains',
            value: 'testName1'
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        stringContainsFilter.datastore = 'testDatastore1';

        expect(stringContainsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringContainsFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringContainsFilter.getLabelForOperator()).toEqual('contains');
        expect(stringContainsFilter.getLabelForValue()).toEqual('testName1');

        let stringEqualsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        stringEqualsFilter.datastore = 'testDatastore1';

        expect(stringEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringEqualsFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringEqualsFilter.getLabelForOperator()).toEqual('');
        expect(stringEqualsFilter.getLabelForValue()).toEqual('testName1');

        let stringNotEmptyFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.NAME,
            operator: '!=',
            value: ''
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        stringNotEmptyFilter.datastore = 'testDatastore1';

        expect(stringNotEmptyFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringNotEmptyFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringNotEmptyFilter.getLabelForOperator()).toEqual('!=');
        expect(stringNotEmptyFilter.getLabelForValue()).toEqual('');
    });

    it('getLabel functions on date filters should return expected strings', () => {
        let dateEqualsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.DATE,
            operator: '=',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        dateEqualsFilter.datastore = 'testDatastore1';

        expect(dateEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateEqualsFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateEqualsFilter.getLabelForOperator()).toEqual('');
        expect(dateEqualsFilter.getLabelForValue()).toEqual('2000-01-02');

        let dateGreaterThanFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.DATE,
            operator: '>',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        dateGreaterThanFilter.datastore = 'testDatastore1';

        expect(dateGreaterThanFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateGreaterThanFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateGreaterThanFilter.getLabelForOperator()).toEqual('after');
        expect(dateGreaterThanFilter.getLabelForValue()).toEqual('2000-01-02');

        let dateLessThanFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.DATE,
            operator: '<',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        dateLessThanFilter.datastore = 'testDatastore1';

        expect(dateLessThanFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateLessThanFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateLessThanFilter.getLabelForOperator()).toEqual('before');
        expect(dateLessThanFilter.getLabelForValue()).toEqual('2000-01-02');

        // TODO THOR-1329 Add tests on dates with non-zero hours/minutes/seconds
    });

    it('getLabel functions on number filters should return expected strings', () => {
        let floatEqualsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.SIZE,
            operator: '=',
            value: 1234.5678
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        floatEqualsFilter.datastore = 'testDatastore1';

        expect(floatEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(floatEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(floatEqualsFilter.getLabelForOperator()).toEqual('');
        expect(floatEqualsFilter.getLabelForValue()).toEqual('1234.568');

        let intEqualsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.SIZE,
            operator: '=',
            value: 1234
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        intEqualsFilter.datastore = 'testDatastore1';

        expect(intEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(intEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(intEqualsFilter.getLabelForOperator()).toEqual('');
        expect(intEqualsFilter.getLabelForValue()).toEqual('1234');

        let zeroEqualsFilter: SimpleFilter = FilterUtil.createFilterFromDesign({
            datastore: 'testDatastore1',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.SIZE,
            operator: '=',
            value: 0
        } as SimpleFilterDesign) as SimpleFilter;
        // TODO THOR-1078 Remove this line
        zeroEqualsFilter.datastore = 'testDatastore1';

        expect(zeroEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(zeroEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(zeroEqualsFilter.getLabelForOperator()).toEqual('');
        expect(zeroEqualsFilter.getLabelForValue()).toEqual('0');
    });

    it('getLabel functions on bounds filter should return expected strings', () => {
        let boundsFilter: CompoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '>=',
                value: -50
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.X,
                operator: '<=',
                value: 50
            }, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '>=',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.Y,
                operator: '<=',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign) as CompoundFilter;
        // TODO THOR-1078 Remove this line
        boundsFilter.filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
        });

        expect(boundsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test X Field and Test Database 1 / ' +
            'Test Table 1 / Test Y Field');
        expect(boundsFilter.getLabelForField(true)).toEqual('Test X Field and Test Y Field');
        expect(boundsFilter.getLabelForOperator()).toEqual('');
        expect(boundsFilter.getLabelForValue()).toEqual('from (-50, -100) to (50, 100)');
    });

    it('getLabel functions on compound filter should return expected strings', () => {
        let compoundFilter: CompoundFilter = FilterUtil.createFilterFromDesign({
            type: 'or',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.NAME,
                operator: '=',
                value: 'testName'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TEXT,
                operator: '=',
                value: 'testText'
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.TYPE,
                operator: '=',
                value: 'testType'
            } as SimpleFilterDesign]
        } as CompoundFilterDesign) as CompoundFilter;
        // TODO THOR-1078 Remove this line
        compoundFilter.filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
        });

        // TODO THOR-1333 Improve label for custom compound filter
        expect(compoundFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field or Test Database 1 / ' +
            'Test Table 1 / Test Text Field or Test Database 1 / Test Table 1 / Test Type Field');
        expect(compoundFilter.getLabelForField(true)).toEqual('Test Name Field or Test Text Field or Test Type Field');
        expect(compoundFilter.getLabelForOperator()).toEqual('');
        expect(compoundFilter.getLabelForValue()).toEqual('testName or testText or testType');
    });

    it('getLabel functions on domain filter should return expected strings', () => {
        let domainFilter: CompoundFilter = FilterUtil.createFilterFromDesign({
            type: 'and',
            filters: [{
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '>=',
                value: -100
            } as SimpleFilterDesign, {
                datastore: 'testDatastore1',
                database: DashboardServiceMock.DATABASES.testDatabase1,
                table: DashboardServiceMock.TABLES.testTable1,
                field: DashboardServiceMock.FIELD_MAP.SIZE,
                operator: '<=',
                value: 100
            } as SimpleFilterDesign]
        } as CompoundFilterDesign) as CompoundFilter;
        // TODO THOR-1078 Remove this line
        domainFilter.filters.forEach((filter) => {
            (filter as SimpleFilter).datastore = 'testDatastore1';
        });

        expect(domainFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(domainFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(domainFilter.getLabelForOperator()).toEqual('');
        expect(domainFilter.getLabelForValue()).toEqual('between -100 and 100');
    });
});
