"use strict";
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
exports.AnalyzeUrlProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var shared_1 = require("@autonomous-sales/shared");
var database_module_1 = require("../database/database.module");
// Simple in-memory cooldown: projectId → last job timestamp
var cooldowns = new Map();
var COOLDOWN_MS = 30000;
var AnalyzeUrlProcessor = function () {
    var _classDecorators = [(0, bull_1.Processor)(shared_1.QUEUE_NAMES.ANALYZE_URL)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handle_decorators;
    var AnalyzeUrlProcessor = _classThis = /** @class */ (function () {
        function AnalyzeUrlProcessor_1(db, scraperService, analyzerService) {
            this.db = (__runInitializers(this, _instanceExtraInitializers), db);
            this.scraperService = scraperService;
            this.analyzerService = analyzerService;
            this.logger = new common_1.Logger(AnalyzeUrlProcessor.name);
        }
        AnalyzeUrlProcessor_1.prototype.handle = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, _a, projectId, websiteUrl, lastRun, err_1, msg, scrapedData, err_2, msg, _b, result, tokensUsed, llmDuration, model, totalDuration, error_1, err;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            startTime = Date.now();
                            _a = job.data, projectId = _a.projectId, websiteUrl = _a.websiteUrl;
                            this.logger.log("[analyze-url] Job ".concat(job.id, " \u2014 project: ").concat(projectId, ", url: ").concat(websiteUrl));
                            lastRun = cooldowns.get(projectId);
                            if (lastRun && Date.now() - lastRun < COOLDOWN_MS) {
                                this.logger.warn("[analyze-url] Cooldown active for project ".concat(projectId, ", skipping"));
                                return [2 /*return*/, { skipped: true, reason: 'cooldown' }];
                            }
                            cooldowns.set(projectId, Date.now());
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 16, , 18]);
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 3, , 5]);
                            this.scraperService.validateUrl(websiteUrl);
                            return [3 /*break*/, 5];
                        case 3:
                            err_1 = _c.sent();
                            msg = err_1 instanceof Error ? err_1.message : String(err_1);
                            return [4 /*yield*/, this.markAnalysisFailed(projectId, "URL validation failed: ".concat(msg))];
                        case 4:
                            _c.sent();
                            throw err_1;
                        case 5:
                            // ── Step 2: Scrape ──────────────────────────────────────────────────
                            this.logger.log("[analyze-url] Scraping ".concat(websiteUrl, "..."));
                            scrapedData = void 0;
                            _c.label = 6;
                        case 6:
                            _c.trys.push([6, 8, , 11]);
                            return [4 /*yield*/, this.scraperService.scrape(websiteUrl)];
                        case 7:
                            scrapedData = _c.sent();
                            return [3 /*break*/, 11];
                        case 8:
                            err_2 = _c.sent();
                            msg = err_2 instanceof Error ? err_2.message : String(err_2);
                            this.logger.error("[analyze-url] Scraping failed: ".concat(msg));
                            return [4 /*yield*/, this.markAnalysisFailed(projectId, "Scraping failed: ".concat(msg))];
                        case 9:
                            _c.sent();
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'analyzer',
                                    trigger: shared_1.QUEUE_NAMES.ANALYZE_URL,
                                    inputPayload: job.data,
                                    status: 'error',
                                    errorMessage: msg,
                                    durationMs: Date.now() - startTime,
                                })];
                        case 10:
                            _c.sent();
                            throw err_2;
                        case 11: 
                        // Save raw scraped data
                        return [4 /*yield*/, this.db
                                .update(schema.projectAnalysis)
                                .set({ rawScrapedData: scrapedData })
                                .where((0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId))];
                        case 12:
                            // Save raw scraped data
                            _c.sent();
                            // ── Step 3: LLM Analysis ────────────────────────────────────────────
                            this.logger.log("[analyze-url] Running LLM analysis...");
                            return [4 /*yield*/, this.analyzerService.analyze(projectId, scrapedData)];
                        case 13:
                            _b = _c.sent(), result = _b.result, tokensUsed = _b.tokensUsed, llmDuration = _b.durationMs, model = _b.model;
                            // ── Step 4: Save to DB ──────────────────────────────────────────────
                            this.logger.log("[analyze-url] Saving results to DB...");
                            return [4 /*yield*/, this.analyzerService.saveToDatabase(projectId, result, model)];
                        case 14:
                            _c.sent();
                            totalDuration = Date.now() - startTime;
                            this.logger.log("[analyze-url] Job ".concat(job.id, " completed in ").concat(totalDuration, "ms. Tokens: ").concat(tokensUsed));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'analyzer',
                                    trigger: shared_1.QUEUE_NAMES.ANALYZE_URL,
                                    inputPayload: job.data,
                                    outputPayload: { industry: result.industry, businessType: result.business_type },
                                    status: 'success',
                                    tokensUsed: tokensUsed,
                                    modelUsed: model,
                                    durationMs: totalDuration,
                                })];
                        case 15:
                            _c.sent();
                            return [2 /*return*/, { success: true, industry: result.industry }];
                        case 16:
                            error_1 = _c.sent();
                            err = error_1;
                            this.logger.error("[analyze-url] Job ".concat(job.id, " failed: ").concat(err.message));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'analyzer',
                                    trigger: shared_1.QUEUE_NAMES.ANALYZE_URL,
                                    inputPayload: job.data,
                                    status: 'error',
                                    errorMessage: err.message,
                                    durationMs: Date.now() - startTime,
                                })];
                        case 17:
                            _c.sent();
                            throw error_1;
                        case 18: return [2 /*return*/];
                    }
                });
            });
        };
        AnalyzeUrlProcessor_1.prototype.markAnalysisFailed = function (projectId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.db
                                    .update(schema.projectAnalysis)
                                    .set({ rawScrapedData: { error: reason, failedAt: new Date().toISOString() } })
                                    .where((0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId))];
                        case 1:
                            _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return AnalyzeUrlProcessor_1;
    }());
    __setFunctionName(_classThis, "AnalyzeUrlProcessor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handle_decorators = [(0, bull_1.Process)()];
        __esDecorate(_classThis, null, _handle_decorators, { kind: "method", name: "handle", static: false, private: false, access: { has: function (obj) { return "handle" in obj; }, get: function (obj) { return obj.handle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyzeUrlProcessor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyzeUrlProcessor = _classThis;
}();
exports.AnalyzeUrlProcessor = AnalyzeUrlProcessor;
