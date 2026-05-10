import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sendKafkaEvent } from "../actions/track-user";
import {
  buildCartLineId,
  normalizeCartItemSelectedOptions,
} from "../utils/cartVariant";

export type SelectedOptions = {
  color?: string;
  size?: string;
};

type WishlistProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shopId: string;
  colors?: string[];
  sizes?: string[];
};

type CartProduct = WishlistProduct & {
  quantity?: number;
  cartLineId?: string;
  selectedOptions?: SelectedOptions;
};

type Store = {
  cart: CartProduct[];
  wishlist: WishlistProduct[];
  addToCart: (
    product: CartProduct,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
  removeFromCart: (
    cartLineId: string,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
  clearCart: () => void;

  addToWishlist: (
    product: WishlistProduct,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
  removeFromWishlist: (
    id: string,
    user: any,
    location: any,
    deviceInfo: any,
  ) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      addToCart: (product, user, location, deviceInfo) => {
        const opts = normalizeCartItemSelectedOptions(product.selectedOptions);
        const cartLineId = buildCartLineId(product.id, opts);
        const qty = product.quantity ?? 1;

        set((state) => {
          const idx = state.cart.findIndex(
            (item) =>
              (item.cartLineId ??
                buildCartLineId(
                  item.id,
                  normalizeCartItemSelectedOptions(item.selectedOptions),
                )) === cartLineId,
          );

          if (idx !== -1) {
            return {
              cart: state.cart.map((item, i) =>
                i === idx
                  ? {
                      ...item,
                      quantity: (item.quantity ?? 1) + qty,
                      selectedOptions: opts,
                      cartLineId,
                    }
                  : item,
              ),
            };
          }

          return {
            cart: [
              ...state.cart,
              {
                ...product,
                quantity: qty,
                selectedOptions: opts,
                cartLineId,
              },
            ],
          };
        });

        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: "add_to_cart",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      removeFromCart: (cartLineId, user, location, deviceInfo) => {
        const removeProduct = get().cart.find(
          (item) =>
            (item.cartLineId ??
              buildCartLineId(
                item.id,
                normalizeCartItemSelectedOptions(item.selectedOptions),
              )) === cartLineId,
        );

        set((state) => ({
          cart: state.cart?.filter(
            (item) =>
              (item.cartLineId ??
                buildCartLineId(
                  item.id,
                  normalizeCartItemSelectedOptions(item.selectedOptions),
                )) !== cartLineId,
          ),
        }));

        if (user?.id && location && deviceInfo && removeProduct) {
          sendKafkaEvent({
            userId: user?.id,
            productId: removeProduct?.id,
            shopId: removeProduct?.shopId,
            action: "remove_from_cart",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      clearCart: () => {
        set({ cart: [] });
      },

      addToWishlist: (product, user, location, deviceInfo) => {
        set((state) => {
          if (state.wishlist.find((item) => item.id === product.id))
            return state;
          return { wishlist: [...state.wishlist, product] };
        });

        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: "add_to_wishlist",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      removeFromWishlist: (id, user, location, deviceInfo) => {
        const removeProduct = get().wishlist.find((item) => item.id === id);

        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        }));

        if (user?.id && location && deviceInfo && removeProduct) {
          sendKafkaEvent({
            userId: user?.id,
            productId: removeProduct?.id,
            shopId: removeProduct?.shopId,
            action: "remove_from_wishlist",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },
    }),
    {
      name: "store-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
