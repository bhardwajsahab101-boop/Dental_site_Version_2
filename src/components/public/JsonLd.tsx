export default function JsonLd({ clinic, content }: { clinic: any; content?: any }) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const address = clinic?.address || "Anil Sharma Dental Hospital, (Exact Address on File)";
  const phone = clinic?.phone || "+91 (Contact Number Placeholder)";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinicName,
    alternateName: alternateName,
    description: content?.seo?.metaDescription || "Comprehensive dental clinic providing gentle, professional dental care.",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop",
    "@id": `${siteUrl}/#dentist`,
    url: siteUrl,
    telephone: phone,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.6139", // placeholder default coordinates
      longitude: "77.2090",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "14:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "17:00",
        closes: "20:30",
      },
    ],
    medicalSpecialty: "Dentistry",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Dental Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "MedicalProcedure",
            name: "Comprehensive Dental Checkup & Consultation",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "MedicalProcedure",
            name: "Root Canal Treatment",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "MedicalProcedure",
            name: "Dental Crowns & Bridges",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "MedicalProcedure",
            name: "Ultrasonic Teeth Scaling & Cleaning",
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
