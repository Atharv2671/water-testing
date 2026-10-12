# Taumata Arowai - New Zealand Water Services GIS Platform

> **Te Mana o te Wai**: Official Spatial Drinking Water Register, Reticulation Network Asset Inspection, and Regulatory Compliance Portal under the *Water Services Act 2021*.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%20|%203.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.2+-336791?logo=postgresql&logoColor=white)](https://postgis.net/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.9+-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Shapely](https://img.shields.io/badge/Shapely-GEOS%202.0+-green)](https://shapely.readthedocs.io/)

---

## 1. Executive Summary & Vision

The **Taumata Arowai GIS Platform** is an enterprise-grade spatial information system and regulatory compliance hub engineered to fulfill the statutory mandates of the **Water Services Act 2021** across Aotearoa New Zealand.

The platform provides end-to-end spatial lineage tracing, matching legal Land Information New Zealand (**LINZ**) cadastral titles to municipal water suppliers, authoritative drinking water supply zones (**AklDizzy**), physical pipe reticulation networks, and upstream treatment and source assets. It equips citizens, local authorities, water service operators (e.g. Watercare), and Taumata Arowai compliance officers with authoritative data, high-precision geospatial querying, and rapid incident response tools.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TE MANA O TE WAI HIERARCHY                                │
│   1. Health & Well-being of Waterbodies  →  2. Health Needs of People  →  3. Other Uses    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Whole System Architecture

The platform is designed around a **Clean, Layered Architecture** that decouples user interfaces, RESTful API controllers, spatial computation engines, domain repositories, and multi-tier database persistence.

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Presentation Tier (React 19 + TypeScript + Leaflet)"]
        UI_Nav["Navigation & Header<br/>(Search, Roles, Tools)"]
        UI_Map["GisMap Leaflet Canvas<br/>(NZTM2000 / WGS84 Projections)"]
        UI_Layers["Layer & Basemap Panel<br/>(LINZ Light, Esri Satellite, Carto)"]
        UI_Drawer["Inspection Drawer<br/>(Asset Telemetry & Lineage)"]
        UI_Incident["Incident Reporting Modal<br/>(Citizen Quality Complaint)"]
        UI_Auth["Authentication Modal<br/>(Citizen / Official / Admin)"]
    end

    subgraph APILayer["2. API Gateway & Controller Tier (FastAPI RESTful Service)"]
        Router["FastAPI Application Router (/api/v1)"]
        AuthRoute["/auth (JWT Login & Profile)"]
        AddrRoute["/addresses (Cadastral Search & Parcels)"]
        SupplyRoute["/water-supply/resolve (7-Step Engine)"]
        ZoneRoute["/zones (Supply Zones & Buffers)"]
        AssetRoute["/assets (Pipes, Valves, Telemetry)"]
        IncRoute["/incidents (Complaint Intake & Dispatch)"]
        HealthRoute["/health & /ready (Probes)"]
    end

    subgraph ServiceLayer["3. Business Logic & Geospatial Domain Services"]
        AuthSvc["AuthService<br/>(Bcrypt, JWT HS256, RBAC Claims)"]
        AddrSvc["AddressService<br/>(Cadastral Matching & Ingestion)"]
        SupplySvc["WaterSupplyResolutionService<br/>(7-Step Authoritative Engine)"]
        SpatialSvc["SpatialService (LINZ Formulae)<br/>(EPSG:4326 ⇄ EPSG:2193 & Shapely GEOS)"]
        IncidentSvc["IncidentService<br/>(Reference Tracking & Investigation State)"]
    end

    subgraph RepoLayer["4. Data Access Repositories (SQLAlchemy 2.0 ORM)"]
        UserRepo["User & Audit Repositories"]
        ZoneRepo["Supply Zone Repository"]
        NetworkRepo["Network & Asset Repository"]
        IncRepo["Incident Complaint Repository"]
    end

    subgraph StorageLayer["5. Dual Persistence Layer"]
        SQLiteDB[("Zero-Config Spatial SQLite<br/>(water_services.db)<br/>Instant Local Dev")]
        PostGISDB[("Production PostgreSQL 16+<br/>+ PostGIS 3.2+<br/>(schema.sql with GiST Indexes)")]
    end

    UI_Nav & UI_Map & UI_Drawer & UI_Incident & UI_Auth -->|HTTP / JSON with CORS| Router
    Router --> AuthRoute & AddrRoute & SupplyRoute & ZoneRoute & AssetRoute & IncRoute & HealthRoute
    AuthRoute --> AuthSvc
    AddrRoute --> AddrSvc
    SupplyRoute --> SupplySvc
    ZoneRoute --> SpatialSvc
    AssetRoute --> NetworkRepo
    IncRoute --> IncidentSvc
    SupplySvc --> SpatialSvc
    SupplySvc --> ZoneRepo
    SupplySvc --> NetworkRepo
    AuthSvc --> UserRepo
    IncidentSvc --> IncRepo
    ZoneRepo & NetworkRepo & IncRepo & UserRepo --> SQLiteDB
    ZoneRepo & NetworkRepo & IncRepo & UserRepo -.->|Optional DATABASE_URL| PostGISDB
```

---

## 3. Important Authority Graph & Access Control Hierarchy

Security and data integrity are governed by strict **Role-Based Access Control (RBAC)**. Critical infrastructure telemetry (such as pipe CCTV defect scores, pipe invert depths, and confidential engineering notes) is protected and redacted from public view to prevent infrastructure exploitation, while public safety information remains fully transparent.

```mermaid
flowchart TD
    subgraph Identities["Identities & Authentication"]
        Anon["Anonymous Citizen<br/>(Public Web Visitor)"]
        CitizenUser["Authenticated Citizen<br/>(citizen@nzwater.org.nz)"]
        OfficialUser["Authorized Official<br/>(official@taumataarowai.govt.nz)"]
        AdminUser["System Administrator<br/>(admin@taumataarowai.govt.nz)"]
    end

    subgraph SecurityGateway["FastAPI RBAC Security Gateway"]
        PublicGate["get_current_user_optional<br/>(Permissive Public Access)"]
        OfficialGate["require_official_or_admin<br/>(JWT Bearer Token Validation)"]
        AdminGate["require_admin<br/>(Full Governance Scope)"]
    end

    subgraph DataAccessGraph["Data Redaction & Operations Graph"]
        PublicData["PUBLIC COMPLIANCE VIEW:<br/>• Drinking Water Supply Scheme Name<br/>• Water Supplier & Operator<br/>• Rule Compliance Status (Grade A1, etc.)<br/>• Active Boil-Water Notices<br/>• Public Pipe Diameter & Material<br/>• Incident Complaint Logging Intake"]
        
        ProtectedData["OFFICIAL INFRASTRUCTURE & ENFORCEMENT VIEW:<br/>• CCTV Internal Condition Scores (Grade 1 - 5)<br/>• Pipeline Invert Depths (Meters Below Ground)<br/>• Confidential Engineering Maintenance Notes<br/>• 50m - 1500m Concentric Risk Buffer Corridors<br/>• Incident Status Updates (Under Investigation, Dispatched)<br/>• Compliance Officer Investigation Notes"]
        
        AdminData["ADMINISTRATIVE GOVERNANCE VIEW:<br/>• Spatial Property Resolution Query Audit Logs<br/>• User Role Governance & System Telemetry<br/>• Spatial Layer Upload & Re-Seeding Management<br/>• PostGIS Database Maintenance"]
    end

    Anon --> PublicGate
    CitizenUser --> PublicGate
    OfficialUser --> OfficialGate
    AdminUser --> AdminGate

    PublicGate --> PublicData
    OfficialGate --> PublicData & ProtectedData
    AdminGate --> PublicData & ProtectedData & AdminData

    style PublicData fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style ProtectedData fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    style AdminData fill:#fef2f2,stroke:#dc2626,stroke-width:2px
```

### RBAC Field-Level Telemetry Redaction Matrix

| Attribute / Operation | Citizen / Public | Authorized Official | System Administrator | Security Rationale |
|---|:---:|:---:|:---:|---|
| **View Supply Scheme & Operator** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Public drinking water transparency |
| **View Water Compliance Grade** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Mandatory public disclosure under Act |
| **Log Incident / Complaint** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Citizen reporting intake |
| **View Pipe Diameter & Material** | ✅ Allowed | ✅ Allowed | ✅ Allowed | Basic reticulation awareness |
| **View CCTV Defect Score (1-5)** | ❌ Redacted (`null`) | ✅ Unredacted | ✅ Unredacted | Critical infrastructure vulnerability protection |
| **View Pipe Invert Depth (m)** | ❌ Redacted (`null`) | ✅ Unredacted | ✅ Unredacted | Excavation and physical security safety |
| **View Engineering Notes** | ❌ Redacted (`null`) | ✅ Unredacted | ✅ Unredacted | Operator proprietary notes |
| **Update Incident Status** | ❌ Forbidden (`403`) | ✅ Allowed | ✅ Allowed | Official regulatory workflow integrity |
| **Inspect Query Audit Logs** | ❌ Forbidden (`403`) | ❌ Forbidden (`403`) | ✅ Allowed | Privacy and data governance compliance |

---

## 4. Primary Use Cases & Stakeholder Profiles

```mermaid
quadrantChart
    title Platform Stakeholders & Operational Scope
    x-axis Low Technical Expertise --> High Technical Expertise
    y-axis Public Consumer Interest --> Regulatory & Engineering Depth
    quadrant-1 Taumata Arowai Officials & Asset Engineers
    quadrant-2 Citizens & Property Owners
    quadrant-3 Community Advocates
    quadrant-4 GIS Analysts & Database Administrators
    "Property Owners": [0.25, 0.45]
    "Tenants & Residents": [0.15, 0.35]
    "Watercare Asset Engineers": [0.85, 0.90]
    "Taumata Arowai Inspectors": [0.75, 0.85]
    "Council Planners": [0.70, 0.65]
    "Environmental Scientists": [0.80, 0.70]
```

### Use Case 1: Citizen Drinking Water Verification & Contamination Reporting
- **Actors**: Residents, property purchasers, business owners.
- **Workflow**: 
  1. Search a street address (e.g. `4015 Great North Road, Kelston`).
  2. The system locates the LINZ cadastral parcel, highlights the boundary polygon, and verifies the registered drinking water scheme (`SUP-AKL-001 - Auckland Municipal Watercare Network`).
  3. Inspects current water compliance status and verifies there are no active boil-water notices.
  4. If discoloration, low pressure, or chemical taste is observed, the citizen logs a geo-tagged incident directly from the map, receiving a tracking reference (e.g. `NZ-DW-2026-4821`).

### Use Case 2: Watercare & Municipal Reticulation Network Tracing
- **Actors**: Network operations personnel, field maintenance crews.
- **Workflow**:
  1. Click an active parcel or water valve.
  2. The system traces the physical reticulation network upstream:
     - **Service Pipe**: 20mm PE100 connection pipe (`COMPKEY: 2017826`).
     - **Isolation Valve**: Sluice isolation valve (`COMPKEY: 2017899`).
     - **Reticulation Main**: 150mm Ductile Iron main (`COMPKEY: 2017820`).
     - **Balancing Reservoir**: Titirangi High-Level Water Reservoir (45,000 m³).
     - **Treatment Plant**: Huia Water Treatment Plant (DAF & Sand Filtration).
     - **Raw Water Dams**: Waitakere & Lower Nihotupu Native Catchment Dams.
  3. Instant determination of downstream impact during planned watermain shutdowns.

### Use Case 3: Taumata Arowai Regulatory Compliance & Incident Dispatch
- **Actors**: Drinking Water Compliance Officers, District Health Officers.
- **Workflow**:
  1. Authenticate with official credentials (`official@taumataarowai.govt.nz`).
  2. Review the incident queue filtered by status (`Submitted`, `Under Investigation`, `Sampling Dispatched`).
  3. Inspect buffer corridors (50m - 1500m) surrounding the incident to identify vulnerable populations (schools, hospitals, marae).
  4. Dispatch mobile water quality sampling teams and update the investigation status and compliance notes.

### Use Case 4: Engineering Assessment & CCTV Asset Audit
- **Actors**: Senior civil engineers, asset lifecycle planners.
- **Workflow**:
  1. Filter network assets by category (`reticulation_main`, `isolation_valve`).
  2. Inspect pipe condition telemetry: installation year (1998), operating pressure (4.8 bar), and CCTV defect score (Grade 2 - Minor defect).
  3. Export spatial layers for GIS work orders.

---

## 5. The 7-Step Authoritative Resolution Engine

The core spatial engine resolves any property address, legal parcel ID, or GPS coordinate to its authoritative water supply scheme and infrastructure lineage through a deterministic 7-step sequence:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / GIS Client
    participant API as /api/v1/water-supply/resolve
    participant Svc as WaterSupplyResolutionService
    participant Spatial as SpatialService (LINZ Engine)
    participant Repo as Zone & Network Repository
    participant Audit as DB Audit Query Log

    User->>API: POST {address: "4015 Great North Road", coordinates: [-36.9094, 174.6806]}
    API->>Svc: resolve_water_supply(req)
    
    rect rgb(240, 249, 255)
        Note over Svc,Spatial: Step 1 & 2: Geocoding & Metric Projection
        Svc->>Svc: Locate LINZ Cadastral Parcel & Center Point
        Svc->>Spatial: to_nztm2000(lat, lng) [LINZ Transverse Mercator]
        Spatial-->>Svc: NZTM2000 Coordinates: {Easting: 1748200m E, Northing: 5914300m N}
    end

    rect rgb(245, 243, 255)
        Note over Svc,Repo: Step 3 & 4: Spatial Containment (GEOS via Shapely)
        Svc->>Repo: Fetch Auckland Zone Polygons (AklDizzy)
        Svc->>Spatial: Point-in-Polygon Containment Test (Shapely)
        alt Inside Exactly One Supply Zone
            Svc->>Svc: Assign Zone (AKL-SZ-14: West Auckland - Waitakere Dizzy) -> Status: VERIFIED
        else Inside Multiple Overlapping Zones
            Svc->>Svc: Boundary Conflict Detected -> Status: AMBIGUOUS (Review Required)
        else Outside All Supply Zones
            Svc->>Spatial: Calculate Min Distance to Nearest Zone Boundary
            alt Distance <= 1500m
                Svc->>Svc: Near Supply Zone Boundary -> Status: NEAR_ZONE (Warning Attached)
            else Distance > 1500m
                Svc->>Svc: Outside Registered Reticulation -> Status: UNMAPPED_OUTSIDE_RETICULATION
            end
        end
    end

    rect rgb(240, 253, 244)
        Note over Svc,Repo: Step 5 & 6: Buffer Tier & Physical Asset Lineage
        Svc->>Spatial: Evaluate Concentric Buffer Corridors (50m, 100m, 200m, 500m, 1500m)
        Svc->>Repo: Fetch Upstream Scheme, Dam, WTP, Reservoir & Connecting Watermain
        Svc->>Svc: Bind Lineage Model to Response
    end

    rect rgb(254, 242, 242)
        Note over Svc,Audit: Step 7: Compliance Logging & Audit
        Svc->>Audit: Record Query in spatial_property_queries (Address, Coords, Latency, Status)
    end

    Svc-->>API: WaterSupplyResolutionResponse (DTO)
    API-->>User: 200 OK (Authoritative Structured JSON)
```

---

## 6. Physical Network Lineage & Reticulation Hierarchy

Drinking water travels through a strictly governed physical hierarchy from source catchments to household taps:

```mermaid
flowchart TD
    subgraph RawSource["1. Raw Water Catchment & Dams"]
        Dam1["Waitakere Dam<br/>(Capacity: 14,800 ML)"]
        Dam2["Lower Nihotupu Dam<br/>(Capacity: 15,000 ML)"]
    end

    subgraph Treatment["2. Water Treatment Facilities"]
        WTP["Huia Water Treatment Plant<br/>(Dissolved Air Flotation + Sand Filtration + Chlorination)<br/>Compliance Grade: A1 (Rules Compliant)"]
    end

    subgraph Storage["3. High-Level Balancing Reservoirs"]
        Res["Titirangi High-Level Balancing Reservoir<br/>(Capacity: 45,000 m³ | Head: 132m)"]
    end

    subgraph Reticulation["4. Municipal Reticulation Network"]
        Main["Great North Road Watermain<br/>(COMPKEY: 2017820 | 150mm Ductile Iron | 4.8 Bar)"]
        Valve["Sluice Isolation Valve<br/>(COMPKEY: 2017899 | Code: VLV-10029)"]
        ServicePipe["Polyethylene Service Pipe<br/>(COMPKEY: 2017826 | 20mm PE100)"]
    end

    subgraph Metering["5. Point of Supply Boundary"]
        Meter["Front Boundary Toby Box & Water Meter<br/>(Serial: WTR-2021-99482 | 20mm | Backflow: Low)"]
    end

    subgraph Customer["6. Legal Cadastral Parcel & Citizen"]
        Parcel["Cadastral Parcel: PARCEL-4015-GNR<br/>(Lot 14 DP 48291 | 812 m² | Title: NA192/441)<br/>4015 Great North Road, Kelston, Auckland"]
    end

    Dam1 & Dam2 -->|Raw Water Gravity Tunneled Aqueduct| WTP
    WTP -->|High-Pressure Treated Transmission Main| Res
    Res -->|Trunk Distribution Feeder| Main
    Main -->|Network Protection & Control| Valve
    Main -->|Sub-Meter Connection| ServicePipe
    ServicePipe -->|Legal Road Berm Boundary| Meter
    Meter -->|Private Water Line| Parcel

    style RawSource fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style Treatment fill:#e0e7ff,stroke:#4338ca,stroke-width:2px
    style Storage fill:#ede9fe,stroke:#6d28d9,stroke-width:2px
    style Reticulation fill:#ccfbf1,stroke:#0f766e,stroke-width:2px
    style Metering fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style Customer fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px
```

---

## 7. Water Incident Investigation Lifecycle

Citizen contamination reports and network defect submissions follow a structured regulatory workflow:

```mermaid
stateDiagram-v2
    [*] --> Submitted: Citizen submits complaint via map (Auto generates NZ-DW-2026-XXXX)
    
    Submitted --> UnderInvestigation: Official reviews report & verifies parcel lineage
    Submitted --> Resolved: Duplicate / Invalid submission with explanatory notes
    
    UnderInvestigation --> SamplingDispatched: Compliance team orders water quality laboratory sampling
    UnderInvestigation --> Resolved: Issue rectified (e.g. routine mains flushing complete)
    
    SamplingDispatched --> SamplingDispatched: Test results evaluated (Turbidity, E. coli, FAC)
    SamplingDispatched --> BoilWaterNotice: Pathogen detection triggers emergency notice
    SamplingDispatched --> Resolved: Water quality confirmed compliant with NZDWS
    
    BoilWaterNotice --> Resolved: Retesting passes & Boil Water Notice rescinded
    
    Resolved --> [*]: Report archived with full audit notes
```

---

## 8. Complete Project Directory Structure

```text
water-testing/
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore specifications
├── AGENTS.md                        # Agent operating instructions
├── README.md                        # Master project architecture & presentation documentation
├── RUN_GUIDE.txt                    # Standalone plain-text run cheat sheet
├── SAFE_RUN_GUIDE.txt               # Comprehensive safe execution & troubleshooting guide
├── package.json                     # Frontend npm dependencies & build scripts
├── tsconfig.json                    # Strict TypeScript compilation options
├── vite.config.ts                   # Vite bundler configuration
│
├── .vscode/                         # VS Code Developer Configuration
│   ├── launch.json                  # One-click debugging for FastAPI, Pytest & Seeding
│   ├── settings.json                # Python interpreter & formatter configuration
│   └── tasks.json                   # Quick-action VS Code task automation
│
├── backend/                         # FastAPI High-Performance Backend Service
│   ├── README.md                    # Backend service documentation
│   ├── backend_api.http             # Runnable VS Code REST Client API test suite
│   ├── manage_db.py                 # Standalone database management script
│   ├── requirements.txt             # Python backend dependencies
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & middleware
│   │   ├── api/
│   │   │   ├── router.py            # Master API route orchestrator
│   │   │   └── routes/
│   │   │       ├── health.py        # /health & /ready probes
│   │   │       ├── auth.py          # /auth/login & /auth/me
│   │   │       ├── addresses.py     # /addresses/search & /addresses/{id}
│   │   │       ├── water_supply.py  # /water-supply/resolve (7-Step Engine)
│   │   │       ├── zones.py         # /zones & /zones/{id}/buffers
│   │   │       ├── networks.py      # /networks & /networks/{id}
│   │   │       ├── assets.py        # /assets & /assets/{compkey} (RBAC filtered)
│   │   │       └── incidents.py     # /incidents (Intake & Investigation)
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic v2 application settings
│   │   │   ├── errors.py            # Global exception handlers
│   │   │   └── security.py          # JWT HS256 & Bcrypt password hashing
│   │   ├── db/
│   │   │   ├── session.py           # SQLAlchemy session engine & connection fallback
│   │   │   ├── seed.py              # Pre-seeding script for all Auckland GIS data
│   │   │   ├── data/
│   │   │   │   └── water_services.db# Standalone 3MB spatial SQLite database
│   │   │   └── models/
│   │   │       ├── user.py          # User accounts & RBAC roles
│   │   │       ├── zone.py          # Auckland Drinking Water Supply Zones
│   │   │       ├── scheme.py        # Drinking water schemes & operators
│   │   │       ├── asset.py         # Physical pipes, valves, dams, WTPs
│   │   │       ├── incident.py      # Citizen water incident complaints
│   │   │       └── query_log.py     # Property resolution audit logging
│   │   ├── repositories/
│   │   │   ├── address_repository.py# Cadastral parcel retrieval
│   │   │   ├── zone_repository.py   # Spatial zone querying
│   │   │   ├── network_repository.py# Reticulation network queries
│   │   │   └── incident_repository.py# Complaint database transactions
│   │   ├── schemas/
│   │   │   ├── auth.py              # Token & user request/response DTOs
│   │   │   ├── address.py           # LINZ cadastral schema definitions
│   │   │   ├── gis.py               # Spatial zones, schemes & asset DTOs
│   │   │   ├── water_supply.py      # 7-Step resolution request/response DTOs
│   │   │   └── incident.py          # Incident complaint request/response DTOs
│   │   └── services/
│   │       ├── auth_service.py      # User authentication & token management
│   │       ├── address_service.py   # Address parsing & matching
│   │       ├── spatial_service.py   # LINZ EPSG:2193 projection & Shapely GEOS
│   │       ├── water_supply_service.py # 7-Step authoritative resolution engine
│   │       └── incident_service.py  # Incident complaint & dispatch workflows
│   └── tests/                       # Automated Pytest Suite (34 Tests)
│       ├── test_health.py           # Health & readiness probe tests
│       ├── test_auth.py             # Login, invalid password & RBAC tests
│       ├── test_address_search.py   # Cadastral parcel lookup tests
│       ├── test_water_supply_resolution.py # 7-step resolution engine tests
│       ├── test_zones_and_assets.py # Zone geometry & asset redaction tests
│       ├── test_incidents.py        # Complaint logging & status update tests
│       └── test_spatial.py          # LINZ NZTM2000 mathematical projection tests
│
├── database/                        # PostgreSQL / PostGIS Spatial Database
│   ├── README.md                    # Database architecture documentation
│   └── schema.sql                   # Idempotent DDL with PostGIS GiST spatial indexing
│
├── docs/                            # Technical Architecture & Manuals
│   ├── api-contract.md              # REST API contract specification
│   ├── backend-architecture.md      # Clean architecture deep dive
│   ├── frontend-integration-plan.md # Frontend API client integration guide
│   └── VS_CODE_BACKEND_DEVELOPER_GUIDE.pdf # Printable PDF Developer & VS Code API Manual
│
├── scripts/                         # Geospatial Python Processing
│   ├── process_mentor_data.py       # GeoPandas ETL script for Esri .gdb layers
│   └── tile_water_network.py        # Spatial tiling script for pipe network
│
└── src/                             # React 19 Frontend Web Application
    ├── App.tsx                      # Master layout orchestrator & state manager
    ├── main.tsx                     # React DOM root entrypoint
    ├── index.css                    # Tailwind CSS v4 styling rules
    ├── components/
    │   ├── Header.tsx               # Navigation bar, search input & role switcher
    │   ├── GisMap.tsx               # High-precision Leaflet spatial canvas
    │   ├── LayerPanel.tsx           # Basemap & spatial layer selector
    │   ├── InspectionDrawer.tsx     # Physical asset inspector & lineage telemetry
    │   ├── CitizenComplaintModal.tsx # Water incident complaint workflow
    │   ├── DataRequestModal.tsx     # Custom GeoJSON ingestion modal
    │   ├── DocumentationModal.tsx   # In-app architecture & help viewer
    │   ├── LoginModal.tsx           # Multi-role authentication modal
    │   ├── ProfileDashboard.tsx     # Authenticated user profile drawer
    │   └── TaumataArowaiLogo.tsx    # Official vector branding emblem
    ├── config/
    │   └── apiConfig.ts             # Basemap CDN URLs and API endpoints
    ├── data/
    │   └── nzData.ts                # Authoritative Auckland parcels, pipes & assets
    ├── types/
    │   └── gis.ts                   # Strict TypeScript domain interfaces
    └── utils/
        └── waterLineageEngine.ts    # Client-side spatial geometry calculations
```

---

## 9. Comprehensive REST API Catalog

The backend exposes a clean, versioned REST API. All endpoints are accessible with `/api/v1` or convenient `/api` aliases.

| HTTP Method | Route Endpoint | RBAC Access Level | Functional Description |
|---|---|:---:|---|
| `GET` | `/api/health` | **Public** | Uptime check returning status, timestamp, and version |
| `GET` | `/api/ready` | **Public** | Readiness probe verifying database & GEOS spatial engine |
| `POST` | `/api/v1/auth/login` | **Public** | Authenticates user credentials and issues JWT Bearer token |
| `GET` | `/api/v1/auth/me` | **Authenticated** | Returns current user profile, organization, and assigned role |
| `GET` | `/api/v1/addresses/search` | **Public** | Searches LINZ cadastral parcels by street, lot, or DP number |
| `GET` | `/api/v1/addresses/{id}` | **Public** | Retrieves full cadastral parcel feature and service connections |
| `GET` | `/api/v1/addresses/{id}/water-supply` | **Public** | Resolves verified drinking water supply for a known parcel ID |
| `POST` | `/api/v1/water-supply/resolve` | **Public** | **7-Step Authoritative Resolution Engine** (address or coordinates) |
| `GET` | `/api/v1/zones` | **Public** | Lists all 43 Auckland Drinking Water Supply Zones (`AklDizzy`) |
| `GET` | `/api/v1/zones/{zone_id}` | **Public** | Returns zone geometry, population, and compliance grades |
| `GET` | `/api/v1/zones/{zone_id}/buffers`| **Public** | Returns concentric risk buffer tiers (50m, 100m, 200m, 500m, 1500m) |
| `GET` | `/api/v1/networks` | **Public** | Lists drinking water supply schemes (e.g. `SUP-AKL-001`) |
| `GET` | `/api/v1/networks/{id}` | **Public** | Returns detailed supply scheme, source water, and operator |
| `GET` | `/api/v1/assets` | **Public / Official** | Filterable network assets; **telemetry redacted for public users** |
| `GET` | `/api/v1/assets/{compkey}` | **Public / Official** | Detailed asset by Watercare COMPKEY; **telemetry redacted for public** |
| `POST` | `/api/v1/incidents` | **Public** | Submits water contamination or quality incident complaint |
| `GET` | `/api/v1/incidents` | **Public** | Lists registered incident complaints with filtering |
| `GET` | `/api/v1/incidents/{id}` | **Public** | Retrieves individual incident complaint by reference ID |
| `PATCH`| `/api/v1/incidents/{id}` | **Official / Admin** | Updates investigation status and compliance officer notes |

---

## 10. Quick Start & Execution Guide

### 10.1 Running the Frontend Application (Vite + React 19)

```bash
# 1. Clone or navigate to the repository
cd water-testing

# 2. Copy environment template (if not already present)
cp .env.example .env

# 3. Install frontend dependencies (Run once only)
npm install

# 4. Start the Vite development server on port 3000
npm run dev
```

Open your browser at:  
👉 **`http://localhost:3000`**

To stop the server at any time, press **`Ctrl + C`** in your terminal.

---

### 10.2 Running the Backend REST Service (FastAPI + Python)

The backend operates **out of the box** using a pre-seeded standalone SQLite spatial database (`backend/app/db/data/water_services.db`). No PostgreSQL setup is required for local development!

```bash
# Windows PowerShell
$env:PYTHONPATH="."
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# macOS / Linux
export PYTHONPATH="."
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Once running:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Technical Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Probe**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 10.3 Preconfigured Test Accounts (RBAC)

Use these credentials to test role switching in the UI or when requesting JWT tokens via `/api/v1/auth/login`:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Public Citizen** | `citizen@nzwater.org.nz` | `CitizenNZ#2026` | Public compliance grades, scheme names, incident complaint submission |
| **Authorized Official** | `official@taumataarowai.govt.nz` | `OfficialWater#2026` | Unredacted CCTV scores, invert depths, engineering notes, incident triage |
| **System Administrator** | `admin@taumataarowai.govt.nz` | `ArowaiAdmin#2026` | Full system governance, audit logs, and data administration |

---

### 10.4 Running Automated Verification Tests

Execute the comprehensive 34-test suite validating spatial algorithms, the 7-step resolution engine, RBAC telemetry redaction, and API contracts:

```bash
# Run full automated test suite
pytest -v backend/tests
```

---

## 11. Production PostGIS Deployment (Optional)

To scale from the standalone SQLite database to a high-availability **PostgreSQL 16+ / PostGIS 3.2+** production cluster:

1. **Initialize the Spatial Database**:
   ```bash
   createdb -U postgres taumata_arowai_gis
   psql -U postgres -d taumata_arowai_gis -f database/schema.sql
   ```
2. **Configure Database Connection**:
   Update `DATABASE_URL` in your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/taumata_arowai_gis"
   ```
3. **Automatic Fallback Protection**:
   The backend includes built-in connection resiliency. If the PostgreSQL server is ever temporarily unreachable, the system automatically falls back to the embedded SQLite spatial database to ensure zero downtime.

---

## 12. Regulatory Governance & Standards Compliance

This platform implements the digital statutory framework mandated by:
- **Water Services Act 2021** (Act No 36 of 2021)
- **Te Mana o te Wai**: Upholding the mauri (life-force) of water bodies as the primary foundational principle
- **Drinking Water Quality Assurance Rules (DWQAR)**
- **New Zealand Drinking Water Standards (NZDWS)**
- **LINZ NZTM2000 (EPSG:2193)**: Official New Zealand metric Transverse Mercator spatial reference system

---

## 13. Data Custodians & Attributions

- **Spatial Data Custodians**: Taumata Arowai, Watercare Services Limited, Land Information New Zealand (LINZ), Auckland Council GIS.
- **Basemap Tile Endpoints**: CARTO (OpenStreetMap contributors), Esri World Imagery Satellite, LINZ Data Service.
