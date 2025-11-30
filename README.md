# Chameleon WebUI – Project Status

This project provides a modern web-based control interface for the Knox Chameleon HB/MB matrix router using a Raspberry Pi (or other Linux host) connected via RS‑232. The system includes user login via PIN pad, admin configuration, a floor‑map view of TVs, source previews, and reliable serial‑command routing.

## Current Implementation Status

### ✅ Completed Features

#### Backend (Node.js/Express)
- ✅ Express server with JWT-based authentication
- ✅ Cookie-based session management (7-day expiry)
- ✅ Serial worker with Worker Threads for non-blocking serial communication
- ✅ Command queue with timeout and retry logic
- ✅ Support for Both (`B`), Audio (`A`), and Video (`V`) routing commands
- ✅ Dev mode for testing without hardware
- ✅ JSON-based data persistence (sources.json, outputs.json, config.json)
- ✅ Complete REST API for routing, configuration, and admin operations
- ✅ CORS support for development

#### Frontend (React/Vite/Ant Design)
- ✅ Modern single-page application with React Router
- ✅ PIN-pad login with user/admin roles
- ✅ Grid view displaying TVs in physical layout with empty cells
- ✅ Source selection modal with current routing display
- ✅ Admin panel for:
  - ✅ Source management (add/edit/delete inputs)
  - ✅ Output management (add/edit/delete TVs with grid positioning)
  - ✅ System configuration (serial port, dev mode, grid dimensions)
- ✅ Real-time connection status indicator
- ✅ Responsive mobile design (iPhone/tablet optimized)
- ✅ Gradient header with status indicators
- ✅ Optimistic UI updates with server confirmation

#### Serial Communication
- ✅ Worker thread-based serial handling
- ✅ Command queue (one command at a time)
- ✅ Timeout handling (10 second default)
- ✅ Response parsing for `DONE`/`ERROR`
- ✅ Auto-reconnection on serial port disconnect
- ✅ Configurable serial port path and baud rate

### 🚧 In Progress / Planned

- ⏳ Systemd service configuration
- ⏳ Automated deployment script (`deploy.sh`)
- ⏳ Git-pull based auto-update mechanism
- ⏳ Salvos/preset routing feature
- ⏳ Range routing commands (`X/Y/Z`)
- ⏳ Router interrogation commands (`I`, `W`, `M`)
- ⏳ State sync between server and router on startup

### 🔮 Future Enhancements

- 📋 Live NDI/HLS preview thumbnails
- 📋 WebSocket for real-time routing updates
- 📋 SQLite database option
- 📋 Advanced role-based access controls
- 📋 Audit logging
- 📋 Multi-router support
- 📋 Queued routes + Take commands (`E/F/G`, `EE`)

## Quick Start

### Development Mode (No Hardware Required)

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Build the frontend
npm run build

# Start the server (dev mode enabled by default in .env)
npm start
```

Access the UI at `http://localhost:3000`

**Default PINs (from .env):**
- User PIN: `1234`
- Admin PIN: `0000`

### Production Mode (With Serial Hardware)

1. Update `.env` to set `DEV_MODE=false`
2. Configure `SERIAL_PORT` to match your USB-to-serial adapter (e.g., `/dev/ttyUSB0`)
3. Ensure the Pi user has access to the serial port:
   ```bash
   sudo usermod -a -G dialout $USER
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Project Structure

```
chameleon-webui/
├── server.js              # Express server and API routes
├── serialWorker.js        # Serial communication worker thread
├── client/                # React frontend source
│   ├── src/
│   │   ├── pages/        # Login, GridView, Admin pages
│   │   ├── components/   # TVGrid, SourceSelectionModal
│   │   ├── contexts/     # AuthContext for session management
│   │   └── services/     # API client functions
│   └── ...
├── public/               # Built frontend assets
├── data/                 # JSON data files
│   ├── config.json      # System configuration
│   ├── sources.json     # Input definitions
│   └── outputs.json     # Output/TV definitions with grid positions
├── .env                 # Environment variables (not in git)
├── package.json
└── README.md
```

## Core Components

### 1. Node.js Backend
- Express-based API server.
- Serial worker responsible for:
  - Managing `git pull`–safe router commands (one-at-a-time queue).
  - Handling retries, timeouts, and parsing `DONE`/`ERROR`.
- Route commands for:
  - Video (`V`), Audio (`A`), Both (`B`), Salvos (`X/Y/Z`), Queue + Take (`E/F/G`, `EE`).
- Systemd-managed service for always-on deployment.

### 2. Serial Interface
- Uses `/dev/ttyUSB0` (or configurable) with 9600‑8‑N‑1.
- Strict command queue and answer‑back validation.
- Automatic recovery on device unplug/replug.

### 3. Front-End UI
- Login page with PIN-pad (user + admin roles).
- Floorplan map (SVG) with clickable TVs.
- Source selection grid with preview thumbnails.
- TV detail page showing current source and all available sources.
- Salvos page for routing groups of TVs at once.
- Admin panel for:
  - Input/output labeling.
  - Drag-and-drop placement of TVs on map.
  - System configuration (serial port, max IO, theme, etc.).

### 4. Deployment Model (Secure, No Secrets)
- Repo is public; Pi pulls anonymously.
- No API keys, PATs, or sensitive credentials stored.
- A systemd timer runs `deploy.sh` every few minutes:
  1. `git fetch origin main`
  2. Compare local vs remote commit
  3. If changed → reset, rebuild, restart service
- Ensures:
  - Zero secrets on disk.
  - Fully remote-manageable.
  - Automatic redeploy on push.

### 5. Directory Structure

```
chameleon-webui/
  server.js
  public/
    index.html
    client.html
    admin.html
  data/
    sources.json
    outputs.json
  deploy.sh
  README.md
```

### 6. Systemd Services and Timer

#### Application service:
```
[Service]
WorkingDirectory=/home/pi/chameleon-webui
ExecStart=/usr/bin/node server.js
Restart=always
User=pi
Environment=NODE_ENV=production
```

#### Deployment timer:
```
OnUnitActiveSec=2min
ExecStart=/home/pi/chameleon-webui/deploy.sh
```

### 7. Future Enhancements
- Live NDI/HLS preview integration.
- Persistent DB (SQLite/JSON hybrid).
- Real-time WebSocket updates.
- Role-based access controls.
- Optional Pi Compute Module 5 upgrade path.

---

### Grid Layout (Markdown Table)

|   |   |   |   |   |   |   |
|---|---|---|---|---|---|---|
| 20 | 19 | 18 | 17 |   |   |   |
|    | 6  | 7  |    | 16 | 15 | 14 |
|    | 5  | 8  |    |    |    |    |
|    | 4  | 9  |    |    |    |    |
|    | 3  | 10 |    | 13 | 12 | 11 |
|    | 2  | 21 | 1  |    |    |    |


## Chameleon RS-232 Protocol Notes (for HB/MB Router)

This section captures the specifics of how we talk to the Knox Chameleon HB/MB router over RS-232 so another LLM or engineer can implement or extend the serial worker safely.

### Chameleon RS-232 Session Model (Important)

The Knox Chameleon HB/MB series uses a **stateless, no-handshake, synchronous-only** RS‑232 control model:

- **No session negotiation** – the router does not require or support any “connect,” “login,” “hello,” or “init” command.
- **No authentication** – there are no credentials, tokens, or session keys.
- **No open/close lifecycle** – the serial port may remain open indefinitely; the router does not track or expect session boundaries.
- **No flow control** – hardware (RTS/CTS) and software (XON/XOFF) flow control are not used.
- **ASCII-only protocol** – commands are plain-text ASCII followed by `\r` (carriage return).  
  - **Not** CRLF.  
  - **Not** binary or framed protocol.
- **Strictly synchronous** – the router can process only **one command at a time**.
  - Send a command → wait for `DONE` or `ERROR` → then send the next.
  - Sending multiple commands back‑to‑back without waiting will cause undefined behavior.
- **Stateless control** – the router maintains only the routing state itself; it does not remember controllers or sessions.
- **Response model** – every command returns exactly one of:
  - `DONE` (success)
  - `ERROR` (failure)

These rules are essential for designing the serial worker. All serial communication must be a strictly ordered request/response pipeline with timeouts, retries, and no parallelism.

### Serial Port Configuration

- Physical connector: DB-9 female on the rear of the router.
- Wiring (DCE device):
  - Pin 2 – TXD (data out from router to Pi)
  - Pin 3 – RXD (data in to router from Pi)
  - Pin 5 – GND
- Handshake lines (RTS/CTS/DTR/DSR etc.) are **not used**.
- Recommended port settings on the Pi:
  - Baud: `9600`
  - Data bits: `8`
  - Parity: `none`
  - Stop bits: `1`
  - Flow control: `none`

We should treat the router as a slow, line-oriented serial device and always wait for a response before sending the next command.

### Addressing Model

Our specific chassis is **ChamHB16x32/VO/RGB/FPC**. For the purpose of command encoding we will assume:

- Inputs: `1–16`
- Outputs: `1–32`
- All addressing values are sent as **zero-padded decimal** with a fixed width.
- For this router size we will use **2-digit** fields:
  - Inputs: `01–16`
  - Outputs: `01–32`

If, in the future, this code is adapted to other Chameleon sizes (e.g., 64×64), the field width may need to increase (3 digits, 4 digits). The serial worker should be parameterized on `maxInputs` and `maxOutputs` and calculate the field width as:

```text
width = max(len(str(maxInputs)), len(str(maxOutputs)))
```

All numeric fields in a given command must be padded to the same width.

### General Command Format

- Commands are ASCII strings starting with a **letter** followed by one or more **numeric fields**.
- Each command is terminated with a carriage return (`\r`).
- The router replies with a line containing either:
  - `DONE` (success), or
  - `ERROR` (failure)
- Some query commands return additional ASCII data before the final terminator.

Our serial worker must:

- Write a full command (including `\r`).
- Read until it sees a line ending containing `DONE` or `ERROR` (or a timeout occurs).
- Not send another command while one is outstanding.

### Core Routing Commands

These are the only commands we **need** initially to control video routing. All numeric fields are zero-padded per the addressing model above.

#### Route Video Only

```text
V[OUT][IN]\r
```

- Routes **video only** from input `IN` to output `OUT`.
- Does not touch the audio routing on that output.

Example (output 5 gets video from input 7 on a 16×32 system):

```text
V0507\r
```

#### Route Audio Only

```text
A[OUT][IN]\r
```

- Routes **audio only** from input `IN` to output `OUT`.
- Does not touch the video routing on that output.

Example:

```text
A0510\r   # out 5 gets audio from input 10
```

#### Route Audio + Video (Both)

```text
B[OUT][IN]\r
```

- Routes **both audio and video** from input `IN` to output `OUT`.
- This is the primary command our UI will send when a user selects a source for a TV.

Example:

```text
B0507\r   # out 5 gets A+V from input 7
```

#### Mixed A/V on a Single Output (Advanced)

```text
Q[OUT][VIDEO_IN][AUDIO_IN]\r
```

- Routes **video** from `VIDEO_IN` and **audio** from `AUDIO_IN` to output `OUT`.
- We likely will not use this in the first version, but the serial worker should be designed so it can support it later.

Example (video 7, audio 10 to output 5):

```text
Q050710\r
```

### Salvo / Range Routing (Advanced)

The router supports routing an entire **range of outputs** to the same input in one command. We may want this later for “All Bar TVs → Game Feed” style salvos.

```text
X[FIRST_OUT][LAST_OUT][IN]\r   # route both A+V
Y[FIRST_OUT][LAST_OUT][IN]\r   # route video only
Z[FIRST_OUT][LAST_OUT][IN]\r   # route audio only
```

Example (route both A+V from input 6 to outputs 18–32):

```text
X183206\r
```

For v1 of the app we can route salvos by iterating `B[OUT][IN]` per output, but using `X/Y/Z` is more efficient and better matches the hardware capabilities.

### Queued Routes + Take (Optional)

Some firmware versions support a "queue then take" model so you can stage multiple routes and then cut everything at once. The pattern is similar to `B/A/V` but uses different leading letters (often documented as `E/F/G` variants) with a special "execute" command.

Because we do not strictly need this for basic operation, this README only notes that:

- There are queue variants of the route commands.
- There is a separate "execute queued routes" command.
- A future implementer should consult the hardware manual for the exact opcodes and semantics if they want frame-accurate multi-output cuts.

Our initial serial worker should be written so that adding new opcodes is straightforward (command builder + central queue).

### Interrogation and State Queries

There are several commands used to interrogate the router and dump its current state. These are useful for:

- Boot-time discovery of cards and sizes.
- Building an in-memory map of current routes.
- Health checks.

Common examples (names here are descriptive; exact formats should be confirmed against the manual when implementing):

- `I` – Sign-on / identify the router and controller.
- `W` – List installed cards / frame configuration.
- `M` – Dump all current routing.
- `D...` – Dump routes for a particular range of outputs.

The serial worker should provide a small set of **higher-level functions** like:

- `readSignOn()` → returns identification string.
- `readCards()` → returns list of input/output cards.
- `readAllRoutes()` → builds a `output -> input` map.

These can be called at startup to reconcile the Pi’s internal state with whatever the matrix is actually doing.

### Timing, Error Handling, and Retries

Rules for the serial worker:

- Only one command may be "in flight" at a time.
- After writing a command, start a short timeout (e.g., 500–1000 ms).
- If no `DONE` or `ERROR` arrives before the timeout:
  - Retry the command a small number of times (e.g., up to 3 attempts).
  - If it still fails, surface an error back to the API/UI.
- If `ERROR` is returned:
  - Log the offending command and context.
  - Do **not** assume anything about the routing change.
- If the serial port drops (dongle unplugged, router rebooted):
  - Mark the connection as "down".
  - Periodically attempt to reopen.
  - Once reopened, re-run the interrogation (`I`, `W`, `M`) to rebuild state.

The Node serial worker described earlier in this README should be implemented to obey these rules so that higher-level code can treat routing operations as simple async calls that either resolve (success) or reject (failure) without having to know about low-level serial behavior.