const electron = require('electron')
// Module to control application life.
const app = electron.app

// const { session } = require('electron')

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer')

const config = require('./config')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

let isDev = process.env['NODE_ENV'] === 'development'

const platform = require('os').platform()

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: config.hiDPI ? 3200 : 1600,
    height: config.hiDPI ? 1600 : 800,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      partition: 'persist:huohua'
    }
  })

  //sso.huohua.cn/oauth/authorize?client_id=asm&response_type=code&redirect_uri=http://

  http: if (isDev) {
    require('./webpack-server.js')
    // mainWindow.loadURL(
    //   'http://sso.huohua.cn/oauth/authorize?client_id=manage&response_type=code&redirect_uri=http://127.0.0.1:3001/api/oauth2'
    // )
    mainWindow.loadURL('http://localhost:3000/index.html')
  } else {
    mainWindow.loadFile('dist/index.html')
  }

  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    // 暂时不用
    /*
    if (!app.isDefaultProtocolClient('huohua')) {
      // 没注册 huohua 协议
      const ret = app.setAsDefaultProtocolClient('huohua')
      console.log(`setAsDefaultProtocolClient ret:${ret}`)

      //   app.quit()

      // 重启
      //   app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
      //   app.exit(0)
    }
    */

    //   if (isDev) {
    //     installExtension(REACT_DEVELOPER_TOOLS)
    //       .then(name => {
    //         console.log(`Added Extension:  ${name}`)
    //         createWindow()
    //       })
    //       .catch(err => console.log('An error occurred: ', err))
    //   } else {
    //     createWindow()
    //   }

    //   installExtension(REACT_DEVELOPER_TOOLS)
    //     .then(name => {
    //       console.log(`Added Extension:  ${name}`)
    //       createWindow()
    //     })
    //     .catch(err => console.log('An error occurred: ', err))

    // const ses = session.fromPartition('persist:huohua')
    // ses.cookies.get({}, (error, cookies) => {
    //   if (error) throw error
    //   else console.log(cookies)
    // })

    // process.argv.forEach((val, index) => {
    //   console.log(`${index}: ${val}`)
    // })

    createWindow()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
