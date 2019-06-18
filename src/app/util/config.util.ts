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
export class ConfigUtil {
    static encodeFiltersMap = {
        '"': '’',
        '=': '≈',
        '[': '⟦',
        ']': '⟧',
        '{': '⟨',
        '}': '⟩',
        '/': '–',
        ' ': '﹒'
    };

    static decodeFiltersMap = {
        '’': '"',
        '≈': '=',
        '⟦': '[',
        '⟧': ']',
        '⟨': '{',
        '⟩': '}',
        '–': '/',
        '﹒': ' '
    };

    /**
     * Returns dotted reference in constituent parts(datastore.database.table.field).
     */
    static deconstructDottedReference(name: string) {
        const [datastore, database, table, ...field] = (name || '').split('.');
        return {
            datastore,
            database,
            table,
            field: field.join('.')
        };
    }

    static validateName(fileName: string): string {
        // Replace / with . and remove ../ and non-alphanumeric characters except ._-+=,
        return fileName.replace(/\.\.\//g, '').replace(/\//g, '.').replace(/[^A-Za-z0-9._\-+=,]/g, '');
    }

    static buildMatcher(keyMap: Record<string, string>) {
        const regex = new RegExp(
            Object
                .keys(keyMap)
                .map((key) => key.replace(/[[\]+*()]/g, (match) => `\\${match}`))
                .sort((key1, key2) => key2.length - key1.length)
                .map((key) => `(${key})`)
                .join('|'), 'g'
        );
        return regex;
    }

    static translate(data: string, keyMap: Record<string, string>): string {
        const regex = this.buildMatcher(keyMap);
        return data.replace(regex, (key) => keyMap[key]);
    }
}
