# Price Tracker App - Technical Design

## 1. System Architecture Overview

### 1.1 Architecture Pattern
**Progressive Web App (PWA) with Modern Web Stack**
- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL with Redis for caching
- Deployment: Docker containers on cloud platform
- Real-time: WebSocket connections for live price updates

### 1.2 High-Level Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile PWA    │────│   Load Balancer │────│   API Gateway   │
│   (React/TS)    │    │   (Nginx/CDN)   │    │   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Auth Service  │    │ Business Logic  │    │  Data Layer     │
    │   (JWT/OAuth)   │    │   Microservices │    │ (PostgreSQL)    │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Cache Layer   │    │   File Storage  │
                    │    (Redis)      │    │    (AWS S3)     │
                    └─────────────────┘    └─────────────────┘
```

### 1.3 Technology Stack

#### Frontend
- **React 18+** with TypeScript
- **Vite** for build tooling
- **PWA Workbox** for service worker
- **React Query** for server state management
- **Zustand** for client state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Mapbox GL JS** for map functionality

#### Backend
- **Node.js 18+** with TypeScript
- **Express.js** framework
- **Socket.io** for real-time communication
- **Prisma ORM** for database operations
- **JWT** for authentication
- **Joi** for input validation
- **Winston** for logging
- **Jest** for testing

#### Database & Infrastructure
- **PostgreSQL 15+** for primary data
- **Redis 7+** for caching and sessions
- **Docker** for containerization
- **AWS/GCP** for cloud hosting
- **CloudFront/CloudFlare** for CDN
- **GitHub Actions** for CI/CD

## 2. Database Design

### 2.1 Entity Relationship Diagram
```
Users ──── UserProfiles
  │            │
  │            └── PreferredStores
  │
  ├── ShoppingLists ──── ShoppingListItems ──── Products
  │                                               │
  ├── PriceSubmissions ─────────────────────────┘
  │                                               │
  └── UserSessions                               │
                                                 │
Stores ──── StoreChains                         │
  │                                             │
  └── ProductPrices ─────────────────────────────┘
        │
        └── PriceHistory
```

### 2.2 Core Tables Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### Stores Table (Enhanced with PostGIS - Gemini Optimized)
```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES store_chains(id),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography type
  phone VARCHAR(20),
  operating_hours JSONB,
  geohash VARCHAR(12) GENERATED ALWAYS AS (SUBSTRING(ST_GeoHash(location::geometry), 1, 7)) STORED,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Optimized spatial indexes (Gemini recommended)
CREATE INDEX idx_stores_location_gist ON stores USING GIST (location);
CREATE INDEX idx_stores_geohash ON stores(geohash);
CREATE INDEX idx_stores_chain_id ON stores(chain_id);
CREATE INDEX idx_stores_status ON stores(status);

-- Compound index for common queries
CREATE INDEX idx_stores_status_location ON stores USING GIST (location) WHERE status = 'active';
```

#### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  unit_type VARCHAR(50) NOT NULL, -- 'piece', 'kg', 'liter', etc.
  unit_size VARCHAR(50), -- '1kg', '500ml', etc.
  description TEXT,
  image_url VARCHAR(500),
  barcode VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT products_unit_type_check CHECK (unit_type IN ('piece', 'kg', 'gram', 'liter', 'ml', 'pack'))
);

CREATE INDEX idx_products_name ON products USING GIN (to_tsvector('japanese', name));
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_barcode ON products(barcode);
```

#### ProductPrices Table
```sql
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  price_per_unit DECIMAL(10, 2),
  submitted_by UUID REFERENCES users(id),
  verification_status VARCHAR(20) DEFAULT 'unverified',
  submission_location POINT,
  receipt_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  
  CONSTRAINT product_prices_price_check CHECK (price > 0),
  CONSTRAINT product_prices_verification_check CHECK (verification_status IN ('unverified', 'verified', 'disputed', 'expired'))
);

CREATE INDEX idx_product_prices_product_store ON product_prices(product_id, store_id);
CREATE INDEX idx_product_prices_created_at ON product_prices(created_at);
CREATE INDEX idx_product_prices_expires_at ON product_prices(expires_at);
CREATE UNIQUE INDEX idx_product_prices_unique_recent ON product_prices(product_id, store_id, submitted_by) 
  WHERE created_at > NOW() - INTERVAL '1 hour';
```

#### ShoppingLists Table
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT shopping_lists_status_check CHECK (status IN ('active', 'completed', 'archived'))
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(status);
```

#### ShoppingListItems Table
```sql
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(8, 2) NOT NULL DEFAULT 1,
  priority INTEGER DEFAULT 1,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT shopping_list_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT shopping_list_items_priority_check CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_product_id ON shopping_list_items(product_id);
```

### 2.3 Indexes and Performance Optimization

#### Spatial Indexes for Location Queries
```sql
-- Geographic search optimization
CREATE INDEX idx_stores_location_gist ON stores USING GIST (point(longitude, latitude));

-- Compound indexes for common queries
CREATE INDEX idx_product_prices_location_time ON product_prices(store_id, created_at DESC);
CREATE INDEX idx_product_prices_product_fresh ON product_prices(product_id, created_at DESC) 
  WHERE verification_status = 'verified' AND expires_at > NOW();
```

#### Full-Text Search for Products
```sql
-- Japanese text search support
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('japanese', COALESCE(name, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(description, ''))
);

-- Category-based filtering
CREATE INDEX idx_products_category_name ON products(category, name);
```

## 3. API Design

### 3.1 RESTful API Structure

#### Base URL
```
Production: https://api.price-tracker.jp/v1
Development: http://localhost:3001/api/v1
```

#### Authentication
```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  iat: number;
  exp: number;
}

// Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Client-Version: 1.0.0
```

### 3.2 Core API Endpoints

#### Authentication Endpoints
```typescript
// POST /auth/register
interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  token: string;
  refreshToken: string;
}

// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    lastLoginAt: string;
  };
  token: string;
  refreshToken: string;
}
```

#### Shopping List Optimization
```typescript
// POST /shopping-lists/{id}/optimize
interface OptimizeShoppingListRequest {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  maxDistance?: number; // km, default 5
  considerOpeningHours?: boolean; // default true
}

interface OptimizeShoppingListResponse {
  optimalStore: {
    store: Store;
    totalCost: number;
    totalSavings: number;
    itemsAvailable: number;
    itemsTotal: number;
  };
  alternativeStores: Array<{
    store: Store;
    totalCost: number;
    costDifference: number;
    percentageDifference: number;
  }>;
  itemBreakdown: Array<{
    item: ShoppingListItem;
    product: Product;
    bestPrice: {
      price: number;
      store: Store;
      lastUpdated: string;
    };
    optimalStorePrice: {
      price: number;
      priceDifference: number;
    };
  }>;
  metadata: {
    calculatedAt: string;
    dataFreshness: string;
    totalStoresChecked: number;
  };
}
```

#### Real-time Price Comparison
```typescript
// POST /prices/compare
interface PriceCompareRequest {
  productId: string;
  currentPrice: number;
  storeLocation: {
    latitude: number;
    longitude: number;
    storeId?: string; // if known
  };
  userLocation: {
    latitude: number;
    longitude: number;
  };
  submitPrice?: boolean; // default true
}

interface PriceCompareResponse {
  currentPriceAnalysis: {
    isGoodDeal: boolean;
    percentageDifference: number; // positive = saving, negative = overpaying
    absoluteDifference: number;
    rank: number; // 1 = cheapest, higher = more expensive
    totalStoresCompared: number;
  };
  nearbyPrices: Array<{
    store: Store;
    price: number;
    distance: number; // km
    lastUpdated: string;
    verificationStatus: 'verified' | 'unverified';
  }>;
  priceSubmitted?: {
    id: string;
    status: 'submitted' | 'duplicate';
    pointsEarned?: number;
  };
  recommendations: {
    shouldBuyHere: boolean;
    alternativeStores: Array<{
      store: Store;
      savings: number;
      travelTime: number; // minutes
      worthTheTrip: boolean;
    }>;
  };
}
```

#### Store and Location Services
```typescript
// GET /stores/nearby
interface NearbyStoresRequest {
  latitude: number;
  longitude: number;
  radius?: number; // km, default 5, max 20
  limit?: number; // default 20, max 50
  chainIds?: string[];
  openNow?: boolean;
}

interface NearbyStoresResponse {
  stores: Array<{
    id: string;
    name: string;
    chain: StoreChain;
    address: string;
    distance: number; // km
    isOpen: boolean;
    operatingHours: OperatingHours;
    averagePrice: number; // relative to area average
    userRating: number;
    priceDataFreshness: string;
  }>;
  metadata: {
    totalFound: number;
    searchRadius: number;
    centerLocation: Location;
  };
}
```

#### Product Search
```typescript
// GET /products/search
interface ProductSearchRequest {
  query: string;
  category?: string;
  limit?: number; // default 20, max 100
  includeBarcode?: boolean;
  nearLocation?: {
    latitude: number;
    longitude: number;
    radius?: number; // km for price availability
  };
}

interface ProductSearchResponse {
  products: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    unitType: string;
    unitSize: string;
    imageUrl?: string;
    averagePrice?: number;
    priceRange?: {
      min: number;
      max: number;
      storesCount: number;
    };
    nearbyAvailability?: {
      storesWithPrices: number;
      lowestPrice: number;
      highestPrice: number;
    };
  }>;
  suggestions: string[];
  metadata: {
    totalResults: number;
    searchTime: number; // ms
    query: string;
  };
}
```

### 3.3 WebSocket Events for Real-time Updates

```typescript
// Client -> Server Events
interface ClientEvents {
  'join-room': {
    type: 'user-location' | 'shopping-list';
    data: {
      latitude: number;
      longitude: number;
      radius?: number;
    } | {
      shoppingListId: string;
    };
  };
  
  'price-update': {
    productId: string;
    storeId: string;
    price: number;
    location: Location;
  };
}

// Server -> Client Events
interface ServerEvents {
  'price-updated': {
    productId: string;
    storeId: string;
    newPrice: number;
    oldPrice?: number;
    updateSource: 'user-submission' | 'verification' | 'system';
    affectedShoppingLists?: string[];
  };
  
  'shopping-list-optimized': {
    shoppingListId: string;
    newOptimalStore: Store;
    costChange: number;
    trigger: 'price-change' | 'store-hours' | 'new-data';
  };
  
  'store-status-change': {
    storeId: string;
    isOpen: boolean;
    nextStatusChange?: string; // ISO timestamp
  };
}
```

## 4. Frontend Architecture

### 4.1 Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── LoadingSpinner/
│   │   └── ErrorBoundary/
│   ├── layout/
│   │   ├── Header/
│   │   ├── Navigation/
│   │   ├── Sidebar/
│   │   └── Footer/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── ProfileSettings/
│   │   ├── shopping-list/
│   │   │   ├── ShoppingListCreator/
│   │   │   ├── ShoppingListOptimizer/
│   │   │   ├── ItemSelector/
│   │   │   └── OptimizationResults/
│   │   ├── price-comparison/
│   │   │   ├── PriceScanner/
│   │   │   ├── ComparisonResults/
│   │   │   ├── PriceSubmissionForm/
│   │   │   └── NearbyStores/
│   │   ├── stores/
│   │   │   ├── StoreMap/
│   │   │   ├── StoreDetails/
│   │   │   ├── StoreList/
│   │   │   └── StoreSelector/
│   │   └── products/
│   │       ├── ProductSearch/
│   │       ├── ProductDetails/
│   │       ├── ProductCard/
│   │       └── CategoryBrowser/
│   └── pages/
│       ├── HomePage/
│       ├── ShoppingListPage/
│       ├── PriceComparePage/
│       ├── StoresPage/
│       └── ProfilePage/
├── hooks/
│   ├── useGeolocation.ts
│   ├── useWebSocket.ts
│   ├── useOptimization.ts
│   ├── usePriceComparison.ts
│   └── useOfflineSync.ts
├── stores/
│   ├── authStore.ts
│   ├── shoppingListStore.ts
│   ├── locationStore.ts
│   ├── priceStore.ts
│   └── uiStore.ts
├── services/
│   ├── api/
│   │   ├── authService.ts
│   │   ├── shoppingListService.ts
│   │   ├── priceService.ts
│   │   ├── storeService.ts
│   │   └── productService.ts
│   ├── location/
│   │   ├── geolocationService.ts
│   │   └── mapService.ts
│   ├── offline/
│   │   ├── cacheService.ts
│   │   ├── syncService.ts
│   │   └── storageService.ts
│   └── websocket/
│       └── websocketService.ts
└── utils/
    ├── calculations/
    │   ├── priceOptimization.ts
    │   ├── distanceCalculation.ts
    │   └── savingsCalculation.ts
    ├── formatting/
    │   ├── currencyFormatter.ts
    │   ├── dateFormatter.ts
    │   └── distanceFormatter.ts
    └── validation/
        ├── formValidation.ts
        └── inputSanitization.ts
```

### 4.2 State Management

#### Zustand Store Structure
```typescript
// Shopping List Store
interface ShoppingListState {
  currentList: ShoppingList | null;
  optimization: OptimizationResult | null;
  isOptimizing: boolean;
  
  // Actions
  createList: (name: string) => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  optimizeList: (location: Location) => Promise<void>;
  clearOptimization: () => void;
}

// Price Comparison Store
interface PriceComparisonState {
  currentComparison: PriceComparison | null;
  isComparing: boolean;
  submissionHistory: PriceSubmission[];
  
  // Actions
  comparePrice: (request: PriceCompareRequest) => Promise<void>;
  submitPrice: (submission: PriceSubmission) => Promise<void>;
  clearComparison: () => void;
}

// Location Store
interface LocationState {
  currentLocation: Location | null;
  selectedStores: Store[];
  nearbyStores: Store[];
  permissionStatus: 'granted' | 'denied' | 'prompt';
  
  // Actions
  getCurrentLocation: () => Promise<Location>;
  setLocation: (location: Location) => void;
  findNearbyStores: (radius: number) => Promise<void>;
  addPreferredStore: (storeId: string) => Promise<void>;
}
```

### 4.3 PWA Configuration

#### Enhanced PWA Service Worker Strategy (Gemini Optimized)
```typescript
// sw.js - Enhanced Service Worker with Stale-While-Revalidate
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Critical API calls - Network first with fast timeout
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/shopping-lists/'),
  new NetworkFirst({
    cacheName: 'critical-api-cache',
    networkTimeoutSeconds: 3,
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        // Remove timestamp parameters for better cache hits
        const url = new URL(request.url);
        url.searchParams.delete('_t');
        return url.toString();
      }
    }]
  })
);

// Price data - Stale-While-Revalidate (Gemini's recommended strategy)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/prices/') || url.pathname.startsWith('/api/stores/'),
  new StaleWhileRevalidate({
    cacheName: 'price-data-cache',
    plugins: [{
      cacheExpiration: {
        maxEntries: 200,
        maxAgeSeconds: 5 * 60, // 5 minutes for price data freshness
        purgeOnQuotaError: true
      }
    }]
  })
);

// Real-time price submissions - Network only (always fresh)
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/prices/submit') && request.method === 'POST',
  new NetworkOnly()
);

// Static assets - Cache first with long TTL
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets-cache',
    plugins: [{
      cacheExpiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true
      }
    }]
  })
);

// Background sync setup
const bgSync = new BackgroundSync('price-submissions', {
  maxRetentionTime: 24 * 60 // 24 hours
});

// Enhanced background sync for price submissions
self.addEventListener('sync', event => {
  if (event.tag === 'price-submission') {
    event.waitUntil(bgSync.replayRequests());
  }
});

// Handle offline price submissions
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/prices/submit') && request.method === 'POST',
  async ({ request }) => {
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      // Queue for background sync when offline
      await bgSync.addRequest(request);
      return new Response(JSON.stringify({
        success: false,
        message: 'オフラインのため送信をキューに追加しました',
        queued: true
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
);

// Cache management for IndexedDB
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('price-data-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});
```

#### Enhanced Offline Functionality (Gemini Optimized)
```typescript
// Comprehensive Offline Data Management with Stale-While-Revalidate pattern
class OfflineDataManager {
  private db: IDBDatabase;
  private syncQueue: Map<string, any> = new Map();
  
  async initializeOfflineStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PriceTrackerDB', 3);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Shopping lists store
        if (!db.objectStoreNames.contains('shopping-lists')) {
          const listStore = db.createObjectStore('shopping-lists', { keyPath: 'id' });
          listStore.createIndex('userId', 'userId', { unique: false });
          listStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
        
        // Price data cache
        if (!db.objectStoreNames.contains('price-cache')) {
          const priceStore = db.createObjectStore('price-cache', { keyPath: 'cacheKey' });
          priceStore.createIndex('geohash', 'geohash', { unique: false });
          priceStore.createIndex('expiry', 'expiry', { unique: false });
        }
        
        // Offline sync queue
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }
  
  // Enhanced shopping list offline management
  async saveShoppingListOffline(list: ShoppingList): Promise<void> {
    const transaction = this.db.transaction(['shopping-lists'], 'readwrite');
    const store = transaction.objectStore('shopping-lists');
    
    const offlineList = {
      ...list,
      lastModified: Date.now(),
      syncStatus: navigator.onLine ? 'synced' : 'pending',
      optimizationCache: null // Clear cache when modified offline
    };
    
    await store.put(offlineList);
    
    // Queue for sync if offline
    if (!navigator.onLine) {
      await this.queueForSync('shopping-list-update', offlineList);
    }
  }
  
  // Cache price data with geohash for efficient retrieval
  async cachePriceData(location: Location, radius: number, priceData: any[]): Promise<void> {
    const geohash = this.getGeohash(location.latitude, location.longitude, 7);
    const cacheKey = `prices:${geohash}:${radius}`;
    const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    const transaction = this.db.transaction(['price-cache'], 'readwrite');
    const store = transaction.objectStore('price-cache');
    
    await store.put({
      cacheKey,
      geohash,
      location,
      radius,
      data: priceData,
      timestamp: Date.now(),
      expiry
    });
  }
  
  // Retrieve cached price data
  async getCachedPriceData(location: Location, radius: number): Promise<any[] | null> {
    const geohash = this.getGeohash(location.latitude, location.longitude, 7);
    const cacheKey = `prices:${geohash}:${radius}`;
    
    const transaction = this.db.transaction(['price-cache'], 'readonly');
    const store = transaction.objectStore('price-cache');
    const cached = await store.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    // Clean expired cache
    if (cached && cached.expiry <= Date.now()) {
      const deleteTransaction = this.db.transaction(['price-cache'], 'readwrite');
      await deleteTransaction.objectStore('price-cache').delete(cacheKey);
    }
    
    return null;
  }
  
  // Queue operations for background sync
  async queueForSync(type: string, data: any): Promise<void> {
    const transaction = this.db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    await store.add({
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
  }
  
  // Process sync queue when online
  async processSyncQueue(): Promise<void> {
    if (!navigator.onLine) return;
    
    const transaction = this.db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    const queuedItems = await store.getAll();
    
    for (const item of queuedItems) {
      try {
        await this.syncItem(item);
        await store.delete(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Update retry count
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 3) {
          await store.put(item);
        } else {
          // Remove after 3 failed attempts
          await store.delete(item.id);
        }
      }
    }
  }
  
  private async syncItem(item: any): Promise<void> {
    switch (item.type) {
      case 'shopping-list-update':
        await this.apiService.updateShoppingList(item.data);
        break;
      case 'price-submission':
        await this.apiService.submitPrice(item.data);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }
  
  private getGeohash(lat: number, lng: number, precision: number): string {
    // Simple geohash implementation for caching
    return `${Math.floor(lat * Math.pow(10, precision))}_${Math.floor(lng * Math.pow(10, precision))}`;
  }
}
```

## 5. Performance Optimization

### 5.1 Enhanced Database Optimization (Gemini Improvements)

#### PostGIS Spatial Optimization
```sql
-- Create optimized spatial indexes (Gemini recommended)
CREATE INDEX CONCURRENTLY idx_stores_location_gist 
ON stores USING GIST (location geography_ops);

-- Compound spatial-temporal index for price queries
CREATE INDEX CONCURRENTLY idx_prices_location_time
ON product_prices USING BTREE (store_id, created_at DESC, verification_status)
WHERE expires_at > NOW();

-- Geohash-style indexing for area-based caching
CREATE INDEX CONCURRENTLY idx_stores_geohash
ON stores ((SUBSTRING(ST_GeoHash(location::geometry), 1, 7)));
```

#### Simplified Shopping List Optimization Algorithm (Gemini Optimized)
```sql
-- Simplified shopping list optimization (O(stores × products)) - Gemini's approach
WITH nearby_stores AS (
  SELECT s.*, 
    ST_Distance(s.location::geography, ST_Point($1, $2)::geography) as distance
  FROM stores s
  WHERE ST_DWithin(s.location::geography, ST_Point($1, $2)::geography, $3)
    AND s.status = 'active'
    AND (s.operating_hours->>'is_open_now')::boolean = true
  ORDER BY distance
  LIMIT 20
),
latest_prices AS (
  SELECT DISTINCT ON (pp.store_id, pp.product_id)
    pp.store_id,
    pp.product_id,
    pp.price,
    pp.created_at,
    pp.verification_status
  FROM product_prices pp
  JOIN nearby_stores ns ON pp.store_id = ns.id
  WHERE pp.expires_at > NOW()
    AND pp.verification_status IN ('verified', 'unverified')
  ORDER BY pp.store_id, pp.product_id, pp.created_at DESC
),
store_totals AS (
  SELECT 
    ns.id as store_id,
    ns.name as store_name,
    ns.distance,
    SUM(lp.price * sli.quantity) as total_cost,
    COUNT(lp.product_id) as items_available,
    COUNT(sli.product_id) as items_requested,
    ROUND(COUNT(lp.product_id) * 100.0 / COUNT(sli.product_id), 1) as availability_rate,
    json_agg(json_build_object(
      'product_id', sli.product_id,
      'product_name', p.name,
      'quantity', sli.quantity,
      'price', lp.price,
      'line_total', lp.price * sli.quantity,
      'available', (lp.price IS NOT NULL)
    )) as item_breakdown
  FROM nearby_stores ns
  CROSS JOIN shopping_list_items sli
  LEFT JOIN latest_prices lp ON ns.id = lp.store_id AND sli.product_id = lp.product_id
  LEFT JOIN products p ON sli.product_id = p.id
  WHERE sli.shopping_list_id = $4
  GROUP BY ns.id, ns.name, ns.distance
  HAVING COUNT(lp.product_id) >= (COUNT(sli.product_id) * 0.8) -- 80%以上の商品が利用可能
)
SELECT 
  st.*,
  CASE 
    WHEN st.availability_rate = 100 THEN 'すべての商品が利用可能'
    WHEN st.availability_rate >= 90 THEN 'ほとんどの商品が利用可能'
    ELSE CONCAT(st.availability_rate, '% の商品が利用可能')
  END as availability_message
FROM store_totals st
ORDER BY 
  st.availability_rate DESC,  -- 商品揃い優先
  st.total_cost ASC,          -- 次に総額
  st.distance ASC             -- 最後に距離
LIMIT 5;
```

#### Enhanced Redis Caching with Geohash Optimization (Gemini Improved)
```typescript
import { encode as geohashEncode } from 'ngeohash';

class OptimizedPriceCacheService {
  private redis: Redis;
  
  // Geohash-based caching for location-aware price data
  private getLocationHash(latitude: number, longitude: number, precision: number = 7): string {
    return geohashEncode(latitude, longitude, precision);
  }
  
  async getOptimalStore(shoppingListId: string, location: Location): Promise<OptimalStore | null> {
    const locationHash = this.getLocationHash(location.latitude, location.longitude);
    const cacheKey = `optimal:${locationHash}:${shoppingListId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is still fresh (3 minutes for high-frequency requests)
      if (Date.now() - parsed.timestamp < 3 * 60 * 1000) {
        return parsed.data;
      }
    }
    
    return null;
  }
  
  async setOptimalStore(shoppingListId: string, location: Location, data: OptimalStore): Promise<void> {
    const locationHash = this.getLocationHash(location.latitude, location.longitude);
    const cacheKey = `optimal:${locationHash}:${shoppingListId}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      location: { latitude: location.latitude, longitude: location.longitude }
    };
    
    // Cache for 3 minutes (shorter for real-time accuracy)
    await this.redis.setex(cacheKey, 180, JSON.stringify(cacheData));
  }
  
  // Cache nearby price data by geohash
  async cacheAreaPrices(location: Location, radius: number, priceData: any[]): Promise<void> {
    const locationHash = this.getLocationHash(location.latitude, location.longitude);
    const cacheKey = `prices:area:${locationHash}`;
    
    const cacheData = {
      data: priceData,
      timestamp: Date.now(),
      radius,
      center: location
    };
    
    // Cache area prices for 10 minutes
    await this.redis.setex(cacheKey, 600, JSON.stringify(cacheData));
  }
  
  // Get cached area prices
  async getAreaPrices(location: Location): Promise<any[] | null> {
    const locationHash = this.getLocationHash(location.latitude, location.longitude);
    const cacheKey = `prices:area:${locationHash}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        return parsed.data;
      }
    }
    
    // Clean expired cache
    if (cached && cached.expiry <= Date.now()) {
      const deleteTransaction = this.db.transaction(['price-cache'], 'readwrite');
      await deleteTransaction.objectStore('price-cache').delete(cacheKey);
    }
    
    return null;
  }
  
  // Redis Pub/Sub for multi-server Socket.io scaling (Gemini suggestion)
  async setupPubSub(): Promise<void> {
    const publisher = this.redis.duplicate();
    const subscriber = this.redis.duplicate();
    
    // Subscribe to price update events
    await subscriber.subscribe('price-updates');
    
    subscriber.on('message', (channel, message) => {
      if (channel === 'price-updates') {
        const updateData = JSON.parse(message);
        // Broadcast to all connected Socket.io clients
        global.io.emit('price-updated', updateData);
      }
    });
  }
  
  // Publish price updates to all server instances
  async publishPriceUpdate(updateData: any): Promise<void> {
    await this.redis.publish('price-updates', JSON.stringify(updateData));
  }
}
```

### 5.2 Frontend Optimization

#### Code Splitting
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'));
const PriceComparePage = lazy(() => import('./pages/PriceComparePage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/compare" element={<PriceComparePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

#### Image Optimization
```typescript
// Progressive image loading component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function OptimizedImage({ src, alt, width, height }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Generate WebP and AVIF sources
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  const avifSrc = src.replace(/\.(jpg|jpeg|png)$/, '.avif');
  
  return (
    <picture>
      <source srcSet={avifSrc} type="image/avif" />
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </picture>
  );
}
```

## 6. Security Design

### 6.1 Authentication & Authorization

#### JWT Implementation
```typescript
// JWT service with refresh token rotation
class AuthService {
  private jwtSecret: string;
  private refreshSecret: string;
  
  async generateTokens(userId: string): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.jwtSecret,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId, type: 'refresh', tokenId: uuidv4() },
      this.refreshSecret,
      { expiresIn: '7d' }
    );
    
    // Store refresh token in database with expiry
    await this.storeRefreshToken(userId, refreshToken);
    
    return { accessToken, refreshToken };
  }
  
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const decoded = jwt.verify(refreshToken, this.refreshSecret) as RefreshTokenPayload;
    
    // Validate refresh token exists in database
    const isValid = await this.validateRefreshToken(decoded.userId, refreshToken);
    if (!isValid) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new token pair and invalidate old refresh token
    await this.invalidateRefreshToken(refreshToken);
    return this.generateTokens(decoded.userId);
  }
}
```

#### Input Validation
```typescript
// Joi validation schemas
const priceSubmissionSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  storeId: Joi.string().uuid().required(),
  price: Joi.number().positive().precision(2).max(999999.99).required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  receiptImageUrl: Joi.string().uri().optional()
});

const shoppingListSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().positive().max(999).required()
    })
  ).max(50).required()
});
```

### 6.2 Data Protection

#### Location Data Privacy
```typescript
// Location data anonymization
class LocationPrivacyService {
  private readonly PRECISION_METERS = 100; // Round to 100m
  
  anonymizeLocation(location: Location): AnonymizedLocation {
    // Round coordinates to reduce precision
    const precision = this.PRECISION_METERS / 111000; // Rough conversion to degrees
    
    return {
      latitude: Math.round(location.latitude / precision) * precision,
      longitude: Math.round(location.longitude / precision) * precision,
      accuracy: Math.max(location.accuracy || 0, this.PRECISION_METERS)
    };
  }
  
  async logLocationAccess(userId: string, purpose: string): Promise<void> {
    await this.auditService.log({
      userId,
      action: 'location_access',
      purpose,
      timestamp: new Date(),
      ipAddress: this.request.ip,
      userAgent: this.request.get('User-Agent')
    });
  }
}
```

#### API Rate Limiting
```typescript
// Express rate limiting middleware
import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    }
  });
};

// Different limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 1000, 'Too many requests');
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many auth attempts');
const priceSubmissionLimiter = createRateLimiter(60 * 1000, 10, 'Too many price submissions');

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/prices/submit', priceSubmissionLimiter);
```

## 7. Deployment Architecture

### 7.1 Container Configuration

#### Docker Compose for Development
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/pricetracker
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/pricetracker
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-key
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=pricetracker
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Production Dockerfile
```dockerfile
# Frontend Build Stage
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Backend Build Stage
FROM node:18-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN npm run build

# Production Stage
FROM node:18-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=backend-build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=backend-build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=frontend-build --chown=nextjs:nodejs /app/dist ./public

USER nextjs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### 7.2 CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
          
      - name: Run linting
        run: |
          npm run lint
          cd backend && npm run lint
          
      - name: Run type checking
        run: |
          npm run type-check
          cd backend && npm run type-check
          
      - name: Run tests
        run: |
          npm run test:coverage
          cd backend && npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info,./backend/coverage/lcov.info

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha
            
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          
      - name: Deploy to production
        run: |
          # Deploy to cloud platform (AWS/GCP)
          echo "Deploying to production..."
```

## 8. Monitoring and Analytics

### 8.1 Application Monitoring

#### Health Check Endpoints
```typescript
// Health check service
class HealthCheckService {
  async getSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices(),
      this.checkDiskSpace(),
      this.checkMemoryUsage()
    ]);
    
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      checks: {
        database: this.getCheckResult(checks[0]),
        redis: this.getCheckResult(checks[1]),
        external: this.getCheckResult(checks[2]),
        disk: this.getCheckResult(checks[3]),
        memory: this.getCheckResult(checks[4])
      }
    };
    
    // Set overall status based on individual checks
    const hasFailures = Object.values(health.checks).some(check => !check.healthy);
    health.status = hasFailures ? 'unhealthy' : 'healthy';
    
    return health;
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Performance Metrics
```typescript
// Custom metrics collection
class MetricsService {
  private prometheus = require('prom-client');
  
  private httpRequestDuration = new this.prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code']
  });
  
  private priceOptimizationDuration = new this.prometheus.Histogram({
    name: 'price_optimization_duration_seconds',
    help: 'Time taken to optimize shopping list',
    labelNames: ['items_count', 'stores_checked']
  });
  
  private activeShoppingLists = new this.prometheus.Gauge({
    name: 'active_shopping_lists_total',
    help: 'Number of active shopping lists'
  });
  
  recordOptimizationTime(duration: number, itemsCount: number, storesChecked: number): void {
    this.priceOptimizationDuration
      .labels(itemsCount.toString(), storesChecked.toString())
      .observe(duration);
  }
  
  recordHttpRequest(duration: number, method: string, route: string, statusCode: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }
}
```

### 8.2 User Analytics

#### Privacy-Compliant Analytics
```typescript
// Anonymized user behavior tracking
class AnalyticsService {
  async trackUserAction(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    const hashedUserId = this.hashUserId(userId);
    
    const event = {
      userId: hashedUserId,
      action,
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      metadata: this.sanitizeMetadata(metadata)
    };
    
    // Send to analytics platform (privacy-compliant)
    await this.sendToAnalytics(event);
  }
  
  private hashUserId(userId: string): string {
    return crypto.createHash('sha256')
      .update(userId + process.env.ANALYTICS_SALT)
      .digest('hex')
      .substring(0, 16);
  }
  
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};
    
    // Remove sensitive information
    const sensitiveKeys = ['email', 'phone', 'address', 'location'];
    return Object.fromEntries(
      Object.entries(metadata).filter(([key]) => 
        !sensitiveKeys.includes(key.toLowerCase())
      )
    );
  }
}
```

## 9. Testing Strategy

### 9.1 Backend Testing

#### Unit Tests
```typescript
// Price optimization service tests
describe('PriceOptimizationService', () => {
  let service: PriceOptimizationService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  
  beforeEach(() => {
    mockPrisma = {
      store: {
        findMany: jest.fn()
      },
      productPrice: {
        findMany: jest.fn()
      }
    } as any;
    
    service = new PriceOptimizationService(mockPrisma);
  });
  
  describe('optimizeShoppingList', () => {
    it('should return optimal store with lowest total cost', async () => {
      // Mock data setup
      const mockStores = [
        { id: 'store1', name: 'Store A', latitude: 35.6762, longitude: 139.6503 },
        { id: 'store2', name: 'Store B', latitude: 35.6763, longitude: 139.6504 }
      ];
      
      const mockPrices = [
        { storeId: 'store1', productId: 'prod1', price: 100 },
        { storeId: 'store1', productId: 'prod2', price: 200 },
        { storeId: 'store2', productId: 'prod1', price: 90 },
        { storeId: 'store2', productId: 'prod2', price: 220 }
      ];
      
      const shoppingList = {
        id: 'list1',
        items: [
          { productId: 'prod1', quantity: 2 },
          { productId: 'prod2', quantity: 1 }
        ]
      };
      
      mockPrisma.store.findMany.mockResolvedValue(mockStores);
      mockPrisma.productPrice.findMany.mockResolvedValue(mockPrices);
      
      const result = await service.optimizeShoppingList(
        shoppingList,
        { latitude: 35.6762, longitude: 139.6503 }
      );
      
      expect(result.optimalStore.id).toBe('store1');
      expect(result.optimalStore.totalCost).toBe(400); // (90*2) + 220 = 400
    });
  });
});
```

#### Integration Tests
```typescript
// API integration tests
describe('Shopping List API', () => {
  let app: Express;
  let server: Server;
  let testDatabase: TestDatabase;
  
  beforeAll(async () => {
    testDatabase = await setupTestDatabase();
    app = createApp(testDatabase.url);
    server = app.listen(0);
  });
  
  afterAll(async () => {
    await server.close();
    await testDatabase.cleanup();
  });
  
  describe('POST /api/shopping-lists/:id/optimize', () => {
    it('should optimize shopping list and return results', async () => {
      // Setup test data
      const user = await testDatabase.createUser();
      const stores = await testDatabase.createStores();
      const products = await testDatabase.createProducts();
      const prices = await testDatabase.createPrices();
      const shoppingList = await testDatabase.createShoppingList(user.id);
      
      const response = await request(app)
        .post(`/api/shopping-lists/${shoppingList.id}/optimize`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          userLocation: { latitude: 35.6762, longitude: 139.6503 },
          maxDistance: 5
        })
        .expect(200);
        
      expect(response.body).toMatchObject({
        optimalStore: expect.objectContaining({
          store: expect.objectContaining({ id: expect.any(String) }),
          totalCost: expect.any(Number),
          totalSavings: expect.any(Number)
        }),
        itemBreakdown: expect.arrayContaining([
          expect.objectContaining({
            item: expect.any(Object),
            bestPrice: expect.any(Object)
          })
        ])
      });
    });
  });
});
```

### 9.2 Frontend Testing

#### Component Tests
```typescript
// Shopping list optimizer component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShoppingListOptimizer from './ShoppingListOptimizer';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ShoppingListOptimizer', () => {
  it('should display optimization results when optimize button is clicked', async () => {
    const mockShoppingList = {
      id: 'list1',
      name: 'Test List',
      items: [
        { id: 'item1', product: { name: 'Milk' }, quantity: 1 },
        { id: 'item2', product: { name: 'Bread' }, quantity: 2 }
      ]
    };
    
    render(
      <ShoppingListOptimizer shoppingList={mockShoppingList} />,
      { wrapper: createWrapper() }
    );
    
    const optimizeButton = screen.getByRole('button', { name: /optimize/i });
    fireEvent.click(optimizeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/optimal store/i)).toBeInTheDocument();
      expect(screen.getByText(/total cost/i)).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests
```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test';

test.describe('Price Tracker App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('should complete full shopping list optimization flow', async ({ page }) => {
    // Login
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-login"]');
    
    // Create shopping list
    await page.click('[data-testid="create-list-button"]');
    await page.fill('[data-testid="list-name-input"]', 'Weekly Shopping');
    
    // Add items
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-search"]', 'Milk');
    await page.click('[data-testid="product-option-milk"]');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-list"]');
    
    // Optimize
    await page.click('[data-testid="optimize-button"]');
    
    // Verify results
    await expect(page.locator('[data-testid="optimization-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="optimal-store-name"]')).toContainText(/store/i);
    await expect(page.locator('[data-testid="total-cost"]')).toContainText(/¥/);
  });
  
  test('should compare prices in real-time', async ({ page }) => {
    // Navigate to price comparison
    await page.click('[data-testid="compare-prices-nav"]');
    
    // Allow location access
    await page.context().grantPermissions(['geolocation']);
    
    // Input product and price
    await page.fill('[data-testid="product-name-input"]', 'Apple Juice');
    await page.fill('[data-testid="current-price-input"]', '150');
    await page.click('[data-testid="compare-button"]');
    
    // Verify comparison results
    await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-status"]')).toContainText(/(good deal|expensive)/i);
  });
});
```

この技術設計書により、スーパーマーケット価格追跡アプリの詳細な実装指針が提供されます。次のステージでは、この設計に基づいて具体的なタスクリストを作成します。

ステージ2（技術設計）が完了しました。ステージ3（タスクリスト）に進んでよろしいでしょうか？