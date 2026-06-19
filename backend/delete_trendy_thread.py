import asyncio
from main import get_db

async def delete_vendor():
    db = await get_db()
    vendor_id = "3bTeXvWkZtSmdPf1RDEx"
    
    # Verify first
    doc = await db.get_document('vendors', vendor_id)
    if doc:
        print(f"Found vendor: {doc.get('business_name')} (ID: {vendor_id}). Deleting...")
        success = await db.delete_document('vendors', vendor_id)
        if success:
            print("Successfully deleted Trendy Thread vendor from database.")
        else:
            print("Failed to delete vendor document.")
    else:
        print(f"Vendor with ID {vendor_id} not found in database.")

if __name__ == "__main__":
    asyncio.run(delete_vendor())
