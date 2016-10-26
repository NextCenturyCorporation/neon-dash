/* tslint:disable:no-unused-variable */

import { ComponentFixture, async, inject, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';


import { HttpModule, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { MaterialModule } from '@angular/material';
import { AboutNeonComponent } from './about-neon.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

describe('Component: AboutNeonComponent', () => {

    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<AboutNeonComponent>;
    let de: DebugElement;
    let el: HTMLElement;
    let component: AboutNeonComponent;
    let neonStub: any = {
        util: {
            infoUtils: {
                getNeonVersion: function(cb) {
                    let result: any = {
                        'name':'neon-gtd',
                        'version':'test-version'
                    };
                    cb(result);
                }
            }
        }
    }

    let version = {
        'name': 'neon-gtd',
        'version': '0.0.0-test-version'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AboutNeonComponent
            ],
            imports: [
                HttpModule,
                MaterialModule,
                MaterialModule.forRoot()
            ],
            providers: [
                { provide: 'config', useValue: testConfig },
                { provide: 'neon', useValue: neonStub }
            ]
        });

        fixture = TestBed.createComponent(AboutNeonComponent);
        component = fixture.componentInstance;
    });

    it('should create the AboutNeonComponent', async(() => {
        expect(component).toBeTruthy();
    }));
});
