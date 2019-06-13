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
import { NeonConfig } from '../model/types';
import { ConfigService } from './config.service';

describe('Service: ConfigService', () => {
    let configService: ConfigService;

    beforeEach(() => {
        configService = ConfigService.as(NeonConfig.get());
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
        let count = 0;
        configService.setActive(NeonConfig.get({ fileName: 'test' }));

        setImmediate(() => {
            configService.getActive()
                .subscribe((config) => {
                    expect(config).toBeTruthy();
                    expect(config.fileName).toBe('test');
                    count += 1;
                });
            expect(count).toBe(1);
            done();
        });
    });
});
