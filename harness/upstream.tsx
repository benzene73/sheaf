import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Combobox } from '@base-ui/react/combobox';
import { Popover } from '@base-ui/react/popover';
import { Menu } from '@base-ui/react/menu';

const items = ['Apple', 'Banana', 'Cherry'];
function Fixture() {
  const params = new URLSearchParams(location.search);
  const [accepted, setAccepted] = React.useState<string | null>(params.get('defaultValue'));
  const [submits, setSubmits] = React.useState(0);
  const [valueChanges, setValueChanges] = React.useState(0);
  const loopFocus = params.get('loop') !== 'false';
  return <main data-fixture-ready="true">
    <h1>Pinned Base UI React reference</h1>
    <form onSubmit={event => { event.preventDefault(); setSubmits(count => count + 1); }}>
    <Combobox.Root items={items} value={accepted} loopFocus={loopFocus}
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
    <button type="button">Outside</button>
  </main>;
}
function PositioningFixture() {
  const params = new URLSearchParams(location.search);
  const size = params.get('size') || 'tall';
  const width = size === 'wide' ? 1000 : 200;
  const height = size === 'tall' ? 1000 : 100;
  return <main data-fixture-ready="true">
    <Popover.Root>
      <Popover.Trigger data-testid="anchor" style={{ position: 'fixed', bottom: 8, left: 16, width: 100, height: 40 }}>Open popup</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={8} collisionPadding={12}
          collisionAvoidance={{ fallbackAxisSide: 'none' }}>
          <Popover.Popup data-testid="popup" style={{ boxSizing: 'border-box', width, height, maxWidth: 'var(--available-width)', maxHeight: 'var(--available-height)', background: '#ddd', overflow: 'auto' }}>
            Popup content
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  </main>;
}
function MenuFixture() {
  const [action, setAction] = React.useState('');
  const keepOpen = new URLSearchParams(location.search).get('keepOpen') === 'true';
  return <main data-fixture-ready="true">
    <Menu.Root>
      <Menu.Trigger>Open menu</Menu.Trigger>
      <Menu.Portal><Menu.Positioner><Menu.Popup>
        {['Alpha', 'Beta', 'Bravo', 'Charlie'].map(label => <Menu.Item key={label} disabled={label === 'Beta'} closeOnClick={!keepOpen} onClick={() => setAction(label)}>{label}</Menu.Item>)}
      </Menu.Popup></Menu.Positioner></Menu.Portal>
    </Menu.Root>
    <output data-testid="menu-action">{action}</output>
    <button type="button">Outside</button>
  </main>;
}
const fixture = new URLSearchParams(location.search).get('fixture');
createRoot(document.getElementById('root')!).render(fixture === 'popover' ? <PositioningFixture /> : fixture === 'menu' ? <MenuFixture /> : <Fixture />);
