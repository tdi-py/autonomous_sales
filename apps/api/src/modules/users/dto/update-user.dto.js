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
exports.UpdateUserDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var UpdateUserDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _companyName_decorators;
    var _companyName_initializers = [];
    var _companyName_extraInitializers = [];
    var _locale_decorators;
    var _locale_initializers = [];
    var _locale_extraInitializers = [];
    var _timezone_decorators;
    var _timezone_initializers = [];
    var _timezone_extraInitializers = [];
    var _onboardingComplete_decorators;
    var _onboardingComplete_initializers = [];
    var _onboardingComplete_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateUserDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.companyName = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _companyName_initializers, void 0));
                this.locale = (__runInitializers(this, _companyName_extraInitializers), __runInitializers(this, _locale_initializers, void 0));
                this.timezone = (__runInitializers(this, _locale_extraInitializers), __runInitializers(this, _timezone_initializers, void 0));
                this.onboardingComplete = (__runInitializers(this, _timezone_extraInitializers), __runInitializers(this, _onboardingComplete_initializers, void 0));
                __runInitializers(this, _onboardingComplete_extraInitializers);
            }
            return UpdateUserDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'Mustafa Yılmaz' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _companyName_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'ShopFast Inc.' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _locale_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'tr' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(10)];
            _timezone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'America/New_York' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(50)];
            _onboardingComplete_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: true }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _companyName_decorators, { kind: "field", name: "companyName", static: false, private: false, access: { has: function (obj) { return "companyName" in obj; }, get: function (obj) { return obj.companyName; }, set: function (obj, value) { obj.companyName = value; } }, metadata: _metadata }, _companyName_initializers, _companyName_extraInitializers);
            __esDecorate(null, null, _locale_decorators, { kind: "field", name: "locale", static: false, private: false, access: { has: function (obj) { return "locale" in obj; }, get: function (obj) { return obj.locale; }, set: function (obj, value) { obj.locale = value; } }, metadata: _metadata }, _locale_initializers, _locale_extraInitializers);
            __esDecorate(null, null, _timezone_decorators, { kind: "field", name: "timezone", static: false, private: false, access: { has: function (obj) { return "timezone" in obj; }, get: function (obj) { return obj.timezone; }, set: function (obj, value) { obj.timezone = value; } }, metadata: _metadata }, _timezone_initializers, _timezone_extraInitializers);
            __esDecorate(null, null, _onboardingComplete_decorators, { kind: "field", name: "onboardingComplete", static: false, private: false, access: { has: function (obj) { return "onboardingComplete" in obj; }, get: function (obj) { return obj.onboardingComplete; }, set: function (obj, value) { obj.onboardingComplete = value; } }, metadata: _metadata }, _onboardingComplete_initializers, _onboardingComplete_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateUserDto = UpdateUserDto;
