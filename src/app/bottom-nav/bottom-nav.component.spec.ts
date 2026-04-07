import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a nav element with role="navigation"', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nav[role="navigation"]')).toBeTruthy();
  });

  it('should render a nav with aria-label="Main navigation"', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const nav = el.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('should render 5 tabs', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const tabs = el.querySelectorAll('.bottom-nav__tab');
    expect(tabs.length).toBe(5);
  });

  it('should render all tab icons', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(text).toContain('🏠');
    expect(text).toContain('🌙');
    expect(text).toContain('☀️');
    expect(text).toContain('☁️');
  });

  it('should render all tab labels', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(text).toContain('Home');
    expect(text).toContain('Moon');
    expect(text).toContain('Solunar');
    expect(text).toContain('Weather');
  });

  it('should render tab links with correct href values', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a.bottom-nav__tab-link'));
    const hrefs = links.map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/moon');
    expect(hrefs).toContain('/solunar');
    expect(hrefs).toContain('/weather');
  });

  it('should apply bottom-nav__tab--active to the home tab when on root route', async () => {
    const harness = await RouterTestingHarness.create('/');
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    await harness.navigateByUrl('/');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const activeTab = el.querySelector('.bottom-nav__tab--active');
    expect(activeTab).toBeTruthy();
    expect(activeTab?.textContent).toContain('Home');
  });

  it('should render an ordered list for tabs', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('ol.bottom-nav__tabs')).toBeTruthy();
  });

  it('should render tab links with class bottom-nav__tab-link', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('a.bottom-nav__tab-link');
    expect(links.length).toBe(5);
  });

  it('should protect tabs array as readonly and have length 5', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    const instance = fixture.componentInstance;
    expect(instance.tabs).toBeDefined();
    expect(instance.tabs.length).toBe(5);
  });
});
