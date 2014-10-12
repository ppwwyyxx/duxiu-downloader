#!/usr/bin/env python2
# -*- coding: UTF-8 -*-
# File: duxiu.py
# Date: Sun Oct 12 17:18:57 2014 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

import requests
from bs4 import BeautifulSoup
import sys
import re
import pickle
from urlparse import urlparse
import argparse
from functools import partial
from multiprocessing import Pool
from subprocess import Popen, PIPE

global dir

REGEX_PAT = re.compile(
'''var str = "(?P<picurl>[^"]*)";.*
.*var spage = (?P<startPage>[0-9]*), epage = (?P<endPage>[0-9]*);''',
    re.UNICODE)

def check_img(fname):
    p = Popen(['file', fname], stdout=PIPE, stderr=PIPE)
    out, err = p.communicate()
    if 'image' not in out:
        print "Wrong file format!! -- {0}".format(out)
        return False
    return True

def downloadPage(page_num, depth=0):
    """ return a status"""
    fail = False
    tail = '{0:06d}?.&uf=ssr'.format(page_num)
    req_url = downurl + tail
    try:
        r = sess.get(req_url)
        image = r.content
    except:
        fail = True
    else:
        fname = dir + '/{0:03d}.png'.format(page_num)
        with open(fname, 'wb') as f:
            f.write(image)
        print "Finish ", page_num
        if not check_img(fname):
            fail = True

    if fail:
        if depth > 3:
            print "Give up", page_num
            return False
        else:
            print "Retry", page_num
            return downloadPage(page_num, depth + 1)

def main():
    global dir
    global sess
    url = sys.argv[1]
    dir = sys.argv[2]

    host = urlparse(url).netloc

    sess = requests.Session()
    try:
        r = sess.get(url)
    except Exception as e:
        print "Network error!"
        print str(e)
        return
    html = r.text
    host = urlparse(r.url).netloc
    htmltext = str(html.encode('utf-8'))
    matches = REGEX_PAT.search(htmltext).groupdict()
    picUrl = matches['picurl']
    startPage, endPage = matches['startPage'], matches['endPage']

    startPage = int(startPage)
    endPage = int(endPage)
    pages = range(startPage, endPage + 1)

    if len(sys.argv) > 3:
        pages = eval(sys.argv[3])
        #startPage = int(sys.argv[3])
        #endPage = int(sys.argv[4])

    global downurl
    downurl = 'http://{0}{1}'.format(host, picUrl)
    print "DownUrl: ", downurl
    print "pages: ", pages

    #downloadPage(1)

    pool = Pool(10)
    rst = pool.map(downloadPage, pages)
    print "Failed: ", [x[0] for x in zip(pages, rst) if x[1] == False]

if __name__ == '__main__':
    main()
