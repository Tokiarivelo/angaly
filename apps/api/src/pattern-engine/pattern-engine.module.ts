import { Module } from '@nestjs/common';
import { PatternEngineProvider } from './infrastructure/providers/pattern-engine.provider';
import { GeneratePatternPiecesUseCase } from './application/use-cases/generate-pattern-pieces.use-case';

@Module({
  providers: [PatternEngineProvider, GeneratePatternPiecesUseCase],
  exports: [GeneratePatternPiecesUseCase], // Consommé par le module `patterns` plus tard
})
export class PatternEngineModule {}
