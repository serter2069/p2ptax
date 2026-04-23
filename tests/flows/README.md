# P2PTax Flow Tests (vizor)

Add `.flow` or `.json` files here. Run via:
```
vizor http://localhost:8081 --flow tests/flows/01-login.flow --problems
```

## Flow format (line-based)
```
goto <url>
wait-for <selector>
fill <selector> <value>
click <selector>
assert-url <path>
assert-text <selector> <text>
wait <ms>
screenshot /tmp/name.jpg
```

## Flow format (JSON)
```json
[
  {"type": "goto", "url": "http://localhost:8081"},
  {"type": "fill", "selector": "input[type=email]", "value": "test@test.com"},
  {"type": "click", "selector": "[data-testid=send-otp]"},
  {"type": "assert-url", "value": "/dashboard"}
]
```
