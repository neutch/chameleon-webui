const { parentPort } = require('worker_threads');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let port = null;
let parser = null;
let commandQueue = [];
let processingCommand = false;
let config = null;
let isConnected = false;

// Command queue processor
async function processQueue() {
  if (processingCommand || commandQueue.length === 0) {
    return;
  }

  processingCommand = true;
  const { command, messageId, retries = 0 } = commandQueue.shift();

  try {
    if (!isConnected) {
      throw new Error('Serial port not connected');
    }

    const result = await sendCommand(command, config.commandTimeout);

    parentPort.postMessage({
      type: 'commandResult',
      messageId,
      success: true,
      result
    });
  } catch (error) {
    // Retry logic
    if (retries < config.maxRetries) {
      console.log(`Command failed, retry ${retries + 1}/${config.maxRetries}`);
      commandQueue.unshift({ command, messageId, retries: retries + 1 });
    } else {
      parentPort.postMessage({
        type: 'commandResult',
        messageId,
        success: false,
        error: error.message
      });
    }
  } finally {
    processingCommand = false;
    // Process next command after a small delay
    setTimeout(processQueue, 50);
  }
}

// Send a single command and wait for response
function sendCommand(command, timeout) {
  return new Promise((resolve, reject) => {
    let responseBuffer = '';
    let timeoutHandle;

    const onData = (data) => {
      responseBuffer += data;

      // Check for DONE or ERROR in the response
      if (responseBuffer.includes('DONE')) {
        cleanup();
        resolve({ status: 'DONE', response: responseBuffer });
      } else if (responseBuffer.includes('ERROR')) {
        cleanup();
        reject(new Error('Router returned ERROR'));
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      if (parser) {
        parser.removeListener('data', onData);
      }
    };

    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error('Command timeout'));
    }, timeout);

    if (parser) {
      parser.on('data', onData);
    }

    // Write command with carriage return
    port.write(command + '\r', (err) => {
      if (err) {
        cleanup();
        reject(err);
      }
    });
  });
}

// Initialize serial port
function initSerialPort(config) {
  if (config.devMode) {
    console.log('Running in dev mode - serial port disabled');
    isConnected = false;
    return;
  }

  try {
    port = new SerialPort({
      path: config.serialPort,
      baudRate: config.baudRate,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      autoOpen: false
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\r' }));

    port.on('open', () => {
      console.log('Serial port opened:', config.serialPort);
      isConnected = true;
      parentPort.postMessage({ type: 'connected' });
    });

    port.on('error', (err) => {
      console.error('Serial port error:', err.message);
      isConnected = false;
      parentPort.postMessage({ type: 'error', error: err.message });
    });

    port.on('close', () => {
      console.log('Serial port closed');
      isConnected = false;
      parentPort.postMessage({ type: 'disconnected' });

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (config && !config.devMode) {
          console.log('Attempting to reconnect...');
          port.open();
        }
      }, 5000);
    });

    port.open();
  } catch (error) {
    console.error('Failed to initialize serial port:', error.message);
    isConnected = false;
  }
}

// Handle messages from main thread
parentPort.on('message', (message) => {
  switch (message.type) {
    case 'init':
      config = message.config;
      initSerialPort(config);
      break;

    case 'command':
      commandQueue.push({
        command: message.command,
        messageId: message.messageId
      });
      processQueue();
      break;

    case 'getStatus':
      parentPort.postMessage({
        type: 'status',
        connected: isConnected,
        queueLength: commandQueue.length,
        processingCommand
      });
      break;

    case 'updateConfig':
      config = message.config;
      if (port && port.isOpen) {
        port.close(() => {
          initSerialPort(config);
        });
      } else {
        initSerialPort(config);
      }
      break;
  }
});

// Send ready message
parentPort.postMessage({ type: 'ready' });
