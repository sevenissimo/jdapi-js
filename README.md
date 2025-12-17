# MyJDownloader API for JavaScript (ESM) Client

The `MyJDownloader API for JavaScript (ESM) Client` library is a modern, pragmatic implementation that provides a complete and secure interface for communicating with the remote My.JDownloader API. It acts as a **reliable API base** for building **modern clients** (e.g., web dashboards, CLI tools, or automation scripts). It allows users to manage and automate all JDownloader functionalities (such as adding links, managing downloads, and controlling devices) via JavaScript code.

## Rationale

I found the official [MyJDownloader documentation](https://my.jdownloader.org/developers/index.html) **incomplete, imprecise, outdated, and unreliable**, making development based solely on it highly impractical.

> "The API changes regularly, changes in this document will happen every so often" - MyJDownloader Developers

This project was initiated by porting the proven and reliable logic from the [My.Jdownloader-API-Python-Library](https://github.com/mmarquezs/My.Jdownloader-API-Python-Library) to ensure stability and correctness in the JavaScript environment.

## Features

* **Standard ES Modules**: Import directly in Node.js (v18+) or modern browsers.

* **Zero Dependencies**: Relies on native `crypto.subtle` and `fetch` API.

* **Security**: Handles the mandatory API security procedure using **AES128CBC** encryption and **HMAC-SHA256** for message integrity.

* **Async/Await**: Fully asynchronous architecture.

* **Direct Connection**: Support for local IP connection with automatic fallback to Relay.

## Installation

```bash
npm install
```

## Usage

```javascript
import { MyJDApi } from './myjdapi.js';

(async () => {
    const api = new MyJDApi();
    
    // 1. Set the application key (optional, but recommended)
    api.setAppKey("My_New_JD_CLient_0.1"); 
    
    // 2. Connect using username and password (connection updates devices internally)
    await api.connect("email@example.com", "password");
    
    // 3. Get a specific device by name (e.g., your PC name)
    const deviceName = "MyPC";
    const device = api.getDevice(deviceName); 
    
    if (!device) {
        console.error(`Device not found: ${deviceName}`);
        return;
    }
    
    // 4. Query the packages list from the download queue
    const queryParams = {
        "bytesLoaded" : true,
        "bytesTotal" : true,
        "comment" : false,
        "enabled" : true,
        "eta" : true,
        "priority" : false,
        "finished" : true,
        "running" : true,
        "speed" : true,
        "status" : true,
        "childCount" : true,
        "hosts" : true,
        "saveTo" : true,
        "maxResults" : -1,
        "startAt" : 0,
    };

    const packages = await device.downloads.queryPackages([queryParams]);

    console.log(`Successfully retrieved ${packages.length} packages from device:`, device.name);
    // console.log(packages); // Uncomment to see package details
})();
```

## Development

* **Build**: Minify and bundle using esbuild.
```bash
npm run build
```

* **Docs**: Generate JSDoc documentation.
```bash
npm run doc
```

## Credits

This library is a direct port of the Python library created by **mmarquezs**.
Original Repo: [My.Jdownloader-API-Python-Library](https://github.com/mmarquezs/My.Jdownloader-API-Python-Library)
