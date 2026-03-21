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
exports.CampaignsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var CampaignsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Campaigns'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('campaigns')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _getSequences_decorators;
    var _createSequenceStep_decorators;
    var _getScripts_decorators;
    var _createScript_decorators;
    var CampaignsController = _classThis = /** @class */ (function () {
        function CampaignsController_1(campaignsService) {
            this.campaignsService = (__runInitializers(this, _instanceExtraInitializers), campaignsService);
        }
        CampaignsController_1.prototype.create = function (req, dto) {
            return this.campaignsService.create(req.user.userId, dto);
        };
        CampaignsController_1.prototype.findAll = function (req, projectId) {
            return this.campaignsService.findAll(req.user.userId, projectId);
        };
        CampaignsController_1.prototype.findOne = function (id, req) {
            return this.campaignsService.findOne(id, req.user.userId);
        };
        CampaignsController_1.prototype.update = function (id, req, dto) {
            return this.campaignsService.update(id, req.user.userId, dto);
        };
        CampaignsController_1.prototype.remove = function (id, req) {
            return this.campaignsService.remove(id, req.user.userId);
        };
        CampaignsController_1.prototype.getSequences = function (id, req) {
            return this.campaignsService.getSequences(id, req.user.userId);
        };
        CampaignsController_1.prototype.createSequenceStep = function (id, req, dto) {
            return this.campaignsService.createSequenceStep(id, req.user.userId, dto);
        };
        CampaignsController_1.prototype.getScripts = function (id, req) {
            return this.campaignsService.getScripts(id, req.user.userId);
        };
        CampaignsController_1.prototype.createScript = function (id, req, dto) {
            return this.campaignsService.createScript(id, req.user.userId, dto);
        };
        return CampaignsController_1;
    }());
    __setFunctionName(_classThis, "CampaignsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create a new campaign' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'List all campaigns in a project' }), (0, swagger_1.ApiQuery)({ name: 'projectId', required: true })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get a single campaign' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update campaign' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete campaign' })];
        _getSequences_decorators = [(0, common_1.Get)(':id/sequences'), (0, swagger_1.ApiOperation)({ summary: 'Get email sequences for a campaign (ordered by step)' })];
        _createSequenceStep_decorators = [(0, common_1.Post)(':id/sequences'), (0, swagger_1.ApiOperation)({ summary: 'Add an email sequence step to a campaign' })];
        _getScripts_decorators = [(0, common_1.Get)(':id/scripts'), (0, swagger_1.ApiOperation)({ summary: 'Get call scripts for a campaign' })];
        _createScript_decorators = [(0, common_1.Post)(':id/scripts'), (0, swagger_1.ApiOperation)({ summary: 'Create a new call script version for a campaign' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSequences_decorators, { kind: "method", name: "getSequences", static: false, private: false, access: { has: function (obj) { return "getSequences" in obj; }, get: function (obj) { return obj.getSequences; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createSequenceStep_decorators, { kind: "method", name: "createSequenceStep", static: false, private: false, access: { has: function (obj) { return "createSequenceStep" in obj; }, get: function (obj) { return obj.createSequenceStep; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getScripts_decorators, { kind: "method", name: "getScripts", static: false, private: false, access: { has: function (obj) { return "getScripts" in obj; }, get: function (obj) { return obj.getScripts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createScript_decorators, { kind: "method", name: "createScript", static: false, private: false, access: { has: function (obj) { return "createScript" in obj; }, get: function (obj) { return obj.createScript; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignsController = _classThis;
}();
exports.CampaignsController = CampaignsController;
