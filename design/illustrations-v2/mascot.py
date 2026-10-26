#!/usr/bin/env python3
"""Эзи v2: polished, outline-free mascot (glossy gel body, gradients, soft light) + friends,
props and scenes built around it. Writes svg/ezi-*.svg, svg/friend-*.svg, svg/escene-*.svg and mascot.html."""
import math, os
from build import F, S, circ, ell, rect, g, text, C, INK, OUT, HERE, o_graph, o_scorecard, o_calendar, o_trophy, o_notebook, o_chart

NAVY = "#141A46"
_n = [0]
def uid(p):
    _n[0] += 1
    return f"{p}{_n[0]}"

def lin(stops, x1=0, y1=0, x2=0, y2=1):
    i = uid("l")
    st = "".join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a != 1 else ""}/>' for o, c, a in stops)
    return i, f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>'
def rad(stops, cx=.5, cy=.5, r=.5):
    i = uid("r")
    st = "".join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a != 1 else ""}/>' for o, c, a in stops)
    return i, f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{st}</radialGradient>'

class Art:
    def __init__(self): self.defs = []; self.body = []
    def grad(self, pair): self.defs.append(pair[1]); return f"url(#{pair[0]})"
    def add(self, s): self.body.append(s); return self
    def svg(self, w, h):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="none">'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}</svg>')

# palettes: (top, mid, bottom, belly, deep, antenna-tip)
SKINS = {
    "blue":   ("#90A8FF", "#4F6CF7", "#2F4BE0", "#B4C5FF", "#1E33B0"),
    "mint":   ("#8EF0CB", "#3FD39F", "#1FA97A", "#B7F7DD", "#13805B"),
    "coral":  ("#FFB4A5", "#FF7A64", "#E2523F", "#FFD0C6", "#B93B2B"),
    "violet": ("#C7B4FF", "#9672F5", "#6E45DB", "#DCD0FF", "#5230B4"),
    "sun":    ("#FFE59A", "#FFC94D", "#EFA21C", "#FFF0C4", "#C47E0A"),
}

BODY = "M100 44 C142 44 166 76 169 116 C172 154 156 174 100 174 C44 174 28 154 31 116 C34 76 58 44 100 44 Z"
BELLY = "M47 132 C64 118 136 118 153 132 C158 156 144 168 100 168 C56 168 42 156 47 132 Z"

def spark(x, y, r, fill):
    k = r * .22
    return F(f"M{x} {y-r} Q{x+k} {y-k} {x+r} {y} Q{x+k} {y+k} {x} {y+r} Q{x-k} {y+k} {x-r} {y} Q{x-k} {y-k} {x} {y-r} Z", fill)

def blob(a, skin="blue", top="antenna", s=1, x=0, y=0, squash=1.0, nubs=()):
    """Body + light. Returns inner markup positioned at (x, y) with scale s."""
    t, m, b, belly, deep = SKINS[skin]
    body = a.grad(lin([(0, t, 1), (.5, m, 1), (1, b, 1)], .3, 0, .7, 1))
    rim = a.grad(lin([(0, "#FFFFFF", .0), (1, "#FFFFFF", .35)], 0, 0, 1, 0))
    bel = a.grad(lin([(0, belly, .15), (1, belly, .9)], 0, 0, 0, 1))
    out = ""
    # head feature behind the body
    if top == "antenna":
        out += S("M100 50 C100 34 104 24 114 16", m, 6) + S("M100 50 C100 34 104 24 114 16", "#FFFFFF", 2, 'opacity=".35"')
        glow = a.grad(rad([(0, "#FFE08A", .9), (1, "#FFE08A", 0)]))
        out += circ(115, 14, 16, glow) + spark(115, 14, 10, C["mustard"]) + spark(113, 12, 4, "#FFF6D6")
    elif top == "ears":
        out += circ(66, 58, 15, b) + circ(134, 58, 15, b) + circ(66, 58, 8, belly, 'opacity=".7"') + circ(134, 58, 8, belly, 'opacity=".7"')
    elif top == "sprout":
        out += S("M100 48 V30", deep, 5) + F("M100 32 C88 30 80 20 82 10 C94 10 102 20 100 32 Z", m) + F("M100 34 C110 26 122 26 128 32 C120 42 108 42 100 34 Z", t)
    elif top == "peak":
        out += F("M78 56 L100 20 L122 56 Z", m) + F("M100 20 L122 56 L100 56 Z", b, 'opacity=".55"')
    elif top == "curl":
        out += S("M100 48 C96 34 110 26 116 34 C120 40 112 46 106 42", m, 7)
    for (nx, ny, rot) in nubs:
        out += ell(nx, ny, 13, 17, body, f'transform="rotate({rot} {nx} {ny})"')
    out += F(BODY, body)
    out += F(BELLY, bel)
    out += F("M150 70 C164 88 170 110 168 132 C162 112 156 92 142 76 Z", "#FFFFFF", 'opacity=".22"')  # rim light, right edge
    out += F("M38 140 C46 162 70 172 100 172 C130 172 152 164 162 146 C150 168 130 176 100 176 C66 176 44 166 38 140 Z", deep, 'opacity=".35"')
    out += ell(70, 74, 18, 10, "#FFFFFF", 'opacity=".55" transform="rotate(-32 70 74)"') + circ(90, 60, 4.5, "#FFFFFF", 'opacity=".75"')
    tr = f"translate({x} {y})" + (f" translate(100 174) scale({s} {s*squash}) translate(-100 -174)" if s != 1 or squash != 1 else "")
    return f'<g transform="{tr}">{out}</g>'

def face(a, eyes="open", mouth="smile", cheeks=True, look=(0, 0), x=0, y=0):
    out = ""
    ex, ey = 80, 108
    for s in (-1, 1):
        cx = 100 + s * 20 + look[0]; cy = ey + look[1]
        if eyes == "open":
            out += ell(cx, cy, 7.5, 10, NAVY) + circ(cx + 2.6, cy - 4, 3, "#FFFFFF") + circ(cx - 2.4, cy + 4, 1.4, "#FFFFFF", 'opacity=".8"')
        elif eyes == "happy":
            out += S(f"M{cx-8} {cy+3} Q{cx} {cy-8} {cx+8} {cy+3}", NAVY, 4.6)
        elif eyes == "closed":
            out += S(f"M{cx-8} {cy-1} Q{cx} {cy+7} {cx+8} {cy-1}", NAVY, 4.2)
        elif eyes == "star":
            out += spark(cx, cy, 10, NAVY) + circ(cx + 2, cy - 2, 1.8, "#FFFFFF")
        elif eyes == "wink":
            if s == -1: out += ell(cx, cy, 7.5, 10, NAVY) + circ(cx + 2.6, cy - 4, 3, "#FFFFFF")
            else: out += S(f"M{cx-8} {cy+3} Q{cx} {cy-8} {cx+8} {cy+3}", NAVY, 4.6)
        elif eyes == "focus":
            out += ell(cx, cy + 1, 7, 7.5, NAVY) + circ(cx + 2.4, cy - 2, 2.6, "#FFFFFF") + S(f"M{cx-9} {cy-11} L{cx+8} {cy-8 if s < 0 else cy-14}", NAVY, 3.6)
        elif eyes == "worried":
            out += ell(cx, cy + 1, 7, 9, NAVY) + circ(cx + 2.4, cy - 3, 2.6, "#FFFFFF") + S(f"M{cx-8} {cy-12 if s < 0 else cy-16} L{cx+8} {cy-16 if s < 0 else cy-12}", NAVY, 3.6)
    mx, my = 100 + look[0] * .6, 126 + look[1] * .4
    if mouth == "smile": out += S(f"M{mx-7} {my} Q{mx} {my+7} {mx+7} {my}", NAVY, 3.8)
    elif mouth == "open":
        out += F(f"M{mx-10} {my-2} Q{mx} {my+16} {mx+10} {my-2} Q{mx} {my+1} {mx-10} {my-2} Z", NAVY) + F(f"M{mx-5} {my+7} Q{mx} {my+12} {mx+5} {my+7} Q{mx} {my+4} {mx-5} {my+7} Z", "#FF8C9E")
    elif mouth == "o": out += ell(mx, my + 3, 5, 6.5, NAVY)
    elif mouth == "flat": out += S(f"M{mx-6} {my+2} Q{mx} {my} {mx+6} {my+2}", NAVY, 3.6)
    elif mouth == "wobble": out += S(f"M{mx-9} {my+4} Q{mx-4.5} {my-1} {mx} {my+3} Q{mx+4.5} {my+7} {mx+9} {my+2}", NAVY, 3.4)
    if cheeks:
        out += ell(70 + look[0], 124, 9, 5.5, "#FF8FA8", 'opacity=".45"') + ell(130 + look[0], 124, 9, 5.5, "#FF8FA8", 'opacity=".45"')
    return g(out, x, y) if (x or y) else out

def shadow(a, x=100, y=180, rx=58):
    sh = a.grad(rad([(0, NAVY, .22), (1, NAVY, 0)]))
    return ell(x, y, rx, 9, sh)

# --------------------------------------------------------------- props (polished, gradient-lit)
def p_book(a, x, y, rot=0):
    cov = a.grad(lin([(0, "#5B7BFF", 1), (1, "#2440D0", 1)]))
    o = F("M-46 -4 L0 6 L46 -4 L46 30 L0 40 L-46 30 Z", cov)
    o += F("M-42 -8 Q-20 -12 0 0 L0 32 Q-20 22 -42 26 Z", "#FFFFFF") + F("M42 -8 Q20 -12 0 0 L0 32 Q20 22 42 26 Z", "#EEF1FF")
    o += S("M-34 0 Q-20 -2 -8 4 M-34 8 Q-20 6 -8 12", C["mist"], 2) + S("M10 6 Q20 -6 32 4", C["blue"], 2.4)
    return g(o, x, y, rot=rot)

def p_laptop(a, x, y):
    lid = a.grad(lin([(0, "#3A4166", 1), (1, "#1D2140", 1)]))
    scr = a.grad(lin([(0, "#E9EEFF", 1), (1, "#C9D4FF", 1)]))
    o = rect(-48, -44, 96, 64, 9, lid) + rect(-42, -38, 84, 52, 5, scr)
    o += F("M-34 4 L-20 -8 L-8 -2 L8 -20 L22 -12 L34 -26", "none") + S("M-34 4 L-20 -8 L-8 -2 L8 -20 L22 -12 L34 -26", C["blue"], 3)
    o += circ(34, -26, 3.5, C["coral"])
    o += F("M-60 20 H60 Q60 30 50 30 H-50 Q-60 30 -60 20 Z", "#C9CCD8") + rect(-14, 20, 28, 4, 2, "#9EA3B8")
    return g(o, x, y)

def p_trophy(a, x, y, s=1):
    gold = a.grad(lin([(0, "#FFE38A", 1), (.5, "#F7BE38", 1), (1, "#D98F0F", 1)], 0, 0, 1, 1))
    o = S("M-22 -26 Q-42 -26 -38 -8 Q-34 6 -18 6", "#E3A21F", 6) + S("M22 -26 Q42 -26 38 -8 Q34 6 18 6", "#E3A21F", 6)
    o += F("M-26 -36 H26 V-12 Q26 16 0 18 Q-26 16 -26 -12 Z", gold) + F("M-16 -32 V-12 Q-16 2 -8 8", "none") + S("M-16 -30 V-14 Q-16 0 -8 6", "#FFFFFF", 4, 'opacity=".6"')
    o += rect(-7, 16, 14, 14, 2, "#D98F0F") + rect(-24, 30, 48, 16, 5, NAVY) + rect(-14, 35, 28, 6, 3, "#F7BE38", 'opacity=".9"')
    return g(o, x, y, s)

def p_flame(a, x, y, s=1):
    out = a.grad(lin([(0, "#FFB199", 1), (1, "#F04A36", 1)]))
    inn = a.grad(lin([(0, "#FFF0B8", 1), (1, "#FFC94D", 1)]))
    o = F("M0 -52 Q10 -26 32 -10 Q46 6 42 24 Q36 52 0 54 Q-36 52 -42 24 Q-46 2 -26 -14 Q-22 4 -12 8 Q-18 -24 0 -52 Z", out)
    o += F("M0 -4 Q14 14 16 28 Q16 46 0 48 Q-16 46 -16 30 Q-14 14 0 -4 Z", inn)
    return g(o, x, y, s)

def p_bubble(a, x, y, label, w=56, fill="#FFFFFF", color=None, size=22):
    o = rect(-w / 2 + 2, -24 + 4, w, 40, 14, NAVY, 'opacity=".08"') + rect(-w / 2, -24, w, 40, 14, fill) + F("M-10 14 L-16 26 L2 14 Z", fill)
    o += text(0, 4, label, size, color or C["blue"], 700, "middle")
    return g(o, x, y)

def confetti(items):
    o = ""
    for x, y, r, col in items:
        o += rect(x - 3, y - 7, 6, 14, 3, col, f'transform="rotate({r} {x} {y})"')
    return o

def zz(x, y):
    return text(x, y, "z", 16, C["bluel"], 800) + text(x + 12, y - 14, "z", 22, C["blue"], 800)

def sweat(a, x, y):
    d = a.grad(lin([(0, "#E6F4FF", 1), (1, "#8FC8FF", 1)]))
    return F(f"M{x} {y-12} Q{x+9} {y} {x+7} {y+5} Q{x} {y+12} {x-7} {y+5} Q{x-9} {y} {x} {y-12} Z", d)

# --------------------------------------------------------------- poses (200×200)
def ezi(pose):
    a = Art()
    a.add(shadow(a))
    if pose == "idle":
        a.add(blob(a)); a.add(face(a, "open", "smile"))
    elif pose == "happy":
        a.add(blob(a, squash=.97)); a.add(face(a, "happy", "open"))
    elif pose == "wave":
        a.add(blob(a, nubs=[(170, 86, 30)])); a.add(face(a, "wink", "open"))
        a.add(S("M182 58 Q190 66 188 76", C["bluel"], 3) + S("M190 48 Q202 60 198 76", C["bluel"], 3, 'opacity=".6"'))
    elif pose == "point":
        a.add(blob(a, nubs=[(172, 112, 70)])); a.add(face(a, "open", "smile", look=(5, 0)))
    elif pose == "think":
        a.add(blob(a)); a.add(face(a, "open", "flat", look=(4, -4)))
        a.add(p_bubble(a, 160, 40, "?", 40, C["peril"]) + circ(140, 70, 4, C["peril"]) + circ(132, 80, 2.6, C["peril"]))
    elif pose == "celebrate":
        a.add(confetti([(30, 40, -20, C["coral"]), (170, 30, 25, C["mustard"]), (186, 90, -30, C["mint"] if "mint" in C else "#3FD39F"), (16, 100, 35, C["blue"]), (60, 20, 10, "#9672F5"), (150, 6, -12, C["coral"])]))
        a.add(blob(a, nubs=[(36, 70, -30), (164, 70, 30)])); a.add(face(a, "star", "open"))
    elif pose == "read":
        a.add(blob(a)); a.add(face(a, "closed", "smile", look=(0, 4))); a.add(p_book(a, 100, 152))
    elif pose == "laptop":
        a.add(blob(a)); a.add(face(a, "focus", "flat", look=(0, 2))); a.add(g(p_laptop(a, 0, 0), 100, 162, .82))
    elif pose == "sleep":
        a.add(blob(a, squash=.92)); a.add(face(a, "closed", "o", cheeks=True, look=(0, 4))); a.add(zz(150, 46))
    elif pose == "oops":
        a.add(blob(a)); a.add(face(a, "worried", "wobble")); a.add(sweat(a, 150, 78))
    elif pose == "streak":
        a.add(p_flame(a, 160, 64, .62)); a.add(blob(a, s=.94, x=-14)); a.add(face(a, "happy", "smile", x=-14, y=6))
    elif pose == "trophy":
        a.add(blob(a)); a.add(face(a, "happy", "open")); a.add(p_trophy(a, 100, 150, .85))
    return a.svg(200, 200)

POSES = ["idle", "happy", "wave", "point", "think", "celebrate", "read", "laptop", "sleep", "oops", "streak", "trophy"]

FRIENDS = [("mint", "sprout", "happy", "smile"), ("coral", "ears", "open", "open"), ("violet", "peak", "wink", "smile"), ("sun", "curl", "closed", "smile")]
def friend(skin, top, eyes, mouth):
    a = Art(); a.add(shadow(a)); a.add(blob(a, skin, top)); a.add(face(a, eyes, mouth)); return a.svg(200, 200)

# --------------------------------------------------------------- scenes
def place(a, inner_fn, x, y, s):
    """inner_fn(a) -> markup in 200×200 space; placed with its top-left at x,y, scaled s."""
    return g(inner_fn(a), x, y, s)

def ez(pose_fn):
    return pose_fn

def mini(a, skin="blue", top="antenna", eyes="happy", mouth="smile", nubs=(), look=(0, 0)):
    return shadow(a) + blob(a, skin, top, nubs=nubs) + face(a, eyes, mouth, look=look)

def landscape(a, w=1440, h=360, ger=True):
    sky_far = a.grad(lin([(0, "#C9D6FF", 1), (1, "#A7BAF5", 1)]))
    far2 = a.grad(lin([(0, "#B5C6FA", 1), (1, "#8FA6EE", 1)]))
    h1 = a.grad(lin([(0, "#BFEAD3", 1), (1, "#8FD8B4", 1)]))
    h2 = a.grad(lin([(0, "#8FDDB6", 1), (1, "#5CC594", 1)]))
    h3 = a.grad(lin([(0, "#5CC594", 1), (1, "#3AA676", 1)]))
    o = ""
    o += F("M0 190 L110 110 L170 150 L290 64 L390 136 L470 98 L560 160 L660 210 L660 230 L0 230 Z", sky_far)
    o += F("M290 64 L322 88 L306 90 L290 78 L276 92 L262 86 Z", "#FFFFFF", 'opacity=".9"')
    o += F("M780 210 L860 170 L980 80 L1050 128 L1160 56 L1280 140 L1360 104 L1440 150 L1440 230 L780 230 Z", far2)
    o += F("M1160 56 L1192 80 L1176 82 L1160 70 L1144 84 L1128 78 Z", "#FFFFFF", 'opacity=".9"')
    o += F("M0 206 C200 150 380 178 560 196 C760 216 900 160 1100 168 C1260 174 1360 196 1440 186 L1440 360 L0 360 Z", h1)
    o += F("M0 262 C240 214 460 252 720 244 C980 236 1180 206 1440 240 L1440 360 L0 360 Z", h2)
    o += F("M0 312 C300 284 600 302 860 298 C1100 294 1300 284 1440 302 L1440 360 L0 360 Z", h3)
    if ger:
        o += g(ger_art(a), 752, 140)
    return o

def ger_art(a):
    if True:
        wall = a.grad(lin([(0, "#FFFFFF", 1), (1, "#E9EAF0", 1)], 0, 0, 1, 0))
        roof = a.grad(lin([(0, "#F3E7D3", 1), (1, "#D9C4A2", 1)], 0, 0, 1, 0))
        go = F("M0 54 H112 V100 H0 Z", wall) + rect(0, 64, 112, 6, 0, C["coral"]) + rect(44, 70, 24, 30, 3, C["coral"]) + rect(48, 74, 16, 26, 2, "#C8432F")
        go += F("M-8 56 Q20 18 56 10 Q92 18 120 56 Z", roof) + rect(48, 2, 16, 10, 3, NAVY) + S("M4 44 Q56 30 108 44", C["coral"], 3)
        go += ell(56, 104, 64, 7, "#2C7A57", 'opacity=".25"')
        return g(go, 14, 10)

def esc_steppe():
    a = Art(); a.add(landscape(a))
    cast = [(210, 150, .62, dict(skin="mint", top="sprout", eyes="happy", mouth="smile")),
            (330, 196, .52, dict(skin="coral", top="ears", eyes="open", mouth="open")),
            (590, 196, .78, dict(skin="blue", top="antenna", eyes="happy", mouth="open", nubs=[(170, 86, 30)])),
            (1000, 160, .58, dict(skin="violet", top="peak", eyes="wink", mouth="smile")),
            (1130, 196, .5, dict(skin="sun", top="curl", eyes="closed", mouth="smile"))]
    for x, y, s, kw in cast:
        a.add(g(mini(a, **kw), x, y, s))
    return a.svg(1440, 360)

def scene_frame(a, color="#EEF1FF"):
    bg = a.grad(lin([(0, "#F4F6FF", 1), (1, color, 1)]))
    return rect(24, 24, 592, 352, 32, bg)

def esc_hero():
    a = Art(); a.add(scene_frame(a))
    a.add(circ(470, 200, 120, "none", f'stroke="{C["bluel"]}" stroke-width="1.5" stroke-dasharray="4 6"'))
    a.add(g(o_graph(), 380, 70, .95) + g(o_scorecard(), 470, 200, .85))
    a.add(g(mini(a, eyes="open", mouth="smile", nubs=[(172, 112, 70)], look=(5, 0)), 80, 120, 1.25))
    return a.svg(640, 400)

def esc_results():
    a = Art(); a.add(scene_frame(a, "#FFF4DA"))
    a.add(g(o_scorecard(), 330, 80, 1.35))
    a.add(g(ezi_inner(a, "celebrate"), 70, 110, 1.25))
    return a.svg(640, 400)

def esc_streak():
    a = Art(); a.add(scene_frame(a, "#FFE9E4"))
    a.add(g(o_calendar(), 320, 70, 1.4))
    a.add(g(ezi_inner(a, "streak"), 70, 110, 1.25))
    return a.svg(640, 400)

def esc_empty():
    a = Art(); a.add(scene_frame(a, "#F1F2F7"))
    a.add(rect(300, 100, 250, 170, 18, "none", f'stroke="{C["mist"]}" stroke-width="2" stroke-dasharray="8 8"'))
    a.add(rect(330, 136, 120, 12, 6, C["fog"]) + rect(330, 160, 180, 12, 6, C["fog"]) + rect(330, 184, 150, 12, 6, C["fog"]))
    a.add(g(ezi_inner(a, "sleep"), 70, 110, 1.2))
    a.add(text(425, 306, "Энд одоогоор хоосон байна", 15, C["slatel"], 600, "middle"))
    return a.svg(640, 400)

def esc_404():
    a = Art(); a.add(scene_frame(a))
    a.add(text(372, 230, "4", 130, NAVY, 800, "middle") + text(568, 230, "4", 130, NAVY, 800, "middle"))
    a.add(g(ezi_inner(a, "oops"), 420, 120, .5))
    a.add(g(mini(a, "coral", "ears", "worried", "o"), 60, 150, .95) + g(mini(a, "mint", "sprout", "open", "o", look=(3, -2)), 210, 220, .6))
    return a.svg(640, 400)

def ezi_inner(a, pose):
    """Pose markup usable inside another Art (shares its defs)."""
    inner = Art(); svg = ezi_pose_into(inner, pose)
    a.defs += inner.defs
    return svg

def ezi_pose_into(a, pose):
    global Art
    # reuse ezi() logic by temporarily rendering with a provided Art
    orig = Art
    class Bound:
        def __init__(self): self.defs = a.defs; self.body = []
        grad = orig.grad; add = orig.add
        def svg(self, w, h): return "".join(self.body)
    Art = Bound
    try: return ezi(pose)
    finally: Art = orig

ASSETS = []
def add(name, label, s, w, h, group): ASSETS.append((name, label, s, w, h, group))

if __name__ == "__main__":
    for p in POSES: add(f"ezi-{p}", f"Эзи / {p}", ezi(p), 200, 200, "ezi")
    for skin, top, e, m in FRIENDS: add(f"friend-{skin}", f"Найз / {skin}", friend(skin, top, e, m), 200, 200, "ezi")
    for k in ("hero", "results", "streak", "empty", "404"):
        add(f"escene-{k}", f"Scene / {k}", globals()["esc_" + k](), 640, 400, "scene")
    add("escene-steppe", "Scene / steppe", esc_steppe(), 1440, 360, "wide")
    gr = Art(); gr.add(ger_art(gr)); add("ger", "Ger", gr.svg(140, 120), 140, 120, "ezi")
    for n, l, s, w, h, grp in ASSETS: open(os.path.join(OUT, n + ".svg"), "w").write(s)
    css = ("body{margin:0;padding:24px;background:#fff;font:12px Inter,sans-serif;color:#0B1030}.grid{display:flex;flex-wrap:wrap;gap:14px}"
           "figure{margin:0;background:#F6F7FB;border-radius:14px;padding:10px}.ezi svg{width:180px;height:auto}.scene svg{width:440px;height:auto}.wide svg{width:1300px;height:auto}figcaption{color:#6B7194;margin-top:4px}")
    cells = "".join(f'<figure class="{grp}">{s}<figcaption>{l}</figcaption></figure>' for n, l, s, w, h, grp in ASSETS)
    open(os.path.join(HERE, "mascot.html"), "w").write(f"<!doctype html><meta charset=utf-8><style>{css}</style><div class=grid>{cells}</div>")
    print(len(ASSETS))


# --------------------------------------------------------------- floating-islands scene (replaces the steppe)
ISLANDS = [  # (cx, top y, rx, palette)
    (270, 236, 120, ("#FFFFFF", "#E4E9FF", "#B9C6FF", "#8EA2F2")),
    (720, 262, 160, ("#FFFFFF", "#E4E9FF", "#AFBEFF", "#7E95EE")),
    (1170, 228, 128, ("#FFFFFF", "#E4E9FF", "#B9C6FF", "#8EA2F2")),
    (500, 150, 52, ("#FFFFFF", "#EAEFFF", "#C6D1FF", "#9DAEF5")),
    (955, 132, 48, ("#FFFFFF", "#EAEFFF", "#C6D1FF", "#9DAEF5")),
]

def island(a, cx, ty, rx, pal):
    top_hi, top_lo, side_hi, side_lo = pal
    ry = rx * .26; h = rx * .16
    top = a.grad(lin([(0, top_hi, 1), (1, top_lo, 1)]))
    side = a.grad(lin([(0, side_hi, 1), (1, side_lo, 1)]))
    rock = a.grad(lin([(0, side_lo, 1), (1, side_lo, 0)]))
    o = F(f"M{cx-rx*.92} {ty+h} Q{cx-rx*.5} {ty+h+rx*.9} {cx} {ty+h+rx*1.15} Q{cx+rx*.5} {ty+h+rx*.9} {cx+rx*.92} {ty+h} Z", rock, 'opacity=".55"')
    o += F(f"M{cx-rx} {ty} V{ty+h} A{rx} {ry} 0 0 0 {cx+rx} {ty+h} V{ty} Z", side)
    o += ell(cx, ty, rx, ry, top)
    # graph-paper top: lines clipped by hand to the ellipse
    for i in range(-3, 4):
        x = cx + i * rx / 4
        dy = ry * math.sqrt(max(0, 1 - ((x - cx) / rx) ** 2)) * .86
        o += S(f"M{x:.1f} {ty-dy:.1f} V{ty+dy:.1f}", C["peri"], 1.4)
    for j in (-1, 0, 1):
        y = ty + j * ry / 2.4
        dx = rx * math.sqrt(max(0, 1 - ((y - ty) / ry) ** 2)) * .9
        o += S(f"M{cx-dx:.1f} {y:.1f} H{cx+dx:.1f}", C["peri"], 1.4)
    o += F(f"M{cx-rx*.8} {ty-ry*.35} A{rx*.8} {ry*.6} 0 0 1 {cx-rx*.1} {ty-ry*.85}", "none") + S(f"M{cx-rx*.78} {ty-ry*.3} Q{cx-rx*.6} {ty-ry*.8} {cx-rx*.2} {ty-ry*.88}", "#FFFFFF", 3, 'opacity=".9"')
    return o

def islands_back():
    a = Art()
    ring = a.grad(lin([(0, "#FFFFFF", .9), (1, "#FFFFFF", .2)], 0, 0, 1, 1))
    ball = a.grad(rad([(0, "#FFFFFF", 1), (.6, "#D6DEFF", 1), (1, "#AFC0FF", 1)], .35, .3, .75))
    pyr_l = a.grad(lin([(0, "#E9EDFF", 1), (1, "#BCC9FF", 1)]))
    pyr_r = a.grad(lin([(0, "#C9D4FF", 1), (1, "#98ABF5", 1)]))
    o = ""
    o += ell(720, 120, 300, 60, "none", f'stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="5 8" opacity=".8"')
    o += ell(720, 120, 420, 96, "none", f'stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="3 9" opacity=".6"')
    o += circ(110, 110, 42, ball) + ell(110, 110, 70, 16, "none", f'stroke="{C["bluel"]}" stroke-width="5" opacity=".6" transform="rotate(-14 110 110)"')
    o += g(F("M0 -46 L40 24 L0 40 Z", pyr_r) + F("M0 -46 L0 40 L-40 24 Z", pyr_l), 1340, 120, rot=8)
    o += ell(380, 80, 30, 30, "none", f'stroke="url(#{ring[5:-1]})" stroke-width="10"')
    o += g(rect(-22, -22, 44, 44, 8, "#FFFFFF", 'opacity=".7"'), 1060, 60, rot=20)
    for x, y, r in ((560, 50, 9), (860, 70, 7), (250, 60, 6), (1240, 40, 8), (40, 220, 6), (1410, 230, 7)):
        o += spark(x, y, r, "#FFFFFF")
    a.add(o); return a.svg(1440, 360)

def islands_front(with_cast=False):
    a = Art()
    for cx, ty, rx, pal in ISLANDS: a.add(island(a, cx, ty, rx, pal))
    a.add(g(o_trophy(), 500 - 30, 150 - 56, .38) + g(o_notebook(), 955 - 28, 132 - 58, .35))
    if with_cast:
        for name, x, y, s in ISLAND_CAST:
            kw = dict(FRIEND_KW[name]) if name in FRIEND_KW else None
            a.add(g(mini(a, **kw) if kw else ezi_inner(a, "wave"), x, y, s / 200))
    return a.svg(1440, 360)

FRIEND_KW = {"friend-mint": dict(skin="mint", top="sprout", eyes="happy", mouth="smile"),
             "friend-coral": dict(skin="coral", top="ears", eyes="open", mouth="open"),
             "friend-violet": dict(skin="violet", top="peak", eyes="wink", mouth="smile"),
             "friend-sun": dict(skin="sun", top="curl", eyes="closed", mouth="smile")}
# (file, x, y, size): shadow (at 0.9·size) lands on the island top
ISLAND_CAST = [("friend-mint", 190, 236 - 108, 120), ("friend-coral", 280, 236 - 94, 104),
               ("ezi-wave", 640, 262 - 151, 168), ("friend-violet", 1085, 228 - 104, 116), ("friend-sun", 1180, 228 - 90, 100)]

if __name__ == "__main__":
    for n, s in (("islands-back", islands_back()), ("islands-front", islands_front()), ("escene-islands", None)):
        if s is None:
            bg = Art(); bg.add(F("M0 0 H1440 V360 H0 Z", bg.grad(lin([(0, "#E8EEFF", 1), (1, "#D4E7FF", 1)]))))
            body = islands_back()[islands_back().index(">") + 1:-6] if False else ""
            s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 360" width="1440" height="360" fill="none">'
                 f'<rect width="1440" height="360" fill="#DCE6FF"/><image href="islands-back.svg" width="1440" height="360"/>'
                 f'<image href="islands-front.svg" width="1440" height="360"/></svg>')
        open(os.path.join(OUT, n + ".svg"), "w").write(s)
    open(os.path.join(OUT, "escene-islands.svg"), "w").write(
        islands_front(True).replace('fill="none">', 'fill="none"><rect width="1440" height="360" fill="#DCE6FF"/>' + islands_back().split('fill="none">', 1)[1].rsplit("</svg>", 1)[0].replace("<defs>", "<defs>"), 1))
