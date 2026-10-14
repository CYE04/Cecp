/* CECP-CHORD-HEIGHT-BEGIN
   三个渲染器使用同一条和弦高度线，只按实际音符、弧线、导航记号和房子避让。
   编辑器 srcdoc 内联块，禁止反斜杠及反引号。 */
function scoreHeightRows(scope){
  if(!scope)return [];
  var rows=[].slice.call(scope.querySelectorAll('.prev-row'));
  if(scope.matches&&scope.matches('.prev-row'))rows.unshift(scope);
  return rows;
}
function scoreHeightScale(el){var r=el.getBoundingClientRect();return el.offsetWidth?r.width/el.offsetWidth:1;}
function scoreNormalizeNotes(scope){
  scoreHeightRows(scope).forEach(function(row){
    row.style.setProperty('--volta-rail','0px');
    row.style.setProperty('--row-lyric-height','0px');
    var lyricHeight=0;
    [].forEach.call(row.querySelectorAll('.p-lyric'),function(lyric){lyricHeight=Math.max(lyricHeight,lyric.offsetHeight);});
    if(lyricHeight)row.style.setProperty('--row-lyric-height',lyricHeight+'px');
    row.style.setProperty('--row-note-height','0px');
    var height=0;
    [].forEach.call(row.querySelectorAll('.p-n'),function(lane){height=Math.max(height,lane.offsetHeight);});
    if(height)row.style.setProperty('--row-note-height',height+'px');
  });
}
function scoreResetChordHeight(scope){
  scoreHeightRows(scope).forEach(function(row){[].forEach.call(row.querySelectorAll('.p-chord'),function(chord){chord.style.marginBottom='';});});
}
function scoreHeightObstacles(row){
  var rects=[];
  [].forEach.call(row.querySelectorAll('.jp-num,.jp-plain-sym,.jp-dot-top > span,.jp-navmark svg,[data-jp-nav-above="1"] .jp-bar-top svg,.strict-arc-svg > div,.strict-arc-svg path,.strict-arc-svg text,.strict-arc-tup text'),function(el){var r=el.getBoundingClientRect();if(r.width&&r.height)rects.push(r);});
  [].forEach.call(row.querySelectorAll('.jp-slur,.jp-slur-open,.jp-slur-close,.jp-tie'),function(group){
    var r=group.getBoundingClientRect(),s=scoreHeightScale(group),ps=getComputedStyle(group,'::before');
    if(ps.content==='none')return;
    function length(value){return String(value).indexOf('%')>=0?(parseFloat(value)||0)*group.offsetWidth/100:parseFloat(value)||0;}
    var left=r.left+length(ps.left)*s,right=group.classList.contains('jp-tie')?left+length(ps.width)*s:r.right-length(ps.right)*s;
    if(right>left)rects.push({left:left,right:right,top:r.top+length(ps.top)*s});
  });
  return rects;
}
function scoreHeightHouses(row,obstacles){
  var rails=[];
  [].slice.call(row.querySelectorAll('.prev-volta,.jp-volta')).reverse().forEach(function(house){
    var r=house.getBoundingClientRect(),s=scoreHeightScale(house),ceiling=Infinity;
    obstacles.concat(rails).forEach(function(o){if(o.left<r.right&&o.right>r.left)ceiling=Math.min(ceiling,o.top);});
    if(!isFinite(ceiling)||!s)return;
    var top=ceiling-12*s;
    house.style.setProperty(house.classList.contains('jp-volta')?'--jp-volta-top':'--volta-top',((top-r.top)/s).toFixed(3)+'px');
    rails.push({left:r.left,right:r.right,top:top});
  });
  return rails;
}
var scoreChordMeasureContext;
function scoreChordInk(chord,scale){
  var range=document.createRange();range.selectNodeContents(chord);
  var r=range.getBoundingClientRect();if(!r.height)r=chord.getBoundingClientRect();
  var stacks=chord.querySelectorAll('.p-chord-stk'),last=stacks.length?stacks[stacks.length-1]:chord;
  var text=last.querySelector('.chord-chip')||last,cs=getComputedStyle(text),descent=0,inkDescent=0;
  if(!scoreChordMeasureContext)scoreChordMeasureContext=document.createElement('canvas').getContext('2d');
  if(scoreChordMeasureContext){
    scoreChordMeasureContext.font=cs.font||cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    var metrics=scoreChordMeasureContext.measureText(text.textContent||'');
    if(isFinite(metrics.fontBoundingBoxDescent)&&isFinite(metrics.actualBoundingBoxDescent)){
      descent=metrics.fontBoundingBoxDescent;inkDescent=Math.max(0,metrics.actualBoundingBoxDescent);
    }
  }
  return {baseline:r.bottom-descent*scale,descent:inkDescent};
}
function scoreLayoutChordRows(scope){
  scoreHeightRows(scope).forEach(function(row){
    if(!row.isConnected||!row.querySelector('.p-n'))return;
    var s=scoreHeightScale(row);if(!s)return;
    var obstacles=scoreHeightObstacles(row),rails=scoreHeightHouses(row,obstacles),ceiling=Infinity;
    obstacles.concat(rails).forEach(function(o){ceiling=Math.min(ceiling,o.top);});
    if(!isFinite(ceiling))return;
    var labelBand=0;
    [].forEach.call(row.querySelectorAll('.sec-label-holder .sec-label'),function(tag){labelBand=Math.max(labelBand,tag.offsetHeight+6);});
    var chords=[],inkDescent=0;
    [].forEach.call(row.querySelectorAll('.p-chord'),function(chord){var ink=scoreChordInk(chord,s);inkDescent=Math.max(inkDescent,ink.descent);chords.push({chord:chord,ink:ink});});
    var target=ceiling-(3+labelBand+inkDescent)*s;
    var anchor=row.querySelector('.jp-num,.jp-plain-sym'),oldTop=anchor?anchor.getBoundingClientRect().top-row.getBoundingClientRect().top:0;
    var changes=[];
    chords.forEach(function(item){
      var margin=parseFloat(getComputedStyle(item.chord).marginBottom)||0;
      changes.push({chord:item.chord,margin:margin+(item.ink.baseline-target)/s});
    });
    changes.forEach(function(change){change.chord.style.marginBottom=change.margin.toFixed(3)+'px';});
    var delta=anchor?(anchor.getBoundingClientRect().top-row.getBoundingClientRect().top-oldTop)/s:0;
    if(Math.abs(delta)>.01){[].forEach.call(row.querySelectorAll('.strict-arc-svg'),function(host){host.style.top=((parseFloat(host.style.top)||0)+delta).toFixed(3)+'px';});}
    scoreHeightHouses(row,scoreHeightObstacles(row));
    [].forEach.call(row.querySelectorAll('.sec-label-holder'),function(holder){if(holder.cecpPlaceSecLabel)holder.cecpPlaceSecLabel(true);});
  });
}
/* CECP-CHORD-HEIGHT-END */
