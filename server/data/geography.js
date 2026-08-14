/**
 * geography.js — Kenya's 47 counties and 290 constituencies.
 *
 * Source: IEBC / Constitution First Schedule (via Wikipedia
 * "Constituencies of Kenya"), verified at 47 counties / 290 constituencies.
 * This is authoritative administrative data — the navigation backbone.
 *
 * `covered: true` marks constituencies whose OAG audit data has actually
 * been ingested and verified. Everything else shows honestly as "data
 * coming" — the map of the country is complete; the evidence fills in as
 * each county's Auditor-General reports are processed. We never mark a
 * place covered before its primary-source data exists.
 *
 * Regenerate: scratchpad/gen_geography.py
 */

export const counties = [
  {
    name: "Mombasa",
    code: 1,
    constituencies: [
      { name: "Changamwe", covered: true  },
      { name: "Jomvu", covered: false },
      { name: "Kisauni", covered: true  },
      { name: "Nyali", covered: false },
      { name: "Likoni", covered: false },
      { name: "Mvita", covered: false },
    ],
  },
  {
    name: "Kwale",
    code: 2,
    constituencies: [
      { name: "Msambweni", covered: false },
      { name: "Lunga Lunga", covered: false },
      { name: "Matuga", covered: false },
      { name: "Kinango", covered: false },
    ],
  },
  {
    name: "Kilifi",
    code: 3,
    constituencies: [
      { name: "Kilifi North", covered: true  },
      { name: "Kilifi South", covered: false },
      { name: "Kaloleni", covered: false },
      { name: "Rabai", covered: true  },
      { name: "Ganze", covered: false },
      { name: "Malindi", covered: true  },
      { name: "Magarini", covered: false },
    ],
  },
  {
    name: "Tana River",
    code: 4,
    constituencies: [
      { name: "Garsen", covered: false },
      { name: "Galole", covered: false },
      { name: "Bura", covered: false },
    ],
  },
  {
    name: "Lamu",
    code: 5,
    constituencies: [
      { name: "Lamu East", covered: false },
      { name: "Lamu West", covered: false },
    ],
  },
  {
    name: "Taita-Taveta",
    code: 6,
    constituencies: [
      { name: "Taveta", covered: false },
      { name: "Wundanyi", covered: false },
      { name: "Mwatate", covered: false },
      { name: "Voi", covered: false },
    ],
  },
  {
    name: "Garissa",
    code: 7,
    constituencies: [
      { name: "Garissa Township", covered: false },
      { name: "Balambala", covered: false },
      { name: "Lagdera", covered: false },
      { name: "Dadaab", covered: false },
      { name: "Fafi", covered: false },
      { name: "Ijara", covered: false },
    ],
  },
  {
    name: "Wajir",
    code: 8,
    constituencies: [
      { name: "Wajir North", covered: false },
      { name: "Wajir East", covered: false },
      { name: "Tarbaj", covered: false },
      { name: "Wajir West", covered: false },
      { name: "Eldas", covered: false },
      { name: "Wajir South", covered: false },
    ],
  },
  {
    name: "Mandera",
    code: 9,
    constituencies: [
      { name: "Mandera West", covered: false },
      { name: "Banissa", covered: false },
      { name: "Mandera North", covered: false },
      { name: "Mandera South", covered: false },
      { name: "Mandera East", covered: false },
      { name: "Lafey", covered: false },
    ],
  },
  {
    name: "Marsabit",
    code: 10,
    constituencies: [
      { name: "Moyale", covered: false },
      { name: "North Horr", covered: false },
      { name: "Saku", covered: false },
      { name: "Laisamis", covered: false },
    ],
  },
  {
    name: "Isiolo",
    code: 11,
    constituencies: [
      { name: "Isiolo North", covered: false },
      { name: "Isiolo South", covered: false },
    ],
  },
  {
    name: "Meru",
    code: 12,
    constituencies: [
      { name: "Igembe South", covered: false },
      { name: "Igembe Central", covered: false },
      { name: "Igembe North", covered: false },
      { name: "Tigania West", covered: false },
      { name: "Tigania East", covered: false },
      { name: "North Imenti", covered: false },
      { name: "Buuri", covered: false },
      { name: "Central Imenti", covered: false },
      { name: "South Imenti", covered: false },
    ],
  },
  {
    name: "Tharaka-Nithi",
    code: 13,
    constituencies: [
      { name: "Maara", covered: false },
      { name: "Chuka/Igambang'ombe", covered: false },
      { name: "Tharaka", covered: false },
    ],
  },
  {
    name: "Embu",
    code: 14,
    constituencies: [
      { name: "Manyatta", covered: false },
      { name: "Runyenjes", covered: false },
      { name: "Mbeere South", covered: false },
      { name: "Mbeere North", covered: false },
    ],
  },
  {
    name: "Kitui",
    code: 15,
    constituencies: [
      { name: "Mwingi North", covered: false },
      { name: "Mwingi West", covered: false },
      { name: "Mwingi Central", covered: false },
      { name: "Kitui West", covered: false },
      { name: "Kitui Rural", covered: false },
      { name: "Kitui Central", covered: false },
      { name: "Kitui East", covered: false },
      { name: "Kitui South", covered: false },
    ],
  },
  {
    name: "Machakos",
    code: 16,
    constituencies: [
      { name: "Masinga", covered: true  },
      { name: "Yatta", covered: false },
      { name: "Kangundo", covered: true  },
      { name: "Matungulu", covered: false },
      { name: "Kathiani", covered: false },
      { name: "Mavoko", covered: false },
      { name: "Machakos Town", covered: false },
      { name: "Mwala", covered: false },
    ],
  },
  {
    name: "Makueni",
    code: 17,
    constituencies: [
      { name: "Mbooni", covered: false },
      { name: "Kilome", covered: false },
      { name: "Kaiti", covered: false },
      { name: "Makueni", covered: false },
      { name: "Kibwezi West", covered: false },
      { name: "Kibwezi East", covered: false },
    ],
  },
  {
    name: "Nyandarua",
    code: 18,
    constituencies: [
      { name: "Kinangop", covered: false },
      { name: "Kipipiri", covered: true  },
      { name: "Ol Kalou", covered: true  },
      { name: "Ol Jorok", covered: false },
      { name: "Ndaragwa", covered: false },
    ],
  },
  {
    name: "Nyeri",
    code: 19,
    constituencies: [
      { name: "Tetu", covered: false },
      { name: "Kieni", covered: false },
      { name: "Mathira", covered: false },
      { name: "Othaya", covered: false },
      { name: "Mukurweini", covered: false },
      { name: "Nyeri Town", covered: false },
    ],
  },
  {
    name: "Kirinyaga",
    code: 20,
    constituencies: [
      { name: "Mwea", covered: false },
      { name: "Gichugu", covered: false },
      { name: "Ndia", covered: false },
      { name: "Kirinyaga Central", covered: false },
    ],
  },
  {
    name: "Murang'a",
    code: 21,
    constituencies: [
      { name: "Kangema", covered: false },
      { name: "Mathioya", covered: false },
      { name: "Kiharu", covered: false },
      { name: "Kigumo", covered: true  },
      { name: "Maragwa", covered: false },
      { name: "Kandara", covered: false },
      { name: "Gatanga", covered: true  },
    ],
  },
  {
    name: "Kiambu",
    code: 22,
    constituencies: [
      { name: "Gatundu South", covered: false },
      { name: "Gatundu North", covered: false },
      { name: "Juja", covered: false },
      { name: "Thika Town", covered: false },
      { name: "Ruiru", covered: false },
      { name: "Githunguri", covered: false },
      { name: "Kiambu", covered: false },
      { name: "Kiambaa", covered: false },
      { name: "Kabete", covered: false },
      { name: "Kikuyu", covered: false },
      { name: "Limuru", covered: false },
      { name: "Lari", covered: false },
    ],
  },
  {
    name: "Turkana",
    code: 23,
    constituencies: [
      { name: "Turkana North", covered: false },
      { name: "Turkana West", covered: false },
      { name: "Turkana Central", covered: false },
      { name: "Loima", covered: false },
      { name: "Turkana South", covered: true  },
      { name: "Turkana East", covered: false },
    ],
  },
  {
    name: "West Pokot",
    code: 24,
    constituencies: [
      { name: "Kapenguria", covered: true  },
      { name: "Sigor", covered: false },
      { name: "Kacheliba", covered: true  },
      { name: "Pokot South", covered: true  },
    ],
  },
  {
    name: "Samburu",
    code: 25,
    constituencies: [
      { name: "Samburu West", covered: false },
      { name: "Samburu North", covered: true  },
      { name: "Samburu East", covered: true  },
    ],
  },
  {
    name: "Trans-Nzoia",
    code: 26,
    constituencies: [
      { name: "Kwanza", covered: false },
      { name: "Endebess", covered: false },
      { name: "Saboti", covered: false },
      { name: "Kiminini", covered: false },
      { name: "Cherangany", covered: false },
    ],
  },
  {
    name: "Uasin Gishu",
    code: 27,
    constituencies: [
      { name: "Soy", covered: true  },
      { name: "Turbo", covered: false },
      { name: "Moiben", covered: false },
      { name: "Ainabkoi", covered: true  },
      { name: "Kapseret", covered: true  },
      { name: "Kesses", covered: true  },
    ],
  },
  {
    name: "Elgeyo-Marakwet",
    code: 28,
    constituencies: [
      { name: "Marakwet East", covered: false },
      { name: "Marakwet West", covered: false },
      { name: "Keiyo North", covered: false },
      { name: "Keiyo South", covered: false },
    ],
  },
  {
    name: "Nandi",
    code: 29,
    constituencies: [
      { name: "Tinderet", covered: false },
      { name: "Aldai", covered: true  },
      { name: "Nandi Hills", covered: true  },
      { name: "Chesumei", covered: true  },
      { name: "Emgwen", covered: true  },
      { name: "Mosop", covered: true  },
    ],
  },
  {
    name: "Baringo",
    code: 30,
    constituencies: [
      { name: "Tiaty", covered: false },
      { name: "Baringo North", covered: true  },
      { name: "Baringo Central", covered: false },
      { name: "Baringo South", covered: true  },
      { name: "Mogotio", covered: false },
      { name: "Eldama Ravine", covered: true  },
    ],
  },
  {
    name: "Laikipia",
    code: 31,
    constituencies: [
      { name: "Laikipia West", covered: false },
      { name: "Laikipia East", covered: false },
      { name: "Laikipia North", covered: false },
    ],
  },
  {
    name: "Nakuru",
    code: 32,
    constituencies: [
      { name: "Molo", covered: false },
      { name: "Njoro", covered: true  },
      { name: "Naivasha", covered: false },
      { name: "Gilgil", covered: false },
      { name: "Kuresoi South", covered: false },
      { name: "Kuresoi North", covered: true  },
      { name: "Subukia", covered: false },
      { name: "Rongai", covered: false },
      { name: "Bahati", covered: true  },
      { name: "Nakuru Town West", covered: true  },
      { name: "Nakuru Town East", covered: true  },
    ],
  },
  {
    name: "Narok",
    code: 33,
    constituencies: [
      { name: "Kilgoris", covered: false },
      { name: "Emurua Dikirr", covered: false },
      { name: "Narok North", covered: false },
      { name: "Narok East", covered: true  },
      { name: "Narok South", covered: false },
      { name: "Narok West", covered: false },
    ],
  },
  {
    name: "Kajiado",
    code: 34,
    constituencies: [
      { name: "Kajiado North", covered: false },
      { name: "Kajiado Central", covered: false },
      { name: "Kajiado East", covered: false },
      { name: "Kajiado West", covered: false },
      { name: "Kajiado South", covered: false },
    ],
  },
  {
    name: "Kericho",
    code: 35,
    constituencies: [
      { name: "Kipkelion East", covered: false },
      { name: "Kipkelion West", covered: false },
      { name: "Ainamoi", covered: false },
      { name: "Bureti", covered: false },
      { name: "Belgut", covered: false },
      { name: "Sigowet-Soin", covered: false },
    ],
  },
  {
    name: "Bomet",
    code: 36,
    constituencies: [
      { name: "Sotik", covered: false },
      { name: "Chepalungu", covered: false },
      { name: "Bomet East", covered: true  },
      { name: "Bomet Central", covered: false },
      { name: "Konoin", covered: true  },
    ],
  },
  {
    name: "Kakamega",
    code: 37,
    constituencies: [
      { name: "Lugari", covered: false },
      { name: "Likuyani", covered: false },
      { name: "Malava", covered: false },
      { name: "Lurambi", covered: false },
      { name: "Navakholo", covered: false },
      { name: "Mumias West", covered: false },
      { name: "Mumias East", covered: false },
      { name: "Matungu", covered: false },
      { name: "Butere", covered: false },
      { name: "Khwisero", covered: false },
      { name: "Shinyalu", covered: false },
      { name: "Ikolomani", covered: false },
    ],
  },
  {
    name: "Vihiga",
    code: 38,
    constituencies: [
      { name: "Vihiga", covered: false },
      { name: "Sabatia", covered: false },
      { name: "Hamisi", covered: false },
      { name: "Luanda", covered: false },
      { name: "Emuhaya", covered: false },
    ],
  },
  {
    name: "Bungoma",
    code: 39,
    constituencies: [
      { name: "Mount Elgon", covered: false },
      { name: "Sirisia", covered: false },
      { name: "Kabuchai", covered: false },
      { name: "Bumula", covered: false },
      { name: "Kanduyi", covered: true  },
      { name: "Webuye East", covered: false },
      { name: "Webuye West", covered: false },
      { name: "Kimilili", covered: false },
      { name: "Tongaren", covered: false },
    ],
  },
  {
    name: "Busia",
    code: 40,
    constituencies: [
      { name: "Teso North", covered: false },
      { name: "Teso South", covered: false },
      { name: "Nambale", covered: false },
      { name: "Matayos", covered: false },
      { name: "Butula", covered: false },
      { name: "Funyula", covered: false },
      { name: "Budalangi", covered: false },
    ],
  },
  {
    name: "Siaya",
    code: 41,
    constituencies: [
      { name: "Ugenya", covered: false },
      { name: "Ugunja", covered: false },
      { name: "Alego Usonga", covered: false },
      { name: "Gem", covered: false },
      { name: "Bondo", covered: false },
      { name: "Rarieda", covered: false },
    ],
  },
  {
    name: "Kisumu",
    code: 42,
    constituencies: [
      { name: "Kisumu East", covered: false },
      { name: "Kisumu West", covered: false },
      { name: "Kisumu Central", covered: false },
      { name: "Seme", covered: false },
      { name: "Nyando", covered: false },
      { name: "Muhoroni", covered: false },
      { name: "Nyakach", covered: false },
    ],
  },
  {
    name: "Homa Bay",
    code: 43,
    constituencies: [
      { name: "Kasipul", covered: true  },
      { name: "Kabondo Kasipul", covered: false },
      { name: "Karachuonyo", covered: true  },
      { name: "Rangwe", covered: false },
      { name: "Homa Bay Town", covered: false },
      { name: "Ndhiwa", covered: false },
      { name: "Suba North", covered: false },
      { name: "Suba South", covered: false },
    ],
  },
  {
    name: "Migori",
    code: 44,
    constituencies: [
      { name: "Rongo", covered: false },
      { name: "Awendo", covered: false },
      { name: "Suna East", covered: true  },
      { name: "Suna West", covered: true  },
      { name: "Uriri", covered: false },
      { name: "Nyatike", covered: false },
      { name: "Kuria West", covered: true  },
      { name: "Kuria East", covered: true  },
    ],
  },
  {
    name: "Kisii",
    code: 45,
    constituencies: [
      { name: "Bonchari", covered: false },
      { name: "South Mugirango", covered: false },
      { name: "Bomachoge Borabu", covered: false },
      { name: "Bobasi", covered: false },
      { name: "Bomachoge Chache", covered: false },
      { name: "Nyaribari Masaba", covered: false },
      { name: "Nyaribari Chache", covered: false },
      { name: "Kitutu Chache North", covered: true  },
      { name: "Kitutu Chache South", covered: false },
    ],
  },
  {
    name: "Nyamira",
    code: 46,
    constituencies: [
      { name: "Kitutu Masaba", covered: false },
      { name: "West Mugirango", covered: false },
      { name: "North Mugirango", covered: false },
      { name: "Borabu", covered: false },
    ],
  },
  {
    name: "Nairobi",
    code: 47,
    constituencies: [
      { name: "Westlands", covered: false },
      { name: "Dagoretti North", covered: false },
      { name: "Dagoretti South", covered: false },
      { name: "Lang'ata", covered: false },
      { name: "Kibra", covered: false },
      { name: "Roysambu", covered: false },
      { name: "Kasarani", covered: false },
      { name: "Ruaraka", covered: false },
      { name: "Embakasi South", covered: false },
      { name: "Embakasi North", covered: true  },
      { name: "Embakasi Central", covered: false },
      { name: "Embakasi East", covered: false },
      { name: "Embakasi West", covered: false },
      { name: "Makadara", covered: false },
      { name: "Kamukunji", covered: false },
      { name: "Starehe", covered: false },
      { name: "Mathare", covered: false },
    ],
  },
];

/** Flat list of every constituency, each tagged with its county. */
export const allConstituencies = counties.flatMap((c) =>
  c.constituencies.map((k) => ({ ...k, county: c.name }))
);

export const findCounty = (name) =>
  counties.find((c) => c.name.toLowerCase() === String(name).toLowerCase());

export const findConstituency = (name) =>
  allConstituencies.find(
    (k) => k.name.toLowerCase() === String(name).toLowerCase()
  );
