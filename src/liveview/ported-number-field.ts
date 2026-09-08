import {getNumberStep, incrementNumberValue, requestNumberValue,
  type NumberFieldState, type NumberChangeDetails} from '../behavior/number-field';
import {runNumberInputChange, runNumberInputBlur} from '../behavior/number-input';
import {formatNumber} from '../behavior/number-format';
import {parseNumber} from '../behavior/number-parse';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  input: HTMLInputElement; hidden: HTMLInputElement; increase: HTMLButtonElement; decrease: HTMLButtonElement;
  formMode: boolean; form: HTMLFormElement | null; serverValue: string; dead: boolean; onReset: (event: Event) => void;
  value: number | null; text: string; options: NumberFieldState; allowInputSync: boolean;
  pendingCommit: boolean; lastChanged: number | null; dirty: boolean;
  onInput: (event: Event) => void; onChange: (event: Event) => void; onBlur: (event: FocusEvent) => void;
  onKey: (event: KeyboardEvent) => void; onIncrease: (event: MouseEvent) => void;
  onDecrease: (event: MouseEvent) => void;
}
interface Methods {
  state(): NumberFieldState;
  readOptions(initialValue: number | null): NumberFieldState;
  request(value: number | null, details: NumberChangeDetails): boolean;
  step(direction: 1 | -1, event: KeyboardEvent | MouseEvent): void;
  sync(): void;
  commit(value: number | null): void;
  restore(value: string): void;
}

/** Browser-owned numeric draft with native form events or legacy observer
 * notifications; form mode reconciles changed server values. Source parsing, validation and blur/step policies are retained.
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
    this.value = this.el.dataset.value == null || this.el.dataset.value === '' ? null : Number(this.el.dataset.value);
    this.formMode = this.el.dataset.mode === 'form'; this.form = this.hidden.form;
    this.serverValue = this.el.dataset.value ?? ''; this.dead = false;
    this.onReset = event => queueMicrotask(() => {
      if (!event.defaultPrevented && !this.dead && this.formMode) this.restore(this.serverValue);
    });
    this.form?.addEventListener('reset', this.onReset);
    this.options = this.readOptions(this.value);
    this.text = formatNumber(this.value, this.options.locale, this.options.format);
    this.allowInputSync = true; this.pendingCommit = false; this.lastChanged = this.value; this.dirty = false;
    this.onInput = event => {
      if (this.formMode) event.stopPropagation();
      if (this.input.disabled || this.input.readOnly) return;
      runNumberInputChange(this.input.value, event, this.state(), {
        setAllowInputSync: value => { this.allowInputSync = value; },
        setInputValue: text => { this.text = text; },
        requestValue: (value, details) => this.request(value, details),
      });
      this.sync(); // Restore the controlled draft if an invalid character was rejected.
    };
    this.onChange = event => { if (this.formMode) event.stopPropagation(); };
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
          this.commit(value);
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
    this.input.addEventListener('change', this.onChange);
    this.input.addEventListener('blur', this.onBlur);
    this.input.addEventListener('keydown', this.onKey);
    this.increase.addEventListener('click', this.onIncrease);
    this.decrease.addEventListener('click', this.onDecrease);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  readOptions(initialValue) {
    const number = (key: string) => this.el.dataset[key] == null || this.el.dataset[key] === ''
      ? undefined : Number(this.el.dataset[key]);
    return {value: this.value, initialValue,
      min: number('min'), max: number('max'), step: this.el.dataset.step === 'any' ? 'any' : number('step'),
      locale: this.el.dataset.locale || undefined,
      format: this.el.dataset.format ? JSON.parse(this.el.dataset.format) : undefined};
  },
  state() { return {...this.options, value: this.value}; },
  request(value, details) {
    const previous = this.value;
    const changed = requestNumberValue(value, details, this.state(), {
      getAllowInputSync: () => this.allowInputSync,
      onValueChange: next => { if (!this.formMode) this.pushEvent('number_change', {component_id: this.el.id, value: next}); },
      assignValue: next => { this.value = next; },
      setDirty: dirty => { this.dirty = dirty; },
      markPendingCommit: () => { this.pendingCommit = true; },
      setLastChangedValue: next => { this.lastChanged = next; },
      setInputValue: text => { this.text = text; },
      forceRender: () => this.sync(),
    });
    if (this.formMode && this.value !== previous) this.hidden.dispatchEvent(new Event('input', {bubbles: true}));
    return changed;
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
      this.commit(this.lastChanged);
    }
  },
  sync() {
    this.input.value = this.text;
    this.hidden.value = this.value === null ? '' : String(this.value);
    this.increase.disabled = this.input.disabled || this.input.readOnly || (this.value !== null && this.value >= (this.options.max ?? Infinity));
    this.decrease.disabled = this.input.disabled || this.input.readOnly || (this.value !== null && this.value <= (this.options.min ?? -Infinity));
  },
  commit(value) {
    if (this.formMode) this.hidden.dispatchEvent(new Event('change', {bubbles: true}));
    else this.pushEvent('number_commit', {component_id: this.el.id, value});
  },
  restore(value) {
    const parsed = value.trim() === '' ? null : Number(value);
    this.value = parsed !== null && !Number.isFinite(parsed) ? null : parsed;
    this.text = formatNumber(this.value, this.options.locale, this.options.format);
    this.allowInputSync = true; this.pendingCommit = false; this.lastChanged = this.value;
    this.dirty = false; this.sync();
  },
  updated() {
    const previousOptions = this.options;
    this.options = this.readOptions(previousOptions.initialValue);
    const formatChanged = previousOptions.locale !== this.options.locale ||
      JSON.stringify(previousOptions.format) !== JSON.stringify(this.options.format);
    // Reformat settled numeric text, but keep an in-progress draft intact.
    if (formatChanged && this.allowInputSync) this.text = formatNumber(this.value, this.options.locale, this.options.format);
    const serverValue = this.el.dataset.value ?? '';
    if (this.formMode && serverValue !== this.serverValue) {
      const parsed = serverValue.trim() === '' ? null : Number(serverValue);
      // An acknowledgement of our current numeric value must not erase a draft.
      if (parsed !== this.value) this.restore(serverValue);
    }
    this.serverValue = serverValue; this.sync();
  },
  destroyed() {
    this.dead = true; this.form?.removeEventListener('reset', this.onReset);
    this.input.removeEventListener('input', this.onInput);
    this.input.removeEventListener('change', this.onChange);
    this.input.removeEventListener('blur', this.onBlur);
    this.input.removeEventListener('keydown', this.onKey);
    this.increase.removeEventListener('click', this.onIncrease);
    this.decrease.removeEventListener('click', this.onDecrease);
  },
};
