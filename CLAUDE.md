# CLAUDE.md

## Project Overview

This is a **Stripe Terminal Example Backend** application that demonstrates Stripe Terminal SDK integration. It serves as a reference implementation for developers building payment terminal solutions.

**Purpose**: Educational/demonstration backend for Stripe Terminal integrations across iOS, JavaScript, and Android platforms.

**Warning**: This is an example application with unauthenticated endpoints. NOT intended for production use.

## Technology Stack

### Backend
- **Framework**: Sinatra (Ruby web framework)
- **Ruby Version**: 3.1.2
- **Primary Library**: Stripe Ruby SDK
- **Additional Dependencies**:
  - `dotenv` - Environment configuration
  - `sinatra/cross_origin` - CORS support
  - `securerandom` - Random data generation

### Frontend
- **Framework**: React 18.2.0
- **Location**: `/client` directory
- **Key Libraries**:
  - React Router
  - React Bootstrap
  - Stripe React libraries (`@stripe/react-stripe-js`, `@stripe/stripe-js`)

### Deployment Options
- Local development
- Docker
- Heroku
- Render (primary production platform)

## Architecture

### Main Entry Point
**File**: `web.rb` (1,512 lines)

This is a monolithic Sinatra application with all routes and business logic in a single file.

### Key Architectural Patterns

1. **REST API Design**: Stateless endpoints with JSON responses
2. **Session Management**: Server-side sessions for tracking selected terminal readers
3. **CORS Enabled**: Configured for cross-origin requests from frontend
4. **Error Handling**: Comprehensive Stripe error catching and logging
5. **Webhook Processing**: Handles Stripe webhook events for terminal actions

### Domain Model

The application primarily works with these Stripe objects:
- **Terminal Readers** - Physical payment terminals
- **Payment Intents** - Payment transactions
- **Customers** - Customer records
- **Payment Methods** - Saved payment instruments
- **Setup Intents** - For saving cards without charging
- **Locations** - Physical locations for terminal readers

## Core Features & Use Cases

### 1. Terminal Reader Management
- List available readers (`GET /api/terminal/readers`)
- Select/deselect reader for current session (`POST /api/terminal/select`, `POST /api/terminal/clear`)
- Get selected reader (`GET /api/terminal/selected`)
- Register new readers (`POST /register_reader`)
- Cancel reader actions (`POST /api/terminal/:id/cannel` - note: typo in route)

### 2. Payment Processing

#### Card Present (Terminal)
- Process payment via terminal (`POST /api/terminal/:id/payment_intent`)
- Card present payment intents with `card_present` payment method type
- Automatic metadata generation for purchases

#### MOTO (Mail Order/Telephone Order)
- Process MOTO payments (`POST /api/terminal/:id/payment_intent_moto`)
- Uses `card` payment method type with MOTO flag

#### Online Payments
- Checkout Sessions (`POST /api/customers/:id/checkout_session`)
- Payment Links with image upload (`POST /api/payment_link`)
- Customer portal sessions (`POST /api/customers/:id/portal_session`)

### 3. Customer Management
- List customers (`GET /api/customers`)
- Create temporary customers (`POST /api/customers`)
- Get customer details with cards (`GET /api/customers/:id`)
- Find customer candidates by card fingerprint (`POST /api/customers/candidates_by_payment_method`)
- Set default payment method (`POST /api/customers/:id/attach_default/:pm_id`)

### 4. Email Collection
- Collect email via terminal reader (`POST /api/terminal/:id/collect_email` or `POST /api/terminal/collect_email`)
- Retrieve collected data (`GET /api/terminal/collected_data`)
- Cancel collection (`POST /api/terminal/cancel_collect_inputs`)
- **Japanese UI**: Email collection uses Japanese text ("メールを登録してください")

### 5. Payment Intent Operations
- Create payment intents (`POST /create_payment_intent`)
- Capture payment intents (`POST /capture_payment_intent`)
- Cancel payment intents (`POST /cancel_payment_intent`)
- Update payment intents (`POST /update_payment_intent`)
- List payment intents by customer (`GET /api/customers/:id/payment_intents`)
- Get recent guest payments (`GET /api/payment_intents/recent_guests`)
- Assign payment intents to customers (`POST /api/payment_intents/assign_customer`)

### 6. Refunds
- Process online refunds (`POST /api/refunds`)
- Requires explicit confirmation flag for safety

### 7. Location Management
- List locations (`GET /list_locations`)
- Create locations (`POST /create_location`)

### 8. Webhook Handling
- Endpoint: `POST /webhook`
- Handles `terminal.reader.action_succeeded` events
- Automatically updates customer email from collected terminal data
- Validates webhook signatures using `STRIPE_ENDPOINT_SECRET`

## Special Features

### Camera Shop Use Case
The application includes a sophisticated metadata generation system for a camera retail scenario:

**Function**: `generate_random_camera_metadata(preferred_brand = nil)` (lines 555-646)

Generates realistic product metadata including:
- **Categories**: Camera, Lens, Film, Accessory
- **Brands**: Canon, Nikon, Sony, Fujifilm, Leica, Olympus, Panasonic, SIGMA, Tamron
- **Locations**: Tokyo, Osaka, Yokohama, Nagoya, Sapporo, Fukuoka
- **Floors**: B1F, 1F, 2F, 3F, 4F, 5F
- Product names, SKUs, descriptions, and placeholder images

**Brand Continuity**:
- Customer metadata can include a preferred brand (`get_customer_brand`)
- Subsequent purchases for that customer will favor that brand
- Updates customer metadata with brand/label on purchase

### Payment Method Fingerprint Matching
**Function**: `find_customer_candidates_by_fingerprint` (lines 430-510)

Sophisticated customer lookup by card fingerprint using multiple strategies:
1. Search API on Charges (primary method)
2. Fallback: Scan recent charges (if search unavailable)
3. Scan recent customers' saved cards

Used for identifying potential duplicate customers or returning customers.

## Important Functions

### Validation
- `validateApiKey` (lines 61-72): Validates Stripe API key format and mode

### Customer Utilities
- `lookupOrCreateExampleCustomer` (lines 246-259): Gets or creates test customer
- `get_customer_brand` (lines 17-32): Retrieves customer's preferred brand from metadata
- `update_customer_with_email` (lines 1427-1436): Updates customer email from collected data
- `update_customer_metadata_with_brand_label` (lines 668-681): Updates customer with purchase metadata

### Metadata Utilities
- `generate_random_camera_metadata` (lines 555-646): Generates product metadata
- `build_purchase_description` (lines 648-666): Creates human-readable description
- `extract_fingerprint_from_payment_method` (lines 410-428): Extracts card fingerprint

### Logging
- `log_info(message)` (lines 51-54): Simple logging helper

## Configuration

### Environment Variables
Required in `.env` file:
- `STRIPE_SECRET_KEY` - Stripe test mode secret key (required)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_ENDPOINT_SECRET` - Webhook signature secret

### Session Configuration
- Sessions enabled (line 8: `enable :sessions`)
- Used to store: `selected_reader_id`

### CORS Configuration
- Enabled for all origins (`Access-Control-Allow-Origin: *`)
- Allows: GET, POST, OPTIONS methods
- Headers: Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token

## Known Issues & Quirks

1. **Typo in route**: `POST /api/terminal/:id/cannel` should be "cancel" (line 986)
2. **No authentication**: All endpoints are public (security warning in README)
3. **Hardcoded return URLs**: Some checkout/portal URLs reference `example-terminal-backend-1.onrender.com`
4. **Japanese language**: Email collection UI and some customer names use Japanese
5. **Example customer email**: Hardcoded to "example@test.com"
6. **Commented API version**: Line 49 has commented Stripe API version

## Frontend Structure

Located in `/client` directory:
- React application with Stripe Components
- Communicates with backend via REST API
- Environment-aware (dev vs production URLs)
- Build configuration handles `REACT_APP_BACKEND_URL`

## Deployment Notes

### Production URLs (from README)
- Frontend: `https://example-terminal-backend-1.onrender.com`
- Backend: `https://example-terminal-backend-l8i6.onrender.com`

### Docker
- Pre-built image: `stripe/example-terminal-backend`
- Port: 4567
- Single environment variable: `STRIPE_TEST_SECRET_KEY`

## Testing & Development

### Running Locally
```bash
# Backend
ruby web.rb

# Frontend
cd client
npm start
```

### API Key Requirements
- Must use **test mode** secret key
- Cannot use publishable key (`pk_`)
- Cannot use live mode key (`sk_live_`)
- Validation occurs on most endpoints via `validateApiKey`

## Code Patterns to Follow

When working with this codebase:

1. **Error Handling**: Always wrap Stripe API calls in `begin/rescue Stripe::StripeError` blocks
2. **Logging**: Use `log_info()` for important events
3. **Status Codes**: Use 402 for Stripe errors, 400 for validation errors
4. **JSON Responses**: Always set `content_type :json` and return `.to_json`
5. **Parameter Parsing**: Use `JSON.parse(request.body.read)` for JSON bodies
6. **Compact Params**: Use `.compact` when building Stripe API parameters
7. **Metadata**: Include descriptive metadata on payment intents and charges

## Webhook Event Handling

Currently handles:
- `terminal.reader.action_succeeded` - Processes collected emails, updates customers
- `payment_method.attached` - Logged but not processed

To add new webhook handlers, add cases to the `case event.type` block (lines 1454-1507).

## API Response Patterns

Most endpoints follow this pattern:
- Success: `status 200` + JSON object
- Stripe Error: `status 402` + error message via `log_info()`
- Validation Error: `status 400` + error message/object

## Multilingual Support

The application includes Japanese language support:
- Customer names default to "仮ユーザー" (temporary user)
- Email collection UI in Japanese (lines 1095-1098)
- Purchase descriptions may include Japanese brand names

## Future Development Considerations

From code comments, these features are NOT currently supported but mentioned:
- Connected accounts (lines 117-119, 142-144)
- Pagination for large location lists (lines 318-321)
- Test mode only (no live mode support)

## Security Notes

From README:
"Note that this backend is intended for example purposes only. Because endpoints are not authenticated, you should not use this backend in production."

All endpoints lack:
- Authentication
- Authorization
- Rate limiting
- Input sanitization beyond basic validation

## Getting Help

When encountering Stripe API issues:
1. Check Stripe Dashboard for detailed error information
2. Verify API key mode (test vs live)
3. Review webhook logs for event processing
4. Check terminal reader status in Stripe Dashboard

## Related Resources

- Stripe Terminal Docs: https://stripe.com/docs/terminal
- iOS SDK: https://github.com/stripe/stripe-terminal-ios
- JavaScript SDK: https://github.com/stripe/stripe-terminal-js-demo
- Android SDK: https://github.com/stripe/stripe-terminal-android
