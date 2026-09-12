import { Injectable, OnModuleInit } from '@nestjs/common';
import { PatternEngine, JupeRule, RobeRule } from '@angaly/pattern-engine';

@Injectable()
export class PatternEngineProvider implements OnModuleInit {
  private engine: PatternEngine;

  constructor() {
    this.engine = new PatternEngine();
  }

  onModuleInit() {
    // Enregistrement des règles géométriques supportées
    this.engine.registerRule(JupeRule);
    this.engine.registerRule(RobeRule);
  }

  getEngine(): PatternEngine {
    return this.engine;
  }
}
