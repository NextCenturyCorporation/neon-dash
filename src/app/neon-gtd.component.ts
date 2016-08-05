import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { NgFor } from '@angular/common';

import { MdIcon, MdIconRegistry } from '@angular2-material/icon';
import { MD_BUTTON_DIRECTIVES } from '@angular2-material/button';
import { MD_CARD_DIRECTIVES } from '@angular2-material/card';
import { MD_CHECKBOX_DIRECTIVES } from '@angular2-material/checkbox';
import { MD_ICON_DIRECTIVES } from '@angular2-material/icon';
import { MD_INPUT_DIRECTIVES } from '@angular2-material/input';
import { MD_MENU_DIRECTIVES } from '@angular2-material/menu';
import { MD_PROGRESS_CIRCLE_DIRECTIVES } from '@angular2-material/progress-circle';
import { MD_RADIO_DIRECTIVES } from '@angular2-material/radio';
import { MD_SIDENAV_DIRECTIVES } from '@angular2-material/sidenav';
import { MD_TABS_DIRECTIVES } from '@angular2-material/tabs';
import { MD_TOOLBAR_DIRECTIVES } from '@angular2-material/toolbar';

import { NeonGTDConfig } from './neon-gtd-config';
import { Dataset } from './dataset';
import { DatasetService } from './services/dataset.service';

@Component({
    moduleId: module.id,
    selector: 'app-root',
    templateUrl: 'neon-gtd.component.html',
    styleUrls: ['neon-gtd.component.css'],
    providers: [DatasetService, MdIconRegistry],
    directives: [
        NgFor,
        MdIcon,
        MD_BUTTON_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_CHECKBOX_DIRECTIVES,
        MD_ICON_DIRECTIVES,
        MD_INPUT_DIRECTIVES,
        MD_MENU_DIRECTIVES,
        MD_PROGRESS_CIRCLE_DIRECTIVES,
        MD_RADIO_DIRECTIVES,
        MD_SIDENAV_DIRECTIVES,
        MD_TABS_DIRECTIVES,
        MD_TOOLBAR_DIRECTIVES
]})

export class NeonGTDComponent implements OnInit {
    selectedDataset: string = 'Select a Dataset';

    datasets: Dataset[] = [];

    getDatasets() {
        this.datasets = this.datasetService.getDatasets();
    }

    constructor(private datasetService: DatasetService) {}

    ngOnInit() {
        this.getDatasets();
    }
}
