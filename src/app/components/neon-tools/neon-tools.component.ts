import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';
import { NeonConfig } from '../../models/types';
import { RouteWithStateComponent } from '../../route-with-state.component';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-neon-tools',
  templateUrl: './neon-tools.component.html',
  styleUrls: ['./neon-tools.component.css']
})
export class NeonToolsComponent implements OnInit {

  contributors: any[];

  constructor(private configService: ConfigService) {  }

  ngOnInit() {
    this.configService.getActive().subscribe((neonConfig: NeonConfig) => {
      if (typeof neonConfig.neonTools === 'object') {
        this.contributors = neonConfig.neonTools.contributors;
      }
    });
  }

}
