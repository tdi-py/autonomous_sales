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
exports.EmailAccountsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var EmailAccountsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Email Accounts'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('email-accounts')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _remove_decorators;
    var _testConnection_decorators;
    var _checkDns_decorators;
    var _startWarmup_decorators;
    var _pauseWarmup_decorators;
    var _resumeWarmup_decorators;
    var _getWarmupProgress_decorators;
    var _runDeliverabilityTest_decorators;
    var _getDeliverabilityHistory_decorators;
    var EmailAccountsController = _classThis = /** @class */ (function () {
        function EmailAccountsController_1(service) {
            this.service = (__runInitializers(this, _instanceExtraInitializers), service);
        }
        // ─── CRUD ──────────────────────────────────────────────────────────────────
        EmailAccountsController_1.prototype.create = function (req, dto) {
            return this.service.create(req.user.userId, dto);
        };
        EmailAccountsController_1.prototype.findAll = function (req, projectId) {
            return this.service.findAll(req.user.userId, projectId);
        };
        EmailAccountsController_1.prototype.findOne = function (id, req) {
            return this.service.findOne(id, req.user.userId);
        };
        EmailAccountsController_1.prototype.remove = function (id, req) {
            return this.service.remove(id, req.user.userId);
        };
        // ─── Connection test ───────────────────────────────────────────────────────
        EmailAccountsController_1.prototype.testConnection = function (id, req) {
            return this.service.testConnectionById(id, req.user.userId);
        };
        // ─── DNS check ─────────────────────────────────────────────────────────────
        EmailAccountsController_1.prototype.checkDns = function (id, req) {
            return this.service.runDnsCheck(id, req.user.userId);
        };
        // ─── Warmup controls ───────────────────────────────────────────────────────
        EmailAccountsController_1.prototype.startWarmup = function (id, req) {
            return this.service.startWarmup(id, req.user.userId);
        };
        EmailAccountsController_1.prototype.pauseWarmup = function (id, req) {
            return this.service.pauseWarmup(id, req.user.userId);
        };
        EmailAccountsController_1.prototype.resumeWarmup = function (id, req) {
            return this.service.resumeWarmup(id, req.user.userId);
        };
        EmailAccountsController_1.prototype.getWarmupProgress = function (id, req) {
            return this.service.getWarmupProgress(id, req.user.userId);
        };
        // ─── Deliverability ────────────────────────────────────────────────────────
        EmailAccountsController_1.prototype.runDeliverabilityTest = function (id, req) {
            return this.service.runDeliverabilityTest(id, req.user.userId);
        };
        EmailAccountsController_1.prototype.getDeliverabilityHistory = function (id, req) {
            return this.service.getDeliverabilityHistory(id, req.user.userId);
        };
        return EmailAccountsController_1;
    }());
    __setFunctionName(_classThis, "EmailAccountsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({
                summary: 'Email hesabı bağla — SMTP/IMAP test yapar, DNS kontrol eder',
            })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Projenin bağlı email hesaplarını listele' }), (0, swagger_1.ApiQuery)({ name: 'projectId', required: true, description: 'Project UUID' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Email hesabı detayı' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'Email account UUID' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Email hesabını kaldır' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _testConnection_decorators = [(0, common_1.Post)(':id/test-connection'), (0, swagger_1.ApiOperation)({ summary: 'SMTP ve IMAP bağlantısını yeniden test et' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _checkDns_decorators = [(0, common_1.Post)(':id/check-dns'), (0, swagger_1.ApiOperation)({ summary: 'SPF/DKIM/DMARC DNS kontrolünü tetikle' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _startWarmup_decorators = [(0, common_1.Post)(':id/start-warmup'), (0, swagger_1.ApiOperation)({ summary: 'Hesap ısındırmasını başlat' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _pauseWarmup_decorators = [(0, common_1.Post)(':id/pause-warmup'), (0, swagger_1.ApiOperation)({ summary: 'Hesap ısındırmasını duraklat' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _resumeWarmup_decorators = [(0, common_1.Post)(':id/resume-warmup'), (0, swagger_1.ApiOperation)({ summary: 'Hesap ısındırmasını devam ettir' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _getWarmupProgress_decorators = [(0, common_1.Get)(':id/warmup-progress'), (0, swagger_1.ApiOperation)({ summary: 'Isındırma durumu ve schedule' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _runDeliverabilityTest_decorators = [(0, common_1.Post)(':id/run-deliverability-test'), (0, swagger_1.ApiOperation)({ summary: 'Deliverability (spam) testi çalıştır' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        _getDeliverabilityHistory_decorators = [(0, common_1.Get)(':id/deliverability-history'), (0, swagger_1.ApiOperation)({ summary: 'Son deliverability test sonuçları' }), (0, swagger_1.ApiParam)({ name: 'id' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testConnection_decorators, { kind: "method", name: "testConnection", static: false, private: false, access: { has: function (obj) { return "testConnection" in obj; }, get: function (obj) { return obj.testConnection; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkDns_decorators, { kind: "method", name: "checkDns", static: false, private: false, access: { has: function (obj) { return "checkDns" in obj; }, get: function (obj) { return obj.checkDns; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _startWarmup_decorators, { kind: "method", name: "startWarmup", static: false, private: false, access: { has: function (obj) { return "startWarmup" in obj; }, get: function (obj) { return obj.startWarmup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _pauseWarmup_decorators, { kind: "method", name: "pauseWarmup", static: false, private: false, access: { has: function (obj) { return "pauseWarmup" in obj; }, get: function (obj) { return obj.pauseWarmup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resumeWarmup_decorators, { kind: "method", name: "resumeWarmup", static: false, private: false, access: { has: function (obj) { return "resumeWarmup" in obj; }, get: function (obj) { return obj.resumeWarmup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWarmupProgress_decorators, { kind: "method", name: "getWarmupProgress", static: false, private: false, access: { has: function (obj) { return "getWarmupProgress" in obj; }, get: function (obj) { return obj.getWarmupProgress; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runDeliverabilityTest_decorators, { kind: "method", name: "runDeliverabilityTest", static: false, private: false, access: { has: function (obj) { return "runDeliverabilityTest" in obj; }, get: function (obj) { return obj.runDeliverabilityTest; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDeliverabilityHistory_decorators, { kind: "method", name: "getDeliverabilityHistory", static: false, private: false, access: { has: function (obj) { return "getDeliverabilityHistory" in obj; }, get: function (obj) { return obj.getDeliverabilityHistory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailAccountsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailAccountsController = _classThis;
}();
exports.EmailAccountsController = EmailAccountsController;
