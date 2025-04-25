import type {
  RunInput,
  FunctionRunResult,
  CartOperation,
  CartLineInput,
  MergeOperation
} from "../generated/api";

let bundles: {[key: string]: MergeOperation} = {}

function getBundleById(bundleId: string) {
  if (!bundles[bundleId]) {
    bundles[bundleId] = {
      attributes: [],
      cartLines: [],
      parentVariantId: '',
      title: '',
    }
  }
  return bundles[bundleId]
}

function buildCustomizerBundle(line) {
  let bundle = getBundleById(line.bundleId?.value)
  bundle.cartLines.push({
    "cartLineId": line.id,
    "quantity": line.quantity
  })
  if (!line.merchandise.sku.match(/(leg|fabric|leather|base)/)) {
    Object.keys(line).forEach(lineKey => {
      if (lineKey.includes('a_') && line[lineKey]) {
        bundle.attributes?.push({
          key: line[lineKey].key,
          value: line[lineKey].value
        })
      }
    })
    bundle.parentVariantId = line.merchandise.id
    bundle.title = `Your ${line.merchandise.product.title}`
  }
}

function buildSamplesBundle(line) {
  let bundle = getBundleById(line.samplesBundleId?.value)
  bundle.cartLines.push({
    "cartLineId": line.id,
    "quantity": line.quantity
  })
  if (!bundle.parentVariantId) {
    bundle.parentVariantId = line.merchandise.id
  }
  bundle.title = `Your Sample Kit`
  bundle.image = {
    url: `https://cdn.shopify.com/s/files/1/2793/9882/files/sample-kit-bundle-new.jpg`
  }
}

export function run(input: RunInput | any): FunctionRunResult {

  input.cart.lines.forEach(line => {
    if (line.bundleId?.value) {
      buildCustomizerBundle(line)
    }
    if (line.samplesBundleId?.value) {
      buildSamplesBundle(line)
    }
  })

  let operations: Array<CartOperation> = []
  Object.keys(bundles).forEach(bundleKey => {
    let bundleItem = { ...bundles[bundleKey] }
    const minQty = bundleItem.cartLines.reduce((a, b) => a.quantity < b.quantity ? a : b).quantity
    bundleItem.cartLines.forEach((cartLine: CartLineInput) => {
      cartLine.quantity = Math.floor(cartLine.quantity / minQty)
    })
    operations.push({
      merge: bundleItem
    })
  });

  return { operations }

};