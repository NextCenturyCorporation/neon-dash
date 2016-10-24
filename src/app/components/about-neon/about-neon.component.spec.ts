/* tslint:disable:no-unused-variable */

import { Injector, ReflectiveInjector } from '@angular/core';
import { TestBed, getTestBed, async, inject } from '@angular/core/testing';
import { Http, HttpModule, BaseRequestOptions, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Observable } from 'rxjs/Observable';

import { MaterialModule, MdCard, MdCardTitle, MdCardSubtitle, MdCardContent } from '@angular/material';

import { ConnectionService } from '../../services/connection.service';
import { AboutNeonComponent } from './about-neon.component';
import { NeonGTDConfig } from '../../neon-gtd-config';

describe('Component: AboutNeonComponent', () => {

    var http: Http;
    var injector:  Injector;
    let testConfig: NeonGTDConfig = new NeonGTDConfig();

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ HttpModule, MaterialModule],
            declarations: [
                AboutNeonComponent,
                MdCard,
                MdCardContent,
                MdCardTitle,
                MdCardSubtitle
            ],
            providers: [
                ConnectionService,
                { provide: XHRBackend, useClass: MockBackend },
                { provide: NeonGTDConfig, useClass: testConfig }
            ]
        });
     });

    it('should create the AboutNeonComponent', async(() => {
        let fixture = TestBed.createComponent(AboutNeonComponent);
        let component = fixture.debugElement.componentInstance;
        expect(component).toBeTruthy();
    }));

  // beforeEach(() => {
  //   TestBed.configureTestingModule({
  //     declarations: [
  //       AboutNeonComponent,
  //       MdCard,
  //       MdCardContent,
  //       MdCardTitle,
  //       MdCardSubtitle
  //     ],
  //     providers: [MockBackend, Http]
  //   });
  // });

  // it('should create the AboutNeonComponent', async(() => {
  //   let fixture = TestBed.createComponent(AboutNeonComponent);
  //   let component = fixture.debugElement.componentInstance;
  //   expect(component).toBeTruthy();
  // }));
});
