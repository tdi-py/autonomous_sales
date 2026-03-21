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
exports.InviteMemberDto = exports.UpdateWorkspaceDto = exports.CreateWorkspaceDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateWorkspaceDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _billingEmail_decorators;
    var _billingEmail_initializers = [];
    var _billingEmail_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateWorkspaceDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.billingEmail = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _billingEmail_initializers, void 0));
                __runInitializers(this, _billingEmail_extraInitializers);
            }
            return CreateWorkspaceDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiProperty)({ example: 'My Agency' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _billingEmail_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'billing@myagency.com' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _billingEmail_decorators, { kind: "field", name: "billingEmail", static: false, private: false, access: { has: function (obj) { return "billingEmail" in obj; }, get: function (obj) { return obj.billingEmail; }, set: function (obj, value) { obj.billingEmail = value; } }, metadata: _metadata }, _billingEmail_initializers, _billingEmail_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateWorkspaceDto = CreateWorkspaceDto;
var UpdateWorkspaceDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _billingEmail_decorators;
    var _billingEmail_initializers = [];
    var _billingEmail_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateWorkspaceDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.billingEmail = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _billingEmail_initializers, void 0));
                __runInitializers(this, _billingEmail_extraInitializers);
            }
            return UpdateWorkspaceDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'My Agency (Updated)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _billingEmail_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _billingEmail_decorators, { kind: "field", name: "billingEmail", static: false, private: false, access: { has: function (obj) { return "billingEmail" in obj; }, get: function (obj) { return obj.billingEmail; }, set: function (obj, value) { obj.billingEmail = value; } }, metadata: _metadata }, _billingEmail_initializers, _billingEmail_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateWorkspaceDto = UpdateWorkspaceDto;
var InviteMemberDto = function () {
    var _a;
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _role_decorators;
    var _role_initializers = [];
    var _role_extraInitializers = [];
    return _a = /** @class */ (function () {
            function InviteMemberDto() {
                this.email = __runInitializers(this, _email_initializers, void 0);
                this.role = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _role_initializers, void 0));
                __runInitializers(this, _role_extraInitializers);
            }
            return InviteMemberDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [(0, swagger_1.ApiProperty)({ example: 'teammate@example.com' }), (0, class_validator_1.IsEmail)()];
            _role_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'member', enum: ['admin', 'member', 'viewer'] }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: function (obj) { return "role" in obj; }, get: function (obj) { return obj.role; }, set: function (obj, value) { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.InviteMemberDto = InviteMemberDto;
