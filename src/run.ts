import type {
  RunInput,
  FunctionRunResult,
  CartLineInput,
  AttributeOutput
} from "../generated/api";

export function run(input: RunInput | any): FunctionRunResult {
  let bundles: { [key: string]: {
    attributes: AttributeOutput[]
    cartLines: CartLineInput[]
    parentVariantId: any
    title: string
  }} = {}
  input.cart.lines.forEach(line => {
    if (line.bundleId?.value) {
      const bundleId = line.bundleId?.value
      if (!bundles[bundleId]) {
        bundles[bundleId] = {
          attributes: [],
          cartLines: [],
          parentVariantId: '',
          title: ''
        }
      }
      bundles[bundleId].cartLines.push({
        "cartLineId": line.id,
        "quantity": line.quantity
      })
      if (!line.merchandise.sku.match(/(leg|fabric|leather|base)/)) {
        Object.keys(line).forEach(lineKey => {
          if (lineKey.includes('a_') && line[lineKey]) {
            bundles[bundleId].attributes.push({
              key: line[lineKey].key,
              value: line[lineKey].value
            })
          }
        })
        bundles[bundleId].parentVariantId = line.merchandise.id
        bundles[bundleId].title = `Your ${line.merchandise.product.title}`
      }
    }
  })
  return { operations: Object.keys(bundles).map(bundleKey => {
    return {
      merge: bundles[bundleKey]
    }
  }) };
};