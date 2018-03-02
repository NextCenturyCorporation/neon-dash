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
import { Injectable } from '@angular/core';
import * as neon from 'neon-framework';
var ConnectionService = /** @class */ (function () {
    function ConnectionService() {
    }
    /**
     * Creates a Neon connection to the given host with the given database type.
     * @param {String} databaseType
     * @param {String} host
     * @method createActiveConnection
     * @return {neon.query.Connection}
     */
    ConnectionService.prototype.createActiveConnection = function (databaseType, host) {
        if (!this.activeConnection || this.activeConnection.databaseType_ !== databaseType || this.activeConnection.host_ !== host) {
            this.activeConnection = new neon.query.Connection();
        }
        if (databaseType && host) {
            this.activeConnection.connect(databaseType, host);
        }
        return this.activeConnection;
    };
    /**
     * Returns the active connection.
     * @method getActiveConnection
     * @return {neon.query.Connection}
     */
    ConnectionService.prototype.getActiveConnection = function () {
        return this.activeConnection;
    };
    ConnectionService = __decorate([
        Injectable()
    ], ConnectionService);
    return ConnectionService;
}());
export { ConnectionService };
//# sourceMappingURL=connection.service.js.map