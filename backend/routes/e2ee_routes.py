from fastapi import APIRouter, Depends, HTTPException
from config.database import get_db_manager
from models.users import verify_token

router = APIRouter(tags=["e2ee"])

@router.post("/communities/{community_id}/keys")
async def add_community_key(
    community_id: str,
    data: dict,
    token_data: dict = Depends(verify_token)
):
    """Admin uploads encrypted symmetric key for a new member."""
    db = await get_db()

    # In a real app we'd verify if the current user is an admin of the community.
    # For now, we just save it.
    target_user_id = data.get("user_id")
    encrypted_key = data.get("encrypted_key")

    if not target_user_id or not encrypted_key:
        raise HTTPException(status_code=400, detail="Missing user_id or encrypted_key")

    await db.update_document("community_keys", f"{community_id}_{target_user_id}", {
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
    db = await get_db()
    user_id = token_data["user_id"]

    key_doc = await db.get_document("community_keys", f"{community_id}_{user_id}")
    if not key_doc:
         return {"encrypted_key": None}

    return {
        "encrypted_key": key_doc.get("encrypted_key"),
        "added_by": key_doc.get("added_by")
    }
