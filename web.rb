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

def get_customer_brand(customer_id)
  return nil if customer_id.nil? || customer_id.to_s.empty?
  begin
    customer = Stripe::Customer.retrieve(customer_id)
    meta = customer.respond_to?(:metadata) ? customer.metadata : nil
    brand_value = nil
    if meta
      # Stripe metadata behaves like a hash with string keys
      brand_value = meta['brand'] || (meta[:brand] rescue nil)
    end
    return (brand_value && !brand_value.to_s.empty?) ? brand_value : nil
  rescue Stripe::StripeError => e
    log_info("Failed to fetch customer brand: #{e.message}")
    return nil
  end
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
  return Stripe::Customer.list({limit: 30}).to_json
end

def generate_random_japanese_name
  last_names = [
    "佐藤", "鈴木", "高橋", "田中", "渡辺", "伊藤", "山本", "中村", "小林", "加藤",
    "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "山崎",
    "阿部", "森", "池田", "橋本", "石川", "前田", "藤田", "後藤", "斎藤", "長谷川",
    "近藤", "村上", "遠藤", "青木", "坂本", "西村", "福田", "太田", "岡田", "中島"
  ]

  first_names = [
    "太郎", "花子", "一郎", "美咲", "健太", "さくら", "翔太", "愛", "大輔", "優子",
    "修", "由美", "勇", "真由美", "誠", "恵子", "隆", "陽子", "聡", "直子",
    "健", "美香", "明", "京子", "涼", "麻衣", "拓也", "千春", "雄一", "真理子",
    "裕太", "奈々", "翔", "美穂", "剛", "瑞穂", "亮", "友美", "優", "香織"
  ]

  "#{last_names.sample} #{first_names.sample}"
end

post '/api/customers' do
  # Create a temporary/demo customer
  begin
    req = JSON.parse(request.body.read) rescue {}
    name = req['name'] || generate_random_japanese_name
    email = req['email']
    description = req['description'] || 'Temporary customer created from demo'

    customer = Stripe::Customer.create({
      name: name,
      email: email,
      description: description,
      metadata: { temporary: 'true' }
    }.compact)

    status 200
    return customer.to_json
  rescue Stripe::StripeError => e
    status 402
    return { error: e.message }.to_json
  rescue => e
    status 400
    return { error: e.message }.to_json
  end
end

get '/api/customers/:id' do
  cards = Stripe::Customer.list_payment_methods(params[:id], {type: 'card'})
  unique_cards = cards.data.uniq { |card| [card.card.fingerprint] }
  customer = Stripe::Customer.retrieve(params[:id])
  customer['cards'] = unique_cards

  return customer.to_json
end

# Get customer subscriptions
get '/api/customers/:id/subscriptions' do
  begin
    subscriptions = Stripe::Subscription.list({
      customer: params[:id],
      limit: 100
    }, stripe_request_options)

    content_type :json
    return subscriptions.to_json
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error fetching subscriptions: #{e.message}")
  end
end

def extract_fingerprint_from_payment_method(pm)
  begin
    # pm can be an object or id; normalize to object
    pm_obj = pm.is_a?(String) ? Stripe::PaymentMethod.retrieve(pm) : pm
    # Prefer regular card fingerprint
    if pm_obj.respond_to?(:card) && pm_obj.card && pm_obj.card.respond_to?(:fingerprint)
      return pm_obj.card.fingerprint
    end
    # Fallbacks (some present types may not include fingerprint)
    if pm_obj.respond_to?(:card_present) && pm_obj.card_present && pm_obj.card_present.respond_to?(:fingerprint)
      return pm_obj.card_present.fingerprint
    end
  rescue Stripe::StripeError => e
    log_info("Failed to retrieve payment method: #{e.message}")
  rescue => e
    log_info("Unexpected error extracting fingerprint: #{e.message}")
  end
  return nil
end

def find_customer_candidates_by_fingerprint(fingerprint)
  return [] if fingerprint.nil? || fingerprint.to_s.empty?

  candidate_ids = {}

  # 1) Try using Search API on Charges (best-effort)
  begin
    charges_search = Stripe::Charge.search({
      query: "payment_method_details.card.fingerprint:'#{fingerprint}'",
      limit: 20
    })
    charges_search.data.each do |ch|
      if ch.respond_to?(:customer) && ch.customer && !ch.customer.to_s.empty?
        candidate_ids[ch.customer] = true
      end
    end
  rescue Stripe::StripeError => e
    log_info("Charge.search not available or failed: #{e.message}")
  rescue => e
    log_info("Unexpected error during Charge.search: #{e.message}")
  end

  # 2) Fallback: Scan recent charges if search is unavailable
  if candidate_ids.empty?
    begin
      charges = Stripe::Charge.list({ limit: 100 })
      charges.data.each do |ch|
        begin
          pm_details = ch.respond_to?(:payment_method_details) ? ch.payment_method_details : nil
          card = pm_details && pm_details.respond_to?(:card) ? pm_details.card : nil
          fp = card && card.respond_to?(:fingerprint) ? card.fingerprint : nil
          if fp && fp == fingerprint && ch.customer && !ch.customer.to_s.empty?
            candidate_ids[ch.customer] = true
          end
        rescue => e
          # ignore per-charge errors
        end
      end
    rescue Stripe::StripeError => e
      log_info("Charge.list failed: #{e.message}")
    end
  end

  # 3) Also scan a small window of recent customers' saved cards
  begin
    recent_customers = Stripe::Customer.list({ limit: 20 })
    recent_customers.data.each do |cus|
      begin
        pms = Stripe::Customer.list_payment_methods(cus.id, { type: 'card' })
        pms.data.each do |pm|
          card = pm.respond_to?(:card) ? pm.card : nil
          fp = card && card.respond_to?(:fingerprint) ? card.fingerprint : nil
          if fp && fp == fingerprint
            candidate_ids[cus.id] = true
          end
        end
      rescue Stripe::StripeError => e
        # skip this customer on error
      end
    end
  rescue Stripe::StripeError => e
    log_info("Customer.list failed: #{e.message}")
  end

  # Build customer objects (id, name, email) for response
  candidates = []
  candidate_ids.keys.first(20).each do |cid|
    begin
      c = Stripe::Customer.retrieve(cid)
      candidates << {
        id: c.id,
        name: (c.respond_to?(:name) ? c.name : nil),
        email: (c.respond_to?(:email) ? c.email : nil)
      }
    rescue Stripe::StripeError => e
      # skip retrieval errors
    end
  end

  return candidates
end

post '/api/customers/candidates_by_payment_method' do
  begin
    req = JSON.parse(request.body.read) rescue {}
    pm_id = req['payment_method_id'] || req['payment_method'] || req['pm']
    raw_fingerprint = req['fingerprint']
    if (pm_id.nil? || pm_id.to_s.empty?) && (raw_fingerprint.nil? || raw_fingerprint.to_s.empty?)
      status 400
      return({ error: 'payment_method_id or fingerprint is required' }.to_json)
    end

    # Retrieve the payment method to identify its attached customer (if any)
    attached_customer_id = nil
    pm_obj = nil
    if pm_id && !pm_id.to_s.empty?
      begin
        pm_obj = Stripe::PaymentMethod.retrieve(pm_id)
        attached_customer_id = (pm_obj.respond_to?(:customer) ? pm_obj.customer : nil)
      rescue Stripe::StripeError => e
        # proceed without attached_customer_id
      end
    end

    fingerprint = raw_fingerprint || extract_fingerprint_from_payment_method(pm_obj || pm_id)
    if fingerprint.nil?
      status 404
      return({ error: 'Fingerprint not found on payment method' }.to_json)
    end

    candidates = find_customer_candidates_by_fingerprint(fingerprint)
    # Exclude origin customer from results
    exclude_id = req['exclude_customer_id'] || attached_customer_id
    if exclude_id && !exclude_id.to_s.empty?
      candidates = candidates.reject { |c| c[:id] == exclude_id }
    end
    status 200
    content_type :json
    return({ fingerprint: fingerprint, candidates: candidates }.to_json)
  rescue => e
    status 400
    return({ error: e.message }.to_json)
  end
end

def generate_random_camera_metadata(preferred_brand = nil)
  areas = ["東京", "大阪", "横浜", "名古屋", "札幌", "福岡"]
  floors = ["B1F", "1F", "2F", "3F", "4F", "5F"]

  category_options = {
    "家電" => ["スマートフォン", "タブレット", "ノートパソコン", "ヘッドフォン", "スピーカー"],
    "衣料品" => ["Tシャツ", "ジーンズ", "ジャケット", "スニーカー", "ワンピース"],
    "雑貨" => ["ランプ", "クッション", "ラグ", "キャンドル", "植木鉢"],
    "食品" => ["コーヒー", "紅茶", "スナック", "チョコレート", "ジュース"],
  }

  brands = [
    "Apple", "Samsung", "Sony", "ユニクロ", "Nike", "無印良品", "スターバックス", "IKEA", "Panasonic"
  ]

  electronics_by_brand = {
    "Apple" => ["iPhone 15", "iPad Air", "MacBook Pro", "AirPods Pro"],
    "Samsung" => ["Galaxy S24", "Galaxy Tab S9", "Galaxy Buds"],
    "Sony" => ["WH-1000XM5 ヘッドフォン", "SRS-XB43 スピーカー", "Xperia 1 V"],
    "Panasonic" => ["完全ワイヤレスイヤホン", "ポータブルスピーカー"],
  }

  clothing_by_brand = {
    "ユニクロ" => ["ヒートテック Tシャツ", "エアリズムシャツ", "ウルトラライトダウン", "セルビッジジーンズ"],
    "Nike" => ["エアマックス スニーカー", "Dri-FIT Tシャツ", "ランニングシューズ", "スポーツジャケット"],
  }

  home_by_brand = {
    "無印良品" => ["LEDデスクライト", "アロマディフューザー", "収納ボックス", "綿クッション"],
    "IKEA" => ["テーブルランプ", "クッションカバー", "フォトフレーム", "収納バスケット"],
  }

  food_by_brand = {
    "スターバックス" => ["パイクプレイスロースト", "ハウスブレンド", "エスプレッソロースト", "抹茶ラテミックス"],
  }

  generic_items = [
    "ワイヤレスイヤホン", "USB-Cケーブル", "スマホケース", "水筒",
    "トートバッグ", "ノート", "ペンセット", "ハンドクリーム"
  ]

  brand = preferred_brand || brands.sample
  category = category_options.keys.sample
  sku = "SKU-#{SecureRandom.hex(2).upcase}-#{SecureRandom.hex(2).upcase}"

  product_name_core = case category
    when "家電"
      (electronics_by_brand[brand] || ["ワイヤレスヘッドフォン"]).sample
    when "衣料品"
      (clothing_by_brand[brand] || ["コットン Tシャツ"]).sample
    when "雑貨"
      (home_by_brand[brand] || ["デコレーションクッション"]).sample
    when "食品"
      (food_by_brand[brand] || ["挽きたてコーヒー"]).sample
    else
      generic_items.sample
  end

  product_name = brand ? "#{brand} #{product_name_core}" : product_name_core
  product_description = product_name
  image_url = "https://picsum.photos/seed/#{sku}/300/300"

  return {
    area: areas.sample,
    sku: sku,
    floor: floors.sample,
    category: category,
    brand: brand,
    product_name: product_name,
    product_description: product_description,
    product_image: image_url,
    film_name: generic_items.sample,
    accessory_name: generic_items.sample,
  }
end

def build_purchase_description(metadata)
  begin

    brand_value = metadata[:brand] || metadata['brand']
    product_name_value = metadata[:product_name] || metadata['product_name']
    item_name = product_name_value
    if brand_value && item_name && item_name.start_with?("#{brand_value} ")
      item_name = item_name.sub(/^#{Regexp.escape(brand_value)}\s+/, '')
    end
    
    if brand_value && item_name
      return "#{brand_value} #{item_name}"
    else
      return "#{product_name_value}"
    end
  rescue => e
    return '購入'
  end
end

def update_customer_metadata_with_brand_label(customer_id, metadata)
  begin
    return if customer_id.nil? || customer_id.to_s.empty? || metadata.nil?
    brand_value = metadata[:brand] || metadata['brand']
    label_value = metadata[:label] || metadata['label']
    update_meta = {}
    update_meta[:brand] = brand_value if brand_value
    update_meta[:label] = label_value if label_value
    return if update_meta.empty?
    Stripe::Customer.update(customer_id, { metadata: update_meta })
  rescue Stripe::StripeError => e
    log_info("Failed to update customer metadata with brand/label: #{e.message}")
  end
end

post '/api/customers/:id/payment_intent' do
  req = JSON.parse(request.body.read)
  amount = req['amount']
  brand_override = get_customer_brand(params[:id])
  metadata = generate_random_camera_metadata(brand_override)
  description_str = build_purchase_description(metadata)

  payment_intent = Stripe::PaymentIntent.create(
    amount: amount,
    currency: 'jpy',
    customer: params[:id],
    description: description_str,
    metadata: metadata,
  )
  update_customer_metadata_with_brand_label(params[:id], metadata)

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
  pis = Stripe::PaymentIntent.list({
    limit: 10,
    customer: params[:id],
    expand: ['data.latest_charge']
  })

  return pis.to_json
end

get '/api/payment_intents/:id' do
  begin
    pi = Stripe::PaymentIntent.retrieve(id: params[:id], expand: ['payment_method', 'latest_charge'])
  rescue Stripe::StripeError => e
    status 402
    return({ error: e.message }.to_json)
  end

  return pi.to_json
end

get '/api/payment_intents/recent_guests' do
  begin
    list = Stripe::PaymentIntent.list({ limit: 50, expand: ['data.latest_charge'] })
    guests = list.data.select { |pi| pi.customer.nil? }
    guests_sorted = guests.sort_by { |pi| - (pi.created || 0) }
    recent3 = guests_sorted.first(3)
    status 200
    content_type :json
    return({ data: recent3 }.to_json)
  rescue Stripe::StripeError => e
    status 402
    return({ error: e.message }.to_json)
  end
end

post '/api/payment_intents/assign_customer' do
  begin
    req = JSON.parse(request.body.read) rescue {}

    # Mode A: Array-based assignment (backwards compatible)
    target_customer_id = req['customer_id'] || params[:customer_id]
    pi_ids = req['payment_intent_ids'] || req['payment_intents'] || req['pis']

    # Mode B: Move all PIs from a source customer to a target customer
    source_customer_id = req['source_customer_id'] || params[:source_customer_id]
    target_customer_id ||= (req['target_customer_id'] || params[:target_customer_id])

    # Determine operation mode
    if (source_customer_id && target_customer_id)
      # Move all PIs linked to source -> target
      updated = []
      failed = []
      begin
        # Retrieve PaymentIntents for the source customer (paginate if needed)
        starting_after = nil
        loop do
          list = Stripe::PaymentIntent.list({
            limit: 100,
            customer: source_customer_id
          }.compact.merge(starting_after ? { starting_after: starting_after } : {}))

          list.data.each do |pi|
            begin
              upd = Stripe::PaymentIntent.update(pi.id, { customer: target_customer_id })
              updated << { id: upd.id, customer: upd.customer }
            rescue Stripe::StripeError => e
              failed << { id: pi.id, error: e.message }
            rescue => e
              failed << { id: pi.id, error: e.message }
            end
          end

          break unless list.has_more
          starting_after = list.data.last.id
        end
      rescue Stripe::StripeError => e
        status 402
        return({ error: e.message }.to_json)
      end

      status 200
      content_type :json
      return({ source_customer_id: source_customer_id, target_customer_id: target_customer_id, updated: updated, failed: failed }.to_json)
    else
      # Fallback to array-based behavior
      pi_ids = pi_ids.is_a?(Array) ? pi_ids.compact.map(&:to_s).reject(&:empty?) : []
      if target_customer_id.nil? || target_customer_id.to_s.empty? || pi_ids.empty?
        status 400
        return({ error: 'Provide source_customer_id+target_customer_id OR customer_id+payment_intent_ids[]' }.to_json)
      end

      updated = []
      failed = []
      pi_ids.each do |pi_id|
        begin
          pi = Stripe::PaymentIntent.update(pi_id, { customer: target_customer_id })
          updated << { id: pi.id, customer: pi.customer }
        rescue Stripe::StripeError => e
          failed << { id: pi_id, error: e.message }
        rescue => e
          failed << { id: pi_id, error: e.message }
        end
      end

      status 200
      content_type :json
      return({ customer_id: target_customer_id, updated: updated, failed: failed }.to_json)
    end
  rescue => e
    status 400
    return({ error: e.message }.to_json)
  end
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
        status: params[:status],
        expand: ['data.location']
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
  return Stripe::Terminal::Reader.retrieve(id: params[:id], expand: ['location']).to_json
end

post '/api/terminal/:id/cannel' do
  return Stripe::Terminal::Reader.cancel_action(params[:id]).to_json
end

post '/api/terminal/:id/payment_intent' do
  req = JSON.parse(request.body.read)
  customer = req['customer']
  amount = req['amount']

  brand_override = get_customer_brand(customer)
  metadata = generate_random_camera_metadata(brand_override)
  description_str = build_purchase_description(metadata)

  intent = Stripe::PaymentIntent.create({
    currency: 'jpy',
    customer: customer,
    payment_method_types: ['card_present'],
    amount: amount,
    setup_future_usage: "off_session",
    description: description_str,
    metadata: metadata,
  })
  update_customer_metadata_with_brand_label(customer, metadata)

  process = Stripe::Terminal::Reader.process_payment_intent(params[:id], {payment_intent: intent.id, process_config: {allow_redisplay: 'always'}})
  content_type :json
  return({ payment_intent_id: intent.id, process: process }).to_json
end

post '/api/terminal/:id/payment_intent_moto' do
  req = JSON.parse(request.body.read)
  customer = req['customer']
  amount = req['amount']

  brand_override = get_customer_brand(customer)
  metadata = generate_random_camera_metadata(brand_override)
  description_str = build_purchase_description(metadata)

  intent = Stripe::PaymentIntent.create({
    currency: 'jpy',
    customer: customer,
    payment_method_types: ['card'],
    amount: amount,
    setup_future_usage: 'off_session',
    description: description_str,
    metadata: metadata
  })
  update_customer_metadata_with_brand_label(customer, metadata)

  process = Stripe::Terminal::Reader.process_payment_intent(params[:id], {payment_intent: intent.id, process_config: {allow_redisplay: 'always', moto: true}})
  content_type :json
  return({ payment_intent_id: intent.id, process: process }).to_json
end

# This endpoint performs an online refund (non-terminal) for a PaymentIntent or Charge
post '/api/refunds' do
  begin
    req = JSON.parse(request.body.read) rescue {}

    refund_params = {}
    if req['payment_intent']
      refund_params[:payment_intent] = req['payment_intent']
    elsif req['charge']
      refund_params[:charge] = req['charge']
    else
      status 400
      return({ error: 'payment_intent or charge is required' }.to_json)
    end

    if req['amount']
      refund_params[:amount] = req['amount'].to_i
    end

    # Require explicit confirmation to execute the refund
    unless req['confirm'] == true
      status 400
      return({ error: 'Confirmation required. Pass {"confirm": true} to execute refund.', params: refund_params }.to_json)
    end

    refund = Stripe::Refund.create(refund_params)
  rescue Stripe::StripeError => e
    status 402
    return log_info("Error creating refund! #{e.message}")
  end

  log_info("Refund created: #{refund.id}")
  status 200
  return refund.to_json
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


# Create a Checkout Session with specified customer and amount
# Mirrors Terminal PaymentIntent metadata behavior
post '/api/customers/:id/checkout_session' do
  req = JSON.parse(request.body.read) rescue {}
  amount = (req['amount'] || 0).to_i
  customer_id = params[:id]

  begin
    brand_override = get_customer_brand(customer_id)
    metadata = generate_random_camera_metadata(brand_override)
    description_str = build_purchase_description(metadata)

    session = Stripe::Checkout::Session.create(
      mode: 'payment',
      customer: customer_id,
      success_url: 'https://example-terminal-backend-1.onrender.com/',
      cancel_url: 'https://example-terminal-backend-1.onrender.com/',
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount,
          product_data: { name: description_str }
        },
        quantity: 1
      }],
      metadata: metadata,
      payment_intent_data: {
        description: description_str,
        metadata: metadata,
        setup_future_usage: 'off_session'
      }
    )

    update_customer_metadata_with_brand_label(customer_id, metadata)

    content_type :json
    { id: session.id, url: session.url }.to_json
  rescue Stripe::StripeError => e
    status 400
    { error: e.message }.to_json
  rescue => e
    status 500
    { error: "An unexpected error occurred: #{e.message}" }.to_json
  end
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
