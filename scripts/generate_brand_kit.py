#!/usr/bin/env python3
"""
ThinkLab Digital Solutions - Brand Kit Document Generator
Generates:
  1. ThinkLab_Brand_Kit.doc   (Word-compatible rich document with exact MSO styling, color swatches, and typography)
  2. ThinkLab_Brand_Kit.docx  (Native OpenXML Word Document)
  3. ThinkLab_Brand_Kit.md    (Markdown Brand Guidelines)
"""

import os
import sys
import zipfile
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# 1. Generate ThinkLab_Brand_Kit.doc (Word Document with MSO HTML markup)
# ---------------------------------------------------------------------------
def generate_mso_doc() -> Path:
    doc_path = OUTPUT_DIR / "ThinkLab_Brand_Kit.doc"
    
    html = """<html xmlns:o='urn:schemas-microsoft-com:office:office'
xmlns:w='urn:schemas-microsoft-com:office:word'
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>ThinkLab Digital Solutions — Official Brand Kit</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 8.5in 11.0in;
  margin: 1.0in 1.0in 1.0in 1.0in;
  mso-header-margin: 0.5in;
  mso-footer-margin: 0.5in;
}
body {
  font-family: 'League Spartan', 'Segoe UI', Arial, sans-serif;
  color: #18181b;
  background-color: #ffffff;
  font-size: 11pt;
  line-height: 1.6;
}
h1, h2, h3, h4 {
  font-family: 'League Spartan', 'Segoe UI', Arial, sans-serif;
  color: #18181b;
  font-weight: 700;
  margin-top: 20pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}
h1 {
  font-size: 26pt;
  line-height: 1.15;
  color: #0b0b12;
  border-bottom: 3pt solid #7e6ff0;
  padding-bottom: 8pt;
}
h2 {
  font-size: 18pt;
  color: #18181b;
  border-bottom: 1pt solid #ece9e2;
  padding-bottom: 4pt;
  margin-top: 24pt;
}
h3 {
  font-size: 13pt;
  color: #433f38;
}
p {
  margin-top: 0;
  margin-bottom: 10pt;
}
.mono {
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace;
  font-size: 9.5pt;
  letter-spacing: 0.1em;
  color: #5c584e;
}
.tagline {
  font-size: 13pt;
  color: #7e6ff0;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: 18pt;
}
.callout {
  background-color: #f7f6f2;
  border-left: 4pt solid #7e6ff0;
  padding: 12pt 16pt;
  margin: 14pt 0;
  border-radius: 4pt;
}
table.brand-table {
  width: 100%;
  border-collapse: collapse;
  margin: 14pt 0;
}
table.brand-table th {
  background-color: #0b0b12;
  color: #ffffff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 8pt 10pt;
  text-align: left;
  border: 1pt solid #0b0b12;
}
table.brand-table td {
  padding: 8pt 10pt;
  border: 1pt solid #ece9e2;
  font-size: 10pt;
  vertical-align: middle;
}
table.brand-table tr:nth-child(even) td {
  background-color: #faf9f6;
}
.swatch {
  display: inline-block;
  width: 24pt;
  height: 24pt;
  border-radius: 4pt;
  border: 1pt solid #cfcabd;
  vertical-align: middle;
  margin-right: 8pt;
}
.badge {
  display: inline-block;
  background-color: #eeece5;
  color: #433f38;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8pt;
  padding: 2pt 6pt;
  border-radius: 3pt;
  font-weight: 600;
}
ul, ol {
  margin-top: 0;
  margin-bottom: 12pt;
  padding-left: 20pt;
}
li {
  margin-bottom: 4pt;
}
.footer-text {
  font-size: 8.5pt;
  color: #8c887b;
  text-align: center;
  margin-top: 36pt;
  border-top: 1pt solid #ece9e2;
  padding-top: 10pt;
}
</style>
</head>
<body>

<div style="text-align: center; margin-bottom: 24pt; padding: 20pt 0; background-color: #050505; color: #fcfcf7; border-radius: 8pt;">
  <p class="mono" style="color: #a280ff; font-size: 9pt; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 6pt;">OFFICIAL BRAND GUIDELINES &amp; DESIGN SYSTEM</p>
  <h1 style="color: #ffffff; border-bottom: none; margin: 6pt 0; font-size: 32pt; letter-spacing: -0.02em;">thinklab<span style="color: #7e6ff0;">®</span></h1>
  <p style="font-size: 14pt; color: #c5b0ff; margin-bottom: 4pt; font-weight: 500;">Small spark. Big impact.</p>
  <p class="mono" style="color: #8c887b; font-size: 8.5pt; margin-top: 8pt;">INDIA &harr; AUSTRALIA &nbsp;|&nbsp; VIJAYAWADA &amp; SYDNEY &nbsp;|&nbsp; VERSION 2.0</p>
</div>

<div class="callout">
  <strong>Executive Summary:</strong> ThinkLab Digital Solutions is a full-service digital marketing, engineering, and intelligent automation studio. This document establishes the brand identity, typography hierarchy, primary and neutral color palettes, UI design tokens, and voice standards ensuring consistent, high-impact brand presence across all media.
</div>

<h2>1. Brand Foundation &amp; Positioning</h2>
<p><strong>Brand Name:</strong> Thinklab Digital Solutions (commonly formatted as <em>ThinkLab</em> or <em>thinklab®</em>)</p>
<p><strong>Primary Slogan:</strong> <em>Small spark. Big impact.</em></p>
<p><strong>Supporting Taglines:</strong></p>
<ul>
  <li>"The Right Partner For Digital Growth."</li>
  <li>"Ideas into impact. Independent digital studio."</li>
  <li>"What if became what's next?"</li>
  <li>"One Idea. Infinite Possibilities."</li>
</ul>
<p><strong>Brand Mission:</strong> We combine strategic digital marketing, high-performance web development, CRM integration, and intelligent AI automation to help ambitious businesses increase qualified traffic, generate high-intent leads, and scale predictable revenue.</p>
<p><strong>Dual-Hub Presence:</strong> Operating across Vijayawada, India and Sydney, Australia — offering round-the-clock delivery, international engineering quality, and dedicated client partnership.</p>

<h2>2. Logo &amp; Wordmark Identity</h2>
<table class="brand-table">
  <tr>
    <th width="25%">Asset</th>
    <th width="35%">Appearance &amp; Treatment</th>
    <th width="40%">Application Rules</th>
  </tr>
  <tr>
    <td><strong>Primary Wordmark</strong></td>
    <td><code style="font-size: 13pt; font-weight: 700; color: #18181b;">thinklab®</code></td>
    <td>Always lowercase with registered trademark symbol (®). Minimum clear space: 24px (height of letter 'k'). Minimum digital width: 90px; print width: 25mm.</td>
  </tr>
  <tr>
    <td><strong>Dark Theme Wordmark</strong></td>
    <td><code style="font-size: 13pt; font-weight: 700; color: #fcfcf7; background: #050505; padding: 2pt 6pt; border-radius: 3pt;">thinklab®</code></td>
    <td>Used on cinematic dark canvases, hero lightbulb background (#050505), navigation headers, and footer cards.</td>
  </tr>
  <tr>
    <td><strong>Favicon / App Icon</strong></td>
    <td>Glowing nucleus &amp; filament spark icon</td>
    <td>Used for browser tabs, social avatars, mobile web app manifests, and Apple touch icons.</td>
  </tr>
</table>

<div class="callout" style="border-left-color: #f7ad85; background-color: #fff9f5;">
  <strong>Logo Don'ts:</strong>
  <ul>
    <li>Do NOT capitalize to "THINKLAB" in the wordmark logo presentation.</li>
    <li>Do NOT remove the registered trademark symbol (®).</li>
    <li>Do NOT distort, rotate, stretch, or apply unauthorized drop-shadows.</li>
    <li>Do NOT place the dark wordmark over low-contrast purple or charcoal without proper contrast.</li>
  </ul>
</div>

<h2>3. Color Palette &amp; Design Tokens</h2>
<p>The ThinkLab aesthetic balances <strong>warm editorial paper &amp; cream</strong> with <strong>cinematic dark void</strong> and <strong>electric purple glows</strong>.</p>

<h3>A. Core Brand Accents (The Spark &amp; Energy)</h3>
<table class="brand-table">
  <tr>
    <th width="18%">Color Name</th>
    <th width="15%">HEX</th>
    <th width="20%">RGB</th>
    <th width="22%">Token / Role</th>
    <th width="25%">Usage</th>
  </tr>
  <tr>
    <td><strong>Electric Violet</strong></td>
    <td><span class="swatch" style="background-color: #7e6ff0;"></span><code>#7E6FF0</code></td>
    <td>126, 111, 240</td>
    <td><code>--color-brand-primary</code></td>
    <td>Core brand color, hero highlights, glowing accents, primary badges.</td>
  </tr>
  <tr>
    <td><strong>Deep Spark Purple</strong></td>
    <td><span class="swatch" style="background-color: #644be2;"></span><code>#644BE2</code></td>
    <td>100, 75, 226</td>
    <td><code>--color-brand-vibrant</code></td>
    <td>Interactive hover states, active links, primary CTA gradient stops.</td>
  </tr>
  <tr>
    <td><strong>Soft Lilac Glow</strong></td>
    <td><span class="swatch" style="background-color: #a280ff;"></span><code>#A280FF</code></td>
    <td>162, 128, 255</td>
    <td><code>--color-brand-glow</code></td>
    <td>Pulsing cursor rings, accent borders, glowing ring animations.</td>
  </tr>
  <tr>
    <td><strong>Pale Lavender</strong></td>
    <td><span class="swatch" style="background-color: #c5b0ff;"></span><code>#C5B0FF</code></td>
    <td>197, 176, 255</td>
    <td><code>--color-brand-light</code></td>
    <td>Emphasized text within dark headers, subtle glows, chip highlights.</td>
  </tr>
</table>

<h3>B. Editorial Warm Paper Palette (Light Mode / Content Sections)</h3>
<table class="brand-table">
  <tr>
    <th width="18%">Color Name</th>
    <th width="15%">HEX</th>
    <th width="20%">RGB</th>
    <th width="22%">Token / Role</th>
    <th width="25%">Usage</th>
  </tr>
  <tr>
    <td><strong>Warm Canvas</strong></td>
    <td><span class="swatch" style="background-color: #f7f6f2;"></span><code>#F7F6F2</code></td>
    <td>247, 246, 242</td>
    <td><code>--color-paper-canvas</code></td>
    <td>Editorial background for services, reviews, FAQ, and email notifications.</td>
  </tr>
  <tr>
    <td><strong>Pure Paper Card</strong></td>
    <td><span class="swatch" style="background-color: #ffffff;"></span><code>#FFFFFF</code></td>
    <td>255, 255, 255</td>
    <td><code>--color-paper-card</code></td>
    <td>Content cards, input surfaces, review cards, elevated containers.</td>
  </tr>
  <tr>
    <td><strong>Paper Inset</strong></td>
    <td><span class="swatch" style="background-color: #faf9f6;"></span><code>#FAF9F6</code></td>
    <td>250, 249, 246</td>
    <td><code>--color-paper-inset</code></td>
    <td>Sub-containers, message quotes, inner preview panes.</td>
  </tr>
  <tr>
    <td><strong>Hairline Divider</strong></td>
    <td><span class="swatch" style="background-color: #ece9e2;"></span><code>#ECE9E2</code></td>
    <td>236, 233, 226</td>
    <td><code>--color-paper-border</code></td>
    <td>Card outlines, subtle table borders, editorial divider lines.</td>
  </tr>
  <tr>
    <td><strong>Chip / Tag Neutral</strong></td>
    <td><span class="swatch" style="background-color: #eeece5;"></span><code>#EEECE5</code></td>
    <td>238, 236, 229</td>
    <td><code>--color-paper-chip</code></td>
    <td>Pill badges, category tags, filter buttons.</td>
  </tr>
</table>

<h3>C. Cinematic Void &amp; Dark Canvas (Dark Mode / Hero &amp; Finale)</h3>
<table class="brand-table">
  <tr>
    <th width="18%">Color Name</th>
    <th width="15%">HEX</th>
    <th width="20%">RGB</th>
    <th width="22%">Token / Role</th>
    <th width="25%">Usage</th>
  </tr>
  <tr>
    <td><strong>Void Black</strong></td>
    <td><span class="swatch" style="background-color: #050505;"></span><code>#050505</code></td>
    <td>5, 5, 5</td>
    <td><code>--color-void</code></td>
    <td>Cinematic 3D hero background, finale banner, page margins.</td>
  </tr>
  <tr>
    <td><strong>Midnight Charcoal</strong></td>
    <td><span class="swatch" style="background-color: #0b0b12;"></span><code>#0B0B12</code></td>
    <td>11, 11, 18</td>
    <td><code>--color-void-panel</code></td>
    <td>"What if became what's next?" orbit banner, dark glass cards.</td>
  </tr>
  <tr>
    <td><strong>Dark Card Surface</strong></td>
    <td><span class="swatch" style="background-color: #16161d;"></span><code>#16161D</code></td>
    <td>22, 22, 29</td>
    <td><code>--color-void-card</code></td>
    <td>Elevated cards in dark sections, dropdown menus, dialog windows.</td>
  </tr>
  <tr>
    <td><strong>Soft Off-White Text</strong></td>
    <td><span class="swatch" style="background-color: #fcfcf7;"></span><code>#FCFCF7</code></td>
    <td>252, 252, 247</td>
    <td><code>--color-text-dark-primary</code></td>
    <td>High-contrast text on dark backgrounds, hero headline text.</td>
  </tr>
  <tr>
    <td><strong>Muted Purple Grey</strong></td>
    <td><span class="swatch" style="background-color: #9a97a8;"></span><code>#9A97A8</code></td>
    <td>154, 151, 168</td>
    <td><code>--color-text-dark-muted</code></td>
    <td>Secondary body text, labels, and descriptions on dark backgrounds.</td>
  </tr>
</table>

<h2>4. Typography System</h2>
<table class="brand-table">
  <tr>
    <th width="22%">Role</th>
    <th width="25%">Font Family</th>
    <th width="23%">Weights &amp; Styling</th>
    <th width="30%">Target Applications</th>
  </tr>
  <tr>
    <td><strong>Primary Brand Font (Headings &amp; Body)</strong></td>
    <td><strong>League Spartan</strong><br><span class="badge">Google Fonts</span></td>
    <td>Bold (700)<br>SemiBold (600)<br>Medium (500)<br>Regular (400)</td>
    <td>All page headlines, section titles, card headers, primary paragraphs, CTAs, button labels, and contact forms.</td>
  </tr>
  <tr>
    <td><strong>Technical &amp; Metadata Font</strong></td>
    <td><strong>IBM Plex Mono</strong><br><span class="badge">Google Fonts</span></td>
    <td>Medium (500)<br>Regular (400)<br>Uppercase with tracking: <code>0.24em - 0.34em</code></td>
    <td>Eyebrow subtitles (e.g. <code>LET’S START SOMETHING</code>), step indices (<code>01</code>, <code>02</code>), statistics labels, coordinates.</td>
  </tr>
  <tr>
    <td><strong>Preserved Signature Display</strong></td>
    <td><strong>Space Grotesk</strong><br><span class="badge">Google Fonts</span></td>
    <td>Medium (500)<br>SemiBold (600)</td>
    <td>Preserved exclusively for signature identity anchors: "This is Thinklab" and "ONE IDEA. INFINITE POSSIBILITIES."</td>
  </tr>
</table>

<h3>Type Hierarchy &amp; Scale Guide</h3>
<ul>
  <li><strong>Display / Hero Headline:</strong> 48pt – 72pt (Clamp 3rem to 7.5rem), League Spartan Bold (700), tight letter-spacing (<code>-0.02em</code>), line-height <code>1.05</code>.</li>
  <li><strong>Section Title (H2):</strong> 28pt – 40pt, League Spartan SemiBold (600), line-height <code>1.2</code>.</li>
  <li><strong>Card Title (H3):</strong> 18pt – 24pt, League Spartan SemiBold (600), line-height <code>1.3</code>.</li>
  <li><strong>Eyebrow / Sub-label:</strong> 9pt – 10pt, IBM Plex Mono Medium (500), Uppercase, letter-spacing <code>0.28em</code>, Electric Violet (<code>#7E6FF0</code>).</li>
  <li><strong>Body Text:</strong> 11pt – 12pt, League Spartan Regular (400) or Medium (500), line-height <code>1.65</code>.</li>
  <li><strong>Form Labels &amp; Captions:</strong> 9pt – 10.5pt, uppercase tracking with clear <code>* Required</code> indicators.</li>
</ul>

<h2>5. UI Components &amp; Interaction Guidelines</h2>
<ul>
  <li><strong>Buttons &amp; CTAs:</strong>
    <ul>
      <li>Pill-shaped (<code>border-radius: 9999px</code>) or smooth modern curves (<code>border-radius: 12px</code>).</li>
      <li>Sheen highlight animation across glass buttons on hover.</li>
      <li>Accent CTA: Dark charcoal or void pill with crisp white text and trailing arrow (<code>&rarr;</code> or <code>&#8599;</code>).</li>
    </ul>
  </li>
  <li><strong>Cards &amp; Panels:</strong>
    <ul>
      <li>Light cards: Pure white with <code>1px solid #ECE9E2</code> hairline borders and soft ambient blur shadows.</li>
      <li>Dark cards: Midnight charcoal (<code>#0B0B12</code>) with <code>1px solid rgba(255, 255, 255, 0.08)</code>.</li>
    </ul>
  </li>
  <li><strong>Interactive Motifs:</strong>
    <ul>
      <li><strong>The Glowing Bulb:</strong> 3D filament that brightens as visitors scroll ("Scroll to Ignite").</li>
      <li><strong>Expanding Orbit Rings:</strong> Concentric purple circular waves representing expanding digital reach.</li>
      <li><strong>Precision Custom Cursor:</strong> Dynamic cursor featuring a glowing dot and orbiting purple ring with fine pointer tracking.</li>
      <li><strong>Horizontal Marquee:</strong> Smooth infinite horizontal loop (38s linear timing) for client testimonials and partner reviews.</li>
    </ul>
  </li>
</ul>

<h2>6. Voice, Tone &amp; Editorial Standards</h2>
<table class="brand-table">
  <tr>
    <th width="25%">Pillar</th>
    <th width="35%">What It Means</th>
    <th width="40%">Example Tone</th>
  </tr>
  <tr>
    <td><strong>Visionary yet Pragmatic</strong></td>
    <td>We dream big with creative direction, but every single strategy is grounded in commercial viability and data.</td>
    <td><em>"A little curiosity. A whole new possibility."</em></td>
  </tr>
  <tr>
    <td><strong>Direct &amp; Confident</strong></td>
    <td>No marketing jargon, no buzzwords. We speak clearly about systems, pipelines, and measurable outcomes.</td>
    <td><em>"We grow your business with SEO, performance campaigns, and high-converting websites that bring real leads."</em></td>
  </tr>
  <tr>
    <td><strong>Methodical &amp; Transparent</strong></td>
    <td>We act as trusted technical partners rather than transactional vendors.</td>
    <td><em>"Transparent reporting, continuous optimisation, response within one business day."</em></td>
  </tr>
</table>

<h2>7. Official Contact &amp; Governance</h2>
<p>For brand inquiries, asset approvals, and official communications:</p>
<table class="brand-table">
  <tr>
    <td width="30%"><strong>Legal Entity</strong></td>
    <td>ThinkLab Digital Solutions</td>
  </tr>
  <tr>
    <td><strong>Website</strong></td>
    <td><a href="https://www.thinklabdigitalsolutions.com">https://www.thinklabdigitalsolutions.com</a></td>
  </tr>
  <tr>
    <td><strong>General Inquiries</strong></td>
    <td><code>info@thinklabdigitalsolutions.com</code></td>
  </tr>
  <tr>
    <td><strong>Direct Telephone</strong></td>
    <td><code>+91 93475 80911</code></td>
  </tr>
  <tr>
    <td><strong>Locations</strong></td>
    <td>Vijayawada, India &amp; Sydney, Australia</td>
  </tr>
</table>

<div class="footer-text">
  &copy; 2026 ThinkLab Digital Solutions. All rights reserved. &middot; Confidential Brand Guidelines Document.
</div>

</body>
</html>
"""
    doc_path.write_text(html, encoding="utf-8")
    print(f"Generated MSO Word Document: {doc_path} ({doc_path.stat().st_size} bytes)")
    return doc_path


# ---------------------------------------------------------------------------
# 2. Generate ThinkLab_Brand_Kit.docx (Native OpenXML Word Document)
# ---------------------------------------------------------------------------
def generate_openxml_docx() -> Path:
    docx_path = OUTPUT_DIR / "ThinkLab_Brand_Kit.docx"
    
    # OpenXML Structure files
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="League Spartan" w:hAnsi="League Spartan" w:cs="League Spartan"/>
        <w:sz w:val="22"/>
        <w:color w:val="18181B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>"""

    # Helper to generate docx runs
    def p(text, bold=False, italic=False, color="18181B", size=22, font="League Spartan", space_after=160, align="left"):
        jc = f'<w:jc w:val="{align}"/>' if align != "left" else ''
        b = '<w:b/>' if bold else ''
        i = '<w:i/>' if italic else ''
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:after="{space_after}"/>
    {jc}
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>
      {b}
      {i}
      <w:color w:val="{color}"/>
      <w:sz w:val="{size}"/>
    </w:rPr>
    <w:t xml:space="preserve">{text}</w:t>
  </w:r>
</w:p>"""

    def h1(text):
        return p(text, bold=True, color="0B0B12", size=48, space_after=240)

    def h2(text):
        return p(text, bold=True, color="18181B", size=34, space_after=180)

    def h3(text):
        return p(text, bold=True, color="433F38", size=26, space_after=120)

    def bullet(text, bold_prefix="", font="League Spartan"):
        prefix_xml = f"""<w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:b/><w:color w:val="18181B"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">{bold_prefix} </w:t></w:r>""" if bold_prefix else ""
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:after="80"/>
    <w:ind w:left="400"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>
      <w:color w:val="7E6FF0"/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">&#8226;  </w:t>
  </w:r>
  {prefix_xml}
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>
      <w:color w:val="2B2A27"/>
      <w:sz w:val="22"/>
    </w:rPr>
    <w:t xml:space="preserve">{text}</w:t>
  </w:r>
</w:p>"""

    body_elements = [
        p("OFFICIAL BRAND GUIDELINES &amp; DESIGN SYSTEM", bold=True, color="7E6FF0", size=18, font="IBM Plex Mono", space_after=80, align="center"),
        p("thinklab®", bold=True, color="050505", size=60, font="League Spartan", space_after=100, align="center"),
        p("Small spark. Big impact.", bold=True, italic=True, color="644BE2", size=26, font="League Spartan", space_after=120, align="center"),
        p("INDIA &#8596; AUSTRALIA  |  VIJAYAWADA &amp; SYDNEY  |  VERSION 2.0", color="8C887B", size=18, font="IBM Plex Mono", space_after=400, align="center"),

        h1("1. Brand Overview &amp; Positioning"),
        p("ThinkLab Digital Solutions is a full-service digital marketing, engineering, and intelligent automation studio. We empower scaling businesses by combining bespoke creative design, high-performance website engineering, performance campaigns, and automated sales/CRM workflows."),
        bullet("Small spark. Big impact.", "Core Tagline:"),
        bullet("The Right Partner For Digital Growth.", "Value Proposition:"),
        bullet("Ideas into impact. Independent digital studio.", "Brand Descriptor:"),
        bullet("What if became what's next?", "Campaign Hook:"),
        bullet("One Idea. Infinite Possibilities.", "Signature Finale:"),

        h1("2. Logo &amp; Wordmark Identity"),
        bullet("Official format: 'thinklab®' — strictly lowercase with registered trademark symbol (®).", "Wordmark:"),
        bullet("Never capitalize to 'THINKLAB' or 'ThinkLab' in the logo mark presentation.", "Rule:"),
        bullet("Minimum clear space around logo: height of letter 'k' (24px padding).", "Exclusion Zone:"),
        bullet("Digital screens: 90px width; Print collateral: 25mm width.", "Minimum Scale:"),
        bullet("Light backgrounds: Deep Obsidian Ink (#18181B); Dark backgrounds: Soft Off-White (#FCFCF7).", "Variants:"),

        h1("3. Color Palette &amp; Design Tokens"),
        h2("A. Brand Violet &amp; Spark Accents"),
        bullet("#7E6FF0 (RGB: 126, 111, 240) — Core Brand Color, glowing orbs, primary badges.", "Electric Violet:"),
        bullet("#644BE2 (RGB: 100, 75, 226) — Interactive buttons, links, CTA hover states.", "Deep Spark Purple:"),
        bullet("#A280FF (RGB: 162, 128, 255) — Pulsing cursor outer ring, accent badge pills.", "Soft Lilac Glow:"),
        bullet("#C5B0FF (RGB: 197, 176, 255) — Emphasized heading phrases, subtle glows.", "Pale Lavender:"),

        h2("B. Editorial Warm Paper Palette (Light Mode)"),
        bullet("#F7F6F2 (RGB: 247, 246, 242) — Editorial canvas for services, reviews, and FAQ.", "Warm Canvas:"),
        bullet("#FFFFFF (RGB: 255, 255, 255) — Content cards, input fields, testimonial blocks.", "Pure Paper Card:"),
        bullet("#FAF9F6 (RGB: 250, 249, 246) — Inset boxes, message quotes, inner previews.", "Paper Inset:"),
        bullet("#ECE9E2 (RGB: 236, 233, 226) — Clean card dividers, subtle borders.", "Hairline Divider:"),
        bullet("#EEECE5 (RGB: 238, 236, 229) — Tag chips, category pills.", "Neutral Chip:"),

        h2("C. Cinematic Void &amp; Dark Palette (Dark Mode)"),
        bullet("#050505 (RGB: 5, 5, 5) — 3D lightbulb hero canvas, page finale.", "Void Black:"),
        bullet("#0B0B12 (RGB: 11, 11, 18) — 'What if became what's next?' banner background.", "Midnight Charcoal:"),
        bullet("#16161D (RGB: 22, 22, 29) — Dark mode cards, modals, navigation menus.", "Dark Card Surface:"),
        bullet("#FCFCF7 (RGB: 252, 252, 247) — High-contrast headline text on dark void.", "Soft Off-White:"),
        bullet("#9A97A8 (RGB: 154, 151, 168) — Secondary body and label text.", "Muted Purple Grey:"),

        h1("4. Typography System"),
        h2("Primary Typeface: League Spartan"),
        p("League Spartan is the primary brand typeface for all digital and print materials. A bold, geometric, confident sans-serif designed for modern impact."),
        bullet("All H1-H6 headings, hero displays, button text, body copy, and input fields.", "Applied To:"),
        bullet("Bold (700), SemiBold (600), Medium (500), Regular (400).", "Key Weights:"),

        h2("Monospace &amp; Technical Typeface: IBM Plex Mono"),
        p("IBM Plex Mono conveys technical rigor, precision, and engineering discipline."),
        bullet("Eyebrows (e.g. 'LET’S START SOMETHING'), step indices ('01', '02'), statistics counters.", "Applied To:"),
        bullet("Always UPPERCASE with wide letter-spacing (0.24em - 0.34em).", "Styling:"),

        h2("Preserved Signature Heritage: Space Grotesk"),
        p("Preserved strictly for signature heritage anchors: 'This is Thinklab' and 'ONE IDEA. INFINITE POSSIBILITIES.'"),

        h1("5. UI Components &amp; Interaction Motifs"),
        bullet("Pill-shaped (rounded-full) with subtle glass sheen highlight and directional arrows.", "Buttons &amp; CTAs:"),
        bullet("The Glowing Lightbulb 3D canvas that ignites dynamically as visitors scroll.", "The Filament:"),
        bullet("Concentric purple rings symbolizing expanding impact and infinite digital reach.", "Orbit Rings:"),
        bullet("Fine custom cursor with magnetic trailing glow ring.", "Interactive Cursor:"),
        bullet("Seamless 38s linear infinite horizontal loop with pause-on-hover.", "Testimonials:"),

        h1("6. Contact &amp; Governance"),
        bullet("ThinkLab Digital Solutions", "Company:"),
        bullet("https://www.thinklabdigitalsolutions.com", "Website:"),
        bullet("info@thinklabdigitalsolutions.com", "Email:"),
        bullet("+91 93475 80911", "Phone:"),
        bullet("Vijayawada, India &amp; Sydney, Australia", "Hubs:"),
        p(""),
        p("© 2026 ThinkLab Digital Solutions. All rights reserved.", color="8C887B", size=18, font="IBM Plex Mono", align="center")
    ]

    doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {''.join(body_elements)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(docx_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/document.xml", doc_xml)

    print(f"Generated Native DOCX Document: {docx_path} ({docx_path.stat().st_size} bytes)")
    return docx_path


# ---------------------------------------------------------------------------
# 3. Generate ThinkLab_Brand_Kit.md (Markdown)
# ---------------------------------------------------------------------------
def generate_markdown() -> Path:
    md_path = OUTPUT_DIR / "ThinkLab_Brand_Kit.md"
    content = """# ThinkLab Digital Solutions — Official Brand Kit & Guidelines
> **Small spark. Big impact.**  
> *India ↔ Australia | Vijayawada & Sydney*  
> *Version 2.0 (November 2026)*

---

## 1. Brand Overview & Positioning

- **Company Name:** ThinkLab Digital Solutions (styled as `thinklab®`)
- **Brand Purpose:** Independent digital studio & growth accelerator combining strategic digital marketing, high-performance web engineering, CRM architectures, and AI workflow automations.
- **Brand Slogan:** `Small spark. Big impact.`
- **Value Proposition:** `The Right Partner For Digital Growth.`
- **Brand Descriptors:**
  - *"Ideas into impact. Independent digital studio."*
  - *"What if became what's next?"*
  - *"One Idea. Infinite Possibilities."*
- **Operating Hubs:** Dual presence across Vijayawada (India) and Sydney (Australia).

---

## 2. Logo & Wordmark Identity

| Asset | Rendering | Specifications & Rules |
| :--- | :--- | :--- |
| **Primary Wordmark** | `thinklab®` | All lowercase. Registered trademark (®) included. Minimum exclusion space: 24px (height of 'k'). |
| **Dark Canvas Variant** | `thinklab®` (White on `#050505`) | Used on cinematic dark sections, hero headers, navigation, and finale. |
| **Light Canvas Variant**| `thinklab®` (Ink on `#F7F6F2`) | Used on paper-light sections, stationery, and document exports. |
| **Favicon & App Icon** | Glowing Filament Spark | Used for web browser tabs, mobile bookmarks, and social avatars. |

### Logo Usage Rules
1. **Never** capitalize the wordmark to "THINKLAB" or "ThinkLab" in the logo presentation.
2. **Never** remove the registered trademark symbol (`®`).
3. **Never** stretch, rotate, distort, or apply unapproved glow filters.
4. **Always** maintain minimum clear space equal to the height of the letter "k".

---

## 3. Color Palette & Design Tokens

### A. Core Brand Accents (The Spark)
| Name | HEX | RGB | Design Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Electric Violet** | `#7E6FF0` | `rgb(126, 111, 240)` | `--color-brand-primary` | Core accent, hero highlights, glow effects |
| **Deep Spark Purple** | `#644BE2` | `rgb(100, 75, 226)` | `--color-brand-vibrant` | Button hovers, active links, primary CTA gradient |
| **Soft Lilac Glow** | `#A280FF` | `rgb(162, 128, 255)` | `--color-brand-glow` | Cursor ring, badge outlines, orbit ring glow |
| **Pale Lavender** | `#C5B0FF` | `rgb(197, 176, 255)` | `--color-brand-light` | Emphasized text on dark canvases |

### B. Editorial Warm Paper Palette (Light Mode)
| Name | HEX | RGB | Design Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Warm Canvas** | `#F7F6F2` | `rgb(247, 246, 242)` | `--color-paper-canvas` | Main background for services, reviews, FAQ |
| **Pure Paper Card** | `#FFFFFF` | `rgb(255, 255, 255)` | `--color-paper-card` | Content cards, input fields, elevated containers |
| **Paper Inset** | `#FAF9F6` | `rgb(250, 249, 246)` | `--color-paper-inset` | Quotes, testimonials, message backgrounds |
| **Hairline Divider** | `#ECE9E2` | `rgb(236, 233, 226)` | `--color-paper-border` | Subtle borders, table dividers, card outlines |
| **Neutral Chip** | `#EEECE5` | `rgb(238, 236, 229)` | `--color-paper-chip` | Tags, category pills, badge backgrounds |

### C. Cinematic Void Palette (Dark Mode)
| Name | HEX | RGB | Design Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Void Black** | `#050505` | `rgb(5, 5, 5)` | `--color-void` | 3D Hero background, page finale |
| **Midnight Charcoal**| `#0B0B12` | `rgb(11, 11, 18)` | `--color-void-panel` | "What if became what's next?" banner |
| **Dark Card Surface**| `#16161D` | `rgb(22, 22, 29)` | `--color-void-card` | Dark cards, modals, navigation menu |
| **Soft Off-White** | `#FCFCF7` | `rgb(252, 252, 247)` | `--color-text-dark-primary`| Primary typography on dark backgrounds |
| **Muted Grey** | `#9A97A8` | `rgb(154, 151, 168)` | `--color-text-dark-muted` | Secondary body text on dark backgrounds |

---

## 4. Typography Guidelines

### Primary Font: League Spartan
- **Classification:** Geometric Display Sans-Serif
- **Role:** Primary brand font applied globally to all H1–H6 headings, hero displays, button text, form inputs, and body text.
- **Weights:** 
  - Bold (`700`) — Headings, titles, statistics
  - SemiBold (`600`) — Card headers, subheadings
  - Medium (`500`) — Buttons, navigation, input labels
  - Regular (`400`) — Body copy, descriptions

### Metadata & Technical Font: IBM Plex Mono
- **Classification:** Engineered Monospace
- **Role:** Sub-headers, eyebrows, metrics labels, step indicators (`01`, `02`), coordinates (`INDIA ↔ AUSTRALIA`).
- **Styling:** Uppercase with extended tracking (`letter-spacing: 0.24em - 0.34em`).

### Heritage Display Font: Space Grotesk
- **Classification:** Neo-Grotesque Display
- **Role:** Preserved exclusively for signature identity anchors:
  - *"This is Thinklab"*
  - *"ONE IDEA. INFINITE POSSIBILITIES."*

---

## 5. UI Design Tokens & Components

- **CTAs & Buttons:** Pill-shaped (`rounded-full`) or smooth rounded (`rounded-xl`) with glass sheen animations and trailing directional arrows (`→` or `↗`).
- **Cards:** Hairline-bordered cards (`1px solid #ECE9E2` in light mode; `1px solid rgba(255, 255, 255, 0.08)` in dark mode).
- **Interactive Cursor:** Custom precision cursor with magnetic dot and trailing glowing lilac ring.
- **Signature Visuals:**
  - *The Filament Bulb:* 3D canvas lightbulb that ignites on scroll.
  - *Expanding Orbit Rings:* Concentric purple ripples in the "What if became what's next?" banner.
  - *Testimonial Marquee:* Smooth 38s linear horizontal scrolling deck.

---

## 6. Official Contact & Verification

- **Legal Entity:** ThinkLab Digital Solutions
- **Website:** [https://www.thinklabdigitalsolutions.com](https://www.thinklabdigitalsolutions.com)
- **General Inquiries:** `info@thinklabdigitalsolutions.com`
- **Phone:** `+91 93475 80911`
- **Offices:** Vijayawada (India) & Sydney (Australia)

---
*© 2026 ThinkLab Digital Solutions. All rights reserved.*
"""
    md_path.write_text(content, encoding="utf-8")
    print(f"Generated Markdown Brand Kit: {md_path} ({md_path.stat().st_size} bytes)")
    return md_path


def main():
    print("Generating ThinkLab Brand Kit in DOC, DOCX, and MD formats...")
    doc = generate_mso_doc()
    docx = generate_openxml_docx()
    md = generate_markdown()
    print("Done! All documents created successfully.")


if __name__ == "__main__":
    main()
