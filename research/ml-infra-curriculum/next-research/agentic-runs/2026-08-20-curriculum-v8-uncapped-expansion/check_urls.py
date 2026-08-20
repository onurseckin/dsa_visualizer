import os
import re
import urllib.request
import ssl

domains = ["domain-07-attention-and-transformers.md", "domain-08-inference-systems.md", "domain-09-precision-quantization-kernels.md", "domain-10-distributed-and-compilers.md"]
base_dir = "/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01"

urls = set()

for domain in domains:
    with open(os.path.join(base_dir, domain)) as f:
        content = f.read()
        found_urls = re.findall(r'https?://[^\s\)]+', content)
        urls.update(found_urls)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req_headers = {'User-Agent': 'Mozilla/5.0'}
invalid_urls = []

# We'll just try to open each URL.
for url in list(urls):
    try:
        req = urllib.request.Request(url, headers=req_headers)
        urllib.request.urlopen(req, context=ctx, timeout=5)
    except Exception as e:
        invalid_urls.append((url, str(e)))

print("Invalid URLs:")
for u, e in invalid_urls:
    print(u, e)
