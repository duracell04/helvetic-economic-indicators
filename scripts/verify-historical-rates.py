"""Check retained SNB table 1.1 figures against a supplied original PDF.
Requires pypdf and pdfplumber; both independent extractions must agree.
Usage: python3 scripts/verify-historical-rates.py original.pdf
"""
import csv,hashlib,json,re,sys
from pathlib import Path
from pypdf import PdfReader
import pdfplumber
recipe=json.loads(Path('data/extractions/snb-discount-rate.json').read_text())
if hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()!=recipe['publisher_pdf_sha256']:raise ValueError('Publisher PDF checksum mismatch')
def cells(text):
 return [re.sub(r'\s+',' ',line.strip()).split(' ') for line in text.splitlines() if re.fullmatch(r'\s*\d{4}\s+(?:\d+\.\d{3}|\.)\s+(?:\d+\.\d{3}|\.)\s+(?:\d+\.\d{3}|\.)\s*',line)]
r=PdfReader(sys.argv[1]);first=[row for page in [25,26] for row in cells(r.pages[page].extract_text(extraction_mode='layout'))]
with pdfplumber.open(sys.argv[1]) as p:second=[row for page in [25,26] for row in cells(p.pages[page].extract_text())]
checked=list(csv.reader(Path(recipe['original_file']).open()))[1:]
if len(first)!=100 or first!=second or first!=checked:raise ValueError('Historical table figures do not match both PDF extractors')
print('All 100 table rows match both publisher-PDF extractions')
