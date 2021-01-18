/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeonToolsComponent } from './neon-tools.component';
import { ConfigService } from '../../services/config.service';
import { of } from 'rxjs';

describe('Component: NeonToolsComponent', () => {
    let component: NeonToolsComponent;
    let fixture: ComponentFixture<NeonToolsComponent>;

    let configData = {
        neonTools: {
            contributors: [{
                name: 'CMU',
                img: {
                    height: 10,
                    width: 10,
                    src: 'cmu.png'
                },
                contact: {
                    firstName: 'cmuFirstName',
                    lastName: 'cmuLastName',
                    phone: '911',
                    email: 'test@cmu.edu'
                }
            }, {
                name: 'MIT',
                img: {
                    height: 10,
                    width: 10,
                    src: 'mit.png'
                },
                contact: {
                    firstName: 'mitFirstName',
                    lastName: 'mitLastName',
                    phone: '411',
                    email: 'test@mit.edu'
                }
            }]
        }
    };

    /* eslint-disable-next-line jasmine/no-unsafe-spy */
    let mockConfigService = jasmine.createSpyObj('configService', ['getActive']);
    mockConfigService.getActive.and.returnValue(of(configData));

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NeonToolsComponent],
            providers: [{ provide: ConfigService, useValue: mockConfigService }]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NeonToolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should use configService to get neon tools config data', () => {
        expect(mockConfigService.getActive).toHaveBeenCalledWith();
        expect(component.contributors).toEqual(configData.neonTools.contributors);
    });
});
