/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { NeonGTDComponent } from './neon-gtd.component';
import { DatasetService } from './services/dataset.service';

describe('App: NeonGTDComponent', () => {
  beforeEach(() => {
    addProviders([DatasetService, NeonGTDComponent]);
  });

  it('should create the app',
    inject([NeonGTDComponent], (app: NeonGTDComponent) => {
      expect(app).toBeTruthy();
    }));

  it('should have no dataset select at start',
    inject([NeonGTDComponent], (app: NeonGTDComponent) => {
      expect(app.selectedDataset).toEqual('Select a Dataset');
    }));
});
