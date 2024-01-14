import { Entity } from '@backstage/catalog-model';
import { END_OF_LIFE_ANNOTATION } from './constants';
import { AnnotationProducts } from './api';

/**
 * @public
 */
export function isEndOfLifeAvailable(entity: Entity): boolean {
  return Boolean(extractEndOfLifeAvailableAnnotation(entity));
}

/**
 * @public
 */
export function extractEndOfLifeAvailableAnnotation(
  entity: Entity,
): string | undefined {
  return entity.metadata.annotations?.[END_OF_LIFE_ANNOTATION];
}

/**
 * @public
 */
export function extractProducts(annotation: string): AnnotationProducts {
  return annotation.split(',').map(product => {
    const productWithCycle = product.split('@');
    return {
      product: productWithCycle[0],
      cycle: productWithCycle.length > 1 ? productWithCycle[1] : undefined,
    };
  });
}
