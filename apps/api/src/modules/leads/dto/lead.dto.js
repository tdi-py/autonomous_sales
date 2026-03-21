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
exports.LeadQueryDto = exports.UpdateLeadDto = exports.CreateLeadDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateLeadDto = function () {
    var _a;
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _companyName_decorators;
    var _companyName_initializers = [];
    var _companyName_extraInitializers = [];
    var _contactName_decorators;
    var _contactName_initializers = [];
    var _contactName_extraInitializers = [];
    var _contactEmail_decorators;
    var _contactEmail_initializers = [];
    var _contactEmail_extraInitializers = [];
    var _contactPhone_decorators;
    var _contactPhone_initializers = [];
    var _contactPhone_extraInitializers = [];
    var _contactTitle_decorators;
    var _contactTitle_initializers = [];
    var _contactTitle_extraInitializers = [];
    var _website_decorators;
    var _website_initializers = [];
    var _website_extraInitializers = [];
    var _linkedinUrl_decorators;
    var _linkedinUrl_initializers = [];
    var _linkedinUrl_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _sourceDetail_decorators;
    var _sourceDetail_initializers = [];
    var _sourceDetail_extraInitializers = [];
    var _icpProfileId_decorators;
    var _icpProfileId_initializers = [];
    var _icpProfileId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateLeadDto() {
                this.projectId = __runInitializers(this, _projectId_initializers, void 0);
                this.companyName = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _companyName_initializers, void 0));
                this.contactName = (__runInitializers(this, _companyName_extraInitializers), __runInitializers(this, _contactName_initializers, void 0));
                this.contactEmail = (__runInitializers(this, _contactName_extraInitializers), __runInitializers(this, _contactEmail_initializers, void 0));
                this.contactPhone = (__runInitializers(this, _contactEmail_extraInitializers), __runInitializers(this, _contactPhone_initializers, void 0));
                this.contactTitle = (__runInitializers(this, _contactPhone_extraInitializers), __runInitializers(this, _contactTitle_initializers, void 0));
                this.website = (__runInitializers(this, _contactTitle_extraInitializers), __runInitializers(this, _website_initializers, void 0));
                this.linkedinUrl = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _linkedinUrl_initializers, void 0));
                this.source = (__runInitializers(this, _linkedinUrl_extraInitializers), __runInitializers(this, _source_initializers, void 0));
                this.sourceDetail = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _sourceDetail_initializers, void 0));
                this.icpProfileId = (__runInitializers(this, _sourceDetail_extraInitializers), __runInitializers(this, _icpProfileId_initializers, void 0));
                __runInitializers(this, _icpProfileId_extraInitializers);
            }
            return CreateLeadDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _projectId_decorators = [(0, swagger_1.ApiProperty)({ example: 'project-uuid-here' }), (0, class_validator_1.IsString)()];
            _companyName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Bloom & Co Florists' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _contactName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Sarah Johnson' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _contactEmail_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'sarah@bloomco.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _contactPhone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '+1-555-867-5309' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(50)];
            _contactTitle_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Owner' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _website_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'https://bloomco.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)()];
            _linkedinUrl_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)()];
            _source_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: ['manual', 'scraped', 'apollo', 'google_maps', 'csv_import'],
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['manual', 'scraped', 'apollo', 'google_maps', 'csv_import'])];
            _sourceDetail_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'google_maps_scraper_v1' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _icpProfileId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'icp-profile-uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _companyName_decorators, { kind: "field", name: "companyName", static: false, private: false, access: { has: function (obj) { return "companyName" in obj; }, get: function (obj) { return obj.companyName; }, set: function (obj, value) { obj.companyName = value; } }, metadata: _metadata }, _companyName_initializers, _companyName_extraInitializers);
            __esDecorate(null, null, _contactName_decorators, { kind: "field", name: "contactName", static: false, private: false, access: { has: function (obj) { return "contactName" in obj; }, get: function (obj) { return obj.contactName; }, set: function (obj, value) { obj.contactName = value; } }, metadata: _metadata }, _contactName_initializers, _contactName_extraInitializers);
            __esDecorate(null, null, _contactEmail_decorators, { kind: "field", name: "contactEmail", static: false, private: false, access: { has: function (obj) { return "contactEmail" in obj; }, get: function (obj) { return obj.contactEmail; }, set: function (obj, value) { obj.contactEmail = value; } }, metadata: _metadata }, _contactEmail_initializers, _contactEmail_extraInitializers);
            __esDecorate(null, null, _contactPhone_decorators, { kind: "field", name: "contactPhone", static: false, private: false, access: { has: function (obj) { return "contactPhone" in obj; }, get: function (obj) { return obj.contactPhone; }, set: function (obj, value) { obj.contactPhone = value; } }, metadata: _metadata }, _contactPhone_initializers, _contactPhone_extraInitializers);
            __esDecorate(null, null, _contactTitle_decorators, { kind: "field", name: "contactTitle", static: false, private: false, access: { has: function (obj) { return "contactTitle" in obj; }, get: function (obj) { return obj.contactTitle; }, set: function (obj, value) { obj.contactTitle = value; } }, metadata: _metadata }, _contactTitle_initializers, _contactTitle_extraInitializers);
            __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
            __esDecorate(null, null, _linkedinUrl_decorators, { kind: "field", name: "linkedinUrl", static: false, private: false, access: { has: function (obj) { return "linkedinUrl" in obj; }, get: function (obj) { return obj.linkedinUrl; }, set: function (obj, value) { obj.linkedinUrl = value; } }, metadata: _metadata }, _linkedinUrl_initializers, _linkedinUrl_extraInitializers);
            __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
            __esDecorate(null, null, _sourceDetail_decorators, { kind: "field", name: "sourceDetail", static: false, private: false, access: { has: function (obj) { return "sourceDetail" in obj; }, get: function (obj) { return obj.sourceDetail; }, set: function (obj, value) { obj.sourceDetail = value; } }, metadata: _metadata }, _sourceDetail_initializers, _sourceDetail_extraInitializers);
            __esDecorate(null, null, _icpProfileId_decorators, { kind: "field", name: "icpProfileId", static: false, private: false, access: { has: function (obj) { return "icpProfileId" in obj; }, get: function (obj) { return obj.icpProfileId; }, set: function (obj, value) { obj.icpProfileId = value; } }, metadata: _metadata }, _icpProfileId_initializers, _icpProfileId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateLeadDto = CreateLeadDto;
var UpdateLeadDto = function () {
    var _a;
    var _companyName_decorators;
    var _companyName_initializers = [];
    var _companyName_extraInitializers = [];
    var _contactName_decorators;
    var _contactName_initializers = [];
    var _contactName_extraInitializers = [];
    var _contactEmail_decorators;
    var _contactEmail_initializers = [];
    var _contactEmail_extraInitializers = [];
    var _contactPhone_decorators;
    var _contactPhone_initializers = [];
    var _contactPhone_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _score_decorators;
    var _score_initializers = [];
    var _score_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateLeadDto() {
                this.companyName = __runInitializers(this, _companyName_initializers, void 0);
                this.contactName = (__runInitializers(this, _companyName_extraInitializers), __runInitializers(this, _contactName_initializers, void 0));
                this.contactEmail = (__runInitializers(this, _contactName_extraInitializers), __runInitializers(this, _contactEmail_initializers, void 0));
                this.contactPhone = (__runInitializers(this, _contactEmail_extraInitializers), __runInitializers(this, _contactPhone_initializers, void 0));
                this.status = (__runInitializers(this, _contactPhone_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.score = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _score_initializers, void 0));
                __runInitializers(this, _score_extraInitializers);
            }
            return UpdateLeadDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _companyName_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _contactName_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _contactEmail_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _contactPhone_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(50)];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'],
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'])];
            _score_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 85 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _companyName_decorators, { kind: "field", name: "companyName", static: false, private: false, access: { has: function (obj) { return "companyName" in obj; }, get: function (obj) { return obj.companyName; }, set: function (obj, value) { obj.companyName = value; } }, metadata: _metadata }, _companyName_initializers, _companyName_extraInitializers);
            __esDecorate(null, null, _contactName_decorators, { kind: "field", name: "contactName", static: false, private: false, access: { has: function (obj) { return "contactName" in obj; }, get: function (obj) { return obj.contactName; }, set: function (obj, value) { obj.contactName = value; } }, metadata: _metadata }, _contactName_initializers, _contactName_extraInitializers);
            __esDecorate(null, null, _contactEmail_decorators, { kind: "field", name: "contactEmail", static: false, private: false, access: { has: function (obj) { return "contactEmail" in obj; }, get: function (obj) { return obj.contactEmail; }, set: function (obj, value) { obj.contactEmail = value; } }, metadata: _metadata }, _contactEmail_initializers, _contactEmail_extraInitializers);
            __esDecorate(null, null, _contactPhone_decorators, { kind: "field", name: "contactPhone", static: false, private: false, access: { has: function (obj) { return "contactPhone" in obj; }, get: function (obj) { return obj.contactPhone; }, set: function (obj, value) { obj.contactPhone = value; } }, metadata: _metadata }, _contactPhone_initializers, _contactPhone_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _score_decorators, { kind: "field", name: "score", static: false, private: false, access: { has: function (obj) { return "score" in obj; }, get: function (obj) { return obj.score; }, set: function (obj, value) { obj.score = value; } }, metadata: _metadata }, _score_initializers, _score_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateLeadDto = UpdateLeadDto;
var LeadQueryDto = function () {
    var _a;
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _phoneClassification_decorators;
    var _phoneClassification_initializers = [];
    var _phoneClassification_extraInitializers = [];
    var _icpProfileId_decorators;
    var _icpProfileId_initializers = [];
    var _icpProfileId_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    return _a = /** @class */ (function () {
            function LeadQueryDto() {
                this.projectId = __runInitializers(this, _projectId_initializers, void 0);
                this.status = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.phoneClassification = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _phoneClassification_initializers, void 0));
                this.icpProfileId = (__runInitializers(this, _phoneClassification_extraInitializers), __runInitializers(this, _icpProfileId_initializers, void 0));
                this.page = (__runInitializers(this, _icpProfileId_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                __runInitializers(this, _limit_extraInitializers);
            }
            return LeadQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _projectId_decorators = [(0, swagger_1.ApiProperty)({ example: 'project-uuid-here' }), (0, class_validator_1.IsString)()];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'])];
            _phoneClassification_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['can_call_ai', 'can_call_manual', 'cannot_call'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['can_call_ai', 'can_call_manual', 'cannot_call'])];
            _icpProfileId_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'icp-profile-uuid' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 1 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _limit_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 50 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(200)];
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _phoneClassification_decorators, { kind: "field", name: "phoneClassification", static: false, private: false, access: { has: function (obj) { return "phoneClassification" in obj; }, get: function (obj) { return obj.phoneClassification; }, set: function (obj, value) { obj.phoneClassification = value; } }, metadata: _metadata }, _phoneClassification_initializers, _phoneClassification_extraInitializers);
            __esDecorate(null, null, _icpProfileId_decorators, { kind: "field", name: "icpProfileId", static: false, private: false, access: { has: function (obj) { return "icpProfileId" in obj; }, get: function (obj) { return obj.icpProfileId; }, set: function (obj, value) { obj.icpProfileId = value; } }, metadata: _metadata }, _icpProfileId_initializers, _icpProfileId_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LeadQueryDto = LeadQueryDto;
