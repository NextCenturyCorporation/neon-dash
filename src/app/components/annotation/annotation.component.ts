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
import { Component, Inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NeonConfig } from '../../models/types';
import { FormGroup, FormBuilder } from '@angular/forms';
import { BoundsFilterDesign } from 'nucleus/dist/core/models/filters';


@Component({
    selector: 'app-annotation',
    templateUrl: 'annotation.component.html',
    styleUrls: ['annotation.component.scss']
})

export class AnnotationComponent {
    public confirmDialogRef: any;
    public confirmMessage: string = '';
    public target: string;
    public title: string = 'Update';
    public confirmText: string = 'Update Label';
    public cancelText: string = 'Cancel';
    public _defaultLabel: string;
    public _labels: any[];
    private selectedLabel: string;
    labels: FormGroup;


    public onChangeName() {
        this.dialogRef.close({data:this.selectedLabel});
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<AnnotationComponent>, private configService: ConfigService, private fb: FormBuilder
    ) {
        this.target = data.target;
        this.title = data.title || this.title;
        this.confirmText = data.confirmText || this.confirmText;
        this.cancelText = data.cancelText || this.cancelText;
        this._defaultLabel = data.defaultLabel;
        //console.log(data.defaultLabel);
        this.selectedLabel = this._defaultLabel;
        // this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
        //     this._labels = neonConfig.dataLabels.sort(function (a, b) {
        //         if (a > b) {
        //             return 1;
        //         }
        //         if (b > a) {
        //             return -1;
        //         }
        //         return 0;
        //     });
        // });
        this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
            this._labels = neonConfig.dataLabels;
        });

        // this.labels = this.fb.group({
        //     defaultLabel: this._defaultLabel
        // });
    }

}
