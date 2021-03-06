import { assert, each, isEmpty, keys } from './util'
import { getOperator, OperatorType, Options, createConfig, Config } from './core'
import { Lazy, Iterator, Source } from './lazy'

/**
 * Provides functionality for the mongoDB aggregation pipeline
 *
 * @param pipeline an Array of pipeline operators
 * @param config An optional configuration or options passed from an earlier operator
 * @constructor
 */
export class Aggregator {

  private __pipeline: object[]
  private __options: Options

  constructor(pipeline: object[], config?: Config | Options) {
    this.__pipeline =  pipeline
    let o = config as object
    this.__options = o && o['config'] ? o as Options : { config: config as Config }
    this.__options.config = this.__options.config || createConfig()
  }

  /**
   * Returns an `Lazy` iterator for processing results of pipeline
   *
   * @param {*} collection An array or iterator object
   * @param {Query} query the `Query` object to use as context
   * @returns {Iterator} an iterator object
   */
  stream(collection: Source): Iterator {
    let iterator: Iterator = Lazy(collection)

    if (!isEmpty(this.__pipeline)) {
      // run aggregation pipeline
      each(this.__pipeline, (operator) => {
        let operatorKeys = keys(operator)
        let op = operatorKeys[0]
        let call = getOperator(OperatorType.PIPELINE, op)
        assert(operatorKeys.length === 1 && !!call, `invalid aggregation operator ${op}`)
        iterator = call(iterator, operator[op], this.__options)
      })
    }
    return iterator
  }

  /**
   * Return the results of the aggregation as an array.
   *
   * @param {*} collection
   * @param {*} query
   */
  run(collection: Source): any[] {
    return this.stream(collection).value()
  }
}
