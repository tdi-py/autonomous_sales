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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var swagger_2 = require("@nestjs/swagger");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var AnalyzeUrlDto = function () {
    var _a;
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _websiteUrl_decorators;
    var _websiteUrl_initializers = [];
    var _websiteUrl_extraInitializers = [];
    return _a = /** @class */ (function () {
            function AnalyzeUrlDto() {
                this.projectId = __runInitializers(this, _projectId_initializers, void 0);
                this.websiteUrl = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _websiteUrl_initializers, void 0));
                __runInitializers(this, _websiteUrl_extraInitializers);
            }
            return AnalyzeUrlDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _projectId_decorators = [(0, swagger_2.ApiProperty)(), (0, class_validator_1.IsString)()];
            _websiteUrl_decorators = [(0, swagger_2.ApiProperty)(), (0, class_validator_1.IsUrl)()];
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _websiteUrl_decorators, { kind: "field", name: "websiteUrl", static: false, private: false, access: { has: function (obj) { return "websiteUrl" in obj; }, get: function (obj) { return obj.websiteUrl; }, set: function (obj, value) { obj.websiteUrl = value; } }, metadata: _metadata }, _websiteUrl_initializers, _websiteUrl_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var GenerateContentDto = function () {
    var _a;
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _campaignId_decorators;
    var _campaignId_initializers = [];
    var _campaignId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateContentDto() {
                this.projectId = __runInitializers(this, _projectId_initializers, void 0);
                this.campaignId = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _campaignId_initializers, void 0));
                __runInitializers(this, _campaignId_extraInitializers);
            }
            return GenerateContentDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _projectId_decorators = [(0, swagger_2.ApiProperty)(), (0, class_validator_1.IsString)()];
            _campaignId_decorators = [(0, swagger_2.ApiProperty)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _campaignId_decorators, { kind: "field", name: "campaignId", static: false, private: false, access: { has: function (obj) { return "campaignId" in obj; }, get: function (obj) { return obj.campaignId; }, set: function (obj, value) { obj.campaignId = value; } }, metadata: _metadata }, _campaignId_initializers, _campaignId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var AgentsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Agents'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('agents')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _analyzeUrl_decorators;
    var _generateContent_decorators;
    var _getExecutions_decorators;
    var AgentsController = _classThis = /** @class */ (function () {
        function AgentsController_1(agentsService) {
            this.agentsService = (__runInitializers(this, _instanceExtraInitializers), agentsService);
        }
        AgentsController_1.prototype.analyzeUrl = function (dto) {
            return this.agentsService.triggerAnalyzeUrl(dto.projectId, dto.websiteUrl);
        };
        AgentsController_1.prototype.generateContent = function (dto) {
            return this.agentsService.triggerGenerateContent(dto.projectId, dto.campaignId);
        };
        AgentsController_1.prototype.getExecutions = function (projectId, limit) {
            return this.agentsService.getExecutions(projectId, limit);
        };
        return AgentsController_1;
    }());
    __setFunctionName(_classThis, "AgentsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _analyzeUrl_decorators = [(0, common_1.Post)('analyze-url'), (0, swagger_1.ApiOperation)({ summary: 'Queue Analyzer Agent to scrape & analyse a website' })];
        _generateContent_decorators = [(0, common_1.Post)('generate-content'), (0, swagger_1.ApiOperation)({ summary: 'Queue Communicator Agent to generate campaign content' })];
        _getExecutions_decorators = [(0, common_1.Get)('executions'), (0, swagger_1.ApiOperation)({ summary: 'List agent execution logs for a project' })];
        __esDecorate(_classThis, null, _analyzeUrl_decorators, { kind: "method", name: "analyzeUrl", static: false, private: false, access: { has: function (obj) { return "analyzeUrl" in obj; }, get: function (obj) { return obj.analyzeUrl; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateContent_decorators, { kind: "method", name: "generateContent", static: false, private: false, access: { has: function (obj) { return "generateContent" in obj; }, get: function (obj) { return obj.generateContent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getExecutions_decorators, { kind: "method", name: "getExecutions", static: false, private: false, access: { has: function (obj) { return "getExecutions" in obj; }, get: function (obj) { return obj.getExecutions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentsController = _classThis;
}();
exports.AgentsController = AgentsController;
