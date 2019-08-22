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

import { } from '@angular/core/testing';
import { neonMappings, neonUtilities } from './neon-namespaces';

describe('NeonMappings', () => {
    it('defines mappings', () => {
        expect(neonMappings.DATE).toBe('date');
        expect(neonMappings.ID).toBe('id');
        expect(neonMappings.LATITUDE).toBe('latitude');
        expect(neonMappings.LONGITUDE).toBe('longitude');
        expect(neonMappings.URL).toBe('url');
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

    it('returns the expected object from deepFind if given a nested object path that exists at the object root', () => {
        expect(neonUtilities.deepFind({
            'key1.keyA': 'value',
            'key1.keyB': 12345,
            'key2.keyC': ['arrayValue'],
            'key2.keyD': {
                innerKey: 'innerValue'
            }
        }, 'key1.keyA')).toEqual('value');
        expect(neonUtilities.deepFind({
            'key1.keyA': 'value',
            'key1.keyB': 12345,
            'key2.keyC': ['arrayValue'],
            'key2.keyD': {
                innerKey: 'innerValue'
            }
        }, 'key1.keyB')).toEqual(12345);
        expect(neonUtilities.deepFind({
            'key1.keyA': 'value',
            'key1.keyB': 12345,
            'key2.keyC': ['arrayValue'],
            'key2.keyD': {
                innerKey: 'innerValue'
            }
        }, 'key2.keyC')).toEqual(['arrayValue']);
        expect(neonUtilities.deepFind({
            'key1.keyA': 'value',
            'key1.keyB': 12345,
            'key2.keyC': ['arrayValue'],
            'key2.keyD': {
                innerKey: 'innerValue'
            }
        }, 'key2.keyD')).toEqual({
            innerKey: 'innerValue'
        });
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

    it('returns the expected sort result for string values in ascending order', () => {
        let keys = [{
            keyA: 'value4',
            keyB: 'bravo'
        }, {
            keyA: 'value21',
            keyB: 'Oscar'
        }, {
            keyA: 'value16',
            keyB: 'sierra'
        }, {
            keyA: 'value5',
            keyB: 'foxtrot'
        }, {
            keyA: 'value75',
            keyB: 'Tango'
        }];

        expect(neonUtilities.sortArrayOfObjects(keys, 'keyA')).toEqual([
            { keyA: 'value16', keyB: 'sierra' },
            { keyA: 'value21', keyB: 'Oscar' },
            { keyA: 'value4', keyB: 'bravo' },
            { keyA: 'value5', keyB: 'foxtrot' },
            { keyA: 'value75', keyB: 'Tango' }
        ]);

        expect(neonUtilities.sortArrayOfObjects(keys, 'keyB')).toEqual([
            { keyA: 'value4', keyB: 'bravo' },
            { keyA: 'value5', keyB: 'foxtrot' },
            { keyA: 'value21', keyB: 'Oscar' },
            { keyA: 'value16', keyB: 'sierra' },
            { keyA: 'value75', keyB: 'Tango' }
        ]);
    });

    it('returns the expected sort result for string values in descending order', () => {
        let keys = [{
            keyA: 'value4',
            keyB: 'bravo'
        }, {
            keyA: 'value21',
            keyB: 'Oscar'
        }, {
            keyA: 'value16',
            keyB: 'sierra'
        }, {
            keyA: 'value5',
            keyB: 'foxtrot'
        }, {
            keyA: 'value75',
            keyB: 'Tango'
        }];

        expect(neonUtilities.sortArrayOfObjects(keys, 'keyA', -1)).toEqual([
            { keyA: 'value75', keyB: 'Tango' },
            { keyA: 'value5', keyB: 'foxtrot' },
            { keyA: 'value4', keyB: 'bravo' },
            { keyA: 'value21', keyB: 'Oscar' },
            { keyA: 'value16', keyB: 'sierra' }
        ]);
        expect(neonUtilities.sortArrayOfObjects(keys, 'keyB', -1)).toEqual([
            { keyA: 'value75', keyB: 'Tango' },
            { keyA: 'value16', keyB: 'sierra' },
            { keyA: 'value21', keyB: 'Oscar' },
            { keyA: 'value5', keyB: 'foxtrot' },
            { keyA: 'value4', keyB: 'bravo' }
        ]);
    });

    it('checkStringForUrl returns an array of occurrences of urls in the string', () => {
        let testString = 'Hello World, https://www.google.com Goodbye world https://www.yahoo.com';
        expect(neonUtilities.checkStringForUrl(testString)).toEqual(['https://www.google.com', 'https://www.yahoo.com']);
    });

    it('hasUrl works with multiple links', () => {
        let multUrlString = 'Use https://www.google.com to search as well as http://www.bing.com They both work well.';

        let testOut = neonUtilities.hasUrl(multUrlString);
        expect(testOut.url).toEqual(['https://www.google.com', 'http://www.bing.com']);
        expect(testOut.splitText).toEqual(['Use ', ' to search as well as ', ' They both work well.']);
        expect(testOut.test).toEqual(true);
    });

    it('hasUrl checks if url is in string and sets url variable, and adds http if needed', () => {
        let testString = 'Hello World, www.google.com Goodbye world';

        let testOut = neonUtilities.hasUrl(testString);

        expect(testOut.url).toEqual(['http://www.google.com']);
    });

    it('hasUrl correctly recognizes different link prefixes or postfixes', () => {
        let ftpString = 'Hello World, ftp://www.files.org Goodbye world.';
        let queryString = 'Hello World, ftp://www.files.org/there?next=free Goodbye world.';
        let fragIdString = 'Hello World, ftp://www.files.org/there.html#bar Goodbye world.';

        let testOut = neonUtilities.hasUrl(ftpString);
        expect(testOut.url).toEqual(['ftp://www.files.org']);
        expect(testOut.splitText).toEqual(['Hello World, ', ' Goodbye world.']);

        testOut = neonUtilities.hasUrl(queryString);
        expect(testOut.url).toEqual(['ftp://www.files.org/there?next=free']);
        expect(testOut.splitText).toEqual(['Hello World, ', ' Goodbye world.']);

        testOut = neonUtilities.hasUrl(fragIdString);
        expect(testOut.url).toEqual(['ftp://www.files.org/there.html#bar']);
        expect(testOut.splitText).toEqual(['Hello World, ', ' Goodbye world.']);
    });
});
