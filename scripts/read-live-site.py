from html.parser import HTMLParser
from urllib.request import urlopen, Request
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json

BASE='https://www.thinklabdigitalsolutions.com'
class Node:
 def __init__(self, tag='', attrs=(), parent=None): self.tag=tag; self.attrs=dict(attrs); self.parent=parent; self.children=[]
 def text(self): return ' '.join(' '.join(c.text() if isinstance(c,Node) else c for c in self.children).split())
 def all(self,tags=None):
  for c in self.children:
   if isinstance(c,Node):
    if tags is None or c.tag in tags: yield c
    yield from c.all(tags)
class HTML(HTMLParser):
 def __init__(self): super().__init__();self.root=Node();self.current=self.root
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.current);self.current.children.append(n)
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.current=n
 def handle_endtag(self,tag):
  n=self.current
  while n.parent:
   if n.tag==tag:self.current=n.parent;break
   n=n.parent
 def handle_data(self,data):
  if self.current.tag not in ['script','style']:self.current.children.append(data)
def get(path):
 url=urljoin(BASE,path);name=urlparse(url).path.strip('/').replace('/','__') or 'home'
 target=Path('.design-reference')/(name+'.html')
 if not target.exists():target.write_bytes(urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35).read())
 p=HTML();p.feed(target.read_text());return p.root
if __name__=='__main__':
 for path in ['/','/about-us','/services','/case-studies','/careers','/contact-us']:
  root=get(path)
  links=list(dict.fromkeys((n.attrs.get('href',''),n.text()[:100]) for n in root.all(['a']) if n.attrs.get('href')))
  blocks=list(dict.fromkeys(n.text() for n in root.all(['h1','h2','h3','h4','h5','p']) if n.text()))
  images=list({n.attrs.get('src',''):n.attrs.get('alt','') for n in root.all(['img'])}.items())
  Path('.design-reference/'+(path.strip('/') or 'home')+'.json').write_text(json.dumps({'links':links,'blocks':blocks,'images':images},indent=2))
  print(path,'\nLINKS',json.dumps(links[:55]),'\nIMAGES',json.dumps(images[:20]),'\nTEXT',json.dumps(blocks[:35]))
