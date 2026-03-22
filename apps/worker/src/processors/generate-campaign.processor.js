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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.GenerateCampaignProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var shared_1 = require("@autonomous-sales/shared");
var database_module_1 = require("../database/database.module");
var GenerateCampaignProcessor = function () {
    var _classDecorators = [(0, bull_1.Processor)(shared_1.QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handle_decorators;
    var GenerateCampaignProcessor = _classThis = /** @class */ (function () {
        function GenerateCampaignProcessor_1(db, communicatorService, contentCheckerService) {
            this.db = (__runInitializers(this, _instanceExtraInitializers), db);
            this.communicatorService = communicatorService;
            this.contentCheckerService = contentCheckerService;
            this.logger = new common_1.Logger(GenerateCampaignProcessor.name);
        }
        GenerateCampaignProcessor_1.prototype.handle = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, _a, projectId, campaignId, campaign, settings, targetLanguage, icpProfileId, analysis, icp, project, industryTemplateHint, templateType, template, ctx, result, _i, _b, step, reportA, existingScripts, nextVersion, durationMs, error_1, err, campaign, _c;
                var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                return __generator(this, function (_q) {
                    switch (_q.label) {
                        case 0:
                            startTime = Date.now();
                            _a = job.data, projectId = _a.projectId, campaignId = _a.campaignId;
                            this.logger.log("[generate-campaign] Job ".concat(job.id, " \u2014 campaign: ").concat(campaignId));
                            _q.label = 1;
                        case 1:
                            _q.trys.push([1, 23, , 31]);
                            return [4 /*yield*/, this.db.query.campaigns.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.campaigns.id, campaignId),
                                })];
                        case 2:
                            campaign = _q.sent();
                            if (!campaign) {
                                this.logger.warn("[generate-campaign] Campaign ".concat(campaignId, " not found, skipping"));
                                return [2 /*return*/, { skipped: true, reason: 'campaign_not_found' }];
                            }
                            settings = ((_d = campaign.settings) !== null && _d !== void 0 ? _d : {});
                            targetLanguage = (_e = settings.targetLanguage) !== null && _e !== void 0 ? _e : 'en';
                            icpProfileId = settings.icpProfileId;
                            return [4 /*yield*/, this.db.query.projectAnalysis.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId),
                                })];
                        case 3:
                            analysis = _q.sent();
                            if (!(analysis === null || analysis === void 0 ? void 0 : analysis.analyzedAt)) {
                                throw new Error('Proje analizi henüz tamamlanmamış. Önce URL analizi yapın.');
                            }
                            icp = null;
                            if (!icpProfileId) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.db.query.icpProfiles.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icpProfileId), (0, drizzle_orm_1.eq)(schema.icpProfiles.isActive, true)),
                                })];
                        case 4:
                            icp = _q.sent();
                            _q.label = 5;
                        case 5:
                            if (!!icp) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.db.query.icpProfiles.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId), (0, drizzle_orm_1.eq)(schema.icpProfiles.isActive, true)),
                                })];
                        case 6:
                            icp = _q.sent();
                            _q.label = 7;
                        case 7: return [4 /*yield*/, this.db.query.projects.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.projects.id, projectId),
                            })];
                        case 8:
                            project = _q.sent();
                            industryTemplateHint = void 0;
                            if (!(project === null || project === void 0 ? void 0 : project.industry)) return [3 /*break*/, 10];
                            templateType = campaign.type === 'cold_email' ? 'email_sequence' : 'call_script';
                            return [4 /*yield*/, this.db.query.industryTemplates.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.industryTemplates.industry, project.industry), (0, drizzle_orm_1.eq)(schema.industryTemplates.templateType, templateType), (0, drizzle_orm_1.eq)(schema.industryTemplates.isSystem, true)),
                                })];
                        case 9:
                            template = _q.sent();
                            if (template) {
                                industryTemplateHint = JSON.stringify(template.content);
                                this.logger.log("[generate-campaign] Using industry template: ".concat(template.name));
                            }
                            _q.label = 10;
                        case 10:
                            ctx = {
                                productDescription: (_f = analysis.productDescription) !== null && _f !== void 0 ? _f : '',
                                valueProposition: (_g = analysis.valueProposition) !== null && _g !== void 0 ? _g : '',
                                targetMarket: (_h = analysis.targetMarket) !== null && _h !== void 0 ? _h : '',
                                toneOfVoice: (_j = analysis.toneOfVoice) !== null && _j !== void 0 ? _j : 'professional',
                                icpLabel: (_k = icp === null || icp === void 0 ? void 0 : icp.label) !== null && _k !== void 0 ? _k : 'B2B decision makers',
                                jobTitles: (_l = icp === null || icp === void 0 ? void 0 : icp.jobTitles) !== null && _l !== void 0 ? _l : [],
                                painPoints: (_m = icp === null || icp === void 0 ? void 0 : icp.painPoints) !== null && _m !== void 0 ? _m : [],
                                industry: (_o = project === null || project === void 0 ? void 0 : project.industry) !== null && _o !== void 0 ? _o : 'saas',
                                targetLanguage: targetLanguage,
                                industryTemplateHint: industryTemplateHint,
                            };
                            // ── 6. İçerik üret ─────────────────────────────────────────────
                            this.logger.log("[generate-campaign] Calling CommunicatorService...");
                            return [4 /*yield*/, this.communicatorService.generateAll(ctx)];
                        case 11:
                            result = _q.sent();
                            // ── 7. Email sequences kaydet ───────────────────────────────────
                            return [4 /*yield*/, this.db
                                    .delete(schema.emailSequences)
                                    .where((0, drizzle_orm_1.eq)(schema.emailSequences.campaignId, campaignId))];
                        case 12:
                            // ── 7. Email sequences kaydet ───────────────────────────────────
                            _q.sent();
                            _i = 0, _b = result.emailSteps;
                            _q.label = 13;
                        case 13:
                            if (!(_i < _b.length)) return [3 /*break*/, 17];
                            step = _b[_i];
                            reportA = this.contentCheckerService.checkEmail(step.variantA.subject, step.variantA.body);
                            if (reportA.overallWarnings.length > 0) {
                                this.logger.warn("[generate-campaign] Step ".concat(step.stepOrder, " warnings: ").concat(reportA.overallWarnings.join(' | ')));
                            }
                            return [4 /*yield*/, this.db.insert(schema.emailSequences).values({
                                    campaignId: campaignId,
                                    stepOrder: step.stepOrder,
                                    subjectTemplate: step.variantA.subject,
                                    bodyTemplate: step.variantA.body,
                                    delayDays: step.delayDays,
                                    variantLabel: 'A',
                                    language: targetLanguage,
                                    modelUsed: result.modelUsed,
                                })];
                        case 14:
                            _q.sent();
                            return [4 /*yield*/, this.db.insert(schema.emailSequences).values({
                                    campaignId: campaignId,
                                    stepOrder: step.stepOrder,
                                    subjectTemplate: step.variantB.subject,
                                    bodyTemplate: step.variantB.body,
                                    delayDays: step.delayDays,
                                    variantLabel: 'B',
                                    language: targetLanguage,
                                    modelUsed: result.modelUsed,
                                })];
                        case 15:
                            _q.sent();
                            _q.label = 16;
                        case 16:
                            _i++;
                            return [3 /*break*/, 13];
                        case 17:
                            if (!(campaign.type === 'cold_call' || campaign.type === 'multi_channel')) return [3 /*break*/, 20];
                            return [4 /*yield*/, this.db.query.callScripts.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.callScripts.campaignId, campaignId),
                                })];
                        case 18:
                            existingScripts = _q.sent();
                            nextVersion = existingScripts.length + 1;
                            return [4 /*yield*/, this.db.insert(schema.callScripts).values({
                                    campaignId: campaignId,
                                    version: nextVersion,
                                    openingScript: result.callScript.opening_script,
                                    dialogueTree: result.callScript.dialogue_tree,
                                    objectionHandlers: result.callScript.objection_handlers,
                                    closingScript: result.callScript.closing_script,
                                    language: targetLanguage,
                                    modelUsed: result.modelUsed,
                                })];
                        case 19:
                            _q.sent();
                            _q.label = 20;
                        case 20: 
                        // ── 9. Content status güncelle ─────────────────────────────────
                        return [4 /*yield*/, this.db
                                .update(schema.campaigns)
                                .set({
                                settings: __assign(__assign({}, settings), { contentStatus: 'ready', generatedAt: new Date().toISOString() }),
                                updatedAt: new Date(),
                            })
                                .where((0, drizzle_orm_1.eq)(schema.campaigns.id, campaignId))];
                        case 21:
                            // ── 9. Content status güncelle ─────────────────────────────────
                            _q.sent();
                            durationMs = Date.now() - startTime;
                            this.logger.log("[generate-campaign] Job ".concat(job.id, " done in ").concat(durationMs, "ms. Tokens: ").concat(result.tokensUsed));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'communicator',
                                    trigger: shared_1.QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
                                    inputPayload: job.data,
                                    outputPayload: {
                                        campaignId: campaignId,
                                        emailStepsGenerated: result.emailSteps.length,
                                        tokensUsed: result.tokensUsed,
                                        model: result.modelUsed,
                                    },
                                    status: 'success',
                                    tokensUsed: result.tokensUsed,
                                    modelUsed: result.modelUsed,
                                    durationMs: durationMs,
                                })];
                        case 22:
                            _q.sent();
                            return [2 /*return*/, { success: true, emailSteps: result.emailSteps.length }];
                        case 23:
                            error_1 = _q.sent();
                            err = error_1;
                            this.logger.error("[generate-campaign] Job ".concat(job.id, " failed: ").concat(err.message));
                            _q.label = 24;
                        case 24:
                            _q.trys.push([24, 28, , 29]);
                            return [4 /*yield*/, this.db.query.campaigns.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.campaigns.id, campaignId),
                                })];
                        case 25:
                            campaign = _q.sent();
                            if (!campaign) return [3 /*break*/, 27];
                            return [4 /*yield*/, this.db
                                    .update(schema.campaigns)
                                    .set({
                                    settings: __assign(__assign({}, ((_p = campaign.settings) !== null && _p !== void 0 ? _p : {})), { contentStatus: 'error', contentError: err.message }),
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.campaigns.id, campaignId))];
                        case 26:
                            _q.sent();
                            _q.label = 27;
                        case 27: return [3 /*break*/, 29];
                        case 28:
                            _c = _q.sent();
                            return [3 /*break*/, 29];
                        case 29: return [4 /*yield*/, (0, database_module_1.logExecution)({
                                db: this.db,
                                projectId: projectId,
                                agentType: 'communicator',
                                trigger: shared_1.QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT,
                                inputPayload: job.data,
                                status: 'error',
                                errorMessage: err.message,
                                durationMs: Date.now() - startTime,
                            })];
                        case 30:
                            _q.sent();
                            throw error_1;
                        case 31: return [2 /*return*/];
                    }
                });
            });
        };
        return GenerateCampaignProcessor_1;
    }());
    __setFunctionName(_classThis, "GenerateCampaignProcessor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handle_decorators = [(0, bull_1.Process)()];
        __esDecorate(_classThis, null, _handle_decorators, { kind: "method", name: "handle", static: false, private: false, access: { has: function (obj) { return "handle" in obj; }, get: function (obj) { return obj.handle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GenerateCampaignProcessor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GenerateCampaignProcessor = _classThis;
}();
exports.GenerateCampaignProcessor = GenerateCampaignProcessor;
