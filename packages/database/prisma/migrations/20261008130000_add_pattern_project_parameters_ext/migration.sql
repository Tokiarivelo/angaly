-- Phase 5b S1 — extended engine parameters (ease, fullness, lengths). Additive, nullable.
ALTER TABLE "pattern_projects" ADD COLUMN "parametersExtJson" JSONB;
