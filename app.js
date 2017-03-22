'use strict'

let reekoh = require('reekoh')
let _plugin = new reekoh.plugins.Stream()
let async = require('async')
let Client = require('ftp')
let ftpClient = new Client()

let sync = function (path, callback) {
  ftpClient.list(path, (err, items) => {
    console.log(items)
    if (err) return _plugin.logException(err)

    if (_plugin.config.deviceId === 'Folder Name' && path !== _plugin.config.path) {
      let deviceId = path.substr(path.lastIndexOf('/') + 1)

      _plugin.requestDeviceInfo(deviceId)
        .then(() => {
          async.each(items, (item, done) => {
            if (item.type === 'd' && _plugin.config.recursive) sync(`${path}/${item.name}`, done)
            else if (item.type === '-') {
              ftpClient.get(`${path}/${item.name}`, (err, stream) => {
                if (err) return _plugin.logException(err)

                let contents = ''

                stream.once('error', function (err) {
                  _plugin.logException(err)
                  stream.removeAllListeners()
                  done()
                })

                stream.on('data', (chunk) => {
                  contents += chunk
                }).on('end', function () {
                  console.log('File', item.name)
                  console.log('Contents', contents)

                  _plugin.pipe(JSON.stringify({
                    data: contents
                  }))
                    .then(() => {
                      _plugin.log(JSON.stringify({
                        'file_read': deviceId
                      }))

                      stream.removeAllListeners()
                      done()
                    })
                    .catch((err) => {
                      _plugin.logException(err)
                    })
                })
              })
            } else done()
          }, callback)
        })
        .catch((err) => {
          _plugin.logException(err)
        })
    } else {
      async.each(items, (item, done) => {
        if (item.type === 'd' && path === _plugin.config.path) sync(`${path}/${item.name}`, done)
        else if (item.type === 'd' && _plugin.config.recursive) sync(`${path}/${item.name}`, done)
        else if (item.type === '-') {
          _plugin.requestDeviceInfo(item.name)
            .then(() => {
              ftpClient.get(`${path}/${item.name}`, (err, stream) => {
                if (err) return _plugin.logException(err)

                let contents = ''

                stream.once('error', (err) => {
                  _plugin.logException(err)
                  stream.removeAllListeners()
                  done()
                })

                stream.on('data', (chunk) => {
                  contents += chunk
                }).on('end', () => {
                  console.log('File', item.name)
                  console.log('Contents', contents)

                  _plugin.pipe(JSON.stringify({
                    data: contents
                  }))
                    .then(() => {
                      _plugin.log(JSON.stringify({
                        'file_read': item.name
                      }))

                      stream.removeAllListeners()
                      done()
                    })
                    .catch((err) => {
                      _plugin.logException(err)
                    })
                })
              })
            })
            .catch((err) => {
              _plugin.logException(err)
            })
        } else done()
      }, callback)
    }
  })
}

_plugin.on('sync', function () {
  sync(_plugin.config.path, () => {
    _plugin.log('FTP Stream sync executed.')
  })
})

_plugin.once('ready', () => {
  _plugin.config.port = _plugin.config.port || 21
  _plugin.config.path = _plugin.config.path || '/'
  _plugin.config.deviceId = _plugin.config.deviceId || 'Folder Name'

  ftpClient.on('error', function (err) {
    console.error(err)
    _plugin.logException(err)

    ftpClient.destroy()

    setTimeout(() => {
      process.exit(1)
    }, 10000)
  })

  ftpClient.on('ready', function () {
    _plugin.log('FTP Stream has been initialized.')
    _plugin.emit('init')
  })

  ftpClient.connect(_plugin.config)
})

module.exports = _plugin
