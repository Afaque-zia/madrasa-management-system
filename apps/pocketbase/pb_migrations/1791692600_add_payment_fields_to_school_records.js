/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("school_records");
    if (!collection.fields.getByName("paid_amount")) {
      collection.fields.add(new NumberField({ name: "paid_amount", min: 0 }));
    }
    if (!collection.fields.getByName("reference")) {
      collection.fields.add(new TextField({ name: "reference" }));
    }
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("school_records");
    try {
      collection.fields.removeByName("paid_amount");
    } catch (_) {
      /* already gone */
    }
    try {
      collection.fields.removeByName("reference");
    } catch (_) {
      /* already gone */
    }
    app.save(collection);
  },
);
