"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_rabbitmq_1 = require("@golevelup/nestjs-rabbitmq");
const prisma_1 = require("../../generated/prisma");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const uuid_1 = require("uuid");
let SubmissionService = class SubmissionService {
    amqpConnection;
    prisma = new prisma_1.PrismaClient();
    nasPath = process.env['NAS_PATH'] ?? '/nas/documents';
    constructor(amqpConnection) {
        this.amqpConnection = amqpConnection;
    }
    async create(dto, file) {
        let documentPath;
        if (file) {
            documentPath = await this.saveFile(file);
        }
        const submission = await this.prisma.submission.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                documentPath: documentPath ?? null,
                status: documentPath ? 'PROCESSING' : 'PENDING',
            },
        });
        if (documentPath) {
            await this.amqpConnection.publish('document', 'document.process', {
                submissionId: submission.id,
                documentPath,
            });
        }
        return submission;
    }
    async saveFile(file) {
        await (0, promises_1.mkdir)(this.nasPath, { recursive: true });
        const filename = `${(0, uuid_1.v4)()}-${file.originalname}`;
        const fullPath = (0, path_1.join)(this.nasPath, filename);
        await (0, promises_1.writeFile)(fullPath, file.buffer);
        return fullPath;
    }
};
exports.SubmissionService = SubmissionService;
exports.SubmissionService = SubmissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_rabbitmq_1.AmqpConnection])
], SubmissionService);
