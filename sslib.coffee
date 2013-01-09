# File: sslib.coffee
# Date: Wed Jan 09 23:47:38 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>
#
# usage:

sprintf = require './sprintf'
request = require 'request'
fs = require 'fs'

args = process.argv.splice(2)

addr = args[0]
page = args[1]
savepath = args[2]

download = (n) ->
  realn = sprintf("%03d", n)
  fname = savepath + '/' + realn + '.jpg'
  options =
    url: addr + '000' + realn + '?.&uf=ssr&zoom=0'
    encoding: null
  request options, (err, res, body) ->
    fs.writeFile fname, body, (err) ->
      if err
        throw err
      console.log("finish" + realn)

for n in [1..page]
  download n
