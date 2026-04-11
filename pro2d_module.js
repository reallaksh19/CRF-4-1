/*
 * pro2d_module.js
 *
 * This module encapsulates the high level architecture specification and
 * canonical data definitions for the new “Pro 2D Canvas” editor.  It is
 * deliberately self‑contained: there are no external imports and all
 * exported names are prefixed with `Pro2D_` to avoid collisions with
 * existing modules.  The intention is to provide a stable reference
 * point for both the implementation team and any automated tests.
 *
 * The exported objects and functions mirror the research deliverables
 * described in the specification (see `Pasted text.txt`).  Each
 * deliverable is represented either as a string (for narrative
 * recommendations), an array of objects (for tables) or a plain object
 * (for schemas and mappings).  A simple benchmark function is also
 * provided which can be used as a smoke test to validate the integrity
 * of the canonical schema and perform a basic quantitative check on
 * the contents.
 */

"use strict";

/* --------------------------------------------------------------------------
 * Executive recommendation
 *
 * A concise summary of why a fresh unified tab is needed, why Smart 2D
 * Canvas should be the hosting framework, why CoorCanvas logic should be
 * absorbed instead of maintained separately, and why DXF/SVG should be
 * treated as boundary formats rather than the internal working model.  The
 * language here draws directly from the research brief: the new editor
 * needs to combine coordinate‑driven drafting with semantic editing, and
 * it must do so in a maintainable, professional way.
 */
const Pro2D_executiveRecommendation = [
  // Use an array of paragraphs so consumers can decide how to render
  // them (e.g. join with newlines or wrap in a UI component).  Keeping
  // paragraphs separate also makes it easy to insert additional detail
  // without splitting sentences later on.
  `Build **Pro 2D Canvas** as a new, dedicated tab rather than mutating the existing tabs.  Each legacy tab was designed around a different mental model – CoorCanvas is coordinate‑first and focuses on route/emit workflows【524232373199522†L12-L18】 while Smart 2D Canvas provides a robust professional shell with toolbars, panels and history management【524232373199522†L19-L19】.  Attempting to combine them piecemeal would entrench technical debt.  Starting fresh allows the team to define clear boundaries, retire obsolete code and evolve the UI without disrupting existing users.`,
  `Use **Smart 2D Canvas** as the base framework.  It already provides a proven UI shell – top toolbar, tool rail, property panel, minimap and status bar【524232373199522†L19-L19】 – and implements a modern state/store/history architecture.  Extending this shell accelerates delivery and ensures consistency across tabs.  The CoorCanvas layer becomes a headless domain engine imported into Pro 2D Canvas rather than a competing UI.`,
  `Absorb the domain logic of **CoorCanvas** into a shared, testable service.  CoorCanvas handles route row logic, emit cutting, fitting placement and coordinate‑driven PCF preparation【524232373199522†L12-L18】.  These behaviours are essential to the drafting experience but should not remain bound to an outdated interface.  By extracting them into pure functions and services (see the canonical model below), Pro 2D Canvas can reuse them while benefitting from Smart 2D Canvas’s infrastructure.`,
  `Treat **DXF** and **SVG** strictly as import/export formats.  Neither of these standards is expressive enough to act as the canonical working model.  DXF is a 1980s interchange format with limited semantics for piping and often requires inference; SVG is a presentation format with freeform paths.  A professional editor needs a canonical model capable of capturing topology, engineering metadata and dynamic fields without the lossy constraints of either format.  DXF and SVG should therefore be supported via adapters at the boundary, converting to and from the canonical `Professional2DStateTable`.`,
];

/* --------------------------------------------------------------------------
 * Responsibility split
 *
 * A table describing which responsibilities stay in Smart 2D Canvas,
 * which domain services are extracted from CoorCanvas and which are
 * implemented anew in Pro 2D Canvas.  Represented as an array of
 * objects so it can be rendered as a table easily.  Each object
 * contains a high‑level capability along with notes on the source and
 * target responsibilities.
 */
const Pro2D_responsibilityMatrix = [
  {
    capability: "UI shell & interaction",
    smart2d: "Provides the editor frame: toolbars, panels, history stack, minimap, zoom/pan and selection mechanics.",
    coorCanvas: "None – CoorCanvas UI is to be deprecated.",
    pro2d: "Extends Smart 2D Canvas with new tool modes (draft vs topology), property panel sections and import/export controls."
  },
  {
    capability: "Coordinate drafting & route editing",
    smart2d: "Offers basic shape drawing and snapping without piping semantics.",
    coorCanvas: "Implements route row logic, split/join operations, fitting placement and emit cutting【524232373199522†L12-L18】.",
    pro2d: "Wraps the CoorCanvas services into draft‑mode tools and exposes them through the Smart 2D Canvas toolbar."
  },
  {
    capability: "Semantic/topology editing",
    smart2d: "Supports state management and undo/redo but lacks piping semantics.",
    coorCanvas: "Limited; mostly coordinate driven.",
    pro2d: "Introduces topology model editing (route chains, fitting relationships, branch management) using the canonical state."
  },
  {
    capability: "Geometry rendering & viewport",
    smart2d: "Renders 2D primitives, handles zoom/pan, minimap and snapping.",
    coorCanvas: "Custom canvas rendering for pipes and emits; cannot be reused directly.",
    pro2d: "Adapts Smart 2D Canvas’s viewport to support Pro2D entities (pipes, bends, tees etc.) via the geometry binding layer."
  },
  {
    capability: "PCF/Emit logic",
    smart2d: "None.",
    coorCanvas: "Full PCF preparation pipeline: route rows, emit intersection and fitting insertion.",
    pro2d: "Repackages CoorCanvas logic into stateless services consumed by the canonical model (e.g. buildBaseElements, computeEmitHits)."
  },
  {
    capability: "Import/export adapters",
    smart2d: "Provides JSON import/export for internal state but no DXF/SVG support.",
    coorCanvas: "Limited PCF preparation; no DXF/SVG.",
    pro2d: "Implements DXF and SVG adapters converting between boundary formats and the canonical `Professional2DStateTable`."
  },
  {
    capability: "Property panel & dynamic headers",
    smart2d: "Static property panel bound to known entities.",
    coorCanvas: "No professional property panel; uses simple forms.",
    pro2d: "Dynamic header model supporting fixed core fields and imported metadata, configurable per entity type."
  }
];

/* --------------------------------------------------------------------------
 * Canonical intermediate model: Professional2DStateTable
 *
 * The heart of the new editor is a canonical intermediate model capable of
 * representing both coordinate‑driven drafting and semantic/topological
 * editing.  The `Professional2DStateTable` is defined below as a plain
 * object.  It contains an `entities` map keyed by entity IDs with
 * associated metadata, geometry, topology and provenance.  A separate
 * `layers` map describes display grouping and styling.  A `routes`
 * collection organises pipes and fittings into logical chains.  Finally,
 * a `headerModel` describes dynamic property panel fields (see below).
 */
const Pro2D_Professional2DStateTable = {
  // Entities are stored in an object keyed by a stable unique ID.  Each
  // entry has a `type` discriminator and a set of structured fields.
  entities: {
    // Example entry illustrating the shape of a pipe.  Actual data
    // instances will be created by importers and the editor itself.
    // The keys must remain stable across imports/exports.
    /*
    "id-001": {
      type: "PIPE",                // Required: entity type
      points: {
        start: { x: 0, y: 0, z: 0 },
        end:   { x: 10, y: 0, z: 0 }
      },
      size: 100,                    // Bore size (DN)
      skey: "BEBW",                // Specification key (from CoorCanvas logic)
      topology: {
        routeId: "route-001",      // Route this pipe belongs to
        prev: null,                 // ID of previous entity in the route
        next: "id-002",            // ID of next entity in the route
      },
      metadata: {},                 // Arbitrary imported metadata (DXF, SVG attributes)
      attributes: {},               // Engineering attributes (pressure, material etc.)
      display: {
        layer: "Process",          // Named layer for grouping
        color: "#000000",         // Stroke colour for rendering
        lineType: "CONTINUOUS"     // DXF/SVG line style mapping
      },
      provenance: {
        source: "import:dxf",      // Source of this entity (e.g. import or user)
        file: "pump-room.dxf",     // File name or ID
        ts: 0                       // Import timestamp
      },
      custom: {}                    // Dynamic/custom fields not defined ahead of time
    }
    */
  },
  // Layers represent visual grouping (e.g. process, utilities, annotation).  Each
  // layer may carry display attributes that the viewport consumes.
  layers: {
    /*
    "Process": { color: "#3366CC", lineWidth: 1.0 },
    "Utilities": { color: "#99CC00", lineWidth: 0.8 },
    "Annotation": { color: "#666666", lineWidth: 0.5 }
    */
  },
  // Routes group connected pipes and fittings.  They maintain ordered lists
  // of entity IDs and support branch/merge relationships.  Use this to
  // traverse a piping system semantically.
  routes: {
    /*
    "route-001": {
      id: "route-001",
      chain: [ "id-001", "id-002", "id-003" ],
      branches: [ { at: "id-002", to: "route-002" } ]
    }
    */
  },
  // Header model describes fields shown in the property panel.  It defines
  // fixed headers (always present) and dynamic headers imported from DXF,
  // SVG or user‑defined sources.  Each header has a label, an internal
  // key and a type for validation.  The editor can organise headers by
  // entity type and hide unknown fields if necessary.
  headerModel: {
    fixed: [
      { key: "type",        label: "Type",        type: "enum",    description: "Entity type discriminator" },
      { key: "id",          label: "ID",          type: "string",  description: "Stable unique identifier" },
      { key: "size",        label: "Size DN",     type: "number",  description: "Nominal bore size" },
      { key: "skey",        label: "Spec Key",    type: "string",  description: "Specification key used in PCF" },
      { key: "layer",       label: "Layer",       type: "string",  description: "Visual layer grouping" }
    ],
    dynamic: [
      // Dynamic headers are added at runtime when an import adapter
      // encounters metadata fields or when users extend the schema.
      // Each entry should include a `source` field noting where the
      // definition came from (e.g. dxf, svg, user).
      /*
      { key: "dxf:LINETYPE", label: "DXF Line Type", type: "string", source: "dxf" },
      { key: "svg:data-pressure", label: "Pressure", type: "number", source: "svg" }
      */
    ]
  }
};

/* --------------------------------------------------------------------------
 * Geometry binding strategy
 *
 * This object formalises how entities in the canonical state bind to
 * geometry rendered in the viewport.  Stable IDs are used as the glue
 * between model and view.  For each entity type we specify which
 * geometry points define its shape, how selection is detected and how
 * edits propagate between the view and the model.
 */
const Pro2D_geometryBinding = {
  PIPE: {
    anchorPoints: [ "points.start", "points.end" ],
    hitTest: (pt, entity, tolerance) => {
      // Compute the distance from a point to the pipe segment in 2D
      const { x: x1, y: y1 } = entity.points.start;
      const { x: x2, y: y2 } = entity.points.end;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq < 1e-12) return false;
      // Project onto segment and compute perpendicular distance
      const t = ((pt.x - x1) * dx + (pt.y - y1) * dy) / lengthSq;
      if (t < 0 || t > 1) return false;
      const ix = x1 + t * dx;
      const iy = y1 + t * dy;
      const distSq = (pt.x - ix) * (pt.x - ix) + (pt.y - iy) * (pt.y - iy);
      return distSq <= (tolerance * tolerance);
    },
    updatePoints: (entity, newPoints) => {
      // Mutate the entity’s points with new values
      entity.points.start = { ...entity.points.start, ...newPoints.start };
      entity.points.end   = { ...entity.points.end,   ...newPoints.end   };
      return entity;
    }
  },
  BEND: {
    anchorPoints: [ "points.ep1", "points.ep2", "points.cp" ],
    hitTest: (pt, entity, tolerance) => {
      // For bends we approximate hit testing by checking proximity to the
      // control point.  A production implementation should check the arc.
      const { x, y } = entity.points.cp;
      const dx = pt.x - x;
      const dy = pt.y - y;
      return (dx * dx + dy * dy) <= (tolerance * tolerance);
    },
    updatePoints: (entity, newPoints) => {
      entity.points.ep1 = { ...entity.points.ep1, ...newPoints.ep1 };
      entity.points.ep2 = { ...entity.points.ep2, ...newPoints.ep2 };
      entity.points.cp  = { ...entity.points.cp,  ...newPoints.cp  };
      return entity;
    }
  },
  TEE: {
    anchorPoints: [ "points.mainStart", "points.mainEnd", "points.branch" ],
    hitTest: (pt, entity, tolerance) => {
      // Check against all three branch points
      const pts = [ entity.points.mainStart, entity.points.mainEnd, entity.points.branch ];
      return pts.some(({ x, y }) => {
        const dx = pt.x - x;
        const dy = pt.y - y;
        return (dx * dx + dy * dy) <= (tolerance * tolerance);
      });
    },
    updatePoints: (entity, newPoints) => {
      entity.points.mainStart = { ...entity.points.mainStart, ...newPoints.mainStart };
      entity.points.mainEnd   = { ...entity.points.mainEnd,   ...newPoints.mainEnd   };
      entity.points.branch    = { ...entity.points.branch,    ...newPoints.branch    };
      return entity;
    }
  },
  REDUCER: {
    anchorPoints: [ "points.in", "points.out" ],
    hitTest: (pt, entity, tolerance) => {
      const pts = [ entity.points.in, entity.points.out ];
      return pts.some(({ x, y }) => {
        const dx = pt.x - x;
        const dy = pt.y - y;
        return (dx * dx + dy * dy) <= (tolerance * tolerance);
      });
    },
    updatePoints: (entity, newPoints) => {
      entity.points.in  = { ...entity.points.in,  ...newPoints.in  };
      entity.points.out = { ...entity.points.out, ...newPoints.out };
      return entity;
    }
  },
  FLANGE: {
    anchorPoints: [ "points.center" ],
    hitTest: (pt, entity, tolerance) => {
      const { x, y } = entity.points.center;
      const dx = pt.x - x;
      const dy = pt.y - y;
      return (dx * dx + dy * dy) <= (tolerance * tolerance);
    },
    updatePoints: (entity, newPoints) => {
      entity.points.center = { ...entity.points.center, ...newPoints.center };
      return entity;
    }
  },
  VALVE: {
    anchorPoints: [ "points.ep1", "points.ep2" ],
    hitTest: (pt, entity, tolerance) => {
      const pts = [ entity.points.ep1, entity.points.ep2 ];
      return pts.some(({ x, y }) => {
        const dx = pt.x - x;
        const dy = pt.y - y;
        return (dx * dx + dy * dy) <= (tolerance * tolerance);
      });
    },
    updatePoints: (entity, newPoints) => {
      entity.points.ep1 = { ...entity.points.ep1, ...newPoints.ep1 };
      entity.points.ep2 = { ...entity.points.ep2, ...newPoints.ep2 };
      return entity;
    }
  },
  SUPPORT: {
    anchorPoints: [ "points.location" ],
    hitTest: (pt, entity, tolerance) => {
      const { x, y } = entity.points.location;
      const dx = pt.x - x;
      const dy = pt.y - y;
      return (dx * dx + dy * dy) <= (tolerance * tolerance);
    },
    updatePoints: (entity, newPoints) => {
      entity.points.location = { ...entity.points.location, ...newPoints.location };
      return entity;
    }
  },
  EMIT: {
    anchorPoints: [ "points.start", "points.end" ],
    hitTest: (pt, entity, tolerance) => {
      // Emits are treated as directional arrows.  Hit test endpoints.
      const pts = [ entity.points.start, entity.points.end ];
      return pts.some(({ x, y }) => {
        const dx = pt.x - x;
        const dy = pt.y - y;
        return (dx * dx + dy * dy) <= (tolerance * tolerance);
      });
    },
    updatePoints: (entity, newPoints) => {
      entity.points.start = { ...entity.points.start, ...newPoints.start };
      entity.points.end   = { ...entity.points.end,   ...newPoints.end   };
      return entity;
    }
  },
  UNKNOWN: {
    anchorPoints: [],
    hitTest: () => false,
    updatePoints: (entity) => entity
  }
};

/* --------------------------------------------------------------------------
 * Dual‑view strategy
 *
 * The editor must support both coordinate/drafting workflows and
 * semantic/topological workflows.  This object formalises the two
 * modes and the concept of switching between them while sharing the
 * underlying canonical state.  Consumers of this module can inspect
 * this object to understand how the views should behave.
 */
const Pro2D_dualViewStrategy = {
  modes: {
    draft: {
      name: "Draft View",
      description: "Focuses on coordinate editing with grid/snap, pipe routing and emit cutting.  Suitable for early drafting where geometry is more important than semantic structure.",
      tools: [
        "select", "marqueeSelect", "measure", "drawPipe", "drawBend", "drawTee", "convertBend", "convertTee", "break", "connectEndpoints", "stretchEndpoint", "insertSupport", "insertValve", "insertFlange", "insertReducer", "gapClean", "overlapSolver"
      ]
    },
    topology: {
      name: "Topology View",
      description: "Highlights semantic relationships such as route chains, branches and fitting connectivity.  Allows editing of route order, branch points and metadata without altering geometry.",
      tools: [ "select", "editRouteOrder", "editBranch", "reassignFitting", "metadataEditor" ]
    }
  },
  switching: {
    // Flag indicating whether switching is permitted on the fly.  For a
    // professional experience the editor should allow switching as long
    // as there are no unsaved geometry edits in flight.
    allowOnTheFly: true,
    // How to sync from draft to topology: update route chains and
    // recompute topology based on geometry edits.  The function
    // reference here is illustrative – actual implementation will
    // reside in the Pro 2D Canvas controller.
    draftToTopology: (state) => {
      // In a real implementation this would walk through all routes,
      // rebuild chain ordering based on connections and update the
      // topology section of each entity.  Here we no‑op and return
      // state as is for documentation purposes.
      return state;
    },
    // How to sync from topology to draft: ensure geometry remains
    // consistent after semantic edits (e.g. reordering a route does not
    // break connected pipes).  Again, this is an illustrative stub.
    topologyToDraft: (state) => {
      return state;
    }
  }
};

/* --------------------------------------------------------------------------
 * DXF import/export mapping
 *
 * This mapping object defines how common DXF entities map to the
 * canonical model and vice versa.  For each supported DXF type we
 * provide a converter and a serializer.  Unsupported or lossy
 * conversions are noted by setting `lossy` to true and supplying a
 * fallback behaviour.  Consumers can iterate this mapping to build
 * their own import/export pipelines.
 */
const Pro2D_DXFMapping = {
  LINE: {
    target: "PIPE",
    import: (dxfEntity) => {
      // Convert a DXF LINE into a simple pipe.  Additional metadata
      // (layer, linetype) should be captured in the metadata field.
      return {
        type: "PIPE",
        points: {
          start: { x: dxfEntity.x1, y: dxfEntity.y1, z: dxfEntity.z1 || 0 },
          end:   { x: dxfEntity.x2, y: dxfEntity.y2, z: dxfEntity.z2 || 0 }
        },
        size: null,
        skey: null,
        topology: {},
        metadata: {
          layer: dxfEntity.layer,
          lineType: dxfEntity.linetype,
          raw: dxfEntity
        },
        attributes: {},
        display: {},
        provenance: { source: "import:dxf" },
        custom: {}
      };
    },
    export: (entity) => {
      // Convert a canonical pipe back into a DXF LINE.  Bore and skey are
      // ignored since DXF cannot represent them natively.
      return {
        type: "LINE",
        x1: entity.points.start.x,
        y1: entity.points.start.y,
        z1: entity.points.start.z || 0,
        x2: entity.points.end.x,
        y2: entity.points.end.y,
        z2: entity.points.end.z || 0,
        layer: entity.display?.layer || entity.metadata?.layer,
        linetype: entity.display?.lineType || entity.metadata?.lineType
      };
    },
    lossy: false
  },
  LWPOLYLINE: {
    target: "PIPE", // Treated as consecutive pipes
    import: (poly) => {
      // Decompose a polyline into multiple pipe entities.  A higher
      // level importer will need to split the segments and allocate IDs.
      // Here we return an array of pipe definitions for convenience.
      const pipes = [];
      for (let i = 0; i < poly.vertices.length - 1; i++) {
        const v1 = poly.vertices[i];
        const v2 = poly.vertices[i + 1];
        pipes.push({
          type: "PIPE",
          points: {
            start: { x: v1.x, y: v1.y, z: v1.z || 0 },
            end:   { x: v2.x, y: v2.y, z: v2.z || 0 }
          },
          size: null,
          skey: null,
          topology: {},
          metadata: { layer: poly.layer, raw: poly },
          attributes: {},
          display: {},
          provenance: { source: "import:dxf" },
          custom: {}
        });
      }
      return pipes;
    },
    export: (entity) => {
      // Not implemented: exporting a canonical pipe as part of a polyline.
      // Use the LINE exporter instead.  Mark as lossy to signal this.
      return null;
    },
    lossy: true
  },
  ARC: {
    target: "BEND",
    import: (arc) => {
      // Convert a DXF arc into a bend.  An arc is defined by a center
      // point, radius and start/end angles.  We'll calculate endpoints.
      const startRad = (arc.startAngle * Math.PI) / 180;
      const endRad   = (arc.endAngle   * Math.PI) / 180;
      const x1 = arc.cx + arc.radius * Math.cos(startRad);
      const y1 = arc.cy + arc.radius * Math.sin(startRad);
      const x2 = arc.cx + arc.radius * Math.cos(endRad);
      const y2 = arc.cy + arc.radius * Math.sin(endRad);
      return {
        type: "BEND",
        points: {
          ep1: { x: x1, y: y1, z: arc.cz || 0 },
          ep2: { x: x2, y: y2, z: arc.cz || 0 },
          cp:  { x: arc.cx, y: arc.cy, z: arc.cz || 0 }
        },
        size: null,
        skey: null,
        topology: {},
        metadata: { layer: arc.layer, raw: arc },
        attributes: {},
        display: {},
        provenance: { source: "import:dxf" },
        custom: {}
      };
    },
    export: (entity) => {
      // Export a canonical bend as an arc.  We assume a 90° bend and
      // reconstruct the centre and radius.  This is an approximation –
      // if the canonical bend holds a radius field use that instead.
      const ep1 = entity.points.ep1;
      const ep2 = entity.points.ep2;
      const cp  = entity.points.cp;
      const dx1 = ep1.x - cp.x;
      const dy1 = ep1.y - cp.y;
      const dx2 = ep2.x - cp.x;
      const dy2 = ep2.y - cp.y;
      const r   = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const startAngle = (Math.atan2(dy1, dx1) * 180) / Math.PI;
      const endAngle   = (Math.atan2(dy2, dx2) * 180) / Math.PI;
      return {
        type: "ARC",
        cx: cp.x,
        cy: cp.y,
        cz: cp.z || 0,
        radius: r,
        startAngle,
        endAngle,
        layer: entity.display?.layer || entity.metadata?.layer
      };
    },
    lossy: false
  },
  CIRCLE: {
    target: "UNKNOWN",
    import: (circle) => {
      // Circles are not semantically mapped – treat them as unknown with
      // metadata capturing their geometry.  They may represent
      // annotations or connectors in the source drawing.
      return {
        type: "UNKNOWN",
        points: { center: { x: circle.cx, y: circle.cy, z: circle.cz || 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { radius: circle.radius, layer: circle.layer, raw: circle },
        attributes: {},
        display: {},
        provenance: { source: "import:dxf" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  },
  INSERT: {
    target: "UNKNOWN",
    import: (insert) => {
      // Blocks/Inserts may represent valves, supports or other
      // prefabricated items.  Without a master mapping we cannot
      // reliably infer the entity type, so classify as UNKNOWN and
      // attach the block name.  Downstream logic can inspect the block
      // name and decide how to proceed.
      return {
        type: "UNKNOWN",
        points: { reference: { x: insert.x, y: insert.y, z: insert.z || 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { blockName: insert.name, layer: insert.layer, raw: insert },
        attributes: {},
        display: {},
        provenance: { source: "import:dxf" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  },
  TEXT: {
    target: "UNKNOWN",
    import: (text) => {
      return {
        type: "UNKNOWN",
        points: { position: { x: text.x, y: text.y, z: text.z || 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { content: text.text, layer: text.layer, raw: text },
        attributes: {},
        display: {},
        provenance: { source: "import:dxf" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  }
};

/* --------------------------------------------------------------------------
 * SVG import/export mapping
 *
 * Similar to the DXF mapping, this object defines how common SVG
 * elements translate to the canonical model.  SVG is primarily a
 * presentation format; therefore many conversions are considered
 * lossy.  Consumers can use the provided importers to create
 * canonical entities and attach any remaining SVG attributes in the
 * metadata field.  Exporters produce basic SVG elements and drop
 * canonical data that has no counterpart in SVG.
 */
const Pro2D_SVGMapping = {
  line: {
    target: "PIPE",
    import: (el) => {
      return {
        type: "PIPE",
        points: {
          start: { x: parseFloat(el.x1), y: parseFloat(el.y1), z: 0 },
          end:   { x: parseFloat(el.x2), y: parseFloat(el.y2), z: 0 }
        },
        size: null,
        skey: null,
        topology: {},
        metadata: { raw: el },
        attributes: {},
        display: {},
        provenance: { source: "import:svg" },
        custom: {}
      };
    },
    export: (entity) => {
      return `<line x1="${entity.points.start.x}" y1="${entity.points.start.y}" x2="${entity.points.end.x}" y2="${entity.points.end.y}" stroke="${entity.display?.color || '#000'}" />`;
    },
    lossy: false
  },
  polyline: {
    target: "PIPE",
    import: (el) => {
      // SVG polyline is a sequence of coordinate pairs
      const points = el.points.trim().split(/\s+/).map(p => {
        const [x, y] = p.split(',').map(parseFloat);
        return { x, y, z: 0 };
      });
      const pipes = [];
      for (let i = 0; i < points.length - 1; i++) {
        pipes.push({
          type: "PIPE",
          points: { start: points[i], end: points[i + 1] },
          size: null,
          skey: null,
          topology: {},
          metadata: { raw: el },
          attributes: {},
          display: {},
          provenance: { source: "import:svg" },
          custom: {}
        });
      }
      return pipes;
    },
    export: () => null,
    lossy: true
  },
  path: {
    target: "UNKNOWN",
    import: (el) => {
      // Paths are arbitrary and may contain curves.  Without
      // decomposing the path data we cannot infer semantics; treat as
      // unknown with metadata preserving the d attribute.
      return {
        type: "UNKNOWN",
        points: {},
        size: null,
        skey: null,
        topology: {},
        metadata: { d: el.d, raw: el },
        attributes: {},
        display: {},
        provenance: { source: "import:svg" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  },
  circle: {
    target: "UNKNOWN",
    import: (el) => {
      return {
        type: "UNKNOWN",
        points: { center: { x: parseFloat(el.cx), y: parseFloat(el.cy), z: 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { r: parseFloat(el.r), raw: el },
        attributes: {},
        display: {},
        provenance: { source: "import:svg" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  },
  rect: {
    target: "UNKNOWN",
    import: (el) => {
      return {
        type: "UNKNOWN",
        points: { topLeft: { x: parseFloat(el.x), y: parseFloat(el.y), z: 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { width: parseFloat(el.width), height: parseFloat(el.height), raw: el },
        attributes: {},
        display: {},
        provenance: { source: "import:svg" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  },
  text: {
    target: "UNKNOWN",
    import: (el) => {
      return {
        type: "UNKNOWN",
        points: { position: { x: parseFloat(el.x), y: parseFloat(el.y), z: 0 } },
        size: null,
        skey: null,
        topology: {},
        metadata: { content: el.text, raw: el },
        attributes: {},
        display: {},
        provenance: { source: "import:svg" },
        custom: {}
      };
    },
    export: () => null,
    lossy: true
  }
};

/* --------------------------------------------------------------------------
 * Validation and invariants
 *
 * A list of validation rules which enforce consistency in the
 * canonical model.  Each rule is represented by a name and a
 * predicate function that accepts the entire state table and returns
 * either true (valid) or a string describing the error.  Downstream
 * code can iterate through this list to validate an imported or
 * edited model.  Only simple examples are provided – complex logic
 * would live elsewhere.  If you need additional checks, extend this
 * array with more rules.
 */
const Pro2D_validationRules = [
  {
    name: "uniqueIds",
    validate: (state) => {
      const ids = Object.keys(state.entities);
      const unique = new Set(ids);
      return ids.length === unique.size || `Duplicate entity IDs detected`;
    }
  },
  {
    name: "connectedRoutes",
    validate: (state) => {
      // Ensure each route chain is a contiguous chain in terms of topology
      for (const routeId in state.routes) {
        const route = state.routes[routeId];
        for (let i = 0; i < route.chain.length - 1; i++) {
          const curr = state.entities[route.chain[i]];
          const next = state.entities[route.chain[i + 1]];
          if (!curr || !next) return `Route ${routeId} references missing entity`;
          if (curr.topology.next !== route.chain[i + 1]) {
            return `Route ${routeId} is not contiguous at index ${i}`;
          }
        }
      }
      return true;
    }
  },
  {
    name: "endpointConsistency",
    validate: (state) => {
      // Pipes and similar entities must have both start and end points
      for (const id in state.entities) {
        const e = state.entities[id];
        if (e.type === "PIPE") {
          if (!e.points || !e.points.start || !e.points.end) {
            return `Pipe ${id} is missing start or end point`;
          }
        }
        if (e.type === "BEND") {
          if (!e.points || !e.points.ep1 || !e.points.ep2 || !e.points.cp) {
            return `Bend ${id} is missing control or endpoint`;
          }
        }
      }
      return true;
    }
  },
  {
    name: "layerConsistency",
    validate: (state) => {
      // Check that each entity references a defined layer if a layer is set
      for (const id in state.entities) {
        const e = state.entities[id];
        const layer = e.display?.layer || e.metadata?.layer;
        if (layer && !state.layers[layer]) {
          return `Entity ${id} references undefined layer ${layer}`;
        }
      }
      return true;
    }
  }
];

/* --------------------------------------------------------------------------
 * Migration plan from legacy tabs
 *
 * An object describing how the existing Smart 2D Canvas and CoorCanvas
 * code will be migrated into the new Pro 2D Canvas.  Each key lists
 * components to reuse and components to leave behind, along with
 * adapters or phases as necessary.  This plan is intentionally high
 * level – the details of function extraction and refactoring live in
 * the codebase and repository management practices.
 */
const Pro2D_migrationPlan = {
  reuseFromSmart2DCanvas: [
    "SceneStore and history management",
    "Viewport rendering and minimap",
    "Toolbar and tool rail UI components",
    "Property panel infrastructure"
  ],
  reuseFromCoorCanvas: [
    "Geometry utilities (e.g. dist, splitPipe, buildBaseElements)",
    "Emit intersection and cutting logic",
    "Route row calculation and fitting placement",
    "PCF preparation algorithms"
  ],
  leftBehind: [
    "CoorCanvas DOM/UI code",
    "Ad‑hoc state management approaches (e.g. global variables)",
    "Non‑modular code patterns that hinder testability"
  ],
  adapters: [
    "DXF importer and exporter (see Pro2D_DXFMapping)",
    "SVG importer and exporter (see Pro2D_SVGMapping)",
    "Legacy PCF converter to canonical state",
    "Legacy CoorCanvas emit output to canonical emit representation"
  ],
  integrationOrder: [
    "Extract CoorCanvas services into pure functions",            // Phase 1
    "Integrate services into Smart 2D Canvas shell with new tab", // Phase 1
    "Implement canonical state and property panel",              // Phase 1
    "Introduce DXF/SVG adapters and test import/export",         // Phase 2
    "Implement semantic/topology editing tools",                 // Phase 2
    "Deprecate legacy tabs after feature parity is achieved"     // Phase 3
  ]
};

/* --------------------------------------------------------------------------
 * Phase‑wise rollout plan
 *
 * A structured plan dividing the work into manageable phases.  Each
 * phase includes its goals, deliverables, dependencies and risks.  This
 * information can be used by project managers to track progress and
 * plan resource allocation.  Keep this in sync with the migration plan
 * above.
 */
const Pro2D_phasePlan = {
  phases: [
    {
      id: 1,
      name: "Phase 1: Shell & Canonical Foundation",
      goals: [
        "Establish the Pro 2D Canvas tab using the Smart 2D Canvas shell",
        "Define and implement `Professional2DStateTable` with core fields",
        "Extract CoorCanvas geometry and PCF services into standalone modules",
        "Implement property panel with fixed headers and dynamic header registration"
      ],
      deliverables: [
        "Functional Pro 2D Canvas tab with draft mode", 
        "Canonical state persisted in SceneStore", 
        "Basic import/export of PCF via legacy functions"
      ],
      dependencies: [],
      risks: [
        "Underestimating the effort to extract clean services from legacy code",
        "Schema creep during initial implementation"
      ],
      exclusions: [
        "No DXF/SVG support yet",
        "No topology view or semantic editing"
      ]
    },
    {
      id: 2,
      name: "Phase 2: Adapter & Semantic Tools",
      goals: [
        "Implement DXF and SVG adapters using mapping definitions",
        "Create semantic editing tools: route order editing, branch editing",
        "Enhance property panel to support dynamic headers from imports",
        "Support undo/redo across semantic operations"
      ],
      deliverables: [
        "DXF/SVG import/export with round‑trip fidelity warnings",
        "Topology view enabled with semantic tools",
        "Enhanced header model reflecting imported metadata"
      ],
      dependencies: [1],
      risks: [
        "Lossy conversions requiring user intervention",
        "UI complexity as new tools are added"
      ],
      exclusions: [
        "No direct integration with CoorCanvas UI",
        "No 3D visualisation or isometric output in this phase"
      ]
    },
    {
      id: 3,
      name: "Phase 3: Professional Tools & Decommissioning",
      goals: [
        "Implement full set of professional tools including supports, valves and flanges",
        "Introduce repair tools like gap clean and overlap solver",
        "Ensure performance on large scenes and optimise data structures",
        "Plan decommissioning of legacy tabs after parity"
      ],
      deliverables: [
        "Complete toolset available in Pro 2D Canvas",
        "Benchmarked performance on representative projects",
        "Migration guides and user documentation"
      ],
      dependencies: [1, 2],
      risks: [
        "Unexpected edge cases from legacy data",
        "User resistance to change despite feature parity"
      ],
      exclusions: [
        "Major UI redesign beyond the 2D scope",
        "Integration with unrelated product areas"
      ]
    }
  ]
};

/* --------------------------------------------------------------------------
 * Risks and limitations
 *
 * A list of known risks, technical debt items and fidelity limitations
 * associated with the new editor.  Each entry includes a brief
 * description and, where possible, a suggested mitigation.  This list
 * should be revisited regularly as the project evolves.
 */
const Pro2D_risksLimitations = [
  {
    risk: "SVG round‑trip fidelity",
    description: "SVG is primarily a presentation format.  When exporting the canonical model to SVG many semantic fields (e.g. bore, skey, topology) cannot be represented, and when importing freeform paths the canonical model may have to guess the intended semantics.",
    mitigation: "Clearly label lossy conversions in the UI and allow users to supply metadata manually during import.  Prefer DXF for exchange with CAD systems."
  },
  {
    risk: "DXF semantic lossiness",
    description: "DXF entities lack semantics beyond simple geometry.  Block inserts and polylines may represent valves, tees or reducers but require inference or user mapping to interpret correctly.",
    mitigation: "Provide a flexible block mapping table and prompt the user when ambiguity is detected.  Store raw DXF attributes in metadata for manual reconciliation."
  },
  {
    risk: "Block/insert complexity",
    description: "Blocks in DXF can be nested and parameterised.  Resolving these to canonical entities can be expensive and may require a full DXF interpreter.",
    mitigation: "Implement incremental support: start with simple blocks and extend support based on real world samples.  Provide a fallback to import blocks as UNKNOWN entities with preserved metadata."
  },
  {
    risk: "Metadata ambiguity",
    description: "Imported DXF or SVG metadata fields may conflict with each other or with existing canonical fields (e.g. `layer` vs `PIPING-CLASS`).",
    mitigation: "Use namespaces for dynamic headers (e.g. `dxf:`, `svg:`) and allow users to map or hide fields in the property panel."
  },
  {
    risk: "Performance on large scenes",
    description: "Rendering and managing thousands of entities can stress the SceneStore and viewport.  Without careful indexing and batching the editor may become sluggish.",
    mitigation: "Use spatial indexing for hit testing, incremental rendering techniques (e.g. canvas layers) and memory efficient data structures.  Benchmark regularly on representative projects."
  },
  {
    risk: "Underlay/image alignment",
    description: "Future requirements may include image based drafting and alignment.  Handling arbitrary image resolutions and coordinate systems adds complexity to the canonical model and viewport.",
    mitigation: "Defer underlay support until the core editor is stable.  When implemented, store underlay metadata separately and transform geometry via calibration matrices."  }
];

/* --------------------------------------------------------------------------
 * Smoke test / quantitative benchmark
 *
 * A simple function that inspects the canonical schema and returns
 * statistics.  This can be used by unit tests to ensure that the
 * definitions remain complete and by developers to gauge the scope of
 * the model.  The benchmark counts the number of entity types,
 * fixed headers and dynamic headers defined at the time of invocation.
 */
function Pro2D_benchmark() {
  const entityExampleCount = Object.keys(Pro2D_Professional2DStateTable.entities).length;
  const layerCount = Object.keys(Pro2D_Professional2DStateTable.layers).length;
  const routeCount = Object.keys(Pro2D_Professional2DStateTable.routes).length;
  const fixedHeaderCount = Pro2D_Professional2DStateTable.headerModel.fixed.length;
  const dynamicHeaderCount = Pro2D_Professional2DStateTable.headerModel.dynamic.length;
  return {
    entityExampleCount,
    layerCount,
    routeCount,
    fixedHeaderCount,
    dynamicHeaderCount,
    totalValidationRules: Pro2D_validationRules.length,
    totalRisks: Pro2D_risksLimitations.length,
    totalPhases: Pro2D_phasePlan.phases.length
  };
}

/* --------------------------------------------------------------------------
 * Exports
 *
 * Export everything with the `Pro2D_` prefix so that consumers can
 * reliably locate the deliverables.  Note: Node.js will wrap
 * top‑level functions in the CommonJS module environment.  Use
 * destructuring when importing.
 */
module.exports = {
  Pro2D_executiveRecommendation,
  Pro2D_responsibilityMatrix,
  Pro2D_Professional2DStateTable,
  Pro2D_geometryBinding,
  Pro2D_dualViewStrategy,
  Pro2D_DXFMapping,
  Pro2D_SVGMapping,
  Pro2D_validationRules,
  Pro2D_migrationPlan,
  Pro2D_phasePlan,
  Pro2D_risksLimitations,
  Pro2D_benchmark
};