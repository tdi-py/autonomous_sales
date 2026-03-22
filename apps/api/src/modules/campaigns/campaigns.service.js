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
exports.CampaignsService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var CampaignsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CampaignsService = _classThis = /** @class */ (function () {
        function CampaignsService_1(db, generateQueue) {
            this.db = db;
            this.generateQueue = generateQueue;
        }
        // ─── Campaign CRUD ─────────────────────────────────────────────────────────
        CampaignsService_1.prototype.create = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, job;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(dto.projectId, userId)];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, this.db
                                    .insert(schema.campaigns)
                                    .values({
                                    projectId: dto.projectId,
                                    name: dto.name,
                                    type: (_a = dto.type) !== null && _a !== void 0 ? _a : 'cold_email',
                                    status: 'draft',
                                    settings: {
                                        icpProfileId: dto.icpProfileId,
                                        targetLanguage: (_b = dto.targetLanguage) !== null && _b !== void 0 ? _b : 'en',
                                        additionalNotes: dto.additionalNotes,
                                        scriptOnly: (_c = dto.scriptOnly) !== null && _c !== void 0 ? _c : false,
                                        contentStatus: 'generating',
                                    },
                                })
                                    .returning()];
                        case 2:
                            campaign = (_d.sent())[0];
                            return [4 /*yield*/, this.generateQueue.add({
                                    projectId: dto.projectId,
                                    campaignId: campaign.id,
                                    workspaceId: '', // assertProjectAccess'te alınabilir ama şimdilik boş
                                    agentType: 'communicator',
                                }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })];
                        case 3:
                            job = _d.sent();
                            return [2 /*return*/, __assign(__assign({}, campaign), { contentStatus: 'generating', jobId: job.id })];
                    }
                });
            });
        };
        CampaignsService_1.prototype.findAll = function (userId, projectId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaigns;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.campaigns.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.campaigns.projectId, projectId),
                                    orderBy: function (t, _a) {
                                        var desc = _a.desc;
                                        return [desc(t.createdAt)];
                                    },
                                })];
                        case 2:
                            campaigns = _a.sent();
                            return [2 /*return*/, campaigns.map(function (c) {
                                    var _a, _b;
                                    return (__assign(__assign({}, c), { contentStatus: (_b = (_a = c.settings) === null || _a === void 0 ? void 0 : _a.contentStatus) !== null && _b !== void 0 ? _b : 'pending' }));
                                })];
                    }
                });
            });
        };
        CampaignsService_1.prototype.findOne = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, settings, contentStatus, sequences, scripts;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.db.query.campaigns.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.campaigns.id, id),
                            })];
                        case 1:
                            campaign = _c.sent();
                            if (!campaign)
                                throw new common_1.NotFoundException('Campaign not found');
                            return [4 /*yield*/, this.assertProjectAccess(campaign.projectId, userId)];
                        case 2:
                            _c.sent();
                            settings = ((_a = campaign.settings) !== null && _a !== void 0 ? _a : {});
                            contentStatus = (_b = settings.contentStatus) !== null && _b !== void 0 ? _b : 'pending';
                            if (!(contentStatus === 'ready')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.getSequences(id, userId)];
                        case 3:
                            sequences = _c.sent();
                            return [4 /*yield*/, this.getScripts(id, userId)];
                        case 4:
                            scripts = _c.sent();
                            return [2 /*return*/, __assign(__assign({}, campaign), { contentStatus: contentStatus, sequences: sequences, scripts: scripts })];
                        case 5: return [2 /*return*/, __assign(__assign({}, campaign), { contentStatus: contentStatus })];
                    }
                });
            });
        };
        CampaignsService_1.prototype.update = function (id, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            campaign = _a.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.campaigns)
                                    .set(__assign(__assign({}, dto), { updatedAt: new Date() }))
                                    .where((0, drizzle_orm_1.eq)(schema.campaigns.id, campaign.id))
                                    .returning()];
                        case 2:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CampaignsService_1.prototype.remove = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            campaign = _a.sent();
                            return [4 /*yield*/, this.db.delete(schema.campaigns).where((0, drizzle_orm_1.eq)(schema.campaigns.id, campaign.id))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        // ─── Content Status ────────────────────────────────────────────────────────
        CampaignsService_1.prototype.getContentStatus = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, settings;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.db.query.campaigns.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.campaigns.id, id),
                            })];
                        case 1:
                            campaign = _e.sent();
                            if (!campaign)
                                throw new common_1.NotFoundException('Campaign not found');
                            return [4 /*yield*/, this.assertProjectAccess(campaign.projectId, userId)];
                        case 2:
                            _e.sent();
                            settings = ((_a = campaign.settings) !== null && _a !== void 0 ? _a : {});
                            return [2 /*return*/, {
                                    campaignId: id,
                                    contentStatus: (_b = settings.contentStatus) !== null && _b !== void 0 ? _b : 'pending',
                                    generatedAt: (_c = settings.generatedAt) !== null && _c !== void 0 ? _c : null,
                                    contentError: (_d = settings.contentError) !== null && _d !== void 0 ? _d : null,
                                }];
                    }
                });
            });
        };
        // ─── Email Sequences ───────────────────────────────────────────────────────
        CampaignsService_1.prototype.getSequences = function (campaignId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var rows, grouped, _i, rows_1, row, key;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.db.query.emailSequences.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.emailSequences.campaignId, campaignId),
                                    orderBy: function (t, _a) {
                                        var asc = _a.asc;
                                        return [asc(t.stepOrder), asc(t.variantLabel)];
                                    },
                                })];
                        case 2:
                            rows = _b.sent();
                            grouped = {};
                            for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                                row = rows_1[_i];
                                key = "step".concat(row.stepOrder);
                                if (!grouped[key])
                                    grouped[key] = {};
                                grouped[key][(_a = row.variantLabel) !== null && _a !== void 0 ? _a : 'A'] = row;
                            }
                            return [2 /*return*/, { grouped: grouped, flat: rows }];
                    }
                });
            });
        };
        CampaignsService_1.prototype.createSequenceStep = function (campaignId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var step;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db
                                    .insert(schema.emailSequences)
                                    .values(__assign({ campaignId: campaignId }, dto))
                                    .returning()];
                        case 2:
                            step = (_a.sent())[0];
                            return [2 /*return*/, step];
                    }
                });
            });
        };
        CampaignsService_1.prototype.updateSequenceStep = function (campaignId, sequenceId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var seq, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.emailSequences.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.emailSequences.id, sequenceId), (0, drizzle_orm_1.eq)(schema.emailSequences.campaignId, campaignId)),
                                })];
                        case 2:
                            seq = _a.sent();
                            if (!seq)
                                throw new common_1.NotFoundException('Email sequence not found');
                            return [4 /*yield*/, this.db
                                    .update(schema.emailSequences)
                                    .set(dto)
                                    .where((0, drizzle_orm_1.eq)(schema.emailSequences.id, sequenceId))
                                    .returning()];
                        case 3:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        // ─── Call Scripts ──────────────────────────────────────────────────────────
        CampaignsService_1.prototype.getScripts = function (campaignId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.db.query.callScripts.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.callScripts.campaignId, campaignId),
                                    orderBy: function (t, _a) {
                                        var desc = _a.desc;
                                        return [desc(t.version)];
                                    },
                                })];
                    }
                });
            });
        };
        CampaignsService_1.prototype.createScript = function (campaignId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, nextVersion, script;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.callScripts.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.callScripts.campaignId, campaignId),
                                })];
                        case 2:
                            existing = _a.sent();
                            nextVersion = existing.length + 1;
                            return [4 /*yield*/, this.db
                                    .insert(schema.callScripts)
                                    .values(__assign({ campaignId: campaignId, version: nextVersion }, dto))
                                    .returning()];
                        case 3:
                            script = (_a.sent())[0];
                            return [2 /*return*/, script];
                    }
                });
            });
        };
        CampaignsService_1.prototype.updateScript = function (campaignId, scriptId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var script, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.callScripts.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.callScripts.id, scriptId), (0, drizzle_orm_1.eq)(schema.callScripts.campaignId, campaignId)),
                                })];
                        case 2:
                            script = _a.sent();
                            if (!script)
                                throw new common_1.NotFoundException('Call script not found');
                            return [4 /*yield*/, this.db
                                    .update(schema.callScripts)
                                    .set(dto)
                                    .where((0, drizzle_orm_1.eq)(schema.callScripts.id, scriptId))
                                    .returning()];
                        case 3:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        // ─── Regenerate ────────────────────────────────────────────────────────────
        CampaignsService_1.prototype.regenerate = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, job;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            campaign = _a.sent();
                            // Status güncelle
                            return [4 /*yield*/, this.db
                                    .update(schema.campaigns)
                                    .set({
                                    settings: __assign(__assign({}, campaign.settings), { contentStatus: 'generating', contentError: null }),
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.campaigns.id, id))];
                        case 2:
                            // Status güncelle
                            _a.sent();
                            return [4 /*yield*/, this.generateQueue.add({
                                    projectId: campaign.projectId,
                                    campaignId: id,
                                    workspaceId: '',
                                    agentType: 'communicator',
                                }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })];
                        case 3:
                            job = _a.sent();
                            return [2 /*return*/, { campaignId: id, contentStatus: 'generating', jobId: job.id }];
                    }
                });
            });
        };
        CampaignsService_1.prototype.regenerateStep = function (id, stepOrder, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, seqsToDelete, _i, seqsToDelete_1, seq, job;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            campaign = _a.sent();
                            return [4 /*yield*/, this.db.query.emailSequences.findMany({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.emailSequences.campaignId, id), (0, drizzle_orm_1.eq)(schema.emailSequences.stepOrder, stepOrder)),
                                })];
                        case 2:
                            seqsToDelete = _a.sent();
                            _i = 0, seqsToDelete_1 = seqsToDelete;
                            _a.label = 3;
                        case 3:
                            if (!(_i < seqsToDelete_1.length)) return [3 /*break*/, 6];
                            seq = seqsToDelete_1[_i];
                            return [4 /*yield*/, this.db.delete(schema.emailSequences)
                                    .where((0, drizzle_orm_1.eq)(schema.emailSequences.id, seq.id))];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [4 /*yield*/, this.generateQueue.add({
                                projectId: campaign.projectId,
                                campaignId: id,
                                workspaceId: '',
                                agentType: 'communicator',
                            }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })];
                        case 7:
                            job = _a.sent();
                            return [2 /*return*/, { campaignId: id, stepOrder: stepOrder, contentStatus: 'generating', jobId: job.id }];
                    }
                });
            });
        };
        // ─── Preflight Check ──────────────────────────────────────────────────────
        CampaignsService_1.prototype.preflightCheck = function (campaignId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, projectId, checks, emailAccounts, ready, warming, account, spfOk, dkimOk, dmarcOk, daysLeft, settings, contentStatus, leadCount, lastTest, blockers, warnings, canLaunch;
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0: return [4 /*yield*/, this.findOne(campaignId, userId)];
                        case 1:
                            campaign = _k.sent();
                            projectId = campaign.projectId;
                            checks = [];
                            return [4 /*yield*/, this.db.query.emailAccounts.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.emailAccounts.projectId, projectId),
                                })];
                        case 2:
                            emailAccounts = _k.sent();
                            if (emailAccounts.length === 0) {
                                checks.push({
                                    id: 'email_account',
                                    label: 'Email Hesabı',
                                    status: 'fail',
                                    message: 'Email hesabı bağlanmamış.',
                                    action: 'Önce email hesabı bağlayın',
                                });
                            }
                            else {
                                ready = emailAccounts.find(function (a) { return a.warmupStatus === 'ready'; });
                                warming = emailAccounts.find(function (a) { return a.warmupStatus === 'warming'; });
                                account = (_a = ready !== null && ready !== void 0 ? ready : warming) !== null && _a !== void 0 ? _a : emailAccounts[0];
                                spfOk = (_b = account.spfValid) !== null && _b !== void 0 ? _b : false;
                                dkimOk = (_c = account.dkimValid) !== null && _c !== void 0 ? _c : false;
                                dmarcOk = (_d = account.dmarcValid) !== null && _d !== void 0 ? _d : false;
                                if (!spfOk || !dkimOk) {
                                    checks.push({
                                        id: 'dns',
                                        label: 'DNS Kayıtları',
                                        status: 'fail',
                                        message: "DNS eksik: ".concat(!spfOk ? 'SPF ' : '').concat(!dkimOk ? 'DKIM ' : '').concat(!dmarcOk ? 'DMARC' : '', "."),
                                        action: 'Email hesabı sayfasından DNS yapılandırmasını tamamlayın',
                                    });
                                }
                                else if (!dmarcOk) {
                                    checks.push({
                                        id: 'dns',
                                        label: 'DNS Kayıtları',
                                        status: 'warn',
                                        message: 'SPF ve DKIM geçerli ancak DMARC eksik.',
                                        action: 'DMARC kaydı ekleyerek korumayı güçlendirin',
                                    });
                                }
                                else {
                                    checks.push({
                                        id: 'dns',
                                        label: 'DNS Kayıtları',
                                        status: 'pass',
                                        message: 'SPF, DKIM ve DMARC geçerli ✅',
                                    });
                                }
                                // ── 3. Isındırma durumu ──────────────────────────────────────────────
                                checks.push({
                                    id: 'email_account',
                                    label: 'Email Hesabı',
                                    status: 'pass',
                                    message: "".concat(account.emailAddress, " ba\u011Fl\u0131"),
                                });
                                if (account.warmupStatus === 'not_started') {
                                    checks.push({
                                        id: 'warmup',
                                        label: 'Email Isındırma',
                                        status: 'warn',
                                        message: 'Hesap henüz ısındırılmamış. Teslim edilebilirlik sorunları yaşanabilir.',
                                        action: 'Isındırmayı başlatın',
                                    });
                                }
                                else if (account.warmupStatus === 'warming') {
                                    daysLeft = 28 - ((_e = account.warmupDay) !== null && _e !== void 0 ? _e : 0);
                                    checks.push({
                                        id: 'warmup',
                                        label: 'Email Isındırma',
                                        status: 'warn',
                                        message: "Is\u0131nd\u0131rma devam ediyor \u2014 ".concat(daysLeft, " g\u00FCn kald\u0131. G\u00FCnl\u00FCk limit: ").concat(account.dailySendLimit, " email."),
                                    });
                                }
                                else if (account.warmupStatus === 'ready') {
                                    checks.push({
                                        id: 'warmup',
                                        label: 'Email Isındırma',
                                        status: 'pass',
                                        message: 'Hesap hazır ✅',
                                    });
                                }
                                else {
                                    checks.push({
                                        id: 'warmup',
                                        label: 'Email Isındırma',
                                        status: 'fail',
                                        message: 'Isındırma duraklamış.',
                                        action: 'Isındırmayı devam ettirin',
                                    });
                                }
                            }
                            settings = ((_f = campaign.settings) !== null && _f !== void 0 ? _f : {});
                            contentStatus = (_g = settings.contentStatus) !== null && _g !== void 0 ? _g : 'pending';
                            if (contentStatus === 'ready') {
                                checks.push({
                                    id: 'content',
                                    label: 'Kampanya İçeriği',
                                    status: 'pass',
                                    message: 'Email dizisi ve içerik hazır ✅',
                                });
                            }
                            else if (contentStatus === 'generating') {
                                checks.push({
                                    id: 'content',
                                    label: 'Kampanya İçeriği',
                                    status: 'warn',
                                    message: 'İçerik henüz üretiliyor. Tamamlanmasını bekleyin.',
                                });
                            }
                            else {
                                checks.push({
                                    id: 'content',
                                    label: 'Kampanya İçeriği',
                                    status: 'fail',
                                    message: 'Kampanya içeriği oluşturulmamış.',
                                    action: 'Kampanya içeriği oluşturun',
                                });
                            }
                            return [4 /*yield*/, this.db.query.leads.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.leads.projectId, projectId),
                                    limit: 1,
                                })];
                        case 3:
                            leadCount = _k.sent();
                            if (leadCount.length === 0) {
                                checks.push({
                                    id: 'leads',
                                    label: 'Lead Listesi',
                                    status: 'fail',
                                    message: 'Kampanyaya lead eklenmemiş.',
                                    action: 'Lead ekleyin',
                                });
                            }
                            else {
                                checks.push({
                                    id: 'leads',
                                    label: 'Lead Listesi',
                                    status: 'pass',
                                    message: 'Lead listesi mevcut ✅',
                                });
                            }
                            if (!(emailAccounts.length > 0)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.db.query.deliverabilityTests.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.deliverabilityTests.emailAccountId, emailAccounts[0].id),
                                    orderBy: function (t, _a) {
                                        var desc = _a.desc;
                                        return [desc(t.testedAt)];
                                    },
                                })];
                        case 4:
                            lastTest = _k.sent();
                            if (!lastTest) {
                                checks.push({
                                    id: 'deliverability',
                                    label: 'Spam Testi',
                                    status: 'warn',
                                    message: 'Hiç spam testi yapılmamış.',
                                    action: 'Gönderim öncesi spam testi çalıştırın',
                                });
                            }
                            else if (((_h = lastTest.overallScore) !== null && _h !== void 0 ? _h : 0) < 50) {
                                checks.push({
                                    id: 'deliverability',
                                    label: 'Spam Testi',
                                    status: 'fail',
                                    message: "Son spam testi ba\u015Far\u0131s\u0131z (skor: ".concat((_j = lastTest.overallScore) !== null && _j !== void 0 ? _j : 0, "/100)."),
                                    action: 'Spam testini tekrar çalıştırın',
                                });
                            }
                            else {
                                checks.push({
                                    id: 'deliverability',
                                    label: 'Spam Testi',
                                    status: 'pass',
                                    message: "Son spam testi ge\u00E7ti (skor: ".concat(lastTest.overallScore, "/100) \u2705"),
                                });
                            }
                            _k.label = 5;
                        case 5:
                            blockers = checks.filter(function (c) { return c.status === 'fail'; });
                            warnings = checks.filter(function (c) { return c.status === 'warn'; });
                            canLaunch = blockers.length === 0;
                            return [2 /*return*/, { canLaunch: canLaunch, checks: checks, warnings: warnings, blockers: blockers }];
                    }
                });
            });
        };
        // ─── Private ──────────────────────────────────────────────────────────────
        CampaignsService_1.prototype.assertProjectAccess = function (projectId, userId) {
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
        return CampaignsService_1;
    }());
    __setFunctionName(_classThis, "CampaignsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignsService = _classThis;
}();
exports.CampaignsService = CampaignsService;
