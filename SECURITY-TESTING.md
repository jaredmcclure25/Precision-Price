# Security Testing & Fuzzing Suite

## Overview

This application includes a comprehensive security testing and fuzzing suite to validate input handling, prevent common vulnerabilities, and ensure the app handles edge cases properly.

## Accessing the Testing Suite

1. Run the development server: `npm run dev`
2. Navigate to **Tools** → **Security Tests** in the app
3. Click "Run All Tests" to execute the full test suite

## What Gets Tested

### Attack Vector Detection

The fuzzing suite tests the application against:

#### 1. **XSS (Cross-Site Scripting)**
- Script injection attempts
- Event handler injection
- SVG/iframe-based XSS
- Data exfiltration attempts

#### 2. **SQL Injection**
- Union-based injection
- Comment-based injection
- Boolean-based blind injection
- Stacked queries

#### 3. **Command Injection**
- Shell command execution
- Path traversal
- File system access attempts

#### 4. **Input Validation**
- Buffer overflow (oversized inputs)
- Type coercion attacks
- Unicode/encoding attacks
- Null byte injection
- Special character handling

#### 5. **File Upload Security**
- Malicious file names
- Path traversal in filenames
- File size validation
- MIME type validation

#### 6. **Price Manipulation**
- Negative values
- Extreme values (very large/small)
- Format injection
- Hex/octal encoding

## Test Results

### Result Statuses

- **✅ Rejected**: Input was properly blocked (GOOD)
- **⚠️ Needs Sanitization**: Input was accepted but may need sanitization (REVIEW)
- **ℹ️ Accepted**: Input was processed (VERIFY EXPECTED)

### Interpreting Results

A well-secured application should:
- Reject or sanitize all XSS payloads
- Reject or sanitize all SQL injection attempts
- Limit input sizes to reasonable bounds
- Validate file uploads properly
- Handle edge cases gracefully

### Console Output

Open your browser's Developer Console (F12) to see:
- Detailed test execution logs
- Real-time test progress
- Granular pass/fail information

## Downloading Results

Click "Download Full Results" to save a JSON file containing:
- Complete test execution data
- All payloads tested
- Status for each test
- Timestamp of test run

## Security Recommendations

Based on test results, consider implementing:

1. **Input Sanitization**
   ```javascript
   import { InputValidation } from './fuzz-tests';

   const cleanInput = InputValidation.sanitizeText(userInput, 500);
   ```

2. **Price Validation**
   ```javascript
   const result = InputValidation.validatePrice(priceInput);
   if (!result.valid) {
     setError(result.error);
     return;
   }
   ```

3. **File Validation**
   ```javascript
   const result = InputValidation.validateImageFile(file);
   if (!result.valid) {
     setError(result.error);
     return;
   }
   ```

4. **Rate Limiting**
   ```javascript
   const rateLimiter = InputValidation.createRateLimiter(10, 60000);

   const check = rateLimiter();
   if (!check.allowed) {
     setError(check.error);
     return;
   }
   ```

## Running Tests Programmatically

You can also run tests from the console:

```javascript
// Import test utilities
import { FuzzTests, FuzzGenerators } from './src/fuzz-tests';

// Run all tests
const results = await FuzzTests.runAllTests({
  setItemName,
  setLocation,
  setAdditionalDetails,
  setError,
  analyzePricing
});

console.log(results);
```

## Custom Test Payloads

Add your own test payloads in `src/fuzz-tests.js`:

```javascript
export const FuzzGenerators = {
  // Add custom payloads
  customPayloads: [
    'your-test-payload-1',
    'your-test-payload-2',
  ],

  // ... existing generators
};
```

## Best Practices

1. **Run tests regularly** during development
2. **Review warnings** - items marked "needs-sanitization"
3. **Add new test cases** when you discover vulnerabilities
4. **Document findings** and remediation steps
5. **Retest after fixes** to verify patches work

## Production Recommendations

For production deployment:

1. ✅ Enable Content Security Policy (CSP) headers
2. ✅ Implement server-side validation for ALL inputs
3. ✅ Use parameterized queries for database operations
4. ✅ Sanitize user input before display
5. ✅ Implement rate limiting on API endpoints
6. ✅ Use HTTPS only
7. ✅ Enable CORS restrictions
8. ✅ Validate file uploads on server
9. ✅ Log and monitor security events
10. ✅ Keep dependencies updated

## Test Categories

### Input Fields Tested
- ✅ Item Name
- ✅ Location
- ✅ Additional Details
- ✅ Image Uploads
- ✅ Price Values

### Payload Categories
- 🔴 **High Risk**: XSS, SQL Injection, Command Injection
- 🟡 **Medium Risk**: Path Traversal, Buffer Overflow
- 🟢 **Low Risk**: Type Coercion, Unicode Handling

## Continuous Security

Consider integrating:
- Automated security scanning in CI/CD
- Regular penetration testing
- Security audit logs
- Vulnerability monitoring
- Dependency scanning (e.g., `npm audit`)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## Support

For security concerns or questions:
- Review test results in the app
- Check browser console for detailed logs
- Refer to `src/fuzz-tests.js` for test implementations
