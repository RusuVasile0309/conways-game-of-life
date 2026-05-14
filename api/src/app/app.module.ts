import { Module } from '@nestjs/common';
import { PatternsModule } from '../patterns/patterns.module.js';

@Module({
  imports: [PatternsModule],
})
export class AppModule {}
