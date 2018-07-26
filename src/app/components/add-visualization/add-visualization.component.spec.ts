/*
 * Copyright 2017 Next Century Corporation
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
 *
 */
import { TestBed, inject } from '@angular/core/testing';
import { MatDialogRef, MatGridListModule, MatSnackBar } from '@angular/material';
import { AddVisualizationComponent } from './add-visualization.component';
import { ActiveGridService } from '../../services/active-grid.service';
import { ThemesService } from '../../services/themes.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: AddVisualization', () => {

    initializeTestBed({
        imports: [
            BrowserAnimationsModule,
            MatGridListModule,
            AppMaterialModule
        ],
        declarations: [
            AddVisualizationComponent
        ],
        providers: [
            ActiveGridService,
            ThemesService
        ]
    });

    it('should create an instance', inject([ActiveGridService, ThemesService],
        (activeGridService: ActiveGridService, themesService: ThemesService, matDialogRef: MatDialogRef<AddVisualizationComponent>,
         mdSnackBar: MatSnackBar) => {
        let component = new AddVisualizationComponent(activeGridService, themesService, matDialogRef, mdSnackBar);
        expect(component).toBeTruthy();
    }));
});
