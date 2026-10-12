# Deploy to kheya.tanishqnalloju.com

Static assets on the Cloudflare Worker `kheya`, with custom domain `kheya.tanishqnalloju.com` (Cloudflare creates the DNS record when the Worker deploys).

```sh
cd deploy
npm install
CLOUDFLARE_API_TOKEN=... npm run deploy   # builds ./public from git HEAD, then runs wrangler deploy
```

- `build.py` exports the committed HEAD (uncommitted edits are not deployed) and rewrites the `/kheya-preview` base path and site URLs for root hosting.
- The token needs Workers Scripts edit and Workers Custom Domains / zone DNS edit on tanishqnalloju.com.
- `noindex, nofollow` and `robots.txt Disallow: /` come from the build itself and still block indexing.
- Never push to harinaralasetty/kheya-preview.
