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

import { neonEvents } from '../neon-namespaces';

import * as neon from 'neon-framework';

@Injectable()
export class ErrorNotificationService {
    private messenger: neon.eventing.Messenger;

    constructor() {
        this.messenger = new neon.eventing.Messenger();
        this.messenger.subscribe(neonEvents.DASHBOARD_ERROR, this.showErrorMessage.bind(this));
    }

    showErrorMessage(eventMessage: { error: Error | ExceptionInformation, message: string }) {
        // TODO THOR-916
        console.error('An error occured: ' + eventMessage.message + '\n' + eventMessage.error);
    }
}
