with open("web/login.html", "r", encoding="utf-8") as f:
    text = f.read()

text_norm = text.replace("\r\n", "\n")

old_snippet = """      <div class="login-footer">
        <div>Hệ thống bảo mật mạng nội bộ HQ &amp; BOB</div>
        <div class="hint-badge">user: <b>system</b> &nbsp;|&nbsp; pass: <b>@cronis1</b></div>
      </div>"""

new_snippet = """      <div class="login-footer">
        <div>Hệ thống giám sát bảo mật mạng nội bộ HQ &amp; BOB</div>
      </div>"""

assert old_snippet in text_norm, "Snippet not found"
text_norm = text_norm.replace(old_snippet, new_snippet, 1)

with open("web/login.html", "w", encoding="utf-8") as f:
    f.write(text_norm)

print("Removed credentials display from login.html successfully!")
