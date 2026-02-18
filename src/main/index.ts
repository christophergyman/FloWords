import { app, BrowserWindow, globalShortcut, Menu, shell, Tray } from 'electron'
import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { getSettings } from './store'

// Keep tray at module scope to prevent GC
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let currentShortcut: string | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.on('ready-to-show', () => {
    // Window starts hidden — summoned via hotkey
  })

  // Hide instead of close
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function registerHotkey(shortcut: string): void {
  if (currentShortcut) {
    globalShortcut.unregister(currentShortcut)
  }
  globalShortcut.register(shortcut, toggleWindow)
  currentShortcut = shortcut
}

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/trayIconTemplate.png')
  tray = new Tray(iconPath)
  tray.setToolTip('FloWords')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: toggleWindow
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', toggleWindow)
}

// Extend app type for isQuitting flag
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

app.isQuitting = false

// Request single instance lock
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.flowords')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide()
    }

    registerIpcHandlers({ onHotkeyChange: registerHotkey })
    mainWindow = createWindow()
    createTray()

    // Register global hotkey from settings
    const settings = getSettings()
    registerHotkey(settings.hotkey)
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  app.on('window-all-closed', () => {
    // Keep running — tray app
  })
}
