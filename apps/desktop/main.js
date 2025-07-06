require('dotenv').config({ path: '.env.local' });

const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const mime = require('mime-types');

let mainWindow;
let screenshotInterval = null;
let isTimerActive = false;
let currentEmployeeId = null;
let localServer = null;
const LOCAL_SERVER_PORT = 3333;

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Local server to serve bundled web files
function createLocalServer() {
  if (localServer) {
    console.log('🔄 Server already exists, closing previous instance...');
    localServer.close();
    localServer = null;
  }

  const webDistPath = path.join(__dirname, 'web-dist');
  
  localServer = http.createServer((req, res) => {
    console.log(`📋 Request: ${req.method} ${req.url}`);
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for SPA routing
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Handle SPA routing - serve index.html for non-file requests
    if (!path.extname(pathname)) {
      pathname = '/index.html';
    }
    
    const filePath = path.join(webDistPath, pathname);
    
    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mime.lookup(ext) || 'text/plain';
      
      // Add cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.writeHead(200, { 'Content-Type': mimeType });
      
      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });
      stream.pipe(res);
    } else {
      // Serve index.html for 404s (SPA routing)
      const indexPath = path.join(webDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const stream = fs.createReadStream(indexPath);
        stream.on('error', (err) => {
          console.error('Index stream error:', err);
          if (!res.headersSent) {
            res.writeHead(500);
            res.end('Internal Server Error');
          }
        });
        stream.pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    }
  });
  
  // Handle server errors
  localServer.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${LOCAL_SERVER_PORT} is busy, trying to restart...`);
      setTimeout(() => {
        localServer.close();
        createLocalServer();
      }, 1000);
    }
  });
  
  localServer.listen(LOCAL_SERVER_PORT, '127.0.0.1', () => {
    console.log(`🌐 Local server running on http://127.0.0.1:${LOCAL_SERVER_PORT}`);
  });
}

function createWindow() {
  // Start local server first
  createLocalServer();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const startURL = `http://127.0.0.1:${LOCAL_SERVER_PORT}`;

  // Wait a moment for the server to start, then load the URL
  setTimeout(() => {
    mainWindow.loadURL(startURL);
    console.log('🚀 Electron app started');
    console.log('🌐 Loading URL:', startURL);
  }, 1000);

  // Handle refresh (Cmd+R) to prevent infinite loading
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'r' || input.meta && input.key.toLowerCase() === 'r') {
      event.preventDefault();
      console.log('🔄 Refresh triggered, reloading...');
      mainWindow.loadURL(startURL);
    }
  });

  // Add did-fail-load handler to handle loading failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('❌ Failed to load:', errorDescription);
    if (errorCode === -3) { // ERR_ABORTED - common during refresh
      console.log('🔄 Load aborted, retrying...');
      setTimeout(() => {
        mainWindow.loadURL(startURL);
      }, 500);
    }
  });

  mainWindow.on('closed', () => {
    console.log('🔴 App closing, stopping screenshots and server');
    stopScreenshots();
    if (localServer) {
      localServer.close();
      localServer = null;
    }
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Screenshot functions
async function takeScreenshot() {
  if (!isTimerActive || !currentEmployeeId) {
    return;
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length > 0) {
      const screenshot = sources[0].thumbnail;
      const buffer = screenshot.toPNG();
      
      // Generate filename: employeeId-timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${currentEmployeeId}-${timestamp}.png`;

      await uploadScreenshot(buffer, filename);
      console.log('Screenshot captured and uploaded:', filename);
    }
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  }
}

async function uploadScreenshot(buffer, filename) {
  try {
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filename, buffer, {
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('Failed to upload screenshot:', uploadError);
      return;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filename);

    // Save screenshot record to database
    const { error: dbError } = await supabase
      .from('screenshots')
      .insert({
        employee_id: currentEmployeeId,
        file_path: publicUrlData.publicUrl,
        captured_at: new Date().toISOString(),
        has_permission: true
      });

    if (dbError) {
      console.error('Failed to save screenshot record:', dbError);
    }
  } catch (error) {
    console.error('Failed to upload screenshot:', error);
  }
}

function startScreenshots(employeeId) {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }

  currentEmployeeId = employeeId;
  isTimerActive = true;
  
  // Take screenshot every 30 seconds for testing (30,000 milliseconds)
  screenshotInterval = setInterval(takeScreenshot, 30 * 1000);
  
  console.log('🔥 Screenshots started for employee:', employeeId);
  console.log('📸 Taking screenshots every 30 seconds');
  
  // Take first screenshot immediately
  setTimeout(takeScreenshot, 2000);
}

function stopScreenshots() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  isTimerActive = false;
  currentEmployeeId = null;
  
  console.log('Screenshots stopped');
}

// IPC handlers for communication with renderer process
ipcMain.on('start-screenshots', (event, employeeId) => {
  startScreenshots(employeeId);
});

ipcMain.on('stop-screenshots', () => {
  stopScreenshots();
});
