# Cyber-Ontology Rules

## 1. Purpose

This document defines the design principles, modeling conventions, and usage rules of the ontology.

The ontology is designed to be:
- simple
- human-readable
- easily exploitable in JSON-based systems (API, UI, data processing)
- loosely inspired by OWL, without its complexity

---

## 2. General Philosophy

- The model prioritizes **usability over strict formalism**
- Constraints are intentionally minimized to allow **flexibility and data ingestion**
- The ontology is designed to support **real-world use cases**, not theoretical completeness
- Complexity from OWL is deliberately reduced

---

## 3. Core Structure

The ontology is composed of:

- **Classes** (`#class-*`)
- **Properties** (datatype attributes)
- **Relations** (links between objects)

Each class may define:
- `properties`
- `relations`

---

## 4. Typing Rules

Each attribute must declare a type.

### 4.1 Datatype properties

- Use:
  "type": "datatype"

- Represent literal values (string, number, etc.)
- Must define a `range`

Example:
{
  "id": "#severity",
  "type": "datatype",
  "range": "xsd:string"
}

---

### 4.2 Object relations

- Use:
  "type": "object"

- Represent links to another object
- Must define a `target`

Example:
{
  "id": "#targets",
  "type": "object",
  "target": "#class-business-asset"
}

---

## 5. Range and Target Rules

- `range` is used ONLY for datatype properties
- `target` is used ONLY for object relations

Rules:
- A `datatype` MUST have a `range`
- An `object` MUST have a `target`
- A `target` MUST reference an existing class

---

## 6. Naming Conventions

### 6.1 Classes

- Format: `#class-*`
- Examples:
  - `#class-risk`
  - `#class-business-asset`

---

### 6.2 Properties and relations

- Format: `#kebab-case`
- Examples:
  - `#severity`
  - `#likelihood`
  - `#targets`

---

### 6.3 General rules

- Use lowercase
- Use hyphen-separated words (kebab-case)
- Names should be short but meaningful

---

## 7. Labels

Each element must define:

"label": {
  "fr": "...",
  "en": "..."
}

Rules:
- Labels must be human-readable
- Labels must be provided in both French and English

---

## 8. Definitions

Each class must define:

"isDefinedBy": {
  "fr": "...",
  "en": "..."
}

Rules:
- Must describe the concept clearly
- Must not duplicate the label

---

## 9. Naming Rules (Business Guidance)

Optional field:

"namingRule": {
  "fr": "...",
  "en": "..."
}

Rules:
- Provides human-readable guidance
- Not enforced programmatically
- Used instead of strict constraints (regex, required, etc.)

---

## 10. Versioning

Each element must define:

"versionInfo": "YYYY-MM-DD: description"

Rules:
- Must track creation or modification
- Must be explicit and readable

---

## 11. Relations Rules

- Relations must always define a `target`
- The target must be a declared class
- Relations with undefined targets must be:
  - either completed
  - or removed

---

## 12. Modeling Rules from Use Cases

Some attributes represent references to structured entities, not simple values.

These must be modeled as object relations.

Examples:
- `severity` → should target a severity-level class
- `likelihood` → should target a likelihood-level class
- `security-criterion` → should target a dedicated class

---

## 13. Flexibility Principles

The model intentionally avoids:

- cardinality constraints
- mandatory fields (`required`)
- strict validation rules

This allows:
- heterogeneous data ingestion
- progressive enrichment
- adaptability to evolving needs

---

## 14. Instances (Data Objects)

Rules for individual objects:

- Each object must define a `type` referencing a class
- Relations must reference valid object identifiers
- Datatypes should respect their intended type when possible

Example:
{
  "id": "#risk-001",
  "type": "#class-risk",
  "severity": "high"
}

---

## 15. Design Decisions

Key choices:

- OWL complexity is intentionally avoided
- JSON is the primary representation format
- Object/datatype distinction is simplified via `type`
- Human readability is prioritized over formal rigor

---

## 16. Evolution Guidelines

- The ontology evolves incrementally
- New classes must be justified by real use cases
- Avoid breaking changes when possible
- Regularly clean undefined or unused references

---

## 17. Future Extensions (Optional)

Possible improvements:

- JSON Schema generation
- API auto-generation
- Graph database integration (e.g. Neo4j)
- Alignment with external ontologies if needed

---

## 18. Summary

This ontology is:

- simple but structured
- flexible but consistent
- pragmatic and use-case driven

It is designed to be a **living model**, usable by both humans and machines.