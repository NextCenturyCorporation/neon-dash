var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { NgModule } from '@angular/core';
import { MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatGridListModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatRippleModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatTabsModule, MatToolbarModule, MatTooltipModule } from '@angular/material';
var MD_MODULES = [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule
];
var AppMaterialModule = /** @class */ (function () {
    /**
     * This class just imports/exports all the material components we need
     */
    /* tslint:disable:no-unnecessary-class */
    function AppMaterialModule() {
    }
    AppMaterialModule = __decorate([
        NgModule({
            declarations: [],
            imports: MD_MODULES,
            exports: MD_MODULES,
            providers: [],
            entryComponents: [],
            bootstrap: []
        })
        /**
         * This class just imports/exports all the material components we need
         */
        /* tslint:disable:no-unnecessary-class */
    ], AppMaterialModule);
    return AppMaterialModule;
}());
export { AppMaterialModule };
//# sourceMappingURL=app.material.module.js.map