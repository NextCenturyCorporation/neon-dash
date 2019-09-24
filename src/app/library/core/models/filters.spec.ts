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
    BoundsFilterDesign,
    BoundsValues,
    CompoundFilter,
    CompoundFilterConfig,
    CompoundFilterDesign,
    CompoundValues,
    DomainFilter,
    DomainFilterDesign,
    DomainValues,
    FilterCollection,
    FilterDataSource,
    FilterUtil,
    ListFilter,
    ListFilterDesign,
    ListOfValues,
    PairFilter,
    PairFilterDesign,
    PairOfValues,
    SimpleFilterConfig
} from './filters';

import { CompoundFilterType } from './widget-option';

import { DATABASES, DATASET, DATASTORE, FIELD_MAP, TABLES } from './mock.dataset';

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

    it('createFilterFromDataList on simple filter data does return list filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testIdField',
            '=',
            'testValue'
        ]);
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as ListFilter).operator).toEqual('=');
        expect((actual as ListFilter).values).toEqual(['testValue']);
    });

    it('createFilterFromDataList does return bounds filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'bounds',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testXField',
            'testBegin1',
            'testEnd1',
            'datastore1.testDatabase2.testTable2.testYField',
            'testBegin2',
            'testEnd2'
        ]);
        expect(actual instanceof BoundsFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as BoundsFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testXField');
        expect((actual as BoundsFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testYField');
        expect((actual as BoundsFilter).begin1).toEqual('testBegin1');
        expect((actual as BoundsFilter).begin2).toEqual('testBegin2');
        expect((actual as BoundsFilter).end1).toEqual('testEnd1');
        expect((actual as BoundsFilter).end2).toEqual('testEnd2');
    });

    it('createFilterFromDataList does return domain filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'domain',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testSizeField',
            'testBegin',
            'testEnd'
        ]);
        expect(actual instanceof DomainFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as DomainFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testSizeField');
        expect((actual as DomainFilter).begin).toEqual('testBegin');
        expect((actual as DomainFilter).end).toEqual('testEnd');
    });

    it('createFilterFromDataList does return list filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'list',
            'filterId1',
            ['relationId1'],
            'and',
            'datastore1.testDatabase2.testTable2.testTextField',
            '!=',
            'testValue1',
            'testValue2'
        ]);
        expect(actual instanceof ListFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as ListFilter).fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTextField');
        expect((actual as ListFilter).operator).toEqual('!=');
        expect((actual as ListFilter).values).toEqual(['testValue1', 'testValue2']);
    });

    it('createFilterFromDataList does return pair filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'pair',
            'filterId1',
            ['relationId1'],
            'and',
            'datastore1.testDatabase2.testTable2.testNameField',
            'contains',
            'testValue1',
            'datastore1.testDatabase2.testTable2.testTypeField',
            'not contains',
            'testValue2'
        ]);
        expect(actual instanceof PairFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as PairFilter).fieldKey1).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as PairFilter).fieldKey2).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as PairFilter).operator1).toEqual('contains');
        expect((actual as PairFilter).operator2).toEqual('not contains');
        expect((actual as PairFilter).value1).toEqual('testValue1');
        expect((actual as PairFilter).value2).toEqual('testValue2');
    });

    it('createFilterFromDataList does return compound filter object', () => {
        const actual = FilterUtil.createFilterFromDataList([
            'and',
            'filterId1',
            ['relationId1'],
            ['and',
                'id2',
                ['relationId2'],
                ['id3', [], 'datastore1.testDatabase2.testTable2.testNameField', 'contains', 'testValue1'],
                ['id4', [], 'datastore1.testDatabase2.testTable2.testTypeField', 'not contains', 'testValue2']],
            ['id5', [], 'datastore1.testDatabase2.testTable2.testIdField', '=', 'testValue3']
        ]);
        expect(actual instanceof CompoundFilter).toEqual(true);
        expect(actual.id).toEqual('filterId1');
        expect(actual.relations).toEqual(['relationId1']);
        expect((actual as any).type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters.length).toEqual(2);
        expect((actual as any).filters[0] instanceof CompoundFilter).toEqual(true);
        expect((actual as any).filters[0].id).toEqual('id2');
        expect((actual as any).filters[0].relations).toEqual(['relationId2']);
        expect((actual as any).filters[0].type).toEqual(CompoundFilterType.AND);
        expect((actual as any).filters[0].filters.length).toEqual(2);
        expect((actual as any).filters[0].filters[0] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[0].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testNameField');
        expect((actual as any).filters[0].filters[0].operator).toEqual('contains');
        expect((actual as any).filters[0].filters[0].values).toEqual(['testValue1']);
        expect((actual as any).filters[0].filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[0].filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testTypeField');
        expect((actual as any).filters[0].filters[1].operator).toEqual('not contains');
        expect((actual as any).filters[0].filters[1].values).toEqual(['testValue2']);
        expect((actual as any).filters[1] instanceof ListFilter).toEqual(true);
        expect((actual as any).filters[1].fieldKey).toEqual('datastore1.testDatabase2.testTable2.testIdField');
        expect((actual as any).filters[1].operator).toEqual('=');
        expect((actual as any).filters[1].values).toEqual(['testValue3']);
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
        } as SimpleFilterConfig);
        filter1B = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.ID.columnName,
            operator: '=',
            value: 'testId2'
        } as SimpleFilterConfig);
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
        } as CompoundFilterConfig);

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
        } as SimpleFilterConfig);

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
        } as SimpleFilterConfig);

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
        } as SimpleFilterConfig);

        expect(filterCollection.setFilters(testDataSource, [testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([testFilter]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);

        expect(filterCollection.setFilters(testDataSource, [filter1A, testFilter])).toEqual(source1);
        expect((filterCollection as any).data.get(source1)).toEqual([filter1A, testFilter]);
        expect((filterCollection as any).data.has(testDataSource)).toEqual(false);
    });
});

describe('Falsey Values Filter on', () => {
    it('zero', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig);

        expect((filter as ListFilter).fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
            '.' + FIELD_MAP.NAME.columnName);
        expect((filter as ListFilter).operator).toEqual('=');
        expect((filter as ListFilter).values).toEqual([0]);

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

    it('empty string', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: ''
        } as SimpleFilterConfig);

        expect((filter as ListFilter).fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
            '.' + FIELD_MAP.NAME.columnName);
        expect((filter as ListFilter).operator).toEqual('=');
        expect((filter as ListFilter).values).toEqual(['']);

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

    it('false', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: false
        } as SimpleFilterConfig);

        expect((filter as ListFilter).fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
            '.' + FIELD_MAP.NAME.columnName);
        expect((filter as ListFilter).operator).toEqual('=');
        expect((filter as ListFilter).values).toEqual([false]);

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

    it('null', () => {
        let filter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: null
        } as SimpleFilterConfig);

        expect((filter as ListFilter).fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
            '.' + FIELD_MAP.NAME.columnName);
        expect((filter as ListFilter).operator).toEqual('=');
        expect((filter as ListFilter).values).toEqual([null]);

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
        } as CompoundFilterConfig);
    });

    it('does have expected compound filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName);
        expect(compoundFilter.filters[0].operator).toEqual('>');
        expect(compoundFilter.filters[0].values).toEqual([-100]);
        expect(compoundFilter.filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName);
        expect(compoundFilter.filters[1].operator).toEqual('<');
        expect(compoundFilter.filters[1].values).toEqual([100]);
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
        }]);
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
        }], testSubstituteList);
        expect(actual.type).toEqual(CompoundFilterType.AND);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name +
            '.' + FIELD_MAP.Y.columnName);
        expect(actual.filters[0].operator).toEqual('>');
        expect(actual.filters[0].values).toEqual([-100]);
        expect(actual.filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name +
            '.' + FIELD_MAP.Y.columnName);
        expect(actual.filters[1].operator).toEqual('<');
        expect(actual.filters[1].values).toEqual([100]);
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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(true);
    });

    it('retrieveValues on compound filter should return expected object', () => {
        expect(compoundFilter.retrieveValues()).toEqual(new CompoundValues(CompoundFilterType.AND, [
            new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testXField', '>', [-100]),
            new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testXField', '<', [100])
        ]));
    });

    it('toConfig on compound filter should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.AND, [
            new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
                '.' + FIELD_MAP.X.columnName, '>', [-100], compoundFilter.filters[0].id),
            new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
                '.' + FIELD_MAP.X.columnName, '<', [100], compoundFilter.filters[1].id)
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
        } as CompoundFilterConfig);
    });

    it('does have expected compound multi-field filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.OR);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName);
        expect(compoundFilter.filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].values).toEqual(['testName1']);
        expect(compoundFilter.filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName);
        expect(compoundFilter.filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].values).toEqual([10]);
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
        }]);
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
        }]);
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
        }]);
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
        }], testSubstituteList);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name +
            '.' + FIELD_MAP.TYPE.columnName);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].values).toEqual(['testName1']);
        expect(actual.filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
            '.' + FIELD_MAP.X.columnName);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].values).toEqual([10]);
    });

    it('createRelationFilter with multiple substitute fields should return expected object', () => {
        let actual;

        let testSubstituteList1 = [{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase2.name,
            table: TABLES.testTable2.name,
            field: FIELD_MAP.TYPE.columnName
        }];

        let testSubstituteList2 = [{
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
        }], testSubstituteList1);

        actual = actual.createRelationFilter([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName
        }], testSubstituteList2);
        expect(actual.type).toEqual(CompoundFilterType.OR);
        expect(actual.filters.length).toEqual(2);
        expect(actual.filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name +
            '.' + FIELD_MAP.TYPE.columnName);
        expect(actual.filters[0].operator).toEqual('=');
        expect(actual.filters[0].values).toEqual(['testName1']);
        expect(actual.filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name +
            '.' + FIELD_MAP.Y.columnName);
        expect(actual.filters[1].operator).toEqual('=');
        expect(actual.filters[1].values).toEqual([10]);
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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

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
        } as CompoundFilterConfig);

        expect(compoundFilter.isEquivalentToFilter(testFilter1)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter2)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter3)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter4)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter5)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter6)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter7)).toEqual(false);
        expect(compoundFilter.isEquivalentToFilter(testFilter8)).toEqual(true);
    });

    it('retrieveValues on compound multi-field filter should return expected object', () => {
        expect(compoundFilter.retrieveValues()).toEqual(new CompoundValues(CompoundFilterType.OR, [
            new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testName1']),
            new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testXField', '=', [10])
        ]));
    });

    it('toConfig on compound multi-field filter should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.OR, [
            new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
                '.' + FIELD_MAP.NAME.columnName, '=', ['testName1'], compoundFilter.filters[0].id),
            new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name +
                '.' + FIELD_MAP.X.columnName, '=', [10], compoundFilter.filters[1].id)
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
        } as CompoundFilterConfig);
    });

    it('does have expected compound nested filter properties', () => {
        expect(compoundFilter.id).toBeDefined();
        expect(compoundFilter.relations).toEqual([]);
        expect(compoundFilter.type).toEqual(CompoundFilterType.AND);

        expect(compoundFilter.filters.length).toEqual(2);
        expect(compoundFilter.filters[0].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[0].filters.length).toEqual(2);
        expect(compoundFilter.filters[0].filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName);
        expect(compoundFilter.filters[0].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[0].values).toEqual([10]);
        expect(compoundFilter.filters[0].filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName);
        expect(compoundFilter.filters[0].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[0].filters[1].values).toEqual([20]);
        expect(compoundFilter.filters[1].type).toEqual(CompoundFilterType.OR);
        expect(compoundFilter.filters[1].filters.length).toEqual(2);
        expect(compoundFilter.filters[1].filters[0].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName);
        expect(compoundFilter.filters[1].filters[0].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[0].values).toEqual(['testName1']);
        expect(compoundFilter.filters[1].filters[1].fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName);
        expect(compoundFilter.filters[1].filters[1].operator).toEqual('=');
        expect(compoundFilter.filters[1].filters[1].values).toEqual(['testName2']);
    });

    it('retrieveValues on compound nested filter should return expected object', () => {
        expect(compoundFilter.retrieveValues()).toEqual(new CompoundValues(CompoundFilterType.AND, [
            new CompoundValues(CompoundFilterType.OR, [
                new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testXField', '=', [10]),
                new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testXField', '=', [20])
            ]),
            new CompoundValues(CompoundFilterType.OR, [
                new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testName1']),
                new ListOfValues(CompoundFilterType.OR, 'datastore1.testDatabase1.testTable1.testNameField', '=', ['testName2'])
            ])
        ]));
    });

    it('toConfig on compound nested filters should return expected object', () => {
        expect(compoundFilter.toConfig()).toEqual(new CompoundFilterDesign(CompoundFilterType.AND, [
            new CompoundFilterDesign(CompoundFilterType.OR, [
                new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
                    TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName, '=', [10], compoundFilter.filters[0].filters[0].id),
                new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
                    TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName, '=', [20], compoundFilter.filters[0].filters[1].id)
            ], compoundFilter.filters[0].id),
            new CompoundFilterDesign(CompoundFilterType.OR, [
                new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
                    TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, '=', ['testName1'], compoundFilter.filters[1].filters[0].id),
                new ListFilterDesign(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
                    TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, '=', ['testName2'], compoundFilter.filters[1].filters[1].id)
            ], compoundFilter.filters[1].id)
        ], compoundFilter.id));
    });
});

describe('Filter.fromDataList static functions', () => {
    it('ListFilter.fromDataList with simple filter data does return expected object', () => {
        expect(ListFilter.fromDataList(['filterId1', ['relationId1'], 'datastore1.testDatabase2.testTable2.testIdField', '=', 'testId']))
            .toEqual(new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' +
                TABLES.testTable2.name + '.' + FIELD_MAP.ID.columnName, '=', ['testId'], 'filterId1', ['relationId1']));
    });

    it('CompoundFilter.fromDataList does return expected object', () => {
        expect(CompoundFilter.fromDataList([
            'and',
            'filterId1',
            ['relationId1'],
            [
                'and',
                'filterId2',
                ['relationId2'],
                ['filterId3', [], 'datastore1.testDatabase2.testTable2.testNameField', '=', 'testName'],
                ['filterId4', [], 'datastore1.testDatabase2.testTable2.testTypeField', '!=', 'testType']
            ],
            ['filterId5', [], 'datastore1.testDatabase2.testTable2.testIdField', '=', 'testId']
        ])).toEqual(new CompoundFilter(CompoundFilterType.AND, [
            new CompoundFilter(CompoundFilterType.AND, [
                new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' +
                    TABLES.testTable2.name + '.' + FIELD_MAP.NAME.columnName, '=', ['testName'], 'filterId3'),
                new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' +
                    TABLES.testTable2.name + '.' + FIELD_MAP.TYPE.columnName, '!=', ['testType'], 'filterId4')
            ], 'filterId2', ['relationId2']),
            new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' +
                TABLES.testTable2.name + '.' + FIELD_MAP.ID.columnName, '=', ['testId'], 'filterId5')
        ], 'filterId1', ['relationId1']));
    });

    it('BoundsFilter.fromDataList does return expected object', () => {
        const boundsFilterA = BoundsFilter.fromDataList(['bounds',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testXField',
            1,
            2,
            'datastore1.testDatabase2.testTable2.testYField',
            3,
            4]);
        expect(boundsFilterA.fieldKey1).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.X.columnName);
        expect(boundsFilterA.fieldKey2).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.Y.columnName);
        expect(boundsFilterA.begin1).toEqual(1);
        expect(boundsFilterA.begin2).toEqual(3);
        expect(boundsFilterA.end1).toEqual(2);
        expect(boundsFilterA.end2).toEqual(4);
        expect(boundsFilterA.id).toEqual('filterId1');
        expect(boundsFilterA.relations).toEqual(['relationId1']);
    });

    it('DomainFilter.fromDataList does return expected object', () => {
        const domainFilterA = DomainFilter.fromDataList(['domain',
            'filterId1',
            ['relationId1'],
            'datastore1.testDatabase2.testTable2.testXField',
            1,
            2]);
        expect(domainFilterA.fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.X.columnName);
        expect(domainFilterA.begin).toEqual(1);
        expect(domainFilterA.end).toEqual(2);
        expect(domainFilterA.id).toEqual('filterId1');
        expect(domainFilterA.relations).toEqual(['relationId1']);
    });

    it('ListFilter.fromDataList does return expected object', () => {
        const listFilterA = ListFilter.fromDataList(['list',
            'filterId1',
            ['relationId1'],
            'or',
            'datastore1.testDatabase2.testTable2.testTextField',
            '!=',
            'testText1',
            'testText2']);
        expect(listFilterA.fieldKey).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.TEXT.columnName);
        expect(listFilterA.operator).toEqual('!=');
        expect(listFilterA.values).toEqual(['testText1', 'testText2']);
        expect(listFilterA.id).toEqual('filterId1');
        expect(listFilterA.relations).toEqual(['relationId1']);
        expect(listFilterA.type).toEqual(CompoundFilterType.OR);
    });

    it('PairFilter.fromDataList does return expected object', () => {
        const pairFilterA = PairFilter.fromDataList(['pair',
            'filterId1',
            ['relationId1'],
            'or',
            'datastore1.testDatabase2.testTable2.testNameField',
            '=',
            'testName',
            'datastore1.testDatabase2.testTable2.testTypeField',
            '!=',
            'testType']);
        expect(pairFilterA.fieldKey1).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.NAME.columnName);
        expect(pairFilterA.fieldKey2).toEqual(DATASTORE.name + '.' + DATABASES.testDatabase2.name + '.' + TABLES.testTable2.name + '.' +
            FIELD_MAP.TYPE.columnName);
        expect(pairFilterA.operator1).toEqual('=');
        expect(pairFilterA.operator2).toEqual('!=');
        expect(pairFilterA.value1).toEqual('testName');
        expect(pairFilterA.value2).toEqual('testType');
        expect(pairFilterA.id).toEqual('filterId1');
        expect(pairFilterA.relations).toEqual(['relationId1']);
        expect(pairFilterA.type).toEqual(CompoundFilterType.OR);
    });
});

describe('BoundsFilter', () => {
    it('getLabel functions on bounds filter should return expected strings', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        expect(boundsFilterA.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test X Field and Test Database 1 / ' +
            'Test Table 1 / Test Y Field');
        expect(boundsFilterA.getLabelForField(DATASET, true)).toEqual('Test X Field and Test Y Field');
        expect(boundsFilterA.getLabelForValue(DATASET)).toEqual('from (-50, -100) to (50, 100)');
    });

    it('retrieveValues on bounds filter does return expected values', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        expect(boundsFilterA.retrieveValues()).toEqual(new BoundsValues(
            -50,
            -100,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            50,
            100
        ));
    });

    it('toDataList on bounds filter does return expected list', () => {
        let boundsFilterA = new BoundsFilter(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -50, -100, 50, 100
        );

        expect(boundsFilterA.toDataList()).toEqual([
            'bounds',
            boundsFilterA.id,
            [],
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            -50,
            50,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            -100,
            100
        ]);
    });
});

describe('DomainFilter', () => {
    it('getLabel functions on domain filter should return expected strings', () => {
        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        expect(domainFilterA.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(domainFilterA.getLabelForField(DATASET, true)).toEqual('Test Size Field');
        expect(domainFilterA.getLabelForValue(DATASET)).toEqual('between -100 and 100');
    });

    it('retrieveValues on domain filter does return expected values', () => {
        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        expect(domainFilterA.retrieveValues()).toEqual(new DomainValues(
            -100,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.SIZE.columnName,
            100
        ));
    });

    it('toDataList on domain filter does return expected list', () => {
        let domainFilterA = new DomainFilter(DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' +
            FIELD_MAP.SIZE.columnName, -100, 100);

        expect(domainFilterA.toDataList()).toEqual([
            'domain',
            domainFilterA.id,
            [],
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.SIZE.columnName,
            -100,
            100
        ]);
    });
});

describe('ListFilter', () => {
    it('getLabel functions on list filter should return expected strings', () => {
        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        expect(listFilterA.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Text Field');
        expect(listFilterA.getLabelForField(DATASET, true)).toEqual('Test Text Field');
        expect(listFilterA.getLabelForValue(DATASET)).toEqual('!= (testText1 or testText2 or testText3)');
        expect(listFilterA.getLabelForValue(DATASET, true)).toEqual('!= (testText1 or testText2 or testText3)');
    });

    it('getLabel functions on list filter with equals operator should return expected strings', () => {
        let listFilterB = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '=', ['testText1', 'testText2', 'testText3']);

        expect(listFilterB.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Text Field');
        expect(listFilterB.getLabelForField(DATASET, true)).toEqual('Test Text Field');
        expect(listFilterB.getLabelForValue(DATASET)).toEqual('testText1 or testText2 or testText3');
        expect(listFilterB.getLabelForValue(DATASET, true)).toEqual('testText1 or testText2 or testText3');
    });

    it('getLabel functions on list filter with many values should return expected strings', () => {
        let values = ['testText1', 'testText2', 'testText3', 'testText4', 'testText5', 'testText6', 'testText7', 'testText8', 'testText9'];
        let listFilterC = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', values);

        expect(listFilterC.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Text Field');
        expect(listFilterC.getLabelForField(DATASET, true)).toEqual('Test Text Field');
        expect(listFilterC.getLabelForValue(DATASET)).toEqual('!= (testText1 or testText2 or testText3 or 6 more...)');
        expect(listFilterC.getLabelForValue(DATASET, true)).toEqual('!= (testText1 or testText2 or testText3 or 6 more...)');
    });

    it('getLabel functions on list filter with many values and equals operator should return expected strings', () => {
        let values = ['testText1', 'testText2', 'testText3', 'testText4', 'testText5', 'testText6', 'testText7', 'testText8', 'testText9'];
        let listFilterD = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '=', values);

        expect(listFilterD.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Text Field');
        expect(listFilterD.getLabelForField(DATASET, true)).toEqual('Test Text Field');
        expect(listFilterD.getLabelForValue(DATASET)).toEqual('testText1 or testText2 or testText3 or 6 more...');
        expect(listFilterD.getLabelForValue(DATASET, true)).toEqual('testText1 or testText2 or testText3 or 6 more...');
    });

    it('retrieveValues on list filter does return expected values', () => {
        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        expect(listFilterA.retrieveValues()).toEqual(new ListOfValues(
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
            '!=',
            ['testText1', 'testText2', 'testText3']
        ));
    });

    it('toDataList on list filter does return expected list', () => {
        let listFilterA = new ListFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName, '!=', ['testText1', 'testText2', 'testText3']);

        expect(listFilterA.toDataList()).toEqual([
            'list',
            listFilterA.id,
            [],
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
            '!=',
            'testText1',
            'testText2',
            'testText3'
        ]);
    });
});

describe('PairFilter', () => {
    it('getLabel functions on pair filter should return expected strings', () => {
        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        expect(pairFilterA.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Name Field or Test Database 1 / ' +
            'Test Table 1 / Test Type Field');
        expect(pairFilterA.getLabelForField(DATASET, true)).toEqual('Test Name Field or Test Type Field');
        expect(pairFilterA.getLabelForValue(DATASET)).toEqual('testName or != testType');
        expect(pairFilterA.getLabelForValue(DATASET, true)).toEqual('testName or != testType');
    });

    it('getLabel functions on pair filter with same operator should return expected strings', () => {
        let pairFilterB = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '!=', '!=', 'testName', 'testType');

        expect(pairFilterB.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Name Field or Test Database 1 / ' +
            'Test Table 1 / Test Type Field');
        expect(pairFilterB.getLabelForField(DATASET, true)).toEqual('Test Name Field or Test Type Field');
        expect(pairFilterB.getLabelForValue(DATASET)).toEqual('!= (testName or testType)');
        expect(pairFilterB.getLabelForValue(DATASET, true)).toEqual('!= (testName or testType)');
    });

    it('retrieveValues on pair filter does return expected values', () => {
        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        expect(pairFilterA.retrieveValues()).toEqual(new PairOfValues(
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
            '=',
            '!=',
            'testName',
            'testType'
        ));
    });

    it('toDataList on pair filter does return expected list', () => {
        let pairFilterA = new PairFilter(CompoundFilterType.OR, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName, DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' +
            TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName, '=', '!=', 'testName', 'testType');

        expect(pairFilterA.toDataList()).toEqual([
            'pair',
            pairFilterA.id,
            [],
            CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
            '=',
            'testName',
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
            '!=',
            'testType'
        ]);
    });
});

describe('Filter getLabel function on', () => {
    it('string filters should return expected strings', () => {
        let stringContainsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: 'contains',
            value: 'testName1'
        } as SimpleFilterConfig) as ListFilter;

        expect(stringContainsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringContainsFilter.getLabelForField(DATASET, true)).toEqual('Test Name Field');
        expect(stringContainsFilter.getLabelForValue(DATASET)).toEqual('contains testName1');

        let stringEqualsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName1'
        } as SimpleFilterConfig) as ListFilter;

        expect(stringEqualsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringEqualsFilter.getLabelForField(DATASET, true)).toEqual('Test Name Field');
        expect(stringEqualsFilter.getLabelForValue(DATASET)).toEqual('testName1');

        let stringNotEmptyFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '!=',
            value: ''
        } as SimpleFilterConfig) as ListFilter;

        expect(stringNotEmptyFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Name Field');
        expect(stringNotEmptyFilter.getLabelForField(DATASET, true)).toEqual('Test Name Field');
        expect(stringNotEmptyFilter.getLabelForValue(DATASET)).toEqual('!= <empty>');
    });

    it('date filters should return expected strings', () => {
        let dateEqualsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '=',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig) as ListFilter;

        expect(dateEqualsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateEqualsFilter.getLabelForField(DATASET, true)).toEqual('Test Date Field');
        expect(dateEqualsFilter.getLabelForValue(DATASET)).toEqual('2000-01-02');

        let dateGreaterThanFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '>',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig) as ListFilter;

        expect(dateGreaterThanFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateGreaterThanFilter.getLabelForField(DATASET, true)).toEqual('Test Date Field');
        expect(dateGreaterThanFilter.getLabelForValue(DATASET)).toEqual('> 2000-01-02');

        let dateLessThanFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.DATE.columnName,
            operator: '<',
            value: '2000-01-02T00:00:00Z'
        } as SimpleFilterConfig) as ListFilter;

        expect(dateLessThanFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Date Field');
        expect(dateLessThanFilter.getLabelForField(DATASET, true)).toEqual('Test Date Field');
        expect(dateLessThanFilter.getLabelForValue(DATASET)).toEqual('< 2000-01-02');

        // TODO THOR-1329 Add tests on dates with non-zero hours/minutes/seconds
    });

    it('number filters should return expected strings', () => {
        let floatEqualsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 1234.5678
        } as SimpleFilterConfig) as ListFilter;

        expect(floatEqualsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(floatEqualsFilter.getLabelForField(DATASET, true)).toEqual('Test Size Field');
        expect(floatEqualsFilter.getLabelForValue(DATASET)).toEqual('1234.568');

        let intEqualsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 1234
        } as SimpleFilterConfig) as ListFilter;

        expect(intEqualsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(intEqualsFilter.getLabelForField(DATASET, true)).toEqual('Test Size Field');
        expect(intEqualsFilter.getLabelForValue(DATASET)).toEqual('1234');

        let zeroEqualsFilter: ListFilter = FilterUtil.createFilterFromConfig({
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.SIZE.columnName,
            operator: '=',
            value: 0
        } as SimpleFilterConfig) as ListFilter;

        expect(zeroEqualsFilter.getLabelForField(DATASET)).toEqual('Test Database 1 / Test Table 1 / Test Size Field');
        expect(zeroEqualsFilter.getLabelForField(DATASET, true)).toEqual('Test Size Field');
        expect(zeroEqualsFilter.getLabelForValue(DATASET)).toEqual('0');
    });

    it('compound filter should return expected strings', () => {
        let compoundFilter = FilterUtil.createFilterFromConfig({
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
                operator: 'contains',
                value: 'testText'
            } as SimpleFilterConfig, {
                datastore: DATASTORE.name,
                database: DATABASES.testDatabase1.name,
                table: TABLES.testTable1.name,
                field: FIELD_MAP.TYPE.columnName,
                operator: '!=',
                value: 'testType'
            } as SimpleFilterConfig]
        } as CompoundFilterConfig) as CompoundFilter;

        // TODO THOR-1333 Improve label for custom compound filter
        expect(compoundFilter.getLabelForField(DATASET)).toEqual('');
        expect(compoundFilter.getLabelForField(DATASET, true)).toEqual('');
        expect(compoundFilter.getLabelForValue(DATASET)).toEqual('(Test Database 1 / Test Table 1 / Test Name Field testName) or ' +
            '(Test Database 1 / Test Table 1 / Test Text Field contains testText) or ' +
            '(Test Database 1 / Test Table 1 / Test Type Field != testType)');
        expect(compoundFilter.getLabelForValue(DATASET, true)).toEqual('(Test Name Field testName) or ' +
            '(Test Text Field contains testText) or (Test Type Field != testType)');
    });
});

describe('FilterDesign constructors', () => {
    it('BoundsFilterDesign does have expected filters', () => {
        const boundsDesignA = new BoundsFilterDesign(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.Y.columnName,
            1,
            2,
            3,
            4
        );
        expect(boundsDesignA.filters).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName,
            operator: '>=',
            value: 1
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName,
            operator: '<=',
            value: 3
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.Y.columnName,
            operator: '>=',
            value: 2
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.Y.columnName,
            operator: '<=',
            value: 4
        }]);
    });

    it('DomainFilterDesign does have expected filters', () => {
        const domainDesignA = new DomainFilterDesign(
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.X.columnName,
            1,
            2
        );
        expect(domainDesignA.filters).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName,
            operator: '>=',
            value: 1
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.X.columnName,
            operator: '<=',
            value: 2
        }]);
    });

    it('ListFilterDesign does have expected filters', () => {
        const listDesignA = new ListFilterDesign(CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TEXT.columnName,
            '!=',
            ['testText1', 'testText2']);
        expect(listDesignA.filters).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '!=',
            value: 'testText1'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TEXT.columnName,
            operator: '!=',
            value: 'testText2'
        }]);
    });

    it('PairFilterDesign does have expected filters', () => {
        const pairDesignA = new PairFilterDesign(CompoundFilterType.OR,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.NAME.columnName,
            DATASTORE.name + '.' + DATABASES.testDatabase1.name + '.' + TABLES.testTable1.name + '.' + FIELD_MAP.TYPE.columnName,
            '=',
            '!=',
            'testName',
            'testType');
        expect(pairDesignA.filters).toEqual([{
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.NAME.columnName,
            operator: '=',
            value: 'testName'
        }, {
            datastore: DATASTORE.name,
            database: DATABASES.testDatabase1.name,
            table: TABLES.testTable1.name,
            field: FIELD_MAP.TYPE.columnName,
            operator: '!=',
            value: 'testType'
        }]);
    });
});

