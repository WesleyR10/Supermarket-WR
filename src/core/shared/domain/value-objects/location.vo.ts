import { ValueObject } from '../value-object';

export class Location extends ValueObject {
  readonly aisle: string;
  readonly section: string;
  readonly shelf: string;
  readonly position?: string;

  constructor(props: LocationProps) {
    super();
    this.aisle = props.aisle;
    this.section = props.section;
    this.shelf = props.shelf;
    this.position = props.position;
    this.validate();
  }

  private validate() {
    if (!this.aisle || this.aisle.trim().length === 0) {
      throw new InvalidLocationError('Aisle is required');
    }

    if (!this.section || this.section.trim().length === 0) {
      throw new InvalidLocationError('Section is required');
    }

    if (!this.shelf || this.shelf.trim().length === 0) {
      throw new InvalidLocationError('Shelf is required');
    }

    // Validação de formato para corredor (A-Z ou números)
    if (!/^[A-Z0-9]+$/i.test(this.aisle)) {
      throw new InvalidLocationError('Aisle must contain only letters and numbers');
    }

    // Validação de formato para seção (números ou letras)
    if (!/^[A-Z0-9]+$/i.test(this.section)) {
      throw new InvalidLocationError('Section must contain only letters and numbers');
    }

    // Validação de formato para prateleira (números ou letras)
    if (!/^[A-Z0-9]+$/i.test(this.shelf)) {
      throw new InvalidLocationError('Shelf must contain only letters and numbers');
    }

    // Validação de posição se fornecida
    if (this.position && !/^[A-Z0-9]+$/i.test(this.position)) {
      throw new InvalidLocationError('Position must contain only letters and numbers');
    }

    // Validação de tamanho
    if (this.aisle.length > 10) {
      throw new InvalidLocationError('Aisle cannot exceed 10 characters');
    }

    if (this.section.length > 10) {
      throw new InvalidLocationError('Section cannot exceed 10 characters');
    }

    if (this.shelf.length > 10) {
      throw new InvalidLocationError('Shelf cannot exceed 10 characters');
    }

    if (this.position && this.position.length > 10) {
      throw new InvalidLocationError('Position cannot exceed 10 characters');
    }
  }

  getFullLocation(): string {
    const parts = [this.aisle, this.section, this.shelf];
    if (this.position) {
      parts.push(this.position);
    }
    return parts.join('-');
  }

  getShortLocation(): string {
    return `${this.aisle}-${this.section}-${this.shelf}`;
  }

  isSameAisle(other: Location): boolean {
    return this.aisle.toLowerCase() === other.aisle.toLowerCase();
  }

  isSameSection(other: Location): boolean {
    return this.isSameAisle(other) && 
           this.section.toLowerCase() === other.section.toLowerCase();
  }

  isSameShelf(other: Location): boolean {
    return this.isSameSection(other) && 
           this.shelf.toLowerCase() === other.shelf.toLowerCase();
  }

  isExactLocation(other: Location): boolean {
    return this.isSameShelf(other) && 
           this.position?.toLowerCase() === other.position?.toLowerCase();
  }

  isNearby(other: Location): boolean {
    // Considera próximo se estiver no mesmo corredor e seção adjacente
    if (!this.isSameAisle(other)) {
      return false;
    }

    const thisSection = parseInt(this.section);
    const otherSection = parseInt(other.section);

    // Se ambas as seções são numéricas, verifica se são adjacentes
    if (!isNaN(thisSection) && !isNaN(otherSection)) {
      return Math.abs(thisSection - otherSection) <= 1;
    }

    // Se não são numéricas, considera próximo apenas se for a mesma seção
    return this.isSameSection(other);
  }

  getDistance(other: Location): number {
    // Distância simples baseada na diferença de corredor, seção e prateleira
    let distance = 0;

    // Distância por corredor (peso maior)
    if (!this.isSameAisle(other)) {
      const thisAisle = this.aisle.charCodeAt(0);
      const otherAisle = other.aisle.charCodeAt(0);
      distance += Math.abs(thisAisle - otherAisle) * 100;
    }

    // Distância por seção
    if (!this.isSameSection(other)) {
      const thisSection = parseInt(this.section) || this.section.charCodeAt(0);
      const otherSection = parseInt(other.section) || other.section.charCodeAt(0);
      distance += Math.abs(thisSection - otherSection) * 10;
    }

    // Distância por prateleira
    if (!this.isSameShelf(other)) {
      const thisShelf = parseInt(this.shelf) || this.shelf.charCodeAt(0);
      const otherShelf = parseInt(other.shelf) || other.shelf.charCodeAt(0);
      distance += Math.abs(thisShelf - otherShelf);
    }

    return distance;
  }

  toString(): string {
    return this.getFullLocation();
  }

  toDisplayString(): string {
    const parts = [`Corredor ${this.aisle}`, `Seção ${this.section}`, `Prateleira ${this.shelf}`];
    if (this.position) {
      parts.push(`Posição ${this.position}`);
    }
    return parts.join(', ');
  }

  equals(other: Location): boolean {
    return this.aisle.toLowerCase() === other.aisle.toLowerCase() &&
           this.section.toLowerCase() === other.section.toLowerCase() &&
           this.shelf.toLowerCase() === other.shelf.toLowerCase() &&
           this.position?.toLowerCase() === other.position?.toLowerCase();
  }

  static fromString(locationString: string): Location {
    const parts = locationString.split('-');
    
    if (parts.length < 3) {
      throw new InvalidLocationError('Location string must have at least aisle, section, and shelf (format: A-1-2 or A-1-2-3)');
    }

    return new Location({
      aisle: parts[0],
      section: parts[1],
      shelf: parts[2],
      position: parts[3] || undefined
    });
  }

  static create(aisle: string, section: string, shelf: string, position?: string): Location {
    return new Location({ aisle, section, shelf, position });
  }

  // Métodos utilitários para tipos comuns de localização
  static createFridge(section: string, shelf: string): Location {
    return new Location({ aisle: 'FRIDGE', section, shelf });
  }

  static createFreezer(section: string, shelf: string): Location {
    return new Location({ aisle: 'FREEZER', section, shelf });
  }

  static createStorage(section: string, shelf: string): Location {
    return new Location({ aisle: 'STORAGE', section, shelf });
  }

  static createCheckout(position: string): Location {
    return new Location({ aisle: 'CHECKOUT', section: '1', shelf: '1', position });
  }

  // Métodos simplificados para supermercados grandes
  static createSimpleFreezer(number: string): Location {
    return new Location({ aisle: 'FREEZER', section: number, shelf: '1' });
  }

  static createSimpleFridge(number: string): Location {
    return new Location({ aisle: 'FRIDGE', section: number, shelf: '1' });
  }

  static createSimpleStorage(number: string): Location {
    return new Location({ aisle: 'STORAGE', section: number, shelf: '1' });
  }

  static createSimpleDryGoods(number: string): Location {
    return new Location({ aisle: 'DRY', section: number, shelf: '1' });
  }

  static createSimpleBakery(number: string): Location {
    return new Location({ aisle: 'BAKERY', section: number, shelf: '1' });
  }

  static createSimpleDeli(number: string): Location {
    return new Location({ aisle: 'DELI', section: number, shelf: '1' });
  }
}

export interface LocationProps {
  aisle: string;
  section: string;
  shelf: string;
  position?: string;
}

export class InvalidLocationError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid location');
    this.name = 'InvalidLocationError';
  }
}
