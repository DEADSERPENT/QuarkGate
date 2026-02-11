Everything is in place. Here's a summary of what was built:                                                                                                                                                                                               
  Implementation Complete                                                                                                     
  
  Files Created (23 files)                                                                                                                                                                                                                                  
  Frontend scaffold:
  - frontend/package.json — Vite + React 19 + Apollo Client 4 + Tailwind 4 + React Router 7 + Lucide React
  - frontend/vite.config.js — Vite with Tailwind CSS plugin
  - frontend/index.html — with Inter font

  Core:
  - src/main.jsx — ApolloProvider + BrowserRouter wrapper
  - src/App.jsx — 7 routes with Layout
  - src/index.css — Tailwind v4 with custom theme (indigo primary, dark sidebar)

  GraphQL:
  - src/graphql/client.js — Apollo Client pointing to localhost:8080/graphql
  - src/graphql/queries/ — 4 query files (user, product, order, dashboard) using BigInteger! for IDs

  Layout (3): Sidebar, Layout, PageHeader

  Common components (5): LoadingSpinner, ErrorAlert, StatusBadge, StatCard, DataTable

  Pages (7):
  ┌─────────────┬──────────────────────────────────────────────────┬───────────────────────────┐
  │    Route    │                       Page                       │         Services          │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /           │ Dashboard — stat cards + recent orders           │ User + Product + Order    │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /users      │ Users table (clickable rows)                     │ User                      │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /users/:id  │ User detail + their orders                       │ User + Order              │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /products   │ Product cards with category filters              │ Product                   │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /orders     │ Orders table with status filters                 │ Order                     │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /orders/:id │ Order detail + products + payment                │ Order + Product + Payment │
  ├─────────────┼──────────────────────────────────────────────────┼───────────────────────────┤
  │ /playground │ GraphQL tester with 6 presets, timing, raw fetch │ Dynamic                   │
  └─────────────┴──────────────────────────────────────────────────┴───────────────────────────┘
  Backend change:
  - Added CORS config to graphql-gateway-service/application.properties for localhost:5173

  Verification

  Build passes (npx vite build → 441KB JS, 18KB CSS). To run:
  cd frontend && npm run dev
  Then open http://localhost:5173 (backend services must be running for data to load).


  You have two options:                                                                                                         
  ---                                                                                                                           Option 1: Docker Compose (easiest — runs everything)
                                                                                                                                cd C:\Users\AKSHAY\Music\QURACUS                                                                                            

  # Build all services first (one-time)
  mvnw.cmd package -DskipTests

  # Start everything (4 DBs + Redis + 5 services)
  docker-compose up --build

  This starts all databases, Redis, 4 microservices, and the GraphQL gateway. Wait until all services are healthy, then open  
  http://localhost:5173.

  ---
  Option 2: Local dev (run each service separately)

  Step 1 — Start just the databases + Redis:
  docker-compose up user-db product-db order-db payment-db redis

  Step 2 — Run each service in dev mode (open 5 separate terminals):

  # Terminal 1: User Service (port 8081)
  cd user-service
  mvnw.cmd quarkus:dev

  # Terminal 2: Product Service (port 8082)
  cd product-service
  mvnw.cmd quarkus:dev

  # Terminal 3: Order Service (port 8083)
  cd order-service
  mvnw.cmd quarkus:dev

  # Terminal 4: Payment Service (port 8084)
  cd payment-service
  mvnw.cmd quarkus:dev

  # Terminal 5: GraphQL Gateway (port 8080)
  cd graphql-gateway-service
  mvnw.cmd quarkus:dev

  Step 3 — Start frontend (6th terminal):
  cd frontend
  npm run dev

  ---
  Option 2 gives you Quarkus live reload on each service. Option 1 is simpler if you just want everything running. Either way,
   the frontend at http://localhost:5173 connects to the gateway at http://localhost:8080/graphql.



   Terminal 1 — Backend (all databases + services):                                                                              cd C:\Users\AKSHAY\Music\QURACUS
  docker-compose up --build                                                                                                                                                                                                                                 
  Terminal 2 — Frontend:                                                                                                      
  cd C:\Users\AKSHAY\Music\QURACUS\frontend
  npm run dev

  Wait for Terminal 1 to show all services are up (you'll see log output from all 5 services), then open
  http://localhost:5173.

   Docker Compose v2 uses docker compose (without the hyphen):                                                                                                                                                                                               
  docker compose up --build                                                                                                      
  If that also fails, Docker Desktop may not be installed or not running. Check with:                                         
  
  docker --version

  If Docker isn't installed, you'll need to https://www.docker.com/products/docker-desktop/ first, then restart your terminal.