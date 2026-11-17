# Engawa MCP deployment

This deployment keeps the Python MCP server private inside Docker and exposes it only through Caddy with HTTPS, a bearer token, and CORS restricted to the Xiaowo GitHub Pages origin.

## Before starting

1. Point a DNS record for a hostname you control (for example `mcp.example.com`) to the server.
2. Allow inbound TCP ports 80 and 443 in the server firewall.
3. Copy `.env.example` to `.env`.
4. Set `ENGAWA_DOMAIN`, replace `ENGAWA_TOKEN` with a long random value, and set the observation latitude, longitude, and UTC offset.
5. Keep the real `.env` file private. Never commit it or share the token in screenshots.

## Start

Run these commands from this directory:

```sh
cp .env.example .env
# Edit .env with your own domain, random token and observation location.
docker compose up -d
docker compose logs -f
```

Caddy obtains and renews the HTTPS certificate automatically when DNS and ports are correct.

## Connect Xiaowo

In Xiaowo, open Chat → More → AI Connection → Engawa MCP.

- Service address: `https://YOUR_DOMAIN/mcp`
- Access token: the value of `ENGAWA_TOKEN` from your private `.env` file

The gateway checks the bearer token, handles browser preflight requests, and exposes the MCP session header. The Engawa container itself is not published to the internet.

## Security notes

- Do not publish port 8799. Docker exposes it only to the private compose network.
- Do not set `ENGAWA_ALLOW_PRIVATE_URLS=1`; the upstream URL safety guard should remain enabled.
- Use HTTPS and a unique long token. Anyone holding the token can use the MCP tools.
- Changes to the persistent shelf and hobby subscriptions trigger an in-browser confirmation in Xiaowo.
- The CORS allowlist is intentionally restricted to `https://water1014.github.io`. If the site origin changes, update the Caddyfile deliberately.
- Set the latitude, longitude, and UTC offset to the observation location you want. They are not inferred from the browser.

This template is prepared but is not deployed until it is installed on a server with a domain and valid credentials.
