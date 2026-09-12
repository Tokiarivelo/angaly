import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  PatternEngine,
  JupeRule,
  RobeRule,
  PantalonRule,
  VesteRule,
  ChemiseRule,
} from '@angaly/pattern-engine';

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
    this.engine.registerRule(PantalonRule);
    this.engine.registerRule(VesteRule);
    this.engine.registerRule(ChemiseRule);
  }

  getEngine(): PatternEngine {
    return this.engine;
  }
}
