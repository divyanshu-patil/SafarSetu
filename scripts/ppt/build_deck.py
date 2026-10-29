#!/usr/bin/env python3
"""Fill the Seva First template from deck.json -> submission/*.pptx + .pdf. Run: python3 scripts/ppt/build_deck.py"""
import copy, json, os, subprocess, sys
from pptx import Presentation
from pptx.util import Inches
from pptx.oxml.ns import qn
from lxml import etree

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATE = f"{ROOT}/Seva-First-Innovation-Challenge-PPT-Template.pptx"
OUT = f"{ROOT}/submission/SafarSetu-Seva-First-Pitch"
SOFFICE = os.environ.get("SOFFICE", "/opt/homebrew/bin/soffice")
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
GREY, BODY = "6B7280", "1F2937"  # template placeholder grey -> template body-text colour


def restyle_placeholder(r):
    """Grey italic placeholder run -> normal body colour, upright. Other colours (on dark cards) untouched."""
    rpr = r.find(qn("a:rPr"))
    c = rpr.find(".//" + qn("a:srgbClr"))
    if c is not None and c.get("val") == GREY and rpr.get("i") == "1":
        c.set("val", BODY)
        del rpr.attrib["i"]


def set_paras(txBody, paras):
    """Replace text, cloning the first paragraph + first run (formatting preserved)."""
    ps = txBody.findall(qn("a:p"))
    proto = copy.deepcopy(ps[0])
    runs = proto.findall(qn("a:r"))
    if not runs:
        return
    for r in runs[1:]:
        proto.remove(r)
    restyle_placeholder(runs[0])
    for p in ps:
        txBody.remove(p)
    if isinstance(paras, str):
        paras = paras.split("\n")
    for t in paras:
        p = copy.deepcopy(proto)
        if t.startswith("• "):
            t = t[2:]
            ppr = p.find(qn("a:pPr"))
            ppr.set("marL", "128016"); ppr.set("indent", "-128016")
            for b in ppr.findall(qn("a:buNone")):
                ppr.remove(b)
            bu = etree.SubElement(ppr, qn("a:buChar")); bu.set("char", "•")
        p.find(qn("a:r")).find(qn("a:t")).text = t
        txBody.append(p)


def tick(shape, size):
    """Selected state: orange fill (template accent) + white bold check mark."""
    sp = shape._element
    sf = sp.find(qn("p:spPr")).find(qn("a:solidFill"))
    sf.find(qn("a:srgbClr")).set("val", "F28C28")
    tb = sp.find(qn("p:txBody"))
    bp = tb.find(qn("a:bodyPr"))
    for k in ("lIns", "tIns", "rIns", "bIns"):
        bp.set(k, "0")
    bp.set("anchor", "ctr")
    for p in tb.findall(qn("a:p")):
        tb.remove(p)
    tb.append(etree.fromstring(
        f'<a:p xmlns:a="{A}"><a:pPr algn="ctr"/><a:r><a:rPr lang="en-US" sz="{size}" b="1" dirty="0">'
        f'<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="Nirmala UI"/>'
        f'<a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:rPr><a:t>✔</a:t></a:r></a:p>'))


def add_images(slide):
    """Up to 2 screenshots from docs/media in the free area freed by the removed guidance box."""
    imgs = [f"{ROOT}/docs/media/{n}.png" for n in ("hero", "live", "authority", "report")]
    imgs = [i for i in imgs if os.path.exists(i)][:2]
    if not imgs:
        return
    from PIL import Image
    X0, Y0, W, H, GAP = 6.4, 0.85, 3.1, 3.4, 0.12
    cell_h = (H - GAP * (len(imgs) - 1)) / len(imgs)
    for k, path in enumerate(imgs):
        w, h = Image.open(path).size
        s = min(W / w, cell_h / h)
        pw, ph = w * s, h * s
        slide.shapes.add_picture(path, Inches(X0 + (W - pw) / 2), Inches(Y0 + k * (cell_h + GAP)), Inches(pw), Inches(ph))


def to_pdf(src, dst):
    """LibreOffice if it really runs (the Homebrew cask on this Mac is a dangling link), else Keynote via AppleScript."""
    if subprocess.run([SOFFICE, "--version"], capture_output=True).returncode == 0:
        subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", os.path.dirname(dst), src],
                       check=True, capture_output=True)
        return
    script = (f'tell application "Keynote"\nactivate\nopen POSIX file "{src}"\ndelay 3\n'
              f'export front document to POSIX file "{dst}" as PDF\nclose front document saving no\nend tell')
    subprocess.run(["osascript", "-e", script], check=True)


def main():
    deck = json.load(open(f"{ROOT}/scripts/ppt/deck.json"))["slides"]
    prs = Presentation(TEMPLATE)
    for n, slide in enumerate(prs.slides, 1):
        spec = deck.get(str(n), {})
        by = {s.name: s for s in slide.shapes}
        if n == 1:
            for nm in ("Shape 15", "Text 16", "Text 17"):
                by[nm]._element.getparent().remove(by[nm]._element)
            add_images(slide)
        for k, v in spec.items():
            if k == "table":
                tbl = [s for s in slide.shapes if s.has_table][0].table
                for ri, row in enumerate(v):
                    for ci, t in enumerate(row):
                        if t:
                            set_paras(tbl.cell(ri, ci)._tc.find(qn("a:txBody")), t)
            elif k == "ticks":
                for nm in v:
                    tick(by[nm], 1200 if n == 4 else 900)
            elif not k.startswith("_"):
                set_paras(by[k]._element.find(qn("p:txBody")), v)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs.save(OUT + ".pptx")
    to_pdf(OUT + ".pptx", OUT + ".pdf")
    mb = os.path.getsize(OUT + ".pdf") / 1e6
    print(f"PDF {mb:.2f} MB")
    assert mb < 10, "PDF over 10 MB"


if __name__ == "__main__":
    main()
