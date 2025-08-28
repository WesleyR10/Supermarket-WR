import { IsOptional, IsNumber, Min, validateSync } from 'class-validator';

export class CleanupExpiredCartsInput {
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiry_hours?: number = 24; // Padrão: 24 horas

  @IsOptional()
  @IsNumber()
  @Min(1)
  batch_size?: number = 100; // Quantidade de carrinhos processados por vez

  constructor(props?: CleanupExpiredCartsInput) {
    if (!props) return;
    Object.assign(this, props);
  }
}

export class ValidateCleanupExpiredCartsInput {
  static validate(input: CleanupExpiredCartsInput) {
    return validateSync(input);
  }
}