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
exports.ScraperService = void 0;
var common_1 = require("@nestjs/common");
var playwright_1 = require("playwright");
var REAL_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
var BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '10.',
    '192.168.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
];
var ScraperService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ScraperService = _classThis = /** @class */ (function () {
        function ScraperService_1() {
            this.logger = new common_1.Logger(ScraperService.name);
        }
        ScraperService_1.prototype.validateUrl = function (url) {
            var parsed;
            try {
                parsed = new URL(url);
            }
            catch (_a) {
                throw new Error("Invalid URL: ".concat(url));
            }
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Only http/https URLs are allowed');
            }
            var hostname = parsed.hostname.toLowerCase();
            for (var _i = 0, BLOCKED_HOSTS_1 = BLOCKED_HOSTS; _i < BLOCKED_HOSTS_1.length; _i++) {
                var blocked = BLOCKED_HOSTS_1[_i];
                if (hostname === blocked || hostname.startsWith(blocked)) {
                    throw new Error("Blocked hostname: ".concat(hostname));
                }
            }
        };
        ScraperService_1.prototype.scrape = function (url) {
            return __awaiter(this, void 0, void 0, function () {
                var browser, context, mainData, bodyWordCount, baseUrl, _i, _a, path, extra, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this.validateUrl(url);
                            browser = null;
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, , 12, 15]);
                            return [4 /*yield*/, playwright_1.chromium.launch({ headless: true })];
                        case 2:
                            browser = _c.sent();
                            return [4 /*yield*/, browser.newContext({
                                    userAgent: REAL_USER_AGENT,
                                    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
                                })];
                        case 3:
                            context = _c.sent();
                            return [4 /*yield*/, this.scrapePage(context, url)];
                        case 4:
                            mainData = _c.sent();
                            bodyWordCount = mainData.bodyText.split(/\s+/).length;
                            if (!(bodyWordCount < 100)) return [3 /*break*/, 10];
                            baseUrl = new URL(url).origin;
                            _i = 0, _a = ['/about', '/features', '/pricing'];
                            _c.label = 5;
                        case 5:
                            if (!(_i < _a.length)) return [3 /*break*/, 10];
                            path = _a[_i];
                            _c.label = 6;
                        case 6:
                            _c.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.scrapePage(context, "".concat(baseUrl).concat(path))];
                        case 7:
                            extra = _c.sent();
                            if (extra.bodyText.length > 100) {
                                mainData.bodyText = "".concat(mainData.bodyText, "\n\n[From ").concat(path, "]: ").concat(extra.bodyText).slice(0, 5000);
                                return [3 /*break*/, 10];
                            }
                            return [3 /*break*/, 9];
                        case 8:
                            _b = _c.sent();
                            return [3 /*break*/, 9];
                        case 9:
                            _i++;
                            return [3 /*break*/, 5];
                        case 10: return [4 /*yield*/, context.close()];
                        case 11:
                            _c.sent();
                            return [2 /*return*/, mainData];
                        case 12:
                            if (!browser) return [3 /*break*/, 14];
                            return [4 /*yield*/, browser.close()];
                        case 13:
                            _c.sent();
                            _c.label = 14;
                        case 14: return [7 /*endfinally*/];
                        case 15: return [2 /*return*/];
                    }
                });
            });
        };
        ScraperService_1.prototype.scrapePage = function (context, url) {
            return __awaiter(this, void 0, void 0, function () {
                var page, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, context.newPage()];
                        case 1:
                            page = _a.sent();
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, , 5, 7]);
                            return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, page.evaluate(function () {
                                    var _a, _b, _c;
                                    var getText = function (el) { var _a, _b; return (_b = (_a = el === null || el === void 0 ? void 0 : el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; };
                                    var getAttr = function (sel, attr) { var _a, _b; return (_b = (_a = document.querySelector(sel)) === null || _a === void 0 ? void 0 : _a.getAttribute(attr)) !== null && _b !== void 0 ? _b : ''; };
                                    // Headings
                                    var h1 = Array.from(document.querySelectorAll('h1')).map(function (e) { var _a, _b; return (_b = (_a = e.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; });
                                    var h2 = Array.from(document.querySelectorAll('h2'))
                                        .slice(0, 10)
                                        .map(function (e) { var _a, _b; return (_b = (_a = e.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; });
                                    var h3 = Array.from(document.querySelectorAll('h3'))
                                        .slice(0, 10)
                                        .map(function (e) { var _a, _b; return (_b = (_a = e.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; });
                                    // Nav links text
                                    var navLinks = Array.from(document.querySelectorAll('nav a'))
                                        .map(function (a) { var _a, _b; return (_b = (_a = a.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; })
                                        .filter(Boolean)
                                        .slice(0, 20);
                                    // Footer
                                    var footer = document.querySelector('footer');
                                    var footerInfo = footer ? ((_b = (_a = footer.textContent) === null || _a === void 0 ? void 0 : _a.trim().slice(0, 500)) !== null && _b !== void 0 ? _b : '') : '';
                                    // Testimonials
                                    var testimonialSections = document.querySelectorAll('[class*="testimonial"], [class*="review"], [class*="quote"], [id*="testimonial"]');
                                    var testimonials = Array.from(testimonialSections)
                                        .map(function (el) { var _a, _b; return (_b = (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; })
                                        .join(' ')
                                        .slice(0, 1000);
                                    // Pricing
                                    var pricingSections = document.querySelectorAll('[class*="pricing"], [class*="plan"], [id*="pricing"]');
                                    var pricing = Array.from(pricingSections)
                                        .map(function (el) { var _a, _b; return (_b = (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''; })
                                        .join(' ')
                                        .slice(0, 500);
                                    // Body text – remove scripts/styles first
                                    var body = document.body.cloneNode(true);
                                    body.querySelectorAll('script, style, nav, footer, header').forEach(function (el) { return el.remove(); });
                                    var bodyText = ((_c = body.textContent) !== null && _c !== void 0 ? _c : '').replace(/\s+/g, ' ').trim().slice(0, 5000);
                                    return {
                                        title: document.title,
                                        metaDescription: getAttr('meta[name="description"]', 'content'),
                                        headings: { h1: h1, h2: h2, h3: h3 },
                                        bodyText: bodyText,
                                        navLinks: navLinks,
                                        footerInfo: footerInfo,
                                        testimonials: testimonials,
                                        pricing: pricing,
                                        openGraph: {
                                            title: getAttr('meta[property="og:title"]', 'content'),
                                            description: getAttr('meta[property="og:description"]', 'content'),
                                            image: getAttr('meta[property="og:image"]', 'content'),
                                        },
                                    };
                                })];
                        case 4:
                            data = _a.sent();
                            return [2 /*return*/, data];
                        case 5: return [4 /*yield*/, page.close()];
                        case 6:
                            _a.sent();
                            return [7 /*endfinally*/];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        return ScraperService_1;
    }());
    __setFunctionName(_classThis, "ScraperService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ScraperService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ScraperService = _classThis;
}();
exports.ScraperService = ScraperService;
