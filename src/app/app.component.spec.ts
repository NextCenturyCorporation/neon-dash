/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';

import { MdIcon, MdList, MdSidenav, MdToolbar, MdToolbarRow } from '@angular/material';

describe('App: NeonGtd', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        AboutNeonComponent,
        DashboardOptionsComponent,
        DatasetSelectorComponent,
        MdIcon
        MdList,
        MdSidenav,
        MdToolbar,
        MdToolbarRow
      ],
    });
  });

  it('should create the app', async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'NeonGtd'`, async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('NeonGtd');
  }));

  it('should include a sidenav layout as the main interface', async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('md-sidenav-layout').class).toContain('neon-gtd-sidenav');
  }));
});
