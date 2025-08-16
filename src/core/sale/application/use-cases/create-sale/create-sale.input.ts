import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  validateSync,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, SaleStatus } from '../../../domain/sale.aggregate';

export class SaleItemInput {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  unit_price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  discount_percentage?: number;
}

export type CreateSaleInputConstructorProps = {
  customer_id?: string | null;
  cashier_id: string;
  store_id: string;
  register_number: number;
  items: SaleItemInput[];
  payment_method: PaymentMethod;
  discount_amount?: number;
  tax_rate?: number;
};

export class CreateSaleInput {
  @IsString()
  @IsOptional()
  customer_id?: string | null;

  @IsString()
  @IsNotEmpty()
  cashier_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Type(() => Number)
  register_number: number;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4, allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tax_rate?: number; // ✅ Taxa de imposto em percentual (0..100)

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Type(() => Number)
  discount_amount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items: SaleItemInput[];

  constructor(props: CreateSaleInputConstructorProps) {
    if (!props) return;
    this.customer_id = props.customer_id;
    this.cashier_id = props.cashier_id;
    this.store_id = props.store_id;
    this.register_number = props.register_number;
    // Garantir instâncias de SaleItemInput para validação aninhada
    this.items = (props.items || []).map((i) => {
      const item = new SaleItemInput();
      item.product_id = i.product_id as any;
      item.quantity = i.quantity as any;
      item.unit_price = i.unit_price as any;
      if (i.discount_percentage !== undefined) {
        item.discount_percentage = i.discount_percentage as any;
      }
      return item;
    });
    this.payment_method = props.payment_method;
    this.discount_amount = props.discount_amount;
    this.tax_rate = props.tax_rate;
  }
}

export class ValidateCreateSaleInput {
  static validate(input: CreateSaleInput): { [field: string]: string[] }[] {
    const errors = validateSync(input, { forbidUnknownValues: false });

    if (!errors.length) return [];

    const result: { [field: string]: string[] }[] = [];

    for (const err of errors) {
      // Mensagens diretas deste nível
      const messages = err.constraints ? Object.values(err.constraints).map(String) : [];

      // Coletar mensagens dos filhos (ex.: items -> [ { property: '0', children: [...] } ])
      let childMessages: string[] = [];
      if (Array.isArray(err.children) && err.children.length > 0) {
        const collectChildMessages = (children: any[]): string[] => {
          const msgs: string[] = [];
          for (const child of children) {
            if (child.constraints) {
              msgs.push(...Object.values(child.constraints).map(String));
            }
            if (Array.isArray(child.children) && child.children.length > 0) {
              msgs.push(...collectChildMessages(child.children));
            }
          }
          return msgs;
        };
        childMessages = collectChildMessages(err.children);
      }

      const allMessages = [...messages, ...childMessages];
      if (allMessages.length > 0) {
        result.push({ [err.property]: Array.from(new Set(allMessages)) });
      }
    }

    return result;
  }
}