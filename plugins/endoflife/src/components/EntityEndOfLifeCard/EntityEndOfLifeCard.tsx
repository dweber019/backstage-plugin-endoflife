import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MissingAnnotationEmptyState,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { ApiEntity } from '@backstage/catalog-model';
import { appThemeApiRef, useApi } from '@backstage/core-plugin-api';
import { endOfLifeApiRef, EndOfLifeProduct } from '../../api';
import {
  extractEndOfLifeAvailableAnnotation,
  extractProducts,
} from '../../conditions';
import { useAsync } from 'react-use';
import { END_OF_LIFE_ANNOTATION } from '../../constants';
import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
  WarningPanel,
} from '@backstage/core-components';
import { Timeline as Vis } from 'vis-timeline/standalone';
import { DateLegend } from '../DateLegend/DateLegend';
import {
  calculateMaxTime,
  calculateMinTime,
  calculateTimelineGroups,
  calculateTimelineItems,
} from './helper';
import './EntityEndOfLifeCard.css';
import { Grid, IconButton, Tooltip } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { HeightWidthType } from 'vis-timeline';

export type EntityEndOfLifeCardProps = {
  maxHeight?: HeightWidthType;
};

export const EntityEndOfLifeCard = ({
  maxHeight = 400,
}: EntityEndOfLifeCardProps) => {
  const { entity } = useEntity<ApiEntity>();
  const endOfLifeApi = useApi(endOfLifeApiRef);
  const appThemeApi = useApi(appThemeApiRef);
  const productsAnnotation = extractEndOfLifeAvailableAnnotation(entity);

  const { products, productsWithoutVersion } = useMemo(() => {
    if (!productsAnnotation) return {};
    return {
      products: extractProducts(productsAnnotation),
      productsWithoutVersion: extractProducts(productsAnnotation)
        .map(item => item.product)
        .join(', '),
    };
  }, [productsAnnotation]);

  const { value, loading, error } = useAsync(async () => {
    if (!products) return [] as EndOfLifeProduct;
    return endOfLifeApi.getAnnotationProducts(products);
  }, [products]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Vis | null>(null);

  const initTimeline = useCallback(() => {
    if (!containerRef.current) return;
    if (!value) return;
    if (timelineRef.current) return;
    timelineRef.current = new Vis(
      containerRef.current,
      calculateTimelineItems(value),
      calculateTimelineGroups(value),
      {
        orientation: 'top',
        maxHeight,
        verticalScroll: true,
        stack: false,
        min: calculateMinTime(value),
        max: calculateMaxTime(value),
        zoomKey: 'ctrlKey',
      },
    );
  }, [value, containerRef, maxHeight]);

  useEffect(() => {
    initTimeline();
    return () => {
      timelineRef.current?.destroy();
      timelineRef.current = null;
    };
  }, [containerRef, value, initTimeline]);

  if (productsAnnotation === undefined) {
    return (
      <MissingAnnotationEmptyState
        annotation={END_OF_LIFE_ANNOTATION}
        readMoreUrl="https://github.com/dweber019/backstage-plugin-endoflife"
      />
    );
  }
  if (loading) {
    return <Progress />;
  }
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }
  if (!value || !products) {
    return (
      <WarningPanel
        title={`Missing end of life data for products ${productsWithoutVersion}`}
      />
    );
  }

  return (
    <InfoCard
      title={
        <Grid container justifyContent="space-between" alignContent="center">
          <Grid item>{`End of life for ${productsWithoutVersion}`}</Grid>
          <Grid item>
            <Tooltip
              title={
                <div style={{ paddingTop: '8px' }}>
                  <DateLegend />
                </div>
              }
            >
              <IconButton style={{ padding: 0 }}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      }
      deepLink={{
        title: `View more for ${productsWithoutVersion}`,
        link:
          products.length === 1
            ? endOfLifeApi.getProductLink(products[0].product)
            : endOfLifeApi.getLink(),
      }}
      noPadding
    >
      <div
        className={`vis-${appThemeApi.getActiveThemeId()}`}
        ref={containerRef}
      />
    </InfoCard>
  );
};
