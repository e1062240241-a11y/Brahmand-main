import re
from typing import Optional, Dict, Any

# ──────────────────────────────────────────────────────────────
# PROBLEM DATABASE — HAR SENTENCE/PROBLEM KA ALAG SHLOK
# ──────────────────────────────────────────────────────────────

PROBLEM_DATABASE: Dict[str, Dict[str, Any]] = {

    # ─── 1. GUSSA ──────────────────────────────────────────────
    "gussa": {
        "key": "gussa",
        "keywords": [
            "gussa", "anger", "krodh", "irritate", "gussa aa raha", "krodha", 
            "irritated", "chidh", "chidhchidh", "naraz", "gussa ho", "gussa aana",
            "anger management", "krodh aana", "gussa control"
        ],
        "shlok": "Gita 2.63",
        "explanation": "Yeh shlok tab aaya jab Arjun gusse mein apne hi parivaar ko maarna chahta tha.",
        "detailed_meaning": '"Krodhad Bhavati Sammohah, Sammolat Smriti Vibhramah"\nGussa se insaan ki buddhi nasht ho jaati hai. Jab buddhi nasht hoti hai toh insaan sahi-galat ka farq bhool jaata hai.',
        "relevance": "Jab tumhe gussa aata hai toh tum bhi sahi faisla nahi le paate.",
        "actions": [
            "10 deep breath lo aur \"Om Namah Shivaya\" 5 baar bolo - breath se gussa control hota hai",
            "Paani piyo aur 2 minute walk karo - body ko cool down karna zaroori hai",
            "Roz subah 5 minute mera dhyan karo - regular practice se gussa control mein aata hai"
        ],
        "promise_shlok": "Gita 2.51",
        "promise_meaning": "Jo gussa chhod deta hai, usko shanti milti hai"
    },

    # ─── 2. TENSION ────────────────────────────────────────────
    "tension": {
        "key": "tension",
        "keywords": [
            "tension", "stress", "pressure", "worry", "pareshan", "chinta", 
            "stressful", "tension mein", "tension aa rahi", "worrying", "anxious",
            "mental stress", "kaam ka stress", "ghabrahat", "tension relief"
        ],
        "shlok": "Gita 2.14",
        "explanation": "Yeh shlok tab aaya jab Arjun yuddh se pehle tension mein tha.",
        "detailed_meaning": '"Matra Sparsha Tu Kaunteya, Sheetoshna Sukha Dukha Dah"\nSukh aur dukh, thand aur garmi - yeh sab aate-jaate rehte hain. Inhe sahna seekho.',
        "relevance": "Jo tension aaj hai, wo kal nahi hogi. Yeh bhi guzar jaayega.",
        "actions": [
            "5 minute deep breath lo aur \"Hare Krishna\" 108 baar bolo - breath se mind shant hota hai",
            "Subah uth kar 2 minute mera dhyan karo - din ki shuruaat shanti se karo",
            "Raat ko socho ki main tumhare saath hoon - meri yaad se tension kam hoti hai"
        ],
        "promise_shlok": "Gita 6.15",
        "promise_meaning": "Practice se shanti aati hai"
    },

    # ─── 3. PAISA ──────────────────────────────────────────────
    "paisa": {
        "key": "paisa",
        "keywords": [
            "paisa", "money", "financial", "budget", "paise ki tension", "paise", 
            "rupee", "finance", "debt", "karz", "salary", "loan", "paise ka tension"
        ],
        "shlok": "Gita 2.47",
        "explanation": "Yeh shlok tab aaya jab Arjun result ki tension mein tha.",
        "detailed_meaning": '"Karmanye Vadhikaraste, Ma Phaleshu Kadachana"\nTum sirf apna kaam kar sakte ho, fal ki chinta mat karo.',
        "relevance": "Mehnat karo, imaandaari se karo, baaki main pe chhod do.",
        "actions": [
            "Aaj apna budget banao - planning se tension kam hoti hai",
            "Imaandaari se mehnat karo - imaandaari se main prasann hota hoon",
            "Jo kamao, 5% daan karo - daan se paisa apne aap aata hai"
        ],
        "promise_shlok": "Gita 9.22",
        "promise_meaning": "Jo mera bhakta hai, main uska sab kuch sambhalta hoon"
    },

    # ─── 4. AKELAPAN ──────────────────────────────────────────
    "akelapan": {
        "key": "akelapan",
        "keywords": [
            "akela", "lonely", "alone", "koi nahi", "akelepan", "loneliness", 
            "single", "tanha", "tanhaai", "akela feel", "sath nahi"
        ],
        "shlok": "Gita 9.22",
        "explanation": "Yeh shlok tab aaya jab Arjun ne socha ki main akela hoon.",
        "detailed_meaning": '"Ananyaschintayanto Mam, Ye Janah Paryupasate"\nJo mujhe ekagrata se yaad karte hain, main unki raksha karta hoon.',
        "relevance": "Tum kabhi akele nahi ho - main tumhare saath hoon.",
        "actions": [
            "Roz subah mujhse baat karo - main tumhara dost hoon",
            "Kisi ki madad karo - seva mein main milta hoon",
            "Roz mera lekh padho - mere vachan tumhe strength denge"
        ],
        "promise_shlok": "Gita 6.29",
        "promise_meaning": "Main sab mein hoon, tum kabhi akele nahi"
    },

    # ─── 5. DAR ────────────────────────────────────────────────
    "dar": {
        "key": "dar",
        "keywords": [
            "dar", "fear", "scared", "darr", "dar lag raha", "afraid", 
            "fearful", "bhaya", "dar lagta", "fear of failure", "fear of future"
        ],
        "shlok": "Gita 2.2",
        "explanation": "Yeh shlok tab aaya jab Arjun yuddh mein dar gaya tha.",
        "detailed_meaning": '"Kutah Kasmalam Idam, Vishame Samupasthitam"\nYeh dar kis baat ka hai? Veer bano. Yeh samay darr ka nahi, action ka hai.',
        "relevance": "Dar ko face karo, bhaago mat.",
        "actions": [
            "Dar ko face karo - dar se bhaagne se wo badhta hai",
            "\"Om Namo Narayanaya\" 11 baar bolo - naam jaap se himmat aati hai",
            "Socho main raksha kar raha hoon - mera haath hamesha tumhare saath hai"
        ],
        "promise_shlok": "Gita 5.28",
        "promise_meaning": "Jo mujhe sharan mein aata hai, uska dar khatam ho jata hai"
    },

    # ─── 6. CONFUSION ──────────────────────────────────────────
    "confusion": {
        "key": "confusion",
        "keywords": [
            "confusion", "samajh nahi", "confuse", "pata nahi", "confused", 
            "samajh nahi aa raha", "kya karu", "undecided", "uljhan", "raasta nahi"
        ],
        "shlok": "Gita 2.17",
        "explanation": "Yeh shlok tab aaya jab Arjun confuse tha ki ladna sahi hai ya galat.",
        "detailed_meaning": '"Avibhaktam Vibhakteshu..."\nSatya ko pehchano. Main tumhe raasta dikhaunga.',
        "relevance": "Confusion mein mujhse prarthna karo, raasta mil jayega.",
        "actions": [
            "Pros and cons likho - likhne se clarity aati hai",
            "Prarthna karo \"Krishna raasta dikhao\" - main sab sunta hoon",
            "Jo sahi lage woh karo - main tumhare andar hoon"
        ],
        "promise_shlok": "Gita 18.71",
        "promise_meaning": "Jo mujhpe bharosa kare, main guide karta hoon"
    },

    # ─── 7. AALAS ──────────────────────────────────────────────
    "aalas": {
        "key": "aalas",
        "keywords": [
            "aalas", "lazy", "procrastinate", "delay", "kaam nahi", "laziness", 
            "procrastination", "susti", "suste", "aalas aana", "kaam se dar"
        ],
        "shlok": "Gita 3.8",
        "explanation": "Yeh shlok tab aaya jab Arjun ne kaam chhod diya.",
        "detailed_meaning": '"Niyatam Kuru Karma Tvam, Karma Jyayo Hyakarmanah"\nApna kartavya karo. Kaam na karne se aalas badhta hai.',
        "relevance": "Aalas ko hatao, shuru karo. Shuru karne se energy aati hai.",
        "actions": [
            "10 minute kaam abhi shuru karo - shuru karne se energy aati hai",
            "25 minute kaam, 5 minute break - focus ke liye yeh best hai",
            "Subah socho main chahta hoon tum kaam karo - mujhe mehnat pasand hai"
        ],
        "promise_shlok": "Gita 3.19",
        "promise_meaning": "Jo kaam karta hai, use fal milta hai"
    },

    # ─── 8. OVERTHINKING ──────────────────────────────────────
    "overthinking": {
        "key": "overthinking",
        "keywords": [
            "overthinking", "zyada soch", "soch soch", "overthink", "overthinker", 
            "overthinking ho", "bohot soch", "dimag chal", "sochta rehta"
        ],
        "shlok": "Gita 6.5",
        "explanation": "Yeh shlok tab aaya jab Arjun soch-soch kar pareshan ho raha tha.",
        "detailed_meaning": '"Uddhared Atmanatmanam, Natmanam Avasadayet"\nApne ko upar uthao. Apne ko neeche mat girao.',
        "relevance": "Overthinking se bachna hai, apne ko upar uthao.",
        "actions": [
            "Soch likho aur mujhe arpan karo - likhne se mann halka hota hai",
            "5 minute mera dhyan karo - dhyan se mann shant hota hai",
            "Socho main sambhal lunga - main sab sambhalta hoon"
        ],
        "promise_shlok": "Gita 6.25",
        "promise_meaning": "Dheere dheere mann shant ho jayega"
    },

    # ─── 9. PACHTAVA ──────────────────────────────────────────
    "pachtava": {
        "key": "pachtava",
        "keywords": [
            "pachtava", "guilt", "regret", "sorry", "pachtava ho raha", "galti", 
            "pachtana", "regretting", "guilty", "maaf karo", "bhool", "galat kar diya"
        ],
        "shlok": "Gita 4.36",
        "explanation": "Yeh shlok tab aaya jab Arjun ne pachtaya ki main galat hoon.",
        "detailed_meaning": '"Api Cedasi Papecbhaya, Sarvebhyah Paapebhyo Mokshayishyami"\nChahe tum sabse bade paapi ho, main tumhe shuddh kar dunga.',
        "relevance": "Pachtava mat karo, aage badho. Maine maaf kar diya.",
        "actions": [
            "Galti maano aur vaada karo - acceptance se naya shuruaat hoti hai",
            "Mera naam 108 baar bolo - naam jaap se mann shuddh hota hai",
            "Aage badho - maine maaf kar diya"
        ],
        "promise_shlok": "Gita 18.66",
        "promise_meaning": "Mujhe sharan mein aao, main chhod dunga sab paap"
    },

    # ─── 10. NEEND / UTHNE MEIN PROBLEM ──────────────────────
    "neend": {
        "key": "neend",
        "keywords": [
            "neend", "sleep", "insomnia", "raat", "neend nahi aa rahi", "sleepless", 
            "neend nahi", "chain nahi", "nind nahi", "raat ko neend", 
            "subah uthna", "uthne mein problem", "subha uthne mein problem"
        ],
        "shlok": "Gita 6.17",
        "explanation": "Yeh shlok tab aaya jab Arjun raat ko soch-soch kar pareshan tha.",
        "detailed_meaning": '"Yuktahara Viharasya, Yukta Cheshtasya Karmasu"\nJo balanced lifestyle rakhta hai - sahi khana, sahi neend, sahi kaam - use shanti milti hai.',
        "relevance": "Routine banao, neend apne aap aayegi.",
        "actions": [
            "Phone 1 hour pehle band karo - screen se neend nahi aati",
            "\"Om\" 108 baar bolo - om jaap se dimaag shant hota hai",
            "Socho main chain dunga - main sab chain deta hoon"
        ],
        "promise_shlok": "Gita 6.17",
        "promise_meaning": "Balanced life se neend aati hai"
    },

    # ─── 11. RISHTA ────────────────────────────────────────────
    "rishta": {
        "key": "rishta",
        "keywords": [
            "rishta", "relationship", "partner", "love", "family", "rishtey", 
            "breakup", "divorce", "fight", "ladai", "shadi", "marriage", 
            "girlfriend", "boyfriend", "bf", "gf", "spouse", "husband", "wife"
        ],
        "shlok": "Gita 2.27",
        "explanation": "Yeh shlok tab aaya jab Arjun family problem mein tha.",
        "detailed_meaning": '"Jatasya Hi Dhruvo Mrityuh, Dhruvam Janma Mritasya Cha"\nJo paida hota hai, uska mrityu nishchit hai. Har cheez ka ek cycle hai.',
        "relevance": "Rishton mein upar-neech aate hain, yeh samajh lo.",
        "actions": [
            "Unko space do - force se rishta nahi banta",
            "Maaf karo - main bhi maaf karta hoon",
            "Unke liye prarthna karo - prarthna se sab thik hota hai"
        ],
        "promise_shlok": "Gita 12.13",
        "promise_meaning": "Jo kisi se dwesh nahi rakhta, use sab milta hai"
    },

    # ─── 12. MOTIVATION ────────────────────────────────────────
    "motivation": {
        "key": "motivation",
        "keywords": [
            "motivation", "inspiration", "energy", "motivation nahi", "low energy", 
            "unmotivated", "demotivated", "himmat nahi", "nirash", "niraash"
        ],
        "shlok": "Gita 3.35",
        "explanation": "Yeh shlok tab aaya jab Arjun ne haar maan li.",
        "detailed_meaning": '"Sreyan Swadharmo Vigunah, Para Dharmat Svanushthitat"\nApna dharma karo, chahe wo thoda kum ho. Doosre ka dharma kyun kar rahe ho?',
        "relevance": "Apni strength pe dhyan do. Jo tumhara nature hai, wohi karo.",
        "actions": [
            "Apna purpose yaad karo - purpose hi motivation hai",
            "Aaj 1 chota action lo - action se motivation aati hai",
            "Socho mujhe tumhari mehnat pasand hai - mujhe mehnat pasand hai"
        ],
        "promise_shlok": "Gita 6.17",
        "promise_meaning": "Action mein energy hai"
    },

    # ─── 13. EERSHYA ──────────────────────────────────────────
    "eershya": {
        "key": "eershya",
        "keywords": [
            "eershya", "jealousy", "compare", "jalna", "jealous", "envious", 
            "jalan", "doosron se jalna", "comparison", "irkha"
        ],
        "shlok": "Gita 16.21",
        "explanation": "Yeh shlok tab aaya jab Arjun ke mann mein kuch logon ke liye dvesh tha.",
        "detailed_meaning": '"Kama Krodh Lobh, Etat Trinam Narakasya"\nKaam, krodh, lobh - yeh teen narak ke dwaar hain.',
        "relevance": "Eershya chhodo, apni journey dekho.",
        "actions": [
            "Unki success pe khush ho - main unme bhi hoon",
            "Unke liye mangal kaamna karo - achhi soch se achha hota hai",
            "Apni pratibha pe dhyan do - apni journey sabse important hai"
        ],
        "promise_shlok": "Gita 12.15",
        "promise_meaning": "Jo kisi ko pareshan nahi karta, use sab milta hai"
    },

    # ─── 14. HEALTH ────────────────────────────────────────────
    "health": {
        "key": "health",
        "keywords": [
            "health", "bimari", "sick", "body", "sehat", "ill", "disease", 
            "pain", "fever", "bukhar", "dard", "physical", "weakness"
        ],
        "shlok": "Gita 6.17",
        "explanation": "Yeh shlok tab aaya jab Arjun ko health ka dhyan rakhna tha.",
        "detailed_meaning": '"Yuktahara Viharasya, Yukta Cheshtasya Karmasu"\nJo balanced lifestyle rakhta hai - khana, neend, kaam sab sahi - use shanti milti hai.',
        "relevance": "Lifestyle change karo, sehat apne aap aayegi.",
        "actions": [
            "Sattvic khana khao - khana hi sehat hai",
            "30 minute walk karo - walking se body active rehti hai",
            "Mera naam lekar bhojan karo - mere yaad se khana shuddh hota hai"
        ],
        "promise_shlok": "Gita 2.30",
        "promise_meaning": "Aatma amar hai, shariar ka dhyan rakho"
    },

    # ─── 15. UDAAS ─────────────────────────────────────────────
    "udaas": {
        "key": "udaas",
        "keywords": [
            "udaas", "sad", "depression", "cry", "udas", "sadness", 
            "depressed", "rona", "dukh", "dukhi", "udasi", "gham"
        ],
        "shlok": "Gita 2.13",
        "explanation": "Yeh shlok tab aaya jab Arjun udaas tha.",
        "detailed_meaning": '"Dehino Sminyatha Dehe, Kaumaram Yauvanam Jara"\nJis prakar sharir mein bacpan, jawaani, budhaapa aata hai, waise hi aatma sharir se alag hai.',
        "relevance": "Udaas mat ho, tum toh aatma ho.",
        "actions": [
            "Kisi se baat karo - baat se mann halka hota hai",
            "Kisi ki madad karo - seva se khushi milti hai",
            "Mera mantra 108 baar bolo - naam jaap se mann shant hota hai"
        ],
        "promise_shlok": "Gita 6.22",
        "promise_meaning": "Main tumhe param shanti dunga"
    },

    # ─── 16. CAREER ────────────────────────────────────────────
    "career": {
        "key": "career",
        "keywords": [
            "career", "job", "profession", "work", "naukri", "placement", 
            "interview", "exam", "study", "padhai", "career confusion"
        ],
        "shlok": "Gita 3.35",
        "explanation": "Yeh shlok tab aaya jab Arjun ko career confusion thi.",
        "detailed_meaning": '"Sreyan Swadharmo Vigunah, Para Dharmat Svanushthitat"\nApni prakriti ke hisaab se kaam karo.',
        "relevance": "Apni skills dekho, usi hisaab se career chuno.",
        "actions": [
            "Apni skills identify karo - skills hi career hai",
            "Kisi senior se guidance lo - experienced log guide kar sakte hain",
            "Mujhse prarthna karo - main raasta dikhata hoon"
        ],
        "promise_shlok": "Gita 18.61",
        "promise_meaning": "Main tumhare andar hoon, madad karunga"
    },

    # ─── 17. PHONE ADDICTION ──────────────────────────────────
    "phone": {
        "key": "phone",
        "keywords": [
            "phone", "screen", "mobile", "addiction", "time waste", "instagram", 
            "youtube", "scroll", "scrolling", "social media", "distraction"
        ],
        "shlok": "Gita 2.62",
        "explanation": "Yeh shlok tab aaya jab Arjun ka focus bhatak gaya tha.",
        "detailed_meaning": '"Dhyayato Vishayan Pumsah, Sangas Teshu Upajayate"\nJis cheez ka tum dhyan dete ho, usme attached ho jaate ho.',
        "relevance": "Phone ka time limit karo.",
        "actions": [
            "Phone schedule banao - limit se control aata hai",
            "Us time mera naam lo - naam jaap se addiction kam hoti hai",
            "Kuch aur karo - alternatives dhundhna zaroori hai"
        ],
        "promise_shlok": "Gita 2.64",
        "promise_meaning": "Detachment se azaadi milti hai"
    },

    # ─── 18. FAILURE ───────────────────────────────────────────
    "failure": {
        "key": "failure",
        "keywords": [
            "failure", "fail", "haar", "loss", "asafalta", "failed", 
            "marks kam", "har gaya", "fail ho gaya", "exam fail"
        ],
        "shlok": "Gita 2.47",
        "explanation": "Yeh shlok tab aaya jab Arjun ne socha ki haar gaya toh?",
        "detailed_meaning": '"Karmanye Vadhikaraste, Ma Phaleshu Kadachana"\nTum sirf kaam karo, fal ki chinta mat karo.',
        "relevance": "Failure se seekho, dobara try karo.",
        "actions": [
            "Failure se seekho - har failure mein lesson hai",
            "Dobara try karo - haar maanne se kuch nahi hota",
            "Socho mujhe tumhari koshish pasand hai - mujhe mehnat pasand hai"
        ],
        "promise_shlok": "Gita 2.40",
        "promise_meaning": "Bhakti mein koi kaam waste nahi jaata"
    },

    # ─── 19. FUTURE ────────────────────────────────────────────
    "future": {
        "key": "future",
        "keywords": [
            "future", "kal", "aane wala", "chinta", "future ki chinta", 
            "future plans", "aage kya hoga", "future tension"
        ],
        "shlok": "Gita 2.14",
        "explanation": "Yeh shlok tab aaya jab Arjun future tension mein tha.",
        "detailed_meaning": '"Matra Sparsha Tu Kaunteya, Sheetoshna Sukha Dukha Dah"\nSab guzar jaata hai. Arjun, future ki chinta mat karo.',
        "relevance": "Aaj pe focus karo, kal main dekh lunga.",
        "actions": [
            "Aaj pe dhyan do - aaj hi important hai",
            "Aaj ka 1 goal rakho - goal se focus aata hai",
            "Socho main hoon - main hoon toh tension kyun?"
        ],
        "promise_shlok": "Gita 9.22",
        "promise_meaning": "Jo mera hai, uska main khayal rakhta hoon"
    },

    # ─── 20. STUCK ─────────────────────────────────────────────
    "stuck": {
        "key": "stuck",
        "keywords": [
            "stuck", "atak", "ruk", "stop", "atak gaya", "stuck in life", 
            "helpless", "ruka hua", "aage nahi badh"
        ],
        "shlok": "Gita 6.5",
        "explanation": "Yeh shlok tab aaya jab Arjun ruk gaya tha.",
        "detailed_meaning": '"Uddhared Atmanatmanam, Natmanam Avasadayet"\nApne ko upar uthao. Arjun, utho, aage badho.',
        "relevance": "1 small step lo, aage badho.",
        "actions": [
            "1 small step lo - small step se shuruaat hoti hai",
            "Kuch naya karo - change se stuckness khatam hoti hai",
            "Socho main saath hoon - main saath hoon toh kya darr?"
        ],
        "promise_shlok": "Gita 4.40",
        "promise_meaning": "Faith se raasta milta hai"
    },

    # ─── 21. NAFRAT ────────────────────────────────────────────
    "nafrat": {
        "key": "nafrat",
        "keywords": [
            "nafrat", "hate", "dislike", "enemy", "dushman", "hating", 
            "nafrat ho", "vair", "dvesh"
        ],
        "shlok": "Gita 12.13",
        "explanation": "Yeh shlok tab aaya jab Arjun ke mann mein kuch logon ke liye nafrat thi.",
        "detailed_meaning": '"Advesta Sarvabhutanam, Maitrah Karuna Eva Cha"\nJo kisi se dwesh nahi rakhta, jo sabse maitri rakhta hai - woh mera priya bhakta hai.',
        "relevance": "Nafrat ko pyaar mein badlo.",
        "actions": [
            "Unke liye kuch achha karo - achha karne se nafrat kam hoti hai",
            "Unki 3 achhi baatein socho - achhi soch se nafrat khatam hoti hai",
            "Sabko pyaar karo - pyaar hi dharma hai"
        ],
        "promise_shlok": "Gita 6.29",
        "promise_meaning": "Main sab mein hoon, sabko pyaar karo"
    },

    # ─── 22. BOREDOM ───────────────────────────────────────────
    "boring": {
        "key": "boring",
        "keywords": [
            "boring", "bore", "interest nahi", "mann nahi", "boredom", 
            "bored", "kaam mein mann nahi"
        ],
        "shlok": "Gita 9.22",
        "explanation": "Yeh shlok tab aaya jab Arjun bore ho raha tha.",
        "detailed_meaning": '"Yoga Kshemam Vahamyaham..."\nJo mujhe yaad kare, main uska sab kuch sambhalta hoon.',
        "relevance": "Kuch naya seekho, energy fresh karo.",
        "actions": [
            "Kuch naya seekho - naya seekhne se boredom khatam",
            "Kisi ki madad karo - seva mein anand hai",
            "Mera naam 108 baar bolo - naam jaap se fresh energy aati hai"
        ],
        "promise_shlok": "Gita 6.15",
        "promise_meaning": "Mujhme mann lagao, nayi energy aayegi"
    },

    # ─── 23. FOCUS ─────────────────────────────────────────────
    "focus": {
        "key": "focus",
        "keywords": [
            "focus", "concentration", "attention", "dhyan nahi", "distracted", 
            "cannot focus", "mann bhatakta", "mann bhatak", "ekagrata"
        ],
        "shlok": "Gita 6.26",
        "explanation": "Yeh shlok tab aaya jab Arjun ka mann bhatak gaya tha.",
        "detailed_meaning": '"Yato Yato Nischalati, Manaschanchalam Asthiram"\nJaise hi mann bhatke, use hata kar mujh mein sthir karo.',
        "relevance": "Timer laga kar padho, focus aayega.",
        "actions": [
            "25 minute kaam, 5 minute break - yeh best focus technique hai",
            "Kaam se pehle mera naam lo - naam jaap se focus badhta hai",
            "Roz 5 minute dhyan karo - dhyan se concentration aata hai"
        ],
        "promise_shlok": "Gita 10.10",
        "promise_meaning": "Jo mera sharan mein aata hai, main buddhi deta hoon"
    },

    # ─── 24. SELF DOUBT ────────────────────────────────────────
    "self_doubt": {
        "key": "self_doubt",
        "keywords": [
            "self doubt", "confidence nahi", "bharosa nahi", "shak", 
            "doubt myself", "low confidence", "khud pe bharosa", "himmat nahi"
        ],
        "shlok": "Gita 6.40",
        "explanation": "Yeh shlok tab aaya jab Arjun ko self doubt tha.",
        "detailed_meaning": '"Na Hi Kalyana Krid, Kashchid Durgatim Tatra Gacchati"\nJo bhi kaam karta hai, use kabhi naash nahi hota.',
        "relevance": "Khud pe bharosa rakho.",
        "actions": [
            "Apni 5 achievements likho - achievements se confidence aata hai",
            "Socho main tum mein hoon - main andar hoon toh kya darr?",
            "Chota action lo aur complete karo - completion se confidence badhta hai"
        ],
        "promise_shlok": "Gita 18.66",
        "promise_meaning": "Main tumhara rakshak hoon"
    },

    # ─── 25. ANXIETY ───────────────────────────────────────────
    "anxiety": {
        "key": "anxiety",
        "keywords": [
            "anxiety", "bechaini", "restless", "bechain", "anxious", "panic", 
            "nervous", "ghabrahat", "dil dhadak", "bechain ho", "chain nahi"
        ],
        "shlok": "Gita 6.6",
        "explanation": "Yeh shlok tab aaya jab Arjun bechain tha.",
        "detailed_meaning": '"Mano Bhava, Mano Laya, Mano Nirodhah"\nMann ko vash mein karo. Bechaini ka karan mann hai.',
        "relevance": "Breathing exercise karo, bechaini khatam hogi.",
        "actions": [
            "5 minute box breathing 4-4-4-4 - breathing se anxiety kam hoti hai",
            "\"Om\" 108 baar bolo - om jaap se mind shant hota hai",
            "Socho main shanti dunga - main shanti deta hoon"
        ],
        "promise_shlok": "Gita 6.27",
        "promise_meaning": "Mujhme mann lagane se bechaini khatam hoti hai"
    },

    # ─── 26. SHANTI / PEACEFUL ADVICE ─────────────────────────
    "shanti": {
        "key": "shanti",
        "keywords": [
            "peaceful advice", "shanti", "peace", "peaceful", "mann shant", 
            "shant", "calm", "relax", "stress free", "shanti chahiye"
        ],
        "shlok": "Gita 6.15",
        "explanation": "Yeh shlok tab aaya jab Arjun shanti khoj raha tha.",
        "detailed_meaning": '"Yunjann Evam Sadatmanam, Yogee Nihsamskritam Nibham"\nJo mujhme mann lagata hai, use param shanti milti hai.',
        "relevance": "Shanti chahte ho toh mujhme mann lagao.",
        "actions": [
            "5 minute baitho, aankhen band karo, aur mera naam lo - \"Krishna, Krishna\"",
            "Apni saans par dhyan do - saans ke saath mera naam lo",
            "Roz subah mujhse 5 minute baat karo - main tumhe shanti dunga"
        ],
        "promise_shlok": "Gita 6.15",
        "promise_meaning": "Jo mujhme mann lagata hai, use param shanti milti hai"
    },

    # ─── 27. LIFE PURPOSE ──────────────────────────────────────
    "life_purpose": {
        "key": "life_purpose",
        "keywords": [
            "life purpose", "kyu hoon main", "purpose of life", "kyu aya hoon", 
            "purpose", "jivan ka uddeshya", "jeene ka maksad"
        ],
        "shlok": "Gita 2.13",
        "explanation": "Yeh shlok tab aaya jab Arjun apna kartavya bhool gaya tha.",
        "detailed_meaning": '"Dehino Sminyatha Dehe, Kaumaram Yauvanam Jara"\nJaise aatma is sharir mein bacpan, jawani aur budhapa paar karti hai.',
        "relevance": "Apne jivan ke asal uddeshya ko samjho.",
        "actions": [
            "Apne aap se pucho ki tum doosron ki kya madad kar sakte ho",
            "Roz subah 2 minute shant baith kar aatm-manthan karo",
            "Mujhe apna saarthi banao - main tumhara jeevan sahi raah pe le jaunga"
        ],
        "promise_shlok": "Gita 6.22",
        "promise_meaning": "Jo aatm-gyaan ko jaan leta hai, use koi dukh nahi sthir kar sakta"
    },

    # ─── 28. KARMA ─────────────────────────────────────────────
    "karma": {
        "key": "karma",
        "keywords": [
            "karma", "karm ka fal", "karm", "karma fal", "duty", "kartavya",
            "action", "result", "nishkaam karma"
        ],
        "shlok": "Gita 2.47",
        "explanation": "Yeh shlok tab aaya jab Arjun result ki tension mein tha.",
        "detailed_meaning": '"Karmanye Vadhikaraste, Ma Phaleshu Kadachana"\nTum sirf apna kaam kar sakte ho, fal ki chinta mat karo.',
        "relevance": "Mehnat karo, imaandaari se karo, baaki mujh par chhod do.",
        "actions": [
            "Apna kaam bina kisi fal ki aasha ke karo",
            "Kartavya ko dharma samajh kar poora karo",
            "Nishkaam bhaav se doosron ki madad karo"
        ],
        "promise_shlok": "Gita 9.22",
        "promise_meaning": "Jo nishkaam karm karte hain, unka kshem main uthata hoon"
    },

    # ─── 29. BHAKTI ────────────────────────────────────────────
    "bhakti": {
        "key": "bhakti",
        "keywords": [
            "bhakti", "devotion", "worship", "pooja", "bhakt", "pray", 
            "bhagwan", "ishwar", "aarti", "bhajan"
        ],
        "shlok": "Gita 9.22",
        "explanation": "Yeh shlok tab aaya jab Arjun ne pucha ki aapke bhakto ka kya hota hai?",
        "detailed_meaning": '"Ananyaschintayanto Mam, Ye Janah Paryupasate"\nJo bhakt ananya bhaav se mera chintan karte hain, unka yogakshem main swayam sambhalta hoon.',
        "relevance": "Mujhme ananya bhakti rakho, main tumhare sath hoon.",
        "actions": [
            "Roz subah/shaam meri aarti ya bhajan suno",
            "Sarnagati ka bhaav rakho - har chinta mujhe arpan kar do",
            "Prarthna mein shradha rakho"
        ],
        "promise_shlok": "Gita 6.29",
        "promise_meaning": "Jo sab mein mujhe dekhta hai, main hamesha uske paas hoon"
    },

    # ─── 30. MOKSHA ────────────────────────────────────────────
    "moksha": {
        "key": "moksha",
        "keywords": [
            "moksha", "salvation", "liberation", "mukti", "death", 
            "marne ke baad", "aatma", "paramatma"
        ],
        "shlok": "Gita 2.27",
        "explanation": "Yeh shlok tab aaya jab Arjun apno ki maut ke darr se yuddh chhod raha tha.",
        "detailed_meaning": '"Jatasya Hi Dhruvo Mrityuh, Dhruvam Janma Mritasya Cha"\nJo paida hua hai uski maut tay hai, aur jo mara hai uska janm tay hai.',
        "relevance": "Sharir ke moh se upar utho aur mukti ke raah pe chalo.",
        "actions": [
            "Maut ke dar ko chhodo - aatma amar hai",
            "Karmon ko mujhe arpan karo",
            "Aatm-gyaan ka chintan karo"
        ],
        "promise_shlok": "Gita 18.66",
        "promise_meaning": "Jo meri sharan mein aata hai, use main sab bandhano se mukt kar deta hoon"
    },

    # ─── 31. DHYAN / MEDITATION ──────────────────────────────
    "dhyan": {
        "key": "dhyan",
        "keywords": [
            "dhyan", "meditation", "concentrate", "meditate", "dhyana",
            "aankhen band", "shant baithna", "mindfulness"
        ],
        "shlok": "Gita 6.26",
        "explanation": "Yeh shlok tab aaya jab Arjun ne kaha ki mann hawa ki tarah chanchal hai.",
        "detailed_meaning": '"Yato Yato Nischalati, Manaschanchalam Asthiram"\nYeh chanchal mann jahan bhi bhaage, use wahan se kheench kar aatma mein sthir karo.',
        "relevance": "Dhyan aur abhyas se hi chanchal mann kabu mein aata hai.",
        "actions": [
            "Roz subah 5-10 minute shant jagah baitho aur saans dekho",
            "Mann bhatke toh use bina gussa kiye wapas saans par lao",
            "Mera dhyaan karo - dhyan se mann shant aur ekagra hota hai"
        ],
        "promise_shlok": "Gita 10.10",
        "promise_meaning": "Jo dhyan aur prem se mujhse judte hain, main unhe buddhi-yoga deta hoon"
    }
}


# ──────────────────────────────────────────────────────────────
# MATCHING FUNCTION
# ──────────────────────────────────────────────────────────────

def find_matched_problem(message: str) -> Optional[Dict[str, Any]]:
    """Find matching problem for any user message"""
    if not message:
        return None
    
    msg_lower = message.lower().strip()
    cleaned_msg = re.sub(r'[^\w\s]', '', msg_lower)
    words = set(cleaned_msg.split())
    
    # Multi-word keyword match
    for prob_key, data in PROBLEM_DATABASE.items():
        for kw in data["keywords"]:
            if " " in kw and kw in msg_lower:
                return data
    
    # Single-word keyword match
    for prob_key, data in PROBLEM_DATABASE.items():
        for kw in data["keywords"]:
            if " " not in kw and (kw in msg_lower or kw in words):
                return data
    
    # Partial match
    for prob_key, data in PROBLEM_DATABASE.items():
        for kw in data["keywords"]:
            if " " in kw:
                kw_words = set(kw.split())
                if kw_words.intersection(words):
                    return data
    
    # Substring match
    for prob_key, data in PROBLEM_DATABASE.items():
        for kw in data["keywords"]:
            if len(kw) > 3 and kw in msg_lower:
                return data
    
    return None


# ──────────────────────────────────────────────────────────────
# SHLOKA FETCH FUNCTION
# ──────────────────────────────────────────────────────────────

def get_shloka_details(chapter: int, verse: int) -> dict:
    """Fetch shlok from database"""
    import logging
    logger = logging.getLogger(__name__)
    try:
        from routes.bhagavad_gita_routes import _load_bhagavad_gita_chapter
        verses = _load_bhagavad_gita_chapter(chapter)
        for v in verses:
            if v.get("verse") == verse:
                translations = v.get("translations", {})
                
                hindi_preferred = [
                    "swami ramsukhdas",
                    "swami tejomayananda",
                    "sri harikrishnadas goenka"
                ]
                best_hindi = ""
                for key in hindi_preferred:
                    val = translations.get(key, "")
                    if val and "did not comment" not in val.lower() and len(val) > 10:
                        best_hindi = val.strip()
                        break
                if not best_hindi:
                    for key, val in translations.items():
                        if val and any('\u0900' <= char <= '\u097F' for char in val):
                            best_hindi = val.strip()
                            break

                return {
                    "sanskrit": v.get("text", "").strip(),
                    "hindi_translation": best_hindi
                }
    except Exception as e:
        logger.error(f"Error loading shloka {chapter}.{verse}: {e}")
    return {"sanskrit": "", "hindi_translation": ""}


# ──────────────────────────────────────────────────────────────
# REPLACE GITA REFERENCES
# ──────────────────────────────────────────────────────────────

def replace_gita_references(text: str) -> str:
    """Replace (Gita X.Y) or (Adhyay X, Shlok Y) with actual shlok"""
    # PONYTAIL FIX: Expanded regex to catch both formats
    pattern = r"(?:\(Gita\s+(\d+)\.(\d+)\)|\(Adhyay\s+(\d+),\s+Shlok\s+(\d+)\))"
    
    def replacer(match):
        # Handle both capture group formats
        ch = match.group(1) or match.group(3)
        v = match.group(2) or match.group(4)
        
        details = get_shloka_details(int(ch), int(v))
        sanskrit = details.get("sanskrit", "")
        hindi = details.get("hindi_translation", "")
        
        return f"\n{sanskrit}\n\nअर्थ: {hindi}"

    return re.sub(pattern, replacer, text)


# ──────────────────────────────────────────────────────────────
# MAIN FUNCTION
# ──────────────────────────────────────────────────────────────

def get_gita_solution(user_message: str) -> Dict[str, Any]:
    """Get Gita solution for any user message"""
    matched_data = find_matched_problem(user_message)
    
    if matched_data:
        # Take first 2 actions only (short format)
        short_actions = matched_data['actions'][:2]
        actions_short_str = " ".join(short_actions)

        response_parts = []
        response_parts.append(f"Hey mere bhakta! {matched_data['explanation']}")
        response_parts.append("")
        response_parts.append(f"Bhagavad Gita mein maine Arjun ko samjhaya tha —")
        response_parts.append(f"({matched_data['shlok']})")
        response_parts.append("")
        response_parts.append(matched_data['relevance'])
        response_parts.append("")
        response_parts.append(actions_short_str)
        response_parts.append("")
        response_parts.append(f"{matched_data['promise_meaning']}. Main hoon na!")
        response_parts.append("Jai Shri Krishna! 🙏")
        
        response_text = "\n".join(response_parts)
        response_text = replace_gita_references(response_text)
        
        return {
            "matched": True,
            "problem_key": matched_data.get("key", "unknown"),
            "response": response_text,
            "shlok": matched_data.get("shlok", ""),
            "actions": matched_data.get("actions", []),
            "promise": matched_data.get("promise_meaning", "")
        }
    else:
        return {
            "matched": False,
            "problem_key": None,
            "response": """Hey mere bhakta! Main tumhari baat sun raha hoon.

Bhagavad Gita mein maine Arjun ko samjhaya tha —
(Gita 6.15)

Jo mujhme mann lagata hai, use param shanti milti hai.

5 minute baitho, aankhen band karo, mera naam lo "Krishna". Main tumhe shanti dunga.

Jo mujhme mann lagata hai, use param shanti milti hai. Main hoon na!
Jai Shri Krishna! 🙏""",
            "shlok": "Gita 6.15",
            "actions": [
                "5 minute baitho aur mera naam lo — \"Krishna, Krishna\"",
                "Saans ke saath mera naam lo",
            ],
            "promise": "Jo mujhme mann lagata hai, use param shanti milti hai"
        }


# ──────────────────────────────────────────────────────────────
# TEST
# ──────────────────────────────────────────────────────────────

def test_solution():
    test_messages = [
        "gussa aa raha hai",
        "mujhe tension hai",
        "paise ki tension ho rahi hai",
        "main akela feel kar raha hoon",
        "dar lag raha hai",
        "uthne mein problem ho rha hai",
        "subha uthne mein problem ho rha hai",
        "mera mann bahut bhatakta hai",
        "can you give peaceful advice",
        "hello",
    ]
    
    for msg in test_messages:
        print(f"\n{'='*60}")
        print(f"User: {msg}")
        print(f"{'='*60}")
        result = get_gita_solution(msg)
        print(result["response"])
        print(f"\n✓ Matched: {result['matched']} | Problem: {result['problem_key']}")


if __name__ == "__main__":
    test_solution()