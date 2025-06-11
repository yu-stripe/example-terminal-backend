# Email Collection Feature for Stripe Terminal

This implementation adds email collection functionality to the Stripe Terminal backend, allowing you to collect customer email addresses through the terminal and automatically update customer records.

## Features Implemented

### 1. Backend Changes (web.rb)

#### Modified Email Collection Endpoint
- **Endpoint**: `POST /api/terminal/:id/collect_email`
- **New Feature**: Accepts `customer_id` in request body
- **Functionality**: Sets customer ID in metadata when initiating email collection

```ruby
# Example request body:
{
  "customer_id": "cus_ABC123"
}
```

#### Enhanced Webhook Handler
- **Event**: `terminal.reader.action_succeeded`
- **New Functionality**: 
  - Detects when email collection is completed
  - Extracts customer ID from metadata
  - Extracts collected email from terminal response
  - Automatically updates customer record with collected email

#### Helper Method
- **Function**: `update_customer_with_email(customer_id, email)`
- **Purpose**: Updates Stripe customer record with collected email address

### 2. Frontend Changes (client/src/Customer.js)

#### Modified Email Collection Function
- **Function**: `collectEmail()`
- **New Feature**: Sends customer ID when initiating email collection
- **Request**: Includes customer ID in JSON payload

#### Enhanced Polling Function
- **Function**: `pollForCollectedEmail()`
- **New Feature**: Refreshes customer data after email collection completes
- **Timing**: Waits 2 seconds for webhook processing before refreshing

#### Customer Data Refresh
- **Function**: `refreshCustomerData()`
- **Purpose**: Fetches updated customer information to display new email

## How It Works

### Flow Diagram
```
1. User clicks "メール収集開始" (Start Email Collection)
   ↓
2. Frontend sends POST request with customer_id to backend
   ↓
3. Backend initiates collect_inputs on terminal with customer_id in metadata
   ↓
4. Customer enters email on terminal device
   ↓
5. Terminal sends webhook to backend when collection succeeds
   ↓
6. Webhook handler extracts email and customer_id, updates customer
   ↓
7. Frontend polls for collected data and refreshes customer info
   ↓
8. UI displays updated customer email
```

### Example Terminal Reader Response
```json
{
  "id": "tmr_Fcd9lADqPm3A5q",
  "object": "terminal.reader",
  "action": {
    "collect_inputs": {
      "inputs": [{
        "type": "email",
        "email": {"value": "yu@stripe.com"},
        "required": false,
        "skipped": false
      }],
      "metadata": {"customer_id": "cus_ABC123"}
    },
    "status": "succeeded",
    "type": "collect_inputs"
  }
}
```

## Usage Instructions

1. **Navigate to Customer Page**: Go to `/customers/{customer_id}` in the frontend
2. **Start Email Collection**: Click the "メール収集開始" button
3. **Enter Email on Terminal**: Customer enters email on the terminal device
4. **Automatic Update**: System automatically updates customer record
5. **View Updated Info**: Customer email appears in the basic information section

## Key Benefits

- **Seamless Integration**: Email collection is tied to specific customers
- **Automatic Updates**: No manual intervention needed to update customer records
- **Real-time Feedback**: UI shows collection status and updates automatically
- **Error Handling**: Comprehensive error handling and status reporting
- **Webhook Processing**: Reliable webhook handling for data consistency

## Technical Details

### Metadata Usage
The customer ID is stored in the `metadata` field of the collect_inputs action, allowing the webhook to identify which customer the email belongs to.

### Polling Strategy
The frontend polls every 2 seconds for collected data and stops after 60 seconds to prevent infinite polling.

### Error Handling
- Network errors during collection initiation
- Timeout handling (60 seconds)
- Webhook processing errors
- Customer update failures

### Security Considerations
- Customer ID validation in webhook handler
- Proper error logging for debugging
- CORS headers for cross-origin requests

## Testing

To test the functionality:

1. Ensure you have a Stripe Terminal reader connected
2. Update the `terminal` variable in Customer.js with your reader ID
3. Configure webhook endpoint in Stripe Dashboard
4. Navigate to a customer page and test email collection

## Webhook Configuration

Make sure your Stripe webhook endpoint is configured to listen for:
- `terminal.reader.action_succeeded`

The webhook URL should point to: `https://your-domain.com/webhook`
