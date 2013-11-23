#!/usr/bin/env python2
# -*- coding: UTF-8 -*-
# File: bookmark_shift.py
# Date: Sat Nov 23 15:09:38 2013 +0800
# Author: Yuxin Wu <ppwwyyxxc@gmail.com>

import re
from HTMLParser import HTMLParser
parser = HTMLParser()

class BookmarkItem(object):
    def __init__(self, level, title, page):
        self.level = int(level)
        self.title = title
        self.page = int(page)

class Bookmarks(object):
    def __init__(self):
        self.data = []

    def from_pdftk_dump(self, fname):
        """ get bookmark from dumps of pdftk"""
        with open(fname, "r") as f:
            lines = f.readlines()
            lines = filter(lambda l: l.startswith("Bookmark"), lines)
            all_data = ''.join(lines)
            pattern = re.compile('BookmarkBegin.*?BookmarkPageNumber.*?\n',
                                 re.DOTALL)
            m = pattern.findall(all_data)
            for bmk in m:
                bmk = bmk.rstrip().split('\n')
                title = ' '.join(bmk[1].split(' ')[1:])
                title = parser.unescape(title).encode('utf-8')
                level = int(bmk[2].rsplit(' ')[1])
                page = int(bmk[3].rsplit(' ')[1])
                self.data.append(BookmarkItem(level, title, page))

    def to_djvu(self):
        """to a format recognized by djvused"""
        now_level = 0
        ret = "(bookmarks\n"
        for bmk in self.data:
            while (bmk.level <= now_level):
                ret = ret[:-1] + ")\n"
                now_level -= 1
            now_level = bmk.level
            ret += " " * now_level + "(\"{0}\" \"#{1}\"\n".format(bmk.title, bmk.page)
        while (0 <= now_level):
            ret = ret[:-1] + ")\n"
            now_level -= 1
        return ret

    def page_add(self, n):
        for i in self.data:
            i.page += n

if __name__ == "__main__":
    x = Bookmarks()
    x.from_pdftk_dump("bookmarks.info")
    djvu = x.to_djvu()
    print djvu


