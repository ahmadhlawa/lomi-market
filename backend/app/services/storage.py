from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.errors import ApiError


class LocalImageStorage:
    allowed_formats = {"JPEG", "PNG", "WEBP"}

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or settings.upload_dir

    async def save(self, upload: UploadFile) -> dict:
        content = await upload.read(settings.max_upload_bytes + 1)
        if len(content) > settings.max_upload_bytes:
            raise ApiError(413, "Image exceeds the maximum upload size", "file_too_large")
        try:
            probe = Image.open(BytesIO(content))
            probe.verify()
            image = Image.open(BytesIO(content))
            image.load()
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise ApiError(422, "Uploaded content is not a valid image", "invalid_image") from exc
        if image.format not in self.allowed_formats:
            raise ApiError(422, "Only JPEG, PNG and WebP images are allowed", "invalid_image_type")
        width, height = image.size
        if width < 64 or height < 64 or width > 8000 or height > 8000:
            raise ApiError(422, "Image dimensions must be between 64 and 8000 pixels", "invalid_image_dimensions")
        self.root.mkdir(parents=True, exist_ok=True)
        token = uuid4().hex
        filename = f"{token}.webp"
        thumbnail = f"{token}-thumb.webp"
        destination = (self.root / filename).resolve()
        if self.root.resolve() not in destination.parents:
            raise ApiError(422, "Unsafe upload path", "unsafe_path")
        converted = image.convert("RGB")
        converted.thumbnail((1800, 1800))
        converted.save(destination, "WEBP", quality=84, method=6)
        thumb_image = image.convert("RGB")
        thumb_image.thumbnail((360, 360))
        thumb_image.save(self.root / thumbnail, "WEBP", quality=78, method=6)
        base = settings.public_base_url.rstrip("/")
        return {
            "filename": filename,
            "url": f"{base}/uploads/{filename}",
            "thumbnail_url": f"{base}/uploads/{thumbnail}",
            "width": width,
            "height": height,
            "bytes": destination.stat().st_size,
        }

    def delete(self, filename: str) -> None:
        target = (self.root / Path(filename).name).resolve()
        if self.root.resolve() in target.parents and target.exists():
            target.unlink()
