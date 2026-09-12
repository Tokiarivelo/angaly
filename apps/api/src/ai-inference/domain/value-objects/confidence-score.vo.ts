export class ConfidenceScore {
  constructor(public readonly value: number) {
    if (value < 0 || value > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }
  }

  isIndicativeOnly(): boolean {
    return this.value < 0.5;
  }
}
