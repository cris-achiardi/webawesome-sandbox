import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from '@angular/core';

type Brand = 'acme' | 'globex';

/**
 * Demonstrates how Web Awesome <wa-*> custom elements bind in Angular.
 *
 * KEY FINDING — Angular's [(ngModel)] does NOT work out-of-the-box on custom
 * elements: Angular's built-in ControlValueAccessors only match native selectors
 * (input, select, textarea…), not <wa-input>. So you'd get a "No value accessor
 * for form control" error. The reliable pattern is explicit property + event
 * binding: [value]="x" (input)="x = $event.target.value". A reusable wrapper or a
 * custom ControlValueAccessor directive would be needed for full ngModel/forms support.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  // Required so Angular allows unknown <wa-*> tags instead of erroring.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: [
    `
      .page { max-width: 720px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
      h1 { margin: 0 0 4px; }
      .muted { color: #666; font-size: 0.9rem; }
      .demo strong { display: block; margin-bottom: 4px; }
      code { background: rgba(0,0,0,0.06); padding: 0 4px; border-radius: 3px; }
      .brand-switcher { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .brand-panel {
        display: flex; flex-direction: column; gap: 8px; padding: 16px;
        border-radius: var(--radius-md, 8px); border: 1px solid rgba(0,0,0,0.1);
        background: var(--color-surface-default); font-family: var(--font-family-body);
      }
    `,
  ],
  template: `
    <main class="page">
      <header>
        <h1>Web Awesome × Angular</h1>
        <p class="muted">
          Testing <code>&lt;wa-*&gt;</code> binding in Angular with
          <code>CUSTOM_ELEMENTS_SCHEMA</code>. Colors and fonts come from our design tokens.
        </p>

        <!-- BRAND SWITCHER — flips the wa-theme-* class on <html>, re-theming everything live -->
        <div class="brand-switcher">
          <span class="muted">Brand:</span>
          @for (b of brands; track b) {
            <wa-button
              size="small"
              [attr.variant]="b === brand ? 'brand' : 'neutral'"
              [attr.appearance]="b === brand ? 'filled' : 'outlined'"
              (click)="setBrand(b)"
            >
              {{ b }}
            </wa-button>
          }
        </div>
      </header>

      <!-- 1. EVENTS — (click) works directly -->
      <wa-card class="demo">
        <strong>1. Events</strong>
        <p class="muted">Native <code>(click)</code> binding works as-is.</p>
        <wa-button variant="brand" appearance="filled" (click)="clicks = clicks + 1">
          Clicked {{ clicks }} time(s)
        </wa-button>
      </wa-card>

      <!-- 2. TWO-WAY TEXT — explicit [value] + (input), NOT ngModel -->
      <wa-card class="demo">
        <strong>2. Two-way text</strong>
        <p class="muted">
          <code>[value]</code> + <code>(input)</code>. Note: <code>[(ngModel)]</code> would
          fail here — custom elements have no built-in value accessor.
        </p>
        <wa-input
          label="Name"
          [value]="name"
          (input)="name = $any($event.target).value"
        ></wa-input>
        <p>Hello, <strong>{{ name || '…' }}</strong>!</p>
      </wa-card>

      <!-- 3. BOOLEAN — [checked] + (change) -->
      <wa-card class="demo">
        <strong>3. Boolean toggle</strong>
        <p class="muted"><code>[checked]</code> + <code>(change)</code>.</p>
        <wa-switch
          [checked]="notifications"
          (change)="notifications = $any($event.target).checked"
        >
          Notifications: {{ notifications ? 'on' : 'off' }}
        </wa-switch>
      </wa-card>

      <!-- 4. SELECT -->
      <wa-card class="demo">
        <strong>4. Select</strong>
        <p class="muted"><code>[value]</code> + <code>(change)</code>.</p>
        <wa-select [value]="fruit" (change)="fruit = $any($event.target).value" label="Fruit">
          <wa-option value="apple">Apple</wa-option>
          <wa-option value="banana">Banana</wa-option>
          <wa-option value="cherry">Cherry</wa-option>
        </wa-select>
        <p>Picked: <strong>{{ fruit }}</strong></p>
      </wa-card>

      <!-- 5. IMPERATIVE — open dialog via ViewChild + nativeElement.open -->
      <wa-card class="demo">
        <strong>5. Imperative API (ViewChild)</strong>
        <p class="muted">Open a <code>wa-dialog</code> via <code>ElementRef.nativeElement</code>.</p>
        <wa-button (click)="openDialog()">Open dialog</wa-button>
        <wa-dialog #dialog label="Hello from Web Awesome">
          This dialog was opened imperatively from Angular.
          <wa-button slot="footer" variant="brand" (click)="closeDialog()">Close</wa-button>
        </wa-dialog>
      </wa-card>

      <!-- 6. TWO BRANDS ON ONE PAGE — each panel scopes its own wa-theme-* class -->
      <wa-card class="demo">
        <strong>6. Two brands, one page</strong>
        <p class="muted">
          Each panel applies its own <code>wa-theme-*</code> class, so components inside
          pick up that brand's color + font independently.
        </p>
        <div class="brand-grid">
          @for (b of brands; track b) {
            <div [class]="'wa-theme-' + b" class="brand-panel">
              <small class="muted">{{ b }}</small>
              <wa-input label="Name" value="Sample"></wa-input>
              <wa-button variant="brand" appearance="filled">Primary action</wa-button>
            </div>
          }
        </div>
      </wa-card>
    </main>
  `,
})
export class AppComponent {
  readonly brands: Brand[] = ['acme', 'globex'];
  brand: Brand = 'acme';

  clicks = 0;
  name = 'Ada';
  notifications = true;
  fruit = 'apple';

  /** Flip the wa-theme-* class on <html>; every <wa-*> re-themes live. */
  setBrand(brand: Brand): void {
    this.brand = brand;
    const html = document.documentElement;
    this.brands.forEach((b) => html.classList.remove(`wa-theme-${b}`));
    html.classList.add(`wa-theme-${brand}`);
  }

  @ViewChild('dialog') dialog!: ElementRef<HTMLElement & { open: boolean }>;

  openDialog(): void {
    this.dialog.nativeElement.open = true;
  }
  closeDialog(): void {
    this.dialog.nativeElement.open = false;
  }
}
