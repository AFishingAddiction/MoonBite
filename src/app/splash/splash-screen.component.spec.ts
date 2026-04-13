import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SplashScreenComponent } from './splash-screen.component';
import { Component, signal } from '@angular/core';

/** Host component so we can control the `visible` input. */
@Component({
  template: `<app-splash-screen [visible]="visible()" />`,
  standalone: true,
  imports: [SplashScreenComponent],
})
class TestHostComponent {
  readonly visible = signal(true);
}

describe('SplashScreenComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  function el(): HTMLElement {
    return hostFixture.nativeElement as HTMLElement;
  }

  // ── Visibility ──────────────────────────────────────────────────────────────

  it('should render the splash overlay when visible=true', () => {
    expect(el().querySelector('.splash')).toBeTruthy();
  });

  it('should remove splash from DOM after hide animation completes', fakeAsync(() => {
    host.visible.set(false);
    hostFixture.detectChanges();
    // Animation duration is 400ms; wait for it to complete
    tick(500);
    hostFixture.detectChanges();
    expect(el().querySelector('.splash')).toBeNull();
  }));

  it('should apply splash--hiding class immediately when visible becomes false', fakeAsync(() => {
    host.visible.set(false);
    hostFixture.detectChanges();
    tick(0);
    hostFixture.detectChanges();
    const splash = el().querySelector('.splash');
    expect(splash?.classList.contains('splash--hiding')).toBeTrue();
  }));

  // ── Branding content ────────────────────────────────────────────────────────

  it('should display the MoonBite brand name', () => {
    const brand = el().querySelector('.splash__brand');
    expect(brand?.textContent?.trim()).toBe('MoonBite');
  });

  it('should display the tagline', () => {
    const tagline = el().querySelector('.splash__tagline');
    expect(tagline?.textContent).toContain('fishing intelligence');
  });

  it('should display the logo icon element', () => {
    expect(el().querySelector('.splash__logo-icon')).toBeTruthy();
  });

  it('should display the loading indicator', () => {
    expect(el().querySelector('.splash__loader')).toBeTruthy();
  });

  // ── Accessibility ───────────────────────────────────────────────────────────

  it('should have role="status" on the splash element', () => {
    const splash = el().querySelector('.splash');
    expect(splash?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live="polite" on the splash element', () => {
    const splash = el().querySelector('.splash');
    expect(splash?.getAttribute('aria-live')).toBe('polite');
  });

  it('should have an aria-label containing "Loading MoonBite"', () => {
    const splash = el().querySelector('.splash');
    expect(splash?.getAttribute('aria-label')).toBe('Loading MoonBite');
  });

  it('should have aria-hidden on the logo icon', () => {
    const icon = el().querySelector('.splash__logo-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have aria-hidden on the loader dots', () => {
    const loader = el().querySelector('.splash__loader');
    expect(loader?.getAttribute('aria-hidden')).toBe('true');
  });

  // ── Re-show guard ───────────────────────────────────────────────────────────

  it('should remain gone if visible toggles back true after being gone', fakeAsync(() => {
    host.visible.set(false);
    hostFixture.detectChanges();
    tick(500);
    hostFixture.detectChanges();
    // Once gone, toggling back should not re-show (one-way door)
    host.visible.set(true);
    hostFixture.detectChanges();
    expect(el().querySelector('.splash')).toBeNull();
  }));
});
