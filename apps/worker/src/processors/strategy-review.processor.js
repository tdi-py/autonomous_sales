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
exports.StrategyReviewProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var common_1 = require("@nestjs/common");
var shared_1 = require("@autonomous-sales/shared");
var database_module_1 = require("../database/database.module");
var StrategyReviewProcessor = function () {
    var _classDecorators = [(0, bull_1.Processor)(shared_1.QUEUE_NAMES.STRATEGY_REVIEW)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handle_decorators;
    var StrategyReviewProcessor = _classThis = /** @class */ (function () {
        function StrategyReviewProcessor_1(db) {
            this.db = (__runInitializers(this, _instanceExtraInitializers), db);
            this.logger = new common_1.Logger(StrategyReviewProcessor.name);
        }
        StrategyReviewProcessor_1.prototype.handle = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, projectId, error_1, err;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            projectId = job.data.projectId;
                            this.logger.log("[strategy-review] Starting job ".concat(job.id, " \u2014 project: ").concat(projectId));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 5]);
                            // ─────────────────────────────────────────────────────────────────────
                            // FAZ 5'TE BURAYA EKLENECEKLER:
                            //   1. Son 7-14 günün outreach_events istatistiklerini çek
                            //      (open rate, reply rate, bounce rate per campaign/sequence)
                            //   2. inbox_messages sentiment dağılımını analiz et
                            //   3. GroqProvider ile Strategist Agent'ı çalıştır (Qwen3-32B)
                            //   4. Agent çıktısını strategy_decisions tablosuna yaz
                            //   5. Kararları uygula (prompt güncelle, ICP değiştir, A/B winner seç)
                            //   6. strategy_learned_rules tablosunu güncelle
                            //   7. platform_learned_rules'a proje öğrenimi yansıt (eğer confidence yüksekse)
                            //   8. Aktif prompt versiyonunu güncelle (prompt_versions tablosu)
                            // ─────────────────────────────────────────────────────────────────────
                            this.logger.log("[strategy-review] Job ".concat(job.id, " completed (placeholder)"));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'strategist',
                                    trigger: shared_1.QUEUE_NAMES.STRATEGY_REVIEW,
                                    inputPayload: job.data,
                                    outputPayload: { status: 'placeholder', message: 'Strategist Agent not yet implemented' },
                                    status: 'success',
                                    durationMs: Date.now() - startTime,
                                })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 3:
                            error_1 = _a.sent();
                            err = error_1;
                            this.logger.error("[strategy-review] Job ".concat(job.id, " failed: ").concat(err.message));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'strategist',
                                    trigger: shared_1.QUEUE_NAMES.STRATEGY_REVIEW,
                                    inputPayload: job.data,
                                    status: 'error',
                                    errorMessage: err.message,
                                    durationMs: Date.now() - startTime,
                                })];
                        case 4:
                            _a.sent();
                            throw error_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return StrategyReviewProcessor_1;
    }());
    __setFunctionName(_classThis, "StrategyReviewProcessor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handle_decorators = [(0, bull_1.Process)()];
        __esDecorate(_classThis, null, _handle_decorators, { kind: "method", name: "handle", static: false, private: false, access: { has: function (obj) { return "handle" in obj; }, get: function (obj) { return obj.handle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StrategyReviewProcessor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StrategyReviewProcessor = _classThis;
}();
exports.StrategyReviewProcessor = StrategyReviewProcessor;
