import { requestToggleGroupValue, runToggleClick } from '../behavior/toggle-group';
import { runTabsNavigation } from '../behavior/tabs';
import { requirePart, type HookDefinition } from './hook-types';
interface State {
  group: HTMLElement; values: string[]; highlighted: number; dead: boolean;
  onClick: (event: MouseEvent) => void; onKey: (event: KeyboardEvent) => void; onFocus: (event: FocusEvent) => void;
}
interface Methods { buttons(): HTMLButtonElement[]; sync(): void; }
export const PortedToggleGroup: HookDefinition<State, Methods, {}, {toggle_change: {component_id: string; values: string[]}}> = {
  mounted() {
    this.group = requirePart(this.el, '[role=group]', HTMLElement);
    const initial: unknown = JSON.parse(this.el.dataset.value || '[]');
    if (!Array.isArray(initial) || !initial.every(value => typeof value === 'string')) {
      throw new Error('ToggleGroup data-value must be a JSON array of strings');
    }
    this.values = initial;
    const buttons = this.buttons();
    const selected = buttons.findIndex(button => !button.disabled && this.values.includes(button.dataset.value!));
    this.highlighted = selected >= 0 ? selected : buttons.findIndex(button => !button.disabled);
    this.dead = false;
    this.onClick = event => {
      const target = event.target instanceof Element ? event.target.closest('button[data-value]') : null;
      if (!(target instanceof HTMLButtonElement) || target.disabled || !this.buttons().includes(target)) return;
      const value = target.dataset.value!;
      runToggleClick(event, {value, pressed: this.values.includes(value)}, {
        requestGroupValue: (next, pressed, details) => requestToggleGroupValue(next, pressed, details,
          {multiple: this.el.dataset.multiple === 'true', values: this.values}, {
            assignValues: values => { this.values = values; this.sync(); this.pushEvent('toggle_change', {component_id: this.el.id, values}); },
          }),
        assignPressed: () => this.sync(),
      });
    };
    this.onKey = event => {
      const buttons = this.buttons();
      // This fixture uses only native disabled buttons. Source Composite's undefined disabledIndices
      // and Tabs' [] policy therefore have the same scan result; no aria-disabled-only items here.
      runTabsNavigation(event, {elements: buttons, highlightedIndex: this.highlighted,
        orientation: this.el.dataset.orientation === 'vertical' ? 'vertical' : 'horizontal',
        direction: this.el.dataset.direction === 'rtl' || (!this.el.dataset.direction && getComputedStyle(this.group).direction === 'rtl') ? 'rtl' : 'ltr',
        loopFocus: this.el.dataset.loopFocus !== 'false'}, {
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
  buttons() {
    return Array.from(this.group.querySelectorAll<HTMLButtonElement>('button[data-value]'))
      .filter(button => button.closest('[role=group]') === this.group);
  },
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
