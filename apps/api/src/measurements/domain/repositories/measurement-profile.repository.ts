import { MeasurementProfile } from '../entities/measurement-profile.entity';

export interface IMeasurementProfileRepository {
  findById(id: string): Promise<MeasurementProfile | null>;
  findByCustomerId(customerId: string): Promise<MeasurementProfile[]>;
  save(profile: MeasurementProfile): Promise<void>;
  delete(id: string): Promise<void>;
}
