import hmac
import json
import os
import uuid
from typing import Annotated
from urllib.parse import quote

import fitz
import httpx
import pymupdf4llm
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

app = FastAPI()


def content_type(extension: str) -> str:
    return {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }.get(extension.lower(), "application/octet-stream")


def normalized_clip(page: fitz.Page, box: list[float]) -> fitz.Rect:
    if len(box) != 4 or any(not isinstance(value, (int, float)) for value in box):
        raise ValueError("invalid box")
    x0, y0, x1, y1 = box
    if not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
        raise ValueError("box coordinates must be normalized")
    rect = page.rect
    return fitz.Rect(rect.x0 + x0 * rect.width, rect.y0 + y0 * rect.height,
                     rect.x0 + x1 * rect.width, rect.y0 + y1 * rect.height)


def original_image(doc: fitz.Document, page: fitz.Page, clip: fitz.Rect):
    candidates = {}
    for image in page.get_images(full=True):
        xref = image[0]
        for rect in page.get_image_rects(xref):
            intersection = rect & clip
            if intersection.is_empty:
                continue
            coverage = intersection.get_area() / max(rect.get_area(), 1)
            if coverage >= 0.8:
                candidates[xref] = max(coverage, candidates.get(xref, 0))
    if len(candidates) != 1:
        return None
    extracted = doc.extract_image(next(iter(candidates)))
    extension = extracted.get("ext", "png").lower()
    if extension not in {"png", "jpg", "jpeg", "webp"}:
        return None
    return extracted["image"], extension


@app.post("/api/pdf_extract")
async def extract_pdf_regions(
    file: Annotated[UploadFile, File()],
    action: Annotated[str, Form()] = "extract",
    regions: Annotated[str, Form()] = "[]",
    upload_prefix: Annotated[str, Form()] = "",
    x_extractor_secret: Annotated[str | None, Header()] = None,
):
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    if not service_key or not x_extractor_secret or not hmac.compare_digest(x_extractor_secret, service_key):
        raise HTTPException(status_code=401, detail="Unauthorized")
    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF")

    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    if action == "layout":
        try:
            layout_json = pymupdf4llm.to_json(
                document,
                embed_images=False,
                write_images=False,
                show_progress=False,
            )
            return {"layout": json.loads(layout_json), "engine": "PyMuPDF4LLM"}
        except Exception as error:
            raise HTTPException(status_code=422, detail=f"Layout extraction failed: {error}") from error
        finally:
            document.close()

    if action != "extract":
        document.close()
        raise HTTPException(status_code=400, detail="Invalid action")
    if not supabase_url:
        document.close()
        raise HTTPException(status_code=503, detail="Storage is not configured")
    try:
        requested = json.loads(regions)
        if not isinstance(requested, list) or len(requested) > 500 or not upload_prefix:
            raise ValueError("invalid regions")
    except (json.JSONDecodeError, ValueError) as error:
        document.close()
        raise HTTPException(status_code=400, detail=str(error)) from error

    assets = {}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            for region in requested:
                asset_id = str(region.get("id", ""))
                page_number = int(region.get("pageNumber", 0))
                if not asset_id or not 1 <= page_number <= document.page_count:
                    continue
                try:
                    page = document[page_number - 1]
                    clip = normalized_clip(page, region.get("box", []))
                except (TypeError, ValueError):
                    continue

                source = original_image(document, page, clip)
                if source:
                    image_bytes, extension = source
                else:
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip, alpha=False)
                    image_bytes, extension = pixmap.tobytes("png"), "png"

                object_path = f"{upload_prefix}/{uuid.uuid4().hex}.{extension}"
                endpoint = f"{supabase_url}/storage/v1/object/exam-question-images/{quote(object_path, safe='/')}"
                response = await client.post(endpoint, content=image_bytes, headers={
                    "Authorization": f"Bearer {service_key}",
                    "apikey": service_key,
                    "Content-Type": content_type(extension),
                    "x-upsert": "false",
                })
                if response.status_code >= 300:
                    raise HTTPException(status_code=502, detail="Image upload failed")
                assets[asset_id] = f"{supabase_url}/storage/v1/object/public/exam-question-images/{quote(object_path, safe='/')}"
    finally:
        document.close()

    return {"assets": assets}
