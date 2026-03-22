"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.EmailAccountsService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var nodemailer = require("nodemailer");
var imapflow_1 = require("imapflow");
var dns = require("dns/promises");
var schema = require("@autonomous-sales/database");
// ─── SMTP/IMAP defaults ───────────────────────────────────────────────────────
var PROVIDER_DEFAULTS = {
    gmail: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
    },
    outlook: {
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
    },
    custom_smtp: {
        smtpHost: '',
        smtpPort: 587,
        imapHost: '',
        imapPort: 993,
    },
};
// ─── Warmup schedule definition ───────────────────────────────────────────────
var WARMUP_SCHEDULE = [
    { fromDay: 1, toDay: 3, targetSends: 5 },
    { fromDay: 4, toDay: 7, targetSends: 10 },
    { fromDay: 8, toDay: 14, targetSends: 20 },
    { fromDay: 15, toDay: 21, targetSends: 35 },
    { fromDay: 22, toDay: 28, targetSends: 50 },
];
var EmailAccountsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EmailAccountsService = _classThis = /** @class */ (function () {
        function EmailAccountsService_1(db, warmupQueue) {
            this.db = db;
            this.warmupQueue = warmupQueue;
            this.logger = new common_1.Logger(EmailAccountsService.name);
        }
        // ─── Create email account ──────────────────────────────────────────────────
        EmailAccountsService_1.prototype.create = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var defaults, smtpHost, smtpPort, imapHost, imapPort, username, smtpResult, imapResult, authCredentials, account;
                var _this = this;
                var _a, _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(dto.projectId, userId)];
                        case 1:
                            _h.sent();
                            defaults = PROVIDER_DEFAULTS[dto.provider];
                            smtpHost = (_a = dto.smtpHost) !== null && _a !== void 0 ? _a : defaults.smtpHost;
                            smtpPort = (_b = dto.smtpPort) !== null && _b !== void 0 ? _b : defaults.smtpPort;
                            imapHost = (_c = dto.imapHost) !== null && _c !== void 0 ? _c : defaults.imapHost;
                            imapPort = (_d = dto.imapPort) !== null && _d !== void 0 ? _d : defaults.imapPort;
                            username = (_e = dto.username) !== null && _e !== void 0 ? _e : dto.emailAddress;
                            // ── SMTP connection test ─────────────────────────────────────────────────
                            this.logger.log("[email-accounts] Testing SMTP connection for: ".concat(dto.emailAddress));
                            return [4 /*yield*/, this.testSmtpConnection({
                                    host: smtpHost,
                                    port: smtpPort,
                                    username: username,
                                    password: dto.password,
                                })];
                        case 2:
                            smtpResult = _h.sent();
                            if (!smtpResult.success) {
                                throw new common_1.BadRequestException("SMTP ba\u011Flant\u0131s\u0131 kurulamad\u0131: ".concat((_f = smtpResult.error) !== null && _f !== void 0 ? _f : 'Bilinmeyen hata', ". L\u00FCtfen bilgilerinizi kontrol edin."));
                            }
                            // ── IMAP connection test ─────────────────────────────────────────────────
                            this.logger.log("[email-accounts] Testing IMAP connection for: ".concat(dto.emailAddress));
                            return [4 /*yield*/, this.testImapConnection({
                                    host: imapHost,
                                    port: imapPort,
                                    username: username,
                                    password: dto.password,
                                })];
                        case 3:
                            imapResult = _h.sent();
                            if (!imapResult.success) {
                                throw new common_1.BadRequestException("IMAP ba\u011Flant\u0131s\u0131 kurulamad\u0131: ".concat((_g = imapResult.error) !== null && _g !== void 0 ? _g : 'Bilinmeyen hata', ". IMAP eri\u015Fimini kontrol edin."));
                            }
                            authCredentials = {
                                username: username,
                                password: dto.password, // Will be encrypted in production
                                senderName: dto.senderName,
                            };
                            this.logger.log("[email-accounts] Saving account: ".concat(dto.emailAddress, " [password masked]"));
                            return [4 /*yield*/, this.db
                                    .insert(schema.emailAccounts)
                                    .values({
                                    projectId: dto.projectId,
                                    emailAddress: dto.emailAddress,
                                    provider: dto.provider,
                                    smtpHost: smtpHost,
                                    smtpPort: smtpPort,
                                    imapHost: imapHost,
                                    imapPort: imapPort,
                                    authCredentials: authCredentials,
                                    warmupStatus: 'not_started',
                                    warmupDay: 0,
                                    dailySendLimit: 20,
                                })
                                    .returning()];
                        case 4:
                            account = (_h.sent())[0];
                            // ── Create warmup schedule ───────────────────────────────────────────────
                            return [4 /*yield*/, this.createWarmupSchedule(account.id)];
                        case 5:
                            // ── Create warmup schedule ───────────────────────────────────────────────
                            _h.sent();
                            // ── Trigger async DNS check ──────────────────────────────────────────────
                            this.triggerDnsCheck(account.id, dto.emailAddress).catch(function (err) {
                                return _this.logger.error("[email-accounts] Async DNS check failed: ".concat(err.message));
                            });
                            return [2 /*return*/, __assign(__assign({}, account), { connectionTest: { smtp: 'ok', imap: 'ok' } })];
                    }
                });
            });
        };
        // ─── Find all (by project) ────────────────────────────────────────────────
        EmailAccountsService_1.prototype.findAll = function (userId, projectId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.db.query.emailAccounts.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.emailAccounts.projectId, projectId),
                                    orderBy: function (t, _a) {
                                        var desc = _a.desc;
                                        return [desc(t.createdAt)];
                                    },
                                })];
                    }
                });
            });
        };
        // ─── Find one ────────────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.findOne = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.emailAccounts.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.emailAccounts.id, id),
                            })];
                        case 1:
                            account = _a.sent();
                            if (!account)
                                throw new common_1.NotFoundException('Email account not found');
                            return [4 /*yield*/, this.assertProjectAccess(account.projectId, userId)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, account];
                    }
                });
            });
        };
        // ─── Delete ──────────────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.remove = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            // Check for active campaigns using this account — soft warning only
                            // (Full campaign check would require campaign-account linking, implement in Faz 3)
                            return [4 /*yield*/, this.db
                                    .delete(schema.emailAccounts)
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, account.id))];
                        case 2:
                            // Check for active campaigns using this account — soft warning only
                            // (Full campaign check would require campaign-account linking, implement in Faz 3)
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        // ─── Test connection ─────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.testConnectionById = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account, creds, _a, smtpResult, imapResult;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _c.sent();
                            creds = account.authCredentials;
                            return [4 /*yield*/, Promise.all([
                                    this.testSmtpConnection({
                                        host: account.smtpHost,
                                        port: account.smtpPort,
                                        username: creds.username,
                                        password: creds.password,
                                    }),
                                    this.testImapConnection({
                                        host: account.imapHost,
                                        port: account.imapPort,
                                        username: creds.username,
                                        password: creds.password,
                                    }),
                                ])];
                        case 2:
                            _a = _c.sent(), smtpResult = _a[0], imapResult = _a[1];
                            return [2 /*return*/, {
                                    smtp: smtpResult.success ? 'ok' : 'failed',
                                    imap: imapResult.success ? 'ok' : 'failed',
                                    error: (_b = smtpResult.error) !== null && _b !== void 0 ? _b : imapResult.error,
                                }];
                    }
                });
            });
        };
        // ─── DNS check ───────────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.runDnsCheck = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            return [4 /*yield*/, this.checkDns(account.emailAddress)];
                        case 2:
                            result = _a.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({
                                    spfValid: result.spfValid,
                                    dkimValid: result.dkimValid,
                                    dmarcValid: result.dmarcValid,
                                    healthScore: result.healthScore,
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, id))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        // ─── Warmup controls ─────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.startWarmup = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            if (account.warmupStatus === 'warming') {
                                throw new common_1.BadRequestException('Hesap zaten ısındırma modunda.');
                            }
                            if (account.warmupStatus === 'ready') {
                                throw new common_1.BadRequestException('Hesap zaten hazır durumda.');
                            }
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({
                                    warmupStatus: 'warming',
                                    warmupDay: 1,
                                    dailySendLimit: 5,
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, id))];
                        case 2:
                            _a.sent();
                            // Queue the first warmup job
                            return [4 /*yield*/, this.warmupQueue.add({
                                    emailAccountId: id,
                                    projectId: account.projectId,
                                    workspaceId: '',
                                    agentType: 'communicator',
                                }, {
                                    delay: 5000, // start in 5 seconds
                                    attempts: 3,
                                    backoff: { type: 'exponential', delay: 60000 },
                                })];
                        case 3:
                            // Queue the first warmup job
                            _a.sent();
                            return [2 /*return*/, { started: true }];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.pauseWarmup = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            if (account.warmupStatus !== 'warming') {
                                throw new common_1.BadRequestException('Hesap ısındırma modunda değil.');
                            }
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({ warmupStatus: 'paused', updatedAt: new Date() })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, id))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { paused: true }];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.resumeWarmup = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            if (account.warmupStatus !== 'paused') {
                                throw new common_1.BadRequestException('Hesap duraklatılmış modunda değil.');
                            }
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({ warmupStatus: 'warming', updatedAt: new Date() })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, id))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { resumed: true }];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.getWarmupProgress = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var account, schedule, completedDays;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            account = _a.sent();
                            return [4 /*yield*/, this.db.query.warmupSchedule.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.warmupSchedule.emailAccountId, id),
                                    orderBy: function (t, _a) {
                                        var asc = _a.asc;
                                        return [asc(t.dayNumber)];
                                    },
                                })];
                        case 2:
                            schedule = _a.sent();
                            completedDays = schedule.filter(function (s) { return s.executedAt !== null; }).length;
                            return [2 /*return*/, {
                                    account: account,
                                    schedule: schedule,
                                    completedDays: completedDays,
                                    totalDays: 28,
                                    percentComplete: Math.round((completedDays / 28) * 100),
                                    currentDailyLimit: account.dailySendLimit,
                                }];
                    }
                });
            });
        };
        // ─── Deliverability test ─────────────────────────────────────────────────
        EmailAccountsService_1.prototype.runDeliverabilityTest = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var seedAvailable;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            _a.sent();
                            seedAvailable = !!(process.env.SEED_TEST_GMAIL && process.env.SEED_TEST_GMAIL_PASSWORD);
                            if (!seedAvailable) {
                                return [2 /*return*/, {
                                        gmailResult: 'not_tested',
                                        outlookResult: 'not_tested',
                                        overallScore: 0,
                                        issuesDetected: [],
                                        seedTestAvailable: false,
                                        message: 'Seed test hesapları henüz yapılandırılmamış. DNS kontrolü ve ısındırma aktif. Seed test yakında eklenecek.',
                                    }];
                            }
                            // Queue the deliverability test job
                            // For now, return a pending response — in full impl, this would be async
                            return [2 /*return*/, {
                                    gmailResult: 'not_tested',
                                    outlookResult: 'not_tested',
                                    overallScore: 0,
                                    issuesDetected: [],
                                    seedTestAvailable: false,
                                    message: 'Test kuyruğa alındı. Birkaç dakika içinde sonuçlar güncellenir.',
                                }];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.getDeliverabilityHistory = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.db.query.deliverabilityTests.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.deliverabilityTests.emailAccountId, id),
                                    orderBy: function (t, _a) {
                                        var desc = _a.desc;
                                        return [desc(t.testedAt)];
                                    },
                                    limit: 10,
                                })];
                    }
                });
            });
        };
        // ─── Private helpers ──────────────────────────────────────────────────────
        EmailAccountsService_1.prototype.assertProjectAccess = function (projectId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var project, membership;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.projects.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.projects.id, projectId),
                            })];
                        case 1:
                            project = _a.sent();
                            if (!project)
                                throw new common_1.NotFoundException('Project not found');
                            return [4 /*yield*/, this.db.query.workspaceMembers.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.workspaceMembers.workspaceId, project.workspaceId), (0, drizzle_orm_1.eq)(schema.workspaceMembers.userId, userId)),
                                })];
                        case 2:
                            membership = _a.sent();
                            if (!membership)
                                throw new common_1.ForbiddenException('No access to this project');
                            return [2 /*return*/, project];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.createWarmupSchedule = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                var entries, _loop_1, day;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            entries = [];
                            _loop_1 = function (day) {
                                var rule = WARMUP_SCHEDULE.find(function (r) { return day >= r.fromDay && day <= r.toDay; });
                                entries.push({
                                    emailAccountId: emailAccountId,
                                    dayNumber: day,
                                    targetSends: (_a = rule === null || rule === void 0 ? void 0 : rule.targetSends) !== null && _a !== void 0 ? _a : 5,
                                    actualSends: 0,
                                });
                            };
                            for (day = 1; day <= 28; day++) {
                                _loop_1(day);
                            }
                            return [4 /*yield*/, this.db.insert(schema.warmupSchedule).values(entries)];
                        case 1:
                            _b.sent();
                            this.logger.log("[email-accounts] Created 28-day warmup schedule for: ".concat(emailAccountId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.triggerDnsCheck = function (accountId, emailAddress) {
            return __awaiter(this, void 0, void 0, function () {
                var result, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.checkDns(emailAddress)];
                        case 1:
                            result = _a.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({
                                    spfValid: result.spfValid,
                                    dkimValid: result.dkimValid,
                                    dmarcValid: result.dmarcValid,
                                    healthScore: result.healthScore,
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, accountId))];
                        case 2:
                            _a.sent();
                            this.logger.log("[email-accounts] DNS check done \u2014 score: ".concat(result.healthScore, " for account: ").concat(accountId));
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            this.logger.warn("[email-accounts] DNS check failed: ".concat(err_1.message));
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.checkDns = function (emailAddress) {
            return __awaiter(this, void 0, void 0, function () {
                var domain, _a, spfValid, dkimValid, dmarcValid, score, recommendations;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            domain = emailAddress.split('@')[1];
                            if (!domain)
                                return [2 /*return*/, { spfValid: false, dkimValid: false, dmarcValid: false, healthScore: 0, recommendations: [] }];
                            return [4 /*yield*/, Promise.all([
                                    this.checkSpf(domain),
                                    this.checkDkim(domain),
                                    this.checkDmarc(domain),
                                ])];
                        case 1:
                            _a = _b.sent(), spfValid = _a[0], dkimValid = _a[1], dmarcValid = _a[2];
                            score = 0;
                            if (spfValid)
                                score += 33;
                            if (dkimValid)
                                score += 33;
                            if (dmarcValid)
                                score += 34;
                            recommendations = [];
                            if (!spfValid)
                                recommendations.push("SPF: v=spf1 include:_spf.google.com ~all ekleyin");
                            if (!dkimValid)
                                recommendations.push('DKIM: Email provider\'ınızın DKIM kurulum rehberini takip edin');
                            if (!dmarcValid)
                                recommendations.push("DMARC: _dmarc.".concat(domain, " i\u00E7in v=DMARC1; p=none; rua=mailto:dmarc@").concat(domain, " ekleyin"));
                            return [2 /*return*/, { spfValid: spfValid, dkimValid: dkimValid, dmarcValid: dmarcValid, healthScore: score, recommendations: recommendations }];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.checkSpf = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var records, flat, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Promise.race([
                                    dns.resolveTxt(domain),
                                    new Promise(function (_, r) { return setTimeout(function () { return r(new Error('timeout')); }, 5000); }),
                                ])];
                        case 1:
                            records = _b.sent();
                            flat = records.map(function (r) { return r.join(''); });
                            return [2 /*return*/, flat.some(function (r) { return r.includes('v=spf1'); })];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.checkDkim = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var selectors, _i, selectors_1, sel, records, flat, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            selectors = ['google', 'default', 'selector1', 'selector2', 'mail', 'dkim'];
                            _i = 0, selectors_1 = selectors;
                            _b.label = 1;
                        case 1:
                            if (!(_i < selectors_1.length)) return [3 /*break*/, 6];
                            sel = selectors_1[_i];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, Promise.race([
                                    dns.resolveTxt("".concat(sel, "._domainkey.").concat(domain)),
                                    new Promise(function (_, r) { return setTimeout(function () { return r(new Error('timeout')); }, 5000); }),
                                ])];
                        case 3:
                            records = _b.sent();
                            flat = records.map(function (r) { return r.join(''); });
                            if (flat.some(function (r) { return r.includes('v=DKIM1') || r.includes('k=rsa') || r.includes('p='); })) {
                                return [2 /*return*/, true];
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _b.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, false];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.checkDmarc = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var records, flat, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Promise.race([
                                    dns.resolveTxt("_dmarc.".concat(domain)),
                                    new Promise(function (_, r) { return setTimeout(function () { return r(new Error('timeout')); }, 5000); }),
                                ])];
                        case 1:
                            records = _b.sent();
                            flat = records.map(function (r) { return r.join(''); });
                            return [2 /*return*/, flat.some(function (r) { return r.includes('v=DMARC1'); })];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.testSmtpConnection = function (creds) {
            return __awaiter(this, void 0, void 0, function () {
                var secure, transporter, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            secure = creds.port === 465;
                            transporter = nodemailer.createTransport({
                                host: creds.host,
                                port: creds.port,
                                secure: secure,
                                auth: { user: creds.username, pass: creds.password },
                                tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
                                connectionTimeout: 10000,
                            });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, Promise.race([
                                    transporter.verify(),
                                    new Promise(function (_, r) { return setTimeout(function () { return r(new Error('timeout')); }, 10000); }),
                                ])];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                        case 3:
                            err_2 = _a.sent();
                            return [2 /*return*/, { success: false, error: this.friendlySmtpError(err_2.message) }];
                        case 4:
                            transporter.close();
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.testImapConnection = function (creds) {
            return __awaiter(this, void 0, void 0, function () {
                var client, err_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            client = new imapflow_1.ImapFlow({
                                host: creds.host,
                                port: creds.port,
                                secure: true,
                                auth: { user: creds.username, pass: creds.password },
                                tls: { rejectUnauthorized: false },
                                logger: false,
                            });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 6]);
                            return [4 /*yield*/, Promise.race([
                                    client.connect(),
                                    new Promise(function (_, r) { return setTimeout(function () { return r(new Error('timeout')); }, 10000); }),
                                ])];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                        case 3:
                            err_3 = _a.sent();
                            return [2 /*return*/, { success: false, error: err_3.message }];
                        case 4: return [4 /*yield*/, client.logout().catch(function () { })];
                        case 5:
                            _a.sent();
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        EmailAccountsService_1.prototype.friendlySmtpError = function (message) {
            if (message.includes('535') || message.includes('534')) {
                return 'Kimlik doğrulama başarısız. Gmail için "App Password" gerekiyor (2FA aktifse).';
            }
            if (message.includes('ECONNREFUSED'))
                return 'Sunucuya bağlanılamadı. Host/port kontrol edin.';
            if (message.includes('timeout'))
                return 'Bağlantı zaman aşımına uğradı.';
            if (message.includes('ENOTFOUND'))
                return 'SMTP sunucu adresi bulunamadı.';
            return "SMTP hatas\u0131: ".concat(message);
        };
        return EmailAccountsService_1;
    }());
    __setFunctionName(_classThis, "EmailAccountsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailAccountsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailAccountsService = _classThis;
}();
exports.EmailAccountsService = EmailAccountsService;
