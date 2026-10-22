"""Event Routes"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from models.schemas import EventCreate
from services.event_service import EventService
from middleware.security import verify_token

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("")
async def create_event(
    event_data: EventCreate,
    token_data: dict = Depends(verify_token)
):
    """Create a new event"""
    try:
        return await EventService.create_event(
            organizer_id=token_data["user_id"],
            name=event_data.name,
            description=event_data.description,
            event_type=event_data.event_type,
            location=event_data.location,
            date=event_data.date,
            time=event_data.time,
            organizer_name=event_data.organizer_name
        )
    except ValueError:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("")
async def get_events(
    limit: int = 20,
    offset: int = 0,
    token_data: dict = Depends(verify_token)
):
    """Get upcoming events with pagination"""
    return await EventService.get_events(limit=limit, offset=offset)


@router.get("/nearby")
async def get_nearby_events(
    limit: int = 20,
    offset: int = 0,
    token_data: dict = Depends(verify_token)
):
    """Get events near user's location with pagination"""
    return await EventService.get_nearby_events(token_data["user_id"], limit=limit, offset=offset)


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    token_data: dict = Depends(verify_token)
):
    """Get event details"""
    try:
        return await EventService.get_event(event_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Resource not found")


@router.post("/{event_id}/attend")
async def attend_event(
    event_id: str,
    token_data: dict = Depends(verify_token)
):
    """Mark attendance for an event"""
    return await EventService.attend_event(token_data["user_id"], event_id)


@router.post("/{event_id}/cancel-attendance")
async def cancel_attendance(
    event_id: str,
    token_data: dict = Depends(verify_token)
):
    """Cancel attendance for an event"""
    return await EventService.cancel_attendance(token_data["user_id"], event_id)


class GeneratePdfRequest(BaseModel):
    eventId: str
    festivalId: Optional[str] = "festival"
    recipientName: str
    userId: Optional[str] = "guest"


@router.post("/generate-pdf")
async def generate_event_pdf(payload: GeneratePdfRequest):
    """
    Renders an attributed, personalized festival practical guide PDF.
    Footers embed a tracked QR code to drive the viral return loop.
    """
    import io
    import urllib.parse
    import qrcode
    from fastapi.responses import Response
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    recipient_name = payload.recipientName.strip() or "Aap"
    clean_name = urllib.parse.quote(recipient_name.lower())

    # Build viral loop return URL
    app_base = "https://brahmand.app"
    query_params = urllib.parse.urlencode({
        "from": f"pdf_{clean_name}",
        "uid": payload.userId or "guest",
        "fest": payload.festivalId or "festival",
    })
    tracked_return_url = f"{app_base}/events/{payload.eventId}?{query_params}"

    # Generate QR Code buffer
    qr_img = qrcode.make(tracked_return_url)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    # Fetch event info or build structured practical guide fallback
    event_data = None
    try:
        event_data = await EventService.get_event(payload.eventId)
    except Exception:
        event_data = None

    title = (event_data or {}).get("name") or (event_data or {}).get("title") or "Sharad Purnima: Kheer Shubh Samay & Niyam"
    date_str = (event_data or {}).get("date") or "24 October 2026"
    time_str = (event_data or {}).get("time") or "Raat 11:30 PM - 12:45 AM"
    location_str = (event_data or {}).get("location") or "Ghar ka Chhat / Aangan"

    # Default practical steps if not present
    practical_steps = [
        {"num": "1", "action": "Gaay ke doodh aur chawal ki shuddh kheer banayein.", "meta": "Samay: Shaam 8 baje tak"},
        {"num": "2", "action": "Chandi ke bartan ya saaf kaanch ke paatra mein nikalein.", "meta": "Chandi sheetalta aur shuddhata pradan karti hai"},
        {"num": "3", "action": "Patli jhaali ya sooti kapde se dhak kar khuli chandni mein rakhein.", "meta": "Shubh Muhurat: Raat 11:30 PM - 12:45 AM"},
        {"num": "4", "action": "Subah brahmamuhurt mein parivaar ke sabhi sadasyon ko prasad dein.", "meta": "Samay: Agle din subah 05:00 AM"},
    ]

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'HeaderTag',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=HexColor('#B45309'),
        spaceAfter=4,
    )
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=HexColor('#0F172A'),
        alignment=0,
        spaceAfter=8,
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=HexColor('#475569'),
        spaceAfter=14,
    )
    section_head = ParagraphStyle(
        'SectionHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=8,
    )
    step_action_style = ParagraphStyle(
        'StepAction',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=HexColor('#1E293B'),
    )
    step_meta_style = ParagraphStyle(
        'StepMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=HexColor('#64748B'),
    )

    elements = []
    elements.append(Paragraph("BRAHMAND FESTIVAL PRACTICAL GUIDE", header_style))
    elements.append(Paragraph(f"{recipient_name} ke Parivaar ke Liye Vishesh Guide", title_style))
    elements.append(Paragraph(f"{title} &bull; Shubh Muhurat & Vidhi", subtitle_style))

    # Details table
    detail_data = [
        [
            Paragraph(f"<b>🗓️ Date:</b> {date_str}", step_action_style),
            Paragraph(f"<b>⏰ Shubh Samay:</b> {time_str}", step_action_style),
        ],
        [
            Paragraph(f"<b>📍 Sthaan:</b> {location_str}", step_action_style),
            Paragraph("<b>🕉️ Tradition:</b> Shuddh Vidhi", step_action_style),
        ]
    ]
    detail_table = Table(detail_data, colWidths=[260, 260])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 14))

    # Steps table
    elements.append(Paragraph("Kaise Karna Hai: Step-by-Step Vidhi", section_head))

    step_table_rows = []
    for s in practical_steps:
        step_content = [
            Paragraph(f"<b>{s['num']}. {s['action']}</b>", step_action_style),
            Spacer(1, 2),
            Paragraph(s['meta'], step_meta_style),
        ]
        step_table_rows.append([
            Paragraph(f"<font color='#B45309'><b>{s['num']}</b></font>", step_action_style),
            step_content
        ])

    steps_table = Table(step_table_rows, colWidths=[30, 490])
    steps_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(steps_table)
    elements.append(Spacer(1, 20))

    # Viral Loop QR Footer
    qr_img_flow = Image(qr_buffer, width=80, height=80)
    footer_text = [
        Paragraph("<b>Apna Personalised Festival Guide Banayein!</b>", step_action_style),
        Spacer(1, 3),
        Paragraph(
            "Scan this QR code to open Brahmand app, set shubh muhurat alerts, "
            "or create a custom guide with your family's name.",
            step_meta_style
        ),
        Spacer(1, 4),
        Paragraph(f"<font color='#B45309'><b>Direct link:</b> {tracked_return_url}</font>", step_meta_style),
    ]

    footer_table = Table([[qr_img_flow, footer_text]], colWidths=[90, 430])
    footer_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 1, HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(footer_table)

    def draw_pdf_background(canvas_obj, document):
        canvas_obj.saveState()
        # Soft decorative background tint
        canvas_obj.setFillColor(HexColor('#FCFBF7'))
        canvas_obj.rect(0, 0, document.pagesize[0], document.pagesize[1], fill=1, stroke=0)
        
        # Elegant outer golden border
        canvas_obj.setStrokeColor(HexColor('#D97706'))
        canvas_obj.setLineWidth(2)
        canvas_obj.rect(20, 20, document.pagesize[0] - 40, document.pagesize[1] - 40, fill=0, stroke=1)
        
        # Subtle inner border
        canvas_obj.setStrokeColor(HexColor('#FDE68A'))
        canvas_obj.setLineWidth(0.8)
        canvas_obj.rect(24, 24, document.pagesize[0] - 48, document.pagesize[1] - 48, fill=0, stroke=1)
        
        # Top festive accent bar
        canvas_obj.setFillColor(HexColor('#B45309'))
        canvas_obj.rect(20, document.pagesize[1] - 28, document.pagesize[0] - 40, 8, fill=1, stroke=0)
        
        # Sacred Om watermark in center background
        canvas_obj.setFont("Helvetica", 140)
        canvas_obj.setFillColor(HexColor('#F1F5F9'), alpha=0.35)
        canvas_obj.drawCentredString(document.pagesize[0] / 2.0, document.pagesize[1] / 2.0 - 40, "ॐ")
        canvas_obj.restoreState()

    doc.build(elements, onFirstPage=draw_pdf_background, onLaterPages=draw_pdf_background)
    pdf_buffer.seek(0)

    filename = f"{recipient_name.replace(' ', '_')}_Guide.pdf"
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
