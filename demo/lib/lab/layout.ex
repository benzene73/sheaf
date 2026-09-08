defmodule Lab.Layout do
  use Phoenix.Component

  def root(assigns) do
    ~H"""
    <!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()}/><title>Sheaf playground</title>
    <script defer src="/app.js"></script>
    <style>body{font:16px system-ui;background:#161616;color:#eee}dialog{background:#242424;color:#eee;border:1px solid #555;padding:24px;width:360px}dialog::backdrop{background:#0008}input,button{font:inherit;padding:8px}input{width:90%}[role=option]{display:block;width:100%;text-align:left}[aria-selected=true]{background:#9ccaff}[hidden]{display:none!important}</style>
    <style>
      .lab-home{max-width:1020px;margin:80px auto;padding:0 24px;line-height:1.6}
      .lab-eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#b0b3d7}
      .lab-home h1{font-size:48px;line-height:1.1;letter-spacing:-.04em;margin:16px 0}
      .lab-intro{max-width:720px;color:#aaa;font-size:18px}
      .lab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:40px 0}
      .lab-card{display:block;padding:24px;border:1px solid #34343c;border-radius:16px;color:inherit;text-decoration:none;background:#202024}
      .lab-card:hover{border-color:#9da4ef;background:#24242d}.lab-card:focus-visible{outline:2px solid #adb4ff;outline-offset:4px}
      .lab-card h2{font-size:20px;margin:0 0 12px}.lab-card h2 span{float:right;color:#a5aad9}
      .lab-card p,.lab-note{font-size:15px;color:#aaa;margin:0}.lab-home>a{display:inline-block;margin-top:16px;color:#adb4ff}
      @media(max-width:600px){.lab-home{margin-top:40px}.lab-home h1{font-size:36px}}
      .lab-demo{max-width:760px;margin:48px auto;padding:0 24px;line-height:1.5}
      .lab-demo h1{font-size:30px;letter-spacing:-.025em;margin-bottom:28px}
      .lab-demo h2{font-size:18px;margin:16px 0 8px}
      .lab-demo button{border:1px solid #555563;border-radius:7px;background:#2c2c34;color:#eee;cursor:pointer}
      .lab-demo button:hover{background:#393945}.lab-demo button:focus-visible{outline:2px solid #b5beff;outline-offset:3px}
      .lab-demo button:disabled,.lab-demo [aria-disabled=true]{opacity:.5;cursor:default}
      .lab-demo input:not([type=hidden]){box-sizing:border-box;border:1px solid #555563;border-radius:7px;background:#202025;color:#eee}
      .lab-demo [data-part=menu],.lab-demo [data-part=select],.lab-demo [data-part=popup],.lab-demo [data-part=list],.lab-demo [data-tooltip-popup]{box-sizing:border-box;background:#24242c;color:#eee;border:1px solid #555563;border-radius:8px;padding:8px}
      .lab-demo [role=option],.lab-demo [role=menuitem]{box-sizing:border-box;padding:8px 10px;border-radius:4px;cursor:pointer}
      .lab-demo [aria-selected=true],.lab-demo [aria-pressed=true],.lab-demo [role=option]:focus,.lab-demo [role=menuitem]:focus{background:#394d78;color:#fff}
      .lab-demo [role=tablist],.lab-demo [role=group]{display:flex;gap:6px;margin-bottom:16px}
      .lab-demo [role=tabpanel],.lab-demo [role=region]{padding:16px;border:1px solid #34343c;border-radius:8px}
      .lab-demo>output{display:block;margin:12px 0;color:#b4b4c0;font-size:14px}
      #amount-field [data-part=input]{width:120px}#amount-field label{display:block;margin-bottom:8px}
      #amount-field{margin-bottom:20px}
      .lab-entry-form{display:grid;gap:20px;margin:28px 0 16px}
      .lab-entry-form label{display:block;margin-bottom:8px;color:#c5c5d0}
      .lab-entry-form>[phx-hook]>input:not([type=hidden]){width:100%}
      .lab-entry-form [data-part=anchor]{min-width:200px;text-align:left}
      .lab-entry-form [phx-hook=PortedNumberField]{display:grid;grid-template-columns:44px 140px 44px;gap:6px;align-items:center}
      .lab-entry-form [phx-hook=PortedNumberField]>label,.lab-entry-form [phx-hook=PortedNumberField]>p{grid-column:1/-1}
      .lab-entry-form [aria-invalid=true]{border-color:#e58e8e}
      .lab-entry-form [id*="-error-"]{color:#f0a7a7;margin:6px 0 0}
      .lab-entry-form>button{justify-self:start}
      .lab-form-demo>a{color:#adb4ff}
    </style>
    </head><body>{@inner_content}</body></html>
    """
  end
end
