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
import { Component } from '@angular/core';
var SnackBarComponent = /** @class */ (function () {
    function SnackBarComponent() {
        this.messages = [];
    }
    SnackBarComponent.prototype.addErrors = function (messageType, newMessages) {
        // This method smells weird to me, but this is the implementation i came up with
        var msgObj = {
            type: messageType,
            display: newMessages
        };
        for (var _i = 0, _a = this.messages; _i < _a.length; _i++) {
            var e = _a[_i];
            if (e.type === messageType) {
                for (var _b = 0, newMessages_1 = newMessages; _b < newMessages_1.length; _b++) {
                    var msg = newMessages_1[_b];
                    e.display.push(msg);
                }
                return;
            }
        }
        this.messages.push(msgObj);
    };
    SnackBarComponent.prototype.close = function (index) {
        if (index < 0 || !this.messages || index >= this.messages.length) {
            // TODO ERROR in the error reporting!
            return;
        }
        this.messages.splice(index, 1);
        if (this.messages.length === 0) {
            this.closeAll();
        }
    };
    SnackBarComponent.prototype.closeAll = function () {
        var _this = this;
        if (this.snackBarRef && this.snackBarRef.dismiss) {
            this.snackBarRef.afterDismissed().subscribe(function () {
                _this.messages = [];
            });
            this.snackBarRef.dismiss();
        }
    };
    SnackBarComponent = __decorate([
        Component({
            selector: 'app-snack-bar',
            templateUrl: 'snack-bar.component.html',
            styleUrls: ['snack-bar.component.scss']
        })
    ], SnackBarComponent);
    return SnackBarComponent;
}());
export { SnackBarComponent };
//# sourceMappingURL=snack-bar.component.js.map