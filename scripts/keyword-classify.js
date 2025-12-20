#!/usr/bin/env node
/**
 * Keyword-based content type classification - NO AI, instant processing
 */

require('dotenv').config()
const dbService = require('../src/services/dbService')

const RULES = [
  { type: 'Press Release', patterns: [/press release/i, /news release/i, /media release/i, /announces/i, /announcement/i, /statement on/i, /welcomes/i, /responds to/i, /budget 202/i, /boost for/i, /backs.*business/i, /million.*investment/i, /billion.*boost/i, /government to/i, /government urges/i, /chancellor/i, /minister.*statement/i, /ministerial/i, /prime minister/i, /deputy prime minister/i, /uk statement/i, /joint.*statement/i, /chairs.? statement/i, /receives royal assent/i, /new laws/i, /tough new/i, /landmark/i, /historic/i, /biggest/i, /first.*in.*years/i, /record/i, /protected/i, /secured/i, /celebrates/i, /celebrating/i, /honoured/i] },
  { type: 'Consultation', patterns: [/consultation/i, /call for evidence/i, /call for input/i, /seeking views/i, /feedback request/i, /have your say/i, /discussion paper/i] },
  { type: 'Speech', patterns: [/speech/i, /remarks by/i, /address by/i, /keynote/i, /speaking at/i, /delivered by/i, /fireside/i] },
  { type: 'Guidance', patterns: [/guidance/i, /guide to/i, /how to/i, /tariff notice/i, /advisory/i, /handbook/i, /manual/i, /instructions/i, /excise notice/i, /vat notice/i, /best practice/i, /work out your/i, /calculate your/i, /check the/i, /claim a refund/i, /apply for/i, /application for/i, /registering your/i, /keeping records/i, /record keeping/i, /entry in the/i, /permitted ingredients/i, /registered dealers/i, /authorise an agent/i, /accessing.*services/i, /get customs data/i, /software developers providing/i, /form:/i, /decisions and appeals/i, /transfer a business/i, /offsetting/i, /if your circumstances/i, /os bydd/i, /creu cofnod/i, /defnyddio/i, /terms of participation/i, /mutual recognition/i, /get support from/i] },
  { type: 'Enforcement Action', patterns: [/enforcement/i, /penalty/i, /fine[sd]?/i, /sanction/i, /ban[ned]?/i, /prohibition/i, /disciplinary/i, /warning notice/i, /investigat/i, /probe/i, /inquiry/i, /enquiry/i, /fails to meet/i, /failed to meet/i, /breach/i, /non-compliance/i] },
  { type: 'Statistical Report', patterns: [/statistics/i, /statistical/i, /data release/i, /quarterly report/i, /annual report/i, /figures show/i, /survey results/i] },
  { type: 'Research Paper', patterns: [/research/i, /working paper/i, /study finds/i, /analysis of/i, /white paper/i, /staff paper/i, /occasional paper/i] },
  { type: 'Market Notice', patterns: [/market notice/i, /trading halt/i, /market update/i, /listing/i, /delisting/i, /suspension/i, /director/i, /pdmr/i, /shareholding/i, /holding.*in company/i, /beneficial owner/i, /major shareholder/i, /net asset value/i, /nav announcement/i, /fund valuation/i, /admission to/i, /first day of dealings/i, /trading commences/i, /withdrawal of shares/i, /related party transaction/i, /prospectus/i] },
  { type: 'Final Rule', patterns: [/final rule/i, /new rule/i, /rule change/i, /regulation adopted/i, /policy statement/i, /instrument/i, /requirements will apply/i, /new.+requirements/i, /to end by/i, /implementation of/i, /comes? into force/i, /effective from/i] },
  { type: 'Event', patterns: [/event/i, /webinar/i, /conference/i, /workshop/i, /seminar/i, /roundtable/i, /summit/i] },
  { type: 'Policy Paper', patterns: [/policy paper/i, /policy update/i, /strategic plan/i, /framework/i, /approach to/i] },
  { type: 'Report', patterns: [/report on/i, /annual review/i, /assessment of/i, /evaluation/i, /findings/i, /minute[s]? of/i, /meeting record/i, /committee record/i, /proceedings/i, /committee meeting/i, /regulatory digest/i, /transparency data/i, /corporate report/i, /independent report/i, /landscape report/i, /performance update/i, /transaction data/i, /workforce management/i, /spending over/i, /stress test.*results/i, /peer review/i, /financial stability report/i, /oral evidence/i, /select committee/i, /consortium minutes/i, /outcomes of meetings/i, /treasury select/i, /appointment hearing/i, /regulating for impact/i, /privacy.*spotlight/i, /under spotlight/i] },
  { type: 'Letter', patterns: [/dear ceo/i, /letter to/i, /correspondence/i, /written to/i, /exchange of letter/i, /letter between/i, /remit and recommendation/i] },
  { type: 'Notice', patterns: [/notice of agm/i, /notice of general meeting/i, /notice of egm/i, /egm notice/i, /posting of notice/i, /notice:/i, /notification/i, /alert:/i, /bulletin/i, /circular/i, /deadline/i, /operational notice/i, /recovered appeal/i] },
  { type: 'Announcement', patterns: [/result of agm/i, /result of general meeting/i, /results of agm/i, /results of egm/i, /outcome of/i, /meeting result/i, /agm result/i, /final results/i, /interim results/i, /interims for/i, /annual results/i, /audited results/i, /half.?year/i, /quarterly results/i, /trading update/i, /trading statement/i, /corporate update/i, /business update/i, /investor update/i, /product update/i, /financial update/i, /funding update/i, /treasury update/i, /update on/i, /appointment of/i, /appointed to/i, /appointed as/i, /resignation of/i, /passing of/i, /board changes/i, /change of name/i, /grant of share/i, /share options/i, /transaction in own shares/i, /share buyback/i, /voting rights/i, /subscription/i, /issue of/i, /convertible loan/i, /loan note/i, /loan agreement/i, /funding secured/i, /fundraise/i, /new funding/i, /retail offer/i, /bitcoin purchase/i, /patent granted/i, /patent update/i, /patent application/i, /restatement/i, /change of registered/i, /proof of reserves/i, /acquisition/i, /proposed acquisition/i, /agreement to acquire/i, /partnership/i, /contract/i, /launches/i, /launched/i, /otc application/i, /otcqb/i, /ethics approval/i, /re-domiciliation/i, /members? appointed/i, /confirms/i, /confirmed/i, /posting of q/i, /investor presentation/i, /updated.*website/i, /interest in/i, /secures/i, /mandates/i, /digital pound/i, /winding.?up order/i, /special administration/i, /new chief executive/i, /chief executive.*appointed/i, /£\d+.*million.*raise/i, /team joins/i, /non-receipt/i, /- .+ update$/i, /dfe update/i, /to move to/i, /plans to support/i, /announce plans/i, /plc - .* update/i] },
  { type: 'Administrative', patterns: [/dvla/i, /opening hours/i, /recruitment/i, /job posting/i, /vacancy/i, /coaching/i, /careers/i, /hiring/i, /job opportunities/i, /career insight/i, /case studies/i, /apprentice/i] },
  { type: 'Press Release', patterns: [/warn consumers/i, /warns? of risks/i, /finds? significant/i, /identifies gaps/i, /agents.? summary/i, /business conditions/i, /publishes/i, /sets out/i, /outlines/i, /calls for/i, /proposes/i, /collaborates/i, /highlights/i, /levy extended/i, /levy on/i, /uk deploys/i, /uk expands/i, /uk provides/i, /uk achieves/i, /uk among/i, /uk and.*to operate/i, /offers time/i, /roadmap/i, /improvements/i, /cutting.?edge/i, /innovation/i, /discount/i, /pathway/i, /new tool/i, /new online/i, /overhaul/i, /reforms/i, /scrapped/i, /targeted/i, /rogue/i, /dirty money/i, /corruption/i, /fairer/i, /simplifying/i, /change of.*ambassador/i, /civil servants/i, /education secretary/i, /heathrow/i, /selection of a scheme/i, /memorial/i, /award/i, /give confidently/i, /gurkhas/i, /soldiers/i, /armed forces/i, /defence/i, /plutonium/i, /cryptocurrency/i, /typhoon/i, /hurricane/i, /visa fraud/i, /explorer/i, /expansion/i, /brewery/i, /guarantee/i, /british high commission/i, /ambassador/i, /resilience/i, /scout missions/i, /sizewell/i, /police/i, /prioritising/i, /technology investments/i, /mpox/i, /science advice/i, /sculpture/i, /paintings/i, /leaving the uk/i, /supplier story/i, /beyond expectations/i, /overspeeding/i, /multipliers/i] },
  { type: 'Environmental', patterns: [/flood/i, /climate/i, /environmental/i, /coast path/i, /nature reserve/i, /sea.?level/i, /water efficiency/i, /deer population/i, /bathing water/i, /storm/i, /weather/i, /cold.?health alert/i, /green/i, /solar/i, /energy/i, /carbon/i, /emissions/i, /net zero/i] },
  { type: 'Report', patterns: [/fatf code/i, /fatf presidency/i, /fatf president/i, /fatf secretariat/i, /history of the fatf/i, /mandate of the fatf/i, /fsb plenary/i, /fsb.*meets/i, /fsb.*mission/i, /regional consultative/i, /work plan/i, /initiatives grid/i, /list of.*firms/i, /list of ports/i, /monthly.*data/i, /o-sii/i] }
]

async function classify() {
  console.log('🔍 Keyword-based classification (no AI)\n')

  const client = await dbService.pool.connect()
  try {
    const { rows } = await client.query(`
      SELECT id, headline, summary FROM regulatory_updates
      WHERE content_type = 'Other' OR content_type = 'OTHER'
    `)

    console.log(`📊 Found ${rows.length} records to classify\n`)

    let updated = 0, unchanged = 0

    for (const row of rows) {
      const text = `${row.headline || ''} ${row.summary || ''}`.toLowerCase()
      let matched = null

      for (const rule of RULES) {
        if (rule.patterns.some(p => p.test(text))) {
          matched = rule.type
          break
        }
      }

      if (matched) {
        await client.query('UPDATE regulatory_updates SET content_type = $1 WHERE id = $2', [matched, row.id])
        updated++
        process.stdout.write(`✅`)
      } else {
        unchanged++
        process.stdout.write(`⏭️`)
      }

      if ((updated + unchanged) % 50 === 0) {
        console.log(` [${updated + unchanged}/${rows.length}]`)
      }
    }

    console.log(`\n\n${'='.repeat(50)}`)
    console.log(`✅ Updated: ${updated}`)
    console.log(`⏭️ Unchanged: ${unchanged}`)
    console.log(`${'='.repeat(50)}`)

  } finally {
    client.release()
  }
  process.exit(0)
}

classify()
