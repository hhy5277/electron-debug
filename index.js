'use strict';
const {app, BrowserWindow} = require('electron');
const localShortcut = require('electron-localshortcut');
const isDev = require('electron-is-dev');

const isMacOS = process.platform === 'darwin';

const devToolsOptions = {};

function toggleDevTools(win = BrowserWindow.getFocusedWindow()) {
	if (win) {
		const {webContents} = win;
		if (webContents.isDevToolsOpened()) {
			webContents.closeDevTools();
		} else {
			webContents.openDevTools(devToolsOptions);
		}
	}
}

function devTools(win = BrowserWindow.getFocusedWindow()) {
	if (win) {
		toggleDevTools(win);
	}
}

function openDevTools(win = BrowserWindow.getFocusedWindow()) {
	if (win) {
		win.webContents.openDevTools(devToolsOptions);
	}
}

function refresh(win = BrowserWindow.getFocusedWindow()) {
	if (win) {
		win.webContents.reloadIgnoringCache();
	}
}

function inspectElements() {
	const win = BrowserWindow.getFocusedWindow();
	const inspect = () => {
		win.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()');
	};

	if (win) {
		if (win.webContents.isDevToolsOpened()) {
			inspect();
		} else {
			win.webContents.once('devtools-opened', inspect);
			win.openDevTools();
		}
	}
}

const addExtensionIfInstalled = (name, getPath) => {
	const isExtensionInstalled = name => {
		return BrowserWindow.getDevToolsExtensions &&
			{}.hasOwnProperty.call(BrowserWindow.getDevToolsExtensions(), name);
	};

	try {
		if (!isExtensionInstalled(name)) {
			BrowserWindow.addDevToolsExtension(getPath(name));
		}
	} catch (_) {}
};

module.exports = options => {
	options = {
		isEnabled: null,
		showDevTools: true,
		devToolsMode: 'undocked',
		...options
	};

	if (options.isEnabled === false || (options.isEnabled === null && !isDev)) {
		return;
	}

	if (options.devToolsMode !== 'previous') {
		devToolsOptions.mode = options.devToolsMode;
	}

	app.on('browser-window-created', (event, win) => {
		if (options.showDevTools) {
			win.webContents.once('devtools-opened', () => {
				// Workaround for https://github.com/electron/electron/issues/13095
				setImmediate(() => {
					win.focus();
				});
			});

			/// Workaround for https://github.com/electron/electron/issues/12438
			win.webContents.once('dom-ready', () => {
				openDevTools(win, options.showDevTools);
			});
		}
	});

	(async () => {
		await app.whenReady();

		addExtensionIfInstalled('devtron', name => require(name).path);
		addExtensionIfInstalled('electron-react-devtools', name => require(name).path);

		localShortcut.register('CommandOrControl+Shift+C', inspectElements);
		localShortcut.register(isMacOS ? 'Command+Alt+I' : 'Control+Shift+I', devTools);
		localShortcut.register('F12', devTools);

		localShortcut.register('CommandOrControl+R', refresh);
		localShortcut.register('F5', refresh);
	})();
};

// TODO: Remove this for the next major release
module.exports.default = module.exports;

module.exports.refresh = refresh;
module.exports.devTools = devTools;
module.exports.openDevTools = openDevTools;
