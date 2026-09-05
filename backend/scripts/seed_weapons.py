# backend/scripts/seed_weapons.py
import asyncio
import sys
import os
from loguru import logger

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db.neo4j import neo4j_db

# 90+ Iconic Weapons from all major anime/manga series
ALL_WEAPONS = [
    # ==================== ONE PIECE - MEITO (GRADED BLADES) ====================
    {"name": "Yoru", "owner": "Dracule Mihawk", "anime": "One Piece", "type": "Supreme Grade Black Blade", "power": 980,
     "speed": 85, "hax": 70, "ability": "Extreme durability & cutting power; permanent black blade",
     "weakness": "Requires exceptional Haki/skill; size makes it cumbersome",
     "lore": "The strongest black blade in the world, wielded by the World's Greatest Swordsman."},
    {"name": "Ace", "owner": "Gol D. Roger", "anime": "One Piece", "type": "Supreme Grade Cutlass", "power": 970,
     "speed": 90, "hax": 75, "ability": "Legendary blade of the Pirate King",
     "weakness": "Whereabouts unknown post-Roger",
     "lore": "The sword that conquered the Grand Line, once wielded by Gol D. Roger himself."},
    {"name": "Murakumogiri", "owner": "Edward Newgate (Whitebeard)", "anime": "One Piece",
     "type": "Supreme Grade Naginata", "power": 990, "speed": 70, "hax": 80,
     "ability": "Massive reach & power; can split islands", "weakness": "Extreme size/weight",
     "lore": "The naginata of the Strongest Man in the World, capable of shaking the very seas."},
    {"name": "Shodai Kitetsu", "owner": "St. Ethanbaron V. Nusjuro", "anime": "One Piece",
     "type": "Supreme Grade Kitetsu", "power": 960, "speed": 88, "hax": 85,
     "ability": "Cursed lineage; thirsts for blood", "weakness": "Cursed nature affects wielder",
     "lore": "The first and most cursed of the Kitetsu blades, wielded by a World Noble."},
    {"name": "Yakuza Kasen", "owner": "Issho (Fujitora)", "anime": "One Piece", "type": "Supreme Grade", "power": 950,
     "speed": 80, "hax": 75, "ability": "Enhances gravitational abilities", "weakness": "Limited showings",
     "lore": "The blade of the Blind Admiral, one of the new Marine Admirals."},
    {"name": "Wado Ichimonji", "owner": "Roronoa Zoro", "anime": "One Piece", "type": "Great Grade", "power": 920,
     "speed": 92, "hax": 65, "ability": "Excellent balance; Kuina's legacy",
     "weakness": "Standard high-end blade limits",
     "lore": "The white blade that carries the promise between Zoro and Kuina."},
    {"name": "Enma", "owner": "Roronoa Zoro", "anime": "One Piece", "type": "Great Grade", "power": 940, "speed": 88,
     "hax": 78, "ability": "Forcibly draws out user's Haki; can create permanent Black Blade",
     "weakness": "Drains user's Haki/life force if not controlled",
     "lore": "One of the two blades that wounded Kaido, once wielded by Kozuki Oden."},
    {"name": "Ame no Habakiri", "owner": "Kozuki Momonosuke", "anime": "One Piece", "type": "Great Grade", "power": 900,
     "speed": 85, "hax": 72, "ability": "Dragon form mastery required for full power",
     "weakness": "Requires dragon form mastery", "lore": "The second blade of Oden, now passed to his son Momonosuke."},
    {"name": "Shusui", "owner": "Shimotsuki Ryuma → Zoro", "anime": "One Piece", "type": "Great Grade Black Blade",
     "power": 930, "speed": 90, "hax": 68, "ability": "Black blade of extraordinary hardness",
     "weakness": "Heavy; returned to Wano", "lore": "The national treasure of Wano, once wielded by the zombie Ryuma."},
    {"name": "Nidai Kitetsu", "owner": "Kozuki Sukiyaki", "anime": "One Piece", "type": "Great Grade Cursed",
     "power": 910, "speed": 87, "hax": 80, "ability": "Cursed blade with immense cutting power",
     "weakness": "Kitetsu curse", "lore": "The second generation Kitetsu, a blade of ill fortune."},
    {"name": "Sandai Kitetsu", "owner": "Roronoa Zoro", "anime": "One Piece", "type": "Grade Blade Cursed",
     "power": 850, "speed": 85, "hax": 75, "ability": "Attracts misfortune/death",
     "weakness": "Kitetsu curse (attracts misfortune/death)",
     "lore": "Zoro's first cursed blade, chosen through a test of luck."},
    {"name": "Yubashiri", "owner": "Roronoa Zoro (destroyed)", "anime": "One Piece", "type": "Skillful Grade",
     "power": 820, "speed": 88, "hax": 60, "ability": "Light & sharp; excellent for speed",
     "weakness": "Destroyed by rust/poison",
     "lore": "A gift from Ipponmatsu, destroyed at Enies Lobby but its spirit lives on."},
    {"name": "Kashu", "owner": "Tashigi", "anime": "One Piece", "type": "Skillful Grade", "power": 800, "speed": 82,
     "hax": 55, "ability": "Well-balanced Marine blade", "weakness": "Standard limitations",
     "lore": "One of Tashigi's collected blades, formerly owned by Mr. 11."},
    {"name": "Gryphon", "owner": "Shanks", "anime": "One Piece", "type": "Unknown Grade (High)", "power": 940,
     "speed": 90, "hax": 70, "ability": "Blade of one of the Four Emperors", "weakness": "Limited details",
     "lore": "The sword of Red-Haired Shanks, wielded by a Yonko."},

    # ==================== BLEACH - ZANPAKUTO ====================
    {"name": "Zangetsu / Tensa Zangetsu", "owner": "Ichigo Kurosaki", "anime": "Bleach", "type": "Zanpakuto",
     "power": 950, "speed": 95, "hax": 88, "ability": "Getsuga Tensho; true dual blades; Hollow/Quincy aspects",
     "weakness": "No sealed form initially; complex identity issues",
     "lore": "The manifestation of Ichigo's soul, combining Shinigami, Hollow, and Quincy powers."},
    {"name": "Senbonzakura", "owner": "Byakuya Kuchiki", "anime": "Bleach", "type": "Zanpakuto", "power": 920,
     "speed": 90, "hax": 85, "ability": "Scatters into thousands of petal blades",
     "weakness": "Requires precise control", "lore": "The noble blade of the Kuchiki clan head, beautiful yet deadly."},
    {"name": "Kyouka Suigetsu", "owner": "Sosuke Aizen", "anime": "Bleach", "type": "Zanpakuto", "power": 980,
     "speed": 60, "hax": 100, "ability": "Complete hypnosis; permanent illusion once released",
     "weakness": "User must show release once; ineffective if never seen",
     "lore": "The most deceptive Zanpakuto, controlling all five senses perfectly."},
    {"name": "Ryujin Jakka", "owner": "Genryusai Yamamoto", "anime": "Bleach", "type": "Zanpakuto", "power": 999,
     "speed": 70, "hax": 95, "ability": "Strongest fire-type; reduces all to ash; Bankai erases existence",
     "weakness": "Extremely high Reiatsu cost; can destroy Soul Society",
     "lore": "The oldest and most powerful Zanpakuto, capable of burning everything to nothing."},
    {"name": "Hyorinmaru", "owner": "Toshirō Hitsugaya", "anime": "Bleach", "type": "Zanpakuto", "power": 900,
     "speed": 85, "hax": 80, "ability": "Ice control; strongest ice Zanpakuto",
     "weakness": "Age/experience limits full power",
     "lore": "The strongest ice-type Zanpakuto, wielded by the young Captain Hitsugaya."},
    {"name": "Sode no Shirayuki", "owner": "Rukia Kuchiki", "anime": "Bleach", "type": "Zanpakuto", "power": 850,
     "speed": 88, "hax": 75, "ability": "Absolute zero ice dances", "weakness": "Limited range",
     "lore": "The most beautiful Zanpakuto in Soul Society, wielded by Rukia."},
    {"name": "Benihime", "owner": "Kisuke Urahara", "anime": "Bleach", "type": "Zanpakuto", "power": 880, "speed": 80,
     "hax": 90, "ability": "Crimson energy barriers, nets, blasts; Bankai restructures matter",
     "weakness": "Complex techniques",
     "lore": "The versatile blade of the former Captain and master inventor Urahara."},
    {"name": "Nozarashi", "owner": "Kenpachi Zaraki", "anime": "Bleach", "type": "Zanpakuto", "power": 960, "speed": 75,
     "hax": 70, "ability": "Massive cutting power; cuts space itself", "weakness": "User must unlock name",
     "lore": "The brutal blade of the 11th Division Captain, raw power incarnate."},
    {"name": "Katen Kyokotsu", "owner": "Shunsui Kyoraku", "anime": "Bleach", "type": "Zanpakuto", "power": 940,
     "speed": 82, "hax": 95, "ability": "Forces children's games rules on reality", "weakness": "Affects user too",
     "lore": "The playful yet deadly blade of the 1st Division Captain."},

    # ==================== DEMON SLAYER - NICHIRIN BLADES ====================
    {"name": "Black Nichirin Blade", "owner": "Tanjiro Kamado", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 880, "speed": 90, "hax": 75, "ability": "Sun Breathing; can turn crimson (legendary power boost)",
     "weakness": "Rarest color; must be forged from specific ore",
     "lore": "The black blade that mirrors Yoriichi's, capable of Sun Breathing techniques."},
    {"name": "Blue Nichirin Blade", "owner": "Giyu Tomioka", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 870, "speed": 92, "hax": 70, "ability": "Water Breathing; fluid and adaptive",
     "weakness": "Standard Nichirin limitations", "lore": "The blade of the Water Hashira, flowing like water itself."},
    {"name": "Red Nichirin Blade", "owner": "Kyojuro Rengoku", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 890, "speed": 88, "hax": 68, "ability": "Flame Breathing; aggressive offense",
     "weakness": "High stamina consumption", "lore": "The blazing blade of the Flame Hashira, burning with passion."},
    {"name": "Yellow Nichirin Blade", "owner": "Zenitsu Agatsuma", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 860, "speed": 99, "hax": 60, "ability": "Thunder Breathing; extreme speed",
     "weakness": "Only mastered one form", "lore": "The lightning-fast blade of the Thunder Hashira's successor."},
    {"name": "Green Nichirin Blade", "owner": "Sanemi Shinazugawa", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 875, "speed": 90, "hax": 72, "ability": "Wind Breathing; cyclonic slashes",
     "weakness": "Reckless fighting style", "lore": "The tempest blade of the Wind Hashira, cutting like a storm."},
    {"name": "White Nichirin Blade", "owner": "Muichiro Tokito", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 855, "speed": 95, "hax": 78, "ability": "Mist Breathing; illusionary speed",
     "weakness": "Limited visibility in mist",
     "lore": "The elusive blade of the Mist Hashira, as unpredictable as fog."},
    {"name": "Dark Pink Nichirin Blade", "owner": "Mitsuri Kanroji", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 840, "speed": 85, "hax": 65, "ability": "Love Breathing; extreme flexibility",
     "weakness": "Unconventional shape",
     "lore": "The whip-like blade of the Love Hashira, as flexible as her fighting style."},
    {"name": "Lavender Nichirin Blade", "owner": "Obanai Iguro", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 850, "speed": 88, "hax": 70, "ability": "Serpent Breathing; twisting strikes", "weakness": "Short range",
     "lore": "The serpentine blade of the Serpent Hashira, striking from unexpected angles."},
    {"name": "Amber Nichirin Blade", "owner": "Tengen Uzui", "anime": "Demon Slayer", "type": "Nichirin Sword",
     "power": 885, "speed": 82, "hax": 68, "ability": "Sound Breathing; heavy, flashy attacks",
     "weakness": "Dual cleavers require coordination",
     "lore": "The flashy blades of the Sound Hashira, as flamboyant as their wielder."},
    {"name": "Indigo-Gray Nichirin Blade", "owner": "Inosuke Hashibira", "anime": "Demon Slayer",
     "type": "Nichirin Sword", "power": 830, "speed": 90, "hax": 55, "ability": "Beast Breathing; self-created style",
     "weakness": "Jagged edges dull quickly", "lore": "The wild blades of the Beast Hashira, forged in the mountains."},
    {"name": "Lavender-Blue Nichirin Blade", "owner": "Shinobu Kocho", "anime": "Demon Slayer",
     "type": "Nichirin Sword", "power": 820, "speed": 95, "hax": 85, "ability": "Insect Breathing; poison-focused",
     "weakness": "Cannot behead demons; relies on poison",
     "lore": "The stinger blade of the Insect Hashira, delivering lethal poison."},
    {"name": "Gray Nichirin Blade", "owner": "Gyomei Himejima", "anime": "Demon Slayer", "type": "Nichirin Weapon",
     "power": 950, "speed": 70, "hax": 60, "ability": "Stone Breathing; axe and flail combination",
     "weakness": "Not a standard katana; extremely heavy",
     "lore": "The massive weapon of the Stone Hashira, the strongest Hashira."},

    # ==================== NARUTO - SEVEN NINJA SWORDS ====================
    {"name": "Samehada", "owner": "Kisame Hoshigaki", "anime": "Naruto", "type": "Living Sword", "power": 900,
     "speed": 75, "hax": 85, "ability": "Sentient; absorbs/eats chakra; grows; can fuse with user",
     "weakness": "Chooses preferred user; drains wielder somewhat",
     "lore": "One of the Seven Swords of the Mist, a living blade that devours chakra."},
    {"name": "Kubikiribocho", "owner": "Zabuza → Suigetsu", "anime": "Naruto", "type": "Executioner's Blade",
     "power": 850, "speed": 60, "hax": 50, "ability": "Regenerates from victims' blood iron; massive cutting power",
     "weakness": "Extreme weight", "lore": "The Executioner's Blade, regenerating with every life it takes."},
    {"name": "Hiramekarei", "owner": "Chojuro", "anime": "Naruto", "type": "Dual-Handled Sword", "power": 780,
     "speed": 80, "hax": 70, "ability": "Stores & shapes chakra into various forms", "weakness": "Chakra-dependent",
     "lore": "The twin-blade that releases stored chakra in explosive bursts."},
    {"name": "Kabutowari", "owner": "Jinin Akebino", "anime": "Naruto", "type": "Axe-Hammer", "power": 820, "speed": 65,
     "hax": 55, "ability": "Axe + hammer; crushes any defense", "weakness": "Slow attacks",
     "lore": "The explosive blade that can shatter any defense with its hammer strikes."},
    {"name": "Kiba", "owner": "Ameyuri Ringo", "anime": "Naruto", "type": "Twin Lightning Swords", "power": 870,
     "speed": 95, "hax": 75, "ability": "Twin lightning-imbued swords; sharpest of the seven",
     "weakness": "Requires lightning chakra nature",
     "lore": "The twin blades that cut through anything with lightning speed."},
    {"name": "Nuibari", "owner": "Kushimaru Kuriarare", "anime": "Naruto", "type": "Needle Sword", "power": 750,
     "speed": 85, "hax": 80, "ability": "Needle + wire; stitches enemies together", "weakness": "Limited cutting power",
     "lore": "The needle that pierces and binds, sewing enemies to their fate."},
    {"name": "Shibuki", "owner": "Jinpachi Munashi", "anime": "Naruto", "type": "Explosive Sword", "power": 800,
     "speed": 70, "hax": 65, "ability": "Explosive tags integrated; area damage", "weakness": "Self-damaging potential",
     "lore": "The explosive blade that detonates on impact, creating chaos."},

    # ==================== AKAME GA KILL! - TEIGU ====================
    {"name": "Murasame", "owner": "Akame", "anime": "Akame ga Kill!", "type": "Teigu Sword", "power": 970, "speed": 90,
     "hax": 95, "ability": "One-cut kill poison; spreads & stops heart",
     "weakness": "Ineffective on non-organic/Teigu armor; Trump Card is double-edged",
     "lore": "The Demon Sword that brings certain death with a single scratch."},
    {"name": "Incursio", "owner": "Bulat → Tatsumi", "anime": "Akame ga Kill!", "type": "Teigu Armor", "power": 900,
     "speed": 85, "hax": 70, "ability": "Evolving armor; invisibility, strength",
     "weakness": "Can go berserk; evolves with user",
     "lore": "The armor forged from a Tyrant Danger Beast, evolving with its wielder."},
    {"name": "Demon's Extract", "owner": "Esdeath", "anime": "Akame ga Kill!", "type": "Teigu Ice Sword", "power": 950,
     "speed": 80, "hax": 90, "ability": "Ice manipulation to absolute zero; Mahapadma freezes time",
     "weakness": "Extreme stamina cost; once-per-day limits",
     "lore": "The ice sword of the strongest Teigu user, capable of freezing time itself."},
    {"name": "Pumpkin", "owner": "Mine", "anime": "Akame ga Kill!", "type": "Teigu Rifle", "power": 850, "speed": 75,
     "hax": 60, "ability": "Energy blasts scale with danger/emotion", "weakness": "Overheats/explodes if overused",
     "lore": "The explosive rifle that grows stronger with the user's emotions."},
    {"name": "Yatsufusa", "owner": "Kurome", "anime": "Akame ga Kill!", "type": "Teigu Puppet", "power": 880,
     "speed": 70, "hax": 85, "ability": "Controls up to 8 corpses; retains skills",
     "weakness": "User weakens with more puppets",
     "lore": "The cursed sword that binds the souls of the fallen to serve."},
    {"name": "Extase", "owner": "Sheele", "anime": "Akame ga Kill!", "type": "Teigu Scissors", "power": 820,
     "speed": 85, "hax": 55, "ability": "Giant scissors that cut almost anything", "weakness": "Close range only",
     "lore": "The massive scissors that can cut through any material."},
    {"name": "Cross Tail", "owner": "Lubbock", "anime": "Akame ga Kill!", "type": "Teigu Wires", "power": 780,
     "speed": 90, "hax": 75, "ability": "Infinite versatile wires; trap and bind",
     "weakness": "Can be cut by strong Teigu", "lore": "The infinite wires that trap and manipulate the battlefield."},

    # ==================== JUJUTSU KAISEN - CURSED TOOLS ====================
    {"name": "Inverted Spear of Heaven", "owner": "Toji Fushiguro", "anime": "Jujutsu Kaisen",
     "type": "Special Grade Cursed Tool", "power": 950, "speed": 85, "hax": 100,
     "ability": "Completely nullifies Cursed Techniques on contact",
     "weakness": "Rare Special Grade; limited availability",
     "lore": "The only weapon that can bypass Gojo's Infinity, nullifying all techniques."},
    {"name": "Playful Cloud", "owner": "Toji, Maki, Todo", "anime": "Jujutsu Kaisen",
     "type": "Special Grade Cursed Tool", "power": 880, "speed": 90, "hax": 40,
     "ability": "Amplifies pure physical strength; no CE needed", "weakness": "Relies entirely on user's body",
     "lore": "The three-section staff that amplifies physical prowess to supernatural levels."},
    {"name": "Split Soul Katana", "owner": "Toji / Maki", "anime": "Jujutsu Kaisen",
     "type": "Special Grade Cursed Tool", "power": 900, "speed": 88, "hax": 95,
     "ability": "Cuts soul/intangible boundaries; blocks RCT healing", "weakness": "Must perceive soul separation",
     "lore": "The blade that cuts the soul itself, preventing any form of healing."},
    {"name": "Black Rope", "owner": "Miguel", "anime": "Jujutsu Kaisen", "type": "Grade 1 Cursed Tool", "power": 820,
     "speed": 75, "hax": 85, "ability": "Disrupts/cancels Cursed Techniques", "weakness": "Degrades with use",
     "lore": "The rope that can cancel out cursed energy, even from Special Grades."},
    {"name": "Dragon-Bone", "owner": "Maki Zenin", "anime": "Jujutsu Kaisen", "type": "Grade 1 Cursed Tool",
     "power": 850, "speed": 85, "hax": 50, "ability": "Stores & releases Cursed Energy",
     "weakness": "Limited storage capacity",
     "lore": "The weapon crafted by Juzo, storing cursed energy for devastating releases."},
    {"name": "Chain of a Thousand Miles", "owner": "Toji Fushiguro", "anime": "Jujutsu Kaisen", "type": "Cursed Tool",
     "power": 750, "speed": 80, "hax": 70, "ability": "Extends indefinitely; utility over damage",
     "weakness": "End must be hidden for full effect",
     "lore": "The infinite chain that can reach anywhere, a tool of precision and reach."},

    # ==================== KAGURABACHI - ENCHANTED BLADES (YOTO) ====================
    {"name": "Enten", "owner": "Chihiro Rokuhira", "anime": "Kagurabachi", "type": "Enchanted Blade", "power": 960,
     "speed": 92, "hax": 90, "ability": "Kuro (flying slash), Aka (absorb/redirect), Nishiki (physical boost)",
     "weakness": "Built to counter/destroy other blades",
     "lore": "The first enchanted blade, forged to destroy all other Yoto."},
    {"name": "Cloud Gouger (Kuregumo)", "owner": "Sojo", "anime": "Kagurabachi", "type": "Enchanted Blade",
     "power": 900, "speed": 88, "hax": 80, "ability": "Lightning, storms, winds", "weakness": "Can be broken by Enten",
     "lore": "The storm blade that commands lightning and wind."},
    {"name": "Magatsumi", "owner": "Various (strongest)", "anime": "Kagurabachi", "type": "Enchanted Blade",
     "power": 920, "speed": 85, "hax": 85, "ability": "Multiple abilities; spider web restraint, blasts",
     "weakness": "Highest quality but varied", "lore": "The highest quality enchanted blades with diverse powers."},
    {"name": "Kumeyuri", "owner": "Hiruhiko / Uruha", "anime": "Kagurabachi", "type": "Enchanted Blade", "power": 850,
     "speed": 80, "hax": 88, "ability": "Illusions, object manipulation", "weakness": "Requires spiritual energy",
     "lore": "The blade that bends reality through illusions and manipulation."},
    {"name": "Tobimune", "owner": "Samura", "anime": "Kagurabachi", "type": "Enchanted Blade", "power": 880,
     "speed": 95, "hax": 82, "ability": "Teleportation/spatial; wings: Crow, Owl, Suzaku",
     "weakness": "Spatial manipulation has limits",
     "lore": "The blade that transcends space itself with its winged forms."},

    # ==================== SOUL EATER - DEMON WEAPONS ====================
    {"name": "Soul Eater (Scythe Form)", "owner": "Soul Evans", "anime": "Soul Eater", "type": "Demon Weapon",
     "power": 850, "speed": 85, "hax": 70, "ability": "Wavelength control, resonance, piano-enhanced",
     "weakness": "Requires Meister synchronization", "lore": "The scythe weapon that resonates with his Meister Maka."},
    {"name": "Spirit Scythe", "owner": "Spirit Albarn", "anime": "Soul Eater", "type": "Demon Weapon", "power": 920,
     "speed": 88, "hax": 75, "ability": "Unparalleled power; strongest Death Scythe",
     "weakness": "Personality conflicts", "lore": "The most powerful Death Scythe, wielded by Death himself."},
    {"name": "Liz & Patty (Twin Guns)", "owner": "Liz & Patty Thompson", "anime": "Soul Eater", "type": "Demon Weapon",
     "power": 800, "speed": 90, "hax": 65, "ability": "Independent or dual; wavelength bullets",
     "weakness": "Requires synchronization", "lore": "The twin gun sisters who can fight independently or together."},
    {"name": "Tsubaki (Multi-Form)", "owner": "Tsubaki Nakatsukasa", "anime": "Soul Eater", "type": "Demon Weapon",
     "power": 870, "speed": 85, "hax": 80, "ability": "Shadow Weapon modes + Uncanny Sword",
     "weakness": "Multiple forms require mastery",
     "lore": "The versatile ninja weapon who can transform into multiple forms."},
    {"name": "Excalibur", "owner": "Excalibur", "anime": "Soul Eater", "type": "Demon Weapon (Legendary)", "power": 999,
     "speed": 70, "hax": 95, "ability": "Extreme power + annoying personality",
     "weakness": "Only compatible with perfect Meister",
     "lore": "The legendary sword that only one perfect Meister can wield."},

    # ==================== OTHER ICONIC WEAPONS ====================
    {"name": "Dragon Slayer", "owner": "Guts", "anime": "Berserk", "type": "Massive Iron Slab", "power": 980,
     "speed": 60, "hax": 70, "ability": "Absorbs Apostle essence; harms astral beings",
     "weakness": "Extreme weight; only Guts-level strength",
     "lore": "The massive sword that slays dragons and demons, too heavy for normal humans."},
    {"name": "Power Pole / Nyoibo", "owner": "Son Goku", "anime": "Dragon Ball", "type": "Mythological Staff",
     "power": 850, "speed": 85, "hax": 75, "ability": "Extends infinitely; mythological roots",
     "weakness": "Later less used",
     "lore": "The legendary staff from Journey to the West, connecting Earth to Heaven."},
    {"name": "Tessaiga", "owner": "Inuyasha", "anime": "Inuyasha", "type": "Demon Sword", "power": 900, "speed": 88,
     "hax": 80, "ability": "Wind Scar (100 demons in one strike); absorbs techniques",
     "weakness": "Full yokai can't wield; human nights disable",
     "lore": "The fang of Inuyasha's father, protecting humans by killing demons."},
    {"name": "Sakabato", "owner": "Himura Kenshin", "anime": "Rurouni Kenshin", "type": "Reverse-Blade Sword",
     "power": 820, "speed": 92, "hax": 60, "ability": "Reverse blade; non-lethal by design",
     "weakness": "Cannot kill; limited offensive power",
     "lore": "The reverse-blade sword of the Battosai, a vow never to kill again."},
    {"name": "Scissor Blade", "owner": "Ryuko Matoi", "anime": "Kill la Kill", "type": "Scissor Sword", "power": 880,
     "speed": 90, "hax": 85, "ability": "Anti-Life Fiber; cuts through anything",
     "weakness": "Only half of the full scissors",
     "lore": "The blade that can cut Life Fibers, the only weapon against Ragyo."},
    {"name": "Chainsaw Devil Arm", "owner": "Denji / Asa", "anime": "Chainsaw Man", "type": "Devil Weapon",
     "power": 900, "speed": 85, "hax": 88, "ability": "Object/people turned into weapons; scales with guilt",
     "weakness": "Emotional attachment required",
     "lore": "The devil arms that transform objects and people based on emotional bonds."},

    # ==================== ADDITIONAL NARUTO WEAPONS ====================
    {"name": "Kusanagi", "owner": "Orochimaru", "anime": "Naruto", "type": "Legendary Sword", "power": 880, "speed": 90,
     "hax": 85, "ability": "Infinite length; stored in throat", "weakness": "Requires immense chakra",
     "lore": "One of the three Imperial Sacred Treasures, wielded by Orochimaru."},
    {"name": "Totsuka Blade", "owner": "Itachi Uchiha", "anime": "Naruto", "type": "Ethereal Sword", "power": 990,
     "speed": 70, "hax": 100, "ability": "Sealing sword; anything pierced is sealed in eternal genjutsu",
     "weakness": "Slow; part of Susanoo", "lore": "The sacred sake jar sword of Susanoo, sealing anything it pierces."},

    # ==================== ADDITIONAL BLEACH ====================
    {"name": "Zabimaru", "owner": "Renji Abarai", "anime": "Bleach", "type": "Zanpakuto", "power": 850, "speed": 85,
     "hax": 65, "ability": "Segmented snake blade; Bankai: HiKōōgai", "weakness": "Standard limitations",
     "lore": "The baboon king blade of Renji, evolving with his growth."},
    {"name": "Suzumebachi", "owner": "Soi Fon", "anime": "Bleach", "type": "Zanpakuto", "power": 870, "speed": 95,
     "hax": 80, "ability": "Two-hit kill; poison stinger", "weakness": "Must hit same spot twice",
     "lore": "The hornet stinger of the Stealth Force Captain, deadly and precise."},
]


async def seed_weapons():
    logger.info("🗡️ Starting MEGA Weapons Database Seeding (90+ weapons)...")
    await neo4j_db.connect()

    # Create constraints
    await neo4j_db.execute_query("CREATE CONSTRAINT weapon_name IF NOT EXISTS FOR (w:Weapon) REQUIRE w.name IS UNIQUE")
    await neo4j_db.execute_query("CREATE CONSTRAINT anime_title IF NOT EXISTS FOR (a:Anime) REQUIRE a.title IS UNIQUE")

    count = 0
    failed = 0

    for weapon in ALL_WEAPONS:
        try:
            # Create Weapon node
            await neo4j_db.execute_query("""
                MERGE (w:Weapon {name: $name})
                SET w.owner = $owner,
                    w.anime = $anime,
                    w.type = $type,
                    w.power = $power,
                    w.speed = $speed,
                    w.hax = $hax,
                    w.ability = $ability,
                    w.weakness = $weakness,
                    w.lore = $lore
            """, weapon)

            # Create/Link Anime node
            await neo4j_db.execute_query("""
                MERGE (a:Anime {title: $anime})
                MERGE (w:Weapon {name: $name})
                MERGE (w)-[:FROM_ANIME]->(a)
            """, {"name": weapon["name"], "anime": weapon["anime"]})

            # Link to character if exists (fuzzy match)
            owner_first = weapon["owner"].split()[0]
            await neo4j_db.execute_query("""
                MATCH (w:Weapon {name: $name}), (c:Character)
                WHERE toLower(c.name) CONTAINS toLower($owner_first)
                MERGE (c)-[:WIELDS]->(w)
            """, {"name": weapon["name"], "owner_first": owner_first})

            count += 1
            logger.info(f"  ✅ {weapon['name']} ({weapon['anime']})")

        except Exception as e:
            failed += 1
            logger.error(f"  ❌ Failed: {weapon['name']}: {e}")

    logger.info(f"🎉 Seeding Complete! {count}/{len(ALL_WEAPONS)} weapons added ({failed} failed)")
    logger.info(f"📊 Total weapons in database: {count}")
    await neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(seed_weapons())