import {PortedCombobox} from './ported-combobox';
import {NativeMenu} from './native-menu';
import {NativeSelect} from './native-select';
import {NativePositionedPopover} from './native-positioned-popover';
import {PortedDialog} from './ported-dialog';
import {PortedNumberField} from './ported-number-field';
import {PortedTabs} from './ported-tabs';
import {PortedAccordion} from './ported-accordion';
import {PortedTooltip} from './ported-tooltip';
import {PortedToggleGroup} from './ported-toggle-group';

export {PortedCombobox, NativeMenu, NativeSelect, NativePositionedPopover, PortedDialog, PortedNumberField, PortedTabs, PortedAccordion, PortedTooltip, PortedToggleGroup};

/** Register with LiveSocket's hooks option. Individual exports support selective use. */
export const hooks: {
  PortedCombobox: typeof PortedCombobox;
  NativeMenu: typeof NativeMenu;
  NativeSelect: typeof NativeSelect;
  NativePositionedPopover: typeof NativePositionedPopover;
  PortedDialog: typeof PortedDialog;
  PortedNumberField: typeof PortedNumberField;
  PortedTabs: typeof PortedTabs;
  PortedAccordion: typeof PortedAccordion;
  PortedTooltip: typeof PortedTooltip;
  PortedToggleGroup: typeof PortedToggleGroup;
} = {PortedCombobox, NativeMenu, NativeSelect, NativePositionedPopover, PortedDialog, PortedNumberField, PortedTabs, PortedAccordion, PortedTooltip, PortedToggleGroup};
