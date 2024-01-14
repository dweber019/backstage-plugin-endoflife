import { EndOfLifeProduct } from '../../api';
import { DataGroup, DataItem } from 'vis-timeline';
import { DateTime } from 'luxon';

export const getDateClass = (dateString: string) => {
  const dateNow = DateTime.fromISO(DateTime.now().toISODate());
  const date = DateTime.fromISO(dateString);
  const diff = dateNow.diff(date);

  if (date < dateNow) return 'dateMissed';
  if (date >= dateNow && Math.abs(diff.as('days')) <= 90) return 'dateClose';
  return 'dateOk';
};

const getAllDates = (endOfLifeProduct: EndOfLifeProduct) => {
  return endOfLifeProduct
    .map(cycleItem => [
      cycleItem.releaseDate,
      cycleItem.lts,
      cycleItem.support,
      cycleItem.eol,
      cycleItem.extendedSupport,
    ])
    .flat()
    .filter(dateString => typeof dateString === 'string')
    .sort(
      (a, b) =>
        new Date(b as string).getTime() - new Date(a as string).getTime(),
    ) as string[];
};

export const calculateMinTime = (
  endOfLifeProduct: EndOfLifeProduct,
): string => {
  const stringDates = getAllDates(endOfLifeProduct);
  const date = DateTime.fromISO(stringDates[stringDates.length - 1]);
  return date.minus({ month: 6 }).toISODate() ?? DateTime.now().toISODate();
};

export const calculateMaxTime = (
  endOfLifeProduct: EndOfLifeProduct,
): string => {
  const date = DateTime.fromISO(getAllDates(endOfLifeProduct)[0]).plus({
    month: 6,
  });

  const dateWithin6Months = DateTime.fromISO(DateTime.now().toISODate()).plus({
    month: 6,
  });

  if (date <= dateWithin6Months) return dateWithin6Months.toISODate() as string;

  return date.toISODate() ?? DateTime.now().toISODate();
};

export const calculateTimelineGroups = (
  endOfLifeProduct: EndOfLifeProduct,
): DataGroup[] => {
  return endOfLifeProduct.map(cycleItem => {
    const content = document.createElement('div');
    content.innerHTML = `
    <span class="cycle">${cycleItem.product} ${cycleItem.cycle} ${
      cycleItem.lts ? ' (LTS)' : ''
    }</span>
    <br/>
    <span class="latest">latest: ${cycleItem.latest}</span>
    `;

    return {
      id: cycleItem.cycle,
      content,
    };
  });
};

const isString = (possibleString: any) => {
  return typeof possibleString === 'string';
};

const isBooleanAnd = (possibleBoolean: any, and: boolean) => {
  return typeof possibleBoolean === 'boolean' && and === possibleBoolean;
};

export const calculateTimelineItems = (
  endOfLifeProduct: EndOfLifeProduct,
): DataItem[] => {
  return endOfLifeProduct
    .map((cycleItem, index) => {
      const dataItems: DataItem[] = [];
      const dateNow = DateTime.now().toISO();
      let itemAdded = false;

      // Span release to support
      if (isString(cycleItem.support) && cycleItem.releaseDate) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-support`,
          content: 'Support',
          title: 'Support',
          group: cycleItem.cycle,
          start: cycleItem.releaseDate,
          end: cycleItem.support as string,
          className: getDateClass(cycleItem.support as string),
        });
      }
      if (isBooleanAnd(cycleItem.support, true) && cycleItem.releaseDate) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-support`,
          content: 'Support',
          title: 'Support',
          group: cycleItem.cycle,
          start: cycleItem.releaseDate,
          end: dateNow,
          className: 'dateOk',
        });
      }

      // Span support to eol and fallback to releaseDate
      if (
        isString(cycleItem.eol) &&
        (isString(cycleItem.support) || cycleItem.releaseDate)
      ) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-eol`,
          content: 'EoL',
          title: 'EoL',
          group: cycleItem.cycle,
          start: isString(cycleItem.support)
            ? (cycleItem.support as string)
            : cycleItem.releaseDate,
          end: cycleItem.eol as string,
          className: getDateClass(cycleItem.eol as string),
        });
      }
      if (
        isBooleanAnd(cycleItem.eol, true) &&
        (isString(cycleItem.support) || cycleItem.releaseDate)
      ) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-eol`,
          content: 'EoL',
          title: 'EoL',
          group: cycleItem.cycle,
          start: isString(cycleItem.support)
            ? (cycleItem.support as string)
            : cycleItem.releaseDate,
          end: dateNow,
          className: 'dateOk',
        });
      }

      // Span eol to extendedSupport and fallback to releaseDate
      if (
        isString(cycleItem.extendedSupport) &&
        (isString(cycleItem.eol) || cycleItem.releaseDate)
      ) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-extendedSupport`,
          content: 'Extended support',
          title: 'Extended support',
          group: cycleItem.cycle,
          start: isString(cycleItem.eol)
            ? (cycleItem.eol as string)
            : cycleItem.releaseDate,
          end: cycleItem.extendedSupport as string,
          className: getDateClass(cycleItem.extendedSupport as string),
        });
      }
      if (
        isBooleanAnd(cycleItem.extendedSupport, true) &&
        (isString(cycleItem.eol) || cycleItem.releaseDate)
      ) {
        itemAdded = true;
        dataItems.push({
          id: `${index}-extendedSupport`,
          content: 'Extended support',
          title: 'Extended support',
          group: cycleItem.cycle,
          start: isString(cycleItem.eol)
            ? (cycleItem.eol as string)
            : cycleItem.releaseDate,
          end: dateNow,
          className: 'dateOk',
        });
      }

      // If no span was added
      if (!itemAdded) {
        dataItems.push({
          id: `${index}-support`,
          content: 'Support',
          title: 'Support',
          group: cycleItem.cycle,
          start: cycleItem.releaseDate,
          end: isBooleanAnd(cycleItem.discontinued, true)
            ? cycleItem.latestReleaseDate ?? cycleItem.releaseDate
            : dateNow,
          className: isBooleanAnd(cycleItem.discontinued, true)
            ? getDateClass(cycleItem.latestReleaseDate ?? cycleItem.releaseDate)
            : 'dateOk',
        });
      }

      return dataItems;
    })
    .flat();
};
