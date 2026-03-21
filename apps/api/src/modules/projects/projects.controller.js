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
exports.ProjectsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var ProjectsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Projects'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('projects')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _getAnalysis_decorators;
    var _getIcpProfiles_decorators;
    var _createIcpProfile_decorators;
    var ProjectsController = _classThis = /** @class */ (function () {
        function ProjectsController_1(projectsService) {
            this.projectsService = (__runInitializers(this, _instanceExtraInitializers), projectsService);
        }
        ProjectsController_1.prototype.create = function (req, dto) {
            return this.projectsService.create(req.user.userId, dto);
        };
        ProjectsController_1.prototype.findAll = function (req, workspaceId) {
            return this.projectsService.findAll(req.user.userId, workspaceId);
        };
        ProjectsController_1.prototype.findOne = function (id, req) {
            return this.projectsService.findOne(id, req.user.userId);
        };
        ProjectsController_1.prototype.update = function (id, req, dto) {
            return this.projectsService.update(id, req.user.userId, dto);
        };
        ProjectsController_1.prototype.remove = function (id, req) {
            return this.projectsService.remove(id, req.user.userId);
        };
        ProjectsController_1.prototype.getAnalysis = function (id, req) {
            return this.projectsService.getAnalysis(id, req.user.userId);
        };
        ProjectsController_1.prototype.getIcpProfiles = function (id, req) {
            return this.projectsService.getIcpProfiles(id, req.user.userId);
        };
        ProjectsController_1.prototype.createIcpProfile = function (id, req, dto) {
            return this.projectsService.createIcpProfile(id, req.user.userId, dto);
        };
        return ProjectsController_1;
    }());
    __setFunctionName(_classThis, "ProjectsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create a new project inside a workspace' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'List all projects in a workspace' }), (0, swagger_1.ApiQuery)({ name: 'workspaceId', required: true })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get a single project' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update a project' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete a project' })];
        _getAnalysis_decorators = [(0, common_1.Get)(':id/analysis'), (0, swagger_1.ApiOperation)({ summary: 'Get AI analysis for a project' })];
        _getIcpProfiles_decorators = [(0, common_1.Get)(':id/icp-profiles'), (0, swagger_1.ApiOperation)({ summary: 'List ICP profiles for a project' })];
        _createIcpProfile_decorators = [(0, common_1.Post)(':id/icp-profiles'), (0, swagger_1.ApiOperation)({ summary: 'Create a new ICP profile for a project' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalysis_decorators, { kind: "method", name: "getAnalysis", static: false, private: false, access: { has: function (obj) { return "getAnalysis" in obj; }, get: function (obj) { return obj.getAnalysis; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getIcpProfiles_decorators, { kind: "method", name: "getIcpProfiles", static: false, private: false, access: { has: function (obj) { return "getIcpProfiles" in obj; }, get: function (obj) { return obj.getIcpProfiles; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createIcpProfile_decorators, { kind: "method", name: "createIcpProfile", static: false, private: false, access: { has: function (obj) { return "createIcpProfile" in obj; }, get: function (obj) { return obj.createIcpProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProjectsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProjectsController = _classThis;
}();
exports.ProjectsController = ProjectsController;
