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
exports.LeadsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var LeadsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Leads'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('leads')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _importCsv_decorators;
    var _getEnrichment_decorators;
    var _getPhoneVerification_decorators;
    var LeadsController = _classThis = /** @class */ (function () {
        function LeadsController_1(leadsService) {
            this.leadsService = (__runInitializers(this, _instanceExtraInitializers), leadsService);
        }
        LeadsController_1.prototype.create = function (req, dto) {
            return this.leadsService.create(req.user.userId, dto);
        };
        LeadsController_1.prototype.findAll = function (req, query) {
            return this.leadsService.findAll(req.user.userId, query);
        };
        LeadsController_1.prototype.findOne = function (id, req) {
            return this.leadsService.findOne(id, req.user.userId);
        };
        LeadsController_1.prototype.update = function (id, req, dto) {
            return this.leadsService.update(id, req.user.userId, dto);
        };
        LeadsController_1.prototype.remove = function (id, req) {
            return this.leadsService.remove(id, req.user.userId);
        };
        LeadsController_1.prototype.importCsv = function (req, projectId) {
            return this.leadsService.importCsv(req.user.userId, projectId);
        };
        LeadsController_1.prototype.getEnrichment = function (id, req) {
            return this.leadsService.getEnrichment(id, req.user.userId);
        };
        LeadsController_1.prototype.getPhoneVerification = function (id, req) {
            return this.leadsService.getPhoneVerification(id, req.user.userId);
        };
        return LeadsController_1;
    }());
    __setFunctionName(_classThis, "LeadsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create a single lead' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'List leads with filters (status, phone classification, ICP)' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get a single lead with enrichment + phone data' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update lead' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete lead' })];
        _importCsv_decorators = [(0, common_1.Post)('import'), (0, swagger_1.ApiOperation)({ summary: 'Import leads from CSV (placeholder — Phase 3)' })];
        _getEnrichment_decorators = [(0, common_1.Get)(':id/enrichment'), (0, swagger_1.ApiOperation)({ summary: 'Get enrichment data for a lead' })];
        _getPhoneVerification_decorators = [(0, common_1.Get)(':id/phone-verification'), (0, swagger_1.ApiOperation)({ summary: 'Get phone verification + call classification for a lead' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _importCsv_decorators, { kind: "method", name: "importCsv", static: false, private: false, access: { has: function (obj) { return "importCsv" in obj; }, get: function (obj) { return obj.importCsv; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEnrichment_decorators, { kind: "method", name: "getEnrichment", static: false, private: false, access: { has: function (obj) { return "getEnrichment" in obj; }, get: function (obj) { return obj.getEnrichment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPhoneVerification_decorators, { kind: "method", name: "getPhoneVerification", static: false, private: false, access: { has: function (obj) { return "getPhoneVerification" in obj; }, get: function (obj) { return obj.getPhoneVerification; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LeadsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LeadsController = _classThis;
}();
exports.LeadsController = LeadsController;
