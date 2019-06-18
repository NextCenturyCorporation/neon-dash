export class ConfigUtil {

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
                .map((key) => key.replace(/[\[\]+*()]/g, (match) => `\\${match}`))
                .sort((a, b) => b.length - a.length)
                .map((key) => `(${key})`)
                .join('|'), 'g');
        return regex;
    }

    static translate(data: string, keyMap: Record<string, string>): string {
        const regex = this.buildMatcher(keyMap);
        return data.replace(regex, (key) => keyMap[key])
    }

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
}