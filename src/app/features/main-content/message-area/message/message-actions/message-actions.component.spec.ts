import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageActionsComponent } from './message-actions.component';

describe('MessageActionsComponent', () => {
  let component: MessageActionsComponent;
  let fixture: ComponentFixture<MessageActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
