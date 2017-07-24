import { Component, Input, OnInit, ViewChild } from '@angular/core';

import { ActiveGridService } from '../../services/active-grid.service';
import { NeonGridItem } from '../../neon-grid-item';
import { VisualizationInjectorComponent } from '../visualization-injector/visualization-injector.component';

@Component({
  selector: 'app-visualization-container',
  templateUrl: 'visualization-container.component.html',
  styleUrls: ['visualization-container.component.scss']
})
export class VisualizationContainerComponent implements OnInit {
    @ViewChild(VisualizationInjectorComponent) injector: VisualizationInjectorComponent;

    public expanded: boolean;
    public showToolbar: boolean;

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

    onResizeStop() {
        this.injector.onResizeStop();
    }
}
