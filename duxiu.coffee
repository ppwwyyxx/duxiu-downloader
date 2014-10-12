#!/usr/bin/env coffee
# File: duxiu.coffee
# Date: Wed Mar 12 21:02:04 2014 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

sprintf = require './sprintf'
request = require 'request'
fs = require 'fs'
spawn = require('child_process').spawn

args = process.argv.splice(2)

url = args[0]
savepath = args[1]
if not savepath
  console.log 'Please enter savepath'

startPage = endPage = 0
if args[2] and args[3]
  startPage = Number args[2]
  endPage = Number args[3]

# to manually download sth
cookie = ""
picurl = ""
give_up_list = []


startPos = url.match(/www/).index
host = url.substr(startPos, url.indexOf('/', startPos) - startPos)

console.log("\nhost: " + host)
console.log("url: " + url)

download = (options, n, depth = 0) ->
  fname = savepath + '/' + sprintf("%03d", n) + '.png'
  request options, (err, res, body) ->
    if err or not body or body.length == 0 or body == "undefined"
      if not err
        console.log "empty body! retrying.."
      console.log("---NetWork Error!---")
      console.log(err)
      console.log("retrying " + n)
      download options, n, depth
      return

    fs.writeFile fname, body, (err) ->
      type = spawn('file', [fname])
      type.stdout.on 'data', (data) ->
        data = String data
        if data.indexOf('image') == -1
          if depth < 3
            console.log 'Type not match! Retrying ' + n
            download options, n, depth + 1
          else
            console.log 'Type mismatches, give up:::--->' + n
            give_up_list.push(n)
        else
          console.log("finish " + n)


preDownload = (options, n) ->
  request options, (err, res, body) ->
    if not res.headers['location']
      console.log "Error in getting addr! return header is:"
      console.log res.headers
      return

    opt =
      url: res.headers['location']
      encoding: null

    download opt, n

option =
  url: url
  headers:
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accpet-Language': 'en-US,en;q=0.8'
    'Connection': 'keep-alive'
    'Host': host
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.66 Safari/537.36'

request option, (err, res, body) ->
  if not cookie
    for i in res.headers['set-cookie']
      cookie += i.split(' ')[0] + ' '
  console.log("Cookie:" + cookie)

  startPos = body.match(/var str = "/).index + 11
  endPos = body.indexOf(';', startPos) - 1
  if not picurl
    picurl = body.substr(startPos, endPos - startPos)
  console.log("Get picurl: var str = " + picurl)

  if not startPage and not endPage
    startPos = body.match(/var spage = /).index + 12
    endPos = body.indexOf(',', startPos)
    startPage = body.substr(startPos, endPos - startPos)
    startPage = parseInt(startPage)

    startPos = body.match(/, epage = /).index + 10
    endPos = body.indexOf(';', startPos)
    endPage = body.substr(startPos, endPos - startPos)
    endPage = parseInt(endPage)

  console.log("Page: " + startPage + " " + endPage)

  downurl = 'http://' + host + '/n/' + picurl
  console.log("Downurl: " + downurl)

  for x in [startPage..endPage]
    options =
      url: downurl + sprintf("%06d", x) + "?.&uf=ssr&zoom=2"
      headers:
        'Accept': 'image/webp,*/*;q=0.8'
        'Accpet-Encoding': 'gzip,deflate,sdch'
        'Connection': 'keep-alive'
        'Cookie': cookie
        'Host': host
        'Referer': url
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.66 Safari/537.36'
      encoding: null
      followRedirect: false

    preDownload options, x
