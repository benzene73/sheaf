import {activateAccordionItem, requestAccordionValue} from '../behavior/accordion';
import type {HookDefinition} from './hook-types';

interface State { value: string[]; onClick: (event: MouseEvent) => void; }
interface Methods { sync(): void; }

// Kept-mounted panels, native buttons, browser-owned open values. No animation.
export const PortedAccordion: HookDefinition<State, Methods, {},
  {accordion_change: {component_id: string; value: string[]}}> = {
  mounted() {
    this.value = JSON.parse(this.el.dataset.value || '[]');
    this.onClick = event => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-part=trigger]') : null;
      if (!button || button.closest('[data-accordion]') !== this.el || button.disabled ||
        button.getAttribute('aria-disabled') === 'true' || this.el.dataset.disabled === 'true') return;
      const item = button.dataset.value!;
      activateAccordionItem(this.value.includes(item), event, {
        requestValue: (open, details) => requestAccordionValue(this.value,
          this.el.dataset.multiple === 'true', item, open, details, {
            assignValue: value => {
              this.value = value; this.sync();
              this.pushEvent('accordion_change', {component_id: this.el.id, value});
            },
          }),
      });
    };
    this.el.addEventListener('click', this.onClick);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  sync() {
    for (const trigger of this.el.querySelectorAll<HTMLElement>('[data-part=trigger]')) {
      if (trigger.closest('[data-accordion]') !== this.el) continue;
      const open = this.value.includes(trigger.dataset.value!);
      trigger.setAttribute('aria-expanded', String(open));
      if (open) trigger.setAttribute('aria-controls', trigger.dataset.panel!);
      else trigger.removeAttribute('aria-controls');
    }
    for (const panel of this.el.querySelectorAll<HTMLElement>('[data-part=panel]')) {
      if (panel.closest('[data-accordion]') === this.el) panel.hidden = !this.value.includes(panel.dataset.value!);
    }
  },
  updated() { this.sync(); },
  destroyed() { this.el.removeEventListener('click', this.onClick); },
};
