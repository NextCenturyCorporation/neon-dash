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
    NeonDatastoreConfig, NeonDatabaseMetaData, NeonFieldMetaData,
    NeonTableMetaData, NeonDashboardLeafConfig, NeonDashboardChoiceConfig
} from '../model/types';

import { DashboardUtil } from './dashboard.util';

describe('Util: DashboardUtil', () => {
    it('appendDatastoresFromConfig with no config and no datastores should do nothing', () => {
        let input = {};
        DashboardUtil.appendDatastoresFromConfig({}, {});
        expect(input).toEqual({});
    });

    it('appendDatastoresFromConfig with config and no existing datastores should update given datastores', () => {
        let input = {};

        DashboardUtil.appendDatastoresFromConfig({
            datastore1: NeonDatastoreConfig.get({
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            })
        }, input);

        let table1 = NeonTableMetaData.get({
            name: 'table1',
            prettyName: 'Table 1',
            fields: [
                { columnName: 'fieldA', prettyName: 'Field A', hide: false, type: 'text' },
                { columnName: 'fieldB', prettyName: 'Field B', hide: true, type: 'date' }
            ],
            labelOptions: {
                valueA: 'labelA',
                valueB: 'labelB'
            },
            mappings: {
                mappingA: 'fieldA',
                mappingB: 'fieldB'
            }
        });
        let database1 = NeonDatabaseMetaData.get({
            name: 'database1',
            prettyName: 'Database 1',
            tables: {
                [table1.name]: table1
            }
        });
        let datastore1 = NeonDatastoreConfig.get({
            name: 'datastore1',
            host: 'host1',
            type: 'type1',
            databases: {
                [database1.name]: database1
            }
        });
        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('appendDatastoresFromConfig with config of multiple datastores and no existing datastores should update given datastores', () => {
        let input = {};

        DashboardUtil.appendDatastoresFromConfig({
            datastore1: NeonDatastoreConfig.get({
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            }),
            datastore2: NeonDatastoreConfig.get({
                host: 'host2',
                type: 'type2',
                databases: {
                    database2: {
                        prettyName: 'Database 2',
                        tables: {
                            table2: {
                                prettyName: 'Table 2',
                                mappings: {
                                    mappingC: 'fieldC',
                                    mappingD: 'fieldD'
                                },
                                labelOptions: {
                                    valueC: 'labelC',
                                    valueD: 'labelD'
                                },
                                fields: [{
                                    columnName: 'fieldC',
                                    prettyName: 'Field C',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldD',
                                    prettyName: 'Field D',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            })
        }, input);

        let datastore1 = NeonDatastoreConfig.get({
            name: 'datastore1',
            host: 'host1',
            type: 'type1',
            databases: {
                database1: {
                    prettyName: 'Database 1',
                    tables: {
                        table1: {
                            prettyName: 'Table 1',
                            labelOptions: {
                                valueA: 'labelA',
                                valueB: 'labelB'
                            },
                            mappings: {
                                mappingA: 'fieldA',
                                mappingB: 'fieldB'
                            },
                            fields: [
                                { columnName: 'fieldA', prettyName: 'Field A', hide: false, type: 'text' },
                                { columnName: 'fieldB', prettyName: 'Field B', hide: true, type: 'date' }

                            ]
                        }
                    }
                }
            }
        });

        let datastore2 = NeonDatastoreConfig.get({
            name: 'datastore2',
            host: 'host2',
            type: 'type2',
            databases: {
                database2: {
                    prettyName: 'Database 2',
                    tables: {
                        table2: {
                            prettyName: 'Table 2',
                            labelOptions: {
                                valueC: 'labelC',
                                valueD: 'labelD'
                            },
                            mappings: {
                                mappingC: 'fieldC',
                                mappingD: 'fieldD'
                            },
                            fields: [
                                { columnName: 'fieldC', prettyName: 'Field C', hide: false, type: 'text' },
                                { columnName: 'fieldD', prettyName: 'Field D', hide: true, type: 'date' }
                            ]
                        }
                    }
                }
            }
        });

        expect(input).toEqual({ [datastore1.name]: datastore1, [datastore2.name]: datastore2 });
    });

    it('appendDatastoresFromConfig does keep updated fields if config hasUpdatedFields', () => {
        let input = {};

        DashboardUtil.appendDatastoresFromConfig({
            datastore1: NeonDatastoreConfig.get({
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            })
        }, input);

        let table1 = NeonTableMetaData.get({ name: 'table1', prettyName: 'Table 1' });
        table1.fields = [
            NeonFieldMetaData.get({ columnName: 'fieldA', prettyName: 'Field A', hide: false, type: 'text' }),
            NeonFieldMetaData.get({ columnName: 'fieldB', prettyName: 'Field B', hide: true, type: 'date' })
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = NeonDatabaseMetaData.get({ name: 'database1', prettyName: 'Database 1' });
        database1.tables = { [table1.name]: table1 };
        let datastore1 = NeonDatastoreConfig.get({ name: 'datastore1', host: 'host1', type: 'type1' });
        datastore1.databases = { [database1.name]: database1 };
        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('appendDatastoresFromConfig with config and existing datastores should update given datastores', () => {
        let table1 = NeonTableMetaData.get({ name: 'table1', prettyName: 'Table 1' });
        table1.fields = [
            NeonFieldMetaData.get({ columnName: 'fieldA', prettyName: 'Field A', hide: false, type: 'text' }),
            NeonFieldMetaData.get({ columnName: 'fieldB', prettyName: 'Field B', hide: true, type: 'date' })
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = NeonDatabaseMetaData.get({ name: 'database1', prettyName: 'Database 1' });
        database1.tables = { [table1.name]: table1 };
        let datastore1 = NeonDatastoreConfig.get({ name: 'datastore1', host: 'host1', type: 'type1', databases: {} });
        datastore1.databases = { [database1.name]: database1 };
        let input = { [datastore1.name]: datastore1 };

        DashboardUtil.appendDatastoresFromConfig({
            datastore2: NeonDatastoreConfig.get({
                name: 'datastore2',
                host: 'host2',
                type: 'type2',
                databases: {
                    database2: {
                        prettyName: 'Database 2',
                        tables: {
                            table2: {
                                prettyName: 'Table 2',
                                mappings: {
                                    mappingC: 'fieldC',
                                    mappingD: 'fieldD'
                                },
                                labelOptions: {
                                    valueC: 'labelC',
                                    valueD: 'labelD'
                                },
                                fields: [{
                                    columnName: 'fieldC',
                                    prettyName: 'Field C',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldD',
                                    prettyName: 'Field D',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            })
        }, input);

        let table2 = NeonTableMetaData.get({ name: 'table2', prettyName: 'Table 2' });
        table2.fields = [
            NeonFieldMetaData.get({ columnName: 'fieldC', prettyName: 'Field C', hide: false, type: 'text' }),
            NeonFieldMetaData.get({ columnName: 'fieldD', prettyName: 'Field D', hide: true, type: 'date' })
        ];
        table2.labelOptions = {
            valueC: 'labelC',
            valueD: 'labelD'
        };
        table2.mappings = {
            mappingC: 'fieldC',
            mappingD: 'fieldD'
        };
        let database2 = NeonDatabaseMetaData.get({ name: 'database2', prettyName: 'Database 2' });
        database2.tables = { [table2.name]: table2 };
        let datastore2 = { name: 'datastore2', host: 'host2', type: 'type2', databases: {} };
        datastore2.databases = { [database2.name]: database2 };
        expect(input).toEqual({ [datastore1.name]: datastore1, [datastore2.name]: datastore2 });
    });

    it('appendDatastoresFromConfig with same datastore in config and existing datastores should not update given datastores', () => {
        let table1 = NeonTableMetaData.get({ name: 'table1', prettyName: 'Table 1' });
        table1.fields = [
            NeonFieldMetaData.get({ columnName: 'fieldA', prettyName: 'Field A', hide: false, type: 'text' }),
            NeonFieldMetaData.get({ columnName: 'fieldB', prettyName: 'Field B', hide: true, type: 'date' })
        ];
        table1.labelOptions = {
            valueA: 'labelA',
            valueB: 'labelB'
        };
        table1.mappings = {
            mappingA: 'fieldA',
            mappingB: 'fieldB'
        };
        let database1 = NeonDatabaseMetaData.get({ name: 'database1', prettyName: 'Database 1' });
        database1.tables = { [table1.name]: table1 };
        let datastore1 = { name: 'datastore1', host: 'host1', type: 'type1', databases: {} };
        datastore1.databases = { [database1.name]: database1 };
        let input = { [datastore1.name]: datastore1 };

        DashboardUtil.appendDatastoresFromConfig({
            datastore1: NeonDatastoreConfig.get({
                name: 'datastore1',
                host: 'host1',
                type: 'type1',
                databases: {
                    database1: {
                        prettyName: 'Database 1',
                        tables: {
                            table1: {
                                prettyName: 'Table 1',
                                mappings: {
                                    mappingA: 'fieldA',
                                    mappingB: 'fieldB'
                                },
                                labelOptions: {
                                    valueA: 'labelA',
                                    valueB: 'labelB'
                                },
                                fields: [{
                                    columnName: 'fieldA',
                                    prettyName: 'Field A',
                                    hide: false,
                                    type: 'text'
                                }, {
                                    columnName: 'fieldB',
                                    prettyName: 'Field B',
                                    hide: true,
                                    type: 'date'
                                }]
                            }
                        }
                    }
                }
            })
        }, input);

        expect(input).toEqual({ [datastore1.name]: datastore1 });
    });

    it('validateDashboards should set category and fullTitle and pathFromTop properties in given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should update simpleFilter properties in given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should delete choices with no layout or tables from given dashboards', () => {
        // TODO THOR-692
    });

    it('validateDashboards should add root dashboard if needed to given dashboards', () => {
        let argument = NeonDashboardLeafConfig.get({
            layout: 'layout1',
            name: 'dashboard1',
            fullTitle: 'dashboard1',
            pathFromTop: ['dashboard1'],
            tables: {
                key1: 'datastore1.database1.table1'
            }
        });

        let expected = NeonDashboardChoiceConfig.get({
            category: DashboardUtil.DASHBOARD_CATEGORY_DEFAULT,
            choices: {
                dashboard1: argument
            }
        });

        let actual = DashboardUtil.validateDashboards(argument);
        expect(actual).toEqual(expected);
    });
});
