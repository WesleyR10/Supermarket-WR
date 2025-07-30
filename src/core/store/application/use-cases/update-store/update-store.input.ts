import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  validateSync,
} from 'class-validator';

export class UpdateStoreInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  settings?: object;

  @IsOptional()
  @IsObject()
  subscription?: object;

  constructor(props?: UpdateStoreInput) {
    if (!props) return;
    this.id = props.id;
    this.name = props.name;
    this.settings = props.settings;
    this.subscription = props.subscription;
  }
}

export class ValidateUpdateStoreInput {
  static validate(input: UpdateStoreInput) {
    return validateSync(input);
  }
}