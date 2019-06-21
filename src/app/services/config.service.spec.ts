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
import { NeonConfig, NeonDashboardLeafConfig } from '../models/types';
import { ConfigService } from './config.service';
import { getConfigService } from '../../testUtils/initializeTestBed';
import { Observable, of } from 'rxjs';
import { ConfigUtil } from '../util/config.util';

describe('Service: ConfigService', () => {
    let configService: ConfigService;

    beforeAll(() => {
        // eslint-disable-next-line no-console
        console.log('STARTING ConfigService TESTS ...');
    });

    beforeEach(() => {
        configService = getConfigService();
    });

    it('deleteState does validate the state name', () => {
        let calls = 0;
        spyOn(configService, 'openConnection').and.callFake(() => ({
            deleteState: (data, __successCallback) => {
                calls++;
                expect(data).toEqual('folder.my-test.state_name1234');
            }
        }));

        configService.delete('../folder/my-test.!@#$%^&*state_name`~?\\1234');
        expect(calls).toEqual(1);
    });

    it('load does validate the state name', () => {
        let calls = 0;
        spyOn(configService, 'openConnection').and.callFake(() => ({
            loadState: (data, __successCallback) => {
                calls++;
                expect(data).toEqual('folder.my-test.state_name1234');
            }
        }));

        configService.load('../folder/my-test.!@#$%^&*state_name`~?\\1234');
        expect(calls).toEqual(1);
    });

    it('saveState does validate the state name', () => {
        let calls = 0;
        spyOn(configService, 'openConnection').and.callFake(() => ({
            saveState: (data, __successCallback) => {
                calls++;
                expect(data.projectTitle).toEqual('folder.my-test.state_name1234');
            }
        }));

        configService.save(NeonConfig.get({ projectTitle: '../folder/my-test.!@#$%^&*state_name`~?\\1234' }));
        expect(calls).toEqual(1);
    });

    it('setActive notifies of specific events', (done) => {
        configService['$source']
            .subscribe((config) => {
                expect(config).toBeTruthy();
                expect(config.fileName).toBe('test');
                done();
            });
        configService.setActive(NeonConfig.get({ fileName: 'test' }));
    });
});

describe('Service: ConfigService Initialization', () => {
    let configService: ConfigService;

    beforeAll(() => {
        // eslint-disable-next-line no-console
        console.log('STARTING ConfigService Initialization TESTS ...');
    });

    beforeEach(() => {
        configService = getConfigService(null);
    });

    function loadConfig(this: ConfigService, fileName: string, ...__args: any[]): Observable<NeonConfig> {
        return of(NeonConfig.get({
            projecTitle: 'Test Config',
            fileName,
            dashboards: {
                choices: {
                    dashSet: {
                        choices: {
                            dash1: {
                            },
                            dash2: {
                                filters: 'SAVED_FILTERS'
                            }
                        }
                    }
                }
            }
        }));
    }

    it('setActiveByURL loads the appropriate config (with filters) given a url and base path', (done) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        configService.load = loadConfig;

        const query = ConfigUtil.translate('[["a.b.c","=","5","and"]]', ConfigUtil.encodeFiltersMap);

        configService.setActiveByURL(`http://website.com/ctx/configName?path=dashSet.dash1#${query}`, '/ctx')
            .subscribe((config) => {
                expect(config.fileName).toEqual('configName');
                expect(config).toBeTruthy();

                const dash1 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash1']) as NeonDashboardLeafConfig;
                const dash2 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash2']) as NeonDashboardLeafConfig;

                expect(dash1).toBeTruthy();
                expect(dash1.options.connectOnLoad).toEqual(true);
                expect(dash1.filters).toBeTruthy();
                expect(dash1.filters).toEqual(query);

                expect(dash2.options.connectOnLoad).toEqual(false);
                expect(dash2.filters).toEqual('SAVED_FILTERS');
                done();
            });
    });

    it('setActiveByURL loads the appropriate config (with filters) given a url and base path and secondary path', (done) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        configService.load = loadConfig;

        const query = ConfigUtil.translate('[["a.b.c","=","5","and"]]', ConfigUtil.encodeFiltersMap);

        configService.setActiveByURL(`http://website.com/ctx/configName?path=dashSet.dash2#${query}`, '/ctx')
            .subscribe((config) => {
                expect(config.fileName).toEqual('configName');
                expect(config).toBeTruthy();

                const dash1 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash1']) as NeonDashboardLeafConfig;
                const dash2 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash2']) as NeonDashboardLeafConfig;

                expect(dash2).toBeTruthy();
                expect(dash2.options.connectOnLoad).toEqual(true);
                expect(dash2.filters).toBeTruthy();
                expect(dash2.filters).toEqual(query);

                expect(dash1.options.connectOnLoad).toEqual(false);
                expect(dash1.filters).toEqual([]);
                done();
            });
    });

    it('setActiveByURL loads the appropriate config (with filters) with no path', (done) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        configService.load = loadConfig;

        const query = ConfigUtil.translate('[["a.b.c","=","5","and"]]', ConfigUtil.encodeFiltersMap);

        configService.setActiveByURL(`http://website.com/ctx/configName#${query}`, '/ctx')
            .subscribe((config) => {
                expect(config.fileName).toEqual('configName');
                expect(config).toBeTruthy();

                const dash1 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash1']) as NeonDashboardLeafConfig;
                const dash2 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash2']) as NeonDashboardLeafConfig;

                expect(dash2).toBeTruthy();
                expect(dash2.options.connectOnLoad).toBeFalsy();
                expect(dash2.filters).toBeTruthy();
                expect(dash2.filters).toEqual(query);

                expect(dash1.options.connectOnLoad).toBeFalsy();
                expect(dash2.filters).toBeTruthy();
                expect(dash2.filters).toEqual(query);
                done();
            });
    });

    it('setActiveByURL loads the appropriate config (without filters) with no path', (done) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        configService.load = loadConfig;

        configService.setActiveByURL('http://website.com/ctx/configName', '/ctx')
            .subscribe((config) => {
                expect(config.fileName).toEqual('configName');
                expect(config).toBeTruthy();

                const dash1 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash1']) as NeonDashboardLeafConfig;
                const dash2 = ConfigUtil.findDashboardByKey(config.dashboards, ['dashSet', 'dash2']) as NeonDashboardLeafConfig;

                expect(dash2).toBeTruthy();
                expect(dash2.options.connectOnLoad).toBeFalsy();
                // Original filters should be preserved
                expect(dash2.filters).toEqual('SAVED_FILTERS');

                expect(dash1.options.connectOnLoad).toBeFalsy();
                expect(dash1.filters).toEqual([]);
                done();
            });
    });
});
