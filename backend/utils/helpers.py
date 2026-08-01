"""Helper utilities"""
import random
import string
from typing import Optional, Tuple, Dict, Any


def generate_sl_id() -> str:
    """Generate unique Sanatan Lok ID"""
    return f"SL-{random.randint(100000, 999999)}"


def generate_circle_code(name: str) -> str:
    """Generate circle code from name"""
    clean_name = ''.join(c for c in name.upper() if c.isalnum())[:6]
    random_suffix = ''.join(random.choices(string.digits, k=3))
    return f"{clean_name}{random_suffix}"


def generate_community_code(name: str) -> str:
    """Generate community code"""
    clean_name = ''.join(c for c in name.upper() if c.isalnum())[:8]
    return f"{clean_name}108"


def generate_temple_id() -> str:
    """Generate unique Temple ID"""
    return f"TPL-{random.randint(1000, 9999)}"


def serialize_doc(doc: Optional[Dict]) -> Optional[Dict]:
    """Convert MongoDB document to serializable dict"""
    if doc is None:
        return None
    doc = dict(doc)
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc


# Keyword-based moderation (basic)
BLOCKED_KEYWORDS = ["spam", "scam", "fraud", "abuse", "hack", "porn", "xxx"]


def moderate_content(content: str) -> Tuple[bool, Optional[str]]:
    """Basic keyword-based content moderation"""
    content_lower = content.lower()
    for keyword in BLOCKED_KEYWORDS:
        if keyword in content_lower:
            return False, f"Content contains inappropriate keyword"
    return True, None


# Daily Wisdom Quotes
WISDOM_QUOTES = [
    {"quote": "You have the right to perform your duty, but not the fruits of action.", "source": "Bhagavad Gita 2.47"},
    {"quote": "The soul is neither born, nor does it ever die. It is unborn, eternal, and primeval.", "source": "Bhagavad Gita 2.20"},
    {"quote": "Set thy heart upon thy work, but never on its reward.", "source": "Bhagavad Gita"},
    {"quote": "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", "source": "Bhagavad Gita 6.19"},
    {"quote": "One who sees inaction in action, and action in inaction, is intelligent among men.", "source": "Bhagavad Gita 4.18"},
    {"quote": "The mind is restless and difficult to restrain, but it is subdued by practice.", "source": "Bhagavad Gita 6.35"},
    {"quote": "Whatever happened, happened for the good. Whatever is happening, is happening for the good.", "source": "Bhagavad Gita"},
    {"quote": "He who has no attachments can really love others, for his love is pure and divine.", "source": "Bhagavad Gita"},
    {"quote": "A person can rise through the efforts of his own mind; he can also degrade himself.", "source": "Bhagavad Gita 6.5"},
    {"quote": "The wise see knowledge and action as one; they see truly.", "source": "Bhagavad Gita 5.4"},
    {"quote": "Perform your obligatory duty, because action is indeed better than inaction.", "source": "Bhagavad Gita 3.8"},
    {"quote": "Reshape yourself through the power of your will. Those who have conquered themselves live in peace.", "source": "Bhagavad Gita"},
]

# Hindu Calendar Tithis
TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", 
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
]

# Common Vrats
VRATS = [
    "Ekadashi Vrat", "Pradosh Vrat", "Satyanarayan Vrat", "Somvar Vrat",
    "Mangalvar Vrat", "Guruvar Vrat", "Shanivar Vrat", "Shukravar Vrat",
    "Purnima Vrat", "Amavasya Vrat", "Nirjala Ekadashi", "Karwa Chauth"
]

# Community subgroups template
SUBGROUPS = [
    {"name": "Community Chat", "type": "chat", "rules": "No promotions. No political discussions. Respectful communication."},
    {"name": "Political Discussion", "type": "political", "rules": "Respectful debate only. No abusive language."},
    {"name": "Local Vendors", "type": "marketplace", "rules": "Marketplace for local Hindu businesses. Promotions allowed."},
    {"name": "Festival Marketplace", "type": "festival", "rules": "Vendors related to festivals only."},
    {"name": "Temple Events", "type": "events", "rules": "Religious and temple events only."},
    {"name": "Community Volunteers", "type": "volunteers", "rules": "Volunteer for events, seva activities, and community work."},
    {"name": "Community Invitations", "type": "invitations", "rules": "Invitations to personal or public events."},
    {"name": "Community Help", "type": "help", "rules": "Emergency support. Blood donation, hospital help, urgent assistance."}
]

# Supported languages
SUPPORTED_LANGUAGES = ["English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali"]

# City to State and Country mapping lookup table
CITY_TO_STATE_MAP = {
    "mumbai": ("Maharashtra", "Bharat"),
    "navi mumbai": ("Maharashtra", "Bharat"),
    "thane": ("Maharashtra", "Bharat"),
    "pune": ("Maharashtra", "Bharat"),
    "pimpri-chinchwad": ("Maharashtra", "Bharat"),
    "nagpur": ("Maharashtra", "Bharat"),
    "nashik": ("Maharashtra", "Bharat"),
    "aurangabad": ("Maharashtra", "Bharat"),
    "solapur": ("Maharashtra", "Bharat"),
    "amravati": ("Maharashtra", "Bharat"),
    "kolhapur": ("Maharashtra", "Bharat"),
    "akola": ("Maharashtra", "Bharat"),
    "delhi": ("Delhi", "Bharat"),
    "new delhi": ("Delhi", "Bharat"),
    "noida": ("Uttar Pradesh", "Bharat"),
    "greater noida": ("Uttar Pradesh", "Bharat"),
    "gurgaon": ("Haryana", "Bharat"),
    "gurugram": ("Haryana", "Bharat"),
    "faridabad": ("Haryana", "Bharat"),
    "ghaziabad": ("Uttar Pradesh", "Bharat"),
    "jaipur": ("Rajasthan", "Bharat"),
    "jodhpur": ("Rajasthan", "Bharat"),
    "udaipur": ("Rajasthan", "Bharat"),
    "kota": ("Rajasthan", "Bharat"),
    "ajmer": ("Rajasthan", "Bharat"),
    "bikaner": ("Rajasthan", "Bharat"),
    "alwar": ("Rajasthan", "Bharat"),
    "ahmedabad": ("Gujarat", "Bharat"),
    "surat": ("Gujarat", "Bharat"),
    "vadodara": ("Gujarat", "Bharat"),
    "rajkot": ("Gujarat", "Bharat"),
    "bhavnagar": ("Gujarat", "Bharat"),
    "jamnagar": ("Gujarat", "Bharat"),
    "junagadh": ("Gujarat", "Bharat"),
    "anand": ("Gujarat", "Bharat"),
    "gandhinagar": ("Gujarat", "Bharat"),
    "lucknow": ("Uttar Pradesh", "Bharat"),
    "kanpur": ("Uttar Pradesh", "Bharat"),
    "varanasi": ("Uttar Pradesh", "Bharat"),
    "ayodhya": ("Uttar Pradesh", "Bharat"),
    "agra": ("Uttar Pradesh", "Bharat"),
    "prayagraj": ("Uttar Pradesh", "Bharat"),
    "allahabad": ("Uttar Pradesh", "Bharat"),
    "mathura": ("Uttar Pradesh", "Bharat"),
    "meerut": ("Uttar Pradesh", "Bharat"),
    "bareilly": ("Uttar Pradesh", "Bharat"),
    "aligarh": ("Uttar Pradesh", "Bharat"),
    "gorakhpur": ("Uttar Pradesh", "Bharat"),
    "firozabad": ("Uttar Pradesh", "Bharat"),
    "bangalore": ("Karnataka", "Bharat"),
    "bengaluru": ("Karnataka", "Bharat"),
    "mysore": ("Karnataka", "Bharat"),
    "mysuru": ("Karnataka", "Bharat"),
    "hubli": ("Karnataka", "Bharat"),
    "mangalore": ("Karnataka", "Bharat"),
    "belgaum": ("Karnataka", "Bharat"),
    "davanagere": ("Karnataka", "Bharat"),
    "gulbarga": ("Karnataka", "Bharat"),
    "chennai": ("Tamil Nadu", "Bharat"),
    "coimbatore": ("Tamil Nadu", "Bharat"),
    "madurai": ("Tamil Nadu", "Bharat"),
    "tiruchirappalli": ("Tamil Nadu", "Bharat"),
    "salem": ("Tamil Nadu", "Bharat"),
    "tirunelveli": ("Tamil Nadu", "Bharat"),
    "erode": ("Tamil Nadu", "Bharat"),
    "hyderabad": ("Telangana", "Bharat"),
    "warangal": ("Telangana", "Bharat"),
    "visakhapatnam": ("Andhra Pradesh", "Bharat"),
    "vijayawada": ("Andhra Pradesh", "Bharat"),
    "guntur": ("Andhra Pradesh", "Bharat"),
    "tirupati": ("Andhra Pradesh", "Bharat"),
    "kakinada": ("Andhra Pradesh", "Bharat"),
    "kurnool": ("Andhra Pradesh", "Bharat"),
    "kolkata": ("West Bengal", "Bharat"),
    "siliguri": ("West Bengal", "Bharat"),
    "durgapur": ("West Bengal", "Bharat"),
    "cuttack": ("Odisha", "Bharat"),
    "bhubaneswar": ("Odisha", "Bharat"),
    "rourkela": ("Odisha", "Bharat"),
    "patna": ("Bihar", "Bharat"),
    "ranchi": ("Jharkhand", "Bharat"),
    "jamshedpur": ("Jharkhand", "Bharat"),
    "dhanbad": ("Jharkhand", "Bharat"),
    "bhopal": ("Madhya Pradesh", "Bharat"),
    "indore": ("Madhya Pradesh", "Bharat"),
    "gwalior": ("Madhya Pradesh", "Bharat"),
    "jabalpur": ("Madhya Pradesh", "Bharat"),
    "ujjain": ("Madhya Pradesh", "Bharat"),
    "raipur": ("Chhattisgarh", "Bharat"),
    "bilaspur": ("Chhattisgarh", "Bharat"),
    "chandigarh": ("Chandigarh", "Bharat"),
    "ludhiana": ("Punjab", "Bharat"),
    "amritsar": ("Punjab", "Bharat"),
    "jalandhar": ("Punjab", "Bharat"),
    "ambala": ("Haryana", "Bharat"),
    "shimla": ("Himachal Pradesh", "Bharat"),
    "dehradun": ("Uttarakhand", "Bharat"),
    "jammu": ("Jammu and Kashmir", "Bharat"),
    "srinagar": ("Jammu and Kashmir", "Bharat"),
    "guwahati": ("Assam", "Bharat"),
    "shillong": ("Meghalaya", "Bharat"),
    "aizawl": ("Mizoram", "Bharat"),
    "imphal": ("Manipur", "Bharat"),
    "kohima": ("Nagaland", "Bharat"),
    "itanagar": ("Arunachal Pradesh", "Bharat"),
    "kochi": ("Kerala", "Bharat"),
    "thiruvananthapuram": ("Kerala", "Bharat"),
    "kozhikode": ("Kerala", "Bharat"),
    "panaji": ("Goa", "Bharat"),
    "puducherry": ("Puducherry", "Bharat"),
}


def normalize_location(loc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Normalize location details to prevent sub-community fragmentation (e.g. mapping area groups to city level)"""
    if not loc:
        return loc
    
    # Create a copy to prevent in-place mutation issues
    normalized = dict(loc)
    
    country = normalized.get("country", "") or ""
    state = normalized.get("state", "") or ""
    city = normalized.get("city", "") or ""
    area = normalized.get("area", "") or ""
    display_name = normalized.get("display_name", "") or ""
    
    # Normalize India to Bharat
    if country.lower().strip() in ["india", "bharat"]:
        country = "Bharat"
        
    # Clean Suburban from city names
    if "Suburban" in city:
        city = city.replace(" Suburban", "").strip()
        
    city_lower = city.lower().strip()
    area_lower = area.lower().strip()
    display_name_lower = display_name.lower().strip()
    
    # Handle Madh / Madh Island and other sublocalities under Mumbai
    if "madh" in city_lower or "madh island" in city_lower:
        if not area or "madh" not in area_lower:
            area = city
        city = "Mumbai"
    elif "mumbai" in display_name_lower or "mumbai" in area_lower or "mumbai" in city_lower:
        mumbai_subareas = ["madh", "madh island", "malad", "andheri", "juhu", "bandra", "borivali", "dadar", "colaba", "chembur", "kurla", "ghatkopar", "kandivali"]
        if any(sub in city_lower for sub in mumbai_subareas):
            if not area:
                area = city
            city = "Mumbai"
            
    city = city.strip()
    area = area.strip()
    
    normalized["country"] = country
    normalized["state"] = state
    normalized["city"] = city
    normalized["area"] = area
    
    return normalized

