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
exports.CreateCallScriptDto = exports.CreateEmailSequenceDto = exports.UpdateCampaignDto = exports.CreateCampaignDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateCampaignDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateCampaignDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.projectId = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _projectId_initializers, void 0));
                this.type = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                __runInitializers(this, _type_extraInitializers);
            }
            return CreateCampaignDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiProperty)({ example: 'Florist Cold Email — March' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _projectId_decorators = [(0, swagger_1.ApiProperty)({ example: 'project-uuid-here' }), (0, class_validator_1.IsString)()];
            _type_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'cold_email',
                    enum: ['cold_email', 'cold_call', 'linkedin', 'multi_channel'],
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['cold_email', 'cold_call', 'linkedin', 'multi_channel'])];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateCampaignDto = CreateCampaignDto;
var UpdateCampaignDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _settings_decorators;
    var _settings_initializers = [];
    var _settings_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateCampaignDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.status = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.settings = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
                __runInitializers(this, _settings_extraInitializers);
            }
            return UpdateCampaignDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: ['draft', 'active', 'paused', 'completed'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['draft', 'active', 'paused', 'completed'])];
            _settings_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateCampaignDto = UpdateCampaignDto;
var CreateEmailSequenceDto = function () {
    var _a;
    var _stepOrder_decorators;
    var _stepOrder_initializers = [];
    var _stepOrder_extraInitializers = [];
    var _subjectTemplate_decorators;
    var _subjectTemplate_initializers = [];
    var _subjectTemplate_extraInitializers = [];
    var _bodyTemplate_decorators;
    var _bodyTemplate_initializers = [];
    var _bodyTemplate_extraInitializers = [];
    var _delayDays_decorators;
    var _delayDays_initializers = [];
    var _delayDays_extraInitializers = [];
    var _variantLabel_decorators;
    var _variantLabel_initializers = [];
    var _variantLabel_extraInitializers = [];
    var _language_decorators;
    var _language_initializers = [];
    var _language_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateEmailSequenceDto() {
                this.stepOrder = __runInitializers(this, _stepOrder_initializers, void 0);
                this.subjectTemplate = (__runInitializers(this, _stepOrder_extraInitializers), __runInitializers(this, _subjectTemplate_initializers, void 0));
                this.bodyTemplate = (__runInitializers(this, _subjectTemplate_extraInitializers), __runInitializers(this, _bodyTemplate_initializers, void 0));
                this.delayDays = (__runInitializers(this, _bodyTemplate_extraInitializers), __runInitializers(this, _delayDays_initializers, void 0));
                this.variantLabel = (__runInitializers(this, _delayDays_extraInitializers), __runInitializers(this, _variantLabel_initializers, void 0));
                this.language = (__runInitializers(this, _variantLabel_extraInitializers), __runInitializers(this, _language_initializers, void 0));
                __runInitializers(this, _language_extraInitializers);
            }
            return CreateEmailSequenceDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _stepOrder_decorators = [(0, swagger_1.ApiProperty)({ example: 1 }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _subjectTemplate_decorators = [(0, swagger_1.ApiProperty)({ example: 'Quick question about {{company_name}} deliveries' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            _bodyTemplate_decorators = [(0, swagger_1.ApiProperty)({ example: 'Hi {{first_name}}, I noticed you ship locally...' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            _delayDays_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 3 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _variantLabel_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'variant_a' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _language_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'en' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _stepOrder_decorators, { kind: "field", name: "stepOrder", static: false, private: false, access: { has: function (obj) { return "stepOrder" in obj; }, get: function (obj) { return obj.stepOrder; }, set: function (obj, value) { obj.stepOrder = value; } }, metadata: _metadata }, _stepOrder_initializers, _stepOrder_extraInitializers);
            __esDecorate(null, null, _subjectTemplate_decorators, { kind: "field", name: "subjectTemplate", static: false, private: false, access: { has: function (obj) { return "subjectTemplate" in obj; }, get: function (obj) { return obj.subjectTemplate; }, set: function (obj, value) { obj.subjectTemplate = value; } }, metadata: _metadata }, _subjectTemplate_initializers, _subjectTemplate_extraInitializers);
            __esDecorate(null, null, _bodyTemplate_decorators, { kind: "field", name: "bodyTemplate", static: false, private: false, access: { has: function (obj) { return "bodyTemplate" in obj; }, get: function (obj) { return obj.bodyTemplate; }, set: function (obj, value) { obj.bodyTemplate = value; } }, metadata: _metadata }, _bodyTemplate_initializers, _bodyTemplate_extraInitializers);
            __esDecorate(null, null, _delayDays_decorators, { kind: "field", name: "delayDays", static: false, private: false, access: { has: function (obj) { return "delayDays" in obj; }, get: function (obj) { return obj.delayDays; }, set: function (obj, value) { obj.delayDays = value; } }, metadata: _metadata }, _delayDays_initializers, _delayDays_extraInitializers);
            __esDecorate(null, null, _variantLabel_decorators, { kind: "field", name: "variantLabel", static: false, private: false, access: { has: function (obj) { return "variantLabel" in obj; }, get: function (obj) { return obj.variantLabel; }, set: function (obj, value) { obj.variantLabel = value; } }, metadata: _metadata }, _variantLabel_initializers, _variantLabel_extraInitializers);
            __esDecorate(null, null, _language_decorators, { kind: "field", name: "language", static: false, private: false, access: { has: function (obj) { return "language" in obj; }, get: function (obj) { return obj.language; }, set: function (obj, value) { obj.language = value; } }, metadata: _metadata }, _language_initializers, _language_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateEmailSequenceDto = CreateEmailSequenceDto;
var CreateCallScriptDto = function () {
    var _a;
    var _openingScript_decorators;
    var _openingScript_initializers = [];
    var _openingScript_extraInitializers = [];
    var _dialogueTree_decorators;
    var _dialogueTree_initializers = [];
    var _dialogueTree_extraInitializers = [];
    var _objectionHandlers_decorators;
    var _objectionHandlers_initializers = [];
    var _objectionHandlers_extraInitializers = [];
    var _closingScript_decorators;
    var _closingScript_initializers = [];
    var _closingScript_extraInitializers = [];
    var _language_decorators;
    var _language_initializers = [];
    var _language_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateCallScriptDto() {
                this.openingScript = __runInitializers(this, _openingScript_initializers, void 0);
                this.dialogueTree = (__runInitializers(this, _openingScript_extraInitializers), __runInitializers(this, _dialogueTree_initializers, void 0));
                this.objectionHandlers = (__runInitializers(this, _dialogueTree_extraInitializers), __runInitializers(this, _objectionHandlers_initializers, void 0));
                this.closingScript = (__runInitializers(this, _objectionHandlers_extraInitializers), __runInitializers(this, _closingScript_initializers, void 0));
                this.language = (__runInitializers(this, _closingScript_extraInitializers), __runInitializers(this, _language_initializers, void 0));
                __runInitializers(this, _language_extraInitializers);
            }
            return CreateCallScriptDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _openingScript_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Hi, is this the owner of {{company_name}}?' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _dialogueTree_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)()];
            _objectionHandlers_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)()];
            _closingScript_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _language_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'en' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _openingScript_decorators, { kind: "field", name: "openingScript", static: false, private: false, access: { has: function (obj) { return "openingScript" in obj; }, get: function (obj) { return obj.openingScript; }, set: function (obj, value) { obj.openingScript = value; } }, metadata: _metadata }, _openingScript_initializers, _openingScript_extraInitializers);
            __esDecorate(null, null, _dialogueTree_decorators, { kind: "field", name: "dialogueTree", static: false, private: false, access: { has: function (obj) { return "dialogueTree" in obj; }, get: function (obj) { return obj.dialogueTree; }, set: function (obj, value) { obj.dialogueTree = value; } }, metadata: _metadata }, _dialogueTree_initializers, _dialogueTree_extraInitializers);
            __esDecorate(null, null, _objectionHandlers_decorators, { kind: "field", name: "objectionHandlers", static: false, private: false, access: { has: function (obj) { return "objectionHandlers" in obj; }, get: function (obj) { return obj.objectionHandlers; }, set: function (obj, value) { obj.objectionHandlers = value; } }, metadata: _metadata }, _objectionHandlers_initializers, _objectionHandlers_extraInitializers);
            __esDecorate(null, null, _closingScript_decorators, { kind: "field", name: "closingScript", static: false, private: false, access: { has: function (obj) { return "closingScript" in obj; }, get: function (obj) { return obj.closingScript; }, set: function (obj, value) { obj.closingScript = value; } }, metadata: _metadata }, _closingScript_initializers, _closingScript_extraInitializers);
            __esDecorate(null, null, _language_decorators, { kind: "field", name: "language", static: false, private: false, access: { has: function (obj) { return "language" in obj; }, get: function (obj) { return obj.language; }, set: function (obj, value) { obj.language = value; } }, metadata: _metadata }, _language_initializers, _language_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateCallScriptDto = CreateCallScriptDto;
