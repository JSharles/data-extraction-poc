"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_rabbitmq_1 = require("@golevelup/nestjs-rabbitmq");
const config_1 = require("@nestjs/config");
const submission_controller_1 = require("./submission.controller");
const submission_service_1 = require("./submission.service");
let SubmissionModule = class SubmissionModule {
};
exports.SubmissionModule = SubmissionModule;
exports.SubmissionModule = SubmissionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_rabbitmq_1.RabbitMQModule.forRootAsync(nestjs_rabbitmq_1.RabbitMQModule, {
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.getOrThrow('RABBITMQ_URL'),
                    exchanges: [
                        {
                            name: 'document',
                            type: 'direct',
                        },
                    ],
                }),
            }),
        ],
        controllers: [submission_controller_1.SubmissionController],
        providers: [submission_service_1.SubmissionService],
    })
], SubmissionModule);
