// 아이콘 PNG를 외부 라이브러리 없이 생성 (노란 스티커 + 검은 테두리 + 검은 체크)
const zlib = require('zlib'), fs = require('fs');
function crc32(buf){let c,crc=0xffffffff;for(let n=0;n<buf.length;n++){c=(crc^buf[n])&0xff;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c;}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
function png(size){
  const raw=Buffer.alloc((size*4+1)*size);
  const r=size*0.22; // 모서리 반지름
  const bw=size*0.07; // 테두리 두께
  const inInner=(x,y)=>{const ri=r-bw;const cx=Math.min(Math.max(x,bw+ri),size-bw-ri),cy=Math.min(Math.max(y,bw+ri),size-bw-ri);return x>=bw&&x<=size-bw&&y>=bw&&y<=size-bw&&(x-cx)**2+(y-cy)**2<=ri*ri;};
  const inRound=(x,y)=>{const cx=Math.min(Math.max(x,r),size-r),cy=Math.min(Math.max(y,r),size-r);return (x-cx)**2+(y-cy)**2<=r*r;};
  // 체크: 두 선분 (a->b, b->c)
  const a=[size*0.28,size*0.52],b=[size*0.44,size*0.68],c=[size*0.73,size*0.34],w=size*0.075;
  const dist=(p,q,x,y)=>{const dx=q[0]-p[0],dy=q[1]-p[1];const t=Math.max(0,Math.min(1,((x-p[0])*dx+(y-p[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-(p[0]+t*dx),y-(p[1]+t*dy));};
  for(let y=0;y<size;y++){raw[y*(size*4+1)]=0;for(let x=0;x<size;x++){
    const o=y*(size*4+1)+1+x*4;
    if(!inRound(x+.5,y+.5)){raw[o]=raw[o+1]=raw[o+2]=0;raw[o+3]=0;continue;}
    const d=Math.min(dist(a,b,x+.5,y+.5),dist(b,c,x+.5,y+.5));
    const t=Math.max(0,Math.min(1,w-d+.5)); // 안티앨리어싱
    if(!inInner(x+.5,y+.5)){raw[o]=28;raw[o+1]=26;raw[o+2]=23;raw[o+3]=255;continue;}
    // 노랑(255,217,61) → 체크 부분은 검정
    raw[o]=Math.round(255+(28-255)*t);raw[o+1]=Math.round(217+(26-217)*t);raw[o+2]=Math.round(61+(23-61)*t);raw[o+3]=255;
  }}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
for(const s of [180,192,512])fs.writeFileSync(`icon-${s}.png`,png(s));
console.log('icons written');
