const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const { createClient } = require('@supabase/supabase-js');

let mainWindow;
let screenshotInterval = null;
let isTimerActive = false;
let currentEmployeeId = null;

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ojndklpqwzthgtfgjgzf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbmRrbHBxd3p0aGd0ZmdqZ3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODcwNjQsImV4cCI6MjA2NzI2MzA2NH0.wOuDXlnDOP5X7uqO-xk0jwOGJIlSF2gu9zVHXYRh6TE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const startURL = 'http://localhost:3001'

  mainWindow.loadURL(startURL);
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  console.log('🚀 Electron app started');
  console.log('🌐 Loading URL:', startURL);

  mainWindow.on('closed', () => {
    console.log('🔴 App closing, stopping screenshots');
    stopScreenshots();
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
