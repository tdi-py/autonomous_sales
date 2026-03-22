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
exports.WarmupService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
// ─── Warmup Schedule ─────────────────────────────────────────────────────────
// Day ranges → target emails per day
var WARMUP_SCHEDULE = [
    { fromDay: 1, toDay: 3, targetSends: 5 },
    { fromDay: 4, toDay: 7, targetSends: 10 },
    { fromDay: 8, toDay: 14, targetSends: 20 },
    { fromDay: 15, toDay: 21, targetSends: 35 },
    { fromDay: 22, toDay: 28, targetSends: 50 },
    { fromDay: 29, toDay: 999, targetSends: 0 }, // 0 = use account's plan limit (ready state)
];
var WARMUP_TOTAL_DAYS = 28;
// ─── Warmup Email Templates ───────────────────────────────────────────────────
var WARMUP_SUBJECTS = [
    'Quick question about our upcoming project',
    'Following up on our collaboration',
    'Wanted to share something with you',
    'Meeting recap and next steps',
    'A few thoughts on your proposal',
    'Checking in — how are things going?',
    'Your feedback would be valuable here',
    'Exciting update I wanted to share',
    'Brief update from our team',
    'Around 10 minutes of your time?',
    'I came across something you might find useful',
    'Following up from our last conversation',
    'Can we schedule a quick sync?',
    'Resource I thought you might appreciate',
    'Circling back on our discussion',
];
var WARMUP_BODIES = [
    "<p>Hi,</p><p>Hope you're having a great week. I wanted to follow up on our earlier conversation and see if you had any thoughts or questions. Looking forward to hearing from you.</p><p>Best,<br>Team</p>",
    "<p>Hello,</p><p>Just reaching out to share a quick update on our project. Things are moving along well and I think we're on track to meet our goals. Let me know if you'd like to connect for a quick sync.</p><p>Regards</p>",
    "<p>Hi there,</p><p>I came across an article this morning that made me think of our last discussion. Would love to get your perspective on it when you have a moment.</p><p>Thanks!</p>",
    "<p>Good morning,</p><p>Quick note to say that the proposal you sent over looks great. I have a few minor questions but overall it's exactly what we were hoping for. Can we find 15 minutes this week?</p><p>Best wishes</p>",
    "<p>Hello,</p><p>Following up on my previous message \u2014 no pressure at all, just wanted to make sure it didn't get buried. Happy to connect whenever works best for you.</p><p>Warm regards</p>",
    "<p>Hi,</p><p>Hope the week is treating you well. I wanted to share a few thoughts on the proposal we discussed. Overall the direction looks promising and I think the timing could work well for both parties.</p><p>Let me know your thoughts. Thanks!</p>",
    "<p>Hello,</p><p>Just a quick check-in. We've been making progress on our end and wanted to keep you in the loop. Everything is looking good so far. Looking forward to our next catch-up.</p><p>Best,<br>Team</p>",
];
// ─── Service ─────────────────────────────────────────────────────────────────
var WarmupService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WarmupService = _classThis = /** @class */ (function () {
        function WarmupService_1(db, smtpService) {
            this.db = db;
            this.smtpService = smtpService;
            this.logger = new common_1.Logger(WarmupService.name);
        }
        /**
         * Create warmup schedule entries for a newly connected email account.
         * Generates one row per day (28 days total).
         */
        WarmupService_1.prototype.createSchedule = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                var scheduleEntries, _loop_1, day;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            this.logger.log("[warmup] Creating 28-day schedule for account: ".concat(emailAccountId));
                            scheduleEntries = [];
                            _loop_1 = function (day) {
                                var rule = WARMUP_SCHEDULE.find(function (r) { return day >= r.fromDay && day <= r.toDay; });
                                scheduleEntries.push({
                                    emailAccountId: emailAccountId,
                                    dayNumber: day,
                                    targetSends: (_a = rule === null || rule === void 0 ? void 0 : rule.targetSends) !== null && _a !== void 0 ? _a : 5,
                                    actualSends: 0,
                                });
                            };
                            for (day = 1; day <= WARMUP_TOTAL_DAYS; day++) {
                                _loop_1(day);
                            }
                            return [4 /*yield*/, this.db.insert(schema.warmupSchedule).values(scheduleEntries)];
                        case 1:
                            _b.sent();
                            this.logger.log("[warmup] Created ".concat(scheduleEntries.length, " schedule entries"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Start warmup for an account (set status to 'warming').
         */
        WarmupService_1.prototype.startWarmup = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .update(schema.emailAccounts)
                                .set({
                                warmupStatus: 'warming',
                                warmupDay: 1,
                                dailySendLimit: 5, // Day 1 limit
                                updatedAt: new Date(),
                            })
                                .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId))];
                        case 1:
                            _a.sent();
                            this.logger.log("[warmup] Warmup started for account: ".concat(emailAccountId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Execute today's warmup sends for a specific account.
         * Called by warmup-execute processor.
         */
        WarmupService_1.prototype.executeDailyWarmup = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                var account, currentDay, scheduleEntry, targetSends, credentials, smtpCreds, seedRecipient, sent, errors, i, subject, body, result, error_1, err, delayMs, isLastDay, nextDay, nextRule, nextDailyLimit;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.db.query.emailAccounts.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId),
                            })];
                        case 1:
                            account = _f.sent();
                            if (!account) {
                                throw new Error("Email account not found: ".concat(emailAccountId));
                            }
                            if (account.warmupStatus !== 'warming') {
                                this.logger.log("[warmup] Account ".concat(emailAccountId, " is not in warming state (").concat(account.warmupStatus, ") \u2014 skipping"));
                                return [2 /*return*/, { sent: 0, errors: 0, completed: false }];
                            }
                            currentDay = (_a = account.warmupDay) !== null && _a !== void 0 ? _a : 1;
                            return [4 /*yield*/, this.db.query.warmupSchedule.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.warmupSchedule.emailAccountId, emailAccountId), (0, drizzle_orm_1.eq)(schema.warmupSchedule.dayNumber, currentDay)),
                                })];
                        case 2:
                            scheduleEntry = _f.sent();
                            if (!scheduleEntry) {
                                this.logger.warn("[warmup] No schedule entry for day ".concat(currentDay, " \u2014 account: ").concat(emailAccountId));
                                return [2 /*return*/, { sent: 0, errors: 0, completed: false }];
                            }
                            targetSends = scheduleEntry.targetSends;
                            credentials = account.authCredentials;
                            smtpCreds = {
                                host: (_b = account.smtpHost) !== null && _b !== void 0 ? _b : 'smtp.gmail.com',
                                port: (_c = account.smtpPort) !== null && _c !== void 0 ? _c : 587,
                                username: (_d = credentials === null || credentials === void 0 ? void 0 : credentials.username) !== null && _d !== void 0 ? _d : account.emailAddress,
                                password: (_e = credentials === null || credentials === void 0 ? void 0 : credentials.password) !== null && _e !== void 0 ? _e : '',
                            };
                            seedRecipient = this.getSeedRecipient();
                            sent = 0;
                            errors = 0;
                            i = 0;
                            _f.label = 3;
                        case 3:
                            if (!(i < targetSends)) return [3 /*break*/, 10];
                            _f.label = 4;
                        case 4:
                            _f.trys.push([4, 6, , 7]);
                            subject = this.pickRandom(WARMUP_SUBJECTS);
                            body = this.pickRandom(WARMUP_BODIES);
                            return [4 /*yield*/, this.smtpService.sendEmail(smtpCreds, {
                                    from: account.emailAddress,
                                    to: seedRecipient,
                                    subject: "[Warmup Day ".concat(currentDay, "] ").concat(subject),
                                    html: body,
                                })];
                        case 5:
                            result = _f.sent();
                            if (result.success) {
                                sent++;
                                this.logger.log("[warmup] Sent warmup email ".concat(i + 1, "/").concat(targetSends, " for account: ").concat(emailAccountId));
                            }
                            else {
                                errors++;
                                this.logger.warn("[warmup] Failed to send warmup email: ".concat(result.error));
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            error_1 = _f.sent();
                            errors++;
                            err = error_1;
                            this.logger.error("[warmup] Error sending warmup email: ".concat(err.message));
                            return [3 /*break*/, 7];
                        case 7:
                            if (!(i < targetSends - 1)) return [3 /*break*/, 9];
                            delayMs = (30 + Math.random() * 90) * 1000;
                            return [4 /*yield*/, this.sleep(delayMs)];
                        case 8:
                            _f.sent();
                            _f.label = 9;
                        case 9:
                            i++;
                            return [3 /*break*/, 3];
                        case 10: 
                        // Update schedule entry
                        return [4 /*yield*/, this.db
                                .update(schema.warmupSchedule)
                                .set({
                                actualSends: sent,
                                executedAt: new Date(),
                            })
                                .where((0, drizzle_orm_1.eq)(schema.warmupSchedule.id, scheduleEntry.id))];
                        case 11:
                            // Update schedule entry
                            _f.sent();
                            isLastDay = currentDay >= WARMUP_TOTAL_DAYS;
                            nextDay = currentDay + 1;
                            nextRule = WARMUP_SCHEDULE.find(function (r) { return nextDay >= r.fromDay && nextDay <= r.toDay; });
                            nextDailyLimit = nextRule && nextRule.targetSends > 0
                                ? nextRule.targetSends
                                : 200;
                            if (!isLastDay) return [3 /*break*/, 13];
                            // Warmup complete!
                            return [4 /*yield*/, this.db
                                    .update(schema.emailAccounts)
                                    .set({
                                    warmupStatus: 'ready',
                                    warmupDay: currentDay,
                                    dailySendLimit: 200,
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId))];
                        case 12:
                            // Warmup complete!
                            _f.sent();
                            this.logger.log("[warmup] \u2705 Warmup COMPLETE for account: ".concat(emailAccountId));
                            return [2 /*return*/, { sent: sent, errors: errors, completed: true }];
                        case 13: 
                        // Advance day
                        return [4 /*yield*/, this.db
                                .update(schema.emailAccounts)
                                .set({
                                warmupDay: nextDay,
                                dailySendLimit: nextDailyLimit,
                                updatedAt: new Date(),
                            })
                                .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId))];
                        case 14:
                            // Advance day
                            _f.sent();
                            this.logger.log("[warmup] Day ".concat(currentDay, " complete \u2014 advancing to day ").concat(nextDay, " (").concat(nextDailyLimit, " emails/day)"));
                            return [2 /*return*/, { sent: sent, errors: errors, completed: false }];
                    }
                });
            });
        };
        /**
         * Pause warmup.
         */
        WarmupService_1.prototype.pauseWarmup = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .update(schema.emailAccounts)
                                .set({ warmupStatus: 'paused', updatedAt: new Date() })
                                .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Resume warmup from paused state.
         */
        WarmupService_1.prototype.resumeWarmup = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db
                                .update(schema.emailAccounts)
                                .set({ warmupStatus: 'warming', updatedAt: new Date() })
                                .where((0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get warmup progress for an account.
         */
        WarmupService_1.prototype.getProgress = function (emailAccountId) {
            return __awaiter(this, void 0, void 0, function () {
                var account, schedule, completedDays, currentDay, today;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.db.query.emailAccounts.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.emailAccounts.id, emailAccountId),
                            })];
                        case 1:
                            account = _d.sent();
                            return [4 /*yield*/, this.db.query.warmupSchedule.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.warmupSchedule.emailAccountId, emailAccountId),
                                    orderBy: function (t, _a) {
                                        var asc = _a.asc;
                                        return [asc(t.dayNumber)];
                                    },
                                })];
                        case 2:
                            schedule = _d.sent();
                            completedDays = schedule.filter(function (s) { return s.executedAt !== null; }).length;
                            currentDay = (_a = account === null || account === void 0 ? void 0 : account.warmupDay) !== null && _a !== void 0 ? _a : 0;
                            today = (_b = schedule.find(function (s) { return s.dayNumber === currentDay; })) !== null && _b !== void 0 ? _b : null;
                            return [2 /*return*/, {
                                    account: account,
                                    schedule: schedule,
                                    completedDays: completedDays,
                                    totalDays: WARMUP_TOTAL_DAYS,
                                    percentComplete: Math.round((completedDays / WARMUP_TOTAL_DAYS) * 100),
                                    currentDailyLimit: (_c = account === null || account === void 0 ? void 0 : account.dailySendLimit) !== null && _c !== void 0 ? _c : 0,
                                    today: today,
                                }];
                    }
                });
            });
        };
        // ─── Private helpers ─────────────────────────────────────────────────────
        WarmupService_1.prototype.getSeedRecipient = function () {
            var _a;
            // Use platform seed address from env, fallback to self-send scenario
            return (_a = process.env.SEED_TEST_GMAIL) !== null && _a !== void 0 ? _a : 'warmup-seed@autonomous-sales.internal';
        };
        WarmupService_1.prototype.pickRandom = function (arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        };
        WarmupService_1.prototype.sleep = function (ms) {
            return new Promise(function (resolve) { return setTimeout(resolve, ms); });
        };
        return WarmupService_1;
    }());
    __setFunctionName(_classThis, "WarmupService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WarmupService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WarmupService = _classThis;
}();
exports.WarmupService = WarmupService;
