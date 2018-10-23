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
    // TODO: 825: incorporate obtaining activeConnection via key throughout code.
    private activeConnections: Map<string, neon.query.Connection> = new Map<string, neon.query.Connection>();
    private defaultKeyName: string = 'default';

    /**
     * Creates a Neon connection to the given host with the given database type. If no key
     * is specified, the default key will be used.
     * @param {String} databaseType
     * @param {String} host
     * @param {String} key
     * @method createActiveConnection
     * @return {neon.query.Connection}
     */
    public createActiveConnection(databaseType?: string, host?: string, key?: string): neon.query.Connection {
        let keyToUse = key ? key : this.defaultKeyName;

        if (!this.activeConnections[keyToUse] || this.activeConnections[keyToUse].databaseType_ !== databaseType
            || this.activeConnections[keyToUse].host_ !== host) {
            this.activeConnections[keyToUse] = new neon.query.Connection();
        }

        if (databaseType && host) {
            this.activeConnections[keyToUse].connect(databaseType, host);
        }
        return this.activeConnections[keyToUse];
    }

    /**
     * Returns the active connection with the specified key. If no key specified,
     * the activeConnection under the defaultKeyName will be returned.
     * @param {String} key
     * @method getActiveConnection
     * @return {neon.query.Connection}
     */
    public getActiveConnection(key?: string): neon.query.Connection {
        let keyToUse = key ? key : this.defaultKeyName;
        return this.activeConnections[keyToUse];
    }
}
