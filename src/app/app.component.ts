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
import { Component, OnInit, HostBinding } from '@angular/core';
import { ConfigService } from './services/config.service';
import { NeonConfig } from './model/types';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public config: NeonConfig;

    @HostBinding('class.loading')
    loading = true;

    constructor(private service: ConfigService) {
    }

    ngOnInit() {
        this.service.getActive().subscribe((config) => {
            this.loading = false;
            this.config = config;
        });
    }
}
