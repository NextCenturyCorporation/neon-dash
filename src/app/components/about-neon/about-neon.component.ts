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
import { map, catchError } from 'rxjs/operators';
import {throwError as observableThrowError,  Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { util } from 'neon-framework';

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

    constructor(private http: HttpClient) { }

    private handleError(error: any) {
        return observableThrowError(error);
    }

    private loadNeonGTDVersionFile(): Observable<any> {
       return this.http.get(AboutNeonComponent.NEON_GTD_VERSION_FILE)
            .pipe(catchError(this.handleError));
    }

    private loadNeonInfo() {
        util.infoUtils.getNeonVersion((result) => {
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
