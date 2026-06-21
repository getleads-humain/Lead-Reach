---
title: "China — B2B Prospecting Regional Guide"
slug: region-china
category: regions
tags: [china, prc, apac, greater-china, mainland-china]
agents: [atlas, scout, forge, sage, judge, bard]
regions: [china, cn, prc, mainland-china, greater-china]
intent_types: [research_company, build_icp, compose_outreach, find_suppliers]
priority: 87
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "Regional B2B prospecting guide for mainland China. SAIC, PIPL, WeChat, regional hubs, sectors, channels, and cultural norms."
---

# China — B2B Prospecting Regional Guide

## 1. Country Overview

Mainland China is the world's second-largest economy (~$17T GDP), the largest manufacturing base on earth, and the most digitally-mediated B2B market in the world. The business environment is structurally different from the US/EU/India in three fundamental ways: (1) the **digital ecosystem is closed** — Google, LinkedIn, Twitter, Facebook, YouTube, Gmail, and most Western platforms are blocked by the Great Firewall, and the operating channels are WeChat (微信), DingTalk (钉钉), Feishu (飞书), Weibo, Xiaohongshu, and Baidu; (2) **data is fragmented across provincial SAIC bureaus** and unified only at the National Enterprise Credit Information Publicity System (NECIPS), with commercial aggregators (Tianyancha 天眼查, Qichacha 企查查, Aiqicha) providing the de facto working layer; and (3) **relationships (guanxi 关系)** and **face (mianzi 面子)** govern every commercial interaction at a depth Westerners routinely underestimate. Prospecting in China is not a translation of a US playbook — it requires a different toolkit, different channels, different compliance posture, and different cultural fluency.

China has 50M+ registered enterprises and ~180M market entities (including sole proprietors and individual businesses). State-owned enterprises (SOEs) still account for ~30% of GDP and dominate strategic sectors (banking, energy, telecom, defence); private enterprises (including tech giants like Tencent, Alibaba, ByteDance, Midea) account for the rest. Foreign-invested enterprises (FIEs) operate under a separate regulatory regime and frequently serve as bridgehead targets for foreign B2B vendors. The regulatory environment has tightened sharply since 2020–2021: the Personal Information Protection Law (PIPL, Nov 2021), Data Security Law (DSL, Sept 2021), Cybersecurity Law (CSL, 2017), and the Cybersecurity Review Measures (2022) form an interlocking framework policed by the **Cyberspace Administration of China (CAC)** and the Ministry of Public Security (MPS). Cross-border data transfer now requires a security assessment, standard contract, or certification in most B2B contexts.

**Key facts**:
- **GDP**: ~$17T (2024), growth ~5%/year
- **Population**: ~1.41B (declining since 2022)
- **Currency**: CNY (RMB ¥, CN¥); ~7.2 ¥/USD (2024)
- **Government**: Single-party socialist republic; Chinese Communist Party (CCP) is the supreme political authority; State Council is the chief administrative authority
- **Languages**: Standard Mandarin (Putonghua 普通话) official; major regional languages include Cantonese (Yue), Shanghainese (Wu), Hokkien (Min), Hakka, and dozens of others
- **Time zone**: CST (UTC+8) — single zone nationwide
- **Internet penetration**: ~77% (~1.1B users)
- **Business centres**: Beijing (govt, SOE HQs, tech), Shanghai (finance, foreign HQs), Shenzhen (tech, hardware, EV), Guangzhou (trade, manufacturing), Hangzhou (e-commerce, internet), Chengdu (west China tech, gaming), Suzhou (manufacturing, semiconductors), Tianjin (industrial, port), Wuhan (optics, autos), Nanjing (software, education)

## 2. Regulatory & Compliance Framework

### PIPL (Personal Information Protection Law) 2021
PIPL is China's comprehensive personal information protection law, effective 1 November 2021. It is structurally modelled on GDPR but with several Chinese characteristics — particularly the heavy emphasis on **cross-border data transfer** and the role of the **CAC** as the supervening authority. Key provisions relevant to B2B prospecting:

- **Consent**: Processing personal information requires **informed, voluntary consent** (Article 13–14). There are limited lawful bases beyond consent (legal duty, public health, news, etc.), and they are narrower than GDPR's legitimate interest.
- **Separate consent**: Sensitive personal information (biometrics, religion, health, financial accounts, children under 14) requires "separate consent" — bundled checkboxes do not qualify.
- **Purpose limitation & minimisation**: Standard data protection principles.
- **Data subject rights**: Access, copy, correction, deletion, portability, withdrawal of consent, explanation of automated decisions.
- **Cross-border transfer** (Articles 38–43): Personal information can be transferred outside mainland China only via one of three lawful mechanisms:
  1. **CAC Security Assessment** — mandatory for Critical Information Infrastructure Operators (CIIOs), processors of >1M individuals' data, or those transferring >100K individuals' data or >10K sensitive records cumulatively since 1 Jan of the prior year
  2. **Standard Contract (SCC)** — for smaller-volume transfers; requires filing with provincial CAC
  3. **Certification** — via China Cybersecurity Review Technology and Certification Center (ISCCC)
- **Penalties**: Up to **¥50M (~$7M) or 5% of prior-year turnover** for serious violations; personal fines for responsible individuals up to ¥1M; criminal liability under Article 253A of the Criminal Law.

PIPL applies extraterritorially: foreign processors targeting individuals in mainland China must designate a domestic representative, establish a domestic contact point, and comply with PIPL — even without a China establishment.

### DSL (Data Security Law) 2021 & CSL (Cybersecurity Law) 2017
The DSL governs **"important data"** and **"core data"** (categories of national-security significance) and imposes classification, risk assessment, and export control obligations. The CSL governs network operators, critical information infrastructure operators (CIIOs), and personal data within the cyber domain. Together with PIPL, these three laws form the "troika" of Chinese data regulation. Foreign B2B prospecting operations must assume that contact lists of Chinese decision-makers, technographic data on Chinese companies, and any dataset locatable to a Chinese entity may trigger DSL/CSL classification.

### Multi-Level Protection Scheme (MLPS 2.0)
MLPS 2.0 (Cybersecurity Classified Protection 2.0) is the mandatory cybersecurity framework for network operators in China. It classifies systems into five levels based on the sensitivity of data handled; Level 3+ requires registration with the Public Security Bureau (PSB), regular audits, and use of certified Chinese-origin security products. Foreign SaaS vendors operating in China typically need to navigate MLPS 2.0 to host data on Chinese soil.

### CAC Oversight
The Cyberspace Administration of China (`cac.gov.cn`) is the lead regulator for cross-border data, content, and platform oversight. CAC approval is required for: cross-border personal information transfers above thresholds, listings of platform companies with >1M users abroad, algorithms that influence public opinion, and any "important data" export. CAC enforcement is administrative but can escalate to criminal referrals.

### ICP Filing for Websites
Any website hosted on a server located in mainland China must obtain an **ICP Filing (ICP 备案)** from the Ministry of Industry and Information Technology (MIIT) via the provincial Communications Administration. There are two main types:
- **ICP Recordal (ICP 备案)** — for non-commercial informational sites
- **ICP Commercial License (ICP 经营许可证)** — for commercial internet information services

Without an ICP filing, a domain cannot resolve to a mainland-China-hosted server; foreign-hosted domains are accessible inside China only if not blocked by the Great Firewall (which many foreign SaaS marketing sites effectively are, due to slow CDN routes or active filtering).

## 3. Business Registration & Identification

### SAIC / SAMR — The Primary Registry
**Authority**: State Administration for Market Regulation (SAMR, 国家市场监督管理总局) — the merged entity (2018) of the former State Administration for Industry and Commerce (SAIC), AQSIQ, and CFDA. SAMR oversees company registration, trademarks, anti-monopoly, and food/drug safety.
**Public system**: National Enterprise Credit Information Publicity System (NECIPS, 国家企业信用信息公示系统) — `gsxt.gov.cn`

NECIPS is the canonical free public registry for all Chinese market entities. It provides:
- **Unified Social Credit Code (统一社会信用代码, USCC)** — 18-character alphanumeric identifier issued since the 2015 reform, replacing the previous separate registration, organisation, and tax codes. Format: 1 division (1=G/9=legal person, etc.) + 1 type + 6 administrative division + 9 body + 1 check digit. Example: `91110108MA00xxxxxx`.
- **Entity name** (Chinese registered name) + **English trading name** (if filed)
- **Legal representative** (法定代表人) — the named individual legally responsible for the entity
- **Registered capital** (注册资本) — subscribed, not necessarily paid-in
- **Establishment date**, **business term** (often 20–50 years or "long-term")
- **Business scope** (经营范围) — detailed list of permitted activities; operating outside this scope is a violation
- **Registered address** (住所) — must be a physical PRC address
- **Status** — `存续 (active)`, `注销 (deregistered)`, `吊销 (license revoked)`, `迁出 (moved out)`
- **Annual report** (年度报告) — filed by 30 June each year via NECIPS; includes operating status, equity structure, financials (self-declared)
- **Shareholder structure** (投资人/股东) — with USCC or ID number of each shareholder
- **Administrative penalties**, **abnormal operations list**, **serious violations list** — three "credit" lists that gate procurement participation

### Commercial Aggregators (The Working Layer)
Because NECIPS is slow and lacks deep cross-references, almost all Chinese B2B prospecting uses commercial aggregators that repackage government data with risk signals, judicial records, IP holdings, and news:
- **Tianyancha 天眼查** (`tianyancha.com`) — most popular; app + web; free basic, paid premium; private company depth
- **Qichacha 企查查** (`qcc.com`) — second-largest; similar coverage; stronger on judicial records
- **Aiqicha 爱企查** (`aiqicha.baidu.com`) — Baidu's offering; integrated with Baidu search
- **Qixin 启信宝** (`qixin.com`) — strong in finance and risk data
- **11467.com** — older directory-style site; useful for SME trade

These aggregators provide USCC lookup, shareholder chain tracing (often 5+ layers deep for Chinese group structures), beneficial owner identification, branch lists, judicial cases, IP filings, and bid history. Most have free tiers; full data requires annual subscriptions (¥1,000–¥10,000+).

### Common Entity Types
- **有限责任公司 (Limited Liability Company, LLC)** — most common; ~50M+ active; equivalent to Ltd
- **股份有限公司 (Joint Stock Limited Company, JSLC)** — public-style structure; min 2 promoters, min capital ¥5M
- **个体工商户 (Individual Business / Sole Proprietorship)** — ~120M+; not a separate legal person; common for retail, services
- **合伙企业 (Partnership Enterprise)** — including limited partnerships (LP) used in PE/VC
- **外商投资企业 (Foreign-Invested Enterprise, FIE)** — including WFOE (Wholly Foreign-Owned Enterprise) and JV (Joint Venture); unified regime under the 2020 Foreign Investment Law
- **国有企业 (State-Owned Enterprise, SOE)** — central SOEs under SASAC (~100), provincial/local SOEs (~100K)
- **上市公司 (Listed Company)** — ~5,300 on Shanghai, Shenzhen, Beijing stock exchanges

### Other Identifiers
- **Tax ID (纳税人识别号)** — same as USCC for most entities
- **VAT general taxpayer status** (一般纳税人) — revenue threshold >¥5M; differentiates SMEs from larger taxpayers
- **Customs code** — for importers/exporters
- **HS code** — for product classification in trade
- **Stock ticker** — Shanghai (60xxxx), Shenzhen Main (000xxx), Shenzhen ChiNext (300xxx), STAR Market (688xxx), Beijing (8xxxxx)

## 4. Regional Hubs & Industry Specialisations

| City / Region | Core Industries | Marquee Companies |
|---|---|---|
| Beijing | Government, SOE HQs, internet, AI, education | ByteDance, Baidu, Kuaishou, JD.com (founded), Lenovo HQ, Xiaomi HQ, banks HQ (ICBC, BOC, CCB), Sinopec, CNPC |
| Shanghai | Finance, foreign HQs, semiconductors, EV | SAIC Motor, Fosun, PDD (Pinduoduo), SMIC, NIO HQ, Bank of Communications, various hedge funds |
| Shenzhen | Hardware, internet, EV, telecom | Tencent, Huawei, BYD, DJI, Ping An, Foxconn (Longhua), ZTE, SF Express |
| Guangzhou | Trade, e-commerce, FMCG, autos | Shein (founded), Tencent Cloud South, GAC Group, China Southern Airlines, Pagoda (水果) |
| Hangzhou | E-commerce, internet, fintech | Alibaba HQ, Ant Group, NetEase, Hikvision, Hupu |
| Chengdu | Gaming, IT services, west-China tech | Tencent Chengdu (gaming), Perfect World, ByteDance Chengdu, Intel Chengdu |
| Suzhou | Semiconductors, manufacturing, biotech | Suzhou Industrial Park tenants, BOE Technology, Innovent Biologics, Panasonic |
| Tianjin | Industrial, port, finance | Airbus China final assembly, TEDA zone, Tianjin Port, Huayuan Electric |
| Wuhan | Optics, autos, biotech | Yangtze Memory (YMTC), Dongfeng Motor, Optics Valley companies |
| Nanjing | Software, education, electronics | Suning HQ, ZTE Nanjing, BOE Nanjing, BASF Nanjing |
| Xi'an | Aerospace, semiconductors, defence | AVIC Xi'an, BYD Xi'an, Samsung Xi'an NAND fab, Huawei Xi'an |
| Chongqing | Manufacturing, autos, electronics | Chang'an Auto, BOE Chongqing, Foxconn Chongqing |
| Hefei | Memory chips, displays, EV | ChangXin Memory (CXMT), BOE, NIO Hefei manufacturing, Anhui Conch Cement |
| Xiamen | Trade, electronics | Xiamen Airlines, King Long Motor, TCL Xiamen |
| Qingdao | Appliances, ports, FMCG | Haier HQ, Hisense HQ, Tsingtao Beer, BYD Qingdao |
| Dongguan | Manufacturing supply chain | Foxconn Dongguan, Huawei Songshan Lake R&D, OPPO, vivo |

### Greater Bay Area (GBA)
The Pearl River Delta cluster (Guangzhou, Shenzhen, Hong Kong, Macau, Dongguan, Foshan, Zhuhai, etc.) is the world's largest urban-economic zone by output (~$2T combined GDP). Shenzhen is the global hardware capital (1-hour supply chain from concept to prototype); Hong Kong remains the financial gateway (despite reduced role since 2020); Macau is the gaming/tourism hub. The Chinese government's Greater Bay Area plan aims to integrate these by 2035. Prospecting in the GBA requires fluency in the Shenzhen-startup vs HK-finance divide.

### Yangtze River Delta (YRD)
The YRD (Shanghai, Jiangsu, Zhejiang, Anhui) is China's second-largest economic zone (~$4T combined GDP). Shanghai anchors finance and FIE HQs; Hangzhou anchors e-commerce (Alibaba); Suzhou anchors semiconductors and biotech; Hefei anchors memory chips and EV. The YRD is more foreign-investor-friendly than the GBA in tone; English is more widely used in Shanghai than in Shenzhen.

### Beijing-Tianjin-Hebei (Jing-Jin-Ji)
Beijing is the political capital and SOE HQ cluster; Tianjin is the industrial port; Hebei is the heavy-industry periphery. Prospecting into SOEs in this zone requires a Beijing-based relationship (often via industry associations or chambers of commerce); cold outreach to SOEs is largely ineffective.

## 5. Dominant Industries

### Internet & Consumer Tech
China's internet sector is anchored by **Tencent** (WeChat, gaming, payments), **Alibaba** (Taobao, Tmall, AliCloud), **ByteDance** (Douyin, TikTok's parent), **Meituan** (local services), **JD.com** (e-commerce), **PDD/Pinduoduo** (social commerce), **Baidu** (search, AI), **Kuaishou** (short video), **NetEase** (gaming), and **Xiaohongshu/RED** (lifestyle social). The era of foreign competition in these sectors is essentially over — the Great Firewall plus regulatory hostility to foreign platforms has produced a closed ecosystem. Foreign B2B prospecting targets in this sector are typically: (a) ad agencies wanting to place ads in China, (b) component suppliers for hardware, (c) SaaS vendors to foreign subsidiaries operating in China, (d) cross-border e-commerce enablers.

### Manufacturing & Hardware
China is the world's largest manufacturing economy (~30% of global output). Marquee manufacturers: **BYD** (EVs and batteries), **CATL** (EV batteries, world #1), **Foxconn/Hon Hai** (EMS for Apple, etc.), **Haier** (appliances), **Midea** (appliances), **Gree** (appliances), **Lenovo** (PCs), **Xiaomi** (smartphones, IoT), **Huawei** (telecom, smartphones), **DJI** (drones, ~70% global share), **BOE** (displays), **SMIC** (semiconductor foundry), **TCL** (displays), **Sany** (construction equipment), **XCMG** (construction equipment). The supply chain density in Shenzhen-Dongguan-Guangzhou is unmatched globally; a hardware prototype can move from concept to volume production in 4–8 weeks.

### Telecommunications & Equipment
**Huawei** and **ZTE** are the global telecom-equipment majors (subject to US sanctions since 2019). The three state-owned carriers — China Mobile, China Telecom, China Unicom — run the domestic network. **China Tower** manages physical cell-tower infrastructure. The 5G rollout is the world's largest; the Open RAN debate and sanctions have reshaped the supply chain.

### Electric Vehicles (EV)
China is the world's largest EV market (~9M units/year, ~25M including hybrids, 2024) and producer. Marquee EV makers: **BYD** (world #1 EV including PHEV), **Tesla China** (Shanghai Gigafactory, largest by volume), **NIO** (高端 premium), **Li Auto** (EREV), **Xpeng** (smart driving), **Geely** (Zeekr, Polestar), **GAC Aion**, **Changan** (Deepal, Avatr), **Chery** (Exeed). Battery majors: **CATL** (~37% global share), **BYD FinDreams**, **CALB**, **Gotion**, **SVOLT**. The supply chain (lithium, cathode, anode, separator, electrolyte) is heavily Chinese.

### FinTech
Ant Group (Alipay) is the dominant payments platform; Tencent's WeChat Pay is the duopoly partner. **UnionPay** is the state card network. The PBOC's digital yuan (e-CNY) is in advanced pilots. Cross-border RMB clearing runs through CIPS (Cross-border Interbank Payment System). The **PBOC** (People's Bank of China) is the central bank and lead regulator; **NFRA** (National Financial Regulatory Administration, 2023 successor to CBIRC) regulates banks and insurers; **CSRC** (China Securities Regulatory Commission) regulates securities.

### Pharmaceuticals & Biotech
China is the world's second-largest pharma market. Major players: **Sinopharm**, **Shanghai Pharmaceuticals**, **Yangtze River Pharmaceutical**, **Hengrui Medicine** (innovation-led), **BeiGene** (oncology, dual-listed), **Innovent Biologics**, **WuXi Biologics** (CDMO), **WuXi AppTec** (CRO). NMPA (National Medical Products Administration, formerly CFDA) is the regulator; the volume-based procurement (VBP) programme has radically compressed drug margins since 2018.

### Financial Services
The "Big Four" state banks — **ICBC**, **Agricultural Bank of China**, **Bank of China**, **China Construction Bank** — collectively hold ~$20T in assets and dominate the system. Joint-stock banks (China Merchants, Ping An, CITIC, Industrial Bank) and city commercial banks (Bank of Beijing, Bank of Shanghai) operate with more flexibility. Foreign banks have limited market share (~2%); foreign asset managers operate mainly through JV structures.

## 6. Data Sources & Tools

### Free Official Sources
- **NECIPS** (`gsxt.gov.cn`) — National Enterprise Credit Information Publicity System; canonical free registry
- **Credit China** (`creditchina.gov.cn`) — credit records, penalties, abnormal operations, serious violations
- **CNIPA** (`cnipa.gov.cn`) — China National Intellectual Property Administration; trademark and patent search
- **CCDI** (`ccdi.gov.cn`) — anti-corruption records
- **CSRC** (`csrc.gov.cn`) — listed company disclosures
- **SSE** (`sse.com.cn`), **SZSE** (`szse.cn`), **BSE** (`bse.cn`) — stock exchange disclosures
- **MOFCOM** (`mofcom.gov.cn`) — foreign trade statistics, FIE registrations
- **NBS** (`stats.gov.cn`) — National Bureau of Statistics; macro data
- **Customs (GACC)** — import/export trade data (limited public; commercial providers fill the gap)
- **PBOC** (`pbc.gov.cn`) — credit registry, financial statistics

### Commercial Chinese Data Providers (Domestic)
- **Tianyancha 天眼查** (`tianyancha.com`) — most popular; mobile-first; private company depth
- **Qichacha 企查查** (`qcc.com`) — strongest judicial records
- **Aiqicha 爱企查** (`aiqicha.baidu.com`) — Baidu's product; deep integration with Baidu search
- **Qixin 启信宝** (`qixin.com`) — strong financial-risk signals
- **Wind 万得** (`wind.com.cn`) — Bloomberg-equivalent for Chinese listed markets; institutional-grade
- **Choice (East Money)** — financial data terminal
- **JQData 聚宽** — quant data
- **11467.com** — SME directory; older style

### Customs / Trade Data
- **ImportGenius, Panjiva, Datamyne** — global trade data with China coverage (HS-code-level)
- **52wmb.com** — Chinese trade data platform (bill of lading)
- **Customs Net 海关总署** — official customs data (limited)
- **Trade Data Monitor** — global

### Foreign B2B Databases with China Coverage
- **Dun & Bradstreet China** (`dnb.com.cn`) — D-U-N-S registered Chinese firms
- **LinkedIn** — significantly degraded since 2021 (LinkedIn China "InCareer" shut down in 2023); only accessible via VPN from inside China
- **Crunchbase** — Chinese startups (limited coverage)
- **PitchBook** — Chinese private markets (limited)
- **Statista** — Chinese market statistics
- **CB Insights** — Chinese tech coverage (limited)

### Industry & Trade Body Directories
- **CCPIT** (`ccpit.org`) — China Council for the Promotion of International Trade; foreign-facing
- **CFEC** (`mofcom.gov.cn`) — China Foreign Enterprise Consultants
- **CAFI** — China Association of Foreign-Invested Enterprises
- **CAICT** (`caict.ac.cn`) — China Academy of Information and Communications Technology; telecom/IT
- **CAAM** — China Association of Automobile Manufacturers
- **CPCA** — China Passenger Car Association (monthly EV sales data)
- **CCCME** — China Chamber of Commerce for Import and Export of Machinery and Electronic Products

### News & Press (Chinese)
- **Caixin 财新** (`caixin.com`) — premium financial/investigative
- **21st Century Business Herald 21世纪经济报道** — southern China business
- **Economic Observer 经济观察报** — weekly business
- **Yicai 第一财经** (`yicai.com`) — Shanghai-based business TV + digital
- **Pandaily** (`pandaily.com`) — English-language Chinese tech news
- **Technode** (`technode.com`) — English-language Chinese tech
- **36Kr 36氪** (`36kr.com`) — startup/VC news
- **Huxiu 虎嗅** — tech and business analysis
- **PingWest 品玩** — tech news

### Major Chinese B2B Events
- **China International Import Expo (CIIE)** (Shanghai, Nov) — government-led import showcase
- **Canton Fair 广交会** (Guangzhou, Apr & Oct, biannual) — world's largest trade fair
- **World Artificial Intelligence Conference (WAIC)** (Shanghai, July)
- **China Joy** (Shanghai, July) — gaming
- **Auto Shanghai / Auto Guangzhou / Auto China (Beijing)** — rotating biennial motor shows
- **Baidu World Conference** (Sep) — Baidu ecosystem
- **Alibaba Cloud Apsara Conference** (Hangzhou, Sep) — AliCloud ecosystem
- **Tencent Global Digital Ecosystem Summit** — Tencent enterprise
- **CIOT / Internet of Things Expo** (various)
- **World Internet Conference** (Wuzhen, Nov) — government-led internet forum

## 7. Cultural Norms for B2B

### Guanxi (关系) — Relationships as Commercial Infrastructure
**Guanxi** is the network of mutual obligations and reciprocal favours that underpins Chinese commercial life. It is not "networking" in the Western sense — guanxi relationships carry long-term moral weight, are activated for high-stakes asks, and require cultivation through repeated small exchanges (gifts, meals, introductions, favours). Building guanxi with a Chinese decision-maker typically requires 6–18 months of low-intensity interaction before a serious commercial ask is appropriate. Skipping this phase and jumping to a "let's do business" pitch reads as transactional and is frequently rebuffed. The corollary is that introductions are gold: a warm introduction from a Chinese partner, customer, or industry association raises response rates by an order of magnitude over cold outreach.

### Mianzi (面子) — Face
**Mianzi** (face) is the social standing that an individual maintains in the eyes of others. Face is given (showing respect, deferring publicly) and lost (being contradicted in public, failing to deliver on a commitment, being seen as poor or weak). Three operational implications for B2B: (1) **never publicly contradict or embarrass a Chinese counterpart** — even a factual correction should be delivered privately; (2) **status markers matter** — addressing the senior person in the room first, offering the best seat, deferring on small decisions, all signal respect; (3) **delivering bad news requires care** — frame issues as "challenges to be solved together" rather than "failures of the counterparty."

### Hierarchy
Chinese business culture is hierarchical, with the senior figure (typically the chairman 党委书记 / 法定代表人 / 董事长) as the locus of authority. The decision-making unit in a Chinese enterprise is often wider than in a Western firm (party committee, executive committee, division head, technical reviewer, procurement); each gatekeeper must be cultivated. The traditional banquet culture (banquet 宴会, drinking baijiu 白酒 — Chinese rice liquor) remains important in SOE and traditional-industry contexts, less so in tech. A first banquet often sets the tone for the entire relationship; refusing food or drink is read as rejecting the relationship.

### Festivals & Calendar
- **Chinese New Year / Spring Festival 春节** (Jan/Feb, dates vary by lunar calendar) — 7-day national holiday, 2-week slowdown; factory closures; massive travel (chunyun 春运)
- **Qingming Festival 清明** (April 4–6) — tomb-sweeping; 3-day holiday
- **Labour Day 五一** (May 1–5) — 5-day holiday (often shifted)
- **Dragon Boat Festival 端午** (lunar 5th month, 5th day) — 3-day holiday
- **Mid-Autumn Festival 中秋** (lunar 8th month, 15th day) — 3-day holiday; mooncake gifting for active accounts
- **National Day 黄金周** (Oct 1–7) — 7-day "Golden Week"; massive travel
- Note: Late Jan–mid Feb is dead (CNY); early Oct is dead (National Day Golden Week).

### Language
Mandarin (Putonghua 普通话) is the official language and the operating language of business across all mainland provinces. Cantonese (粤语) dominates Guangzhou, Shenzhen business among locals, and Hong Kong; Shanghainese (上海话) is used informally in Shanghai; Hokkien (闽南语) in Fujian and Taiwan. English fluency is high among tech workers in tier-1 cities (Beijing, Shanghai, Shenzhen, Hangzhou) and very low in tier-2/3 cities, manufacturing supply chain, and SOEs. All formal documents should be in Simplified Chinese (简体中文); English-Chinese bilingual contracts are standard for FIE deals.

## 8. Outreach Patterns — Channels, Scripts, Do's & Don'ts

### Channel Priority for China B2B
1. **WeChat 微信** — dominant for everything; B2B relationship maintenance, mini-program commerce, payments
2. **WeChat Official Account 公众号** — content marketing and brand presence; required for any foreign B2B brand in China
3. **Phone (cold call)** — works for SOEs and traditional industries; mobile-first; requires Mandarin fluency
4. **Email** — declining; mainly for foreign subsidiaries and FIEs; Chinese domestic companies rarely use email for primary communication
5. **DingTalk 钉钉 / Feishu 飞书** — enterprise messaging; Alibaba's DingTalk and ByteDance's Feishu (Lark internationally) are dominant
6. **SMS** — heavily regulated; rarely effective for B2B prospecting
7. **Xiaohongshu 小红书 / Weibo 微博 / Douyin 抖音** — primarily B2C but increasingly used for B2B brand awareness in tech and consumer brand sectors

### WeChat — The Operating System of Chinese Business
WeChat is not "China's WhatsApp" — it is a SuperApp that combines messaging, payments (WeChat Pay), mini-programs (lightweight apps), official accounts (公众号), enterprise accounts (企业微信 WeCom), Moments (朋友圈), and channels (视频号). A foreign B2B vendor without a WeCom presence is effectively invisible in Chinese B2B. Key tools:
- **WeCom (企业微信, WeChat Work internationally)** — enterprise messaging; 1.8B+ connections to consumer WeChat; required for any formal B2B relationship management
- **Official Account (公众号)** — content distribution; foreign brands need an ICP filing and a Chinese-registered entity (or a service partner)
- **Mini-Program (小程序)** — lightweight app for product demos, content gating, e-commerce
- **Channels (视频号)** — WeChat's short-video feature; growing for B2B thought leadership

Adding a prospect's WeChat is a significant relationship step — equivalent to a US prospect giving you their personal mobile number. Treat it with corresponding respect; do not message on weekends or late at night.

### SMS & Cold Email — Limited Effectiveness
SMS is heavily regulated (must have proper sender registration with telcos; rules vary by province), and Chinese B2B buyers rarely respond to cold SMS. Cold email to Chinese-domestic companies is largely ineffective — most Chinese executives do not check work email frequently, and email deliverability from foreign senders to Chinese-domestic servers (163.com, qq.com, 126.com, sina.com) is unreliable. Email works only for foreign subsidiaries (e.g., reach out to the Microsoft China or SAP China employee via their corporate email).

### WeChat Official Account Content Strategy
A foreign B2B brand targeting Chinese prospects should publish a regular cadence on a WeChat Official Account: 2–4 articles/month in Simplified Chinese, covering industry trends, case studies (with anonymised Chinese peer references), product updates, and thought leadership. Articles should be 1,500–3,000 Chinese characters, with embedded images and a clear CTA (typically a QR code to add a WeCom contact or scan a mini-program). Content should avoid politically sensitive topics (Taiwan, Xinjiang, Tibet, Hong Kong, leadership criticism) and avoid direct comparisons to Chinese competitors.

### Sample WeChat Outreach Script (Mandarin, then English gloss)
> [Opening, warm]: 王总，您好！很高兴在 [Event/Introduction] 认识您。
> (Mr. Wang, hello! Great to meet you at [Event/Introduction].)
> [Context, specific trigger]: 关注到 [Company] 近期在 [trigger — funding, expansion, new product] 方面的进展，恭喜！
> (I noticed [Company]'s recent progress on [trigger]; congratulations!)
> [Value, peer-anchored]: 我们曾协助 [Chinese peer] 在 [specific outcome — 3个月内将 X 降低 Y%]。
> (We previously helped [Chinese peer] achieve [outcome].)
> [Soft ask]: 是否方便约个 15 分钟电话或视频沟通？您看下周二或周三 14:00 方便吗？
> (Would a 15-minute call or video be convenient? Does next Tuesday or Wednesday at 14:00 work?)
> [Cultural close]: 期待您的回复，祝工作顺利！
> (Looking forward to your reply; wishing you smooth work!)

### Email Outreach Script (for FIE / Foreign Subsidiary)
> Subject: Quick idea for [Company] China — peer reference inside
>
> Dear [First name],
>
> Hope you are well. I lead [your function] at [your company], where we've helped companies like [peer 1], [peer 2] in China deliver [specific outcome]. I noticed [Company] China's recent [trigger] and thought a similar approach might be relevant.
>
> Would a 15-minute call next Tuesday or Wednesday at 14:00 CST suit? Happy to share a 1-pager in Simplified Chinese first.
>
> Best regards,
> [Name]
> [Company] · [Chinese entity name if any]

### Send Times (CST, UTC+8)
- **Best days**: Tuesday–Thursday (Monday is recovery; Friday afternoon dead)
- **Best WeChat/WeCom times**: 10:00–11:30 (pre-lunch), 14:30–17:00 (post-lunch revival)
- **Best call times**: 10:00–11:30, 14:30–17:00
- **Avoid**: 12:00–14:00 (lunch + nap), after 18:00 (family time), weekends, festivals
- **Avoid weeks**: CNY week (late Jan–mid Feb), National Day Golden Week (Oct 1–7)

### Do's
- Do build a WeCom presence and Official Account before any China B2B campaign
- Do provide Simplified Chinese content and contracts
- Do use Mandarin for primary communication (with translator if needed)
- Do invest in 6–18 months of relationship cultivation before major asks
- Do accept WeChat adds from prospects; respond within business hours
- Do show respect to senior figures (status markers, deference)
- Do respect the festival calendar — gifting (mooncakes at Mid-Autumn) for active accounts
- Do engage a Chinese partner or distributor for complex/regulated sectors

### Don'ts
- Don't rely on email or SMS as primary B2B channels — they underperform in China
- Don't use LinkedIn or Twitter or Google as primary channels — blocked by GFW
- Don't publicly contradict or embarrass a Chinese counterpart — mianzi
- Don't discuss Taiwan, Tibet, Xinjiang, Hong Kong, or leadership politics in any B2B context
- Don't transfer personal data of Chinese individuals offshore without CAC security assessment / SCC
- Don't skip ICP filing for any mainland-hosted site
- Don't expect quick decisions — Chinese B2B is multi-stakeholder and slow
- Don't bring up price too early — relationship and trust come first

## 9. Common Pitfalls

### Pitfall 1: PIPL Cross-Border Data Transfer Non-Compliance
The single biggest compliance trap. Moving personal information of Chinese individuals offshore (including to a US or EU CRM) without a CAC security assessment, standard contract filing, or certification is a serious PIPL violation with administrative fines up to ¥50M or 5% of global turnover. Always map data flows before launching any China-targeting prospecting infrastructure.

### Pitfall 2: ICP Filing Missing
Hosting a website on a mainland-China server without ICP filing is illegal; foreign-hosted sites may be slow or blocked. Foreign SaaS marketing sites targeting Chinese prospects often need a separate `.cn` domain with ICP filing or a Hong Kong-hosted mirror — without it, conversion rates collapse.

### Pitfall 3: Great Firewall Blindness
LinkedIn, Google, YouTube, Twitter, Facebook, Gmail are all blocked. A campaign relying on these channels will not reach Chinese prospects (only the small fraction using VPNs, mostly tech workers). The operating channels are WeChat, WeCom, DingTalk, Feishu, Baidu, Weibo, Xiaohongshu, Douyin.

### Pitfall 4: Treating China as One Market
Beijing SOEs, Shanghai FIEs, Shenzhen hardware startups, Hangzhou e-commerce, Chengdu gaming — these are five different markets with different languages, decision styles, and tech stacks. Segment by city, industry, and ownership structure (SOE vs private vs FIE).

### Pitfall 5: Underestimating Guanxi & Mianzi
Western-style "I'll just email the CEO" rarely works in China. Decisions route through party committees, executive committees, and informal guanxi networks; cultivating 2–3 internal champions and an external introducer is the standard pattern. Skipping the relationship phase is the most common foreign-vendor failure mode.

### Pitfall 6: Politically Sensitive Missteps
Public commentary on Taiwan (always "Taiwan, China" or "Chinese Taipei" in business contexts), Tibet, Xinjiang, Hong Kong, the CCP leadership, the 1989 Tiananmen events, or human rights is career-ending for the relationship. Even private banter can be reported. Train all customer-facing staff on the red lines.

### Pitfall 7: Data Source Fragmentation
NECIPS is canonical but slow and shallow; commercial aggregators (Tianyancha, Qichacha, Aiqicha) are fast and deep but have differences in coverage and freshness. Cross-verify any material prospect across at least two sources; judicial records are particularly variable.

### Pitfall 8: Festival Calendar Neglect
CNY (late Jan–mid Feb) and National Day Golden Week (Oct 1–7) effectively shut down B2B China for 2 weeks each. Mid-Autumn Festival and Dragon Boat Festival produce 3-day slowdowns. Launching a campaign during these windows is wasted budget.

### Pitfall 9: Wrong Entity Type Assumptions
Chinese 有限责任公司 (LLC) is not the same as a US LLC; 股份有限公司 (JSLC) is not always publicly listed. Foreign vendors frequently misclassify Chinese counterparties. Always look up the USCC and business scope (经营范围) on NECIPS before drafting contracts.

## 10. Quick Reference Table

| Dimension | China Standard |
|---|---|
| Population | ~1.41B |
| GDP | ~$17T |
| Currency | CNY (¥), ~7.2/USD |
| Language(s) | Standard Mandarin (Putonghua); Cantonese, Shanghainese, regional |
| Time zone | CST (UTC+8) — single zone |
| Primary registry | NECIPS (`gsxt.gov.cn`) under SAMR |
| Entity ID | Unified Social Credit Code (USCC) — 18 chars |
| Common entities | LLC, JSLC, Individual Business, Partnership, FIE (WFOE/JV), SOE |
| Regulator (data) | CAC + MPS + MIIT; PIPL 2021, DSL 2021, CSL 2017 |
| Cross-border transfer | CAC Security Assessment / SCC / Certification required |
| Website filing | ICP filing mandatory for mainland-hosted sites |
| Financial regulators | PBOC, NFRA, CSRC |
| Stock exchanges | SSE, SZSE, BSE |
| Fines (max) | ¥50M or 5% global turnover (PIPL) |
| Best email days | Tue–Thu (FIEs/foreign subs only) |
| Best WeChat times | 10:00–11:30, 14:30–17:00 CST |
| Best call times | 10:00–11:30, 14:30–17:00 CST |
| Cultural tone | Hierarchical, relationship-driven, mianzi-sensitive |
| Spelling | Simplified Chinese characters (简体中文) |
| Blocked (GFW) | Google, LinkedIn, Twitter, Facebook, YouTube, Gmail |
| Operating channels | WeChat, WeCom, DingTalk, Feishu, Baidu, Weibo, Xiaohongshu |
| Major blackout weeks | CNY (late Jan–mid Feb), National Day (Oct 1–7) |

## 11. LeadReach Pipeline for China Prospecting

1. **Atlas** identifies China as target geography and decomposes by region (Beijing, Shanghai, Shenzhen, Hangzhou, etc.), ownership (SOE vs private vs FIE), and segment (corporate/SME/startup)
2. **Sage** loads this China knowledge file + relevant industry knowledge (e.g., `industries/manufacturing.md` for hardware, `industries/saas.md` for SaaS to FIEs)
3. **Scout** searches:
   - NECIPS (`gsxt.gov.cn`) — canonical entity verification
   - Tianyancha / Qichacha / Aiqicha — enriched entity + shareholder + judicial data
   - Credit China — penalty and abnormal-operations check
   - CNIPA — trademark and patent holdings
   - CSRC + SSE/SZSE/BSE — listed-company disclosures (where applicable)
   - Wind / East Money — listed-company financials
   - Caixin / Yicai / 36Kr / Pandaily — news and trigger events
   - Industry associations (CCPIT, CAAM, CAICT) — member directories
4. **Forge** enriches with:
   - NECIPS annual report (equity, financials self-declared)
   - Shareholder chain trace (often 3–5+ layers for group structures)
   - Beneficial owner identification
   - Judicial records (cases, executions, dishonest debtor list)
   - Trademark/patent portfolio
   - WeChat Official Account presence + recent posts
   - News + press releases for triggers (funding, executive moves, regulatory actions)
5. **Judge** qualifies by:
   - Active status on NECIPS (no 注销 / 吊销)
   - Not on abnormal-operations or serious-violations list
   - Operating status (存续) and business scope match
   - Registered capital (as a proxy for scale, with caution — subscribed not paid)
   - Trigger recency (funding, hire, expansion within 90 days)
   - PIPL/DSL data-flow feasibility for the prospect's industry
   - ICP filing status (if a website is involved)
   - ICP match across all dimensions
6. **Bard** prepares outreach:
   - Channel: WeCom / WeChat primary; email only for FIE / foreign subsidiary
   - Simplified Chinese content (or English for FIEs)
   - Peer references (Chinese companies), outcome-anchored
   - PIPL-compliant (no offshore personal-data transfer without CAC mechanism)
   - Politically neutral, mianzi-sensitive, deference-appropriate
   - Senior-figure address conventions (王总, 李总, etc.)
7. **Flow** routes to sequence (WeCom message → phone call → optional email for FIEs → in-person meeting if relationship developed) with patient 6–18-month cultivation cycle
8. **Echo** reports with China-specific benchmarks (target WeChat reply rate >40% for warm contacts; cold conversion via WeCom >5%; complaint rate <0.01%; festival-week dips expected) and flags CAC compliance posture for any cross-border data flow
