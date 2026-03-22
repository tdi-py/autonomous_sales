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
exports.DeliverabilityTesterService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
function resultScore(r) {
    if (r === 'inbox')
        return 100;
    if (r === 'promotions')
        return 70;
    if (r === 'spam' || r === 'junk')
        return 0;
    return 0; // not_tested counts as 0 for scoring
}
// ─── Service ─────────────────────────────────────────────────────────────────
var DeliverabilityTesterService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DeliverabilityTesterService = _classThis = /** @class */ (function () {
        function DeliverabilityTesterService_1(db, smtpService, imapService) {
            this.db = db;
            this.smtpService = smtpService;
            this.imapService = imapService;
            this.logger = new common_1.Logger(DeliverabilityTesterService.name);
        }
        /**
         * Run a seed deliverability test for the given email account.
         * Sends test emails to seed accounts and checks where they land.
         * If seed accounts are not configured → returns simplified DNS-only result.
         */
        DeliverabilityTesterService_1.prototype.runTest = function (emailAccountId, testSubject, testBody) {
            return __awaiter(this, void 0, void 0, function () {
                var account, seedAccounts, seedTestAvailable, credentials, smtpCreds, subject, body, uniqueTag, taggedSubject, gmailResult, outlookResult, yahooResult, issuesDetected, sends, waitMs, _i, seedAccounts_1, seed, imapCreds, checkResult, error_1, err, scores, overallScore;
                var _this = this;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.db.query.emailAccounts.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId),
                            })];
                        case 1:
                            account = _e.sent();
                            if (!account) {
                                throw new Error("Email account not found: ".concat(emailAccountId));
                            }
                            seedAccounts = this.getSeedAccounts();
                            seedTestAvailable = seedAccounts.length > 0;
                            if (!seedTestAvailable) {
                                this.logger.warn('[deliverability] Seed test accounts not configured. Set SEED_TEST_GMAIL and SEED_TEST_OUTLOOK env vars.');
                                // Return "coming soon" result — only DNS check was done
                                return [2 /*return*/, {
                                        gmailResult: 'not_tested',
                                        outlookResult: 'not_tested',
                                        yahooResult: 'not_tested',
                                        overallScore: 0,
                                        issuesDetected: [
                                            'Seed test hesapları yapılandırılmamış. SEED_TEST_GMAIL ve SEED_TEST_OUTLOOK env değişkenlerini ayarlayın.',
                                        ],
                                        seedTestAvailable: false,
                                    }];
                            }
                            credentials = account.authCredentials;
                            smtpCreds = {
                                host: (_a = account.smtpHost) !== null && _a !== void 0 ? _a : 'smtp.gmail.com',
                                port: (_b = account.smtpPort) !== null && _b !== void 0 ? _b : 587,
                                username: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.username) !== null && _c !== void 0 ? _c : account.emailAddress,
                                password: (_d = credentials === null || credentials === void 0 ? void 0 : credentials.password) !== null && _d !== void 0 ? _d : '',
                            };
                            subject = testSubject !== null && testSubject !== void 0 ? testSubject : "Deliverability Test \u2014 ".concat(new Date().toISOString());
                            body = testBody !== null && testBody !== void 0 ? testBody : this.generateTestEmailBody(account.emailAddress);
                            uniqueTag = "[DelivTest-".concat(Date.now(), "]");
                            taggedSubject = "".concat(uniqueTag, " ").concat(subject);
                            gmailResult = 'not_tested';
                            outlookResult = 'not_tested';
                            yahooResult = 'not_tested';
                            issuesDetected = [];
                            return [4 /*yield*/, Promise.allSettled(seedAccounts.map(function (seed) {
                                    return _this.smtpService.sendEmail(smtpCreds, {
                                        from: account.emailAddress,
                                        to: seed.address,
                                        subject: taggedSubject,
                                        html: body,
                                    });
                                }))];
                        case 2:
                            sends = _e.sent();
                            // Check send results
                            sends.forEach(function (result, i) {
                                if (result.status === 'rejected') {
                                    issuesDetected.push("".concat(seedAccounts[i].provider, " seed g\u00F6nderimi ba\u015Far\u0131s\u0131z: ").concat(result.reason));
                                }
                            });
                            waitMs = 45000;
                            this.logger.log("[deliverability] Waiting ".concat(waitMs / 1000, "s for emails to arrive..."));
                            return [4 /*yield*/, this.sleep(waitMs)];
                        case 3:
                            _e.sent();
                            _i = 0, seedAccounts_1 = seedAccounts;
                            _e.label = 4;
                        case 4:
                            if (!(_i < seedAccounts_1.length)) return [3 /*break*/, 9];
                            seed = seedAccounts_1[_i];
                            _e.label = 5;
                        case 5:
                            _e.trys.push([5, 7, , 8]);
                            imapCreds = {
                                host: seed.imapHost,
                                port: seed.imapPort,
                                username: seed.address,
                                password: seed.password,
                                secure: true,
                            };
                            return [4 /*yield*/, this.imapService.findEmailInFolders(imapCreds, uniqueTag, 5)];
                        case 6:
                            checkResult = _e.sent();
                            if (seed.provider === 'gmail') {
                                if (checkResult.emailFound) {
                                    gmailResult = checkResult.folder === 'not_found' ? 'not_tested' : checkResult.folder;
                                }
                            }
                            else if (seed.provider === 'outlook') {
                                if (checkResult.emailFound) {
                                    outlookResult = checkResult.folder === 'not_found' ? 'not_tested' : checkResult.folder;
                                }
                            }
                            return [3 /*break*/, 8];
                        case 7:
                            error_1 = _e.sent();
                            err = error_1;
                            issuesDetected.push("".concat(seed.provider, " IMAP kontrol\u00FC ba\u015Far\u0131s\u0131z: ").concat(err.message));
                            return [3 /*break*/, 8];
                        case 8:
                            _i++;
                            return [3 /*break*/, 4];
                        case 9:
                            scores = [];
                            if (gmailResult !== 'not_tested')
                                scores.push(resultScore(gmailResult));
                            if (outlookResult !== 'not_tested')
                                scores.push(resultScore(outlookResult));
                            if (yahooResult !== 'not_tested')
                                scores.push(resultScore(yahooResult));
                            overallScore = scores.length > 0
                                ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length)
                                : 0;
                            // Collect issues
                            if (gmailResult === 'spam')
                                issuesDetected.push('Gmail email\'inizi spam olarak işaretliyor. DNS kayıtlarını ve email içeriğini kontrol edin.');
                            if (gmailResult === 'promotions')
                                issuesDetected.push('Gmail email\'inizi Promotions sekmesinde görüntülüyor. Daha kişisel bir metin kullanmayı deneyin.');
                            if (outlookResult === 'spam' || outlookResult === 'junk')
                                issuesDetected.push('Outlook/Microsoft email\'inizi Junk olarak işaretliyor.');
                            // Save to database
                            return [4 /*yield*/, this.db.insert(schema.deliverabilityTests).values({
                                    emailAccountId: emailAccountId,
                                    testType: 'seed_test',
                                    gmailResult: gmailResult,
                                    outlookResult: outlookResult,
                                    yahooResult: yahooResult,
                                    overallScore: overallScore,
                                    issuesDetected: issuesDetected,
                                    spamTriggerWords: [],
                                    testedAt: new Date(),
                                })];
                        case 10:
                            // Save to database
                            _e.sent();
                            this.logger.log("[deliverability] Test complete \u2014 Gmail: ".concat(gmailResult, ", Outlook: ").concat(outlookResult, ", Score: ").concat(overallScore));
                            return [2 /*return*/, {
                                    gmailResult: gmailResult,
                                    outlookResult: outlookResult,
                                    yahooResult: yahooResult,
                                    overallScore: overallScore,
                                    issuesDetected: issuesDetected,
                                    seedTestAvailable: true,
                                }];
                    }
                });
            });
        };
        /**
         * Get deliverability test history for an account.
         */
        DeliverabilityTesterService_1.prototype.getHistory = function (emailAccountId_1) {
            return __awaiter(this, arguments, void 0, function (emailAccountId, limit) {
                if (limit === void 0) { limit = 5; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.db.query.deliverabilityTests.findMany({
                            where: (0, drizzle_orm_1.eq)(schema.deliverabilityTests.emailAccountId, emailAccountId),
                            orderBy: function (t, _a) {
                                var desc = _a.desc;
                                return [desc(t.testedAt)];
                            },
                            limit: limit,
                        })];
                });
            });
        };
        // ─── Private helpers ─────────────────────────────────────────────────────
        DeliverabilityTesterService_1.prototype.getSeedAccounts = function () {
            var accounts = [];
            var gmailAddress = process.env.SEED_TEST_GMAIL;
            var gmailPassword = process.env.SEED_TEST_GMAIL_PASSWORD;
            if (gmailAddress && gmailPassword) {
                accounts.push({
                    address: gmailAddress,
                    password: gmailPassword,
                    imapHost: 'imap.gmail.com',
                    imapPort: 993,
                    provider: 'gmail',
                });
            }
            var outlookAddress = process.env.SEED_TEST_OUTLOOK;
            var outlookPassword = process.env.SEED_TEST_OUTLOOK_PASSWORD;
            if (outlookAddress && outlookPassword) {
                accounts.push({
                    address: outlookAddress,
                    password: outlookPassword,
                    imapHost: 'outlook.office365.com',
                    imapPort: 993,
                    provider: 'outlook',
                });
            }
            return accounts;
        };
        DeliverabilityTesterService_1.prototype.generateTestEmailBody = function (senderEmail) {
            return "\n      <p>Hi there,</p>\n      <p>This is an automated deliverability test email sent from ".concat(senderEmail, ".</p>\n      <p>We're checking to make sure your emails reach the inbox properly.</p>\n      <p>If you received this in your inbox, great news \u2014 your email deliverability is working well!</p>\n      <p>Best regards,<br>Autonomous Sales Platform</p>\n      <p style=\"color:#999;font-size:12px;\">\n        This is a test email. Please ignore.\n        <a href=\"https://autonomous-sales.example.com/unsubscribe\">Unsubscribe</a>\n      </p>\n      <p style=\"color:#999;font-size:11px;\">\n        Autonomous Sales, 123 Main St, San Francisco, CA 94105\n      </p>\n    ");
        };
        DeliverabilityTesterService_1.prototype.sleep = function (ms) {
            return new Promise(function (resolve) { return setTimeout(resolve, ms); });
        };
        return DeliverabilityTesterService_1;
    }());
    __setFunctionName(_classThis, "DeliverabilityTesterService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DeliverabilityTesterService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DeliverabilityTesterService = _classThis;
}();
exports.DeliverabilityTesterService = DeliverabilityTesterService;
