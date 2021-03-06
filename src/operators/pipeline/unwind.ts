import { cloneDeep, isArray, isEmpty, isString, resolve, setValue, removeValue } from '../../util'
import { Lazy, Iterator } from '../../lazy'
import { Options } from '../../core'

/**
 * Takes an array of documents and returns them as a stream of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
export function $unwind(collection: Iterator, expr: any, options: Options): Iterator {
  if (isString(expr)) expr = { path: expr }

  let field = expr.path.substr(1)
  let includeArrayIndex = expr.includeArrayIndex || false
  let preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false

  let format = (o: object, i: number) => {
    if (includeArrayIndex !== false) o[includeArrayIndex] = i
    return o
  }

  let value: any

  return Lazy(() => {
    while (true) {
      // take from lazy sequence if available
      if (value instanceof Iterator) {
        let tmp = value.next()
        if (!tmp.done) return tmp
      }

      // fetch next object
      let obj = collection.next()
      if (obj.done) return obj

      // unwrap value
      obj = obj.value

      // get the value of the field to unwind
      value = resolve(obj, field)

      // throw error if value is not an array???
      if (isArray(value)) {
        if (value.length === 0 && preserveNullAndEmptyArrays === true) {
          value = null // reset unwind value
          let tmp = cloneDeep(obj)
          removeValue(tmp, field)
          return { value: format(tmp, null), done: false }
        } else {
          // construct a lazy sequence for elements per value
          value = Lazy(value).map((item, i) => {
            let tmp = cloneDeep(obj)
            setValue(tmp, field, item)
            return format(tmp, i)
          })
        }
      } else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
        let tmp = cloneDeep(obj)
        return { value: format(tmp, null), done: false }
      }
    }
  })
}