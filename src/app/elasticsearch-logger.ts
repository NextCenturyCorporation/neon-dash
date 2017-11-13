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
import { HttpClient } from '@angular/common/http';

export class LogMessage {
    componentName: string;
    time: Date;
    logMessage: string;
}

export class ElasticsearchLogger {
    private url: string;

    constructor(private http: HttpClient) {
        this.url = 'http://localhost:9200/logindex/messages';
    }

    public doLog(component: string, message: string): void {
        /* tslint:disable:no-console */
        let  fullMsg = new LogMessage();
        fullMsg.componentName = component;
        fullMsg.time = new Date();
        fullMsg.logMessage = message;
        console.log(message);
        const req =  this.http.post(this.url, JSON.stringify(fullMsg)).subscribe(
            (res) => {
                console.log(res);
            },
            (err) => {
                console.log('Error occured!! ');
            });
        /* tslint:enable:no-console */
    }
}
