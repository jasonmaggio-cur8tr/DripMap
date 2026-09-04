"""Build the Café Cherki cast contact sheet from the locked character sheets.

Runs in the Higgsfield sandbox (Pillow + Montserrat). Expects <name>.png sheets in the
working dir, one per SHEETS entry. Each sheet is a row of panels on an off-white ground;
the first panel is the full-body front view, the last is the head close-up. Panels are found
by scanning for background gaps between columns, so no coordinates are hard-coded.

Output: cast.jpg, 4 columns, each cell = head crop over full body with the name beneath.
"""
from PIL import Image, ImageDraw, ImageFont

# name, job id (the locked sheet). Keep in sync with HIGGSFIELD_ASSETS.md.
SHEETS = [
    ("cherki",   "Rayan Cherki",    "66f3e55f-fbbb-4798-8836-d1aab8017d20"),
    ("rashford", "Marcus Rashford", "f2b4ec2f-488a-4a8e-99c9-ee1048a51080"),
    ("maguire",  "Harry Maguire",   "ef2914e6-c1fa-4115-8e22-649587317f70"),
    ("foden",    "Phil Foden",      "026f8456-c840-492f-9dae-a294b445e5ab"),
    ("haaland",  "Erling Haaland",  "1919e40c-45b5-45b2-b57c-196aa0fa90d1"),
    ("grealish", "Jack Grealish",   "9b4bf768-9c9c-41de-bac6-868aa1db1ee9"),
    ("kane",     "Harry Kane",      "1f845942-2f4e-4584-9a10-16a058ca9611"),
    ("rooney",   "Wayne Rooney",    "dda15a25-2e65-4da9-a977-2d3e771ae0ee"),
    ("liam",     "Liam",            "7928e3bf-88b4-46e1-a9a9-d93cdf5fa045"),
    ("henry",    "Thierry Henry",   "f74ef1ee-52f2-4977-adf6-372b281e96c3"),
    ("beckham",  "David Beckham",   "441fdfa1-a261-4c40-a915-a6c1c08beb99"),
    ("saka",     "Bukayo Saka",     "a11f118a-0d85-4dd5-84fd-876f50cf9e44"),
]
FONT = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"
COLS, CELL_W, HEAD_H, BODY_H, LABEL_H, PAD = 4, 520, 380, 720, 70, 24
BG, FG = (243, 234, 216), (43, 30, 22)


def panels(im):
    """Column bands of non-background content, merged over small gaps."""
    g = im.convert("L")
    w, h = g.size
    bgv = max(g.getpixel((2, 2)), g.getpixel((w - 3, 2)), g.getpixel((2, h - 3)))
    thr = bgv - 30
    small = g.resize((w // 8, h // 8))
    sw, sh = small.size
    px = small.load()
    occ = [sum(1 for y in range(sh) if px[x, y] < thr) > sh * 0.06 for x in range(sw)]
    bands, start = [], None
    for x, on in enumerate(occ + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            bands.append([start * 8, x * 8])
            start = None
    merged = []
    for b in bands:
        if merged and b[0] - merged[-1][1] < w * 0.02:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    return [b for b in merged if b[1] - b[0] > w * 0.06]


def bbox(im):
    g = im.convert("L")
    w, h = g.size
    bgv = g.getpixel((2, 2))
    mask = g.point(lambda v: 255 if v < bgv - 30 else 0)
    return mask.getbbox() or (0, 0, w, h)


def fit(im, W, H):
    r = min(W / im.width, H / im.height)
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), BG)
    canvas.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
    return canvas


def cell(name, label):
    im = Image.open(f"{name}.png").convert("RGB")
    w, h = im.size
    bands = panels(im)
    first, last = bands[0], bands[-1]
    body = im.crop((first[0], 0, first[1], h))
    body = body.crop(bbox(body))
    head_panel = im.crop((last[0], 0, last[1], h))
    if last[1] - last[0] > w * 0.35:               # merged panel: take its right part
        head_panel = head_panel.crop((int(head_panel.width * 0.55), 0, head_panel.width, h))
    hb = bbox(head_panel)
    head_panel = head_panel.crop(hb)
    side = min(head_panel.width, int(head_panel.height * 0.75))
    head = head_panel.crop(((head_panel.width - side) // 2, 0, (head_panel.width + side) // 2, side))
    c = Image.new("RGB", (CELL_W, HEAD_H + BODY_H + LABEL_H), BG)
    c.paste(fit(head, CELL_W - 2 * PAD, HEAD_H - PAD), (PAD, PAD // 2))
    c.paste(fit(body, CELL_W - 2 * PAD, BODY_H - PAD), (PAD, HEAD_H + PAD // 2))
    d = ImageDraw.Draw(c)
    f = ImageFont.truetype(FONT, 34)
    tw = d.textlength(label, font=f)
    d.text(((CELL_W - tw) / 2, HEAD_H + BODY_H + 8), label, font=f, fill=FG)
    return c


rows = (len(SHEETS) + COLS - 1) // COLS
ch = HEAD_H + BODY_H + LABEL_H
title_h = 120
sheet = Image.new("RGB", (COLS * CELL_W, title_h + rows * ch), BG)
d = ImageDraw.Draw(sheet)
f = ImageFont.truetype(FONT, 56)
d.text((PAD, 30), "CAFÉ CHERKI — CAST", font=f, fill=FG)
for i, (name, label, _) in enumerate(SHEETS):
    sheet.paste(cell(name, label), ((i % COLS) * CELL_W, title_h + (i // COLS) * ch))
sheet.save("cast.jpg", quality=90)
print("cast.jpg", sheet.size)
