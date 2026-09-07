import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Combobox } from '@base-ui/react/combobox';
import { Popover } from '@base-ui/react/popover';
import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';

const items = ['Apple', 'Banana', 'Cherry'];
function Fixture() {
  const params = new URLSearchParams(location.search);
  const fixtureItems = params.get('items') === 'locale' ? ['Café', 'Tea', 'Apple', 'Banana', 'Cherry'] : items;
  const [accepted, setAccepted] = React.useState<string | null>(params.get('defaultValue'));
  const [submits, setSubmits] = React.useState(0);
  const [valueChanges, setValueChanges] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('');
  const loopFocus = params.get('loop') !== 'false';
  return <main data-fixture-ready="true">
    <h1>Pinned Base UI React reference</h1>
    <form onSubmit={event => { event.preventDefault(); setSubmits(count => count + 1); setSubmitted(String(new FormData(event.currentTarget).get('fruit') || '')); }}>
    <Combobox.Root name="fruit" items={fixtureItems} value={accepted} loopFocus={loopFocus}
      onInputValueChange={(_value, details) => { if (params.get('cancelInput') === 'true') details.cancel(); }}
      readOnly={params.get('readOnly') === 'true'}
      onValueChange={(value, details) => {
        setValueChanges(count => count + 1);
        if (params.get('cancelValue') === 'true') details.cancel();
        else setAccepted(value);
      }}
      onOpenChange={(open, details) => { if (!open && params.get('cancelClose') === 'true') details.cancel(); }}>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: string) => <Combobox.Item key={item} value={item} disabled={item === 'Banana'}>{item}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
    <button type="submit">Submit</button>
    </form>
    <output data-testid="accepted-value">{accepted || ''}</output>
    <output data-testid="submit-count">{submits}</output>
    <output data-testid="value-change-count">{valueChanges}</output>
    <output data-testid="last-submitted-value">{submitted}</output>
    <button type="button">Outside</button>
  </main>;
}
function PositioningFixture() {
  const params = new URLSearchParams(location.search);
  const behavior = params.get('behavior') === 'true';
  const [actions, setActions] = React.useState(0);
  const [outsideClicks, setOutsideClicks] = React.useState(0);
  const size = params.get('size') || 'tall';
  const width = size === 'wide' ? 1000 : 200;
  const height = size === 'tall' ? 1000 : 100;
  return <main data-fixture-ready="true">
    <Popover.Root modal={params.get('modal') === 'true'}>
      <Popover.Trigger data-testid="anchor" style={{ position: 'fixed', bottom: 8, left: 16, width: 100, height: 40 }}>Open popup</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={8} collisionPadding={12}
          collisionAvoidance={{ fallbackAxisSide: 'none' }}>
          <Popover.Popup data-testid="popup" style={{ boxSizing: 'border-box', width, height, maxWidth: 'var(--available-width)', maxHeight: 'var(--available-height)', background: '#ddd', overflow: 'auto' }}>
            {behavior ? <><button onClick={() => setActions(n => n + 1)}>Inside</button><button>Last</button></> : 'Popup content'}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
    {behavior && <><output data-testid="popover-action-count">{actions}</output><output data-testid="outside-click-count">{outsideClicks}</output><button style={{ position: 'fixed', right: 20, top: 20 }} onClick={() => setOutsideClicks(n => n + 1)}>Outside</button></>}
  </main>;
}
function MenuFixture() {
  const [action, setAction] = React.useState('');
  const [outsideClicks, setOutsideClicks] = React.useState(0);
  const params = new URLSearchParams(location.search);
  const keepOpen = params.get('keepOpen') === 'true';
  return <main data-fixture-ready="true">
    <Menu.Root modal={params.get('modal') !== 'false'}>
      <Menu.Trigger>Open menu</Menu.Trigger>
      <Menu.Portal><Menu.Positioner><Menu.Popup>
        {['Alpha', 'Beta', 'Bravo', 'Charlie'].map(label => <Menu.Item key={label} disabled={label === 'Beta'} closeOnClick={!keepOpen} onClick={() => setAction(label)}>{label}</Menu.Item>)}
      </Menu.Popup></Menu.Positioner></Menu.Portal>
    </Menu.Root>
    <output data-testid="menu-action">{action}</output>
    <output data-testid="outside-click-count">{outsideClicks}</output>
    <button type="button" onClick={() => setOutsideClicks(count => count + 1)} style={{ position: 'fixed', right: 20, top: 20 }}>Outside</button>
  </main>;
}
const fixture = new URLSearchParams(location.search).get('fixture');
function SelectFixture() {
  const params = new URLSearchParams(location.search);
  const [value, setValue] = React.useState<string | null>(params.get('defaultValue'));
  const [changes, setChanges] = React.useState(0);
  const [submits, setSubmits] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('');
  const [outsideClicks, setOutsideClicks] = React.useState(0);
  return <main data-fixture-ready="true">
    <form onSubmit={event => { event.preventDefault(); setSubmits(n => n + 1); setSubmitted(String(new FormData(event.currentTarget).get('fruit') || '')); }}>
    <Select.Root name="fruit" modal={params.get('modal') !== 'false'} value={value} onValueChange={(next, details) => { setChanges(n => n + 1); if (params.get('cancelValue') === 'true') details.cancel(); else setValue(next); }}>
      <Select.Trigger aria-label="Choose fruit"><Select.Value placeholder="Choose" /></Select.Trigger>
      <Select.Portal><Select.Positioner alignItemWithTrigger={false}><Select.Popup>
        {['Alpha', 'Beta', 'Bravo', 'Charlie'].map(label => <Select.Item key={label} value={label} disabled={label === 'Beta'}><Select.ItemText>{label}</Select.ItemText></Select.Item>)}
      </Select.Popup></Select.Positioner></Select.Portal>
    </Select.Root>
    <button type="submit">Submit</button><button type="reset">Reset</button>
    </form>
    <output data-testid="select-value">{value || ''}</output>
    <output data-testid="select-change-count">{changes}</output>
    <output data-testid="select-submit-count">{submits}</output>
    <output data-testid="select-submitted-value">{submitted}</output>
    <output data-testid="outside-click-count">{outsideClicks}</output>
    <button type="button" onClick={() => setOutsideClicks(n => n + 1)} style={{ position: 'fixed', right: 20, top: 20 }}>Outside</button>
  </main>;
}
createRoot(document.getElementById('root')!).render(fixture === 'popover' ? <PositioningFixture /> : fixture === 'menu' ? <MenuFixture /> : fixture === 'select' ? <SelectFixture /> : <Fixture />);
