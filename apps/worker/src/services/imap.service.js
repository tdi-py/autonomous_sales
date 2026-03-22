"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapService = exports.IMAP_DEFAULTS = void 0;
var common_1 = require("@nestjs/common");
var imapflow_1 = require("imapflow");
// ─── IMAP Provider defaults ───────────────────────────────────────────────────
exports.IMAP_DEFAULTS = {
    gmail: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
    },
    outlook: {
        host: 'outlook.office365.com',
        port: 993,
        secure: true,
    },
};
// ─── Service ─────────────────────────────────────────────────────────────────
var ImapService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ImapService = _classThis = /** @class */ (function () {
        function ImapService_1() {
            this.logger = new common_1.Logger(ImapService.name);
        }
        /**
         * Test IMAP connection by attempting to open inbox.
         */
        ImapService_1.prototype.testConnection = function (credentials) {
            return __awaiter(this, void 0, void 0, function () {
                var client, mailbox, count, error_1, err;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            client = this.createClient(credentials);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, 5, 7]);
                            return [4 /*yield*/, Promise.race([
                                    client.connect(),
                                    new Promise(function (_, reject) {
                                        return setTimeout(function () { return reject(new Error('IMAP connection timeout (10s)')); }, 10000);
                                    }),
                                ])];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, client.getMailboxLock('INBOX')];
                        case 3:
                            mailbox = _b.sent();
                            count = client.mailbox ? (_a = client.mailbox.exists) !== null && _a !== void 0 ? _a : 0 : 0;
                            mailbox.release();
                            this.logger.log("[imap] Connection OK \u2014 ".concat(credentials.host, ":").concat(credentials.port, " | messages: ").concat(count));
                            return [2 /*return*/, { success: true, messageCount: count }];
                        case 4:
                            error_1 = _b.sent();
                            err = error_1;
                            this.logger.warn("[imap] Connection failed \u2014 ".concat(credentials.host, ": ").concat(err.message));
                            return [2 /*return*/, { success: false, error: this.friendlyError(err.message) }];
                        case 5: return [4 /*yield*/, client.logout().catch(function () { })];
                        case 6:
                            _b.sent();
                            return [7 /*endfinally*/];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Search for an email by subject in various folders (inbox, spam, promotions, junk).
         * Returns which folder the email was found in.
         */
        ImapService_1.prototype.findEmailInFolders = function (credentials_1, searchSubject_1) {
            return __awaiter(this, arguments, void 0, function (credentials, searchSubject, sinceMinutes) {
                var client, foldersToCheck, since, _i, foldersToCheck_1, folder, lock, messages, _a, _b, error_2, err;
                if (sinceMinutes === void 0) { sinceMinutes = 5; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            client = this.createClient(credentials);
                            foldersToCheck = [
                                { name: 'INBOX', result: 'inbox' },
                                { name: '[Gmail]/Spam', result: 'spam' },
                                { name: 'Spam', result: 'spam' },
                                { name: '[Gmail]/All Mail', result: 'inbox' },
                                { name: 'Junk', result: 'junk' },
                                { name: 'Junk Email', result: 'junk' },
                            ];
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 14, 15, 17]);
                            return [4 /*yield*/, client.connect()];
                        case 2:
                            _c.sent();
                            since = new Date(Date.now() - sinceMinutes * 60 * 1000);
                            _i = 0, foldersToCheck_1 = foldersToCheck;
                            _c.label = 3;
                        case 3:
                            if (!(_i < foldersToCheck_1.length)) return [3 /*break*/, 13];
                            folder = foldersToCheck_1[_i];
                            _c.label = 4;
                        case 4:
                            _c.trys.push([4, 11, , 12]);
                            return [4 /*yield*/, client.getMailboxLock(folder.name)];
                        case 5:
                            lock = _c.sent();
                            _c.label = 6;
                        case 6:
                            _c.trys.push([6, 8, 9, 10]);
                            return [4 /*yield*/, client.search({
                                    subject: searchSubject,
                                    since: since,
                                })];
                        case 7:
                            messages = _c.sent();
                            if (messages && messages.length > 0) {
                                this.logger.log("[imap] Found email in folder: ".concat(folder.name));
                                return [2 /*return*/, {
                                        emailFound: true,
                                        folder: folder.result,
                                        subject: searchSubject,
                                    }];
                            }
                            return [3 /*break*/, 10];
                        case 8:
                            _a = _c.sent();
                            return [3 /*break*/, 10];
                        case 9:
                            lock.release();
                            return [7 /*endfinally*/];
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            _b = _c.sent();
                            return [3 /*break*/, 12];
                        case 12:
                            _i++;
                            return [3 /*break*/, 3];
                        case 13: return [2 /*return*/, { emailFound: false, folder: 'not_found' }];
                        case 14:
                            error_2 = _c.sent();
                            err = error_2;
                            this.logger.error("[imap] findEmailInFolders failed: ".concat(err.message));
                            return [2 /*return*/, { emailFound: false, folder: 'not_found' }];
                        case 15: return [4 /*yield*/, client.logout().catch(function () { })];
                        case 16:
                            _c.sent();
                            return [7 /*endfinally*/];
                        case 17: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Move recent warmup emails to inbox (simulate engagement).
         * This tells providers that emails from the warmup partner are welcome.
         */
        ImapService_1.prototype.moveSpamToInbox = function (credentials, subjectContains) {
            return __awaiter(this, void 0, void 0, function () {
                var client, since, spamFolders, movedTotal, _i, spamFolders_1, folder, lock, uids, _a, error_3, err;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            client = this.createClient(credentials);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 15, 16, 18]);
                            return [4 /*yield*/, client.connect()];
                        case 2:
                            _b.sent();
                            since = new Date(Date.now() - 24 * 60 * 60 * 1000);
                            spamFolders = ['[Gmail]/Spam', 'Spam', 'Junk', 'Junk Email'];
                            movedTotal = 0;
                            _i = 0, spamFolders_1 = spamFolders;
                            _b.label = 3;
                        case 3:
                            if (!(_i < spamFolders_1.length)) return [3 /*break*/, 14];
                            folder = spamFolders_1[_i];
                            _b.label = 4;
                        case 4:
                            _b.trys.push([4, 12, , 13]);
                            return [4 /*yield*/, client.getMailboxLock(folder)];
                        case 5:
                            lock = _b.sent();
                            _b.label = 6;
                        case 6:
                            _b.trys.push([6, , 10, 11]);
                            return [4 /*yield*/, client.search({ subject: subjectContains, since: since })];
                        case 7:
                            uids = _b.sent();
                            if (!(uids && uids.length > 0)) return [3 /*break*/, 9];
                            return [4 /*yield*/, client.messageMove(uids, 'INBOX')];
                        case 8:
                            _b.sent();
                            movedTotal += uids.length;
                            this.logger.log("[imap] Moved ".concat(uids.length, " emails from ").concat(folder, " to INBOX"));
                            _b.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            lock.release();
                            return [7 /*endfinally*/];
                        case 11: return [3 /*break*/, 13];
                        case 12:
                            _a = _b.sent();
                            return [3 /*break*/, 13];
                        case 13:
                            _i++;
                            return [3 /*break*/, 3];
                        case 14: return [2 /*return*/, { moved: movedTotal }];
                        case 15:
                            error_3 = _b.sent();
                            err = error_3;
                            this.logger.error("[imap] moveSpamToInbox failed: ".concat(err.message));
                            return [2 /*return*/, { moved: 0 }];
                        case 16: return [4 /*yield*/, client.logout().catch(function () { })];
                        case 17:
                            _b.sent();
                            return [7 /*endfinally*/];
                        case 18: return [2 /*return*/];
                    }
                });
            });
        };
        // ─── Private ────────────────────────────────────────────────────────────────
        ImapService_1.prototype.createClient = function (credentials) {
            var _a;
            var tls = (_a = credentials.secure) !== null && _a !== void 0 ? _a : true;
            return new imapflow_1.ImapFlow({
                host: credentials.host,
                port: credentials.port,
                secure: tls,
                auth: {
                    user: credentials.username,
                    pass: credentials.password,
                },
                tls: {
                    rejectUnauthorized: false, // tolerate self-signed in dev
                    minVersion: 'TLSv1.2',
                },
                logger: false, // suppress verbose imapflow logs
            });
        };
        ImapService_1.prototype.friendlyError = function (message) {
            if (message.includes('AUTHENTICATIONFAILED') || message.includes('Invalid credentials')) {
                return 'IMAP kimlik doğrulama başarısız. Gmail için "App Password" gerekebilir.';
            }
            if (message.includes('ECONNREFUSED')) {
                return 'IMAP sunucusuna bağlanılamadı. Host veya port bilgilerini kontrol edin.';
            }
            if (message.includes('timeout')) {
                return 'IMAP bağlantısı zaman aşımına uğradı.';
            }
            return "IMAP hatas\u0131: ".concat(message);
        };
        return ImapService_1;
    }());
    __setFunctionName(_classThis, "ImapService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ImapService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ImapService = _classThis;
}();
exports.ImapService = ImapService;
