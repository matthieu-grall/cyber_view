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

The ontology is a JSON file with a root `classes` array. Each entry is a class.

Each class may define:
- `properties` — datatype attributes (literal values)
- `relations` — links to other classes

---

## 4. Naming Conventions

### 4.1 Classes

- Format: `#class-*` (kebab-case)
- Examples: `#class-risk`, `#class-business-asset`

The `#class-` prefix is the sole type indicator. No separate `"type"` field is needed.

### 4.2 Properties

- Format: `#property-*` (kebab-case)
- Examples: `#property-severity`, `#property-short-label`

### 4.3 Relations

- Format: `#relation-*` (kebab-case)
- Examples: `#relation-impacts`, `#relation-relies-on`

### 4.4 General rules

- Use lowercase
- Use hyphen-separated words (kebab-case)
- Names should be short but meaningful

---

## 5. Class Structure

Each class must follow this template:

```json
{
  "uri": "#class-xxxx",
  "subClassOf": "#class-yyyy",
  "label": {
    "fr": "...",
    "en": "..."
  },
  "isDefinedBy": {
    "fr": "...",
    "en": "..."
  },
  "versionInfo": "YYYY-MM-DD: description",
  "usecases": ["Use case name"],
  "properties": [...],
  "relations": [...]
}
```

`subClassOf` is optional (omit for root classes).

---

## 6. Properties

Each property defines a datatype attribute (literal value).

```json
{
  "uri": "#property-xxxx",
  "label": {
    "fr": "...",
    "en": "..."
  },
  "type": "xsd:string",
  "naming-rules": "Optional human-readable guidance"
}
```

- `type` uses XSD vocabulary: `xsd:string`, `xsd:normalizedString`, `xsd:integer`, `xsd:boolean`, etc.
- `naming-rules` is optional — provides human-readable guidance, not enforced programmatically

---

## 7. Relations

Each relation defines a link to one or more other classes.

```json
{
  "uri": "#relation-xxxx",
  "label": {
    "fr": "...",
    "en": "..."
  },
  "range": "#class-yyyy"
}
```

- `range` references the target class URI
- `range` may be a single string or an array of strings when multiple target classes are valid
- `range` must reference a declared class

---

## 8. Labels

Every class, property, and relation must define:

```json
"label": {
  "fr": "...",
  "en": "..."
}
```

- Labels must be human-readable
- Labels must be provided in both French and English

---

## 9. Definitions

Every class must define:

```json
"isDefinedBy": {
  "fr": "...",
  "en": "..."
}
```

- Must describe the concept clearly
- Must not duplicate the label
- May cite a source, e.g.: `"(source: [ISO/IEC 27000]) Effect of uncertainty on objectives."`

---

## 10. Versioning

Each class must define:

```json
"versionInfo": "YYYY-MM-DD: description"
```

- Tracks creation or last significant modification
- Use a comma-separated string for multiple entries: `"2026-01-01: add, 2026-07-07: update"`
- Must be explicit and readable

---

## 11. Use Cases

Each class must declare which use cases it belongs to:

```json
"usecases": ["Risk management"]
```

- Plain string array — no wrapper object needed
- Allows filtering classes by scope
- A class may belong to multiple use cases: `["Risk management", "Compliance"]`

---

## 12. Instances (Data Objects)

Individual data objects (not part of the ontology file) must:

- Declare a `classRef` referencing a class URI
- Use property keys matching the `#property-*` URIs defined in that class
- Reference other objects via their identifiers for object relations

Example:
```json
{
  "id": "risk-001",
  "classRef": "#class-risk",
  "label": { "fr": "Risque R01", "en": "Risk R01" },
  "properties": {
    "#property-severity": "3. Important",
    "#property-likelihood": "2. Limited"
  }
}
```

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

## 14. Evolution Guidelines

- The ontology evolves incrementally
- New classes must be justified by real use cases
- Avoid breaking changes when possible
- Regularly clean undefined or unused references (e.g. relations pointing to undeclared classes)

---

## 15. Future Extensions (Optional)

Possible improvements:
- JSON Schema generation
- API auto-generation
- Graph database integration (e.g. Neo4j)
- Alignment with external ontologies if needed

---

## 16. Summary

This ontology is:
- simple but structured
- flexible but consistent
- pragmatic and use-case driven

It is designed to be a **living model**, usable by both humans and machines.