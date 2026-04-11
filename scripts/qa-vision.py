#!/usr/bin/env python3
"""
qa-vision.py — Visual QA tool for OpenHands containers
Usage: python3 scripts/qa-vision.py <url_or_screenshot_path> [--prompt "custom prompt"]

Sends screenshot to OmniRouter vision model, returns structured bug report.
"""
import sys, os, json, base64, urllib.request, urllib.error, time, subprocess, tempfile, argparse

OMNI_URL = "http://91.98.205.156:20128/v1/chat/completions"
OMNI_KEY = "sk-d6b3f12535063b81-5ad90d-73e101c7"

VISION_MODELS = [
    "openrouter/google/gemma-4-31b-it:free",
    "openrouter/google/gemma-3-27b-it:free",
    "openrouter/nvidia/nemotron-nano-12b-v2-vl:free",
    "openrouter/google/gemma-3-12b-it:free",
]

DEFAULT_QA_PROMPT = """You are a strict mobile UI/UX QA engineer. Analyze this screenshot for visual bugs.

Check each criterion and report issues:
1. TEXT OVERFLOW — text cut off, truncated, overflowing containers
2. Z-INDEX BUGS — wrong layering, headers hiding content, modals behind background
3. BROKEN LAYOUT — elements misaligned, overlapping incorrectly, layout shift
4. MISSING CONTENT — empty boxes, broken images, loading placeholders stuck visible
5. NAVIGATION — is tab bar visible? header visible? back button present where expected?
6. SCROLL CUTOFF — content cut at bottom edge, no visual hint of scrollability
7. BRAND VIOLATIONS — wrong colors, missing logo, inconsistent fonts, emoji in UI
8. ACCESSIBILITY — very low contrast text, tiny tap targets (<44px), unlabeled icons

For each bug found, write:
BUG: [criterion] — [exact description of what's wrong] — [location on screen]

End with:
BUGS_FOUND: N
VERDICT: PASS or FAIL (FAIL if any bugs found)"""


def screenshot_url(url: str) -> str:
    """Screenshot a URL using Playwright. Returns path to PNG file."""
    tmp = tempfile.mktemp(suffix=".png")
    try:
        result = subprocess.run(
            ["python3", "-m", "playwright", "screenshot", "--browser", "chromium",
             "--viewport-size", "390,844", url, tmp],
            capture_output=True, timeout=60
        )
        if result.returncode == 0 and os.path.exists(tmp):
            return tmp
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    print("[qa-vision] Installing playwright...", file=sys.stderr)
    subprocess.run(["pip", "install", "playwright", "-q"], capture_output=True)
    subprocess.run(["python3", "-m", "playwright", "install", "chromium", "--with-deps"],
                   capture_output=True, timeout=120)

    result = subprocess.run(
        ["python3", "-m", "playwright", "screenshot", "--browser", "chromium",
         "--viewport-size", "390,844", url, tmp],
        capture_output=True, timeout=60
    )
    if result.returncode != 0:
        raise RuntimeError(f"Playwright failed: {result.stderr.decode()}")
    return tmp


def call_vision(img_path: str, prompt: str) -> dict:
    """Send image to OmniRouter vision model with fallback chain."""
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    for model in VISION_MODELS:
        payload = json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
            ]}],
            "max_tokens": 800
        }).encode()

        req = urllib.request.Request(
            OMNI_URL, data=payload,
            headers={"Authorization": f"Bearer {OMNI_KEY}", "Content-Type": "application/json"}
        )
        try:
            t = time.time()
            with urllib.request.urlopen(req, timeout=60) as r:
                result = json.loads(r.read())
            elapsed = time.time() - t

            msg = result["choices"][0]["message"]
            content = msg.get("content") or ""
            for rd in msg.get("reasoning_details", []):
                if rd.get("text"):
                    content = rd["text"]
                    break

            return {
                "model": model,
                "elapsed": round(elapsed, 1),
                "raw": content,
                "verdict": "FAIL" if "VERDICT: FAIL" in content else "PASS",
                "bugs_found": int(next(
                    (line.split(":")[1].strip() for line in content.splitlines()
                     if line.startswith("BUGS_FOUND:")), "0"
                ))
            }
        except urllib.error.HTTPError as e:
            print(f"[qa-vision] {model} failed: {e.code}", file=sys.stderr)
            time.sleep(1)
        except Exception as e:
            print(f"[qa-vision] {model} error: {e}", file=sys.stderr)

    raise RuntimeError("All vision models failed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="URL to screenshot OR path to existing PNG")
    parser.add_argument("--prompt", default=DEFAULT_QA_PROMPT, help="Custom QA prompt")
    parser.add_argument("--json", action="store_true", help="Output JSON only")
    args = parser.parse_args()

    if args.target.startswith("http"):
        print(f"[qa-vision] Screenshotting {args.target}...", file=sys.stderr)
        img_path = screenshot_url(args.target)
        cleanup = True
    else:
        img_path = args.target
        cleanup = False

    print(f"[qa-vision] Analyzing with vision model...", file=sys.stderr)
    result = call_vision(img_path, args.prompt)

    if cleanup:
        os.unlink(img_path)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"\n=== QA RESULT ({result['model']}, {result['elapsed']}s) ===")
        print(result["raw"])
        print(f"\nVERDICT: {result['verdict']} | BUGS: {result['bugs_found']}")

    sys.exit(0 if result["verdict"] == "PASS" else 1)


if __name__ == "__main__":
    main()
