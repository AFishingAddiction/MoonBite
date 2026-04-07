import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => expect(component).toBeTruthy());

  it('should default to Imperial unit system', () => {
    expect(component.unitSystem()).toBe('imperial');
  });

  it('should default to 12h time format', () => {
    expect(component.timeFormat()).toBe('12h');
  });

  it('should switch to Imperial when setUnitSystem is called', () => {
    component.setUnitSystem('imperial');
    expect(component.unitSystem()).toBe('imperial');
  });

  it('should switch to 24h when setTimeFormat is called', () => {
    component.setTimeFormat('24h');
    expect(component.timeFormat()).toBe('24h');
  });

  it('should start rename mode for a location', () => {
    const fakeLoc = { id: 'abc', name: 'Test Spot', latitude: 0, longitude: 0, createdAt: '' };
    component.startRename(fakeLoc as any);
    expect(component.editingId()).toBe('abc');
    expect(component.editingName()).toBe('Test Spot');
  });

  it('should cancel rename and clear edit state', () => {
    const fakeLoc = { id: 'abc', name: 'Test Spot', latitude: 0, longitude: 0, createdAt: '' };
    component.startRename(fakeLoc as any);
    component.cancelRename();
    expect(component.editingId()).toBeNull();
    expect(component.editingName()).toBe('');
  });

  it('should confirm rename with valid id and name, then clear state', () => {
    const fakeLoc = { id: 'test-id', name: 'Old Name', latitude: 0, longitude: 0, createdAt: '' };
    component.startRename(fakeLoc as any);
    component.editingName.set('New Name');
    component.confirmRename();
    expect(component.editingId()).toBeNull();
    expect(component.editingName()).toBe('');
  });

  it('should clear state when confirmRename called with empty name', () => {
    const fakeLoc = { id: 'test-id', name: 'Old Name', latitude: 0, longitude: 0, createdAt: '' };
    component.startRename(fakeLoc as any);
    component.editingName.set('');
    component.confirmRename();
    expect(component.editingId()).toBeNull();
  });

  it('should not throw when confirmRename called without starting edit', () => {
    expect(() => component.confirmRename()).not.toThrow();
    expect(component.editingId()).toBeNull();
  });
});
