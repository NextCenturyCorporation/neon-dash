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
import { ConfigUtil } from './config.util';
import { NeonDashboardLeafConfig, NeonDashboardChoiceConfig } from '../models/types';

(fdescribe as any)('Config Util Tests', () => {
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

    it('validateName should be strip out invalid file name chars', () => {
        expect(ConfigUtil.validateName('abc#$@#@$@#$-de.%%yml')).toEqual('abc-de.yml');
    });

    it('deconstructDotted should work appropriately', () => {
        expect(ConfigUtil.deconstructDottedReference('')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: ''
        });

        expect(ConfigUtil.deconstructDottedReference('a.b')).toEqual({
            datastore: 'a',
            database: 'b',
            table: '',
            field: ''
        });

        expect(ConfigUtil.deconstructDottedReference('...b')).toEqual({
            datastore: '',
            database: '',
            table: '',
            field: 'b'
        });

        expect(ConfigUtil.deconstructDottedReference('a.b.c.d.e.f')).toEqual({
            datastore: 'a',
            database: 'b',
            table: 'c',
            field: 'd.e.f'
        });
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

    });
});
