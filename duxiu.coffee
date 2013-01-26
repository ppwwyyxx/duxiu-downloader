#!/home/wyx/.local/bin/coffee
# File: duxiu.coffee
# Date: Sat Jan 26 15:42:19 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

sprintf = require './sprintf'
request = require 'request'
mime = require 'mime'
fs = require 'fs'

args = process.argv.splice(2)

referer = args[0]
savepath = args[1]

realurl = referer.replace('DrsPath.do', '/n/drspath.shtml')

startPos = referer.match(/spagenum/).index
startPos += 9
endPos = referer.indexOf('&', startPos)
startPage = referer.substr(startPos, endPos - startPos)
startPage = parseInt(startPage)

startPos = referer.match(/pages/).index
startPos += 6
endPos = referer.indexOf('&', startPos)
pages = referer.substr(startPos, endPos - startPos)
pages = parseInt(pages)
endPage = startPage + pages - 1

console.log(startPage, endPage)

startPos = referer.match(/www/).index
endPos = referer.indexOf('/', startPos)
host = referer.substr(startPos, endPos - startPos)

option =
  url: realurl
  headers:
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accpet-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3'
    'Host': host
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.21 (KHTML, like Gecko) Chrome/25.0.1354.0 Safari/537.21'

download = (options, n) ->
  fname = savepath + '/' + sprintf("%03d", n) + '.jpg'
  request options, (err, res, body) ->
    fs.writeFile fname, body, (err) ->
      if err
        throw err
      type = mime.lookup(fname)
      if type.indexOf('image') == -1
        console.log('retrying ' + n)
        download options, n
      console.log("finish " + n)

request option, (err, res, body) ->
  cookie = res.headers['set-cookie'][0].split(' ')[0]
  console.log(cookie)

  startPos = body.match(/var str = "/).index
  startPos += 11
  endPos = body.indexOf(';', startPos) - 1
  picurl = body.substr(startPos, endPos - startPos)

  url = 'http://' + host + '/n/' + picurl
  console.log(url)

  for n in [startPage..endPage]
    options =
      url: url + sprintf("%06d", n) + "?.&uf=ssr&zoom=0"
      headers:
        'Cookie': cookie
        'Host': host
        'Referer': referer
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.21 (KHTML, like Gecko) Chrome/25.0.1354.0 Safari/537.21'
      encoding: null

    download options, n

