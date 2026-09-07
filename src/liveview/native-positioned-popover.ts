import {startAnchorPositioning} from '../behavior/anchor-positioning';

import {type HookDefinition, requirePart} from './hook-types';

interface PositionedPopoverState {
  anchor: HTMLElement;
  floating: HTMLElement;
  positioning?: ReturnType<typeof startAnchorPositioning> | null;
  onToggle: (event: Event) => void;
}

// Native top-layer lifecycle substitutes for Base UI's portal. Only the mapped
// positioning policy is currently under differential tests.
export const NativePositionedPopover: HookDefinition<PositionedPopoverState, {}> = {
  mounted() {
    this.anchor = requirePart(this.el, '[data-part=anchor]', HTMLElement);
    this.floating = requirePart(this.el, '[data-part=positioner]', HTMLElement);
    this.onToggle = (event: Event) => {
      if (!(event instanceof ToggleEvent)) return;
      this.positioning?.destroy();
      this.positioning = null;
      if (event.newState === 'open') {
        this.positioning = startAnchorPositioning(this.anchor, this.floating, {
          positionMethod: 'fixed', side: 'bottom', align: 'center', sideOffset: 8,
          collisionPadding: 12, collisionAvoidance: {fallbackAxisSide: 'none'},
        });
      }
    };
    this.floating.addEventListener('toggle', this.onToggle);
    this.el.dataset.fixtureReady = 'true';
  },
  updated() { this.positioning?.update(); },
  destroyed() {
    this.positioning?.destroy();
    this.floating.removeEventListener('toggle', this.onToggle);
    if (this.floating.matches(':popover-open')) this.floating.hidePopover();
  },
};
