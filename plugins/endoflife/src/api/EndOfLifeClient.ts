import { ResponseError } from '@backstage/errors';
import {
  AnnotationProducts,
  EndOfLifeApi,
  EndOfLifeCycle,
  EndOfLifeProduct,
  EndOfLifeProducts,
} from './types';

/**
 * Options for creating a EndOfLifeClient client.
 *
 * @public
 */
export interface EndOfLifeClientOptions {
  baseUrl: string;
}

/**
 * An implementation of the EndOfLifeApi that talks to https://endoflife.data.
 *
 * @public
 */
export class EndOfLifeClient implements EndOfLifeApi {
  private readonly baseUrl: string;

  constructor(options: EndOfLifeClientOptions) {
    this.baseUrl = options.baseUrl;
  }

  async getProducts(): Promise<EndOfLifeProducts> {
    const res = await fetch(`${this.baseUrl}/api/all.json`, {
      headers: { Accept: `application/json` },
    });

    if (!res.ok) {
      throw await ResponseError.fromResponse(res);
    }

    return (await res.json()) as EndOfLifeProducts;
  }

  async getProduct(product: string): Promise<EndOfLifeProduct> {
    const res = await fetch(
      `${this.baseUrl}/api/${product.toLowerCase()}.json`,
      {
        headers: { Accept: `application/json` },
      },
    );

    if (!res.ok) {
      throw await ResponseError.fromResponse(res);
    }

    const result = (await res.json()) as EndOfLifeProduct;

    return result.map(item => ({
      ...item,
      product,
    }));
  }

  async getCycle(product: string, cycle: string): Promise<EndOfLifeCycle> {
    const res = await fetch(
      `${
        this.baseUrl
      }/api/${product.toLowerCase()}/${cycle.toLowerCase()}.json`,
      {
        headers: { Accept: `application/json` },
      },
    );

    if (!res.ok) {
      throw await ResponseError.fromResponse(res);
    }

    const result = (await res.json()) as EndOfLifeCycle;

    return {
      ...result,
      product,
      cycle,
    };
  }

  getProductLink(product: string): string {
    return `${this.baseUrl}/${product.toLowerCase()}`;
  }

  getLink(): string {
    return this.baseUrl;
  }

  async getAnnotationProducts(
    annotationProducts: AnnotationProducts,
  ): Promise<EndOfLifeProduct> {
    return await Promise.all(
      annotationProducts.map(annotationProduct => {
        if (annotationProduct.product && annotationProduct.cycle) {
          return this.getCycle(
            annotationProduct.product,
            annotationProduct.cycle,
          );
        }
        return this.getProduct(annotationProduct.product);
      }),
    ).then(response => response.flat());
  }
}
