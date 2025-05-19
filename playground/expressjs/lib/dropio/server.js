"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIOApi = void 0;
exports.createDropio = createDropio;
var crypto_1 = require("crypto");
function parseSize(size) {
    if (typeof size === "number")
        return size;
    var units = {
        B: 1,
        KB: 1024,
        MB: Math.pow(1024, 2),
        GB: Math.pow(1024, 3),
    };
    var match = /^(\d+(?:\.\d+)?)([KMG]?B)$/i.exec(size);
    if (!(match === null || match === void 0 ? void 0 : match[1]) || !match[2]) {
        throw new Error("Invalid size format: ".concat(size));
    }
    var num = match[1];
    var unit = match[2].toUpperCase();
    var multiplier = units[unit];
    if (!multiplier) {
        throw new Error("Invalid size unit: ".concat(unit));
    }
    return Math.floor(parseFloat(num) * multiplier);
}
function formatBytes(bytes) {
    var sizes = ["Bytes", "KB", "MB", "GB"];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return "".concat(parseFloat((bytes / Math.pow(1024, i)).toFixed(2)), " ").concat(sizes[i]);
}
function validateUploadMetadataRequest(query) {
    var required = [
        "fileName",
        "fileSize",
        "fileType",
    ];
    var missing = required.filter(function (k) { return !query[k]; });
    if (missing.length) {
        return { error: true, message: "Missing fields: ".concat(missing.join(", ")) };
    }
    return { error: false };
}
function generatePresignURL(options) {
    var data = options.data, ContentDiposition = options.ContentDiposition, expire = options.expire, route = options.route;
    var fileName = data.fileName, fileSize = data.fileSize, fileType = data.fileType;
    var baseUrl = (0, crypto_1.createHash)("sha256")
        .update((0, crypto_1.randomBytes)(18).toString("hex"))
        .digest("hex")
        .toUpperCase()
        .slice(0, 24);
    var expires = Date.now() + (expire !== null && expire !== void 0 ? expire : 1 * 60 * 60 * 1000);
    var params = new URLSearchParams({
        expire: expires.toString(),
        xDioIdentifier: process.env.DROPIO_APP_ID,
        xDioFileName: fileName,
        xDioFileSize: fileSize.toString(),
        xDioFileType: fileType,
        xDioRoute: route !== null && route !== void 0 ? route : "fileUploader",
        xDioContentDipositioning: ContentDiposition !== null && ContentDiposition !== void 0 ? ContentDiposition : "inline",
    });
    var urlToSign = "".concat(baseUrl, "?").concat(params.toString());
    var hmac = (0, crypto_1.createHmac)("sha256", process.env.DROPIO_TOKEN);
    hmac.update(urlToSign);
    var signature = "hmac-sha256=".concat(hmac.digest("hex"));
    params.append("signature", signature);
    return {
        key: signature,
        presignUrl: "".concat(process.env.DROPIO_INGEST_SERVER, "/u/").concat(baseUrl, "?").concat(params.toString()),
    };
}
// ---- Upload Factory ----
function createDropio() {
    if (typeof window !== "undefined") {
        throw new Error("createDropio can only be used in a server environment");
    }
    return function defineUploader(config) {
        return function handleUpload(data) {
            var _a, _b, _c;
            var dataFileType = (_a = data.fileType.split("/")[0]) !== null && _a !== void 0 ? _a : "";
            var fileConfig = (_b = config[data.fileType]) !== null && _b !== void 0 ? _b : config[dataFileType];
            if (!fileConfig) {
                return { isError: true, message: "Unsupported file type." };
            }
            var _d = validateUploadMetadataRequest(data), error = _d.error, message = _d.message;
            if (error)
                return { isError: true, message: message };
            var maxSize = parseSize((_c = fileConfig.maxFileSize) !== null && _c !== void 0 ? _c : "10MB");
            if (data.fileSize > maxSize) {
                return {
                    isError: true,
                    message: "File size exceeds ".concat(formatBytes(maxSize), "."),
                };
            }
            var presigned = generatePresignURL({ data: data });
            return {
                isError: false,
                key: presigned.key,
                presignedUrl: presigned.presignUrl,
            };
        };
    };
}
var DIOApi = /** @class */ (function () {
    function DIOApi() {
    }
    DIOApi.prototype.delete = function (fileKey) {
        return __awaiter(this, void 0, void 0, function () {
            var controller, timeoutId, res, response, jsonError_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, 5000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 8, 9]);
                        return [4 /*yield*/, fetch("".concat(process.env.DROPIO_INGEST_SERVER, "/d/").concat(fileKey), {
                                method: "DELETE",
                                cache: "no-store",
                                headers: {
                                    Authorization: "Bearer ".concat(process.env.DROPIO_TOKEN),
                                    "xdio-app-id": process.env.DROPIO_APP_ID,
                                },
                                signal: controller.signal,
                            })];
                    case 2:
                        res = _a.sent();
                        response = null;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, res.json()];
                    case 4:
                        response = (_a.sent());
                        return [3 /*break*/, 6];
                    case 5:
                        jsonError_1 = _a.sent();
                        console.error("Failed to parse JSON from delete dioapi:", jsonError_1);
                        return [2 /*return*/, { error: "Failed to parse JSON from delete dioapi" }];
                    case 6:
                        if ((response === null || response === void 0 ? void 0 : response.code) !== 200) {
                            console.log("INGEST_SERVER_ERORR:", response.errors);
                            return [2 /*return*/, { error: response === null || response === void 0 ? void 0 : response.message }];
                        }
                        return [2 /*return*/, { success: response === null || response === void 0 ? void 0 : response.message }];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Error deleting file:", error_1);
                        return [2 /*return*/, { error: "Error During deleting File" }];
                    case 8:
                        clearTimeout(timeoutId);
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return DIOApi;
}());
exports.DIOApi = DIOApi;
