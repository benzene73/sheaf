import {Socket} from '../kaguya/deps/phoenix/priv/static/phoenix.mjs';
import {LiveSocket} from '../kaguya/deps/phoenix_live_view/priv/static/phoenix_live_view.esm.js';
const Combo = {
  mounted() {
    this.input = this.el.querySelector('#query');
    this.list = this.el.querySelector('#options');
    this.generation = 0; this.open = false; this.active = null;
    this.onInput = () => { this.search(this.input.value); };
    this.onKey = e => {
      if(e.key === 'Escape' && this.open) { e.preventDefault(); e.stopPropagation(); this.dismiss(); return; }
      if(e.key === 'Enter') { e.preventDefault(); if(this.valid() && this.active) this.choose(this.active); return; }
      if(['ArrowDown','ArrowUp'].includes(e.key)) {
        e.preventDefault();
        if(!this.open) { this.search(this.input.value); return; }
        if(!this.valid()) return;
        const rows = this.rows(), index = rows.findIndex(r => r.dataset.value === this.active);
        if(rows.length) this.active = rows[index < 0 ? (e.key === 'ArrowDown' ? 0 : rows.length-1) : (index + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length].dataset.value;
        this.sync();
      }
    };
    this.onPointer = e => { if(e.target.closest('[role=option]')) e.preventDefault(); };
    this.onClick = e => { const row=e.target.closest('[role=option]'); if(row && this.valid()) this.choose(row.dataset.value); };
    this.input.addEventListener('input', this.onInput); this.input.addEventListener('keydown', this.onKey);
    this.list.addEventListener('pointerdown', this.onPointer); this.list.addEventListener('click', this.onClick);
    this.search('');
  },
  rows() { return [...this.list.querySelectorAll('[role=option]')]; },
  valid() { return this.open && Number(this.list.dataset.generation) === this.generation; },
  search(query) {
    clearTimeout(this.timer); const generation=++this.generation;
    this.open=true; this.active=null; this.sync();
    this.timer=setTimeout(() => this.pushEvent('search', {query,generation}), 40);
  },
  dismiss() { clearTimeout(this.timer); ++this.generation; this.open=false; this.active=null; this.sync(); },
  choose(value) { this.pushEvent('choose', {value,generation:this.generation}); this.dismiss(); },
  sync() {
    const valid=this.valid(); this.list.hidden=!valid;
    this.input.setAttribute('aria-expanded',String(valid));
    const row=valid ? this.rows().find(r=>r.dataset.value===this.active) : null;
    if(row) this.input.setAttribute('aria-activedescendant',row.id); else this.input.removeAttribute('aria-activedescendant');
    for(const item of this.rows()) item.setAttribute('aria-selected',String(item.dataset.value===this.el.dataset.accepted));
  },
  updated() { this.sync(); },
  destroyed() {
    clearTimeout(this.timer); ++this.generation;
    this.input.removeEventListener('input',this.onInput); this.input.removeEventListener('keydown',this.onKey);
    this.list.removeEventListener('pointerdown',this.onPointer); this.list.removeEventListener('click',this.onClick);
  }
};
const NativeDialog={mounted(){this.el.showModal()},destroyed(){if(this.el.open)this.el.close()}};
const liveSocket=new LiveSocket('/live',Socket,{params:{_csrf_token:document.querySelector('meta[name=csrf-token]').content},hooks:{Combo,NativeDialog}});
liveSocket.connect(); window.liveSocket=liveSocket;
