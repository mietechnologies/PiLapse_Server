# PiLapse Server

Optional self-hosted server for [PiLapse](https://github.com/mietechnologies/PiLapse_Client) cameras. Each Pi keeps capturing on its own; when it's connected to a server it also uploads every photo here, filed by camera and by intent (the capture profile on the Pi that took it).

## Running the server

Requires Docker with Compose. MongoDB 5+ needs an ARMv8.2 CPU, so run the server on a PC, NAS or Pi 5, not on the camera Pis.

```bash
git clone https://github.com/mietechnologies/PiLapse_Server.git
cd PiLapse_Server
cp .env.example .env
# Fill in JWT_SECRET, MONGO_ROOT_PASSWORD and MONGO_APP_PASSWORD:
#   openssl rand -hex 32
docker compose up -d --build
curl http://localhost:3000/api/v1/info
```

`setupRequired: true` in that response means no account exists yet.

Photos are stored in the `app_data` volume and the database in `mongodb_data`. MongoDB is not published outside the Compose network.

## Accounts

The first account created on a server becomes its **owner**. After that, public signup is closed; the owner creates any other accounts by calling signup with their own login token.

## Connecting a camera

On each Pi, run `timelapse server connect` and enter the server URL and your login. The client registers the Pi as a camera and receives a **device token**, which it stores in its secrets file. Your password is not stored on the Pi.

A device token only works for that one Pi and never expires. If a Pi is lost or replaced, revoke or rotate its token (see the API below); your account login is unaffected.

## Reaching the server from outside your network

The server speaks plain HTTP. On a home network that's fine. To reach it from elsewhere, put it behind something that adds HTTPS, for example Tailscale, Cloudflare Tunnel, or a reverse proxy such as Caddy or nginx. Behind a reverse proxy, set `TRUST_PROXY=1` in `.env` so rate limits see real client addresses.

## API

All routes are under `/api/v1`. Users authenticate with `Authorization: Bearer <jwt>` from login; Pis authenticate with `Authorization: Device <token>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/info` | none | Server name, version, and whether setup is required |
| POST | `/user/signup` | none for the first account, then owner | Create an account |
| POST | `/user/login` | none | Log in; returns a JWT |
| GET | `/user/me` | user | Your account and Pis |
| GET | `/pi` | user | Your Pis |
| POST | `/pi/add` | user | Register a Pi; returns its `deviceToken` once |
| GET | `/pi/:id` | user or that Pi | One Pi |
| POST | `/pi/:id/token` | user | Rotate the device token; returns the new one once |
| DELETE | `/pi/:id/token` | user | Revoke the device token |
| POST | `/pi/:id/photos` | user or that Pi | Upload a photo: multipart `image`, plus optional `intent`, `date` (ISO 8601), `temperature` |
| GET | `/pi/:id/photos` | user or that Pi | List photos; filter with e.g. `?intent=printer-5s`, page with `page`/`limit` |
| GET | `/pi/:id/photos/:photoId` | user or that Pi | The photo file |

Login and signup are limited to 25 requests per 20 minutes per IP (`AUTH_RATE_LIMIT` to change it). Uploads are not rate limited.

## Development

```bash
npm install
npm test              # spins up an in-memory MongoDB
npm run start:dev     # needs a config.env with MONGO_URI, JWT_SECRET, PHOTOS_DIRECTORY
```
