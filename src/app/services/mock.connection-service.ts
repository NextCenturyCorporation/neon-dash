/**
 * Copyright 2021 CACI (formerly Next Century Corporation)
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
import { InjectableConnectionService } from './injectable.connection.service';

export class ConnectionServiceMock extends InjectableConnectionService {
    public connect(__datastoreType: string, __datastoreHost: string) {
        return null as any;
    }

    public getServerStatus(__onSuccess: (response: any) => void, __onError?: (response: any) => void): XMLHttpRequest {
        return null;
    }

    public listenOnDataUpdate(__onUpdate: (response: any) => void, __reset: boolean = false) {
        // Do nothing.
    }

    public setDataServerHost(__dataServerHost: string): void {
        // Do nothing.
    }
}

