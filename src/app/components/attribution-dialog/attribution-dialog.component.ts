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
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';

@Component({
    selector: 'app-attribution-dialog',
    templateUrl: './attribution-dialog.component.html',
    styleUrls: ['./attribution-dialog.component.scss']
})
export class AttributionDialogComponent {//implements OnInit, OnDestroy {

    //@Inject(MAT_DIALOG_DATA) data: any,
    constructor(public dialogRef: MatDialogRef<AttributionDialogComponent>) {}

    //ngOnInit() {
        // Do nothing.
    //}

   // ngOnDestroy() {
        // Do nothing.
   // }
}
