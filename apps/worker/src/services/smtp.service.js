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
exports.SmtpService = exports.SMTP_DEFAULTS = void 0;
var common_1 = require("@nestjs/common");
var nodemailer = require("nodemailer");
// ─── SMTP Provider defaults ───────────────────────────────────────────────────
exports.SMTP_DEFAULTS = {
    gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
    },
    outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
    },
};
// ─── Service ─────────────────────────────────────────────────────────────────
var SmtpService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SmtpService = _classThis = /** @class */ (function () {
        function SmtpService_1() {
            this.logger = new common_1.Logger(SmtpService.name);
        }
        /**
         * Test SMTP connection by verifying credentials.
         * Opens a transporter, verifies it, then destroys it.
         */
        SmtpService_1.prototype.testConnection = function (credentials) {
            return __awaiter(this, void 0, void 0, function () {
                var start, transporter, error_1, err;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            start = Date.now();
                            transporter = null;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            transporter = this.createTransporter(credentials);
                            return [4 /*yield*/, Promise.race([
                                    transporter.verify(),
                                    new Promise(function (_, reject) {
                                        return setTimeout(function () { return reject(new Error('SMTP connection timeout (10s)')); }, 10000);
                                    }),
                                ])];
                        case 2:
                            _a.sent();
                            this.logger.log("[smtp] Connection OK \u2014 ".concat(credentials.host, ":").concat(credentials.port));
                            return [2 /*return*/, { success: true, latencyMs: Date.now() - start }];
                        case 3:
                            error_1 = _a.sent();
                            err = error_1;
                            this.logger.warn("[smtp] Connection failed \u2014 ".concat(credentials.host, ": ").concat(err.message));
                            return [2 /*return*/, { success: false, error: this.friendlyError(err.message) }];
                        case 4:
                            if (transporter)
                                transporter.close();
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Send a single email via SMTP.
         * Credentials password is masked in logs.
         */
        SmtpService_1.prototype.sendEmail = function (credentials, options) {
            return __awaiter(this, void 0, void 0, function () {
                var transporter, info, error_2, err;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            transporter = null;
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, 4, 5]);
                            transporter = this.createTransporter(credentials);
                            return [4 /*yield*/, transporter.sendMail({
                                    from: options.from,
                                    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                                    subject: options.subject,
                                    html: options.html,
                                    text: (_a = options.text) !== null && _a !== void 0 ? _a : options.html.replace(/<[^>]*>/g, ''),
                                    replyTo: options.replyTo,
                                })];
                        case 2:
                            info = _b.sent();
                            this.logger.log("[smtp] Sent OK \u2014 to: ".concat(options.to, " | messageId: ").concat(info.messageId));
                            return [2 /*return*/, { success: true, messageId: info.messageId }];
                        case 3:
                            error_2 = _b.sent();
                            err = error_2;
                            // Never log password — only show host
                            this.logger.error("[smtp] Send failed \u2014 host: ".concat(credentials.host, " | error: ").concat(err.message));
                            return [2 /*return*/, { success: false, error: this.friendlyError(err.message) }];
                        case 4:
                            if (transporter)
                                transporter.close();
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        // ─── Private ────────────────────────────────────────────────────────────────
        SmtpService_1.prototype.createTransporter = function (credentials) {
            var _a;
            var secure = (_a = credentials.secure) !== null && _a !== void 0 ? _a : (credentials.port === 465);
            return nodemailer.createTransport({
                host: credentials.host,
                port: credentials.port,
                secure: secure,
                auth: {
                    user: credentials.username,
                    pass: credentials.password,
                },
                tls: {
                    // Accept self-signed certs in development but reject invalid in prod
                    rejectUnauthorized: process.env.NODE_ENV === 'production',
                    minVersion: 'TLSv1.2',
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        };
        SmtpService_1.prototype.friendlyError = function (message) {
            if (message.includes('535') || message.includes('534') || message.includes('Username and Password')) {
                return 'Kimlik doğrulama başarısız. Gmail kullanıyorsanız "App Password" gereklidir (2FA aktifse normal şifre çalışmaz).';
            }
            if (message.includes('ECONNREFUSED')) {
                return 'SMTP sunucusuna bağlanılamadı. Host veya port bilgilerini kontrol edin.';
            }
            if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
                return 'SMTP bağlantısı zaman aşımına uğradı. Güvenlik duvarı veya port engeliyle karşılaşmış olabilirsiniz.';
            }
            if (message.includes('ENOTFOUND')) {
                return 'SMTP sunucu adresi bulunamadı. Host bilgisini kontrol edin.';
            }
            if (message.includes('certificate')) {
                return 'SSL/TLS sertifika hatası. Port veya güvenlik ayarlarını gözden geçirin.';
            }
            return "SMTP hatas\u0131: ".concat(message);
        };
        return SmtpService_1;
    }());
    __setFunctionName(_classThis, "SmtpService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SmtpService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SmtpService = _classThis;
}();
exports.SmtpService = SmtpService;
