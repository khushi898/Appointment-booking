// Starter services for a private medical & dental clinic (prices in GBP).
// Used by `npm run seed:services`. Each entry follows the Service model rules:
// name 2–100 chars, description ≤ 500, durationMinutes 5–480 (whole number), price ≥ 0.
module.exports = [
  // ---------- Medical ----------
  {
    name: 'GP Consultation',
    description: 'Appointment with a private GP for new symptoms, ongoing concerns or a second opinion.',
    durationMinutes: 15,
    price: 79,
  },
  {
    name: 'Extended GP Consultation',
    description: 'A longer GP appointment for complex or multiple health concerns.',
    durationMinutes: 30,
    price: 129,
  },
  {
    name: 'Annual Health Check',
    description: 'Blood pressure, BMI, heart rate and routine blood tests, followed by a GP review of your results.',
    durationMinutes: 60,
    price: 249,
  },
  {
    name: 'Blood Test & Review',
    description: 'Blood sample taken by a nurse, with your results reviewed and explained by a GP.',
    durationMinutes: 20,
    price: 95,
  },
  {
    name: 'Travel Vaccination Consultation',
    description: 'Personalised travel health advice and a vaccine plan for your destination. Vaccines are charged separately.',
    durationMinutes: 20,
    price: 45,
  },
  {
    name: 'Flu Vaccination',
    description: 'Seasonal flu vaccine given by a practice nurse.',
    durationMinutes: 10,
    price: 20,
  },
  {
    name: 'Sexual Health Screening',
    description: 'Confidential testing for common sexually transmitted infections, with results and advice.',
    durationMinutes: 30,
    price: 150,
  },
  {
    name: "Women's Health Consultation",
    description: 'Advice and care for contraception, periods, menopause and other women’s health concerns.',
    durationMinutes: 30,
    price: 129,
  },
  {
    name: "Men's Health Check",
    description: 'Heart health check, prostate (PSA) blood test and lifestyle advice from a GP.',
    durationMinutes: 45,
    price: 199,
  },
  {
    name: 'Child Health Consultation',
    description: 'GP appointment for children under 16. A parent or guardian must attend.',
    durationMinutes: 20,
    price: 89,
  },
  {
    name: 'Minor Surgery Consultation',
    description: 'Assessment of moles, cysts or skin tags, with advice on removal options.',
    durationMinutes: 20,
    price: 95,
  },
  {
    name: 'ECG Heart Check',
    description: 'Electrocardiogram to record your heart’s rhythm and electrical activity, reviewed by a GP.',
    durationMinutes: 30,
    price: 120,
  },
  {
    name: 'Fit-to-Fly Certificate',
    description: 'Medical assessment and a signed certificate confirming you are fit to travel.',
    durationMinutes: 15,
    price: 65,
  },

  // ---------- Dental ----------
  {
    name: 'Dental Check-up',
    description: 'Examination of your teeth and gums, oral cancer screening and a personalised treatment plan.',
    durationMinutes: 30,
    price: 65,
  },
  {
    name: 'Scale & Polish',
    description: 'Hygienist clean to remove plaque and tartar and polish away surface stains.',
    durationMinutes: 30,
    price: 75,
  },
  {
    name: 'Dental X-rays',
    description: 'Digital X-rays to check for hidden decay, infection and bone health.',
    durationMinutes: 15,
    price: 40,
  },
  {
    name: 'White Filling',
    description: 'Tooth-coloured composite filling to repair decay or a small chip.',
    durationMinutes: 45,
    price: 150,
  },
  {
    name: 'Teeth Whitening Consultation',
    description: 'Assessment of your teeth and advice on the professional whitening options that suit you.',
    durationMinutes: 30,
    price: 50,
  },
  {
    name: 'Emergency Dental Appointment',
    description: 'Urgent appointment for toothache, swelling, a broken tooth or a lost filling.',
    durationMinutes: 30,
    price: 95,
  },
  {
    name: "Children's Dental Check-up",
    description: 'Gentle check-up for children under 16, with fluoride and brushing advice.',
    durationMinutes: 20,
    price: 35,
  },
];
