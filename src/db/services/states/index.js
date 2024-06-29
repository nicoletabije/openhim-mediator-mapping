'use strict'

const StateModel = require('../../models/states')

exports.createEndpointState = state => {
  const stateObject = new StateModel(state)
  return stateObject.save({checkKeys: false})
}

const createFilterObject = (
  endpointId,
  networkErrorFilters,
  httpStatusFilters
) => {
  const searchConditions = {
    _endpointReference: endpointId
  }

  if (networkErrorFilters === 'include') {
    searchConditions.lookupNetworkError = true
  } else if (networkErrorFilters === 'exclude') {
    searchConditions.lookupNetworkError = false
  }

  if (httpStatusFilters.length > 0 && !httpStatusFilters.includes('*')) {
    const mongoFilterArray = []

    for (const pattern of httpStatusFilters) {
      const validRange = pattern.match(/\d+?(?=xx)/g)
      if (validRange) {
        // We only store one http status for an endpoint.
        // Generally the larger the status codes the more important. i.e 500 > 200
        // Therefore when multiple lookup requests are made only the largest status code is stored.
        mongoFilterArray.push({
          lookupHttpStatus: {
            $gte: Number(validRange[0] * 100),
            $lt: (Number(validRange[0]) + 1) * 100
          }
        })
      } else if (pattern.match(/^[1-5]\d\d$/)) {
        mongoFilterArray.push({
          lookupHttpStatus: Number(pattern)
        })
      } else {
        throw new Error('Invalid HTTP Status filter')
      }
    }

    searchConditions.$or = mongoFilterArray
  }

  return searchConditions
}

exports.readLatestEndpointStateById = (
  endpointId,
  networkErrorFilters,
  httpStatusFilters
) => {
  return StateModel.findOne(
    createFilterObject(endpointId, networkErrorFilters, httpStatusFilters),
    {},
    {sort: {createdAt: -1}}
  ).exec()
}
