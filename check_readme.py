import sys, os
content = open("README.md", "r", encoding="utf-8").read()
# Check first 100 chars
print("First 100 chars hex:", content[:20].encode("utf-8").hex())
print("Has 抖音:", "抖音" in content)
print("Has 部署:", "部署" in content)
