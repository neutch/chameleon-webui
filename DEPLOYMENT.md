# Deployment Guide

This guide explains how to deploy the Chameleon WebUI on a Raspberry Pi.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS installed
- Node.js v18 or later installed
- Git installed
- USB-to-serial adapter connected to the router
- Internet connection for initial setup

## Initial Setup on Raspberry Pi

### 1. Clone the Repository

```bash
cd /home/pi
git clone https://github.com/neutch/chameleon-webui.git
cd chameleon-webui
```

### 2. Create Environment File

```bash
cp .env.example .env
nano .env
```

Edit the PINs and secrets:
```
USER_PIN=1234
ADMIN_PIN=5678
PORT=3000
SESSION_SECRET=your-random-secret-here
```

### 3. Install Dependencies and Build

```bash
# Install backend dependencies
npm install --production

# Install frontend dependencies and build
cd client
npm install
npm run build
cd ..
```

### 4. Configure Serial Port

Check which serial port your USB adapter is using:
```bash
ls -l /dev/ttyUSB*
```

Update the serial port in `data/config.json`:
```bash
nano data/config.json
```

Change `serialPort` to match your device (e.g., `/dev/ttyUSB0`).

Set `devMode` to `false` to enable serial communication.

### 5. Test the Application

```bash
npm start
```

Visit `http://raspberry-pi-ip:3000` in your browser and test the login and routing.

Press Ctrl+C to stop the test.

## Systemd Setup (Auto-start and Auto-deploy)

### 1. Install Systemd Service Files

```bash
sudo cp systemd/chameleon-webui.service /etc/systemd/system/
sudo cp systemd/chameleon-deploy.service /etc/systemd/system/
sudo cp systemd/chameleon-deploy.timer /etc/systemd/system/
```

### 2. Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start the main application
sudo systemctl enable chameleon-webui.service
sudo systemctl start chameleon-webui.service

# Enable and start the auto-deploy timer
sudo systemctl enable chameleon-deploy.timer
sudo systemctl start chameleon-deploy.timer
```

### 3. Check Status

```bash
# Check application status
sudo systemctl status chameleon-webui

# Check deploy timer status
sudo systemctl status chameleon-deploy.timer

# View logs
sudo journalctl -u chameleon-webui -f
sudo journalctl -u chameleon-deploy -f
```

## How Auto-Deploy Works

The auto-deploy system checks for updates every 2 minutes:

1. The timer triggers `deploy.sh` every 2 minutes
2. The script fetches the latest changes from `origin/main`
3. If there are new commits, it:
   - Resets to the latest commit
   - Installs dependencies
   - Rebuilds the frontend
   - Restarts the service
4. If there are no changes, it does nothing

## Development Workflow

On your development machine:

1. Make changes to the code
2. Test locally with `npm run client` (frontend) and `npm run dev` (backend)
3. Commit changes: `git add . && git commit -m "your message"`
4. Push to remote: `git push origin main`
5. Within 2 minutes, the Raspberry Pi will automatically pull and deploy

## Troubleshooting

### Application won't start

Check logs:
```bash
sudo journalctl -u chameleon-webui -n 50
```

### Serial port not working

Check permissions:
```bash
sudo usermod -a -G dialout pi
```

Log out and back in for the group change to take effect.

### Deploy not working

Check deploy logs:
```bash
sudo journalctl -u chameleon-deploy -n 50
```

Make sure the deploy script is executable:
```bash
chmod +x /home/pi/chameleon-webui/deploy.sh
```

### Can't access from browser

Check if the service is running:
```bash
sudo systemctl status chameleon-webui
```

Check firewall rules if needed:
```bash
sudo ufw allow 3000
```

## Manual Deploy

If you need to manually trigger a deploy:
```bash
cd /home/pi/chameleon-webui
./deploy.sh
```

## Stopping the Service

```bash
sudo systemctl stop chameleon-webui
sudo systemctl stop chameleon-deploy.timer
```

## Disabling Auto-Deploy

```bash
sudo systemctl disable chameleon-deploy.timer
sudo systemctl stop chameleon-deploy.timer
```
