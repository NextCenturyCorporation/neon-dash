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

import {
    BoundsFilter,
    CompoundFilter,
    CompoundFilterDesign,
    DomainFilter,
    FilterCollection,
    FilterUtil,
    ListFilter,
    PairFilter,
    SimpleFilter,
    SimpleFilterDesign
} from './filter.util';

import { CompoundFilterConfig, FilterDataSource, SimpleFilterConfig } from '../models/filter';
import { CompoundFilterType } from '../models/widget-option';

import { DATABASES, DATASET, DATASTORE, FIELD_MAP, TABLES } from '../../testUtils/mock-dataset';

describe('FilterUtil', () => {
    beforeAll(() => {
        /* eslint-disable no-console */
        console.log('STARTING FILTER UTIL TESTS...');
        /* eslint-enable no-console */
    });

    it('areFilterDataSourcesEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore2',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database2',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table2',
            field: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field2',
            operator: '='
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource)).toEqual(false);

        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource)).toEqual(true);
    });

    it('areFilterDataSourcesEquivalent with ignoreOperator=true should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourcesEquivalent({
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource, true)).toEqual(true);
    });

    it('areFilterDataSourceListsEquivalent should return expected boolean', () => {
        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(false);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource])).toEqual(true);

        expect(FilterUtil.areFilterDataSourceListsEquivalent([{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource], [{
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: 'contains'
        } as FilterDataSource, {
            datastore: 'datastore1',
            database: 'database1',
            table: 'table1',
            field: 'field1',
            operator: '='
        } as FilterDataSource])).toEqual(true);
    });

    it('createFilterDataSourceListFromConfig should return expected array', () => {
        expect(FilterUtil.createFilterDataSourceListFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId'
        } as SimpleFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: '>'
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: '<'
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.Y.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testYField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId'
            } as SimpleFilterConfig, {
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 10
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.Y.columnName,
                    operator: '=',
                    value: 20
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testIdField',
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromConfig should ignore clauses in compound filters with equivalent non-value properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testIdField',
            operator: '='
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 10
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.Y.columnName,
                    operator: '=',
                    value: 20
                } as SimpleFilterConfig]
            } as CompoundFilterConfig, {
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 30
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.Y.columnName,
                    operator: '=',
                    value: 40
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testYField',
            operator: '='
        } as FilterDataSource]);
    });

    it('createFilterDataSourceListFromConfig with ignoreOperator=true should ignore operator properties', () => {
        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, true)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: undefined
        } as FilterDataSource]);

        expect(FilterUtil.createFilterDataSourceListFromConfig({
            type: 'or',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 10
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.Y.columnName,
                    operator: '=',
                    value: 20
                } as SimpleFilterConfig]
            } as CompoundFilterConfig, {
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '!=',
                    value: 30
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.Y.columnName,
                    operator: '!=',
                    value: 40
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig, true)).toEqual([{
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testXField',
            operator: undefined
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: 'testDatabase1',
            table: 'testTable1',
            field: 'testYField',
            operator: undefined
        } as FilterDataSource]);
    });

    it('isCompoundFilterConfig should return expected boolean', () => {
        expect(FilterUtil.isCompoundFilterConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId'
        } as SimpleFilterConfig)).toEqual(false);

        expect(FilterUtil.isCompoundFilterConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);
    });

    it('isSimpleFilterConfig should return expected boolean', () => {
        expect(FilterUtil.isSimpleFilterConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId'
        } as SimpleFilterConfig)).toEqual(true);

        expect(FilterUtil.isSimpleFilterConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.ID.columnName,
                operator: '=',
                value: 'testId2'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);
    });

    it('createFilterFromDataList does return simple filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'id1',
            ['relation1'],
            'datastore1.testDatabase2.testTable2.testIdField',
            '=',
            'testValue'
        ], DATASET);
        expect(actual instanceof SimpleFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).datastore).toEqual('datastore1');
        expect((actual as any).database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).table).toEqual(TABLES.testTable2);
        expect((actual as any).field).toEqual(FIELD_MAP.ID);
        expect((actual as any).operator).toEqual('=');
        expect((actual as any).value).toEqual('testValue');
    });

    it('createFilterFromDataList does return bounds filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'bounds',
            'id1',
            ['relation1'],
            'datastore1.testDatabase2.testTable2.testXField',
            'testBegin1',
            'testEnd1',
            'datastore1.testDatabase2.testTable2.testYField',
            'testBegin2',
            'testEnd2'
        ], DATASET);
        expect(actual instanceof BoundsFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(4);
        expect((actual as any).filters[0] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].field).toEqual(FIELD_MAP.X);
        expect((actual as any).filters[0].operator).toEqual('>=');
        expect((actual as any).filters[0].value).toEqual('testBegin1');
        expect((actual as any).filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[1].field).toEqual(FIELD_MAP.X);
        expect((actual as any).filters[1].operator).toEqual('<=');
        expect((actual as any).filters[1].value).toEqual('testEnd1');
        expect((actual as any).filters[2] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[2].datastore).toEqual('datastore1');
        expect((actual as any).filters[2].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[2].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[2].field).toEqual(FIELD_MAP.Y);
        expect((actual as any).filters[2].operator).toEqual('>=');
        expect((actual as any).filters[2].value).toEqual('testBegin2');
        expect((actual as any).filters[3] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[3].datastore).toEqual('datastore1');
        expect((actual as any).filters[3].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[3].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[3].field).toEqual(FIELD_MAP.Y);
        expect((actual as any).filters[3].operator).toEqual('<=');
        expect((actual as any).filters[3].value).toEqual('testEnd2');
    });

    it('createFilterFromDataList does return domain filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'domain',
            'id1',
            ['relation1'],
            'datastore1.testDatabase2.testTable2.testSizeField',
            'testBegin',
            'testEnd'
        ], DATASET);
        expect(actual instanceof DomainFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].field).toEqual(FIELD_MAP.SIZE);
        expect((actual as any).filters[0].operator).toEqual('>=');
        expect((actual as any).filters[0].value).toEqual('testBegin');
        expect((actual as any).filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[1].field).toEqual(FIELD_MAP.SIZE);
        expect((actual as any).filters[1].operator).toEqual('<=');
        expect((actual as any).filters[1].value).toEqual('testEnd');
    });

    it('createFilterFromDataList does return list filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'list',
            'id1',
            ['relation1'],
            'and',
            'datastore1.testDatabase2.testTable2.testTextField',
            '!=',
            'testValue1',
            'testValue2'
        ], DATASET);
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].field).toEqual(FIELD_MAP.TEXT);
        expect((actual as any).filters[0].operator).toEqual('!=');
        expect((actual as any).filters[0].value).toEqual('testValue1');
        expect((actual as any).filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[1].field).toEqual(FIELD_MAP.TEXT);
        expect((actual as any).filters[1].operator).toEqual('!=');
        expect((actual as any).filters[1].value).toEqual('testValue2');
    });

    it('createFilterFromDataList does return pair filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'pair',
            'id1',
            ['relation1'],
            'and',
            'datastore1.testDatabase2.testTable2.testNameField',
            'contains',
            'testValue1',
            'datastore1.testDatabase2.testTable2.testTypeField',
            'not contains',
            'testValue2'
        ], DATASET);
        expect(actual instanceof PairFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].field).toEqual(FIELD_MAP.NAME);
        expect((actual as any).filters[0].operator).toEqual('contains');
        expect((actual as any).filters[0].value).toEqual('testValue1');
        expect((actual as any).filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[1].field).toEqual(FIELD_MAP.TYPE);
        expect((actual as any).filters[1].operator).toEqual('not contains');
        expect((actual as any).filters[1].value).toEqual('testValue2');
    });

    it('createFilterFromDataList does return compound filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'and',
            'id1',
            ['relation1'],
            ['and',
                'id2',
                ['relation2'],
                ['id3', [], 'datastore1.testDatabase2.testTable2.testNameField', 'contains', 'testValue1'],
                ['id4', [], 'datastore1.testDatabase2.testTable2.testTypeField', 'not contains', 'testValue2']],
            ['id5', [], 'datastore1.testDatabase2.testTable2.testIdField', '=', 'testValue3']
        ], DATASET);
        expect(actual instanceof CompoundFilter).toEqual(true);
        expect(actual.id).toEqual('id1');
        expect(actual.relations).toEqual(['relation1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof CompoundFilter).toEqual(true);
        expect((actual as any).filters[0].id).toEqual('id2');
        expect((actual as any).filters[0].relations).toEqual(['relation2']);
        expect((actual as any).filters[0].type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters[0].filters.length).toEqual(2);
        expect((actual as any).filters[0].filters[0] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].filters[0].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].filters[0].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].filters[0].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].filters[0].field).toEqual(FIELD_MAP.NAME);
        expect((actual as any).filters[0].filters[0].operator).toEqual('contains');
        expect((actual as any).filters[0].filters[0].value).toEqual('testValue1');
        expect((actual as any).filters[0].filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[0].filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[0].filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[0].filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[0].filters[1].field).toEqual(FIELD_MAP.TYPE);
        expect((actual as any).filters[0].filters[1].operator).toEqual('not contains');
        expect((actual as any).filters[0].filters[1].value).toEqual('testValue2');
        expect((actual as any).filters[1] instanceof SimpleFilter).toEqual(true);
        expect((actual as any).filters[1].datastore).toEqual('datastore1');
        expect((actual as any).filters[1].database).toEqual(DATABASES.testDatabase2);
        expect((actual as any).filters[1].table).toEqual(TABLES.testTable2);
        expect((actual as any).filters[1].field).toEqual(FIELD_MAP.ID);
        expect((actual as any).filters[1].operator).toEqual('=');
        expect((actual as any).filters[1].value).toEqual('testValue3');
    });
});

describe('FilterCollection', () => {
    let filterCollection: FilterCollection;
    let source1: FilterDataSource[];
    let source2: FilterDataSource[];
    let filter1A: any;
    let filter1B: any;
    let filter2A: any;

    beforeEach(() => {
        source1 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];
        source2 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];
        filter1A = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterConfig, DATASET);
        filter1B = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterConfig, DATASET);
        filter2A = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

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
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId1'
        } as SimpleFilterConfig)).toEqual(source1);

        expect(filterCollection.findFilterDataSources({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '>',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '<',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(source2);
    });

    it('findFilterDataSources should return new data source and add to collection', () => {
        let actual = filterCollection.findFilterDataSources({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!=',
            value: 'testId1'
        } as SimpleFilterConfig);

        expect(actual).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource]);

        expect((filterCollection as any).data.get(actual)).toEqual([]);
    });

    it('getDataSources should return expected array', () => {
        expect(filterCollection.getDataSources()).toEqual([source1, source2]);

        let testDataSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        (filterCollection as any).data.set(testDataSource, []);

        expect(filterCollection.getDataSources()).toEqual([source1, source2, testDataSource]);
    });

    it('getFilters should create and return empty array if data source is not in collection', () => {
        // Different datastore
        let testDataSource1 = [{
            datastore: 'testDatastore2',
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different database
        let testDataSource2 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different table
        let testDataSource3 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        // Different field
        let testDataSource4 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        } as FilterDataSource];

        // Different operator
        let testDataSource5 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        // Different operators (compound)
        let testDataSource6 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
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
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        let testDataSource2 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '>'
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '<'
        } as FilterDataSource];

        expect(filterCollection.getFilters(testDataSource1)).toEqual([filter1A, filter1B]);
        expect(filterCollection.getFilters(testDataSource2)).toEqual([filter2A]);

        expect((filterCollection as any).data.has(testDataSource1)).toEqual(false);
        expect((filterCollection as any).data.has(testDataSource2)).toEqual(false);
    });

    it('isFiltererd should return expected boolean', () => {
        let testCollection = new FilterCollection();
        expect(testCollection.isFiltered()).toEqual(false);

        testCollection.setFilters(source1, []);
        expect(testCollection.isFiltered()).toEqual(false);

        let config1A = filter1A.toConfig();
        config1A.value = undefined;

        let config2A = filter2A.toConfig();
        config2A.filters[0].value = undefined;
        config2A.filters[1].value = undefined;

        testCollection.setFilters(source1, [filter1A]);
        expect(testCollection.isFiltered()).toEqual(true);
        expect(testCollection.isFiltered(config1A)).toEqual(true);
        expect(testCollection.isFiltered(config2A)).toEqual(false);

        testCollection.setFilters(source2, [filter2A]);
        expect(testCollection.isFiltered()).toEqual(true);
        expect(testCollection.isFiltered(config1A)).toEqual(true);
        expect(testCollection.isFiltered(config2A)).toEqual(true);
        expect(testCollection.isFiltered({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('isFiltered with compound filter configs that have a single data source should return expected boolean', () => {
        let testConfig = {
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig;

        let testFilter = FilterUtil.createFilterFromConfig(testConfig, DATASET);

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same config (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Same data source but too few nested filters (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Same data source but too many nested filters (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // With correct values (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // With correct values in different order (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // With incorrect values (should return false)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 1
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);
    });

    it('isFiltered with compound filter configs that have multiple data sources should return expected boolean', () => {
        let testConfig = {
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 30
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 40
            } as SimpleFilterConfig]
        } as CompoundFilterConfig;

        let testFilter = FilterUtil.createFilterFromConfig(testConfig, DATASET);

        let testSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '='
        } as FilterDataSource, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '!='
        } as FilterDataSource];

        let testCollection = new FilterCollection();
        testCollection.setFilters(testSource, [testFilter]);

        // Same config (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Same config in different order (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Same data source but too few nested filters (should return false)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Same data source but too many nested filters (should return false)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // With correct values (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 30
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 40
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // With correct values in different order (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 40
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 30
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Same config in different order With correct values (should return true)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 30
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 40
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // With incorrect values (should return false)
        expect(testCollection.isFiltered({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '=',
                value: 20
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 30
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.SIZE.columnName,
                operator: '!=',
                value: 50
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);
    });

    it('setFilters should save filters with input data source if it is not in collection', () => {
        let testDataSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!='
        } as FilterDataSource];

        let testFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '!=',
            value: 'testId'
        } as SimpleFilterConfig, DATASET);

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

        let testFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId'
        } as SimpleFilterConfig, DATASET);

        expect(filterCollection.setFilters(source1, [testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([testFilter]);

        expect(filterCollection.setFilters(source1, [filter1A, testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
    });

    it('setFilters should save filters with similar data source object in collection', () => {
        let testDataSource = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '='
        } as FilterDataSource];

        expect(filterCollection.setFilters(testDataSource, [filter1A])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        expect(filterCollection.setFilters(testDataSource, [])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        let testFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId'
        } as SimpleFilterConfig, DATASET);

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
        simpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);
    });

    it('does have expected simple filter properties', () => {
        expect(simpleFilter.datastore).toEqual(DATASTORE.name);
        expect(simpleFilter.database).toEqual(DATABASES.testDatabase1);
        expect(simpleFilter.table).toEqual(TABLES.testTable1);
        expect(simpleFilter.field).toEqual(FIELD_MAP.NAME);
        expect(simpleFilter.operator).toEqual('=');
        expect(simpleFilter.value).toEqual('testName1');

        expect(simpleFilter.id).toBeDefined();
        expect(simpleFilter.relations).toEqual([]);
    });

    it('createRelationFilter on simple filter should return null if substitue has bad data', () => {
        let actual = simpleFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: ''
        }], DATASET);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter on simple filter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.TEXT.columnName
        }];

        actual = simpleFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }], testSubstituteList, DATASET);
        expect(actual.datastore).toEqual('datastore1');
        expect(actual.database).toEqual(DATABASES.testDatabase2);
        expect(actual.table).toEqual(TABLES.testTable2);
        expect(actual.field).toEqual(FIELD_MAP.TEXT);
        expect(actual.operator).toEqual('=');
        expect(actual.value).toEqual('testName1');
    });

    it('doesAffectSearch on simple filter should return expected boolean', () => {
        expect(simpleFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable1')).toEqual(true);
        expect(simpleFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch(DATASTORE.name, 'testDatabase2', 'testTable1')).toEqual(false);
        expect(simpleFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithConfig on simple filter should return expected boolean', () => {
        // Correct, with value
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        })).toEqual(true);

        // Correct
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '='
        })).toEqual(true);

        // Different datastore
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: 'testDatastore2',
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '='
        })).toEqual(false);

        // Different database
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '='
        })).toEqual(false);

        // Different table
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '='
        })).toEqual(false);

        // Different field
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '='
        })).toEqual(false);

        // Different operator
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '!='
        })).toEqual(false);

        // Different value
        expect(simpleFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName2'
        })).toEqual(false);

        // Different structure
        expect(simpleFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            }]
        })).toEqual(false);
    });

    it('isEquivalentToFilter on simple filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromConfig({
            datastore: 'testDatastore2',
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '!=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName2'
        } as SimpleFilterConfig, DATASET);

        // Different structure
        let testFilter7 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Correct
        let testFilter8 = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET);

        expect(simpleFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(simpleFilter.isEquivalentToFilter(testFilter8)).toEqual(true);
    });

    it('toConfig on simple filter should return expected object', () => {
        expect(simpleFilter.toConfig()).toEqual(new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name,
            TABLES.testTable1.name, FIELD_MAP.NAME.columnName, '=', 'testName1', simpleFilter.id));
    });
});

describe('SimpleFilter (Falsey Values)', () => {
    it('filter on zero', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig, DATASET);

        expect((filter as any).database).toEqual(DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(TABLES.testTable1);
        expect((filter as any).field).toEqual(FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(0);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig)).toEqual(true);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('filter on empty string', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig, DATASET);

        expect((filter as any).database).toEqual(DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(TABLES.testTable1);
        expect((filter as any).field).toEqual(FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual('');

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig)).toEqual(true);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('filter on false', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig, DATASET);

        expect((filter as any).database).toEqual(DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(TABLES.testTable1);
        expect((filter as any).field).toEqual(FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig)).toEqual(true);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('filter on null', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig, DATASET);

        expect((filter as any).database).toEqual(DATABASES.testDatabase1);
        expect((filter as any).table).toEqual(TABLES.testTable1);
        expect((filter as any).field).toEqual(FIELD_MAP.NAME);
        expect((filter as any).operator).toEqual('=');
        expect((filter as any).value).toEqual(null);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig)).toEqual(false);

        expect(filter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig)).toEqual(true);
    });
});

describe('CompoundFilter (One Field)', () => {
    let compoundFilter: any;

    beforeEach(() => {
        compoundFilter = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);
    });

    it('does have expected compound filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[0].field).toEqual(FIELD_MAP.X);
        expect(compoundFilter.filters[0].operator).toEqual('>');
        expect(compoundFilter.filters[0].value).toEqual(-100);
        expect(compoundFilter.filters[1].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[1].field).toEqual(FIELD_MAP.X);
        expect(compoundFilter.filters[1].operator).toEqual('<');
        expect(compoundFilter.filters[1].value).toEqual(100);
    });

    it('createRelationFilter on compound filter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: ''
        }], DATASET);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter on compound filter should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.Y.columnName
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName
        }], testSubstituteList, DATASET);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('datastore1');
        expect(actual.filters[0].database).toEqual(DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(FIELD_MAP.Y);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].value).toEqual(-100);
        expect(actual.filters[1].datastore).toEqual('datastore1');
        expect(actual.filters[1].database).toEqual(DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].value).toEqual(100);
    });

    it('doesAffectSearch on compound filter should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithConfig on compound filter should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase2.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable2.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.Y.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: 1
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '>'
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '<'
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName,
            operator: '>'
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('isEquivalentToFilter on compound filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: 'testDatastore2',
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase2.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable2.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.Y.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: 1
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different type
        let testFilter7 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Correct
        let testFilter8 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '>',
                value: -100
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '<',
                value: 100
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(true);
    });

    it('toConfig on compound filter should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.AND, [
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.X.columnName, '>',
                -100, compoundFilter.filters[0].id),
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.X.columnName, '<',
                100, compoundFilter.filters[1].id)
        ], compoundFilter.id));
    });
});

describe('CompoundFilter (Multi-Field)', () => {
    let compoundFilter: any;

    beforeEach(() => {
        compoundFilter = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);
    });

    it('does have expected compound multi-field filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.OR);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[0].field).toEqual(FIELD_MAP.NAME);
        expect(compoundFilter.filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[1].field).toEqual(FIELD_MAP.X);
        expect(compoundFilter.filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].value).toEqual(10);
    });

    it('createRelationFilter on compound multi-field filter should return null if substitue has bad data', () => {
        let actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: ''
        }], DATASET);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter should return null if equivalent fields and substitue fields are not the same length', () => {
        let actual;

        actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TYPE.columnName
        }], DATASET);
        expect(actual).toEqual(null);

        actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }], [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TYPE.columnName
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.Y.columnName
        }], DATASET);
        expect(actual).toEqual(null);
    });

    it('createRelationFilter with single substitute field should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.TYPE.columnName
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }], testSubstituteList, DATASET);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('datastore1');
        expect(actual.filters[0].database).toEqual(DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(FIELD_MAP.TYPE);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual(DATASTORE.name);
        expect(actual.filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(actual.filters[1].table).toEqual(TABLES.testTable1);
        expect(actual.filters[1].field).toEqual(FIELD_MAP.X);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('createRelationFilter with multiple substitute fields should return expected object', () => {
        let actual;

        let testSubstituteList = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.TYPE.columnName
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.Y.columnName
        }];

        actual = compoundFilter.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName
        }], testSubstituteList, DATASET);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].datastore).toEqual('datastore1');
        expect(actual.filters[0].database).toEqual(DATABASES.testDatabase2);
        expect(actual.filters[0].table).toEqual(TABLES.testTable2);
        expect(actual.filters[0].field).toEqual(FIELD_MAP.TYPE);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].value).toEqual('testName1');
        expect(actual.filters[1].datastore).toEqual('datastore1');
        expect(actual.filters[1].database).toEqual(DATABASES.testDatabase2);
        expect(actual.filters[1].table).toEqual(TABLES.testTable2);
        expect(actual.filters[1].field).toEqual(FIELD_MAP.Y);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].value).toEqual(10);
    });

    it('doesAffectSearch on compound multi-field filter should return expected boolean', () => {
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable1')).toEqual(true);
        expect(compoundFilter.doesAffectSearch('testDatastore2', 'testDatabase1', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase2', 'testTable1')).toEqual(false);
        expect(compoundFilter.doesAffectSearch(DATASTORE.name, 'testDatabase1', 'testTable2')).toEqual(false);
    });

    it('isCompatibleWithConfig on compound multi-field filter should return expected boolean', () => {
        // Correct, with value
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Correct
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Correct, with rearranged structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(true);

        // Different datastore
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: 'testDatastore2',
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different database
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase2.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different table
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable2.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different field
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.TYPE.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different operator
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '!='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different value
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 1
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different type
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '='
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '!='
            } as SimpleFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            type: 'or',
            filters: [{
                type: 'and',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.NAME.columnName,
                    operator: '='
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '='
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig)).toEqual(false);

        // Different structure
        expect(compoundFilter.isCompatibleWithConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '='
        } as SimpleFilterConfig)).toEqual(false);
    });

    it('isEquivalentToFilter on compound multi-field filter should return expected boolean', () => {
        // Different datastore
        let testFilter1 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: 'testDatastore2',
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different database
        let testFilter2 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase2.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different table
        let testFilter3 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable2.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different field
        let testFilter4 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.TYPE.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different operator
        let testFilter5 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '!=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different value
        let testFilter6 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 1
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Different type
        let testFilter7 = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        // Correct
        let testFilter8 = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName1'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.X.columnName,
                operator: '=',
                value: 10
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET);

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(true);
    });

    it('toConfig on compound multi-field filter should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.OR, [
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.NAME.columnName,
                '=', 'testName1', compoundFilter.filters[0].id),
            new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.X.columnName,
                '=', 10, compoundFilter.filters[1].id)
        ], compoundFilter.id));
    });
});

describe('CompoundFilter (Nested Compound Filters)', () => {
    let compoundFilter: any;

    beforeEach(() => {
        compoundFilter = FilterUtil.createFilterFromConfig({
            type: 'and',
            filters: [{
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 10
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.X.columnName,
                    operator: '=',
                    value: 20
                } as SimpleFilterConfig]
            } as CompoundFilterConfig, {
                type: 'or',
                filters: [{
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.NAME.columnName,
                    operator: '=',
                    value: 'testName1'
                } as SimpleFilterConfig, {
                    datastore: DATASTORE.name,
                    database: DATABASES.testDatabase1.name,
                    table: TABLES.testTable1.name,
                    field: FIELD_MAP.NAME.columnName,
                    operator: '=',
                    value: 'testName2'
                } as SimpleFilterConfig]
            } as CompoundFilterConfig]
        } as CompoundFilterConfig, DATASET);
    });

    it('does have expected compound nested filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[0].filters.length).toEqual(2);
        expect(compoundFilter.filters[0].filters[0].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[0].filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].filters[0].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[0].filters[0].field).toEqual(FIELD_MAP.X);
        expect(compoundFilter.filters[0].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[0].value).toEqual(10);
        expect(compoundFilter.filters[0].filters[1].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[0].filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[0].filters[1].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[0].filters[1].field).toEqual(FIELD_MAP.X);
        expect(compoundFilter.filters[0].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[1].value).toEqual(20);
        expect(compoundFilter.filters[1].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[1].filters.length).toEqual(2);
        expect(compoundFilter.filters[1].filters[0].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[1].filters[0].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].filters[0].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[1].filters[0].field).toEqual(FIELD_MAP.NAME);
        expect(compoundFilter.filters[1].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[0].value).toEqual('testName1');
        expect(compoundFilter.filters[1].filters[1].datastore).toEqual(DATASTORE.name);
        expect(compoundFilter.filters[1].filters[1].database).toEqual(DATABASES.testDatabase1);
        expect(compoundFilter.filters[1].filters[1].table).toEqual(TABLES.testTable1);
        expect(compoundFilter.filters[1].filters[1].field).toEqual(FIELD_MAP.NAME);
        expect(compoundFilter.filters[1].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[1].value).toEqual('testName2');
    });

    it('toConfig on compound nested filters should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.AND, [
            new CompoundFilterDesign(CompoundFilterType.OR, [
                new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.X.columnName, '=',
                    10, compoundFilter.filters[0].filters[0].id),
                new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.X.columnName, '=',
                    20, compoundFilter.filters[0].filters[1].id)
            ], compoundFilter.filters[0].id),
            new CompoundFilterDesign(CompoundFilterType.OR, [
                new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.NAME.columnName,
                    '=', 'testName1', compoundFilter.filters[1].filters[0].id),
                new SimpleFilterDesign(DATASTORE.name, DATABASES.testDatabase1.name, TABLES.testTable1.name, FIELD_MAP.NAME.columnName,
                    '=', 'testName2', compoundFilter.filters[1].filters[1].id)
            ], compoundFilter.filters[1].id)
        ], compoundFilter.id));
    });
});

describe('Filter Labels', () => {
    it('getLabel functions on string filters should return expected strings', () => {
        let stringContainsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: 'contains',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(stringContainsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringContainsFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringContainsFilter.getLabelForOperator()).toEqual('contains');
        expect(stringContainsFilter.getLabelForValue()).toEqual('testName1');

        let stringEqualsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(stringEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringEqualsFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringEqualsFilter.getLabelForOperator()).toEqual('');
        expect(stringEqualsFilter.getLabelForValue()).toEqual('testName1');

        let stringNotEmptyFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '!=',
            value: ''
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(stringNotEmptyFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringNotEmptyFilter.getLabelForField(true)).toEqual('Test Name Field');
        expect(stringNotEmptyFilter.getLabelForOperator()).toEqual('!=');
        expect(stringNotEmptyFilter.getLabelForValue()).toEqual('<empty>');
    });

    it('getLabel functions on date filters should return expected strings', () => {
        let dateEqualsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '=',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(dateEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateEqualsFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateEqualsFilter.getLabelForOperator()).toEqual('');
        expect(dateEqualsFilter.getLabelForValue()).toEqual('2000-01-02');

        let dateGreaterThanFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '>',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(dateGreaterThanFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateGreaterThanFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateGreaterThanFilter.getLabelForOperator()).toEqual('after');
        expect(dateGreaterThanFilter.getLabelForValue()).toEqual('2000-01-02');

        let dateLessThanFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '<',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(dateLessThanFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateLessThanFilter.getLabelForField(true)).toEqual('Test Date Field');
        expect(dateLessThanFilter.getLabelForOperator()).toEqual('before');
        expect(dateLessThanFilter.getLabelForValue()).toEqual('2000-01-02');

        // TODO THOR-1329 Add tests on dates with non-zero hours/minutes/seconds
    });

    it('getLabel functions on number filters should return expected strings', () => {
        let floatEqualsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 1234.5678
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(floatEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(floatEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(floatEqualsFilter.getLabelForOperator()).toEqual('');
        expect(floatEqualsFilter.getLabelForValue()).toEqual('1234.568');

        let intEqualsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 1234
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(intEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(intEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(intEqualsFilter.getLabelForOperator()).toEqual('');
        expect(intEqualsFilter.getLabelForValue()).toEqual('1234');

        let zeroEqualsFilter: SimpleFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig, DATASET) as SimpleFilter;

        expect(zeroEqualsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(zeroEqualsFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(zeroEqualsFilter.getLabelForOperator()).toEqual('');
        expect(zeroEqualsFilter.getLabelForValue()).toEqual('0');
    });

    it('getLabel functions on bounds filter should return expected strings', () => {
        let boundsFilter: CompoundFilter = BoundsFilter.fromFilters([
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.X, '>=', -50),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.X, '<=', 50),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.Y, '>=', -100),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.Y, '<=', 100)
        ]);

        expect(boundsFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test X Field and Test Database 1 / ' +
            'Test Table 1 / Test Y Field');
        expect(boundsFilter.getLabelForField(true)).toEqual('Test X Field and Test Y Field');
        expect(boundsFilter.getLabelForOperator()).toEqual('');
        expect(boundsFilter.getLabelForValue()).toEqual('from (-50, -100) to (50, 100)');
    });

    it('getLabel functions on compound filter should return expected strings', () => {
        let compoundFilter: CompoundFilter = FilterUtil.createFilterFromConfig({
            type: 'or',
            filters: [{
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.NAME.columnName,
                operator: '=',
                value: 'testName'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.TEXT.columnName,
                operator: '=',
                value: 'testText'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.TYPE.columnName,
                operator: '=',
                value: 'testType'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig, DATASET) as CompoundFilter;

        // TODO THOR-1333 Improve label for custom compound filter
        expect(compoundFilter.getLabelForField()).toEqual('');
        expect(compoundFilter.getLabelForField(true)).toEqual('');
        expect(compoundFilter.getLabelForOperator()).toEqual('');
        expect(compoundFilter.getLabelForValue()).toEqual('(Test Database 1 / Test Table 1 / Test Name Field testName) or ' +
            '(Test Database 1 / Test Table 1 / Test Text Field testText) or (Test Database 1 / Test Table 1 / Test Type Field testType)');
        expect(compoundFilter.getLabelForValue(true)).toEqual('(Test Name Field testName) or (Test Text Field testText) or ' +
            '(Test Type Field testType)');
    });

    it('getLabel functions on domain filter should return expected strings', () => {
        let domainFilter: CompoundFilter = DomainFilter.fromFilters([
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '>=', -100),
            new SimpleFilter(DATASTORE.name, DATABASES.testDatabase1, TABLES.testTable1, FIELD_MAP.SIZE, '<=', 100)
        ]);

        expect(domainFilter.getLabelForField()).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(domainFilter.getLabelForField(true)).toEqual('Test Size Field');
        expect(domainFilter.getLabelForOperator()).toEqual('');
        expect(domainFilter.getLabelForValue()).toEqual('between -100 and 100');
    });
});

