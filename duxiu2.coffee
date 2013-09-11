#!/usr/bin/env coffee
# File: duxiu2.coffee
# Date: Thu Sep 12 00:00:45 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

sprintf = require './sprintf'
request = require 'request'
mime = require 'mime'
fs = require 'fs'

args = process.argv.splice(2)

url = args[0]
savepath = args[1]

startPos = url.match(/www/).index
endPos = url.indexOf('/', startPos)
host = url.substr(startPos, endPos - startPos)

console.log("host: " + host)
console.log("url: " + url)

option =
  url: url
  headers:
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accpet-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3'
    'Host': host
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.21 (KHTML, like Gecko) Chrome/25.0.1354.0 Safari/537.21'

download = (options, n) ->
  fname = savepath + '/' + sprintf("%03d", n) + '.png'
  request options, (err, res, body) ->
    if err or not body or body.length == 0 or body == "undefined"
      if not err
        console.log "empty body! retrying.."
      console.log("---NetWork Error!---")
      console.log(err)
      console.log("retrying " + n)
      download options, n
      return

    fs.writeFile fname, body, (err) ->
      if err
        console.log("Error: " + err)
      type = mime.lookup(fname)
      if type.indexOf('image') == -1
        console.log('retrying ' + n)
        download options, n
      console.log("finish " + n)


preDownload = (options, n) ->
  request options, (err, res, body) ->
    opt =
      url: res.headers['location']
      headers:
        'Referer': url
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.21 (KHTML, like Gecko) Chrome/25.0.1354.0 Safari/537.21'
      encoding: null

    download opt, n

request option, (err, res, body) ->
  cookie = res.headers['set-cookie'][0].split(' ')[0]
  console.log(cookie)

  startPos = body.match(/var str = "/).index
  startPos += 11
  endPos = body.indexOf(';', startPos) - 1
  picurl = body.substr(startPos, endPos - startPos)
  console.log("var str = " + picurl)

  startPos = body.match(/var spage = /).index
  startPos += 12
  endPos = body.indexOf(',', startPos)
  startPage = body.substr(startPos, endPos - startPos)
  startPage = parseInt(startPage)

  startPos = body.match(/, epage = /).index
  startPos += 10
  endPos = body.indexOf(';', startPos)
  endPage = body.substr(startPos, endPos - startPos)
  endPage = parseInt(endPage)
  console.log("Page: " + startPage + " " + endPage)

  downurl = 'http://' + host + '/n/' + picurl
  console.log(downurl)

  for x in [startPage..endPage]
    options =
      url: downurl + sprintf("%06d", x) + "?.&uf=ssr&zoom=0"
      headers:
        'Cookie': cookie
        'Host': host
        'Referer': url
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.21 (KHTML, like Gecko) Chrome/25.0.1354.0 Safari/537.21'
      encoding: null
      followRedirect: false

    preDownload options, x
