#!/usr/bin/env python3
"""EzMath illustration set: cast, mascot poses, math buddies, spot objects, scenes.
Writes svg/<group>-<name>.svg, sheet.html (contact sheet) and figma.html (one block per asset)."""
import math, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "svg")
os.makedirs(OUT, exist_ok=True)

INK = "#0B1030"; SW = 3.5
C = dict(blue="#2B4BE8", blue2="#5B7BFF", blued="#2440C8", sky="#DCE4FF", purple="#7C4DEB", purpled="#6237CF",
         lilac="#EFE6FF", sun="#FFC94D", sund="#F2A922", cream="#FFF3D6", mint="#35C08A", mintd="#239A6C",
         mintl="#D7F5E6", pink="#FF9DB5", pinkl="#FFE1EA", coral="#FF6B57", corald="#E04E3B", white="#FFFFFF",
         paper="#FFFDF7", hair="#1F2340", denim="#2A3160")
SKIN = ["#F8D2AE", "#EDB98E", "#D9A077"]

_n = [0]
def uid(p="c"):
    _n[0] += 1
    return f"{p}{_n[0]}"

def st(fill, w=SW, extra=""):
    return f'fill="{fill}" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"' + (f" {extra}" if extra else "")
def P(d, fill, w=SW, extra=""): return f'<path d="{d}" {st(fill, w, extra)}/>'
def F(d, fill, extra=""): return f'<path d="{d}" fill="{fill}" {extra}/>'
def L(d, color=INK, w=SW, extra=""):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def circ(x, y, r, fill, w=SW, extra=""): return f'<circle cx="{x}" cy="{y}" r="{r}" {st(fill, w, extra)}/>'
def ell(x, y, rx, ry, fill, w=SW, extra=""): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" {st(fill, w, extra)}/>'
def dot(x, y, r, fill, extra=""): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" {extra}/>'
def rect(x, y, w, h, rx, fill, sw=SW, extra=""): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" {st(fill, sw, extra)}/>'
def g(inner, x=0, y=0, s=1, rot=0, flip=False, extra=""):
    t = f"translate({x} {y})"
    if rot: t += f" rotate({rot})"
    if s != 1 or flip: t += f" scale({-s if flip else s} {s})"
    return f'<g transform="{t}" {extra}>{inner}</g>'
def tube(d, color, w=14):
    return L(d, INK, w + 2 * SW) + L(d, color, w)
def text(x, y, s, size, fill=INK, weight=700, anchor="middle", family="Onest, Inter, sans-serif"):
    return f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{s}</text>'

def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
def qd(p0, c, p1): return f"M{p0[0]:.1f} {p0[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {p1[0]:.1f} {p1[1]:.1f}"
def qsplit(p0, c, p1, t):
    a = lerp(p0, c, t); b = lerp(c, p1, t); return p0, a, lerp(a, b, t)
def beyond(c, p1, k):
    dx, dy = p1[0] - c[0], p1[1] - c[1]; n = math.hypot(dx, dy) or 1
    return (p1[0] + dx / n * k, p1[1] + dy / n * k)

def spark(x, y, r, fill=None, w=2.5):
    k = r * 0.16
    d = (f"M{x} {y-r} Q{x+k} {y-k} {x+r} {y} Q{x+k} {y+k} {x} {y+r} Q{x-k} {y+k} {x-r} {y} Q{x-k} {y-k} {x} {y-r} Z")
    return P(d, fill or C["sun"], w)
def confetti(items):
    out = ""
    for x, y, r, col in items:
        out += g(f'<rect x="-3.5" y="-7" width="7" height="14" rx="2.5" {st(col, 2.2)}/>', x, y, rot=r)
    return out
def motion(x, y, s=1, rot=0):
    return g(L("M0 -10 Q8 0 0 10", INK, 3) + L("M9 -16 Q21 0 9 16", INK, 3), x, y, s, rot)
def shadow(x, y, rx, ry=6): return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{INK}" opacity=".08"/>'

# ---------------------------------------------------------------- faces
def eyes(cx, y, dx, rx, ry, kind="open", gaze=(0, 0), whites=False):
    out = ""
    for s in (-1, 1):
        x = cx + s * dx
        k = kind if not (kind == "wink" and s == 1) else "happy"
        if k == "open":
            if whites:
                out += ell(x, y, rx * 1.55, ry * 1.4, C["white"], 3)
                px, py = x + gaze[0], y + gaze[1]
                out += f'<ellipse cx="{px}" cy="{py}" rx="{rx}" ry="{ry}" fill="{INK}"/>'
                out += dot(px + rx * .35, py - ry * .4, rx * .36, "#fff")
            else:
                out += f'<ellipse cx="{x+gaze[0]}" cy="{y+gaze[1]}" rx="{rx}" ry="{ry}" fill="{INK}"/>'
                out += dot(x + gaze[0] + rx * .35, y + gaze[1] - ry * .4, rx * .38, "#fff")
        elif k == "happy":
            out += L(f"M{x-rx*1.35} {y+2} Q{x} {y-ry*1.5} {x+rx*1.35} {y+2}", INK, 3.2)
        elif k == "sleep":
            out += L(f"M{x-rx*1.35} {y-1} Q{x} {y+ry*1.1} {x+rx*1.35} {y-1}", INK, 3.2)
    return out

def mouth(cx, y, w, kind="smile"):
    if kind == "smile": return L(f"M{cx-w} {y} Q{cx} {y+w*.95} {cx+w} {y}", INK, 3.2)
    if kind == "grin":
        return (P(f"M{cx-w*1.2} {y-1} Q{cx} {y+w*2.1} {cx+w*1.2} {y-1} Z", INK, 2.5)
                + f'<ellipse cx="{cx}" cy="{y+w*.68}" rx="{w*.55}" ry="{w*.3}" fill="{C["coral"]}"/>')
    if kind == "o": return f'<ellipse cx="{cx}" cy="{y+3}" rx="{w*.42}" ry="{w*.55}" fill="{INK}"/>'
    if kind == "flat": return L(f"M{cx-w*.7} {y+2} Q{cx-w*.1} {y-1} {cx+w*.7} {y+1}", INK, 3.2)
    if kind == "worried": return L(f"M{cx-w*.9} {y+4} Q{cx} {y-2} {cx+w*.9} {y+4}", INK, 3.2)
    if kind == "small": return L(f"M{cx-w*.5} {y} Q{cx} {y+w*.5} {cx+w*.5} {y}", INK, 3)
    return ""

def blush(cx, y, dx, rx=6.5, ry=4):
    return "".join(f'<ellipse cx="{cx+s*dx}" cy="{y}" rx="{rx}" ry="{ry}" fill="{C["pink"]}" opacity=".6"/>' for s in (-1, 1))

# ---------------------------------------------------------------- spot objects (120×120)
def obj_books():
    b = shadow(60, 104, 46)
    b += rect(14, 76, 92, 22, 5, C["blue2"]) + rect(92, 79, 10, 16, 3, C["paper"], 2.5) + L("M24 82 V92", C["white"], 3)
    b += g(rect(-42, -10, 84, 20, 5, C["sun"]) + rect(28, -7, 10, 14, 3, C["paper"], 2.5) + L("M-32 -4 V4", C["white"], 3), 58, 64, rot=-4)
    b += g(rect(-38, -10, 76, 20, 5, C["coral"]) + rect(24, -7, 10, 14, 3, C["paper"], 2.5) + L("M-28 -4 V4", C["white"], 3), 62, 44, rot=3)
    b += P("M62 34 C56 26 58 16 66 14 C68 22 66 30 62 34 Z", C["mint"], 2.8)
    return b

def obj_pencil():
    body = (rect(-46, -9, 66, 18, 2, C["sun"]) + L("M-46 -3 H20", C["sund"], 2.5) + L("M-46 3 H20", C["sund"], 2.5)
            + rect(-58, -9, 14, 18, 6, C["pink"]) + rect(-48, -9, 6, 18, 1, C["sky"], 2.5)
            + P("M20 -9 L40 0 L20 9 Z", C["cream"]) + P("M32 -3.6 L40 0 L32 3.6 Z", INK, 2))
    return shadow(60, 104, 36) + g(body, 62, 58, rot=-35) + spark(98, 88, 8)

def obj_calculator():
    b = shadow(60, 108, 36) + rect(26, 12, 68, 92, 14, C["blue2"]) + rect(35, 22, 50, 22, 6, C["sky"], 3)
    b += text(78, 39, "3.14", 14, INK, 700, "end")
    cols = [C["white"], C["white"], C["coral"]]
    for r in range(3):
        for c in range(3):
            b += rect(35 + c * 18, 52 + r * 16, 14, 11, 4, cols[c] if r < 2 else (C["sun"] if c == 2 else C["white"]), 2.5)
    return b

def obj_trophy():
    b = shadow(60, 108, 34)
    b += L("M34 34 C16 34 18 62 40 60", INK, 9) + L("M34 34 C16 34 18 62 40 60", C["sun"], 3)
    b += L("M86 34 C104 34 102 62 80 60", INK, 9) + L("M86 34 C104 34 102 62 80 60", C["sun"], 3)
    b += P("M32 22 H88 V40 C88 60 76 72 60 72 C44 72 32 60 32 40 Z", C["sun"])
    b += F("M40 28 V40 C40 50 44 56 50 60", "none", f'stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"')
    b += rect(52, 70, 16, 14, 3, C["sund"]) + rect(36, 84, 48, 18, 6, C["blue2"]) + rect(46, 89, 28, 8, 3, C["white"], 2)
    b += spark(60, 44, 10, C["white"], 2.5)
    return b

def obj_timer():
    b = shadow(60, 108, 36) + rect(52, 10, 16, 12, 4, C["coral"]) + L("M86 26 L94 18", INK, 8) + L("M86 26 L94 18", C["coral"], 3)
    b += circ(60, 62, 40, C["coral"]) + circ(60, 62, 30, C["white"], 3)
    b += F("M60 62 L60 32 A30 30 0 0 1 86 47 Z", C["sky"])
    for a in range(0, 360, 90):
        x1 = 60 + 24 * math.sin(math.radians(a)); y1 = 62 - 24 * math.cos(math.radians(a))
        x2 = 60 + 28 * math.sin(math.radians(a)); y2 = 62 - 28 * math.cos(math.radians(a))
        b += L(f"M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}", INK, 3)
    b += L("M60 62 L60 42", INK, 4) + L("M60 62 L74 70", INK, 4) + dot(60, 62, 4, INK)
    return b

def obj_target():
    b = shadow(56, 108, 38) + circ(56, 62, 42, C["coral"]) + circ(56, 62, 29, C["white"], 3) + circ(56, 62, 16, C["coral"], 3) + circ(56, 62, 5, C["white"], 2.5)
    b += L("M58 60 L100 22", INK, 4.5)
    b += P("M96 26 L92 12 L104 14 L110 4 L114 18 L100 22 Z", C["sun"], 2.8)
    return b

def obj_bulb():
    b = shadow(60, 110, 26)
    for a in (-60, -30, 0, 30, 60):
        r = math.radians(a)
        b += L(f"M{60+44*math.sin(r):.1f} {50-44*math.cos(r):.1f} L{60+54*math.sin(r):.1f} {50-54*math.cos(r):.1f}", C["sund"], 4)
    b += P("M60 16 C80 16 92 32 92 48 C92 62 82 68 78 78 H42 C38 68 28 62 28 48 C28 32 40 16 60 16 Z", C["sun"])
    b += L("M44 30 C40 34 38 40 38 46", "#fff", 4, 'opacity=".8"')
    b += L("M52 78 V62 L60 54 L68 62 V78", INK, 3)
    b += rect(42, 78, 36, 10, 4, C["sky"], 3) + rect(44, 88, 32, 10, 4, C["sky"], 3) + P("M50 98 H70 C70 104 66 106 60 106 C54 106 50 104 50 98 Z", C["blue2"], 3)
    return b

def obj_rocket():
    body = (P("M-10 30 C-22 34 -26 46 -26 54 L-12 44 Z", C["coral"]) + P("M10 30 C22 34 26 46 26 54 L12 44 Z", C["coral"])
            + P("M-8 46 C-6 58 0 66 0 66 C0 66 6 58 8 46 Z", C["sun"], 3)
            + P("M0 -48 C18 -34 20 -6 14 44 H-14 C-20 -6 -18 -34 0 -48 Z", C["white"])
            + P("M0 -48 C8 -42 13 -34 15 -26 H-15 C-13 -34 -8 -42 0 -48 Z", C["coral"], 3)
            + circ(0, -4, 9, C["sky"], 3) + dot(3, -7, 2.5, "#fff") + L("M0 22 V40", INK, 3))
    return shadow(60, 110, 24) + g(body, 60, 56, rot=30) + spark(22, 30, 7) + spark(98, 96, 6, C["sky"])

def obj_medal():
    b = P("M36 8 H54 L68 46 H50 Z", C["blue2"]) + P("M84 8 H66 L52 46 H70 Z", C["coral"])
    b += circ(60, 72, 30, C["sun"]) + circ(60, 72, 21, C["sund"], 2.5)
    b += P("M60 58 L64.5 67 L74 68.2 L67 75 L69 84.5 L60 80 L51 84.5 L53 75 L46 68.2 L55.5 67 Z", C["white"], 2.5)
    return shadow(60, 110, 26) + b

def obj_flame():
    b = shadow(60, 108, 32)
    b += P("M60 8 C66 26 90 38 92 66 C94 90 78 104 60 104 C40 104 26 90 28 68 C30 50 42 44 44 30 C52 38 54 46 52 54 C60 46 62 26 60 8 Z", C["coral"])
    b += P("M60 50 C64 62 76 70 76 84 C76 96 68 102 60 102 C50 102 44 96 44 86 C44 74 54 70 54 60 C58 66 60 70 60 74 C64 68 62 58 60 50 Z", C["sun"], 3)
    return b

def obj_chart():
    b = shadow(60, 110, 40) + g(rect(-42, -48, 84, 96, 10, C["white"]), 60, 58, rot=-4)
    inner = (L("M-30 30 H32", INK, 3) + rect(-26, 6, 12, 24, 3, C["sky"], 3) + rect(-8, -6, 12, 36, 3, C["blue2"], 3)
             + rect(10, -22, 12, 52, 3, C["sun"], 3) + L("M-28 -8 L-6 -22 L6 -16 L26 -36", C["coral"], 4) + P("M18 -38 L28 -38 L28 -28", "none", 4))
    b += g(inner, 60, 58, rot=-4)
    return b

def obj_gradcap():
    b = shadow(60, 106, 38)
    b += P("M30 54 V76 C30 86 44 92 60 92 C76 92 90 86 90 76 V54 Z", C["blued"])
    b += P("M60 22 L108 44 L60 66 L12 44 Z", C["blue2"])
    b += L("M60 44 L94 54 V80", INK, 3) + P("M89 78 H99 L101 92 H87 Z", C["sun"], 2.8) + circ(60, 44, 4, C["sun"], 2.5)
    return b

def obj_ger():
    b = shadow(60, 106, 50)
    b += P("M14 62 H106 V100 H14 Z", C["white"])
    b += L("M14 74 H106", C["coral"], 4) + L("M14 74 H106", INK, 0)
    b += P("M10 62 C20 42 40 30 60 28 C80 30 100 42 110 62 Z", C["cream"])
    b += P("M48 30 C52 26 56 25 60 25 C64 25 68 26 72 30 Z", C["coral"], 3)
    b += L("M24 50 C40 46 80 46 96 50", C["coral"], 3.5)
    b += P("M50 100 V80 C50 74 54 72 60 72 C66 72 70 74 70 80 V100 Z", C["coral"])
    b += L("M60 74 V100", INK, 2.5) + L("M32 84 H40 M80 84 H88", C["blue2"], 4)
    return b

def obj_mountain():
    b = shadow(60, 108, 50)
    b += P("M8 102 L44 46 L62 70 L76 54 L112 102 Z", C["mint"])
    b += P("M44 46 L54 62 L48 60 L42 66 L36 58 Z", C["white"], 2.8) + P("M76 54 L84 66 L78 64 L74 68 L70 62 Z", C["white"], 2.8)
    b += L("M44 46 V12", INK, 3.5) + P("M44 12 H72 L64 20 L72 28 H44 Z", C["coral"], 3)
    return b

def obj_setsquare():
    b = shadow(60, 108, 46)
    b += g(rect(-48, -11, 96, 22, 4, C["sun"]) + "".join(L(f"M{x} -11 V{-3 if x % 16 else 1}", INK, 2.5) for x in range(-40, 44, 8)), 60, 86, rot=-8)
    b += P("M20 16 L20 80 L84 80 Z", C["lilac"]) + P("M32 44 L32 68 L56 68 Z", C["white"], 2.8)
    b += L("M20 70 H30 V80", INK, 2.5)
    return b

def obj_notebook():
    b = shadow(60, 108, 40) + g(rect(-38, -46, 76, 92, 8, C["white"]), 60, 58, rot=5)
    inner = ("".join(circ(-38, y, 4, C["sky"], 2.5) for y in (-34, -18, -2, 14, 30))
             + text(2, -14, "x²+1", 18, C["blue"], 700) + L("M-22 4 H24", INK, 3, 'opacity=".25"') + L("M-22 16 H14", INK, 3, 'opacity=".25"')
             + L("M-22 28 H20", INK, 3, 'opacity=".25"') + circ(20, 26, 9, "none", 3, f'stroke="{C["coral"]}"'))
    b += g(inner, 60, 58, rot=5)
    return b

OBJECTS = dict(books=obj_books, pencil=obj_pencil, calculator=obj_calculator, trophy=obj_trophy, timer=obj_timer,
               target=obj_target, bulb=obj_bulb, rocket=obj_rocket, medal=obj_medal, flame=obj_flame, chart=obj_chart,
               gradcap=obj_gradcap, ger=obj_ger, mountain=obj_mountain, setsquare=obj_setsquare, notebook=obj_notebook)

# ---------------------------------------------------------------- Эзи mascot (160×160)
EZI_BODY = "M80 28 C114 28 136 56 136 94 C136 124 112 140 80 140 C48 140 24 124 24 94 C24 56 46 28 80 28 Z"
EZI = C["blue2"]

def ezi(pose="wave"):
    arm = {"down": (((32, 98), (18, 108), (20, 124)), ((128, 98), (142, 108), (140, 124)))}
    Lf, Rf = arm["down"]
    face = dict(eyes="open", mouth="smile", gaze=(0, 0))
    before, after, extra = "", "", ""
    if pose == "wave":
        Rf = ((128, 98), (148, 86), (148, 62)); extra = motion(146, 40, .7, -30); face["mouth"] = "grin"
    elif pose == "think":
        Rf = ((128, 98), (144, 112), (108, 112)); face.update(mouth="flat", gaze=(3, -3))
        extra = circ(140, 34, 4, C["white"], 2.5) + circ(150, 20, 6, C["white"], 2.5) + text(150, 26, "?", 13, INK, 800)
    elif pose == "celebrate":
        Lf = ((32, 98), (12, 82), (16, 56)); Rf = ((128, 98), (148, 82), (144, 56)); face.update(eyes="happy", mouth="grin")
        extra = confetti([(14, 28, 20, C["coral"]), (146, 26, -25, C["sun"]), (30, 12, -40, C["mint"]), (128, 8, 35, C["purple"])]) + spark(80, 10, 8)
    elif pose == "read":
        Lf = ((32, 98), (36, 120), (60, 116)); Rf = ((128, 98), (124, 120), (100, 116)); face.update(gaze=(0, 4))
        after = (P("M80 104 C70 98 56 98 46 102 V130 C56 126 70 126 80 132 Z", C["white"]) + P("M80 104 C90 98 104 98 114 102 V130 C104 126 90 126 80 132 Z", C["white"])
                 + L("M54 110 Q62 108 72 111 M54 118 Q62 116 72 119 M88 111 Q98 108 106 110", INK, 2.2, 'opacity=".35"'))
    elif pose == "write":
        Rf = ((128, 98), (146, 112), (132, 126)); face.update(gaze=(4, 3), mouth="small")
        after = g(rect(-26, -6, 40, 12, 2, C["sun"], 3) + P("M14 -6 L26 0 L14 6 Z", C["cream"], 3) + rect(-34, -6, 9, 12, 4, C["pink"], 3), 136, 118, rot=-60)
    elif pose == "point":
        Rf = ((128, 98), (150, 98), (158, 76)); face.update(gaze=(4, -2)); extra = spark(150, 44, 9)
    elif pose == "sleep":
        face.update(eyes="sleep", mouth="o")
        extra = text(124, 44, "z", 18, C["blue"], 800) + text(140, 30, "z", 14, C["blue"], 800) + text(152, 18, "z", 10, C["blue"], 800)
    elif pose == "oops":
        Lf = ((32, 98), (10, 86), (22, 64)); Rf = ((128, 98), (150, 86), (138, 64)); face.update(mouth="worried", gaze=(0, 1))
        extra = P("M140 48 C134 56 134 62 140 62 C146 62 146 56 140 48 Z", C["sky"], 2.5) + text(26, 38, "?", 20, C["coral"], 800)
    elif pose == "fire":
        Rf = ((128, 98), (150, 90), (146, 66)); face.update(eyes="happy", mouth="grin")
        extra = g(obj_flame(), 128, 18, .42)
    elif pose == "trophy":
        Lf = ((32, 98), (36, 120), (56, 112)); Rf = ((128, 98), (124, 120), (104, 112)); face.update(eyes="happy", mouth="grin")
        after = g(obj_trophy().replace(shadow(60, 108, 34), ""), 52, 82, .48) + spark(30, 40, 7) + spark(134, 36, 6, C["sky"])
    out = shadow(80, 146, 50)
    out += ell(62, 140, 14, 7, C["blued"]) + ell(98, 140, 14, 7, C["blued"])
    out += L("M80 28 C80 18 84 12 92 9", INK, 3.5) + spark(95, 8, 8)
    for a in (Lf, Rf):
        if pose == "think" and a is Rf: continue
        out += tube(qd(*a), EZI, 12) + circ(*beyond(a[1], a[2], 2), 7.5, EZI, 3)
    out += P(EZI_BODY, EZI)
    out += f'<ellipse cx="80" cy="114" rx="34" ry="20" fill="{C["sky"]}" opacity=".9"/>'
    out += f'<ellipse cx="50" cy="56" rx="10" ry="5.5" fill="#fff" opacity=".55" transform="rotate(-38 50 56)"/>'
    out += eyes(80, 80, 18, 5, 6.5, face["eyes"], face["gaze"], whites=True)
    out += mouth(80, 100, 8, face["mouth"]) + blush(80, 96, 36, 7, 4)
    if pose == "think":
        a = Rf; out += tube(qd(*a), EZI, 12) + circ(*beyond(a[1], a[2], 2), 7.5, EZI, 3)
    out += after + extra
    return out

EZI_POSES = ["wave", "think", "celebrate", "read", "write", "point", "sleep", "oops", "fire", "trophy"]

# ---------------------------------------------------------------- cast (200×240)
CAST = {
    "temuulen": dict(label="Тэмүүлэн · ЭЕШ", skin=SKIN[1], hair="short", top="hoodie", c=C["blue2"], cd=C["blued"], pants=C["denim"]),
    "saraa": dict(label="Сараа · SAT", skin=SKIN[0], hair="braids", top="sweater", c=C["sun"], cd=C["sund"], pants=C["blue2"]),
    "anujin": dict(label="Анужин · Онол", skin=SKIN[1], hair="bun", top="deel", c=C["coral"], cd=C["corald"], pants=C["denim"]),
    "bat": dict(label="Бат · Дасгал", skin=SKIN[2], hair="curly", top="tee", c=C["mint"], cd=C["mintd"], pants="#3A4270", glasses=True),
    "teacher": dict(label="Ганбаатар багш", skin=SKIN[2], hair="side", top="vest", c=C["purple"], cd=C["purpled"], pants=C["denim"], glasses=True, stache=True),
}
TORSO = "M68 136 C68 122 78 116 90 116 L110 116 C122 116 132 122 132 136 L135 192 C135 197 131 200 126 200 L74 200 C69 200 65 197 65 192 Z"
SH_L, SH_R = (74, 134), (126, 134)
IDLE_L, IDLE_R = (SH_L, (62, 154), (64, 176)), (SH_R, (138, 154), (136, 176))

def hair_back(k, col):
    if k == "braids":
        out = P("M54 86 C50 50 70 28 100 28 C130 28 150 50 146 86 L144 100 H56 Z", col)
        for x in (52, 148):
            for i, y in enumerate((106, 122, 138)):
                out += ell(x, y, 9, 9.5, col, 3)
            out += circ(x, 152, 4.5, C["pink"], 2.5) + P(f"M{x-5} 156 L{x} 170 L{x+5} 156 Z", col, 2.5)
        return out
    if k == "bun": return circ(100, 26, 17, col) + ell(100, 40, 14, 4.5, C["sun"], 2.8)
    if k == "side": return ""
    return ""

def hair_front(k, col):
    if k == "short":
        return (P("M53 84 C46 50 66 26 100 26 C134 26 156 48 147 86 C142 74 138 66 131 62 C125 70 115 72 108 64 C99 73 84 73 76 64 C67 68 60 75 53 84 Z", col)
                + P("M98 28 C95 16 104 9 114 11 C107 15 105 21 107 28 Z", col, 3))
    if k == "braids":
        return P("M55 84 C52 48 74 30 100 30 C128 30 148 48 145 84 C138 66 124 58 110 56 C106 64 96 68 86 64 C74 66 62 74 55 84 Z", col)
    if k == "bun":
        return P("M54 82 C50 46 74 31 100 31 C126 31 150 46 146 82 C142 66 132 56 118 52 C100 50 78 55 66 64 C60 70 56 76 54 82 Z", col)
    if k == "curly":
        return P("M54 84 C44 76 46 60 57 55 C54 41 68 31 81 35 C87 23 108 21 116 31 C128 25 145 34 143 48 C155 54 155 72 146 84 "
                 "C142 72 134 63 124 61 C114 68 97 68 85 61 C74 66 61 72 54 84 Z", col)
    if k == "side":
        return P("M54 78 C52 44 76 28 102 28 C130 28 150 46 146 78 C140 62 128 52 112 50 C96 56 72 60 54 78 Z", col)
    return ""

def torso_decor(ch):
    t, c, cd = ch["top"], ch["c"], ch["cd"]
    if t == "hoodie":
        return (P("M74 126 C76 108 124 108 126 126 C116 119 84 119 74 126 Z", cd, 3)
                + L("M93 124 L91 146 M107 124 L109 146", C["white"], 3) + P("M80 170 H120 L116 190 H84 Z", c, 3))
    if t == "sweater":
        return (P("M84 117 C88 130 112 130 116 117 C108 122 92 122 84 117 Z", C["white"], 3)
                + L("M66 172 H134", C["white"], 6) + L("M66 180 H134", C["sund"], 3))
    if t == "deel":
        return (L("M86 118 C92 126 108 126 114 118", C["sun"], 5) + L("M100 122 C114 128 126 138 134 152", C["sun"], 5)
                + circ(114, 128, 3, C["sun"], 2) + circ(125, 137, 3, C["sun"], 2) + L("M64 170 H136", C["sun"], 8) + L("M64 170 H136", C["sund"], 0))
    if t == "tee":
        return P("M88 117 C92 125 108 125 112 117", "none", 3) + spark(100, 160, 10, C["white"], 2.5)
    if t == "vest":
        return (P("M86 116 L100 146 L114 116 Z", C["white"], 3) + P("M97 122 H103 L105 142 L100 148 L95 142 Z", C["blue2"], 2.5)
                + circ(100, 162, 2.5, INK, 0) + circ(100, 176, 2.5, INK, 0))
    return ""

def kid(key, pose="idle"):
    ch = CAST[key]; skin, col = ch["skin"], ch["c"]
    Lf, Rf = IDLE_L, IDLE_R
    face = dict(eyes="open", mouth="smile", gaze=(0, 0))
    props, after_head, extra, cross = "", "", "", None
    if pose == "wave":
        Rf = (SH_R, (154, 126), (158, 98)); face["mouth"] = "grin"; extra = motion(172, 84, .9, -20)
    elif pose == "cheer":
        Lf = (SH_L, (48, 120), (46, 90)); Rf = (SH_R, (152, 120), (154, 90)); face.update(eyes="happy", mouth="grin")
        extra = confetti([(28, 52, 25, C["coral"]), (172, 48, -20, C["blue2"]), (40, 20, -30, C["mint"]), (160, 16, 40, C["sun"])])
    elif pose == "point":
        Rf = (SH_R, (154, 142), (176, 128)); face["gaze"] = (2, 0)
    elif pose == "think":
        Lf = (SH_L, (70, 164), (100, 160)); cross = (SH_R, (150, 132), (122, 112)); Rf = None
        face.update(mouth="flat", gaze=(2, -2)); extra = circ(160, 46, 4, C["white"], 2.5) + circ(172, 30, 7, C["white"], 2.5) + text(172, 37, "?", 14, INK, 800)
    elif pose == "book":
        Lf = (SH_L, (58, 150), (66, 160)); Rf = (SH_R, (142, 150), (134, 160)); face["gaze"] = (0, 3)
        props = (P("M100 144 C92 138 80 138 72 142 V176 C80 172 92 172 100 178 Z", C["sky"]) + P("M100 144 C108 138 120 138 128 142 V176 C120 172 108 172 100 178 Z", C["sky"])
                 + L("M100 144 V178", INK, 2.5))
    elif pose == "laptop":
        Lf = (SH_L, (58, 152), (64, 162)); Rf = (SH_R, (142, 152), (136, 162)); face["gaze"] = (0, 3)
        props = rect(70, 138, 60, 40, 6, C["white"]) + spark(100, 158, 8, C["sky"], 2.5)
    out = shadow(100, 228, 50)
    out += hair_back(ch["hair"], C["hair"])
    out += tube("M90 190 L89 214", ch["pants"], 16) + tube("M110 190 L111 214", ch["pants"], 16)
    out += P("M74 226 C74 216 81 212 89 212 C97 212 100 218 100 226 Z", INK, 3) + P("M100 226 C100 218 103 212 111 212 C119 212 126 216 126 226 Z", INK, 3)
    out += L("M77 223 H97 M103 223 H123", C["white"], 2.5, 'opacity=".9"')
    cid = uid("t")
    out += P(TORSO, col) + f'<clipPath id="{cid}"><path d="{TORSO}"/></clipPath><g clip-path="url(#{cid})">{torso_decor(ch)}</g>' + P(TORSO, "none")
    short = ch["top"] == "tee"
    def arm(a):
        if short:
            o = tube(qd(*a), skin, 14) + tube(qd(*qsplit(*a, .38)), col, 16)
        else:
            o = tube(qd(*a), col, 14)
        return o
    for a in (Lf, Rf):
        if a: out += arm(a)
    out += props
    for a in (Lf, Rf):
        if a: out += circ(*beyond(a[1], a[2], 5), 8, skin, 3)
    for x in (57, 143):
        out += circ(x, 82, 9, skin, 3)
    out += circ(100, 74, 44, skin)
    out += eyes(100, 80, 15, 4.4, 5.8, face["eyes"], face["gaze"]) + mouth(100, 95, 7, face["mouth"]) + blush(100, 92, 27)
    if ch.get("stache"): out += P("M90 91 C94 87 98 88 100 90 C102 88 106 87 110 91 C106 93 102 93 100 92 C98 93 94 93 90 91 Z", C["hair"], 2)
    out += hair_front(ch["hair"], C["hair"])
    if ch.get("glasses"):
        out += circ(85, 80, 10.5, "#fff", 3, 'fill-opacity=".25"') + circ(115, 80, 10.5, "#fff", 3, 'fill-opacity=".25"') + L("M95.5 79 Q100 75.5 104.5 79", INK, 3)
    if cross:
        out += arm(cross) + circ(*beyond(cross[1], cross[2], 5), 8, skin, 3)
    out += extra
    return out

KID_POSES = ["idle", "wave", "cheer", "point", "think", "book", "laptop"]

# ---------------------------------------------------------------- math buddies (120×120)
def limbs(arms, legs, w=3.5):
    o = ""
    for (x1, y1, x2, y2) in arms: o += L(f"M{x1} {y1} L{x2} {y2}", INK, w) + dot(x2, y2, 4, INK)
    for (x1, y1, x2, y2) in legs: o += L(f"M{x1} {y1} L{x2} {y2}", INK, w) + f'<ellipse cx="{x2+3}" cy="{y2+1}" rx="6.5" ry="3.8" fill="{INK}"/>'
    return o
def bface(cx, y, expr="smile", eyes_k="open", dx=8):
    return eyes(cx, y, dx, 3.2, 4.2, eyes_k) + mouth(cx, y + 10, 5, expr) + blush(cx, y + 7, dx + 7, 4.5, 2.8)

def bud_pi():
    o = shadow(60, 112, 36) + limbs([(20, 38, 8, 54), (100, 38, 112, 24)], [])
    o += tube("M42 48 C42 70 38 88 26 100", C["purple"], 15) + tube("M78 48 C78 72 80 90 94 96", C["purple"], 15)
    o += rect(16, 22, 88, 28, 14, C["purple"]) + bface(60, 33, "smile")
    return o
def bud_tri():
    o = shadow(60, 114, 38) + limbs([(34, 66, 16, 54), (86, 66, 104, 56)], [(46, 96, 44, 108), (74, 96, 76, 108)])
    o += P("M60 14 C66 14 70 18 73 24 L104 80 C108 88 103 96 94 96 L26 96 C17 96 12 88 16 80 L47 24 C50 18 54 14 60 14 Z", C["sun"])
    o += bface(60, 64, "grin")
    return o
def bud_circle():
    o = shadow(60, 114, 34) + limbs([(26, 60, 10, 70), (94, 60, 110, 44)], [(48, 90, 46, 108), (72, 90, 74, 108)])
    o += circ(60, 56, 38, C["mint"]) + f'<ellipse cx="44" cy="36" rx="9" ry="5" fill="#fff" opacity=".5" transform="rotate(-35 44 36)"/>'
    o += bface(60, 54, "smile", "wink")
    return o
def bud_x():
    o = shadow(60, 114, 36) + limbs([], [(50, 92, 48, 108), (70, 92, 72, 108)])
    o += tube("M28 24 L92 92", C["coral"], 22) + tube("M92 24 L28 92", C["coral"], 22)
    o += L("M28 24 L92 92", C["coral"], 22) + circ(60, 58, 20, C["coral"]) + bface(60, 54, "o", dx=7)
    return o
def bud_cube():
    o = shadow(60, 114, 38) + limbs([(24, 64, 10, 76), (96, 60, 110, 46)], [(46, 96, 44, 108), (74, 96, 76, 108)])
    o += P("M60 14 L96 32 L60 50 L24 32 Z", C["sky"]) + P("M24 32 L60 50 L60 98 L24 80 Z", C["blue2"]) + P("M60 50 L96 32 L96 80 L60 98 Z", C["blued"])
    o += f'<g transform="matrix(1 .5 0 1 42 60)">' + eyes(0, 0, 7, 3, 4, "open") + mouth(0, 9, 4.5, "smile") + blush(0, 7, 13, 3.5, 2.4) + "</g>"
    return o
def bud_percent():
    o = shadow(60, 114, 34) + limbs([(30, 60, 14, 70), (90, 60, 106, 50)], [(50, 96, 48, 108), (70, 96, 72, 108)])
    o += rect(24, 20, 72, 78, 24, C["pinkl"]) + tube("M44 82 L76 36", C["coral"], 9)
    o += circ(42, 44, 9, C["white"], 3) + circ(78, 76, 9, C["white"], 3)
    o += eyes(60, 54, 10, 3, 4, "happy") + mouth(60, 64, 4, "small")
    return o
BUDDIES = dict(pi=("Пи", bud_pi), triangle=("Гурвалжин", bud_tri), circle=("Тойрог", bud_circle), x=("Икс", bud_x), cube=("Куб", bud_cube), percent=("Хувь", bud_percent))

# ---------------------------------------------------------------- scenes (480×360)
def blob(fill, d="M60 70 C110 10 250 20 330 36 C420 54 470 120 450 210 C430 300 330 330 220 322 C110 314 30 290 22 200 C16 140 30 100 60 70 Z"):
    return F(d, fill)

def sc_lesson():
    o = blob(C["lilac"]) + spark(40, 60, 10) + spark(440, 300, 8, C["white"])
    o += rect(46, 52, 230, 160, 14, C["white"]) + L("M70 212 L62 252 M252 212 L260 252", INK, 4)
    o += P("M80 180 L80 92 L170 180 Z", C["sun"], 3) + L("M80 168 H92 V180", INK, 2.5)
    o += text(70, 140, "a", 18, C["purple"], 700) + text(128, 200, "b", 18, C["purple"], 700) + text(138, 128, "c", 18, C["purple"], 700)
    o += text(222, 116, "a²+b²", 22, INK, 700) + text(222, 146, "= c²", 22, C["blue"], 700) + L("M188 158 Q222 168 256 156", C["coral"], 3.5)
    o += g(kid("teacher", "point"), 456, 98, 1, flip=True)
    o += g(ezi("read"), 170, 214, .85)
    return o

def sc_study():
    o = blob(C["sky"]) + spark(420, 50, 10) + spark(60, 300, 7, C["white"])
    o += g(kid("temuulen", "laptop"), 140, 92, 1.05)
    o += g(obj_bulb(), 40, 40, .8) + g(bud_pi(), 330, 44, .9) + g(bud_tri(), 350, 200, .9)
    o += g(rect(-40, -20, 80, 40, 12, C["white"]) + text(0, 8, "x² = 49", 18, INK, 700), 80, 210, rot=-6)
    return o

def sc_success():
    o = blob(C["cream"]) + confetti([(70, 60, 20, C["coral"]), (420, 80, -30, C["blue2"]), (380, 30, 45, C["mint"]), (110, 30, -15, C["purple"]), (60, 250, 30, C["sun"]), (440, 230, -40, C["coral"])])
    o += g(kid("saraa", "cheer"), 150, 100, 1.05)
    o += g(obj_trophy(), 40, 170, 1.1)
    o += g(rect(-62, -38, 124, 76, 18, C["white"]) + text(0, -6, "780", 32, C["blue"], 800) + text(0, 22, "SAT оноо", 14, INK, 600), 392, 258, rot=5)
    o += spark(300, 100, 12) + spark(420, 290, 8, C["white"])
    return o

def sc_empty():
    o = blob(C["sky"], "M120 80 C190 30 320 40 380 90 C440 140 430 250 360 290 C290 330 170 330 110 290 C50 250 60 120 120 80 Z")
    o += g(obj_books(), 150, 170, 1.5) + g(ezi("sleep"), 160, 72, 1.0)
    o += text(240, 340, "Энд одоогоор хоосон байна", 18, INK, 600)
    return o

def digit4(x):
    d = f"M{x+40} 50 L{x+8} 130 H{x+66} M{x+48} 96 V170"
    return L(d, INK, 30 + 2 * SW) + L(d, C["coral"], 30)
def sc_404():
    o = blob(C["pinkl"])
    o += digit4(50) + digit4(330) + g(bud_circle(), 180, 30, 1.1)
    o += g(ezi("oops"), 160, 190, .95) + spark(440, 60, 9) + spark(40, 300, 8, C["white"])
    return o

def sc_streak():
    o = blob(C["mintl"])
    o += g(kid("bat", "wave"), 60, 100, 1.05)
    cal = rect(-80, -70, 160, 140, 18, C["white"]) + rect(-80, -70, 160, 34, 18, C["coral"]) + F("M-78 -50 H78 V-36 H-78 Z", C["coral"]) + P("M-80 -36 H80", "none", 3)
    cal += text(0, -46, "7 хоног", 16, C["white"], 700)
    for i in range(7):
        x = -60 + (i % 4) * 40; y = -10 + (i // 4) * 40
        cal += circ(x, y, 14, C["mint"] if i < 6 else C["sky"], 3) + (L(f"M{x-6} {y} L{x-1} {y+5} L{x+7} {y-5}", C["white"], 3.5) if i < 6 else "")
    o += g(cal, 340, 180, rot=4) + g(obj_flame(), 360, 20, .9) + spark(250, 60, 9)
    return o

SCENES = dict(study=("Хичээл хийх", sc_study), lesson=("Онолын хичээл", sc_lesson), success=("Амжилт", sc_success),
              streak=("Цуврал / Streak", sc_streak), empty=("Хоосон төлөв", sc_empty), notfound=("404", sc_404))

# ---------------------------------------------------------------- output
def svg(w, h, inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="none">{inner}</svg>'

assets = []
def add(group, name, label, w, h, inner):
    s = svg(w, h, inner)
    fn = f"{group}-{name}.svg"
    open(os.path.join(OUT, fn), "w").write(s)
    assets.append(dict(group=group, name=name, label=label, w=w, h=h, file=fn, svg=s))

for k, ch in CAST.items():
    for p in KID_POSES:
        add("cast", f"{k}-{p}", f"{ch['label']} / {p}", 200, 240, kid(k, p))
for p in EZI_POSES: add("ezi", p, f"Эзи / {p}", 160, 160, ezi(p))
for k, (lab, fn) in BUDDIES.items(): add("buddy", k, lab, 120, 120, fn())
for k, fn in OBJECTS.items(): add("object", k, k, 120, 120, fn())
for k, (lab, fn) in SCENES.items(): add("scene", k, lab, 480, 360, fn())

FONT = '<link href="https://fonts.googleapis.com/css2?family=Onest:wght@500;600;700;800&display=swap" rel="stylesheet">'
groups = [("ezi", "Эзи — mascot poses"), ("cast", "Cast"), ("buddy", "Math buddies"), ("object", "Spot objects"), ("scene", "Scenes")]
html = [f"<!doctype html><html><head><meta charset=utf-8>{FONT}<style>body{{font-family:Onest,Inter,sans-serif;background:#F6F7FB;margin:0;padding:32px;color:{INK}}}"
        "h2{margin:32px 0 12px}.row{display:flex;flex-wrap:wrap;gap:16px}.c{background:#fff;border-radius:16px;padding:12px;text-align:center;font-size:12px}"
        ".c svg{display:block;margin:0 auto 6px}</style></head><body>"]
for gk, title in groups:
    html.append(f"<h2>{title}</h2><div class=row>")
    for a in assets:
        if a["group"] == gk: html.append(f'<div class=c>{a["svg"]}<div>{a["label"]}</div></div>')
    html.append("</div>")
open(os.path.join(HERE, "sheet.html"), "w").write("".join(html) + "</body></html>")
json.dump([{k: v for k, v in a.items()} for a in assets], open(os.path.join(HERE, "assets.json"), "w"), ensure_ascii=False)
print(len(assets), "assets")
