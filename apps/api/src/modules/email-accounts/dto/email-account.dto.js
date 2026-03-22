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
exports.TestConnectionDto = exports.CreateEmailAccountDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateEmailAccountDto = function () {
    var _a;
    var _projectId_decorators;
    var _projectId_initializers = [];
    var _projectId_extraInitializers = [];
    var _emailAddress_decorators;
    var _emailAddress_initializers = [];
    var _emailAddress_extraInitializers = [];
    var _provider_decorators;
    var _provider_initializers = [];
    var _provider_extraInitializers = [];
    var _smtpHost_decorators;
    var _smtpHost_initializers = [];
    var _smtpHost_extraInitializers = [];
    var _smtpPort_decorators;
    var _smtpPort_initializers = [];
    var _smtpPort_extraInitializers = [];
    var _imapHost_decorators;
    var _imapHost_initializers = [];
    var _imapHost_extraInitializers = [];
    var _imapPort_decorators;
    var _imapPort_initializers = [];
    var _imapPort_extraInitializers = [];
    var _username_decorators;
    var _username_initializers = [];
    var _username_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    var _senderName_decorators;
    var _senderName_initializers = [];
    var _senderName_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateEmailAccountDto() {
                this.projectId = __runInitializers(this, _projectId_initializers, void 0);
                this.emailAddress = (__runInitializers(this, _projectId_extraInitializers), __runInitializers(this, _emailAddress_initializers, void 0));
                this.provider = (__runInitializers(this, _emailAddress_extraInitializers), __runInitializers(this, _provider_initializers, void 0));
                this.smtpHost = (__runInitializers(this, _provider_extraInitializers), __runInitializers(this, _smtpHost_initializers, void 0));
                this.smtpPort = (__runInitializers(this, _smtpHost_extraInitializers), __runInitializers(this, _smtpPort_initializers, void 0));
                this.imapHost = (__runInitializers(this, _smtpPort_extraInitializers), __runInitializers(this, _imapHost_initializers, void 0));
                this.imapPort = (__runInitializers(this, _imapHost_extraInitializers), __runInitializers(this, _imapPort_initializers, void 0));
                this.username = (__runInitializers(this, _imapPort_extraInitializers), __runInitializers(this, _username_initializers, void 0));
                this.password = (__runInitializers(this, _username_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                this.senderName = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _senderName_initializers, void 0));
                __runInitializers(this, _senderName_extraInitializers);
            }
            return CreateEmailAccountDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _projectId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Project UUID' }), (0, class_validator_1.IsUUID)()];
            _emailAddress_decorators = [(0, swagger_1.ApiProperty)({ example: 'sales@company.com' }), (0, class_validator_1.IsEmail)()];
            _provider_decorators = [(0, swagger_1.ApiProperty)({ enum: ['gmail', 'outlook', 'custom_smtp'] }), (0, class_validator_1.IsEnum)(['gmail', 'outlook', 'custom_smtp'])];
            _smtpHost_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'smtp.gmail.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _smtpPort_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 587 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(65535)];
            _imapHost_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'imap.gmail.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _imapPort_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 993 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(65535)];
            _username_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'sales@company.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _password_decorators = [(0, swagger_1.ApiProperty)({ example: 'app-specific-password', description: 'Gmail App Password or SMTP password' }), (0, class_validator_1.IsString)()];
            _senderName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Sales Team' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _projectId_decorators, { kind: "field", name: "projectId", static: false, private: false, access: { has: function (obj) { return "projectId" in obj; }, get: function (obj) { return obj.projectId; }, set: function (obj, value) { obj.projectId = value; } }, metadata: _metadata }, _projectId_initializers, _projectId_extraInitializers);
            __esDecorate(null, null, _emailAddress_decorators, { kind: "field", name: "emailAddress", static: false, private: false, access: { has: function (obj) { return "emailAddress" in obj; }, get: function (obj) { return obj.emailAddress; }, set: function (obj, value) { obj.emailAddress = value; } }, metadata: _metadata }, _emailAddress_initializers, _emailAddress_extraInitializers);
            __esDecorate(null, null, _provider_decorators, { kind: "field", name: "provider", static: false, private: false, access: { has: function (obj) { return "provider" in obj; }, get: function (obj) { return obj.provider; }, set: function (obj, value) { obj.provider = value; } }, metadata: _metadata }, _provider_initializers, _provider_extraInitializers);
            __esDecorate(null, null, _smtpHost_decorators, { kind: "field", name: "smtpHost", static: false, private: false, access: { has: function (obj) { return "smtpHost" in obj; }, get: function (obj) { return obj.smtpHost; }, set: function (obj, value) { obj.smtpHost = value; } }, metadata: _metadata }, _smtpHost_initializers, _smtpHost_extraInitializers);
            __esDecorate(null, null, _smtpPort_decorators, { kind: "field", name: "smtpPort", static: false, private: false, access: { has: function (obj) { return "smtpPort" in obj; }, get: function (obj) { return obj.smtpPort; }, set: function (obj, value) { obj.smtpPort = value; } }, metadata: _metadata }, _smtpPort_initializers, _smtpPort_extraInitializers);
            __esDecorate(null, null, _imapHost_decorators, { kind: "field", name: "imapHost", static: false, private: false, access: { has: function (obj) { return "imapHost" in obj; }, get: function (obj) { return obj.imapHost; }, set: function (obj, value) { obj.imapHost = value; } }, metadata: _metadata }, _imapHost_initializers, _imapHost_extraInitializers);
            __esDecorate(null, null, _imapPort_decorators, { kind: "field", name: "imapPort", static: false, private: false, access: { has: function (obj) { return "imapPort" in obj; }, get: function (obj) { return obj.imapPort; }, set: function (obj, value) { obj.imapPort = value; } }, metadata: _metadata }, _imapPort_initializers, _imapPort_extraInitializers);
            __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: function (obj) { return "username" in obj; }, get: function (obj) { return obj.username; }, set: function (obj, value) { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _senderName_decorators, { kind: "field", name: "senderName", static: false, private: false, access: { has: function (obj) { return "senderName" in obj; }, get: function (obj) { return obj.senderName; }, set: function (obj, value) { obj.senderName = value; } }, metadata: _metadata }, _senderName_initializers, _senderName_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateEmailAccountDto = CreateEmailAccountDto;
var TestConnectionDto = function () {
    var _a;
    var _smtpHost_decorators;
    var _smtpHost_initializers = [];
    var _smtpHost_extraInitializers = [];
    var _smtpPort_decorators;
    var _smtpPort_initializers = [];
    var _smtpPort_extraInitializers = [];
    var _imapHost_decorators;
    var _imapHost_initializers = [];
    var _imapHost_extraInitializers = [];
    var _imapPort_decorators;
    var _imapPort_initializers = [];
    var _imapPort_extraInitializers = [];
    var _username_decorators;
    var _username_initializers = [];
    var _username_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TestConnectionDto() {
                this.smtpHost = __runInitializers(this, _smtpHost_initializers, void 0);
                this.smtpPort = (__runInitializers(this, _smtpHost_extraInitializers), __runInitializers(this, _smtpPort_initializers, void 0));
                this.imapHost = (__runInitializers(this, _smtpPort_extraInitializers), __runInitializers(this, _imapHost_initializers, void 0));
                this.imapPort = (__runInitializers(this, _imapHost_extraInitializers), __runInitializers(this, _imapPort_initializers, void 0));
                this.username = (__runInitializers(this, _imapPort_extraInitializers), __runInitializers(this, _username_initializers, void 0));
                this.password = (__runInitializers(this, _username_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                __runInitializers(this, _password_extraInitializers);
            }
            return TestConnectionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _smtpHost_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'smtp.gmail.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _smtpPort_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 587 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)()];
            _imapHost_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'imap.gmail.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _imapPort_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 993 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)()];
            _username_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _password_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _smtpHost_decorators, { kind: "field", name: "smtpHost", static: false, private: false, access: { has: function (obj) { return "smtpHost" in obj; }, get: function (obj) { return obj.smtpHost; }, set: function (obj, value) { obj.smtpHost = value; } }, metadata: _metadata }, _smtpHost_initializers, _smtpHost_extraInitializers);
            __esDecorate(null, null, _smtpPort_decorators, { kind: "field", name: "smtpPort", static: false, private: false, access: { has: function (obj) { return "smtpPort" in obj; }, get: function (obj) { return obj.smtpPort; }, set: function (obj, value) { obj.smtpPort = value; } }, metadata: _metadata }, _smtpPort_initializers, _smtpPort_extraInitializers);
            __esDecorate(null, null, _imapHost_decorators, { kind: "field", name: "imapHost", static: false, private: false, access: { has: function (obj) { return "imapHost" in obj; }, get: function (obj) { return obj.imapHost; }, set: function (obj, value) { obj.imapHost = value; } }, metadata: _metadata }, _imapHost_initializers, _imapHost_extraInitializers);
            __esDecorate(null, null, _imapPort_decorators, { kind: "field", name: "imapPort", static: false, private: false, access: { has: function (obj) { return "imapPort" in obj; }, get: function (obj) { return obj.imapPort; }, set: function (obj, value) { obj.imapPort = value; } }, metadata: _metadata }, _imapPort_initializers, _imapPort_extraInitializers);
            __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: function (obj) { return "username" in obj; }, get: function (obj) { return obj.username; }, set: function (obj, value) { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.TestConnectionDto = TestConnectionDto;
