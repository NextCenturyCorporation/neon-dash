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

import { TestBed } from '@angular/core/testing';
import { neonMappings, neonUtilities, neonVariables } from './neon-namespaces';

describe('NeonMappings', () => {
    it('defines mappings', () => {
        expect(neonMappings.DATE).toBe('date');
        expect(neonMappings.ID).toBe('id');
        expect(neonMappings.LATITUDE).toBe('latitude');
        expect(neonMappings.LONGITUDE).toBe('longitude');
        expect(neonMappings.URL).toBe('url');
    });
});

describe('NeonVariables', () => {
    it('defines variables', () => {
        expect(neonVariables.ASCENDING).toBeDefined();
        expect(neonVariables.AVG).toBeDefined();
        expect(neonVariables.COUNT).toBeDefined();
        expect(neonVariables.DESCENDING).toBeDefined();
        expect(neonVariables.MAX).toBeDefined();
        expect(neonVariables.MIN).toBeDefined();
        expect(neonVariables.SUM).toBeDefined();
    });
});

describe('NeonUtilities', () => {
    it('defines utility functions', () => {
        expect(neonUtilities.deepFind).toBeDefined();
        expect(neonUtilities.flatten).toBeDefined();
    });

    it('returns an empty array from flatten if given undefined or empty input', () => {
        expect(neonUtilities.flatten(undefined)).toEqual([]);
        expect(neonUtilities.flatten(null)).toEqual([]);
        expect(neonUtilities.flatten([])).toEqual([]);
        expect(neonUtilities.flatten([[]])).toEqual([]);
    });

    it('returns the expected array from flatten if given an unnested array', () => {
        expect(neonUtilities.flatten([1])).toEqual([1]);
        expect(neonUtilities.flatten([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(neonUtilities.flatten(['1', '2', '3', '4'])).toEqual(['1', '2', '3', '4']);
        expect(neonUtilities.flatten([true, false])).toEqual([true, false]);
    });

    it('returns the expected array from flatten if given an nested array', () => {
        expect(neonUtilities.flatten([[1]])).toEqual([1]);
        expect(neonUtilities.flatten([[1], 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(neonUtilities.flatten([[1, 2], 3, 4])).toEqual([1, 2, 3, 4]);
        expect(neonUtilities.flatten([[1, 2, 3, 4]])).toEqual([1, 2, 3, 4]);
        expect(neonUtilities.flatten([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
        expect(neonUtilities.flatten([[1, [2, 3], 4]])).toEqual([1, 2, 3, 4]);
    });

    it('returns the expected array from flatten if given an array of objects', () => {
        expect(neonUtilities.flatten([{
            key1: 'value1'
        }, {
            key2: 12345
        }])).toEqual([{
            key1: 'value1'
        }, {
            key2: 12345
        }]);
        expect(neonUtilities.flatten([[{
            key1: 'value1'
        }], [{
            key2: 12345
        }]])).toEqual([{
            key1: 'value1'
        }, {
            key2: 12345
        }]);
    });

    it('returns undefined from deepFind if given undefined or an unknown path', () => {
        expect(neonUtilities.deepFind(undefined, undefined)).toBeUndefined();
        expect(neonUtilities.deepFind(undefined, '')).toBeUndefined();
        expect(neonUtilities.deepFind(undefined, 'key')).toBeUndefined();
        expect(neonUtilities.deepFind({}, 'key')).toBeUndefined();
        expect(neonUtilities.deepFind({
            otherKey: 'otherValue'
        }, 'key')).toBeUndefined();
        expect(neonUtilities.deepFind({
            outerKey: {
                innerKey: 'value'
            }
        }, 'outerKey.otherKey')).toBeUndefined();
    });

    it('returns the expected object from deepFind if given an unnested path', () => {
        expect(neonUtilities.deepFind({
            key1: 'value',
            key2: 12345
        }, 'key1')).toEqual('value');
        expect(neonUtilities.deepFind({
            key1: 'value',
            key2: 12345
        }, 'key2')).toEqual(12345);
        expect(neonUtilities.deepFind({
            key1: ['arrayValue'],
            key2: {
                innerKey: 'innerValue'
            }
        }, 'key1')).toEqual(['arrayValue']);
        expect(neonUtilities.deepFind({
            key1: ['arrayValue'],
            key2: {
                innerKey: 'innerValue'
            }
        }, 'key2')).toEqual({
            innerKey: 'innerValue'
        });
    });

    it('returns the expected object from deepFind if given a nested object path', () => {
        expect(neonUtilities.deepFind({
            key1: {
                keyA: 'value',
                keyB: 12345
            },
            key2: {
                keyC: ['arrayValue'],
                keyD: {
                    innerKey: 'innerValue'
                }
            }
        }, 'key1.keyA')).toEqual('value');
        expect(neonUtilities.deepFind({
            key1: {
                keyA: 'value',
                keyB: 12345
            },
            key2: {
                keyC: ['arrayValue'],
                keyD: {
                    innerKey: 'innerValue'
                }
            }
        }, 'key1.keyB')).toEqual(12345);
        expect(neonUtilities.deepFind({
            key1: {
                keyA: 'value',
                keyB: 12345
            },
            key2: {
                keyC: ['arrayValue'],
                keyD: {
                    innerKey: 'innerValue'
                }
            }
        }, 'key2.keyC')).toEqual(['arrayValue']);
        expect(neonUtilities.deepFind({
            key1: {
                keyA: 'value',
                keyB: 12345
            },
            key2: {
                keyC: ['arrayValue'],
                keyD: {
                    innerKey: 'innerValue'
                }
            }
        }, 'key2.keyD.innerKey')).toEqual('innerValue');
    });

    it('returns the expected array from deepFind if given a nested array path', () => {
        expect(neonUtilities.deepFind({
            key1: [{
                keyA: 'value1',
                keyB: 12345
            }, {
                keyA: 'value2',
                keyB: 67890
            }],
            key2: [{
                keyC: ['arrayValue1'],
                keyD: {
                    innerKey: 'innerValue1'
                }
            }, {
                keyC: ['arrayValue2'],
                keyD: {
                    innerKey: 'innerValue2'
                }
            }]
        }, 'key1.keyA')).toEqual(['value1', 'value2']);
        expect(neonUtilities.deepFind({
            key1: [{
                keyA: 'value1',
                keyB: 12345
            }, {
                keyA: 'value2',
                keyB: 67890
            }],
            key2: [{
                keyC: ['arrayValue1'],
                keyD: {
                    innerKey: 'innerValue1'
                }
            }, {
                keyC: ['arrayValue2'],
                keyD: {
                    innerKey: 'innerValue2'
                }
            }]
        }, 'key1.keyB')).toEqual([12345, 67890]);
        expect(neonUtilities.deepFind({
            key1: [{
                keyA: 'value1',
                keyB: 12345
            }, {
                keyA: 'value2',
                keyB: 67890
            }],
            key2: [{
                keyC: ['arrayValue1'],
                keyD: {
                    innerKey: 'innerValue1'
                }
            }, {
                keyC: ['arrayValue2'],
                keyD: {
                    innerKey: 'innerValue2'
                }
            }]
        }, 'key2.keyC')).toEqual(['arrayValue1', 'arrayValue2']);
        expect(neonUtilities.deepFind({
            key1: [{
                keyA: 'value1',
                keyB: 12345
            }, {
                keyA: 'value2',
                keyB: 67890
            }],
            key2: [{
                keyC: ['arrayValue1'],
                keyD: {
                    innerKey: 'innerValue1'
                }
            }, {
                keyC: ['arrayValue2'],
                keyD: {
                    innerKey: 'innerValue2'
                }
            }]
        }, 'key2.keyD.innerKey')).toEqual(['innerValue1', 'innerValue2']);
    });

    it('returns the expected falsey object from deepFind', () => {
        expect(neonUtilities.deepFind({
            key: 0
        }, 'key')).toEqual(0);
        expect(neonUtilities.deepFind({
            key: ''
        }, 'key')).toEqual('');
        expect(neonUtilities.deepFind({
            key: false
        }, 'key')).toEqual(false);
        expect(neonUtilities.deepFind({
            key: null
        }, 'key')).toEqual(null);
    });
});
