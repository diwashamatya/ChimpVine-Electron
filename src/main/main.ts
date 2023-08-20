/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  session,
  webContents,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const { spawn } = require('child_process');

import fs from 'fs';
const Store = require('electron-store');
const store = new Store();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// let mainWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow;
let sessionToken = '';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

// Function to update the analytics data in the JSON file
const updateAnalyticsData = async (
  // username: string,
  // timestamp: string,
  details: string
) => {
  const analyticsFilePath = app.isPackaged
    ? path.join(__dirname, '../../../assets/analytics/analytics.json')
    : path.join(__dirname, '../../assets/analytics/analytics.json');

  try {
    // const username = 'abc2xyz123'; //get the username from cookies
    const userId = store.get('user').username;
    console.log(`UserAnalytics: ${userId}`);
    const timestamp = Date().toLocaleString(); //get the current date

    // Read the JSON file to get the existing data
    const rawData = await fs.promises.readFile(analyticsFilePath, 'utf8');

    // Check if the file is empty (or contains no data)
    const data = rawData.trim() ? JSON.parse(rawData) : { reports: [] };

    if (data.reports) {
      // Check if the 'reports' array exists in the data
      const userIndex = data.reports.findIndex(
        (report) => report.name === userId
      );

      if (userIndex !== -1) {
        // If the username exists, add the new entry to the user's actions array
        data.reports[userIndex].actions.push({
          timestamp,
          details,
        });
      } else {
        // If the username doesn't exist, create a new entry for the user
        data.reports.push({
          name: userId,
          actions: [
            {
              timestamp,
              details,
            },
          ],
        });
      }
    } else {
      // If 'reports' array doesn't exist in the data, create a new entry for the user
      data.reports = [
        {
          name: userId,
          actions: [
            {
              timestamp,
              details,
            },
          ],
        },
      ];
    }

    // Write the updated data back to the JSON file
    await fs.promises.writeFile(
      analyticsFilePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    console.log('Analytics data updated successfully.');
  } catch (error) {
    console.error('Failed to update analytics data:', error);
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#ba73ff',
    icon: getAssetPath('icon.png'),

    webPreferences: {
      // devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      event.preventDefault(); // Prevent the default behavior (minimizing window)
    }
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    //   if (!store.has('installationDate')) {
    //     const installationDate = new Date().toISOString();
    //     store.set('installationDate', installationDate);
    //   }
    // });

    //date subscription
    // const subscriptionDate = new Date('2023-9-20').toISOString();
    // store.set('subscriptionDate', subscriptionDate);

    // if (!store.has('subscriptionDate')) {
    //   const subscriptionDate = new Date('2023-06-01').toISOString();
    //   store.set('subscriptionDate', subscriptionDate);
    // }
  });

  // mainWindow.on('closed', () => {
  //   mainWindow = null;
  // });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  ipcMain.on('date-data', async (event, arg) => {
    let installationDate = store.get('installationDate');
    if (!installationDate) {
      const currentDate = new Date().toISOString();
      store.set('installationDate', currentDate);
    }

    installationDate = new Date(store.get('installationDate'));
    const expirationDate = new Date(
      installationDate.getFullYear() + 1,
      installationDate.getMonth(),
      installationDate.getDate()
    );

    event.reply('date-data', expirationDate);
  });

  //Code to handle login process
  ipcMain.on('login', async (event, arg) => {
    if (arg.userType == 'student') {
      const username = arg.user;
      const password = arg.pwd;

      const credsFilePath = app.isPackaged
        ? path.join(__dirname, '../../../assets/credentials/users.json')
        : path.join(__dirname, '../../assets/credentials/users.json');

      try {
        // Read the JSON file to get the existing user credentials
        const rawData = await fs.promises.readFile(credsFilePath, 'utf8');

        // Check if the file is empty (or contains no data)
        const usersData = rawData.trim() ? JSON.parse(rawData) : {};

        // Merge all arrays of users into a single array
        const allUsers = Object.values(usersData).flat();

        const authenticationUser = allUsers.find(
          (user) => user.username === username && user.password === password
        );

        if (authenticationUser) {
          console.log('authentication');
          sessionToken = username; // Generate the session token here

          // Set the session token in a cookie
          const cookie = {
            url: 'http://localhost',
            name: 'sessionToken',
            value: sessionToken,
          };

          await session.defaultSession.cookies.set(cookie); //set cookie

          // Save the username in Electron's local store

          const localStorageItem = {
            username,
          };
          webContents.getAllWebContents().forEach((wc) => {
            wc.executeJavaScript(
              `localStorage.setItem('username', '${JSON.stringify(
                localStorageItem
              )}')`
            );
          });

          store.set('user', localStorageItem); //set details on local electron storage\
          store.get('user');

          event.reply('authentication', true);
          updateAnalyticsData('Logged in to the system'); //update analytics
        } else {
          console.log('not-authentication');
          event.reply('authentication', false);
        }
      } catch (error) {
        console.error('Error reading or writing logins.json:', error);
        event.reply('authentication', false);
      }
    }

    if (arg.userType === 'guest') {
      try {
        console.log('authentication');
        sessionToken = 'guest'; // Generate the session token here

        // Set the session token in a cookie
        const cookie = {
          url: 'http://localhost',
          name: 'sessionToken',
          value: sessionToken,
        };

        await session.defaultSession.cookies.set(cookie); //set cookie

        // Save the username in Electron's local store

        const localStorageItem = {
          username: 'guest',
        };
        store.set('user', localStorageItem); //set details on local electron storage

        event.reply('authentication', true);
        updateAnalyticsData('Logged in to the system'); //update analytics
      } catch (error) {
        console.error('Error reading or writing logins.json:', error);
        event.reply('authentication', false);
      }
    }
  });

  //code to get current user in WelcomeUser component
  ipcMain.on('getCurrentUser', async (event, arg) => {
    console.log('Get this process');
    const userId = store.get('user').username;
    console.log(`User: ${userId}`);
    event.reply('getCurrentUser', userId);
  });

  ipcMain.on('Screen-data', async (event, arg) => {
    // for loading games
    if (arg.event == 'GamesOpen') {
      const exePath = app.isPackaged
        ? path.join(__dirname, '../../../', arg.link)
        : path.join(__dirname, '../../', arg.link);

      console.log(exePath);
      event.reply('Screen-data', exePath);
      mainWindow.webContents.send('Game-State', true);
      const fun = function () {
        const child = spawn(exePath, [
          /* arguments */
          updateAnalyticsData(`Started playing game: ${arg.name}`),//update analytics
        ]);

        child.on('error', (err: any) => {
          console.error('Failed to start child process.', err);
        });

        // Listen for the 'exit' event
        child.on('exit', (code: any) => {
          mainWindow.webContents.send('Close-Modal');
          updateAnalyticsData(`Stopped playing game: ${arg.name}`); //update analytics
          console.log(`Child process exited with code ${code}`);
        });
      };
      fun();
    }

    //for loading screendata like games, interactive content, etc.

    if (arg.event == 'ReadJson') {
      const dataFilePath = app.isPackaged
        ? path.join(__dirname, '../../../assets/data/', arg.link + '.json')
        : path.join(__dirname, '../../assets/data/', arg.link + '.json');

      // path.join(__dirname, '../data/', arg.link + '.json');
      // const dataFilePath = path.join(__dirname);

      console.log(dataFilePath);
      // event.reply('Screen-data', dataFilePath);
      let data = [];
      try {
        const dataFile = fs.readFileSync(dataFilePath, 'utf8');
        data = JSON.parse(dataFile);
      } catch (error) {
        console.error(error);
        return data;
      }

      event.reply('Screen-data', data);
      // event.reply('Screen-data', dataFilePath);
    }

    //to open interactive content
    if (arg.event == 'H5pOpen') {
      // let child: BrowserWindow | null = null;

      const exePath = app.isPackaged
        ? path.join(__dirname, '../../../', arg.link)
        : path.join(__dirname, '../../', arg.link);

      console.log(exePath);

      let child: BrowserWindow | null = null;
      child = new BrowserWindow({
        // fullscreen: true,
        resizable: false,
        minimizable: false,
        parent: mainWindow,
        modal: true,

        webPreferences: {
          // fullscreen: true,
          nodeIntegration: true,
          contextIsolation: false,
          frame: false,
          javascript: true,
          webSecurity: false,
          allowRunningInsecureContent: true,
        },
      });
      child.setMenuBarVisibility(false);
      child.loadFile(exePath);

      child.on('ready-to-show', () => {
        if (!child) {
          throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
          child.maximize();
        } else {
          child.maximize();
          // child.show();
        }
        updateAnalyticsData(`Opened interactive content: ${arg.name}`); //update analytics
      });

      child.on('closed', (code: any) => {
        updateAnalyticsData(`Closed interactive content: ${arg.name}`); //update analytics
        console.log(`Child process exited with code ${code}`);
      });
    }

    ///open topics of QUiz
    // if (arg.event == 'QuizOpen') {
    //   const dataFilePath = app.isPackaged
    //     ? path.join(__dirname, '../../../', arg.link)
    //     : path.join(__dirname, '../../', arg.link);

    //   // path.join(__dirname, '../data/', arg.link + '.json');
    //   // const dataFilePath = path.join(__dirname);

    //   console.log(dataFilePath);
    //   // event.reply('Screen-data', dataFilePath);
    //   let data = [];
    //   try {
    //     const dataFile = fs.readFileSync(dataFilePath, 'utf8');
    //     data = JSON.parse(dataFile);
    //     // console.log(data);
    //   } catch (error) {
    //     console.error(error);
    //     return data;
    //   }

    //   // event.reply('Screen-data', data);
    //   // event.reply('Screen-data', dataFilePath);
    // }

    if (arg.event == 'open-link') {
      shell.openExternal(arg.link);
    }
    if (arg.event == 'close') {
      console.log('Quitting from X component');
      // updateAnalyticsData('Logged out from the system');
      // store.delete('user');
      app.quit();
    }
  });
};

//pass the quiz content like Question & Option to frontend
ipcMain.on('Quiz-data', async (event, arg) => {
  if (arg.event == 'GetQuizQuestion') {
    const dataFilePath = app.isPackaged
      ? path.join(__dirname, '../../../', arg.link)
      : path.join(__dirname, '../../', arg.link);

    // path.join(__dirname, '../data/', arg.link + '.json');
    // const dataFilePath = path.join(__dirname);

    console.log(dataFilePath);
    // event.reply('Screen-data', dataFilePath);
    let data = [];
    try {
      const dataFile = fs.readFileSync(dataFilePath, 'utf8');
      data = JSON.parse(dataFile);
      // console.log(data);
    } catch (error) {
      console.error(error);
      return data;
    }

    event.reply('Quiz-data', data);
    // event.reply('Screen-data', dataFilePath);
  }
});

// Usage of the function in the 'Analytics' event handler
ipcMain.on('Analytics', async (event, arg) => {
  // Call the function to update the analytics data
  updateAnalyticsData(arg.details);
});

ipcMain.on('searchValue', async (event, arg) => {
  const folderPath = app.isPackaged
    ? path.join(__dirname, '../../../assets/data/')
    : path.join(__dirname, '../../assets/data/');
  console.log(folderPath);

  const jsonFilePaths = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith('.json') && file !== 'liscense.json')
    .map((file) => path.join(folderPath, file));

  let mergedData: any[] = [];
  jsonFilePaths.forEach((filePath) => {
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileData);
      mergedData = mergedData.concat(jsonData);
    } catch (error) {
      console.error(`Error parsing JSON in file ${filePath}:`, error);
    }
  });

  event.reply('jsonData', mergedData);
});
/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    // updateAnalyticsData('Logged out from the system');
    // store.delete('user');
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch(console.log);
