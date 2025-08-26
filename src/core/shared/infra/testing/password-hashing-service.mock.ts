import { IPasswordHashingService } from '../../domain/services/password-hashing.service';

export class PasswordHashingServiceMock implements IPasswordHashingService {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}