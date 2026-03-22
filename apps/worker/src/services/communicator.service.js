"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.CommunicatorService = void 0;
var common_1 = require("@nestjs/common");
var shared_1 = require("@autonomous-sales/shared");
// ─── Step configs ─────────────────────────────────────────────────────────────
var EMAIL_STEPS = [
    {
        stepOrder: 1,
        delayDays: 0,
        note: '',
    },
    {
        stepOrder: 2,
        delayDays: 3,
        note: "Bu bir takip emaili. Al\u0131c\u0131 ilk emaile yan\u0131t vermedi.\n- \u0130lk emaile referans ver ama tekrar ETME\n- Yeni bir de\u011Fer \u00F6nerisi veya sosyal kan\u0131t sun\n- Daha k\u0131sa ol (60-80 kelime)\n- Bask\u0131c\u0131 olma, merak uyand\u0131r",
    },
    {
        stepOrder: 3,
        delayDays: 5,
        note: "Bu son takip emaili. Breakup email format\u0131nda yaz.\n- \u00C7ok k\u0131sa (40-60 kelime)\n- \"Sizi rahats\u0131z etmek istemiyorum\" tonu\n- Son bir de\u011Fer \u00F6nerisi veya kaynak b\u0131rak\n- Kap\u0131y\u0131 a\u00E7\u0131k b\u0131rak: \"\u0130leride ilgilenirseniz buraday\u0131m\"",
    },
];
var SPAM_WORDS = [
    'free', 'limited time', 'act now', 'guaranteed', 'click here',
    'buy now', 'urgent', 'winner', 'congratulations', '100%',
    'no cost', 'risk-free',
];
// ─── Service ──────────────────────────────────────────────────────────────────
var CommunicatorService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CommunicatorService = _classThis = /** @class */ (function () {
        function CommunicatorService_1() {
            this.logger = new common_1.Logger(CommunicatorService.name);
        }
        CommunicatorService_1.prototype.generateAll = function (ctx) {
            return __awaiter(this, void 0, void 0, function () {
                var llm, model, totalTokens, emailSteps, _i, EMAIL_STEPS_1, stepCfg, _a, resA, resB, _b, script, scriptTokens;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            llm = (0, shared_1.createLLMProvider)();
                            model = (0, shared_1.getModelForAgent)('communicator');
                            totalTokens = 0;
                            emailSteps = [];
                            _i = 0, EMAIL_STEPS_1 = EMAIL_STEPS;
                            _c.label = 1;
                        case 1:
                            if (!(_i < EMAIL_STEPS_1.length)) return [3 /*break*/, 4];
                            stepCfg = EMAIL_STEPS_1[_i];
                            this.logger.log("[Communicator] Generating email step ".concat(stepCfg.stepOrder, "..."));
                            return [4 /*yield*/, Promise.all([
                                    this.generateEmailVariant(llm, model, ctx, stepCfg, 'A'),
                                    this.generateEmailVariant(llm, model, ctx, stepCfg, 'B'),
                                ])];
                        case 2:
                            _a = _c.sent(), resA = _a[0], resB = _a[1];
                            totalTokens += resA.tokens + resB.tokens;
                            emailSteps.push({
                                stepOrder: stepCfg.stepOrder,
                                delayDays: stepCfg.delayDays,
                                variantA: resA.variant,
                                variantB: resB.variant,
                            });
                            _c.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            // ── 2. Call Script ────────────────────────────────────────────────────
                            this.logger.log('[Communicator] Generating call script...');
                            return [4 /*yield*/, this.generateCallScript(llm, model, ctx)];
                        case 5:
                            _b = _c.sent(), script = _b.script, scriptTokens = _b.tokens;
                            totalTokens += scriptTokens;
                            return [2 /*return*/, {
                                    emailSteps: emailSteps,
                                    callScript: script,
                                    tokensUsed: totalTokens,
                                    modelUsed: model,
                                }];
                    }
                });
            });
        };
        // ─── Email Variant ───────────────────────────────────────────────────────
        CommunicatorService_1.prototype.generateEmailVariant = function (llm, model, ctx, stepCfg, variant) {
            return __awaiter(this, void 0, void 0, function () {
                var variantNote, stepNote, langNote, templateNote, prompt, attempt, res, cleaned, parsed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            variantNote = variant === 'B'
                                ? '\n\nFarklı bir açıdan yaklaş. Farklı bir pain point kullan veya farklı bir CTA dene.'
                                : '';
                            stepNote = stepCfg.note ? "\n\n## ADIM NOTU:\n".concat(stepCfg.note) : '';
                            langNote = ctx.targetLanguage !== 'en'
                                ? "\n\nT\u00DCM \u00E7\u0131kt\u0131y\u0131 ".concat(ctx.targetLanguage, " dilinde yaz. Sadece JSON key'leri \u0130ngilizce kals\u0131n.")
                                : '';
                            templateNote = ctx.industryTemplateHint
                                ? "\n\n## SEKT\u00D6R \u015EABLONU (referans al, birebir kopyalama):\n".concat(ctx.industryTemplateHint)
                                : '';
                            prompt = "Sen d\u00FCnya \u00E7ap\u0131nda bir B2B cold email uzman\u0131s\u0131n. A\u015Fa\u011F\u0131daki bilgileri kullanarak bir cold email yaz.\n\n## KURALLAR:\n- K\u0131sa tut: maksimum 100 kelime body\n- Subject line: 5-8 kelime, merak uyand\u0131r\u0131c\u0131 ama clickbait de\u011Fil\n- \u0130lk c\u00FCmle: al\u0131c\u0131n\u0131n spesifik bir sorununa de\u011Fin (pain point)\n- \u00DCr\u00FCn\u00FC 1 c\u00FCmlede a\u00E7\u0131kla, \u00F6zellik listesi YAPMA\n- CTA: tek, net, d\u00FC\u015F\u00FCk bariyer\n- Ton: ".concat(ctx.toneOfVoice, "\n- Dil: ").concat(ctx.targetLanguage, "\n- Spam tetikleyici kelimelerden KA\u00C7IN: ").concat(SPAM_WORDS.join(', '), "\n- Do\u011Fal ve insan gibi yaz\n- Ki\u015Fiselle\u015Ftirme: {{first_name}}, {{company_name}}, {{job_title}}\n- Footer placeholder'lar\u0131 EKLE (de\u011Fi\u015Ftirme): {{unsubscribe_link}}, {{physical_address}}, {{sender_name}}, {{sender_title}}\n\n## PROJE B\u0130LG\u0130LER\u0130:\n- \u00DCr\u00FCn: ").concat(ctx.productDescription, "\n- De\u011Fer \u00D6nerisi: ").concat(ctx.valueProposition, "\n- Hedef Ki\u015Fi: ").concat(ctx.icpLabel, "\n- Hedef Pozisyon: ").concat(ctx.jobTitles.join(', '), "\n- Hedef Ki\u015Finin Sorunlar\u0131: ").concat(ctx.painPoints.join(', '), "\n- Sekt\u00F6r: ").concat(ctx.industry).concat(stepNote).concat(templateNote).concat(variantNote).concat(langNote, "\n\n## \u00C7IKTI FORMATI (SADECE JSON, ba\u015Fka hi\u00E7bir \u015Fey yazma):\n{\"subject\":\"string\",\"body\":\"string\",\"variant\":\"").concat(variant, "\"}");
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt < 3)) return [3 /*break*/, 4];
                            return [4 /*yield*/, llm.generateCompletion({
                                    model: model,
                                    prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür, markdown veya açıklama YOK.' : prompt,
                                    temperature: 0.7,
                                    maxTokens: 1500,
                                })];
                        case 2:
                            res = _a.sent();
                            try {
                                cleaned = this.cleanJson(res.content);
                                parsed = JSON.parse(cleaned);
                                return [2 /*return*/, { variant: __assign(__assign({}, parsed), { variant: variant }), tokens: res.tokensUsed }];
                            }
                            catch (_b) {
                                this.logger.warn("[Communicator] Email variant ".concat(variant, " step ").concat(stepCfg.stepOrder, " JSON parse failed, attempt ").concat(attempt + 1));
                            }
                            _a.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4: 
                        // Fallback
                        return [2 /*return*/, {
                                variant: {
                                    subject: "Quick question about {{company_name}}",
                                    body: "Hi {{first_name}},\n\n".concat(ctx.valueProposition, "\n\nWould you be open to a 15-minute call?\n\n{{sender_name}}\n{{sender_title}}\n\n{{unsubscribe_link}}\n{{physical_address}}"),
                                    variant: variant,
                                },
                                tokens: 0,
                            }];
                    }
                });
            });
        };
        // ─── Call Script ─────────────────────────────────────────────────────────
        CommunicatorService_1.prototype.generateCallScript = function (llm, model, ctx) {
            return __awaiter(this, void 0, void 0, function () {
                var langNote, prompt, attempt, res, cleaned, parsed;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            langNote = ctx.targetLanguage !== 'en'
                                ? "\n\nT\u00DCM \u00E7\u0131kt\u0131y\u0131 ".concat(ctx.targetLanguage, " dilinde yaz. Sadece JSON key'leri \u0130ngilizce kals\u0131n.")
                                : '';
                            prompt = "Sen d\u00FCnya \u00E7ap\u0131nda bir B2B sat\u0131\u015F ko\u00E7usun. A\u015Fa\u011F\u0131daki bilgileri kullanarak bir cold call senaryosu yaz.\n\n## SENARYO YAPISI:\n1. Opening: \u0130lk 10 saniye. Kendini tan\u0131t, neden arad\u0131\u011F\u0131n\u0131 1 c\u00FCmlede s\u00F6yle.\n2. Hook: 15-20 saniye. Al\u0131c\u0131n\u0131n sorununu dile getir, \u00E7\u00F6z\u00FCm\u00FC 1 c\u00FCmlede sun.\n3. Qualification: 2-3 soru sor.\n4. Objection Handling: En az 5 itiraz ve yan\u0131t.\n5. Closing: Meeting veya sonraki ad\u0131m.\n\n## \u0130T\u0130RAZ KAR\u015EILAMA (EN AZ 5):\n- \"Not interested\" / \"\u0130lgilenmiyorum\"\n- \"No budget\" / \"B\u00FCt\u00E7emiz yok\"\n- \"We already have a solution\" / \"Zaten bir \u00E7\u00F6z\u00FCm\u00FCm\u00FCz var\"\n- \"I'm not the decision maker\" / \"Karar verici ben de\u011Filim\"\n- \"Send me an email\" / \"Bana email at\u0131n\"\n- \"I'm busy right now\" / \"\u015Eu an me\u015Fgul\u00FCm\"\n\n## PROJE B\u0130LG\u0130LER\u0130:\n- \u00DCr\u00FCn: ".concat(ctx.productDescription, "\n- De\u011Fer \u00D6nerisi: ").concat(ctx.valueProposition, "\n- Hedef Ki\u015Fi: ").concat(ctx.icpLabel, "\n- Hedef Pozisyon: ").concat(ctx.jobTitles.join(', '), "\n- Sorunlar\u0131: ").concat(ctx.painPoints.join(', '), "\n- Ton: ").concat(ctx.toneOfVoice, "\n- Dil: ").concat(ctx.targetLanguage).concat(langNote, "\n\n## \u00C7IKTI FORMATI (SADECE JSON):\n{\n  \"opening_script\": \"string\",\n  \"hook\": \"string\",\n  \"qualification_questions\": [\"string\"],\n  \"objection_handlers\": [{\"objection\":\"string\",\"response\":\"string\"}],\n  \"closing_script\": \"string\",\n  \"dialogue_tree\": {\n    \"start\": {\"agent_says\":\"string\",\"if_positive\":\"hook\",\"if_negative\":\"objection_not_interested\",\"if_busy\":\"objection_busy\"},\n    \"hook\": {\"agent_says\":\"string\",\"if_positive\":\"qualification\",\"if_negative\":\"objection_no_need\"},\n    \"qualification\": {\"agent_says\":\"string\",\"if_qualified\":\"closing\",\"if_not_qualified\":\"polite_end\"},\n    \"closing\": {\"agent_says\":\"string\"},\n    \"polite_end\": {\"agent_says\":\"string\"}\n  }\n}");
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt < 3)) return [3 /*break*/, 4];
                            return [4 /*yield*/, llm.generateCompletion({
                                    model: model,
                                    prompt: attempt > 0 ? prompt + '\n\nSADECE JSON döndür.' : prompt,
                                    temperature: 0.7,
                                    maxTokens: 3000,
                                })];
                        case 2:
                            res = _a.sent();
                            try {
                                cleaned = this.cleanJson(res.content);
                                parsed = JSON.parse(cleaned);
                                return [2 /*return*/, { script: parsed, tokens: res.tokensUsed }];
                            }
                            catch (_b) {
                                this.logger.warn("[Communicator] Call script JSON parse failed, attempt ".concat(attempt + 1));
                            }
                            _a.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4: 
                        // Fallback minimal script
                        return [2 /*return*/, {
                                script: {
                                    opening_script: "Hi, this is [Name] from [Company]. I'm calling because we help ".concat(ctx.icpLabel, " with ").concat(ctx.valueProposition, ". Is this a good time?"),
                                    hook: "We've been helping businesses like yours ".concat(ctx.valueProposition, ". I wanted to see if that's something you're working on too."),
                                    qualification_questions: [
                                        "Are you currently dealing with [pain point]?",
                                        "Who on your team handles this?",
                                        "Is this a priority for you this quarter?",
                                    ],
                                    objection_handlers: [
                                        { objection: 'Not interested', response: "Totally understand. Can I ask what you're currently using to handle [pain point]?" },
                                        { objection: 'No budget', response: "Fair enough. Most of our customers said the same \u2014 until they saw the ROI. Would a quick 10-minute demo change that?" },
                                        { objection: 'We already have a solution', response: "Good to know. We actually work alongside existing tools. What are you using?" },
                                        { objection: "I'm not the decision maker", response: "No problem \u2014 who would be the right person to speak with?" },
                                        { objection: 'Send me an email', response: "Happy to. What email should I use, and what's the best subject line so it doesn't get buried?" },
                                    ],
                                    closing_script: "Great \u2014 let's set up a quick 15-minute call this week. Does Tuesday or Thursday work for you?",
                                    dialogue_tree: {
                                        start: { agent_says: "Hi, is this {{contact_name}}? Great \u2014 I'm calling from [Company]. Quick question: are you currently handling [pain point] manually?", if_positive: 'hook', if_negative: 'objection_not_interested', if_busy: 'objection_busy' },
                                        hook: { agent_says: "We built a tool that automates that for companies like yours. Takes about 15 minutes to set up. Worth a quick look?", if_positive: 'qualification', if_negative: 'objection_no_need' },
                                        qualification: { agent_says: "Just a couple of questions \u2014 how many [relevant metric] are you dealing with per week?", if_qualified: 'closing', if_not_qualified: 'polite_end' },
                                        closing: { agent_says: "Perfect. Let's schedule 15 minutes \u2014 I'll send a calendar link. What's your email?" },
                                        polite_end: { agent_says: "Totally fair. I'll shoot you a quick email with some resources. Have a great day!" },
                                    },
                                },
                                tokens: 0,
                            }];
                    }
                });
            });
        };
        // ─── Helpers ─────────────────────────────────────────────────────────────
        CommunicatorService_1.prototype.cleanJson = function (raw) {
            return raw
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
        };
        return CommunicatorService_1;
    }());
    __setFunctionName(_classThis, "CommunicatorService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CommunicatorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CommunicatorService = _classThis;
}();
exports.CommunicatorService = CommunicatorService;
