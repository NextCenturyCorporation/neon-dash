/* tslint:disable:no-unused-variable */
import { ComponentFixture, async, inject, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

import { FormsModule } from '@angular/forms';
import { URLSearchParams } from '@angular/http';
import { NgModule, ViewContainerRef } from '@angular/core';

import { DashboardOptionsComponent } from './dashboard-options.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';

import { MaterialModule } from '@angular/material';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';
import { NeonGTDConfig } from '../../neon-gtd-config';

describe('Component: DashboardOptionsComponent', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let fixture: ComponentFixture<DashboardOptionsComponent>;
    let de: DebugElement;
    let el: HTMLElement;
    let component: DashboardOptionsComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DashboardOptionsComponent
            ],
            imports: [
                FormsModule,
                MaterialModule,
                MaterialModule.forRoot(),
            ],
            providers: [
                ConnectionService,
                DatasetService,
                ErrorNotificationService,
                ExportService,
                MdSnackBar,
                ParameterService,
                ThemesService,
                ViewContainerRef,
                { provide: 'config', useValue: testConfig }
            ]
        });

        fixture = TestBed.createComponent(DashboardOptionsComponent);
        component = fixture.componentInstance;
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });
});
