import { NeonDashboardConfig, NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';

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

    static visitDashboards(dashboard: NeonDashboardConfig, handler: {
        leaf?: (dash: NeonDashboardLeafConfig, path?: NeonDashboardChoiceConfig[]) => void,
        choice?: (dash: NeonDashboardChoiceConfig, path?: NeonDashboardChoiceConfig[]) => void,
    }, stack = [dashboard]) {
        if ('choices' in dashboard && Object.keys(dashboard.choices).length > 0) {
            if (handler.choice) {
                handler.choice(dashboard, stack);
            }
            for (const dash of Object.values(dashboard.choices)) {
                const res = this.visitDashboards(dash, handler, [...stack, dash]);
                if (res) {
                    return res;
                }
            }
        } else if ('layout' in dashboard) {
            if (handler.leaf) {
                return handler.leaf(dashboard, stack);
            }
        }
    }

    static nameDashboards(dashboard: NeonDashboardConfig, prefix: string) {
        this.visitDashboards(dashboard, {
            leaf: (dash, choices) => {
                const name = [
                    { name: prefix }, ...choices, dash
                ]
                    .filter((ds) => !!ds.name)
                    .map((ds) => ds.name)
                    .join(' / ');

                dash.fullTitle = name;
            }
        });
    }

    static filterDashboards(dashboard: NeonDashboardConfig, filters: string) {
        this.visitDashboards(dashboard, {
            leaf: (dash) => {
                dash.filters = filters;
            }
        });
    }

    static findDashboardByKey(dashboard: NeonDashboardConfig, path: string[], i = 0): NeonDashboardLeafConfig | undefined {
        if (dashboard) {
            if (path.length && (i === path.length)) {
                return dashboard as any;
            } else if ('choices' in dashboard) {
                return this.findDashboardByKey(dashboard.choices[path[i]], path, i + 1);
            }
        }
        return;
    }

    static setAutoShowDashboard(dashboard: NeonDashboardConfig, auto: NeonDashboardLeafConfig) {
        this.visitDashboards(dashboard, {
            leaf: (dash) => {
                dash.options.connectOnLoad = dash === auto;
            }
        })
    }

    /**
     * Finds and returns the Dashboard to automatically show on page load, or null if no such dashboard exists.
     */
    static findAutoShowDashboard(dashboard: NeonDashboardConfig): NeonDashboardConfig {
        return this.visitDashboards(dashboard, {
            leaf: (dash) => {
                if (dash.options.connectOnLoad) {
                    return dash;
                }
            }
        })
    }
}
