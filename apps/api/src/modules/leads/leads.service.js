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
exports.LeadsService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var LeadsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LeadsService = _classThis = /** @class */ (function () {
        function LeadsService_1(db) {
            this.db = db;
        }
        LeadsService_1.prototype.create = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var lead;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(dto.projectId, userId)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.db
                                    .insert(schema.leads)
                                    .values({
                                    projectId: dto.projectId,
                                    companyName: dto.companyName,
                                    contactName: dto.contactName,
                                    contactEmail: dto.contactEmail,
                                    contactPhone: dto.contactPhone,
                                    contactTitle: dto.contactTitle,
                                    website: dto.website,
                                    linkedinUrl: dto.linkedinUrl,
                                    source: (_a = dto.source) !== null && _a !== void 0 ? _a : 'manual',
                                    sourceDetail: dto.sourceDetail,
                                    icpProfileId: dto.icpProfileId,
                                    status: 'new',
                                })
                                    .returning()];
                        case 2:
                            lead = (_b.sent())[0];
                            return [2 /*return*/, lead];
                    }
                });
            });
        };
        LeadsService_1.prototype.findAll = function (userId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var conditions, page, limit, offset, rows, filtered;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(query.projectId, userId)];
                        case 1:
                            _c.sent();
                            conditions = [(0, drizzle_orm_1.eq)(schema.leads.projectId, query.projectId)];
                            if (query.status) {
                                conditions.push((0, drizzle_orm_1.eq)(schema.leads.status, query.status));
                            }
                            if (query.icpProfileId) {
                                conditions.push((0, drizzle_orm_1.eq)(schema.leads.icpProfileId, query.icpProfileId));
                            }
                            page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
                            limit = (_b = query.limit) !== null && _b !== void 0 ? _b : 50;
                            offset = (page - 1) * limit;
                            return [4 /*yield*/, this.db.query.leads.findMany({
                                    where: drizzle_orm_1.and.apply(void 0, conditions),
                                    limit: limit,
                                    offset: offset,
                                    with: {
                                        phoneVerification: true,
                                    },
                                })];
                        case 2:
                            rows = _c.sent();
                            filtered = query.phoneClassification
                                ? rows.filter(function (l) { var _a; return ((_a = l.phoneVerification) === null || _a === void 0 ? void 0 : _a.aiCallClassification) === query.phoneClassification; })
                                : rows;
                            return [2 /*return*/, {
                                    data: filtered,
                                    page: page,
                                    limit: limit,
                                }];
                    }
                });
            });
        };
        LeadsService_1.prototype.findOne = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var lead;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.leads.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.leads.id, id),
                                with: { phoneVerification: true, enrichment: true },
                            })];
                        case 1:
                            lead = _a.sent();
                            if (!lead)
                                throw new common_1.NotFoundException('Lead not found');
                            return [4 /*yield*/, this.assertProjectAccess(lead.projectId, userId)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, lead];
                    }
                });
            });
        };
        LeadsService_1.prototype.update = function (id, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var lead, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            lead = _a.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.leads)
                                    .set(__assign(__assign({}, dto), { updatedAt: new Date() }))
                                    .where((0, drizzle_orm_1.eq)(schema.leads.id, lead.id))
                                    .returning()];
                        case 2:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        LeadsService_1.prototype.remove = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var lead;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            lead = _a.sent();
                            return [4 /*yield*/, this.db.delete(schema.leads).where((0, drizzle_orm_1.eq)(schema.leads.id, lead.id))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        LeadsService_1.prototype.getEnrichment = function (leadId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var enrichment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(leadId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.leadEnrichment.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.leadEnrichment.leadId, leadId),
                                })];
                        case 2:
                            enrichment = _a.sent();
                            if (!enrichment)
                                throw new common_1.NotFoundException('No enrichment data for this lead');
                            return [2 /*return*/, enrichment];
                    }
                });
            });
        };
        LeadsService_1.prototype.getPhoneVerification = function (leadId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var verification;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(leadId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.phoneVerification.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.phoneVerification.leadId, leadId),
                                })];
                        case 2:
                            verification = _a.sent();
                            if (!verification)
                                throw new common_1.NotFoundException('No phone verification data for this lead');
                            return [2 /*return*/, verification];
                    }
                });
            });
        };
        /** Placeholder — real CSV parsing in a later phase */
        LeadsService_1.prototype.importCsv = function (userId, projectId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertProjectAccess(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { message: 'CSV import not yet implemented — coming in Phase 3' }];
                    }
                });
            });
        };
        // ─── Private ──────────────────────────────────────────────────────────────
        LeadsService_1.prototype.assertProjectAccess = function (projectId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var project, membership;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.projects.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.projects.id, projectId),
                            })];
                        case 1:
                            project = _a.sent();
                            if (!project)
                                throw new common_1.NotFoundException('Project not found');
                            return [4 /*yield*/, this.db.query.workspaceMembers.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.workspaceMembers.workspaceId, project.workspaceId), (0, drizzle_orm_1.eq)(schema.workspaceMembers.userId, userId)),
                                })];
                        case 2:
                            membership = _a.sent();
                            if (!membership)
                                throw new common_1.ForbiddenException('No access to this project');
                            return [2 /*return*/, project];
                    }
                });
            });
        };
        return LeadsService_1;
    }());
    __setFunctionName(_classThis, "LeadsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LeadsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LeadsService = _classThis;
}();
exports.LeadsService = LeadsService;
