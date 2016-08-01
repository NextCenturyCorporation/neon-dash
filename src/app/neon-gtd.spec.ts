/* tslint:disable:no-unused-variable */

import { addProviders, async, inject } from '@angular/core/testing';
import { NeonGTD } from './neon-gtd.component';

describe('App: NeonGtd', () => {
  beforeEach(() => {
    addProviders([NeonGTD]);
  });

  it('should create the app',
    inject([NeonGTD], (app: NeonGTD) => {
      expect(app).toBeTruthy();
    }));

  it('should have as title \'app works!\'',
    inject([NeonGTD], (app: NeonGTD) => {
      expect(app.selectedDataset).toEqual('Select a Dataset...');
    }));
});
