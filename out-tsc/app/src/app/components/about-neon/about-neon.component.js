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
import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as neon from 'neon-framework';
var AboutNeonComponent = /** @class */ (function () {
    function AboutNeonComponent(http) {
        this.http = http;
        this.serverVersionString = 'Unavailable...';
        this.neonGTDVersionString = 'Unavailable...';
        this.serverInfoLoaded = false;
        this.neonGTDVersionLoaded = false;
    }
    AboutNeonComponent_1 = AboutNeonComponent;
    AboutNeonComponent.prototype.handleError = function (error) {
        return Observable.throw(error);
    };
    AboutNeonComponent.prototype.loadNeonGTDVersionFile = function () {
        return this.http.get(AboutNeonComponent_1.NEON_GTD_VERSION_FILE)
            .map(function (resp) { return resp.json(); })
            .catch(this.handleError);
    };
    AboutNeonComponent.prototype.loadNeonInfo = function () {
        var me = this;
        neon.util.infoUtils.getNeonVersion(function (result) {
            me.serverVersionString = result;
            me.serverInfoLoaded = false;
        });
    };
    AboutNeonComponent.prototype.ngOnInit = function () {
        var me = this;
        if (!this.neonGTDVersionLoaded) {
            this.loadNeonGTDVersionFile().subscribe(function (versionInfo) {
                me.neonGTDVersionString = versionInfo.version;
                me.neonGTDVersionLoaded = true;
            });
        }
        if (!this.serverInfoLoaded) {
            this.loadNeonInfo();
        }
    };
    AboutNeonComponent.NEON_GTD_VERSION_FILE = './app/config/version.json';
    AboutNeonComponent = AboutNeonComponent_1 = __decorate([
        Component({
            selector: 'app-about-neon',
            templateUrl: 'about-neon.component.html',
            styleUrls: ['about-neon.component.scss']
        }),
        __metadata("design:paramtypes", [Http])
    ], AboutNeonComponent);
    return AboutNeonComponent;
    var AboutNeonComponent_1;
}());
export { AboutNeonComponent };
//# sourceMappingURL=about-neon.component.js.map