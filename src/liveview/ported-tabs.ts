import {createTabActivation, runTabsNavigation, requestTabValue, computeTabDirection,
  type TabChangeDetails} from '../behavior/tabs';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  list: HTMLElement; value: string; highlighted: string; dead: boolean;
  activations: Map<HTMLElement, ReturnType<typeof createTabActivation<string>>>;
  onKey: (event: KeyboardEvent) => void; onClick: (event: MouseEvent) => void;
  onFocus: (event: FocusEvent) => void; onPointer: (event: PointerEvent) => void;
  onPointerEnd: () => void;
}
interface Methods {
  tabs(): HTMLElement[];
  tab(event: Event): HTMLElement | null;
  activation(tab: HTMLElement): ReturnType<typeof createTabActivation<string>>;
  select(value: string, details: TabChangeDetails): void;
  sync(): void;
}

export const PortedTabs: HookDefinition<State, Methods, {},
  {tabs_change: {component_id: string; value: string}}> = {
  mounted() {
    this.list = requirePart(this.el, '[role=tablist]', HTMLElement);
    this.value = this.el.dataset.value || '';
    this.highlighted = this.value; this.dead = false; this.activations = new Map();
    this.onKey = event => {
      const tabs = this.tabs();
      runTabsNavigation(event, {elements: tabs,
        highlightedIndex: tabs.findIndex(tab => tab.dataset.value === this.highlighted),
        orientation: this.list.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal',
        direction: getComputedStyle(this.list).direction === 'rtl' ? 'rtl' : 'ltr'}, {
        highlight: index => { this.highlighted = tabs[index].dataset.value!; this.sync(); },
        queueFocus: index => queueMicrotask(() => { if (!this.dead && tabs[index].isConnected) tabs[index].focus(); }),
      });
    };
    this.onClick = event => { const tab = this.tab(event); if (tab) this.activation(tab).click(event); };
    this.onFocus = event => {
      const tab = this.tab(event);
      if (tab) {
        this.highlighted = tab.dataset.value!;
        this.activation(tab).focus(event); this.sync();
      }
    };
    this.onPointer = event => { const tab = this.tab(event); if (tab) this.activation(tab).pointerDown(event); };
    this.onPointerEnd = () => { for (const activation of this.activations.values()) activation.pointerEnd(); };
    this.list.addEventListener('keydown', this.onKey);
    this.list.addEventListener('click', this.onClick);
    this.list.addEventListener('focusin', this.onFocus);
    this.list.addEventListener('pointerdown', this.onPointer);
    this.el.ownerDocument.addEventListener('pointerup', this.onPointerEnd);
    this.el.ownerDocument.addEventListener('pointercancel', this.onPointerEnd);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  tabs() { return Array.from(this.list.querySelectorAll<HTMLElement>('[role=tab]')); },
  tab(event) {
    const target = event.target instanceof Element ? event.target.closest('[role=tab]') : null;
    return target instanceof HTMLElement && this.list.contains(target) ? target : null;
  },
  activation(tab) {
    let controller = this.activations.get(tab);
    if (!controller) {
      controller = createTabActivation(() => ({value: tab.dataset.value!, active: tab.dataset.value === this.value,
        disabled: tab.getAttribute('aria-disabled') === 'true', activateOnFocus: this.el.dataset.auto === 'true'}),
        (value, details) => this.select(value, details));
      this.activations.set(tab, controller);
    }
    return controller;
  },
  select(value, details) {
    requestTabValue(value, details, {
      computeDirection: next => computeTabDirection(this.value, next,
        this.list.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal',
        item => this.tabs().find(tab => tab.dataset.value === item) || null),
      onValueChange: next => this.pushEvent('tabs_change', {component_id: this.el.id, value: next}),
      assignValue: next => { this.value = next; this.sync(); },
    });
  },
  sync() {
    for (const tab of this.tabs()) {
      tab.setAttribute('aria-selected', String(tab.dataset.value === this.value));
      tab.tabIndex = tab.dataset.value === this.highlighted ? 0 : -1;
    }
    for (const panel of this.el.querySelectorAll<HTMLElement>('[role=tabpanel]')) panel.hidden = panel.dataset.value !== this.value;
  },
  updated() {
    for (const tab of this.activations.keys()) if (!this.el.contains(tab)) this.activations.delete(tab);
    this.sync();
  },
  destroyed() {
    this.dead = true;
    this.list.removeEventListener('keydown', this.onKey);
    this.list.removeEventListener('click', this.onClick);
    this.list.removeEventListener('focusin', this.onFocus);
    this.list.removeEventListener('pointerdown', this.onPointer);
    this.el.ownerDocument.removeEventListener('pointerup', this.onPointerEnd);
    this.el.ownerDocument.removeEventListener('pointercancel', this.onPointerEnd);
    this.activations.clear();
  },
};
