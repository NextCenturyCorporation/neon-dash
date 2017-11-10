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

@Injectable()
export class ConnectionService {

    private activeConnection: neon.query.Connection;

    /**
     * Creates a Neon connection to the given host with the given database type.
     * @param {String} databaseType
     * @param {String} host
     * @method createActiveConnection
     * @return {neon.query.Connection}
     */
    public createActiveConnection(databaseType?: string, host?: string): neon.query.Connection {
        if (!this.activeConnection || this.activeConnection.databaseType_ !== databaseType || this.activeConnection.host_ !== host) {
            this.activeConnection = new neon.query.Connection();
        }

        if (databaseType && host) {
            this.activeConnection.connect(databaseType, host);
        }

        return this.activeConnection;
    }

    /**
     * Returns the active connection.
     * @method getActiveConnection
     * @return {neon.query.Connection}
     */
    public getActiveConnection(): neon.query.Connection {
        return this.activeConnection;
    }
}
