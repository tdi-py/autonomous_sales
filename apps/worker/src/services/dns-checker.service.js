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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsCheckerService = void 0;
var common_1 = require("@nestjs/common");
var dns = require("dns/promises");
// ─── Service ─────────────────────────────────────────────────────────────────
var DnsCheckerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DnsCheckerService = _classThis = /** @class */ (function () {
        function DnsCheckerService_1() {
            this.logger = new common_1.Logger(DnsCheckerService.name);
            // Common DKIM selectors to check
            this.DKIM_SELECTORS = [
                'google',
                'default',
                'selector1',
                'selector2',
                'mail',
                'dkim',
                'email',
                'k1',
                'smtp',
                'mimecast',
                'pm',
            ];
        }
        /**
         * Run full DNS check (SPF + DKIM + DMARC) for the given email domain.
         */
        DnsCheckerService_1.prototype.checkDomain = function (emailAddress) {
            return __awaiter(this, void 0, void 0, function () {
                var domain, _a, spfCheck, dkimCheck, dmarcCheck;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            domain = emailAddress.split('@')[1];
                            if (!domain) {
                                return [2 /*return*/, this.buildResult(domain !== null && domain !== void 0 ? domain : emailAddress, false, false, false)];
                            }
                            this.logger.log("[dns] Starting check for domain: ".concat(domain));
                            return [4 /*yield*/, Promise.all([
                                    this.checkSpf(domain),
                                    this.checkDkim(domain),
                                    this.checkDmarc(domain),
                                ])];
                        case 1:
                            _a = _b.sent(), spfCheck = _a[0], dkimCheck = _a[1], dmarcCheck = _a[2];
                            return [2 /*return*/, this.buildResult(domain, spfCheck, dkimCheck, dmarcCheck)];
                    }
                });
            });
        };
        // ─── SPF ──────────────────────────────────────────────────────────────────
        DnsCheckerService_1.prototype.checkSpf = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var records, spfRecord, hasAuthMechanism, error_1, err;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.resolveTxt(domain)];
                        case 1:
                            records = _a.sent();
                            spfRecord = records.find(function (r) { return r.includes('v=spf1'); });
                            if (!spfRecord) {
                                return [2 /*return*/, {
                                        valid: false,
                                        message: "SPF kayd\u0131 bulunamad\u0131. DNS y\u00F6neticinize \u015Fu TXT kayd\u0131n\u0131 ekleyin:\n`v=spf1 include:_spf.google.com ~all`",
                                    }];
                            }
                            hasAuthMechanism = spfRecord.includes('include:') ||
                                spfRecord.includes('ip4:') ||
                                spfRecord.includes('ip6:') ||
                                spfRecord.includes('a:') ||
                                spfRecord.includes('mx');
                            if (!hasAuthMechanism) {
                                return [2 /*return*/, {
                                        valid: false,
                                        record: spfRecord,
                                        message: 'SPF kaydı var ancak geçerli bir yetkilendirme mekanizması içermiyor. Kaydınızı gözden geçirin.',
                                    }];
                            }
                            return [2 /*return*/, {
                                    valid: true,
                                    record: spfRecord,
                                    message: 'SPF kaydı geçerli ✅',
                                }];
                        case 2:
                            error_1 = _a.sent();
                            err = error_1;
                            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                                return [2 /*return*/, {
                                        valid: false,
                                        message: "SPF kayd\u0131 bulunamad\u0131. DNS'e \u015Fu TXT kayd\u0131n\u0131 ekleyin:\n`v=spf1 include:_spf.google.com ~all`",
                                    }];
                            }
                            this.logger.warn("[dns] SPF check failed for ".concat(domain, ": ").concat(err.message));
                            return [2 /*return*/, { valid: false, message: 'SPF kontrolü yapılamadı — DNS sorgusu başarısız.' }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ─── DKIM ────────────────────────────────────────────────────────────────
        DnsCheckerService_1.prototype.checkDkim = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, selector, dkimDomain, records, dkimRecord, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _i = 0, _a = this.DKIM_SELECTORS;
                            _c.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 6];
                            selector = _a[_i];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 4, , 5]);
                            dkimDomain = "".concat(selector, "._domainkey.").concat(domain);
                            return [4 /*yield*/, this.resolveTxt(dkimDomain)];
                        case 3:
                            records = _c.sent();
                            dkimRecord = records.find(function (r) { return r.includes('v=DKIM1') || r.includes('k=rsa') || r.includes('p='); });
                            if (dkimRecord) {
                                this.logger.log("[dns] DKIM found \u2014 selector: ".concat(selector, "._domainkey.").concat(domain));
                                return [2 /*return*/, {
                                        valid: true,
                                        selector: "".concat(selector, "._domainkey"),
                                        message: "DKIM kayd\u0131 bulundu (selector: ".concat(selector, ") \u2705"),
                                    }];
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            _b = _c.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                valid: false,
                                message: 'DKIM kaydı bulunamadı. Email provider\'ınızın DKIM kurulum rehberini takip edin. ' +
                                    'Gmail için: Google Admin > Apps > Gmail > Authenticate email > Generate new record.',
                            }];
                    }
                });
            });
        };
        // ─── DMARC ───────────────────────────────────────────────────────────────
        DnsCheckerService_1.prototype.checkDmarc = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var dmarcDomain, records, dmarcRecord, policyMatch, policy, message, error_2, err;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            dmarcDomain = "_dmarc.".concat(domain);
                            return [4 /*yield*/, this.resolveTxt(dmarcDomain)];
                        case 1:
                            records = _a.sent();
                            dmarcRecord = records.find(function (r) { return r.includes('v=DMARC1'); });
                            if (!dmarcRecord) {
                                return [2 /*return*/, {
                                        valid: false,
                                        message: "DMARC kayd\u0131 bulunamad\u0131. DNS'e \u015Fu TXT kayd\u0131n\u0131 ekleyin:\n" +
                                            "Hostname: `_dmarc.".concat(domain, "`\n") +
                                            "De\u011Fer: `v=DMARC1; p=none; rua=mailto:dmarc@".concat(domain, "`"),
                                    }];
                            }
                            policyMatch = dmarcRecord.match(/p=(\w+)/);
                            policy = policyMatch ? policyMatch[1] : 'unknown';
                            message = "DMARC kayd\u0131 ge\u00E7erli (policy: ".concat(policy, ") \u2705");
                            if (policy === 'none') {
                                message += ' — "none" policy izleme modundadır. Güvenlik için "quarantine" veya "reject" öneririz.';
                            }
                            return [2 /*return*/, { valid: true, record: dmarcRecord, policy: policy, message: message }];
                        case 2:
                            error_2 = _a.sent();
                            err = error_2;
                            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
                                return [2 /*return*/, {
                                        valid: false,
                                        message: "DMARC kayd\u0131 bulunamad\u0131. DNS'e \u015Fu TXT kayd\u0131n\u0131 ekleyin:\n" +
                                            "Hostname: `_dmarc.".concat(domain, "`\n") +
                                            "De\u011Fer: `v=DMARC1; p=none; rua=mailto:dmarc@".concat(domain, "`"),
                                    }];
                            }
                            this.logger.warn("[dns] DMARC check failed for ".concat(domain, ": ").concat(err.message));
                            return [2 /*return*/, { valid: false, message: 'DMARC kontrolü yapılamadı — DNS sorgusu başarısız.' }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ─── Result Builder ──────────────────────────────────────────────────────
        DnsCheckerService_1.prototype.buildResult = function (domain, spfResult, dkimResult, dmarcResult) {
            // Handle boolean shorthand
            var spf = typeof spfResult === 'boolean'
                ? { valid: spfResult, message: spfResult ? 'SPF geçerli ✅' : 'SPF geçersiz ❌' }
                : spfResult;
            var dkim = typeof dkimResult === 'boolean'
                ? { valid: dkimResult, message: dkimResult ? 'DKIM geçerli ✅' : 'DKIM geçersiz ❌' }
                : dkimResult;
            var dmarc = typeof dmarcResult === 'boolean'
                ? { valid: dmarcResult, message: dmarcResult ? 'DMARC geçerli ✅' : 'DMARC geçersiz ❌' }
                : dmarcResult;
            // Health score calculation
            var score = 0;
            if (spf.valid)
                score += 33;
            if (dkim.valid)
                score += 33;
            if (dmarc.valid)
                score += 34;
            var overallStatus = score === 100 ? 'excellent' :
                score >= 66 ? 'good' :
                    score >= 33 ? 'warning' :
                        'critical';
            // Recommendations
            var recommendations = [];
            if (!spf.valid)
                recommendations.push("\uD83D\uDD34 SPF: ".concat(spf.message));
            if (!dkim.valid)
                recommendations.push("\uD83D\uDD34 DKIM: ".concat(dkim.message));
            if (!dmarc.valid)
                recommendations.push("\uD83D\uDFE1 DMARC: ".concat(dmarc.message));
            if (score === 100) {
                recommendations.push('🎉 Email yapılandırmanız mükemmel! Tüm DNS kayıtları geçerli.');
            }
            return {
                domain: domain,
                spfValid: spf.valid,
                spfRecord: spf.record,
                spfMessage: spf.message,
                dkimValid: dkim.valid,
                dkimSelector: dkim.selector,
                dkimMessage: dkim.message,
                dmarcValid: dmarc.valid,
                dmarcRecord: dmarc.record,
                dmarcPolicy: dmarc.policy,
                dmarcMessage: dmarc.message,
                healthScore: score,
                overallStatus: overallStatus,
                recommendations: recommendations,
            };
        };
        // ─── DNS helper ──────────────────────────────────────────────────────────
        DnsCheckerService_1.prototype.resolveTxt = function (domain) {
            return __awaiter(this, void 0, void 0, function () {
                var records;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.race([
                                dns.resolveTxt(domain),
                                new Promise(function (_, reject) {
                                    return setTimeout(function () { return reject(new Error('DNS query timeout')); }, 5000);
                                }),
                            ])];
                        case 1:
                            records = _a.sent();
                            // resolveTxt returns string[][] — flatten each record
                            return [2 /*return*/, records.map(function (chunks) { return chunks.join(''); })];
                    }
                });
            });
        };
        return DnsCheckerService_1;
    }());
    __setFunctionName(_classThis, "DnsCheckerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DnsCheckerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DnsCheckerService = _classThis;
}();
exports.DnsCheckerService = DnsCheckerService;
