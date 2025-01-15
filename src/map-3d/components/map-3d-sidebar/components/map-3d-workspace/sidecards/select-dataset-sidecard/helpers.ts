import { isEmpty, isNil } from 'lodash';
import { DatasetList } from './enums';

export const getCurrentDatasetSidecard = (
  projectId?: string,
  siteId?: string,
  iterationId?: string,
) => {
  if (projectId && siteId && iterationId) {
    return DatasetList.Layer;
  } else if (projectId && siteId) {
    return DatasetList.Iteration;
  } else if (projectId) {
    return DatasetList.Site;
  } else {
    return DatasetList.None;
  }
};

/**
 * Filters the given list wrt the search query provided.
 *
 * @param searchValue string | undefined
 * @param list Array<ListType>
 * @returns Array<ListType>
 */
export const filterListBySearchQuery = <ListType extends { name: string }>(
  searchValue: string | undefined,
  list: Array<ListType>,
) => {
  if (isEmpty(searchValue) || isNil(searchValue)) {
    return list;
  }

  const filteredList: Array<ListType> = list.filter(({ name }) =>
    name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()),
  );
  return filteredList;
};
