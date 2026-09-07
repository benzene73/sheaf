import {getNumberStep, incrementNumberValue, requestNumberValue,
  type NumberFieldState, type NumberChangeDetails} from '../behavior/number-field';
import {runNumberInputChange, runNumberInputBlur} from '../behavior/number-input';
import {formatNumber} from '../behavior/number-format';
import {parseNumber} from '../behavior/number-parse';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  input: HTMLInputElement; hidden: HTMLInputElement; increase: HTMLButtonElement; decrease: HTMLButtonElement;
  value: number | null; text: string; options: NumberFieldState; allowInputSync: boolean;
  pendingCommit: boolean; lastChanged: number | null; dirty: boolean;
  onInput: (event: Event) => void; onBlur: (event: FocusEvent) => void;
  onKey: (event: KeyboardEvent) => void; onIncrease: (event: MouseEvent) => void;
  onDecrease: (event: MouseEvent) => void;
}
interface Methods {
  state(): NumberFieldState;
  request(value: number | null, details: NumberChangeDetails): boolean;
  step(direction: 1 | -1, event: KeyboardEvent | MouseEvent): void;
  sync(): void;
}

/** Browser-owned draft/canonical numeric state with LiveView change/commit
 * notifications. Source parsing, validation and blur/step policies are retained.
 * Field validation integration, pointer scrubbing and wheel stepping are omitted. */
export const PortedNumberField: HookDefinition<State, Methods, {}, {
  number_change: {component_id: string; value: number | null};
  number_commit: {component_id: string; value: number | null};
}> = {
  mounted() {
    this.input = requirePart(this.el, '[data-part=input]', HTMLInputElement);
    this.hidden = requirePart(this.el, '[data-part=hidden]', HTMLInputElement);
    this.increase = requirePart(this.el, '[data-part=increase]', HTMLButtonElement);
    this.decrease = requirePart(this.el, '[data-part=decrease]', HTMLButtonElement);
    const number = (key: string) => this.el.dataset[key] == null || this.el.dataset[key] === '' ? undefined : Number(this.el.dataset[key]);
    this.value = number('value') ?? null;
    this.options = {value: this.value, initialValue: this.value,
      min: number('min'), max: number('max'), step: this.el.dataset.step === 'any' ? 'any' : number('step'),
      locale: this.el.dataset.locale || undefined,
      format: this.el.dataset.format ? JSON.parse(this.el.dataset.format) : undefined};
    this.text = formatNumber(this.value, this.options.locale, this.options.format);
    this.allowInputSync = true; this.pendingCommit = false; this.lastChanged = this.value; this.dirty = false;
    this.onInput = event => {
      if (this.input.disabled || this.input.readOnly) return;
      runNumberInputChange(this.input.value, event, this.state(), {
        setAllowInputSync: value => { this.allowInputSync = value; },
        setInputValue: text => { this.text = text; },
        requestValue: (value, details) => this.request(value, details),
      });
      this.sync(); // Restore the controlled draft if an invalid character was rejected.
    };
    this.onBlur = event => {
      runNumberInputBlur(this.text, event, {...this.state(), disabled: this.input.disabled,
        readOnly: this.input.readOnly, validationOnBlur: false}, {
        setTouched: () => {}, setFocused: () => {},
        getAllowInputSync: () => this.allowInputSync,
        setAllowInputSync: value => { this.allowInputSync = value; },
        getPendingCommit: () => this.pendingCommit,
        requestValue: (value, details) => this.request(value, details),
        getLastChangedValue: () => this.lastChanged,
        setBlockRevalidation: () => {}, validateCommit: () => {},
        onValueCommitted: value => {
          this.pendingCommit = false;
          this.pushEvent('number_commit', {component_id: this.el.id, value});
        },
        setInputValue: text => { this.text = text; },
      });
      this.sync();
    };
    this.onKey = event => {
      if (this.input.disabled || this.input.readOnly) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault(); event.stopPropagation(); this.step(event.key === 'ArrowUp' ? 1 : -1, event);
      }
    };
    this.onIncrease = event => this.step(1, event);
    this.onDecrease = event => this.step(-1, event);
    this.input.addEventListener('input', this.onInput);
    this.input.addEventListener('blur', this.onBlur);
    this.input.addEventListener('keydown', this.onKey);
    this.increase.addEventListener('click', this.onIncrease);
    this.decrease.addEventListener('click', this.onDecrease);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  state() { return {...this.options, value: this.value}; },
  request(value, details) {
    return requestNumberValue(value, details, this.state(), {
      getAllowInputSync: () => this.allowInputSync,
      onValueChange: next => this.pushEvent('number_change', {component_id: this.el.id, value: next}),
      assignValue: next => { this.value = next; },
      setDirty: dirty => { this.dirty = dirty; },
      markPendingCommit: () => { this.pendingCommit = true; },
      setLastChangedValue: next => { this.lastChanged = next; },
      setInputValue: text => { this.text = text; },
      forceRender: () => this.sync(),
    });
  },
  step(direction, event) {
    if (this.input.disabled || this.input.readOnly) return;
    const currentValue = this.allowInputSync ? this.value : parseNumber(this.text, this.options.locale, this.options.format);
    if (this.allowInputSync) this.lastChanged = this.value;
    this.allowInputSync = true;
    const changed = incrementNumberValue(getNumberStep(this.state(), event), {direction, currentValue,
      storedValue: this.value, event, reason: event.type === 'keydown' ? 'keyboard' : 'button-press'},
      (value, details) => this.request(value, details));
    if (changed) {
      this.pendingCommit = false;
      this.pushEvent('number_commit', {component_id: this.el.id, value: this.lastChanged});
    }
  },
  sync() {
    this.input.value = this.text;
    this.hidden.value = this.value === null ? '' : String(this.value);
    this.increase.disabled = this.input.disabled || this.input.readOnly || (this.value !== null && this.value >= (this.options.max ?? Infinity));
    this.decrease.disabled = this.input.disabled || this.input.readOnly || (this.value !== null && this.value <= (this.options.min ?? -Infinity));
  },
  updated() { this.sync(); },
  destroyed() {
    this.input.removeEventListener('input', this.onInput);
    this.input.removeEventListener('blur', this.onBlur);
    this.input.removeEventListener('keydown', this.onKey);
    this.increase.removeEventListener('click', this.onIncrease);
    this.decrease.removeEventListener('click', this.onDecrease);
  },
};
