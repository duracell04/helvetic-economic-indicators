"""Extract audited publisher cells/series without live downloads or numeric rounding.
Usage: python3 scripts/prepare-extract.py spec.json publisher-file output.csv
Only Python's standard library is required. Each spec pins original SHA-256.
"""
import csv,hashlib,json,sys,zipfile,xml.etree.ElementTree as E
from pathlib import Path
spec=json.loads(Path(sys.argv[1]).read_text());data=Path(sys.argv[2]).read_bytes()
if hashlib.sha256(data).hexdigest()!=spec['original_sha256']:raise ValueError('Original publisher checksum mismatch')
rows=[]
if spec['format']=='xlsx':
 ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/package/2006/relationships'}
 with zipfile.ZipFile(Path(sys.argv[2])) as z:
  shared=[''.join(s.itertext()) for s in E.fromstring(z.read('xl/sharedStrings.xml')).findall('x:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
  sheets=E.fromstring(z.read('xl/workbook.xml')).findall('x:sheets/x:sheet',ns)
  sheet=next(s for s in sheets if s.get('name')==spec['sheet']);rid=sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
  rel=next(r for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels')) if r.get('Id')==rid)
  target=rel.get('Target');target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
  cells={}
  for cell in E.fromstring(z.read(target)).findall('.//x:c',ns):
   v=cell.find('x:v',ns)
   if cell.get('t')=='inlineStr':val=''.join(cell.find('x:is',ns).itertext())
   elif v is None:continue
   elif cell.get('t')=='s':val=shared[int(v.text)]
   elif cell.get('t')=='e':continue
   else:val=v.text
   cells[cell.get('r')]=val
  if 'assert_cell' in spec:
   for ref,expected in spec['assert_cell'].items():
    if cells.get(ref)!=expected:raise ValueError('Publisher cell identity mismatch: '+ref)
  def column(i):
   s=''
   while i:i,r=divmod(i-1,26);s=chr(65+r)+s
   return s
  if spec['layout']=='horizontal':
   import datetime,re
   for i in range(spec['start_column'],spec['end_column']+1):
    c=column(i);period=cells.get(c+str(spec['period_row']));value=cells.get(c+str(spec['value_row']))
    if period is None or value is None:continue
    if spec['period_format']=='quarter':
     m=re.fullmatch(r'\s*(I|II|III|IV)\s*(\d{4})\s*',period)
     if not m:raise ValueError('Unknown quarter '+period)
     period=m[2]+'-Q'+str(['I','II','III','IV'].index(m[1])+1)
    elif spec['period_format']=='excel-month':period=(datetime.datetime(1899,12,30)+datetime.timedelta(days=float(period))).strftime('%Y-%m')
    rows.append([period,spec['key'],value])
  else:
   for i in range(spec['first_row'],spec['last_row']+1):
    period=cells.get(spec['period_column']+str(i));value=cells.get(spec['value_column']+str(i))
    if period is not None and value is not None:rows.append([period,spec['key'],value])
elif spec['format']=='snb-json':
 series=next(s for s in json.loads(data)['timeseries'] if s['metadata']['key']==spec['series_key'])
 previous=None
 for v in series['values']:
  if v['value'] is None:continue
  if spec.get('changes_only') and previous==v['value']:continue
  rows.append([v['date'],spec['key'],str(v['value'])]);previous=v['value']
else:raise ValueError('Unknown extraction format')
with open(sys.argv[3],'w',newline='') as f:
 writer=csv.writer(f);writer.writerow(['reference_period','source_identifier','value']);writer.writerows(rows)
print(f'Extracted {len(rows)} observations from checksum-verified publisher file')
