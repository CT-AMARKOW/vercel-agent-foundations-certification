import { tool } from "ai";
import { z } from "zod";
import { ApiRequestError, createReturn, getCategories, getOrder, getProductById, getProducts, getProductStock, preauthorizeRefund, notifyReturnInProcess } from "@/lib/api";

export const searchProducts = tool({
  description: `Search the Vercel swag store product catalog. This is the broad lookup: use it whenever the user asks about products, what the store sells, or wants recommendations, and to find the id of an item the user names (e.g. "the black hoodie"). Optionally narrow results to a single category. Once you have the id of the specific item the user cares about, call getProductDetails for the full details.`,
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        `Optional free-text search terms describing what the user is looking for, e.g. 'hoodie' or 'water bottle'.`,
      ),
    category: z
      .string()
      .optional()
      .describe(
        `Optional category slug to filter results. Only set this when the user clearly wants a specific category. Use the getAllCategories tool to get all valid categories.`,
      ),
  }),
  execute: async ({ query, category }) => {
    try {
      const products = await getProducts({
        search: query,
        category,
        limit: 10,
      });
      return {
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images[0],
          price: p.price,
          currency: p.currency,
          category: p.category,
          description: p.description,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, products: [], error: message };
    }
  },
});

export const getProductDetails = tool({
  description: `Get the full details and live stock for ONE specific product. Use this whenever the user asks about a particular item (e.g. "Tell me more about the black hoodie", "Is the mug in stock?"). Requires a product id or slug: if you only have a name, call searchProducts first to find it. Do not use this for broad browsing.`,
  inputSchema: z.object({
    idOrSlug: z
      .string()
      .describe(
        `The product id or slug, taken from a searchProducts result.`,
      ),
  }),
  execute: async ({ idOrSlug }) => {
    try {
      const [product, stock] = await Promise.all([
        getProductById(idOrSlug),
        getProductStock(idOrSlug),
      ]);
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        tags: product.tags,
        featured: product.featured,
        images: product.images,
        // sizes: product.sizes, // not on the Product type yet
        stock: stock.stock,
        inStock: stock.inStock,
        lowStock: stock.lowStock,
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { error: message };
    }
  },
});

export const getAllCategories = tool({
  description: `List every product category available in the Vercel swag store, along with the number of products in each. Use this when the user asks what categories exist, what kinds of products are sold, or wants to browse the store at a high level.`,
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const categories = await getCategories();
      return {
        count: categories.length,
        categories: categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          productCount: c.productCount,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, categories: [], error: message };
    }
  },
});

export const returnOrder = tool({
  description: `File a return for one of the user's past orders. The user must provide an order ID and a reason. Example order IDs: 11111, 22222, 33333.`,
  inputSchema: z.object({
    orderId: z
      .string()
      .describe("The order ID the user wants to return."),
    reason: z
      .string()
      .min(10)
      .max(500)
      .describe("Why the user is returning the order."),
  }),
  execute: async ({ orderId, reason }) => {
    try {
      const order = await getOrder(orderId);
      await notifyReturnInProcess(orderId);
      await preauthorizeRefund(orderId);
      const filed = await createReturn({
        orderId: order.id,
        items: order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        reason,
      });
      return { returnId: filed.id, status: filed.status };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { error: message };
    }
  },
});