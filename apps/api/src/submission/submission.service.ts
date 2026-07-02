import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaClient } from '@prisma/client';
import { CreateSubmissionDto } from './submission.dto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubmissionService {
  private readonly prisma = new PrismaClient();
  private readonly nasPath = process.env['NAS_PATH'] ?? '/nas/documents';

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async create(dto: CreateSubmissionDto, file?: Express.Multer.File) {
    let documentPath: string | undefined;

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

  private async saveFile(file: Express.Multer.File): Promise<string> {
    await mkdir(this.nasPath, { recursive: true });
    const filename = `${uuidv4()}-${file.originalname}`;
    const fullPath = join(this.nasPath, filename);
    await writeFile(fullPath, file.buffer);
    return fullPath;
  }
}
