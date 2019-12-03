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
import { of } from 'rxjs';

import { AboutNeonComponent } from './about-neon.component';
import { ConfigService } from '../../services/config.service';
import { InjectableConnectionService } from '../../services/injectable.connection.service';
import { NeonConfig } from '../../models/types';

import { getConfigService } from '../../../testUtils/initializeTestBed';

describe('Component: AboutNeonComponent', () => {
    let component: AboutNeonComponent;
    let configService: ConfigService;
    let connectionService: InjectableConnectionService;

    beforeAll(() => {
        /* eslint-disable-next-line no-console */
        console.log('STARTING ABOUT COMPONENT TESTS...');
    });

    beforeEach(() => {
        configService = getConfigService(NeonConfig.get());
        connectionService = new InjectableConnectionService();
        component = new AboutNeonComponent(configService, connectionService);
    });

    it('does have expected properties', () => {
        expect(component.dashBuildDate).toEqual('a few seconds ago');
        expect(component.dashGitCommit).toEqual('HEAD');
        expect(component.serverBuildDate).toEqual('?');
        expect(component.serverGitCommit).toEqual('?');
    });

    it('ngOnInit does set element innerHTML with data from config if "about" property is string', () => {
        let divElement = document.createElement('div');
        spyOn(component, 'getCustomAboutTextDivElement').and.returnValue(divElement);

        spyOn(configService, 'getActive').and.returnValue(of(NeonConfig.get({ about: '<p>Test HTML</p>' })));

        spyOn(connectionService, 'getServerStatus');

        component.ngOnInit();

        expect(divElement.innerHTML).toEqual('<p>Test HTML</p>');
    });

    it('ngOnInit does update expected properties with data from config if "about" property is object', () => {
        let divElement = document.createElement('div');
        spyOn(component, 'getCustomAboutTextDivElement').and.returnValue(divElement);

        spyOn(configService, 'getActive').and.returnValue(of(NeonConfig.get({ about: {
            info: {
                data: 'testInfoData',
                header: 'testInfoHeader',
                icon: 'testInfoIcon',
                leader: 'testInfoLeader',
                link: 'testInfoLink',
                property: 'ignoreInfoProperty'
            },
            memberList: {
                data: ['testMember1', 'testMember2'],
                header: 'testMemberHeader',
                property: 'ignoreMemberProperty'
            },
            misc: [{
                data: 'testMiscData1',
                header: 'testMiscHeader1',
                property: 'ignoreMiscProperty1'
            }, {
                data: 'testMiscData2',
                header: 'testMiscHeader2',
                property: 'ignoreMiscProperty2'
            }]
        } })));

        spyOn(connectionService, 'getServerStatus');

        component.ngOnInit();

        expect(component.info).toEqual({
            data: 'testInfoData',
            header: 'testInfoHeader',
            icon: 'testInfoIcon',
            leader: 'testInfoLeader',
            link: 'testInfoLink'
        });
        expect(component.memberList).toEqual({
            data: ['testMember1', 'testMember2'],
            header: 'testMemberHeader'
        });
        expect(component.misc).toEqual([{
            data: 'testMiscData1',
            header: 'testMiscHeader1'
        }, {
            data: 'testMiscData2',
            header: 'testMiscHeader2'
        }]);
        expect(divElement.innerHTML).toEqual('');
    });

    it('ngOnInit does update expected properties from getServerStatus response', () => {
        let divElement = document.createElement('div');
        spyOn(component, 'getCustomAboutTextDivElement').and.returnValue(divElement);

        spyOn(configService, 'getActive').and.returnValue(of(NeonConfig.get()));

        spyOn(connectionService, 'getServerStatus').and.callFake((onSuccess, __onFailure) => {
            onSuccess({
                'Build Date': 'testBuildDate',
                'Git Commit': 'testGitCommit'
            });
        });

        component.ngOnInit();

        expect(component.serverBuildDate).toEqual('testBuildDate');
        expect(component.serverGitCommit).toEqual('testGitCommit');
    });
});
