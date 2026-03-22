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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentCheckerService = exports.SPAM_WORD_LIST = void 0;
var common_1 = require("@nestjs/common");
// ─── Constants ────────────────────────────────────────────────────────────────
/**
 * Kara liste — bu dosyayı genişletmek için buraya ekle.
 * Faz 5'te Strategist Agent bu listeyi otomatik güncelleyebilir.
 */
exports.SPAM_WORD_LIST = [
    // Klasik spam tetikleyiciler
    'free', 'limited time', 'act now', 'guaranteed', 'click here',
    'buy now', 'urgent', 'winner', 'congratulations', '100%',
    'no cost', 'risk-free', 'risk free', 'no obligation',
    // Para / kazanç
    'earn money', 'make money', 'cash', 'prize', 'reward',
    'million dollars', 'billion dollars',
    // Acele / baskı
    'don\'t delete', 'don\'t miss', 'expires', 'expiring',
    'final notice', 'last chance', 'now only',
    // Medikal / legal gri alan
    'miracle', 'cure', 'doctor approved', 'clinically proven',
    // Phishing benzeri
    'verify your account', 'confirm your email', 'update your billing',
    'your account has been', 'dear friend',
];
// ─── Service ──────────────────────────────────────────────────────────────────
var ContentCheckerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ContentCheckerService = _classThis = /** @class */ (function () {
        function ContentCheckerService_1() {
        }
        /**
         * Bir email step'ini kontrol et (subject + body).
         */
        ContentCheckerService_1.prototype.checkEmail = function (subject, body, senderName) {
            var spam = this.checkSpamWords(subject + ' ' + body);
            var length = this.checkLength(subject, body);
            var placeholders = this.checkPlaceholders(body);
            var personalization = this.scorePersonalization(subject, body);
            // ── Faz 2.5 yeni kontroller ───────────────────────────────────────────
            var linkRatio = this.checkLinkRatio(body);
            var htmlComplexity = this.checkHtmlComplexity(body);
            var subjectLine = this.checkSubjectLine(subject);
            var sender = this.checkSenderName(senderName);
            var overallWarnings = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], spam.spamWords.length > 0
                ? ["Spam kelimesi tespit edildi: ".concat(spam.spamWords.join(', '))]
                : [], true), length.warnings, true), placeholders.warnings, true), linkRatio.warnings, true), htmlComplexity.warnings, true), subjectLine.warnings, true), sender.warnings, true);
            // Composite score
            var scoreFactors = [
                spam.passed ? 25 : 0,
                placeholders.hasUnsubscribeLink && placeholders.hasPhysicalAddress ? 20 : 0,
                linkRatio.passed ? 15 : 5,
                subjectLine.passed ? 20 : 5,
                sender.passed ? 10 : 0,
                htmlComplexity.passed ? 10 : 5,
            ];
            var overallScore = Math.min(100, scoreFactors.reduce(function (a, b) { return a + b; }, 0));
            return {
                spam: spam,
                length: length,
                placeholders: placeholders,
                personalization: personalization,
                linkRatio: linkRatio,
                htmlComplexity: htmlComplexity,
                subjectLine: subjectLine,
                sender: sender,
                overallWarnings: overallWarnings,
                overallScore: overallScore,
            };
        };
        /**
         * Spam kelimelerini tara.
         */
        ContentCheckerService_1.prototype.checkSpamWords = function (text) {
            var lower = text.toLowerCase();
            var found = exports.SPAM_WORD_LIST.filter(function (word) { return lower.includes(word.toLowerCase()); });
            return {
                passed: found.length === 0,
                spamWords: found,
                warningMessage: found.length > 0
                    ? "Bu email spam filtresine tak\u0131labilir. \u015Eu kelimeleri de\u011Fi\u015Ftirmeyi d\u00FC\u015F\u00FCn: ".concat(found.join(', '))
                    : undefined,
            };
        };
        /**
         * Subject + body uzunluk kontrolleri.
         */
        ContentCheckerService_1.prototype.checkLength = function (subject, body) {
            var subjectLength = subject.length;
            var bodyWordCount = body
                .replace(/<[^>]*>/g, '')
                .split(/\s+/)
                .filter(Boolean).length;
            var warnings = [];
            if (subjectLength > 60) {
                warnings.push("Subject \u00E7ok uzun (".concat(subjectLength, " karakter). 60 karakterin alt\u0131nda tutun."));
            }
            if (bodyWordCount > 300) {
                warnings.push("Body \u00E7ok uzun (".concat(bodyWordCount, " kelime). 150-200 kelime idealdir."));
            }
            if (bodyWordCount < 20) {
                warnings.push("Body \u00E7ok k\u0131sa (".concat(bodyWordCount, " kelime). En az 30 kelime \u00F6nerilir."));
            }
            return {
                subjectOk: subjectLength <= 60,
                bodyOk: bodyWordCount <= 300,
                subjectLength: subjectLength,
                bodyWordCount: bodyWordCount,
                warnings: warnings,
            };
        };
        /**
         * Zorunlu placeholder kontrolü.
         */
        ContentCheckerService_1.prototype.checkPlaceholders = function (body) {
            var hasFirstName = body.includes('{{first_name}}');
            var hasCompanyName = body.includes('{{company_name}}');
            var hasUnsubscribeLink = body.includes('{{unsubscribe_link}}') || body.toLowerCase().includes('unsubscribe');
            var hasPhysicalAddress = body.includes('{{physical_address}}') || this.hasAddressPattern(body);
            var warnings = [];
            if (!hasFirstName)
                warnings.push('{{first_name}} placeholder eksik. Kişiselleştirme düşük.');
            if (!hasCompanyName)
                warnings.push('{{company_name}} placeholder eksik.');
            if (!hasUnsubscribeLink)
                warnings.push('{{unsubscribe_link}} eksik — CAN-SPAM zorunlu!');
            if (!hasPhysicalAddress)
                warnings.push('{{physical_address}} eksik — CAN-SPAM zorunlu!');
            return { hasFirstName: hasFirstName, hasCompanyName: hasCompanyName, hasUnsubscribeLink: hasUnsubscribeLink, hasPhysicalAddress: hasPhysicalAddress, warnings: warnings };
        };
        /**
         * Basit kişiselleştirme skoru (0-100).
         */
        ContentCheckerService_1.prototype.scorePersonalization = function (subject, body) {
            var _a;
            var text = subject + ' ' + body;
            var score = 0;
            var reasons = [];
            if (text.includes('{{first_name}}')) {
                score += 20;
                reasons.push('First name kullanılmış (+20)');
            }
            if (text.includes('{{company_name}}')) {
                score += 20;
                reasons.push('Company name kullanılmış (+20)');
            }
            if (text.includes('{{job_title}}')) {
                score += 15;
                reasons.push('Job title kullanılmış (+15)');
            }
            if (text.includes('{{industry}}')) {
                score += 10;
                reasons.push('Industry kullanılmış (+10)');
            }
            if (text.includes('{{pain_point}}') || text.includes('{{challenge}}')) {
                score += 15;
                reasons.push('Pain point placeholder kullanılmış (+15)');
            }
            // Soru işareti (merak uyandırıcı soru)
            if (((_a = text.match(/\?/g)) !== null && _a !== void 0 ? _a : []).length >= 1) {
                score += 10;
                reasons.push('Soru içeriyor (+10)');
            }
            // Kısa subject bonus
            if (subject.length <= 40) {
                score += 10;
                reasons.push('Kısa subject (+10)');
            }
            return { score: Math.min(score, 100), reasons: reasons };
        };
        // ─── Faz 2.5 Yeni Kontroller ──────────────────────────────────────────────────
        /**
         * Link/metin oranını kontrol et.
         * Çok fazla link → spam riski.
         */
        ContentCheckerService_1.prototype.checkLinkRatio = function (body) {
            var _a;
            var linkMatches = (_a = body.match(/<a\s[^>]*>/gi)) !== null && _a !== void 0 ? _a : [];
            var linkCount = linkMatches.length;
            var plainText = body.replace(/<[^>]*>/g, '').trim();
            var wordCount = plainText.split(/\s+/).filter(Boolean).length;
            var ratio = wordCount > 0 ? (linkCount / wordCount) * 100 : 0;
            var warnings = [];
            var passed = true;
            if (linkCount > 5) {
                warnings.push("\u00C7ok fazla link (".concat(linkCount, "). 3'ten fazla link spam riskini art\u0131r\u0131r."));
                passed = false;
            }
            else if (ratio > 10) {
                warnings.push("Link/metin oran\u0131 y\u00FCksek (%".concat(ratio.toFixed(1), "). Daha az link kullan\u0131n."));
                passed = false;
            }
            return { linkCount: linkCount, wordCount: wordCount, ratio: ratio, passed: passed, warnings: warnings };
        };
        /**
         * HTML karmaşıklığını kontrol et.
         * Çok fazla HTML tag → spam gibi görünür.
         */
        ContentCheckerService_1.prototype.checkHtmlComplexity = function (body) {
            var _a;
            var tagMatches = (_a = body.match(/<[^>]+>/g)) !== null && _a !== void 0 ? _a : [];
            var tagCount = tagMatches.length;
            var warnings = [];
            var passed = true;
            if (tagCount > 50) {
                warnings.push("HTML \u00E7ok karma\u015F\u0131k (".concat(tagCount, " tag). Basit, d\u00FCz metin a\u011F\u0131rl\u0131kl\u0131 email tercih edin."));
                passed = false;
            }
            else if (tagCount > 30) {
                warnings.push("HTML biraz karma\u015F\u0131k (".concat(tagCount, " tag). Cold email i\u00E7in daha sade bir format \u00F6nerilir."));
            }
            return { tagCount: tagCount, passed: passed, warnings: warnings };
        };
        /**
         * Subject satırını kontrol et.
         * ALL CAPS, aşırı ! veya ? → spam sinyali.
         */
        ContentCheckerService_1.prototype.checkSubjectLine = function (subject) {
            var _a, _b;
            var warnings = [];
            // ALL CAPS kontrolü (tüm harflerin büyük olduğu kelimeler)
            var words = subject.split(/\s+/);
            var capsWords = words.filter(function (w) { return w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w); });
            var hasAllCaps = capsWords.length >= 2;
            // Aşırı ünlem işareti
            var exclamationCount = ((_a = subject.match(/!/g)) !== null && _a !== void 0 ? _a : []).length;
            var excessiveExclamation = exclamationCount >= 2;
            // Aşırı soru işareti
            var questionCount = ((_b = subject.match(/\?/g)) !== null && _b !== void 0 ? _b : []).length;
            var excessiveQuestion = questionCount >= 2;
            var passed = !hasAllCaps && !excessiveExclamation;
            if (hasAllCaps) {
                warnings.push("Subject'te b\u00FCy\u00FCk harf kelimeler var (".concat(capsWords.join(', '), "). Spam alg\u0131s\u0131 yarat\u0131r."));
            }
            if (excessiveExclamation) {
                warnings.push("Subject'te \u00E7ok fazla \u00FCnlem i\u015Fareti (".concat(exclamationCount, " adet). Spam gibi g\u00F6r\u00FCn\u00FCr."));
            }
            if (excessiveQuestion) {
                warnings.push("Subject'te \u00E7ok fazla soru i\u015Fareti (".concat(questionCount, " adet). Tek bir soru yeterli."));
            }
            return {
                hasAllCaps: hasAllCaps,
                excessiveExclamation: excessiveExclamation,
                excessiveQuestion: excessiveQuestion,
                length: subject.length,
                passed: passed,
                warnings: warnings,
            };
        };
        /**
         * Gönderici adını kontrol et — boş olmamalı.
         */
        ContentCheckerService_1.prototype.checkSenderName = function (senderName) {
            var hasSenderName = !!(senderName && senderName.trim().length > 0);
            var warnings = [];
            if (!hasSenderName) {
                warnings.push('Gönderici adı (sender name) boş. Gerçek bir isim eklemek teslim oranını artırır.');
            }
            return { hasSenderName: hasSenderName, passed: hasSenderName, warnings: warnings };
        };
        /**
         * Call script'i kontrol et.
         */
        ContentCheckerService_1.prototype.checkCallScript = function (openingScript, objectionHandlers) {
            var warnings = [];
            var hasAiDisclosure = openingScript.toLowerCase().includes('ai') ||
                openingScript.toLowerCase().includes('automated') ||
                openingScript.toLowerCase().includes('artificial intelligence');
            if (!hasAiDisclosure) {
                warnings.push('AI araması için açılışta AI açıklaması önerilir (bazı eyaletlerde zorunlu).');
            }
            if (objectionHandlers.length < 5) {
                warnings.push("Sadece ".concat(objectionHandlers.length, " itiraz tan\u0131mlanm\u0131\u015F. En az 5 \u00F6nerilir."));
            }
            return { hasAiDisclosure: hasAiDisclosure, objectionCount: objectionHandlers.length, warnings: warnings };
        };
        // ─── Private ──────────────────────────────────────────────────────────────
        ContentCheckerService_1.prototype.hasAddressPattern = function (body) {
            // Basic check for address-like patterns (street, city, state, zip)
            return /\d{1,5}\s+\w+\s+(st|ave|blvd|rd|dr|ln|way|ct|pl)/i.test(body) ||
                /\b[A-Z]{2}\s+\d{5}\b/.test(body);
        };
        return ContentCheckerService_1;
    }());
    __setFunctionName(_classThis, "ContentCheckerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ContentCheckerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ContentCheckerService = _classThis;
}();
exports.ContentCheckerService = ContentCheckerService;
