"""Smoke test for the inline SSRF guard added to scrapy_service.py and email_extractor.py."""
import sys
import os
import types as _types
import importlib.util

# Set up proper package paths so the relative imports work
sys.path.insert(0, '/home/z/my-project/mini-services/scraper-service/app')
sys.path.insert(0, '/home/z/my-project/mini-services/gmaps-scraper/app')


def _load_module(name, path, parent_pkg):
    """Dynamically load a module as part of a parent package so relative imports resolve."""
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


# First, register the `services` and root packages as namespace packages
import services  # scrapy-service/app/services has __init__.py? Let's check
# Actually, let's just register them manually
sys.modules.setdefault('services', _types.ModuleType('services'))
sys.modules['services'].__path__ = ['/home/z/my-project/mini-services/scraper-service/app/services']

# Load scrapy_service
validate_scraper_module = _load_module(
    'services.scrapy_service',
    '/home/z/my-project/mini-services/scraper-service/app/services/scrapy_service.py',
    'services',
)
validate_scraper = validate_scraper_module._validate_url_inline

# Load email_extractor (it lives directly in app/, not in a sub-package)
# Need to make `app` a package for the relative import `from .url_guard` to work.
# Trick: register a fake `app` module.
app_pkg = _types.ModuleType('app')
app_pkg.__path__ = ['/home/z/my-project/mini-services/gmaps-scraper/app']
sys.modules['app'] = app_pkg

# Load email_extractor under the `app` namespace
validate_email_module = _load_module(
    'app.email_extractor',
    '/home/z/my-project/mini-services/gmaps-scraper/app/email_extractor.py',
    'app',
)
validate_email = validate_email_module._validate_url_inline

# Get UnsafeUrlError from BOTH url_guard modules (they're different classes)
from services.url_guard import UnsafeUrlError as ScraperUnsafeUrlError

# email_extractor's UnsafeUrlError is in app.url_guard
try:
    from app.url_guard import UnsafeUrlError as EmailUnsafeUrlError
except ImportError:
    EmailUnsafeUrlError = ScraperUnsafeUrlError  # fallback

# Combined exception tuple for catching either
AllUnsafeUrlErrors = (ScraperUnsafeUrlError, EmailUnsafeUrlError)


# Test cases: (url, should_pass)
TESTS = [
    # Public URLs — should pass
    ('https://example.com/path?q=1', True),
    ('http://example.com', True),
    ('https://stripe.com/contact', True),
    # Internal/private IPs — should fail
    ('http://127.0.0.1/admin', False),
    ('http://localhost/admin', False),
    ('http://10.0.0.1/internal', False),
    ('http://192.168.1.1/router', False),
    ('http://169.254.169.254/latest/meta-data/', False),  # AWS metadata
    ('http://172.16.0.1/private', False),
    ('http://172.31.255.255/private', False),
    ('http://0.0.0.0/', False),
    ('http://[::1]/ipv6-loopback', False),
    # Internal hostnames — should fail
    ('http://my-service.local/', False),
    ('http://api.internal/', False),
    ('http://service.localhost/', False),
    # Dangerous schemes — should fail
    ('file:///etc/passwd', False),
    ('gopher://internal/abc', False),
    ('ftp://example.com/', False),
    ('data:text/html,<script>alert(1)</script>', False),
    # Userinfo trick — should fail
    ('http://user:pass@example.com/', False),
    # Malformed — should fail
    ('not-a-url', False),
]


def run_tests(validator, name):
    print(f"\n=== Testing {name} ===")
    passed = 0
    failed = 0
    for url, should_pass in TESTS:
        try:
            result = validator(url)
            if should_pass:
                print(f"  PASS: {url!r} -> accepted")
                passed += 1
            else:
                print(f"  FAIL: {url!r} -> accepted but should be rejected")
                failed += 1
        except AllUnsafeUrlErrors as e:
            if should_pass:
                print(f"  FAIL: {url!r} -> rejected ({e.reason}) but should be accepted")
                failed += 1
            else:
                print(f"  PASS: {url!r} -> rejected ({e.reason})")
                passed += 1
        except Exception as e:
            print(f"  FAIL: {url!r} -> exception {type(e).__name__}: {e}")
            failed += 1
    print(f"  Summary: {passed} passed, {failed} failed")
    return failed


total_failed = 0
total_failed += run_tests(validate_scraper, "scrapy_service._validate_url_inline")
total_failed += run_tests(validate_email, "email_extractor._validate_url_inline")

print(f"\nTotal failures: {total_failed}")
sys.exit(1 if total_failed else 0)
