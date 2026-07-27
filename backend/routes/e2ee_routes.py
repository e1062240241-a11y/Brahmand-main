from fastapi import APIRouter, Depends, HTTPException
from middleware.security import verify_token
from config.database import get_database

router = APIRouter(tags=["e2ee"])

@router.post("/communities/{community_id}/keys")
async def add_community_key(
    community_id: str,
    data: dict,
    token_data: dict = Depends(verify_token)
):
    """Admin uploads encrypted symmetric key for a new member."""
    db = await get_database()

    target_user_id = data.get("user_id")
    encrypted_key = data.get("encrypted_key")

    if not target_user_id or not encrypted_key:
        raise HTTPException(status_code=400, detail="Missing user_id or encrypted_key")

    doc_ref = db.collection("community_keys").document(f"{community_id}_{target_user_id}")
    doc_ref.set({
        "community_id": community_id,
        "user_id": target_user_id,
        "encrypted_key": encrypted_key,
        "added_by": token_data["user_id"]
    })

    return {"status": "success"}


@router.get("/communities/{community_id}/keys")
async def get_community_key(
    community_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get encrypted symmetric key for current member."""
    db = await get_database()
    user_id = token_data["user_id"]

    doc_ref = db.collection("community_keys").document(f"{community_id}_{user_id}")
    doc = doc_ref.get()
    if not doc.exists:
         return {"encrypted_key": None}

    key_data = doc.to_dict()
    return {
        "encrypted_key": key_data.get("encrypted_key"),
        "added_by": key_data.get("added_by")
    }
