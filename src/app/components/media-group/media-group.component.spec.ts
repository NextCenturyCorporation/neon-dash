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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaGroupComponent } from './media-group.component';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { Injector } from '@angular/core';
import { MediaGroupModule } from './media-group.module';
import { DomSanitizer } from '@angular/platform-browser';

describe('Component: MediaGroup', () => {
    let component: MediaGroupComponent;
    let fixture: ComponentFixture<MediaGroupComponent>;

    initializeTestBed('Media Group', {
        providers: [
            DashboardService,
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            {
                provide: DomSanitizer,
                useValue: {
                    sanitize: () => 'safeString',
                    bypassSecurityTrustHtml: () => 'safeString'
                }
            },
            Injector

        ],
        imports: [
            MediaGroupModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaGroupComponent);
        component = fixture.componentInstance;
        component.tabsAndMedia = [];
        fixture.detectChanges();
    });

    // It('exists', () => {
    //     component.tabsAndMedia = [];
    //     expect(component).toBeTruthy();
    // });

    // it('does show tabs if tabsAndMedia is not empty', () => {
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: 'testLinkValue1',
    //             name: 'testNameValue1',
    //             type: ''
    //         },
    //         list: [{
    //             border: '',
    //             link: 'testLinkValue1',
    //             name: 'testNameValue1',
    //             type: ''
    //         }]
    //     }, {
    //         loaded: false,
    //         name: 'testTabName2',
    //         selected: {
    //             border: '',
    //             link: 'testLinkValue2',
    //             name: 'testNameValue2',
    //             type: ''
    //         },
    //         list: [{
    //             border: '',
    //             link: 'testLinkValue2',
    //             name: 'testNameValue2',
    //             type: ''
    //         }]
    //     }];
    //     expect(component.tabsAndMedia.length).toBe(2);

    //     let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab'));
    //     expect(tabs.length).toBe(2);
    //     expect(tabs[0].nativeElement.textContent).toBe('testTabName1');
    //     expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
    //     expect(tabs[1].nativeElement.textContent).toBe('testTabName2');
    //     expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

    //     let slider = fixture.debugElement.queryAll(By.css('app-media-group mat-slider'));
    //     expect(slider.length).toBe(0);
    // });

    // it('does show single image tag according to the image type', () => {
    //     let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName',
    //         selected: {
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         },
    //         list: [{
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         }]
    //     }];

    //     let media = fixture.debugElement.queryAll(By.css("tab-medium"));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<img');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
    // });

    // it('does show multiple image tags in tabs according to the image type', () => {
    //     let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         },
    //         list: [{
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         }]
    //     }, {
    //         loaded: false,
    //         name: 'testTabName2',
    //         selected: {
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         },
    //         list: [{
    //             border: '',
    //             link: imgSrc,
    //             name: 'testName',
    //             type: 'img'
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab'));
    //     expect(tabs.length).toBe(2);
    //     let media = fixture.debugElement.queryAll(By.css("tab-medium"));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<img');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
    // });

    // it('does show single audio tag according to the audio type', () => {
    //     let audSrc = './assets/audio/test-audio.wav';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName',
    //         selected: {
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         },
    //         list: [{
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let media = fixture.debugElement.queryAll(By.css("tab-medium"));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<audio');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + audSrc + '"');
    // });

    // it('does show multiple audio tags in tabs according to the audio type', () => {
    //     let audSrc = './assets/audio/test-audio.wav';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         },
    //         list: [{
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         }]
    //     }, {
    //         loaded: false,
    //         name: 'testTabName2',
    //         selected: {
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         },
    //         list: [{
    //             border: '',
    //             link: audSrc,
    //             name: 'testName',
    //             type: 'aud'
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab-label'));
    //     expect(tabs.length).toBe(2);
    //     let media = fixture.debugElement.queryAll(By.css('mat-tab-group mat-tab-body > div > div'));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<audio');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + audSrc + '"');
    // });

    // it('does show single iframe tag according to the empty type', () => {
    //     let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName',
    //         selected: {
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         },
    //         list: [{
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let media = fixture.debugElement.queryAll(By.css("tab-medium"));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<iframe');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
    // });

    // it('does show multiple iframe tags in tabs according to the empty type', () => {
    //     let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         },
    //         list: [{
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         }]
    //     }, {
    //         loaded: false,
    //         name: 'testTabName2',
    //         selected: {
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         },
    //         list: [{
    //             border: '',
    //             link: docSrc,
    //             name: 'testName',
    //             type: ''
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab-label'));
    //     expect(tabs.length).toBe(2);
    //     let media = fixture.debugElement.queryAll(By.css('mat-tab-group mat-tab-body > div > div'));
    //     expect(media.length).toBe(1);
    //     expect(media[0].nativeElement.innerHTML).toContain('<iframe');
    //     expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
    // });

    // it('does show two tabs and slider', () => {
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: 'testLinkValue1',
    //             name: 'testNameValue1',
    //             type: 'mask'
    //         },
    //         list: [{
    //             border: '',
    //             link: 'testLinkValue1',
    //             name: 'testNameValue1',
    //             type: 'mask'
    //         }, {
    //             border: '',
    //             link: 'testLinkValue3',
    //             name: 'testNameValue3',
    //             type: 'mask'
    //         }]
    //     }, {
    //         loaded: false,
    //         name: 'testTabName2',
    //         selected: {
    //             border: '',
    //             link: 'testLinkValue2',
    //             name: 'testNameValue2',
    //             type: 'mask'
    //         },
    //         list: [{
    //             border: '',
    //             link: 'testLinkValue2',
    //             name: 'testNameValue2',
    //             type: 'mask'
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     expect(component.tabsAndMedia.length).toBe(2);

    //     let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab-label'));
    //     expect(tabs.length).toBe(2);
    //     expect(tabs[0].nativeElement.textContent).toBe('testTabName1');
    //     expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
    //     expect(tabs[1].nativeElement.textContent).toBe('testTabName2');
    //     expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

    //     let slider = fixture.debugElement.queryAll(By.css('mat-slider'));
    //     expect(slider.length).toBe(1);
    // });

    // it('does show two images and slider', () => {
    //     let baseSource = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
    //     component.tabsAndMedia = [{
    //         loaded: false,
    //         name: 'testTabName1',
    //         selected: {
    //             border: '',
    //             link: baseSource,
    //             name: 'testName',
    //             type: 'mask'
    //         },
    //         list: [{
    //             border: '',
    //             link: baseSource,
    //             name: 'testName',
    //             type: 'mask'
    //         }]
    //     }];
    //     component.changeDetection.detectChanges();

    //     let medium = fixture.debugElement.queryAll(By.css('.single-medium'));
    //     expect(medium.length).toBe(1);
    //     let images = fixture.debugElement.queryAll(By.css('.single-medium img'));
    //     expect(images.length).toBe(2);
    //     expect(images[0].nativeElement.outerHTML).toContain('src="' + baseSource + '" alt="testName"');

    //     let slider = fixture.debugElement.queryAll(By.css('mat-slider'));
    //     expect(slider.length).toBe(1);
    // });

    // it('sanitize function cleans url', (() => {
    //     component.tabsAndMedia[0].selected.link = 'https://kafka.apache.org/intro';
    //     expect(component.sanitize(component.tabsAndMedia[0].selected.link).toString()).toBe(
    //         'SafeValue must use [property]=binding: https://kafka.apache.org/intro (see http://g.co/ng/security#xss)'
    //     );
    // }));
});
