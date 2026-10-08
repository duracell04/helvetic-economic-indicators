# Atlas composition contracts (schema 2.0.0)

A series exists independently of topics and charts. `topics.json` assigns any number of series to any number of topics. `presets.json` declares reusable ordered panels; presentation colours live there rather than in statistical definitions. The catalogue, selector groups and series routes enumerate registry records.

## Panel configuration

```json
{
  "id": "levels",
  "title": "Long-run levels",
  "series_ids": ["real-gdp"],
  "axis": { "mode": "native", "base_year": null },
  "conventions_acknowledged": true
}
```

The surrounding configuration fixes `version`, `preset_id`, `start_year`, `end_year`, `panels`, `show_events`, `show_intervals`, `show_raw` and `annotation_ids`. Panels may carry their own `start_year` and `end_year`; both endpoints must be present together and ordered. A one-year range is supported. The surrounding range summarizes the panels. Former v2 layouts without panel ranges inherit their saved shared range when restored. Only line charts and linear axes are supported; unsupported fields are rejected. Empty panels are removed. An indicator may appear in multiple panels/presets but only once within a panel. IDs and all references are validated.

Sharing encodes this configuration as UTF-8 JSON/base64url in `#chart=`, never observations. Restoration tries a valid shared configuration, then valid local configuration, then an empty workspace; invalid inputs produce an explanation. Browser storage keys `hei-atlas-demo-v2` and `hei-atlas-production-v2` prevent mixing modes. Reset clears the workspace. Charts always use original units. Presets remain internal declarative configurations; there is no public preset dropdown.

The empty workspace shows an Add indicator card with no chart controls. A compact card stays below the charts after adding the first indicator. Choosing an indicator opens year selection, initially spanning every nonmissing annual observation for that chart, including labelled forecasts where available. Users can shorten that chart's range before adding it or edit its year button later; other panels retain their ranges. Combining panels uses the union of their displayed ranges, while separating a series retains its panel range.

## Statistical compatibility

- Available annual observations are selectable. Other frequencies and unavailable candidates are labelled and disabled; nothing is automatically aggregated.
- A common original axis requires matching unit code, dimension, scale, price basis and known measurement conventions. Percentage measures may share a percent axis; indicator labels and contextual information retain their distinct meanings.
- Unknown conventions or a mixture of nominal/real price bases require separate panels. No dual axes or frequency conversion are supplied.
- Different annual aggregation kinds require explicit acknowledgment; the dialog explains each convention. Configured presets record this acknowledgment and display the distinction.
- Differently measured level variables remain in separate synchronized panels. There is no display rebasing or scale selector. Former indexed saved/shared layouts are converted to original units and separated where their units cannot share an axis. Legacy `show_raw` flags are accepted for version 2 compatibility but always disabled; optional original-value chart labels have been removed.

## Rendering and inspection

One responsive SVG renderer consumes panel configuration and observation metadata. Annual points remain unavailable when a row is absent or explicitly null. Paths break at missing years and registered statistical discontinuities. Reconstructed paths are dotted, forecasts dashed, provisional observations hollow and revised observations square. Definition breaks have triangular markers and contextual explanations.

Hover selects the same calendar year across panels whose displayed ranges include it. Clicking/tapping pins it; arrows step years within the focused chart, Home/End reach that chart's endpoints, and Escape releases. Readouts include original values, observation kind, revision status and annual convention. Touch interaction permits normal vertical page scrolling; a pinned anchored readout can scroll independently.

There is no separate inspection slider or axes-fit note. Update messages appear in a compact bottom-right live-status toast, fade after two seconds, and occupy no space in the chart layout. A new message replaces the previous one and restarts its duration.

Annotations live in `annotations.json`. Published events/intervals require verified real references and source URLs. Synthetic examples use “Illustrative event” and “Illustrative contraction”; no reference-file recession claims are imported.

## Extensibility evidence

`tests/composition.test.ts` registers a synthetic energy series, a topic with multiple memberships and a preset, then runs the same registry validation and geometry. `tests/browser/atlas.spec.ts` supplies the new records to the same compiled application and verifies its selector and chart rendering. No renderer or route changes are needed.
