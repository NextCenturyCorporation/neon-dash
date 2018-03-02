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
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
var ThemesService = /** @class */ (function () {
    function ThemesService() {
        this.currentTheme = ThemesService_1.THEMES[0];
        // Do nothing.
    }
    ThemesService_1 = ThemesService;
    ThemesService.prototype.getThemes = function () {
        return ThemesService_1.THEMES;
    };
    ThemesService.prototype.getCurrentTheme = function () {
        return this.currentTheme;
    };
    ThemesService.prototype.setCurrentTheme = function (theme) {
        var index = _.findIndex(ThemesService_1.THEMES, function (item) {
            return item.id === theme;
        });
        if (index >= 0) {
            this.currentTheme = ThemesService_1.THEMES[index];
        }
        else {
            throw Error(theme + ' is not an available theme');
        }
    };
    ThemesService.THEMES = [{
            id: 'neon-green-theme',
            name: 'Neon Green'
        }, {
            id: 'neon-green-dark-theme',
            name: 'Neon Green (dark)'
        }];
    ThemesService = ThemesService_1 = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], ThemesService);
    return ThemesService;
    var ThemesService_1;
}());
export { ThemesService };
//# sourceMappingURL=themes.service.js.map