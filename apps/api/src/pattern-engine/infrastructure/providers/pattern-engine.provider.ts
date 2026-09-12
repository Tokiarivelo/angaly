import { Injectable, OnModuleInit } from '@nestjs/common';
import { PatternEngine, JupeRule } from '@angaly/pattern-engine';

@Injectable()
export class PatternEngineProvider implements OnModuleInit {
  private engine: PatternEngine;

  constructor() {
    this.engine = new PatternEngine();
  }

  onModuleInit() {
    // Enregistrement des règles géométriques supportées
    this.engine.registerRule(JupeRule);
    // TODO: add RobeRule, PantalonRule, etc as they are built
  }

  getEngine(): PatternEngine {
    return this.engine;
  }
}
