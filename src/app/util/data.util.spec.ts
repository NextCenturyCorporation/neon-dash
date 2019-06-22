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
import { DataUtil } from './data.util';

describe('Data Util Tests', () => {
    it('deconstructDotted should work appropriately', () => {
        expect(DataUtil.deconstructDottedReference('')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(DataUtil.deconstructDottedReference('a.b')).toEqual({
            datastore: 'a',
            database: 'b',
            table: '',
            field: ''
        });

        expect(DataUtil.deconstructDottedReference('...b')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: 'b'
        });

        expect(DataUtil.deconstructDottedReference('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
    });
});
