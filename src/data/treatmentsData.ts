export interface TreatmentItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  indications: string[];
  benefits: string[];
  duration: string;
  iconName: string;
  featured: boolean;
}

export const TREATMENTS: TreatmentItem[] = [
  {
    id: "general-consultation",
    slug: "general-dentistry-consultation",
    title: "General Dentistry & Comprehensive Consultation",
    category: "General Dentistry",
    shortDescription:
      "Thorough oral examinations, clinical diagnosis, and individualized preventive care planning.",
    fullDescription:
      "A complete dental examination is the foundation of lifelong oral health. During your visit, we evaluate your teeth, gums, jaw joints, and soft oral tissues using modern diagnostic illumination and gentle exploratory techniques. We discuss our findings openly with you before recommending any treatment plan.",
    indications: [
      "Routine biannual checkup",
      "Persistent oral discomfort or tooth sensitivity",
      "Bleeding or swollen gums",
      "Second opinion on recommended dental work",
    ],
    benefits: [
      "Early detection of micro-cavities before pain occurs",
      "Prevention of irreversible tooth and bone loss",
      "Personalized home oral hygiene guidance",
    ],
    duration: "30-45 mins",
    iconName: "Stethoscope",
    featured: true,
  },
  {
    id: "dental-cleaning-scaling",
    slug: "dental-cleaning-and-scaling",
    title: "Dental Cleaning & Ultrasonic Scaling",
    category: "Preventive Care",
    shortDescription:
      "Gentle ultrasonic removal of hardened tartar (calculus) and surface stains for fresh breath and healthy gums.",
    fullDescription:
      "Even with thorough daily brushing, bacterial plaque hardens over time into calculus that cannot be removed at home. Our clinic utilizes advanced ultrasonic scalers that gently vibrate tartar away without scratching tooth enamel, followed by fine polishing.",
    indications: [
      "Calculus/tartar buildup along the gumline",
      "Bad breath (halitosis) resistant to brushing",
      "Tobacco, coffee, or tea surface stains",
      "Bleeding when brushing or flossing",
    ],
    benefits: [
      "Reverses early gingivitis and gum inflammation",
      "Smooth, clean, and noticeably refreshed teeth",
      "Protects supporting jaw bone from periodontal breakdown",
    ],
    duration: "40-50 mins",
    iconName: "Sparkles",
    featured: true,
  },
  {
    id: "tooth-filling",
    slug: "composite-tooth-filling",
    title: "Tooth-Colored Composite Fillings",
    category: "Restorative Dentistry",
    shortDescription:
      "Biocompatible, tooth-shaded composite restorations to fix cavities and minor chipped teeth seamlessly.",
    fullDescription:
      "When decay affects a tooth, removing the bacteria and sealing the space promptly prevents deep nerve infection. We use modern composite resins matched exactly to your natural tooth enamel shade, bonding securely and restoring full chewing strength.",
    indications: [
      "Cavities detected during dental checkups",
      "Food getting persistently stuck between teeth",
      "Mild sensitivity to sweet or cold food",
      "Minor chipped or fractured biting edges",
    ],
    benefits: [
      "Matches natural tooth shade invisibly",
      "Conservative preparation preserving maximum natural tooth structure",
      "Direct bonding reinforces weakened tooth enamel",
    ],
    duration: "30-45 mins",
    iconName: "ShieldCheck",
    featured: true,
  },
  {
    id: "root-canal-treatment",
    slug: "root-canal-treatment",
    title: "Root Canal Treatment (RCT)",
    category: "Endodontics",
    shortDescription:
      "Pain-relieving therapy to eliminate deep infection inside the tooth pulp and save your natural tooth from extraction.",
    fullDescription:
      "Severe toothache usually occurs when bacterial decay penetrates deep into the pulp and nerve chamber. Root Canal Treatment carefully removes the infected pulp, cleans and shapes the root canals, sterilizes them, and hermetically seals the space to relieve pain and preserve the tooth permanently.",
    indications: [
      "Severe spontaneous toothache, especially at night",
      "Prolonged throbbing pain upon hot or cold exposure",
      "Swelling or tender pimple on the gum near a tooth",
      "Darkening/discoloration of a traumatized tooth",
    ],
    benefits: [
      "Immediate and lasting relief from acute dental pain",
      "Saves the natural tooth and prevents jawbone resorption",
      "Avoids the need for expensive tooth replacements or bridges",
    ],
    duration: "45-60 mins (1-2 sessions)",
    iconName: "Activity",
    featured: true,
  },
  {
    id: "crowns-and-bridges",
    slug: "dental-crowns-and-bridges",
    title: "Dental Crowns & Bridges",
    category: "Prosthodontics",
    shortDescription:
      "Custom-fitted ceramic, zirconia, and porcelain crowns to reinforce weakened teeth or bridge missing gaps.",
    fullDescription:
      "Following root canal therapy or extensive tooth fracture, a precision-engineered dental crown encases the tooth to withstand biting forces. Dental bridges provide a fixed, non-removable solution for missing teeth by anchoring to adjacent strong teeth.",
    indications: [
      "Teeth treated with root canal therapy needing reinforcement",
      "Heavily broken down or cracked teeth",
      "One or more missing teeth creating chewing difficulty",
      "Cosmetic enhancement of misshapen teeth",
    ],
    benefits: [
      "Restores natural biting and chewing efficiency",
      "Prevents adjacent teeth from drifting out of alignment",
      "High aesthetic match with adjacent natural teeth",
    ],
    duration: "2-3 appointments",
    iconName: "Award",
    featured: true,
  },
  {
    id: "tooth-extraction",
    slug: "tooth-extraction",
    title: "Gentle Tooth Extractions",
    category: "Oral Surgery",
    shortDescription:
      "Careful, minimally traumatic tooth extractions for unrestorable, severely infected, or impacted teeth.",
    fullDescription:
      "Our practice always prioritizes saving natural teeth. However, when a tooth is cracked beyond repair, severely mobile, or impacted, a gentle extraction performed under profound local anesthesia prevents spreading infection and prepares the area for replacement.",
    indications: [
      "Extensively damaged teeth beyond restorative repair",
      "Painful or impacted wisdom teeth causing infection",
      "Severe periodontal mobility with irrecoverable bone loss",
    ],
    benefits: [
      "Prompt elimination of persistent source of infection",
      "Comfortable procedure with modern local numbing techniques",
      "Clear post-operative care and replacement planning",
    ],
    duration: "30-45 mins",
    iconName: "Scissors",
    featured: false,
  },
  {
    id: "teeth-whitening",
    slug: "professional-teeth-whitening",
    title: "Professional Teeth Whitening",
    category: "Cosmetic Dentistry",
    shortDescription:
      "Safe, clinically supervised enamel brightening to lift stubborn stains and revive your smile's radiance.",
    fullDescription:
      "Daily consumption of tea, coffee, turmeric, and natural aging can cause enamel darkening. Supervised clinical whitening uses gentle oxygenating agents that break down deep enamel discoloration without harming your tooth structure or enamel integrity.",
    indications: [
      "Enamel discoloration and yellowing from food and beverages",
      "Upcoming special occasions, weddings, or professional milestones",
      "Desire for a brighter, more confident smile",
    ],
    benefits: [
      "Clinically controlled safety preventing gum irritation",
      "Noticeably brighter smile in a single session",
      "Safe on dental enamel with minimal temporary sensitivity",
    ],
    duration: "45-60 mins",
    iconName: "Sun",
    featured: true,
  },
  {
    id: "complete-partial-dentures",
    slug: "complete-and-partial-dentures",
    title: "Complete & Partial Dentures",
    category: "Prosthodontics",
    shortDescription:
      "Custom-molded full and partial removable dentures designed for stability, comfort, and natural aesthetics.",
    fullDescription:
      "For patients missing several or all natural teeth, modern dentures provide essential support for facial muscles, restore clear speech, and allow comfortable eating. We take precise anatomical impressions to create snug, lightweight, and natural-looking prosthetics.",
    indications: [
      "Multiple missing teeth in upper or lower jaws",
      "Loss of all natural teeth (edentulism)",
      "Sunken facial profile due to missing tooth support",
    ],
    benefits: [
      "Restores chewing ability and healthy nutritional intake",
      "Supports lips and cheeks for youthful facial contours",
      "Cost-effective full-arch tooth replacement",
    ],
    duration: "Multiple precision fittings",
    iconName: "HeartPulse",
    featured: false,
  },
  {
    id: "gum-care-periodontics",
    slug: "gum-care-and-periodontal-therapy",
    title: "Gum Care & Periodontal Therapy",
    category: "Periodontics",
    shortDescription:
      "Specialized deep cleaning (root planing) and periodontal treatment to heal infected, bleeding gums.",
    fullDescription:
      "Healthy gums are the foundation of your smile. Gum disease often progresses silently without severe pain until teeth become loose. Our periodontal treatments focus on debriding bacterial pockets beneath the gum line to stop infection and firm up supporting tissues.",
    indications: [
      "Bleeding while brushing or flossing",
      "Persistent bad breath or bad taste in the mouth",
      "Receding gum line exposing tooth roots",
      "Slight looseness or spacing developing between teeth",
    ],
    benefits: [
      "Halts the progression of destructive gum disease",
      "Eliminates chronic bacterial inflammation and gum bleeding",
      "Protects the jawbone anchoring your natural teeth",
    ],
    duration: "45 mins",
    iconName: "Heart",
    featured: false,
  },
  {
    id: "preventive-dental-care",
    slug: "preventive-dental-care",
    title: "Preventive Dental Care & Fluoride Therapy",
    category: "Preventive Care",
    shortDescription:
      "Topical fluoride applications, dental sealants, and personalized oral health plans for lifelong protection.",
    fullDescription:
      "Preventive dentistry aims to keep your teeth completely healthy and free from future decay. We apply protective fluoride varnish to strengthen enamel and pit-and-fissure sealants over deep grooves in back molars to block bacteria.",
    indications: [
      "High susceptibility to dental decay",
      "Sensitive exposed tooth roots",
      "Deep grooves on biting surfaces prone to food trapping",
    ],
    benefits: [
      "Strengthens enamel against acidic bacterial attacks",
      "Reduces or eliminates thermal hypersensitivity",
      "Saves significant time and costs on future restorations",
    ],
    duration: "30 mins",
    iconName: "Shield",
    featured: false,
  },
  {
    id: "children-dental-care",
    slug: "pediatric-children-dental-care",
    title: "Children's Dental Care (Pediatric)",
    category: "Pediatric Dentistry",
    shortDescription:
      "Gentle, patient, and friendly dental care for young children to establish positive lifelong dental habits.",
    fullDescription:
      "A child's first visits to the dental clinic set the tone for their relationship with healthcare. We maintain a friendly, calm demeanor, explaining things in simple, comforting terms. From milk tooth fillings to habit counseling, your child's comfort comes first.",
    indications: [
      "First dental visit around age 1 or after first tooth emerges",
      "Cavities in milk teeth (deciduous teeth)",
      "Thumb-sucking habit or tongue thrusting counseling",
      "Preventive fluoride applications for children",
    ],
    benefits: [
      "Prevents dental anxiety from forming at an early age",
      "Preserves milk teeth to guide permanent teeth into correct positions",
      "Educates parents on effective home brushing techniques",
    ],
    duration: "30 mins",
    iconName: "Smile",
    featured: false,
  },
  {
    id: "orthodontic-consultation",
    slug: "orthodontic-braces-aligner-consultation",
    title: "Orthodontic & Teeth Alignment Consultation",
    category: "Orthodontics",
    shortDescription:
      "Clinical evaluation of crooked teeth, spacing, and bite irregularities with treatment planning guidance.",
    fullDescription:
      "Misaligned teeth are not only an aesthetic concern but can also make cleaning difficult, leading to premature decay and jaw strain. We provide thorough orthodontic assessments to determine whether traditional braces or clear aligners are ideal for your smile.",
    indications: [
      "Crowded, overlapping, or crooked teeth",
      "Noticeable gaps or spacing between front teeth",
      "Overbite, underbite, or crossbite causing chewing strain",
    ],
    benefits: [
      "Improves smile aesthetics and self-confidence",
      "Makes brushing and flossing significantly easier",
      "Balances biting forces across all teeth evenly",
    ],
    duration: "45 mins",
    iconName: "SmilePlus",
    featured: false,
  },
];

export const TREATMENT_CATEGORIES = [
  "All",
  "General Dentistry",
  "Preventive Care",
  "Restorative Dentistry",
  "Endodontics",
  "Prosthodontics",
  "Cosmetic Dentistry",
  "Periodontics",
  "Pediatric Dentistry",
  "Orthodontics",
];
