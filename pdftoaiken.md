# PDF exam import

EzMath uses structured JSON as its canonical import format. Aiken is not used
internally because it cannot represent images, passages, explanations, topics,
or review state.

```text
[ SAT / ЭЕШ PDF ]
        |
        +--> [ PyMuPDF4LLM: native layout JSON ]
        |          |-- reading order, text, tables, formulas, picture boxes
        |          +-- OCR fallback for scanned pages
        |
        +--> [ GPT-4o mini: map layout JSON to EzMath exam JSON ]
        |                     (never solve or select correct answers)
        |
        +--> [ PyMuPDF: extract exact image regions ]
                  |-- embedded raster --> preserve original bytes
                  +-- vector/multi-part visual --> lossless PNG crop
        |
        v
[ Merge question JSON + stored image URLs ]
        |
        v
[ Admin editor: review text and select every correct answer ]
        |
        v
[ Save draft / publish validated exam ]
```

## Import rules

- Preserve Mongolian Cyrillic using UTF-8.
- Normalize Cyrillic option labels to Latin `A`, `B`, `C`, `D`, `E`.
- Imported questions start without a selected correct answer.
- Drafts may be saved with unanswered questions; publishing is blocked until
  every question has a valid correct option.
- Question images are uploaded server-side to the public
  `exam-question-images` Supabase Storage bucket. Normal users have no upload or
  delete permission.
- PyMuPDF4LLM JSON is the primary source for document structure and bounding
  boxes. The original PDF is used only to resolve ambiguous exam relationships.
- If a PDF visual is embedded as a single raster image, preserve its original
  bytes. If it is vector-based or composed from multiple objects, render only
  its exact bounding region to a lossless PNG.
