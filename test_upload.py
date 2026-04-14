import asyncio
import io
from fastapi import UploadFile
from routes.video_upload_routes import _compress_video, _probe_video_metadata, _save_upload_to_temp_file

async def main():
    # Make a fake video
    from tempfile import NamedTemporaryFile
    import os
    with NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(b"0" * 1024)
        fname = f.name
    
    try:
        data = _probe_video_metadata(fname)
        print("Probe:", data)
    except Exception as e:
        print("Probe Error:", repr(e))

    try:
        _compress_video(fname, fname + "test", 1920, 1080)
        print("Compress ok")
    except Exception as e:
        print("Compress Error:", repr(e))
    
    os.unlink(fname)

if __name__ == "__main__":
    asyncio.run(main())
