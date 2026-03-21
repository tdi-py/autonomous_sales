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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var bull_1 = require("@nestjs/bull");
var shared_1 = require("@autonomous-sales/shared");
var analyze_url_processor_1 = require("./processors/analyze-url.processor");
var generate_campaign_processor_1 = require("./processors/generate-campaign.processor");
var send_outreach_processor_1 = require("./processors/send-outreach.processor");
var warmup_execute_processor_1 = require("./processors/warmup-execute.processor");
var phone_verify_processor_1 = require("./processors/phone-verify.processor");
var strategy_review_processor_1 = require("./processors/strategy-review.processor");
var compliance_check_processor_1 = require("./processors/compliance-check.processor");
var database_module_1 = require("./database/database.module");
// Minimal health controller so Railway knows the process is alive
var HealthController = function () {
    var _classDecorators = [(0, common_1.Controller)('health')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _check_decorators;
    var HealthController = _classThis = /** @class */ (function () {
        function HealthController_1() {
            __runInitializers(this, _instanceExtraInitializers);
        }
        HealthController_1.prototype.check = function () {
            return { status: 'ok', service: 'worker', timestamp: new Date().toISOString() };
        };
        return HealthController_1;
    }());
    __setFunctionName(_classThis, "HealthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _check_decorators = [(0, common_1.Get)()];
        __esDecorate(_classThis, null, _check_decorators, { kind: "method", name: "check", static: false, private: false, access: { has: function (obj) { return "check" in obj; }, get: function (obj) { return obj.check; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HealthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HealthController = _classThis;
}();
var WorkerModule = function () {
    var _a;
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
                // ─── Redis connection ───────────────────────────────────────────────────
                bull_1.BullModule.forRoot({
                    url: (_a = process.env.REDIS_URL) !== null && _a !== void 0 ? _a : 'redis://localhost:6379',
                    defaultJobOptions: {
                        removeOnComplete: 100, // keep last 100 completed jobs
                        removeOnFail: 500, // keep last 500 failed jobs for debugging
                    },
                }),
                // ─── Register all queues ────────────────────────────────────────────────
                bull_1.BullModule.registerQueue({ name: shared_1.QUEUE_NAMES.ANALYZE_URL }, { name: shared_1.QUEUE_NAMES.GENERATE_CAMPAIGN_CONTENT }, { name: shared_1.QUEUE_NAMES.SEND_OUTREACH }, { name: shared_1.QUEUE_NAMES.WARMUP_EXECUTE }, { name: shared_1.QUEUE_NAMES.PHONE_VERIFY }, { name: shared_1.QUEUE_NAMES.STRATEGY_REVIEW }, { name: shared_1.QUEUE_NAMES.COMPLIANCE_CHECK }),
                database_module_1.DatabaseModule,
            ],
            controllers: [HealthController],
            providers: [
                analyze_url_processor_1.AnalyzeUrlProcessor,
                generate_campaign_processor_1.GenerateCampaignProcessor,
                send_outreach_processor_1.SendOutreachProcessor,
                warmup_execute_processor_1.WarmupExecuteProcessor,
                phone_verify_processor_1.PhoneVerifyProcessor,
                strategy_review_processor_1.StrategyReviewProcessor,
                compliance_check_processor_1.ComplianceCheckProcessor,
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WorkerModule = _classThis = /** @class */ (function () {
        function WorkerModule_1() {
        }
        return WorkerModule_1;
    }());
    __setFunctionName(_classThis, "WorkerModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WorkerModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WorkerModule = _classThis;
}();
exports.WorkerModule = WorkerModule;
