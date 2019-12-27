import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeonToolsComponent } from './neon-tools.component';
import { ConfigService } from '../../services/config.service';
import { of } from 'rxjs';

describe('Component: NeonToolsComponent', () => {
  let component: NeonToolsComponent;
  let fixture: ComponentFixture<NeonToolsComponent>;

  let configData = 
  {
    neonTools:
    {
      programInformation:
      {
        programName: 'testProgram',
        programSponsor: 'testSponsor',
        programManager: 'testManager',
        PI: 'testPI',
        contributors: [
          {
            name: 'CMU',
            contact: {
              firstName: 'cmuFirstName',
              lastName: 'cmuLastName',
              phone: '911',
              email: 'test@cmu.edu'
            }
          },
          {
            name: 'MIT',
            contact: {
              firstName: 'mitFirstName',
              lastName: 'mitLastName',
              phone: '411',
              email: 'test@mit.edu'
            }
          }
        ]
      }
    }
  };

  let mockConfigService = jasmine.createSpyObj('configService', ['getActive']);
  mockConfigService.getActive.and.returnValue(of(configData));

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeonToolsComponent ],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeonToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should use configService to get neon tools config data', () => {
    expect(mockConfigService.getActive).toHaveBeenCalled();
    expect(component.data).toEqual(configData.neonTools);
  });
  
});
