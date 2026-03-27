import asyncio
from config.settings import settings
from services.prokerala_panchang_service import prokerala_panchang_service

async def main():
    settings.PROKERALA_MAX_ENDPOINTS_PER_CALL = 10
    lat, lng = 28.6139, 77.2090
    try:
        payload = await prokerala_panchang_service.get_aggregated_panchang(lat, lng, force_refresh=True)
        meta = payload.get('meta', {})
        print('META:', meta)
        print('SOURCES:', list(payload.get('sources', {}).keys()))
        p = payload.get('sources', {}).get('panchang_advanced', {})
        tithi = None
        if isinstance(p, dict):
            t = p.get('tithi')
            if isinstance(t, dict):
                tithi = t.get('name')
        print('Date:', payload.get('date'))
        print('Timezone:', payload.get('timezone'))
        print('Sunrise:', p.get('sunrise') or p.get('sunrise_time'))
        print('Tithi:', tithi or '-')
        print('Nakshatra:', (p.get('nakshatra') or {}).get('name') if isinstance(p.get('nakshatra'), dict) else '-')
    except Exception as e:
        print('ERROR FETCH:', e)

if __name__ == '__main__':
    asyncio.run(main())
