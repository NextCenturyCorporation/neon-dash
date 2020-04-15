/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { ConfigUtil } from './config.util';
import { NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';

describe('Config Util Tests', () => {
    it('findAutoShowDashboard does return expected object', () => {
        expect(ConfigUtil.findAutoShowDashboard(NeonDashboardLeafConfig.get())).toBeFalsy();

        let noShowDashboard = NeonDashboardLeafConfig.get();

        expect(ConfigUtil.findAutoShowDashboard(noShowDashboard)).toBeFalsy();

        noShowDashboard.options = {
            connectOnLoad: false
        };

        expect(ConfigUtil.findAutoShowDashboard(noShowDashboard)).toBeFalsy();

        let showDashboard = NeonDashboardLeafConfig.get({
            name: 'show',
            options: {
                connectOnLoad: true
            }
        });

        expect(ConfigUtil.findAutoShowDashboard(showDashboard)).toEqual(showDashboard);

        let parentDashboard = NeonDashboardChoiceConfig.get({
            choices: {
                show: showDashboard
            }
        });

        expect(ConfigUtil.findAutoShowDashboard(parentDashboard)).toEqual(showDashboard);

        parentDashboard.choices.noShow = noShowDashboard;

        expect(ConfigUtil.findAutoShowDashboard(parentDashboard)).toEqual(showDashboard);
    });

    it('setAutoShowDashboard should set connectOnLoad in the given dashboard', () => {
        let dashboardD = NeonDashboardLeafConfig.get();
        let dashboardC = NeonDashboardLeafConfig.get();
        let dashboardB = NeonDashboardLeafConfig.get();
        let dashboardA = NeonDashboardChoiceConfig.get({
            choices: {
                b: dashboardB,
                c: dashboardC
            }
        });
        let dashboards = NeonDashboardChoiceConfig.get({
            choices: {
                a: dashboardA,
                d: dashboardD
            }
        });

        ConfigUtil.setAutoShowDashboard(dashboards, (dashboards.choices.a as NeonDashboardChoiceConfig).choices.b as
            NeonDashboardLeafConfig);
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.b as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            true
        );
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.c as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            false
        );
        expect((dashboards.choices.d as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(false);

        ConfigUtil.setAutoShowDashboard(dashboards, dashboards.choices.d as NeonDashboardLeafConfig);
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.b as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            false
        );
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.c as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            false
        );
        expect((dashboards.choices.d as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(true);
    });

    it('setAutoShowDashboard should set connectOnLoad on every dashboard if none given', () => {
        let dashboardD = NeonDashboardLeafConfig.get();
        let dashboardC = NeonDashboardLeafConfig.get();
        let dashboardB = NeonDashboardLeafConfig.get();
        let dashboardA = NeonDashboardChoiceConfig.get({
            choices: {
                b: dashboardB,
                c: dashboardC
            }
        });
        let dashboards = NeonDashboardChoiceConfig.get({
            choices: {
                a: dashboardA,
                d: dashboardD
            }
        });

        ConfigUtil.setAutoShowDashboard(dashboards);
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.b as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            true
        );
        expect(((dashboards.choices.a as NeonDashboardChoiceConfig).choices.c as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(
            true
        );
        expect((dashboards.choices.d as NeonDashboardLeafConfig).options.connectOnLoad).toEqual(true);
    });

    it('validateName should be strip out invalid file name chars', () => {
        expect(ConfigUtil.validateName('abc#$@#@$@#$-de.%%yml')).toEqual('abc-de.yml');
    });

    it('translate should encode and decode appropriately', () => {
        // Forward
        const MAPPING = { NAME: 'NM', AGE: 'A', ME: 'm' };

        const res = ConfigUtil.translate('Hi NAME my AGE is for ME', MAPPING);
        expect(res).toEqual('Hi NM my A is for m');

        // Inverse
        const MAPPING_INV = { NM: 'NAME', A: 'AGE', m: 'ME' };
        const res2 = ConfigUtil.translate('Hi NM my A is for m', MAPPING_INV);
        expect(res2).toEqual('Hi NAME MEy AGE is for ME');

        // Special chars
        const MAPPING_SPEC = { '.': 'DOT', '*': 'STAR', '+': 'PLUS', '^': 'CARAT', '$': 'DOLLAR' };
        const res3 = ConfigUtil.translate('^ . * . + $', MAPPING_SPEC);
        expect(res3).toEqual('CARAT DOT STAR DOT PLUS DOLLAR');
    });

    it('should name dashboards appropriately', () => {
        const config = NeonDashboardChoiceConfig.get({
            name: 'g',
            choices: {
                a: {
                    choices: {
                        c: {

                        },
                        d: {

                        }
                    }
                },
                b: {

                }
            }
        });
        ConfigUtil.nameDashboards(config, 'prefix');

        expect(config.fullTitle).toEqual([]);
        expect(config.name).toEqual('g');

        expect(config.choices.a.fullTitle).toEqual([]);
        expect(config.choices.a.name).toEqual('a');
        expect((config.choices.a as NeonDashboardChoiceConfig).choices.c.fullTitle).toEqual(['prefix', 'g', 'a', 'c']);
        expect((config.choices.a as NeonDashboardChoiceConfig).choices.c.name).toEqual('c');

        expect(config.choices.b.fullTitle).toEqual(['prefix', 'g', 'b']);
        expect(config.choices.b.name).toEqual('b');
    });

    it('should find dashboards by key', () => {
        const config = NeonDashboardChoiceConfig.get({
            name: 'g',
            choices: {
                a: {
                    choices: {
                        c: {
                            choices: {
                                e: {}
                            }
                        },
                        d: {

                        }
                    }
                },
                b: {

                }
            }
        });

        expect(ConfigUtil.findDashboardByKey(config, 'a.c.e'.split('.')).name).toEqual('e');
        expect(ConfigUtil.findDashboardByKey(config, 'a.c'.split('.')).name).toEqual('c');
        expect(ConfigUtil.findDashboardByKey(config, 'a'.split('.')).name).toEqual('a');
        expect(ConfigUtil.findDashboardByKey(config, 'f.g'.split('.'))).toBeUndefined();
        expect(ConfigUtil.findDashboardByKey(config, ''.split('.'))).toBeUndefined();
        expect(ConfigUtil.findDashboardByKey(config, [])).toEqual(config);
    });

    it('getUrlState does parse URLs', () => {
        const result1 = ConfigUtil.getUrlState('http://localhost/');
        expect(result1.dashboard).toBeUndefined();
        expect(result1.filters).toEqual('');
        expect(result1.paths).toEqual([ConfigUtil.DEFAULT_CONFIG_NAME]);

        const result2 = ConfigUtil.getUrlState('http://localhost/?dashboard=file');
        expect(result2.dashboard).toEqual('file');
        expect(result2.filters).toEqual('');
        expect(result2.paths).toEqual(['file']);

        const result3 = ConfigUtil.getUrlState('http://localhost/#filters');
        expect(result3.dashboard).toBeUndefined();
        expect(result3.filters).toEqual('filters');
        expect(result3.paths).toEqual([ConfigUtil.DEFAULT_CONFIG_NAME]);

        const result4 = ConfigUtil.getUrlState('http://localhost/?dashboard=file#filters');
        expect(result4.dashboard).toEqual('file');
        expect(result4.filters).toEqual('filters');
        expect(result4.paths).toEqual(['file']);
    });

    it('getUrlState does parse URLs with path', () => {
        const result1 = ConfigUtil.getUrlState('http://localhost/?dashboard=file/path1');
        expect(result1.dashboard).toEqual('file');
        expect(result1.filters).toEqual('');
        expect(result1.paths).toEqual(['file', 'path1']);

        const result2 = ConfigUtil.getUrlState('http://localhost/?dashboard=file/dotted.path1');
        expect(result2.dashboard).toEqual('file');
        expect(result2.filters).toEqual('');
        expect(result2.paths).toEqual(['file', 'dotted.path1']);

        const result3 = ConfigUtil.getUrlState('http://localhost/?dashboard=file/path1#filters');
        expect(result3.dashboard).toEqual('file');
        expect(result3.filters).toEqual('filters');
        expect(result3.paths).toEqual(['file', 'path1']);

        const result4 = ConfigUtil.getUrlState('http://localhost/?dashboard=file/path1/path2/#filters');
        expect(result4.dashboard).toEqual('file');
        expect(result4.filters).toEqual('filters');
        expect(result4.paths).toEqual(['file', 'path1', 'path2']);
    });

    it('getUrlState does parse URLs with custom base HREF', () => {
        const result1 = ConfigUtil.getUrlState('http://localhost/folder1?dashboard=file/path1/path2#filters');
        expect(result1.dashboard).toEqual('file');
        expect(result1.filters).toEqual('filters');
        expect(result1.paths).toEqual(['file', 'path1', 'path2']);

        const result2 = ConfigUtil.getUrlState('http://localhost/folder1/folder2/?dashboard=file/path1/path2#filters');
        expect(result2.dashboard).toEqual('file');
        expect(result2.filters).toEqual('filters');
        expect(result2.paths).toEqual(['file', 'path1', 'path2']);
    });
});
