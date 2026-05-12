// Products
export const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid' },
  { id: 'milk', label: 'Milk', icon: 'bottle-tonic' },
  { id: 'ghee', label: 'Ghee', icon: 'jar' },
];

export const PRODUCTS = [
  {
    id: 'p1',
    name: 'Pench 1 Litre Milk',
    category: 'milk',
    price: 80,
    unit: '1 Litre',
    mrp: 80,
    discount: 0,
    rating: 4.8,
    reviewCount: 324,
    image: 'https://penchfoods.com/wp-content/uploads/2020/08/Untitled-design-17-480x480.png',
    badge: 'BESTSELLER',
    badgeColor: '#F9A825',
    description:
      'Pure Pench A2 milk from healthy Desi Gir cows, delivered farm-fresh across Nagpur. Naturally nutritious, chemical-free, and packed for daily family use.',
    highlights: ['A2 Beta-Casein', 'Farm-to-Home', 'Glass Bottle', 'No Preservatives'],
    isAvailable: true,
    deliveryTime: '6 AM - 8 AM',
    subscriptionAvailable: true,
    skus: [
      { id: 's1a', label: '1 Litre', price: 80, mrp: 80 },
    ],
    nutritionPer100ml: {
      calories: 61,
      protein: '3.2g',
      fat: '3.5g',
      carbs: '4.7g',
      calcium: '120mg',
    },
  },
  {
    id: 'p2',
    name: 'Pench 1/2 (Half Litre Milk)',
    category: 'milk',
    price: 45,
    unit: 'Half Litre',
    mrp: 45,
    discount: 0,
    rating: 4.8,
    reviewCount: 211,
    image: 'https://penchfoods.com/wp-content/uploads/2020/08/Untitled-design-17-480x480.png',
    badge: 'FRESH',
    badgeColor: '#2196F3',
    description:
      'Half-litre pack of Pench A2 milk for smaller households and daily top-ups. Fresh, pure, and sourced from healthy Desi Gir cows.',
    highlights: ['Half Litre Pack', 'A2 Gir Cow Milk', 'Morning Delivery', 'No Adulteration'],
    isAvailable: true,
    deliveryTime: '6 AM - 8 AM',
    subscriptionAvailable: true,
    skus: [
      { id: 's2a', label: 'Half Litre', price: 45, mrp: 45 },
    ],
    nutritionPer100ml: {
      calories: 61,
      protein: '3.2g',
      fat: '4.5g',
      carbs: '4.8g',
      calcium: '120mg',
    },
  },
  {
    id: 'p3',
    name: 'Pench A2 Ghee (Half KG)',
    category: 'ghee',
    price: 1200,
    unit: 'Half KG',
    mrp: 1200,
    discount: 0,
    rating: 4.9,
    reviewCount: 218,
    image: 'https://penchfoods.com/wp-content/uploads/2025/08/Ghee-640-by-640-480x480.png',
    badge: 'PREMIUM',
    badgeColor: '#2E7D32',
    description:
      'Traditional Pench A2 ghee made from Gir cow milk. Golden, aromatic, and crafted for daily cooking, sweets, and nutrition.',
    highlights: ['A2 Gir Cow Ghee', 'Golden Aroma', 'No Additives', 'Premium Dairy'],
    isAvailable: true,
    deliveryTime: 'Same Day',
    subscriptionAvailable: false,
    skus: [
      { id: 's3a', label: 'Half KG', price: 1200, mrp: 1200 },
    ],
  },
  {
    id: 'p4',
    name: 'Pench A2 Ghee (1 KG)',
    category: 'ghee',
    price: 2200,
    unit: '1 KG',
    mrp: 2200,
    discount: 0,
    rating: 4.9,
    reviewCount: 187,
    image: 'https://penchfoods.com/wp-content/uploads/2025/08/Ghee-640-by-640-480x480.png',
    badge: 'FAMILY PACK',
    badgeColor: '#F57F17',
    description:
      'One kilogram pack of Pench A2 ghee, made from premium A2 dairy. Rich taste, deep aroma, and ideal for family kitchens.',
    highlights: ['1 KG Pack', 'A2 Gir Cow Ghee', 'Traditional Taste', 'Premium Dairy'],
    isAvailable: true,
    deliveryTime: 'Same Day',
    subscriptionAvailable: false,
    skus: [{ id: 's4a', label: '1 KG', price: 2200, mrp: 2200 }],
  },
];

// Banners
export const BANNERS = [
  {
    id: 'b1',
    title: 'Pench 1 Litre Milk',
    subtitle: 'Pure A2 Gir cow milk delivered fresh every morning',
    bgColor: '#1B5E20',
    accent: '#F9A825',
    tag: 'Farm Fresh',
    productId: 'p1',
  },
  {
    id: 'b2',
    title: 'Subscribe & Save 15%',
    subtitle: 'Never run out of fresh milk - set up a daily subscription today',
    bgColor: '#F57F17',
    accent: '#FFFFFF',
    tag: 'New',
    productId: null,
    route: 'Subscriptions',
  },
  {
    id: 'b3',
    title: 'Pench A2 Ghee',
    subtitle: 'Golden, aromatic A2 ghee in half KG and 1 KG packs',
    bgColor: '#8A4B08',
    accent: '#FFC107',
    tag: 'Premium',
    productId: 'p2',
  },
  {
    id: 'b4',
    title: 'Farm to Home',
    subtitle: 'Pench Foods brings pure dairy across Nagpur',
    bgColor: '#006064',
    accent: '#F9A825',
    tag: 'Nagpur',
    productId: 'p1',
  },
];

// Subscriptions
export const SUBSCRIPTION_PLANS = [
  {
    id: 'sub1',
    name: 'Daily Milk',
    description: 'Fresh A2 milk every morning at your doorstep',
    price: 2490,
    period: 'month',
    pricePerDelivery: 83,
    savings: 10,
    icon: 'bottle-tonic',
    color: '#2E7D32',
    features: [
      '30 deliveries / month',
      'Pench 1 Litre Milk',
      'Free eco-glass bottle',
      'Pause anytime',
      'Priority delivery 6-7 AM',
    ],
    popular: true,
    productId: 'p1',
    quantity: 1,
    frequency: 'daily',
  },
  {
    id: 'sub2',
    name: 'Alternate Day Milk',
    description: 'A2 milk delivered every alternate day',
    price: 1300,
    period: 'month',
    pricePerDelivery: 87,
    savings: 5,
    icon: 'calendar-today',
    color: '#1565C0',
    features: [
      '15 deliveries / month',
      'Pench 1 Litre Milk',
      'Free eco-glass bottle',
      'Pause anytime',
    ],
    popular: false,
    productId: 'p1',
    quantity: 1,
    frequency: 'alternate',
  },
  {
    id: 'sub3',
    name: 'Daily Family Pack',
    description: 'Two litres of fresh A2 milk every morning',
    price: 4800,
    period: 'month',
    pricePerDelivery: 160,
    savings: 15,
    icon: 'home-heart',
    color: '#E65100',
    features: [
      '30 deliveries / month',
      'Pench 1 Litre Milk x 2',
      '2 glass bottles',
      'Pause / Vacation mode',
      'Priority delivery 5:30-7 AM',
    ],
    popular: false,
    productId: 'p1',
    quantity: 1,
    frequency: 'daily',
  },
];

// My subscriptions (mock active)
export const MY_SUBSCRIPTIONS = [
  {
    id: 'mysub1',
    planId: 'sub1',
    planName: 'Daily Milk',
    productName: 'Pench 1 Litre Milk',
    status: 'active', // active | paused | cancelled
    startDate: '2026-05-01',
    nextDelivery: '2026-05-08',
    deliveriesRemaining: 25,
    totalDeliveries: 30,
    address: 'Home - 12, Civil Lines, Nagpur',
    frequency: 'Daily',
    price: 2490,
    vacationFrom: null,
    vacationTo: null,
  },
];

// Order history (mock)
export const ORDER_HISTORY = [
  {
    id: 'ord001',
    date: '2026-05-06',
    time: '06:45 AM',
    status: 'delivered',
    items: [
      { name: 'Pench 1 Litre Milk', qty: 2, price: 160 },
      { name: 'Pench A2 Ghee (Half KG)', qty: 1, price: 1200 },
    ],
    total: 1360,
    deliveryAddress: '12, Civil Lines, Nagpur',
    deliveryAgent: { name: 'Ramesh K.', phone: '+91 98765 00001', rating: 4.8 },
    rated: true,
    userRating: 5,
  },
  {
    id: 'ord002',
    date: '2026-05-05',
    time: '07:12 AM',
    status: 'delivered',
    items: [{ name: 'Pench 1/2 (Half Litre Milk)', qty: 2, price: 90 }],
    total: 90,
    deliveryAddress: '12, Civil Lines, Nagpur',
    deliveryAgent: { name: 'Suresh P.', phone: '+91 98765 00002', rating: 4.6 },
    rated: false,
    userRating: null,
  },
  {
    id: 'ord003',
    date: '2026-05-04',
    time: '06:55 AM',
    status: 'delivered',
    items: [
      { name: 'Pench 1/2 (Half Litre Milk)', qty: 3, price: 135 },
      { name: 'Pench A2 Ghee (Half KG)', qty: 1, price: 1200 },
    ],
    total: 1335,
    deliveryAddress: 'Office - Sitabuldi, Nagpur',
    deliveryAgent: { name: 'Ramesh K.', phone: '+91 98765 00001', rating: 4.8 },
    rated: true,
    userRating: 4,
  },
];

// Live order (mock for tracking)
export const LIVE_ORDER = {
  id: 'ord_live_001',
  status: 'out_for_delivery',
  estimatedArrival: '6:45 AM',
  placedAt: '6:05 AM',
  items: [
    { name: 'Pench 1 Litre Milk', qty: 1, price: 80 },
  ],
  total: 95,
  deliveryAgent: {
    name: 'Ramesh Kumar',
    phone: '+91 98765 00001',
    photo: null,
    rating: 4.8,
    totalDeliveries: 1842,
  },
  customer: {
    name: 'Priya Sharma',
    phone: '+91 98765 00123',
  },
  deliveryAddress: '12, Civil Lines, Nagpur',
  // Pench Foods warehouse -> user's home (Nagpur coords)
  route: {
    origin: { latitude: 21.1413, longitude: 79.0906, label: 'Pench Farm' },
    destination: { latitude: 21.1458, longitude: 79.0882, label: 'Your Home' },
    agentLocation: { latitude: 21.1435, longitude: 79.0895 },
  },
  statusTimeline: [
    { label: 'Order Placed', time: '6:05 AM', done: true },
    { label: 'Confirmed', time: '6:07 AM', done: true },
    { label: 'Picked Up', time: '6:20 AM', done: true },
    { label: 'Out for Delivery', time: '6:35 AM', done: true },
    { label: 'Delivered', time: null, done: false },
  ],
};

// Saved addresses
export const SAVED_ADDRESSES = [
  {
    id: 'addr1',
    label: 'Home',
    icon: 'home',
    addressLine1: '12, Shankar Nagar',
    addressLine2: 'Near Civil Lines Police Station',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    latitude: 21.1458,
    longitude: 79.0882,
    isDefault: true,
  },
  {
    id: 'addr2',
    label: 'Office',
    icon: 'briefcase',
    addressLine1: '304, Sitabuldi Main Road',
    addressLine2: 'Opp. Empress Mall',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440012',
    latitude: 21.1539,
    longitude: 79.0845,
    isDefault: false,
  },
];

// Pench Foods location
export const PENCH_WAREHOUSE = {
  latitude: 21.1413,
  longitude: 79.0906,
  label: 'Pench Foods, Telangkhedi, Nagpur',
  address: 'Shop No 1 & 2, Telangkhedi, Ram Nagar, Nagpur - 440010',
};

// Testimonials
export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Priya Sharma',
    location: 'Dharampeth, Nagpur',
    rating: 5,
    text: 'Best milk I\'ve ever had! My kids love it. You can taste the difference - it\'s so fresh and creamy.',
    avatar: 'PS',
  },
  {
    id: 't2',
    name: 'Rajesh Deshmukh',
    location: 'Civil Lines, Nagpur',
    rating: 5,
    text: 'Been subscribing for 3 months. Never a missed delivery. The ghee is outstanding - just like my grandmother used to make.',
    avatar: 'RD',
  },
  {
    id: 't3',
    name: 'Anita Kulkarni',
    location: 'Sitabuldi, Nagpur',
    rating: 5,
    text: 'Glass bottle packaging is a great initiative. Farm fresh taste and the delivery is always on time at 6:30 AM sharp!',
    avatar: 'AK',
  },
];

// Coupons
export const COUPONS = [
  { code: 'PENCH10', discount: 10, type: 'percent', minOrder: 150, maxDiscount: 50 },
  { code: 'FIRST50', discount: 50, type: 'flat', minOrder: 200, maxDiscount: 50 },
  { code: 'MILK20', discount: 20, type: 'percent', minOrder: 300, maxDiscount: 80 },
];

// Tomorrow's scheduled delivery (Country Delight-style)
export const TOMORROW_DELIVERY = {
  date: '2026-05-08',
  cutoffTime: '11:59 PM',
  slot: '6:00 AM - 7:30 AM',
  items: [
    { id: 'td1', productId: 'p1', name: 'Pench 1 Litre Milk', unit: '1 Litre', qty: 1, price: 80, isSubscription: true },
  ],
  canModify: true,
  status: 'scheduled',
};

// Delivery slots (Country Delight-style)
export const DELIVERY_SLOTS = [
  { id: 'slot1', label: 'Early Morning', time: '5:30 AM - 7:00 AM', available: true, premium: false },
  { id: 'slot2', label: 'Morning', time: '7:00 AM - 8:30 AM', available: true, premium: false },
  { id: 'slot3', label: 'Late Morning', time: '8:30 AM - 10:00 AM', available: true, premium: false },
  { id: 'slot4', label: 'Express', time: '30-40 mins', available: false, premium: true },
];
