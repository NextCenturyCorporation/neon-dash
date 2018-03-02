var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
import { Component, Input } from '@angular/core';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { ActiveGridService } from '../../services/active-grid.service';
import { ThemesService } from '../../services/themes.service';
import { neonVisualizations } from '../../neon-namespaces';
var AddVisualizationComponent = /** @class */ (function () {
    function AddVisualizationComponent(activeGridService, themesService, dialogRef, snackBar) {
        this.activeGridService = activeGridService;
        this.themesService = themesService;
        this.dialogRef = dialogRef;
        this.snackBar = snackBar;
        this.selectedIndex = -1;
        this.themesService = themesService;
    }
    AddVisualizationComponent.prototype.ngOnInit = function () {
        this.visualizations = neonVisualizations;
    };
    AddVisualizationComponent.prototype.onItemSelected = function (shiftKey, index) {
        if (this.selectedIndex !== -1) {
            this.visualizations[this.selectedIndex].selected = false;
        }
        this.visualizations[index].selected = true;
        this.selectedIndex = index;
        this.activeGridService.addItemInFirstFit(this.visualizations[index]);
        if (!shiftKey) {
            this.dialogRef.close();
        }
        this.snackBar.openFromComponent(SimpleSnackBarComponent, {
            duration: 500,
            verticalPosition: 'top'
        });
    };
    AddVisualizationComponent = __decorate([
        Component({
            selector: 'app-add-visualization-dialog',
            templateUrl: './add-visualization.component.html',
            styleUrls: ['./add-visualization.component.scss']
        }),
        __metadata("design:paramtypes", [ActiveGridService, ThemesService,
            MatDialogRef, MatSnackBar])
    ], AddVisualizationComponent);
    return AddVisualizationComponent;
}());
export { AddVisualizationComponent };
var SimpleSnackBarComponent = /** @class */ (function () {
    function SimpleSnackBarComponent() {
        this.message = 'Visualization Added';
    }
    __decorate([
        Input(),
        __metadata("design:type", Object)
    ], SimpleSnackBarComponent.prototype, "message", void 0);
    SimpleSnackBarComponent = __decorate([
        Component({
            selector: 'app-simple-snack-bar',
            template: "\n        <div class=\"app-simple-snack-center\">{{ message }}</div>\n    ",
            styles: [':host { display: flex; justify-content: center }']
        })
    ], SimpleSnackBarComponent);
    return SimpleSnackBarComponent;
}());
export { SimpleSnackBarComponent };
//# sourceMappingURL=add-visualization.component.js.map