"""Small original SVG illustrations of the projects' documented workflows.
These are concept illustrations, not screenshots or measured experimental outputs.
The LoRA card instead uses a real sample from its own repository.
"""
from pathlib import Path
from html import escape
import math
out=Path(__file__).resolve().parents[1]/'public/assets/projects'
out.mkdir(parents=True,exist_ok=True)

def text(x,y,s,size=16,fill='#d8e2d7',anchor='start',family='monospace'):
    return f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-family="{family}" text-anchor="{anchor}">{escape(s)}</text>'
def rect(x,y,w,h,fill='#1c2b2b',stroke='#638177',r=8,opacity=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" opacity="{opacity}"/>'
def path(d,stroke='#91b2a1',width=2,fill='none',extra=''):
    return f'<path d="{d}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" {extra}/>'
def circle(x,y,r,fill='none',stroke='#91b2a1',width=1):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
def lines(x,y,width=120,count=5,color='#698378',space=17):
    return ''.join(path(f'M{x} {y+i*space}h{width*(1-(i%3)*.15)}',color,3) for i in range(count))
def arrow(x1,y1,x2,y2,color='#d99b79'):
    return path(f'M{x1} {y1}L{x2} {y2}',color,2,extra='marker-end="url(#arrow)"')
def save(name,body,accent='#80aa99',caption=''):
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540" role="img">
<defs><radialGradient id="glow"><stop stop-color="{accent}" stop-opacity=".17"/><stop offset="1" stop-color="#101b1d" stop-opacity="0"/></radialGradient><pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#85a092" stroke-opacity=".075"/></pattern><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#d99b79" stroke-width="1"/></marker></defs>
<rect width="900" height="540" fill="#142021"/><rect width="900" height="540" fill="url(#grid)"/><ellipse cx="495" cy="230" rx="440" ry="330" fill="url(#glow)"/>{body}
{text(52,507,caption,11,'#a6bbaa')}
</svg>'''
    (out/name).write_text(svg)

# Face landmarks rendered at successive degradation settings.
b=''
for j,x in enumerate([145,375,605]):
    b+=rect(x,122,155,248,'#1c2b2d','#72948a',3)
    b+=f'<ellipse cx="{x+77}" cy="221" rx="48" ry="70" fill="#293d3d" stroke="#a6beb1"/>'
    b+=path(f'M{x+36} 212Q{x+52} 201 {x+64} 211M{x+90} 211Q{x+104} 201 {x+121} 212M{x+76} 218l-7 33 18 0M{x+54} 268q23 14 45 0','#d0d3bf',2)
    b+=path(f'M{x+20} 342Q{x+40} 284 {x+76} 300Q{x+112} 286 {x+137} 342','#6b8c84',2)
    for k in range(7):
        b+=path(f'M{x+14} {149+k*28}h127','#81a38c',.5,extra='opacity=".35"')
    if j==1:
        for i in range(40):
            xx=x+13+(i*37)%130;yy=148+(i*23)%143
            b+=rect(xx,yy,12,12,'#c9857280','none',0)
    if j==2:
        for k in range(8):b+=path(f'M{x+7} {184+k*15}h141','#c3d0b6',4,extra='opacity=".25"')
    b+=text(x+77,413,['CLEAN','COMPRESS','BLUR'][j],14,anchor='middle')
    if j<2:b+=arrow(x+172,243,x+209,243)
b+=text(450,77,'WHAT SURVIVES THE TRANSFORM?',16,'#ddae91','middle')
save('deepfake.svg',b,'#b68874','FACE CROPS / DEGRADATION TESTS')

# Street image to a spherical geographic prediction.
b=rect(100,117,305,271,'#263836','#769388',4)
b+=path('M101 326L403 326V387H101Z','#587966',1,'#334639')
b+=path('M194 387L242 248H285L348 387','#66776b',1,'#48564a')
for x,y,w,h in [(120,170,63,158),(186,204,40,108),(315,171,67,156)]:
    b+=rect(x,y,w,h,'#bba68a','#d5c4a4',0)+path(f'M{x-5} {y}l{w/2+5} -32 {w/2+5} 32Z','#bd9e7f',1,'#806b59')
    for dx in range(2):
        for dy in range(3):b+=rect(x+10+dx*24,y+18+dy*36,12,18,'#344441','none',0)
b+=arrow(431,255,501,255)
b+=circle(659,254,126,'#203238','#87aca5',1.7)
for rx in [43,89]:b+=f'<ellipse cx="659" cy="254" rx="{rx}" ry="126" fill="none" stroke="#709d98" stroke-opacity=".65"/>'
for ry in [42,89]:b+=f'<ellipse cx="659" cy="254" rx="126" ry="{ry}" fill="none" stroke="#709d98" stroke-opacity=".65"/>'
b+=circle(691,213,9,'#e6a383','#e6a383')+circle(691,213,25,'none','#e6a383')+path('M691 213l38 -55h55','#e6a383',1.5)
b+=text(451,450,'IMAGE → COUNTRY → REGION → COORDINATES',13,'#d8bd9f','middle')
save('geolocation.svg',b,'#7bafbf','SINGLE MODEL / HIERARCHICAL GEOLOCATION')

# Deliberately conceptual land-cover tile, without implying measured map data.
b=''
for row in range(12):
    for col in range(22):
        river=8+2*math.sin(row*.7)
        value=(row*17+col*13)%11
        color='#6799a8' if abs(col-river)<1.2 else ['#446d58','#8e9973','#4c7154','#789d7c','#a4967f'][value%5]
        if col>river+2 and 2<row<10 and value%3==0:color='#baa787'
        b+=rect(128+col*29,78+row*29,27,27,color,'none',0)
b+=rect(123,73,647,357,'none','#bed0ac',0)
b+=path('M97 75h-13v44M795 75h13v44M97 428h-13v-44M795 428h13v-44','#d8be9d',2)
for x,color,label in [(155,'#6e9875','VEGETATION'),(373,'#baa787','BUILT'),(535,'#6799a8','WATER')]:
    b+=rect(x,457,10,10,color,'none',0)+text(x+20,467,label,12)
save('landcover.svg',b,'#73966d','SENTINEL-2 / 100 M GRID / CONCEPTUAL MAP')

# A question selects a source, not all tools at once.
b=rect(83,204,200,108,'#243633','#afc5aa')+text(183,251,'QUESTION',21,anchor='middle')+text(183,280,'source router',12,'#d5b69b','middle')
for y,label in [(93,'PDF REPORTS'),(203,'WEB SEARCH'),(313,'ARXIV'),(423,'WIKIPEDIA')]:
    b+=path(f'M283 258H382V{y+6}H535','#81978b',1.6)
    b+=circle(382,y+6,4,'#cda888','#cda888')+rect(536,y-22,256,59,'#243331','#77958a')+text(566,y+13,label,16)
b+=circle(183,157,16,'none','#d5a17d',2)+path('M177 157h12M183 151v12','#d5a17d',2)
save('research.svg',b,'#9daf7b','TOOL ROUTING / DOCUMENTS + PUBLIC SOURCES')

# Dense and keyword retrieval merge into cited answer.
b=''
for i in range(3):b+=rect(84+i*20,130-i*15,135,210,'#203231','#6b9088',4)+lines(106+i*20,163-i*15,88,7)
b+=path('M280 242H323V143H389M323 242V340H389','#96afa2',2)
for y,label in [(97,'SEMANTIC'),(296,'KEYWORDS')]:
    b+=rect(390,y,177,89,'#2a3b37','#acb89f',4)+text(478,y+50,label,15,anchor='middle')
b+=path('M568 141H610V240H660M568 341H610V240','#9bae9d',2)
b+=rect(660,163,162,159,'#37443b','#debea0',4)+text(680,200,'ANSWER',15,'#eddbc0')+lines(680,224,115,3,'#a9bca5',18)+text(680,299,'[p. 4] [p. 9]',12,'#edb196')
b+=text(447,440,'TWO RANKINGS. ONE SET OF SOURCES.',14,'#d5bb9e','middle')
save('rag.svg',b,'#a4a96e','HYBRID RETRIEVAL / RECIPROCAL-RANK FUSION')

b=rect(74,132,352,245,'#1b2a2b','#779b94',4)+text(101,175,'SELECT',24,'#dcb18f')+text(214,175,'name, marks',21)+text(101,221,'FROM students',21)+text(101,266,'ORDER BY marks DESC',20)+text(101,313,'LIMIT 5;',21,'#b7cc9c')
b+=path('M466 237l53 -24 53 24v57q-13 38-53 54q-40-16-53-54Z','#ddb293',2,'#273b36')+path('M490 275l18 18 32-37','#c9d9b3',4)
b+=arrow(587,268,642,268)
b+='<ellipse cx="727" cy="207" rx="61" ry="23" fill="#47615a" stroke="#bbccb4"/>'+rect(666,207,122,122,'#29413c','#bbccb4',0)+'<ellipse cx="727" cy="329" rx="61" ry="23" fill="#29413c" stroke="#bbccb4"/><ellipse cx="727" cy="207" rx="61" ry="23" fill="#47615a" stroke="#bbccb4"/>'
b+=text(727,404,'READ ONLY',13,'#dec29e','middle')
save('sqlite.svg',b,'#87b19e','NATURAL LANGUAGE → VALIDATED SQL → SQLITE')

b=''
for y in [87,220,353]:
    b+=rect(92,y,161,96,'#223632','#76998a',3)+lines(110,y+24,125,4,space=17)
    b+=arrow(274,y+48,368,y+48)+rect(385,y+8,123,81,'#34443b','#adb79d',3)+lines(404,y+32,77,2,'#c5c7aa',19)
    b+=path(f'M508 {y+48}H571V268H626','#94ad9c',1.6)
b+=rect(628,157,181,222,'#38493b','#dbbe9d',4)+text(653,191,'NOTES',17,'#edd4b5')+lines(653,217,127,7,'#b4c2a4',21)
save('summarizer.svg',b,'#a9b789','PARAGRAPH CHUNKS / MAP / REDUCE')

b=text(450,177,'x² − 5x + 6 = 0',47,'#e6dcc4','middle',family='Georgia,serif')
b+=path('M205 217H695','#607a6f',1)+text(267,276,'x = 2',32,'#bbd0ba','middle')+text(633,276,'x = 3',32,'#bbd0ba','middle')
b+=path('M267 304v40M633 304v40','#c9a789',1.5)
for x,s in [(267,'4 − 10 + 6 = 0'),(633,'9 − 15 + 6 = 0')]:
    b+=rect(x-126,354,252,63,'#2b4137','#789f88',4)+text(x,393,s,20,'#dce3c4','middle')
b+=text(450,459,'SOLVE → SUBSTITUTE → VERIFY',13,'#d5b899','middle')
save('math.svg',b,'#92b891','SYMPY CALCULATES / LANGUAGE MODEL EXPLAINS')

b=rect(102,89,697,353,'#162425','#61897f',7)+path('M103 128H798','#4d6d65',1)
for i,c in enumerate(['#c07e65','#d7b179','#85ae8d']):b+=circle(125+i*20,108,4,c,c)
b+=text(194,111,'LOCAL / CODELLAMA',11,'#a8beae')+text(133,175,'def review(source, task):',22,'#d5bf9d')+text(168,213,'prompt = routes[task]',22)+text(168,251,'return ollama.generate(prompt)',21,'#9ac3b8')
for i,label in enumerate(['EXPLAIN','DEBUG','TEST','REFACTOR','REVIEW']):
    x=128+i*129;b+=rect(x,319,116,60,'#2a3c35','#759482',3)+text(x+58,355,label,12,anchor='middle')
b+=text(451,408,'source code stays on the Ollama host',12,'#b7c2ab','middle')
save('code.svg',b,'#7ca3b8','FIVE WORKFLOWS / LOCAL INFERENCE')

b=''
for y in [147,223,299]:
    for x in [78,127,176]:b+=rect(x,y,27,22,'#d0ab87','#ddc39c',3)
    b+=path(f'M235 {y+11}H345V246H380','#7b9c8c',1.7)
b+=circle(454,247,71,'#263c36','#b6cbaa',2)+text(454,254,'KAFKA',20,anchor='middle')+arrow(544,247,618,247)
b+=rect(640,126,172,91,'#30473e','#99b49e',5)+text(726,176,'DUCKDB',19,anchor='middle')+rect(640,282,172,91,'#30473e','#99b49e',5)+text(726,332,'ANALYTICS',17,anchor='middle')
b+=path('M615 247h15V171H639M630 247v81h9','#9cad98',2)+text(452,445,'REPLAY / VALIDATE / STORE / INSPECT',14,'#d5b899','middle')
save('streaming.svg',b,'#91ada6','QUERY METRICS / CONTINUOUS EVENT PIPELINE')

b=''
for i,(label,amount) in enumerate([('QUEUE DELAY',.45),('SPILL EVENTS',.35),('CONCURRENCY',.20)]):
    y=134+i*93;b+=text(100,y,label,13,'#cbd3bd')+rect(100,y+18,350,17,'#263a33','none',2)+rect(100,y+18,350*amount/.5,17,['#d0a17b','#9fb891','#84aca8'][i],'none',2)+text(480,y+33,str(round(amount*100))+'%',16)
b+=circle(704,251,101,'#263c36','#546f63',17)+path('M704 150A101 101 0 1 1 611 290','#d6af83',17)
b+=text(704,246,'PRESSURE',15,anchor='middle')+text(704,274,'SCORE',15,anchor='middle')+text(450,444,'EXPLICIT WEIGHTS. ADJUSTABLE THRESHOLDS.',13,'#d5b899','middle')
save('capacity.svg',b,'#b9a881','OFFLINE CSV / TRANSPARENT CAPACITY HEURISTIC')

b=''
for i in range(53):
    amp=(math.sin(i*.65)**2)*59+(math.sin(i*.22)**2)*43+8
    b+=path(f'M{104+i*6} {262-amp}v{amp*2}',['#9ec3b0','#d2b38c'][i%7==0],3,extra='stroke-linecap="round"')
b+=arrow(449,264,520,264)+rect(551,128,247,274,'#2a4038','#a3b69e',5)+text(578,171,'TRANSCRIPT',16,'#e0c29d')+lines(578,205,185,8,'#a1b69e',22)
b+=text(451,454,'RECORD → TRANSCRIBE → STORE',14,'#d5b899','middle')
save('speech.svg',b,'#a6b697','BROWSER AUDIO / GOOGLE CLOUD / FIRESTORE')

b=rect(91,99,719,340,'#1a2b2b','#79988b',6)+path('M92 145h717M280 145v293','#5a7f72',1)
b+=text(115,128,'DATA WORKSPACE',13,'#d9b893')
for i,label in enumerate(['UPLOAD','SCHEMA','PROCESS','CHARTS']):b+=text(114,191+i*56,label,13,['#d5bd9f','#9fb7a8','#9fb7a8','#d5bd9f'][i])
b+=rect(311,175,215,103,'#2c413a','#557d6b',4)+lines(331,201,173,4,'#a9b7a0',18)
b+=rect(549,175,229,103,'#2b403a','#557d6b',4)
for i,h in enumerate([25,48,35,59,69,54,75]):b+=rect(568+i*27,258-h,13,h,'#b6bf94','none',0)
b+=rect(311,301,467,109,'#243a34','#557d6b',4)+path('M334 381L394 365L451 374L513 343L570 353L628 326L686 343L748 320','#d0ab84',3)
save('dashboard.svg',b,'#89aaa5','FILE UPLOAD / ANALYSIS GOAL / CHART SUGGESTIONS')
print('Created',len(list(out.glob('*.svg'))),'project illustrations.')
