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
import { Component, OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { map, catchError } from 'rxjs/operators';

import * as neon from 'neon-framework';

@Component({
    selector: 'app-about-neon',
    templateUrl: 'about-neon.component.html',
    styleUrls: ['about-neon.component.scss']
})
export class AboutNeonComponent implements OnInit {

    static NEON_GTD_VERSION_FILE: string = './app/config/version.json';

    public serverVersionString: string = 'Unavailable...';
    public neonGTDVersionString: string = 'Unavailable...';
    private serverInfoLoaded: boolean = false;
    private neonGTDVersionLoaded: boolean = false;

    constructor(private http: Http) { }

    private handleError(error: any) {
        return Observable.throw(error);
    }

    private loadNeonGTDVersionFile(): Observable<any> {
       return this.http.get(AboutNeonComponent.NEON_GTD_VERSION_FILE)
           .map((resp: Response) => resp.json())
           .catch(this.handleError);
    }

    private loadNeonInfo() {
        neon.util.infoUtils.getNeonVersion((result) => {
            this.serverVersionString = result;
            this.serverInfoLoaded = false;
        });
    }

    ngOnInit() {
        if (!this.neonGTDVersionLoaded) {
            this.loadNeonGTDVersionFile().subscribe((versionInfo: VersionInfo) => {
                this.neonGTDVersionString = versionInfo.version;
                this.neonGTDVersionLoaded = true;
            });
        }

        if (!this.serverInfoLoaded) {
            this.loadNeonInfo();
        }
    }
}

interface VersionInfo {
    name: string;
    version: string;
}
