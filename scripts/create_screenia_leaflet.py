from pathlib import Path

from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "screenia-a4-leaflet-sv.pdf"
ASSETS = ROOT / "public"

W, H = A4

NAVY = HexColor("#09295F")
BLUE = HexColor("#1457BD")
BLUE_DARK = HexColor("#073984")
PALE_BLUE = HexColor("#EFF5FF")
LINE = HexColor("#D7E5FA")
MUTED = HexColor("#587099")
YELLOW = HexColor("#FFD32A")
INK = HexColor("#17213A")
TEAL = HexColor("#0B9AB2")


def register_fonts():
    regular = ASSETS / "fonts" / "manrope" / "Manrope-500.ttf"
    semibold = ASSETS / "fonts" / "manrope" / "Manrope-600.ttf"
    bold = ASSETS / "fonts" / "manrope" / "Manrope-800.ttf"
    pdfmetrics.registerFont(TTFont("Screenia", str(regular)))
    pdfmetrics.registerFont(TTFont("Screenia-Semibold", str(semibold)))
    pdfmetrics.registerFont(TTFont("Screenia-Bold", str(bold)))


def rounded_rect(c, x, y, width, height, radius, fill, stroke=None, stroke_width=0.8):
    c.setLineWidth(stroke_width)
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, width, height, radius, fill=1, stroke=1 if stroke else 0)


def draw_cover_image(c, path, x, y, width, height):
    image = Image.open(path)
    source_width, source_height = image.size
    scale = max(width / source_width, height / source_height)
    draw_width = source_width * scale
    draw_height = source_height * scale
    draw_x = x + (width - draw_width) / 2
    draw_y = y + (height - draw_height) / 2
    c.saveState()
    clip = c.beginPath()
    clip.rect(x, y, width, height)
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(ImageReader(image), draw_x, draw_y, draw_width, draw_height, mask="auto")
    c.restoreState()


def text(c, value, x, y, width, font="Screenia", size=10, color=INK, leading=None, max_lines=None):
    leading = leading or size * 1.35
    lines = simpleSplit(value, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def centered(c, value, x, y, width, font="Screenia", size=10, color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(x + width / 2, y, value)


def check_mark(c, x, y, fill=BLUE):
    c.setStrokeColor(fill)
    c.setLineWidth(1.7)
    c.line(x, y, x + 2.6, y - 2.6)
    c.line(x + 2.6, y - 2.6, x + 7, y + 3.5)


def benefit_card(c, x, y, width, icon, title, body):
    rounded_rect(c, x, y, width, 53, 12, white, LINE)
    c.setFillColor(PALE_BLUE)
    c.circle(x + 20, y + 31, 12, fill=1, stroke=0)
    c.setFont("Screenia-Bold", 12)
    c.setFillColor(BLUE)
    c.drawCentredString(x + 20, y + 27, icon)
    text(c, title, x + 38, y + 34, width - 47, "Screenia-Bold", 7.9, NAVY, 9.5, 1)
    text(c, body, x + 38, y + 20, width - 47, "Screenia", 6.8, MUTED, 8.5, 2)


def plan_card(c, x, y, width, name, resolution, first_payment, monthly, points, accent, recommended=False):
    height = 166
    rounded_rect(c, x, y, width, height, 14, white, accent, 1)
    c.setFillColor(accent)
    c.roundRect(x, y + height - 7, width, 7, 6, fill=1, stroke=0)
    if recommended:
        rounded_rect(c, x + width - 73, y + height - 26, 62, 17, 8.5, YELLOW)
        centered(c, "REKOMMENDERAS", x + width - 73, y + height - 20.5, 62, "Screenia-Bold", 5.2, INK)
    text(c, name, x + 12, y + height - 28, width - 24, "Screenia-Bold", 13.5, NAVY)
    text(c, resolution, x + 12, y + height - 41, width - 24, "Screenia-Semibold", 7.1, accent)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(x + 12, y + height - 51, x + width - 12, y + height - 51)
    text(c, "FÖRSTA BETALNING", x + 12, y + height - 65, width - 24, "Screenia-Bold", 5.8, MUTED)
    text(c, first_payment, x + 12, y + height - 82, width - 24, "Screenia-Bold", 16, NAVY)
    text(c, "startavgift + enhet + frakt", x + 12, y + height - 94, width - 24, "Screenia", 6.2, MUTED)
    c.setFillColor(PALE_BLUE)
    c.roundRect(x + 10, y + height - 117, width - 20, 18, 7, fill=1, stroke=0)
    text(c, f"{monthly} / mån efter 21 dagar gratis", x + 16, y + height - 110, width - 32, "Screenia-Bold", 6.4, NAVY)
    bullet_y = y + height - 132
    for point in points:
        check_mark(c, x + 14, bullet_y + 2, accent)
        text(c, point, x + 25, bullet_y, width - 37, "Screenia", 6.25, MUTED, 8, 1)
        bullet_y -= 11


def draw_qr(c, value, x, y, size):
    qr = QrCodeWidget(value)
    bounds = qr.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, c, x, y)


def create_leaflet():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    register_fonts()
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("Screenia – Digital skyltning för småföretag")
    c.setAuthor("Screenia")

    margin = 28
    inner_width = W - margin * 2

    c.setFillColor(HexColor("#F7FAFF"))
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Header
    logo = ASSETS / "brand" / "screenia-logo-full-transparent.png"
    c.drawImage(str(logo), margin, H - 51, 155, 46, mask="auto", preserveAspectRatio=True, anchor="sw")
    rounded_rect(c, W - 162, H - 39, 134, 23, 11.5, PALE_BLUE)
    centered(c, "DIGITAL SKYLTNING FÖR FÖRETAG", W - 162, H - 31.7, 134, "Screenia-Bold", 5.9, BLUE)

    # Hero image and strong overlay.
    hero_x, hero_y, hero_w, hero_h = margin, 579, inner_width, 185
    rounded_rect(c, hero_x, hero_y, hero_w, hero_h, 20, BLUE_DARK)
    draw_cover_image(c, ASSETS / "landing" / "hero-slides" / "01" / "image.png", hero_x, hero_y, hero_w, hero_h)
    c.saveState()
    c.setFillColor(Color(0.02, 0.12, 0.30, alpha=0.86))
    c.roundRect(hero_x, hero_y, 270, hero_h, 20, fill=1, stroke=0)
    c.rect(hero_x + 250, hero_y, 55, hero_h, fill=1, stroke=0)
    c.restoreState()
    rounded_rect(c, hero_x + 20, hero_y + 146, 102, 18, 9, YELLOW)
    centered(c, "DIN TV. VÅRT INNEHÅLL.", hero_x + 20, hero_y + 152, 102, "Screenia-Bold", 5.9, INK)
    text(c, "Få fler att\nstanna, titta\noch köpa.", hero_x + 20, hero_y + 119, 220, "Screenia-Bold", 22.5, white, 23.5)
    text(c, "Screenia gör din befintliga TV till en professionell sälj- och informationsyta.", hero_x + 20, hero_y + 36, 214, "Screenia", 8.3, HexColor("#DCEBFF"), 11.2, 3)

    # Benefits row.
    benefit_y = 513
    card_width = (inner_width - 16) / 3
    benefit_card(c, margin, benefit_y, card_width, "01", "Använd er egen TV", "HDMI + Wi-Fi är allt som krävs.")
    benefit_card(c, margin + card_width + 8, benefit_y, card_width, "02", "Vi gör innehållet", "Layout, kampanjer och uppdateringar.")
    benefit_card(c, margin + (card_width + 8) * 2, benefit_y, card_width, "03", "Enkel start", "21 dagar gratis. Ingen bindningstid.")

    # How it works.
    text(c, "Så fungerar det", margin, 483, 250, "Screenia-Bold", 16.5, NAVY)
    text(c, "Från idé till levande skärm – utan krånglig teknik.", margin, 467, 330, "Screenia", 7.7, MUTED)
    flow_y = 435
    step_width = 166
    steps = [
        ("1", "Välj paket", "Välj FHD eller 4K utifrån skärm och innehåll."),
        ("2", "Vi planerar & designar", "Ni skickar logotyp, meny, priser och bilder."),
        ("3", "Koppla in & visa", "Ni ansluter enheten. Vi sköter publiceringen."),
    ]
    for index, (number, title, body) in enumerate(steps):
        x = margin + index * (step_width + 19)
        c.setFillColor(BLUE)
        c.circle(x + 13, flow_y + 13, 13, fill=1, stroke=0)
        centered(c, number, x, flow_y + 8.8, 26, "Screenia-Bold", 9.5, white)
        text(c, title, x + 34, flow_y + 20, 132, "Screenia-Bold", 8, NAVY, 9.5, 1)
        text(c, body, x + 34, flow_y + 8, 132, "Screenia", 6.3, MUTED, 8, 2)

    # Packages heading.
    text(c, "Tydliga paket. Alltid inklusive moms.", margin, 397, 360, "Screenia-Bold", 16.5, NAVY)
    text(c, "Första betalningen omfattar startavgift, konfigurerad enhet och frakt.", margin, 381, 430, "Screenia", 7.6, MUTED)

    plan_y = 204
    plan_width = (inner_width - 16) / 3
    plan_card(
        c, margin, plan_y, plan_width, "Standard", "FULL HD · för mindre skärmar",
        "2 397 kr", "249 kr", ["1080p-visning", "För kampanjer och erbjudanden", "FHD HDMI Stick"], TEAL
    )
    plan_card(
        c, margin + plan_width + 8, plan_y, plan_width, "Premium", "ÄKTA 4K · extra skarpt",
        "2 797 kr", "349 kr", ["3840 × 2160", "För menyer och detaljer", "4K TV Box"], BLUE, True
    )
    plan_card(
        c, margin + (plan_width + 8) * 2, plan_y, plan_width, "Premium Plus", "4K + EGNA VIDEOR",
        "2 797 kr", "399 kr", ["Allt i Premium", "MP4- och WEBM-videor", "Granskning före publicering"], NAVY
    )

    # Bottom call-to-action.
    c.setFillColor(BLUE_DARK)
    c.roundRect(margin, 45, inner_width, 137, 20, fill=1, stroke=0)
    c.setFillColor(YELLOW)
    c.roundRect(margin + 22, 155, 91, 16, 8, fill=1, stroke=0)
    centered(c, "DET HÄR INGÅR", margin + 22, 160, 91, "Screenia-Bold", 5.7, INK)
    text(c, "Personlig planering · första layouten · överenskomna justeringar · konfiguration · support", margin + 22, 137, 330, "Screenia-Semibold", 7.4, white, 10, 2)
    text(c, "Startavgift 1 599 kr. Enhet 699–1 099 kr. Frakt 99 kr. Startavgiften och frakten täcker upp till 3 skärmar; därefter tillkommer 249 kr/skärm och 29 kr/enhet i frakt.", margin + 22, 110, 338, "Screenia", 6.1, HexColor("#CFE2FF"), 8.3, 3)
    text(c, "Klar för en skärm som arbetar för er?", margin + 22, 76, 325, "Screenia-Bold", 12.7, white)
    text(c, "Skanna koden eller besök screenia.se", margin + 22, 61, 325, "Screenia", 7.6, HexColor("#DCEBFF"))
    c.setFillColor(white)
    c.roundRect(W - 123, 61, 72, 92, 12, fill=1, stroke=0)
    draw_qr(c, "https://screenia.se", W - 113, 79, 52)
    centered(c, "SCREENIA.SE", W - 123, 68, 72, "Screenia-Bold", 5.8, NAVY)

    c.setFont("Screenia", 5.3)
    c.setFillColor(MUTED)
    c.drawString(margin, 25, "Priser och villkor gäller enligt aktuell offert och orderöversikt. TV/skärm ingår inte. © Screenia")
    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    create_leaflet()
