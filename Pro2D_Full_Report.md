# Pro 2D Canvas — Full Architecture Report

Source brief: user-provided Pro 2D Canvas design brief. fileciteturn0file0

## 1. Executive recommendation

### Why build **Pro 2D Canvas** as a new tab
Build **Pro 2D Canvas** as a **new unified professional tab**, not as a direct mutation of either legacy tab.

Reason:
- **CoorCanvas** and **Smart 2D Canvas** were built around different mental models.
- **CoorCanvas** is domain-rich but interaction-poor:
  - coordinate-first drafting
  - route editing
  - emit workflow
  - fitting placement
  - coordinate-driven PCF preparation
- **Smart 2D Canvas** is shell-rich but domain-light:
  - stronger professional shell
  - top toolbar
  - left tool rail
  - property panel
  - minimap / radar
  - status bar
  - scene store / history-oriented architecture

If one legacy tab is mutated into the other, the resulting system will inherit both:
- UI coupling from CoorCanvas
- domain gaps from Smart 2D Canvas
- mixed state models
- unclear ownership of editor behavior

A new tab lets the implementation do this cleanly:
1. keep both old tabs temporarily functional
2. extract reusable logic from both
3. define one canonical editor state
4. rebind tools, panels, and import/export around that canonical state
5. retire legacy tabs only after stabilization

### Why Smart 2D Canvas is the correct shell/framework base
Use **Smart 2D Canvas** as the **UI/editor framework base** because it already matches the long-term needs of a professional editor:
- editor shell
- viewport/store separation
- history-friendly architecture
- toolbar / rail / property panel layout
- minimap / radar
- status bar
- scene/tool state organization

This is the right place to host:
- professional interaction modes
- snapping overlays
- selection model
- property sync
- future issue/annotation workflows
- future underlay/image drafting

### Why CoorCanvas logic should be absorbed
CoorCanvas should contribute:
- route row logic
- emit cutting logic
- fitting placement logic
- coordinate-driven PCF preparation logic

These are valuable **domain engines**, not long-term UI architecture.

So:
- keep the logic
- discard the shell
- port the logic into **headless Pro2D services**
- bind those services to the Smart 2D Canvas shell

### Why DXF/SVG must remain boundary formats
DXF and SVG must **not** become canonical working state.

Reason:
- **DXF** is geometry-heavy but semantics-light
- **SVG** is presentation-heavy but engineering-light
- neither format naturally represents:
  - route semantics
  - branch legality
  - fitting attachment meaning
  - support anchoring semantics
  - dynamic engineering metadata
  - editor-only repair state
  - provenance / source traceability

Therefore:
- use a canonical intermediate model:
  - `Professional2DStateTable`
- DXF/SVG are only:
  - import adapters
  - export adapters
  - metadata carriers at boundaries

---

## 2. Responsibility matrix

| Capability | Keep from Smart 2D Canvas | Keep from CoorCanvas | Create fresh in Pro 2D Canvas |
|---|---|---|---|
| Editor shell | toolbar, tool rail, status bar, minimap, panel layout | none | unified Pro 2D tab integration |
| Scene/store architecture | scene store, tool state, history/undo foundation | none | canonical Pro2D store and reducers |
| Coordinate drafting | viewport input handling, snapping shell | route drafting logic | unified drafting tools over canonical model |
| Route semantics | none | route row logic | route graph + route chain manager |
| Emit workflows | none | emit intersection / emit cuts | canonical emit entities + emit manager |
| Fitting intelligence | none | bend/tee/fitting placement logic | fitting orchestration over canonical state |
| Property panel | panel shell | none | fixed + dynamic typed header system |
| Selection & sync | selection shell | none | entity/node/route-aware selection mapping |
| Import/export | generic app integration only | PCF prep logic indirectly | DXF adapter, SVG adapter, canonical serializer |
| Validation | none | implicit geometric assumptions | explicit invariant engine |
| Repair workflows | none | partial geometry heuristics | gap clean, overlap solver, reconnect tools |
| Future extensibility | shell extensibility | none | annotations/issues, underlays, metadata governance |

### What to leave behind
**Leave behind from CoorCanvas**
- old UI shell
- legacy coupling between route UI and emit operations
- direct format-driven assumptions in editor state

**Leave behind from Smart 2D Canvas**
- any placeholder/mock property data
- any purely visual tools without canonical edit bindings

---

## 3. Canonical schema — `Professional2DStateTable`

## 3.1 Canonical model principles

`Professional2DStateTable` must be:
- editor-friendly first
- format-friendly second
- topology-aware
- geometry-bound
- metadata-extensible
- provenance-aware
- stable under undo/redo
- suitable for DXF/SVG round-trip adapters

### What must NOT be canonical
Do **not** store these as primary truth:
- raw DXF entity arrays as editor state
- raw SVG DOM as editor state
- transient selection rectangles
- viewport zoom/pan state inside entity records
- hover-only visuals
- derived caches that can be recomputed
- renderer-only tessellation data
- import parser temporary objects

Those belong in:
- adapter state
- UI/view state
- cache layers

---

## 3.2 Top-level structure

```ts
type Pro2D_Point2 = { x: number; y: number };
type Pro2D_Point3 = { x: number; y: number; z?: number };

type Pro2D_Professional2DStateTable = {
  schemaVersion: string;
  document: Pro2D_DocumentMeta;
  nodes: Record<string, Pro2D_Node>;
  entities: Record<string, Pro2D_Entity>;
  routes: Record<string, Pro2D_Route>;
  layers: Record<string, Pro2D_Layer>;
  headers: Pro2D_HeaderRegistry;
  provenance: Pro2D_ProvenanceLedger[];
  validation: Pro2D_ValidationSnapshot;
};
```

---

## 3.3 Core shared types

### Document metadata
```ts
type Pro2D_DocumentMeta = {
  documentId: string;
  name: string;
  units: "mm" | "inch";
  coordinateSystem: "2d-world";
  createdAt: string;
  updatedAt: string;
  sourceKinds: Array<"app-state" | "datatable" | "dxf" | "svg" | "manual">;
};
```

### Node model
Node is the canonical shared geometric anchor.

```ts
type Pro2D_Node = {
  id: string;
  pt: Pro2D_Point3;
  kind: "FREE" | "PIPE_ENDPOINT" | "BRANCH" | "FITTING_CENTER" | "SUPPORT_POINT" | "GUIDE_POINT";
  entityIds: string[];
  locked?: boolean;
  dynamic?: Record<string, Pro2D_FieldValue>;
  provenance?: Pro2D_SourceRef[];
};
```

### Base entity model
```ts
type Pro2D_BaseEntity = {
  id: string;
  type:
    | "PIPE"
    | "BEND"
    | "TEE"
    | "OLET"
    | "REDUCER"
    | "FLANGE"
    | "VALVE"
    | "SUPPORT"
    | "EMIT"
    | "GUIDE"
    | "ROUTE_HELPER"
    | "UNKNOWN";

  routeId?: string;
  layerId: string;

  geometry: Pro2D_GeometryBinding;
  topology: Pro2D_TopologyBinding;
  engineering: Pro2D_EngineeringFields;
  display: Pro2D_DisplayFields;
  metadata: Pro2D_MetadataBag;
  provenance: Pro2D_SourceRef[];
  dynamic: Record<string, Pro2D_FieldValue>;
};
```

---

## 3.4 Shared field groups

### Geometry binding
```ts
type Pro2D_GeometryBinding = {
  nodeIds: string[];
  path?: Pro2D_Point3[];
  center?: Pro2D_Point3;
  radius?: number;
  angleDeg?: number;
  bbox?: { minX: number; minY: number; maxX: number; maxY: number };
  anchorRefs?: Pro2D_AnchorRef[];
};
```

### Topology binding
```ts
type Pro2D_TopologyBinding = {
  connectionNodeIds: string[];
  prevEntityId?: string;
  nextEntityId?: string;
  branchEntityIds?: string[];
  attachedToEntityId?: string;
  attachedAtNodeId?: string;
  attachmentRole?: "INLINE" | "BRANCH" | "POINT" | "GUIDE" | "SUPPORT";
};
```

### Engineering fields
```ts
type Pro2D_EngineeringFields = {
  nd?: number;
  boreA?: number;
  boreB?: number;
  wallThickness?: number;
  specKey?: string;
  pipingClass?: string;
  rating?: string | number;
  material?: string;
  schedule?: string;
  insulation?: number;
  pressure?: number;
  temperature?: number;
  supportType?: string;
  valveType?: string;
  reducerType?: "CONCENTRIC" | "ECCENTRIC";
};
```

### Display fields
```ts
type Pro2D_DisplayFields = {
  visible: boolean;
  selected?: boolean;
  locked?: boolean;
  color?: string;
  strokeWidth?: number;
  lineType?: string;
  zIndex?: number;
  label?: string;
  iconKey?: string;
};
```

### Metadata + provenance
```ts
type Pro2D_MetadataBag = {
  imported?: Record<string, unknown>;
  appState?: Record<string, unknown>;
  datatable?: Record<string, unknown>;
  notes?: string[];
};

type Pro2D_SourceRef = {
  sourceKind: "app-state" | "datatable" | "dxf" | "svg" | "manual";
  sourceId?: string;
  sourceEntityId?: string;
  adapterVersion?: string;
  importedAt?: string;
};
```

---

## 3.5 Entity-by-entity minimum schema

## PIPE
### Required
- `id`
- `type = PIPE`
- `layerId`
- 2 endpoint node IDs
- route binding or standalone marker

### Optional
- length cache
- cut segments reference
- spec metadata

### Geometry
- exactly 2 endpoint nodes
- optional path if future non-orthogonal drafting is allowed

### Topology
- inline prev/next relations
- route membership

### Engineering
- bore / wall / spec / material / schedule / rating

### View
- stroke, label, linetype

### Provenance
- import source or manual tool creation

### Dynamic
- any imported field not normalized into engineering group

---

## BEND / ELBOW
### Required
- 2 endpoint nodes
- bend center or turn definition
- radius
- angle

### Optional
- long/short radius classification
- bend standard
- derived trim lengths

### Geometry
- `ep1`, `ep2`, `center`
- radius
- angleDeg

### Topology
- inline between upstream/downstream entities

### Engineering
- bore, wall, spec, material, bend standard

---

## TEE / OLET
### Required
- one run connection
- one branch connection
- tee/olet discriminator

### Optional
- reducing branch bore
- reinforcing pad / olet subtype

### Geometry
- center node
- run node refs
- branch node ref

### Topology
- one inline continuity
- one or more branch attachments

### Engineering
- run bore
- branch bore
- spec
- material

---

## REDUCER
### Required
- 2 endpoint nodes
- large/small side bore values

### Optional
- concentric/eccentric direction
- eccentric orientation vector

### Topology
- inline only

### Engineering
- boreA / boreB
- reducerType

---

## FLANGE
### Required
- anchor node or inline pair
- flange type classification if known

### Optional
- rating/facing information

### Topology
- inline or equipment-boundary anchor

---

## VALVE
### Required
- inline anchor or endpoint pair
- valve subtype

### Optional
- operator type
- open/closed state
- weight or face-to-face length

### Topology
- inline, optionally tagged as isolation/control/check/etc.

---

## SUPPORT
### Required
- one support point / anchor node
- support classification

### Optional
- direction/load metadata
- hold-down/restraint tags

### Topology
- point-attached to host entity
- not part of inline fluid continuity graph

---

## EMIT / GUIDE / ROUTE_HELPER
These are helper entities, not physical piping components.

### Required
- anchor geometry
- helper subtype

### Optional
- derived cut target
- guide visibility state
- temporary/manual tag

### Important
These must be canonical only if they are part of real editable workflow.
Purely temporary parser artifacts should **not** be stored canonically.

---

## UNKNOWN
Fallback for unsupported import content.

### Required
- raw source metadata
- stable ID
- display presence
- best-effort geometry representation

### Rule
Unknown must preserve source fidelity without poisoning normalized engineering fields.

---

## 3.6 Route model

```ts
type Pro2D_Route = {
  id: string;
  name?: string;
  entityIds: string[];
  startNodeId?: string;
  endNodeId?: string;
  branchRouteIds?: string[];
  routeKind?: "PRIMARY" | "BRANCH" | "HELPER";
  derived?: {
    totalLength?: number;
    inlineCount?: number;
    branchCount?: number;
  };
  dynamic?: Record<string, Pro2D_FieldValue>;
};
```

Purpose:
- ordered route chain tracking
- route continuity checks
- route-level operations
- emit/fitting insertion reference

---

## 4. Header model — fixed + dynamic property strategy

## 4.1 Recommendation
Use a **typed header registry** with three layers:

1. **Fixed core headers**
2. **Entity-type field groups**
3. **Dynamic imported headers**

---

## 4.2 Fixed core headers
Always available in property panel:

| Internal key | Label | Type | Scope |
|---|---|---|---|
| `id` | ID | string | all |
| `type` | Type | enum | all |
| `routeId` | Route | string | most |
| `layerId` | Layer | string | all |
| `visible` | Visible | boolean | all |
| `locked` | Locked | boolean | all |
| `label` | Label | string | all |
| `sourceKinds` | Source Kinds | tag-list | all |

---

## 4.3 Entity-type field groups
Example groups:

### Geometry group
- start X/Y
- end X/Y
- center
- radius
- angle
- anchor entity
- anchor node

### Topology group
- upstream/downstream
- branch refs
- host entity
- route position

### Engineering group
- ND
- boreA / boreB
- wall thickness
- material
- spec key
- pressure
- temperature
- rating
- support type
- valve type

### Display group
- layer
- color
- linetype
- icon
- label visibility

### Provenance group
- source kind
- imported file
- source entity ID
- adapter version

---

## 4.4 Dynamic imported headers
Dynamic headers must be typed and namespaced.

Recommendation:
- `app.<key>`
- `dt.<key>`
- `dxf.<key>`
- `svg.<key>`

Example:
- `dxf.layer`
- `dxf.blockName`
- `svg.data-pressure`
- `dt.lineNumber`
- `app.refNo`

### Why namespace them
Prevents collisions with normalized keys:
- `material` vs `dt.material_raw`
- `layerId` vs `dxf.layer`

---

## 4.5 Header registry schema
```ts
type Pro2D_HeaderRegistry = {
  fixed: Pro2D_HeaderDef[];
  byEntityType: Record<string, Pro2D_HeaderDef[]>;
  dynamic: Record<string, Pro2D_HeaderDef>;
};

type Pro2D_HeaderDef = {
  key: string;
  label: string;
  valueType: "string" | "number" | "boolean" | "enum" | "json" | "tag-list";
  group: "core" | "geometry" | "topology" | "engineering" | "display" | "provenance" | "dynamic";
  entityTypes: string[];
  editable: boolean;
  sourceKind?: "app-state" | "datatable" | "dxf" | "svg" | "manual";
};
```

---

## 4.6 Unknown-field handling
Rules:
- never discard imported unknown fields by default
- store them under namespaced dynamic headers
- allow hide/collapse in UI
- do not auto-promote to engineering fields unless normalized explicitly

---

## 5. Geometry binding model

## 5.1 Core rule
**Stable IDs** are the spine of the system.

Bindings:
- `node.id` = canonical geometric anchor
- `entity.id` = semantic/editor object
- rendered primitives carry:
  - `entityId`
  - `nodeId` where relevant
  - `routeId` where relevant

This allows:
- hit-test → entity lookup
- selection → property panel lookup
- edit handle drag → node mutation
- node mutation → dependent entity redraw
- undo/redo on canonical data only

---

## 5.2 Binding relationships

### Node ↔ entity
- pipe endpoints reference node IDs
- fittings reference center/anchor node IDs
- supports reference host node or projected anchor node
- emit helpers reference source nodes or synthetic helper nodes

### Route ↔ entity chain
- route stores ordered entity IDs
- entity stores `routeId`
- route continuity is validated explicitly

### Fitting anchoring
- BEND anchors between upstream and downstream segment endpoints
- TEE/OLET anchors at branch node
- REDUCER anchors inline with direction metadata
- FLANGE/VALVE anchor inline or boundary-wise

### Support anchoring
Support should not be a free-floating icon only.
Canonical support must know:
- host entity ID
- host node ID or parametric position along entity
- projected support point

Recommended support anchor schema:
```ts
type Pro2D_AnchorRef = {
  hostEntityId: string;
  hostNodeId?: string;
  tAlongHost?: number; // 0..1 for inline host attachment
};
```

---

## 5.3 Selection/property synchronization
Flow:
1. user clicks rendered primitive
2. viewport returns `entityId`
3. canonical store marks entity selected
4. property panel resolves fixed + typed + dynamic fields
5. edits in property panel patch canonical entity
6. renderer re-derives visuals from canonical state

Do not allow:
- renderer-only edits without canonical patch
- panel edits to bypass validators

---

## 5.4 Edit propagation
### View → state
Dragging endpoint:
- update node coordinates
- recompute attached entity geometry
- rerun impacted route continuity validation
- rerun attachment validation

### State → view
Changing engineering field:
- update entity
- property panel rerenders
- renderer updates labels/icons/styles if bound
- no geometry mutation unless rule explicitly says so

---

## 6. Dual-view strategy

## Recommendation
Use **two submodes/views over the same canonical state**:

1. **Draft View**
2. **Topology View**

This is better than:
- one overloaded unified view with too many simultaneous overlays
- completely separate data models

---

## 6.1 Draft View
Focus:
- coordinate drafting
- snapping
- measure
- break
- draw pipe/bend/tee
- stretch endpoint
- insert valve/flange/support/reducer
- underlay tracing later

Draft View emphasizes:
- local geometry
- drafting handles
- spatial clarity

---

## 6.2 Topology View
Focus:
- route continuity
- branch structure
- host/attachment relationships
- legality/invariant feedback
- helper overlays for repair operations

Topology View emphasizes:
- semantic graph
- route order
- attachment correctness
- validation state

---

## 6.3 Shared canonical model
Both views read/write:
- same nodes
- same entities
- same routes
- same metadata registry

Only representation differs.

### Why this is best
- avoids duplication
- keeps undo/redo unified
- allows professional mode switching
- makes validation consistent
- keeps import/export centralized

---

## 7. DXF mapping matrix

## 7.1 Recommended adapter architecture
Use:
- `Pro2D_DxfImporter`
- `Pro2D_DxfExporter`
- `Pro2D_DxfInferenceService`

Do not mix parsing and normalization directly into editor UI.

---

## 7.2 DXF import mapping

| DXF entity | Canonical mapping | Confidence | Notes |
|---|---|---:|---|
| LINE | PIPE or GUIDE | high | if layer/metadata suggests physical pipe, map to PIPE |
| POLYLINE | multiple PIPE segments or GUIDE path | medium | requires segmentation |
| LWPOLYLINE | multiple PIPE segments or GUIDE path | medium | similar to polyline |
| ARC | BEND/ELBOW or visual ARC fallback | medium | depends on radius/context |
| CIRCLE | SUPPORT marker / symbol / UNKNOWN | low | usually inference required |
| INSERT/BLOCK | VALVE/FLANGE/SUPPORT/UNKNOWN | low | requires block mapping dictionary |
| TEXT/MTEXT | annotation or dynamic metadata source | medium | preserve verbatim |
| LAYER | layer mapping | high | preserve |
| DIMENSION | visual-only / annotation / UNKNOWN | low | often non-semantic for piping editing |

---

## 7.3 What maps cleanly
Cleanest DXF mappings:
- layer → `layerId`
- line endpoints → node geometry
- line/polyline path → route candidate geometry
- text → annotation or metadata
- linetype/color → display fields

---

## 7.4 What needs inference
Needs inference:
- LINE is physical pipe vs helper guide
- ARC is actual bend vs decorative arc
- BLOCK/INSERT is valve/flange/support/etc.
- text belongs to nearest entity or is free annotation
- route grouping across separate primitives

Inference inputs:
- layer naming
- block names
- proximity
- angle/radius rules
- imported app/datable metadata if available
- user mapping configuration

---

## 7.5 What is lossy
Potential DXF losses:
- route semantics
- branch intent
- support host semantics
- reducer directionality unless encoded visually
- engineering metadata not present in attributes/text
- dynamic custom fields if exporter omits XData or block attrs

---

## 7.6 Metadata preservation strategy
Preserve DXF metadata in:
```ts
entity.metadata.imported = {
  dxf: {
    layer: "...",
    color: "...",
    lineType: "...",
    blockName: "...",
    text: "...",
    rawHandle: "..."
  }
}
```

Do not flatten all DXF raw fields into top-level engineering fields.

---

## 7.7 Unsupported entities
Unsupported DXF content must map to:
- `UNKNOWN`
with:
- stable ID
- best-effort bbox/anchor
- full provenance/raw source handle

This prevents silent data loss.

---

## 8. SVG mapping matrix

## 8.1 Recommended adapter architecture
Use:
- `Pro2D_SvgImporter`
- `Pro2D_SvgExporter`
- `Pro2D_SvgMetadataCodec`

SVG needs stronger metadata preservation for round-trip.

---

## 8.2 SVG import mapping

| SVG entity | Canonical mapping | Confidence | Notes |
|---|---|---:|---|
| `line` | PIPE or GUIDE | high | direct endpoints |
| `polyline` | segmented PIPE/GUIDE path | medium | requires segmentation |
| `polygon` | visual-only / UNKNOWN / closed guide | low | usually not physical piping |
| `path` | PIPE/GUIDE/UNKNOWN | low | path decomposition required |
| `circle` | support marker / symbol / UNKNOWN | low | inference needed |
| `rect` | annotation frame / underlay marker / UNKNOWN | low | generally visual only |
| `g` | group wrapper only | high | can store logical grouping/layer |
| `text` | annotation / metadata carrier | medium | preserve |
| `data-*` attrs | dynamic metadata | high | best place for round-trip preservation |
| style/class | display/layer mapping | medium | preserve namespaced |

---

## 8.3 What maps cleanly
Clean:
- `line`
- `polyline`
- `text`
- `data-*`
- group IDs/classes

### Best SVG metadata strategy
When Pro 2D exports SVG, embed editor metadata:
- `data-pro2d-id`
- `data-pro2d-type`
- `data-pro2d-route`
- `data-pro2d-host`
- namespaced custom fields if needed

This dramatically improves SVG reimport fidelity.

---

## 8.4 What should remain visual-only
Usually visual-only:
- decorative groups
- style-only paths
- hatches/pattern substitutes
- framing rectangles
- icons without metadata

These should not be over-normalized unless user requests semantic conversion.

---

## 8.5 Round-trip preservation strategy
On export, include:
- canonical ID
- type
- route ID
- host refs
- dynamic fields selectively as `data-*`

Example:
```xml
<line
  x1="0" y1="0" x2="100" y2="0"
  data-pro2d-id="ent_001"
  data-pro2d-type="PIPE"
  data-pro2d-route="route_A"
  data-pro2d-nd="100"
/>
```

---

## 9. Validation rules and invariants

Validation must be explicit and rerunnable.

## 9.1 Connectivity validity
Rule:
- every inline physical entity must resolve to valid connection node(s)
- no broken node refs

## 9.2 Route continuity
Rule:
- route entity order must correspond to connected node chain
- no discontinuous route jumps unless route explicitly marked helper/guide

## 9.3 Endpoint consistency
Rule:
- PIPE has exactly 2 endpoint nodes
- REDUCER has exactly 2 endpoint nodes
- BEND has valid endpoints consistent with center/radius
- TEE/OLET has valid run + branch anchors

## 9.4 Fitting attachment validity
Rule:
- flange/valve/reducer/bend inline attachments must bind to host continuity properly
- support cannot masquerade as inline continuity entity

## 9.5 Reducer directionality
Rule:
- if `boreA != boreB`, large/small direction must be unambiguous
- eccentric reducer must preserve orientation metadata

## 9.6 Support point validity
Rule:
- support must anchor to host entity or host node
- free-floating support only allowed if explicitly marked unresolved/imported

## 9.7 Branch legality
Rule:
- TEE/OLET branch node must connect to valid host route
- illegal branch duplication should be flagged

## 9.8 Geometry/topology consistency
Rule:
- topology edges must match geometric adjacency within tolerance
- if visually connected but topologically disconnected, flag repair candidate
- if topologically connected but geometry separated, flag inconsistency

## 9.9 Layer/item consistency
Rule:
- every entity must reference valid layer
- imported unknowns may use fallback layer but not null silently

## 9.10 Import normalization rules
- normalize units
- normalize point precision
- normalize namespaced metadata
- preserve original source refs
- never silently coerce UNKNOWN into engineering entity without inference evidence

---

## 10. Migration plan

## 10.1 Reuse from Smart 2D Canvas
Reuse directly:
- app shell layout
- toolbar framework
- tool rail framework
- property panel shell
- minimap/radar
- status bar
- scene store pattern
- history/undo architecture
- viewport interaction shell

## 10.2 Reuse from CoorCanvas
Extract and reuse as headless services:
- route row logic
- emit cutting logic
- fitting placement logic
- coordinate-driven PCF preparation
- supporting geometry math utilities

These should become modules such as:
- `Pro2D_RouteEngine`
- `Pro2D_EmitEngine`
- `Pro2D_FittingEngine`
- `Pro2D_PcfPrepEngine`
- `Pro2D_GeometryUtils`

## 10.3 Leave behind
Leave behind:
- legacy CoorCanvas tab UI
- mixed UI/domain state coupling
- format-shaped internal state
- any mock property data in Smart 2D Canvas
- placeholder tools that do not write canonical state

## 10.4 Adapters to build first
Build first:
1. app-state/datatable → canonical adapter
2. canonical → property panel typed headers
3. CoorCanvas route/emit/fitting service bridge
4. DXF importer
5. SVG importer
6. export adapters after import stabilizes

## 10.5 Safest integration order
1. Create new Pro 2D Canvas tab
2. Mount Smart 2D shell only
3. Introduce canonical store
4. Connect property panel to canonical state
5. Import from app-state/datatable
6. Port CoorCanvas logic into canonical service layer
7. Add repair/validation overlays
8. Add DXF/SVG
9. keep old tabs for fallback during stabilization
10. retire old tabs after parity + validation benchmarks

---

## 11. Phase plan

## Phase 1 — high ROI, low risk
### Goals
- Pro 2D Canvas shell
- `Professional2DStateTable`
- app-state/datatable pull
- real property panel headers
- canonical selection/edit sync

### Deliverables
- new Pro 2D tab visible and mounted
- canonical store created
- entity inspector with fixed + dynamic headers
- import from app-state/datatable into canonical rows/entities
- initial validators for IDs, nodes, layers, routes

### Dependencies
- Smart 2D shell components
- store integration
- header registry implementation

### Risks
- over-designing schema too early
- mixing route graph and UI state

### Do NOT attempt yet
- full DXF exporter
- full SVG exporter
- all professional tools
- underlay/image calibration
- final round-trip guarantees

---

## Phase 2 — medium effort
### Goals
- absorb CoorCanvas route/emit/fitting logic
- unify draft editing over canonical state
- initial topology overlays
- invariant-driven repair feedback

### Deliverables
- route engine
- emit engine
- fitting insert/convert actions
- break/connect/stretch tools bound to canonical nodes
- draft/topology mode toggle

### Dependencies
- canonical geometry bindings
- validation services
- selection sync

### Risks
- route semantics drift during migration
- hidden assumptions in CoorCanvas logic

### Do NOT attempt yet
- full DXF/SVG round-trip completeness
- annotation/issues subsystem
- advanced underlay workflows

---

## Phase 3 — major effort
### Goals
- full professional toolset
- DXF/SVG full workflows
- repair tools
- stabilization + performance hardening

### Deliverables
- draw pipe / bend / tee / reducer / support / flange / valve
- gap clean
- overlap solver
- DXF import/export
- SVG import/export with metadata round-trip
- large-scene benchmark suite
- migration/deprecation plan for old tabs

### Dependencies
- stable canonical model
- route/fitting service maturity
- metadata registry maturity

### Risks
- performance issues with large scenes
- block/insert ambiguity in DXF
- SVG reimport fidelity expectations

### Do NOT attempt yet
- replacing 3D workflows
- unrelated annotation ecosystem unless scoped separately

---

## 12. Risks and limitations

## 12.1 SVG round-trip limitations
- SVG is not semantic CAD
- arbitrary `path` content is difficult to classify
- visual grouping may not imply topology
- round-trip depends heavily on exported `data-*` metadata

## 12.2 DXF semantic lossiness
- DXF lines/arcs do not inherently mean pipe/bend
- block meanings depend on naming discipline
- topology often must be inferred

## 12.3 Block/insert complexity
- nested blocks
- transformed inserts
- missing metadata
- inconsistent symbol libraries across projects

## 12.4 Metadata ambiguity
- imported labels may conflict with normalized engineering fields
- app-state/datatable/DXF/SVG may provide contradictory values
- requires precedence rules

### Recommended precedence
1. explicit user edit
2. normalized app-state/datatable
3. trusted adapter inference
4. raw imported metadata

## 12.5 Migrating route semantics from CoorCanvas
- CoorCanvas may encode implicit assumptions in route order and emit logic
- those must be surfaced as explicit canonical invariants
- hidden assumptions are a major migration risk

## 12.6 Store complexity
- canonical model + UI state + adapter state + caches must remain separated
- otherwise undo/redo and validation become unstable

### Recommended store split
- canonical document store
- UI/view store
- adapter/import session store
- derived cache/selectors

## 12.7 Large-scene performance
Potential issues:
- hit-testing thousands of entities
- property recomputation
- route graph updates
- minimap redraw
- validation reruns

### Recommended mitigations
- spatial index for hit tests
- memoized selectors
- incremental validation
- batched redraw
- route-local recomputation

## 12.8 Underlay/image alignment issues
- raster underlays introduce transform calibration problems
- coordinate mismatch can create false topology assumptions
- should be added only after canonical editing is stable

---

## Recommended implementation modules (all prefixed)

- `Pro2D_AppShell`
- `Pro2D_SceneStore`
- `Pro2D_HeaderRegistry`
- `Pro2D_PropertyPanel`
- `Pro2D_GeometryUtils`
- `Pro2D_RouteEngine`
- `Pro2D_EmitEngine`
- `Pro2D_FittingEngine`
- `Pro2D_ValidationEngine`
- `Pro2D_DxfImporter`
- `Pro2D_DxfExporter`
- `Pro2D_SvgImporter`
- `Pro2D_SvgExporter`
- `Pro2D_TopologyOverlay`
- `Pro2D_DraftModeController`
- `Pro2D_TopologyModeController`

---

## Smoke test and quantitative benchmark

### Smoke test checklist
1. create empty Pro 2D tab
2. import app-state/datatable sample
3. render canonical entities in viewport
4. select entity → property panel resolves fixed headers
5. imported metadata appears under dynamic headers
6. drag endpoint → canonical node updates
7. route continuity validator reruns
8. switch Draft View ↔ Topology View without losing state
9. insert valve/support/bend through canonical action
10. export SVG with `data-pro2d-*` metadata
11. reimport exported SVG and preserve IDs
12. import simple DXF lines/arcs/layers and normalize to canonical entities

### Quantitative benchmark targets
| Metric | Phase 1 target | Phase 2 target | Phase 3 target |
|---|---:|---:|---:|
| Initial tab mount | < 500 ms | < 500 ms | < 600 ms |
| 1,000 entity viewport redraw | < 100 ms | < 100 ms | < 120 ms |
| Single endpoint drag commit | < 16 ms median | < 16 ms median | < 16 ms median |
| Property panel update | < 30 ms | < 30 ms | < 30 ms |
| Route-local validation rerun | < 20 ms | < 20 ms | < 25 ms |
| 10,000 entity load | n/a | < 2.5 s | < 2.0 s |
| SVG round-trip ID preservation | n/a | > 95% for editor-exported SVG | > 99% for editor-exported SVG |
| DXF basic geometry normalization success | n/a | > 85% on controlled samples | > 95% on controlled samples |

---

## Final recommendation

Build **Pro 2D Canvas** as the single long-term professional 2D editor.

Use:
- **Smart 2D Canvas** for shell/framework
- **CoorCanvas** for extracted domain engines
- **Professional2DStateTable** as the canonical model
- **DXF/SVG** as boundary adapters only

This gives the cleanest path to:
- feature growth
- maintainability
- typed property panels
- professional repair/edit tools
- stable migration away from both legacy tabs
