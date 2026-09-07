import { requestToggleGroupValue, runToggleClick } from '../behavior/toggle-group';
import { runTabsNavigation } from '../behavior/tabs';
import { requirePart, type HookDefinition } from './hook-types';
interface State {
  group: HTMLElement; values: string[]; highlighted: number; dead: boolean;
  onClick: (event: MouseEvent) => void; onKey: (event: KeyboardEvent) => void; onFocus: (event: FocusEvent) => void;
}
interface Methods { buttons(): HTMLButtonElement[]; sync(): void; }
export const PortedToggleGroup: HookDefinition<State, Methods, {}, {toggle_change: {values: string[]}}> = {
  mounted() {
    this.group = requirePart(this.el, '[role=group]', HTMLElement);
    this.values = ['grid']; this.highlighted = 0; this.dead = false;
    this.onClick = event => {
      const target = event.target instanceof Element ? event.target.closest('button') : null;
      if (!(target instanceof HTMLButtonElement) || target.disabled || !this.group.contains(target)) return;
      const value = target.dataset.value!;
      runToggleClick(event, {value, pressed: this.values.includes(value)}, {
        requestGroupValue: (next, pressed, details) => requestToggleGroupValue(next, pressed, details,
          {multiple: this.el.dataset.multiple === 'true', values: this.values}, {
            assignValues: values => { this.values = values; this.sync(); this.pushEvent('toggle_change', {values}); },
          }),
        assignPressed: () => this.sync(),
      });
    };
    this.onKey = event => {
      const buttons = this.buttons();
      // This fixture uses only native disabled buttons. Source Composite's undefined disabledIndices
      // and Tabs' [] policy therefore have the same scan result; no aria-disabled-only items here.
      runTabsNavigation(event, {elements: buttons, highlightedIndex: this.highlighted}, {
        highlight: index => { this.highlighted = index; this.sync(); },
        queueFocus: index => queueMicrotask(() => { if (!this.dead) buttons[index]?.focus(); }),
      });
    };
    this.onFocus = event => {
      const index = this.buttons().indexOf(event.target as HTMLButtonElement);
      if (index >= 0) { this.highlighted = index; this.sync(); }
    };
    this.group.addEventListener('click', this.onClick); this.group.addEventListener('keydown', this.onKey);
    this.group.addEventListener('focusin', this.onFocus);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  buttons() { return Array.from(this.group.querySelectorAll<HTMLButtonElement>('button')); },
  sync() {
    this.buttons().forEach((button, index) => {
      button.setAttribute('aria-pressed', String(this.values.includes(button.dataset.value!)));
      button.tabIndex = index === this.highlighted ? 0 : -1;
    });
  },
  updated() { this.sync(); },
  destroyed() {
    this.dead = true; this.group.removeEventListener('click', this.onClick);
    this.group.removeEventListener('keydown', this.onKey); this.group.removeEventListener('focusin', this.onFocus);
  },
};
