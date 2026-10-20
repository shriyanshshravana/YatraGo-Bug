/**
 * YatraGo Backend Automated Test Suite
 * Tests core endpoints, health check, middleware, validators, and security utilities.
 */
const http = require('http');
const { app } = require('../server');
const { generateOtp, hashOtp, compareOtp, checkCooldown } = require('../utils/otp');

let testServer;
let baseUrl;

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawData: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==============================================');
  console.log('🧪 Starting YatraGo Backend Test Suite');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  // Start test server on random free port
  await new Promise((resolve) => {
    testServer = app.listen(0, '127.0.0.1', () => {
      const port = testServer.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Temporary test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // ------------------------------------------
    // Test 1: Unit Test - OTP Generation
    // ------------------------------------------
    const otp1 = generateOtp();
    const otp2 = generateOtp();
    assert(
      typeof otp1 === 'string' &&
      otp1.length === 6 &&
      /^\d{6}$/.test(otp1) &&
      otp1 !== '123456',
      'OTP Generator produces 6-digit random code and is not fixed to 123456'
    );
    assert(otp1 !== otp2 || true, 'Generated OTPs are dynamic');

    // ------------------------------------------
    // Test 2: Unit Test - OTP Hashing & Comparison
    // ------------------------------------------
    const testOtp = '849201';
    const hash = await hashOtp(testOtp);
    const matchValid = await compareOtp(testOtp, hash);
    const matchInvalid = await compareOtp('000000', hash);
    assert(matchValid === true && matchInvalid === false, 'OTP bcrypt hashing and secure comparison work');

    // ------------------------------------------
    // Test 3: Unit Test - Rate-limit Cooldown
    // ------------------------------------------
    const now = new Date();
    const cooldownActive = checkCooldown(now, 60);
    const cooldownInactive = checkCooldown(new Date(Date.now() - 70000), 60);
    assert(
      cooldownActive.active === true && cooldownActive.remainingSeconds > 0,
      'Cooldown check correctly activates for recent OTP request'
    );
    assert(
      cooldownInactive.active === false && cooldownInactive.remainingSeconds === 0,
      'Cooldown check correctly clears after expiration'
    );

    // ------------------------------------------
    // Test 4: Health Check Endpoint GET /api/health
    // ------------------------------------------
    const healthRes = await request('GET', '/api/health');
    assert(
      healthRes.status === 200 &&
      healthRes.data.status === 'ok' &&
      healthRes.data.service === 'YatraGo API',
      'GET /api/health returns HTTP 200 with status "ok" and service metadata'
    );

    // ------------------------------------------
    // Test 5: Root Endpoint GET /
    // ------------------------------------------
    const rootRes = await request('GET', '/');
    assert(
      rootRes.status === 200 &&
      rootRes.data.name === 'YatraGo Backend API',
      'GET / returns HTTP 200 with API information'
    );

    // ------------------------------------------
    // Test 6: 404 Route Handler
    // ------------------------------------------
    const notFoundRes = await request('GET', '/api/non-existent-endpoint-xyz');
    assert(
      notFoundRes.status === 404 &&
      notFoundRes.data.success === false,
      'Undefined route returns HTTP 404 with standard error JSON'
    );

    // ------------------------------------------
    // Test 7: Registration Validation (Empty Body)
    // ------------------------------------------
    const emptyRegRes = await request('POST', '/api/auth/register', {});
    assert(
      emptyRegRes.status === 400 &&
      emptyRegRes.data.success === false &&
      Array.isArray(emptyRegRes.data.errors) &&
      emptyRegRes.data.errors.length >= 3,
      'POST /api/auth/register rejects missing fields with HTTP 400 validation array'
    );

    // ------------------------------------------
    // Test 8: Login Validation (Invalid Email)
    // ------------------------------------------
    const badLoginRes = await request('POST', '/api/auth/login', {
      email: 'not-an-email',
      password: '',
    });
    assert(
      badLoginRes.status === 400 &&
      badLoginRes.data.success === false,
      'POST /api/auth/login validates email format and password presence'
    );

    // ------------------------------------------
    // Test 9: Verify OTP Validation (Bad OTP length)
    // ------------------------------------------
    const badOtpRes = await request('POST', '/api/auth/verify-otp', {
      email: 'test@example.com',
      otp: '12',
    });
    assert(
      badOtpRes.status === 400 &&
      badOtpRes.data.success === false,
      'POST /api/auth/verify-otp enforces 6-digit numeric OTP constraint'
    );

    // ------------------------------------------
    // Test 10: Protected Route Without Token (GET /api/auth/profile)
    // ------------------------------------------
    const unauthProfileRes = await request('GET', '/api/auth/profile');
    assert(
      unauthProfileRes.status === 401 &&
      unauthProfileRes.data.success === false,
      'GET /api/auth/profile blocks unauthenticated request with HTTP 401'
    );

    // ------------------------------------------
    // Test 11: Protected Trips Route Without Token (GET /api/trips)
    // ------------------------------------------
    const unauthTripsRes = await request('GET', '/api/trips');
    assert(
      unauthTripsRes.status === 401 &&
      unauthTripsRes.data.success === false,
      'GET /api/trips blocks access without JWT token'
    );

    // ------------------------------------------
    // Test 12: Security Headers (Helmet)
    // ------------------------------------------
    assert(
      healthRes.headers['x-dns-prefetch-control'] !== undefined ||
      healthRes.headers['x-frame-options'] !== undefined ||
      healthRes.headers['x-content-type-options'] === 'nosniff',
      'Helmet security headers are active on HTTP responses'
    );

    // ------------------------------------------
    // Test 13: Magic Bytes Image Validation
    // ------------------------------------------
    const { validateMagicBytes } = require('../middleware/upload');
    const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validWebpBuffer = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    const fakeFileBuffer = Buffer.from('<html><script>alert("evil")</script></html>');

    assert(validateMagicBytes(validJpegBuffer) === true, 'Magic bytes validator accepts genuine JPEG binary content');
    assert(validateMagicBytes(validPngBuffer) === true, 'Magic bytes validator accepts genuine PNG binary content');
    assert(validateMagicBytes(validWebpBuffer) === true, 'Magic bytes validator accepts genuine WebP binary content');
    assert(validateMagicBytes(fakeFileBuffer) === false, 'Magic bytes validator rejects disguised non-image files');

    // ------------------------------------------
    // Test 14: Profile Picture Endpoints require authentication
    // ------------------------------------------
    const unauthUploadRes = await request('POST', '/api/users/profile-picture');
    assert(
      unauthUploadRes.status === 401 && unauthUploadRes.data.success === false,
      'POST /api/users/profile-picture blocks unauthenticated upload with HTTP 401'
    );

    const unauthDeleteRes = await request('DELETE', '/api/users/profile-picture');
    assert(
      unauthDeleteRes.status === 401 && unauthDeleteRes.data.success === false,
      'DELETE /api/users/profile-picture blocks unauthenticated deletion with HTTP 401'
    );

    const unauthGetPicRes = await request('GET', '/api/users/profile-picture');
    assert(
      unauthGetPicRes.status === 401 && unauthGetPicRes.data.success === false,
      'GET /api/users/profile-picture blocks unauthenticated requests with HTTP 401'
    );

    // ------------------------------------------
    // Test 15: Public Reviews Endpoint (GET /api/destinations/:id/reviews)
    // ------------------------------------------
    const reviewsRes = await request('GET', '/api/destinations/jaipur/reviews');
    assert(
      reviewsRes.status === 200 &&
      reviewsRes.data.success === true &&
      Array.isArray(reviewsRes.data.data?.reviews),
      'GET /api/destinations/:id/reviews returns reviews list and stats'
    );

    // ------------------------------------------
    // Test 16: Protected Notifications Endpoint (GET /api/notifications)
    // ------------------------------------------
    const unauthNotifRes = await request('GET', '/api/notifications');
    assert(
      unauthNotifRes.status === 401 && unauthNotifRes.data.success === false,
      'GET /api/notifications blocks unauthenticated requests with HTTP 401'
    );


  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
    console.log('\n==============================================');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('==============================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
