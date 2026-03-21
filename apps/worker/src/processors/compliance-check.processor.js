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
exports.ComplianceCheckProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var shared_1 = require("@autonomous-sales/shared");
var database_module_1 = require("../database/database.module");
var ComplianceCheckProcessor = function () {
    var _classDecorators = [(0, bull_1.Processor)(shared_1.QUEUE_NAMES.COMPLIANCE_CHECK)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handle_decorators;
    var ComplianceCheckProcessor = _classThis = /** @class */ (function () {
        function ComplianceCheckProcessor_1(db) {
            this.db = (__runInitializers(this, _instanceExtraInitializers), db);
            this.logger = new common_1.Logger(ComplianceCheckProcessor.name);
        }
        ComplianceCheckProcessor_1.prototype.handle = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, _a, projectId, outreachEventId, leadId, channel, targetCountry, targetState, error_1, err, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            startTime = Date.now();
                            _a = job.data, projectId = _a.projectId, outreachEventId = _a.outreachEventId, leadId = _a.leadId, channel = _a.channel, targetCountry = _a.targetCountry, targetState = _a.targetState;
                            this.logger.log("[compliance-check] Starting job ".concat(job.id, " \u2014 event: ").concat(outreachEventId, ", channel: ").concat(channel, ", country: ").concat(targetCountry));
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 4, , 10]);
                            // ─────────────────────────────────────────────────────────────────────
                            // FAZ 6'DA BURAYA EKLENECEKLER (EMAIL):
                            //   1. compliance_rules'dan ülke/eyalet kurallarını çek
                            //   2. Suppression list kontrolü
                            //   3. CAN-SPAM zorunlulukları: fiziksel adres var mı? unsubscribe linki var mı?
                            //   4. GDPR: hedef AB ülkesiyse legitimate interest dokümantasyonu var mı?
                            //   5. CASL: hedef CA ise consent kaydı var mı?
                            //
                            // FAZ 6'DA BURAYA EKLENECEKLER (CALL):
                            //   1. phone_verification tablosundan sınıflandırmayı oku
                            //   2. call_consent_records tablosundan consent durumunu kontrol et
                            //   3. Arama saati kuralları (Florida: 8-20, max 3/gün)
                            //   4. California iki taraflı kayıt rızası kontrolü
                            //   5. DNC listesi son kontrol
                            //
                            // ÖNEMLİ: Bu processor retry OLMADAN çalışır.
                            // Başarısız olursa outreach_events.status = 'failed' olarak işaretlenir.
                            // ─────────────────────────────────────────────────────────────────────
                            // Placeholder: varsayılan olarak 'pass' döndür
                            return [4 /*yield*/, this.db.insert(schema.complianceChecks).values({
                                    outreachEventId: outreachEventId,
                                    checksPassed: ['placeholder_check'],
                                    overallResult: 'pass',
                                    blockedReason: null,
                                })];
                        case 2:
                            // ─────────────────────────────────────────────────────────────────────
                            // FAZ 6'DA BURAYA EKLENECEKLER (EMAIL):
                            //   1. compliance_rules'dan ülke/eyalet kurallarını çek
                            //   2. Suppression list kontrolü
                            //   3. CAN-SPAM zorunlulukları: fiziksel adres var mı? unsubscribe linki var mı?
                            //   4. GDPR: hedef AB ülkesiyse legitimate interest dokümantasyonu var mı?
                            //   5. CASL: hedef CA ise consent kaydı var mı?
                            //
                            // FAZ 6'DA BURAYA EKLENECEKLER (CALL):
                            //   1. phone_verification tablosundan sınıflandırmayı oku
                            //   2. call_consent_records tablosundan consent durumunu kontrol et
                            //   3. Arama saati kuralları (Florida: 8-20, max 3/gün)
                            //   4. California iki taraflı kayıt rızası kontrolü
                            //   5. DNC listesi son kontrol
                            //
                            // ÖNEMLİ: Bu processor retry OLMADAN çalışır.
                            // Başarısız olursa outreach_events.status = 'failed' olarak işaretlenir.
                            // ─────────────────────────────────────────────────────────────────────
                            // Placeholder: varsayılan olarak 'pass' döndür
                            _c.sent();
                            this.logger.log("[compliance-check] Job ".concat(job.id, " completed \u2014 result: pass (placeholder)"));
                            return [4 /*yield*/, (0, database_module_1.logExecution)({
                                    db: this.db,
                                    projectId: projectId,
                                    agentType: 'analyzer',
                                    trigger: shared_1.QUEUE_NAMES.COMPLIANCE_CHECK,
                                    inputPayload: job.data,
                                    outputPayload: { result: 'pass', status: 'placeholder' },
                                    status: 'success',
                                    durationMs: Date.now() - startTime,
                                })];
                        case 3:
                            _c.sent();
                            return [2 /*return*/, { result: 'pass' }];
                        case 4:
                            error_1 = _c.sent();
                            err = error_1;
                            this.logger.error("[compliance-check] Job ".concat(job.id, " failed: ").concat(err.message));
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.db
                                    .update(schema.outreachEvents)
                                    .set({ status: 'failed', metadata: { complianceError: err.message } })
                                    .where((0, drizzle_orm_1.eq)(schema.outreachEvents.id, outreachEventId))];
                        case 6:
                            _c.sent();
                            return [3 /*break*/, 8];
                        case 7:
                            _b = _c.sent();
                            return [3 /*break*/, 8];
                        case 8: return [4 /*yield*/, (0, database_module_1.logExecution)({
                                db: this.db,
                                projectId: projectId,
                                agentType: 'analyzer',
                                trigger: shared_1.QUEUE_NAMES.COMPLIANCE_CHECK,
                                inputPayload: job.data,
                                status: 'error',
                                errorMessage: err.message,
                                durationMs: Date.now() - startTime,
                            })];
                        case 9:
                            _c.sent();
                            return [3 /*break*/, 10];
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        return ComplianceCheckProcessor_1;
    }());
    __setFunctionName(_classThis, "ComplianceCheckProcessor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handle_decorators = [(0, bull_1.Process)()];
        __esDecorate(_classThis, null, _handle_decorators, { kind: "method", name: "handle", static: false, private: false, access: { has: function (obj) { return "handle" in obj; }, get: function (obj) { return obj.handle; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComplianceCheckProcessor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComplianceCheckProcessor = _classThis;
}();
exports.ComplianceCheckProcessor = ComplianceCheckProcessor;
