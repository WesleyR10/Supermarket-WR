import { Entity } from '../../../domain/entity';
import { ValueObject } from '../../../domain/value-object';
import { IRepository, ISearchableRepository } from '../../../domain/repository/repository-interface';
import { SearchParams } from '../../../domain/repository/search-params';
import { SearchResult } from '../../../domain/repository/search-result';

export abstract class InMemoryRepository<
  E extends Entity,
  EntityId extends ValueObject,
> implements IRepository<E, EntityId>
{
  items: E[] = [];

  async insert(entity: E): Promise<void> {
    this.items.push(entity);
  }

  async bulkInsert(entities: E[]): Promise<void> {
    this.items.push(...entities);
  }

  async update(entity: E): Promise<void> {
    const indexFound = this.items.findIndex((item) =>
      item.entity_id.equals(entity.entity_id),
    );
    if (indexFound >= 0) {
      this.items[indexFound] = entity;
    }
  }

  async delete(entity_id: EntityId): Promise<void> {
    const indexFound = this.items.findIndex((item) =>
      item.entity_id.equals(entity_id),
    );
    if (indexFound >= 0) {
      this.items.splice(indexFound, 1);
    }
  }

  async findById(entity_id: EntityId): Promise<E | null> {
    const item = this.items.find((item) => item.entity_id.equals(entity_id));
    return typeof item === 'undefined' ? null : item;
  }

  async findAll(): Promise<E[]> {
    return this.items;
  }

  async findByIds(ids: EntityId[]): Promise<E[]> {
    return this.items.filter((item) =>
      ids.some((id) => (id as any).equals(item.entity_id)),
    );
  }

  async existsById(ids: EntityId[]): Promise<{
    exists: EntityId[];
    not_exists: EntityId[];
  }> {
    if (this.items.length === 0) {
      return {
        exists: [],
        not_exists: ids,
      };
    }

    const existsId = new Map<string, EntityId>();
    const notExistsId = new Map<string, EntityId>();

    ids.forEach((id) => {
      const item = this.items.find((item) => item.entity_id.equals(id));
      if (item) {
        existsId.set((id as any).id, id);
      } else {
        notExistsId.set((id as any).id, id);
      }
    });

    return {
      exists: Array.from(existsId.values()),
      not_exists: Array.from(notExistsId.values()),
    };
  }

  abstract getEntity(): new (...args: any[]) => E;
}

export abstract class InMemorySearchableRepository<
  E extends Entity,
  EntityId extends ValueObject,
  Filter = string,
  SearchInput extends SearchParams<Filter> = SearchParams<Filter>,
  SearchOutput extends SearchResult<E> = SearchResult<E>,
> extends InMemoryRepository<E, EntityId>
  implements ISearchableRepository<E, EntityId, Filter, SearchInput, SearchOutput>
{
  sortableFields: string[] = [];

  async search(props: SearchInput): Promise<SearchOutput> {
    const itemsFiltered = await this.applyFilter(this.items, props.filter);
    const itemsSorted = await this.applySort(
      itemsFiltered,
      props.sort,
      props.sort_dir,
    );
    const itemsPaginated = await this.applyPaginate(
      itemsSorted,
      props.page,
      props.per_page,
    );

    const result = new SearchResult({
      items: itemsPaginated,
      total: itemsFiltered.length,
      current_page: props.page,
      per_page: props.per_page,
    });

    return result as SearchOutput;
  }

  protected abstract applyFilter(
    items: E[],
    filter: Filter | null,
  ): Promise<E[]>;

  protected applySort(
    items: E[],
    sort: string | null,
    sort_dir: string | null,
    custom_getter?: (sort: string, item: E) => any,
  ): E[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    const sortedItems = [...items];
    return sortedItems.sort((a, b) => {
      const aValue = custom_getter ? custom_getter(sort, a) : a[sort];
      const bValue = custom_getter ? custom_getter(sort, b) : b[sort];

      if (aValue < bValue) {
        return sort_dir === 'desc' ? 1 : -1;
      }

      if (aValue > bValue) {
        return sort_dir === 'desc' ? -1 : 1;
      }

      return 0;
    });
  }

  protected async applyPaginate(
    items: E[],
    page: SearchParams['page'],
    per_page: SearchParams['per_page'],
  ): Promise<E[]> {
    const start = (page - 1) * per_page;
    const limit = start + per_page;
    return items.slice(start, limit);
  }
}
