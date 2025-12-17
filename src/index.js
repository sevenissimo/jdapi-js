/**
 * Main logic for MyJDownloader API in Modern JS using crypto.subtle
 */
import {
    MYJDException,
    MYJDApiException,
    MYJDConnectionException,
    MYJDDecodeException,
    MYJDDeviceNotFoundException
} from './exception.js';

// --- Crypto Utils ---
/**
 * @constant
 * @type {TextEncoder}
 * @description Global TextEncoder instance for string-to-bytes conversion.
 */
const ENC = new TextEncoder();
/**
 * @constant
 * @type {TextDecoder}
 * @description Global TextDecoder instance for bytes-to-string conversion.
 */
const DEC = new TextDecoder();

/**
 * Converts an ArrayBuffer to its hexadecimal string representation.
 * @param {ArrayBuffer} buffer - The buffer to convert.
 * @returns {string} The hexadecimal string.
 */
function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a hexadecimal string to an ArrayBuffer.
 * @param {string} hex - The hexadecimal string.
 * @returns {ArrayBuffer} The resulting buffer.
 */
function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * @param {string} base64 - The Base64 string.
 * @returns {ArrayBuffer} The resulting buffer.
 */
function base64ToBuffer(base64) {
    const binString = atob(base64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param {ArrayBuffer} buffer - The buffer to convert.
 * @returns {string} The Base64 string.
 */
function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Concatenates multiple ArrayBuffers or Uint8Arrays into a single Uint8Array.
 * @param {...(ArrayBuffer|Uint8Array)} buffers - Buffers to concatenate.
 * @returns {Uint8Array} The concatenated buffer.
 */
function concatBuffers(...buffers) {
    const totalLen = buffers.reduce((acc, b) => acc + (b.byteLength || b.length), 0);
    const tmp = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of buffers) {
        const u8 = b instanceof Uint8Array ? b : new Uint8Array(b);
        tmp.set(u8, offset);
        offset += u8.length;
    }
    return tmp;
}

// --- Classes ---

/**
 * @class
 * @description Provides methods to manage JDownloader accounts (premium hoster accounts and basic authentication credentials) on a specific device.
 */
export class Accounts {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/accountsV2";
    }

    /**
     * Adds a new premium account to JDownloader.
     * @param {string} premiumHoster - The hoster name (e.g., 'uploaded.net').
     * @param {string} username - The username for the account.
     * @param {string} password - The password for the account.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async addAccount(premiumHoster, username, password) {
        const params = [premiumHoster, username, password];
        return await this.device.action(this.url + "/addAccount", params);
    }

    /**
     * Adds basic authentication credentials (e.g., for file access via HTTP/FTP).
     * @param {string} type - The type of basic auth (e.g., 'HTTP', 'FTP').
     * @param {string} hostmask - The host or hostmask (e.g., 'example.com').
     * @param {string} username - The basic auth username.
     * @param {string} password - The basic auth password.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async addBasicAuth(type, hostmask, username, password) {
        const params = [type, hostmask, username, password];
        return await this.device.action(this.url + "/addBasicAuth", params);
    }

    /**
     * Disables the specified accounts by their IDs.
     * @param {number[]} accountIds - List of account UUIDs (as numbers) to disable.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async disableAccounts(accountIds) {
        const params = [accountIds];
        return await this.device.action(this.url + "/disableAccounts", params);
    }

    /**
     * Enables the specified accounts by their IDs.
     * @param {number[]} accountIds - List of account UUIDs (as numbers) to enable.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async enableAccounts(accountIds) {
        const params = [accountIds];
        return await this.device.action(this.url + "/enableAccounts", params);
    }

    /**
     * Retrieves the URL for a specific premium hoster login page.
     * @param {string} hoster - The hoster name.
     * @returns {Promise<string>} A promise that resolves to the hoster URL string.
     */
    async getPremiumHosterUrl(hoster) {
        const params = [hoster];
        return await this.device.action(this.url + "/getPremiumHosterUrl", params);
    }

    /**
     * Lists all premium accounts, optionally filtering the returned data fields.
     * @param {Object[]} [query] - An array of query objects defining what data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of account objects.
     */
    async listAccounts(query = [{
        "startAt": 0,
        "maxResults": -1,
        "userName": true,
        "validUntil": true,
        "trafficLeft": true,
        "trafficMax": true,
        "enabled": true,
        "valid": true,
        "error": false,
        "UUIDList": [],
    }]) {
        return await this.device.action(this.url + "/listAccounts", query);
    }

    /**
     * Lists all configured basic authentication credentials.
     * @returns {Promise<Object[]>} A promise that resolves to an array of basic auth objects.
     */
    async listBasicAuth() {
        return await this.device.action(this.url + "/listBasicAuth");
    }

    /**
     * Lists all supported premium hosters.
     * @returns {Promise<string[]>} A promise that resolves to an array of hoster names.
     */
    async listPremiumHoster() {
        return await this.device.action(this.url + "/listPremiumHoster");
    }

    /**
     * Lists all URLs of supported premium hosters.
     * @returns {Promise<Object>} A promise that resolves to an object mapping hoster names to URLs.
     */
    async listPremiumHosterUrls() {
        return await this.device.action(this.url + "/listPremiumHosterUrls");
    }

    /**
     * Forces a refresh check for the validity/traffic of the specified accounts.
     * @param {number[]} accountIds - List of account UUIDs (as numbers) to refresh.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async refreshAccounts(accountIds) {
        const params = [accountIds];
        return await this.device.action(this.url + "/refreshAccounts", params);
    }

    /**
     * Removes the specified accounts by their IDs.
     * @param {number[]} accountIds - List of account UUIDs (as numbers) to remove.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async removeAccounts(accountIds) {
        const params = [accountIds];
        return await this.device.action(this.url + "/removeAccounts", params);
    }

    /**
     * Removes the specified basic authentication entries by their IDs.
     * @param {number[]} accountIds - List of basic auth UUIDs (as numbers) to remove.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async removeBasicAuths(accountIds) {
        const params = [accountIds];
        return await this.device.action(this.url + "/removeBasicAuths", params);
    }

    /**
     * Updates the username and/or password for an existing premium account.
     * @param {number} accountId - The account UUID (as a number).
     * @param {string} username - The new username.
     * @param {string} password - The new password.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async setUserNameAndPassword(accountId, username, password) {
        const params = [accountId, username, password];
        return await this.device.action(this.url + "/setUserNameAndPassword", params);
    }

    /**
     * Updates an existing basic authentication entry.
     * @param {Object} basicAuth - The complete basic auth object with updated fields.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async updateBasicAuth(basicAuth) {
        return await this.device.action(this.url + "/updateBasicAuth", basicAuth);
    }
}

/**
 * @class
 * @description Provides methods for system-level operations on the JDownloader client (e.g., shutdown, restart, hibernation).
 */
export class System {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/system';
    }

    /**
     * Stops JDownloader (exits the application).
     * @returns {Promise<boolean>} A promise that resolves to true if the operation was initiated successfully.
     */
    async exitJD() {
        return await this.device.action(this.url + "/exitJD");
    }

    /**
     * Restarts the JDownloader application.
     * @returns {Promise<boolean>} A promise that resolves to true if the operation was initiated successfully.
     */
    async restartJD() {
        return await this.device.action(this.url + "/restartJD");
    }

    /**
     * Commands the underlying operating system to hibernate (suspend to disk).
     * @returns {Promise<boolean>} A promise that resolves to true if the operation was initiated successfully.
     */
    async hibernateOS() {
        return await this.device.action(this.url + "/hibernateOS");
    }

    /**
     * Commands the underlying operating system to shutdown.
     * @param {boolean} force - If true, forces the shutdown, bypassing confirmation dialogues.
     * @returns {Promise<boolean>} A promise that resolves to true if the operation was initiated successfully.
     */
    async shutdownOS(force) {
        const params = force; 
        return await this.device.action(this.url + "/shutdownOS", params);
    }

    /**
     * Commands the underlying operating system to standby (suspend to RAM).
     * @returns {Promise<boolean>} A promise that resolves to true if the operation was initiated successfully.
     */
    async standbyOS() {
        return await this.device.action(this.url + "/standbyOS");
    }

    /**
     * Retrieves storage information about the file system where JDownloader is running,
     * including free and total space.
     * @returns {Promise<Object>} A promise that resolves to an object containing storage details.
     */
    async getStorageInfo() {
        return await this.device.action(this.url + "/getStorageInfos?path");
    }
}

/**
 * @class
 * @description Provides basic information about the JDownloader core itself.
 */
export class JD {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/jd';
    }

    /**
     * Retrieves the current core revision number of the JDownloader client.
     * @returns {Promise<number>} A promise that resolves to the core revision number.
     */
    async getCoreRevision() {
        return await this.device.action(this.url + "/getCoreRevision");
    }
}

/**
 * @class
 * @description Provides methods to manage JDownloader updates.
 */
export class Update {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/update';
    }

    /**
     * Restarts JDownloader and immediately starts the update process.
     * @returns {Promise<boolean>} A promise that resolves to true if the update was initiated.
     */
    async restartAndUpdate() {
        return await this.device.action(this.url + "/restartAndUpdate");
    }

    /**
     * Forces JDownloader to run a check for new updates.
     * @returns {Promise<boolean>} A promise that resolves after the check is started.
     */
    async runUpdateCheck() {
        return await this.device.action(this.url + "/runUpdateCheck");
    }

    /**
     * Checks if updates are currently available after a check has been performed.
     * @returns {Promise<boolean>} A promise that resolves to true if updates are available.
     */
    async isUpdateAvailable() {
        return await this.device.action(this.url + "/isUpdateAvailable");
    }

    /**
     * Runs an update check and then returns whether an update is available.
     * @returns {Promise<boolean>} A promise that resolves to true if updates are available.
     */
    async updateAvailable() {
        await this.runUpdateCheck();
        return await this.isUpdateAvailable();
    }
}

/**
 * @class
 * @description Provides methods to read and modify configuration settings of JDownloader.
 */
export class Config {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/config';
    }

    /**
     * Lists all configurable settings interfaces.
     * @param {Object} [params=null] - Optional parameters for listing.
     * @returns {Promise<Object>} A promise that resolves to an object listing configuration interfaces.
     */
    async list(params = null) {
        if (params !== null) {
            return await this.device.action(this.url + "/list");
        }
        return await this.device.action(this.url + "/list", params);
    }

    /**
     * Lists possible values for an enum configuration type.
     * @param {string} type - The enum type name.
     * @returns {Promise<Object[]>} A promise that resolves to an array of possible enum values.
     */
    async listEnum(type) {
        return await this.device.action(this.url + "/listEnum", [type]);
    }

    /**
     * Retrieves the current value of a specific configuration key.
     * @param {string} interfaceName - The name of the configuration interface (e.g., 'org.jdownloader.settings.GeneralSettings').
     * @param {string} storage - The storage name (e.g., 'default').
     * @param {string} key - The key of the configuration item.
     * @returns {Promise<any>} A promise that resolves to the configuration value (string, number, boolean, or object).
     */
    async get(interfaceName, storage, key) {
        const params = [interfaceName, storage, key];
        return await this.device.action(this.url + "/get", params);
    }

    /**
     * Retrieves the default value of a specific configuration key.
     * @param {string} interfaceName - The name of the configuration interface.
     * @param {string} storage - The storage name.
     * @param {string} key - The key of the configuration item.
     * @returns {Promise<any>} A promise that resolves to the default configuration value.
     */
    async getDefault(interfaceName, storage, key) {
        const params = [interfaceName, storage, key];
        return await this.device.action(this.url + "/getDefault", params);
    }

    /**
     * Queries configuration settings based on filtering criteria.
     * @param {Object[]} [params] - An array of query objects defining what data fields to retrieve and filter.
     * @returns {Promise<Object[]>} A promise that resolves to an array of matching configuration objects.
     */
    async query(params = [{
        "configInterface": "",
        "defaultValues": true,
        "description": true,
        "enumInfo": true,
        "includeExtensions": true,
        "pattern": "",
        "values": true
    }]) {
        return await this.device.action(this.url + "/query", params);
    }

    /**
     * Resets a specific configuration key to its default value.
     * @param {string} interfaceName - The name of the configuration interface.
     * @param {string} storage - The storage name.
     * @param {string} key - The key of the configuration item to reset.
     * @returns {Promise<boolean>} A promise that resolves to true upon successful reset.
     */
    async reset(interfaceName, storage, key) {
        const params = [interfaceName, storage, key];
        return await this.device.action(this.url + "/reset", params);
    }

    /**
     * Sets the value of a specific configuration key.
     * @param {string} interfaceName - The name of the configuration interface.
     * @param {string} storage - The storage name.
     * @param {string} key - The key of the configuration item to set.
     * @param {any} value - The new value (string, number, boolean, or object).
     * @returns {Promise<boolean>} A promise that resolves to true upon successful setting.
     */
    async set(interfaceName, storage, key, value) {
        const params = [interfaceName, storage, key, value];
        return await this.device.action(this.url + "/set", params);
    }
}

/**
 * @class
 * @description Provides methods to control the overall download process (start, stop, pause, speed).
 */
export class DownloadController {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/downloadcontroller';
    }

    /**
     * Starts all pending downloads in JDownloader.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async startDownloads() {
        return await this.device.action(this.url + "/start");
    }

    /**
     * Stops all active downloads in JDownloader.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async stopDownloads() {
        return await this.device.action(this.url + "/stop");
    }

    /**
     * Pauses or unpauses all downloads.
     * @param {boolean} value - True to pause, false to unpause.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async pauseDownloads(value) {
        const params = [value];
        return await this.device.action(this.url + "/pause", params);
    }

    /**
     * Retrieves the current aggregate download speed in Bytes per second.
     * @returns {Promise<number>} A promise that resolves to the current download speed (Bps).
     */
    async getSpeedInBytes() {
        return await this.device.action(this.url + "/getSpeedInBps");
    }

    /**
     * Forces the download of specific links or packages, interrupting the current queue order.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers) to force download.
     * @param {number[]} packageIds - Array of package UUIDs (as numbers) to force download.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async forceDownload(linkIds, packageIds) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/forceDownload", params);
    }

    /**
     * Retrieves the current state of the download controller (e.g., 'STOPPED', 'RUNNING', 'PAUSED').
     * @returns {Promise<string>} A promise that resolves to the current state string.
     */
    async getCurrentState() {
        return await this.device.action(this.url + "/getCurrentState");
    }
}

/**
 * @class
 * @description Provides methods to manage JDownloader extensions and add-ons.
 */
export class Extension {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/extensions";
    }

    /**
     * Lists all installed and available extensions, optionally filtering the returned data.
     * @param {Object[]} [params] - An array of query objects defining data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of extension information objects.
     */
    async list(params = [{
        "configInterface": true,
        "description": true,
        "enabled": true,
        "iconKey": true,
        "name": true,
        "pattern": "",
        "installed": true
    }]) {
        return await this.device.action(this.url + "/list", params);
    }

    /**
     * Installs an extension by its ID (if available).
     * @param {string} id - The unique ID of the extension to install.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async install(id) {
        return await this.device.action(this.url + "/install", [id]);
    }

    /**
     * Checks if a specific extension is installed.
     * @param {string} id - The unique ID of the extension.
     * @returns {Promise<boolean>} A promise that resolves to true if the extension is installed.
     */
    async isInstalled(id) {
        return await this.device.action(this.url + "/isInstalled", [id]);
    }

    /**
     * Checks if a specific extension is currently enabled.
     * @param {string} id - The unique ID of the extension.
     * @returns {Promise<boolean>} A promise that resolves to true if the extension is enabled.
     */
    async isEnabled(id) {
        return await this.device.action(this.url + "/isEnabled", [id]);
    }

    /**
     * Enables or disables a specific extension.
     * @param {string} id - The unique ID of the extension.
     * @param {boolean} enabled - True to enable, false to disable.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async setEnabled(id, enabled) {
        return await this.device.action(this.url + "/setEnabled", [id, enabled]);
    }
}

/**
 * @class
 * @description Provides methods to manage JDownloader dialogs (e.g., captchas, configuration prompts) that require user interaction.
 */
export class Dialog {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/dialogs";
    }

    /**
     * Submits an answer to a pending dialog/prompt.
     * @param {number} id - The ID of the dialog to answer.
     * @param {Object} data - The answer data object specific to the dialog type.
     * @returns {Promise<boolean>} A promise that resolves to true if the answer was submitted.
     */
    async answer(id, data) {
        return await this.device.action(this.url + "/answer", [id, data]);
    }

    /**
     * Retrieves detailed information about a specific dialog, optionally including the icon and properties.
     * @param {number} id - The ID of the dialog.
     * @param {boolean} [icon=true] - Whether to retrieve icon data.
     * @param {boolean} [properties=true] - Whether to retrieve properties data.
     * @returns {Promise<Object>} A promise that resolves to the detailed dialog object.
     */
    async get(id, icon = true, properties = true) {
        return await this.device.action(this.url + "/get", [id, icon, properties]);
    }

    /**
     * Retrieves static information about a specific dialog type.
     * @param {string} dialogType - The type identifier of the dialog.
     * @returns {Promise<Object>} A promise that resolves to the type information object.
     */
    async getTypeInfo(dialogType) {
        return await this.device.action(this.url + "/getTypeInfo", [dialogType]);
    }

    /**
     * Lists all currently active dialogs waiting for user input.
     * @returns {Promise<Object[]>} A promise that resolves to an array of active dialog objects.
     */
    async list() {
        return await this.device.action(this.url + "/list");
    }
}

/**
 * @class
 * @description Provides methods to manage the Linkgrabber tab (the area where links are collected and analyzed before being added to the download queue).
 */
export class Linkgrabber {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = '/linkgrabberv2';
    }

    /**
     * Clears all links and packages from the Linkgrabber list.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async clearList() {
        return await this.device.action(this.url + "/clearList", [], "POST");
    }

    /**
     * Moves specific links and/or packages from the Linkgrabber to the Download List.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers) to move.
     * @param {number[]} packageIds - Array of package UUIDs (as numbers) to move.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async moveToDownloadList(linkIds, packageIds) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/moveToDownloadlist", params);
    }

    /**
     * Queries specific links within the Linkgrabber packages, optionally filtering the returned data fields.
     * @param {Object[]} [params] - An array of query objects defining what data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of link objects.
     */
    async queryLinks(params = [{
        "bytesTotal": true,
        "comment": true,
        "status": true,
        "enabled": true,
        "maxResults": -1,
        "startAt": 0,
        "hosts": true,
        "url": true,
        "availability": true,
        "variantIcon": true,
        "variantName": true,
        "variantID": true,
        "variants": true,
        "priority": true
    }]) {
        return await this.device.action(this.url + "/queryLinks", params);
    }

    /**
     * Cleans up the Linkgrabber list based on defined criteria (e.g., removing duplicates, offline links).
     * @param {string} action - The cleanup action to perform.
     * @param {string} mode - The cleanup mode.
     * @param {string} selectionType - Defines if cleanup applies to links, packages, or both.
     * @param {number[]} [linkIds] - Optional array of specific link UUIDs to target.
     * @param {number[]} [packageIds] - Optional array of specific package UUIDs to target.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async cleanup(action, mode, selectionType, linkIds = [], packageIds = []) {
        let params = [linkIds, packageIds];
        params = params.concat([action, mode, selectionType]);
        return await this.device.action(this.url + "/cleanup", params);
    }

    /**
     * Adds a link container file (e.g., DLC, CCF, RSDF content as a base64 string) to the Linkgrabber.
     * @param {string} type_ - The type of container (e.g., 'DLC', 'TEXT').
     * @param {string} content - The file content (usually Base64 encoded).
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async addContainer(type_, content) {
        const params = [type_, content];
        return await this.device.action(this.url + "/addContainer", params);
    }

    /**
     * Retrieves the final download URLs for specified links or packages.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers).
     * @param {number[]} packageIds - Array of package UUIDs (as numbers).
     * @param {string} urlDisplayType - Specifies the format of the returned URL.
     * @returns {Promise<Object[]>} A promise that resolves to an array of URL objects.
     */
    async getDownloadUrls(linkIds, packageIds, urlDisplayType) {
        const params = [packageIds, linkIds, urlDisplayType];
        return await this.device.action(this.url + "/getDownloadUrls", params);
    }

    /**
     * Sets the priority for specified links or packages in the Linkgrabber.
     * @param {string} priority - The new priority (e.g., 'DEFAULT', 'HIGH', 'LOW').
     * @param {number[]} linkIds - Array of link UUIDs (as numbers).
     * @param {number[]} packageIds - Array of package UUIDs (as numbers).
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async setPriority(priority, linkIds, packageIds) {
        const params = [priority, linkIds, packageIds];
        return await this.device.action(this.url + "/setPriority", params);
    }

    /**
     * Enables or disables specified links or packages in the Linkgrabber.
     * @param {boolean} enable - True to enable, false to disable.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers).
     * @param {number[]} packageIds - Array of package UUIDs (as numbers).
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async setEnabled(enable, linkIds, packageIds) {
        const params = [enable, linkIds, packageIds];
        return await this.device.action(this.url + "/setEnabled", params);
    }

    /**
     * Retrieves available variants (e.g., different file mirrors or download options) for links/packages.
     * @param {Object} params - Query parameters to select links/packages.
     * @returns {Promise<Object[]>} A promise that resolves to an array of link variant objects.
     */
    async getVariants(params) {
        return await this.device.action(this.url + "/getVariants", params);
    }

    /**
     * Adds raw links to the Linkgrabber, providing package and configuration details.
     * @param {Object[]} [params] - An array of link objects containing links, package name, passwords, etc.
     * @returns {Promise<Object>} A promise that resolves to the API response object.
     */
    async addLinks(params = [{
        "autostart": false,
        "links": null,
        "packageName": null,
        "extractPassword": null,
        "priority": "DEFAULT",
        "downloadPassword": null,
        "destinationFolder": null,
        "overwritePackagizerRules": false
    }]) {
        return await this.device.action("/linkgrabberv2/addLinks", params);
    }

    /**
     * Checks if the Linkgrabber is currently busy collecting or analyzing links.
     * @returns {Promise<boolean>} A promise that resolves to true if collecting is in progress.
     */
    async isCollecting() {
        return await this.device.action(this.url + "/isCollecting");
    }

    /**
     * Removes specified links or packages from the Linkgrabber list.
     * @param {number[]} [linkIds] - Array of link UUIDs (as numbers) to remove.
     * @param {number[]} [packageIds] - Array of package UUIDs (as numbers) to remove.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async removeLinks(linkIds = [], packageIds = []) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/removeLinks", params);
    }

    /**
     * Retrieves the count of packages currently in the Linkgrabber.
     * @returns {Promise<number>} A promise that resolves to the package count.
     */
    async getPackageCount() {
        return await this.device.action("/linkgrabberv2/getPackageCount");
    }

    /**
     * Renames a specific package in the Linkgrabber.
     * @param {number} packageId - The UUID of the package to rename.
     * @param {string} newName - The new name for the package.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async renamePackage(packageId, newName) {
        const params = [packageId, newName];
        return await this.device.action(this.url + "/renamePackage", params);
    }

    /**
     * Queries packages in the Linkgrabber, optionally filtering the returned data fields.
     * @param {Object[]} [params] - An array of query objects defining what data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of package objects.
     */
    async queryPackages(params = [{
        "availableOfflineCount": true,
        "availableOnlineCount": true,
        "availableTempUnknownCount": true,
        "availableUnknownCount": true,
        "bytesTotal": true,
        "childCount": true,
        "comment": true,
        "enabled": true,
        "hosts": true,
        "maxResults": -1,
        "packageUUIDs": [],
        "priority": true,
        "saveTo": true,
        "startAt": 0,
        "status": true
    }]) {
        return await this.device.action(this.url + "/queryPackages", params);
    }

    /**
     * Renames a specific link within a package.
     * @param {number} linkId - The UUID of the link to rename.
     * @param {string} newName - The new name for the link.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async renameLink(linkId, newName) {
        const params = [linkId, newName];
        return await this.device.action(this.url + "/renameLink", params);
    }

    /**
     * Moves specified links into a brand new package with a defined name and path.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers) to move.
     * @param {number[]} packageIds - Array of package UUIDs (as numbers) to move.
     * @param {string} newPkgName - The name of the new package.
     * @param {string} downloadPath - The download path for the new package.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async moveToNewPackage(linkIds, packageIds, newPkgName, downloadPath) {
        const params = [linkIds, packageIds, newPkgName, downloadPath];
        return await this.device.action(this.url + "/movetoNewPackage", params);
    }

    /**
     * Retrieves the API help documentation for the Linkgrabber V2 interface.
     * @returns {Promise<Object>} A promise that resolves to the help documentation object.
     */
    async help() {
        return await this.device.action("/linkgrabberv2/help", [], "GET");
    }
    
    // NOTE: Other methods from the original structure (e.g., getChildrenChanged, getDownFolderHistorySelectBase, moveLinks, setVariant, movePackages, addVariantCopy) are implicitly omitted as they were not implemented in the base JS code.
}

/**
 * @class
 * @description Provides methods to manage the Downloads tab (the main download queue).
 */
export class Downloads {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/downloadsV2";
    }

    /**
     * Queries links within the download packages, optionally filtering the returned data fields.
     * @param {Object[]} [params] - An array of query objects defining what data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of link objects in the download queue.
     */
    async queryLinks(params = [{
        "addedDate": true,
        "bytesLoaded": true,
        "bytesTotal": true,
        "comment": true,
        "enabled": true,
        "eta": true,
        "extractionStatus": true,
        "finished": true,
        "finishedDate": true,
        "host": true,
        "jobUUIDs": [],
        "maxResults": -1,
        "packageUUIDs": [],
        "password": true,
        "priority": true,
        "running": true,
        "skipped": true,
        "speed": true,
        "startAt": 0,
        "status": true,
        "url": true
    }]) {
        return await this.device.action(this.url + "/queryLinks", params);
    }

    /**
     * Queries packages in the download list, optionally filtering the returned data fields.
     * @param {Object[]} [params] - An array of query objects defining what data fields to retrieve.
     * @returns {Promise<Object[]>} A promise that resolves to an array of package objects in the download queue.
     */
    async queryPackages(params = [{
        "bytesLoaded": true,
        "bytesTotal": true,
        "childCount": true,
        "comment": true,
        "enabled": true,
        "eta": true,
        "finished": true,
        "hosts": true,
        "maxResults": -1,
        "packageUUIDs": [],
        "priority": true,
        "running": true,
        "saveTo": true,
        "speed": true,
        "startAt": 0,
        "status": true
    }]) {
        return await this.device.action(this.url + "/queryPackages", params);
    }

    /**
     * Cleans up the Download list based on defined criteria (e.g., removing completed, failed, or offline links).
     * @param {string} action - The cleanup action to perform.
     * @param {string} mode - The cleanup mode.
     * @param {string} selectionType - Defines if cleanup applies to links, packages, or both.
     * @param {number[]} [linkIds] - Optional array of specific link UUIDs to target.
     * @param {number[]} [packageIds] - Optional array of specific package UUIDs to target.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async cleanup(action, mode, selectionType, linkIds = [], packageIds = []) {
        let params = [linkIds, packageIds];
        params = params.concat([action, mode, selectionType]);
        return await this.device.action(this.url + "/cleanup", params);
    }

    /**
     * Enables or disables specified links or packages in the download list.
     * @param {boolean} enable - True to enable, false to disable.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers).
     * @param {number[]} packageIds - Array of package UUIDs (as numbers).
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async setEnabled(enable, linkIds, packageIds) {
        const params = [enable, linkIds, packageIds];
        return await this.device.action(this.url + "/setEnabled", params);
    }

    /**
     * Forces the download of specific links or packages, interrupting the current queue order.
     * @param {number[]} [linkIds] - Array of link UUIDs (as numbers) to force download.
     * @param {number[]} [packageIds] - Array of package UUIDs (as numbers) to force download.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async forceDownload(linkIds = [], packageIds = []) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/forceDownload", params);
    }

    /**
     * Sets the download directory for specified packages.
     * @param {string} directory - The new absolute download path.
     * @param {number[]} [packageIds] - Array of package UUIDs (as numbers) to update.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async setDlLocation(directory, packageIds = []) {
        const params = [directory, packageIds];
        return await this.device.action(this.url + "/setDownloadDirectory", params);
    }

    /**
     * Removes specified links or packages from the download list (moving them to the trash).
     * @param {number[]} [linkIds] - Array of link UUIDs (as numbers) to remove.
     * @param {number[]} [packageIds] - Array of package UUIDs (as numbers) to remove.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async removeLinks(linkIds = [], packageIds = []) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/removeLinks", params);
    }

    /**
     * Resets the download status of specified links/packages, allowing them to be downloaded again.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers) to reset.
     * @param {number[]} packageIds - Array of package UUIDs (as numbers) to reset.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async resetLinks(linkIds, packageIds) {
        const params = [linkIds, packageIds];
        return await this.device.action(this.url + "/resetLinks", params);
    }

    /**
     * Moves specified links into a brand new package within the download list.
     * @param {number[]} linkIds - Array of link UUIDs (as numbers) to move.
     * @param {number[]} packageIds - Array of package UUIDs (as numbers) to move.
     * @param {string} newPkgName - The name of the new package.
     * @param {string} downloadPath - The download path for the new package.
     * @returns {Promise<boolean>} A promise that resolves to true upon success.
     */
    async moveToNewPackage(linkIds, packageIds, newPkgName, downloadPath) {
        const params = [linkIds, packageIds, newPkgName, downloadPath];
        return await this.device.action(this.url + "/movetoNewPackage", params);
    }
}

/**
 * @class
 * @description Provides methods to handle Captcha challenges requested by hosters.
 */
export class Captcha {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/captcha";
    }

    /**
     * Lists all pending captcha challenges waiting for a solution.
     * @returns {Promise<Object[]>} A promise that resolves to an array of captcha objects.
     */
    async list() {
        return await this.device.action(this.url + "/list", []);
    }

    /**
     * Retrieves detailed information, including the image (Base64 encoded), for a specific captcha challenge.
     * @param {number} captchaId - The ID of the captcha challenge.
     * @returns {Promise<Object>} A promise that resolves to the detailed captcha object.
     */
    async get(captchaId) {
        return await this.device.action(this.url + "/get", [captchaId]);
    }

    /**
     * Submits a solution for a specific captcha challenge.
     * @param {number} captchaId - The ID of the captcha challenge.
     * @param {string} solution - The text solution for the captcha.
     * @returns {Promise<boolean>} A promise that resolves to true upon successful submission.
     */
    async solve(captchaId, solution) {
        return await this.device.action(this.url + "/solve", [captchaId, solution]);
    }
}

/**
 * @class
 * @description Provides methods for controlling the reconnection process (used to get a new IP address).
 */
export class Reconnect {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/reconnect";
    }

    /**
     * Forces JDownloader to execute the configured reconnection method.
     * @returns {Promise<boolean>} A promise that resolves to true if the reconnection was initiated.
     */
    async doReconnect() {
        return await this.device.action(this.url + "/doReconnect");
    }
}

/**
 * @class
 * @description Provides access to the JDownloader GUI toolbar status and controls.
 */
export class Toolbar {
    /**
     * @constructor
     * @param {JDDevice} device - The JDDevice instance this controller is bound to.
     */
    constructor(device) {
        /** @type {JDDevice} */
        this.device = device;
        /** @type {string} */
        this.url = "/toolbar";
        /** @type {Object | null} */
        this.status = null;
    }

    /**
     * Retrieves the current status of the toolbar elements, including speed limit state.
     * @param {Object} [params=null] - Optional query parameters.
     * @returns {Promise<Object>} A promise that resolves to the toolbar status object.
     */
    async getStatus(params = null) {
        return await this.device.action(this.url + "/getStatus");
    }

    /**
     * Internal method to determine if the download speed limit is currently active.
     * @returns {Promise<number>} A promise that resolves to 1 if the limit is enabled, 0 otherwise.
     */
    async statusDownloadSpeedLimit() {
        this.status = await this.getStatus();
        return this.status['limit'] ? 1 : 0;
    }

    /**
     * Enables the configured download speed limit.
     * @returns {Promise<void>}
     */
    async enableDownloadSpeedLimit() {
        this.limitEnabled = await this.statusDownloadSpeedLimit();
        if (!this.limitEnabled) {
            await this.device.action(this.url + "/toggleDownloadSpeedLimit");
        }
    }

    /**
     * Disables the configured download speed limit.
     * @returns {Promise<void>}
     */
    async disableDownloadSpeedLimit() {
        this.limitEnabled = await this.statusDownloadSpeedLimit();
        if (this.limitEnabled) {
            await this.device.action(this.url + "/toggleDownloadSpeedLimit");
        }
    }
}


/**
 * @class
 * @description Represents a single JDownloader client instance (a device) accessible through MyJDownloader.
 * It encapsulates all device-specific API controllers (Accounts, Linkgrabber, etc.) and handles direct vs. remote connection logic.
 */
export class JDDevice {
    /**
     * @constructor
     * @param {MyJDApi} jd - The main MyJDApi instance.
     * @param {Object} deviceDict - The raw device information object from the MyJDApi `listdevices` response.
     */
    constructor(jd, deviceDict) {
        /** @type {string} */
        this.name = deviceDict["name"];
        /** @type {string} */
        this.deviceId = deviceDict["id"];
        /** @type {string} */
        this.deviceType = deviceDict["type"];
        /** @type {MyJDApi} */
        this.myJD = jd;

        // Initialize controllers
        /** @type {Accounts} */
        this.accounts = new Accounts(this);
        /** @type {Config} */
        this.config = new Config(this);
        /** @type {Linkgrabber} */
        this.linkgrabber = new Linkgrabber(this);
        /** @type {Captcha} */
        this.captcha = new Captcha(this);
        /** @type {Downloads} */
        this.downloads = new Downloads(this);
        /** @type {Toolbar} */
        this.toolbar = new Toolbar(this);
        /** @type {DownloadController} */
        this.downloadcontroller = new DownloadController(this);
        /** @type {Extension} */
        this.extensions = new Extension(this);
        /** @type {Dialog} */
        this.dialogs = new Dialog(this);
        /** @type {Reconnect} */
        this.reconnect = new Reconnect(this);
        /** @type {Update} */
        this.update = new Update(this);
        /** @type {System} */
        this.system = new System(this);
        /** @type {Object[] | null} */
        this._directConnectionInfo = null;
        /** @type {boolean} */
        this._directConnectionEnabled = true;
        /** @type {number} */
        this._directConnectionCooldown = 0;
        /** @type {number} */
        this._directConnectionConsecutiveFailures = 0;
        
        // Init async background refresh
        this._refreshDirectConnections();
    }

    /**
     * Retrieves the current direct connection details (IP, port) from the MyJDownloader server.
     * This is crucial for attempting local/direct communication instead of routing everything through the MyJDownloader cloud.
     * @private
     * @returns {Promise<void>}
     */
    async _refreshDirectConnections() {
        if (this.myJD.getConnectionType() === "remoteapi") {
            return;
        }
        const response = await this.myJD.requestApi("/device/getDirectConnectionInfos",
            "POST", null, this._actionUrl());
        
        if (response && response['data'] && response['data']['infos'] && response['data']['infos'].length !== 0) {
            this._updateDirectConnections(response['data']['infos']);
        }
    }

    /**
     * Updates the internal list of direct connection information, managing cooldown status.
     * @private
     * @param {Object[]} directInfo - New list of direct connection objects.
     * @returns {void}
     */
    _updateDirectConnections(directInfo) {
        let tmp = [];
        if (this._directConnectionInfo === null) {
            for (const conn of directInfo) {
                tmp.push({'conn': conn, 'cooldown': 0});
            }
            this._directConnectionInfo = tmp;
            return;
        }

        this._directConnectionInfo = this._directConnectionInfo.filter(i => {
             const exists = directInfo.some(d => JSON.stringify(d) === JSON.stringify(i['conn']));
             if(exists) {
                 directInfo = directInfo.filter(d => JSON.stringify(d) !== JSON.stringify(i['conn']));
                 return true;
             }
             return false;
        });

        for (const conn of directInfo) {
            this._directConnectionInfo.push({'conn': conn, 'cooldown': 0});
        }
    }

    /**
     * Enables attempts to connect directly to the JDownloader client, bypassing the cloud API when possible.
     * @returns {Promise<void>}
     */
    async enableDirectConnection() {
        this._directConnectionEnabled = true;
        await this._refreshDirectConnections();
    }

    /**
     * Disables the direct connection attempts, forcing all communication through the MyJDownloader cloud API.
     * @returns {void}
     */
    disableDirectConnection() {
        this._directConnectionEnabled = false;
        this._directConnectionInfo = null;
    }

    /**
     * Performs an action (API command) on the JDownloader device. This method handles encryption,
     * action URL generation, and attempts direct connection if enabled before falling back to the cloud.
     * @param {string} path - The specific API endpoint path (e.g., '/linkgrabberv2/queryLinks').
     * @param {any[]} [params] - Array of parameters for the API command.
     * @param {string} [httpAction='POST'] - The HTTP method to use (usually 'POST' for device actions).
     * @returns {Promise<Object>} A promise that resolves to the 'data' part of the decrypted API response.
     * @throws {MYJDConnectionException|MYJDApiException}
     */
    async action(path, params = [], httpAction = "POST") {
        let actionUrl = null;
        if (this.myJD.getConnectionType() !== "remoteapi") {
            actionUrl = this._actionUrl();
        }

        const now = Date.now() / 1000;

        // 1. Check for direct connection feasibility
        if (!this._directConnectionEnabled || this._directConnectionInfo === null || now < this._directConnectionCooldown) {
            // Fallback to cloud API
            const response = await this.myJD.requestApi(path, httpAction, params, actionUrl);
            if (response === null) {
                throw new MYJDConnectionException("No connection established\n");
            } else {
                if (this._directConnectionEnabled && Date.now() / 1000 >= this._directConnectionCooldown) {
                    await this._refreshDirectConnections();
                }
                return response['data'];
            }
        } else {
            // 2. Attempt direct connection
            for (let i = 0; i < this._directConnectionInfo.length; i++) {
                const conn = this._directConnectionInfo[i];
                if (Date.now() / 1000 > conn['cooldown']) {
                    const connection = conn['conn'];
                    const api = "http://" + connection["ip"] + ":" + connection["port"];
                    const response = await this.myJD.requestApi(path, httpAction, params, actionUrl, api);
                    
                    if (response !== null) {
                        // Success: move to front of list and reset error state
                        this._directConnectionInfo.splice(i, 1);
                        this._directConnectionInfo.unshift(conn);
                        this._directConnectionConsecutiveFailures = 0;
                        return response['data'];
                    } else {
                        // Failure: apply cooldown for 60 seconds
                        conn['cooldown'] = (Date.now() / 1000) + 60;
                    }
                }
            }

            // 3. Direct connection failed for all addresses, fall back to cloud API and apply cooldown
            this._directConnectionConsecutiveFailures += 1;
            // Increase cooldown duration exponentially based on consecutive failures
            this._directConnectionCooldown = (Date.now() / 1000) + (60 * this._directConnectionConsecutiveFailures);

            const response = await this.myJD.requestApi(path, httpAction, params, actionUrl);
            if (response === null) {
                throw new MYJDConnectionException("No connection established\n");
            }
            await this._refreshDirectConnections(); // Refresh direct info after cloud success
            return response['data'];
        }
    }

    /**
     * Creates the unique action URL path required for sending encrypted commands to the device
     * via the MyJDownloader cloud endpoint.
     * @private
     * @returns {string} The formatted action URL part: '/t_<sessionToken>_<deviceId>'.
     */
    _actionUrl() {
        return "/t_" + this.myJD.getSessionToken() + "_" + this.deviceId;
    }
}

/**
 * @class
 * @description The main client class for interacting with the MyJDownloader API.
 * It manages authentication, encryption keys, sessions, and device discovery.
 */
export class MyJDApi {
    /**
     * @constructor
     */
    constructor() {
        /** @type {number} */
        this._requestId = Date.now();
        /** @type {string} */
        this._apiUrl = "https://api.jdownloader.org";
        /** @type {string} */
        this._appKey = "http://git.io/vmcsk";
        /** @type {string} */
        this._contentType = "application/aesjson-jd; charset=utf-8";
        /** @type {number} */
        this._apiVersion = 1;
        /** @type {Object[] | null} */
        this._devices = null;
        /** @type {ArrayBuffer | null} */
        this._loginSecret = null;
        /** @type {ArrayBuffer | null} */
        this._deviceSecret = null;
        /** @type {string | null} */
        this._sessionToken = null;
        /** @type {string | null} */
        this._regainToken = null;
        /** @type {ArrayBuffer | null} */
        this._serverEncryptionToken = null;
        /** @type {ArrayBuffer | null} */
        this._deviceEncryptionToken = null;
        /** @type {boolean} */
        this._connected = false;
        /** @type {number} */
        this._timeout = 3000;
        /** @type {('myjd' | 'remoteapi')} */
        this._connectionType = "myjd";
    }

    /**
     * Retrieves the current session token.
     * @returns {string | null} The active session token.
     */
    getSessionToken() {
        return this._sessionToken;
    }

    /**
     * Checks if a connection (cloud or direct) is currently established.
     * @returns {boolean} True if connected, false otherwise.
     */
    isConnected() {
        return this._connected;
    }

    /**
     * Sets a custom application key for API requests.
     * @param {string} appKey - The new application key.
     * @returns {void}
     */
    setAppKey(appKey) {
        this._appKey = appKey;
    }

    /**
     * Creates a cryptographic secret (key) used for authentication and token generation.
     * This uses SHA-256 hash of the concatenated lowercased email, password, and domain string.
     * @private
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @param {string} domain - The domain ('server' for login secret, 'device' for device secret).
     * @returns {Promise<ArrayBuffer>} A promise that resolves to the 32-byte SHA-256 hash buffer.
     */
    async _secretCreate(email, password, domain) {
        const data = ENC.encode(email.toLowerCase() + password + domain.toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return hashBuffer;
    }

    /**
     * Generates the new server and device encryption tokens after a successful connect or reconnect.
     * These are based on the session token and the respective base secrets (`_loginSecret` or `_deviceSecret`).
     * @private
     * @returns {Promise<void>}
     */
    async _updateEncryptionTokens() {
        if (this._connectionType === "remoteapi") return;

        let oldToken;
        // Server encryption token update
        if (this._serverEncryptionToken === null) {
            oldToken = this._loginSecret; // Use login secret for the first token
        } else {
            oldToken = this._serverEncryptionToken; // Use the previous token for subsequent updates (reconnect)
        }

        const sessionTokenBuffer = hexToBuffer(this._sessionToken);
        
        // serverEncryptionToken = SHA-256(oldToken + sessionToken)
        let input = concatBuffers(oldToken, sessionTokenBuffer);
        this._serverEncryptionToken = await crypto.subtle.digest('SHA-256', input);

        // deviceEncryptionToken = SHA-256(deviceSecret + sessionToken)
        input = concatBuffers(this._deviceSecret, sessionTokenBuffer);
        this._deviceEncryptionToken = await crypto.subtle.digest('SHA-256', input);
    }

    /**
     * Generates the HMAC-SHA256 signature required for GET requests to the MyJDownloader cloud API.
     * @private
     * @param {ArrayBuffer} keyBuffer - The encryption key (login or server encryption token).
     * @param {string} data - The raw URL query string (without the signature part).
     * @returns {Promise<string>} A promise that resolves to the hexadecimal representation of the signature.
     */
    async _signatureCreate(keyBuffer, data) {
        const key = await crypto.subtle.importKey(
            "raw", 
            keyBuffer, 
            { name: "HMAC", hash: "SHA-256" }, 
            false, 
            ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, ENC.encode(data));
        return bufferToHex(signature);
    }

    /**
     * Decrypts AES-CBC encrypted data received from the API using a specific secret token.
     * The first half of the secret token is used as the Initialization Vector (IV).
     * @private
     * @param {ArrayBuffer} secretTokenBuffer - The 32-byte token (server or device encryption token).
     * @param {string} dataBase64 - The Base64 encoded, encrypted payload.
     * @returns {Promise<string>} A promise that resolves to the decrypted JSON string.
     */
    async _decrypt(secretTokenBuffer, dataBase64) {
        if (this._connectionType === "remoteapi") {
            return dataBase64; 
        }

        const secretToken = new Uint8Array(secretTokenBuffer);
        const half = Math.floor(secretToken.length / 2);
        const initVector = secretToken.slice(0, half); // First 16 bytes as IV
        const keyRaw = secretToken.slice(half); // Last 16 bytes as Key

        const key = await crypto.subtle.importKey("raw", keyRaw, { name: "AES-CBC" }, false, ["decrypt"]);
        const encryptedData = base64ToBuffer(dataBase64);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: initVector },
            key,
            encryptedData
        );

        return DEC.decode(decryptedBuffer);
    }

    /**
     * Encrypts a JSON payload using AES-CBC encryption and a specific secret token.
     * @private
     * @param {ArrayBuffer} secretTokenBuffer - The 32-byte token (usually the device encryption token).
     * @param {string} dataStr - The raw JSON string to encrypt.
     * @returns {Promise<string>} A promise that resolves to the Base64 encoded, encrypted payload.
     */
    async _encrypt(secretTokenBuffer, dataStr) {
        if (this._connectionType === "remoteapi") {
            return dataStr;
        }

        const secretToken = new Uint8Array(secretTokenBuffer);
        const half = Math.floor(secretToken.length / 2);
        const initVector = secretToken.slice(0, half); // First 16 bytes as IV
        const keyRaw = secretToken.slice(half); // Last 16 bytes as Key

        const key = await crypto.subtle.importKey("raw", keyRaw, { name: "AES-CBC" }, false, ["encrypt"]);
        const encodedData = ENC.encode(dataStr);

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: "AES-CBC", iv: initVector },
            key,
            encodedData
        );

        return bufferToBase64(encryptedBuffer);
    }

    /**
     * Updates the request ID (rid) to the current timestamp. This ID is used for tracking requests
     * and preventing replay attacks.
     * @returns {void}
     */
    updateRequestId() {
        this._requestId = Date.now();
    }

    /**
     * Establishes a connection to the MyJDownloader cloud API using email and password.
     * This performs key derivation and fetches the initial session and regain tokens.
     * @param {string} email - The MyJDownloader account email.
     * @param {string} password - The MyJDownloader account password.
     * @returns {Promise<Object>} A promise that resolves to the initial connection response, containing tokens.
     * @throws {MYJDConnectionException|MYJDApiException}
     */
    async connect(email, password) {
        this.updateRequestId();
        // Reset all internal state and tokens
        this._loginSecret = null;
        this._deviceSecret = null;
        this._sessionToken = null;
        this._regainToken = null;
        this._serverEncryptionToken = null;
        this._deviceEncryptionToken = null;
        this._devices = null;
        this._connected = false;
        this._connectionType = "myjd";

        // Derive base secrets
        this._loginSecret = await this._secretCreate(email, password, "server");
        this._deviceSecret = await this._secretCreate(email, password, "device");

        const response = await this.requestApi("/my/connect", "GET", [
            ["email", email],
            ["appkey", this._appKey]
        ]);

        this._connected = true;
        this.updateRequestId();
        this._sessionToken = response["sessiontoken"];
        this._regainToken = response["regaintoken"];
        await this._updateEncryptionTokens();
        await this.updateDevices();
        return response;
    }

    /**
     * Establishes a direct connection to a JDownloader client via its IP and optional port.
     * This bypasses the MyJDownloader cloud entirely.
     * @param {string} ip - The IP address of the JDownloader client.
     * @param {number} [port=3128] - The port of the JDownloader client's API.
     * @param {number} [timeout=3000] - The connection timeout in milliseconds.
     * @returns {Promise<Object>} A promise that resolves to the API response object (usually { message: 'pong' }).
     * @throws {MYJDConnectionException|MYJDApiException}
     */
    async directConnect(ip, port = 3128, timeout = 3000) {
        this.updateRequestId();
        // Reset tokens (not needed for direct connect)
        this._loginSecret = null;
        this._deviceSecret = null;
        this._sessionToken = null;
        this._regainToken = null;
        this._serverEncryptionToken = null;
        this._deviceEncryptionToken = null;

        // Configure for remoteapi type
        this._devices = [{
            'name': ip,
            'id': 'direct',
            'type': 'jd'
        }];
        this._connectionType = "remoteapi";
        this._apiUrl = "http://" + ip + ":" + port;
        this._contentType = "application/json; charset=utf-8"; // Direct connect does not use AES/JSON payload
        this._timeout = timeout;
        this._connected = true; 
        
        // Attempt a ping to confirm connection
        const respFull = await this.requestApi("/device/ping", "GET", []);
        const response = respFull['data'];
        
        this._connected = !!response;
        this.updateRequestId();
        return response;
    }

    /**
     * Reconnects to the MyJDownloader cloud API using the regain token to refresh the session.
     * @returns {Promise<Object>} A promise that resolves to the new session details.
     * @throws {MYJDConnectionException|MYJDApiException}
     */
    async reconnect() {
        if (this._connectionType === "remoteapi") return true;

        const response = await this.requestApi("/my/reconnect", "GET", [
            ["sessiontoken", this._sessionToken],
            ["regaintoken", this._regainToken]
        ]);
        
        this.updateRequestId();
        this._sessionToken = response["sessiontoken"];
        this._regainToken = response["regaintoken"];
        await this._updateEncryptionTokens();
        return response;
    }

    /**
     * Disconnects from the MyJDownloader API, invalidating the current session.
     * @returns {Promise<Object | boolean>} A promise that resolves to the API response object or true if using direct connection.
     */
    async disconnect() {
        let response;
        if (this._connectionType === "remoteapi") {
            response = true;
        } else {
            response = await this.requestApi("/my/disconnect", "GET", [
                ["sessiontoken", this._sessionToken]
            ]);
        }
        
        // Clear all session-specific state
        this.updateRequestId();
        this._loginSecret = null;
        this._deviceSecret = null;
        this._sessionToken = null;
        this._regainToken = null;
        this._serverEncryptionToken = null;
        this._deviceEncryptionToken = null;
        this._devices = null;
        this._connected = false;
        return response;
    }

    /**
     * Fetches the current list of JDownloader devices connected to the account.
     * @returns {Promise<void>}
     * @throws {MYJDConnectionException|MYJDApiException}
     */
    async updateDevices() {
        if (this._connectionType === "remoteapi") return;
        const response = await this.requestApi("/my/listdevices", "GET", [
            ["sessiontoken", this._sessionToken]
        ]);
        this.updateRequestId();
        this._devices = response["list"];
    }

    /**
     * Returns the cached list of connected JDownloader devices.
     * @returns {Object[] | null} An array of device objects (name, id, type) or null if not fetched.
     */
    listDevices() {
        return this._devices;
    }

    /**
     * Retrieves a JDDevice instance, either by name, ID, or the first available device.
     * @param {string} [deviceName=null] - The name of the device to retrieve.
     * @param {string} [deviceId=null] - The ID of the device to retrieve.
     * @returns {JDDevice} An instance of the JDDevice class for the specified device.
     * @throws {MYJDConnectionException} If not connected.
     * @throws {MYJDDeviceNotFoundException} If the specified device is not found.
     */
    getDevice(deviceName = null, deviceId = null) {
        if (!this.isConnected()) {
            throw new MYJDConnectionException("No connection established\n");
        }
        if (deviceId !== null) {
            for (const device of this._devices) {
                if (device["id"] === deviceId) return new JDDevice(this, device);
            }
        } else if (deviceName !== null) {
            for (const device of this._devices) {
                if (device["name"] === deviceName) return new JDDevice(this, device);
            }
        } else if (this._devices.length > 0) {
            // Return the first device if no identifier is provided
            return new JDDevice(this, this._devices[0]);
        }
        throw new MYJDDeviceNotFoundException("Device not found\n");
    }

    /**
     * Executes a raw API request, handling the cryptographic signing, encryption, and decryption required by MyJDownloader.
     * @param {string} path - The API endpoint path (e.g., '/my/connect', '/downloadsV2/queryLinks').
     * @param {string} [httpMethod='GET'] - 'GET' for core MyJD calls, 'POST' for device-specific actions.
     * @param {any[] | null} [params=null] - URL parameters for GET, or request parameters for POST.
     * @param {string | null} [action=null] - The action URL fragment for device-specific POST calls (e.g., '/t_<token>_<id>').
     * @param {string | null} [api=null] - Overrides the base API URL (used for direct connections).
     * @returns {Promise<Object | null>} A promise that resolves to the decrypted and parsed JSON response object.
     * @throws {MYJDConnectionException} On network failure or if not connected.
     * @throws {MYJDDecodeException} If the response cannot be decrypted or parsed.
     * @throws {MYJDApiException} For API-specific errors (e.g., Auth Failed, Bad Parameters).
     */
    async requestApi(path, httpMethod = "GET", params = null, action = null, api = null) {
        if (!api) api = this._apiUrl;
        let data = null;

        if (!this.isConnected() && path !== "/my/connect") {
            throw new MYJDConnectionException("No connection established\n");
        }

        let encryptedResponse;
        let finalUrl;

        if (httpMethod === "GET") {
            let query = path + "?";
            if (params !== null) {
                for (const param of params) {
                    // Special handling for encryptedLoginSecret which is already URL encoded
                    if (param[0] !== "encryptedLoginSecret") {
                        query += `${param[0]}=${encodeURIComponent(param[1])}&`;
                    } else {
                        query += `&${param[0]}=${param[1]}&`;
                    }
                }
            }
            query += "rid=" + this._requestId;

            // Cloud API calls require cryptographic signature
            if (this._connectionType === "myjd") {
                let qList = [path + "?"];
                if (params) {
                    for(const p of params) {
                        if (p[0] !== "encryptedLoginSecret") qList.push(`${p[0]}=${encodeURIComponent(p[1])}`);
                        else qList.push(`&${p[0]}=${p[1]}`);
                    }
                }
                qList.push("rid=" + this._requestId);

                let sigData = qList[0] + qList.slice(1).join('&');
                let signature;

                // Sign using loginSecret initially, then serverEncryptionToken
                if (this._serverEncryptionToken === null) {
                    signature = await this._signatureCreate(this._loginSecret, sigData);
                } else {
                    signature = await this._signatureCreate(this._serverEncryptionToken, sigData);
                }
                
                query = sigData + "&signature=" + signature;
            } else {
                 // Direct API calls (remoteapi) do not require signatures on GETs
                 let qList = [path + "?"];
                 if (params) {
                    for(const p of params) {
                         if (p[0] !== "encryptedLoginSecret") qList.push(`${p[0]}=${encodeURIComponent(p[1])}`);
                         else qList.push(`&${p[0]}=${p[1]}`);
                    }
                 }
                 qList.push("rid=" + this._requestId);
                 query = qList[0] + qList.slice(1).join('&');
            }

            finalUrl = api + query;
            
            try {
                // Fetch with timeout
                const res = await fetch(finalUrl, { method: 'GET', signal: AbortSignal.timeout(this._timeout) });
                encryptedResponse = {
                    status: res.status,
                    text: await res.text()
                };
            } catch (e) {
                return null; 
            }

        } else {
            // POST - Used for device actions (encrypted payload)
            const paramsRequest = {
                "apiVer": this._apiVersion,
                "url": path,
                "params": this._adaptParamsForRequest(params),
                "rid": this._requestId
            };
            
            data = JSON.stringify(paramsRequest);
            // Fixes API quirk where 'null' is serialized as '"null"' when part of the parameters array
            data = data.replace(/"null"/g, "null"); 

            // Encrypt the payload using the device encryption token
            const encryptedData = await this._encrypt(this._deviceEncryptionToken, data);

            let requestUrl;
            if (action !== null) {
                // Cloud path for device action: <api url><action><path>
                requestUrl = api + action + path;
            } else {
                // Fallback (shouldn't happen for POST but kept for structure)
                requestUrl = api + path;
            }

            try {
                // Fetch with timeout and encrypted body
                const res = await fetch(requestUrl, {
                    method: 'POST',
                    headers: { "Content-Type": this._contentType },
                    body: encryptedData,
                    signal: AbortSignal.timeout(this._timeout)
                });
                encryptedResponse = {
                    status: res.status,
                    text: await res.text()
                };
            } catch (e) {
                return null;
            }
        }

        // --- Response Handling ---
        if (encryptedResponse.status !== 200) {
            // Error response - attempt to parse it (may be encrypted or plain JSON error)
            let errorMsg;
            try {
                errorMsg = JSON.parse(encryptedResponse.text);
            } catch (e) {
                try {
                     // Try decrypting with device token if plain JSON fails (for device errors)
                     const decrypted = await this._decrypt(this._deviceEncryptionToken, encryptedResponse.text);
                     errorMsg = JSON.parse(decrypted);
                } catch (e2) {
                    // If all decoding attempts fail, throw decode exception
                    throw new MYJDDecodeException(`Failed to decode response: ${encryptedResponse.text}`);
                }
            }
            
            // Construct detailed error message and throw specific exception
            let msg = `\n\tSOURCE: ${errorMsg["src"]}\n\tTYPE: ${errorMsg["type"]}\n------\nREQUEST_URL: ${api}${path}`;
            if (httpMethod === "GET") msg += ""; 
            msg += "\n";
            if (data !== null) msg += "DATA:\n" + data;
            
            throw MYJDApiException.getException(errorMsg["src"], errorMsg["type"], msg);
        }

        // Decrypt the successful response
        let response;
        if (action === null) {
            // General cloud response (GET)
            if (!this._serverEncryptionToken) {
                response = await this._decrypt(this._loginSecret, encryptedResponse.text);
            } else {
                response = await this._decrypt(this._serverEncryptionToken, encryptedResponse.text);
            }
        } else {
            // Device action response (POST)
            response = await this._decrypt(this._deviceEncryptionToken, encryptedResponse.text);
        }

        // Parse JSON response
        let jsondata;
        try {
            jsondata = JSON.parse(response);
        } catch(e) {
             // Handle case where response might not be a JSON object (e.g. ping)
             jsondata = response; 
        }

        // Request ID validation
        if (jsondata && typeof jsondata === 'object' && 'rid' in jsondata) {
            if (jsondata['rid'] !== this._requestId) {
                this.updateRequestId();
                return null;
            }
        }
        this.updateRequestId();
        return jsondata;
    }

    /**
     * Gets the current connection type being used ('myjd' for cloud, 'remoteapi' for direct).
     * @returns {('myjd' | 'remoteapi')} The connection type.
     */
    getConnectionType() {
        return this._connectionType;
    }

    /**
     * Internal utility method to prepare parameters for transmission in a POST request.
     * This handles converting complex objects (dicts/arrays) to JSON strings as required by the API.
     * @private
     * @param {any[] | null} params - The raw list of parameters.
     * @returns {any[] | null} The adapted list of parameters ready for the API request object.
     */
    _adaptParamsForRequest(params) {
        if (params === null) return null;
        let paramsRequest = [];
        for (const param of params) {
            if (typeof param === 'string') {
                paramsRequest.push(param);
            } else if (Array.isArray(param)) {
                // Recursively adapt nested arrays
                paramsRequest.push(this._adaptParamsForRequest(param));
            } else if (typeof param === 'object' && param !== null && this._connectionType === "remoteapi") {
                // Direct API can handle raw objects
                paramsRequest.push(param);
            } else if (typeof param === 'object' && param !== null) {
                // Cloud API requires objects to be serialized to JSON strings
                paramsRequest.push(JSON.stringify(param));
            } else if (typeof param === 'boolean' || typeof param === 'number') {
                 // Booleans and numbers are also serialized to JSON strings
                 paramsRequest.push(JSON.stringify(param));
            } else {
                // Fallback for other types
                paramsRequest.push(String(param));
            }
        }
        return paramsRequest;
    }
}

// Expose class globally for non-module environments (browser)
if (typeof window !== 'undefined') window.JD = MyJDApi;