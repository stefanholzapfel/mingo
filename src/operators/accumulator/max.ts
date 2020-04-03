import { $push } from './push'

/**
 * Returns the highest value in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $max(collection: any[], expr: any): any {
  let nums = $push(collection, expr) as number[]
  let n = nums.reduce((acc, n) => n > acc ? n : acc, -Infinity)
  return n === -Infinity ? undefined : n
}