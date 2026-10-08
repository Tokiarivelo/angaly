export const AI_TRAINING_SAMPLE_REPOSITORY = Symbol('IAiTrainingSampleRepository');

export interface AiTrainingSampleData {
  task: string;
  inputHash: string;
  imageUrl: string | null;
  output: unknown;
  providerId: string | null;
  modelVersion: string;
  confidence: number;
}

/** Pairs produced by external models, kept to train the local one. */
export interface IAiTrainingSampleRepository {
  /** Idempotent on (task, inputHash): the same photo is stored once, never overwriting a human label. */
  saveIfAbsent(data: AiTrainingSampleData): Promise<void>;
  /** Attaches the customer's final choices to the sample of the photo behind `mediaId`. */
  confirmLabelByMediaId(task: string, mediaId: string, humanLabel: unknown): Promise<void>;
}
