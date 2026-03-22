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
exports.ProjectsService = void 0;
var common_1 = require("@nestjs/common");
var drizzle_orm_1 = require("drizzle-orm");
var schema = require("@autonomous-sales/database");
var ProjectsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ProjectsService = _classThis = /** @class */ (function () {
        function ProjectsService_1(db, analyzeUrlQueue) {
            this.db = db;
            this.analyzeUrlQueue = analyzeUrlQueue;
        }
        ProjectsService_1.prototype.create = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var project, analysisStatus;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.assertWorkspaceMember(dto.workspaceId, userId)];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, this.db
                                    .insert(schema.projects)
                                    .values({
                                    workspaceId: dto.workspaceId,
                                    name: dto.name,
                                    websiteUrl: dto.websiteUrl,
                                    industry: dto.industry,
                                    businessType: (_a = dto.businessType) !== null && _a !== void 0 ? _a : 'other',
                                    targetGeography: (_b = dto.targetGeography) !== null && _b !== void 0 ? _b : [],
                                    defaultLanguage: (_c = dto.defaultLanguage) !== null && _c !== void 0 ? _c : 'en',
                                    status: 'onboarding',
                                })
                                    .returning()];
                        case 2:
                            project = (_d.sent())[0];
                            // Seed empty analysis record
                            return [4 /*yield*/, this.db.insert(schema.projectAnalysis).values({ projectId: project.id })];
                        case 3:
                            // Seed empty analysis record
                            _d.sent();
                            analysisStatus = 'no_url';
                            if (!dto.websiteUrl) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.analyzeUrlQueue.add({ projectId: project.id, websiteUrl: dto.websiteUrl, agentType: 'analyzer', workspaceId: dto.workspaceId }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })];
                        case 4:
                            _d.sent();
                            analysisStatus = 'pending';
                            _d.label = 5;
                        case 5: return [2 /*return*/, __assign(__assign({}, project), { analysis_status: analysisStatus })];
                    }
                });
            });
        };
        ProjectsService_1.prototype.findAll = function (userId, workspaceId) {
            return __awaiter(this, void 0, void 0, function () {
                var projects, result;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertWorkspaceMember(workspaceId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.projects.findMany({
                                    where: (0, drizzle_orm_1.eq)(schema.projects.workspaceId, workspaceId),
                                })];
                        case 2:
                            projects = _a.sent();
                            return [4 /*yield*/, Promise.all(projects.map(function (p) { return __awaiter(_this, void 0, void 0, function () {
                                    var analysis;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.db.query.projectAnalysis.findFirst({
                                                    where: (0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, p.id),
                                                })];
                                            case 1:
                                                analysis = _a.sent();
                                                return [2 /*return*/, __assign(__assign({}, p), { analysis_status: (analysis === null || analysis === void 0 ? void 0 : analysis.analyzedAt)
                                                            ? 'completed'
                                                            : (analysis === null || analysis === void 0 ? void 0 : analysis.rawScrapedData) && analysis.rawScrapedData.error
                                                                ? 'failed'
                                                                : 'pending' })];
                                        }
                                    });
                                }); }))];
                        case 3:
                            result = _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        ProjectsService_1.prototype.findOne = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var project;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.projects.findFirst({
                                where: (0, drizzle_orm_1.eq)(schema.projects.id, id),
                            })];
                        case 1:
                            project = _a.sent();
                            if (!project)
                                throw new common_1.NotFoundException('Project not found');
                            return [4 /*yield*/, this.assertWorkspaceMember(project.workspaceId, userId)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, project];
                    }
                });
            });
        };
        ProjectsService_1.prototype.update = function (id, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var project, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            project = _a.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.projects)
                                    .set(__assign(__assign({}, dto), { updatedAt: new Date() }))
                                    .where((0, drizzle_orm_1.eq)(schema.projects.id, project.id))
                                    .returning()];
                        case 2:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        ProjectsService_1.prototype.remove = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var project;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, userId)];
                        case 1:
                            project = _a.sent();
                            return [4 /*yield*/, this.db.delete(schema.projects).where((0, drizzle_orm_1.eq)(schema.projects.id, project.id))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        // ── Analysis ─────────────────────────────────────────────────────────────
        ProjectsService_1.prototype.getAnalysis = function (projectId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var analysis, failed, icpProfiles;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.db.query.projectAnalysis.findFirst({
                                    where: (0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId),
                                })];
                        case 2:
                            analysis = _b.sent();
                            if (!analysis)
                                throw new common_1.NotFoundException('Analysis not found');
                            if (!analysis.analyzedAt) {
                                failed = (_a = analysis.rawScrapedData) === null || _a === void 0 ? void 0 : _a.error;
                                return [2 /*return*/, {
                                        status: failed ? 'failed' : 'pending',
                                        error: failed !== null && failed !== void 0 ? failed : null,
                                    }];
                            }
                            return [4 /*yield*/, this.db.query.icpProfiles.findMany({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId), (0, drizzle_orm_1.eq)(schema.icpProfiles.isActive, true)),
                                })];
                        case 3:
                            icpProfiles = _b.sent();
                            return [2 /*return*/, __assign(__assign({ status: 'completed' }, analysis), { icpProfiles: icpProfiles })];
                    }
                });
            });
        };
        ProjectsService_1.prototype.confirmAnalysis = function (projectId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var updateFields, updated;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _b.sent();
                            updateFields = {
                                userConfirmed: true,
                                userEdits: (_a = dto.edits) !== null && _a !== void 0 ? _a : null,
                            };
                            // Apply user edits to main fields
                            if (dto.edits) {
                                if (dto.edits.valueProposition)
                                    updateFields.valueProposition = dto.edits.valueProposition;
                                if (dto.edits.productDescription)
                                    updateFields.productDescription = dto.edits.productDescription;
                                if (dto.edits.targetMarket)
                                    updateFields.targetMarket = dto.edits.targetMarket;
                                if (dto.edits.keyFeatures)
                                    updateFields.keyFeatures = dto.edits.keyFeatures;
                                if (dto.edits.toneOfVoice)
                                    updateFields.toneOfVoice = dto.edits.toneOfVoice;
                            }
                            return [4 /*yield*/, this.db
                                    .update(schema.projectAnalysis)
                                    .set(updateFields)
                                    .where((0, drizzle_orm_1.eq)(schema.projectAnalysis.projectId, projectId))];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.db
                                    .update(schema.projects)
                                    .set({ status: 'active', updatedAt: new Date() })
                                    .where((0, drizzle_orm_1.eq)(schema.projects.id, projectId))
                                    .returning()];
                        case 3:
                            updated = (_b.sent())[0];
                            return [2 /*return*/, { success: true, project: updated }];
                    }
                });
            });
        };
        ProjectsService_1.prototype.retryAnalysis = function (projectId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var project;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            project = _a.sent();
                            if (!project.websiteUrl) {
                                throw new common_1.BadRequestException('Project has no website URL to analyze');
                            }
                            return [4 /*yield*/, this.analyzeUrlQueue.add({
                                    projectId: projectId,
                                    websiteUrl: project.websiteUrl,
                                    agentType: 'analyzer',
                                    workspaceId: project.workspaceId,
                                }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { queued: true, projectId: projectId }];
                    }
                });
            });
        };
        // ── ICP Profiles ──────────────────────────────────────────────────────────
        ProjectsService_1.prototype.getIcpProfiles = function (projectId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.db.query.icpProfiles.findMany({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId), (0, drizzle_orm_1.eq)(schema.icpProfiles.isActive, true)),
                                })];
                    }
                });
            });
        };
        ProjectsService_1.prototype.createIcpProfile = function (projectId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var profile;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db
                                    .insert(schema.icpProfiles)
                                    .values(__assign(__assign({ projectId: projectId }, dto), { isActive: true }))
                                    .returning()];
                        case 2:
                            profile = (_a.sent())[0];
                            return [2 /*return*/, profile];
                    }
                });
            });
        };
        ProjectsService_1.prototype.updateIcpProfile = function (projectId, icpId, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var icp, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.icpProfiles.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icpId), (0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId)),
                                })];
                        case 2:
                            icp = _a.sent();
                            if (!icp)
                                throw new common_1.NotFoundException('ICP profile not found');
                            return [4 /*yield*/, this.db
                                    .update(schema.icpProfiles)
                                    .set(dto)
                                    .where((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icpId))
                                    .returning()];
                        case 3:
                            updated = (_a.sent())[0];
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        ProjectsService_1.prototype.deleteIcpProfile = function (projectId, icpId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var icp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(projectId, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.db.query.icpProfiles.findFirst({
                                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icpId), (0, drizzle_orm_1.eq)(schema.icpProfiles.projectId, projectId)),
                                })];
                        case 2:
                            icp = _a.sent();
                            if (!icp)
                                throw new common_1.NotFoundException('ICP profile not found');
                            return [4 /*yield*/, this.db
                                    .update(schema.icpProfiles)
                                    .set({ isActive: false })
                                    .where((0, drizzle_orm_1.eq)(schema.icpProfiles.id, icpId))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        // ── Private ───────────────────────────────────────────────────────────────
        ProjectsService_1.prototype.assertWorkspaceMember = function (workspaceId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var m;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.db.query.workspaceMembers.findFirst({
                                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema.workspaceMembers.userId, userId)),
                            })];
                        case 1:
                            m = _a.sent();
                            if (!m)
                                throw new common_1.ForbiddenException('No access to this workspace');
                            return [2 /*return*/, m];
                    }
                });
            });
        };
        return ProjectsService_1;
    }());
    __setFunctionName(_classThis, "ProjectsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProjectsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProjectsService = _classThis;
}();
exports.ProjectsService = ProjectsService;
