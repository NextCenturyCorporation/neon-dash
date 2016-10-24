/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { AboutNeonComponent } from './about-neon.component';

describe('Component: AboutNeonComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AboutNeonComponent
      ],
    });
  });

  it('should create the AboutNeonComponent', async(() => {
    let fixture = TestBed.createComponent(AboutNeonComponent);
    let component = fixture.debugElement.componentInstance;
    expect(component).toBeTruthy();
  }));
});
