# Payment Integration Troubleshooting

## 500 Internal Server Error on Payment Initiation

If you're seeing `POST /api/orders/:id/initiate-payment 500 (Internal Server Error)`, this indicates a backend issue.

### Common Causes

#### 1. **Database Migration Not Run**
The most common cause is missing payment fields in the database.

**Solution:**
```bash
# Run database migrations
npx prisma migrate deploy
npx prisma generate
```

**Required Database Fields:**
- `qpayInvoiceId` (String, nullable)
- `qpayPaymentId` (String, nullable)
- `paymentStatus` (String, default: "PENDING")
- `paymentMethod` (String, nullable)
- `paidAt` (DateTime, nullable)
- `ebarimtId` (String, nullable)

#### 2. **Missing Environment Variables**
QPAY credentials not configured.

**Required Environment Variables:**
```env
QPAY_API_URL=https://merchant.qpay.mn/v2
QPAY_USERNAME=YOUR_QPAY_USERNAME
QPAY_PASSWORD=YOUR_QPAY_PASSWORD
QPAY_INVOICE_CODE=YOUR_INVOICE_CODE
QPAY_CALLBACK_BASE_URL=https://api.gerar.mn/api
```

**Check:**
- Verify all environment variables are set in `.env` or `.env.prod`
- Restart backend server after adding environment variables

#### 3. **QPAY Service Not Implemented**
Backend QPAY service code missing or not properly configured.

**Check Backend:**
- `src/services/qpayService.js` exists and is properly implemented
- `src/controllers/paymentController.js` exists
- `src/routes/paymentRoutes.js` exists and is registered

#### 4. **Backend Code Errors**
Check backend server logs for specific error messages.

**Common Backend Errors:**
- `Cannot read property 'X' of undefined` - Missing service initialization
- `Token fetch failed` - QPAY credentials incorrect
- `Invoice creation failed` - QPAY API connection issue
- `Database error` - Migration not run or schema mismatch

### Frontend Status

✅ **Frontend is ready and working correctly:**
- Payment API functions implemented
- Error handling improved
- Prevents infinite retry loops
- Shows helpful error messages
- Handles all payment states gracefully

### Debugging Steps

1. **Check Backend Logs**
   - Look for error stack traces
   - Check for database errors
   - Verify QPAY API responses

2. **Verify Database Schema**
   ```sql
   -- Check if payment columns exist
   DESCRIBE orders;
   -- or
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name LIKE '%payment%';
   ```

3. **Test QPAY Connection**
   - Verify QPAY credentials are correct
   - Test QPAY API connectivity
   - Check QPAY merchant dashboard

4. **Verify Backend Routes**
   - Ensure `/api/orders/:id/initiate-payment` route exists
   - Check route authentication middleware
   - Verify route is registered in main app

### Frontend Error Handling

The frontend now:
- ✅ Shows specific error messages based on HTTP status codes
- ✅ Prevents automatic retries on 500 errors
- ✅ Allows manual retry with "Дахин оролдох" button
- ✅ Displays helpful error messages to users
- ✅ Handles all error states gracefully

### Next Steps

1. **Fix Backend Issues:**
   - Run database migrations
   - Configure QPAY environment variables
   - Verify QPAY service implementation
   - Check backend server logs

2. **Test Payment Flow:**
   - Create a test order
   - Try to initiate payment
   - Verify QR code is generated
   - Test payment completion

3. **Monitor:**
   - Check backend logs during payment initiation
   - Monitor QPAY API calls
   - Verify database updates

### Support

If the issue persists after checking all above:
1. Check backend server logs for detailed error messages
2. Verify QPAY merchant account status
3. Contact QPAY support if API issues
4. Review backend implementation against QPAY_IMPLEMENTATION.md
