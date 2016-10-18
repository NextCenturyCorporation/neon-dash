import { Component, Input, OnInit } from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGridItem } from '../../neon-grid-item';

@Component({
  selector: 'app-visualization-container',
  templateUrl: 'visualization-container.component.html',
  styleUrls: ['visualization-container.component.scss']
})
export class VisualizationContainerComponent implements OnInit {

    private expanded: boolean;
    private showToolbar: boolean;

    @Input() visualization: NeonGridItem;

    constructor(private activeGridService: ActiveGridService) {
        this.expanded = false;
        this.showToolbar = false;
    }

    ngOnInit() {

    }

    close() {
        this.activeGridService.closeItem(this.visualization.id);
    }

    contract() {
        this.expanded = false;
        this.activeGridService.contractItem(this.visualization);
    }

    expand() {
        this.expanded = true;
        this.activeGridService.expandItem(this.visualization);
    }

    moveToTop() {
        this.activeGridService.moveItemToTop(this.visualization);
    }

    moveToBottom() {
        this.activeGridService.moveItemToBottom(this.visualization);
    }
}
