/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, ComponentFactoryResolver } from '@angular/core';

import { VisualizationInjectorComponent } from './visualization-injector.component';
import { TextCloudComponent } from '../text-cloud/text-cloud.component';

describe('Component: VisualizationInjector', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                VisualizationInjectorComponent,
                TextCloudComponent
            ],
            providers: [ ComponentFactoryResolver ]
        });
    });

    it('should create an instance', inject([ComponentFactoryResolver], (resolver: ComponentFactoryResolver) => {
        let component = new VisualizationInjectorComponent(resolver);
        expect(component).toBeTruthy();
    }));
});
