defmodule Lab.Layout do
  use Phoenix.Component

  def root(assigns) do
    ~H"""
    <!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()}/><title>Primitive viability lab</title>
    <script defer src="/app.js"></script>
    <style>body{font:16px system-ui;background:#161616;color:#eee}dialog{background:#242424;color:#eee;border:1px solid #555;padding:24px;width:360px}dialog::backdrop{background:#0008}input,button{font:inherit;padding:8px}input{width:90%}[role=option]{display:block;width:100%;text-align:left}[aria-selected=true]{background:#9ccaff}[hidden]{display:none!important}</style>
    </head><body>{@inner_content}</body></html>
    """
  end
end
