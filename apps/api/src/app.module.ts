import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SubmissionModule,
  ],
})
export class AppModule {}
