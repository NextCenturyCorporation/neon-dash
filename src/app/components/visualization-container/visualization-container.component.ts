import { Component, Input, OnInit } from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGridItem } from '../../neon-grid-item';

import * as _ from 'lodash';

@Component({
  selector: 'visualization-container',
  templateUrl: 'visualization-container.component.html',
  styleUrls: ['visualization-container.component.scss']
})
export class VisualizationContainerComponent implements OnInit {

    private expanded: boolean = false;
    private showToolbar = false;
    private previousGridConfig;

    @Input() visualization: NeonGridItem;

    constructor(private activeGridService: ActiveGridService) { }

    ngOnInit() {

    }

    close() {
        this.activeGridService.closeItem(this.visualization.id);
    }

    contract() {
        this.saveGridConfig();
        this.expanded = false;
    }

    expand() {
        this.saveGridConfig();
        this.expanded = true;
    }

    moveToTop() {
        this.activeGridService.moveItemToTop(this.visualization);
    }

    moveToBottom() {
        this.activeGridService.moveItemToBottom(this.visualization);
    }

    saveGridConfig() {
        this.previousGridConfig = _.clone(this.visualization.gridConfig);
    }

}
