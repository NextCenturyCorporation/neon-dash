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
import { DatasetUtil } from './dataset.util';

describe('Dataset Util Tests', () => {
    it('deconstructTableOrFieldKeySafely should work as expected', () => {
        expect(DatasetUtil.deconstructTableOrFieldKeySafely(null)).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a')).toEqual({
            datastore: 'a',
            database: '',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b')).toEqual({
            datastore: 'a',
            database: 'b',
            table: '',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('...d')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c.d')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
    });

    it('deconstructTableOrFieldKeySafely with key map should work as expected', () => {
        const keyMap = {
            key1: 'a.b.c',
            key2: 'a.b.c.d',
            key3: 'a.b.c.d.e.f'
        };

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key1', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key2', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('key3', keyMap)).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });

        expect(DatasetUtil.deconstructTableOrFieldKeySafely('w.x.y.z', keyMap)).toEqual({
            datastore: 'w',
            database: 'x',
            table: 'y',
            field: 'z'
        });
    });

    it('deconstructTableOrFieldKey should work as expected', () => {
        expect(DatasetUtil.deconstructTableOrFieldKey(null)).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('a')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('a.b')).toEqual(null);
        expect(DatasetUtil.deconstructTableOrFieldKey('...d')).toEqual(null);

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: ''
        });

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c.d')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd'
        });

        expect(DatasetUtil.deconstructTableOrFieldKey('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
    });

    it('translateFieldKeyToFieldName does return expected string', () => {
        const keyMap = {
            key1: 'a.b.c',
            key2: 'a.b.c.d',
            key3: 'a.b.c.d.e.f'
        };

        expect(DatasetUtil.translateFieldKeyToFieldName('key2', keyMap)).toEqual('d');
        expect(DatasetUtil.translateFieldKeyToFieldName('key3', keyMap)).toEqual('d.e.f');
        expect(DatasetUtil.translateFieldKeyToFieldName('w.x.y.z', keyMap)).toEqual('z');
        expect(DatasetUtil.translateFieldKeyToFieldName('testFieldName', keyMap)).toEqual('testFieldName');
    });
});
