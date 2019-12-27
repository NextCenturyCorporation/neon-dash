import { Component, OnInit } from '@angular/core';
import { RouteWithStateComponent } from './route-with-state.component';
import { ConfigService } from './services/config.service';
import { DashboardService } from './services/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-route-neontools',
  templateUrl: './route-neontools.component.html',
  styleUrls: ['./route-neontools.component.css']
})
export class RouteNeontoolsComponent extends RouteWithStateComponent {

  constructor(
    configService: ConfigService,
    dashboardService: DashboardService,
    router: Router
  ) 
  {
      super(configService, dashboardService, router);
  }
}
