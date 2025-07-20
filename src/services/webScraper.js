/*****************************************************************
 *  webScraper.js  –  drop-in replacement
 *****************************************************************/
const axios   = require('axios');
const cheerio = require('cheerio');
const Parser  = require('rss-parser');
const rss     = new Parser();

/* ───────── helpers ───────── */
const parseDate = (s) => { const d = new Date(s); return isNaN(d) ? null : d; };
const isRecent  = (d, days = 7) => d && d >= new Date(Date.now() - days * 864e5);
const fetchHtml = (url) =>
  axios.get(url, { headers:{'User-Agent':'Mozilla/5.0'}, timeout:10_000 })
       .then(r => cheerio.load(r.data));

/* ───────── Pension Regulator (HTML only) ───────── */
async function scrapePensionRegulator() {
  const base = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases';
  try {
    const $ = await fetchHtml(base);
    const out = [];
    $('.press-release-item,.news-item,.article-item,article,.content-item').each((_,el)=>{
      const a = $(el).find('h3 a,h2 a,h4 a,a.title').first();
      const title = a.text().trim();
      let href = a.attr('href')||'';
      if (href && !href.startsWith('http')) href = new URL(href, base).href;
      const date = parseDate($(el).find('time,.date,.published').text());
      if (title && href && isRecent(date)) out.push({title,link:href,pubDate:date.toISOString(),authority:'TPR'});
    });
    return out;
  } catch(e){ console.error('TPR:',e.message); return[]; }
}

/* ───────── Serious Fraud Office ───────── */
async function scrapeSFO() {
  // 1️⃣ GOV.UK Atom feed (fastest, most reliable)
  const FEED = 'https://www.gov.uk/government/organisations/serious-fraud-office.atom';
  try{
    const feed = await rss.parseURL(FEED);
    const recent = feed.items.filter(i=>isRecent(parseDate(i.pubDate)));
    if (recent.length) return recent.map(i=>({
      title:i.title,link:i.link,pubDate:i.pubDate,authority:'SFO'
    }));
  }catch(_){ /* fall through to HTML */ }

  // 2️⃣ HTML fallback – scrape GOV.UK list items
  try{
    const base = 'https://www.gov.uk/government/organisations/serious-fraud-office';
    const $ = await fetchHtml(base);
    const out=[];
    $('.gem-c-document-list__item').each((_,el)=>{
      const a = $(el).find('a').first();
      const title=a.text().trim();
      const href=a.attr('href');
      const date=parseDate($(el).find('time').attr('datetime'));
      if(title && href && isRecent(date))
        out.push({title,link:new URL(href,base).href,pubDate:date.toISOString(),authority:'SFO'});
    });
    return out;
  }catch(e){ console.error('SFO:',e.message);return[]; }
}

/* ───────── FCA ───────── */
async function scrapeFCA() {
  // 1️⃣ RSS first
  const FEED='https://www.fca.org.uk/news/rss.xml';
  try{
    const feed=await rss.parseURL(FEED);
    const recent=feed.items.filter(i=>isRecent(parseDate(i.pubDate)));
    if(recent.length) return recent.map(i=>({
      title:i.title,link:i.link,pubDate:i.pubDate,authority:'FCA'
    }));
  }catch(_){}

  // 2️⃣ HTML fallback (handles speeches etc. if RSS fails)
  try{
    const base='https://www.fca.org.uk/news';
    const $=await fetchHtml(base);
    const out=[];
    $('.latest-news li, .news-item, article').each((_,el)=>{
      const a=$(el).find('a').first();
      const title=a.text().trim();
      let href=a.attr('href')||'';
      if(href && !href.startsWith('http')) href=new URL(href,base).href;
      const date=parseDate($(el).find('time').attr('datetime') || $(el).text());
      if(title && href && isRecent(date))
        out.push({title,link:href,pubDate:date.toISOString(),authority:'FCA'});
    });
    return out;
  }catch(e){console.error('FCA:',e.message);return[];}
}

/* ───────── FATF (JSON ▶ fallback HTML) ───────── */
async function fatfJson(pages=2,size=20,maxDays=7){
  const endpoint='https://www.fatf-gafi.org/en/publications/_jcr_content.results.json';
  const list=[];
  for(let p=0;p<pages;p++){
    const {data}=await axios.get(`${endpoint}?page=${p}&size=${size}&sort=Publication%20date%20descending`,{timeout:10_000});
    if(!data?.items?.length) break;
    for(const it of data.items){
      const date=parseDate(it.publicationDate);
      if(!isRecent(date,maxDays)) return list; // stop paging once too old
      list.push({title:it.title.trim(),link:it.detailsPage.absoluteUrl,pubDate:date.toISOString(),authority:'FATF'});
    }
  }
  return list;
}
async function fatfHtml(maxDays=7){
  const base='https://www.fatf-gafi.org/en/publications.html';
  const $=await fetchHtml(base);
  const out=[];
  $('.publication-item,.teaser').each((_,el)=>{
    const a=$(el).find('a').first();
    const title=a.text().trim();
    let href=a.attr('href')||'';
    if(href && !href.startsWith('http')) href=new URL(href,base).href;
    const date=parseDate($(el).find('time,.date').text());
    if(title && isRecent(date,maxDays))
      out.push({title,link:href,pubDate:date.toISOString(),authority:'FATF'});
  });
  return out;
}
async function scrapeFATF(){
  try{
    const j=await fatfJson();
    if(j.length) return j;
    console.warn('FATF JSON empty → HTML fallback');
  }catch(e){console.warn('FATF JSON fail:',e.message);}
  try{ return await fatfHtml(); }catch(e){console.error('FATF HTML fail:',e.message);return[];}
}

/* ───────── exports ───────── */
module.exports={
  scrapePensionRegulator,
  scrapeSFO,
  scrapeFCA,
  scrapeFATF
};
