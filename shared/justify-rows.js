/* ═══════════ CECP-JUSTIFY-ROWS v1 BEGIN ═══════════
   共享模块：简谱行内两端对齐（justify）。
   本块在以下三个文件中逐字节相同（权威版本 = shared/justify-rows.js）：
     musiclib/musiclib.js / youth-engine.js / musictool/musictool.js
   修改流程：先改 shared/justify-rows.js，再同步三处，diff 校验一致。
   注意：本块内禁止出现反斜杠字符、反引号、以及美元号紧跟大括号
   （musictool.js 的副本位于 jianpuHTML 模板字符串内，
   经 CMS 部署还会再丢一层反斜杠）。
   硬性约束：只改 .prev-seg 的 inline marginLeft/marginRight/minWidth，
   绝不插入/删除/移动任何元素——musictool 点击定位用 data-loc，
   shared/lyric-hl.js 用 .prev-seg 的索引定位歌词高亮，
   元素数量或顺序一旦变化全部错位；也绝不碰 padding（chord-fit 专用）
   及每行首列 marginLeft / 末列 marginRight（保住整首左右边缘齐平）。
   工作方式：在未缩放坐标系（transform:scale 之前）执行；
   每次先按 data-ml-just 标记还原上次写入的样式，再重新测量分摊，
   保证 resize / 重渲染幂等，不会叠加复利。
   严格对位模式（.prev-seg.p-slot）：
   - 目标宽度锚定在固定区间 [580px, 760px]（按合格行 P75 钳位，不低于物理不重叠底线）；
   - 超宽行按「连续空歌词段 -> 普通音位空白 -> 小节线」分层压缩横向空隙，并重检和弦碰撞；
   - 短行不拉伸门槛统一为 0.45，仅真正短尾句保持左对齐。
   老格式歌（无 .prev-seg.p-slot）：保持原有单向拉伸 + 默认 0.62 门槛不变。 */
var JUSTIFY_STRICT_MIN_W=580;
var JUSTIFY_STRICT_MAX_W=760;
var JUSTIFY_STRICT_RATIO=0.45;
var JUSTIFY_STRICT_MIN_CAP=1.25;
var JUSTIFY_EMPTY_RUN=4;
var JUSTIFY_BLANKS=' '+String.fromCharCode(9)+String.fromCharCode(160)+String.fromCharCode(0x3164)+String.fromCharCode(0x3000);

function justifyScoreRowsClear(scope){
  if(!scope||!scope.querySelectorAll)return;
  scope.querySelectorAll('[data-ml-just]').forEach(function(seg){
    seg.style.marginLeft='';
    seg.style.marginRight='';
    seg.style.minWidth='';
    seg.removeAttribute('data-ml-just');
  });
}
function justifyMeasureRowW(row){
  var prev=row.style.display;
  var prevW=row.style.width;
  row.style.display='inline-flex';
  row.style.width='max-content';
  /* 必须用 offsetWidth：flex 容器的 scrollWidth 不含子项 margin，
     而最终行宽是含 margin 的，两者不是同一个量。 */
  var w=row.offsetWidth;
  row.style.display=prev;
  row.style.width=prevW;
  return w;
}
function justifyIsBlankSlot(seg){
  var ls=seg.querySelectorAll('.p-lyric'),i,j,t;
  if(!ls.length)return true;
  for(i=0;i<ls.length;i++){
    t=String(ls[i].textContent||'');
    for(j=0;j<t.length;j++){
      if(JUSTIFY_BLANKS.indexOf(t.charAt(j))<0)return false;
    }
  }
  return true;
}
function justifyMarkEmptyRuns(items){
  var run=[],i,j;
  function flush(){
    if(run.length>=JUSTIFY_EMPTY_RUN){
      for(j=0;j<run.length;j++)run[j].inEmptyRun=true;
    }
    run=[];
  }
  for(i=0;i<items.length;i++){
    if(items[i].isBar)continue;
    if(items[i].isBlank)run.push(items[i]);
    else flush();
  }
  flush();
}
function justifyCompressRowBy(info,amount){
  var rem=amount,changed=false;
  if(rem<=0.01)return false;
  var pools=[
    info.items.filter(function(it){return it.inEmptyRun;}),
    info.items.filter(function(it){return !it.isBar&&!it.inEmptyRun;}),
    info.items.filter(function(it){return it.isBar;})
  ];
  pools.forEach(function(pool){
    if(rem<=0.01||!pool.length)return;
    var avail=0;
    pool.forEach(function(it){
      avail+=Math.max(0,it.curMW-it.minMW)+Math.max(0,it.curML-it.minML)+Math.max(0,it.curMR-it.minMR);
    });
    if(avail<=0.01)return;
    var take=Math.min(rem,avail),ratioTake=take/avail;
    pool.forEach(function(it){
      var sMW=Math.max(0,it.curMW-it.minMW);
      var sML=Math.max(0,it.curML-it.minML);
      var sMR=Math.max(0,it.curMR-it.minMR);
      if(sMW>0){
        it.curMW=Math.max(it.minMW,it.curMW-sMW*ratioTake);
        it.seg.style.minWidth=it.curMW.toFixed(2)+'px';
        it.seg.setAttribute('data-ml-just','1');
        changed=true;
      }
      if(sML>0){
        it.curML=Math.max(it.minML,it.curML-sML*ratioTake);
        it.seg.style.marginLeft=it.curML.toFixed(2)+'px';
        it.seg.setAttribute('data-ml-just','1');
        changed=true;
      }
      if(sMR>0){
        it.curMR=Math.max(it.minMR,it.curMR-sMR*ratioTake);
        it.seg.style.marginRight=it.curMR.toFixed(2)+'px';
        it.seg.setAttribute('data-ml-just','1');
        changed=true;
      }
    });
    rem-=take;
  });
  return changed;
}
function justifyScoreRows(rowList,opts){
  opts=opts||{};
  var rows=Array.prototype.slice.call(rowList||[]);
  if(!rows.length)return 0;
  /* 1. 还原上次 justify 写入的样式（幂等基线） */
  rows.forEach(function(row){justifyScoreRowsClear(row);});

  var hasStrict=false,ri;
  for(ri=0;ri<rows.length;ri++){
    if(rows[ri].querySelector('.prev-seg.p-slot')){hasStrict=true;break;}
  }

  /* ── 老格式歌：保持既有单向拉伸与默认 0.62 门槛，一像素都不动 ── */
  if(!hasStrict){
    var legacyRatio=(opts.ratio==null)?0.62:opts.ratio;
    var widths=rows.map(justifyMeasureRowW);
    var maxW=0;
    widths.forEach(function(w){if(w>maxW)maxW=w;});
    if(opts.targetWidth && opts.targetWidth > maxW) maxW = opts.targetWidth;
    if(!maxW)return 0;
    var plans=[];
    rows.forEach(function(row,idx){
      var w=widths[idx];
      var extra=maxW-w;
      if(extra<=0||w<legacyRatio*maxW)return;
      var segs=Array.prototype.slice.call(row.querySelectorAll('.prev-seg'));
      if(segs.length<2)return;
      segs.pop(); /* DOM 顺序最后一个 seg 不加 margin，保住行尾对齐 */
      var total=0;
      var items=segs.map(function(seg){
        var sw=seg.offsetWidth;
        total+=sw;
        return {
          seg:seg,
          w:sw,
          base:parseFloat(getComputedStyle(seg).marginRight)||0
        };
      });
      if(total<=0)return;
      plans.push({row:row,items:items,extra:extra,total:total});
    });
    plans.forEach(function(plan){
      plan.items.forEach(function(item){
        item.seg.style.marginRight=(item.base+plan.extra*item.w/plan.total)+'px';
        item.seg.setAttribute('data-ml-just','1');
      });
    });
    /* 收尾校正：写完之后逐行实测，把残差补到最后一个参与分摊的 seg 上。 */
    plans.forEach(function(plan){
      if(!plan.items.length)return;
      var now=justifyMeasureRowW(plan.row);
      var diff=maxW-now;
      if(diff>0.5||diff<-0.5){
        var last=plan.items[plan.items.length-1];
        var v=(parseFloat(last.seg.style.marginRight)||0)+diff;
        if(v<0)v=0;
        last.seg.style.marginRight=v+'px';
      }
    });
    return plans.length;
  }

  /* ── 严格对位（.prev-seg.p-slot）：固定区间 [MIN_W, MAX_W] + 双向压/拉 + 统一 0.45 ── */
  var ratio=(opts.ratio==null)?JUSTIFY_STRICT_RATIO:opts.ratio;
  var minW=(opts.minWidth==null)?JUSTIFY_STRICT_MIN_W:opts.minWidth;
  var maxW=(opts.maxWidth==null)?JUSTIFY_STRICT_MAX_W:opts.maxWidth;

  var infos=rows.map(function(row){
    var prevDisp=row.style.display;
    var prevW=row.style.width;
    row.style.display='inline-flex';
    row.style.width='max-content';
    var natW=row.offsetWidth;
    var segs=Array.prototype.slice.call(row.querySelectorAll('.prev-seg'));
    var items=[],totalSlack=0,prevHasBB=false,k;
    for(k=0;k<segs.length;k++){
      var seg=segs[k];
      var cs=getComputedStyle(seg);
      var baseML=parseFloat(cs.marginLeft)||0;
      var baseMR=parseFloat(cs.marginRight)||0;
      var baseMW=parseFloat(cs.minWidth)||0;
      var padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
      var isBorderBox=(cs.boxSizing==='border-box');
      var sw=seg.offsetWidth;
      var isBar=seg.classList.contains('p-barslot');
      var hasBB=!!seg.getAttribute('data-bb');
      var hasAug=!isBar&&!!seg.querySelector('.jp-aug');
      var hasPunct=!isBar&&seg.classList.contains('p-punct-gap');
      var isBlank=!isBar&&justifyIsBlankSlot(seg);
      var minML=(k===0)?baseML:(prevHasBB?baseML:(isBar?Math.min(baseML,1):0));
      var floorR=isBar?1:0;
      if(hasBB)floorR=Math.max(floorR,5);
      if(hasAug)floorR=Math.max(floorR,7);
      if(hasPunct)floorR=Math.max(floorR,5);
      var minMR=(k===segs.length-1)?baseMR:Math.min(baseMR,floorR);
      var innerW=14.4,mwSlack=0,startMW=baseMW,minMW=baseMW;
      if(isBlank&&!hasBB){
        var pn=seg.querySelector('.p-n');
        if(pn&&pn.offsetWidth>innerW)innerW=pn.offsetWidth;
        var jn=seg.querySelector('.jp-num');
        if(jn&&!seg.querySelector('.jp-sp')&&jn.offsetWidth>innerW)innerW=jn.offsetWidth;
        var lys=seg.querySelectorAll('.p-lyric'),li;
        for(li=0;li<lys.length;li++){
          if(lys[li].offsetWidth>innerW)innerW=lys[li].offsetWidth;
        }
        var realFloorBoxW=Math.max(14.4,innerW+padX);
        mwSlack=Math.max(0,sw-realFloorBoxW);
        startMW=isBorderBox?sw:Math.max(0,sw-padX);
        minMW=Math.max(0,startMW-mwSlack);
      }
      totalSlack+=mwSlack+Math.max(0,baseML-minML)+Math.max(0,baseMR-minMR);
      items.push({
        seg:seg,isBar:isBar,hasBB:hasBB,isBlank:isBlank,inEmptyRun:false,
        isBorderBox:isBorderBox,innerW:innerW,
        baseML:baseML,baseMR:baseMR,curML:baseML,curMR:baseMR,minML:minML,minMR:minMR,
        startMW:startMW,curMW:startMW,minMW:minMW
      });
      prevHasBB=hasBB;
    }
    row.style.display=prevDisp;
    row.style.width=prevW;
    justifyMarkEmptyRuns(items);
    var floorW=Math.max(0,natW-totalSlack);
    return {row:row,segs:segs,items:items,natW:natW,curW:natW,floorW:floorW,compressed:false};
  });

  var musicRows=infos.filter(function(info){return info.segs.length>=2&&info.natW>0;});
  if(!musicRows.length)return 0;

  var rawMaxW=0,maxFloorW=0;
  musicRows.forEach(function(info){
    if(info.natW>rawMaxW)rawMaxW=info.natW;
    if(info.floorW>maxFloorW)maxFloorW=info.floorW;
  });

  var targetW=0;
  if(musicRows.length<2){
    targetW=Math.min(rawMaxW,maxW);
  }else{
    var eligible=musicRows.filter(function(info){return info.natW>=rawMaxW*ratio;})
      .map(function(info){return info.natW;})
      .sort(function(a,b){return a-b;});
    if(!eligible.length){
      eligible=musicRows.map(function(info){return info.natW;}).sort(function(a,b){return a-b;});
    }
    var p75W=eligible[Math.round((eligible.length-1)*0.75)];
    var effMinW=Math.min(minW,rawMaxW*JUSTIFY_STRICT_MIN_CAP);
    targetW=Math.max(effMinW,Math.min(maxW,p75W));
  }
  if(opts.targetWidth&&opts.targetWidth>targetW)targetW=opts.targetWidth;
  if(maxFloorW>targetW)targetW=maxFloorW;
  if(!targetW)return 0;

  /* 2. 超宽行分层压缩 + 和弦碰撞重检 */
  infos.forEach(function(info){
    if(info.segs.length<2||info.natW<=targetW+0.5)return;
    if(justifyCompressRowBy(info,info.natW-targetW))info.compressed=true;
    if(typeof layoutStrictChords==='function')layoutStrictChords(info.row,false);
    var nowW=justifyMeasureRowW(info.row);
    for(var trimPass=0;trimPass<3&&nowW>targetW+0.5;trimPass++){
      info.items.forEach(function(it){
        if(!it.isBlank||it.hasBB)return;
        var cs=getComputedStyle(it.seg);
        var padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
        var boxFloor=Math.max(14.4,it.innerW+padX);
        it.minMW=it.isBorderBox?boxFloor:Math.max(0,boxFloor-padX);
        if(it.curMW<it.minMW)it.curMW=it.minMW;
      });
      if(!justifyCompressRowBy(info,nowW-targetW))break;
      info.compressed=true;
      if(typeof layoutStrictChords==='function')layoutStrictChords(info.row,false);
      nowW=justifyMeasureRowW(info.row);
    }
    info.curW=nowW;
  });

  var finalTargetW=targetW;
  infos.forEach(function(info){
    if(info.curW>finalTargetW)finalTargetW=info.curW;
  });

  /* 3. 短于 finalTargetW 的合格行等比拉齐 + 收尾校正 */
  var modifiedCount=0;
  infos.forEach(function(info){
    if(info.compressed)modifiedCount++;
    if(info.segs.length<2)return;
    var extra=finalTargetW-info.curW;
    if(extra<=0.5)return;
    if(!info.compressed&&info.natW<ratio*finalTargetW)return;
    var stretchItems=info.items.slice(0,-1);
    var total=0;
    var prevDisp=info.row.style.display,prevW=info.row.style.width;
    info.row.style.display='inline-flex';
    info.row.style.width='max-content';
    stretchItems.forEach(function(it){
      it.swNow=it.seg.offsetWidth;
      total+=it.swNow;
    });
    info.row.style.display=prevDisp;
    info.row.style.width=prevW;
    if(total<=0)return;
    stretchItems.forEach(function(it){
      var mr=it.curMR+extra*it.swNow/total;
      it.curMR=mr;
      it.seg.style.marginRight=mr.toFixed(2)+'px';
      it.seg.setAttribute('data-ml-just','1');
    });
    var now=justifyMeasureRowW(info.row);
    var diff=finalTargetW-now;
    if(diff>0.5||diff<-0.5){
      var remD=diff,idx;
      for(idx=stretchItems.length-1;idx>=0&&(remD>0.5||remD<-0.5);idx--){
        var last=stretchItems[idx];
        var nextMR=last.curMR+remD;
        if(nextMR<last.minMR){
          remD-=(last.minMR-last.curMR);
          last.curMR=last.minMR;
        }else{
          last.curMR=nextMR;
          remD=0;
        }
        last.seg.style.marginRight=last.curMR.toFixed(2)+'px';
        last.seg.setAttribute('data-ml-just','1');
      }
    }
    if(!info.compressed)modifiedCount++;
  });
  return modifiedCount;
}
/* ═══════════ CECP-JUSTIFY-ROWS v1 END ═══════════ */
