require 'sinatra'
require 'stripe'
require 'dotenv'
require 'json'
require 'sinatra/cross_origin'
require 'securerandom'

enable :sessions

# Browsers require that external servers enable CORS when the server is at a different origin than the website.
# https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
# This enables the requires CORS headers to allow the browser to make the requests from the JS Example App.
configure do
  enable :cross_origin
end

before do
  response.headers['Access-Control-Allow-Origin'] = '*'
end

options "*" do
  response.headers["Allow"] = "GET, POST, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token"
  response.headers["Access-Control-Allow-Origin"] = "*"
  200
end

Dotenv.load
Stripe.api_key = ENV['STRIPE_SECRET_KEY']
endpoint_secret = ENV['STRIPE_ENDPOINT_SECRET']

#Stripe.api_version = '2024-04-10; custom_checkout_beta=v1'

def log_info(message)
  puts "\n" + message + "\n\n"
  return message
end

get '/' do
  status 200
  send_file 'index.html'
end

def validateApiKey
  if Stripe.api_key.nil? || Stripe.api_key.empty?
    return "Error: you provided an empty secret key. Please provide your test mode secret key. For more information, see https://stripe.com/docs/keys"
  end
  if Stripe.api_key.start_with?('pk')
    return "Error: you used a publishable key to set up the example backend. Please use your test mode secret key. For more information, see https://stripe.com/docs/keys"
  end
  if Stripe.api_key.start_with?('sk_live')
    return "Error: you used a live mode secret key to set up the example backend. Please use your test mode secret key. For more information, see https://stripe.com/docs/keys#test-live-modes"
  end
  return nil
end


get '/token' do
  return {
    public_key: ENV['STRIPE_PUBLISHABLE_KEY'] 
  }.to_json
end

# This endpoint registers a Verifone P400 reader to your Stripe account.
# https://stripe.com/docs/terminal/readers/connecting/verifone-p400#register-reader
post '/register_reader' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    reader = Stripe::Terminal::Reader.create(
      :registration_code => params[:registration_code],
      :label => params[:label],
      :location => params[:location]
    )
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error registering reader! #{e.message}")
  end

  log_info("Reader registered: #{reader.id}")

  status 200
  # Note that returning the Stripe reader object directly creates a dependency between your
  # backend's Stripe.api_version and your clients, making future upgrades more complicated.
  # All clients must also be ready for backwards-compatible changes at any time:
  # https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible
  return reader.to_json
end

# This endpoint creates a ConnectionToken, which gives the SDK permission
# to use a reader with your Stripe account.
# https://stripe.com/docs/terminal/sdk/js#connection-token
# https://stripe.com/docs/terminal/sdk/ios#connection-token
# https://stripe.com/docs/terminal/sdk/android#connection-token
#
# The example backend does not currently support connected accounts.
# To create a ConnectionToken for a connected account, see
# https://stripe.com/docs/terminal/features/connect#direct-connection-tokens
post '/connection_token' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    token = Stripe::Terminal::ConnectionToken.create
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating ConnectionToken! #{e.message}")
  end

  content_type :json
  status 200
  return {:secret => token.secret}.to_json
end

# This endpoint creates a PaymentIntent.
# https://stripe.com/docs/terminal/payments#create
#
# The example backend does not currently support connected accounts.
# To create a PaymentIntent for a connected account, see
# https://stripe.com/docs/terminal/features/connect#direct-payment-intents-server-side
post '/create_payment_intent' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    payment_intent = Stripe::PaymentIntent.create(
      :payment_method_types => params[:payment_method_types] || ['card_present'],
      :capture_method => params[:capture_method] || 'manual',
      :amount => params[:amount],
      :currency => params[:currency] || 'jpy',
      :description => params[:description] || 'Example PaymentIntent',
      :payment_method_options => params[:payment_method_options] || [],
      :receipt_email => params[:receipt_email],
    )
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating PaymentIntent! #{e.message}")
  end

  log_info("PaymentIntent successfully created: #{payment_intent.id}")
  status 200
  return {:intent => payment_intent.id, :secret => payment_intent.client_secret}.to_json
end

# This endpoint captures a PaymentIntent.
# https://stripe.com/docs/terminal/payments#capture
post '/capture_payment_intent' do
  begin
    id = params["payment_intent_id"]
    payment_intent = Stripe::PaymentIntent.capture(id)
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error capturing PaymentIntent! #{e.message}")
  end

  log_info("PaymentIntent successfully captured: #{id}")
  # Optionally reconcile the PaymentIntent with your internal order system.
  status 200
  return {:intent => payment_intent.id, :secret => payment_intent.client_secret}.to_json
end

# This endpoint cancels a PaymentIntent.
# https://stripe.com/docs/api/payment_intents/cancel
post '/cancel_payment_intent' do
  begin
    id = params["payment_intent_id"]
    payment_intent = Stripe::PaymentIntent.cancel(id)
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error canceling PaymentIntent! #{e.message}")
  end

  log_info("PaymentIntent successfully canceled: #{id}")
  # Optionally reconcile the PaymentIntent with your internal order system.
  status 200
  return {:intent => payment_intent.id, :secret => payment_intent.client_secret}.to_json
end

# This endpoint creates a SetupIntent.
# https://stripe.com/docs/api/setup_intents/create
post '/create_setup_intent' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    setup_intent_params = {
      :payment_method_types => params[:payment_method_types] || ['card_present'],
    }

    if !params[:customer].nil?
      setup_intent_params[:customer] = params[:customer]
    end

    if !params[:description].nil?
      setup_intent_params[:description] = params[:description]
    end

    if !params[:on_behalf_of].nil?
      setup_intent_params[:on_behalf_of] = params[:on_behalf_of]
    end

    setup_intent = Stripe::SetupIntent.create(setup_intent_params)

  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating SetupIntent! #{e.message}")
  end

  log_info("SetupIntent successfully created: #{setup_intent.id}")
  status 200
  return {:intent => setup_intent.id, :secret => setup_intent.client_secret}.to_json
end

# Looks up or creates a Customer on your stripe account
# with email "example@test.com".
def lookupOrCreateExampleCustomer
  customerEmail = "example@test.com"
  begin
    customerList = Stripe::Customer.list(email: customerEmail, limit: 1).data
    if (customerList.length == 1)
      return customerList[0]
    else
      return Stripe::Customer.create(email: customerEmail)
    end
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating or retreiving customer! #{e.message}")
  end
end

# This endpoint attaches a PaymentMethod to a Customer.
# https://stripe.com/docs/terminal/payments/saving-cards#read-reusable-card
post '/attach_payment_method_to_customer' do
  begin
    customer = lookupOrCreateExampleCustomer

    payment_method = Stripe::PaymentMethod.attach(
      params[:payment_method_id],
      {
        customer: customer.id,
        expand: ["customer"],
    })
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error attaching PaymentMethod to Customer! #{e.message}")
  end

  log_info("Attached PaymentMethod to Customer: #{customer.id}")

  status 200
  # Note that returning the Stripe payment_method object directly creates a dependency between your
  # backend's Stripe.api_version and your clients, making future upgrades more complicated.
  # All clients must also be ready for backwards-compatible changes at any time:
  # https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible
  return payment_method.to_json
end

# This endpoint updates the PaymentIntent represented by 'payment_intent_id'.
# It currently only supports updating the 'receipt_email' property.
#
# https://stripe.com/docs/api/payment_intents/update
post '/update_payment_intent' do
  payment_intent_id = params["payment_intent_id"]
  if payment_intent_id.nil?
    status 400
    return log_info("'payment_intent_id' is a required parameter")
  end

  begin
    allowed_keys = ["receipt_email"]
    update_params = params.select { |k, _| allowed_keys.include?(k) }

    payment_intent = Stripe::PaymentIntent.update(
      payment_intent_id,
      update_params
    )

    log_info("Updated PaymentIntent #{payment_intent_id}")
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error updating PaymentIntent #{payment_intent_id}. #{e.message}")
  end

  status 200
  return {:intent => payment_intent.id, :secret => payment_intent.client_secret}.to_json
end

# This endpoint lists the first 100 Locations. If you will have more than 100
# Locations, you'll likely want to implement pagination in your application so that
# you can efficiently fetch Locations as needed.
# https://stripe.com/docs/api/terminal/locations
get '/list_locations' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    locations = Stripe::Terminal::Location.list(
      limit: 100
    )
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error fetching Locations! #{e.message}")
  end

  log_info("#{locations.data.size} Locations successfully fetched")

  status 200
  content_type :json
  return locations.data.to_json
end

# This endpoint creates a Location.
# https://stripe.com/docs/api/terminal/locations
post '/create_location' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    location = Stripe::Terminal::Location.create(
      display_name: params[:display_name],
      address: params[:address]
    )
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating Location! #{e.message}")
  end

  log_info("Location successfully created: #{location.id}")

  status 200
  content_type :json
  return location.to_json
end

get '/api/customers' do
  return Stripe::Customer.list({limit: 5}).to_json
end

get '/api/customers/:id' do
  cards = Stripe::Customer.list_payment_methods(params[:id], {type: 'card'})
  unique_cards = cards.data.uniq { |card| [card.card.fingerprint] }
  customer = Stripe::Customer.retrieve(params[:id])
  customer['cards'] = unique_cards

  return customer.to_json
end

post '/api/customers/:id/payment_intent' do
  req = JSON.parse(request.body.read)
  amount = req['amount']

  # Generate randomized, camera-focused metadata
  areas = ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"]
  shops = ["shinjuku", "shibuya", "ikebukuro", "umeda", "sakae", "tenjin"]
  floors = ["B1F", "1F", "2F", "3F", "4F", "5F"]

  category_options = {
    "Camera" => ["Mirrorless", "DSLR", "Compact", "Rangefinder"],
    "Lens" => ["Zoom", "Prime", "Macro", "Telephoto"],
    "Film" => ["Color", "Black & White", "Cine"],
    "Accessory" => ["Tripod", "Bag", "Memory Card", "Flash", "Filter", "Battery", "Mic", "Strap"],
  }

  brands = [
    "Canon", "Nikon", "Sony", "Fujifilm", "Leica", "Olympus", "Panasonic", "SIGMA", "Tamron"
  ]

  camera_models_by_brand = {
    "Canon" => ["EOS R6 Mark II", "EOS R10", "EOS R5"],
    "Nikon" => ["Z6 II", "Z fc", "Z8"],
    "Sony" => ["α7 IV", "ZV-E10", "α7C II"],
    "Fujifilm" => ["X-T5", "X100V", "X-S20"],
    "Leica" => ["Q3", "M11", "SL2"],
    "Olympus" => ["OM-1", "E-M10 Mark IV"],
    "Panasonic" => ["LUMIX S5 II", "LUMIX G9 II"],
  }

  lenses_by_brand = {
    "Canon" => ["RF 24-70mm F2.8", "RF 50mm F1.8"],
    "Nikon" => ["Z 24-120mm F4", "Z 50mm F1.8"],
    "Sony" => ["FE 24-105mm F4", "FE 35mm F1.8"],
    "SIGMA" => ["24-70mm F2.8 DG DN", "35mm F1.4 DG DN"],
    "Tamron" => ["28-75mm F2.8 G2", "70-180mm F2.8"],
    "Fujifilm" => ["XF 23mm F1.4", "XF 56mm F1.2"],
    "Panasonic" => ["S 50mm F1.8", "S 24-105mm F4"],
  }

  film_names = [
    "Kodak Portra 400", "Kodak Tri-X 400", "Fujifilm Superia 400",
    "Ilford HP5+", "Fujifilm Pro 400H", "Cinestill 800T"
  ]

  accessories = [
    "Manfrotto Tripod", "SanDisk SDXC 128GB", "Peak Design Camera Strap",
    "Lowepro Camera Bag", "Godox V1 Flash", "Rode VideoMicro Mic",
    "Anker Battery Pack", "Kenko UV Filter 67mm"
  ]

  brand = brands.sample
  category = category_options.keys.sample
  sub_category = category_options[category].sample
  sku = "SKU-#{SecureRandom.hex(2).upcase}-#{SecureRandom.hex(2).upcase}"

  # Derive product name based on category
  product_name_core = case category
    when "Camera"
      (camera_models_by_brand[brand] || ["Mirrorless Camera"]).sample
    when "Lens"
      (lenses_by_brand[brand] || ["50mm F1.8"]).sample
    when "Film"
      film = film_names.sample
      brand = film.split.first # Align brand with film brand (e.g., Kodak, Fujifilm, Ilford)
      film
    when "Accessory"
      accessories.sample
    else
      "Camera Item"
  end

  product_name = brand ? "#{brand} #{product_name_core}" : product_name_core
  product_description = "#{product_name} (#{sub_category})"
  image_url = "https://picsum.photos/seed/#{sku}/300/300"
  film_name_value = film_names.sample
  accessory_name_value = accessories.sample

  payment_intent = Stripe::PaymentIntent.create(
    amount: amount,
    currency: 'jpy',
    customer: params[:id],
    metadata: {
      shop_id: shops.sample,
      area: areas.sample,
      sku: sku,
      floor: floors.sample,
      category: category,
      sub_category: sub_category,
      brand: brand,
      product_name: product_name,
      product_description: product_description,
      product_image: image_url,
      film_name: film_name_value,
      accessory_name: accessory_name_value,
    }
  )

  {
    id: payment_intent.id,
    clientSecret: payment_intent.client_secret,
    status: payment_intent.status
  }.to_json
end

post '/api/customers/:id/payment_intent/:pm' do
  payment_intent = Stripe::PaymentIntent.create(
    amount: 1000,
    currency: 'jpy',
    customer: params[:id],
    payment_method: params[:pm],
    #confirm: params[:confirm] || false
  )

  {
    clientSecret: payment_intent.client_secret,
    status: payment_intent.status
  }.to_json
end

post '/api/customers/:id/session' do
  secret = Stripe::CustomerSession.create({
    customer: params[:id],
    components: {pricing_table: {enabled: true}},
  })

  return secret.to_json
end

post '/api/customers/:id/portal_session' do
  session = Stripe::BillingPortal::Session.create({
    customer: params[:id],
    return_url: "https://example-terminal-backend-1.onrender.com/customers/#{params[:id]}/portal",
  })
  return session.to_json
end

get '/api/customers/:id/payment_intents' do
  pis = Stripe::PaymentIntent.list({limit: 10, customer: params[:id]})

  return pis.to_json
end

get '/api/payment_intents/:id' do
  pi = Stripe::PaymentIntent.retrieve(params[:id])

  return pi.to_json
end

post '/api/customers/:id/attach_default/:pm_id' do
  customer = Stripe::Customer.update(params[:id], {invoice_settings: {default_payment_method: params[:pm_id]}})
  cards = Stripe::Customer.list_payment_methods(params[:id], {type: 'card'})
  unique_cards = cards.data.uniq { |card| [card.card.fingerprint] }
  customer['cards'] = unique_cards
  return customer.to_json
end

post '/api/customers/:id/payment_intents/:pi_id/confirm' do
  customer = Stripe::Customer.retrieve(params[:id])
  return "error" if customer.nil? or customer.invoice_settings.default_payment_method.nil?

  pi = Stripe::PaymentIntent.confirm(params[:pi_id],
                                     {
                                       payment_method: customer.invoice_settings.default_payment_method,
                                       return_url: 'https://www.example.com',
                                     })

  return pi.to_json
end

# This endpoint retrieves a list of Terminal Readers
get '/api/terminal/readers' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    readers = Stripe::Terminal::Reader.list(
      {
        limit: params[:limit] || 100,
        device_type: params[:device_type],
        location: params[:location],
        serial_number: params[:serial_number],
        status: params[:status]
      }.compact
    )
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error retrieving terminal readers! #{e.message}")
  end

  log_info("Retrieved #{readers.data.length} terminal readers")
  content_type :json
  status 200
  return readers.to_json
end

# This endpoint sets the selected terminal reader in session
post '/api/terminal/select' do
  begin
    # Parse JSON request body
    req = JSON.parse(request.body.read) rescue {}
    reader_id = req['reader_id']
    
    if reader_id.nil? || reader_id.empty?
      status 400
      return { error: 'reader_id is required' }.to_json
    end

    # Validate that the reader exists and is accessible
    reader = Stripe::Terminal::Reader.retrieve(reader_id)
    
    # Store the selected reader in session
    session[:selected_reader_id] = reader_id
    
    log_info("Selected terminal reader: #{reader_id}")
    content_type :json
    status 200
    return { reader_id: reader_id, status: 'selected' }.to_json
    
  rescue JSON::ParserError => e
    status 400
    return { error: 'Invalid JSON in request body' }.to_json
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error selecting terminal reader! #{e.message}")
  end
end

# This endpoint gets the currently selected terminal reader from session
get '/api/terminal/selected' do
  reader_id = session[:selected_reader_id]
  
  if reader_id.nil?
    content_type :json
    status 200
    return { reader_id: nil, status: 'none_selected' }.to_json
  end

  begin
    # Validate that the reader still exists
    reader = Stripe::Terminal::Reader.retrieve(reader_id)
    
    content_type :json
    status 200
    return { 
      reader_id: reader_id, 
      reader: reader,
      status: 'selected' 
    }.to_json
    
  rescue Stripe::StripeError => e
    # Reader no longer exists, clear from session
    session[:selected_reader_id] = nil
    status 404
    return { error: 'Selected reader no longer exists' }.to_json
  end
end

# This endpoint clears the selected terminal reader from session
post '/api/terminal/clear' do
  begin
    session[:selected_reader_id] = nil
    
    log_info("Terminal selection cleared from session")
    content_type :json
    status 200
    return { status: 'cleared', message: 'Terminal selection has been cleared' }.to_json
    
  rescue => e
    status 500
    return { error: 'Failed to clear terminal selection' }.to_json
  end
end

get '/api/terminal/:id' do
  return Stripe::Terminal::Reader.retrieve(params[:id]).to_json
end

post '/api/terminal/:id/cannel' do
  return Stripe::Terminal::Reader.cancel_action(params[:id]).to_json
end

post '/api/terminal/:id/payment_intent' do
  req = JSON.parse(request.body.read)
  customer = req['customer']
  amount = req['amount']

  intent = Stripe::PaymentIntent.create({
    currency: 'jpy',
    customer: customer,
    payment_method_types: ['card_present'],
    amount: amount,
    setup_future_usage: "off_session",
  })

  process = Stripe::Terminal::Reader.process_payment_intent(params[:id], {payment_intent: intent.id, process_config: {allow_redisplay: 'always'}})
  return process.to_json
end

# This endpoint initiates collecting email input from the terminal reader
# https://docs.stripe.com/terminal/features/collect-inputs
post '/api/terminal/:id/collect_email' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  # Parse request body to get customer_id
  req = JSON.parse(request.body.read) rescue {}
  customer_id = req['customer_id']

  begin
    # Collect email input from the terminal reader with customer metadata
    collect_inputs_params = {
      inputs: [{
        type: 'email',
        custom_text: {
          title: 'メールを登録してください',
          description: '会員登録をして、特典をお送りします。',
          submit_button: 'Submit',
          skip_button: 'Skip',
        },
        required: false,
      }]
    }

    # Add customer_id to metadata if provided
    if customer_id
      collect_inputs_params[:metadata] = { customer_id: customer_id }
    end

    collect_inputs = Stripe::Terminal::Reader.collect_inputs(
      params[:id],
      collect_inputs_params
    )
    p collect_inputs
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error collecting email input! #{e.message}")
  end

  log_info("Email collection initiated on reader: #{params[:id]} for customer: #{customer_id}")
  status 200
  return collect_inputs.to_json
end

# This endpoint retrieves the collected input results from the terminal reader
# https://docs.stripe.com/terminal/features/collect-inputs
get '/api/terminal/:id/collected_data' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    # Retrieve the reader to get the collected data
    reader = Stripe::Terminal::Reader.retrieve(params[:id])
    
    # Check if there's any collected data in the reader's action
    if reader.action && reader.action.type == 'collect_inputs'
      collected_data = reader.action.collect_inputs
      log_info("Retrieved collected data from reader: #{params[:id]}")
      status 200
      return collected_data.to_json
    else
      status 404
      return log_info("No collected data found for reader: #{params[:id]}")
    end
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error retrieving collected data! #{e.message}")
  end
end

# This endpoint cancels the current collect inputs action on the terminal reader
post '/api/terminal/:id/cancel_collect_inputs' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  begin
    # Cancel the current action on the reader
    cancel_result = Stripe::Terminal::Reader.cancel_action(params[:id])
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error canceling collect inputs! #{e.message}")
  end

  log_info("Collect inputs canceled on reader: #{params[:id]}")
  status 200
  return cancel_result.to_json
end

# Convenience endpoint that uses the selected terminal reader from session for collecting email
post '/api/terminal/collect_email' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  # Get selected reader from session
  reader_id = session[:selected_reader_id]
  if reader_id.nil?
    status 400
    return { error: 'No terminal reader selected. Please select a reader first.' }.to_json
  end

  # Parse request body to get customer_id
  req = JSON.parse(request.body.read) rescue {}
  customer_id = req['customer_id']

  begin
    # Collect email input from the selected terminal reader
    collect_inputs_params = {
      inputs: [{
        type: 'email',
        custom_text: {
          title: 'メールを登録してください',
          description: '会員登録をして、特典をお送りします。',
          submit_button: 'Submit',
          skip_button: 'Skip',
        },
        required: false,
      }]
    }

    # Add customer_id to metadata if provided
    if customer_id
      collect_inputs_params[:metadata] = { customer_id: customer_id }
    end

    collect_inputs = Stripe::Terminal::Reader.collect_inputs(
      reader_id,
      collect_inputs_params
    )
    
    log_info("Email collection initiated on selected reader: #{reader_id} for customer: #{customer_id}")
    status 200
    return collect_inputs.to_json
    
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error collecting email input on selected reader! #{e.message}")
  end
end

# Convenience endpoint that uses the selected terminal reader from session for getting collected data
get '/api/terminal/collected_data' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  # Get selected reader from session
  reader_id = session[:selected_reader_id]
  if reader_id.nil?
    status 400
    return { error: 'No terminal reader selected. Please select a reader first.' }.to_json
  end

  begin
    # Retrieve the reader to get the collected data
    reader = Stripe::Terminal::Reader.retrieve(reader_id)
    
    # Check if there's any collected data in the reader's action
    if reader.action && reader.action.type == 'collect_inputs'
      collected_data = reader.action.collect_inputs
      log_info("Retrieved collected data from selected reader: #{reader_id}")
      status 200
      return collected_data.to_json
    else
      status 404
      return log_info("No collected data found for selected reader: #{reader_id}")
    end
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error retrieving collected data from selected reader! #{e.message}")
  end
end

# Convenience endpoint that uses the selected terminal reader from session for canceling collect inputs
post '/api/terminal/cancel_collect_inputs' do
  validationError = validateApiKey
  if !validationError.nil?
    status 400
    return log_info(validationError)
  end

  # Get selected reader from session
  reader_id = session[:selected_reader_id]
  if reader_id.nil?
    status 400
    return { error: 'No terminal reader selected. Please select a reader first.' }.to_json
  end

  begin
    # Cancel the current action on the selected reader
    cancel_result = Stripe::Terminal::Reader.cancel_action(reader_id)
    
    log_info("Collect inputs canceled on selected reader: #{reader_id}")
    status 200
    return cancel_result.to_json
    
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error canceling collect inputs on selected reader! #{e.message}")
  end
end


post '/api/custom_checkout' do
  # セッションを作成する
  session = Stripe::Checkout::Session.create(
    line_items: [
      {
        price: 'price_1PR4FZEzgtKktpOyE7hJ0ZLR',
        quantity: 1,
      }
    ],
    allow_promotion_codes: true,
    mode: 'payment',
    ui_mode: 'custom',
    return_url: 'https://your_return_url.com'
  )

  # JSON形式でクライアントに返す
  content_type :json
  { clientSecret: session.client_secret }.to_json
end


post '/api/payment_link' do
  if request.media_type == 'multipart/form-data'
    amount = params[:amount]
    product_name = params[:product_name]
    file = params[:file]
    metadata = JSON.parse(params[:metadata])
  else
    # JSON データの処理（既存のコード）
    req = JSON.parse(request.body.read)
    amount = req['amount']
    product_name = req['product_name']
    metadata = req['metadata']
    file = nil
  end

  begin
    stripe_file = nil
    if file && file[:tempfile]
      # Stripeにファイルをアップロード
      stripe_file = Stripe::File.create(
        {
          purpose: 'business_logo',
          file: File.new(file[:tempfile])
        }
      )
      unless stripe_file.nil?
        stripe_file_link = Stripe::FileLink.create(file: stripe_file.id)
      end
    end

    # 支払いリンクを作成する
    product = Stripe::Product.create(
      name: product_name,
      default_price_data: {
        currency: 'jpy',
        unit_amount: amount.to_i,
      },
      images: stripe_file_link ? [stripe_file_link.url] : nil
    )

    link = Stripe::PaymentLink.create(
      line_items: [{
        price: product.default_price,
        quantity: 1,
      }],
      metadata: metadata,
      payment_intent_data: {
        metadata: metadata
      }
    )

    content_type :json
    { url: link.url }.to_json
  rescue Stripe::StripeError => e
    status 400
    { error: e.message }.to_json
  rescue => e
    status 500
    { error: "An unexpected error occurred: #{e.message}" }.to_json
  end
end



# Helper method to update customer with collected email
def update_customer_with_email(customer_id, email)
  begin
    customer = Stripe::Customer.update(customer_id, { email: email })
    log_info("Updated customer #{customer_id} with email: #{email}")
    return customer
  rescue Stripe::StripeError => e
    log_info("Error updating customer #{customer_id} with email: #{e.message}")
    return nil
  end
end

post '/webhook' do
  payload = request.body.read
  event = nil
  sig_header = request.env['HTTP_STRIPE_SIGNATURE']

  begin
    event = Stripe::Webhook.construct_event(
      payload, sig_header, endpoint_secret
    )
  rescue JSON::ParserError => e
    # Invalid payload
    status 400
    return
  end

  # Handle the event
  case event.type
  when 'terminal.reader.action_succeeded'
    reader = event.data.object # contains a Stripe::Terminal::Reader
    log_info("Terminal reader action succeeded: #{reader.id}")
    
    # Check if this is a collect_inputs action
    if reader.action && reader.action.type == 'collect_inputs'
      action_data = reader.action.collect_inputs
      
      # Check if we have metadata with customer_id
      if action_data.metadata && action_data.metadata.customer_id
        customer_id = action_data.metadata.customer_id
        
        # Look for email input in the collected inputs
        if action_data.inputs && action_data.inputs.length > 0
          email_input = action_data.inputs.find { |input| input.type == 'email' }
          
          if email_input && email_input.email && email_input.email.value
            collected_email = email_input.email.value
            log_info("Collected email: #{collected_email} for customer: #{customer_id}")
            
            # Update the customer with the collected email
            updated_customer = update_customer_with_email(customer_id, collected_email)
            
            if updated_customer
              log_info("Successfully updated customer #{customer_id} with collected email")
            else
              log_info("Failed to update customer #{customer_id} with collected email")
            end
          else
            log_info("No email value found in collected inputs")
          end
        else
          log_info("No inputs found in collect_inputs action")
        end
      else
        log_info("No customer_id found in metadata")
      end
    else
      log_info("Action type is not collect_inputs: #{reader.action&.type}")
    end
    
    # Print the full reader object for debugging
    p reader
    
  when 'payment_method.attached'
    payment_method = event.data.object # contains a Stripe::PaymentMethod
    log_info("Payment method attached: #{payment_method.id}")
    # Then define and call a method to handle the successful attachment of a PaymentMethod.
    # handle_payment_method_attached(payment_method)
  # ... handle other event types
  else
    log_info("Unhandled event type: #{event.type}")
  end

  status 200
end
