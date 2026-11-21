const KEY='verso:stories';
const SAMPLE=[{id:'s1',title:'The Long Way to Harbor Street',author:'Sample author',chapters:[
{title:'Last bus',song:'Sample song: swap in your own in the editor',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',text:'The last bus of the night sighed at the curb and opened its doors like it was tired of waiting for her.\n\nMara counted the coins in her pocket twice. It was enough for the ride, and not enough for what came after.'},
{title:'Rain on the platform',song:'',url:'',text:'This chapter has no song yet. Open the editor and paste a YouTube link to give it one.\n\nChapters without a song simply read in silence.'}]}];
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const ytId=u=>{const m=/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/.exec(u||'');return m?m[1]:null};
let mem=null;
function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return mem||clone(SAMPLE)}
function persist(){mem=stories;try{localStorage.setItem(KEY,JSON.stringify(stories))}catch(e){}}
let stories=load(),view='lib',story=null,idx=0,draft=null,musicOn=false,muted=false;

function lib(){
$('#app').innerHTML=`<section class="intro"><h1>Every chapter has a song.</h1><p>Authors write to a track. You open the chapter and it plays. Mute it any time.</p></section>
<ul class="list">${stories.map((s,i)=>`<li><span class="disc"></span><div><b>${esc(s.title)}</b><small>By ${esc(s.author||'Anonymous')}, ${s.chapters.length} chapter${s.chapters.length==1?'':'s'}</small></div><button data-read="${i}">Read</button><button class="ghost" data-edit="${i}">Edit</button></li>`).join('')}</ul>
<button class="primary" data-new>Write a story</button>`}

function reader(){
const c=story.chapters[idx],has=!!ytId(c.url);
$('#app').innerHTML=`<article><p class="kicker">${esc(story.title)} by ${esc(story.author||'Anonymous')}</p>
<h2>${esc(c.title||'Untitled chapter')}</h2>
<p class="song"><span class="disc"></span>${has?esc(c.song||'Song for this chapter'):'No song for this chapter'}</p>
${has&&!musicOn?`<div class="gate"><p>This chapter has a song. Browsers need one tap before they play sound.</p><button class="primary" data-music>Read with music</button></div>`:''}
<div class="text">${(c.text||'').split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('')}</div>
<div class="pager"><button data-prev ${idx?'':'disabled'}>Previous</button><span>Chapter ${idx+1} of ${story.chapters.length}</span><button data-next ${idx<story.chapters.length-1?'':'disabled'}>Next</button></div></article>`;
tray()}

function tray(){
const t=$('#tray'),f=$('#yt'),c=view=='read'&&story&&story.chapters[idx];
t.hidden=!(c&&musicOn);
if(t.hidden){f.removeAttribute('src');delete f.dataset.id;return}
const id=ytId(c.url);
$('#tt').textContent=id?(c.song||'Untitled song'):'No song for this chapter';
if(id){if(f.dataset.id!==id){f.dataset.id=id;muted=false;f.src=`https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&enablejsapi=1&loop=1&playlist=${id}`}}
else{f.removeAttribute('src');delete f.dataset.id}
$('#mute').textContent=muted?'Unmute':'Mute';
$('#mute').hidden=!id;f.hidden=!id;
$('#disc').classList.toggle('spin',!!id&&!muted)}

function cmd(fn){const w=$('#yt').contentWindow;if(w)w.postMessage(JSON.stringify({event:'command',func:fn,args:''}),'*')}

function writer(){
const d=draft;
$('#app').innerHTML=`<h1 class="sm">${d.isNew?'New story':'Edit story'}</h1>
<label>Title<input data-f="title" value="${esc(d.title)}"></label>
<label>Author name<input data-f="author" value="${esc(d.author)}"></label>
${d.chapters.map((c,i)=>`<fieldset><legend>Chapter ${i+1}</legend>
<label>Chapter title<input data-c="${i}" data-f="title" value="${esc(c.title)}"></label>
<label>Song name and artist<input data-c="${i}" data-f="song" value="${esc(c.song)}"></label>
<label>YouTube link for the song<input data-c="${i}" data-f="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=..." value="${esc(c.url)}"></label>
<label>Chapter text. Leave a blank line between paragraphs.<textarea data-c="${i}" data-f="text" rows="9">${esc(c.text)}</textarea></label>
${d.chapters.length>1?`<button class="ghost" data-rm="${i}">Remove chapter ${i+1}</button>`:''}</fieldset>`).join('')}
<div class="row"><button data-add>Add chapter</button><button class="primary" data-save>Save story</button><button class="ghost" data-cancel>Cancel</button>${d.isNew?'':'<button class="ghost danger" data-del>Delete story</button>'}</div>
<p class="note">Stories are saved in this browser for now. Sharing between people comes next.</p>`}

function render(){
if(view!='read'){musicOn=false}
({lib,read:reader,write:writer}[view])();
if(view!='read')tray();
window.scrollTo(0,0)}

document.addEventListener('input',e=>{
const t=e.target,f=t.dataset&&t.dataset.f;if(!f||!draft)return;
(t.dataset.c!==undefined?draft.chapters[+t.dataset.c]:draft)[f]=t.value});

document.addEventListener('click',e=>{
const a=e.target.closest('a[data-v]');if(a)e.preventDefault();
const b=e.target.closest('button,a[data-v]');if(!b)return;
const d=b.dataset;
if(d.v){if(d.v=='write'){draft={isNew:1,id:'s'+Date.now(),title:'',author:'',chapters:[{title:'',song:'',url:'',text:''}]}}view=d.v;return render()}
if(d.read!==undefined){story=stories[+d.read];idx=0;view='read';return render()}
if(d.edit!==undefined){draft=clone(stories[+d.edit]);draft.i=+d.edit;view='write';return render()}
if(d.new!==undefined){draft={isNew:1,id:'s'+Date.now(),title:'',author:'',chapters:[{title:'',song:'',url:'',text:''}]};view='write';return render()}
if(d.music!==undefined){musicOn=true;return reader()}
if(d.prev!==undefined){idx--;return reader()}
if(d.next!==undefined){idx++;return reader()}
if(d.mute!==undefined){cmd(muted?'unMute':'mute');muted=!muted;return tray()}
if(d.off!==undefined){musicOn=false;return reader()}
if(d.add!==undefined){draft.chapters.push({title:'',song:'',url:'',text:''});return writer()}
if(d.rm!==undefined){draft.chapters.splice(+d.rm,1);return writer()}
if(d.cancel!==undefined){view='lib';return render()}
if(d.save!==undefined){
if(!draft.title.trim()){alert('Add a title before saving.');return}
if(draft.isNew){delete draft.isNew;stories.push(draft)}else{const i=draft.i;delete draft.i;stories[i]=draft}
persist();view='lib';return render()}
if(d.del!==undefined){
if(!d.sure){b.dataset.sure=1;b.textContent='Click again to delete';return}
stories.splice(draft.i,1);persist();view='lib';return render()}
});
render();
