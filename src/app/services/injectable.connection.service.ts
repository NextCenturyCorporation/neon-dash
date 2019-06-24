/**
 * Copyright 2019 Next Century Corporation
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
 */
import { Injectable } from '@angular/core';
import { ConnectionService, NeonConnection } from './connection.service';

@Injectable({
    providedIn: 'root'
})
export class InjectableConnectionService {
    private _service = new ConnectionService();

    /**
     * Returns an existing connection to the REST server using the given host and the given datastore type (like elasticsearch or sql), or
     * creates and returns a Neon connection if none exists.
     */
    public connect<T extends { query: any } = { query: any }>(
        datastoreType: string,
        datastoreHost: string,
        ignoreUpdates: boolean = false
    ): NeonConnection<T> {
        return this._service.connect(datastoreType, datastoreHost, ignoreUpdates);
    }
}
