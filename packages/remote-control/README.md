# ZadLoop Remote Control

Remote Control exposes the complete ZadLoop web interface through a separately
managed, authenticated listener. It supports local browser access, LAN access,
Cloudflare Quick Tunnels, and existing named Cloudflare tunnels/custom domains.

Remote access is disabled after installation. Open **Remote** in the conversation
toolbar to configure and start it. Network and tunnel modes require a passphrase;
passwordless access is restricted to the loopback interface.

Configuration is stored outside the package in
`~/.zadloop-remote-control/config-v2.json`. Passwords are stored as salted scrypt
hashes, remote sessions are revocable and expiring, login attempts are rate
limited, and ZadLoop's private upstream browser credential is never sent to a
remote visitor.

For a custom domain, create a Cloudflare named tunnel and DNS route first, then
provide its tunnel UUID, hostname, and credentials JSON path in the panel. Quick
Tunnel mode needs only `cloudflared` and produces a temporary `trycloudflare.com`
URL. LAN mode may require an inbound Windows Firewall rule, which this plugin
does not create automatically.
