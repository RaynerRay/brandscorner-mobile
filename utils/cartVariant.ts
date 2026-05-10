export type SelectedOptions = {
  color?: string;
  size?: string;
};

export function buildCartLineId(
  productId: string,
  selected?: SelectedOptions | null,
): string {
  const color = (selected?.color ?? "").trim();
  const size = (selected?.size ?? "").trim();
  return `${productId}\u001f${color}\u001f${size}`;
}

export function defaultVariantSelection(product: {
  colors?: string[] | null;
  sizes?: string[] | null;
}): SelectedOptions {
  return {
    color: product.colors?.length ? product.colors[0] : "",
    size: product.sizes?.length ? product.sizes[0] : "",
  };
}

export function normalizeCartItemSelectedOptions(
  item: SelectedOptions | undefined | null,
): SelectedOptions {
  return {
    color: (item?.color ?? "").trim(),
    size: (item?.size ?? "").trim(),
  };
}

export function getCartLineKey(item: {
  id: string;
  cartLineId?: string;
  selectedOptions?: SelectedOptions;
}): string {
  return (
    item.cartLineId ??
    buildCartLineId(item.id, normalizeCartItemSelectedOptions(item.selectedOptions))
  );
}
