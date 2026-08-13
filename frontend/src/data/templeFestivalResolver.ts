export interface ResolveFestivalsParams {
  temple?: any;
  authenticFestivals?: string[];
}

const DEITY_CANONICAL_FESTIVALS: { keywords: string[]; festivals: string[] }[] = [
  {
    keywords: ['shiva', 'mahadev', 'jyotirlinga', 'bholenath', 'shankar', 'lingam', 'nataraja', 'kedarnath', 'somnath', 'mahakal', 'omkareshwar', 'trimbakeshwar', 'bhimashankar', 'baidyanath', 'nageshwar', 'rameshwar', 'grishneshwar', 'kashi', 'vishwanath', 'pashupatinath', 'neelkanth', 'amarnath'],
    festivals: ['Maha Shivratri', 'Shravan Somvar', 'Pradosh Vrat', 'Kartik Purnima']
  },
  {
    keywords: ['krishna', 'radha', 'iskcon', 'bankey bihari', 'dwarkadhish', 'guruvayur', 'nathdwara', 'shrinathji', 'mathura', 'vrindavan', 'govind'],
    festivals: ['Janmashtami', 'Radhashtami', 'Holi', 'Govardhan Puja / Annakut']
  },
  {
    keywords: ['jagannath', 'puri', 'balabhadra', 'subhadra'],
    festivals: ['Rath Yatra', 'Chandan Yatra', 'Snana Yatra', 'Bahuda Yatra']
  },
  {
    keywords: ['vitthal', 'vithoba', 'pandharpur', 'tukaram', 'dnyaneshwar'],
    festivals: ['Ashadhi Ekadashi', 'Kartik Ekadashi', 'Gokulashtami']
  },
  {
    keywords: ['ram', 'rama', 'ramachandra', 'ayodhya', 'sitamarhi', 'raghunath', 'bhadrachalam'],
    festivals: ['Ram Navami', 'Diwali', 'Hanuman Jayanti', 'Dussehra']
  },
  {
    keywords: ['vishnu', 'venkateswara', 'tirupati', 'balaji', 'padmanabhaswamy', 'ranganathaswamy', 'badrinath', 'narayana'],
    festivals: ['Vaikunta Ekadashi', 'Brahmotsavam', 'Diwali', 'Dhanteras']
  },
  {
    keywords: ['ganesha', 'ganesh', 'vinayaka', 'ashtavinayak', 'siddhivinayak', 'ganpati', 'morgaon', 'theur', 'lonavala'],
    festivals: ['Ganesh Chaturthi', 'Angaraki Chaturthi', 'Maghi Ganeshotsav', 'Anant Chaturdashi']
  },
  {
    keywords: ['durga', 'shakti', 'shaktipeeth', 'devi', 'mata', 'mahalakshmi', 'laxmi', 'kali', 'kalika', 'kamakhya', 'vaishno', 'ambaji', 'chamundeshwari', 'tarapith', 'hinglaj', 'meenakshi', 'kanaka durga', 'mumbai mahalaxmi', 'renuka', 'renuka devi', 'mahur'],
    festivals: ['Sharad Navratri', 'Chaitra Navratri', 'Durga Puja', 'Diwali / Lakshmi Puja']
  },
  {
    keywords: ['hanuman', 'bajrangbali', 'anjaneya', 'sankat mochan', 'jakhu', 'salasar', 'mehandipur'],
    festivals: ['Hanuman Jayanti', 'Ram Navami', 'Diwali']
  },
  {
    keywords: ['murugan', 'kartikeya', 'subramanya', 'subrahmanya', 'skanda', 'swamimalai', 'palani', 'tiruttani', 'tiruchendur'],
    festivals: ['Thaipusam', 'Skanda Sashti', 'Panguni Uthiram']
  },
  {
    keywords: ['sai', 'sai baba', 'shirdi'],
    festivals: ['Ram Navami', 'Guru Purnima', 'Vijayadashami']
  },
  {
    keywords: ['sikh', 'gurdwara', 'golden temple', 'harmandir', 'guru nanak', 'guru gobind'],
    festivals: ['Vaisakhi', 'Guru Nanak Gurpurab', 'Bandi Chhor Divas']
  },
  {
    keywords: ['jain', 'tirthankara', 'mahavir', 'shikharji', 'palitana', 'ranakpur', 'shravanabelagola'],
    festivals: ['Mahavir Jayanti', 'Paryushan Parv', 'Akshaya Tritiya']
  }
];

function extractFestivalName(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object' && item !== null) {
    const extracted = item.name || item.festival_name || item.title || item.festivalName || item.label;
    if (typeof extracted === 'string') return extracted.trim();
  }
  return '';
}

export function resolveTempleFestivals(params: ResolveFestivalsParams): string[] | undefined {
  const { temple, authenticFestivals } = params;

  // 1. Primary: Curated authentic details
  if (Array.isArray(authenticFestivals) && authenticFestivals.length > 0) {
    const resolved = authenticFestivals.map(extractFestivalName).filter(Boolean);
    if (resolved.length > 0) return resolved;
  }

  // 2. Secondary: Explicit festivals on temple object (API or database)
  const rawFestivals = temple?.festivals || temple?.major_festivals;
  if (Array.isArray(rawFestivals) && rawFestivals.length > 0) {
    const resolved = rawFestivals.map(extractFestivalName).filter(Boolean);
    if (resolved.length > 0) return resolved;
  }
  if (typeof rawFestivals === 'string' && rawFestivals.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawFestivals);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const resolved = parsed.map(extractFestivalName).filter(Boolean);
        if (resolved.length > 0) return resolved;
      }
    } catch {
      const splitFestivals = rawFestivals.split(',').map(s => s.trim()).filter(Boolean);
      if (splitFestivals.length > 0) return splitFestivals;
    }
  }

  // 3. Tertiary: Canonical Deity / Category / Name matching (in priority order: deity -> category -> name)
  const fieldsToMatch = [temple?.deity, temple?.category, temple?.name].filter(Boolean);

  for (const fieldStr of fieldsToMatch) {
    if (typeof fieldStr !== 'string' || !fieldStr.trim()) continue;
    for (const mapping of DEITY_CANONICAL_FESTIVALS) {
      const hasMatch = mapping.keywords.some(kw => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(fieldStr);
      });
      if (hasMatch) {
        return mapping.festivals;
      }
    }
  }

  // 4. Undefined if no match found
  return undefined;
}
