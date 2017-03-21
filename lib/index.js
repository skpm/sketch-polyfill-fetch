/* globals NSHTTPURLResponse NSString NSASCIIStringEncoding MOPointer NSJSONSerialization coscript NSURL NSMutableURLRequest NSMutableData NSURLConnection */
var MochaJSDelegate = require('mocha-js-delegate')

function response (httpResponse, data) {
  const keys = []
  const all = []
  const headers = {}
  let header

  for (var i = 0; i < httpResponse.allHeaderFields().allKeys().length; i++) {
    const key = httpResponse.allHeaderFields().allKeys()[i].toLowerCase()
    const value = httpResponse.allHeaderFields()[key]
    keys.push(key)
    all.push([key, value])
    header = headers[key]
    headers[key] = header ? `${header},${value}` : value
  }

  return {
    ok: (httpResponse.statusCode() / 200 | 0) == 1, // 200-399
    status: httpResponse.statusCode(),
    statusText: NSHTTPURLResponse.localizedStringForStatusCode(httpResponse.statusCode()),
    url: httpResponse.URL(),
    clone: response.bind(this, httpResponse, data),
    text () {
      return new Promise((resolve, reject) => {
        const str = NSString.alloc().initWithData_encoding(data, NSASCIIStringEncoding)
        if (str) {
          resolve(str)
        } else {
          reject(new Error("Couldn't parse body"))
        }
      })
    },
    json () {
      return new Promise((resolve, reject) => {
        const err = MOPointer.alloc().initWithValue(null)
        const obj = NSJSONSerialization.JSONObjectWithData_options_error(data, 0, err)
        if (obj) {
          resolve(obj)
        } else {
          reject(err.value())
        }
      })
    },
    xml () {
      // TODO https://developer.apple.com/reference/foundation/nsxmlparser
      return Promise.reject('not implemented yet')
    },
    blob () {
      return Promise.resolve(data)
    },
    headers: {
      keys: () => keys,
      entries: () => all,
      get: n => headers[n.toLowerCase()],
      has: n => n.toLowerCase() in headers
    }
  }
}

function fetch (urlString, options) {
  options = options || {}
  coscript.setShouldKeepAround(true)
  return new Promise((resolve, reject) => {
    const url = NSURL.alloc().initWithString_(urlString)
    const request = NSMutableURLRequest.requestWithURL_(url)
    request.setHTTPMethod(options.method || 'GET')

    for (let i in options.headers) {
      request.setValue_forHTTPHeaderField(options.headers[i], i)
    }

    if (options.body) {
      request.setHTTPBody(data)
    }

    const data = NSMutableData.alloc().init()
    let httpResponse

    const connectionDelegate = new MochaJSDelegate({
      'connectionDidFinishLoading:' (connection) {
        coscript.setShouldKeepAround(false)
        return resolve(response(httpResponse, data))
      },
      'connection:didReceiveResponse:' (connection, _httpResponse) {
        httpResponse = _httpResponse
      },
      'connection:didFailWithError:' (connection, error) {
        coscript.setShouldKeepAround(false)
        return reject(error)
      },
      'connection:didReceiveData:' (connection, _data) {
        data.appendData(_data)
      }
    })

    NSURLConnection.alloc().initWithRequest_delegate_startImmediately(request, connectionDelegate.getClassInstance(), true)
  })
}


// polyfill the global object
const commonjsGlobal = typeof global !== 'undefined'
  ? global
  : this

commonjsGlobal.fetch = commonjsGlobal.fetch || fetch

module.exports = fetch
