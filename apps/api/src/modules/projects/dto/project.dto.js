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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmAnalysisDto = exports.UpdateIcpProfileDto = exports.CreateIcpProfileDto = exports.UpdateProjectDto = exports.CreateProjectDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateProjectDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _workspaceId_decorators;
    var _workspaceId_initializers = [];
    var _workspaceId_extraInitializers = [];
    var _websiteUrl_decorators;
    var _websiteUrl_initializers = [];
    var _websiteUrl_extraInitializers = [];
    var _industry_decorators;
    var _industry_initializers = [];
    var _industry_extraInitializers = [];
    var _businessType_decorators;
    var _businessType_initializers = [];
    var _businessType_extraInitializers = [];
    var _targetGeography_decorators;
    var _targetGeography_initializers = [];
    var _targetGeography_extraInitializers = [];
    var _defaultLanguage_decorators;
    var _defaultLanguage_initializers = [];
    var _defaultLanguage_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateProjectDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.workspaceId = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _workspaceId_initializers, void 0));
                this.websiteUrl = (__runInitializers(this, _workspaceId_extraInitializers), __runInitializers(this, _websiteUrl_initializers, void 0));
                this.industry = (__runInitializers(this, _websiteUrl_extraInitializers), __runInitializers(this, _industry_initializers, void 0));
                this.businessType = (__runInitializers(this, _industry_extraInitializers), __runInitializers(this, _businessType_initializers, void 0));
                this.targetGeography = (__runInitializers(this, _businessType_extraInitializers), __runInitializers(this, _targetGeography_initializers, void 0));
                this.defaultLanguage = (__runInitializers(this, _targetGeography_extraInitializers), __runInitializers(this, _defaultLanguage_initializers, void 0));
                __runInitializers(this, _defaultLanguage_extraInitializers);
            }
            return CreateProjectDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiProperty)({ example: 'ShopFast US Campaign' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _workspaceId_decorators = [(0, swagger_1.ApiProperty)({ example: 'workspace-uuid-here' }), (0, class_validator_1.IsString)()];
            _websiteUrl_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'https://shopfastapp.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)()];
            _industry_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _businessType_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'])];
            _targetGeography_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _defaultLanguage_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'en' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(10)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _workspaceId_decorators, { kind: "field", name: "workspaceId", static: false, private: false, access: { has: function (obj) { return "workspaceId" in obj; }, get: function (obj) { return obj.workspaceId; }, set: function (obj, value) { obj.workspaceId = value; } }, metadata: _metadata }, _workspaceId_initializers, _workspaceId_extraInitializers);
            __esDecorate(null, null, _websiteUrl_decorators, { kind: "field", name: "websiteUrl", static: false, private: false, access: { has: function (obj) { return "websiteUrl" in obj; }, get: function (obj) { return obj.websiteUrl; }, set: function (obj, value) { obj.websiteUrl = value; } }, metadata: _metadata }, _websiteUrl_initializers, _websiteUrl_extraInitializers);
            __esDecorate(null, null, _industry_decorators, { kind: "field", name: "industry", static: false, private: false, access: { has: function (obj) { return "industry" in obj; }, get: function (obj) { return obj.industry; }, set: function (obj, value) { obj.industry = value; } }, metadata: _metadata }, _industry_initializers, _industry_extraInitializers);
            __esDecorate(null, null, _businessType_decorators, { kind: "field", name: "businessType", static: false, private: false, access: { has: function (obj) { return "businessType" in obj; }, get: function (obj) { return obj.businessType; }, set: function (obj, value) { obj.businessType = value; } }, metadata: _metadata }, _businessType_initializers, _businessType_extraInitializers);
            __esDecorate(null, null, _targetGeography_decorators, { kind: "field", name: "targetGeography", static: false, private: false, access: { has: function (obj) { return "targetGeography" in obj; }, get: function (obj) { return obj.targetGeography; }, set: function (obj, value) { obj.targetGeography = value; } }, metadata: _metadata }, _targetGeography_initializers, _targetGeography_extraInitializers);
            __esDecorate(null, null, _defaultLanguage_decorators, { kind: "field", name: "defaultLanguage", static: false, private: false, access: { has: function (obj) { return "defaultLanguage" in obj; }, get: function (obj) { return obj.defaultLanguage; }, set: function (obj, value) { obj.defaultLanguage = value; } }, metadata: _metadata }, _defaultLanguage_initializers, _defaultLanguage_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateProjectDto = CreateProjectDto;
var UpdateProjectDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _websiteUrl_decorators;
    var _websiteUrl_initializers = [];
    var _websiteUrl_extraInitializers = [];
    var _industry_decorators;
    var _industry_initializers = [];
    var _industry_extraInitializers = [];
    var _businessType_decorators;
    var _businessType_initializers = [];
    var _businessType_extraInitializers = [];
    var _targetGeography_decorators;
    var _targetGeography_initializers = [];
    var _targetGeography_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _defaultLanguage_decorators;
    var _defaultLanguage_initializers = [];
    var _defaultLanguage_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateProjectDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.websiteUrl = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _websiteUrl_initializers, void 0));
                this.industry = (__runInitializers(this, _websiteUrl_extraInitializers), __runInitializers(this, _industry_initializers, void 0));
                this.businessType = (__runInitializers(this, _industry_extraInitializers), __runInitializers(this, _businessType_initializers, void 0));
                this.targetGeography = (__runInitializers(this, _businessType_extraInitializers), __runInitializers(this, _targetGeography_initializers, void 0));
                this.status = (__runInitializers(this, _targetGeography_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.defaultLanguage = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _defaultLanguage_initializers, void 0));
                __runInitializers(this, _defaultLanguage_extraInitializers);
            }
            return UpdateProjectDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _websiteUrl_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)()];
            _industry_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _businessType_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['saas', 'ecommerce', 'agency', 'service', 'marketplace', 'other'])];
            _targetGeography_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['onboarding', 'active', 'paused', 'archived'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['onboarding', 'active', 'paused', 'archived'])];
            _defaultLanguage_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(10)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _websiteUrl_decorators, { kind: "field", name: "websiteUrl", static: false, private: false, access: { has: function (obj) { return "websiteUrl" in obj; }, get: function (obj) { return obj.websiteUrl; }, set: function (obj, value) { obj.websiteUrl = value; } }, metadata: _metadata }, _websiteUrl_initializers, _websiteUrl_extraInitializers);
            __esDecorate(null, null, _industry_decorators, { kind: "field", name: "industry", static: false, private: false, access: { has: function (obj) { return "industry" in obj; }, get: function (obj) { return obj.industry; }, set: function (obj, value) { obj.industry = value; } }, metadata: _metadata }, _industry_initializers, _industry_extraInitializers);
            __esDecorate(null, null, _businessType_decorators, { kind: "field", name: "businessType", static: false, private: false, access: { has: function (obj) { return "businessType" in obj; }, get: function (obj) { return obj.businessType; }, set: function (obj, value) { obj.businessType = value; } }, metadata: _metadata }, _businessType_initializers, _businessType_extraInitializers);
            __esDecorate(null, null, _targetGeography_decorators, { kind: "field", name: "targetGeography", static: false, private: false, access: { has: function (obj) { return "targetGeography" in obj; }, get: function (obj) { return obj.targetGeography; }, set: function (obj, value) { obj.targetGeography = value; } }, metadata: _metadata }, _targetGeography_initializers, _targetGeography_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _defaultLanguage_decorators, { kind: "field", name: "defaultLanguage", static: false, private: false, access: { has: function (obj) { return "defaultLanguage" in obj; }, get: function (obj) { return obj.defaultLanguage; }, set: function (obj, value) { obj.defaultLanguage = value; } }, metadata: _metadata }, _defaultLanguage_initializers, _defaultLanguage_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateProjectDto = UpdateProjectDto;
var CreateIcpProfileDto = function () {
    var _a;
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    var _industry_decorators;
    var _industry_initializers = [];
    var _industry_extraInitializers = [];
    var _companySize_decorators;
    var _companySize_initializers = [];
    var _companySize_extraInitializers = [];
    var _jobTitles_decorators;
    var _jobTitles_initializers = [];
    var _jobTitles_extraInitializers = [];
    var _painPoints_decorators;
    var _painPoints_initializers = [];
    var _painPoints_extraInitializers = [];
    var _geography_decorators;
    var _geography_initializers = [];
    var _geography_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateIcpProfileDto() {
                this.label = __runInitializers(this, _label_initializers, void 0);
                this.industry = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _industry_initializers, void 0));
                this.companySize = (__runInitializers(this, _industry_extraInitializers), __runInitializers(this, _companySize_initializers, void 0));
                this.jobTitles = (__runInitializers(this, _companySize_extraInitializers), __runInitializers(this, _jobTitles_initializers, void 0));
                this.painPoints = (__runInitializers(this, _jobTitles_extraInitializers), __runInitializers(this, _painPoints_initializers, void 0));
                this.geography = (__runInitializers(this, _painPoints_extraInitializers), __runInitializers(this, _geography_initializers, void 0));
                __runInitializers(this, _geography_extraInitializers);
            }
            return CreateIcpProfileDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _label_decorators = [(0, swagger_1.ApiProperty)({ example: 'Mid-market SaaS CTOs' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _industry_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _companySize_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '50-200' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _jobTitles_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _painPoints_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _geography_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'US' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _industry_decorators, { kind: "field", name: "industry", static: false, private: false, access: { has: function (obj) { return "industry" in obj; }, get: function (obj) { return obj.industry; }, set: function (obj, value) { obj.industry = value; } }, metadata: _metadata }, _industry_initializers, _industry_extraInitializers);
            __esDecorate(null, null, _companySize_decorators, { kind: "field", name: "companySize", static: false, private: false, access: { has: function (obj) { return "companySize" in obj; }, get: function (obj) { return obj.companySize; }, set: function (obj, value) { obj.companySize = value; } }, metadata: _metadata }, _companySize_initializers, _companySize_extraInitializers);
            __esDecorate(null, null, _jobTitles_decorators, { kind: "field", name: "jobTitles", static: false, private: false, access: { has: function (obj) { return "jobTitles" in obj; }, get: function (obj) { return obj.jobTitles; }, set: function (obj, value) { obj.jobTitles = value; } }, metadata: _metadata }, _jobTitles_initializers, _jobTitles_extraInitializers);
            __esDecorate(null, null, _painPoints_decorators, { kind: "field", name: "painPoints", static: false, private: false, access: { has: function (obj) { return "painPoints" in obj; }, get: function (obj) { return obj.painPoints; }, set: function (obj, value) { obj.painPoints = value; } }, metadata: _metadata }, _painPoints_initializers, _painPoints_extraInitializers);
            __esDecorate(null, null, _geography_decorators, { kind: "field", name: "geography", static: false, private: false, access: { has: function (obj) { return "geography" in obj; }, get: function (obj) { return obj.geography; }, set: function (obj, value) { obj.geography = value; } }, metadata: _metadata }, _geography_initializers, _geography_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateIcpProfileDto = CreateIcpProfileDto;
var UpdateIcpProfileDto = function () {
    var _a;
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    var _industry_decorators;
    var _industry_initializers = [];
    var _industry_extraInitializers = [];
    var _companySize_decorators;
    var _companySize_initializers = [];
    var _companySize_extraInitializers = [];
    var _jobTitles_decorators;
    var _jobTitles_initializers = [];
    var _jobTitles_extraInitializers = [];
    var _painPoints_decorators;
    var _painPoints_initializers = [];
    var _painPoints_extraInitializers = [];
    var _geography_decorators;
    var _geography_initializers = [];
    var _geography_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateIcpProfileDto() {
                this.label = __runInitializers(this, _label_initializers, void 0);
                this.industry = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _industry_initializers, void 0));
                this.companySize = (__runInitializers(this, _industry_extraInitializers), __runInitializers(this, _companySize_initializers, void 0));
                this.jobTitles = (__runInitializers(this, _companySize_extraInitializers), __runInitializers(this, _jobTitles_initializers, void 0));
                this.painPoints = (__runInitializers(this, _jobTitles_extraInitializers), __runInitializers(this, _painPoints_initializers, void 0));
                this.geography = (__runInitializers(this, _painPoints_extraInitializers), __runInitializers(this, _geography_initializers, void 0));
                __runInitializers(this, _geography_extraInitializers);
            }
            return UpdateIcpProfileDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _label_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _industry_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _companySize_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _jobTitles_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _painPoints_decorators = [(0, swagger_1.ApiPropertyOptional)({ type: [String] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)()];
            _geography_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _industry_decorators, { kind: "field", name: "industry", static: false, private: false, access: { has: function (obj) { return "industry" in obj; }, get: function (obj) { return obj.industry; }, set: function (obj, value) { obj.industry = value; } }, metadata: _metadata }, _industry_initializers, _industry_extraInitializers);
            __esDecorate(null, null, _companySize_decorators, { kind: "field", name: "companySize", static: false, private: false, access: { has: function (obj) { return "companySize" in obj; }, get: function (obj) { return obj.companySize; }, set: function (obj, value) { obj.companySize = value; } }, metadata: _metadata }, _companySize_initializers, _companySize_extraInitializers);
            __esDecorate(null, null, _jobTitles_decorators, { kind: "field", name: "jobTitles", static: false, private: false, access: { has: function (obj) { return "jobTitles" in obj; }, get: function (obj) { return obj.jobTitles; }, set: function (obj, value) { obj.jobTitles = value; } }, metadata: _metadata }, _jobTitles_initializers, _jobTitles_extraInitializers);
            __esDecorate(null, null, _painPoints_decorators, { kind: "field", name: "painPoints", static: false, private: false, access: { has: function (obj) { return "painPoints" in obj; }, get: function (obj) { return obj.painPoints; }, set: function (obj, value) { obj.painPoints = value; } }, metadata: _metadata }, _painPoints_initializers, _painPoints_extraInitializers);
            __esDecorate(null, null, _geography_decorators, { kind: "field", name: "geography", static: false, private: false, access: { has: function (obj) { return "geography" in obj; }, get: function (obj) { return obj.geography; }, set: function (obj, value) { obj.geography = value; } }, metadata: _metadata }, _geography_initializers, _geography_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateIcpProfileDto = UpdateIcpProfileDto;
var ConfirmAnalysisDto = function () {
    var _a;
    var _edits_decorators;
    var _edits_initializers = [];
    var _edits_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ConfirmAnalysisDto() {
                this.edits = __runInitializers(this, _edits_initializers, void 0);
                __runInitializers(this, _edits_extraInitializers);
            }
            return ConfirmAnalysisDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _edits_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'User edits to analysis fields' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _edits_decorators, { kind: "field", name: "edits", static: false, private: false, access: { has: function (obj) { return "edits" in obj; }, get: function (obj) { return obj.edits; }, set: function (obj, value) { obj.edits = value; } }, metadata: _metadata }, _edits_initializers, _edits_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ConfirmAnalysisDto = ConfirmAnalysisDto;
