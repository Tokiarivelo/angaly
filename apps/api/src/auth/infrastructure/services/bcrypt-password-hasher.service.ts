import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { IPasswordHasher } from '../../domain/services/password-hasher';

/** Cost factor 12 — a common, deliberately-slow default balancing security and login latency. */
const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasherService implements IPasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
