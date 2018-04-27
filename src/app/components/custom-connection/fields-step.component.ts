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
import { Component } from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { neonCustomConnectionMappings } from '../../neon-namespaces';

import { CustomConnectionStep } from './custom-connection-step';
import { TableMetaData, DatabaseMetaData } from '../../dataset';

@Component({
    selector: 'app-custom-connection-fields-step',
    templateUrl: 'fields-step.component.html',
    styleUrls: ['custom-connection.component.scss']
})
export class CustomConnectionFieldsStepComponent extends CustomConnectionStep {
    private mappings: { name: string, prettyName: string }[] = neonCustomConnectionMappings;
    private databaseAndTableShowStatus: Map<string, boolean> = new Map<string, boolean>();

    constructor() {
        super();
        this.selected = false;
        this.stepNumber = 3;
        this.title = 'Set Fields Default Use';
    }

    public isStepValid(): boolean {
        return true;
    }

    public onComplete(): void {
        return this ? null : null;
    }

    getFieldMappingDisplay(customDatabase: DatabaseMetaData, customTable: TableMetaData): boolean {
        let dbAndTableKey: string = customDatabase.name + '-' + customTable.name;
        if (this.databaseAndTableShowStatus.get(dbAndTableKey) === undefined) {
            return false;
        } else {
            return this.databaseAndTableShowStatus.get(dbAndTableKey);
        }
    }

    toggleFieldMappingDisplay(customDatabase: DatabaseMetaData, customTable: TableMetaData): void {
        let dbAndTableKey: string = customDatabase.name + '-' + customTable.name;
        if (this.databaseAndTableShowStatus.get(dbAndTableKey) === undefined) {
            this.databaseAndTableShowStatus.set(dbAndTableKey, true);
        } else {
            this.databaseAndTableShowStatus.set(dbAndTableKey, !this.databaseAndTableShowStatus.get(dbAndTableKey));
        }
    }

    onMappingSet(event: any) {
        this.isStepValid();
    }
}
