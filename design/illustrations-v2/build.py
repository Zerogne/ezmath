#!/usr/bin/env python3
"""EzMath illustration set v2: high-school register.

Real teen proportions (~7.5 heads), no outlines, flat fills with one shade tone,
thin geometric construction lines and real math as the decorative layer.
Writes svg/<group>-<name>.svg and sheet.html (contact sheet)."""
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "svg")
os.makedirs(OUT, exist_ok=True)

INK = "#0B1030"
C = dict(
    blue="#2B4BE8", blued="#1E36B8", bluel="#8FA3FF", peri="#DDE3FF", peril="#EEF1FF",
    navy="#0B1030", slate="#3A4166", slatel="#6B7194", mist="#C9CCD8", fog="#E9EAF0",
    paper="#F6F4EF", white="#FFFFFF",
    coral="#FF6B57", corald="#D94A38", sand="#EADBC4", sandd="#D3BE9E",
    sage="#86B9A2", saged="#5F977F", mustard="#F2B740", mustardd="#D59A20",
    denim="#2E3A6E", denimd="#212A55", charcoal="#2B2D38", charcoald="#1D1F28",
)
SKIN = [("#F1CBA7", "#DDAE86"), ("#E2AA80", "#C98F66"), ("#C68A62", "#A86E49")]
HAIR = dict(black="#16182A", brown="#2E211C", grey="#5E6170")
FONT = "Inter, Onest, sans-serif"

def F(d, fill, extra=""): return f'<path d="{d}" fill="{fill}" {extra}/>'
def S(d, color, w, extra=""):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def circ(x, y, r, fill, extra=""): return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" {extra}/>'
def ell(x, y, rx, ry, fill, extra=""): return f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'
def rect(x, y, w, h, rx, fill, extra=""): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>'
def g(inner, x=0, y=0, s=1, rot=0, flip=False, extra=""):
    t = f"translate({x} {y})"
    if rot: t += f" rotate({rot})"
    if s != 1 or flip: t += f" scale({-s if flip else s} {s})"
    return f'<g transform="{t}" {extra}>{inner}</g>'
def text(x, y, s, size, fill=INK, weight=600, anchor="start", extra=""):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>'
def shadow(x, y, rx, ry=5): return ell(x, y, rx, ry, INK, 'opacity=".07"')
def pl(*pts): return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)

# =============================================================== people (240×480)
# Front view. Character's joints are in viewBox coords; x=120 is the body centre line.
SH = {"L": (93, 122), "R": (147, 122)}
HIP = {"L": (107, 238), "R": (133, 238)}

ARMS = {  # (elbow, wrist, hand) per side; hand: "open" | "fist" | "hidden" | "point" | "wave"
    "rest":     {"L": ((84, 182), (82, 236), "open"), "R": ((156, 182), (158, 236), "open")},
    "pockets":  {"L": ((82, 184), (102, 230), "hidden"), "R": ((158, 184), (138, 230), "hidden")},
    "hold":     {"L": ((86, 186), (106, 196), "open"), "R": ((154, 186), (134, 196), "open")},
    "phone":    {"L": ((88, 184), (112, 170), "open"), "R": ((152, 184), (128, 170), "open")},
    "think":    {"L": ((88, 186), (140, 196), "open"), "R": ((156, 178), (134, 116), "fist")},
    "wave":     {"L": ((84, 182), (82, 236), "open"), "R": ((180, 136), (196, 82), "wave")},
    "cheer":    {"L": ((70, 104), (64, 56), "fist"), "R": ((170, 104), (176, 56), "fist")},
    "point":    {"L": ((84, 182), (82, 236), "open"), "R": ((184, 144), (224, 124), "point")},
}

def arm(side, pose, sleeve, sleeve_d, skin, cuff=None, w=21):
    (e, wr, hand) = ARMS[pose][side]
    s = SH[side]
    out = S(pl(s, e, wr), sleeve, w)
    # inner-sleeve shade on the lower half
    out += S(pl(e, wr), sleeve_d, w * .35, 'opacity=".55"') if pose in ("rest", "wave", "point") and side == "L" else ""
    dx, dy = wr[0] - e[0], wr[1] - e[1]; n = math.hypot(dx, dy) or 1
    ux, uy = dx / n, dy / n
    if cuff:
        cx0, cy0 = wr[0] - ux * 4, wr[1] - uy * 4
        out += S(pl((cx0 - ux * 3, cy0 - uy * 3), (cx0 + ux * 3, cy0 + uy * 3)), cuff, w + 1, 'stroke-linecap="butt"')
    if hand == "hidden":
        return out
    hx, hy = wr[0] + ux * 9, wr[1] + uy * 9
    if hand == "open":
        out += ell(hx, hy, 7.5, 10, skin, f'transform="rotate({math.degrees(math.atan2(dy, dx)) - 90:.0f} {hx:.1f} {hy:.1f})"')
    elif hand == "fist":
        out += circ(hx, hy, 9.5, skin)
    elif hand == "wave":
        hx, hy = wr[0] + ux * 11, wr[1] + uy * 11
        a = math.degrees(math.atan2(dy, dx)) - 90
        out += g(ell(0, 0, 9, 12, skin) + F("M-9 -2 Q-16 -6 -14 -12 Q-10 -12 -6 -6 Z", skin), hx, hy, rot=a + 180)
    elif hand == "point":
        out += circ(hx, hy, 8.5, skin) + S(pl((hx, hy - 2), (hx + 15, hy - 6)), skin, 6)
    return out

def legs(style, pants, pants_d, shoe, sole):
    out = ""
    if style == "wide":   # wide-leg trousers
        out += F("M100 232 L140 232 L150 414 L124 416 L121 300 L119 300 L116 416 L90 414 Z", pants)
        out += F("M121 300 L124 416 L134 416 L126 300 Z", pants_d, 'opacity=".6"')
    else:
        lw = 25 if style == "slim" else 28
        out += S(pl((108, 236), (106, 326), (104, 410)), pants, lw) + S(pl((132, 236), (134, 326), (136, 410)), pants, lw)
        out += S(pl((112, 252), (112, 300)), pants_d, 2, 'opacity=".5"')
        if style == "cargo":
            out += rect(91, 286, 9, 18, 2, pants_d, 'opacity=".35"') + rect(140, 286, 9, 18, 2, pants_d, 'opacity=".35"')
        out += F("M95 232 L145 232 L146 250 L94 250 Z", pants)
    for sx, flip in ((104, 1), (136, -1)):
        o = (F("M-13 -8 Q-24 2 -20 14 L14 14 Q20 9 14 0 Q8 -6 7 -8 Z", shoe) + rect(-21, 12, 37, 6, 3, sole))
        out += g(o, sx - 2 * flip, 416, flip=(flip == -1))
    return out

def torso(top, col, cold, accent=None):
    out = ""
    if top == "hoodie":
        out += ell(120, 112, 26, 12, cold)  # hood behind the neck
        out += F("M92 116 Q120 108 148 116 Q158 122 158 140 Q160 196 152 236 Q120 246 88 236 Q80 196 82 140 Q82 122 92 116 Z", col)
        out += F("M86 222 Q120 232 154 222 L152 238 Q120 248 88 238 Z", cold)
        out += F("M104 182 L136 182 L140 214 L100 214 Z", cold, 'opacity=".55"')  # kangaroo pocket
        out += S("M113 120 L112 150", C["white"], 2) + S("M127 120 L128 150", C["white"], 2)
        out += F("M152 140 Q158 190 152 236 L144 236 Q150 190 148 140 Z", INK, 'opacity=".08"')
    elif top == "sweater":  # oversized knit with a white collar
        out += F("M90 118 Q120 110 150 118 Q160 126 160 144 Q162 200 154 240 Q120 250 86 240 Q78 200 80 144 Q80 126 90 118 Z", col)
        out += F("M104 114 L120 132 L136 114 Q128 120 120 120 Q112 120 104 114 Z", C["white"])
        out += F("M86 226 Q120 236 154 226 L154 240 Q120 250 86 240 Z", cold)
        for x in (104, 120, 136):
            out += S(f"M{x} 150 V220", cold, 1.5, 'opacity=".5"')
    elif top == "bomber":  # bomber jacket open over a tee
        out += F("M92 116 Q120 108 148 116 Q158 122 158 140 Q160 196 152 234 Q120 242 88 234 Q80 196 82 140 Q82 122 92 116 Z", col)
        out += F("M108 116 Q120 122 132 116 L130 232 L110 232 Z", accent or C["white"])
        out += S("M110 118 L110 232", cold, 3) + S("M130 118 L130 232", cold, 3)
        out += F("M86 224 Q120 234 154 224 L152 238 Q120 246 88 238 Z", cold)
        out += F("M106 112 Q120 120 134 112 L132 120 Q120 126 108 120 Z", cold)
        out += rect(138, 150, 10, 3, 1.5, C["mustard"])
    elif top == "tee":  # oversized graphic tee
        out += F("M90 116 Q120 110 150 116 Q162 124 164 150 L156 152 Q158 200 152 236 Q120 244 88 236 Q82 200 84 152 L76 150 Q78 124 90 116 Z", col)
        out += F("M110 114 Q120 122 130 114", cold)
        out += S("M110 114 Q120 124 130 114", cold, 3)
        out += circ(120, 172, 15, C["white"], 'opacity=".9"') + S("M112 176 Q120 160 128 176", col, 3) + S("M109 172 H131", col, 2)
    elif top == "shirt":  # teacher: shirt + open cardigan
        out += F("M92 116 Q120 108 148 116 Q158 122 158 140 Q160 196 154 240 Q120 248 86 240 Q80 196 82 140 Q82 122 92 116 Z", col)
        out += F("M110 116 L120 130 L130 116 L132 240 L108 240 Z", C["white"])
        out += F("M110 116 L120 130 L114 136 L106 120 Z", C["fog"]) + F("M130 116 L120 130 L126 136 L134 120 Z", C["fog"])
        out += F("M117 132 L123 132 L125 184 L120 192 L115 184 Z", accent or C["blue"])
        out += S("M108 124 L108 240", cold, 3) + S("M132 124 L132 240", cold, 3)
        out += rect(138, 196, 12, 14, 2, cold, 'opacity=".6"')
    return out

def back_hair(cfg):
    hair = cfg["hair"]; style = cfg["hairstyle"]
    out = ""
    if style == "long":
        out += F("M92 58 Q88 22 120 22 Q152 22 148 58 L154 150 Q138 158 120 156 Q102 158 86 150 Z", hair)
    elif style == "bob":
        out += F("M90 62 Q88 22 120 22 Q152 22 150 62 L152 98 Q146 104 138 100 L102 100 Q94 104 88 98 Z", hair)
    elif style == "pony":
        out += F("M140 44 Q166 56 158 110 Q150 132 146 140 Q140 112 144 88 Q146 64 134 52 Z", hair)
    return out

def head(cfg, expr):
    sk, skd = cfg["skin"]
    hair = cfg["hair"]; style = cfg["hairstyle"]
    out = ""
    # neck
    out += rect(111, 84, 18, 32, 6, sk) + F("M111 96 Q120 104 129 96 L129 104 Q120 110 111 104 Z", skd)
    # ears + face
    out += ell(96.5, 64, 4.5, 7.5, skd) + ell(143.5, 64, 4.5, 7.5, skd)
    out += F("M97 58 Q97 30 120 30 Q143 30 143 58 Q143 80 133 90 Q126 96 120 96 Q114 96 107 90 Q97 80 97 58 Z", sk)
    # features
    ey = 63
    look = cfg.get("look", (0, 0)) if expr != "think" else (2, -2)
    if expr in ("happy", "cheer"):
        out += S("M107.5 64 Q111 60 114.5 64", INK, 2.2) + S("M125.5 64 Q129 60 132.5 64", INK, 2.2)
    else:
        out += ell(111 + look[0], ey + look[1], 2.3, 2.9, INK) + ell(129 + look[0], ey + look[1], 2.3, 2.9, INK)
    by = 55 if expr != "think" else 53
    out += S(f"M106 {by+1} Q110.5 {by-1} 115 {by}", hair, 2.2) + S(f"M125 {by} Q129.5 {by-1 if expr != 'think' else by-3} 134 {by+1}", hair, 2.2)
    out += S("M120 66 Q122.5 73 119 75", skd, 2)
    if expr == "neutral":
        out += S("M115 83 Q120 85.5 125 83", INK, 2)
    elif expr == "smile":
        out += S("M113.5 82 Q120 87 126.5 82", INK, 2.2)
    elif expr == "happy":
        out += F("M112.5 81 Q120 92 127.5 81 Q120 83 112.5 81 Z", "#5B2330") + S("M112.5 81 Q120 83 127.5 81", C["white"], 1.6)
    elif expr == "cheer":
        out += F("M112 80 Q120 95 128 80 Q120 82 112 80 Z", "#5B2330") + F("M115.5 88 Q120 92 124.5 88 Q120 86 115.5 88 Z", C["coral"])
    elif expr == "think":
        out += S("M115 84 Q119 83 125 81", INK, 2)
    # beard (teacher)
    if cfg.get("beard"):
        out += F("M101 72 Q104 92 120 97 Q136 92 139 72 Q136 86 128 88 Q120 84 112 88 Q104 86 101 72 Z", cfg["beard"])
        out += F("M113 79 Q120 76 127 79 Q120 81 113 79 Z", cfg["beard"])
        out += S("M115 83.5 Q120 86 125 83.5", INK, 2)
    # front hair
    if style == "undercut":
        out += F("M96 60 Q92 24 120 20 Q148 18 146 52 Q144 46 140 44 Q132 34 114 36 Q102 40 99 52 Z", hair)
        out += F("M96 60 Q96 50 99 46 L99 60 Z", hair, 'opacity=".55"') + F("M144 60 Q144 50 141 46 L141 60 Z", hair, 'opacity=".55"')
        out += F("M116 22 Q138 18 146 36 Q136 26 120 28 Z", C["white"], 'opacity=".12"')
    elif style == "long":
        out += F("M96 64 Q92 26 122 24 Q148 26 145 62 Q140 44 126 36 Q114 46 96 64 Z", hair)
    elif style == "bob":
        out += F("M95 66 Q92 26 120 24 Q148 26 145 66 Q144 48 136 40 Q122 46 104 42 Q97 50 95 66 Z", hair)
    elif style == "pony":
        out += F("M96 60 Q94 24 120 24 Q146 24 144 60 Q142 42 130 36 Q112 34 104 42 Q98 48 96 60 Z", hair)
        out += rect(140, 44, 8, 9, 3, C["coral"], 'transform="rotate(30 144 48)"')
    elif style == "curly":
        for (x, y, r) in ((100, 50, 9), (106, 38, 10), (118, 32, 11), (131, 34, 10), (141, 44, 9), (144, 56, 6), (96, 60, 6), (112, 28, 8), (126, 26, 8)):
            out += circ(x, y, r, hair)
    elif style == "short":
        out += F("M97 58 Q94 28 120 26 Q146 28 143 58 Q142 44 136 40 Q120 42 104 38 Q99 44 97 58 Z", hair)
        out += F("M97 58 Q96 50 98 46 L100 58 Z", cfg.get("hair2", hair))
        out += F("M143 58 Q144 50 142 46 L140 58 Z", cfg.get("hair2", hair))
    if cfg.get("glasses"):
        gl = cfg["glasses"]
        out += rect(103, 57, 16, 12, 5, "none", f'stroke="{gl}" stroke-width="2"') + rect(121, 57, 16, 12, 5, "none", f'stroke="{gl}" stroke-width="2"')
        out += S("M119 62 Q120 60.5 121 62", gl, 2) + S("M103 61 L98 60", gl, 2) + S("M137 61 L142 60", gl, 2)
    return out

def person(cfg, pose, expr, prop=""):
    out = shadow(120, 434, 54, 6)
    out += back_hair(cfg)
    out += legs(cfg["legs"], cfg["pants"], cfg["pants_d"], cfg["shoe"], cfg["sole"])
    if cfg.get("bag") and pose not in ("cheer",):
        out += rect(146, 140, 20, 74, 7, cfg["bag"])  # backpack edge behind the shoulder
    out += torso(cfg["top"], cfg["col"], cfg["cold"], cfg.get("accent"))
    if cfg.get("headphones"):
        out += S("M100 112 Q120 132 140 112", C["charcoal"], 5) + ell(100, 112, 6, 8, C["charcoal"]) + ell(140, 112, 6, 8, C["charcoal"])
    if cfg.get("bag"):
        out += S("M100 118 Q96 160 98 200", cfg["bag"], 6) + S("M140 118 Q144 160 142 200", cfg["bag"], 6)
    out += head(cfg, expr)
    arms = arm("L", pose, cfg["col"], cfg["cold"], cfg["skin"][0], cfg.get("cuff")) + arm("R", pose, cfg["col"], cfg["cold"], cfg["skin"][0], cfg.get("cuff"))
    if pose in ("hold", "phone"):
        out += prop_back(prop) + arms + prop
    else:
        out += arms + prop
    return out

def prop_back(prop): return ""

# props in body coordinates
def p_laptop():
    return (g(F("M-34 -26 L34 -26 L30 6 L-30 6 Z", C["slatel"]) + F("M-30 -22 L30 -22 L27 2 L-27 2 Z", C["peri"]) +
              S("M-20 -4 Q-8 -18 4 -10 T24 -16", C["blue"], 2.4) + rect(-40, 6, 80, 6, 3, C["mist"]) + circ(0, -12, 2.5, C["white"]), 120, 186))
def p_book():
    return g(F("M-30 -20 L0 -16 L0 20 L-30 16 Z", C["white"]) + F("M30 -20 L0 -16 L0 20 L30 16 Z", C["fog"]) +
             F("M-32 -22 L-32 18 L0 22 L32 18 L32 -22 L0 -18 Z", C["coral"], 'opacity="0"') +
             S("M-24 -10 L-6 -8 M-24 -2 L-8 0 M-24 6 L-10 8", C["mist"], 2) + S("M6 -8 Q14 -18 22 -8", C["blue"], 2), 120, 192)
def p_phone():
    return g(rect(-9, -16, 18, 30, 4, C["charcoal"]) + rect(-7, -13, 14, 23, 2, C["bluel"]), 120, 166)
def p_tablet():
    return g(rect(-28, -20, 56, 38, 5, C["charcoal"]) + rect(-25, -17, 50, 32, 3, C["white"]) +
             text(0, 3, "x²−4", 11, C["blue"], 700, "middle"), 120, 186)
def p_pencil_think():
    return ""

CAST = {
    "temuulen": dict(label="Тэмүүлэн · ЭЕШ", skin=SKIN[1], hair=HAIR["black"], hairstyle="undercut", top="hoodie",
                     col=C["blue"], cold=C["blued"], legs="slim", pants=C["charcoal"], pants_d=C["charcoald"],
                     shoe="#EEF0F5", sole=C["slatel"], headphones=True),
    "saraa": dict(label="Сараа · SAT", skin=SKIN[0], hair=HAIR["brown"], hairstyle="long", top="sweater",
                  col=C["sand"], cold=C["sandd"], legs="wide", pants=C["denim"], pants_d=C["denimd"],
                  shoe=C["charcoal"], sole=C["white"]),
    "anujin": dict(label="Анужин · Онол", skin=SKIN[1], hair=HAIR["black"], hairstyle="bob", top="bomber",
                   col=C["sage"], cold=C["saged"], accent=C["white"], legs="slim", pants=C["denim"], pants_d=C["denimd"],
                   shoe="#EEF0F5", sole=C["coral"], glasses=C["navy"], bag=C["coral"]),
    "bat": dict(label="Бат · Дасгал", skin=SKIN[2], hair=HAIR["black"], hairstyle="curly", top="tee",
                col=C["coral"], cold=C["corald"], legs="cargo", pants=C["slate"], pants_d=C["navy"],
                shoe=C["mustard"], sole=C["white"]),
    "teacher": dict(label="Ганбаатар багш", skin=SKIN[1], hair=HAIR["grey"], hair2="#9A9DAA", hairstyle="short", top="shirt",
                    col=C["navy"], cold=C["slate"], accent=C["coral"], legs="slim", pants=C["slate"], pants_d=C["navy"],
                    shoe=C["charcoal"], sole=C["charcoald"], glasses=C["charcoal"], beard="#3E404D"),
}
POSES = {  # name: (arm pose, expression, prop)
    "stand": ("pockets", "smile", ""),
    "wave": ("wave", "happy", ""),
    "laptop": ("hold", "neutral", "laptop"),
    "study": ("hold", "smile", "book"),
    "think": ("think", "think", ""),
    "phone": ("phone", "smile", "phone"),
    "cheer": ("cheer", "cheer", ""),
    "point": ("point", "smile", ""),
}
PROPS = {"": lambda: "", "laptop": p_laptop, "book": p_book, "phone": p_phone, "tablet": p_tablet}

def svg(inner, w, h): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="none">{inner}</svg>'

def character(name, pose):
    cfg = CAST[name]; ap, ex, pr = POSES[pose]
    if name == "teacher" and pose == "laptop":
        pr = "tablet"
    return person(cfg, ap, ex, PROPS[pr]())

ASSETS = []  # (group, name, label, svg)
def add(group, name, label, inner, w, h): ASSETS.append((group, name, label, svg(inner, w, h), w, h))

def build_cast():
    for n in CAST:
        for p in POSES:
            add("cast", f"{n}-{p}", f"{CAST[n]['label']} / {p}", character(n, p), 240, 480)

# =============================================================== spot objects (160×160)
def card(x, y, w, h, rx=12, fill=None):
    return rect(x + 3, y + 5, w, h, rx, INK, 'opacity=".06"') + rect(x, y, w, h, rx, fill or C["white"])

def grid(x, y, w, h, step, color=C["fog"], sw=1):
    out = ""
    for i in range(0, w + 1, step): out += S(f"M{x+i} {y} V{y+h}", color, sw)
    for j in range(0, h + 1, step): out += S(f"M{x} {y+j} H{x+w}", color, sw)
    return out

def parabola(x0, y0, sx, sy, a=-2, b=2, n=40):
    pts = [(x0 + t * sx, y0 - (t * t) * sy) for t in [a + (b - a) * i / n for i in range(n + 1)]]
    return pl(*pts)

def o_graph():
    b = shadow(80, 146, 56) + card(20, 18, 120, 120)
    b += grid(32, 30, 96, 96, 12)
    b += S("M32 102 H128", C["mist"], 1.6) + S("M68 30 V126", C["mist"], 1.6)
    b += S(parabola(80, 108, 16, 3.2, -2.6, 2.6), C["blue"], 3)
    b += circ(80, 108, 4.5, C["coral"]) + circ(57.5, 91.8, 3.5, C["blue"]) + circ(102.5, 91.8, 3.5, C["blue"])
    b += rect(30, 28, 50, 18, 9, C["navy"]) + text(55, 41, "y = x²", 11, C["white"], 600, "middle")
    return b

def o_unitcircle():
    b = shadow(80, 146, 54)
    b += circ(80, 80, 56, C["peril"]) + S("M18 80 H142 M80 18 V142", C["mist"], 1.6)
    b += circ(80, 80, 46, "none", f'stroke="{C["blue"]}" stroke-width="3"')
    x, y = 80 + 46 * math.cos(math.radians(50)), 80 - 46 * math.sin(math.radians(50))
    b += F(f"M80 80 L100 80 A20 20 0 0 0 {80+20*math.cos(math.radians(50)):.1f} {80-20*math.sin(math.radians(50)):.1f} Z", C["mustard"], 'opacity=".7"')
    b += S(f"M80 80 L{x:.1f} {y:.1f}", C["navy"], 2.6) + S(f"M{x:.1f} {y:.1f} V80", C["coral"], 2.4, 'stroke-dasharray="4 4"')
    b += circ(x, y, 5, C["coral"]) + circ(80, 80, 3, C["navy"]) + text(104, 76, "θ", 12, C["navy"], 600)
    return b

def o_cube():
    b = shadow(80, 146, 50)
    b += F("M80 30 L126 54 L80 78 L34 54 Z", C["bluel"]) + F("M34 54 L80 78 L80 130 L34 106 Z", C["blue"]) + F("M126 54 L80 78 L80 130 L126 106 Z", C["blued"])
    b += S("M80 30 L80 82", C["white"], 1.4, 'stroke-dasharray="3 4" opacity=".7"')
    b += S("M34 54 L80 78 L126 54", C["white"], 1.4, 'opacity=".5"')
    b += text(28, 86, "a", 12, C["navy"], 600, "end") + text(132, 86, "a", 12, C["navy"], 600) + text(80, 24, "V = a³", 11, C["navy"], 600, "middle")
    return b

def o_calculator():
    b = shadow(80, 148, 40) + rect(42, 14, 76, 126, 12, C["charcoal"]) + rect(42, 14, 76, 126, 12, "none")
    b += rect(50, 24, 60, 26, 5, "#C9D6C4") + text(104, 43, "1.618", 14, C["charcoal"], 600, "end")
    keys = [C["slate"]] * 3 + [C["coral"]]
    for r in range(5):
        for c in range(4):
            col = C["coral"] if c == 3 and r < 4 else (C["blue"] if (r, c) == (4, 3) else (C["slatel"] if r == 0 else C["slate"]))
            b += rect(50 + c * 15, 58 + r * 15, 12, 10, 3, col)
    return b

def o_compass():
    b = shadow(80, 146, 46)
    b += S("M80 30 L52 130", C["slate"], 6) + S("M80 30 L108 130", C["slate"], 6)
    b += S("M52 130 L50 138", C["mist"], 3) + S("M108 130 L110 140", C["mustard"], 4)
    b += S("M64 88 L96 88", C["slatel"], 3)
    b += rect(72, 14, 16, 22, 4, C["navy"]) + circ(80, 34, 6, C["mustard"])
    b += S("M30 138 A60 60 0 0 1 130 138", C["blue"], 2, 'stroke-dasharray="3 5"')
    return b

def o_protractor():
    b = shadow(80, 132, 60)
    b += F("M16 120 A64 64 0 0 1 144 120 Z", C["peri"], 'opacity=".9"') + F("M50 120 A30 30 0 0 1 110 120 Z", C["white"])
    for a in range(0, 181, 10):
        r1 = 64; r2 = 56 if a % 30 else 50
        ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
        b += S(f"M{80+r1*ca:.1f} {120-r1*sa:.1f} L{80+r2*ca:.1f} {120-r2*sa:.1f}", C["blued"], 1.4)
    b += S("M16 120 H144", C["blued"], 2) + S("M80 120 L120 62", C["coral"], 2.4) + circ(80, 120, 3, C["coral"])
    b += text(80, 112, "55°", 10, C["blued"], 600, "middle")
    return b

def o_pencil():
    body = (rect(-50, -8, 74, 16, 1, C["mustard"]) + rect(-50, -8, 74, 5, 1, "#F7CB6B") + rect(-62, -8, 13, 16, 3, C["coral"]) + rect(-50, -8, 6, 16, 0, C["mist"])
            + F("M24 -8 L44 0 L24 8 Z", C["sand"]) + F("M37 -2.8 L44 0 L37 2.8 Z", C["charcoal"]))
    b = shadow(80, 140, 46) + g(body, 80, 80, rot=-35)
    b += S("M30 136 Q60 128 84 132 T132 126", C["blue"], 2.4)
    return b

def o_stopwatch():
    b = shadow(80, 148, 44) + rect(72, 12, 16, 12, 3, C["slate"]) + rect(106, 26, 12, 8, 3, C["slate"], 'transform="rotate(40 112 30)"')
    b += circ(80, 84, 54, C["navy"]) + circ(80, 84, 44, C["white"])
    b += F("M80 84 L80 40 A44 44 0 0 1 121 70 Z", C["peri"])
    for a in range(0, 360, 30):
        ca, sa = math.sin(math.radians(a)), -math.cos(math.radians(a))
        b += S(f"M{80+38*ca:.1f} {84+38*sa:.1f} L{80+(32 if a % 90 == 0 else 35)*ca:.1f} {84+(32 if a % 90 == 0 else 35)*sa:.1f}", C["slate"], 2)
    b += S("M80 84 L80 50", C["navy"], 3) + S("M80 84 L104 70", C["coral"], 3) + circ(80, 84, 4, C["navy"])
    return b

def o_trophy():
    b = shadow(80, 148, 40)
    b += S("M50 40 Q26 40 30 62 Q34 78 56 78", C["mustardd"], 6) + S("M110 40 Q134 40 130 62 Q126 78 104 78", C["mustardd"], 6)
    b += F("M46 28 H114 V56 Q114 94 80 96 Q46 94 46 56 Z", C["mustard"]) + F("M80 28 H114 V56 Q114 94 80 96 Z", C["mustardd"], 'opacity=".45"')
    b += rect(72, 94, 16, 18, 2, C["mustardd"]) + rect(52, 112, 56, 26, 4, C["navy"]) + rect(64, 120, 32, 8, 2, C["mustard"], 'opacity=".8"')
    b += text(80, 70, "1", 26, C["white"], 700, "middle", 'opacity=".9"')
    return b

def o_target():
    b = shadow(72, 148, 48)
    for r, col in ((56, C["navy"]), (42, C["white"]), (28, C["coral"]), (14, C["white"]), (6, C["coral"])):
        b += circ(72, 86, r, col)
    b += S("M74 84 L132 26", C["slate"], 3.5) + F("M128 22 L140 18 L136 30 L148 26 L140 38 L130 32 Z", C["mustard"])
    return b

def o_laptop():
    b = shadow(80, 140, 66)
    b += rect(26, 36, 108, 72, 8, C["charcoal"]) + rect(32, 42, 96, 60, 4, C["white"])
    b += rect(38, 48, 40, 6, 3, C["fog"]) + rect(38, 60, 26, 16, 3, C["peri"]) + rect(68, 60, 26, 16, 3, C["peri"]) + rect(98, 48, 24, 48, 3, C["peril"])
    b += S("M40 94 L52 86 L62 90 L76 80 L90 84", C["blue"], 2.2) + text(110, 76, "87%", 9, C["blue"], 700, "middle")
    b += F("M14 108 H146 Q146 118 136 118 H24 Q14 118 14 108 Z", C["mist"]) + rect(66, 108, 28, 4, 2, C["slatel"])
    return b

def o_notebook():
    b = shadow(80, 148, 44) + card(34, 16, 92, 122, 6)
    b += S("M34 16 V138", C["coral"], 0) + rect(34, 16, 10, 122, 3, C["navy"])
    for i in range(7): b += S(f"M52 {34+i*14} H118", C["fog"], 1.5)
    b += text(54, 44, "a² + b² = c²", 10, C["navy"], 600) + text(54, 72, "sin²α + cos²α = 1", 8.5, C["slate"], 500)
    b += text(54, 100, "∫ x dx = x²/2", 9, C["blue"], 600) + S("M54 118 H96", C["coral"], 2.2)
    return b

def o_chart():
    b = shadow(80, 146, 56) + card(20, 22, 120, 112)
    for i, (h, col) in enumerate(((28, C["peri"]), (40, C["peri"]), (36, C["bluel"]), (56, C["bluel"]), (74, C["blue"]))):
        b += rect(34 + i * 20, 118 - h, 12, h, 3, col)
    b += S("M30 118 H130", C["mist"], 1.5)
    b += S("M40 84 L60 72 L80 76 L100 56 L120 34", C["coral"], 2.6) + circ(120, 34, 4.5, C["coral"])
    return b

def o_bulb():
    b = shadow(80, 148, 26)
    b += circ(80, 64, 40, C["mustard"], 'opacity=".18"') + F("M80 30 Q108 30 110 58 Q110 76 96 88 L94 102 H66 L64 88 Q50 76 50 58 Q52 30 80 30 Z", C["mustard"])
    b += F("M80 30 Q108 30 110 58 Q110 76 96 88 L94 102 H80 Z", C["mustardd"], 'opacity=".35"')
    b += S("M72 100 V80 L80 72 L88 80 V100", C["white"], 2.2, 'opacity=".9"')
    b += rect(66, 102, 28, 8, 2, C["slate"]) + rect(68, 112, 24, 8, 2, C["slatel"]) + rect(74, 122, 12, 6, 3, C["slate"])
    for a in (-70, -35, 0, 35, 70):
        ca, sa = math.sin(math.radians(a)), -math.cos(math.radians(a))
        b += S(f"M{80+48*ca:.1f} {62+48*sa:.1f} L{80+58*ca:.1f} {62+58*sa:.1f}", C["mustardd"], 3)
    return b

def o_flame():
    b = shadow(80, 146, 34)
    b += F("M80 14 Q92 44 116 64 Q130 82 126 104 Q120 136 80 138 Q40 136 34 104 Q30 78 52 60 Q56 80 66 84 Q60 46 80 14 Z", C["coral"])
    b += F("M80 14 Q92 44 116 64 Q130 82 126 104 Q120 136 80 138 Z", C["corald"], 'opacity=".4"')
    b += F("M80 70 Q96 92 98 108 Q98 128 80 130 Q62 128 62 110 Q64 94 80 70 Z", C["mustard"])
    b += text(80, 122, "7", 22, C["navy"], 800, "middle")
    return b

def o_gradcap():
    b = shadow(80, 140, 50)
    b += F("M44 70 V100 Q80 120 116 100 V70 Z", C["navy"]) + F("M80 70 H116 V100 Q98 110 80 112 Z", INK, 'opacity=".25"')
    b += F("M80 34 L146 62 L80 90 L14 62 Z", C["slate"]) + F("M80 34 L146 62 L80 90 Z", C["navy"], 'opacity=".35"')
    b += S("M80 62 L126 76 V108", C["mustard"], 2.5) + F("M120 106 H132 L134 122 H118 Z", C["mustard"]) + circ(80, 62, 4, C["mustard"])
    return b

def o_scorecard():
    b = shadow(80, 146, 54) + card(22, 20, 116, 116)
    b += text(36, 44, "SAT Math", 11, C["slatel"], 600) + text(36, 82, "780", 34, C["navy"], 800) + text(104, 82, "/800", 11, C["slatel"], 600)
    b += rect(36, 96, 88, 8, 4, C["fog"]) + rect(36, 96, 84, 8, 4, C["blue"])
    b += rect(36, 112, 54, 14, 7, C["peri"]) + text(63, 122.5, "+120", 9.5, C["blue"], 700, "middle")
    return b

def o_calendar():
    b = shadow(80, 146, 54) + card(22, 26, 116, 110) + F("M22 38 Q22 26 34 26 H126 Q138 26 138 38 V50 H22 Z", C["blue"])
    b += rect(46, 18, 6, 16, 3, C["navy"]) + rect(108, 18, 6, 16, 3, C["navy"])
    for i in range(14):
        r, c = divmod(i, 5)
        x, y = 34 + c * 20, 60 + r * 22
        done = i < 11
        b += rect(x, y, 14, 14, 4, C["blue"] if done else C["fog"])
        if done: b += S(f"M{x+3.5} {y+7.5} L{x+6} {y+10} L{x+10.5} {y+4.5}", C["white"], 1.8)
    return b

def o_ger():
    b = shadow(80, 138, 64)
    b += F("M24 84 H136 V130 H24 Z", C["white"]) + F("M80 84 H136 V130 H80 Z", C["fog"])
    b += rect(24, 96, 112, 6, 0, C["coral"]) + rect(68, 102, 24, 28, 2, C["coral"]) + rect(72, 106, 16, 20, 1, C["corald"])
    b += F("M16 86 Q40 48 80 40 Q120 48 144 86 Z", C["sand"]) + F("M80 40 Q120 48 144 86 H80 Z", C["sandd"], 'opacity=".6"')
    b += F("M66 44 Q80 36 94 44 L90 40 Q80 34 70 40 Z", C["navy"]) + rect(72, 32, 16, 10, 3, C["navy"])
    b += S("M26 74 Q80 60 134 74", C["coral"], 2.5)
    return b

def o_summit():
    b = shadow(80, 140, 66)
    b += F("M10 134 L64 52 L94 96 L112 74 L150 134 Z", C["slate"]) + F("M64 52 L94 96 L82 134 L150 134 L112 74 L94 96 Z", C["navy"], 'opacity=".45"')
    b += F("M64 52 L76 70 L68 66 L60 74 L54 66 Z", C["white"])
    b += S("M64 52 V20", C["navy"], 2.5) + F("M64 20 L88 27 L64 34 Z", C["coral"])
    b += S("M20 128 Q40 110 52 116 T84 98", C["mustard"], 2, 'stroke-dasharray="3 4"')
    return b

OBJECTS = [("graph", "Graph card"), ("unitcircle", "Unit circle"), ("cube", "Cube"), ("calculator", "Calculator"), ("compass", "Compass"),
           ("protractor", "Protractor"), ("pencil", "Pencil"), ("stopwatch", "Stopwatch"), ("trophy", "Trophy"), ("target", "Target"),
           ("laptop", "Laptop"), ("notebook", "Notebook"), ("chart", "Progress chart"), ("bulb", "Idea"), ("flame", "Streak"),
           ("gradcap", "Graduation"), ("scorecard", "Score card"), ("calendar", "Calendar"), ("ger", "Ger"), ("summit", "Goal")]

def build_objects():
    for k, label in OBJECTS:
        add("object", k, label, globals()["o_" + k](), 160, 160)

# =============================================================== scenes (640×400)
def char_at(name, pose, x, y, h=300, flip=False):
    s = h / 480
    return g(character(name, pose), x - (240 * s if flip else 0), y, s, flip=flip) if not flip else g(character(name, pose), x + 240 * s, y, s, flip=True)

def obj_at(k, x, y, size=100, rot=0):
    return g(globals()["o_" + k](), x, y, size / 160, rot)

def chip(x, y, label, fill=C["navy"], color=C["white"], w=None, size=13):
    w = w or (len(label) * size * .58 + 28)
    return rect(x + 2, y + 4, w, 32, 16, INK, 'opacity=".06"') + rect(x, y, w, 32, 16, fill) + text(x + w / 2, y + 21, label, size, color, 600, "middle")

def backdrop(color=C["peril"], gridc=C["peri"]):
    return rect(24, 24, 592, 352, 28, color) + grid(48, 48, 544, 304, 32, gridc, 1)

def sc_hero():
    b = backdrop()
    b += circ(470, 190, 120, "none", f'stroke="{C["bluel"]}" stroke-width="1.5" stroke-dasharray="4 6"')
    b += char_at("temuulen", "laptop", 200, 62, 320)
    b += g(o_graph(), 360, 70, .9) + g(o_scorecard(), 470, 190, .8)
    b += chip(64, 84, "f(x) = x² − 4x + 3") + chip(78, 286, "∠A = 60°", C["white"], C["navy"])
    return b

def sc_lesson():
    b = backdrop(C["paper"], C["fog"])
    b += rect(250, 60, 320, 200, 10, C["navy"]) + rect(250, 260, 320, 8, 4, C["slate"])
    b += F("M300 220 L300 110 L420 220 Z", "none", f'stroke="{C["white"]}" stroke-width="2.5" stroke-linejoin="round"')
    b += S("M300 206 H314 V220", C["white"], 2) + text(286, 170, "a", 16, C["mustard"], 600) + text(360, 240, "b", 16, C["mustard"], 600) + text(368, 158, "c", 16, C["mustard"], 600)
    b += text(450, 140, "a² + b² = c²", 22, C["white"], 600, "middle") + text(450, 176, "c = √(a² + b²)", 15, C["bluel"], 500, "middle")
    b += char_at("teacher", "point", 110, 40, 340)
    b += char_at("anujin", "study", 470, 150, 230, flip=True)
    return b

def sc_results():
    b = backdrop(C["peril"], C["peri"])
    for (x, y, r, col) in ((150, 70, 20, C["mustard"]), (500, 60, 16, C["coral"]), (560, 150, 14, C["blue"]), (90, 170, 12, C["blue"]), (420, 40, 10, C["sage"])):
        b += rect(x, y, 6, r, 2, col, f'transform="rotate({x % 50 - 25} {x} {y})"')
    b += char_at("saraa", "cheer", 120, 50, 330)
    b += g(o_scorecard(), 330, 80, 1.35) + g(o_trophy(), 470, 250, .7)
    return b

def sc_streak():
    b = backdrop(C["paper"], C["fog"])
    b += char_at("bat", "phone", 110, 54, 320)
    b += g(o_calendar(), 300, 70, 1.4) + g(o_flame(), 480, 200, .9)
    b += chip(300, 300, "11 өдөр дараалан", C["navy"])
    return b

def sc_empty():
    b = backdrop(C["paper"], C["fog"])
    b += rect(300, 90, 240, 170, 16, "none", f'stroke="{C["mist"]}" stroke-width="2" stroke-dasharray="8 8"')
    b += rect(330, 130, 120, 12, 6, C["fog"]) + rect(330, 154, 180, 12, 6, C["fog"]) + rect(330, 178, 150, 12, 6, C["fog"])
    b += circ(500, 120, 16, C["peri"]) + text(500, 126, "?", 18, C["blue"], 700, "middle")
    b += char_at("anujin", "think", 120, 54, 320)
    b += text(420, 300, "Энд одоогоор хоосон байна", 15, C["slatel"], 600, "middle")
    return b

def sc_404():
    b = backdrop(C["peril"], C["peri"])
    b += text(372, 216, "4", 130, C["navy"], 800, "middle") + text(568, 216, "4", 130, C["navy"], 800, "middle")
    b += circ(470, 170, 42, C["coral"])
    b += S("M428 170 H512 M470 128 V212", C["white"], 1.6, 'opacity=".7"') + text(470, 250, "x ∉ ℝ", 16, C["slate"], 600, "middle")
    b += char_at("temuulen", "think", 70, 54, 320)
    return b

def sc_group():
    b = rect(24, 236, 592, 140, 28, C["peril"]) + grid(48, 260, 544, 96, 32, C["peri"])
    xs = [("bat", "wave", 30), ("saraa", "stand", 130), ("teacher", "stand", 230), ("temuulen", "phone", 330), ("anujin", "study", 430)]
    for n, p, x in xs:
        b += char_at(n, p, x + 20, 40, 330)
    return b

SCENES = [("hero", "Hero · ЭЕШ бэлтгэл"), ("lesson", "Онол · хичээл"), ("results", "Үр дүн"), ("streak", "Цуврал / Streak"),
          ("empty", "Хоосон төлөв"), ("404", "404"), ("group", "Баг · бүх дүр")]

def build_scenes():
    for k, label in SCENES:
        add("scene", k, label, globals()["sc_" + k](), 640, 400)

# =============================================================== motifs (decorative layer for sections)
def m_grid():
    return rect(0, 0, 320, 200, 20, C["peril"]) + grid(10, 10, 300, 180, 20, C["peri"]) + S(parabola(160, 170, 30, 9, -2.2, 2.2), C["blue"], 2.5)
def m_construct():
    b = circ(160, 100, 70, "none", f'stroke="{C["blue"]}" stroke-width="1.5"') + circ(160, 100, 40, "none", f'stroke="{C["bluel"]}" stroke-width="1.5" stroke-dasharray="3 5"')
    b += S("M60 170 L260 30", C["navy"], 1.5) + S("M90 30 L230 170", C["mist"], 1.5, 'stroke-dasharray="4 4"') + circ(160, 100, 4, C["coral"])
    return b
def m_chips():
    return chip(10, 20, "∑ n = n(n+1)/2") + chip(150, 70, "sin 30° = ½", C["white"], C["navy"]) + chip(30, 120, "log₂ 8 = 3", C["blue"]) + chip(170, 150, "π ≈ 3.14", C["mustard"], C["navy"])
MOTIFS = [("grid", "Graph-paper panel"), ("construct", "Construction lines"), ("chips", "Formula chips")]
def build_motifs():
    for k, label in MOTIFS:
        add("motif", k, label, globals()["m_" + k](), 320, 200)

def write(groups):
    for grp, name, label, s, w, h in ASSETS:
        open(os.path.join(OUT, f"{grp}-{name}.svg"), "w").write(s)
    cells = "".join(f'<figure><div class="art {grp}">{s}</div><figcaption>{label}</figcaption></figure>' for grp, name, label, s, w, h in ASSETS if grp in groups)
    css = ("body{margin:0;padding:32px;background:#F6F4EF;font:12px Inter,sans-serif;color:#0B1030}"
           ".grid{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;background:#fff;border-radius:12px;padding:12px}"
           ".art svg{display:block;height:auto}.cast svg{width:150px}.object svg{width:140px}.scene svg{width:520px}.motif svg{width:260px}"
           "figcaption{margin-top:6px;color:#6B7194}")
    open(os.path.join(HERE, "sheet.html"), "w").write(f"<!doctype html><meta charset=utf-8><style>{css}</style><div class=grid>{cells}</div>")

if __name__ == "__main__":
    import sys
    groups = sys.argv[1:] or ["cast", "object", "scene", "motif"]
    if "cast" in groups: build_cast()
    for fn in ("build_objects", "build_scenes", "build_motifs"):
        if fn in globals() and fn.split("_")[1][:-1] in groups: globals()[fn]()
    write(groups)
    print(len(ASSETS), "assets")
