import {getOpeningListIndex, navigateList, isListIndexDisabled} from '../behavior/list-navigation';

// LiveView adapter around the mapped navigation unit. This is not yet a port of
// ComboboxRoot's complete state machine; see docs/known-divergences.
export const PortedCombobox = {
  mounted() {
    this.input = this.el.querySelector('[data-part=input]');
    this.list = this.el.querySelector('[data-part=list]');
    this.open = false;
    this.active = null;
    this.onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      const rows = this.rows();
      if (event.key === 'Escape' && this.open) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      } else if (event.key === 'Enter' && this.open) {
        event.preventDefault();
        const row = rows.find((item: HTMLElement) => item.id === this.active);
        if (row) this.select(row);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const wasOpen = this.open;
        this.open = true;
        this.sync(); // Visibility must be established before upstream's scan.
        const index = wasOpen
          ? navigateList({list: rows, currentIndex: rows.findIndex((item: HTMLElement) => item.id === this.active),
              key: event.key, loopFocus: this.el.dataset.loop !== 'false', allowEscape: true,
              typeable: true, disabledIndices: []})
          : getOpeningListIndex(rows, event.key);
        this.active = index == null ? this.active : rows[index]?.id ?? null;
        this.sync();
      }
    };
    this.onPointerDown = (event: PointerEvent) => {
      if ((event.target as Element).closest('[role=option]')) event.preventDefault();
    };
    this.onClick = (event: MouseEvent) => {
      const row = (event.target as Element).closest('[role=option]');
      if (row && this.list.contains(row)) this.select(row);
    };
    this.input.addEventListener('keydown', this.onKey);
    this.list.addEventListener('pointerdown', this.onPointerDown);
    this.list.addEventListener('click', this.onClick);
    this.sync();
    this.el.dataset.fixtureReady = 'true';
  },
  rows() { return Array.from(this.list.querySelectorAll('[role=option]')); },
  close() { this.open = false; this.active = null; this.sync(); },
  select(row: HTMLElement) {
    const rows = this.rows();
    if (isListIndexDisabled(rows, rows.indexOf(row))) return;
    this.pushEvent('select', {value: row.dataset.value});
    this.close();
  },
  sync() {
    this.list.hidden = !this.open;
    this.input.setAttribute('aria-expanded', String(this.open));
    const row = this.open && this.rows().find((item: HTMLElement) => item.id === this.active);
    if (row) this.input.setAttribute('aria-activedescendant', row.id);
    else this.input.removeAttribute('aria-activedescendant');
  },
  updated() { this.sync(); },
  destroyed() {
    this.input.removeEventListener('keydown', this.onKey);
    this.list.removeEventListener('pointerdown', this.onPointerDown);
    this.list.removeEventListener('click', this.onClick);
  },
};
