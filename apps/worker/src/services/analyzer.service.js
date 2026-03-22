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
exports.AnalyzerService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var shared_1 = require("@autonomous-sales/shared");
var BUSINESS_TYPE_MAP = {
    b2b: 'saas',
    b2c: 'ecommerce',
    b2b2c: 'saas',
    marketplace: 'marketplace',
    saas: 'saas',
    ecommerce: 'ecommerce',
    agency: 'agency',
    service: 'service',
    other: 'other',
};
var AnalyzerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AnalyzerService = _classThis = /** @class */ (function () {
        function AnalyzerService_1(db) {
            this.db = db;
            this.logger = new common_1.Logger(AnalyzerService.name);
        }
        AnalyzerService_1.prototype.analyze = function (projectId, scrapedData) {
            return __awaiter(this, void 0, void 0, function () {
                var llm, model, scrapedSummary, prompt, result, lastError, attempt, retryNote, llmResult, cleaned;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            llm = (0, shared_1.createLLMProvider)();
                            model = (0, shared_1.getModelForAgent)('analyzer');
                            scrapedSummary = JSON.stringify({
                                title: scrapedData.title,
                                meta: scrapedData.metaDescription,
                                og: scrapedData.openGraph,
                                headings: scrapedData.headings,
                                nav: scrapedData.navLinks,
                                pricing: scrapedData.pricing,
                                testimonials: scrapedData.testimonials.slice(0, 500),
                                body: scrapedData.bodyText.slice(0, 3000),
                            }, null, 2);
                            prompt = buildPrompt(scrapedSummary);
                            result = null;
                            lastError = null;
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt < 3)) return [3 /*break*/, 4];
                            retryNote = attempt > 0
                                ? '\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY valid JSON, nothing else, no markdown backticks.'
                                : '';
                            return [4 /*yield*/, llm.generateCompletion({
                                    model: model,
                                    prompt: prompt + retryNote,
                                    temperature: 0.3,
                                    maxTokens: 2000,
                                })];
                        case 2:
                            llmResult = _a.sent();
                            try {
                                cleaned = llmResult.content
                                    .replace(/<think>[\s\S]*?<\/think>/g, '')
                                    .replace(/```json\n?/g, '')
                                    .replace(/```\n?/g, '')
                                    .trim();
                                result = JSON.parse(cleaned);
                                return [2 /*return*/, {
                                        result: result,
                                        tokensUsed: llmResult.tokensUsed,
                                        durationMs: llmResult.durationMs,
                                        model: llmResult.model,
                                    }];
                            }
                            catch (e) {
                                lastError = e instanceof Error ? e : new Error(String(e));
                                this.logger.warn("[AnalyzerService] JSON parse failed on attempt ".concat(attempt + 1, ": ").concat(lastError.message));
                            }
                            _a.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4: throw new Error("Failed to parse LLM JSON after 3 attempts. Last error: ".concat(lastError === null || lastError === void 0 ? void 0 : lastError.message));
                    }
                });
            });
        };
        AnalyzerService_1.prototype.saveToDatabase = function (projectId, result, model) {
            return __awaiter(this, void 0, void 0, function () {
                var mappedBusinessType, existingIcps, _i, existingIcps_1, icp, i, icp;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            mappedBusinessType = (_a = BUSINESS_TYPE_MAP[result.business_type]) !== null && _a !== void 0 ? _a : 'other';
                            // Update project_analysis
                            return [4 /*yield*/, this.db
                                    .update(schema.projectAnalysis)
                                    .set({
                                    valueProposition: result.value_proposition,
                                    productDescription: result.product_description,
                                    targetMarket: result.target_market,
                                    keyFeatures: result.key_features,
                                    toneOfVoice: result.tone_of_voice,
                                    competitorsDetected: result.competitors_detected,
                                    analyzedAt: new Date(),
                                    modelUsed: model,
                                    userConfirmed: false,
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId))];
                        case 1:
                            // Update project_analysis
                            _b.sent();
                            // Update project industry/business_type
                            return [4 /*yield*/, this.db
                                    .update(schema.projects)
                                    .set({
                                    industry: result.industry,
                                    businessType: mappedBusinessType,
                                    updatedAt: new Date(),
                                })
                                    .where((0, drizzle_orm_1.eq)(schema.projects.id, projectId))];
                        case 2:
                            // Update project industry/business_type
                            _b.sent();
                            return [4 /*yield*/, this.db.query.icpProfiles.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId),
                                })];
                        case 3:
                            existingIcps = _b.sent();
                            _i = 0, existingIcps_1 = existingIcps;
                            _b.label = 4;
                        case 4:
                            if (!(_i < existingIcps_1.length)) return [3 /*break*/, 7];
                            icp = existingIcps_1[_i];
                            return [4 /*yield*/, this.db
                                    .update(schema.icpProfiles)
                                    .set({ isActive: false })
                                    .where((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icp.id))];
                        case 5:
                            _b.sent();
                            _b.label = 6;
                        case 6:
                            _i++;
                            return [3 /*break*/, 4];
                        case 7:
                            i = 0;
                            _b.label = 8;
                        case 8:
                            if (!(i < result.icp_suggestions.length)) return [3 /*break*/, 11];
                            icp = result.icp_suggestions[i];
                            return [4 /*yield*/, this.db.insert(schema.icpProfiles).values({
                                    projectId: projectId,
                                    label: icp.label,
                                    industry: icp.industry,
                                    companySize: icp.company_size,
                                    jobTitles: icp.job_titles,
                                    painPoints: icp.pain_points,
                                    geography: icp.geography,
                                    priority: String(i + 1),
                                    isActive: true,
                                })];
                        case 9:
                            _b.sent();
                            _b.label = 10;
                        case 10:
                            i++;
                            return [3 /*break*/, 8];
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        return AnalyzerService_1;
    }());
    __setFunctionName(_classThis, "AnalyzerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyzerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyzerService = _classThis;
}();
exports.AnalyzerService = AnalyzerService;
function buildPrompt(scrapedSummary) {
    return "You are a business analyst and marketing expert. Extract structured information from the website data below.\n\nReturn ONLY a JSON object (no markdown, no explanation), following this exact schema:\n{\n  \"value_proposition\": \"string (1-2 sentences)\",\n  \"product_description\": \"string (2-3 sentences)\",\n  \"target_market\": \"string (industry, company size, roles)\",\n  \"key_features\": [\"string\", \"string\", \"string\", \"string\", \"string\"],\n  \"industry\": \"saas|ecommerce|agency|service|marketplace|other\",\n  \"business_type\": \"b2b|b2c|b2b2c|marketplace\",\n  \"tone_of_voice\": \"professional|casual|technical|friendly|luxury\",\n  \"competitors_detected\": [\"string\"] or null,\n  \"icp_suggestions\": [\n    {\n      \"label\": \"string (short description, e.g. 'US-based SaaS companies 10-50 employees')\",\n      \"industry\": \"string\",\n      \"company_size\": \"string\",\n      \"job_titles\": [\"string\"],\n      \"pain_points\": [\"string\"],\n      \"geography\": \"string\"\n    }\n  ]\n}\n\nProvide 2-3 ICP suggestions. Be specific and actionable.\n\nWebsite data:\n---\n".concat(scrapedSummary, "\n---\n\nRETURN ONLY JSON:");
}
