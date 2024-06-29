---
id: state-management
title: State Management
sidebar_label: State Management
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The State Management features within each endpoints allows the implementer to define a set of values to extract from the available data points within each endpoint request

These state properties are saved into the database which can be used by a subsequent request to extract and make use of within the current request.

By default, some system state values are captured on each request. Currently these include:

- Timestamps
  - Start / End timestamps of the main endpoint request
  - Start / End timestamps for each external lookup request that is defined

## How does this work?

When creating a new `endpoint` you can supply a section called `state` to the root of the `endpoint` schema.

This object will contain all the details required for extracting your relevant state property.

There are currently 4 data points that we are able to extract data values from.

- requestBody - Values extracted from the incoming request body
- responseBody - Values extracted outgoing response body
- query - Values extracted from the query parameters
- lookupRequests - Values extracted from the incoming request body

Specify your desired values to be extracted from the various data points that exist so that it can be used in any follow up request that is made

## State Management in practice

The example is just to illustrate how to go about storing state values. These state values can then be used when [constructing the new response payload](transformation.md)

The below state management makes use of the below data points:

- **system.timestamps** - Extract the timestamp of the last time this endpoint was triggered
  - Used to populate the `_since` query parameter for the `lookup1` request
- **requestBody** - Values extracted from the incoming request body
  - Used to extract the `submittedBy`, `organisationId` and `facilityId` from the incoming request payload
- **responseBody** - Values extracted outgoing response body
  - Used to extract the `totals.count` from the response payload
- **query** - Values extracted from the query parameters
  - Used to extract the `page` query parameter from the incoming request
  - Used to populate the `page` query parameter for the `lookup1` request
- **lookupRequests** - Values extracted from the incoming request body
  - Used to extract the `count` from the `lookup1` response payload and the `metrics.queries.count` from the `request1` response payload

<Tabs
  defaultValue="endpoint"
  values={
    [
      { label: 'Endpoint Schema', value: 'endpoint' },
      { label: 'Request', value: 'request' },
      { label: 'Response Payload', value: 'response' },
      { label: 'Lookup Payloads', value: 'lookup' }
    ]
  }
>
<TabItem value="endpoint">

Below is a basic example of the `state` object within the `endpoint` schema

```json {10-30}
{
  "name": "A Sample Endpoint",
  "endpoint": {
    "pattern": "/sample-endpoint"
  },
  "transformation": {
    "input": "JSON",
    "output": "JSON"
  },
  "state": {
    "extract": {
      "requestBody": {
        "organisationId": "organisation[0].facilityId"
      },
      "responseBody": {
        "totalProcessed": "totals.count"
      },
      "query": {
        "pageNumber": "page"
      },
      "lookupRequests": {
        "lookup1": {
          "totalProcessed": "count"
        },
        "request1": {
          "totalProcessed": "metrics.queries.count"
        }
      }
    }
  },
  "requests": {
    "lookup": [
      {
        "id": "lookup1",
        "config": {
          "method": "get",
          "url": "http://localhost/lookup",
          "headers": {
            "Content-Type": "application/json"
          },
          "params": {
             "query": {
                "_since": {
                "path": "state.system.timestamps.lookupRequests.lookup1.requestStart",
                "prefix": null,
                "postfix": null
              },
              "page": {
                "path": "state.query.pageNumber",
                "prefix": null,
                "postfix": null
              }
            }
          }
        }
      }
    ],
    "response": [
      {
        "id": "request1",
        "config": {
          "method": "post",
          "url": "http://localhost/request",
          "headers": {
            "Content-Type": "application/json"
          }
        }
      }
    ]
  }
}
```

</TabItem>
<TabItem value="request">

The sample `state` schema definition shows us how we extract certain data points but without context of the incoming document it makes it a bit harder to understand.

Lets make use of a sample `payload.json` document that will be sent to this endpoint to indicate the data points we will be extracting.

```json
{
  "submittedBy": "e52b5c52-7dd5-4eb3-a5c3-dd9700c649aa",
  "organisation": [
    {
      "organisationId": "bad129c3-fd48-41f3-b074-a9a4a92bb84f",
    }
  ],
  "facility": [
    {
      "facilityId": "a0abcf47-e16b-4247-bac2-b70b783a6641",
    }
  ]
}
```

The sample POST request to this endpoint would look like the below:

```curl
curl -X POST -d "@payload.xml" -H "Content-Type: application/xml" http://localhost:3003/sample-endpoint?page=10
```

</TabItem>
<TabItem value="response">

Main response payload:

```json
{
  "totals": {
    "count": 227
  }
}
```

</TabItem>
<TabItem value="lookup">

Lookup1 response payload:

```json
{
  "count": 20
}
```

request1 response payload:

```json
{
  "metrics": {
    "queries": {
      "count": 45
    }
  }
}
```

</TabItem>
</Tabs>

## Include or Exclude saved states

When using endpoint state we can configure our endpoint to only use saved states if they received a specific http response or no network errors.
This is useful for polling data and ignoring request attempts that failed due to network or server issues.
See below for an example config:

```json
  "state": {
    "config": {
      "networkErrors": "exclude",
      "includeStatuses": ["2xx"]
    },
    "extract": {...}
  }
```

The config above would not read any saved state data where there were network errors or where the https status was not in the 2xx range.
If the latest state in the DB recorded a network error the next chronological state without errors would be returned.
