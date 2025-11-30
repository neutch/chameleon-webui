const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Load configuration and data
let config = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));
let sources = JSON.parse(fs.readFileSync('./data/sources.json', 'utf8'));
let outputs = JSON.parse(fs.readFileSync('./data/outputs.json', 'utf8'));

// Initialize serial worker
let serialWorker = null;
let workerReady = false;
const pendingCommands = new Map();
let messageIdCounter = 0;

function initSerialWorker() {
  serialWorker = new Worker('./serialWorker.js');

  serialWorker.on('message', (message) => {
    switch (message.type) {
      case 'ready':
        console.log('Serial worker ready');
        workerReady = true;
        serialWorker.postMessage({ type: 'init', config });
        break;

      case 'connected':
        console.log('Serial port connected');
        break;

      case 'disconnected':
        console.log('Serial port disconnected');
        break;

      case 'error':
        console.error('Serial worker error:', message.error);
        break;

      case 'commandResult':
        const callback = pendingCommands.get(message.messageId);
        if (callback) {
          if (message.success) {
            callback.resolve(message.result);
          } else {
            callback.reject(new Error(message.error));
          }
          pendingCommands.delete(message.messageId);
        }
        break;
    }
  });

  serialWorker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  serialWorker.on('exit', (code) => {
    console.log('Serial worker exited with code', code);
    workerReady = false;
  });
}

initSerialWorker();

// Send command to serial worker
function sendSerialCommand(command) {
  return new Promise((resolve, reject) => {
    if (!workerReady) {
      reject(new Error('Serial worker not ready'));
      return;
    }

    if (config.devMode) {
      // In dev mode, simulate success
      console.log('DEV MODE - Simulating command:', command);
      setTimeout(() => resolve({ status: 'DONE', response: 'DEV MODE' }), 100);
      return;
    }

    const messageId = messageIdCounter++;
    pendingCommands.set(messageId, { resolve, reject });

    serialWorker.postMessage({
      type: 'command',
      command,
      messageId
    });

    // Timeout for the entire command process
    setTimeout(() => {
      if (pendingCommands.has(messageId)) {
        pendingCommands.delete(messageId);
        reject(new Error('Command timeout at server level'));
      }
    }, 10000);
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin-only middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Helper function to build route command
function buildRouteCommand(outputId, inputId, mode = 'B') {
  const width = Math.max(
    config.maxInputs.toString().length,
    config.maxOutputs.toString().length
  );
  const out = outputId.toString().padStart(width, '0');
  const inp = inputId.toString().padStart(width, '0');
  return `${mode}${out}${inp}`;
}

// API Routes

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;

  let role = null;
  if (pin === process.env.USER_PIN) {
    role = 'user';
  } else if (pin === process.env.ADMIN_PIN) {
    role = 'admin';
  }

  if (!role) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  const token = jwt.sign({ role }, process.env.SESSION_SECRET, {
    expiresIn: '7d' // Long session as requested
  });

  res.cookie('authToken', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict'
  });

  res.json({ success: true, role });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true, role: req.user.role });
});

// Data endpoints
app.get('/api/sources', authenticateToken, (req, res) => {
  res.json(sources);
});

app.get('/api/outputs', authenticateToken, (req, res) => {
  res.json(outputs);
});

app.get('/api/config', authenticateToken, (req, res) => {
  // Don't send sensitive config to client
  const clientConfig = {
    serialPort: config.serialPort,
    gridRows: config.gridRows,
    gridCols: config.gridCols,
    devMode: config.devMode
  };
  res.json(clientConfig);
});

// Routing endpoint
app.post('/api/route', authenticateToken, async (req, res) => {
  const { outputId, inputId, mode = 'B' } = req.body;

  if (!outputId || !inputId) {
    return res.status(400).json({ error: 'Missing outputId or inputId' });
  }

  try {
    const command = buildRouteCommand(outputId, inputId, mode);
    const result = await sendSerialCommand(command);

    // Update local state
    const output = outputs.find(o => o.id === outputId);
    if (output) {
      output.currentSource = inputId;
      fs.writeFileSync('./data/outputs.json', JSON.stringify(outputs, null, 2));
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Route command failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoints
app.put('/api/admin/sources', authenticateToken, requireAdmin, (req, res) => {
  try {
    sources = req.body;
    fs.writeFileSync('./data/sources.json', JSON.stringify(sources, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/outputs', authenticateToken, requireAdmin, (req, res) => {
  try {
    outputs = req.body;
    fs.writeFileSync('./data/outputs.json', JSON.stringify(outputs, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/config', authenticateToken, requireAdmin, (req, res) => {
  try {
    const newConfig = req.body;

    // Validate config
    if (newConfig.serialPort && typeof newConfig.serialPort === 'string') {
      config.serialPort = newConfig.serialPort;
    }
    if (typeof newConfig.devMode === 'boolean') {
      config.devMode = newConfig.devMode;
    }
    if (newConfig.gridRows) config.gridRows = newConfig.gridRows;
    if (newConfig.gridCols) config.gridCols = newConfig.gridCols;

    fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));

    // Update serial worker config
    if (workerReady) {
      serialWorker.postMessage({ type: 'updateConfig', config });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint
app.get('/api/status', authenticateToken, (req, res) => {
  serialWorker.postMessage({ type: 'getStatus' });

  // Wait for status response
  const timeout = setTimeout(() => {
    res.json({ connected: false, message: 'Status check timeout' });
  }, 1000);

  const handler = (message) => {
    if (message.type === 'status') {
      clearTimeout(timeout);
      serialWorker.removeListener('message', handler);
      res.json(message);
    }
  };

  serialWorker.on('message', handler);
});

// Serve React app for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dev mode: ${config.devMode}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (serialWorker) {
    serialWorker.terminate();
  }
  process.exit(0);
});
