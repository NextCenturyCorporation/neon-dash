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

    // Maps the datastore types to datastore hosts to connections.
    private connections: Map<string, Map<string, neon.query.Connection>> = new Map<string, Map<string, neon.query.Connection>>();

    /**
     * Creates and returns a Neon connection to the given host with the given datastore type (like elasticsearch or sql).
     *
     * @arg {String} datastoreType
     * @arg {String} datastoreHost
     * @return {neon.query.Connection}
     */
    public createActiveConnection(datastoreType: string, datastoreHost: string): neon.query.Connection {
        if (datastoreType && datastoreHost) {
            if (!this.connections.has(datastoreType)) {
                this.connections.set(datastoreType, new Map<string, neon.query.Connection>());
            }
            if (!this.connections.get(datastoreType).has(datastoreHost)) {
                let connection = new neon.query.Connection();
                connection.connect(datastoreType, datastoreHost);
                this.connections.get(datastoreType).set(datastoreHost, connection);
            }
            return this.connections.get(datastoreType).get(datastoreHost);
        }
        return null;
    }
}
