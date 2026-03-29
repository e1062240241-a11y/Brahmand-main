import base64
import cv2
import numpy as np


def _decode_base64_image(b64_str: str):
    if not b64_str:
        return None
    try:
        payload = b64_str.split(',')[-1]
        data = base64.b64decode(payload)
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def _detect_largest_face(gray):
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return None
    # choose largest
    faces = sorted(faces, key=lambda r: r[2] * r[3], reverse=True)
    x, y, w, h = faces[0]
    return gray[y:y+h, x:x+w]


def compare_id_selfie(id_b64: str, selfie_b64: str, threshold: float = 70.0):
    """Compare ID image and selfie using OpenCV LBPH recognizer.

    Returns dict: {status: 'verified'|'manual_review', distance: float|None, reason: str}
    """
    id_img = _decode_base64_image(id_b64)
    selfie_img = _decode_base64_image(selfie_b64)

    if id_img is None or selfie_img is None:
        return {"status": "manual_review", "distance": None, "reason": "invalid_images"}

    try:
        id_gray = cv2.cvtColor(id_img, cv2.COLOR_BGR2GRAY)
        selfie_gray = cv2.cvtColor(selfie_img, cv2.COLOR_BGR2GRAY)
    except Exception:
        return {"status": "manual_review", "distance": None, "reason": "invalid_images"}

    id_face = _detect_largest_face(id_gray)
    selfie_face = _detect_largest_face(selfie_gray)

    if id_face is None or selfie_face is None:
        return {"status": "manual_review", "distance": None, "reason": "face_not_detected"}

    # normalize sizes
    try:
        id_face = cv2.resize(id_face, (200, 200))
        selfie_face = cv2.resize(selfie_face, (200, 200))
    except Exception:
        return {"status": "manual_review", "distance": None, "reason": "face_processing_error"}

    # create and train recognizer on the ID face
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    try:
        recognizer.train([id_face], np.array([0], dtype=np.int32))
        label, dist = recognizer.predict(selfie_face)
    except Exception:
        return {"status": "manual_review", "distance": None, "reason": "recognizer_error"}

    # lower distance indicates better match; threshold tuned empirically
    verified = float(dist) <= float(threshold)
    if verified:
        return {"status": "verified", "distance": float(dist), "reason": "match"}
    return {"status": "manual_review", "distance": float(dist), "reason": "mismatch"}
