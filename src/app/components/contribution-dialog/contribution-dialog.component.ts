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
    selector: 'app-contribution-dialog',
    templateUrl: './contribution-dialog.component.html',
    styleUrls: ['./contribution-dialog.component.scss']
})
export class ContributionDialogComponent {//implements OnInit, OnDestroy {

    // TODO: 305: replace test data here with config references
    public data = [
        {
            orgName: 'Some Organization',
            abbrev: 'SO',
            piTeamLead: 'PI/Team Lead Name',
            contactInfo: 'Contact Information',
            website: '<a href="">Company Website</a>',
            logo: 'verdi-favicon'
        },
        {
            orgName: 'Some Organization',
            abbrev: 'SO',
            piTeamLead: 'PI/Team Lead Name',
            contactInfo: 'Contact Information',
            website: '<a href="">Company Website</a>',
            logo: 'verdi-favicon'
        }
    ];

    //@Inject(MAT_DIALOG_DATA) data: any,
    constructor(public dialogRef: MatDialogRef<ContributionDialogComponent>) {}

    //ngOnInit() {
        // Do nothing.
    //}

   // ngOnDestroy() {
        // Do nothing.
   // }
}
