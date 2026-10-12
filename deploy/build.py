#!/usr/bin/env python3
"""Build the root-hosted bundle for kheya.tanishqnalloju.com from this repo's committed HEAD.
The repo is a SvelteKit build with base path /kheya-preview; this rewrites it to base "" and the site URL."""
import os, shutil, subprocess, sys, io, tarfile
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'public')
SITE = 'https://kheya.tanishqnalloju.com'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
tar = subprocess.run(['git', 'archive', 'HEAD'], cwd=ROOT, check=True, capture_output=True).stdout
with tarfile.open(fileobj=io.BytesIO(tar)) as t:
    t.extractall(OUT, filter='data', members=[m for m in t.getmembers() if not m.name.startswith('deploy/')])
n = 0
for root, _, files in os.walk(OUT):
    for f in files:
        if not f.endswith(('.html', '.js', '.json', '.css', '.xml', '.txt', '.svg', '.webmanifest')):
            continue
        p = os.path.join(root, f)
        s = o = open(p, encoding='utf-8').read()
        s = s.replace('https://harinaralasetty.github.io/kheya-preview', SITE)
        s = s.replace('base: "/kheya-preview"', 'base: ""').replace('assets: "/kheya-preview"', 'assets: ""').replace('??`/kheya-preview`', '??``')
        s = s.replace('/kheya-preview/', '/')
        if s != o:
            open(p, 'w', encoding='utf-8').write(s); n += 1
left = subprocess.run(['grep', '-rl', 'kheya-preview', OUT], capture_output=True, text=True).stdout.strip()
print(f'rewrote {n} files into {OUT}')
if left:
    sys.exit('leftover /kheya-preview references:\n' + left)
